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
| `.main` | 7 | base → blue-framed-dashboard-theme → full-viewport-override → workspace-top-gap-override → fixed-sidebar-independent-content-scroll → sticky-topbar-and-workspace-tabs → mobile-wrapped-static-navigation-and-actions |
| `.brand` | 6 | base → blue-framed-dashboard-theme → compact-density-override → horizontal-brand-logo → sidebar-selection-variant-two → sticky-topbar-and-workspace-tabs |
| `.sidebar` | 6 | base → blue-framed-dashboard-theme → full-viewport-override → blue-teal-palette-override → fixed-sidebar-independent-content-scroll → mobile-wrapped-static-navigation-and-actions |
| `.topbar` | 6 | base → blue-framed-dashboard-theme → workspace-top-gap-override → compact-density-override → sticky-topbar-and-workspace-tabs → mobile-wrapped-static-navigation-and-actions |
| `.primary` | 5 | base → blue-framed-dashboard-theme → compact-density-override → blue-teal-palette-override → button-corner-radius |
| `.source-filter-actions` | 5 | member-source-layout → labeled-filter-component-override → quick-tabs-and-grid-alignment → strict-four-column-filter-grid → six-column-member-filter |
| `.app` | 4 | base → blue-framed-dashboard-theme → full-viewport-override → fixed-sidebar-independent-content-scroll |
| `.nav-item` | 4 | base → compact-density-override → active-nav-connector → uniform-sidebar-font-size |
| `.page` | 4 | base → blue-framed-dashboard-theme → compact-density-override → quick-tabs-and-grid-alignment |
| `.quick-tabs` | 4 | quick-tabs-and-grid-alignment → compact-quick-tab-spacing → sticky-topbar-and-workspace-tabs → mobile-wrapped-static-navigation-and-actions |
| `.source-filter-grid` | 4 | member-source-layout → labeled-filter-component-override → strict-four-column-filter-grid → six-column-member-filter |

> 這張表是 `.topbar` 的 sticky 失效 bug 的來源：第一個檔案寫了 `position: sticky`，後面的主題檔把它改成 `position: relative`。現在由 `sticky-topbar-and-workspace-tabs.css` 統一管。

## 已刪除的檔案

- `original-101best-pagination.css`：整支都是 `.member-data-card` 底下的分頁覆寫。會員列表改寫成組合範例（`example-member.js`）之後改用 `dataTable()` 的分頁，這支沒有任何選擇器還命中得到。
- `settings-demo.css`（在根目錄）：舊「設定相關頁面」的樣式。那一頁改寫成 `example-mixed.js` 後，只剩存檔列與 `.component-description` 還活著，分別移到 `example-page.css` 與 `style-guide-rhythm.css`。

## 已刪除的規則

舊的「頁面示範」（營運總覽／報表分析／行銷活動／平台設定）與第一版手寫的會員列表都還留在 `index.html` 裡，開站第一個動作就被路由整頁蓋掉，沒有任何畫面命中得到。頁面刪掉的同時，它們的樣式也一起移除，共 160 條規則：

| 這一組 | 選擇器 | 原本在哪 |
| --- | --- | --- |
| 統計卡 | `.stats` `.stat` `.stat-icon` `.stat-label` `.stat-value` `.delta` | base、blue-framed-dashboard-theme、compact-density-override、blue-teal-palette-override |
| 頁面標題列 | `.page-head` | 同上 |
| 第一版篩選列 | `.filters` `.filter-row` `.field` `.filter-sheet` `.mobile-filter` | base、compact-density-override |
| 第一版表格與分頁 | `.table-card` `.table-toolbar` `.toolbar-right` `.pagination` `.row-actions` | base、compact-density-override、semantic-button-system 等 5 支 |
| 第一版手機卡片 | `.mobile-list` `.mobile-card*` `.mobile-meta` `.member-card-head` | base、compact-density-override、member-source-layout |
| 姓名縮寫頭像 | `.avatar` `.user` `.profile-mini` `.brand-mark` | base、compact-density-override |
| 圖表與儀表板裝飾 | `.chart-grid` `.chart-card` `.bars` `.bar` `.donut` `.legend` `.mini-card` `.split` | compact-density-override、blue-teal-palette-override |
| 行銷活動卡 | `.campaign*` `.progress` `.activity*` `.review-row` `.risk-box` | compact-density-override |
| 舊平台設定 | `.setting-layout` `.setting-nav` `.setting-form` `.setting-section` `.setting-line` `.form-grid` `.switch` `.on` | compact-density-override、blue-teal-palette-override |

判準是「`class="x"` 寫得出來的地方有沒有這個名字」，不是「原始碼裡有沒有這個字串」——`bar`、`field`、`count`、`action` 這些同時是一堆模組的變數名，只看字串會以為還活著。
