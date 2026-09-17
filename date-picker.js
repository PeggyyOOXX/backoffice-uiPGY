import { createApp, h, ref } from 'vue'
import { ElConfigProvider, ElDatePicker } from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw.mjs'
import 'element-plus/es/components/date-picker/style/css'
import './date-picker.css'

const mounted = new Map()
const initial = () => [new Date(2026, 8, 15, 0, 0, 0), new Date(2026, 8, 15, 23, 59, 59)]
const pad = n => String(n).padStart(2, '0')
const serialize = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
function preset(kind) {
  const start = new Date(), end = new Date()
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 0)
  if (kind === 'week') {
    start.setDate(start.getDate() - (start.getDay()+6)%7)
    end.setFullYear(start.getFullYear(), start.getMonth(), start.getDate()+6)
  }
  if (kind === 'month') {
    start.setDate(1)
    end.setMonth(end.getMonth()+1, 0)
  }
  return [start, end]
}
const shortcuts = [
  { text: '本日', value: () => preset('day') },
  { text: '本週', value: () => preset('week') },
  { text: '本月', value: () => preset('month') },
]
function mountPickers() {
  for (const [host, entry] of mounted) {
    if (!host.isConnected) { entry.app.unmount(); mounted.delete(host) }
  }
  document.querySelectorAll('[data-date-range]').forEach(host => {
    if (mounted.has(host)) return
    const parse=value=>value ? new Date(value.replace(' ', 'T')) : null
    const start=parse(host.dataset.start),end=parse(host.dataset.end)
    const value = ref(start && end ? [start,end] : host.hasAttribute('data-empty') ? null : initial())
    const modal=host.closest('dialog')
    const update = next => {
      value.value = next
      host.dataset.start = next?.[0] ? serialize(next[0]) : ''
      host.dataset.end = next?.[1] ? serialize(next[1]) : ''
      host.title = next?.length ? `${serialize(next[0])} ～ ${serialize(next[1])}` : ''
    }
    const app = createApp({ render: () => h(ElConfigProvider, { locale: zhTw, zIndex: 3000 }, {
      default: () => h(ElDatePicker, {
        modelValue: value.value, 'onUpdate:modelValue': update,
        appendTo: modal || undefined, type: 'datetimerange', format: host.dataset.dateFormat || 'YYYY/MM/DD',
        disabledDate: host.hasAttribute('data-past-year') ? date => {
          const end = new Date(); end.setHours(23,59,59,999)
          const start = new Date(); start.setFullYear(start.getFullYear()-1); start.setHours(0,0,0,0)
          return date < start || date > end
        } : undefined,
        dateFormat: 'YYYY/MM/DD', timeFormat: 'HH:mm:ss',
        rangeSeparator: '～', startPlaceholder: '開始日期', endPlaceholder: '結束日期',
        shortcuts, clearable: true, editable: false, unlinkPanels: true,
        defaultTime: [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)],
        popperClass: 'bo-date-range-popper', class: 'bo-date-range',
      })
    }) })
    mounted.set(host, { app, reset: () => update(initial()) })
    app.mount(host)
    update(value.value)
  })
}
window.resetDateRanges = container => {
  for (const [host, entry] of mounted) if (container?.contains(host)) entry.reset()
}
mountPickers()
new MutationObserver(mountPickers).observe(document.body, { childList: true, subtree: true })
