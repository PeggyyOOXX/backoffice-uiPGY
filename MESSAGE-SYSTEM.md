# 訊息提示 Message

原型已落地：`message.js` ＋ 規範頁（側欄「訊息提示」）。回歸檢查 `node message-check.cjs`。

正式後台（`project_Newgit/backoffice`）本輪一律不動，以下對它的描述全部來自唯讀盤點，數字可用 `grep` 重現。

---

## 一、這是什麼

從畫面上方滑入、幾秒後自動消失的短訊息，用來回報「剛才那個動作成功了／失敗了」。不攔截操作、不需要按確認。對應 Element Plus 的 `ElMessage`。

容易跟它混淆的有三種，正式後台也都在用：

| | 用途 | 正式後台 |
| --- | --- | --- |
| **Toast**（`ElMessage`） | 操作結果回報，自動消失 | 189 處 |
| **彈窗** | 需要使用者做決定才能繼續 | `CustomDialog.vue` |
| **行內錯誤** | 欄位級驗證 | `el-form` 規則 |
| **狀態區** | 整個區塊沒資料／載入失敗 | `CustomTable` 的 empty |

判準一句話：**訊息消失之後，使用者還需不需要它？** 需要就不是 Toast。

---

## 二、正式後台的現況

### 呼叫分佈

189 個呼叫點，**全部都有指定型別**：

| 型別 | 次數 | 內容 |
| --- | --- | --- |
| `ElMessage.success` | 164 | 其中 **149 次是 `t("success")`** |
| `ElMessage.error` | 17 | 多為前端驗證（圖片尺寸、檔案大小、數量上限） |
| `ElMessage.warning` | 6 | 全是「超過上限」類 |
| `ElMessage({ type })` | 2 | 物件寫法，`bankList/index.vue`，一樣是 success |

> **更正**：`ELEMENT-PLUS-MAPPING.md` 原本寫「目前只有 2 處指定 type，其餘都是預設」。實際相反——那 2 處指的就是上表最後一列的物件寫法，型別一樣有帶。**分級是齊的，問題在文案。**

沒有任何一處用到 `ElMessageBox` 或 `ElNotification`。確認類的互動走自製的 `CustomDialog.vue`。

### 全部是 EP 預設值

全專案**沒有任何一處**設定 `duration`、`grouping`、`showClose`、`offset`。所以實際行為是 EP 預設：

- 停留 3 秒，四種型別都一樣
- 上方置中，由上往下堆疊
- 沒有關閉鈕
- **`grouping: false`**——相同訊息不合併，連按十次儲存會疊出十個「成功」

### API 錯誤是自動發的

`src/composables/api/useApi.ts` 攔下所有失敗請求，分四個分支：

```
401 / 403 / 451 / 000176  →  清 token ＋ useNoticeDialogStore.open() ＋ 導回登入（不是 Toast）
code === "000599"         →  ElMessage.error(`${code} ${debug?.message || message}`)
其他 success: false        →  ElMessage.error(`${code} ${message}`)
完全沒有回應               →  ElMessage.error("API request failed")
```

**所以頁面不該再自己 catch 報錯**，否則會出現兩則。目前掃過 `src/views` 沒有這種寫法，這條要維持住。

第一個分支的全域彈窗在 `App.vue` 第 109–127 行：240px 寬、`showClose: false`、footer 只有一顆 `el-button` 放一個 check 圖示（**沒有文字**），按下後 `resetTabs()` 並導回 `/login`。

---

## 三、盤出來的三個待修項

與原型無關，是正式後台現在就有的問題。

**1. 149 則一模一樣的「成功」**

`t("success")` 在八種語系翻出來是 `成功 / 成功 / Success / 成功 / Tagumpay / সফল / …`。使用者只知道有事成功了，不知道是哪一件；在同一頁連續做三個動作時，三則 Toast 無法分辨，截圖回報問題時也看不出當時發生什麼。

專案裡已經有正確的範例可以照抄：`edit_success`（5 處）、`update_success`、`copied`（6 處）、`logout_successful`。

**2. `debug` 外洩到 Toast**

`useApi.ts:94`：

```ts
ElMessage.error(`${data.code} ${data.debug?.message || data.message}`)
```

`ApiErrorResponse.debug` 的型別是 `any`，可能帶出內部路徑或查詢內容，而 Toast 會被截圖轉傳。這正是專案自己在 `AGENTS.md` 的狀態區規範裡明文禁止的事（「不得放 ApiErrorResponse 的 debug」），但當時只管到表格的 `errorState()`，沒管到 Toast 這條路。

建議：拿掉 `debug?.message`，與下一個分支一致只放 `code` 與 `message`。

**3. 寫死的英文退路文案**

`useApi.ts:100`：`ElMessage.error("API request failed")`。其餘全部走 i18n，只有這個分支沒有。改成 `t("api_request_failed")` 並補進八個語系檔。

---

## 四、原型的實作

### 與 ElMessage 的對應

```js
message.success('已儲存 3 項篩選條件')   ↔  ElMessage.success(t('filter_saved'))
message.error(`${code} ${message}`)      ↔  ElMessage.error(`${code} ${message}`)
message.warning('已達 12 個上限')        ↔  ElMessage.warning(t('exceed_limit'))
message.info('報表產生中')               ↔  ElMessage({ message, type: 'info' })
```

### 與 EP 預設刻意不同的三點

**1. 相同訊息合併計數**

相同型別＋相同文案在畫面上時只累加 `×N`，不再疊一則。EP 的 `grouping` 預設是 `false`，移植時要帶上 `grouping: true`，或在共用層統一設定。

**2. 錯誤停留較久且可手動關閉**

| 型別 | 停留 | 可關閉 |
| --- | --- | --- |
| success | 3 秒 | 否 |
| info | 3 秒 | 否 |
| warning | 4 秒 | 是 |
| error | 5 秒 | 是 |

成功只是回報，看不到也不影響結果；錯誤帶著代碼與原因，使用者需要時間讀完，甚至要截圖。EP 全部 3 秒且無關閉鈕，移植時要帶 `duration` 與 `showClose`。

**3. 用 `popover` 進 top layer**

原型的彈窗是原生 `<dialog>` 搭配 `showModal()`，會進入瀏覽器的 **top layer**——畫在所有 `z-index` 之上。單純靠 `z-index` 的 Toast 從彈窗裡觸發時會被蓋住，而「彈窗按下儲存之後」正是最常發 Toast 的時機。

所以 Toast 容器用 `popover="manual"` 一起進 top layer，而且每次新增訊息都重新 `showPopover()`，排到堆疊最上面（top layer 是堆疊，後進的畫在上面）。不支援 `popover` 的瀏覽器退回 `z-index: 2000`。

規範頁的「與彈窗並存」有一顆按鈕可以實測。

> **這一條不需要移植。** 正式後台用的是 `el-dialog`，它不是原生 `<dialog>`，沒有 top layer 的問題，EP 的 z-index 機制就夠了。

### 無障礙

視覺上的訊息帶 `aria-hidden="true"`，播報交給兩個常駐的 live region：success 與 info 走 `aria-live="polite"`，warning 與 error 走 `role="alert"` ＋ `aria-live="assertive"`。

live region 必須在內容插入「之前」就存在才會被播報，所以不能靠訊息元素自己帶 `role`——這是 EP 也沒處理好的地方，移植時要一併補。

---

## 五、文案規則

| | |
| --- | --- |
| 格式 | 動詞＋受詞。`已儲存 3 項篩選條件`，不是 `成功` |
| 長度 | 一行、40 字以內。放不下代表它不該是 Toast |
| 錯誤 | 代碼＋原因同一行，與狀態區的 `errorState()` 一致 |
| 錯誤內容 | 只放後端的 `code` 與 `message`，**不得放 `debug`** |
| 語系 | 全部走 i18n，退路文案也一樣，不得寫死任何一種語言 |
| 轉義 | 後端字串一律轉義後輸出 |

```
不要                     要
成功                     已儲存 3 項篩選條件
操作成功                 已停用會員 MB-009821
Error                    000412 出款金額超過單筆上限
API request failed       已複製會員編號
```

---

## 六、落地順序

原型（本專案）——**已完成**：

1. ✅ `message.js` ＋ `message.css`，四種型別、合併計數、top layer、live region
2. ✅ 規範頁 `message-guide.js`（側欄「訊息提示」），含決策表與實測按鈕
3. ✅ 舊的 `toast()`（單一 div ＋ `z-index: 80`）移除，18 個呼叫點轉接到共用系統
4. ✅ 規則寫進 `AGENTS.md`
5. ✅ `message-check.cjs` 回歸檢查

正式後台——**尚未執行，本輪未動任何檔案**：

6. 修第三節的三項：拿掉 `debug?.message`、`"API request failed"` 改走 i18n、把 149 則 `t("success")` 換成具體文案（可依頁面分批）
7. 在共用層統一帶上 `grouping: true`、依型別的 `duration` 與 `showClose`
8. 補 live region（EP 的 `ElMessage` 沒有常駐 live region）
9. 全域彈窗的確認鈕補上文字，不要只有一個 check 圖示
