/**
 * ==========================================================================
 * 應用程式總進入點 (APP INITIALIZER)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  function initApp(){
    // 依序啟動各子模組
    if(MathApp.learn && typeof MathApp.learn.init === 'function'){
      MathApp.learn.init();
    }
    if(MathApp.quiz && typeof MathApp.quiz.init === 'function'){
      MathApp.quiz.init();
    }
    if(MathApp.seq && typeof MathApp.seq.init === 'function'){
      MathApp.seq.init();
    }
    if(MathApp.seqQuiz && typeof MathApp.seqQuiz.init === 'function'){
      MathApp.seqQuiz.init();
    }
    if(MathApp.calc && typeof MathApp.calc.init === 'function'){
      MathApp.calc.init();
    }
    if(MathApp.calcQuiz && typeof MathApp.calcQuiz.init === 'function'){
      MathApp.calcQuiz.init();
    }
    if(MathApp.diagnostics && typeof MathApp.diagnostics.init === 'function'){
      MathApp.diagnostics.init();
    }
    if(MathApp.refreshIcons){
      MathApp.refreshIcons();
    }

    console.log('🚀 數字積木屋（模組化架構）初始化完成！');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
