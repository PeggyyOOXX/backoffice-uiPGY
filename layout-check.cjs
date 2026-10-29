// Shell 版面的對齊不變式：node layout-check.cjs
//
// 這支只驗一件事——topbar 的底線要和側欄 logo 下方的分隔線落在同一個 y。
// 它曾經錯過兩次，兩次都是因為「高度」和「位移」分散在不同檔案各寫一個數字：
//   第一次：topbar 60px vs brand 64px，高度沒對齊
//   第二次：高度對齊了，但沒算到 .main 的 12px 上緣留白把 topbar 整個往下推
//
// 現在三個值都在 sticky-topbar-and-workspace-tabs.css 以變數綁在一起，
// 這支就從那個檔案把變數讀出來，直接算兩條線的 y 是否相等。
const fs = require('fs')
const assert = require('node:assert/strict')

const FILE = 'styles/sticky-topbar-and-workspace-tabs.css'
const css = fs.readFileSync(FILE, 'utf8')

const ok = label => console.log('  ✓ ' + label)

function readVar(name) {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  assert.ok(match, `${FILE} 缺少 --${name}`)
  return match[1].trim()
}

// 樣式表的尺寸一律寫 rem（根字級 16px），舊寫法 px 也接受
const px = value => {
  const text = String(value).trim()
  const n = text.endsWith('rem') ? Number(text.slice(0, -3)) * 16 : Number(text.replace('px', ''))
  assert.ok(Number.isFinite(n), `無法解析長度：${value}`)
  return n
}

// --brand-h 與 --main-gap-top 是純數值，--topbar-h 必須是由它們算出來的
const brandH = px(readVar('brand-h'))
const gapTop = px(readVar('main-gap-top'))
const topbarExpr = readVar('topbar-h')

assert.match(
  topbarExpr,
  /calc\(\s*var\(--brand-h\)\s*-\s*var\(--main-gap-top\)\s*\)/,
  '--topbar-h 必須寫成 calc(var(--brand-h) - var(--main-gap-top))，不得寫死數值'
)
ok(`--brand-h ${brandH}px、--main-gap-top ${gapTop}px、--topbar-h 由兩者算出`)

// --brand-h 與 .brand 的高度必須在 media query 之外：logo 區在任何寬度下都是同一個高度。
// 曾經把它收進桌機區段，720px 以下就掉回主題檔的 84px，logo 區整塊變高。
const beforeMedia = css.slice(0, css.indexOf('@media'))
assert.ok(/--brand-h:/.test(beforeMedia), '--brand-h 不得放在 @media 內')
const brandRule = beforeMedia.match(/^\.brand \{[\s\S]*?\}/m)?.[0] ?? ''
assert.ok(/height: var\(--brand-h\)/.test(brandRule), '.brand 的高度不得放在 @media 內')

// logo 區不可被內容或圖片撐開／擠扁
for (const prop of ['min-height', 'max-height', 'flex: none', 'overflow: hidden']) {
  assert.ok(brandRule.includes(prop), `.brand 缺少 ${prop}，高度會被內容影響`)
}
assert.ok(/\.brand-logo \{[^}]*max-height: 100%/.test(beforeMedia), 'logo 圖片沒有限制在容器內')
ok('logo 區高度固定於所有寬度，且不受內容與圖片尺寸影響')

// 兩條線的 y
const brandBottom = 0 + brandH                 // 側欄從 .app 頂端起算
const topbarBottom = gapTop + (brandH - gapTop) // .main 被留白往下推
assert.equal(topbarBottom, brandBottom, 'topbar 底線與側欄分隔線沒有對齊')
ok(`兩條線都落在 y = ${brandBottom}px`)

// 壓縮後的 topbar 仍要塞得下最高的控制項（.icon-btn 32px）
const topbarH = brandH - gapTop
const TALLEST_CONTROL = 32
assert.ok(topbarH >= TALLEST_CONTROL + 8, `topbar 只有 ${topbarH}px，塞不下 ${TALLEST_CONTROL}px 的 icon-btn`)
ok(`topbar ${topbarH}px，容得下 ${TALLEST_CONTROL}px 的控制項`)

// 排在它之前的主題檔可以寫死這些值——後面覆寫前面，是這個專案刻意的疊層設計
// （見 styles/README.md）。真正會把對齊弄壞的只有排在「之後」的檔案。
const order = [...fs.readFileSync('styles/index.css', 'utf8').matchAll(/@import '\.\/([^']+)'/g)].map(m => m[1])
const selfIndex = order.indexOf('sticky-topbar-and-workspace-tabs.css')
assert.ok(selfIndex >= 0, 'styles/index.css 沒有匯入 sticky-topbar-and-workspace-tabs.css')

const OWNED = [
  ['.brand', /^\.brand \{[^}]*height:/m, '側欄 logo 區高度'],
  ['.topbar', /^\.topbar \{[^}]*height:/m, 'topbar 高度'],
  ['.quick-tabs', /^\s*\.quick-tabs \{[^}]*top:/m, '工作區頁籤的 sticky 偏移'],
]
const offenders = []
for (const file of order.slice(selfIndex + 1)) {
  const text = fs.readFileSync(`styles/${file}`, 'utf8')
  // 手機版（max-width: 720px）另有一套 46px fixed topbar，不在對齊範圍內
  const desktop = text.replace(/@media \(max-width: 720px\)[\s\S]*?\n\}/g, '')
  for (const [selector, pattern, label] of OWNED) {
    if (pattern.test(desktop)) offenders.push(`styles/${file} 覆寫了 ${selector} 的${label}`)
  }
}
assert.deepEqual(offenders, [], '以下檔案排在變數之後，會把對齊蓋掉：\n  ' + offenders.join('\n  '))
ok(`後續 ${order.length - selfIndex - 1} 個樣式檔都沒有覆寫這三個值`)

// --- 手機版固定內容那一疊不能有縫 ---
//
// topbar、工作區頁籤列、搜尋條件開關都是 position: fixed，疊在捲動內容上面。
// 只要其中一個的位置是另外寫死的數字，中間就會留一條縫，捲動時內容從縫裡穿過去。
// （實際踩過：topbar 46px、頁籤列卻寫 top: 50px，中間 4px 沒人蓋。）
// 所以這些值一律從 sticky-topbar-and-workspace-tabs.css 的變數算出來。
{
  const owner = fs.readFileSync('styles/sticky-topbar-and-workspace-tabs.css', 'utf8')
  for (const name of ['--topbar-h-mobile', '--quick-tabs-h-mobile', '--mobile-search-toggle-h', '--mobile-stack-bottom']) {
    assert.ok(owner.includes(name + ':'), `sticky-topbar-and-workspace-tabs.css 缺少 ${name}`)
  }

  const mobile = fs.readFileSync('styles/mobile-wrapped-static-navigation-and-actions.css', 'utf8')
  // 同一個 selector 在檔案裡會出現兩次（桌機先 display:none，手機才排版），
  // 所以要挑出真正寫著那個屬性的那一塊。
  const ruleOf = (selector, property) => {
    const blocks = []
    for (let at = mobile.indexOf(selector); at >= 0; at = mobile.indexOf(selector, at + 1)) {
      blocks.push(mobile.slice(at, mobile.indexOf('}', at)))
    }
    assert.ok(blocks.length, `手機版樣式找不到 ${selector}`)
    return blocks.find(block => block.includes(property + ':')) ?? blocks[0]
  }
  const fromVariable = (selector, property, variable) => {
    const rule = ruleOf(selector, property)
    const line = rule.split('\n').find(text => text.trim().startsWith(property + ':'))
    assert.ok(line, `${selector} 缺少 ${property}`)
    assert.ok(
      line.includes(variable),
      `${selector} 的 ${property} 要從 ${variable} 算出來，不要另外寫死數字：${line.trim()}`,
    )
  }
  // topbar 的高度與頁籤列的 top 必須是同一個值，中間才不會有縫
  fromVariable('.topbar {', 'height', '--topbar-h-mobile')
  fromVariable('.quick-tabs {', 'top', '--topbar-h-mobile')
  fromVariable('.quick-tabs {', 'height', '--quick-tabs-h-mobile')
  // 搜尋條件開關與展開的篩選列接在整疊下面
  fromVariable('.mobile-member-search-toggle {', 'top', '--mobile-search-toggle-top')
  fromVariable('.source-filter.mobile-open {', 'top', '--mobile-stack-bottom')
  ok('手機版：topbar、頁籤列與搜尋開關的位置都從同一組變數算出來，中間不留縫')
}

// --- 表格外觀只能有一個來源 ---
//
// 站上有 23 張表。它們的長相本來該全部來自 unified-table-system.css，但 base.css
// 也有一組同權重的 .page th / .page td，只是 import 比較早——畫面上看到的其實是
// 兩個檔案逐屬性混出來的結果，兩邊都不是完整的規範。
// 另外那裡還有 .page table{min-width:920px}（會員列表的尺寸）套到每一張表，
// 逼得 16 個地方各自寫 min-width 去抵抗，其中 5 個只是寫 min-width:0。
const SOURCE = 'styles/unified-table-system.css'
const styleFiles = fs.readdirSync('styles').filter(f => f.endsWith('.css') && f !== 'index.css')
const BASE_PROPS = ['padding', 'background', 'font-size', 'border-bottom', 'text-align']
const dupes = []
for (const file of styleFiles) {
  if (file === SOURCE.replace('styles/', '')) continue
  const text = fs.readFileSync(`styles/${file}`, 'utf8')
  // 只看沒有再加類別的裸選擇器：.page th / .page td / .page table
  for (const sel of ['th', 'td', 'table']) {
    const rule = text.match(new RegExp(`(^|\\})\\s*\\.page\\s+${sel}\\s*\\{([^}]*)\\}`, 'm'))
    if (!rule) continue
    const body = rule[2]
    const hit = BASE_PROPS.filter(p => new RegExp(`(^|;)\\s*${p}\\s*:`).test(body))
    if (hit.length) dupes.push(`styles/${file} 的 .page ${sel} 又定義了 ${hit.join('、')}`)
  }
}
assert.deepEqual(dupes, [], `表格外觀只能寫在 ${SOURCE}：\n  ` + dupes.join('\n  '))

const tableCss = fs.readFileSync(SOURCE, 'utf8')
const bare = tableCss.match(/\.page\s+table\s*,[^{]*\{([^}]*)\}/)
assert.ok(bare, `${SOURCE} 缺少 .page table 的基底規則`)
assert.ok(
  !/min-width\s*:/.test(bare[1]),
  '.page table 不要設全域 min-width——那是會員列表的尺寸，套到每張表會逼其他表各自抵抗',
)
ok(`表格外觀只有 ${SOURCE} 一個來源，且沒有全域 min-width`)

// --- 疊放順序只能從 token 取 ---
//
// 先前十支檔案各寫各的數字，結果是：側欄抽屜與頁首氣泡面板都是 40（誰在上面
// 靠 DOM 順序決定）、右側詳情抽屜 50 反而蓋在導覽上面、Tooltip 60 蓋過全部。
// 這一段守兩件事：順序本身，以及「不要再自己挑一個數字」。
{
  const files = [
    ...fs.readdirSync('.').filter(f => f.endsWith('.css')),
    ...fs.readdirSync('styles').map(f => 'styles/' + f),
  ]
  const base = fs.readFileSync('styles/base.css', 'utf8')
  const LAYERS = ['--z-sticky', '--z-fixed', '--z-popover', '--z-drawer', '--z-nav-backdrop', '--z-nav', '--z-tooltip', '--z-ep-popper']
  const value = name => {
    const match = base.match(new RegExp(`${name}:\\s*(\\d+)`))
    assert.ok(match, `styles/base.css 缺少 ${name}`)
    return Number(match[1])
  }
  const values = LAYERS.map(value)
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(
      values[i] > values[i - 1],
      `疊放順序反了：${LAYERS[i]}(${values[i]}) 應該大於 ${LAYERS[i - 1]}(${values[i - 1]})`,
    )
  }
  // 側欄導覽是全站導覽，必須蓋過頁首氣泡與右側抽屜——這就是這組 token 的存在理由
  assert.ok(value('--z-nav') > value('--z-drawer'), '側欄導覽抽屜要蓋過右側詳情抽屜')
  assert.ok(value('--z-nav') > value('--z-popover'), '側欄導覽抽屜要蓋過頁首的氣泡面板')

  // 覆蓋層不得再寫死數字。1–3 是元件內部的堆疊（表格固定欄、頁籤底線），不跨出自己的卡片；
  // 2000 是 Toast 在沒有 Popover API 時的退路，已在 message.css 註記。
  const INLINE_OK = new Set([1, 2, 3, 2000])
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  const literals = []
  for (const file of files) {
    strip(fs.readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
      const match = line.match(/z-index\s*:\s*(\d+)/)
      if (!match || INLINE_OK.has(Number(match[1]))) return
      literals.push(`${file}:${i + 1} ${line.trim()}`)
    })
  }
  assert.deepEqual(literals, [], '覆蓋層的 z-index 要用 --z-* 變數，不要自己挑數字：\n  ' + literals.join('\n  '))
  // JS 這邊也一樣：Element Plus 的 popper 層級要讀 --z-ep-popper，不要在模組裡各寫
  // 一個數字——先前 select.js 與 date-picker.js 各寫了一次 3000，改一個就會漏另一個。
  const jsLiterals = []
  for (const file of fs.readdirSync('.').filter(f => f.endsWith('.js'))) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/zIndex\s*:\s*(\d+)/g)) {
      jsLiterals.push(`${file} 寫死 zIndex: ${match[1]}`)
    }
  }
  assert.deepEqual(jsLiterals, [], 'JS 裡的 zIndex 要讀 --z-ep-popper：\n  ' + jsLiterals.join('\n  '))
  for (const file of ['select.js', 'date-picker.js']) {
    assert.ok(
      fs.readFileSync(file, 'utf8').includes('--z-ep-popper'),
      `${file} 要從 --z-ep-popper 取 Element Plus 的 popper 層級`,
    )
  }
  ok(`疊放順序 ${LAYERS.length} 層由 token 決定（側欄導覽 ${value('--z-nav')} 蓋過抽屜 ${value('--z-drawer')} 與氣泡 ${value('--z-popover')}），CSS 與 JS 都不寫死數字`)
}

// --- 表單欄位格線 ---
// 欄數照正式後台 el-col :sm="12" :md="8" :lg="6" :xl="4"，只在 guide-page.css 定義。
// 先前用 auto-fit 配最小 220px，寬螢幕排到 7 欄，單一欄位還會被拉滿整列。
{
  const guide = fs.readFileSync('guide-page.css', 'utf8')
  const columnsAt = width => {
    const block = guide.match(new RegExp(`@media \\(min-width: ${width}px\\) \\{\\s*\\.guide-fields \\{\\s*grid-template-columns: repeat\\((\\d+),`))
    return block && Number(block[1])
  }
  const expected = { 768: 2, 992: 3, 1200: 4, 1920: 6 }
  for (const [width, cols] of Object.entries(expected)) {
    assert.equal(columnsAt(width), cols, `.guide-fields 在 ${width}px 起要是 ${cols} 欄（同 el-col）`)
  }
  assert.ok(!/\.guide-fields\s*\{[^}]*auto-(fit|fill)/.test(guide), '.guide-fields 不得用 auto-fit／auto-fill：欄數要照 el-col 固定')
  assert.ok(/\.bo-modal \.guide-fields \{\s*grid-template-columns: repeat\(2,/.test(guide), '彈窗內的 .guide-fields 固定 2 欄')
  const cssFiles = [
    ...fs.readdirSync('.').filter(f => f.endsWith('.css') && f !== 'guide-page.css'),
    ...styleFiles.map(f => `styles/${f}`),
  ]
  const overrides = cssFiles.filter(file =>
    /\.guide-fields[^{,]*\{[^}]*(grid-template-columns|container-type)/.test(fs.readFileSync(file, 'utf8')))
  assert.deepEqual(overrides, [], '只有 guide-page.css 可以定義表單欄數，以下檔案另寫了：\n  ' + overrides.join('\n  '))
  ok('表單欄位格線 1／2／3／4／6 欄照 el-col，彈窗 2 欄，只有 guide-page.css 一處定義')
}

// --- 側欄捲動提示 ---
// 淡出只在那一側還有內容時才畫（捲到底下緣消失），而且桌機側欄與手機抽屜共用。
// 先前淡出寫死在 mask 裡、又包在桌機的 @media 內：捲到底最後一項仍是半透明，手機抽屜則完全沒有。
{
  const fadeCss = fs.readFileSync('styles/fixed-sidebar-independent-content-scroll.css', 'utf8')
  const outside = fadeCss.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
  assert.ok(/\.sidebar \.nav \{[^}]*mask-image:[^;]*var\(--nav-fade-top\)[^;]*var\(--nav-fade-bottom\)/.test(outside),
    '側欄的淡出要寫在 @media 外（手機抽屜也要有），而且長度要用 --nav-fade-top／--nav-fade-bottom，不能寫死')
  assert.ok(/\.can-scroll-down\s*\{[^}]*--nav-fade-bottom/.test(outside) && /\.can-scroll-up\s*\{[^}]*--nav-fade-top/.test(outside),
    '淡出只在 .can-scroll-up／.can-scroll-down 時才有長度')
  const fadeJs = fs.readFileSync('sidebar-fade.js', 'utf8')
  assert.ok(/can-scroll-up/.test(fadeJs) && /can-scroll-down/.test(fadeJs), 'sidebar-fade.js 要依捲動位置切換兩個 class')
  assert.ok(fs.readFileSync('settings-demo.js', 'utf8').includes("import './sidebar-fade.js'"), '進入點要載入 sidebar-fade.js')
  ok('側欄淡出只在那一側還有內容時才畫，桌機側欄與手機抽屜共用')
}

// --- 連接尖角與展開箭頭共用同一個 ::after，順序不能反 ---
//
// 側欄有兩個東西畫在 .nav-item 的 ::after 上：
//   連接尖角  .nav-item.active::after              （0,2,1）
//   展開箭頭  [data-toggle].expanded::after        （0,2,1）
// 權重一樣，所以比的是層疊順序。一個項目同時是 [data-toggle] 又是 .active
// （收合後代替子項顯示作用中的第一層）時，排在後面的那一條會贏——箭頭的
// transform: rotate(45deg) 一旦贏過尖角的 translateY(-50%)，尖角就會歪掉。
// 這裡驗的是「尖角的 transform 宣告在箭頭之後」，不是哪個檔案叫什麼名字。
{
  const order = [...fs.readFileSync('styles/index.css', 'utf8')
    .matchAll(/@import '\.\/([^']+)'/g)].map(m => 'styles/' + m[1])
  const declares = (file, selector, property) => {
    const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}')
    const match = src.match(rule)
    return !!match && new RegExp('(^|[\\s;])' + property + '\\s*:').test(match[1])
  }
  // 生效的是最後一次宣告，所以兩邊都取 last
  const lastIndex = test => order.reduce((found, file, i) => (test(file) ? i : found), -1)
  const arrow = lastIndex(f => declares(f, '[data-toggle].expanded::after', 'transform'))
  const wedge = lastIndex(f => declares(f, '.nav-item.active::after', 'transform'))
  assert.notEqual(arrow, -1, '找不到展開箭頭的 transform')
  assert.notEqual(wedge, -1,
    '沒有任何檔案替連接尖角重寫 transform——展開箭頭會把它轉 45 度（.nav-item.active::after）')
  assert.ok(wedge > arrow,
    `連接尖角的 transform（${order[wedge]}）要排在展開箭頭（${order[arrow]}）之後，` +
    '兩條權重相同，比的是順序')
  ok('連接尖角的 transform 排在展開箭頭之後，兩者共用 ::after 也不會轉歪')
}

console.log('\nPASS: Shell 版面對齊（topbar 底線 ＝ 側欄分隔線）＋ 表格外觀單一來源＋疊放順序＋表單欄位格線＋側欄淡出＋連接尖角')
