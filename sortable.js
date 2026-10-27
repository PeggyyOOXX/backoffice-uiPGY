// 移植：Element Plus 沒有拖曳排序。正式後台 package.json 裡有三套拖曳套件，只有 sortSetting/index.vue 在用；
// 移植時留 vue-draggable-plus 一套（見 ELEMENT-PLUS-MAPPING.md 的「建議清理」），回饋樣式照 sortable.css。
//
// 拖曳排序的共用行為。頁面只負責兩件事：在列上標記、在 onReorder 裡改資料並重畫。
//   列：   data-sort-group="群組名" data-sort-item="id" data-sort-label="給拖曳影像看的名稱"
//   把手： data-sort-handle（放在列裡；只有從把手按下去才會開始拖）
//   註冊： sortable('群組名', { onReorder(fromId, toId, place) { …改資料、重畫… } })
//
// 用 Pointer Events 自己做，不用瀏覽器原生的 HTML5 drag and drop：原生拖曳只認滑鼠，
// 手機上手指按住把手完全不會觸發。Pointer Events 讓滑鼠、手指、觸控筆走同一條路。
//
// 拖曳時看得出三件事：
//   1. 拿起的是哪一列——來源列留在原位變淡；另有一張小卡跟著游標或手指走（手指會蓋住列）
//   2. 會放到哪裡——目標列的上緣或下緣出現一條 2px 主題色的插入線，左端帶圓點
//   3. 放完落在哪裡——移過去的那一列底色亮一下再淡掉
// 插入線是「放在這一列之前／之後」，不是「跟這一列交換」：游標在目標列上半部就插在它前面，
// 下半部就插在它後面。放了不會動的位置（自己、緊鄰自己的那條縫）不畫線。
import { on, onMatch } from './delegate.js'
import { icon } from './icons.js'
import './sortable.css'

const groups = new Map()
const THRESHOLD = 4   // 按下後移動超過 4px 才算開始拖，單純點一下把手不會進入拖曳
let press = null      // 在把手上按下、還沒開始拖：{ row, group, id, x, y, pointerId }
let drag = null       // 拖曳中：{ group, id, row, ghost, x, y, scroller }

const rowsOf = group => [...document.querySelectorAll(`[data-sort-group="${group}"][data-sort-item]`)]
const idOf = row => row.dataset.sortItem

let live
function announce(text) {
  if (!live) {
    live = Object.assign(document.createElement('div'), { className: 'sortable-live' })
    live.setAttribute('aria-live', 'polite')
    document.body.append(live)
  }
  live.textContent = ''
  requestAnimationFrame(() => { live.textContent = text })
}

const clearMarks = () => document.querySelectorAll('.is-drop-before, .is-drop-after')
  .forEach(row => row.classList.remove('is-drop-before', 'is-drop-after'))

// 放了不會動的位置不畫線：自己，以及自己上一列的下緣、下一列的上緣
function isNoop(group, fromId, toId, place) {
  if (fromId === toId) return true
  const ids = rowsOf(group).map(idOf)
  const from = ids.indexOf(fromId), to = ids.indexOf(toId)
  return (place === 'after' && to === from - 1) || (place === 'before' && to === from + 1)
}

function settle(group, id) {
  const row = rowsOf(group).find(r => idOf(r) === id)
  if (!row) return
  row.classList.add('is-sort-moved')
  setTimeout(() => row.classList.remove('is-sort-moved'), 1200)
  const ids = rowsOf(group).map(idOf)
  announce(`已移到第 ${ids.indexOf(id) + 1} 位，共 ${ids.length} 項`)
  return row
}

/** 註冊一個可排序的群組。enabled 回傳 false 時不回應拖曳與方向鍵（例如還沒進入排序模式）。 */
export function sortable(group, { onReorder, enabled = () => true }) {
  groups.set(group, { onReorder, enabled })
}

/**
 * 只調整可見項目的相對次序，隱藏的項目（被篩選掉的）留在原位。
 * list：完整清單；visibleIds：目前看得到的 id；回傳新的完整清單。
 */
export function reorder(list, visibleIds, fromId, toId, place, key = item => String(item.id)) {
  const visible = list.filter(item => visibleIds.includes(key(item)))
  const moving = visible.find(item => key(item) === fromId)
  if (!moving || fromId === toId) return list
  const rest = visible.filter(item => item !== moving)
  const at = rest.findIndex(item => key(item) === toId)
  if (at < 0) return list
  rest.splice(place === 'after' ? at + 1 : at, 0, moving)
  let i = 0
  return list.map(item => (visibleIds.includes(key(item)) ? rest[i++] : item))
}

// 會捲動的最近一層：側欄固定之後，內容區是自己捲的，不一定是 window
function scrollerOf(el) {
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return document.scrollingElement
}

function start(event) {
  const { row, group, id } = press
  const ghost = document.createElement('div')
  ghost.className = 'sortable-ghost'
  ghost.innerHTML = `${icon('drag', 16)}<span></span>`
  ghost.querySelector('span').textContent = row.dataset.sortLabel || row.textContent.trim().slice(0, 30)
  document.body.append(ghost)
  row.classList.add('is-sort-source')
  document.body.classList.add('is-sort-dragging')
  drag = { group, id, row, ghost, x: event.clientX, y: event.clientY, scroller: scrollerOf(row) }
  requestAnimationFrame(autoScroll)
}

// 依目前的游標位置找目標列、畫插入線。捲動後也要重算，所以獨立出來。
function mark() {
  const { x, y, group, id } = drag
  drag.ghost.style.transform = `translate(${x + 12}px, ${y + 12}px)`
  const row = document.elementFromPoint?.(x, y)?.closest?.(`[data-sort-group="${group}"][data-sort-item]`)
  clearMarks()
  if (!row) return
  const rect = row.getBoundingClientRect()
  const place = y < rect.top + rect.height / 2 ? 'before' : 'after'
  if (!isNoop(group, id, idOf(row), place)) row.classList.add(`is-drop-${place}`)
}

// 拖到可視範圍的上下緣時自動捲動——手機一畫面只放得下幾列，不捲就拖不到遠處。
// 上緣的感應區比較大，因為手機上方疊著頁首、工作區頁籤與搜尋條件開關。
function autoScroll() {
  if (!drag) return
  const el = drag.scroller
  const isRoot = el === document.scrollingElement
  const top = isRoot ? 0 : el.getBoundingClientRect().top
  const bottom = isRoot ? window.innerHeight : el.getBoundingClientRect().bottom
  const zone = Math.min(160, (bottom - top) * 0.2)
  let delta = 0
  if (drag.y < top + zone) delta = -Math.ceil((top + zone - drag.y) / 8)
  else if (drag.y > bottom - zone / 2) delta = Math.ceil((drag.y - (bottom - zone / 2)) / 8)
  if (delta) { el.scrollTop += delta; mark() }
  requestAnimationFrame(autoScroll)
}

function cleanup() {
  clearMarks()
  drag?.ghost.remove()
  drag?.row.classList.remove('is-sort-source')
  document.body.classList.remove('is-sort-dragging')
  drag = null
  press = null
}

onMatch('pointerdown', '[data-sort-handle]', (event, handle) => {
  if (event.button !== 0) return
  const row = handle.closest('[data-sort-item]')
  const group = row?.dataset.sortGroup
  if (!row || !groups.get(group)?.enabled()) return
  press = { row, group, id: idOf(row), x: event.clientX, y: event.clientY, pointerId: event.pointerId }
  // 手指離開把手之後事件仍要送回來，否則拖到別列上就收不到 pointermove
  handle.setPointerCapture?.(event.pointerId)
}, { owner: 'sortable' })

on('pointermove', event => {
  if (!press || event.pointerId !== press.pointerId) return
  if (!drag) {
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < THRESHOLD) return
    start(event)
  }
  event.preventDefault()
  drag.x = event.clientX
  drag.y = event.clientY
  mark()
}, { owner: 'sortable' })

on('pointerup', event => {
  if (!press || event.pointerId !== press.pointerId) return
  if (drag) {
    const target = document.querySelector(`[data-sort-group="${drag.group}"].is-drop-before, [data-sort-group="${drag.group}"].is-drop-after`)
    const { group, id } = drag
    const place = target?.classList.contains('is-drop-before') ? 'before' : 'after'
    cleanup()
    if (target) {
      groups.get(group).onReorder(id, idOf(target), place)
      settle(group, id)
    }
    return
  }
  press = null
}, { owner: 'sortable' })

on('pointercancel', cleanup, { owner: 'sortable' })

// 鍵盤：把手聚焦後按上下方向鍵一次移一格。拖曳是指標裝置才有的操作，不能只靠它。
onMatch('keydown', '[data-sort-handle]', (event, handle) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  const row = handle.closest('[data-sort-item]')
  const group = row?.dataset.sortGroup
  if (!row || !groups.get(group)?.enabled()) return
  event.preventDefault()
  const ids = rowsOf(group).map(idOf)
  const id = idOf(row)
  const index = ids.indexOf(id)
  const up = event.key === 'ArrowUp'
  const target = ids[index + (up ? -1 : 1)]
  if (target == null) return
  groups.get(group).onReorder(id, target, up ? 'before' : 'after')
  settle(group, id)?.querySelector('[data-sort-handle]')?.focus()
}, { owner: 'sortable' })
