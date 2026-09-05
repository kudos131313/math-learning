/**
 * ==========================================================================
 * 小小挑戰 ＆ 自我測驗模組 (QUIZ, KEYPAD & SELF-TEST)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var quizEls = {};
  var currentMode = 'practice'; // 'practice' | 'selftest'
  var practiceScore = { correct: 0, streak: 0 };

  var selfTestConfig = { total: 5 };
  var selfTestState = {
    index: 0,
    correct: 0,
    startTime: 0,
    timerId: null,
    history: []
  };

  var current = null; // { type: 'A'|'B', th, h, t, o }
  var currentPromptSpeech = '';
  var activeInput = null;
  var keypadEl = null;

  function initElements(){
    quizEls = {
      card: document.getElementById('quiz-card'),
      kicker: document.getElementById('quiz-kicker'),
      stage: document.getElementById('quiz-stage'),
      answer: document.getElementById('quiz-answer'),
      checkBtn: document.getElementById('check-btn'),
      nextBtn: document.getElementById('next-btn'),
      feedback: document.getElementById('feedback'),
      speakBtn: document.getElementById('speak-quiz-btn'),
      // 分頁標籤
      tabPractice: document.getElementById('tab-practice'),
      tabSelftest: document.getElementById('tab-selftest'),
      // 自由練習
      practiceScoreRow: document.getElementById('practice-score-row'),
      scoreCorrect: document.getElementById('score-correct'),
      scoreStreak: document.getElementById('score-streak'),
      // 自我測驗：設定面板
      setupPanel: document.getElementById('selftest-setup-panel'),
      startBtn: document.getElementById('start-selftest-btn'),
      countChips: document.querySelectorAll('.selftest-options .chip'),
      // 自我測驗：進行中
      progressRow: document.getElementById('selftest-progress-row'),
      progressText: document.getElementById('selftest-progress-text'),
      progressFill: document.getElementById('selftest-progress-fill'),
      timerText: document.getElementById('selftest-timer'),
      // 自我測驗：結算成果卡
      resultCard: document.getElementById('selftest-result-card'),
      resultStars: document.getElementById('result-stars'),
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      resultScore: document.getElementById('result-score'),
      resultAccuracy: document.getElementById('result-accuracy'),
      resultTime: document.getElementById('result-time'),
      resultReview: document.getElementById('result-review'),
      restartBtn: document.getElementById('restart-selftest-btn'),
      backPracticeBtn: document.getElementById('back-practice-btn')
    };

    keypadEl = document.getElementById('virtual-keypad');
  }

  /* 模式切換邏輯與 Tab 滑塊 */
  function updateTabSlider(activeTab){
    var slider = document.getElementById('mode-tab-slider');
    if(!slider || !activeTab) return;
    var tabsRect = activeTab.parentElement.getBoundingClientRect();
    var tabRect  = activeTab.getBoundingClientRect();
    slider.style.left  = (tabRect.left - tabsRect.left - 4) + 'px';
    slider.style.width = tabRect.width + 'px';
  }

  function switchMode(mode){
    currentMode = mode;
    if(mode === 'practice'){
      quizEls.tabPractice.classList.add('active');
      quizEls.tabPractice.setAttribute('aria-selected', 'true');
      quizEls.tabSelftest.classList.remove('active');
      quizEls.tabSelftest.setAttribute('aria-selected', 'false');
      updateTabSlider(quizEls.tabPractice);

      quizEls.practiceScoreRow.style.display = 'flex';
      quizEls.setupPanel.style.display = 'none';
      quizEls.progressRow.style.display = 'none';
      quizEls.resultCard.style.display = 'none';
      quizEls.card.style.display = 'block';

      stopSelfTestTimer();
      newRound();
    } else {
      quizEls.tabSelftest.classList.add('active');
      quizEls.tabSelftest.setAttribute('aria-selected', 'true');
      quizEls.tabPractice.classList.remove('active');
      quizEls.tabPractice.setAttribute('aria-selected', 'false');
      updateTabSlider(quizEls.tabSelftest);

      quizEls.practiceScoreRow.style.display = 'none';
      quizEls.progressRow.style.display = 'none';
      quizEls.card.style.display = 'none';
      quizEls.resultCard.style.display = 'none';
      quizEls.setupPanel.style.display = 'block';
    }
  }

  /* 啟動自我測驗 */
  function startSelfTest(){
    selfTestState.index = 0;
    selfTestState.correct = 0;
    selfTestState.history = [];
    selfTestState.startTime = Date.now();

    quizEls.setupPanel.style.display = 'none';
    quizEls.resultCard.style.display = 'none';
    quizEls.progressRow.style.display = 'block';
    quizEls.card.style.display = 'block';

    updateSelfTestProgress();
    startSelfTestTimer();
    newRound();
  }

  function startSelfTestTimer(){
    stopSelfTestTimer();
    quizEls.timerText.textContent = '⏱️ 00:00';
    selfTestState.timerId = setInterval(function(){
      var elapsedSec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
      quizEls.timerText.textContent = '⏱️ ' + MathApp.utils.formatTime(elapsedSec);
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
    quizEls.progressText.textContent = '第 ' + currentDisplayNum + ' / ' + selfTestConfig.total + ' 題';
    var pct = Math.round((selfTestState.index / selfTestConfig.total) * 100);
    quizEls.progressFill.style.width = pct + '%';
  }

  /* 自我測驗結算 */
  function finishSelfTest(){
    stopSelfTestTimer();
    var elapsedSec = Math.floor((Date.now() - selfTestState.startTime) / 1000);
    var total = selfTestConfig.total;
    var correct = selfTestState.correct;
    var scorePct = Math.round((correct / total) * 100);

    quizEls.card.style.display = 'none';
    quizEls.progressRow.style.display = 'none';
    quizEls.resultCard.style.display = 'block';

    quizEls.resultScore.textContent = scorePct;
    quizEls.resultAccuracy.textContent = correct + ' / ' + total;
    quizEls.resultTime.textContent = MathApp.utils.formatTime(elapsedSec);

    // 星等與稱號評定
    if(scorePct === 100){
      quizEls.resultStars.textContent = '⭐⭐⭐';
      quizEls.resultTitle.textContent = '滿分達成！數學小博士！';
      quizEls.resultSubtitle.textContent = '恭喜你全數答對！你對百位、十位與個位的概念已經完全掌握！';
      MathApp.speak('滿分達成！太厲害了，恭喜你得到三顆星！');
    } else if(scorePct >= 80){
      quizEls.resultStars.textContent = '⭐⭐';
      quizEls.resultTitle.textContent = '表現極佳！太厲害了！';
      quizEls.resultSubtitle.textContent = '只差一點點就滿分囉，多練習幾次一定能拿下滿分！';
      MathApp.speak('表現極佳！得到兩顆星，繼續加油！');
    } else if(scorePct >= 60){
      quizEls.resultStars.textContent = '⭐';
      quizEls.resultTitle.textContent = '順利過關！再接再厲！';
      quizEls.resultSubtitle.textContent = '你已經掌握大部分的數字積木概念，多觀察積木的滿十進位喔！';
      MathApp.speak('順利過關！多練習就會越來越熟練喔！');
    } else {
      quizEls.resultStars.textContent = '🌱';
      quizEls.resultTitle.textContent = '完成挑戰！繼續練習！';
      quizEls.resultSubtitle.textContent = '沒關係，多用上方的「數字製造機」動手操作積木，會更容易理解喔！';
      MathApp.speak('挑戰完成！多堆幾次積木，一定會更進步喔！');
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
    quizEls.resultReview.innerHTML = reviewHtml;

    MathApp.sfx(scorePct >= 60 ? 'correct' : 'click');
  }

  /* 出題邏輯 */
  function newRound(){
    quizEls.feedback.textContent = '';
    quizEls.feedback.className = 'feedback';
    quizEls.nextBtn.style.display = 'none';
    quizEls.checkBtn.style.display = 'inline-block';
    quizEls.checkBtn.disabled = false;

    var thousandEnabled = MathApp.thousand.isEnabled();
    var type = Math.random() < 0.5 ? 'A' : 'B';
    var th = 0, h = 0, t = 0, o = 0;

    if(type === 'A'){
      var n = thousandEnabled ? MathApp.randInt(1, 9999) : MathApp.randInt(1, 999);
      th = Math.floor(n / 1000);
      var rem = n % 1000;
      h = Math.floor(rem / 100);
      t = Math.floor((rem % 100) / 10);
      o = rem % 10;
    } else {
      do {
        th = thousandEnabled ? MathApp.randInt(0, 9) : 0;
        h  = MathApp.randInt(0, 9);
        t  = MathApp.randInt(0, 9);
        o  = MathApp.randInt(0, 9);
      } while(th === 0 && h === 0 && t === 0 && o === 0);
    }
    current = { type: type, th: th, h: h, t: t, o: o };

    if(type === 'A'){
      var n2 = (thousandEnabled ? th * 1000 : 0) + h * 100 + t * 10 + o;
      quizEls.kicker.textContent = thousandEnabled
        ? '看數字，寫出千位・百位・十位・個位各有幾個'
        : '看數字，寫出百位・十位・個位各有幾個';
      quizEls.stage.innerHTML = '<div class="big-num num-font">' + n2 + '</div>';

      var answerFieldsHtml = '<div class="answer-area">';
      if(thousandEnabled){
        answerFieldsHtml += '<div class="field th"><label>千位</label><input type="text" readonly inputmode="none" id="ans-th" placeholder="0"></div>';
      }
      answerFieldsHtml +=
        '<div class="field h"><label>百位</label><input type="text" readonly inputmode="none" id="ans-h" placeholder="0"></div>' +
        '<div class="field t"><label>十位</label><input type="text" readonly inputmode="none" id="ans-t" placeholder="0"></div>' +
        '<div class="field o"><label>個位</label><input type="text" readonly inputmode="none" id="ans-o" placeholder="0"></div>' +
      '</div>';
      quizEls.answer.innerHTML = answerFieldsHtml;

      currentPromptSpeech = (thousandEnabled
        ? '看數字，寫出千位、百位、十位、個位各有幾個。這是 '
        : '看數字，寫出百位、十位、個位各有幾個。這是 ') + MathApp.numberToChinese(n2);
    } else {
      quizEls.kicker.textContent = '看積木，寫出這是多少';
      var rowTh = thousandEnabled ? MathApp.renderGroupedBlocksHtml('th', th) : '';
      var rowH  = MathApp.renderGroupedBlocksHtml('h', h);
      var rowT  = MathApp.renderGroupedBlocksHtml('t', t);
      var rowO  = MathApp.renderGroupedBlocksHtml('o', o);
      var groups = [];
      if(thousandEnabled && th > 0) groups.push('<div class="grp"><div class="lbl">千</div><div class="row">' + rowTh + '</div></div>');
      if(h > 0) groups.push('<div class="grp"><div class="lbl">百</div><div class="row">' + rowH + '</div></div>');
      if(t > 0) groups.push('<div class="grp"><div class="lbl">十</div><div class="row">' + rowT + '</div></div>');
      if(o > 0) groups.push('<div class="grp"><div class="lbl">個</div><div class="row">' + rowO + '</div></div>');
      quizEls.stage.innerHTML = '<div class="quiz-blocks">' + groups.join('') + '</div>';
      quizEls.answer.innerHTML =
        '<div class="answer-area single-input">' +
          '<div class="field"><label>這是多少？</label><input type="text" readonly inputmode="none" id="ans-n" placeholder="？"></div>' +
        '</div>';
      currentPromptSpeech = '看積木，寫出這是多少';
    }

    // 初始化輸入焦點並綁定點擊事件
    var currentInputs = quizEls.answer.querySelectorAll('input');
    currentInputs.forEach(function(inp){
      inp.addEventListener('click', function(){
        setActiveInput(inp);
      });
    });
    if(currentInputs.length > 0){
      setActiveInput(currentInputs[0]);
    }

    MathApp.speak(currentPromptSpeech);
  }

  function markField(input, ok){
    if(!input) return;
    input.style.background  = ok ? 'rgba(46,158,130,.18)' : 'rgba(232,96,76,.18)';
    input.style.borderColor = ok ? 'var(--good)' : 'var(--bad)';
  }

  /* 核對答案 */
  function checkAnswer(){
    if(!current) return;
    var thousandEnabled = MathApp.thousand.isEnabled();
    var allOk = false;
    var targetNum = (thousandEnabled ? current.th * 1000 : 0) + current.h * 100 + current.t * 10 + current.o;

    var expParts = [];
    var thVal = (thousandEnabled ? current.th : 0);
    if(thousandEnabled && thVal > 0) expParts.push(thVal + '個千');
    if(current.h > 0) expParts.push(current.h + '個百');
    if(current.t > 0) expParts.push(current.t + '個十');
    if(current.o > 0 || expParts.length === 0) expParts.push(current.o + '個一');
    var explainStr = expParts.join(' ＋ ') + ' ＝ ' + targetNum;

    if(current.type === 'A'){
      var ith = document.getElementById('ans-th');
      var ih  = document.getElementById('ans-h');
      var it  = document.getElementById('ans-t');
      var io  = document.getElementById('ans-o');

      var okTh = true;
      if(thousandEnabled && ith){
        var vth = parseInt(ith.value, 10);
        okTh = vth === current.th;
        markField(ith, okTh);
      }
      var vh = parseInt(ih.value, 10);
      var vt = parseInt(it.value, 10);
      var vo = parseInt(io.value, 10);
      var okH = vh === current.h, okT = vt === current.t, okO = vo === current.o;
      markField(ih, okH);
      markField(it, okT);
      markField(io, okO);
      allOk = okTh && okH && okT && okO;
    } else {
      var inp = document.getElementById('ans-n');
      var v = parseInt(inp.value, 10);
      var ok = v === targetNum;
      markField(inp, ok);
      allOk = ok;
    }

    quizEls.checkBtn.style.display = 'none';

    // 依模式更新資料
    if(currentMode === 'practice'){
      quizEls.nextBtn.textContent = '下一題 →';
      quizEls.nextBtn.style.display = 'inline-block';

      if(allOk){
        practiceScore.correct++;
        practiceScore.streak++;
        var goodMsg = MathApp.utils.goodMsgs[MathApp.randInt(0, MathApp.utils.goodMsgs.length - 1)];
        quizEls.feedback.className = 'feedback good';
        quizEls.feedback.innerHTML = goodMsg + '<span class="explain">' + explainStr + '</span>';
        if(typeof window.anime !== 'undefined'){
          window.anime({ targets: quizEls.card, scale: [1, 1.025, 1], duration: 420, easing: 'easeOutElastic(1, .6)' });
        } else {
          quizEls.card.classList.remove('shake');
          quizEls.card.classList.add('pulseGood');
          setTimeout(function(){ quizEls.card.classList.remove('pulseGood'); }, 400);
        }
        MathApp.sfx('correct');
        MathApp.speak(goodMsg + '。' + explainStr);
        MathApp.utils.launchConfetti();
      } else {
        practiceScore.streak = 0;
        var badMsg = MathApp.utils.badMsgs[MathApp.randInt(0, MathApp.utils.badMsgs.length - 1)];
        quizEls.feedback.className = 'feedback bad';
        quizEls.feedback.innerHTML = badMsg + '<span class="explain">正確答案：' + explainStr + '</span>';
        if(typeof window.anime !== 'undefined'){
          window.anime({ targets: quizEls.card, translateX: [-10, 10, -7, 7, -3, 3, 0], duration: 380, easing: 'easeInOutQuad' });
        } else {
          quizEls.card.classList.remove('pulseGood');
          quizEls.card.classList.add('shake');
          setTimeout(function(){ quizEls.card.classList.remove('shake'); }, 380);
        }
        MathApp.sfx('wrong');
        MathApp.speak(badMsg + '。正確答案是，' + explainStr);
      }
      quizEls.scoreCorrect.textContent = practiceScore.correct;
      quizEls.scoreStreak.textContent  = practiceScore.streak;

    } else {
      // 自我測驗模式紀錄
      if(allOk){ selfTestState.correct++; }
      selfTestState.history.push({
        ok: allOk,
        summary: current.type === 'A'
          ? ('數字 ' + targetNum + '（' + (thousandEnabled ? '千:' + current.th + ' ' : '') + '百:' + current.h + ' 十:' + current.t + ' 個:' + current.o + '）')
          : ('積木題共 ' + targetNum)
      });

      var isLast = (selfTestState.index + 1) >= selfTestConfig.total;
      quizEls.nextBtn.textContent = isLast ? '查看測驗成果 🏆' : '下一題 →';
      quizEls.nextBtn.style.display = 'inline-block';

      if(allOk){
        var goodMsg2 = MathApp.utils.goodMsgs[MathApp.randInt(0, MathApp.utils.goodMsgs.length - 1)];
        quizEls.feedback.className = 'feedback good';
        quizEls.feedback.innerHTML = goodMsg2 + '<span class="explain">' + explainStr + '</span>';
        if(typeof window.anime !== 'undefined'){
          window.anime({ targets: quizEls.card, scale: [1, 1.025, 1], duration: 420, easing: 'easeOutElastic(1, .6)' });
        }
        MathApp.sfx('correct');
        MathApp.speak(goodMsg2);
        MathApp.utils.launchConfetti();
      } else {
        var badMsg2 = MathApp.utils.badMsgs[MathApp.randInt(0, MathApp.utils.badMsgs.length - 1)];
        quizEls.feedback.className = 'feedback bad';
        quizEls.feedback.innerHTML = badMsg2 + '<span class="explain">正確答案：' + explainStr + '</span>';
        if(typeof window.anime !== 'undefined'){
          window.anime({ targets: quizEls.card, translateX: [-10, 10, -7, 7, -3, 3, 0], duration: 380, easing: 'easeInOutQuad' });
        }
        MathApp.sfx('wrong');
        MathApp.speak(badMsg2);
      }
    }
  }

  function handleNext(){
    if(currentMode === 'practice'){
      newRound();
    } else {
      selfTestState.index++;
      if(selfTestState.index >= selfTestConfig.total){
        finishSelfTest();
      } else {
        updateSelfTestProgress();
        newRound();
      }
    }
  }

  /* ---------------- 虛擬數字鍵盤與焦點控制 (KEYPAD) ---------------- */
  function setActiveInput(inputEl){
    if(!inputEl) return;
    activeInput = inputEl;
    var allInputs = quizEls.answer.querySelectorAll('input');
    allInputs.forEach(function(inp){ inp.classList.remove('is-active'); });
    inputEl.classList.add('is-active');
  }

  function handleKeypadInput(val){
    if(!activeInput || !current) return;
    if(quizEls.nextBtn.style.display !== 'none') return;
    var thousandEnabled = MathApp.thousand.isEnabled();

    if(current.type === 'A'){
      var num = parseInt(val, 10);
      if(isNaN(num) || num < 0 || num > 9) return;
      activeInput.value = num;
      MathApp.sfx('click');

      // 自動跳格：千位 -> 百位 -> 十位 -> 個位
      if(activeInput.id === 'ans-th'){
        var nextH = document.getElementById('ans-h');
        if(nextH) setActiveInput(nextH);
      } else if(activeInput.id === 'ans-h'){
        var nextT = document.getElementById('ans-t');
        if(nextT) setActiveInput(nextT);
      } else if(activeInput.id === 'ans-t'){
        var nextO = document.getElementById('ans-o');
        if(nextO) setActiveInput(nextO);
      }
    } else {
      var currVal = activeInput.value;
      var maxLen = thousandEnabled ? 4 : 3;
      if(currVal.length >= maxLen) return;
      if(currVal === '0'){
        activeInput.value = val;
      } else {
        activeInput.value = currVal + val;
      }
      MathApp.sfx('click');
    }
  }

  function handleKeypadBackspace(){
    if(!activeInput || !current) return;
    if(quizEls.nextBtn.style.display !== 'none') return;
    var thousandEnabled = MathApp.thousand.isEnabled();

    if(current.type === 'A'){
      if(activeInput.value !== ''){
        activeInput.value = '';
      } else {
        if(activeInput.id === 'ans-o'){
          var prevT = document.getElementById('ans-t');
          if(prevT){ setActiveInput(prevT); prevT.value = ''; }
        } else if(activeInput.id === 'ans-t'){
          var prevH = document.getElementById('ans-h');
          if(prevH){ setActiveInput(prevH); prevH.value = ''; }
        } else if(activeInput.id === 'ans-h' && thousandEnabled){
          var prevTh = document.getElementById('ans-th');
          if(prevTh){ setActiveInput(prevTh); prevTh.value = ''; }
        }
      }
      MathApp.sfx('click');
    } else {
      var currVal = activeInput.value;
      if(currVal.length > 0){
        activeInput.value = currVal.slice(0, -1);
        MathApp.sfx('click');
      }
    }
  }

  function handleKeypadEnter(){
    if(quizEls.nextBtn.style.display !== 'none'){
      handleNext();
    } else if(quizEls.checkBtn.style.display !== 'none' && !quizEls.checkBtn.disabled){
      checkAnswer();
    }
  }

  function init(){
    initElements();

    if(quizEls.checkBtn) quizEls.checkBtn.addEventListener('click', checkAnswer);
    if(quizEls.nextBtn)  quizEls.nextBtn.addEventListener('click', handleNext);
    if(quizEls.speakBtn) quizEls.speakBtn.addEventListener('click', function(){
      MathApp.speak(currentPromptSpeech);
    });

    if(quizEls.tabPractice) quizEls.tabPractice.addEventListener('click', function(){ switchMode('practice'); });
    if(quizEls.tabSelftest) quizEls.tabSelftest.addEventListener('click', function(){ switchMode('selftest'); });

    quizEls.countChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        quizEls.countChips.forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        selfTestConfig.total = parseInt(chip.getAttribute('data-count'), 10) || 5;
      });
    });

    if(quizEls.startBtn)        quizEls.startBtn.addEventListener('click', startSelfTest);
    if(quizEls.restartBtn)      quizEls.restartBtn.addEventListener('click', startSelfTest);
    if(quizEls.backPracticeBtn) quizEls.backPracticeBtn.addEventListener('click', function(){ switchMode('practice'); });

    // 綁定虛擬鍵盤點擊事件
    if(keypadEl){
      keypadEl.querySelectorAll('.num-key').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.preventDefault();
          var key = btn.getAttribute('data-key');
          if(key === 'backspace'){
            handleKeypadBackspace();
          } else if(key === 'enter'){
            handleKeypadEnter();
          } else if(key !== null) {
            handleKeypadInput(key);
          }
        });
      });
    }

    // 綁定實體鍵盤全局支援
    window.addEventListener('keydown', function(e){
      var diagModal = document.getElementById('diagnostics-modal');
      if(diagModal && diagModal.style.display !== 'none') return;

      if(quizEls.card && quizEls.card.style.display !== 'none'){
        if(e.key >= '0' && e.key <= '9'){
          e.preventDefault();
          handleKeypadInput(e.key);
        } else if(e.key === 'Backspace'){
          e.preventDefault();
          handleKeypadBackspace();
        } else if(e.key === 'Enter'){
          e.preventDefault();
          handleKeypadEnter();
        }
      }
    });

    // 初始化 Tab 滑塊
    (function initTabSlider(){
      var tabsEl = document.querySelector('.mode-tabs');
      if(!tabsEl) return;
      var slider = document.createElement('div');
      slider.id = 'mode-tab-slider';
      slider.className = 'mode-tab-slider';
      tabsEl.insertBefore(slider, tabsEl.firstChild);
      requestAnimationFrame(function(){
        updateTabSlider(quizEls.tabPractice);
      });
    })();

    // 監聽千位數模式變更事件：重新出題以適應位數
    MathApp.on('thousandChange', function(){
      newRound();
    });

    // 監聽主分頁切換至 quiz 時聚焦輸入框
    MathApp.on('tabChange', function(tab){
      if(tab === 'quiz'){
        var firstInput = document.querySelector('#quiz-answer input');
        if(firstInput) setActiveInput(firstInput);
      }
    });

    newRound();
  }

  MathApp.quiz = {
    init: init,
    newRound: newRound,
    checkAnswer: checkAnswer,
    switchMode: switchMode,
    startSelfTest: startSelfTest,
    setActiveInput: setActiveInput
  };

})();
