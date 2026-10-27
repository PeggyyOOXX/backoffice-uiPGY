// 移植：Element Plus 沒有拖曳排序；正式後台只有 sortSetting/index.vue 在用，移植時用 vue-draggable-plus。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 「拖曳排序 Sortable」規範頁。行為與回饋都在共用的 sortable.js／sortable.css，
// 這一頁只示範：上面一張可以真的拖，下面一張把拖到一半的畫面凍結起來給人看清楚。
// 組合範例－混合的「優惠活動」用的是同一支模組。
import { guidePage } from './guide-page.js'
import { dataTable } from './data-table.js'
import { iconButton } from './icon-button.js'
import { icon } from './icons.js'
import { onMatch } from './delegate.js'
import { sortable, reorder } from './sortable.js'
import './guide-page.css'
import './sortable-guide.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 照 sortSetting 的用途：前台遊戲分類的顯示順序
const DEFAULT = [
  { id: 'hot', name: '熱門遊戲', count: 48 },
  { id: 'live', name: '真人視訊', count: 12 },
  { id: 'slot', name: '電子遊戲', count: 236 },
  { id: 'sport', name: '體育賽事', count: 9 },
  { id: 'lottery', name: '彩票', count: 21 },
]
let items = DEFAULT.map(item => ({ ...item }))

const COLUMNS = [
  { key: 'drag', label: '排序', width: '64px' },
  { key: 'order', label: '順位', width: '64px' },
  { key: 'name', label: '分類名稱', align: 'left' },
  { key: 'count', label: '遊戲數', width: '96px' },
]

const handle = (item, attrs = '') => iconButton({
  icon: icon('drag', 16),
  label: `拖曳排序：${item.name}；也可按上下方向鍵`,
  kind: 'btn-neutral',
  outline: true,
  attrs: `data-sort-handle ${attrs}`,
})

const liveTable = () => dataTable({
  name: 'sortable-demo',
  columns: COLUMNS,
  pagination: false,
  rows: items.map((item, index) => ({
    rowAttrs: `data-sort-group="sortable-demo" data-sort-item="${item.id}" data-sort-label="${esc(item.name)}"`,
    drag: handle(item),
    order: index + 1,
    name: esc(item.name),
    count: item.count,
  })),
})

// 凍結的畫面：第 2 列正被拿起來，游標停在第 4 列上半部，所以插入線畫在第 4 列的上緣
const frozenTable = () => dataTable({
  name: 'sortable-frozen',
  columns: COLUMNS,
  pagination: false,
  rows: DEFAULT.map((item, index) => ({
    rowAttrs: `data-sort-item="${item.id}" class="${index === 1 ? 'is-sort-source' : index === 3 ? 'is-drop-before' : ''}" aria-hidden="true"`,
    drag: handle(item, 'tabindex="-1"'),
    order: index + 1,
    name: esc(item.name),
    count: item.count,
  })),
})

const redraw = () => {
  const host = document.querySelector('[data-sortable-demo]')
  if (host) host.innerHTML = liveTable()
}

sortable('sortable-demo', {
  onReorder(fromId, toId, place) {
    items = reorder(items, items.map(item => item.id), fromId, toId, place)
    redraw()
  },
})

onMatch('click', '[data-sortable-reset]', () => {
  items = DEFAULT.map(item => ({ ...item }))
  redraw()
}, { owner: 'sortable-guide' })

window.renderSortablePage = () => guidePage({
  slug: 'sortable',
  title: '拖曳排序 Sortable',
  intro: '調整一份清單的先後順序：前台的遊戲分類、優惠活動的顯示順序。拖曳時要一眼看得出三件事——拿起的是哪一列、會放到哪裡、放完落在哪裡。行為與回饋都在 <code>sortable.js</code>，頁面只標記列與把手、在 <code>onReorder</code> 裡改資料。',
  sections: [
    {
      heading: '互動範例',
      body: `<p class="component-description">按住左側把手拖到別列上：游標在目標列<strong>上半部</strong>就插在它前面，<strong>下半部</strong>就插在它後面。把手聚焦後也可以按上下方向鍵，一次移一格。</p>
        <div class="sortable-demo-bar">
          <button type="button" class="semantic-btn btn-neutral" data-sortable-reset>${icon('reset')}重設順序</button>
        </div>
        <div data-sortable-demo>${liveTable()}</div>`,
    },
    {
      heading: '拖曳時看得到什麼',
      body: `<p class="component-description">下面是拖到一半的畫面：第 2 列「真人視訊」正被拿起來，游標停在第 4 列的上半部。</p>
        ${frozenTable()}
        <ol class="sortable-feedback">
          <li><strong>拿起的那一列</strong>：留在原位、變淡（不透明度 45%），左緣一條主題色。它<strong>不從清單裡消失</strong>——消失的話下面的列會往上補，插入線的位置會在拖的途中一直跑。</li>
          <li><strong>插入線</strong>：目標列上緣或下緣一條 2px 主題色的線，左端帶 8px 圓點，整列寬度都畫到（包含固定在右側的操作欄）。線畫在儲存格裡面，不改列高，畫面不會在拖的途中上下跳。<strong>放了不會動的位置不畫線</strong>：自己、自己上一列的下緣、下一列的上緣。</li>
          <li><strong>放下之後</strong>：移過去的那一列底色亮一下（主題色淺底），1.2 秒內淡掉，看得出它落在哪。系統設定為減少動態時改成直接顯示淺底、不做淡出。</li>
        </ol>`,
    },
    {
      heading: '進入與退出排序',
      body: `<p class="component-description">清單平常不顯示把手。按列表工具列的「排序」才進入排序模式，<strong>持續顯示把手</strong>，不設收合按鈕；切換開關、分類與狀態頁籤都不會退出排序，<strong>只有儲存或取消變更才退出</strong>。排序只改草稿，要按「儲存設定」才套用，離開前有未儲存的順序要先確認。</p>
        <p class="component-description">動線示範在「組合範例－混合」的「優惠活動」頁籤。</p>`,
    },
    {
      heading: '篩選中排序',
      body: `<p class="component-description">清單被篩選時（例如只看「進行中」），排序<strong>只調整看得到的項目之間的相對次序</strong>，被篩掉的項目留在原本的位置。共用的 <code>reorder(list, visibleIds, fromId, toId, place)</code> 已經處理這件事，頁面不要自己寫一份。</p>`,
    },
    {
      heading: '鍵盤與報讀器',
      body: `<p class="component-description">拖曳是指標裝置才有的操作，所以把手必須是可聚焦的按鈕（圖示按鈕，帶 <code>aria-label</code> 與同文字的 Tooltip），聚焦後按上下方向鍵一次移一格，移完焦點留在同一顆把手上，可以連按。每移一次用 <code>aria-live</code> 唸出「已移到第 N 位，共 M 項」，看不到畫面的人也知道結果。</p>`,
    },
    {
      heading: '手機與觸控',
      body: `<p class="component-description">手機上的操作和桌機一樣：<strong>手指按住左側把手、直接往上或往下拖</strong>，放開就放下。不需要長按，也不用先切換什麼模式。</p>
        <ol class="sortable-feedback">
          <li><strong>只有把手會拖</strong>：把手設了 <code>touch-action: none</code>，按住它時頁面不會跟著捲；按在列的其他地方仍然是正常捲動，不會一滑就把列拖走。</li>
          <li><strong>跟著手指走的小卡</strong>：手指會蓋住正在拖的那一列，所以另外有一張寫著名稱的小卡跟著手指，偏右下、不擋住插入線。</li>
          <li><strong>拖到畫面上下緣會自動捲動</strong>：手機一個畫面只放得下幾列，拖到上緣或下緣附近清單會自己捲，越靠邊捲得越快。上緣的感應區比較大，因為上方疊著頁首、工作區頁籤與搜尋條件開關。</li>
        </ol>
        <p class="component-description">做法是 Pointer Events，滑鼠、手指、觸控筆走同一套邏輯；不用瀏覽器原生的 HTML5 拖曳，因為它只認滑鼠，手機上按住把手完全不會觸發。正式後台移植時用 <code>vue-draggable-plus</code>（同樣支援觸控），三種回饋沿用這一頁的 class。</p>`,
    },
  ],
  tokens: [
    ['模組', 'sortable.js／sortable.css'],
    ['把手', '圖示按鈕 32 × 32px，btn-neutral outline，圖示 drag 16px'],
    ['排序欄寬', '64px，放在第一欄'],
    ['開始拖曳', '只從把手按下，移動超過 4px 才開始（單純點一下不會進入拖曳）'],
    ['輸入方式', 'Pointer Events：滑鼠、手指、觸控筆同一套'],
    ['跟隨小卡', '寫著名稱，偏游標右下 12px，主題色描邊'],
    ['自動捲動', '拖到可視範圍上下緣時捲動，越靠邊越快'],
    ['來源列', '原位保留，不透明度 45%，左緣 2px 主題色'],
    ['插入線', '2px 主題色，畫在目標列上緣或下緣，整列寬'],
    ['插入線端點', '8px 圓點，主題色'],
    ['放下後', '主題色淺底，1.2 秒淡出'],
    ['鍵盤', '上下方向鍵一次移一格，焦點留在把手'],
    ['報讀器', 'aria-live 唸出「已移到第 N 位，共 M 項」'],
  ],
  rules: [
    ['只從把手開始拖', '整列都能拖的話，使用者想選取文字或點列上的連結時會不小心把列拖走。'],
    ['插入線畫在縫上，不畫在列上', '要表達的是「放在這兩列之間」，整列變色會被看成「跟這一列交換」。'],
    ['拿起的列不消失', '留在原位變淡，下面的列才不會往上補，插入線的位置在拖的途中保持穩定。'],
    ['手機一樣能拖', '用 Pointer Events，不用只認滑鼠的 HTML5 拖曳；把手 touch-action: none，其他地方照常捲動。'],
    ['放了不會動的位置不畫線', '畫了線卻沒有變化，使用者會以為拖曳失敗。'],
    ['放下後讓那一列亮一下', '長清單放完之後要找得到剛剛那一列落在哪。'],
    ['鍵盤一定要能排序', '把手是可聚焦的按鈕，上下方向鍵一次一格，結果用 aria-live 唸出來。'],
    ['排序只改草稿', '按儲存才套用；儲存或取消才退出排序模式，切換頁籤與篩選不退出。'],
    ['篩選中只動看得到的', '被篩掉的項目留在原位，用共用的 reorder()，不在頁面自己寫一份。'],
    ['行為與樣式只有一份', '頁面只標記 data-sort-group／data-sort-item／data-sort-handle 並註冊 sortable()，不得自己處理 dragstart／drop 或另畫回饋樣式。'],
  ],
})
