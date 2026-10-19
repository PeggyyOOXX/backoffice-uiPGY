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

// 壓縮後的 topbar 仍要塞得下最高的控制項（.icon-btn 34px）
const topbarH = brandH - gapTop
const TALLEST_CONTROL = 34
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

console.log('\nPASS: Shell 版面對齊（topbar 底線 ＝ 側欄分隔線）＋ 表格外觀單一來源')
