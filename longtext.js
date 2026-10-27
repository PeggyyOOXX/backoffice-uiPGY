// 長字串模式：網址加 `?longtext` 就把畫面上的中文換成約 2.5 倍長的字串，
// 等同於在繁中之外跑一次「最長語系」（高棉文的欄名最多到繁中的 8 倍，
// 越南文平均 1.8 倍）。沒有這個參數時這支檔案什麼都不做。
//
// 這不是 i18n，原型沒有字典也不需要有——它要回答的只有一個問題：
// 「字變長之後版面會不會爆」。真正的規範在「設計 Token → 多語系」。
//
// 做法刻意只動文字節點：不碰屬性、不碰 input 的值、不碰已經被元件接管的子樹，
// 這樣展開的結果與真實翻譯造成的壓力一致（容器要自己長高、自己換行）。
import { on } from './delegate.js'

const ENABLED = new URLSearchParams(location.search).has('longtext')

// 不要動的地方：報讀器專用文字、圖示、以及由第三方元件（Element Plus）接管的子樹。
// 動了只會製造假的破版，不是真的。
const SKIP = 'script, style, svg, .bo-message-live, [data-icon], .el-picker-panel, .el-select-dropdown'

// 中文每個字約等於兩個拉丁字母，所以補到 2.5 倍大致就是越南文到高棉文的區間。
const RATIO = 2.5
const FILLER = 'Mẫu dài kiểm tra bố cục'

const expand = text => {
  const trimmed = text.trim()
  if (!trimmed || !/[一-鿿]/.test(trimmed)) return text
  const target = Math.ceil(trimmed.length * RATIO)
  let padded = trimmed
  while (padded.length < target) padded += ' ' + FILLER.slice(0, target - padded.length)
  return text.replace(trimmed, padded)
}

function run(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node =>
      node.parentElement?.closest(SKIP) || !node.nodeValue.trim()
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  })
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) node.nodeValue = expand(node.nodeValue)
}

if (ENABLED) {
  // 換頁之後整頁重畫，所以每次點完側欄或工作區頁籤都要再跑一次。
  // 這一條不宣告 selector：它管的是「任何會重畫畫面的點擊」，不擁有任何元素。
  on('click', () => setTimeout(() => run(), 0), { owner: 'longtext' })
  document.documentElement.dataset.longtext = 'on'
  run()
  console.info('[longtext] 長字串模式已開啟：畫面文字已撐到約 2.5 倍，用來檢查換語系會不會破版。')
}
