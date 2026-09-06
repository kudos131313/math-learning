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

  /* ---------------- 千位數模式開關 (THOUSAND MODE) ---------------- */
  var thousandEnabled = false;
  var thousandToggleBtn = document.getElementById('toggle-thousand');

  function setThousandMode(enabled){
    thousandEnabled = enabled;
    if(thousandToggleBtn){
      thousandToggleBtn.setAttribute('aria-pressed', String(enabled));
      thousandToggleBtn.innerHTML = enabled 
        ? '<i data-lucide="box"></i><span>千位數：開啟</span>' 
        : '<i data-lucide="box"></i><span>千位數：關閉</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
    document.body.classList.toggle('thousand-mode', enabled);

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

  /* ---------------- 主分頁切換 (MAIN UNIT TABS: LEARN vs CALC) ---------------- */
  var mainTabLearn = document.getElementById('main-tab-learn');
  var mainTabCalc  = document.getElementById('main-tab-calc');
  var panelLearn   = document.getElementById('panel-learn');
  var panelCalc    = document.getElementById('panel-calc');

  function switchMainTab(tab){
    // 向前相容：若傳入 'quiz'，自動導流至位值探索的測驗子分頁
    if(tab === 'quiz'){
      switchMainTab('learn');
      switchSubTab('pv', 'quiz');
      return;
    }

    var tabs = [
      { id: 'learn', btn: mainTabLearn, panel: panelLearn },
      { id: 'calc',  btn: mainTabCalc,  panel: panelCalc }
    ];

    tabs.forEach(function(item){
      if(!item.btn || !item.panel) return;
      var isActive = (item.id === tab);
      item.btn.classList.toggle('active', isActive);
      item.btn.setAttribute('aria-selected', String(isActive));
      item.panel.classList.toggle('active', isActive);
    });

    if(MathApp.sfx) MathApp.sfx('click');

    // 工具列按鈕依單元智慧適配：千位數僅在位值探索單元呈現
    if(thousandToggleBtn){
      thousandToggleBtn.style.display = (tab === 'learn') ? 'inline-block' : 'none';
    }

    // 發布主單元切換事件
    MathApp.emit('tabChange', tab);
  }

  if(mainTabLearn) mainTabLearn.addEventListener('click', function(){ switchMainTab('learn'); });
  if(mainTabCalc)  mainTabCalc.addEventListener('click',  function(){ switchMainTab('calc'); });

  /* ---------------- 單元內部子分頁切換 (UNIT SUB TABS) ---------------- */
  function switchSubTab(unit, subTab){
    var subTabs = document.querySelectorAll('[id^="subtab-' + unit + '-"]');
    var subPanels = document.querySelectorAll('[id^="subpanel-' + unit + '-"]');

    subTabs.forEach(function(btn){
      var isTarget = (btn.id === ('subtab-' + unit + '-' + subTab));
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', String(isTarget));
    });

    subPanels.forEach(function(panel){
      var isTarget = (panel.id === ('subpanel-' + unit + '-' + subTab));
      panel.classList.toggle('active', isTarget);
    });

    if(MathApp.sfx) MathApp.sfx('click');

    // 發布子分頁切換事件
    MathApp.emit('subTabChange', { unit: unit, subTab: subTab });
  }

  // 自動為所有單元子分頁按鈕綁定切換事件
  document.querySelectorAll('.unit-sub-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.id; // 如 subtab-pv-quiz 或 subtab-calc-learn
      var parts = id.replace('subtab-', '').split('-');
      var unit = parts[0];
      var subTab = parts.slice(1).join('-');
      switchSubTab(unit, subTab);
    });
  });

  // 直式加減法「返回算則操作台」按鈕跳轉
  var gotoCalcDemoBtn = document.getElementById('btn-goto-calc-demo');
  if(gotoCalcDemoBtn){
    gotoCalcDemoBtn.addEventListener('click', function(){
      switchSubTab('calc', 'learn');
    });
  }

  MathApp.tabs = {
    switchMainTab: switchMainTab,
    switchSubTab: switchSubTab
  };

})();
