import { prepareModal } from './modal-system.js'
import './risk-audit.css'

// Source: backoffice/src/views/riskControlWithdrawalAudit/index.vue.
// Same field groups and single-order workflow; all data below is local demo data.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const money = value => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const action = (label, kind, name, extra = '') => `<button type="button" class="semantic-btn ${kind}" data-risk-action="${name}" ${extra}>${label}</button>`
const link = (label, name, id) => `<a href="#" class="risk-link" data-risk-action="${name}" data-id="${id}">${esc(label)}</a>`
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const defaults = () => ({ branch:'101 BEST', start:`${today()} 00:00:00`, end:`${today()} 23:59:59`, uid:'', agent:'', status:'全部審核狀態', count:'全部次數', order:'', min:'', max:'', account:'', ip:'', device:'' })
const people = [['david_lin','David Lin','1009774'],['noah_wang','Noah Wang','1009214'],['mina_wu','Mina Wu','1009652'],['ava_chen','Ava Chen','1009821'],['emma_tsai','Emma Tsai','1009328'],['lucas_h','Lucas Huang','1009541']]
const rows = Array.from({ length: 14 }, (_, i) => {
  const [account, name, uid] = people[i % people.length], amount = [120000,82500,46000,28600,18000,6400][i % 6]
  const channel = i % 3 === 0 ? 'bank' : i % 3 === 1 ? 'wallet' : 'crypto'
  const fee = i % 4 === 0 ? 300 : 0, operator = i === 1 ? 'Peggy' : i === 2 ? 'Alex' : ''
  return { id:`WD-${today().slice(2).replaceAll('-','')}-${8821-i}`, branch:'101 BEST', account, name, uid,
    time:`${today()} ${String(14-Math.floor(i/4)).padStart(2,'0')}:${String(50-i%4*10).padStart(2,'0')}:00`,
    registered:'2026-06-18 10:24:36', agent:i%2?'agent_10188':'agent_20861', level:`LV${i%3+1}`, channel,
    bank:channel==='bank'?'示範銀行':channel==='wallet'?'E-wallet':'USDT', amount, fee, serviceFee:30,
    before:amount+5680, after:5680, net:amount-fee-30, currency:channel==='crypto'?'USDT':'TWD', rate:1,
    count:i%4+1, audit:fee?'不通過':'通過', operator, completed:'',
    ip:`203.0.113.${21+i}`, fingerprint:`demo-fp-${String(i+1).padStart(4,'0')}`, browser:i%2?'Safari 18 / iOS 18':'Chrome 128 / Windows 11',
    bankAccount:`0098123400${String(i).padStart(2,'0')}`, walletAccount:`wallet_demo_${i+1}`, address:`T_DEMO_WALLET_ADDRESS_${i+1}`,
    firstName:name.split(' ')[0], lastName:name.split(' ').at(-1), phone:`09000000${String(i).padStart(2,'0')}`,
    thirdParty:i%2?`DEMO-${99001+i}`:'—', remark:'', frontendRemark:'' }
})
let draft = defaults(), applied = {...draft}, page = 1, pageSize = 10, feedback = '', autoRefresh = false, countdown = 15, timer = null
const rowState = row => row.operator ? '處理中' : '待審核'
const accountNo = row => row.channel === 'bank' ? row.bankAccount : row.channel === 'wallet' ? row.walletAccount : row.address
const contains = (haystack, needle) => String(haystack).toLowerCase().includes(String(needle).trim().toLowerCase())
function filtered() {
  return rows.filter(row => !row.completed && row.branch === applied.branch &&
    contains(`${row.uid} ${row.account}`, applied.uid) && contains(row.agent, applied.agent) && contains(row.id, applied.order) &&
    (applied.status==='全部審核狀態'||rowState(row)===applied.status) &&
    (applied.count==='全部次數'||row.count===(applied.count==='首轉點'?1:2)) &&
    (applied.min===''||row.amount>=Number(applied.min)) && (applied.max===''||row.amount<=Number(applied.max)) &&
    (!applied.account||accountNo(row)===applied.account.trim()) && (!applied.ip||row.ip===applied.ip.trim()) &&
    contains(row.fingerprint, applied.device) && (!applied.start||row.time>=applied.start) && (!applied.end||row.time<=applied.end))
}
const input = (key, label, placeholder='', extra='') => `<div class="filter-field"><label for="risk-filter-${key}">${label}</label><input id="risk-filter-${key}" class="control" name="${key}" value="${esc(draft[key])}" placeholder="${esc(placeholder)}" ${extra}></div>`
const select = (key, label, options) => `<div class="filter-field"><label for="risk-filter-${key}">${label}</label><select id="risk-filter-${key}" class="control guide-select" name="${key}" aria-label="${label}">${options.map(value=>`<option ${draft[key]===value?'selected':''}>${esc(value)}</option>`).join('')}</select></div>`
function searchMarkup() {
  return `<button class="mobile-member-search-toggle" type="button" data-risk-action="toggle-search" aria-expanded="false" aria-controls="risk-search-panel"><span>⌕ 搜尋條件</span><span class="search-toggle-arrow" aria-hidden="true"></span></button><form id="risk-search-panel" class="source-filter card risk-search" data-risk-search><p class="settings-error">※可查詢60天內紀錄</p>
    <div class="source-filter-grid">
      ${select('branch','平台名稱',['101 BEST','DEMO03'])}
      <div class="filter-field filter-span-2"><label id="risk-date-label">申請時間</label><div class="date-range-host" data-date-range data-past-year="true" data-start="${esc(draft.start)}" data-end="${esc(draft.end)}" ${!draft.start?'data-empty="true"':''} aria-labelledby="risk-date-label"></div></div>
      ${input('uid','UID／會員帳號','請輸入 UID／帳號')}${input('agent','上級代理','代理帳號','maxlength="20"')}
      ${select('status','審核狀態',['全部審核狀態','待審核','處理中'])}
      ${select('count','轉點次數',['全部次數','首轉點','次轉點'])}
      ${input('order','轉點 ID','請輸入轉點 ID','maxlength="100"')}
      <div class="filter-field filter-span-2 amount-range-field"><label for="risk-min">轉點金額</label><div class="amount-range-control"><input id="risk-min" class="control amount" name="min" type="number" min="0" step="0.01" value="${esc(draft.min)}" placeholder="最低" aria-label="最低轉點金額"><span>～</span><input class="control amount" name="max" type="number" min="0" step="0.01" value="${esc(draft.max)}" placeholder="最高" aria-label="最高轉點金額"></div></div>
      ${input('account','轉點帳號','請輸入帳號／地址')}${input('ip','IP 地址','請輸入 IP 地址')}${input('device','設備指紋','請輸入設備指紋')}
      <div class="source-filter-actions">${action('<span>↺</span> 重設','btn-neutral','reset')}<button type="submit" class="semantic-btn btn-search"><span>⌕</span> 搜尋</button></div>
    </div>
    <p class="settings-error" data-risk-search-error role="alert"></p>
    <div class="settings-row risk-refresh-row"><button id="risk-refresh-label-control" type="button" class="standard-switch" role="switch" aria-labelledby="risk-refresh-label" aria-checked="${autoRefresh}" data-risk-action="auto"></button><div><label for="risk-refresh-label-control" id="risk-refresh-label">自動刷新</label><span class="risk-refresh-count" data-risk-countdown ${!autoRefresh?'hidden':''}>${countdown} 秒後刷新</span></div></div>
  </form>`
}
function controls(row) {
  if (row.operator && row.operator!=='Peggy') return `<span>${esc(row.operator)} 處理中</span>`
  return `${row.operator?`<span class="risk-operator">${esc(row.operator)} 處理中</span>`:''}<div class="workflow-actions">${action('通過','btn-edit','approve',`data-id="${row.id}"`)}${action('不通過','btn-danger','reject',`data-id="${row.id}"`)}</div>`
}
const cell = (label, value) => `<div><label>${label}</label><strong>${value}</strong></div>`
function cardsMarkup(list) {
  if (!list.length) return '<div class="member-mobile-only risk-mobile-list"><p class="risk-empty-card">沒有符合條件的轉點申請，請調整搜尋條件。</p></div>'
  return `<div class="member-mobile-only risk-mobile-list">${list.map(row=>`<article class="mobile-card" data-risk-card="${row.id}">
    <div class="member-card-head"><div>${link(row.id,'details',row.id)}<small>${row.time}</small></div><span class="badge ${row.operator?'active-b':'pending-b'}">${rowState(row)}</span></div>
    <div class="mobile-meta">
      ${cell('UID／會員帳號',`${link(row.uid,'member',row.id)}<br>${esc(row.account)}`)}
      ${cell('真實姓名／上級代理',`${esc(row.name)}<br>${esc(row.agent)}`)}
      ${cell('層級／轉點渠道',`<span class="risk-level risk-level-${row.level.slice(-1)}"></span>${row.level}<br>${esc(row.bank)}`)}
      ${cell('轉點金額',money(row.amount))}
      ${cell('稽核／扣除行政費',`<span class="badge ${row.audit==='通過'?'active-b':'risk-b'}">${row.audit}</span> ${link(money(row.fee),'audit',row.id)}`)}
      ${cell('異動前／後餘額',`${money(row.before)}<br>${money(row.after)}`)}
      ${cell('IP 地址',esc(row.ip))}
      ${cell('設備指紋',esc(row.fingerprint))}
      ${cell('瀏覽器與版本',esc(row.browser))}
    </div>
    <div class="mobile-card-bottom">${controls(row)}</div>
  </article>`).join('')}</div>`
}
function listMarkup() {
  const list=filtered(), pages=Math.max(1,Math.ceil(list.length/pageSize)); page=Math.min(page,pages)
  const current=list.slice((page-1)*pageSize,page*pageSize)
  return `<div class="card member-data-card risk-list-card" data-risk-list>
    <p class="workflow-feedback" role="status">${esc(feedback)}</p>
    <div class="risk-table-scroll" tabindex="0" role="region" aria-label="轉點審核列表，可水平捲動"><table class="risk-table"><caption class="risk-sr-only">轉點審核－風控</caption>
      <colgroup>${[210,180,100,160,150,100,140,90,120,130,130,130,110,145,170,195,170].map(width=>`<col style="width:${width}px">`).join('')}</colgroup>
      <thead><tr><th colspan="7" scope="colgroup">玩家信息</th><th colspan="6" scope="colgroup">轉點資訊</th><th colspan="3" scope="colgroup">設備資訊</th><th class="risk-fixed" scope="colgroup">操作</th></tr><tr>${['轉點 ID','申請時間','UID','會員帳號／真實姓名','上級代理','層級','轉點渠道','稽核','扣除行政費','轉點金額','異動前餘額','異動後餘額','狀態','IP 地址','設備指紋','瀏覽器與版本','風控審核'].map((label,i)=>`<th scope="col" ${i===16?'class="risk-fixed"':''}>${label}</th>`).join('')}</tr></thead>
      <tbody>${current.map(row=>`<tr data-risk-row="${row.id}">
        <td>${link(row.id,'details',row.id)}</td><td>${row.time}</td><td>${link(row.uid,'member',row.id)}</td><td>${row.account}<br><span class="risk-secondary">${row.name}</span></td><td>${row.agent}</td><td><span class="risk-level risk-level-${row.level.slice(-1)}"></span>${row.level}</td><td>${row.bank}</td>
        <td><span class="badge ${row.audit==='通過'?'active-b':'risk-b'}">${row.audit}</span></td><td>${link(money(row.fee),'audit',row.id)}</td><td>${money(row.amount)}</td><td>${money(row.before)}</td><td>${money(row.after)}</td><td><span class="badge ${row.operator?'active-b':'pending-b'}">${rowState(row)}</span></td><td>${row.ip}</td><td>${row.fingerprint}</td><td>${row.browser}</td><td class="risk-fixed">${controls(row)}</td>
      </tr>`).join('')||'<tr><td colspan="17" class="risk-empty">沒有符合條件的轉點申請，請調整搜尋條件。</td></tr>'}</tbody></table></div>${cardsMarkup(current)}
    <div class="pagination"><span class="pagination-total">共 ${list.length} 筆</span><select class="page-size-select guide-select" data-risk-size aria-label="每頁筆數">${[10,20,50,100].map(n=>`<option value="${n}" ${pageSize===n?'selected':''}>${n} 筆／頁</option>`).join('')}</select><div class="pages">${pageButton('‹',page-1,page===1,'上一頁')}${Array.from({length:pages},(_,i)=>pageButton(i+1,i+1,false,`第 ${i+1} 頁`)).join('')}${pageButton('›',page+1,page===pages,'下一頁')}</div></div>
  </div>`
}
function pageButton(label,value,disabled,aria) { return `<button type="button" class="page-btn ${label===page?'active':''}" data-risk-page="${value}" ${label===page?'aria-current="page"':''} ${disabled?'disabled':''} aria-label="${aria}">${label}</button>` }
export function renderRiskAudit() {
  return `<section class="risk-audit-page" data-risk-page-root><h2>轉點審核－風控</h2>${searchMarkup()}${listMarkup()}</section>`
}
function redrawList() {
  const node=document.querySelector('[data-risk-list]'); if(!node)return
  const offset=node.querySelector('.risk-table-scroll')?.scrollLeft||0
  node.outerHTML=listMarkup(); document.querySelector('.risk-table-scroll').scrollLeft=offset
}
function readDraft() {
  const form=document.querySelector('[data-risk-search]'); if(!form)return
  const data=new FormData(form); for(const key of Object.keys(draft)) if(data.has(key))draft[key]=String(data.get(key)).trim()
  const host=form.querySelector('[data-date-range]'); draft.start=host.dataset.start||'';draft.end=host.dataset.end||''
}
function validate() {
  if (['min','max'].some(key=>draft[key]!==''&&(!Number.isFinite(Number(draft[key]))||Number(draft[key])<0))) return '轉點金額不得小於 0。'
  if(draft.min!==''&&draft.max!==''&&Number(draft.min)>Number(draft.max))return '最低金額不得大於最高金額。'
  if(draft.order && draft.order.length<3)return '轉點 ID 請至少輸入 3 個字元。'
  if(draft.agent && draft.agent.length<3)return '代理帳號請至少輸入 3 個字元。'
  if(draft.ip && !validIP(draft.ip))return '請輸入有效的 IP 地址。'
  if(draft.start&&draft.end){const span=new Date(draft.end.replace(' ','T'))-new Date(draft.start.replace(' ','T'));if(!Number.isFinite(span)||span<0||span>=90*86400000)return '申請時間請選擇不超過 90 天的有效區間。'}
  return ''
}
function validIP(value) {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return value.split('.').every(part=>Number(part)<=255)
  if(!value.includes(':'))return false
  try { return new URL(`http://[${value}]/`).hostname.length>0 } catch { return false }
}
function search(refresh=false) {
  readDraft(); const error=validate(); const node=document.querySelector('[data-risk-search-error]');if(node)node.textContent=error
  if(error)return false
  applied={...draft};page=1;feedback=refresh?'已刷新示範資料。':'';countdown=15;redrawList();return true
}
const fields = (title, pairs) => `<section class="risk-detail-section"><h3>${title}</h3><dl class="risk-detail-grid">${pairs.map(([label,value])=>`<div><dt>${label}</dt><dd>${value&&value.html?value.html:esc(value)}</dd></div>`).join('')}</dl></section>`
const stateBadge = value => ({ html:`<span class="badge ${value==='通過'?'active-b':'risk-b'}">${esc(value)}</span>` })
function personal(row) { return fields('個人信息',[['UID',row.uid],['玩家帳號',row.account],['玩家註冊時間',row.registered],['真實姓名',row.name],['會員層級',row.level]]) }
function detailMarkup(row, decision='') {
  const unit=value=>`${money(value)} ${row.currency}`
  const payment = row.channel==='bank' ? [['銀行卡姓名',row.name],['銀行名稱',row.bank],['帳號',row.bankAccount]] : row.channel==='wallet' ? [['E-wallet',row.bank],['名',row.firstName],['姓',row.lastName],['帳號',row.walletAccount],['手機號碼',row.phone]] : [['虛擬貨幣錢包','USDT'],['鏈','TRC20'],['地址',row.address]]
  return `${personal(row)}${fields('轉點細節',[
    ['轉點 ID',row.id],['第三方訂單號',row.thirdParty],['申請時間',row.time],['申請轉點金額',unit(row.amount)],['首轉點／次轉點',row.count===1?'是，首轉點':row.count===2?'是，次轉點':'否'],['審核狀態',decision?stateBadge(decision):row.completed||rowState(row)],['稽核',{html:`${stateBadge(row.audit).html}，扣除行政費 ${unit(row.fee)}`}],['手續費',unit(row.serviceFee)],['轉點淨額',unit(row.net)],['異動前餘額',unit(row.before)],['異動後餘額',unit(row.after)],['轉點渠道／幣種',`${row.channel==='bank'?'銀行卡':row.bank}／${row.currency}`],['匯率',row.rate]
  ])}<div class="risk-actual"><span>會員實收</span><strong>${unit(row.net)}</strong></div>${fields('轉點資訊',payment)}${fields('設備資訊',[['IP 地址',row.ip],['設備指紋',row.fingerprint],['瀏覽器與版本',row.browser]])}`
}
function openDrawer(title, body) {
  document.querySelector('#detailDrawerTitle').textContent=title
  document.querySelector('#detailBody').innerHTML=body
  document.querySelector('#detailOverlay .drawer-foot').innerHTML=action('關閉','btn-neutral','close-drawer')
  window.openDetailDrawer()
}
function drawer(row,memberOnly=false) {
  openDrawer(memberOnly?'會員詳情摘要':'轉點明細',memberOnly?personal(row):detailMarkup(row))
}
function dialog(title,body,footer='',submit=null,wide=false) {
  const trigger=document.activeElement, node=document.createElement('dialog')
  if(wide)node.classList.add('risk-wide-dialog')
  node.innerHTML=`<form><header><h2>${title}</h2></header><div class="bo-modal-body">${body}</div><footer>${action(submit?'取消':'關閉','btn-neutral','close-modal')}${footer}</footer></form>`
  prepareModal(node);node.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(submit)submit(node)})
  node.addEventListener('close',()=>{node.remove();if(trigger?.isConnected)trigger.focus();else document.querySelector('[data-risk-search] button[type="submit"]')?.focus()},{once:true})
  document.body.append(node);node.showModal();return node
}
function review(row,pass) {
  if(row.completed || (row.operator&&row.operator!=='Peggy'))return
  // The original page claims the order as soon as an operator opens the review.
  row.operator='Peggy';redrawList()
  const title=pass?'確認通過':'確認不通過'
  dialog(title,`<p class="settings-error risk-confirm-note">請再次確認以下轉點資訊</p>${detailMarkup(row,pass?'通過':'不通過')}<div class="risk-review-notes">${[['remark','後台備註'],['frontendRemark','前台備註']].map(([key,label])=>`<label>${label}<textarea class="guide-input guide-textarea" name="${key}" rows="3" maxlength="200" placeholder="請輸入${label}"></textarea><span class="risk-note-count" data-note-count="${key}">0 / 200</span></label>`).join('')}</div>`,
    `<button type="submit" class="semantic-btn ${pass?'btn-search':'btn-danger'}">${pass?'通過':'不通過'}</button>`, node=>{
      row.remark=node.querySelector('[name="remark"]').value.trim();row.frontendRemark=node.querySelector('[name="frontendRemark"]').value.trim();row.completed=pass?'通過':'不通過'
      feedback=`${row.id} 已${pass?'通過風控審核':'審核不通過'}。`;redrawList();node.close()
    },true)
}
function auditDetails(row) {
  // Read-only, so it uses the drawer like the other detail views. One card per audit
  // record instead of the original ten-column table, which cannot fit the drawer width.
  const entries = [
    { type:'存款', time:`${today()} 09:00:00`, amount:10000, rate:'100%', multiple:'—', required:10000, actual:row.fee?8200:10000, feeRate:'3%', fee:row.fee, status:row.fee?'不通過':'通過' },
    { type:'優惠', time:`${today()} 09:05:00`, amount:500, rate:'—', multiple:'5', required:2500, actual:2500, feeRate:'0%', fee:0, status:'通過' },
  ]
  const pairs = entry => [['金額',money(entry.amount)],['稽核%',entry.rate],['稽核倍數',entry.multiple],['行政費%',entry.feeRate],['要求有效投注',money(entry.required)],['實際有效投注',money(entry.actual)]]
  const card = entry => `<section class="risk-audit-entry">
    <header><div><h3>${esc(entry.type)}</h3><span class="risk-audit-time">${entry.time}</span></div><span class="badge ${entry.status==='通過'?'active-b':'risk-b'}">${entry.status}</span></header>
    <dl class="risk-detail-grid">${pairs(entry).map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
    <p class="risk-audit-deduction"><span>扣除額</span><strong>${money(entry.fee)}</strong></p>
  </section>`
  openDrawer('稽核詳情', `<div class="risk-actual"><span>總扣除行政費</span><strong>${money(row.fee)}</strong></div>${entries.map(card).join('')}`)
}
function stopTimer() { if(timer)clearInterval(timer);timer=null }
function startTimer() {
  stopTimer();countdown=15
  timer=setInterval(()=>{
    if(!document.querySelector('[data-risk-page-root]')){stopTimer();autoRefresh=false;return}
    // Avoid replacing the underlying list while an operator reviews a dialog.
    if(document.querySelector('dialog[open]')||document.hidden)return
    if(--countdown<=0){search(true);countdown=15}
    const label=document.querySelector('[data-risk-countdown]');if(label)label.textContent=`${countdown} 秒後刷新`
  },1000)
}
document.addEventListener('submit',event=>{if(event.target.matches('[data-risk-search]')){event.preventDefault();search()}})
document.addEventListener('input',event=>{
  const input=event.target
  if(input.closest('[data-risk-search]')&&input.name in draft)draft[input.name]=input.value
  if(input.matches('.risk-review-notes textarea'))input.parentElement.querySelector('[data-note-count]').textContent=`${input.value.length} / 200`
})
document.addEventListener('change',event=>{
  const input=event.target
  if(input.closest('[data-risk-search]')&&input.name in draft)draft[input.name]=input.value
  if(input.matches('[data-risk-size]')){pageSize=Number(input.value);page=1;redrawList()}
})
document.addEventListener('click',event=>{
  const pager=event.target.closest('[data-risk-page]');if(pager){page=Number(pager.dataset.riskPage);redrawList();return}
  const target=event.target.closest('[data-risk-action]');if(!target)return
  event.preventDefault();const name=target.dataset.riskAction,row=rows.find(row=>row.id===target.dataset.id)
  if(name==='toggle-search'){const panel=document.querySelector('[data-risk-search]');const open=panel.classList.toggle('mobile-open');target.classList.toggle('is-open',open);target.setAttribute('aria-expanded',String(open));return}
  if(name==='reset'){const open=document.querySelector('[data-risk-search]').classList.contains('mobile-open');draft=defaults();applied={...draft};page=1;feedback='';document.querySelector('[data-risk-page-root]').outerHTML=renderRiskAudit();if(open)document.querySelector('[data-risk-action="toggle-search"]').click();return}
  if(name==='auto'){autoRefresh=!autoRefresh;target.setAttribute('aria-checked',String(autoRefresh));const label=document.querySelector('[data-risk-countdown]');label.hidden=!autoRefresh;label.textContent='15 秒後刷新';autoRefresh?startTimer():stopTimer();return}
  if(name==='close-drawer'){window.closeDetailDrawer();return}
  if(name==='close-modal'){target.closest('dialog').close();return}
  if(!row)return
  if(name==='details')drawer(row)
  if(name==='member')drawer(row,true)
  if(name==='audit')auditDetails(row)
  if(name==='approve'||name==='reject')review(row,name==='approve')
})
new MutationObserver(()=>{if(!document.querySelector('[data-risk-page-root]')&&timer){stopTimer();autoRefresh=false}}).observe(document.querySelector('.page'),{childList:true,subtree:true})
