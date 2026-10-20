// 批量操作：勾選欄 ＋ 收在欄位表頭的批量控制（原「批量開關」比較頁的方案 B）。
//
// 為什麼入口放在表頭，不放表格上方的工具列：
// 表格上方那排下拉得先讓人理解「批次」與「全部」兩個抽象詞，而且欄位一多就擠成一排；
// 收進表頭之後，入口就在它作用的那一欄正上方，選單裡寫的是「已勾選 8 筆」「全部 24 筆」，
// 看得到數字就不會改錯範圍。代價是一次只能改一個欄位——欄位多時要開好幾次選單。
//
// 這裡只輸出「控制項」，不輸出 <th>/<td>：表格外殼一律交給 dataTable()，
// 兩邊各畫一份表格就是規範分歧的開始。
//
// 移植：el-table 的 selection 欄 ＋ el-checkbox（indeterminate）＋ el-dropdown。
// 正式後台目前沒有用 el-dropdown，移植時表頭選單要一併評估引入。
import { icon } from './icons.js'
import { iconButton } from './icon-button.js'
import './bulk-actions.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** 勾選欄的欄位設定，直接攤進 dataTable 的 columns。 */
export const PICK_COLUMN = { key: 'pick', label: '選取', className: 'bulk-pick-col' }

/** 全選框。部分勾選時是「不確定」狀態，不是未勾選——否則看不出已經選了一些。 */
export const selectAllControl = ({ name, checked, indeterminate }) =>
  `<input type="checkbox" id="bulk-${esc(name)}-all" aria-label="全選本頁" data-bulk-all data-bulk="${esc(name)}" ${checked ? 'checked' : ''} ${indeterminate ? 'data-choice-mixed aria-checked="mixed"' : ''}>`

/** 單列勾選框。aria-label 要帶得出是哪一筆，不能只有「勾選」。 */
export const selectRowControl = ({ name, id, label, checked, disabled = false }) =>
  `<input type="checkbox" id="bulk-${esc(name)}-${esc(id)}" aria-label="勾選 ${esc(label)}" data-bulk-row data-bulk="${esc(name)}" data-id="${esc(id)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>`

/**
 * 可批量調整的欄位表頭內容（放進 column.header）。
 * @param options [[顯示文字, 值], ...]，每個值各產生「已勾選」與「全部」兩條
 * @param open    這一欄的選單是否展開（同時只會有一欄展開）
 */
export function bulkHeader({ name, key, label, options, selected = 0, total = 0, open = false }) {
  const action = (text, value, scope, count) =>
    `<button type="button" role="menuitem" data-bulk-action data-bulk="${esc(name)}" data-key="${esc(key)}" data-value="${esc(value)}" data-scope="${scope}"${scope === 'selected' && !selected ? ' disabled' : ''}>${scope === 'selected' ? '已勾選' : '全部'} ${count} 筆設為${esc(text)}</button>`
  return `<span class="bulk-head">
    <span>${esc(label)}</span>
    ${iconButton({ icon: icon('more', 16), label: `${label} 批量調整`, kind: 'btn-neutral', outline: true, attrs: `data-bulk-menu="${esc(key)}" data-bulk="${esc(name)}" aria-haspopup="menu" aria-expanded="${open}"` })}
    <div class="bulk-menu" role="menu" data-bulk-menu-for="${esc(key)}"${open ? '' : ' hidden'}>
      ${options.map(([text, value]) => action(text, value, 'selected', selected)).join('')}
      <hr>
      ${options.map(([text, value]) => action(text, value, 'all', total)).join('')}
    </div>
  </span>`
}

// 結果回報沒有自己的元件：applyBulk() 回傳文案，頁面直接丟給 message.success()。
// 先前這裡有一個 bulkFeedback()，在表格上方畫一條常駐的回報列並掛一顆復原鈕。
// 批量改成「點了就生效並直接記錄、不給復原」之後，那條列子就沒有留下來的理由了——
// 訊息消失後使用者不再需要它，照全站的訊息層級規範就該是 Toast。

/** 勾選狀態：本頁是否全選、是否部分勾選。只看本頁，不跨頁。 */
export const selectionOf = (ids, selected) => ({
  checked: ids.length > 0 && ids.every(id => selected.has(id)),
  indeterminate: ids.some(id => selected.has(id)) && !ids.every(id => selected.has(id)),
})

/**
 * 套用批量變更，回傳要顯示的文案。
 * 「影響 N 筆」與「實際變更 M 筆」要分開講：把 20 筆都設為開啟，其中 17 筆本來就開著，
 * 只說「已更新 20 筆」會讓人以為真的動了 20 筆。
 */
export function applyBulk({ rows, ids, key, value, label, optionText }) {
  const targets = rows.filter(row => ids.includes(row.id))
  if (!targets.length) return { changed: 0, text: '沒有選取任何資料' }
  const changed = targets.filter(row => row[key] !== value).length
  targets.forEach(row => { row[key] = value })
  return {
    changed,
    text: changed
      ? `已將 ${targets.length} 筆的「${label}」設為${optionText}，實際變更 ${changed} 筆。`
      : `${targets.length} 筆的「${label}」原本就是${optionText}，沒有變更。`,
  }
}
