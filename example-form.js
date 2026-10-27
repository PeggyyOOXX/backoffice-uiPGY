// 組合範例（表單頁型）：照正式後台「新增會員」（membersManagement/add.vue）做。
//
// 選這一頁的理由：正式後台有 8 個 view 的新增與編輯是**獨立的路由頁**，不是彈窗
// （adminManagement／agentManagement／branchList／membersManagement／operatorManagement／
// rebateSettings／systemBank／thirdPartyPayment），而原型先前一律用彈窗，
// 這條動線完全沒有示範過。兩者的差別不只是外觀：獨立頁有返回列表、有未儲存守衛、
// 送出成功後要導回列表並讓新資料出現在列表上。
//
// 欄位分區與必填標記照 add.vue 的 el-form-item；驗證錯誤一律是欄位下方的行內文字，
// 不用 Toast——Toast 會消失，使用者回頭找不到是哪一格。
import { dataTable } from './data-table.js'
import { tag } from './tag-guide.js'
import { iconButton } from './icon-button.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-form.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const BRANCHES = ['101 BEST', 'DEMO03', 'VIP CLUB']
const CURRENCIES = ['TWD', 'USD', 'THB', 'VND']
const LEVELS = ['一般會員', 'VIP 1', 'VIP 2', 'VIP 3']
const TAGS = ['高價值', '觀察中', '新註冊', '回鍋']
const COUNTRY = ['+886', '+86', '+84', '+66']

const MEMBERS = [
  ['MB-009821', 'ava_chen', 'Ava Chen', '101 BEST', 'VIP 2', 'TWD', '2026-09-28 11:04', 'enabled'],
  ['MB-009774', 'david_lin', 'David Lin', '101 BEST', 'VIP 1', 'TWD', '2026-09-20 09:36', 'enabled'],
  ['MB-009652', 'mina_wu', 'Mina Wu', 'DEMO03', '一般會員', 'USD', '2026-09-11 16:22', 'paused'],
  ['MB-009541', 'lucas_h', 'Lucas Huang', '101 BEST', 'VIP 3', 'TWD', '2026-08-30 10:15', 'enabled'],
  ['MB-009328', 'emma_tsai', 'Emma Tsai', 'VIP CLUB', '一般會員', 'THB', '2026-08-18 14:47', 'enabled'],
]

const STATUS = { enabled: ['啟用', 'success'], paused: ['停用', 'danger'] }

const blank = () => ({
  branch: '101 BEST', agent: '', currency: 'TWD',
  account: '', name: '', level: '一般會員', email: '',
  country: '+886', phone: '', tags: [], note: '', password: '',
})

// view：list ／ form。正式後台是兩個 route，原型用同一頁切換，動線一樣。
let view = 'list'
let draft = blank()
let clean = JSON.stringify(draft)
let errors = {}
const dirty = () => JSON.stringify(draft) !== clean

// --- 列表 ---
const COLUMNS = [
  { key: 'uid', label: '會員編號', align: 'left' },
  { key: 'account', label: '帳號', align: 'left' },
  { key: 'name', label: '姓名', align: 'left' },
  { key: 'branch', label: '所屬站台' },
  { key: 'level', label: '層級' },
  { key: 'currency', label: '幣別' },
  { key: 'created', label: '建立時間' },
  { key: 'status', label: '狀態' },
  { key: 'actions', label: '操作', width: '94px' },
]

const listView = () => `
  <div class="example-toolbar member-actions">
    <button type="button" class="semantic-btn btn-add" data-form-new>${icon('add')}新增會員</button>
  </div>
  <section class="card example-card">
    ${dataTable({
      name: 'member-form',
      columns: COLUMNS,
      rows: MEMBERS.map(([uid, account, name, branch, level, currency, created, status]) => ({
        uid: `<span class="example-nowrap">${esc(uid)}</span>`,
        account: esc(account),
        name: esc(name),
        branch: esc(branch),
        level: esc(level),
        currency,
        created: `<span class="example-nowrap">${esc(created)}</span>`,
        status: tag(STATUS[status][0], STATUS[status][1]),
        actions: `<div class="icon-action-group example-form-actions">${iconButton({
          icon: icon('edit', 16), label: `編輯 ${account}`, kind: 'btn-edit',
          attrs: `data-form-edit="${esc(uid)}"`,
        })}</div>`,
      })),
      pagination: false,
    })}
  </section>`

// --- 表單 ---
const field = (key, label, control, { required = false, hint = '' } = {}) => `<div class="guide-field">
  <label for="member-${key}">${label}${required ? '<span class="required-mark" aria-hidden="true"> *</span>' : ''}</label>
  ${control}
  ${hint ? `<small>${hint}</small>` : ''}
  <small class="error-text" id="member-${key}-error">${esc(errors[key] ?? '')}</small>
</div>`

const text = (key, extra = '') => `<input id="member-${key}" class="guide-input${errors[key] ? ' is-error' : ''}" value="${esc(draft[key])}" data-form-field="${key}" ${errors[key] ? `aria-invalid="true" aria-describedby="member-${key}-error"` : ''} ${extra}>`

const select = (key, options, extra = '') => `<select id="member-${key}" class="guide-select" data-form-field="${key}" ${extra}>
  ${options.map(v => `<option ${draft[key] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
</select>`

const formView = () => `
  <div class="example-form-bar">
    <button type="button" class="semantic-btn btn-neutral" data-form-back>${icon('arrowLeft')}返回列表</button>
    <span class="example-form-crumb">會員列表 ／ <strong>新增會員</strong></span>
  </div>
  <form class="example-form" data-form-root novalidate>
    <section class="card example-settings-card">
      <h3 class="example-settings-heading">站台資訊</h3>
      <div class="guide-fields">
        ${field('branch', '選擇站台', select('branch', BRANCHES), { required: true })}
        ${field('agent', '代理帳號', text('agent', 'maxlength="30"'), { hint: '留空代表直屬總公司' })}
        ${field('currency', '幣別', select('currency', CURRENCIES), { required: true })}
      </div>
    </section>

    <section class="card example-settings-card">
      <h3 class="example-settings-heading">基本資料</h3>
      <div class="guide-fields">
        ${field('account', '帳號', text('account', 'maxlength="20" autocomplete="off"'), { required: true, hint: '6–20 碼英數字，建立後不可修改' })}
        ${field('password', '密碼', `<div class="affix-input"><input id="member-password" class="guide-input${errors.password ? ' is-error' : ''}" type="password" value="${esc(draft.password)}" maxlength="20" autocomplete="new-password" data-form-field="password" ${errors.password ? 'aria-invalid="true" aria-describedby="member-password-error"' : ''}><span data-icon="view" data-icon-size="16"></span></div>`, { required: true, hint: '8–20 碼，需含英文與數字' })}
        ${field('name', '姓名', text('name', 'maxlength="30"'), { required: true })}
        ${field('level', '層級', select('level', LEVELS))}
        ${field('email', 'Email', text('email', 'type="email" maxlength="60"'))}
        ${field('country', '國碼', select('country', COUNTRY))}
        ${field('phone', '手機號碼', text('phone', 'inputmode="numeric" maxlength="15"'))}
        ${field('tags', '會員標籤', `<select id="member-tags" class="guide-select" multiple data-collapse="2" data-clearable data-form-field="tags">
          ${TAGS.map(v => `<option ${draft.tags.includes(v) ? 'selected' : ''}>${esc(v)}</option>`).join('')}
        </select>`)}
      </div>
    </section>

    <section class="card example-settings-card">
      <h3 class="example-settings-heading">備註</h3>
      <div class="guide-field">
        <label for="member-note">備註</label>
        <textarea id="member-note" class="guide-input guide-textarea" maxlength="500" data-form-field="note">${esc(draft.note)}</textarea>
      </div>
    </section>

    <footer class="example-savebar example-form-savebar">
      <div class="example-save-status" role="status">${dirty() ? '有尚未儲存的變更' : '送出後才會建立會員'}</div>
      <div class="example-save-actions">
        <button type="button" class="semantic-btn btn-neutral" data-form-back>取消</button>
        <button type="submit" class="semantic-btn btn-search">確認新增</button>
      </div>
    </footer>
  </form>`

window.renderExampleForm = () => `<section class="example-page example-form-page" data-member-form-root>
  <div class="guide-section-heading">
    <h2>會員列表 ／ 新增會員</h2>
    <p class="component-description">組合範例（表單頁型），照正式後台 <code>membersManagement/add.vue</code> 做。正式後台有 8 個功能的新增與編輯是獨立的路由頁而不是彈窗，差別不只外觀：有返回列表、有未儲存守衛，送出後要導回列表並讓新資料出現。</p>
  </div>
  ${view === 'list' ? listView() : formView()}
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>彈窗還是獨立頁</strong>：欄位多到要分區（這裡四區）就用獨立頁；只改一兩格的用彈窗，像「列表型」範例的編輯</li>
      <li><strong>輸入框</strong>：<code>guide-fields</code> ／ <code>guide-field</code> 的 label 在上、控制在下，與其他頁同一套</li>
      <li><strong>欄位級錯誤</strong>：錯誤留在欄位下方並連 <code>aria-describedby</code>，<strong>不用 Toast</strong>——Toast 會消失，使用者回頭找不到是哪一格</li>
      <li><strong>彈窗</strong>：改到一半要離開時先確認，與「設定型」範例切換頁籤的守衛是同一個做法</li>
      <li><strong>訊息提示</strong>：送出成功才用 Toast，文案帶受詞（「已建立會員 ava_chen」）</li>
      <li><strong>步驟導覽</strong>：欄位分成好幾階段才用步驟（正式後台只有新增分站與新增代理兩個），示範在「步驟導覽 Steps」頁</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redraw = () => {
  const host = document.querySelector('[data-member-form-root]')
  if (host) host.outerHTML = window.renderExampleForm()
}

const validate = () => {
  const next = {}
  if (!draft.account.trim()) next.account = '請輸入帳號'
  else if (!/^[A-Za-z0-9_]{6,20}$/.test(draft.account)) next.account = '帳號需為 6–20 碼英數字或底線'
  if (!draft.name.trim()) next.name = '請輸入姓名'
  if (!draft.password) next.password = '請輸入密碼'
  else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,20}$/.test(draft.password)) next.password = '密碼需為 8–20 碼並同時含英文與數字'
  if (draft.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email)) next.email = 'Email 格式不正確'
  if (draft.phone && !/^\d{7,15}$/.test(draft.phone)) next.phone = '手機號碼只能是 7–15 碼數字'
  errors = next
  return !Object.keys(next).length
}

const leave = () => {
  view = 'list'
  draft = blank()
  clean = JSON.stringify(draft)
  errors = {}
  redraw()
}

onMatch('click', '[data-form-new]', () => {
  view = 'form'
  draft = blank()
  clean = JSON.stringify(draft)
  errors = {}
  redraw()
}, { owner: 'example-form' })

onMatch('click', '[data-form-edit]', (event, button) => {
  // 編輯走的是同一個頁面，只是帶著既有資料進來；這裡只示範到提示，不重複做一次表單
  message.info(`編輯 ${button.dataset.formEdit} 會進同一個表單頁，欄位帶入既有資料`)
}, { owner: 'example-form' })

// 輸入時不重繪（重繪會讓游標跳到字尾），只更新資料與存檔列的狀態
onMatch('input', '[data-form-field]', (event, input) => {
  if (input.multiple) return
  draft[input.dataset.formField] = input.value
  const status = document.querySelector('[data-member-form-root] .example-save-status')
  if (status) status.textContent = dirty() ? '有尚未儲存的變更' : '送出後才會建立會員'
}, { owner: 'example-form' })

onMatch('change', '[data-form-field]', (event, input) => {
  const key = input.dataset.formField
  draft[key] = input.multiple ? [...input.selectedOptions].map(o => o.value) : input.value
}, { owner: 'example-form' })

onMatch('click', '[data-form-back]', () => {
  if (!dirty()) return leave()
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>離開新增會員</h2></header>
    <div class="bo-modal-body"><p>異動資訊未保存，請確認是否離開？</p><p>離開後這張表單填的內容不會保留。</p></div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>留在此頁</button>
      <button type="submit" class="semantic-btn btn-warning">離開並放棄</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    dialog.close()
    leave()
  }
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-form' })

onMatch('submit', '[data-form-root]', event => {
  event.preventDefault()
  if (!validate()) {
    redraw()
    // 不用 Toast 報欄位錯誤，只把焦點送到第一個出錯的欄位
    document.querySelector('[data-member-form-root] .guide-input.is-error')?.focus()
    return
  }
  const account = draft.account
  MEMBERS.unshift([
    `MB-${String(10000 + MEMBERS.length).slice(1)}`, account, draft.name || account,
    draft.branch, draft.level, draft.currency,
    new Date().toISOString().slice(0, 16).replace('T', ' '), 'enabled',
  ])
  leave()
  message.success(`已建立會員 ${account}`)
}, { owner: 'example-form' })
