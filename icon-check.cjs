// 圖示系統的回歸檢查：node icon-check.cjs
const { JSDOM } = require('jsdom')
const fs = require('fs')
const path = require('path')
const assert = require('node:assert/strict')
const assertGuideSkeleton = require('./guide-skeleton.cjs')

const dom = new JSDOM('<main class="page"></main>', { runScripts: 'outside-only', pretendToBeVisual: true })
const w = dom.window, d = w.document
w.requestAnimationFrame = fn => setTimeout(fn, 0)
const strip = s => s.replace(/^import .*$/gm, '').replace(/^export /gm, '')

w.eval(strip(fs.readFileSync('delegate.js', 'utf8')) + ';window.__on=on;window.__onMatch=onMatch')
w.eval('const on=window.__on;' + strip(fs.readFileSync('tooltip.js', 'utf8')) + ';window.tooltipAttrs=tooltipAttrs')

// icons-data.js 是純資料
w.eval(fs.readFileSync('icons-data.js', 'utf8').replace(/^export const /gm, 'window.'))
w.eval([
  'const ICONS=window.ICONS,GROUPS=window.GROUPS;',
  strip(fs.readFileSync('icons.js', 'utf8')),
  ';window.icon=icon;window.hydrate=hydrate;window.hasIcon=hasIcon;window.SIZES=SIZES;window.ICON_LIST=ICONS',
].join(''))
w.eval('const tooltipAttrs=window.tooltipAttrs,icon=window.icon;' + strip(fs.readFileSync('icon-button.js', 'utf8')) + ';window.iconButton=iconButton')
w.eval([
  'const icon=window.icon,ICON_LIST=window.ICON_LIST,GROUPS=window.GROUPS,SIZES=window.SIZES,',
  'iconButton=window.iconButton,onMatch=window.__onMatch;',
  strip(fs.readFileSync('icon-guide.js', 'utf8')),
].join(''))

const ok = (label) => console.log('  ✓ ' + label)

// --- 清單 ---
assert.ok(w.ICON_LIST.length >= 80, '圖示數量異常')
const names = w.ICON_LIST.map(i => i.name)
assert.equal(new Set(names).size, names.length, '名稱有重複')
assert.ok(names.every(n => /^[a-z][A-Za-z]*$/.test(n)), '名稱必須是 camelCase')
ok(`${w.ICON_LIST.length} 個名稱，無重複，全為 camelCase`)

// --- 每個名稱都畫得出幾何元素，且屬性正確 ---
for (const item of w.ICON_LIST) {
  const markup = w.icon(item.name, 16)
  assert.match(markup, /^<svg class="icon"/, `${item.name} 不是 svg`)
  assert.ok(/<(path|circle|rect|line|polyline|polygon|ellipse)\b/.test(markup), `${item.name} 沒有幾何元素`)
  assert.match(markup, /stroke="currentColor"/, `${item.name} 未用 currentColor`)
  assert.match(markup, /aria-hidden="true"/, `${item.name} 缺 aria-hidden`)
  assert.match(markup, /focusable="false"/, `${item.name} 缺 focusable`)
  assert.ok(!/fill="#|stroke="#/.test(markup), `${item.name} 含寫死色碼`)
}
ok('全部名稱：currentColor、aria-hidden、focusable、無寫死色碼')

// --- 尺寸對應線寬（ICON-SYSTEM.md 第十節第 2 點）---
const strokeOf = (name, size) => +w.icon(name, size).match(/stroke-width="([\d.]+)"/)[1]
assert.equal(strokeOf('edit', 24), 2)
assert.equal(strokeOf('edit', 20), 2.25)
assert.equal(strokeOf('edit', 16), 2.5)
assert.deepEqual([...w.SIZES], [16, 20, 24])
ok('24/20/16px → stroke-width 2 / 2.25 / 2.5')

// --- 許可清單：清單外的名字不畫，而且只警告一次 ---
let warnings = 0
const realWarn = w.console.warn
w.console.warn = () => { warnings++ }
assert.equal(w.icon('definitelyNotAnIcon'), '')
assert.equal(w.icon('definitelyNotAnIcon'), '')
w.console.warn = realWarn
assert.equal(warnings, 1, '清單外名稱應只警告一次')
assert.equal(w.hasIcon('edit'), true)
assert.equal(w.hasIcon('nope'), false)
ok('清單外的名稱不畫、只警告一次')

// --- hydrate：靜態 HTML 的 data-icon 空殼 ---
d.querySelector('.page').innerHTML = '<span data-icon="edit"></span><span data-icon="members" data-icon-size="24"></span><span data-icon="nope"></span>'
w.hydrate(d)
const filled = d.querySelectorAll('.page svg.icon')
assert.equal(filled.length, 2, 'hydrate 應只填得出清單上的兩個')
assert.equal(filled[1].getAttribute('width'), '24', 'data-icon-size 未生效')
w.hydrate(d) // 重複呼叫不應重畫
assert.equal(d.querySelectorAll('.page svg.icon').length, 2)
ok('hydrate 填得出 data-icon，尊重 data-icon-size，重複呼叫無副作用')

// --- 規範頁 ---
d.querySelector('.page').innerHTML = w.renderIconGuide()
const q = s => { const e = d.querySelector(s); assert.ok(e, '缺少 ' + s); return e }
assert.equal(d.querySelectorAll('.icon-cell').length, w.ICON_LIST.length, '總覽頁格數與清單不符')
w.GROUPS.forEach(g => q(`#icon-group-${g.key}`))
assert.equal(d.querySelectorAll('.icon-guide-jump a').length, w.GROUPS.length)
ok(`總覽頁：${w.GROUPS.length} 個分類、${w.ICON_LIST.length} 格，錨點齊全`)

assertGuideSkeleton(d, 'icon-guide', '圖示系統')
ok('版面骨架與「頁籤 Tabs」一致（style-guide / card 內距 / h3 小節 / 共用規格 / 使用規則）')

// 每一格都要有名稱、中文與來源檔名
const cell = q('.icon-cell')
assert.ok(cell.querySelector('code').textContent.trim(), '格子缺名稱')
assert.ok(cell.querySelector('small').textContent.trim(), '格子缺中文')
assert.ok(cell.querySelector('em').textContent.trim(), '格子缺 Lucide 檔名')
assert.ok(cell.querySelector('svg.icon'), '格子缺圖示')
ok('每一格都有圖示、名稱、中文與來源檔名')

// 圖示按鈕的示範已併進「按鈕 Button」頁，相關斷言移到 render-check.cjs

// --- 原始碼裡不應再有當圖示用的文字字元 ---
const GLYPHS = '✎◷⇩↻⌕◫▣⇅⇄☷☰♢♙◉⌄‹›↺⋮●↗⌛↙◇◈≡▧⠿'
const offenders = []
for (const file of fs.readdirSync('.').filter(f => /\.(js|html)$/.test(f) && f !== 'icon-check.cjs')) {
  const text = fs.readFileSync(file, 'utf8')
  for (const ch of GLYPHS) if (text.includes(ch)) offenders.push(`${file} 含 ${ch}`)
}
assert.deepEqual(offenders, [], '仍有文字字元當圖示用：\n' + offenders.join('\n'))
ok('原始碼已無當圖示用的文字字元')

// --- 給正式後台的 shim 必須涵蓋 EP 內部真正 import 的名稱 ---
const EP_INTERNAL = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'CaretRight', 'Check',
  'CircleCheck', 'CircleClose', 'CircleCloseFilled', 'Close', 'DArrowLeft', 'DArrowRight',
  'Delete', 'Document', 'Hide', 'InfoFilled', 'Loading', 'MoreFilled', 'SuccessFilled',
  'View', 'WarningFilled', 'ZoomIn']
const shim = fs.readFileSync(path.join('porting', 'ep-shim.ts'), 'utf8')
const exported = [...shim.matchAll(/^export const (\w+)/gm)].map(m => m[1])
assert.deepEqual([...exported].sort(), [...EP_INTERNAL].sort(), 'ep-shim 的匯出與 EP 內部 import 不符')
ok(`ep-shim 涵蓋 EP 內建的 ${EP_INTERNAL.length} 個圖示`)

console.log('\nPASS: 圖示系統（清單、線寬補償、hydrate、總覽頁、無障礙、字元清除、EP shim）')
