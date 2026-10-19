// 三個組合範例頁要真的能用：node example-check.cjs
//
// 規範頁只要畫得出來就算過，組合範例不行——它們的價值在於「兜起來之後還能動」。
// 篩選會不會把分頁的頁數上限一起改掉、關掉最後一種登入方式會不會把人鎖在外面、
// 改到一半切頁籤會不會把資料吃掉，這些都只有實際點一遍才看得出來。
const { JSDOM } = require("jsdom");
const fs = require("fs");
const assert = require("node:assert/strict");

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
run("states.js", "", ";window.emptyRow=emptyRow");
run(
  "data-table.js",
  ICON + "const emptyRow=window.emptyRow;",
  ";window.dataTable=dataTable;window.applyPaging=applyPaging;window.PAGE_SIZES=PAGE_SIZES",
);
const TABLE =
  "const dataTable=window.dataTable,applyPaging=window.applyPaging,PAGE_SIZES=window.PAGE_SIZES;";
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

run("bulk-actions.js", ICON + BTN, ";window.bulkParts={selectAllControl,selectRowControl,bulkHeader,bulkFeedback,selectionOf,applyBulk,PICK_COLUMN}");
const BULK = "const {selectAllControl,selectRowControl,bulkHeader,bulkFeedback,selectionOf,applyBulk,PICK_COLUMN}=window.bulkParts;";

// --- 受測頁 ---
run(
  "example-list.js",
  TABLE + TAG + MODAL + MSG + ON + ICON + BTN +
    "const progressBar=window.progressBar;",
);
run(
  "example-settings.js",
  TAG + MODAL + MSG + ON + ICON +
    "const tabs=window.tabs,tabPanels=window.tabPanels,choiceControl=window.choiceControl,uploadSlot=window.uploadSlot;",
);

run(
  "example-bulk.js",
  TABLE + TAG + MODAL + MSG + ON + ICON + BULK,
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
  const rule = css.match(/\.example-card\s*\{([^}]*)\}/);
  assert.ok(rule, "example-page.css 缺少 .example-card");
  const padding = rule[1].match(/padding\s*:\s*([^;]+)/);
  assert.ok(padding, ".example-card 必須明確宣告 padding（基礎 .card 沒有內距）");
  assert.ok(
    !/^0(px)?$/.test(padding[1].trim()),
    `包住表格的卡片不能把內距歸零，目前是 padding:${padding[1].trim()}`,
  );
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
assert.ok(q(".settings-savebar [data-branch-save]"), "缺少儲存列");
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

// 批量開關：回報要同時給影響筆數與實際變更筆數，而且可以復原
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
const beforeOn = gameRows().filter(tr =>
  tr.querySelector('[data-key="front"]').getAttribute("aria-checked") === "true").length;
click(q('[data-bulk-menu-for="front"] [data-scope="selected"][data-value="1"]'));
const feedback = q('[data-bulk-feedback="game"]');
assert.ok(/已將 10 筆/.test(feedback.textContent), "回報要寫出影響筆數");
assert.ok(/實際變更 \d+ 筆/.test(feedback.textContent), "回報要寫出實際變更筆數");
assert.equal(
  gameRows().filter(tr =>
    tr.querySelector('[data-key="front"]').getAttribute("aria-checked") === "true").length,
  10, "本頁 10 筆的前台顯示都應該開啟");
assert.ok(q('[data-bulk-undo][data-bulk="game"]'), "批量動作後要出現復原鈕");
click(q('[data-bulk-undo][data-bulk="game"]'));
assert.equal(
  gameRows().filter(tr =>
    tr.querySelector('[data-key="front"]').getAttribute("aria-checked") === "true").length,
  beforeOn, "復原後應回到原本的開啟筆數");
assert.ok(!q('[data-bulk-undo][data-bulk="game"]'), "復原之後不該還留著復原鈕");
ok("批量頁：回報給兩個數字，且可復原一次");

// 沒有任何變更時也要講清楚
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
click(q('[data-bulk-menu-for="front"] [data-scope="selected"][data-value="1"]'));
click(q('[data-bulk-menu="front"][data-bulk="game"]'));
click(q('[data-bulk-menu-for="front"] [data-scope="selected"][data-value="1"]'));
assert.ok(/沒有變更/.test(q('[data-bulk-feedback="game"]').textContent),
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
assert.ok(!q('[data-bulk-undo][data-bulk="game"]'),
  "不可逆的動作不該給復原鈕——點了沒用比沒有更糟");
assert.equal(
  gameRows().filter(tr => tr.innerHTML.includes("待審核")).length, 0,
  "本頁勾選的資料審核後不該還有待審核");
ok("批量頁：批量審核先確認、說明不可逆，完成後不給復原");

// 取消全選：工具列沒有「清除勾選」，靠全選框再點一次取消本頁
// 目前是全選狀態，再點一次就是取消（jsdom 的 click 會自己切換 checked，不要手動預設）
click(q('[data-bulk-all][data-bulk="game"]'));
assert.equal(qa('[data-bulk-row][data-bulk="game"]:checked').length, 0, "取消全選應清掉本頁勾選");
assert.equal(q("[data-game-review]").disabled, true, "沒有勾選後批量審核應回到停用");
ok("批量頁：取消全選後按鈕回到停用");

console.log(
  "\nPASS: 組合範例（列表型篩選／分頁／作廢確認；設定型頁籤守衛／必填連動；批量型表頭選單／本頁全選／復原／不可逆確認）",
);
