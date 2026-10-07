/* 故事均為虛構；delta 是基本效果，職能加成由引擎加入。 */
(function (root) {
  'use strict';
  const option = (label, text, delta, extra = {}) => ({ label, text, delta, ...extra });
  const roles = {
    QE: ['品質工程', '大家的問題，都有你的分機。'],
    IQC: ['進料檢驗', '箱子可以混，批號不行。'],
    SQE: ['供應商品質', '「以前都可以」不是量測單位。'],
    PQE: ['製程品質', '把偶然合格，變成有理由的合格。'],
    IPQC: ['製程巡檢', '你一轉身，參數也跟著轉身。'],
    FQC: ['最終檢驗', '最後一道防線，通常也是最後下班。'],
    CQE: ['客戶品質', '先有證據，再有回覆。'],
    OQC: ['出貨檢驗', '封箱前，事情總會再長出來。']
  };
  const quests = {
    supplier: { name: '供應商說以前都可以', icon: '01', steps: ['留下 NCR / CAR', '補上量測依據', '建立改善追蹤'], slots: [1, 3, 10], reward: { quality: 4, credit: 6 } },
    trace: { name: '消失的批號', icon: '02', steps: ['鎖定箱號', '補回測試序號', '核對 EC 履歷'], slots: [0, 6, 7], reward: { quality: 4, credit: 6 } },
    boundary: { name: '便當保衛戰', icon: '03', steps: ['午餐指定窗口', '客訴建立交接', '下班讓交接生效'], slots: [5, 8, 11], reward: { stress: -8, credit: 6 } }
  };
  const day = [
    { id: 'incoming', time: '08:30', area: '收料區', role: 'IQC', tag: '主線 · 批次 R-00', title: '早安，批號已經先混好了。', body: 'QD 座到了。外箱標籤是 A 批，內袋是 B 批，隨附檢驗紀錄寫著「同上」。倉儲窗口問：「外觀都一樣，可以先入庫嗎？」\n你的咖啡還沒喝，追溯已經需要提神。', options: [
      option('隔離混箱，建立箱號對照', '料暫時留在待驗區。你保住了批號，也保住了一封「請加速」的信。', { quality: 9, stress: 5, credit: 3, downtime: 15 }, { quest: ['trace', 0] }),
      option('依外觀相同先放行', '箱子進去了。你把「看起來一樣」輸入系統，系統沒有跳出警告，這讓人更不安。', { quality: -12, stress: -2, credit: -4 }),
      option('追加抽查，留下待釐清註記', '外觀抽查做完了，混箱的關聯還沒查回來。註記像便條紙：有存在，不一定有人看。', { quality: 3, stress: 3, downtime: 8 })
    ] },
    { id: 'supplier', time: '09:10', area: '供應商窗口', role: 'SQE', tag: '主線 · 外包加工', title: '以前都可以，今天就不行？', body: '外包窗口傳來加工件照片：「以前也是這樣，你們新的人比較嚴。」\n公司沒有換規格，只是你今天有打開圖面。製程窗口在旁邊補一句：「先不要開單，會不好看。」', options: [
      option('開 NCR / CAR，要求原因與改善證據', '你寫下異常、批次範圍與回覆期限。對方回覆「收到」，這次有單號可以追。', { quality: 7, stress: 6, credit: 4, downtime: 12 }, { quest: ['supplier', 0] }),
      option('接受電話保證，先讓產線用', '「我們會注意」被當成結案依據。注意的保存期限大約是一通電話。', { quality: -9, stress: -3, credit: -3 }),
      option('請對方重送檢驗紀錄', '紀錄會重送，但異常沒有負責人與期限。你多了一份附件，少了一個閉環。', { quality: 3, stress: 3, downtime: 5 })
    ] },
    { random: true, time: '09:50' },
    { id: 'cnc', time: '10:40', area: 'CNC / 量測室', role: 'PQE', tag: '主線 · CMM', title: '圖面很穩定，尺寸比較有個性。', body: 'CNC 車銑件的 CMM 結果出現偏移。加工紀錄、量測基準與夾治具版本放在三個不同資料夾。\n研發窗口說：「功能可能沒差。」可能這兩個字，今天也準時上班了。', options: [
      option('核對基準與加工紀錄，補上量測依據', '你把量測結果與加工批次接起來。停線增加，爭論少了一個「應該」。', { quality: 8, stress: 5, credit: 4, downtime: 20 }, { quest: ['supplier', 1] }),
      option('送 RD 特採，寫明批次與限制', '研發得為適用範圍與限制簽認。特採可以處理這一批，不能替下一批長出能力。', { quality: 1, stress: 4, credit: 2, downtime: 8 }),
      option('沿用昨天的量測報告', '昨天的數字很漂亮，今天的零件表示它沒有參與昨天。', { quality: -14, stress: -2, credit: -6 })
    ] },
    { id: 'weld', time: '11:20', area: '焊接製程', role: 'IPQC', tag: '主線 · 巡檢', title: '交接完成了。交接的是一句「都正常」。', body: '焊接班別切換，參數版本沒有留下。操作窗口很熟練，但熟練不能替系統填欄位。\n「你看一眼就好。」你現在的職稱被縮成了「看一眼」。', options: [
      option('確認參數版本，補首件與交班紀錄', '窗口配合補齊版本與首件紀錄。你終於有東西交給下一班，不只有祝福。', { quality: 8, stress: 4, credit: 4, downtime: 15 }),
      option('只看焊道外觀，巡檢簽名', '外觀看起來正常，參數履歷依然空白。你的名字是唯一留下的參數。', { quality: -6, stress: -2, credit: -2 }),
      option('請製程窗口共同確認再復線', '你找到共同負責的窗口。時間多花一點，責任終於不是一人一份全拿。', { quality: 5, stress: -2, credit: 3, downtime: 12 })
    ] },
    { id: 'lunch', time: '12:05', area: '茶水間', role: 'QE', tag: '支線 · 便當', title: '你的午餐被排進了異常處理流程。', body: '便當剛打開，群組跳出：「方便過來一下嗎？五分鐘。」\n早上的五分鐘已經過了三次午休。你發現微波爐比職涯有明確的結束時間。', options: [
      option('先吃飯，指定急件窗口與回覆時間', '你寫下誰接急件、你何時回來。便當是熱的，世界暫時也沒有停止。', { stress: -12, credit: 3 }, { quest: ['boundary', 0] }),
      option('帶著便當去現場', '你吃到了午餐，也吃到了焊接區的空氣。系統沒有「邊走邊吃」這個工時選項。', { quality: 2, stress: 10, credit: 1 }),
      option('不回覆，假裝沒看到', '你休息了一下，但沒有窗口接手，待辦長成另一個你。', { stress: -5, credit: -5 })
    ] },
    { id: 'leak', time: '13:10', area: '液冷測試站', role: 'FQC', tag: '主線 · 氣密 / 沉水', title: '沒有泡泡，有一個很大的空白。', body: 'Manifold 分歧管的氣密與沉水測試紀錄顯示完成，但三筆沒有零件序號。\n測試窗口說：「都在這台架子上啊。」架子很有記憶，但它沒辦法出庭。', options: [
      option('保留批次，補回序號與測試關聯', '你把每件結果連回序號。沒有把「測試完成」誤當成「追溯完成」。', { quality: 10, stress: 5, credit: 5, downtime: 25 }, { quest: ['trace', 1] }),
      option('重測並重新建立紀錄', '重測有了新紀錄，但原始結果與入料箱號仍未串起來。這是補測，不是補完歷史。', { quality: 6, stress: 7, downtime: 35 }),
      option('先填流水號，晚點補對應', '流水號很整齊，對應關係不存在。「晚點」被寫進了看不見的待辦。', { quality: -13, stress: -2, credit: -5 })
    ] },
    { id: 'ec', time: '14:10', area: '文件系統', role: 'QE', tag: '主線 · EC 變更', title: '最新圖面，最新有三份。', body: 'EC 已發布，現場資料夾還有舊版圖面。檔名分別是「最新」「最新_確認」「最新_真的」。\n你開始懷疑版本管制是一種文學創作。', options: [
      option('核對 EC 履歷，隔離舊版圖面', '你補齊使用版本與切換點。版本終於能用編號說話，不需要看檔名的語氣。', { quality: 9, stress: 5, credit: 4, downtime: 15 }, { quest: ['trace', 2] }),
      option('請 RD 口頭指定一份', '現場暫時得到答案，系統沒有。明天誰記得這通電話，誰就是文件系統。', { quality: -5, stress: 1, credit: -2 }),
      option('三份一起留著，以防萬一', '你保留了全部檔案，也保留了全部誤用可能。', { quality: -10, stress: 3, credit: -3 })
    ] },
    { id: 'customer', time: '15:10', area: '客戶回報窗口', role: 'CQE', tag: '主線 · 液冷迴路', title: '客戶說有問題。大家說你先回。', body: '客戶回報液冷迴路異常，照片看不清 QD 接合處。出貨批次、現場條件、測試資料還不齊。\n群組已經有人打了「品保說明一下」，比任何證據都快。', options: [
      option('整理證據、回覆節點，指定接手窗口', '你回覆已知與待釐清事項，建立下一個回報時間。事情有人接，不必靠你永遠在線。', { quality: 5, stress: 3, credit: 7 }, { quest: ['boundary', 1] }),
      option('先承諾今晚給完整 8D', '原因還沒找到，截止時間已找到。你為未知的根因預約了一個晚上的自己。', { stress: 14, credit: -3 }, { flag: 'promised8d' }),
      option('直接說是客戶裝配問題', '照片不足以判定，但你的回覆已經先完成判定。明天會多一個需要解釋的問題。', { quality: -10, stress: 5, credit: -12 })
    ] },
    { random: true, time: '16:10' },
    { id: 'shipping', time: '17:10', area: '機櫃出貨區', role: 'OQC', tag: '主線 · 包材 / 放行', title: '車在等，包材也有它的想法。', body: '伺服器機櫃要裝箱，QD 保護蓋缺兩個，箱標與批次清單差一碼。物流窗口看了看車，再看了看你。\n出貨時間是確定的，出貨條件還在討論。', options: [
      option('補齊保護與標籤，留下改善追蹤', '你補齊出貨條件，把未結改善交給下一個追蹤節點。車晚了一點，單號沒有失蹤。', { quality: 8, stress: 6, credit: 5, downtime: 20 }, { quest: ['supplier', 2] }),
      option('留照片註記，未補齊先上車', '照片保住了「曾經缺兩個」的證據，沒有替 QD 長出保護蓋。', { quality: -7, stress: 2, credit: -3 }),
      option('暫緩這批，交主管協調物流', '未滿足的出貨條件被寫清楚。你沒有讓時刻表變成檢驗規格。', { quality: 5, stress: 5, credit: 2, downtime: 40 })
    ] },
    { id: 'off', time: '18:00', area: '門禁 / 下班', role: 'QE', tag: '主線 · 日班結算', title: '下班了，工作換成手機版。', body: '你完成日班交接，手機震了一下：「只問一下，不算加班吧？」\n門禁就在眼前。今天你扮演了八種職能，薪資系統只認得一種。', options: [
      option('依交接清單離場，明天依窗口追蹤', '你把未結事項寫清楚後離場。下班沒有解決全部問題，但今天的工作可以結束。', { stress: -8, credit: 2 }, { finish: true }),
      option('接電話，真的只問一下', '電話接通。畫面顯示：夜間支援模式已啟用。便當盒還沒洗，你的分機沒有下班。', { stress: 8, credit: 1 }, { overtime: true }),
      option('自願把沒結完的事都帶回家', '你把公司縮成一台筆電，放進了家裡。主管回了一個讚，系統沒增加人力。', { stress: 13, credit: 2 }, { overtime: true, flag: 'hero' })
    ] }
  ];
  const random = [
    { id: 'qd', area: '組裝站', role: 'IPQC', tag: '隨機 · QD', title: '箭頭沒有裝反，只是沒人畫。', body: 'QD 接合方向的作業圖沒有標清楚。組裝窗口說每個人都知道怎麼裝，除了今天新來的人。', options: [option('補標示與首件確認', '作業圖多了一個箭頭，現場少了一次猜測。', { quality: 7, stress: 3, downtime: 10 }), option('請資深窗口示範並留下紀錄', '經驗終於從口頭走到了可交接的地方。', { quality: 5, credit: 3, stress: 2 }), option('請大家憑經驗裝', '大家的經驗很多，方向也很多。', { quality: -9, credit: -3 })] },
    { id: 'cal', area: '量測室', role: 'PQE', tag: '隨機 · CMM', title: '儀器校驗到期，它本人沒有表示。', body: 'CMM 校驗狀態顯示到期，排程卻說今天沒有空檔。儀器很安靜，排程很有意見。', options: [option('確認有效狀態，保留相關批次', '有效性與影響範圍需要確認，待判定批次留下了界線。', { quality: 8, stress: 5, downtime: 20 }), option('安排可用量具與替代量測評估', '替代方法先確認再使用，排程終於不是唯一的規範。', { quality: 5, stress: 4, credit: 3, downtime: 10 }), option('貼上明天再處理的便條', '校驗狀態沒更新，便條紙有了新日期。', { quality: -10, credit: -5 })] },
    { id: 'box', area: '包材倉', role: 'OQC', tag: '隨機 · 包材', title: '紙箱很吸水，也很吸責任。', body: '機櫃包材底層受潮。倉儲說外面乾了就好，出貨窗口說車快到了。', options: [option('換包材並確認庫存保存', '紙箱換了，保存條件也有人追。', { quality: 7, stress: 4, downtime: 12 }), option('重新確認保護條件再判定', '你把「摸起來乾」拆成需要確認的條件。', { quality: 4, stress: 3, downtime: 8 }), option('外層再包一圈', '包裝厚了，受潮的紙箱還在。', { quality: -8, credit: -3 })] },
    { id: 'waiver', area: '研發窗口', role: 'QE', tag: '隨機 · 特採', title: '特採期限：直到有人想起來。', body: 'RD 特採單沒有批次範圍與期限。備註寫「暫時使用」，暫時已經跨過兩次換班。', options: [option('補適用範圍、期限與核准紀錄', '暫時終於有了結束條件。', { quality: 6, stress: 4, credit: 4, downtime: 8 }), option('先保留相關料，請窗口補件', '資料補齊前保留待判定，不讓空欄位當通行證。', { quality: 5, stress: 5, downtime: 15 }), option('沿用上一張特採', '上一張單沒想到自己會有續集。', { quality: -10, credit: -4 })] },
    { id: 'weldcolor', area: '外包收料區', role: 'SQE', tag: '隨機 · 外包焊接', title: '色差的解釋比零件先送達。', body: '外包焊接件外觀異常，窗口先傳了一句「正常現象」。照片沒有批次，原因沒有資料。', options: [option('保留批次，確認要求與佐證', '外觀問題依要求確認，沒有用一張照片替整批下結論。', { quality: 7, stress: 5, downtime: 15 }), option('要求補齊紀錄與影響範圍', '你收到的回覆開始有資料，不只有形容詞。', { quality: 5, credit: 4, stress: 4, downtime: 8 }), option('回覆正常，請現場續用', '你把沒有證據的答案轉寄成了有你名字的答案。', { quality: -8, credit: -4 })] },
    { id: 'wheel', area: '機櫃組裝', role: 'FQC', tag: '隨機 · 外觀', title: '腳輪刮傷，排程表毫髮無傷。', body: '機櫃腳輪有刮傷，沒有明確記錄何時發生。現場提出用黑筆補一下，黑筆也沒有職務說明書。', options: [option('依外觀要求判定並追溯站點', '刮傷有了判定依據，後續也有追蹤站點。', { quality: 6, stress: 3, downtime: 8 }), option('更換腳輪並記錄異常', '更換解決了這件，紀錄讓下一件有機會免於重演。', { quality: 5, stress: 4, downtime: 12 }), option('用黑筆處理後出貨', '修飾完成，原因留在原地。', { quality: -7, credit: -3 })] },
    { id: 'copy', area: '巡檢站', role: 'IPQC', tag: '隨機 · 紀錄', title: '今天的巡檢，和昨天一模一樣。連錯字也是。', body: '巡檢表的數值、時間、錯字都跟昨天一致。系統稱讚填寫率 100%，你開始害怕這個百分比。', options: [option('確認實際檢查與補正紀錄', '紀錄被還原成做過的事，不再只是填滿的格子。', { quality: 8, stress: 5, credit: 3, downtime: 10 }), option('和窗口重新巡檢並確認填寫方式', '你找到填表習慣的原因，下一張表少了一個複製快捷鍵。', { quality: 6, stress: 3, downtime: 12 }), option('系統通過就算完成', '填寫率維持 100%，可信度另計。', { quality: -12, credit: -5 })] },
    { id: 'photo', area: '進料檢驗', role: 'IQC', tag: '隨機 · 紀錄照片', title: '這張照片，只有檔案大小很清楚。', body: '來料照片模糊得像保護商業機密，偏偏批號也在保護範圍內。附件命名是「正常.jpg」。', options: [option('重拍批號與判定依據', '照片終於可以說明它在拍什麼。', { quality: 6, stress: 3, credit: 3, downtime: 5 }), option('請窗口補原始紀錄', '原始紀錄回來，影像不再是唯一的線索。', { quality: 4, stress: 3, downtime: 8 }), option('檔名正常就判正常', '檔案很正常，判定很抽象。', { quality: -8, credit: -3 })] }
  ];
  const night = [
    { id: 'nightSupplier', time: '19:10', area: '家裡 / 群組', role: 'SQE', tag: '夜班 · 遠端支援', title: '人回家了，SQE 沒有。', body: '供應商在群組貼了一張沒有批號的照片：「這樣可以嗎？」\n你坐在餐桌前，看著另一種需要消化的東西。', options: [option('限定回覆範圍，要求資料並交接', '你把問題交回可驗證的範圍，夜間沒有憑照片替整批放行。', { quality: 5, stress: 4, credit: 4, overtime: 70 }), option('幫忙把對方的 CAR 也寫完', '原因、改善、驗證都等你。你發現外包的是加工，內包的是焦慮。', { quality: 1, stress: 15, credit: 1, overtime: 100 }), option('回覆看起來可以', '對方截圖了。你的晚餐突然多了一份永久保存。', { quality: -10, stress: 7, credit: -6, overtime: 45 })] },
    { id: 'nightCustomer', time: '21:40', area: '家裡 / 筆電', role: 'CQE', tag: '夜班 · 證據', title: '八種職能，只有一個充電器。', body: '客戶追問與 EC 版本爭議同時跳出。你把筆電插上電，人沒有相同的插孔。\n今天保留下來的紀錄，現在決定你能不能說清楚。', options: [option('整理已知證據，明確列出待驗證事項', '回覆有了證據與限制。你沒有為還不知道的事捏造結論。', { quality: 6, stress: 6, credit: 6, overtime: 80 }), option('先完成一份漂亮的完整原因報告', '簡報很完整，根因還在現場。今晚的故事明天需要重新驗證。', { quality: -9, stress: 15, credit: -5, overtime: 120 }), option('交接給約定窗口，停止新增承諾', '這一輪由交接窗口續追。你沒有再把明天賣給一句「現在就要」。', { stress: -5, credit: 2, overtime: 30 })] },
    { id: 'midnight', time: '23:58', area: '家裡 / 最後一封信', role: 'QE', tag: '夜班 · 結算', title: '明天的你，已經被今天的你排滿了。', body: '螢幕右下角是 23:58。系統問你是否儲存變更。\n你很想問它，這一天的你可不可以也儲存成變更前。', options: [option('完成交接，關機', '你列出誰、何時、要確認什麼。電腦關機了，今天終於可以變成昨天。', { stress: -8, credit: 4, overtime: 20 }, { finish: true }), option('再寫一份明天的待辦才睡', '明天有了清單，今天又少了一點睡眠。清單第一行是「請記得休息」。', { stress: 8, credit: 2, overtime: 45 }, { finish: true }), option('發一封全員都看得到的交接', '你把問題、證據與責任窗口放在同一封信。至少不用明天再逐個解釋。', { stress: 2, credit: 5, overtime: 30 }, { finish: true })] }
  ];
  const endings = {
    boundary: { hidden: true, title: '下班是一個完整的句子', text: '門禁響了一聲。你沒有等到事情全部做完，因為製造業的事情不會全部做完。\n你留下清楚的交接，也留下自己。便當盒洗好了。明天的你，不必先還今天的睡眠。' },
    archive: { hidden: true, title: '不是你記錯，是版本在漂移', text: '你把批號、測試序號與 EC 履歷串成一條時間線。「我記得是這樣」終於有了資料可以對照。\n真相不是某個人的記憶力。你還是累，但下一次追溯不用再從你的腦袋開始。' },
    recall: { title: '放行很快，回來也很快', text: '今天的出貨很順，明天的異常清單很長。\n你學會了：把問題從公司送出去，不等於把問題解決。手機還沒亮，你已經知道它會亮。' },
    burnout: { title: '明天見，今天還沒結束', text: '你在八種職能之間來回切換，像一個沒有休息站的班表。\n群組最後一句是「辛苦了」。四個字很短，今晚很長。明天的你會收到今天的你留下的待辦。' },
    stable: { title: '文件都在，人還在', text: '品質有被守住，責任也有被寫清楚。停線不是零，但少了幾個靠運氣通過的地方。\n你的交接單有內容，你的人也還有餘裕。這在今天已經是一種成就。' },
    ordinary: { title: '普通的一天，異常的一生', text: '你完成了這一天，留下幾個問號、幾份紀錄，還有一點沒喝完的咖啡。\n所有笑點都很熟悉。原來這款遊戲最不科幻的地方，是它只讓你上班一天。' }
  };
  root.QEData = { roles, quests, day, random, night, endings, option };
  if (typeof module !== 'undefined') module.exports = root.QEData;
})(typeof window !== 'undefined' ? window : globalThis);
