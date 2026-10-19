// 每個元件規範頁都要畫得出來，而且骨架一致：node render-check.cjs
//
// 側欄拆成一元件一頁之後，最容易漏的是某一頁 render 時丟例外——畫面上只會是空白，
// 不會有人發現。這支把所有規範頁都實際畫一次，再套共用骨架斷言。
const { JSDOM } = require("jsdom");
const fs = require("fs");
const assert = require("node:assert/strict");
const assertGuideSkeleton = require("./guide-skeleton.cjs");

const dom = new JSDOM(
  '<!doctype html><body><main class="page"></main></body>',
  { runScripts: "outside-only", pretendToBeVisual: true },
);
const w = dom.window,
  d = w.document;
w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};

const strip = (s) => s.replace(/^import .*$/gm, "").replace(/^export /gm, "");
// BOM（零寬不斷行空格）若出現在行首會讓 ^import 的比對失效，全部清掉
const read = (f) => fs.readFileSync(f, "utf8").replace(/﻿/g, "");
// 每個模組包進 IIFE 再 eval：sloppy mode 的 eval 會讓「函式宣告」外洩到全域，
// 兩個模組都有 function redraw() 時，後載入的會蓋掉前一個，前一個的 handler 就
// 呼叫到別人的 redraw——真實的 ESM 模組沒有這個問題，是測試框架的假象。
const run = (file, prelude = "", epilogue = "") =>
  w.eval("(function(){" + prelude + strip(read(file)) + epilogue + "})()");

// --- 依相依順序載入 ---
run("delegate.js", "", ";window.__on=on;window.__onMatch=onMatch");
const ON = "const on=window.__on,onMatch=window.__onMatch;";
w.eval(read("icons-data.js").replace(/^export const /gm, "window."));
run(
  "icons.js",
  "const ICONS=window.ICONS,GROUPS=window.GROUPS;",
  ";window.icon=icon;window.ICON_LIST=ICONS;window.SIZES=SIZES;window.GROUPS=GROUPS",
);
const ICON = "const icon=window.icon;";
run(
  "guide-page.js",
  "",
  ";window.guidePage=guidePage;window.decisionTable=decisionTable",
);
const PAGE =
  "const guidePage=window.guidePage,decisionTable=window.decisionTable;";
run("tooltip.js", ON, ";window.tooltipAttrs=tooltipAttrs");
run(
  "icon-button.js",
  "const tooltipAttrs=window.tooltipAttrs;" + ICON,
  ";window.iconButton=iconButton",
);
const BTN = "const iconButton=window.iconButton;";
run(
  "message.js",
  ON + ICON,
  ";window.message=message;window.TYPES=TYPES;window.MAX_VISIBLE=MAX_VISIBLE",
);
const MSG =
  "const message=window.message,TYPES=window.TYPES,MAX_VISIBLE=window.MAX_VISIBLE;";
run("modal-system.js", ON, ";window.prepareModal=prepareModal");
const MODAL = "const prepareModal=window.prepareModal;";

// 片段來源（規範頁從它們取內容）
run("table-sort.js", ON);
run("table-guide.js", BTN + ICON);
run("choice-controls.js", "", ";window.choiceBody=choiceBody");
run("switch-layout-guide.js", ON, ";window.switchBody=switchBody");
w.eval(
  'window.drawerExamples=()=>`<section class="component-example"><h2>右側抽屜</h2><div class="card modal-example-card"><p>示範</p></div></section>`',
);

// --- 規範頁模組 ---
run("component-pages.js", PAGE);
run(
  "choice-guide.js",
  PAGE + "const switchBody=window.switchBody,choiceBody=window.choiceBody;",
);
run("button-guide.js", PAGE);
run("input-guide.js", PAGE);
run("date-picker-guide.js", PAGE);
run("states.js", "", ";window.emptyRow=emptyRow;window.emptyState=emptyState");
const STATES = "const emptyRow=window.emptyRow,emptyState=window.emptyState;";
run(
  "data-table.js",
  ICON + STATES,
  ";window.dataTable=dataTable;window.dataCards=dataCards;window.applyPaging=applyPaging;window.PAGE_SIZES=PAGE_SIZES",
);
run("tag-guide.js", PAGE + ICON, ";window.tag=tag");
run(
  "table-guide-page.js",
  PAGE +
    ON +
    ICON +
    BTN +
    "const dataTable=window.dataTable,dataCards=window.dataCards,applyPaging=window.applyPaging,PAGE_SIZES=window.PAGE_SIZES,tag=window.tag;",
);
run("upload-guide.js", PAGE + ON + ICON + MSG);
run("steps-guide.js", PAGE + ON + ICON + MSG);
run(
  "icon-guide.js",
  ICON +
    BTN +
    ON +
    "const ICON_LIST=window.ICON_LIST,GROUPS=window.GROUPS,SIZES=window.SIZES;",
);
run("token-guide.js", PAGE + ICON);
run("nav-guide.js", PAGE + ICON);
run("progress-guide.js", PAGE + ON + ICON);
run("message-guide.js", PAGE + ON + ICON + MSG + MODAL);
run(
  "bulk-actions.js",
  ICON + BTN,
  ";window.bulkParts={selectAllControl,selectRowControl,bulkHeader,bulkFeedback,selectionOf,applyBulk,PICK_COLUMN}",
);
run(
  "bulk-guide.js",
  PAGE + ON + ICON + MODAL +
    "const tag=window.tag;const {selectAllControl,selectRowControl,bulkHeader,bulkFeedback,selectionOf,applyBulk,PICK_COLUMN}=window.bulkParts;const dataTable=window.dataTable;",
);

const ok = (label) => console.log("  ✓ " + label);

// [render 函式, 卡片 class, 標題關鍵字]
const PAGES = [
  ["renderButtonPage", "button-guide", "按鈕"],
  ["renderInputPage", "input-guide", "輸入框"],
  ["renderDatePickerPage", "date-picker-guide", "日期"],
  ["renderChoiceGuide", "choice-guide", "選擇控制"],
  ["renderUploadPage", "upload-guide", "圖片上傳"],
  ["renderTablePage", "table-guide", "表格"],
  ["renderTagPage", "tag-guide", "標籤"],
  ["renderStepsPage", "steps-guide", "步驟導覽"],
  ["renderOverlayPage", "overlay-guide", "彈窗與抽屜"],
  ["renderTooltipPage", "tooltip-guide", "提示氣泡"],
  ["renderTokenPage", "token-guide", "設計 Token"],
  ["renderNavPage", "nav-guide", "導覽"],
  ["renderProgressPage", "progress-guide", "進度條"],
  ["renderIconGuide", "icon-guide", "圖示"],
  ["renderMessageGuide", "message-guide", "訊息提示"],
  ["renderBulkGuide", "bulk-guide", "批量操作"],
];

const missingTokens = [],
  missingRules = [];
for (const [fn, cardClass, title] of PAGES) {
  assert.equal(typeof w[fn], "function", `${fn} 不存在`);
  let html;
  try {
    html = w[fn]();
  } catch (e) {
    throw new Error(`${fn} render 失敗：${e.message}`);
  }
  assert.ok(html && html.length > 200, `${fn} 產出太短，可能是空頁`);
  d.querySelector(".page").innerHTML = html;
  const { hasTokens, hasRules } = assertGuideSkeleton(d, cardClass, title);
  if (!hasTokens) missingTokens.push(title);
  if (!hasRules) missingRules.push(title);
}
ok(`${PAGES.length} 個規範頁都畫得出來，骨架一致`);

// 每一頁都該有「共用規格」與「使用規則」收尾，少了就是不一致
assert.deepEqual(
  missingTokens,
  [],
  "以下頁面缺少「共用規格」：" + missingTokens.join("、"),
);
assert.deepEqual(
  missingRules,
  [],
  "以下頁面缺少「使用規則」：" + missingRules.join("、"),
);
ok("每一頁都有共用規格與使用規則");

// 互動的頁面要能真的操作，不能只是畫得出來
d.querySelector(".page").innerHTML = w.renderTablePage();
// 點一個明確不是目前頁的頁碼，並斷言跳到那一頁——用「有沒有改變」判斷會在
// 目前頁剛好就是被點的那一顆時誤判成失敗。
const pageBtn = (n) =>
  [...d.querySelectorAll("[data-table-page]")].find(
    (b) => b.textContent.trim() === String(n),
  );
const beforePage = d.querySelector(".page-btn.active").textContent.trim();
const targetPage = beforePage === "1" ? "2" : "1";
pageBtn(targetPage).click();
assert.equal(
  d.querySelector(".page-btn.active").textContent.trim(),
  targetPage,
  "分頁換頁沒有生效",
);
const sizeSelect = d.querySelector("[data-table-size]");
sizeSelect.value = "50";
sizeSelect.dispatchEvent(new w.Event("change", { bubbles: true }));
assert.equal(
  d.querySelector(".page-btn.active").textContent,
  "1",
  "改每頁筆數應跳回第 1 頁",
);
assert.ok(d.querySelector(".data-table-grid"), "表格頁缺少表格");
assert.ok(d.querySelector(".table-sort-control"), "表格頁缺少表頭排序");
ok("表格頁：表格＋分頁＋表頭排序同頁，換頁與改每頁筆數會跳回第 1 頁");

// 沒有資料時走的是「載入與空狀態」的區塊，不是表格自己畫的一行純文字。
// 這條分支在規範頁上永遠不會執行（示範資料是寫死的），只能單獨叫一次。
{
  const empty = d.createElement("div");
  empty.innerHTML = w.dataTable({
    columns: [{ key: "a", label: "A" }, { key: "b", label: "B" }],
    rows: [],
    pagination: false,
  });
  const cell = empty.querySelector(".bo-state-row td");
  assert.ok(cell, "空表格應套用共用空狀態（.bo-state-row）");
  assert.equal(cell.getAttribute("colspan"), "2", "空狀態應撐滿整個表寬");
  assert.ok(
    empty.querySelector(".bo-state-icon") &&
      empty.querySelector(".bo-state-title"),
    "空狀態應有圖示與標題，不是一行純文字",
  );
  ok("空表格沿用共用空狀態，撐滿表寬");
}

d.querySelector(".page").innerHTML = w.renderStepsPage();
// 範例照正式後台 branchList/add.vue 的開站流程：基本設定 → 遊戲設定 → 註冊登入設定
assert.equal(d.querySelectorAll(".bo-step").length, 3, "開站流程應為 3 步");
const stepLabels = [...d.querySelectorAll(".bo-step-text strong")].map(
  (e) => e.textContent,
);
assert.deepEqual(
  stepLabels,
  ["基本設定", "遊戲設定", "註冊登入設定"],
  "步驟名稱與正式後台不符",
);
assert.ok(d.querySelector(".steps-panel"), "步驟頁缺少該步的表單面板");
// 表單排版必須用規範定義的共用欄位，不是各頁自己排
assert.ok(
  d.querySelector(".steps-panel .guide-fields .guide-field > label"),
  "步驟頁的文字欄位沒有用共用的 guide-field（label 在上）",
);
assert.ok(
  d.querySelector(".steps-panel .guide-field .guide-input"),
  "步驟頁缺少 guide-input",
);
const currentBefore = d.querySelector(".bo-step.is-current").textContent;
d.querySelector('[data-steps-move="1"]').click();
assert.notEqual(
  d.querySelector(".bo-step.is-current").textContent,
  currentBefore,
  "步驟沒有前進",
);
assert.ok(d.querySelector(".bo-step.is-done .icon"), "已完成的步驟應顯示勾號");
d.querySelector('[data-steps-move="1"]').click();
assert.ok(
  d.querySelector(".guide-switch-rows .guide-switch-row .standard-switch"),
  "開關步驟沒有用共用的開關排列",
);
assert.equal(
  d.querySelector(".guide-switch-rows .guide-field"),
  null,
  "開關不得與輸入欄並排",
);
assert.ok(
  d.querySelector("[data-steps-submit]"),
  "最後一步應顯示「建立分站」而不是「下一步」",
);
ok("步驟：開站流程 3 步、前進後退、已完成顯示勾號、最後一步換成送出");

// 圖示按鈕併進按鈕頁之後，兩種形狀要在同一頁都看得到
d.querySelector(".page").innerHTML = w.renderButtonPage();
assert.ok(
  d.querySelector(".semantic-btn:not(.icon-action)"),
  "按鈕頁缺少文字按鈕示範",
);
assert.ok(
  d.querySelector(".semantic-btn.icon-action"),
  "按鈕頁缺少圖示按鈕示範",
);
assert.ok(
  d.querySelector(".icon-action-wrap[data-tooltip]"),
  "按鈕頁缺少停用圖示按鈕的提示包裝",
);
assert.ok(
  [...d.querySelectorAll("h3")].some((h) => h.textContent.includes("圖示按鈕")),
  "按鈕頁缺少圖示按鈕小節",
);
const actionBtn = d.querySelector(".semantic-btn.icon-action");
assert.ok(actionBtn.getAttribute("aria-label"), "圖示按鈕缺 aria-label");
assert.ok(actionBtn.getAttribute("data-tooltip"), "圖示按鈕缺 Tooltip");
assert.equal(
  actionBtn.querySelector("svg").getAttribute("aria-hidden"),
  "true",
  "圖示按鈕內的 svg 應對報讀器隱藏",
);
// Tooltip 預設顯示在下方：預設值不輸出 data-tooltip-placement，所以圖示按鈕上不該有這個屬性
assert.equal(
  actionBtn.getAttribute("data-tooltip-placement"),
  null,
  "圖示按鈕不該帶 placement——預設 bottom 就不輸出屬性",
);
ok("按鈕頁：文字按鈕與圖示按鈕同頁");

d.querySelector(".page").innerHTML = w.renderChoiceGuide();
assert.ok(d.querySelector(".guide-decision-table"), "選擇控制頁缺少決策表");
assert.ok(d.querySelector(".standard-switch"), "選擇控制頁缺少 Switch 示範");
assert.ok(
  d.querySelector('.choice-control input[type="radio"]'),
  "選擇控制頁缺少 Radio 示範",
);
assert.ok(
  d.querySelector('.choice-control input[type="checkbox"]'),
  "選擇控制頁缺少 Checkbox 示範",
);
assert.ok(d.querySelector(".choice-card"), "選擇控制頁缺少選項卡片");
ok("選擇控制：決策表 ＋ Switch／Radio／Checkbox／選項卡片同頁");

// 開關的四種狀態要同時在頁上：可操作的開與關、停用的開與關。
// 「關閉」與「停用」先前只差一層 opacity，兩個灰看起來一樣，分不出按不按得動，
// 所以這四格與它們的配色差異是規範的一部分，不是示範多畫的。
const switchStates = [...d.querySelectorAll(".switch-state .standard-switch")];
assert.equal(
  switchStates.length,
  6,
  "開關狀態一覽應有四種狀態加 Hover／Focus 兩格",
);
const switchKey = (el) => `${el.getAttribute("aria-checked")}/${el.disabled}`;
for (const want of ["true/false", "false/false", "true/true", "false/true"])
  assert.ok(
    switchStates.some((el) => switchKey(el) === want),
    `開關狀態一覽缺少 aria-checked/disabled = ${want}`,
  );
assert.ok(
  d.querySelector(".switch-state-control[data-tooltip] .standard-switch:disabled"),
  "停用的開關要由外層容器帶 Tooltip 說明原因（停用的按鈕不觸發滑鼠事件）",
);
const switchCss = fs.readFileSync("styles/input-standard-page.css", "utf8");
// 關閉是實心中性灰、停用是淡底加內描邊，三條都要在——先前停用只加 opacity:.45，
// 算出來和可操作的關閉是同一個灰，使用者分不出這顆按不按得動。
assert.ok(
  switchCss.includes(".standard-switch[aria-checked=\"false\"]{background:#718087}"),
  "關閉的開關要用實心中性灰 #718087",
);
assert.ok(
  switchCss.includes(".standard-switch:disabled{cursor:not-allowed;background:#e4f4f7") &&
    switchCss.includes(".standard-switch[aria-checked=\"false\"]:disabled{background:#f1f3f6"),
  "停用的開關要用淡底加內描邊，開與關各自一組",
);
assert.ok(
  !switchCss.includes(".standard-switch:disabled{opacity"),
  "停用的開關不可只調透明度——調淡後與可操作的關閉是同一個灰",
);
ok("選擇控制：開關四種狀態都在頁上，關閉與停用不是同一種灰");

// --- 進度條要真的有一條 ---
//
// .bo-progress-track 是 flex:1、basis 0：外層沒給它寬度時整條會塌成 0，
// 畫面上只剩右邊那個百分比，看起來像「這個元件只會顯示數字」。
// 規範頁的互動範例就這樣壞了一陣子，而且 jsdom 不排版，光看 DOM 看不出來，
// 所以這裡連 CSS 一起檢查。
d.querySelector(".page").innerHTML = w.renderProgressPage();
assert.equal(
  d.querySelectorAll(".progress-demo .bo-progress-track").length,
  4,
  "互動範例應該有四條進度條",
);
assert.ok(
  [...d.querySelectorAll(".progress-demo .bo-progress-fill")].every(
    (fill) => /width:\s*\d/.test(fill.getAttribute("style") || ""),
  ),
  "每一條都要有寬度百分比",
);
{
  const css = fs.readFileSync("progress-guide.css", "utf8");
  const rule = name => {
    const at = css.indexOf(name);
    assert.ok(at >= 0, `progress-guide.css 缺少 ${name}`);
    return css.slice(at, css.indexOf("}", at));
  };
  assert.ok(
    /flex:\s*1/.test(rule(".progress-row > .bo-progress")),
    "橫向排列時進度條要 flex:1，否則軌道會塌成 0、只剩百分比數字",
  );
  const minWidth = rule(".bo-progress-track").match(/min-width:\s*(\d+)px/);
  assert.ok(
    minWidth && Number(minWidth[1]) > 0,
    "軌道要有最小寬度，外層忘了給寬度時才不會整條消失",
  );
}
ok("進度條：互動範例四條都畫得出來，軌道不會塌成只剩數字");

// --- 日期快捷區間：七個，而且算得對 ---
//
// date-picker.js 會 import Vue 與 element-plus，這幾支檢查跑不動整支模組，
// 所以只把純日期運算那一段抽出來算一次。規範頁早就寫著「正式後台有 7 個」，
// 實作卻只有 3 個（本日／本週／本月），兩邊對不上了一陣子。
{
  const src = fs.readFileSync("date-picker.js", "utf8");
  const block = src.slice(src.indexOf("const startOf"), src.indexOf("function mountPickers"));
  assert.ok(block.includes("const shortcuts"), "date-picker.js 找不到快捷區間");
  const shortcuts = new Function(block + "; return shortcuts")();
  assert.deepEqual(
    shortcuts.map((s) => s.text),
    ["今天", "昨天", "前天", "本週", "上週", "本月", "上月"],
    "快捷區間要與正式後台的七個一致，順序也一樣",
  );
  const day = 86400000;
  const [todayFrom, todayTo] = shortcuts[0].value();
  assert.equal(todayFrom.getHours(), 0, "區間的起點是當天 00:00:00");
  assert.equal(todayTo.getHours(), 23, "區間的終點是當天 23:59:59");
  const [yesterdayFrom] = shortcuts[1].value();
  assert.equal(
    Math.round((todayFrom - yesterdayFrom) / day), 1,
    "昨天就是今天往前一天",
  );
  const [weekFrom] = shortcuts[3].value();
  assert.equal(weekFrom.getDay(), 1, "一週從週一開始");
  const [lastWeekFrom, lastWeekTo] = shortcuts[4].value();
  assert.equal(Math.round((weekFrom - lastWeekFrom) / day), 7, "上週是本週往前七天");
  assert.ok(lastWeekTo < weekFrom, "上週不能和本週重疊");
  const [monthFrom, monthTo] = shortcuts[5].value();
  assert.equal(monthFrom.getDate(), 1, "本月從 1 號開始");
  assert.equal(monthTo.getMonth(), monthFrom.getMonth(), "本月的終點不能跨到下個月");
  const [lastMonthFrom, lastMonthTo] = shortcuts[6].value();
  assert.equal(lastMonthFrom.getDate(), 1, "上月從 1 號開始");
  assert.ok(lastMonthTo < monthFrom, "上月不能和本月重疊");
}

// 手機把兩個月上下排：EP 預設 float:left 各佔一半，而且 body 有 min-width，
// 手機寬度塞不下就會把左邊那個月切掉一半。
{
  const css = fs.readFileSync("date-picker.css", "utf8");
  const mobile = css.slice(css.indexOf("@media (max-width: 720px)"));
  assert.ok(
    mobile.includes("float: none"),
    "手機版要把兩個月份面板改成上下排列",
  );
  assert.ok(
    mobile.includes("min-width: 0"),
    "手機版要解開面板的 min-width，否則月曆會被切掉",
  );
}
ok("日期：七個快捷區間與正式後台一致，手機版兩個月上下排");

// --- 圖示按鈕與文字按鈕共用同一組變數，不寫死高寬 ---
//
// 兩者的高度都是「內容高度 + 上下內距×2 + 框線×2」：文字用 --btn-content 當行高，
// 圖示用它當邊長。所以換一個內容高度，兩種按鈕會一起變，而且永遠同高。
// 也不依裝置改尺寸或間距——先前 @media(pointer:coarse) 連帶把群組間距從 8 改成 12，
// 在觸控筆電與 DevTools 裝置模式之間切換時整排按鈕會左右跑動。
{
  const css = fs.readFileSync("icon-button.css", "utf8");
  assert.ok(
    !css.includes("pointer:coarse") && !css.includes("pointer: coarse"),
    "圖示按鈕不得依裝置改尺寸或間距——間距一變畫面就會跑動",
  );
  const rule = css.slice(css.indexOf(".semantic-btn.icon-action{"));
  const body = rule.slice(0, rule.indexOf("}"));
  assert.ok(
    !/(?:^|[;{])(?:min-)?(?:width|height)s*:/.test(body.replace(/\s/g, "")),
    "圖示按鈕不得寫死高寬，要用內距撐開：" + body,
  );
  assert.ok(
    body.includes("padding:var(--btn-pad-y)"),
    "圖示按鈕的四邊內距相同，才會自己長成正方形",
  );
  assert.ok(
    body.includes("line-height:var(--btn-content)") && body.includes("font-size:var(--btn-content)"),
    "圖示按鈕的內容高度要用 --btn-content，和文字按鈕同一個值",
  );
  assert.ok(
    css.includes("width:var(--btn-content);height:var(--btn-content)"),
    "SVG 自己帶 width/height 屬性，要用 CSS 蓋過去才會跟著內容高度變",
  );
}
ok("圖示按鈕：與文字按鈕共用 --btn-content，換尺寸會一起變且同高");

// --- 按鈕高度只有一個來源 ---
//
// 規範頁自己把示範按鈕改小過（桌機 30px、手機 38px），而規範寫的是 34／42。
// 來看規範的人量到的是 30，照著做就全站不一致。
// 文字按鈕的高度只能由 semantic-button-system.css 決定；
// 圖示按鈕是另一個元件（icon-button.css 的 .icon-action），不在此限。
{
  const files = fs.readdirSync('.').filter(f => f.endsWith('.css'))
    .concat(fs.readdirSync('styles').filter(f => f.endsWith('.css')).map(f => 'styles/' + f))
  const offenders = []
  for (const file of files) {
    if (file === 'styles/semantic-button-system.css' || file === 'icon-button.css') continue
    const css = fs.readFileSync(file, 'utf8')
    for (const match of css.matchAll(/([^{}]*\.semantic-btn[^{}]*)\{([^}]*)\}/g)) {
      const selector = match[1].trim()
      if (selector.includes('icon-action')) continue
      if (/(?:^|[;\s])(?:min-)?height\s*:/.test(match[2])) {
        offenders.push(`${file} → ${selector}`)
      }
    }
  }
  assert.deepEqual(offenders, [],
    '只有 semantic-button-system.css 可以決定文字按鈕的高度：\n  ' + offenders.join('\n  '))

  // 尺寸用推算的，不寫死：高 = 行高 + 上下內距×2 + 框線×2，寬 = 文字寬 + 左右內距×2。
  // 手機與桌機的差別只有上下內距一個值。
  const own = fs.readFileSync('styles/semantic-button-system.css', 'utf8')
  const value = name => {
    const match = own.match(new RegExp(name + ':\s*([^;]+);'))
    assert.ok(match, `semantic-button-system.css 缺少 ${name}`)
    return match[1].trim()
  }
  const px = name => Number(value(name).replace('px', ''))
  const rule = own.slice(own.indexOf('.semantic-btn {'), own.indexOf('}', own.indexOf('.semantic-btn {')))
  assert.ok(
    !/(?:^|[;\s])(?:min-)?height\s*:/.test(rule),
    '文字按鈕連 min-height 都不需要：line-height 是明確的像素值，高度就是確定值' + rule,
  )
  assert.ok(/line-height:\s*var\(--btn-content\)/.test(rule), '文字按鈕的行高要用 --btn-content，與圖示按鈕同一個值')
  assert.ok(/padding:\s*var\(--btn-pad-y\) var\(--btn-pad-x\)/.test(rule), '按鈕的內距要用變數，上下左右分開')
  assert.ok(!/(?:^|[;\s])(?:height|width|min-width)\s*:/.test(rule), '按鈕不得寫死高或寬：' + rule)
  // 算出來的值要正好落在與輸入框對齊的 34px，而且不分斷點
  const derived = pad => px('--btn-content') + pad * 2 + px('--btn-border') * 2
  assert.equal(derived(px('--btn-pad-y')), 34, '桌機算出來要是 34px（與 34px 的輸入框對齊）')
  const mobile = own.slice(own.indexOf('@media (max-width: 720px)'))
  assert.ok(
    !mobile.includes('--btn-pad-y') && !/\.semantic-btn\s*\{[^}]*min-height/.test(mobile),
    '手機不得另外改按鈕尺寸：全站只有一個高度',
  )
ok(`按鈕尺寸用推算的：全站 ${derived(px('--btn-pad-y'))}px，不分斷點，寬度隨文字`)
}

// --- 語意色只能用「按鈕 Button」已定義的那一組 ---
// 標籤與 Toast 曾經各自發明一套（#1F7A5C、#B23340 之類），跟按鈕頁對不起來；
// 同一個「成功」在三個地方是三種綠，使用者學不會顏色的意思。
const PALETTE = [
  "#1596AD",
  "#8354BC",
  "#4169C9",
  "#6d8aae",
  "#12b157",
  "#F59E0B",
  "#DC2626",
  "#a3a3a3",
];
const SEMANTIC_SOURCES = [
  // \s* 讓它容忍 prettier 把宣告排成多行
  ['tag-guide.css', /\.bo-tag\.is-[\w-]+\s*\{\s*color:\s*(#[0-9A-Fa-f]{6})/g],
  ['message.css', /\.bo-message\.is-[\w-]+\s*\{\s*color:\s*(#[0-9A-Fa-f]{6})/g],
];
const offPalette = [];
for (const [file, re] of SEMANTIC_SOURCES) {
  const text = fs.readFileSync(file, "utf8");
  const found = [...text.matchAll(re)];
  assert.ok(found.length >= 4, file + " 找不到語意色宣告，選擇器可能改了");
  for (const m of found) {
    if (!PALETTE.map(c => c.toUpperCase()).includes(m[1].toUpperCase()))
      offPalette.push(file + " 用了 " + m[1]);
  }
}
assert.deepEqual(
  offPalette,
  [],
  "語意色不在按鈕頁已定義的那一組裡：" + offPalette.join("、"),
);
ok("標籤與訊息的語意色都取自按鈕頁已定義的 8 色");

// --- Tooltip 的預設方向只能有一個來源 ---
// 引擎、tooltipAttrs 與 iconButton 三處各有一個預設值，改方向時只要漏掉其中一處，
// 圖示按鈕與一般元素的提示就會跑到不同邊。jsdom 的 getBoundingClientRect 全是 0，
// 上方永遠判定放不下而自動翻面，所以只能從原始碼驗，不能看渲染結果。
const tooltipSource = fs.readFileSync("tooltip.js", "utf8");
const iconButtonSource = fs.readFileSync("icon-button.js", "utf8");
const engineDefault = tooltipSource.match(/tooltipPlacement \|\| '(\w+)'/)?.[1];
const attrsDefault = tooltipSource.match(
  /tooltipAttrs = \(text, placement = '(\w+)'\)/,
)?.[1];
const iconButtonDefault = iconButtonSource.match(/placement = '(\w+)'/)?.[1];
assert.ok(engineDefault, "tooltip.js 找不到引擎的預設方向");
assert.equal(
  attrsDefault,
  engineDefault,
  "tooltipAttrs 的預設方向與引擎不一致",
);
assert.equal(
  iconButtonDefault,
  engineDefault,
  "iconButton 的預設方向與引擎不一致",
);
// 預設值不該輸出屬性，否則全站每顆圖示按鈕都會多一個 data-tooltip-placement
assert.ok(
  tooltipSource.includes("placement === '" + engineDefault + "' ? ''"),
  "tooltipAttrs 的預設值判斷沒有跟著預設方向改",
);
ok(
  "Tooltip 預設方向 " +
    engineDefault +
    "，引擎／tooltipAttrs／iconButton 三處一致",
);

console.log("\nPASS: 元件規範頁（render、骨架、分頁、步驟、下拉、選擇控制）");
