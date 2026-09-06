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

  function pickBestVoice(){
    if(_cachedVoice !== undefined){
      console.log('[語音] 快取命中 →', _cachedVoice ? _cachedVoice.name : '（無，使用瀏覽器預設）');
      return _cachedVoice;
    }
    var voices = window.speechSynthesis.getVoices();
    if(!voices || voices.length === 0){
      console.warn('[語音] getVoices() 回傳空陣列，語音清單尚未載入');
      return null;
    }

    console.group('[語音] 開始挑選最佳語音');
    console.log('可用語音清單（共 ' + voices.length + ' 個）：',
      voices.map(function(v){ return v.name + ' [' + v.lang + ']'; }));

    // 1. 依偏好清單尋找
    for(var i = 0; i < VOICE_PREFS.length; i++){
      for(var j = 0; j < voices.length; j++){
        if(voices[j].name.indexOf(VOICE_PREFS[i]) !== -1){
          _cachedVoice = voices[j];
          console.log('✅ 偏好清單命中（第 ' + (i+1) + ' 順位）→ ' + _cachedVoice.name + ' [' + _cachedVoice.lang + ']');
          console.groupEnd();
          return _cachedVoice;
        }
      }
    }
    console.log('⚠️ 偏好清單全部未命中，改用退而求其次策略');

    // 2. 退而求其次：任何 zh-TW 聲音
    for(var k = 0; k < voices.length; k++){
      if(voices[k].lang === 'zh-TW'){
        _cachedVoice = voices[k];
        console.log('🔄 回退策略 zh-TW → ' + _cachedVoice.name);
        console.groupEnd();
        return _cachedVoice;
      }
    }
    // 3. 再退：任何中文聲音
    for(var m = 0; m < voices.length; m++){
      if(voices[m].lang.indexOf('zh') === 0){
        _cachedVoice = voices[m];
        console.log('🔄 回退策略 zh → ' + _cachedVoice.name + ' [' + _cachedVoice.lang + ']');
        console.groupEnd();
        return _cachedVoice;
      }
    }

    _cachedVoice = null; // 完全找不到，用瀏覽器預設
    console.warn('❌ 找不到任何中文語音，將使用瀏覽器預設語音');
    console.groupEnd();
    return null;
  }

  // 語音清單非同步載入時重置快取，讓下次 speak() 重新挑選
  if('speechSynthesis' in window){
    window.speechSynthesis.addEventListener('voiceschanged', function(){
      console.log('[語音] voiceschanged 觸發，重置語音快取');
      _cachedVoice = undefined;
    });
  }

  function speak(text){
    if(!voiceOn) return;
    if(!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      var u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-TW';
      u.rate = 0.88;
      u.pitch = 1.0;
      u.volume = 0.95;
      var best = pickBestVoice();
      if(best) u.voice = best;
      console.log('[語音] speak() → 語音：' + (best ? best.name : '瀏覽器預設') + '，內容：「' + clean + '」');
      window.speechSynthesis.speak(u);
    } catch(e){
      console.error('[語音] speak() 發生錯誤：', e);
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
    });
  }

  MathApp.audio = {
    getAudioCtx: getAudioCtx,
    tone: tone,
    sfx: sfx,
    speak: speak,
    isSoundOn: function(){ return soundOn; },
    isVoiceOn: function(){ return voiceOn; }
  };

  // 掛載至 MathApp 捷徑
  MathApp.sfx = sfx;
  MathApp.speak = speak;

})();
