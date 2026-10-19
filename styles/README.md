# styles/

index.html 原本把 41 個 `<style>` 區塊全寫在 `<head>` 裡（共 5,022 行）。拆檔後 index.html 剩 1,233 行，CSS 進到這個資料夾，**內容與順序完全沒變**。

## 規則

- 載入順序由 [index.css](index.css) 的 `@import` 決定，**後面的檔案覆寫前面的**。調整順序等同調整層疊優先序，不要隨意重排。
- 檔名就是原本的 `<style id>`，`base.css` 是原本沒有 id 的第一個區塊。
- 元件自己的 CSS（`tabs.css`、`states.css` 等）由各模組 `import` 進來，在 bundle 中**排在這些檔案之後**，所以元件樣式贏過 shell 樣式。
- 新增 shell 層級樣式時：先找同名選擇器已經在哪個檔案，改那裡；真的需要新區塊才新增檔案並加到 index.css 最後。

## 被多處覆寫的選擇器

以下選擇器散在 4 個以上的檔案，**實際生效的是最後一個**。改之前先把整列看過一遍。

| 選擇器 | 檔案數 | 定義順序（最後者生效） |
| --- | --- | --- |
| `.sidebar` | 8 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → full-viewport-override → blue-teal-palette-override → fixed-sidebar-independent-content-scroll → mobile-wrapped-static-navigation-and-actions |
| `.main` | 8 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → full-viewport-override → workspace-top-gap-override → fixed-sidebar-independent-content-scroll → mobile-wrapped-static-navigation-and-actions |
| `.topbar` | 8 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → workspace-top-gap-override → compact-density-override → sticky-topbar-and-workspace-tabs → mobile-wrapped-static-navigation-and-actions |
| `.brand` | 6 | base → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → horizontal-brand-logo → sidebar-selection-variant-two |
| `.brand-mark` | 6 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → blue-teal-palette-override |
| `.page` | 6 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → quick-tabs-and-grid-alignment |
| `.primary` | 6 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → blue-teal-palette-override |
| `.stat-icon` | 6 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → blue-teal-palette-override |
| `.action` | 6 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override → blue-teal-palette-override |
| `.app` | 5 | base → teal-full-shell-theme → blue-framed-dashboard-theme → full-viewport-override → fixed-sidebar-independent-content-scroll |
| `.stat` | 5 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → compact-density-override |
| `.count` | 5 | base → warm-card-theme → teal-full-shell-theme → blue-framed-dashboard-theme → blue-teal-palette-override |

> 這張表是 `.topbar` 的 sticky 失效 bug 的來源：第一個檔案寫了 `position: sticky`，後面的主題檔把它改成 `position: relative`。現在由 `sticky-topbar-and-workspace-tabs.css` 統一管。

## 已刪除的檔案

- `original-101best-pagination.css`：整支都是 `.member-data-card` 底下的分頁覆寫。會員列表改寫成組合範例（`example-member.js`）之後改用 `dataTable()` 的分頁，這支沒有任何選擇器還命中得到。
- `settings-demo.css`（在根目錄）：舊「設定相關頁面」的樣式。那一頁改寫成 `example-mixed.js` 後，只剩存檔列與 `.component-description` 還活著，分別移到 `example-page.css` 與 `style-guide-rhythm.css`。
