import { createApp, h, ref } from 'vue'
import { ElConfigProvider, ElDatePicker } from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw.mjs'
import 'element-plus/es/components/date-picker/style/css'
import './date-picker.css'

const mounted = new Map()
const initial = () => [new Date(2026, 8, 15, 0, 0, 0), new Date(2026, 8, 15, 23, 59, 59)]
const pad = n => String(n).padStart(2, '0')
const serialize = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
// 快捷區間：照正式後台會員列表的那一組（今天／昨天／前天／本週／上週／本月／上月）。
// 原型先前只有三個，實際頁面上最常按的「昨天」與「上月」反而沒有。
const startOf = date => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d }
const endOf = date => { const d = new Date(date); d.setHours(23, 59, 59, 0); return d }
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d }
// 週一為一週的開始，與正式後台一致
const mondayOf = date => addDays(date, -((date.getDay() + 6) % 7))

const PRESETS = {
  today: () => [startOf(new Date()), endOf(new Date())],
  yesterday: () => { const d = addDays(new Date(), -1); return [startOf(d), endOf(d)] },
  dayBefore: () => { const d = addDays(new Date(), -2); return [startOf(d), endOf(d)] },
  thisWeek: () => { const from = mondayOf(new Date()); return [startOf(from), endOf(addDays(from, 6))] },
  lastWeek: () => { const from = addDays(mondayOf(new Date()), -7); return [startOf(from), endOf(addDays(from, 6))] },
  thisMonth: () => {
    const now = new Date()
    return [startOf(new Date(now.getFullYear(), now.getMonth(), 1)), endOf(new Date(now.getFullYear(), now.getMonth() + 1, 0))]
  },
  lastMonth: () => {
    const now = new Date()
    return [startOf(new Date(now.getFullYear(), now.getMonth() - 1, 1)), endOf(new Date(now.getFullYear(), now.getMonth(), 0))]
  },
}

const shortcuts = [
  { text: '今天', value: PRESETS.today },
  { text: '昨天', value: PRESETS.yesterday },
  { text: '前天', value: PRESETS.dayBefore },
  { text: '本週', value: PRESETS.thisWeek },
  { text: '上週', value: PRESETS.lastWeek },
  { text: '本月', value: PRESETS.thisMonth },
  { text: '上月', value: PRESETS.lastMonth },
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
    // 區間上限：正式後台 28 個 view 透過 useSearchDateRange(n) 限制查詢天數
    //（報表的後端一次只算得動這麼多天）。限制要在日曆上就擋住，不是等按下搜尋才報錯，
    // 所以記住第一次點的那一天，再把超出範圍的日子畫成停用。
    const maxDays = Number(host.dataset.maxDays) > 0 ? Number(host.dataset.maxDays) : 0
    const picking = ref(null)
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
        onCalendarChange: dates => { picking.value = dates?.[0] && !dates?.[1] ? dates[0] : null },
        disabledDate: host.hasAttribute('data-past-year') || maxDays ? date => {
          if (host.hasAttribute('data-past-year')) {
            const end = new Date(); end.setHours(23,59,59,999)
            const start = new Date(); start.setFullYear(start.getFullYear()-1); start.setHours(0,0,0,0)
            if (date < start || date > end) return true
          }
          // 只有在已經選了起日、還沒選迄日的時候才收斂範圍；兩端都選好之後要讓人能重選。
          if (maxDays && picking.value) {
            const span = Math.abs(date - picking.value) / 86400000
            if (span > maxDays - 1) return true
          }
          return false
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
