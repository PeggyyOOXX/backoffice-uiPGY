import './modal-system.css'
let serial=0
export function prepareModal(dialog){
 if(dialog.dataset.modalReady)return dialog
 dialog.dataset.modalReady='true';dialog.classList.add('bo-modal')
 const frame=dialog.querySelector(':scope > form, :scope > aside')||dialog
 if(frame!==dialog)frame.classList.add('bo-modal-frame')
 const header=frame.querySelector(':scope > header, :scope > .drawer-head');header.classList.add('bo-modal-header')
 const title=header.querySelector('h2');title.id ||= `bo-modal-title-${++serial}`;dialog.setAttribute('aria-labelledby',title.id)
 let close=header.querySelector('button');if(!close){close=document.createElement('button');header.append(close)}
 close.type='button';close.className='bo-modal-close';close.setAttribute('aria-label','關閉彈窗');close.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';close.onclick=()=>dialog.close()
 const body=frame.querySelector(':scope > .settings-snapshot-body, :scope > .activity-type-dialog-body, :scope > .drawer-body, :scope > .bo-modal-body');body.classList.add('bo-modal-body')
 let footer=frame.querySelector(':scope > footer, :scope > .drawer-foot');if(!footer){footer=document.createElement('footer');const actions=body.querySelector('.filter-actions');if(actions){footer.append(...actions.children);actions.remove()}frame.append(footer)}footer.classList.add('bo-modal-footer')
 dialog.querySelectorAll('input.control, textarea.control, select.control').forEach(input=>input.classList.add('guide-input'))
 dialog.querySelectorAll('input[required],textarea[required],select[required]').forEach(input=>{const label=input.closest('label')||dialog.querySelector('label[for="'+input.id+'"]');if(label&&!label.querySelector('.required-mark')){const mark=document.createElement('span');mark.className='required-mark';mark.textContent=' *';mark.setAttribute('aria-hidden','true');label.insertBefore(mark,input)}})
 dialog.querySelectorAll('select').forEach(input=>input.classList.add('guide-select'))
 footer.querySelectorAll('button').forEach(button=>{if(!button.classList.contains('semantic-btn')){const primary=button.classList.contains('primary');button.classList.remove('primary','secondary');button.classList.add('semantic-btn',primary?(button.id==='reviewBtn'?'btn-record':'btn-search'):'btn-neutral')}})
 dialog.addEventListener('close',()=>dialog._modalTrigger?.focus())
 return dialog
}
window.prepareModal=prepareModal
window.showStandardModal=dialog=>{prepareModal(dialog);dialog._modalTrigger=document.activeElement;if(!dialog.open)dialog.showModal()}
document.querySelectorAll('dialog.overlay').forEach(prepareModal)
window.modalExamples=()=>`<section class="component-example"><h2>彈窗</h2><div class="card modal-example-card"><p>統一標題綠線、右上角關閉按鈕、可捲動內容與靠右的底部操作列。</p><div class="modal-example-actions"><button type="button" class="semantic-btn btn-record" data-promotion-snapshot="example" aria-haspopup="dialog">唯讀檢視</button><button type="button" class="semantic-btn btn-add" data-modal-example="form">表單彈窗</button><button type="button" class="semantic-btn btn-danger" data-modal-example="delete">刪除確認</button></div></div></section>`
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-modal-example]');if(!trigger)return;const kind=trigger.dataset.modalExample;const dialog=document.createElement('dialog');dialog.innerHTML=`<form><header><h2>${kind==='view'?'活動內容快照':kind==='form'?'新增活動':'刪除活動'}</h2></header><div class="bo-modal-body">${kind==='view'?'<h3>八月會員回饋</h3><dl class="modal-example-details"><div><dt>活動類型</dt><dd>會員回饋</dd></div><div><dt>活動期間</dt><dd>2026-08-01 ～ 2026-08-31</dd></div></dl>':kind==='form'?'<div class="activity-type-fields"><label>活動名稱<input class="guide-input" required maxlength="80" placeholder="請輸入活動名稱"></label><label>活動類型<select class="guide-input guide-select"><option>會員回饋</option><option>存款優惠</option></select></label><div class="promotion-date-field"><label>活動期間</label><div class="date-range-host" data-date-range data-empty="true"></div></div><label>備註<textarea class="guide-input guide-textarea" placeholder="請輸入備註"></textarea></label></div>':'<p>確定刪除「八月會員回饋」？</p><p>刪除後將無法復原。</p>'}</div><footer><button type="button" class="semantic-btn btn-neutral" data-example-close>${kind==='view'?'關閉':'取消'}</button>${kind==='view'?'':`<button type="submit" class="semantic-btn ${kind==='delete'?'btn-danger':'btn-search'}">${kind==='delete'?'確認刪除':'儲存'}</button>`}</footer></form>`;prepareModal(dialog);dialog.querySelector('[data-example-close]').onclick=()=>dialog.close();dialog.querySelector('form').onsubmit=event=>{event.preventDefault();dialog.close()};dialog.addEventListener('close',()=>{dialog.remove();trigger.focus()},{once:true});document.body.append(dialog);dialog.showModal()})
