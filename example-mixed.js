// 組合範例（混合型）：設定頁裡還有表格。照正式後台「財務設定」（financialSettings）、
// 「返水設定」（rebateSettings）與「優惠活動」（promotionActivity）做。
//
// 這一頁是舊的「設定相關頁面」改寫來的，並把舊「複雜設定」的規則表格併進來。
// 它和「設定型」範例（分站設定）的差別就在這裡：分站設定是純表單，這一頁的設定裡
// 包著兩張表格——一張整表可編輯（返水規則），一張是可拖曳排序的清單（優惠活動）。
// 舊版自己帶了一整套 .settings-card／.settings-fields／.promotion-* 樣式與一個
// 自製 chrome 的快照彈窗，改寫後全部換成共用元件。
import { tabs, tabPanels } from './tabs.js'
import { dataTable } from './data-table.js'
import { choiceCard } from './choice-controls.js'
import { iconButton } from './icon-button.js'
import { tag } from './tag-guide.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { on, onMatch } from './delegate.js'
import './example-page.css'
import './example-mixed.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const money = n => Number(n).toLocaleString('en-US')

const TAB_ID = 'mixed-settings'
const TABS = [
  { key: 'transfer', label: '轉點設定' },
  { key: 'deposit', label: '存款設定' },
  { key: 'notify', label: '通知設定' },
  { key: 'basic', label: '基本資料' },
  { key: 'rebate', label: '返水規則' },
  { key: 'promotions', label: '優惠活動' },
]

const DEFAULTS = {
  transferEnabled: true, transferRule: 'passed',
  depositEnabled: true, limitEnabled: true, pendingLimit: 3, minDeposit: 100, maxDeposit: 50000,
  notifyEnabled: true, notifyChannel: 'inbox', notifyThreshold: 10000,
  siteTitle: '101 BEST', contactName: '', supportEmail: '', serviceHours: '09:00–18:00', notes: '',
  promotionEnabled: true, promotionCategory: '全部活動',
}

const DEFAULT_RULES = [
  { name: '真人視訊', rate: 0.5, min: 100, max: 10000 },
  { name: '電子遊戲', rate: 0.8, min: 100, max: 20000 },
  { name: '體育賽事', rate: 0.6, min: 200, max: 15000 },
  { name: '彩票', rate: 0.3, min: 100, max: 8000 },
]

const DEFAULT_PROMOTIONS = [
  { id: 1, title: '新會員首存優惠', type: '新會員優惠', start: '2026-09-01', end: '2026-09-30', state: '進行中' },
  { id: 2, title: '週末存款加碼', type: '存款優惠', start: '2026-09-19', end: '2026-09-20', state: '已預約' },
  { id: 3, title: '八月會員回饋', type: '會員回饋', start: '2026-08-01', end: '2026-08-31', state: '已過期' },
]

const STATE_TAG = { 進行中: 'success', 已預約: 'info', 已過期: 'warning' }
const CATEGORIES = ['全部活動', '新會員優惠', '存款優惠', '會員回饋']
const FILTERS = ['全部', '進行中', '已預約', '已過期']

const clone = value => JSON.parse(JSON.stringify(value))

let active = 'transfer'
let draft = { ...DEFAULTS }
let rules = clone(DEFAULT_RULES)
let promotions = clone(DEFAULT_PROMOTIONS)
let saved = snapshot()
let errors = {}
let filter = '全部'
let sorting = false

function snapshot() { return JSON.stringify({ draft, rules, promotions }) }
const dirty = () => snapshot() !== saved
const restore = () => { const s = JSON.parse(saved); draft = s.draft; rules = s.rules; promotions = s.promotions; sorting = false; errors = {} }

// --- 共用欄位 ---
const switchRow = (key, label, disabled = false) => `<div class="guide-switch-row">
  <button type="button" id="mixed-${key}" class="standard-switch" role="switch" aria-checked="${draft[key]}"
    aria-labelledby="mixed-${key}-label" data-mixed-switch="${key}" ${disabled ? 'disabled' : ''}></button>
  <label id="mixed-${key}-label" for="mixed-${key}">${label}</label>
</div>`

const numberField = (key, label, unit, hint, disabled = false) => `<div class="guide-field">
  <label for="mixed-${key}">${label}</label>
  <div class="affix-input">
    <input id="mixed-${key}" class="guide-input${errors[key] ? ' is-error' : ''}" type="number" min="0" step="1"
      value="${esc(draft[key])}" data-mixed-field="${key}" ${disabled ? 'disabled' : ''}
      ${errors[key] ? `aria-invalid="true" aria-describedby="mixed-${key}-error"` : ''}>
    <span>${unit}</span>
  </div>
  ${hint ? `<small>${hint}</small>` : ''}
  <small class="error-text" id="mixed-${key}-error">${esc(errors[key] ?? '')}</small>
</div>`

const textField = (key, label, type = 'text') => `<div class="guide-field">
  <label for="mixed-${key}">${label}</label>
  <input id="mixed-${key}" class="guide-input${errors[key] ? ' is-error' : ''}" type="${type}" value="${esc(draft[key])}"
    maxlength="60" data-mixed-field="${key}" ${errors[key] ? `aria-invalid="true" aria-describedby="mixed-${key}-error"` : ''}>
  <small class="error-text" id="mixed-${key}-error">${esc(errors[key] ?? '')}</small>
</div>`

const cards = (key, options) => `<fieldset class="choice-group">
  <legend>${options.legend}</legend>
  <div class="choice-card-grid">
    ${options.items.map(([value, title, text]) => choiceCard({
      name: `mixed-${key}`, title, text,
      checked: draft[key] === value,
      disabled: options.disabled,
      attrs: `data-mixed-choice="${key}" value="${value}"`,
    })).join('')}
  </div>
</fieldset>`

// --- 各頁籤 ---
const transferPanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">轉點規則</h3>
  ${switchRow('transferEnabled', '開放會員轉點')}
  <div class="example-mixed-divider" role="separator"></div>
  ${cards('transferRule', {
    legend: '允許轉點的條件',
    disabled: !draft.transferEnabled,
    items: [
      ['passed', '通過稽核後可轉點', '會員需完成稽核條件，才可進行轉點。'],
      ['all', '不限制稽核狀態', '會員尚未通過稽核時，也允許進行轉點。'],
    ],
  })}
</section>`

const depositPanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">存款限制</h3>
  ${switchRow('depositEnabled', '開放會員存款')}
  ${switchRow('limitEnabled', '限制待處理存款筆數', !draft.depositEnabled)}
  <div class="example-mixed-divider" role="separator"></div>
  <div class="guide-fields">
    ${numberField('pendingLimit', '待處理筆數上限', '筆', '可設定 1–100 筆。', !draft.depositEnabled || !draft.limitEnabled)}
    ${numberField('minDeposit', '單筆最低金額', 'TWD', '', !draft.depositEnabled)}
    ${numberField('maxDeposit', '單筆最高金額', 'TWD', '不得低於最低金額。', !draft.depositEnabled)}
  </div>
</section>`

const notifyPanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">作業通知</h3>
  ${switchRow('notifyEnabled', '接收大額存款通知')}
  <div class="example-mixed-divider" role="separator"></div>
  ${cards('notifyChannel', {
    legend: '接收方式',
    disabled: !draft.notifyEnabled,
    items: [
      ['inbox', '站內通知', '在後台通知中心查看作業提醒。'],
      ['both', '站內通知與電子郵件', '同時寄送至管理員已設定的電子郵件。'],
    ],
  })}
  <div class="example-mixed-divider" role="separator"></div>
  <div class="guide-fields">
    ${numberField('notifyThreshold', '通知金額門檻', 'TWD', '單筆金額達到門檻時發送通知。', !draft.notifyEnabled)}
  </div>
</section>`

const basicPanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">基本資料</h3>
  <div class="guide-fields">
    ${textField('siteTitle', '網站名稱')}
    ${textField('contactName', '聯絡人')}
    ${textField('supportEmail', '客服信箱', 'email')}
    ${textField('serviceHours', '客服時間')}
  </div>
  <div class="example-mixed-divider" role="separator"></div>
  <div class="guide-field">
    <label for="mixed-notes">備註</label>
    <textarea id="mixed-notes" class="guide-input guide-textarea" maxlength="500" data-mixed-field="notes">${esc(draft.notes)}</textarea>
  </div>
</section>`

// 返水規則：整張表就是表單，每一格都是輸入欄位（rebateSettings/edit.vue）
const RULE_COLUMNS = [
  { key: 'name', label: '遊戲分類', align: 'left' },
  { key: 'rate', label: '返水比例（%）' },
  { key: 'min', label: '最低金額' },
  { key: 'max', label: '最高金額' },
]

const ruleInput = (index, key, label) => {
  const id = `mixed-rule-${index}-${key}`
  const error = errors[`rule-${index}-${key}`]
  return `<input id="${id}" class="guide-input${error ? ' is-error' : ''}" type="number" min="0" ${key === 'rate' ? 'max="100"' : ''} step="0.01"
    value="${esc(rules[index][key])}" data-mixed-rule="${index}" data-mixed-rule-key="${key}"
    aria-label="${esc(rules[index].name)}${label}" ${error ? 'aria-invalid="true"' : ''}>`
}

const rebatePanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">返水規則</h3>
  <p class="example-settings-hint">整張表就是表單：每一格都是輸入欄位，按下方的「儲存設定」一次送出。表格外觀仍由共用元件決定，只是格子裡放的是控制項。</p>
  <div class="guide-fields example-mixed-bulk">
    <div class="guide-field">
      <label for="mixed-rule-bulk">批量套用返水比例（%）</label>
      <input id="mixed-rule-bulk" class="guide-input" type="number" min="0" max="100" step="0.01" placeholder="0–100" data-mixed-rule-bulk>
    </div>
    <div class="guide-field example-mixed-bulk-action">
      <button type="button" class="semantic-btn btn-edit" data-mixed-rule-apply>套用至全部分類</button>
    </div>
  </div>
  ${dataTable({
    name: 'rebate',
    columns: RULE_COLUMNS,
    rows: rules.map((rule, index) => ({
      name: esc(rule.name),
      rate: ruleInput(index, 'rate', '返水比例'),
      min: ruleInput(index, 'min', '最低金額'),
      max: ruleInput(index, 'max', '最高金額'),
    })),
    pagination: false,
  })}
  <small class="error-text" id="mixed-rule-error">${esc(errors.rules ?? '')}</small>
</section>`

// 優惠活動：設定頁裡的一張列表，含狀態篩選、拖曳排序與唯讀快照
const PROMO_COLUMNS = () => [
  ...(sorting ? [{ key: 'drag', label: '排序', width: '64px' }] : []),
  { key: 'title', label: '活動名稱', align: 'left' },
  { key: 'type', label: '活動類型' },
  { key: 'start', label: '開始日期' },
  { key: 'end', label: '結束日期' },
  { key: 'state', label: '狀態' },
  { key: 'actions', label: '操作', width: '120px' },
]

const visiblePromotions = () => promotions.filter(row => filter === '全部' || row.state === filter)

const promotionPanel = () => `<section class="card example-settings-card">
  <h3 class="example-settings-heading">優惠活動</h3>
  ${switchRow('promotionEnabled', '在前台顯示優惠活動')}
  <div class="guide-fields">
    <div class="guide-field">
      <label for="mixed-category">預設活動分類</label>
      <select id="mixed-category" class="guide-select" data-mixed-field="promotionCategory">
        ${CATEGORIES.map(v => `<option ${draft.promotionCategory === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="example-mixed-divider" role="separator"></div>
  <div class="example-mixed-filters" role="group" aria-label="活動狀態">
    ${FILTERS.map(state => `<button type="button" class="semantic-btn ${filter === state ? 'btn-search' : 'btn-neutral outline'}"
      data-mixed-filter="${state}" aria-pressed="${filter === state}">${state}</button>`).join('')}
  </div>
  <div class="example-toolbar member-actions">
    <button type="button" class="semantic-btn btn-add" data-mixed-promo="add">${icon('add')}新增活動</button>
    <button type="button" class="semantic-btn btn-edit" data-mixed-promo="sort" aria-pressed="${sorting}" ${sorting ? 'disabled' : ''}>${icon('sort')}${sorting ? '排序中' : '排序'}</button>
    ${sorting ? '<span class="example-settings-hint example-mixed-sort-hint">拖曳把手調整順序，或用上下方向鍵；按下方的「儲存設定」才會套用。</span>' : ''}
  </div>
  ${dataTable({
    name: 'promotion',
    columns: PROMO_COLUMNS(),
    rows: visiblePromotions().map(row => ({
      rowAttrs: `data-promotion-row="${row.id}"${sorting ? ' draggable="true"' : ''}`,
      drag: iconButton({ icon: icon('drag', 16), label: `拖曳排序：${row.title}；也可按上下方向鍵`, kind: 'btn-neutral', outline: true, attrs: `data-promotion-drag="${row.id}"` }),
      title: `<button type="button" class="example-mixed-link" data-promotion-snapshot="${row.id}" aria-haspopup="dialog">${esc(row.title)}</button>`,
      type: esc(row.type),
      start: `<span class="example-nowrap">${esc(row.start)}</span>`,
      end: `<span class="example-nowrap">${esc(row.end)}</span>`,
      state: tag(row.state, STATE_TAG[row.state]),
      actions: `<div class="icon-action-group example-mixed-actions">
        ${iconButton({ icon: icon('edit', 16), label: `編輯 ${row.title}`, kind: 'btn-edit', attrs: `data-mixed-promo="edit" data-promo-id="${row.id}"` })}
        ${iconButton({ icon: icon('delete', 16), label: `刪除 ${row.title}`, kind: 'btn-danger', attrs: `data-mixed-promo="delete" data-promo-id="${row.id}"` })}
      </div>`,
    })),
    pagination: false,
    empty: '無資料',
  })}
</section>`

const PANELS = { transfer: transferPanel, deposit: depositPanel, notify: notifyPanel, basic: basicPanel, rebate: rebatePanel, promotions: promotionPanel }

window.renderExampleMixed = () => `<section class="example-page example-mixed-page" data-mixed-root>
  <div class="guide-section-heading">
    <h2>財務與活動設定</h2>
    <p class="component-description">組合範例（混合型），照正式後台 <code>financialSettings</code>、<code>rebateSettings</code> 與 <code>promotionActivity</code> 做。它和「設定型」範例的差別是設定裡還包著表格：一張整表可編輯，一張可拖曳排序。</p>
  </div>
  ${tabs({ id: TAB_ID, label: '設定分類', items: TABS, active, variant: 'card', mobile: 'select', panels: true })}
  ${tabPanels(TAB_ID, TABS.map(t => [t.key, t.key === active ? PANELS[t.key]() : '']), active)}
  <footer class="example-savebar example-mixed-savebar">
    <div class="example-save-status" role="status">${dirty() ? '有尚未儲存的變更' : '儲存後才會套用'}</div>
    <div class="example-save-actions">
      <button type="button" class="semantic-btn btn-neutral" data-mixed-cancel ${dirty() ? '' : 'disabled'}>取消變更</button>
      <button type="button" class="semantic-btn btn-search" data-mixed-save ${dirty() ? '' : 'disabled'}>儲存設定</button>
    </div>
  </footer>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>開關</strong>：一列一個，開關在左、文案在右；開關管「要不要」，選項用選項卡片</li>
      <li><strong>選項卡片</strong>：需要說明才選得下去的互斥選項用卡片，不用一排 Switch</li>
      <li><strong>表格</strong>：兩張表都用共用的 <code>dataTable()</code>，一張格子裡放輸入欄位，一張多一欄拖曳把手</li>
      <li><strong>欄位級錯誤</strong>：驗證失敗時切到出錯的頁籤、把錯誤留在欄位下方，不用 Toast</li>
      <li><strong>彈窗</strong>：新增與刪除活動要做決定，用置中彈窗；活動快照是唯讀，沿用同一套彈窗外殼</li>
      <li><strong>未儲存提醒</strong>：排序與編輯都只改草稿，按「儲存設定」才套用；離開前會先確認</li>
    </ul>
  </section>
</section>`

// --- 重繪 ---
const redraw = () => {
  const host = document.querySelector('[data-mixed-root]')
  if (host) host.outerHTML = window.renderExampleMixed()
}

const syncSavebar = () => {
  const root = document.querySelector('[data-mixed-root]')
  if (!root) return
  const status = root.querySelector('.example-save-status')
  if (status) status.textContent = dirty() ? '有尚未儲存的變更' : '儲存後才會套用'
  root.querySelector('[data-mixed-save]').disabled = !dirty()
  root.querySelector('[data-mixed-cancel]').disabled = !dirty()
}

// --- 驗證 ---
function validate() {
  const next = {}
  if (draft.depositEnabled) {
    if (draft.limitEnabled && (!Number.isInteger(draft.pendingLimit) || draft.pendingLimit < 1 || draft.pendingLimit > 100)) next.pendingLimit = '請輸入 1–100 的整數。'
    for (const key of ['minDeposit', 'maxDeposit']) if (!Number.isFinite(draft[key]) || draft[key] < 0) next[key] = '請輸入不小於 0 的金額。'
    if (Number(draft.maxDeposit) < Number(draft.minDeposit)) next.maxDeposit = '最高金額不可低於最低金額。'
  }
  if (draft.notifyEnabled && (!Number.isFinite(draft.notifyThreshold) || draft.notifyThreshold <= 0)) next.notifyThreshold = '請輸入大於 0 的金額。'
  if (draft.supportEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.supportEmail)) next.supportEmail = 'Email 格式不正確。'
  rules.forEach((rule, index) => {
    if (!(rule.rate >= 0 && rule.rate <= 100)) next[`rule-${index}-rate`] = true
    if (Number(rule.max) < Number(rule.min)) next[`rule-${index}-max`] = true
  })
  if (Object.keys(next).some(key => key.startsWith('rule-'))) next.rules = '返水比例須為 0–100，且最高金額不得低於最低金額。'
  errors = next
  return Object.keys(next).length === 0
}

// 哪個頁籤出的錯就跳到哪個頁籤——錯誤留在看不到的頁籤上等於沒有報
const TAB_OF = { pendingLimit: 'deposit', minDeposit: 'deposit', maxDeposit: 'deposit', notifyThreshold: 'notify', supportEmail: 'basic', rules: 'rebate' }

// --- 互動 ---
onMatch('click', '[data-mixed-switch]', (event, button) => {
  if (button.disabled) return
  const key = button.dataset.mixedSwitch
  draft[key] = !draft[key]
  redraw()
}, { owner: 'example-mixed' })

onMatch('change', '[data-mixed-choice]', (event, input) => {
  draft[input.dataset.mixedChoice] = input.getAttribute('value')
  redraw()
}, { owner: 'example-mixed' })

// 輸入時不重繪，游標才不會跳到字尾
onMatch('input', '[data-mixed-field]', (event, input) => {
  const key = input.dataset.mixedField
  draft[key] = input.type === 'number' ? (input.value === '' ? NaN : Number(input.value)) : input.value
  if (errors[key]) { errors[key] = ''; input.classList.remove('is-error'); const node = document.getElementById(`mixed-${key}-error`); if (node) node.textContent = '' }
  syncSavebar()
}, { owner: 'example-mixed' })

onMatch('change', 'select[data-mixed-field]', (event, select) => {
  draft[select.dataset.mixedField] = select.value
  syncSavebar()
}, { owner: 'example-mixed' })

onMatch('input', '[data-mixed-rule]', (event, input) => {
  rules[Number(input.dataset.mixedRule)][input.dataset.mixedRuleKey] = input.value === '' ? NaN : Number(input.value)
  syncSavebar()
}, { owner: 'example-mixed' })

onMatch('click', '[data-mixed-rule-apply]', () => {
  const value = Number(document.querySelector('[data-mixed-rule-bulk]')?.value)
  if (!(value >= 0 && value <= 100)) { message.warning('請先輸入 0–100 的返水比例'); return }
  for (const rule of rules) rule.rate = value
  redraw()
  message.success(`已將 ${value}% 套用至全部分類`)
}, { owner: 'example-mixed' })

onMatch('click', '[data-mixed-filter]', (event, button) => {
  filter = button.dataset.mixedFilter
  redraw()
}, { owner: 'example-mixed' })

onMatch('tab-change', `[data-tabs="${TAB_ID}"]`, event => {
  active = event.detail.key
  redraw()
  document.getElementById(`${TAB_ID}-tab-${active}`)?.focus()
}, { owner: 'example-mixed' })

onMatch('click', '[data-mixed-cancel]', () => {
  restore()
  redraw()
  message.info('已還原為上次儲存的設定')
}, { owner: 'example-mixed' })

onMatch('click', '[data-mixed-save]', () => {
  if (!validate()) {
    const first = Object.keys(errors).find(key => TAB_OF[key])
    if (first) active = TAB_OF[first]
    redraw()
    document.querySelector('[data-mixed-root] .guide-input.is-error')?.focus()
    return
  }
  saved = snapshot()
  sorting = false
  redraw()
  message.success('設定已儲存')
}, { owner: 'example-mixed' })

// --- 活動的新增／編輯／刪除 ---
function promotionDialog(kind, row) {
  const dialog = document.createElement('dialog')
  const deleting = kind === 'delete'
  const adding = kind === 'add'
  dialog.innerHTML = `<form>
    <header><h2>${deleting ? '刪除活動' : adding ? '新增活動' : '編輯活動'}</h2></header>
    <div class="bo-modal-body">
      ${deleting
        ? `<p>確定刪除「${esc(row.title)}」？</p><p>刪除後將無法復原。</p>`
        : `<div class="guide-fields">
            <div class="guide-field">
              <label for="promo-title">活動名稱</label>
              <input id="promo-title" class="guide-input" name="title" value="${esc(row?.title ?? '')}" maxlength="80" required>
            </div>
            <div class="guide-field">
              <label for="promo-type">活動類型</label>
              <select id="promo-type" class="guide-select" name="type">
                ${CATEGORIES.slice(1).map(v => `<option ${row?.type === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
              </select>
            </div>
            <div class="guide-field">
              <label id="promo-date-label">活動期間</label>
              <div class="date-range-host" data-date-range ${row?.start ? `data-start="${row.start} 00:00:00" data-end="${row.end} 23:59:59"` : 'data-empty="true"'} aria-labelledby="promo-date-label"></div>
            </div>
          </div>
          <small class="error-text" data-promo-error></small>`}
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-promo-close>取消</button>
      <button type="submit" class="semantic-btn ${deleting ? 'btn-danger' : 'btn-search'}">${deleting ? '確認刪除' : '儲存'}</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-promo-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = event => {
    event.preventDefault()
    if (deleting) {
      promotions = promotions.filter(item => item.id !== row.id)
    } else {
      const form = new FormData(event.target)
      const host = dialog.querySelector('[data-date-range]')
      const values = {
        title: String(form.get('title')).trim(),
        type: String(form.get('type')),
        start: host.dataset.start?.slice(0, 10) || '',
        end: host.dataset.end?.slice(0, 10) || '',
      }
      if (!values.title || !values.start || !values.end || values.end < values.start) {
        dialog.querySelector('[data-promo-error]').textContent = '請填寫活動名稱與期間，結束日期不得早於開始日期。'
        return
      }
      if (adding) {
        promotions.push({ id: Date.now(), ...values, state: '已預約' })
        filter = '全部'
      } else Object.assign(row, values)
    }
    dialog.close()
    redraw()
  }
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}

onMatch('click', '[data-mixed-promo]', (event, button) => {
  const kind = button.dataset.mixedPromo
  if (kind === 'sort') { sorting = true; redraw(); return }
  const row = promotions.find(item => item.id === Number(button.dataset.promoId))
  promotionDialog(kind, row)
}, { owner: 'example-mixed' })

// --- 唯讀快照：沿用共用彈窗外殼，不自己做一套 chrome ---
const LANGUAGES = ['English', '简体中文', '日本語', 'Tiếng Việt']

onMatch('click', '[data-promotion-snapshot]', (event, button) => {
  const row = promotions.find(item => item.id === Number(button.dataset.promotionSnapshot))
  if (!row) return
  const pairs = [['站台', '101 BEST'], ['活動類型', row.type], ['開始時間', `${row.start} 00:00:00`], ['結束時間', `${row.end} 23:59:59`], ['狀態', row.state], ['文章置頂', '否']]
  const content = index => index === 0
    ? `<h4>${esc(row.title)}</h4><p>活動內容示範文字。正式環境這裡是各語系的標題、封面圖與內文。</p>`
    : '<p class="example-mixed-empty-copy">尚未提供此語言的活動內容快照。</p>'
  const dialog = document.createElement('dialog')
  dialog.className = 'example-mixed-snapshot'
  dialog.innerHTML = `<form>
    <header><h2>活動內容快照</h2></header>
    <div class="bo-modal-body">
      <dl class="risk-detail-grid">${pairs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <h3 class="example-mixed-snapshot-heading">活動資訊</h3>
      ${tabs({ id: 'snapshot-language', label: '活動語言', items: LANGUAGES.map((label, index) => ({ key: String(index), label })), active: '0', variant: 'card', mobile: 'scroll', panels: true })}
      ${tabPanels('snapshot-language', LANGUAGES.map((_, index) => [String(index), content(index)]), '0')}
    </div>
    <footer><button type="button" class="semantic-btn btn-neutral" data-promo-close>關閉</button></footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-promo-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => submit.preventDefault()
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-mixed' })

// --- 拖曳排序：只在排序模式下作用，順序改了也要按儲存才算數 ---
let dragId = null

const moveRow = (from, to) => {
  const visible = visiblePromotions()
  const fromIndex = visible.findIndex(row => row.id === from)
  const toIndex = visible.findIndex(row => row.id === to)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return false
  const ids = new Set(visible.map(row => row.id))
  visible.splice(toIndex, 0, visible.splice(fromIndex, 1)[0])
  let index = 0
  for (let i = 0; i < promotions.length; i++) if (ids.has(promotions[i].id)) promotions[i] = visible[index++]
  return true
}

on('dragstart', event => {
  const row = event.target?.closest?.('[data-promotion-row]')
  if (!sorting || !row) return
  dragId = Number(row.dataset.promotionRow)
  event.dataTransfer.effectAllowed = 'move'
}, { owner: 'example-mixed' })

on('dragover', event => {
  if (!sorting || dragId == null) return
  if (!event.target?.closest?.('[data-promotion-row]')) return
  event.preventDefault()
}, { owner: 'example-mixed' })

on('drop', event => {
  const row = event.target?.closest?.('[data-promotion-row]')
  if (!sorting || dragId == null || !row) return
  event.preventDefault()
  if (moveRow(dragId, Number(row.dataset.promotionRow))) redraw()
  dragId = null
}, { owner: 'example-mixed' })

// 鍵盤也要能排序：拖曳是滑鼠才有的操作，只有把手能聚焦還不夠
onMatch('keydown', '[data-promotion-drag]', (event, handle) => {
  if (!sorting || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
  event.preventDefault()
  const id = Number(handle.dataset.promotionDrag)
  const visible = visiblePromotions()
  const index = visible.findIndex(row => row.id === id)
  const target = visible[index + (event.key === 'ArrowUp' ? -1 : 1)]
  if (!target || !moveRow(id, target.id)) return
  redraw()
  document.querySelector(`[data-promotion-drag="${id}"]`)?.focus()
}, { owner: 'example-mixed' })
