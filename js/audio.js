/**
 * ==========================================================================
 * 音效 (Web Audio API) 與語音朗讀 (SpeechSynthesis) 引擎 (AUDIO & VOICE)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var soundOn = true;
  var voiceOn = true;
  var audioCtx = null;

  function getAudioCtx(){
    if(!audioCtx){
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return null;
      audioCtx = new Ctx();
    }
    if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
    return audioCtx;
  }

  function tone(freq, offset, duration, type, vol){
    var ctx = getAudioCtx();
    if(!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var t0 = ctx.currentTime + offset;
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol || 0.14, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  function sfx(kind){
    if(!soundOn) return;
    if(kind === 'click'){
      tone(700, 0, 0.07, 'triangle', 0.10);
    } else if(kind === 'carry'){
      tone(523, 0, 0.12, 'sine', 0.14);
      tone(659, 0.09, 0.12, 'sine', 0.14);
      tone(784, 0.18, 0.16, 'sine', 0.14);
    } else if(kind === 'borrow'){
      tone(784, 0, 0.12, 'sine', 0.14);
      tone(523, 0.09, 0.18, 'sine', 0.14);
    } else if(kind === 'correct'){
      tone(523, 0, 0.1, 'sine', 0.15);
      tone(659, 0.08, 0.1, 'sine', 0.15);
      tone(784, 0.16, 0.1, 'sine', 0.15);
      tone(1047, 0.24, 0.22, 'sine', 0.15);
    } else if(kind === 'wrong'){
      tone(330, 0, 0.14, 'sine', 0.12);
      tone(247, 0.1, 0.22, 'sine', 0.12);
    } else if(kind === 'boundary'){
      tone(300, 0, 0.12, 'square', 0.08);
    }
  }

  // 偏好語音清單（越前面越優先）
  var VOICE_PREFS = [
    // 1. Google 雲端神經語音（Chrome 免費支援，自然度極高）
    'Google 普通話（台灣）',
    'Google 國語（臺灣）',
    'Google Chinese (Traditional)',

    // 2. 蘋果系統高品質語音（macOS / iOS）
    'Mei-Jia',
    'Sin-ji',

    // 3. Windows 本機離線語音（備用回退）
    'Microsoft Yating',             // 雅婷（比涵涵清晰）
    'Microsoft Hanhan',             // 涵涵
    'Microsoft HsiaoChen',          // 小臻離線版（若本機有安裝）
    'Microsoft Zhiwei',             // 志威（男聲備用）
  ];

  var _cachedVoice = undefined; // undefined = 未初始化，null = 找不到
  var _userCustomVoiceURI = null;
  try {
    _userCustomVoiceURI = localStorage.getItem('math_selected_voice_uri');
  } catch(e){}

  function pickBestVoice(){
    if(_cachedVoice !== undefined){
      return _cachedVoice;
    }
    var voices = window.speechSynthesis.getVoices();
    if(!voices || voices.length === 0){
      return null;
    }

    // 0. 若使用者有手動指定偏好語音，第一優先使用
    if(_userCustomVoiceURI){
      for(var u = 0; u < voices.length; u++){
        if((voices[u].voiceURI && voices[u].voiceURI === _userCustomVoiceURI) || voices[u].name === _userCustomVoiceURI){
          _cachedVoice = voices[u];
          return _cachedVoice;
        }
      }
    }

    // 1. 依偏好清單尋找
    for(var i = 0; i < VOICE_PREFS.length; i++){
      for(var j = 0; j < voices.length; j++){
        if(voices[j].name.indexOf(VOICE_PREFS[i]) !== -1){
          _cachedVoice = voices[j];
          return _cachedVoice;
        }
      }
    }

    // 2. 退而求其次：任何 zh-TW 聲音
    for(var k = 0; k < voices.length; k++){
      if(voices[k].lang === 'zh-TW'){
        _cachedVoice = voices[k];
        return _cachedVoice;
      }
    }
    // 3. 再退：任何中文聲音
    for(var m = 0; m < voices.length; m++){
      if(voices[m].lang && voices[m].lang.indexOf('zh') === 0){
        _cachedVoice = voices[m];
        return _cachedVoice;
      }
    }

    _cachedVoice = null; // 完全找不到，用瀏覽器預設
    return null;
  }

  // 單獨指定語音發聲測試（用於語音清單試聽）
  function speakWithVoice(text, targetVoice){
    if(!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      if(MathApp.utils && MathApp.utils.formatSpokenMathText){
        clean = MathApp.utils.formatSpokenMathText(clean);
      }
      var u = new SpeechSynthesisUtterance(clean);
      u.lang = (targetVoice && targetVoice.lang) ? targetVoice.lang : 'zh-TW';
      u.rate = 0.88;
      u.pitch = 1.0;
      u.volume = 0.95;
      if(targetVoice) u.voice = targetVoice;
      window.speechSynthesis.speak(u);
    } catch(e){
      console.error('[語音試聽] 發生錯誤：', e);
    }
  }

  // 頁尾語音狀態顯示與更新
  var voiceStatusCardEl = document.getElementById('voice-status-card');
  var voiceStatusNameEl = document.getElementById('voice-status-name');
  var voiceTestBtn = document.getElementById('voice-test-btn');

  function updateVoiceStatusUI(){
    if(!voiceStatusNameEl) return;
    if(!('speechSynthesis' in window)){
      voiceStatusNameEl.textContent = '您的瀏覽器不支援語音朗讀功能';
      if(voiceStatusCardEl) voiceStatusCardEl.classList.add('disabled');
      if(voiceTestBtn) voiceTestBtn.disabled = true;
      return;
    }

    if(!voiceOn){
      voiceStatusNameEl.innerHTML = '<span style="color:var(--ink-soft);font-weight:normal;">語音朗讀已關閉（可從頂部控制列開啟）</span>';
      if(voiceStatusCardEl) voiceStatusCardEl.classList.add('disabled');
      return;
    }

    if(voiceStatusCardEl) voiceStatusCardEl.classList.remove('disabled');
    if(voiceTestBtn) voiceTestBtn.disabled = false;

    var voices = window.speechSynthesis.getVoices();
    if(!voices || voices.length === 0){
      voiceStatusNameEl.innerHTML = '<span style="color:var(--ink-soft);font-weight:normal;">語音清單載入中（可點「語音清單」喚醒）...</span>';
      return;
    }

    var best = pickBestVoice();
    if(best){
      var isCustom = _userCustomVoiceURI && ((best.voiceURI && best.voiceURI === _userCustomVoiceURI) || best.name === _userCustomVoiceURI);
      var customTag = isCustom ? ' <span style="font-size:11px;background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:999px;font-weight:bold;">自訂指定</span>' : '';
      voiceStatusNameEl.innerHTML = best.name + (best.lang ? ' (' + best.lang + ')' : '') + customTag;
    } else {
      voiceStatusNameEl.textContent = '系統預設語音 (預設輸出)';
    }
  }

  // 語音清單非同步載入時重置快取，讓下次 speak() 重新挑選
  if('speechSynthesis' in window){
    window.speechSynthesis.addEventListener('voiceschanged', function(){
      _cachedVoice = undefined;
      updateVoiceStatusUI();
      if(voiceListModal && voiceListModal.style.display !== 'none'){
        renderVoiceList();
      }
    });
  }

  function speak(text){
    if(!voiceOn) return;
    if(!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      if(MathApp.utils && MathApp.utils.formatSpokenMathText){
        clean = MathApp.utils.formatSpokenMathText(clean);
      }
      var u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-TW';
      u.rate = 0.88;
      u.pitch = 1.0;
      u.volume = 0.95;
      var best = pickBestVoice();
      if(best) u.voice = best;

      // 更新頁尾狀態列並增加發聲動態反饋
      updateVoiceStatusUI();
      if(voiceStatusCardEl){
        voiceStatusCardEl.classList.add('speaking');
        u.onend = function(){ voiceStatusCardEl.classList.remove('speaking'); };
        u.onerror = function(){ voiceStatusCardEl.classList.remove('speaking'); };
      }

      window.speechSynthesis.speak(u);
    } catch(e){
      console.error('[語音] speak() 發生錯誤：', e);
      if(voiceStatusCardEl) voiceStatusCardEl.classList.remove('speaking');
    }
  }

  var soundToggleBtn = document.getElementById('toggle-sound');
  var voiceToggleBtn = document.getElementById('toggle-voice');

  if(soundToggleBtn){
    soundToggleBtn.addEventListener('click', function(){
      soundOn = !soundOn;
      soundToggleBtn.setAttribute('aria-pressed', String(soundOn));
      soundToggleBtn.innerHTML = soundOn 
        ? '<i data-lucide="volume-2"></i><span>音效</span>' 
        : '<i data-lucide="volume-x"></i><span>音效（關）</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
      if(soundOn) sfx('click');
    });
  }

  if(voiceToggleBtn){
    voiceToggleBtn.addEventListener('click', function(){
      voiceOn = !voiceOn;
      voiceToggleBtn.setAttribute('aria-pressed', String(voiceOn));
      voiceToggleBtn.innerHTML = voiceOn 
        ? '<i data-lucide="speech"></i><span>語音</span>' 
        : '<i data-lucide="message-square-off"></i><span>語音（關）</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
      if(!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      updateVoiceStatusUI();
    });
  }

  // 試聽按鈕點擊事件（兼具 iPad 手勢喚醒 Web Audio 與 SpeechSynthesis 效果）
  if(voiceTestBtn){
    voiceTestBtn.addEventListener('click', function(){
      // 若先前為關閉狀態，自動開啟語音
      if(!voiceOn && voiceToggleBtn){
        voiceOn = true;
        voiceToggleBtn.setAttribute('aria-pressed', 'true');
        voiceToggleBtn.innerHTML = '<i data-lucide="speech"></i><span>語音</span>';
        if(MathApp.refreshIcons) MathApp.refreshIcons();
      }
      var best = pickBestVoice();
      var voiceNameText = best ? best.name : '系統預設';
      updateVoiceStatusUI();
      speak('目前使用的語音是：' + voiceNameText);
    });
  }

  // ================= 語音清單彈窗面板邏輯 (VOICE LIST MODAL) =================
  var voiceListModal     = document.getElementById('voice-list-modal');
  var openVoiceModalBtn  = document.getElementById('open-voice-modal-btn');
  var closeVoiceModalBtn = document.getElementById('close-voice-modal-btn');
  var dismissVoiceModalBtn = document.getElementById('dismiss-voice-modal-btn');
  var rescanVoicesBtn    = document.getElementById('rescan-voices-btn');
  var resetVoicePrefBtn  = document.getElementById('reset-voice-pref-btn');
  var filterVoiceZhBtn   = document.getElementById('filter-voice-zh');
  var filterVoiceAllBtn  = document.getElementById('filter-voice-all');
  var voiceItemListEl    = document.getElementById('voice-item-list');
  var currentVoiceFilter = 'zh';

  function openVoiceListModal(){
    if(!voiceListModal) return;
    voiceListModal.style.display = 'flex';
    renderVoiceList();
    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  function closeVoiceListModal(){
    if(!voiceListModal) return;
    voiceListModal.style.display = 'none';
  }

  function isChineseVoice(v){
    if(!v) return false;
    var lang = (v.lang || '').toLowerCase();
    var name = (v.name || '').toLowerCase();
    return lang.indexOf('zh') !== -1 ||
           name.indexOf('chinese') !== -1 ||
           name.indexOf('mandarin') !== -1 ||
           name.indexOf('taiwan') !== -1 ||
           name.indexOf('國語') !== -1 ||
           name.indexOf('普通話') !== -1 ||
           name.indexOf('mei-jia') !== -1 ||
           name.indexOf('sin-ji') !== -1 ||
           name.indexOf('yating') !== -1 ||
           name.indexOf('hanhan') !== -1;
  }

  function renderVoiceList(){
    if(!voiceItemListEl) return;
    voiceItemListEl.innerHTML = '';

    if(!('speechSynthesis' in window)){
      voiceItemListEl.innerHTML = '<div class="voice-empty-tip">您的瀏覽器不支援 Web Speech API 語音合成。</div>';
      return;
    }

    var allVoices = window.speechSynthesis.getVoices() || [];
    if(allVoices.length === 0){
      voiceItemListEl.innerHTML = '<div class="voice-empty-tip">' +
        '<p style="margin-bottom:8px;">⚠️ 語音清單尚未載入或為空</p>' +
        '<p style="font-size:12.5px;">在 iPad 或行動裝置上，請點擊上方「重新掃描」按鈕以喚醒語音資料庫。</p>' +
        '</div>';
      return;
    }

    var currentVoice = pickBestVoice();

    // 依篩選條件過濾
    var filtered = allVoices.filter(function(v){
      if(currentVoiceFilter === 'zh') return isChineseVoice(v);
      return true;
    });

    if(filtered.length === 0){
      voiceItemListEl.innerHTML = '<div class="voice-empty-tip">' +
        '<p>未找到符合「' + (currentVoiceFilter === 'zh' ? '中文語音' : '所有語音') + '」的語音。</p>' +
        '<p style="font-size:12.5px;margin-top:6px;">您可以切換到「全部語音」查看目前系統安裝的所有聲音。</p>' +
        '</div>';
      return;
    }

    // 排序：目前使用的排第一，接著中文（zh-TW > zh-HK > zh-CN），其餘排後
    filtered.sort(function(a, b){
      var aIsCurrent = currentVoice && ((a.voiceURI && a.voiceURI === currentVoice.voiceURI) || a.name === currentVoice.name);
      var bIsCurrent = currentVoice && ((b.voiceURI && b.voiceURI === currentVoice.voiceURI) || b.name === currentVoice.name);
      if(aIsCurrent) return -1;
      if(bIsCurrent) return 1;

      var aIsZhTW = (a.lang === 'zh-TW');
      var bIsZhTW = (b.lang === 'zh-TW');
      if(aIsZhTW && !bIsZhTW) return -1;
      if(!aIsZhTW && bIsZhTW) return 1;

      return a.name.localeCompare(b.name);
    });

    filtered.forEach(function(v){
      var isCurrent = currentVoice && ((v.voiceURI && v.voiceURI === currentVoice.voiceURI) || v.name === currentVoice.name);
      var isPref = false;
      for(var p = 0; p < VOICE_PREFS.length; p++){
        if(v.name.indexOf(VOICE_PREFS[p]) !== -1){
          isPref = true;
          break;
        }
      }

      var item = document.createElement('div');
      item.className = 'voice-card-item' + (isCurrent ? ' selected' : '');

      var infoDiv = document.createElement('div');
      infoDiv.className = 'voice-card-info';

      var titleRow = document.createElement('div');
      titleRow.className = 'voice-card-title-row';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'voice-card-name';
      nameSpan.textContent = v.name;
      titleRow.appendChild(nameSpan);

      if(isCurrent){
        var curTag = document.createElement('span');
        curTag.className = 'voice-card-tag current';
        curTag.textContent = '✓ 目前使用中';
        titleRow.appendChild(curTag);
      }

      if(isPref){
        var prefTag = document.createElement('span');
        prefTag.className = 'voice-card-tag pref';
        prefTag.textContent = '★ 推薦語音';
        titleRow.appendChild(prefTag);
      }

      var langTag = document.createElement('span');
      langTag.className = 'voice-card-tag lang';
      langTag.textContent = v.lang || '未指定語系';
      titleRow.appendChild(langTag);

      infoDiv.appendChild(titleRow);

      var subDiv = document.createElement('div');
      subDiv.className = 'voice-card-sub';
      subDiv.textContent = (v.localService ? '離線語音' : '網路語音') + (v.default ? ' · 系統預設' : '');
      infoDiv.appendChild(subDiv);

      item.appendChild(infoDiv);

      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'voice-card-actions';

      // 試聽按鈕
      var testBtn = document.createElement('button');
      testBtn.type = 'button';
      testBtn.className = 'ghost-btn voice-card-btn';
      testBtn.innerHTML = '<i data-lucide="volume-2"></i> 試聽';
      testBtn.addEventListener('click', function(e){
        e.stopPropagation();
        speakWithVoice('你好，我是 ' + v.name + '，很高興為你朗讀。', v);
      });
      actionsDiv.appendChild(testBtn);

      // 選取為使用按鈕
      var selectBtn = document.createElement('button');
      selectBtn.type = 'button';
      selectBtn.className = isCurrent ? 'primary-btn voice-card-btn' : 'ghost-btn voice-card-btn';
      selectBtn.textContent = isCurrent ? '使用中' : '設為使用';
      selectBtn.disabled = isCurrent;
      selectBtn.addEventListener('click', function(e){
        e.stopPropagation();
        _userCustomVoiceURI = v.voiceURI || v.name;
        try {
          localStorage.setItem('math_selected_voice_uri', _userCustomVoiceURI);
        } catch(err){}
        _cachedVoice = undefined;
        updateVoiceStatusUI();
        renderVoiceList();
        if(MathApp.refreshIcons) MathApp.refreshIcons();
        speak('已切換使用 ' + v.name);
      });
      actionsDiv.appendChild(selectBtn);

      item.appendChild(actionsDiv);
      voiceItemListEl.appendChild(item);
    });

    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  // 綁定面板互動事件
  if(openVoiceModalBtn){
    openVoiceModalBtn.addEventListener('click', openVoiceListModal);
  }
  if(closeVoiceModalBtn){
    closeVoiceModalBtn.addEventListener('click', closeVoiceListModal);
  }
  if(dismissVoiceModalBtn){
    dismissVoiceModalBtn.addEventListener('click', closeVoiceListModal);
  }
  if(voiceListModal){
    voiceListModal.addEventListener('click', function(e){
      if(e.target === voiceListModal) closeVoiceListModal();
    });
  }

  // 篩選按鈕
  if(filterVoiceZhBtn){
    filterVoiceZhBtn.addEventListener('click', function(){
      currentVoiceFilter = 'zh';
      filterVoiceZhBtn.classList.add('active');
      if(filterVoiceAllBtn) filterVoiceAllBtn.classList.remove('active');
      renderVoiceList();
    });
  }
  if(filterVoiceAllBtn){
    filterVoiceAllBtn.addEventListener('click', function(){
      currentVoiceFilter = 'all';
      filterVoiceAllBtn.classList.add('active');
      if(filterVoiceZhBtn) filterVoiceZhBtn.classList.remove('active');
      renderVoiceList();
    });
  }

  // 重新掃描語音
  if(rescanVoicesBtn){
    rescanVoicesBtn.addEventListener('click', function(){
      _cachedVoice = undefined;
      updateVoiceStatusUI();
      renderVoiceList();
      if(MathApp.sfx) MathApp.sfx('click');
    });
  }

  // 恢復系統最佳推薦
  if(resetVoicePrefBtn){
    resetVoicePrefBtn.addEventListener('click', function(){
      try {
        localStorage.removeItem('math_selected_voice_uri');
      } catch(e){}
      _userCustomVoiceURI = null;
      _cachedVoice = undefined;
      updateVoiceStatusUI();
      renderVoiceList();
      if(MathApp.sfx) MathApp.sfx('click');
      speak('已恢復系統自動最佳推薦語音');
    });
  }

  // 初始與非同步更新檢查（相容 iOS Safari 延遲載入語音特性）
  updateVoiceStatusUI();
  setTimeout(updateVoiceStatusUI, 350);
  setTimeout(updateVoiceStatusUI, 1200);

  MathApp.audio = {
    getAudioCtx: getAudioCtx,
    tone: tone,
    sfx: sfx,
    speak: speak,
    speakWithVoice: speakWithVoice,
    pickBestVoice: pickBestVoice,
    openVoiceListModal: openVoiceListModal,
    updateVoiceStatusUI: updateVoiceStatusUI,
    isSoundOn: function(){ return soundOn; },
    isVoiceOn: function(){ return voiceOn; }
  };

  // 掛載至 MathApp 捷徑
  MathApp.sfx = sfx;
  MathApp.speak = speak;

})();

