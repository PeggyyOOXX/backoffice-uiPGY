// 組合範例（批量型）：照正式後台「遊戲列表」（gameProviderList/game.vue）做。
//
// 選這一頁的理由：它是正式後台批量操作最密集的頁面——同一列有三個開關欄位，
// 原本的做法是表格上方兩排下拉（批次調整狀態／全部狀態調整）。這一頁把它換成
// 選定的方案 B（批量控制收進欄位表頭），順便驗證批量操作與表格、分頁、確認彈窗
// 兜在一起之後還成不成立。
//
// 三種批量情境都走過一遍：
//   批量開關 → 表頭選單，點下去就生效，可復原
//   批量處理 → 工具列按鈕，作用於已勾選的資料
//   批量審核 → 不可逆，先開確認彈窗
import { dataTable, applyPaging, PAGE_SIZES } from './data-table.js'
import { selectAllControl, selectRowControl, bulkHeader, bulkFeedback, selectionOf, applyBulk, PICK_COLUMN } from './bulk-actions.js'
import { tag } from './tag-guide.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-bulk.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const NAME = 'game'
const SWITCHES = [['front', '前台顯示'], ['home', '首頁推薦'], ['hot', '熱門標記']]
const OPTIONS = [['開啟', '1'], ['關閉', '0']]

// 狀態依語意對應標籤型別，與禮物卡管理同一套規則
const STATUS = { on: ['啟用', 'success'], off: ['停用', 'info'], fix: ['維護中', 'warning'] }

const VENDORS = ['PG Soft', 'Pragmatic', 'JILI', 'CQ9', 'Habanero']
const TYPES = ['電子', '真人', '捕魚', '棋牌']
const TITLES = [
  'Mega Fortune', 'Golden Dragon', 'Lucky Panda', 'Ocean King', 'Fruit Party',
  'Dragon Tiger', 'Baccarat VIP', 'Roulette Pro', 'Sweet Bonanza', 'Wild West',
  'Treasure Dive', 'Phoenix Rising', 'Jade Empire', 'Neon Nights', 'Safari Gold',
  'Pirate Cove', 'Sakura Fortune', 'Aztec Sun', 'Crystal Cave', 'Thunder Zeus',
  'Lotus Luck', 'Mystic Moon', 'Carnival Cash', 'Frozen Peaks',
]

const makeRows = () => TITLES.map((name, i) => ({
  id: `G-${1001 + i}`,
  name,
  vendor: VENDORS[i % VENDORS.length],
  type: TYPES[i % TYPES.length],
  status: i % 7 === 0 ? 'fix' : i % 5 === 0 ? 'off' : 'on',
  front: i % 2 === 0,
  home: i % 3 === 0,
  hot: i % 4 === 0,
  reviewed: i % 6 !== 0,
}))

const STATE = {
  rows: makeRows(),
  selected: new Set(),
  menu: '',
  text: '',
  undo: null,
  page: 1,
  pageSize: PAGE_SIZES[0],
  total: TITLES.length,
  keyword: '',
  vendor: '',
  status: '',
}

const snapshot = () => STATE.rows.map(row => ({ ...row }))

const visible = () => STATE.rows.filter(row => {
  const k = STATE.keyword.trim().toLowerCase()
  if (k && !row.name.toLowerCase().includes(k)) return false
  if (STATE.vendor && row.vendor !== STATE.vendor) return false
  if (STATE.status && row.status !== STATE.status) return false
  return true
})

// 本頁的資料。全選、批量動作的「已勾選」範圍都只看這一頁——
// 跨頁全選是批量操作最容易出事的地方，要另外明講才做。
const pageRows = () => {
  const list = visible()
  const start = (STATE.page - 1) * STATE.pageSize
  return list.slice(start, start + STATE.pageSize)
}

const switchCell = (row, key, label) =>
  `<button type="button" class="standard-switch" role="switch" aria-checked="${row[key]}" aria-label="${esc(row.name)} ${label}" data-game-toggle data-id="${row.id}" data-key="${key}"></button>`

const table = () => {
  const rows = pageRows()
  const ids = rows.map(row => row.id)
  const { checked, indeterminate } = selectionOf(ids, STATE.selected)
  const columns = [
    { ...PICK_COLUMN, header: selectAllControl({ name: NAME, checked, indeterminate }) },
    { key: 'name', label: '遊戲名稱', align: 'left' },
    { key: 'vendor', label: '遊戲商' },
    { key: 'type', label: '遊戲類型' },
    { key: 'status', label: '狀態' },
    ...SWITCHES.map(([key, label]) => ({
      key, label, align: 'center',
      header: bulkHeader({
        name: NAME, key, label, options: OPTIONS,
        selected: STATE.selected.size, total: visible().length, open: STATE.menu === key,
      }),
    })),
    { key: 'review', label: '審核' },
  ]
  return dataTable({
    name: NAME,
    columns,
    rows: rows.map(row => ({
      pick: selectRowControl({ name: NAME, id: row.id, label: row.name, checked: STATE.selected.has(row.id) }),
      name: esc(row.name),
      vendor: esc(row.vendor),
      type: esc(row.type),
      status: tag(STATUS[row.status][0], STATUS[row.status][1]),
      ...Object.fromEntries(SWITCHES.map(([key, label]) => [key, switchCell(row, key, label)])),
      review: row.reviewed ? tag('已審核', 'success') : tag('待審核', 'warning'),
    })),
    page: STATE.page,
    pageSize: STATE.pageSize,
    total: visible().length,
    empty: '沒有符合條件的遊戲',
  })
}

const filters = () => `<form class="source-filter card example-filter" data-game-filter>
  <div class="source-filter-grid">
    <div class="filter-field">
      <label for="game-keyword">遊戲名稱</label>
      <input id="game-keyword" class="control" name="keyword" value="${esc(STATE.keyword)}" placeholder="請輸入遊戲名稱" maxlength="40">
    </div>
    <div class="filter-field">
      <label for="game-vendor">遊戲商</label>
      <select id="game-vendor" class="control guide-select" name="vendor">
        <option value="">全部遊戲商</option>
        ${VENDORS.map(v => `<option value="${v}"${STATE.vendor === v ? ' selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="filter-field">
      <label for="game-status">狀態</label>
      <select id="game-status" class="control guide-select" name="status">
        <option value="">全部狀態</option>
        ${Object.entries(STATUS).map(([k, [label]]) =>
          `<option value="${k}"${STATE.status === k ? ' selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    <div class="source-filter-actions">
      <button type="button" class="semantic-btn btn-neutral" data-game-reset>${icon('reset')}重設</button>
      <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
    </div>
  </div>
</form>`

// 批量處理與批量審核作用於「已勾選」的資料，所以沒勾選時停用，
// 而不是讓人點了才發現沒作用。按鈕上直接寫出筆數。
const toolbar = () => {
  const n = STATE.selected.size
  return `<div class="example-toolbar member-actions">
    <button type="button" class="semantic-btn btn-edit" data-game-batch ${n ? '' : 'disabled'}>${icon('batch')}批量處理${n ? `（${n}）` : ''}</button>
    <button type="button" class="semantic-btn btn-record" data-game-review ${n ? '' : 'disabled'}>${icon('batchReview')}批量審核${n ? `（${n}）` : ''}</button>
    <button type="button" class="semantic-btn btn-neutral" data-game-clear ${n ? '' : 'disabled'}>${icon('close')}清除勾選</button>
    <button type="button" class="semantic-btn btn-export" data-game-export>${icon('download')}匯出</button>
  </div>`
}

window.renderExampleBulk = () => `<section class="example-page example-bulk-page" data-game-root>
  <div class="guide-section-heading">
    <h2>遊戲列表</h2>
    <p class="component-description">組合範例（批量型），照正式後台 <code>gameProviderList/game.vue</code> 做。三種批量情境各走一遍：表頭選單的<strong>批量開關</strong>、工具列的<strong>批量處理</strong>、要先確認的<strong>批量審核</strong>。</p>
  </div>
  ${filters()}
  ${toolbar()}
  <section class="card example-card" data-game-list>
    ${bulkFeedback({ name: NAME, text: STATE.text, undo: !!STATE.undo })}
    ${table()}
  </section>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>批量操作</strong>：三個開關欄位的入口收在各自的表頭，選單寫出「已勾選 N 筆」與「全部 N 筆」</li>
      <li><strong>全選只選本頁</strong>：換頁後勾選會保留，但全選框只反映目前這一頁</li>
      <li><strong>結果回報</strong>：同時給影響筆數與實際變更筆數，並留一個復原</li>
      <li><strong>不可逆的動作先確認</strong>：批量審核會開確認彈窗並列出影響範圍；批量開關不會</li>
      <li><strong>沒勾選就停用</strong>：批量處理、批量審核、清除勾選在沒勾選時都是停用的</li>
      <li><strong>表格</strong>：表格外殼與分頁都來自 <code>dataTable()</code>，批量元件只提供勾選欄與表頭控制項</li>
      <li><strong>標籤</strong>：狀態與審核狀態依語意對應型別，不是依狀態碼</li>
      <li><strong>訊息提示</strong>：一次性的結果用 Toast，批量結果用常駐的回報列（因為它帶著復原鈕）</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redraw = () => {
  const root = document.querySelector('[data-game-root]')
  if (root) root.outerHTML = window.renderExampleBulk()
}

const refreshList = () => {
  const host = document.querySelector('[data-game-list]')
  if (!host) return redraw()
  host.innerHTML = `${bulkFeedback({ name: NAME, text: STATE.text, undo: !!STATE.undo })}${table()}`
  const bar = document.querySelector('[data-game-root] .example-toolbar')
  if (bar) bar.outerHTML = toolbar()
}

const only = (event, el) => el.dataset.bulk === NAME

onMatch('submit', '[data-game-filter]', (event, form) => {
  event.preventDefault()
  STATE.keyword = form.querySelector('[name="keyword"]').value
  STATE.vendor = form.querySelector('[name="vendor"]').value
  STATE.status = form.querySelector('[name="status"]').value
  STATE.page = 1
  STATE.total = visible().length
  refreshList()
  const n = visible().length
  n ? message.success(`找到 ${n} 款遊戲`) : message.info('沒有符合條件的遊戲')
}, { owner: 'example-bulk' })

onMatch('click', '[data-game-reset]', () => {
  Object.assign(STATE, { keyword: '', vendor: '', status: '', page: 1 })
  STATE.total = visible().length
  redraw()
  message.info('已清除搜尋條件')
}, { owner: 'example-bulk' })

onMatch('click', '[data-table-page]', (event, button) => {
  if (button.dataset.table !== NAME) return
  STATE.total = visible().length
  STATE.page = applyPaging(STATE, { page: button.dataset.tablePage }).page
  refreshList()
}, { owner: 'example-bulk' })

onMatch('change', '[data-table-size]', (event, select) => {
  if (select.dataset.table !== NAME) return
  STATE.total = visible().length
  Object.assign(STATE, applyPaging(STATE, { size: select.value }))
  refreshList()
}, { owner: 'example-bulk' })

// 全選只作用於本頁：取消全選也只清掉本頁的，別頁勾的要留著
onMatch('click', '[data-bulk-all]', (event, box) => {
  if (!only(event, box)) return
  const ids = pageRows().map(row => row.id)
  ids.forEach(id => (box.checked ? STATE.selected.add(id) : STATE.selected.delete(id)))
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-bulk-row]', (event, box) => {
  if (!only(event, box)) return
  box.checked ? STATE.selected.add(box.dataset.id) : STATE.selected.delete(box.dataset.id)
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-bulk-menu]', (event, button) => {
  if (!only(event, button)) return
  STATE.menu = STATE.menu === button.dataset.bulkMenu ? '' : button.dataset.bulkMenu
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-bulk-action]', (event, button) => {
  if (!only(event, button)) return
  const { key, value, scope } = button.dataset
  const [, label] = SWITCHES.find(([k]) => k === key)
  const optionText = OPTIONS.find(([, v]) => v === value)[0]
  STATE.undo = snapshot()
  // scope=all 作用於「篩選後的全部」，不是資料庫裡的全部——選單上的數字就是這個數
  STATE.text = applyBulk({
    rows: STATE.rows,
    ids: scope === 'all' ? visible().map(row => row.id) : [...STATE.selected],
    key, value: value === '1', label, optionText,
  }).text
  STATE.menu = ''
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-bulk-undo]', (event, button) => {
  if (!only(event, button) || !STATE.undo) return
  STATE.rows = STATE.undo
  STATE.undo = null
  STATE.text = '已復原上一次批量調整。'
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-game-toggle]', (event, button) => {
  const row = STATE.rows.find(r => r.id === button.dataset.id)
  if (!row) return
  row[button.dataset.key] = !row[button.dataset.key]
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-game-clear]', () => {
  STATE.selected.clear()
  refreshList()
}, { owner: 'example-bulk' })

onMatch('click', '[data-game-export]', () =>
  message.success(`已開始匯出 ${visible().length} 款遊戲`), { owner: 'example-bulk' })

// 批量處理：可逆，直接做，結果走回報列
onMatch('click', '[data-game-batch]', () => {
  if (!STATE.selected.size) return
  STATE.undo = snapshot()
  STATE.text = applyBulk({
    rows: STATE.rows, ids: [...STATE.selected],
    key: 'status', value: 'fix', label: '狀態', optionText: '維護中',
  }).text
  refreshList()
}, { owner: 'example-bulk' })

// 批量審核：送出後不能收回，所以先開確認彈窗並列出影響範圍
onMatch('click', '[data-game-review]', (event, trigger) => {
  const picked = STATE.rows.filter(row => STATE.selected.has(row.id))
  if (!picked.length) return
  const pending = picked.filter(row => !row.reviewed)
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>批量審核</h2></header>
    <div class="bo-modal-body">
      <p>已勾選 <strong>${picked.length}</strong> 款遊戲，其中 <strong>${pending.length}</strong> 款待審核。</p>
      <p>${pending.length ? '審核通過後遊戲會立即對前台開放，此操作無法復原。' : '勾選的遊戲都已經審核過，送出不會有任何變更。'}</p>
      ${pending.length ? `<ul class="example-bulk-preview">${pending.slice(0, 5).map(row => `<li>${esc(row.name)}</li>`).join('')}${pending.length > 5 ? `<li>…另外 ${pending.length - 5} 款</li>` : ''}</ul>` : ''}
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>取消</button>
      <button type="submit" class="semantic-btn btn-record" ${pending.length ? '' : 'disabled'}>確認審核 ${pending.length} 款</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    pending.forEach(row => { row.reviewed = true })
    // 不可逆，所以不給復原——留一個會用不了的復原鈕比沒有更糟
    STATE.undo = null
    STATE.text = `已審核 ${pending.length} 款遊戲。`
    dialog.close()
    refreshList()
    message.success(`已審核 ${pending.length} 款遊戲`)
  }
  dialog.addEventListener('close', () => { dialog.remove(); trigger.focus?.() }, { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-bulk' })
