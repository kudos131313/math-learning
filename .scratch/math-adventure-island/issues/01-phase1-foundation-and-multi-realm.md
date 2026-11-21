Status: ready-for-agent
Phase: Phase 1
Blocked by: none

# [01] Phase 1：主分頁升格、多海域架構與 v2 存檔遷移

## 目標說明

將「九九乘法冒險島」正式升格為數字積木屋頂部第 5 主分頁「🗺️ 數學冒險島」，重構世界資料模型為「海域（Realm）→ 島嶼（Island）→ 關卡（Stage）」三層架構，並建立 `math_adventure_v2` 存檔與 `v1 → v2` 自動無縫遷移、跨題型結構化救援案件（`RescueCase`）骨架、單一星星幣（StarCoin）帳本與家長 JSON 備份匯出／匯入功能。

本階段完成後，既有「九九乘法奇幻群島」5 島 15 關須可在新架構下完整遊玩，且另兩個新海域（陽光加減群島、雲端應用王國）在地圖航行選單上可顯示「即將啟航／敬請期待」預覽牌（或由 Phase 2a / 2b 接續填入）。

## 相關領域文件

- [spec.md](../spec.md)（第 1、2、3.1、5.4、6.1、7 章）
- [GLOSSARY.md](../../../GLOSSARY.md)
- [ADR-0001](../../../docs/adr/0001-promote-adventure-island-and-multi-realm-world.md)
- [ADR-0002](../../../docs/adr/0002-dual-track-codex-and-structured-rescue-cases.md)
- [ADR-0003](../../../docs/adr/0003-save-v2-migration-starcoin-and-low-stress-retention.md)

## 涉及檔案清單

- **導覽與 HTML 版面**：
  - `index.html`（頂部 `<nav>` 新增第 5 主分頁「數學冒險島」，引入獨立 `partials/panel-quest.html`）
  - `partials/panel-mul.html`（移除 `subtab-mul-quest` 重複子分頁；探索台與測驗加入「前往冒險島實戰 →」傳送鈕）
  - `partials/subpanel-mul-quest.html` ➔ 遷移／重新命名為 `partials/panel-quest.html`（全螢幕舞台、海域航行切換列與 3 位數鍵盤預留支援）
  - `partials/dialogs-quest.html`（家長工具新增 JSON 匯出與匯入區塊）
- **純函式領域與存檔遷移**：
  - `src/domain/quest-data.js`（新增 `REALMS` 定義、跨海域 ID 查詢與相容舊關卡 ID `1-1`～`5-3`）
  - `src/domain/quest-questions.js`（新增 `STORAGE_KEY_V2 = 'math_adventure_v2'`、`migrateV1ToV2`、`normalizeSaveDataV2`、結構化 `RescueCase` 操作與去重／18 筆上限、星星幣首通／每日重玩上限結算函式）
- **應用控制與樣式**：
  - `js/core.js`（主分頁陣列加入 `'quest'`；`switchSubTab('mul', 'quest')` 轉導相容）
  - `js/app.js`、`src/main.js`、`js/mul-quest.js`（重新命名或拆出主冒險控制器，與海域切換 UI 對接）
  - `css/mul-quest.css`（新增海域航行標籤列、星星幣 HUD 膠囊與家長匯出匯入樣式）
- **測試**：
  - `tests/quest-engine.test.js`（新增 `v1 → v2` 遷移、JSON 匯入驗證、`RescueCase` 上限 18 筆與星星幣結算測試）

## 驗收標準（Acceptance Criteria）

1. 頂部主導覽列出現第 5 主分頁「數學冒險島」，「九九乘法表」內不再有重複的「乘法冒險闖關」子分頁，點擊探索台／測驗的傳送鈕可切入數學冒險島的九九乘法奇幻群島。
2. 既有的「九九乘法奇幻群島」5 島 15 關、81 格 9×9 乘法寶石牆、5 隻守護小精靈與必殺技運作完全正常，且舊版 `math_mul_quest_v1` 存檔會自動遷移至 `math_adventure_v2`（原 `v1` 鍵不刪除），所有星星、寶石、造型與老探險家歡迎星星幣皆正確到位。
3. 錯題儲存已改為結構化 `RescueCase`（上限 18 筆），救出後正確扣減佇列並發放星星幣。
4. 家長視窗可匯出有效 JSON 備份檔並透過匯入還原進度；上傳損毀或無效 JSON 時顯示友善錯誤並保護現有存檔不受破壞。
5. `npm test` 與 `npm run build` 皆通過，並完成實機瀏覽器導覽與地圖切換驗證。

## Comments
- 初始建立任務單（由 `/grill-with-docs` 規格拆解產出）。
- 使用者已審閱規格書並確認無誤，正式啟動 Phase 1 實作。
- Phase 1 已完成實作與驗證（`vitest` 5 檔 40 測試全數通過、`vite build` 建置成功、Chrome 實機跨斷點畫面／海域導覽／`v1→v2` 遷移／JSON 匯入匯出備份／`window.runSelfTest()` 13 項全數 PASS）。
