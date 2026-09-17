import { createApp, h, ref } from 'vue'
import { ElConfigProvider, ElSelect, ElOption } from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw.mjs'
import 'element-plus/es/components/select/style/css'
import './select.css'

const instances = new Map()
function mountSelects() {
  for (const [select, entry] of instances) {
    if (!select.isConnected) { entry.app.unmount(); entry.host.remove(); instances.delete(select) }
  }
  document.querySelectorAll('.page .source-filter select, .page select.guide-select, .page .member-data-card select, .bo-modal select.guide-select').forEach(select => {
    if (instances.has(select)) return
    const options = [...select.options].map(option => ({ value: option.value, label: option.text, disabled: option.disabled }))
    const value = ref(select.value)
    const host = document.createElement('div')
    host.className = 'bo-select-host' + (select.classList.contains('status-control') ? ' bo-select-status' : '') + (select.classList.contains('page-size-select') ? ' bo-select-page-size' : '')
    select.after(host)
    select.hidden = true
    const app = createApp({ render: () => h(ElConfigProvider, { locale: zhTw, zIndex: 3000 }, {
      default: () => h(ElSelect, {
        modelValue: value.value,
        'onUpdate:modelValue': next => { value.value = next; select.value = next; select.dispatchEvent(new Event('change', { bubbles: true })) },
        teleported: !select.closest('dialog'), disabled: select.disabled, clearable: select.hasAttribute('data-clearable'),
        placeholder: '請選擇', popperClass: 'bo-select-popper',
        ariaLabel: select.getAttribute('aria-label') || select.closest('.filter-field, .input-spec')?.querySelector('label')?.textContent || (select.classList.contains('page-size-select') ? '每頁筆數' : '會員狀態'),
      }, { default: () => options.map(option => h(ElOption, { ...option, key: option.value })) })
    }) })
    instances.set(select, { host, app, sync: () => { value.value = select.value } })
    app.mount(host)
  })
}
window.syncSelects = () => { for (const entry of instances.values()) entry.sync() }
mountSelects()
new MutationObserver(mountSelects).observe(document.body, { childList: true, subtree: true })
