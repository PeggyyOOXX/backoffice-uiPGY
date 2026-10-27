// 同一個元件的規範只能有一頁：node dup-check.cjs
//
// 重複最大的問題不是佔版面，是**兩邊樣式不一樣**——同一個元件在兩頁長得不同，
// 看的人不知道該照哪一個。Input 頁曾經自己畫了一套 Radio／Checkbox／Switch／下拉／
// 上傳／富文字，與各自的規範頁並存且寫法不同，就是這樣來的。
//
// 「使用」共用元件不算重複：分頁本來就含每頁筆數的下拉，上傳失敗要用 Toast 回報。
// 那些列在 ALLOWED 裡，每一條都要寫清楚為什麼。
const fs = require('fs')
const assert = require('node:assert/strict')

// 規範頁模組 → 它負責的元件
const OWNS = {
  'button-guide.js': ['button', 'iconButton'],
  'input-guide.js': ['input'],
  'date-picker-guide.js': ['datePicker'],
  'choice-guide.js': ['switch', 'radio', 'checkbox', 'choiceCard'],
  'upload-guide.js': ['upload'],
  'component-pages.js': ['tooltip', 'dialog'],
  'table-guide-page.js': ['table', 'tableSort', 'pagination'],
  'token-guide.js': ['token'],
  'nav-guide.js': ['sidebar', 'breadcrumb'],
  'header.js': ['popover', 'header'],
  'form-guide.js': ['form'],
  'search-guide.js': ['searchForm'],
  'sortable-guide.js': ['sortable'],
  'permission-guide.js': ['permission'],
  'progress-guide.js': ['progress'],
  'tag-guide.js': ['tag'],
  'steps-guide.js': ['steps'],
  'tabs-guide.js': ['tabs'],
  'select-advanced.js': ['select'],
  'state-guide.js': ['states'],
  'icon-guide.js': ['icon'],
  'message-guide.js': ['message', 'alert'],
  'bulk-guide.js': ['bulk'],
}

// 在原始碼裡認得出該元件的標記
const MARKERS = {
  iconButton: /icon-action/,
  input: /class="guide-input"/,
  select: /class="guide-select"|<select /,
  datePicker: /data-date-range|date-picker-guide/,
  switch: /standard-switch/,
  radio: /type="radio"|type: ?'radio'/,
  checkbox: /type="checkbox"|type: ?'checkbox'/,
  choiceCard: /choice-card/,
  upload: /upload-dropzone|點擊或拖曳/,
  table: /unified-table|table-guide-sample/,
  tableSort: /table-sort-control/,
  tooltip: /data-tooltip=/,
  dialog: /bo-modal|modal-example/,
  pagination: /page-btn/,
  tag: /bo-tag|guide-select-tag/,
  steps: /bo-steps|bo-step\b/,
  tabs: /bo-tab\b|tabs\(\{/,
  states: /emptyState|skeletonTable|loadingVeil/,
  bulk: /bulk-head|data-bulk-action/,
  header: /header-badge|header-popover-panel/,
  form: /form-demo-grid|form-demo-field/,
  searchForm: /data-search-advanced|source-filter-more/,
  sortable: /data-sort-handle|data-sort-item/,
  permission: /permission-demo-col|permission-demo-actions/,
  message: /bo-message\b|message\.(success|error|warning|info)/,
}

// 合理的跨頁使用：`檔案|元件` → 理由
const ALLOWED = {
  'upload-guide.js|message': '示範上傳失敗要怎麼回報——用共用 Toast 正是規範要求的做法',
  'select-advanced.js|datePicker': '篩選列的組合示範，呈現 Select 與其他欄位並排的實際樣子',
  'steps-guide.js|message': '最後一步送出後用共用 Toast 回報，正是規範要求的做法',
  'bulk-guide.js|message': '批量結果用共用 Toast 回報，正是這一頁的規範要求——先前那條常駐的回報列已隨「不給復原」一起移除',
  'steps-guide.js|input': '步驟示範是開站流程的表單，每一步本來就有欄位；不是另一套輸入規範',
  'steps-guide.js|switch': '開站流程的第 2、3 步就是一排開關，照正式後台的實際欄位做',
  'date-picker-guide.js|select': '純時間選擇（el-time-select）本來就是固定間隔選項的下拉，不是另一套 Select',
  'table-guide-page.js|iconButton': '表格的操作欄本來就放圖示按鈕，是真實列的樣子，不是另一套按鈕規範',
  'bulk-guide.js|dialog': '不可逆的批量動作一定要先確認，這個確認彈窗正是規範本身要求的東西；用的是共用的 prepareModal',
  'bulk-guide.js|switch': '示範批量調整開關欄位，開關本身沿用共用規範',
  'message-guide.js|dialog': '從 <dialog>.showModal() 裡發 Toast，是驗證 top layer 處理的關鍵示範',
  'header.js|select': '頁首的語系切換本來就是一個無框的原生 <select>，示範的是它在頁首的位置，不是另一套 Select 規範',
  'header.js|tooltip': '純圖示按鈕必須同時有 aria-label 與同文字的 Tooltip，這是圖示按鈕規範本身的要求',
  'form-guide.js|input': '表單規範講的是「一堆欄位怎麼排成一張表單」，示範當然要有欄位；欄位本身的外觀與狀態仍由「輸入框 Input」決定',
  'search-guide.js|select': '示範直接套組合範例－搜尋那一列的真實欄位，下拉是共用 Select；規範頁的參照物不能用 div 假造',
  'search-guide.js|datePicker': '同上，查詢區間用的是共用日期元件本體，示範的是它在篩選列上的位置與天數上限',
}

const owner = {}
for (const [file, comps] of Object.entries(OWNS)) for (const c of comps) (owner[c] = owner[c] || []).push(file)

const violations = []
const usedAllowances = new Set()

for (const file of Object.keys(OWNS)) {
  if (!fs.existsSync(file)) continue
  const src = fs.readFileSync(file, 'utf8')
  for (const [comp, pattern] of Object.entries(MARKERS)) {
    if (owner[comp]?.includes(file)) continue   // 自己負責的元件
    if (!pattern.test(src)) continue
    const key = `${file}|${comp}`
    if (ALLOWED[key]) { usedAllowances.add(key); continue }
    violations.push(`${file} 出現 ${comp} 的示範，但它的規範在 ${owner[comp]?.join('／') ?? '（無人負責）'}`)
  }
}

const ok = label => console.log('  ✓ ' + label)

assert.deepEqual(violations, [], '規範頁之間有重複的元件示範：\n  ' + violations.join('\n  '))
ok(`${Object.keys(OWNS).length} 個規範頁，沒有重複的元件示範`)

// 放行清單要保持精簡：不再成立的條目要刪掉，否則會慢慢變成擋不住東西的白名單
const stale = Object.keys(ALLOWED).filter(k => !usedAllowances.has(k))
assert.deepEqual(stale, [], '放行清單有已經不適用的條目，請刪除：' + stale.join('、'))
ok(`放行清單 ${usedAllowances.size} 條都仍然適用`)

// 每個元件都要有人負責，不能只出現在範例裡卻沒有規範頁
const unowned = Object.keys(MARKERS).filter(c => !owner[c])
assert.deepEqual(unowned, [], '以下元件沒有任何規範頁負責：' + unowned.join('、'))
ok(`${Object.keys(MARKERS).length} 個元件都有規範頁負責`)

console.log('\nPASS: 元件不重複（一個元件只有一頁規範）')
