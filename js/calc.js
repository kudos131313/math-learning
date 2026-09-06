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

  /* 渲染具體積木群組 (十位與個位) */
  function createBlockColGroupHtml(title, kind, count, titleClass){
    var html = '<div class="block-col-group">';
    html += '<span class="block-col-title ' + (titleClass || '') + '">' + title + ' (' + count + ')</span>';
    html += '<div class="block-items-wrap">';
    if(count === 0){
      html += '<span style="font-size:12px;color:var(--ink-soft);padding:4px;">0 (無積木)</span>';
    } else {
      html += MathApp.utils.renderGroupedBlocksHtml(kind, count);
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
        actHtml += MathApp.utils.renderGroupedBlocksHtml('o', d.o_sum);
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
        actHtml2 += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.renderGroupedBlocksHtml('o', 10) + '</div>';
        actHtml2 += '<span class="action-transform-arrow">➔ 捆成 ➔</span>';
        actHtml2 += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('t') + '<b style="color:var(--t-color-dark);">新長條 (十)</b></div>';
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
        if(d.isAcrossZeroBorrow){
          calcEls.actionBoxTitle.innerHTML = '⚠️ 個位不夠減 ＋ 十位是 0 警告！';
          calcEls.actionBoxContent.innerHTML =
            '<span style="font-size:13.5px;font-weight:700;color:var(--bad);">' +
            '個位只有 ' + d.a_o + ' 顆拿不走 ' + d.b_o + ' 顆，且十位是 0 沒得借！必須向百位借 1 個百（拆成 10 條十），再借 1 條給個位！' +
            '</span>';
        } else if(d.needsBorrow_o){
          calcEls.actionBoxTitle.innerHTML = '⚠️ 個位不夠減警告：個位只有 ' + d.a_o + ' 顆，拿不走 ' + d.b_o + ' 顆！';
          calcEls.actionBoxContent.innerHTML =
            '<span style="font-size:13.5px;font-weight:700;color:var(--bad);">' +
            '必須向十位借 1 條十（10 顆珠子）來拆開幫忙喔！' +
            '</span>';
        } else {
          calcEls.actionBoxTitle.innerHTML = '✅ 個位夠減：直接從 ' + d.a_o + ' 顆拿走 ' + d.b_o + ' 顆';
          calcEls.actionBoxContent.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span>剩餘：</span>' + MathApp.utils.renderGroupedBlocksHtml('o', d.ans_o) +
            '</div>';
        }
      } else if(step === 2 && d.needsBorrow_o){
        calcEls.actionBox.style.display = 'block';
        if(d.isAcrossZeroBorrow){
          calcEls.actionBoxTitle.innerHTML = '✂️ 百位退位：1 個百 ➔ 拆成 10 條十 ➔ 十位留 9 條，借 1 條 (10 顆) 給個位！';
          var subActHtmlZero = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
          subActHtmlZero += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('h') + '<b>向百位借 1 個百</b></div>';
          subActHtmlZero += '<span class="action-transform-arrow">➔ 拆成 ➔</span>';
          subActHtmlZero += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.renderGroupedBlocksHtml('t', 9) + '<span style="font-size:12.5px;font-weight:700;color:var(--t-color-dark);">(十位留 9 條)</span></div>';
          subActHtmlZero += '<span class="action-transform-arrow">＋ 借 10 顆 ➔</span>';
          subActHtmlZero += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.renderGroupedBlocksHtml('o', 10) + '<span style="font-size:12.5px;font-weight:700;color:var(--o-color-dark);">(個位得 10 顆)</span></div>';
          subActHtmlZero += '<span style="font-size:13px;color:var(--ink-soft);">個位現在有 ' + d.a_o + ' + 10 = <b>' + d.effective_o + '</b> 顆了！</span>';
          subActHtmlZero += '</div>';
          calcEls.actionBoxContent.innerHTML = subActHtmlZero;
        } else {
          calcEls.actionBoxTitle.innerHTML = '✂️ 借一拆十：1 條十 ➔ 拆成 10 顆一！';
          var subActHtml = '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
          subActHtml += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.blockGlyph('t') + '<b>向十位借 1 條</b></div>';
          subActHtml += '<span class="action-transform-arrow">➔ 散開成 ➔</span>';
          subActHtml += '<div style="display:flex;align-items:center;gap:4px;">' + MathApp.utils.renderGroupedBlocksHtml('o', 10) + '</div>';
          subActHtml += '<span style="font-size:13px;color:var(--ink-soft);">個位現在有 ' + d.a_o + ' + 10 = <b>' + d.effective_o + '</b> 顆了！</span>';
          subActHtml += '</div>';
          calcEls.actionBoxContent.innerHTML = subActHtml;
        }
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
    var showCarry = (d.op === 'add' && d.needsCarry && step >= 2);
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
      // 十位劃線：個位向十位借位 (step >= 2)
      if(d.needsBorrow_o && step >= 2){
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
    if(showCarry){
      mark_t = '<span class="vm-carry-badge" title="滿十進一">1</span>';
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
            text: '向十位借 1 條十，十位劃掉記上剩餘的 <em>' + d.borrowed_t + '</em>；拆成 10 顆珠子到個位，個位變成 <em>' + d.effective_o + '</em> 顆，' + d.effective_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>！',
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
        var subExpText = '';
        var subExpSpeak = '';

        if(d.isAcrossZeroBorrow){
          subExpText = '接著算十位：看著十位頭頂沒被劃掉的 <em>9</em> 條十。<em>9 − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：十位剩下 9 條十，9 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，在十位寫上 ' + d.ans_t + '！';
        } else if(d.needsBorrow_t){
          subExpText = '接著算十位：百位劃掉記 <em>' + d.borrowed_h + '</em>，十位向百位借 10 條，頭頂記 <em>' + d.effective_t + '</em>。<em>' + d.effective_t + ' − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
          subExpSpeak = '接著算十位：百位借出 1 剩下 ' + d.borrowed_h + '，十位頭頂記 ' + d.effective_t + '，減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
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

    // 1. 加法進位：滿十進一弧線飛躍
    if(step === 2 && d.op === 'add' && d.needsCarry){
      var carryBadge = document.querySelector('.vm-carry-badge');
      var cellO = document.querySelector('.vm-cell-o .vm-num-box');
      if(carryBadge && cellO){
        var rBadge = carryBadge.getBoundingClientRect();
        var rO = cellO.getBoundingClientRect();

        var flyer = document.createElement('div');
        flyer.className = 'anime-carry-flyer';
        flyer.textContent = '1';
        flyer.style.position = 'fixed';
        flyer.style.left = rO.left + 'px';
        flyer.style.top = rO.top + 'px';
        flyer.style.zIndex = '9999';
        flyer.style.pointerEvents = 'none';
        document.body.appendChild(flyer);

        carryBadge.style.opacity = '0';

        window.anime({
          targets: flyer,
          left: rBadge.left + 'px',
          top: [
            { value: (rO.top - 46) + 'px', duration: 320, easing: 'easeOutQuad' },
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
    if(calcState.step > 0){
      calcState.step--;
      renderCalcView(true);
      if(MathApp.sfx) MathApp.sfx('click');
    }
  }

  /* 重播本步 */
  function calcReplayStep(){
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