/**
 * ==========================================================================
 * 共用工具函式、中文數字轉換、彩帶動畫與積木渲染 (UTILS)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 亂數整數生成器 (包含 min 與 max) */
  function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* 秒數格式化為 mm:ss */
  function formatTime(seconds){
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  /* 中文數字轉換演算法 (嚴格遵循臺灣國小數學記數規則) */
  var cnDigits = ['零','一','二','三','四','五','六','七','八','九'];
  function numberToChinese(n){
    if(n === 0) return '零';
    var th = Math.floor(n / 1000);
    var remTh = n % 1000;
    var h = Math.floor(remTh / 100);
    var remH = remTh % 100;
    var t = Math.floor(remH / 10);
    var o = remH % 10;
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

  /* 答題回饋語句庫 */
  var goodMsgs = ['答對了，太棒了！', '沒錯，就是這樣！', '完全正確，繼續加油！', '答對囉，你抓到訣竅了！'];
  var badMsgs  = ['再想想看，你可以的！', '有點小誤會，看看正確答案吧！', '差一點點，繼續挑戰！'];

  /* 彩帶粒子動畫 (Confetti) */
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
        var sz = 7 + Math.random() * 8;
        piece.style.width = sz + 'px';
        piece.style.height = sz + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(piece);
        setTimeout(function(){ piece.remove(); }, (dur + 0.35) * 1000);
      })();
    }
  }

  /* 提示訊息小膠囊 (Toast) */
  var toastEl = document.getElementById('carry-toast');
  var toastTimer = null;
  function showToast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 1700);
  }

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
      for(var i = 0; i < gSize; i++){ html += blockGlyph(kind); }
      html += '</div>';
      rem -= gSize;
    }
    return html;
  }

  function renderBlocks(container, kind, count){
    if(!container) return;
    container.innerHTML = renderGroupedBlocksHtml(kind, count);
  }

  MathApp.utils = {
    randInt: randInt,
    formatTime: formatTime,
    numberToChinese: numberToChinese,
    launchConfetti: launchConfetti,
    showToast: showToast,
    goodMsgs: goodMsgs,
    badMsgs: badMsgs,
    blockGlyph: blockGlyph,
    renderGroupedBlocksHtml: renderGroupedBlocksHtml,
    renderBlocks: renderBlocks
  };

  // 掛載常用函式至 MathApp 捷徑
  MathApp.randInt = randInt;
  MathApp.numberToChinese = numberToChinese;
  MathApp.renderBlocks = renderBlocks;
  MathApp.renderGroupedBlocksHtml = renderGroupedBlocksHtml;

})();
