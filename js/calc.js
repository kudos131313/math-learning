/**
 * ==========================================================================
 * 直式加減法概念學習教室模組 (VERTICAL CALCULATION LAB)
 * ==========================================================================
 */
import { CALC_PRESETS, getCalcDecomp, getStepExplanation } from '../src/domain/vertical-calc.js';
import { createCalcBlockAnimations } from '../src/calc/block-animations.js';
import { createCalcStageRenderer } from '../src/calc/stage-renderer.js';

(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var calcPresets = CALC_PRESETS;

  function showToast(msg){
    if(MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast(msg);
    }
  }

  var calcState = {
    op: 'add',           // 'add' 或 'sub'
    numA: 28,            // 被運算數 (1~99)
    numB: 15,            // 運算數 (1~99)
    step: 0,             // 0: 對齊, 1: 算個位, 2: 進位/借位處理, 3: 算十位, 4: 完成
    isAutoPlaying: false,
    autoTimer: null,
    isAnimating: false   // 積木物理級動態播放鎖
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

  var blockAnim = createCalcBlockAnimations({
    calcEls: calcEls,
    calcState: calcState,
    prefersReduced: prefersReduced,
    getBlockSvg: function(kind){ return MathApp.utils.getBlockSvg(kind); },
    sfx: function(name){ if(MathApp.sfx) MathApp.sfx(name); }
  });

  var stageRenderer = createCalcStageRenderer({
    calcEls: calcEls,
    calcState: calcState,
    prefersReduced: prefersReduced,
    blockAnim: blockAnim
  });

  var cleanupCalcBlockAnimations = blockAnim.cleanupCalcBlockAnimations;
  var playDeductSlashAnimation = blockAnim.playDeductSlashAnimation;
  var playBlockCarryAnimation = blockAnim.playBlockCarryAnimation;
  var playBlockBorrowAnimation = blockAnim.playBlockBorrowAnimation;
  var renderCalcBlocksStage = stageRenderer.renderCalcBlocksStage;
  var renderVerticalMathBoard = stageRenderer.renderVerticalMathBoard;
  var animateVerticalStep = stageRenderer.animateVerticalStep;

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
    calcEls.stepNextBtn.innerHTML = (step >= 4)
      ? '<span data-lucide="check" aria-hidden="true"></span><span>已完成</span>'
      : '<span>下一步</span><span data-lucide="arrow-right" aria-hidden="true"></span>';
    if(MathApp.refreshIcons) MathApp.refreshIcons();

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
      calcEls.stepAutoBtn.innerHTML = '<span data-lucide="play-circle" aria-hidden="true"></span><span>自動演示</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
  }
  function toggleAutoPlay(){
    if(calcState.isAutoPlaying){
      stopAutoPlay();
    } else {
      calcState.isAutoPlaying = true;
      calcEls.stepAutoBtn.innerHTML = '<span data-lucide="pause-circle" aria-hidden="true"></span><span>暫停演示</span>';
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
        warningEl.innerHTML = '<span data-lucide="alert-circle" aria-hidden="true"></span><span>加法總和不得超出 999（' + a + ' ＋ ' + b + ' ＝ ' + (a + b) + '）</span>';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      } else {
        warningEl.style.display = 'none';
      }
    } else {
      if(!isNaN(a) && !isNaN(b) && a < b){
        warningEl.style.display = 'inline-flex';
        warningEl.innerHTML = '<span data-lucide="alert-circle" aria-hidden="true"></span><span>減法不得算出負值（' + a + ' − ' + b + ' ＜ 0）</span>';
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


  /* 外部載入指定算式（供數學冒險島等單元跳轉複習） */
  function loadProblem(a, b, op){
    var numA = Math.max(1, Math.min(999, Math.floor(Number(a) || 28)));
    var numB = Math.max(1, Math.min(999, Math.floor(Number(b) || 15)));
    var nextOp = op === 'sub' ? 'sub' : 'add';
    if(nextOp === 'add' && numA + numB > 999){
      numB = Math.max(1, 999 - numA);
    }
    if(nextOp === 'sub' && numA < numB){
      var tmp = numA;
      numA = numB;
      numB = tmp;
    }
    stopAutoPlay();
    calcState.op = nextOp;
    if(calcEls.btnOpAdd && calcEls.btnOpSub){
      calcEls.btnOpAdd.classList.toggle('active', nextOp === 'add');
      calcEls.btnOpAdd.setAttribute('aria-selected', String(nextOp === 'add'));
      calcEls.btnOpSub.classList.toggle('active', nextOp === 'sub');
      calcEls.btnOpSub.setAttribute('aria-selected', String(nextOp === 'sub'));
    }
    updateCustomLabels();
    calcState.numA = numA;
    calcState.numB = numB;
    calcState.step = 0;
    renderCalcPresetChips();
    renderCalcView(false);
  }

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
    loadProblem: loadProblem,
    nextStep: calcNextStep,
    prevStep: calcPrevStep,
    replayStep: calcReplayStep,
    toggleAutoPlay: toggleAutoPlay,
    setOp: setCalcOp,
    getState: function(){ return calcState; }
  };

})();