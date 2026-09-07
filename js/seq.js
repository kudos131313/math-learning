/**
 * ==========================================================================
 * 單元 2：數的規律與跳數列車 - 概念探索引擎 (SEQ LEARN MODULE)
 * 專為解決孩子「跨百跨十進退位、跳數規律與倒數」之認知障礙設計
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var currentNum = 189; // 預設 189，完美示範 189 -> 199 -> 209 跨百進位
  var step = 10;        // 預設每次跳 10
  var isPlaying = false;
  var playTimer = null;

  // DOM 元素引用快取
  var trackEl = null;
  var tipBannerEl = null;
  var tipTitleEl = null;
  var tipBodyEl = null;
  var blocksHEl = null;
  var blocksTEl = null;
  var blocksOEl = null;
  var countHEl = null;
  var countTEl = null;
  var countOEl = null;
  var startInputEl = null;
  var playBtnEl = null;
  var chartGridEl = null;
  var chartWrapEl = null;
  var chartToggleBtn = null;
  var chartToggleText = null;

  var currentChartRange = 101; // 百數表區間起始 (1, 101, 201, 901)
  var isChartCollapsed = false;

  /* 判斷數字是否處於跨百或跨十臨界點 */
  function isCrossBoundary(num, curStep){
    if(num < 0 || num > 9999) return false;
    var absStep = Math.abs(curStep);
    var rem = num % 100;
    // 跨百或跨千偵測
    if(num >= 1000) return true;
    if(absStep === 10){
      if(rem === 9 || rem === 99 || rem === 0 || rem === 5 || rem === 95) return true;
    }
    if(absStep === 1){
      if(num % 100 === 0 || num % 100 === 99 || num % 10 === 0 || num % 10 === 9) return true;
    }
    return false;
  }

  /* 拆解數字為各數位 HTML (具備分位染色與跳動高亮) */
  function renderCarDigitsHtml(val, isCurrent, curStep){
    if(val < 0) return '<span class="digit-o">0</span>';
    var s = String(val);
    var len = s.length;
    var html = '';

    // 判斷當前步長主要牽動哪一個數位
    var targetPlace = 'o'; // 'o', 't', 'h', 'th'
    var absStep = Math.abs(curStep);
    if(absStep >= 100) targetPlace = 'h';
    else if(absStep >= 10) targetPlace = 't';
    else targetPlace = 'o';

    for(var i = 0; i < len; i++){
      var placeIndexFromRight = len - 1 - i; // 0=個, 1=十, 2=百, 3=千
      var placeClass = 'digit-o';
      var isChanging = false;

      if(placeIndexFromRight === 0){
        placeClass = 'digit-o';
        if(targetPlace === 'o' && isCurrent) isChanging = true;
      } else if(placeIndexFromRight === 1){
        placeClass = 'digit-t';
        if(targetPlace === 't' && isCurrent) isChanging = true;
      } else if(placeIndexFromRight === 2){
        placeClass = 'digit-h';
        if((targetPlace === 'h' || (targetPlace === 't' && val % 100 < 15)) && isCurrent) isChanging = true;
      } else if(placeIndexFromRight >= 3){
        placeClass = 'digit-th';
        if(val >= 1000 && isCurrent) isChanging = true;
      }

      var pulsClass = isChanging ? ' digit-pulsing' : '';
      html += '<span class="' + placeClass + pulsClass + '">' + s[i] + '</span>';
    }
    return html;
  }

  /* 渲染 5 節車廂與中間的跳數連接符 (避免捲軸，完美自適應) */
  function renderTrain(){
    if(!trackEl) return;
    var html = '';
    var offsets = [-2, -1, 0, 1, 2];

    offsets.forEach(function(offset, idx){
      var val = currentNum + offset * step;
      var isCurrent = (offset === 0);
      var cross = isCrossBoundary(val, step);

      // P1: 在相鄰兩節車廂之間加入跳數連接符與步長箭頭
      if(idx > 0){
        var absStep = Math.abs(step);
        var sign = step > 0 ? '+' : '−';
        var arrow = step > 0 ? '→' : '←';
        var stepTxt = sign + absStep;
        html += '<div class="train-step-connector" title="相鄰車廂跳數間隔 ' + stepTxt + '">';
        html += '  <div class="train-connector-line"></div>';
        html += '  <div class="train-step-pill' + (step < 0 ? ' neg' : '') + '">' + arrow + ' ' + stepTxt + '</div>';
        html += '</div>';
      }

      var carClass = 'train-car';
      if(isCurrent) carClass += ' current';
      if(cross) carClass += ' cross-hundred';

      var roleText = offset === 0 ? '目前數字' :
                     offset < 0 ? (offset === -1 ? '前一步' : Math.abs(offset) + '步前') :
                     (offset === 1 ? '下一步' : offset + '步後');

      var badgeHtml = '';
      if(cross){
        if(val >= 1000) {
          badgeHtml = '<span class="cross-badge">👑 跨千大關！</span>';
        } else if(step === 10 || step === -10){
          if(val >= 200 && val <= 209) badgeHtml = '<span class="cross-badge">🌟 跨百關鍵！</span>';
          else if(val >= 190 && val <= 199) badgeHtml = '<span class="cross-badge">⚡ 滿十準備！</span>';
          else if(val >= 100 && val <= 109) badgeHtml = '<span class="cross-badge">🚀 進入三位數！</span>';
        } else if(step === 1 || step === -1){
          if(val === 200 || val === 199) badgeHtml = '<span class="cross-badge">🌟 整百交界！</span>';
          else if(val === 190 || val === 189) badgeHtml = '<span class="cross-badge">⚡ 整十交界！</span>';
        }
      }

      html += '<div class="' + carClass + '" data-val="' + val + '" role="button" tabindex="0" title="點擊切換為中心焦點">';
      html += badgeHtml;
      html += '<div class="train-car-role">' + roleText + '</div>';
      html += '<div class="train-car-num">' + renderCarDigitsHtml(val, isCurrent, step) + '</div>';
      html += '</div>';
    });

    trackEl.innerHTML = html;

    // 為每節車廂綁定點擊直接切換為焦點
    var cars = trackEl.querySelectorAll('.train-car');
    cars.forEach(function(car){
      car.addEventListener('click', function(){
        var v = parseInt(car.getAttribute('data-val'), 10);
        if(!isNaN(v) && v >= 0 && v <= 9999){
          setNumber(v);
        }
      });
    });
  }

  /* 規律智能解說生成 (直攻小孩思維死角) */
  function generateExplanation(num, curStep){
    var prev = num - curStep;
    var absStep = Math.abs(curStep);
    var isForward = curStep > 0;

    var title = '';
    var body = '';

    var prevH = Math.floor(Math.max(0, prev) / 100);
    var prevT = Math.floor((Math.max(0, prev) % 100) / 10);
    var prevO = Math.max(0, prev) % 10;

    var curH = Math.floor(Math.max(0, num) / 100);
    var curT = Math.floor((Math.max(0, num) % 100) / 10);
    var curO = Math.max(0, num) % 10;

    if(num >= 1000){
      title = '👑 晉升四位數：跨過一千大關！';
      body = '三位數滿千了！10 個百合成了 1 個大立方體千格方塊，百位、十位與個位都歸零，寫作 <b>' + num + '</b>！';
    } else if(absStep === 10){
      if(isForward){
        // 加 10 跨百經典 (如 199 -> 209, 189 -> 199)
        if(prevT === 9 && curT === 0){
          title = '💥 超級關鍵：十位滿十進一變成百！';
          body = '從 <b>' + prev + '</b> 加上 10 時，十位的 <b class="t-highlight">9 個十</b> 加上 1 個十變成 10 個十，' +
                 '正好可以合成 <b class="h-highlight">1 片百格板</b>！所以百位從 ' + prevH + ' 變成 ' + curH + '，' +
                 '十位歸零變成 0，而個位的 <b class="o-highlight">' + curO + '</b> 穩穩不動，所以是 <b>' + num + '</b>！';
        } else if(prev < 100 && num >= 100){
          title = '🚀 晉升三位數：從二位數跨過一百！';
          body = '從 <b>' + prev + '</b> 加 10，十位 9+1=10 滿十進百，百位誕生了 <b class="h-highlight">1 個百</b>，' +
                 '十位變成 0，個位依然是 <b class="o-highlight">' + curO + '</b>，寫作 <b>' + num + '</b>！';
        } else {
          title = '💡 10 個 10 個數：只有「十位」在跳步！';
          body = '觀察看看：每次加 10，個位永遠是 <b class="o-highlight">' + curO + '</b> 一動也不動，' +
                 '只有十位從 <b class="t-highlight">' + prevT + ' 個十</b> 變成 <b class="t-highlight">' + curT + ' 個十</b> 喔！';
        }
      } else {
        // 減 10 跨百倒數 (如 205 -> 195)
        if(prevT === 0 && curT === 9){
          title = '⚡ 跨百退位減十：百位借出當十個十！';
          body = '從 <b>' + prev + '</b> 倒數減 10，十位是 0 不夠減，向百位借 <b class="h-highlight">1 個百</b> 當作 10 個十，' +
                 '減去 1 個十後剩下 <b class="t-highlight">9 個十</b>，百位退為 ' + curH + '，個位 <b class="o-highlight">' + curO + '</b> 不動，所以是 <b>' + num + '</b>！';
        } else {
          title = '💡 10 個 10 個倒數：十位每次少 1！';
          body = '倒數減 10 時，個位保持 <b class="o-highlight">' + curO + '</b> 不變，十位從 ' + prevT + ' 減少到 ' + curT + '！';
        }
      }
    } else if(absStep === 1){
      if(!isForward){
        // 減 1 跨百 (如 200 -> 199)
        if(prev % 100 === 0){
          title = '🌟 整百倒數：二百的前一個是誰？';
          body = '很多小朋友會卡在 <b>' + prev + '</b> 的前一個是誰！請記住：' + prev + ' 拿走 1 個顆粒，' +
                 '百位借出變成 1 個百，十位有 9 個十，個位有 9 個一，就是 <b class="h-highlight">1</b><b class="t-highlight">9</b><b class="o-highlight">9</b>！';
        } else if(prev % 10 === 0){
          title = '⚡ 整十退位倒數：十位少 1，個位變 9！';
          body = '從 <b>' + prev + '</b> 倒退 1 個，十位退成 <b class="t-highlight">' + curT + '</b>，個位變成滿格的 <b class="o-highlight">9</b>，所以是 <b>' + num + '</b>！';
        } else {
          title = '💡 1 個 1 個倒數：個位每次減 1！';
          body = '倒數時，個位由 ' + prevO + ' 變成 ' + curO + '，百位與十位都不動喔！';
        }
      } else {
        if(num % 100 === 0){
          title = '🌟 滿百晉級：' + prev + ' 的下一個是整百！';
          body = '<b>' + prev + '</b> 再加 1 個顆粒，個位滿十、十位又滿十，雙重進位變成整整 <b class="h-highlight">' + curH + ' 百</b>！';
        } else {
          title = '💡 1 個 1 個數：個位每次加 1！';
          body = '就像排隊點名一樣，每次多 1 個顆粒，由 ' + prev + ' 前進到 ' + num + '！';
        }
      }
    } else if(absStep === 5){
      title = '⏱️ 5 個 5 個數：鐘面分針與 5 元硬幣節奏！';
      body = '觀察個位：每次跳 5，個位只會在「0」和「5」之間規律交替喔！';
    } else if(absStep === 2){
      title = '👣 2 個 2 個數：雙數與單數的步伐！';
      body = '每次跳 2，個位每次加 2（2、4、6、8、0），十位只有在個位滿十時才進一步！';
    } else if(absStep === 100){
      title = '💯 百數大跳躍：只有「百位」大步跨！';
      body = '每次跳 100，十位與個位完全不動，只有百位從 ' + prevH + ' 變成 ' + curH + '！';
    } else {
      var dirText = curStep > 0 ? '每次增加 ' + curStep : '每次倒退減少 ' + Math.abs(curStep);
      title = '🎯 自訂跳數規律：步長為 ' + (curStep > 0 ? '+' : '') + curStep;
      body = '自訂跳數規律：' + dirText + '！觀察前後車廂的數字變化，看看個位、十位或百位有什麼節奏！';
    }

    return { isTrap: false, title: title, body: body };
  }

  /* P3: 渲染 10x10 百數表二維地圖 */
  function renderHundredChart(forcedRange){
    if(!chartGridEl) return;

    var autoRange = 101;
    if(currentNum <= 100) autoRange = 1;
    else if(currentNum <= 200) autoRange = 101;
    else if(currentNum <= 300) autoRange = 201;
    else if(currentNum >= 900) autoRange = 901;
    else {
      autoRange = Math.floor((currentNum - 1) / 100) * 100 + 1;
    }

    // 若傳入指定區間則使用指定區間，否則自動跟隨列車位置
    currentChartRange = (typeof forcedRange === 'number') ? forcedRange : autoRange;

    // 同步區間按鈕外觀
    var rangeBtns = document.querySelectorAll('.chart-range-btn');
    rangeBtns.forEach(function(btn){
      var r = parseInt(btn.getAttribute('data-range'), 10);
      btn.classList.toggle('active', r === currentChartRange);
    });

    // 收集當前 5 節車廂的數字集合
    var trainVals = {};
    for(var offset = -2; offset <= 2; offset++){
      trainVals[currentNum + offset * step] = true;
    }

    var html = '';
    for(var i = 0; i < 100; i++){
      var val = currentChartRange + i;
      var isCurrent = (val === currentNum);
      var isTrail = !!trainVals[val] && !isCurrent;

      var cls = 'chart-cell';
      if(isCurrent) cls += ' cell-current';
      else if(isTrail) cls += ' cell-trail';

      var displayContent = isCurrent ? ('🚂 ' + val) : String(val);
      html += '<div class="' + cls + '" data-val="' + val + '" role="button" tabindex="0" title="點擊讓列車開往 ' + val + '">' + displayContent + '</div>';
    }

    chartGridEl.innerHTML = html;

    // 為百數表格子綁定點擊事件
    var cells = chartGridEl.querySelectorAll('.chart-cell');
    cells.forEach(function(cell){
      cell.addEventListener('click', function(){
        var v = parseInt(cell.getAttribute('data-val'), 10);
        if(!isNaN(v)){
          setNumber(v, true);
        }
      });
    });
  }

  /* 更新位值積木與解說 */
  function updateInspectAndBlocks(){
    var h = Math.floor(currentNum / 100);
    var t = Math.floor((currentNum % 100) / 10);
    var o = currentNum % 10;

    if(countHEl) countHEl.textContent = h + ' 片百格板 (' + (h * 100) + ')';
    if(countTEl) countTEl.textContent = t + ' 根十格條 (' + (t * 10) + ')';
    if(countOEl) countOEl.textContent = o + ' 顆小積木 (' + o + ')';

    if(blocksHEl && MathApp.renderBlocks) MathApp.renderBlocks(blocksHEl, 'h', h);
    if(blocksTEl && MathApp.renderBlocks) MathApp.renderBlocks(blocksTEl, 't', t);
    if(blocksOEl && MathApp.renderBlocks) MathApp.renderBlocks(blocksOEl, 'o', o);

    var info = generateExplanation(currentNum, step);
    if(tipTitleEl) tipTitleEl.textContent = info.title;
    if(tipBodyEl) tipBodyEl.innerHTML = info.body;

    if(startInputEl) startInputEl.value = currentNum;

    // 同步更新百數表
    renderHundredChart();
  }

  /* 設定目前數字 */
  function setNumber(newVal, playVoice, silent){
    var bounded = Math.max(0, Math.min(9999, newVal));
    currentNum = bounded;
    renderTrain();
    updateInspectAndBlocks();

    // 音效（非靜音模式才播放）
    if(!silent){
      if(isCrossBoundary(currentNum, step)){
        if(MathApp.sfx) MathApp.sfx('chime');
      } else {
        if(MathApp.sfx) MathApp.sfx('tick');
      }
    }

    // 語音播報
    if(playVoice && MathApp.speak){
      var spoken = (MathApp.utils && MathApp.utils.numberToTaiwanSpokenText)
        ? MathApp.utils.numberToTaiwanSpokenText(currentNum)
        : (MathApp.numberToChinese ? MathApp.numberToChinese(currentNum) : currentNum);
      MathApp.speak(spoken);
    }
  }

  /* 前進一步 */
  function stepForward(){
    setNumber(currentNum + step, true);
  }

  /* 後退一步 */
  function stepBackward(){
    setNumber(currentNum - step, true);
  }

  /* 切換自動播放 */
  function togglePlay(){
    isPlaying = !isPlaying;
    if(isPlaying){
      if(playBtnEl){
        playBtnEl.innerHTML = '<i data-lucide="pause"></i><span>暫停播放</span>';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      }
      playTimer = setInterval(function(){
        if(currentNum + step > 990 || currentNum + step < 0){
          setNumber(step > 0 ? 89 : 239);
        } else {
          stepForward();
        }
      }, 1600);
    } else {
      if(playTimer) clearInterval(playTimer);
      playTimer = null;
      if(playBtnEl){
        playBtnEl.innerHTML = '<i data-lucide="play"></i><span>自動播放</span>';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      }
    }
  }

  /* 設定跳數步長 */
  function setStep(newStep, isCustom){
    if(typeof newStep !== 'number' || isNaN(newStep) || newStep === 0) return;
    step = newStep;

    // 依據新步長選取合適的起點範例，讓孩子立刻看到亮點！
    if(step === 10) setNumber(189);
    else if(step === -10) setNumber(205);
    else if(step === -1) setNumber(201);
    else if(step === 1) setNumber(198);
    else if(step === 5) setNumber(165);
    else if(step === 2) setNumber(102);
    else {
      setNumber(currentNum);
    }

    var customGroup = document.getElementById('seq-custom-step-group');
    if(isCustom){
      document.querySelectorAll('.step-pill[data-step]').forEach(function(pill){
        pill.classList.remove('active');
      });
      if(customGroup) customGroup.classList.add('active');
    } else {
      if(customGroup) customGroup.classList.remove('active');
      document.querySelectorAll('.step-pill[data-step]').forEach(function(pill){
        var s = parseInt(pill.getAttribute('data-step'), 10);
        var isActive = (s === step);
        pill.classList.toggle('active', isActive);
      });
    }

    if(MathApp.sfx) MathApp.sfx('click');
  }

  /* 初始化模組 */
  function init(){
    trackEl = document.getElementById('seq-train-track');
    tipBannerEl = document.getElementById('seq-tip-banner');
    tipTitleEl = document.getElementById('seq-tip-title');
    tipBodyEl = document.getElementById('seq-tip-body');
    blocksHEl = document.getElementById('seq-blocks-h');
    blocksTEl = document.getElementById('seq-blocks-t');
    blocksOEl = document.getElementById('seq-blocks-o');
    countHEl = document.getElementById('seq-count-h');
    countTEl = document.getElementById('seq-count-t');
    countOEl = document.getElementById('seq-count-o');
    startInputEl = document.getElementById('seq-start-input');
    playBtnEl = document.getElementById('seq-play-btn');

    chartGridEl = document.getElementById('hundred-chart-grid');
    chartWrapEl = document.getElementById('hundred-chart-wrap');
    chartToggleBtn = document.getElementById('chart-toggle-btn');
    chartToggleText = document.getElementById('chart-toggle-text');

    // 步長按鈕
    document.querySelectorAll('.step-pill[data-step]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var s = parseInt(btn.getAttribute('data-step'), 10);
        if(!isNaN(s)) setStep(s, false);
      });
    });

    // P3: 百數表區間切換按鈕綁定
    document.querySelectorAll('.chart-range-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var r = parseInt(btn.getAttribute('data-range'), 10);
        if(!isNaN(r)){
          var rangeMax = (r === 1) ? 100 : (r + 99);
          var inRange = (currentNum >= r && currentNum <= rangeMax);
          if(!inRange){
            // 若當前數字不在所選區間，將列車開往該區間起點，連帶位值積木、解說、百數表全部同步切換
            setNumber(r, true);
          } else {
            // 已在該區間內，確保百數表聚焦該區間
            renderHundredChart(r);
            if(MathApp.sfx) MathApp.sfx('click');
          }
        }
      });
    });

    // P3: 百數表收合/展開切換
    if(chartToggleBtn && chartWrapEl){
      chartToggleBtn.addEventListener('click', function(){
        isChartCollapsed = !isChartCollapsed;
        chartWrapEl.style.display = isChartCollapsed ? 'none' : 'block';
        if(chartToggleText){
          chartToggleText.textContent = isChartCollapsed ? '展開地圖' : '收合地圖';
        }
        var icon = chartToggleBtn.querySelector('i');
        if(icon){
          icon.setAttribute('data-lucide', isChartCollapsed ? 'chevron-down' : 'chevron-up');
          if(MathApp.refreshIcons) MathApp.refreshIcons();
        }
      });
    }

    // 自訂跳數步長
    var customInputEl = document.getElementById('seq-custom-step-input');
    var customBtnEl = document.getElementById('seq-custom-step-btn');
    function applyCustomStep(){
      if(!customInputEl) return;
      var val = parseInt(customInputEl.value, 10);
      if(isNaN(val) || val === 0){
        alert('請輸入不為 0 的整數跳數間隔（例如 5、2 或 -5）');
        return;
      }
      setStep(val, true);
    }
    if(customBtnEl){
      customBtnEl.addEventListener('click', applyCustomStep);
    }
    if(customInputEl){
      customInputEl.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          applyCustomStep();
        }
      });
    }

    // 前後操作按鈕
    var prevBtn = document.getElementById('seq-prev-btn');
    var nextBtn = document.getElementById('seq-next-btn-step');
    if(prevBtn) prevBtn.addEventListener('click', stepBackward);
    if(nextBtn) nextBtn.addEventListener('click', stepForward);
    if(playBtnEl) playBtnEl.addEventListener('click', togglePlay);

    // 起點數字輸入
    if(startInputEl){
      startInputEl.addEventListener('change', function(){
        var val = parseInt(startInputEl.value, 10);
        if(!isNaN(val)){
          setNumber(val, true);
        }
      });
      var applyBtn = document.getElementById('seq-apply-start-btn');
      if(applyBtn){
        applyBtn.addEventListener('click', function(){
          var val = parseInt(startInputEl.value, 10);
          if(!isNaN(val)){
            setNumber(val, true);
          }
        });
      }
    }

    // 預設渲染（靜音模式，頁面載入時不發出聲音）
    setNumber(189, false, true);
    console.log('🚂 數的規律與跳數列車模組 (seq.js) 升級版已就緒！');
  }

  MathApp.seq = {
    init: init,
    setNumber: setNumber,
    setStep: setStep,
    stepForward: stepForward,
    stepBackward: stepBackward,
    getCurrentNum: function(){ return currentNum; },
    getStep: function(){ return step; }
  };

})();

