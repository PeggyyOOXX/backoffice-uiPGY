// 搜尋篩選列：正式後台實際的五種長度。
// 每一個示範都對應一支真實的 view，欄位、型別與順序照 searchFormConfig 抄，
// 不自己編——規範頁上的「這樣會有幾排」要能拿去跟正式後台對帳。
//
// 統計（66 支用 SearchForm 的 view）：欄位數中位數 5、平均 5.1、最少 1、最多 17；
// 6 欄格線下 38 支一排、10 支兩排、7 支三排，沒有四排（按鈕自成一列，排數＝格數 ÷ 6）。
// 66 支裡只有 playerReport 一支用了 isAdvanced——正式後台幾乎都是全部攤開。
import { icon } from './icons.js'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

let uid = 0
// 欄位：['標籤', 型別, 選項或 placeholder]
// 型別 select／input／date／amount，其中 date 與 amount 佔兩格（與正式後台的 colSpan: 2 一致）
function field([label, type, extra], advanced = false) {
  const id = `sfd-${++uid}`
  const adv = advanced ? ' data-search-advanced hidden' : ''
  if (type === 'date') {
    return `<div class="filter-field filter-span-2"${adv}>
      <label id="${id}-label">${esc(label)}</label>
      <div class="date-range-host" data-date-range data-empty="true" aria-labelledby="${id}-label"></div>
    </div>`
  }
  if (type === 'amount') {
    return `<div class="filter-field filter-span-2 amount-range-field"${adv}>
      <label for="${id}">${esc(label)}</label>
      <div class="amount-range-control">
        <input id="${id}" class="control amount" placeholder="最低" aria-label="${esc(label)}最低" inputmode="decimal">
        <span>～</span>
        <input class="control amount" placeholder="最高" aria-label="${esc(label)}最高" inputmode="decimal">
      </div>
    </div>`
  }
  if (type === 'select') {
    const options = (extra || ['全部']).map(o => `<option>${esc(o)}</option>`).join('')
    return `<div class="filter-field"${adv}>
      <label for="${id}">${esc(label)}</label>
      <select id="${id}" class="control guide-select">${options}</select>
    </div>`
  }
  return `<div class="filter-field"${adv}>
    <label for="${id}">${esc(label)}</label>
    <input id="${id}" class="control" placeholder="${esc(extra || '請輸入' + label)}" maxlength="30">
  </div>`
}

// 一支示範 = 一支正式後台的 view
export const DEMOS = [
  {
    key: 'agent',
    view: 'agentManagement',
    title: '代理管理',
    fields: 5, span: 5, rows: 1,
    note: '5 個條件、佔 5 格，一排就放得下，沒有進階區。66 支裡有 35 支是這一型，是最常見的長度。',
    basic: [
      ['站台', 'select', ['101 BEST', 'DEMO03']],
      ['代理類型', 'select', ['全部類型', '總代理', '一般代理']],
      ['代理名稱', 'input', '請輸入代理名稱'],
      ['代理帳號', 'input', '請輸入代理帳號'],
      ['代理狀態', 'select', ['全部狀態', '啟用', '停用']],
    ],
  },
  {
    key: 'login',
    view: 'loginRecord',
    title: '登入紀錄',
    fields: 7, span: 8, rows: 2,
    note: '7 個條件、佔 8 格——登入時間是區間，佔兩格，所以第一排放不下，溢到第二排。12 支是這一型。',
    basic: [
      ['站台', 'select', ['101 BEST', 'DEMO03']],
      ['帳號類型', 'select', ['全部', '會員', '代理', '管理員']],
      ['UID／帳號', 'input', '請輸入 UID 或帳號'],
      ['登入 IP', 'input', '請輸入 IP'],
      ['登入來源', 'select', ['全部來源', 'Web', 'H5', 'App']],
      ['登入時間', 'date'],
      ['登入狀態', 'select', ['全部狀態', '成功', '失敗']],
    ],
  },
  {
    key: 'player',
    view: 'playerReport',
    title: '玩家報表',
    fields: 13, span: 14, rows: 3, rowsClosed: 1,
    note: '全站唯一有進階條件的一頁。基本 5 個是「誰、在哪、什麼時候」，進階 4 組是金額區間——'
      + '收起來只剩一排，展開是三排。這就是進階收合唯一成立的情境。',
    basic: [
      ['站台', 'select', ['101 BEST', 'DEMO03']],
      ['UID／帳號', 'input', '請輸入 UID 或帳號'],
      ['上層代理', 'input', '請輸入代理帳號'],
      ['會員層級', 'select', ['全部層級', 'VIP 1', 'VIP 2']],
      ['統計期間', 'date'],
    ],
    advanced: [
      ['存款金額', 'amount'],
      ['轉點金額', 'amount'],
      ['有效投注', 'amount'],
      ['總輸贏', 'amount'],
    ],
  },
  {
    key: 'member',
    view: 'membersManagement',
    title: '會員列表',
    fields: 14, span: 15, rows: 3, rowsClosed: 2,
    note: '14 個條件、佔 15 格。正式後台是全部攤開的三排；照「超過兩排才設進階區」這條門檻，金額與技術性條件（金額類型、金額區間、登入 IP、設備指紋）收進進階，剩下的 10 格剛好兩排。',
    basic: [
      ['站台', 'select', ['101 BEST', 'DEMO03']],
      ['搜尋欄位', 'select', ['會員帳號', 'UID', '手機號碼']],
      ['搜尋關鍵字', 'input', '請輸入關鍵字'],
      ['上層代理', 'input', '請輸入代理帳號'],
      ['會員狀態', 'select', ['全部狀態', '啟用', '停用']],
      ['會員層級', 'select', ['全部層級', 'VIP 1', 'VIP 2']],
      ['時間類型', 'select', ['註冊時間', '最後登入時間']],
      ['查詢期間', 'date'],
      ['會員標籤', 'select', ['全部標籤', '關注會員', '高價值']],
    ],
    advanced: [
      ['金額類型', 'select', ['存款金額', '提款金額', '投注金額']],
      ['金額區間', 'amount'],
      ['登入 IP', 'input', '請輸入 IP'],
      ['設備指紋', 'input', '請輸入設備指紋'],
    ],
  },
  {
    key: 'withdraw',
    view: 'withdrawalRecord',
    title: '提款紀錄',
    fields: 17, span: 18, rows: 3, rowsClosed: 2,
    note: '全站最長的篩選列，17 個條件、佔 18 格。基本留「找得到那一筆」的七個（站台、時間類型、期間、UID／帳號、狀態、類型、單號），其餘十格全部是找到之後才用來縮小範圍的，收進進階。',
    basic: [
      ['站台', 'select', ['101 BEST', 'DEMO03']],
      ['時間類型', 'select', ['申請時間', '完成時間']],
      ['查詢期間', 'date'],
      ['UID／帳號', 'input', '請輸入 UID 或帳號'],
      ['轉點狀態', 'select', ['全部狀態', '待審核', '已完成', '已拒絕']],
      ['轉點類型', 'select', ['全部類型', '一般', '優惠']],
      ['轉點單號', 'input', '請輸入單號'],
    ],
    advanced: [
      ['第三方平台', 'select', ['全部平台', '平台 A', '平台 B']],
      ['公司出款', 'select', ['全部', '是', '否']],
      ['出款次數', 'select', ['不限', '首次', '多次']],
      ['帳戶資訊類型', 'select', ['全部', '銀行卡', '電子錢包']],
      ['帳戶名稱', 'input', '請輸入帳戶名稱'],
      ['轉點金額', 'amount'],
      ['轉點帳號', 'input', '請輸入轉點帳號'],
      ['IP 位址', 'input', '請輸入 IP'],
      ['設備指紋', 'input', '請輸入設備指紋'],
    ],
  },
]

const toggleLabel = (open = false) =>
  `${icon(open ? 'arrowUp' : 'arrowDown', 16)}${open ? '收合進階條件' : '展開進階條件'}`

export function demoBar(demo) {
  const count = demo.fields
  return `<section class="search-demo">
    <div class="search-demo-head">
      <h4>${esc(demo.title)}<code>${esc(demo.view)}/index.vue</code></h4>
      <span class="search-demo-meta">${count} 個條件 · 佔 ${demo.span} 格 · ${demo.rows} 排${demo.advanced ? `（收合後 ${demo.rowsClosed} 排）` : ''}</span>
    </div>
    <p class="search-demo-note">${esc(demo.note)}</p>
    <form class="source-filter card example-filter" data-search-demo onsubmit="return false">
      <div class="source-filter-grid">
        ${demo.basic.map(f => field(f)).join('')}
        ${(demo.advanced ?? []).map(f => field(f, true)).join('')}
        <div class="source-filter-actions">
          <button type="button" class="semantic-btn btn-neutral">${icon('reset')}重置</button>
          <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
        </div>
      </div>
      ${demo.advanced ? `<div class="source-filter-more">
        <button type="button" class="semantic-btn btn-neutral outline" data-search-advanced-toggle aria-expanded="false">${toggleLabel()}</button>
      </div>` : ''}
    </form>
  </section>`
}

export const demoSection = () => DEMOS.map(demoBar).join('')
