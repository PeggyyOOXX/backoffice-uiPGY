// 移植：el-table（CustomTable.vue）＋ el-pagination（Pagination.vue）。詳見 ELEMENT-PLUS-MAPPING.md
//
// 表格、表頭排序與分頁放同一頁，因為它們是同一個元件的三個面向：
// 正式後台 53 個用到分頁的 view，53 個都搭配 CustomTable，分頁從來沒有單獨出現過。
import { guidePage, decisionTable } from './guide-page.js'
import { dataTable, dataCards, applyPaging, PAGE_SIZES } from './data-table.js'
import { tag } from './tag-guide.js'
import { iconButton } from './icon-button.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './guide-page.css'
import './table-guide-page.css'

const MEMBERS = [
  ['MB-009821', 'Ava Chen', 'VIP 5', '$128,420.00', '正常'],
  ['MB-009774', 'David Lin', 'VIP 3', '$64,180.00', '正常'],
  ['MB-009710', 'Mia Wu', 'VIP 1', '$8,940.00', '停用'],
  ['MB-009688', 'Leo Hsu', 'VIP 2', '$21,355.00', '正常'],
  ['MB-009640', 'Nina Kao', 'VIP 4', '$97,002.00', '觀察中'],
]

const COLUMNS = [
  { key: 'id', label: '會員編號' },
  { key: 'name', label: '名稱' },
  { key: 'level', label: '等級' },
  { key: 'balance', label: '餘額' },
  { key: 'status', label: '狀態' },
  { key: 'actions', label: '操作' },
]

const actions = id => `<div class="icon-action-group data-table-actions">
  ${iconButton({ icon: icon('edit', 16), label: `編輯 ${id}`, kind: 'btn-edit' })}
  ${iconButton({ icon: icon('loginRecord', 16), label: `登入紀錄 ${id}`, kind: 'btn-record' })}
  ${iconButton({ icon: icon('delete', 16), label: `刪除 ${id}`, kind: 'btn-danger' })}
</div>`

// 手機上同一份資料的兩種排法。判準不是欄位多少，是使用者對這一列做什麼：
// 要讀完一整筆才能決定 → 卡片；要跨列比同一個欄位 → 表格。
const MOBILE_DECISION = [
  ['要讀完一整筆才能決定（審核、會員詳情）', '<strong>卡片</strong>', '欄位之間有從屬關係，卡片能兩行一組；表格只能硬並排'],
  ['列上的操作要先看完資料才按得下去', '<strong>卡片</strong>', '通過／不通過、作廢這類操作，按之前要先讀'],
  ['要跨列比同一個欄位（報表、金額、佔比）', '<strong>表格</strong>', '拆成卡片就比不了，而且<strong>合計列在卡片裡沒有地方放</strong>'],
  ['要勾選多筆做批量', '<strong>表格</strong>', '卡片化之後「全選本頁」與連續勾選都變難，而勾選正是那一頁的重點'],
  ['欄位少（4 欄以內）又短', '<strong>表格</strong>', '本來就塞得下，換成卡片反而更長'],
  ['欄位多但只有 3–4 欄是關鍵', '精簡表格 ＋ 詳情抽屜', '手機只留關鍵欄，其餘點開抽屜看——會員列表就是這一型'],
]

// 同一份資料，上面那張表格與下面這組卡片是同一批列。
const mobileCards = () => dataCards({
  name: 'members-mobile',
  rows: MEMBERS.map(([id, name, level, balance, status]) => ({
    title: name,
    subtitle: id,
    status: tag(status, status === '正常' ? 'success' : status === '停用' ? 'danger' : 'warning'),
    meta: [['等級', level], ['餘額', balance]],
    actions: actions(id),
  })),
})

// 示範用的狀態。總筆數刻意設大，才看得出折疊規則。
let state = { page: 3, pageSize: PAGE_SIZES[1], total: 238 }

const rows = () => MEMBERS.map(([id, name, level, balance, status]) => ({
  id, name, level, balance, status, actions: actions(id),
}))

const demo = () => dataTable({
  name: 'guide',
  columns: COLUMNS,
  rows: rows(),
  page: state.page,
  pageSize: state.pageSize,
  total: state.total,
})

const DECISION = [
  ['一般列表，筆數已知', '<strong>表格＋分頁</strong>', '使用者能跳到任一頁，也能說出「在第 3 頁」'],
  ['設定頁、權限矩陣等固定幾列', '<strong>表格，<code>pagination: false</code></strong>', '只有幾列卻掛一條分頁列，只是雜訊'],
  ['筆數很大或無上限（例如日誌）', '只給上一頁／下一頁', '算總頁數要掃全表，成本高且意義不大'],
  ['結果需要逐筆檢視不漏看', '<strong>表格＋分頁</strong>', '無限捲動會讓人不確定看到哪裡，也無法回到同一個位置'],
  ['單頁就放得下（10 筆以內）', '不分頁', '只有一頁時整列隱藏，不要顯示「1 / 1」'],
]

window.renderTablePage = () => guidePage({
  slug: 'table',
  title: '表格 Table',
  intro: '表格與分頁是同一個元件。正式後台 53 個用到分頁的 view，53 個都搭配 CustomTable——分頁從來沒有單獨出現過，拆成兩個元件只會讓每個頁面自己兜，兜法各不相同。表頭排序也在這一頁，它是表格的一部分。',
  sections: [
    {
      heading: '互動範例',
      body: `<div class="guide-stage" data-table-demo>${demo()}</div>
        <p class="component-description">點頁碼或改每頁筆數都會重畫。改每頁筆數一律跳回第 1 頁——停在原頁碼會看到完全不同的資料，使用者會以為查詢出錯。</p>`,
    },
    {
      heading: '用法',
      body: `<pre><code>${['dataTable({',
        "  name: 'members',",
        '  columns: [{ key: \'id\', label: \'會員編號\' }, …],',
        '  rows, page, pageSize, total,',
        '})',
        '',
        '// 設定頁、權限矩陣這類固定幾列的表格',
        'dataTable({ columns, rows, pagination: false })',
      ].join('\n')}</code></pre>
        <p class="component-description">分頁列由元件自己產生，頁面不再各自拼一組按鈕。換頁與改每頁筆數的狀態用 <code>applyPaging()</code> 計算，「改筆數跳回第 1 頁」的規則就不會有人漏掉。</p>`,
    },
    { heading: '什麼時候要分頁', body: decisionTable(DECISION) },
    {
      heading: '手機版：卡片還是表格',
      body: `<p class="component-description">判準是<strong>「這一列要用來讀，還是用來比」</strong>——不是看欄位多少。要讀完一整筆才能做決定的改成卡片；要跨列比同一個欄位的維持表格。</p>${decisionTable(MOBILE_DECISION, ['情境', '手機上怎麼呈現', '為什麼'])}<h4>同一份資料的兩種排法</h4><p class="component-description">下面是同一批列。桌機兩種並排著看得出差別；實際頁面上同一時間只會出現一種，由上面的判準決定。</p><div class="table-mobile-compare"><div><h5>表格</h5>${dataTable({ name: 'members-compare', columns: COLUMNS, rows: rows(), pagination: false })}</div><div><h5>卡片</h5>${mobileCards()}</div></div><div class="guide-pair"><div class="is-bad"><h4>${icon('cancelCircle')}不要一律改卡片</h4><p>報表拆成卡片就沒辦法上下對齊比數字，合計列也沒有地方放；有勾選的批量頁改成卡片之後，「全選本頁」與連續勾選都會變難。</p></div><div class="is-good"><h4>${icon('checkCircle')}兩種都要，而且有規則</h4><p>卡片與表格都用共用元件（<code>dataCards()</code> 與 <code>dataTable()</code>），吃同一份資料。要切換的是呈現方式，不是重寫一頁。</p></div></div>`,
    },
    {
      heading: '折疊規則',
      body: `<p class="component-description">頁數超過 7 頁時中間折疊成 <code>…</code>，但<strong>目前頁的前後各留一個</strong>，相鄰頁才點得到。第一頁與最後一頁永遠顯示。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p><code>1 … 7 … 12</code>——目前頁兩側都被折疊，想看第 6 頁只能先跳到別頁再回來。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}要</h4><p><code>1 … 6 7 8 … 12</code>——相鄰頁可直接點。</p></div>
        </div>`,
    },
    { heading: '表頭排序', body: bodyOfSort() },
    {
      heading: '狀態欄位（可切換）',
      body: `<p class="component-description">正式後台的 <code>StatusComponent.vue</code>（5 個 view 在用）：表格裡的狀態欄位，<strong>有編輯權限時可以點開確認彈窗直接改狀態</strong>，沒有權限就只是一段文字。</p>
        <div class="guide-stage">
          <table class="table-status-demo">
            <thead><tr><th>會員編號</th><th>狀態（有權限）</th><th>狀態（無權限）</th></tr></thead>
            <tbody>
              <tr><td>MB-009821</td><td><button type="button" class="status-field is-on">啟用</button></td><td><span class="status-field is-on is-readonly">啟用</span></td></tr>
              <tr><td>MB-009774</td><td><button type="button" class="status-field is-off">停用</button></td><td><span class="status-field is-off is-readonly">停用</span></td></tr>
            </tbody>
          </table>
        </div>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要用標籤做</h4><p>標籤的規範寫明「狀態標記不可點」。可點的狀態如果長得像標籤，使用者分不出哪些能改、哪些不能——同一欄裡有權限和沒權限的兩種人看到的東西會一模一樣。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}用可點的文字</h4><p>有權限時是 <code>button</code>，帶底線與 pointer 游標；沒權限時是 <code>span</code>，只有顏色。<strong>顏色相同、可否點擊不同</strong>，一眼就看得出自己能不能改。</p></div>
        </div>
        <p class="component-description">切換狀態是<strong>會改資料的操作</strong>，所以點下去開確認彈窗，不是直接送出。正式後台的 <code>determineStatusClass()</code> 目前只有兩種顏色（綠＝啟用、紅＝其餘），移植時建議改用標籤頁定義的五種語意色。</p>`,
    },
  ],
  tokens: [
    ['表頭底色', '#F7F8FB'],
    ['表頭文字', '#68758B / 12px'],
    ['表頭內距', '8px 11px'],
    ['內容內距', '9px 11px'],
    ['內容對齊', '置中'],
    ['列底線', '#EDF0F4'],
    ['hover 底色', '#F9FBFF'],
    ['排序未啟用', '灰色雙箭頭'],
    ['排序方向', '主題綠標示，三態循環'],
    ['分頁按鈕', '34 × 34px / 圓角 4px / 間距 4px'],
    ['每頁筆數', '10 / 20 / 50 / 100'],
    ['折疊門檻', '超過 7 頁，目前頁前後各留 1 頁'],
  ],
  rules: [
    ['表格與分頁用同一個元件', '不要在頁面自己兜一組分頁按鈕；分頁從來不會單獨出現。'],
    ['共用樣式不得覆寫', '表頭底色、文字色、字級、內距、框線與對齊一律沿用，個別頁面只定義欄寬與固定欄。'],
    ['改每頁筆數跳回第 1 頁', '停在原頁碼會看到完全不同的資料，使用者會以為查詢出錯。'],
    ['只有一頁就整列隱藏', '不要顯示「1 / 1」或一顆孤零零的按鈕。'],
    ['目前頁要標 aria-current', '只靠底色，螢幕報讀器讀不出現在在第幾頁。'],
    ['換頁時沿用載入規範', '畫面上已有資料，用遮罩讓舊資料留在原地變淡，不要換成骨架。'],
  ],
})

// 表頭排序的示範沿用 table-sort.js 既有片段，不複製一份
function bodyOfSort() {
  const fragment = window.tableSortExamples()
  const match = fragment.match(/<div class="card [^"]*">([\s\S]*)<\/div><\/section>$/)
  if (!match) throw new Error('table-sort.js 的片段形狀改了，table-guide-page.js 取不到內容')
  return match[1]
}

function redraw() {
  const host = document.querySelector('[data-table-demo]')
  if (host) host.innerHTML = demo()
}

onMatch('click', '[data-table-page]', (event, button) => {
  state = applyPaging(state, { page: button.dataset.tablePage })
  redraw()
}, { owner: 'table-guide-page' })

onMatch('change', '[data-table-size]', (event, select) => {
  state = applyPaging(state, { size: select.value })
  redraw()
}, { owner: 'table-guide-page' })
