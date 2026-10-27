// 移植：Header.vue（el-popover ＋ IconBtn ＋ el-select）。詳見 ELEMENT-PLUS-MAPPING.md
//
// 頁首右側那一排。這一支同時是元件與它的規範頁，理由同 nav-guide.js：
// 頁首不是一顆可以到處重用的元件，它是一個「只有一份」的版面位置，
// 規範講的幾乎都是「哪些東西可以放進來、放在第幾個位置」。
//
// 內容照正式後台 Header.vue 的實際畫面做，**不含被 `<!-- 暫時隱藏 -->` 包起來的那些**。
// 原型先前把那些註解掉的（銀行額度、存款限額、提款限額）當成規範畫了出來，
// 又自行加了搜尋與鈴鐺——兩者在正式後台都不存在，也沒有任何 API 回得出內容。
//
// 真正在跑的只有六個位置，由左到右：
//   下載中心 → 轉點審核待辦 → 存款審核待辦 → 語系 → 站台時區 → 帳號選單
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import { on, onMatch } from './delegate.js'
import './guide-page.css'
import './header.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 上限 99，超過顯示 99+。先前壓到 9+ 是因為角標蓋住圖示，但那是尺寸與位置的問題，
// 不該拿資訊量去換——「9+」在待審佇列上幾乎沒有意義，128 筆與 12 筆要分得出來。
// 解法改成把角標本身收小（14px 高、外推 4px、外圈 2px 底色環）並把相鄰按鈕的
// 間距拉回 8px，讓三個字元放得下。
const badgeText = count => (count > 99 ? '99+' : String(count))

// --- 待辦角標 -------------------------------------------------------------
//
// 正式後台這兩顆的數字來自 /api/v0/notifications 的 deposit.count 與 withdraw.count，
// 並由 WebSocket 私人頻道即時推播（收到還會播一段音效）。
// 顯示條件是三個 and：不是系統後台、使用者是 operator、而且有那一頁的 .read 權限——
// 沒權限就整顆不渲染，不是變灰，與側欄的規則一致。
const ALERTS = [
  { key: 'withdrawal', icon: 'withdrawal', label: '待審核轉點', count: 7, route: '組合範例審核' },
  { key: 'deposit', icon: 'deposit', label: '待審核存款', count: 128, route: '組合範例審核' },
]

const alertButton = ({ key, icon: name, label, count, route }) => `<div class="header-alert" data-tooltip="${esc(label)}">
  <button type="button" class="icon-btn" data-header-alert="${esc(route)}"
    aria-label="${esc(label)}${count ? `，${count} 筆` : ''}">
    ${icon(name, 20)}
    ${count ? `<span class="header-badge" aria-hidden="true">${badgeText(count)}</span>` : ''}
  </button>
</div>`

/** 頁首的待辦角標群組，接在下載中心之後。 */
export const headerAlerts = () => ALERTS.map(alertButton).join('')

// 角標是「直接去處理」，不是展開一張清單：清單還要再點一次才會到那一頁，
// 而且頁面上本來就有完整的篩選與排序，氣泡做不出第二套。
// 原型只收錄一頁審核型組合範例，兩顆都指向它；正式後台各自去自己的 view。
onMatch('click', '[data-header-alert]', (event, button) => {
  document.querySelector(`.nav-item[data-route-key="${button.dataset.headerAlert}"]`)?.click()
}, { owner: 'header' })

// --- 帳號選單 -------------------------------------------------------------
//
// 欄位照 /api/v0/profile 回的那六個，順序與正式後台一致：
// 帳號與姓名在上方自成一區，其餘四項是左標籤右值的定義列表。
const ACCOUNT = {
  account: 'bo_peggy',
  name: 'Peggy Pan',
  rows: [
    ['IP', '203.74.120.18'],
    ['幣別', 'TWD'],
    ['上次登入時間', '2026-10-27 09:12:44'],
    ['E-mail', 'peggy@example.com'],
  ],
}

const accountPanelBody = () => `<div class="header-account-id">
    <strong>${esc(ACCOUNT.account)}</strong>
    <span>${esc(ACCOUNT.name)}</span>
  </div>
  <dl>${ACCOUNT.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  <div class="header-account-actions">
    <button type="button" class="semantic-btn btn-edit">變更密碼</button>
    <button type="button" class="semantic-btn btn-neutral">登出</button>
  </div>`

/**
 * 頁首最右邊那一顆。觸發器是 user 圖示，不是頭像縮圖——後台沒有大頭貼這個欄位。
 *
 * 它刻意跟左邊三顆長得不一樣：那三顆是**動作**（有待辦就去處理、下載完了去拿檔案），
 * 這一顆是**身分**（我是誰、用什麼幣別看這些數字）。四顆都做成白底灰框的方鈕時，
 * 最右邊那顆會被讀成「第四個待辦」。所以身分鈕是圓的、填色、無框，前面還有一條分隔線。
 * 圓形是全網路公認的「這是人」符號，不必學也看得懂。
 */
export const headerAccount = () => `<span class="header-divider" aria-hidden="true"></span><div class="header-popover" data-popover-root>
  <button type="button" class="icon-btn is-identity" data-popover-toggle aria-expanded="false" aria-haspopup="dialog" aria-label="帳號資訊">${icon('user', 20)}</button>
  <div class="header-popover-panel is-account" role="dialog" aria-label="帳號資訊" hidden>${accountPanelBody()}</div>
</div>`

// --- 氣泡的開關 -----------------------------------------------------------
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
}, { owner: 'header' })

// 點外面與 Esc 都要關，而且焦點要回到觸發的那顆圖示鈕
on('click', event => {
  if (!event.target?.closest?.('[data-popover-root]')) closeAll()
}, { owner: 'header' })

on('keydown', event => {
  if (event.key !== 'Escape') return
  const open = document.querySelector('[data-popover-root] .header-popover-panel:not([hidden])')
  if (!open) return
  closeAll()
  open.closest('[data-popover-root]').querySelector('[data-popover-toggle]').focus()
}, { owner: 'header' })

// --- 規範頁 ---------------------------------------------------------------

// 示範用的那一條頁首：套的是真正的 .topbar / .icon-btn / .header-badge，
// 但不帶任何 data-* 掛勾，所以不會真的開面板、也不會換頁。
const stripDemo = () => `<div class="header-demo">
  <div class="topbar">
    <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('menu', 20)}</button>
    <div class="topbar-title">會員列表</div>
    <div class="top-actions">
      <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('download', 20)}<span class="header-badge is-task">2</span></button>
      <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('withdrawal', 20)}<span class="header-badge">7</span></button>
      <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('deposit', 20)}<span class="header-badge">99+</span></button>
      <select class="language" aria-hidden="true" tabindex="-1"><option>繁體中文</option></select>
      <span class="clock">GMT+8</span>
      <span class="header-divider" aria-hidden="true"></span>
      <button type="button" class="icon-btn is-identity" aria-hidden="true" tabindex="-1">${icon('user', 20)}</button>
    </div>
  </div>
  <ol class="header-demo-legend">
    <li><strong>下載中心</strong>唯一會展開面板的任務清單</li>
    <li><strong>轉點審核</strong>有待辦數就去處理</li>
    <li><strong>存款審核</strong>同上，各自一頁</li>
    <li><strong>語系</strong>原生 select，無框</li>
    <li><strong>站台時區</strong>唯讀文字</li>
    <li><strong>帳號</strong>身分與登出</li>
  </ol>
</div>`

const DECISION = [
  ['整個站台都要看得到，而且隨時會變', '<strong>放頁首</strong>', '待辦數、下載任務：使用者不知道什麼時候該回來看，所以要主動擺在眼前'],
  ['整個站台都要看得到，但不會變', '<strong>放頁首</strong>', '語系、時區、帳號：是「我現在是誰、用什麼看」的前提，每一頁的數字都靠它解讀'],
  ['只跟某一頁有關', '放那一頁的工具列', '搜尋、篩選、新增、匯出的按鈕都屬於資料所在的那一頁'],
  ['站台有哪些功能', '放側欄', '頁首沒有空間排第二份導覽，也不該有'],
  ['使用者已經開了哪些頁', '放工作區頁籤', '那是頁首下面獨立的一列，不是頁首的一部分'],
  ['一次性的操作結果', 'Toast', '頁首的東西是常駐的，會消失的訊息放進來只會被當成版面的一部分'],
]

window.renderHeaderPage = () => guidePage({
  slug: 'header',
  title: '頁首 Header',
  intro: '全站唯一一條、固定在捲動容器頂端的列。左側是側欄開關與目前頁名，右側是六個常駐位置。正式後台為 <code>Header.vue</code>；這一頁的內容只包含它<strong>實際在跑</strong>的部分，被 <code>&lt;!-- 暫時隱藏 --&gt;</code> 註解掉的不算規範。',
  sections: [
    {
      heading: '六個位置',
      body: `${stripDemo()}
        <p class="component-description">順序固定，由左到右：<strong>下載中心 → 轉點審核 → 存款審核 → 語系 → 站台時區 → 帳號</strong>。左邊兩個會變動、需要被看見，右邊三個是解讀整個畫面的前提，帳號永遠在最右。<strong>不得在中間插入新項目</strong>——位置會動的工具列，使用者每次都要重新找。</p>
        <p class="component-description">每一顆圖示鈕都是 34 × 34px 的 <code>.icon-btn</code>，圖示 20px，與全站其他按鈕同高。頁首不另設按鈕尺寸。</p>
        <p class="component-description"><strong>最右邊的帳號鈕是圓的，前面有一條分隔線。</strong>左邊三顆是<strong>動作</strong>——有待辦就去處理、下載完了去拿檔案；帳號是<strong>身分</strong>，是「我是誰、用什麼幣別看這些數字」。四顆都做成白底灰框的方鈕時，最右邊那顆會被讀成「第四個待辦」，使用者得先點開才知道它不是。圓形是全網路公認的「這是人」符號，不必學也看得懂；分隔線再把兩類東西斷開。<strong>整個頁首只有這一顆是圓的</strong>，所以圓形在這裡等於身分，不會跟別的東西混淆。</p>
        <p class="component-description"><strong>頁首不放搜尋，也不放鈴鐺。</strong>後台沒有跨頁的全域搜尋可搜——每一頁的搜尋條件都不一樣，而且都已經在那一頁的篩選列裡；鈴鐺則是把「待辦」再包一層：點開一張清單、再點一筆才進得去，比直接點角標多兩步。待辦就是待辦，用角標直接帶到那一頁。</p>`,
    },
    {
      heading: '待辦角標 Badge',
      body: `<div class="guide-stage header-badge-stage">
          <div class="header-alert"><button type="button" class="icon-btn" aria-label="待審核轉點，7 筆">${icon('withdrawal', 20)}<span class="header-badge" aria-hidden="true">7</span></button></div>
          <div class="header-alert"><button type="button" class="icon-btn" aria-label="待審核存款，128 筆">${icon('deposit', 20)}<span class="header-badge" aria-hidden="true">99+</span></button></div>
          <div class="header-alert"><button type="button" class="icon-btn" aria-label="下載中心，2 個任務處理中">${icon('download', 20)}<span class="header-badge is-task" aria-hidden="true">2</span></button></div>
          <div class="header-alert"><button type="button" class="icon-btn" aria-label="待審核轉點">${icon('withdrawal', 20)}</button></div>
        </div>
        <p class="component-description">兩種顏色、一種形狀：<strong>紅色（--danger）是待辦</strong>，有人在等你處理；<strong>橘色（--warning）是進行中</strong>，系統自己會跑完。沒有第三種顏色——角標不是標籤，不承擔狀態分類。</p>
        <p class="component-description">角標是 <strong>14px 見方、往外推到 -4px、外圈帶 2px 底色環</strong>的一小塊，相鄰按鈕的間距是 8px。那圈環是關鍵：34px 的按鈕上，三個字元的角標一定會碰到圖示的邊角，有了環，圖示才讀得出來是被壓在下面的另一層，而不是跟角標糊成一團——GitHub、Gmail、Element Plus 都是這樣處理。</p>
        <p class="component-description"><strong>數字超過 99 就顯示 <code>99+</code></strong>。不壓到 9+：待審佇列裡 128 筆與 12 筆要分得出來，那會影響「現在要不要放下手邊的事去處理」。角標蓋住圖示是尺寸與位置的問題，用高度、外推與間距解決，不拿資訊量去換。<strong>數字是 0 就整顆角標不渲染</strong>，不要畫一個 0。</p>
        <p class="component-description">字級<strong>不能再小</strong>：全站字級最小 12px（見「設計 Token → 字級」），那是 9 個語系共用的可讀性下限，角標不是例外。位置也已經推到 4px 格線允許的最外緣——再往外會超出手機 46px 的 topbar 上緣，被視窗裁掉。</p>
        <p class="component-description">點下去<strong>直接到那一頁</strong>，不展開清單。清單要再點一次才進得去，而且那一頁本來就有完整的篩選與排序，氣泡做不出第二套。數字由輪詢或推播更新，不需要使用者重新整理。</p>
        <p class="component-description">圖示用<strong>圓框＋大箭頭</strong>（<code>circle-arrow-down</code>／<code>circle-arrow-up</code>），也就是交易所與金流後台講「入金／出金」的通用寫法。退掉的兩組都在同一個問題上：裸箭頭與左邊的匯出（<code>download</code>）在 20px 下是同一個圖；鈔票加箭頭的那組，方向箭頭只佔 24 單位裡的 6 單位，縮到 20px 只剩 5px，兩顆反而會變成同一個圖。圓框箭頭只有三個節點、全部佔滿 24 單位，16px 也銳利，輪廓與托盤形的匯出完全不同。</p>
        <p class="component-description"><strong>沒有檢視權限就整顆不渲染</strong>，不是變灰——與側欄同一條規則。正式後台這兩顆的條件是「非系統後台 ＋ 是 operator ＋ 有該頁 <code>.read</code> 權限」。</p>`,
    },
    {
      heading: '帳號選單',
      body: `<div class="guide-stage header-account-stage">
          <div class="header-popover-panel is-account" role="group" aria-label="帳號資訊示範">${accountPanelBody()}</div>
        </div>
        <p class="component-description">六個欄位，全部唯讀，照 <code>/api/v0/profile</code> 回的順序：<strong>帳號、姓名</strong>（上方自成一區，是「我是誰」）、<strong>IP、幣別、上次登入時間、E-mail</strong>（左標籤右值的定義列表）。幣別決定整個後台的金額怎麼讀，所以它屬於這裡，不是設定頁。</p>
        <p class="component-description">底部兩顆按鈕沿用語意按鈕：變更密碼 <code>btn-edit</code>、登出 <code>btn-neutral</code>，靠右排列。這裡<strong>只放這兩個</strong>——個人偏好、主題、時區切換都不屬於帳號選單，那是設定頁的事。</p>
        <p class="component-description">觸發器是 <code>user</code> 圖示，不是頭像縮圖：後台沒有大頭貼欄位，用姓名縮寫拼一個出來只會讓人以為可以換。</p>
        <div class="guide-stage header-identity-stage">
          <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('withdrawal', 20)}</button>
          <button type="button" class="icon-btn" aria-hidden="true" tabindex="-1">${icon('deposit', 20)}</button>
          <span class="header-divider" aria-hidden="true"></span>
          <button type="button" class="icon-btn is-identity" aria-hidden="true" tabindex="-1">${icon('user', 20)}</button>
        </div>
        <p class="component-description">觸發器本身是 <code>.icon-btn.is-identity</code>：同樣 34 × 34px，但<strong>圓形、<code>--blue</code> 實心填色、無框線、白色圖示</strong>，hover 轉 <code>--blue-ink</code>。底色試過的另外兩個方向都不對：<code>--blue-tint</code> 在白色 topbar 上只有 1.1:1，整顆被背景吃掉；<code>--sidebar</code> 看得見但在一條白底的列上太重，整個頁首的視覺重心會被拉到最右邊那一個點上。<code>--blue</code> 落在中間，白字對比 3.0:1，過 WCAG 非文字元素的 3:1 下限，而且它是品牌色，用在「我」身上讀起來是歸屬而不是警示。這是<strong>全站唯一一個不吃 4px 圓角的按鈕</strong>，例外寫在 <code>styles/button-corner-radius.css</code> 裡並具名——不得把它當成「頁首可以自己決定圓角」的先例，其餘五個位置仍是 4px。</p>`,
    },
    {
      heading: '下載中心',
      body: `<p class="component-description">頁首唯一會展開面板的位置，寬 340px。匯出不是當下給檔案，而是建立一個下載任務，由這裡每 3 秒輪詢一次，完成才拿得到檔案——所以<strong>按下匯出的當下不得回報「已匯出」</strong>，那時候檔案還不存在。</p>
        <p class="component-description">頁面要匯出就呼叫 <code>requestExport()</code>，不得自己做下載 UI。面板裡的進度條、狀態標籤、取消鈕、空狀態全部是共用元件，這裡不重畫也不調色。還有任務在跑時角標顯示未完成數（橘色），全部跑完就停止輪詢。</p>`,
    },
    {
      heading: '語系與站台時區',
      body: `<p class="component-description">語系是一個無框的原生 <code>&lt;select&gt;</code>，選項帶國旗圖；清單來自站台設定的 <code>localeList</code>，不是寫死的三種。切換只改顯示語言，不重新整理頁面。</p>
        <p class="component-description">站台時區是<strong>唯讀文字</strong>，不是下拉。它說的是「畫面上所有時間是用哪個時區換算的」——那是站台的設定，不是使用者的偏好；做成可切換的下拉，等於讓每個人看到的報表數字都不一樣，對帳時沒有人說得準誰是對的。正式後台的可切換時區下拉已經被註解掉，就是這個原因。</p>
        <p class="component-description">頁首<strong>不放會跳秒的時鐘</strong>。它每秒重繪一次，卻沒有任何決定是靠它做的；要知道現在幾點，作業系統的工具列就在旁邊。時區標示留著是因為它會改變<strong>別的數字</strong>的意思。</p>`,
    },
    { heading: '什麼該放進頁首', body: decisionTable(DECISION) },
  ],
  tokens: [
    ['頁首高度', '52px（桌機）／46px（手機）'],
    ['左右內距', '28px（桌機）／12px（手機）'],
    ['項目間距', '8px'],
    ['圖示鈕', '34 × 34px，圖示 20px'],
    ['身分鈕', '34 × 34px 圓形，--blue 底／白色圖示，無框'],
    ['身分鈕 Hover', '--blue-ink'],
    ['分隔線', '1px var(--line)，高 20px，左右各 4px'],
    ['角標尺寸', '14px 見方（單一數字為圓形），圓角 8px'],
    ['角標位置', 'top: -4px / right: -4px'],
    ['角標外環', '2px var(--card)'],
    ['角標字級', '12px / 700'],
    ['待辦角標底色', 'var(--danger)'],
    ['進行中角標底色', 'var(--warning)'],
    ['角標上限', '99，超過顯示 99+'],
    ['面板寬度', '下載中心 340px／帳號 240px'],
    ['面板位置', '桌機 top: 100% + 4px 靠右；手機固定置中'],
    ['面板圓角', '8px'],
    ['時區文字', '12px / var(--text-muted)'],
    ['右側位置數', '6（固定順序，不得插入）'],
  ],
  rules: [
    ['只放全站共通且常駐的東西', '跟單一頁面有關的搜尋、篩選、新增、匯出都屬於那一頁的工具列。頁首沒有第二份導覽。'],
    ['順序固定', '六個位置不得調換也不得插入。位置會動的工具列，使用者每次都要重新找。'],
    ['不放搜尋、不放鈴鐺', '後台沒有跨頁可搜的東西；鈴鐺是把待辦再包一層，比直接點角標多兩步。'],
    ['不放跳秒時鐘', '每秒重繪一次，卻沒有任何決定靠它做。時區標示留著，因為它改變別的數字的意思。'],
    ['角標只有兩種顏色', '紅＝有人在等你處理，橘＝系統自己會跑完。0 筆不渲染，超過 99 顯示 99+。'],
    ['角標不靠縮字解決遮擋', '字級最小 12px 是全站級距的下限，角標不是例外。蓋住圖示要用高度、外推與相鄰間距解決，底色環負責把兩層分開。'],
    ['角標直接到那一頁', '不展開清單。那一頁本來就有完整的篩選與排序，氣泡做不出第二套。'],
    ['沒權限就不渲染', '不是變灰——與側欄同一條規則。看得到卻點不了只會讓人一直問為什麼。'],
    ['時區是唯讀的', '那是站台設定，不是個人偏好。做成可切換，每個人看到的報表就不一樣。'],
    ['帳號選單只放身分與兩顆按鈕', '偏好、主題、時區都屬於設定頁。觸發器用 user 圖示，不是拼出來的頭像。'],
    ['身分鈕是圓的，動作鈕是方的', '左邊三顆是動作，帳號是身分。全長得一樣時，最右邊那顆會被讀成第四個待辦。整個頁首只有這一顆是圓的。'],
    ['圓角例外只有這一條', '身分鈕不吃 4px 圓角，例外具名寫在 styles/button-corner-radius.css。不得拿它當「頁首可以自己決定圓角」的先例。'],
    ['不得為頁首另設按鈕尺寸', '圖示鈕沿用全站的 34px，圖示 20px，與輸入框、分頁、表格操作鈕同高。身分鈕只換形狀與配色，尺寸不變。'],
  ],
})
