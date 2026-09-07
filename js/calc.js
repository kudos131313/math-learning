/**
 * ==========================================================================
 * 直式加減法概念學習教室模組 (VERTICAL CALCULATION LAB)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var calcState = {
    op: 'add',           // 'add' 或 'sub'
    numA: 28,            // 被運算數 (1~99)
    numB: 15,            // 運算數 (1~99)
    step: 0,             // 0: 對齊, 1: 算個位, 2: 進位/借位處理, 3: 算十位, 4: 完成
    isAutoPlaying: false,
    autoTimer: null,
    isAnimating: false   // 積木物理級動態播放鎖
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
      var isAcrossZeroBorrow = needsBorrow_o && a_t === 0 && a_h > 0;
      var borrowed_t = needsBorrow_o ? a_t - 1 : a_t;
      var effective_o = needsBorrow_o ? a_o + 10 : a_o;
      var ans_o = effective_o - b_o;

      var needsBorrow_t = false;
      var borrowed_h = a_h;
      var effective_t = borrowed_t;

      if(isAcrossZeroBorrow){
        // 百位退位跨零借位：例如 105 - 38
        // 十位是 0，先向百位借 1 個百 (拆成 10 個十，百位減 1)
        // 十位再借 1 個十給個位，十位留下 9 個十
        needsBorrow_t = true;
        borrowed_h = a_h - 1;
        effective_t = 9;
      } else if(borrowed_t < b_t){
        // 一般十位不夠減向百位借位：例如 125 - 48
        needsBorrow_t = true;
        borrowed_h = a_h - 1;
        effective_t = borrowed_t + 10;
      }

      var ans_t = effective_t - b_t;
      var ans_h = borrowed_h - b_h;
      var diff = a - b;

      return {
        a: a, b: b, op: 'sub',
        a_h: a_h, a_t: a_t, a_o: a_o,
        b_h: b_h, b_t: b_t, b_o: b_o,
        needsBorrow_o: needsBorrow_o,
        isAcrossZeroBorrow: isAcrossZeroBorrow,
        borrowed_t: borrowed_t,
        effective_o: effective_o,
        ans_o: ans_o,
        needsBorrow_t: needsBorrow_t,
        borrowed_h: borrowed_h,
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
        if(MathApp.sfx) MathApp.sfx('click');
      });
      calcEls.presetChips.appendChild(btn);
    });
  }

  /* 落地爆破光芒 */
  function spawnCalcBurst(cx, cy, color){
    if(prefersReduced) return;
    var burst = document.createElement('div');
    burst.className = 'blk-burst-glow';
    burst.style.left = cx + 'px';
    burst.style.top = cy + 'px';
    burst.style.background = 'radial-gradient(circle, ' + (color || '#f59e0b') + ' 0%, rgba(255,255,255,0) 75%)';
    burst.style.boxShadow = '0 0 24px ' + (color || '#f59e0b');
    document.body.appendChild(burst);
    setTimeout(function(){ if(burst && burst.parentNode) burst.remove(); }, 520);
  }

  /* 清除飛行中的積木元素與動畫鎖 */
  function cleanupCalcBlockAnimations(){
    var flyers = document.querySelectorAll('.blk-anim-flyer, .blk-split-shard, .blk-burst-glow');
    for(var i = 0; i < flyers.length; i++){
      if(flyers[i].parentNode) flyers[i].parentNode.removeChild(flyers[i]);
    }
    if(calcEls.blocksStage){
      calcEls.blocksStage.classList.remove('calc-stage-animating');
    }
    calcState.isAnimating = false;
  }

  /* 渲染具體積木群組 (百位、十位與個位) */
  /* 支援劃掉扣除 (slashedCount) 與進位標示 (carriedCount) 的具體積木渲染器 */
  function renderCustomBlocksHtml(kind, count, slashedCount, carriedCount){
    if(count <= 0) return '';
    slashedCount = Math.min(count, Math.max(0, slashedCount || 0));
    carriedCount = Math.min(count, Math.max(0, carriedCount || 0));

    var slashStartIdx = count - slashedCount;
    var carryStartIdx = count - carriedCount;

    var html = '';
    var totalRendered = 0;
    while(totalRendered < count){
      var gSize = Math.min(5, count - totalRendered);
      html += '<div class="blk-group-5" aria-label="' + gSize + '個積木">';
      for(var i = 0; i < gSize; i++){
        var idx = totalRendered + i;
        var isSlashed = (idx >= slashStartIdx);
        var isCarried = (!isSlashed && idx >= carryStartIdx);

        var extraClasses = '';
        if(isSlashed) extraClasses += ' blk-slash-crossed';
        if(isCarried) extraClasses += ' blk-carried';

        var cls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
        html += '<span class="blk ' + cls + extraClasses + '" data-kind="' + kind + '">';
        if(isCarried){
          html += '<span class="carried-tag-pill">進位＋1</span>';
        }
        html += MathApp.utils.getBlockSvg(kind);
        html += '</span>';
      }
      html += '</div>';
      totalRendered += gSize;
    }
    return html;
  }

  /* 渲染具體積木群組 (百位、十位與個位，支援跨欄焦點高亮、滿十收納框、劃掉扣除與進位標示) */
  function createBlockColGroupHtml(title, kind, count, titleClass, extraWrapClass, isColActive, hasTenFrame, slashedCount, carriedCount){
    var activeClass = isColActive ? (' active-col-group col-focus-' + kind) : '';
    var html = '<div class="block-col-group' + activeClass + '" data-place="' + kind + '">';
    html += '<span class="block-col-title ' + (titleClass || '') + '">' + title + ' (' + count + ')</span>';
    html += '<div class="block-items-wrap ' + (extraWrapClass || '') + '" data-place="' + kind + '">';
    if(count === 0){
      html += '<span style="font-size:12px;color:var(--ink-soft);padding:4px;">0 (無積木)</span>';
    } else if(hasTenFrame && count >= 10){
      // 滿十收納框：前 10 顆整齊包覆在金色虛線收納盒中，剩餘的排在外面
      html += '<div class="blk-ten-frame-box" id="calc-ten-frame-box">';
      html += '<span class="ten-frame-badge">滿10進1</span>';
      html += renderCustomBlocksHtml(kind, 10, 0, 0);
      html += '</div>';
      if(count > 10){
        html += renderCustomBlocksHtml(kind, count - 10, slashedCount, carriedCount);
      }
    } else {
      html += renderCustomBlocksHtml(kind, count, slashedCount, carriedCount);
    }
    html += '</div></div>';
    return html;
  }

  /* 減法：成對劃紅斜線打叉動態 (劃掉扣除法，積木保持在畫面上不消失) */
  function playDeductSlashAnimation(place, deductCount, onDone){
    if(prefersReduced || typeof window.anime === 'undefined' || deductCount <= 0){
      if(onDone) onDone();
      return;
    }
    var wrapA = calcEls.blocksContainerA ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="' + place + '"]') : null;
    var wrapB = calcEls.blocksContainerB ? calcEls.blocksContainerB.querySelector('.block-items-wrap[data-place="' + place + '"]') : null;
    if(!wrapA){ if(onDone) onDone(); return; }

    var itemsA = wrapA.querySelectorAll('.blk');
    var itemsB = wrapB ? wrapB.querySelectorAll('.blk') : [];

    // 選取被減數 A 最後 deductCount 個元素，以及減數 B 的 deductCount 個元素
    var toSlashA = [];
    var startIdxA = Math.max(0, itemsA.length - deductCount);
    for(var i = startIdxA; i < itemsA.length; i++){
      toSlashA.push(itemsA[i]);
    }

    var toSlashB = [];
    for(var j = 0; j < Math.min(deductCount, itemsB.length); j++){
      toSlashB.push(itemsB[j]);
    }

    var allToSlash = toSlashA.concat(toSlashB);
    if(allToSlash.length === 0){ if(onDone) onDone(); return; }

    // 依序劃上紅斜線，不消失，保持在畫面上！
    allToSlash.forEach(function(el, idx){
      setTimeout(function(){
        el.classList.add('blk-slash-crossed');
        if(MathApp.sfx && idx === 0) MathApp.sfx('click');
        if(idx === allToSlash.length - 1 && onDone){
          setTimeout(onDone, 300);
        }
      }, idx * 45);
    });
  }

  /* 加法：滿十浮現 Ten-Frame 收納框 ➔ 10 顆小方塊整齊收納 ➔ 合體轉化為長條十 ➔ 拋物線飛向下方的合計結果欄十位 */
  function playBlockCarryAnimation(d, onComplete){
    if(prefersReduced || typeof window.anime === 'undefined'){
      if(onComplete) onComplete();
      return;
    }
    cleanupCalcBlockAnimations();
    calcState.isAnimating = true;
    if(calcEls.blocksStage) calcEls.blocksStage.classList.add('calc-stage-animating');

    var wrapA_o = calcEls.blocksContainerA ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="o"]') : null;
    var wrapB_o = calcEls.blocksContainerB ? calcEls.blocksContainerB.querySelector('.block-items-wrap[data-place="o"]') : null;
    var wrapRes_t = calcEls.blocksContainerResult ? calcEls.blocksContainerResult.querySelector('.block-items-wrap[data-place="t"]') : null;
    var wrapRes = calcEls.blocksContainerResult;

    if(!wrapA_o){
      cleanupCalcBlockAnimations();
      if(onComplete) onComplete();
      return;
    }

    var rectA = wrapA_o.getBoundingClientRect();
    var rectB = wrapB_o ? wrapB_o.getBoundingClientRect() : rectA;

    // 起點設在 A 與 B 個位之間
    var centerX = (rectA.left + rectA.width / 2 + rectB.left + rectB.width / 2) / 2;
    var centerY = (rectA.top + rectB.top + rectB.height) / 2;

    // 建立「滿10進1」動態提示膠囊標籤 (不帶空虛線外框)
    var carryBadge = document.createElement('div');
    carryBadge.className = 'ten-frame-badge blk-anim-flyer';
    carryBadge.style.position = 'fixed';
    carryBadge.style.left = centerX + 'px';
    carryBadge.style.top = (centerY - 22) + 'px';
    carryBadge.style.transform = 'translate(-50%, -50%) scale(0.6)';
    carryBadge.style.opacity = '0';
    carryBadge.style.zIndex = '99998';
    carryBadge.style.pointerEvents = 'none';
    carryBadge.textContent = '滿10進1';
    document.body.appendChild(carryBadge);

    // 提示標籤縮放浮現
    window.anime({
      targets: carryBadge,
      scale: [0.5, 1],
      opacity: [0, 1],
      duration: 260,
      easing: 'easeOutBack'
    });

    var oSvg = MathApp.utils.getBlockSvg('o');
    var shards = [];
    for(var i = 0; i < 10; i++){
      var s = document.createElement('div');
      s.className = 'blk-split-shard';
      s.innerHTML = oSvg;
      var angle = (i / 10) * Math.PI * 2;
      var dist = 42 + (i % 3) * 10;
      var initX = centerX + Math.cos(angle) * dist;
      var initY = centerY + Math.sin(angle) * dist;
      s.style.left = initX + 'px';
      s.style.top = initY + 'px';
      document.body.appendChild(s);
      shards.push(s);
    }

    // 10 顆小方塊整齊聚攏至中心
    window.anime({
      targets: shards,
      left: centerX + 'px',
      top: centerY + 'px',
      scale: [1, 0.45],
      opacity: [1, 0.85],
      duration: 420,
      easing: 'easeInOutCubic',
      complete: function(){
        shards.forEach(function(el){ el.remove(); });

        if(MathApp.sfx) MathApp.sfx('pop');
        spawnCalcBurst(centerX, centerY, '#fbbf24');

        // 提示標籤緊縮合體
        window.anime({
          targets: carryBadge,
          scale: [1, 0.2],
          opacity: [1, 0],
          duration: 220,
          easing: 'easeInQuad',
          complete: function(){
            carryBadge.remove();
          }
        });

        var flyer = document.createElement('div');
        flyer.className = 'blk-anim-flyer';
        flyer.innerHTML = MathApp.utils.getBlockSvg('t');
        flyer.style.left = centerX + 'px';
        flyer.style.top = centerY + 'px';
        flyer.style.transform = 'translate(-50%, -50%) scale(0.65)';
        document.body.appendChild(flyer);

        // 落點設在下方合計結果欄的十位
        var endX, endY;
        if(wrapRes_t){
          var rT = wrapRes_t.getBoundingClientRect();
          endX = rT.left + rT.width / 2;
          endY = rT.top + rT.height / 2;
        } else if(wrapRes){
          var rR = wrapRes.getBoundingClientRect();
          endX = rR.left + Math.min(180, rR.width * 0.4);
          endY = rR.top + rR.height / 2;
        } else {
          endX = centerX - 100;
          endY = centerY + 80;
        }

        var arcY = Math.min(centerY, endY) - 50;

        window.anime({
          targets: flyer,
          left: endX + 'px',
          top: [
            { value: arcY + 'px', duration: 360, easing: 'easeOutQuad' },
            { value: endY + 'px', duration: 340, easing: 'easeInQuad' }
          ],
          scale: [0.65, 1.25, 1],
          rotate: [-18, 6, 0],
          duration: 700,
          easing: 'easeInOutCubic',
          complete: function(){
            flyer.remove();
            spawnCalcBurst(endX, endY, '#14b8a6');
            if(MathApp.sfx) MathApp.sfx('carry');
            cleanupCalcBlockAnimations();
            if(onComplete) onComplete();
          }
        });
      }
    });
  }

  /* 減法：十位抽出長條 ➔ 平移至個位 ➔ 震動裂解為 10 顆小白方塊 */
  function playBlockBorrowAnimation(d, onComplete){
    if(prefersReduced || typeof window.anime === 'undefined'){
      if(onComplete) onComplete();
      return;
    }
    cleanupCalcBlockAnimations();
    calcState.isAnimating = true;
    if(calcEls.blocksStage) calcEls.blocksStage.classList.add('calc-stage-animating');

    var wrapA_h = calcEls.blocksContainerA ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="h"]') : null;
    var wrapA_t = calcEls.blocksContainerA ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="t"]') : null;
    var wrapA_o = calcEls.blocksContainerA ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="o"]') : null;

    if(d.isAcrossZeroBorrow && wrapA_h && wrapA_t && wrapA_o){
      // 百位跨零連續借位演繹：百位 ➔ 十位 ➔ 個位
      var rectH = wrapA_h.getBoundingClientRect();
      var rectT = wrapA_t.getBoundingClientRect();
      var rectO = wrapA_o.getBoundingClientRect();

      var flyerH = document.createElement('div');
      flyerH.className = 'blk-anim-flyer';
      flyerH.innerHTML = MathApp.utils.getBlockSvg('h');
      var startHX = rectH.left + rectH.width / 2;
      var startHY = rectH.top + rectH.height / 2;
      flyerH.style.left = startHX + 'px';
      flyerH.style.top = startHY + 'px';
      flyerH.style.transform = 'translate(-50%, -50%) scale(1)';
      document.body.appendChild(flyerH);

      var midTX = rectT.left + rectT.width / 2;
      var midTY = rectT.top + rectT.height / 2;

      window.anime({
        targets: flyerH,
        left: midTX + 'px',
        top: midTY + 'px',
        scale: [1, 1.12, 0.85],
        duration: 460,
        easing: 'easeInOutQuad',
        complete: function(){
          flyerH.remove();
          spawnCalcBurst(midTX, midTY, '#3b82f6');
          if(MathApp.sfx) MathApp.sfx('borrow');

          playSingleTenBorrowToOnes(midTX, midTY, rectO, function(){
            cleanupCalcBlockAnimations();
            if(onComplete) onComplete();
          });
        }
      });
      return;
    }

    if(!wrapA_t || !wrapA_o){
      cleanupCalcBlockAnimations();
      if(onComplete) onComplete();
      return;
    }

    var rectT2 = wrapA_t.getBoundingClientRect();
    var rectO2 = wrapA_o.getBoundingClientRect();
    var startTX = rectT2.left + rectT2.width / 2;
    var startTY = rectT2.top + rectT2.height / 2;

    playSingleTenBorrowToOnes(startTX, startTY, rectO2, function(){
      cleanupCalcBlockAnimations();
      if(onComplete) onComplete();
    });
  }

  /* 單條十位長條飛渡至個位上方並裂解成 10 個小方塊 */
  function playSingleTenBorrowToOnes(fromX, fromY, rectO, onDone){
    var targetOX = rectO.left + rectO.width / 2;
    var targetOY = rectO.top + rectO.height / 2;

    var flyerT = document.createElement('div');
    flyerT.className = 'blk-anim-flyer';
    flyerT.innerHTML = MathApp.utils.getBlockSvg('t');
    flyerT.style.left = fromX + 'px';
    flyerT.style.top = fromY + 'px';
    flyerT.style.transform = 'translate(-50%, -50%) scale(1)';
    document.body.appendChild(flyerT);

    var hoverOX = targetOX;
    var hoverOY = targetOY - 46;

    window.anime({
      targets: flyerT,
      left: hoverOX + 'px',
      top: hoverOY + 'px',
      scale: [1, 1.2],
      duration: 440,
      easing: 'easeOutQuad',
      complete: function(){
        window.anime({
          targets: flyerT,
          rotate: [-12, 12, -6, 6, 0],
          duration: 240,
          easing: 'linear',
          complete: function(){
            flyerT.remove();
            spawnCalcBurst(hoverOX, hoverOY, '#3b82f6');
            if(MathApp.sfx) MathApp.sfx('borrow');

            var oSvg = MathApp.utils.getBlockSvg('o');
            var shards = [];
            for(var i = 0; i < 10; i++){
              var s = document.createElement('div');
              s.className = 'blk-split-shard';
              s.innerHTML = oSvg;
              s.style.left = hoverOX + 'px';
              s.style.top = hoverOY + 'px';
              s.style.transform = 'translate(-50%, -50%) scale(1)';
              document.body.appendChild(s);
              shards.push(s);
            }

            shards.forEach(function(s, idx){
              var angle = (idx / 10) * Math.PI * 2;
              var burstR = 32 + (idx % 3) * 12;
              var burstX = hoverOX + Math.cos(angle) * burstR;
              var burstY = hoverOY + Math.sin(angle) * burstR;

              var finalTargetX = targetOX + ((idx % 5) - 2) * 20;
              var finalTargetY = targetOY + (Math.floor(idx / 5) - 0.5) * 20;

              window.anime({
                targets: s,
                keyframes: [
                  { left: burstX + 'px', top: burstY + 'px', scale: 1.4, duration: 250, easing: 'easeOutBack' },
                  { left: finalTargetX + 'px', top: finalTargetY + 'px', scale: 1, duration: 320, easing: 'easeInQuad' }
                ],
                complete: function(){
                  s.remove();
                  if(idx === shards.length - 1){
                    spawnCalcBurst(targetOX, targetOY, '#f59e0b');
                    if(onDone) onDone();
                  }
                }
              });
            });
          }
        });
      }
    });
  }

  /* 渲染積木操作舞台 (支援各步驟即時具體積木數量過渡) */
  function renderCalcBlocksStage(d, step){
    if(!calcEls.blocksContainerA) return;

    // 更新標籤
    calcEls.labelBlockB.textContent = (calcState.op === 'add' ? '加數 ' : '減數 ') + d.b;
    calcEls.blockDividerSymbol.textContent = calcState.op === 'add' ? '＋' : '−';
    calcEls.blockDividerText.textContent = calcState.op === 'add' ? '合起來相加' : '拿走扣除';

    // 題目積木：
    // 加法時：被加數 A 與加數 B 自始至終保持原始數值，結果累積在下方結果欄。
    // 減法時：被減數代表桌面現有積木，若發生借位，被減數十位抽出拆成 10 顆到個位，被減數積木即時動態變化！
    var dispA_h = d.a_h;
    var dispA_t = d.a_t;
    var dispA_o = d.a_o;
    var labelA_text = (calcState.op === 'add' ? '被加數 ' : '被減數 ') + d.a;

    var dispB_h = d.b_h;
    var dispB_t = d.b_t;
    var dispB_o = d.b_o;

    var slashA_h = 0;
    var slashA_t = 0;
    var slashA_o = 0;

    var slashB_h = 0;
    var slashB_t = 0;
    var slashB_o = 0;

    if(calcState.op === 'sub'){
      if(step === 2){
        if(d.isAcrossZeroBorrow){
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = 9;
          dispA_o = d.effective_o;
          labelA_text = '被減數 ' + d.a + '（百位退位拆借：十位留 9 條、個位變 ' + d.effective_o + ' 顆，劃掉 ' + d.b_o + ' 顆）';
        } else if(d.needsBorrow_o){
          dispA_t = d.borrowed_t;
          dispA_o = d.effective_o;
          labelA_text = '被減數 ' + d.a + '（借一拆十：十位借 1 留 ' + d.borrowed_t + ' 條、個位變 ' + d.effective_o + ' 顆，劃掉 ' + d.b_o + ' 顆）';
        } else {
          labelA_text = '被減數 ' + d.a + '（個位有 ' + d.a_o + ' 顆，劃掉 ' + d.b_o + ' 顆，剩 ' + d.ans_o + ' 顆）';
        }
        slashA_o = d.b_o;
        slashB_o = dispB_o; // 減數個位同步維持劃掉
      } else if(step >= 3){
        if(d.isAcrossZeroBorrow){
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = 9;
          dispA_o = d.effective_o;
        } else if(d.needsBorrow_t){
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = d.effective_t;
          dispA_o = d.effective_o;
        } else if(d.needsBorrow_o){
          dispA_t = d.borrowed_t;
          dispA_o = d.effective_o;
        }
        slashA_o = d.b_o;
        slashA_t = d.b_t;
        slashB_o = dispB_o; // 減數個位同步維持劃掉
        slashB_t = dispB_t; // 減數十位同步維持劃掉
        if(step >= 4 && d.b_h > 0){
          slashA_h = d.b_h;
          slashB_h = dispB_h; // 減數百位同步維持劃掉
        }
        labelA_text = '被減數 ' + d.a + '（扣除積木已劃紅斜線，未劃掉的即為相減結果）';
      }
    }

    if(calcEls.labelBlockA){
      calcEls.labelBlockA.textContent = labelA_text;
    }

    // 判斷當前聚焦的位值欄位 (Cross-Highlighting)
    var activePlace = '';
    if(step === 1 || step === 2){
      activePlace = 'o'; // 個位焦點
    } else if(step === 3){
      activePlace = 't'; // 十位焦點
    } else if(step === 4 && (d.a_h > 0 || d.b_h > 0 || d.ans_h > 0)){
      activePlace = 'h'; // 百位焦點
    }

    // 渲染 A 積木 (支援滿十收納框、焦點高亮與減法紅斜線劃掉)
    var htmlA = '';
    if(dispA_h > 0) htmlA += createBlockColGroupHtml('百位', 'h', dispA_h, 'h-title', '', (activePlace === 'h'), false, slashA_h, 0);
    htmlA += createBlockColGroupHtml('十位', 't', dispA_t, 't-title', '', (activePlace === 't'), false, slashA_t, 0);
    htmlA += createBlockColGroupHtml('個位', 'o', dispA_o, 'o-title', '', (activePlace === 'o'), (calcState.op === 'add' && step === 1 && d.needsCarry), slashA_o, 0);
    calcEls.blocksContainerA.innerHTML = htmlA;

    // 渲染 B 積木 (減法時，已扣除的欄位維持被劃掉的樣子)
    var htmlB = '';
    if(dispB_h > 0) htmlB += createBlockColGroupHtml('百位', 'h', dispB_h, 'h-title', '', (activePlace === 'h'), false, slashB_h, 0);
    htmlB += createBlockColGroupHtml('十位', 't', dispB_t, 't-title', '', (activePlace === 't'), false, slashB_t, 0);
    htmlB += createBlockColGroupHtml('個位', 'o', dispB_o, 'o-title', '', (activePlace === 'o'), false, slashB_o, 0);
    calcEls.blocksContainerB.innerHTML = htmlB;

    // 在 Step 1 標記即將聚合或借位的積木
    if(step === 1){
      if(calcState.op === 'sub' && d.needsBorrow_o){
        // 減法借位：十位最後 1 條長條加上藍色鎖定浮起光暈
        var wrapT = calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="t"]');
        if(wrapT){
          var blkTs = wrapT.querySelectorAll('.svg-blk-t, .blk-t');
          if(blkTs.length > 0){
            blkTs[blkTs.length - 1].classList.add('blk-borrow-source');
          }
        }
        if(d.isAcrossZeroBorrow){
          var wrapH = calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="h"]');
          if(wrapH){
            var blkHs = wrapH.querySelectorAll('.svg-blk-h, .blk-h');
            if(blkHs.length > 0) blkHs[blkHs.length - 1].classList.add('blk-borrow-source');
          }
        }
      }
    }

    // 特寫動作盒已移除，僅控制下方結果欄
    calcEls.rowResult.style.display = 'none';

    if(calcState.op === 'add'){
      if(step === 2){
        // Step 2：個位計算完畢，結果呈現在下方的「合計結果欄」！
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計進度（個位已算好：' + d.ans_o + (d.needsCarry ? '，進位 1 條十' : '') + '）';
        var htmlResStep2 = '';
        if(d.needsCarry){
          htmlResStep2 += createBlockColGroupHtml('十位 (進位)', 't', 1, 't-title', '', (activePlace === 't'), false, 0, 1);
        }
        htmlResStep2 += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', (activePlace === 'o'));
        calcEls.blocksContainerResult.innerHTML = htmlResStep2;
      } else if(step === 3){
        // Step 3：十位計算完畢，累積至「合計結果欄」（十位若有進位，其中 1 條標記為進位得來）
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計進度（十位已算好：' + d.ans_t + (d.needsCarry ? '，含進位的 1 條十' : '') + '）';
        var htmlResStep3 = '';
        if(d.ans_h > 0){
          htmlResStep3 += createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', (activePlace === 'h'), false, 0, (d.carry_t > 0 ? 1 : 0));
        }
        htmlResStep3 += createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', (activePlace === 't'), false, 0, (d.needsCarry ? 1 : 0));
        htmlResStep3 += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', false);
        calcEls.blocksContainerResult.innerHTML = htmlResStep3;
      } else if(step >= 4){
        // Step 4：全部完成（十位長條中，清楚標記 1 條是進位得來的）
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計最終積木 (結果 ' + d.total + (d.needsCarry ? '，其中 1 條十為滿十進位得來' : '') + ')';
        var htmlResStep4 = '';
        if(d.ans_h > 0){
          htmlResStep4 += createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', false, false, 0, (d.carry_t > 0 ? 1 : 0));
        }
        htmlResStep4 += createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', false, false, 0, (d.needsCarry ? 1 : 0));
        htmlResStep4 += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title');
        calcEls.blocksContainerResult.innerHTML = htmlResStep4;
      }
    } else {
      // 減法
      if(step === 2){
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減進度（個位剩餘：' + d.ans_o + '）';
        var htmlSubStep2 = createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', (activePlace === 'o'));
        calcEls.blocksContainerResult.innerHTML = htmlSubStep2;
      } else if(step === 3){
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減進度（十位剩餘：' + d.ans_t + '）';
        var htmlSubStep3 = '';
        if(d.ans_h > 0) htmlSubStep3 += createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', (activePlace === 'h'));
        htmlSubStep3 += createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', (activePlace === 't'));
        htmlSubStep3 += createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', false);
        calcEls.blocksContainerResult.innerHTML = htmlSubStep3;
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

  /* 渲染作業簿直式算則 (Vertical Math Board - 方案 A 劃斜線與剩餘數筆記法) */
  function renderVerticalMathBoard(d, step){
    if(!calcEls.verticalBoard) return;

    var opSymbol = d.op === 'add' ? '＋' : '−';
    var hasH = (d.a_h > 0 || d.b_h > 0 || (d.op === 'add' && d.ans_h > 0));
    var showCarryT = (d.op === 'add' && d.carry_o > 0 && step >= 2);
    var showCarryH = (d.op === 'add' && d.carry_t > 0 && step >= 3);
    var showBorrow = (d.op === 'sub' && (d.needsBorrow_o || d.needsBorrow_t) && step >= 2);

    // 判斷當前高亮欄位
    var isOActive = (step === 1 || step === 2);
    var isTActive = (step === 3);
    var isHActive = (step === 4 && hasH && d.ans_h > 0);

    var clsO = 'vm-cell vm-cell-o' + (isOActive ? ' active-col' : '');
    var clsT = 'vm-cell vm-cell-t' + (isTActive ? ' active-col' : '');
    var clsH = 'vm-cell vm-cell-h' + (isHActive ? ' active-col' : '');

    // 判斷被減數十位與百位是否被劃斜線 (方案 A)
    var isTSlashed = false;
    var isHSlashed = false;

    if(d.op === 'sub'){
      // 十位劃線：
      // 1. 個位向十位借位 (step >= 2)
      // 2. 一般十位向百位借位合併取代 (如 120 - 30，step >= 3)
      if(d.needsBorrow_o && step >= 2){
        isTSlashed = true;
      } else if(d.needsBorrow_t && step >= 3){
        isTSlashed = true;
      }
      // 百位劃線：
      // 1. 若為跨零借位 (如 105 - 38)，在 step >= 2 百位連同退位劃線
      // 2. 若為一般十位向百位借位 (如 142 - 54 或 117 - 55)，在 step >= 3 劃線
      if(d.a_h > 0){
        if(d.isAcrossZeroBorrow && step >= 2){
          isHSlashed = true;
        } else if(d.needsBorrow_t && step >= 3){
          isHSlashed = true;
        }
      }
    }

    // 1. 進退位標記內容 (方案 A：浮現扣除借位後的剩餘數或借入總值)
    var mark_h = '';
    var mark_t = '';
    var mark_o = '';
    if(d.op === 'add'){
      if(showCarryH){
        mark_h = '<span class="vm-carry-badge" title="十位滿十進一">1</span>';
      }
      if(showCarryT){
        mark_t = '<span class="vm-carry-badge" title="個位滿十進一">1</span>';
      }
    } else if(showBorrow){
      // 個位借入的 10
      if(d.needsBorrow_o && step >= 2){
        mark_o = '<span class="vm-borrow-tag" title="借來的 10">10</span>';
      }

      // 百位剩餘數
      if(isHSlashed){
        var remH = d.borrowed_h !== undefined ? d.borrowed_h : (d.a_h - 1);
        mark_h = '<span class="vm-borrow-tag rem-mark" title="百位借走剩 ' + remH + '">' + remH + '</span>';
      }

      // 十位剩餘數 / 借入值
      if(d.isAcrossZeroBorrow && step >= 2){
        // 百位跨零退位：十位向百位借 10 留 9
        mark_t = '<span class="vm-borrow-tag rem-mark" title="十位向百位借10再借出1剩9">9</span>';
      } else if(d.needsBorrow_o && step === 2){
        // Step 2：個位借走 1，十位顯示剩餘數 (例如 142 顯示 3；112 顯示 0)
        var remT = d.a_t - 1;
        mark_t = '<span class="vm-borrow-tag rem-mark" title="十位被借走1剩 ' + remT + '">' + remT + '</span>';
      } else if(step >= 3){
        if(d.needsBorrow_t){
          // Step 3+：十位向百位借 10，合併剩餘數！
          // 若先前被個位借了：(a_t - 1) + 10 (例如 142 顯示 13；112 顯示 10)
          // 若先前個位沒借：a_t + 10 (例如 117 顯示 11)
          var totalT = d.needsBorrow_o ? ((d.a_t - 1) + 10) : (d.a_t + 10);
          mark_t = '<span class="vm-borrow-tag rem-mark" title="十位向百位借10，現有 ' + totalT + '">' + totalT + '</span>';
        } else if(d.needsBorrow_o){
          // 十位不需要向百位借，維持顯示剩餘數
          mark_t = '<span class="vm-borrow-tag rem-mark" title="十位被借走1剩 ' + (d.a_t - 1) + '">' + (d.a_t - 1) + '</span>';
        }
      }
    }

    // 2. 被運算數 (A) 數字顯示 (支援劃斜線 is-slashed)
    var numA_h_html = '';
    if(d.a_h > 0){
      numA_h_html = '<div class="vm-num-box' + (isHSlashed ? ' is-slashed' : '') + '">' + d.a_h + '</div>';
    }
    var numA_t_html = '<div class="vm-num-box' + (isTSlashed ? ' is-slashed' : '') + '">' + d.a_t + '</div>';
    var numA_o_html = '<div class="vm-num-box">' + d.a_o + '</div>';

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
    if(hasH) html += '<div class="' + clsH + '">' + numA_h_html + '</div>';
    html += '<div class="' + clsT + '">' + numA_t_html + '</div>';
    html += '<div class="' + clsO + '">' + numA_o_html + '</div>';
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
    bindVerticalMathBoardHover();
  }

  /* 直式算則滑鼠懸停反向高亮左側具體積木 (Cross-Hover) */
  function bindVerticalMathBoardHover(){
    if(!calcEls.verticalBoard) return;
    var cells = calcEls.verticalBoard.querySelectorAll('.vm-cell-o, .vm-cell-t, .vm-cell-h');
    cells.forEach(function(cell){
      var place = '';
      if(cell.classList.contains('vm-cell-o')) place = 'o';
      else if(cell.classList.contains('vm-cell-t')) place = 't';
      else if(cell.classList.contains('vm-cell-h')) place = 'h';
      if(!place) return;

      cell.addEventListener('mouseenter', function(){
        var targetGroups = document.querySelectorAll('.block-col-group[data-place="' + place + '"]');
        targetGroups.forEach(function(grp){
          grp.classList.add('blk-hover-highlight');
        });
      });
      cell.addEventListener('mouseleave', function(){
        var targetGroups = document.querySelectorAll('.block-col-group[data-place="' + place + '"]');
        targetGroups.forEach(function(grp){
          grp.classList.remove('blk-hover-highlight');
        });
      });
    });
  }

  /* 步驟文案與語音解說生成器 */
  function getStepExplanation(d, step){
    if(step === 0){
      return {
        pill: '第 1 步 / 共 4 步：位值對齊排排站',
        text: '先把數字排整齊！<em>個位對齊個位</em>（小方塊）、<em>十位對齊十位</em>（長條），同一種位置才能相加減喔！',
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
            promptBtn: '✨ 點擊把 10 顆積木捆成 1 條十！'
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
        if(d.isAcrossZeroBorrow){
          return {
            pill: '第 2 步 / 共 4 步：先算個位',
            text: '先算個位：個位只有 <em>' + d.a_o + '</em> 顆，拿不走 <em>' + d.b_o + '</em> 顆！想向十位借，但<em>十位是 0 條</em>，要先向百位借 1 個百拆成 10 條十，再借 1 條給個位！',
            speak: '先算個位：個位只有 ' + d.a_o + ' 個，不夠減 ' + d.b_o + ' 個！十位是 0，要先向百位借 1 個百拆開，再借給個位！',
            showPrompt: true,
            promptBtn: '✂️ 點擊啟動百位退位借十！',
            isBorrow: true
          };
        } else if(d.needsBorrow_o){
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
            text: '10 顆積木聚合成 1 條十，送給十位！直式十位上方寫一個<em>金色小 1</em>，個位留下 <em>' + d.ans_o + '</em> 顆！',
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
        if(d.isAcrossZeroBorrow){
          return {
            pill: '第 2 步 (借位)：百位退位與借一拆十',
            text: '百位借 1 劃掉記 <em>0</em>，十位向百位借 10 條、再借 1 條給個位後劃掉記 <em>9</em>；個位得到 10 顆變成 <em>' + d.effective_o + '</em> 顆，' + d.effective_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>！',
            speak: '百位退位！百位劃掉記 0，十位劃掉記 9；個位得到 10 顆，減 ' + d.b_o + ' 等於 ' + d.ans_o + '！',
            showPrompt: false,
            sound: 'borrow'
          };
        } else if(d.needsBorrow_o){
          return {
            pill: '第 2 步 (借位)：借一拆十到個位',
            text: '向十位借 1 條十，十位劃掉記上剩餘的 <em>' + d.borrowed_t + '</em>；拆成 10 顆積木到個位，個位變成 <em>' + d.effective_o + '</em> 顆，' + d.effective_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>！',
            speak: '借一拆十！十位劃掉記 ' + d.borrowed_t + '，個位現在有 ' + d.effective_o + ' 個，減 ' + d.b_o + ' 等於 ' + d.ans_o + '！',
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
        var carryTNote = d.carry_t > 0 ? ('，滿十向百位進 1（百位頭上記上金色小 1）！') : '！';
        var expText = d.carry_o > 0
          ? '接著算十位：別忘了頭上的小 1 喔！<em>1 ＋ ' + d.a_t + ' ＋ ' + d.b_t + ' ＝ ' + d.t_sum + '</em>。在十位寫上 <em>' + d.ans_t + '</em>' + carryTNote
          : '接著算十位：' + d.a_t + ' ＋ ' + d.b_t + ' ＝ <em>' + d.t_sum + '</em>。在十位寫上 <em>' + d.ans_t + '</em>' + carryTNote;
        var expSpeak = d.carry_o > 0
          ? '接著算十位：進位的小 1 加上 ' + d.a_t + ' 再加 ' + d.b_t + ' 等於 ' + d.t_sum + '，在十位寫上 ' + d.ans_t + (d.carry_t > 0 ? '，滿十進一到百位！' : '！')
          : '接著算十位：' + d.a_t + ' 加 ' + d.b_t + ' 等於 ' + d.t_sum + '，在十位寫上 ' + d.ans_t + (d.carry_t > 0 ? '，滿十進一到百位！' : '！');
        return {
          pill: '第 3 步 / 共 4 步：再算十位',
          text: expText,
          speak: expSpeak,
          showPrompt: false
        };
      } else {
        var subExpText = '';
        var subExpSpeak = '';

        if(d.isAcrossZeroBorrow){
          subExpText = '接著算十位：看著十位頭頂沒被劃掉的 <em>9</em> 條十。<em>9 − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：十位剩下 9 條十，9 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，在十位寫上 ' + d.ans_t + '！';
        } else if(d.needsBorrow_t){
          var tMarkDesc = d.needsBorrow_o ? ('劃掉合併記 <em>' + d.effective_t + '</em>') : ('劃掉改記 <em>' + d.effective_t + '</em>');
          var tMarkSpeak = d.needsBorrow_o ? ('十位劃掉合併記 ' + d.effective_t) : ('十位劃掉改記 ' + d.effective_t);
          subExpText = '接著算十位：百位劃掉記 <em>' + d.borrowed_h + '</em>，十位' + tMarkDesc + '。<em>' + d.effective_t + ' − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：百位借出 1 剩下 ' + d.borrowed_h + '，' + tMarkSpeak + '，' + d.effective_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
        } else if(d.needsBorrow_o){
          subExpText = '接著算十位：看著十位頭頂劃掉後剩餘的 <em>' + d.borrowed_t + '</em> 條。<em>' + d.borrowed_t + ' − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：十位借出 1 條剩下 ' + d.borrowed_t + ' 條，' + d.borrowed_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，在十位寫上 ' + d.ans_t + '！';
        } else {
          subExpText = '接著算十位：' + d.a_t + ' − ' + d.b_t + ' ＝ <em>' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：' + d.a_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
        }

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
      var extraHNote = '';
      if(d.op === 'sub' && d.a_h > 0 && d.ans_h === 0 && d.b_h === 0){
        extraHNote = '（百位借出後剩 0，最高位 0 省略不寫喔！）';
      }
      return {
        pill: '第 4 步 / 共 4 步：計算完成！',
        text: '太厲害了！<em>' + d.a + (d.op === 'add' ? ' ＋ ' : ' − ') + d.b + ' ＝ ' + d.total + '</em>' + extraHNote + '。橫式與直式的答案完全一致！',
        speak: '太棒了！' + d.a + opWord + d.b + ' 等於 ' + d.total + '！計算完成！',
        showPrompt: false,
        sound: 'correct'
      };
    }
  }

  /* 核心更新渲染器 (renderCalcView) */
  function renderCalcView(shouldSpeak){
    cleanupCalcBlockAnimations();
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

    // 動畫時間軸：使用 Anime.js 進行進位飛躍、借位劃線與答案彈跳
    animateVerticalStep(d, step);

    // 左側積木操作台動態演繹 (加法進位聚攏飛渡、減法借一拆十分裂與成對劃掉扣除)
    if(step === 2){
      if(calcState.op === 'add' && d.needsCarry){
        playBlockCarryAnimation(d);
      } else if(calcState.op === 'sub'){
        if(d.needsBorrow_o){
          playBlockBorrowAnimation(d, function(){
            if(d.b_o > 0){
              playDeductSlashAnimation('o', d.b_o);
            }
          });
        } else if(d.b_o > 0){
          playDeductSlashAnimation('o', d.b_o);
        }
      }
    } else if(step === 3){
      if(calcState.op === 'sub' && d.b_t > 0){
        playDeductSlashAnimation('t', d.b_t);
      }
    }

    // 音效
    if(info.sound && MathApp.sfx){
      MathApp.sfx(info.sound);
    }

    // 語音朗讀
    if(shouldSpeak && MathApp.speak){
      MathApp.speak(info.speak);
    }
  }

  /* 直式算則步驟補間動態 (Anime.js) */
  function animateVerticalStep(d, step){
    if(prefersReduced || typeof window.anime === 'undefined') return;

    // 1. 加法進位：滿十進一弧線飛躍 (Step 2 個位進十位，Step 3 十位進百位)
    if(d.op === 'add'){
      var carryBadge = null;
      var startCell = null;
      if(step === 2 && d.carry_o > 0){
        carryBadge = document.querySelector('.vm-cell-t .vm-carry-badge');
        startCell = document.querySelector('.vm-cell-o .vm-num-box');
      } else if(step === 3 && d.carry_t > 0){
        carryBadge = document.querySelector('.vm-cell-h .vm-carry-badge');
        startCell = document.querySelector('.vm-cell-t .vm-num-box');
      }
      if(carryBadge && startCell){
        var rBadge = carryBadge.getBoundingClientRect();
        var rStart = startCell.getBoundingClientRect();

        var flyer = document.createElement('div');
        flyer.className = 'anime-carry-flyer';
        flyer.textContent = '1';
        flyer.style.position = 'fixed';
        flyer.style.left = rStart.left + 'px';
        flyer.style.top = rStart.top + 'px';
        flyer.style.zIndex = '9999';
        flyer.style.pointerEvents = 'none';
        document.body.appendChild(flyer);

        carryBadge.style.opacity = '0';

        window.anime({
          targets: flyer,
          left: rBadge.left + 'px',
          top: [
            { value: (rStart.top - 46) + 'px', duration: 320, easing: 'easeOutQuad' },
            { value: rBadge.top + 'px', duration: 380, easing: 'easeInQuad' }
          ],
          scale: [1.8, 1],
          duration: 700,
          easing: 'easeInOutQuad',
          complete: function(){
            flyer.remove();
            carryBadge.style.opacity = '1';
            window.anime({
              targets: carryBadge,
              scale: [0.2, 1.35, 1],
              rotate: [-15, 8, 0],
              duration: 450,
              easing: 'easeOutElastic(1, .5)'
            });
          }
        });
      }
    }

    // 2. 減法借位：十位動態劃斜線與借十飛入個位
    if(step === 2 && d.op === 'sub' && d.needsBorrow_o){
      var slashStroke = document.querySelector('.vm-slash-stroke');
      if(slashStroke){
        window.anime({
          targets: slashStroke,
          scaleX: [0, 1],
          duration: 320,
          easing: 'easeOutExpo'
        });
      }

      var borrowTagO = document.querySelector('.vm-cell-o .vm-borrow-tag');
      var numAT = document.querySelector('.vm-cell-t .vm-num-box');
      if(borrowTagO && numAT){
        var rTag = borrowTagO.getBoundingClientRect();
        var rT = numAT.getBoundingClientRect();

        var flyerB = document.createElement('div');
        flyerB.className = 'anime-borrow-flyer';
        flyerB.textContent = '10';
        flyerB.style.position = 'fixed';
        flyerB.style.left = rT.left + 'px';
        flyerB.style.top = rT.top + 'px';
        flyerB.style.zIndex = '9999';
        flyerB.style.pointerEvents = 'none';
        document.body.appendChild(flyerB);

        borrowTagO.style.opacity = '0';

        window.anime({
          targets: flyerB,
          left: rTag.left + 'px',
          top: [
            { value: (rT.top - 38) + 'px', duration: 280, easing: 'easeOutQuad' },
            { value: rTag.top + 'px', duration: 380, easing: 'easeInQuad' }
          ],
          scale: [1.7, 1],
          duration: 660,
          easing: 'easeInOutQuad',
          complete: function(){
            flyerB.remove();
            borrowTagO.style.opacity = '1';
            window.anime({
              targets: borrowTagO,
              scale: [0.2, 1.3, 1],
              duration: 450,
              easing: 'easeOutElastic(1, .5)'
            });
          }
        });
      }
    }

    // 3. 揭曉答案數字彈出動效
    var revealedAns = document.querySelectorAll('.vm-cell-ans.revealed');
    if(revealedAns.length > 0){
      window.anime({
        targets: revealedAns,
        scale: [0.4, 1.15, 1],
        opacity: [0, 1],
        duration: 420,
        easing: 'easeOutBack'
      });
    }
  }

  /* 前進下一步 */
  function calcNextStep(){
    if(calcState.isAnimating) return;
    if(calcState.step < 4){
      calcState.step++;
      renderCalcView(true);
      if(MathApp.sfx && calcState.step < 4) MathApp.sfx('click');
    } else {
      stopAutoPlay();
    }
  }

  /* 返回上一步 */
  function calcPrevStep(){
    stopAutoPlay();
    cleanupCalcBlockAnimations();
    if(calcState.step > 0){
      calcState.step--;
      renderCalcView(true);
      if(MathApp.sfx) MathApp.sfx('click');
    }
  }

  /* 重播本步 */
  function calcReplayStep(){
    cleanupCalcBlockAnimations();
    renderCalcView(true);
    if(MathApp.sfx) MathApp.sfx('click');
  }

  /* 自動演示控制 */
  function stopAutoPlay(){
    if(calcState.autoTimer){
      clearInterval(calcState.autoTimer);
      calcState.autoTimer = null;
    }
    calcState.isAutoPlaying = false;
    if(calcEls.stepAutoBtn){
      calcEls.stepAutoBtn.innerHTML = '<i data-lucide="play-circle"></i> 自動演示';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
  }
  function toggleAutoPlay(){
    if(calcState.isAutoPlaying){
      stopAutoPlay();
    } else {
      calcState.isAutoPlaying = true;
      calcEls.stepAutoBtn.innerHTML = '<i data-lucide="pause-circle"></i> 暫停演示';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
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

    // 更新自訂輸入運算符號與標籤
    updateCustomLabels();

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
      calcEls.conceptText.textContent = '當個位不夠減時，向十位借 1 條十，十位劃斜線並記上扣除後的剩餘數；個位頭上多出借來的 10 顆，合在一起就可以輕鬆扣減囉！';
    }

    renderCalcPresetChips();
    renderCalcView(true);
    if(MathApp.sfx) MathApp.sfx('click');
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

  /* 更新自訂輸入運算符號與欄位名稱 */
  function updateCustomLabels(){
    var isAdd = calcState.op === 'add';
    var labelA = document.getElementById('custom-label-a');
    var labelB = document.getElementById('custom-label-b');
    if(labelA) labelA.textContent = isAdd ? '被加數：' : '被減數：';
    if(labelB) labelB.textContent = isAdd ? '加數：' : '減數：';
    if(calcEls.customOpSymbol) calcEls.customOpSymbol.textContent = isAdd ? '＋' : '−';
    checkCustomWarningLive();
  }

  /* 即時檢查加法是否超過 999 或減法是否有負值風險並提供警告提示 */
  function checkCustomWarningLive(){
    var warningEl = document.getElementById('custom-calc-warning');
    if(!warningEl) return;
    if(!calcEls.customNumA || !calcEls.customNumB) return;

    var a = parseInt(calcEls.customNumA.value, 10);
    var b = parseInt(calcEls.customNumB.value, 10);

    if(calcState.op === 'add'){
      if(!isNaN(a) && !isNaN(b) && a + b > 999){
        warningEl.style.display = 'inline-flex';
        warningEl.innerHTML = '<i data-lucide="alert-circle"></i> 加法總和不得超出 999（' + a + ' ＋ ' + b + ' ＝ ' + (a + b) + '）';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      } else {
        warningEl.style.display = 'none';
      }
    } else {
      if(!isNaN(a) && !isNaN(b) && a < b){
        warningEl.style.display = 'inline-flex';
        warningEl.innerHTML = '<i data-lucide="alert-circle"></i> 減法不得算出負值（' + a + ' − ' + b + ' ＜ 0）';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      } else {
        warningEl.style.display = 'none';
      }
    }
  }

  /* 套用自訂題目 (嚴格驗證 1 - 999，加法和不得超出 999，減法不得算出負值) */
  function applyCustomCalcProblem(){
    if(!calcEls.customNumA || !calcEls.customNumB) return;

    var rawA = (calcEls.customNumA.value || '').trim();
    var rawB = (calcEls.customNumB.value || '').trim();
    var a = parseInt(rawA, 10);
    var b = parseInt(rawB, 10);

    // 重設錯誤邊框
    calcEls.customNumA.classList.remove('input-error');
    calcEls.customNumB.classList.remove('input-error');

    if(!rawA || isNaN(a)){
      calcEls.customNumA.classList.add('input-error');
      showToast('請輸入 1 ~ 999 的整數喔！');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumA.focus();
      return;
    }

    if(!rawB || isNaN(b)){
      calcEls.customNumB.classList.add('input-error');
      showToast('請輸入 1 ~ 999 的整數喔！');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumB.focus();
      return;
    }

    if(a < 1 || a > 999){
      calcEls.customNumA.classList.add('input-error');
      showToast('被運算數範圍必須在 1 ~ 999 之間喔！');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumA.focus();
      calcEls.customNumA.select();
      return;
    }

    if(b < 1 || b > 999){
      calcEls.customNumB.classList.add('input-error');
      showToast('運算數範圍必須在 1 ~ 999 之間喔！');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumB.focus();
      calcEls.customNumB.select();
      return;
    }

    // 加法規則：相加總和不得超出 999
    if(calcState.op === 'add' && a + b > 999){
      calcEls.customNumA.classList.add('input-error');
      calcEls.customNumB.classList.add('input-error');
      showToast('加法運算中，相加的和不得超出 999 喔！（目前為 ' + (a + b) + '）');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumB.focus();
      calcEls.customNumB.select();
      return;
    }

    // 減法規則：被減數不得小於減數，不得算出負值
    if(calcState.op === 'sub' && a < b){
      calcEls.customNumA.classList.add('input-error');
      calcEls.customNumB.classList.add('input-error');
      showToast('減法運算中，被減數必須大於或等於減數，不能算出負值喔！');
      if(MathApp.sfx) MathApp.sfx('boundary');
      calcEls.customNumA.focus();
      calcEls.customNumA.select();
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

  /* 支援實體鍵盤直接輸入、Enter 送出與即時防呆 */
  function setupCustomInputKeyboard(){
    [calcEls.customNumA, calcEls.customNumB].forEach(function(inputEl){
      if(!inputEl) return;

      // 支援鍵盤按 Enter 鍵直接開始演示
      inputEl.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          applyCustomCalcProblem();
        }
      });

      // 監聽輸入字元：過濾非正整數字元、限制最大 3 位數、即時移除錯誤標記
      inputEl.addEventListener('input', function(){
        this.classList.remove('input-error');
        var clean = this.value.replace(/[^0-9]/g, '');
        if(clean.length > 3){
          clean = clean.slice(0, 3);
        }
        if(this.value !== clean){
          this.value = clean;
        }
        checkCustomWarningLive();
      });

      // 聚焦時自動選取內容，方便直接鍵入替換
      inputEl.addEventListener('focus', function(){
        this.select();
      });
    });
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
        calcEls.customNumA.classList.remove('input-error');
        calcEls.customNumB.classList.remove('input-error');
        updateCustomLabels();
        // 自動聚焦並反白選取第一個輸入框，方便直接鍵盤打字輸入
        setTimeout(function(){
          if(calcEls.customNumA){
            calcEls.customNumA.focus();
            calcEls.customNumA.select();
          }
        }, 60);
      }
    });
  }
  if(calcEls.applyCustomBtn){
    calcEls.applyCustomBtn.addEventListener('click', applyCustomCalcProblem);
  }

  // 初始化自訂輸入框鍵盤支援
  setupCustomInputKeyboard();
  updateCustomLabels();
  if(calcEls.stepNextBtn)   calcEls.stepNextBtn.addEventListener('click', calcNextStep);
  if(calcEls.stepPrevBtn)   calcEls.stepPrevBtn.addEventListener('click', calcPrevStep);
  if(calcEls.stepReplayBtn) calcEls.stepReplayBtn.addEventListener('click', calcReplayStep);
  if(calcEls.stepAutoBtn)   calcEls.stepAutoBtn.addEventListener('click', toggleAutoPlay);
  if(calcEls.speakBtn){
    calcEls.speakBtn.addEventListener('click', function(){
      var d = getCalcDecomp(calcState.numA, calcState.numB, calcState.op);
      var info = getStepExplanation(d, calcState.step);
      MathApp.speak(info.speak);
    });
  }

  // 初始化預設範例 Chip
  renderCalcPresetChips();


  // 監聽主分頁切換至 calc 時進行視圖渲染
  MathApp.on("tabChange", function(tab){
    if(tab === "calc"){
      renderCalcView();
    }
  });

  MathApp.calc = {
    init: function(){
      renderCalcPresetChips();
      renderCalcView();
    },
    renderCalcView: renderCalcView,
    getCalcDecomp: getCalcDecomp,
    getStepExplanation: getStepExplanation,
    nextStep: calcNextStep,
    prevStep: calcPrevStep,
    replayStep: calcReplayStep,
    toggleAutoPlay: toggleAutoPlay,
    setOp: setCalcOp,
    getState: function(){ return calcState; }
  };

})();