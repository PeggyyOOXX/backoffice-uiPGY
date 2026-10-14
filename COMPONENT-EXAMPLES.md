# 進階列表與內容編輯組件

位置：組件範例 → 進階列表；側邊選單 → 內容編輯。
優惠活動完整列表僅保留在「設定相關頁面 → 優惠活動設定」，不再放入組件範例；唯讀活動快照彈窗範例仍保留。
實作：advanced-examples.js、advanced-examples.css；彈窗沿用 modal-system。

## 審核操作與複雜設定

- 側邊選單「審核操作」：依原後台「轉點審核－風控」補齊搜尋、分組列表、逐筆通過／不通過、轉點明細、行政費稽核詳情與前台／後台備註。
- 側邊選單「複雜設定」：角色權限（階層勾選與部分選取、讀取／編輯依賴）、多步驟新增（驗證與確認摘要）、規則表格（批量套用、上下限驗證、儲存／取消）。
- 組件範例「審核操作與複雜設定」提供四個功能範例入口。
- 新增組合元件：分組表頭與固定操作欄、完整審核確認、階層權限矩陣、步驟導覽、可編輯規則表格；按鈕、開關、輸入、下拉、彈窗及抽屜沿用共用規範。
- 審核頁實作：risk-audit.js、risk-audit.css；複雜設定：workflow-examples.js、workflow-examples.css。互動檢查：node workflow-check.cjs。
- 所有資料為獨立示範，儲存僅保留於本次頁面工作階段，重新整理重設；尚未串接審核、角色或站台 API。
- 後續尚待補齊：異動前後比對、QR Code／複製資訊、完整憑證預覽，以及正式資料串接。

### 原 101 風控頁對照

來源：`C:/Peggy/project_Newgit/backoffice/src/views/riskControlWithdrawalAudit/index.vue`，路由 `/financial/withdrawal/risk-audit`。

- 搜尋：平台、申請時間、UID／會員帳號、上級代理、審核狀態、轉點次數、轉點 ID、最低／最高金額、轉點帳號、IP 地址、設備指紋。
- 玩家信息：轉點 ID、申請時間、UID、會員帳號／真實姓名、上級代理、層級、轉點渠道。
- 轉點資訊：稽核、扣除行政費、轉點金額、異動前／後餘額、狀態。
- 設備資訊：IP 地址、設備指紋、瀏覽器與版本。操作：風控審核、處理人與逐筆通過／不通過。
- 原頁沒有批次勾選或批次審核，已從審核頁移除；批次範例仍在進階列表。
- 轉點 ID 開啟右側明細抽屜，UID 開啟會員摘要。保留目前設計系統的唯讀抽屜，未複製原後台會員編輯頁。
- 扣除行政費開啟稽核詳情抽屜：頂端為總扣除行政費，每筆稽核一張卡片（類型、時間、狀態於卡片標題；金額、稽核%、稽核倍數、行政費%、要求／實際有效投注於兩欄定義列表；扣除額於卡片底部）。原頁為十欄寬表格彈窗，因唯讀內容統一走抽屜而改版。
- 審核確認包含原頁完整資料及兩個各 200 字的備註欄；原頁備註無必填限制，因此此處亦為選填。
- 開啟審核時領取案件，取消後仍顯示目前處理人；其他人處理中的案件不提供審核按鈕。示範審核完成後移出風控待辦列表。
- 每頁 10／20／50／100 筆；自動刷新 15 秒，離開頁面停止，確認彈窗開啟時暫停以保留操作上下文。
- 原始文案「可查詢60天內紀錄」與原程式日期驗證（最長 90 天、可選近一年）並不一致；本次保留原文案及驗證，尚未更動業務規則。

## 樣式規範新增章節

位置：側邊選單 → 樣式規範。全頁包在 `style-guide` 內，section 間距 20px、標題到內容 8px。

- 圖示按鈕 Icon Button（icon-button.js／css）：semantic-btn 語意色＋icon-action，34 × 34px、觸控 44 × 44px、圓角 4px。停用時外層包 icon-action-wrap 承載提示。
- Button Token：高度 34px、圓角 4px、水平內距 12px、字級字重 14px/700、按鈕間距 8px、Focus ring 3px。與 Input／Select Token 共用 token-table 版面。
- 表格 Table（table-guide.js／css）：示範表格＋完整 Token＋五條使用規則。外觀來源為 index.html 的 unified-table-system。
- 選擇控制 Radio／Checkbox（choice-controls.js／css）：狀態、直排／橫排／附說明／複選群組、錯誤狀態；Checkbox 的部分選取以 indeterminate 呈現。
- 提示氣泡 Tooltip（tooltip.js／css）：data-tooltip 觸發，四方向且空間不足自動翻面，滑鼠與鍵盤皆可觸發，開啟時掛 aria-describedby。
- 選項卡片（choice-card）：已併入選擇控制章節。樣式從 settings-demo.css 移到 choice-controls.css 成為單一來源，標題由 13px 對齊為 14px/600，已選狀態改由 :has(input:checked) 判斷，不再只靠 JS 重新渲染；舊的 is-selected class 仍相容。

## 分類批量開關

位置：側邊選單 → 批量開關。實作：bulk-switch.js、bulk-switch.css。
來源：原後台 `systemGameProviderManagement/game.vue` 的「批次調整狀態／全部狀態調整」兩排下拉。原做法選完立即套用，沒有確認、沒有影響筆數，兩排只差標題文字。

三個方案共用同一組示範資料，各自獨立可操作：

- 方案 A 勾選後浮出操作列：有勾選才出現，標題寫明已選筆數，每個分類一組開啟／關閉。無確認步驟，改完提供復原。
- 方案 B 批量控制收進欄位表頭：每個開關欄表頭一顆圖示按鈕開選單，選項直接寫「已勾選 N 筆」「全部 N 筆」。一次只能改一個分類。
- 方案 C 批次調整彈窗：範圍以選項卡片選擇，三個分類各為不變／開啟／關閉三態，送出前顯示將影響筆數與變更項數。

共同處理：全選為部分選取時顯示 indeterminate；每次批量後可復原上一次；所有控制有固定 id，重新渲染後焦點不會掉。

## 沿用規範
- 「樣式規範 → 開關排列 Switch」已定案並套用設定頁、設定表單範例、審核自動刷新及複雜設定：Switch 在前、文案在後，間距 16px；每項獨立一列且不固定列寬，文字向右延伸，超出容器才換行。只保留繁體中文互動範例，已移除多語系展示與「轉點規則」組合範例。
- 「表頭排序」四種狀態展示統一放在「樣式規範」頁，維持同一橫排；「組件範例」僅保留進階列表內的實際排序操作。
- 所有操作按鈕使用 semantic-btn 搭配既有語意類別。
- 輸入欄位使用 guide-input，下拉使用共用 guide-select。
- 彈窗使用 prepareModal；底部操作靠右。列表與內容工具列靠左。

## 新增組件
- 勾選列表：本頁全選與部分選取、跨頁保留選取、已選數量／金額、批次確認。
- 報表合計：本頁小計、篩選結果總計，CSV 匯出所有篩選結果。
- 多語言內容：各語言獨立標題、內文、圖片；繁體中文必填，其他語言填寫後須完整。
- 圖片上傳：JPG、PNG、GIF、WebP，單張 600 KB 上限；拖放、替換、移除、預覽及錯誤提示。
- 富文字編輯：沿用正式後台的 CKEditor 5 Classic 41.4.2 預設工具列。圖片使用本機預覽上傳介面，範例不呼叫正式 API。

## 範例資料範圍
- 列表與正式後台無連線，批次操作只修改示範資料。
- 內容儲存與還原保留於本次工作階段，重新整理後還原，不上傳檔案至服務端。
- 編輯器使用與正式後台相同的套件版本與 mediaEmbed 設定；正式 API 與服務端內容驗證未接入此互動原型。

## 下拉選單 Select

位置：側邊選單 → 下拉選單 Select。實作：select-advanced.js、select-advanced.css；元件本身在 select.js／select.css。
來源：原後台 `components/SearchForm.vue` 的 select 設定（isMultiple、maxCollapseTags、isFilterable、minFilterLength、groups、isOptionWrap），全站 161 處 el-select。

共用 Select 的變化全部寫在原生 `<select>` 的屬性上，頁面不自行掛載 Element Plus：

- `multiple` 多選，搭配 `data-collapse="N"` 收合標籤（超出顯示 +N，hover 列出完整清單），欄位高度維持 34px。
- `data-max="N"` 多選上限，達上限後其餘選項自動停用。
- `data-select-all` 下拉頂端加全選；計數不含停用選項，部分選取顯示半選狀態。
- `data-filterable` 可輸入搜尋，比對選項文字與值；`data-min-filter="N"` 輸入滿 N 個字才開始過濾，未達字數維持完整清單並顯示還差幾個字。
- `data-clearable` 可清除、`data-loading` 讀取中、`data-wrap` 長選項換行、`<optgroup>` 分組（分類標題不可選，搜尋時空分類自動隱藏）。
- 空與錯誤狀態有固定文案：正在取得選項／查無符合的選項／沒有可選項目，錯誤另附文字說明。

頁面同時示範把這些屬性放進既有 `source-filter` 篩選格線的實際組合。示範資料與正式後台無連線，搜尋與重設只更新頁面狀態。

## 頁籤 Tabs

位置：側邊選單 → 頁籤 Tabs。實作：tabs-guide.js、tabs-guide.css；元件本身在 tabs.js／tabs.css。
來源：原後台 26 個 view 的 el-tabs（預設底線、`type="card"`、多語系 lang-tabs、`before-leave` 未儲存守衛）。

- 變化：`line` 頁面層級（預設）、`card` 內容區塊次層、`workspace` 可關閉的工作區頁籤。
- 標籤內容：計數標記、停用、無檢視權限不渲染。
- 手機：`mobile="scroll"`（≤ 4 個短標籤，自動捲到目前頁籤並以漸層提示兩側）或 `mobile="select"`（≥ 5 個或標籤字長，改用共用 Select）。能力保留在元件內，規範頁不做手機預覽展示；手機版後續以小寬度版面另行製作。
- 離開守衛：元件發出可取消的 `tab-before-change`，頁面攔下後以共用 prepareModal 確認才切換。能力保留在元件內，規範頁不做展示區塊。
- 鍵盤：方向鍵、Home／End 即時切換（automatic activation），roving tabindex。

### 既有頁籤已改用共用元件

原本有五套各自的頁籤樣式與各自的方向鍵處理，已全部改走 tabs.js，`settings-tabs` 與 `snapshot-language-tabs` 的 CSS 一併移除：

- 設定相關頁面「設定分類」（5 個分頁，mobile=select）
- 組件範例「設定表單」（4 個分頁，mobile=select）
- 複雜設定「角色權限／多步驟新增／規則表格」（mobile=scroll）
- 內容編輯「內容語言」（8 種語言，mobile=select）
- 活動內容快照彈窗「活動語言」（mobile=scroll；彈窗的捲動容器會裁切下拉，所以不用 select）

shell 最上方的已開啟頁面列仍是 index.html 內的 `quick-tabs`，尚未改用 `workspace` 變化，因為它同時負責路由。

### 卡片型與工作區頁籤調整

- 卡片型作用中狀態改為填色 pill：#E7F7FA 底、主題綠字、字重 700。先後試過上方色條、資料夾式（Element Plus `type="card"` 同款）與灰底容器的白底分段控制，三者的作用中都是整組裡最淺的一塊，視覺上往後退而不夠明顯；改以填色當主指標後作用中才會往前跳。
- 工作區頁籤補上原後台 `useTabStore` 的兩條規則：首頁為常駐頁籤不可關閉（原碼 `v-if="index !== 0"`）、開啟上限 10 個且超過時關閉最舊的非首頁頁籤。清單與上限屬於 shell 狀態，不在 tabs.js 內處理。

## 載入與空狀態

位置：側邊選單 → 載入與空狀態。實作：state-guide.js、state-guide.css；元件本身在 states.js／states.css。
來源：原後台 `CustomTable.vue` 的 `v-loading` 與 `:empty-text="t('no_data')"`，以及 `usePermission` 的檢視權限判斷。

四種非資料狀態共用同一個版面（圖示、標題、說明、單一操作），文案由 `STATE_COPY` 統一提供：

| 狀態 | 什麼時候用 | 文案 |
| --- | --- | --- |
| `empty` | 本來就沒有資料，或篩選後沒撈到 | 無資料 |
| `error` | 請求失敗、逾時或伺服器錯誤 | 後端錯誤碼字典的「錯誤碼 敘述」原樣輸出；後端沒回訊息時為 API request failed |

「尚無資料」與「查無結果」已合併為單一「無資料」，與正式後台 `CustomTable` 的 `empty-text`（i18n key `no_data`）一致。「無權限」狀態已移除：`Side.vue` 把側欄過濾成只剩有 `.read` 權限的項目，沒權限的頁面進不去，該畫面不會出現。

載入失敗改以 `errorState({ code, message })` 直接輸出 toast 的字串（錯誤碼加敘述、同一行） —— 原本失敗時表格會顯示「無資料」，使用者會誤以為是查不到。只放 `code` 與 `message`，不放 `ApiErrorResponse` 的 `debug`（型別 `any`，可能帶出內部資訊，且表格錯誤會留在畫面上被截圖轉傳）。toast 繼續保留。狀態區不放任何操作按鈕 —— 重新查詢、清除條件、新增、重新載入一律在表格外的列表工具列。

## 原型結構整理

兩筆技術債已處理，行為與樣式皆未改變：

**CSS 拆檔。** index.html 原本把 41 個 `<style>` 區塊寫在 `<head>`（5,022 行），現在只剩 1,233 行，CSS 進到 `styles/`，一個區塊一個檔。內容與順序完全相同（已逐字比對驗證）。`styles/README.md` 附「被多處覆寫的選擇器」對照表 —— `.topbar`、`.main`、`.sidebar` 各散在 8 個檔案，先前 topbar sticky 失效就是這樣來的。

**事件委派收斂。** 原本 13 個模組各自呼叫 `document.addEventListener`，共 49 個全域監聽、沒有擁有權邊界。現在全部走 `delegate.js` 的 `on()`：每種事件只掛一個 document 監聽，每筆註冊登記 owner 與負責的 selector，兩個模組宣告同一個 selector 時主控台警告。handler 內容與執行順序未改動，所以行為相同。主控台輸入 `delegateRegistry()` 可查目前登記的 56 個 selector 歸屬。

**Element Plus 對應。** 新增 `ELEMENT-PLUS-MAPPING.md`，逐一列出每個原型模組移植時要用哪個 EP 元件、要覆寫什麼、以及哪些 EP 沒有需保留自製。每個手刻模組的第一行也加了一句對應註記。
