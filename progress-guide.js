// 移植：el-progress（正式後台 3 個檔案在用）。詳見 ELEMENT-PLUS-MAPPING.md
//
// 另開一頁而不是塞進既有頁面：進度條不是載入狀態（那是 states.js 的骨架與遮罩），
// 也不是標籤（那是唯讀的短字串）。它表達的是「一個有終點的量現在走到哪」，
// 既有的頁面沒有一個放得下這組規則。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import './guide-page.css'
import './progress-guide.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * 進度條。
 * @param value 0–100
 * @param label 給螢幕報讀器的說明
 * @param tone  auto 依比例自動變色；或指定 success / warning / danger
 * @param text  right（預設，數字在右）／inside／none
 */
export function progressBar({ value, label, tone = 'auto', text = 'right' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  // 自動變色只用在「用量／額度」這種越高越危險的量；進度本身不該因為快完成就變紅。
  const resolved = tone !== 'auto' ? tone : pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success'
  return `<div class="bo-progress is-${resolved}${text === 'inside' ? ' has-inside-text' : ''}">
    <div class="bo-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}">
      <div class="bo-progress-fill" style="width:${pct}%">${text === 'inside' ? `<span>${pct}%</span>` : ''}</div>
    </div>
    ${text === 'right' ? `<span class="bo-progress-text">${pct}%</span>` : ''}
  </div>`
}

const USAGE = [
  ['頁首的額度列', 'Header.vue', '存款／提款額度用了多少', '越高越危險 → 自動變色'],
  ['禮物卡管理', 'giftCardManagement', '已領取張數 / 總張數', '中性，不變色'],
  ['邀請進度追蹤', 'invitationProgressTracking', '已完成的邀請條件', '中性，不變色'],
]

const DECISION = [
  ['有明確終點、知道完成幾成', '<strong>進度條</strong>', '使用者能估算還要多久或還差多少'],
  ['不知道要多久（請求中）', '載入遮罩或骨架', '假的進度條比轉圈更糟——它承諾了做不到的事'],
  ['用量 vs 額度', '<strong>進度條，自動變色</strong>', '越接近上限越需要被看見'],
  ['只是一個比例數字', '純文字', '45% 三個字就講完了，不必多畫一條'],
  ['多個步驟的流程', '步驟導覽 Steps', '步驟有名字，進度條只有數字'],
]

// 示範用的初始值。推進與重設都整組重畫，不在 DOM 上逐條改屬性——
// 逐條改要同時維護寬度、aria-valuenow、數字與配色四樣，很容易漏掉其中一個。
const DEMO_BARS = [
  ['存款額度', 32, '存款額度已用', 'auto'],
  ['提款額度', 76, '提款額度已用', 'auto'],
  ['單日上限', 94, '單日上限已用', 'auto'],
  ['禮物卡領取', 58, '禮物卡已領取', 'info'],
]
let offset = 0

const renderBars = () => DEMO_BARS.map(([label, base, aria, tone]) => {
  const value = Math.min(100, base + offset)
  return `<div class="progress-row"><span>${label}</span>${progressBar({ value, label: `${aria} ${value}%`, tone })}</div>`
}).join('')

function redrawBars() {
  const host = document.querySelector('[data-progress-demo]')
  if (host) host.innerHTML = renderBars()
}

window.renderProgressPage = () => guidePage({
  slug: 'progress',
  title: '進度條 Progress',
  intro: '表達「一個有終點的量現在走到哪」。它<strong>不是載入狀態</strong>——不知道要多久的等待請用遮罩或骨架，假的進度條承諾了做不到的事。',
  sections: [
    {
      heading: '互動範例',
      body: `<div class="guide-stage progress-demo" data-progress-demo>${renderBars()}</div>
        <div class="message-guide-actions">
          <button type="button" class="semantic-btn btn-edit" data-progress-step>推進 10%</button>
          <button type="button" class="semantic-btn btn-neutral" data-progress-reset>${icon('reset')}重設</button>
        </div>`,
    },
    { heading: '什麼時候用進度條', body: decisionTable(DECISION) },
    {
      heading: '自動變色只用在「用量」',
      body: `<div class="guide-pair">
        <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>上傳進度走到 90% 時變紅。進度本身越高是越好，變紅會讓人以為出錯了。</p></div>
        <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>只有「用量 ÷ 額度」這種<strong>越高越危險</strong>的量才自動變色：70% 轉警告、90% 轉危險。一般進度維持單一顏色。</p></div>
      </div>`,
    },
    {
      heading: '正式後台的用法',
      body: `<div class="table-wrap"><table class="progress-usage-table">
          <thead><tr><th>位置</th><th>檔案</th><th>表達什麼</th><th>變色</th></tr></thead>
          <tbody>${USAGE.map(([where, file, what, tone]) =>
            `<tr><td>${where}</td><td><code>${file}</code></td><td>${what}</td><td>${tone}</td></tr>`).join('')}</tbody>
        </table></div>`,
    },
  ],
  tokens: [
    ['高度', '8px'],
    ['圓角', '4px'],
    ['軌道底色', '#EDF1F5'],
    ['數字位置', '右側（預設）'],
    ['數字字級', '12px，等寬數字'],
    ['與數字間距', '8px'],
    ['一般進度', '#1596AD'],
    ['用量 ≥ 70%', '#D97318'],
    ['用量 ≥ 90%', '#DD3340'],
    ['動畫', '寬度 .3s，prefers-reduced-motion 下關閉'],
    ['無障礙', 'role="progressbar" + aria-valuenow/min/max'],
    ['標籤', 'aria-label 說明這是什麼的進度'],
  ],
  rules: [
    ['不要拿來當載入狀態', '不知道要多久就用遮罩或骨架；假的進度條承諾了做不到的事。'],
    ['自動變色只用在用量', '越高越危險的量才變色；一般進度越高是越好，變紅會讓人以為出錯。'],
    ['一定要有 aria-label', '只有一條彩色長條，螢幕報讀器讀不出它代表什麼。'],
    ['數字不要放進條內', '8px 高的條塞不下 12px 的字；數字放右側。'],
    ['0% 與 100% 都要畫得出來', '0% 時軌道仍可見，100% 時不要讓圓角被切掉。'],
    ['減少動態時關閉過場', 'prefers-reduced-motion 下不做寬度動畫，直接跳到目標值。'],
  ],
})

onMatch('click', '[data-progress-step]', () => {
  offset = (offset + 10) % 110
  redrawBars()
}, { owner: 'progress-guide' })

onMatch('click', '[data-progress-reset]', () => {
  offset = 0
  redrawBars()
}, { owner: 'progress-guide' })
