// 側欄與路由的一致性檢查：node nav-check.cjs
//
// 側欄重整之後最容易壞的是「有項目但沒路由」或「有路由但點不到」，
// 而這兩種壞法在畫面上都只是點了沒反應，不會報錯。這支把它們擋下來。
const fs = require('fs')
const assert = require('node:assert/strict')

const html = fs.readFileSync('index.html', 'utf8')
const ok = label => console.log('  ✓ ' + label)

// --- index.html 的 inline script 要能 parse ---
//
// 側欄的 click handler 寫在那支 inline script 的最後面。script 只要有一個語法錯誤，
// 整支都不會執行：畫面看起來正常，但側欄完全不能換頁，而且主控台以外沒有任何線索。
// （實際踩過：把 memberRows[0].uid 換成 '1009821' 時，在單引號字串裡又塞了單引號。）
// 其他檢查都是直接呼叫模組的 render，從來沒有執行過這段 inline script，所以要在這裡擋。
{
  const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
  assert.ok(scripts.length, 'index.html 找不到 inline script')
  scripts.forEach((code, index) => {
    try {
      new Function(code)
    } catch (error) {
      assert.fail(`index.html 第 ${index + 1} 支 inline script 有語法錯誤：${error.message}`)
    }
  })
  ok(`${scripts.length} 支 inline script 都能 parse`)
}

// --- inline 事件呼叫的函式都要存在 ---
//
// onclick="foo()" 寫錯名字或函式被搬走都不會報錯，按下去才沒反應。
// 把頁面搬進模組時最容易漏掉這種（openReviewDetails 就被連帶刪掉過）。
{
  const inline = [...html.matchAll(/on(?:click|change|submit)="([a-zA-Z_$][\w$]*)\(/g)].map(m => m[1])
  const code = html + fs.readdirSync('.').filter(f => f.endsWith('.js'))
    .map(f => fs.readFileSync(f, 'utf8')).join('\n')
  const missing = [...new Set(inline)].filter(name =>
    !new RegExp(`function\\s+${name}\\b|window\\.${name}\\s*=|const\\s+${name}\\s*=`).test(code))
  assert.deepEqual(missing, [], 'inline 事件呼叫了不存在的函式：' + missing.join('、'))
  ok(`${new Set(inline).size} 個 inline 事件呼叫的函式都存在`)

// --- 模組呼叫的 window.X() 都要真的有人定義 ---
//
// 規範頁與組合範例彼此之間靠幾個掛在 window 上的函式溝通（render*、iconButtonGuide、
// openDetailDrawer 之類）。呼叫一個沒有人定義的名字不會在載入時報錯，
// 要等到那一頁被點開、render 當場拋出 TypeError——畫面上的表現是
// 「標題換了、內容沒換」，看起來像那一頁點不進去。
//
// （實際踩過：button-guide.js 寫了 window.iconButton()，但 icon-button.js
// 只掛了 window.iconButtonGuide，按鈕頁因此整頁點不開。
// 當時 render-check 沒抓到，是因為那支測試自己在 window 上補了 iconButton。）
{
  const BUILTIN = new Set([
    'addEventListener', 'removeEventListener', 'setTimeout', 'setInterval',
    'clearInterval', 'clearTimeout', 'matchMedia', 'getComputedStyle',
    'requestAnimationFrame', 'scrollTo', 'open', 'close', 'alert', 'confirm',
    'prompt', 'fetch', 'getSelection',
  ])
  const sources = fs.readdirSync('.').filter(f => f.endsWith('.js'))
  const all = sources.map(f => fs.readFileSync(f, 'utf8')).join('\n') + html
  const defined = name =>
    all.includes('window.' + name + ' =') ||
    all.includes('window.' + name + '=') ||
    // index.html 的 inline script 是 classic script，function 宣告本身就是全域
    // 這一條只看 index.html：它的 inline script 是 classic script，function 宣告就是全域。
    // 不能用 all 比對——模組裡的 export function iconButton(){} 是模組作用域，
    // 不會變成 window.iconButton，用 all 比會被誤判成「有定義」。
    html.includes('function ' + name + '(')

  const missing = new Set()
  for (const file of sources) {
    const src = fs.readFileSync(file, 'utf8')
    for (const match of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (BUILTIN.has(match[1]) || defined(match[1])) continue
      missing.add(`${file} 呼叫了 window.${match[1]}()，但沒有任何地方定義它`)
    }
  }
  assert.deepEqual([...missing], [], '呼叫了不存在的全域函式：\n  ' + [...missing].join('\n  '))
  ok('模組之間互相呼叫的 window.X() 都有人定義')
}
}

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

// --- 真的開站一次，再把每一個側欄項目點過 ---
//
// 上面那些是靜態比對：route key 對得上、函式有定義。但側欄壞掉的方式通常不是這兩種，
// 而是 inline script 在中途就掛了（語法錯誤、呼叫到被搬走的函式），handler 根本沒掛上去。
// 所以這裡用 jsdom 跑一次 index.html 的 inline script，再逐一點過 30 個項目。
// 模組是 <script type="module">，jsdom 不會執行，所以 render 函式用 stub 代替——
// 這一支檢查的是「換頁這件事會不會動」，頁面內容由 render-check 與 example-check 負責。
{
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window
  const d = w.document
  w.requestAnimationFrame = fn => setTimeout(fn, 0)
  w.scrollTo = () => {}
  for (const name of new Set([...routeBlock.matchAll(/window\.(\w+)\(\)/g)].map(m => m[1]))) {
    w[name] = () => `<div data-stub="${name}"></div>`
  }
  const inline = html.match(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/)[1]
  try {
    w.eval(inline)
  } catch (error) {
    assert.fail(`index.html 的 inline script 執行失敗，側欄不會有反應：${error.message}`)
  }

  const items = [...d.querySelectorAll('.nav-item[data-route-key]')]
  const unwired = items.filter(item => typeof item.onclick !== 'function').map(item => item.dataset.routeKey)
  assert.deepEqual(unwired, [], '這些側欄項目沒有掛上 click：' + unwired.join('、'))

  const broken = []
  for (const item of items) {
    const key = item.dataset.routeKey
    try {
      item.onclick()
      if (!d.querySelector('.page').innerHTML.trim()) broken.push(`${key}（畫面空白）`)
      if (!item.classList.contains('active')) broken.push(`${key}（沒有標成作用中）`)
    } catch (error) {
      broken.push(`${key}：${error.message}`)
    }
  }
  assert.deepEqual(broken, [], '以下側欄項目點了不會換頁：\n  ' + broken.join('\n  '))
  ok(`${items.length} 個側欄項目實際點過，都能換頁並更新作用中狀態`)
  dom.window.close()
}

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

// --- 收合側欄：開關的位置、圖示軌、飛出子選單 ---
//
// 這一段真的把 sidebar-collapse.js 跑起來點一遍。收合最容易壞的兩個地方都不是樣式：
// 開關跑回頁首（側欄的開關不該佔內容區的頁首），以及收合後第二、三層點不到。
{
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window
  const d = w.document

  // 開關在側欄底部，而且看得見：帶文字、帶快捷鍵，不是只有 hover 才顯形的細條
  const toggle = d.querySelector('#navCollapse')
  assert.ok(toggle, '找不到側欄底部的收合開關 #navCollapse')
  assert.ok(toggle.closest('.sidebar'), '收合開關要做在側欄裡，不是內容區的頁首')
  assert.equal(toggle.tagName, 'BUTTON', '收合開關要是 <button>，鍵盤才 Tab 得到')
  // 它是純圖示按鈕，名稱與快捷鍵都靠 aria-label 與 Tooltip
  assert.equal(toggle.getAttribute('aria-label'), '收合側欄')
  assert.ok(toggle.dataset.tooltip?.includes('收合側欄') && toggle.dataset.tooltip?.includes('Ctrl + B'),
    '純圖示的開關要有與 aria-label 同文字的 Tooltip，並帶上快捷鍵')
  assert.equal(toggle.querySelector('[data-icon]')?.dataset.icon, 'panelLeft',
    '收合開關的圖示要是 panel-left，不是箭頭——箭頭會被讀成「回到上一頁」')
  assert.ok(!d.querySelector('.topbar #navCollapse, .topbar .nav-toggle, .nav-rail'),
    '頁首不該有側欄的收合開關，側欄右緣那條細條也已經移除')
  ok('收合開關在側欄左下角，是 32×32 的純圖示 button，aria-label 與 Tooltip 一致')

  // 把模組跑起來（它是 ESM，這裡用與 example-check 相同的手法剝掉 import/export）
  const strip = s => s.replace(/^import .*$/gm, '').replace(/^export /gm, '')
  w.eval('(function(){' + strip(fs.readFileSync('delegate.js', 'utf8')) + ';window.__on=on})()')
  w.eval('(function(){const on=window.__on;' + strip(fs.readFileSync('sidebar-collapse.js', 'utf8')) + '})()')

  const app = d.querySelector('.app')
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))

  click(toggle)
  assert.ok(app.classList.contains('is-nav-collapsed'), '點開關之後側欄沒有收合')
  assert.equal(toggle.getAttribute('aria-expanded'), 'false', '收合後 aria-expanded 要是 false')
  assert.ok(toggle.dataset.tooltip.startsWith('展開側欄'),
    '收合之後開關的名稱要變成「展開側欄」')
  assert.equal(toggle.getAttribute('aria-label'), '展開側欄',
    'aria-label 要跟著 Tooltip 一起換，兩邊不能說不一樣的話')
  const navItem = d.querySelector('.nav-item[data-route-key]')
  assert.ok(navItem.dataset.tooltip, '收合後只剩圖示，每一項都要掛 Tooltip')
  assert.equal(navItem.dataset.tooltipPlacement, 'right', '圖示軌的提示要放右邊')

  // 收合狀態下點第一層：子選單要被搬到 body 的 .nav-flyout 裡。
  // 留在側欄裡是不行的——.nav 身上的 mask-image 會把後代裁進 .nav 的盒子，
  // position: fixed 逃得出捲動容器，逃不出遮罩，面板會整個被切掉。
  const branch = d.querySelector('.sidebar .nav-item[data-toggle]')
  const tree = branch.closest('.nav-tree')
  click(branch)
  const panel = d.querySelector('body > .nav-flyout')
  assert.ok(panel && !panel.hidden,
    '收合後點第一層要開飛出面板，否則第二、三層完全點不到')
  assert.ok(panel.querySelector('.nav-children'),
    '飛出面板必須把子選單搬到 body 底下，留在 .nav 裡會被 mask-image 裁掉')
  assert.ok(panel.querySelector('[data-route-key="第三層"]'),
    '第三層要跟著搬進面板，否則收合後還是點不到')
  assert.ok(panel.style.getPropertyValue('--flyout-top') &&
    panel.style.getPropertyValue('--flyout-left'),
    '飛出面板的位置要當場量，不能寫死——側欄會捲動、收合寬度是變數')
  assert.equal(branch.getAttribute('aria-expanded'), 'true')

  // 面板裡的第二層是展開／收合用的，不是目的地——點它不該把整個面板關掉
  click(panel.querySelector('.nav-item[data-toggle]'))
  assert.ok(!panel.hidden, '點面板裡的第二層不該關掉面板，它只是展開／收合第三層')

  // 選了第三層之後，軌上要有東西告訴使用者現在在哪一頁——第二、三層都看不到，
  // 所以第一層要代替子項顯示作用中，而且用的是一般的 .active，不是另一個記號。
  {
    const third = panel.querySelector('[data-route-key="第三層"]')
    assert.ok(third, '面板裡找不到第三層')
    third.classList.add('active') // 真正的 onclick 由 index.html 的路由掛，這裡直接模擬結果
    click(third)
    assert.ok(branch.classList.contains('active'),
      '收合後選了第三層，第一層要代替它顯示作用中，否則軌上看不出現在在哪一頁')
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }))
    assert.ok(!branch.classList.contains('active'),
      '展開之後子項自己看得見了，第一層要把作用中讓回去，不能兩個地方同時說「你在這裡」')
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }))
    click(branch) // 重新打開面板，後面的 Esc 測試接著用
  }

  // Esc 關掉、把子選單搬回側欄、焦點送回去
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  assert.ok(panel.hidden, 'Esc 要關掉飛出面板')
  assert.ok(tree.querySelector(':scope > .nav-children'),
    '關閉時子選單要搬回 .nav-tree，否則展開側欄之後第二、三層就不見了')
  assert.equal(d.activeElement, branch, 'Esc 之後焦點要回到那個圖示')

  // 快捷鍵展開，Tooltip 要跟著拿掉（展開後文字就在旁邊，再跳提示是重複的）
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }))
  assert.ok(!app.classList.contains('is-nav-collapsed'), 'Ctrl + B 要能展開')
  assert.ok(!navItem.dataset.tooltip, '展開後要拿掉圖示軌的 Tooltip')
  ok('收合：圖示軌掛 Tooltip、子選單搬到 body 的飛出面板、Esc 關閉並還原、Ctrl + B 可切換')
  w.close()
}

console.log('\nPASS: 側欄與路由（對應、函式、頁籤、著陸頁、分群、收合與飛出子選單）')
