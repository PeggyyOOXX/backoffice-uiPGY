// 移植：el-table-column 的 sortable 與 @sort-change。EP 同為雙箭頭三態，但顏色與尺寸需覆寫。詳見 ELEMENT-PLUS-MAPPING.md
﻿import './table-sort.css'
import { on } from './delegate.js'
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = ["[data-sort-demo]"]
const listen = (type, handler, capture = false) => on(type, handler, { owner: 'table-sort', claims: OWNED, capture })

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const nextSort=state=>state==='none'?'ascending':state==='ascending'?'descending':'none'
export function tableSortButton(label,state='none',attributes=''){const next=nextSort(state);return `<button type="button" class="table-sort-control" data-sort-state="${state}" ${attributes} aria-label="${escape(label)}：${next==='ascending'?'切換為升冪':next==='descending'?'切換為降冪':'清除排序'}" title="${state==='none'?'未排序':state==='ascending'?'升冪':'降冪'}"><svg width="12" height="18" viewBox="0 0 12 18" aria-hidden="true"><path class="sort-up" d="M6 2 11 7H1Z"/><path class="sort-down" d="m6 16 5-5H1Z"/></svg></button>`}
window.tableSortExamples=()=>`<section class="component-example"><h2>表頭排序</h2><div class="card table-sort-example"><p>欄名與排序控制分開；點擊箭頭依序切換未排序、升冪、降冪。可使用 Tab 聚焦、Enter 或空白鍵操作。</p><div class="table-sort-states">${[['none','未排序'],['ascending','升冪'],['descending','降冪']].map(([state,label])=>`<div><small>${label}（可操作）</small><table><thead><tr><th aria-sort="${state}"><span class="table-sort-heading"><span>申請金額</span>${tableSortButton('申請金額',state,'data-sort-demo')}</span></th></tr></thead></table></div>`).join('')}<div><small>停用</small><table><thead><tr><th aria-sort="none"><span class="table-sort-heading"><span>申請金額</span>${tableSortButton('申請金額','none','disabled')}</span></th></tr></thead></table></div></div><p>透明底、無外框；灰色為未啟用方向，主題綠 #1596AD 標示目前方向。桌面點擊範圍 32 × 34 px，觸控裝置 44 × 44 px。</p></div></section>`
listen('click',event=>{const button=event.target.closest('[data-sort-demo]');if(!button)return;const state=nextSort(button.dataset.sortState),cell=button.closest('th');cell.setAttribute('aria-sort',state);button.outerHTML=tableSortButton('申請金額',state,'data-sort-demo');cell.querySelector('button').focus()})
