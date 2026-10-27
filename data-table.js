// 移植：el-table（正式後台 CustomTable.vue）＋ el-pagination（Pagination.vue）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 表格與分頁合成一個元件，因為它們在實務上分不開：正式後台 53 個用到分頁的 view，
// 53 個都搭配 CustomTable，分頁從來沒有單獨出現過。拆成兩個元件的結果是每個頁面
// 自己把它們兜在一起，兜法各不相同——原型先前就有三種寫法。
//
// 不分頁的表格（設定頁、權限矩陣，正式後台有 14 個）傳 pagination: false。
import { icon } from './icons.js'
import { emptyRow, emptyState } from './states.js'
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
 * @param columns    [{ key, label, align, width, minWidth, className, header }]
 *                   width 用在「格式固定」的欄位（日期時間、UID、金額、狀態）——
 *                   內容長度本來就可預期，給了寬度整欄才不會隨資料忽寬忽窄。
 *                   minWidth 用在「長度不可控」的欄位（名稱、帳號、備註、IP）——
 *                   只給下限、不給上限，讓版面流自己決定要多寬。判準見「表格 Table」。
 *                   header 是表頭的原始 HTML（批量選單、排序鈕），省略時用逸出後的 label
 * @param rows       資料列，每筆是物件；值可以是 HTML 字串。保留鍵 rowAttrs 會原樣輸出到 <tr> 上。
 * @param page       目前頁（1 起算）
 * @param pageSize   每頁筆數
 * @param total      總筆數；省略時用 rows.length
 * @param pagination false 代表不分頁（設定頁、權限矩陣）
 * @param empty      沒有資料時的標題，版面沿用「載入與空狀態」
 * @param foot       合計列 { label, values: { 欄位key: 值 } }。正式後台 7 個報表頁有這一列，
 *                   由元件統一畫：標籤欄從第一欄跨到第一個有值的欄位之前，且只有它靠左。
 * @param groups     表頭上方的分組列 [{ label, span }]，欄位多到要分群時用（風控審核的
 *                   玩家信息／轉點資訊／設備資訊）。span 的總和必須等於欄數。
 * @param scroll     欄位寬度總和超過容器時的橫向捲動：傳 min-width 字串（例如 '2430px'）。
 *                   捲動容器本身可聚焦，鍵盤才捲得動。
 * @param caption    給報讀器的表格說明，視覺上隱藏。
 *
 * 欄位層級另有 sticky: 'right'，把操作欄釘在右邊（對應 CustomTable 的 fixed="right"）。
 */
export function dataTable({ name = 'table', columns, rows, page = 1, pageSize = PAGE_SIZES[1], total, pagination = true, empty = '無資料', foot, groups, scroll, caption }) {
  const count = total ?? rows.length
  // align 與 width 要合併成同一個 style；先前是兩個 style 屬性，後面那個會被瀏覽器直接丟掉，
  // 所以同時指定 align 與 width 時 width 從來沒生效過。
  const style = c => {
    const parts = [c.align && `text-align:${c.align}`, c.width && `width:${c.width}`, c.minWidth && `min-width:${c.minWidth}`].filter(Boolean)
    return parts.length ? ` style="${parts.join(';')}"` : ''
  }
  // 固定欄與個別欄的 class 合併成一個 class 屬性：兩個 class 屬性瀏覽器只認第一個。
  const cls = c => {
    const names = [c.className, c.sticky === 'right' && 'is-sticky-right'].filter(Boolean)
    return names.length ? ` class="${esc(names.join(' '))}"` : ''
  }
  // 表頭只吃寬度，不吃 align：欄名一律置中（unified-table-system 定的），
  // c.align 說的是「這一欄的內容」怎麼對齊——金額靠右、帳號靠左都是為了讀數字與
  // 比對字串，欄名沒有這個需求。先前兩者共用同一個 style()，欄名就跟著內容跑掉，
  // 一整排表頭出現置中、靠左、靠右三種，看起來像沒對齊。
  const headStyle = c => {
    const parts = [c.width && `width:${c.width}`, c.minWidth && `min-width:${c.minWidth}`].filter(Boolean)
    return parts.length ? ` style="${parts.join(';')}"` : ''
  }
  // header 讓欄位表頭放得下控制項（批量選單、排序鈕）；沒給就是逸出後的 label。
  const head = columns.map(c => `<th scope="col"${cls(c)}${headStyle(c)}>${c.header ?? esc(c.label)}</th>`).join('')
  // 分組列在欄名列之上；最後一欄若是固定欄，分組列的那一格也要一起固定，否則橫捲時會錯開。
  const groupRow = groups?.length
    ? `<tr class="data-table-groups">${groups.map((g, index) => {
        const sticky = index === groups.length - 1 && columns[columns.length - 1]?.sticky === 'right'
        return `<th scope="colgroup" colspan="${g.span}"${sticky ? ' class="is-sticky-right"' : ''}>${esc(g.label)}</th>`
      }).join('')}</tr>`
    : ''
  // 列上的識別屬性（row.rowAttrs）讓頁面找得回某一筆：審核頁要在整列上掛 data-risk-row。
  // 它不是欄位，所以用保留字 rowAttrs，不會和任何 column.key 撞名。
  const body = rows.length
    ? rows.map(row => `<tr${row.rowAttrs ? ' ' + row.rowAttrs : ''}>${columns.map(c => `<td data-label="${esc(c.label)}"${cls(c)}${c.align ? ` style="text-align:${c.align}"` : ''}>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('')
    // 空狀態不自己畫，沿用「載入與空狀態」的區塊——先前這裡是一行純文字，
    // 跟規範頁示範的圖示＋文字長得不一樣，同一個空狀態站上有兩種版面。
    : emptyRow(columns.length, { title: empty })

  // 合計列只在有資料時出現：空表格下面掛一條「合計 0」沒有意義，而且會把空狀態擠掉。
  const footRow = foot && rows.length ? (() => {
    const first = columns.findIndex(c => foot.values?.[c.key] != null)
    const span = first < 0 ? columns.length : first
    const label = `<td colspan="${Math.max(1, span)}" class="data-table-foot-label">${foot.label ?? '合計'}</td>`
    const rest = columns.slice(Math.max(1, span)).map(c =>
      `<td data-label="${esc(c.label)}"${cls(c)}${c.align ? ` style="text-align:${c.align}"` : ''}>${foot.values?.[c.key] ?? ''}</td>`).join('')
    return `<tfoot><tr>${label}${rest}</tr></tfoot>`
  })() : ''

  const wrap = scroll
    ? `<div class="table-wrap data-table-scroll" tabindex="0" role="region" aria-label="${esc(caption ?? name)}，可水平捲動">`
    : '<div class="table-wrap">'

  return `<div class="data-table" data-table-root="${esc(name)}">
    ${wrap}
      <table class="data-table-grid"${scroll ? ` style="min-width:${esc(scroll)}"` : ''}>
        ${caption ? `<caption>${esc(caption)}</caption>` : ''}
        <thead>${groupRow}<tr>${head}</tr></thead>
        <tbody>${body}</tbody>
        ${footRow}
      </table>
    </div>
    ${pagination ? paginationBar({ name, page, pageSize, total: count }) : ''}
  </div>`
}

/**
 * 重繪時保住表格的橫向捲動位置。
 *
 * 重繪一律是把容器的 innerHTML／outerHTML 換掉，新的 .data-table-scroll 是一個全新的
 * 元素，scrollLeft 從 0 開始——所以橫捲到第七欄時按下任何一顆按鈕（開選單、勾一列、
 * 切開關、套用批量），表格都會彈回最左邊，使用者得重新捲回去才找得到剛才那一欄。
 *
 * 位置以表格的 name（data-table-root）為鍵記住，所以同一頁有多張表也不會對錯。
 * 重繪前後容器本身被換掉沒關係，查的是重繪後文件裡的那一個。
 *
 * 用法：keepTableScroll(() => { host.innerHTML = table() })
 */
export function keepTableScroll(render) {
  const boxes = () => document.querySelectorAll('.data-table-scroll')
  const nameOf = box => box.closest('[data-table-root]')?.dataset.tableRoot
  const saved = new Map()
  for (const box of boxes()) {
    const name = nameOf(box)
    if (name && box.scrollLeft) saved.set(name, box.scrollLeft)
  }
  render()
  if (!saved.size) return
  for (const box of boxes()) {
    const name = nameOf(box)
    if (saved.has(name)) box.scrollLeft = saved.get(name)
  }
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

/**
 * 同一份資料的卡片版。手機上欄位多到讀不動時用它取代表格。
 *
 * 什麼時候用卡片、什麼時候維持表格，判準寫在「表格 Table」規範頁：
 * 一句話是「這一列要用來讀，還是用來比」——要讀完一整筆才能決定的用卡片，
 * 要跨列比同一個欄位（報表、合計、勾選批量）的維持表格。
 *
 * @param name  識別字串，與同一份資料的表格用同一個
 * @param rows  [{ title, subtitle, status, meta: [[標籤, 值], …], actions, attrs }]
 *              title 是這一筆的主識別（帳號、單號），status 放狀態標籤，
 *              meta 兩欄一組，actions 放操作，attrs 原樣輸出到 <li> 上
 * @param empty 沒有資料時的標題，與表格用同一組文案
 */
export function dataCards({ name = 'table', rows, empty = '無資料' }) {
  if (!rows.length) return `<div class="data-cards is-empty" data-cards-root="${esc(name)}">${emptyState({ title: empty })}</div>`
  const card = row => `<li class="data-card"${row.attrs ? ' ' + row.attrs : ''}>
    <div class="data-card-head">
      <div class="data-card-title">${row.title ?? ''}${row.subtitle ? `<small>${row.subtitle}</small>` : ''}</div>
      ${row.status ?? ''}
    </div>
    ${row.meta?.length ? `<dl class="data-card-meta">${row.meta.map(([label, value]) =>
      `<div><dt>${esc(label)}</dt><dd>${value ?? ''}</dd></div>`).join('')}</dl>` : ''}
    ${row.actions ? `<div class="data-card-actions">${row.actions}</div>` : ''}
  </li>`
  return `<ul class="data-cards" data-cards-root="${esc(name)}">${rows.map(card).join('')}</ul>`
}
