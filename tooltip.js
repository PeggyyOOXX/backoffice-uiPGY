import './tooltip.css'

// Shared tooltip: any element carrying data-tooltip gets one, on hover and on keyboard focus.
// Disabled buttons do not fire pointer events in every browser, so put data-tooltip on a
// wrapper element in that case (see iconButton in icon-button.js).
const GAP = 8, DELAY = 150
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
let node = null, current = null, timer = null

function tip() {
  if (!node) {
    node = document.createElement('div')
    node.className = 'bo-tooltip'
    node.id = 'bo-tooltip'
    node.setAttribute('role', 'tooltip')
    node.hidden = true
    document.body.append(node)
  }
  return node
}
function place(trigger, placement) {
  const panel = tip(), box = trigger.getBoundingClientRect(), self = panel.getBoundingClientRect()
  const room = { top: box.top, bottom: innerHeight - box.bottom, left: box.left, right: innerWidth - box.right }
  const need = placement === 'left' || placement === 'right' ? self.width + GAP : self.height + GAP
  // Flip to the opposite side when the preferred one cannot fit.
  const opposite = { top:'bottom', bottom:'top', left:'right', right:'left' }[placement]
  if (room[placement] < need && room[opposite] >= need) placement = opposite
  let top, left
  if (placement === 'top' || placement === 'bottom') {
    top = placement === 'top' ? box.top - self.height - GAP : box.bottom + GAP
    left = box.left + box.width / 2 - self.width / 2
  } else {
    top = box.top + box.height / 2 - self.height / 2
    left = placement === 'left' ? box.left - self.width - GAP : box.right + GAP
  }
  const fit = (value, limit) => Math.max(8, Math.min(value, limit - 8))
  top = fit(top, innerHeight - self.height); left = fit(left, innerWidth - self.width)
  panel.dataset.placement = placement
  panel.style.top = `${Math.round(top)}px`
  panel.style.left = `${Math.round(left)}px`
  // Keep the arrow pointing at the trigger even after the panel was clamped to the viewport.
  const centre = placement === 'top' || placement === 'bottom'
    ? { position: box.left + box.width / 2 - left, size: self.width }
    : { position: box.top + box.height / 2 - top, size: self.height }
  const offset = Math.max(10, Math.min(centre.position, centre.size - 10)) - 4
  panel.style.setProperty('--arrow-offset', `${Math.round(offset)}px`)
}
function show(trigger) {
  const text = trigger.dataset.tooltip
  if (!text) return
  const panel = tip()
  panel.textContent = text
  panel.hidden = false
  current = trigger
  place(trigger, trigger.dataset.tooltipPlacement || 'top')
  panel.classList.add('is-open')
  trigger.setAttribute('aria-describedby', 'bo-tooltip')
}
function hide() {
  clearTimeout(timer); timer = null
  if (!current) return
  current.removeAttribute('aria-describedby')
  current = null
  const panel = tip()
  panel.classList.remove('is-open')
  panel.hidden = true
}
function open(trigger) {
  if (current === trigger) return
  hide()
  timer = setTimeout(() => show(trigger), DELAY)
}
document.addEventListener('pointerover', event => {
  const trigger = event.target.closest?.('[data-tooltip]')
  if (trigger) open(trigger); else if (current) hide()
})
document.addEventListener('pointerdown', hide)
document.addEventListener('focusin', event => {
  const trigger = event.target.closest?.('[data-tooltip]')
  trigger ? show(trigger) : hide()
})
document.addEventListener('focusout', hide)
document.addEventListener('keydown', event => { if (event.key === 'Escape') hide() })
addEventListener('scroll', () => { if (current) hide() }, true)
addEventListener('resize', hide)

export const tooltipAttrs = (text, placement = 'top') =>
  text ? `data-tooltip="${esc(text)}"${placement === 'top' ? '' : ` data-tooltip-placement="${placement}"`}` : ''

window.tooltipGuide = () => `<section class="component-example" id="tooltip-guide"><h2>提示氣泡 Tooltip</h2><div class="card tooltip-guide">
  <p class="component-description">補充說明用，不承載必要資訊。滑鼠移入或鍵盤聚焦後 150 毫秒顯示，移開、按 Esc 或捲動即關閉。</p>
  <div class="tooltip-guide-row">
    ${['top','bottom','left','right'].map(placement => `<button type="button" class="semantic-btn btn-neutral outline" data-tooltip="放在${{top:'上',bottom:'下',left:'左',right:'右'}[placement]}方" data-tooltip-placement="${placement}">${{top:'上',bottom:'下',left:'左',right:'右'}[placement]}方</button>`).join('')}
    <span class="bo-tooltip is-open tooltip-guide-static" data-placement="top">示意：這是提示文字</span>
  </div>
  <div class="tooltip-guide-row">
    <button type="button" class="semantic-btn btn-record" data-tooltip="可換行的長提示；超過 300px 會自動折行，最多顯示三到四行，再長就應該改用抽屜或說明文字。">長文字提示</button>
    <button type="button" class="semantic-btn btn-edit" data-tooltip="第一行說明&#10;第二行說明">多行提示</button>
    <a href="#tooltip-guide" class="risk-link" data-tooltip="連結與純文字也可以掛提示" onclick="event.preventDefault()">文字上的提示</a>
  </div>
  <dl>
    <div><dt>底色／文字</dt><dd>#17233B／#FFFFFF</dd></div>
    <div><dt>字級／行高</dt><dd>12px／1.5，字重 400</dd></div>
    <div><dt>內距／圓角</dt><dd>6px 10px／6px</dd></div>
    <div><dt>最大寬度</dt><dd>300px，超出自動折行</dd></div>
    <div><dt>與觸發元件間距</dt><dd>8px，含箭頭</dd></div>
    <div><dt>延遲</dt><dd>顯示 150ms，關閉不延遲</dd></div>
  </dl>
  <p class="component-description">寫法：在元素加 <code>data-tooltip="說明文字"</code>，方向用 <code>data-tooltip-placement</code>（top／bottom／left／right，預設 top，空間不足時自動翻面）。提示開啟時會掛上 aria-describedby，讀屏軟體讀得到。停用的按鈕不會觸發滑鼠事件，請把 data-tooltip 放在外層容器。</p>
</div></section>`
