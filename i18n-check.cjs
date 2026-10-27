// 多語系不破版的回歸檢查：node i18n-check.cjs
//
// 正式後台有 9 個語系，同一個欄名在高棉文可以是繁中的 8 倍長。破版的方式永遠是
// 同兩種，而且在繁中環境下完全看不出來：
//   1. 文字容器被釘死寬或高 —— 字一長就溢出，或第二行被裁掉
//   2. white-space: nowrap 沒有出路 —— 既不換行也不省略，直接撐破容器
// 這支把它們擋下來。規範在「設計 Token → 多語系」。
const fs = require('fs')
const assert = require('node:assert/strict')
const ok = label => console.log('  ✓ ' + label)

const files = [
  ...fs.readdirSync('.').filter(f => f.endsWith('.css')),
  ...fs.readdirSync('styles').map(f => 'styles/' + f),
]
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
const sources = Object.fromEntries(files.map(f => [f, strip(fs.readFileSync(f, 'utf8'))]))

// --- 1. 會裝翻譯文字的容器不得寫死高度 ---
//
// 只列「整塊都是文字、而且文字來自字典」的那些。輸入框、按鈕與分頁鈕不在內：
// 它們的高度是從 --btn-content ＋ 內距推算出來的固定值，那是刻意的對齊基準
// （AGENTS：全站只有一個 34px），不是沒想過就寫死。
// 刻意保留固定高度的例外。每一條都要寫清楚為什麼——寫不出理由就不能放行。
const HEIGHT_ALLOWED = {
  'styles/mobile-wrapped-static-navigation-and-actions.css|.quick-tabs':
    '手機版那一疊（topbar → 頁籤列 → 搜尋開關 → 內容）的位置全部從 --quick-tabs-h-mobile 算出來，一換行下面每一層都會錯位、捲動的內容會從縫裡穿過去。手機改用單行橫向捲動吸收長頁名。',
  'styles/mobile-wrapped-static-navigation-and-actions.css|.quick-tabs button':
    '同上：手機的頁籤是單行捲動，按鈕高度必須貼齊那一列的固定高度。',
}

const TEXT_BOXES = [
  ['.nav-item', '側欄導覽項目'],
  ['.quick-tabs', '工作區頁籤列'],
  ['.quick-tabs button', '工作區頁籤'],
  ['.filter-field > label', '篩選列的欄位標籤'],
  ['.guide-field > label', '表單的欄位標籤'],
  ['.bo-tag', '標籤'],
]
const usedHeight = new Set()
{
  const bad = []
  for (const [selector, label] of TEXT_BOXES) {
    for (const [file, src] of Object.entries(sources)) {
      // 抓這個 selector 的每一個宣告區塊（可能散在好幾支覆寫檔裡）
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(^|[,}])\\s*${escaped}\\s*(,[^{]*)?\\{([^}]*)\\}`, 'gm')
      for (const match of src.matchAll(re)) {
        const body = match[3]
        const height = body.match(/(?:^|[;\s])height\s*:\s*([^;]+)/)
        const key = `${file}|${selector}`
        if (height && HEIGHT_ALLOWED[key]) { usedHeight.add(key); continue }
        if (height && !/auto|inherit|100%|fit-content/.test(height[1])) {
          bad.push(`${file}：${label}（${selector}）寫死 height: ${height[1].trim()}，長語系換兩行會被裁掉；改用 min-height`)
        }
      }
    }
  }
  assert.deepEqual(bad, [], '文字容器被釘死高度：\n  ' + bad.join('\n  '))
  const stale = Object.keys(HEIGHT_ALLOWED).filter(k => !usedHeight.has(k))
  assert.deepEqual(stale, [], '高度放行清單有已經不適用的條目，請刪除：\n  ' + stale.join('\n  '))
  ok(`${TEXT_BOXES.length} 個裝翻譯文字的容器都用 min-height（${usedHeight.size} 個具名例外：手機固定列）`)
}

// --- 2. 側欄寬度只有一個來源 ---
{
  const owner = 'styles/base.css'
  assert.ok(sources[owner].includes('--sidebar-w:'), 'styles/base.css 缺少 --sidebar-w')
  const leaked = []
  for (const [file, src] of Object.entries(sources)) {
    src.split('\n').forEach((line, i) => {
      if (!/15\.5rem/.test(line)) return
      if (file === owner && line.includes('--sidebar-w:')) return
      if (/minmax\(/.test(line)) return // 格線的最小欄寬，與側欄無關
      leaked.push(`${file}:${i + 1} ${line.trim()}`)
    })
  }
  assert.deepEqual(leaked, [], '側欄寬度要用 var(--sidebar-w)，不要再寫一次數值：\n  ' + leaked.join('\n  '))
  ok('側欄寬度只在 --sidebar-w 定義一次')
}

// --- 3. nowrap 一定要有出路 ---
//
// 出路有三種：自己有 text-overflow、外層容器允許換行、或者「本來就不該換行也不該截斷」
// （按鈕與表頭——截斷比換行糟得多，塞不下由容器換行或橫向捲動吸收）。
// 第三種要列在這裡並寫明理由，不得默默放行。
const NOWRAP_ALLOWED = {
  'styles/semantic-button-system.css|.semantic-btn': '按鈕文字不得截斷也不得折行；放不下由工具列換行吸收，不縮按鈕',
  'styles/quick-tabs-and-grid-alignment.css|.quick-tabs button': '頁名是使用者辨認「我開了哪一頁」的唯一線索，截斷後兩個頁籤會長得一樣；整列已改成可換行',
  'styles/unified-table-system.css|.bo-modal th': '欄名截斷等於這一欄沒有名字，塞不下由 .table-wrap 橫向捲動吸收',
  'tabs.css|.bo-tab': '同按鈕：頁籤文字不截斷，一列放不下改用 scroll 或 select 變化',
  'tag-guide.css|.bo-tag': '狀態名截斷就認不出來了；標籤本來就該是短詞，長了讓它自己變寬',
  'bulk-actions.css|.bulk-menu button': '選單項目是動作名稱，截斷會讓兩個動作看起來一樣；選單寬度由內容決定',
  'date-picker.css|.bo-date-range-popper .el-picker-panel__footer .el-button': '面板的確認／取消是按鈕，同上',
  'data-table.css|.page .data-table-grid .data-table-foot-label': '合計列的標籤欄，短詞且整列只有一個',
  'example-list.css|.example-progress-cell > span': '進度數字，不翻譯',
  'example-list.css|.example-nowrap': '表格內的短欄位（代號、幣別），不翻譯',
  'example-member.css|.example-member-page .example-amount': '金額，不翻譯',
  'example-report.css|.example-amount': '金額，不翻譯',
  'choice-controls.css|.choice-control.is-control-only>span': '視覺隱藏的報讀器文字（clip），不顯示在畫面上',
  'data-table.css|.page .data-table-grid caption': '同上，視覺隱藏的表格說明',
  'message.css|.bo-message-live': '同上，常駐的 live region',
}
{
  const unresolved = []
  const used = new Set()
  for (const [file, src] of Object.entries(sources)) {
    const re = /([^{}]+)\{([^}]*white-space\s*:\s*nowrap[^}]*)\}/g
    for (const match of src.matchAll(re)) {
      const selector = match[1].split('\n').pop().trim().replace(/^[,}]\s*/, '')
      const body = match[2]
      if (/text-overflow\s*:\s*ellipsis/.test(body)) continue
      const key = `${file}|${selector}`
      if (NOWRAP_ALLOWED[key]) { used.add(key); continue }
      unresolved.push(`${file}：${selector} 有 nowrap 但既沒有 text-overflow，也不在放行清單裡`)
    }
  }
  assert.deepEqual(unresolved, [], 'nowrap 沒有出路（長語系會直接撐破容器）：\n  ' + unresolved.join('\n  ') +
    '\n  → 加 text-overflow: ellipsis（並配 Tooltip），或讓外層容器換行，或列進 NOWRAP_ALLOWED 並寫明理由')
  const stale = Object.keys(NOWRAP_ALLOWED).filter(k => !used.has(k))
  assert.deepEqual(stale, [], '放行清單有已經不存在的條目，請刪除：\n  ' + stale.join('\n  '))
  ok(`nowrap 全部有出路：${used.size} 處列在放行清單（按鈕、表頭、數字、報讀器文字），其餘都有省略號`)
}

// --- 4. 長字串模式要掛在進入點上 ---
{
  const boot = fs.readFileSync('settings-demo.js', 'utf8')
  assert.ok(boot.includes("./longtext.js"), 'settings-demo.js 沒有載入 longtext.js，?longtext 會失效')
  ok('長字串模式（?longtext）已掛在進入點')
}

console.log('\nPASS: 多語系不破版（文字容器不寫死高度、側欄寬度單一來源、nowrap 有出路、長字串模式可用）')
