// 移植：SearchForm.vue（正式後台 65 / 72 個 view 在用，是除了按鈕與表格以外最常用的東西）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 它不是「一張表單」而是「一列查詢條件」：送出不會改資料，只會換一份結果；
// 所以它的規則跟表單不一樣——不必擋著不讓走、重設是常態操作、而且會被反覆使用。
//
// 示範**直接套用組合範例－搜尋那一套 class**（.source-filter / .source-filter-grid /
// .filter-field / .control），不是另外抄一份。理由同 nav-guide.js 的側欄示範：
// 規範頁的參照物自己不照規範寫，比沒有示範更糟。先前這一頁用 .search-demo-* 自己
// 畫了一組 200px 欄位，連下拉與日期都是用 div 假造的——那正是 dup-check 要擋的事。
//
// 正式後台有三處是原型改掉的，頁面上都有標明：搜尋與重設改成帶文字的語意按鈕、
// 收合鈕要有文字且自成一列、按鈕順序與位置固定（重設在前、搜尋在後、靠右）。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './guide-page.css'
import './search-guide.css'

// 欄位照組合範例－搜尋的順序與型別做，只是把後三個標成進階條件，
// 示範「預設收合、展開才看得到」這件事。
const basicFields = () => `
  <div class="filter-field">
    <label for="sf-platform">平台名稱</label>
    <select id="sf-platform" class="control guide-select"><option>101 BEST</option><option>DEMO03</option></select>
  </div>
  <div class="filter-field">
    <label for="sf-type">會員搜尋</label>
    <select id="sf-type" class="control guide-select"><option>會員帳號</option><option>UID</option><option>手機號碼</option></select>
  </div>
  <div class="filter-field">
    <label for="sf-keyword">會員搜尋關鍵字</label>
    <input id="sf-keyword" class="control" placeholder="請輸入關鍵字" maxlength="40">
  </div>
  <div class="filter-field">
    <label for="sf-agent">代理帳號</label>
    <input id="sf-agent" class="control" placeholder="請輸入代理帳號" maxlength="20">
  </div>
  <div class="filter-field">
    <label for="sf-status">會員狀態</label>
    <select id="sf-status" class="control guide-select"><option>全部狀態</option><option>啟用</option><option>停用</option></select>
  </div>
  <div class="filter-field">
    <label id="sf-date-label">註冊時間</label>
    <div class="date-range-host" data-date-range data-max-days="90" aria-labelledby="sf-date-label"></div>
  </div>`

// 進階條件：同樣是 .filter-field，只是多一個 data-search-advanced 讓它可以被收起來。
// 收起來用的是 hidden 屬性而不是另一個 class——報讀器也要跟著看不到。
const advancedFields = () => `
  <div class="filter-field" data-search-advanced hidden>
    <label for="sf-level">會員等級</label>
    <select id="sf-level" class="control guide-select"><option>全部等級</option><option>VIP 1</option><option>VIP 2</option></select>
  </div>
  <div class="filter-field" data-search-advanced hidden>
    <label for="sf-tags">會員標籤</label>
    <select id="sf-tags" class="control guide-select" multiple data-collapse="2" data-clearable>
      <option>一般會員</option><option>關注會員</option><option>高價值</option><option>新註冊</option>
    </select>
  </div>
  <div class="filter-field amount-range-field" data-search-advanced hidden>
    <label for="sf-amount-min">最低／最高金額</label>
    <div class="amount-range-control">
      <input id="sf-amount-min" class="control amount" placeholder="最低" aria-label="最低金額" inputmode="decimal">
      <span>～</span>
      <input class="control amount" placeholder="最高" aria-label="最高金額" inputmode="decimal">
    </div>
  </div>`

const advancedToggle = (open = false) =>
  `${icon(open ? 'arrowUp' : 'arrowDown', 16)}${open ? '收合進階條件' : '展開進階條件'}`

const barDemo = () => `<form class="source-filter card example-filter" data-search-demo onsubmit="return false">
  <div class="source-filter-grid">
    ${basicFields()}
    ${advancedFields()}
    <div class="source-filter-actions">
      <button type="button" class="semantic-btn btn-neutral">${icon('reset')}重設</button>
      <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
    </div>
  </div>
  <div class="source-filter-more">
    <button type="button" class="semantic-btn btn-neutral outline" data-search-advanced-toggle aria-expanded="false">${advancedToggle()}</button>
  </div>
</form>`

// 收合是真的會動的：規範頁上放一顆按不動的按鈕，等於在示範一件規範禁止的事
//（「權限控制」那一頁才剛寫過「不留按不動的按鈕」）。
onMatch('click', '[data-search-advanced-toggle]', (event, button) => {
  const form = button.closest('[data-search-demo]')
  if (!form) return
  const open = button.getAttribute('aria-expanded') !== 'true'
  form.querySelectorAll('[data-search-advanced]').forEach(field => { field.hidden = !open })
  button.setAttribute('aria-expanded', String(open))
  button.innerHTML = advancedToggle(open)
}, { owner: 'search-guide' })

const TYPES = [
  ['文字比對（帳號、UID、訂單號）', '<code>input</code>', '可設 maxLength；不做即時搜尋，按下搜尋才查'],
  ['固定選項（狀態、幣別、層級）', '<code>select</code>', '超過十項加可搜尋，多選收合標籤，詳見「下拉選單 Dropdown」'],
  ['分類很多的選項（遊戲商 → 遊戲）', '<code>selectGroup</code>', '用 optgroup 分組，分類標題不可選'],
  ['時間區間', '<code>date</code>', '共用日期元件，七個快捷區間，天數上限用 data-max-days 在日曆上就擋住'],
  ['金額區間', '<code>amountInput</code>', '14 位整數、2 位小數，是否可負由欄位決定，詳見「輸入框 Input」'],
]

const PLACEMENT = [
  ['每次查都會用到', '<strong>基本條件</strong>', '會員帳號、狀態、時間區間——打開頁面就看得到，不用多點一次'],
  ['偶爾才用', '<strong>進階條件</strong>', '收在摺疊區裡。預設收合，但只要有任何一個進階條件有值就自動展開'],
  ['只有特定角色用得到', '進階條件', '不要為了少數人把常用條件擠下去'],
  ['切換「看哪一批資料」', '不是條件，是<strong>頁籤</strong>', '待審／已通過／已拒絕是三份清單，不是同一份清單的篩選'],
  ['改變結果的排序', '不是條件，是<strong>表頭排序</strong>', '排序掛在欄位上，不佔篩選列的位置'],
]

window.renderSearchPage = () => guidePage({
  slug: 'search',
  title: '搜尋篩選列 SearchForm',
  intro: '列表頁最上面那一列查詢條件。正式後台是 <code>SearchForm.vue</code>，<strong>65 / 72 個 view</strong> 在用——除了按鈕與表格以外最常用的東西。頁面只宣告一個 config，欄位型別、寬度、是否收進進階全部寫在裡面，不自己兜版面。',
  sections: [
    {
      heading: '一列篩選列的組成',
      body: `${barDemo()}
        <p class="component-description">上面這一列<strong>就是組合範例－搜尋在用的那一套</strong>（<code>.source-filter</code> / <code>.source-filter-grid</code> / <code>.filter-field</code> / <code>.control</code>），不是為了規範頁另外畫的。下拉、日期、多選標籤也都是真的共用元件，點得開、選得動——規範頁的參照物自己不照規範寫，比沒有示範更糟。</p>
        <p class="component-description">版面是一張格線，欄數隨寬度變：<strong>≥1181px 6 欄、≤1180px 3 欄、≤900px 2 欄、≤720px 1 欄</strong>，欄距 8px。篩選列是密集列，所以欄距比頁面格線的 16px 窄一階。欄位從左排到右、滿了就換行，需要更寬的欄位（金額區間）由欄位自己的樣式撐開，不逐一指定寬度。</p>
        <p class="component-description">標籤在欄位上方，12px／650／<code>--text-muted</code>，與「表單 Form」同一條規則。<strong>不得為了排整齊把標籤藏起來只留 placeholder</strong>：placeholder 在填了值之後就消失，使用者回頭看不出這一格是什麼條件。</p>`,
    },
    {
      heading: '按鈕：重設、搜尋，位置固定',
      body: `<div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>搜尋與重設只放一個圖示（放大鏡、迴轉箭頭），而且<strong>位置會跑</strong>——正式後台沒有進階條件時按鈕接在欄位後面，有進階條件時變成整列置中。同一個後台裡同一顆按鈕出現在兩個地方。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>帶文字的語意按鈕，<strong>重設（<code>btn-neutral</code>）在前、搜尋（<code>btn-search</code>）在後</strong>，固定在格線最後一欄、靠右對齊並貼齊欄位底線。次要在前、主要在後，與彈窗 footer 同一條規則。</p></div>
        </div>
        <p class="component-description"><strong>這兩條是原型改掉的。</strong>純圖示只適合表格操作欄那種「同一列重複出現、靠位置就認得出來」的場合；篩選列的搜尋是整頁最重要的一次操作，不該讓人去猜放大鏡是「搜尋」還是「展開更多條件」。按鈕位置則是直接的不一致，沒有理由保留。</p>
        <p class="component-description">匯出、新增之類的動作<strong>不放在篩選列</strong>，放在表格外的列表工具列——它們操作的是「結果」，不是「條件」。</p>`,
    },
    {
      heading: '基本條件與進階條件',
      body: `${decisionTable(PLACEMENT, ['這個條件', '放哪裡', '為什麼'])}
        <p class="component-description">收合鈕<strong>要有文字</strong>（「展開進階條件」／「收合進階條件」）並<strong>自成一列</strong>放在篩選卡底部靠左，不要塞進右下角的按鈕群組——它是對整張篩選卡的操作，不是一個查詢動作，而且那一格只有六分之一欄寬，三顆按鈕擠進去會溢出。正式後台把它做成一顆絕對定位在右上角的圓形箭頭，那顆箭頭不說自己會展開什麼，還會跟右上角其他東西搶位置。</p>
        <p class="component-description">收起來時用 <code>hidden</code> 屬性，不是只把視覺藏掉——報讀器與 Tab 鍵也要跟著看不到，否則焦點會跑進一個看不見的欄位。</p>
        <p class="component-description"><strong>有值就自動展開。</strong>使用者設了進階條件、換頁回來卻看到收合的篩選列，會以為條件被清掉了；反之，收合狀態下仍然生效的條件等於隱形的篩選，查不到資料時完全看不出原因。</p>`,
    },
    {
      heading: '五種欄位型別',
      body: `${decisionTable(TYPES, ['要查什麼', 'type', '規則在哪一頁'])}
        <p class="component-description">欄位本身的外觀、互動與狀態一律由各自的規範頁決定，篩選列不另設樣式：高度 34px、字級在手機維持 16px（iOS Safari 對 16px 以下的輸入欄位會在聚焦時自動放大整頁）。</p>
        <p class="component-description">欄位可以帶前綴或後綴（單位、說明圖示）。說明用 Tooltip 掛在 <code>info</code> 圖示上，<strong>只放補充說明</strong>——必要資訊不能藏在 Tooltip 裡。</p>`,
    },
    {
      heading: '送出、重設與自動刷新',
      body: `<p class="component-description"><strong>按下搜尋才查，不做邊打邊查。</strong>條件通常不只一個，邊打邊查會在使用者還沒設完第二個條件時就先送出一次請求，而且列表會在輸入過程中不斷跳動。送出前先驗證（例如查詢區間超過上限），沒過就不送。</p>
        <p class="component-description"><strong>重設是回到預設值，不是清空。</strong>有預設值的欄位（狀態＝全部、區間＝本月）要回到預設，不是變成空白；重設後要自動查一次，不要讓使用者再按一次搜尋。</p>
        <p class="component-description">需要盯即時變化的頁面（審核、待辦）可以加<strong>自動刷新開關</strong>：預設關閉，開啟後每 15 秒重查一次並顯示倒數秒數。離開頁面要清掉計時器；有彈窗開著時暫停——資料在使用者讀的時候被抽換是最糟的。開關沿用共用 Switch，不另設尺寸。</p>`,
    },
    {
      heading: '手機版',
      body: `<p class="component-description">720px 以下篩選列<strong>整列收起來</strong>（<code>.source-filter</code> 預設 <code>display: none</code>），由 <code>filterToggle(panelId)</code> 提供一顆「搜尋條件」開關；展開時固定在整疊之下、欄位一列一個。不得讓篩選列在手機上沒有入口，也不得各頁自己寫一份開關。</p>
        <p class="component-description">收起來的時候要看得出<strong>目前有沒有套用條件</strong>——否則使用者只會看到一張查不到資料的空表格，卻不知道是條件擋住的。</p>
        <p class="component-description">這一頁的示範在手機上不會收起來，因為規範頁要讓人看到欄位本身怎麼堆疊；真實頁面一律收起。</p>`,
    },
  ],
  tokens: [
    ['欄數 ≥1181px', '6'],
    ['欄數 ≤1180px', '3'],
    ['欄數 ≤900px', '2'],
    ['欄數 ≤720px', '1（整列收起）'],
    ['欄距', '8px'],
    ['卡片內距', '8px 12px'],
    ['欄位高度', '34px（手機相同）'],
    ['欄位字級', '16px（手機不得更小）'],
    ['標籤', '12px / 650 / var(--text-muted)'],
    ['標籤與欄位間距', '4px'],
    ['按鈕位置', '格線最後一欄，靠右並貼齊欄位底線'],
    ['按鈕順序', '重設在前、搜尋在後'],
    ['收合鈕', '自成一列，靠左，含文字'],
    ['進階區預設', '收合（hidden）；有值則自動展開'],
    ['自動刷新間隔', '15 秒'],
  ],
  rules: [
    ['頁面只宣告 config，不自己兜版面', '65 個 view 共用同一支元件，版面一旦各寫各的就再也收不回來。'],
    ['示範要用真的那一套 class', '規範頁的參照物自己不照規範寫，比沒有示範更糟；也不得用 div 假造下拉與日期。'],
    ['標籤不得省略只留 placeholder', 'placeholder 填了值就消失，使用者回頭看不出這一格是什麼條件。'],
    ['搜尋與重設要有文字', '篩選列的搜尋是整頁最重要的一次操作，不該讓人猜放大鏡是搜尋還是展開更多條件。'],
    ['重設在前、搜尋在後、靠右', '次要在前、主要在後，與彈窗 footer 同一條規則；位置不隨有沒有進階條件而改變。'],
    ['收合鈕自成一列且有文字', '它是對整張篩選卡的操作，不是查詢動作；右下角那一格只有六分之一欄寬，塞三顆會溢出。'],
    ['收合用 hidden，不只是視覺藏起來', '報讀器與 Tab 鍵也要跟著看不到，否則焦點會跑進一個看不見的欄位。'],
    ['匯出不放篩選列', '匯出操作的是結果不是條件，放表格外的列表工具列。'],
    ['按下搜尋才查', '邊打邊查會在條件還沒設完時就送出請求，而且列表會在輸入過程中不斷跳動。'],
    ['重設是回到預設值', '有預設值的欄位要回到預設而不是空白，重設後自動查一次。'],
    ['進階條件有值就自動展開', '收合狀態下仍生效的條件等於隱形的篩選，查不到資料時看不出原因。'],
    ['自動刷新預設關閉', '開啟後顯示倒數；彈窗開著時暫停，離開頁面清掉計時器。'],
    ['手機一定要有入口', '720px 以下整列收起，用共用的 filterToggle()，不得各頁自己寫一份。'],
  ],
})
