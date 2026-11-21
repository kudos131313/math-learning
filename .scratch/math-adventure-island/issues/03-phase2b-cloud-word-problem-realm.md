Status: ready-for-agent
Phase: Phase 2b
Blocked by: 02

# [03] Phase 2b：雲端應用王國（5 島 15 關）、兩步驟引導引擎與全圖鑑補完

## 目標說明

實作第三座高階海域「☁️ **雲端應用王國**」（5 座島嶼、15 個關卡、5 位新島嶼魔王、5 隻新守護小精靈），實作跨海域解鎖門檻（總星數 ≥ 15 或擊敗任 2 位島嶼魔王），補齊跳數密碼與千以內位值謎題關卡、兩步驟生活應用題（先乘後加、先乘後減找零／剩餘）與其「分步引導模式／一步直解模式」雙軌作答體驗、跳數小火車視覺小幫手，並補齊全部 24 張數學技能圖鑑技能卡。

## 相關領域文件

- [spec.md](../spec.md)（第 3.1、3.5、4.2、4.3、4.4、5.2、8 章）
- [GLOSSARY.md](../../../GLOSSARY.md)
- [ADR-0001](../../../docs/adr/0001-promote-adventure-island-and-multi-realm-world.md)
- [ADR-0002](../../../docs/adr/0002-dual-track-codex-and-structured-rescue-cases.md)

## 涉及檔案清單

- **美術資源（繪本底圖）**：
  - `public/assets/quest/world-map-cloud.jpg`
  - `public/assets/quest/bg-station.jpg`、`bg-vault.jpg`、`bg-park.jpg`、`bg-patisserie.jpg`、`bg-skycastle.jpg`
- **純函式領域與題庫**：
  - `src/domain/quest-data.js`（補齊雲端應用王國 5 島 15 關資料與座標、補齊剩餘 14 張技能卡共 24 張）
  - 雲端題庫生成器（複用／協調 `src/domain/sequence-exams.js` 與 `src/domain/number-text.js` 生成跳數與位值題；新增兩步驟先乘後加／先乘後減生活應用題生成器與不變量驗證）
  - `src/domain/quest-questions.js`（實作 `isRealmUnlocked('cloud', saveData)` 跨海域條件檢查、`guided_two_step` / `direct_two_step` 救援案件重建）
- **戰鬥舞台 UI 與 SVG**：
  - `src/quest/svg-art.js`（新增雲端應用王國 5 位魔王與 5 隻小精靈 SVG：雲朵車長狸、金庫小鼴鼠、氣球小企鵝、馬卡龍蜜蜂、星光獨角獸）
  - 戰鬥題卡升級：支援「第 1 步鎖定 ➔ 第 2 步」兩步驟分步引導 UI、跳數小火車視覺小幫手、兩步驟推理框線段小幫手
- **測試**：
  - 擴充單元測試驗證跨海域解鎖門檻（未達標鎖定、15 星解鎖、2 魔王解鎖、預習模式解鎖）、兩步驟應用題數值不變量與 1000 次隨機無負找零、全部 24 張技能卡映射完整

## 驗收標準（Acceptance Criteria）

1. 未達跨海域門檻時，「雲端應用王國」呈現鎖定並清楚顯示尚差星數或魔王數（預習模式可直接解鎖）；達標後順利開放 `cloud:1-1` 至 `cloud:5-3` 全部 15 關。
2. 跳數雲朵車站與積木金庫港的跳數密碼與位值組數關卡（含補零陷阱與最大／最小排數）運作正確，對應的 5 節迷你列車小幫手正常顯示。
3. 森林遊樂園與魔法點心店一般關支援「第 1 步鎖定結果 ➔ 第 2 步完成計算」分步引導；魔王關與星光天空城切換為「一步直解模式」，且答錯與開小幫手可展開兩步驟線段圖解。
4. 數學技能圖鑑補滿 24 張技能卡；跨三個海域、15 座島、45 關與 15 隻精靈可完整遊玩通關。
5. `npm test` 與 `npm run build` 通過，並完成實機瀏覽器兩步驟作答流程與雲端地圖畫面驗證。

## Comments
- 初始建立任務單（由 `/grill-with-docs` 規格拆解產出）。
