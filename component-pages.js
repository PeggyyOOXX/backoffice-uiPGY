// 把既有的 guide 片段包成獨立的規範頁。
//
// 這些模組原本回傳 `<section class="component-example"><h2>…</h2><div class="card …">…</div></section>`，
// 是為了全部串在同一個「樣式規範」頁裡用的。拆成一元件一頁之後，標題要移到
// guide-section-heading，卡片要換成 section——內容本身一個字都不動，只換外層。
//
// 之所以集中在這裡而不是改進每個模組：那些模組同時還被 workflow-check.cjs 與
// 組件範例頁以片段形式使用，保留原函式才不會動到既有測試與頁面。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import './guide-page.css'
import './component-pages.css'

// 從既有片段取出 card 裡的內容。片段的形狀是固定的，取不到就讓它顯眼地壞掉，
// 而不是靜默吐出空白頁。
function bodyOf(fragment, label) {
  const match = fragment.match(/<div class="card [^"]*">([\s\S]*)<\/div><\/section>$/)
  if (!match) throw new Error(`${label}：片段形狀改了，component-pages.js 取不到內容`)
  return match[1]
}

// 文字截斷：正式後台的 TruncateTooltip.vue，14 個 view 在用。
// 它只在真的被截斷時才掛 Tooltip——沒截斷還掛提示，等於把看得到的字再說一次。
const truncateSection = () => ({
  heading: '文字截斷 TruncateTooltip',
  body: `<p class="component-description">表格的長欄位用的 pattern。正式後台有獨立的 <code>TruncateTooltip.vue</code>（14 個 view 在用）：以 <code>ResizeObserver</code> 比對 <code>scrollWidth</code> 與 <code>clientWidth</code>，<strong>只有真的被截斷時才掛 Tooltip</strong>。</p>
    <div class="guide-stage">
      <table class="tooltip-truncate-table">
        <thead><tr><th>會員編號</th><th>備註</th><th>標籤</th></tr></thead>
        <tbody>
          <tr><td>MB-009821</td><td class="is-truncate" data-tooltip="這位會員近期有大額轉點行為，已列入觀察名單，請於每日結算後確認其投注紀錄。">這位會員近期有大額轉點行為，已列入觀察名單，請於每日結算後確認其投注紀錄。</td><td class="is-truncate">高風險</td></tr>
          <tr><td>MB-009774</td><td class="is-truncate">正常</td><td class="is-truncate">一般</td></tr>
        </tbody>
      </table>
    </div>
    <div class="guide-pair">
      <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>每一格都無條件掛 Tooltip。沒被截斷的「正常」兩個字也會跳出提示，把看得到的內容再說一次，而且滑過整列時提示會一直閃。</p></div>
      <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>先量 <code>scrollWidth &gt; clientWidth</code>，被截斷才掛。欄寬會變（視窗縮放、隱藏的頁籤被打開），所以要用 <code>ResizeObserver</code> 持續量，不能只在 mounted 量一次。</p></div>
    </div>
    <p class="component-description">正式後台的註解特別提到：<strong>在隱藏的頁籤內初始 <code>clientWidth</code> 是 0</strong>，只量一次的話提示永遠不會出現——這就是要用 ResizeObserver 的原因。</p>`,
})

window.renderTooltipPage = () => guidePage({
  slug: 'tooltip',
  title: '提示氣泡 Tooltip',
  intro: 'Tooltip 只放補充說明，不得承載必要資訊——它在觸控裝置上不一定出得來，也無法被複製。停用的按鈕不觸發滑鼠事件，提示必須掛在外層容器。',
  sections: [
    { heading: '方向與行為', body: bodyOf(window.tooltipGuide(), 'tooltipGuide') },
    truncateSection(),
  ],
  ...tooltipSpec,
})

const tooltipSpec =
  {
    "tokens": [
      [
        "底色",
        "#17233B"
      ],
      [
        "文字",
        "12px / #fff"
      ],
      [
        "內距",
        "6px 10px"
      ],
      [
        "圓角",
        "4px"
      ],
      [
        "最大寬度",
        "240px"
      ],
      [
        "與目標間距",
        "8px"
      ],
      [
        "方向",
        "top（預設），空間不足自動翻面"
      ],
      [
        "觸發",
        "hover 與 focus"
      ],
      [
        "關閉",
        "Esc、移開、失焦"
      ],
      [
        "無障礙",
        "aria-describedby 指向提示"
      ]
    ],
    "rules": [
      [
        "只放補充說明",
        "不得承載必要資訊——觸控裝置上不一定出得來，也無法被複製。"
      ],
      [
        "停用元素掛在外層",
        "停用的按鈕不觸發滑鼠事件，data-tooltip 要放在外層容器上。"
      ],
      [
        "鍵盤也要出得來",
        "focus 與 hover 都要觸發，否則鍵盤使用者永遠看不到。"
      ],
      [
        "Esc 要能關閉",
        "關閉時一併移除 aria-describedby。"
      ],
      [
        "不要放操作",
        "Tooltip 內不可放按鈕或連結，滑過去的路徑上它就消失了。"
      ],
      [
        "文字要短",
        "超過兩行代表它該是說明文字或抽屜，不是 Tooltip。"
      ]
    ]
  }

window.renderOverlayPage = () => guidePage({
  slug: 'overlay',
  title: '彈窗與抽屜 Dialog / Drawer',
  intro: '兩種都會蓋在內容之上，但用途不同：<strong>需要做決定才能繼續用彈窗，單純看資料用抽屜</strong>。唯讀的詳情不要因為欄位多就改成寬版彈窗。',
  sections: [
    {
      heading: '先決定用哪一種',
      body: decisionTable([
        ['要輸入或做決定才能繼續', '<strong>置中彈窗</strong>', 'footer 是取消＋主要操作，使用者必須選一個'],
        ['唯讀查看單筆資料與紀錄', '<strong>右側抽屜</strong>', '保留列表位置，底部只有「關閉」'],
        ['刪除、停用等不可逆操作', '<strong>置中彈窗</strong>', '要擋在流程中間，不能讓人滑過去'],
        ['只是回報結果', '訊息提示 Toast', '彈窗需要按確認，回報不該佔用一次點擊'],
        ['內容放不進抽屜寬度', '卡片或兩欄定義列表', '不要在抽屜裡塞需要橫向捲動的寬表格'],
      ]),
    },
    { heading: '彈窗', body: bodyOf(window.modalExamples(), 'modalExamples') },
    { heading: '右側抽屜', body: bodyOf(window.drawerExamples?.() ?? '<div class="card x"><p>抽屜示範在「組件範例」頁。</p></div>', 'drawerExamples') },
  ],
  tokens: [
    ['彈窗寬度', '固定規格，小螢幕縮至視窗內'],
    ['彈窗高度', '內容自動，超過視窗才捲動'],
    ['標題', '左側綠線 ＋ 右上角 X'],
    ['footer 對齊', '靠右，取消在前、主要操作在後'],
    ['抽屜位置', '右側滑出'],
    ['抽屜 footer', '只有「關閉」'],
    ['圓角', '與全站按鈕同為 4px'],
    ['內容捲動', '獨立捲動，footer 固定'],
    ['層級', '原生 dialog（top layer）'],
    ['關閉方式', 'X、Esc、取消鈕'],
  ],
  rules: [
    ['唯讀用抽屜不用彈窗', '欄位多不是改用寬版彈窗的理由；放不下就改成卡片或兩欄定義列表。'],
    ['彈窗一定要有兩個出口', '取消與主要操作；只有一顆按鈕的彈窗代表它應該是 Toast。'],
    ['不可用 inset:0 拉滿視窗', '只設最大高度，內容超過視窗時才捲動，不保留空白高度。'],
    ['關閉後焦點要回去', '回到觸發它的那顆按鈕上，否則鍵盤使用者會迷失位置。'],
    ['抽屜不放寬表格', '需要橫向捲動就代表選錯容器了。'],
    ['彈窗內表單沿用共用樣式', 'guide-input、guide-select 與 semantic-btn，不得另訂局部配色。'],
  ],
})
