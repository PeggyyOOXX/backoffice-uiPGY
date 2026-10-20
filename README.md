# Backoffice UI

101 BEST 後台 UI／UX 互動原型，包含會員管理、共用搜尋篩選、列表工具列、分頁、樣式規範與響應式側欄。

## 本機啟動

```bash
npm install
npm run dev
```

開啟終端顯示的本機網址即可查看。

## 建置

```bash
npm run build
npm run preview
```

## 側欄結構

側欄是單一平鋪清單，分成兩段：

- **元件規範**（20 頁）：一個元件一頁，由 `guide-page.js` 的 `guidePage()` 產生，順序照 Element Plus 的五個分類（基礎、表單、資料展示、導覽、回饋）排列，方便對照 ELEMENT-PLUS-MAPPING.md。
- **組合範例**（9 頁）：示範「元件兜起來之後長什麼樣、怎麼動」，每一頁都對應正式後台的一個真實頁面：

  | 範例 | 正式後台來源 | 這一型特有的東西 |
  | --- | --- | --- |
  | 搜尋 | `membersManagement` | 13 欄橫向捲動、固定操作欄、唯讀抽屜 |
  | 列表 | `giftCardManagement` | 篩選 → 表格 → 單筆操作 → 確認彈窗 |
  | 報表 | `gameRevenueReport` | 多維度頁籤、查詢區間上限、合計列、非同步匯出 |
  | 批量 | `gameProviderList` | 批量入口收在欄位表頭、本頁全選、可復原 |
  | 設定 | `branchSetting` | 純表單、頁籤守衛、未儲存提醒 |
  | 混合 | `financialSettings`／`rebateSettings`／`promotionActivity` | 設定頁裡的可編輯表格與可拖曳排序列表 |
  | 表單頁 | `membersManagement/add` | 新增走獨立頁而不是彈窗、行內錯誤、離開守衛 |
  | 權限 | `rolePermission` | 權限矩陣的父子連動與部分選取 |
  | 審核 | `riskControlWithdrawalAudit` | 兩層表頭、認領鎖定、15 秒自動刷新 |

## 回歸檢查

```bash
npm run check
```

九支腳本：元件不重複、側欄與路由、版面對齊、規範頁 render、圖示系統、訊息提示、動線回歸、組合範例、設計 Token。

此 Repository 為獨立設計原型，不包含 101 BEST 正式專案原始碼。
