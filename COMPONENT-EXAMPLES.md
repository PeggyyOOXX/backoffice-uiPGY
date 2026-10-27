# 組合範例

側欄的九頁組合範例，每一頁對應正式後台的一個真實 view。元件本身的規範在各自的規範頁，
這裡只記「這一型頁面特有的動線」與對照來源。

| 側欄項目 | 模組 | 正式後台來源 | 這一型特有的東西 |
| --- | --- | --- | --- |
| 組合範例－搜尋 | example-member.js | `membersManagement/index.vue` | 13 欄橫向捲動、固定操作欄、列上的狀態下拉、唯讀抽屜（會員摘要／登入紀錄）、工具列七顆按鈕與手機「更多」 |
| 組合範例－列表 | example-list.js | `giftCardManagement/index.vue` | 篩選 → 表格 → 分頁 → 單筆操作 → 作廢確認 → Toast |
| 組合範例－報表 | example-report.js | `gameRevenueReport/index.vue` | 四個維度頁籤共用一份查詢條件、查詢區間上限 90 天、合計列、千分位與負數紅字、匯出走下載中心 |
| 組合範例－批量 | example-bulk.js | `gameProviderList/game.vue` | 批量入口收在欄位表頭、全選只選本頁、可復原一次、不可逆動作先確認 |
| 組合範例－設定 | example-settings.js | `branchSetting/index.vue` | 純表單、頁籤切換的未儲存守衛、必填跟著勾選連動 |
| 組合範例－混合 | example-mixed.js | `financialSettings`／`rebateSettings`／`promotionActivity` | 設定頁裡的兩張表：整表可編輯的返水規則、可拖曳排序的活動清單；驗證失敗跳回出錯的頁籤 |
| 組合範例－表單頁 | example-form.js | `membersManagement/add.vue` | 新增走獨立頁而不是彈窗、欄位分區、行內錯誤、離開前確認、送出後導回列表 |
| 組合範例－權限 | example-permission.js | `rolePermission/index.vue` | 列表 → 編輯彈窗 → 權限矩陣；勾編輯自動補讀取、取消讀取連帶取消編輯、父層半選 |
| 組合範例－審核 | example-audit.js | `riskControlWithdrawalAudit/index.vue` | 兩層表頭 17 欄、打開審核就認領、審核彈窗帶完整資料與兩個備註、15 秒自動刷新（彈窗開著時暫停） |

## 跨頁的共用行為

- **頁首**（header.js）：右側只有六個位置，順序固定（下載中心 → 轉點審核 → 存款審核 → 語系 → 站台時區 → 帳號）。規範在側欄「頁首 Header」，對應 `Header.vue`。
- **下載中心**（download-center.js）：匯出一律 `requestExport()` 建立任務，頁首每 3 秒輪詢，完成才可下載。對應 `useDownloadCenterApi` 與 Header.vue 的下載進度氣泡，正式後台 14 個 view 在用。
- **右側抽屜**：唯讀資訊（會員摘要、登入紀錄、轉點明細、稽核詳情）共用 shell 的 `#detailOverlay`，底部只有「關閉」。
- **共用表格**：合計列、分組表頭、固定欄、橫向捲動與分頁都在 `dataTable()` 裡，九頁都用同一個。

## 回歸

```bash
node example-check.cjs     # 七頁組合範例的動線
node workflow-check.cjs    # 權限矩陣與審核頁的動線
```

所有資料都是獨立示範，儲存只保留在這次工作階段，重新整理即重設；沒有串接任何 API。
