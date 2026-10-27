// 移植：el-form / el-form-item（正式後台 59 個 view、501 處 el-form-item）。
// 詳見 ELEMENT-PLUS-MAPPING.md
//
// 「輸入框 Input」講的是一個欄位長什麼樣；這一頁講的是**一堆欄位怎麼排成一張表單**：
// 標籤在哪、必填怎麼標、一行放幾個、什麼時候驗證、驗證失敗畫面要不要動。
// 先前這些只存在於 example-form.js 那一頁動線裡，沒有被寫成規範——
// 結果是每張新表單都得去翻那一頁的原始碼才知道該怎麼排。
//
// 內容照正式後台 membersManagement/add.vue 的實際寫法做，只有一處是原型主動優化的
// （驗證失敗要捲到第一個錯誤），在頁面上有標明。
import { guidePage, decisionTable } from './guide-page.js'
import { icon } from './icons.js'
import './guide-page.css'
import './form-guide.css'

// 示範**直接套用既有的表單排版**：.guide-fields / .guide-field / .required-mark /
// .guide-input.is-error / small.error-text。guide-page.css 的註解本來就寫著
// 「各規範頁要放表單就用 .guide-field，不要自己排一套」——先前這一頁自己排了一套
// .form-demo-field，連必填星號與錯誤邊框都另取了名字，已改回。
const FIELDS = [
  ['會員帳號', 'ava_chen', true, '6–20 碼英數字，建立後不可修改'],
  ['姓名', 'Ava Chen', true, ''],
  ['層級', 'VIP 2', false, ''],
  ['E-mail', 'ava@example.com', false, ''],
]

const field = ([label, value, required, hint], index) => `<div class="guide-field">
  <label for="form-demo-${index}">${label}${required ? '<span class="required-mark" aria-hidden="true"> *</span>' : ''}</label>
  <input id="form-demo-${index}" class="guide-input" value="${value}"${required ? ' aria-required="true"' : ''}>
  ${hint ? `<small>${hint}</small>` : ''}
</div>`

const layoutDemo = () => `<div class="guide-stage">
  <form class="form-demo" onsubmit="return false">
    <h4>基本資料</h4>
    <div class="guide-fields">${FIELDS.map(field).join('')}</div>
    <h4>帳號安全</h4>
    <div class="guide-fields">
      <div class="guide-field">
        <label for="form-demo-pw">登入密碼<span class="required-mark" aria-hidden="true"> *</span></label>
        <input id="form-demo-pw" class="guide-input is-error" type="password" value="12345" aria-required="true" aria-invalid="true" aria-describedby="form-demo-pw-error">
        <small class="error-text" id="form-demo-pw-error">密碼至少 8 碼，需含英文與數字</small>
      </div>
      <div class="guide-field">
        <label for="form-demo-pw2">確認密碼<span class="required-mark" aria-hidden="true"> *</span></label>
        <input id="form-demo-pw2" class="guide-input" type="password" value="" aria-required="true">
      </div>
    </div>
    <div class="form-demo-footer">
      <button type="button" class="semantic-btn btn-neutral">取消</button>
      <button type="button" class="semantic-btn btn-search">確認新增</button>
    </div>
  </form>
</div>`

const COLUMNS = [
  ['767px 以下', '1 欄', '<code>:span="24"</code>（xs，EP 預設）'],
  ['768px 起', '2 欄', '<code>:sm="12"</code>'],
  ['992px 起', '3 欄', '<code>:md="8"</code>'],
  ['1200px 起', '4 欄', '<code>:lg="6"</code>'],
  ['1920px 起', '6 欄', '<code>:xl="4"</code>'],
  ['彈窗內', '2 欄（手機 1 欄）', '彈窗內一律 <code>:span="12"</code>'],
]

const TIMING = [
  ['欄位失焦（blur）', '<strong>驗這一格</strong>', '正式後台 501 處 el-form-item 的規則全部是 trigger: "blur"。離開欄位才驗，使用者還在打字時不會被紅字追著跑'],
  ['送出時', '<strong>驗整張</strong>', '沒通過就不送出，並把畫面捲到第一個錯誤的欄位'],
  ['輸入當下（input）', '只用在<strong>格式限制</strong>', '金額欄位擋掉非數字、超過兩位小數——那是「不讓他打錯」，不是「告訴他打錯了」'],
  ['欄位之間有連動', '改完就驗那一格', '例如上級代理帳號改了要重新檢查是否存在，用 validateField 單驗一格，不要整張重驗'],
  ['一進頁面', '<strong>什麼都不驗</strong>', '空白的新表單整片紅字，等於在罵還沒開始填的人'],
]

const REQUIRED = [
  ['必填', '標籤右側加紅色星號', 'require-asterisk-position="right"：星號跟在文字後面，標籤才會對齊在同一條垂直線上'],
  ['選填', '<strong>什麼都不加</strong>', '不要標「(選填)」——一張表單通常選填比必填多，標選填等於每一行都多一塊雜訊'],
  ['整張都必填', '改標選填的那幾個', '這種表單很少，但真的遇到時反過來標比較安靜'],
  ['條件必填', '條件成立才出現星號', '例如勾了「開啟簡訊驗證」之後手機號才變必填，星號要跟著即時出現'],
]

window.renderFormPage = () => guidePage({
  slug: 'form',
  title: '表單 Form',
  intro: '一堆欄位怎麼排成一張表單：標籤在哪、必填怎麼標、一行放幾個、什麼時候驗證。單一欄位長什麼樣在「輸入框 Input」，篩選用的那一列在「搜尋篩選列 SearchForm」。正式後台為 <code>el-form</code> / <code>el-form-item</code>，59 個 view 在用。',
  sections: [
    {
      heading: '一張表單的骨架',
      body: `${layoutDemo()}
        <p class="component-description">由上到下三層固定：<strong>分區標題 → 欄位格線 → footer</strong>。分區標題 14px／600，與組合範例的 <code>.example-settings-heading</code> 同一個值——它只是在長表單裡給眼睛一個落點，不要再包一層框，也<strong>不該比卡片標題還重</strong>（正式後台用的是 20px 粗體品牌色，原型統一成與其他卡片小節一致的大小）。</p>
        <p class="component-description">欄位排版<strong>直接用既有的 <code>.guide-fields</code> / <code>.guide-field</code></strong>，不自己排一套——guide-page.css 的註解本來就寫著這句。欄數<strong>照正式後台的 <code>:sm="12" :md="8" :lg="6" :xl="4"</code></strong>，斷點也用 Element Plus 的，移植時直接寫 el-col 就是同一個結果。全站的頁面、卡片、規範頁示範都是這一套，不得在個別頁面改欄數。</p>
        ${decisionTable(COLUMNS, ['視窗寬度', '每排欄數', '對應 el-col'])}
        <p class="component-description"><strong>欄寬固定，一列不夠就留空，不平分拉寬。</strong>同一頁的每張卡片因此欄寬都一樣、上下對齊；一張卡片只有一兩個欄位時，它們仍是一欄寬，不會被拉滿整列。先前用 <code>auto-fit</code> 配每欄最小 220px，寬螢幕會排到 7、8 欄（正式後台最多 6 欄），單一欄位還會被拉到整列寬。</p>
        <p class="component-description"><strong>彈窗固定 2 欄</strong>（手機 1 欄）：彈窗是固定規格寬度，不跟視窗走，照視窗斷點會在 640px 的彈窗裡排出 6 欄。</p>
        <p class="component-description">需要整行的欄位（備註、說明、上傳）直接佔滿一列，不要讓它跟短欄位擠在同一行——高度不一樣，底線就會對不齊。多行文字（<code>textarea</code>）的欄位自動佔滿；其他要整行的欄位在 <code>.guide-field</code> 加 <code>is-full</code>（對應 el-col <code>:span="24"</code>）。</p>
        <p class="component-description">footer 一律靠右、取消在前、主要操作在後，與彈窗 footer 同一條規則。按鈕沿用語意樣式：取消 <code>btn-neutral</code>、儲存 <code>btn-search</code>。</p>`,
    },
    {
      heading: '標籤與必填',
      body: `<p class="component-description"><strong>標籤一律在欄位上方</strong>（<code>label-position="top"</code>，正式後台 77 處都是這樣）。靠左的標籤要先決定一個寬度，而中文、英文、越南文的欄位名長度差很多——定死會截斷，定寬會在短標籤旁邊留一大塊空白。標籤在上方就沒有這個問題，而且窄螢幕不必換排法。</p>
        ${decisionTable(REQUIRED, ['情境', '怎麼標', '為什麼'])}
        <p class="component-description">星號用既有的 <code>&lt;span class="required-mark" aria-hidden="true"&gt;</code>，顏色與錯誤文字同一支紅（<code>--input-error</code>），整站只有 guide-page.css 一處定義。標籤用 <code>&lt;label for&gt;</code> 連到欄位，點標籤要能聚焦到欄位；必填同時加 <code>aria-required="true"</code>——星號是紅色的字元，報讀器不一定唸得出它的意思。</p>`,
    },
    {
      heading: '什麼時候驗證',
      body: `${decisionTable(TIMING, ['時機', '驗什麼', '為什麼'])}
        <p class="component-description">錯誤訊息是<strong>欄位下方的行內文字</strong>（<code>&lt;small class="error-text"&gt;</code>），欄位本身加 <code>.guide-input.is-error</code>（紅框加一圈淡紅光暈）、<code>aria-invalid="true"</code>，並以 <code>aria-describedby</code> 連回錯誤文字。<strong>這三個名字整站只有這一組</strong>，不得再發明 is-invalid 之類的第二個名字。<strong>不得用 Toast</strong>：Toast 會消失，使用者回頭找不到是哪一格。全站只有這一個行內錯誤樣式。</p>
        <p class="component-description">訊息要說<strong>怎麼改</strong>，不是說「格式錯誤」：寫「密碼至少 8 碼，需含英文與數字」，不要寫「密碼不符合規則」。欄位空白時的訊息統一是「此欄為必填」，不必每個欄位各寫一句。</p>`,
    },
    {
      heading: '送出失敗要把畫面帶到錯誤的地方',
      body: `<div class="guide-pair">
          <div class="is-bad"><h4>${icon('cancelCircle')}不要</h4><p>驗證失敗就只是不送出。新增會員那張表單有十幾個欄位，第一個錯誤很可能在畫面外——使用者按了儲存，畫面完全沒動，只能自己往上捲去找哪一格是紅的。</p></div>
          <div class="is-good"><h4>${icon('checkCircle')}要</h4><p>捲到<strong>第一個</strong>出錯的欄位並聚焦它，讓錯誤訊息出現在視線內。有分頁籤的表單還要先切到那一個頁籤——錯誤藏在沒開的頁籤裡，跟沒有提示是一樣的。</p></div>
        </div>
        <p class="component-description"><strong>這一條是原型主動補的</strong>：正式後台 0 處 <code>scrollToField</code>，59 個 view 的送出都只是 <code>validate()</code> 判斷真假。原型的「組合範例－表單頁」已經在做——送出失敗時 <code>focus()</code> 第一個 <code>.guide-input.is-error</code>，瀏覽器會順帶把它捲進畫面；這一頁只是把它寫成全站規則。移植時用 EP 的 <code>formRef.scrollToField(prop)</code>，或在 <code>validate</code> 的失敗回呼裡取 <code>fields</code> 的第一個 key。</p>
        <p class="component-description">捲動之外不加別的回報：<strong>不要再補一則「請檢查欄位」的 Toast</strong>。錯誤已經寫在欄位下方，Toast 只是把同一件事再說一次，而且它會蓋住剛捲到的那一格。</p>`,
    },
    {
      heading: '離開前的守衛',
      body: `<p class="component-description">表單有未儲存的變更時，<strong>切換頁籤、切換側欄、關閉彈窗都要先問</strong>，用置中彈窗而不是瀏覽器原生的 confirm。判準是「使用者會不會弄丟自己打的字」——會，就要問。</p>
        <p class="component-description"><strong>沒有改過就不要問。</strong>只是打開看看就被攔一次，下次使用者就會養成無視這個彈窗的習慣，真的要救他的時候也一樣點掉。比對的是「現在的值」與「載入時的值」，不是「有沒有聚焦過欄位」。</p>
        <p class="component-description">動線示範在「組合範例－表單頁」（新增會員）與「組合範例－設定」（分站設定的頁籤守衛）。</p>`,
    },
  ],
  tokens: [
    ['欄位容器', '.guide-fields'],
    ['單一欄位', '.guide-field'],
    ['標籤位置', '欄位上方'],
    ['標籤', '12px / 650 / var(--text)'],
    ['標籤最小高度', '18px（兩行標籤不會把隔壁欄位頂歪）'],
    ['標籤與欄位間距', '4px'],
    ['必填星號', '標籤右側，var(--input-error)'],
    ['每排欄數', '1／2／3／4／6（斷點 768／992／1200／1920px，同 el-col）'],
    ['欄寬', '固定，一列不夠留空，不平分拉寬'],
    ['彈窗內', '固定 2 欄，手機 1 欄'],
    ['整行欄位', 'textarea 自動整行；其他加 .is-full'],
    ['欄距', '直 12px／橫 16px'],
    ['欄位高度', '32px（與全站控制一致）'],
    ['分區標題', '14px / 600 / var(--text)'],
    ['分區下方間距', '12px'],
    ['錯誤欄位', '.guide-input.is-error'],
    ['錯誤文字', 'small.error-text，12px / var(--input-error)'],
    ['說明文字', 'small，12px / var(--text-muted)'],
    ['驗證時機', 'blur 驗單格、submit 驗整張'],
    ['footer 對齊', '靠右，取消在前'],
  ],
  rules: [
    ['標籤一律在欄位上方', '靠左標籤要先定一個寬度，而各語系的欄位名長度差很多——定死會截斷，定寬會留白。'],
    ['只標必填，不標選填', '一張表單通常選填比必填多，標選填等於每一行都多一塊雜訊。'],
    ['blur 驗單格，submit 驗整張', '還在打字時不要跳紅字；一進頁面什麼都不驗，空白表單整片紅字是在罵還沒開始填的人。'],
    ['錯誤訊息用行內文字，不用 Toast', 'Toast 會消失，使用者回頭找不到是哪一格。全站只有 error-text 一個行內錯誤樣式。'],
    ['訊息要說怎麼改', '寫「密碼至少 8 碼，需含英文與數字」，不要寫「密碼不符合規則」。'],
    ['送出失敗要捲到第一個錯誤', '畫面不動等於沒有回報。有頁籤的表單要先切到錯誤所在的那一頁籤。'],
    ['捲動之外不補 Toast', '錯誤已經在欄位下方，Toast 只是重複，而且會蓋住剛捲到的那一格。'],
    ['欄數照正式後台，欄寬固定', '視窗 768／992／1200／1920px 起各排 2／3／4／6 欄，彈窗固定 2 欄。一列不夠就留空，不把欄位拉寬；全站不得在個別頁面改欄數。'],
    ['整行的欄位自己佔一列', '備註、說明、上傳跟短欄位擠在同一行時高度不一樣，底線會對不齊。'],
    ['改過才攔截離開', '只是打開看看就被攔一次，使用者下次會無視這個彈窗，真的要救他時也一樣點掉。'],
    ['footer 靠右、取消在前', '與彈窗 footer 同一條規則，整站的確認動作位置一致。'],
  ],
})
