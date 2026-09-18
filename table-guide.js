import { iconButton } from './icon-button.js'
import './table-guide.css'

const ROWS = [
  ['WD-260918-8821', 'david_lin', 'LV1', '120,000.00', '待審核', 'pending-b'],
  ['WD-260918-8820', 'noah_wang', 'LV2', '82,500.00', '已通過', 'active-b'],
  ['WD-260918-8819', 'mina_wu', 'LV3', '46,000.00', '已拒絕', 'risk-b'],
]
const TOKENS = [
  ['表頭底色', '#F7F8FB'],
  ['表頭文字', '#68758B／12px／line-height 1.25'],
  ['表頭內距', '8px 11px'],
  ['內容內距', '9px 11px'],
  ['對齊', '表頭與內容一律置中'],
  ['列底線', '1px #EDF0F4'],
  ['直分隔線', '表頭 1px var(--line)，內容 1px #EDF0F4'],
  ['每列最後一格', '不畫右側分隔線'],
  ['整列 hover', '#F1F8FA'],
  ['合計列', '底色同表頭 #F7F8FB'],
]
const RULES = [
  ['單一來源', '共用外觀定義在 index.html 的 unified-table-system，以搜尋結果／會員列表為基準。個別表格的 CSS 只負責結構：min-width、table-layout、colgroup、固定欄、欄寬。'],
  ['不得局部覆寫', '不可自訂表頭底色、文字色、字級、內距、框線或對齊。需要靠左的只有權限矩陣首欄與合計列的標籤欄。'],
  ['操作欄置中', '表格內的操作欄置中，使用圖示按鈕，同一列最多三顆。列表工具列的按鈕則靠左。'],
  ['固定欄要跟著 hover', '固定欄有自己的底色，必須另外套用 hover 底色，否則整列會斷開。'],
  ['窄螢幕改卡片', '欄位多到需要橫向捲動的表格，720px 以下改用卡片列表，不讓使用者在手機上拉表格。'],
]

window.tableGuide = () => `<section class="component-example" id="table-guide"><h2>表格 Table</h2><div class="card table-guide">
  <p class="component-description">全站表格共用同一組外觀，以搜尋結果／會員列表為基準。彈窗內的表格套用同一組樣式。</p>
  <div class="table-guide-wrap"><table class="table-guide-sample">
    <thead><tr>${['轉點 ID','會員帳號','層級','轉點金額','狀態','操作'].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
    <tbody>${ROWS.map(([id, account, level, amount, state, tone]) => `<tr><td>${id}</td><td>${account}</td><td>${level}</td><td>${amount}</td><td><span class="badge ${tone}">${state}</span></td><td><div class="icon-action-group" style="justify-content:center">${iconButton({ icon:'✎', label:`編輯 ${id}`, kind:'btn-edit' })}${iconButton({ icon:'◷', label:`檢視紀錄 ${id}`, kind:'btn-record' })}</div></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3">合計（${ROWS.length} 筆）</td><td>248,500.00</td><td colspan="2"></td></tr></tfoot>
  </table></div>
  <dl>${TOKENS.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
  <h3>使用規則</h3>
  <div class="table-guide-rules">${RULES.map(([title, text]) => `<div><strong>${title}</strong><p>${text}</p></div>`).join('')}</div>
</div></section>`
