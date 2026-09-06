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

  /* 彩帶粒子動畫 (Canvas Confetti / DOM Fallback) */
  var CONFETTI_COLORS = ['#e8604c','#2e9e82','#ec9a1e','#2b6ef2','#f57cdc','#a259f7','#fbbf24'];
  function launchConfetti(isGrand){
    if(prefersReduced) return;
    if(typeof window.confetti === 'function'){
      var count = isGrand ? 100 : 55;
      window.confetti({
        particleCount: count,
        spread: isGrand ? 90 : 65,
        origin: { y: 0.65 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true
      });
      if(isGrand){
        setTimeout(function(){
          window.confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: CONFETTI_COLORS
          });
          window.confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: CONFETTI_COLORS
          });
        }, 200);
      }
      return;
    }
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

  /* 向量圖標動態刷新 (Lucide) */
  function refreshIcons(){
    if(typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function'){
      window.lucide.createIcons();
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

  /* ---------------- SVG 向量教具積木產生器 (高解析、擬真刻度) ---------------- */
  function getBlockSvg(kind){
    if(kind === 'o'){
      return '<svg class="svg-blk svg-blk-o" viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9.5" fill="url(#svg-grad-o)" stroke="#78350f" stroke-width="1"/>' +
        '<ellipse cx="9" cy="8" rx="3.2" ry="1.8" fill="#ffffff" opacity="0.65" transform="rotate(-25 9 8)"/>' +
      '</svg>';
    }

    if(kind === 't'){
      // 10 等分刻度的長條棒
      var lines = '';
      for(var i = 1; i <= 9; i++){
        var x = i * 10;
        lines += '<line x1="' + x + '" y1="1" x2="' + x + '" y2="21" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1"/>' +
                 '<line x1="' + (x + 0.8) + '" y1="1" x2="' + (x + 0.8) + '" y2="21" stroke="#000000" stroke-opacity="0.25" stroke-width="0.8"/>';
      }
      return '<svg class="svg-blk svg-blk-t" viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">' +
        '<rect x="1" y="1" width="98" height="20" rx="3.5" fill="url(#svg-grad-t)" stroke="#134e4a" stroke-width="1.2"/>' +
        lines +
        '<rect x="1.5" y="1.5" width="97" height="3" rx="1.5" fill="#ffffff" opacity="0.3"/>' +
      '</svg>';
    }

    if(kind === 'h'){
      // 10x10 = 100 個細格的百格板
      var gridLines = '';
      for(var j = 1; j <= 9; j++){
        var pos = j * 10;
        // 垂直線
        gridLines += '<line x1="' + pos + '" y1="2" x2="' + pos + '" y2="98" stroke="#ffffff" stroke-opacity="0.3" stroke-width="0.8"/>' +
                     '<line x1="' + (pos + 0.6) + '" y1="2" x2="' + (pos + 0.6) + '" y2="98" stroke="#000000" stroke-opacity="0.2" stroke-width="0.6"/>';
        // 水平線
        gridLines += '<line x1="2" y1="' + pos + '" x2="98" y2="' + pos + '" stroke="#ffffff" stroke-opacity="0.3" stroke-width="0.8"/>' +
                     '<line x1="2" y1="' + (pos + 0.6) + '" x2="98" y2="' + (pos + 0.6) + '" stroke="#000000" stroke-opacity="0.2" stroke-width="0.6"/>';
      }
      return '<svg class="svg-blk svg-blk-h" viewBox="0 0 100 100" aria-hidden="true">' +
        '<rect x="2" y="2" width="96" height="96" rx="5" fill="url(#svg-grad-h)" stroke="#1e3a8a" stroke-width="1.5"/>' +
        gridLines +
        '<rect x="3" y="3" width="94" height="94" rx="4" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>' +
      '</svg>';
    }

    if(kind === 'th'){
      // Isometric 3D 等角軸測大立方體 (呈現 10 片百格板層疊)
      var leftLayers = '';
      var rightLayers = '';
      for(var k = 1; k <= 9; k++){
        var dy = k * 4.4; // 10 層層疊刻度
        leftLayers += '<line x1="6" y1="' + (28 + dy) + '" x2="50" y2="' + (50 + dy) + '" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.7"/>';
        rightLayers += '<line x1="50" y1="' + (50 + dy) + '" x2="94" y2="' + (28 + dy) + '" stroke="#ffffff" stroke-opacity="0.18" stroke-width="0.7"/>';
      }
      // 頂面格線
      var topLines = '';
      for(var m = 1; m <= 4; m++){
        var frac = m * 0.2;
        // 沿著頂面菱形繪製刻度
        var x1 = 50 + (94 - 50) * frac, y1 = 6 + (28 - 6) * frac;
        var x2 = 6 + (50 - 6) * frac,   y2 = 28 + (50 - 28) * frac;
        topLines += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.6"/>';
        var x3 = 50 - (50 - 6) * frac,  y3 = 6 + (28 - 6) * frac;
        var x4 = 94 - (94 - 50) * frac, y4 = 28 + (50 - 28) * frac;
        topLines += '<line x1="' + x3 + '" y1="' + y3 + '" x2="' + x4 + '" y2="' + y4 + '" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.6"/>';
      }

      return '<svg class="svg-blk svg-blk-th" viewBox="0 0 100 100" aria-hidden="true">' +
        // 頂面
        '<polygon points="50,6 94,28 50,50 6,28" fill="url(#svg-grad-th-top)" stroke="#581c87" stroke-width="1.2"/>' +
        topLines +
        // 左立面
        '<polygon points="6,28 50,50 50,94 6,72" fill="url(#svg-grad-th-left)" stroke="#581c87" stroke-width="1.2"/>' +
        leftLayers +
        // 右立面
        '<polygon points="50,50 94,28 94,72 50,94" fill="url(#svg-grad-th-right)" stroke="#3b0764" stroke-width="1.2"/>' +
        rightLayers +
        // 高光稜線
        '<line x1="50" y1="50" x2="50" y2="94" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.2"/>' +
        '<line x1="6" y1="28" x2="50" y2="50" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>' +
        '<line x1="50" y1="50" x2="94" y2="28" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>' +
      '</svg>';
    }

    return '';
  }

  /* ---------------- 共用積木圖示渲染 (支援 5 個一組分組鷹架與 SVG 向量) ---------------- */
  function blockGlyph(kind){
    var cls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
    return '<span class="blk ' + cls + '" data-kind="' + kind + '">' + getBlockSvg(kind) + '</span>';
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

  /* 將靜態 HTML 內未注入 SVG 的 .blk 進行自動升級 */
  function upgradeDomBlocks(){
    var emptyBlks = document.querySelectorAll('.blk:empty');
    for(var i = 0; i < emptyBlks.length; i++){
      var el = emptyBlks[i];
      var k = el.classList.contains('blk-th') ? 'th' :
              el.classList.contains('blk-h')  ? 'h'  :
              el.classList.contains('blk-t')  ? 't'  :
              el.classList.contains('blk-o')  ? 'o'  : null;
      if(k){
        el.setAttribute('data-kind', k);
        el.innerHTML = getBlockSvg(k);
      }
    }
  }

  // DOM 載入後自動升級既有靜態積木
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', upgradeDomBlocks);
  } else {
    upgradeDomBlocks();
  }

  MathApp.utils = {
    randInt: randInt,
    formatTime: formatTime,
    numberToChinese: numberToChinese,
    launchConfetti: launchConfetti,
    refreshIcons: refreshIcons,
    showToast: showToast,
    goodMsgs: goodMsgs,
    badMsgs: badMsgs,
    pickRandomPraise: function(){
      return goodMsgs[Math.floor(Math.random() * goodMsgs.length)];
    },
    pickRandomEncouragement: function(){
      return badMsgs[Math.floor(Math.random() * badMsgs.length)];
    },
    getBlockSvg: getBlockSvg,
    blockGlyph: blockGlyph,
    renderGroupedBlocksHtml: renderGroupedBlocksHtml,
    renderBlocks: renderBlocks,
    upgradeDomBlocks: upgradeDomBlocks
  };

  // 掛載常用函式至 MathApp 捷徑
  MathApp.randInt = randInt;
  MathApp.numberToChinese = numberToChinese;
  MathApp.renderBlocks = renderBlocks;
  MathApp.renderGroupedBlocksHtml = renderGroupedBlocksHtml;
  MathApp.refreshIcons = refreshIcons;

})();
