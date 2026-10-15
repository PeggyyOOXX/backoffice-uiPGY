// 移植：ElMessage（正式後台 189 處在用，全部是 EP 預設值）。詳見 MESSAGE-SYSTEM.md
//
// 與 ElMessage 的對應：
//   message.success('已儲存篩選條件')  ↔  ElMessage.success(t('filter_saved'))
//   message.error(`${code} ${msg}`)    ↔  ElMessage.error(`${code} ${msg}`)
//
// 與 EP 預設的三個差異，理由見 MESSAGE-SYSTEM.md：
//   1. 相同訊息合併計數，不疊成一排（EP 的 grouping 預設是 false）
//   2. error 停留較久並可手動關閉（EP 全部 3 秒、無關閉鈕）
//   3. 用 popover 進 top layer，才蓋得過 <dialog>.showModal()（EP 靠 z-index，原型蓋不過）
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './message.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * 四種型別。duration 與 closable 的差別是刻意的：
 * 成功只是回報，看不到也不影響；錯誤帶著代碼與原因，使用者需要時間讀完，甚至要截圖。
 */
export const TYPES = {
  success: { icon: 'checkCircle', duration: 3000, closable: false, assertive: false, label: '成功' },
  info: { icon: 'info', duration: 3000, closable: false, assertive: false, label: '一般' },
  warning: { icon: 'warning', duration: 4000, closable: true, assertive: true, label: '警告' },
  error: { icon: 'cancelCircle', duration: 5000, closable: true, assertive: true, label: '錯誤' },
}

/** 同時最多顯示幾則；超過就移除最舊的那則，避免整個畫面被洗掉。 */
export const MAX_VISIBLE = 5

// `popover` 讓容器進 top layer。原型的彈窗是 <dialog>.showModal()，同樣在 top layer，
// 而 top layer 是一個堆疊——後進的畫在上面——所以每次新增訊息都重新 show 一次，
// 訊息才會蓋在彈窗之上。沒有 popover 支援時退回 z-index（舊瀏覽器會被彈窗蓋住，可接受）。
const SUPPORTS_POPOVER = typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover')

let list = null
let polite = null
let assertive = null
const active = new Map() // `${type}|${text}` → { element, timer, count }

function ensureHost() {
  if (list || typeof document === 'undefined') return list
  list = document.createElement('div')
  list.className = 'bo-message-list'
  if (SUPPORTS_POPOVER) list.popover = 'manual'
  else list.classList.add('is-fallback')

  // 視覺上的訊息對螢幕報讀器隱藏，改由兩個常駐的 live region 播報。
  // live region 必須在內容插入「之前」就存在才會被播報，所以不能靠訊息本身帶 role。
  const region = document.createElement('div')
  region.className = 'bo-message-live'
  region.innerHTML = '<div aria-live="polite" aria-atomic="true"></div><div role="alert" aria-live="assertive" aria-atomic="true"></div>'
  polite = region.firstElementChild
  assertive = region.lastElementChild

  document.body.append(list, region)
  return list
}

function raise() {
  if (!SUPPORTS_POPOVER) return
  // 已經在 top layer 的話先退出再進入，才會排到堆疊最上面。
  try { list.hidePopover() } catch {}
  try { list.showPopover() } catch {}
}

function dismiss(entry) {
  clearTimeout(entry.timer)
  active.delete(entry.key)
  entry.element.classList.add('is-leaving')
  const remove = () => {
    entry.element.remove()
    if (!list.children.length && SUPPORTS_POPOVER) { try { list.hidePopover() } catch {} }
  }
  entry.element.addEventListener('transitionend', remove, { once: true })
  setTimeout(remove, 400) // transitionend 在 prefers-reduced-motion 下可能不觸發
}

/**
 * 顯示一則訊息。
 * @param text 已經是最終文案；呼叫端負責翻譯與轉義前的內容
 * @param type success / info / warning / error
 * @param options.duration 0 表示不自動消失
 * @param options.closable 覆寫型別預設
 */
export function message(text, type = 'info', options = {}) {
  const spec = TYPES[type] ?? TYPES.info
  const host = ensureHost()
  if (!host) return

  const key = `${type}|${text}`
  const duration = options.duration ?? spec.duration
  const closable = options.closable ?? spec.closable

  // 相同型別＋相同文案在畫面上時只累加計數，不再疊一則。
  // 正式後台沒開 grouping，連按十次儲存就會疊十個「成功」。
  const existing = active.get(key)
  if (existing) {
    existing.count += 1
    const badge = existing.element.querySelector('.bo-message-count')
    badge.textContent = `×${existing.count}`
    badge.hidden = false
    clearTimeout(existing.timer)
    if (duration) existing.timer = setTimeout(() => dismiss(existing), duration)
    raise()
    return existing.element
  }

  const element = document.createElement('div')
  element.className = `bo-message is-${type}`
  element.dataset.messageKey = key
  element.innerHTML = [
    `<span class="bo-message-icon">${icon(spec.icon, 20)}</span>`,
    `<span class="bo-message-text">${esc(text)}</span>`,
    `<em class="bo-message-count" hidden></em>`,
    closable ? `<button type="button" class="bo-message-close" data-message-close aria-label="關閉訊息">${icon('close', 16)}</button>` : '',
  ].join('')
  element.setAttribute('aria-hidden', 'true') // 播報交給下方的 live region

  host.append(element)
  while (host.children.length > MAX_VISIBLE) {
    const oldest = host.firstElementChild
    const entry = active.get(oldest.dataset.messageKey)
    if (entry) dismiss(entry)
    else oldest.remove()
  }

  const entry = { key, element, count: 1, timer: null }
  active.set(key, entry)
  if (duration) entry.timer = setTimeout(() => dismiss(entry), duration)

  // 同一段文字連續出現時，先清空才會被再次播報。
  const region = spec.assertive ? assertive : polite
  region.textContent = ''
  setTimeout(() => { region.textContent = `${spec.label}：${text}` }, 50)

  raise()
  requestAnimationFrame(() => element.classList.add('is-in'))
  return element
}

for (const type of Object.keys(TYPES)) {
  message[type] = (text, options) => message(text, type, options)
}

/**
 * 清掉畫面上全部訊息。換頁時用，避免上一頁的回報留到下一頁。
 * live region 也要一起清空：否則同一句話下次再出現時內容沒變，不會被重新播報。
 */
message.clear = () => {
  for (const entry of [...active.values()]) dismiss(entry)
  if (polite) polite.textContent = ''
  if (assertive) assertive.textContent = ''
}

onMatch('click', '[data-message-close]', (event, button) => {
  const element = button.closest('.bo-message')
  const entry = active.get(element?.dataset.messageKey)
  if (entry) dismiss(entry)
}, { owner: 'message' })

window.message = message
