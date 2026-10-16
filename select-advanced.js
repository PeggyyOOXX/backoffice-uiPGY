import "./select-advanced.css";
import { on } from "./delegate.js";
import { icon } from "./icons.js";
// 事件委派統一走 delegate.js：每種事件只掛一個 document 監聽，並登記擁有權。
const OWNED = [
  ".select-filter-demo",
  "[data-select-demo-action]",
  "[data-select-demo]",
];
const listen = (type, handler, capture = false) =>
  on(type, handler, { owner: "select-advanced", claims: OWNED, capture });

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Demo data mirrors the kinds of lists the backoffice actually feeds a Select:
// short enums, long operator names, and lists that are too long to scan by eye.
const STATUS = [
  ["all", "全部狀態"],
  ["on", "啟用"],
  ["off", "停用"],
  ["locked", "鎖定", true],
];
const TAGS = [
  ["vip", "VIP 會員"],
  ["watch", "關注會員"],
  ["new", "新註冊"],
  ["risk", "風險觀察"],
  ["sleep", "沉睡會員"],
  ["test", "測試帳號"],
];
const PROVIDERS = [
  [
    "電子",
    [
      ["pg", "PG Soft"],
      ["pp", "Pragmatic Play"],
      ["jili", "JILI Games"],
      ["cq9", "CQ9 電子"],
    ],
  ],
  [
    "真人",
    [
      ["ag", "AG 真人"],
      ["dg", "DG 真人"],
      ["evo", "Evolution Gaming"],
    ],
  ],
  [
    "體育",
    [
      ["sb", "SBOBET"],
      ["im", "IM 體育", true],
    ],
  ],
];
const AGENTS = [
  ["agent_10188", "agent_10188"],
  ["agent_10192", "agent_10192"],
  ["agent_10255", "agent_10255"],
  ["agent_10301", "agent_10301"],
  ["agent_11024", "agent_11024"],
  ["agent_11077", "agent_11077"],
  ["agent_12003", "agent_12003"],
  ["agent_12418", "agent_12418"],
  ["agent_13560", "agent_13560"],
];
const LONG = [
  ["a", "通過稽核後才可轉點，未達標的會員一律擋下"],
  ["b", "不限制稽核狀態，會員隨時可轉點"],
  ["c", "僅限轉點次數未達每日上限的會員，且需為啟用狀態"],
];

const options = (items, selected = []) =>
  items
    .map((item) => {
      const [value, label, disabled] = item;
      return `<option value="${esc(value)}"${selected.includes(value) ? " selected" : ""}${disabled ? " disabled" : ""}>${esc(label)}</option>`;
    })
    .join("");

const groups = (list) =>
  list
    .map(
      ([label, items]) =>
        `<optgroup label="${esc(label)}">${options(items)}</optgroup>`,
    )
    .join("");

// Field wrapper: label on top, shared Select underneath, note or error below.
// Only the data-* attributes change between variants — the markup never does.
const field = ({
  label,
  note = "",
  error = "",
  attrs = "",
  body,
  multiple = false,
  disabled = false,
  placeholder = true,
  demo = "",
}) => `
  <div class="select-field">
    <label>${esc(label)}</label>
    <select class="guide-input guide-select${error ? " is-error" : ""}"${multiple ? " multiple" : ""}${disabled ? " disabled" : ""} aria-label="${esc(label)}"${demo ? ` data-select-demo="${esc(demo)}"` : ""} ${attrs}>${!multiple && placeholder ? '<option value=""></option>' : ""}${body}</select>
    ${error ? `<small class="error-text">${esc(error)}</small>` : note ? `<small>${esc(note)}</small>` : ""}
  </div>`;

const panel = (title, description, inner, demo = "") =>
  `<div class="select-panel"><h4>${esc(title)}</h4><p>${esc(description)}</p>${inner}${demo ? `<p class="select-readout">目前選取：<output data-select-output="${esc(demo)}">未選取</output></p>` : ""}</div>`;

window.renderSelectAdvanced = () => `<div class="style-guide select-advanced">
  <div class="guide-section-heading">
    <h2>下拉選單 Dropdown</h2>
    <p class="component-description">所有下拉共用同一個元件，差別只寫在原生 <code>&lt;select&gt;</code> 的屬性上。頁面不自行掛載下拉，也不另訂配色與尺寸；外觀沿用「輸入元件 Input」的 34px、7px 圓角與同一組狀態色。</p>
  </div>

  <section class="card select-guide">
    <h3>基本狀態</h3>
    <p class="component-description">與 Input 同一套狀態：預設、已選、可清除、停用、錯誤、讀取中。錯誤不可只靠邊框顏色，必須附文字。</p>
    <div class="select-grid">
      ${field({ label: "會員狀態", note: "預設，未選取時顯示 Placeholder", body: options(STATUS) })}
      ${field({ label: "會員狀態", note: "已選取", body: options(STATUS, ["on"]), placeholder: false })}
      ${field({ label: "會員狀態", note: "data-clearable：可一鍵清除已選條件", attrs: "data-clearable", body: options(STATUS, ["on"]), placeholder: false })}
      ${field({ label: "會員狀態", note: "停用：無編輯權限或前置條件未滿足", disabled: true, body: options(STATUS, ["all"]), placeholder: false })}
      ${field({
        label: "會員等級",
        error: "請先選擇會員等級",
        body: options([
          ["v1", "VIP 1"],
          ["v2", "VIP 2"],
        ]),
      })}
      ${field({ label: "上級代理", note: "data-loading：選項由 API 取得中", attrs: "data-loading", body: "" })}
    </div>

    <h3>可搜尋</h3>
    <p class="component-description">選項超過十項就要能搜尋。選項量很大時加上最少字元限制，避免每打一個字就重算整份清單；還沒達到字數前維持完整清單，並在下拉頂端說明還差幾個字。</p>
    <div class="select-grid">
      ${panel("data-filterable", "輸入即過濾，比對選項文字與值。", field({ label: "遊戲商", attrs: "data-filterable data-clearable", body: groups(PROVIDERS), demo: "filter" }), "filter")}
      ${panel('data-min-filter="2"', "輸入滿 2 個字才開始過濾，適用於代理、會員帳號這類長清單。", field({ label: "上級代理", attrs: 'data-min-filter="2" data-clearable', body: options(AGENTS), demo: "min" }), "min")}
    </div>

    <h3>多選</h3>
    <p class="component-description">多選一律收合標籤，欄位高度維持 34px 不被標籤撐開；收合後顯示 <strong>+N</strong>，滑鼠移上去列出完整清單。需要限制數量時用 <code>data-max</code>，達到上限後其餘選項自動停用。</p>
    <div class="select-grid">
      ${panel('multiple + data-collapse="2"', "最多顯示 2 個標籤，其餘收合。", field({ label: "會員標籤", multiple: true, attrs: 'data-collapse="2" data-clearable', body: options(TAGS, ["vip", "watch", "new"]), demo: "tags" }), "tags")}
      ${panel("+ data-select-all", "下拉頂端加全選；部分選取時顯示半選狀態。", field({ label: "遊戲商", multiple: true, attrs: 'data-collapse="2" data-select-all data-filterable data-clearable', body: groups(PROVIDERS), demo: "all" }), "all")}
      ${panel(
        '+ data-max="3"',
        "最多選 3 項，達上限後其餘選項停用。",
        field({
          label: "通知管道",
          multiple: true,
          attrs: 'data-collapse="2" data-max="3"',
          body: options(
            [
              ["inbox", "站內信"],
              ["mail", "電子郵件"],
              ["sms", "簡訊"],
              ["push", "App 推播"],
              ["line", "LINE 通知"],
            ],
            ["inbox", "mail"],
          ),
          demo: "max",
        }),
        "max",
      )}
    </div>

    <h3>分組與長選項</h3>
    <p class="component-description">選項有明確分類時用 <code>&lt;optgroup&gt;</code>；分類標題只做視覺分組，不可被選取。選項文字本來就長的（規則、說明型選項）加 <code>data-wrap</code> 讓文字換行，不要讓使用者看被截斷的半句話。</p>
    <div class="select-grid">
      ${panel("<optgroup>", "分類標題不可選，搜尋時空的分類自動隱藏。", field({ label: "遊戲商", attrs: "data-filterable", body: groups(PROVIDERS) }))}
      ${panel("data-wrap", "長選項換行，列高自動撐開。", field({ label: "轉點規則", attrs: "data-wrap data-clearable", body: options(LONG, ["a"]), placeholder: false }))}
      ${panel("預設（不換行）", "同一份選項不加 data-wrap 時會被截斷，長文字選項不要這樣用。", field({ label: "轉點規則", body: options(LONG, ["a"]), placeholder: false }))}
    </div>
  </section>

  <section class="card select-guide">
    <h3>用在篩選列</h3>
    <p class="component-description">實際組合：沿用既有的 <code>source-filter</code> 篩選格線、<code>filter-field</code> 欄位與 <code>semantic-btn</code> 按鈕，下拉只是換上需要的屬性。按鈕群組靠左，重設在前、搜尋在後。</p>
    <div class="source-filter card select-filter-demo">
      <div class="source-filter-grid">
        <div class="filter-field"><label>平台名稱</label><select class="control"><option>101 BEST</option><option>Demo Platform</option></select></div>
        <div class="filter-field"><label>會員標籤</label><select class="control" multiple data-collapse="2" data-select-all data-clearable aria-label="會員標籤">${options(TAGS, ["vip"])}</select></div>
        <div class="filter-field"><label>遊戲商</label><select class="control" multiple data-collapse="2" data-select-all data-filterable data-clearable aria-label="遊戲商">${groups(PROVIDERS)}</select></div>
        <div class="filter-field"><label>上級代理</label><select class="control" data-min-filter="2" data-clearable aria-label="上級代理"><option value=""></option>${options(AGENTS)}</select></div>
        <div class="filter-field"><label>會員狀態</label><select class="control" aria-label="會員狀態">${options(STATUS)}</select></div>
        <div class="filter-field"><label class="continuation-label">日期區間</label><div class="date-range-host" data-date-range></div></div>
        <div class="source-filter-actions">
          <button type="button" class="semantic-btn btn-neutral" data-select-demo-action="reset">${icon("reset")}重設</button>
          <button type="button" class="semantic-btn btn-search" data-select-demo-action="search">${icon("search")}搜尋</button>
        </div>
      </div>
      <p class="select-feedback" role="status" data-select-feedback></p>
    </div>
  </section>

  <section class="card token-table select-token">
    <h2>共用規格</h2>
    <div>
      <span>欄位高度</span><strong>34px</strong>
      <span>圓角</span><strong>7px</strong>
      <span>字級／字重</span><strong>14px / 400</strong>
      <span>左右內距</span><strong>9px</strong>
      <span>選項列高</span><strong>34px</strong>
      <span>選項圓角</span><strong>5px</strong>
      <span>標籤高度</span><strong>22px</strong>
      <span>標籤圓角</span><strong>4px</strong>
      <span>選中／hover 底色</span><strong>#E7F7FA</strong>
      <span>選中文字色</span><strong>#1596AD</strong>
      <span>Focus ring</span><strong>3px rgba(21,150,173,.1)</strong>
      <span>錯誤邊框</span><strong>#DC2626</strong>
    </div>
  </section>

  <section class="card guide-rules">
    <h2>使用規則</h2>
    <div class="rule-grid">
      <div><strong>屬性寫在 select 上</strong><p>多選、搜尋、全選、上限都用 data-* 宣告，不在頁面另外掛 Element Plus，也不覆寫下拉的配色與尺寸。</p></div>
      <div><strong>超過十項就能搜尋</strong><p>選項十項以內維持單純下拉；超過加 data-filterable，上百項再加 data-min-filter。</p></div>
      <div><strong>多選一定收合標籤</strong><p>欄位高度固定 34px，不可被標籤撐高而破壞篩選格線對齊。</p></div>
      <div><strong>全選只給多選用</strong><p>單選沒有全選。全選的計數不含停用選項，部分選取要顯示半選狀態。</p></div>
      <div><strong>選項不截斷語意</strong><p>說明型的長選項加 data-wrap 換行；分類用 optgroup，分類標題不可選。</p></div>
      <div><strong>空與錯誤都要有文字</strong><p>讀取中、查無選項、沒有可選項目、驗證錯誤各有固定文案，不可只靠顏色或空白表達。</p></div>
    </div>
  </section>
</div>`;

const describe = (select) => {
  const picked = [...select.selectedOptions].filter((option) => option.value);
  if (!picked.length) return "未選取";
  return `${picked.map((option) => option.text).join("、")}（${picked.length} 項）`;
};

listen("change", (event) => {
  const select = event.target.closest("[data-select-demo]");
  if (!select) return;
  const output = document.querySelector(
    `[data-select-output="${select.dataset.selectDemo}"]`,
  );
  if (output) output.textContent = describe(select);
});

listen("click", (event) => {
  const action = event.target.closest("[data-select-demo-action]");
  if (!action) return;
  const grid = action.closest(".select-filter-demo");
  const reset = action.dataset.selectDemoAction === "reset";
  if (reset) {
    grid.querySelectorAll("select").forEach((select) => {
      for (const option of select.options) option.selected = false;
      if (!select.multiple) select.selectedIndex = 0;
    });
    window.syncSelects?.();
  }
  const feedback = grid.querySelector("[data-select-feedback]");
  if (feedback)
    feedback.textContent = reset
      ? "已清除篩選條件"
      : "搜尋條件已套用（元件範例，未串接資料）";
});
