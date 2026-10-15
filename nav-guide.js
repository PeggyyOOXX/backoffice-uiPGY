// 移植：el-menu / el-sub-menu / el-menu-item（正式後台為 Side.vue）與 el-breadcrumb。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 側欄與麵包屑放同一頁：它們回答的是同一個問題——「我現在在哪裡」。
// 麵包屑單獨開一頁太薄（正式後台只有 3 個檔案在用，其中一個是 layout），
// 而且它的規則有一半是在講「跟側欄的關係」。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import './guide-page.css'
import './nav-guide.css'

const SIDE_ITEMS = [
  { label: '會員管理', icon: 'members', level: 1, children: [
    { label: '會員列表', level: 2, active: true },
    { label: '等級群組', level: 2 },
    { label: '會員標籤', level: 2 },
  ] },
  { label: '金流管理', icon: 'finance', level: 1, collapsed: true },
  { label: '報表中心', icon: 'reports', level: 1, collapsed: true },
]

const sideDemo = () => `<nav class="nav-demo" aria-label="側欄導覽示意">
  ${SIDE_ITEMS.map(item => `
    <div class="nav-demo-item is-l1${item.children ? ' is-open' : ''}">
      ${icon(item.icon, 20)}<span>${item.label}</span>
      ${icon(item.children ? 'arrowUp' : 'arrowDown', 16)}
    </div>
    ${(item.children ?? []).map(child =>
      `<div class="nav-demo-item is-l2${child.active ? ' is-active' : ''}">${child.label}</div>`).join('')}
  `).join('')}
</nav>`

const crumbDemo = () => `<nav class="crumb-demo" aria-label="麵包屑示意">
  <ol>
    <li><a href="#nav-guide" onclick="event.preventDefault()">會員管理</a></li>
    <li aria-hidden="true">${icon('arrowRight', 14)}</li>
    <li><a href="#nav-guide" onclick="event.preventDefault()">會員列表</a></li>
    <li aria-hidden="true">${icon('arrowRight', 14)}</li>
    <li aria-current="page">Ava Chen（MB-009821）</li>
  </ol>
</nav>`

const DECISION = [
  ['在站台的哪一區', '<strong>側欄</strong>', '常駐，所有頁面都看得到，一眼知道有哪些功能'],
  ['從列表進到某一筆的詳情', '<strong>麵包屑</strong>', '側欄只標到列表那一層，麵包屑補上「哪一筆」'],
  ['同一份資料的不同切面', '頁籤 Tabs', '不改變頁面標題也不改變網址層級'],
  ['已開啟並保留狀態的頁面', '工作區頁籤', '與側欄無關，是使用者自己開的清單'],
  ['只有兩層（區 → 頁）', '不要用麵包屑', '側欄已經標出來了，麵包屑只是重複'],
]

window.renderNavPage = () => guidePage({
  slug: 'nav',
  title: '導覽 Navigation',
  intro: '回答「我現在在哪裡」的兩個元件。側欄是常駐的站台地圖，麵包屑補上側欄標不到的那幾層。正式後台的側欄是 <code>Side.vue</code>（<code>el-menu</code>），麵包屑用 <code>el-breadcrumb</code>。',
  sections: [
    {
      heading: '側欄選單',
      body: `<div class="guide-stage nav-demo-stage">${sideDemo()}</div>
        <p class="component-description">最多三層。第一層有圖示（20px）與展開箭頭，第二層起只有文字、靠縮排表達層級。作用中的項目是整組裡顏色最重的一塊。</p>
        <p class="component-description"><strong>沒有檢視權限的項目不渲染，不是變灰。</strong>正式後台的 <code>Side.vue</code> 已經把側欄過濾成只剩有 <code>.read</code> 權限的項目——看得到卻點不了只會讓人一直問「為什麼不能點」。</p>`,
    },
    {
      heading: '麵包屑',
      body: `<div class="guide-stage">${crumbDemo()}</div>
        <p class="component-description">只在<strong>側欄標不到的層級</strong>出現：從列表進到某一筆詳情時，側欄仍停在「會員列表」，麵包屑補上這一筆是誰。最後一層是目前位置，不是連結，標 <code>aria-current="page"</code>。</p>`,
    },
    { heading: '哪個元件回答哪個問題', body: decisionTable(DECISION) },
    {
      heading: '與工作區頁籤的關係',
      body: `<p class="component-description">三者各自獨立，不要互相連動：</p>
        <ul class="nav-guide-list">
          <li><strong>側欄</strong>＝站台有什麼功能（固定不變）</li>
          <li><strong>工作區頁籤</strong>＝我開了哪些頁面（使用者自己決定，有上限 10 個）</li>
          <li><strong>麵包屑</strong>＝目前這一頁在哪一層（跟著內容走）</li>
        </ul>
        <p class="component-description">常見的錯是把麵包屑做成可以「往回關掉頁籤」，或讓側欄隨工作區頁籤跳動。切換工作區頁籤時側欄的作用中項目要跟著換，但<strong>反過來不成立</strong>——點側欄是開新頁，不是切換已開的頁籤。</p>`,
    },
  ],
  tokens: [
    ['側欄寬度', '248px'],
    ['第一層高度', '40px'],
    ['第一層圖示', '20px'],
    ['第二層縮排', '34px'],
    ['第三層縮排', '48px'],
    ['第二／三層字級', '13px / 12px'],
    ['作用中', '品牌漸層底、白字'],
    ['最多層數', '3'],
    ['麵包屑字級', '13px'],
    ['麵包屑分隔', '14px 圖示'],
    ['麵包屑最後一層', '不是連結，aria-current="page"'],
    ['麵包屑最多', '4 層，超過中間折疊為 …'],
  ],
  rules: [
    ['無權限的項目不渲染', '不是變灰——看得到卻點不了只會讓人一直問為什麼。權限過濾在側欄就做完。'],
    ['側欄最多三層', '第四層代表功能分類有問題，應該拆成兩個第一層。'],
    ['麵包屑只補側欄標不到的層', '只有兩層（區 → 頁）時不要放麵包屑，那只是重複側欄。'],
    ['最後一層不是連結', '目前位置不該可點；標 aria-current="page" 讓報讀器讀得出來。'],
    ['三者不互相連動', '側欄＝有什麼功能、工作區頁籤＝開了哪些頁、麵包屑＝在哪一層，各自獨立。'],
    ['用 nav + ol', '麵包屑本質是有序清單，分隔符號要 aria-hidden，不要讓報讀器唸出箭頭。'],
  ],
})
