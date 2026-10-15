// 規範頁的共用版面骨架斷言，由 icon-check.cjs 與 message-check.cjs 引用。
//
// 標準以「頁籤 Tabs」（tabs-guide.js）為準：
//   <div class="style-guide xxx-page">
//     <div class="guide-section-heading"><h2>標題</h2><p class="component-description">…</p></div>
//     <section class="card xxx-guide"><h3>小節</h3>…</section>
//     <section class="card token-table xxx-token"><h2>共用規格</h2>…</section>
//     <section class="card guide-rules"><h2>使用規則</h2><div class="rule-grid">…</div></section>
//   </div>
//
// 重點：.card 本身沒有內距，內距由頁面自己的 class 給（.tabs-guide{padding:16px}）。
// 少掛那個 class，卡片就會變成內容貼著邊框、看起來像沒有卡片——這支斷言就是在擋這件事。
const assert = require('node:assert/strict')

module.exports = function assertGuideSkeleton(doc, cardClass, title) {
  const page = doc.querySelector('.page > .style-guide')
  assert.ok(page, '最外層缺少 .style-guide')

  const heading = page.querySelector(':scope > .guide-section-heading')
  assert.ok(heading, '缺少 .guide-section-heading')
  assert.ok(heading.querySelector('h2')?.textContent.includes(title), `標題應包含「${title}」`)
  assert.ok(heading.querySelector('.component-description'), '標題下缺少 .component-description')

  const cards = [...page.querySelectorAll(':scope > section.card')]
  assert.ok(cards.length >= 1, '一個區塊都沒有')
  for (const card of cards) {
    const padded = card.classList.contains(cardClass) ||
      card.classList.contains('token-table') || card.classList.contains('guide-rules')
    assert.ok(padded, `section.card 缺少提供內距的 class：${card.className}`)
  }

  // 一般區塊的小節一律 h3；只有 token-table 與 guide-rules 用 h2，與既有規範頁一致。
  for (const card of cards.filter(c => c.classList.contains(cardClass))) {
    assert.equal(card.querySelector('h2'), null, `${card.id || cardClass} 的小節應使用 h3 而非 h2`)
    assert.ok(card.querySelector('h3'), `${card.id || cardClass} 缺少 h3 小節標題`)
  }

  // 共用規格與使用規則是每一頁都該有的收尾，但分開檢查——呼叫端可以先放過
  // 還沒補的頁面，由 render-check.cjs 一次列出缺口，而不是讓結構斷言整個失敗。
  return {
    hasTokens: !!page.querySelector(':scope > section.card.token-table > h2'),
    hasRules: !!page.querySelector(':scope > section.card.guide-rules .rule-grid > div'),
  }
}
