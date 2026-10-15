// 移植：el-table（正式後台 CustomTable.vue）＋ el-pagination（Pagination.vue）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 表格與分頁合成一個元件，因為它們在實務上分不開：正式後台 53 個用到分頁的 view，
// 53 個都搭配 CustomTable，分頁從來沒有單獨出現過。拆成兩個元件的結果是每個頁面
// 自己把它們兜在一起，兜法各不相同——原型先前就有三種寫法。
//
// 不分頁的表格（設定頁、權限矩陣，正式後台有 14 個）傳 pagination: false。
import { icon } from './icons.js'
import './data-table.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** 每頁筆數的選項，與正式後台 Pagination.vue 的 perPageEnum 一致。 */
export const PAGE_SIZES = [10, 20, 50, 100]

/** 頁碼超過這個數才折疊，且目前頁前後各留一個，相鄰頁才點得到。 */
const COLLAPSE_AFTER = 7

function pageButtons(page, pages, name) {
  const keep = new Set([1, pages, page - 1, page, page + 1])
  const items = []
  let gap = false
  for (let n = 1; n <= pages; n++) {
    if (pages <= COLLAPSE_AFTER || keep.has(n)) {
      items.push(`<button type="button" class="page-btn${n === page ? ' active' : ''}" data-table-page="${n}" data-table="${esc(name)}"${n === page ? ' aria-current="page"' : ''}>${n}</button>`)
      gap = false
    } else if (!gap) {
      items.push('<span class="page-gap" aria-hidden="true">…</span>')
      gap = true
    }
  }
  return items.join('')
}

function paginationBar({ name, page, pageSize, total }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  // 只有一頁時整列隱藏——「1 / 1」只是雜訊
  if (pages <= 1 && total <= PAGE_SIZES[0]) return ''
  return `<div class="data-table-pagination">
    <span class="pagination-total">共 ${total} 筆</span>
    <label class="pagination-size">每頁
      <select class="guide-select" data-table-size data-table="${esc(name)}" aria-label="每頁筆數">
        ${PAGE_SIZES.map(n => `<option ${n === pageSize ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      筆
    </label>
    <div class="pages">
      <button type="button" class="page-btn is-icon-only" data-table-page="${page - 1}" data-table="${esc(name)}" ${page === 1 ? 'disabled' : ''} aria-label="上一頁">${icon('arrowLeft')}</button>
      ${pageButtons(page, pages, name)}
      <button type="button" class="page-btn is-icon-only" data-table-page="${page + 1}" data-table="${esc(name)}" ${page === pages ? 'disabled' : ''} aria-label="下一頁">${icon('arrowRight')}</button>
    </div>
  </div>`
}

/**
 * 表格＋分頁。
 * @param name       識別字串，事件靠它找回對應的表格
 * @param columns    [{ key, label, align, width }]
 * @param rows       資料列，每筆是物件；值可以是 HTML 字串
 * @param page       目前頁（1 起算）
 * @param pageSize   每頁筆數
 * @param total      總筆數；省略時用 rows.length
 * @param pagination false 代表不分頁（設定頁、權限矩陣）
 * @param empty      沒有資料時顯示的內容
 */
export function dataTable({ name = 'table', columns, rows, page = 1, pageSize = PAGE_SIZES[1], total, pagination = true, empty = '無資料' }) {
  const count = total ?? rows.length
  const head = columns.map(c => `<th${c.align ? ` style="text-align:${c.align}"` : ''}${c.width ? ` style="width:${c.width}"` : ''}>${esc(c.label)}</th>`).join('')
  const body = rows.length
    ? rows.map(row => `<tr>${columns.map(c => `<td data-label="${esc(c.label)}"${c.align ? ` style="text-align:${c.align}"` : ''}>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" class="data-table-empty">${esc(empty)}</td></tr>`

  return `<div class="data-table" data-table-root="${esc(name)}">
    <div class="table-wrap">
      <table class="data-table-grid">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${pagination ? paginationBar({ name, page, pageSize, total: count }) : ''}
  </div>`
}

/**
 * 分頁狀態的共用處理：換頁與改每頁筆數。
 * 改每頁筆數一律跳回第 1 頁——停在原頁碼會看到完全不同的資料，使用者會以為查詢出錯。
 */
export function applyPaging(state, { page, size }) {
  if (size != null) {
    const pageSize = Number(size)
    return { ...state, pageSize, page: 1, pages: Math.max(1, Math.ceil(state.total / pageSize)) }
  }
  const pages = Math.max(1, Math.ceil(state.total / state.pageSize))
  const next = Number(page)
  if (!Number.isFinite(next) || next < 1 || next > pages) return state
  return { ...state, page: next, pages }
}
