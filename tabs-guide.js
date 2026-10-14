import { tabs, tabPanels } from './tabs.js'
import './tabs-guide.css'
import { on } from './delegate.js'
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = []
const listen = (type, handler, capture = false) => on(type, handler, { owner: 'tabs-guide', claims: OWNED, capture })


const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const body = text => `<div class="tabs-panel-body"><p>${esc(text)}</p></div>`

const demo = ({ id, label, items, variant, mobile, panels }) =>
  tabs({ id, label, items, variant, mobile, active: items[0].key })
  + tabPanels(id, panels ?? items.map(item => [item.key, body(`「${item.label}」的內容區塊。`)]), items[0].key)

// 一般、帶計數、停用三種標籤內容放在同一組，不另開一個範例。
const LINE = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待審核', count: 12 },
  { key: 'passed', label: '已通過', count: 96 },
  { key: 'rejected', label: '已拒絕', count: 20 },
  { key: 'locked', label: '無編輯權限', disabled: true },
]
const CARD = [
  { key: 'base', label: '基本資料' },
  { key: 'wallet', label: '錢包設定' },
  { key: 'log', label: '操作紀錄' },
]
// 首頁是常駐頁籤，沒有關閉鈕；其餘開幾頁就有幾顆。
const WORKSPACE = [
  { key: 'home', label: '首頁' },
  { key: 'guide', label: '樣式規範', closable: true },
  { key: 'member', label: '搜尋結果頁面', closable: true },
  { key: 'settings', label: '設定相關頁面', closable: true },
]

window.renderTabsGuide = () => `<div class="style-guide tabs-guide-page">
  <div class="guide-section-heading">
    <h2>頁籤 Tabs</h2>
    <p class="component-description">同一份資料的不同切面用頁籤切換，不改變頁面標題也不改變網址。全站共用 tabs.js，頁面只宣告變化與手機行為，不自訂頁籤的高度、配色與底線。</p>
  </div>

  <section class="card tabs-guide">
    <h3>變化</h3>
    <p class="component-description">底線型是頁面層級的預設；卡片型只用在內容區塊內的次層切換。兩者不得在同一層級混用，一個頁面也不要超過兩層頁籤。第三種變化「工作區」只給 shell 用，放在本節最後。</p>
    <div class="tabs-demo">
      <h4>底線型 line（預設）</h4>
      <p>頁面層級的分類切換，例如列表的狀態分頁。標籤內容的三種樣子都在這一組：只放名稱的一般標籤、帶計數標記的、以及停用的。標籤文字只放名稱，數量用計數標記，不要把數字寫進文字裡；沒有檢視權限的分頁直接不渲染，有分頁但目前不可用才用停用並說明原因。</p>
      ${demo({ id: 'demo-line', label: '底線型範例', items: LINE, variant: 'line' })}
    </div>
    <div class="tabs-demo">
      <h4>卡片型 card</h4>
      <p>內容區塊內的次層切換，例如編輯頁的分區。</p>
      ${demo({ id: 'demo-card', label: '卡片型範例', items: CARD, variant: 'card' })}
    </div>
    <h3>工作區 workspace</h3>
    <p class="component-description">只用於 shell 的已開啟頁面列，一般頁面內不要用這個變化。一個頁籤代表一個還活著、狀態被保留的頁面（搜尋條件與填到一半的表單都還在），X 就是釋放它的手段：關閉會一併清掉該頁的快取與暫存的搜尋條件，然後接到相鄰的頁籤。首頁是常駐頁籤，沒有關閉鈕；上限 10 個，開第 11 頁時自動關掉最舊的那一個。</p>
    ${tabs({ id: 'demo-workspace', label: '工作區頁籤範例', items: WORKSPACE, variant: 'workspace', active: 'guide', panels: false })}
  </section>

  <section class="card token-table tabs-token">
    <h2>共用規格</h2>
    <div>
      <span>頁籤高度</span><strong>36px</strong>
      <span>觸控高度</span><strong>44px</strong>
      <span>字級／字重</span><strong>14px / 600</strong>
      <span>底線型間距</span><strong>16px</strong>
      <span>作用中底線</span><strong>3px #1596AD</strong>
      <span>未作用文字</span><strong>#718096</strong>
      <span>分隔線</span><strong>1px #DCE2EB</strong>
      <span>卡片型高度</span><strong>36px / 圓角 4px 4px 0 0</strong>
      <span>卡片型作用中</span><strong>白底 / 整圈 #1596AD 外框 / 字重 700</strong>
      <span>卡片型未選取</span><strong>#F1F4F8 底 / #DCE2EB 外框</strong>
      <span>計數標記</span><strong>12px / 圓角 9px</strong>
      <span>作用中計數</span><strong>#E7F7FA / #1596AD</strong>
      <span>停用文字</span><strong>#B6C0CC</strong>
      <span>Focus ring</span><strong>2px #1596AD（內縮 3px）</strong>
    </div>
  </section>

  <section class="card guide-rules">
    <h2>使用規則</h2>
    <div class="rule-grid">
      <div><strong>頁籤不換頁</strong><p>切換頁籤只換同一份資料的切面；會換標題或換權限範圍的，用側欄的獨立頁面，不要做成頁籤。</p></div>
      <div><strong>一頁最多兩層</strong><p>第一層用底線型，第二層用卡片型；需要第三層代表資訊架構有問題，應拆頁。</p></div>
      <div><strong>手機二選一</strong><p>≤ 4 個短標籤用橫向捲動並自動捲到目前頁籤；≥ 5 個或標籤字長改用共用 Select。</p></div>
      <div><strong>數量用計數標記</strong><p>標籤文字只放名稱，數量用 bo-tab-count；沒有數字時不保留空的標記位置。</p></div>
      <div><strong>無權限不渲染</strong><p>沒有檢視權限的分頁直接不輸出；停用只用於暫時不可用，並以 Tooltip 說明原因。</p></div>
      <div><strong>有變更先問</strong><p>分頁內有未儲存表單時攔下切換並開確認彈窗，不可靜默丟棄使用者輸入。</p></div>
      <div><strong>工作區頁籤有上限</strong><p>首頁常駐不可關閉，其餘上限 10 個；超過自動關掉最舊的一個，避免保留的頁面狀態無限增加。</p></div>
    </div>
  </section>
</div>`


listen('tab-close', event => {
  if (event.target.dataset?.tabs !== 'demo-workspace') return
  const rail = event.target.querySelector('.bo-tabs-scroll')
  if (rail && !rail.querySelector('[data-tab-key]')) rail.innerHTML = '<p class="tabs-workspace-empty">頁籤都關掉了，重新進入這一頁可以復原。</p>'
})
