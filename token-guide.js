// 設計 Token：色彩、字級、間距、斷點、版面格線。所有元件規範都依賴這一頁。
//
// 色彩與字級用原型自己的（這份原型本來就是 redesign，不沿用正式後台的舊色票）。
// **斷點用正式後台的**：斷點決定 RWD 行為，兩邊不一致的話同一個版面在原型與正式後台
// 會在不同寬度換排法，移植時會整批重調。正式後台的斷點來自 tailwind.config.ts，
// 數值本來就對齊 Element Plus（sm 768 / md 992 / lg 1200 / xl 1920）。
import { guidePage, decisionTable, remPx } from "./guide-page.js";
import { icon } from "./icons.js";
import "./guide-page.css";
import "./token-guide.css";

// 語意色：與「按鈕 Button」同一組，這裡是它們的單一來源說明
const SEMANTIC = [
  ["btn-search", "#1596AD", "品牌主要操作", "搜尋、確認、主要送出"],
  ["btn-add", "#8354BC", "建立／新增", "新增資料"],
  ["btn-edit", "#4169C9", "編輯／調整", "編輯、排序、批次審核"],
  ["btn-record", "#6d8aae", "查看／紀錄", "詳情、歷程、預覽"],
  ["btn-export", "#12b157", "匯出／下載", "下載、產生報表；也用於成功狀態"],
  ["btn-warning", "#F59E0B", "提醒／注意", "警告訊息、待審核狀態"],
  ["btn-danger", "#DC2626", "危險操作", "刪除、拒絕；也用於錯誤與停用狀態"],
  ["btn-neutral", "#a3a3a3", "中性／工具操作", "關閉、取消、返回、刷新、重設"],
];

// 介面色：CSS 變數，定義在 styles/ 的層疊最後一層
const SURFACE = [
  ["--text", "#17282E", "正文"],
  ["--text-subtle", "#4A5568", "次要正文：說明段落、狀態敘述"],
  ["--text-muted", "#718087", "輔助文字：Label、欄名、單位、計數"],
  ["--text-faint", "#98A2B3", "佔位與停用文字"],
  ["--line-faint", "#EDF0F4", "最輕的線：列底線、卡片內的格線"],
  ["--line", "#E1E9E9", "框線、分隔線（畫在白底上）"],
  ["--line-strong", "#C6D1DB", "有底色的區塊上的線：表頭分隔線、手機卡片外框"],
  ["--line-control", "#DCE2EB", "控制項框線：輸入框、下拉、日期欄位、選項卡片"],
  ["--card", "#FFFFFF", "卡片底"],
  ["--surface", "#F7F8FB", "淺底：區塊標頭、停用底"],
  ["--surface-hover", "#F1F4F8", "hover 底"],
  ["--surface-head", "#E9EDF4", "表頭與合計列底（表頭文字用 --text-subtle）"],
  ["--bg", "#DFE3E8", "頁面底"],
  ["--sidebar", "#2A2220", "側欄底（左右漸層的左端）；Tooltip、飛出面板底與作用中項目的文字"],
  ["--sidebar-end", "#50403A", "側欄漸層的右端；.app 外框底同色，與側欄接成一片"],
  ["--nav-active-from", "#D2AE7E", "側欄作用中項目，上下漸層的上端"],
  ["--nav-active-to", "#785330", "側欄作用中項目，上下漸層的下端"],
  ["--blue", "#1596AD", "品牌色（同 btn-search）"],
  ["--blue-ink", "#10707F", "品牌色深階：連結、強調文字（--blue 當文字只有 3.1:1）"],
  ["--blue-line", "#B9E3EA", "品牌色淺框線：捲軸拉桿、選取邊、狀態插圖"],
  ["--blue-tint", "#E7F7FA", "品牌色淺底"],
  ["--surface-row-hover", "#F1F8FA", "表格整列 hover（帶品牌色相，與中性的 --surface-hover 不同）"],
];

// 字級只用偶數，最小 12px
const TYPE = [
  ["頁面標題", "18px", "700", "topbar 的頁名"],
  ["區塊標題 h2", "16px", "650", "共用規格、使用規則"],
  ["小節標題 h3", "14px", "600", "卡片內的小節"],
  ["內文", "14px", "400", "表單、表格內容、按鈕文字（700）"],
  ["說明與輔助", "12px", "400", "component-description、Label、表頭、Tooltip、標籤、單位、計數"],
];

// 間距、圓角、定位都落在 4px 格線上
const SPACING = [
  ["4px", "緊鄰元素：圖示與文字、分頁按鈕之間、標籤之間"],
  ["8px", "按鈕之間、控制與文案之間、卡片內距、表格內距（上下）"],
  ["12px", "欄位之間、直排選項之間、表格內距（左右）"],
  ["16px", "區塊內的群組之間"],
  ["20px", "規範頁的區塊之間"],
  ["24px", "大段落之間"],
];

const RADIUS = [
  ["4px", "按鈕、標籤、Tooltip、分頁"],
  ["8px", "輸入框、下拉、卡片、日期面板"],
];

// 浮起的層級，定義在 styles/base.css 的 :root
const SHADOWS = [
  ["--shadow-sm", "0 4px 12px", "按鈕 hover 這類貼著原位的浮起"],
  ["--shadow-md", "0 8px 24px", "氣泡面板、Toast、批量操作列這類蓋在內容上的浮層"],
];

// 每一類數值要對齊的格線
const UNIT_RULES = [
  ["字級", "2px 的倍數（偶數），最小 12px", "12 / 14 / 16 / 18 / 20px", "13px、17px、19px"],
  ["間距（padding／margin／gap）", "4px 的倍數", "4 / 8 / 12 / 16 / 20 / 24px", "6px、9px、11px"],
  ["圓角", "4px 的倍數", "4 / 8 / 12 / 16px", "6px、7px、9px"],
  ["定位（top／right／bottom／left）", "4px 的倍數", "4 / 8 / 12px", "7px、9px"],
  ["陰影、字距、位移", "4px 的倍數；1–3px 的細線與光圈寫 px", "4 / 8 / 12 / 16 / 24px", "5px、7px、13px、0.3px"],
  ["寬高", "由內容推算，不強制格線", "32px（16 ＋ 8 × 2，描邊畫在內側）", "—"],
];

// 來自正式後台 tailwind.config.ts，數值對齊 Element Plus
const BREAKPOINTS = [
  ["xs", "0px", "手機直向", "單欄；輸入高度維持 32px，篩選列字級 16px"],
  ["sm", "768px", "手機橫向、小平板", "兩欄；側欄收成抽屜"],
  ["md", "992px", "平板", "三欄；側欄固定展開"],
  ["lg", "1200px", "筆電", "四欄；表格不再橫向捲動"],
  ["xl", "1920px", "大螢幕", "內容最大寬度，不再拉伸"],
];

const swatch = (hex, label, note) => `<div class="token-swatch">
  <span class="token-chip" style="background:${hex}"></span>
  <code>${hex}</code>
  <strong>${label}</strong>
  <small>${note}</small>
</div>`;

window.renderTokenPage = () =>
  guidePage({
    slug: "token",
    title: "設計 Token",
    intro:
      "色彩、字級、間距、斷點與版面格線的單一來源。所有元件規範都依賴這一頁——元件頁只說明怎麼用，數值一律回到這裡查。",
    sections: [
      {
        heading: "語意色",
        body: `<p class="component-description">八個語意色，依<strong>操作意圖</strong>而不是外觀命名。按鈕、標籤、訊息提示全部沿用這一組，不得另訂。</p>
        <div class="token-swatches">${SEMANTIC.map(([name, hex, label, use]) => swatch(hex, label, `${name}　${use}`)).join("")}</div>`,
      },
      {
        heading: "介面色",
        body: `<p class="component-description">版面與文字的中性色，以 CSS 變數提供，層疊最後一層為準。頁面不得直接寫死這些色碼，一律用變數。</p>
        <div class="token-swatches">${SURFACE.map(([name, hex, use]) => swatch(hex, name, use)).join("")}</div>`,
      },
      {
        heading: "字級",
        body: `<table class="token-table-grid">
          <thead><tr><th>用途</th><th>字級</th><th>字重</th><th>說明</th></tr></thead>
          <tbody>${TYPE.map(
            ([use, size, weight, note]) =>
              `<tr><td style="font-size:${size};font-weight:${weight}">${use}</td><td><code>${remPx(size)}</code></td><td><code>${weight}</code></td><td>${note}</td></tr>`,
          ).join("")}</tbody>
        </table>
        <p class="component-description">字級只用偶數、最小 12px。手機不另造一套字級，只調整排列與觸控範圍；<strong>篩選列的輸入字級維持 ${remPx("16px")}</strong>，因為 iOS Safari 對 16px 以下的輸入欄位會在聚焦時自動放大整頁。</p>`,
      },
      {
        heading: "間距",
        body: `<div class="token-spacing">${SPACING.map(
          ([size, use]) =>
            `<div class="token-space-row"><span class="token-space-bar" style="width:${size}"></span><code>${remPx(size)}</code><small>${use}</small></div>`,
        ).join("")}</div>
        <p class="component-description">只用 4px 的倍數，不要出現 6px、9px、11px 這種中間值。需要新的間距先問是不是版面結構有問題。</p>`,
      },
      {
        heading: "圓角",
        body: `<div class="table-wrap"><table class="token-table-grid">
          <thead><tr><th>圓角</th><th>用在哪裡</th></tr></thead>
          <tbody>${RADIUS.map(([size, use]) => `<tr><td><code>${remPx(size)}</code></td><td>${use}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="component-description">按鈕的圓角統一定義在 <code>button-corner-radius</code>，頁面不得另設。其他元件的圓角同樣只用 4px 的倍數。</p>`,
      },
      {
        heading: "陰影",
        body: `<div class="table-wrap"><table class="token-table-grid">
          <thead><tr><th>變數</th><th>位移／模糊</th><th>用在哪裡</th></tr></thead>
          <tbody>${SHADOWS.map(([name, size, use]) => `<tr><td><code>${name}</code></td><td><code>${remPx(size)}</code></td><td>${use}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="component-description">元件要浮起來就取這兩支變數，不自己挑數字。先前每個元件各寫一組，模糊半徑有 5／7／11／13／17／75px，同樣是「浮起來」卻深淺不一。聚焦光圈（<code>0 0 0 3px</code>）與 1px 的內描邊屬於框線，照框線例外寫 px。</p>`,
      },
      {
        heading: "單位與數值格線",
        body: `<p class="component-description"><strong>CSS 的尺寸一律寫 rem，換算為 px ÷ 16</strong>（根字級 16px）。文件與規格表一律寫成 <code>${remPx("16px")}</code>：rem 在前是 CSS 實際寫的值，括號內的 px 是畫面上的大小。不用 em，因為 em 跟著元素自己的字級走，同一個 <code>0.5em</code> 在 12px 的表頭和 14px 的內文會算出不同大小。</p>
        <div class="table-wrap"><table class="token-table-grid">
          <thead><tr><th>類別</th><th>格線</th><th>可用的值</th><th>不得出現</th></tr></thead>
          <tbody>${UNIT_RULES.map(([kind, grid, ok, bad]) => `<tr><td>${kind}</td><td>${grid}</td><td><code>${remPx(ok)}</code></td><td>${bad}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="component-description">維持 px 的三種例外：<strong>框線</strong>（border、outline 與 1–2px 的對齊微調，例如用 -1px 疊住底線；換成 rem 縮放後會變成 0.9px 而發糊）、<strong>@media 斷點</strong>（媒體查詢裡的 rem 依瀏覽器預設字級計算，不跟著 html）、<strong>JS 裡的數值</strong>（tooltip 定位這類計算拿到的是 px）。</p>`,
      },
      {
        heading: "斷點",
        body: `<p class="component-description"><strong>斷點沿用正式後台的 <code>tailwind.config.ts</code></strong>，數值本來就對齊 Element Plus。色彩與字級是這份原型重新定的，但斷點不能重定——斷點決定 RWD 行為，兩邊不一致的話同一個版面會在不同寬度換排法，移植時要整批重調。</p>
        <div class="table-wrap"><table class="token-breakpoint-table">
          <thead><tr><th>名稱</th><th>起始寬度</th><th>裝置</th><th>版面行為</th></tr></thead>
          <tbody>${BREAKPOINTS.map(
            ([name, px, device, layout]) =>
              `<tr><td><code>${name}</code></td><td><code>${px}</code></td><td>${device}</td><td>${layout}</td></tr>`,
          ).join("")}</tbody>
        </table></div>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon("cancelCircle")}目前的落差</h4><p>原型現在用的是 720 / 900 / 1100 / 1180，與正式後台的 768 / 992 / 1200 / 1920 完全不同。<code>max-width: 720px</code> 全站有 53 處，要逐步換成 <code>767.98px</code>（sm 的下界）。</p></div>
          <div class="is-good"><h4>${icon("checkCircle")}寫法</h4><p>往上加的用 <code>min-width</code>：<code>@media (min-width: 768px)</code>。往下蓋的用 <code>max-width: 767.98px</code>，避免與 768 同時命中。</p></div>
        </div>`,
      },
      {
        heading: "版面格線",
        body: `<p class="component-description">全站一套格線：<strong>12 欄、間距 16px</strong>。正式後台用 <code>el-row</code> / <code>el-col</code>（20 個檔案在用），原型用 CSS Grid，欄數一致。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon("cancelCircle")}目前的落差</h4><p>間距兩邊對不上：正式後台 <code>:gutter="10"</code> <strong>38 處</strong>、<code>20</code> 7 處、<code>16</code> 只有 1 處。10 不在 4px 格線上，而且同一個後台裡同時存在三種欄距。</p></div>
          <div class="is-good"><h4>${icon("checkCircle")}統一成 16px</h4><p>16 是 4px 的倍數，也是本頁間距級距的上限。移植時把 <code>:gutter</code> 全部改成 16，不保留 10 與 20。</p></div>
        </div>
        <div class="guide-stage">
          <div class="token-grid-demo">${Array.from({ length: 12 }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>
        </div>
        <p class="component-description">常用的欄位配置：</p>
        <div class="guide-stage token-grid-samples">
          <div class="token-grid-demo"><span class="span-3">3</span><span class="span-3">3</span><span class="span-3">3</span><span class="span-3">3</span></div>
          <div class="token-grid-demo"><span class="span-4">4</span><span class="span-4">4</span><span class="span-4">4</span></div>
          <div class="token-grid-demo"><span class="span-6">6</span><span class="span-6">6</span></div>
          <div class="token-grid-demo"><span class="span-8">8</span><span class="span-4">4</span></div>
        </div>
        ${decisionTable(
          [
            [
              "篩選列的欄位",
              "每欄 3（一列四欄）",
              "與搜尋結果頁的四欄篩選一致",
            ],
            ["設定頁的表單欄位", "每欄 4 或 6", "欄位有長有短，4 欄太擠"],
            ["主內容 ＋ 側邊資訊", "8 ＋ 4", "側邊放摘要或說明"],
            ["整列的表格", "12", "表格自己橫向捲動，不切欄"],
          ],
          ["情境", "欄數", "為什麼"],
        )}
        <h3>響應式欄數</h3>
        <p class="component-description">欄位不是固定幾欄，是<strong>隨斷點變</strong>。正式後台最常見的那一組 <code>:sm="12" :md="8" :lg="6" :xl="4"</code>（分別用了 124／97／78／29 次）換算過來就是下表，原型的表單與篩選列都照它排：</p>
        ${decisionTable(
          [
            ["&lt; 768px", "<strong>1 欄</strong>", "欄位佔滿整列。兩欄在手機上每欄只剩不到 160px，一組日期區間放不下"],
            ["≥ 768px（sm）", "<strong>2 欄</strong>", "<code>:sm=\"12\"</code>"],
            ["≥ 992px（md）", "<strong>3 欄</strong>", "<code>:md=\"8\"</code>"],
            ["≥ 1200px（lg）", "<strong>4 欄</strong>", "<code>:lg=\"6\"</code>。桌機的預設排法"],
            ["≥ 1920px（xl）", "<strong>6 欄</strong>", "<code>:xl=\"4\"</code>。再寬也不要繼續加——一行超過六個欄位，眼睛要橫跨整個螢幕才讀得完一列"],
          ],
          ["寬度", "一行幾欄", "對應的 el-col"],
        )}
        <p class="component-description">需要整行的欄位（備註、說明、上傳、權限矩陣）直接佔滿一列，不跟短欄位併排——高度不一樣，底線就對不齊。</p>
        <h3>數值呈現</h3>
        <p class="component-description">金額與筆數在整個後台出現的次數比任何一個元件都多，所以它的規則屬於這一頁，不屬於表格或報表。四條：</p>
        <ul class="token-number-rules">
          <li><strong>千分位</strong>：顯示時補上，輸入時不補（邊打邊跳位會讓游標亂跑），送出前去掉。</li>
          <li><strong>小數位</strong>：依幣別固定，不讓使用者自由輸入第三位。金額欄位一律 <code>font-variant-numeric: tabular-nums</code>，個位數才對得齊。</li>
          <li><strong>正負色</strong>：負數 <code>var(--danger)</code>、正數 <code>var(--success)</code>、零用一般文字色。</li>
          <li><strong>對齊</strong>：要比大小的數字靠右，只用來辨識的（UID、訂單號）置中或靠左，判準在「表格 Table → 欄位對齊」。</li>
        </ul>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon("cancelCircle")}不要讓顏色可以個人化</h4><p>正式後台的 <code>SettingFile.vue</code> 讓<strong>每個使用者自己選</strong>千分位分隔符（空格／逗號）與正負配色（<strong>負紅正綠／負綠正紅</strong>）。同一張報表在兩個人螢幕上顏色相反，而後台的對帳有一半是靠截圖轉傳完成的——收到圖的人沒有辦法知道對方用的是哪一套。</p></div>
          <div class="is-good"><h4>${icon("checkCircle")}顏色固定，分隔符跟語系</h4><p>正負色是<strong>站台層級</strong>的設定，不是個人偏好：整個站只有一套，要改就整站一起改。千分位分隔符可以跟著語系走，因為那是書寫慣例，不會改變數字的意思。</p></div>
        </div>
        <p class="component-description"><strong>這是原型與正式後台分歧的一處</strong>，移植時要先做決定：把 <code>SettingFile</code> 的正負配色選項拿掉（建議），或是接受報表的顏色因人而異、並在所有會被轉傳的畫面上標出目前用的是哪一套。</p>
        <h3>多語系</h3>
        <p class="component-description">正式後台有 <strong>9 個語系</strong>（zh-tw、zh-cn、en-us、vi-vn、ja-jp、ko-kr、km-kh 高棉、bn-bd 孟加拉、fil-ph），同一個 key 的長度差距最多到 <strong>8 倍</strong>：</p>
        ${decisionTable(
          [
            ['待審核轉點', '5 字元', '英 29／越 26／<strong>高棉 40</strong>／孟加拉 34'],
            ['會員帳號', '4 字元', '英 14／<strong>越南 20</strong>／孟加拉 16'],
            ['上級設定', '4 字元', '英 19／越 18／<strong>孟加拉 22</strong>'],
          ],
          ['這個欄名', '繁中', '其他語系'],
        )}
        <p class="component-description">所以<strong>文字容器不得寫死寬高</strong>——高度用 <code>min-height</code> 讓內距撐開，寬度交給版面流。先前側欄項目是 <code>height: 36px</code>，換成越南文第二行會直接溢出蓋到下一項；工作區頁籤列是單行捲動，10 個長頁名排不下。兩處都已改成由內容撐開。</p>
        <p class="component-description">塞不下的時候只有兩種合法做法：<strong>換行</strong>或<strong>橫向捲動</strong>。<strong>截斷是例外</strong>，只用在「同一列重複出現、而且有 Tooltip 補得回來」的地方（多選的收合標籤、表格的長備註欄）。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不得截斷</h4><p><strong>按鈕</strong>（「確認新…」比換行糟一百倍）、<strong>表頭欄名</strong>（截斷等於這一欄沒有名字，塞不下由橫向捲動吸收）、<strong>側欄導覽</strong>（使用者靠文字決定去哪一頁，「組合範例－搜…」「組合範例－設…」會長得一樣）。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}可以截斷</h4><p>多選的收合標籤、表格裡的長文字欄、下載中心的檔名、日期面板的快捷區間——共同點是<strong>完整內容在別的地方拿得到</strong>，截斷不會讓資訊消失。一律配 Tooltip，而且只在真的被截斷時才掛。</p></div>
        </div>
        <p class="component-description">驗證方式：網址加上 <code>?longtext</code>，畫面上的中文會被換成 2.5 倍長的字串，等同於跑一次最長語系。新頁面做完就跑一次，比等翻譯進來才發現便宜得多。回歸由 <code>node i18n-check.cjs</code> 擋住「文字容器被釘死寬高」與「nowrap 沒有出路」。</p>
        <h4>RTL（右到左）</h4>
        <p class="component-description">RTL 指阿拉伯文、希伯來文那一類<strong>整個版面要鏡像</strong>的語系——側欄換到右邊、文字靠右、方向性圖示要翻面。<strong>目前不支援，也不需要</strong>：正式後台的 9 個語系全部是左到右（孟加拉文雖是南亞文字，書寫方向仍為 LTR）。</p>
        <p class="component-description">若未來要進中東市場，代價是整站 CSS 的 <code>margin-left</code>／<code>padding-right</code>／<code>left</code> 改用邏輯屬性（<code>margin-inline-start</code> 這一類）再加圖示鏡像，涉及 70 多支樣式檔。<strong>記在這裡是為了讓它是一個有標價的決定，而不是一個被遺忘的洞</strong>——在那之前不要為了「以後可能要」提前付這筆錢。</p>
        <h3>疊放順序 z-index</h3>
        <p class="component-description">只有會互相蓋到的那幾層才需要編號，數值一律從 <code>styles/base.css</code> 的 <code>--z-*</code> 取，<strong>不要在元件裡自己挑一個數字</strong>。元件內部的堆疊（表格固定欄、頁籤底線、骨架遮罩）維持 1–3，它們不會跨出自己的卡片。</p>
        ${decisionTable(
          [
            ['<code>--z-sticky</code> 20', '頁內固定列', '桌機 topbar 與工作區頁籤（頁籤 −1，貼在 topbar 底下）'],
            ['<code>--z-fixed</code> 30', '全畫面固定元素', '桌機側欄；手機的 topbar 那一疊（頁籤列 −1、搜尋開關 −2、背景遮板 −3）'],
            ['<code>--z-popover</code> 40', '氣泡面板', '下載中心、帳號選單；手機展開的篩選列 −1'],
            ['<code>--z-drawer</code> 50', '右側詳情抽屜', '會員詳情、登入紀錄、轉點明細'],
            ['<code>--z-nav-backdrop</code> 60', '側欄抽屜的遮罩', '手機'],
            ['<code>--z-nav</code> 70', '側欄導覽抽屜', '全站導覽，要蓋過上面全部'],
            ['<code>--z-tooltip</code> 80', 'Tooltip', '附著在哪一層就要在那一層之上，所以數值最大'],
            ['<code>--z-ep-popper</code> 3000', 'Element Plus 的 popper', '下拉選單、日期面板。EP 會從這個起點往上遞增，所以整段高於自繪的覆蓋層；select.js 與 date-picker.js 都讀這個變數'],
          ],
          ['變數', '哪一層', '誰在用'],
        )}
        <p class="component-description">再往上是兩個不吃 z-index 的東西：<strong>Toast</strong> 走 Popover API（不支援時退回 2000），<strong>彈窗</strong>是原生 <code>&lt;dialog&gt;.showModal()</code> 的 top layer——它在所有 z-index 之上，這也是彈窗不需要編號的原因。彈窗內的 EP popper 會被 top layer 蓋住，所以日期元件在彈窗裡改用 <code>appendTo</code> 掛進那個 <code>&lt;dialog&gt;</code>。</p>
        <p class="component-description">完整順序（由下而上）：<strong>元件內部 1–3 → sticky 20 → fixed 30 → popover 40 → drawer 50 → nav 60/70 → tooltip 80 → EP popper 3000 → Toast（popover，退路 2000）→ 彈窗（top layer）</strong>。</p>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}先前的三個問題</h4><p>側欄抽屜與頁首氣泡面板都是 40，誰在上面只能靠 DOM 順序決定；右側詳情抽屜是 50，打開選單時反而蓋在導覽上面；Tooltip 是 60，蓋過所有東西。十支檔案各寫各的數字，沒有任何地方記得住完整順序。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}現在</h4><p>七個變數、一個地方定義。要插進新的一層就在這張表上找位置，用 <code>calc(var(--z-X) - 1)</code> 掛在既有那一層底下，不要發明 35 或 45 這種中間值。</p></div>
        </div>
        <p class="component-description"><strong>Tooltip 不是一層，它是附著物。</strong>所以它的數值最大——不管掛在內容、頁首還是抽屜上都要浮在那一層之上。它在任何 <code>pointerdown</code>、捲動、Esc 時就關閉，不會留在畫面上擋住剛打開的東西。</p>
        <h4>兩個會讓 z-index 失效的陷阱</h4>
        <p class="component-description"><strong>一、祖先開了堆疊脈絡，裡面的數字就出不去。</strong>桌機的 <code>.topbar</code> 有 <code>backdrop-filter</code>，它本身就是一個堆疊脈絡（z-index 20）——裡面的下載中心與帳號面板不管寫 40 還是 4000，對 topbar 以外的東西都只有 20 的效力。<code>transform</code>、<code>filter</code>、<code>opacity</code> 小於 1、<code>will-change</code>、<code>contain</code> 都會造成同一件事。<strong>面板「層級明明比較高卻被蓋住」時，先往上找是哪個祖先把它關起來了</strong>，不要在面板上再加一個更大的數字。</p>
        <p class="component-description">同一個性質也會影響 <code>position: fixed</code>：有 <code>backdrop-filter</code> 或 <code>transform</code> 的祖先會變成它的包含區塊，<code>fixed</code> 就不再相對於視窗。手機的 topbar 因此把 <code>backdrop-filter</code> 關掉（<code>none !important</code>），下載中心的面板才固定得到畫面中央。</p>
        <p class="component-description"><strong>二、flex 項目的 <code>z-index</code> 即使 <code>position</code> 是 <code>static</code> 也會生效</strong>。Tooltip 規範頁那個示範用的靜態標籤改成 <code>position: static</code> 之後仍帶著 <code>.bo-tooltip</code> 的 z-index，自己開了一個堆疊脈絡，於是蓋到手機的側欄抽屜上面——把 <code>position</code> 改掉時記得一起把 <code>z-index</code> 歸 <code>auto</code>。</p>`,
      },
    ],
    tokens: [
      ["語意色", "8 個"],
      ["介面色", "9 個 CSS 變數"],
      ["單位", "rem（px ÷ 16），寫成 1rem(16px)"],
      ["字級", "18 / 16 / 14 / 12px"],
      ["字重", "400 / 600 / 650 / 700"],
      ["間距", "4 / 8 / 12 / 16 / 20 / 24px"],
      ["圓角（按鈕）", "4px"],
      ["圓角（輸入）", "8px"],
      ["圓角（卡片）", "8px"],
      ["正數色", "var(--success)"],
      ["負數色", "var(--danger)"],
      ["數字字體", "tabular-nums"],
      ["一行欄數", "1 / 2 / 3 / 4 / 6（隨斷點）"],
      ["格線欄數", "12"],
      ["格線間距", "16px"],
      ["斷點", "768 / 992 / 1200 / 1920"],
      ["斷點來源", "正式後台 tailwind.config.ts"],
      ["側欄寬度", "var(--sidebar-w) 15.5rem"],
      ["疊放層數", "8（--z-sticky 20 → --z-ep-popper 3000）"],
      ["彈窗", "原生 dialog top layer，不吃 z-index"],
      ["語系數", "9（全部為 LTR）"],
      ["最長字長倍數", "約 8 倍（高棉文）"],
      ["文字容器高度", "min-height，不寫死"],
      ["塞不下的做法", "換行或橫向捲動；截斷是例外"],
      ["RTL", "不支援"],
    ],
    rules: [
      [
        "數值一律回到這一頁",
        "元件頁只說明怎麼用；出現這裡沒有的色碼、字級或間距，就是漏了規範。",
      ],
      [
        "語意色依意圖命名",
        "不得新增「淺藍」「深綠」這種依外觀命名的色；需要新語意先在這裡定義。",
      ],
      [
        "介面色用變數",
        "頁面不得寫死 --text、--line 這些的色碼，否則換主題時會留下舊色。",
      ],
      [
        "斷點沿用正式後台",
        "色彩字級可以重定，斷點不行——兩邊不一致會讓同一個版面在不同寬度換排法。",
      ],
      [
        "格線 12 欄 16px 間距",
        "原型用 CSS Grid、正式後台用 el-row/el-col，欄數與間距必須一致。",
      ],
      [
        "尺寸寫 rem",
        "CSS 一律 rem（px ÷ 16），文件寫成 1rem(16px)。框線、@media 斷點、JS 數值維持 px。",
      ],
      [
        "不要出現中間值",
        "字級只用偶數（最小 12px）；間距、圓角、定位只用 4px 的倍數。沒有 6px、9px、11px、13px。",
      ],
    ],
  });
