// 移植：usePermission.ts（正式後台 61 個檔案在用）。詳見 ELEMENT-PLUS-MAPPING.md
//
// 「組合範例－權限」講的是角色權限矩陣**怎麼設定**；這一頁講的是設定完之後
// **頁面上的控制項該怎麼反應**——不渲染還是停用。
//
// 為什麼需要這一頁：正式後台同一個 hasEditPermission，在模板裡
//   v-if       141 處  → 沒權限就看不到
//   :disabled  161 處  → 沒權限看得到但按不動
// 幾乎一半一半，而且沒有任何地方寫下判準。同一位使用者在 A 頁看不到「編輯」、
// 在 B 頁看得到但點不動，只會得到「這個後台怪怪的」這個結論。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import './guide-page.css'
import './permission-guide.css'

// 權限字串的形狀：`${routePermission}.${action}`，四個動作。
// hasEditPermission 是 create / update / delete 任一個成立。
const ACTIONS = [
  ['read', '檢視', '進得了這一頁、看得到列表與詳情'],
  ['create', '新增', '工具列的「新增」、空狀態旁的建立入口'],
  ['update', '編輯', '列上的編輯鈕、狀態切換、可編輯表格的欄位'],
  ['delete', '刪除', '列上的刪除鈕、批量刪除'],
]

const LEVELS = [
  ['路由', '<strong>導回首頁</strong>', '沒有 .read 就不該進得來。用 router guard 擋，不是在頁面裡放一張「無權限」的空狀態'],
  ['側欄', '<strong>不渲染</strong>', 'Side.vue 已經把側欄過濾成只剩有 .read 的項目。看得到卻點不了只會讓人一直問為什麼'],
  ['整頁的動作（新增、匯入）', '<strong>不渲染</strong>', '工具列少一顆按鈕不會讓版面壞掉，而且使用者根本不需要知道有這個功能'],
  ['列上的動作（編輯、刪除）', '<strong>不渲染</strong>', '同上。操作欄本來就會因為資料狀態而少幾顆，少一顆不奇怪'],
  ['整張表單／整頁內容', '<strong>停用</strong>', '欄位是用來「讀這一筆資料」的，拿掉就沒東西可看了'],
  ['單一欄位（部分可改）', '<strong>停用</strong>', '欄位之間有上下文，抽掉一格會讓旁邊的欄位讀起來不完整'],
]

const demo = () => `<div class="guide-stage permission-demo">
  <div class="permission-demo-col">
    <h4>${icon('checkCircle')}有編輯權限</h4>
    <div class="permission-demo-bar">
      <button type="button" class="semantic-btn btn-add">${icon('add', 16)}新增</button>
      <button type="button" class="semantic-btn btn-export">${icon('download', 16)}匯出</button>
    </div>
    <div class="permission-demo-row">
      <span>ava_chen</span>
      <div class="permission-demo-actions">
        <button type="button" class="semantic-btn btn-edit">編輯</button>
        <button type="button" class="semantic-btn btn-danger">刪除</button>
      </div>
    </div>
  </div>
  <div class="permission-demo-col">
    <h4>${icon('info')}只有檢視權限</h4>
    <div class="permission-demo-bar">
      <button type="button" class="semantic-btn btn-export">${icon('download', 16)}匯出</button>
    </div>
    <div class="permission-demo-row">
      <span>ava_chen</span>
      <div class="permission-demo-actions"><button type="button" class="semantic-btn btn-record">檢視</button></div>
    </div>
    <p class="permission-demo-note">動作鈕整顆不見，不是變灰。列表本身照常顯示。</p>
  </div>
</div>`

window.renderPermissionPage = () => guidePage({
  slug: 'permission',
  title: '權限控制 Permission',
  intro: '角色權限設定完之後，頁面上的控制項該怎麼反應。判準只有一條：<strong>拿掉它，剩下的畫面還讀得懂嗎</strong>——讀得懂就不渲染，讀不懂就停用。矩陣怎麼設定在「組合範例－權限」。正式後台為 <code>usePermission.ts</code>，61 個檔案在用。',
  sections: [
    {
      heading: '四個動作',
      body: `<div class="table-wrap"><table class="guide-decision-table">
          <thead><tr><th>權限</th><th>名稱</th><th>管得到什麼</th></tr></thead>
          <tbody>${ACTIONS.map(([key, name, desc]) => `<tr><td><code>${key}</code></td><td>${name}</td><td>${desc}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="component-description">權限字串是<strong>頁面代號加動作</strong>（<code>membersManagement.read</code>）。頁面通常只問兩個問題：<strong>看得到嗎</strong>（<code>.read</code>）、<strong>改得動嗎</strong>（<code>.create</code> / <code>.update</code> / <code>.delete</code> 任一個成立）。要精確到單一動作時才各別問。</p>
        <p class="component-description"><strong>權限一律向後端要，不在前端推算。</strong>前端拿到的是一份字串清單，只負責決定畫面怎麼呈現；真正的擋關在 API。畫面上藏起來的按鈕不等於這個動作做不到。</p>`,
    },
    {
      heading: '不渲染還是停用',
      body: `${demo()}
        ${decisionTable(LEVELS, ['這一層', '怎麼處理', '為什麼'])}
        <p class="component-description">一句話版本：<strong>動作沒了就不渲染，資料沒了就停用。</strong>按鈕是「可以做的事」，少一件事不影響理解；欄位是「這一筆資料長什麼樣」，少一格就讀不完整。</p>
        <p class="component-description">正式後台目前兩種寫法各佔一半（<code>v-if</code> 141 處、<code>:disabled</code> 161 處），而且沒有判準——同一位使用者在 A 頁看不到「編輯」、在 B 頁看得到但點不動。移植時照上表統一。</p>`,
    },
    {
      heading: '停用的時候要說原因',
      body: `<div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>欄位變灰就沒了。使用者不知道是「還沒輪到你填」、「這筆資料鎖住了」還是「你沒有權限」，只能去問人。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>掛 Tooltip 寫明原因：「沒有編輯權限」。停用的元素不觸發滑鼠事件，所以 <code>data-tooltip</code> 要放在<strong>外層容器</strong>上。</p></div>
        </div>
        <p class="component-description">整張表單都是唯讀時，<strong>在表單上方放一行說明比逐欄掛 Tooltip 好</strong>——二十個欄位掛二十次同一句話，滑過去會一路閃。這是「表格上方不放狀態文字」那條規則的例外：那條管的是會自己過期的操作結果，這一句在使用者的權限變更前都成立。</p>
        <p class="component-description">唯讀表單的 footer 只留「返回」，<strong>不要留一顆按不動的「儲存」</strong>。按鈕存在就是在說這件事做得到。</p>`,
    },
    {
      heading: '不做「無權限」狀態畫面',
      body: `<p class="component-description">側欄已經過濾成只剩有 <code>.read</code> 的項目，沒權限的頁面根本進不去。真要防書籤或權限被即時收回，應該在 <strong>router guard 導回首頁</strong>並用 Toast 說明，不是讓人進到一個只有空狀態的頁面。</p>
        <p class="component-description">所以 <code>states.js</code> 沒有「無權限」這個狀態，也不會有。表格裡的狀態區只有三種：無資料、載入失敗、載入中。</p>`,
    },
    {
      heading: '權限變更之後',
      body: `<p class="component-description">正式後台每 5 分鐘重取一次登入者資訊，權限可能在使用者停留在某一頁時被改掉。<strong>重取後不要就地把畫面改掉</strong>——使用者正在填的表單會突然變成唯讀，剛打的字沒地方去。</p>
        <p class="component-description">正確的做法是在<strong>下一次動作時</strong>才反映：送出被 API 擋下來時照常由共用請求層發 Toast，頁面不另外 catch；使用者換頁時新的頁面自然套用新的權限。側欄則可以即時更新，因為它沒有未儲存的狀態。</p>`,
    },
  ],
  tokens: [
    ['權限字串', '<頁面代號>.<動作>'],
    ['四個動作', 'read / create / update / delete'],
    ['可編輯判定', 'create、update、delete 任一成立'],
    ['路由沒有 read', '導回首頁，不顯示空狀態'],
    ['側欄項目', '不渲染'],
    ['工具列動作鈕', '不渲染'],
    ['列上動作鈕', '不渲染'],
    ['表單欄位', '停用，不是不渲染'],
    ['停用的說明', 'Tooltip 掛在外層容器'],
    ['唯讀表單 footer', '只留返回，不留按不動的儲存'],
    ['權限重取間隔', '5 分鐘'],
    ['重取後的套用時機', '下一次動作或下一次換頁'],
  ],
  rules: [
    ['動作沒了就不渲染，資料沒了就停用', '按鈕是「可以做的事」，少一件不影響理解；欄位是「這筆資料長什麼樣」，少一格就讀不完整。'],
    ['同一個判準套用全站', '正式後台目前 v-if 141 處、:disabled 161 處各半且沒有判準，同一位使用者在不同頁看到不同行為。'],
    ['權限向後端要，不在前端推算', '前端只決定畫面怎麼呈現，真正的擋關在 API。藏起來的按鈕不等於做不到。'],
    ['停用一定要說原因', '變灰而不說明，使用者分不出是沒權限、還沒輪到、還是資料鎖住了。'],
    ['整張唯讀就放一行說明', '二十個欄位掛二十次同一句 Tooltip，滑過去會一路閃。'],
    ['不留按不動的儲存鈕', '按鈕存在就是在說這件事做得到。唯讀表單的 footer 只留返回。'],
    ['不做無權限狀態畫面', '側欄已經過濾掉了；防書籤用 router guard 導回首頁，不是在表格裡放空狀態。'],
    ['權限變更不就地改畫面', '使用者正在填的表單突然變唯讀，剛打的字沒地方去。下一次動作或換頁時才反映。'],
  ],
})
