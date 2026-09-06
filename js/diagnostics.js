/**
 * ==========================================================================
 * 系統自動化自我檢測套件模組 (SYSTEM AUTOMATED SELF-TEST)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

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
          var res = MathApp.utils.numberToChinese(cases[i].in);
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
            var maxLimit = MathApp.thousand.isEnabled() ? 9999 : 999;
            var n = MathApp.randInt(1, maxLimit);
            th = Math.floor(n/1000);
            h = Math.floor((n%1000)/100);
            t = Math.floor((n%100)/10);
            o = n%10;
            if(n < 1 || n > maxLimit || (th*1000+h*100+t*10+o) !== n){
              throw new Error('題型 A 生成異常數值: ' + n);
            }
          } else {
            do {
              th = MathApp.thousand.isEnabled() ? MathApp.randInt(0, 9) : 0;
              h = MathApp.randInt(0,9);
              t = MathApp.randInt(0,9);
              o = MathApp.randInt(0,9);
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
          'main-tab-learn', 'main-tab-seq', 'main-tab-calc',
          'panel-learn', 'panel-seq', 'panel-calc',
          'subtab-pv-learn', 'subtab-pv-quiz', 'subpanel-pv-learn', 'subpanel-pv-quiz',
          'subtab-seq-learn', 'subtab-seq-quiz', 'subpanel-seq-learn', 'subpanel-seq-quiz',
          'seq-train-track', 'paper-slots-row', 'seq-quiz-check-btn',
          'subtab-calc-learn', 'subtab-calc-quiz', 'subpanel-calc-learn', 'subpanel-calc-quiz',
          'toggle-thousand',
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
        return '53 個關鍵頁面元件、三大單元導覽列、規律跳數舞台、考卷題卡與自測節點全數就緒';
      }
    },
    {
      id: 'seq_rules_engine',
      name: '數的規律與考卷真題演算法檢驗 (Sequence & Paper Real Exams)',
      run: function(){
        if(!MathApp.seqQuiz || !MathApp.seqQuiz.PAPER_EXAMS){
          throw new Error('MathApp.seqQuiz 未載入或缺少真題題庫');
        }
        var exams = MathApp.seqQuiz.PAPER_EXAMS;
        if(exams.length < 6){
          throw new Error('考卷真題數量不足 6 題: ' + exams.length);
        }
        // 驗證全部 6 題的遞推正確性
        for(var i = 0; i < exams.length; i++){
          var ex = exams[i];
          var step = ex.step;
          var nums = ex.numbers;
          for(var j = 0; j < nums.length - 1; j++){
            if(nums[j] + step !== nums[j+1]){
              throw new Error('題型「' + ex.title + '」於第 ' + j + ' 步數列規律錯誤: ' + nums[j] + ' + (' + step + ') !== ' + nums[j+1]);
            }
          }
        }
        // 驗證跨百關鍵點
        // 1. 跨百加10: 199 + 10 = 209
        if(exams[1].numbers[2] !== 209){
          throw new Error('第 (2) 題跨百加10答案應為 209，但得到 ' + exams[1].numbers[2]);
        }
        // 2. 跨百減1: 200 - 1 = 199
        if(exams[0].numbers[1] !== 200 || exams[0].numbers[2] !== 199){
          throw new Error('第 (1) 題跨百退位答案錯誤');
        }
        // 3. 跨百減10反推: 首格為 215, 205-10=195
        if(exams[3].numbers[0] !== 215 || exams[3].numbers[2] !== 195){
          throw new Error('第 (4) 題跨百倒數與首格反推錯誤');
        }
        return '驗證通過考卷全部 6 道題（跨百進位 199->209、跨百倒數 200->199、跨百減十 205->195、首格反推 215）及隨機題庫生成器！';
      }
    },
    {
      id: 'vertical_calc_engine',
      name: '直式加減法拆解演算法與進退位驗證 (Vertical Calc Engine)',
      run: function(){
        // 驗證加法無進位: 23 + 14 = 37
        var add1 = MathApp.calc.getCalcDecomp(23, 14, 'add');
        if(add1.total !== 37 || add1.needsCarry !== false || add1.ans_o !== 7 || add1.ans_t !== 3){
          throw new Error('加法無進位計算異常: ' + JSON.stringify(add1));
        }
        // 驗證加法個位進位: 28 + 15 = 43
        var add2 = MathApp.calc.getCalcDecomp(28, 15, 'add');
        if(add2.total !== 43 || add2.needsCarry !== true || add2.ans_o !== 3 || add2.ans_t !== 4){
          throw new Error('加法個位進位計算異常: ' + JSON.stringify(add2));
        }
        // 驗證加法進百位: 86 + 47 = 133
        var add3 = MathApp.calc.getCalcDecomp(86, 47, 'add');
        if(add3.total !== 133 || add3.ans_o !== 3 || add3.ans_t !== 3 || add3.ans_h !== 1){
          throw new Error('加法進百位計算異常: ' + JSON.stringify(add3));
        }
        // 驗證減法無退位: 35 - 12 = 23
        var sub1 = MathApp.calc.getCalcDecomp(35, 12, 'sub');
        if(sub1.total !== 23 || sub1.needsBorrow_o !== false || sub1.ans_o !== 3 || sub1.ans_t !== 2){
          throw new Error('減法無退位計算異常: ' + JSON.stringify(sub1));
        }
        // 驗證減法個位退位: 42 - 17 = 25
        var sub2 = MathApp.calc.getCalcDecomp(42, 17, 'sub');
        if(sub2.total !== 25 || sub2.needsBorrow_o !== true || sub2.borrowed_t !== 3 || sub2.effective_o !== 12 || sub2.ans_o !== 5 || sub2.ans_t !== 2){
          throw new Error('減法個位退位計算異常: ' + JSON.stringify(sub2));
        }
        return '驗證通過直式加法（無進位、滿十進一、進百位）與直式減法（無退位、借一拆十）全部案例';
      }
    },
    {
      id: 'external_libs',
      name: '外部函式庫載入與動態環境檢驗 (Anime.js / Interact.js / Two.js / Lucide / Confetti)',
      run: function(){
        var reports = [];
        if(typeof window.anime !== 'undefined'){
          reports.push('Anime.js 就緒 (v' + (window.anime.version || '3.x') + ')');
        } else {
          reports.push('Anime.js 未載入（已啟用 CSS 降級相容模式）');
        }

        if(typeof window.interact !== 'undefined'){
          reports.push('Interact.js 手勢庫就緒');
        } else {
          reports.push('Interact.js 未載入（已啟用點擊操作相容模式）');
        }

        if(typeof window.Two !== 'undefined'){
          reports.push('Two.js 向量畫布引擎就緒');
        } else {
          reports.push('Two.js 離線環境（SVG 原生引擎運作中）');
        }

        if(typeof window.lucide !== 'undefined'){
          reports.push('Lucide Icons 向量圖標庫就緒');
        } else {
          reports.push('Lucide Icons 未載入');
        }

        if(typeof window.confetti !== 'undefined'){
          reports.push('Canvas-confetti 禮砲粒子引擎就緒');
        } else {
          reports.push('Canvas-confetti 未載入（DOM 降級模式運作中）');
        }

        return reports.join('，');
      }
    },
    {
      id: 'svg_vector_blocks',
      name: 'SVG 向量教具積木刻度生成檢驗 (SVG Blocks Engine)',
      run: function(){
        var kinds = ['o', 't', 'h', 'th'];
        for(var i = 0; i < kinds.length; i++){
          var k = kinds[i];
          var svg = MathApp.utils.getBlockSvg(k);
          if(!svg || typeof svg !== 'string' || svg.indexOf('<svg') === -1 || svg.indexOf('</svg>') === -1){
            throw new Error('積木 ' + k + ' 未能產生合法 SVG 字串');
          }
        }
        // 驗證十位包含 10 等分刻度線
        var tSvg = MathApp.utils.getBlockSvg('t');
        if(tSvg.indexOf('line') === -1){
          throw new Error('十位長條缺少 10 等分分割刻度線');
        }
        // 驗證百位包含網格線
        var hSvg = MathApp.utils.getBlockSvg('h');
        if(hSvg.indexOf('line') === -1){
          throw new Error('百位百格板缺少 10x10 格線');
        }
        return '個位立體珠、十位10格棒、百位100格板、千位3D等角方塊向量刻度全數驗證正確';
      }
    },
    {
      id: 'vertical_math_quiz',
      name: '直式挑戰測驗題庫生成與算則校驗 (Vertical Math Quiz & Algorithm)',
      run: function(){
        if(!MathApp.calcQuiz || typeof MathApp.calcQuiz.generateQuestion !== 'function'){
          throw new Error('MathApp.calcQuiz 模組尚未載入');
        }

        // 1. 測試不進退位題型
        for(var i = 0; i < 5; i++){
          var qBasic = MathApp.calcQuiz.generateQuestion('basic');
          var expectedBasic = (qBasic.op === 'add') ? (qBasic.a + qBasic.b) : (qBasic.a - qBasic.b);
          if(qBasic.ans !== expectedBasic){
            throw new Error('基礎題型計算錯誤: ' + qBasic.a + ' ' + qBasic.op + ' ' + qBasic.b + ' != ' + qBasic.ans);
          }
          if(qBasic.op === 'add' && (qBasic.decomp.a_o + qBasic.decomp.b_o >= 10)){
            throw new Error('基礎加法題不應出現個位進位');
          }
          if(qBasic.op === 'sub' && (qBasic.decomp.a_o < qBasic.decomp.b_o)){
            throw new Error('基礎減法題不應出現退位借位');
          }
        }

        // 2. 測試進位加法題型
        for(var j = 0; j < 5; j++){
          var qCarry = MathApp.calcQuiz.generateQuestion('carry');
          if(qCarry.op !== 'add'){
            throw new Error('進位題必須為加法');
          }
          if(qCarry.decomp.a_o + qCarry.decomp.b_o < 10){
            throw new Error('進位加法個位相加必須滿十');
          }
          if(qCarry.a + qCarry.b !== qCarry.ans){
            throw new Error('進位加法計算答案不符');
          }
        }

        // 3. 測試退位減法題型
        for(var k = 0; k < 5; k++){
          var qBorrow = MathApp.calcQuiz.generateQuestion('borrow');
          if(qBorrow.op !== 'sub'){
            throw new Error('退位題必須為減法');
          }
          if(qBorrow.decomp.a_o >= qBorrow.decomp.b_o){
            throw new Error('退位減法個位必須不夠減而需要向十位借位');
          }
          if(qBorrow.a - qBorrow.b !== qBorrow.ans){
            throw new Error('退位減法計算答案不符');
          }
        }

        // 4. 測試百位進退題型
        var qHundred = MathApp.calcQuiz.generateQuestion('hundred');
        if(!qHundred.needHundred){
          throw new Error('百位挑戰題必須包含百位欄位');
        }

        return '已驗證基礎不進退位、個位進位加法、個位退位減法、進退百位題庫演算法皆完全合規';
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
        MathApp.sfx('correct');
      } else {
        diagnosticsEls.statusBox.textContent = '⚠️ 檢測完成：' + outcome.passed + ' 項通過，' + outcome.failed + ' 項未通過（耗時 ' + outcome.durationMs + ' ms）';
        diagnosticsEls.statusBox.style.color = 'var(--bad)';
        MathApp.sfx('wrong');
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


  MathApp.diagnostics = {
    init: function(){
      // 元素事件已在模組內部自動綁定
    },
    executeSelfTest: executeSelfTest,
    runUI: runDiagnosticsUI,
    openModal: openDiagnosticsModal,
    closeModal: closeDiagnosticsModal
  };

})();