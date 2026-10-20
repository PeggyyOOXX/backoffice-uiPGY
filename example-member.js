// 組合範例（搜尋結果型）：照正式後台「會員列表」（membersManagement/index.vue）做。
//
// 這一頁本來寫在 index.html 的 inline script 裡（資料、表格、分頁、抽屜混在一起，
// 操作用 onclick 直接掛），而它同時是整站表格與抽屜規範的基準頁——規範的參照物
// 自己沒有照規範寫。改寫後：表格與分頁用共用元件、操作走事件委派、抽屜沿用共用那一座。
//
// 它與「列表型」範例（禮物卡）的差別：欄位多到要橫向捲動且操作欄固定、列上有狀態下拉、
// 工具列有七顆按鈕且手機要收起來。
import { dataTable, dataCards, applyPaging, keepTableScroll, PAGE_SIZES } from './data-table.js'
import { iconButton } from './icon-button.js'
import { requestExport } from './download-center.js'
import { message } from './message.js'
import { icon } from './icons.js'
import { filterToggle } from './filter-toggle.js'
import { onMatch } from './delegate.js'
import { prepareModal } from './modal-system.js'
import './example-page.css'
import './example-member.css'
// 編輯是獨立的表單頁，外殼（返回列、麵包屑、表單卡片、存檔列）與「表單頁型」範例
// 的新增共用同一份；分區卡片沿用設定型的 .example-settings-card。
import './example-form.css'
import './example-settings.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// [uid, 帳號, 上層代理, 姓名, 標籤色, 註冊時間, 註冊 IP, 最後登入 IP, 總餘額, 總存款, 總提款, 最後登入, 狀態]
const MEMBERS = [
  ['1009821', 'ava_chen', 'agent_10188', 'Ava Chen', ['#3d6df2', '#22a06b'], '2026-09-15 09:18:22', '118.163.21.45', '118.163.21.45', '128,420.00', '386,000.00', '214,500.00', '2026-09-15 14:28:06', '啟用'],
  ['1009774', 'david_lin', 'agent_20861', 'David Lin', ['#d6a13a'], '2026-09-14 18:42:10', '61.220.72.18', '220.130.16.92', '86,132.50', '245,000.00', '198,200.00', '2026-09-15 13:52:41', '啟用'],
  ['1009652', 'mina_wu', 'agent_10188', 'Mina Wu', ['#8d63cc', '#22a06b'], '2026-09-13 11:06:55', '36.225.14.71', '36.225.14.71', '42,876.00', '132,600.00', '96,300.00', '2026-09-15 12:17:30', '啟用'],
  ['1009541', 'lucas_h', '-', 'Lucas Huang', [], '2026-09-12 16:30:04', '114.32.91.62', '114.32.91.62', '18,220.40', '50,000.00', '24,800.00', '2026-09-14 23:42:18', '停用'],
  ['1009328', 'emma_tsai', 'agent_36220', 'Emma Tsai', ['#3d6df2'], '2026-09-10 08:22:49', '211.72.31.16', '211.72.31.16', '226,840.00', '682,000.00', '405,600.00', '2026-09-14 19:18:52', '啟用'],
  ['1009214', 'noah_wang', 'agent_20861', 'Noah Wang', ['#d6a13a'], '2026-09-09 15:41:28', '203.69.82.17', '203.69.82.21', '64,991.20', '188,400.00', '126,900.00', '2026-09-14 17:06:35', '啟用'],
  ['1009176', 'sophia_lee', 'agent_10188', 'Sophia Lee', ['#22a06b'], '2026-09-08 10:12:44', '60.251.33.74', '60.251.33.74', '93,570.00', '294,000.00', '175,200.00', '2026-09-14 15:32:19', '啟用'],
  ['1009088', 'ethan_kuo', 'agent_45102', 'Ethan Kuo', ['#8d63cc'], '2026-09-07 21:05:13', '101.12.27.91', '101.12.27.91', '31,205.80', '96,000.00', '72,500.00', '2026-09-13 22:48:07', '凍結'],
  ['1008963', 'olivia_hsu', 'agent_36220', 'Olivia Hsu', ['#3d6df2', '#d6a13a'], '2026-09-06 13:47:36', '61.216.45.103', '61.216.45.108', '175,430.00', '520,000.00', '318,700.00', '2026-09-13 18:21:42', '啟用'],
  ['1008841', 'liam_chang', '-', 'Liam Chang', [], '2026-09-05 09:33:51', '111.250.16.44', '111.250.16.44', '9,860.50', '32,000.00', '21,600.00', '2026-09-12 20:15:30', '凍結'],
  ['1008725', 'isla_chen', 'agent_45102', 'Isla Chen', ['#22a06b', '#8d63cc'], '2026-09-04 17:26:08', '210.61.148.29', '210.61.148.29', '58,790.00', '164,800.00', '102,400.00', '2026-09-12 16:44:11', '啟用'],
  ['1008619', 'mason_lai', 'agent_20861', 'Mason Lai', ['#d6a13a'], '2026-09-03 12:18:47', '114.136.92.57', '114.136.92.60', '27,340.75', '88,500.00', '55,900.00', '2026-09-11 23:09:54', '停用'],
  ['1008502', 'mia_lin', 'agent_10188', 'Mia Lin', ['#3d6df2'], '2026-09-02 08:54:20', '122.116.73.12', '122.116.73.12', '142,680.00', '436,000.00', '278,300.00', '2026-09-11 19:37:26', '啟用'],
].map(([uid, account, agent, name, tags, register, regIp, loginIp, balance, deposit, withdraw, last, status]) =>
  ({ uid, account, agent, name, tags, register, regIp, loginIp, balance, deposit, withdraw, last, status }))

const COLUMNS = [
  { key: 'uid', label: 'UID', align: 'left', width: '110px' },
  { key: 'account', label: '帳號', align: 'left', width: '140px' },
  { key: 'agent', label: '上層代理', align: 'left', width: '140px' },
  { key: 'name', label: '姓名', align: 'left', width: '130px' },
  { key: 'tags', label: '會員標籤', width: '110px' },
  { key: 'register', label: '註冊時間', width: '170px' },
  { key: 'ip', label: '註冊／最後登入 IP', align: 'left', width: '160px' },
  { key: 'balance', label: '總餘額', align: 'right', width: '130px' },
  { key: 'deposit', label: '總存款', align: 'right', width: '130px' },
  { key: 'withdraw', label: '總提款', align: 'right', width: '130px' },
  { key: 'last', label: '最後登入', width: '170px' },
  { key: 'status', label: '狀態', width: '120px' },
  { key: 'actions', label: '操作', width: '120px', sticky: 'right' },
]

// 會員狀態有三種，列上的下拉與篩選列的下拉吃同一份清單，不各寫一次。
const STATUSES = ['啟用', '停用', '凍結']

// 標籤在列表上是色點，在表單裡要可讀可選，所以兩邊用同一張對照表換算。
const TAG_OPTIONS = [['高價值', '#3d6df2'], ['活躍', '#22a06b'], ['觀察中', '#d6a13a'], ['VIP 專案', '#8d63cc']]
const TAG_NAME = new Map(TAG_OPTIONS.map(([name, color]) => [color, name]))
const TAG_COLOR = new Map(TAG_OPTIONS.map(([name, color]) => [name, color]))

// view：list ／ edit。正式後台是兩個 route，原型用同一頁切換，動線一樣。
const STATE = { page: 1, pageSize: PAGE_SIZES[0], keyword: '', status: 'all', view: 'list', editing: null }

let draft = {}
let clean = '{}'
let errors = {}
const dirty = () => JSON.stringify(draft) !== clean

const visible = () => MEMBERS.filter(u => {
  const k = STATE.keyword.trim().toLowerCase()
  if (k && !u.account.toLowerCase().includes(k) && !u.uid.includes(k) && !u.name.toLowerCase().includes(k)) return false
  if (STATE.status !== 'all' && u.status !== STATE.status) return false
  return true
})

const statusSelect = u => `<select class="guide-select status-control" data-member-status="${esc(u.uid)}" aria-label="${esc(u.account)} 的狀態">
  ${STATUSES.map(value => `<option ${u.status === value ? 'selected' : ''}>${value}</option>`).join('')}
</select>`

const rowActions = u => `<div class="icon-action-group example-member-actions">
  ${iconButton({ icon: icon('edit', 16), label: `編輯 ${u.account}`, kind: 'btn-edit', attrs: `data-member-edit="${esc(u.uid)}"` })}
  ${iconButton({ icon: icon('loginRecord', 16), label: `${u.account} 的登入紀錄`, kind: 'btn-record', attrs: `data-member-records="${esc(u.uid)}"` })}
</div>`

const dots = u => u.tags.length
  ? `<div class="tag-dots">${u.tags.map(color => `<i style="background:${esc(color)}"></i>`).join('')}</div>`
  : '—'

const table = () => {
  const list = visible()
  const start = (STATE.page - 1) * STATE.pageSize
  return dataTable({
    name: 'member',
    columns: COLUMNS,
    caption: '會員列表',
    scroll: '1760px',
    page: STATE.page,
    pageSize: STATE.pageSize,
    total: list.length,
    rows: list.slice(start, start + STATE.pageSize).map(u => ({
      rowAttrs: `data-member-row="${esc(u.uid)}"`,
      uid: esc(u.uid),
      account: `<button type="button" class="example-member-link" data-member-summary="${esc(u.uid)}" aria-haspopup="dialog">${esc(u.account)}</button>`,
      agent: esc(u.agent),
      name: esc(u.name),
      tags: dots(u),
      register: `<span class="example-nowrap">${esc(u.register)}</span>`,
      ip: `<span class="example-nowrap">${esc(u.regIp)}</span><br><span class="example-nowrap">${esc(u.loginIp)}</span>`,
      balance: `<span class="example-amount">${esc(u.balance)}</span>`,
      deposit: `<span class="example-amount">${esc(u.deposit)}</span>`,
      withdraw: `<span class="example-amount">${esc(u.withdraw)}</span>`,
      last: `<span class="example-nowrap">${esc(u.last)}</span>`,
      status: statusSelect(u),
      actions: rowActions(u),
    })),
  })
}

// 手機用卡片、桌機用表格：同一份資料的兩種排法，不是兩套功能。
const cards = () => {
  const list = visible()
  const start = (STATE.page - 1) * STATE.pageSize
  return `<div class="member-mobile-only example-member-cards">${dataCards({
    name: 'member',
    rows: list.slice(start, start + STATE.pageSize).map(u => ({
      attrs: `data-member-card="${esc(u.uid)}"`,
      title: `<button type="button" class="example-member-link" data-member-summary="${esc(u.uid)}">${esc(u.account)}</button>`,
      status: statusSelect(u),
      // 手機看得到的欄位與桌機表格一樣，順序也一樣，不因為版面窄就省略——
      // 少掉的欄位在手機上就等於查不到，而這一頁的 13 欄都是要拿來比對的資料。
      // UID 也排在這裡（而不是當帳號底下的副標）：它跟其他欄位一樣是「欄名在上、
      // 值在下」的一格，顏色與字級才會和同一張卡片裡的其他資料一致。
      // 標籤與金額同理，都是資料不是操作，底下那一列只留操作按鈕。
      meta: [
        ['UID', esc(u.uid)],
        ['上層代理', esc(u.agent)],
        ['姓名', esc(u.name)],
        ['會員標籤', dots(u)],
        ['註冊時間', esc(u.register)],
        ['註冊／最後登入 IP', `${esc(u.regIp)}<br>${esc(u.loginIp)}`],
        ['總餘額', esc(u.balance)],
        ['總存款', esc(u.deposit)],
        ['總提款', esc(u.withdraw)],
        ['最後登入', esc(u.last)],
      ],
      actions: rowActions(u),
    })),
  })}</div>`
}

// --- 編輯會員：獨立表單頁 ---
//
// 為什麼是獨立頁而不是彈窗或抽屜：正式後台有 8 個功能的新增與編輯都是獨立路由頁，
// 而且會員資料欄位多到要分區——塞進彈窗就變成「彈窗裡捲動、外面頁面也在捲」。
// 抽屜更不適合：抽屜在本站是唯讀資訊的容器（底部只有「關閉」），一放進要做決定的
// 表單，使用者看到從右邊滑出來仍然預期「看完關掉」，不會預期裡面有沒存的東西。
//
// 出口有兩個，各自回答不同的問題：左上的「返回列表」是導覽（我要離開這件事），
// 底部存檔列的「取消／儲存」是任務（我要結束這件事）。不放右上角的 X——X 的意思是
// 「關掉蓋在上面的東西」，那是彈窗與抽屜的語彙，獨立頁底下沒有東西可以露出來。
const editField = (key, label, control, { required = false, hint = '' } = {}) => `<div class="guide-field">
  <label for="member-edit-${key}">${label}${required ? '<span class="required-mark" aria-hidden="true"> *</span>' : ''}</label>
  ${control}
  ${hint ? `<small>${hint}</small>` : ''}
  <small class="error-text" id="member-edit-${key}-error">${esc(errors[key] ?? '')}</small>
</div>`

const editText = (key, extra = '') => `<input id="member-edit-${key}" class="guide-input${errors[key] ? ' is-error' : ''}" value="${esc(draft[key])}" data-member-field="${key}"${errors[key] ? ` aria-invalid="true" aria-describedby="member-edit-${key}-error"` : ''} ${extra}>`

// 唯讀欄位用純文字呈現，不做成停用的輸入框——停用的輸入框看起來還是可以點，
// 使用者會先試著打字才發現不能改。
const editReadonly = (label, value) => `<div class="guide-field">
  <span class="example-readonly-label">${label}</span>
  <p class="example-readonly-value">${value}</p>
</div>`

const editView = () => {
  const u = MEMBERS.find(item => item.uid === STATE.editing)
  if (!u) return ''
  return `
  <div class="example-form-bar">
    <button type="button" class="semantic-btn btn-neutral" data-member-back>${icon('arrowLeft')}返回列表</button>
    <span class="example-form-crumb">會員列表 ／ <strong>編輯 ${esc(u.account)}</strong></span>
  </div>
  <form class="example-form" data-member-edit-form novalidate>
    <section class="card example-settings-card">
      <h3 class="example-settings-heading">會員識別</h3>
      <p class="example-settings-hint">這一區不可修改，建立後就固定了。</p>
      <div class="guide-fields">
        ${editReadonly('UID', esc(u.uid))}
        ${editReadonly('帳號', esc(u.account))}
        ${editReadonly('註冊時間', esc(u.register))}
      </div>
    </section>

    <section class="card example-settings-card">
      <h3 class="example-settings-heading">基本資料</h3>
      <div class="guide-fields">
        ${editField('name', '姓名', editText('name', 'maxlength="30"'), { required: true })}
        ${editField('agent', '上層代理', editText('agent', 'maxlength="30"'), { hint: '留空或填 - 代表直屬總公司' })}
        ${editField('status', '狀態', `<select id="member-edit-status" class="guide-select" data-member-field="status">
          ${STATUSES.map(v => `<option ${draft.status === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
        </select>`)}
        ${editField('tags', '會員標籤', `<select id="member-edit-tags" class="guide-select" multiple data-collapse="2" data-clearable data-member-field="tags">
          ${TAG_OPTIONS.map(([name]) => `<option ${draft.tags.includes(name) ? 'selected' : ''}>${esc(name)}</option>`).join('')}
        </select>`)}
      </div>
    </section>

    <section class="card example-settings-card">
      <h3 class="example-settings-heading">備註</h3>
      <div class="guide-field">
        <label for="member-edit-note">備註</label>
        <textarea id="member-edit-note" class="guide-input guide-textarea" maxlength="500" data-member-field="note">${esc(draft.note)}</textarea>
      </div>
    </section>

    <footer class="example-savebar example-form-savebar">
      <div class="example-save-status" role="status">${dirty() ? '有尚未儲存的變更' : '目前沒有未儲存的變更'}</div>
      <div class="example-save-actions">
        <button type="button" class="semantic-btn btn-neutral" data-member-back>取消</button>
        <button type="submit" class="semantic-btn btn-search">儲存變更</button>
      </div>
    </footer>
  </form>`
}

const filters = () => `${filterToggle('member-search-panel')}
  <form id="member-search-panel" class="source-filter card example-filter" data-member-filter>
    <div class="source-filter-grid">
      <div class="filter-field">
        <label for="member-platform">平台名稱</label>
        <select id="member-platform" class="control guide-select"><option>101 BEST</option><option>DEMO03</option></select>
      </div>
      <div class="filter-field">
        <label for="member-search-type">會員搜尋</label>
        <select id="member-search-type" class="control guide-select"><option>會員帳號</option><option>UID</option><option>手機號碼</option></select>
      </div>
      <div class="filter-field">
        <label for="member-keyword">會員搜尋關鍵字</label>
        <input id="member-keyword" class="control" name="keyword" value="${esc(STATE.keyword)}" placeholder="請輸入關鍵字" maxlength="40">
      </div>
      <div class="filter-field">
        <label for="member-agent">代理帳號</label>
        <input id="member-agent" class="control" placeholder="請輸入代理帳號" maxlength="20">
      </div>
      <div class="filter-field">
        <label for="member-status">會員狀態</label>
        <select id="member-status" class="control guide-select" name="status">
          <option value="all">全部狀態</option>
          ${STATUSES.map(value => `<option ${STATE.status === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </div>
      <div class="filter-field">
        <label for="member-level">會員等級</label>
        <select id="member-level" class="control guide-select"><option>全部等級</option><option>VIP 1</option><option>VIP 2</option></select>
      </div>
      <div class="filter-field">
        <label for="member-time-type">時間範圍</label>
        <select id="member-time-type" class="control guide-select"><option>註冊時間</option><option>最後登入</option></select>
      </div>
      <div class="filter-field">
        <label id="member-date-label">日期區間</label>
        <div class="date-range-host" data-date-range data-past-year data-max-days="90" aria-labelledby="member-date-label"></div>
      </div>
      <div class="filter-field">
        <label for="member-tags">會員標籤</label>
        <select id="member-tags" class="control guide-select" multiple data-collapse="2" data-clearable>
          <option>一般會員</option><option>關注會員</option><option>高價值</option><option>新註冊</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="member-amount-type">金額範圍</label>
        <select id="member-amount-type" class="control guide-select"><option>總餘額</option><option>總存款</option><option>總提款</option></select>
      </div>
      <div class="filter-field amount-range-field">
        <label for="member-amount-min">最低／最高金額</label>
        <div class="amount-range-control">
          <input id="member-amount-min" class="control amount" placeholder="最低" aria-label="最低金額" inputmode="decimal">
          <span>～</span>
          <input class="control amount" placeholder="最高" aria-label="最高金額" inputmode="decimal">
        </div>
      </div>
      <div class="source-filter-actions">
        <button type="button" class="semantic-btn btn-neutral" data-member-reset>${icon('reset')}重設</button>
        <button type="submit" class="semantic-btn btn-search">${icon('search')}搜尋</button>
      </div>
    </div>
  </form>`

// 工具列固定在表格外，位置不隨表格狀態改變；手機把次要操作收進「更多」。
const toolbar = () => `<div class="example-toolbar member-actions">
  <button type="button" class="semantic-btn btn-add" data-member-action="新增會員">${icon('add')}新增</button>
  <button type="button" class="semantic-btn btn-export" data-member-export>${icon('download')}匯出</button>
  <button type="button" class="semantic-btn btn-edit mobile-secondary-action" data-member-action="排序模式">${icon('sort')}排序</button>
  <button type="button" class="semantic-btn btn-edit mobile-secondary-action" data-member-action="批次審核">${icon('batchReview')}批次審核</button>
  <button type="button" class="semantic-btn btn-neutral mobile-secondary-action" data-member-refresh>${icon('refresh')}刷新</button>
  <button type="button" class="semantic-btn mobile-more-actions-toggle" data-member-more>更多</button>
</div>`

window.renderExampleMember = () => `<section class="example-page example-member-page" data-member-root>
  <div class="guide-section-heading">
    <h2>${STATE.view === 'edit' ? '會員列表 ／ 編輯會員' : '會員列表'}</h2>
    <p class="component-description">組合範例（搜尋結果型），照正式後台 <code>membersManagement/index.vue</code> 做。它是整站表格與抽屜規範的基準頁：13 欄要橫向捲動、操作欄固定在右側、唯讀詳情走右側抽屜、列表內不放任何操作以外的狀態按鈕。</p>
  </div>
  ${STATE.view === 'edit' ? editView() : `${filters()}
  ${toolbar()}
  <section class="card example-card" data-member-list>${cards()}${table()}</section>`}
  <section class="card example-note">
    <h3>這一頁用到哪些規範</h3>
    <ul>
      <li><strong>表格</strong>：13 欄、固定操作欄、橫向捲動與分頁都在共用的 <code>dataTable()</code> 裡，頁面不自己兜分頁</li>
      <li><strong>抽屜還是獨立頁</strong>：唯讀的會員摘要與登入紀錄用右側抽屜（底部只有「關閉」）；要輸入、要做決定的編輯用獨立表單頁，兩個出口是左上的「返回列表」與底部的「取消／儲存」，不放右上角 X</li>
      <li><strong>表格內的控制項</strong>：狀態用共用下拉，改了就生效；操作欄是圖示按鈕，各自有 aria-label 與 Tooltip</li>
      <li><strong>列表工具列</strong>：七顆操作一律從左側排起，位置不隨表格狀態改變；手機把次要操作收進「更多」</li>
      <li><strong>匯出</strong>：建立下載任務，完成後到頁首的下載中心取得</li>
      <li><strong>載入與空狀態</strong>：篩不到資料時表格內顯示「無資料」，工具列與篩選列都不動</li>
    </ul>
  </section>
</section>`

// --- 抽屜：沿用 shell 的那一座（#detailOverlay），不自己做一個 ---
const field = ([label, value]) => `<div class="detail"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`

function openDrawer(title, body, footer = '') {
  document.querySelector('#detailDrawerTitle').textContent = title
  document.querySelector('#detailBody').innerHTML = body
  document.querySelector('#detailOverlay .drawer-foot').innerHTML =
    footer + '<button type="button" class="semantic-btn btn-neutral" data-member-drawer-close>關閉</button>'
  window.openDetailDrawer()
}

function memberSummary(uid) {
  const u = MEMBERS.find(item => item.uid === String(uid))
  if (!u) return
  openDrawer('會員詳情摘要',
    `<div class="person-hero"><div><h3>${esc(u.account)}</h3><span>UID ${esc(u.uid)} · ${esc(u.status)}</span></div></div>
     <div class="detail-grid">${[
       ['姓名', u.name], ['上層代理', u.agent], ['總餘額', u.balance], ['總存款', u.deposit],
       ['總提款', u.withdraw], ['註冊時間', u.register], ['最後登入', u.last],
       ['註冊 IP', u.regIp], ['最後登入 IP', u.loginIp],
     ].map(field).join('')}</div>`,
    `<button type="button" class="semantic-btn btn-record" data-member-records="${esc(u.uid)}">登入紀錄</button>`)
}

function loginRecords(uid) {
  const u = MEMBERS.find(item => item.uid === String(uid))
  if (!u) return
  openDrawer('登入紀錄',
    `<div class="person-hero"><div><h3>${esc(u.account)}</h3><span>UID ${esc(u.uid)}</span></div></div>
     <div class="login-record-list">${[
       [u.last, u.loginIp], ['2026-09-14 10:21:36', u.regIp], ['2026-09-12 22:04:18', u.regIp],
     ].map(([time, ip]) => `<div><strong>${esc(time)}</strong><span>${esc(ip)}</span></div>`).join('')}</div>`)
}

// 「彈窗與抽屜」規範頁的示範按鈕直接呼叫這兩個
window.openMemberSummary = memberSummary
window.openLoginRecords = loginRecords

// --- 互動 ---
const redraw = () => keepTableScroll(() => {
  const host = document.querySelector('[data-member-list]')
  if (host) host.innerHTML = cards() + table()
})

onMatch('submit', '[data-member-filter]', (event, form) => {
  event.preventDefault()
  STATE.keyword = form.querySelector('[name="keyword"]').value
  STATE.status = form.querySelector('[name="status"]').value
  STATE.page = 1
  redraw()
  const n = visible().length
  n ? message.success(`找到 ${n} 筆會員`) : message.info('沒有符合條件的會員')
}, { owner: 'example-member' })

onMatch('click', '[data-member-reset]', () => {
  STATE.keyword = ''
  STATE.status = 'all'
  STATE.page = 1
  const form = document.querySelector('[data-member-filter]')
  form?.reset()
  window.resetDateRanges?.(form)
  const host = document.querySelector('[data-member-root]')
  if (host) host.outerHTML = window.renderExampleMember()
  message.info('已重設搜尋條件')
}, { owner: 'example-member' })

// 手機：篩選列由共用的 filterToggle 收合，次要操作收進「更多」
onMatch('click', '[data-member-more]', (event, button) => {
  const toolbar = button.closest('.member-actions')
  const open = toolbar.classList.toggle('show-mobile-more')
  button.textContent = open ? '收合' : '更多'
}, { owner: 'example-member' })

onMatch('click', '[data-member-summary]', (event, button) => memberSummary(button.dataset.memberSummary), { owner: 'example-member' })
onMatch('click', '[data-member-records]', (event, button) => loginRecords(button.dataset.memberRecords), { owner: 'example-member' })
onMatch('click', '[data-member-drawer-close]', () => window.closeDetailDrawer(), { owner: 'example-member' })

// --- 編輯會員的動線 ---
const redrawPage = () => {
  const host = document.querySelector('[data-member-root]')
  if (host) host.outerHTML = window.renderExampleMember()
}

const leaveEdit = () => {
  STATE.view = 'list'
  STATE.editing = null
  draft = {}
  clean = '{}'
  errors = {}
  redrawPage()
}

const validateEdit = () => {
  const next = {}
  if (!draft.name.trim()) next.name = '請輸入姓名'
  const agent = draft.agent.trim()
  if (agent && agent !== '-' && !/^[A-Za-z0-9_]{3,30}$/.test(agent)) {
    next.agent = '代理帳號需為 3–30 碼英數字或底線'
  }
  errors = next
  return !Object.keys(next).length
}

onMatch('click', '[data-member-edit]', (event, button) => {
  const u = MEMBERS.find(item => item.uid === button.dataset.memberEdit)
  if (!u) return
  STATE.view = 'edit'
  STATE.editing = u.uid
  draft = {
    name: u.name,
    agent: u.agent,
    status: u.status,
    tags: u.tags.map(color => TAG_NAME.get(color)).filter(Boolean),
    note: u.note ?? '',
  }
  clean = JSON.stringify(draft)
  errors = {}
  redrawPage()
}, { owner: 'example-member' })

// 輸入時不重繪（重繪會讓游標跳到字尾），只更新資料與存檔列的狀態
onMatch('input', '[data-member-field]', (event, input) => {
  if (input.multiple) return
  draft[input.dataset.memberField] = input.value
  const status = document.querySelector('[data-member-root] .example-save-status')
  if (status) status.textContent = dirty() ? '有尚未儲存的變更' : '目前沒有未儲存的變更'
}, { owner: 'example-member' })

onMatch('change', '[data-member-field]', (event, input) => {
  const key = input.dataset.memberField
  draft[key] = input.multiple ? [...input.selectedOptions].map(o => o.value) : input.value
}, { owner: 'example-member' })

// 沒改過就直接回列表，不跳確認——沒有變更卻還要按一次「確認離開」只是擋路。
// 真的改過才問，文案與「表單頁型」「設定型」兩個範例的守衛一致。
onMatch('click', '[data-member-back]', () => {
  if (!dirty()) return leaveEdit()
  const dialog = document.createElement('dialog')
  dialog.innerHTML = `<form>
    <header><h2>離開編輯會員</h2></header>
    <div class="bo-modal-body"><p>異動資訊未保存，請確認是否離開？</p><p>離開後這次修改的內容不會保留。</p></div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-example-close>留在此頁</button>
      <button type="submit" class="semantic-btn btn-warning">離開並放棄</button>
    </footer>
  </form>`
  prepareModal(dialog)
  dialog.querySelector('[data-example-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = submit => {
    submit.preventDefault()
    dialog.close()
    leaveEdit()
  }
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
}, { owner: 'example-member' })

onMatch('submit', '[data-member-edit-form]', event => {
  event.preventDefault()
  if (!validateEdit()) {
    redrawPage()
    // 欄位錯誤不用 Toast，只把焦點送到第一個出錯的欄位
    document.querySelector('[data-member-root] .guide-input.is-error')?.focus()
    return
  }
  const u = MEMBERS.find(item => item.uid === STATE.editing)
  const account = u.account
  u.name = draft.name.trim()
  u.agent = draft.agent.trim() || '-'
  u.status = draft.status
  u.tags = draft.tags.map(name => TAG_COLOR.get(name)).filter(Boolean)
  u.note = draft.note
  leaveEdit()
  message.success(`已更新會員 ${account}`)
}, { owner: 'example-member' })

onMatch('change', '[data-member-status]', (event, select) => {
  const u = MEMBERS.find(item => item.uid === select.dataset.memberStatus)
  if (!u || u.status === select.value) return
  u.status = select.value
  redraw()
  message.success(`已將 ${u.account} 設為${u.status}`)
}, { owner: 'example-member' })

onMatch('click', '[data-member-export]', () => requestExport('會員列表'), { owner: 'example-member' })

onMatch('click', '[data-member-refresh]', () => {
  redraw()
  message.info('列表已刷新')
}, { owner: 'example-member' })

onMatch('click', '[data-member-action]', (event, button) =>
  message.info(`${button.dataset.memberAction}在正式環境接對應的頁面`), { owner: 'example-member' })

onMatch('click', '[data-table-page][data-table="member"]', (event, button) => {
  STATE.page = applyPaging({ ...STATE, total: visible().length }, { page: button.dataset.tablePage }).page
  redraw()
}, { owner: 'example-member' })

onMatch('change', '[data-table-size][data-table="member"]', (event, select) => {
  Object.assign(STATE, applyPaging({ ...STATE, total: visible().length }, { size: select.value }))
  redraw()
}, { owner: 'example-member' })
