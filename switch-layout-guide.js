// 移植：el-switch（正式後台為 CustomSwitch.vue）。42×24px 需覆寫 EP 預設尺寸。詳見 ELEMENT-PLUS-MAPPING.md
import './switch-layout-guide.css'
import { on } from './delegate.js'
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = ["[data-switch-layout-demo]"]
const listen = (type, handler, capture = false) => on(type, handler, { owner: 'switch-layout-guide', claims: OWNED, capture })

const LABELS = ['開放會員轉點', '自動刷新', '會員完成身分驗證後，允許使用轉點功能']

// card 內容單獨抽出，讓合併後的「選擇控制」規範頁沿用同一份，不複製一遍。
export const switchBody = () => `<p class="component-description">Switch 在前、文案在後，每項設定獨立一列，不與下拉並排。列寬隨容器延伸，不設固定寬度。</p><div class="switch-layout-panel" lang="zh-Hant">${LABELS.map((label, index) => `<div class="switch-layout-row"><button type="button" id="switch-guide-control-${index}" class="standard-switch" role="switch" aria-checked="${index !== 1}" aria-labelledby="switch-guide-label-${index}" data-switch-layout-demo></button><label id="switch-guide-label-${index}" for="switch-guide-control-${index}">${label}</label></div>`).join('')}</div><p class="component-description switch-layout-note">沿用 standard-switch：42 × 24px，開啟為主題綠，關閉為中性灰。文案使用一般字重 400，不加粗。開關與文案間隔 16px，垂直置中、上下對齊；文案向右延伸，超過可用空間才換行，換行後對齊文案起點。可點擊開關或文案切換，也可使用 Tab 聚焦、Enter 或空白鍵操作。</p>`

window.switchLayoutGuide = () => `<section class="component-example" id="switch-layout-guide"><h2>開關排列 Switch</h2><div class="card switch-layout-guide">${switchBody()}</div></section>`

listen('click', event => {
  const control = event.target.closest('[data-switch-layout-demo]')
  if (control) control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true'))
})
