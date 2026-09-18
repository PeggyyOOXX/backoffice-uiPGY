import { tooltipAttrs } from './tooltip.js'
import './icon-button.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

// Replaces the old IconBtn: same icon + tooltip + disabled behaviour, but built on the
// semantic button classes so the colours stay inside the existing system.
// A disabled button fires no pointer events, so the tooltip moves to a wrapper.
export function iconButton({ icon, label, kind = 'btn-neutral', outline = false, disabled = false, placement = 'top', attrs = '' }) {
  const button = `<button type="button" class="semantic-btn ${kind}${outline ? ' outline' : ''} icon-action" aria-label="${esc(label)}" ${disabled ? 'disabled' : tooltipAttrs(label, placement)} ${attrs}><span aria-hidden="true">${icon}</span></button>`
  return disabled ? `<span class="icon-action-wrap" ${tooltipAttrs(label, placement)}>${button}</span>` : button
}

const ICONS = [
  ['✎', '編輯', 'btn-edit', '進入編輯頁或開啟編輯彈窗。'],
  ['◷', '登入紀錄', 'btn-record', '查看詳情、歷程與預覽。'],
  ['⇩', '匯出', 'btn-export', '下載或產生報表檔案。'],
  ['＋', '新增', 'btn-add', '建立新資料。'],
  ['↻', '刷新', 'btn-neutral', '刷新、重設與關閉等不改變資料的操作。'],
  ['×', '刪除', 'btn-danger', '刪除、拒絕等高風險操作。'],
]

window.iconButtonGuide = () => `<section class="component-example" id="icon-button-guide"><h2>圖示按鈕 Icon Button</h2><div class="card icon-button-guide">
  <p class="component-description">只放得下一個圖示的操作，用在表格操作欄與密集工具列。語意色沿用上方按鈕規範，不另訂配色；圖示本身不表達語意，語意由顏色與提示文字決定。</p>
  <h3>語意色</h3>
  <div class="icon-action-group">
    ${ICONS.map(([icon, label, kind]) => `<div class="icon-button-sample">${iconButton({ icon, label, kind })}<small>${label}</small></div>`).join('')}
  </div>
  <h3>變化</h3>
  <div class="icon-action-group">
    <div class="icon-button-sample">${iconButton({ icon:'✎', label:'編輯', kind:'btn-edit' })}<small>預設</small></div>
    <div class="icon-button-sample">${iconButton({ icon:'✎', label:'編輯', kind:'btn-edit', outline:true })}<small>次要</small></div>
    <div class="icon-button-sample">${iconButton({ icon:'✎', label:'無編輯權限', kind:'btn-edit', disabled:true })}<small>停用</small></div>
  </div>
  <h3>表格操作欄</h3>
  <div class="icon-action-group">
    ${iconButton({ icon:'✎', label:'編輯', kind:'btn-edit' })}${iconButton({ icon:'◷', label:'登入紀錄', kind:'btn-record' })}${iconButton({ icon:'×', label:'刪除', kind:'btn-danger' })}
  </div>
  <dl>
    <div><dt>尺寸</dt><dd>34 × 34px，觸控裝置 44 × 44px</dd></div>
    <div><dt>圓角</dt><dd>4px，與一般按鈕相同</dd></div>
    <div><dt>圖示大小</dt><dd>16px，字重 400</dd></div>
    <div><dt>按鈕間距</dt><dd>8px</dd></div>
    <div><dt>配色</dt><dd>沿用 semantic-btn 語意色與 hover／focus／disabled</dd></div>
    <div><dt>排列</dt><dd>表格操作欄置中，工具列靠左</dd></div>
  </dl>
  <p class="component-description">每顆必須有 aria-label 與同文字的 Tooltip，不可只靠圖示辨識。同一列最多三顆；超過改用文字按鈕或收進更多選單。停用時說明原因（例如「無編輯權限」），提示文字掛在外層 icon-action-wrap 上，停用按鈕才顯示得出提示。</p>
</div></section>`
