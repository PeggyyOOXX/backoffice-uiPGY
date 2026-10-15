// 移植：正式後台的 SvgIcon.vue（vite-plugin-svg-icons sprite）。詳見 ICON-SYSTEM.md
//
// 圖示來源為 Lucide（ISC）。icon(name, size) 與 <SvgIcon name size> 一對一：
//   icon('edit', 16)        ↔  <SvgIcon name="edit" class="size-4" />
//   icon('loginRecord', 20) ↔  <SvgIcon name="loginRecord" class="size-5" />
//
// 名稱清單在 build-icons.cjs 的 ALLOWLIST，產生 icons-data.js。要用新圖示先加進清單。
import { ICONS, GROUPS } from './icons-data.js'
import './icons.css'

export { GROUPS }
export const ICON_LIST = ICONS

const BY_NAME = Object.fromEntries(ICONS.map(i => [i.name, i]))

/** 規範允許的三個尺寸。其他尺寸不是錯，但不該出現在新版面。 */
export const SIZES = [16, 20, 24]

// Lucide 的 stroke-width 2 是為 24px 畫的；縮到 16px 時實際線寬只剩 2 × 16/24 = 1.33px，
// 在非整數 DPI 的螢幕上會糊。這裡做部分補償——不是補到等寬（那會讓小圖示糊成一團），
// 而是補到 16px 仍有 1.67px。數值與 ICON-SYSTEM.md 第十節第 2 點的表一致。
const STROKE = { 24: 2, 20: 2.25, 16: 2.5 }
const strokeFor = size => STROKE[size] ?? +(2 * Math.sqrt(24 / size)).toFixed(2)

const warned = new Set()

/**
 * 產生一個圖示的 SVG 字串。
 * @param name  許可清單上的名稱
 * @param size  16 / 20 / 24
 * @param extra 額外的 class，用於微調對齊
 */
export function icon(name, size = 16, extra = '') {
  const entry = BY_NAME[name]
  if (!entry) {
    // 清單外的名字一律不畫，而且只警告一次，免得在迴圈裡洗版。
    // 正式後台的 <use href="#icon-xxx"> 在這種情況是靜默空白，比這個更難查。
    if (!warned.has(name)) {
      warned.add(name)
      console.warn(`[icons] 「${name}」不在許可清單上。先加進 build-icons.cjs 的 ALLOWLIST 再重跑。`)
    }
    return ''
  }
  return `<svg class="icon${extra ? ' ' + extra : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeFor(size)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${entry.body}</svg>`
}

/** 查某個名稱在不在清單上，供測試與規範頁使用。 */
export const hasIcon = name => name in BY_NAME

/**
 * 把 `<span data-icon="edit">` 這種空殼填成真的 SVG。
 *
 * index.html 的側欄是靜態 HTML，而且頁面主體由一支 **classic** inline script 以
 * 樣板字串重畫——它不是 module，沒辦法 import icon()，而且它比所有 module 先執行。
 * 所以那邊一律寫 data-icon，由這裡補上，module 內部則直接呼叫 icon()。
 *
 * `:empty` 讓重複呼叫不會重畫已經填好的格子，也讓這個函式對自己造成的 DOM 變動免疫。
 */
export function hydrate(root) {
  // 沒有 DOM 就什麼都不做：這個函式會從 observer 的 callback 被呼叫，
  // 而測試環境（jsdom）的 timer 回來時不保證還拿得到 document。
  const scope = root ?? (typeof document === 'undefined' ? null : document)
  if (!scope?.querySelectorAll) return
  scope.querySelectorAll('[data-icon]:empty').forEach(el => {
    el.innerHTML = icon(el.dataset.icon, +el.dataset.iconSize || 16)
  })
}

// 路由切換是 `pageEl.innerHTML = route()`，發生在 inline script 裡，這一層攔不到，
// 所以用 observer 接所有新進 DOM；一幀只掃一次，避免每次 mutation 都查一輪。
let queued = false
new MutationObserver(() => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => { queued = false; hydrate() })
}).observe(document.documentElement, { childList: true, subtree: true })

hydrate()

window.icon = icon
