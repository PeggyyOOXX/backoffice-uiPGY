# Element Plus 對應表

這份原型是設計規範，不是可直接搬運的程式碼。本文件說明每個原型模組落到 `project_Newgit/backoffice` 時要用哪個 Element Plus 元件、要覆寫什麼、以及哪些地方 EP 沒有現成做法。

- 正式後台：Vue 3 + Element Plus **2.10.4**（原型用 2.14.5，同 major，以下用到的元件 API 相容；移植前請先對齊版本再驗一次）
- 覆寫一律寫在 `src/assets/scss/_element-ui.scss`，該檔已有 `:root` 的 `--el-*` 變數覆寫。**不要在個別 view 寫元件樣式**。
- 原則：**EP 有的就用 EP**。原型手刻只是為了在沒有框架的情況下把規範講清楚，不是建議的實作方式。

---

## 一、已經在用 EP，直接對應

| 原型 | EP 元件 | 正式後台既有 | 備註 |
| --- | --- | --- | --- |
| `select.js` | `el-select` / `el-option` / `el-option-group` | `SearchForm.vue` | 見下方「Select 屬性對照」 |
| `date-picker.js` | `el-date-picker` | `SearchForm.vue` | 快捷選項原型只有 3 個（本日／本週／本月），正式後台有 7 個，以正式後台為準 |
| 內容編輯 | CKEditor 5 Classic 41.4.2 | `CkEditor.vue` | 版本與正式後台相同，行為一致 |

### Select 屬性對照

原型用原生 `<select>` 加 `data-*` 宣告變化，對應到 `SearchForm.vue` 的 `SearchItem` 設定：

| 原型屬性 | SearchForm 設定 | el-select prop |
| --- | --- | --- |
| `multiple` | `isMultiple` | `multiple` |
| `data-collapse="2"` | `maxCollapseTags` | `collapse-tags` + `max-collapse-tags` |
| `data-max="3"` | — | `multiple-limit` |
| `data-filterable` | `isFilterable` | `filterable` |
| `data-min-filter="2"` | `minFilterLength` | `filter-method`（自行實作門檻） |
| `data-clearable` | — | `clearable` |
| `data-loading` | `isLoading` | `loading` + `loading-text` |
| `data-wrap` | `isOptionWrap` | 無，需 CSS 覆寫選項列高與 `white-space` |
| `<optgroup>` | `groups` | `el-option-group` |
| `data-select-all` | `selectAllTags()` | **無**，EP 沒有全選；用 `#header` slot 放一顆 `el-checkbox`（支援 `indeterminate`） |

---

## 二、原型手刻，移植時改用 EP

| 原型 | 改用 | 正式後台既有 | 要覆寫／注意 |
| --- | --- | --- | --- |
| `tabs.js` | `el-tabs` / `el-tab-pane` | 26 個 view 已在用 | 見下方「Tabs」 |
| `states.js` 空／查無 | `el-empty` | `CustomTable` 的 `empty-text` | `empty-text` 只能放純文字，要放圖示＋操作必須改用 `#empty` slot 包 `el-empty` |
| `states.js` 遮罩 | `v-loading` 指令 | `CustomTable` 已用 | 已符合規範，只需補 `element-loading-text` |
| `states.js` 骨架 | `el-skeleton` / `el-skeleton-item` | 無 | 首次載入用；`:rows` 與 `animated` |
| `states.js` 失敗／無權限 | `el-result` | 無 | 頁面層級用 `el-result`；表格內仍用 `el-empty` 配 `#empty` slot |
| `modal-system.js` | `el-dialog` | `CustomDialog.vue` | 標題左側綠線、footer 靠右已在 `_element-ui.scss` 可統一處理 |
| 右側抽屜 | `el-drawer` | 無（目前自製） | 唯讀詳情用，底部只有「關閉」 |
| `header.js` 帳號選單 | `el-popover` | `Header.vue` 的 `account-popper` | 已在用，面板寬度與六個欄位照規範頁；不得再加第三顆按鈕 |
| `form-guide.js` | `el-form` / `el-form-item` | 59 個 view 已在用 | 已符合：label-position="top"、require-asterisk-position="right"、rules 的 trigger 一律 blur。**缺的是送出失敗後的處理**——全站 0 處 `scrollToField`，要補上「捲到第一個錯誤並聚焦」 |
| `search-guide.js` | `SearchForm.vue`（內部用 el-form ＋ el-input/el-select/el-date-picker） | **65 / 72 個 view** | 設定驅動，概念沿用。三處要改：搜尋與重設改成帶文字的語意按鈕、按鈕固定在格線最後一欄靠右（重設在前、搜尋在後，不再因為有沒有進階條件而置中）、進階收合鈕要有文字並自成一列 |
| `.guide-fields` 格線 | `el-row` / `el-col` | 全站的 `:gutter` 與 `:sm/:md/:lg/:xl` | 原型把欄數收成一條 CSS 格線（手機 1／768 起 2／992 起 3／1200 起 4／1920 起 6，gutter 16），表單欄位與 `dashboard.vue` 的八張統計卡都吃同一份。移植時 `:gutter` 統一成 16（目前有 10／20／16 三種），`el-col` 一律 `:sm="12" :md="8" :lg="6" :xl="4"`；統計卡的 `:span="6"` 要改成同一組，否則手機會擠成四欄 |
| `sortable.js` | 無（EP 沒有拖曳排序），用 `vue-draggable-plus` | `sortSetting/index.vue` | 只從把手開始拖（`handle`）。SortableJS 預設會即時把佔位列移到新位置；要沿用原型的「插入線＋來源列留在原位」，在 `onMove` 裡標記目標列的 `is-drop-before／after` 並回傳 false，放下時再改資料。方向鍵排序與 aria-live 播報要自己補 |
| `permission-guide.js` | 不是 EP 元件，對應 `usePermission.ts` | 61 個檔案已在用 | `v-if` 141 處與 `:disabled` 161 處混用且無判準。統一成「動作沒了就不渲染，資料沒了就停用」 |
| `header.js` 待辦角標 | `el-badge` 或自繪 | `Header.vue` 的絕對定位 `<div>`（自繪） | 數字來自 `/api/v0/notifications`，WebSocket 推播更新。EP 的 `el-badge` 預設 `is-fixed` 位置與規範的 `-2px` 不同，要覆寫；`:max="99"` 與規範的 99+ 一致 |
| `tooltip.js` | `el-tooltip` | `IconBtn.vue`、`TruncateTooltip.vue` | `data-tooltip-placement` → `placement`；自動翻面 EP 內建 |
| `icon-button.js` | `el-button` + `el-tooltip` | `IconBtn.vue` | 尺寸 32×32（觸控 44×44）、圓角 4px 要覆寫 EP 預設 |
| `choice-controls.js` | `el-radio` / `el-checkbox` + `-group` | 全站已在用 | 16×16、`accent-color #1596AD`、間距 8px 要覆寫；部分選取用 `indeterminate` |
| `table-sort.js` | `el-table-column` `sortable` + `@sort-change` | `CustomTable.vue` | EP 預設也是雙箭頭三態循環，**顏色與尺寸要覆寫**成規範的灰／主題綠 |
| `unified-table-system` | `el-table` | `CustomTable.vue` | 表頭底色、字色、內距、框線全部改在 `_element-ui.scss` |
| 開關排列 Switch | `el-switch` | `CustomSwitch.vue` | 42×24px 要覆寫 EP 預設尺寸；文案字重 400 |
| 表格＋分頁 | `el-table` + `el-pagination` | `CustomTable.vue` + `Pagination.vue` | **原型合成一個元件** `dataTable()`：53 個用到分頁的 view，53 個都搭配 CustomTable，分頁從未單獨出現。正式後台可考慮把 Pagination 收進 CustomTable，頁面就不必各自兜。每頁筆數 10／20／50／100 兩邊一致 |
| 步驟導覽 | `el-steps` / `el-step` | `StepLine.vue`（自製 SVG） | 建議改用 `el-steps`，省掉自製的 line/lineActive 圖 |
| Toast | `ElMessage` | 全站 **189 處**已在用 | 分級已齊（success 164／error 17／warning 6／物件寫法 2），問題在**文案**：164 則成功裡有 149 則是同一句 `t("success")`。另需補 `grouping: true`、依型別的 `duration` 與 `showClose`、常駐 live region。見 `MESSAGE-SYSTEM.md` |
| 圖片上傳 | `el-upload` | 16 個 view 已在用 | 搭配 `useImageUploadRule` 的每功能像素規則 |
| 批量開關方案 B | `el-dropdown` | 無（全站 0 處） | 表頭的批量選單。正式後台沒有任何 el-dropdown，el-popover 的 15 處全在 Header.vue，而且其中只有兩處真的在跑（下載中心、帳號選單），其餘被 `<!-- 暫時隱藏 -->` 註解掉；都是資訊提示，不是動作選單。原型因此**不另立下拉按鈕規範**；若最後選定方案 B，移植時再評估要不要引入 |
| 權限矩陣 | `el-table` + `el-checkbox` | 無 | 群組列用 `indeterminate` |
| 圖示 | **不是 EP 元件**，沿用既有 `SvgIcon.vue` + `vite-plugin-svg-icons` | `SvgIcon.vue`、120 個 SVG | 架構不動，來源改用 Lucide；EP 內建的 22 個圖示另以 alias shim 攔截，見下方「圖示來源的例外」與 `ICON-SYSTEM.md` |

### Tabs

| 原型 | el-tabs |
| --- | --- |
| `variant="line"` | 預設（不指定 `type`） |
| `variant="card"` | `type="card"` |
| `variant="workspace"` | **不是 EP**，用既有 `TabBar.vue` + `useTabStore` |
| `tab-before-change` 可取消事件 | `:before-leave`（回傳 `false` 即攔下），`agentManagement/edit.vue` 已有範例 |
| `mobile="select"` | **EP 沒有**，需自行在 `<720px` 時改渲染 `el-select` |
| 邊緣漸層提示、自動捲到目前頁籤 | **EP 沒有**，需自行加 |
| 計數標記 | 用 `#label` slot 放名稱＋計數 `<span>` |

**卡片型作用中樣式要覆寫。** 規範是：未選取 `#F1F4F8` 底 `#DCE2EB` 框，作用中白底、整圈 `#1596AD` 外框、字重 700、下框線改白讓底線在它下方斷開。EP `type="card"` 的預設不是這樣，`.el-tabs__item.is-active` 要整組覆寫。

---

## 三、EP 沒有、必須保留自製

| 項目 | 為什麼 |
| --- | --- |
| 選項卡片 `choice-card` | EP 沒有卡片式 Radio；用 `<label>` 包 `el-radio` 自製外框 |
| Tabs 的手機下拉切換 | 同上 |
| Tabs 的邊緣漸層與自動捲動 | 同上 |
| 工作區頁籤 | 已有 `TabBar.vue`，與 `useTabStore` 的快取生命週期綁在一起 |
| 批量開關三個方案 | 是互動方案比較，不是單一元件 |
| 分組表頭＋固定操作欄（風控頁） | `el-table` 可做，但欄位組合是業務邏輯 |

---

## 四、覆寫策略

1. **先調 `--el-*` 變數**，能用變數解決的不要寫選擇器。`_element-ui.scss` 的 `:root` 已經在做這件事。
2. **變數不夠才寫選擇器**，統一寫在 `_element-ui.scss`，不要散到 view。
3. **避免 `!important`**。該檔目前有 26 處，多數是局部覆寫打架造成的；新增覆寫前先確認是不是變數沒設好。
4. **尺寸類覆寫集中管理**：按鈕 32px／圓角 4px、輸入 32px／圓角 7px、開關 42×24、圖示按鈕 32×32（觸控 44×44）、頁籤 36px。這些在原型的各「共用規格」表都有完整數值。

### 圖示來源的例外

本文件第三節的原則是「**EP 有的就用 EP**」。圖示是**明文例外**：來源用 Lucide，不用 `@element-plus/icons-vue`。

理由：

1. **貼切度**。EP 的 293 個要湊滿後台的業務概念得靠隱喻硬套——幸運轉盤只能用 `MagicStick`、捕魚機只能用 `Food`、存款限額與邀請進度共用 `Odometer`。Lucide 有 `dices`、`fish`、`gauge`。（**不是因為數量**：70 個業務概念兩套都是 100% 覆蓋，實測見 `ICON-SYSTEM.md` 第九節。）
2. **風格統一**。全站線條一致，包含下拉箭頭與表頭排序雙箭頭。

代價是 EP 元件內部會自己畫的 22 個圖示必須一起換，否則線條與實心並存，比不換還不統一。這些元件多半沒有可覆寫的 prop：

| 元件 | 可覆寫的 prop |
| --- | --- |
| `el-select` | `suffixIcon` `clearIcon` |
| `el-input` | `prefixIcon` `suffixIcon` `clearIcon` |
| `el-date-picker` | `prefixIcon` `clearIcon` |
| `el-pagination` | `prevIcon` `nextIcon` |
| `el-dialog` | `closeIcon` |
| `el-switch` | `activeIcon` `inactiveIcon` |
| `el-table` `el-upload` `el-tag` `el-alert` `el-collapse` `ElMessage` | **無** |

所以不逐個傳 prop，改成在 `vite.config.ts` 把整個套件 alias 掉：

```js
resolve: { alias: { '@element-plus/icons-vue': path.resolve(__dirname, 'src/icons/ep-shim.ts') } }
```

shim 範本已寫好在原型的 `porting/ep-shim.ts`，22 個名稱一個不缺，含線寬補償與維護說明。原型的 `icon-check.cjs` 會驗證它的匯出清單與 EP 內部 import 一致。

**不要把這條例外改回去**——改回 EP 圖示等於放棄線條統一，而 shim 一刪，22 處會悄悄變回實心。


---

## 五、移植順序建議

先拿**一個頁面**完整落地驗證，再往下鋪。建議用「搜尋結果／會員列表」，因為它同時用到 Select、DatePicker、Table、Pagination、Tabs、空狀態與 Icon Button —— 一頁就能驗完大部分覆寫是否吃得下。

驗完之後再處理 `_element-ui.scss` 的變數收斂，最後才逐頁套用。

---

## 移植前要先清掉的東西

這一節不是規範，是掃描正式後台時順手記下來的待辦。都在 `project_Newgit/backoffice`，與原型無關。

| 項目 | 現況 | 建議 |
| --- | --- | --- |
| `echarts` ^6.0.0 | `components/Chart.vue` 存在，但**沒有任何 view 在用** | 砍掉依賴與 Chart.vue，或補圖表規範再用。原型的儀表板長條圖與甜甜圈是純 CSS 畫的假圖，不是規範 |
| 拖曳套件三套 | `sortablejs`、`vuedraggable`、`vue-draggable-plus` 同時在 package.json，實際只有 `sortSetting/index.vue` 一個 view 在用 | 留一套（`vue-draggable-plus` 對 Vue 3 ＋ setup 最直接），另外兩套移除 |
| `:gutter` 三種值 | 10（38 處）／20（7 處）／16（1 處） | 統一成 16，見「設計 Token → 版面格線」 |
| `SettingFile.vue` 的正負配色 | 每個使用者可自選「負紅正綠／負綠正紅」 | 建議拿掉這個選項，改為站台層級設定，見「設計 Token → 數值呈現」 |
| 表單送出失敗 | 全站 0 處 `scrollToField`，長表單的第一個錯誤可能在畫面外 | 補上捲動與聚焦，見「表單 Form」 |
