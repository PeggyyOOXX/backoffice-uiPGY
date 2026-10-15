/**
 * Element Plus 內建圖示的攔截層。**這是給正式後台用的範本，原型不載入它。**
 *
 * 問題：element-plus 的元件內部直接 `import { ArrowDown } from '@element-plus/icons-vue'`，
 * 不經過 SvgIcon。所以把自己的圖示換成 Lucide 之後，下拉箭頭、表格排序、分頁、Toast
 * 仍然是 EP 的實心圖示——線條與實心並存，比不換還不統一。
 *
 * 這些元件多半沒有可覆寫的 prop：
 *   有 prop：el-select / el-input / el-date-picker / el-pagination / el-dialog / el-switch
 *   沒有  ：el-table / el-upload / el-tag / el-alert / el-collapse / ElMessage
 * 所以不逐個傳 prop，改成在打包階段把整個套件換掉。
 *
 * 安裝（正式後台）：
 *   1. npm i lucide-vue-next
 *   2. 把這個檔案放到 src/icons/ep-shim.ts
 *   3. vite.config.ts 的 resolve.alias 加一行：
 *        '@element-plus/icons-vue': path.resolve(__dirname, 'src/icons/ep-shim.ts')
 *
 * 維護：
 *   下方清單對應 **Element Plus 2.10.4**（原型驗證時用 2.14.5，兩者相同）。
 *   EP 升版後若元件改用別的圖示，這裡會少匯出一個名稱而在建置時報錯——那是刻意的，
 *   報錯比靜默畫不出圖示好查。重新核對的指令：
 *     grep -rho "import {[^}]*} from '@element-plus/icons-vue'" node_modules/element-plus/es/components
 *
 * 已知相依：
 *   EP 的 `.el-icon svg { width:1em; height:1em }` 會接手尺寸，所以這裡不設 width/height。
 *   `.el-icon { fill: currentColor }` 不會污染 Lucide，因為 lucide-vue-next 會在 <svg> 上
 *   直接寫 fill="none"，presentation attribute 勝過從父層繼承來的值。
 */
import { h, type Component, type FunctionalComponent } from 'vue'
import {
  Check as LuCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck as LuCircleCheck,
  CircleX,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Info,
  LoaderCircle,
  TriangleAlert,
  Trash2,
  X,
  ZoomIn as LuZoomIn,
} from 'lucide-vue-next'

/**
 * Lucide 的 stroke-width 2 是為 24px 畫的。EP 的圖示多半渲染在 14–16px，
 * 直接用 2 會細到糊掉，所以統一補到 2.5——與原型 icons.js 的 16px 檔一致。
 * 數值依據見 ICON-SYSTEM.md 第十節第 2 點。
 */
const STROKE_WIDTH = 2.5

const wrap = (icon: Component, name: string): FunctionalComponent => {
  const component: FunctionalComponent = (_props, { attrs }) =>
    h(icon, { 'stroke-width': STROKE_WIDTH, ...attrs })
  component.displayName = name
  return component
}

// --- 以下 22 個名稱是 element-plus 元件內部真正會 import 的，一個都不能少 ---

// el-select 的下拉箭頭、el-table 的展開與排序、el-collapse、el-tree
export const ArrowDown = wrap(ChevronDown, 'ArrowDown')
export const ArrowUp = wrap(ChevronUp, 'ArrowUp')
export const ArrowLeft = wrap(ChevronLeft, 'ArrowLeft')
export const ArrowRight = wrap(ChevronRight, 'ArrowRight')
export const CaretRight = wrap(ChevronRight, 'CaretRight')

// el-pagination 的跳頁
export const DArrowLeft = wrap(ChevronsLeft, 'DArrowLeft')
export const DArrowRight = wrap(ChevronsRight, 'DArrowRight')
export const MoreFilled = wrap(Ellipsis, 'MoreFilled')

// el-input / el-select 的清除、el-tag 與 el-dialog 的關閉
export const CircleClose = wrap(CircleX, 'CircleClose')
export const Close = wrap(X, 'Close')

// el-input 的密碼顯示切換
export const View = wrap(Eye, 'View')
export const Hide = wrap(EyeOff, 'Hide')

// el-upload
export const Check = wrap(LuCheck, 'Check')
export const CircleCheck = wrap(LuCircleCheck, 'CircleCheck')
export const Delete = wrap(Trash2, 'Delete')
export const Document = wrap(FileText, 'Document')
export const ZoomIn = wrap(LuZoomIn, 'ZoomIn')

// el-switch / el-table / el-message-box / el-tree 的載入態
export const Loading = wrap(LoaderCircle, 'Loading')

// ElMessage、ElMessageBox、el-alert 的四種型別圖示（utils/vue/icon.mjs 的 TypeComponents）
export const SuccessFilled = wrap(LuCircleCheck, 'SuccessFilled')
export const WarningFilled = wrap(TriangleAlert, 'WarningFilled')
export const InfoFilled = wrap(Info, 'InfoFilled')
export const CircleCloseFilled = wrap(CircleX, 'CircleCloseFilled')
