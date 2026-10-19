// 移植：el-switch（CustomSwitch.vue）、el-radio／el-checkbox 與其 group。詳見 ELEMENT-PLUS-MAPPING.md
//
// Switch、Radio、Checkbox 合成一頁，因為它們共用同一個決策——「從有限選項中選一個或多個」。
// 最常見的錯誤是挑錯元件（該用 Radio 的用了 Switch、互斥選項用了 Checkbox），
// 而那個決策只有把三個並排才講得清楚。兩邊的示範內容沿用原模組，不另寫一份。
import { switchBody } from "./switch-layout-guide.js";
import { choiceBody } from "./choice-controls.js";
import { guidePage, decisionTable } from "./guide-page.js";
import "./guide-page.css";
import "./choice-guide.css";

const DECISION = [
  [
    "一個設定的開或關，改了就生效",
    "<strong>Switch</strong>",
    "它代表狀態本身，不需要再按儲存；旁邊不放「確定」",
  ],
  [
    "一個設定的開或關，要按儲存才生效",
    "<strong>Checkbox</strong>",
    "Switch 會讓人以為已經生效了；表單裡的開關一律用 Checkbox",
  ],
  [
    "數個互斥選項擇一（2–6 個）",
    "<strong>Radio</strong>",
    "全部選項同時可見，使用者能一眼比較",
  ],
  [
    "數個互斥選項擇一（超過 6 個）",
    "下拉選單 Dropdown",
    "Radio 會把版面撐長；選項多時改用可搜尋的下拉",
  ],
  [
    "互斥選項但需要說明才選得下去",
    "<strong>選項卡片</strong>",
    "整張可點、已選狀態明顯，適合設定頁的規則選擇",
  ],
  [
    "可複選",
    "<strong>Checkbox</strong>",
    "不要用多個 Switch 排成一列，那看起來像多個獨立設定",
  ],
  [
    "父子層級的全選／部分選取",
    "<strong>Checkbox</strong> + indeterminate",
    "只有 Checkbox 有第三種視覺狀態",
  ],
  [
    "只有兩個選項且互斥，例如「啟用／停用」",
    "Radio 或 Switch",
    "動作會立即生效用 Switch，是表單欄位用 Radio",
  ],
];

window.renderChoiceGuide = () =>
  guidePage({
    slug: "choice",
    title: "選擇控制 Selection",
    intro:
      "從有限選項中選一個或多個。三者的視覺差異很小，但語意完全不同——挑錯元件會讓使用者誤判設定有沒有生效，所以先看決策表再看規格。",
    sections: [
      {
        heading: "先決定用哪一個",
        body: `<p class="component-description">判準是<strong>「改了之後要不要再按儲存」</strong>與<strong>「選項互不互斥」</strong>這兩題，不是哪個比較好看。</p>${decisionTable(DECISION)}`,
      },
      { heading: "開關 Switch", body: switchBody() },
      { heading: "Radio 與 Checkbox", body: choiceBody() },
    ],
    tokens: [
      ["Switch 尺寸", "42 × 24px"],
      ["Switch 與文案間距", "16px"],
      ["Switch 開啟／關閉", "#1596AD／#718087，都是實心"],
      ["Switch Hover", "#117E91／#5C6878"],
      ["Switch 停用・開", "底 #E4F4F7，內描邊 #A9D8E1"],
      ["Switch 停用・關", "底 #F1F3F6，內描邊 #D4DBE4"],
      ["Switch Focus", "3px #1596AD55，offset 3px"],
      ["Switch 旋鈕", "18px 白圓，可操作帶 0 1px 2px 陰影"],
      ["控制尺寸", "16 × 16px"],
      ["選取色", "#1596AD（accent-color）"],
      ["控制與文案間距", "8px"],
      ["文案", "14px / 400，不加粗"],
      ["選項間距", "直排 12px，橫排 12px × 24px"],
      ["Focus", "2px #1596AD 外框，offset 2px"],
      ["卡片外框／圓角", "1px #DCE2EB / 9px"],
      ["卡片內距", "10px"],
      ["卡片已選取", "底 #F0FAFB，框 #69B8C5"],
      ["卡片標題／說明", "14px / 600 與 12px #718096"],
    ],
    rules: [
      [
        "Switch 代表立即生效",
        "旁邊不放「確定」按鈕。需要按儲存才生效的開關一律改用 Checkbox，否則使用者會以為已經改好了。",
      ],
      [
        "關閉不等於停用",
        "可操作的開關一律實心（開主題色、關中性灰），停用一律淡底加內描邊的空心。不可只把關閉的灰調淡當停用——兩個灰只差亮度，使用者會分不出按不按得動。",
      ],
      [
        "停用的開關要說明原因",
        "掛 Tooltip 講清楚為什麼不能改。停用的按鈕不觸發滑鼠事件，data-tooltip 要掛在外層容器上。",
      ],
      [
        "Radio 一定要有預設值",
        "不留全部未選的狀態；真的沒有合理預設時，代表它應該是可清除的下拉。",
      ],
      [
        "複選不要用多個 Switch",
        "一排 Switch 看起來像多個獨立設定；同一題的複選一律用 Checkbox 群組。",
      ],
      [
        "每組用 fieldset 加 legend",
        "legend 說明群組名稱，必填在 legend 後標記；只靠視覺分組螢幕報讀器讀不出來。",
      ],
      [
        "部分選取只用於父階層",
        "indeterminate 代表下層有部分勾選，不是第三種值，不可拿來表示「未設定」。",
      ],
      [
        "錯誤不可只用顏色",
        "必須附文字說明，並以 aria-invalid 與 aria-describedby 連到那段文字。",
      ],
    ],
  });
