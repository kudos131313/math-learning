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

  /* 阿拉伯數字轉臺灣國小口語讀法 (支援 0 ~ 99999)
   * 嚴格落實臺灣小學口語讀法規範：
   * 1. 「兩」與「二」：百位、千位、萬位若為 2 讀作「兩」；十位、個位讀作「二」
   * 2. 中間零之補位：如 203 讀「兩百零三」、2050 讀「兩千零五十」（連續零壓縮只補一個零，末尾零不補）
   * 3. 10 ~ 19 省略「一」：如 15 讀「十五」，但在百位之後需讀出，如 215 讀「兩百一十五」
   * 4. 純 0 讀作「零」
   */
  function numberToTaiwanSpokenText(num){
    var n = Number(num);
    if(isNaN(n)) return String(num);
    if(n === 0) return '零';

    var digits = ['零','一','二','三','四','五','六','七','八','九'];
    var w  = Math.floor(n / 10000);        // 萬位
    var remW = n % 10000;
    var th = Math.floor(remW / 1000);      // 千位
    var remTh = remW % 1000;
    var h  = Math.floor(remTh / 100);       // 百位
    var remH  = remTh % 100;
    var t  = Math.floor(remH / 10);        // 十位
    var o  = remH % 10;                    // 個位

    var res = '';

    // 萬位 (2 讀「兩」)
    if(w > 0){
      res += (w === 2 ? '兩' : digits[w]) + '萬';
    }

    // 千位 (2 讀「兩」)
    if(th > 0){
      res += (th === 2 ? '兩' : digits[th]) + '千';
    } else if(w > 0 && (h > 0 || t > 0 || o > 0)){
      res += '零';
    }

    // 百位 (2 讀「兩」)
    if(h > 0){
      res += (h === 2 ? '兩' : digits[h]) + '百';
    } else if((w > 0 || th > 0) && (t > 0 || o > 0) && !res.endsWith('零')){
      res += '零';
    }

    // 十位 (永遠讀「二」)
    if(t > 0){
      if(t === 1 && w === 0 && th === 0 && h === 0){
        // 10 ~ 19 開頭省略「一」，讀作「十」
        res += '十';
      } else {
        res += digits[t] + '十';
      }
    } else if((w > 0 || th > 0 || h > 0) && o > 0 && !res.endsWith('零')){
      res += '零';
    }

    // 個位 (永遠讀「二」)
    if(o > 0){
      res += digits[o];
    }

    return res;
  }

  /* 算式整合替換函式：使用正規表達式將字串中的運算符號與所有獨立數字替換為臺灣口語文字 */
  function formatSpokenMathText(text){
    if(typeof text === 'number'){
      return numberToTaiwanSpokenText(text);
    }
    if(typeof text !== 'string') return text;

    return text
      // 1. 算式運算符號口語化（加入標點或空格提升語音合成停頓節奏）
      .replace(/\s*\+\s*/g, ' 加 ')
      .replace(/\s*-\s*/g, ' 減 ')
      .replace(/\s*[×*]\s*/g, ' 乘以 ')
      .replace(/\s*[÷/]\s*/g, ' 除以 ')
      .replace(/\s*=\s*/g, ' 等於 ')
      // 2. 匹配所有獨立阿拉伯數字並自動替換為口語讀法
      .replace(/\d+/g, function(match){
        return numberToTaiwanSpokenText(match);
      })
      // 3. 中文國字正音修補（防止外部呼叫傳入傳統書面國字如「二百...」、「二千...」）
      .replace(/二百/g, '兩百')
      .replace(/二千/g, '兩千')
      .replace(/(^|[^十\d一二三四五六七八九])二萬/g, function(m, p1){ return p1 + '兩萬'; });
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

  /* ---------------- SVG 向量教具積木產生器 (高解析、擬真刻度、課本教具造型) ---------------- */
  function getBlockSvg(kind){
    if(kind === 'o'){
      // 課本小白積木（微等角軸測 3D 立體小方塊）
      return '<svg class="svg-blk svg-blk-o" viewBox="0 0 24 24" aria-hidden="true">' +
        '<polygon points="3,8 7,3 20,3 16,8" fill="url(#svg-grad-o-top)" stroke="#64748b" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<polygon points="16,8 20,3 20,16 16,21" fill="url(#svg-grad-o-side)" stroke="#64748b" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<polygon points="3,8 16,8 16,21 3,21" fill="url(#svg-grad-o-front)" stroke="#64748b" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<line x1="4.2" y1="9.2" x2="15" y2="9.2" stroke="#ffffff" stroke-opacity="0.85" stroke-width="0.8"/>' +
      '</svg>';
    }

    if(kind === 't'){
      // 課本立體 10 等分長條棒（暖橘色，微等角軸測 3D 立體長條）
      var frontLines = '';
      var topLines = '';
      for(var i = 1; i <= 9; i++){
        var fx = 3 + i * 9.6;
        var tx1 = fx;
        var tx2 = 7 + i * 9.6;
        // 正面刻度線 (亮色高光 + 深橘紅陰影刻度)
        frontLines += '<line x1="' + fx + '" y1="8" x2="' + fx + '" y2="22" stroke="#ffedd5" stroke-opacity="0.55" stroke-width="0.8"/>' +
                      '<line x1="' + (fx + 0.6) + '" y1="8" x2="' + (fx + 0.6) + '" y2="22" stroke="#7c2d12" stroke-opacity="0.32" stroke-width="0.6"/>';
        // 頂面刻度線
        topLines += '<line x1="' + tx1 + '" y1="8" x2="' + tx2 + '" y2="3" stroke="#ffedd5" stroke-opacity="0.65" stroke-width="0.7"/>' +
                    '<line x1="' + (tx1 + 0.5) + '" y1="8" x2="' + (tx2 + 0.5) + '" y2="3" stroke="#9a3412" stroke-opacity="0.3" stroke-width="0.5"/>';
      }
      return '<svg class="svg-blk svg-blk-t" viewBox="0 0 106 25" preserveAspectRatio="none" aria-hidden="true">' +
        // 頂面 (Top)
        '<polygon points="3,8 7,3 103,3 99,8" fill="url(#svg-grad-t-top)" stroke="#9a3412" stroke-width="1.1" stroke-linejoin="round"/>' +
        topLines +
        // 右側面 (Side)
        '<polygon points="99,8 103,3 103,17 99,22" fill="url(#svg-grad-t-side)" stroke="#9a3412" stroke-width="1.1" stroke-linejoin="round"/>' +
        // 正面 (Front)
        '<polygon points="3,8 99,8 99,22 3,22" fill="url(#svg-grad-t-front)" stroke="#9a3412" stroke-width="1.1" stroke-linejoin="round"/>' +
        frontLines +
        // 正面頂部細高光
        '<line x1="3.8" y1="9" x2="98.2" y2="9" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.8"/>' +
      '</svg>';
    }

    if(kind === 'h'){
      // 課本立體 10x10 百格板（水藍色，微等角軸測 3D 立體薄方板）
      var frontLines = '';
      var topLines = '';
      var sideLines = '';
      for(var j = 1; j <= 9; j++){
        var pos = 3 + j * 9.2;
        var tStart = pos;
        var tEnd = 7 + j * 9.2;
        var sStart = 12 + j * 9.2;
        var sEnd = 7 + j * 9.2;
        // 正面垂直網格線
        frontLines += '<line x1="' + pos + '" y1="12" x2="' + pos + '" y2="104" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8"/>' +
                      '<line x1="' + (pos + 0.6) + '" y1="12" x2="' + (pos + 0.6) + '" y2="104" stroke="#1d4ed8" stroke-opacity="0.35" stroke-width="0.6"/>';
        // 正面水平網格線
        frontLines += '<line x1="3" y1="' + (12 + j * 9.2) + '" x2="95" y2="' + (12 + j * 9.2) + '" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8"/>' +
                      '<line x1="3" y1="' + (12 + j * 9.2 + 0.6) + '" x2="95" y2="' + (12 + j * 9.2 + 0.6) + '" stroke="#1d4ed8" stroke-opacity="0.35" stroke-width="0.6"/>';
        // 頂面厚度分格線
        topLines += '<line x1="' + tStart + '" y1="12" x2="' + tEnd + '" y2="7" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.7"/>' +
                    '<line x1="' + (tStart + 0.5) + '" y1="12" x2="' + (tEnd + 0.5) + '" y2="7" stroke="#1d4ed8" stroke-opacity="0.3" stroke-width="0.5"/>';
        // 右側面厚度分層線
        sideLines += '<line x1="95" y1="' + sStart + '" x2="99" y2="' + sEnd + '" stroke="#ffffff" stroke-opacity="0.4" stroke-width="0.7"/>' +
                     '<line x1="95" y1="' + (sStart + 0.5) + '" x2="99" y2="' + (sEnd + 0.5) + '" stroke="#1e3a8a" stroke-opacity="0.3" stroke-width="0.5"/>';
      }
      return '<svg class="svg-blk svg-blk-h" viewBox="0 0 102 107" aria-hidden="true">' +
        // 頂面 (Top)
        '<polygon points="3,12 7,7 99,7 95,12" fill="url(#svg-grad-h-top)" stroke="#1d4ed8" stroke-width="1.1" stroke-linejoin="round"/>' +
        topLines +
        // 右側面 (Side)
        '<polygon points="95,12 99,7 99,99 95,104" fill="url(#svg-grad-h-side)" stroke="#1d4ed8" stroke-width="1.1" stroke-linejoin="round"/>' +
        sideLines +
        // 正面 (Front)
        '<polygon points="3,12 95,12 95,104 3,104" fill="url(#svg-grad-h-front)" stroke="#1d4ed8" stroke-width="1.1" stroke-linejoin="round"/>' +
        frontLines +
        // 正面頂部細高光
        '<line x1="3.5" y1="12.8" x2="94.5" y2="12.8" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.8"/>' +
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

  /* ====================================================================
   * 共用虛擬數字鍵盤工廠函式
   * createNumpad(containerId, onKey, opts)
   *   containerId {string}   - 鍵盤外殼元素的 id（需已存在於 DOM）
   *   onKey       {function} - 按鍵回呼，接收標準 key 值：
   *                            '0'~'9' | 'backspace' | 'clear' | 'enter'
   *   opts        {object}   - 選項設定
   *     hasEnter  {boolean}  - 是否顯示確認鍵（預設 true）
   *     hasClear  {boolean}  - 是否顯示全清鍵（預設 false）
   *     enterLabel {string}  - 確認鍵文字（預設 '確認'）
   * ==================================================================== */
  function createNumpad(containerId, onKey, opts){
    var container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;
    if(!container || !onKey) return;

    opts = opts || {};
    var hasEnter = opts.hasEnter !== false;  // 預設 true
    var hasClear = !!opts.hasClear;           // 預設 false
    var enterLabel = opts.enterLabel || '確認';

    // 清空並加上統一 class（不強制覆蓋 id）
    container.className = (container.className || '') + ' virtual-keypad';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', '數字輸入鍵盤');

    // 格子容器
    var grid = document.createElement('div');
    grid.className = 'keypad-grid';

    // 產生 1~9 數字鍵
    for(var n = 1; n <= 9; n++){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num-key';
      btn.setAttribute('data-key', String(n));
      btn.textContent = String(n);
      grid.appendChild(btn);
    }

    // 底列左：清除 or 退格
    var leftBtn = document.createElement('button');
    leftBtn.type = 'button';
    if(hasClear){
      // 全清鍵（單元2需求）
      leftBtn.className = 'num-key func-key';
      leftBtn.setAttribute('data-key', 'clear');
      leftBtn.setAttribute('aria-label', '全部清除');
      leftBtn.innerHTML = '<i data-lucide="x-circle"></i><span>清除</span>';
    } else {
      // 退格鍵（單元1/3風格）
      leftBtn.className = 'num-key func-key';
      leftBtn.setAttribute('data-key', 'backspace');
      leftBtn.setAttribute('aria-label', '退格清除');
      leftBtn.innerHTML = '<i data-lucide="delete"></i><span>退格</span>';
    }
    grid.appendChild(leftBtn);

    // 底列中：0 鍵
    var zeroBtn = document.createElement('button');
    zeroBtn.type = 'button';
    zeroBtn.className = 'num-key';
    zeroBtn.setAttribute('data-key', '0');
    zeroBtn.textContent = '0';
    grid.appendChild(zeroBtn);

    // 底列右：確認 or 退格（無全清時）
    if(hasEnter){
      var enterBtn = document.createElement('button');
      enterBtn.type = 'button';
      enterBtn.className = 'num-key enter-key';
      enterBtn.setAttribute('data-key', 'enter');
      enterBtn.setAttribute('aria-label', enterLabel);
      enterBtn.innerHTML = '<i data-lucide="check"></i><span>' + enterLabel + '</span>';
      grid.appendChild(enterBtn);
    } else {
      // 無確認鍵時，底列右改放退格鍵
      var delBtn2 = document.createElement('button');
      delBtn2.type = 'button';
      delBtn2.className = 'num-key func-key';
      delBtn2.setAttribute('data-key', 'backspace');
      delBtn2.setAttribute('aria-label', '退格清除');
      delBtn2.innerHTML = '<i data-lucide="delete"></i><span>退格</span>';
      grid.appendChild(delBtn2);
    }

    container.appendChild(grid);

    // 事件代理：一個監聽器處理全部按鍵
    container.addEventListener('click', function(e){
      var btn = e.target.closest('button[data-key]');
      if(!btn) return;
      e.preventDefault();
      onKey(btn.getAttribute('data-key'));
    });

    // 刷新 Lucide icon
    refreshIcons();
  }

  MathApp.utils = {
    randInt: randInt,
    formatTime: formatTime,
    numberToChinese: numberToChinese,
    numberToTaiwanSpokenText: numberToTaiwanSpokenText,
    formatSpokenMathText: formatSpokenMathText,
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
    upgradeDomBlocks: upgradeDomBlocks,
    createNumpad: createNumpad
  };

  // 掛載常用函式至 MathApp 捷徑
  MathApp.randInt = randInt;
  MathApp.numberToChinese = numberToChinese;
  MathApp.numberToTaiwanSpokenText = numberToTaiwanSpokenText;
  MathApp.formatSpokenMathText = formatSpokenMathText;
  MathApp.renderBlocks = renderBlocks;
  MathApp.renderGroupedBlocksHtml = renderGroupedBlocksHtml;
  MathApp.refreshIcons = refreshIcons;
  MathApp.createNumpad = createNumpad;

})();
