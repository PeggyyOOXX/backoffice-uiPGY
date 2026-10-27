// 移植：el-date-picker（正式後台 SearchForm.vue 已在用）。快捷區間與正式後台同樣是 7 個。
// 詳見 ELEMENT-PLUS-MAPPING.md。內容由 index.html 原本的「樣式規範」拆出，一字未改。
import { guidePage } from "./guide-page.js";
import "./guide-page.css";

window.renderDatePickerPage = () =>
  guidePage({
    slug: "date-picker",
    title: "日期 DatePicker",
    intro:
      "搜尋列維持單一欄位，展開後選擇完整日期與時間。日期欄位一律使用共用元件，不得使用原生 input[type=date] 或自行仿製；彈窗內也掛同一個元件。",
    sections: [
      {
        heading: "純時間選擇 Time Select",
        body: `<p class="component-description">只選時間、不選日期。正式後台用 <code>el-time-select</code>，出現在<strong>返水設定</strong>的結算時間（<code>rebateSettings/index.vue</code> 與 <code>edit.vue</code>）。</p>
        <div class="guide-stage">
          <div class="guide-fields">
            <div class="guide-field"><label for="time-demo-1">結算時間</label><select id="time-demo-1" class="guide-select"><option>00:00</option><option selected>04:00</option><option>08:00</option><option>12:00</option><option>16:00</option><option>20:00</option></select><small>固定間隔的選項，不是自由輸入</small></div>
            <div class="guide-field"><label for="time-demo-2">生效起算</label><select id="time-demo-2" class="guide-select"><option selected>每日 00:00</option><option>每週一 00:00</option><option>每月 1 日 00:00</option></select><small>需要說明週期時，把週期寫進選項文字</small></div>
          </div>
        </div>
        <p class="component-description">與日期區間的差別：時間選擇是<strong>設定一個週期性的時點</strong>（每天幾點結算），日期區間是<strong>框出一段已經發生的範圍</strong>（查哪幾天的資料）。前者用固定間隔的下拉，後者用日曆——不要用日曆元件來選「每天幾點」。</p>`,
      },
    ],
    raw: `<section class="card date-picker-guide"><h3>互動範例</h3><p>點擊欄位開啟日曆，可選起訖日期與時間，或使用左側的快捷區間。七個快捷區間與正式後台一致：今天、昨天、前天、本週、上週、本月、上月；週一為一週的開始。</p><div class="date-range-host" data-date-range></div><div class="date-picker-rules"><span>清空：中性灰 #a3a3a3，移除已選條件</span><span>確認：主要色 #1596AD，套用選取區間</span><span>按鈕：2.125rem(34px)，圓角 0.25rem(4px)</span><span>欄位顯示日期；完整時間保留至秒</span><span>起訖之間用 ~，欄位與面板一致</span></div></section>`,
    tokens: [
      ["欄位高度", "34px"],
      ["欄位圓角", "8px"],
      ["面板圓角", "8px"],
      ["快捷選項", "今天／昨天／前天／本週／上週／本月／上月"],
      ["選取區間", "主題綠 #1596AD"],
      ["按鈕高度", "34px（與全站按鈕相同）"],
      ["欄位顯示", "日期；完整時間保留至秒"],
      ["區間分隔符號", "~（欄位與面板都是）"],
      ["關閉", "Esc、點外面、確認"],
      ["最小寬度", "單一欄位，不拆成兩個"],
      ["無障礙", "可鍵盤操作，方向鍵移動日期"],
    ],
    rules: [
      [
        "起訖之間用 ~，不用箭頭",
        "Element Plus 的面板預設放 ArrowRight，箭頭讀起來像「往後跳一頁」，但這兩格是同一個區間的兩端，不是先後步驟。欄位的 range-separator 與面板內的分隔符號要是同一個字元。",
      ],
      [
        "一律使用共用元件",
        "不得使用原生 input[type=date] 或自行仿製；彈窗內也掛同一個元件。",
      ],
      [
        "搜尋列維持單一欄位",
        "不要拆成「開始日期」「結束日期」兩個欄位，使用者要比對兩次。",
      ],
      [
        "快捷區間就是正式後台那七個",
        "今天、昨天、前天、本週、上週、本月、上月，順序也一樣。不要自己增減——使用者在兩邊按的是同一排。",
      ],
      [
        "手機把兩個月上下排",
        "兩個月並排塞不進手機寬度，EP 預設會把左邊那個月切掉一半。手機改成上下排列，快捷區間則收成可橫向捲動的一排。",
      ],
      ["欄位顯示日期即可", "完整時間保留至秒，但欄位上不必全部顯示。"],
      ["要能鍵盤操作", "方向鍵移動日期、Enter 選取、Esc 關閉。"],
      ["不得另設配色與尺寸", "欄位沿用 Input 規範的 34px 與 8px 圓角。"],
    ],
  });
