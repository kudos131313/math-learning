(function(){
  "use strict";

  /* 啟用 iOS Safari 的 :active 觸控回饋狀態 */
  document.addEventListener('touchstart', function(){}, { passive: true });

  /* ================= 主題切換 (THEME) ================= */
  var themeToggleBtn = document.getElementById('toggle-theme');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(isDark){
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    themeToggleBtn.textContent = isDark ? '☀️ 淺色模式' : '🌙 深色模式';
  }
  applyTheme(prefersDark);
  themeToggleBtn.addEventListener('click', function(){
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  });

  /* ================= 音效與語音 (SOUND + VOICE) ================= */
  var soundOn = true;
  var voiceOn = true;
  var audioCtx = null;

  function getAudioCtx(){
    if(!audioCtx){
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return null;
      audioCtx = new Ctx();
    }
    if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
    return audioCtx;
  }

  function tone(freq, offset, duration, type, vol){
    var ctx = getAudioCtx();
    if(!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var t0 = ctx.currentTime + offset;
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol || 0.14, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  function sfx(kind){
    if(!soundOn) return;
    if(kind === 'click'){ tone(700, 0, 0.07, 'triangle', 0.10); }
    else if(kind === 'carry'){ tone(523,0,.12,'sine',.14); tone(659,.09,.12,'sine',.14); tone(784,.18,.16,'sine',.14); }
    else if(kind === 'borrow'){ tone(784,0,.12,'sine',.14); tone(523,.09,.18,'sine',.14); }
    else if(kind === 'correct'){ tone(523,0,.1,'sine',.15); tone(659,.08,.1,'sine',.15); tone(784,.16,.1,'sine',.15); tone(1047,.24,.22,'sine',.15); }
    else if(kind === 'wrong'){ tone(330,0,.14,'sine',.12); tone(247,.1,.22,'sine',.12); }
    else if(kind === 'boundary'){ tone(300,0,.12,'square',.08); }
  }

  function speak(text){
    if(!voiceOn) return;
    if(!('speechSynthesis' in window)) return;
    try{
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      var u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-TW';
      u.rate = 0.92;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }catch(e){ /* 語音功能不可用時靜默處理 */ }
  }

  var cnDigits = ['零','一','二','三','四','五','六','七','八','九'];
  function numberToChinese(n){
    if(n === 0) return '零';
    var th = Math.floor(n/1000);
    var remTh = n%1000;
    var h = Math.floor(remTh/100);
    var remH = remTh%100;
    var t = Math.floor(remH/10);
    var o = remH%10;
    var s = '';

    if(th > 0) s += cnDigits[th] + '千';

    if(h > 0){
      s += cnDigits[h] + '百';
    } else if(th > 0 && (t > 0 || o > 0)){
      s += '零';
    }

    if(t > 0){
      if(t === 1 && th === 0 && h === 0){
        s += '十';
      } else {
        s += cnDigits[t] + '十';
      }
    } else if((th > 0 || h > 0) && o > 0 && !s.endsWith('零')){
      s += '零';
    }

    if(o > 0) s += cnDigits[o];
    return s;
  }

  var soundToggleBtn = document.getElementById('toggle-sound');
  var voiceToggleBtn = document.getElementById('toggle-voice');
  soundToggleBtn.addEventListener('click', function(){
    soundOn = !soundOn;
    soundToggleBtn.setAttribute('aria-pressed', String(soundOn));
    soundToggleBtn.textContent = soundOn ? '🔊 音效' : '🔈 音效（關）';
    if(soundOn) sfx('click');
  });
  voiceToggleBtn.addEventListener('click', function(){
    voiceOn = !voiceOn;
    voiceToggleBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceToggleBtn.textContent = voiceOn ? '🗣️ 語音' : '🔇 語音（關）';
    if(!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  /* ================= 千位數模式開關 (預設關閉) ================= */
  var thousandEnabled = false;
  var thousandToggleBtn = document.getElementById('toggle-thousand');

  function setThousandMode(enabled){
    thousandEnabled = enabled;
    if(thousandToggleBtn){
      thousandToggleBtn.setAttribute('aria-pressed', String(enabled));
      thousandToggleBtn.textContent = enabled ? '📦 千位數：開啟' : '📦 千位數：關閉';
    }
    document.body.classList.toggle('thousand-mode', enabled);

    // 更新頂部標題說明
    var subEl = document.getElementById('main-subtitle');
    if(subEl){
      subEl.textContent = enabled
        ? '用積木堆出數字，動手玩一玩，就能看懂每個數字裡藏著幾個千、幾個百、幾個十、幾個一！'
        : '用積木堆出數字，動手玩一玩，就能看懂每個數字裡藏著幾個百、幾個十、幾個一！';
    }

    // 若關閉千位數，將製造機千位歸零
    if(!enabled && state.th > 0){
      state.th = 0;
    }
    renderMachine();

    // 重新出題以適配當前位數
    if(typeof newRound === 'function'){
      newRound();
    }
  }

  if(thousandToggleBtn){
    thousandToggleBtn.addEventListener('click', function(){
      setThousandMode(!thousandEnabled);
      if(soundOn) sfx('click');
      var msg = thousandEnabled ? '已開啟千位數模式，挑戰四位數！' : '已切換回三位數模式';
      speak(msg);
      showToast(msg);
    });
  }

  /* ================= 主分頁切換 (MAIN TABS: LEARN vs CALC vs QUIZ) ================= */
  var mainTabLearn = document.getElementById('main-tab-learn');
  var mainTabCalc = document.getElementById('main-tab-calc');
  var mainTabQuiz = document.getElementById('main-tab-quiz');
  var panelLearn = document.getElementById('panel-learn');
  var panelCalc = document.getElementById('panel-calc');
  var panelQuiz = document.getElementById('panel-quiz');

  function switchMainTab(tab){
    var tabs = [
      { id: 'learn', btn: mainTabLearn, panel: panelLearn },
      { id: 'calc',  btn: mainTabCalc,  panel: panelCalc },
      { id: 'quiz',  btn: mainTabQuiz,  panel: panelQuiz }
    ];

    tabs.forEach(function(item){
      if(!item.btn || !item.panel) return;
      var isActive = (item.id === tab);
      item.btn.classList.toggle('active', isActive);
      item.btn.setAttribute('aria-selected', String(isActive));
      item.panel.classList.toggle('active', isActive);
    });

    if(tab === 'quiz'){
      // 切換至挑戰頁面時，將焦點導向第一個輸入格
      var firstInput = document.querySelector('#quiz-answer input');
      if(firstInput && typeof setActiveInput === 'function'){
        setActiveInput(firstInput);
      }
    } else if(tab === 'calc'){
      if(typeof renderCalcView === 'function'){
        renderCalcView();
      }
    }
    if(soundOn) sfx('click');
  }

  if(mainTabLearn) mainTabLearn.addEventListener('click', function(){ switchMainTab('learn'); });
  if(mainTabCalc)  mainTabCalc.addEventListener('click',  function(){ switchMainTab('calc'); });
  if(mainTabQuiz)  mainTabQuiz.addEventListener('click',  function(){ switchMainTab('quiz'); });

  /* ---------------- 共用積木圖示渲染 (支援 5 個一組分組鷹架) ---------------- */
  function blockGlyph(kind){
    var cls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
    return '<span class="blk ' + cls + '"></span>';
  }
  function renderGroupedBlocksHtml(kind, count){
    if(count <= 0) return '';
    var html = '';
    var rem = count;
    while(rem > 0){
      var gSize = Math.min(5, rem);
      html += '<div class="blk-group-5" aria-label="' + gSize + '個積木">';
      for(var i=0; i<gSize; i++){ html += blockGlyph(kind); }
      html += '</div>';
      rem -= gSize;
    }
    return html;
  }
  function renderBlocks(container, kind, count){
    if(!container) return;
    container.innerHTML = renderGroupedBlocksHtml(kind, count);
  }

  /* ================= 數字製造機 (NUMBER MACHINE) ================= */
  var state = { th:0, h:1, t:2, o:3 };

  var els = {
    displayBox: document.getElementById('display'),
    expand: document.getElementById('expand'),
    countTh: document.getElementById('count-th'),
    countH: document.getElementById('count-h'),
    countT: document.getElementById('count-t'),
    countO: document.getElementById('count-o'),
    blocksTh: document.getElementById('blocks-th'),
    blocksH: document.getElementById('blocks-h'),
    blocksT: document.getElementById('blocks-t'),
    blocksO: document.getElementById('blocks-o'),
    minusTh: document.getElementById('minus-th'),
    plusTh: document.getElementById('plus-th'),
    minusH: document.getElementById('minus-h'),
    plusH: document.getElementById('plus-h'),
    minusT: document.getElementById('minus-t'),
    plusT: document.getElementById('plus-t'),
    minusO: document.getElementById('minus-o'),
    plusO: document.getElementById('plus-o'),
    randomize: document.getElementById('randomize')
  };

  function renderDisplay(){
    var th = thousandEnabled ? state.th : 0;
    var h = state.h, t = state.t, o = state.o;
    var parts = [];
    if(thousandEnabled && th > 0){
      parts.push({v:th, cls:'th'});
      parts.push({v:h, cls:'h'});
      parts.push({v:t, cls:'t'});
      parts.push({v:o, cls:'o'});
    } else if(h > 0){
      parts.push({v:h, cls:'h'});
      parts.push({v:t, cls:'t'});
      parts.push({v:o, cls:'o'});
    } else if(t > 0){
      parts.push({v:t, cls:'t'});
      parts.push({v:o, cls:'o'});
    } else {
      parts.push({v:o, cls:'o'});
    }
    var html = '';
    parts.forEach(function(p){
      html += '<span class="digit ' + p.cls + ' num-font">' + p.v + '</span>';
    });
    els.displayBox.innerHTML = html;
    els.displayBox.classList.remove('pop');
    void els.displayBox.offsetWidth;
    els.displayBox.classList.add('pop');

    var expandBits = [];
    if(thousandEnabled && th > 0) expandBits.push('<b class="th">' + th + '個千</b>');
    if(h>0) expandBits.push('<b class="h">' + h + '個百</b>');
    if(t>0) expandBits.push('<b class="t">' + t + '個十</b>');
    if(o>0 || (th===0 && h===0 && t===0)) expandBits.push('<b class="o">' + o + '個一</b>');
    var totalVal = (th*1000 + h*100 + t*10 + o);
    els.expand.innerHTML = expandBits.length ? expandBits.join(' ＋ ') + ' ＝ ' + totalVal : '';
  }

  function renderColumns(){
    if(els.countTh){
      els.countTh.textContent = state.th;
      renderBlocks(els.blocksTh, 'th', state.th);
      if(els.minusTh) els.minusTh.disabled = !canDec('th');
      if(els.plusTh) els.plusTh.disabled = !canInc('th');
    }

    els.countH.textContent = state.h;
    els.countT.textContent = state.t;
    els.countO.textContent = state.o;
    renderBlocks(els.blocksH, 'h', state.h);
    renderBlocks(els.blocksT, 't', state.t);
    renderBlocks(els.blocksO, 'o', state.o);

    els.minusH.disabled = !canDec('h');
    els.plusH.disabled = !canInc('h');
    els.minusT.disabled = !canDec('t');
    els.plusT.disabled = !canInc('t');
    els.minusO.disabled = !canDec('o');
    els.plusO.disabled = !canInc('o');
  }

  function renderMachine(){
    renderDisplay();
    renderColumns();
  }

  /* ---- 支援進位/借位的位值計算 ---- */
  function canInc(place){
    if(place === 'th') return state.th < 9;
    if(place === 'h') return thousandEnabled ? (state.h < 9 || canInc('th')) : state.h < 9;
    if(place === 't') return state.t < 9 || canInc('h');
    return state.o < 9 || canInc('t');
  }
  function canDec(place){
    if(place === 'th') return state.th > 0;
    if(place === 'h') return thousandEnabled ? (state.h > 0 || canDec('th')) : state.h > 0;
    if(place === 't') return state.t > 0 || canDec('h');
    return state.o > 0 || canDec('t');
  }
  function incPlace(place){
    if(place === 'th'){ if(state.th < 9){ state.th++; return true; } return false; }
    if(place === 'h'){
      if(state.h < 9){ state.h++; return true; }
      if(thousandEnabled && incPlace('th')){ state.h = 0; return true; }
      return false;
    }
    if(place === 't'){
      if(state.t < 9){ state.t++; return true; }
      if(incPlace('h')){ state.t = 0; return true; }
      return false;
    }
    if(state.o < 9){ state.o++; return true; }
    if(incPlace('t')){ state.o = 0; return true; }
    return false;
  }
  function decPlace(place){
    if(place === 'th'){ if(state.th > 0){ state.th--; return true; } return false; }
    if(place === 'h'){
      if(state.h > 0){ state.h--; return true; }
      if(thousandEnabled && decPlace('th')){ state.h = 9; return true; }
      return false;
    }
    if(place === 't'){
      if(state.t > 0){ state.t--; return true; }
      if(decPlace('h')){ state.t = 9; return true; }
      return false;
    }
    if(state.o > 0){ state.o--; return true; }
    if(decPlace('t')){ state.o = 9; return true; }
    return false;
  }

  var placeLabel = { th: '千位', h: '百位', t: '十位', o: '個位' };
  var colEl = {
    th: document.getElementById('col-th'),
    h: document.getElementById('col-h'),
    t: document.getElementById('col-t'),
    o: document.getElementById('col-o')
  };
  var blocksBoxEl = {
    th: els.blocksTh,
    h: els.blocksH,
    t: els.blocksT,
    o: els.blocksO
  };
  var toastEl = document.getElementById('carry-toast');
  var toastTimer = null;
  var animating = false;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 進位脈衝圓圈 ---- */
  function spawnBurst(fromEl){
    if(prefersReduced || !fromEl) return;
    var rect = fromEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var burst = document.createElement('div');
    burst.className = 'carry-burst';
    burst.style.left = cx + 'px';
    burst.style.top  = cy + 'px';
    burst.style.width  = rect.width + 'px';
    burst.style.height = rect.height + 'px';
    document.body.appendChild(burst);
    setTimeout(function(){ burst.remove(); }, 600);
  }

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 1700);
  }

  function flashColumns(places){
    places.forEach(function(p){
      var el = colEl[p];
      if(!el) return;
      el.classList.remove('carry-flash');
      void el.offsetWidth;
      el.classList.add('carry-flash');
    });
  }

  /* 飛行動畫：將打包的積木由來源箱移動至目標箱 */
  function flyBlock(fromEl, toEl, kind, onDone){
    if(!fromEl || !toEl){ if(onDone) onDone(); return; }
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();
    var flyer = document.createElement('div');
    var glyphCls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
    flyer.className = 'flyer blk ' + glyphCls;
    document.body.appendChild(flyer);
    var startX = fromRect.left + fromRect.width / 2;
    var startY = fromRect.top + fromRect.height / 2;
    flyer.style.left = startX + 'px';
    flyer.style.top = startY + 'px';
    flyer.style.transform = 'translate(-50%,-50%) scale(1.6)';
    flyer.style.opacity = '1';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var endX = toRect.left + toRect.width / 2;
        var endY = toRect.top + toRect.height / 2;
        flyer.style.left = endX + 'px';
        flyer.style.top = endY + 'px';
        flyer.style.transform = 'translate(-50%,-50%) scale(.85) rotate(8deg)';
      });
    });
    setTimeout(function(){
      flyer.style.opacity = '0';
      setTimeout(function(){ flyer.remove(); if(onDone) onDone(); }, 190);
    }, 560);
  }

  function chainFor(place){
    if(thousandEnabled){
      if(place === 'o') return ['o','t','h','th'];
      if(place === 't') return ['t','h','th'];
      if(place === 'h') return ['h','th'];
      return ['th'];
    }
    if(place === 'o') return ['o','t','h'];
    if(place === 't') return ['t','h'];
    return ['h'];
  }
  function buildSteps(path, dir){
    var steps = [];
    if(dir > 0){
      for(var k=0;k<path.length-1;k++){ steps.push({ from: path[k], to: path[k+1] }); }
    } else {
      for(var k=path.length-1;k>0;k--){ steps.push({ from: path[k], to: path[k-1] }); }
    }
    return steps;
  }

  function playSteps(steps, idx, dir, changed, place, onComplete){
    if(idx >= steps.length){
      renderMachine();
      flashColumns(changed);
      var extra = changed.filter(function(p){ return p !== place; });
      var target = extra[extra.length-1] || place;
      var msg = dir > 0
        ? ('🎉 ' + placeLabel[place] + '滿10了，疊合搬到' + placeLabel[target] + '！')
        : ('🔄 ' + placeLabel[place] + '不夠減，向' + placeLabel[target] + '借了一份！');
      showToast(msg);
      sfx(dir > 0 ? 'carry' : 'borrow');
      speak(msg);
      onComplete();
      return;
    }
    var step = steps[idx];
    var fromBox = blocksBoxEl[step.from];
    var toBox = blocksBoxEl[step.to];
    var kind = dir > 0 ? step.to : step.from;
    if(!fromBox || !toBox){
      playSteps(steps, idx+1, dir, changed, place, onComplete);
      return;
    }
    fromBox.classList.add('bundle-pulse');
    spawnBurst(colEl[step.from]);
    setTimeout(function(){
      fromBox.classList.remove('bundle-pulse');
      flyBlock(fromBox, toBox, kind, function(){
        playSteps(steps, idx+1, dir, changed, place, onComplete);
      });
    }, 260);
  }

  function handleButton(place, dir){
    if(animating) return;
    var prev = { th: state.th, h: state.h, t: state.t, o: state.o };
    var ok = dir > 0 ? incPlace(place) : decPlace(place);
    if(!ok){
      sfx('boundary');
      var maxLimitText = thousandEnabled ? '已經是最大的四位數 9999 囉！' : '已經是最大的三位數 999 囉！';
      showToast(dir > 0 ? maxLimitText : '已經是 0，不能再少囉！');
      return;
    }

    var changed = [];
    if(state.th !== prev.th) changed.push('th');
    if(state.h !== prev.h) changed.push('h');
    if(state.t !== prev.t) changed.push('t');
    if(state.o !== prev.o) changed.push('o');
    var extra = changed.filter(function(p){ return p !== place; });

    if(extra.length === 0){
      renderMachine();
      sfx('click');
      return;
    }

    if(prefersReduced){
      renderMachine();
      flashColumns(changed);
      var msg2 = dir > 0
        ? ('🎉 ' + placeLabel[place] + '滿10了，疊合搬到' + placeLabel[extra[extra.length-1]] + '！')
        : ('🔄 ' + placeLabel[place] + '不夠減，向' + placeLabel[extra[extra.length-1]] + '借了一份！');
      showToast(msg2);
      sfx(dir > 0 ? 'carry' : 'borrow');
      speak(msg2);
      return;
    }

    animating = true;
    var path = chainFor(place).filter(function(p){ return p === place || changed.indexOf(p) !== -1; });
    var steps = buildSteps(path, dir);
    playSteps(steps, 0, dir, changed, place, function(){ animating = false; });
  }

  document.getElementById('speak-number-btn').addEventListener('click', function(){
    var totalVal = (thousandEnabled ? state.th*1000 : 0) + state.h*100 + state.t*10 + state.o;
    speak(numberToChinese(totalVal));
  });

  if(els.minusTh) els.minusTh.addEventListener('click', function(){ handleButton('th', -1); });
  if(els.plusTh) els.plusTh.addEventListener('click', function(){ handleButton('th', 1); });
  els.minusH.addEventListener('click', function(){ handleButton('h', -1); });
  els.plusH.addEventListener('click', function(){ handleButton('h', 1); });
  els.minusT.addEventListener('click', function(){ handleButton('t', -1); });
  els.plusT.addEventListener('click', function(){ handleButton('t', 1); });
  els.minusO.addEventListener('click', function(){ handleButton('o', -1); });
  els.plusO.addEventListener('click', function(){ handleButton('o', 1); });

  els.randomize.addEventListener('click', function(){
    state.th = thousandEnabled ? Math.floor(Math.random()*10) : 0;
    state.h = Math.floor(Math.random()*10);
    state.t = Math.floor(Math.random()*10);
    state.o = Math.floor(Math.random()*10);
    renderMachine();
  });

  renderMachine();

  /* ================= 小小挑戰 ＆ 自我測驗 (QUIZ & SELF-TEST) ================= */
  var quizEls = {
    card: document.getElementById('quiz-card'),
    kicker: document.getElementById('quiz-kicker'),
    stage: document.getElementById('quiz-stage'),
    answer: document.getElementById('quiz-answer'),
    checkBtn: document.getElementById('check-btn'),
    nextBtn: document.getElementById('next-btn'),
    feedback: document.getElementById('feedback'),
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

  var currentMode = 'practice'; // 'practice' | 'selftest'
  var practiceScore = { correct: 0, streak: 0 };

  // 自我測驗狀態
  var selfTestConfig = { total: 5 };
  var selfTestState = {
    index: 0,
    correct: 0,
    startTime: 0,
    timerId: null,
    history: []
  };

  var current = null; // {type:'A'|'B', h,t,o, title:''}
  var currentPromptSpeech = '';

  var goodMsgs = ['答對了，太棒了！', '沒錯，就是這樣！', '完全正確，繼續加油！', '答對囉，你抓到訣竅了！'];
  var badMsgs = ['再想想看，你可以的！', '有點小誤會，看看正確答案吧！', '差一點點，繼續挑戰！'];

  /* ---- Confetti 紙花動畫 ---- */
  var CONFETTI_COLORS = ['#e8604c','#2e9e82','#ec9a1e','#2b6ef2','#f57cdc','#a259f7'];
  function launchConfetti(){
    if(prefersReduced) return;
    var count = 42;
    for(var i = 0; i < count; i++){
      (function(){
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        var startX = 15 + Math.random() * 70; // vw
        piece.style.left = startX + 'vw';
        piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        var cx = (Math.random() - 0.5) * 180; // px 水平偏移
        var cy = (80 + Math.random() * 60) + 'vh';
        var cr = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360) + 'deg';
        var dur = 0.9 + Math.random() * 0.9;
        piece.style.setProperty('--cx', cx + 'px');
        piece.style.setProperty('--cy', cy);
        piece.style.setProperty('--cr', cr);
        piece.style.animationDuration = dur + 's';
        piece.style.animationDelay = (Math.random() * 0.25) + 's';
        // 隨機大小與圓度
        var sz = 7 + Math.random() * 8;
        piece.style.width = sz + 'px';
        piece.style.height = sz + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(piece);
        setTimeout(function(){ piece.remove(); }, (dur + 0.35) * 1000);
      })();
    }
  }

  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function formatTime(seconds){
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  /* 模式切換邏輯 */
  function updateTabSlider(activeTab){
    var slider = document.getElementById('mode-tab-slider');
    if(!slider) return;
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

  quizEls.tabPractice.addEventListener('click', function(){ switchMode('practice'); });
  quizEls.tabSelftest.addEventListener('click', function(){ switchMode('selftest'); });

  /* 題數選擇晶片 */
  quizEls.countChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      quizEls.countChips.forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      selfTestConfig.total = parseInt(chip.getAttribute('data-count'), 10) || 5;
    });
  });

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
      quizEls.timerText.textContent = '⏱️ ' + formatTime(elapsedSec);
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
    quizEls.resultTime.textContent = formatTime(elapsedSec);

    // 星等與稱號評定
    if(scorePct === 100){
      quizEls.resultStars.textContent = '⭐⭐⭐';
      quizEls.resultTitle.textContent = '滿分達成！數學小博士！';
      quizEls.resultSubtitle.textContent = '恭喜你全數答對！你對百位、十位與個位的概念已經完全掌握！';
      speak('滿分達成！太厲害了，恭喜你得到三顆星！');
    } else if(scorePct >= 80){
      quizEls.resultStars.textContent = '⭐⭐';
      quizEls.resultTitle.textContent = '表現極佳！太厲害了！';
      quizEls.resultSubtitle.textContent = '只差一點點就滿分囉，多練習幾次一定能拿下滿分！';
      speak('表現極佳！得到兩顆星，繼續加油！');
    } else if(scorePct >= 60){
      quizEls.resultStars.textContent = '⭐';
      quizEls.resultTitle.textContent = '順利過關！再接再厲！';
      quizEls.resultSubtitle.textContent = '你已經掌握大部分的數字積木概念，多觀察積木的滿十進位喔！';
      speak('順利過關！多練習就會越來越熟練喔！');
    } else {
      quizEls.resultStars.textContent = '🌱';
      quizEls.resultTitle.textContent = '完成挑戰！繼續練習！';
      quizEls.resultSubtitle.textContent = '沒關係，多用上方的「數字製造機」動手操作積木，會更容易理解喔！';
      speak('挑戰完成！多堆幾次積木，一定會更進步喔！');
    }

    // 錯題與作答清單回顧
    var reviewHtml = '<div style="font-weight:700;margin-bottom:8px;color:var(--ink);">📋 答題檢討明細：</div>';
    selfTestState.history.forEach(function(item, idx){
      var badgeCls = item.ok ? 'pass' : 'fail';
      var badgeText = item.ok ? '✓ 答對' : '✗ 需加強';
      reviewHtml +=
        '<div class="review-item">' +
          '<span><b>第 ' + (idx+1) + ' 題：</b> ' + item.summary + '</span>' +
          '<span class="review-badge ' + badgeCls + '">' + badgeText + '</span>' +
        '</div>';
    });
    quizEls.resultReview.innerHTML = reviewHtml;

    sfx(scorePct >= 60 ? 'correct' : 'click');
  }

  quizEls.startBtn.addEventListener('click', startSelfTest);
  quizEls.restartBtn.addEventListener('click', startSelfTest);
  quizEls.backPracticeBtn.addEventListener('click', function(){ switchMode('practice'); });

  /* 出題邏輯 */
  function newRound(){
    quizEls.feedback.textContent = '';
    quizEls.feedback.className = 'feedback';
    quizEls.nextBtn.style.display = 'none';
    quizEls.checkBtn.style.display = 'inline-block';
    quizEls.checkBtn.disabled = false;

    var type = Math.random() < 0.5 ? 'A' : 'B';
    var th = 0, h = 0, t = 0, o = 0;

    if(type === 'A'){
      var n = thousandEnabled ? randInt(1, 9999) : randInt(1, 999);
      th = Math.floor(n/1000);
      var rem = n%1000;
      h = Math.floor(rem/100);
      t = Math.floor((rem%100)/10);
      o = rem%10;
    } else {
      do {
        th = thousandEnabled ? randInt(0, 9) : 0;
        h = randInt(0, 9);
        t = randInt(0, 9);
        o = randInt(0, 9);
      } while(th===0 && h===0 && t===0 && o===0);
    }
    current = { type: type, th: th, h: h, t: t, o: o };

    if(type === 'A'){
      var n2 = (thousandEnabled ? th*1000 : 0) + h*100 + t*10 + o;
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
        : '看數字，寫出百位、十位、個位各有幾個。這是 ') + numberToChinese(n2);
    } else {
      quizEls.kicker.textContent = '看積木，寫出這是多少';
      var rowTh = thousandEnabled ? renderGroupedBlocksHtml('th', th) : '';
      var rowH = renderGroupedBlocksHtml('h', h);
      var rowT = renderGroupedBlocksHtml('t', t);
      var rowO = renderGroupedBlocksHtml('o', o);
      var groups = [];
      if(thousandEnabled && th>0) groups.push('<div class="grp"><div class="lbl">千</div><div class="row">'+rowTh+'</div></div>');
      if(h>0) groups.push('<div class="grp"><div class="lbl">百</div><div class="row">'+rowH+'</div></div>');
      if(t>0) groups.push('<div class="grp"><div class="lbl">十</div><div class="row">'+rowT+'</div></div>');
      if(o>0) groups.push('<div class="grp"><div class="lbl">個</div><div class="row">'+rowO+'</div></div>');
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

    speak(currentPromptSpeech);
  }

  document.getElementById('speak-quiz-btn').addEventListener('click', function(){
    speak(currentPromptSpeech);
  });

  function markField(input, ok){
    if(!input) return;
    input.style.background = ok ? 'rgba(46,158,130,.18)' : 'rgba(232,96,76,.18)';
    input.style.borderColor = ok ? 'var(--good)' : 'var(--bad)';
  }

  /* ================= 虛擬數字鍵盤與輸入焦點控制 (KEYPAD & FOCUS) ================= */
  var activeInput = null;
  var keypadEl = document.getElementById('virtual-keypad');

  function setActiveInput(inputEl){
    if(!inputEl) return;
    activeInput = inputEl;
    var allInputs = quizEls.answer.querySelectorAll('input');
    allInputs.forEach(function(inp){ inp.classList.remove('is-active'); });
    inputEl.classList.add('is-active');
  }

  function handleKeypadInput(val){
    if(!activeInput || !current) return;
    if(quizEls.nextBtn.style.display !== 'none') return; // 已結算等待下一題

    if(current.type === 'A'){
      var num = parseInt(val, 10);
      if(isNaN(num) || num < 0 || num > 9) return;
      activeInput.value = num;
      sfx('click');

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
      var maxLen = thousandEnabled ? 4 : 3; // 千位模式上限 4 位數，否則 3 位數
      if(currVal.length >= maxLen) return;
      if(currVal === '0'){
        activeInput.value = val;
      } else {
        activeInput.value = currVal + val;
      }
      sfx('click');
    }
  }

  function handleKeypadBackspace(){
    if(!activeInput || !current) return;
    if(quizEls.nextBtn.style.display !== 'none') return;

    if(current.type === 'A'){
      if(activeInput.value !== ''){
        activeInput.value = '';
      } else {
        // 當前欄位若為空，退回前一格並清空
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
      sfx('click');
    } else {
      var currVal = activeInput.value;
      if(currVal.length > 0){
        activeInput.value = currVal.slice(0, -1);
        sfx('click');
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

  // 綁定實體鍵盤全局支援 (相容實體數字鍵、退格鍵與 Enter 鍵)
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

  /* 答案判定與流程進展 */
  function checkAnswer(){
    if(!current) return;
    var allOk = true;
    var thVal = (thousandEnabled ? current.th : 0);
    var targetNum = thVal*1000 + current.h*100 + current.t*10 + current.o;

    var expParts = [];
    if(thousandEnabled && thVal > 0) expParts.push(thVal + '個千');
    if(current.h > 0) expParts.push(current.h + '個百');
    if(current.t > 0) expParts.push(current.t + '個十');
    if(current.o > 0 || expParts.length === 0) expParts.push(current.o + '個一');
    var explainStr = expParts.join(' ＋ ') + ' ＝ ' + targetNum;

    if(current.type === 'A'){
      var ith = document.getElementById('ans-th');
      var ih = document.getElementById('ans-h');
      var it = document.getElementById('ans-t');
      var io = document.getElementById('ans-o');

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
      markField(ih, okH); markField(it, okT); markField(io, okO);
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
        practiceScore.correct++; practiceScore.streak++;
        var goodMsg = goodMsgs[randInt(0,goodMsgs.length-1)];
        quizEls.feedback.className = 'feedback good';
        quizEls.feedback.innerHTML = goodMsg + '<span class="explain">' + explainStr + '</span>';
        quizEls.card.classList.remove('shake');
        quizEls.card.classList.add('pulseGood');
        setTimeout(function(){ quizEls.card.classList.remove('pulseGood'); }, 400);
        sfx('correct');
        speak(goodMsg + '。' + explainStr);
        launchConfetti();
      } else {
        practiceScore.streak = 0;
        var badMsg = badMsgs[randInt(0,badMsgs.length-1)];
        quizEls.feedback.className = 'feedback bad';
        quizEls.feedback.innerHTML = badMsg + '<span class="explain">正確答案：' + explainStr + '</span>';
        quizEls.card.classList.remove('pulseGood');
        quizEls.card.classList.add('shake');
        setTimeout(function(){ quizEls.card.classList.remove('shake'); }, 380);
        sfx('wrong');
        speak(badMsg + '。正確答案是，' + explainStr);
      }
      quizEls.scoreCorrect.textContent = practiceScore.correct;
      quizEls.scoreStreak.textContent = practiceScore.streak;

    } else {
      // 自我測驗模式紀錄
      if(allOk){ selfTestState.correct++; }
      selfTestState.history.push({
        ok: allOk,
        summary: current.type === 'A'
          ? ('數字 ' + targetNum + '（' + (thousandEnabled ? '千:'+current.th+' ' : '') + '百:' + current.h + ' 十:' + current.t + ' 個:' + current.o + '）')
          : ('積木題共 ' + targetNum)
      });

      var isLast = (selfTestState.index + 1) >= selfTestConfig.total;
      quizEls.nextBtn.textContent = isLast ? '查看測驗成果 🏆' : '下一題 →';
      quizEls.nextBtn.style.display = 'inline-block';

      if(allOk){
        var goodMsg2 = goodMsgs[randInt(0,goodMsgs.length-1)];
        quizEls.feedback.className = 'feedback good';
        quizEls.feedback.innerHTML = goodMsg2 + '<span class="explain">' + explainStr + '</span>';
        sfx('correct');
        speak(goodMsg2);
        launchConfetti();
      } else {
        var badMsg2 = badMsgs[randInt(0,badMsgs.length-1)];
        quizEls.feedback.className = 'feedback bad';
        quizEls.feedback.innerHTML = badMsg2 + '<span class="explain">正確答案：' + explainStr + '</span>';
        sfx('wrong');
        speak(badMsg2);
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

  quizEls.checkBtn.addEventListener('click', checkAnswer);
  quizEls.nextBtn.addEventListener('click', handleNext);

  newRound();

  /* Tab Slider 初始化 */
  (function initTabSlider(){
    var tabsEl = document.querySelector('.mode-tabs');
    if(!tabsEl) return;
    var slider = document.createElement('div');
    slider.id = 'mode-tab-slider';
    slider.className = 'mode-tab-slider';
    tabsEl.insertBefore(slider, tabsEl.firstChild);
    // 初始位置：自由練習 Tab
    requestAnimationFrame(function(){
      updateTabSlider(quizEls.tabPractice);
    });
  })();

  /* ==========================================================================
     直式加減法概念學習教室 (VERTICAL CALCULATION LAB)
     ========================================================================== */
  var calcState = {
    op: 'add',           // 'add' 或 'sub'
    numA: 28,            // 被運算數 (1~99)
    numB: 15,            // 運算數 (1~99)
    step: 0,             // 0: 對齊, 1: 算個位, 2: 進位/借位處理, 3: 算十位, 4: 完成
    isAutoPlaying: false,
    autoTimer: null
  };

  // 預設範例題庫
  var calcPresets = {
    add: [
      { label: '無進位 (23 + 14)', a: 23, b: 14, desc: '個位十位直接合體，沒有滿十' },
      { label: '個位進位 (28 + 15)', a: 28, b: 15, desc: '個位滿十，捆成一條十進位' },
      { label: '九的進位 (59 + 24)', a: 59, b: 24, desc: '遇到 9，加 1 就滿十進位' },
      { label: '進到百位 (86 + 47)', a: 86, b: 47, desc: '個位進位，十位也滿十進到百位' }
    ],
    sub: [
      { label: '無退位 (35 − 12)', a: 35, b: 12, desc: '個位與十位直接扣除，個位夠減' },
      { label: '個位退位 (42 − 17)', a: 42, b: 17, desc: '個位不夠減，向十位借 1 條拆成 10 個一' },
      { label: '尾數是零 (60 − 24)', a: 60, b: 24, desc: '個位是 0，一定要向十位借一條' },
      { label: '百位退位 (105 − 38)', a: 105, b: 38, desc: '向十位借、十位再向百位借' }
    ]
  };

  // DOM 元素快取
  var calcEls = {
    btnOpAdd: document.getElementById('btn-op-add'),
    btnOpSub: document.getElementById('btn-op-sub'),
    presetChips: document.getElementById('preset-chips'),
    randomBtn: document.getElementById('calc-random-btn'),
    customToggleBtn: document.getElementById('calc-custom-toggle-btn'),
    customDrawer: document.getElementById('calc-custom-drawer'),
    customNumA: document.getElementById('custom-num-a'),
    customNumB: document.getElementById('custom-num-b'),
    customOpSymbol: document.getElementById('custom-op-symbol'),
    applyCustomBtn: document.getElementById('apply-custom-calc-btn'),

    // 主舞台
    blocksStage: document.getElementById('calc-blocks-stage'),
    labelBlockA: document.getElementById('label-block-a'),
    blocksContainerA: document.getElementById('blocks-container-a'),
    blockDividerSymbol: document.getElementById('block-divider-symbol'),
    blockDividerText: document.getElementById('block-divider-text'),
    labelBlockB: document.getElementById('label-block-b'),
    blocksContainerB: document.getElementById('blocks-container-b'),
    actionBox: document.getElementById('calc-action-box'),
    actionBoxTitle: document.getElementById('action-box-title'),
    actionBoxContent: document.getElementById('action-box-content'),
    rowResult: document.getElementById('block-row-result'),
    labelBlockResult: document.getElementById('label-block-result'),
    blocksContainerResult: document.getElementById('blocks-container-result'),

    // 直式算則
    verticalBoard: document.getElementById('vertical-math-board'),

    // 步驟控制器
    stepPill: document.getElementById('stepper-step-pill'),
    stepExplanation: document.getElementById('stepper-explanation'),
    speakBtn: document.getElementById('calc-speak-btn'),
    interactivePrompt: document.getElementById('stepper-interactive-prompt'),
    promptContent: document.getElementById('prompt-content'),
    stepPrevBtn: document.getElementById('step-prev-btn'),
    stepReplayBtn: document.getElementById('step-replay-btn'),
    stepAutoBtn: document.getElementById('step-auto-btn'),
    stepNextBtn: document.getElementById('step-next-btn'),

    // 小秘訣小卡
    conceptTitle: document.getElementById('concept-note-title'),
    conceptText: document.getElementById('concept-note-text')
  };

  /* 計算數值拆解工具函式 */
  function getCalcDecomp(a, b, op){
    var a_h = Math.floor(a / 100);
    var a_t = Math.floor((a % 100) / 10);
    var a_o = a % 10;

    var b_h = Math.floor(b / 100);
    var b_t = Math.floor((b % 100) / 10);
    var b_o = b % 10;

    if(op === 'add'){
      var o_sum = a_o + b_o;
      var carry_o = o_sum >= 10 ? 1 : 0;
      var ans_o = o_sum % 10;

      var t_sum = a_t + b_t + carry_o;
      var carry_t = t_sum >= 10 ? 1 : 0;
      var ans_t = t_sum % 10;

      var ans_h = a_h + b_h + carry_t;
      var total = a + b;

      return {
        a: a, b: b, op: 'add',
        a_h: a_h, a_t: a_t, a_o: a_o,
        b_h: b_h, b_t: b_t, b_o: b_o,
        o_sum: o_sum, carry_o: carry_o, ans_o: ans_o,
        t_sum: t_sum, carry_t: carry_t, ans_t: ans_t,
        ans_h: ans_h, total: total,
        needsCarry: carry_o > 0
      };
    } else {
      var needsBorrow_o = a_o < b_o;
      var borrowed_t = needsBorrow_o ? a_t - 1 : a_t;
      var effective_o = needsBorrow_o ? a_o + 10 : a_o;
      var ans_o = effective_o - b_o;

      var needsBorrow_t = borrowed_t < b_t;
      var borrowed_h = needsBorrow_t ? a_h - 1 : a_h;
      var effective_t = needsBorrow_t ? borrowed_t + 10 : borrowed_t;
      var ans_t = effective_t - b_t;

      var ans_h = borrowed_h - b_h;
      var diff = a - b;

      return {
        a: a, b: b, op: 'sub',
        a_h: a_h, a_t: a_t, a_o: a_o,
        b_h: b_h, b_t: b_t, b_o: b_o,
        needsBorrow_o: needsBorrow_o,
        borrowed_t: borrowed_t,
        effective_o: effective_o,
        ans_o: ans_o,
        needsBorrow_t: needsBorrow_t,
        effective_t: effective_t,
        ans_t: ans_t,
        ans_h: ans_h,
        total: diff
      };
    }
  }

  /* 渲染範例晶片列 */
  function renderCalcPresetChips(){
    if(!calcEls.presetChips) return;
    calcEls.presetChips.innerHTML = '';
    var list = calcPresets[calcState.op] || [];
    list.forEach(function(item, idx){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-chip' + (calcState.numA === item.a && calcState.numB === item.b ? ' active' : '');
      btn.textContent = item.label;
      btn.addEventListener('click', function(){
        stopAutoPlay();
        calcState.numA = item.a;
        calcState.numB = item.b;
        calcState.step = 0;
        renderCalcPresetChips();
        renderCalcView();
        if(soundOn) sfx('click');
      });
      calcEls.presetChips.appendChild(btn);
    });
  }

  /* 渲染具體積木群組 (十位與個位) */
  function createBlockColGroupHtml(title, kind, count, titleClass){
    var html = '<div class="block-col-group">';
    html += '<span class="block-col-title ' + (titleClass || '') + '">' + title + ' (' + count + ')</span>';
    html += '<div class="block-items-wrap">';
    if(count === 0){
      html += '<span style="font-size:12px;color:var(--ink-soft);padding:4px;">0 (無積木)</span>';
    } else {
      html += renderGroupedBlocksHtml(kind, count);
    }
    html += '</div></div>';
    return html;
  }

  /* 渲染積木操作舞台 */
  function renderCalcBlocksStage(d, step){
    if(!calcEls.blocksContainerA) return;

    // 更新標籤
    calcEls.labelBlockA.textContent = (calcState.op === 'add' ? '被加數 ' : '被減數 ') + d.a;
    calcEls.labelBlockB.textContent = (calcState.op === 'add' ? '加數 ' : '減數 ') + d.b;
    calcEls.blockDividerSymbol.textContent = calcState.op === 'add' ? '＋' : '−';
    calcEls.blockDividerText.textContent = calcState.op === 'add' ? '合起來相加' : '拿走扣除';

    // 渲染 A 積木
    var htmlA = '';
    if(d.a_h > 0) htmlA += createBlockColGroupHtml('百位', 'h', d.a_h, 'h-title');
    htmlA += createBlockColGroupHtml('十位', 't', d.a_t, 't-title');
    htmlA += createBlockColGroupHtml('個位', 'o', d.a_o, 'o-title');
    calcEls.blocksContainerA.innerHTML = htmlA;

    // 渲染 B 積木
    var htmlB = '';
    if(d.b_h > 0) htmlB += createBlockColGroupHtml('百位', 'h', d.b_h, 'h-title');
    htmlB += createBlockColGroupHtml('十位', 't', d.b_t, 't-title');
    htmlB += createBlockColGroupHtml('個位', 'o', d.b_o, 'o-title');
    calcEls.blocksContainerB.innerHTML = htmlB;

    // 特寫動作盒 (Step 1 或 Step 2)
    calcEls.actionBox.style.display = 'none';
    calcEls.rowResult.style.display = 'none';

    if(calcState.op === 'add'){
      if(step === 1){
        calcEls.actionBox.style.display = 'block';
        calcEls.actionBoxTitle.innerHTML = '🔍 個位聚合觀察：共 ' + d.o_sum + ' 個小圓珠';
        var actHtml = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
        actHtml += renderGroupedBlocksHtml('o', d.o_sum);
        if(d.needsCarry){
          actHtml += '<span style="font-size:13px;font-weight:800;color:var(--bad);">超過 9 顆囉！滿 10 個一要捆成 1 條十！</span>';
        } else {
          actHtml += '<span style="font-size:13px;font-weight:800;color:var(--good);">沒有滿 10，直接寫在個位！</span>';
        }
        actHtml += '</div>';
        calcEls.actionBoxContent.innerHTML = actHtml;
      } else if(step === 2 && d.needsCarry){
        calcEls.actionBox.style.display = 'block';
        calcEls.actionBoxTitle.innerHTML = '✨ 滿十進位魔法：10 個一 ➔ 1 條十！';
        var actHtml2 = '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
        actHtml2 += '<div style="display:flex;align-items:center;gap:4px;">' + renderGroupedBlocksHtml('o', 10) + '</div>';
        actHtml2 += '<span class="action-transform-arrow">➔ 捆成 ➔</span>';
        actHtml2 += '<div style="display:flex;align-items:center;gap:4px;">' + blockGlyph('t') + '<b style="color:var(--t-color-dark);">新長條 (十)</b></div>';
        actHtml2 += '<span style="font-size:13px;color:var(--ink-soft);">進位給十位！個位留下 <b>' + d.ans_o + '</b> 顆。</span>';
        actHtml2 += '</div>';
        calcEls.actionBoxContent.innerHTML = actHtml2;
      } else if(step >= 4){
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計最終積木 (結果 ' + d.total + ')';
        var htmlRes = '';
        if(d.ans_h > 0) htmlRes += createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title');
        htmlRes += createBlockColGroupHtml('十位', 't', d.ans_t, 't-title');
        htmlRes += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title');
        calcEls.blocksContainerResult.innerHTML = htmlRes;
      }
    } else {
      // 減法
      if(step === 1){
        calcEls.actionBox.style.display = 'block';
        if(d.needsBorrow_o){
          calcEls.actionBoxTitle.innerHTML = '⚠️ 個位不夠減警告：個位只有 ' + d.a_o + ' 顆，拿不走 ' + d.b_o + ' 顆！';
          calcEls.actionBoxContent.innerHTML =
            '<span style="font-size:13.5px;font-weight:700;color:var(--bad);">' +
            '必須向十位借 1 條十（10 顆珠子）來拆開幫忙喔！' +
            '</span>';
        } else {
          calcEls.actionBoxTitle.innerHTML = '✅ 個位夠減：直接從 ' + d.a_o + ' 顆拿走 ' + d.b_o + ' 顆';
          calcEls.actionBoxContent.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span>剩餘：</span>' + renderGroupedBlocksHtml('o', d.ans_o) +
            '</div>';
        }
      } else if(step === 2 && d.needsBorrow_o){
        calcEls.actionBox.style.display = 'block';
        calcEls.actionBoxTitle.innerHTML = '✂️ 借一拆十：1 條十 ➔ 拆成 10 顆一！';
        var subActHtml = '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
        subActHtml += '<div style="display:flex;align-items:center;gap:4px;">' + blockGlyph('t') + '<b>向十位借 1 條</b></div>';
        subActHtml += '<span class="action-transform-arrow">➔ 散開成 ➔</span>';
        subActHtml += '<div style="display:flex;align-items:center;gap:4px;">' + renderGroupedBlocksHtml('o', 10) + '</div>';
        subActHtml += '<span style="font-size:13px;color:var(--ink-soft);">個位現在有 ' + d.a_o + ' + 10 = <b>' + d.effective_o + '</b> 顆了！</span>';
        subActHtml += '</div>';
        calcEls.actionBoxContent.innerHTML = subActHtml;
      } else if(step >= 4){
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減剩餘積木 (結果 ' + d.total + ')';
        var htmlSubRes = '';
        if(d.ans_h > 0) htmlSubRes += createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title');
        htmlSubRes += createBlockColGroupHtml('十位', 't', d.ans_t, 't-title');
        htmlSubRes += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title');
        calcEls.blocksContainerResult.innerHTML = htmlSubRes;
      }
    }
  }

  /* 渲染作業簿直式算則 (Vertical Math Board - 穩定 Row/Cell 結構) */
  function renderVerticalMathBoard(d, step){
    if(!calcEls.verticalBoard) return;

    var opSymbol = d.op === 'add' ? '＋' : '−';
    var hasH = (d.a_h > 0 || d.b_h > 0 || (d.op === 'add' && d.ans_h > 0));
    var showCarry = (d.op === 'add' && d.needsCarry && step >= 2);
    var showBorrow = (d.op === 'sub' && d.needsBorrow_o && step >= 2);

    // 判斷當前高亮欄位
    var isOActive = (step === 1 || step === 2);
    var isTActive = (step === 3);
    var isHActive = (step === 4 && hasH && d.ans_h > 0);

    var clsO = 'vm-cell vm-cell-o' + (isOActive ? ' active-col' : '');
    var clsT = 'vm-cell vm-cell-t' + (isTActive ? ' active-col' : '');
    var clsH = 'vm-cell vm-cell-h' + (isHActive ? ' active-col' : '');

    // 1. 進退位標記內容
    var mark_h = '';
    var mark_t = '';
    var mark_o = '';
    if(showCarry){
      mark_t = '<span class="vm-carry-badge" title="滿十進一">1</span>';
    } else if(showBorrow){
      mark_t = '<span class="vm-borrow-tag" title="十位被借走 1 (借1)">借1</span>';
      mark_o = '<span class="vm-borrow-tag" title="借來的 10">10</span>';
    }

    // 2. 被運算數 (A) 十位顯示 (不劃掉原本數字)
    var numA_t_html = '<div class="vm-num-box">' + d.a_t + '</div>';

    // 3. 答案格內容
    var ans_o_html = '<div class="vm-ans-placeholder"></div>';
    var ans_t_html = '<div class="vm-ans-placeholder"></div>';
    var ans_h_html = '<div class="vm-ans-placeholder"></div>';

    if(step >= 2){
      ans_o_html = '<div class="vm-cell-ans revealed" style="color:var(--o-color-dark);">' + d.ans_o + '</div>';
    }
    if(step >= 3){
      ans_t_html = '<div class="vm-cell-ans revealed" style="color:var(--t-color-dark);">' + d.ans_t + '</div>';
    }
    if(step >= 4 && hasH && d.ans_h > 0){
      ans_h_html = '<div class="vm-cell-ans revealed" style="color:var(--h-color-dark);">' + d.ans_h + '</div>';
    }

    var html = '<div class="vm-notebook"><div class="vm-table">';

    // Row 0: 欄位標頭
    html += '<div class="vm-row vm-row-header">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if(hasH) html += '<div class="' + clsH + '"><span class="vm-col-badge h-badge">百位</span></div>';
    html += '<div class="' + clsT + '"><span class="vm-col-badge t-badge">十位</span></div>';
    html += '<div class="' + clsO + '"><span class="vm-col-badge o-badge">個位</span></div>';
    html += '</div>';

    // Row 1: 進退位標記行
    html += '<div class="vm-row vm-row-mark">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if(hasH) html += '<div class="' + clsH + '">' + mark_h + '</div>';
    html += '<div class="' + clsT + '">' + mark_t + '</div>';
    html += '<div class="' + clsO + '">' + mark_o + '</div>';
    html += '</div>';

    // Row 2: 被運算數 (A)
    html += '<div class="vm-row vm-row-num">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if(hasH) html += '<div class="' + clsH + '">' + (d.a_h > 0 ? d.a_h : '') + '</div>';
    html += '<div class="' + clsT + '">' + numA_t_html + '</div>';
    html += '<div class="' + clsO + '"><div class="vm-num-box">' + d.a_o + '</div></div>';
    html += '</div>';

    // Row 3: 運算數 (B) 與符號
    html += '<div class="vm-row vm-row-num">';
    html += '<div class="vm-cell vm-cell-op"><span class="vm-op-symbol">' + opSymbol + '</span></div>';
    if(hasH) html += '<div class="' + clsH + '">' + (d.b_h > 0 ? d.b_h : '') + '</div>';
    html += '<div class="' + clsT + '"><div class="vm-num-box">' + d.b_t + '</div></div>';
    html += '<div class="' + clsO + '"><div class="vm-num-box">' + d.b_o + '</div></div>';
    html += '</div>';

    // Row 4: 等號橫線
    html += '<div class="vm-divider-row"><div class="vm-divider-line"></div></div>';

    // Row 5: 答案行
    html += '<div class="vm-row vm-row-ans">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if(hasH) html += '<div class="' + clsH + '">' + ans_h_html + '</div>';
    html += '<div class="' + clsT + '">' + ans_t_html + '</div>';
    html += '<div class="' + clsO + '">' + ans_o_html + '</div>';
    html += '</div>';

    html += '</div></div>';
    calcEls.verticalBoard.innerHTML = html;
  }

  /* 步驟文案與語音解說生成器 */
  function getStepExplanation(d, step){
    if(step === 0){
      return {
        pill: '第 1 步 / 共 4 步：位值對齊排排站',
        text: '先把數字排整齊！<em>個位對齊個位</em>（小圓珠）、<em>十位對齊十位</em>（長條），同一種位置才能相加減喔！',
        speak: '先把數字排整齊！個位對齊個位，十位對齊十位，同一種位置才能相加減喔！',
        showPrompt: false
      };
    } else if(step === 1){
      if(d.op === 'add'){
        if(d.needsCarry){
          return {
            pill: '第 2 步 / 共 4 步：先算個位',
            text: '先算個位：' + d.a_o + ' ＋ ' + d.b_o + ' ＝ <em>' + d.o_sum + '</em>。超過 9 顆了！個位放不下，必須把 <em>10 個一捆成 1 條十</em>！',
            speak: '先算個位：' + d.a_o + ' 加 ' + d.b_o + ' 等於 ' + d.o_sum + '。超過 9 個了！必須滿十進一喔！',
            showPrompt: true,
            promptBtn: '✨ 點擊把 10 顆珠子捆成 1 條十！'
          };
        } else {
          return {
            pill: '第 2 步 / 共 4 步：先算個位',
            text: '先算個位：' + d.a_o + ' ＋ ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>。沒有超過 9，在個位寫上 <em>' + d.ans_o + '</em>！',
            speak: '先算個位：' + d.a_o + ' 加 ' + d.b_o + ' 等於 ' + d.ans_o + '，在個位寫上 ' + d.ans_o + '。',
            showPrompt: false
          };
        }
      } else {
        // 減法
        if(d.needsBorrow_o){
          return {
            pill: '第 2 步 / 共 4 步：先算個位',
            text: '先算個位：個位只有 <em>' + d.a_o + '</em> 顆，拿不走 <em>' + d.b_o + '</em> 顆！個位不夠減，要向十位<em>借 1 條十</em>來拆開幫忙！',
            speak: '先算個位：個位只有 ' + d.a_o + ' 個，不夠減 ' + d.b_o + ' 個！要向十位借一條十來拆開幫忙！',
            showPrompt: true,
            promptBtn: '✂️ 點擊向十位借 1 條拆成 10 顆一！',
            isBorrow: true
          };
        } else {
          return {
            pill: '第 2 步 / 共 4 步：先算個位',
            text: '先算個位：從 ' + d.a_o + ' 顆拿走 ' + d.b_o + ' 顆，' + d.a_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>，在個位寫上 <em>' + d.ans_o + '</em>！',
            speak: '先算個位：' + d.a_o + ' 減 ' + d.b_o + ' 等於 ' + d.ans_o + '，在個位寫上 ' + d.ans_o + '。',
            showPrompt: false
          };
        }
      }
    } else if(step === 2){
      if(d.op === 'add'){
        if(d.needsCarry){
          return {
            pill: '第 2 步 (進位)：滿十進一到十位',
            text: '10 顆珠子聚合成 1 條十，送給十位！直式十位上方寫一個<em>金色小 1</em>，個位留下 <em>' + d.ans_o + '</em> 顆！',
            speak: '滿十進一！十位頭上寫一個小小的 1，個位寫 ' + d.ans_o + '！',
            showPrompt: false,
            sound: 'carry'
          };
        } else {
          return {
            pill: '第 2 步：個位算好囉',
            text: '個位計算完畢，寫上 <em>' + d.ans_o + '</em>。接下來準備計算十位！',
            speak: '個位算好囉，接下來準備計算十位！',
            showPrompt: false
          };
        }
      } else {
        if(d.needsBorrow_o){
          return {
            pill: '第 2 步 (借位)：借一拆十到個位',
            text: '向十位借 1 條十，十位頭上記上 <em>借1</em>；拆成 10 顆珠子到個位，個位變成 <em>' + d.effective_o + '</em> 顆，現在夠減囉！',
            speak: '借一拆十！十位頭上記上借 1，個位現在有 ' + d.effective_o + ' 個，夠減了！',
            showPrompt: false,
            sound: 'borrow'
          };
        } else {
          return {
            pill: '第 2 步：個位算好囉',
            text: '個位扣除完畢，寫上 <em>' + d.ans_o + '</em>。接下來準備計算十位！',
            speak: '個位算好囉，接下來準備計算十位！',
            showPrompt: false
          };
        }
      }
    } else if(step === 3){
      if(d.op === 'add'){
        var expText = d.needsCarry
          ? '接著算十位：別忘了頭上的小 1 喔！<em>1 ＋ ' + d.a_t + ' ＋ ' + d.b_t + ' ＝ ' + d.t_sum + '</em>。在十位寫上 <em>' + d.ans_t + '</em>！'
          : '接著算十位：' + d.a_t + ' ＋ ' + d.b_t + ' ＝ <em>' + d.ans_t + '</em>。在十位寫上 <em>' + d.ans_t + '</em>！';
        var expSpeak = d.needsCarry
          ? '接著算十位：進位的小 1 加上 ' + d.a_t + ' 再加 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！'
          : '接著算十位：' + d.a_t + ' 加 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
        return {
          pill: '第 3 步 / 共 4 步：再算十位',
          text: expText,
          speak: expSpeak,
          showPrompt: false
        };
      } else {
        var subExpText = d.needsBorrow_o
          ? '接著算十位：十位扣掉剛剛借出的 1 條，剩下 ' + d.borrowed_t + ' 條。<em>' + d.a_t + ' − 1 − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！'
          : '接著算十位：' + d.a_t + ' − ' + d.b_t + ' ＝ <em>' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
        var subExpSpeak = d.needsBorrow_o
          ? '接著算十位：十位扣掉借 1 剩下 ' + d.borrowed_t + '，再減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！'
          : '接著算十位：' + d.a_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
        return {
          pill: '第 3 步 / 共 4 步：再算十位',
          text: subExpText,
          speak: subExpSpeak,
          showPrompt: false
        };
      }
    } else {
      // Step 4 完成
      var opWord = d.op === 'add' ? ' 加 ' : ' 減 ';
      return {
        pill: '第 4 步 / 共 4 步：計算完成！',
        text: '太厲害了！<em>' + d.a + (d.op === 'add' ? ' ＋ ' : ' − ') + d.b + ' ＝ ' + d.total + '</em>。橫式與直式的答案完全一致！',
        speak: '太棒了！' + d.a + opWord + d.b + ' 等於 ' + d.total + '！計算完成！',
        showPrompt: false,
        sound: 'correct'
      };
    }
  }

  /* 核心更新渲染器 (renderCalcView) */
  function renderCalcView(shouldSpeak){
    var d = getCalcDecomp(calcState.numA, calcState.numB, calcState.op);
    var step = calcState.step;

    // 1. 渲染積木
    renderCalcBlocksStage(d, step);

    // 2. 渲染直式算則
    renderVerticalMathBoard(d, step);

    // 3. 步驟狀態與解說
    var info = getStepExplanation(d, step);
    calcEls.stepPill.textContent = info.pill;
    calcEls.stepExplanation.innerHTML = info.text;

    // 按鈕狀態
    calcEls.stepPrevBtn.disabled = (step === 0);
    calcEls.stepNextBtn.disabled = (step >= 4);
    calcEls.stepNextBtn.textContent = (step >= 4) ? '已完成 🎉' : '下一步 ▶';

    // 互動提示 (選項 A)
    if(info.showPrompt && calcEls.interactivePrompt && calcEls.promptContent){
      calcEls.interactivePrompt.style.display = 'flex';
      calcEls.promptContent.innerHTML =
        '<button type="button" class="prompt-btn ' + (info.isBorrow ? 'borrow-btn' : '') + '" id="calc-step-action-btn">' +
          info.promptBtn +
        '</button>';

      var actionBtn = document.getElementById('calc-step-action-btn');
      if(actionBtn){
        actionBtn.addEventListener('click', function(){
          calcNextStep();
        });
      }
    } else if(calcEls.interactivePrompt){
      calcEls.interactivePrompt.style.display = 'none';
    }

    // 音效
    if(info.sound && soundOn){
      sfx(info.sound);
    }

    // 語音朗讀
    if(shouldSpeak && voiceOn){
      speak(info.speak);
    }
  }

  /* 前進下一步 */
  function calcNextStep(){
    if(calcState.step < 4){
      calcState.step++;
      renderCalcView(true);
      if(soundOn && calcState.step < 4) sfx('click');
    } else {
      stopAutoPlay();
    }
  }

  /* 返回上一步 */
  function calcPrevStep(){
    stopAutoPlay();
    if(calcState.step > 0){
      calcState.step--;
      renderCalcView(true);
      if(soundOn) sfx('click');
    }
  }

  /* 重播本步 */
  function calcReplayStep(){
    renderCalcView(true);
    if(soundOn) sfx('click');
  }

  /* 自動演示控制 */
  function stopAutoPlay(){
    if(calcState.autoTimer){
      clearInterval(calcState.autoTimer);
      calcState.autoTimer = null;
    }
    calcState.isAutoPlaying = false;
    if(calcEls.stepAutoBtn){
      calcEls.stepAutoBtn.textContent = '⏯ 自動演示';
    }
  }
  function toggleAutoPlay(){
    if(calcState.isAutoPlaying){
      stopAutoPlay();
    } else {
      calcState.isAutoPlaying = true;
      calcEls.stepAutoBtn.textContent = '⏸ 暫停演示';
      if(calcState.step >= 4){
        calcState.step = 0;
        renderCalcView(true);
      }
      calcState.autoTimer = setInterval(function(){
        if(calcState.step < 4){
          calcNextStep();
        } else {
          stopAutoPlay();
        }
      }, 3000);
    }
  }

  /* 切換運算模式 (加法 / 減法) */
  function setCalcOp(newOp){
    if(calcState.op === newOp) return;
    stopAutoPlay();
    calcState.op = newOp;
    calcEls.btnOpAdd.classList.toggle('active', newOp === 'add');
    calcEls.btnOpAdd.setAttribute('aria-selected', String(newOp === 'add'));
    calcEls.btnOpSub.classList.toggle('active', newOp === 'sub');
    calcEls.btnOpSub.setAttribute('aria-selected', String(newOp === 'sub'));

    // 更新自訂輸入運算符號
    if(calcEls.customOpSymbol){
      calcEls.customOpSymbol.textContent = newOp === 'add' ? '＋' : '−';
    }

    // 換成預設範例第一組
    var list = calcPresets[newOp];
    if(list && list.length > 0){
      calcState.numA = list[0].a;
      calcState.numB = list[0].b;
    }
    calcState.step = 0;

    // 更新概念小卡文字
    if(newOp === 'add'){
      calcEls.conceptTitle.textContent = '直式小秘訣：為什麼一定要從個位先算？';
      calcEls.conceptText.textContent = '因為個位相加滿十時，要捆成 1 條十進位給十位！如果先算十位，十位剛算好的數字就又要被塗改一次，所以由最小的個位算起最順暢、最不容易出錯喔！';
    } else {
      calcEls.conceptTitle.textContent = '直式小秘訣：減法頭上的小 10 是哪裡來的？';
      calcEls.conceptText.textContent = '當個位不夠減時，向十位借 1 條十，拆成 10 顆珠子放到個位！所以在十位頭上記上「借1」（扣 1 條），個位頭上就多出借來的 10 顆，合在一起就可以輕鬆扣減囉！';
    }

    renderCalcPresetChips();
    renderCalcView(true);
    if(soundOn) sfx('click');
  }

  /* 產生隨機題目 */
  function generateRandomCalcProblem(){
    stopAutoPlay();
    var a, b;
    if(calcState.op === 'add'){
      // 隨機產生兩位數加法
      a = Math.floor(Math.random() * 70) + 12;
      b = Math.floor(Math.random() * (99 - a)) + 1;
    } else {
      // 隨機產生兩位數減法 (a >= b)
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * (a - 10)) + 5;
    }
    calcState.numA = a;
    calcState.numB = b;
    calcState.step = 0;
    renderCalcPresetChips();
    renderCalcView(true);
    showToast('已換成新題目：' + a + (calcState.op === 'add' ? ' ＋ ' : ' − ') + b);
  }

  /* 套用自訂題目 */
  function applyCustomCalcProblem(){
    var a = parseInt(calcEls.customNumA.value, 10);
    var b = parseInt(calcEls.customNumB.value, 10);

    if(isNaN(a) || isNaN(b) || a <= 0 || b <= 0){
      showToast('請輸入大於 0 的正整數喔！');
      if(soundOn) sfx('boundary');
      return;
    }
    if(calcState.op === 'sub' && a < b){
      showToast('減法運算中，被減數必須大於或等於減數喔！');
      if(soundOn) sfx('boundary');
      return;
    }
    if(a > 999 || b > 999){
      showToast('請輸入三位數以內的數字喔！');
      if(soundOn) sfx('boundary');
      return;
    }

    stopAutoPlay();
    calcState.numA = a;
    calcState.numB = b;
    calcState.step = 0;
    calcEls.customDrawer.style.display = 'none';
    renderCalcPresetChips();
    renderCalcView(true);
    showToast('已載入自訂算式：' + a + (calcState.op === 'add' ? ' ＋ ' : ' − ') + b);
  }

  /* 事件綁定 */
  if(calcEls.btnOpAdd && calcEls.btnOpSub){
    calcEls.btnOpAdd.addEventListener('click', function(){ setCalcOp('add'); });
    calcEls.btnOpSub.addEventListener('click', function(){ setCalcOp('sub'); });
  }
  if(calcEls.randomBtn){
    calcEls.randomBtn.addEventListener('click', generateRandomCalcProblem);
  }
  if(calcEls.customToggleBtn && calcEls.customDrawer){
    calcEls.customToggleBtn.addEventListener('click', function(){
      var isHidden = calcEls.customDrawer.style.display === 'none';
      calcEls.customDrawer.style.display = isHidden ? 'block' : 'none';
      if(isHidden){
        calcEls.customNumA.value = calcState.numA;
        calcEls.customNumB.value = calcState.numB;
      }
    });
  }
  if(calcEls.applyCustomBtn){
    calcEls.applyCustomBtn.addEventListener('click', applyCustomCalcProblem);
  }
  if(calcEls.stepNextBtn)   calcEls.stepNextBtn.addEventListener('click', calcNextStep);
  if(calcEls.stepPrevBtn)   calcEls.stepPrevBtn.addEventListener('click', calcPrevStep);
  if(calcEls.stepReplayBtn) calcEls.stepReplayBtn.addEventListener('click', calcReplayStep);
  if(calcEls.stepAutoBtn)   calcEls.stepAutoBtn.addEventListener('click', toggleAutoPlay);
  if(calcEls.speakBtn){
    calcEls.speakBtn.addEventListener('click', function(){
      var d = getCalcDecomp(calcState.numA, calcState.numB, calcState.op);
      var info = getStepExplanation(d, calcState.step);
      speak(info.speak);
    });
  }

  // 初始化預設範例 Chip
  renderCalcPresetChips();

  /* ================= 系統自動化自我檢測套件 (SYSTEM AUTOMATED SELF-TEST) ================= */
  var diagnosticsEls = {
    modal: document.getElementById('diagnostics-modal'),
    openBtn: document.getElementById('open-diagnostics-btn'),
    closeBtn: document.getElementById('close-diagnostics-btn'),
    dismissBtn: document.getElementById('dismiss-diagnostics-btn'),
    runBtn: document.getElementById('run-diagnostics-btn'),
    list: document.getElementById('diag-list'),
    statusBox: document.getElementById('diag-status-box')
  };

  /* 自檢測試案例集合 */
  var diagnosticsSuite = [
    {
      id: 'num_chinese',
      name: '中文數字轉換函式 (numberToChinese)',
      run: function(){
        var cases = [
          { in: 0, out: '零' },
          { in: 10, out: '十' },
          { in: 15, out: '十五' },
          { in: 100, out: '一百' },
          { in: 105, out: '一百零五' },
          { in: 324, out: '三百二十四' },
          { in: 999, out: '九百九十九' },
          { in: 1000, out: '一千' },
          { in: 1005, out: '一千零五' },
          { in: 3245, out: '三千二百四十五' },
          { in: 9999, out: '九千九百九十九' }
        ];
        for(var i=0; i<cases.length; i++){
          var res = numberToChinese(cases[i].in);
          if(res !== cases[i].out){
            throw new Error('輸入 ' + cases[i].in + ' 預期「' + cases[i].out + '」，但得到「' + res + '」');
          }
        }
        return '驗證通過 11 組中文數詞（含零之補位、千位數、十位省略一等規則）';
      }
    },
    {
      id: 'carry_borrow',
      name: '積木位值演算與滿十進位/借位邏輯 (Carry & Borrow)',
      run: function(){
        // 模擬獨立狀態以防污染畫面 (支援千位)
        function simInc(s, place, allowTh){
          if(place === 'th') return s.th < 9 ? (s.th++, true) : false;
          if(place === 'h'){
            if(s.h < 9){ s.h++; return true; }
            if(allowTh && simInc(s, 'th', allowTh)){ s.h = 0; return true; }
            return false;
          }
          if(place === 't'){
            if(s.t < 9){ s.t++; return true; }
            if(simInc(s, 'h', allowTh)){ s.t = 0; return true; }
            return false;
          }
          if(s.o < 9){ s.o++; return true; }
          if(simInc(s, 't', allowTh)){ s.o = 0; return true; }
          return false;
        }
        function simDec(s, place, allowTh){
          if(place === 'th') return s.th > 0 ? (s.th--, true) : false;
          if(place === 'h'){
            if(s.h > 0){ s.h--; return true; }
            if(allowTh && simDec(s, 'th', allowTh)){ s.h = 9; return true; }
            return false;
          }
          if(place === 't'){
            if(s.t > 0){ s.t--; return true; }
            if(simDec(s, 'h', allowTh)){ s.t = 9; return true; }
            return false;
          }
          if(s.o > 0){ s.o--; return true; }
          if(simDec(s, 't', allowTh)){ s.o = 9; return true; }
          return false;
        }

        // 測試 1: 個位 9 + 1 -> 個位 0, 十位 + 1
        var testState = { th:0, h:0, t:1, o:9 };
        var ok1 = simInc(testState, 'o', false);
        if(!ok1 || testState.o !== 0 || testState.t !== 2){
          throw new Error('個位進位失敗: ' + JSON.stringify(testState));
        }

        // 測試 2: 99 + 1 -> 100 連續進位
        testState = { th:0, h:0, t:9, o:9 };
        var ok2 = simInc(testState, 'o', false);
        if(!ok2 || testState.h !== 1 || testState.t !== 0 || testState.o !== 0){
          throw new Error('十位與百位雙重進位失敗: ' + JSON.stringify(testState));
        }

        // 測試 3: 100 - 1 -> 99 連續借位
        testState = { th:0, h:1, t:0, o:0 };
        var ok3 = simDec(testState, 'o', false);
        if(!ok3 || testState.h !== 0 || testState.t !== 9 || testState.o !== 9){
          throw new Error('連續借位失敗: ' + JSON.stringify(testState));
        }

        // 測試 4: 千位模式啟用時 999 + 1 -> 1000 三重進位
        testState = { th:0, h:9, t:9, o:9 };
        var ok4 = simInc(testState, 'o', true);
        if(!ok4 || testState.th !== 1 || testState.h !== 0 || testState.t !== 0 || testState.o !== 0){
          throw new Error('千位模式連續進位至 1000 失敗: ' + JSON.stringify(testState));
        }

        // 測試 5: 千位模式 1000 - 1 -> 999 三重借位
        testState = { th:1, h:0, t:0, o:0 };
        var ok5 = simDec(testState, 'o', true);
        if(!ok5 || testState.th !== 0 || testState.h !== 9 || testState.t !== 9 || testState.o !== 9){
          throw new Error('千位模式連續借位至 999 失敗: ' + JSON.stringify(testState));
        }

        return '個、十、百及千位連鎖進借位演算全數通過';
      }
    },
    {
      id: 'quiz_generation',
      name: '測驗隨機題目生成器合規性 (Question Generator)',
      run: function(){
        for(var k=0; k<50; k++){
          var type = Math.random() < 0.5 ? 'A' : 'B';
          var th = 0, h = 0, t = 0, o = 0;
          if(type === 'A'){
            var maxLimit = thousandEnabled ? 9999 : 999;
            var n = randInt(1, maxLimit);
            th = Math.floor(n/1000);
            h = Math.floor((n%1000)/100);
            t = Math.floor((n%100)/10);
            o = n%10;
            if(n < 1 || n > maxLimit || (th*1000+h*100+t*10+o) !== n){
              throw new Error('題型 A 生成異常數值: ' + n);
            }
          } else {
            do {
              th = thousandEnabled ? randInt(0, 9) : 0;
              h = randInt(0,9);
              t = randInt(0,9);
              o = randInt(0,9);
            } while(th===0 && h===0 && t===0 && o===0);
            var val = th*1000 + h*100 + t*10 + o;
            if(val < 1 || val > 9999){
              throw new Error('題型 B 積木數值不合法: ' + val);
            }
          }
        }
        return '隨機抽樣 50 題，數值範圍與位值拆解全部合法';
      }
    },
    {
      id: 'audio_speech',
      name: '音效 (Web Audio API) 與語音朗讀 (SpeechSynthesis) 支援度',
      run: function(){
        var hasAudioCtx = !!(window.AudioContext || window.webkitAudioContext);
        var hasSpeech = 'speechSynthesis' in window;
        if(!hasAudioCtx){
          throw new Error('當前環境不支援 Web Audio API');
        }
        return 'Web Audio 引擎正常可用；語音合成支援: ' + (hasSpeech ? '支援 (zh-TW)' : '未提供(靜默降級)');
      }
    },
    {
      id: 'dom_integrity',
      name: 'DOM 核心元素與互動元件健全度 (DOM Integrity)',
      run: function(){
        var requiredIds = [
          'display', 'count-th', 'count-h', 'count-t', 'count-o',
          'blocks-th', 'blocks-h', 'blocks-t', 'blocks-o',
          'minus-th', 'plus-th', 'minus-h', 'plus-h', 'minus-t', 'plus-t', 'minus-o', 'plus-o',
          'main-tab-learn', 'main-tab-calc', 'main-tab-quiz',
          'panel-learn', 'panel-calc', 'panel-quiz', 'toggle-thousand',
          'btn-op-add', 'btn-op-sub', 'vertical-math-board', 'calc-blocks-stage',
          'step-next-btn', 'step-prev-btn', 'step-auto-btn',
          'tab-practice', 'tab-selftest', 'start-selftest-btn',
          'quiz-card', 'check-btn', 'next-btn', 'feedback',
          'diagnostics-modal'
        ];
        var missing = [];
        requiredIds.forEach(function(id){
          if(!document.getElementById(id)){ missing.push(id); }
        });
        if(missing.length > 0){
          throw new Error('缺少必要 DOM 元素: ' + missing.join(', '));
        }
        return '39 個關鍵頁面元件、三個主分頁、直式加減法節點、千位數與自測節點全數就緒';
      }
    },
    {
      id: 'vertical_calc_engine',
      name: '直式加減法拆解演算法與進退位驗證 (Vertical Calc Engine)',
      run: function(){
        // 驗證加法無進位: 23 + 14 = 37
        var add1 = getCalcDecomp(23, 14, 'add');
        if(add1.total !== 37 || add1.needsCarry !== false || add1.ans_o !== 7 || add1.ans_t !== 3){
          throw new Error('加法無進位計算異常: ' + JSON.stringify(add1));
        }
        // 驗證加法個位進位: 28 + 15 = 43
        var add2 = getCalcDecomp(28, 15, 'add');
        if(add2.total !== 43 || add2.needsCarry !== true || add2.ans_o !== 3 || add2.ans_t !== 4){
          throw new Error('加法個位進位計算異常: ' + JSON.stringify(add2));
        }
        // 驗證加法進百位: 86 + 47 = 133
        var add3 = getCalcDecomp(86, 47, 'add');
        if(add3.total !== 133 || add3.ans_o !== 3 || add3.ans_t !== 3 || add3.ans_h !== 1){
          throw new Error('加法進百位計算異常: ' + JSON.stringify(add3));
        }
        // 驗證減法無退位: 35 - 12 = 23
        var sub1 = getCalcDecomp(35, 12, 'sub');
        if(sub1.total !== 23 || sub1.needsBorrow_o !== false || sub1.ans_o !== 3 || sub1.ans_t !== 2){
          throw new Error('減法無退位計算異常: ' + JSON.stringify(sub1));
        }
        // 驗證減法個位退位: 42 - 17 = 25
        var sub2 = getCalcDecomp(42, 17, 'sub');
        if(sub2.total !== 25 || sub2.needsBorrow_o !== true || sub2.borrowed_t !== 3 || sub2.effective_o !== 12 || sub2.ans_o !== 5 || sub2.ans_t !== 2){
          throw new Error('減法個位退位計算異常: ' + JSON.stringify(sub2));
        }
        return '驗證通過直式加法（無進位、滿十進一、進百位）與直式減法（無退位、借一拆十）全部案例';
      }
    }
  ];

  /* 執行全套自檢測試並回傳結果 */
  function executeSelfTest(onStep){
    var results = [];
    var passed = 0;
    var t0 = performance.now();

    diagnosticsSuite.forEach(function(test, i){
      var itemRes = { id: test.id, name: test.name, ok: true, message: '' };
      try{
        var msg = test.run();
        itemRes.ok = true;
        itemRes.message = msg;
        passed++;
      } catch(err){
        itemRes.ok = false;
        itemRes.message = err.message || String(err);
      }
      results.push(itemRes);
      if(onStep) onStep(itemRes, i, diagnosticsSuite.length);
    });

    var duration = Math.round(performance.now() - t0);
    return {
      total: diagnosticsSuite.length,
      passed: passed,
      failed: diagnosticsSuite.length - passed,
      durationMs: duration,
      results: results
    };
  }

  /* 渲染自檢彈窗 */
  function runDiagnosticsUI(){
    diagnosticsEls.list.innerHTML = '';
    diagnosticsEls.statusBox.textContent = '🔄 正在執行自動化檢測...';
    diagnosticsEls.statusBox.style.color = 'var(--ink)';

    setTimeout(function(){
      var outcome = executeSelfTest(function(item){
        var div = document.createElement('div');
        div.className = 'diag-item';
        div.innerHTML =
          '<div class="diag-item-info">' +
            '<div class="diag-item-name">' + (item.ok ? '✅ ' : '❌ ') + item.name + '</div>' +
            '<div class="diag-item-detail">' + item.message + '</div>' +
          '</div>' +
          '<div class="diag-status ' + (item.ok ? 'pass' : 'fail') + '">' +
            (item.ok ? 'PASS 通過' : 'FAIL 失敗') +
          '</div>';
        diagnosticsEls.list.appendChild(div);
      });

      if(outcome.failed === 0){
        diagnosticsEls.statusBox.textContent = '🎉 全部 ' + outcome.total + ' 項自檢測試皆通過！耗時 ' + outcome.durationMs + ' ms';
        diagnosticsEls.statusBox.style.color = 'var(--good)';
        sfx('correct');
      } else {
        diagnosticsEls.statusBox.textContent = '⚠️ 檢測完成：' + outcome.passed + ' 項通過，' + outcome.failed + ' 項未通過（耗時 ' + outcome.durationMs + ' ms）';
        diagnosticsEls.statusBox.style.color = 'var(--bad)';
        sfx('wrong');
      }

      // 控制台同步輸出測試結果
      try{
        console.group('🧪 數字積木屋 - 系統自檢報告 (System Self-Test Report)');
        console.log('通過率: ' + outcome.passed + ' / ' + outcome.total + ' (' + outcome.durationMs + ' ms)');
        console.table(outcome.results);
        console.groupEnd();
      }catch(e){}
    }, 120);
  }

  /* 彈窗開關控制 */
  function openDiagnosticsModal(){
    diagnosticsEls.modal.style.display = 'flex';
    runDiagnosticsUI();
  }
  function closeDiagnosticsModal(){
    diagnosticsEls.modal.style.display = 'none';
  }

  diagnosticsEls.openBtn.addEventListener('click', openDiagnosticsModal);
  diagnosticsEls.closeBtn.addEventListener('click', closeDiagnosticsModal);
  diagnosticsEls.dismissBtn.addEventListener('click', closeDiagnosticsModal);
  diagnosticsEls.runBtn.addEventListener('click', runDiagnosticsUI);

  // 點擊彈窗遮罩背景關閉
  diagnosticsEls.modal.addEventListener('click', function(e){
    if(e.target === diagnosticsEls.modal){ closeDiagnosticsModal(); }
  });

  // 全域開發者 API：支援在瀏覽器主控台呼叫 window.runSelfTest()
  window.runSelfTest = function(showModal){
    if(showModal){
      openDiagnosticsModal();
    }
    return executeSelfTest();
  };

})();

