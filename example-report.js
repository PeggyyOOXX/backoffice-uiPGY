// 組合範例（報表型）：照正式後台「遊戲營收報表」（gameRevenueReport/index.vue）做。
//
// 選這一頁的理由：正式後台有 19 個 *Report／*Record 頁，它們和一般列表頁不同的地方
// 全都在這一頁上——多維度頁籤（同一組指標換一個維度看）、日期區間有天數上限、
// 合計列、金額要千分位且負數紅字、匯出是建立下載任務而不是直接下檔。
// 先前原型完全沒有這一型，表格規範頁只有一條孤立的 tfoot 示範。
import { dataTable, applyPaging, keepTableScroll, PAGE_SIZES } from './data-table.js'
import { tabs, tabPanels } from './tabs.js'
import { requestExport } from './download-center.js'
import { message } from './message.js'
import { icon } from './icons.js'
import { filterToggle } from './filter-toggle.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-report.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const TAB_ID = 'revenue-report'
// 同一組指標、四個維度，與正式後台的 TabType（total／gameType／gameProvider／game）一致。
const TABS = [
  { key: 'total', label: '總營收' },
  { key: 'type', label: '遊戲類型' },
  { key: 'provider', label: '遊戲商' },
  { key: 'game', label: '單一遊戲' },
]

const DIMENSION = {
  total: ['日期', ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12']],
  type: ['遊戲類型', ['真人視訊', '電子遊戲', '體育賽事', '彩票', '棋牌', '捕魚']],
  provider: ['遊戲商', ['BEST Live', 'PG Soft', 'Pragmatic', 'SA Gaming', 'Evolution', 'JDB', 'CQ9', 'BEST Sport']],
  game: ['遊戲名稱', ['百家樂 A 廳', '龍虎鬥', '金龍報喜', '糖果派對', '尋寶黃金城', '捕魚大亨', '德州撲克', '三分極速賽車', '輪盤 B 廳', '水果機']],
}

// 固定亂數：報表要看得出合計對不對，每次重繪數字就不能跳動。
const seeded = (seed, min, max) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return Math.round(min + (x - Math.floor(x)) * (max - min))
}

const dataset = key => {
  const [, names] = DIMENSION[key]
  return names.map((name, index) => {
    const bet = seeded(index + key.length * 7, 480000, 9600000)
    // 派彩率 92–106%：刻意讓其中幾列的營收是負的，才看得到負數紅字那條規則
    const payout = Math.round(bet * (seeded(index + 31, 920, 1060) / 1000))
    return { name, bet, payout, revenue: bet - payout, members: seeded(index + 13, 120, 4200) }
  })
}

const STATE = { tab: 'total', page: 1, pageSize: PAGE_SIZES[0], currency: 'TWD', provider: '' }

const money = n => n.toLocaleString('en-US')
// 金額一律千分位、等寬數字對齊；負數用語意色裡的危險色，不另外調一個紅。
const amount = n => `<span class="example-amount${n < 0 ? ' is-negative' : ''}">${n < 0 ? '-' : ''}$${money(Math.abs(n))}</span>`

const columns = key => [
  // 維度欄的對齊跟著內容走，不因為它是第一欄就一律靠左：
  // 「總營收」的維度是日期，等寬，比照全站其他日期時間欄置中；
  // 其餘三個維度（遊戲類型／遊戲商／遊戲名稱）是長度不一的名稱，靠左才掃得動。
  { key: 'name', label: DIMENSION[key][0], ...(key === 'total' ? {} : { align: 'left' }) },
  { key: 'bet', label: '有效投注', align: 'right' },
  { key: 'payout', label: '派彩', align: 'right' },
  { key: 'revenue', label: '遊戲營收', align: 'right' },
  { key: 'members', label: '活躍會員', align: 'right' },
  { key: 'share', label: '營收佔比', align: 'right' },
]

const report = () => {
  const list = dataset(STATE.tab)
  const sum = list.reduce((acc, row) => ({
    bet: acc.bet + row.bet, payout: acc.payout + row.payout,
    revenue: acc.revenue + row.revenue, members: acc.members + row.members,
  }), { bet: 0, payout: 0, revenue: 0, members: 0 })
  const start = (STATE.page - 1) * STATE.pageSize
  const rows = list.slice(start, start + STATE.pageSize).map(row => ({
    name: esc(row.name),
    bet: amount(row.bet),
    payout: amount(row.payout),
    revenue: amount(row.revenue),
    members: money(row.members),
    // 佔比用總營收當分母；總營收是負的時候佔比沒有意義，直接留白不印一個看不懂的數字
    share: sum.revenue > 0 ? `${((row.revenue / sum.revenue) * 100).toFixed(1)}%` : '—',
  }))
  return dataTable({
    name: 'report',
    columns: columns(STATE.tab),
    caption: '遊戲營收報表',
    // 六欄金額在手機上塞不下。報表維持表格不改卡片（要跨列比同一個欄位，而且合計列
    // 在卡片裡沒有地方放），所以橫向捲動是這一頁唯一的出路——宣告 scroll 之後捲動
    // 容器才帶 tabindex 與 role="region"，鍵盤也捲得動。
    scroll: '680px',
    rows,
    page: STATE.page,
    pageSize: STATE.pageSize,
    total: list.length,
    // 合計是整個查詢區間的總和，不是本頁的小計——分頁不影響它。
    foot: {
      label: `合計（${list.length} 筆）`,
      values: {
        bet: amount(sum.bet), payout: amount(sum.payout),
        revenue: amount(sum.revenue), members: money(sum.members),
        share: sum.revenue > 0 ? '100.0%' : '—',
      },
    },
  })
}

const filters = () => `${filterToggle('report-search-panel')}
  <form id="report-search-panel" class="source-filter card example-filter" data-report-filter>
  <div class="source-filter-grid">
    <div class="filter-field filter-span-2">
      <label id="report-date-label">查詢區間</label>
      <!-- data-max-days 由共用日期元件擋在日曆上，不是等按下搜尋才報錯 -->
      <div class="date-range-host" data-date-range data-past-year data-max-days="90" aria-labelledby="report-date-label"></div>
    </div>
    <div class="filter-field">
      <label for="report-currency">幣別</label>
      <select id="report-currency" class="control guide-select" name="currency">
        ${['TWD', 'USD', 'THB', 'VND'].map(v => `<option ${STATE.currency === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="filter-field">
      <label for="report-provider">遊戲商</label>
      <select id="report-provider" class="control guide-select" name="provider" multiple data-collapse="2" data-filterable data-clearable>
        ${DIMENSION.provider[1].map(v => `<option>${esc(v)}</option>`).join('')}
      </select>
    </div>
    <div class="source-filter-actions">
      <button type="button" class="semantic-btn btn-neutral" data-report-reset>${icon('reset')}重設</button>
      <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
    </div>
  </div>
</form>`

const toolbar = () => `<div class="example-toolbar member-actions">
  <button type="button" class="semantic-btn btn-export" data-report-export>${icon('download')}匯出</button>
  <button type="button" class="semantic-btn btn-neutral" data-report-refresh>${icon('refresh')}重新整理</button>
</div>`

window.renderExampleReport = () => `<section class="example-page example-report-page" data-report-root>
  <div class="guide-section-heading">
    <h2>遊戲營收報表</h2>
    <p class="component-description">組合範例（報表型），照正式後台 <code>gameRevenueReport/index.vue</code> 做。報表和一般列表的差別全在這一頁：多維度頁籤、查詢區間有天數上限、合計列、金額格式與非同步匯出。</p>
  </div>
  ${filters()}
  ${tabs({ id: TAB_ID, label: '報表維度', items: TABS, active: STATE.tab, variant: 'card', mobile: 'select', panels: true })}
  ${toolbar()}
  ${tabPanels(TAB_ID, TABS.map(t => [t.key, t.key === STATE.tab ? `<section class="card example-card" data-report-list>${report()}</section>` : '']), STATE.tab)}
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>頁籤</strong>：四個維度是同一份查詢條件的四種看法，所以換頁籤不清空篩選，只重算表格</li>
      <li><strong>日期</strong>：<code>data-max-days="90"</code> 由共用日期元件在日曆上就擋住，不是按下搜尋才跳錯誤；<code>data-past-year</code> 同時擋掉未來與一年前</li>
      <li><strong>表格</strong>：合計列由 <code>dataTable()</code> 的 <code>foot</code> 畫，底色與表頭同一組，只有標籤欄靠左</li>
      <li><strong>金額</strong>：千分位、等寬數字靠右對齊；負數用語意色的危險色，不另外調一個紅</li>
      <li><strong>匯出</strong>：建立下載任務後交給頁首的下載中心，按下當時只說「已建立匯出任務」——那時候檔案還不存在</li>
      <li><strong>分頁</strong>：合計是整個區間的總和，不是本頁小計，所以換頁不會變</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redraw = () => keepTableScroll(() => {
  const host = document.querySelector('[data-report-list]')
  if (host) host.innerHTML = report()
})

const redrawAll = () => {
  const host = document.querySelector('[data-report-root]')
  if (host) host.outerHTML = window.renderExampleReport()
}

onMatch('submit', '[data-report-filter]', (event, form) => {
  event.preventDefault()
  STATE.currency = form.querySelector('[name="currency"]').value
  STATE.page = 1
  redraw()
  message.success(`已查詢 ${STATE.currency} 的${TABS.find(t => t.key === STATE.tab).label}`)
}, { owner: 'example-report' })

onMatch('click', '[data-report-reset]', () => {
  STATE.currency = 'TWD'
  STATE.page = 1
  const form = document.querySelector('[data-report-filter]')
  form?.reset()
  window.resetDateRanges?.(form)
  redrawAll()
}, { owner: 'example-report' })

onMatch('click', '[data-report-export]', () => {
  requestExport(`遊戲營收報表_${TABS.find(t => t.key === STATE.tab).label}`)
}, { owner: 'example-report' })

onMatch('click', '[data-report-refresh]', () => {
  redraw()
  message.info('已重新整理報表')
}, { owner: 'example-report' })

// 換維度：篩選條件留著，只有表格重算。分頁回到第 1 頁，因為資料整批換過了。
onMatch('tab-change', `[data-tabs="${TAB_ID}"]`, event => {
  STATE.tab = event.detail.key
  STATE.page = 1
  redrawAll()
}, { owner: 'example-report' })

onMatch('click', '[data-table-page][data-table="report"]', (event, button) => {
  Object.assign(STATE, applyPaging({ ...STATE, total: dataset(STATE.tab).length }, { page: button.dataset.tablePage }))
  redraw()
}, { owner: 'example-report' })

onMatch('change', '[data-table-size][data-table="report"]', (event, select) => {
  Object.assign(STATE, applyPaging({ ...STATE, total: dataset(STATE.tab).length }, { size: select.value }))
  redraw()
}, { owner: 'example-report' })
