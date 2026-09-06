/**
 * ==========================================================================
 * 直式挑戰測驗模組 (VERTICAL MATH QUIZ & CHALLENGE)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var cqEls = {};
  var currentMode = 'practice'; // 'practice' | 'selftest'
  var selectedDiff = 'all';     // 'all' | 'basic' | 'carry' | 'borrow' | 'hundred'
  var practiceScore = { correct: 0, streak: 0 };

  var selfTestConfig = { total: 5 };
  var selfTestState = {
    index: 0,
    correct: 0,
    startTime: 0,
    timerId: null,
    history: []
  };

  var currentQ = null;
  var activeInput = null;
  var isAnswered = false;

  /* DOM 元素快取與初始化 */
  function initElements(){
    cqEls = {
      section: document.getElementById('calc-quiz'),
      tabPractice: document.getElementById('cq-tab-practice'),
      tabSelftest: document.getElementById('cq-tab-selftest'),
      diffBar: document.getElementById('cq-diff-bar'),
      diffChips: document.querySelectorAll('.cq-diff-chip'),

      // 自由練習計分
      practiceScoreRow: document.getElementById('cq-practice-score-row'),
      scoreCorrect: document.getElementById('cq-score-correct'),
      scoreStreak: document.getElementById('cq-score-streak'),

      // 自我測驗設定面板
      setupPanel: document.getElementById('cq-selftest-setup-panel'),
      startBtn: document.getElementById('cq-start-selftest-btn'),
      countChips: document.querySelectorAll('#cq-selftest-setup-panel .chip'),

      // 自我測驗進度
      progressRow: document.getElementById('cq-selftest-progress-row'),
      progressText: document.getElementById('cq-selftest-progress-text'),
      progressFill: document.getElementById('cq-selftest-progress-fill'),
      timerText: document.getElementById('cq-selftest-timer'),

      // 測驗答題卡片
      quizCard: document.getElementById('cq-quiz-card'),
      typeBadge: document.getElementById('cq-type-badge'),
      promptText: document.getElementById('cq-prompt-text'),
      speakBtn: document.getElementById('cq-speak-btn'),
      mathTable: document.getElementById('cq-math-table'),
      virtualKeypad: document.getElementById('cq-virtual-keypad'),

      // 按鈕
      helperToggleBtn: document.getElementById('cq-helper-toggle-btn'),
      checkBtn: document.getElementById('cq-check-btn'),
      nextBtn: document.getElementById('cq-next-btn'),

      // 積木小幫手抽屜
      helperDrawer: document.getElementById('cq-helper-drawer'),
      helperBlocksStage: document.getElementById('cq-helper-blocks-stage'),

      // 回饋與說明
      feedback: document.getElementById('cq-feedback'),
      explanationBox: document.getElementById('cq-explanation-box'),

      // 結算成果卡
      resultCard: document.getElementById('cq-selftest-result-card'),
      resultStars: document.getElementById('cq-result-stars'),
      resultTitle: document.getElementById('cq-result-title'),
      resultSubtitle: document.getElementById('cq-result-subtitle'),
      resultScore: document.getElementById('cq-result-score'),
      resultAccuracy: document.getElementById('cq-result-accuracy'),
      resultTime: document.getElementById('cq-result-time'),
      resultReview: document.getElementById('cq-result-review'),
      restartBtn: document.getElementById('cq-restart-selftest-btn'),
      backPracticeBtn: document.getElementById('cq-back-practice-btn')
    };
  }

  /* 題型生成演算法 (支援各種難度與教育性) */
  function generateQuestion(diffType){
    var type = diffType;
    if(type === 'all' || !type){
      var candidates = ['basic', 'carry', 'borrow', 'hundred'];
      type = candidates[Math.floor(Math.random() * candidates.length)];
    }

    var op = 'add';
    var a = 0, b = 0;
    var badge = '';
    var hint = '';

    if(type === 'basic'){
      // 不進位加法 或 不退位減法 (兩位數)
      op = Math.random() < 0.5 ? 'add' : 'sub';
      if(op === 'add'){
        badge = '基礎不進位加法';
        hint = '個位相加沒有超過 10，直接分位計算即可！';
        var ao = MathApp.randInt(1, 8);
        var bo = MathApp.randInt(1, 9 - ao);
        var at = MathApp.randInt(1, 7);
        var bt = MathApp.randInt(1, 8 - at);
        a = at * 10 + ao;
        b = bt * 10 + bo;
      } else {
        badge = '基礎不退位減法';
        hint = '個位夠減、十位也夠減，直接直式相減！';
        var ao2 = MathApp.randInt(2, 9);
        var bo2 = MathApp.randInt(1, ao2);
        var at2 = MathApp.randInt(2, 9);
        var bt2 = MathApp.randInt(1, at2 - 1);
        a = at2 * 10 + ao2;
        b = bt2 * 10 + bo2;
      }
    } else if(type === 'carry'){
      // 個位進位加法 (十位不滿十)
      op = 'add';
      badge = '個位進位加法';
      hint = '個位相加滿十，記得把 1 捆成一條十進位給十位！';
      var ao3 = MathApp.randInt(4, 9);
      var bo3 = MathApp.randInt(10 - ao3, 9); // 保證 ao + bo >= 10
      var at3 = MathApp.randInt(1, 7);
      var bt3 = MathApp.randInt(1, 8 - at3); // 保證十位相加不爆百
      a = at3 * 10 + ao3;
      b = bt3 * 10 + bo3;
    } else if(type === 'borrow'){
      // 個位退位減法 (個位不夠減)
      op = 'sub';
      badge = '個位退位減法';
      hint = '個位不夠減，要向十位借 1 條十拆成 10 個一喔！';
      var ao4 = MathApp.randInt(0, 7);
      var bo4 = MathApp.randInt(ao4 + 1, 9); // 保證 ao < bo
      var at4 = MathApp.randInt(2, 9);
      var bt4 = MathApp.randInt(1, at4 - 1);
      a = at4 * 10 + ao4;
      b = bt4 * 10 + bo4;
    } else if(type === 'hundred'){
      // 進到百位 或 百位退位
      op = Math.random() < 0.5 ? 'add' : 'sub';
      if(op === 'add'){
        badge = '十位進百位加法';
        hint = '十位相加滿十，進位到百位變成一片百！';
        var ao5 = MathApp.randInt(1, 9);
        var bo5 = MathApp.randInt(1, 9);
        var carryO = (ao5 + bo5 >= 10) ? 1 : 0;
        var at5 = MathApp.randInt(5, 9);
        var bt5 = MathApp.randInt(10 - at5 - carryO, 9); // 保證十位滿十
        a = at5 * 10 + ao5;
        b = bt5 * 10 + bo5;
      } else {
        badge = '三位數百位退位減法';
        hint = '向十位借、十位再向百位借一片百拆成 10 條十！';
        a = MathApp.randInt(101, 145);
        b = MathApp.randInt(35, 89);
        if(a <= b) a = b + MathApp.randInt(15, 45);
      }
    }

    var expectedAns = (op === 'add') ? (a + b) : (a - b);

    // 數值拆解與分析
    var a_h = Math.floor(a / 100);
    var a_t = Math.floor((a % 100) / 10);
    var a_o = a % 10;

    var b_h = Math.floor(b / 100);
    var b_t = Math.floor((b % 100) / 10);
    var b_o = b % 10;

    var ans_h = Math.floor(expectedAns / 100);
    var ans_t = Math.floor((expectedAns % 100) / 10);
    var ans_o = expectedAns % 10;

    var needHundred = (a >= 100 || b >= 100 || expectedAns >= 100);

    return {
      type: type,
      op: op,
      a: a,
      b: b,
      ans: expectedAns,
      needHundred: needHundred,
      badge: badge,
      hint: hint,
      decomp: {
        a_h: a_h, a_t: a_t, a_o: a_o,
        b_h: b_h, b_t: b_t, b_o: b_o,
        ans_h: ans_h, ans_t: ans_t, ans_o: ans_o
      }
    };
  }

  /* 渲染直式答題筆記板 */
  function renderQuizBoard(q){
    if(!cqEls.mathTable) return;

    var opSymbol = (q.op === 'add') ? '+' : '−';
    var isSub = (q.op === 'sub');
    var isBorrowO = isSub && (q.decomp.a_o < q.decomp.b_o);
    var isCarryO  = (!isSub) && (q.decomp.a_o + q.decomp.b_o >= 10);
    var isCarryT  = (!isSub) && (q.decomp.a_t + q.decomp.b_t + (isCarryO ? 1 : 0) >= 10);

    var html = '';

    // 1. 欄位標題行 (百、十、個)
    html += '<div class="cq-row cq-row-header">';
    html += '  <div class="cq-cell cq-cell-op"></div>';
    if(q.needHundred){
      html += '  <div class="cq-cell"><span class="vm-col-badge h-badge">百位</span></div>';
    }
    html += '  <div class="cq-cell"><span class="vm-col-badge t-badge">十位</span></div>';
    html += '  <div class="cq-cell"><span class="vm-col-badge o-badge">個位</span></div>';
    html += '</div>';

    // 2. 進退位註記行 (輔助記錄框)
    html += '<div class="cq-row cq-row-mark">';
    html += '  <div class="cq-cell cq-cell-op"></div>';
    if(q.needHundred){
      html += '  <div class="cq-cell"><button type="button" class="cq-mark-slot" id="mark-h" aria-label="百位進退註記"></button></div>';
    }
    html += '  <div class="cq-cell"><button type="button" class="cq-mark-slot" id="mark-t" aria-label="十位進退註記"></button></div>';
    html += '  <div class="cq-cell"><button type="button" class="cq-mark-slot" id="mark-o" aria-label="個位進退註記"></button></div>';
    html += '</div>';

    // 3. 第一行：被加數 / 被減數 A
    html += '<div class="cq-row">';
    html += '  <div class="cq-cell cq-cell-op"></div>';
    if(q.needHundred){
      html += '  <div class="cq-cell" id="cq-cell-a-h">' + (q.decomp.a_h > 0 ? q.decomp.a_h : '') + '</div>';
    }
    html += '  <div class="cq-cell" id="cq-cell-a-t">' + (q.decomp.a_t > 0 || q.decomp.a_h > 0 ? q.decomp.a_t : '') + '</div>';
    html += '  <div class="cq-cell" id="cq-cell-a-o">' + q.decomp.a_o + '</div>';
    html += '</div>';

    // 4. 第二行：運算符號 + 運算數 B
    html += '<div class="cq-row">';
    html += '  <div class="cq-cell cq-cell-op">' + opSymbol + '</div>';
    if(q.needHundred){
      html += '  <div class="cq-cell">' + (q.decomp.b_h > 0 ? q.decomp.b_h : '') + '</div>';
    }
    html += '  <div class="cq-cell">' + (q.decomp.b_t > 0 || q.decomp.b_h > 0 ? q.decomp.b_t : '') + '</div>';
    html += '  <div class="cq-cell">' + q.decomp.b_o + '</div>';
    html += '</div>';

    // 5. 運算橫粗線
    html += '<div class="cq-divider-line"></div>';

    // 6. 答案輸入行 (個、十、百位輸入格)
    html += '<div class="cq-row cq-row-ans">';
    html += '  <div class="cq-cell cq-cell-op"></div>';
    if(q.needHundred){
      html += '  <div class="cq-cell"><input type="text" readonly inputmode="none" class="cq-input input-h" id="cq-ans-h" placeholder="0" maxlength="1" data-place="h" aria-label="百位答案"></div>';
    }
    html += '  <div class="cq-cell"><input type="text" readonly inputmode="none" class="cq-input input-t" id="cq-ans-t" placeholder="0" maxlength="1" data-place="t" aria-label="十位答案"></div>';
    html += '  <div class="cq-cell"><input type="text" readonly inputmode="none" class="cq-input input-o" id="cq-ans-o" placeholder="0" maxlength="1" data-place="o" aria-label="個位答案"></div>';
    html += '</div>';

    cqEls.mathTable.innerHTML = html;

    // 綁定輸入格事件
    bindInputEvents();

    // 綁定註記小格按鈕
    bindMarkSlotEvents();
  }

  /* 綁定作答輸入格點擊與焦點管理 */
  function bindInputEvents(){
    var inputs = cqEls.mathTable.querySelectorAll('.cq-input');
    inputs.forEach(function(inp){
      inp.addEventListener('click', function(){
        setActiveInput(inp);
      });
    });

    // 預設將焦點設置於「個位答案格」，導引「先算個位」
    var defaultInp = document.getElementById('cq-ans-o');
    if(defaultInp){
      setActiveInput(defaultInp);
    }
  }

  function setActiveInput(inp){
    var inputs = cqEls.mathTable.querySelectorAll('.cq-input');
    inputs.forEach(function(el){ el.classList.remove('is-active'); });
    if(inp){
      inp.classList.add('is-active');
      activeInput = inp;
    }
  }

  /* 註記按鈕事件 (小朋友可自行點擊標註小 1 或借位) */
  function bindMarkSlotEvents(){
    var markO = document.getElementById('mark-o');
    var markT = document.getElementById('mark-t');
    var markH = document.getElementById('mark-h');

    function toggleMark(btn, symbol){
      if(!btn) return;
      if(btn.textContent === symbol){
        btn.textContent = '';
        btn.className = 'cq-mark-slot';
      } else {
        btn.textContent = symbol;
        btn.className = (symbol === '+1' ? 'cq-mark-slot active-mark' : 'cq-mark-slot borrow-mark');
      }
      if(MathApp.sfx) MathApp.sfx('click');
    }

    if(markT){
      markT.addEventListener('click', function(){
        var sym = (currentQ && currentQ.op === 'add') ? '+1' : '借1';
        toggleMark(markT, sym);
      });
    }
    if(markH){
      markH.addEventListener('click', function(){
        var sym = (currentQ && currentQ.op === 'add') ? '+1' : '借1';
        toggleMark(markH, sym);
      });
    }
    if(markO){
      markO.addEventListener('click', function(){
        toggleMark(markO, '10');
      });
    }
  }

  /* 積木小幫手渲染：利用積木視覺化當前直式題目與進退位引導 */
  function renderHelperBlocks(q){
    if(!cqEls.helperBlocksStage) return;

    var isAdd = (q.op === 'add');
    var d = q.decomp;

    // 建立單一數值積木卡片
    function makeNumCardHtml(title, num, h, t, o){
      var cardHtml = '<div class="cq-helper-num-card">';
      cardHtml += '  <div class="cq-helper-num-title">' + title + ' <span class="cq-helper-num-val">(' + num + ')</span></div>';
      cardHtml += '  <div class="cq-helper-num-cols">';
      if(q.needHundred || h > 0){
        cardHtml += '    <div class="cq-helper-col-group">';
        cardHtml += '      <span class="cq-helper-col-tag h-tag">百位 (' + h + ')</span>';
        cardHtml += '      <div class="cq-helper-col-blocks">' + (h > 0 ? MathApp.renderGroupedBlocksHtml('h', h) : '<span class="cq-helper-empty">0</span>') + '</div>';
        cardHtml += '    </div>';
      }
      cardHtml += '    <div class="cq-helper-col-group">';
      cardHtml += '      <span class="cq-helper-col-tag t-tag">十位 (' + t + ')</span>';
      cardHtml += '      <div class="cq-helper-col-blocks">' + (t > 0 ? MathApp.renderGroupedBlocksHtml('t', t) : '<span class="cq-helper-empty">0</span>') + '</div>';
      cardHtml += '    </div>';
      cardHtml += '    <div class="cq-helper-col-group">';
      cardHtml += '      <span class="cq-helper-col-tag o-tag">個位 (' + o + ')</span>';
      cardHtml += '      <div class="cq-helper-col-blocks">' + (o > 0 ? MathApp.renderGroupedBlocksHtml('o', o) : '<span class="cq-helper-empty">0</span>') + '</div>';
      cardHtml += '    </div>';
      cardHtml += '  </div>';
      cardHtml += '</div>';
      return cardHtml;
    }

    var html = '';

    // 上半部：兩數積木與運算符號
    html += '<div class="cq-helper-stage-row">';
    html += makeNumCardHtml(isAdd ? '被加數' : '被減數', q.a, d.a_h, d.a_t, d.a_o);
    html += '<div class="cq-helper-op-badge">' + (isAdd ? '＋' : '−') + '</div>';
    html += makeNumCardHtml(isAdd ? '加數' : '減數', q.b, d.b_h, d.b_t, d.b_o);
    html += '</div>';

    // 下半部：直式計算關鍵引導卡（進退位魔法特寫）
    var actionTitle = '';
    var actionBody = '';
    var actionVisual = '';

    if(isAdd){
      var oSum = d.a_o + d.b_o;
      var carryO = (oSum >= 10);
      var remO = oSum % 10;
      var tSum = d.a_t + d.b_t + (carryO ? 1 : 0);
      var carryT = (tSum >= 10);

      if(carryO){
        actionTitle = '✨ 滿十進位魔法：10 個一 ➔ 捆成 1 條十！';
        actionBody = '先看個位：' + d.a_o + ' + ' + d.b_o + ' = <b>' + oSum + '</b> 顆（滿十囉！）。將 10 個一捆成 1 條十送給十位，個位剩下 <b>' + remO + '</b> 顆。十位記得要加上進位過來的 1 條十（' + d.a_t + ' + ' + d.b_t + ' + 1 = <b>' + tSum + '</b>）！';
        actionVisual = '<div class="cq-helper-action-visual">' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.renderGroupedBlocksHtml('o', 10) + '</div>' +
          '<span class="cq-helper-transform-arrow">➔ 捆成 ➔</span>' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('t') + '<b style="color:var(--t-color-dark);">1 條十</b></div>' +
          '<span style="font-size:12.5px;color:var(--ink-soft);margin-left:4px;">（進到十位註記 +1）</span>' +
          '</div>';
      } else if(carryT){
        actionTitle = '✨ 十位進百位魔法：10 條十 ➔ 捆成 1 片百！';
        actionBody = '個位直接相加：' + d.a_o + ' + ' + d.b_o + ' = <b>' + oSum + '</b> 顆。十位相加滿十（' + d.a_t + ' + ' + d.b_t + ' = <b>' + tSum + '</b>），10 條十可捆成 1 片百格板進到百位！';
        actionVisual = '<div class="cq-helper-action-visual">' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.renderGroupedBlocksHtml('t', 10) + '</div>' +
          '<span class="cq-helper-transform-arrow">➔ 捆成 ➔</span>' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('h') + '<b style="color:var(--h-color-dark);">1 片百</b></div>' +
          '<span style="font-size:12.5px;color:var(--ink-soft);margin-left:4px;">（進到百位）</span>' +
          '</div>';
      } else {
        actionTitle = '💡 分位相加觀察：分位直接計算即可！';
        actionBody = '先算個位：' + d.a_o + ' + ' + d.b_o + ' = <b>' + oSum + '</b> 顆（沒有滿十，不需進位）；再算十位：' + d.a_t + ' + ' + d.b_t + ' = <b>' + tSum + '</b> 條，直接在直式中填寫！';
      }
    } else {
      // 減法
      var needBorrowO = (d.a_o < d.b_o);
      var remT = needBorrowO ? (d.a_t - 1) : d.a_t;
      var effO = needBorrowO ? (d.a_o + 10) : d.a_o;
      var subO = effO - d.b_o;

      if(needBorrowO){
        actionTitle = '✂️ 借一拆十魔法：1 條十 ➔ 拆成 10 個一！';
        actionBody = '先看個位：只有 ' + d.a_o + ' 顆，拿不走 ' + d.b_o + ' 顆（不夠減）！向十位借 1 條十拆成 10 顆一，個位現在有 10 + ' + d.a_o + ' = <b>' + effO + '</b> 顆，減掉 ' + d.b_o + ' 剩下 <b>' + subO + '</b> 顆！十位被借走 1 條剩下 <b>' + remT + '</b> 條。';
        actionVisual = '<div class="cq-helper-action-visual">' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('t') + '<b style="color:var(--t-color-dark);">借 1 條十</b></div>' +
          '<span class="cq-helper-transform-arrow">➔ 拆成 ➔</span>' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.renderGroupedBlocksHtml('o', 10) + '</div>' +
          '<span style="font-size:12.5px;color:var(--ink-soft);margin-left:4px;">（個位增加 10 個一）</span>' +
          '</div>';
      } else if(remT < d.b_t && d.a_h > 0){
        actionTitle = '✂️ 百位退位魔法：1 片百 ➔ 拆成 10 條十！';
        actionBody = '個位夠減（' + d.a_o + ' − ' + d.b_o + ' = <b>' + subO + '</b>）。十位 ' + remT + ' 不夠減 ' + d.b_t + '，向百位借 1 片百拆成 10 條十來減！';
        actionVisual = '<div class="cq-helper-action-visual">' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('h') + '<b style="color:var(--h-color-dark);">借 1 片百</b></div>' +
          '<span class="cq-helper-transform-arrow">➔ 拆成 ➔</span>' +
          '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.renderGroupedBlocksHtml('t', 10) + '</div>' +
          '</div>';
      } else {
        actionTitle = '💡 分位相減觀察：夠減不用借位！';
        actionBody = '個位夠減：' + d.a_o + ' − ' + d.b_o + ' = <b>' + subO + '</b> 顆；十位夠減：' + remT + ' − ' + d.b_t + ' = <b>' + (remT - d.b_t) + '</b> 條。直接直式相減即可！';
      }
    }

    html += '<div class="cq-helper-action-card">';
    html += '  <div class="cq-helper-action-header">' + actionTitle + '</div>';
    if(actionVisual) html += actionVisual;
    html += '  <div class="cq-helper-action-body">' + actionBody + '</div>';
    html += '</div>';

    cqEls.helperBlocksStage.innerHTML = html;
  }

  /* 虛擬鍵盤與實體鍵盤事件處理 */
  function handleInputKey(key){
    if(isAnswered && key === 'enter'){
      nextRound();
      return;
    }
    if(!activeInput) return;

    if(key >= '0' && key <= '9'){
      activeInput.value = key;
      if(MathApp.sfx) MathApp.sfx('click');

      // 自動跳下一格（從個位 -> 十位 -> 百位）
      var place = activeInput.dataset.place;
      if(place === 'o'){
        var nextT = document.getElementById('cq-ans-t');
        if(nextT) setActiveInput(nextT);
      } else if(place === 't'){
        var nextH = document.getElementById('cq-ans-h');
        if(nextH) setActiveInput(nextH);
      }
    } else if(key === 'backspace'){
      if(activeInput.value !== ''){
        activeInput.value = '';
        if(MathApp.sfx) MathApp.sfx('click');
      } else {
        // 當前格是空的，退回前一格
        var place2 = activeInput.dataset.place;
        if(place2 === 'h'){
          var prevT = document.getElementById('cq-ans-t');
          if(prevT){
            prevT.value = '';
            setActiveInput(prevT);
          }
        } else if(place2 === 't'){
          var prevO = document.getElementById('cq-ans-o');
          if(prevO){
            prevO.value = '';
            setActiveInput(prevO);
          }
        }
        if(MathApp.sfx) MathApp.sfx('click');
      }
    } else if(key === 'enter'){
      checkAnswer();
    }
  }

  /* 答案驗證與智慧回饋邏輯 */
  function checkAnswer(){
    if(!currentQ || isAnswered) return;

    var inpH = document.getElementById('cq-ans-h');
    var inpT = document.getElementById('cq-ans-t');
    var inpO = document.getElementById('cq-ans-o');

    var valO = inpO ? inpO.value.trim() : '';
    var valT = inpT ? inpT.value.trim() : '';
    var valH = inpH ? inpH.value.trim() : '';

    // 智慧寬容處理：若最高位為 0（例如答案是 7 或 85），未填寫的前導十位或百位視為 0
    if(valO === ''){
      cqEls.feedback.textContent = '請先在個位填寫答案喔！';
      cqEls.feedback.className = 'feedback wrong';
      if(MathApp.sfx) MathApp.sfx('wrong');
      if(inpO) setActiveInput(inpO);
      return;
    }

    // 若十位留空，但答案本身 >= 10，則提醒填寫十位
    if(valT === '' && currentQ.ans >= 10){
      cqEls.feedback.textContent = '別忘了十位也要填寫答案喔！';
      cqEls.feedback.className = 'feedback wrong';
      if(MathApp.sfx) MathApp.sfx('wrong');
      if(inpT) setActiveInput(inpT);
      return;
    }

    // 若百位留空，但答案本身 >= 100，則提醒填寫百位
    if(valH === '' && inpH && currentQ.ans >= 100){
      cqEls.feedback.textContent = '十位相加滿十進到百位，百位也要填寫喔！';
      cqEls.feedback.className = 'feedback wrong';
      if(MathApp.sfx) MathApp.sfx('wrong');
      if(inpH) setActiveInput(inpH);
      return;
    }

    var numO = parseInt(valO, 10);
    var numT = valT !== '' ? parseInt(valT, 10) : 0;
    var numH = (inpH && valH !== '') ? parseInt(valH, 10) : 0;

    var userTotal = numH * 100 + numT * 10 + numO;
    var correctTotal = currentQ.ans;
    var isCorrect = (userTotal === correctTotal);

    var d = currentQ.decomp;
    var op = currentQ.op;

    // 清除既有錯誤樣式
    if(inpO) inpO.classList.remove('error-field', 'correct-field');
    if(inpT) inpT.classList.remove('error-field', 'correct-field');
    if(inpH) inpH.classList.remove('error-field', 'correct-field');

    if(isCorrect){
      isAnswered = true;
      if(inpO) inpO.classList.add('correct-field');
      if(inpT) inpT.classList.add('correct-field');
      if(inpH) inpH.classList.add('correct-field');

      var praise = '答對了！太厲害了！';
      if(MathApp.utils){
        if(typeof MathApp.utils.pickRandomPraise === 'function'){
          praise = MathApp.utils.pickRandomPraise();
        } else if(Array.isArray(MathApp.utils.goodMsgs) && MathApp.utils.goodMsgs.length > 0){
          praise = MathApp.utils.goodMsgs[Math.floor(Math.random() * MathApp.utils.goodMsgs.length)];
        }
      }
      cqEls.feedback.textContent = praise + ' 正確答案就是 ' + correctTotal + '！';
      cqEls.feedback.className = 'feedback correct';

      cqEls.checkBtn.style.display = 'none';
      var isLastQ = currentMode === 'selftest' && (selfTestState.index + 1) >= selfTestConfig.total;
      cqEls.nextBtn.innerHTML = isLastQ 
        ? '查看測驗成果 <i data-lucide="trophy"></i>' 
        : '下一題 <i data-lucide="arrow-right"></i>';
      cqEls.nextBtn.style.display = 'inline-block';
      if(MathApp.refreshIcons) MathApp.refreshIcons();

      if(MathApp.sfx) MathApp.sfx('correct');
      if(MathApp.utils && typeof MathApp.utils.launchConfetti === 'function'){
        MathApp.utils.launchConfetti();
      }
      if(MathApp.speak) MathApp.speak('答對了！' + currentQ.a + (op === 'add' ? '加' : '減') + currentQ.b + ' 等於 ' + correctTotal);

      // 計分更新
      if(currentMode === 'practice'){
        practiceScore.correct++;
        practiceScore.streak++;
        cqEls.scoreCorrect.textContent = practiceScore.correct;
        cqEls.scoreStreak.textContent = practiceScore.streak;
      } else {
        selfTestState.correct++;
        selfTestState.history.push({
          summary: currentQ.a + (op === 'add' ? ' + ' : ' − ') + currentQ.b + ' = ' + userTotal,
          ok: true
        });
      }
    } else {
      // 智慧分位診斷與教學提示
      var errorMsg = '答案有點小誤會喔！';
      var detailExplanation = '';

      if(op === 'add'){
        var oSum = d.a_o + d.b_o;
        var realO = oSum % 10;
        var carry1 = oSum >= 10 ? 1 : 0;
        var tSum = d.a_t + d.b_t + carry1;
        var realT = tSum % 10;

        if(numO !== realO){
          if(inpO) inpO.classList.add('error-field');
          errorMsg = '個位相加是 ' + d.a_o + ' + ' + d.b_o + ' = ' + oSum + '，個位寫 ' + realO + (carry1 ? '，滿十進 1 給十位喔！' : '！');
        } else if(numT !== realT){
          if(inpT) inpT.classList.add('error-field');
          if(carry1 && numT === (d.a_t + d.b_t)){
            errorMsg = '十位算得好接近！但別忘了加上個位進過來的 1 喔！';
          } else {
            errorMsg = '十位相加加上進位應該是 ' + d.a_t + ' + ' + d.b_t + (carry1 ? ' + 1 = ' : ' = ') + tSum + ' 喔！';
          }
        }
        detailExplanation = '💡 <b>算則小叮嚀：</b>先算個位：' + d.a_o + ' + ' + d.b_o + ' = ' + oSum + '（寫 ' + realO + (carry1 ? '，十位進 1' : '') + '）；再算十位：' + d.a_t + ' + ' + d.b_t + (carry1 ? ' + 1' : '') + ' = ' + tSum + '。';
      } else {
        // 減法
        var needBorrow = (d.a_o < d.b_o);
        var realSubO = needBorrow ? (d.a_o + 10 - d.b_o) : (d.a_o - d.b_o);
        var remT = needBorrow ? (d.a_t - 1) : d.a_t;
        var realSubT = remT - d.b_t;

        if(numO !== realSubO){
          if(inpO) inpO.classList.add('error-field');
          if(needBorrow){
            errorMsg = '個位 ' + d.a_o + ' 減 ' + d.b_o + ' 不夠減，向十位借 1 當 10，10 加上 ' + d.a_o + ' 等於 ' + (10 + d.a_o) + ' 再減 ' + d.b_o + ' = ' + realSubO + ' 喔！';
          } else {
            errorMsg = '個位相減是 ' + d.a_o + ' − ' + d.b_o + ' = ' + realSubO + ' 喔！';
          }
        } else if(numT !== realSubT){
          if(inpT) inpT.classList.add('error-field');
          if(needBorrow && numT === (d.a_t - d.b_t)){
            errorMsg = '注意十位！十位已經被個位借走 1 條了，剩下 ' + remT + '，再扣掉 ' + d.b_t + ' 喔！';
          } else {
            errorMsg = '十位相減後應該是 ' + remT + ' − ' + d.b_t + ' = ' + realSubT + ' 喔！';
          }
        }
        detailExplanation = '💡 <b>算則小叮嚀：</b>' + (needBorrow ? '個位不夠減，向十位借 1 當 10。十位剩下 ' + remT + '，個位變成 10 + ' + d.a_o + ' = ' + (10 + d.a_o) + '。' : '直接分位相減即可。');
      }

      cqEls.feedback.textContent = errorMsg;
      cqEls.feedback.className = 'feedback wrong';
      cqEls.explanationBox.innerHTML = detailExplanation;
      cqEls.explanationBox.style.display = 'block';

      if(MathApp.sfx) MathApp.sfx('wrong');
      if(MathApp.speak) MathApp.speak(errorMsg);

      if(currentMode === 'practice'){
        practiceScore.streak = 0;
        cqEls.scoreStreak.textContent = 0;
      } else {
        isAnswered = true;
        cqEls.checkBtn.style.display = 'none';
        var isLastQErr = (selfTestState.index + 1) >= selfTestConfig.total;
        cqEls.nextBtn.innerHTML = isLastQErr 
          ? '查看測驗成果 <i data-lucide="trophy"></i>' 
          : '下一題 <i data-lucide="arrow-right"></i>';
        cqEls.nextBtn.style.display = 'inline-block';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
        selfTestState.history.push({
          summary: currentQ.a + (op === 'add' ? ' + ' : ' − ') + currentQ.b + ' = ' + userTotal + '（正確為 ' + correctTotal + '）',
          ok: false
        });
      }
    }
  }

  /* 下一題邏輯 */
  function nextRound(){
    if(currentMode === 'selftest'){
      selfTestState.index++;
      if(selfTestState.index >= selfTestConfig.total){
        finishSelfTest();
        return;
      }
      updateSelfTestProgress();
    }
    newRound();
  }

  /* 新出題目 */
  function newRound(){
    isAnswered = false;
    currentQ = generateQuestion(selectedDiff);

    // 重設 UI
    cqEls.feedback.textContent = '';
    cqEls.feedback.className = 'feedback';
    cqEls.explanationBox.style.display = 'none';
    cqEls.checkBtn.style.display = 'inline-block';
    cqEls.nextBtn.style.display = 'none';

    cqEls.typeBadge.textContent = currentQ.badge;
    cqEls.promptText.textContent = currentQ.hint;

    renderQuizBoard(currentQ);
    renderHelperBlocks(currentQ);
  }

  /* 模式切換 */
  function switchMode(mode){
    currentMode = mode;
    if(mode === 'practice'){
      cqEls.tabPractice.classList.add('active');
      cqEls.tabPractice.setAttribute('aria-selected', 'true');
      cqEls.tabSelftest.classList.remove('active');
      cqEls.tabSelftest.setAttribute('aria-selected', 'false');

      cqEls.diffBar.style.display = 'flex';
      cqEls.practiceScoreRow.style.display = 'flex';
      cqEls.setupPanel.style.display = 'none';
      cqEls.progressRow.style.display = 'none';
      cqEls.resultCard.style.display = 'none';
      cqEls.quizCard.style.display = 'block';

      stopSelfTestTimer();
      newRound();
    } else {
      cqEls.tabSelftest.classList.add('active');
      cqEls.tabSelftest.setAttribute('aria-selected', 'true');
      cqEls.tabPractice.classList.remove('active');
      cqEls.tabPractice.setAttribute('aria-selected', 'false');

      cqEls.diffBar.style.display = 'none';
      cqEls.practiceScoreRow.style.display = 'none';
      cqEls.progressRow.style.display = 'none';
      cqEls.quizCard.style.display = 'none';
      cqEls.resultCard.style.display = 'none';
      cqEls.setupPanel.style.display = 'block';
    }
  }

  /* 自我測驗流程控制 */
  function startSelfTest(){
    selfTestState.index = 0;
    selfTestState.correct = 0;
    selfTestState.history = [];
    selfTestState.startTime = Date.now();

    cqEls.setupPanel.style.display = 'none';
    cqEls.resultCard.style.display = 'none';
    cqEls.progressRow.style.display = 'block';
    cqEls.quizCard.style.display = 'block';

    updateSelfTestProgress();
    startSelfTestTimer();
    newRound();
  }

  function startSelfTestTimer(){
    stopSelfTestTimer();
    cqEls.timerText.textContent = '⏱️ 00:00';
    selfTestState.timerId = setInterval(function(){
      var elapsedSec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
      cqEls.timerText.textContent = '⏱️ ' + (MathApp.utils ? MathApp.utils.formatTime(elapsedSec) : elapsedSec + 's');
    }, 1000);
  }

  function stopSelfTestTimer(){
    if(selfTestState.timerId){
      clearInterval(selfTestState.timerId);
      selfTestState.timerId = null;
    }
  }

  function updateSelfTestProgress(){
    var currentDisplayNum = selfTestState.index + 1;
    cqEls.progressText.textContent = '第 ' + currentDisplayNum + ' / ' + selfTestConfig.total + ' 題';
    var pct = Math.round((selfTestState.index / selfTestConfig.total) * 100);
    cqEls.progressFill.style.width = pct + '%';
  }

  function finishSelfTest(){
    stopSelfTestTimer();
    var elapsedSec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
    var total = selfTestConfig.total;
    var correct = selfTestState.correct;
    var scorePct = Math.round((correct / total) * 100);

    cqEls.quizCard.style.display = 'none';
    cqEls.progressRow.style.display = 'none';
    cqEls.resultCard.style.display = 'block';

    cqEls.resultScore.textContent = scorePct;
    cqEls.resultAccuracy.textContent = correct + ' / ' + total;
    cqEls.resultTime.textContent = MathApp.utils ? MathApp.utils.formatTime(elapsedSec) : elapsedSec + 's';

    if(scorePct === 100){
      cqEls.resultStars.textContent = '⭐⭐⭐';
      cqEls.resultTitle.textContent = '滿分達成！直式神算手！';
      cqEls.resultSubtitle.textContent = '恭喜你全數答對！你對進位與退位的直式算則已掌握得非常精熟！';
      if(MathApp.speak) MathApp.speak('滿分達成！太厲害了，直式算則全數答對！');
    } else if(scorePct >= 80){
      cqEls.resultStars.textContent = '⭐⭐';
      cqEls.resultTitle.textContent = '表現極佳！太厲害了！';
      cqEls.resultSubtitle.textContent = '只差一點點就滿分囉，注意借位與進位的細節就能拿下滿分！';
      if(MathApp.speak) MathApp.speak('表現極佳！得到兩顆星，繼續加油！');
    } else if(scorePct >= 60){
      cqEls.resultStars.textContent = '⭐';
      cqEls.resultTitle.textContent = '順利過關！再接再厲！';
      cqEls.resultSubtitle.textContent = '已經掌握基本算則，多練習「退位借一當十」就會更得心應手！';
      if(MathApp.speak) MathApp.speak('順利過關！多算幾次就會越來越快喔！');
    } else {
      cqEls.resultStars.textContent = '🌱';
      cqEls.resultTitle.textContent = '完成挑戰！繼續練習！';
      cqEls.resultSubtitle.textContent = '別氣餒，先切換到「算則操作台」看看積木演示，會更容易理解直式進退位喔！';
      if(MathApp.speak) MathApp.speak('完成挑戰！多操作積木，一定會更進步喔！');
    }

    var reviewHtml = '<div style="font-weight:700;margin-bottom:8px;color:var(--ink);">📋 答題檢討明細：</div>';
    selfTestState.history.forEach(function(item, idx){
      var badgeCls = item.ok ? 'pass' : 'fail';
      var badgeText = item.ok ? '✓ 答對' : '✗ 需加強';
      reviewHtml +=
        '<div class="review-item">' +
          '<span><b>第 ' + (idx + 1) + ' 題：</b> ' + item.summary + '</span>' +
          '<span class="review-badge ' + badgeCls + '">' + badgeText + '</span>' +
        '</div>';
    });
    cqEls.resultReview.innerHTML = reviewHtml;

    if(MathApp.sfx) MathApp.sfx(scorePct >= 60 ? 'correct' : 'click');
    if(scorePct >= 60 && MathApp.utils && typeof MathApp.utils.launchConfetti === 'function'){
      MathApp.utils.launchConfetti(scorePct >= 80);
    }
    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  /* 朗讀當前題目 */
  function speakCurrentPrompt(){
    if(!currentQ) return;
    var speech = currentQ.a + (currentQ.op === 'add' ? ' 加 ' : ' 減 ') + currentQ.b + ' 等於多少？' + currentQ.hint;
    if(MathApp.speak) MathApp.speak(speech);
  }

  /* 綁定主事件監聽 */
  function bindGlobalEvents(){
    // 模式分頁
    if(cqEls.tabPractice){
      cqEls.tabPractice.addEventListener('click', function(){ switchMode('practice'); });
    }
    if(cqEls.tabSelftest){
      cqEls.tabSelftest.addEventListener('click', function(){ switchMode('selftest'); });
    }

    // 難度晶片列
    cqEls.diffChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        cqEls.diffChips.forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        selectedDiff = chip.dataset.diff || 'all';
        if(MathApp.sfx) MathApp.sfx('click');
        newRound();
      });
    });

    // 自我測驗題數
    cqEls.countChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        cqEls.countChips.forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        selfTestConfig.total = parseInt(chip.dataset.count, 10) || 5;
        if(MathApp.sfx) MathApp.sfx('click');
      });
    });

    // 開始測驗
    if(cqEls.startBtn){
      cqEls.startBtn.addEventListener('click', startSelfTest);
    }
    if(cqEls.restartBtn){
      cqEls.restartBtn.addEventListener('click', startSelfTest);
    }
    if(cqEls.backPracticeBtn){
      cqEls.backPracticeBtn.addEventListener('click', function(){ switchMode('practice'); });
    }

    // 題目語音
    if(cqEls.speakBtn){
      cqEls.speakBtn.addEventListener('click', speakCurrentPrompt);
    }

    // 積木小幫手開關
    if(cqEls.helperToggleBtn){
      cqEls.helperToggleBtn.addEventListener('click', function(){
        var isOpen = cqEls.helperDrawer.classList.toggle('open');
        cqEls.helperToggleBtn.innerHTML = isOpen 
          ? '<i data-lucide="chevron-up"></i> 收合積木小幫手' 
          : '<i data-lucide="blocks"></i> 展開積木小幫手';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
        if(MathApp.sfx) MathApp.sfx('click');
      });
    }

    // 驗證答案 & 下一題
    if(cqEls.checkBtn){
      cqEls.checkBtn.addEventListener('click', checkAnswer);
    }
    if(cqEls.nextBtn){
      cqEls.nextBtn.addEventListener('click', nextRound);
    }

    // 虛擬數字鍵盤：改用共用工廠函式
    MathApp.createNumpad('cq-virtual-keypad', handleInputKey);

    // 電腦鍵盤按鍵監聽 (只在直式測驗面板可見時生效)
    window.addEventListener('keydown', function(e){
      var subpanel = document.getElementById('subpanel-calc-quiz');
      if(!subpanel || !subpanel.classList.contains('active')) return;

      if(e.key >= '0' && e.key <= '9'){
        handleInputKey(e.key);
      } else if(e.key === 'Backspace'){
        handleInputKey('backspace');
      } else if(e.key === 'Enter'){
        handleInputKey('enter');
      } else if(e.key === 'ArrowLeft'){
        // 向左切換欄位
        if(activeInput){
          var p = activeInput.dataset.place;
          if(p === 'o'){
            var nextT = document.getElementById('cq-ans-t');
            if(nextT) setActiveInput(nextT);
          } else if(p === 't'){
            var nextH = document.getElementById('cq-ans-h');
            if(nextH) setActiveInput(nextH);
          }
        }
      } else if(e.key === 'ArrowRight'){
        // 向右切換欄位
        if(activeInput){
          var p2 = activeInput.dataset.place;
          if(p2 === 'h'){
            var prevT = document.getElementById('cq-ans-t');
            if(prevT) setActiveInput(prevT);
          } else if(p2 === 't'){
            var prevO = document.getElementById('cq-ans-o');
            if(prevO) setActiveInput(prevO);
          }
        }
      }
    });

    // 監聽子分頁切換
    if(MathApp.on){
      MathApp.on('subTabChange', function(data){
        if(data && data.unit === 'calc' && data.subTab === 'quiz'){
          if(!currentQ){
            newRound();
          } else {
            var defaultInp = document.getElementById('cq-ans-o');
            if(defaultInp) setActiveInput(defaultInp);
          }
        }
      });
    }
  }

  /* 模組初始化 */
  function init(){
    initElements();
    bindGlobalEvents();
    newRound();
  }

  // 匯出公開 API（支援單元測試與自我檢測）
  MathApp.calcQuiz = {
    init: init,
    generateQuestion: generateQuestion,
    checkAnswer: checkAnswer,
    newRound: newRound,
    switchMode: switchMode,
    startSelfTest: startSelfTest,
    getState: function(){
      return {
        currentQ: currentQ,
        currentMode: currentMode,
        selectedDiff: selectedDiff,
        practiceScore: practiceScore,
        selfTestState: selfTestState
      };
    }
  };

})();
