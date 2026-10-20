# UI implementation rules

- CSS 的尺寸一律寫 rem，換算為 px ÷ 16（根字級 16px，例如 34px → 2.125rem、12px → 0.75rem），包含字級、間距、圓角、陰影、模糊半徑。不用 em：em 跟著元素自己的字級走，同一個值在 12px 表頭與 14px 內文會算出不同大小。三種例外維持 px：border／outline 類屬性與 --btn-border 這類框線變數（換成 rem 縮放時會變成 0.9px 而變糊）、@media 斷點、JS 裡的數值（tooltip 定位這類計算拿到的是 px）。本文件與註解裡寫的 px 是畫面上的實際尺寸，寫進 CSS 時要換成 rem。數值格線：字級只用偶數且最小 12px（12／14／16／18／20），不得出現 13、17、19；間距（padding、margin、gap）、圓角與定位（top／right／bottom／left）一律是 4px 的倍數（4、8、12、16…，即 0.25rem 的倍數），不得出現 6、7、9、11 這類數值；剛好在中間的值往小取。寬高不套格線，由內容推算（例如按鈕與輸入框的 34px）。1–2px 的框線對齊微調（例如 -1px 疊住底線）直接寫 px。規範頁與規格表上的數值一律寫成 1rem(16px)：rem 在前、px 在括號內，用 guide-page.js 的 remPx() 產生，不要手寫換算。完整說明在「設計 Token」頁的「單位與數值格線」。改動後跑 npm run check。
- 顏色一律用「設計 Token → 介面色／語意色」的 CSS 變數，不得在元件或頁面寫死色碼。文字四級 --text／--text-subtle／--text-muted／--text-faint，線三級 --line-faint／--line／--line-strong，底色 --card／--surface／--surface-hover／--surface-head／--bg，品牌 --blue／--blue-ink／--blue-tint，狀態 --success／--warning／--danger／--neutral（--green／--red／--amber 是它們的別名）。要加新顏色前先問「現有的哪一支不夠用、為什麼」，答得出具體理由才加，而且一定要同時寫進 token-guide.js 的 SURFACE 並在 styles/blue-teal-palette-override.css 的 :root 定義——色碼散在元件裡，同一個灰就會長出十種。
- 全站按鈕必須沿用 `index.html`「樣式規範」與 `semantic-button-system` 的既有語意樣式，所有頁面及彈窗一致。
- 按鈕的尺寸用推算的，不寫死高寬：**高 ＝ 文字行高（--btn-content 16px）＋ 上下內距（--btn-pad-y）×2 ＋ 框線（--btn-border 1px）×2；寬 ＝ 文字自動寬度 ＋ 左右內距（--btn-pad-x 12px）×2**。**文字按鈕與圖示按鈕共用同一個內容高度**：文字拿 --btn-content 當行高，圖示拿它當邊長（SVG 的 width/height 屬性要用 CSS 蓋掉），所以不管那個值是 16、20 還是 24，兩種按鈕一定同高——圖示按鈕四邊內距相同，自己就長成正方形。桌機與手機也是同一個尺寸，算出來都是 34px。要整站調高度就改 --btn-content 或 --btn-pad-y。連 min-height 都不要寫：line-height 是明確的像素值，高度已經是確定值。變數與公式只在 styles/semantic-button-system.css 定義，不得在任何頁面寫 height／width／min-width 把按鈕釘住；`min-height: var(--btn-h)` 不是第二個高度，是為了和 34px 的輸入框對齊而設的地板，數值與算出來的相同。例外只有純圖示按鈕與分頁、表頭排序這類方形控制（沒有文字寬度可推算），一律 34px 見方。不得為了塞進窄卡片或窄工具列把按鈕改小——規範頁自己把示範按鈕縮成 30px／38px、手機工具列縮成 34px、批量回報列縮成 28px，站上因此一度有四種按鈕高度。放不下就換行，不縮按鈕。改動後跑 node render-check.cjs。
- 所有按鈕形狀的圓角一律 4px，統一定義在 index.html 的 `button-corner-radius`，包含 semantic-btn、primary、secondary、action、topbar icon-btn、抽屜與彈窗關閉鈕、quick-tabs、分頁按鈕與表格操作鈕。要調整只改該區塊，不得在個別頁面或元件另設圓角。
- 關閉、取消、返回、刷新、重設使用 `semantic-btn btn-neutral`，配色及互動狀態由共用樣式決定。
- 不得為個別頁面或彈窗新增或覆寫按鈕背景色、文字色、邊框色、hover、focus、disabled 等視覺樣式。不得自行創造規範外的按鈕配色。
- 遇到按鈕可讀性問題，先檢查並移除局部覆寫，恢復既有規範；不要用新的自訂配色修補。
- 列表工具列的操作按鈕群組一律從左側開始依序排列（justify-content: flex-start），不得把新增與排序拆到左右兩端。表格內的操作欄則置中（比照組合範例－搜尋的操作欄），處理人文字一併置中；手機卡片內的操作靠右（data-table.css 的 .data-card-actions）。彈窗 footer 一律靠右排列。
- 優惠活動的列表操作範例放在「組合範例－混合」的「優惠活動」頁籤，不另建活動類型列表或分頁。

- 全站彈窗統一使用 modal-system.js 的 prepareModal 與 modal-system.css，以活動內容快照為基準：標題左側綠線、右上角 X、獨立捲動內容、固定 footer。彈窗按鈕靠右，取消在前、主要操作在後。
- 彈窗內表單使用既有 guide-input、guide-select 與 semantic-btn 語意樣式；不得另訂局部配色。新增彈窗須加入組件範例或沿用現有範例。
- 彈窗採固定規格寬度（小螢幕縮至視窗內）、內容自動高度；不得以四邊 inset:0 配合 height:auto 拉滿視窗。僅設定最大高度，內容超過視窗時才捲動，不保留空白高度。
- 日期欄位必須使用 date-picker.js 的共用日期選擇器與 date-picker.css，與樣式規範的互動範例一致；不得使用原生 input type="date" 或自行仿製日期欄位。彈窗也必須掛載相同元件。
- 會員列表（組合範例－搜尋）的會員詳情／登入紀錄保留從右側滑出的抽屜；抽屜與置中彈窗是不同組件，不得因統一彈窗樣式而改變既有抽屜呈現方式。
- 「組合範例－混合」點擊「排序」後持續顯示拖曳把手，不設收合按鈕。切換開關、分類及狀態頁籤不可退出排序；儲存或取消變更才退出。篩選中排序只调整可見項目的相對次序，隱藏項目保持位置。
- Switch 依「樣式規範 → 開關排列 Switch」：每項設定獨立一列，standard-switch 在左、文案緊接在右，間距 16px，不與下拉並排。不得固定整列或文案寬度；開關維持 42 × 24px、上下對齊並垂直置中，文案向右延伸，超出容器才換行且對齊文案起點。沿用共用開關配色及互動狀態，不得在個別頁面縮放或另設尺寸（先前分站設定的 .is-sm 把開關縮成 0.85 倍，已移除）。
- 開關的「關閉」與「停用」必須分得出來：可操作的兩種狀態是實心（開 #1596AD、關 #718087，旋鈕帶陰影），停用的兩種是淡底加 inset 描邊的空心（開 #E4F4F7／#A9D8E1，關 #F1F3F6／#D4DBE4，旋鈕平貼）。不得用 opacity 把關閉調淡當停用——兩個灰只差亮度，看的人分不出按不按得動。配色只在 styles/input-standard-page.css 一處定義，四種狀態與 Hover／Focus 的示範都在「選擇控制」頁，改動後跑 node render-check.cjs。停用的開關要掛 Tooltip 說明原因，data-tooltip 放在外層容器上。
- Switch 旁的文案一律使用一般字重（font-weight: 400），不得使用粗體。
- 表頭排序一律使用 table-sort.js／table-sort.css 的 table-sort-control，欄名置於按鈕外。未排序為灰色雙箭頭，升／降冪以主題綠標示方向，依序循環未排序→升冪→降冪→未排序；th 使用 aria-sort。不得套用一般 semantic-btn 描邊按鈕。

- 全站表格統一使用 index.html `unified-table-system` 的共用樣式，以組合範例－搜尋的會員列表為基準：表頭 var(--surface-head) 底、var(--text-subtle) 文字、12px、padding 8px 12px、line-height 1.25，表頭一橫排不換行（塞不下由 .table-wrap 的橫向捲動吸收，不是把欄名壓成一字一行），內容 padding 8px 12px、置中、底線 #EDF0F4，tbody hover #F9FBFF，tfoot 同表頭底色。彈窗內表格沿用同一組樣式。
- 手機上同一份資料要用表格還是卡片，判準是「這一列要用來讀，還是用來比」，完整的決策表在「表格 Table → 手機版：卡片還是表格」。要讀完一整筆才能決定（審核、會員詳情）、列上的操作要先讀完資料，或欄位多到 10 欄以上的用卡片；要跨列比同一個欄位（報表、合計）或要勾選多筆做批量的維持表格。不是「手機一律卡片」。
- **手機不得精簡欄位**：桌機有幾個欄位，手機就要有幾個，表格與卡片都一樣。不存在「手機只放關鍵欄、其餘點開抽屜看」這種做法——省掉的欄位在手機上就等於查不到，使用者得換一台電腦才查得到同一筆資料。表格與卡片是同一份資料的兩種**排法**，不是兩種**詳細程度**。欄位多就讓卡片長一點，或把關係相近的兩欄併成一格（風控審核的「異動前／後餘額」「UID／會員帳號」）——併是為了讀得順，不是為了少放。example-check.cjs 會逐欄比對桌機表頭與手機卡片的欄名，少一個就報錯。
- 卡片一律用 data-table.js 的 `dataCards()`，與表格吃同一份資料；不得在頁面自己手寫一套卡片（先前會員列表與風控審核各寫一份，間距與欄位排法都不一樣）。
- 個別表格的 CSS 只負責結構：min-width、table-layout、colgroup、固定欄、欄寬、checkbox 欄。不得再自訂表頭底色、文字色、字級、內距、框線或對齊；需要靠左對齊的只限權限矩陣首欄與合計列標籤欄——它們不是資料欄，是在替整列命名。「第一欄」本身不是對齊理由：報表的維度欄一樣照判準走，總營收是日期就置中，遊戲商／單一遊戲是長度不一的名稱就靠左。
- 欄位對齊由欄位定義的 `align` 決定，判準是「這一欄要拿來做什麼」而不是「它是文字還是數字」，完整的決策表在「表格 Table → 欄位對齊」。要從第一個字比對的字串靠左（名稱、帳號、代號、UID、說明、IP、設備指紋）——靠左讓每一列的起點落在同一條垂直線上，眼睛才掃得下去；要比大小的數字靠右（金額、筆數、百分比、比率）——個位數對齊之後位數多寡就等於數字大小，不必一個一個讀；短、等寬、只用來辨識的置中（狀態、標籤、幣別、層級、日期時間、操作鈕）。同一個欄位在不同頁面要一致：「上層代理」在會員列表與審核頁都是帳號，兩邊都靠左。**欄名一律置中，不跟著內容跑**——`align` 只設定內容，`dataTable()` 不把它寫進 `<th>`，表頭的置中由 unified-table-system 統一決定。改動後跑 node example-check.cjs。

- 唯讀資訊一律使用右側抽屜（openDetailDrawer），底部只有「關閉」；需要輸入或做決定才使用置中彈窗（prepareModal），footer 為取消＋主要操作。不得因欄位多就把唯讀內容改成寬版彈窗。
- 唯讀內容放不進抽屜寬度時，改用卡片或 risk-detail-grid 的兩欄定義列表呈現，不得在抽屜內塞需要橫向捲動的寬表格。稽核詳情即依此改為每筆一張卡片。

- Radio 與 Checkbox 一律使用 choice-controls.js 的 choice-control：input 16 × 16px、accent-color #1596AD，控制在左、文案緊接在右間距 8px，文案 14px／400 不加粗，整組以 fieldset＋legend 包覆。直排間距 12px，橫排 12px × 24px 且僅限短選項不超過四個。不得自訂勾選外觀或改用圖片取代原生控制。
- 提示文字一律使用 tooltip.js：在元素加 data-tooltip，方向以 data-tooltip-placement 指定（預設 top，空間不足自動翻面）；滑鼠停在觸發元素上，提示放下方會被游標或手指擋住，有特殊需求才改成其他方向。Tooltip 只放補充說明，不得承載必要資訊。停用按鈕不觸發滑鼠事件，data-tooltip 必須掛在外層容器（icon-button.js 的 iconButton 已處理）。
- 純圖示操作一律使用 icon-button.js 的 iconButton：semantic-btn 語意色＋icon-action，34 × 34px、圓角 4px、圖示 16px，但這個數字是 --btn-content ＋ 內距算出來的，不是寫死的。不另外外擴觸控熱區：熱區要配合 `pointer: coarse` 改按鈕間距，間距一變畫面就會在不同裝置之間左右跑動。34 × 34 仍符合 WCAG 2.5.8 AA 的 24 × 24 下限，密集操作欄靠 8px 間距與 Tooltip 補足。必須同時有 aria-label 與相同文字的 Tooltip；同一列最多三顆，停用時以提示說明原因。不得為圖示按鈕新增配色或尺寸。
- 圖示一律使用 icons.js 的 `icon(name, size)`，來源為 Lucide（ISC）。名稱必須在 build-icons.cjs 的 `ALLOWLIST` 上——Lucide 有 1940 個圖示，本專案只開放清單上那些，要用新的先加進清單再跑 `node build-icons.cjs`。清單外的名稱 `icon()` 會在主控台警告並不畫。不得使用文字字元（✎ ◷ ⇩ ＋ ↻ × 這類）當圖示，也不得在頁面自行拼 `<svg>` 或引入圖示字型。完整清單見側欄「圖示系統」頁，決策與正式後台的落地方式見 ICON-SYSTEM.md。
- 圖示只有三個尺寸：16px（表格操作欄、工具列按鈕內、輸入框尾綴）、20px（側欄導覽、頁首、狀態標記）、24px（空狀態插圖）。線寬由 `icon()` 依尺寸補償（2 / 2.25 / 2.5），不得自行覆寫 `stroke-width`——Lucide 的預設 2 是為 24px 畫的，直接縮到 16px 實際線寬只剩 1.33px 會糊。顏色一律 `currentColor`，由父層的 `color` 決定，SVG 內不得出現色碼。
- index.html 的 inline script 是 classic script，不能 import `icon()`，一律改寫 `<span data-icon="edit" data-icon-size="16">` 空殼，由 icons.js 的 `hydrate()` 補上；該檔內的樣板字串用 `iconHtml(name, size)` 產生同樣的空殼。module 內部則直接呼叫 `icon()`，不要用 data-icon。
- 圖示不單獨表達語意：純圖示按鈕必須同時有 aria-label 與同文字的 Tooltip，`icon()` 產生的 `<svg>` 一律帶 `aria-hidden="true"` 與 `focusable="false"`。改動圖示系統後跑 `node icon-check.cjs` 回歸。
- 表格加直向分隔線：th 右側 1px var(--line-strong)（#C6D1DB，比 --line 深一階——--line 是畫在白底上的，放到 #E9EDF4 的表頭上看不出界線），td 右側 1px #EDF0F4，每列最後一格不加。整列 hover 底色 #F1F8FA；有自訂底色的固定欄（如審核頁的 risk-fixed）必須一併套用 hover 底色，否則整列會斷開。

- 下拉選單一律使用 select.js 的共用 Select 與 select.css：頁面只寫原生 `<select>`，變化以屬性宣告（`multiple`、`data-collapse`、`data-max`、`data-select-all`、`data-filterable`、`data-min-filter`、`data-clearable`、`data-loading`、`data-wrap`、`<optgroup>`）。不得在頁面自行掛載 Element Plus 下拉，也不得覆寫下拉的尺寸、圓角、配色與選項列高。
- 選項超過十項要可搜尋（data-filterable）；上百項再加 data-min-filter，未達字數前維持完整清單並於下拉頂端說明還差幾個字。多選一律收合標籤（data-collapse），欄位高度固定 34px 不得被標籤撐高。全選只用於多選，計數不含停用選項，部分選取顯示半選狀態。說明型長選項加 data-wrap 換行，分類用 optgroup 且分類標題不可選。

- 頁籤一律使用 tabs.js 的共用 Tabs 與 tabs.css：`tabs({id,label,items,active,variant,mobile,controls})` 產生 tablist，面板用 `tabPanels()` 或以 `controls` 指向頁面自己重畫的單一面板。切換由元件處理，頁面只接 `tab-change`；需要攔截時接可取消的 `tab-before-change`。不得在個別頁面另寫頁籤樣式或自行處理方向鍵。
- 變化只有三種：`line` 頁面層級（預設）、`card` 內容區塊次層、`workspace` 工作區頁籤。同層級不得混用 line 與 card，一頁最多兩層頁籤。標籤文字只放名稱，數量用計數標記；無檢視權限的分頁不渲染，停用只用於暫時不可用。
- 頁籤保留手機行為參數供後續小寬度版面使用：`mobile="scroll"` 限 4 個以內的短標籤，切換後自動把目前頁籤捲進畫面、兩側以漸層提示；`mobile="select"` 用於 5 個以上或標籤字長，改用共用 Select。彈窗內的頁籤一律用 scroll，因為彈窗的捲動容器會裁切下拉。規範頁不另做手機預覽展示，手機版另行以小寬度版面製作。
- 手機（720px 以下）輸入類控制的高度一律 34px，與 Input／Select Token 的 Desktop 值相同：`.control`、`guide-input`、`settings-unit input` 與共用 Select 都不得在手機另設高度。字級在篩選列維持 16px，因為 iOS Safari 對 16px 以下的輸入欄位會在聚焦時自動放大整頁。按鈕也一樣是 34px：全站只有一個按鈕高度，不分斷點。
- 卡片型頁籤以填色標示作用中：#E7F7FA 底、#1596AD 字、字重 700、圓角 4px、高度 34px、間距 4px，描邊以 inset box-shadow 畫在元素內側（捲動容器會裁切外陰影）；未選取為透明底，hover 為 #F1F4F8。作用中必須是整組裡顏色最重的一塊，不得改用白底、上方色條或靠框線斷點表示。
- 工作區頁籤代表一個仍被保留狀態的已開啟頁面，關閉時必須一併清除該頁的快取與暫存搜尋條件，並接到相鄰頁籤。首頁為常駐頁籤不可關閉；開啟上限 10 個，超過時關閉最舊的一個。頁籤清單與上限由 shell 的狀態管理，不在 tabs.js 內處理。

- 載入與非資料狀態一律使用 states.js 與 states.css：`emptyState()`／`emptyRow()`（無資料、載入失敗）、`errorState()`（固定文案加後端 code 與 message）、`skeletonTable()`（首次載入）、`loadingWrap()`／`loadingVeil()`（重新查詢）。文案由 `STATE_COPY` 統一提供，個別頁面不得自行撰寫空狀態文案，只能替換狀態區那一顆操作按鈕；要改文案就改 states.js，全站一起變。
- 載入中分兩種且不可混用：畫面上還沒有資料時用骨架把版面撐出來；已經有資料時（換頁、改篩選、自動刷新）用遮罩讓舊資料留在原地變淡，不得把既有資料換成骨架。遮罩期間底下的操作必須停用。
- 無資料只有一種：本來就沒有與篩選後沒撈到都顯示「無資料」，與正式後台的 i18n key no_data 一致，不分兩種文案；需要引導下一步時，按鈕放在表格外的列表工具列。
- 請求失敗時表格不得顯示「無資料」，必須用 errorState() 直接輸出 toast 的字串：錯誤碼加敘述、同一行、不拆成標題與說明。兩者都來自後端的固定錯誤碼翻譯字典（請求帶 Language 標頭，敘述已是當前語系），前端不另外寫文案；後端連訊息都沒回時才退回 API request failed，與 useApi 最終分支相同。只放 code 與 message，不得放 ApiErrorResponse 的 debug（型別為 any，可能帶出內部路徑或查詢內容，而表格的錯誤會留在畫面上並被截圖轉傳）。所有後端字串一律轉義後輸出。
- 不做「無權限」狀態畫面：正式後台的 Side.vue 已把側欄過濾成只剩有 .read 權限的項目，沒權限的頁面進不去；真要防書籤或權限即時收回，應在 router guard 導回首頁，不是在表格裡放空狀態。
- 會員列表內不放任何狀態區的操作按鈕。狀態區只呈現狀況與原因；重新查詢、清除搜尋條件、新增、重新載入一律放在表格外的列表工具列，位置不隨狀態改變。emptyState() 與 errorState() 都不接受 action。
- 操作結果的回報一律使用 message.js 的 `message.success／info／warning／error`，不得自行做 toast 或改用 alert。四種型別的停留與可關閉由 message.js 統一決定（成功與一般 3 秒不可關、警告 4 秒可關、錯誤 5 秒可關），個別頁面不得覆寫；需要常駐的訊息代表它不該是 Toast。完整規範見側欄「訊息提示」頁與 MESSAGE-SYSTEM.md。
- **表格上方不放任何說明或狀態文字**，全站都一樣。操作結果（批量調整、審核通過、刷新完成）一律用 Toast，不在表格與工具列之間插一行字——那行字不會自己消失，使用者做完下一件事它還留在原地，看久了就被當成版面的一部分而不再被讀。需要常駐的只有兩種：欄位級錯誤（在欄位下方）與整個區塊的狀態（states.js 的狀態區，在表格內）。先前批量頁與風控審核頁各有一條這樣的回報列，都已移除。
- 層級不可混用：操作成功與請求失敗用 Toast；欄位級錯誤用行內錯誤文字（Toast 會消失，使用者回頭找不到是哪一格）；刪除、停用、放棄未儲存變更等需要使用者做決定的用彈窗；整個區塊沒資料或載入失敗用 states.js 的狀態區。判準是「訊息消失後使用者還需不需要它」，需要就不是 Toast。
- Toast 文案一律「動詞＋受詞」，一行 40 字以內：寫「已停用會員 MB-009821」，不得只寫「成功」或「操作成功」。錯誤訊息為代碼加敘述、同一行，與 errorState() 的格式一致，且只放後端的 code 與 message——**不得放 ApiErrorResponse 的 debug**，型別是 any 且 Toast 會被截圖轉傳。所有後端字串一律轉義後輸出。
- API 錯誤由共用的請求層統一發 Toast，頁面不得再自己 catch 報一次，否則同一個錯誤會出現兩則。正式後台對應 useApi.ts 的四個分支，見 MESSAGE-SYSTEM.md 第二節。
- 相同型別加相同文案的訊息只累加計數，不疊成一排；同時最多顯示 5 則，超過移除最舊的。這兩項由 message.js 處理，移植到 Element Plus 時要補上 `grouping: true`（EP 預設是 false）。改動訊息系統後跑 `node message-check.cjs` 回歸。
- 手機版固定在上方的那一疊（topbar → 工作區頁籤列 → 搜尋條件開關 → 內容）的位置全部從 styles/sticky-topbar-and-workspace-tabs.css 的 `--topbar-h-mobile`、`--quick-tabs-h-mobile`、`--mobile-search-toggle-h` 算出來，不得在別處另寫數字。先前 topbar 是 46px、頁籤列卻寫 top: 50px，中間那 4px 沒有人蓋，捲動時內容會從縫裡穿過去。固定在捲動內容上方的列一律不透明（手機 topbar 用 #fff，不用桌機那層半透明＋模糊）。改動後跑 node layout-check.cjs。
- 手機版（720px 以下）`.source-filter` 是收起來的，頁面只要有篩選列，就要用 filter-toggle.js 的 `filterToggle(panelId)` 放一顆開關；不得各自寫一份，也不得讓篩選列在手機上沒有入口。
- 日期的快捷區間就是正式後台那七個：今天、昨天、前天、本週、上週、本月、上月，順序一樣，不自行增減。手機版兩個月份面板改成上下排列（EP 預設並排且 body 有 min-width，手機會把左邊那個月切掉一半）。
- 側欄的捲動不畫捲軸：`.sidebar .nav` 用 `scrollbar-width: none` 與 `::-webkit-scrollbar{width:0}`，捲動提示改成上下緣的漸層淡出（mask-image）。側欄只有 248px，系統捲軸要吃掉 12–17px，而且正好落在作用中項目與內容區之間，把連接尖角切斷。不得為了「看得到能捲」把捲軸加回來。
- 作用中項目與內容區的連接尖角（active-nav-connector）的 `right` 必須等於 `.nav` 的右內距（目前 12px），尖角右緣才會正好落在側欄右緣、和內容接起來。改 `.nav` 的內距時要一起改。
- 列表工具列沒有「批次處理」這顆：正式後台沒有這個功能（只有批次審核）。按鈕頁的工具列組合與會員列表都已移除。
- 上方 topbar 與工作區頁籤列固定在捲動容器頂端（sticky，topbar top:0／頁籤列 top 等於 topbar 高度，手機 46px），內容從兩者下方通過。不得讓它們隨內容捲走。桌機 topbar 的高度與頁籤列的偏移共用 styles/sticky-topbar-and-workspace-tabs.css 的 --topbar-h，只在那一處定義，不得在別的檔案另寫 .topbar 高度或 .quick-tabs 的 top。側欄 logo 區（.brand）的高度固定為 --brand-h（64px），在所有寬度下都一樣，且帶 min-height／max-height／flex: none／overflow: hidden——不論下方導覽有多少項目、logo 圖片換成什麼尺寸，這一塊的高度都不得改變。--brand-h、--main-gap-top 與 .brand 的高度都不可放進 @media 內。topbar 高度不是等於 --brand-h，而是 calc(--brand-h - --main-gap-top)，因為 .main 有上緣留白會把 topbar 整個往下推；扣掉之後 topbar 底線才會與側欄 logo 下方的分隔線接成同一條水平線。改動後跑 node layout-check.cjs 驗證。

- 側欄只有兩種頁：**元件規範**（一元件一頁，講這個元件長什麼樣）與**組合範例**（一頁一條真實動線，講元件兜起來怎麼動）。沒有第三種「頁面示範」——先前的搜尋結果頁面／設定相關頁面／審核操作／複雜設定都已改寫成組合範例，因為它們各自帶一套私有樣式，而規範的參照物不能自己不照規範寫。新增頁面前先決定它屬於哪一種。
- 組合範例一律照正式後台的某一個 view 做，並在檔頭寫明是哪一支（例如 `membersManagement/index.vue`）；不得發明一個正式後台沒有的頁面。每一頁的結尾都要有「這一頁用到哪些規範」那張卡，列出它示範了哪幾條。
- 組合範例的版面一律是 `.example-page` ＋ `guide-section-heading` ＋ 內容 ＋ `example-note`，共用部分在 example-page.css；頁面自己的 css 只放這一頁多出來的東西，不得再定義一次卡片、表單欄位、表格或分頁。
- 表格一律用 data-table.js 的 `dataTable()`，包含分頁、空狀態、合計列（`foot`）、分組表頭（`groups`）、橫向捲動（`scroll`）與固定欄（欄位的 `sticky: 'right'`）。頁面不得自己兜一套分頁或自己畫 thead/tfoot——站上先前有兩套分頁（舊的 .pagination 與元件的 .data-table-pagination），已統一成後者。
- 匯出一律呼叫 download-center.js 的 `requestExport()`：正式後台 14 個 view 的匯出是建立下載任務、由頁首的下載中心每 3 秒輪詢，完成才拿得到檔案。按下匯出的當下不得回報「已匯出」，頁面也不得自己做下載 UI。
- 欄位級錯誤一律是欄位下方的 `<small class="error-text">`，並以 aria-describedby 連回欄位；不得用 Toast。整站只有一個行內錯誤樣式（guide-page.css），不得再出現第二個名字。
- 查詢區間有天數上限時用 `data-max-days`，由共用日期元件在日曆上就擋住；不得等按下搜尋才跳錯誤。正式後台 28 個 view 透過 useSearchDateRange(n) 做這件事。
- 一個元件只能有一頁規範。不得在別的規範頁自己再畫一套——兩邊樣式會不一樣，看的人不知道該照哪一個（Input 頁先前自己畫了 Radio／Checkbox／Switch／下拉／上傳／富文字，與各自的規範頁並存且寫法不同，已移除）。「使用」共用元件不算重複：分頁含每頁筆數的下拉、上傳失敗用 Toast 回報都是正確做法，但要列進 dup-check.cjs 的 ALLOWED 並寫明理由。改動後跑 node dup-check.cjs。
- 元件規範一律一元件一頁，用 guide-page.js 的 guidePage() 產生，不得把多個元件串在同一頁。側欄是單一平鋪清單，不放分類標題；項目順序依 Element Plus 的五個分類排列——基礎、表單、資料展示、導覽、回饋，之後接組合範例與頁面示範——這樣 ELEMENT-PLUS-MAPPING.md 可以一對一查表。新增元件時先決定它屬於哪一類，再插進該類的區段內，不要接在清單最後。
- 規範頁的骨架固定：外層 .style-guide、標題在 .guide-section-heading > h2、每個區塊是 section.card 並掛上提供內距的 class（.card 本身沒有內距）、卡片內的小節一律 h3、結尾依序是 token-table 的「共用規格」與 guide-rules 的「使用規則」。兩個收尾區塊不可省。改動後跑 node render-check.cjs 與 node nav-check.cjs 回歸。
- Switch、Radio、Checkbox 共用同一頁「選擇控制」，因為它們是同一個決策：改了要不要再按儲存、選項互不互斥。Switch 代表立即生效，旁邊不放確定按鈕；需要按儲存才生效的開關一律用 Checkbox；複選不得用多個 Switch 排成一列。
- CSS 不再寫在 index.html。shell 樣式全部在 `styles/`，載入順序由 `styles/index.css` 的 `@import` 決定，後面覆寫前面；調整順序等同調整層疊優先序。新增 shell 樣式前先查 `styles/README.md` 的「被多處覆寫的選擇器」，改既有檔案，不要再開新區塊疊上去。元件自己的 CSS 由各模組 import，排在 shell 樣式之後。
- 全域事件一律透過 `delegate.js` 的 `on()` 註冊，不得直接呼叫 `document.addEventListener`。每筆註冊要寫 `owner` 與它負責的 selector（`claims`）；兩個模組宣告同一個 selector 時主控台會警告。主控台輸入 `delegateRegistry()` 可列出目前的擁有權清單。
- 每個手刻模組的第一行要註明移植時對應的 Element Plus 元件，完整對照見 `ELEMENT-PLUS-MAPPING.md`。正式後台以 Element Plus 為主，手刻只在 EP 沒有對應時保留。
