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

  function speak(text){
    if(!voiceOn) return;
    if(!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      var u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-TW';
      u.rate = 0.92;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch(e){
      /* 語音功能不可用時靜默處理 */
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
