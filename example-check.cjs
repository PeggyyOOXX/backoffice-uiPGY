// 三個組合範例頁要真的能用：node example-check.cjs
//
// 規範頁只要畫得出來就算過，組合範例不行——它們的價值在於「兜起來之後還能動」。
// 篩選會不會把分頁的頁數上限一起改掉、關掉最後一種登入方式會不會把人鎖在外面、
// 改到一半切頁籤會不會把資料吃掉，這些都只有實際點一遍才看得出來。
const { JSDOM } = require("jsdom");
const fs = require("fs");
const assert = require("node:assert/strict");

const dom = new JSDOM(
  '<!doctype html><body><main class="page"></main>' +
    '<div id="detailOverlay"><h2 id="detailDrawerTitle"></h2><div id="detailBody"></div><div class="drawer-foot"></div></div>' +
    '</body>',
  { runScripts: "outside-only", pretendToBeVisual: true },
);
const w = dom.window,
  d = w.document;
w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
w.openDetailDrawer = () => d.querySelector("#detailOverlay").classList.add("open");
w.closeDetailDrawer = () => d.querySelector("#detailOverlay").classList.remove("open");
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new w.Event("close"));
};

const strip = (s) => s.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const read = (f) => fs.readFileSync(f, "utf8").replace(/﻿/g, "");
// 每個模組包進 IIFE：sloppy eval 會把 function 宣告洩到全域，
// 兩個模組都有 redraw() 時後者會蓋掉前者。
const run = (file, prelude = "", epilogue = "") =>
  w.eval("(function(){" + prelude + strip(read(file)) + epilogue + "})()");

// --- 相依 ---
run("delegate.js", "", ";window.__on=on;window.__onMatch=onMatch");
const ON = "const on=window.__on,onMatch=window.__onMatch;";
w.eval(read("icons-data.js").replace(/^export const /gm, "window."));
run(
  "icons.js",
  "const ICONS=window.ICONS,GROUPS=window.GROUPS;",
  ";window.icon=icon",
);
const ICON = "const icon=window.icon;";
run("tooltip.js", ON, ";window.tooltipAttrs=tooltipAttrs");
run(
  "icon-button.js",
  "const tooltipAttrs=window.tooltipAttrs;" + ICON,
  ";window.iconButton=iconButton",
);
const BTN = "const iconButton=window.iconButton;";
run("message.js", ON + ICON, ";window.message=message");
const MSG = "const message=window.message;";
run("modal-system.js", ON, ";window.prepareModal=prepareModal");
const MODAL = "const prepareModal=window.prepareModal;";
run("states.js", "", ";window.emptyRow=emptyRow;window.emptyState=emptyState;window.loadingWrap=loadingWrap");
run(
  "data-table.js",
  ICON + "const emptyRow=window.emptyRow;",
  ";window.dataTable=dataTable;window.dataCards=dataCards;window.applyPaging=applyPaging;window.keepTableScroll=keepTableScroll;window.PAGE_SIZES=PAGE_SIZES",
);
const TABLE =
  "const dataTable=window.dataTable,dataCards=window.dataCards,applyPaging=window.applyPaging,keepTableScroll=window.keepTableScroll,PAGE_SIZES=window.PAGE_SIZES;";
run(
  "guide-page.js",
  "",
  ";window.guidePage=guidePage;window.decisionTable=decisionTable",
);
const PAGE =
  "const guidePage=window.guidePage,decisionTable=window.decisionTable;";
run("tag-guide.js", PAGE + ICON, ";window.tag=tag");
const TAG = "const tag=window.tag;";
run("progress-guide.js", PAGE + ON + ICON, ";window.progressBar=progressBar");
run("tabs.js", ON + ICON, ";window.tabs=tabs;window.tabPanels=tabPanels");
run("choice-controls.js", "", ";window.choiceControl=choiceControl");
run("upload-guide.js", PAGE + ON + ICON + MSG, ";window.uploadSlot=uploadSlot");

run("bulk-actions.js", ICON + BTN, ";window.bulkParts={selectAllControl,selectRowControl,bulkHeader,selectionOf,applyBulk,PICK_COLUMN}");
const BULK = "const {selectAllControl,selectRowControl,bulkHeader,selectionOf,applyBulk,PICK_COLUMN}=window.bulkParts;";

run("filter-toggle.js", ON + ICON, ";window.filterToggle=filterToggle");
const FILTER = "const filterToggle=window.filterToggle;";

// --- 受測頁 ---
run(
  "example-list.js",
  FILTER + TABLE + TAG + MODAL + MSG + ON + ICON + BTN +
    "const progressBar=window.progressBar;",
);
run(
  "example-settings.js",
  TAG + MODAL + MSG + ON + ICON +
    "const tabs=window.tabs,tabPanels=window.tabPanels,choiceControl=window.choiceControl,uploadSlot=window.uploadSlot;",
);

run(
  "example-bulk.js",
  FILTER + TABLE + TAG + MODAL + MSG + ON + ICON + BULK,
);

run("download-center.js", ON + ICON + TAG + BTN + MSG +
  "const progressBar=window.progressBar,emptyState=window.emptyState;",
  ";window.requestExport=requestExport;window.downloadCenter=downloadCenter");
const DL = "const requestExport=window.requestExport;";

run(
  "example-report.js",
  FILTER + TABLE + MSG + ON + ICON + DL +
    "const tabs=window.tabs,tabPanels=window.tabPanels;",
);

run(
  "example-form.js",
  TABLE + TAG + MODAL + MSG + ON + ICON + BTN,
);

run("choice-controls.js", "", ";window.choiceCard=choiceCard");
run(
  "example-member.js",
  FILTER + TABLE + MSG + ON + ICON + BTN + DL,
);
run("sortable.js", ON + ICON, ";window.sortable=sortable;window.reorder=reorder");
run(
  "example-mixed.js",
  TABLE + TAG + MODAL + MSG + ON + ICON + BTN +
    "const tabs=window.tabs,tabPanels=window.tabPanels,choiceCard=window.choiceCard,sortable=window.sortable,reorder=window.reorder;",
);
run(
  "example-dashboard.js",
  FILTER + MSG + ON + ICON + "const loadingWrap=window.loadingWrap;",
);

const ok = (label) => console.log("  ✓ " + label);
const host = () => d.querySelector(".page");
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const change = (el) => el.dispatchEvent(new w.Event("change", { bubbles: true }));
const q = (sel) => d.querySelector(sel);
const qa = (sel) => [...d.querySelectorAll(sel)];
const bodyRows = () =>
  qa(".example-list-page .data-table-grid tbody tr").filter(
    (tr) => !tr.classList.contains("bo-state-row"),
  );

// ===== 列表型：禮物卡管理 =====
host().innerHTML = w.renderExampleList();

assert.ok(q(".example-list-page"), "列表範例畫不出來");
assert.ok(q(".source-filter .source-filter-grid"), "篩選列未套用共用的 .source-filter-grid");
assert.ok(q(".example-toolbar.member-actions"), "列表工具列未套用共用樣式");
assert.ok(q(".data-table-grid") && q("[data-table-page]"), "表格與分頁應在同一個元件內");
ok("列表頁：篩選列、工具列、表格＋分頁都套共用元件");

// 包住表格的卡片要留內距。分頁列只帶 margin-top，左右留白一向由外層卡片負責；
// 卡片寫成 padding:0 的話，總筆數與頁碼會直接貼到卡片邊緣。
{
  const css = fs.readFileSync("example-page.css", "utf8");
  // 三種卡片（包表格的、包表單的、頁尾規範的）必須在同一條規則裡拿到內距。
  // 先前 .example-settings-card 自己寫 16px，同一頁的表單卡片比表格卡片胖一圈，
  // 手機版也沒跟著收——卡片內距只能有一個來源。
  const rule = css.match(
    /\.example-card\s*,\s*\.example-settings-card\s*,\s*\.example-note\s*\{([^}]*)\}/,
  );
  assert.ok(rule, "三種組合範例卡片要共用同一條內距規則（example-page.css）");
  const padding = rule[1].match(/padding\s*:\s*([^;]+)/);
  assert.ok(padding, "卡片必須明確宣告 padding（基礎 .card 沒有內距）");
  assert.ok(
    !/^0(px)?$/.test(padding[1].trim()),
    `包住表格的卡片不能把內距歸零，目前是 padding:${padding[1].trim()}`,
  );
  // 內距要落在間距 token 上（4px 的倍數）
  const px = parseFloat(padding[1]) * 16;
  assert.equal(px % 4, 0, `卡片內距要是 4px 的倍數，目前是 ${px}px`);
  // 個別頁面不得再自己訂一次
  for (const file of ["example-settings.css", "example-member.css", "example-list.css"]) {
    const src = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(
      !/\.example-settings-card\s*\{[^}]*padding/.test(src),
      `${file} 不該再自己訂卡片內距，交給 example-page.css`,
    );
  }
}
ok("列表頁：包住表格的卡片有內距，分頁列不會貼邊");

// 每頁筆數的下拉會被 select.js 換成 Element Plus 的下拉（原生的變 hidden）。
// 少了 page-size-select，換出來的 host 只有 .bo-select-host{width:100%}，
// 在 flex 容器裡會塌成一個看不到字的空框——畫面上就是「每頁 [ ] 筆」。
{
  const sizeSelect = q("[data-table-size]");
  assert.ok(sizeSelect, "分頁列缺少每頁筆數下拉");
  assert.ok(
    sizeSelect.classList.contains("page-size-select"),
    "每頁筆數下拉必須帶 page-size-select，select.js 才會套用正確的尺寸變體",
  );
  assert.ok(
    sizeSelect.classList.contains("guide-select"),
    "每頁筆數下拉必須帶 guide-select，否則 select.js 不會接管它",
  );
  // 沒有 value 屬性時 EP 要靠 DOM 的文字回退，多一層不必要的假設
  assert.ok(
    [...sizeSelect.options].every((o) => o.getAttribute("value")),
    "每個選項都要有明確的 value",
  );
  const css = fs.readFileSync("data-table.css", "utf8");
  assert.ok(
    /\.pagination-size\s+\.bo-select-page-size\s*\{[^}]*width/.test(css),
    "要給 .bo-select-host 寬度，不是只給已經隱藏的原生 select",
  );
  // 主色 #1596ad 在這套系統裡代表「聚焦中」。常駐框線用它，使用者會讀成已選取。
  const selectCss = fs.readFileSync("select.css", "utf8");
  for (const [, body] of selectCss.matchAll(
    /\.bo-select-page-size[^{]*\{([^}]*)\}/g,
  )) {
    assert.ok(
      !/#1596ad/i.test(body),
      `每頁筆數下拉的常駐樣式不該用主色：${body.trim()}`,
    );
  }
  ok("分頁列：下拉接得上 select.js、給的是 host 寬度、框線是灰階不搶聚焦色");
}

assert.equal(bodyRows().length, 10, "初始每頁 10 筆");
assert.ok(q(".example-progress-cell .bo-progress"), "兌換進度缺少進度條");
assert.ok(q(".bo-tag.is-success") && q(".bo-tag.is-warning") && q(".bo-tag.is-danger"),
  "狀態欄應使用語意標籤（success／warning／danger）");
// 進度條固定中性色，不因為快兌換完就變紅
assert.equal(qa(".example-progress-cell .bo-progress").filter(
  (el) => !el.classList.contains("is-info")).length, 0,
  "兌換進度不應自動變色");
ok("列表頁：標籤依語意、進度條不自動變色");

// 篩選：關鍵字
const form = q("[data-gift-filter]");
q("#gift-keyword").value = "體驗";
form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.equal(bodyRows().length, 2, "關鍵字篩選後應只剩 2 筆（體驗金、舊版體驗金）");

// 篩不到時走共用空狀態，工具列不動
q("#gift-keyword").value = "不存在的活動";
form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.equal(bodyRows().length, 0, "篩不到時不應有資料列");
assert.ok(q(".bo-state-row .bo-state-title"), "篩不到時應顯示共用空狀態");
assert.ok(q(".example-toolbar.member-actions"), "空狀態時列表工具列仍要在原位");
ok("列表頁：篩選生效，無結果時走共用空狀態且工具列不動");

click(q("[data-gift-reset]"));
assert.equal(bodyRows().length, 10, "重設後應回到每頁 10 筆");

// 停用／啟用切換
const toggleRow = () => bodyRows()[0].querySelector("[data-gift-toggle]");
click(toggleRow());
assert.ok(bodyRows()[0].innerHTML.includes("暫停"), "切換後第一筆應變成暫停");
click(toggleRow());
assert.ok(bodyRows()[0].innerHTML.includes("啟用"), "再切換應變回啟用");
ok("列表頁：單筆狀態切換會立即反映在標籤上");

// 作廢：不可逆，必須先確認
const voidBtn = bodyRows()[0].querySelector("[data-gift-void]");
click(voidBtn);
const confirmDialog = q("dialog[open]");
assert.ok(confirmDialog, "作廢應先開確認彈窗");
assert.ok(confirmDialog.querySelector(".btn-danger"), "確認鈕應使用危險色");
assert.ok(bodyRows()[0].innerHTML.includes("啟用"), "尚未確認前不該改變資料");
confirmDialog
  .querySelector("form")
  .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.ok(bodyRows()[0].innerHTML.includes("作廢"), "確認後應變成作廢");
assert.ok(
  bodyRows()[0].querySelector("[data-gift-void]").disabled,
  "已作廢的那筆不該還能再作廢",
);
ok("列表頁：作廢先確認再執行，完成後停用該列的作廢鈕");

// 新增與編輯共用同一個彈窗（正式後台的 openEditDialog() 不帶 id 就是新增）。
// 兩個入口各做一份表單的話，欄位遲早會對不起來，所以這裡驗「同一個表單、三處差異」。
{
  const total = () => Number(q(".pagination-total").textContent.replace(/\D/g, ""));
  const before = total();
  click(q("[data-gift-add]"));
  const addDialog = q("dialog[open]");
  assert.ok(addDialog, "新增禮物卡要開彈窗，不能只跳一則 Toast");
  assert.equal(addDialog.querySelector("header h2").textContent.trim(), "新增禮物卡");
  assert.ok(addDialog.querySelector(".guide-fields"), "彈窗表單要套共用的欄位格線");
  const code = addDialog.querySelector("#gift-form-code");
  assert.ok(!code.readOnly, "新增時兌換代碼要能填——唯讀是編輯才有的限制");
  assert.ok(
    addDialog.querySelector('label[for="gift-form-name"] .required-mark'),
    "必填欄位要在標籤右側加紅色星號",
  );
  assert.ok(addDialog.querySelector("[data-date-range]"),
    "彈窗內的日期也要掛共用日期元件，不得自己做一個");
  addDialog.querySelector("#gift-form-name").value = "測試新增禮物卡";
  code.value = "test2026";
  addDialog.querySelector("#gift-form-face").value = "250";
  addDialog
    .querySelector("form")
    .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(total(), before + 1, "確認新增之後總筆數要多一筆");
  assert.ok(bodyRows()[0].innerHTML.includes("測試新增禮物卡"), "新的那一筆要排在最前面");
  assert.ok(bodyRows()[0].innerHTML.includes("TEST2026"), "兌換代碼要轉成大寫");
  ok("列表頁：新增與編輯共用同一個彈窗，新增後回第一頁並出現在列表最前面");

  // 編輯同一個彈窗：標題與兌換代碼的限制要跟著換
  click(bodyRows()[0].querySelector("[data-gift-edit]"));
  const editDialog = q("dialog[open]");
  assert.equal(editDialog.querySelector("header h2").textContent.trim(), "編輯禮物卡");
  assert.ok(editDialog.querySelector("#gift-form-code").readOnly,
    "編輯時兌換代碼不可修改");
  editDialog.querySelector("[data-example-close]").click();
  ok("列表頁：同一個彈窗換成編輯時，標題與兌換代碼的限制跟著換");
}

// 改每頁筆數要跳回第 1 頁
const size = q("[data-table-size]");
size.value = "10";
change(size);
assert.equal(q(".page-btn.active").textContent, "1", "改每頁筆數應跳回第 1 頁");
ok("列表頁：改每頁筆數跳回第 1 頁");

// ===== 設定型：分站設定 =====
host().innerHTML = w.renderExampleSettings();

assert.ok(q(".example-settings-page"), "設定範例畫不出來");
assert.equal(qa('[data-tabs="branch-setting"] [data-tab-key]').length, 2,
  "正式後台只有兩個頁籤（其他設定是基本設定裡的區塊）");
assert.ok(!q(".example-settings-page .data-table-grid"), "設定頁不該出現表格");
assert.ok(!q(".example-settings-page [data-table-page]"), "設定頁不該出現分頁");
ok("設定頁：兩個頁籤，沒有表格也沒有分頁");

assert.ok(q(".upload-slot .upload-dropzone"), "缺少共用的上傳欄位");
assert.ok(q(".upload-slot-head small").textContent.includes("最大"),
  "上傳欄位應在標題列寫出尺寸與容量");
assert.ok(q(".choice-group.is-inline .choice-control"), "版型設定應使用共用的選擇控制");
assert.ok(q(".example-savebar [data-branch-save]"), "缺少儲存列");
assert.equal(q("[data-branch-save]").disabled, true, "沒有變更時儲存鈕應停用");
ok("設定頁：上傳、選擇控制、儲存列都套共用元件");

// 切到註冊登入設定（此時沒有變更，應直接切過去）
click(q('[data-tabs="branch-setting"] [data-tab-key="register"]'));
assert.ok(q(".example-mode-card"), "應切到註冊登入設定");
assert.ok(q(".bo-alert.is-info"), "區塊層級的常駐說明應使用行內警示");
ok("設定頁：無變更時切換頁籤不攔截");

// 鎖定欄位不可取消、不可改必填
const lockedBox = q('[data-branch-field="account:account"]');
assert.equal(lockedBox.disabled, true, "帳號是識別欄位，不該能取消勾選");
assert.equal(q('[data-branch-required="account:account"]').disabled, true,
  "識別欄位不該能改成選填");
ok("設定頁：識別欄位鎖定，不能取消也不能改選填");

// 勾選欄位後才能設必填；取消勾選時必填要一起關掉
const phoneBox = q('[data-branch-field="account:phone"]');
assert.equal(q('[data-branch-required="account:phone"]').disabled, true,
  "未勾選的欄位不該能設必填");
phoneBox.checked = true;
change(phoneBox);
const phoneSwitch = q('[data-branch-required="account:phone"]');
assert.equal(phoneSwitch.disabled, false, "勾選後應可設必填");
click(phoneSwitch);
assert.ok(q('[data-branch-field="account:phone"]')
  .closest(".example-field-row").innerHTML.includes("必填"), "切換後應顯示必填");
const phoneAgain = q('[data-branch-field="account:phone"]');
phoneAgain.checked = false;
change(phoneAgain);
assert.ok(q('[data-branch-field="account:phone"]')
  .closest(".example-field-row").innerHTML.includes("選填"),
  "取消勾選時必填要一起關掉，否則存到的是一個不存在欄位的必填規則");
ok("設定頁：必填跟著勾選走，取消勾選會一併關掉必填");

// 至少保留一種登入方式
assert.equal(q('[data-branch-mode="account"]').getAttribute("aria-checked"), "true");
click(q('[data-branch-mode="account"]'));
assert.equal(q('[data-branch-mode="account"]').getAttribute("aria-checked"), "true",
  "關掉唯一開著的登入方式應被擋下來");
click(q('[data-branch-mode="phone"]'));
assert.equal(q('[data-branch-mode="phone"]').getAttribute("aria-checked"), "true",
  "手機登入應可開啟");
click(q('[data-branch-mode="account"]'));
assert.equal(q('[data-branch-mode="account"]').getAttribute("aria-checked"), "false",
  "還有另一種方式時應可關閉帳號登入");
ok("設定頁：至少保留一種登入方式");

// 有未儲存變更時切頁籤要先確認，確認後還原草稿
assert.equal(q("[data-branch-save]").disabled, false, "有變更時儲存鈕應啟用");
click(q('[data-tabs="branch-setting"] [data-tab-key="base"]'));
const leaveDialog = q("dialog[open]");
assert.ok(leaveDialog, "有未儲存變更時切頁籤應先確認");
assert.ok(leaveDialog.textContent.includes("異動資訊未保存"),
  "確認文案應與正式後台的 info_4 一致");
assert.ok(q(".example-mode-card"), "尚未確認前不該切走");
leaveDialog
  .querySelector("form")
  .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.ok(q(".upload-slot"), "確認後應切到基本設定");
assert.equal(q("[data-branch-save]").disabled, true,
  "確認離開會還原草稿，還原後不該還有未儲存變更");
ok("設定頁：未儲存就切頁籤會先確認，確認後還原草稿");

// 儲存後 dirty 清掉
const title = q('[data-branch-text="frontTitle"]');
title.value = "改過的標題";
title.dispatchEvent(new w.Event("input", { bubbles: true }));
assert.equal(q("[data-branch-save]").disabled, false, "輸入後應變成有未儲存變更");
assert.equal(d.activeElement === title || q('[data-branch-text="frontTitle"]') === title,
  true, "輸入時不該整頁重繪，否則游標會跳到字尾");
click(q("[data-branch-save]"));
assert.equal(q("[data-branch-save]").disabled, true, "儲存後不該還有未儲存變更");
assert.equal(q('[data-branch-text="frontTitle"]').value, "改過的標題", "儲存後的值要留著");
ok("設定頁：輸入不重繪、儲存後清掉未儲存狀態");

// ===== 批量型：遊戲列表 =====
host().innerHTML = w.renderExampleBulk();

const gameRows = () =>
  qa(".example-bulk-page .data-table-grid tbody tr").filter(
    (tr) => !tr.classList.contains("bo-state-row"),
  );
const pick = i => gameRows()[i].querySelector('[data-bulk-row]');

assert.ok(q(".example-bulk-page"), "批量範例畫不出來");
assert.ok(q(".data-table-grid") && q("[data-table-page]"), "批量頁也要用共用的表格＋分頁");
assert.equal(qa(".bulk-head").length, 3, "三個開關欄位的表頭都要有批量入口");
assert.ok(q('[data-bulk-all][data-bulk="game"]'), "缺少全選框");
ok("批量頁：共用表格＋分頁，三個欄位表頭都有批量入口");

// 沒勾選時，作用於勾選資料的按鈕要停用
assert.equal(q("[data-game-review]").disabled, true, "沒勾選時批量審核應停用");
// 表頭選單裡「已勾選」那幾條同樣要停用
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
const menu = q('[data-bulk-menu-for="front"]');
assert.ok(!menu.hidden, "點表頭入口應展開選單");
const selectedActions = [...menu.querySelectorAll('[data-scope="selected"]')];
const allActions = [...menu.querySelectorAll('[data-scope="all"]')];
assert.ok(selectedActions.length === 2 && allActions.length === 2,
  "每個值各要有「已勾選」與「全部」兩條");
assert.ok(selectedActions.every(b => b.disabled), "沒勾選時「已勾選」那幾條要停用");
assert.ok(allActions.every(b => !b.disabled), "「全部」那幾條不受勾選影響");
assert.ok(allActions[0].textContent.includes("24"), "選單要寫出「全部 N 筆」的實際數字");
ok("批量頁：沒勾選時只停用「已勾選」那幾條，「全部」仍可用");

// 一次只開一個選單
click(q('[data-bulk-menu="home"][data-bulk="game"]'));
assert.ok(q('[data-bulk-menu-for="front"]').hidden, "開新選單要關掉舊的");
assert.ok(!q('[data-bulk-menu-for="home"]').hidden, "新選單應展開");
click(q('[data-bulk-menu="home"][data-bulk="game"]'));
assert.ok(q('[data-bulk-menu-for="home"]').hidden, "再點一次應收起");
ok("批量頁：一次只展開一個表頭選單");

// 全選只作用於本頁
click(q('[data-bulk-all][data-bulk="game"]'));
assert.equal(qa('[data-bulk-row][data-bulk="game"]:checked').length, 10,
  "全選只選本頁的 10 筆");
assert.ok(q("[data-game-review]").textContent.includes("10"),
  "工具列按鈕要寫出已勾選筆數");
// 換到第 2 頁，前一頁的勾選要留著，但全選框只反映目前這一頁
click([...qa("[data-table-page]")].find(b => b.textContent.trim() === "2"));
assert.equal(q('[data-bulk-all][data-bulk="game"]').checked, false,
  "第 2 頁沒有全選，全選框不該是勾的");
assert.ok(q("[data-game-review]").textContent.includes("10"),
  "換頁後第 1 頁的勾選要保留");
click([...qa("[data-table-page]")].find(b => b.textContent.trim() === "1"));
assert.equal(q('[data-bulk-all][data-bulk="game"]').checked, true,
  "回到第 1 頁，全選框應恢復為勾選");
ok("批量頁：全選只選本頁，換頁後勾選保留、全選框只反映本頁");

// 批量開關：點了就生效並直接記錄，結果用 Toast 回報兩個數字，沒有復原
const lastToast = () => qa(".bo-message").at(-1)?.textContent ?? "";
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
click(q('[data-bulk-menu-for="front"] [data-scope="selected"][data-value="1"]'));
assert.ok(/已將 10 筆/.test(lastToast()), "回報要寫出影響筆數");
assert.ok(/實際變更 \d+ 筆/.test(lastToast()), "回報要寫出實際變更筆數");
assert.equal(
  gameRows().filter(tr =>
    tr.querySelector('[data-key="front"]').getAttribute("aria-checked") === "true").length,
  10, "本頁 10 筆的前台顯示都應該開啟");
// 回報不得留在畫面上：訊息消失後使用者不再需要它，而且已經沒有復原鈕要掛了
assert.ok(!q("[data-bulk-feedback]"), "批量結果不該在表格上方留一條常駐的回報列");
assert.ok(!q("[data-bulk-undo]"), "批量不給復原——退路放在送出之前，不是事後收回");
ok("批量頁：點了就生效並直接記錄，結果用 Toast 給兩個數字，沒有復原鈕");

// 沒有任何變更時也要講清楚
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
click(q('[data-bulk-menu-for="front"] [data-scope="selected"][data-value="1"]'));
assert.ok(/沒有變更/.test(lastToast()),
  "原本就是該狀態時要說「沒有變更」，不能報成已更新 N 筆");
ok("批量頁：原本就是該狀態時明說沒有變更");

// 批量審核：不可逆，先確認，而且確認後不給復原
click(q("[data-game-review]"));
const reviewDialog = q("dialog[open]");
assert.ok(reviewDialog, "批量審核應先開確認彈窗");
assert.ok(/無法復原/.test(reviewDialog.textContent), "確認彈窗要說明這是不可逆的");
assert.ok(/已勾選/.test(reviewDialog.textContent), "確認彈窗要列出影響範圍");
reviewDialog
  .querySelector("form")
  .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.equal(
  gameRows().filter(tr => tr.innerHTML.includes("待審核")).length, 0,
  "本頁勾選的資料審核後不該還有待審核");
ok("批量頁：批量審核先確認、說明不可逆");

// 取消全選：工具列沒有「清除勾選」，靠全選框再點一次取消本頁
// 目前是全選狀態，再點一次就是取消（jsdom 的 click 會自己切換 checked，不要手動預設）
click(q('[data-bulk-all][data-bulk="game"]'));
assert.equal(qa('[data-bulk-row][data-bulk="game"]:checked').length, 0, "取消全選應清掉本頁勾選");
assert.equal(q("[data-game-review]").disabled, true, "沒有勾選後批量審核應回到停用");
ok("批量頁：取消全選後按鈕回到停用");

// ===== 報表型：遊戲營收報表 =====
host().innerHTML = w.renderExampleReport();
assert.ok(q(".example-report-page"), "報表範例畫不出來");

// 合計列是報表型與一般列表最大的差別，而且它算的是整個查詢區間，不是本頁小計
const foot = q(".example-report-page tfoot tr");
assert.ok(foot, "報表缺少合計列");
assert.ok(/合計（12 筆）/.test(foot.textContent), "合計列要寫出總筆數");
assert.ok(q(".example-report-page .data-table-foot-label"), "合計列的標籤欄要是唯一靠左的那一格");
const footBefore = foot.textContent;

// 查詢區間的天數上限要由共用日期元件在日曆上擋住，不是按下搜尋才報錯
const range = q(".example-report-page [data-date-range]");
assert.ok(range, "報表缺少共用日期區間");
assert.equal(range.dataset.maxDays, "90", "查詢區間要宣告天數上限");
assert.ok(range.hasAttribute("data-past-year"), "查詢區間要同時擋掉未來與一年前");
ok("報表頁：合計列、查詢區間上限都由共用元件提供");

// 負數要用語意色的危險色標出來，不是只靠一個減號
assert.ok(q(".example-report-page .example-amount.is-negative"),
  "報表要示範負數金額的紅字");
ok("報表頁：金額千分位、負數標紅");

// 換頁不該改變合計——它是整個區間的總和
const secondPage = qa('.example-report-page [data-table-page][data-table="report"]')
  .find((b) => b.textContent.trim() === "2");
assert.ok(secondPage, "報表應該分得了頁");
click(secondPage);
assert.equal(q(".example-report-page tfoot tr").textContent, footBefore,
  "合計是整個區間的總和，換頁不該跟著變");
ok("報表頁：合計不隨分頁改變");

// 匯出是建立下載任務，不是當場說「已匯出」
host().insertAdjacentHTML("beforeend", w.downloadCenter());
click(q("[data-report-export]"));
assert.equal(qa(".download-task").length, 1, "匯出應該在下載中心建立一筆任務");
assert.ok(q(".download-task-name").textContent.trim().endsWith(".xlsx"), "任務要帶檔名");
assert.ok(q("[data-download-root] .header-badge.is-task"), "有任務處理中時頁首要有計數");
const toasts = qa(".bo-message");
assert.ok(toasts.some((t) => /已建立匯出任務/.test(t.textContent)),
  "按下匯出當時檔案還不存在，只能說已建立任務");
assert.ok(!toasts.some((t) => /已匯出|匯出成功/.test(t.textContent)),
  "不得在建立任務時就宣稱已匯出");
ok("報表頁：匯出走下載中心，建立任務而不是當場下檔");

// 頁籤切換（滑鼠與鍵盤）都要讓頁面重算，這是共用 tabs.js 的行為
host().innerHTML = w.renderExampleReport();
q('[data-tab-key="total"]').dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
assert.equal(q('[data-tab-key="type"]').getAttribute("aria-selected"), "true",
  "方向鍵要能切換頁籤");
assert.ok(/遊戲類型/.test(q(".example-report-page thead").textContent),
  "鍵盤切換頁籤後表格要跟著換維度");
q('[data-tab-key="provider"]').click();
assert.ok(/遊戲商/.test(q(".example-report-page thead").textContent),
  "點擊切換頁籤後表格要跟著換維度");
ok("報表頁：滑鼠與鍵盤切換頁籤都會重算表格");

// ===== 表單頁型：新增會員 =====
host().innerHTML = w.renderExampleForm();
assert.ok(q(".example-form-page"), "表單頁範例畫不出來");
assert.ok(!q("[data-form-root]"), "一進來應該是列表，不是表單");
click(q("[data-form-new]"));
assert.ok(q("[data-form-root]"), "按新增應該進到獨立的表單頁");
assert.ok(q("[data-form-back]"), "表單頁要有返回列表");
assert.ok(!q("dialog[open]"), "新增走獨立頁，不該開彈窗");
ok("表單頁：新增走獨立頁而不是彈窗，且有返回列表");

// 欄位級錯誤要留在欄位下方，不能用 Toast
const toastsBefore = qa(".bo-message").length;
q("[data-form-root]").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.ok(q(".example-form-page .guide-input.is-error"), "必填沒填應該標出錯誤欄位");
assert.ok(/請輸入帳號/.test(q("#member-account-error").textContent), "錯誤文字要留在欄位下方");
assert.equal(q("#member-account").getAttribute("aria-describedby"), "member-account-error",
  "錯誤文字要用 aria-describedby 連回欄位");
assert.equal(qa(".bo-message").length, toastsBefore,
  "欄位級錯誤不得用 Toast——Toast 會消失，使用者回頭找不到是哪一格");
ok("表單頁：欄位級錯誤是行內文字並連回欄位，不是 Toast");

// 改到一半要離開先確認
const account = q("#member-account");
account.value = "new_member01";
account.dispatchEvent(new w.Event("input", { bubbles: true }));
click(q("[data-form-back]"));
const guard = q("dialog[open]");
assert.ok(guard, "有未儲存變更就離開要先確認");
assert.ok(/未保存/.test(guard.textContent), "確認彈窗要說明變更不會保留");
guard.querySelector("[data-example-close]").click();
assert.ok(q("[data-form-root]"), "選擇留在此頁就不該離開表單");
ok("表單頁：改到一半要離開會先確認");

// 送出成功：導回列表、新資料出現在列表上、Toast 帶受詞
const fill = (id, value) => {
  const input = q(id);
  input.value = value;
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
};
fill("#member-account", "new_member01");
fill("#member-name", "新會員");
fill("#member-password", "abcd1234");
q("[data-form-root]").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.ok(!q("[data-form-root]"), "送出成功要導回列表");
assert.ok(/new_member01/.test(q(".example-form-page tbody").textContent), "新資料要出現在列表上");
assert.ok(qa(".bo-message").some((t) => /已建立會員 new_member01/.test(t.textContent)),
  "成功的 Toast 要帶受詞");
ok("表單頁：送出成功後導回列表、新資料出現、Toast 帶受詞");

// ===== 混合型：設定頁裡還有表格 =====
host().innerHTML = w.renderExampleMixed();
assert.ok(q(".example-mixed-page"), "混合型範例畫不出來");
assert.equal(qa(".example-mixed-page .bo-tab").length, 6, "六個設定頁籤");

// 開關切換會改草稿，存檔列跟著變成「有尚未儲存的變更」
assert.equal(q(".example-mixed-page .example-save-status").textContent, "儲存後才會套用");
click(q('[data-mixed-switch="transferEnabled"]'));
assert.equal(q(".example-mixed-page .example-save-status").textContent, "有尚未儲存的變更");
assert.equal(q("[data-mixed-save]").disabled, false, "有變更後才可儲存");
ok("混合型：開關改的是草稿，要按儲存才套用");

// 存款設定的數值驗證：錯誤要跳到出錯的頁籤並留在欄位下方，不用 Toast
q('[data-tab-key="deposit"]').click();
const min = q("#mixed-minDeposit");
min.value = "900000";
min.dispatchEvent(new w.Event("input", { bubbles: true }));
q('[data-tab-key="basic"]').click();
const beforeToasts = qa(".bo-message").length;
click(q("[data-mixed-save]"));
assert.equal(q('[data-tab-key="deposit"]').getAttribute("aria-selected"), "true",
  "驗證失敗要跳回出錯的那個頁籤");
assert.ok(/不可低於最低金額/.test(q("#mixed-maxDeposit-error").textContent),
  "錯誤要留在欄位下方");
assert.equal(qa(".bo-message").length, beforeToasts, "欄位級錯誤不得用 Toast");
ok("混合型：驗證失敗跳回出錯頁籤，錯誤是行內文字");

// 取消變更會把草稿還原
click(q("[data-mixed-cancel]"));
assert.equal(q(".example-mixed-page .example-save-status").textContent, "儲存後才會套用");
ok("混合型：取消變更還原草稿");

// 返水規則：整張表就是表單，批量套用改的也是草稿
q('[data-tab-key="rebate"]').click();
assert.equal(qa('.example-mixed-page [data-mixed-rule]').length, 12, "四個分類各三個欄位");
const bulk = q("[data-mixed-rule-bulk]");
bulk.value = "1.5";
click(q("[data-mixed-rule-apply]"));
assert.ok(qa('[data-mixed-rule][data-mixed-rule-key="rate"]').every(input => input.value === "1.5"),
  "批量套用要改到每一列");
ok("混合型：表格裡放輸入欄位，批量套用改全部分類");

// 優惠活動：排序模式才出現拖曳把手，鍵盤也要能調順序
q('[data-tab-key="promotions"]').click();
assert.equal(d.querySelector("[data-promotion-drag]"), null, "沒按排序就不該有把手");
click(q('[data-mixed-promo="sort"]'));
assert.equal(qa("[data-promotion-drag]").length, 3, "排序模式每列一個把手");
const firstTitle = () => q(".example-mixed-page tbody tr .example-mixed-link").textContent;
const before = firstTitle();
const handle = q("[data-promotion-drag]");
handle.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
assert.notEqual(firstTitle(), before, "方向鍵要能調整順序");
ok("混合型：排序模式持續顯示把手，鍵盤也能排序");

// 活動名稱開唯讀快照，外殼沿用共用彈窗
click(q(".example-mixed-link"));
const snapshot = q("dialog[open]");
assert.ok(snapshot.classList.contains("bo-modal"), "快照要沿用共用彈窗外殼，不自製 chrome");
assert.ok(snapshot.querySelector(".bo-modal-close"), "共用彈窗的右上角關閉鈕");
assert.ok(snapshot.querySelector(".bo-tabs"), "快照裡的語言頁籤用共用元件");
snapshot.querySelector("[data-promo-close]").click();
assert.equal(d.querySelector("dialog"), null);
ok("混合型：唯讀快照沿用共用彈窗外殼");

// ===== 搜尋結果型：會員列表 =====
host().innerHTML = w.renderExampleMember();
assert.ok(q(".example-member-page"), "會員列表範例畫不出來");
assert.equal(qa(".example-member-page thead th").length, 13, "13 欄");
assert.ok(q(".example-member-page .data-table-scroll"), "欄位多要用共用表格的橫向捲動");
assert.ok(q(".example-member-page thead th:last-child").classList.contains("is-sticky-right"),
  "操作欄要釘在右側");
assert.ok(q('[data-table-page][data-table="member"]'), "分頁由共用表格提供，頁面不自己兜");
assert.ok(!/onclick=/.test(q(".example-member-page").innerHTML),
  "操作一律走事件委派，不得用 inline onclick");
ok("搜尋頁：13 欄共用表格、固定操作欄、分頁與事件委派");

// 唯讀詳情走共用抽屜，底部只有關閉（加上一顆帶進下一層的登入紀錄）
click(q("[data-member-summary]"));
assert.ok(q("#detailOverlay").classList.contains("open"), "帳號要開右側抽屜");
assert.equal(q("#detailDrawerTitle").textContent, "會員詳情摘要");
assert.ok(/總餘額/.test(q("#detailBody").textContent), "摘要要帶欄位");
assert.ok(q(".drawer-foot [data-member-drawer-close]"), "抽屜底部要有關閉");
assert.equal(d.querySelector("dialog"), null, "唯讀內容不得改用彈窗");
click(q('.drawer-foot [data-member-records]'));
assert.equal(q("#detailDrawerTitle").textContent, "登入紀錄");
click(q("[data-member-drawer-close]"));
assert.ok(!q("#detailOverlay").classList.contains("open"));
ok("搜尋頁：唯讀詳情與登入紀錄都走共用抽屜");

// 列上的狀態下拉改了就生效，並用 Toast 回報
const statusSelect = q("[data-member-status]");
statusSelect.value = "停用";
change(statusSelect);
assert.ok(qa(".bo-message").some((t) => /已將 .+ 設為停用/.test(t.textContent)),
  "狀態改了要回報，且文案帶受詞");
ok("搜尋頁：狀態下拉改了就生效");

// 篩不到資料時只有表格內變成空狀態，篩選列與工具列都不動
const keyword = q("#member-keyword");
keyword.value = "不存在的帳號";
q("[data-member-filter]").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
assert.ok(q(".example-member-page .bo-state-row"), "篩不到要顯示共用空狀態");
assert.ok(q("[data-member-filter]") && q(".example-member-page .example-toolbar"),
  "空狀態時篩選列與工具列都要留在原位");
assert.ok(!q(".example-member-page .bo-state-row button"), "狀態區裡不得有按鈕");
ok("搜尋頁：空狀態只影響表格，工具列不動");

// 匯出一樣走下載中心
host().insertAdjacentHTML("beforeend", w.downloadCenter());
const tasksBefore = qa(".download-task").length;
click(q("[data-member-export]"));
assert.equal(qa(".download-task").length, tasksBefore + 1, "匯出要建立下載任務");
ok("搜尋頁：匯出走下載中心");

// ===== 編輯會員走獨立表單頁 =====
//
// 正式後台 8 個功能的新增與編輯都是獨立路由頁。這裡守的是獨立頁該有的三件事：
// 出口講得出要去哪、沒改動不擋路、改過才問，以及存檔後列表要跟著變。
{
  host().innerHTML = w.renderExampleMember();
  click(q("[data-member-reset]"));
  const firstAccount = q(".example-member-page tbody .example-member-link").textContent;

  click(q("[data-member-edit]"));
  assert.ok(q("[data-member-edit-form]"), "編輯要進獨立的表單頁，不是彈窗或抽屜");
  assert.ok(!q(".example-member-page .data-table-grid"), "進了表單頁就不該還留著列表");

  // 出口：左上返回列表 ＋ 底部取消／儲存，沒有右上角的 X（那是彈窗與抽屜的語彙）
  const back = qa("[data-member-back]");
  assert.equal(back.length, 2, "獨立頁要有兩個出口：左上的返回列表與存檔列的取消");
  assert.match(back[0].textContent, /返回列表/, "返回鍵要寫得出會落到哪裡，不能只有箭頭");
  assert.ok(!q("[data-member-edit-form] .bo-modal-close, .example-form-bar [aria-label*='關閉']"),
    "獨立頁不放 X：它底下沒有東西可以露出來");
  assert.ok(q("[data-member-edit-form] [type='submit']"), "存檔列要有主要操作");

  // 身分欄位唯讀，而且不是用停用的輸入框假裝
  assert.ok(q(".example-readonly-value"), "UID／帳號／註冊時間要是唯讀文字");
  assert.ok(!q("[data-member-edit-form] input[disabled]"), "唯讀欄位不得做成停用的輸入框");

  // 沒改動就直接回列表，不跳確認
  click(back[0]);
  assert.ok(!q("dialog[open]"), "沒有變更時返回不該跳確認");
  assert.ok(q(".example-member-page .data-table-grid"), "返回後要回到列表");

  // 改過之後才問，而且可以留在此頁
  click(q("[data-member-edit]"));
  const nameInput = q("[data-member-field='name']");
  nameInput.value = "改過的名字";
  nameInput.dispatchEvent(new w.Event("input", { bubbles: true }));
  click(qa("[data-member-back]")[0]);
  const guard = q("dialog[open]");
  assert.ok(guard, "改過之後離開要先確認");
  click(guard.querySelector("[data-example-close]"));
  assert.ok(q("[data-member-edit-form]"), "選擇留在此頁就不能把表單收掉");

  // 必填擋得住，而且錯誤是行內文字不是 Toast
  const toastsBefore = qa(".bo-message").length;
  nameInput.value = "";
  nameInput.dispatchEvent(new w.Event("input", { bubbles: true }));
  q("[data-member-edit-form]").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  assert.ok(q("#member-edit-name-error").textContent.trim(), "姓名空白要擋下來");
  assert.equal(qa(".bo-message").length, toastsBefore, "欄位錯誤不得用 Toast 報");
  assert.ok(q("[data-member-edit-form]"), "驗證沒過要留在表單頁");

  // 存檔後回列表，列表上看得到新資料，Toast 帶受詞
  const renamed = "Renamed Member";
  const nameAgain = q("[data-member-field='name']");
  nameAgain.value = renamed;
  nameAgain.dispatchEvent(new w.Event("input", { bubbles: true }));
  q("[data-member-edit-form]").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  assert.ok(!q("[data-member-edit-form]"), "存檔後要導回列表");
  assert.ok(q(".example-member-page .data-table-grid").textContent.includes(renamed),
    "存檔後列表要跟著更新");
  assert.ok(qa(".bo-message").some((t) => new RegExp(`已更新會員 ${firstAccount}`).test(t.textContent)),
    "存檔的 Toast 要帶受詞");
  ok("搜尋頁：編輯走獨立表單頁，兩個出口、沒改動不擋路、改過才問、存檔回列表");
}

// ===== 表格內的操作欄一律置中，而且由共用表格決定 =====
//
// 先前是每一頁自己寫一次 justify-content:center，漏一頁就左靠；
// 而且操作欄沒給寬度時，auto table layout 會把剩餘寬度全塞給它，
// 欄位比內容寬很多，置中之後看起來仍然像貼在左邊。
{
  const tableCss = fs.readFileSync("data-table.css", "utf8");
  const centred = tableCss.slice(tableCss.indexOf(".page .data-table-grid td .icon-action-group"));
  assert.ok(
    tableCss.includes(".page .data-table-grid td .icon-action-group") &&
      centred.slice(0, centred.indexOf("}")).includes("justify-content: center"),
    "表格內的操作欄要由共用表格統一置中",
  );
  for (const file of ["example-list.js", "example-form.js", "example-permission.js", "example-mixed.js", "example-member.js"]) {
    const src = fs.readFileSync(file, "utf8");
    const column = src.match(/{ key: 'actions',[^}]*}/);
    assert.ok(column, file + " 找不到操作欄定義");
    assert.ok(/width:/.test(column[0]),
      file + " 的操作欄要給寬度，否則 auto table layout 會把剩餘寬度塞給它");
  }
  // 頁面不得再各自寫一次置中，否則規則又散回去
  for (const file of ["example-list.css", "example-form.css", "example-permission.css", "example-mixed.css", "example-member.css"]) {
    const src = fs.readFileSync(file, "utf8");
    assert.ok(!/-actionss*{[^}]*justify-content/.test(src),
      file + " 不該再自己寫操作欄置中，共用表格已經統一處理");
  }
  ok("表格內的操作欄置中與欄寬由共用表格統一決定");

  // 欄名一律置中：align 說的是「內容」怎麼對齊（金額靠右、帳號靠左），欄名沒有那個需求。
  // 以前 th 跟著 td 吃同一個 align，一整排表頭會出現置中、靠左、靠右三種。
  host().innerHTML = w.renderExampleMember();
  const heads = qa(".example-member-page thead th");
  assert.ok(heads.length, "找不到表頭");
  const strayed = heads
    .filter((th) => /text-align/.test(th.getAttribute("style") || ""))
    .map((th) => th.textContent.trim());
  assert.deepEqual(strayed, [], `表頭不得自帶 text-align：${strayed.join("、")}`);
  // 內容的對齊要留著，否則金額就不是靠右了
  const amount = qa(".example-member-page tbody td").filter((td) =>
    /text-align:\s*right/.test(td.getAttribute("style") || ""),
  );
  assert.ok(amount.length, "金額欄的內容仍要靠右，只有欄名置中");
  ok("表頭欄名一律置中，內容維持各自的對齊");

  // 表格上方不放任何說明或狀態文字（全站規範）。那行字不會自己消失，使用者做完下一件事
  // 它還留在原地；操作結果一律用 Toast。常駐的只有欄位級錯誤與表格內的狀態區。
  for (const [render, page] of [
    [w.renderExampleList, "禮物卡"], [w.renderExampleBulk, "批量"],
    [w.renderExampleMember, "會員列表"],
    [w.renderExampleReport, "報表"],
  ]) {
    host().innerHTML = render();
    for (const table of qa(".data-table")) {
      // 表格所在的卡片裡，表格之前不該有任何文字段落
      const card = table.parentElement;
      const before = [...card.children].slice(0, [...card.children].indexOf(table));
      const stray = before
        // 手機卡片是同一份資料的另一種排法，不是說明文字
        .filter((el) => !el.classList.contains("data-cards") && !el.querySelector(".data-cards"))
        .filter((el) => el.textContent.trim())
        .map((el) => el.textContent.trim().slice(0, 30));
      assert.deepEqual(stray, [],
        `${page}頁在表格上方留了說明文字：${stray.join("／")}——操作結果要用 Toast`);
    }
  }
  ok("四個列表頁的表格上方都沒有說明或狀態文字（風控審核在 workflow-check 驗）");

  // 欄位對齊照「表格 Table → 欄位對齊」：要從頭比對的字串靠左、要比大小的數字靠右。
  // 同一個欄位在不同頁面要一致——「上層代理」在會員列表與審核頁都是帳號，兩邊都靠左。
  const ALIGN_LEFT = /^(UID|帳號|上層代理|上級代理|姓名|名稱|會員編號|轉點 ID|兌換代碼|遊戲商|說明|角色名稱|活動名稱|遊戲分類|遊戲名稱|功能|設備指紋|瀏覽器與版本|會員帳號／真實姓名|註冊／最後登入 IP|IP 地址|轉點渠道)$/;
  const ALIGN_RIGHT = /(金額|餘額|存款|提款|面額|數量|筆數|成員數|投注|派彩|營收|佔比|行政費)/;
  const misaligned = [];
  for (const file of ["example-member.js", "example-list.js", "example-bulk.js",
    "example-form.js", "example-permission.js", "example-audit.js", "table-guide-page.js"]) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(/\{ key: '(\w+)', label: '([^']*)'([^}]*)\}/g)) {
      const [, , label, rest] = m;
      const align = (rest.match(/align: '(\w+)'/) || [])[1] || "center";
      if (ALIGN_LEFT.test(label) && align !== "left") misaligned.push(`${file} 的「${label}」應靠左，現在是 ${align}`);
      if (ALIGN_RIGHT.test(label) && align !== "right") misaligned.push(`${file} 的「${label}」應靠右，現在是 ${align}`);
    }
  }
  assert.deepEqual(misaligned, [], "欄位對齊不符規範：\n  " + misaligned.join("\n  "));
  // 審核頁的欄位是 [key, label, width, align] 的 tuple，另外驗
  const auditSrc = fs.readFileSync("example-audit.js", "utf8");
  for (const m of auditSrc.matchAll(/\['(\w+)', '([^']*)', \d+(?:, '(\w+)')?\]/g)) {
    const [, , label, align = "center"] = m;
    if (ALIGN_LEFT.test(label) && align !== "left") misaligned.push(`審核頁的「${label}」應靠左`);
    if (ALIGN_RIGHT.test(label) && align !== "right") misaligned.push(`審核頁的「${label}」應靠右`);
  }
  assert.deepEqual(misaligned, [], "審核頁欄位對齊不符規範：\n  " + misaligned.join("\n  "));
  ok("欄位對齊照用途分三種，同一個欄位在各頁一致");
}

// ===== 手機：有篩選列的頁面都要有打得開的入口 =====
//
// 720px 以下 .source-filter 是 display:none，要靠 .mobile-open 才打得開。
// 先前只有會員列表與風控審核寫了開關，禮物卡／報表／遊戲列表三頁沒有——
// 那三頁在手機上篩選列整個消失，而且沒有任何入口。
for (const [name, html] of [
  ["列表", w.renderExampleList()],
  ["報表", w.renderExampleReport()],
  ["批量", w.renderExampleBulk()],
  ["搜尋", w.renderExampleMember()],
]) {
  host().innerHTML = html;
  const filter = q(".example-page .source-filter");
  const toggle = d.querySelector("[data-filter-toggle]");
  assert.ok(toggle, name + "：有篩選列就要有手機版的開關");
  assert.equal(toggle.dataset.filterToggle, filter.id,
    name + "：開關要指到這一頁的篩選列");
  assert.equal(toggle.getAttribute("aria-controls"), filter.id,
    name + "：開關要用 aria-controls 連到篩選列");
  click(toggle);
  assert.ok(filter.classList.contains("mobile-open"), name + "：點開關要打得開篩選列");
  assert.equal(toggle.getAttribute("aria-expanded"), "true", name + "：展開狀態要回報給報讀器");
  click(toggle);
  assert.ok(!filter.classList.contains("mobile-open"), name + "：再點一次要收起來");
}
ok("手機：四個有篩選列的頁面都用同一個共用開關，開得起來也收得回去");

// ===== 手機卡片只有一個實作 =====
//
// 「卡片還是表格」的判準寫在表格規範頁，卡片本身則由 dataCards() 產生。
// 先前會員列表與風控審核各自手寫一份 .mobile-card，兩邊的間距與欄位排法都不一樣。
{
  host().innerHTML = w.renderExampleMember();
  // 前面的測試把關鍵字留在「不存在的帳號」，先清掉才看得到資料
  click(q("[data-member-reset]"));
  const memberCards = qa(".example-member-page .data-card");
  assert.ok(memberCards.length, "會員列表的手機卡片要用共用的 dataCards()");
  assert.ok(q(".example-member-page .data-card-meta"), "卡片的欄位要用共用的兩欄排法");
  // 卡片與表格是同一批資料
  const firstAccount = q(".example-member-page tbody .example-member-link").textContent;
  assert.ok(
    memberCards[0].textContent.includes(firstAccount),
    "卡片與表格要吃同一份資料，不是各自一套",
  );
  // 手機不得比桌機少欄位：少掉的欄位在手機上就等於查不到。
  // 帳號是卡片標題、狀態是卡片右上的下拉、操作在底下那一列，其餘都要是 meta 的一格。
  const headers = qa(".example-member-page thead th")
    .map((th) => th.textContent.trim())
    .filter((label) => label && !["帳號", "狀態", "操作"].includes(label));
  const cardFields = qa(
    ".example-member-page .data-card:first-child .data-card-meta dt",
  ).map((dt) => dt.textContent.trim());
  assert.deepEqual(
    headers.filter((label) => !cardFields.includes(label)),
    [],
    `手機卡片少了桌機有的欄位：卡片上只有 ${cardFields.join("、")}`,
  );
  ok(`手機卡片帶齊桌機的 ${headers.length} 個欄位，順序與表格一致`);

  // 風控審核的卡片把相近的欄位併成一格（「異動前／後餘額」），欄名對不起來，
  // 改從原始碼比對：表格列用到的每一個 row.X，卡片也要用到。併格可以，少放不行。
  {
    const src = fs.readFileSync("example-audit.js", "utf8");
    const bodyOf = (name) => {
      const start = src.indexOf(name);
      assert.ok(start > -1, `example-audit.js 找不到 ${name}`);
      return src.slice(start, src.indexOf("\n}", start));
    };
    const fields = (body) => new Set([...body.matchAll(/\brow\.(\w+)/g)].map((m) => m[1]));
    const inTable = fields(bodyOf("const tableRows ="));
    const inCards = fields(bodyOf("function cardsMarkup"));
    const dropped = [...inTable].filter((f) => !inCards.has(f));
    assert.deepEqual(dropped, [],
      `審核頁的手機卡片少了桌機有的欄位：${dropped.join("、")}——手機不得精簡欄位`);
    ok(`審核頁：手機卡片帶齊表格用到的 ${inTable.size} 個欄位，併格但不少放`);
  }

  // 狀態是三選一，列上的下拉與篩選列的下拉要給同一組選項
  const rowStatus = qa(
    ".example-member-page .data-card:first-child [data-member-status] option",
  ).map((o) => o.textContent.trim());
  assert.deepEqual(rowStatus, ["啟用", "停用", "凍結"], "列上的狀態下拉要有三種狀態");
  const filterStatus = qa('.example-member-page [name="status"] option').map((o) =>
    o.textContent.trim(),
  );
  assert.deepEqual(
    filterStatus,
    ["全部狀態", "啟用", "停用", "凍結"],
    "篩選列的狀態下拉要與列上的同一組選項",
  );
  for (const file of ["example-member.js", "example-audit.js", "example-list.js"]) {
    const src = fs.readFileSync(file, "utf8");
    assert.ok(
      !/class="mobile-card"/.test(src),
      file + " 不該再自己手寫卡片，改用共用的 dataCards()",
    );
  }
  ok("手機卡片：三頁都用共用的 dataCards()，與表格吃同一份資料");

  // 包住卡片的容器不得自己加內距：左右留白由外層的 .example-card 一層負責。
  // 三頁用同一個元件、同一種容器，其中一頁多縮一圈就會比另外兩頁窄。
  for (const [file, wrapper] of [
    ["example-member.css", "example-member-cards"],
    ["example-list.css", "example-gift-cards"],
    ["example-audit.css", "risk-mobile-list"],
  ]) {
    const src = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = src.match(new RegExp(`\\.${wrapper}\\s*\\{([^}]*)\\}`));
    assert.ok(!rule || !/padding/.test(rule[1]),
      `${file} 的 .${wrapper} 不該自己加內距，留白由 .example-card 負責`);
  }
  ok("手機卡片的容器不自己加內距，三頁寬度一致");

  // 禮物卡：列上有「作廢」這種不可逆操作，按之前要先看完兌換進度，所以手機用卡片。
  // 九個欄位一個不漏——活動名稱是標題、兌換代碼是副標、狀態在右上、操作在底下。
  {
    host().innerHTML = w.renderExampleList();
    const giftHeads = qa(".example-list-page thead th")
      .map((th) => th.textContent.trim())
      .filter((label) => label && !["活動名稱", "兌換代碼", "狀態", "操作"].includes(label));
    const giftCard = q(".example-list-page .data-card");
    assert.ok(giftCard, "禮物卡的手機卡片要用共用的 dataCards()");
    const giftFields = [...giftCard.querySelectorAll(".data-card-meta dt")].map((dt) =>
      dt.textContent.trim(),
    );
    assert.deepEqual(
      giftHeads.filter((label) => !giftFields.includes(label)),
      [],
      `禮物卡的手機卡片少了桌機有的欄位：卡片上只有 ${giftFields.join("、")}`,
    );
    // 三顆操作要跟著進卡片，否則手機上看得到卻按不到
    assert.equal(
      giftCard.querySelectorAll(".data-card-actions button").length, 3,
      "禮物卡的卡片要帶齊編輯／暫停啟用／作廢三顆操作",
    );
    ok(`禮物卡：手機卡片帶齊桌機的 ${giftHeads.length} 個欄位與三顆操作`);
  }
}

// --- 儀表板（統計卡型）---
//
// 這一頁沒有表格，能錯的地方全在「版面是不是跟全站同一套」與「數字寫對沒有」。
// 查詢用的是 setTimeout，所以這一段是非同步的。
const dashboardChecks = async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  host().innerHTML = w.renderExampleDashboard();

  // 八張卡、順序與正式後台 dashboard.vue 的 el-col 一字不差
  const LABELS = [
    "今日總有效投注額", "今日存款玩家數", "今日總存款金額", "今日首存玩家數",
    "今日總輸贏", "總玩家數", "今日註冊玩家數", "本月遊戲總輸贏",
  ];
  assert.deepEqual(
    qa(".example-dashboard-page .example-kpi-title").map((el) => el.textContent.trim()),
    LABELS,
    "八張統計卡的名稱與順序要照 dashboard.vue",
  );
  ok("儀表板：八張統計卡與 dashboard.vue 同名同序");

  // 格線只有一個來源：套 .guide-fields，頁面自己的 css 不得再宣告欄數或高度
  assert.ok(
    q(".example-dashboard-page .guide-fields.example-kpi-grid"),
    "統計卡要套共用的 .guide-fields 格線，不自己排一套",
  );
  {
    const css = fs.readFileSync("example-dashboard.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/grid-template-columns/.test(css),
      "example-dashboard.css 不該自己宣告欄數，格線只在 guide-page.css 的 .guide-fields 定義");
    assert.ok(!/(^|[\s;{])height\s*:/.test(css),
      "統計卡不得寫死高度，交給標題與數字撐開");
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css),
      "example-dashboard.css 不得寫死色碼，正負色取 --danger／--success");
  }
  ok("儀表板：格線套 .guide-fields，卡片不寫死高度、不寫死色碼");

  // 數值呈現：金額千分位加固定兩位小數，人數千分位不帶小數
  {
    const values = qa(".example-dashboard-page .example-kpi-value").map((el) => el.textContent.trim());
    const amounts = [0, 2, 4, 7].map((i) => values[i]);
    const counts = [1, 3, 5, 6].map((i) => values[i]);
    for (const text of amounts) {
      assert.match(text, /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/, `金額要千分位加兩位小數，目前是 ${text}`);
    }
    for (const text of counts) {
      assert.match(text, /^\d{1,3}(,\d{3})*$/, `筆數要千分位且不帶小數，目前是 ${text}`);
    }
    ok("儀表板：金額千分位加兩位小數、筆數不帶小數");

    // 正負色只掛在兩張輸贏卡上，而且跟著數字的正負走；其餘六張一律一般文字色
    const cards = qa(".example-dashboard-page .example-kpi-value");
    cards.forEach((el, index) => {
      const negative = el.textContent.trim().startsWith("-");
      const signed = index === 4 || index === 7;
      assert.equal(
        el.classList.contains("is-negative"), signed && negative,
        `${LABELS[index]} 的負數色掛錯了`,
      );
      assert.equal(
        el.classList.contains("is-positive"), signed && !negative,
        `${LABELS[index]} 的正數色掛錯了`,
      );
    });
    ok("儀表板：正負色只跟著輸贏走，其餘六張用一般文字色");
  }

  // 篩選列：只有一格條件也照同一套版面，手機有共用開關，重設在前、搜尋在後
  {
    assert.ok(q('[data-filter-toggle="dashboard-search-panel"]'),
      "儀表板的篩選列在手機上要有共用的 filterToggle 開關");
    const actions = qa(".example-dashboard-page .source-filter-actions button")
      .map((b) => b.textContent.trim());
    assert.deepEqual(actions, ["重設", "搜尋"], "重設在前、搜尋在後");
    // 卡片上方不放任何說明或狀態文字：工具列之後直接就是卡片
    const cardsHost = q("[data-dashboard-cards]");
    assert.ok(cardsHost.previousElementSibling.classList.contains("example-toolbar"),
      "工具列與統計卡之間不得插一行狀態文字");
    ok("儀表板：篩選列照共用版面，卡片上方沒有狀態文字");
  }

  // 換站台：按下搜尋才查；查詢期間舊數字留在原地變淡，不換成骨架
  {
    const before = q(".example-dashboard-page .example-kpi-value").textContent.trim();
    const select = q('.example-dashboard-page [name="branch"]');
    select.value = "VIP CLUB";
    assert.equal(
      q(".example-dashboard-page .example-kpi-value").textContent.trim(), before,
      "改了下拉還沒按搜尋就重查了（不做邊打邊查）",
    );
    q(".example-dashboard-page [data-dashboard-filter]")
      .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    assert.ok(q("[data-dashboard-cards] .bo-veil"), "重新查詢要蓋遮罩");
    assert.equal(qa("[data-dashboard-cards] .example-kpi").length, 8,
      "已經有資料時不得把舊數字換成骨架");
    assert.ok(!q("[data-dashboard-cards] .bo-skeleton"), "已經有資料時不得出現骨架");

    await sleep(600);
    assert.ok(!q("[data-dashboard-cards] .bo-veil"), "查完要把遮罩收掉");
    assert.notEqual(
      q(".example-dashboard-page .example-kpi-value").textContent.trim(), before,
      "換了站台之後數字要跟著換",
    );
    ok("儀表板：按搜尋才查，查詢期間舊數字留在原地變淡");
  }

  // 重設＝回到預設站台再查一次，不是把條件清空
  {
    click(q("[data-dashboard-reset]"));
    assert.equal(q('.example-dashboard-page [name="branch"]').value, "101 BEST",
      "重設要回到預設站台，不是留一個空的下拉");
    await sleep(600);
    ok("儀表板：重設回到預設站台並自動查一次");
  }
};

dashboardChecks().then(() => {
  console.log(
    "\nPASS: 組合範例（搜尋／列表／設定／批量／報表／表單頁／混合／儀表板：共用表格與分頁、固定欄、操作欄置中、手機卡片、抽屜、守衛、合計、匯出任務、行內錯誤、表格即表單、拖曳排序、統計卡格線、手機篩選列開關）",
  );
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
