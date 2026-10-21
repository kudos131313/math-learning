/**
 * ==========================================================================
 * 單元 4：九九乘法挑戰測驗模組 (MULTIPLICATION QUIZ & SELF-TEST MODULE)
 * 支援分階關卡 (1·2·5 / 3·4·6 / 7·8·9)、單段自選、逆向填空與倍數概念題
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var currentMode = 'practice'; // 'practice' | 'selftest'
  var currentLevel = 'all';     // 'all' | 'basic' | 'mid' | 'hard' | 'concept'
  var selectedTable = 'all';    // 'all' | 1..9
  var currentQ = null;
  var activeInput = null;
  var roundLocked = false;
  var lastSignature = '';

  var practiceStats = {
    correct: 0,
    streak: 0
  };

  var selfTestConfig = {
    total: 5
  };

  var selfTestState = {
    active: false,
    currentIdx: 0,
    correct: 0,
    startTime: 0,
    timerId: null,
    history: []
  };

  var mqEls = {};

  var storyTemplates = [
    { icon: '🍎', unit: '盤', item: '顆蘋果' },
    { icon: '✏️', unit: '盒', item: '枝鉛筆' },
    { icon: '🍪', unit: '袋', item: '片餅乾' },
    { icon: '🌸', unit: '朵花，每朵有', item: '片花瓣', flowerMode: true },
    { icon: '🚗', unit: '輛玩具車，每輛有', item: '個輪子', flowerMode: true }
  ];

  /* 取得指定關卡對應的被乘數候選池 */
  function getPoolByLevel(level, tableFilter){
    if(tableFilter !== 'all'){
      var n = Number(tableFilter);
      if(n >= 1 && n <= 9) return [n];
    }
    if(level === 'basic') return [1, 2, 5];
    if(level === 'mid')   return [3, 4, 6];
    if(level === 'hard')  return [7, 8, 9];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  /* 題庫生成演算法 */
  function generateQuestion(level, tableFilter){
    level = level || currentLevel || 'all';
    tableFilter = (typeof tableFilter !== 'undefined') ? tableFilter : selectedTable;

    var poolA = getPoolByLevel(level, tableFilter);
    var a, b, qType, sig;
    var tries = 0;

    do {
      a = poolA[MathApp.utils.randInt(0, poolA.length - 1)];
      b = MathApp.utils.randInt(1, 9);

      var roll = Math.random();
      if(level === 'concept'){
        if(roll < 0.45){
          qType = 'concept';
          // 概念題連加算式控制在 2~7 組，畫面最清晰
          b = MathApp.utils.randInt(2, 7);
        } else if(roll < 0.78){
          qType = 'missing_b';
        } else {
          qType = 'missing_a';
        }
      } else if(level === 'basic'){
        qType = (roll < 0.78) ? 'standard' : 'concept';
        if(qType === 'concept') b = MathApp.utils.randInt(2, 6);
      } else {
        if(roll < 0.68){
          qType = 'standard';
        } else if(roll < 0.86){
          qType = 'missing_b';
        } else {
          qType = 'concept';
          b = MathApp.utils.randInt(2, 6);
        }
      }

      sig = a + 'x' + b + ':' + qType;
      tries++;
    } while(sig === lastSignature && tries < 10);

    lastSignature = sig;
    var product = a * b;
    var mantra = (MathApp.mul && MathApp.mul.getMantra)
      ? MathApp.mul.getMantra(a, b)
      : (a + '×' + b + '=' + product);

    var badge = '九九乘法練習';
    var hint = '想一想 ' + a + ' 的乘法口訣，算出正確答案！';
    var storyHtml = '';
    var spokenPrompt = '';
    var slots = [];

    if(qType === 'standard'){
      badge = a + ' 的乘法口訣';
      hint = '每組 ' + a + ' 個，共有 ' + b + ' 組（' + b + ' 個 ' + a + ' 相加）是多少呢？';
      spokenPrompt = a + ' 乘以 ' + b + ' 等於多少？';
      slots = [
        { id: 'ans', expected: product, maxLen: 2, label: '乘積答案' }
      ];
    } else if(qType === 'missing_b'){
      badge = '逆向填空挑戰';
      hint = '背背看 ' + a + ' 的口訣：' + a + ' 乘以多少會等於 ' + product + ' 呢？';
      spokenPrompt = a + ' 乘以多少等於 ' + product + '？';
      slots = [
        { id: 'ans', expected: b, maxLen: 1, label: '未知乘數' }
      ];
    } else if(qType === 'missing_a'){
      badge = '逆向被乘數挑戰';
      hint = '想一想：哪一個數字乘以 ' + b + ' 會等於 ' + product + ' 呢？';
      spokenPrompt = '多少乘以 ' + b + ' 等於 ' + product + '？';
      slots = [
        { id: 'ans', expected: a, maxLen: 1, label: '未知被乘數' }
      ];
    } else {
      // concept: 幾個幾倍數概念與連加轉換
      badge = '幾個幾 · 倍數概念';
      var tpl = storyTemplates[MathApp.utils.randInt(0, storyTemplates.length - 1)];
      var addStr = [];
      for(var i = 0; i < b; i++) addStr.push(a);
      var repeatedStr = addStr.join(' ＋ ');

      if(tpl.flowerMode){
        storyHtml = tpl.icon + ' 有 <b>' + b + '</b> ' + tpl.unit + ' <b>' + a + '</b> ' + tpl.item +
          '<br><span style="font-size:13.5px;color:var(--ink-soft);">（連加算式：' + repeatedStr + ' ＝ <b>' + b + ' 個 ' + a + '</b>，也就是 <b>' + a + ' 的 ' + b + ' 倍</b>）</span>';
      } else {
        storyHtml = tpl.icon + ' 每' + tpl.unit + '有 <b>' + a + '</b> ' + tpl.item + '，共有 <b>' + b + '</b> ' + tpl.unit +
          '<br><span style="font-size:13.5px;color:var(--ink-soft);">（連加算式：' + repeatedStr + ' ＝ <b>' + b + ' 個 ' + a + '</b>，也就是 <b>' + a + ' 的 ' + b + ' 倍</b>）</span>';
      }
      hint = '請填入乘數（共有幾組）與最後的總數！';
      spokenPrompt = '每組有 ' + a + ' 個，共有 ' + b + ' 組，也就是 ' + b + ' 個 ' + a + ' 相加，寫成乘法算式是 ' + a + ' 乘以多少，等於多少？';
      slots = [
        { id: 'slot_b', expected: b, maxLen: 1, label: '乘數（幾組）' },
        { id: 'slot_p', expected: product, maxLen: 2, label: '總數乘積' }
      ];
    }

    return {
      a: a,
      b: b,
      product: product,
      qType: qType,
      mantra: mantra,
      badge: badge,
      hint: hint,
      storyHtml: storyHtml,
      spokenPrompt: spokenPrompt,
      slots: slots
    };
  }

  /* 驗證題目答案（供自檢與答題判定共用） */
  function validateQuestion(q, userValues){
    if(!q || !q.slots) return false;
    for(var i = 0; i < q.slots.length; i++){
      var s = q.slots[i];
      var val = userValues[s.id];
      if(val === '' || val === null || typeof val === 'undefined') return false;
      if(Number(val) !== s.expected) return false;
    }
    return true;
  }

  /* 綁定 DOM 元素 */
  function cacheDom(){
    mqEls.tabPractice       = document.getElementById('mq-tab-practice');
    mqEls.tabSelftest       = document.getElementById('mq-tab-selftest');
    mqEls.filterPanel       = document.getElementById('mq-filter-panel');
    mqEls.levelChipsWrap    = document.getElementById('mq-level-chips');
    mqEls.tableChipsWrap    = document.getElementById('mq-table-chips');
    mqEls.practiceScoreRow  = document.getElementById('mq-practice-score-row');
    mqEls.scoreCorrect      = document.getElementById('mq-score-correct');
    mqEls.scoreStreak       = document.getElementById('mq-score-streak');
    mqEls.setupPanel        = document.getElementById('mq-selftest-setup-panel');
    mqEls.startSelftestBtn  = document.getElementById('mq-start-selftest-btn');
    mqEls.progressRow       = document.getElementById('mq-selftest-progress-row');
    mqEls.progressText      = document.getElementById('mq-selftest-progress-text');
    mqEls.progressFill      = document.getElementById('mq-selftest-progress-fill');
    mqEls.timerText         = document.getElementById('mq-selftest-timer');
    mqEls.quizCard          = document.getElementById('mq-quiz-card');
    mqEls.typeBadge         = document.getElementById('mq-type-badge');
    mqEls.promptText        = document.getElementById('mq-prompt-text');
    mqEls.speakBtn          = document.getElementById('mq-speak-btn');
    mqEls.storyBanner       = document.getElementById('mq-story-banner');
    mqEls.equationRow       = document.getElementById('mq-equation-row');
    mqEls.helperToggleBtn   = document.getElementById('mq-helper-toggle-btn');
    mqEls.checkBtn          = document.getElementById('mq-check-btn');
    mqEls.nextBtn           = document.getElementById('mq-next-btn');
    mqEls.helperDrawer      = document.getElementById('mq-helper-drawer');
    mqEls.helperBlocksStage = document.getElementById('mq-helper-blocks-stage');
    mqEls.feedback          = document.getElementById('mq-feedback');
    mqEls.explanationBox    = document.getElementById('mq-explanation-box');
    mqEls.resultCard        = document.getElementById('mq-selftest-result-card');
    mqEls.resultStars       = document.getElementById('mq-result-stars');
    mqEls.resultTitle       = document.getElementById('mq-result-title');
    mqEls.resultSubtitle    = document.getElementById('mq-result-subtitle');
    mqEls.resultScore       = document.getElementById('mq-result-score');
    mqEls.resultAccuracy    = document.getElementById('mq-result-accuracy');
    mqEls.resultTime        = document.getElementById('mq-result-time');
    mqEls.resultReview      = document.getElementById('mq-result-review');
    mqEls.restartSelftestBtn= document.getElementById('mq-restart-selftest-btn');
    mqEls.backPracticeBtn   = document.getElementById('mq-back-practice-btn');
  }

  /* 設定當前焦點輸入框 */
  function setActiveInput(inp){
    var allInputs = mqEls.equationRow ? mqEls.equationRow.querySelectorAll('.mq-input-slot') : [];
    for(var i = 0; i < allInputs.length; i++){
      allInputs[i].classList.remove('active-input');
    }
    activeInput = inp;
    if(inp){
      inp.classList.add('active-input');
    }
  }

  /* 渲染算式答題區 */
  function renderQuestionStage(q){
    if(!mqEls.equationRow) return;

    if(q.storyHtml){
      mqEls.storyBanner.style.display = 'block';
      mqEls.storyBanner.innerHTML = q.storyHtml;
    } else {
      mqEls.storyBanner.style.display = 'none';
      mqEls.storyBanner.innerHTML = '';
    }

    var html = '';
    if(q.qType === 'standard'){
      html =
        '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span>' +
        '<span>×</span>' +
        '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span>' +
        '<span>＝</span>' +
        '<input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="2" inputmode="none" readonly aria-label="輸入乘積答案" placeholder="?">';
    } else if(q.qType === 'missing_b'){
      html =
        '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span>' +
        '<span>×</span>' +
        '<input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知的乘數" placeholder="?">' +
        '<span>＝</span>' +
        '<span class="mq-num-box">' + q.product + '</span>';
    } else if(q.qType === 'missing_a'){
      html =
        '<input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知的被乘數" placeholder="?">' +
        '<span>×</span>' +
        '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span>' +
        '<span>＝</span>' +
        '<span class="mq-num-box">' + q.product + '</span>';
    } else {
      // concept: a × [?] = [?]
      html =
        '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span>' +
        '<span>×</span>' +
        '<input type="text" class="mq-input-slot" data-slot-id="slot_b" maxlength="1" inputmode="none" readonly aria-label="輸入共有幾組（乘數）" placeholder="?">' +
        '<span>＝</span>' +
        '<input type="text" class="mq-input-slot" data-slot-id="slot_p" maxlength="2" inputmode="none" readonly aria-label="輸入總數乘積" placeholder="?">';
    }

    mqEls.equationRow.innerHTML = html;

    var inputs = mqEls.equationRow.querySelectorAll('.mq-input-slot');
    for(var i = 0; i < inputs.length; i++){
      (function(inp){
        inp.addEventListener('click', function(){
          if(roundLocked) return;
          if(MathApp.sfx) MathApp.sfx('click');
          setActiveInput(inp);
        });
      })(inputs[i]);
    }

    if(inputs.length > 0){
      setActiveInput(inputs[0]);
    }
  }

  /* 渲染積木小幫手抽屜內容 */
  function renderHelperBlocks(q){
    if(!mqEls.helperBlocksStage) return;
    var a = q.a;
    var b = q.b;
    var html = '<div style="margin-bottom:8px;font-size:13.5px;font-weight:800;color:var(--ink);">' +
      '📦 <b>每組有 ' + a + ' 個，共有 ' + b + ' 組</b>（一起數數看合起來有幾個）：' +
      '</div>';

    html += '<div class="mul-groups-container">';
    for(var g = 1; g <= b; g++){
      html += '<div class="mul-group-tray">';
      html += '  <span class="mul-group-tray-head">第 ' + g + ' 組 (+' + a + ')</span>';
      html += '  <div class="mul-group-tray-blocks">';
      for(var u = 0; u < a; u++){
        html += MathApp.utils.blockGlyph('o');
      }
      html += '  </div>';
      html += '</div>';
    }
    html += '</div>';

    var stepSums = [];
    for(var s = 1; s <= b; s++){
      stepSums.push(s === b ? '?' : String(a * s));
    }
    html += '<div class="mul-repeated-add-bar" style="margin-top:8px;">' +
      '<span>🐇 <b>跳數累加：</b>' + stepSums.join(' ➔ ') + '</span>' +
      '<span>💡 <b>口訣提示：</b>' + ['零','一','二','三','四','五','六','七','八','九'][a] + ['零','一','二','三','四','五','六','七','八','九'][b] + '…</span>' +
      '</div>';

    mqEls.helperBlocksStage.innerHTML = html;
  }

  /* 開始新一題 */
  function newRound(){
    roundLocked = false;
    currentQ = generateQuestion(currentLevel, selectedTable);

    if(mqEls.typeBadge) mqEls.typeBadge.textContent = currentQ.badge;
    if(mqEls.promptText) mqEls.promptText.textContent = currentQ.hint;

    if(mqEls.feedback){
      mqEls.feedback.textContent = '';
      mqEls.feedback.className = 'feedback';
    }
    if(mqEls.explanationBox){
      mqEls.explanationBox.style.display = 'none';
      mqEls.explanationBox.innerHTML = '';
    }
    if(mqEls.helperDrawer){
      mqEls.helperDrawer.classList.remove('open');
    }
    if(mqEls.helperToggleBtn){
      mqEls.helperToggleBtn.innerHTML = '<i data-lucide="blocks"></i> 展開積木小幫手';
    }
    if(mqEls.checkBtn) mqEls.checkBtn.style.display = 'inline-flex';
    if(mqEls.nextBtn)  mqEls.nextBtn.style.display = 'none';

    renderQuestionStage(currentQ);
    renderHelperBlocks(currentQ);
    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  /* 檢查答案 */
  function checkAnswer(){
    if(roundLocked || !currentQ) return;

    var inputs = mqEls.equationRow.querySelectorAll('.mq-input-slot');
    var userValues = {};
    var hasEmpty = false;

    for(var i = 0; i < inputs.length; i++){
      var id = inputs[i].getAttribute('data-slot-id');
      var val = inputs[i].value.trim();
      if(val === ''){
        hasEmpty = true;
      }
      userValues[id] = val;
    }

    if(hasEmpty){
      if(MathApp.sfx) MathApp.sfx('wrong');
      mqEls.feedback.textContent = '⚠️ 請先把空格填滿再確認答案喔！';
      mqEls.feedback.className = 'feedback bad';
      // 聚焦第一個空白框
      for(var j = 0; j < inputs.length; j++){
        if(inputs[j].value.trim() === ''){
          setActiveInput(inputs[j]);
          break;
        }
      }
      return;
    }

    var allCorrect = true;
    for(var k = 0; k < currentQ.slots.length; k++){
      var slotSpec = currentQ.slots[k];
      var inpEl = mqEls.equationRow.querySelector('[data-slot-id="' + slotSpec.id + '"]');
      var isOk = Number(userValues[slotSpec.id]) === slotSpec.expected;
      if(inpEl){
        inpEl.classList.remove('active-input', 'correct', 'wrong');
        inpEl.classList.add(isOk ? 'correct' : 'wrong');
      }
      if(!isOk) allCorrect = false;
    }

    if(currentMode === 'selftest'){
      roundLocked = true;
      if(allCorrect) selfTestState.correct++;
      selfTestState.history.push({
        q: currentQ,
        ok: allCorrect,
        userValues: userValues
      });

      if(allCorrect){
        if(MathApp.sfx) MathApp.sfx('correct');
        mqEls.feedback.textContent = '✅ 答對了！口訣：「' + currentQ.mantra + '」！';
        mqEls.feedback.className = 'feedback good';
      } else {
        if(MathApp.sfx) MathApp.sfx('wrong');
        mqEls.feedback.textContent = '❌ 正確算式是 ' + currentQ.a + ' × ' + currentQ.b + ' ＝ ' + currentQ.product + '（口訣：' + currentQ.mantra + '）';
        mqEls.feedback.className = 'feedback bad';
      }

      setTimeout(function(){
        selfTestState.currentIdx++;
        if(selfTestState.currentIdx >= selfTestConfig.total){
          finishSelfTest();
        } else {
          updateSelfTestProgress();
          newRound();
        }
      }, 1150);
      return;
    }

    // 自由練習模式
    if(allCorrect){
      roundLocked = true;
      practiceStats.correct++;
      practiceStats.streak++;
      if(mqEls.scoreCorrect) mqEls.scoreCorrect.textContent = String(practiceStats.correct);
      if(mqEls.scoreStreak)  mqEls.scoreStreak.textContent  = String(practiceStats.streak);

      if(MathApp.sfx) MathApp.sfx('correct');
      if(MathApp.utils && MathApp.utils.launchConfetti){
        MathApp.utils.launchConfetti(practiceStats.streak > 0 && practiceStats.streak % 5 === 0);
      }

      var praise = (MathApp.utils && MathApp.utils.pickRandomPraise) ? MathApp.utils.pickRandomPraise() : '答對了！';
      mqEls.feedback.textContent = '🎉 ' + praise + ' 口訣：「' + currentQ.mantra + '」';
      mqEls.feedback.className = 'feedback good';

      if(mqEls.explanationBox){
        mqEls.explanationBox.style.display = 'block';
        mqEls.explanationBox.innerHTML =
          '✨ <b>算式解析：</b><b>' + currentQ.a + ' × ' + currentQ.b + ' ＝ ' + currentQ.product + '</b>' +
          '（口訣：<b>' + currentQ.mantra + '</b>，代表每組 ' + currentQ.a + ' 個，共 ' + currentQ.b + ' 組，合起來是 ' + currentQ.product + ' 個）。';
      }

      if(MathApp.speak){
        MathApp.speak('答對了！' + currentQ.mantra + '，' + currentQ.a + ' 乘以 ' + currentQ.b + ' 等於 ' + currentQ.product);
      }

      if(mqEls.checkBtn) mqEls.checkBtn.style.display = 'none';
      if(mqEls.nextBtn)  mqEls.nextBtn.style.display = 'inline-flex';
    } else {
      practiceStats.streak = 0;
      if(mqEls.scoreStreak) mqEls.scoreStreak.textContent = '0';
      if(MathApp.sfx) MathApp.sfx('wrong');

      var enc = (MathApp.utils && MathApp.utils.pickRandomEncouragement) ? MathApp.utils.pickRandomEncouragement() : '再想想看！';
      mqEls.feedback.textContent = '💡 ' + enc + ' 已為你展開下方「積木小幫手」，數數看再修改紅色格子吧！';
      mqEls.feedback.className = 'feedback bad';

      // 自動展開積木小幫手協助學生訂正
      if(mqEls.helperDrawer && !mqEls.helperDrawer.classList.contains('open')){
        mqEls.helperDrawer.classList.add('open');
        if(mqEls.helperToggleBtn){
          mqEls.helperToggleBtn.innerHTML = '<i data-lucide="chevron-up"></i> 收合積木小幫手';
          if(MathApp.refreshIcons) MathApp.refreshIcons();
        }
      }

      // 聚焦第一個答錯的輸入框並清空以便重填
      var wrongInp = mqEls.equationRow.querySelector('.mq-input-slot.wrong');
      if(wrongInp){
        wrongInp.value = '';
        setActiveInput(wrongInp);
      }
    }
  }

  /* 處理虛擬數字鍵盤與實體鍵盤輸入 */
  function handleKeypadInput(key){
    if(roundLocked){
      if(key === 'enter' && currentMode === 'practice'){
        newRound();
      }
      return;
    }
    if(!activeInput) return;

    if(key === 'enter'){
      checkAnswer();
      return;
    }

    if(MathApp.sfx) MathApp.sfx('pop');
    activeInput.classList.remove('wrong', 'correct');

    if(key === 'backspace' || key === 'clear'){
      activeInput.value = activeInput.value.slice(0, -1);
      return;
    }

    if(/^[0-9]$/.test(key)){
      var maxLen = Number(activeInput.getAttribute('maxlength')) || 2;
      if(activeInput.value.length >= maxLen){
        activeInput.value = key;
      } else {
        activeInput.value += key;
      }

      // 若是雙格概念題且第一格已填滿 1 位數，自動跳到第二格
      if(maxLen === 1 && activeInput.value.length === 1){
        var allInputs = mqEls.equationRow.querySelectorAll('.mq-input-slot');
        if(allInputs.length > 1 && activeInput === allInputs[0]){
          setActiveInput(allInputs[1]);
        }
      }
    }
  }

  /* 模式切換滑塊更新 */
  function updateTabSlider(activeTab){
    var slider = document.getElementById('mq-mode-tab-slider');
    if(!slider || !activeTab) return;
    var tabsRect = activeTab.parentElement.getBoundingClientRect();
    var tabRect  = activeTab.getBoundingClientRect();
    if(tabRect.width === 0) return;
    slider.style.left  = (tabRect.left - tabsRect.left - 4) + 'px';
    slider.style.width = tabRect.width + 'px';
  }

  function stopSelfTestTimer(){
    if(selfTestState.timerId){
      clearInterval(selfTestState.timerId);
      selfTestState.timerId = null;
    }
  }

  function startSelfTestTimer(){
    stopSelfTestTimer();
    if(mqEls.timerText) mqEls.timerText.textContent = '⏱️ 00:00';
    selfTestState.timerId = setInterval(function(){
      var sec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
      if(mqEls.timerText) mqEls.timerText.textContent = '⏱️ ' + MathApp.utils.formatTime(sec);
    }, 1000);
  }

  function updateSelfTestProgress(){
    var cur = selfTestState.currentIdx + 1;
    var tot = selfTestConfig.total;
    var pct = Math.round((selfTestState.currentIdx / tot) * 100);
    if(mqEls.progressText) mqEls.progressText.textContent = '第 ' + cur + ' / ' + tot + ' 題';
    if(mqEls.progressFill) mqEls.progressFill.style.width = pct + '%';
  }

  function startSelfTest(){
    selfTestState.active = true;
    selfTestState.currentIdx = 0;
    selfTestState.correct = 0;
    selfTestState.startTime = Date.now();
    selfTestState.history = [];

    if(mqEls.setupPanel)  mqEls.setupPanel.style.display = 'none';
    if(mqEls.resultCard)  mqEls.resultCard.style.display = 'none';
    if(mqEls.progressRow) mqEls.progressRow.style.display = 'block';
    if(mqEls.quizCard)    mqEls.quizCard.style.display = 'block';

    updateSelfTestProgress();
    startSelfTestTimer();
    newRound();
  }

  function finishSelfTest(){
    stopSelfTestTimer();
    selfTestState.active = false;
    var elapsedSec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
    var total = selfTestConfig.total;
    var correct = selfTestState.correct;
    var score = Math.round((correct / total) * 100);

    if(mqEls.progressFill) mqEls.progressFill.style.width = '100%';
    if(mqEls.progressRow)  mqEls.progressRow.style.display = 'none';
    if(mqEls.quizCard)     mqEls.quizCard.style.display = 'none';
    if(mqEls.resultCard)   mqEls.resultCard.style.display = 'block';

    if(mqEls.resultScore)    mqEls.resultScore.textContent = String(score);
    if(mqEls.resultAccuracy) mqEls.resultAccuracy.textContent = correct + ' / ' + total;
    if(mqEls.resultTime)     mqEls.resultTime.textContent = MathApp.utils.formatTime(elapsedSec);

    if(score === 100){
      mqEls.resultStars.textContent = '⭐⭐⭐';
      mqEls.resultTitle.textContent = '滿分九九乘法大師！太強了！';
      mqEls.resultSubtitle.textContent = '每一題的乘法口訣與倍數概念都難不倒你！';
      if(MathApp.utils && MathApp.utils.launchConfetti) MathApp.utils.launchConfetti(true);
    } else if(score >= 80){
      mqEls.resultStars.textContent = '⭐⭐';
      mqEls.resultTitle.textContent = '表現非常棒！就差一點點滿分！';
      mqEls.resultSubtitle.textContent = '已經掌握大部分的九九乘法口訣囉！';
      if(MathApp.utils && MathApp.utils.launchConfetti) MathApp.utils.launchConfetti(false);
    } else {
      mqEls.resultStars.textContent = '⭐';
      mqEls.resultTitle.textContent = '完成測驗！繼續練習會更熟練喔！';
      mqEls.resultSubtitle.textContent = '可以回到九九乘法探索台多聽幾次口訣與積木分組！';
    }

    if(mqEls.resultReview){
      var revHtml = '<div style="text-align:left;margin-top:12px;">';
      selfTestState.history.forEach(function(item, idx){
        var q = item.q;
        var badge = item.ok ? '✅' : '❌';
        revHtml += '<div style="padding:7px 10px;border-bottom:1px solid rgba(0,0,0,0.08);font-size:14px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span>' + badge + ' 第 ' + (idx + 1) + ' 題：<b>' + q.a + ' × ' + q.b + ' ＝ ' + q.product + '</b></span>' +
          '<span style="font-weight:800;color:var(--ink-soft);">口訣：' + q.mantra + '</span>' +
          '</div>';
      });
      revHtml += '</div>';
      mqEls.resultReview.innerHTML = revHtml;
    }
  }

  function switchMode(mode){
    currentMode = mode;
    if(mode === 'practice'){
      mqEls.tabPractice.classList.add('active');
      mqEls.tabPractice.setAttribute('aria-selected', 'true');
      mqEls.tabSelftest.classList.remove('active');
      mqEls.tabSelftest.setAttribute('aria-selected', 'false');
      updateTabSlider(mqEls.tabPractice);

      if(mqEls.filterPanel)      mqEls.filterPanel.style.display = 'flex';
      if(mqEls.practiceScoreRow) mqEls.practiceScoreRow.style.display = 'flex';
      if(mqEls.setupPanel)       mqEls.setupPanel.style.display = 'none';
      if(mqEls.progressRow)      mqEls.progressRow.style.display = 'none';
      if(mqEls.resultCard)       mqEls.resultCard.style.display = 'none';
      if(mqEls.quizCard)         mqEls.quizCard.style.display = 'block';

      stopSelfTestTimer();
      newRound();
    } else {
      mqEls.tabSelftest.classList.add('active');
      mqEls.tabSelftest.setAttribute('aria-selected', 'true');
      mqEls.tabPractice.classList.remove('active');
      mqEls.tabPractice.setAttribute('aria-selected', 'false');
      updateTabSlider(mqEls.tabSelftest);

      stopSelfTestTimer();
      if(mqEls.filterPanel)      mqEls.filterPanel.style.display = 'none';
      if(mqEls.practiceScoreRow) mqEls.practiceScoreRow.style.display = 'none';
      if(mqEls.progressRow)      mqEls.progressRow.style.display = 'none';
      if(mqEls.quizCard)         mqEls.quizCard.style.display = 'none';
      if(mqEls.resultCard)       mqEls.resultCard.style.display = 'none';
      if(mqEls.setupPanel)       mqEls.setupPanel.style.display = 'block';
    }
  }

  function bindEvents(){
    if(mqEls.tabPractice){
      mqEls.tabPractice.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        switchMode('practice');
      });
    }
    if(mqEls.tabSelftest){
      mqEls.tabSelftest.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        switchMode('selftest');
      });
    }

    // 關卡難度選擇
    if(mqEls.levelChipsWrap){
      mqEls.levelChipsWrap.addEventListener('click', function(e){
        var btn = e.target.closest('.mq-chip[data-level]');
        if(!btn) return;
        currentLevel = btn.getAttribute('data-level');
        var allChips = mqEls.levelChipsWrap.querySelectorAll('.mq-chip');
        for(var i = 0; i < allChips.length; i++){
          allChips[i].classList.toggle('active', allChips[i] === btn);
        }
        // 切換大關卡時將單段自選重設為全部段別
        selectedTable = 'all';
        if(mqEls.tableChipsWrap){
          var tChips = mqEls.tableChipsWrap.querySelectorAll('.mq-table-chip');
          for(var j = 0; j < tChips.length; j++){
            tChips[j].classList.toggle('active', tChips[j].getAttribute('data-table') === 'all');
          }
        }
        if(MathApp.sfx) MathApp.sfx('click');
        newRound();
      });
    }

    // 1~9 單段自選專練
    if(mqEls.tableChipsWrap){
      mqEls.tableChipsWrap.addEventListener('click', function(e){
        var btn = e.target.closest('.mq-table-chip[data-table]');
        if(!btn) return;
        selectedTable = btn.getAttribute('data-table');
        var tChips = mqEls.tableChipsWrap.querySelectorAll('.mq-table-chip');
        for(var i = 0; i < tChips.length; i++){
          tChips[i].classList.toggle('active', tChips[i] === btn);
        }
        if(MathApp.sfx) MathApp.sfx('click');
        newRound();
      });
    }

    // 自我測驗題數選擇
    if(mqEls.setupPanel){
      var countChips = mqEls.setupPanel.querySelectorAll('.chip[data-count]');
      countChips.forEach(function(chip){
        chip.addEventListener('click', function(){
          countChips.forEach(function(c){ c.classList.remove('active'); });
          chip.classList.add('active');
          selfTestConfig.total = Number(chip.getAttribute('data-count')) || 5;
          if(MathApp.sfx) MathApp.sfx('click');
        });
      });
    }

    if(mqEls.startSelftestBtn){
      mqEls.startSelftestBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        startSelfTest();
      });
    }
    if(mqEls.restartSelftestBtn){
      mqEls.restartSelftestBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        startSelfTest();
      });
    }
    if(mqEls.backPracticeBtn){
      mqEls.backPracticeBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        switchMode('practice');
      });
    }

    if(mqEls.speakBtn){
      mqEls.speakBtn.addEventListener('click', function(){
        if(!currentQ) return;
        if(MathApp.sfx) MathApp.sfx('click');
        if(MathApp.speak) MathApp.speak(currentQ.spokenPrompt);
      });
    }

    if(mqEls.helperToggleBtn){
      mqEls.helperToggleBtn.addEventListener('click', function(){
        if(!mqEls.helperDrawer) return;
        if(MathApp.sfx) MathApp.sfx('click');
        var isOpen = mqEls.helperDrawer.classList.toggle('open');
        mqEls.helperToggleBtn.innerHTML = isOpen
          ? '<i data-lucide="chevron-up"></i> 收合積木小幫手'
          : '<i data-lucide="blocks"></i> 展開積木小幫手';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      });
    }

    if(mqEls.checkBtn){
      mqEls.checkBtn.addEventListener('click', checkAnswer);
    }
    if(mqEls.nextBtn){
      mqEls.nextBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        newRound();
      });
    }

    // 虛擬數字鍵盤初始化
    if(MathApp.createNumpad){
      MathApp.createNumpad('mq-virtual-keypad', handleKeypadInput, {
        hasEnter: true,
        hasClear: false,
        enterLabel: '確認'
      });
    }

    // 實體鍵盤支援（當乘法挑戰測驗面板為開啟狀態時）
    document.addEventListener('keydown', function(e){
      var panelMul = document.getElementById('panel-mul');
      var subQuiz = document.getElementById('subpanel-mul-quiz');
      if(!panelMul || !subQuiz) return;
      if(!panelMul.classList.contains('active') || !subQuiz.classList.contains('active')) return;
      if(mqEls.quizCard && mqEls.quizCard.style.display === 'none') return;

      if(e.key >= '0' && e.key <= '9'){
        e.preventDefault();
        handleKeypadInput(e.key);
      } else if(e.key === 'Backspace'){
        e.preventDefault();
        handleKeypadInput('backspace');
      } else if(e.key === 'Enter'){
        e.preventDefault();
        handleKeypadInput('enter');
      }
    });

    // 初始化模式切換 Tab 滑塊
    (function initTabSlider(){
      var tabsEl = document.querySelector('#mul-quiz .mode-tabs');
      if(!tabsEl) return;
      var slider = document.createElement('div');
      slider.id = 'mq-mode-tab-slider';
      slider.className = 'mode-tab-slider';
      tabsEl.insertBefore(slider, tabsEl.firstChild);
      requestAnimationFrame(function(){
        updateTabSlider(mqEls.tabPractice);
      });
    })();

    if(MathApp.on){
      MathApp.on('subTabChange', function(info){
        if(info && info.unit === 'mul' && info.subTab === 'quiz'){
          requestAnimationFrame(function(){
            updateTabSlider(currentMode === 'practice' ? mqEls.tabPractice : mqEls.tabSelftest);
          });
        }
      });
      window.addEventListener('resize', function(){
        updateTabSlider(currentMode === 'practice' ? mqEls.tabPractice : mqEls.tabSelftest);
      });
    }
  }

  function init(){
    cacheDom();
    if(!mqEls.quizCard) return;
    bindEvents();
    newRound();
  }

  MathApp.mulQuiz = {
    init: init,
    generateQuestion: generateQuestion,
    validateQuestion: validateQuestion,
    newRound: newRound
  };

})();
