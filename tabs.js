// 移植：el-tabs／el-tab-pane（line=預設、card=type="card"）。tab-before-change → :before-leave。手機下拉、邊緣漸層、自動捲動 EP 沒有，需保留自製。詳見 ELEMENT-PLUS-MAPPING.md
import { on } from './delegate.js'
import './tabs.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Shared Tabs. One tablist markup for every variant; pages pick a variant and a
// mobile behaviour and never restyle the tabs themselves.
//   variant: 'line'（頁面層級，預設）｜'card'（內容區塊次層）｜'workspace'（可關閉的工作區頁籤）
//   mobile:  'scroll'（橫向捲動，預設）｜'select'（手機改用共用 Select）
// Panels are optional: put [data-tab-panel="<key>"] inside [data-tabs-panels="<id>"]
// and the component shows and hides them; pages that re-render can ignore that.
// `controls` is for pages that keep one panel and re-render it themselves; leave it
// out to use tabPanels() below, which the component shows and hides.
export function tabs({ id, label, items, active, variant = 'line', mobile = 'scroll', panels = true, controls = '' }) {
  const current = active ?? items.find(item => !item.disabled)?.key
  const owns = item => (controls ? ` aria-controls="${esc(controls)}"` : panels ? ` aria-controls="${esc(id)}-panel-${esc(item.key)}"` : '')
  const tab = item => {
    const selected = item.key === current
    return `<button type="button" role="tab" id="${esc(id)}-tab-${esc(item.key)}"${owns(item)} aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-tab-key="${esc(item.key)}" class="bo-tab${selected ? ' is-active' : ''}"${item.disabled ? ' disabled' : ''} ${item.attrs ?? ''}><span>${esc(item.label)}</span>${item.count == null ? '' : `<em class="bo-tab-count">${esc(item.count)}</em>`}${variant === 'workspace' && item.closable ? `<i class="bo-tab-close" data-tab-close="${esc(item.key)}" role="button" tabindex="-1" aria-label="關閉 ${esc(item.label)}">×</i>` : ''}</button>`
  }
  const option = item => `<option value="${esc(item.key)}"${item.key === current ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${esc(item.label)}${item.count == null ? '' : `（${esc(item.count)}）`}</option>`
  return `<div class="bo-tabs bo-tabs-${esc(variant)}" data-tabs="${esc(id)}" data-tabs-mobile="${esc(mobile)}">
    <div class="bo-tabs-rail"><div class="bo-tabs-scroll" role="tablist" aria-label="${esc(label)}">${items.map(tab).join('')}</div></div>
    ${mobile === 'select' ? `<div class="bo-tabs-select"><select class="guide-input guide-select" data-tabs-select="${esc(id)}" aria-label="${esc(label)}">${items.map(option).join('')}</select></div>` : ''}
  </div>`
}

// Panel wrapper that matches the ids tabs() produces.
export const tabPanels = (id, panels, active) => `<div data-tabs-panels="${esc(id)}">${panels.map(([key, content]) => `<div id="${esc(id)}-panel-${esc(key)}" role="tabpanel" aria-labelledby="${esc(id)}-tab-${esc(key)}" data-tab-panel="${esc(key)}"${key === active ? '' : ' hidden'}>${content}</div>`).join('')}</div>`

const tabsOf = root => [...root.querySelectorAll('[data-tab-key]')]
const activeKey = root => root.querySelector('[data-tab-key][aria-selected="true"]')?.dataset.tabKey

// Keeps the active tab visible when the rail scrolls horizontally on narrow screens.
function revealActive(root) {
  const button = root.querySelector('[data-tab-key][aria-selected="true"]')
  const rail = root.querySelector('.bo-tabs-scroll')
  if (!button || !rail || rail.scrollWidth <= rail.clientWidth) return
  const left = button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2
  rail.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
}

// Edge shadows only show on the side that still has content to scroll to.
function markEdges(root) {
  const rail = root.querySelector('.bo-tabs-scroll')
  if (!rail) return
  const scrollable = rail.scrollWidth - rail.clientWidth > 1
  root.classList.toggle('has-start', scrollable && rail.scrollLeft > 1)
  root.classList.toggle('has-end', scrollable && rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 1)
}

function select(root, key, { focus = false } = {}) {
  const target = tabsOf(root).find(button => button.dataset.tabKey === key)
  if (!target || target.disabled || activeKey(root) === key) return
  // A page can veto the change — used for unsaved-changes guards.
  if (!root.dispatchEvent(new CustomEvent('tab-before-change', { detail: { key, from: activeKey(root) }, cancelable: true, bubbles: true }))) {
    syncSelect(root)
    return
  }
  for (const button of tabsOf(root)) {
    const isActive = button === target
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-selected', String(isActive))
    button.tabIndex = isActive ? 0 : -1
  }
  const panels = document.querySelector(`[data-tabs-panels="${root.dataset.tabs}"]`)
  if (panels) {
    for (const panel of panels.querySelectorAll('[data-tab-panel]')) panel.hidden = panel.dataset.tabPanel !== key
  }
  syncSelect(root)
  if (focus) target.focus()
  revealActive(root)
  markEdges(root)
  root.dispatchEvent(new CustomEvent('tab-change', { detail: { key }, bubbles: true }))
}

function syncSelect(root) {
  const native = root.querySelector('[data-tabs-select]')
  if (!native) return
  native.value = activeKey(root) ?? ''
  window.syncSelects?.()
}

on('click', event => {
  const close = event.target.closest('[data-tab-close]')
  if (close) {
    const root = close.closest('.bo-tabs')
    const button = close.closest('[data-tab-key]')
    const wasActive = button.getAttribute('aria-selected') === 'true'
    const next = button.nextElementSibling ?? button.previousElementSibling
    button.remove()
    root.dispatchEvent(new CustomEvent('tab-close', { detail: { key: close.dataset.tabClose }, bubbles: true }))
    if (wasActive && next) select(root, next.dataset.tabKey)
    markEdges(root)
    return
  }
  const button = event.target.closest('[data-tab-key]')
  if (button) select(button.closest('.bo-tabs'), button.dataset.tabKey)
}, { owner: 'tabs', claims: ['[data-tab-close]', '[data-tab-key]'] })

// Automatic activation: arrow keys move focus and switch at the same time, which is
// what the existing settings tabs already do.
on('keydown', event => {
  const button = event.target.closest?.('[data-tab-key]')
  if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const root = button.closest('.bo-tabs')
  const usable = tabsOf(root).filter(item => !item.disabled)
  if (usable.length < 2) return
  event.preventDefault()
  const index = usable.indexOf(button)
  const next = event.key === 'Home' ? 0
    : event.key === 'End' ? usable.length - 1
    : (index + (event.key === 'ArrowRight' ? 1 : usable.length - 1)) % usable.length
  select(root, usable[next].dataset.tabKey, { focus: true })
}, { owner: 'tabs', claims: ['[data-tab-key]'] })

on('change', event => {
  const native = event.target.closest('[data-tabs-select]')
  if (!native) return
  select(document.querySelector(`[data-tabs="${native.dataset.tabsSelect}"]`), native.value)
}, { owner: 'tabs', claims: ['[data-tabs-select]'] })

// Held locally: the observer callback runs outside the module's global scope in the
// jsdom harness, where a bare `document` lookup is not available.
const doc = document
const refreshAll = () => doc.querySelectorAll('.bo-tabs').forEach(markEdges)
on('scroll', event => {
  if (event.target.classList?.contains('bo-tabs-scroll')) markEdges(event.target.closest('.bo-tabs'))
}, { owner: 'tabs', claims: ['.bo-tabs-scroll'], capture: true })
window.addEventListener('resize', refreshAll)
new MutationObserver(refreshAll).observe(document.body, { childList: true, subtree: true })
refreshAll()
