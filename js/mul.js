/**
 * ==========================================================================
 * 單元 4：九九乘法表探索台模組 (MULTIPLICATION EXPLORER MODULE)
 * 結合 9x9 互動百寶矩陣、方陣面積框選、「幾個幾」分組連加與十進位積木合成
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var cnDigits = ['零','一','二','三','四','五','六','七','八','九'];

  /* 探索台核心數學與互動狀態 */
  var state = {
    a: 3,                 // 被乘數（每組幾個，1 ~ 9）
    b: 4,                 // 乘數（共有幾組，1 ~ 9）
    maskMode: false,      // 遮蓋背誦模式開關
    revealedMap: {},      // 遮蓋模式下已翻開的格子 { '3x4': true }
    isPlayingRow: false,  // 是否正在整段連播
    playRowTimer: null
  };

  var els = {};

  /* 取得臺灣國小九九乘法口訣（依序：被乘數 a、乘數 b、積 a*b） */
  function getMantra(a, b){
    var p = a * b;
    var prefix = (cnDigits[a] || a) + (cnDigits[b] || b);
    if(p < 10){
      return prefix + '得' + cnDigits[p];
    }
    if(p === 10){
      return prefix + '得十';
    }
    return prefix + MathApp.utils.numberToChinese(p);
  }

  /* 產生口語朗讀字串 */
  function getSpokenExplanation(a, b, shortOnly){
    var p = a * b;
    var mantra = getMantra(a, b);
    if(shortOnly){
      return mantra + '，' + a + ' 乘以 ' + b + ' 等於 ' + p;
    }
    return mantra + '。' + a + ' 乘以 ' + b + ' 等於 ' + p +
      '，代表每組 ' + a + ' 個，共有 ' + b + ' 組，也就是 ' + b + ' 個 ' + a + ' 相加等於 ' + p + '。';
  }

  /* 綁定 DOM 參考 */
  function cacheDom(){
    els.rowPillsWrap    = document.getElementById('mul-row-pills');
    els.playRowBtn      = document.getElementById('mul-play-row-btn');
    els.swapBtn         = document.getElementById('mul-swap-btn');
    els.maskToggleBtn   = document.getElementById('mul-mask-toggle-btn');
    els.maskResetBtn    = document.getElementById('mul-mask-reset-btn');
    els.minusA          = document.getElementById('mul-minus-a');
    els.plusA           = document.getElementById('mul-plus-a');
    els.valA            = document.getElementById('mul-val-a');
    els.minusB          = document.getElementById('mul-minus-b');
    els.plusB           = document.getElementById('mul-plus-b');
    els.valB            = document.getElementById('mul-val-b');
    els.tableGrid       = document.getElementById('mul-table-grid');
    els.equationBig     = document.getElementById('mul-equation-big');
    els.mantraPill      = document.getElementById('mul-mantra-pill');
    els.meaningPill     = document.getElementById('mul-meaning-pill');
    els.speakCurrentBtn = document.getElementById('mul-speak-current-btn');
    els.groupsBoxSub    = document.getElementById('mul-groups-box-sub');
    els.groupsContainer = document.getElementById('mul-groups-container');
    els.repeatedAddBar  = document.getElementById('mul-repeated-add-bar');
    els.miniArray       = document.getElementById('mul-mini-array');
    els.base10Stage     = document.getElementById('mul-base10-stage');
    els.areaNote        = document.getElementById('mul-area-note');
  }

  /* 停止整段口訣連播 */
  function stopRowPlayback(){
    if(state.playRowTimer){
      clearTimeout(state.playRowTimer);
      state.playRowTimer = null;
    }
    state.isPlayingRow = false;
    if(els.playRowBtn){
      els.playRowBtn.classList.remove('playing');
      els.playRowBtn.innerHTML = '<i data-lucide="volume-2"></i><span>整段口訣連播</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
  }

  /* 啟動整段口訣連播 (a × 1 ~ a × 9) */
  function toggleRowPlayback(){
    if(state.isPlayingRow){
      stopRowPlayback();
      return;
    }
    state.isPlayingRow = true;
    var targetA = state.a;
    var stepB = 1;

    if(els.playRowBtn){
      els.playRowBtn.classList.add('playing');
      els.playRowBtn.innerHTML = '<i data-lucide="square"></i><span>停止連播 (' + targetA + '段)</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }

    function playStep(){
      if(!state.isPlayingRow) return;
      if(stepB > 9){
        stopRowPlayback();
        return;
      }
      if(state.maskMode){
        state.revealedMap[targetA + 'x' + stepB] = true;
      }
      setFactors(targetA, stepB, { silentStopRow: true, speakShort: true });
      stepB++;
      state.playRowTimer = setTimeout(playStep, 1950);
    }

    playStep();
  }

  /* 將積數格式化為具備十位/個位語意色彩的 HTML */
  function formatProductPlaceHtml(product){
    if(product < 10){
      return '<span class="digit-o">' + product + '</span>';
    }
    var t = Math.floor(product / 10);
    var o = product % 10;
    return '<span class="digit-t" style="color:var(--t-color-dark);">' + t + '</span>' +
           '<span class="digit-o" style="color:var(--o-color-dark);">' + o + '</span>';
  }

  /* 渲染 9x9 九九乘法百寶矩陣 */
  function renderTableGrid(){
    if(!els.tableGrid) return;
    var html = '';

    // 左上角 × 標記格
    html += '<div class="mul-cell mul-corner" aria-hidden="true">×</div>';

    // 頂部乘數標題列 (×1 ~ ×9)
    for(var col = 1; col <= 9; col++){
      var activeColCls = (col === state.b) ? ' active-header' : '';
      html += '<button type="button" class="mul-cell mul-th-col' + activeColCls + '" data-col-head="' + col + '" title="選擇乘數 ' + col + '（共 ' + col + ' 組）">×' + col + '</button>';
    }

    // 1~9 列內容
    for(var row = 1; row <= 9; row++){
      var activeRowCls = (row === state.a) ? ' active-header' : '';
      html += '<button type="button" class="mul-cell mul-th-row' + activeRowCls + '" data-row-head="' + row + '" title="選擇被乘數 ' + row + '（每組 ' + row + ' 個）">' + row + '</button>';

      for(var c = 1; c <= 9; c++){
        var prod = row * c;
        var key = row + 'x' + c;
        var isSelected = (row === state.a && c === state.b);
        var inArea = (row <= state.a && c <= state.b);
        var inCross = (!isSelected && (row === state.a || c === state.b));
        var isMasked = state.maskMode && !state.revealedMap[key];

        var cls = 'mul-cell';
        if(inArea) cls += ' in-area';
        if(inCross) cls += ' in-cross';
        if(isSelected) cls += ' is-selected';
        if(isMasked) cls += ' is-masked';

        var displayVal = isMasked ? '?' : String(prod);
        var label = row + ' 乘以 ' + c + (isMasked ? '（點擊翻開答案）' : (' 等於 ' + prod));

        html += '<button type="button" class="' + cls + '" data-a="' + row + '" data-b="' + c + '" aria-label="' + label + '">' + displayVal + '</button>';
      }
    }

    els.tableGrid.innerHTML = html;
  }

  /* 渲染右側口訣英雄卡與雙模式具體表徵 */
  function renderVisualStage(){
    var a = state.a;
    var b = state.b;
    var p = a * b;
    var mantra = getMantra(a, b);
    var currentKey = a + 'x' + b;
    var isCurrentHidden = state.maskMode && !state.revealedMap[currentKey];

    // 更新段別快選按鈕狀態
    if(els.rowPillsWrap){
      var pills = els.rowPillsWrap.querySelectorAll('.mul-row-pill');
      for(var i = 0; i < pills.length; i++){
        var rVal = Number(pills[i].getAttribute('data-row'));
        pills[i].classList.toggle('active', rVal === a);
        pills[i].setAttribute('aria-pressed', String(rVal === a));
      }
    }

    // 更新被乘數/乘數步進器
    if(els.valA) els.valA.textContent = String(a);
    if(els.valB) els.valB.textContent = String(b);
    if(els.minusA) els.minusA.disabled = (a <= 1);
    if(els.plusA)  els.plusA.disabled  = (a >= 9);
    if(els.minusB) els.minusB.disabled = (b <= 1);
    if(els.plusB)  els.plusB.disabled  = (b >= 9);

    // 更新面積說明小字
    if(els.areaNote){
      els.areaNote.innerHTML = '💡 表格左上角黃色區域正好框出 <b>' + a + ' 列 × ' + b + ' 行 ＝ ' + (isCurrentHidden ? '?' : p) + ' 格</b>！';
    }

    // 更新英雄算式與口訣卡
    if(els.equationBig){
      els.equationBig.innerHTML =
        '<span class="mul-eq-a" title="被乘數（每組幾個）">' + a + '</span>' +
        '<span>×</span>' +
        '<span class="mul-eq-b" title="乘數（共有幾組）">' + b + '</span>' +
        '<span>＝</span>' +
        '<span class="mul-eq-ans" title="乘積">' + (isCurrentHidden ? '<span style="color:var(--brand-amber-dark);">?</span>' : formatProductPlaceHtml(p)) + '</span>';
    }

    if(els.mantraPill){
      els.mantraPill.textContent = isCurrentHidden
        ? ('口訣：' + cnDigits[a] + cnDigits[b] + ' ❓（點擊格子揭曉）')
        : ('口訣：' + mantra);
    }

    if(els.meaningPill){
      els.meaningPill.textContent = '每組 ' + a + ' 個，共 ' + b + ' 組（' + a + ' 的 ' + b + ' 倍）';
    }

    // 1. 渲染「幾個幾」分組連加積木盒
    if(els.groupsBoxSub){
      els.groupsBoxSub.textContent = '每盤裝 ' + a + ' 個小白積木，共有 ' + b + ' 盤';
    }

    if(els.groupsContainer){
      var traysHtml = '';
      for(var g = 1; g <= b; g++){
        traysHtml += '<div class="mul-group-tray">';
        traysHtml += '  <span class="mul-group-tray-head">第 ' + g + ' 組 (' + a + '個)</span>';
        traysHtml += '  <div class="mul-group-tray-blocks">';
        for(var u = 0; u < a; u++){
          traysHtml += MathApp.utils.blockGlyph('o');
        }
        traysHtml += '  </div>';
        traysHtml += '</div>';
      }
      els.groupsContainer.innerHTML = traysHtml;
    }

    if(els.repeatedAddBar){
      var addTerms = [];
      for(var k = 0; k < b; k++){
        addTerms.push(a);
      }
      var addFormula = addTerms.join(' ＋ ');
      els.repeatedAddBar.innerHTML =
        '<span>➕ <b>連加算式：</b>' + addFormula + ' ＝ <b style="color:var(--brand-coral);">' + (isCurrentHidden ? '?' : p) + '</b></span>' +
        '<span style="color:var(--ink-soft);">（' + b + ' 個 ' + a + ' 相加）</span>';
    }

    // 2. 渲染方陣跳數點陣與十進位積木合成
    if(els.miniArray){
      var arrHtml = '';
      for(var r = 1; r <= b; r++){
        arrHtml += '<div class="mul-array-row">';
        for(var dot = 1; dot <= a; dot++){
          arrHtml += '<span class="mul-array-dot"></span>';
        }
        var rowCum = a * r;
        arrHtml += '<span class="mul-array-row-sum">➔ ' + (isCurrentHidden && r === b ? '?' : rowCum) + '</span>';
        arrHtml += '</div>';
      }
      els.miniArray.innerHTML = arrHtml;
    }

    if(els.base10Stage){
      var tens = Math.floor(p / 10);
      var ones = p % 10;
      if(isCurrentHidden){
        els.base10Stage.innerHTML =
          '<div style="font-size:13.5px;color:var(--ink-soft);font-weight:700;padding:8px 0;">🫣 目前為遮蓋背誦模式，點擊左側表格的「?」格即可揭曉十進位積木合成結果！</div>';
      } else {
        var b10Html = '<div style="font-size:12.5px;font-weight:800;color:var(--ink-soft);margin-bottom:4px;">' +
          '共 <b>' + p + '</b> 個一 ➔ 每滿 10 個一自動捆成 1 條十：' +
          '</div>';
        b10Html += '<div class="mul-base10-blocks">';
        if(tens > 0){
          b10Html += '<div class="mul-base10-col">' +
            '<span class="mul-base10-tag t-tag">十位 (' + tens + ' 條十 = ' + (tens * 10) + ')</span>' +
            '<div>' + MathApp.renderGroupedBlocksHtml('t', tens) + '</div>' +
            '</div>';
        }
        b10Html += '<div class="mul-base10-col">' +
          '<span class="mul-base10-tag o-tag">個位 (' + ones + ' 個一 = ' + ones + ')</span>' +
          '<div>' + (ones > 0 ? MathApp.renderGroupedBlocksHtml('o', ones) : '<span style="font-size:13px;color:var(--ink-soft);font-weight:800;">0 個一</span>') + '</div>' +
          '</div>';
        b10Html += '</div>';
        els.base10Stage.innerHTML = b10Html;
      }
    }
  }

  /* 設定被乘數 a 與乘數 b */
  function setFactors(a, b, opts){
    opts = opts || {};
    if(!opts.silentStopRow){
      stopRowPlayback();
    }
    state.a = Math.max(1, Math.min(9, Number(a) || 1));
    state.b = Math.max(1, Math.min(9, Number(b) || 1));

    renderTableGrid();
    renderVisualStage();

    if(opts.speak){
      if(MathApp.speak) MathApp.speak(getSpokenExplanation(state.a, state.b, false));
    } else if(opts.speakShort){
      if(MathApp.speak) MathApp.speak(getSpokenExplanation(state.a, state.b, true));
    }
  }

  /* 交換律對照 (a × b ⇄ b × a) */
  function swapCommutative(){
    stopRowPlayback();
    var oldA = state.a;
    var oldB = state.b;
    if(oldA === oldB){
      if(MathApp.sfx) MathApp.sfx('click');
      var sameMsg = oldA + ' × ' + oldB + ' 兩個數字相同，交換後還是 ' + oldA + ' × ' + oldB + ' ＝ ' + (oldA * oldB) + ' 喔！';
      if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast(sameMsg);
      if(MathApp.speak) MathApp.speak(sameMsg);
      return;
    }

    state.a = oldB;
    state.b = oldA;
    if(state.maskMode){
      state.revealedMap[state.a + 'x' + state.b] = true;
    }

    renderTableGrid();
    renderVisualStage();

    if(MathApp.sfx) MathApp.sfx('bundle');
    var prod = state.a * state.b;
    var msg = '⇄ 交換律發現：' + oldA + '×' + oldB + '（' + oldB + '組' + oldA + '）和 ' + state.a + '×' + state.b + '（' + state.b + '組' + state.a + '）總數都是 ' + prod + '！';
    if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast(msg);
    if(MathApp.speak){
      MathApp.speak(getMantra(state.a, state.b) + '！交換位置後，' + state.a + ' 乘以 ' + state.b + ' 答案一樣是 ' + prod + '！');
    }
  }

  /* 切換遮蓋背誦模式 */
  function toggleMaskMode(forceState){
    stopRowPlayback();
    state.maskMode = (typeof forceState === 'boolean') ? forceState : !state.maskMode;
    state.revealedMap = {};

    if(els.maskToggleBtn){
      els.maskToggleBtn.classList.toggle('active-mode', state.maskMode);
      els.maskToggleBtn.setAttribute('aria-pressed', String(state.maskMode));
      els.maskToggleBtn.innerHTML = state.maskMode
        ? '<i data-lucide="eye"></i><span>遮蓋背誦：開啟中（點格子翻牌）</span>'
        : '<i data-lucide="eye-off"></i><span>遮蓋背誦模式</span>';
    }
    if(els.maskResetBtn){
      els.maskResetBtn.style.display = state.maskMode ? 'inline-flex' : 'none';
    }
    if(MathApp.refreshIcons) MathApp.refreshIcons();

    renderTableGrid();
    renderVisualStage();

    if(MathApp.sfx) MathApp.sfx('click');
    var msg = state.maskMode
      ? '已開啟遮蓋背誦模式！先在心裡默念口訣，再點擊「?」格翻開對答案！'
      : '已恢復完整顯示模式';
    if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast(msg);
  }

  /* 初始化事件監聽 */
  function bindEvents(){
    // 1~9 段別快選列
    if(els.rowPillsWrap){
      els.rowPillsWrap.addEventListener('click', function(e){
        var btn = e.target.closest('.mul-row-pill[data-row]');
        if(!btn) return;
        var row = Number(btn.getAttribute('data-row'));
        if(MathApp.sfx) MathApp.sfx('pop');
        if(state.maskMode){
          state.revealedMap[row + 'x' + state.b] = true;
        }
        setFactors(row, state.b, { speakShort: true });
      });
    }

    // 整段口訣連播
    if(els.playRowBtn){
      els.playRowBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        toggleRowPlayback();
      });
    }

    // 交換律對照
    if(els.swapBtn){
      els.swapBtn.addEventListener('click', swapCommutative);
    }

    // 遮蓋背誦模式切換
    if(els.maskToggleBtn){
      els.maskToggleBtn.addEventListener('click', function(){
        toggleMaskMode();
      });
    }

    // 重新全部遮蓋按鈕
    if(els.maskResetBtn){
      els.maskResetBtn.addEventListener('click', function(){
        state.revealedMap = {};
        if(MathApp.sfx) MathApp.sfx('click');
        renderTableGrid();
        renderVisualStage();
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('已重新遮蓋所有格子，再挑戰一次吧！');
        }
      });
    }

    // 被乘數 a 與乘數 b 的 + / - 按鈕
    if(els.minusA){
      els.minusA.addEventListener('click', function(){
        if(state.a > 1){
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(state.a - 1, state.b, { speakShort: true });
        }
      });
    }
    if(els.plusA){
      els.plusA.addEventListener('click', function(){
        if(state.a < 9){
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(state.a + 1, state.b, { speakShort: true });
        }
      });
    }
    if(els.minusB){
      els.minusB.addEventListener('click', function(){
        if(state.b > 1){
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(state.a, state.b - 1, { speakShort: true });
        }
      });
    }
    if(els.plusB){
      els.plusB.addEventListener('click', function(){
        if(state.b < 9){
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(state.a, state.b + 1, { speakShort: true });
        }
      });
    }

    // 9x9 乘法表網格點擊代理
    if(els.tableGrid){
      els.tableGrid.addEventListener('click', function(e){
        var cell = e.target.closest('button.mul-cell');
        if(!cell) return;

        if(cell.hasAttribute('data-row-head')){
          var r = Number(cell.getAttribute('data-row-head'));
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(r, state.b, { speakShort: true });
          return;
        }

        if(cell.hasAttribute('data-col-head')){
          var c = Number(cell.getAttribute('data-col-head'));
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(state.a, c, { speakShort: true });
          return;
        }

        if(cell.hasAttribute('data-a') && cell.hasAttribute('data-b')){
          var a = Number(cell.getAttribute('data-a'));
          var b = Number(cell.getAttribute('data-b'));
          var key = a + 'x' + b;
          if(state.maskMode){
            state.revealedMap[key] = true;
          }
          if(MathApp.sfx) MathApp.sfx('pop');
          setFactors(a, b, { speakShort: true });
        }
      });
    }

    // 朗讀目前算式與口訣完整解說
    if(els.speakCurrentBtn){
      els.speakCurrentBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(state.maskMode){
          state.revealedMap[state.a + 'x' + state.b] = true;
          renderTableGrid();
          renderVisualStage();
        }
        if(MathApp.speak){
          MathApp.speak(getSpokenExplanation(state.a, state.b, false));
        }
      });
    }

    // 切換離開單元或子分頁時自動停止連播
    if(MathApp.on){
      MathApp.on('tabChange', function(tab){
        if(tab !== 'mul') stopRowPlayback();
      });
      MathApp.on('subTabChange', function(info){
        if(info && info.unit === 'mul' && info.subTab !== 'learn'){
          stopRowPlayback();
        }
      });
    }
  }

  function init(){
    cacheDom();
    if(!els.tableGrid) return;
    bindEvents();
    setFactors(3, 4, { silentStopRow: true });
  }

  MathApp.mul = {
    init: init,
    getState: function(){
      return {
        a: state.a,
        b: state.b,
        product: state.a * state.b,
        maskMode: state.maskMode
      };
    },
    setFactors: setFactors,
    getMantra: getMantra,
    swapCommutative: swapCommutative,
    toggleMaskMode: toggleMaskMode
  };

})();
