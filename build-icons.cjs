#!/usr/bin/env node
/**
 * 產生 icons.js —— 原型的圖示系統。
 *
 * 來源：Lucide 1.6.0（ISC）。Lucide 共 1940 個圖示，本專案只用下方 ALLOWLIST 這些。
 * 清單本身就是規範：要用新圖示先加進這裡，不是在頁面上隨手挑一個名字。
 * 理由見 ICON-SYSTEM.md 第十節第 3 點——1940 個選項不設限，同一個概念會長出三種畫法。
 *
 * Lucide 不是本專案的依賴（原型不跑 Vue），向量資料直接抽成字串內嵌。
 * 正式後台改用 `lucide-vue-next`，名稱對照見 ICON-SYSTEM.md。
 *
 * 重跑：node build-icons.cjs
 */
const fs = require('fs')
const path = require('path')

const LUCIDE_DIR = process.argv.includes('--lucide')
  ? process.argv[process.argv.indexOf('--lucide') + 1]
  : 'C:/Peggy/test03/my-clone/node_modules/lucide-react/dist/esm/icons'

// [群組, 名稱, Lucide 檔名, 中文]
// 名稱沿用正式後台 src/assets/images/icons 既有的 camelCase，移植時不必再做一層對照。
const ALLOWLIST = [
  // --- 操作：表格操作欄與列表工具列 ---
  ['action', 'edit', 'pencil', '編輯'],
  ['action', 'delete', 'trash-2', '刪除'],
  ['action', 'add', 'plus', '新增'],
  ['action', 'close', 'x', '關閉'],
  ['action', 'search', 'search', '搜尋'],
  ['action', 'refresh', 'refresh-cw', '刷新'],
  ['action', 'reset', 'rotate-ccw', '重設'],
  ['action', 'download', 'download', '匯出'],
  ['action', 'upload', 'upload', '上傳'],
  ['action', 'sort', 'arrow-up-down', '排序'],
  ['action', 'filter', 'list-filter', '篩選'],
  ['action', 'batch', 'layers', '批量操作'],
  ['action', 'batchReview', 'clipboard-check', '批次審核'],
  ['action', 'more', 'ellipsis-vertical', '更多'],
  ['action', 'columns', 'columns-3', '欄位設定'],
  ['action', 'drag', 'grip-vertical', '拖曳排序'],
  ['action', 'view', 'eye', '檢視'],
  ['action', 'hide', 'eye-off', '隱藏'],
  ['action', 'copy', 'copy', '複製'],
  ['action', 'print', 'printer', '列印'],
  ['action', 'lock', 'lock', '鎖定'],
  ['action', 'unlock', 'unlock', '解鎖'],

  // --- 方向與導覽 ---
  ['nav', 'arrowUp', 'chevron-up', '向上／收合'],
  ['nav', 'arrowDown', 'chevron-down', '向下／展開'],
  ['nav', 'arrowLeft', 'chevron-left', '上一頁'],
  ['nav', 'arrowRight', 'chevron-right', '下一頁'],
  ['nav', 'prevStep', 'arrow-left', '上一步'],
  ['nav', 'nextStep', 'arrow-right', '下一步'],
  ['nav', 'menu', 'menu', '選單'],
  // 側欄的收合開關。這是跨產品的既定圖示：VS Code 的 Toggle Primary Side Bar、
  // Notion、shadcn/ui 的 SidebarTrigger 用的都是 Lucide 的 panel-left。
  // 不用箭頭——左上角的箭頭會被讀成「回到上一頁」。
  ['nav', 'panelLeft', 'panel-left', '收合側欄'],
  ['nav', 'home', 'house', '首頁'],
  ['nav', 'external', 'arrow-up-right', '另開視窗'],

  // --- 狀態 ---
  ['status', 'check', 'check', '已完成'],
  ['status', 'checkCircle', 'circle-check', '核准'],
  ['status', 'cancelCircle', 'circle-x', '拒絕'],
  ['status', 'warning', 'triangle-alert', '警告'],
  ['status', 'info', 'info', '說明'],
  ['status', 'loading', 'loader-circle', '載入中'],
  ['status', 'pending', 'clock-alert', '待處理'],
  // pending（時鐘）表示「在排隊等人處理」，pause 表示「被人為停住」——兩件事不同。
  // 用時鐘當暫停，使用者會讀成「處理中」。
  // pause／play 刻意用不帶圓框的版本：這兩顆在表格裡是並排的同一顆按鈕的兩個狀態，
  // 外框一樣時 16px 下只剩中間那一點點差異，圈掉外框後是「兩豎線 vs 三角」，一眼分得出。
  ['status', 'pause', 'pause', '暫停'],
  ['status', 'play', 'play', '啟用'],
  ['status', 'star', 'star', '收藏'],
  ['status', 'bell', 'bell', '通知'],
  ['status', 'imageEmpty', 'image-off', '無圖片'],

  // --- 業務概念 ---
  ['domain', 'user', 'user', '單一會員'],
  ['domain', 'members', 'users', '會員管理'],
  ['domain', 'agent', 'network', '代理'],
  ['domain', 'operator', 'building-2', '營運商'],
  ['domain', 'personalCenter', 'circle-user', '個人中心'],
  ['domain', 'finance', 'wallet', '金流'],
  // 存款／提款用「圓框＋大箭頭」，這是交易所與金流後台的通用寫法（入金／出金）。
  // 試過也退掉的兩組：
  //   arrow-down-to-line／arrow-up-from-line：裸箭頭，與旁邊的 download（匯出）
  //     在 20px 下幾乎是同一個圖，頁首三顆並排時得逐一讀 Tooltip 才分得出來。
  //   banknote-arrow-down／-up：區分方向的箭頭只佔 24 單位裡的 6 單位，縮到 20px
  //     只剩 5px，兩顆反而會變成同一個圖。piggy-bank／hand-coins 則是筆劃太碎，
  //     20px 下看起來只是一團墨。
  // circle-arrow 只有三個節點（圓＋豎線＋箭頭），全部佔滿 24 單位，16px 也銳利，
  // 而且圓框的輪廓與 download 的托盤形完全不同，一眼就分得開。
  ['domain', 'deposit', 'circle-arrow-down', '存款'],
  ['domain', 'withdrawal', 'circle-arrow-up', '提款'],
  ['domain', 'amount', 'circle-dollar-sign', '金額'],
  ['domain', 'bet', 'coins', '投注'],
  ['domain', 'rebate', 'percent', '返水'],
  ['domain', 'promotions', 'gift', '優惠活動'],
  ['domain', 'marketing', 'sparkles', '行銷活動'],
  ['domain', 'announcement', 'megaphone', '公告'],
  ['domain', 'reports', 'chart-column', '報表'],
  ['domain', 'revenueReport', 'chart-line', '營收報表'],
  ['domain', 'shareReport', 'chart-pie', '分成報表'],
  ['domain', 'riskControl', 'shield-alert', '風控'],
  ['domain', 'rolePermission', 'key-round', '角色權限'],
  ['domain', 'loginRecord', 'history', '登入紀錄'],
  ['domain', 'operationRecord', 'file-clock', '操作紀錄'],
  ['domain', 'bettingRecord', 'receipt-text', '投注紀錄'],
  ['domain', 'memberTag', 'tag', '會員標籤'],
  ['domain', 'bank', 'landmark', '銀行'],
  ['domain', 'payment', 'credit-card', '第三方支付'],
  ['domain', 'gameProvider', 'gamepad-2', '遊戲商'],
  ['domain', 'calendar', 'calendar', '日期'],
  ['domain', 'trend', 'trending-up', '趨勢'],
  ['domain', 'table', 'table', '表格'],
  ['domain', 'steps', 'list-ordered', '步驟流程'],

  // --- 原型自己的側欄 ---
  ['sidebar', 'styleGuide', 'palette', '樣式規範'],
  ['sidebar', 'components', 'blocks', '組件範例'],
  ['sidebar', 'settingsPage', 'sliders-horizontal', '設定相關頁面'],
  ['sidebar', 'auditPage', 'clipboard-check', '審核操作'],
  ['sidebar', 'complexSettings', 'settings-2', '複雜設定'],
  ['sidebar', 'selection', 'toggle-right', '選擇控制'],
  ['sidebar', 'bulkActions', 'list-checks', '批量操作'],
  ['sidebar', 'formPage', 'square-pen', '表單頁'],
  ['sidebar', 'contentEditor', 'file-pen', '內容編輯'],
  ['sidebar', 'selectGuide', 'list', '下拉選單'],
  ['sidebar', 'tabsGuide', 'panel-top', '頁籤'],
  ['sidebar', 'stateGuide', 'loader-circle', '載入與空狀態'],
  ['sidebar', 'iconGuide', 'shapes', '圖示系統'],
  ['sidebar', 'settings', 'settings', '系統設定'],
  ['sidebar', 'editor', 'align-left', '編輯器'],
  ['sidebar', 'headerBar', 'panel-top-dashed', '頁首'],
  ['sidebar', 'formGuide', 'clipboard-list', '表單'],
  ['sidebar', 'searchForm', 'list-filter', '搜尋篩選列'],
  ['sidebar', 'permission', 'shield-check', '權限控制'],
  ['sidebar', 'buttonGuide', 'square-mouse-pointer', '按鈕'],
]

// --- 抽取 ---
function readLucide(file, depth = 0) {
  const source = fs.readFileSync(path.join(LUCIDE_DIR, `${file}.js`), 'utf8')
  // Lucide 的別名檔只有一行 re-export（unlock → lock-open），跟過去抓真正的那一個
  const alias = source.match(/export \{ default \} from ['"].*?\/([a-z0-9-]+)\.(?:ts|js)['"]/)
  if (alias) {
    if (depth > 3) throw new Error(`${file} 的別名鏈太深`)
    return readLucide(alias[1], depth + 1)
  }
  const match = source.match(/const __iconNode = (\[[\s\S]*?\]);/)
  if (!match) throw new Error(`Lucide 找不到 ${file} 的 __iconNode`)
  return new Function(`return ${match[1]}`)()
    .map(([tag, attrs]) => {
      const kept = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => `${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${value}"`)
        .join(' ')
      return `<${tag} ${kept}/>`
    })
    .join('')
}

const seen = new Set()
const entries = ALLOWLIST.map(([group, name, file, label]) => {
  if (seen.has(name)) throw new Error(`名稱重複：${name}`)
  seen.add(name)
  return { group, name, file, label, body: readLucide(file) }
})

// 同一個 Lucide 圖示被多個名稱共用是允許的，但要印出來讓人看見
const byFile = {}
entries.forEach(e => (byFile[e.file] = byFile[e.file] || []).push(e.name))
const shared = Object.entries(byFile).filter(([, names]) => names.length > 1)

const out = `// 由 build-icons.cjs 產生，請勿手改。來源：Lucide 1.6.0 (ISC)
//
// 這份清單就是本專案的圖示許可清單。Lucide 有 1940 個圖示，這裡只收 ${entries.length} 個；
// 要用新的先加進 build-icons.cjs 的 ALLOWLIST 再重跑，不要在頁面上自己拼 svg。
//
// 名稱沿用正式後台 SvgIcon 的 camelCase：icon('edit') ↔ <SvgIcon name="edit" />

export const GROUPS = ${JSON.stringify(
  [...new Set(entries.map(e => e.group))].map(key => ({
    key,
    label: { action: '操作', nav: '方向與導覽', status: '狀態', domain: '業務概念', sidebar: '側欄' }[key],
  })),
  null,
  2
)}

export const ICONS = ${JSON.stringify(entries, null, 2)}
`

fs.writeFileSync(path.join(__dirname, 'icons-data.js'), out)
console.log(`icons-data.js：${entries.length} 個名稱，${(out.length / 1024).toFixed(1)} KB`)
if (shared.length) {
  console.log('\n共用同一個 Lucide 圖示的名稱（刻意保留，語意不同但造形相同）：')
  shared.forEach(([file, names]) => console.log('  ' + file.padEnd(20) + names.join('、')))
}
