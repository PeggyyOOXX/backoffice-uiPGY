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
  ["--muted", "#718087", "次要文字、說明"],
  ["--line", "#E1E9E9", "框線、分隔線"],
  ["--card", "#FFFFFF", "卡片底"],
  ["--bg", "#DFE3E8", "頁面底"],
  ["--navy", "#111B2B", "側欄底"],
  ["--navy2", "#172D3A", "側欄次層"],
  ["--blue", "#1596AD", "品牌色（同 btn-search）"],
  ["--blue2", "#E7F7FA", "品牌色淺底"],
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

// 每一類數值要對齊的格線
const UNIT_RULES = [
  ["字級", "2px 的倍數（偶數），最小 12px", "12 / 14 / 16 / 18 / 20px", "13px、17px、19px"],
  ["間距（padding／margin／gap）", "4px 的倍數", "4 / 8 / 12 / 16 / 20 / 24px", "6px、9px、11px"],
  ["圓角", "4px 的倍數", "4 / 8 / 12 / 16px", "6px、7px、9px"],
  ["定位（top／right／bottom／left）", "4px 的倍數", "4 / 8 / 12px", "7px、9px"],
  ["寬高", "由內容推算，不強制格線", "34px（16 ＋ 8 × 2 ＋ 框線 1 × 2）", "—"],
];

// 來自正式後台 tailwind.config.ts，數值對齊 Element Plus
const BREAKPOINTS = [
  ["xs", "0px", "手機直向", "單欄；輸入高度維持 34px，篩選列字級 16px"],
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
        body: `<p class="component-description">全站一套格線：<strong>12 欄、間距 16px</strong>。正式後台用 <code>el-row</code> / <code>el-col</code>（22 個檔案在用），原型用 CSS Grid，兩者的欄數與間距必須一致。</p>
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
        )}`,
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
      ["格線欄數", "12"],
      ["格線間距", "16px"],
      ["斷點", "768 / 992 / 1200 / 1920"],
      ["斷點來源", "正式後台 tailwind.config.ts"],
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
