Status: ready-for-agent
Phase: Phase 4
Blocked by: 02, 03, 04

# [05] Phase 4：無盡試煉塔、魔王故事冊、四教室雙向連動與全站最終驗證

## 目標說明

完成數學冒險島最終拼圖：實裝重複挑戰終局模式「🗼 **無盡試煉塔**」（3 顆愛心無計時生存制、4 條爬塔路線、每 5 層守塔小魔王回心與寶箱、個人最高樓層紀錄）、實裝「👹 **魔王與故事收集冊**」、打通冒險島與「位值／跳數／直式加減／九九乘法」四大教學教室的雙向連動事件與卡關回流導流，並完成全站自動化測試與跨解析度實機瀏覽器驗證。

## 相關領域文件

- [spec.md](../spec.md)（第 2.2、5.3、6.6、9 章）
- [GLOSSARY.md](../../../GLOSSARY.md)

## 涉及檔案清單

- **領域資料與無盡試煉塔引擎**：
  - `src/domain/quest-data.js`（15 位魔王簡介與 12 個生活故事插畫收集條目）
  - 新增試煉塔題目與難度階梯純函式模組（如 `src/domain/quest-tower.js`）：支援 4 條路線（`all` / `sunny` / `mul` / `word`）、依樓層遞進抽取題型與切換分步／一步直解、每 5 層生成守塔小魔王
- **UI 與雙向連動**：
  - `partials/panel-quest.html`、`partials/dialogs-quest.html`（無盡試煉塔入口與愛心／樓層 HUD；圖鑑新增「魔王與故事收集冊」頁籤）
  - `js/learn.js`、`js/quiz.js`、`js/seq.js`、`js/seq-quiz.js`、`js/calc.js`、`js/calc-quiz.js`、`js/mul.js`、`js/mul-quiz.js`（發出統一 `classroomPractice` 練習連動事件，並接收冒險島卡關跳轉與建議預設參數）
  - 冒險島戰鬥與結算介面（卡關提示增加「回對應教學教室用積木練習」快速跳轉按鈕）
- **測試與驗收**：
  - `tests/` 新增無盡試煉塔樓層難度曲線、守塔回心上限（≤ 3）、最高樓層更新與四教室每日獎勵上限測試
  - 檢查 `js/diagnostics.js` 自檢模組是否需同步支援新版主分頁結構

## 驗收標準（Acceptance Criteria）

1. 無盡試煉塔支援 4 條路線，初始 3 顆愛心且無倒數計時壓迫；每 5 層固定登場守塔小魔王，擊敗可補回 1 顆愛心（不超過 3 顆）並領星星幣寶箱；樓層難度隨層數上升（高層切換為一步直解兩步驟應用題），錯題同樣進入救援案件。
2. 魔王與故事收集冊正確追蹤已擊敗之 15 位魔王與解鎖的 12 個生活故事章節。
3. 四大教學教室完成練習會即時更新冒險島每日暖身委託與每日額外星星幣（每日上限 +15）；冒險島卡關引導可準確導流至對應教學教室。
4. 全站 `npm test` 全部通過、`npm run build` 無錯誤或資源缺失。
5. 使用瀏覽器於電腦（`1280×800`）與平板（橫／直向）視窗執行實機端到端檢查，確認三大海域航行、戰鬥對戰、秘密樹屋、無盡試煉塔、圖鑑與家長匯出匯入皆正常運作（不支援手機窄螢幕）。

## Comments
- 初始建立任務單（由 `/grill-with-docs` 規格拆解產出）。
- 2026-11-21：已標記為 `ready-for-agent` 並完成 Phase 4 全部實作與驗證：
  1. 領域層：`src/domain/quest-data.js` 補齊 15 位魔王簡介與 12 則生活故事貼紙資料；`src/domain/quest-tower.js` 完成無盡試煉塔純函式引擎（4 條路線 `all`/`sunny`/`mul`/`word`、3 顆愛心無計時生存、樓層階梯與每 5 層守塔小魔王寶箱 `+25 🪙`＋回補 `1 ❤️`）；`src/domain/quest-questions.js` 完成收集冊統計同步、題目故事匹配與教室精準回流解析；`src/domain/quest-retention.js` 實裝 `applyClassroomPracticeReward`（每日上限 `+15 🪙`、推進 `w_classroom3` / `c_tower5`）。
  2. UI 與四教室連動：完成 `svg-art.js`（12 款繪本貼紙 SVG）、`partials/panel-quest.html` / `dialogs-quest.html` / `panel-learn.html` / `panel-seq.html` / `panel-calc.html`、`src/quest/dialogs.js`、`calc-ui.js`、`cloud-ui.js`、`js/learn.js`、`quiz.js`、`seq.js`、`seq-quiz.js`、`calc.js`、`calc-quiz.js`、`mul.js`、`mul-quiz.js`、`mul-quest.js`、`css/mul-quest.css` 與 `js/diagnostics.js`。
  3. 驗證：`npx vitest run tests/` 全站 9 檔 70 項測試通過；`npm run build` 成功無錯；無頭 Chrome 實機 CDP（`1280×800`、`1024×768`、`768×1024`）檢查 `window.runSelfTest()` 13/13 通過、教室星幣上限鎖定 15、收集冊 15/12 正確渲染、試煉塔紫金 HUD／連錯 2 次導流帶參回教室／答對升層／主動結算／無水平溢位全數通過。
