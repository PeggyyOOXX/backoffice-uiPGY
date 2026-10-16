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
run(
  "data-table.js",
  ICON,
  ";window.dataTable=dataTable;window.applyPaging=applyPaging;window.PAGE_SIZES=PAGE_SIZES",
);
run(
  "table-guide-page.js",
  PAGE +
    ON +
    ICON +
    BTN +
    "const dataTable=window.dataTable,applyPaging=window.applyPaging,PAGE_SIZES=window.PAGE_SIZES;",
);
run("tag-guide.js", PAGE + ICON);
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
