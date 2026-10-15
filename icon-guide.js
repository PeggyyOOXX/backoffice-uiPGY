// 移植：正式後台的 SvgIcon.vue。這一頁是規範頁，也是**許可清單本身**——
// 畫面上有的名稱才可以用，沒有的要先加進 build-icons.cjs 的 ALLOWLIST。詳見 ICON-SYSTEM.md
//
// 版面骨架比照「頁籤 Tabs」與「載入與空狀態」：外層 style-guide，標題用
// guide-section-heading，每個區塊是 section.card 並由自己的 class 給內距，小節一律 h3。
import { icon, ICON_LIST, GROUPS, SIZES } from './icons.js'
import { onMatch } from './delegate.js'
import './icon-guide.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const byGroup = key => ICON_LIST.filter(i => i.group === key)

// 每一格：圖示、名稱（可點擊複製）、中文、來源的 Lucide 檔名
const cell = item => `<button type="button" class="icon-cell" data-icon-copy="${esc(item.name)}" title="點一下複製 icon('${esc(item.name)}')">
  <span class="icon-cell-art">${icon(item.name, 24)}</span>
  <code>${esc(item.name)}</code>
  <small>${esc(item.label)}</small>
  <em>${esc(item.file)}</em>
</button>`

const group = ({ key, label }) => {
  const items = byGroup(key)
  return `<section class="card icon-guide" id="icon-group-${key}">
    <h3>${label}<em class="icon-guide-count">${items.length} 個</em></h3>
    <div class="icon-grid">${items.map(cell).join('')}</div>
  </section>`
}

// 尺寸階：同一個圖示三種尺寸並排，看線寬補償有沒有生效
const sizeRow = name => `<div class="icon-size-row">
  ${SIZES.map(size => `<span class="icon-size-sample">${icon(name, size)}<small>${size}px</small></span>`).join('')}
  <code>${esc(name)}</code>
</div>`

window.renderIconGuide = () => `<div class="style-guide icon-guide-page">
  <div class="guide-section-heading">
    <h2>圖示系統 Icon</h2>
    <p class="component-description">來源為 Lucide（ISC 授權）。Lucide 共 1940 個圖示，本專案只用下方 ${ICON_LIST.length} 個——這份清單就是規範，要用新圖示先加進 <code>build-icons.cjs</code> 的 <code>ALLOWLIST</code> 再重跑，不要在頁面自己拼 <code>svg</code>，也不要用文字字元。名稱沿用正式後台 <code>SvgIcon</code> 的 camelCase，移植時一對一。</p>
  </div>

  <section class="card icon-guide">
    <h3>分類</h3>
    <p class="component-description">點任何一格可複製 <code>icon('name')</code> 呼叫語法。</p>
    <nav class="icon-guide-jump" aria-label="圖示分類">
      ${GROUPS.map(g => `<a href="#icon-group-${g.key}">${g.label}<em>${byGroup(g.key).length}</em></a>`).join('')}
    </nav>
    <p class="icon-guide-copied" role="status" aria-live="polite"></p>
  </section>

  ${GROUPS.map(group).join('')}

  <section class="card icon-guide">
    <h3>尺寸階與線寬</h3>
    <p class="component-description">只有三個尺寸。Lucide 的 <code>stroke-width: 2</code> 是為 24px 畫的，直接縮到 16px 實際線寬只剩 <code>2 × 16/24 = 1.33px</code>，在非整數 DPI 的螢幕上會糊，所以依尺寸補償線寬。</p>
    <table class="icon-guide-table">
      <thead><tr><th>尺寸</th><th>stroke-width</th><th>實際線寬</th><th>用在</th></tr></thead>
      <tbody>
        <tr><td>24px</td><td>2</td><td>2.00px</td><td>空狀態插圖</td></tr>
        <tr><td>20px</td><td>2.25</td><td>1.88px</td><td>側欄導覽、頁首、狀態標記</td></tr>
        <tr><td>16px</td><td>2.5</td><td>1.67px</td><td>表格操作欄、工具列按鈕內、輸入框尾綴</td></tr>
      </tbody>
    </table>
    <h3>實際比較</h3>
    <div class="icon-size-rows">${['edit', 'delete', 'search', 'riskControl', 'reports'].map(sizeRow).join('')}</div>
  </section>

  <section class="card token-table icon-token">
    <h2>共用規格</h2>
    <div>
      <span>來源</span><strong>Lucide 1.6.0（ISC）</strong>
      <span>開放名稱數</span><strong>${ICON_LIST.length}</strong>
      <span>viewBox</span><strong>0 0 24 24</strong>
      <span>尺寸</span><strong>16 / 20 / 24px</strong>
      <span>stroke-width</span><strong>2.5 / 2.25 / 2</strong>
      <span>端點／轉角</span><strong>round</strong>
      <span>顏色</span><strong>currentColor</strong>
      <span>填色</span><strong>none</strong>
      <span>與文字間距</span><strong>6px</strong>
      <span>對齊</span><strong>vertical-align: -.125em</strong>
      <span>無障礙</span><strong>aria-hidden + focusable="false"</strong>
      <span>命名</span><strong>camelCase</strong>
    </div>
  </section>

  <section class="card guide-rules">
    <h2>使用規則</h2>
    <div class="rule-grid">
      <div><strong>只用清單上的名稱</strong><p>Lucide 有 1940 個，本專案只開放 ${ICON_LIST.length} 個。清單外的名稱 <code>icon()</code> 會在主控台警告並不畫。</p></div>
      <div><strong>新增要走清單</strong><p>改 <code>build-icons.cjs</code> 的 <code>ALLOWLIST</code> 後執行 <code>node build-icons.cjs</code>，不要在頁面自己拼 svg。</p></div>
      <div><strong>顏色一律 currentColor</strong><p>由父層的 <code>color</code> 決定，SVG 內不得出現色碼，否則換主題時會留下舊色。</p></div>
      <div><strong>尺寸只有三級</strong><p>成對設定 <code>width</code> 與 <code>height</code>，不靠 <code>font-size</code>；線寬由 <code>icon()</code> 補償，不得自行覆寫。</p></div>
      <div><strong>圖示不單獨表達語意</strong><p>純圖示按鈕必須同時有 <code>aria-label</code> 與同文字的 Tooltip，不可只靠圖示辨識。</p></div>
      <div><strong>命名描述物件</strong><p>用 <code>operationRecord</code> 不用 <code>memberOperationRecord</code>——描述物件，不描述頁面。</p></div>
    </div>
  </section>
</div>`

// 點一格就複製呼叫語法，省得在清單和程式碼之間來回抄。
onMatch('click', '[data-icon-copy]', (event, button) => {
  const name = button.dataset.iconCopy
  const snippet = `icon('${name}')`
  navigator.clipboard?.writeText(snippet).catch(() => {})
  const status = button.closest('.icon-guide-page')?.querySelector('.icon-guide-copied')
  if (status) status.textContent = `已複製 ${snippet}`
}, { owner: 'icon-guide' })
