// 組合範例（列表型）：照正式後台「禮物卡管理」（giftCardManagement/index.vue）做。
//
// 選這一頁的理由：它是列表頁元件種類最齊的其中之一（12 種），而且是正式後台
// 三個用到進度條的地方之一——兌換進度那一欄。篩選 → 表格 → 分頁 → 操作 → 彈窗 →
// Toast 這條線完整走過一遍，正好驗證各個規範拼起來是否自洽。
//
// 這一頁不套 guidePage()：它是示範「元件怎麼組」，不是規範頁，所以長得像真的頁面。
import { dataTable, dataCards, applyPaging, keepTableScroll, PAGE_SIZES } from './data-table.js'
import { tag } from './tag-guide.js'
import { progressBar } from './progress-guide.js'
import { iconButton } from './icon-button.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { filterToggle } from './filter-toggle.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-list.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 欄位與正式後台的 el-table-column 對齊（活動名稱／兌換代碼／面額／生成數量／
// 狀態／兌換進度／兌換日期區間／建立時間／操作）
const COLUMNS = [
  { key: 'name', label: '活動名稱', align: 'left' },
  { key: 'code', label: '兌換代碼', align: 'left' },
  { key: 'face', label: '面額', align: 'right' },
  { key: 'count', label: '生成數量', align: 'right' },
  { key: 'status', label: '狀態' },
  { key: 'progress', label: '兌換進度' },
  { key: 'range', label: '兌換日期區間' },
  { key: 'created', label: '建立時間' },
  // 三顆圖示按鈕：32×3 ＋ 8×2 ＋ 左右內距 = 156px
  { key: 'actions', label: '操作', width: '156px' },
]

// status 依語意對應標籤型別，不是依狀態碼——正式後台的 formatStatusColor 在不同頁面
// 對同一個數字給不同顏色，標籤規範頁已經把這件事列為待修。
const STATUS = {
  enabled: ['啟用', 'success'],
  paused: ['暫停', 'warning'],
  void: ['作廢', 'danger'],
}

// 資料量刻意超過一頁：分頁只有在真的分得了頁時才看得出規則，
// 一頁就塞得下的示範資料會讓分頁整列隱藏（這是表格元件的既定行為）。
const CARDS = [
  ['GC-2026001', '新春紅包', 'NY2026', 500, 2000, 'enabled', 1486, '2026-01-20 ～ 2026-02-10', '2026-01-12 10:24'],
  ['GC-2026002', '會員回饋金', 'VIPBACK', 1000, 500, 'enabled', 112, '2026-02-01 ～ 2026-03-31', '2026-01-28 15:02'],
  ['GC-2026003', '體驗金', 'TRYME', 100, 10000, 'paused', 9340, '2026-01-01 ～ 2026-06-30', '2025-12-20 09:11'],
  ['GC-2025098', '週年慶禮金', 'ANNIV5', 888, 1500, 'void', 1500, '2025-11-01 ～ 2025-11-30', '2025-10-25 11:40'],
  ['GC-2026004', '推薦好友獎勵', 'REFER26', 200, 3000, 'enabled', 0, '2026-03-01 ～ 2026-12-31', '2026-02-18 16:30'],
  ['GC-2026005', '元宵猜燈謎', 'LANTERN', 300, 1200, 'enabled', 744, '2026-02-20 ～ 2026-03-05', '2026-02-10 09:50'],
  ['GC-2026006', '白色情人節', 'WHITE314', 314, 800, 'paused', 266, '2026-03-10 ～ 2026-03-20', '2026-03-02 14:18'],
  ['GC-2026007', '清明連假加碼', 'QM2026', 400, 2500, 'enabled', 1930, '2026-04-02 ～ 2026-04-07', '2026-03-25 11:05'],
  ['GC-2026008', '勞動節感恩', 'LABOR51', 501, 1000, 'enabled', 88, '2026-05-01 ～ 2026-05-10', '2026-04-22 16:44'],
  ['GC-2026009', '母親節禮金', 'MOM2026', 520, 1800, 'void', 1140, '2026-05-05 ～ 2026-05-15', '2026-04-28 10:12'],
  ['GC-2026010', '端午龍舟賽', 'DRAGON', 666, 900, 'enabled', 357, '2026-06-15 ～ 2026-06-22', '2026-06-05 13:36'],
  ['GC-2026011', '父親節禮金', 'DAD0808', 808, 1600, 'enabled', 1600, '2026-08-01 ～ 2026-08-10', '2026-07-24 15:20'],
  ['GC-2026012', '暑期衝刺', 'SUMMER26', 250, 5000, 'paused', 2178, '2026-07-01 ～ 2026-08-31', '2026-06-20 08:55'],
  ['GC-2026013', '中秋團圓金', 'MOON926', 950, 1300, 'enabled', 412, '2026-09-20 ～ 2026-09-30', '2026-09-10 17:08'],
  ['GC-2026014', '雙十國慶', 'TEN1010', 1010, 700, 'enabled', 0, '2026-10-08 ～ 2026-10-12', '2026-09-28 09:33'],
  ['GC-2026015', '萬聖搗蛋', 'BOO1031', 150, 4000, 'enabled', 3611, '2026-10-25 ～ 2026-11-02', '2026-10-15 11:47'],
  ['GC-2026016', '雙十一狂歡', 'SALE1111', 1111, 2200, 'enabled', 198, '2026-11-11 ～ 2026-11-13', '2026-11-01 00:10'],
  ['GC-2026017', '黑五限時', 'BLACK5', 555, 1500, 'void', 921, '2026-11-27 ～ 2026-11-30', '2026-11-18 19:22'],
  ['GC-2026018', '聖誕交換禮物', 'XMAS26', 1225, 1000, 'enabled', 56, '2026-12-20 ～ 2026-12-26', '2026-12-10 10:00'],
  ['GC-2026019', '跨年倒數', 'NYE1231', 2027, 600, 'paused', 143, '2026-12-28 ～ 2027-01-02', '2026-12-18 21:05'],
  ['GC-2026020', '老客回歸禮', 'COMEBACK', 350, 2800, 'enabled', 1402, '2026-04-01 ～ 2026-12-31', '2026-03-18 14:51'],
  ['GC-2026021', '首儲加碼券', 'FIRST100', 100, 8000, 'enabled', 5673, '2026-01-01 ～ 2026-12-31', '2025-12-28 09:00'],
  ['GC-2026022', 'VIP 專屬禮', 'VIPONLY', 5000, 200, 'enabled', 37, '2026-06-01 ～ 2026-12-31', '2026-05-26 12:40'],
  ['GC-2025099', '舊版體驗金', 'LEGACY', 50, 6000, 'void', 5998, '2025-06-01 ～ 2025-12-31', '2025-05-20 10:30'],
]

const STATE = {
  page: 1,
  pageSize: PAGE_SIZES[0],
  total: CARDS.length,
  keyword: '',
  status: '',
}

const actions = (id, status) => `<div class="icon-action-group example-row-actions">
  ${iconButton({ icon: icon('edit', 16), label: `編輯 ${id}`, kind: 'btn-edit', attrs: `data-gift-edit="${esc(id)}"` })}
  ${status === 'enabled'
    ? iconButton({ icon: icon('pause', 16), label: `暫停兌換 ${id}`, kind: 'btn-warning', attrs: `data-gift-toggle="${esc(id)}"` })
    : iconButton({ icon: icon('play', 16), label: `啟用兌換 ${id}`, kind: 'btn-export', attrs: `data-gift-toggle="${esc(id)}"` })}
  ${iconButton({ icon: icon('delete', 16), label: `作廢 ${id}`, kind: 'btn-danger', disabled: status === 'void', attrs: `data-gift-void="${esc(id)}"` })}
</div>`

const visible = () => CARDS.filter(([, name, code, , , status]) => {
  const k = STATE.keyword.trim().toLowerCase()
  if (k && !name.toLowerCase().includes(k) && !code.toLowerCase().includes(k)) return false
  if (STATE.status && status !== STATE.status) return false
  return true
})

const rows = () => visible().map(([id, name, code, face, count, status, claimed, range, created]) => ({
  name: esc(name),
  code: `<code>${esc(code)}</code>`,
  face: `$${face.toLocaleString()}`,
  count: count.toLocaleString(),
  status: tag(STATUS[status][0], STATUS[status][1]),
  // 兌換進度：正式後台是「已兌換/總數」加一條不顯示數字的進度條
  progress: `<div class="example-progress-cell"><span>${claimed.toLocaleString()} / ${count.toLocaleString()}</span>${progressBar({ value: (claimed / count) * 100, label: `${name} 已兌換 ${claimed} / ${count}`, tone: 'info', text: 'none' })}</div>`,
  range: `<span class="example-nowrap">${esc(range)}</span>`,
  created: `<span class="example-nowrap">${esc(created)}</span>`,
  actions: actions(id, status),
}))

// 篩選列套站上共用的 .source-filter / .source-filter-grid / .filter-field，
// 不另外排一套版——規格統一的前提是大家用同一組 class。
const filters = () => `${filterToggle('gift-search-panel')}
  <form id="gift-search-panel" class="source-filter card example-filter" data-gift-filter>
  <div class="source-filter-grid">
    <div class="filter-field">
      <label for="gift-keyword">活動名稱／兌換代碼</label>
      <input id="gift-keyword" class="control" name="keyword" value="${esc(STATE.keyword)}" placeholder="請輸入名稱或代碼" maxlength="40">
    </div>
    <div class="filter-field">
      <label for="gift-status">狀態</label>
      <select id="gift-status" class="control guide-select" name="status">
        <option value="">全部狀態</option>
        ${Object.entries(STATUS).map(([k, [label]]) =>
          `<option value="${k}" ${STATE.status === k ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    <div class="filter-field filter-span-2">
      <label id="gift-date-label">兌換日期區間</label>
      <div class="date-range-host" data-date-range data-empty="true" aria-labelledby="gift-date-label"></div>
    </div>
    <div class="source-filter-actions">
      <button type="button" class="semantic-btn btn-neutral" data-gift-reset>${icon('reset')}重設</button>
      <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
    </div>
  </div>
</form>`

// 列表工具列：新增、匯出、刷新一律在表格外，位置不隨狀態改變（states.js 的規範）
const toolbar = () => `<div class="example-toolbar member-actions">
  <button type="button" class="semantic-btn btn-add" data-gift-add>${icon('add')}新增禮物卡</button>
  <button type="button" class="semantic-btn btn-export" data-gift-export>${icon('download')}匯出</button>
  <button type="button" class="semantic-btn btn-neutral" data-gift-refresh>${icon('refresh')}刷新</button>
</div>`

// 空狀態交給 dataTable 自己處理（它已經沿用「載入與空狀態」的版面），
// 頁面不另外畫一份表格外殼。
const table = () => {
  const list = rows()
  const start = (STATE.page - 1) * STATE.pageSize
  return dataTable({
    name: 'gift',
    columns: COLUMNS,
    caption: '禮物卡管理',
    // 九欄在手機上塞不下。宣告 scroll 之後捲動容器才帶 tabindex 與 role="region"，
    // 鍵盤也捲得動；少了它雖然一樣會捲，但只有滑鼠與觸控碰得到。
    scroll: '1100px',
    rows: list.slice(start, start + STATE.pageSize),
    page: STATE.page,
    pageSize: STATE.pageSize,
    total: list.length,
  })
}

// 手機換成卡片。判準走「表格 Table → 手機版」的第二條：列上的操作要先看完資料才按
// 得下去。這一列有「作廢」——不可逆，而且按之前非看不可的是兌換進度：作廢一檔已兌換
// 1,486 / 2,000 的活動，跟作廢一檔 0 / 3,000 的是完全不同的決定。表格要橫向捲過四欄
// 才看得到進度，捲回來才按得到按鈕，資料與操作不在同一個畫面上。
// 九個欄位一個不漏（手機不得精簡欄位）：標題＝活動名稱、副標＝兌換代碼、
// 右上＝狀態、meta 五格、底下＝三顆操作。
const cards = () => {
  const list = visible()
  const start = (STATE.page - 1) * STATE.pageSize
  return `<div class="member-mobile-only example-gift-cards">${dataCards({
    name: 'gift',
    rows: list.slice(start, start + STATE.pageSize)
      .map(([id, name, code, face, count, status, claimed, range, created]) => ({
        attrs: `data-gift-card="${esc(id)}"`,
        title: esc(name),
        subtitle: `<code>${esc(code)}</code>`,
        status: tag(STATUS[status][0], STATUS[status][1]),
        meta: [
          ['面額', `$${face.toLocaleString()}`],
          ['生成數量', count.toLocaleString()],
          ['兌換進度', `<div class="example-progress-cell"><span>${claimed.toLocaleString()} / ${count.toLocaleString()}</span>${progressBar({ value: (claimed / count) * 100, label: `${name} 已兌換 ${claimed} / ${count}`, tone: 'info', text: 'none' })}</div>`],
          ['兌換日期區間', esc(range)],
          ['建立時間', esc(created)],
        ],
        actions: actions(id, status),
      })),
  })}</div>`
}

window.renderExampleList = () => `<section class="example-page example-list-page" data-gift-root>
  <div class="guide-section-heading">
    <h2>禮物卡管理</h2>
    <p class="component-description">組合範例（列表型），照正式後台 <code>giftCardManagement/index.vue</code> 做。走一遍列表頁的完整動線：篩選 → 表格 → 分頁 → 單筆操作 → 確認彈窗 → Toast 回報。</p>
  </div>
  ${filters()}
  ${toolbar()}
  <section class="card example-card" data-gift-list>${cards()}${table()}</section>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>輸入框／下拉選單／日期</strong>：篩選列的三個欄位，label 在上、控制在下</li>
      <li><strong>表格</strong>：表頭、內距、框線與分頁都來自 <code>dataTable()</code>，頁面不自己兜分頁</li>
      <li><strong>標籤</strong>：狀態欄依<strong>語意</strong>對應型別（啟用 success／暫停 warning／作廢 danger），不是依狀態碼</li>
      <li><strong>進度條</strong>：兌換進度用中性色，不自動變色——越多人兌換不代表越危險</li>
      <li><strong>圖示按鈕</strong>：同一列三顆，各自有 aria-label 與 Tooltip；已作廢的那筆停用刪除鈕</li>
      <li><strong>彈窗</strong>：作廢是不可逆操作，先開確認彈窗；<strong>新增與編輯是同一個表單彈窗</strong>（照正式後台的 <code>openEditDialog()</code>，不帶 id 就是新增），差別只有標題、兌換代碼能不能改、送出後是加一筆還是改一筆</li>
      <li><strong>訊息提示</strong>：操作結果用 Toast，文案帶受詞（「已作廢 新春紅包」而不是「成功」）</li>
      <li><strong>載入與空狀態</strong>：篩選不到時表格內顯示無資料，工具列不動</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redraw = () => {
  // 篩選會改變總筆數，分頁的頁數上限要跟著變，否則停在已不存在的頁碼上會看到空表格
  STATE.total = visible().length
  const host = document.querySelector('[data-gift-list]')
  keepTableScroll(() => { if (host) host.innerHTML = cards() + table() })
}

const findCard = id => CARDS.find(c => c[0] === id)

// 用 querySelector 取欄位而不是 form.keyword：表單的具名存取會被同名欄位遮蔽
// （例如有個欄位叫 submit，form.submit 就不再是方法），不值得為了短一點冒這個險。
onMatch('submit', '[data-gift-filter]', (event, form) => {
  event.preventDefault()
  STATE.keyword = form.querySelector('[name="keyword"]').value
  STATE.status = form.querySelector('[name="status"]').value
  STATE.page = 1
  redraw()
  const n = visible().length
  n ? message.success(`找到 ${n} 筆禮物卡`) : message.info('沒有符合條件的禮物卡')
}, { owner: 'example-list' })

onMatch('click', '[data-gift-reset]', () => {
  STATE.keyword = ''
  STATE.status = ''
  STATE.page = 1
  const form = document.querySelector('[data-gift-filter]')
  if (form) {
    form.querySelector('[name="keyword"]').value = ''
    form.querySelector('[name="status"]').value = ''
  }
  redraw()
  message.info('已清除搜尋條件')
}, { owner: 'example-list' })

onMatch('click', '[data-table-page][data-table="gift"]', (event, button) => {
  if (button.dataset.table !== 'gift') return
  STATE.page = applyPaging(STATE, { page: button.dataset.tablePage }).page
  redraw()
}, { owner: 'example-list' })

onMatch('change', '[data-table-size][data-table="gift"]', (event, select) => {
  if (select.dataset.table !== 'gift') return
  Object.assign(STATE, applyPaging(STATE, { size: select.value }))
  redraw()
}, { owner: 'example-list' })

onMatch('click', '[data-gift-toggle]', (event, button) => {
  const card = findCard(button.dataset.giftToggle)
  if (!card) return
  card[5] = card[5] === 'enabled' ? 'paused' : 'enabled'
  redraw()
  message.success(`已${card[5] === 'enabled' ? '啟用' : '暫停'}兌換「${card[1]}」`)
}, { owner: 'example-list' })

onMatch('click', '[data-gift-void]', (event, button) => {
  const card = findCard(button.dataset.giftVoid)
  if (!card) return
  // 作廢不可逆，照規範先確認再執行
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>作廢禮物卡</h2></header>
    <div class="bo-modal-body">
      <p>確定作廢「${esc(card[1])}」（${esc(card[2])}）？</p>
      <p>已發出但尚未兌換的 ${(card[4] - card[6]).toLocaleString()} 張將立即失效，此操作無法復原。</p>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>取消</button>
      <button type="submit" class="semantic-btn btn-danger">確認作廢</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    card[5] = 'void'
    redraw()
    message.success(`已作廢「${card[1]}」`)
    dialog.close()
  }
  dialog.addEventListener('close', () => { dialog.remove(); button.focus() }, { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-list' })

// 新增與編輯是同一個彈窗，與正式後台一致——giftCardManagement 的 openEditDialog()
// 不帶 id 就是新增，帶了就是檢視／編輯。差別只有三處：標題、兌換代碼能不能改、
// 送出之後是加一筆還是改一筆。兩個入口各做一份表單，欄位遲早會對不起來。
const giftDialog = (card, trigger) => {
  const isNew = !card
  const num = n => Number(n).toLocaleString('en-US')
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>${isNew ? '新增禮物卡' : '編輯禮物卡'}</h2></header>
    <div class="bo-modal-body">
      <div class="guide-fields">
        <div class="guide-field">
          <label for="gift-form-name">活動名稱<span class="required-mark" aria-hidden="true"> *</span></label>
          <input id="gift-form-name" class="guide-input" value="${isNew ? '' : esc(card[1])}" required maxlength="40">
        </div>
        <div class="guide-field">
          <label for="gift-form-code">兌換代碼${isNew ? '<span class="required-mark" aria-hidden="true"> *</span>' : ''}</label>
          ${isNew
            ? '<input id="gift-form-code" class="guide-input" required maxlength="20" placeholder="英數字，建立後不可修改">'
            : `<input id="gift-form-code" class="guide-input" value="${esc(card[2])}" readonly><small>已發出的代碼不可修改</small>`}
        </div>
        <div class="guide-field">
          <label for="gift-form-face">面額</label>
          <div class="affix-input"><span>$</span><input id="gift-form-face" class="guide-input amount-input" value="${isNew ? '' : num(card[3])}" inputmode="decimal"></div>
        </div>
        ${isNew ? `<div class="guide-field">
          <label for="gift-form-count">生成數量</label>
          <input id="gift-form-count" class="guide-input amount-input" value="1,000" inputmode="numeric">
        </div>
        <div class="guide-field is-full">
          <label id="gift-form-range-label">兌換日期區間</label>
          <div class="date-range-host" data-date-range data-empty="true" aria-labelledby="gift-form-range-label"></div>
        </div>` : ''}
      </div>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>取消</button>
      <button type="submit" class="semantic-btn btn-search">${isNew ? '確認新增' : '儲存'}</button>
    </footer>
  </form>`
  prepareModal(dialog)
  const field = id => dialog.querySelector('#' + id)
  const digits = input => Number(String(input?.value ?? '').replace(/[^\d.]/g, ''))
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    if (isNew) {
      // 兌換日期區間直接讀共用日期元件寫回 host 的 data-start／data-end，
      // 不在這裡另外做一個日期欄位。
      const host = dialog.querySelector('[data-date-range]')
      const range = host?.dataset.start && host?.dataset.end
        ? `${host.dataset.start.slice(0, 10)} ～ ${host.dataset.end.slice(0, 10)}`
        : '未設定'
      const name = field('gift-form-name').value.trim()
      const serial = String(CARDS.length + 1).padStart(3, '0')
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      CARDS.unshift([
        `GC-${now.getFullYear()}${serial}`,
        name,
        field('gift-form-code').value.trim().toUpperCase(),
        digits(field('gift-form-face')) || 0,
        digits(field('gift-form-count')) || 1,
        'enabled',
        0,
        range,
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      ])
      // 新增完回第一頁，否則新的那一筆排在最前面、使用者卻還停在第三頁
      STATE.page = 1
      redraw()
      message.success(`已新增「${name}」`)
    } else {
      card[1] = field('gift-form-name').value.trim() || card[1]
      card[3] = digits(field('gift-form-face')) || card[3]
      redraw()
      message.success(`已更新「${card[1]}」`)
    }
    dialog.close()
  }
  dialog.addEventListener('close', () => { dialog.remove(); trigger?.focus() }, { once: true })
  document.body.append(dialog)
  dialog.showModal()
}

onMatch('click', '[data-gift-edit]', (event, button) => {
  const card = findCard(button.dataset.giftEdit)
  if (card) giftDialog(card, button)
}, { owner: 'example-list' })

onMatch('click', '[data-gift-add]', (event, button) => giftDialog(null, button), { owner: 'example-list' })
onMatch('click', '[data-gift-export]', () => message.success(`已開始匯出 ${visible().length} 筆禮物卡`), { owner: 'example-list' })
onMatch('click', '[data-gift-refresh]', () => { redraw(); message.success('列表已刷新') }, { owner: 'example-list' })
