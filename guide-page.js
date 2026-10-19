// 元件規範頁的共用外殼。所有規範頁都從這裡產生，骨架才不會各寫各的。
//
// 標準以「頁籤 Tabs」為準，由 guide-skeleton.cjs 驗證：
//   <div class="style-guide xxx-page">
//     <div class="guide-section-heading"><h2>標題</h2><p class="component-description">…</p></div>
//     <section class="card xxx-guide"><h3>小節</h3>…</section>   ← 內距由 xxx-guide 提供
//     <section class="card token-table xxx-token"><h2>共用規格</h2>…</section>
//     <section class="card guide-rules"><h2>使用規則</h2><div class="rule-grid">…</div></section>
//   </div>
//
// 注意 .card 本身沒有內距，內距一律由頁面自己的 class 給；少掛那個 class，
// 卡片就會變成內容貼著邊框、看起來像沒有卡片。

/**
 * 規格數值以 rem 為主、px 為輔：`16px` → `1rem(16px)`，換算為 px ÷ 16。
 * `42 × 24px`、`12 / 14 / 16px` 這種共用單位的寫法會先展開成每個數字各帶 px 再換算。
 * 1–2px 是框線與分隔線，CSS 裡本來就寫 px，原樣保留；已經是 `1rem(16px)` 的不再換一次。
 */
export function remPx(text) {
  return String(text)
    .replace(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?)px/g, '$1px × $2px')
    // 前一項已帶 px 的（例如 `14px / 700 / 16px` 的字重 700）不是共用單位的清單
    .replace(/(?<![\w.])(?<!px \/ )(?:\d+(?:\.\d+)? \/ )+\d+(?:\.\d+)?px/g, m =>
      m.split(' / ').map(n => (n.endsWith('px') ? n : `${n}px`)).join(' / '))
    // outline-offset 屬於框線類，CSS 裡維持 px
    .replace(/(?<![\w.#-])(?<!rem\()(?<!offset )(\d+(?:\.\d+)?)px\b/g, (m, n) =>
      Number(n) <= 2 ? m : `${Number((n / 16).toFixed(4))}rem(${n}px)`)
}

// 有些頁把規格表直接寫成 `<section class="card token-table">`（或 Input 的 input-standard-tokens），
// 沒有走 tokens 參數。這裡把那些區塊的文字一併換成 rem(px)，只動文字節點，不碰屬性。
const remPxSpecBlocks = html =>
  html.replace(/<section class="card (?:token-table|input-standard-tokens)[^"]*">[\s\S]*?<\/section>/g, block =>
    block.replace(/>([^<]+)</g, (_, text) => `>${remPx(text)}<`))

/**
 * @param slug     頁面代號，產生 `${slug}-page`、`${slug}-guide`、`${slug}-token` 三個 class
 * @param title    標題，與側欄項目同名
 * @param intro    標題下的一段說明
 * @param sections [{ heading, body }]，每個是一張卡；heading 省略時不出標題
 * @param tokens   [[名稱, 值], …]，產生「共用規格」；省略則不出這一節
 * @param rules    [[標題, 說明], …]，產生「使用規則」；省略則不出這一節
 * @param raw      已經是 `<section class="card …">` 的片段，原樣接在最後。
 *                 給從舊頁搬過來、本來就寫成頁面層級區塊的內容用，不再包一層。
 */
export function guidePage({ slug, title, intro, sections = [], tokens, rules, raw = '' }) {
  const card = ({ heading, body, cardClass = '' }) =>
    `<section class="card ${slug}-guide${cardClass ? ' ' + cardClass : ''}">${heading ? `<h3>${heading}</h3>` : ''}${body}</section>`

  // raw 裡的 `<section class="card …">` 是從舊頁搬過來的，不一定掛著提供內距的 class
  // （例如 toolbar-demo）。統一補上 `${slug}-guide`，內距才會跟其他卡片一致——
  // .card 本身沒有內距，少掛就會變成內容貼著邊框。token-table 與 guide-rules 自己有內距。
  // 同時把緊接在後的 <h2> 降成 <h3>：那些標題在舊頁是頁面層級的區塊名，
  // 拆成一元件一頁之後它們只是卡片裡的小節，字級要與其他規範頁一致。
  // token-table 與 guide-rules 的 h2 是收尾區塊的標題，保持不動。
  const normalisedRaw = raw.replace(
    /<section class="card(?! [^"]*(?:token-table|guide-rules))([^"]*)">(\s*)<h2>([\s\S]*?)<\/h2>/g,
    (_, rest, space, heading) => `<section class="card${rest} ${slug}-guide">${space}<h3>${heading}</h3>`
  ).replace(
    /<section class="card(?! [^"]*(?:token-table|guide-rules|-guide))([^"]*)"/g,
    (_, rest) => `<section class="card${rest} ${slug}-guide"`
  )

  const tokenTable = tokens?.length
    ? `<section class="card token-table ${slug}-token">
        <h2>共用規格</h2>
        <div>${tokens.map(([label, value]) => `<span>${label}</span><strong>${remPx(value)}</strong>`).join('')}</div>
      </section>`
    : ''

  const ruleGrid = rules?.length
    ? `<section class="card guide-rules">
        <h2>使用規則</h2>
        <div class="rule-grid">${rules.map(([heading, text]) => `<div><strong>${heading}</strong><p>${text}</p></div>`).join('')}</div>
      </section>`
    : ''

  return `<div class="style-guide ${slug}-page">
    <div class="guide-section-heading">
      <h2>${title}</h2>
      <p class="component-description">${intro}</p>
    </div>
    ${remPxSpecBlocks(sections.map(card).join('') + normalisedRaw)}
    ${tokenTable}
    ${ruleGrid}
  </div>`
}

/** 決策表：什麼時候用這個、什麼時候改用別的。欄位固定三欄。 */
export const decisionTable = (rows, headers = ['情境', '用什麼', '為什麼']) =>
  `<div class="table-wrap"><table class="guide-decision-table">
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(cells => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`
