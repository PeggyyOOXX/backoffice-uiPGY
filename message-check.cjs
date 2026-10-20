// 訊息提示系統的回歸檢查：node message-check.cjs
const { JSDOM } = require('jsdom')
const fs = require('fs')
const assert = require('node:assert/strict')
const assertGuideSkeleton = require('./guide-skeleton.cjs')

const dom = new JSDOM('<!doctype html><body><main class="page"></main></body>', { runScripts: 'outside-only', pretendToBeVisual: true })
const w = dom.window, d = w.document
w.requestAnimationFrame = fn => setTimeout(fn, 0)
// jsdom 沒有 popover，message.js 會自動退回 z-index 模式——這裡正好驗證那條退路
const strip = s => s.replace(/^import .*$/gm, '').replace(/^export /gm, '')
const wait = ms => new Promise(r => setTimeout(r, ms))

w.eval(strip(fs.readFileSync('delegate.js', 'utf8')) + ';window.__on=on;window.__onMatch=onMatch')
w.eval(fs.readFileSync('icons-data.js', 'utf8').replace(/^export const /gm, 'window.'))
w.eval('const ICONS=window.ICONS,GROUPS=window.GROUPS;' + strip(fs.readFileSync('icons.js', 'utf8')) + ';window.icon=icon')
// guide-page 提供 decisionTable，訊息規範頁的「行內警示」決策表會用到
w.eval(strip(fs.readFileSync('guide-page.js', 'utf8')) + ';window.decisionTable=decisionTable')
w.eval([
  'const icon=window.icon,onMatch=window.__onMatch;',
  strip(fs.readFileSync('message.js', 'utf8')),
  ';window.message=message;window.TYPES=TYPES;window.MAX_VISIBLE=MAX_VISIBLE',
].join(''))

const ok = label => console.log('  ✓ ' + label)
const shown = () => [...d.querySelectorAll('.bo-message')]
// dismiss 的實際移除靠 transitionend（jsdom 不觸發）或 400ms 的保險 timer，所以要等過那個時間
const clear = async () => { w.message.clear(); await wait(450) }

async function run() {
  // --- 四種型別 ---
  const types = Object.keys(w.TYPES)
  assert.deepEqual([...types], ['success', 'info', 'warning', 'error'])
  for (const type of types) {
    w.message(`測試 ${type}`, type)
    const el = d.querySelector(`.bo-message.is-${type}`)
    assert.ok(el, `${type} 沒畫出來`)
    assert.ok(el.querySelector('svg.icon'), `${type} 缺圖示`)
    assert.equal(el.getAttribute('aria-hidden'), 'true', `${type} 應對報讀器隱藏`)
    assert.equal(!!el.querySelector('[data-message-close]'), w.TYPES[type].closable, `${type} 的關閉鈕不符規格`)
  }
  ok('四種型別都有圖示、aria-hidden，關閉鈕符合規格')

  // --- 捷徑方法 ---
  await clear()
  w.message.success('捷徑')
  assert.ok(d.querySelector('.bo-message.is-success'), 'message.success 無效')
  ok('message.success / info / warning / error 捷徑可用')

  // --- 轉義：後端字串不得被當成 HTML ---
  await clear()
  w.message.error('<img src=x onerror=alert(1)> 000412')
  const risky = d.querySelector('.bo-message-text')
  assert.equal(risky.querySelector('img'), null, '訊息內容未轉義')
  assert.ok(risky.textContent.includes('000412'))
  ok('訊息內容有轉義，不會把後端字串當 HTML')

  // --- 合併計數：相同型別＋相同文案只留一則 ---
  await clear()
  for (let i = 0; i < 4; i++) w.message.success('已儲存 3 項篩選條件')
  assert.equal(shown().length, 1, '相同訊息應合併成一則')
  const badge = d.querySelector('.bo-message-count')
  assert.equal(badge.hidden, false)
  assert.equal(badge.textContent, '×4')
  ok('相同訊息合併計數，不疊成一排')

  // 不同型別的同一句話不算重複
  w.message.error('已儲存 3 項篩選條件')
  assert.equal(shown().length, 2, '不同型別不該被合併')
  ok('型別不同就不合併')

  // --- 同時顯示上限 ---
  await clear()
  for (let i = 0; i < w.MAX_VISIBLE + 3; i++) w.message.info(`第 ${i} 則`)
  assert.equal(shown().length, w.MAX_VISIBLE, `同時顯示應上限 ${w.MAX_VISIBLE} 則`)
  assert.ok(shown()[0].textContent.includes('第 3'), '超過上限時應移除最舊的')
  ok(`同時最多 ${w.MAX_VISIBLE} 則，超過移除最舊的`)

  // --- live region 播報 ---
  const region = d.querySelector('.bo-message-live')
  assert.ok(region, '缺少 live region')
  const politeEl = region.firstElementChild, assertiveEl = region.lastElementChild
  assert.equal(politeEl.getAttribute('aria-live'), 'polite')
  assert.equal(assertiveEl.getAttribute('aria-live'), 'assertive')
  assert.equal(assertiveEl.getAttribute('role'), 'alert')
  await clear()
  w.message.success('已停用會員 MB-009821')
  await wait(120)
  assert.ok(politeEl.textContent.includes('已停用會員'), '成功訊息未進 polite region')
  assert.equal(assertiveEl.textContent, '', '成功訊息不該進 assertive region')
  w.message.error('000412 出款金額超過單筆上限')
  await wait(120)
  assert.ok(assertiveEl.textContent.includes('000412'), '錯誤訊息未進 assertive region')
  ok('live region：成功走 polite、錯誤走 assertive')

  // --- 自動消失與手動關閉 ---
  await clear()
  w.message.info('很快就會消失', { duration: 80 })
  assert.equal(shown().length, 1)
  await wait(500)
  assert.equal(shown().length, 0, '到時間未自動移除')
  w.message.error('要手動關掉', { duration: 0 })
  await wait(200)
  assert.equal(shown().length, 1, 'duration 0 不該自動消失')
  d.querySelector('[data-message-close]').click()
  await wait(500)
  assert.equal(shown().length, 0, '關閉鈕無效')
  ok('duration 到期自動移除、duration 0 不消失、關閉鈕可用')

  // --- 沒有 popover 支援時要退回 z-index，而不是整個不顯示 ---
  const host = d.querySelector('.bo-message-list')
  assert.ok(host.classList.contains('is-fallback'), '無 popover 時應加上 is-fallback')
  const css = fs.readFileSync('message.css', 'utf8')
  assert.ok(/\.bo-message-list\.is-fallback\s*\{[^}]*z-index:\s*\d+/.test(css), 'fallback 沒有 z-index')
  assert.ok(css.includes(':popover-open'), '缺少 popover 顯示規則')
  ok('無 popover 支援時退回 z-index，不會整個看不見')

  // --- 背景必須是實色 ---
  // Toast 浮在內容之上，半透明會透出底下的文字。曾經因為語意色那幾條只寫 rgba()，
  // 把基礎規則的 background:#fff 整個蓋掉，白底就消失了。
  const messageCss = fs.readFileSync('message.css', 'utf8')
  // \s* 與 [\s\S] 讓它容忍 prettier 把宣告排成多行，斷言驗的是語意不是排版
  const typeRules = [...messageCss.matchAll(/\.bo-message\.is-(\w+)\s*\{[^}]*?background:([\s\S]*?);/g)]
  assert.equal(typeRules.length, 4, 'message.css 的四條語意色規則找不齊，選擇器可能改了')
  const translucent = typeRules
    .filter(([, , bg]) => !/#fff|#ffffff|\bwhite\b/i.test(bg))
    .map(([, type]) => type)
  assert.deepEqual(translucent, [], '以下型別的 Toast 背景不是實色，會透出底下的內容：' + translucent.join('、'))
  ok('四種型別的 Toast 背景都是實色')

  // --- 示範按鈕的顏色要與它發出的 Toast 相同 ---
  // 規範頁的按鈕本身就是示範。按下綠色按鈕卻跳出藍色提示，等於在教人
  // 「顏色不代表什麼」。這個對應散在三個檔案，用眼睛比對不出來。
  const guideSource = fs.readFileSync('message-guide.js', 'utf8')
  const kindMatch = guideSource.match(/const KIND = \{([^}]*)\}/)
  assert.ok(kindMatch, 'message-guide.js 找不到 KIND 對應表')
  const kind = Object.fromEntries(
    [...kindMatch[1].matchAll(/(\w+):\s*'(btn-[\w-]+)'/g)].map(x => [x[1], x[2]])
  )

  // 語意色的最終值要依 styles/index.css 的層疊順序算，不能只看單一檔案
  const cssOrder = [...fs.readFileSync('styles/index.css', 'utf8').matchAll(/@import '\.\/([^']+)'/g)].map(x => x[1])
  const buttonColour = {}
  for (const file of cssOrder) {
    const text = fs.readFileSync('styles/' + file, 'utf8')
    for (const rule of text.matchAll(/([^{}]*\.btn-[a-z]+[^{}]*)\{([^}]*)\}/g)) {
      if (rule[1].includes('.outline')) continue
      const bg = rule[2].match(/background:\s*(#[0-9a-fA-F]{6})/)
      if (!bg) continue
      for (const cls of rule[1].match(/\.btn-[a-z]+/g) || []) buttonColour[cls.slice(1)] = bg[1].toUpperCase()
    }
  }

  // Toast 的語意色改用狀態變數（--success 之類）之後，要先把變數解析回色碼才能
  // 跟按鈕的最終背景色比對——比的是「畫面上是不是同一個顏色」，不是寫法。
  const tokenHome = fs.readFileSync('styles/blue-teal-palette-override.css', 'utf8')
  const resolve = value => {
    const v = value.trim()
    if (!v.startsWith('var(')) return v.toUpperCase()
    const name = v.slice(4, -1).trim()
    const m = tokenHome.match(new RegExp(name + ':\\s*([^;]+);'))
    assert.ok(m, `找不到 ${name} 的定義`)
    return resolve(m[1])
  }
  const toastColour = Object.fromEntries(
    [...messageCss.matchAll(/\.bo-message\.is-(\w+)\s*\{\s*color:\s*(#[0-9a-fA-F]{6}|var\(--[\w-]+\))/g)]
      .map(x => [x[1], resolve(x[2])])
  )

  const mismatched = []
  for (const [type, cls] of Object.entries(kind)) {
    const btn = buttonColour[cls]
    const toast = toastColour[type]
    assert.ok(btn, `找不到 ${cls} 的最終顏色`)
    assert.ok(toast, `message.css 找不到 is-${type} 的顏色`)
    if (btn !== toast) mismatched.push(`${type}：按鈕 ${cls} 是 ${btn}，但 Toast 是 ${toast}`)
  }
  assert.deepEqual(mismatched, [], '示範按鈕與它發出的 Toast 不同色：\n  ' + mismatched.join('\n  '))
  ok('四個示範按鈕都與它發出的 Toast 同色')



  // --- 規範頁 ---
  w.eval([
    'const message=window.message,TYPES=window.TYPES,MAX_VISIBLE=window.MAX_VISIBLE,',
    'icon=window.icon,onMatch=window.__onMatch,prepareModal=()=>{};const guidePage=window.guidePage,decisionTable=window.decisionTable;',
    strip(fs.readFileSync('message-guide.js', 'utf8')),
  ].join(''))
  d.querySelector('.page').innerHTML = w.renderMessageGuide()
  const q = s => { const e = d.querySelector(s); assert.ok(e, '缺少 ' + s); return e }
  assertGuideSkeleton(d, 'message-guide', '訊息提示')
  assert.equal(d.querySelectorAll('.message-type-card').length, 4)
  assert.equal(d.querySelectorAll('[data-message-demo]').length, 4)
  q('.message-copy-compare .is-bad')
  q('.message-copy-compare .is-good')
  q('[data-message-repeat]')
  q('[data-message-modal]')
  ok('規範頁：型別、文案對照、堆疊與彈窗示範齊全')
  ok('版面骨架與「頁籤 Tabs」一致（style-guide / card 內距 / h3 小節 / 共用規格 / 使用規則）')

  // 決策表要涵蓋 Toast 以外的層級，否則只是在教人到處用 Toast
  const whenText = q('.message-when-table').textContent
  for (const keyword of ['行內錯誤', '彈窗', '狀態區']) {
    assert.ok(whenText.includes(keyword), `決策表缺少「${keyword}」`)
  }
  ok('決策表涵蓋行內錯誤、彈窗與狀態區')

  // 示範按鈕要真的發得出訊息
  await clear()
  q('[data-message-demo="error"]').click()
  assert.equal(shown().length, 1, '示範按鈕沒發出訊息')
  assert.ok(d.querySelector('.bo-message.is-error'))
  ok('規範頁的示範按鈕可用')

  // --- 舊的 toast 實作要已經移除 ---
  const html = fs.readFileSync('index.html', 'utf8')
  assert.ok(!html.includes('id="toast"'), 'index.html 仍有舊的 #toast 容器')
  assert.ok(html.includes('window.message?.info'), 'toast() 未轉接到共用系統')
  assert.ok(!fs.readFileSync('styles/base.css', 'utf8').includes('.toast'), 'base.css 仍有舊 toast 樣式')
  ok('舊的 toast 實作已移除，呼叫點轉接到共用系統')

  console.log('\nPASS: 訊息提示（型別、轉義、合併、上限、live region、生命週期、fallback、規範頁）')
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
