// 側欄與路由的一致性檢查：node nav-check.cjs
//
// 側欄重整之後最容易壞的是「有項目但沒路由」或「有路由但點不到」，
// 而這兩種壞法在畫面上都只是點了沒反應，不會報錯。這支把它們擋下來。
const fs = require('fs')
const assert = require('node:assert/strict')

const html = fs.readFileSync('index.html', 'utf8')
const ok = label => console.log('  ✓ ' + label)

// --- 側欄項目 ---
const navKeys = [...html.matchAll(/data-route-key="([^"]+)"/g)].map(m => m[1])
assert.equal(new Set(navKeys).size, navKeys.length, '側欄有重複的 data-route-key')

// --- 路由 ---
const routeBlock = html.slice(html.indexOf('const routes = {'), html.indexOf('};', html.indexOf('const routes = {')))
const routeKeys = [...routeBlock.matchAll(/^\s{8}([^\s:]+):/gm)].map(m => m[1])
assert.equal(new Set(routeKeys).size, routeKeys.length, '路由有重複的 key')

// --- 兩邊必須完全對得上 ---
const missingRoute = navKeys.filter(k => !routeKeys.includes(k))
const unreachable = routeKeys.filter(k => !navKeys.includes(k))
assert.deepEqual(missingRoute, [], '側欄項目沒有對應路由（點了沒反應）：' + missingRoute.join('、'))
assert.deepEqual(unreachable, [], '路由在側欄點不到：' + unreachable.join('、'))
ok(`${navKeys.length} 個側欄項目與路由一一對應`)

// --- 路由指向的 render 函式必須真的有人定義 ---
const renderers = [...routeBlock.matchAll(/window\.(\w+)\(\)/g)].map(m => m[1])
const sources = fs.readdirSync('.').filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(f, 'utf8')).join('\n')
const undefinedFns = [...new Set(renderers)].filter(fn => !new RegExp(`window\\.${fn}\\s*=`).test(sources))
assert.deepEqual(undefinedFns, [], '路由指向不存在的函式：' + undefinedFns.join('、'))
ok(`${new Set(renderers).size} 個 render 函式都有定義`)

// --- 工作區頁籤只能指向存在的路由 ---
const tabKeys = [...html.matchAll(/data-page="([^"]+)"/g)].map(m => m[1])
const badTabs = tabKeys.filter(k => !routeKeys.includes(k))
assert.deepEqual(badTabs, [], '工作區頁籤指向不存在的路由：' + badTabs.join('、'))
ok(`${tabKeys.length} 個工作區頁籤都指向有效路由`)

// --- 著陸頁必須存在 ---
const landing = html.match(/routes\["([^"]+)"\]\[2\]\(\)/)
assert.ok(landing, '找不到著陸頁設定')
assert.ok(routeKeys.includes(landing[1]), `著陸頁「${landing[1]}」沒有對應路由`)
// 真正開啟的那一頁是模組載入後的那次 click（inline script 只是首次繪製），
// 兩者必須指向同一個路由，否則開站會先閃一下別的頁面。
const bootSource = fs.readFileSync('settings-demo.js', 'utf8')
const bootClick = bootSource.match(/data-route-key="([^"]+)"\]'\)\?\.click\(\)/)
assert.ok(bootClick, 'settings-demo.js 找不到開站時的 click')
assert.equal(bootClick[1], landing[1], '模組載入後開啟的頁面與 inline script 的著陸頁不一致')

// 第一個工作區頁籤要是著陸頁，而且標了 active
const firstTab = html.match(/<button data-page="([^"]+)"([^>]*)>/)
assert.ok(firstTab, '找不到工作區頁籤')
assert.equal(firstTab[1], landing[1], '第一個工作區頁籤不是著陸頁')
assert.ok(firstTab[2].includes('active'), '第一個工作區頁籤沒有標 active')
ok('著陸頁「' + landing[1] + '」：路由、開站 click 與第一個工作區頁籤三處一致')

// --- 側欄是單一平鋪清單，不用分類標題 ---
assert.equal(html.match(/nav-section-title|nav-group-title/), null, '側欄不應再有分類標題')
const navBlocks = html.match(/<nav class="nav[^"]*">/g) || []
assert.equal(navBlocks.length, 1, '側欄應該只有一個 nav，項目全部平鋪')
ok('側欄為單一平鋪清單，無分類標題')
// --- 拆頁之後，index.html 不該再留下整頁的元件規範內容 ---
assert.ok(!html.includes('const buttonGuide'), 'index.html 仍留著舊的 buttonGuide')
assert.ok(!html.includes('const inputStandardPage'), 'index.html 仍留著未被引用的 inputStandardPage')
ok('index.html 已無拆走的規範頁死碼')

console.log('\nPASS: 側欄與路由（對應、函式、頁籤、著陸頁、分群）')
