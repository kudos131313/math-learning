/**
 * ==========================================================================
 * 核心命名空間、事件匯流排與全域狀態管理 (CORE & EVENT BUS)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  /* 啟用 iOS Safari 的 :active 觸控回饋狀態 */
  document.addEventListener('touchstart', function(){}, { passive: true });

  /* ---------------- 輕量事件匯流排 (EVENT BUS) ---------------- */
  var eventListeners = {};

  MathApp.on = function(eventName, callback){
    if(!eventListeners[eventName]) eventListeners[eventName] = [];
    eventListeners[eventName].push(callback);
  };

  MathApp.off = function(eventName, callback){
    if(!eventListeners[eventName]) return;
    eventListeners[eventName] = eventListeners[eventName].filter(function(cb){
      return cb !== callback;
    });
  };

  MathApp.emit = function(eventName, payload){
    if(!eventListeners[eventName]) return;
    eventListeners[eventName].forEach(function(callback){
      try {
        callback(payload);
      } catch(err){
        console.error('[MathApp Event Error] ' + eventName + ':', err);
      }
    });
  };

  /* ---------------- 主題切換 (THEME) ---------------- */
  var themeToggleBtn = document.getElementById('toggle-theme');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(isDark){
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if(themeToggleBtn){
      themeToggleBtn.setAttribute('aria-pressed', String(isDark));
      themeToggleBtn.textContent = isDark ? '☀️ 淺色模式' : '🌙 深色模式';
    }
  }

  function toggleTheme(){
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
    if(MathApp.sfx) MathApp.sfx('click');
  }

  if(themeToggleBtn){
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  applyTheme(prefersDark);

  MathApp.theme = {
    applyTheme: applyTheme,
    toggleTheme: toggleTheme
  };

  /* ---------------- 千位數模式開關 (THOUSAND MODE) ---------------- */
  var thousandEnabled = false;
  var thousandToggleBtn = document.getElementById('toggle-thousand');

  function setThousandMode(enabled){
    thousandEnabled = enabled;
    if(thousandToggleBtn){
      thousandToggleBtn.setAttribute('aria-pressed', String(enabled));
      thousandToggleBtn.textContent = enabled ? '📦 千位數：開啟' : '📦 千位數：關閉';
    }
    document.body.classList.toggle('thousand-mode', enabled);

    // 更新頂部標題說明
    var subEl = document.getElementById('main-subtitle');
    if(subEl){
      subEl.textContent = enabled
        ? '用積木堆出數字，動手玩一玩，就能看懂每個數字裡藏著幾個千、幾個百、幾個十、幾個一！'
        : '用積木堆出數字，動手玩一玩，就能看懂每個數字裡藏著幾個百、幾個十、幾個一！';
    }

    // 發布千位數模式變更事件，讓各模組自動響應
    MathApp.emit('thousandChange', enabled);
  }

  if(thousandToggleBtn){
    thousandToggleBtn.addEventListener('click', function(){
      setThousandMode(!thousandEnabled);
      if(MathApp.sfx) MathApp.sfx('click');
      var msg = thousandEnabled ? '已開啟千位數模式，挑戰四位數！' : '已切換回三位數模式';
      if(MathApp.speak) MathApp.speak(msg);
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast(msg);
      }
    });
  }

  MathApp.thousand = {
    isEnabled: function(){ return thousandEnabled; },
    setMode: setThousandMode
  };

  /* ---------------- 主分頁切換 (MAIN TABS: LEARN vs CALC vs QUIZ) ---------------- */
  var mainTabLearn = document.getElementById('main-tab-learn');
  var mainTabCalc  = document.getElementById('main-tab-calc');
  var mainTabQuiz  = document.getElementById('main-tab-quiz');
  var panelLearn   = document.getElementById('panel-learn');
  var panelCalc    = document.getElementById('panel-calc');
  var panelQuiz    = document.getElementById('panel-quiz');

  function switchMainTab(tab){
    var tabs = [
      { id: 'learn', btn: mainTabLearn, panel: panelLearn },
      { id: 'calc',  btn: mainTabCalc,  panel: panelCalc },
      { id: 'quiz',  btn: mainTabQuiz,  panel: panelQuiz }
    ];

    tabs.forEach(function(item){
      if(!item.btn || !item.panel) return;
      var isActive = (item.id === tab);
      item.btn.classList.toggle('active', isActive);
      item.btn.setAttribute('aria-selected', String(isActive));
      item.panel.classList.toggle('active', isActive);
    });

    if(MathApp.sfx) MathApp.sfx('click');

    // 發布分頁切換事件
    MathApp.emit('tabChange', tab);
  }

  if(mainTabLearn) mainTabLearn.addEventListener('click', function(){ switchMainTab('learn'); });
  if(mainTabCalc)  mainTabCalc.addEventListener('click',  function(){ switchMainTab('calc'); });
  if(mainTabQuiz)  mainTabQuiz.addEventListener('click',  function(){ switchMainTab('quiz'); });

  MathApp.tabs = {
    switchMainTab: switchMainTab
  };

})();
