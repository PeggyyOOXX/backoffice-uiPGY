// 移植：el-popover（正式後台 Header.vue 有 15 處）。詳見 ELEMENT-PLUS-MAPPING.md
//
// 這是 Header 的「資訊氣泡」：點圖示展開一小塊唯讀資訊（額度、限額之類）。
// 它不是 Tooltip（那是 hover 的補充說明、不能放操作），也不是 Dropdown
// （那是收動作的選單，正式後台根本沒有）。這裡只做 Header 用到的這一種。
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './header-popover.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 對應 Header.vue 的幾顆：銀行額度、存款限額、提款限額、優惠
const PANELS = {
  bank: ['銀行帳戶額度', [['可用額度', '$1,284,000'], ['今日已用', '$216,000'], ['帳戶數', '4 個']]],
  depositLimits: ['存款限額', [['單筆上限', '$50,000'], ['單日上限', '$500,000'], ['今日已用', '$162,400']]],
  withdrawal: ['提款限額', [['單筆上限', '$100,000'], ['單日上限', '$800,000'], ['今日已用', '$608,000']]],
}

export const headerPopover = (key, iconName, label) => {
  const [title, rows] = PANELS[key]
  return `<div class="header-popover" data-popover-root>
    <button type="button" class="icon-btn" data-popover-toggle aria-expanded="false" aria-haspopup="dialog" aria-label="${esc(label)}">${icon(iconName, 20)}</button>
    <div class="header-popover-panel" role="dialog" aria-label="${esc(title)}" hidden>
      <strong>${esc(title)}</strong>
      <dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </div>
  </div>`
}

/** Header 右側那一組資訊氣泡，插在時鐘之前。 */
export const headerPopovers = () => [
  headerPopover('bank', 'bank', '銀行帳戶額度'),
  headerPopover('depositLimits', 'deposit', '存款限額'),
  headerPopover('withdrawal', 'withdrawal', '提款限額'),
].join('')

const closeAll = except => {
  document.querySelectorAll('[data-popover-root]').forEach(root => {
    if (root === except) return
    root.querySelector('.header-popover-panel').hidden = true
    root.querySelector('[data-popover-toggle]').setAttribute('aria-expanded', 'false')
  })
}

onMatch('click', '[data-popover-toggle]', (event, button) => {
  const root = button.closest('[data-popover-root]')
  const panel = root.querySelector('.header-popover-panel')
  const open = panel.hidden
  closeAll(root)
  panel.hidden = !open
  button.setAttribute('aria-expanded', String(open))
}, { owner: 'header-popover' })

// 點外面與 Esc 都要關，而且焦點要回到觸發的那顆圖示鈕
onMatch('click', 'body', event => {
  if (!event.target.closest('[data-popover-root]')) closeAll()
}, { owner: 'header-popover' })

onMatch('keydown', 'body', event => {
  if (event.key !== 'Escape') return
  const open = document.querySelector('[data-popover-root] .header-popover-panel:not([hidden])')
  if (!open) return
  closeAll()
  open.closest('[data-popover-root]').querySelector('[data-popover-toggle]').focus()
}, { owner: 'header-popover' })

window.headerPopovers = headerPopovers
