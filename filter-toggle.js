// 手機版的篩選列開關。
//
// 720px 以下 `.source-filter` 是 display:none，要靠這顆按鈕加上 .mobile-open 才打得開
// （版面規則在 styles/mobile-wrapped-static-navigation-and-actions.css）。
// 先前只有會員列表與風控審核各自寫了一份，禮物卡、遊戲營收報表、遊戲列表三頁沒有，
// 結果那三頁在手機上篩選列整個消失、而且沒有任何入口打得開。
//
// 所以抽成一個：頁面只要有 .source-filter，就在它前面放 filterToggle(panelId)。
import { icon } from './icons.js'
import { onMatch } from './delegate.js'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * @param panelId 篩選列（.source-filter）的 id，用於 aria-controls
 * @param label   按鈕文案，預設「搜尋條件」
 */
export const filterToggle = (panelId, label = '搜尋條件') =>
  `<button class="mobile-member-search-toggle" type="button" data-filter-toggle="${esc(panelId)}"
    aria-expanded="false" aria-controls="${esc(panelId)}">
    <span>${icon('search')}${esc(label)}</span><span class="search-toggle-arrow" aria-hidden="true"></span>
  </button>`

onMatch('click', '[data-filter-toggle]', (event, button) => {
  const panel = document.getElementById(button.dataset.filterToggle)
  if (!panel) return
  const open = panel.classList.toggle('mobile-open')
  button.classList.toggle('is-open', open)
  button.setAttribute('aria-expanded', String(open))
}, { owner: 'filter-toggle' })
