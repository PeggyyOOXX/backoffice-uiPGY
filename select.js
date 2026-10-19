import { createApp, h, ref, computed } from 'vue'
import { ElConfigProvider, ElSelect, ElOption, ElOptionGroup } from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw.mjs'
import 'element-plus/es/components/select/style/css'
import './select.css'

// One shared Select. Every variant is declared on the native <select>, so pages keep
// writing plain markup and never mount Element Plus themselves:
//   multiple                 多選
//   data-collapse="2"        多選標籤收合數，超出顯示 +N（hover 列出完整清單）
//   data-max="3"             多選上限
//   data-select-all          下拉頂端加全選／清除（含部分選取）
//   data-filterable          可輸入搜尋
//   data-min-filter="2"      輸入達 N 個字才開始過濾
//   data-clearable           可清除
//   data-loading             讀取中
//   data-wrap                選項過長換行
//   <optgroup>               分組選項（分組標籤不可選）
const SELECTOR = '.page .source-filter select, .page select.guide-select, .bo-modal select.guide-select'

const instances = new Map()
const toOption = option => ({ value: option.value, label: option.text, disabled: option.disabled })
const positive = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// <optgroup> becomes a group node; a bare <option> stays flat. Order is kept as authored.
function readNodes(select) {
  const nodes = []
  for (const child of select.children) {
    if (child.tagName === 'OPTGROUP') {
      nodes.push({ kind: 'group', label: child.label, options: [...child.children].filter(node => node.tagName === 'OPTION').map(toOption) })
    } else if (child.tagName === 'OPTION') {
      // An empty <option value=""> only exists to keep the native select unselected,
      // so the placeholder shows; it is not a choice.
      if (!child.value && !child.text.trim()) continue
      nodes.push({ kind: 'option', ...toOption(child) })
    }
  }
  return nodes
}

const flatten = nodes => nodes.flatMap(node => (node.kind === 'group' ? node.options : [node]))

function mountSelects() {
  for (const [select, entry] of instances) {
    if (!select.isConnected) { entry.app.unmount(); entry.host.remove(); instances.delete(select) }
  }
  document.querySelectorAll(SELECTOR).forEach(select => {
    if (instances.has(select)) return
    const data = select.dataset
    const multiple = select.multiple
    const nodes = readNodes(select)
    const options = flatten(nodes)
    const selectable = options.filter(option => !option.disabled).map(option => option.value)

    const minFilter = positive(data.minFilter, 0)
    const filterable = 'filterable' in data || minFilter > 0
    const collapse = positive(data.collapse, 0)

    const value = ref(multiple ? [...select.selectedOptions].map(option => option.value) : select.value)
    const query = ref('')

    // Below the minimum length nothing is filtered yet, so the full list stays visible.
    const visible = computed(() => {
      const text = query.value.trim().toLowerCase()
      if (!filterable || !text || text.length < minFilter) return null
      return new Set(options.filter(option => option.label.toLowerCase().includes(text) || String(option.value).toLowerCase().includes(text)).map(option => option.value))
    })

    const write = next => {
      value.value = next
      if (multiple) {
        const picked = new Set(next ?? [])
        for (const option of select.options) option.selected = picked.has(option.value)
      } else {
        select.value = next ?? ''
      }
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }

    const picked = computed(() => (multiple ? value.value.filter(item => selectable.includes(item)).length : 0))

    const renderOption = option => h(ElOption, { key: option.value, value: option.value, label: option.label, disabled: option.disabled })
    const renderNodes = () => {
      const allowed = visible.value
      return nodes.flatMap(node => {
        if (node.kind !== 'group') return !allowed || allowed.has(node.value) ? [renderOption(node)] : []
        const kept = allowed ? node.options.filter(option => allowed.has(option.value)) : node.options
        return kept.length ? [h(ElOptionGroup, { key: `group:${node.label}`, label: node.label }, { default: () => kept.map(renderOption) })] : []
      })
    }

    // The header carries the select-all control and the "keep typing" hint.
    // It is only declared when one of them can appear, because Element Plus renders
    // the header frame whenever the slot exists.
    const hasHeader = (multiple && 'selectAll' in data && selectable.length > 0) || (filterable && minFilter > 0)
    const renderHeader = () => {
      const rows = []
      if (multiple && 'selectAll' in data && selectable.length) {
        rows.push(h('label', { key: 'all', class: 'choice-control bo-select-all' }, [
          h('input', {
            type: 'checkbox',
            checked: picked.value === selectable.length,
            indeterminate: picked.value > 0 && picked.value < selectable.length,
            onChange: event => write(event.target.checked ? [...selectable] : [])
          }),
          h('span', `全選（${selectable.length}）`)
        ]))
      }
      const typed = query.value.trim().length
      if (filterable && minFilter > 0 && typed > 0 && typed < minFilter) {
        rows.push(h('p', { key: 'hint', class: 'bo-select-hint' }, `再輸入 ${minFilter - typed} 個字開始搜尋`))
      }
      return rows.length ? rows : null
    }

    const host = document.createElement('div')
    host.className = 'bo-select-host'
      + (select.classList.contains('status-control') ? ' bo-select-status' : '')
      + (select.classList.contains('page-size-select') ? ' bo-select-page-size' : '')
      + (select.classList.contains('is-error') ? ' is-error' : '')
    select.after(host)
    select.hidden = true

    const app = createApp({
      render: () => h(ElConfigProvider, { locale: zhTw, zIndex: 3000 }, {
        default: () => h(ElSelect, {
          modelValue: value.value,
          'onUpdate:modelValue': write,
          multiple,
          multipleLimit: positive(data.max, 0),
          collapseTags: collapse > 0,
          collapseTagsTooltip: collapse > 0,
          maxCollapseTags: collapse || 1,
          filterable,
          filterMethod: filterable ? text => { query.value = text } : undefined,
          onVisibleChange: open => { if (!open) query.value = '' },
          loading: 'loading' in data,
          loadingText: '正在取得選項',
          noMatchText: '查無符合的選項',
          noDataText: '沒有可選項目',
          teleported: !select.closest('dialog'),
          disabled: select.disabled,
          clearable: 'clearable' in data,
          placeholder: data.placeholder || '請選擇',
          popperClass: 'bo-select-popper' + ('wrap' in data ? ' bo-select-wrap' : ''),
          ariaLabel: select.getAttribute('aria-label')
            || select.closest('.filter-field, .input-spec, .select-field')?.querySelector('label')?.textContent
            || (select.classList.contains('page-size-select') ? '每頁筆數' : '會員狀態'),
        }, hasHeader ? { default: renderNodes, header: renderHeader } : { default: renderNodes })
      })
    })
    instances.set(select, {
      host,
      app,
      sync: () => { value.value = multiple ? [...select.selectedOptions].map(option => option.value) : select.value }
    })
    app.mount(host)
  })
}
window.syncSelects = () => { for (const entry of instances.values()) entry.sync() }
mountSelects()
new MutationObserver(mountSelects).observe(document.body, { childList: true, subtree: true })
