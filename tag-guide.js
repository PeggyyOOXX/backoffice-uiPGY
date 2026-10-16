// 移植：el-tag（正式後台 10 個 view 在用，全部是 effect="light" round）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 型別名稱與 el-tag 的 type 一對一（success / warning / danger / info / primary），
// 顏色全部取自「按鈕 Button」已定義的語意色，不另訂一套。
import { guidePage, decisionTable } from "./guide-page.js";
import { icon } from "./icons.js";
import "./guide-page.css";
import "./tag-guide.css";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

/** 狀態標記：唯讀。type 與 el-tag 相同。 */
export const tag = (text, type = "info") =>
  `<span class="bo-tag is-${type}">${esc(text)}</span>`;

/** 可移除標籤：是輸入欄位的一部分，所以 × 是按鈕，要有 aria-label。 */
export const removableTag = (text) =>
  `<span class="bo-tag is-removable"><span>${esc(text)}</span><button type="button" class="bo-tag-remove" aria-label="移除 ${esc(text)}">${icon("close", 14)}</button></span>`;

// [type, 按鈕頁的語意色, 色碼, 用在, 範例文字]
const TYPES = [
  ["success", "btn-export", "#12b157", "正常、已核准、已啟用、已完成", "正常"],
  ["warning", "btn-warning", "#F59E0B", "待審核、處理中、即將到期", "待審核"],
  ["danger", "btn-danger", "#DC2626", "已停用、已拒絕、風險", "已停用"],
  [
    "info",
    "btn-neutral",
    "#a3a3a3",
    "一般分類、來源、裝置、無語意標籤",
    "官網",
  ],
  [
    "primary",
    "btn-search",
    "#1596AD",
    "需要強調的中性標記，例如目前套用的方案",
    "目前方案",
  ],
];

// 正式後台 10 個用到 el-tag 的 view
const USAGE = [
  [
    "會員操作紀錄",
    "memberOperationRecord",
    "新增 / 修改 / 刪除",
    "success / primary / danger",
  ],
  [
    "代理操作紀錄",
    "agentOperationRecord",
    "新增 / 修改 / 刪除",
    "success / primary / danger",
  ],
  [
    "操作員操作紀錄",
    "operatorOperationRecord",
    "新增 / 修改 / 刪除",
    "success / primary / danger",
  ],
  [
    "簽到活動",
    "checkInActivity",
    "狀態 0–3",
    "info / warning / success / danger",
  ],
  [
    "禮物卡管理",
    "giftCardManagement",
    "狀態 0–3",
    "success / warning / danger / info",
  ],
  ["幸運轉盤", "luckyWheel", "狀態 0–3", "info / warning / success / primary"],
  [
    "優惠活動",
    "promotionActivity",
    "處理狀態 0–3",
    "info / warning / success / danger",
  ],
  [
    "邀請進度追蹤",
    "invitationProgressTracking",
    "狀態 0–2",
    "danger / warning / success",
  ],
  ["邀請明細報表", "invitationDetailReport", "狀態", "依 formatStatusColor"],
  ["返水異動紀錄", "rebateModifyRecord", "狀態", "依 formatStatusColor"],
];

const DECISION = [
  [
    "呈現一筆資料的狀態",
    "<strong>狀態標記</strong>",
    "唯讀，顏色帶語意，不可點",
  ],
  [
    "多選欄位裡已選的項目",
    "<strong>可移除標籤</strong>",
    "是輸入的一部分，× 要是真的按鈕",
  ],
  [
    "可點擊會篩選列表",
    "不要用標籤",
    "看起來像標記就不該可點；改用篩選列的 Select 或按鈕",
  ],
  ["超過三個同時出現", "收合為「+N」", "標籤會把欄位撐高，表格列高就不一致了"],
  [
    "只是一段補充文字",
    "不要用標籤",
    "標籤有語意重量，純說明用一般文字或 Tooltip",
  ],
];

window.renderTagPage = () =>
  guidePage({
    slug: "tag",
    title: "標籤 Tag",
    intro:
      "短字串的視覺標記，只有兩種用途：唯讀的狀態標記，以及多選欄位裡可移除的已選項目。<strong>五種型別與 <code>el-tag</code> 的 <code>type</code> 一對一，顏色全部取自「按鈕 Button」已定義的語意色</strong>，不另訂一套。",
    sections: [
      {
        heading: "五種型別",
        body: `<div class="guide-stage"><div class="tag-row">${TYPES.map(([type, , , , sample]) => tag(sample, type)).join("")}</div></div>
        <table class="tag-tone-table">
          <thead><tr><th>型別</th><th>沿用的語意色</th><th>用在</th></tr></thead>
          <tbody>${TYPES.map(
            ([type, btn, hex, use, sample]) =>
              `<tr><td>${tag(sample, type)}</td><td><code>${btn}</code> ${hex}</td><td>${use}</td></tr>`,
          ).join("")}</tbody>
        </table>
        <p class="component-description">型別名稱刻意與 <code>el-tag</code> 相同，移植時 <code>&lt;el-tag type="success"&gt;</code> 直接對應，不需要再做一層翻譯。</p>`,
      },
      {
        heading: "可移除標籤",
        body: `<p class="component-description">多選欄位裡的已選項目。× 是真的按鈕，要能被 Tab 聚焦、要有 aria-label，不能只是一個字元。</p>
        <div class="guide-stage"><div class="tag-row">${removableTag("VIP 1")}${removableTag("VIP 2")}${removableTag("高風險")}${tag("+2", "info")}</div></div>
        <p class="component-description">同時超過三個就收合成 <code>+N</code>，欄位高度固定 34px 不得被標籤撐高——否則表格每一列高度都不一樣。</p>`,
      },
      { heading: "什麼時候用標籤", body: decisionTable(DECISION) },
      {
        heading: "正式後台的用法",
        body: `<p class="component-description">10 個 view 在用，寫法一致（<code>effect="light" round</code>），顏色由各頁的 <code>formatStatusColor()</code> 決定。</p>
        <div class="table-wrap"><table class="tag-usage-table">
          <thead><tr><th>頁面</th><th>檔案</th><th>標的</th><th>對應型別</th></tr></thead>
          <tbody>${USAGE.map(
            ([name, file, what, types]) =>
              `<tr><td>${name}</td><td><code>${file}</code></td><td>${what}</td><td>${types}</td></tr>`,
          ).join("")}</tbody>
        </table></div>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon("cancelCircle")}盤到的問題</h4><p>同一個狀態碼在不同頁面是不同顏色：狀態 <code>0</code> 在簽到活動、幸運轉盤、優惠活動是 <code>info</code>，在禮物卡管理是 <code>success</code>，在邀請進度追蹤是 <code>danger</code>。使用者跨頁看不出同一個顏色代表什麼。</p></div>
          <div class="is-good"><h4>${icon("checkCircle")}建議</h4><p>把 <code>formatStatusColor()</code> 收成一份共用對照，依<strong>語意</strong>（待處理／已完成／已拒絕）而不是數字對應型別。三個操作紀錄頁的 <code>formatActionColor()</code> 已經做對了——新增 → success、修改 → primary、刪除 → danger，三頁完全一致。</p></div>
        </div>`,
      },
    ],
    tokens: [
      ["高度", "22px"],
      ["圓角", "4px"],
      ["左右內距", "8px"],
      ["字級", "12px / 400"],
      ["標籤間距", "6px"],
      ["底色", "語意色 8% 透明度"],
      ["框線", "語意色 24% 透明度"],
      ["文字色", "語意色原色"],
      ["移除鈕", "14px 圖示，點擊區 18 × 18px"],
      ["收合門檻", "超過 3 個"],
      ["欄位高度", "固定 34px，不被標籤撐高"],
      ["最大寬度", "160px，超過以 … 截斷並掛 Tooltip"],
    ],
    rules: [
      [
        "顏色沿用按鈕的語意色",
        "不得為標籤另訂配色；同一個狀態在全站必須是同一個顏色。",
      ],
      [
        "型別名稱比照 el-tag",
        "success / warning / danger / info / primary 五種，移植時直接對應。",
      ],
      [
        "同一個狀態跨頁同色",
        "依語意而不是依狀態碼決定顏色；狀態碼在不同頁面的意義不同。",
      ],
      ["狀態標記不可點", "看起來像標記就不該有點擊行為；需要操作請用按鈕。"],
      [
        "移除鈕是真的按鈕",
        "要能 Tab 聚焦、要有 aria-label，不可只放一個 × 字元在 span 裡。",
      ],
      ["不要只用顏色表達狀態", "文字本身就要說明狀態，色盲使用者分不出紅綠。"],
    ],
  });
