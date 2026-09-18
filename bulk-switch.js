import { prepareModal } from './modal-system.js'
import { iconButton } from './icon-button.js'
import { choiceControl, choiceCard } from './choice-controls.js'
import './bulk-switch.css'

// Three ways to bulk-toggle several switch columns, based on the old game list page
// (systemGameProviderManagement/game.vue): 批次調整狀態 and 全部狀態調整.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const CATEGORIES = [['front', '前台顯示開關'], ['home', '首頁顯示'], ['hot', '熱門標記']]
const NAMES = ['Mega Fortune', 'Golden Dragon', 'Lucky Panda', 'Ocean King', 'Fruit Party', 'Dragon Tiger', 'Baccarat VIP', 'Roulette Pro']
const makeRows = () => NAMES.map((name, i) => ({ id: `G-${1001 + i}`, name, status: i % 5 ? '啟用' : '停用', front: i % 2 === 0, home: i % 3 === 0, hot: i % 4 === 0 }))
const panels = {
  bar: { rows: makeRows(), selected: new Set(), feedback: '', undo: null },
  head: { rows: makeRows(), selected: new Set(), feedback: '', undo: null, menu: '' },
  dialog: { rows: makeRows(), selected: new Set(), feedback: '', undo: null },
}
const snapshot = panel => panel.rows.map(row => ({ ...row }))
const countOn = (rows, key) => rows.filter(row => row[key]).length

function apply(panel, key, value, scope) {
  const targets = scope === 'all' ? panel.rows : panel.rows.filter(row => panel.selected.has(row.id))
  if (!targets.length) return
  panel.undo = snapshot(panel)
  const changed = targets.filter(row => row[key] !== value).length
  targets.forEach(row => { row[key] = value })
  const label = CATEGORIES.find(([name]) => name === key)[1]
  panel.feedback = changed
    ? `已將 ${targets.length} 筆的「${label}」設為${value ? '開啟' : '關閉'}，實際變更 ${changed} 筆。`
    : `${targets.length} 筆的「${label}」原本就是${value ? '開啟' : '關閉'}，沒有變更。`
}
const switchCell = (panel, row, key) =>
  `<button type="button" class="standard-switch" role="switch" aria-checked="${row[key]}" aria-label="${esc(row.name)} ${CATEGORIES.find(([name]) => name === key)[1]}" id="bulk-${panel}-${row.id}-${key}" data-bulk-toggle data-panel="${panel}" data-id="${row.id}" data-key="${key}"></button>`

function tableMarkup(name, panel, { headMenu = false } = {}) {
  const allChecked = panel.rows.length && panel.rows.every(row => panel.selected.has(row.id))
  const some = panel.selected.size > 0 && !allChecked
  const heading = ([key, label]) => headMenu
    ? `<th scope="col"><span class="bulk-head">${label}${iconButton({ icon: '⋮', label: `${label} 批量調整`, kind: 'btn-neutral', outline: true, attrs: `id="bulk-${name}-menu-${key}" data-bulk-menu="${key}" data-panel="${name}"` })}<div class="bulk-menu" data-bulk-menu-for="${key}" ${panel.menu === key ? '' : 'hidden'}>
        <button type="button" data-bulk-head-action data-panel="${name}" data-key="${key}" data-value="1" data-scope="selected" ${panel.selected.size ? '' : 'disabled'}>已勾選 ${panel.selected.size} 筆設為開啟</button>
        <button type="button" data-bulk-head-action data-panel="${name}" data-key="${key}" data-value="0" data-scope="selected" ${panel.selected.size ? '' : 'disabled'}>已勾選 ${panel.selected.size} 筆設為關閉</button>
        <button type="button" data-bulk-head-action data-panel="${name}" data-key="${key}" data-value="1" data-scope="all">全部 ${panel.rows.length} 筆設為開啟</button>
        <button type="button" data-bulk-head-action data-panel="${name}" data-key="${key}" data-value="0" data-scope="all">全部 ${panel.rows.length} 筆設為關閉</button>
      </div></span></th>`
    : `<th scope="col">${label}</th>`
  return `<table class="bulk-table">
    <thead><tr><th scope="col"><input type="checkbox" id="bulk-${name}-all" aria-label="全選" data-bulk-all data-panel="${name}" ${allChecked ? 'checked' : ''} ${some ? 'data-choice-mixed' : ''}></th><th scope="col">遊戲名稱</th><th scope="col">狀態</th>${CATEGORIES.map(heading).join('')}</tr></thead>
    <tbody>${panel.rows.map(row => `<tr><td><input type="checkbox" id="bulk-${name}-pick-${row.id}" aria-label="勾選 ${esc(row.name)}" data-bulk-row data-panel="${name}" data-id="${row.id}" ${panel.selected.has(row.id) ? 'checked' : ''}></td><td>${esc(row.name)}</td><td><span class="badge ${row.status === '啟用' ? 'active-b' : 'pending-b'}">${row.status}</span></td>${CATEGORIES.map(([key]) => `<td>${switchCell(name, row, key)}</td>`).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3">目前開啟</td>${CATEGORIES.map(([key]) => `<td>${countOn(panel.rows, key)} / ${panel.rows.length}</td>`).join('')}</tr></tfoot>
  </table>`
}
const feedbackMarkup = name => {
  const panel = panels[name]
  return `<p class="bulk-feedback" role="status">${esc(panel.feedback)}${panel.undo ? `<button type="button" class="semantic-btn btn-neutral outline" data-bulk-undo data-panel="${name}">↺ 復原</button>` : ''}</p>`
}
const verdict = items => `<div class="bulk-verdict">${items.map(([tone, title, text]) => `<div class="${tone}"><strong>${title}</strong><p>${text}</p></div>`).join('')}</div>`

function barPanel() {
  const panel = panels.bar
  return `<section class="bulk-option"><h3>方案 A · 勾選後浮出操作列</h3>
  <div class="card bulk-card">
    ${verdict([['is-good', '範圍永遠明確', '操作列只在有勾選時出現，標題直接寫「已選 N 筆」，不可能誤觸到全部。'], ['is-good', '一次改多筆同分類', '三個分類各自一組開啟／關閉，改完立刻看到表格變化。'], ['is-bad', '沒有確認步驟', '改完才知道結果，所以必須提供復原。要改「全部」得先全選。']])}
    <div class="bulk-selection-bar" ${panel.selected.size ? '' : 'hidden'}>
      <span class="bulk-selection-count">已選 ${panel.selected.size} 筆</span>
      ${CATEGORIES.map(([key, label]) => `<span class="bulk-selection-group"><span>${label}</span><button type="button" class="semantic-btn btn-edit outline" data-bulk-bar data-key="${key}" data-value="1">開啟</button><button type="button" class="semantic-btn btn-neutral outline" data-bulk-bar data-key="${key}" data-value="0">關閉</button></span>`).join('')}
      <button type="button" class="semantic-btn btn-neutral bulk-clear" data-bulk-clear>取消選取</button>
    </div>
    ${feedbackMarkup('bar')}${tableMarkup('bar', panel)}
  </div></section>`
}
function headPanel() {
  const panel = panels.head
  return `<section class="bulk-option"><h3>方案 B · 批量控制收進欄位表頭</h3>
  <div class="card bulk-card">
    ${verdict([['is-good', '入口就在它作用的欄位', '不必先理解「批次」和「全部」兩個抽象詞，選單寫的就是「已勾選 N 筆」和「全部 N 筆」。'], ['is-good', '不佔表格以外的空間', '表格上方乾淨，欄位再多也不會擠出一整排下拉。'], ['is-bad', '一次只能改一個分類', '三個分類都要改就得開三次選單。分類多時比方案 C 慢。']])}
    ${feedbackMarkup('head')}${tableMarkup('head', panel, { headMenu: true })}
  </div></section>`
}
function dialogPanel() {
  const panel = panels.dialog
  return `<section class="bulk-option"><h3>方案 C · 批次調整彈窗</h3>
  <div class="card bulk-card">
    ${verdict([['is-good', '一次改完所有分類', '三個分類在同一個彈窗裡設定，只送出一次。'], ['is-good', '有確認與影響範圍', '送出前顯示「將影響 N 筆、共 M 項變更」，不會改錯還不知道。'], ['is-bad', '多一個步驟', '只想改一個開關時比前兩案慢。分類少的頁面用不上。']])}
    <div class="bulk-toolbar"><button type="button" class="semantic-btn btn-edit" data-bulk-open-dialog>▣ 批次調整</button><span class="settings-note">已選 ${panel.selected.size} 筆</span></div>
    ${feedbackMarkup('dialog')}${tableMarkup('dialog', panel)}
  </div></section>`
}
export function renderBulkSwitch() {
  return `<section class="bulk-page" data-bulk-page><h2>分類批量開關</h2>
  <p class="component-description bulk-intro">同一列有多個開關分類時，如何一次調整多筆。三個方案都用同一組示範資料，可以直接操作比較。原後台的做法是表格上方兩排下拉（批次調整狀態／全部狀態調整），選完立刻套用、沒有確認也沒有影響筆數。</p>
  ${barPanel()}${headPanel()}${dialogPanel()}</section>`
}
const redraw = () => {
  const root = document.querySelector('[data-bulk-page]')
  if (!root) return
  const focused = document.activeElement?.id
  root.outerHTML = renderBulkSwitch()
  if (focused) document.getElementById(focused)?.focus()
}
function openDialog() {
  const panel = panels.dialog, trigger = document.activeElement
  const node = document.createElement('dialog')
  const scope = [
    choiceCard({ name: 'bulk-scope', title: `已勾選 ${panel.selected.size} 筆`, text: panel.selected.size ? '只調整目前勾選的資料。' : '尚未勾選任何資料。', checked: panel.selected.size > 0, disabled: !panel.selected.size, attrs: 'value="selected" data-bulk-scope' }),
    choiceCard({ name: 'bulk-scope', title: `全部 ${panel.rows.length} 筆`, text: '調整符合目前搜尋條件的所有資料。', checked: !panel.selected.size, attrs: 'value="all" data-bulk-scope' }),
  ].join('')
  node.innerHTML = `<form><header><h2>批次調整</h2></header><div class="bo-modal-body">
    <fieldset class="choice-group bulk-dialog-scope"><legend>套用範圍</legend><div class="choice-card-grid">${scope}</div></fieldset>
    <div class="bulk-dialog-grid">${CATEGORIES.map(([key, label]) => `<div class="bulk-dialog-row"><span>${label}</span><fieldset class="choice-group is-inline">${[['keep', '不變'], ['on', '開啟'], ['off', '關閉']].map(([value, text]) => choiceControl({ type: 'radio', name: `bulk-${key}`, label: text, checked: value === 'keep', attrs: `value="${value}" data-bulk-field="${key}"` })).join('')}</fieldset></div>`).join('')}</div>
    <p class="bulk-impact"><span>將影響</span><strong data-bulk-impact>0 筆 · 0 項變更</strong></p>
  </div><footer><button type="button" class="semantic-btn btn-neutral" data-bulk-cancel>取消</button><button type="submit" class="semantic-btn btn-search">套用</button></footer></form>`
  prepareModal(node)
  const read = () => ({
    scope: node.querySelector('[data-bulk-scope]:checked')?.value || 'all',
    fields: CATEGORIES.map(([key]) => [key, node.querySelector(`[data-bulk-field="${key}"]:checked`).value]).filter(([, value]) => value !== 'keep'),
  })
  const refresh = () => {
    const { scope, fields } = read()
    const targets = scope === 'all' ? panel.rows : panel.rows.filter(row => panel.selected.has(row.id))
    const changes = fields.reduce((sum, [key, value]) => sum + targets.filter(row => row[key] !== (value === 'on')).length, 0)
    node.querySelector('[data-bulk-impact]').textContent = `${targets.length} 筆 · ${changes} 項變更`
    node.querySelector('[type="submit"]').disabled = !fields.length || !targets.length
  }
  node.addEventListener('change', refresh)
  node.querySelector('[data-bulk-cancel]').onclick = () => node.close()
  node.querySelector('form').onsubmit = event => {
    event.preventDefault()
    const { scope, fields } = read()
    panel.undo = snapshot(panel)
    const targets = scope === 'all' ? panel.rows : panel.rows.filter(row => panel.selected.has(row.id))
    let changed = 0
    fields.forEach(([key, value]) => targets.forEach(row => { if (row[key] !== (value === 'on')) { row[key] = value === 'on'; changed += 1 } }))
    panel.feedback = `已調整 ${targets.length} 筆的 ${fields.length} 個分類，共 ${changed} 項變更。`
    node.close(); redraw()
  }
  node.addEventListener('close', () => { node.remove(); if (trigger?.isConnected) trigger.focus() }, { once: true })
  document.body.append(node); node.showModal(); refresh()
}
document.addEventListener('change', event => {
  const target = event.target
  const panel = panels[target.dataset?.panel]
  if (target.matches('[data-bulk-all]')) { panel.rows.forEach(row => target.checked ? panel.selected.add(row.id) : panel.selected.delete(row.id)); redraw(); return }
  if (target.matches('[data-bulk-row]')) { target.checked ? panel.selected.add(target.dataset.id) : panel.selected.delete(target.dataset.id); redraw() }
})
document.addEventListener('click', event => {
  const root = document.querySelector('[data-bulk-page]')
  if (!root) return
  const toggle = event.target.closest('[data-bulk-toggle]')
  if (toggle) { const panel = panels[toggle.dataset.panel], row = panel.rows.find(item => item.id === toggle.dataset.id); row[toggle.dataset.key] = !row[toggle.dataset.key]; panel.undo = null; panel.feedback = ''; redraw(); return }
  const bar = event.target.closest('[data-bulk-bar]')
  if (bar) { apply(panels.bar, bar.dataset.key, bar.dataset.value === '1', 'selected'); redraw(); return }
  if (event.target.closest('[data-bulk-clear]')) { panels.bar.selected.clear(); redraw(); return }
  const menu = event.target.closest('[data-bulk-menu]')
  if (menu) { panels.head.menu = panels.head.menu === menu.dataset.bulkMenu ? '' : menu.dataset.bulkMenu; redraw(); return }
  const headAction = event.target.closest('[data-bulk-head-action]')
  if (headAction) { apply(panels.head, headAction.dataset.key, headAction.dataset.value === '1', headAction.dataset.scope); panels.head.menu = ''; redraw(); return }
  const undo = event.target.closest('[data-bulk-undo]')
  if (undo) { const panel = panels[undo.dataset.panel]; panel.rows = panel.undo; panel.undo = null; panel.feedback = '已復原上一次批量調整。'; redraw(); return }
  if (event.target.closest('[data-bulk-open-dialog]')) { openDialog(); return }
  // Any other click closes the open column menu.
  if (panels.head.menu && !event.target.closest('.bulk-menu')) { panels.head.menu = ''; redraw() }
})
window.renderBulkSwitch = renderBulkSwitch
