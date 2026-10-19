// 移植：el-upload（正式後台 16 個 view 在用，搭配 useImageUploadRule 的每功能像素規則）。
// 詳見 ELEMENT-PLUS-MAPPING.md
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import { message } from './message.js'
import { onMatch } from './delegate.js'
import './guide-page.css'
import './upload-guide.css'

// 正式後台的像素規則是每個功能各自一組，這裡用活動圖的四個欄位當示範。
const SLOTS = [
  ['封面圖 · Web', '540 × 600', 500],
  ['封面圖 · H5', '540 × 600', 500],
  ['活動內頁 · Web', '2020 × 540', 800],
  ['活動內頁 · H5', '750 × 320', 500],
]

/**
 * 上傳欄位：尺寸與容量規則直接寫在標題列，上傳前就擋得住錯誤。
 * 其他頁面要放上傳欄位就用這個，不要自己拼一份拖放區。
 * @param attrs 給拖放區的額外屬性，頁面用它接自己的事件
 */
export const uploadSlot = ({ label, size, maxKB, attrs = '' }) => `<div class="upload-slot">
  <div class="upload-slot-head"><strong>${label}</strong><small>${size}px · 最大 ${maxKB}KB</small></div>
  <div class="upload-dropzone" role="button" tabindex="0" aria-label="上傳 ${label}" ${attrs}>
    ${icon('upload', 24)}
    <p>點擊或拖曳圖片到這裡</p>
    <small>JPG／PNG／WebP</small>
  </div>
</div>`

const slot = ([label, size, maxKB], index) => uploadSlot({ label, size, maxKB, attrs: `data-upload-demo="${index}"` })

const DECISION = [
  ['單張圖片，尺寸固定', '<strong>拖放區</strong>', '直接顯示尺寸與容量規則，上傳前就擋住錯誤'],
  ['多個檔案，不限數量', '拖放區＋清單', '每一筆各自有進度與移除鈕'],
  ['需要裁切或調整', '上傳後開彈窗', '裁切是一個需要做決定的動作，不能在拖放區裡完成'],
  ['檔案很大（影片、備份）', '顯示進度百分比', '只有轉圈會讓人以為當掉了'],
  ['單純選檔，不預覽', '原生 file input', '不是每個上傳都需要拖放區'],
]

window.renderUploadPage = () => guidePage({
  slug: 'upload',
  title: '圖片上傳 Upload',
  intro: '正式後台 16 個 view 在用，每個功能的像素規則由 useImageUploadRule 提供。規則要在上傳前就寫在畫面上——讓使用者傳完才被退件，是最常見的體驗問題。',
  sections: [
    {
      heading: '互動範例',
      body: `<div class="upload-grid">${SLOTS.map(slot).join('')}</div>
        <p class="component-description">每個欄位的尺寸與容量規則直接寫在標題旁，不藏在 Tooltip 或錯誤訊息裡。點任一格會示範驗證失敗的回報方式。</p>`,
    },
    {
      heading: '規則要寫在前面',
      body: `<div class="guide-pair">
        <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>拖放區只寫「點擊上傳」，使用者選完檔案才跳出「尺寸需為 540 × 600」。已經花掉的時間拿不回來，而且不知道該怎麼改。</p></div>
        <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>尺寸、格式、容量上限直接列在欄位標題旁；驗證失敗的訊息也要帶出實際值與期望值。</p></div>
      </div>`,
    },
    {
      heading: '尺寸提示 ImageUploadTips',
      body: `<p class="component-description">正式後台有獨立的 <code>ImageUploadTips.vue</code>（14 個 view 在用），接 <code>webSize</code>、<code>h5Size</code>、<code>size</code> 三個參數。它的工作就是把規則講在上傳之前。</p>
        <div class="guide-stage">
          <div class="upload-tips">
            <strong>活動封面圖</strong>
            <ul>
              <li>Web：<code>540 × 600</code> px</li>
              <li>H5：<code>540 × 600</code> px</li>
              <li>檔案大小：<code>500 KB</code> 以內</li>
              <li>格式：JPG / PNG / WebP</li>
            </ul>
          </div>
        </div>
        <p class="component-description">三件事缺一不可：<strong>Web 與 H5 的尺寸分開列</strong>（兩者常常不同）、<strong>容量上限</strong>、<strong>可接受格式</strong>。正式後台的像素規則由 <code>useImageUploadRule</code> 依功能提供，不是全站同一組——所以提示文字必須跟著欄位走，不能寫死在元件裡。</p>`,
    },
    { heading: '什麼時候用拖放區', body: decisionTable(DECISION) },
  ],
  tokens: [
    ['拖放區最小高度', '130px'],
    ['框線', '1px 虛線 #CDD8E0'],
    ['圓角', '4px'],
    ['底色', '#F7F9FB'],
    ['拖曳中', '框線與圖示轉主題綠'],
    ['圖示', '24px'],
    ['說明文字', '12px / #718096'],
    ['預覽', 'object-fit: contain，不裁切'],
    ['預覽最大高度', '160px'],
    ['失敗訊息', 'Toast error，帶實際值與期望值'],
    ['刪除鈕', '圖示按鈕 btn-danger'],
    ['可接受格式', 'JPG / PNG / WebP'],
  ],
  rules: [
    ['規則寫在上傳之前', '尺寸、格式、容量上限列在欄位旁，不要等傳完才退件。'],
    ['失敗訊息要帶實際值', '寫「圖片為 800 × 600，需要 540 × 600」，不要只寫「尺寸錯誤」。'],
    ['預覽不裁切', '用 object-fit: contain；裁切會讓使用者以為圖片被改掉了。'],
    ['拖放區要能鍵盤操作', 'tabindex 與 aria-label 不可省，Enter 要能開啟選檔。'],
    ['上傳中要能取消', '大檔案必須顯示百分比與取消鈕，只有轉圈會讓人以為當掉了。'],
    ['刪除要能復原或再確認', '誤刪已上傳的圖片沒有退路，刪除前要確認。'],
  ],
})

onMatch('click', '[data-upload-demo]', (event, zone) => {
  // 示範驗證失敗的回報方式：帶實際值與期望值，不只說「錯誤」
  const [label, size] = SLOTS[Number(zone.dataset.uploadDemo)]
  message.error(`${label} 需要 ${size}px，這張是 800 × 600`)
}, { owner: 'upload-guide' })

onMatch('keydown', '[data-upload-demo]', (event, zone) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); zone.click() }
}, { owner: 'upload-guide' })
