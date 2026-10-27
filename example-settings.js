// 組合範例（設定型）：照正式後台「分站設定」（branchSetting/index.vue）做。
//
// 選這一頁的理由：它完全沒有表格與分頁，是純設定表單，正好和列表型範例形成對照。
// 它同時用到頁籤、下拉、單選、核取、開關、上傳、格線與「未儲存就離開」的確認彈窗，
// 是檢驗表單類規範是否自洽的最好樣本。
//
// 正式後台只有兩個頁籤——「其他設定」是基本設定裡的一個區塊，不是第三個頁籤。
import { tabs, tabPanels } from './tabs.js'
import { choiceControl } from './choice-controls.js'
import { uploadSlot } from './upload-guide.js'
import { tag } from './tag-guide.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './example-page.css'
import './example-settings.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const TAB_ID = 'branch-setting'
const TABS = [
  { key: 'base', label: '基本設定' },
  { key: 'register', label: '註冊登入設定' },
]

const LANGUAGES = [['zh-TW', '繁體中文'], ['zh-CN', '簡體中文'], ['en-US', 'English'], ['vi-VN', 'Tiếng Việt'], ['th-TH', 'ไทย']]
const COUNTRY_CODES = [['886', '+886 台灣'], ['86', '+86 中國'], ['84', '+84 越南'], ['66', '+66 泰國']]
const TEMPLATE_COLORS = [['dark', '深色'], ['light', '淺色'], ['gold', '金色']]

// 註冊登入模式：每個模式有一組欄位，欄位各自可勾選、各自可設必填／選填。
// locked 的欄位是該模式的識別欄位，不可取消也不可改成選填。
const MODES = [
  {
    key: 'account', title: '帳號登入',
    fields: [
      { key: 'account', label: '帳號', locked: true },
      { key: 'password', label: '密碼', locked: true },
      { key: 'passwordConfirm', label: '再次確認密碼', indent: true, noRequired: true },
      { key: 'phone', label: '手機號碼' },
      { key: 'email', label: 'Email' },
      { key: 'displayName', label: '真實姓名' },
      { key: 'withdrawPassword', label: '轉點密碼' },
      { key: 'referralCode', label: '推薦碼' },
    ],
  },
  {
    key: 'phone', title: '手機登入',
    fields: [
      { key: 'phone', label: '手機號碼', locked: true },
      { key: 'password', label: '密碼', locked: true },
      { key: 'email', label: 'Email' },
      { key: 'displayName', label: '真實姓名' },
      { key: 'referralCode', label: '推薦碼' },
    ],
  },
  {
    key: 'email', title: 'Email 登入',
    fields: [
      { key: 'email', label: 'Email', locked: true },
      { key: 'password', label: '密碼', locked: true },
      { key: 'phone', label: '手機號碼' },
      { key: 'displayName', label: '真實姓名' },
      { key: 'referralCode', label: '推薦碼' },
    ],
  },
]

const initial = () => ({
  active: 'base',
  languages: ['zh-TW', 'en-US'],
  countryCodes: ['886'],
  templateColor: 'dark',
  convertCurrency: 'off',
  frontTitle: '101 BEST 娛樂城',
  frontDescription: '提供真人、電子、體育與彩票的線上娛樂平台',
  backTitle: '101 BEST 後台管理系統',
  backDescription: '分站營運管理後台',
  modes: Object.fromEntries(MODES.map(mode => [mode.key, {
    on: mode.key === 'account',
    fields: Object.fromEntries(mode.fields.map(f => [f.key, { enabled: !!f.locked, required: !!f.locked }])),
  }])),
})

let draft = initial()
let saved = JSON.stringify(draft)
// active 是檢視狀態不是資料，比對有沒有變更時要排除，否則切頁籤本身就會被當成有改動
const payload = state => JSON.stringify({ ...state, active: null })
const dirty = () => payload(draft) !== payload(JSON.parse(saved))

// --- 基本設定 ---
// 表單欄位一律用「輸入框 Input」規範頁的 guide-fields／guide-field／guide-input／guide-select，
// 不借用列表頁篩選列那一組 class——它是為四欄篩選列排的，放進設定卡片會把欄位壓成四分之一寬，
// 和其他頁的表單長得不一樣。
const multiSelect = (name, label, options, selected) => `<div class="guide-field">
  <label for="branch-${name}">${label}</label>
  <select id="branch-${name}" class="guide-select" multiple data-collapse="2" data-branch-multi="${name}" aria-label="${label}">
    ${options.map(([value, text]) =>
      `<option value="${value}"${selected.includes(value) ? ' selected' : ''}>${esc(text)}</option>`).join('')}
  </select>
</div>`

const textField = (key, label, value, maxlength) => `<div class="guide-field">
  <label for="branch-${key}">${label}</label>
  <input id="branch-${key}" class="guide-input" value="${esc(value)}" maxlength="${maxlength}" data-branch-text="${key}">
</div>`

const basePanel = () => `
  <section class="card example-settings-card">
    <h3 class="example-settings-heading">基本資料</h3>
    <p class="example-settings-hint">兩欄都是多選，點選項目加選、再點一次取消；標籤超過兩個收合成 +N，欄位高度維持 32px。</p>
    <div class="guide-fields">
      ${multiSelect('languages', '其他語系', LANGUAGES, draft.languages)}
      ${multiSelect('countryCodes', '國碼', COUNTRY_CODES, draft.countryCodes)}
    </div>
  </section>

  <section class="card example-settings-card">
    <h3 class="example-settings-heading">上傳 Logo</h3>
    <p class="example-settings-hint">尺寸與容量寫在欄位標題上，不是等上傳失敗才用錯誤訊息告知。</p>
    <div class="upload-grid">
      ${uploadSlot({ label: 'Web Logo', size: '240 × 60', maxKB: 300, attrs: 'data-branch-upload="pc"' })}
      ${uploadSlot({ label: 'H5 Logo', size: '120 × 40', maxKB: 150, attrs: 'data-branch-upload="h5"' })}
    </div>
  </section>

  <section class="card example-settings-card">
    <h3 class="example-settings-heading">版型設定</h3>
    <fieldset class="choice-group is-inline">
      <legend>色系</legend>
      ${TEMPLATE_COLORS.map(([value, label]) => choiceControl({
        type: 'radio', name: 'branch-template', label,
        checked: draft.templateColor === value,
        attrs: `data-branch-radio="templateColor" value="${value}"`,
      })).join('')}
    </fieldset>
  </section>

  <div class="example-settings-pair">
    <section class="card example-settings-card">
      <h3 class="example-settings-heading">前台 HEAD</h3>
      <div class="guide-fields">
        ${textField('frontTitle', 'title', draft.frontTitle, 60)}
        ${textField('frontDescription', 'description', draft.frontDescription, 160)}
      </div>
    </section>
    <section class="card example-settings-card">
      <h3 class="example-settings-heading">後台 HEAD</h3>
      <div class="guide-fields">
        ${textField('backTitle', 'title', draft.backTitle, 60)}
        ${textField('backDescription', 'description', draft.backDescription, 160)}
      </div>
    </section>
  </div>

  <section class="card example-settings-card">
    <h3 class="example-settings-heading">其他設定</h3>
    <fieldset class="choice-group is-inline">
      <legend>轉換幣值</legend>
      ${[['on', '開啟'], ['off', '關閉']].map(([value, label]) => choiceControl({
        type: 'radio', name: 'branch-convert', label,
        checked: draft.convertCurrency === value,
        attrs: `data-branch-radio="convertCurrency" value="${value}"`,
      })).join('')}
    </fieldset>
  </section>`

// --- 註冊登入設定 ---
const fieldRow = (mode, field) => {
  const state = draft.modes[mode.key].fields[field.key]
  return `<div class="example-field-row${field.indent ? ' is-indent' : ''}">
    ${choiceControl({
      type: 'checkbox', label: field.label,
      checked: state.enabled, disabled: !!field.locked,
      attrs: `data-branch-field="${mode.key}:${field.key}"`,
    })}
    ${field.noRequired ? '' : `<div class="example-field-right">
      ${tag(state.required ? '必填' : '選填', state.required ? 'warning' : 'info')}
      <button type="button" class="standard-switch" role="switch"
        aria-checked="${state.required}" aria-label="${esc(field.label)}設為必填"
        data-branch-required="${mode.key}:${field.key}"
        ${field.locked || !state.enabled ? 'disabled' : ''}></button>
    </div>`}
  </div>`
}

const modeCard = mode => {
  const state = draft.modes[mode.key]
  return `<section class="card example-mode-card">
    <header class="example-mode-head">
      <h3>${mode.title}</h3>
      <button type="button" class="standard-switch" role="switch" aria-checked="${state.on}"
        aria-label="啟用${mode.title}" data-branch-mode="${mode.key}"></button>
    </header>
    <div class="example-mode-body${state.on ? '' : ' is-disabled'}"${state.on ? '' : ' inert'}>
      ${mode.fields.map(field => fieldRow(mode, field)).join('')}
    </div>
  </section>`
}

const registerPanel = () => `
  <div class="bo-alert is-info example-settings-alert">
    <span class="bo-alert-icon">${icon('info', 20)}</span>
    <span>至少要保留一種登入方式。關閉的模式不會出現在前台註冊頁，已用該方式註冊的會員仍然可以登入。</span>
  </div>
  ${MODES.map(modeCard).join('')}`

const panel = () => (draft.active === 'base' ? basePanel() : registerPanel())

window.renderExampleSettings = () => `<section class="example-page example-settings-page" data-branch-root>
  <div class="guide-section-heading">
    <h2>分站設定</h2>
    <p class="component-description">組合範例（設定型），照正式後台 <code>branchSetting/index.vue</code> 做。沒有表格也沒有分頁，走的是另一條動線：頁籤 → 表單 → 未儲存提醒 → 儲存。</p>
  </div>
  ${tabs({ id: TAB_ID, label: '分站設定分類', items: TABS, active: draft.active, variant: 'card', mobile: 'select', panels: true })}
  ${tabPanels(TAB_ID, TABS.map(t => [t.key, t.key === draft.active ? panel() : '']), draft.active)}
  <footer class="example-savebar">
    <div class="example-save-status" role="status">${dirty() ? '有尚未儲存的變更' : '儲存後才會套用'}</div>
    <div class="example-save-actions">
      <button type="button" class="semantic-btn btn-neutral" data-branch-cancel ${dirty() ? '' : 'disabled'}>取消變更</button>
      <button type="button" class="semantic-btn btn-search" data-branch-save ${dirty() ? '' : 'disabled'}>儲存設定</button>
    </div>
  </footer>
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>頁籤</strong>：卡片型頁籤，手機改成下拉；頁籤切換不等於儲存</li>
      <li><strong>下拉選單／輸入框</strong>：label 在上、控制在下，與列表頁的篩選列同一套 class</li>
      <li><strong>選擇控制</strong>：色系與轉換幣值用 Radio（單選、選項少）；註冊欄位用 Checkbox（可複選）</li>
      <li><strong>開關</strong>：開關管「要不要」，一列一個，左開關右文字，不與 Radio 混用</li>
      <li><strong>標籤</strong>：必填／選填是唯讀狀態，用標籤不是用按鈕</li>
      <li><strong>圖片上傳</strong>：尺寸與容量寫在欄位標題上，上傳前就擋得住錯誤</li>
      <li><strong>行內警示</strong>：說明整段區塊的規則，常駐不消失，所以不是 Toast</li>
      <li><strong>彈窗</strong>：有未儲存變更時切換頁籤會先確認，確認後還原草稿</li>
      <li><strong>訊息提示</strong>：儲存結果用 Toast，因為它是一次性的回報</li>
    </ul>
  </section>
</section>`

// --- 互動 ---
const redraw = () => {
  const host = document.querySelector('[data-branch-root]')
  if (!host) return
  host.outerHTML = window.renderExampleSettings()
}

const modeField = key => {
  const [modeKey, fieldKey] = key.split(':')
  const mode = MODES.find(m => m.key === modeKey)
  return { mode, field: mode.fields.find(f => f.key === fieldKey), state: draft.modes[modeKey].fields[fieldKey] }
}

onMatch('change', '[data-branch-multi]', (event, select) => {
  const key = select.dataset.branchMulti
  draft[key] = [...select.selectedOptions].map(option => option.value)
  redraw()
}, { owner: 'example-settings' })

onMatch('input', '[data-branch-text]', (event, input) => {
  // 只更新資料不重繪，重繪會讓游標跳到字尾
  draft[input.dataset.branchText] = input.value
  const bar = document.querySelector('[data-branch-root] .example-save-status')
  if (bar) bar.textContent = dirty() ? '有尚未儲存的變更' : '儲存後才會套用'
  document.querySelectorAll('[data-branch-cancel],[data-branch-save]').forEach(b => { b.disabled = !dirty() })
}, { owner: 'example-settings' })

onMatch('change', '[data-branch-radio]', (event, input) => {
  draft[input.dataset.branchRadio] = input.getAttribute('value')
  redraw()
}, { owner: 'example-settings' })

onMatch('change', '[data-branch-field]', (event, input) => {
  const { field, state } = modeField(input.dataset.branchField)
  if (field.locked) return
  state.enabled = input.checked
  // 取消勾選的欄位不會出現在註冊表單上，「必填」就失去意義，一併關掉
  if (!state.enabled) state.required = false
  redraw()
}, { owner: 'example-settings' })

onMatch('click', '[data-branch-required]', (event, button) => {
  if (button.disabled) return
  const { state } = modeField(button.dataset.branchRequired)
  state.required = !state.required
  redraw()
}, { owner: 'example-settings' })

onMatch('click', '[data-branch-mode]', (event, button) => {
  const key = button.dataset.branchMode
  const next = !draft.modes[key].on
  // 至少要留一種登入方式，否則前台註冊頁會沒有任何入口
  if (!next && !MODES.some(m => m.key !== key && draft.modes[m.key].on)) {
    message.warning('至少要保留一種登入方式')
    return
  }
  draft.modes[key].on = next
  redraw()
}, { owner: 'example-settings' })

onMatch('click', '[data-branch-upload]', (event, zone) =>
  message.info(`${zone.dataset.branchUpload === 'pc' ? 'Web' : 'H5'} Logo 的檔案選擇在正式環境接上傳 API`),
  { owner: 'example-settings' })

onMatch('click', '[data-branch-save]', () => {
  saved = JSON.stringify(draft)
  redraw()
  message.success('分站設定已儲存')
}, { owner: 'example-settings' })

onMatch('click', '[data-branch-cancel]', () => {
  const active = draft.active
  draft = JSON.parse(saved)
  draft.active = active
  redraw()
  message.info('已還原為上次儲存的設定')
}, { owner: 'example-settings' })

// 頁籤切換：有未儲存變更時先攔下來確認。正式後台的 before-leave 也是這個行為，
// 而且「確認離開」會把草稿還原——不是留著改到一半的資料跳到另一個頁籤。
onMatch('click', `[data-tabs="${TAB_ID}"] [data-tab-key]`, (event, button) => {
  const next = button.dataset.tabKey
  if (next === draft.active) return
  // 兩條路都攔下來自己處理：切換後整頁重繪，若放行讓 tabs.js 的預設行為也跑一次，
  // 它會對已經被換掉的舊節點做顯示／隱藏。
  event.preventDefault()
  event.stopPropagation()
  if (!dirty()) {
    draft.active = next
    redraw()
    return
  }
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>離開目前頁籤</h2></header>
    <div class="bo-modal-body"><p>異動資訊未保存，請確認是否離開？</p><p>離開後這個頁籤的變更會還原為上次儲存的內容。</p></div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>留在此頁</button>
      <button type="submit" class="semantic-btn btn-warning">離開並還原</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    draft = JSON.parse(saved)
    draft.active = next
    dialog.close()
    redraw()
  }
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-settings', capture: true })
