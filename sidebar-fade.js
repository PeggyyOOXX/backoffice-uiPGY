// 移植：不是 Element Plus 元件。正式後台 Side.vue 的捲動容器掛同樣兩個 class 即可，樣式照
// styles/fixed-sidebar-independent-content-scroll.css。
//
// 側欄上下緣的淡出只在「那一側還有內容」時才畫：
//   .can-scroll-up    上面還有（已經往下捲過）
//   .can-scroll-down  下面還有（還沒捲到底）
// 捲到底下緣就不淡出、在最上面上緣就不淡出。桌機側欄與手機抽屜是同一個 .nav，同一套邏輯。
import { on } from './delegate.js'

const SELECTOR = '.sidebar .nav'

function update(nav) {
  const max = nav.scrollHeight - nav.clientHeight
  // 留 1px 容差：縮放比例不是 100% 時 scrollTop 會是小數，捲到底也可能差零點幾
  nav.classList.toggle('can-scroll-up', nav.scrollTop > 1)
  nav.classList.toggle('can-scroll-down', nav.scrollTop < max - 1)
}

// scroll 不會冒泡，用捕獲階段在 document 上一次收全部
on('scroll', event => {
  if (event.target instanceof Element && event.target.matches(SELECTOR)) update(event.target)
}, { owner: 'sidebar-fade', capture: true })

// 不捲動也會改變「還有沒有內容」的情況：視窗高度變了、手機抽屜打開、
// 三層選單展開或收合、換語系後項目變兩行。
document.querySelectorAll(SELECTOR).forEach(nav => {
  update(nav)
  new ResizeObserver(() => update(nav)).observe(nav)
  new MutationObserver(() => update(nav)).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] })
})
