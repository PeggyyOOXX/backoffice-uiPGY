// 移植：el-switch（正式後台為 CustomSwitch.vue）。42×24px 需覆寫 EP 預設尺寸。詳見 ELEMENT-PLUS-MAPPING.md
import './switch-layout-guide.css'
import { on } from './delegate.js'
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = ["[data-switch-layout-demo]"]
const listen = (type, handler, capture = false) => on(type, handler, { owner: 'switch-layout-guide', claims: OWNED, capture })

const LABELS = ['開放會員轉點', '自動刷新', '會員完成身分驗證後，允許使用轉點功能']

// 四種狀態：可操作的開與關、停用的開與關。可操作是實心、旋鈕帶陰影，停用是淡底描邊的空心，
// 先分得出能不能按，再由旋鈕位置看出開或關。配色全部在 styles/input-standard-page.css，
// 這裡只負責把狀態排出來，不在頁面自己定義顏色。
const STATES = [
  ['開啟・可操作', true, false, '主題色 #1596AD 實心，旋鈕在右、帶陰影。可點擊、可聚焦，切換後立即生效。'],
  ['關閉・可操作', false, false, '中性灰 #718087 實心，旋鈕在左。用深灰不用淺灰，否則與右邊的停用狀態分不出來。'],
  ['開啟・停用', true, true, '淡主題底 #E4F4F7 加 #A9D8E1 描邊，旋鈕仍在右。值還是「開」，只是現在不能改。'],
  ['關閉・停用', false, true, '淡灰底 #F1F3F6 加 #D4DBE4 描邊，旋鈕在左。空心外觀代表不可操作，不是「關得比較淡」。'],
]

const demoSwitch = ({ on, label, disabled = false, cls = '' }) =>
  `<button type="button" class="standard-switch${cls ? ' ' + cls : ''}" role="switch" aria-checked="${on}" aria-label="${label}" ${disabled ? 'disabled' : ''} tabindex="-1"></button>`

const stateCell = ([title, on, disabled, text]) => {
  const control = demoSwitch({ on, disabled, label: `${title}示意` })
  // 停用的按鈕不觸發滑鼠事件，Tooltip 必須掛在外層容器上（與 icon-button.js 同一個做法）。
  return `<div class="switch-state">${disabled
    ? `<span class="switch-state-control" data-tooltip="需要更高權限才能調整">${control}</span>`
    : `<span class="switch-state-control">${control}</span>`}<div><strong>${title}</strong><small>${text}</small></div></div>`
}

const stateBody = () => `<h3>狀態</h3>
  <p class="component-description">最容易被搞混的是<strong>「關閉」與「停用」</strong>，兩個都是灰的。所以可操作的兩種一律實心、旋鈕帶陰影，停用的兩種一律淡底描邊、旋鈕平貼：先看得出能不能按，再由旋鈕位置判斷開或關。停用一定要用 Tooltip 說明原因，滑到下面兩顆停用的開關上看看。</p>
  <div class="switch-state-grid">${STATES.map(stateCell).join('')}</div>
  <h4 class="switch-state-sub">互動狀態</h4>
  <div class="switch-state-grid">
    <div class="switch-state"><span class="switch-state-control">${demoSwitch({ on: true, label: 'Hover 示意' })}</span><div><strong>Hover</strong><small>可操作時顏色加深一階（開 #117E91／關 #5C6878），停用的不會變色——滑過去就知道按不按得動。</small></div></div>
    <div class="switch-state"><span class="switch-state-control">${demoSwitch({ on: false, label: 'Focus 示意', cls: 'is-focus' })}</span><div><strong>Focus（鍵盤）</strong><small>3px 主題色外框、offset 3px。Tab 聚焦後用 Enter 或空白鍵切換；這顆是固定顯示的示意。</small></div></div>
  </div>`

// card 內容單獨抽出，讓合併後的「選擇控制」規範頁沿用同一份，不複製一遍。
// 區塊順序與 Radio／Checkbox 那半頁一致：先狀態、再排列。
export const switchBody = () => `<p class="component-description">開關代表一個會立即生效的設定，尺寸固定 42 × 24px，開啟為主題色、關閉為中性灰，旁邊不放「確定」按鈕。</p>
${stateBody()}
<h3>排列</h3>
<p class="component-description">Switch 在前、文案在後，每項設定獨立一列，不與下拉並排。列寬隨容器延伸，不設固定寬度。</p><div class="switch-layout-panel" lang="zh-Hant">${LABELS.map((label, index) => `<div class="switch-layout-row"><button type="button" id="switch-guide-control-${index}" class="standard-switch" role="switch" aria-checked="${index !== 1}" aria-labelledby="switch-guide-label-${index}" data-switch-layout-demo></button><label id="switch-guide-label-${index}" for="switch-guide-control-${index}">${label}</label></div>`).join('')}</div><p class="component-description switch-layout-note">沿用 standard-switch：42 × 24px，開啟為主題綠，關閉為中性灰。文案使用一般字重 400，不加粗。開關與文案間隔 16px，垂直置中、上下對齊；文案向右延伸，超過可用空間才換行，換行後對齊文案起點。可點擊開關或文案切換，也可使用 Tab 聚焦、Enter 或空白鍵操作。</p>`

window.switchLayoutGuide = () => `<section class="component-example" id="switch-layout-guide"><h2>開關排列 Switch</h2><div class="card switch-layout-guide">${switchBody()}</div></section>`

listen('click', event => {
  const control = event.target.closest('[data-switch-layout-demo]')
  if (control) control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true'))
})
