// 移植：el-button 與 el-button + el-tooltip（正式後台的 IconBtn.vue）。
// 文字按鈕與圖示按鈕是同一個元件的兩種形狀，語意色共用同一組規範，所以放同一頁。
// 34px 高、4px 圓角需覆寫 EP 預設；語意色定義在 semantic-button-system.css。
// 詳見 ELEMENT-PLUS-MAPPING.md。內容由 index.html 原本的「樣式規範」拆出，一字未改。
import { guidePage } from "./guide-page.js";
import { iconButton } from "./icon-button.js";
import "./guide-page.css";

// 圖示按鈕的示範沿用 icon-button.js 既有的片段，不複製一份。
// 它回傳的是 `<section class="component-example"><h2>…</h2><div class="card …">…</div></section>`，
// 這裡只取 card 的內容，再由 guidePage 包成本頁的一個小節。
function iconButtonSection() {
  const fragment = window.iconButtonGuide();
  const match = fragment.match(
    /<div class="card [^"]*">([\s\S]*)<\/div><\/section>$/,
  );
  if (!match)
    throw new Error(
      "icon-button.js 的片段形狀改了，button-guide.js 取不到內容",
    );
  return `<section class="card button-guide"><h3>圖示按鈕 Icon Button</h3>${match[1]}</section>`;
}

window.renderButtonPage = () =>
  guidePage({
    slug: "button",
    title: "按鈕 Button",
    intro:
      "依操作意圖使用固定語意色，讓使用者在不同頁面建立一致預期。全站按鈕的圓角一律 4px，顏色、hover、focus、disabled 都由 semantic-button-system 決定，個別頁面不得另設。只放得下一個圖示的操作（表格操作欄、密集工具列）用圖示按鈕，語意色沿用同一組，不另訂配色。",
    raw: `<section class="button-guide-grid">
      ${[
        [
          "品牌主要操作",
          "btn-search",
          "搜尋",
          "用於搜尋、確認、儲存與下一步；每個區塊原則上只保留一個主要按鈕。",
          "#1596AD",
        ],
        [
          "建立／新增",
          "btn-add",
          "新增",
          "用於新增會員、建立活動、加入項目；藍紫色代表建立新資料。",
          "#8354BC",
        ],
        [
          "編輯／調整",
          "btn-edit",
          "編輯",
          "用於修改既有資料或進入編輯模式，不與主要提交操作競爭。",
          "#4169C9",
        ],
        [
          "查看／紀錄",
          "btn-record",
          "登入紀錄",
          "用於詳情、歷程、預覽及資訊類操作。",
          "#6d8aae",
        ],
        [
          "匯出／下載",
          "btn-export",
          "匯出",
          "用於下載、匯出或產生報表檔案。",
          "#12b157",
        ],
        [
          "提醒／注意",
          "btn-warning",
          "暫停",
          "用於暫停、待確認或可能影響流程但可恢復的操作。",
          "#F59E0B",
        ],
        [
          "危險操作",
          "btn-danger",
          "刪除",
          "只用於刪除、拒絕、永久停用等高風險操作。",
          "#DC2626",
        ],
        [
          "中性／工具操作",
          "btn-neutral",
          "刷新",
          "用於刷新、取消、返回、關閉與重設；不改變資料內容。",
          "#a3a3a3",
        ],
      ]
        .map(
          (x) =>
            `<article class="card button-spec"><div class="button-spec-top"><button class="semantic-btn ${x[1]}">${x[2]}</button><code>${x[4]}</code></div><h3>${x[0]}</h3><p>${x[3]}</p><div class="button-states"><button class="semantic-btn ${x[1]}">預設</button><button class="semantic-btn ${x[1]} outline">次要</button><button class="semantic-btn ${x[1]}" disabled>停用</button></div></article>`,
        )
        .join("")}
      </section><section class="card toolbar-demo"><h2>列表工具列組合</h2><p>所有操作只使用上方已定義的語意色：排序與批次審核都歸類為編輯／調整。按鈕群組一律從左側排起，不把新增與排序拆到左右兩端。</p><div class="member-actions"><button class="semantic-btn btn-add"><span data-icon="add"></span>新增</button><button class="semantic-btn btn-export"><span data-icon="download"></span>匯出</button><button class="semantic-btn btn-edit"><span data-icon="sort"></span>排序</button><button class="semantic-btn btn-edit"><span data-icon="batchReview"></span>批次審核</button><button class="semantic-btn btn-neutral"><span data-icon="refresh"></span>刷新</button><button class="semantic-btn btn-danger"><span data-icon="delete"></span>批次清除</button></div></section>
      <section class="card button-sizing">
        <h2>尺寸是算出來的，不是寫死的</h2>
        <p>按鈕不設固定高寬。<strong>高度 ＝ 文字行高 ＋ 上下內距 ×2 ＋ 框線 ×2；寬度 ＝ 文字自動寬度 ＋ 左右內距 ×2。</strong>內距是定值，所以文字多長、哪個語系、字級被放大，按鈕都合身。</p>
        <div class="button-formula">
          <div><code>--btn-content</code><span>16px</span><small><strong>內容高度</strong>：文字用它當行高、圖示用它當邊長。兩種按鈕共用同一個值，所以一定同高</small></div>
          <div><code>--btn-pad-y</code><span>8px</span><small>上下內距，四邊相同時圖示按鈕就自己長成正方形</small></div>
          <div><code>--btn-pad-x</code><span>12px</span><small>左右內距，只影響文字按鈕的寬度</small></div>
          <div><code>--btn-border</code><span>1px</span><small>描邊款與實心款同寬，兩者才不會差 2px</small></div>
          <div class="is-result"><code>高度</code><span>34px</span><small>16 ＋ 8×2 ＋ 1×2。沒有任何地方寫這個數字，它是算出來的</small></div>
        </div>
        <h3>換一個內容高度，兩種按鈕一起變、而且還是一樣高</h3>
        <p class="component-description">下面兩組只差一個 <code>--btn-content</code>。文字按鈕與圖示按鈕沒有各自的高度，所以不管這個值是多少，同一組裡的兩顆永遠對得起來。</p>
        <div class="button-size-demo">
          <div>
            <h5>--btn-content: 16px<em>（目前）</em></h5>
            <div class="button-size-row">
              <button type="button" class="semantic-btn btn-search">搜尋</button>
              ${iconButton({ icon: icon('edit', 16), label: '編輯', kind: 'btn-edit' })}
            </div>
          </div>
          <div class="is-alt">
            <h5>--btn-content: 20px</h5>
            <div class="button-size-row">
              <button type="button" class="semantic-btn btn-search">搜尋</button>
              ${iconButton({ icon: icon('edit', 20), label: '編輯', kind: 'btn-edit' })}
            </div>
          </div>
        </div>
        <h3>文字變長，按鈕自己變寬</h3>
        <p class="component-description">下面四顆的 CSS 完全相同，寬度差別只來自文字本身。沒有任何一顆寫了寬度。</p>
        <div class="button-width-demo">
          <button type="button" class="semantic-btn btn-search">搜尋</button>
          <button type="button" class="semantic-btn btn-search">批次審核</button>
          <button type="button" class="semantic-btn btn-search">確認並送出申請</button>
          <button type="button" class="semantic-btn btn-search">Submit application</button>
        </div>
        <h3>為什麼還留一個 min-height</h3>
        <div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}完全不設</h4><p>按鈕常與 34px 的輸入框並排。字型度量在不同系統上會差 1–2px，整排就會歪掉——而且只歪一點點，最難發現。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}用算出來的值當地板</h4><p><code>min-height: var(--btn-h)</code>。它不是第二個高度，就是上面算出來的那個數字；平常不會生效，只有在字型讓文字變矮時才把按鈕撐回對齊線。</p></div>
        </div>
        <p class="component-description">例外只有一種：<strong>純圖示按鈕</strong>。它沒有文字寬度可以推算，所以是 34 × 34px 的正方形；分頁按鈕與表頭排序鈕同理，都與輸入框同高。</p>
      </section>
      ${iconButtonSection()}<section class="card token-table"><h2>Button Token</h2><div><span>高度</span><strong>行高＋上下內距×2＋框線×2 ＝ 34px（桌機與手機相同）</strong><span>寬度</span><strong>文字寬＋左右內距×2，不設固定值</strong><span>圓角</span><strong>4px</strong><span>上下內距</span><strong>8px</strong><span>左右內距</span><strong>12px</strong><span>字級／字重／行高</span><strong>14px / 700 / 16px</strong><span>圖示按鈕</span><strong>34 × 34px</strong><span>按鈕間距</span><strong>8px</strong><span>Focus ring</span><strong>3px</strong></div></section>`,
    rules: [
      [
        "尺寸用推算的，不寫死",
        "高＝內容高度＋上下內距×2＋框線×2，寬＝文字寬＋左右內距×2。文字按鈕與圖示按鈕共用同一個內容高度（文字當行高、圖示當邊長），所以永遠同高。不得在任何頁面寫 height／width／min-width 把按鈕釘住——連 min-height 都不需要，因為行高是明確的像素值，算出來就是確定值。",
      ],
      [
        "桌機與手機同一個尺寸",
        "全站只有一個按鈕高度：桌機與手機都是 34px，與圖示按鈕、分頁按鈕、輸入框同高。要整站調高度就改 --btn-pad-y 一個值，不在手機版另外寫一次。",
      ],
      [
        "放不下就換行，不縮按鈕",
        "工具列或卡片塞不下時讓按鈕群組換行。先前規範頁把示範按鈕縮成 30／38px、工具列縮成 34px、批量回報列縮成 28px，站上一度有四種按鈕高度。",
      ],
      [
        "語意色不得自創",
        "全站只用已定義的語意色；遇到可讀性問題先移除局部覆寫，不要用新配色修補。",
      ],
      [
        "圓角一律 4px",
        "統一定義在 button-corner-radius，包含彈窗關閉鈕、分頁與表格操作鈕，不得個別另設。",
      ],
      [
        "中性操作用 btn-neutral",
        "關閉、取消、返回、刷新、重設都屬於不改變資料的操作。",
      ],
      [
        "工具列一律靠左",
        "列表工具列的按鈕群組從左側依序排列，不得把新增與排序拆到左右兩端。",
      ],
      ["彈窗 footer 靠右", "取消在前、主要操作在後。"],
      ["危險操作要能反悔", "刪除、拒絕、永久停用都要先確認，不可一鍵完成。"],
      [
        "圖示按鈕要有 aria-label 與 Tooltip",
        "兩者文字相同；只靠圖示辨識，使用者得靠猜的。停用的按鈕不觸發滑鼠事件，提示要掛在外層 icon-action-wrap。",
      ],
      ["圖示按鈕同一列最多三顆", "超過改用文字按鈕，或把次要操作移到詳情頁。"],
      [
        "圖示不表達語意",
        "語意由顏色與提示文字決定；同一個圖示在不同語意色下代表不同操作。停用時要說明原因，例如「無編輯權限」。",
      ],
    ],
  });
