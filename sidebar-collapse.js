// 移植：不是 Element Plus 元件。正式後台已經有「收合側欄」這件事——`Header.vue`
// 最左邊那顆 `hamburger` 圖示呼叫 `useSidebarStore().toggle()`，`Side.vue` 的
// el-menu 收到 `:collapse` 之後縮成 `w-[72px]`，子選單由 EP 自己變成飛出面板
// （popper-offset／popper-effect／teleported 那幾個 prop 就是在講這件事）。
//
// 原型與它的差別：
//   1. 開關不在頁首，而是**側欄底部**（Ant Design 的 Layout.Sider 也是這個位置）。
//      在側欄裡，不碰內容區；在最底下，不跟導覽搶視線。而且帶文字與快捷鍵標示——
//      試過側欄右緣那種只有 hover 才顯形的細條（Linear、shadcn/ui 的 SidebarRail），
//      結論是沒有人會知道側欄可以收。
//   2. 收合後有子選單的項目在軌上標一個點，否則看不出哪一個點下去會飛出東西。
//   3. EP 的飛出面板是元件內建的，原型要自己做一份——而且**面板必須搬到 body**，
//      見下面 openFlyout 的註解。
//
// 市面上的做法與取捨整理在「導覽 Navigation」規範頁。
import { on } from './delegate.js'

const TOGGLE = '#navCollapse'

const app = () => document.querySelector('.app')
const button = () => document.querySelector(TOGGLE)
const isCollapsed = () => !!app()?.classList.contains('is-nav-collapsed')

// 飛出面板一次只開一個。面板本身是 body 底下的一個容器，開的時候把真正的
// .nav-children 節點搬進來，關的時候搬回原本的 .nav-tree。
let host = null
let openTree = null
let openTrigger = null

function flyoutHost() {
  if (!host) {
    host = document.createElement('div')
    host.className = 'nav-flyout'
    host.hidden = true
    document.body.append(host)
  }
  return host
}

function closeFlyout({ restoreFocus = false } = {}) {
  if (openTree) {
    const children = flyoutHost().firstElementChild
    // 搬回去。.nav-tree 裡只有「第一層項目 ＋ .nav-children」兩個孩子，
    // append 到最後就是原本的位置。
    if (children) openTree.append(children)
    openTree.classList.remove('is-flyout-open')
    openTrigger?.setAttribute('aria-expanded', 'false')
  }
  flyoutHost().hidden = true
  if (restoreFocus && openTrigger?.isConnected) openTrigger.focus()
  openTree = null
  openTrigger = null
}

function openFlyout(item) {
  const tree = item.closest('.nav-tree')
  const children = tree?.querySelector(':scope > .nav-children')
  const wasOpen = openTree === tree
  closeFlyout()
  if (!tree || !children || wasOpen) return

  // 面板**一定要搬到 body**，不能只是 position: fixed 留在側欄裡：
  // .sidebar .nav 身上有 mask-image（捲動提示的上下緣淡出），而 mask 會把所有
  // 後代裁進 .nav 自己的盒子——fixed 逃得出捲動容器，逃不出遮罩，面板會整個
  // 被切掉，畫面上的表現就是「點了沒反應」。EP 的 teleported 預設把第一層的
  // popper 送到 body，為的就是這件事。
  const panel = flyoutHost()
  panel.append(children)
  // 位置當場量：側欄會捲動，而且收合寬度是變數，寫死都會跑掉。
  const rect = item.getBoundingClientRect()
  const sidebar = item.closest('.sidebar').getBoundingClientRect()
  panel.style.setProperty('--flyout-top', `${Math.round(rect.top)}px`)
  panel.style.setProperty('--flyout-left', `${Math.round(sidebar.right + 4)}px`)
  panel.hidden = false
  tree.classList.add('is-flyout-open')
  item.setAttribute('aria-expanded', 'true')
  openTree = tree
  openTrigger = item
}

// 收合之後第二、三層在軌上看不到，所以第一層要代替子項顯示作用中——人在「第三層」
// 那一頁時，軌上只剩第一層的圖示能告訴他現在在哪裡。用的就是一般的 .active，
// 樣子與其他作用中項目完全一樣，不另外發明記號。展開時拿掉：那時子項自己看得見，
// 第一層再亮起來就變成兩個地方同時說「你在這裡」。
function syncBranchActive() {
  const collapsed = isCollapsed()
  document.querySelectorAll('.sidebar .nav-tree').forEach(tree => {
    const branch = tree.querySelector(':scope > .nav-item[data-toggle]')
    if (!branch) return
    // 子選單這時可能正被搬在飛出面板裡，兩邊都要找
    const scope = openTree === tree ? flyoutHost() : tree
    const hasActiveChild = !!scope.querySelector('.nav-children .nav-item.active')
    branch.classList.toggle('active', collapsed && hasActiveChild)
  })
}

export function setNavCollapsed(collapsed) {
  const root = app()
  const toggle = button()
  if (!root || !toggle) return
  closeFlyout()
  root.classList.toggle('is-nav-collapsed', collapsed)
  const label = collapsed ? '展開側欄' : '收合側欄'
  toggle.setAttribute('aria-expanded', String(!collapsed))
  // 它是純圖示按鈕，名稱與快捷鍵都只在 aria-label 與 Tooltip 上，兩邊文字要一致。
  toggle.setAttribute('aria-label', label)
  toggle.dataset.tooltip = `${label}（Ctrl + B）`
  // 側欄只剩圖示，每一項要靠 Tooltip 才知道是什麼——這也是「純圖示一定要同時有
  // aria-label 與同文字的 Tooltip」那條規則。展開時再拿掉，否則滑過去會跳一則
  // 和旁邊文字一模一樣的提示。
  document.querySelectorAll('.sidebar .nav .nav-item').forEach(item => {
    if (collapsed) {
      item.dataset.tooltip = item.textContent.trim()
      item.dataset.tooltipPlacement = 'right'
    } else {
      delete item.dataset.tooltip
      delete item.dataset.tooltipPlacement
    }
  })
  // 展開之後子選單回到側欄裡，aria-expanded 要跟著側欄的狀態走而不是停在
  // 飛出面板關掉時的 false。.expanded 由側欄原本的展開／收合邏輯維護。
  if (!collapsed) {
    document.querySelectorAll('.sidebar .nav-item[data-toggle]').forEach(item =>
      item.setAttribute('aria-expanded', String(item.classList.contains('expanded'))))
  }
  syncBranchActive()
}

// 這一支掛在 document 上，所以它跑的時候，項目自己的 onclick（換頁、換作用中項目）
// 已經跑完了——作用中的那一項是誰在這裡才算得準。
on('click', event => {
  const target = event.target
  if (!(target instanceof Element)) return

  if (target.closest(TOGGLE)) {
    setNavCollapsed(!isCollapsed())
    return
  }

  if (!isCollapsed()) {
    syncBranchActive()
    return
  }

  // 收合時點第一層：開飛出面板，而不是原地展開（原地展開在 72px 的軌上看不到字）
  const branch = target.closest('.sidebar .nav-item[data-toggle]')
  if (branch) {
    openFlyout(branch)
    syncBranchActive()
    return
  }

  // 面板裡的第二層是展開／收合用的，不是一個目的地——點它只該收合第三層，
  // 不該把整個面板關掉。選了真正的頁面（有 data-route-key）才關。
  if (target.closest('.nav-flyout .nav-item[data-toggle]')) return

  // 面板裡選了一項、或點到面板外面，都要收起來
  closeFlyout()
  // 面板裡選的那一項可能就是第三層——子選單搬回側欄之後才算得出第一層該不該亮
  syncBranchActive()
}, { owner: 'sidebar-collapse', claims: [TOGGLE, '.sidebar .nav-item[data-toggle]'] })

on('keydown', event => {
  if (event.key === 'Escape' && openTrigger) {
    closeFlyout({ restoreFocus: true })
    return
  }
  // role="button" 的 <div> 不會自己把 Enter / Space 變成 click，要自己接。
  if (event.key === 'Enter' || event.key === ' ') {
    const branch = event.target instanceof Element
      ? event.target.closest('.sidebar .nav-item[data-toggle]')
      : null
    if (branch) {
      event.preventDefault()
      branch.click()
    }
    return
  }
  if (event.key !== 'b' && event.key !== 'B') return
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
  // 正在打字就不要攔：Ctrl+B 在一般欄位裡沒有別的意思，但 contenteditable 的
  // 內容編輯器會拿它當粗體。
  if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable]')) return
  event.preventDefault()
  setNavCollapsed(!isCollapsed())
}, { owner: 'sidebar-collapse' })

// 側欄捲動或視窗改變時，開著的面板位置會跟著跑掉——直接關掉比追著算便宜，
// 也與 EP 的 popper 行為一致（捲動容器一動就重新定位或關閉）。
on('scroll', () => { if (openTree) closeFlyout() }, { owner: 'sidebar-collapse', capture: true })
window.addEventListener('resize', () => { if (openTree) closeFlyout() })

window.setNavCollapsed = setNavCollapsed
