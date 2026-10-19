// 移植：el-steps／el-step。正式後台目前是 StepLine.vue 自製 SVG（含 line／lineActive 兩張圖，
// 那兩張正是圖示盤點時抓到的 viewBox "0 0 121 6"、寫死色碼的檔案），建議改用 el-steps 一併刪掉。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 範例用正式後台「新增分站」的開站流程（branchList/add.vue:486），三步與欄位都照實際的來。
// 另一個用例是「新增代理」（agentManagement/add.vue:425），兩步：基本設定 → 佔成設定。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import { message } from './message.js'
import { onMatch } from './delegate.js'
import './guide-page.css'
import './steps-guide.css'

// 對應 branchList/add.vue 的 StepLine :steps="[base_settings, game_setting, register_login_setting]"
const STEPS = [
  {
    label: '基本設定',
    hint: '站台名稱、Logo 與前後台主色',
    fields: [
      { type: 'text', label: '站台名稱', value: 'DEMO03' },
      { type: 'text', label: '站台網域', value: 'demo03.example.com' },
      { type: 'text', label: '前台主色', value: '#1596AD' },
      { type: 'text', label: '後台主色', value: '#273457' },
      { type: 'note', label: '上傳 Logo', text: '由「圖片上傳 Upload」元件處理' },
    ],
  },
  {
    label: '遊戲設定',
    hint: '開放哪些遊戲商與遊戲分類',
    fields: [
      { type: 'switch', label: '真人娛樂', on: true },
      { type: 'switch', label: '電子遊戲', on: true },
      { type: 'switch', label: '體育投注', on: false },
      { type: 'switch', label: '彩票', on: false },
    ],
  },
  {
    label: '註冊登入設定',
    hint: '平台支援哪些註冊與登入方式',
    fields: [
      { type: 'switch', label: '帳號登入', on: true },
      { type: 'switch', label: '手機登入', on: true },
      { type: 'switch', label: 'Email 登入', on: false },
      { type: 'switch', label: '人機驗證', on: true },
    ],
  },
]

let fieldSeq = 0

// 開關：按「開關排列 Switch」的規範——開關在左、文案緊接在右、間距 16px。
// label 用 for 指到開關，點文案也能切換。
const switchRow = field => {
  const id = `steps-switch-${++fieldSeq}`
  return `<div class="guide-switch-row">
    <button type="button" id="${id}" class="standard-switch" role="switch" aria-checked="${field.on}" aria-labelledby="${id}-label" data-steps-switch></button>
    <label id="${id}-label" for="${id}">${field.label}</label>
  </div>`
}

// 文字欄位：按「輸入框 Input」的規範——label 獨立一行在上，輸入在下且撐滿欄寬。
const textField = field => {
  const id = `steps-field-${++fieldSeq}`
  return `<div class="guide-field">
    <label for="${id}">${field.label}</label>
    <input id="${id}" class="guide-input" value="${field.value}">
  </div>`
}

const noteField = field => `<div class="guide-field">
  <label>${field.label}</label>
  <small>${field.text}</small>
</div>`

let current = 0

const stepList = () => `<ol class="bo-steps">${STEPS.map((step, index) => {
  const state = index < current ? 'is-done' : index === current ? 'is-current' : ''
  return `<li class="bo-step ${state}"${index === current ? ' aria-current="step"' : ''}>
    <span class="bo-step-mark">${index < current ? icon('check', 16) : index + 1}</span>
    <span class="bo-step-text"><strong>${step.label}</strong><small>${step.hint}</small></span>
  </li>`
}).join('')}</ol>`

const panel = () => {
  const step = STEPS[current]
  fieldSeq = 0
  // 開關與輸入欄不並排：規範寫明「Switch 不與下拉並排，每項設定獨立一列」。
  const switches = step.fields.filter(f => f.type === 'switch')
  const inputs = step.fields.filter(f => f.type !== 'switch')
  return `<div class="steps-panel">
    <h4>${step.label}</h4>
    ${inputs.length ? `<div class="guide-fields">${inputs.map(f => f.type === 'note' ? noteField(f) : textField(f)).join('')}</div>` : ''}
    ${switches.length ? `<div class="guide-switch-rows">${switches.map(switchRow).join('')}</div>` : ''}
  </div>`
}

const demo = () => `${stepList()}
  ${panel()}
  <div class="steps-demo-actions">
    <button type="button" class="semantic-btn btn-neutral" data-steps-move="-1" ${current === 0 ? 'disabled' : ''}>${icon('prevStep')}上一步</button>
    ${current === STEPS.length - 1
      ? `<button type="button" class="semantic-btn btn-search" data-steps-submit>建立分站</button>`
      : `<button type="button" class="semantic-btn btn-search" data-steps-move="1">下一步${icon('nextStep')}</button>`}
  </div>`

const DECISION = [
  ['流程有固定順序，前一步沒完成就不能往下', '<strong>步驟導覽</strong>', '正式後台的開站與新增代理都是這種：上一步的設定決定下一步能填什麼'],
  ['只是把長表單分段，順序無所謂', '頁籤 Tabs', '步驟會暗示順序，分段表單用頁籤比較誠實'],
  ['兩步以內', '不要用步驟', '兩步的流程直接一頁做完；不過正式後台的新增代理就是 2 步，因為佔成設定要等基本資料存檔後才算得出來'],
  ['超過六步', '拆成多個流程或加分組', '使用者會失去耐心，也記不住前面填了什麼'],
  ['可以隨時跳著填', '頁籤 Tabs', '步驟不該讓人跳著點，否則「步驟」兩個字沒有意義'],
]

window.renderStepsPage = () => guidePage({
  slug: 'steps',
  title: '步驟導覽 Steps',
  intro: '有固定順序的多段流程。正式後台有兩個用例：<strong>新增分站</strong>（開站，3 步）與<strong>新增代理</strong>（2 步），都用自製的 <code>StepLine.vue</code>。下方範例照開站流程的實際三步與欄位做。',
  sections: [
    {
      heading: '互動範例：開站流程',
      body: `<div class="guide-stage" data-steps-demo>${demo()}</div>
        <p class="component-description">三步與欄位對應 <code>branchList/add.vue</code>：基本設定 → 遊戲設定 → 註冊登入設定。正式後台在「下一步」時會先跑該步表單的 <code>validate()</code>，驗不過就不前進；「上一步」不驗證，已填的內容保留。</p>`,
    },
    { heading: '什麼時候用步驟', body: decisionTable(DECISION) },
    {
      heading: '三種狀態',
      body: `<p class="component-description">已完成顯示勾號而不是數字——數字只代表位置，勾號代表結果。這一點正式後台的 <code>StepLine.vue</code> 已經做對了（<code>activeStep &gt; index + 1</code> 時換成 check 圖示）。</p>
        <table class="steps-state-table"><thead><tr><th>狀態</th><th>標記</th><th>顏色</th></tr></thead><tbody>
          <tr><td>已完成</td><td>勾號</td><td>主題綠底、白色勾號</td></tr>
          <tr><td>目前</td><td>數字</td><td>主題綠底、白字、字重 700</td></tr>
          <tr><td>未完成</td><td>數字</td><td>淺灰底、灰字</td></tr>
        </tbody></table>`,
    },
    {
      heading: '移植建議',
      body: `<div class="guide-pair">
        <div class="is-bad"><h4>${icon('cancelCircle')}現況</h4><p><code>StepLine.vue</code> 的連接線是兩張 SVG：<code>line.svg</code> 與 <code>lineActive.svg</code>，viewBox <code>0 0 121 6</code>、寬度寫死 <code>w-[118px]</code>。步驟文字一長，線就對不齊；步驟數改變也要重算寬度。</p></div>
        <div class="is-good"><h4>${icon('checkCircle')}建議</h4><p>改用 <code>el-steps</code>，連接線由元件畫，寬度自適應。那兩張 SVG 可以直接刪掉——它們也是圖示盤點時抓到的「viewBox 不一致、寫死色碼」檔案之一。</p></div>
      </div>`,
    },
  ],
  tokens: [
    ['標記尺寸', '26 × 26px'],
    ['標記圓角', '50%'],
    ['連接線', '2px，寬度自適應'],
    ['步驟間距', '16px'],
    ['標題', '12px / 600'],
    ['說明', '12px / #718096'],
    ['目前步驟', '主題綠 #1596AD'],
    ['已完成', '主題綠底 ＋ 白色勾號'],
    ['未完成', '#EDF1F5 底 / #718096 字'],
    ['正式後台步數', '開站 3 步、新增代理 2 步'],
    ['手機排列', '改為直向'],
    ['無障礙', 'ol + li，目前步驟標 aria-current="step"'],
  ],
  rules: [
    ['已完成用勾號不用數字', '數字只代表位置，勾號代表結果；兩者同時出現時使用者分不出哪些已完成。'],
    ['下一步要先驗證', '驗不過就不前進，並把焦點移到第一個錯誤欄位；正式後台已是這個行為。'],
    ['上一步不驗證且保留內容', '回去修改是正常流程，不該因為當前步驟沒填完就被擋住。'],
    ['步驟不可跳著點', '能跳著填就不是步驟，請改用頁籤；否則「還剩幾步」失去意義。'],
    ['用 ol 而不是 div', '步驟本質是有序清單；目前步驟要標 aria-current="step"。'],
    ['手機改直向', '橫向排列在小螢幕會把文字擠成一個字一行。'],
  ],
})

function redraw() {
  const host = document.querySelector('[data-steps-demo]')
  if (host) host.innerHTML = demo()
}

onMatch('click', '[data-steps-move]', (event, button) => {
  const next = current + Number(button.dataset.stepsMove)
  if (next < 0 || next >= STEPS.length) return
  current = next
  redraw()
}, { owner: 'steps-guide' })

onMatch('click', '[data-steps-submit]', () => {
  message.success('已建立分站 DEMO03')
  current = 0
  redraw()
}, { owner: 'steps-guide' })

onMatch('click', '[data-steps-switch]', (event, control) => {
  control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true'))
}, { owner: 'steps-guide' })
