// 組合範例（權限矩陣型）：照正式後台「角色權限」（rolePermission/index.vue）做。
//
// 這一頁是舊的「複雜設定」頁改寫來的。舊版把三件不相干的事塞在一頁（權限矩陣、
// 多步驟新增、規則表格），而且自己帶了一整套 .workflow-table／.workflow-steps 樣式，
// 跟站上其他表格長得不一樣。改寫後：
//   - 權限矩陣留在這裡，並照正式後台放回「列表 → 編輯彈窗」的動線裡；
//   - 多步驟新增刪掉，Steps 已有規範頁、動線另有「表單頁型」範例，不需要第三份；
//   - 規則表格移到「混合型」範例，那裡本來就是在講「設定頁裡的表格」。
//
// 矩陣的重點是父子連動：勾編輯會自動補上讀取（不能編輯卻看不到），
// 取消讀取會一併取消編輯，父層用 indeterminate 表示下層只勾了一部分。
import { dataTable } from './data-table.js'
import { choiceControl } from './choice-controls.js'
import { iconButton } from './icon-button.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-permission.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 功能清單的兩層結構與正式後台的 permissionList 一致：分類 → 功能。
const MODULES = [
  { name: '會員管理', items: ['會員列表', '登入紀錄', '會員標籤'] },
  { name: '財務管理', items: ['存款審核', '提款審核', '手動存提'] },
  { name: '活動管理', items: ['優惠活動', '公告管理'] },
  { name: '報表', items: ['遊戲營收報表', '代理佔成報表'] },
]

const ALL_ITEMS = MODULES.flatMap(m => m.items)
const blankPermission = () => Object.fromEntries(ALL_ITEMS.map(name => [name, { read: false, edit: false }]))

const preset = (read = [], edit = []) => {
  const values = blankPermission()
  for (const name of read) values[name].read = true
  for (const name of edit) { values[name].read = true; values[name].edit = true }
  return values
}

const ROLES = [
  { id: 'R-01', name: '營運人員', note: '日常客服與活動維運', members: 12, updated: '2026-10-12 09:40', values: preset(ALL_ITEMS, ['優惠活動', '公告管理']) },
  { id: 'R-02', name: '財務專員', note: '只處理存提款審核', members: 4, updated: '2026-10-09 17:05', values: preset(['會員列表', '存款審核', '提款審核', '手動存提'], ['存款審核', '提款審核']) },
  { id: 'R-03', name: '稽核唯讀', note: '只能看，不能改', members: 3, updated: '2026-09-30 11:22', values: preset(ALL_ITEMS) },
]

const COLUMNS = [
  { key: 'name', label: '角色名稱', align: 'left' },
  { key: 'note', label: '說明', align: 'left' },
  { key: 'members', label: '成員數', align: 'right' },
  { key: 'updated', label: '最後更新' },
  { key: 'actions', label: '操作', width: '94px' },
]

const MATRIX_COLUMNS = [
  { key: 'feature', label: '功能', align: 'left', className: 'permission-feature' },
  { key: 'read', label: '讀取' },
  { key: 'edit', label: '編輯' },
]

// 編輯中的那一份草稿；彈窗關掉就丟掉，不會動到列表上的資料。
let draft = null
let collapsed = new Set()

const groupState = (items, type) => ({
  all: items.every(name => draft.values[name][type]),
  some: items.some(name => draft.values[name][type]),
})

const cell = (name, type, { group } = {}) => {
  const items = group ? MODULES.find(m => m.name === group).items : [name]
  const state = group ? groupState(items, type) : { all: draft.values[name][type], some: draft.values[name][type] }
  return choiceControl({
    type: 'checkbox',
    label: `${group ?? name}${type === 'read' ? '讀取' : '編輯'}權限`,
    hideLabel: true,
    checked: state.all,
    // 部分選取只用於父階層，代表下層有一部分勾了；它不是第三種值
    attrs: `${group ? `data-permission-group="${esc(group)}"` : `data-permission-item="${esc(name)}"`} data-permission-type="${type}"${!state.all && state.some ? ' data-choice-mixed' : ''}`,
  })
}

const matrixRows = () => MODULES.flatMap(group => {
  const open = !collapsed.has(group.name)
  const head = {
    feature: `<button type="button" class="permission-toggle" data-permission-expand="${esc(group.name)}" aria-expanded="${open}">
        ${icon(open ? 'arrowDown' : 'arrowRight', 16)}<span>${esc(group.name)}</span>
      </button>`,
    read: cell(null, 'read', { group: group.name }),
    edit: cell(null, 'edit', { group: group.name }),
    className: 'permission-group',
  }
  const children = open ? group.items.map(name => ({
    feature: `<span class="permission-child">${esc(name)}</span>`,
    read: cell(name, 'read'),
    edit: cell(name, 'edit'),
  })) : []
  return [head, ...children]
})

// dataTable 的列沒有 class 參數，分類列的底色改用第一格的 class 掛（結構用途，不是另一套表格樣式）
const matrix = () => dataTable({
  name: 'permission',
  columns: MATRIX_COLUMNS,
  rows: matrixRows().map(row => ({
    ...row,
    feature: row.className === 'permission-group'
      ? `<div class="permission-group-cell">${row.feature}</div>`
      : row.feature,
  })),
  pagination: false,
})

const list = () => dataTable({
  name: 'role',
  columns: COLUMNS,
  rows: ROLES.map(role => ({
    name: `<strong>${esc(role.name)}</strong>`,
    note: esc(role.note),
    members: role.members,
    updated: `<span class="example-nowrap">${esc(role.updated)}</span>`,
    actions: `<div class="icon-action-group example-permission-actions">${iconButton({
      icon: icon('edit', 16), label: `編輯 ${role.name} 的權限`, kind: 'btn-edit',
      attrs: `data-role-edit="${esc(role.id)}"`,
    })}</div>`,
  })),
  pagination: false,
})

window.renderExamplePermission = () => `<section class="example-page example-permission-page" data-permission-root>
  <div class="guide-section-heading">
    <h2>角色權限</h2>
    <p class="component-description">組合範例（權限矩陣型），照正式後台 <code>rolePermission/index.vue</code> 做。矩陣放在「列表 → 編輯彈窗」的動線裡，重點是父子連動與部分選取：勾編輯會自動補上讀取，取消讀取會一併取消編輯。</p>
  </div>
  <div class="example-toolbar member-actions">
    <button type="button" class="semantic-btn btn-add" data-role-add>${icon('add')}新增角色</button>
  </div>
  <section class="card example-card" data-role-list>${list()}</section>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>表格</strong>：角色列表與權限矩陣都用同一個 <code>dataTable()</code>，矩陣只是不分頁；外觀不另外寫一套</li>
      <li><strong>選擇控制</strong>：矩陣每一格是共用的 Checkbox，文案留給報讀器（<code>hideLabel</code>），畫面上只剩勾選框</li>
      <li><strong>部分選取</strong>：父層的 indeterminate 代表下層勾了一部分，它不是第三種值</li>
      <li><strong>彈窗</strong>：要做決定才用置中彈窗，footer 取消在前、儲存在後；取消就丟掉草稿，不動列表</li>
      <li><strong>靠左對齊</strong>：整張表只有矩陣首欄靠左，這是規範列出的兩個例外之一</li>
      <li><strong>訊息提示</strong>：儲存結果用 Toast 並帶角色名稱</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redrawList = () => {
  const host = document.querySelector('[data-role-list]')
  if (host) host.innerHTML = list()
}

// indeterminate 是 property 不是 attribute，重畫後要自己補上。
// choice-controls.js 的 MutationObserver 也會補，但那是非同步的，畫完的當下還沒生效。
const syncPartial = root => {
  root?.querySelectorAll('[data-choice-mixed]').forEach(box => { box.indeterminate = true })
}

const redrawMatrix = () => {
  const host = document.querySelector('[data-permission-matrix]')
  if (!host) return
  host.innerHTML = matrix()
  syncPartial(host)
}

function openEditor(role) {
  draft = { id: role?.id ?? null, name: role?.name ?? '', values: JSON.parse(JSON.stringify(role?.values ?? blankPermission())) }
  collapsed = new Set()
  const dialog = document.createElement('dialog')
  dialog.className = 'permission-dialog'
  dialog.innerHTML = `<form>
    <header><h2>${role ? `編輯角色－${esc(role.name)}` : '新增角色'}</h2></header>
    <div class="bo-modal-body">
      <div class="guide-fields permission-name">
        <div class="guide-field">
          <label for="role-name">角色名稱<span class="required-mark" aria-hidden="true"> *</span></label>
          <input id="role-name" class="guide-input" value="${esc(draft.name)}" maxlength="30" data-role-name>
          <small class="error-text" id="role-name-error"></small>
        </div>
      </div>
      <p class="component-description">勾選「編輯」會同時開啟「讀取」；取消「讀取」會一併取消「編輯」。</p>
      <div data-permission-matrix>${matrix()}</div>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-permission-cancel>取消</button>
      <button type="submit" class="semantic-btn btn-search">儲存權限</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-permission-cancel]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = event => {
    event.preventDefault()
    const name = dialog.querySelector('[data-role-name]').value.trim()
    if (!name) {
      // 欄位級錯誤留在欄位下方，不用 Toast
      dialog.querySelector('#role-name-error').textContent = '請輸入角色名稱'
      dialog.querySelector('[data-role-name]').classList.add('is-error')
      dialog.querySelector('[data-role-name]').focus()
      return
    }
    const target = ROLES.find(r => r.id === draft.id)
    if (target) {
      Object.assign(target, { name, values: draft.values, updated: new Date().toISOString().slice(0, 16).replace('T', ' ') })
    } else {
      ROLES.push({ id: `R-${String(ROLES.length + 1).padStart(2, '0')}`, name, note: '新建立的角色', members: 0, updated: new Date().toISOString().slice(0, 16).replace('T', ' '), values: draft.values })
    }
    dialog.close()
    redrawList()
    message.success(`已儲存 ${name} 的權限`)
  }
  dialog.addEventListener('close', () => { dialog.remove(); draft = null }, { once: true })
  document.body.append(dialog)
  syncPartial(dialog)
  dialog.showModal()
}

onMatch('click', '[data-role-edit]', (event, button) =>
  openEditor(ROLES.find(r => r.id === button.dataset.roleEdit)), { owner: 'example-permission' })

onMatch('click', '[data-role-add]', () => openEditor(null), { owner: 'example-permission' })

onMatch('click', '[data-permission-expand]', (event, button) => {
  const name = button.dataset.permissionExpand
  collapsed.has(name) ? collapsed.delete(name) : collapsed.add(name)
  redrawMatrix()
}, { owner: 'example-permission' })

// 單一功能：編輯一定要配讀取，否則會出現「能改但看不到」的權限組合
onMatch('change', '[data-permission-item]', (event, input) => {
  if (!draft) return
  const name = input.dataset.permissionItem
  const type = input.dataset.permissionType
  const state = draft.values[name]
  state[type] = input.checked
  if (type === 'edit' && input.checked) state.read = true
  if (type === 'read' && !input.checked) state.edit = false
  redrawMatrix()
}, { owner: 'example-permission' })

// 分類列：整組一起開或關，同樣要維持「編輯必含讀取」
onMatch('change', '[data-permission-group]', (event, input) => {
  if (!draft) return
  const group = MODULES.find(m => m.name === input.dataset.permissionGroup)
  const type = input.dataset.permissionType
  for (const name of group.items) {
    const state = draft.values[name]
    state[type] = input.checked
    if (type === 'edit' && input.checked) state.read = true
    if (type === 'read' && !input.checked) state.edit = false
  }
  redrawMatrix()
}, { owner: 'example-permission' })
