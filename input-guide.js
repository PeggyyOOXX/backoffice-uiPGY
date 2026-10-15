// 移植：el-input。高度 34px、圓角 7px 需覆寫 EP 預設。詳見 ELEMENT-PLUS-MAPPING.md
// 內容由 index.html 原本的「樣式規範」拆出，一字未改。
import { guidePage } from './guide-page.js'
import './guide-page.css'
import './input-guide.css'

window.renderInputPage = () => guidePage({
  slug: 'input',
  title: '輸入框 Input',
  intro: '依 101 BEST Backoffice 實際元件盤點，統一桌機與手機輸入體驗。手機（720px 以下）的輸入高度與桌機相同 34px；篩選列的字級維持 16px，因為 iOS Safari 對 16px 以下的輸入欄位會在聚焦時自動放大整頁。',
  sections: [
    {
      heading: '金額輸入 AmountInput',
      body: `<p class="component-description">正式後台有獨立的 <code>AmountInput.vue</code>（4 個 view 在用）。金額不是一般數字欄位，它有自己的格式化與驗證規則。</p>
        <div class="guide-stage">
          <div class="guide-fields">
            <div class="guide-field"><label for="amount-demo-1">單筆上限</label><input id="amount-demo-1" class="guide-input amount-input" value="50,000" inputmode="decimal"><small>輸入時不顯示千分位，失焦後補上</small></div>
            <div class="guide-field"><label for="amount-demo-2">手續費率</label><div class="affix-input"><input id="amount-demo-2" class="guide-input" value="1.5" inputmode="decimal"><span>%</span></div><small>百分比用後綴，不要寫在 Label 裡</small></div>
            <div class="guide-field"><label for="amount-demo-3">調整金額</label><div class="affix-input"><span>$</span><input id="amount-demo-3" class="guide-input amount-input" value="-1,200" inputmode="decimal"></div><small>可為負值時幣別用前綴</small></div>
          </div>
        </div>
        <table class="input-amount-table">
          <thead><tr><th>規則</th><th>做法</th></tr></thead>
          <tbody>
            <tr><td>千分位</td><td>輸入時不加，失焦後補上；送出前去掉</td></tr>
            <tr><td>小數位</td><td>依幣別固定，不讓使用者自由輸入第三位</td></tr>
            <tr><td>負值</td><td>只有「調整」類欄位允許；一般金額用 <code>min="0"</code></td></tr>
            <tr><td>幣別與單位</td><td>用前綴／後綴，不要寫進 Label 或 placeholder</td></tr>
            <tr><td>對齊</td><td>表格內靠右，並用 <code>font-variant-numeric: tabular-nums</code> 讓位數對齊</td></tr>
            <tr><td>鍵盤</td><td><code>inputmode="decimal"</code>，手機才會跳數字鍵盤</td></tr>
          </tbody>
        </table>`,
    },
  ],
  // 這些內容本來就是頁面層級的 section，不再包一層卡。
  raw: `<section class="input-guide-grid">
        <article class="card input-spec"><h3>預設／Placeholder</h3><label>會員帳號</label><input class="guide-input" placeholder="請輸入會員帳號"><small>Placeholder：14px／400／#98A2B3</small></article>
        <article class="card input-spec"><h3>已輸入</h3><label>會員帳號</label><input class="guide-input" value="member_10188"><small>輸入文字使用一般正文色，不使用 Placeholder 色。</small></article>
        <article class="card input-spec"><h3>Focus</h3><label>會員帳號</label><input class="guide-input demo-focus" value="member_10188"><small>品牌色邊框＋3px 淺色 Focus ring。</small></article>
        <article class="card input-spec"><h3>Disabled／檢視模式</h3><label>平台名稱</label><input class="guide-input" value="101 BEST" disabled><small>用於無權限、條件未滿足及專案目前的檢視模式。</small></article>
        <article class="card input-spec"><h3>Readonly</h3><label>系統識別碼</label><input class="guide-input" value="USR-1009821" readonly><small>資料可閱讀及複製，但不可編輯。</small></article>
        <article class="card input-spec"><h3>Error</h3><label>代理帳號</label><input class="guide-input is-error" value="ab"><small class="error-text">帳號至少需要 3 個字元</small></article>
        <article class="card input-spec"><h3>Loading</h3><label>會員帳號</label><div class="input-loading"><input class="guide-input" value="正在取得資料" disabled><i></i></div><small>對應專案 v-loading 狀態，載入時不可操作。</small></article>
        <article class="card input-spec"><h3>字數限制</h3><label>標題</label><div class="counted-input"><input class="guide-input" value="活動公告"><span>4 / 20</span></div><small>對應 maxlength 與 show-word-limit。</small></article>
        <article class="card input-spec"><h3>密碼</h3><label>密碼</label><div class="affix-input"><input class="guide-input" type="password" value="password"><span data-icon="view"></span></div><small>對應登入頁 show-password 顯示／隱藏操作。</small></article>
        <article class="card input-spec"><h3>前後綴</h3><label>手續費</label><div class="affix-input"><span>$</span><input class="guide-input" value="1,200"><span>%</span></div><small>用於幣別、百分比與單位提示。</small></article>
        <article class="card input-spec"><h3>數字／金額</h3><label>金額範圍</label><div class="amount-range-control"><input class="guide-input" placeholder="最低"><span>～</span><input class="guide-input" placeholder="最高"></div><small>對應 AmountInput，限制數字、14 位整數及 2 位小數。</small></article>
        <article class="card input-spec"><h3>Textarea</h3><label>備註</label><textarea class="guide-input guide-textarea" placeholder="請輸入備註"></textarea><small>多行內容與字數統計保留底部空間。</small></article>
      </section>
<section class="card input-standard-intro"><h2>Input Foundations</h2><p>所有輸入元件沿用相同的 Label、邊框、圓角、Focus、錯誤與 Disabled 規則。手機版不另造外觀，只調整排列與觸控範圍。</p><p>下拉選單、日期、Switch／Radio／Checkbox、圖片上傳與內容編輯各有自己的規範頁，這裡不重複示範——同一個元件只在一個地方定義。</p></section>
      <section class="input-standard-grid">
        ${[
          [
            "一般文字輸入",
            "帳號、姓名、代理帳號與一般關鍵字。",
            `<input class="guide-input" placeholder="請輸入會員帳號">`,
          ],
          [
            "搜尋／可清除",
            "列表搜尋、遊戲名稱與 UID 查詢。",
            `<div class="affix-input"><span data-icon="search"></span><input class="guide-input" value="ava_chen"><span data-icon="close"></span></div>`,
          ],
          [
            "密碼",
            "登入密碼、交易密碼及確認密碼。",
            `<div class="affix-input"><input class="guide-input" type="password" value="password"><span data-icon="view"></span></div>`,
          ],
          [
            "數字／金額",
            "金額、比率、權重與上下限。",
            `<div class="amount-range-control"><input class="guide-input" placeholder="最低"><span>～</span><input class="guide-input" placeholder="最高"></div>`,
          ],
          [
            "前綴／後綴",
            "幣別、百分比及固定單位。",
            `<div class="affix-input"><span>$</span><input class="guide-input" value="1,200"><span>%</span></div>`,
          ],
          [
            "Textarea",
            "備註、描述、拒絕原因與訊息內容。",
            `<textarea class="guide-input guide-textarea" placeholder="請輸入備註"></textarea>`,
          ],
        ]
          .map(
            (item) =>
              `<article class="card input-standard-card"><h3>${item[0]}</h3><p>${item[1]}</p><div class="input-demo-row"><div><label>Desktop · 34px</label>${item[2]}</div><div class="input-demo-mobile"><label>Mobile · 同元件規格</label>${item[2]}</div></div></article>`,
          )
          .join("")}
      </section>
      <section class="card input-standard-tokens"><h2>共用規格</h2><table><thead><tr><th>項目</th><th>Desktop</th><th>Mobile</th><th>原則</th></tr></thead><tbody><tr><td>Input 高度</td><td>34px</td><td>34px</td><td>外觀一致；複雜觸控元件可增加外部點擊區</td></tr><tr><td>字級／字重</td><td>14px / 400</td><td>14px / 400</td><td>Label 12px，Placeholder 不取代 Label</td></tr><tr><td>左右內距</td><td>9–10px</td><td>9–10px</td><td>箭頭及尾綴固定距右側 9px</td></tr><tr><td>圓角</td><td>7px</td><td>7px</td><td>所有文字、數字、日期及 Select 統一</td></tr><tr><td>狀態</td><td colspan="2">Default / Hover / Focus / Filled / Disabled / Readonly / Error / Loading</td><td>錯誤不可只靠顏色，必須附文字</td></tr></tbody></table></section>
<section class="card token-table"><h2>Input／Select Token</h2><div><span>高度（Desktop）</span><strong>34px</strong><span>高度（Mobile）</span><strong>34px</strong><span>字級／字重</span><strong>14px / 400</strong><span>水平內距</span><strong>9px</strong><span>箭頭右距</span><strong>9px</strong><span>圓角</span><strong>7px</strong><span>Placeholder</span><strong>#98A2B3</strong><span>錯誤色</span><strong>#DD3340</strong></div></section>
<section class="card guide-rules"><h2>使用規則</h2><div class="rule-grid"><div><strong>一個主要焦點</strong><p>同一操作區避免同時出現兩個實心主要按鈕。</p></div><div><strong>Placeholder 不取代 Label</strong><p>Placeholder 只提供格式或輸入提示，輸入後仍應看得到欄位名稱。</p></div><div><strong>多語系自適應</strong><p>Label 可換行、Input 保持對齊；元件不可用固定文字寬度裁切翻譯。</p></div><div><strong>狀態不能只靠顏色</strong><p>錯誤需搭配文字；Loading、Disabled 與 Readonly 必須有明確視覺差異。</p></div></div></section>`,
})
