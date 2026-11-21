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
  var bgmOn = true;
  try {
    if(localStorage.getItem('math_bgm_on') === '0') bgmOn = false;
  } catch(e){}
  var audioCtx = null;

  /* ---------------- 繪本風格多聲道 Web Audio 背景音樂引擎 (BGM) ---------------- */
  var BGM_NORMAL_GAIN = 0.78;
  var BGM_DUCK_GAIN = 0.24;
  var bgmMasterGain = null;
  var bgmWantedMode = null;
  var bgmTimerId = null;
  var bgmStep = 0;
  var bgmNextNoteTime = 0;
  var bgmDuckTimer = null;

  function midiToFreq(midi){
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 三首輕柔可愛的循環旋律（使用 MIDI 音高，0 代表休止符）
  var BGM_TRACKS = {
    map: {
      stepSec: 0.27,
      leadWave: 'triangle',
      leadVol: 0.045,
      bassVol: 0.032,
      lead: [
        72, 76, 79, 0,  81, 79, 76, 0,  77, 76, 74, 72,  74, 79, 76, 0,
        72, 76, 79, 84, 81, 79, 76, 0,  74, 77, 76, 74,  72, 0,  72, 0
      ],
      bass: [
        48, 0,  55, 0,  57, 0,  52, 0,  53, 0,  55, 0,   48, 0,  55, 0,
        48, 0,  55, 0,  57, 0,  52, 0,  53, 0,  55, 0,   48, 0,  48, 0
      ]
    },
    battle: {
      stepSec: 0.21,
      leadWave: 'triangle',
      leadVol: 0.048,
      bassVol: 0.034,
      lead: [
        72, 74, 76, 79, 76, 79, 81, 0,  77, 79, 81, 79,  76, 74, 72, 0,
        74, 76, 77, 79, 81, 79, 76, 74, 72, 76, 79, 84,  79, 76, 72, 0
      ],
      bass: [
        48, 60, 55, 60, 57, 64, 55, 60, 53, 60, 55, 62,  48, 55, 48, 0,
        50, 57, 55, 62, 57, 64, 55, 62, 48, 55, 60, 67,  55, 62, 48, 0
      ]
    },
    boss: {
      stepSec: 0.19,
      leadWave: 'triangle',
      leadVol: 0.052,
      bassVol: 0.038,
      lead: [
        69, 0,  72, 76, 81, 79, 76, 72, 74, 76, 77, 76,  74, 72, 71, 0,
        69, 72, 76, 79, 84, 83, 81, 79, 77, 76, 74, 76,  81, 0,  76, 0
      ],
      bass: [
        45, 57, 45, 57, 48, 60, 48, 60, 50, 62, 50, 62,  47, 59, 43, 55,
        45, 57, 45, 57, 48, 60, 55, 67, 53, 65, 52, 64,  45, 57, 45, 0
      ]
    }
  };

  function ensureBgmGain(ctx){
    if(!ctx) return null;
    if(!bgmMasterGain){
      bgmMasterGain = ctx.createGain();
      bgmMasterGain.gain.value = BGM_NORMAL_GAIN;
      bgmMasterGain.connect(ctx.destination);
    }
    return bgmMasterGain;
  }

  function scheduleBgmStepNote(ctx, bus, freq, when, duration, wave, vol){
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = wave || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(when);
    osc.stop(when + duration + 0.03);
  }

  function pumpBgmScheduler(){
    if(!bgmOn || !bgmWantedMode) return;
    if(document.hidden) return;
    var ctx = getAudioCtx();
    if(!ctx || ctx.state === 'suspended') return;
    var bus = ensureBgmGain(ctx);
    var track = BGM_TRACKS[bgmWantedMode] || BGM_TRACKS.map;

    // 避免暫停或切換分頁回來後補播大量音符
    if(bgmNextNoteTime < ctx.currentTime - 0.15){
      bgmNextNoteTime = ctx.currentTime + 0.04;
    }

    var lookAhead = ctx.currentTime + 0.24;
    while(bgmNextNoteTime < lookAhead){
      var idx = bgmStep % track.lead.length;
      var leadMidi = track.lead[idx];
      var bassMidi = track.bass[idx];
      if(leadMidi > 0){
        scheduleBgmStepNote(ctx, bus, midiToFreq(leadMidi), bgmNextNoteTime, track.stepSec * 0.92, track.leadWave, track.leadVol);
      }
      if(bassMidi > 0){
        scheduleBgmStepNote(ctx, bus, midiToFreq(bassMidi), bgmNextNoteTime, track.stepSec * 0.95, 'sine', track.bassVol);
      }
      bgmNextNoteTime += track.stepSec;
      bgmStep = (bgmStep + 1) % track.lead.length;
    }
  }

  function duckBgm(isSpeaking){
    if(bgmDuckTimer){
      clearTimeout(bgmDuckTimer);
      bgmDuckTimer = null;
    }
    if(!bgmMasterGain || !audioCtx) return;
    var target = isSpeaking ? BGM_DUCK_GAIN : BGM_NORMAL_GAIN;
    try {
      if(bgmMasterGain.gain.setTargetAtTime){
        bgmMasterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.08);
      } else {
        bgmMasterGain.gain.value = target;
      }
    } catch(e){}
    if(isSpeaking){
      // 保險復原計時器，防止部分裝置語音事件遺失
      bgmDuckTimer = setTimeout(function(){
        bgmDuckTimer = null;
        duckBgm(false);
      }, 4500);
    }
  }

  function startBgmLoopIfNeeded(){
    if(bgmTimerId || !bgmOn || !bgmWantedMode) return;
    var ctx = getAudioCtx();
    if(ctx){
      ensureBgmGain(ctx);
      bgmNextNoteTime = ctx.currentTime + 0.05;
    }
    bgmTimerId = setInterval(pumpBgmScheduler, 100);
    pumpBgmScheduler();
  }

  function pauseBgmLoop(){
    if(bgmTimerId){
      clearInterval(bgmTimerId);
      bgmTimerId = null;
    }
  }

  function startBgm(mode){
    var nextMode = BGM_TRACKS[mode] ? mode : 'map';
    var changed = (bgmWantedMode !== nextMode);
    bgmWantedMode = nextMode;
    if(changed) bgmStep = 0;
    if(!bgmOn) return;
    if(!bgmTimerId){
      startBgmLoopIfNeeded();
    } else if(changed){
      var ctx = getAudioCtx();
      if(ctx) bgmNextNoteTime = ctx.currentTime + 0.04;
      pumpBgmScheduler();
    }
  }

  function stopBgm(){
    bgmWantedMode = null;
    bgmStep = 0;
    pauseBgmLoop();
  }

  function setBgmOn(enabled){
    bgmOn = Boolean(enabled);
    try {
      localStorage.setItem('math_bgm_on', bgmOn ? '1' : '0');
    } catch(e){}
    if(bgmOn){
      if(bgmWantedMode) startBgmLoopIfNeeded();
    } else {
      pauseBgmLoop();
    }
    if(MathApp.emit) MathApp.emit('audioChange', { soundOn: soundOn, voiceOn: voiceOn, bgmOn: bgmOn });
  }

  function toggleBgm(){
    setBgmOn(!bgmOn);
    if(soundOn) sfx('click');
    return bgmOn;
  }

  // 瀏覽器分頁切換至背景時自動暫停排程，回到前台再繼續播放
  if(typeof document !== 'undefined' && document.addEventListener){
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){
        pauseBgmLoop();
      } else if(bgmOn && bgmWantedMode){
        startBgmLoopIfNeeded();
      }
    });
    // 使用者互動時自動喚醒被瀏覽器 autoplay 政策暫停的 AudioContext
    var unlockBgmGesture = function(){
      if(bgmOn && bgmWantedMode){
        var ctx = getAudioCtx();
        if(ctx && ctx.state === 'running'){
          pumpBgmScheduler();
        }
      }
    };
    document.addEventListener('pointerdown', unlockBgmGesture, { passive: true });
    document.addEventListener('keydown', unlockBgmGesture, { passive: true });
  }

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
    } else if(kind === 'pop'){
      tone(580, 0, 0.055, 'sine', 0.11);
      tone(860, 0.03, 0.05, 'sine', 0.09);
    } else if(kind === 'combo'){
      tone(659, 0, 0.08, 'triangle', 0.13);
      tone(880, 0.07, 0.08, 'triangle', 0.13);
      tone(1175, 0.14, 0.14, 'sine', 0.14);
    } else if(kind === 'hit'){
      tone(440, 0, 0.06, 'square', 0.08);
      tone(660, 0.04, 0.08, 'triangle', 0.12);
      tone(988, 0.09, 0.14, 'sine', 0.13);
    } else if(kind === 'star'){
      tone(784, 0, 0.09, 'sine', 0.14);
      tone(1047, 0.08, 0.18, 'triangle', 0.14);
    } else if(kind === 'fanfare'){
      tone(523, 0, 0.10, 'triangle', 0.15);
      tone(659, 0.10, 0.10, 'triangle', 0.15);
      tone(784, 0.20, 0.10, 'triangle', 0.15);
      tone(1047, 0.30, 0.28, 'sine', 0.16);
      tone(1319, 0.36, 0.30, 'sine', 0.13);
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
    } else if(kind === 'magic'){
      tone(659, 0, 0.08, 'sine', 0.12);
      tone(988, 0.05, 0.09, 'triangle', 0.12);
      tone(1319, 0.11, 0.16, 'sine', 0.13);
    }
  }

  /**
   * 依連擊數漸升的五聲音階打擊音效
   * @param {number} comboCount 目前連擊次數
   * @param {boolean} isBoss 是否為 Boss 關卡重擊
   */
  function sfxCombo(comboCount, isBoss){
    if(!soundOn) return;
    var scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    var idx = Math.max(0, Math.min(scale.length - 1, (Number(comboCount) || 1) - 1));
    var baseFreq = scale[idx];

    if(isBoss){
      tone(220, 0, 0.07, 'square', 0.06);
    }
    tone(baseFreq, 0, 0.085, 'triangle', 0.13);
    tone(baseFreq * 1.25, 0.055, 0.10, 'sine', 0.13);

    // 2 連擊以上加入高八度閃亮泛音
    if(idx >= 1){
      tone(baseFreq * 1.5, 0.11, 0.14, 'sine', 0.11);
    }
    if(idx >= 3){
      tone(baseFreq * 2, 0.15, 0.16, 'triangle', 0.09);
    }
  }

  /**
   * 角色輕快跳躍音效（地圖移動與互動小驚喜使用）
   */
  function sfxJump(){
    if(!soundOn) return;
    tone(420, 0, 0.055, 'sine', 0.10);
    tone(630, 0.045, 0.075, 'triangle', 0.11);
  }

  /**
   * 樹屋八音盒／留聲機／風鈴輕柔小旋律
   */
  function sfxMusicBox(){
    if(!soundOn) return;
    var notes = [523.25, 659.25, 783.99, 880, 1046.5];
    for(var i = 0; i < notes.length; i++){
      tone(notes[i], i * 0.09, 0.22, 'sine', 0.085);
    }
  }

  /**
   * 樹屋魔法換裝與吊燈點亮微光雙音
   */
  function sfxChime(){
    if(!soundOn) return;
    tone(880, 0, 0.12, 'sine', 0.09);
    tone(1318.51, 0.07, 0.22, 'triangle', 0.085);
  }

  /**
   * 最後一擊必殺技專屬多段合成音效
   * @param {string} kind 'meteor' | 'rainbow' | 'carrot' | 'slash'
   * @param {boolean} isBoss 是否為 Boss 關卡豪華版
   */
  function sfxFinisher(kind, isBoss){
    if(!soundOn) return;
    var boost = isBoss ? 1.15 : 1.0;
    var baseShift = isBoss ? 0.12 : 0;

    // 1. 共通蓄力聚能上升音與 Cut-in 亮音
    tone(330, 0.02, 0.13, 'triangle', 0.09 * boost);
    tone(440, 0.09, 0.14, 'triangle', 0.10 * boost);
    tone(587.33, 0.16, 0.16, 'sine', 0.11 * boost);
    tone(880, 0.23, 0.18, 'sine', 0.10 * boost);
    if(isBoss) tone(1174.66, 0.30, 0.22, 'triangle', 0.09);

    if(kind === 'meteor'){
      // 第一波流星群連續呼嘯砸落 + 壓軸巨星引爆和弦
      var drops = [0.46, 0.56, 0.66, 0.76, 0.86, 0.96];
      for(var i = 0; i < drops.length; i++){
        var d = drops[i] + baseShift;
        tone(1260 - i * 70, d, 0.10, 'sine', 0.09 * boost);
        tone(220 + (i % 2) * 55, d + 0.09, 0.10, 'triangle', 0.09 * boost);
      }
      var endM = 1.24 + baseShift;
      tone(98, endM, 0.32, 'sawtooth', 0.10 * boost);
      tone(523.25, endM, 0.24, 'triangle', 0.13 * boost);
      tone(783.99, endM + 0.05, 0.26, 'sine', 0.12 * boost);
      tone(1046.5, endM + 0.11, 0.32, 'sine', 0.13 * boost);
      tone(1567.98, endM + 0.17, 0.28, 'sine', 0.09 * boost);
    } else if(kind === 'rainbow'){
      // 能量聚縮高音 + 宏亮彩虹炮長鳴 + 雙八度閃亮破敵和弦
      tone(1046.5, 0.34 + baseShift, 0.14, 'sine', 0.10 * boost);
      tone(1318.51, 0.42 + baseShift, 0.14, 'sine', 0.11 * boost);
      var beamStart = 0.54 + baseShift;
      tone(523.25, beamStart, 0.52, 'triangle', 0.11 * boost);
      tone(659.25, beamStart + 0.06, 0.52, 'sine', 0.11 * boost);
      tone(783.99, beamStart + 0.12, 0.54, 'sine', 0.11 * boost);
      tone(1046.5, beamStart + 0.18, 0.56, 'triangle', 0.12 * boost);
      if(isBoss) tone(130.81, beamStart + 0.10, 0.48, 'sawtooth', 0.09);
      tone(1318.51, beamStart + 0.42, 0.36, 'sine', 0.12 * boost);
      tone(1567.98, beamStart + 0.49, 0.38, 'sine', 0.11 * boost);
    } else if(kind === 'carrot'){
      // 高空鎖定召喚音 + 千斤墜急墜音 + 超厚重震地低音 + 彈跳星塵
      tone(783.99, 0.38 + baseShift, 0.14, 'sine', 0.10 * boost);
      tone(1046.5, 0.47 + baseShift, 0.16, 'sine', 0.11 * boost);
      tone(520, 0.72 + baseShift, 0.12, 'triangle', 0.10 * boost);
      tone(310, 0.83 + baseShift, 0.15, 'triangle', 0.11 * boost);
      var slamT = 0.96 + baseShift;
      tone(isBoss ? 78 : 96, slamT, 0.34, 'sawtooth', 0.13 * boost);
      tone(185, slamT + 0.02, 0.28, 'square', 0.08 * boost);
      tone(659.25, slamT + 0.08, 0.22, 'sine', 0.11 * boost);
      tone(987.77, slamT + 0.15, 0.26, 'sine', 0.12 * boost);
      tone(1318.51, slamT + 0.22, 0.26, 'sine', 0.10 * boost);
    } else {
      // slash 星辰十字斬：四連斬音階攀升 → Hit-stop 停頓 → 終極十字爆裂
      var s0 = 0.40 + baseShift;
      tone(987.77, s0, 0.10, 'sawtooth', 0.08 * boost);
      tone(1318.51, s0 + 0.03, 0.11, 'sine', 0.10 * boost);
      tone(1108.73, s0 + 0.14, 0.10, 'sawtooth', 0.08 * boost);
      tone(1479.98, s0 + 0.17, 0.11, 'sine', 0.10 * boost);
      tone(1244.51, s0 + 0.28, 0.10, 'sawtooth', 0.09 * boost);
      tone(1661.22, s0 + 0.31, 0.12, 'sine', 0.11 * boost);
      tone(1396.91, s0 + 0.42, 0.11, 'sawtooth', 0.09 * boost);
      tone(1864.66, s0 + 0.45, 0.14, 'sine', 0.12 * boost);

      var burstT = s0 + 0.72;
      tone(104, burstT, 0.30, 'sawtooth', 0.10 * boost);
      tone(523.25, burstT, 0.24, 'triangle', 0.12 * boost);
      tone(1046.5, burstT + 0.05, 0.28, 'sine', 0.13 * boost);
      tone(1318.51, burstT + 0.12, 0.32, 'sine', 0.12 * boost);
      tone(1567.98, burstT + 0.18, 0.30, 'sine', 0.10 * boost);
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
      var customTag = isCustom ? ' <span class="voice-custom-badge">自訂指定</span>' : '';
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

      // 更新頁尾狀態列並降低背景音樂音量，讓題目朗讀更清楚
      updateVoiceStatusUI();
      duckBgm(true);
      u.onend = function(){
        if(voiceStatusCardEl) voiceStatusCardEl.classList.remove('speaking');
        duckBgm(false);
      };
      u.onerror = function(){
        if(voiceStatusCardEl) voiceStatusCardEl.classList.remove('speaking');
        duckBgm(false);
      };
      if(voiceStatusCardEl){
        voiceStatusCardEl.classList.add('speaking');
      }

      window.speechSynthesis.speak(u);
    } catch(e){
      console.error('[語音] speak() 發生錯誤：', e);
      if(voiceStatusCardEl) voiceStatusCardEl.classList.remove('speaking');
    }
  }

  var soundToggleBtn = document.getElementById('toggle-sound');
  var voiceToggleBtn = document.getElementById('toggle-voice');

  function setSoundOn(enabled){
    soundOn = Boolean(enabled);
    if(soundToggleBtn){
      soundToggleBtn.setAttribute('aria-pressed', String(soundOn));
      soundToggleBtn.setAttribute('title', soundOn ? '關閉音效' : '開啟音效');
      soundToggleBtn.innerHTML = soundOn
        ? '<span data-lucide="volume-2" aria-hidden="true"></span><span class="toggle-label">音效</span>'
        : '<span data-lucide="volume-x" aria-hidden="true"></span><span class="toggle-label">音效</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
    if(soundOn) sfx('click');
    if(MathApp.emit) MathApp.emit('audioChange', { soundOn: soundOn, voiceOn: voiceOn, bgmOn: bgmOn });
  }

  function setVoiceOn(enabled){
    voiceOn = Boolean(enabled);
    if(voiceToggleBtn){
      voiceToggleBtn.setAttribute('aria-pressed', String(voiceOn));
      voiceToggleBtn.setAttribute('title', voiceOn ? '關閉語音' : '開啟語音');
      voiceToggleBtn.innerHTML = voiceOn
        ? '<span data-lucide="speech" aria-hidden="true"></span><span class="toggle-label">語音</span>'
        : '<span data-lucide="message-square-off" aria-hidden="true"></span><span class="toggle-label">語音</span>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }
    if(!voiceOn && 'speechSynthesis' in window){
      window.speechSynthesis.cancel();
      duckBgm(false);
    }
    updateVoiceStatusUI();
    if(MathApp.emit) MathApp.emit('audioChange', { soundOn: soundOn, voiceOn: voiceOn, bgmOn: bgmOn });
  }

  function toggleSound(){
    setSoundOn(!soundOn);
    return soundOn;
  }

  function toggleVoice(){
    setVoiceOn(!voiceOn);
    return voiceOn;
  }

  if(soundToggleBtn){
    soundToggleBtn.addEventListener('click', function(){
      toggleSound();
    });
  }

  if(voiceToggleBtn){
    voiceToggleBtn.addEventListener('click', function(){
      toggleVoice();
    });
  }

  // 試聽按鈕點擊事件（兼具 iPad 手勢喚醒 Web Audio 與 SpeechSynthesis 效果）
  if(voiceTestBtn){
    voiceTestBtn.addEventListener('click', function(){
      // 若先前為關閉狀態，自動開啟語音
      if(!voiceOn){
        setVoiceOn(true);
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
        '<p><span data-lucide="alert-triangle" aria-hidden="true"></span> 語音清單尚未載入或為空</p>' +
        '<p>在 iPad 或行動裝置上，請點擊上方「重新掃描」按鈕以喚醒語音資料庫。</p>' +
        '</div>';
      if(MathApp.refreshIcons) MathApp.refreshIcons();
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
        curTag.textContent = '目前使用中';
        titleRow.appendChild(curTag);
      }

      if(isPref){
        var prefTag = document.createElement('span');
        prefTag.className = 'voice-card-tag pref';
        prefTag.textContent = '推薦語音';
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

  /* 立即中斷目前語音朗讀，避免快節奏操作時被拖慢 */
  function stopSpeak(){
    if('speechSynthesis' in window){
      try {
        window.speechSynthesis.cancel();
      } catch(e){}
    }
    duckBgm(false);
    if(voiceStatusCardEl){
      voiceStatusCardEl.classList.remove('speaking');
    }
  }

  MathApp.audio = {
    getAudioCtx: getAudioCtx,
    tone: tone,
    sfx: sfx,
    sfxCombo: sfxCombo,
    sfxJump: sfxJump,
    sfxMusicBox: sfxMusicBox,
    sfxChime: sfxChime,
    sfxFinisher: sfxFinisher,
    startBgm: startBgm,
    stopBgm: stopBgm,
    duckBgm: duckBgm,
    isBgmOn: function(){ return bgmOn; },
    getBgmMode: function(){ return bgmWantedMode; },
    setBgmOn: setBgmOn,
    toggleBgm: toggleBgm,
    speak: speak,
    stopSpeak: stopSpeak,
    speakWithVoice: speakWithVoice,
    pickBestVoice: pickBestVoice,
    openVoiceListModal: openVoiceListModal,
    updateVoiceStatusUI: updateVoiceStatusUI,
    isSoundOn: function(){ return soundOn; },
    isVoiceOn: function(){ return voiceOn; },
    setSoundOn: setSoundOn,
    setVoiceOn: setVoiceOn,
    toggleSound: toggleSound,
    toggleVoice: toggleVoice
  };

  // 掛載至 MathApp 捷徑
  MathApp.sfx = sfx;
  MathApp.speak = speak;
  MathApp.stopSpeak = stopSpeak;

})();

