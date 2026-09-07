/**
 * ==========================================================================
 * 單元 2：規律神探挑戰賽 - 考卷題型精準練習 (SEQ QUIZ MODULE)
 * 100% 精準對接考卷 6 大題型，配備偵探分析與積木小幫手
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  // 考卷真題精選庫 (對應使用者照片中的 6 道經典考題)
  var PAPER_EXAMS = [
    {
      id: 'paper-1',
      title: '考卷第 (1) 題：1 個 1 個倒數（跨百退位）',
      ruleDesc: '每次減少 1（倒數），注意 200 的前一個是 199！',
      step: -1,
      numbers: [201, 200, 199, 198, 197, 196],
      blanks: [1, 4, 5] // 200, 197, 196 為空格
    },
    {
      id: 'paper-2',
      title: '考卷第 (2) 題：10 個 10 個數（跨百進位）',
      ruleDesc: '每次增加 10，十位 9 滿十進一，199 變成 209！',
      step: 10,
      numbers: [189, 199, 209, 219, 229, 239],
      blanks: [2, 4] // 209, 229 為空格
    },
    {
      id: 'paper-3',
      title: '考卷第 (3) 題：1 個 1 個倒數（整十退位）',
      ruleDesc: '每次減少 1（倒數），注意 190 倒退 1 個是 189！',
      step: -1,
      numbers: [190, 189, 188, 187, 186, 185],
      blanks: [1, 4, 5] // 189, 186, 185 為空格
    },
    {
      id: 'paper-4',
      title: '考卷第 (4) 題：10 個 10 個倒數（跨百退位與反推）',
      ruleDesc: '每次減少 10，205 倒退是 195；最左邊第一格反推加 10 是 215！',
      step: -10,
      numbers: [215, 205, 195, 185, 175],
      blanks: [0, 2] // 215, 195 為空格
    },
    {
      id: 'paper-5',
      title: '考卷第 (5) 題：10 個 10 個數（標準十位進階）',
      ruleDesc: '每次增加 10，個位 4 固定不動，十位依序增加！',
      step: 10,
      numbers: [124, 134, 144, 154, 164, 174],
      blanks: [1, 4] // 134, 164 為空格
    },
    {
      id: 'paper-6',
      title: '考卷第 (6) 題：10 個 10 個數（二位數跨百）',
      ruleDesc: '每次增加 10，99 加 10 跨入三位數變成 109！',
      step: 10,
      numbers: [89, 99, 109, 119, 129, 139],
      blanks: [2, 3] // 109, 119 為空格
    }
  ];

  var currentMode = 'count1'; // 'count1', 'count10', 'count5', 'count2', 'mystery', 'mix', 'paper'
  var paperExamIndex = 0;
  var currentQuestion = null;
  var userInputs = {}; // { blankIndex: "字串" }
  var activeSlotIdx = null;

  // DOM 元素快取
  var titleEl = null;
  var slotsRowEl = null;
  var detectiveCardEl = null;
  var detectiveTitleEl = null;
  var detectiveBodyEl = null;
  var blockHelperModalEl = null;
  var scoreStatsEl = null;

  // P4: 盲猜步長 DOM 引用
  var mysteryCardEl = null;
  var mysteryTitleEl = null;
  var mysteryOptionsEl = null;
  var isMysteryStepSolved = true;

  var correctCount = 0;
  var totalTried = 0;

  /* 生成動態隨機題目 (P4 深度擴展) */
  function generateRandomQuestion(mode){
    var length = 6;
    var step = 1;
    var start = 100;
    var title = '';
    var ruleDesc = '';
    var isMystery = (mode === 'mystery');
    var mysteryOptions = [];

    if(mode === 'count1'){
      // ±1 題型，特別挑選跨百或整十
      var isBackward = Math.random() > 0.45;
      step = isBackward ? -1 : 1;
      var pivot = [200, 300, 100, 190, 290, 150][Math.floor(Math.random() * 6)];
      start = isBackward ? pivot + Math.floor(Math.random() * 3) + 1 : pivot - Math.floor(Math.random() * 3) - 1;
      title = (isBackward ? '1 個 1 個倒數挑戰' : '1 個 1 個數挑戰') + '（跨百與整十關卡）';
      ruleDesc = '規律是每次 ' + (step > 0 ? '增加 1' : '減少 1') + '，特別注意整百與整十的交界！';
    } else if(mode === 'count10'){
      // ±10 題型，特別挑選跨百臨界
      var isBackward10 = Math.random() > 0.4;
      step = isBackward10 ? -10 : 10;
      var onesDigit = [9, 5, 4, 8, 2][Math.floor(Math.random() * 5)];
      var baseHundred = [100, 200, 300][Math.floor(Math.random() * 3)];
      start = isBackward10 ? baseHundred + 10 + onesDigit : baseHundred - 20 + onesDigit;
      title = (isBackward10 ? '10 個 10 個倒數挑戰' : '10 個 10 個數挑戰') + '（跨百進退位）';
      ruleDesc = '規律是每次 ' + (step > 0 ? '增加 10' : '減少 10') + '，注意十位滿十進一或向百位借一！';
    } else if(mode === 'count5'){
      // P4: 5個5個數
      var isBackward5 = Math.random() > 0.4;
      step = isBackward5 ? -5 : 5;
      start = 120 + Math.floor(Math.random() * 20) * 5;
      title = (isBackward5 ? '5 個 5 個倒數挑戰' : '5 個 5 個數挑戰') + '（鐘面分針與錢幣）';
      ruleDesc = '規律是每次 ' + (step > 0 ? '增加 5' : '減少 5') + '，觀察個位在「0」與「5」之間規律跳動！';
    } else if(mode === 'count2'){
      // P4: 2個2個數
      var isBackward2 = Math.random() > 0.4;
      step = isBackward2 ? -2 : 2;
      var isEven = Math.random() > 0.3;
      start = 100 + Math.floor(Math.random() * 40) * 2 + (isEven ? 0 : 1);
      title = (isBackward2 ? '2 個 2 個倒數挑戰' : '2 個 2 個數挑戰') + '（雙數步伐）';
      ruleDesc = '規律是每次 ' + (step > 0 ? '增加 2' : '減少 2') + '，注意個位數字的規律步伐！';
    } else if(mode === 'mystery'){
      // P4: 盲猜步長神探題
      var stepChoices = [10, -10, 5, -5, 2, -2];
      step = stepChoices[Math.floor(Math.random() * stepChoices.length)];
      var baseM = 100 + Math.floor(Math.random() * 15) * 10;
      start = step < 0 ? baseM + 60 : baseM;
      title = '🕵️ 盲猜步長神探題（先猜規則，再解密！）';
      ruleDesc = '仔細觀察第 1 格與第 2 格的差距，推理出隱藏的跳數步長！';

      // 候選選項生成（包含正確答案與干擾項）
      var pool = [10, -10, 5, -5, 2, -2, 1, -1];
      var dist = pool.filter(function(x){ return x !== step; });
      dist.sort(function(){ return Math.random() - 0.5; });
      mysteryOptions = [step, dist[0], dist[1], dist[2]].sort(function(){ return Math.random() - 0.5; });
    } else if(mode === 'mix'){
      // 綜合跳數
      var allSteps = [10, -10, 1, -1, 5, -5, 2, -2, 100, -100];
      step = allSteps[Math.floor(Math.random() * allSteps.length)];
      var base = Math.floor(Math.random() * 5) * 100 + 100;
      start = step < 0 ? base + 200 : base;
      title = '百數神探大挑戰（跳數步長：' + (step > 0 ? '+' : '') + step + '）';
      ruleDesc = '仔細觀察前後數字的關係，找出跳數的節奏！';
    }

    var numbers = [];
    for(var i = 0; i < length; i++){
      numbers.push(start + i * step);
    }

    // 挑選空格
    var blanks = [];
    if(isMystery){
      // 盲猜模式：第 0, 1 格必須已知，空格安排在第 2~5 格
      blanks = [2, 4];
    } else {
      // 首格未知倒推題比重強化 (約 35% 機率將 0 納入挖空)
      var pickFirst = Math.random() < 0.35;
      if(pickFirst){
        blanks.push(0);
      }
      while(blanks.length < 2){
        var idx = Math.floor(Math.random() * length);
        if(blanks.indexOf(idx) === -1){
          blanks.push(idx);
        }
      }
      blanks.sort(function(a, b){ return a - b; });
    }

    return {
      id: 'rnd-' + Date.now(),
      title: title,
      ruleDesc: ruleDesc,
      step: step,
      numbers: numbers,
      blanks: blanks,
      isMystery: isMystery,
      mysteryOptions: mysteryOptions
    };
  }

  /* 載入題目 */
  function loadQuestion(q){
    currentQuestion = q;
    userInputs = {};
    activeSlotIdx = null;

    if(titleEl) titleEl.innerHTML = '<i data-lucide="award"></i> ' + q.title;

    // 關閉提示框
    if(detectiveCardEl) detectiveCardEl.style.display = 'none';

    // P4: 盲猜步長互動區渲染
    if(mysteryCardEl){
      if(q.isMystery){
        isMysteryStepSolved = false;
        mysteryCardEl.style.display = 'flex';
        if(mysteryTitleEl){
          mysteryTitleEl.innerHTML = '🕵️ <b>步驟 1</b>：請觀察前兩格（' + q.numbers[0] + ' ➔ ' + q.numbers[1] + '），猜猜看跳數規則是？';
        }
        if(mysteryOptionsEl){
          var optsHtml = '';
          q.mysteryOptions.forEach(function(opt){
            var sign = opt > 0 ? '＋' : '－';
            optsHtml += '<button class="mystery-btn" type="button" data-step="' + opt + '">' + sign + Math.abs(opt) + '</button>';
          });
          mysteryOptionsEl.innerHTML = optsHtml;

          // 綁定選項點擊事件
          mysteryOptionsEl.querySelectorAll('.mystery-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
              var chosen = parseInt(btn.getAttribute('data-step'), 10);
              if(chosen === q.step){
                isMysteryStepSolved = true;
                btn.classList.add('selected');
                mysteryTitleEl.innerHTML = '🎉 <b>太神了！猜對了！</b> 規則就是每次「' + (q.step > 0 ? '增加 ' : '減少 ') + Math.abs(q.step) + '」，請填入空格吧！';
                if(MathApp.sfx) MathApp.sfx('chime');
                if(MathApp.utils && MathApp.utils.showToast){
                  MathApp.utils.showToast('🎯 識破規律！現在請在下方填入空格答案！');
                }
              } else {
                if(MathApp.sfx) MathApp.sfx('wrong');
                if(MathApp.utils && MathApp.utils.showToast){
                  MathApp.utils.showToast('💡 差一點點！用 ' + q.numbers[1] + ' 減去 ' + q.numbers[0] + ' 算算看相差多少？');
                }
              }
            });
          });
        }
      } else {
        isMysteryStepSolved = true;
        mysteryCardEl.style.display = 'none';
      }
    }

    // 預設將焦點設在第一個空白格
    if(q.blanks && q.blanks.length > 0){
      activeSlotIdx = q.blanks[0];
    }

    renderSlots();
    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  /* 渲染考卷方格 */
  function renderSlots(){
    if(!slotsRowEl || !currentQuestion) return;
    var html = '';
    var nums = currentQuestion.numbers;
    var blanks = currentQuestion.blanks;

    for(var i = 0; i < nums.length; i++){
      var isBlank = blanks.indexOf(i) !== -1;
      var val = nums[i];

      if(i > 0){
        html += '<div class="paper-slot-dash" aria-hidden="true"></div>';
      }

      if(!isBlank){
        html += '<div class="paper-slot fixed" data-idx="' + i + '">' + val + '</div>';
      } else {
        var userVal = userInputs[i] || '';
        var isActive = (activeSlotIdx === i);
        var cls = 'paper-slot blank' + (isActive ? ' active' : '');
        html += '<div class="' + cls + '" data-idx="' + i + '" role="textbox" aria-label="第' + (i+1) + '格答案" tabindex="0">' + userVal + '</div>';
      }
    }

    slotsRowEl.innerHTML = html;

    // 綁定點擊事件
    var blankEls = slotsRowEl.querySelectorAll('.paper-slot.blank');
    blankEls.forEach(function(el){
      el.addEventListener('click', function(){
        var idx = parseInt(el.getAttribute('data-idx'), 10);
        setActiveSlot(idx);
      });
    });
  }

  /* 切換當前輸入焦點格 */
  function setActiveSlot(idx){
    activeSlotIdx = idx;
    var blankEls = slotsRowEl.querySelectorAll('.paper-slot.blank');
    blankEls.forEach(function(el){
      var i = parseInt(el.getAttribute('data-idx'), 10);
      el.classList.toggle('active', i === activeSlotIdx);
    });
    if(MathApp.sfx) MathApp.sfx('click');
  }

  /* 跳至下一個空白格 */
  function focusNextBlank(){
    if(!currentQuestion) return;
    var blanks = currentQuestion.blanks;
    var pos = blanks.indexOf(activeSlotIdx);
    if(pos !== -1 && pos < blanks.length - 1){
      setActiveSlot(blanks[pos + 1]);
    }
  }

  /* 鍵盤輸入處理 */
  function handleInputKey(key){
    if(activeSlotIdx === null || !currentQuestion) return;
    var cur = userInputs[activeSlotIdx] || '';

    if(key >= '0' && key <= '9'){
      if(cur.length < 4){
        cur += key;
        userInputs[activeSlotIdx] = cur;
        renderSlots();
        if(MathApp.sfx) MathApp.sfx('tick');

        // 當輸入位數達到目標數字長度時，自動跳到下一格，操作極順暢！
        var targetLen = String(currentQuestion.numbers[activeSlotIdx]).length;
        if(cur.length >= targetLen){
          focusNextBlank();
        }
      }
    } else if(key === 'DEL' || key === 'Backspace' || key === 'backspace'){
      if(cur.length > 0){
        cur = cur.slice(0, -1);
        userInputs[activeSlotIdx] = cur;
        renderSlots();
        if(MathApp.sfx) MathApp.sfx('tick');
      }
    } else if(key === 'CLEAR' || key === 'clear'){
      userInputs[activeSlotIdx] = '';
      renderSlots();
      if(MathApp.sfx) MathApp.sfx('tick');
    }
  }

  /* 檢查答案 */
  function checkAnswers(){
    if(!currentQuestion) return;

    // P4: 盲猜題目防呆：若尚未猜中步長，提醒先猜步長
    if(currentQuestion.isMystery && !isMysteryStepSolved){
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🕵️ 請先點擊上方步驟 1，猜出跳數規律步長喔！');
      }
      if(MathApp.sfx) MathApp.sfx('wrong');
      return;
    }

    var blanks = currentQuestion.blanks;
    var allFilled = true;
    var allCorrect = true;

    blanks.forEach(function(idx){
      var expected = currentQuestion.numbers[idx];
      var input = parseInt(userInputs[idx], 10);
      var el = slotsRowEl.querySelector('.paper-slot.blank[data-idx="' + idx + '"]');

      if(isNaN(input)){
        allFilled = false;
        allCorrect = false;
        if(el) el.classList.remove('correct', 'wrong');
      } else if(input === expected){
        if(el){
          el.classList.remove('wrong');
          el.classList.add('correct');
        }
      } else {
        allCorrect = false;
        if(el){
          el.classList.remove('correct');
          el.classList.add('wrong');
        }
      }
    });

    if(!allFilled){
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('還有空格還沒填入數字喔！');
      }
      if(MathApp.sfx) MathApp.sfx('wrong');
      return;
    }

    totalTried++;

    if(allCorrect){
      correctCount++;
      updateStats();
      if(MathApp.sfx) MathApp.sfx('cheer');
      if(MathApp.utils && MathApp.utils.launchConfetti){
        MathApp.utils.launchConfetti(true);
      }
      var praise = (MathApp.utils && MathApp.utils.pickRandomPraise) ? MathApp.utils.pickRandomPraise() : '答對了，太厲害了！';
      if(MathApp.speak) MathApp.speak(praise);
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🎉 ' + praise);
      }

      // 若在考卷真題模式，自動提示可以前往下一題
      setTimeout(function(){
        if(currentMode === 'paper' && paperExamIndex < PAPER_EXAMS.length - 1){
          // 自動推進至下一道考卷題
          nextQuestion();
        }
      }, 1600);

    } else {
      updateStats();
      if(MathApp.sfx) MathApp.sfx('wrong');
      var encourage = (MathApp.utils && MathApp.utils.pickRandomEncouragement) ? MathApp.utils.pickRandomEncouragement() : '差一點點，再檢查看看！';
      if(MathApp.speak) MathApp.speak(encourage);
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('💡 有些格子算錯囉，點擊「偵探找規律」看看提示吧！');
      }
    }
  }

  /* 下一題 */
  function nextQuestion(){
    if(currentMode === 'paper'){
      paperExamIndex = (paperExamIndex + 1) % PAPER_EXAMS.length;
      loadQuestion(PAPER_EXAMS[paperExamIndex]);
    } else {
      loadQuestion(generateRandomQuestion(currentMode));
    }
  }

  /* 顯示完整解答 */
  function revealAnswers(){
    if(!currentQuestion) return;
    if(currentQuestion.isMystery){
      isMysteryStepSolved = true;
      if(mysteryOptionsEl){
        var correctBtn = mysteryOptionsEl.querySelector('.mystery-btn[data-step="' + currentQuestion.step + '"]');
        if(correctBtn) correctBtn.classList.add('selected');
      }
    }
    currentQuestion.blanks.forEach(function(idx){
      userInputs[idx] = String(currentQuestion.numbers[idx]);
    });
    renderSlots();
    checkAnswers();
    showDetectiveHint();
  }

  /* 顯示偵探分析提示 (救生圈 1) */
  function showDetectiveHint(){
    if(!currentQuestion || !detectiveCardEl) return;
    var step = currentQuestion.step;
    var absStep = Math.abs(step);
    var dirText = step > 0 ? '每次增加 ' + step : '每次減少 ' + absStep;

    // 尋找兩個相鄰的非空格做具體範例
    var exA = null;
    var exB = null;
    for(var i = 0; i < currentQuestion.numbers.length - 1; i++){
      if(currentQuestion.blanks.indexOf(i) === -1 && currentQuestion.blanks.indexOf(i+1) === -1){
        exA = currentQuestion.numbers[i];
        exB = currentQuestion.numbers[i+1];
        break;
      }
    }

    var tipText = '';
    if(exA !== null && exB !== null){
      tipText = '看這裡：從 <b>' + exA + '</b> 到 <b>' + exB + '</b> 是 <b>' + dirText + '</b>！<br/>';
    }
    tipText += currentQuestion.ruleDesc;

    // P4: 若首格為空格，額外提供反推逆運算口訣
    if(currentQuestion.blanks && currentQuestion.blanks.indexOf(0) !== -1){
      var revText = step > 0 ? ('倒退減去 ' + absStep) : ('反向加上 ' + absStep);
      tipText += '<br/><span style="color:#b45309; font-weight:800;">🧭 反推指針：第 1 格最左邊也是空格！往右是「' + dirText + '」，那麼往左反推回前一個數字時，就必須「' + revText + '」喔！</span>';
    }

    if(detectiveTitleEl) detectiveTitleEl.textContent = '🕵️ 規律神探分析報告：' + dirText;
    if(detectiveBodyEl) detectiveBodyEl.innerHTML = tipText;
    detectiveCardEl.style.display = 'flex';

    if(MathApp.sfx) MathApp.sfx('chime');
  }

  /* 呼叫積木小幫手 (救生圈 2) */
  function openBlockHelper(){
    if(!currentQuestion || activeSlotIdx === null) return;
    var targetNum = currentQuestion.numbers[activeSlotIdx];
    var prevNum = activeSlotIdx > 0 ? currentQuestion.numbers[activeSlotIdx - 1] : targetNum;

    var modal = document.getElementById('seq-helper-modal');
    if(!modal) return;

    var modalTitle = document.getElementById('seq-helper-title');
    var modalBody = document.getElementById('seq-helper-body');

    if(modalTitle) modalTitle.textContent = '🧱 積木小幫手：這格的前一個是 ' + prevNum;
    if(modalBody && MathApp.renderGroupedBlocksHtml){
      var h = Math.floor(prevNum / 100);
      var t = Math.floor((prevNum % 100) / 10);
      var o = prevNum % 10;

      var html = '<p style="margin-bottom:12px; font-weight:700; color:#334155;">先看看前一個數字 <b>' + prevNum + '</b> 的積木樣子：</p>';
      html += '<div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:16px;">';
      html += '<div style="background:#f1f5f9; padding:8px 12px; border-radius:10px; text-align:center;"><b>百格板 (' + h + ')</b><br/>' + MathApp.renderGroupedBlocksHtml('h', h) + '</div>';
      html += '<div style="background:#f1f5f9; padding:8px 12px; border-radius:10px; text-align:center;"><b>十格條 (' + t + ')</b><br/>' + MathApp.renderGroupedBlocksHtml('t', t) + '</div>';
      html += '<div style="background:#f1f5f9; padding:8px 12px; border-radius:10px; text-align:center;"><b>小積木 (' + o + ')</b><br/>' + MathApp.renderGroupedBlocksHtml('o', o) + '</div>';
      html += '</div>';
      html += '<p style="font-size:14px; color:#0f766e; font-weight:800; text-align:center;">規則是「' + (currentQuestion.step > 0 ? '加 ' : '減 ') + Math.abs(currentQuestion.step) + '」，算算看這格應該填多少？</p>';
      modalBody.innerHTML = html;
    }

    modal.style.display = 'flex';
    if(MathApp.sfx) MathApp.sfx('pop');
  }

  function closeBlockHelper(){
    var modal = document.getElementById('seq-helper-modal');
    if(modal) modal.style.display = 'none';
  }

  /* 更新計分狀態 */
  function updateStats(){
    if(scoreStatsEl){
      scoreStatsEl.textContent = '累積答對：' + correctCount + ' 題 / 總作答：' + totalTried + ' 次';
    }
  }

  /* 設定測驗模式 */
  function setMode(mode, silent){
    currentMode = mode;
    document.querySelectorAll('.level-pill').forEach(function(pill){
      var m = pill.getAttribute('data-mode');
      pill.classList.toggle('active', m === currentMode);
    });

    if(currentMode === 'paper'){
      paperExamIndex = 0;
      loadQuestion(PAPER_EXAMS[0]);
    } else {
      loadQuestion(generateRandomQuestion(currentMode));
    }
    if(!silent && MathApp.sfx) MathApp.sfx('click');
  }

  /* 初始化模組 */
  function init(){
    titleEl = document.getElementById('paper-title-text');
    slotsRowEl = document.getElementById('paper-slots-row');
    detectiveCardEl = document.getElementById('detective-analysis-card');
    detectiveTitleEl = document.getElementById('detective-msg-title');
    detectiveBodyEl = document.getElementById('detective-msg-body');
    scoreStatsEl = document.getElementById('paper-score-stats');

    // P4: 快取盲猜步長 DOM
    mysteryCardEl = document.getElementById('seq-mystery-card');
    mysteryTitleEl = document.getElementById('seq-mystery-title');
    mysteryOptionsEl = document.getElementById('seq-mystery-options');

    // 關卡模式按鈕
    document.querySelectorAll('.level-pill').forEach(function(btn){
      btn.addEventListener('click', function(){
        var m = btn.getAttribute('data-mode');
        if(m) setMode(m);
      });
    });

    // 虛擬數字鍵盤：改用共用工廠函式（有全清鍵，無確認鍵）
    MathApp.createNumpad('seq-virtual-keypad', handleInputKey, { hasEnter: false, hasClear: true });

    // 實體鍵盤監聽
    window.addEventListener('keydown', function(e){
      if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      // 只有當前單元是 seq 且在 quiz 子分頁時響應
      var panelSeq = document.getElementById('panel-seq');
      var subPanelQuiz = document.getElementById('subpanel-seq-quiz');
      if(!panelSeq || !panelSeq.classList.contains('active')) return;
      if(!subPanelQuiz || !subPanelQuiz.classList.contains('active')) return;

      if(e.key >= '0' && e.key <= '9'){
        handleInputKey(e.key);
      } else if(e.key === 'Backspace'){
        handleInputKey('backspace');
      } else if(e.key === 'Enter'){
        checkAnswers();
      } else if(e.key === 'Tab'){
        e.preventDefault();
        focusNextBlank();
      }
    });

    // 主操作按鈕
    var checkBtn = document.getElementById('seq-quiz-check-btn');
    var nextBtn = document.getElementById('seq-quiz-next-btn');
    var hintBtn = document.getElementById('seq-rescue-hint-btn');
    var helperBtn = document.getElementById('seq-rescue-helper-btn');
    var revealBtn = document.getElementById('seq-rescue-reveal-btn');

    if(checkBtn) checkBtn.addEventListener('click', checkAnswers);
    if(nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if(hintBtn) hintBtn.addEventListener('click', showDetectiveHint);
    if(helperBtn) helperBtn.addEventListener('click', openBlockHelper);
    if(revealBtn) revealBtn.addEventListener('click', revealAnswers);

    // 積木小幫手彈窗關閉
    var closeHelperBtn = document.getElementById('close-seq-helper-btn');
    if(closeHelperBtn) closeHelperBtn.addEventListener('click', closeBlockHelper);

    // 預設載入 1個1個數 關卡（靜音模式，頁面載入時不發出點擊音效）
    setMode('count1', true);
    console.log('📝 規律神探測驗模組 (seq-quiz.js) 已就緒！');
  }

  MathApp.seqQuiz = {
    init: init,
    loadQuestion: loadQuestion,
    checkAnswers: checkAnswers,
    setMode: setMode,
    PAPER_EXAMS: PAPER_EXAMS,
    generateRandomQuestion: generateRandomQuestion
  };

})();
