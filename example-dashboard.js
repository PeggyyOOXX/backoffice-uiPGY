// 組合範例（統計卡型）：照正式後台的首頁（`dashboard.vue`）做。
//
// 選這一頁的理由：它是登入後第一個看到的畫面，而且是全站唯一「沒有表格」的頁——
// 八個數字、一個站台切換，其他什麼都沒有。先前原型沒有這一型，統計卡只出現在
// 已經刪掉的舊「頁面示範」裡，那一份自己帶一套 .stat／.stat-icon 樣式與寫死的色碼。
//
// 這一型特有的東西：
//   1. 版面只有一組卡片，直接套全站的 12 欄格線（guide-page.css 的 .guide-fields），
//      不另外排一套——手機 1 欄、768 起 2 欄、992 起 3 欄、1200 起 4 欄、1920 起 6 欄。
//   2. 數值呈現：千分位、tabular-nums；統計卡是彩色底，數字不分正負一律一般文字色。
//   3. 重新查詢時舊數字留在原地變淡（loadingWrap 的遮罩），不換成骨架。
import { message } from './message.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import { filterToggle } from './filter-toggle.js'
import { loadingWrap } from './states.js'
import './example-page.css'
import './example-dashboard.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 站台清單與「表單頁」範例用的是同一組，整個原型只有這三個站台。
const BRANCHES = ['101 BEST', 'DEMO03', 'VIP CLUB']
const DEFAULT_BRANCH = BRANCHES[0]

const STATE = { branch: DEFAULT_BRANCH, loading: false }

// 固定亂數：儀表板每按一次重新整理就重畫一次，數字如果每次都不同，
// 看的人會以為是後端在跳動。同一個站台永遠得到同一組數字。
const seeded = (seed, min, max) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return Math.round(min + (x - Math.floor(x)) * (max - min))
}

// 金額照正式後台的 formatAmount：固定兩位小數、千分位。
const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const people = n => Number(n).toLocaleString('en-US')

// 八張卡、順序與 dashboard.vue 的 el-col 一字不差。
// icon 是卡片右側的裝飾大圖示，tone 對應 --kpi-* 的卡片色；signed 的兩張是輸贏，數字可能是負的。
const METRICS = [
  { key: 'todayValidBetAmount', icon: 'bet', tone: 'gold', label: '今日總有效投注額', kind: 'amount', range: [8_000_000, 24_000_000] },
  { key: 'todayDepositPlayers', icon: 'members', tone: 'blue', label: '今日存款玩家數', kind: 'people', range: [320, 1_800] },
  { key: 'todayDepositAmount', icon: 'finance', tone: 'green', label: '今日總存款金額', kind: 'amount', range: [1_200_000, 6_400_000] },
  { key: 'todayFirstDeposit', icon: 'star', tone: 'amber', label: '今日首存玩家數', kind: 'people', range: [18, 240] },
  { key: 'todayProfitLoss', icon: 'trend', tone: 'purple', label: '今日總輸贏', kind: 'amount', signed: true, range: [-1_800_000, 1_400_000] },
  { key: 'totalPlayers', icon: 'personalCenter', tone: 'slate', label: '總玩家數', kind: 'people', range: [24_000, 186_000] },
  { key: 'todayRegisterPlayers', icon: 'user', tone: 'teal', label: '今日註冊玩家數', kind: 'people', range: [42, 620] },
  { key: 'monthProfitLoss', icon: 'gameProvider', tone: 'rose', label: '本月遊戲總輸贏', kind: 'amount', signed: true, range: [-12_000_000, 9_600_000] },
]

const dataset = branch => {
  const offset = BRANCHES.indexOf(branch) + 1
  return METRICS.map((metric, index) => ({
    ...metric,
    value: seeded(index * 7 + offset * 23, metric.range[0], metric.range[1]),
  }))
}

const cell = metric => {
  const text = metric.kind === 'amount'
    ? `${metric.value < 0 ? '-' : ''}$${money(Math.abs(metric.value))}`
    : people(metric.value)
  // 卡片是彩色底，數字不分正負一律一般文字色，正負只靠負號（規範見 AGENTS.md「數值呈現」）。
  return `<article class="example-kpi" style="--kpi: var(--kpi-${metric.tone})">
    <span class="example-kpi-art" aria-hidden="true">
      <span class="example-kpi-glow"></span><span class="example-kpi-ring-lg"></span><span class="example-kpi-ring"></span>
      <span class="example-kpi-dot is-a"></span><span class="example-kpi-dot is-b"></span><span class="example-kpi-dot is-c"></span>
      ${icon(metric.icon, 88)}
    </span>
    <h3 class="example-kpi-title">${esc(metric.label)}</h3>
    <p class="example-kpi-value">${esc(text)}</p>
  </article>`
}

// 卡片格線直接套 .guide-fields，不在這一頁另外宣告欄數——
// 格線只有一個來源（guide-page.css），頁面、彈窗、規範頁示範都吃同一份。
const cards = () => loadingWrap(
  `<div class="guide-fields example-kpi-grid">${dataset(STATE.branch).map(cell).join('')}</div>`,
  { loading: STATE.loading, text: '更新中' },
)

// 篩選列只有一格（站台），但該有的還是要有：標籤在欄位上方、重置在前搜尋在後、
// 兩顆都是帶文字的語意按鈕並固定在格線最後一欄。
// 正式後台這一頁是 isSearchBtn: false 配 onChange 直接查，原型照站上的規範走：
// 按下搜尋才查，不做邊打邊查。
const filters = () => `${filterToggle('dashboard-search-panel')}
<form id="dashboard-search-panel" class="source-filter card example-filter" data-dashboard-filter>
  <div class="source-filter-grid">
    <div class="filter-field">
      <label for="dashboard-branch">站台</label>
      <select id="dashboard-branch" class="control guide-select" name="branch" data-filterable>
        ${BRANCHES.map(name => `<option value="${esc(name)}"${STATE.branch === name ? ' selected' : ''}>${esc(name)}</option>`).join('')}
      </select>
    </div>
    <div class="source-filter-actions">
      <button type="button" class="semantic-btn btn-neutral" data-dashboard-reset>${icon('reset')}重置</button>
      <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
    </div>
  </div>
</form>`

// 重新整理放在卡片外的工具列，位置不隨載入狀態改變。
const toolbar = () => `<div class="example-toolbar">
  <button type="button" class="semantic-btn btn-neutral" data-dashboard-refresh>${icon('refresh')}重新整理</button>
</div>`

window.renderExampleDashboard = () => `<section class="example-page example-dashboard-page" data-dashboard-root>
  <div class="guide-section-heading">
    <h2>儀表板</h2>
    <p class="component-description">組合範例（統計卡型），照正式後台首頁 <code>dashboard.vue</code> 做。登入後的第一個畫面，整頁只有八個數字與一個站台切換：示範統計卡怎麼排、數字怎麼寫、重新查詢時舊資料怎麼留在原地。</p>
  </div>
  ${filters()}
  ${toolbar()}
  <div data-dashboard-cards>${cards()}</div>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>版面格線</strong>：八張卡片直接套 <code>.guide-fields</code>（手機 1 欄、768 起 2 欄、992 起 3 欄、1200 起 4 欄、1920 起 6 欄），這一頁不自己宣告欄數也不改欄寬</li>
      <li><strong>非必要不寫死寬高</strong>：卡片高度由標題與數字撐開。正式後台釘在 122px，換成長一點的語系（「今日總有效投注額」在 bn-bd 是三行）第三行會溢出</li>
      <li><strong>數值呈現</strong>：千分位、<code>tabular-nums</code>、金額固定兩位小數；統計卡是彩色底，<strong>數字不分正負一律一般文字色</strong>，正負只靠負號</li>
      <li><strong>統計卡</strong>：一張一色（<code>--kpi-*</code> 八色），淺到深的橫向漸層底＋2px 同色漸層框，右側是白色半透明的圓光、圓環、光點與 88px 出血大圖示，全部是裝飾（<code>aria-hidden</code>）</li>
      <li><strong>搜尋篩選列</strong>：只有一格條件也照同一套版面——標籤在欄位上方、重置在前搜尋在後、按下搜尋才查；重置是回到預設站台並自動查一次，不是清空</li>
      <li><strong>載入與空狀態</strong>：重新整理時舊數字留在原地變淡（遮罩），不換成骨架；遮罩期間底下的操作停用</li>
      <li><strong>訊息提示</strong>：更新完成用 Toast 並帶受詞（「已更新 101 BEST 的儀表板」），不在卡片上方留一行狀態文字</li>
      <li><strong>按鈕</strong>：重置／搜尋／重新整理都是共用語意樣式，高度與輸入框同為 32px</li>
      <li><strong>手機</strong>：篩選列收起來，入口是共用的 <code>filterToggle()</code>；卡片自動變成一欄，欄位一個都不少</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redrawCards = () => {
  const host = document.querySelector('[data-dashboard-cards]')
  if (host) host.innerHTML = cards()
}

// 查詢期間先讓舊數字變淡，拿到資料再換上新的。原型沒有真的請求，
// 用一次 setTimeout 代替，重點是「有資料時不換骨架」這條規則看得到。
let pending = null
const query = (done) => {
  STATE.loading = true
  redrawCards()
  clearTimeout(pending)
  pending = setTimeout(() => {
    STATE.loading = false
    redrawCards()
    done?.()
  }, 420)
}

onMatch('submit', '[data-dashboard-filter]', (event, form) => {
  event.preventDefault()
  STATE.branch = form.querySelector('[name="branch"]').value
  query(() => message.success(`已更新 ${STATE.branch} 的儀表板`))
}, { owner: 'example-dashboard' })

// 重置＝回到預設值再查一次，不是把條件清空留一張空白的篩選列。
onMatch('click', '[data-dashboard-reset]', () => {
  STATE.branch = DEFAULT_BRANCH
  const form = document.querySelector('[data-dashboard-filter]')
  const select = form?.querySelector('[name="branch"]')
  if (select) {
    select.value = DEFAULT_BRANCH
    select.dispatchEvent(new Event('change', { bubbles: true }))
  }
  query(() => message.info(`已重置為 ${DEFAULT_BRANCH}`))
}, { owner: 'example-dashboard' })

onMatch('click', '[data-dashboard-refresh]', () => {
  query(() => message.success(`已更新 ${STATE.branch} 的儀表板`))
}, { owner: 'example-dashboard' })
