# Issue tracker: Local Markdown

本儲存庫的議題與規格以 Markdown 檔案存放在 `.scratch/` 目錄中。

## 約定規則

- 每個功能使用獨立目錄：`.scratch/<feature-slug>/`
- 規格書位於：`.scratch/<feature-slug>/spec.md`
- 實作任務單（tickets）為一單一檔，路徑為 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`（從 `01` 開始編號，嚴禁合併成單一檔案）
- 分類狀態記錄於各議題檔案頂部的 `Status:` 欄位（狀態字串對應表見 `triage-labels.md`）
- 留言與討論歷程附加在檔案底部的 `## Comments` 標題之下

## 當技能指示「發布至問題追蹤器（publish to the issue tracker）」時

在 `.scratch/<feature-slug>/` 下建立對應的新檔案（若目錄尚未存在則一併建立）。

## 當技能指示「讀取相關任務單（fetch the relevant ticket）」時

直接讀取指定路徑的檔案（使用者通常會直接提供路徑或議題編號）。

## Wayfinding 操作方式

供 `/wayfinder` 使用。**地圖（map）** 是一個主檔，每個**子任務單（child ticket）** 為獨立檔案。

- **地圖（Map）**：`.scratch/<effort>/map.md`（包含 Notes / Decisions-so-far / Fog 等內容）。
- **子任務單（Child ticket）**：`.scratch/<effort>/issues/NN-<slug>.md`（從 `01` 開始編號，內文記錄待決問題）。以 `Type:` 欄位記錄任務類型（`research` / `prototype` / `grilling` / `task`）；以 `Status:` 欄位記錄 `claimed` / `resolved`。
- **阻擋相依（Blocking）**：在檔案頂部加上 `Blocked by: NN, NN`。當所有列出的前置檔案皆為 `resolved` 時，此任務單即解除阻擋。
- **前線查詢（Frontier）**：掃描 `.scratch/<effort>/issues/` 中尚未完成、無阻擋且無人認領的檔案；依編號最小者優先。
- **認領（Claim）**：開始任何工作前，先將 `Status:` 設為 `claimed` 並存檔。
- **結案（Resolve）**：在 `## Answer` 標題下附加結論，將 `Status:` 設為 `resolved`，接著在 `map.md` 的「Decisions so far」區塊附加一筆上下文指標（摘要與連結）。
