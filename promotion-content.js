// 移植：富文字 CkEditor.vue、圖片上傳 el-upload、語系頁籤 el-tabs。詳見 ELEMENT-PLUS-MAPPING.md
//
// 活動內容編輯彈窗。照正式後台 views/promotionActivity/index.vue 的 promotionEditDialog
// （CustomDialog，noticeWidth="848px"）做，由「組合範例－混合」的優惠活動列表叫起來。
//
// 先前這是側欄上獨立的一頁「內容編輯 Editor」，但它既不是元件規範（富文字是整包
// CKEditor，沒有可以規範的外觀決策），也不是組合範例（沒有照哪一支 view 寫）。
// 它還自己寫了一份拖放區 .content-image-stage，與「圖片上傳 Upload」頁並存。
// 現在整個併進這裡：容器是彈窗（AGENTS.md：要輸入 → 置中彈窗），上傳用共用的
// uploadSlot()，操作結果用 Toast。
import { uploadSlot } from './upload-guide.js'
import { tabs } from './tabs.js'
import { message } from './message.js'
import { prepareModal } from './modal-system.js'
import './promotion-content.css'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// 九個語系，與正式後台一致（zh-tw、zh-cn、en-us、vi-vn、ja-jp、ko-kr、km-kh、bn-bd、fil-ph）。
// 只有第一個是主語系、必填；其餘沒填就是這個語系不上架，不是錯誤。
const LANGUAGES = ['繁體中文', '简体中文', 'English', 'Tiếng Việt', '日本語', '한국어', 'ភាសាខ្មែរ', 'বাংলা', 'Filipino']

// 圖片欄位與尺寸照 composables/useImageUploadRule.ts 的 promotionCoverImage 與 promotion（template 3）
// 第五欄是分組：封面圖與活動內頁是兩件事（一個是列表上的縮圖、一個是點進去的內容），
// 分成兩組各自一排，不要四張擠在同一個格線裡讓人分不出哪兩張是一對。
const IMAGE_SLOTS = [
  ['cover-web', '封面圖 · Web', '540 × 600', 500, 'cover'],
  ['cover-h5', '封面圖 · H5', '540 × 600', 500, 'cover'],
  ['body-web', '活動內頁 · Web', '2020 × 540', 800, 'body'],
  ['body-h5', '活動內頁 · H5', '750 × 320', 500, 'body'],
]

/* 貼上內容的清理白名單。這是我們自己的決定，不是 CKEditor 的——後台填的內容會被
   前台直接輸出，所以只留得了版面意義的標籤，其餘一律把標籤剝掉但保留文字。
   連結強制 target="_blank" rel="noopener noreferrer"；圖片只收 https 與 data:image
   的 base64；除了 href／src／alt／colspan 以外的屬性全部拿掉（含 style 與事件屬性）。 */
const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4',
  'BLOCKQUOTE', 'A', 'DIV', 'FIGURE', 'FIGCAPTION', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'HR'])

export function cleanHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll('script,style,iframe,object,svg,math').forEach(node => node.remove())
  template.content.querySelectorAll('*').forEach(node => {
    if (!ALLOWED_TAGS.has(node.tagName)) { node.replaceWith(...node.childNodes); return }
    const href = node.getAttribute('href'), src = node.getAttribute('src')
    const alt = node.getAttribute('alt'), span = node.getAttribute('colspan')
    for (const attr of [...node.attributes]) node.removeAttribute(attr.name)
    if (node.tagName === 'IMG' && src && /^(https?:\/\/|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(src)) {
      node.setAttribute('src', src)
      node.setAttribute('alt', alt || '')
    }
    if (['TD', 'TH'].includes(node.tagName) && /^[1-9][0-9]?$/.test(span || '')) node.setAttribute('colspan', span)
    if (node.tagName === 'A' && href && /^https?:\/\//i.test(href)) {
      node.setAttribute('href', href)
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return template.innerHTML
}

// CKEditor 是整包套件，第一次用到才載入——它比整個 shell 還大。
let editorBuild = null

/* CKEditor 的氣泡（連結、圖片工具列、表格工具列）預設 append 到 document.body。
   我們的彈窗是原生 <dialog>.showModal()，在 top layer，top layer 之上沒有 z-index
   可言——留在 body 的氣泡會被整個蓋住，按下「插入連結」什麼都不會出現。
   所以編輯器建好之後把 .ck-body-wrapper 搬進 dialog 內。
   移植到正式後台時這段要拿掉：el-dialog 是普通的 z-index，沒有這個問題。 */
function moveBalloonsInto(dialog) {
  document.querySelectorAll('body > .ck-body-wrapper').forEach(node => dialog.append(node))
}

export function promotionContentDialog({ row, categories = [], onSave }) {
  const trigger = document.activeElement
  // 草稿：改的是副本，按取消就整份丟掉，不碰列表上的那一筆
  const draft = LANGUAGES.map((_, index) => ({
    title: index === 0 ? (row?.title ?? '') : '',
    html: index === 0 ? '<p>活動內容示範文字。</p>' : '',
    images: {},
  }))
  let language = 0
  let editor = null

  const TAB_ID = 'promo-content-language'
  const slots = (item, group) => IMAGE_SLOTS.filter(slot => slot[4] === group).map(([key, label, size, maxKB]) => {
    const image = item.images[key]
    return uploadSlot({
      label, size, maxKB,
      attrs: `data-promo-drop="${key}"`,
      preview: image ? { url: image.url, name: image.name } : null,
      actions: image
        ? `<button type="button" class="semantic-btn btn-edit" data-promo-replace="${key}">替換</button>
           <button type="button" class="semantic-btn btn-danger" data-promo-image-remove="${key}">移除</button>`
        : '',
    })
  }).join('')

  // 語系面板：切換語系時只重畫這一塊，彈窗與頁籤列留在原地
  const panel = () => {
    const item = draft[language]
    return `<label class="promo-content-title">
        <span>活動標題${language === 0 ? '<span class="required-mark" aria-hidden="true"> *</span>' : ''}</span>
        <input class="guide-input" data-promo-content-title maxlength="80"
          ${language === 0 ? 'required aria-required="true"' : ''}
          value="${esc(item.title)}" placeholder="請輸入此語言的活動標題">
        <small class="error-text" data-promo-title-error hidden></small>
      </label>
      <h4 class="promo-content-heading">封面圖</h4>
      <div class="upload-grid">${slots(item, 'cover')}</div>
      <h4 class="promo-content-heading">活動內頁</h4>
      <div class="upload-grid">${slots(item, 'body')}</div>
      <h4 class="promo-content-heading" id="promo-content-editor-label">活動內文</h4>
      <div class="promo-content-richtext" data-promo-editor-host><div data-promo-editor-source></div></div>`
  }

  const dialog = document.createElement('dialog')
  dialog.className = 'is-wide'
  dialog.innerHTML = `<form>
    <header><h2>編輯活動內容</h2></header>
    <div class="bo-modal-body">
      <p class="component-description">九個語系各自有標題、圖片與內文。只有主語系必填，其餘語系沒填就是不在該語系上架。</p>
      <div class="guide-fields">
        <div class="guide-field">
          <label for="promo-content-type">活動類型</label>
          <select id="promo-content-type" class="guide-select" data-promo-content-type>
            ${categories.map(v => `<option ${row?.type === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
          </select>
        </div>
        <div class="guide-field">
          <label id="promo-content-date-label">活動期間<span class="required-mark" aria-hidden="true"> *</span></label>
          <div class="date-range-host" data-date-range data-promo-content-date
            ${row?.start ? `data-start="${row.start} 00:00:00" data-end="${row.end} 23:59:59"` : 'data-empty="true"'}
            aria-labelledby="promo-content-date-label"></div>
        </div>
      </div>
      <small class="error-text" data-promo-period-error hidden></small>
      ${tabs({
        id: TAB_ID, label: '活動語言',
        items: LANGUAGES.map((label, index) => ({ key: String(index), label: index === 0 ? `${label} *` : label })),
        active: '0', variant: 'card', mobile: 'scroll', controls: `${TAB_ID}-panel`,
      })}
      <div id="${TAB_ID}-panel" role="tabpanel" data-promo-content-panel>${panel()}</div>
    </div>
    <footer>
      <button type="button" class="semantic-btn btn-neutral" data-promo-content-close>取消</button>
      <button type="submit" class="semantic-btn btn-search">儲存</button>
    </footer>
  </form>`
  prepareModal(dialog)

  const panelHost = () => dialog.querySelector('[data-promo-content-panel]')
  const titleInput = () => dialog.querySelector('[data-promo-content-title]')

  // 把編輯器與標題的現值寫回草稿。切語系、送出前都要先做，否則會存到上一次的內容。
  const snapshot = () => {
    const input = titleInput()
    if (input) draft[language].title = input.value
    if (editor) draft[language].html = editor.getData()
  }

  function mountEditor() {
    const host = dialog.querySelector('[data-promo-editor-host]')
    const source = host?.querySelector('[data-promo-editor-source]')
    if (!source) return
    source.innerHTML = cleanHtml(draft[language].html)
    const index = language
    // 動態 import 在沒有打包器的環境（測試、或瀏覽器擋掉這個 chunk）會直接丟出來，
    // 不是回傳一個會 reject 的 promise，所以要連呼叫本身一起包起來。
    try {
      editorBuild ||= import('@ckeditor/ckeditor5-build-classic').then(module => module.default)
    } catch {
      source.textContent = '編輯器載入失敗，請關閉後重新開啟。'
      return
    }
    editorBuild
      .then(Editor => (host.isConnected ? Editor.create(source, {
        image: { upload: { types: ['jpeg', 'jpg', 'png', 'gif', 'webp'] } },
        mediaEmbed: { previewsInData: true },
      }) : null))
      .then(instance => {
        if (!instance) return
        if (!host.isConnected || index !== language) { instance.destroy(); return }
        editor = instance
        moveBalloonsInto(dialog)
        instance.editing.view.change(writer => {
          const root = instance.editing.view.document.getRoot()
          writer.setAttribute('aria-labelledby', 'promo-content-editor-label', root)
          writer.setAttribute('aria-required', index === 0 ? 'true' : 'false', root)
        })
        instance.model.document.on('change:data', () => { draft[index].html = instance.getData() })
      })
      .catch(() => {
        if (!host.isConnected) return
        source.textContent = '編輯器載入失敗，請關閉後重新開啟。'
        message.error('CKEDITOR_LOAD_FAILED 編輯器載入失敗')
      })
  }

  async function redrawPanel() {
    if (editor) { await editor.destroy(); editor = null }
    panelHost().innerHTML = panel()
    mountEditor()
  }

  dialog.addEventListener('tab-change', event => {
    if (event.detail?.id !== TAB_ID) return
    snapshot()
    language = Number(event.detail.key)
    redrawPanel()
  })

  // 圖片：點拖放區選檔、也可以直接把檔案拖進來。兩條路都走同一個 setImage。
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp'
  fileInput.hidden = true
  let pendingKey = null

  const setImage = (key, file) => {
    if (!file || !/^image\//.test(file.type)) { message.error('IMAGE_TYPE_INVALID 只接受 JPG、PNG、GIF、WebP'); return }
    const maxKB = IMAGE_SLOTS.find(slot => slot[0] === key)?.[3] ?? 500
    if (file.size > maxKB * 1024) { message.error(`IMAGE_TOO_LARGE 檔案超過 ${maxKB}KB`); return }
    const reader = new FileReader()
    reader.onload = () => {
      snapshot()
      draft[language].images[key] = { url: reader.result, name: file.name }
      redrawPanel()
      message.success(`已上傳 ${file.name}`)
    }
    reader.readAsDataURL(file)
  }

  fileInput.addEventListener('change', () => {
    if (pendingKey) setImage(pendingKey, fileInput.files?.[0])
    fileInput.value = ''
  })

  dialog.addEventListener('click', event => {
    const drop = event.target.closest('[data-promo-drop]')
    const replace = event.target.closest('[data-promo-replace]')
    const remove = event.target.closest('[data-promo-image-remove]')
    if (remove) {
      snapshot()
      delete draft[language].images[remove.dataset.promoImageRemove]
      redrawPanel()
      message.success('已移除圖片')
      return
    }
    if (replace || drop) {
      pendingKey = replace ? replace.dataset.promoReplace : drop.dataset.promoDrop
      fileInput.click()
    }
  })

  dialog.addEventListener('dragover', event => {
    const drop = event.target.closest('[data-promo-drop]')
    if (!drop) return
    event.preventDefault()
    drop.classList.add('is-dragging')
  })
  dialog.addEventListener('dragleave', event => {
    event.target.closest('[data-promo-drop]')?.classList.remove('is-dragging')
  })
  dialog.addEventListener('drop', event => {
    const drop = event.target.closest('[data-promo-drop]')
    if (!drop) return
    event.preventDefault()
    drop.classList.remove('is-dragging')
    setImage(drop.dataset.promoDrop, event.dataTransfer?.files?.[0])
  })

  dialog.querySelector('[data-promo-content-close]').onclick = () => dialog.close()
  dialog.querySelector('form').onsubmit = event => {
    event.preventDefault()
    snapshot()
    // 送出驗證失敗要切到出錯的語系、捲到那一格並聚焦它，而且不另外發 Toast——
    // 錯誤已經寫在欄位下方，Toast 只會重複又蓋住剛捲到的欄位。
    if (!draft[0].title.trim()) {
      const focusError = () => {
        const field = titleInput()
        const error = dialog.querySelector('[data-promo-title-error]')
        field.classList.add('is-error')
        error.textContent = '主語系的活動標題為必填。'
        error.hidden = false
        field.scrollIntoView?.({ block: 'center' })
        field.focus()
      }
      if (language !== 0) {
        language = 0
        dialog.querySelector(`[data-tab-key="0"]`)?.click()
        redrawPanel().then(focusError)
      } else focusError()
      return
    }
    const host = dialog.querySelector('[data-promo-content-date]')
    const start = host?.dataset.start?.slice(0, 10) || ''
    const end = host?.dataset.end?.slice(0, 10) || ''
    const periodError = dialog.querySelector('[data-promo-period-error]')
    if (!start || !end || end < start) {
      periodError.textContent = '請選擇活動期間，結束日期不得早於開始日期。'
      periodError.hidden = false
      host.scrollIntoView?.({ block: 'center' })
      return
    }
    periodError.hidden = true
    onSave?.({
      title: draft[0].title.trim(),
      type: dialog.querySelector('[data-promo-content-type]')?.value ?? row?.type,
      start, end,
    })
    dialog.close()
    message.success(`已儲存活動內容 ${draft[0].title.trim()}`)
  }

  dialog.addEventListener('close', async () => {
    if (editor) { await editor.destroy(); editor = null }
    dialog.remove()
    fileInput.remove()
    if (trigger?.isConnected) trigger.focus()
  }, { once: true })

  document.body.append(dialog, fileInput)
  dialog.showModal()
  mountEditor()
  return dialog
}
