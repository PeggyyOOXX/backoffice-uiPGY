// 設計 Token 的回歸檢查：node token-check.cjs
//
// 規範頁寫著「頁面不得直接寫死這些色碼，一律用變數」，但在這支檢查出現之前沒有人
// 擋得住——站上一度有十種文字灰（光是 #718096 就被寫死 71 次，和 --text-muted 的
// #718087 只差藍色通道 15/255），底色、線色各自長出十種。規範被實作繞過，
// 而且繞過的方式是「複製一個差一點點的色碼」，看畫面看不出來。
//
// 這支守三件事：
//   1. 字級落在級距上（偶數、最小 12px）
//   2. 間距／圓角／定位落在 4px 格線上
//   3. 元件層不寫死色碼，一律用 token
const fs = require('fs')
const assert = require('node:assert/strict')
const ok = label => console.log('  ✓ ' + label)

// token 的「定義處」：色碼在這裡是來源，不是違規。
// 每一支都是某一組色的單一來源，不得再擴充這份清單來躲檢查。
const DEFINERS = {
  'styles/blue-teal-palette-override.css': '介面色的定義處（:root）',
  'styles/strict-semantic-token-mapping.css': '八個語意按鈕的最終配色',
  'styles/semantic-button-system.css': '按鈕的尺寸公式與 outline 變體',
  'styles/base.css': '最底層的佈景，多數已被後層覆寫',
  'styles/blue-framed-dashboard-theme.css': '佈景層',
  'styles/input-standard-page.css': '開關四種狀態的配色（AGENTS.md 指定只在這裡定義）',
  'styles/list-toolbar-action-palette.css': '列表工具列的按鈕色層',
  'styles/sidebar-selection-variant-two.css': '側欄選取樣式變體',
  'styles/sidebar-selection-variant-three.css': '側欄選取樣式變體',
  'styles/three-level-sidebar-navigation.css': '三層側欄的配色',
  'styles/original-101best-active-gradient.css': '側欄作用中項目的漸層',
  'styles/input-component-standard.css': '輸入元件的狀態配色',
}

const files = []
for (const f of fs.readdirSync('.')) if (f.endsWith('.css')) files.push(f)
for (const f of fs.readdirSync('styles')) files.push('styles/' + f)

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
// 字級：偶數、最小 12px（12 / 14 / 16 / 18 / 20 以上仍須為偶數）
const fontOk = px => Number.isInteger(px) && px >= 12 && px % 2 === 0
const GRID = /^(padding|margin|gap|row-gap|column-gap|border-radius|top|right|bottom|left|inset)(-|$)/

// 格線的唯一例外：開關旋鈕的左右內距是推算值 (24 − 18) ÷ 2 = 3px，不是間距選擇。
const GRID_ALLOWED = [
  { file: 'styles/input-standard-page.css', value: 0.1875, why: '開關旋鈕的置中推算值 (24−18)÷2' },
]

// 色碼的例外。每一條都要寫清楚為什麼它不該是 token——「分類色階」與「插圖的淡階」
// 不是介面色，硬塞進調色盤只會讓那份清單變成雜物櫃。要加新條目先問得出理由。
const COLOUR_ALLOWED = [
  { file: 'example-audit.css', hex: '#436ded', why: '會員層級 LV2 的分類色，與 LV1（--blue）、LV3 組成一組三色色階，不是介面色' },
  { file: 'example-audit.css', hex: '#9763c8', why: '會員層級 LV3 的分類色，同上' },
  { file: 'states.css', hex: '#e59aa4', why: '錯誤狀態插圖的淡紅，是 --danger 的插圖階；它只出現在空狀態圖示上，不當介面色用' },
]

const fontBad = [], gridBad = [], colourBad = []
for (const file of files) {
  const isDefiner = file in DEFINERS
  strip(fs.readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
    const at = `${file}:${i + 1}`
    if (!isDefiner) {
      // var(--x, #fallback) 的後備值不算寫死：它只有在變數沒定義時才會用到，
      // 本身就是指向 token 的寫法。先把這種整段拿掉再找色碼。
      const scanned = line.replace(/var\(\s*--[\w-]+\s*,[^)]*\)/g, ' ')
      // (?![0-9a-fA-F]) 排除 8 位數的 #RRGGBBAA——那是帶透明度的疊色（陰影、遮罩），
      // 不是調色盤上的一支色，\b 擋不住它（#15233f08 的前六碼會被當成色碼）。
      for (const hex of scanned.match(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g) || []) {
        if (COLOUR_ALLOWED.some(a => a.file === file && a.hex.toLowerCase() === hex.toLowerCase())) continue
        colourBad.push(`${at}  ${hex}`)
      }
    }
    for (const decl of line.match(/(^|[;{])\s*(--)?[-a-zA-Z]+\s*:\s*[^;}]*/g) || []) {
      const m = decl.match(/(--)?([-a-zA-Z]+)\s*:\s*([^;}]*)$/)
      if (!m || /@media/.test(line)) continue
      const prop = m[2]
      for (const token of m[3].replace(/calc\([^)]*\)/g, ' ').match(/-?\d*\.?\d+rem/g) || []) {
        const rem = Math.abs(parseFloat(token))
        const px = rem * 16
        if (prop === 'font-size' && !fontOk(px)) fontBad.push(`${at}  ${token} = ${px}px`)
        if (GRID.test(prop) && Math.round(px * 100) % 400 !== 0) {
          if (GRID_ALLOWED.some(a => a.file === file && a.value === rem)) continue
          gridBad.push(`${at}  ${prop}: ${token} = ${px}px`)
        }
      }
    }
  })
}

assert.deepEqual(fontBad, [], '字級要是偶數且最小 12px：\n  ' + fontBad.join('\n  ') + '\n')
ok('字級全部落在級距上（偶數、≥12px）')

assert.deepEqual(gridBad, [], '間距／圓角／定位要落在 4px 格線上：\n  ' + gridBad.join('\n  ') + '\n')
ok(`間距、圓角與定位都是 4px 的倍數（${GRID_ALLOWED.length} 個推算值例外）`)

assert.deepEqual(
  colourBad, [],
  '元件層不得寫死色碼，一律用「設計 Token → 介面色」的變數：\n  ' + colourBad.join('\n  ') +
  '\n  （真的需要新顏色，先補進 token-guide.js 與 blue-teal-palette-override.css 的 :root）\n',
)
ok(`${files.length - Object.keys(DEFINERS).length} 個元件樣式檔都用 token，沒有寫死色碼`)

// token 頁列出的每一支變數都要真的存在，否則規範頁會公告一個站上沒有的顏色
{
  const home = fs.readFileSync('styles/blue-teal-palette-override.css', 'utf8')
  const guide = fs.readFileSync('token-guide.js', 'utf8')
  const listed = [...guide.matchAll(/\["(--[\w-]+)",\s*"(#[0-9A-Fa-f]{6})"/g)]
  assert.ok(listed.length >= 15, '設計 Token 頁的介面色清單讀不到，格式可能改了')
  const missing = []
  for (const [, name, hex] of listed) {
    const m = home.match(new RegExp(name + ':\\s*([^;]+);'))
    if (!m) { missing.push(`${name} 沒有在 :root 定義`); continue }
    if (m[1].trim().toLowerCase() !== hex.toLowerCase()) {
      missing.push(`${name} 規範頁寫 ${hex}，實際是 ${m[1].trim()}`)
    }
  }
  assert.deepEqual(missing, [], '設計 Token 頁與實際定義對不上：\n  ' + missing.join('\n  ') + '\n')
  ok(`設計 Token 頁的 ${listed.length} 支介面色變數都與 :root 的定義一致`)
}

console.log('\nPASS: 設計 Token（字級級距、4px 格線、元件不寫死色碼、規範頁與定義一致）')
