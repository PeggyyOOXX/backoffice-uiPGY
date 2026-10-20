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

// 對齊照「欄位對齊」那一節：編號與名稱要從頭比對 → 靠左；餘額要比大小 → 靠右；
// 等級、狀態、操作只是辨識 → 置中。示範表自己也得照規範寫。
const COLUMNS = [
  { key: 'id', label: '會員編號', align: 'left' },
  { key: 'name', label: '名稱', align: 'left' },
  { key: 'level', label: '等級' },
  { key: 'balance', label: '餘額', align: 'right' },
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
]

// 四條主判準都不符合時（這一列只是拿來看）才用欄位數決定。
// 這一組必須涵蓋所有欄位數，不能留下查不到答案的區間——先前是「4 欄以內 → 表格、
// 10 欄以上 → 卡片」，5–9 欄沒有歸屬，而禮物卡正好是 9 欄。
const MOBILE_TIEBREAK = [
  ['4 欄以內又短', '<strong>表格</strong>', '本來就塞得下，換成卡片反而更長'],
  ['5–9 欄', '<strong>表格 ＋ 橫向捲動</strong>', '上面四條都不符合，代表這一列只是拿來看——捲一下就看得到，拆成卡片只是把頁面拉長'],
  ['10 欄以上', '<strong>卡片</strong>', '橫向捲動超過一個螢幕寬，欄位和操作不會同時在畫面上——會員列表 13 欄、風控審核 17 欄都是這一型'],
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

// 欄位對齊。判準是「這一欄要拿來做什麼」，不是「它是文字還是數字」——
// UID 是數字卻要靠左（拿來比對不是比大小），營收佔比是百分比卻要靠右（要比大小）。
const ALIGN_DECISION = [
  ['名稱、帳號、代號、說明、IP、設備指紋', '<strong>靠左</strong>',
    '長度不一的字串，要從第一個字開始比對。靠左讓每一列的起點落在同一條垂直線上，眼睛沿著它往下掃'],
  ['金額、筆數、百分比、比率', '<strong>靠右</strong>',
    '個位數對齊之後，位數多寡就等於數字大小，不必一個一個讀。置中會讓 9,860 看起來和 128,420 一樣長'],
  ['狀態、標籤、幣別、層級、日期時間、操作鈕', '置中',
    '短、等寬，既不從頭讀也不比大小，只是辨識。窄欄置中看起來最穩'],
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
    {
      heading: '欄位對齊',
      body: `<p class="component-description">判準是<strong>「這一欄要拿來做什麼」</strong>，不是「它是文字還是數字」。UID 是數字卻靠左（拿來比對，不是比大小）；營收佔比是百分比卻靠右（要比大小）。</p>
        ${decisionTable(ALIGN_DECISION, ['這一欄是什麼', '怎麼對齊', '為什麼'])}
        <p class="component-description"><strong>欄名一律置中</strong>，不跟著內容跑。<code>align</code> 只設定這一欄的<strong>內容</strong>；表頭由共用樣式統一置中，<code>dataTable()</code> 不會把 <code>align</code> 寫進 <code>&lt;th&gt;</code>。一排表頭如果跟著內容出現置中、靠左、靠右三種，看起來就像沒對齊。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>整張表全部置中。金額置中之後位數對不齊，要比大小只能一個一個讀；帳號置中之後每一列的起點都不一樣，掃不下去。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>照用途分三種。同一個欄位在不同頁面要一致——「上層代理」在會員列表與審核頁都是帳號，兩邊都靠左。</p></div>
        </div>
        <h4>第一欄沒有特權</h4>
        <p class="component-description">「第一欄」不是一種對齊理由，它一樣照上面的判準走。營收報表的維度欄會跟著頁籤換內容——「總營收」是日期，等寬，<strong>置中</strong>；「遊戲商」「單一遊戲」是長度不一的名稱，<strong>靠左</strong>。
        同一欄在不同頁籤下對齊不同是對的：那是四張不同的表，欄名也跟著換，使用者不會拿它們互相對照。</p>
        <p class="component-description">真正不照判準走的只有兩個，它們不是資料欄而是在替整列命名：<strong>合計列的標籤欄</strong>與<strong>權限矩陣的首欄</strong>，兩個都靠左。</p>`,
    },
    { heading: '什麼時候要分頁', body: decisionTable(DECISION) },
    {
      heading: '手機版：卡片還是表格',
      body: `<p class="component-description">判準是<strong>「這一列要用來讀，還是用來比」</strong>——不是看欄位多少。要讀完一整筆才能做決定的改成卡片；要跨列比同一個欄位的維持表格。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}手機不得精簡欄位</h4><p>桌機有十個欄位，手機就要有十個。<strong>不存在「手機只放關鍵欄、其餘點開抽屜看」這種做法</strong>——省掉的欄位在手機上就等於查不到，使用者得換一台電腦才查得到同一筆資料。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}換排法，不換資訊量</h4><p>表格與卡片是同一份資料的兩種<strong>排法</strong>，不是兩種<strong>詳細程度</strong>。欄位多就讓卡片長一點，或把關係相近的兩欄併成一格（風控審核的「異動前／後餘額」）——併是為了讀得順，不是為了少放。</p></div>
        </div>
        <h4>主判準：這一列要做什麼</h4>
        <p class="component-description">依序往下看，<strong>第一個符合的就是答案</strong>，不必再往下讀。</p>
        ${decisionTable(MOBILE_DECISION, ['情境', '手機上怎麼呈現', '為什麼'])}
        <h4>四條都不符合時，才看欄位數</h4>
        <p class="component-description">代表這一列只是拿來看，沒有要判斷也沒有要比對。欄位數只是輔助，不會凌駕上面四條——禮物卡 9 欄，但它列上有「作廢」這種不可逆操作，所以走第二條用卡片，不是走這裡。</p>
        ${decisionTable(MOBILE_TIEBREAK, ['欄位數', '手機上怎麼呈現', '為什麼'])}
        <h4>同一份資料的兩種排法</h4><p class="component-description">下面是同一批列。桌機兩種並排著看得出差別；實際頁面上同一時間只會出現一種，由上面的判準決定。</p><div class="table-mobile-compare"><div><h5>表格</h5>${dataTable({ name: 'members-compare', columns: COLUMNS, rows: rows(), pagination: false })}</div><div><h5>卡片</h5>${mobileCards()}</div></div><div class="guide-pair"><div class="is-bad"><h4>${icon('cancelCircle')}不要一律改卡片</h4><p>報表拆成卡片就沒辦法上下對齊比數字，合計列也沒有地方放；有勾選的批量頁改成卡片之後，「全選本頁」與連續勾選都會變難。</p></div><div class="is-good"><h4>${icon('checkCircle')}兩種都要，而且有規則</h4><p>卡片與表格都用共用元件（<code>dataCards()</code> 與 <code>dataTable()</code>），吃同一份資料。要切換的是呈現方式，不是重寫一頁。</p></div></div>`,
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
    ['表頭底色', 'var(--surface-head) #E9EDF4'],
    ['表頭文字', 'var(--text-subtle) #56637A / 12px'],
    ['表頭內距', '8px 12px'],
    ['內容內距', '8px 12px'],
    ['表頭對齊', '一律置中，不跟著內容'],
    ['表頭換行', '不換行，塞不下改橫向捲動'],
    ['表頭分隔線', '1px var(--line-strong)（比內容的 #EDF0F4 深一階）'],
    ['內容對齊', '依用途：名稱帳號靠左、金額靠右、其餘置中'],
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
