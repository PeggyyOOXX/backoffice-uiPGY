import './choice-controls.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

// Shared single-choice / multi-choice control. The label is part of the control, so
// clicking the text toggles it; no per-page markup or colours.
export const choiceControl = ({ type, name, label, hint = '', checked = false, disabled = false, attrs = '' }) =>
  `<label class="choice-control"><input type="${type}" ${name ? `name="${esc(name)}"` : ''} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${attrs}><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ''}</span></label>`

export const choiceCard = ({ type = 'radio', name, title, text, checked = false, disabled = false, attrs = '' }) =>
  `<label class="choice-card"><input type="${type}" ${name ? `name="${esc(name)}"` : ''} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${attrs}><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></label>`

const group = (legend, options, inline = false) =>
  `<fieldset class="choice-group${inline ? ' is-inline' : ''}">${legend ? `<legend>${legend}</legend>` : ''}${options.map(choiceControl).join('')}</fieldset>`

const radios = (name, items) => items.map(([label, state]) => ({ type:'radio', name, label, checked: state === 'checked' || state === 'disabled-checked', disabled: state?.startsWith('disabled') }))
const boxes = items => items.map(([label, state]) => ({ type:'checkbox', label, checked: state === 'checked' || state === 'disabled-checked', disabled: state?.startsWith('disabled'), attrs: state === 'mixed' ? 'data-choice-mixed' : '' }))

window.choiceControlsGuide = () => `<section class="component-example" id="choice-controls-guide"><h2>選擇控制 Radio／Checkbox</h2><div class="card choice-guide">
  <p class="component-description">Radio 用於數個互斥選項擇一，Checkbox 用於可複選或單一開關。兩者都是控制在左、文案緊接在右，間距 8px，點文案即可切換。選項超過六個改用下拉。</p>
  <h3>狀態</h3>
  <div class="choice-guide-panel">
    <div><h4>Radio</h4>${group('', radios('guide-radio-state', [['未選取','none'],['已選取','checked'],['停用','disabled'],['停用已選取','disabled-checked']]))}</div>
    <div><h4>Checkbox</h4>${group('', boxes([['未選取','none'],['已選取','checked'],['部分選取','mixed'],['停用','disabled'],['停用已選取','disabled-checked']]))}</div>
  </div>
  <h3>排列</h3>
  <div class="choice-guide-panel">
    <div><h4>直排（預設）</h4>${group('回覆方式', radios('guide-radio-column', [['電話回覆','checked'],['信箱回覆','none'],['不回覆','none']]))}</div>
    <div><h4>橫排（選項短且不超過四個）</h4>${group('帳號狀態', radios('guide-radio-inline', [['全部','checked'],['啟用','none'],['停用','none']]), true)}</div>
    <div><h4>附說明</h4>${group('層級', [
      { type:'radio', name:'guide-radio-hint', label:'一般代理', hint:'依既有佔成計算', checked:true },
      { type:'radio', name:'guide-radio-hint', label:'總代理', hint:'可再建立下層代理' },
    ])}</div>
    <div><h4>複選群組</h4>${group('通知管道', boxes([['站內信','checked'],['電子郵件','checked'],['簡訊','none']]))}</div>
  </div>
  <h3>選項卡片</h3>
  <p class="component-description">選項需要說明、要引導使用者判斷時改用卡片：整張可點、已選狀態明顯。用在設定頁的規則選擇；選項短又沒有說明時仍用上面的一般 Radio。</p>
  <div class="choice-card-grid">
    ${choiceCard({ name:'guide-card', title:'通過稽核後可轉點', text:'會員需完成稽核條件，才可進行轉點。', checked:true })}
    ${choiceCard({ name:'guide-card', title:'不限制稽核狀態', text:'會員尚未通過稽核時，也允許進行轉點。' })}
    ${choiceCard({ name:'guide-card', title:'暫停轉點', text:'需要更高權限才能調整。', disabled:true })}
  </div>
  <h3>錯誤</h3>
  <fieldset class="choice-group is-inline" aria-invalid="true" aria-describedby="choice-guide-error"><legend>代理層級<span class="required-mark" aria-hidden="true"> *</span></legend>${radios('guide-radio-error', [['一般代理','none'],['總代理','none']]).map(choiceControl).join('')}</fieldset>
  <small class="settings-error" id="choice-guide-error">請選擇代理層級</small>
  <dl>
    <div><dt>控制尺寸</dt><dd>16 × 16px</dd></div>
    <div><dt>選取色</dt><dd>#1596AD（accent-color）</dd></div>
    <div><dt>文案</dt><dd>14px／400，不加粗</dd></div>
    <div><dt>控制與文案間距</dt><dd>8px</dd></div>
    <div><dt>選項間距</dt><dd>直排 12px，橫排 12px × 24px</dd></div>
    <div><dt>Focus</dt><dd>2px #1596AD 外框，offset 2px</dd></div>
    <div><dt>卡片外框／圓角</dt><dd>1px #DCE2EB／9px，內距 10px</dd></div>
    <div><dt>卡片已選取</dt><dd>底 #F0FAFB，框 #69B8C5</dd></div>
    <div><dt>卡片標題／說明</dt><dd>14px／600 與 12px #718096</dd></div>
  </dl>
  <p class="component-description">每組用 fieldset 加 legend 說明群組名稱，必填在 legend 後標記。Radio 一定要有預設值，不留全部未選；Checkbox 的「部分選取」只用於父階層，代表下層有部分勾選。錯誤不可只用顏色，必須附文字。選項卡片的已選狀態由 CSS <code>:has(input:checked)</code> 判斷，不依賴重新渲染；沿用的 is-selected class 仍然有效。</p>
</div></section>`

// indeterminate is a property, not an attribute, so it is applied after render.
const applied = new WeakSet()
new MutationObserver(() => {
  // The callback can still fire once the document has gone away (page teardown).
  document?.querySelectorAll('[data-choice-mixed]').forEach(box => {
    if (applied.has(box)) return
    applied.add(box)
    box.indeterminate = true
  })
}).observe(document.body, { childList: true, subtree: true })
