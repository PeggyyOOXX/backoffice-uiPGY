import { emptyState, emptyRow, errorState, skeletonTable, loadingWrap, STATE_COPY } from './states.js'
import './state-guide.css'
import { on } from './delegate.js'
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = ["[data-state-demo]"]
const listen = (type, handler, capture = false) => on(type, handler, { owner: 'state-guide', claims: OWNED, capture })


const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const ROWS = [
  ['WD-260915-8821', 'ava_chen', '28,600.00', '2026-09-15 09:20:00'],
  ['WD-260915-8820', 'david_lin', '120,000.00', '2026-09-15 10:20:00'],
  ['WD-260915-8819', 'mina_wu', '46,000.00', '2026-09-15 11:20:00'],
  ['WD-260915-8818', 'lucas_h', '82,500.00', '2026-09-15 12:20:00'],
]
const HEAD = ['申請單號', '會員帳號', '申請金額', '申請時間']

// 示範表格：四種狀態共用同一張表，切換時只換 tbody 與外層包裝。
const table = inner => `<div class="table-wrap"><table class="state-demo-table"><thead><tr>${HEAD.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${inner}</tbody></table></div>`
const dataRows = () => ROWS.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')

const STATES = {
  data: () => table(dataRows()),
  refreshing: () => loadingWrap(table(dataRows()), { loading: true, text: '查詢中' }),
  skeleton: () => skeletonTable({ rows: 4, cols: 4 }),
  empty: () => table(emptyRow(4, { kind: 'empty' })),
  // 後端的 message 就是主文案，示範的是 useApi 會回的 code 與 message。
  error: () => table(`<tr class="bo-state-row"><td colspan="4">${errorState({ code: '000005_1', message: '權限不足' })}</td></tr>`),
}
const SWITCHER = [
  ['data', '有資料'], ['skeleton', '首次載入'], ['refreshing', '重新查詢'],
  ['empty', '無資料'], ['error', '載入失敗'],
]
let current = 'data'

const demoMarkup = () => `<div data-state-demo-root>
    <div class="state-switcher">${SWITCHER.map(([key, label]) =>
      `<button type="button" class="semantic-btn ${key === current ? 'btn-search' : 'btn-neutral'}" data-state-demo="${key}" aria-pressed="${key === current}">${label}</button>`).join('')}</div>
    <div class="state-demo-stage">${STATES[current]()}</div>
  </div>`

const copyRow = (kind, when) => `<tr><td><code>${kind}</code></td><td>${esc(when)}</td><td><strong>${esc(STATE_COPY[kind].title)}</strong><br><span>${esc(STATE_COPY[kind].text)}</span></td></tr>`

window.renderStateGuide = () => `<div class="style-guide state-guide-page">
  <div class="guide-section-heading">
    <h2>載入與空狀態</h2>
    <p class="component-description">資料還沒到、沒有資料、拿不到資料 —— 這三件事畫面上要分得出來，而且每一種都要有文字。全站共用 states.js，個別頁面不得自訂圖示、配色或文案，狀態區也不放操作按鈕。</p>
  </div>

  <section class="card state-guide">
    <h3>互動範例</h3>
    <p class="component-description">同一張表在四種狀態下的樣子。切換看看它們的差別，特別是「首次載入」與「重新查詢」。</p>
    ${demoMarkup()}
  </section>

  <section class="card state-guide">
    <h3>載入中有兩種，不要混用</h3>
    <div class="state-pair">
      <div>
        <h4>骨架 Skeleton — 首次載入</h4>
        <p>畫面上還沒有任何資料可留，用骨架先把版面撐出來，使用者才知道這裡等一下會有一張表。骨架只是版面佔位，不要做成假資料的樣子。</p>
      </div>
      <div>
        <h4>遮罩 Veil — 重新查詢</h4>
        <p>已經有資料在畫面上（換頁、改篩選、自動刷新），舊資料留在原地變淡並蓋上遮罩。不可以換成骨架，否則版面會先塌掉再彈回來，而且使用者會以為資料不見了。</p>
      </div>
    </div>
    <p class="component-description">兩者都掛 <code>role="status"</code>；遮罩期間底下的操作要停用，避免重複送出。</p>

    <h3>無資料只有一種</h3>
    <p class="component-description">「本來就還沒有任何一筆」與「篩選後沒撈到」都顯示<strong>無資料</strong>，不分兩種文案。這與正式後台一致 —— <code>CustomTable</code> 的 <code>empty-text</code> 用的是 i18n key <code>no_data</code>，繁中就是「無資料」。需要引導下一步（新增、清除條件）時，按鈕放在表格外的列表工具列。</p>

    <h3>狀態區不放操作按鈕</h3>
    <p class="component-description">表格裡只呈現「現在是什麼狀況、為什麼」。重新查詢、清除搜尋條件、新增、重新載入<strong>一律放在表格外的列表工具列</strong>，位置固定，使用者不必為了找按鈕而先看懂表格現在是什麼狀態。狀態一換按鈕就跟著跑掉，是最容易讓人找不到操作的做法。</p>

    <h3>載入失敗要顯示後端訊息</h3>
    <p class="component-description">請求失敗時表格不可以顯示「無資料」—— 使用者會以為是查不到，實際上是伺服器出問題。直接把 toast 的字串原樣放進表格：<strong>錯誤碼加敘述，一行，不拆成標題與說明</strong>。兩者都來自後端的固定翻譯字典，請求已帶 <code>Language</code> 標頭，敘述本來就是當前語系 —— 前端不另外寫一套文案，字典改了畫面就跟著改。後端連訊息都沒回時才退回 <code>API request failed</code>，與 <code>useApi</code> 最終分支相同。</p>
    <div class="state-pair">
      <div>
        <h4>可以放</h4>
        <p><code>code</code> 與 <code>message</code>。兩者都是後端給前台看的內容，一律轉義後輸出，不用 innerHTML 原樣插入。</p>
      </div>
      <div>
        <h4>不可以放</h4>
        <p><code>ApiErrorResponse</code> 的 <code>debug</code>。它的型別是 <code>any</code>，可能帶出內部路徑或查詢內容；表格的錯誤會一直留在畫面上、會被截圖轉傳，風險跟幾秒就消失的 toast 不同。</p>
      </div>
    </div>
    <p class="component-description">401／403／451 不走這裡 —— 那幾個狀態碼在 <code>useApi</code> 會清掉 token 並開彈窗登出，使用者看不到表格。toast 繼續保留，它是送出當下的即時回饋；表格這一份是留在畫面上的那一份。</p>

    <h3>欄位層級的同一組狀態</h3>
    <p class="component-description">下拉選單自己也有這組狀態，由 select.js 直接帶出：<code>data-loading</code> 顯示「正在取得選項」、搜尋不到顯示「查無符合的選項」、本來就沒有選項顯示「沒有可選項目」。欄位層級不放圖示也不放操作按鈕，只有一行文字。</p>
  </section>

  <section class="card state-guide">
    <h3>統一文案</h3>
    <p class="component-description">只有「無資料」有前端文案。載入失敗整行都來自後端的錯誤碼字典，<code>STATE_COPY.error</code> 只是後端連訊息都沒回時的退路。</p>
    <div class="table-wrap">
      <table class="state-copy-table">
        <thead><tr><th>狀態</th><th>什麼時候用</th><th>文案</th></tr></thead>
        <tbody>
          ${copyRow('empty', '本來就沒有資料，或篩選後沒撈到')}
          ${copyRow('error', '請求失敗、逾時或伺服器錯誤')}
        </tbody>
      </table>
    </div>
  </section>

  <section class="card token-table state-token">
    <h2>共用規格</h2>
    <div>
      <span>狀態區上下內距</span><strong>40px（手機 32px）</strong>
      <span>圖示</span><strong>36px / #B6C0CC</strong>
      <span>失敗圖示</span><strong>#E59AA4</strong>
      <span>標題</span><strong>14px / 600 / #526477</strong>
      <span>文字行</span><strong>14px / 600 / #526477</strong>
      <span>文字最大寬度</span><strong>40em</strong>
      <span>骨架列高</span><strong>13px / 圓角 4px</strong>
      <span>骨架列間距</span><strong>9px</strong>
      <span>遮罩底色</span><strong>rgba(255,255,255,.6)</strong>
      <span>舊資料透明度</span><strong>0.45</strong>
      <span>Spinner</span><strong>18px / 2px / #1596AD</strong>
    </div>
  </section>

  <section class="card guide-rules">
    <h2>使用規則</h2>
    <div class="rule-grid">
      <div><strong>每種狀態都要有文字</strong><p>載入中、無資料、載入失敗都必須有文案；不可以只留一片空白或只有一個圖示。</p></div>
      <div><strong>骨架只給首次載入</strong><p>畫面上已經有資料時一律用遮罩，不可以把既有資料換成骨架。</p></div>
      <div><strong>無資料只有一種</strong><p>本來就沒有與篩選後沒撈到，都顯示「無資料」，與正式後台的 no_data 一致。</p></div>
      <div><strong>失敗照抄 toast 字串</strong><p>錯誤碼加敘述一行輸出，不在前端另寫文案，也不拆成兩行；字典是唯一來源。</p></div>
      <div><strong>狀態區不放按鈕</strong><p>重新查詢、清除條件、新增、重新載入一律在表格外的列表工具列，位置不隨狀態改變。</p></div>
      <div><strong>文案由 STATE_COPY 決定</strong><p>頁面不得自己寫空狀態文案；需要調整就改 states.js，全站一起變。</p></div>
    </div>
  </section>
</div>`

function redraw() {
  const root = document.querySelector('[data-state-demo-root]')
  if (root) root.outerHTML = demoMarkup()
}

listen('click', event => {
  const pick = event.target.closest('[data-state-demo]')
  if (!pick) return
  current = pick.dataset.stateDemo
  redraw()
  document.querySelector(`[data-state-demo="${current}"]`)?.focus()
})
