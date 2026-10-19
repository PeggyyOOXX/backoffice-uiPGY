// 兩個組合範例的動線回歸：node workflow-check.cjs
//
// 「角色權限」（舊複雜設定）與「轉點審核－風控」（舊審核操作）都是改寫過的頁面，
// 版面換成共用元件之後，真正要守住的是流程：權限的父子連動、審核的認領與自動刷新。
const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<main class="page"></main><div id="detailOverlay"><h2 id="detailDrawerTitle"></h2><div id="detailBody"></div><div class="drawer-foot"></div></div>',{runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
const intervals=new Map();let timerId=0;
w.setInterval=fn=>{intervals.set(++timerId,fn);return timerId};w.clearInterval=id=>intervals.delete(id);
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
w.openDetailDrawer=()=>d.querySelector('#detailOverlay').classList.add('open');
w.closeDetailDrawer=()=>d.querySelector('#detailOverlay').classList.remove('open');
const ON='const on=window.__on;';
const ICON='const icon=window.icon;';
const strip=s=>s.replace(/^import .*$/gm,'').replace(/^export /gm,'');
w.eval(strip(fs.readFileSync('delegate.js','utf8'))+';window.__on=on');
w.requestAnimationFrame=fn=>setTimeout(fn,0);
w.eval(fs.readFileSync('icons-data.js','utf8').replace(/^export const /gm,'window.'));
w.eval('const ICONS=window.ICONS,GROUPS=window.GROUPS;'+strip(fs.readFileSync('icons.js','utf8'))+';window.icon=icon');
w.eval(ON+strip(fs.readFileSync('modal-system.js','utf8'))+';window.prepareModal=prepareModal');
w.eval('(function(){'+ON+ICON+strip(fs.readFileSync('message.js','utf8'))+';window.__message=message;})()');
w.eval(ON+strip(fs.readFileSync('tooltip.js','utf8'))+';window.tooltipAttrs=tooltipAttrs');
w.eval('const tooltipAttrs=window.tooltipAttrs;'+ICON+strip(fs.readFileSync('icon-button.js','utf8'))+';window.iconButton=iconButton');
w.eval(strip(fs.readFileSync('choice-controls.js','utf8'))+';window.choiceControl=choiceControl;window.choiceCard=choiceCard');
w.eval('const iconButton=window.iconButton;'+ICON+strip(fs.readFileSync('table-guide.js','utf8')));
w.eval(ON+ICON+strip(fs.readFileSync('tabs.js','utf8'))+';window.tabList=tabs');
w.eval(strip(fs.readFileSync('states.js','utf8'))+';window.emptyRow=emptyRow;window.emptyState=emptyState;window.errorState=errorState');
w.eval(strip(fs.readFileSync('data-table.js','utf8'))+';window.dataTable=dataTable;window.dataCards=dataCards;window.applyPaging=applyPaging;window.PAGE_SIZES=PAGE_SIZES');
w.eval('(function(){'+ON+ICON+strip(fs.readFileSync('filter-toggle.js','utf8'))+';window.filterToggle=filterToggle;})()');
const TABLE='const dataTable=window.dataTable,dataCards=window.dataCards,applyPaging=window.applyPaging,filterToggle=window.filterToggle;';
w.eval('(function(){'+ON+ICON+TABLE+'const emptyRow=window.emptyRow,emptyState=window.emptyState;'+strip(fs.readFileSync('example-audit.js','utf8'))+';window.renderExampleAudit=renderRiskAudit;})()');
w.eval('(function(){'+ON+ICON+TABLE+'const choiceControl=window.choiceControl,iconButton=window.iconButton,message=window.__message,prepareModal=window.prepareModal;'+strip(fs.readFileSync('example-permission.js','utf8'))+';})()');
const q=s=>{const e=d.querySelector(s);assert.ok(e,s);return e};
const click=a=>q('[data-workflow="'+a+'"]').click();
const input=(s,v)=>{q(s).value=v;q(s).dispatchEvent(new w.Event('input',{bubbles:true}))};
const check=(s,v)=>{q(s).checked=v;q(s).dispatchEvent(new w.Event('change',{bubbles:true}))};
// === 角色權限（舊「複雜設定」改寫）：列表 → 編輯彈窗 → 權限矩陣 ===
q('.page').innerHTML=w.renderExamplePermission();
assert.equal(d.querySelectorAll('[data-role-edit]').length,3,'角色列表應有三筆');
assert.equal(d.querySelector('dialog'),null,'一進來只有列表，矩陣在彈窗裡');
q('[data-role-edit="R-02"]').click();
assert.ok(q('dialog[open]').textContent.includes('財務專員'),'編輯彈窗要帶角色名稱');
// 勾「編輯」要自動補上「讀取」，否則會出現能改卻看不到的權限
check('[data-permission-item="會員列表"][data-permission-type="edit"]',true);
assert.equal(q('[data-permission-item="會員列表"][data-permission-type="read"]').checked,true);
// 父層只勾了一部分時顯示半選，它不是第三種值
assert.equal(q('[data-permission-group="會員管理"][data-permission-type="edit"]').indeterminate,true);
// 取消「讀取」要一併取消「編輯」
check('[data-permission-item="會員列表"][data-permission-type="read"]',false);
assert.equal(q('[data-permission-item="會員列表"][data-permission-type="edit"]').checked,false);
// 分類列一次開一整組
check('[data-permission-group="活動管理"][data-permission-type="edit"]',true);
assert.ok(['優惠活動','公告管理'].every(name=>q('[data-permission-item="'+name+'"][data-permission-type="read"]').checked),'開整組編輯要連讀取一起開');
// 分類可收合，收合後子項不渲染
q('[data-permission-expand="報表"]').click();
assert.equal(d.querySelector('[data-permission-item="遊戲營收報表"]'),null,'收合後子項不該還在');
q('[data-permission-expand="報表"]').click();
assert.ok(q('[data-permission-item="遊戲營收報表"]'),'展開後子項要回來');
// 角色名稱是必填，錯誤留在欄位下方而不是 Toast
q('[data-role-name]').value='';
q('dialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.ok(q('dialog[open]'),'名稱沒填不該關閉彈窗');
assert.ok(q('#role-name-error').textContent.includes('請輸入'),'錯誤要留在欄位下方');
// 取消就丟掉草稿，列表不動
q('[data-permission-cancel]').click();
assert.equal(d.querySelector('dialog'),null);
assert.ok(q('[data-role-list]').textContent.includes('財務專員'),'取消不得改動列表');

// === 轉點審核－風控（舊「審核操作」改寫）===
q('.page').innerHTML=w.renderExampleAudit();
const risk=a=>q('[data-risk-action="'+a+'"]').click();
const search=()=>q('[data-risk-search]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(d.querySelectorAll('.example-audit-page thead tr:last-child th').length,17);
assert.equal(d.querySelectorAll('.example-audit-page .data-table-groups th').length,4,'兩層表頭：分組列在欄名列之上');
assert.ok(q('.example-audit-page thead th:last-child').classList.contains('is-sticky-right'),'操作欄要釘在右側');
assert.ok(q('.example-audit-page .data-table-scroll'),'17 欄要用共用表格的橫向捲動容器');
assert.equal(d.querySelectorAll('[data-risk-row]').length,10);
assert.equal(q('.pagination-total').textContent,'共 14 筆');
q('[data-table-page="2"][data-table="risk"]').click();assert.equal(d.querySelectorAll('[data-risk-row]').length,4);
risk('reset');
assert.ok([...d.querySelectorAll('[data-risk-row]')].some(row=>row.textContent.includes('Alex 處理中')&&!row.querySelector('[data-risk-action="approve"]')));
// 兩種「處理中」只差在有沒有按鈕，文字樣式要一樣（先前別人那一種漏掉 .risk-operator，字變大變深）
{
  const mine=[...d.querySelectorAll('[data-risk-row]')].find(row=>row.textContent.includes('Peggy 處理中'));
  const others=[...d.querySelectorAll('[data-risk-row]')].find(row=>row.textContent.includes('Alex 處理中'));
  assert.ok(mine&&others,'示範資料要同時有「自己處理中」與「別人處理中」兩筆');
  assert.ok(mine.querySelector('.risk-operator')&&others.querySelector('.risk-operator'),'兩種處理中都要用同一個 .risk-operator');
  assert.ok(mine.querySelector('[data-risk-action="approve"]'),'自己認領的那一筆要能繼續審');
  assert.equal(others.querySelector('[data-risk-action="approve"]'),null,'別人認領的那一筆不給按鈕');
}
input('[name="min"]','100');input('[name="max"]','1');search();assert.ok(q('[data-risk-search-error]').textContent.includes('最低'));
risk('reset');input('[name="ip"]','999.1.1.1');search();assert.ok(q('[data-risk-search-error]').textContent.includes('IP'));
risk('reset');const firstId=q('[data-risk-row]').dataset.riskRow;
input('[name="order"]',firstId.toLowerCase());search();assert.equal(d.querySelectorAll('[data-risk-row]').length,1);
risk('details');assert.ok(q('#detailOverlay').classList.contains('open'));for(const label of ['玩家註冊時間','第三方訂單號','會員實收','銀行卡姓名','設備指紋'])assert.ok(q('#detailBody').textContent.includes(label),label);
risk('close-drawer');risk('audit');assert.ok(q('#detailOverlay').classList.contains('open')); // Read-only detail uses the drawer, not a dialog.
assert.equal(d.querySelectorAll('.risk-audit-entry').length,2);
for(const label of ['總扣除行政費','稽核%','稽核倍數','行政費%','要求有效投注','實際有效投注','扣除額'])assert.ok(q('#detailBody').textContent.includes(label),label);
risk('close-drawer');
risk('reject');assert.ok(q('dialog').textContent.includes('確認不通過'));assert.equal(q('dialog form').checkValidity(),true); // Original remarks are optional.
input('dialog [name="remark"]','資料不符');input('dialog [name="frontendRemark"]','請確認資料');assert.equal(q('[data-note-count="remark"]').textContent,'4 / 200');
risk('close-modal');assert.ok(q('[data-risk-row]').textContent.includes('Peggy 處理中')); // Claim persists after cancel, as in original.
risk('reject');q('dialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(d.querySelector('dialog'),null);assert.equal(d.querySelectorAll('[data-risk-row]').length,0);
risk('reset');risk('approve');q('dialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(q('.pagination-total').textContent,'共 12 筆');
risk('reset');input('[name="uid"]','mina_wu');search();risk('details');assert.ok(q('#detailBody').textContent.includes('TRC20'));risk('close-drawer');
risk('reset');input('[name="uid"]','emma_tsai');search();risk('details');assert.ok(q('#detailBody').textContent.includes('手機號碼'));risk('close-drawer');
risk('auto');assert.equal(q('[data-risk-action="auto"]').getAttribute('aria-checked'),'true');
const tick=[...intervals.values()][0];for(let i=0;i<15;i++)tick();assert.ok(q('.risk-feedback').textContent.includes('已刷新'));
risk('approve');tick();assert.equal(q('[data-risk-countdown]').textContent,'15 秒後刷新');risk('close-modal');
risk('auto');assert.equal(intervals.size,0);assert.equal(q('[data-risk-action="auto"]').getAttribute('aria-checked'),'false');
risk('auto');q('.page').innerHTML=w.renderExamplePermission();
q('.page').innerHTML=w.iconButtonGuide()+w.tableGuide()+w.choiceControlsGuide()+w.tooltipGuide();
assert.equal(d.querySelectorAll('.semantic-btn.icon-action').length,18); // 12 in the icon guide, 6 in the table sample.
assert.equal(d.querySelectorAll('.table-guide-sample tbody tr').length,3);
assert.equal(q('.icon-action-wrap[data-tooltip]').querySelector('button').disabled,true); // Disabled buttons fire no pointer events, so the tooltip sits on the wrapper.
const icon=q('.semantic-btn.icon-action[data-tooltip]');
icon.dispatchEvent(new w.FocusEvent('focusin',{bubbles:true}));
assert.equal(q('#bo-tooltip').textContent,'編輯');assert.equal(icon.getAttribute('aria-describedby'),'bo-tooltip');
icon.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(q('#bo-tooltip').classList.contains('is-open'),false);assert.equal(icon.getAttribute('aria-describedby'),null);
assert.equal(d.querySelectorAll('.choice-group').length,7);
assert.equal(d.querySelectorAll('.choice-card').length,3);
// 空狀態文案由 states.js 的 STATE_COPY 統一提供，頁面不得自己寫。
assert.ok(w.emptyRow(4,{kind:'empty'}).includes('無資料'),'empty copy');
assert.ok(w.emptyRow(4,{kind:'empty'}).includes('colspan="4"'),'empty row spans the table');
assert.equal(w.emptyRow(4,{kind:'filtered'}),w.emptyRow(4,{kind:'empty'}),'filtered 只是 empty 的別名');
assert.ok(!/<button/.test(w.emptyState({kind:'empty'}))&&!/<button/.test(w.errorState({code:'000412',message:'測試'})),'狀態區不得出現按鈕');
assert.ok(w.errorState({code:'000005_1',message:'權限不足'}).includes('000005_1 權限不足'),'錯誤碼與敘述同一行，照抄 toast 字串');
assert.ok(w.errorState({}).includes('API request failed'),'後端沒回訊息時的退路');
assert.ok(w.errorState({message:'<img src=x onerror=alert(1)>'}).includes('&lt;img'),'後端字串必須轉義');
setTimeout(()=>{assert.equal(intervals.size,0);assert.equal(q('[data-choice-mixed]').indeterminate,true);console.log('PASS: 動線回歸（角色權限：矩陣父子連動／收合／必填；轉點審核：兩層表頭 17 欄、固定操作欄、分頁、認領、抽屜、15 秒自動刷新與計時器清理；圖示按鈕、表格規格、Tooltip、選擇控制、狀態文案）');dom.window.close()},0);
