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
| `tooltip.js` | `el-tooltip` | `IconBtn.vue`、`TruncateTooltip.vue` | `data-tooltip-placement` → `placement`；自動翻面 EP 內建 |
| `icon-button.js` | `el-button` + `el-tooltip` | `IconBtn.vue` | 尺寸 34×34（觸控 44×44）、圓角 4px 要覆寫 EP 預設 |
| `choice-controls.js` | `el-radio` / `el-checkbox` + `-group` | 全站已在用 | 16×16、`accent-color #1596AD`、間距 8px 要覆寫；部分選取用 `indeterminate` |
| `table-sort.js` | `el-table-column` `sortable` + `@sort-change` | `CustomTable.vue` | EP 預設也是雙箭頭三態循環，**顏色與尺寸要覆寫**成規範的灰／主題綠 |
| `unified-table-system` | `el-table` | `CustomTable.vue` | 表頭底色、字色、內距、框線全部改在 `_element-ui.scss` |
| 開關排列 Switch | `el-switch` | `CustomSwitch.vue` | 42×24px 要覆寫 EP 預設尺寸；文案字重 400 |
| 分頁 | `el-pagination` | `Pagination.vue` | 已有 10／20／50／100，符合規範 |
| 步驟導覽 | `el-steps` / `el-step` | `StepLine.vue`（自製 SVG） | 建議改用 `el-steps`，省掉自製的 line/lineActive 圖 |
| Toast | `ElMessage` | 全站 82 處已在用 | **目前只有 2 處指定 type**，其餘都是預設；需補 success／warning／error 分級 |
| 圖片上傳 | `el-upload` | 16 個 view 已在用 | 搭配 `useImageUploadRule` 的每功能像素規則 |
| 批量開關方案 B | `el-dropdown` | 無 | 表頭的批量選單 |
| 權限矩陣 | `el-table` + `el-checkbox` | 無 | 群組列用 `indeterminate` |

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
4. **尺寸類覆寫集中管理**：按鈕 34px／圓角 4px、輸入 34px／圓角 7px、開關 42×24、圖示按鈕 34×34（觸控 44×44）、頁籤 36px。這些在原型的各「共用規格」表都有完整數值。

---

## 五、移植順序建議

先拿**一個頁面**完整落地驗證，再往下鋪。建議用「搜尋結果／會員列表」，因為它同時用到 Select、DatePicker、Table、Pagination、Tabs、空狀態與 Icon Button —— 一頁就能驗完大部分覆寫是否吃得下。

驗完之後再處理 `_element-ui.scss` 的變數收斂，最後才逐頁套用。
