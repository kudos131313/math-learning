/**
 * ==========================================================================
 * 單元 5：數學冒險島模組（全螢幕多海域繪本遊戲版）
 * 支援獨立主分頁啟動、三層世界架構（海域→島嶼→關卡）、v1→v2 無縫存檔遷移、
 * 跨題型結構化救援案件、單一星星幣帳本與家長 JSON 進度備份
 * ==========================================================================
 */
import {
  STORAGE_KEY,
  STORAGE_KEY_V2,
  REALMS,
  ISLANDS,
  STAGES,
  BADGES,
  BUNNY_COSTUMES,
  FINISHER_DEFS,
  FINISHER_KEYS,
  SKILL_CARDS,
  getRealmById,
  getIslandById,
  getStageById,
  getStagesByRealm,
  getCostumeById,
  toCanonicalStageId,
  toLegacyStageId,
  toCanonicalPartnerId,
  LEGACY_COSTUME_MIGRATION_MAP,
  findRecommendedStageForTable
} from '../src/domain/quest-data.js';
import {
  createDefaultSaveV2,
  normalizeSaveDataV2,
  migrateV1ToV2,
  getLocalDateKey,
  getStageStars,
  setStageStars,
  isRealmUnlocked,
  getRealmUnlockProgress,
  isStageUnlocked as checkStageUnlocked,
  getNextPlayableStageId as findNextPlayableStageId,
  getActivePartnerId,
  countTotalStars as countQuestTotalStars,
  countLitGems as countQuestLitGems,
  countUnlockedSprites as countQuestUnlockedSprites,
  getActiveCostumeId as resolveActiveCostumeId,
  countUnlockedCostumes as countQuestUnlockedCostumes,
  evaluateUnlockedBadges,
  evaluateUnlockedCostumes,
  createRescueCaseFromQuestion,
  enqueueRescueCase,
  removeRescueCase,
  calculateStageCoinReward,
  recordSkillCodexHit,
  serializeBackupPayload,
  parseAndValidateBackupJson,
  buildStageQuestions as buildQuestStageQuestions,
  buildRescueQuestions as buildQuestRescueQuestions,
  getCollectableUnlitGems as findCollectableUnlitGems,
  buildGemHuntQuestions as buildQuestGemHuntQuestions
} from '../src/domain/quest-questions.js';
import { generateCalcChoices } from '../src/domain/quest-calc-questions.js';
import { renderCalcEquationHtml, renderCalcHelperHtml } from '../src/quest/calc-ui.js';
import {
  renderPinkBunnySvg,
  getStageChestSvg,
  getCharacterSvg
} from '../src/quest/svg-art.js';
import { createBattleFx } from '../src/quest/battle-fx.js';
import { createQuestDialogs } from '../src/quest/dialogs.js';

(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  function getPinkBunnySvg(mood, costumeId){
    return renderPinkBunnySvg(mood, costumeId || getActiveCostumeId());
  }

  /* ---------------- 存檔管理（v2 讀取 ＋ v1 自動無縫遷移） ---------------- */
  var migratedWelcomeCoins = 0;

  function loadSave(){
    try {
      var rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if(rawV2){
        return normalizeSaveDataV2(JSON.parse(rawV2));
      }
      var rawV1 = localStorage.getItem(STORAGE_KEY);
      if(rawV1){
        var migrated = migrateV1ToV2(JSON.parse(rawV1));
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
        if(migrated.starCoins > 0){
          migratedWelcomeCoins = migrated.starCoins;
        }
        return migrated;
      }
      return createDefaultSaveV2();
    } catch(e){
      return createDefaultSaveV2();
    }
  }

  function persistSave(){
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(saveData));
    } catch(e){}
  }

  var saveData = loadSave();

  /* ---------------- 狀態機 ---------------- */
  var session = {
    arcadeOpen: false,
    active: false,
    isRescueMode: false,
    isGemHuntMode: false,
    isMovingOnMap: false,
    stage: null,
    questions: [],
    idx: 0,
    combo: 0,
    maxCombo: 0,
    firstTryCorrect: 0,
    hadWrongOnCurrent: false,
    usedHelperOnCurrent: false,
    usedHelperInStage: false,
    newGemsThisRun: [],
    skillHitsThisRun: 0,
    skillUpgradesThisRun: [],
    displayFormat: 'equation',
    earnedCoinsThisRun: 0,
    rescuedThisRun: 0,
    locked: false,
    enemyHp: 0,
    enemyMaxHp: 0,
    bossShield: 0,
    bossShieldMax: 0,
    partnerUsedSkill: false,
    battleTheme: 'forest',
    battleBossObj: null,
    activeInput: null,
    nextLocked: false
  };

  var els = {};
  var bunnyIdleTween = null;
  var partnerIdleTween = null;
  var speakTimer = null;
  var nextUnlockTimer = null;

  var finisherBag = [];
  var lastFinisherId = '';

  function pickNextFinisher(){
    if(finisherBag.length === 0){
      finisherBag = FINISHER_KEYS.slice();
      for(var i = finisherBag.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = finisherBag[i];
        finisherBag[i] = finisherBag[j];
        finisherBag[j] = tmp;
      }
      // 避免新一輪第一張剛好跟上一輪最後一招重複
      if(lastFinisherId && finisherBag.length > 1 && finisherBag[finisherBag.length - 1] === lastFinisherId){
        var swapTmp = finisherBag[0];
        finisherBag[0] = finisherBag[finisherBag.length - 1];
        finisherBag[finisherBag.length - 1] = swapTmp;
      }
    }
    var picked = finisherBag.pop();
    lastFinisherId = picked;
    return picked;
  }

  function clearNextUnlockTimer(){
    if(nextUnlockTimer){
      clearTimeout(nextUnlockTimer);
      nextUnlockTimer = null;
    }
    session.nextLocked = false;
    if(els.nextBtn){
      els.nextBtn.disabled = false;
      els.nextBtn.classList.remove('ult-waiting');
    }
  }

  function getActivePartnerIsland(){
    var activeId = getActivePartnerId(saveData);
    if(!activeId) return null;
    return getIslandById(activeId);
  }

  function clearSpeakTimer(){
    if(speakTimer){
      clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function scheduleSpeak(text, delayMs){
    clearSpeakTimer();
    if(!text || !MathApp.speak) return;
    if(!delayMs || delayMs <= 0){
      MathApp.speak(text);
      return;
    }
    speakTimer = setTimeout(function(){
      speakTimer = null;
      if(session.arcadeOpen && MathApp.speak){
        MathApp.speak(text);
      }
    }, delayMs);
  }

  var battleFx = createBattleFx({
    els: els,
    session: session,
    getPinkBunnySvg: getPinkBunnySvg,
    getActivePartnerIsland: getActivePartnerIsland,
    updateBattleMoods: function(heroMood, enemyMood, partnerMood){
      return updateBattleMoods(heroMood, enemyMood, partnerMood);
    },
    clearNextUnlockTimer: clearNextUnlockTimer
  });

  var initGsapMedia = battleFx.initGsapMedia;
  var stopAttackAnim = battleFx.stopAttackAnim;
  var stopBattleIdleAnims = battleFx.stopBattleIdleAnims;
  var startBattleIdleAnims = battleFx.startBattleIdleAnims;
  var runAnim = battleFx.runAnim;
  var playFinisherAnim = battleFx.playFinisherAnim;
  var playBunnyAttackAnim = battleFx.playBunnyAttackAnim;

  /* ---------------- 查詢輔助 ---------------- */
  function isStageUnlocked(stageId){ return checkStageUnlocked(stageId, saveData); }
  function getNextPlayableStageId(realmId){ return findNextPlayableStageId(saveData, realmId || saveData.activeRealm || 'mul'); }
  function countTotalStars(realmId){ return countQuestTotalStars(saveData, realmId); }
  function countLitGems(){ return countQuestLitGems(saveData); }
  function countUnlockedSprites(realmId){ return countQuestUnlockedSprites(saveData, realmId); }
  function getActiveCostumeId(){ return resolveActiveCostumeId(saveData); }
  function countUnlockedCostumes(){ return countQuestUnlockedCostumes(saveData); }

  function checkAndUnlockBadges(){
    var newlyUnlocked = evaluateUnlockedBadges(saveData);
    newlyUnlocked.forEach(function(b){
      saveData.badges[b.id] = true;
    });
    return newlyUnlocked;
  }

  function checkAndUnlockCostumes(silent){
    if(!saveData.unlockedCostumes) saveData.unlockedCostumes = { 'default': true };
    var newlyUnlocked = evaluateUnlockedCostumes(saveData);
    newlyUnlocked.forEach(function(c){
      saveData.unlockedCostumes[c.id] = true;
      var mapped = LEGACY_COSTUME_MIGRATION_MAP[c.id];
      if(mapped && saveData.wardrobe && saveData.wardrobe.unlocked){
        if(mapped.hat && saveData.wardrobe.unlocked.hat.indexOf(mapped.hat) === -1){
          saveData.wardrobe.unlocked.hat.push(mapped.hat);
        }
        if(mapped.outfit && saveData.wardrobe.unlocked.outfit.indexOf(mapped.outfit) === -1){
          saveData.wardrobe.unlocked.outfit.push(mapped.outfit);
        }
      }
    });
    if(newlyUnlocked.length > 0 && !silent){
      saveData.hasNewCostume = true;
    }
    return newlyUnlocked;
  }

  function syncAllBunnyVisuals(){
    var cId = getActiveCostumeId();
    var normalSvg = getPinkBunnySvg('normal', cId);
    if(els.launcherBunny) els.launcherBunny.innerHTML = normalSvg;
    if(els.hudAvatar)     els.hudAvatar.innerHTML     = normalSvg;
    if(els.bunnyAvatar)   els.bunnyAvatar.innerHTML   = normalSvg;
    if(els.heroSvg){
      var battleMood = (session.active && session.combo >= 3) ? 'fever' : 'normal';
      els.heroSvg.innerHTML = getPinkBunnySvg(battleMood, cId);
    }
    if(els.victoryBunny){
      els.victoryBunny.innerHTML = getPinkBunnySvg('happy', cId);
    }
  }

  /* ---------------- 題庫生成 ---------------- */
  function buildStageQuestions(stage){
    return buildQuestStageQuestions(stage, saveData.gems);
  }

  function buildRescueQuestions(){
    return buildQuestRescueQuestions(saveData.rescueCases);
  }

  function getCollectableUnlitGems(){
    return findCollectableUnlitGems(saveData);
  }

  function buildGemHuntQuestions(pairs){
    return buildQuestGemHuntQuestions(pairs);
  }

  var dialogs = createQuestDialogs({
    els: els,
    getSaveData: function(){ return saveData; },
    getPinkBunnySvg: getPinkBunnySvg,
    getCharacterSvg: getCharacterSvg,
    getCollectableUnlitGems: getCollectableUnlitGems
  });

  var renderDexDialog = dialogs.renderDexDialog;
  var renderWardrobePane = dialogs.renderWardrobePane;
  var setupDialogPolyfill = dialogs.setupDialogPolyfill;
  var refreshParentLock = dialogs.refreshParentLock;
  var updatePreviewToggleBtn = dialogs.updatePreviewToggleBtn;

  /* ---------------- DOM 快取 ---------------- */
  function cacheDom(){
    els.launcherBunny  = document.getElementById('mqst-launcher-bunny');
    els.launchStars    = document.getElementById('mqst-launch-stars');
    els.launchStarsMax = document.getElementById('mqst-launch-stars-max');
    els.launchCoins    = document.getElementById('mqst-launch-coins');
    els.launchGems     = document.getElementById('mqst-launch-gems');
    els.launchSprites  = document.getElementById('mqst-launch-sprites');
    els.launchSpritesMax = document.getElementById('mqst-launch-sprites-max');
    els.launchCostumes = document.getElementById('mqst-launch-costumes');
    els.launcherRealms = document.getElementById('mqst-launcher-realms');
    els.enterArcadeBtn = document.getElementById('mqst-enter-arcade-btn');
    els.arcadeOverlay  = document.getElementById('mqst-arcade-overlay');
    els.exitArcadeBtn  = document.getElementById('mqst-exit-arcade-btn');
    els.battleExitBtn  = document.getElementById('mqst-battle-exit-btn');

    els.hudAvatar      = document.getElementById('mqst-hud-avatar');
    els.totalStars     = document.getElementById('mqst-total-stars');
    els.totalStarsMax  = document.getElementById('mqst-total-stars-max');
    els.coinCount      = document.getElementById('mqst-coin-count');
    els.gemCount       = document.getElementById('mqst-gem-count');
    els.spriteCount    = document.getElementById('mqst-sprite-count');
    els.spriteCountMax = document.getElementById('mqst-sprite-count-max');
    els.rescueBtn      = document.getElementById('mqst-rescue-btn');
    els.rescueCount    = document.getElementById('mqst-rescue-count');
    els.openWardrobeBtn= document.getElementById('mqst-open-wardrobe-btn');
    els.openDexBtn     = document.getElementById('mqst-open-dex-btn');
    els.openParentBtn  = document.getElementById('mqst-open-parent-btn');
    els.mapAudioBtn    = document.getElementById('mqst-map-audio-btn');
    els.battleAudioBtn = document.getElementById('mqst-battle-audio-btn');
    els.audioDialog    = document.getElementById('mqst-audio-dialog');
    els.dlgBgmBtn      = document.getElementById('mqst-dlg-bgm-btn');
    els.dlgSoundBtn    = document.getElementById('mqst-dlg-sound-btn');
    els.dlgVoiceBtn    = document.getElementById('mqst-dlg-voice-btn');

    els.mapView        = document.getElementById('mqst-map-view');
    els.realmTabs      = document.getElementById('mqst-realm-tabs');
    els.previewBadge   = document.getElementById('mqst-preview-badge');
    els.worldViewport  = document.getElementById('mqst-world-viewport');
    els.worldCanvas    = document.getElementById('mqst-world-canvas');
    els.worldBg        = document.getElementById('mqst-world-bg');
    els.realmPreviewStage = document.getElementById('mqst-realm-preview-stage');
    els.pathSvg        = document.getElementById('mqst-path-svg');
    els.islandSigns    = document.getElementById('mqst-island-signs');
    els.islandsGrid    = document.getElementById('mqst-islands-grid');
    els.partnerMapAvatar = document.getElementById('mqst-partner-map-avatar');
    els.bunnyAvatar    = document.getElementById('mqst-bunny-avatar');
    els.mapTip         = document.getElementById('mqst-map-tip');

    els.battleView     = document.getElementById('mqst-battle-view');
    els.backMapBtn     = document.getElementById('mqst-back-map-btn');
    els.stageChip      = document.getElementById('mqst-stage-chip');
    els.progressTrack  = document.querySelector('#mqst-battle-view .mqst-progress-track');
    els.qProgressText  = document.getElementById('mqst-q-progress-text');
    els.comboPill      = document.getElementById('mqst-combo-pill');
    els.comboCount     = document.getElementById('mqst-combo-count');
    els.progressFill   = document.getElementById('mqst-progress-fill');

    els.stageArena     = document.getElementById('mqst-stage-arena');
    els.stageBgImg     = document.getElementById('mqst-stage-bg-img');
    els.heroActor      = document.getElementById('mqst-hero-actor');
    els.heroAura       = document.getElementById('mqst-hero-aura');
    els.heroSvg        = document.getElementById('mqst-hero-svg');
    els.partnerActor   = document.getElementById('mqst-partner-actor');
    els.partnerSpeech  = document.getElementById('mqst-partner-speech');
    els.partnerSvg     = document.getElementById('mqst-partner-svg');
    els.partnerLabel   = document.getElementById('mqst-partner-label');
    els.partnerSkillBtn= document.getElementById('mqst-partner-skill-btn');
    els.fxLayer        = document.getElementById('mqst-fx-layer');
    els.fxImpact       = document.getElementById('mqst-fx-impact');
    els.projectile     = document.getElementById('mqst-projectile');
    els.partnerProjectile = document.getElementById('mqst-partner-projectile');
    els.ultBackdrop    = document.getElementById('mqst-ult-backdrop');
    els.ultSpeedlines  = document.getElementById('mqst-ult-speedlines');
    els.ultFlashVeil   = document.getElementById('mqst-ult-flash-veil');
    els.ultMagicRing   = document.getElementById('mqst-ult-magic-ring');
    els.heroAfterimage = document.getElementById('mqst-hero-afterimage');
    els.ultCutin       = document.getElementById('mqst-ult-cutin');
    els.ultCutinHero   = document.getElementById('mqst-ult-cutin-hero');
    els.ultCutinTag    = document.getElementById('mqst-ult-cutin-tag');
    els.ultCutinTitle  = document.getElementById('mqst-ult-cutin-title');
    els.ultSkyRift     = document.getElementById('mqst-ult-sky-rift');
    els.ultBeam        = document.getElementById('mqst-ult-beam');
    els.ultTargetRing  = document.getElementById('mqst-ult-target-ring');
    els.ultShockwave   = document.getElementById('mqst-ult-shockwave');
    els.ultCarrot      = document.getElementById('mqst-ult-carrot');
    els.ultSlash       = document.getElementById('mqst-ult-slash');
    els.enemyActor     = document.getElementById('mqst-enemy-actor');
    els.bossSvg        = document.getElementById('mqst-boss-svg');
    els.bossName       = document.getElementById('mqst-boss-name');
    els.bossShieldRow  = document.getElementById('mqst-boss-shield-row');
    els.bossHpBar      = document.getElementById('mqst-boss-hp-bar');
    els.bossTaunt      = document.getElementById('mqst-boss-taunt');
    els.hitCallout     = document.getElementById('mqst-hit-callout');

    els.typeBadge      = document.getElementById('mqst-type-badge');
    els.formatToggleBtn= document.getElementById('mqst-format-toggle-btn');
    els.promptText     = document.getElementById('mqst-prompt-text');
    els.speakBtn       = document.getElementById('mqst-speak-btn');
    els.questionStage  = document.getElementById('mqst-question-stage');
    els.storyBanner    = document.getElementById('mqst-story-banner');
    els.equationRow    = document.getElementById('mqst-equation-row');
    els.choicesGrid    = document.getElementById('mqst-choices-grid');
    els.keypadWrap     = document.getElementById('mqst-keypad-wrap');
    els.toyKeysGrid    = document.getElementById('mqst-toy-keys-grid');
    els.nextDock       = document.getElementById('mqst-next-dock');
    els.helperToggleBtn= document.getElementById('mqst-helper-toggle-btn');
    els.helperCloseBtn = document.getElementById('mqst-helper-close-btn');
    els.nextBtn        = document.getElementById('mqst-next-btn');
    els.helperDrawer   = document.getElementById('mqst-helper-drawer');
    els.helperTitle    = document.getElementById('mqst-helper-title');
    els.helperStage    = document.getElementById('mqst-helper-blocks-stage');
    els.helperConfirmDialog = document.getElementById('mqst-helper-confirm-dialog');
    els.helperConfirmTip    = document.getElementById('mqst-helper-confirm-partner-tip');
    els.feedback       = document.getElementById('mqst-feedback');
    els.explanationBox = document.getElementById('mqst-explanation-box');

    els.resultView     = document.getElementById('mqst-result-view');
    els.resultCard     = document.getElementById('mqst-result-card');
    els.victoryBunny   = document.getElementById('mqst-victory-bunny');
    els.victorySprite  = document.getElementById('mqst-victory-sprite');
    els.resultStars    = document.getElementById('mqst-result-stars');
    els.resultTitle    = document.getElementById('mqst-result-title');
    els.resultSub      = document.getElementById('mqst-result-sub');
    els.unlockShowcase = document.getElementById('mqst-unlock-showcase');
    els.resFirstAcc    = document.getElementById('mqst-res-first-acc');
    els.resCoins       = document.getElementById('mqst-res-coins');
    els.resCollectLbl  = document.getElementById('mqst-res-collect-lbl');
    els.resNewGems     = document.getElementById('mqst-res-new-gems');
    els.resMaxCombo    = document.getElementById('mqst-res-max-combo');
    els.resNextBtn     = document.getElementById('mqst-res-next-btn');
    els.resRetryBtn    = document.getElementById('mqst-res-retry-btn');
    els.resMapBtn      = document.getElementById('mqst-res-map-btn');

    els.dexDialog      = document.getElementById('mqst-dex-dialog');
    els.paneGems       = document.getElementById('mqst-pane-gems');
    els.paneSkills     = document.getElementById('mqst-pane-skills');
    els.paneWardrobe   = document.getElementById('mqst-pane-wardrobe');
    els.paneSprites    = document.getElementById('mqst-pane-sprites');
    els.paneBadges     = document.getElementById('mqst-pane-badges');

    els.parentDialog   = document.getElementById('mqst-parent-dialog');
    els.previewToggle  = document.getElementById('mqst-preview-toggle-btn');
    els.previewStatusMsg = document.getElementById('mqst-preview-status-msg');
    els.exportSaveBtn  = document.getElementById('mqst-export-save-btn');
    els.importSaveInput= document.getElementById('mqst-import-save-input');
    els.backupFeedback = document.getElementById('mqst-backup-feedback');
    els.parentLockBox  = document.getElementById('mqst-parent-lock-box');
    els.parentLockQ    = document.getElementById('mqst-parent-lock-q');
    els.parentLockIn   = document.getElementById('mqst-parent-lock-input');
    els.parentUnlockBtn= document.getElementById('mqst-parent-unlock-btn');
    els.parentFeedback = document.getElementById('mqst-parent-feedback');
    els.resetConfirmRow= document.getElementById('mqst-reset-confirm-row');
    els.resetAllBtn    = document.getElementById('mqst-reset-all-btn');
  }

  /* ---------------- 全螢幕開關與統計更新 ---------------- */
  function syncAudioButtons(){
    var bOn = (MathApp.audio && MathApp.audio.isBgmOn) ? MathApp.audio.isBgmOn() : true;
    var sOn = (MathApp.audio && MathApp.audio.isSoundOn) ? MathApp.audio.isSoundOn() : true;
    var vOn = (MathApp.audio && MathApp.audio.isVoiceOn) ? MathApp.audio.isVoiceOn() : true;
    var allOff = !bOn && !sOn && !vOn;

    [els.mapAudioBtn, els.battleAudioBtn].forEach(function(btn){
      if(!btn) return;
      var iconOnly = btn.classList.contains('icon-only');
      btn.classList.toggle('is-off', allOff);
      btn.innerHTML = '<i data-lucide="' + (allOff ? 'volume-x' : 'volume-2') + '" aria-hidden="true"></i>' +
        (iconOnly ? '' : '<span>聲音</span>');
    });

    function updateSwitch(btn, on){
      if(!btn) return;
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '已開啟' : '已關閉';
    }
    updateSwitch(els.dlgBgmBtn, bOn);
    updateSwitch(els.dlgSoundBtn, sOn);
    updateSwitch(els.dlgVoiceBtn, vOn);

    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  function openArcade(){
    if(!els.arcadeOverlay) return;
    var hostPanel = document.getElementById('panel-quest');
    if(hostPanel) hostPanel.classList.add('quest-arcade-active');
    session.arcadeOpen = true;
    els.arcadeOverlay.classList.add('is-open');
    els.arcadeOverlay.setAttribute('aria-hidden', 'false');
    syncAudioButtons();
    showView('map');
    if(migratedWelcomeCoins > 0){
      var welcomeMsg = '🎉 歡迎回到數學冒險島！已保留你的全部乘法進度，並贈送 ' + migratedWelcomeCoins + ' 枚歡迎星星幣！';
      migratedWelcomeCoins = 0;
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast(welcomeMsg);
      }
    }
  }

  function closeArcade(){
    if(!els.arcadeOverlay) return;
    var hostPanel = document.getElementById('panel-quest');
    if(hostPanel) hostPanel.classList.remove('quest-arcade-active');
    clearSpeakTimer();
    stopBattleIdleAnims();
    if(bunnyIdleTween){ bunnyIdleTween.kill(); bunnyIdleTween = null; }
    if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(MathApp.audio && MathApp.audio.stopBgm) MathApp.audio.stopBgm();
    session.arcadeOpen = false;
    session.active = false;
    els.arcadeOverlay.classList.remove('is-open');
    els.arcadeOverlay.setAttribute('aria-hidden', 'true');
    updateHubStats();
  }

  function renderLauncherRealms(){
    if(!els.launcherRealms) return;
    var activeRealmId = saveData.activeRealm || 'mul';
    var html = '';
    REALMS.forEach(function(realm){
      var isAct = (realm.id === activeRealmId);
      var isSoon = (realm.status !== 'active');
      var unlocked = isRealmUnlocked(realm.id, saveData);
      var tagText = isSoon
        ? (realm.releaseNote || '即將啟航')
        : (unlocked ? '可挑戰' : '待解鎖');
      html += '<button type="button" class="mqst-launch-realm-btn' +
        (isAct ? ' is-active' : '') +
        (isSoon ? ' is-soon' : '') +
        '" data-launch-realm="' + realm.id + '">' +
        '<span aria-hidden="true">' + realm.icon + '</span>' +
        '<span>' + realm.shortTitle + '</span>' +
        '<span class="mqst-launch-realm-tag">' + tagText + '</span>' +
        '</button>';
    });
    els.launcherRealms.innerHTML = html;
  }

  function updateHubStats(){
    var maxStars = STAGES.length * 3;
    var maxSprites = ISLANDS.length;
    var stars = countTotalStars();
    var coins = Number(saveData.starCoins || 0);
    var gems = countLitGems();
    var sprites = countUnlockedSprites();
    var costumes = countUnlockedCostumes();

    if(els.totalStars)       els.totalStars.textContent       = String(stars);
    if(els.totalStarsMax)    els.totalStarsMax.textContent    = String(maxStars);
    if(els.coinCount)        els.coinCount.textContent        = String(coins);
    if(els.gemCount)         els.gemCount.textContent         = String(gems);
    if(els.spriteCount)      els.spriteCount.textContent      = String(sprites);
    if(els.spriteCountMax)   els.spriteCountMax.textContent   = String(maxSprites);
    if(els.launchStars)      els.launchStars.textContent      = String(stars);
    if(els.launchStarsMax)   els.launchStarsMax.textContent   = String(maxStars);
    if(els.launchCoins)      els.launchCoins.textContent      = String(coins);
    if(els.launchGems)       els.launchGems.textContent       = String(gems);
    if(els.launchSprites)    els.launchSprites.textContent    = String(sprites);
    if(els.launchSpritesMax) els.launchSpritesMax.textContent = String(maxSprites);
    if(els.launchCostumes)   els.launchCostumes.textContent   = String(costumes);

    if(els.openWardrobeBtn){
      els.openWardrobeBtn.classList.toggle('has-new', Boolean(saveData.hasNewCostume));
    }

    var rLen = (saveData.rescueCases || []).length;
    if(els.rescueCount) els.rescueCount.textContent = String(rLen);
    if(els.rescueBtn){
      els.rescueBtn.classList.toggle('has-rescue', rLen > 0);
      els.rescueBtn.disabled = (rLen === 0);
    }
    if(els.previewBadge){
      els.previewBadge.style.display = saveData.previewAll ? 'inline-flex' : 'none';
    }
    renderLauncherRealms();
  }

  function formatStarsStr(n){
    var s = '';
    for(var i = 1; i <= 3; i++) s += (i <= n) ? '⭐' : '☆';
    return s;
  }

  function ensureSelectedRealmVisible(){
    if(!els.realmTabs) return;
    var selectedTab = els.realmTabs.querySelector('.mqst-realm-tab[aria-selected="true"]');
    if(!selectedTab) return;
    var maxScroll = els.realmTabs.scrollWidth - els.realmTabs.clientWidth;
    if(maxScroll <= 0) return;
    var targetLeft = selectedTab.offsetLeft - (els.realmTabs.clientWidth - selectedTab.offsetWidth) / 2;
    els.realmTabs.scrollLeft = Math.max(0, Math.min(maxScroll, targetLeft));
  }

  /* ---------------- 多海域導覽列與預告舞台 ---------------- */
  function renderRealmTabs(){
    if(!els.realmTabs) return;
    var activeRealmId = saveData.activeRealm || 'mul';
    var html = '';
    REALMS.forEach(function(realm){
      var isSelected = (realm.id === activeRealmId);
      var unlocked = isRealmUnlocked(realm.id, saveData);
      var badgeHtml = '';
      if(realm.status !== 'active'){
        badgeHtml = '<span class="mqst-realm-badge soon">' + (realm.releaseNote || '敬請期待') + '</span>';
      } else if(!unlocked){
        badgeHtml = '<span class="mqst-realm-badge locked">🔒 未解鎖</span>';
      }
      html += '<button type="button" class="mqst-realm-tab' +
        (unlocked ? '' : ' is-locked') +
        '" role="tab" data-realm-id="' + realm.id + '"' +
        ' aria-selected="' + String(isSelected) + '"' +
        ' tabindex="' + (isSelected ? '0' : '-1') + '">' +
        '<span aria-hidden="true">' + realm.icon + '</span>' +
        '<span>' + realm.title + '</span>' +
        badgeHtml +
        '</button>';
    });
    els.realmTabs.innerHTML = html;
    if(session.arcadeOpen){
      ensureSelectedRealmVisible();
      requestAnimationFrame(ensureSelectedRealmVisible);
    }
  }

  function switchRealm(realmId, focusTab){
    var targetRealm = getRealmById(realmId);
    if(!targetRealm) return;
    saveData.activeRealm = targetRealm.id;
    persistSave();
    renderRealmTabs();
    renderMap();
    if(els.realmTabs){
      ensureSelectedRealmVisible();
      var activeBtn = els.realmTabs.querySelector('.mqst-realm-tab[data-realm-id="' + targetRealm.id + '"]');
      if(activeBtn && focusTab){
        activeBtn.focus();
      }
    }
  }

  function renderRealmPreview(realm){
    if(!els.realmPreviewStage || !realm) return;
    var prog = getRealmUnlockProgress(realm.id, saveData);
    var islandsListHtml = (realm.plannedIslands || []).map(function(name){
      return '<li>🏝️ ' + name + '</li>';
    }).join('');
    var unlockNoteHtml = '';
    if(realm.unlockMode === 'conditional'){
      unlockNoteHtml = prog.unlocked
        ? '<div class="mqst-realm-unlock-box is-ready">✅ 恭喜！你的跨海域探險資歷已達雲端門檻（⭐ ' + prog.stars + ' 星 / 🐣 ' + prog.bosses + ' 隻精靈），待 Phase 2b 航道竣工即可直接登島！</div>'
        : '<div class="mqst-realm-unlock-box">🔓 正式啟航解鎖條件：全海域累積 <b>' + prog.minStars + ' 顆星</b>（目前 ' + prog.stars + ' 星）或擊敗任 <b>' + prog.minBosses + ' 位島嶼魔王</b>（目前 ' + prog.bosses + ' 位），預習模式也可全開！</div>';
    } else {
      unlockNoteHtml = '<div class="mqst-realm-unlock-box is-ready">☀️ 雙起點平行開放海域：未來一上線即可直接從第 1 關出發！</div>';
    }

    els.realmPreviewStage.innerHTML =
      '<div class="mqst-realm-preview-head">' +
        '<span class="mqst-realm-preview-pill">🚢 ' + (realm.releaseNote || '即將啟航') + '</span>' +
        '<h3 class="mqst-realm-preview-title">' + realm.icon + ' ' + realm.title + '</h3>' +
        '<p class="mqst-realm-preview-sub">' + realm.subtitle + '</p>' +
      '</div>' +
      '<ul class="mqst-realm-preview-list">' + islandsListHtml + '</ul>' +
      unlockNoteHtml +
      '<div class="mqst-preview-goto-row">' +
        '<button type="button" class="mqst-tool-btn" data-preview-goto-realm="sunny">' +
          '<span aria-hidden="true">☀️</span><span>前往陽光加減群島</span>' +
        '</button>' +
        '<button type="button" class="mqst-play-big-btn" data-preview-goto-realm="mul">' +
          '<span aria-hidden="true">🌲</span><span>前往九九乘法奇幻群島</span>' +
        '</button>' +
      '</div>';
  }

  /* ---------------- 全景世界大地圖與粉紅小兔渲染 ---------------- */
  function renderMap(){
    updateHubStats();
    renderRealmTabs();
    if(!els.islandsGrid) return;

    var activeRealm = getRealmById(saveData.activeRealm || 'mul');
    if(activeRealm.status !== 'active'){
      if(els.worldCanvas) els.worldCanvas.style.display = 'none';
      if(els.realmPreviewStage){
        els.realmPreviewStage.style.display = 'flex';
        renderRealmPreview(activeRealm);
      }
      if(els.mapTip){
        els.mapTip.textContent = '🚢 【' + activeRealm.title + '】將於 ' + (activeRealm.releaseNote || '後續階段') + ' 正式開放航行，先去陽光加減或九九乘法群島收集星星與星星幣吧！';
      }
      return;
    }

    if(els.worldCanvas) els.worldCanvas.style.display = 'block';
    if(els.realmPreviewStage) els.realmPreviewStage.style.display = 'none';
    if(els.worldBg && activeRealm.mapImg) els.worldBg.src = activeRealm.mapImg;

    var realmStages = getStagesByRealm(activeRealm.id);
    var nextPlayableId = getNextPlayableStageId(activeRealm.id);

    // 1. SVG 冒險虛線小徑 (viewBox 1000 x 562.5)
    if(els.pathSvg){
      var pathHtml = '';
      for(var p = 0; p < realmStages.length - 1; p++){
        var s1 = realmStages[p];
        var s2 = realmStages[p + 1];
        var x1 = (s1.mapPos.x / 100) * 1000;
        var y1 = (s1.mapPos.y / 100) * 562.5;
        var x2 = (s2.mapPos.x / 100) * 1000;
        var y2 = (s2.mapPos.y / 100) * 562.5;
        var cleared = getStageStars(saveData, s1.stageKey || s1.id) >= 1;
        pathHtml += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' +
          'stroke="' + (cleared ? '#f59e0b' : 'rgba(255,255,255,0.88)') + '" ' +
          'stroke-width="6" stroke-linecap="round" ' +
          (cleared ? '' : 'stroke-dasharray="10 10"') + '/>';
      }
      els.pathSvg.innerHTML = pathHtml;
    }

    // 2. 島嶼木牌名稱
    if(els.islandSigns){
      var signHtml = '';
      ISLANDS.forEach(function(isl){
        if(isl.realmId !== activeRealm.id) return;
        var got = getStageStars(saveData, isl.bossStageId) >= 1;
        signHtml += '<div class="mqst-island-sign" style="left:' + isl.signPos.x + '%;top:' + isl.signPos.y + '%;">' +
          isl.title + ' · ' + isl.rangeText + (got ? ' 🐣' : '') +
          '</div>';
      });
      els.islandSigns.innerHTML = signHtml;
    }

    // 3. 關卡石頭／糖果節點
    var nodeHtml = '';
    var focusStage = realmStages[0] || STAGES[0];
    var nextCanonical = toCanonicalStageId(nextPlayableId);
    realmStages.forEach(function(st){
      var stKey = st.stageKey || st.id;
      var unlocked = isStageUnlocked(stKey);
      var stars = getStageStars(saveData, stKey);
      var isCurrent = unlocked && (stKey === nextCanonical || st.id === nextPlayableId);
      if(isCurrent) focusStage = st;

      var dispNum = st.displayNum || toLegacyStageId(st.id);
      var cls = 'mqst-map-node';
      if(st.isBoss) cls += ' is-boss';
      if(!unlocked) cls += ' is-locked';
      else if(isCurrent) cls += ' is-current';
      else if(stars > 0) cls += ' is-cleared';

      nodeHtml += '<button type="button" class="' + cls + '" data-stage-id="' + stKey + '"' +
        ' style="left:' + st.mapPos.x + '%;top:' + st.mapPos.y + '%;"' +
        (unlocked ? '' : ' disabled') +
        ' aria-label="' + dispNum + ' ' + st.label + (st.isBoss && stars === 0 ? '（打敗可收服守護精靈）' : '') + '">' +
        (st.isBoss && stars === 0 ? '<span class="mqst-boss-sprite-tag">🥚 收服精靈</span>' : '') +
        '<span class="mqst-map-node-id">' + (st.isBoss ? '👑' : '') + dispNum + '</span>' +
        '<span class="mqst-map-node-stars">' + (unlocked ? formatStarsStr(stars) : '🔒') + '</span>' +
        '<span class="mqst-map-node-title">' + st.label + '</span>' +
        '</button>';
    });
    els.islandsGrid.innerHTML = nodeHtml;

    // 4. 放置粉紅小兔子與守護小精靈跟班在目前進度關卡上
    if(els.bunnyAvatar){
      els.bunnyAvatar.style.left = focusStage.mapPos.x + '%';
      els.bunnyAvatar.style.top  = focusStage.mapPos.y + '%';
      if(bunnyIdleTween){ bunnyIdleTween.kill(); bunnyIdleTween = null; }
      runAnim(function(gsap){
        bunnyIdleTween = gsap.to(els.bunnyAvatar, {
          y: -8, duration: 0.7, repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
    }

    var partner = getActivePartnerIsland();
    if(els.partnerMapAvatar){
      if(partner){
        els.partnerMapAvatar.style.display = 'block';
        els.partnerMapAvatar.innerHTML = getCharacterSvg(partner.theme, false, 'normal');
        els.partnerMapAvatar.style.left = focusStage.mapPos.x + '%';
        els.partnerMapAvatar.style.top  = focusStage.mapPos.y + '%';
        if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
        runAnim(function(gsap){
          partnerIdleTween = gsap.to(els.partnerMapAvatar, {
            y: -6, duration: 0.62, delay: 0.12, repeat: -1, yoyo: true, ease: 'sine.inOut'
          });
        });
      } else {
        if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
        els.partnerMapAvatar.style.display = 'none';
        els.partnerMapAvatar.innerHTML = '';
      }
    }

    // 5. 動態更新地圖底部探索與收服小精靈提示
    if(els.mapTip){
      var focusIsland = getIslandById(focusStage.islandId);
      var focusStars = getStageStars(saveData, focusStage.stageKey || focusStage.id);
      if(focusStage.isBoss && focusStars === 0 && focusIsland){
        els.mapTip.textContent = '👑 【' + focusStage.label + '】就在前方！打敗牠就能收服【' + focusIsland.spriteName + '】加入隊伍喔！';
      } else if(partner){
        els.mapTip.textContent = '🐣 【' + partner.spriteName + '】正陪著粉紅小兔冒險中！可在右上「圖鑑」切換精靈夥伴。';
      } else {
        els.mapTip.textContent = '✨ 點擊發亮的關卡圓牌開始冒險！打敗各島 👑 魔王關就能收服守護小精靈喔！';
      }
    }

    // 直向/小螢幕自動捲動將小兔子置中
    if(els.worldViewport && els.worldCanvas){
      requestAnimationFrame(function(){
        var cw = els.worldCanvas.offsetWidth;
        var vw = els.worldViewport.clientWidth;
        if(cw > vw){
          var targetScroll = (focusStage.mapPos.x / 100) * cw - (vw / 2);
          els.worldViewport.scrollLeft = Math.max(0, targetScroll);
        }
      });
    }
  }

  /* ---------------- 視圖切換 ---------------- */
  function showView(viewName){
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(els.mapView)    els.mapView.style.display    = (viewName === 'map') ? 'flex' : 'none';
    if(els.battleView) els.battleView.style.display = (viewName === 'battle') ? 'flex' : 'none';
    if(els.resultView) els.resultView.style.display = (viewName === 'result') ? 'flex' : 'none';

    if(viewName === 'map'){
      stopBattleIdleAnims();
      session.active = false;
      session.isMovingOnMap = false;
      renderMap();
      if(session.arcadeOpen && MathApp.audio && MathApp.audio.startBgm){
        MathApp.audio.startBgm('map');
      }
    } else if(viewName === 'result'){
      stopBattleIdleAnims();
      if(MathApp.audio && MathApp.audio.stopBgm){
        MathApp.audio.stopBgm();
      }
    }
  }

  /* ---------------- 小兔子跳向關卡後開戰 ---------------- */
  function walkBunnyAndStart(stageId){
    if(session.isMovingOnMap) return;
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(stageId)) return;

    if(typeof window.gsap === 'undefined' || battleFx.isMotionReduced() || !els.bunnyAvatar){
      startStage(stageId);
      return;
    }

    session.isMovingOnMap = true;
    if(bunnyIdleTween){ bunnyIdleTween.kill(); bunnyIdleTween = null; }
    if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
    if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
    else if(MathApp.sfx) MathApp.sfx('pop');

    var tl = window.gsap.timeline({
      onComplete: function(){
        session.isMovingOnMap = false;
        startStage(stageId);
      }
    });
    tl.to(els.bunnyAvatar, {
      left: st.mapPos.x + '%',
      top: st.mapPos.y + '%',
      duration: 0.48,
      ease: 'power2.inOut'
    }).to(els.bunnyAvatar, {
      y: -18,
      scale: 1.15,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: 'power1.out'
    });

    if(els.partnerMapAvatar && getActivePartnerIsland()){
      tl.to(els.partnerMapAvatar, {
        left: st.mapPos.x + '%',
        top: st.mapPos.y + '%',
        duration: 0.48,
        ease: 'power2.inOut'
      }, 0.08).to(els.partnerMapAvatar, {
        y: -14,
        scale: 1.12,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power1.out'
      }, 0.56);
    }
  }

  /* ---------------- 開始關卡或特訓戰鬥 ---------------- */
  function startStage(stageId){
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(st.stageKey || st.id)) return;

    session.active = true;
    session.isRescueMode = false;
    session.isGemHuntMode = false;
    session.stage = st;
    session.questions = buildStageQuestions(st);
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.skillHitsThisRun = 0;
    session.skillUpgradesThisRun = [];
    session.earnedCoinsThisRun = 0;
    session.rescuedThisRun = 0;
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;
    session.bossShieldMax = st.isBoss ? (st.bossShield || ((st.islandId === 'forest' || st.islandId === 'workshop') ? 1 : 2)) : 0;
    session.bossShield = session.bossShieldMax;
    session.partnerUsedSkill = false;

    var isl = getIslandById(st.islandId);
    beginBattleUI((st.displayNum || st.id) + ' · ' + st.label, isl.bgImg, st.islandId, st.isBoss ? st.boss : null);
  }

  function startRescueBattle(){
    if(!saveData.rescueCases || saveData.rescueCases.length === 0) return;
    session.active = true;
    session.isRescueMode = true;
    session.isGemHuntMode = false;
    session.stage = null;
    session.questions = buildRescueQuestions();
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.skillHitsThisRun = 0;
    session.skillUpgradesThisRun = [];
    session.earnedCoinsThisRun = 0;
    session.rescuedThisRun = 0;
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;
    session.bossShieldMax = 0;
    session.bossShield = 0;
    session.partnerUsedSkill = false;

    var firstQ = session.questions[0];
    var isSunnyRescue = Boolean(firstQ && firstQ.realm === 'sunny');
    beginBattleUI(
      '🆘 求救小精靈特訓',
      isSunnyRescue ? 'assets/quest/bg-bay.jpg' : 'assets/quest/bg-garden.jpg',
      isSunnyRescue ? 'bay' : 'garden',
      null
    );
  }

  function startGemHuntBattle(){
    var unlit = getCollectableUnlitGems();
    if(unlit.length === 0) return;
    if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();

    session.active = true;
    session.isRescueMode = false;
    session.isGemHuntMode = true;
    session.stage = null;
    session.questions = buildGemHuntQuestions(unlit);
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.skillHitsThisRun = 0;
    session.skillUpgradesThisRun = [];
    session.earnedCoinsThisRun = 0;
    session.rescuedThisRun = 0;
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;
    session.bossShieldMax = 0;
    session.bossShield = 0;
    session.partnerUsedSkill = false;

    beginBattleUI('💎 未點亮寶石補完特訓', 'assets/quest/bg-castle.jpg', 'castle', null);
  }

  function updateBattleMoods(heroMood, enemyMood, partnerMood){
    if(els.heroSvg){
      els.heroSvg.innerHTML = getPinkBunnySvg(heroMood || (session.combo >= 3 ? 'fever' : 'normal'));
    }
    if(els.bossSvg){
      if(session.battleBossObj){
        els.bossSvg.innerHTML = getCharacterSvg(session.battleBossObj.svgKey, true, enemyMood || (session.enemyHp === 0 ? 'dizzy' : 'normal'));
      } else {
        els.bossSvg.innerHTML = getStageChestSvg(session.battleTheme || 'forest', enemyMood || (session.enemyHp === 0 ? 'open' : 'normal'));
      }
    }
    var partner = getActivePartnerIsland();
    if(partner && els.partnerSvg){
      els.partnerSvg.innerHTML = getCharacterSvg(partner.theme, false, partnerMood || 'normal');
    }
  }

  function setPartnerSpeech(text){
    if(!els.partnerSpeech) return;
    if(!text){
      els.partnerSpeech.textContent = '';
      els.partnerSpeech.classList.remove('visible');
      return;
    }
    els.partnerSpeech.textContent = text;
    els.partnerSpeech.classList.add('visible');
  }

  function openHelperDrawer(titleText){
    if(els.helperTitle && titleText){
      els.helperTitle.textContent = titleText;
    }
    if(els.helperDrawer && !els.helperDrawer.classList.contains('open')){
      els.helperDrawer.classList.add('open');
    }
  }

  function updatePartnerSkillButton(){
    if(!els.partnerSkillBtn) return;
    var partner = getActivePartnerIsland();
    if(!partner){
      els.partnerSkillBtn.style.display = 'none';
      return;
    }
    els.partnerSkillBtn.style.display = 'inline-flex';
    els.partnerSkillBtn.disabled = Boolean(session.partnerUsedSkill);
    if(session.partnerUsedSkill){
      els.partnerSkillBtn.textContent = '✨ 魔法已施展';
      els.partnerSkillBtn.title = '本關的守護精靈免費魔法已經施展過囉！';
      return;
    }
    var q = (session.questions && session.questions[session.idx]) ? session.questions[session.idx] : null;
    var isChoice = Boolean(q && q.uiMode === 'choice');
    els.partnerSkillBtn.textContent = isChoice ? '✨ 免費消錯' : '✨ 免費積木';
    els.partnerSkillBtn.title = isChoice
      ? '每關免費 1 次：幫你消除 1 個錯誤選項，不扣星、照拿寶石！'
      : '每關免費 1 次：免費打開積木提示，不扣星、照拿寶石！';
  }

  function beginBattleUI(chipTitle, bgSrc, theme, bossObj){
    session.battleTheme = theme;
    session.battleBossObj = bossObj;
    showView('battle');
    if(MathApp.audio && MathApp.audio.startBgm){
      MathApp.audio.startBgm(bossObj ? 'boss' : 'battle');
    }
    if(els.stageChip) els.stageChip.textContent = chipTitle;
    if(els.stageBgImg) els.stageBgImg.src = bgSrc;
    if(els.stageArena) els.stageArena.setAttribute('data-theme', theme);

    if(bossObj){
      if(els.bossName)  els.bossName.textContent  = bossObj.name;
      if(els.bossTaunt) els.bossTaunt.textContent = session.bossShield > 0
        ? ('「先打破我的 ' + session.bossShield + ' 層魔法護盾再說吧！」')
        : bossObj.tauntStart;
    } else {
      if(els.bossName)  els.bossName.textContent  = session.isRescueMode ? '迷路小精靈籠子' : (session.isGemHuntMode ? '閃耀寶石守護箱' : '關卡寶箱怪');
      if(els.bossTaunt) els.bossTaunt.textContent = session.isRescueMode
        ? '「快用正確口訣打開魔法鎖！」'
        : (session.isGemHuntMode ? '「一次答對就能立刻點亮新寶石喔！」' : '「答對全部題目就能打開大寶箱！」');
    }

    var partner = getActivePartnerIsland();
    if(els.partnerActor){
      if(partner){
        els.partnerActor.style.display = 'flex';
        if(els.partnerLabel) els.partnerLabel.textContent = partner.spriteName;
        setPartnerSpeech('一起加油吧！');
      } else {
        els.partnerActor.style.display = 'none';
        setPartnerSpeech('');
      }
    }

    updateBattleMoods('normal', 'normal', 'normal');
    updatePartnerSkillButton();
    renderEnemyHp();
    updateComboUI();
    renderCurrentQuestion();
    startBattleIdleAnims();

    // 若挑戰尚未通關的島嶼魔王，提示孩子打敗即可收服該島守護小精靈
    if(bossObj && session.stage && getStageStars(saveData, session.stage.stageKey || session.stage.id) === 0 && els.feedback){
      var bossIsl = getIslandById(session.stage.islandId);
      if(bossIsl){
        els.feedback.textContent = '🥚 打敗 ' + bossObj.name + '，即可收服守護小精靈【' + bossIsl.spriteName + '】！';
        els.feedback.className = 'mqst-stage-toast hint';
      }
    }
  }

  function renderEnemyHp(){
    if(els.bossShieldRow){
      if(session.bossShieldMax > 0){
        els.bossShieldRow.style.display = 'flex';
        if(session.bossShield > 0){
          var shields = '';
          for(var s = 0; s < session.bossShieldMax; s++){
            shields += '<span class="mqst-shield-pip' + (s >= session.bossShield ? ' broken' : '') + '">🛡️</span>';
          }
          els.bossShieldRow.innerHTML = shields + '<span class="mqst-shield-txt">魔法護盾 ' + session.bossShield + ' 層</span>';
        } else {
          els.bossShieldRow.innerHTML = '<span class="mqst-shield-txt broken-all">💥 護盾全破！全力進攻！</span>';
        }
      } else {
        els.bossShieldRow.style.display = 'none';
        els.bossShieldRow.innerHTML = '';
      }
    }

    if(!els.bossHpBar) return;
    var html = '';
    for(var i = 0; i < session.enemyMaxHp; i++){
      var lost = (i >= session.enemyHp) ? ' lost' : '';
      html += '<span class="mqst-hp-pip' + lost + '"></span>';
    }
    els.bossHpBar.innerHTML = html;
  }

  function updateComboUI(){
    if(els.comboCount) els.comboCount.textContent = String(session.combo);
    if(els.comboPill) els.comboPill.classList.toggle('fever', session.combo >= 3);
    if(els.heroAura)  els.heroAura.classList.toggle('active', session.combo >= 3);
  }

  /**
   * 同步更新頂部戰鬥進度條與已完成題數文字（數值與填滿比例完全一致）
   * @param {number} completedCount 目前已答對完成的題數
   */
  function updateBattleProgressUI(completedCount){
    var total = session.questions.length || 1;
    var done = Math.max(0, Math.min(total, Number(completedCount) || 0));
    var pct = Math.round((done / total) * 100);
    if(els.qProgressText) els.qProgressText.textContent = '完成 ' + done + ' / ' + total;
    if(els.progressFill)  els.progressFill.style.width = pct + '%';
    if(els.progressTrack) els.progressTrack.setAttribute('aria-valuenow', String(pct));
  }

  /* ---------------- 渲染單題與控制台切換 ---------------- */
  function setActiveInput(inp){
    var allInputs = els.equationRow ? els.equationRow.querySelectorAll('.mq-input-slot') : [];
    for(var i = 0; i < allInputs.length; i++){
      allInputs[i].classList.remove('active-input');
    }
    session.activeInput = inp;
    if(inp) inp.classList.add('active-input');
  }

  function bindEquationInputs(){
    var inputs = els.equationRow ? els.equationRow.querySelectorAll('.mq-input-slot') : [];
    for(var k = 0; k < inputs.length; k++){
      (function(inp){
        inp.addEventListener('click', function(){
          if(session.locked) return;
          if(MathApp.sfx) MathApp.sfx('click');
          setActiveInput(inp);
        });
      })(inputs[k]);
    }
    if(inputs.length > 0) setActiveInput(inputs[0]);
  }

  function syncFormatToggleButton(q){
    if(!els.formatToggleBtn) return;
    if(q && q.kind !== 'mul' && q.canToggleFormat){
      var isVert = session.displayFormat === 'vertical_mini';
      els.formatToggleBtn.style.display = 'inline-flex';
      els.formatToggleBtn.textContent = isVert ? '⇄ 切換橫式' : '⇄ 切換直式';
      els.formatToggleBtn.setAttribute('aria-pressed', String(isVert));
    } else {
      els.formatToggleBtn.style.display = 'none';
    }
  }

  function renderCurrentQuestion(){
    var q = session.questions[session.idx];
    session.locked = false;
    session.hadWrongOnCurrent = false;
    session.usedHelperOnCurrent = false;
    session.displayFormat = q.displayFormat || 'equation';
    updateBattleMoods(session.combo >= 3 ? 'fever' : 'normal', 'normal', 'normal');
    updatePartnerSkillButton();
    updateBattleProgressUI(session.idx);

    if(els.typeBadge)  els.typeBadge.textContent  = q.badge;
    if(els.promptText) els.promptText.textContent = q.hint;
    syncFormatToggleButton(q);

    if(els.feedback){
      els.feedback.textContent = '';
      els.feedback.className = 'mqst-stage-toast';
    }
    if(els.helperDrawer){
      els.helperDrawer.classList.remove('open');
    }
    if(els.nextDock){
      els.nextDock.style.display = 'none';
    }

    if(q.storyHtml){
      els.storyBanner.style.display = 'block';
      els.storyBanner.innerHTML = q.storyHtml;
    } else {
      els.storyBanner.style.display = 'none';
      els.storyBanner.innerHTML = '';
    }

    var eqHtml = '';
    if(q.kind !== 'mul' && q.equationModel){
      els.equationRow.innerHTML = renderCalcEquationHtml(q, session.displayFormat);
      if(q.uiMode === 'choice'){
        els.choicesGrid.style.display = 'grid';
        els.keypadWrap.style.display  = 'none';

        var calcChoices = generateCalcChoices(q, 4);
        var ccHtml = '';
        calcChoices.forEach(function(val){
          ccHtml += '<button type="button" class="mqst-choice-bubble" data-choice="' + val + '">' + val + '</button>';
        });
        els.choicesGrid.innerHTML = ccHtml;

        runAnim(function(gsap){
          var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
          gsap.fromTo(bubbles, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.04, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility' });
        });
      } else {
        els.choicesGrid.style.display = 'none';
        els.keypadWrap.style.display  = 'block';
        bindEquationInputs();
      }
      if(els.helperStage){
        els.helperStage.innerHTML = renderCalcHelperHtml(q, MathApp.utils.blockGlyph);
      }
    } else if(q.uiMode === 'choice'){
      if(q.qType === 'commutative'){
        eqHtml = '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>×</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>＝</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="background:#fef9c3;">？</span>';
      } else if(q.qType === 'missing_b'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="background:#fef9c3;">？</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'missing_a'){
        eqHtml = '<span class="mq-num-box" style="background:#fef9c3;">？</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else {
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box" style="background:#fef9c3;">？</span>';
      }
      els.equationRow.innerHTML = eqHtml;

      els.choicesGrid.style.display = 'grid';
      els.keypadWrap.style.display  = 'none';

      var choices = MathApp.mulQuiz.generateChoices(q, 4);
      var cHtml = '';
      choices.forEach(function(val){
        cHtml += '<button type="button" class="mqst-choice-bubble" data-choice="' + val + '">' + val + '</button>';
      });
      els.choicesGrid.innerHTML = cHtml;

      runAnim(function(gsap){
        var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
        gsap.fromTo(bubbles, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.04, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility' });
      });

      if(els.helperStage && MathApp.mulQuiz.buildHelperBlocksHtml){
        els.helperStage.innerHTML = MathApp.mulQuiz.buildHelperBlocksHtml(q);
      }
    } else {
      if(q.qType === 'commutative'){
        eqHtml = '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>×</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>＝</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入交換後的乘數" placeholder="?">';
      } else if(q.qType === 'missing_b'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知乘數" placeholder="?"><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'missing_a'){
        eqHtml = '<input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知被乘數" placeholder="?"><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'concept'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="slot_b" maxlength="1" inputmode="none" readonly aria-label="輸入共有幾組" placeholder="?"><span>＝</span><input type="text" class="mq-input-slot" data-slot-id="slot_p" maxlength="2" inputmode="none" readonly aria-label="輸入總數乘積" placeholder="?">';
      } else {
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="2" inputmode="none" readonly aria-label="輸入乘積答案" placeholder="?">';
      }
      els.equationRow.innerHTML = eqHtml;

      els.choicesGrid.style.display = 'none';
      els.keypadWrap.style.display  = 'block';
      bindEquationInputs();

      if(els.helperStage && MathApp.mulQuiz.buildHelperBlocksHtml){
        els.helperStage.innerHTML = MathApp.mulQuiz.buildHelperBlocksHtml(q);
      }
    }

    if(MathApp.refreshIcons) MathApp.refreshIcons();

    runAnim(function(gsap){
      gsap.fromTo(els.questionStage, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
    });

    scheduleSpeak(q.spokenPrompt, 120);
  }

  /* ---------------- 粉紅小兔攻擊演出 & 精靈助陣 & 答對/答錯 ---------------- */
  function usePartnerSkill(){
    if(!session.active || session.locked || session.partnerUsedSkill) return;
    var q = session.questions[session.idx];
    var partner = getActivePartnerIsland();
    if(!q || !partner) return;

    session.partnerUsedSkill = true;
    updatePartnerSkillButton();
    updateBattleMoods(session.combo >= 3 ? 'fever' : 'happy', 'normal', 'happy');
    if(MathApp.sfx) MathApp.sfx('magic');

    runAnim(function(gsap){
      if(els.partnerActor){
        gsap.fromTo(els.partnerActor, { y: 0, scale: 1 }, { y: -14, scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
      }
    });

    if(q.uiMode === 'choice' && els.choicesGrid){
      var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble:not(:disabled)');
      var wrongBtns = [];
      for(var i = 0; i < bubbles.length; i++){
        if(Number(bubbles[i].getAttribute('data-choice')) !== q.slots[0].expected){
          wrongBtns.push(bubbles[i]);
        }
      }
      if(wrongBtns.length > 0){
        var picked = wrongBtns[MathApp.utils.randInt(0, wrongBtns.length - 1)];
        picked.classList.add('is-wrong');
        picked.disabled = true;
        setPartnerSpeech('幫你變走一個錯答案囉！');
        if(els.feedback){
          els.feedback.textContent = '✨ ' + partner.spriteName + ' 施展魔法！消除了 1 個干擾選項（不影響滿星！）';
          els.feedback.className = 'mqst-stage-toast good';
        }
        return;
      }
    }

    // 鍵盤題或無法消除泡泡時，免費展開魔法積木輔助且不扣三星資格
    openHelperDrawer('✨ 精靈免費積木（不扣星、照拿寶石！）');
    setPartnerSpeech('積木提示免費幫你看，一樣拿滿星！');
    if(els.feedback){
      els.feedback.textContent = '✨ ' + partner.spriteName + ' 施展魔法！免費打開積木提示（不影響滿星！）';
      els.feedback.className = 'mqst-stage-toast good';
    }
  }

  function handleCorrect(q){
    session.locked = true;
    session.combo++;
    if(session.combo > session.maxCombo) session.maxCombo = session.combo;
    if(session.maxCombo > saveData.stats.maxCombo) saveData.stats.maxCombo = session.maxCombo;
    saveData.stats.totalCorrect++;

    var cleanFirstTry = (!session.hadWrongOnCurrent && !session.usedHelperOnCurrent);
    if(cleanFirstTry){
      session.firstTryCorrect++;
    } else if(session.hadWrongOnCurrent){
      saveData.stats.selfHealed++;
    }

    var gemKey = '';
    var gemNote = '';
    if(q.kind === 'mul' || !q.kind){
      gemKey = q.a + 'x' + q.b;
      if((cleanFirstTry || session.isRescueMode || session.isGemHuntMode) && !saveData.gems[gemKey]){
        saveData.gems[gemKey] = true;
        session.newGemsThisRun.push(gemKey);
      }
      if(session.newGemsThisRun.indexOf(gemKey) !== -1){
        gemNote = '（💎 新點亮 ' + q.a + '×' + q.b + ' 寶石！）';
      }
    }

    var skillUpgradeNote = '';
    if(cleanFirstTry && q.skillTag){
      var skillRes = recordSkillCodexHit(saveData, q.skillTag);
      if(skillRes.card){
        session.skillHitsThisRun++;
        if(skillRes.upgraded){
          saveData.starCoins = Number(saveData.starCoins || 0) + skillRes.bonusCoins;
          session.skillUpgradesThisRun.push(skillRes);
          var tierTitle = skillRes.newTier === 'gold' ? '金卡' : (skillRes.newTier === 'silver' ? '銀卡' : '銅卡');
          skillUpgradeNote = '（📖 ' + skillRes.card.name + ' 升至' + tierTitle + ' +' + skillRes.bonusCoins + '🪙！）';
        }
      }
    }

    if(session.isRescueMode){
      saveData.rescueCases = removeRescueCase(saveData.rescueCases, {
        id: q.rescueCaseId,
        dedupeKey: q.rescueDedupeKey || (q.rescueKey ? ('mul:' + q.rescueKey) : '')
      });
      saveData.stats.rescuedCount++;
      session.rescuedThisRun++;
    }

    var shieldEvent = '';
    if(session.bossShield > 0){
      session.bossShield--;
      shieldEvent = (session.bossShield === 0) ? 'broken-all' : 'crack';
    }

    session.enemyHp = Math.max(0, session.enemyHp - 1);
    renderEnemyHp();
    updateBattleProgressUI(session.idx + 1);
    updateComboUI();
    persistSave();
    updateHubStats();

    if(session.stage && session.stage.isBoss && els.bossTaunt){
      if(session.enemyHp === 0){
        els.bossTaunt.textContent = session.stage.boss.tauntWin;
      } else if(shieldEvent === 'broken-all'){
        els.bossTaunt.textContent = '「糟糕！我的魔法護盾被打破啦！」';
      } else {
        els.bossTaunt.textContent = session.stage.boss.tauntHit;
      }
    } else if(els.bossTaunt){
      els.bossTaunt.textContent = (session.enemyHp === 0) ? '「寶箱喀嚓打開啦！太棒了！」' : '「漂亮的一擊！繼續加油！」';
    }

    var isFinalBlow = (session.enemyHp === 0);
    var isBoss = Boolean(session.stage && session.stage.isBoss);
    var finisherId = isFinalBlow ? pickNextFinisher() : '';

    if(isFinalBlow && MathApp.audio && MathApp.audio.sfxFinisher){
      MathApp.audio.sfxFinisher(finisherId, isBoss);
    } else if(MathApp.audio && MathApp.audio.sfxCombo){
      MathApp.audio.sfxCombo(session.combo, isBoss);
    } else if(MathApp.sfx){
      MathApp.sfx(session.combo >= 3 ? 'combo' : (isBoss ? 'hit' : 'correct'));
    }

    var partner = getActivePartnerIsland();
    var heroMood = session.combo >= 3 ? 'fever' : 'happy';
    var deferEnemyDefeatMood = isFinalBlow && !battleFx.isMotionReduced() && typeof window.gsap !== 'undefined';
    var enemyMood = isFinalBlow ? (deferEnemyDefeatMood ? 'hit' : (session.battleBossObj ? 'dizzy' : 'open')) : 'hit';
    updateBattleMoods(heroMood, enemyMood, 'happy');
    if(partner && partner.partnerCheers && partner.partnerCheers.length > 0){
      var cheer = partner.partnerCheers[(session.combo - 1) % partner.partnerCheers.length];
      setPartnerSpeech(cheer);
    }

    if(isFinalBlow){
      playFinisherAnim(finisherId, isBoss, partner);
    } else {
      playBunnyAttackAnim(session.combo >= 3, shieldEvent, partner);
    }

    var shieldNote = shieldEvent === 'broken-all' ? ' 💥 Boss 護盾全破！' : (shieldEvent === 'crack' ? ' 🛡️ 擊碎一層護盾！' : '');
    var finisherNote = isFinalBlow ? (' 【' + FINISHER_DEFS[finisherId].badge + '】') : '';
    if(els.feedback){
      els.feedback.textContent = '🎉 答對了！' + finisherNote + shieldNote + gemNote + skillUpgradeNote;
      els.feedback.className = 'mqst-stage-toast good';
    }

    if(els.helperDrawer) els.helperDrawer.classList.remove('open');

    // 切換控制台為超大「下一題」或「看勝利成績」橫幅
    if(els.choicesGrid) els.choicesGrid.style.display = 'none';
    if(els.keypadWrap)  els.keypadWrap.style.display  = 'none';
    if(els.nextDock)    els.nextDock.style.display    = 'flex';

    if(els.explanationBox){
      els.explanationBox.innerHTML = q.explanationHtml
        ? q.explanationHtml
        : ('✨ <b>' + q.a + ' × ' + q.b + ' ＝ ' + q.product + '</b>（口訣：<b>' + q.mantra + '</b>）');
    }

    clearNextUnlockTimer();
    var isLast = (session.idx + 1 >= session.questions.length);
    var readyHtml = isLast
      ? '看勝利成績 <i data-lucide="trophy" aria-hidden="true"></i>'
      : '下一題 <i data-lucide="arrow-right" aria-hidden="true"></i>';

    if(isFinalBlow && els.nextBtn){
      session.nextLocked = true;
      els.nextBtn.disabled = true;
      els.nextBtn.classList.add('ult-waiting');
      els.nextBtn.textContent = '⚡ 必殺技施放中…';
      var unlockDelayMs = battleFx.isMotionReduced() ? 550 : (isBoss ? 2250 : 1850);
      nextUnlockTimer = setTimeout(function(){
        nextUnlockTimer = null;
        session.nextLocked = false;
        if(!session.active || !els.nextBtn) return;
        els.nextBtn.disabled = false;
        els.nextBtn.classList.remove('ult-waiting');
        els.nextBtn.innerHTML = readyHtml;
        if(MathApp.refreshIcons) MathApp.refreshIcons();
        runAnim(function(gsap){
          gsap.fromTo(els.nextBtn, { scale: 0.85 }, { scale: 1, duration: 0.28, ease: 'back.out(1.8)', clearProps: 'transform' });
        });
      }, unlockDelayMs);
    } else if(els.nextBtn){
      els.nextBtn.innerHTML = readyHtml;
      if(MathApp.refreshIcons) MathApp.refreshIcons();
      runAnim(function(gsap){
        gsap.fromTo(els.nextBtn, { scale: 0.85 }, { scale: 1, duration: 0.25, ease: 'back.out(1.7)', clearProps: 'transform' });
      });
    }

    // 必殺技期間將朗讀口訣延至命中爆破後，避免與必殺技音效互搶聲音
    var speakDelayMs = isFinalBlow ? (battleFx.isMotionReduced() ? 360 : (isBoss ? 2000 : 1600)) : 340;
    scheduleSpeak(q.spokenExplanation || ('答對了！' + (q.mantra || '')), speakDelayMs);
  }

  function handleWrong(q){
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    session.hadWrongOnCurrent = true;
    session.combo = 0;
    updateComboUI();

    if(!session.isRescueMode){
      var newRescueCase = createRescueCaseFromQuestion(q);
      if(newRescueCase){
        var prevLen = (saveData.rescueCases || []).length;
        saveData.rescueCases = enqueueRescueCase(saveData.rescueCases, newRescueCase);
        if(saveData.rescueCases.length !== prevLen || prevLen > 0){
          persistSave();
          updateHubStats();
        }
      }
    }

    if(MathApp.sfx) MathApp.sfx('wrong');
    updateBattleMoods('oops', 'normal', 'normal');
    if(getActivePartnerIsland()){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }

    if(els.feedback){
      els.feedback.textContent = '💡 沒關係！看看魔法積木提示泡泡，再試一次吧！';
      els.feedback.className = 'mqst-stage-toast bad';
    }
    openHelperDrawer('💡 積木提示（答錯輔助）');

    runAnim(function(gsap){
      gsap.fromTo(els.questionStage, { x: -7 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.35)', clearProps: 'transform' });
    });
  }

  function checkChoiceAnswer(val, btnEl){
    if(session.locked) return;
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    var q = session.questions[session.idx];
    if(Number(val) === q.slots[0].expected){
      btnEl.classList.add('is-correct');
      var allBtns = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
      for(var i = 0; i < allBtns.length; i++) allBtns[i].disabled = true;
      handleCorrect(q);
    } else {
      btnEl.classList.add('is-wrong');
      btnEl.disabled = true;
      handleWrong(q);
    }
  }

  function checkKeypadAnswer(){
    if(session.locked) return;
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    var q = session.questions[session.idx];
    var inputs = els.equationRow.querySelectorAll('.mq-input-slot');
    var userValues = {};
    var hasEmpty = false;

    for(var i = 0; i < inputs.length; i++){
      var id = inputs[i].getAttribute('data-slot-id');
      var val = inputs[i].value.trim();
      if(val === '') hasEmpty = true;
      userValues[id] = val;
    }

    if(hasEmpty){
      if(MathApp.sfx) MathApp.sfx('wrong');
    updateBattleMoods('oops', 'normal', 'normal');
    if(getActivePartnerIsland()){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }
      if(els.feedback){
        els.feedback.textContent = '⚠️ 先用下方彩色玩具數字鍵盤填入答案喔！';
        els.feedback.className = 'mqst-stage-toast bad';
      }
      return;
    }

    var allOk = true;
    for(var k = 0; k < q.slots.length; k++){
      var spec = q.slots[k];
      var inp = els.equationRow.querySelector('[data-slot-id="' + spec.id + '"]');
      var ok = Number(userValues[spec.id]) === spec.expected;
      if(inp){
        inp.classList.remove('active-input', 'correct', 'wrong');
        inp.classList.add(ok ? 'correct' : 'wrong');
      }
      if(!ok) allOk = false;
    }

    if(allOk){
      handleCorrect(q);
    } else {
      handleWrong(q);
      var wrongInp = els.equationRow.querySelector('.mq-input-slot.wrong');
      if(wrongInp){
        wrongInp.value = '';
        setActiveInput(wrongInp);
      }
    }
  }

  function handleKeypadInput(key){
    if(!session.active) return;
    if(session.locked){
      if(key === 'enter') goNextQuestion();
      return;
    }
    var q = session.questions[session.idx];
    if(!q || q.uiMode !== 'keypad' || !session.activeInput) return;
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    if(key === 'enter'){
      checkKeypadAnswer();
      return;
    }

    if(MathApp.sfx) MathApp.sfx('pop');
    session.activeInput.classList.remove('wrong', 'correct');

    if(key === 'backspace' || key === 'clear'){
      session.activeInput.value = session.activeInput.value.slice(0, -1);
      return;
    }

    if(/^[0-9]$/.test(key)){
      var maxLen = Number(session.activeInput.getAttribute('maxlength')) || 2;
      if(session.activeInput.value.length >= maxLen){
        session.activeInput.value = key;
      } else {
        session.activeInput.value += key;
      }

      if(maxLen === 1 && session.activeInput.value.length === 1){
        var allInputs = els.equationRow.querySelectorAll('.mq-input-slot');
        if(allInputs.length > 1 && session.activeInput === allInputs[0]){
          setActiveInput(allInputs[1]);
        }
      }
    }
  }

  function goNextQuestion(){
    if(session.nextLocked) return;
    stopAttackAnim();
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(MathApp.sfx) MathApp.sfx('click');
    session.idx++;
    if(session.idx >= session.questions.length){
      finishStage();
    } else {
      renderCurrentQuestion();
    }
  }

  /* ---------------- 勝利大舞台結算 ---------------- */
  function finishStage(){
    updateBattleProgressUI(session.questions.length);
    showView('result');

    var total = session.questions.length;
    var accPct = Math.round((session.firstTryCorrect / total) * 100);
    var stars = 1;
    if(!session.usedHelperInStage && accPct >= 80){
      stars = 3;
    } else if(accPct >= 60){
      stars = 2;
    }

    var todayKey = getLocalDateKey();
    if(!saveData.daily || saveData.daily.date !== todayKey){
      saveData.daily = {
        date: todayKey,
        tasks: [],
        replayRewardCount: 0,
        classroomCoinEarned: 0,
        stampedToday: false
      };
    }

    var prevStars = 0;
    var unlockedSprite = null;
    if(!session.isRescueMode && !session.isGemHuntMode && session.stage){
      prevStars = getStageStars(saveData, session.stage.stageKey || session.stage.id);
      if(stars > prevStars){
        setStageStars(saveData, session.stage.stageKey || session.stage.id, stars);
      }
      if(session.stage.isBoss){
        var bossIsl = getIslandById(session.stage.islandId);
        if(bossIsl){
          if(!saveData.bossesDefeated) saveData.bossesDefeated = {};
          saveData.bossesDefeated[bossIsl.fullId] = (saveData.bossesDefeated[bossIsl.fullId] || 0) + 1;
          if(prevStars === 0){
            unlockedSprite = bossIsl;
            if(!saveData.partners) saveData.partners = { activeId: '', bonds: {} };
            if(!saveData.partners.bonds) saveData.partners.bonds = {};
            saveData.partners.bonds[bossIsl.fullId] = saveData.partners.bonds[bossIsl.fullId] || { xp: 0, level: 1 };
            // 收服新精靈時自動派牠成為冒險夥伴
            saveData.partners.activeId = unlockedSprite.fullId;
          }
        }
      }
    }

    var coinOutcome = calculateStageCoinReward({
      stage: session.stage,
      prevStars: prevStars,
      newStars: stars,
      isRescueMode: session.isRescueMode,
      rescuedCount: session.rescuedThisRun,
      isGemHuntMode: session.isGemHuntMode,
      dailyReplayCount: saveData.daily.replayRewardCount || 0
    });
    var skillUpgradeBonus = session.skillUpgradesThisRun.reduce(function(acc, item){
      return acc + (Number(item && item.bonusCoins) || 0);
    }, 0);
    session.earnedCoinsThisRun = coinOutcome.coins + skillUpgradeBonus;
    saveData.starCoins = Number(saveData.starCoins || 0) + coinOutcome.coins;
    if(coinOutcome.consumesDailyReplay){
      saveData.daily.replayRewardCount = (saveData.daily.replayRewardCount || 0) + 1;
    }

    var newBadges = checkAndUnlockBadges();
    var newCostumes = checkAndUnlockCostumes(false);
    persistSave();
    updateHubStats();

    var partner = getActivePartnerIsland();
    if(els.victoryBunny) els.victoryBunny.innerHTML = getPinkBunnySvg('happy');
    if(els.victorySprite){
      var showSp = unlockedSprite || partner;
      if(showSp){
        els.victorySprite.style.display = 'block';
        els.victorySprite.innerHTML = getCharacterSvg(showSp.theme, false, 'happy');
      } else {
        els.victorySprite.style.display = 'none';
      }
    }

    if(els.resFirstAcc) els.resFirstAcc.textContent = session.firstTryCorrect + ' / ' + total;
    if(els.resCoins)    els.resCoins.textContent    = '+' + session.earnedCoinsThisRun + ' 🪙';
    var isSunnySummary = Boolean((session.stage && session.stage.realmId === 'sunny') || (session.isRescueMode && session.skillHitsThisRun > 0 && session.newGemsThisRun.length === 0));
    if(els.resCollectLbl){
      els.resCollectLbl.textContent = isSunnySummary ? '技能累積' : '新亮寶石';
    }
    if(els.resNewGems){
      els.resNewGems.textContent = isSunnySummary
        ? ('+' + session.skillHitsThisRun + ' 📖')
        : ('+' + session.newGemsThisRun.length + ' 💎');
    }
    if(els.resMaxCombo) els.resMaxCombo.textContent = session.maxCombo + ' 🔥';

    if(session.isRescueMode){
      var remainingRescue = (saveData.rescueCases || []).length;
      if(remainingRescue === 0){
        els.resultTitle.textContent = '🆘 求救小精靈全數救出！';
        els.resultSub.textContent = '粉紅小兔把你卡住的題目通通變成強項囉！';
      } else {
        els.resultTitle.textContent = '🆘 本批小精靈救出成功！';
        els.resultSub.textContent = '還有 ' + remainingRescue + ' 隻迷路小精靈在等你，回地圖再救援一次吧！';
      }
      els.resNextBtn.style.display = 'none';
      els.resRetryBtn.style.display = 'none';
    } else if(session.isGemHuntMode){
      els.resultTitle.textContent = '💎 寶石補完特訓完成！';
      els.resultSub.textContent = session.newGemsThisRun.length > 0
        ? ('太棒了！又替 81 格寶石牆點亮了 ' + session.newGemsThisRun.length + ' 顆閃亮寶石！')
        : '完成特訓！再多試一次，就能把沒亮的寶石一次點亮喔！';
      els.resNextBtn.style.display = 'none';
      els.resRetryBtn.style.display = 'none';
    } else {
      els.resultTitle.textContent = stars === 3 ? '滿分三星！閃耀大勝利！' : (stars === 2 ? '表現超棒！冒險成功！' : '完成冒險！繼續加油！');
      els.resultSub.textContent = stars === 3 ? '粉紅小兔為你拍拍手，全靠自己破關太強了！' : '再挑戰一次就能收集三顆閃亮大星星！';
      var realmStages = getStagesByRealm((session.stage && session.stage.realmId) || 'mul');
      var curIdx = realmStages.indexOf(session.stage);
      els.resNextBtn.style.display = (curIdx >= 0 && curIdx + 1 < realmStages.length) ? 'inline-flex' : 'none';
      els.resRetryBtn.style.display = 'inline-flex';
    }

    var starNodes = els.resultStars.querySelectorAll('.mqst-star-item');
    for(var s = 0; s < starNodes.length; s++){
      starNodes[s].classList.toggle('earned', (s + 1) <= stars);
    }

    var showcaseHtml = '';
    if(unlockedSprite){
      showcaseHtml += '<div class="mqst-unlock-banner">' +
        getCharacterSvg(unlockedSprite.theme, false, 'happy') +
        '<div><div>🎉 成功收服守護小精靈：【' + unlockedSprite.spriteName + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + unlockedSprite.spriteDesc + '</div>' +
        '<div class="mqst-unlock-subnote">🤝 已自動加入冒險隊伍！戰鬥時點「✨ 精靈魔法」可幫忙解圍，2連擊還會合體攻擊！</div></div></div>';
    }
    newCostumes.forEach(function(c){
      var isEq = (getActiveCostumeId() === c.id);
      showcaseHtml += '<div class="mqst-unlock-banner is-costume">' +
        '<div class="mqst-unlock-costume-main">' +
          getPinkBunnySvg('happy', c.id) +
          '<div><div>' + c.icon + ' 解鎖小兔新造型：【' + c.name + '】！</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + c.goalText + ' 達成！' + c.desc + '</div></div>' +
        '</div>' +
        '<button type="button" class="mqst-unlock-equip-btn' + (isEq ? ' equipped' : '') + '" data-quick-equip-costume="' + c.id + '">' +
          (isEq ? '✅ 已換上！' : '✨ 馬上換上') +
        '</button></div>';
    });
    newBadges.forEach(function(b){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%);">' +
        '<span style="font-size:34px;">' + b.icon + '</span>' +
        '<div><div>🏅 解鎖新成就徽章：【' + b.name + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + b.desc + '</div></div></div>';
    });
    session.skillUpgradesThisRun.forEach(function(up){
      if(!up || !up.card) return;
      var tierTxt = up.newTier === 'gold' ? '🥇 金卡' : (up.newTier === 'silver' ? '🥈 銀卡' : '🥉 銅卡');
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#fffbeb 0%,#fde68a 100%);border-color:#d97706;">' +
        '<span style="font-size:34px;">' + up.card.icon + '</span>' +
        '<div><div>📖 技能卡進階：【' + up.card.name + '】達成 ' + tierTxt + '！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">額外獎勵 +' + up.bonusCoins + ' 枚星星幣！</div></div></div>';
    });
    els.unlockShowcase.innerHTML = showcaseHtml;

    if(unlockedSprite && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎉 成功收服【' + unlockedSprite.spriteName + '】！已加入你的冒險隊伍！');
    } else if(newCostumes.length > 0 && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎀 解鎖小兔新造型【' + newCostumes[0].name + '】！點「馬上換上」試穿吧！');
    }

    if(MathApp.sfx) MathApp.sfx('fanfare');
    if(MathApp.utils && MathApp.utils.launchConfetti){
      MathApp.utils.launchConfetti(stars === 3 || Boolean(unlockedSprite) || newCostumes.length > 0);
    }
    var costumeVoiceNote = newCostumes.length > 0
      ? ('，還解鎖了小兔新造型 ' + newCostumes[0].name + ' 喔！')
      : '';
    var remainingAfterRescue = (saveData.rescueCases || []).length;
    var victoryMsg = session.isRescueMode
      ? (remainingAfterRescue === 0 ? '太棒了，求救小精靈全部救出來了！' : ('太棒了！還有 ' + remainingAfterRescue + ' 隻小精靈等你去救喔！'))
      : (session.isGemHuntMode
          ? ('太厲害了，寶石補完特訓完成' + costumeVoiceNote)
          : (unlockedSprite
              ? ('恭喜過關獲得 ' + stars + ' 顆星！還成功收服了守護小精靈 ' + unlockedSprite.spriteName + costumeVoiceNote)
              : ('恭喜過關！獲得 ' + stars + ' 顆星' + costumeVoiceNote)));
    scheduleSpeak(victoryMsg, 420);

    runAnim(function(gsap){
      var tl = gsap.timeline();
      tl.fromTo(els.resultCard, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'transform,opacity,visibility' });
      if(els.victoryBunny){
        tl.to(els.victoryBunny, { y: -14, duration: 0.32, yoyo: true, repeat: 3, ease: 'power1.out', clearProps: 'transform' }, '<0.1');
      }
      var unlockBanners = els.unlockShowcase ? els.unlockShowcase.querySelectorAll('.mqst-unlock-banner') : [];
      if(unlockBanners.length > 0){
        tl.fromTo(unlockBanners, { scale: 0.84, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.38, stagger: 0.12, ease: 'back.out(1.7)', clearProps: 'transform,opacity,visibility' }, 0.25);
      }
      var earnedEls = els.resultStars.querySelectorAll('.mqst-star-item.earned');
      if(earnedEls.length > 0){
        tl.fromTo(earnedEls,
          { scale: 0.2, rotation: -25, autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.35, stagger: 0.16, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' },
          0.18
        );
      }
    });
  }

  /* ---------------- 事件綁定 ---------------- */
  function bindEvents(){
    if(els.enterArcadeBtn) els.enterArcadeBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      openArcade();
    });
    if(els.exitArcadeBtn) els.exitArcadeBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      closeArcade();
    });
    if(els.battleExitBtn) els.battleExitBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      closeArcade();
    });

    if(els.islandsGrid){
      els.islandsGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-map-node[data-stage-id]');
        if(!btn || btn.disabled) return;
        walkBunnyAndStart(btn.getAttribute('data-stage-id'));
      });
    }

    // 漂浮白雲點擊小驚喜彩蛋
    if(els.worldCanvas){
      els.worldCanvas.addEventListener('click', function(e){
        var cloud = e.target.closest('.mqst-cloud-btn');
        if(!cloud) return;
        if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
        else if(MathApp.sfx) MathApp.sfx('pop');
        runAnim(function(gsap){
          gsap.fromTo(cloud, { scale: 1 }, { scale: 1.32, y: -12, duration: 0.18, yoyo: true, repeat: 1, ease: 'back.out(2)', clearProps: 'transform' });
        });
        if(MathApp.utils && MathApp.utils.showToast){
          var msgs = ['☁️ 軟綿綿白雲抖了一下！', '✨ 發現藏在雲裡的幸運微風！', '🐰 小兔子朝白雲揮揮手！'];
          MathApp.utils.showToast(msgs[MathApp.utils.randInt(0, msgs.length - 1)]);
        }
      });
    }

    if(els.rescueBtn){
      els.rescueBtn.addEventListener('click', function(){
        if(!saveData.rescueCases || saveData.rescueCases.length === 0) return;
        if(MathApp.sfx) MathApp.sfx('click');
        startRescueBattle();
      });
    }

    if(els.launcherRealms){
      els.launcherRealms.addEventListener('click', function(e){
        var btn = e.target.closest('[data-launch-realm]');
        if(!btn) return;
        var rid = btn.getAttribute('data-launch-realm');
        if(MathApp.sfx) MathApp.sfx('click');
        saveData.activeRealm = getRealmById(rid).id;
        persistSave();
        openArcade();
      });
    }

    if(els.realmTabs){
      els.realmTabs.addEventListener('click', function(e){
        var tab = e.target.closest('.mqst-realm-tab[data-realm-id]');
        if(!tab) return;
        if(MathApp.sfx) MathApp.sfx('click');
        switchRealm(tab.getAttribute('data-realm-id'), false);
      });
      els.realmTabs.addEventListener('keydown', function(e){
        var tabs = Array.prototype.slice.call(els.realmTabs.querySelectorAll('.mqst-realm-tab[data-realm-id]'));
        if(tabs.length === 0) return;
        var current = document.activeElement;
        var idx = tabs.indexOf(current);
        if(idx === -1) return;
        var nextIdx = -1;
        if(e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
        else if(e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if(e.key === 'Home') nextIdx = 0;
        else if(e.key === 'End') nextIdx = tabs.length - 1;
        if(nextIdx !== -1){
          e.preventDefault();
          if(MathApp.sfx) MathApp.sfx('click');
          switchRealm(tabs[nextIdx].getAttribute('data-realm-id'), true);
        }
      });
    }

    if(els.realmPreviewStage){
      els.realmPreviewStage.addEventListener('click', function(e){
        var btn = e.target.closest('[data-preview-goto-realm]');
        if(!btn) return;
        if(MathApp.sfx) MathApp.sfx('click');
        switchRealm(btn.getAttribute('data-preview-goto-realm'), false);
      });
    }

    if(els.backMapBtn){
      els.backMapBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        showView('map');
      });
    }

    if(els.speakBtn){
      els.speakBtn.addEventListener('click', function(){
        if(!session.active) return;
        if(MathApp.sfx) MathApp.sfx('click');
        var q = session.questions[session.idx];
        if(q && MathApp.speak) MathApp.speak(q.spokenPrompt);
      });
    }

    if(els.formatToggleBtn){
      els.formatToggleBtn.addEventListener('click', function(){
        if(!session.active || session.locked) return;
        var q = session.questions[session.idx];
        if(!q || q.kind === 'mul' || !q.canToggleFormat || !q.equationModel) return;
        if(MathApp.sfx) MathApp.sfx('click');

        var curInp = els.equationRow ? els.equationRow.querySelector('.mq-input-slot[data-slot-id="ans"]') : null;
        var preservedVal = curInp ? curInp.value : '';
        session.displayFormat = session.displayFormat === 'vertical_mini' ? 'equation' : 'vertical_mini';
        syncFormatToggleButton(q);

        els.equationRow.innerHTML = renderCalcEquationHtml(q, session.displayFormat);
        if(q.uiMode === 'keypad'){
          bindEquationInputs();
          var nextInp = els.equationRow ? els.equationRow.querySelector('.mq-input-slot[data-slot-id="ans"]') : null;
          if(nextInp && preservedVal){
            nextInp.value = preservedVal;
          }
        }
      });
    }

    if(els.helperStage){
      els.helperStage.addEventListener('click', function(e){
        var labBtn = e.target.closest('[data-goto-calc-lab]');
        if(!labBtn) return;
        var aVal = Number(labBtn.getAttribute('data-a')) || 28;
        var bVal = Number(labBtn.getAttribute('data-b')) || 15;
        var opVal = labBtn.getAttribute('data-op') === 'sub' ? 'sub' : 'add';
        if(MathApp.sfx) MathApp.sfx('click');
        closeArcade();
        if(MathApp.tabs){
          MathApp.tabs.switchMainTab('calc');
          MathApp.tabs.switchSubTab('calc', 'learn');
        }
        if(MathApp.calc && MathApp.calc.loadProblem){
          MathApp.calc.loadProblem(aVal, bVal, opVal);
        }
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('🧱 已帶入 ' + aVal + (opVal === 'add' ? ' ＋ ' : ' − ') + bVal + ' 到直式教室，按「下一步」看積木動畫！');
        }
      });
    }

    if(els.choicesGrid){
      els.choicesGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-choice-bubble[data-choice]');
        if(!btn || btn.disabled) return;
        checkChoiceAnswer(btn.getAttribute('data-choice'), btn);
      });
    }

    if(els.toyKeysGrid){
      els.toyKeysGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-toy-key[data-key]');
        if(!btn) return;
        e.preventDefault();
        handleKeypadInput(btn.getAttribute('data-key'));
      });
    }

    if(els.nextBtn) els.nextBtn.addEventListener('click', goNextQuestion);
    if(els.partnerSkillBtn) els.partnerSkillBtn.addEventListener('click', usePartnerSkill);

    if(els.helperToggleBtn){
      els.helperToggleBtn.addEventListener('click', function(){
        if(!els.helperDrawer) return;
        if(MathApp.sfx) MathApp.sfx('click');
        if(els.helperDrawer.classList.contains('open')){
          els.helperDrawer.classList.remove('open');
          return;
        }
        // 本題已經使用過小幫手（已計算提示扣星），直接再次開啟不重複詢問
        if(session.usedHelperOnCurrent){
          openHelperDrawer('🧱 積木小幫手（本關最高 2 顆星）');
          return;
        }
        if(els.helperConfirmDialog && typeof els.helperConfirmDialog.showModal === 'function'){
          if(els.helperConfirmTip){
            var canUseFreePartner = Boolean(getActivePartnerIsland() && !session.partnerUsedSkill);
            els.helperConfirmTip.style.display = canUseFreePartner ? 'block' : 'none';
          }
          els.helperConfirmDialog.showModal();
          return;
        }
        session.usedHelperOnCurrent = true;
        session.usedHelperInStage = true;
        openHelperDrawer('🧱 積木小幫手（本關最高 2 顆星）');
      });
    }
    if(els.helperConfirmDialog){
      els.helperConfirmDialog.addEventListener('close', function(){
        var choice = els.helperConfirmDialog.returnValue;
        els.helperConfirmDialog.returnValue = '';
        if(choice !== 'confirm') return;
        if(MathApp.sfx) MathApp.sfx('click');
        session.usedHelperOnCurrent = true;
        session.usedHelperInStage = true;
        openHelperDrawer('🧱 積木小幫手（本關最高 2 顆星）');
      });
    }
    if(els.helperCloseBtn){
      els.helperCloseBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(els.helperDrawer) els.helperDrawer.classList.remove('open');
      });
    }

    if(els.heroSvg){
      els.heroSvg.addEventListener('click', function(){
        if(!session.active) return;
        if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
        else if(MathApp.sfx) MathApp.sfx('pop');
        runAnim(function(gsap){
          if(els.heroActor){
            gsap.fromTo(els.heroActor, { y: 0, scale: 1 }, { y: -18, scale: 1.08, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
          }
        });
      });
    }
    if(els.bossSvg){
      els.bossSvg.addEventListener('click', function(){
        if(!session.active) return;
        if(MathApp.sfx) MathApp.sfx('pop');
        runAnim(function(gsap){
          if(els.enemyActor){
            gsap.fromTo(els.enemyActor, { scaleX: 1, scaleY: 1, rotation: 0 }, { scaleX: 1.1, scaleY: 0.9, rotation: -4, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
          }
        });
      });
    }

    if(els.resNextBtn){
      els.resNextBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        var realmStages = getStagesByRealm((session.stage && session.stage.realmId) || 'mul');
        var curIdx = realmStages.indexOf(session.stage);
        if(curIdx >= 0 && curIdx + 1 < realmStages.length){
          startStage(realmStages[curIdx + 1].stageKey || realmStages[curIdx + 1].id);
        } else {
          showView('map');
        }
      });
    }
    if(els.resRetryBtn){
      els.resRetryBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(session.stage) startStage(session.stage.stageKey || session.stage.id);
      });
    }
    if(els.resMapBtn){
      els.resMapBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        showView('map');
      });
    }

    function equipCostume(cId, showToast){
      if(!saveData.unlockedCostumes || !saveData.unlockedCostumes[cId]) return false;
      saveData.activeCostume = cId;
      saveData.hasNewCostume = false;
      if(saveData.wardrobe && saveData.wardrobe.active && LEGACY_COSTUME_MIGRATION_MAP[cId]){
        var m = LEGACY_COSTUME_MIGRATION_MAP[cId];
        if(m.hat) saveData.wardrobe.active.hat = m.hat;
        if(m.outfit) saveData.wardrobe.active.outfit = m.outfit;
      }
      persistSave();
      syncAllBunnyVisuals();
      updateHubStats();
      if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
      else if(MathApp.sfx) MathApp.sfx('pop');
      if(showToast && MathApp.utils && MathApp.utils.showToast){
        var cObj = getCostumeById(cId);
        MathApp.utils.showToast(cObj.icon + ' 粉紅小兔已經換上【' + cObj.name + '】囉！');
      }
      return true;
    }

    if(els.unlockShowcase){
      els.unlockShowcase.addEventListener('click', function(e){
        var quickBtn = e.target.closest('[data-quick-equip-costume]');
        if(!quickBtn) return;
        var cId = quickBtn.getAttribute('data-quick-equip-costume');
        if(!equipCostume(cId, true)) return;
        els.unlockShowcase.querySelectorAll('[data-quick-equip-costume]').forEach(function(b){
          var active = b.getAttribute('data-quick-equip-costume') === cId;
          b.classList.toggle('equipped', active);
          b.textContent = active ? '✅ 已換上！' : '✨ 馬上換上';
        });
      });
    }

    setupDialogPolyfill(els.dexDialog);
    if(els.dexDialog){
      var dexTabs = Array.prototype.slice.call(els.dexDialog.querySelectorAll('.mqst-dex-tab[data-dex]'));

      function switchDexTab(target, focusTab){
        if(target === 'wardrobe' && saveData.hasNewCostume){
          saveData.hasNewCostume = false;
          persistSave();
          updateHubStats();
        }
        dexTabs.forEach(function(t){
          var act = (t.getAttribute('data-dex') === target);
          t.classList.toggle('active', act);
          t.setAttribute('aria-selected', String(act));
          t.setAttribute('tabindex', act ? '0' : '-1');
          if(act){
            if(t.scrollIntoView){
              try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch(err){}
            }
            if(focusTab) t.focus();
          }
        });
        if(els.paneGems)     els.paneGems.hidden     = (target !== 'gems');
        if(els.paneSkills)   els.paneSkills.hidden   = (target !== 'skills');
        if(els.paneWardrobe) els.paneWardrobe.hidden = (target !== 'wardrobe');
        if(els.paneSprites)  els.paneSprites.hidden  = (target !== 'sprites');
        if(els.paneBadges)   els.paneBadges.hidden   = (target !== 'badges');
      }

      function jumpToStageFromDex(stageId){
        var st = getStageById(stageId);
        if(!st) return;
        if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
        if(saveData.activeRealm !== st.realmId){
          switchRealm(st.realmId, false);
        }
        walkBunnyAndStart(st.stageKey || st.id);
      }

      function openDexDialog(initialTab){
        if(MathApp.sfx) MathApp.sfx('click');
        var tab = initialTab || (saveData.activeRealm === 'sunny' ? 'skills' : 'gems');
        if(tab === 'wardrobe' && saveData.hasNewCostume){
          saveData.hasNewCostume = false;
          persistSave();
          updateHubStats();
        }
        renderDexDialog();
        switchDexTab(tab, false);
        els.dexDialog.showModal();
      }

      if(els.openDexBtn){
        els.openDexBtn.addEventListener('click', function(){ openDexDialog(); });
      }
      if(els.openWardrobeBtn){
        els.openWardrobeBtn.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }
      if(els.hudAvatar){
        els.hudAvatar.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }

      if(els.paneWardrobe){
        els.paneWardrobe.addEventListener('click', function(e){
          var previewBtn = e.target.closest('#mqst-wardrobe-preview-btn');
          if(previewBtn){
            if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
            else if(MathApp.sfx) MathApp.sfx('pop');
            runAnim(function(gsap){
              gsap.fromTo(previewBtn, { y: 0, scale: 1 }, { y: -10, scale: 1.08, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
            });
            return;
          }
          var gemHuntBtn = e.target.closest('[data-wardrobe-gem-hunt]');
          if(gemHuntBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            startGemHuntBattle();
            return;
          }
          var eqCostumeBtn = e.target.closest('[data-equip-costume]');
          if(!eqCostumeBtn) return;
          var cId = eqCostumeBtn.getAttribute('data-equip-costume');
          if(equipCostume(cId, true)){
            renderWardrobePane();
          }
        });
      }

      if(els.paneGems){
        els.paneGems.addEventListener('click', function(e){
          var huntBtn = e.target.closest('#mqst-gem-hunt-btn');
          if(huntBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            startGemHuntBattle();
            return;
          }

          var gotoBtn = e.target.closest('[data-goto-stage]');
          if(gotoBtn){
            var sid = gotoBtn.getAttribute('data-goto-stage');
            if(MathApp.sfx) MathApp.sfx('click');
            jumpToStageFromDex(sid);
            return;
          }

          var cell = e.target.closest('button.mqst-gem-cell[data-gem-a]');
          if(!cell) return;
          var ga = Number(cell.getAttribute('data-gem-a'));
          var gb = Number(cell.getAttribute('data-gem-b'));
          var isLit = cell.getAttribute('data-gem-lit') === '1';
          var msgEl = document.getElementById('mqst-gem-inspector-msg');
          var actEl = document.getElementById('mqst-gem-inspector-actions');
          var collectableUnlit = getCollectableUnlitGems();
          var huntBtnHtml = collectableUnlit.length > 0
            ? ('<button type="button" class="mqst-tool-btn mqst-gem-hunt-btn" id="mqst-gem-hunt-btn">✨ 補齊未點亮寶石（剩 ' + collectableUnlit.length + ' 顆）</button>')
            : '';

          if(isLit){
            var mantra = (MathApp.mul && MathApp.mul.getMantra) ? MathApp.mul.getMantra(ga, gb) : (ga + '×' + gb);
            if(MathApp.sfx) MathApp.sfx('pop');
            if(msgEl) msgEl.innerHTML = '💎 <b>' + ga + ' × ' + gb + ' ＝ ' + (ga * gb) + '</b>（口訣：<b>' + mantra + '</b>）';
            if(actEl) actEl.innerHTML = huntBtnHtml;
            scheduleSpeak(mantra + '，' + ga + ' 乘以 ' + gb + ' 等於 ' + (ga * gb), 60);
          } else {
            var rec = findRecommendedStageForTable(ga);
            var unlocked = rec && isStageUnlocked(rec.id);
            if(MathApp.sfx) MathApp.sfx('click');
            if(msgEl){
              msgEl.innerHTML = unlocked
                ? ('🔒 <b>' + ga + ' × ' + gb + '</b> 尚未點亮，可在【<b>' + rec.id + ' · ' + rec.label + '</b>】一次答對點亮！')
                : ('🔒 <b>' + ga + ' × ' + gb + '</b> 尚未點亮，先解鎖【<b>' + rec.id + ' · ' + rec.label + '</b>】就能遇到喔！');
            }
            if(actEl){
              actEl.innerHTML = (unlocked ? ('<button type="button" class="mqst-tool-btn mqst-gem-goto-btn" data-goto-stage="' + rec.id + '">前往 ' + rec.id + '</button>') : '') + huntBtnHtml;
            }
          }
        });
      }

      if(els.paneSkills){
        els.paneSkills.addEventListener('click', function(e){
          var gotoBtn = e.target.closest('[data-goto-stage]');
          if(!gotoBtn) return;
          var sid = gotoBtn.getAttribute('data-goto-stage');
          if(MathApp.sfx) MathApp.sfx('click');
          jumpToStageFromDex(sid);
        });
      }

      if(els.paneSprites){
        els.paneSprites.addEventListener('click', function(e){
          var gotoBossBtn = e.target.closest('[data-goto-boss]');
          if(gotoBossBtn){
            var sid = gotoBossBtn.getAttribute('data-goto-boss');
            if(MathApp.sfx) MathApp.sfx('click');
            jumpToStageFromDex(sid);
            return;
          }
          var eqBtn = e.target.closest('[data-equip-sprite]');
          if(!eqBtn) return;
          var spId = toCanonicalPartnerId(eqBtn.getAttribute('data-equip-sprite'));
          var currentPartner = getActivePartnerId(saveData);
          var wasSame = (currentPartner === spId);
          if(!saveData.partners) saveData.partners = { activeId: '', bonds: {} };
          saveData.partners.activeId = wasSame ? '' : spId;
          persistSave();
          if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
          else if(MathApp.sfx) MathApp.sfx('pop');
          renderDexDialog();
          renderMap();
          if(MathApp.utils && MathApp.utils.showToast){
            if(wasSame){
              MathApp.utils.showToast('已讓守護小精靈先回圖鑑休息囉！');
            } else {
              var picked = getActivePartnerIsland();
              MathApp.utils.showToast('🤝 【' + (picked ? picked.spriteName : '守護小精靈') + '】已加入冒險隊伍！');
            }
          }
        });
      }

      dexTabs.forEach(function(tab, idx){
        tab.addEventListener('click', function(){
          if(MathApp.sfx) MathApp.sfx('click');
          switchDexTab(tab.getAttribute('data-dex'), false);
        });
        tab.addEventListener('keydown', function(e){
          var nextIdx = -1;
          if(e.key === 'ArrowRight') nextIdx = (idx + 1) % dexTabs.length;
          else if(e.key === 'ArrowLeft') nextIdx = (idx - 1 + dexTabs.length) % dexTabs.length;
          else if(e.key === 'Home') nextIdx = 0;
          else if(e.key === 'End') nextIdx = dexTabs.length - 1;
          if(nextIdx !== -1){
            e.preventDefault();
            if(MathApp.sfx) MathApp.sfx('click');
            switchDexTab(dexTabs[nextIdx].getAttribute('data-dex'), true);
          }
        });
      });
    }

    setupDialogPolyfill(els.parentDialog);
    if(els.openParentBtn && els.parentDialog){
      els.openParentBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        updatePreviewToggleBtn();
        refreshParentLock();
        if(els.backupFeedback){
          els.backupFeedback.textContent = '';
          els.backupFeedback.className = 'mqst-parent-status mqst-backup-status';
        }
        els.parentDialog.showModal();
      });
    }
    if(els.exportSaveBtn){
      els.exportSaveBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        var payload = serializeBackupPayload(saveData);
        var fileName = 'math-adventure-backup-' + getLocalDateKey() + '.json';
        try {
          var blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
          if(els.backupFeedback){
            els.backupFeedback.textContent = '✅ 已匯出備份檔案：' + fileName;
            els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-ok';
          }
        } catch(err){
          if(els.backupFeedback){
            els.backupFeedback.textContent = '⚠️ 無法啟動檔案下載，請再試一次。';
            els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-error';
          }
        }
      });
    }
    if(els.importSaveInput){
      var importLabel = document.querySelector('label[for="mqst-import-save-input"]');
      if(importLabel){
        importLabel.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            els.importSaveInput.click();
          }
        });
      }
      els.importSaveInput.addEventListener('change', function(){
        var file = els.importSaveInput.files && els.importSaveInput.files[0];
        if(!file) return;
        var handleRawText = function(rawText){
          var res = parseAndValidateBackupJson(rawText);
          els.importSaveInput.value = '';
          if(!res.ok){
            if(MathApp.sfx) MathApp.sfx('wrong');
            if(els.backupFeedback){
              els.backupFeedback.textContent = '❌ ' + res.error;
              els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-error';
            }
            return;
          }
          saveData = res.save;
          persistSave();
          updatePreviewToggleBtn();
          syncAllBunnyVisuals();
          updateHubStats();
          renderMap();
          if(MathApp.sfx) MathApp.sfx('correct');
          if(els.backupFeedback){
            els.backupFeedback.textContent = '✅ 已還原冒險進度（⭐ ' + res.summary.stars + ' 星、🪙 ' + res.summary.starCoins + ' 星星幣、💎 ' + res.summary.gems + ' 寶石）！';
            els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-ok';
          }
          if(MathApp.utils && MathApp.utils.showToast){
            MathApp.utils.showToast('📦 已成功匯入冒險進度備份！');
          }
        };
        if(typeof file.text === 'function'){
          file.text().then(handleRawText).catch(function(){
            els.importSaveInput.value = '';
            if(els.backupFeedback){
              els.backupFeedback.textContent = '❌ 讀取備份檔案失敗，請重試。';
              els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-error';
            }
          });
        } else {
          var reader = new FileReader();
          reader.onload = function(){ handleRawText(String(reader.result || '')); };
          reader.onerror = function(){
            els.importSaveInput.value = '';
            if(els.backupFeedback){
              els.backupFeedback.textContent = '❌ 讀取備份檔案失敗，請重試。';
              els.backupFeedback.className = 'mqst-parent-status mqst-backup-status is-error';
            }
          };
          reader.readAsText(file);
        }
      });
    }
    if(els.previewToggle){
      els.previewToggle.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        saveData.previewAll = !saveData.previewAll;
        persistSave();
        updatePreviewToggleBtn();
        renderMap();
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast(saveData.previewAll ? '已開啟自由挑選／預習模式' : '已恢復依序闖關模式');
        }
      });
    }
    if(els.parentUnlockBtn){
      var verifyParentUnlock = function(){
        var raw = els.parentLockIn ? els.parentLockIn.value.trim() : '';
        if(!raw){
          if(MathApp.sfx) MathApp.sfx('wrong');
          if(els.parentFeedback) els.parentFeedback.textContent = '請先輸入驗證答案！';
          if(els.parentLockIn) els.parentLockIn.focus();
          return;
        }
        var val = Number(raw);
        if(val === dialogs.getParentChallengeAns()){
          if(MathApp.sfx) MathApp.sfx('correct');
          if(els.parentFeedback) els.parentFeedback.textContent = '';
          if(els.parentLockBox) els.parentLockBox.style.display = 'none';
          if(els.resetConfirmRow) els.resetConfirmRow.style.display = 'block';
        } else {
          if(MathApp.sfx) MathApp.sfx('wrong');
          if(els.parentFeedback) els.parentFeedback.textContent = '驗證答案不正確，請再算算看！';
          if(els.parentLockIn){
            els.parentLockIn.focus();
            els.parentLockIn.select();
          }
        }
      };
      els.parentUnlockBtn.addEventListener('click', verifyParentUnlock);
      if(els.parentLockIn){
        els.parentLockIn.addEventListener('keydown', function(e){
          if(e.key === 'Enter' && !e.isComposing){
            e.preventDefault();
            verifyParentUnlock();
          }
        });
        els.parentLockIn.addEventListener('input', function(){
          if(els.parentFeedback && els.parentFeedback.textContent){
            els.parentFeedback.textContent = '';
          }
        });
      }
    }
    if(els.resetAllBtn){
      els.resetAllBtn.addEventListener('click', function(){
        saveData = createDefaultSaveV2();
        persistSave();
        updatePreviewToggleBtn();
        refreshParentLock();
        syncAllBunnyVisuals();
        renderMap();
        if(els.parentDialog) els.parentDialog.close();
        if(MathApp.sfx) MathApp.sfx('click');
        if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast('已重置所有數學冒險島紀錄！');
      });
    }

    setupDialogPolyfill(els.audioDialog);
    function openAudioDialog(){
      if(!els.audioDialog) return;
      syncAudioButtons();
      if(els.audioDialog.showModal) els.audioDialog.showModal();
      else els.audioDialog.setAttribute('open', '');
      if(MathApp.sfx) MathApp.sfx('click');
    }
    [els.mapAudioBtn, els.battleAudioBtn].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click', openAudioDialog);
    });
    if(els.dlgBgmBtn){
      els.dlgBgmBtn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleBgm) MathApp.audio.toggleBgm();
        syncAudioButtons();
      });
    }
    if(els.dlgSoundBtn){
      els.dlgSoundBtn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleSound) MathApp.audio.toggleSound();
        syncAudioButtons();
      });
    }
    if(els.dlgVoiceBtn){
      els.dlgVoiceBtn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleVoice) MathApp.audio.toggleVoice();
        syncAudioButtons();
      });
    }

    document.addEventListener('keydown', function(e){
      if(!session.arcadeOpen) return;
      if(e.key === 'Escape'){
        if((els.dexDialog && els.dexDialog.open) || (els.parentDialog && els.parentDialog.open) || (els.audioDialog && els.audioDialog.open)) return;
        // 戰鬥中誤按 Esc 僅返回世界地圖，避免直接關閉全螢幕而失去進度
        if(session.active && els.battleView && els.battleView.style.display !== 'none'){
          showView('map');
        } else {
          closeArcade();
        }
        return;
      }
      if(!session.active || els.battleView.style.display === 'none') return;

      if(e.key >= '0' && e.key <= '9'){
        e.preventDefault();
        handleKeypadInput(e.key);
      } else if(e.key === 'Backspace'){
        e.preventDefault();
        handleKeypadInput('backspace');
      } else if(e.key === 'Enter'){
        e.preventDefault();
        handleKeypadInput('enter');
      }
    });

    if(MathApp.on){
      MathApp.on('audioChange', syncAudioButtons);
      MathApp.on('mulExplore', function(){
        if(!saveData.stats.exploredInLab){
          saveData.stats.exploredInLab = true;
          checkAndUnlockBadges();
          persistSave();
        }
      });
      MathApp.on('tabChange', function(tab){
        if(tab === 'quest'){
          updateHubStats();
          syncAllBunnyVisuals();
        } else {
          if(session.arcadeOpen) closeArcade();
          if(MathApp.stopSpeak) MathApp.stopSpeak();
        }
      });
      MathApp.on('questOpenRealm', function(info){
        if(info && info.realmId){
          saveData.activeRealm = getRealmById(info.realmId).id;
          persistSave();
        }
        if(info && info.openArcade){
          openArcade();
        } else {
          renderMap();
        }
      });
    }
  }

  function init(){
    cacheDom();
    if(!els.islandsGrid) return;

    // 升級舊存檔時自動補齊已達標的小兔造型
    if(checkAndUnlockCostumes(true).length > 0){
      persistSave();
    }
    syncAllBunnyVisuals();

    initGsapMedia();
    bindEvents();
    syncAudioButtons();
    updateHubStats();
    renderMap();
  }

  MathApp.quest = MathApp.mulQuest = {
    init: init,
    getRealms: function(){ return REALMS.slice(); },
    getIslands: function(){ return ISLANDS.slice(); },
    getStages: function(){ return STAGES.slice(); },
    getBadges: function(){ return BADGES.slice(); },
    getCostumes: function(){ return BUNNY_COSTUMES.slice(); },
    getSkillCards: function(){ return SKILL_CARDS.slice(); },
    buildStageQuestions: buildStageQuestions,
    getPinkBunnySvg: getPinkBunnySvg,
    getStageChestSvg: getStageChestSvg,
    getCharacterSvg: getCharacterSvg,
    getActivePartnerIsland: getActivePartnerIsland,
    getSaveV2: function(){ return normalizeSaveDataV2(saveData); },
    exportBackupJson: function(){ return serializeBackupPayload(saveData); },
    importBackupJson: function(rawText){
      var res = parseAndValidateBackupJson(rawText);
      if(!res.ok) return res;
      saveData = res.save;
      persistSave();
      updatePreviewToggleBtn();
      syncAllBunnyVisuals();
      updateHubStats();
      renderMap();
      return res;
    },
    getSaveSummary: function(){
      return {
        stars: countTotalStars(),
        starCoins: Number(saveData.starCoins || 0),
        gems: countLitGems(),
        sprites: countUnlockedSprites(),
        costumes: countUnlockedCostumes(),
        rescueCount: (saveData.rescueCases || []).length
      };
    }
  };

})();
