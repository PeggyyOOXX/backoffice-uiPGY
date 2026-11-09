// 模組是不是真的載得到。
//
// 這一條是為了擋住這種事：刪掉一支頁面，順手帶走了某個共用元件唯一的 import。
// 2026-11-09 刪掉「內容編輯 Editor」時就發生過——editor-guide.js 是全站唯一
// `import './table-sort.js'` 的地方，而 table-sort.js 定義 window.tableSortExamples，
// 表格規範頁會呼叫它。刪完之後表格頁一點就丟 TypeError，標題換了但內容停在上一頁。
//
// 其他檢查抓不到的原因：render-check.cjs 是用檔名逐一 run() 模組的，全域一直都在，
// 它不走真實的 import 鏈。這裡反過來，只從 index.html 的 <script type="module"> 出發，
// 照 import 一層層走，走得到才算載得到。
const fs = require('fs')
const path = require('path')
const assert = require('node:assert/strict')

const ok = label => console.log('  ✓ ' + label)

// 走不到也沒關係的檔案：不是瀏覽器端的模組
const NOT_SHIPPED = new Set(['vite.config.js'])

const html = fs.readFileSync('index.html', 'utf8')

// --- 1. 從真實進入點走 import 鏈 ---
const entries = [...html.matchAll(/<script type="module" src="\/([^"]+)"/g)].map(m => m[1])
assert.ok(entries.length, 'index.html 找不到任何 <script type="module">')

const reachable = new Set()
for (const entry of entries) {
  const walk = f => {
    if (reachable.has(f) || !fs.existsSync(f)) return
    reachable.add(f)
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(/from\s+'\.\/([^']+)'|import\s+'\.\/([^']+)'/g)) {
      const dep = m[1] || m[2]
      if (dep.endsWith('.js')) walk(dep)
    }
  }
  walk(entry)
}

const allModules = fs.readdirSync('.').filter(f => f.endsWith('.js'))
const reachableSrc = [...reachable].map(f => fs.readFileSync(f, 'utf8')).join('\n')

// --- 2. 路由指到的 render 函式，一定要由「走得到的」模組定義 ---
//
// index.html 的 inline script 是 classic script，拿不到模組的匯出，所以路由一律寫成
// () => window.renderXxx()。那個全域只有模組會掛上去——模組沒被載入，點下去就是 TypeError。
{
  const routeFns = [...new Set([...html.matchAll(/window\.(render[A-Za-z0-9_]+)\(\)/g)].map(m => m[1]))]
  assert.ok(routeFns.length, 'index.html 找不到任何 window.renderXxx() 路由')
  const missing = routeFns.filter(fn =>
    !new RegExp('window\\.' + fn + '\\s*=').test(reachableSrc))
  assert.deepEqual(missing, [], '路由指到的 render 函式沒有任何「載得到的」模組會定義它：\n  '
    + missing.join('\n  ')
    + '\n  → 定義它的那支模組沒被 index.html 的進入點（直接或間接）載入。'
    + '點下側欄會換標題但內容停在上一頁。')
  ok(`${routeFns.length} 個路由的 render 函式都由載得到的模組定義`)
}

// --- 3. 走不到的模組，不得有人在用它掛上去的全域 ---
{
  const orphans = allModules.filter(f => !reachable.has(f) && !NOT_SHIPPED.has(f))
  const broken = []
  for (const file of orphans) {
    const src = fs.readFileSync(file, 'utf8')
    const globals = [...new Set([...src.matchAll(/window\.([A-Za-z0-9_]+)\s*=/g)].map(m => m[1]))]
    for (const name of globals) {
      if (new RegExp('window\\.' + name + '\\s*\\(').test(reachableSrc)
        || new RegExp('window\\.' + name + '\\s*\\(').test(html)) {
        broken.push(`${file} 定義的 window.${name} 有人在呼叫，但這支模組沒有人 import`)
      }
    }
  }
  assert.deepEqual(broken, [], '有模組載不到卻被依賴：\n  ' + broken.join('\n  ')
    + '\n  → 共用元件要由進入點（settings-demo.js）直接 import，'
    + '不要掛在別的頁面的 import 鏈上——那支頁面一被刪就會一起消失。')
  ok(`${allModules.length} 支模組，${reachable.size} 支從進入點走得到；走不到的沒有被依賴`)
}

console.log('\nPASS: 模組載得到（路由的 render 函式、共用元件的全域都在 import 鏈上）')
