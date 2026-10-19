// 移植：ElMessage。這是規範頁，正式後台落地時只保留規則，頁面本身不移植。詳見 MESSAGE-SYSTEM.md
//
// 版面骨架比照「頁籤 Tabs」與「載入與空狀態」：外層 style-guide，標題用
// guide-section-heading，每個區塊是 section.card 並由自己的 class 給內距，小節一律 h3。
import { decisionTable } from './guide-page.js'
import { message, TYPES, MAX_VISIBLE } from './message.js'
import { icon } from './icons.js'
import { prepareModal } from './modal-system.js'
import { onMatch } from './delegate.js'
import './message-guide.css'

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 示範按鈕的語意色必須與它發出的 Toast 同色，否則按鈕自己就在示範錯誤用法：
// 按下綠色按鈕卻跳出藍色提示，使用者學到的是「顏色不代表什麼」。
// 對應關係由 message.css 的 .bo-message.is-* 決定，不是隨便挑好看的。
const KIND = { success: 'btn-export', info: 'btn-search', warning: 'btn-warning', error: 'btn-danger' }

// 用一般字串寫，裡面的反引號與 ${} 才不會被外層的樣板字串吃掉。
const API_BRANCHES = [
  '401 / 403 / 451 / 000176  →  清 token ＋ 全域彈窗 ＋ 導回登入（不是 Toast）',
  '其他 success: false        →  ElMessage.error(`${code} ${message}`)',
  '完全沒有回應               →  ElMessage.error(t("api_request_failed"))',
].join('\n')

// 示範文案刻意寫成「動詞＋受詞」，對照正式後台 149 次的 t("success")
const DEMOS = [
  ['success', '已儲存 3 項篩選條件'],
  ['info', '報表產生中，完成後會寄到你的信箱'],
  ['warning', '推薦遊戲已達 12 個上限，新的不會生效'],
  ['error', '000412 出款金額超過單筆上限'],
]

const DESCRIPTION = {
  success: '操作完成。文案要說清楚完成了什麼，不要只寫「成功」。',
  info: '不是成功也不是失敗的中性回報，例如非同步作業已排程。',
  warning: '操作有部分沒生效，或踩到上限。使用者需要知道，但不必馬上處理。',
  error: '操作失敗。帶錯誤碼與原因，停留較久並可手動關閉，方便讀完或截圖。',
}

const trigger = (type, text) =>
  `<button type="button" class="semantic-btn ${KIND[type]}" data-message-demo="${type}" data-message-text="${esc(text)}">${icon(TYPES[type].icon)}${esc(TYPES[type].label)}</button>`

window.renderMessageGuide = () => `<div class="style-guide message-guide-page">
  <div class="guide-section-heading">
    <h2>訊息提示 Message</h2>
    <p class="component-description">操作結果的短回報，從上方滑入、幾秒後自動消失，不攔截操作。對應正式後台的 <code>ElMessage</code>（189 處在用）。呼叫方式與 EP 一對一：<code>message.success('已儲存')</code> ↔ <code>ElMessage.success(t('saved'))</code>。</p>
  </div>

  <section class="card message-guide">
    <h3>互動範例</h3>
    <p class="component-description">四種型別的實際樣子。停留時間與可否手動關閉依型別不同，見下方共用規格。</p>
    <div class="message-guide-actions">${DEMOS.map(([type, text]) => trigger(type, text)).join('')}</div>
  </section>

  <section class="card message-guide">
    <h3>什麼時候用 Toast，什麼時候不要</h3>
    <p class="component-description">用錯層級比用錯顏色嚴重得多——該攔的沒攔住，使用者會以為操作成功了。</p>
    <div class="table-wrap">
      <table class="message-guide-table message-when-table">
        <thead><tr><th>情境</th><th>用什麼</th><th>為什麼</th></tr></thead>
        <tbody>
          <tr><td>操作成功</td><td><strong>Toast success</strong></td><td>只是回報，看不到也不影響結果</td></tr>
          <tr><td>請求失敗（後端回錯誤碼）</td><td><strong>Toast error</strong></td><td>由共用的 API 層統一發，頁面不要再發一次</td></tr>
          <tr><td>前端驗證：超過上限、格式不符</td><td><strong>Toast warning／error</strong></td><td>操作被擋下，但不需要使用者做決定</td></tr>
          <tr><td>欄位級錯誤（這一格填錯了）</td><td>行內錯誤文字</td><td>Toast 會消失，使用者回頭找不到是哪一格</td></tr>
          <tr><td>刪除、停用、放棄未儲存的變更</td><td>彈窗</td><td>需要使用者做決定才能繼續，Toast 攔不住</td></tr>
          <tr><td>登入逾期、權限被收回</td><td>彈窗＋導回登入</td><td>必須中斷流程，不能讓它自動消失</td></tr>
          <tr><td>整個列表沒資料／載入失敗</td><td>狀態區（<code>states.js</code>）</td><td>狀況會持續存在，Toast 消失後畫面就沒有解釋了</td></tr>
          <tr><td>需要使用者複製或截圖的內容</td><td>彈窗或抽屜</td><td>Toast 會在讀完前消失</td></tr>
        </tbody>
      </table>
    </div>
    <p class="component-description">判準一句話：<strong>訊息消失後，使用者還需不需要它？</strong>需要就不是 Toast。</p>
  </section>

  <section class="card message-guide">
    <h3>四種型別</h3>
    <div class="message-type-grid">
      ${Object.entries(TYPES).map(([type, spec]) => `<div class="message-type-card is-${type}">
        <h4>${icon(spec.icon, 20)}${spec.label}<code>message.${type}()</code></h4>
        <dl>
          <div><dt>停留</dt><dd>${spec.duration / 1000} 秒</dd></div>
          <div><dt>可手動關閉</dt><dd>${spec.closable ? '是' : '否'}</dd></div>
          <div><dt>播報</dt><dd>${spec.assertive ? 'assertive' : 'polite'}</dd></div>
        </dl>
        <p>${DESCRIPTION[type]}</p>
      </div>`).join('')}
    </div>
  </section>

  <section class="card message-guide">
    <h3>行內警示 Alert</h3>
    <p class="component-description">區塊層級的常駐提醒，<strong>不會自動消失</strong>。正式後台 3 處都是同一種寫法：<code>type="warning"</code>、<code>:closable="false"</code>、<code>show-icon</code>。</p>
    <div class="guide-stage">
      <div class="bo-alert is-warning">
        <span class="bo-alert-icon">${icon('warning', 20)}</span>
        <span>USDT 通道的費率以當日匯率換算，實際入帳金額可能與設定值有差異。</span>
      </div>
      <div class="bo-alert is-info">
        <span class="bo-alert-icon">${icon('info', 20)}</span>
        <span>Jackpot 成本承擔比例 30%，此數值由總公司設定，無法在此修改。</span>
      </div>
    </div>
    <div class="table-wrap"><table class="message-guide-table">
      <thead><tr><th>位置</th><th>檔案</th><th>說明什麼</th></tr></thead>
      <tbody>
        <tr><td>第三方支付 新增／編輯</td><td><code>thirdPartyPayment/add、edit</code></td><td>USDT 通道費率提醒</td></tr>
        <tr><td>遊戲分成</td><td><code>GameShare.vue</code></td><td>Jackpot 成本承擔比例（唯讀數值）</td></tr>
      </tbody>
    </table></div>
    ${decisionTable([
      ['這個區塊有前提或限制要先知道', '<strong>行內警示</strong>', '常駐在區塊上方，使用者填到一半抬頭還看得到'],
      ['剛才那個操作的結果', 'Toast', '回報用，看完就該消失'],
      ['這一格填錯了', '行內錯誤文字', '綁在欄位上，不是整個區塊'],
      ['整個列表沒資料', '狀態區', '那是資料的狀態，不是提醒'],
    ])}
    <p class="component-description">行內警示<strong>不可關閉</strong>——它說明的是這個區塊的固定前提，關掉之後重新整理又會出現，只是多一次無意義的點擊。真的可以關掉的訊息，代表它應該是 Toast。</p>
  </section>

  <section class="card message-guide">
    <h3>文案規則</h3>
    <p class="component-description">正式後台有 164 則成功訊息，其中 <strong>149 則是同一句 <code>t("success")</code></strong>。翻成八種語系也還是「成功 / Success / 成功 / সফল」——使用者只知道有事成功了，不知道是哪一件；在同一頁連續做三個動作時，三則一模一樣的 Toast 無法分辨。</p>
    <div class="message-copy-compare">
      <div class="is-bad">
        <h4>${icon('cancelCircle')}不要</h4>
        <ul>
          <li><code>成功</code></li>
          <li><code>操作成功</code></li>
          <li><code>Error</code></li>
          <li><code>API request failed</code></li>
        </ul>
        <p>沒有受詞，使用者不知道是哪一個動作；也無法從截圖判斷當時發生什麼。</p>
      </div>
      <div class="is-good">
        <h4>${icon('checkCircle')}要</h4>
        <ul>
          <li><code>已儲存 3 項篩選條件</code></li>
          <li><code>已停用會員 MB-009821</code></li>
          <li><code>000412 出款金額超過單筆上限</code></li>
          <li><code>已複製會員編號</code></li>
        </ul>
        <p>動詞＋受詞。錯誤一律「代碼＋原因」同一行，與狀態區的 <code>errorState()</code> 一致。</p>
      </div>
    </div>
  </section>

  <section class="card message-guide">
    <h3>堆疊與重複</h3>
    <p class="component-description">相同型別＋相同文案在畫面上時只累加計數，不再疊一則。正式後台沒有開 <code>grouping</code>，連按十次儲存就會疊出十個「成功」。同時最多顯示 ${MAX_VISIBLE} 則，超過移除最舊的。</p>
    <div class="message-guide-actions">
      <button type="button" class="semantic-btn btn-add" data-message-repeat>連按同一則 ×5（合併計數）</button>
      <button type="button" class="semantic-btn btn-edit" data-message-flood>連發 7 則不同的（上限 ${MAX_VISIBLE}）</button>
      <button type="button" class="semantic-btn btn-neutral" data-message-clear>${icon('close')}全部清除</button>
    </div>

    <h3>與彈窗並存</h3>
    <p class="component-description">原型的彈窗是原生 <code>&lt;dialog&gt;</code> 搭配 <code>showModal()</code>，會進入瀏覽器的 top layer——畫在所有 <code>z-index</code> 之上。所以單純用 <code>z-index</code> 的 Toast 從彈窗裡觸發時會被蓋住看不見，而「彈窗按下儲存之後」正是最常發 Toast 的時機。這裡的 Toast 容器用 <code>popover</code> 一起進 top layer，而且每次新增都重新 <code>showPopover()</code>，排到堆疊最上面。</p>
    <div class="message-guide-actions">
      <button type="button" class="semantic-btn btn-edit" data-message-modal>開啟彈窗，從裡面發 Toast</button>
    </div>
  </section>

  <section class="card message-guide">
    <h3>正式後台落地</h3>
    <p class="component-description"><strong>API 錯誤由共用層統一發，頁面不要自己 catch 再報一次。</strong><code>useApi.ts</code> 已經攔下所有失敗請求並呼叫 <code>ElMessage.error</code>，頁面再發就會變成兩則。</p>
    <pre class="message-guide-code"><code>${esc(API_BRANCHES)}</code></pre>
    <p class="component-description">對照 <code>MESSAGE-SYSTEM.md</code> 第三節列出的三個待修項：<code>debug</code> 外洩到 Toast、寫死的英文退路文案，以及 149 則一模一樣的成功訊息。</p>
  </section>

  <section class="card token-table message-token">
    <h2>共用規格</h2>
    <div>
      <span>位置</span><strong>上方置中，距頂 16px（手機 8px）</strong>
      <span>堆疊方向</span><strong>由上往下，間距 8px</strong>
      <span>同時上限</span><strong>${MAX_VISIBLE} 則</strong>
      <span>最大寬度</span><strong>520px</strong>
      <span>圓角／邊框</span><strong>4px / 1px</strong>
      <span>內距</span><strong>8px 12px</strong>
      <span>字級／字重</span><strong>14px / 400</strong>
      <span>圖示</span><strong>20px</strong>
      <span>關閉鈕</span><strong>16px / 20 × 20px</strong>
      <span>停留</span><strong>3 / 3 / 4 / 5 秒</strong>
      <span>層級</span><strong>popover（top layer）</strong>
      <span>退路</span><strong>z-index: 2000</strong>
    </div>
  </section>

  <section class="card guide-rules">
    <h2>使用規則</h2>
    <div class="rule-grid">
      <div><strong>消失後還需要就不是 Toast</strong><p>欄位錯誤用行內文字，需要決定用彈窗，區塊狀況用狀態區。層級不可混用。</p></div>
      <div><strong>文案要有受詞</strong><p>寫「已停用會員 MB-009821」，不得只寫「成功」。一行 40 字以內，放不下代表它不該是 Toast。</p></div>
      <div><strong>錯誤只放 code 與 message</strong><p>不得放 <code>debug</code>——型別是 <code>any</code>，可能帶出內部路徑，而 Toast 會被截圖轉傳。</p></div>
      <div><strong>API 錯誤由共用層發</strong><p>頁面不得再自己 catch 報一次，否則同一個錯誤會出現兩則。</p></div>
      <div><strong>全部走 i18n</strong><p>退路文案也一樣，不得寫死任何一種語言的字串。後端字串一律轉義後輸出。</p></div>
      <div><strong>不覆寫停留時間</strong><p>四種型別的停留與可否關閉由 message.js 統一決定；需要常駐的訊息代表它不該是 Toast。</p></div>
    </div>
  </section>
</div>`

// --- 示範 ---
onMatch('click', '[data-message-demo]', (event, button) => {
  message(button.dataset.messageText, button.dataset.messageDemo)
}, { owner: 'message-guide' })

onMatch('click', '[data-message-repeat]', () => {
  for (let i = 0; i < 5; i++) setTimeout(() => message.success('已儲存 3 項篩選條件'), i * 120)
}, { owner: 'message-guide' })

onMatch('click', '[data-message-flood]', () => {
  const texts = ['已停用會員 MB-009821', '已啟用會員 MB-009774', '已調整等級 VIP 3', '已加上標籤「高風險」',
    '已移除標籤「觀察中」', '已重設登入密碼', '已寄出通知信']
  texts.forEach((text, i) => setTimeout(() => message.success(text), i * 140))
}, { owner: 'message-guide' })

onMatch('click', '[data-message-clear]', () => message.clear(), { owner: 'message-guide' })

// 從 <dialog>.showModal() 裡發 Toast——證明 top layer 的處理有效
onMatch('click', '[data-message-modal]', (event, button) => {
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>停用會員</h2></header>
    <div class="bo-modal-body">
      <p>確定停用「Ava Chen（MB-009821）」？</p>
      <p>停用後該會員無法登入，但保留所有紀錄。</p>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-message-modal-close>取消</button>
      <button type="submit" class="semantic-btn btn-danger">確認停用</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-message-modal-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submitEvent => {
    submitEvent.preventDefault()
    // 彈窗還開著就先發，看得到才算過
    message.success('已停用會員 MB-009821')
    dialog.close()
  }
  dialog.addEventListener('close', () => { dialog.remove(); button.focus() }, { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'message-guide' })
