// 全站事件委派的單一入口。
//
// 原本 13 個模組各自呼叫 document.addEventListener，共 49 個全域監聽，沒有擁有權邊界：
// 遷移頁籤時舊的 keydown handler 沒刪乾淨，方向鍵就會跳兩格，而且編譯、測試都不會報錯。
//
// 這裡做三件事：
//   1. 每種事件只掛一個 document 監聽，模組註冊自己的 handler。
//   2. 每筆註冊要寫 owner 與它負責的 selector（claims），形成一份可查的擁有權清單。
//   3. 兩個 owner 宣告同一個 selector 時在主控台警告，點出模組名稱。
//
// handler 的執行順序與語意跟原本完全相同（依註冊順序全部執行），所以遷移不改行為。
// 這一層不會移植到 Vue —— 正式後台用的是 template 上的 @click，沒有委派層。

const roots = new Map()   // `${type}|${capture}` → [registration]
const claimed = new Map() // `${type}|${selector}` → owner

function root(type, capture) {
  const key = `${type}|${capture}`
  let list = roots.get(key)
  if (list) return list
  list = []
  roots.set(key, list)
  document.addEventListener(type, event => {
    // 複製一份再跑：handler 內若又註冊新的 handler，不應在同一次事件中被呼叫。
    for (const entry of [...list]) entry.handler(event)
  }, capture)
  return list
}

/**
 * 註冊一個委派 handler。
 * @param type   事件名稱
 * @param handler 收到原始 event，自行做 closest 判斷（與原本寫法相同）
 * @param owner   模組名稱，衝突警告會印出來
 * @param claims  這個 handler 負責的 selector 清單，只用於擁有權紀錄與衝突偵測
 * @param capture 是否用捕獲階段
 */
export function on(type, handler, { owner, claims = [], capture = false } = {}) {
  if (!owner) throw new Error('delegate.on 需要 owner')
  for (const selector of claims) {
    const key = `${type}|${selector}`
    const previous = claimed.get(key)
    if (previous && previous !== owner) {
      console.warn(`[delegate] ${type} 的 ${selector} 同時被 ${previous} 與 ${owner} 宣告，兩邊都會執行。`)
    }
    claimed.set(key, owner)
  }
  root(type, capture).push({ owner, claims, handler })
}

/** 單一 selector 的簡寫：handler 收到 (event, 命中的元素)。 */
export function onMatch(type, selector, handler, { owner, capture = false } = {}) {
  on(type, event => {
    const target = event.target?.closest?.(selector)
    if (target) handler(event, target)
  }, { owner, claims: [selector], capture })
}

/** 目前的擁有權清單，供主控台查詢：delegateRegistry() */
export const registry = () => [...claimed.entries()]
  .map(([key, owner]) => { const [type, selector] = key.split('|'); return { type, selector, owner } })
  .sort((a, b) => a.owner.localeCompare(b.owner) || a.type.localeCompare(b.type))

window.delegateRegistry = registry
