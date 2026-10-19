// 批量操作的規範頁。原本的「批量開關」是一頁三案比較（浮出操作列／收進表頭／批次彈窗），
// 用來做決定；方案 B 選定之後，比較頁就沒有存在的理由了——規範頁要講的是「怎麼做」，
// 不是「有哪些選擇」。被淘汰的兩案留在下方的決策表裡，記錄為什麼不選。
import { guidePage, decisionTable } from './guide-page.js'
import { onMatch } from './delegate.js'
import { icon } from './icons.js'
import { tag } from './tag-guide.js'
import { prepareModal } from './modal-system.js'
import { selectAllControl, selectRowControl, bulkHeader, bulkFeedback, selectionOf, applyBulk, PICK_COLUMN } from './bulk-actions.js'
import { dataTable } from './data-table.js'
import './guide-page.css'
import './bulk-actions.css'
import './bulk-guide.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const COLUMNS = [['front', '前台顯示'], ['home', '首頁推薦'], ['hot', '熱門標記']]
const OPTIONS = [['開啟', '1'], ['關閉', '0']]
const NAMES = ['Mega Fortune', 'Golden Dragon', 'Lucky Panda', 'Ocean King', 'Fruit Party']

const make = () => NAMES.map((name, i) => ({
  id: `G-${1001 + i}`, name, front: i % 2 === 0, home: i % 3 === 0, hot: i % 4 === 0,
  reviewed: i % 3 === 1,
}))

const state = { rows: make(), selected: new Set(), menu: '', text: '', undo: null }
const ids = () => state.rows.map(row => row.id)

const switchCell = (row, key, label) =>
  `<button type="button" class="standard-switch" role="switch" aria-checked="${row[key]}" aria-label="${esc(row.name)} ${label}" data-bulk-guide-toggle data-id="${row.id}" data-key="${key}"></button>`

// 表格外殼一律交給 dataTable()，這一頁只提供勾選欄與表頭的控制項——
// 規範頁自己畫一份表格，就是兩邊長得不一樣的開始。
// 只有五列，所以不分頁（掛一條「共 5 筆」只是雜訊）。
const table = () => {
  const { checked, indeterminate } = selectionOf(ids(), state.selected)
  const columns = [
    { ...PICK_COLUMN, header: selectAllControl({ name: 'guide', checked, indeterminate }) },
    { key: 'name', label: '遊戲名稱', align: 'left' },
    ...COLUMNS.map(([key, label]) => ({
      key, label, align: 'center',
      header: bulkHeader({
        name: 'guide', key, label, options: OPTIONS,
        selected: state.selected.size, total: state.rows.length, open: state.menu === key,
      }),
    })),
    { key: 'review', label: '審核', align: 'center' },
  ]
  const rows = state.rows.map(row => ({
    pick: selectRowControl({ name: 'guide', id: row.id, label: row.name, checked: state.selected.has(row.id) }),
    name: esc(row.name),
    ...Object.fromEntries(COLUMNS.map(([key, label]) => [key, switchCell(row, key, label)])),
    review: tag(row.reviewed ? '已審核' : '待審核', row.reviewed ? 'success' : 'warning'),
  }))
  return dataTable({ name: 'bulk-guide', columns, rows, pagination: false })
}

// 工具列的批量動作。兩種入口要並存才看得出差別：
// 表頭選單＝可逆、點了就生效；工具列按鈕＝不可逆、一定先確認。
// 兩顆都在沒有勾選時停用，不讓人點了才發現沒作用。
const toolbar = () => {
  const n = state.selected.size
  return `<div class="bulk-guide-toolbar member-actions">
    <button type="button" class="semantic-btn btn-record" data-bulk-guide-review ${n ? '' : 'disabled'}>${icon('batchReview')}批量審核${n ? `（${n}）` : ''}</button>
    <button type="button" class="semantic-btn btn-danger" data-bulk-guide-delete ${n ? '' : 'disabled'}>${icon('delete')}批量刪除${n ? `（${n}）` : ''}</button>
  </div>`
}

const demo = () => `<div class="bulk-guide-demo" data-bulk-guide>
  ${toolbar()}
  ${bulkFeedback({ name: 'guide', text: state.text, undo: !!state.undo })}
  ${table()}
</div>`

const DECISION = [
  ['一次調整多筆的同一個欄位', '<strong>收進欄位表頭</strong>', '入口就在它作用的那一欄，選單直接寫出「已勾選 N 筆」「全部 N 筆」'],
  ['一次調整多筆的多個欄位', '開一個批次調整彈窗', '三個欄位要改就得開三次選單；欄位多時表頭選單會變慢'],
  ['單筆的操作（編輯、停用、刪除）', '該列的圖示按鈕', '批量入口只處理「多筆的同一件事」，單筆不走這裡'],
  ['不可逆的批量動作（刪除、作廢）', '先開確認彈窗', '表頭選單點下去就生效，不可逆的動作不能這樣處理'],
  ['只有兩三筆資料', '不放批量入口', '一筆一筆改還比較快，多一個入口只是雜訊'],
]

const REJECTED = [
  ['勾選後浮出操作列', '表格上方浮出一列按鈕', '入口離它作用的欄位很遠，而且會把表格往下推、整頁跳動'],
  ['表格上方固定兩排下拉', '正式後台目前的做法', '要先理解「批次調整」與「全部調整」兩個抽象詞，欄位一多就擠成一整排'],
  ['批次調整彈窗', '一次設定所有欄位再送出', '多一個步驟；只改一個欄位時比表頭選單慢。欄位多的頁面可以保留這個做法'],
]

window.renderBulkGuide = () => guidePage({
  slug: 'bulk',
  title: '批量操作 Bulk',
  intro: '一次調整多筆資料。入口收在<strong>欄位表頭</strong>——就在它作用的那一欄正上方，選單裡直接寫出影響幾筆，不必先理解「批次」與「全部」這兩個抽象詞。可以直接操作下面的示範。',
  sections: [
    {
      heading: '勾選與批量入口',
      body: `${demo()}
        <p class="component-description">批量入口有<strong>兩種</strong>，差別在能不能收回：</p>
        <ul class="bulk-guide-list">
          <li><strong>欄位表頭的 ${'<code>⋯</code>'} 選單</strong>——可逆的調整（開關、狀態）。點下去就生效，回報列留一個復原。</li>
          <li><strong>表格上方的按鈕</strong>——不可逆的動作（審核、刪除）。一定先開確認彈窗並列出影響範圍，完成後<strong>不給復原鈕</strong>。</li>
        </ul>
        <p class="component-description">兩種入口在沒有勾選任何列時都是停用的——表頭選單停用的是「已勾選」那兩條，「全部」那兩條不受影響。不會讓人點了才發現沒作用。</p>
        <p class="component-description"><strong>全選只選本頁。</strong>跨頁全選要另外明講（例如「選取全部 238 筆」），因為使用者看不到的資料被一起改掉，是批量操作最常見的事故。</p>`,
    },
    {
      heading: '結果一定要說出影響範圍',
      body: `<p class="component-description">批量動作一次改很多筆，畫面上看不出到底動了什麼，所以回報要同時給<strong>兩個數字</strong>：</p>
        <ul class="bulk-guide-list">
          <li><strong>影響幾筆</strong>——這次動作套用到多少筆</li>
          <li><strong>實際變更幾筆</strong>——其中真的改變了狀態的有多少筆</li>
        </ul>
        <p class="component-description">把 20 筆都設為開啟、其中 17 筆本來就開著，只說「已更新 20 筆」會讓人以為真的動了 20 筆。沒有任何變更時也要講：「原本就是開啟，沒有變更。」</p>
        <p class="component-description"><strong>可逆的</strong>批量動作都要能復原，復原鈕跟在回報文字後面，不另外找地方放。<strong>不可逆的</strong>則相反——完成後不要放復原鈕，點了沒用的按鈕比沒有更糟；它的退路是送出前那一道確認。</p>`,
    },
    { heading: '哪種情境用哪個入口', body: decisionTable(DECISION) },
    {
      heading: '沒有採用的做法',
      body: decisionTable(REJECTED, ['做法', '長什麼樣', '為什麼不採用']),
    },
  ],
  tokens: [
    ['勾選欄寬度', '44px'],
    ['勾選框', '16px / accent-color #1596ad'],
    ['表頭入口', '16px 圖示按鈕（外框、中性色）'],
    ['選單最小寬度', '192px'],
    ['選單位置', '表頭下方 4px，靠右對齊'],
    ['選單項目', '12px / 高 34px / 左對齊'],
    ['選單分隔線', '已勾選與全部之間一條 1px'],
    ['回報文字', '12px / #1596ad'],
    ['同時展開的選單', '1（開新的會關掉舊的）'],
  ],
  rules: [
    ['全選只選本頁', '跨頁全選要另外明講並顯示總筆數。看不到的資料被一起改掉是最常見的批量事故。'],
    ['部分勾選要顯示不確定狀態', '不是未勾選。否則看不出已經選了一些。'],
    ['沒勾選時停用「已勾選」那幾條', '讓人點了才發現沒作用，比直接停用更糟。'],
    ['回報要同時給影響筆數與實際變更筆數', '只講影響筆數會讓人高估這次動作改了多少東西。'],
    ['可逆的批量動作要能復原', '批量動作的錯誤成本是單筆的 N 倍，沒有退路不能上線。'],
    ['不可逆的批量動作先確認、事後不給復原', '確認彈窗要列出影響範圍。完成後放一個點了沒用的復原鈕，比沒有更糟。'],
    ['不可逆的動作走工具列按鈕，不進表頭選單', '表頭選單點下去就生效，中間沒有攔截的機會。'],
    ['一次只開一個選單', '同時開兩欄會讓人分不清正在設定哪一欄。'],
    ['批量入口不處理單筆', '單筆操作一律用該列的圖示按鈕，兩者不混用。'],
  ],
})

// --- 示範的互動 ---
const redraw = () => {
  const host = document.querySelector('[data-bulk-guide]')
  if (host) host.outerHTML = demo()
}

const snapshot = () => state.rows.map(row => ({ ...row }))

onMatch('click', '[data-bulk-all][data-bulk="guide"]', (event, box) => {
  if (box.checked) ids().forEach(id => state.selected.add(id))
  else state.selected.clear()
  redraw()
}, { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-row][data-bulk="guide"]', (event, box) => {
  box.checked ? state.selected.add(box.dataset.id) : state.selected.delete(box.dataset.id)
  redraw()
}, { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-menu][data-bulk="guide"]', (event, button) => {
  // 一次只開一個：開新的就把舊的關掉
  state.menu = state.menu === button.dataset.bulkMenu ? '' : button.dataset.bulkMenu
  redraw()
}, { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-action][data-bulk="guide"]', (event, button) => {
  const { key, value, scope } = button.dataset
  const [, label] = COLUMNS.find(([k]) => k === key)
  const optionText = OPTIONS.find(([, v]) => v === value)[0]
  state.undo = snapshot()
  state.text = applyBulk({
    rows: state.rows,
    ids: scope === 'all' ? ids() : [...state.selected],
    key, value: value === '1', label, optionText,
  }).text
  state.menu = ''
  redraw()
}, { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-undo][data-bulk="guide"]', () => {
  if (!state.undo) return
  state.rows = state.undo
  state.undo = null
  state.text = '已復原上一次批量調整。'
  redraw()
}, { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-guide-toggle]', (event, button) => {
  const row = state.rows.find(r => r.id === button.dataset.id)
  if (row) { row[button.dataset.key] = !row[button.dataset.key]; redraw() }
}, { owner: 'bulk-guide' })

// 不可逆的批量動作：送出前先確認，並且在彈窗裡列出影響範圍。
// 完成後不留復原鈕——點了沒用的復原比沒有更糟。
function confirmBulk({ title, action, kind, body, run }) {
  const picked = state.rows.filter(row => state.selected.has(row.id))
  if (!picked.length) return
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>${esc(title)}</h2></header>
    <div class="bo-modal-body">
      ${body(picked)}
      <ul class="bulk-guide-preview">${picked.slice(0, 4).map(row => `<li>${esc(row.name)}</li>`).join('')}${picked.length > 4 ? `<li>…另外 ${picked.length - 4} 筆</li>` : ''}</ul>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-bulk-guide-close>取消</button>
      <button type="submit" class="semantic-btn ${kind}">${esc(action)}</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-bulk-guide-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    state.text = run(picked)
    state.undo = null
    dialog.close()
    redraw()
  }
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}

onMatch('click', '[data-bulk-guide-review]', () => confirmBulk({
  title: '批量審核',
  action: '確認審核',
  kind: 'btn-record',
  body: picked => {
    const pending = picked.filter(row => !row.reviewed).length
    return `<p>已勾選 <strong>${picked.length}</strong> 筆，其中 <strong>${pending}</strong> 筆待審核。</p>
      <p>審核通過後立即生效，此操作無法復原。</p>`
  },
  run: picked => {
    const pending = picked.filter(row => !row.reviewed)
    pending.forEach(row => { row.reviewed = true })
    state.selected.clear()
    return pending.length
      ? `已審核 ${picked.length} 筆中的 ${pending.length} 筆，其餘原本就已審核。`
      : `${picked.length} 筆原本就已審核，沒有變更。`
  },
}), { owner: 'bulk-guide' })

onMatch('click', '[data-bulk-guide-delete]', () => confirmBulk({
  title: '批量刪除',
  action: '確認刪除',
  kind: 'btn-danger',
  body: picked => `<p>將刪除 <strong>${picked.length}</strong> 筆資料，刪除後無法復原。</p>`,
  run: picked => {
    state.rows = state.rows.filter(row => !state.selected.has(row.id))
    state.selected.clear()
    return `已刪除 ${picked.length} 筆。`
  },
}), { owner: 'bulk-guide' })
