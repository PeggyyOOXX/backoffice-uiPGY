// 移植：el-date-picker（正式後台 SearchForm.vue 已在用）。快捷選項以正式後台的 7 個為準。
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
    raw: `<section class="card date-picker-guide"><h3>互動範例</h3><p>點擊欄位開啟日曆，可選起訖日期與時間，或使用本日、本週、本月快捷選項。本週為週一至週日。</p><div class="date-range-host" data-date-range></div><div class="date-picker-rules"><span>清空：中性灰 #a3a3a3，移除已選條件</span><span>確認：主要色 #1596AD，套用選取區間</span><span>按鈕：桌面 34px／手機 42px，圓角 7px</span><span>欄位顯示日期；完整時間保留至秒</span></div></section>`,
    tokens: [
      ["欄位高度", "34px"],
      ["欄位圓角", "7px"],
      ["面板圓角", "8px"],
      ["快捷選項", "以正式後台的 7 個為準"],
      ["選取區間", "主題綠 #1596AD"],
      ["按鈕高度", "桌機 34px / 手機 42px"],
      ["欄位顯示", "日期；完整時間保留至秒"],
      ["關閉", "Esc、點外面、確認"],
      ["最小寬度", "單一欄位，不拆成兩個"],
      ["無障礙", "可鍵盤操作，方向鍵移動日期"],
    ],
    rules: [
      [
        "一律使用共用元件",
        "不得使用原生 input[type=date] 或自行仿製；彈窗內也掛同一個元件。",
      ],
      [
        "搜尋列維持單一欄位",
        "不要拆成「開始日期」「結束日期」兩個欄位，使用者要比對兩次。",
      ],
      [
        "快捷選項以正式後台為準",
        "原型只有 3 個，正式後台有 7 個；移植時以正式後台為準。",
      ],
      ["欄位顯示日期即可", "完整時間保留至秒，但欄位上不必全部顯示。"],
      ["要能鍵盤操作", "方向鍵移動日期、Enter 選取、Esc 關閉。"],
      ["不得另設配色與尺寸", "欄位沿用 Input 規範的 34px 與 7px 圓角。"],
    ],
  });
