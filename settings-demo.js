// 原型的進入點：載入所有頁面模組，補上 topbar 裡要由模組產生的那兩塊，然後開啟著陸頁。
//
// 這支檔案本來同時是「設定相關頁面」的實作（設定狀態、五個頁籤、優惠活動表格、
// 快照彈窗、拖曳排序都寫在這裡），那一頁已改寫成組合範例（example-mixed.js），
// 所以這裡只剩開站要做的事。檔名維持不變：index.html 的 <script> 與 nav-check 都認它。
import './filter-toggle.js'
import './example-audit.js'
import './switch-layout-guide.js'
import './icon-button.js'
import './table-guide.js'
import './bulk-guide.js'
import './editor-guide.js'
import './choice-controls.js'
import './select-advanced.js'
import './tabs-guide.js'
import './state-guide.js'
import './icon-guide.js'
import './message-guide.js'
import './guide-page.js'
import './component-pages.js'
import './choice-guide.js'
import './button-guide.js'
import './input-guide.js'
import './date-picker-guide.js'
import './data-table.js'
import './table-guide-page.js'
import './token-guide.js'
import './nav-guide.js'
import './progress-guide.js'
import { headerPopovers } from './header-popover.js'
import { downloadCenter } from './download-center.js'
import './tag-guide.js'
import './upload-guide.js'
import './steps-guide.js'
import './example-list.js'
import './example-settings.js'
import './example-bulk.js'
import './example-report.js'
import './example-form.js'
import './example-permission.js'
import './example-mixed.js'
import './example-member.js'
import './modal-system.js'

// topbar 是靜態 HTML，資訊氣泡與下載中心在模組載入後補上。
document.querySelector('[data-header-popovers]')?.replaceWith(
  Object.assign(document.createElement('span'), { className: 'header-popover-group', innerHTML: headerPopovers() })
)
document.querySelector('[data-download-center]')?.replaceWith(
  Object.assign(document.createElement('span'), { className: 'header-popover-group', innerHTML: downloadCenter() })
)

// 所有 render 函式與導覽 handler 都準備好之後，才開啟著陸頁。
document.querySelector('.nav-item[data-route-key="組合範例搜尋"]')?.click()
