// 移植：el-popover（Header.vue 的「下載進度」）＋ el-progress。詳見 ELEMENT-PLUS-MAPPING.md
//
// 非同步匯出：正式後台 14 個 view 的「匯出」不是直接下檔，而是 POST 一個下載任務，
// 由頁首的下載中心每 3 秒輪詢一次，完成後才拿得到檔案（useDownloadCenterApi ＋
// useDownloadCenterStore.triggerPoll()）。原型先前只有一顆沒有行為的下載圖示，
// 頁面各自 Toast 一句「已匯出」，與正式後台的動線完全對不上。
//
// 這支模組同時是規範：頁面要匯出就呼叫 requestExport()，不得自己做下載 UI，
// 也不得在按下匯出時就說「已匯出」——那時候檔案還不存在。
import { progressBar } from './progress-guide.js'
import { emptyState } from './states.js'
import { iconButton } from './icon-button.js'
import { tag } from './tag-guide.js'
import { message } from './message.js'
import { icon } from './icons.js'
import { on, onMatch } from './delegate.js'
import './download-center.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 與正式後台 DownloadCenterItem.status 的五個值一一對應。
// 標籤型別依語意取自「按鈕 Button」已定義的那一組色，不另外調色。
const STATUS = {
  pending: ['等待中', 'warning'],
  processing: ['處理中', 'warning'],
  completed: ['已完成', 'success'],
  cancelled: ['已取消', 'info'],
  failed: ['失敗', 'danger'],
}

const ACTIVE = new Set(['pending', 'processing'])

let tasks = []
let seq = 0
let timer = 0

const activeCount = () => tasks.filter(t => ACTIVE.has(t.status)).length

/** 原型沒有後端，用計時器推進進度；正式後台這裡是每 3 秒重新取一次清單。 */
function poll() {
  for (const task of tasks) {
    if (!ACTIVE.has(task.status)) continue
    task.status = 'processing'
    task.progress = Math.min(100, task.progress + task.step)
    if (task.progress >= 100) {
      task.status = 'completed'
      // 完成才回報，而且帶檔名——「動詞＋受詞」，不是「匯出成功」
      message.success(`已產生 ${task.file}`)
    }
  }
  if (!activeCount() && timer) { clearInterval(timer); timer = 0 }
  render()
}

// 還有任務在跑才開計時器，跑完就關掉——與 Header.vue 的 hasActive 判斷一致。
const ensurePolling = () => { if (activeCount() && !timer) timer = setInterval(poll, 3000) }

/**
 * 建立一個匯出任務。頁面只呼叫這一個函式，不自己做下載 UI。
 * @param name 檔名用的名稱，例如「遊戲營收報表」
 */
export function requestExport(name) {
  seq += 1
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  tasks.unshift({
    id: `DL-${seq}`,
    file: `${name}_${stamp}.xlsx`,
    status: 'pending',
    progress: 0,
    // 每筆任務推進速度不同，才看得出清單裡可以同時有不同進度的任務
    step: [18, 25, 34][seq % 3],
  })
  ensurePolling()
  render()
  // 按下匯出的當下檔案還不存在，所以講的是「已建立任務」，不是「已匯出」
  message.info(`已建立匯出任務，完成後到頁首的下載中心取得`)
}

const item = task => {
  const [label, type] = STATUS[task.status]
  return `<li class="download-task">
    <div class="download-task-head">
      <span class="download-task-name" data-tooltip="${esc(task.file)}">${esc(task.file)}</span>
      ${ACTIVE.has(task.status)
        ? iconButton({ icon: icon('close', 16), label: `取消 ${task.file}`, kind: 'btn-neutral', attrs: `data-download-cancel="${task.id}"` })
        : ''}
      ${tag(label, type)}
    </div>
    ${progressBar({ value: task.progress, label: `${task.file} 進度`, tone: task.status === 'failed' ? 'danger' : 'success', text: 'right' })}
  </li>`
}

export const downloadCenter = () => {
  const count = activeCount()
  return `<div class="download-center" data-download-root>
    <button type="button" class="icon-btn" data-download-toggle aria-expanded="false" aria-haspopup="dialog" aria-label="下載中心${count ? `，${count} 個任務處理中` : ''}">
      ${icon('download', 20)}
      ${count ? `<span class="download-badge" aria-hidden="true">${count}</span>` : ''}
    </button>
    <div class="download-panel" role="dialog" aria-label="下載進度" hidden>
      <div class="download-panel-head">
        <strong>下載進度</strong>
        <button type="button" class="semantic-btn btn-neutral" data-download-clear ${tasks.length ? '' : 'disabled'}>全部清除</button>
      </div>
      ${tasks.length
        ? `<ul class="download-list">${tasks.map(item).join('')}</ul>`
        // 空狀態文案一律由 states.js 提供，這裡不自己寫一句「目前沒有下載任務」
        : emptyState()}
    </div>
  </div>`
}

function render() {
  const host = document.querySelector('[data-download-root]')
  if (!host) return
  const open = !host.querySelector('.download-panel').hidden
  host.outerHTML = downloadCenter()
  if (!open) return
  const next = document.querySelector('[data-download-root]')
  next.querySelector('.download-panel').hidden = false
  next.querySelector('[data-download-toggle]').setAttribute('aria-expanded', 'true')
}

onMatch('click', '[data-download-toggle]', (event, button) => {
  const panel = button.closest('[data-download-root]').querySelector('.download-panel')
  panel.hidden = !panel.hidden
  button.setAttribute('aria-expanded', String(!panel.hidden))
}, { owner: 'download-center' })

onMatch('click', '[data-download-cancel]', (event, button) => {
  const task = tasks.find(t => t.id === button.dataset.downloadCancel)
  if (!task) return
  task.status = 'cancelled'
  render()
  message.info(`已取消 ${task.file}`)
}, { owner: 'download-center' })

onMatch('click', '[data-download-clear]', () => {
  tasks = []
  if (timer) { clearInterval(timer); timer = 0 }
  render()
}, { owner: 'download-center' })

// 面板外點一下就收起來，與頁首的資訊氣泡行為一致。
// 這一條不宣告 selector：它管的是「不在面板裡的點擊」，不擁有任何元素。
on('click', event => {
  if (event.target?.closest?.('[data-download-root]')) return
  const panel = document.querySelector('[data-download-root] .download-panel')
  if (!panel || panel.hidden) return
  panel.hidden = true
  document.querySelector('[data-download-toggle]')?.setAttribute('aria-expanded', 'false')
}, { owner: 'download-center' })
