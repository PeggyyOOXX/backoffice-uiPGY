# UI implementation rules

- 全站按鈕必須沿用 `index.html`「樣式規範」與 `semantic-button-system` 的既有語意樣式，所有頁面及彈窗一致。
- 所有按鈕形狀的圓角一律 4px，統一定義在 index.html 的 `button-corner-radius`，包含 semantic-btn、primary、secondary、action、topbar icon-btn、抽屜與彈窗關閉鈕、quick-tabs、分頁按鈕與表格操作鈕。要調整只改該區塊，不得在個別頁面或元件另設圓角。
- 關閉、取消、返回、刷新、重設使用 `semantic-btn btn-neutral`，配色及互動狀態由共用樣式決定。
- 不得為個別頁面或彈窗新增或覆寫按鈕背景色、文字色、邊框色、hover、focus、disabled 等視覺樣式。不得自行創造規範外的按鈕配色。
- 遇到按鈕可讀性問題，先檢查並移除局部覆寫，恢復既有規範；不要用新的自訂配色修補。
- 列表工具列的操作按鈕群組一律從左側開始依序排列（justify-content: flex-start），不得把新增與排序拆到左右兩端。表格內的操作欄則置中（比照搜尋結果頁 row-actions），處理人文字一併置中；手機卡片內的操作維持靠左。彈窗 footer 一律靠右排列。
- 優惠活動設定的列表操作範例直接放在「優惠活動」表格，不另建活動類型列表或分頁。

- 全站彈窗統一使用 modal-system.js 的 prepareModal 與 modal-system.css，以活動內容快照為基準：標題左側綠線、右上角 X、獨立捲動內容、固定 footer。彈窗按鈕靠右，取消在前、主要操作在後。
- 彈窗內表單使用既有 guide-input、guide-select 與 semantic-btn 語意樣式；不得另訂局部配色。新增彈窗須加入組件範例或沿用現有範例。
- 彈窗採固定規格寬度（小螢幕縮至視窗內）、內容自動高度；不得以四邊 inset:0 配合 height:auto 拉滿視窗。僅設定最大高度，內容超過視窗時才捲動，不保留空白高度。
- 日期欄位必須使用 date-picker.js 的共用日期選擇器與 date-picker.css，與樣式規範的互動範例一致；不得使用原生 input type="date" 或自行仿製日期欄位。彈窗也必須掛載相同元件。
- 搜尋結果的會員詳情／檢視紀錄保留從右側滑出的抽屜；抽屜與置中彈窗是不同組件，不得因統一彈窗樣式而改變既有抽屜呈現方式。
- 混合設定頁點擊「排序」後持續顯示拖曳把手，不設收合按鈕。切換開關、分類及狀態頁籤不可退出排序；儲存或取消變更才退出。篩選中排序只调整可見項目的相對次序，隱藏項目保持位置。
- Switch 依「樣式規範 → 開關排列 Switch」：每項設定獨立一列，standard-switch 在左、文案緊接在右，間距 16px，不與下拉並排。不得固定整列或文案寬度；開關維持 42 × 24px、上下對齊並垂直置中，文案向右延伸，超出容器才換行且對齊文案起點。沿用共用開關配色及互動狀態。
- Switch 旁的文案一律使用一般字重（font-weight: 400），不得使用粗體。
- 表頭排序一律使用 table-sort.js／table-sort.css 的 table-sort-control，欄名置於按鈕外。未排序為灰色雙箭頭，升／降冪以主題綠標示方向，依序循環未排序→升冪→降冪→未排序；th 使用 aria-sort。不得套用一般 semantic-btn 描邊按鈕。

- 全站表格統一使用 index.html `unified-table-system` 的共用樣式，以搜尋結果／會員列表為基準：表頭 #F7F8FB 底、#68758B 文字、12px、padding 8px 11px、line-height 1.25，內容 padding 9px 11px、置中、底線 #EDF0F4，tbody hover #F9FBFF，tfoot 同表頭底色。彈窗內表格沿用同一組樣式。
- 個別表格的 CSS 只負責結構：min-width、table-layout、colgroup、固定欄、欄寬、checkbox 欄。不得再自訂表頭底色、文字色、字級、內距、框線或對齊；需要靠左對齊的只限權限矩陣首欄與合計列標籤欄。

- 唯讀資訊一律使用右側抽屜（openDetailDrawer），底部只有「關閉」；需要輸入或做決定才使用置中彈窗（prepareModal），footer 為取消＋主要操作。不得因欄位多就把唯讀內容改成寬版彈窗。
- 唯讀內容放不進抽屜寬度時，改用卡片或 risk-detail-grid 的兩欄定義列表呈現，不得在抽屜內塞需要橫向捲動的寬表格。稽核詳情即依此改為每筆一張卡片。

- Radio 與 Checkbox 一律使用 choice-controls.js 的 choice-control：input 16 × 16px、accent-color #1596AD，控制在左、文案緊接在右間距 8px，文案 14px／400 不加粗，整組以 fieldset＋legend 包覆。直排間距 12px，橫排 12px × 24px 且僅限短選項不超過四個。不得自訂勾選外觀或改用圖片取代原生控制。
- 提示文字一律使用 tooltip.js：在元素加 data-tooltip，方向以 data-tooltip-placement 指定（預設 top，空間不足自動翻面）。Tooltip 只放補充說明，不得承載必要資訊。停用按鈕不觸發滑鼠事件，data-tooltip 必須掛在外層容器（icon-button.js 的 iconButton 已處理）。
- 純圖示操作一律使用 icon-button.js 的 iconButton：semantic-btn 語意色＋icon-action，34 × 34px（觸控 44 × 44px）、圓角 4px、圖示 16px。必須同時有 aria-label 與相同文字的 Tooltip；同一列最多三顆，停用時以提示說明原因。不得為圖示按鈕新增配色或尺寸。
- 表格加直向分隔線：th 右側 1px var(--line)，td 右側 1px #EDF0F4，每列最後一格不加。整列 hover 底色 #F1F8FA；有自訂底色的固定欄（如審核頁的 risk-fixed）必須一併套用 hover 底色，否則整列會斷開。
