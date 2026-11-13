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

// 示範直接套用真正的側欄 class（.sidebar / .nav / .nav-item / .nav-level-2），
// 不自己複製一份配色。先前用 .nav-demo-* 抄了一組數值，側欄改版後就對不上了——
// 規範頁示範的東西長得跟實物不一樣，比沒有示範更糟。
const sideDemo = () => `<div class="nav-demo-shell sidebar">
  <nav class="nav" aria-label="側欄導覽示意">
    ${SIDE_ITEMS.map(item => `
      <div class="nav-item">
        ${icon(item.icon, 20)}<span class="nav-demo-label">${item.label}</span>
        ${icon(item.children ? 'arrowUp' : 'arrowDown', 16)}
      </div>
      ${(item.children ?? []).map(child =>
        `<div class="nav-item nav-level-2${child.active ? ' active' : ''}">${child.label}</div>`).join('')}
    `).join('')}
  </nav>
</div>`

// 收合開關的示範：同一個側欄示範，底部多一顆真正的 .nav-collapse（不帶 id，所以按了不會真的收合）。
const collapseDemo = () => `<div class="nav-demo-shell sidebar nav-demo-collapse">
  <nav class="nav" aria-label="側欄導覽示意">
    ${SIDE_ITEMS.map(item => `<div class="nav-item">${icon(item.icon, 20)}<span class="nav-demo-label">${item.label}</span></div>`).join('')}
  </nav>
  <button type="button" class="nav-item nav-collapse" aria-label="收合側欄（示意）" data-tooltip="收合側欄（Ctrl + B）" data-tooltip-placement="right">${icon('panelLeft', 16)}</button>
</div>`

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
      body: `${sideDemo()}
        <p class="component-description">最多三層。第一層有圖示（20px）與展開箭頭，第二層起只有文字、靠縮排表達層級。作用中的項目<strong>反轉明暗</strong>——淺色漸層底配深色文字，在深色側欄上是對比最強的一塊，而且滿版延伸到兩側邊緣。</p>
        <p class="component-description">這一段示範直接套用側欄本身的 <code>.sidebar</code> / <code>.nav-item</code> 樣式，不是另外抄一份；側欄改版時這裡會跟著變，不會再出現「規範頁長得跟實物不一樣」。</p>
        <p class="component-description"><strong>沒有檢視權限的項目不渲染，不是變灰。</strong>正式後台的 <code>Side.vue</code> 已經把側欄過濾成只剩有 <code>.read</code> 權限的項目——看得到卻點不了只會讓人一直問「為什麼不能點」。</p>`,
    },
    {
      heading: '麵包屑',
      body: `<div class="guide-stage">${crumbDemo()}</div>
        <p class="component-description">只在<strong>側欄標不到的層級</strong>出現：從列表進到某一筆詳情時，側欄仍停在「會員列表」，麵包屑補上這一筆是誰。最後一層是目前位置，不是連結，標 <code>aria-current="page"</code>。</p>`,
    },
    {
      heading: '收合側欄',
      body: `${collapseDemo()}
        <p class="component-description"><strong>位置：側欄左下角，放在 <code>.nav</code> 捲動區的外面</strong>，距左、下邊各 4px。側欄有幾十個項目會捲動，開關在捲動區外面才不會跟著捲走。只有桌機（721px 以上）有這顆；手機的側欄是抽屜，開關是頁首左側的漢堡。</p>
        <p class="component-description"><strong>外觀：24 × 24 的純圖示按鈕</strong>，圖示 Lucide <code>panel-left</code> 16px，顏色 <code>var(--text-faint)</code>、沒有底色，hover 也不變色、不加底色，只有透明度在變：靜止 <code>.3</code>、游標進到側欄 <code>.45</code>、滑到按鈕本身或鍵盤聚焦 <code>.7</code>；收合後它是唯一的回頭路，靜止提高到 <code>.5</code>、游標進到側欄 <code>.7</code>，並在 72px 的圖示軌裡置中。hover 的範圍是<strong>整個側欄</strong>，不必先找到按鈕才看得到它。</p>
        <p class="component-description"><strong>24 × 24 是全站唯一比 32px 小的控制項，是具名例外</strong>：它不是對資料的操作、不與任何輸入框對齊、另有快捷鍵可用，而且仍在 WCAG 2.5.8 AA 的 24 × 24 下限上。這個尺寸不得帶到任何其他按鈕。</p>
        <p class="component-description"><strong>名稱與快捷鍵放在 aria-label 與 Tooltip</strong>，兩邊文字一致：展開時「收合側欄（Ctrl + B）」、收合後「展開側欄（Ctrl + B）」，Tooltip 朝右。按鈕帶 <code>aria-expanded</code> 與 <code>aria-controls="sidebar"</code>。快捷鍵 <code>Ctrl / Cmd + B</code>。圖示不用箭頭——左上角的箭頭讀起來是「回到上一頁」。</p>
        <p class="component-description"><strong>收合後是 72px 的圖示軌，不整條收掉</strong>：第一層只剩圖示，每一項掛同名的 Tooltip（朝右），展開時拿掉；有子選單的項目點下去開飛出面板（見下一段）。logo 區高度不變，圖片等比縮進軌寬內。</p>
        <p class="component-description"><strong>移植：</strong>正式後台的開關是 <code>Header.vue</code> 左側的 <code>hamburger</code> 圖示，呼叫 <code>useSidebarStore().toggle()</code>，<code>Side.vue</code> 的 <code>el-menu</code> 收到 <code>:collapse</code> 後縮成 <code>w-[72px]</code>。移植時把開關搬到側欄底部，改成 <code>&lt;button&gt;</code>，補上 <code>aria-expanded</code>、Tooltip 與快捷鍵；收合的狀態仍由 <code>useSidebarStore</code> 管。</p>`,
    },
    {
      heading: '收合後的第二、三層：飛出面板',
      body: `<p class="component-description">收合之後第一層只剩一個圖示，底下兩層<strong>原地展開是沒有用的</strong>——72px 的軌放不下任何文字，展開只會多出幾列空白。做法與 Element Plus 一樣：子選單變成一個<strong>飛出面板</strong>，從那個圖示的右邊浮出來。<code>el-menu</code> 的 <code>popper-offset</code>、<code>popper-effect</code>、<code>show-timeout</code> 與 <code>el-sub-menu</code> 的 <code>teleported</code> 講的就是這件事，正式後台的 <code>Side.vue</code> 直接吃到這個行為，原型自己做了一份同樣的。</p>
        <p class="component-description"><strong>第一層要代替子項顯示作用中。</strong>收合之後第二、三層在軌上看不到，人在「第三層」那一頁時，軌上唯一能告訴他現在在哪裡的就是第一層那個圖示。所以子項作用中時，<strong>第一層掛的是一般的 <code>.active</code></strong>——樣子與其他作用中項目一模一樣，不另外發明記號。展開之後要把作用中讓回去，否則兩個地方同時在說「你在這裡」。</p>
        <p class="component-description">原型先前在有子選單的圖示旁加了一顆 4px 的點當記號，已移除：那顆點只說「這裡有子選單」，不說「你現在在哪一頁」，而後者才是軌上真正缺的資訊；而且它和站上任何語彙都對不上。面板開著時那顆圖示仍然反白，讓人知道是它開的。</p>
        <p class="component-description"><strong>面板一定要搬到 <code>&lt;body&gt;</code>，<code>position: fixed</code> 不夠。</strong>這是原型實際踩到的坑：<code>.sidebar .nav</code> 身上有 <code>mask-image</code>（捲動提示的上下緣淡出），而<strong>遮罩會把所有後代裁進 <code>.nav</code> 自己的盒子</strong>——<code>fixed</code> 逃得出捲動容器，逃不出遮罩，面板整個被切掉，畫面上的表現就是「點了完全沒反應」。EP 的 <code>teleported</code> 預設把第一層的 popper 送到 <code>body</code>，為的就是這件事。原型把真正的 <code>.nav-children</code> 節點搬進 body 底下的面板，關閉時再搬回去——搬節點而不是複製一份，事件與狀態才跟著走。</p>
        <p class="component-description"><strong>搬過去之後要把 <code>display</code> 打開。</strong><code>.nav-children</code> 在側欄裡預設是 <code>display: none</code>，靠父層的 <code>.is-open</code> 才打開；搬到面板之後那個父層不在了，少了這一條面板會是一個空盒子，看起來還是「點了沒反應」。</p>
        <p class="component-description"><strong>作用中項目的「滿版」要在面板裡關掉。</strong>側欄的作用中項目是刻意滿版的：<code>width: calc(100% + 16px)</code> 配左右各 −8px 的外推、方角、再加一個咬進內容區的白色尖角，為的是讓它從側欄的一邊延伸到另一邊。搬進 176px 的面板之後這一套全錯——色塊會超出面板的圓角邊界，尖角則指向一片空白。面板裡的作用中項目要回到一般的盒子：不外推、有圓角、不畫尖角，字級也維持 12px（側欄的作用中會放大到 16px，在窄面板裡會讓高度每開一次都不一樣）。</p>
        <p class="component-description"><strong>關閉的出口要齊。</strong>點面板外面、選了其中一項、按 Esc、側欄捲動、視窗改變大小都要關；按 Esc 還要把焦點送回那個圖示，否則焦點會掉回畫面開頭。面板一次只開一個，而且側欄一展開就關掉並把子選單搬回側欄——否則展開之後第二、三層會整個不見。</p>`,
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
    ['側欄寬度', 'min(276px, 100vw − 56px)'],
    ['項目高度', '36px'],
    ['項目圓角', '8px'],
    ['第一層圖示', '20px'],
    ['字級', '14px（作用中 16px）'],
    ['第二層縮排', '32px / #98ADBA'],
    ['第三層縮排', '48px / #8EA5B2'],
    ['側欄底色（站長）', '左右漸層 --sidebar-owner #0F1427 → --sidebar-owner-end #46517B'],
    ['側欄底色（代理）', '左右漸層 --sidebar-agent #1F0E17 → --sidebar-agent-end #66304A（?role=agent）'],
    ['作用中底色', '上下漸層 var(--nav-active-from) #FEF7E8 → var(--nav-active-to) #EAC09E'],
    ['作用中文字', 'var(--sidebar)，隨角色（深色，不是白字）'],
    ['作用中寬度', '滿版，左右各外推 8px'],
    ['最多層數', '3'],
    ['收合後的側欄寬度', '72px（圖示軌，同正式後台 w-[72px]）'],
    ['收合開關', '側欄左下角 24 × 24（具名例外），.nav 捲動區外'],
    ['開關距邊', '4px'],
    ['開關透明度', '0.3 ／ 側欄 hover 0.45 ／ 自身 hover 0.7；收合後 0.5 ／ 側欄 hover 0.7'],
    ['開關顏色', 'var(--text-faint)，三態不變'],
    ['收合開關圖示', 'panel-left（16px）'],
    ['收合快捷鍵', 'Ctrl / Cmd + B（寫在 Tooltip 裡）'],
    ['子項作用中時', '第一層掛 .active，與其他項目同一個樣子'],
    ['飛出面板寬度', '最小 176px'],
    ['飛出面板層級', 'var(--z-popover)'],
    ['麵包屑字級', '12px'],
    ['麵包屑分隔', '14px 圖示'],
    ['麵包屑最後一層', '不是連結，aria-current="page"'],
    ['麵包屑最多', '4 層，超過中間折疊為 …'],
  ],
  rules: [
    ['兩個角色只差側欄底色', '站長與代理後台的內容相同，差別只在 --sidebar／--sidebar-end（由 html 的 data-role 切換）。作用中項目的淺杏、品牌色與其他顏色兩個角色共用。'],
    ['--sidebar 只給側欄用', '它會隨角色變色，只能用在側欄漸層、作用中文字、飛出面板、.app 外框與頁首的身分鈕。Tooltip 用 --surface-inverse，一般文字用 --text，不得引用 --sidebar。定義在 blue-teal-palette-override.css 的 :root，不得寫死色碼。'],
    ['無權限的項目不渲染', '不是變灰——看得到卻點不了只會讓人一直問為什麼。權限過濾在側欄就做完。'],
    ['側欄最多三層', '第四層代表功能分類有問題，應該拆成兩個第一層。'],
    ['麵包屑只補側欄標不到的層', '只有兩層（區 → 頁）時不要放麵包屑，那只是重複側欄。'],
    ['最後一層不是連結', '目前位置不該可點；標 aria-current="page" 讓報讀器讀得出來。'],
    ['三者不互相連動', '側欄＝有什麼功能、工作區頁籤＝開了哪些頁、麵包屑＝在哪一層，各自獨立。'],
    ['用 nav + ol', '麵包屑本質是有序清單，分隔符號要 aria-hidden，不要讓報讀器唸出箭頭。'],
    ['收合開關放側欄左下角', '在 .nav 捲動區外面、距邊 4px，不放頁首。24 × 24 純圖示，名稱與快捷鍵在 aria-label 與 Tooltip。'],
    ['24 × 24 只有這一顆', '具名例外：不是對資料的操作、不與輸入框對齊、另有快捷鍵，而且踩在 WCAG 2.5.8 AA 的下限上。不得帶到其他按鈕。'],
    ['hover 不變亮、不加底色', '顏色三態鎖在 var(--text-faint)，只有透明度動（.3 / 側欄 hover .45 / 自身 hover .7）。回饋交給游標與 Tooltip。'],
    ['hover 的範圍是整個側欄', '游標進到側欄，開關就稍微浮出來；不必先找到按鈕才看得到它。'],
    ['面板裡要關掉滿版', '側欄的作用中項目左右各外推 8px 又是方角，搬進 176px 的面板會超出圓角邊界；尖角也要關，它連的是側欄與內容區。'],
    ['不要用箭頭，用 panel-left', '左上角的箭頭是「回到上一頁」。panel-left 是 VS Code、Notion、shadcn/ui 共用的側欄開關圖示。'],
    ['快捷鍵寫在 Tooltip 名稱後面', 'Ctrl / Cmd + B。純圖示按鈕的提示本來就要出現，順道把鍵帶出去，不必另外佔一塊版面。'],
    ['收成圖示軌，不整條收掉', '收掉之後導覽完全消失；留 72px 的圖示軌，站台地圖還在。'],
    ['第一層代替子項顯示作用中', '收合後第二、三層看不到，軌上只剩第一層能說「你在這裡」。用一般的 .active，不發明新記號；展開後要讓回去。'],
    ['尖角與展開箭頭共用 ::after', '兩條權重都是 (0,2,1)，比的是層疊順序。尖角的 transform 必須宣告在箭頭之後，否則同時是 [data-toggle] 又是 .active 的項目會長出一個轉了 45 度的尖角。layout-check 會驗順序。'],
    ['飛出面板要搬到 body', '光用 position: fixed 不夠——.nav 的 mask-image 會把後代裁進 .nav 的盒子，面板會整個不見。搬過去之後還要把 display 打開。'],
    ['手機不做收合', '圖示軌靠 Tooltip 辨識，而觸控沒有 hover。手機的側欄維持抽屜，開關換回頁首的漢堡。'],
  ],
})
