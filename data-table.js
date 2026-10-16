// 移植：el-table（正式後台 CustomTable.vue）＋ el-pagination（Pagination.vue）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 表格與分頁合成一個元件，因為它們在實務上分不開：正式後台 53 個用到分頁的 view，
// 53 個都搭配 CustomTable，分頁從來沒有單獨出現過。拆成兩個元件的結果是每個頁面
// 自己把它們兜在一起，兜法各不相同——原型先前就有三種寫法。
//
// 不分頁的表格（設定頁、權限矩陣，正式後台有 14 個）傳 pagination: false。
import { icon } from './icons.js'
import { emptyRow } from './states.js'
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
      <select class="page-size-select guide-select" data-table-size data-table="${esc(name)}" aria-label="每頁筆數">
        ${PAGE_SIZES.map(n => `<option value="${n}" ${n === pageSize ? 'selected' : ''}>${n}</option>`).join('')}
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
 * @param columns    [{ key, label, align, width, className, header }]
 *                   header 是表頭的原始 HTML（批量選單、排序鈕），省略時用逸出後的 label
 * @param rows       資料列，每筆是物件；值可以是 HTML 字串
 * @param page       目前頁（1 起算）
 * @param pageSize   每頁筆數
 * @param total      總筆數；省略時用 rows.length
 * @param pagination false 代表不分頁（設定頁、權限矩陣）
 * @param empty      沒有資料時的標題，版面沿用「載入與空狀態」
 */
export function dataTable({ name = 'table', columns, rows, page = 1, pageSize = PAGE_SIZES[1], total, pagination = true, empty = '無資料' }) {
  const count = total ?? rows.length
  // align 與 width 要合併成同一個 style；先前是兩個 style 屬性，後面那個會被瀏覽器直接丟掉，
  // 所以同時指定 align 與 width 時 width 從來沒生效過。
  const style = c => {
    const parts = [c.align && `text-align:${c.align}`, c.width && `width:${c.width}`].filter(Boolean)
    return parts.length ? ` style="${parts.join(';')}"` : ''
  }
  const cls = c => (c.className ? ` class="${esc(c.className)}"` : '')
  // header 讓欄位表頭放得下控制項（批量選單、排序鈕）；沒給就是逸出後的 label。
  const head = columns.map(c => `<th scope="col"${cls(c)}${style(c)}>${c.header ?? esc(c.label)}</th>`).join('')
  const body = rows.length
    ? rows.map(row => `<tr>${columns.map(c => `<td data-label="${esc(c.label)}"${cls(c)}${c.align ? ` style="text-align:${c.align}"` : ''}>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('')
    // 空狀態不自己畫，沿用「載入與空狀態」的區塊——先前這裡是一行純文字，
    // 跟規範頁示範的圖示＋文字長得不一樣，同一個空狀態站上有兩種版面。
    : emptyRow(columns.length, { title: empty })

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
