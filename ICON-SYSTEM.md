# 圖示系統

**第 1 層已定案：來源為 Lucide（ISC），原型已全數落地。** 第 2 層（正式後台 70 個業務圖示的收斂）仍是提案，等你與後台那邊確認。

| | 狀態 |
| --- | --- |
| 第 1 層 通用圖示 | **完成**——`icons.js` + `build-icons.cjs`，82 個名稱 |
| 第 3 層 Unicode 字元 | **完成**——原型 UI 內已清空，只留說明文字 |
| 規範頁 | **完成**——側欄「圖示系統」，含全部名稱與尺寸階 |
| EP 內建 22 個圖示 | **範本完成**——`porting/ep-shim.ts`，待正式後台套用 |
| 第 2 層 業務圖示收斂 | 提案，未動正式後台 |

回歸檢查：`node icon-check.cjs`

正式後台（`project_Newgit/backoffice`）在本輪一律不動，以下對它的描述全部來自唯讀盤點，數字可用 `grep` 重現。

---

## 一、現況

### 正式後台

`vite-plugin-svg-icons` 把 `src/assets/images/icons/*.svg` 打成 sprite，`symbolId` 為 `icon-[name]`，`SvgIcon.vue` 以 `<use xlink:href="#icon-${name}">` 取用。**這個架構是對的，本提案不更動它。**

壞的是資產層與規範層：

| 檢查項 | 數字 |
| --- | --- |
| SVG 檔案 | 120 |
| 不同 viewBox 規格 | 20+ 種（`0 0 24 24` 55 個、`0 0 512 512` 14 個、`-10 0 1210 1200` 8 個、`0 0 209.281 209.281`、`0 0 121 6`） |
| 檔名含 `512.000000` 這類小數補零 | 6（點陣描圖的痕跡） |
| 畫法 | 102 個填色 / 18 個描邊，兩種混用 |
| `stroke-width` | 全部是 `2`，但 viewBox 24 的 2 相當於線寬 8.3%、viewBox 512 的 2 只有 0.4% |
| 寫死色碼、無法跟主題 | 9 個檔（`#6E94F9` 25 處、`#E65F62`、`#273457`、`#FFAE00`、`#AAAAAA`） |
| `.svg-icon` 的 CSS 規則 | **全專案 0 條**：沒有預設尺寸、沒有 `fill`、沒有垂直對齊 |
| 尺寸決定方式 | 每次呼叫自己寫 Tailwind：`size-6` 243、`size-5` 31、`size-8` 16、`size-4` 12、`size-3` 7、`size-12` 7、`size-7` 2，另有 25 處完全沒寫 |
| sprite 總量 | 196 KB，開頁全量注入 |

### 原型

用 Unicode 字元（`✎ ◷ ⇩ ＋ ↻ ×` 等，約 30 個不同字元）。問題與正式後台同源，只是症狀不同：字型在不同 OS 回退到不同字族（Windows → Segoe UI Symbol，macOS → Apple Symbols），筆畫粗細、基線、字寬都不一樣，也無法指定線寬。`icon-button.js` 規範寫了「圖示 16px」卻沒有圖示來源。

---

## 二、現在就能修的缺陷

與選型無關，不論最後選哪一套都該修。

**1. 4 個圖示名稱對不到檔案，會靜默渲染成空白**

`<use href="#icon-xxx">` 指向不存在的 symbol 時不會報錯，只是什麼都不畫。

| 名稱 | 出處 |
| --- | --- |
| `giftCardManagement` | `src/router/routes.ts` |
| `luckyWheel` | `src/router/routes.ts` |
| `checkInActivity` | `src/router/routes.ts` |
| `image` | `.vue` 內的靜態 `name` |

**2. 9 個檔案掃不到任何引用**

`adminOperationRecord` `calendar` `cancelCircle` `home` `inActive` `more` `security` `union` `wallet`
（已排除 `routes.ts` 的 `icon:`、`.vue` 的 `name="..."`、`IconBtn` 的 `icon="..."` 與 `:name="'...'"` 四種寫法）

**3. `.svg-icon` 沒有任何 CSS**

缺的是這一條：

```css
.svg-icon { width: 1em; height: 1em; fill: currentColor; flex: none; vertical-align: -.125em; }
```

沒有它，尺寸只能靠每個呼叫點自己寫，於是就長成上表那 7 種。

**4. 同一個名稱被不同頁面重複使用**

`star` 3 次、`carousel` 2 次、`bank` 2 次、`agentAffiliate` 2 次、`WithdrawalReview` 2 次、`manualDepositsWithdrawals` 2 次、`memberAuditAdjustment` 2 次。

這不是缺陷，是**反證**：「一頁一個專屬圖示」的規則早就破了，而且沒有造成任何問題。第四節的收斂方案就建立在這個觀察上。

---

## 三、三層分法

120 個檔案依性質分三層，各自的處理方式不同。

| 層 | 內容 | 數量 | 作法 |
| --- | --- | --- | --- |
| 第 1 層 | 通用 UI 圖示（`add` `edit` `delete` `download` `search` `refresh` `arrow*` `check` `cancel` `lock` `view` `warning` `calendar` `more` `sort` `copy`…） | 50 | 整組換成現成 set，一個都不自己畫 |
| 第 2 層 | 業務／導覽圖示 | 70 | **先收斂到 17**，剩下的才談設計 |
| 第 3 層 | 原型的 Unicode 字元 | 約 30 種 | UI 內全部移除，只留在說明文字 |

---

## 四、第 1 層：通用圖示選型

**結論：Lucide。** 比較頁已完成任務並移除，改為規範頁（側欄「圖示系統」）。

決定的理由是**貼切度與風格統一**，不是數量——數量實測不構成優勢（第九節）。代價是 EP 內建的 22 個圖示要一併攔截（第十節），已寫成 `porting/ep-shim.ts`。

兩個候選當時的比較：

| 項目 | A｜Element Plus Icons | B｜Lucide |
| --- | --- | --- |
| 新增依賴 | 0，`@element-plus/icons-vue` 2.3.2 兩個專案都已安裝 | 1 個（`lucide-vue-next`） |
| 授權 | MIT | ISC |
| 數量 | 293 | 1940（**對本專案不構成優勢**，見第九節） |
| 畫法 | 實心，viewBox 1024 | 線條 2px、round cap，viewBox 24 |
| 與 EP 內建圖示 | **同源**，下拉箭頭、日期、分頁、MessageBox 全部一致 | 不同源，EP 內建會畫 22 個圖示，要一併換掉才算統一（見第九節） |
| 與原型現有樣式 | 不同調（下拉箭頭目前是 1.5px 線條） | **同調** |
| 對第 2 層的覆蓋 | **70/70**，需 50 個不同圖示 | **70/70**，需 55 個不同圖示（實測見第九節） |
| 與 `ELEMENT-PLUS-MAPPING.md`「EP 有的就用 EP」 | 相符 | 屬例外，需在對照表寫明理由 |

常見的第三個選項——圖示字型（Font Awesome、iconfont.cn）——不納入考慮：字型載入前整排是空白或豆腐塊、基線要靠 `vertical-align` 魔術數字、`::before { content }` 會被螢幕報讀器唸出私用區碼點、iconfont.cn 是第三方 CDN 的執行期依賴且授權對商業專案不乾淨。SVG sprite 沒有這些問題，而且已經在用。

---

## 五、第 2 層：70 → 17

### 為什麼能砍

側欄是三層選單，`Side.vue` 三層都渲染圖示（L1 第 126 行、L2 第 147 行、L3 第 173 行）。70 個業務圖示全部來自 **L3 的葉節點**——因為每個頁面都要有一個，所以每個頁面都開一個檔。

| 層級 | 節點數 | 現用圖示 |
| --- | --- | --- |
| L1 | 12 | 12 |
| L2 | 5 | 5 |
| L3 | 70 | 63 個不同名稱 |

L3 的圖示不被閱讀。24px 的方塊分不出「代理操作紀錄」和「會員操作紀錄」，使用者讀的是旁邊的文字；而且現在光是這 70 個裡面就有 5 組是「名詞 × 動作」的展開：

```
operationRecord / adminOperationRecord / agentOperationRecord
  / memberOperationRecord / operatorOperationRecord          5 個檔，同一件事
rebate / rebateRecord / rebateModifyRecord / rebateSettings  4 個檔
promotions / promotionActivity / promotionAndActivity
  / marketingActivity                                        4 個檔
invitationDetailReport / invitationProgressTracking
  / inviteFriends / inviteFriendsReview / inviteFriendsSetting  5 個檔
thirdPartyPayment / thirdPartyPaymentSetting
  / internalPayment / manualDepositsWithdrawals              4 個檔
```

### 提案

**L1 與 L2 保留圖示（17 個），L3 改為純文字。**

這是 Element Plus 官方文件側欄、Ant Design Pro 等的通行作法：圖示負責「這一區是哪一類」，文字負責「這一項是哪一筆」。

L3 改純文字後，縮排與 hover 仍足以表達層級；若覺得視覺太空，加一條 2px 的左側 indent 線即可，不需要圖示。

### 17 個保留名稱

名稱沿用現有的，不改名，`routes.ts` 的 `icon:` 不必動。

| 層 | 名稱 | 含意 | EP 候選 | Lucide 候選 |
| --- | --- | --- | --- | --- |
| L1 | `adminManagement` | 管理後台 | `Management` | `shield-user` |
| L1 | `operator` | 營運商 | `OfficeBuilding` | `building-2` |
| L1 | `personalCenter` | 個人中心 | `User` | `circle-user` |
| L1 | `agent` | 代理 | `Share` | `network` |
| L1 | `player` | 會員 | `UserFilled` | `users` |
| L1 | `finance` | 金流 | `Money` | `wallet` |
| L1 | `promotionAndActivity` | 優惠活動 | `Present` | `gift` |
| L1 | `inviteFriends` | 邀請好友 | `Promotion` | `user-plus` |
| L1 | `reports` | 報表 | `Histogram` | `chart-column` |
| L1 | `riskControl` | 風控 | `WarnTriangleFilled` | `shield-alert` |
| L1 | `websiteSetting` | 網站設定 | `Monitor` | `monitor` |
| L1 | `system` | 系統 | `Setting` | `settings` |
| L2 | `deposit` | 存款 | `Download` | `arrow-down-to-line` |
| L2 | `withdrawal` | 提款 | `Upload` | `arrow-up-from-line` |
| L2 | `marketingActivity` | 行銷活動 | `Promotion` | `megaphone` |
| L2 | `rebate` | 返水 | `Discount` | `percent` |
| L2 | `carousel` | 輪播 | `PictureFilled` | `images` |

兩套都 100% 涵蓋這 17 個，**不需要設計師**。即使日後 L3 也要圖示，兩套一樣都是 70/70（第九節）。

### 如果不接受 L3 純文字

退一步的方案是 L3 共用分類圖示：同一個 L2 底下的所有 L3 用同一個圖示。檔案數一樣是 17，只是 L3 仍有圖示。再退一步是依語意分 8 類（紀錄／設定／報表／審核／清單／金流／內容／權限），共 25 個檔。

三種方案的設計師工時都是 **0**，差別只在側欄的視覺密度。

### 設計師什麼時候才需要

照上面任一方案，**這一輪都不需要**。

真的需要委外時，要的不是「畫 N 張圖」，而是：

1. 一份 grid 規格：24 × 24 畫布、2px 留白（實際繪圖區 20 × 20）、描邊 1.5px 或 2px 擇一、圓角 2px、端點 round
2. 照該規格補的那幾個沒有現成對應的圖示
3. 交付規則：`fill="currentColor"`（或 `stroke="currentColor"`）、不含 `<style>`、不含 `width`／`height`、檔名 camelCase、過 SVGO

沒有第 1 項，第 2 項畫出來還是跟現成的對不起來——這正是現在 120 個檔案的由來。

---

## 六、第 3 層：原型的 Unicode 字元

**已完成。** UI 內的字元全部換成 SVG，只有說明文字保留（`540 × 600` 這類尺寸、`請輸入內容…` 這類 placeholder）。`icon-check.cjs` 會掃描原始碼擋住回退。

`icons.js` 的 API 與 `SvgIcon` 一對一：

```js
icon('edit', 16)         →  <SvgIcon name="edit" class="size-4" />
icon('loginRecord', 20)  →  <SvgIcon name="loginRecord" class="size-5" />
```

名稱沿用正式後台的 camelCase，`ELEMENT-PLUS-MAPPING.md` 不需要再多一張對照表。

受影響的模組：`icon-button.js`、`table-guide.js`、`settings-demo.js`、`bulk-actions.js`、`example-audit.js`、`select-advanced.js`、`tabs.js`、`modal-system.js`、`date-picker.js`，以及 `index.html` 側欄的 `.ico`。

---

## 七、規格

選定來源後寫進 `AGENTS.md`。

**尺寸階只有三級**，取代現在的 7 種：

| 尺寸 | 用在 |
| --- | --- |
| 16px | 表格操作欄、工具列按鈕內、輸入框尾綴 |
| 20px | 側欄導覽、頁首、狀態標記 |
| 24px | 空狀態插圖 |

> **注意既有規範衝突**：`icon-button.js` 寫「圖示大小 16px」，但正式後台 `IconBtn.vue` 的 `iconSize` 預設是 `6` → `size-6` → **24px**。落地前要先定一個。建議以 16px 為準（34 × 34 的按鈕裡放 24px 圖示只剩 5px 留白，過擠）。

**其餘規則**

- 顏色一律 `currentColor`，由父層的 `color` 決定；SVG 內不得出現色碼
- 永遠成對設定 `width` 與 `height`，不靠 `font-size`
- `aria-hidden="true"` ＋ `focusable="false"`；語意由 `aria-label` 或相鄰文字承擔
- 圖示不單獨表達語意——純圖示按鈕必須同時有 `aria-label` 與同文字的 Tooltip（`icon-button.js` 已處理）
- 命名用 camelCase，描述**物件**不描述**頁面**（`record` 不是 `memberOperationRecord`）

---

## 八、落地順序

原型（本專案）——**已完成**：

1. ✅ 選定 Lucide
2. ✅ `build-icons.cjs` + `icons.js` + `icons.css`，82 個名稱的許可清單
3. ✅ 清掉全部 Unicode 圖示字元（`index.html` 與 11 個模組）
4. ✅ 規範頁 `icon-guide.js`（側欄「圖示系統」）
5. ✅ 規則寫進 `AGENTS.md`，例外寫進 `ELEMENT-PLUS-MAPPING.md`
6. ✅ `icon-check.cjs` 回歸檢查

正式後台——**尚未執行，本輪未動任何檔案**：

7. 補 `.svg-icon` 的 CSS、修 4 個失效引用、清 9 個孤兒檔（第二節，與選型無關，可先做）
8. `npm i lucide-vue-next`，套用 `porting/ep-shim.ts` 與 `vite.config.ts` 的 alias（第十節第 1 點）
9. 把第 1 層的 50 個 `.svg` 換成 Lucide 的內容，`SvgIcon name` 不變
10. 決定 L3 是否改純文字，再刪掉不需要的檔案（第五節）

## 九、「圖示多就比較好」的實測

直覺是 Lucide 有 1940 個、EP 只有 293 個，所以 Lucide 覆蓋率比較好。**實測不成立。**

### 測法

把第 2 層全部 70 個業務概念（含日後可能加的遊戲分類、真人、體育、老虎機、彩票、捕魚機等）各自在兩套裡找候選名稱。候選由人挑，但「這個名稱存不存在」是查表，不是感覺。

### 結果

| | Element Plus | Lucide |
| --- | --- | --- |
| 總圖示數 | 293 | 1940 |
| 70 個概念的覆蓋 | **70 / 70** | **70 / 70** |
| 需要的不同圖示數 | 50 | 55 |
| 撞名組數（一個圖示被多個概念共用） | 13 | 11 |

1940 對 293 的差距**沒有**換成覆蓋率優勢。原因是後台的業務概念最後都收斂到少數幾個原型——紀錄、報表、設定、審核、清單、金流——這些兩套都有，而且有好幾個版本。

兩套的撞名狀況也接近：

```
EP      Tickets  → 存款紀錄、出款紀錄、返水紀錄、投注紀錄
        Document → 操作紀錄、禮物卡報表、文章管理、邀請明細報表
Lucide  receipt-text → 存款紀錄、出款紀錄、返水紀錄、投注紀錄
        gift         → 禮物卡管理、存款紅利、優惠活動
```

### 真正的差別是「貼不貼切」，不是「有沒有」

EP 要湊滿 70 個，有幾個得靠隱喻硬套：

| 概念 | EP 只能用 | Lucide 有 |
| --- | --- | --- |
| 幸運轉盤 | `MagicStick`（魔法棒） | `dices` / `disc-3` |
| 老虎機 | `MagicStick`（與轉盤撞名） | `cherry` |
| 捕魚機 | `Food`（食物） | `fish` |
| 遊戲商 | `Platform` | `gamepad-2` |
| IP 白名單 | `Monitor`（螢幕） | `globe-lock` |
| 存／出款限額 | `Odometer`（與邀請進度撞名） | `gauge` |

所以選 Lucide 的理由應該是**貼切度與風格統一**，不是「圖示比較多」。

---

## 十、選 Lucide 的代價

如果決定用 Lucide，以下四件事必須一起做，否則結果會比選 EP 更不統一。

### 1. EP 內建會自己畫 22 個圖示

`element-plus` 的元件內部直接 import `@element-plus/icons-vue`，不經過 `SvgIcon`。正式後台用到的元件共會畫出 22 個不同圖示：

```
ArrowDown ArrowLeft ArrowRight ArrowUp CaretRight Check CircleCheck
CircleClose CircleCloseFilled Close DArrowLeft DArrowRight Delete
Document Hide InfoFilled Loading MoreFilled SuccessFilled View
WarningFilled ZoomIn
```

涵蓋範圍不小：`el-select` 56 個檔、`el-input` 63 個、`el-table` 75 個、`el-upload` 16 個、`ElMessage` 284 次呼叫。

能不能換，分兩種：

| 元件 | 可覆寫的 prop | 作法 |
| --- | --- | --- |
| `el-select` | `suffixIcon` `clearIcon` | 傳 prop |
| `el-input` | `prefixIcon` `suffixIcon` `clearIcon` | 傳 prop |
| `el-date-picker` | `prefixIcon` `clearIcon` | 傳 prop |
| `el-pagination` | `prevIcon` `nextIcon` | 傳 prop |
| `el-dialog` | `closeIcon` | 傳 prop |
| `el-switch` | `activeIcon` `inactiveIcon` | 傳 prop |
| `el-table` `el-upload` `el-tag` `el-alert` `el-collapse` `ElMessage` | **無** | 只能走下方的 alias |

逐個傳 prop 不可行（要改幾百個呼叫點，而且一半根本沒有 prop）。可行的是**在 vite 攔截整個套件**：

```js
// vite.config.ts
resolve: {
  alias: {
    '@element-plus/icons-vue': path.resolve(__dirname, 'src/icons/ep-shim.ts')
  }
}
```

`ep-shim.ts` 以 EP 的名稱匯出對應的 Lucide 元件（上面 22 個，約 60 行）。一處改動，全部元件跟著換。

代價是**綁上了 EP 的內部圖示名稱**：EP 升版若改用別的圖示，shim 會少匯出一個而壞掉。要在 shim 裡加一行註解標明對應的 EP 版本，升版時重新核對。

### 2. 16px 的線寬要另外調

Lucide 的 `stroke-width: 2` 是為 24px 設計的。縮到 16px 時實際線寬是 `2 × 16/24 = 1.33px`，在非整數 DPI 的螢幕上會糊。

要依尺寸調整：

| 尺寸 | stroke-width | 實際線寬 |
| --- | --- | --- |
| 24px | 2 | 2.00px |
| 20px | 2.25 | 1.88px |
| 16px | 2.5 | 1.67px |

EP 是實心填色，沒有這個問題。

### 3. 1940 個選項需要一份許可清單

選項太多，不同人對同一概念會選不同圖示（`trash` / `trash-2` / `delete`、`search` / `search-check` / `scan-search`）。必須維護一份「本專案可用的 N 個名稱」清單，不在清單上的要先提案。

EP 的 293 個反而自帶這層約束。

### 4. 與既有原則的例外要寫明

`ELEMENT-PLUS-MAPPING.md` 第四節寫的是「EP 有的就用 EP」。選 Lucide 屬於明文例外，理由要寫進對照表，否則下一個人會把它改回去。

---

## 十一、決定

**選 Lucide。** 理由是貼切度與風格統一，不是圖示數量。

第十節的四項代價都已處理：

| 代價 | 處理 |
| --- | --- |
| 1. EP 內建 22 個圖示 | `porting/ep-shim.ts`——22 個名稱的 alias shim，含線寬補償與 EP 版本註記；`icon-check.cjs` 驗證匯出清單與 EP 內部 import 一致 |
| 2. 16px 線寬會糊 | `icon()` 依尺寸自動補償 2 / 2.25 / 2.5，呼叫端不必知道；規範頁有對照表 |
| 3. 1940 個選項會發散 | `build-icons.cjs` 的 `ALLOWLIST`（82 個）是唯一入口，清單外的名稱 `icon()` 會警告並不畫；規範頁就是這份清單的可視版本 |
| 4. 違反「EP 有的就用 EP」 | `ELEMENT-PLUS-MAPPING.md` 第四節後新增「圖示來源的例外」，寫明理由與不可改回的原因 |

**不要把這個例外改回 EP 圖示。** 改回去等於放棄線條統一；而 `ep-shim.ts` 一刪，那 22 處會悄悄變回實心，沒有任何錯誤訊息。
