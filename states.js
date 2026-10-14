// 移植：el-empty（空／查無，用 #empty slot 才放得下圖示與操作）、v-loading（遮罩）、el-skeleton（骨架）、el-result（頁面層級的失敗／無權限）。詳見 ELEMENT-PLUS-MAPPING.md
import './states.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 非資料狀態的文案。個別頁面不得自己改寫。
// 「本來就沒有資料」與「篩選後沒撈到」共用同一個 empty，文案與正式後台的
// i18n key no_data（繁中為「無資料」）一致。filtered 保留為 empty 的別名。
// error 的文案不在前端寫：錯誤碼與敘述都來自後端的固定翻譯字典，直接照 toast 輸出。
// 這裡只留後端連訊息都沒回時的最後退路，與 useApi 最終分支的字串相同。
export const STATE_COPY = {
  empty: { title: '無資料', text: '' },
  error: { title: 'API request failed', text: '' },
}
STATE_COPY.filtered = STATE_COPY.empty

const ICONS = {
  empty: '<rect x="7" y="5" width="22" height="26" rx="3"/><path d="M12 13h12M12 19h12M12 25h7"/>',
  error: '<circle cx="18" cy="18" r="13"/><path d="M18 11v9M18 25h.01"/>',
}


const icon = kind => `<svg class="bo-state-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`

// 無資料與載入失敗共用同一個版面：圖示加一行文字。
// 狀態區只說明「現在是什麼狀況、為什麼」，不放任何操作按鈕 ——
// 重新查詢、清除條件、新增、重新載入一律放在表格外的列表工具列。
export function emptyState({ kind = 'empty', title, text } = {}) {
  // filtered 是 empty 的別名，正規化成同一個 kind，class 與文案都只有一種。
  if (kind === 'filtered' || !STATE_COPY[kind]) kind = 'empty'
  const copy = STATE_COPY[kind]
  const body = text ?? copy.text
  return `<div class="bo-state bo-state-${esc(kind)}" role="status">
    ${icon(kind)}
    <p class="bo-state-title">${esc(title ?? copy.title)}</p>
    ${body ? `<p class="bo-state-text">${esc(body)}</p>` : ''}
  </div>`
}

// 表格內的空狀態：同一個版面放進一列，撐滿整個表寬。
export const emptyRow = (colspan, options) => `<tr class="bo-state-row"><td colspan="${Number(colspan) || 1}">${emptyState(options)}</td></tr>`

// 載入失敗。直接沿用 toast 的字串：錯誤碼 + 敘述，一行，不拆成標題與說明 ——
// 兩者都來自後端的固定翻譯字典（請求帶 Language 標頭，敘述已是當前語系），
// 前端不另外寫文案，字典改了畫面就跟著改。
//
// 只收 code 與 message。不得傳 ApiErrorResponse 的 debug —— 那是未定型的開發用欄位，
// 可能帶出內部路徑或查詢內容，而表格的錯誤會一直留在畫面上、會被截圖轉傳，
// 風險與幾秒就消失的 toast 不同。字串一律轉義後輸出，不走 innerHTML 的原樣插入。
export function errorState({ code = '', message = '' } = {}) {
  const line = [code, message].filter(Boolean).join(' ')
  return emptyState({ kind: 'error', title: line || STATE_COPY.error.title })
}

// 首次載入、還沒有任何資料可留在畫面上時用骨架；它只是版面佔位，不帶語意。
export function skeletonTable({ rows = 5, cols = 5, head = true } = {}) {
  const count = Math.max(1, Number(cols) || 1)
  const row = (modifier = '') => `<div class="bo-skeleton-row${modifier}">${Array.from({ length: count }, () => '<span></span>').join('')}</div>`
  return `<div class="bo-skeleton" role="status" aria-label="載入中" style="--skeleton-cols:${count}">
    ${head ? row(' is-head') : ''}
    ${Array.from({ length: Math.max(1, Number(rows) || 1) }, () => row()).join('')}
  </div>`
}

// 重新查詢時用遮罩：舊資料留在原地變淡，不讓版面高度塌掉又彈回來。
export const loadingVeil = (text = '載入中') => `<div class="bo-veil" role="status"><span class="bo-spinner" aria-hidden="true"></span><span>${esc(text)}</span></div>`

export const loadingWrap = (content, { loading = false, text = '載入中' } = {}) =>
  `<div class="bo-loading${loading ? ' is-loading' : ''}">${content}${loading ? loadingVeil(text) : ''}</div>`
