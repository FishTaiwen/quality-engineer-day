# 架構與擴充契約

## 三層分離

`data.js` 不讀取 DOM，集中故事與數值。`engine.js` 不接觸儲存與網頁，提供可測試的規則函式。`app.js` 負責渲染、事件監聽、localStorage、模態視窗與文字匯出。一般 script 依序載入，讓 `file://` 與 GitHub Pages 都可使用，不需 npm 或打包。

## 事件契約

```js
{
  id: 'unique-id', time: '09:10', area: '虛構站點',
  role: 'SQE', tag: '主線 · 外包加工',
  title: '事件標題', body: '繁體中文敘事',
  options: [{
    label: '選項', text: '結果敘事',
    delta: { quality: 5, stress: 3, credit: 2, downtime: 10 },
    quest: ['supplier', 0], // 可選，必須符合目前階段
    flag: 'evidence',      // 可選，設定一次性劇情旗標
    finish: false,         // 可選，結果頁後進入結局
    overtime: false       // 可選，日班離場事件進入夜班
  }]
}
```

`QEEngine.event(state)` 依旗標與支線進度，產生目前事件與隱藏選項副本，不修改原始資料。亂數池只在建立新局時抽取；存檔記住兩個事件 ID。預覽呼叫 `effect` 取得基礎效果與職能/結案獎勵，UI 再限制數值範圍，與實際選擇結果一致。

## 狀態與生命週期

`newGame(seed)` → `enter(state)` → `event(state)` → `choose(state, index)` → 結果頁 → `advance(state)` → 下一時段或結案。`phase` 限制同一事件不能重複提交；結果頁亦可存檔。`choose` 不直接跳下一題，讓玩家看見敘事與實際變化。

主要狀態：`slot`、`stats`、`role`、`unlocked`、`permanent`、`assignments`、`quests`、`flags`、`randomIds`、`log`、`phase`、`result`、`ending`。職能資格解鎖與永久熟練度以「事件指定職能」計數；玩家切換已解鎖角色不改變該事件的資格授予，但會改變當次處置加成。這是代班完成紀錄，不是角色等級養成。

新事件會重置前次代班；永久資格可保留，但事件指定派任會覆蓋目前選擇，玩家仍可手動切換。QE 是永久基礎職能。

## 保存與安全

存檔鍵 `qe-day-save-v1`，結局鍵 `qe-day-endings-v1`。失效/不完整存檔以新局處理；localStorage 寫入受限不阻斷遊玩。記錄輸出透過字元轉義，不將存檔文字當成 HTML 執行。瀏覽器儲存不作為防作弊邊界，不含任何機密資料。沒有外部請求、分析 SDK、API 金鑰或後端。

## 新增內容

新增隨機事件：加入 `QEData.random`，使用唯一 ID 和現有職能 ID。新增支線：加入 `quests` 定義、狀態初始值、關鍵事件 `quest` 及驗證規則，並補完整路徑測試。新增結局：加入 `endings` 與 `ending` 判定優先序，修改 UI 總數（目前固定六個）。

多日版本應將 `day` 與 `night` 改為章節清單，讓時間軸由節點 ID 與 next 決定，取代目前十二日班/三夜班的固定 slot 索引。增加日存檔版本與明確遷移程序，將永久資格搬到 career state；目前 MVP 刻意只收藏結局，資格不跨新局。

後續可以依序增加：章節 JSON、分支條件 DSL、量測/版本核對小遊戲、跨日 CAR 期限與改善驗證、虛構角色關係、測試紀錄虛構資產、可關閉音效、存檔匯出/匯入。不要在 MVP 中加入真實料號、測試壓力規格、實際組織名稱或照片。
