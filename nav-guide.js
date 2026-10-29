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
    {
      heading: '收合側欄',
      body: `<p class="component-description">正式後台已經有這件事：<code>Header.vue</code> 最左邊那顆 <code>hamburger</code> 圖示呼叫 <code>useSidebarStore().toggle()</code>，<code>Side.vue</code> 的 <code>el-menu</code> 收到 <code>:collapse</code> 之後從 <code>w-[280px]</code> 縮成 <code>w-[72px]</code>。原型照同一套做，補上它沒做的四件：用 <code>&lt;button&gt;</code> 而不是帶 <code>cursor-pointer</code> 的 <code>&lt;svg&gt;</code>、<code>aria-expanded</code>、收合後每一項的 Tooltip、以及鍵盤快捷鍵。</p>
        <p class="component-description">開關放哪裡，市面上四種做法：</p>
        ${decisionTable([
          ['<strong>側欄底部</strong>', 'Ant Design 的 <code>Layout.Sider</code>（<code>triggerHeight: 48</code>）', '<strong>本站採用，但只取位置。</strong>在側欄裡，不碰內容區；在最底下，不跟導覽搶視線。Ant 那條是 48px 的實心橫條，本站縮成 32 × 32 的純圖示'],
          ['頁首最左的漢堡', 'Gmail、多數後台框架、<strong>正式後台的 Header.vue</strong>', '位置與圖示都是既定語彙；但它佔的是內容區的頁首，而側欄的開關不是內容的事'],
          ['側欄右緣的細條', 'Linear（點側欄邊框）、shadcn/ui 的 <code>SidebarRail</code>', '最不打擾，但<strong>沒有人會知道側欄可以收</strong>。原型試過，結論是不行'],
          ['<code>«</code> / <code>»</code> 按鈕', 'Notion（<code>cmd/ctrl + \\</code>）', '方向明確，但那兩個字元不在本專案的圖示清單上'],
        ], ['做法', '誰在用', '取捨'])}
        <p class="component-description"><strong>「不明顯」有三件事要分開談：位置、面積、亮度。</strong>原型在這裡改了五版才收斂：頁首的箭頭（被讀成「回到上一頁」）→ 頁首的漢堡（佔的是內容區的頁首）→ 側欄右緣只有 hover 才顯形的細條（沒有人知道可以收）→ 側欄底部一整列帶文字（語意最清楚，但那是一個 <strong>224 × 36 的色塊</strong>貼在側欄底部，壓再淡都還是一個「區塊」）→ 現在的版本。</p>
        <p class="component-description">現在是<strong>側欄左下角、距邊 4px 的一顆 24 × 24 純圖示按鈕</strong>，圖示 16px。文字與快捷鍵由 Tooltip 承擔——純圖示按鈕本來就一定要有 aria-label 與同文字的提示，所以這不是把資訊丟掉，是換一個不佔版面的地方放。</p>
        <p class="component-description"><strong>24 × 24 是全站唯一比 32 小的控制項，而且是具名例外。</strong>理由：它不是對資料的操作，不與任何輸入框對齊，另有 <code>Ctrl / Cmd + B</code> 這條快車道，而 24 × 24 仍踩在 WCAG 2.5.8 AA 的下限上。這個尺寸<strong>不得帶到任何其他按鈕</strong>——站上先前有四種按鈕高度，就是從「這裡小一點」開始的。</p>
        <p class="component-description"><strong>hover 不變亮、不加底色。</strong>導覽項目的 hover 是白字加一層白底，那是「這一列可以點」的回饋；這一顆的目的是盡量不存在，所以顏色三態都鎖在 <code>var(--text-faint)</code>，只有透明度在動：靜止 <code>.3</code>、游標進到側欄 <code>.45</code>、滑到它自己身上 <code>.7</code>。回饋交給游標與 Tooltip 就夠了。</p>
        <p class="component-description">這一層的關鍵是 <strong>hover 的範圍是整個側欄，不是那顆按鈕本身</strong>。Notion 的側欄控制項也是這樣——平時不在，游標靠近才出現。先前那條 8px 的細條之所以失敗，是因為要先找到它才看得到它；側欄是導覽，使用者本來就會把游標移過去。收合之後這顆是唯一的回頭路，靜止透明度提高到 <code>.5</code>。</p>
        <p class="component-description">圖示用 Lucide 的 <code>panel-left</code>，與 VS Code 的 Toggle Primary Side Bar、Notion、shadcn/ui 的 <code>SidebarTrigger</code> 同一個。<strong>不要用箭頭</strong>：左上角的 <code>←</code> 在整個網路上都是「回到上一頁」。快捷鍵是 <code>Ctrl / Cmd + B</code>（VS Code 與 shadcn/ui 都是這個鍵，照用不自創），寫在 Tooltip 的名稱後面：<code>收合側欄（Ctrl + B）</code>。</p>
        <p class="component-description"><strong>開關放在 <code>.nav</code> 外面。</strong>側欄的捲動區有 35 個項目，開關如果在裡面就會跟著捲走——GitLab 正是踩了這個，收合後的開關跟著頁面捲動，使用者得先捲回頂端才找得到。</p>
        <p class="component-description"><strong>收成 72px 的圖示軌，不要整條收掉。</strong>收掉之後導覽完全消失，使用者得先想起「它在哪」才找得回來。每一項要掛 Tooltip（純圖示一定要同時有 aria-label 與同文字的提示），而且<strong>不能只靠 hover</strong>：觸控裝置沒有 hover，所以手機不做收合，側欄維持抽屜，開關換回頁首的漢堡。</p>
        <p class="component-description">原型的側欄是<strong>平鋪 35 項</strong>，收起來是一長條圖示，要捲很久才找得到最底下那一個；正式後台是兩層選單，收合後只剩約 10 個第一層圖示。移植時不必照抄原型的密度。</p>`,
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
  ],
  tokens: [
    ['側欄寬度', 'min(276px, 100vw − 56px)'],
    ['項目高度', '36px'],
    ['項目圓角', '8px'],
    ['第一層圖示', '20px'],
    ['字級', '14px（作用中 16px）'],
    ['第二層縮排', '32px / #98ADBA'],
    ['第三層縮排', '48px / #8EA5B2'],
    ['側欄底色', '左右漸層 var(--sidebar) #2A2220 → var(--sidebar-end) #50403A'],
    ['作用中底色', '上下漸層 var(--nav-active-from) #D2AE7E → var(--nav-active-to) #785330'],
    ['作用中文字', 'var(--sidebar) #2A2220（深色，不是白字）'],
    ['作用中寬度', '滿版，左右各外推 8px'],
    ['最多層數', '3'],
    ['收合後的側欄寬度', '72px（圖示軌，同正式後台 w-[72px]）'],
    ['收合開關', '側欄左下角 24 × 24（具名例外）'],
    ['開關距邊', '4px'],
    ['開關透明度', '0.3 ／ 側欄 hover 0.45 ／ 自身 hover 0.7'],
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
    ['側欄配色只用四支 token', '底色 --sidebar → --sidebar-end（左右）、作用中 --nav-active-from → --nav-active-to（上下），定義在 blue-teal-palette-override.css 的 :root。Tooltip、飛出面板與 .app 外框吃同一組，不得寫死色碼——改一支側欄色，從側欄長出來的東西要一起跟上。'],
    ['無權限的項目不渲染', '不是變灰——看得到卻點不了只會讓人一直問為什麼。權限過濾在側欄就做完。'],
    ['側欄最多三層', '第四層代表功能分類有問題，應該拆成兩個第一層。'],
    ['麵包屑只補側欄標不到的層', '只有兩層（區 → 頁）時不要放麵包屑，那只是重複側欄。'],
    ['最後一層不是連結', '目前位置不該可點；標 aria-current="page" 讓報讀器讀得出來。'],
    ['三者不互相連動', '側欄＝有什麼功能、工作區頁籤＝開了哪些頁、麵包屑＝在哪一層，各自獨立。'],
    ['用 nav + ol', '麵包屑本質是有序清單，分隔符號要 aria-hidden，不要讓報讀器唸出箭頭。'],
    ['收合開關放側欄左下角', '不要放頁首（那是內容區的頁首）。24 × 24、距邊 4px，文字與快捷鍵交給 Tooltip——不明顯不只是壓亮度，面積更關鍵：一整列再淡都還是一個區塊。'],
    ['24 × 24 只有這一顆', '具名例外：不是對資料的操作、不與輸入框對齊、另有快捷鍵，而且踩在 WCAG 2.5.8 AA 的下限上。不得帶到其他按鈕。'],
    ['hover 不變亮、不加底色', '顏色三態鎖在 var(--text-faint)，只有透明度動（.3 / 側欄 hover .45 / 自身 hover .7）。回饋交給游標與 Tooltip。'],
    ['hover 的範圍是整個側欄', '不是把控制項藏到「要先找到它才看得到」的地方。'],
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
