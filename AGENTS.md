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

- 下拉選單一律使用 select.js 的共用 Select 與 select.css：頁面只寫原生 `<select>`，變化以屬性宣告（`multiple`、`data-collapse`、`data-max`、`data-select-all`、`data-filterable`、`data-min-filter`、`data-clearable`、`data-loading`、`data-wrap`、`<optgroup>`）。不得在頁面自行掛載 Element Plus 下拉，也不得覆寫下拉的尺寸、圓角、配色與選項列高。
- 選項超過十項要可搜尋（data-filterable）；上百項再加 data-min-filter，未達字數前維持完整清單並於下拉頂端說明還差幾個字。多選一律收合標籤（data-collapse），欄位高度固定 34px 不得被標籤撐高。全選只用於多選，計數不含停用選項，部分選取顯示半選狀態。說明型長選項加 data-wrap 換行，分類用 optgroup 且分類標題不可選。

- 頁籤一律使用 tabs.js 的共用 Tabs 與 tabs.css：`tabs({id,label,items,active,variant,mobile,controls})` 產生 tablist，面板用 `tabPanels()` 或以 `controls` 指向頁面自己重畫的單一面板。切換由元件處理，頁面只接 `tab-change`；需要攔截時接可取消的 `tab-before-change`。不得在個別頁面另寫頁籤樣式或自行處理方向鍵。
- 變化只有三種：`line` 頁面層級（預設）、`card` 內容區塊次層、`workspace` 工作區頁籤。同層級不得混用 line 與 card，一頁最多兩層頁籤。標籤文字只放名稱，數量用計數標記；無檢視權限的分頁不渲染，停用只用於暫時不可用。
- 頁籤保留手機行為參數供後續小寬度版面使用：`mobile="scroll"` 限 4 個以內的短標籤，切換後自動把目前頁籤捲進畫面、兩側以漸層提示；`mobile="select"` 用於 5 個以上或標籤字長，改用共用 Select。彈窗內的頁籤一律用 scroll，因為彈窗的捲動容器會裁切下拉。規範頁不另做手機預覽展示，手機版另行以小寬度版面製作。
- 手機（720px 以下）輸入類控制的高度一律 34px，與 Input／Select Token 的 Desktop 值相同：`.control`、`guide-input`、`settings-unit input` 與共用 Select 都不得在手機另設高度。字級在篩選列維持 16px，因為 iOS Safari 對 16px 以下的輸入欄位會在聚焦時自動放大整頁。按鈕不在此限，仍依 Button 規範的 42／44px 觸控尺寸。
- 卡片型頁籤以填色標示作用中：#E7F7FA 底、#1596AD 字、字重 700、圓角 4px、高度 34px、間距 4px，描邊以 inset box-shadow 畫在元素內側（捲動容器會裁切外陰影）；未選取為透明底，hover 為 #F1F4F8。作用中必須是整組裡顏色最重的一塊，不得改用白底、上方色條或靠框線斷點表示。
- 工作區頁籤代表一個仍被保留狀態的已開啟頁面，關閉時必須一併清除該頁的快取與暫存搜尋條件，並接到相鄰頁籤。首頁為常駐頁籤不可關閉；開啟上限 10 個，超過時關閉最舊的一個。頁籤清單與上限由 shell 的狀態管理，不在 tabs.js 內處理。

- 載入與非資料狀態一律使用 states.js 與 states.css：`emptyState()`／`emptyRow()`（無資料、載入失敗）、`errorState()`（固定文案加後端 code 與 message）、`skeletonTable()`（首次載入）、`loadingWrap()`／`loadingVeil()`（重新查詢）。文案由 `STATE_COPY` 統一提供，個別頁面不得自行撰寫空狀態文案，只能替換狀態區那一顆操作按鈕；要改文案就改 states.js，全站一起變。
- 載入中分兩種且不可混用：畫面上還沒有資料時用骨架把版面撐出來；已經有資料時（換頁、改篩選、自動刷新）用遮罩讓舊資料留在原地變淡，不得把既有資料換成骨架。遮罩期間底下的操作必須停用。
- 無資料只有一種：本來就沒有與篩選後沒撈到都顯示「無資料」，與正式後台的 i18n key no_data 一致，不分兩種文案；需要引導下一步時，按鈕放在表格外的列表工具列。
- 請求失敗時表格不得顯示「無資料」，必須用 errorState() 直接輸出 toast 的字串：錯誤碼加敘述、同一行、不拆成標題與說明。兩者都來自後端的固定錯誤碼翻譯字典（請求帶 Language 標頭，敘述已是當前語系），前端不另外寫文案；後端連訊息都沒回時才退回 API request failed，與 useApi 最終分支相同。只放 code 與 message，不得放 ApiErrorResponse 的 debug（型別為 any，可能帶出內部路徑或查詢內容，而表格的錯誤會留在畫面上並被截圖轉傳）。所有後端字串一律轉義後輸出。
- 不做「無權限」狀態畫面：正式後台的 Side.vue 已把側欄過濾成只剩有 .read 權限的項目，沒權限的頁面進不去；真要防書籤或權限即時收回，應在 router guard 導回首頁，不是在表格裡放空狀態。
- 搜尋結果列表內不放任何操作按鈕。狀態區只呈現狀況與原因；重新查詢、清除搜尋條件、新增、重新載入一律放在表格外的列表工具列，位置不隨狀態改變。emptyState() 與 errorState() 都不接受 action。
- 上方 topbar 與工作區頁籤列固定在捲動容器頂端（sticky，topbar top:0／頁籤列 top:60px，手機 46px，偏移統一定義在 styles/sticky-topbar-and-workspace-tabs.css），內容從兩者下方通過。不得讓它們隨內容捲走。

- CSS 不再寫在 index.html。shell 樣式全部在 `styles/`，載入順序由 `styles/index.css` 的 `@import` 決定，後面覆寫前面；調整順序等同調整層疊優先序。新增 shell 樣式前先查 `styles/README.md` 的「被多處覆寫的選擇器」，改既有檔案，不要再開新區塊疊上去。元件自己的 CSS 由各模組 import，排在 shell 樣式之後。
- 全域事件一律透過 `delegate.js` 的 `on()` 註冊，不得直接呼叫 `document.addEventListener`。每筆註冊要寫 `owner` 與它負責的 selector（`claims`）；兩個模組宣告同一個 selector 時主控台會警告。主控台輸入 `delegateRegistry()` 可列出目前的擁有權清單。
- 每個手刻模組的第一行要註明移植時對應的 Element Plus 元件，完整對照見 `ELEMENT-PLUS-MAPPING.md`。正式後台以 Element Plus 為主，手刻只在 EP 沒有對應時保留。
