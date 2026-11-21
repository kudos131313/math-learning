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
  WARDROBE_ITEMS,
  TREEHOUSE_SLOTS,
  TREEHOUSE_ITEMS,
  PARTNER_SNACKS,
  getRealmById,
  getIslandById,
  getStageById,
  getStagesByRealm,
  getCostumeById,
  getSpecialtyMeta,
  getWardrobeItemById,
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
  buildGemHuntQuestions as buildQuestGemHuntQuestions,
  unlockStoryForQuestion,
  syncAlbumFromProgress,
  countDefeatedBosses,
  countUnlockedStories,
  resolveClassroomTargetForQuestion
} from '../src/domain/quest-questions.js';
import {
  ensureDailyQuests,
  recordDailyQuestProgress,
  countClaimableDailyQuests,
  claimDailyQuestReward,
  getPartnerBondInfo,
  computeBattleBondXp,
  addPartnerBondXp,
  getPartnerSpecialtyEffects,
  resolveWrongAnswerWithShield,
  calculateLuckyCoinBonus,
  rollLuckyPerCorrectDrop,
  buildEliminateKeypadHint,
  getActiveWardrobe,
  countUnlockedWardrobeItems,
  purchaseWardrobeItem,
  equipWardrobeItem,
  purchaseTreehouseItem,
  equipTreehouseSlot,
  toggleTreehousePlaymate,
  feedPartnerSnack,
  applyClassroomPracticeReward,
  CLASSROOM_DAILY_COIN_CAP
} from '../src/domain/quest-retention.js';
import {
  TOWER_MAX_HEARTS,
  TOWER_BOSS_INTERVAL,
  TOWER_COINS_PER_FLOOR,
  TOWER_BOSS_CHEST_COINS,
  TOWER_ROUTES,
  getTowerRouteById,
  isTowerUnlocked,
  isTowerBossFloor,
  getTowerGuardianForFloor,
  generateTowerFloorQuestion,
  createTowerRunState,
  applyTowerWrongAnswer,
  applyTowerFloorClear,
  recordTowerBestFloor,
  getTowerBestFloor
} from '../src/domain/quest-tower.js';
import {
  BOSS_ALBUM_ENTRIES,
  STORY_ALBUM_ENTRIES
} from '../src/domain/quest-data.js';
import { generateCalcChoices } from '../src/domain/quest-calc-questions.js';
import { generateCloudChoices } from '../src/domain/quest-cloud-questions.js';
import { renderCalcEquationHtml, renderCalcHelperHtml } from '../src/quest/calc-ui.js';
import { renderCloudQuestionHtml, renderCloudHelperHtml } from '../src/quest/cloud-ui.js';
import {
  renderPinkBunnySvg,
  getStageChestSvg,
  getCharacterSvg,
  getProjectileSvg
} from '../src/quest/svg-art.js';
import {
  getTreehouseInteractMessage,
  renderTreehouseSlotContentHtml,
  getTreehouseWallpaperMeta,
  isLightableCeiling
} from '../src/quest/treehouse-svg.js';
import {
  animateSlotSwap,
  playObjectEasterEgg,
  showActorSpeechBubble,
  playFeedSnackAnimation
} from '../src/quest/treehouse-fx.js';
import { createBattleFx } from '../src/quest/battle-fx.js';
import { createQuestDialogs } from '../src/quest/dialogs.js';

(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  function getPinkBunnySvg(mood, costumeOrWardrobe){
    return renderPinkBunnySvg(mood, costumeOrWardrobe || getActiveWardrobe(saveData));
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
    isTowerMode: false,
    towerRun: null,
    towerGameOver: false,
    wrongCountOnCurrent: 0,
    lastClassroomTarget: null,
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
    guidedStepIdx: 0,
    cloudUnlockedBefore: true,
    earnedCoinsThisRun: 0,
    rescuedThisRun: 0,
    locked: false,
    enemyHp: 0,
    enemyMaxHp: 0,
    bossShield: 0,
    bossShieldMax: 0,
    partnerUsedSkill: false,
    battlePartnerId: '',
    partnerEffects: null,
    partnerSkillUsesLeft: 0,
    partnerShieldChargesLeft: 0,
    partnerSkillBonusCoins: 0,
    partnerLuckyDropCoins: 0,
    partnerShieldTriggeredCount: 0,
    finisherCountThisRun: 0,
    battleTheme: 'forest',
    battleBossObj: null,
    activeInput: null,
    nextLocked: false,
    treehouseTab: 'decor',
    treehouseSlot: 'wallpaper',
    treehouseSelectedPartner: '',
    treehouseDecorateMode: false,
    treehouseDockCollapsed: false,
    treehouseLampLit: true
  };

  var els = {};
  var bunnyIdleTween = null;
  var partnerIdleTween = null;
  var speakTimer = null;
  var nextUnlockTimer = null;

  var finisherBag = [];
  var lastFinisherId = '';

  function getActiveWandDef(){
    var activeW = getActiveWardrobe(saveData);
    return getWardrobeItemById(activeW.wand, 'wand') || getWardrobeItemById('none', 'wand');
  }

  function pickNextFinisher(){
    var wandDef = getActiveWandDef();
    if(wandDef && wandDef.preferredFinisher && FINISHER_DEFS[wandDef.preferredFinisher]){
      if(session.finisherCountThisRun === 0 || Math.random() < 0.65){
        lastFinisherId = wandDef.preferredFinisher;
        return wandDef.preferredFinisher;
      }
    }
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
  function countUnlockedCostumes(){ return countUnlockedWardrobeItems(saveData); }

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
    var activeW = getActiveWardrobe(saveData);
    var normalSvg = getPinkBunnySvg('normal', activeW);
    if(els.launcherBunny) els.launcherBunny.innerHTML = normalSvg;
    if(els.hudAvatarArt)  els.hudAvatarArt.innerHTML  = normalSvg;
    else if(els.hudAvatar) els.hudAvatar.innerHTML    = normalSvg;
    if(els.bunnyAvatar)   els.bunnyAvatar.innerHTML   = normalSvg;
    if(els.heroSvg){
      var battleMood = (session.active && session.combo >= 3) ? 'fever' : 'normal';
      els.heroSvg.innerHTML = getPinkBunnySvg(battleMood, activeW);
    }
    if(els.victoryBunny){
      els.victoryBunny.innerHTML = getPinkBunnySvg('happy', activeW);
    }
    if(els.thStage){
      var thBunnyBtn = els.thStage.querySelector('.mqst-th-bunny-btn');
      if(thBunnyBtn){
        thBunnyBtn.innerHTML = getPinkBunnySvg('happy', activeW) + '<span class="mqst-th-bunny-tag">粉紅小兔</span>';
      }
    }
  }

  function syncProjectileVisual(){
    if(!els.projectile) return;
    var wandDef = getActiveWandDef();
    var boltTheme = (wandDef && wandDef.boltTheme) || 'star';
    els.projectile.innerHTML = getProjectileSvg(boltTheme);
    els.projectile.className = 'mqst-projectile mqst-fx-bolt bolt-' + boltTheme;
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
  var renderAlbumPane = dialogs.renderAlbumPane;
  var renderDailyDialog = dialogs.renderDailyDialog;
  var renderShopDialog = dialogs.renderShopDialog;
  var renderTreehouseView = dialogs.renderTreehouseView;
  var renderTowerDialog = dialogs.renderTowerDialog;
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
    els.launchTowerBtn = document.getElementById('mqst-launch-tower-btn');
    els.arcadeOverlay  = document.getElementById('mqst-arcade-overlay');
    els.exitArcadeBtn  = document.getElementById('mqst-exit-arcade-btn');
    els.battleExitBtn  = document.getElementById('mqst-battle-exit-btn');

    els.hudAvatar      = document.getElementById('mqst-hud-avatar');
    els.hudAvatarArt   = document.getElementById('mqst-hud-avatar-art');
    els.hudStatusTray  = document.querySelector('#mqst-map-view .mqst-hud-status-tray');
    els.totalStars     = document.getElementById('mqst-total-stars');
    els.totalStarsMax  = document.getElementById('mqst-total-stars-max');
    els.coinCount      = document.getElementById('mqst-coin-count');
    els.gemCount       = document.getElementById('mqst-gem-count');
    els.spriteCount    = document.getElementById('mqst-sprite-count');
    els.spriteCountMax = document.getElementById('mqst-sprite-count-max');
    els.rescueBtn      = document.getElementById('mqst-rescue-btn');
    els.rescueCount    = document.getElementById('mqst-rescue-count');
    els.openDailyBtn   = document.getElementById('mqst-open-daily-btn');
    els.dailyBadge     = document.getElementById('mqst-daily-badge');
    els.openTreehouseBtn = document.getElementById('mqst-open-treehouse-btn');
    els.openShopBtn    = document.getElementById('mqst-open-shop-btn');
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
    els.openTowerBtn   = document.getElementById('mqst-open-tower-btn');
    els.towerEntryTag  = document.getElementById('mqst-tower-entry-tag');
    els.devBadge       = document.getElementById('mqst-dev-badge');
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
    els.battleProgressWrap = document.querySelector('#mqst-battle-view .mqst-battle-progress-wrap');
    els.stageChip      = document.getElementById('mqst-stage-chip');
    els.towerHud       = document.getElementById('mqst-tower-hud');
    els.towerFloorBadge= document.getElementById('mqst-tower-floor-badge');
    els.towerRouteTag  = document.getElementById('mqst-tower-route-tag');
    els.towerHearts    = document.getElementById('mqst-tower-hearts');
    els.towerNextBossChip = document.getElementById('mqst-tower-nextboss-chip');
    els.towerCoinsEarned  = document.getElementById('mqst-tower-coins-earned');
    els.towerRetreatBtn   = document.getElementById('mqst-tower-retreat-btn');
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
    els.partnerLvTag   = document.getElementById('mqst-partner-lv-tag');
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
    els.stuckBanner    = document.getElementById('mqst-stuck-banner');
    els.stuckMsg       = document.getElementById('mqst-stuck-msg');
    els.stuckGotoBtn   = document.getElementById('mqst-stuck-goto-classroom-btn');
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
    els.resClassroomBtn= document.getElementById('mqst-res-classroom-btn');
    els.resClassroomLbl= document.getElementById('mqst-res-classroom-lbl');
    els.resMapBtn      = document.getElementById('mqst-res-map-btn');

    els.treehouseView  = document.getElementById('mqst-treehouse-view');
    els.thBackMapBtn   = document.getElementById('mqst-th-back-map-btn');
    els.thCoins        = document.getElementById('mqst-th-coins');
    els.thDecorateModeBtn = document.getElementById('mqst-th-decorate-mode-btn');
    els.thOpenShopBtn  = document.getElementById('mqst-th-open-shop-btn');
    els.thOpenWardrobeBtn = document.getElementById('mqst-th-open-wardrobe-btn');
    els.thExitBtn      = document.getElementById('mqst-th-exit-btn');
    els.thStage        = document.getElementById('mqst-treehouse-stage');
    els.thToast        = document.getElementById('mqst-treehouse-toast');
    els.thDock         = document.getElementById('mqst-treehouse-dock');
    els.thDockToggleBtn= document.getElementById('mqst-th-dock-toggle-btn');
    els.thDockBody     = document.getElementById('mqst-th-dock-body');
    els.thPaneDecor    = document.getElementById('mqst-th-pane-decor');
    els.thPaneSprites  = document.getElementById('mqst-th-pane-sprites');

    els.dexDialog      = document.getElementById('mqst-dex-dialog');
    els.dexBody        = document.getElementById('mqst-dex-body');
    els.dexNav         = els.dexDialog ? els.dexDialog.querySelector('.mqst-dex-nav') : null;
    els.dexTabWardrobe = document.getElementById('mqst-tab-wardrobe');
    els.paneGems       = document.getElementById('mqst-pane-gems');
    els.paneSkills     = document.getElementById('mqst-pane-skills');
    els.paneWardrobe   = document.getElementById('mqst-pane-wardrobe');
    els.paneSprites    = document.getElementById('mqst-pane-sprites');
    els.paneAlbum      = document.getElementById('mqst-pane-album');
    els.paneBadges     = document.getElementById('mqst-pane-badges');

    els.towerDialog    = document.getElementById('mqst-tower-dialog');
    els.towerBody      = document.getElementById('mqst-tower-body');

    els.dailyDialog    = document.getElementById('mqst-daily-dialog');
    els.dailyBody      = document.getElementById('mqst-daily-body');
    els.shopDialog     = document.getElementById('mqst-shop-dialog');
    els.shopCoinBal    = document.getElementById('mqst-shop-coin-bal');
    els.shopPaneWardrobe  = document.getElementById('mqst-shop-pane-wardrobe');
    els.shopPaneTreehouse = document.getElementById('mqst-shop-pane-treehouse');
    els.shopPaneSnacks    = document.getElementById('mqst-shop-pane-snacks');

    els.parentDialog   = document.getElementById('mqst-parent-dialog');
    els.previewToggle  = document.getElementById('mqst-preview-toggle-btn');
    els.previewStatusMsg = document.getElementById('mqst-preview-status-msg');
    els.devToggle      = document.getElementById('mqst-dev-toggle-btn');
    els.devStatusMsg   = document.getElementById('mqst-dev-status-msg');
    els.devToolbox     = document.getElementById('mqst-dev-toolbox');
    els.devAddCoinsBtn = document.getElementById('mqst-dev-add-coins-btn');
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
    ensureDailyQuests(saveData, getLocalDateKey());
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
    ensureDailyQuests(saveData, getLocalDateKey());
    var maxStars = STAGES.length * 3;
    var maxSprites = ISLANDS.length;
    var stars = countTotalStars();
    var coins = Number(saveData.starCoins || 0);
    var gems = countLitGems();
    var sprites = countUnlockedSprites();
    var costumes = countUnlockedCostumes();
    var claimableDaily = countClaimableDailyQuests(saveData);

    if(els.totalStars)       els.totalStars.textContent       = String(stars);
    if(els.totalStarsMax)    els.totalStarsMax.textContent    = String(maxStars);
    if(els.coinCount)        els.coinCount.textContent        = String(coins);
    if(els.thCoins)          els.thCoins.textContent          = String(coins);
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

    if(els.openDailyBtn){
      els.openDailyBtn.classList.toggle('has-claimable', claimableDaily > 0);
    }
    if(els.dailyBadge){
      els.dailyBadge.style.display = claimableDaily > 0 ? 'inline-flex' : 'none';
      els.dailyBadge.textContent = String(claimableDaily);
    }

    var hasNewCostume = Boolean(saveData.hasNewCostume);
    if(els.hudAvatar){
      els.hudAvatar.classList.toggle('has-new', hasNewCostume);
    }
    if(els.openWardrobeBtn){
      els.openWardrobeBtn.classList.toggle('has-new', hasNewCostume);
    }
    if(els.dexTabWardrobe){
      els.dexTabWardrobe.classList.toggle('has-new', hasNewCostume);
    }

    var rLen = (saveData.rescueCases || []).length;
    if(els.rescueCount) els.rescueCount.textContent = String(rLen);
    if(els.rescueBtn){
      els.rescueBtn.hidden = (rLen === 0);
      els.rescueBtn.classList.toggle('has-rescue', rLen > 0);
      els.rescueBtn.disabled = (rLen === 0);
    }
    if(els.devBadge){
      els.devBadge.style.display = saveData.devMode ? 'inline-flex' : 'none';
    }
    if(els.previewBadge){
      els.previewBadge.style.display = saveData.previewAll ? 'inline-flex' : 'none';
    }
    var towerOpen = isTowerUnlocked(saveData);
    var towerBest = getTowerBestFloor(saveData);
    if(els.openTowerBtn){
      els.openTowerBtn.classList.toggle('is-unlocked', towerOpen);
      els.openTowerBtn.classList.toggle('is-locked', !towerOpen);
    }
    if(els.launchTowerBtn){
      els.launchTowerBtn.classList.toggle('is-unlocked', towerOpen);
      els.launchTowerBtn.classList.toggle('is-locked', !towerOpen);
    }
    if(els.towerEntryTag){
      if(!towerOpen){
        els.towerEntryTag.style.display = 'inline-flex';
        els.towerEntryTag.className = 'mqst-realm-badge locked mqst-tower-entry-tag';
        els.towerEntryTag.textContent = '🔒 未解鎖';
      } else if(towerBest > 0){
        els.towerEntryTag.style.display = 'inline-flex';
        els.towerEntryTag.className = 'mqst-realm-badge mqst-tower-entry-tag';
        els.towerEntryTag.textContent = '🏆 ' + towerBest + ' 層';
      } else {
        els.towerEntryTag.style.display = 'none';
      }
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
    var isComingSoon = (realm.status !== 'active');
    var starPct = Math.min(100, Math.round((prog.stars / prog.minStars) * 100));
    var bossPct = Math.min(100, Math.round((prog.bosses / prog.minBosses) * 100));

    var unlockNoteHtml = '';
    if(realm.unlockMode === 'conditional'){
      if(isComingSoon){
        unlockNoteHtml = prog.unlocked
          ? '<div class="mqst-realm-unlock-box is-ready">✅ 恭喜！你的跨海域探險資歷已達雲端門檻（⭐ ' + prog.stars + ' 星 / 🐣 ' + prog.bosses + ' 隻精靈），待航道竣工即可直接登島！</div>'
          : '<div class="mqst-realm-unlock-box">🔓 正式啟航解鎖條件：全海域累積 <b>' + prog.minStars + ' 顆星</b>（目前 ' + prog.stars + ' 星）或擊敗任 <b>' + prog.minBosses + ' 位島嶼魔王</b>（目前 ' + prog.bosses + ' 位），預習模式也可全開！</div>';
      } else {
        unlockNoteHtml =
          '<div class="mqst-realm-unlock-box">' +
          '<div>🔒 完成<strong>任一項</strong>條件即可開啟「' + realm.title + '」航道（或點擊右上 <b>⚙️ 設定</b> 開啟自由預習模式）：</div>' +
          '<div class="mqst-unlock-meters">' +
            '<div class="mqst-unlock-meter">' +
              '<div class="mqst-unlock-meter-top"><span>⭐ 總收集星數</span><strong>' + prog.stars + ' / ' + prog.minStars + ' 星（還差 ' + prog.remainingStars + ' 星）</strong></div>' +
              '<div class="mqst-costume-progress-track"><div class="mqst-costume-progress-fill" style="width:' + starPct + '%;"></div></div>' +
            '</div>' +
            '<div class="mqst-unlock-meter">' +
              '<div class="mqst-unlock-meter-top"><span>👑 擊敗島嶼魔王</span><strong>' + prog.bosses + ' / ' + prog.minBosses + ' 位（還差 ' + prog.remainingBosses + ' 位）</strong></div>' +
              '<div class="mqst-costume-progress-track"><div class="mqst-costume-progress-fill" style="width:' + bossPct + '%;"></div></div>' +
            '</div>' +
          '</div>' +
          '</div>';
      }
    } else {
      unlockNoteHtml = '<div class="mqst-realm-unlock-box is-ready">☀️ 雙起點平行開放海域：可直接從第 1 關出發！</div>';
    }

    var pillText = isComingSoon
      ? ('🚢 ' + (realm.releaseNote || '即將啟航'))
      : '🔒 跨海域解鎖條件尚未達成';

    els.realmPreviewStage.innerHTML =
      '<div class="mqst-realm-preview-head">' +
        '<span class="mqst-realm-preview-pill">' + pillText + '</span>' +
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
    if(els.arcadeOverlay) els.arcadeOverlay.setAttribute('data-realm', activeRealm.id);
    var realmOpen = (activeRealm.status === 'active') && isRealmUnlocked(activeRealm.id, saveData);
    if(!realmOpen){
      if(els.worldCanvas) els.worldCanvas.style.display = 'none';
      if(els.realmPreviewStage){
        els.realmPreviewStage.style.display = 'flex';
        renderRealmPreview(activeRealm);
      }
      if(els.mapTip){
        els.mapTip.textContent = activeRealm.status !== 'active'
          ? ('🚢 【' + activeRealm.title + '】將於 ' + (activeRealm.releaseNote || '後續階段') + ' 正式開放航行，先去陽光加減或九九乘法群島收集星星吧！')
          : ('🔒 再多累積幾顆星星或擊敗 2 位島嶼魔王，就能解鎖【' + activeRealm.title + '】冒險航道！');
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
        var mapPartnerBond = getPartnerBondInfo(saveData, partner.fullId);
        els.partnerMapAvatar.style.display = 'block';
        els.partnerMapAvatar.innerHTML = getCharacterSvg(partner.theme, false, 'normal', { bondLevel: mapPartnerBond.level });
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
        var tipBond = getPartnerBondInfo(saveData, partner.fullId);
        els.mapTip.textContent = '🐣 【' + partner.spriteName + ' (Lv.' + tipBond.level + ')】正陪著粉紅小兔冒險中！可在右上「圖鑑」或「🏡 樹屋」培養親密度。';
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

  function applyTabUi(tabs, attrName, target, focusTab){
    for(var i = 0; i < tabs.length; i++){
      var t = tabs[i];
      var act = (t.getAttribute(attrName) === target);
      t.classList.toggle('active', act);
      t.setAttribute('aria-selected', String(act));
      t.setAttribute('tabindex', act ? '0' : '-1');
      if(act){
        if(t.scrollIntoView){
          try {
            t.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
          } catch(err){
            try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch(err2){}
          }
        }
        if(focusTab) t.focus();
      }
    }
  }

  function bindTabGroup(tabs, attrName, onSwitch){
    Array.prototype.forEach.call(tabs, function(tab, idx){
      tab.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        onSwitch(tab.getAttribute(attrName), false);
      });
      tab.addEventListener('keydown', function(e){
        var list = tab.closest ? tab.closest('[role="tablist"]') : null;
        var isVertical = list && list.getAttribute('aria-orientation') === 'vertical';
        var nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
        var prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
        var nextIdx = -1;
        if(e.key === nextKey) nextIdx = (idx + 1) % tabs.length;
        else if(e.key === prevKey) nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if(e.key === 'Home') nextIdx = 0;
        else if(e.key === 'End') nextIdx = tabs.length - 1;
        if(nextIdx !== -1){
          e.preventDefault();
          if(MathApp.sfx) MathApp.sfx('click');
          onSwitch(tabs[nextIdx].getAttribute(attrName), true);
        }
      });
    });
  }

  function syncTreehouseTabUi(target, focusTab){
    var cur = target || session.treehouseTab || 'decor';
    session.treehouseTab = cur;
    if(els.treehouseView){
      var thTabs = els.treehouseView.querySelectorAll('.mqst-th-tab[data-th-tab]');
      applyTabUi(thTabs, 'data-th-tab', cur, focusTab);
    }
    if(els.thPaneDecor)   els.thPaneDecor.hidden   = (cur !== 'decor');
    if(els.thPaneSprites) els.thPaneSprites.hidden = (cur !== 'sprites');
  }

  function syncTreehouseSlotFocusUi(){
    if(!els.thStage) return;
    var activeSlot = session.treehouseSlot || 'wallpaper';
    els.thStage.querySelectorAll('[data-th-slot]').forEach(function(el){
      el.classList.toggle('is-slot-focus', el.getAttribute('data-th-slot') === activeSlot);
    });
  }

  function syncTreehouseDecorateModeUi(){
    var on = Boolean(session.treehouseDecorateMode);
    if(els.thDecorateModeBtn){
      els.thDecorateModeBtn.setAttribute('aria-pressed', String(on));
      els.thDecorateModeBtn.classList.toggle('is-active', on);
    }
    if(els.thStage){
      var room = els.thStage.querySelector('.mqst-th-room');
      if(room) room.classList.toggle('is-decorate-mode', on);
    }
  }

  function setTreehouseDockCollapsed(collapsed){
    var nextCollapsed = Boolean(collapsed);
    session.treehouseDockCollapsed = nextCollapsed;
    if(els.treehouseView){
      els.treehouseView.classList.toggle('is-dock-collapsed', nextCollapsed);
    }
    if(els.thDockToggleBtn){
      els.thDockToggleBtn.setAttribute('aria-expanded', String(!nextCollapsed));
      els.thDockToggleBtn.innerHTML = nextCollapsed
        ? '<span aria-hidden="true">🔼</span><span>展開佈置</span>'
        : '<span aria-hidden="true">🔽</span><span>收起選單</span>';
    }
    if(!els.thDockBody) return;
    if(!nextCollapsed){
      els.thDockBody.hidden = false;
      void els.thDockBody.offsetHeight;
      els.thDockBody.classList.remove('is-collapsed');
      return;
    }
    els.thDockBody.classList.add('is-collapsed');
    var transitions = typeof els.thDockBody.getAnimations === 'function'
      ? els.thDockBody.getAnimations().filter(function(a){
          return typeof CSSTransition !== 'undefined' && a instanceof CSSTransition;
        })
      : [];
    if(transitions.length === 0){
      els.thDockBody.hidden = true;
    } else {
      Promise.allSettled(transitions.map(function(t){ return t.finished; })).then(function(){
        if(session.treehouseDockCollapsed && els.thDockBody){
          els.thDockBody.hidden = true;
        }
      });
    }
  }

  function renderCurrentTreehouse(opts){
    var skipStageRender = Boolean(opts && opts.skipStageRender);
    syncTreehouseTabUi(session.treehouseTab || 'decor', false);
    renderTreehouseView({
      activeTab: session.treehouseTab || 'decor',
      activeSlot: session.treehouseSlot || 'wallpaper',
      selectedPlaymateId: session.treehouseSelectedPartner || '',
      decorateMode: Boolean(session.treehouseDecorateMode),
      lampLit: Boolean(session.treehouseLampLit),
      skipStageRender: skipStageRender
    });
    syncTreehouseDecorateModeUi();
    syncTreehouseSlotFocusUi();
  }

  function switchDexTab(target, focusTab){
    if(target === 'wardrobe' && saveData.hasNewCostume){
      saveData.hasNewCostume = false;
      persistSave();
      updateHubStats();
    }
    if(els.dexDialog){
      var dexTabs = els.dexDialog.querySelectorAll('.mqst-dex-tab[data-dex]');
      applyTabUi(dexTabs, 'data-dex', target, focusTab);
    }
    if(els.paneGems)     els.paneGems.hidden     = (target !== 'gems');
    if(els.paneSkills)   els.paneSkills.hidden   = (target !== 'skills');
    if(els.paneWardrobe) els.paneWardrobe.hidden = (target !== 'wardrobe');
    if(els.paneSprites)  els.paneSprites.hidden  = (target !== 'sprites');
    if(els.paneAlbum)    els.paneAlbum.hidden    = (target !== 'album');
    if(els.paneBadges)   els.paneBadges.hidden   = (target !== 'badges');
    if(els.dexBody)      els.dexBody.scrollTop   = 0;
  }

  function openDexDialog(initialTab){
    if(!els.dexDialog) return;
    if(MathApp.sfx) MathApp.sfx('click');
    var tab = initialTab || ((saveData.activeRealm === 'sunny' || saveData.activeRealm === 'cloud') ? 'skills' : 'gems');
    if(tab === 'wardrobe' && saveData.hasNewCostume){
      saveData.hasNewCostume = false;
      persistSave();
      updateHubStats();
    }
    renderDexDialog();
    switchDexTab(tab, false);
    els.dexDialog.showModal();
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

  function openDailyDialog(){
    if(!els.dailyDialog) return;
    if(MathApp.sfx) MathApp.sfx('click');
    ensureDailyQuests(saveData, getLocalDateKey());
    renderDailyDialog();
    els.dailyDialog.showModal();
  }

  function switchShopTab(target, focusTab){
    var cur = target || 'wardrobe';
    if(els.shopDialog){
      var shopTabs = els.shopDialog.querySelectorAll('.mqst-dex-tab[data-shop]');
      applyTabUi(shopTabs, 'data-shop', cur, focusTab);
    }
    if(els.shopPaneWardrobe)  els.shopPaneWardrobe.hidden  = (cur !== 'wardrobe');
    if(els.shopPaneTreehouse) els.shopPaneTreehouse.hidden = (cur !== 'treehouse');
    if(els.shopPaneSnacks)    els.shopPaneSnacks.hidden    = (cur !== 'snacks');
  }

  function openShopDialog(initialTab){
    if(!els.shopDialog) return;
    if(MathApp.sfx) MathApp.sfx('click');
    renderShopDialog();
    switchShopTab(initialTab || 'wardrobe', false);
    els.shopDialog.showModal();
  }

  function openTreehouse(initialTab, selectedPartnerId){
    if(initialTab) session.treehouseTab = initialTab;
    if(selectedPartnerId) session.treehouseSelectedPartner = toCanonicalPartnerId(selectedPartnerId);
    if(session.treehouseDockCollapsed){
      setTreehouseDockCollapsed(false);
    }
    if(!session.arcadeOpen){
      openArcade();
    }
    showView('treehouse');
  }

  /* ---------------- 視圖切換 ---------------- */
  function showView(viewName){
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(els.mapView)       els.mapView.style.display       = (viewName === 'map') ? 'flex' : 'none';
    if(els.battleView)    els.battleView.style.display    = (viewName === 'battle') ? 'flex' : 'none';
    if(els.resultView)    els.resultView.style.display    = (viewName === 'result') ? 'flex' : 'none';
    if(els.treehouseView) els.treehouseView.style.display = (viewName === 'treehouse') ? 'flex' : 'none';

    if(viewName === 'map'){
      stopBattleIdleAnims();
      session.active = false;
      session.isMovingOnMap = false;
      renderMap();
      if(session.arcadeOpen && MathApp.audio && MathApp.audio.startBgm){
        MathApp.audio.startBgm('map');
      }
    } else if(viewName === 'treehouse'){
      stopBattleIdleAnims();
      session.active = false;
      session.isMovingOnMap = false;
      renderCurrentTreehouse();
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
  function navigateToClassroom(target){
    var info = target && typeof target === 'object' ? target : null;
    if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
    if(els.dailyDialog && els.dailyDialog.open) els.dailyDialog.close();
    if(els.towerDialog && els.towerDialog.open) els.towerDialog.close();
    closeArcade();

    if(!info || !info.unit){
      var fallbackUnit = saveData.activeRealm === 'sunny' ? 'calc' : (saveData.activeRealm === 'cloud' ? 'seq' : 'mul');
      if(MathApp.tabs){
        MathApp.tabs.switchMainTab(fallbackUnit);
        MathApp.tabs.switchSubTab(fallbackUnit, 'learn');
      }
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🏫 已來到教學積木教室！動手操作積木或答對測驗題就能賺星星幣喔！');
      }
      return;
    }

    var unit = info.unit;
    if(MathApp.tabs){
      MathApp.tabs.switchMainTab(unit);
      var subKey = unit === 'learn' ? 'pv' : unit;
      MathApp.tabs.switchSubTab(subKey, info.subTab || 'learn');
    }

    if(unit === 'calc' && MathApp.calc && MathApp.calc.loadProblem){
      MathApp.calc.loadProblem(info.a || 38, info.b || 25, info.op === '-' || info.op === 'sub' ? 'sub' : 'add');
      if(MathApp.utils && MathApp.utils.showToast){
        var opSym = (info.op === '-' || info.op === 'sub') ? ' − ' : ' ＋ ';
        MathApp.utils.showToast('🧱 已帶入 ' + (info.a || 38) + opSym + (info.b || 25) + ' 到直式積木教室，按「下一步」慢慢看！');
      }
    } else if(unit === 'learn' && MathApp.learn && MathApp.learn.loadNumber){
      MathApp.learn.loadNumber(info.presetNum || 305);
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🧱 已在位值積木教室排好數字 ' + (info.presetNum || 305) + '，觀察百／十／個積木！');
      }
    } else if(unit === 'seq' && MathApp.seq && MathApp.seq.loadSequence){
      MathApp.seq.loadSequence(info.startNum != null ? info.startNum : 185, info.step || 10);
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🚂 已帶入「' + (info.startNum != null ? info.startNum : 185) + ' 起跳（步長 ' + (info.step || 10) + '）」到跳數列車教室！');
      }
    } else if(unit === 'mul' && MathApp.mul && MathApp.mul.setFactors){
      MathApp.mul.setFactors(info.row || 3, info.col || 4, { silentStopRow: true });
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('📐 已切換至 ' + (info.row || 3) + ' × ' + (info.col || 4) + ' 乘法陣列積木！');
      }
    }
  }

  function renderTowerHud(){
    if(!session.isTowerMode || !session.towerRun) return;
    var run = session.towerRun;
    var routeObj = getTowerRouteById(run.routeId);
    if(els.towerFloorBadge){
      els.towerFloorBadge.textContent = '🗼 第 ' + run.currentFloor + ' 層';
    }
    if(els.towerRouteTag){
      els.towerRouteTag.textContent = routeObj.name;
    }
    if(els.towerHearts){
      var hStr = '';
      for(var i = 0; i < TOWER_MAX_HEARTS; i++){
        hStr += i < run.hearts ? '<span class="mqst-heart-pip is-full">❤️</span>' : '<span class="mqst-heart-pip is-empty">🤍</span>';
      }
      els.towerHearts.innerHTML = hStr;
      els.towerHearts.setAttribute('aria-label', '剩餘 ' + run.hearts + ' 顆愛心');
    }
    if(els.towerNextBossChip){
      if(isTowerBossFloor(run.currentFloor)){
        els.towerNextBossChip.textContent = '👑 本層守塔小魔王！';
        els.towerNextBossChip.classList.add('is-boss');
      } else {
        var nextBossFloor = (Math.floor((run.currentFloor - 1) / TOWER_BOSS_INTERVAL) + 1) * TOWER_BOSS_INTERVAL;
        els.towerNextBossChip.textContent = '第 ' + nextBossFloor + ' 層守塔魔王';
        els.towerNextBossChip.classList.remove('is-boss');
      }
    }
    if(els.towerCoinsEarned){
      els.towerCoinsEarned.textContent = String(run.earnedCoins || 0);
    }
  }

  function openTowerDialog(){
    if(!els.towerDialog) return;
    if(MathApp.sfx) MathApp.sfx('click');
    if(!session.arcadeOpen){
      openArcade();
    }
    renderTowerDialog();
    els.towerDialog.showModal();
  }

  function initBattleSessionState({ stage, questions, isRescueMode, isGemHuntMode, isTowerMode }){
    ensureDailyQuests(saveData, getLocalDateKey());
    session.active = true;
    session.isRescueMode = Boolean(isRescueMode);
    session.isGemHuntMode = Boolean(isGemHuntMode);
    session.isTowerMode = Boolean(isTowerMode);
    if(!isTowerMode){
      session.towerRun = null;
    }
    session.towerGameOver = false;
    session.wrongCountOnCurrent = 0;
    session.lastClassroomTarget = null;
    session.stage = stage || null;
    session.cloudUnlockedBefore = isRealmUnlocked('cloud', saveData);
    session.questions = questions;
    session.idx = 0;
    session.guidedStepIdx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.skillHitsThisRun = 0;
    session.skillUpgradesThisRun = [];
    session.earnedCoinsThisRun = 0;
    session.rescuedThisRun = 0;
    session.enemyMaxHp = questions.length;
    session.enemyHp = session.enemyMaxHp;
    session.bossShieldMax = (stage && stage.isBoss)
      ? (stage.bossShield || ((stage.islandId === 'forest' || stage.islandId === 'workshop') ? 1 : 2))
      : 0;
    session.bossShield = session.bossShieldMax;
    session.partnerUsedSkill = false;
    session.partnerSkillBonusCoins = 0;
    session.partnerLuckyDropCoins = 0;
    session.partnerShieldTriggeredCount = 0;
    session.finisherCountThisRun = 0;

    var partner = getActivePartnerIsland();
    if(partner){
      var bond = getPartnerBondInfo(saveData, partner.fullId);
      var eff = getPartnerSpecialtyEffects(partner, bond.level);
      session.battlePartnerId = partner.fullId;
      session.partnerEffects = eff;
      session.partnerSkillUsesLeft = eff.isActive ? (eff.maxUses || 1) : 0;
      session.partnerShieldChargesLeft = eff.type === 'shield' ? (eff.passiveShieldCharges || 1) : 0;
    } else {
      session.battlePartnerId = '';
      session.partnerEffects = null;
      session.partnerSkillUsesLeft = 0;
      session.partnerShieldChargesLeft = 0;
    }
    syncProjectileVisual();
  }

  function startStage(stageId){
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(st.stageKey || st.id)) return;

    initBattleSessionState({
      stage: st,
      questions: buildStageQuestions(st),
      isRescueMode: false,
      isGemHuntMode: false
    });
    var isl = getIslandById(st.islandId);
    beginBattleUI((st.displayNum || st.id) + ' · ' + st.label, isl.bgImg, st.islandId, st.isBoss ? st.boss : null);
  }

  function startRescueBattle(){
    if(!saveData.rescueCases || saveData.rescueCases.length === 0) return;
    var qs = buildRescueQuestions();
    initBattleSessionState({
      stage: null,
      questions: qs,
      isRescueMode: true,
      isGemHuntMode: false
    });

    var firstQ = qs[0];
    var isCloudRescue = Boolean(firstQ && firstQ.realm === 'cloud');
    var isSunnyRescue = Boolean(firstQ && firstQ.realm === 'sunny');
    var rescueBg = isCloudRescue
      ? 'assets/quest/bg-skycastle.jpg'
      : (isSunnyRescue ? 'assets/quest/bg-bay.jpg' : 'assets/quest/bg-garden.jpg');
    var rescueTheme = isCloudRescue ? 'skycastle' : (isSunnyRescue ? 'bay' : 'garden');
    beginBattleUI('🆘 求救小精靈特訓', rescueBg, rescueTheme, null);
  }

  function startGemHuntBattle(){
    var unlit = getCollectableUnlitGems();
    if(unlit.length === 0) return;
    if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();

    initBattleSessionState({
      stage: null,
      questions: buildGemHuntQuestions(unlit),
      isRescueMode: false,
      isGemHuntMode: true,
      isTowerMode: false
    });
    beginBattleUI('💎 未點亮寶石補完特訓', 'assets/quest/bg-castle.jpg', 'castle', null);
  }

  function startTowerRun(routeId){
    if(!isTowerUnlocked(saveData)){
      if(MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('🔒 先打敗任一海域第 1 座島魔王（或開啟預習模式）即可解鎖無盡試煉塔！');
      }
      return;
    }
    if(els.towerDialog && els.towerDialog.open) els.towerDialog.close();
    if(!session.arcadeOpen) openArcade();

    var run = createTowerRunState(routeId || 'all');
    var firstQ = generateTowerFloorQuestion(run.routeId, 1);
    if(firstQ){
      run.recentTemplateId = firstQ.templateId || '';
      if(firstQ.rescueDedupeKey) run.recentDedupeKeys = [firstQ.rescueDedupeKey];
    }
    initBattleSessionState({
      stage: null,
      questions: [firstQ],
      isRescueMode: false,
      isGemHuntMode: false,
      isTowerMode: true
    });
    session.towerRun = run;
    session.enemyMaxHp = 1;
    session.enemyHp = 1;
    session.bossShieldMax = 0;
    session.bossShield = 0;

    var routeObj = getTowerRouteById(run.routeId);
    var guardian = isTowerBossFloor(1) ? getTowerGuardianForFloor(1, run.routeId) : null;
    beginBattleUI('🗼 無盡試煉塔 · ' + routeObj.name, routeObj.bgImg, 'skycastle', guardian);
  }

  function advanceTowerFloor(){
    if(!session.isTowerMode || !session.towerRun) return;
    var run = session.towerRun;
    var nextFloor = run.currentFloor;
    var routeObj = getTowerRouteById(run.routeId);
    var nextQ = generateTowerFloorQuestion(run.routeId, nextFloor, {
      avoidTemplateId: run.recentTemplateId,
      avoidDedupeKeys: run.recentDedupeKeys
    });
    if(nextQ){
      run.recentTemplateId = nextQ.templateId || '';
      if(nextQ.rescueDedupeKey){
        run.recentDedupeKeys = (run.recentDedupeKeys || []).concat([nextQ.rescueDedupeKey]).slice(-8);
      }
    }
    var isBossF = isTowerBossFloor(nextFloor);
    var guardian = isBossF ? getTowerGuardianForFloor(nextFloor, run.routeId) : null;

    session.questions = [nextQ];
    session.idx = 0;
    session.enemyMaxHp = 1;
    session.enemyHp = 1;
    session.bossShieldMax = 0;
    session.bossShield = 0;
    session.battleBossObj = guardian;
    session.battleTheme = guardian ? guardian.theme : 'skycastle';

    if(els.stageBgImg) els.stageBgImg.src = guardian ? guardian.bgImg : routeObj.bgImg;
    if(els.stageArena) els.stageArena.setAttribute('data-theme', session.battleTheme);
    if(guardian){
      if(els.bossName) els.bossName.textContent = guardian.name;
      if(els.bossTaunt) els.bossTaunt.textContent = guardian.tauntStart;
      if(MathApp.audio && MathApp.audio.startBgm) MathApp.audio.startBgm('boss');
    } else {
      if(els.bossName) els.bossName.textContent = '第 ' + nextFloor + ' 層試煉守護石像';
      if(els.bossTaunt) els.bossTaunt.textContent = '「慢慢想清楚再作答，沒有計時壓力喔！」';
    }

    renderEnemyHp();
    renderTowerHud();
    renderCurrentQuestion();
  }

  function finishTowerRun(reason){
    if(!session.towerRun) return;
    var run = session.towerRun;
    var routeObj = getTowerRouteById(run.routeId);
    var bestRes = recordTowerBestFloor(saveData, run.routeId, run.clearedFloors);
    syncAlbumFromProgress(saveData);
    var newBadges = checkAndUnlockBadges();
    var newCostumes = checkAndUnlockCostumes(false);
    persistSave();
    updateHubStats();

    if(els.arcadeOverlay) els.arcadeOverlay.setAttribute('data-realm', 'tower');
    showView('result');

    var stars = run.clearedFloors >= 10 ? 3 : (run.clearedFloors >= 5 ? 2 : (run.clearedFloors >= 1 ? 1 : 0));
    var partner = getActivePartnerIsland();
    if(els.victoryBunny) els.victoryBunny.innerHTML = getPinkBunnySvg(stars >= 2 ? 'happy' : 'normal');
    if(els.victorySprite){
      if(partner){
        var showBond = getPartnerBondInfo(saveData, partner.fullId);
        els.victorySprite.style.display = 'block';
        els.victorySprite.innerHTML = getCharacterSvg(partner.theme, false, 'happy', { bondLevel: showBond.level });
      } else {
        els.victorySprite.style.display = 'none';
      }
    }

    var starNodes = els.resultStars ? els.resultStars.querySelectorAll('.mqst-star-item') : [];
    for(var s = 0; s < starNodes.length; s++){
      starNodes[s].classList.toggle('earned', (s + 1) <= stars);
    }

    var totalCleared = run.clearedFloors;
    if(els.resultTitle){
      els.resultTitle.textContent = totalCleared > 0
        ? ('🗼 無盡試煉塔 · 挑戰成功至第 ' + totalCleared + ' 層！')
        : '🗼 試煉塔暖身挑戰結束！';
    }
    if(els.resultSub){
      els.resultSub.textContent = bestRes.isNewRecord && totalCleared > 0
        ? ('🏆 恭喜打破【' + routeObj.name + '】最高紀錄！（個人最佳：第 ' + bestRes.newBest + ' 層）')
        : (reason === 'hearts_depleted'
            ? ('❤️ 愛心用完囉！已經獲得 +' + run.earnedCoins + ' 🪙，下次一定能爬得更高！（最佳：第 ' + bestRes.newBest + ' 層）')
            : ('✨ 已安全帶著 +' + run.earnedCoins + ' 🪙 與爬塔紀錄回到休息營地！（最佳：第 ' + bestRes.newBest + ' 層）'));
    }

    if(els.resFirstAcc) els.resFirstAcc.textContent = '第 ' + totalCleared + ' 層';
    if(els.resCoins)    els.resCoins.textContent    = '+' + run.earnedCoins + ' 🪙';
    if(els.resCollectLbl) els.resCollectLbl.textContent = '守塔小魔王';
    if(els.resNewGems)  els.resNewGems.textContent  = (run.bossDefeatedCount || 0) + ' 👑';
    if(els.resMaxCombo) els.resMaxCombo.textContent = session.maxCombo + ' 🔥';

    if(els.resNextBtn){
      els.resNextBtn.style.display = 'inline-flex';
      els.resNextBtn.innerHTML = '<i data-lucide="play" aria-hidden="true"></i> <span>再爬一次 ' + routeObj.name + '</span>';
    }
    if(els.resRetryBtn){
      els.resRetryBtn.style.display = 'inline-flex';
      els.resRetryBtn.innerHTML = '<i data-lucide="compass" aria-hidden="true"></i> <span>換別條路線</span>';
    }
    if(els.resClassroomBtn){
      if(session.lastClassroomTarget){
        els.resClassroomBtn.style.display = 'inline-flex';
        if(els.resClassroomLbl) els.resClassroomLbl.textContent = session.lastClassroomTarget.label;
      } else {
        els.resClassroomBtn.style.display = 'none';
      }
    }

    var showcaseHtml = '';
    if(bestRes.isNewRecord && totalCleared > 0){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#ede9fe 0%,#fef3c7 100%);border-color:#7c3aed;">' +
        '<span style="font-size:32px;" aria-hidden="true">🏆</span>' +
        '<div><div>刷新【' + routeObj.name + '】最高紀錄：第 ' + bestRes.newBest + ' 層！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">共通過 ' + totalCleared + ' 層，累積獲得 +' + run.earnedCoins + ' 🪙 星星幣！</div></div></div>';
    }
    newCostumes.forEach(function(c){
      showcaseHtml += '<div class="mqst-unlock-banner is-costume"><div><div>🎀 解鎖小兔新造型：【' + c.name + '】！</div></div></div>';
    });
    newBadges.forEach(function(b){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%);"><span style="font-size:32px;">' + b.icon + '</span><div><div>🏅 解鎖新成就徽章：【' + b.name + '】！</div></div></div>';
    });
    if(els.unlockShowcase) els.unlockShowcase.innerHTML = showcaseHtml;
    if(MathApp.refreshIcons) MathApp.refreshIcons();
    if(MathApp.sfx) MathApp.sfx(totalCleared > 0 ? 'fanfare' : 'pop');
    if(MathApp.utils && MathApp.utils.launchConfetti && totalCleared >= 5){
      MathApp.utils.launchConfetti(true);
    }
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
      var pBond = getPartnerBondInfo(saveData, partner.fullId);
      els.partnerSvg.innerHTML = getCharacterSvg(partner.theme, false, partnerMood || 'normal', { bondLevel: pBond.level });
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
    var bond = getPartnerBondInfo(saveData, partner.fullId);
    var eff = session.partnerEffects || getPartnerSpecialtyEffects(partner, bond.level);
    var specMeta = getSpecialtyMeta(partner.specialty);

    els.partnerSkillBtn.style.display = 'inline-flex';
    els.partnerSkillBtn.className = 'mqst-partner-skill-btn';

    if(eff.type === 'shield'){
      var leftSh = Math.max(0, Number(session.partnerShieldChargesLeft || 0));
      els.partnerSkillBtn.disabled = false;
      els.partnerSkillBtn.classList.add('is-passive', leftSh > 0 ? 'is-shield' : 'is-depleted');
      els.partnerSkillBtn.textContent = leftSh > 0 ? ('🛡️ 護盾待命 ×' + leftSh) : '🛡️ 護盾已觸發';
      els.partnerSkillBtn.title = specMeta.lvDesc[bond.level];
      return;
    }
    if(eff.type === 'lucky'){
      els.partnerSkillBtn.disabled = false;
      els.partnerSkillBtn.classList.add('is-passive', 'is-lucky');
      els.partnerSkillBtn.textContent = '🌟 星幣 +' + eff.bonusPct + '%';
      els.partnerSkillBtn.title = specMeta.lvDesc[bond.level];
      return;
    }

    var usesLeft = Math.max(0, Number(session.partnerSkillUsesLeft || 0));
    els.partnerSkillBtn.disabled = (usesLeft <= 0);
    if(usesLeft <= 0){
      els.partnerSkillBtn.textContent = '✨ 魔法已施展';
      els.partnerSkillBtn.title = '本關的守護精靈免費魔法次數已用完囉！';
      return;
    }
    if(eff.type === 'blocks'){
      els.partnerSkillBtn.textContent = '🧱 免費積木 (剩 ' + usesLeft + ')';
      els.partnerSkillBtn.title = specMeta.lvDesc[bond.level];
    } else {
      els.partnerSkillBtn.textContent = '🌿 智慧消錯 (剩 ' + usesLeft + ')';
      els.partnerSkillBtn.title = specMeta.lvDesc[bond.level];
    }
  }

  function beginBattleUI(chipTitle, bgSrc, theme, bossObj){
    session.battleTheme = theme;
    session.battleBossObj = bossObj;
    var battleRealmId = session.isTowerMode
      ? 'tower'
      : (session.stage && session.stage.realmId)
        ? session.stage.realmId
        : (theme === 'bakery' || theme === 'candy' || theme === 'bay' || theme === 'market' || theme === 'lighthouse')
          ? 'sunny'
          : (theme === 'station' || theme === 'vault' || theme === 'park' || theme === 'patisserie' || theme === 'skycastle')
            ? 'cloud'
            : (saveData.activeRealm || 'mul');
    if(els.arcadeOverlay) els.arcadeOverlay.setAttribute('data-realm', battleRealmId);
    if(els.battleProgressWrap) els.battleProgressWrap.style.display = session.isTowerMode ? 'none' : 'flex';
    if(els.towerHud) els.towerHud.style.display = session.isTowerMode ? 'flex' : 'none';
    showView('battle');
    if(MathApp.audio && MathApp.audio.startBgm){
      MathApp.audio.startBgm(bossObj ? 'boss' : 'battle');
    }
    if(els.stageChip) els.stageChip.textContent = chipTitle;
    if(els.stageBgImg) els.stageBgImg.src = bgSrc;
    if(els.stageArena) els.stageArena.setAttribute('data-theme', theme);
    if(session.isTowerMode){
      renderTowerHud();
    }

    if(bossObj){
      if(els.bossName)  els.bossName.textContent  = bossObj.name;
      if(els.bossTaunt) els.bossTaunt.textContent = session.bossShield > 0
        ? ('「先打破我的 ' + session.bossShield + ' 層魔法護盾再說吧！」')
        : bossObj.tauntStart;
    } else if(session.isTowerMode && session.towerRun){
      if(els.bossName)  els.bossName.textContent  = '第 ' + session.towerRun.currentFloor + ' 層試煉守護石像';
      if(els.bossTaunt) els.bossTaunt.textContent = '「沒有計時壓力，想清楚就能一直往上爬喔！」';
    } else {
      if(els.bossName)  els.bossName.textContent  = session.isRescueMode ? '迷路小精靈籠子' : (session.isGemHuntMode ? '閃耀寶石守護箱' : '關卡寶箱怪');
      if(els.bossTaunt) els.bossTaunt.textContent = session.isRescueMode
        ? '「快用正確口訣打開魔法鎖！」'
        : (session.isGemHuntMode ? '「一次答對就能立刻點亮新寶石喔！」' : '「答對全部題目就能打開大寶箱！」');
    }

    var partner = getActivePartnerIsland();
    if(els.partnerActor){
      if(partner){
        var bInfo = getPartnerBondInfo(saveData, partner.fullId);
        els.partnerActor.style.display = 'flex';
        if(els.partnerLabel) els.partnerLabel.textContent = partner.spriteName;
        if(els.partnerLvTag) els.partnerLvTag.textContent = 'Lv.' + bInfo.level;
        setPartnerSpeech(
          partner.specialty === 'shield'
            ? '守護護盾待命！放心作答！'
            : (partner.specialty === 'lucky' ? '幸運星幣加成開啟囉！' : '一起加油吧！')
        );
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

  function renderHelperForQuestion(q){
    if(!els.helperStage || !q) return;
    if(q.helperSpec && (
      q.helperSpec.type === 'mini_train' ||
      q.helperSpec.type === 'place_value_blocks' ||
      (q.helperSpec.type === 'bar_diagram' && q.helperSpec.mode === 'two_step')
    )){
      els.helperStage.innerHTML = renderCloudHelperHtml(q, MathApp.utils.blockGlyph);
      return;
    }
    if(q.kind !== 'mul'){
      els.helperStage.innerHTML = renderCalcHelperHtml(q, MathApp.utils.blockGlyph);
      return;
    }
    if(MathApp.mulQuiz.buildHelperBlocksHtml){
      els.helperStage.innerHTML = MathApp.mulQuiz.buildHelperBlocksHtml(q);
    }
  }

  function renderCurrentQuestion(){
    var q = session.questions[session.idx];
    session.locked = false;
    session.hadWrongOnCurrent = false;
    session.wrongCountOnCurrent = 0;
    session.usedHelperOnCurrent = false;
    session.guidedStepIdx = 0;
    session.displayFormat = q.displayFormat || 'equation';
    if(els.stuckBanner) els.stuckBanner.style.display = 'none';
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
    if(q.kind === 'seq' || q.kind === 'place_value' || q.kind === 'word_two_step'){
      els.equationRow.innerHTML = renderCloudQuestionHtml(q, { stepIdx: session.guidedStepIdx });
      if(q.uiMode === 'choice'){
        els.choicesGrid.style.display = 'grid';
        els.keypadWrap.style.display  = 'none';

        var cloudChoices = generateCloudChoices(q, 4);
        var clHtml = '';
        cloudChoices.forEach(function(val){
          clHtml += '<button type="button" class="mqst-choice-bubble" data-choice="' + val + '">' + val + '</button>';
        });
        els.choicesGrid.innerHTML = clHtml;

        runAnim(function(gsap){
          var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
          gsap.fromTo(bubbles, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.04, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility' });
        });
      } else {
        els.choicesGrid.style.display = 'none';
        els.keypadWrap.style.display  = 'block';
        bindEquationInputs();
      }
      renderHelperForQuestion(q);
    } else if(q.kind !== 'mul' && q.equationModel){
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
      renderHelperForQuestion(q);
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
    if(!session.active || session.locked) return;
    var q = session.questions[session.idx];
    var partner = getActivePartnerIsland();
    if(!q || !partner) return;

    var bond = getPartnerBondInfo(saveData, partner.fullId);
    var eff = session.partnerEffects || getPartnerSpecialtyEffects(partner, bond.level);

    if(!eff.isActive){
      if(MathApp.sfx) MathApp.sfx('pop');
      var passiveMsg = eff.type === 'shield'
        ? ('🛡️ ' + partner.spriteName + ' 的護盾為被動技能！答錯瞬間自動保護連擊與三星（剩餘 ×' + session.partnerShieldChargesLeft + '）！')
        : ('🌟 ' + partner.spriteName + ' 的幸運加持自動運作中！過關星星幣獎勵 +' + eff.bonusPct + '%！');
      setPartnerSpeech(eff.type === 'shield' ? '護盾待命中，別緊張！' : '幸運星光會一直陪著你！');
      if(els.feedback){
        els.feedback.textContent = passiveMsg;
        els.feedback.className = 'mqst-stage-toast hint';
      }
      return;
    }

    if(session.partnerSkillUsesLeft <= 0) return;

    session.partnerSkillUsesLeft--;
    if(session.partnerSkillUsesLeft <= 0) session.partnerUsedSkill = true;
    updatePartnerSkillButton();
    updateBattleMoods(session.combo >= 3 ? 'fever' : 'happy', 'normal', 'happy');
    if(MathApp.sfx) MathApp.sfx('magic');

    runAnim(function(gsap){
      if(els.partnerActor){
        gsap.fromTo(els.partnerActor, { y: 0, scale: 1 }, { y: -14, scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
      }
    });

    if(eff.type === 'eliminate'){
      if(q.uiMode === 'choice' && els.choicesGrid){
        var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble:not(:disabled)');
        var wrongBtns = [];
        for(var i = 0; i < bubbles.length; i++){
          if(Number(bubbles[i].getAttribute('data-choice')) !== q.slots[0].expected){
            wrongBtns.push(bubbles[i]);
          }
        }
        var maxToRemove = Math.max(0, bubbles.length - 2);
        var removeCount = Math.min(eff.removeWrongCount || 1, wrongBtns.length, maxToRemove || (wrongBtns.length > 0 ? 1 : 0));
        if(removeCount > 0){
          for(var r = 0; r < removeCount; r++){
            var idxPick = MathApp.utils.randInt(0, wrongBtns.length - 1);
            var picked = wrongBtns.splice(idxPick, 1)[0];
            picked.classList.add('is-wrong');
            picked.disabled = true;
          }
          setPartnerSpeech('幫你消除了 ' + removeCount + ' 個錯選項囉！');
          if(els.feedback){
            els.feedback.textContent = '🌿 ' + partner.spriteName + ' 施展智慧消錯！移除了 ' + removeCount + ' 個干擾選項（不影響滿星！）';
            els.feedback.className = 'mqst-stage-toast good';
          }
          return;
        }
      }
      var hintText = buildEliminateKeypadHint(q, session.guidedStepIdx, eff.keypadHintLevel);
      setPartnerSpeech('看我的智慧提示線索！');
      if(els.feedback){
        els.feedback.textContent = hintText + '（不影響滿星！）';
        els.feedback.className = 'mqst-stage-toast good';
      }
      return;
    }

    // 積木導師系：免費展開視覺積木輔助且不扣三星資格；Lv.2+ 額外加贈 +5 星星幣
    var bonusNote = '';
    if(eff.bonusCoinsOnUse > 0 && session.partnerSkillBonusCoins === 0){
      session.partnerSkillBonusCoins = eff.bonusCoinsOnUse;
      saveData.starCoins = Number(saveData.starCoins || 0) + eff.bonusCoinsOnUse;
      persistSave();
      updateHubStats();
      bonusNote = '（Lv.' + bond.level + ' 導師加碼 +' + eff.bonusCoinsOnUse + ' 🪙！）';
    }
    openHelperDrawer('🧱 積木導師免費輔助（不扣星、照拿收藏！）');
    setPartnerSpeech('積木提示免費看，一樣拿滿星！');
    if(els.feedback){
      els.feedback.textContent = '🧱 ' + partner.spriteName + ' 免費打開積木提示！' + bonusNote;
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
    function applySkillHit(tag){
      if(!tag) return;
      var skillRes = recordSkillCodexHit(saveData, tag);
      if(!skillRes.card) return;
      session.skillHitsThisRun++;
      if(skillRes.upgraded){
        saveData.starCoins = Number(saveData.starCoins || 0) + skillRes.bonusCoins;
        session.skillUpgradesThisRun.push(skillRes);
        var tierTitle = skillRes.newTier === 'gold' ? '金卡' : (skillRes.newTier === 'silver' ? '銀卡' : '銅卡');
        skillUpgradeNote += '（📖 ' + skillRes.card.name + ' 升至' + tierTitle + ' +' + skillRes.bonusCoins + '🪙！）';
      }
    }

    if(cleanFirstTry && q.skillTag){
      applySkillHit(q.skillTag);
    }

    if(session.isRescueMode){
      saveData.rescueCases = removeRescueCase(saveData.rescueCases, {
        id: q.rescueCaseId,
        dedupeKey: q.rescueDedupeKey || (q.rescueKey ? ('mul:' + q.rescueKey) : '')
      });
      saveData.stats.rescuedCount++;
      session.rescuedThisRun++;
      if(cleanFirstTry){
        applySkillHit('rescue_master');
      }
    }

    var partner = getActivePartnerIsland();
    var partnerBond = partner ? getPartnerBondInfo(saveData, partner.fullId) : { level: 1 };
    var luckyDrop = (partner && partner.specialty === 'lucky') ? rollLuckyPerCorrectDrop(partnerBond.level) : 0;
    var luckyDropNote = '';
    if(luckyDrop > 0){
      saveData.starCoins = Number(saveData.starCoins || 0) + luckyDrop;
      session.partnerLuckyDropCoins += luckyDrop;
      luckyDropNote = '（🌟 幸運掉落 +' + luckyDrop + '🪙！）';
    }

    var storyRes = unlockStoryForQuestion(saveData, q);
    var storyNote = (storyRes.unlocked && storyRes.story)
      ? (' 📖 解鎖故事貼紙【' + storyRes.story.title + '】！')
      : '';

    var towerNote = '';
    var clearedTowerFloor = 0;
    var wasTowerBossFloor = false;
    if(session.isTowerMode && session.towerRun){
      clearedTowerFloor = session.towerRun.currentFloor;
      wasTowerBossFloor = isTowerBossFloor(clearedTowerFloor);
      var towerRes = applyTowerFloorClear(session.towerRun);
      saveData.starCoins = Number(saveData.starCoins || 0) + towerRes.totalFloorCoins;
      session.earnedCoinsThisRun = Number(session.earnedCoinsThisRun || 0) + towerRes.totalFloorCoins;
      recordTowerBestFloor(saveData, session.towerRun.routeId, towerRes.clearedFloor);
      recordDailyQuestProgress(
        saveData,
        { type: 'tower_floor_clear', floor: towerRes.clearedFloor, isClean: cleanFirstTry },
        getLocalDateKey()
      );
      renderTowerHud();
      if(towerRes.isBossFloor){
        towerNote = '（👑 擊敗第 ' + towerRes.clearedFloor + ' 層守塔小魔王！+' + towerRes.totalFloorCoins + '🪙' +
          (towerRes.healedHeart ? ' ＋補回 1❤️' : '') + '！）';
      } else {
        towerNote = '（🗼 通過第 ' + towerRes.clearedFloor + ' 層 +' + towerRes.totalFloorCoins + '🪙！）';
      }
    }

    recordDailyQuestProgress(
      saveData,
      {
        type: 'question_correct',
        realmId: q.realm || (session.stage && session.stage.realmId) || 'mul',
        cleanFirstTry: cleanFirstTry,
        combo: session.combo
      },
      getLocalDateKey()
    );

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
    } else if(session.isTowerMode && els.bossTaunt){
      els.bossTaunt.textContent = wasTowerBossFloor
        ? ('「太強了！第 ' + clearedTowerFloor + ' 層守塔寶箱和愛心能量送給你！」')
        : '「漂亮的一擊！準備爬向下一層吧！」';
    } else if(els.bossTaunt){
      els.bossTaunt.textContent = (session.enemyHp === 0) ? '「寶箱喀嚓打開啦！太棒了！」' : '「漂亮的一擊！繼續加油！」';
    }

    var isFinalBlow = session.isTowerMode ? wasTowerBossFloor : (session.enemyHp === 0);
    var isBoss = session.isTowerMode ? wasTowerBossFloor : Boolean(session.stage && session.stage.isBoss);
    var finisherId = isFinalBlow ? pickNextFinisher() : '';
    if(isFinalBlow) session.finisherCountThisRun++;

    if(isFinalBlow && MathApp.audio && MathApp.audio.sfxFinisher){
      MathApp.audio.sfxFinisher(finisherId, isBoss);
    } else if(MathApp.audio && MathApp.audio.sfxCombo){
      MathApp.audio.sfxCombo(session.combo, isBoss);
    } else if(MathApp.sfx){
      MathApp.sfx(session.combo >= 3 ? 'combo' : (isBoss ? 'hit' : 'correct'));
    }

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
      playBunnyAttackAnim(session.combo >= 3, shieldEvent, partner, {
        luckyRainbowFx: Boolean(partner && partner.specialty === 'lucky' && partnerBond.level >= 2)
      });
    }

    var shieldNote = shieldEvent === 'broken-all' ? ' 💥 Boss 護盾全破！' : (shieldEvent === 'crack' ? ' 🛡️ 擊碎一層護盾！' : '');
    var finisherNote = isFinalBlow ? (' 【' + FINISHER_DEFS[finisherId].badge + '】') : '';
    if(els.feedback){
      els.feedback.textContent = '🎉 答對了！' + finisherNote + shieldNote + towerNote + gemNote + luckyDropNote + skillUpgradeNote + storyNote;
      els.feedback.className = 'mqst-stage-toast good';
    }

    if(els.helperDrawer) els.helperDrawer.classList.remove('open');
    if(els.stuckBanner) els.stuckBanner.style.display = 'none';

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
    var isLast = !session.isTowerMode && (session.idx + 1 >= session.questions.length);
    var readyHtml = session.isTowerMode
      ? ('前往第 ' + session.towerRun.currentFloor + ' 層 <i data-lucide="arrow-right" aria-hidden="true"></i>')
      : (isLast
          ? '看勝利成績 <i data-lucide="trophy" aria-hidden="true"></i>'
          : '下一題 <i data-lucide="arrow-right" aria-hidden="true"></i>');

    if(els.nextBtn){
      els.nextBtn.disabled = false;
      els.nextBtn.classList.remove('ult-waiting');
    }

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

    var partner = getActivePartnerIsland();
    if(partner){
      var bond = getPartnerBondInfo(saveData, partner.fullId);
      var shieldRes = resolveWrongAnswerWithShield({
        specialty: partner.specialty,
        bondLevel: bond.level,
        shieldChargesLeft: session.partnerShieldChargesLeft
      });
      if(shieldRes.absorbed){
        session.partnerShieldChargesLeft = shieldRes.nextShieldCharges;
        session.partnerShieldTriggeredCount++;
        updatePartnerSkillButton();
        if(MathApp.sfx) MathApp.sfx('magic');
        battleFx.playPartnerShieldAnim();
        updateBattleMoods('happy', 'normal', 'happy');
        setPartnerSpeech('護盾幫你擋住了！連擊和三星都沒事！');
        if(els.feedback){
          els.feedback.textContent = '🛡️ 【' + partner.spriteName + '】護盾發動！幫你擋下失誤，連擊與三星資格完整保留！（剩餘護盾 ×' + shieldRes.nextShieldCharges + '）';
          els.feedback.className = 'mqst-stage-toast good';
        }
        if(shieldRes.autoOpenFreeHelper){
          openHelperDrawer('🛡️ Lv.' + bond.level + ' 護盾免費提示（不扣星！）');
        }
        runAnim(function(gsap){
          gsap.fromTo(els.questionStage, { x: -5 }, { x: 0, duration: 0.25, ease: 'elastic.out(1.2, 0.4)', clearProps: 'transform' });
        });
        return;
      }
    }

    session.hadWrongOnCurrent = true;
    session.wrongCountOnCurrent = (session.wrongCountOnCurrent || 0) + 1;
    session.combo = 0;
    updateComboUI();

    session.lastClassroomTarget = resolveClassroomTargetForQuestion(q);

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
    if(partner){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }

    if(session.isTowerMode && session.towerRun){
      var towerWrongRes = applyTowerWrongAnswer(session.towerRun);
      renderTowerHud();
      if(towerWrongRes.isGameOver){
        session.towerGameOver = true;
        session.locked = true;
        if(els.feedback){
          els.feedback.textContent = '💔 愛心用完囉！你已經勇敢挑戰通過 ' + session.towerRun.clearedFloors + ' 層！（題目也已放進救救求救袋囉）';
          els.feedback.className = 'mqst-stage-toast bad';
        }
        if(els.choicesGrid) els.choicesGrid.style.display = 'none';
        if(els.keypadWrap)  els.keypadWrap.style.display  = 'none';
        if(els.nextDock)    els.nextDock.style.display    = 'flex';
        if(els.explanationBox){
          els.explanationBox.innerHTML = q.explanationHtml
            ? q.explanationHtml
            : ('✨ 正確答案：<b>' + (q.a != null && q.b != null && q.product != null ? (q.a + ' × ' + q.b + ' ＝ ' + q.product) : (q.ans != null ? q.ans : '')) + '</b>');
        }
        clearNextUnlockTimer();
        session.nextLocked = false;
        if(els.nextBtn){
          els.nextBtn.disabled = false;
          els.nextBtn.classList.remove('ult-waiting');
          els.nextBtn.innerHTML = '查看試煉塔成績 <i data-lucide="trophy" aria-hidden="true"></i>';
          if(MathApp.refreshIcons) MathApp.refreshIcons();
        }
        if(els.stuckBanner && session.lastClassroomTarget){
          if(els.stuckMsg) els.stuckMsg.textContent = '🏫 不著急！先點這裡回教學教室看積木動畫暖身再挑戰！';
          if(els.stuckGotoBtn) els.stuckGotoBtn.textContent = session.lastClassroomTarget.label;
          els.stuckBanner.style.display = 'flex';
        }
        runAnim(function(gsap){
          gsap.fromTo(els.questionStage, { x: -7 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.35)', clearProps: 'transform' });
        });
        return;
      }
      if(els.feedback){
        els.feedback.textContent = '❤️ 少 1 顆愛心（剩 ' + towerWrongRes.hearts + ' 顆），先看看積木提示再試一次！';
        els.feedback.className = 'mqst-stage-toast bad';
      }
    } else if(els.feedback){
      els.feedback.textContent = '💡 沒關係！看看魔法積木提示泡泡，再試一次吧！';
      els.feedback.className = 'mqst-stage-toast bad';
    }
    openHelperDrawer('💡 積木提示（答錯輔助）');

    if(session.wrongCountOnCurrent >= 2 && els.stuckBanner && session.lastClassroomTarget){
      if(els.stuckMsg) els.stuckMsg.textContent = '💡 這題卡關了嗎？可以先去對應教室用積木慢慢看！';
      if(els.stuckGotoBtn) els.stuckGotoBtn.textContent = session.lastClassroomTarget.label;
      els.stuckBanner.style.display = 'flex';
    }

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

    // 兩步驟分步引導模式：先檢查第 1 步，答對鎖定並自動推進至第 2 步
    if(q.stepMode === 'guided_two_step'){
      var curSlotSpec = q.slots[session.guidedStepIdx];
      var curInp = curSlotSpec ? els.equationRow.querySelector('[data-slot-id="' + curSlotSpec.id + '"]') : null;
      var stepOk = curSlotSpec && Number(userValues[curSlotSpec.id]) === curSlotSpec.expected;
      if(!stepOk){
        if(curInp){
          curInp.classList.remove('active-input', 'correct', 'wrong');
          curInp.classList.add('wrong');
        }
        handleWrong(q);
        if(curInp){
          curInp.value = '';
          setActiveInput(curInp);
        }
        return;
      }

      if(session.guidedStepIdx === 0){
        session.guidedStepIdx = 1;
        if(MathApp.sfx) MathApp.sfx('correct');
        updateBattleMoods('happy', 'hit', 'happy');
        if(getActivePartnerIsland()){
          setPartnerSpeech('第 1 步算對囉！繼續完成第 2 步！');
        }
        runAnim(function(gsap){
          if(els.enemyActor){
            gsap.fromTo(els.enemyActor, { x: 0 }, { x: 8, duration: 0.08, yoyo: true, repeat: 3, ease: 'power1.inOut', clearProps: 'transform' });
          }
        });
        els.equationRow.innerHTML = renderCloudQuestionHtml(q, { stepIdx: 1 });
        bindEquationInputs();
        if(els.feedback){
          els.feedback.textContent = '✅ 第 1 步算出 ' + curSlotSpec.expected + '，很棒！現在完成第 2 步發動攻擊！';
          els.feedback.className = 'mqst-stage-toast good';
        }
        return;
      }

      handleCorrect(q);
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
    if(session.isTowerMode){
      if(session.towerGameOver){
        finishTowerRun('hearts_depleted');
      } else {
        advanceTowerFloor();
      }
      return;
    }
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
    ensureDailyQuests(saveData, todayKey);

    var battlePartner = session.battlePartnerId ? getIslandById(session.battlePartnerId) : null;
    var battlePartnerBond = battlePartner ? getPartnerBondInfo(saveData, battlePartner.fullId) : { level: 1 };

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
    var luckyBonusCoins = (battlePartner && battlePartner.specialty === 'lucky')
      ? calculateLuckyCoinBonus(coinOutcome.coins, battlePartnerBond.level)
      : 0;
    var skillUpgradeBonus = session.skillUpgradesThisRun.reduce(function(acc, item){
      return acc + (Number(item && item.bonusCoins) || 0);
    }, 0);
    session.earnedCoinsThisRun = coinOutcome.coins + luckyBonusCoins + skillUpgradeBonus + Number(session.partnerSkillBonusCoins || 0) + Number(session.partnerLuckyDropCoins || 0);
    saveData.starCoins = Number(saveData.starCoins || 0) + coinOutcome.coins + luckyBonusCoins;
    if(coinOutcome.consumesDailyReplay){
      saveData.daily.replayRewardCount = (saveData.daily.replayRewardCount || 0) + 1;
    }

    var partnerBondUp = null;
    if(battlePartner){
      var bondXpGain = computeBattleBondXp({
        stars: stars,
        isRescueMode: session.isRescueMode,
        isGemHuntMode: session.isGemHuntMode
      });
      partnerBondUp = addPartnerBondXp(saveData, battlePartner.fullId, bondXpGain);
    }

    var newlyCompletedDaily = recordDailyQuestProgress(
      saveData,
      {
        type: 'stage_clear',
        realmId: (session.stage && session.stage.realmId) || saveData.activeRealm || 'mul',
        stars: stars,
        maxCombo: session.maxCombo,
        isRescueMode: session.isRescueMode,
        isGemHuntMode: session.isGemHuntMode
      },
      todayKey
    );

    var newBadges = checkAndUnlockBadges();
    var newCostumes = checkAndUnlockCostumes(false);
    syncAlbumFromProgress(saveData);
    persistSave();
    updateHubStats();

    var partner = getActivePartnerIsland();
    if(els.victoryBunny) els.victoryBunny.innerHTML = getPinkBunnySvg('happy');
    if(els.victorySprite){
      var showSp = unlockedSprite || battlePartner || partner;
      if(showSp){
        var showBond = getPartnerBondInfo(saveData, showSp.fullId);
        els.victorySprite.style.display = 'block';
        els.victorySprite.innerHTML = getCharacterSvg(showSp.theme, false, 'happy', { bondLevel: showBond.level });
      } else {
        els.victorySprite.style.display = 'none';
      }
    }

    if(els.resFirstAcc) els.resFirstAcc.textContent = session.firstTryCorrect + ' / ' + total;
    if(els.resCoins)    els.resCoins.textContent    = '+' + session.earnedCoinsThisRun + ' 🪙';
    var isSkillSummary = Boolean((session.stage && (session.stage.realmId === 'sunny' || session.stage.realmId === 'cloud')) || (session.isRescueMode && session.skillHitsThisRun > 0 && session.newGemsThisRun.length === 0));
    if(els.resCollectLbl){
      els.resCollectLbl.textContent = isSkillSummary ? '技能累積' : '新亮寶石';
    }
    if(els.resNewGems){
      els.resNewGems.textContent = isSkillSummary
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
      if(els.resClassroomBtn) els.resClassroomBtn.style.display = 'none';
    } else if(session.isGemHuntMode){
      els.resultTitle.textContent = '💎 寶石補完特訓完成！';
      els.resultSub.textContent = session.newGemsThisRun.length > 0
        ? ('太棒了！又替 81 格寶石牆點亮了 ' + session.newGemsThisRun.length + ' 顆閃亮寶石！')
        : '完成特訓！再多試一次，就能把沒亮的寶石一次點亮喔！';
      els.resNextBtn.style.display = 'none';
      els.resRetryBtn.style.display = 'none';
      if(els.resClassroomBtn) els.resClassroomBtn.style.display = 'none';
    } else {
      els.resultTitle.textContent = stars === 3 ? '滿分三星！閃耀大勝利！' : (stars === 2 ? '表現超棒！冒險成功！' : '完成冒險！繼續加油！');
      els.resultSub.textContent = stars === 3 ? '粉紅小兔為你拍拍手，全靠自己破關太強了！' : '再挑戰一次就能收集三顆閃亮大星星！';
      var realmStages = getStagesByRealm((session.stage && session.stage.realmId) || 'mul');
      var curIdx = realmStages.indexOf(session.stage);
      els.resNextBtn.innerHTML = '<i data-lucide="play" aria-hidden="true"></i> <span>跳往下一關</span>';
      els.resNextBtn.style.display = (curIdx >= 0 && curIdx + 1 < realmStages.length) ? 'inline-flex' : 'none';
      els.resRetryBtn.innerHTML = '<i data-lucide="rotate-ccw" aria-hidden="true"></i> <span>再挑戰三星</span>';
      els.resRetryBtn.style.display = 'inline-flex';
      if(els.resClassroomBtn){
        if(stars < 3){
          session.lastClassroomTarget = session.lastClassroomTarget || resolveClassroomTargetForQuestion(session.questions[0]);
          els.resClassroomBtn.style.display = 'inline-flex';
          if(els.resClassroomLbl) els.resClassroomLbl.textContent = session.lastClassroomTarget.label;
        } else {
          els.resClassroomBtn.style.display = 'none';
        }
      }
      if(MathApp.refreshIcons) MathApp.refreshIcons();
    }

    var starNodes = els.resultStars.querySelectorAll('.mqst-star-item');
    for(var s = 0; s < starNodes.length; s++){
      starNodes[s].classList.toggle('earned', (s + 1) <= stars);
    }

    var showcaseHtml = '';
    if(unlockedSprite){
      var unlockedSpecMeta = getSpecialtyMeta(unlockedSprite.specialty);
      showcaseHtml += '<div class="mqst-unlock-banner">' +
        getCharacterSvg(unlockedSprite.theme, false, 'happy', { bondLevel: 1 }) +
        '<div><div>🎉 成功收服守護小精靈：【' + unlockedSprite.spriteName + '】（' + unlockedSpecMeta.icon + ' ' + unlockedSpecMeta.name + '）！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + unlockedSprite.spriteDesc + '</div>' +
        '<div class="mqst-unlock-subnote">🤝 已自動加入冒險隊伍！專長 Lv.1：' + unlockedSpecMeta.lvDesc[1] + '</div></div></div>';
    }
    var totalLuckyExtra = luckyBonusCoins + Number(session.partnerLuckyDropCoins || 0);
    if(battlePartner && battlePartner.specialty === 'lucky' && totalLuckyExtra > 0){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#fef9c3 0%,#fde68a 100%);border-color:#eab308;">' +
        '<span style="font-size:32px;" aria-hidden="true">🌟</span>' +
        '<div><div>幸運尋寶加成：【' + battlePartner.spriteName + '】幫你多撿回 +' + totalLuckyExtra + ' 🪙！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">通關加成 +' + luckyBonusCoins + ' 🪙' +
        (session.partnerLuckyDropCoins > 0 ? ('・答對幸運掉落 +' + session.partnerLuckyDropCoins + ' 🪙') : '') + '</div></div></div>';
    }
    if(partnerBondUp && partnerBondUp.leveledUp && battlePartner){
      var upSpecMeta = getSpecialtyMeta(battlePartner.specialty);
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%);border-color:#db2777;">' +
        getCharacterSvg(battlePartner.theme, false, 'happy', { bondLevel: partnerBondUp.newLevel }) +
        '<div><div>💖 親密度升級：【' + battlePartner.spriteName + '】升上 Lv.' + partnerBondUp.newLevel + ' 囉！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' +
        (partnerBondUp.unlockedAura
          ? ('✨ 解鎖專屬閃耀光環！' + (battlePartner.lv3Cheer || upSpecMeta.lvDesc[3]))
          : (upSpecMeta.icon + ' 專長進化：' + upSpecMeta.lvDesc[partnerBondUp.newLevel])) +
        '</div></div></div>';
    }
    var claimableDailyCnt = countClaimableDailyQuests(saveData);
    if(newlyCompletedDaily.length > 0 || claimableDailyCnt > 0){
      var completedTitle = newlyCompletedDaily.length > 0
        ? ('今日委託【' + newlyCompletedDaily[0].title + '】達成！')
        : ('目前有 ' + claimableDailyCnt + ' 項每日委託可領獎！');
      showcaseHtml += '<div class="mqst-unlock-banner is-costume" style="background:linear-gradient(135deg,#e0e7ff 0%,#ddd6fe 100%);border-color:#6366f1;">' +
        '<div class="mqst-unlock-costume-main">' +
          '<span style="font-size:32px;" aria-hidden="true">📅</span>' +
          '<div><div>' + completedTitle + '</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">領取獎勵還能順便在冒險印章本蓋下今天的一章喔！</div></div>' +
        '</div>' +
        '<button type="button" class="mqst-unlock-equip-btn" data-result-open-daily="1">🎁 領獎＆蓋印章</button></div>';
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
    if(!session.cloudUnlockedBefore && isRealmUnlocked('cloud', saveData)){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#e0f2fe 0%,#ddd6fe 100%);border-color:#2563eb;">' +
        '<span style="font-size:34px;">☁️</span>' +
        '<div><div>🌟 解鎖新海域：【雲端應用王國】航道開啟！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">回世界地圖點擊上方「☁️ 雲端應用王國」就能前往五大浮空島冒險囉！</div></div></div>';
    }
    els.unlockShowcase.innerHTML = showcaseHtml;

    if(unlockedSprite && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎉 成功收服【' + unlockedSprite.spriteName + '】！已加入你的冒險隊伍！');
    } else if(partnerBondUp && partnerBondUp.leveledUp && battlePartner && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('💖 【' + battlePartner.spriteName + '】親密度升至 Lv.' + partnerBondUp.newLevel + (partnerBondUp.unlockedAura ? '，解鎖專屬閃耀光環！' : '！'));
    } else if(newCostumes.length > 0 && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎀 解鎖小兔新造型【' + newCostumes[0].name + '】！點「馬上換上」試穿吧！');
    }

    if(MathApp.sfx) MathApp.sfx('fanfare');
    if(MathApp.utils && MathApp.utils.launchConfetti){
      MathApp.utils.launchConfetti(stars === 3 || Boolean(unlockedSprite) || newCostumes.length > 0 || Boolean(partnerBondUp && partnerBondUp.leveledUp));
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
        if(labBtn){
          var aVal = Number(labBtn.getAttribute('data-a')) || 28;
          var bVal = Number(labBtn.getAttribute('data-b')) || 15;
          var opVal = labBtn.getAttribute('data-op') === 'sub' ? 'sub' : 'add';
          if(MathApp.sfx) MathApp.sfx('click');
          navigateToClassroom({ unit: 'calc', subTab: 'learn', a: aVal, b: bVal, op: opVal });
          return;
        }
        var unitBtn = e.target.closest('[data-goto-unit]');
        if(!unitBtn) return;
        var targetUnit = unitBtn.getAttribute('data-goto-unit');
        if(MathApp.sfx) MathApp.sfx('click');
        if(targetUnit === 'learn'){
          var pvNum = Number(unitBtn.getAttribute('data-pv-num')) || 305;
          navigateToClassroom({ unit: 'learn', subTab: 'learn', presetNum: pvNum });
        } else if(targetUnit === 'seq'){
          var seqStart = unitBtn.hasAttribute('data-seq-start') ? Number(unitBtn.getAttribute('data-seq-start')) : 185;
          var seqStep = Number(unitBtn.getAttribute('data-seq-step')) || 10;
          navigateToClassroom({ unit: 'seq', subTab: 'learn', startNum: seqStart, step: seqStep });
        } else if(targetUnit === 'mul'){
          var mRow = Number(unitBtn.getAttribute('data-mul-a')) || 3;
          var mCol = Number(unitBtn.getAttribute('data-mul-b')) || 4;
          navigateToClassroom({ unit: 'mul', subTab: 'learn', row: mRow, col: mCol });
        } else {
          navigateToClassroom({ unit: targetUnit, subTab: 'learn' });
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
        // 無盡試煉塔無星數壓力，免二次確認直接展開積木輔助
        if(session.isTowerMode){
          session.usedHelperOnCurrent = true;
          openHelperDrawer('🧱 試煉塔積木輔助（不扣愛心）');
          return;
        }
        // 本題已經使用過小幫手（已計算提示扣星），直接再次開啟不重複詢問
        if(session.usedHelperOnCurrent){
          openHelperDrawer('🧱 積木小幫手（本關最高 2 顆星）');
          return;
        }
        if(els.helperConfirmDialog && typeof els.helperConfirmDialog.showModal === 'function'){
          if(els.helperConfirmTip){
            var activeP = getActivePartnerIsland();
            var activeEff = activeP
              ? (session.partnerEffects || getPartnerSpecialtyEffects(activeP, getPartnerBondInfo(saveData, activeP.fullId).level))
              : null;
            var canUseFreePartner = Boolean(activeP && activeEff && activeEff.isActive && session.partnerSkillUsesLeft > 0);
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

    if(els.launchTowerBtn){
      els.launchTowerBtn.addEventListener('click', openTowerDialog);
    }
    if(els.openTowerBtn){
      els.openTowerBtn.addEventListener('click', openTowerDialog);
    }
    if(els.towerRetreatBtn){
      els.towerRetreatBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        finishTowerRun('retreat');
      });
    }
    setupDialogPolyfill(els.towerDialog);
    if(els.towerDialog){
      els.towerDialog.addEventListener('click', function(e){
        var routeBtn = e.target.closest('[data-start-tower-route]');
        if(routeBtn && !routeBtn.disabled){
          if(MathApp.sfx) MathApp.sfx('click');
          startTowerRun(routeBtn.getAttribute('data-start-tower-route'));
          return;
        }
        var bossBtn = e.target.closest('[data-goto-boss]');
        if(bossBtn){
          var bSid = bossBtn.getAttribute('data-goto-boss');
          if(MathApp.sfx) MathApp.sfx('click');
          if(els.towerDialog && els.towerDialog.open) els.towerDialog.close();
          jumpToStageFromDex(bSid);
        }
      });
    }
    if(els.stuckGotoBtn){
      els.stuckGotoBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        navigateToClassroom(session.lastClassroomTarget);
      });
    }
    if(els.resClassroomBtn){
      els.resClassroomBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        navigateToClassroom(session.lastClassroomTarget);
      });
    }

    if(els.resNextBtn){
      els.resNextBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(session.isTowerMode && session.towerRun){
          startTowerRun(session.towerRun.routeId);
          return;
        }
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
        if(session.isTowerMode){
          openTowerDialog();
          return;
        }
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

    function refreshUiAfterWardrobeChange(){
      persistSave();
      syncAllBunnyVisuals();
      syncProjectileVisual();
      updateHubStats();
    }

    function handleEquipWardrobePiece(slot, itemId, afterFn){
      var res = equipWardrobeItem(saveData, slot, itemId);
      if(!res.ok) return false;
      refreshUiAfterWardrobeChange();
      if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
      else if(MathApp.sfx) MathApp.sfx('pop');
      if(MathApp.utils && MathApp.utils.showToast && res.item){
        var msg = res.item.slot === 'wand'
          ? (res.item.icon + ' 已裝備【' + res.item.name + '】！戰鬥會發射專屬魔法彈囉！')
          : (res.item.icon + ' 粉紅小兔換上【' + res.item.name + '】囉！');
        MathApp.utils.showToast(msg);
      }
      if(afterFn) afterFn(res);
      return true;
    }

    function handleBuyWardrobeItem(itemId, afterFn){
      var res = purchaseWardrobeItem(saveData, itemId, { autoEquip: true });
      if(!res.ok){
        if(res.reason === 'insufficient_coins' && MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('🪙 星星幣還差 ' + res.missing + ' 枚！破關或領每日委託就能賺星星幣喔！');
        }
        return false;
      }
      refreshUiAfterWardrobeChange();
      if(MathApp.sfx) MathApp.sfx('magic');
      if(MathApp.utils && MathApp.utils.showToast && res.item){
        MathApp.utils.showToast('🛍️ 已買下【' + res.item.name + '】並幫小兔穿戴好囉！');
      }
      if(afterFn) afterFn(res);
      return true;
    }

    function isTreehouseStageMounted(){
      return Boolean(els.treehouseView && els.treehouseView.style.display !== 'none' && els.thStage && els.thStage.querySelector('.mqst-th-room'));
    }

    function swapTreehouseSlotOnStage(slot, itemId){
      if(!isTreehouseStageMounted()) return;
      if(slot === 'wallpaper'){
        animateSlotSwap(els.thStage, 'wallpaper', {
          wallpaperMeta: getTreehouseWallpaperMeta(itemId),
          wallKey: itemId
        });
        return;
      }
      var progressStats = dialogs.buildTreehouseProgressStats(saveData);
      var nextHtml = renderTreehouseSlotContentHtml(slot, itemId, {
        progressStats: progressStats,
        lampLit: session.treehouseLampLit
      });
      animateSlotSwap(els.thStage, slot, {
        nextHtml: nextHtml,
        itemId: itemId,
        lampLit: session.treehouseLampLit
      });
    }

    function handleEquipTreehouseDecor(slot, itemId, afterFn){
      var res = equipTreehouseSlot(saveData, slot, itemId);
      if(!res.ok) return false;
      persistSave();
      session.treehouseSlot = slot;
      if(MathApp.audio && MathApp.audio.sfxChime) MathApp.audio.sfxChime();
      else if(MathApp.sfx) MathApp.sfx('pop');
      swapTreehouseSlotOnStage(slot, itemId);
      if(els.thToast && res.item){
        els.thToast.textContent = res.item.icon + ' 已為秘密樹屋換上【' + res.item.name + '】！';
      }
      if(afterFn) afterFn(res);
      return true;
    }

    function handleBuyTreehouseItem(itemId, afterFn){
      var res = purchaseTreehouseItem(saveData, itemId, { autoEquip: true });
      if(!res.ok){
        if(res.reason === 'insufficient_coins' && MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('🪙 星星幣還差 ' + res.missing + ' 枚，無法購買這件家具喔！');
        }
        return false;
      }
      persistSave();
      updateHubStats();
      if(res.item) session.treehouseSlot = res.item.slot;
      if(MathApp.sfx) MathApp.sfx('magic');
      if(res.item) swapTreehouseSlotOnStage(res.item.slot, res.item.id);
      if(els.thToast && res.item){
        els.thToast.textContent = '🛍️ 已購買並擺設【' + res.item.name + '】！';
      }
      if(MathApp.utils && MathApp.utils.showToast && res.item){
        MathApp.utils.showToast('🏡 已購買並擺設樹屋家具【' + res.item.name + '】！');
      }
      if(afterFn) afterFn(res);
      return true;
    }

    function syncPlaymateVisualOnStage(partnerId){
      if(!isTreehouseStageMounted()) return;
      var btn = els.thStage.querySelector('[data-th-playmate-btn="' + partnerId + '"]');
      var isl = getIslandById(partnerId);
      if(!btn || !isl) return;
      var bond = getPartnerBondInfo(saveData, isl.fullId);
      var specMeta = getSpecialtyMeta(isl.specialty);
      btn.classList.toggle('is-lv3', bond.level >= 3);
      var lvEl = btn.querySelector('.mqst-th-sprite-lv');
      if(lvEl && specMeta){
        lvEl.textContent = specMeta.icon + ' Lv.' + bond.level;
      }
      var svgWrap = btn.querySelector('.mqst-th-sprite-svg');
      if(svgWrap){
        svgWrap.innerHTML = getCharacterSvg(isl.theme, false, 'happy', { bondLevel: bond.level });
      }
    }

    function handleFeedPartnerSnack(partnerId, snackId, afterFn){
      var res = feedPartnerSnack(saveData, partnerId, snackId);
      if(!res.ok){
        if(res.reason === 'insufficient_coins' && MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('🪙 星星幣還差 ' + res.missing + ' 枚，還買不起這份點心喔！');
        }
        return false;
      }
      persistSave();
      updateHubStats();
      var isl = getIslandById(res.partnerId);
      var spName = isl ? isl.spriteName : '守護小精靈';
      var bondRes = res.bondRes || {};
      if(bondRes.unlockedAura){
        if(MathApp.sfx) MathApp.sfx('fanfare');
        if(MathApp.utils && MathApp.utils.launchConfetti) MathApp.utils.launchConfetti(true);
      } else if(bondRes.leveledUp){
        if(MathApp.sfx) MathApp.sfx('star');
      } else {
        if(MathApp.sfx) MathApp.sfx('pop');
      }
      if(isTreehouseStageMounted()){
        syncPlaymateVisualOnStage(res.partnerId);
        playFeedSnackAnimation(els.thStage, res.partnerId, {
          snackIcon: res.snack.icon,
          bondXp: res.snack.bondXp,
          leveledUp: Boolean(bondRes.leveledUp),
          unlockedAura: Boolean(bondRes.unlockedAura)
        });
      }
      var feedMsg = bondRes.unlockedAura
        ? ('✨ 【' + spName + '】親密度升上 Lv.3，解鎖專屬閃耀光環！「' + ((isl && isl.lv3Cheer) || '太喜歡你了！') + '」')
        : (bondRes.leveledUp
            ? ('💖 【' + spName + '】吃下' + res.snack.name + '後升上親密度 Lv.' + bondRes.newLevel + ' 囉！')
            : (res.snack.icon + ' 餵【' + spName + '】吃' + res.snack.name + '（親密度 +' + res.snack.bondXp + '，目前 ' + bondRes.xp + ' 點）！'));
      if(els.thToast) els.thToast.textContent = feedMsg;
      if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast(feedMsg);
      if(afterFn) afterFn(res);
      return true;
    }

    if(els.unlockShowcase){
      els.unlockShowcase.addEventListener('click', function(e){
        var dailyOpenBtn = e.target.closest('[data-result-open-daily]');
        if(dailyOpenBtn){
          openDailyDialog();
          return;
        }
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

      if(els.openDexBtn){
        els.openDexBtn.addEventListener('click', function(){ openDexDialog(); });
      }
      if(els.openWardrobeBtn){
        els.openWardrobeBtn.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }
      if(els.hudAvatar){
        els.hudAvatar.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }
      if(els.hudStatusTray){
        els.hudStatusTray.addEventListener('click', function(e){
          var jumpBtn = e.target.closest('[data-hud-jump]');
          if(!jumpBtn) return;
          var dest = jumpBtn.getAttribute('data-hud-jump');
          if(dest === 'shop'){
            openShopDialog('wardrobe');
          } else if(dest === 'gems' || dest === 'sprites' || dest === 'badges'){
            openDexDialog(dest);
          }
        });
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
          var filterBtn = e.target.closest('[data-wardrobe-filter]');
          if(filterBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            renderWardrobePane(filterBtn.getAttribute('data-wardrobe-filter'));
            return;
          }
          var gotoShopBtn = e.target.closest('[data-goto-shop]');
          if(gotoShopBtn){
            var shopTab = gotoShopBtn.getAttribute('data-goto-shop') || 'wardrobe';
            if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
            openShopDialog(shopTab);
            return;
          }
          var gemHuntBtn = e.target.closest('[data-wardrobe-gem-hunt]');
          if(gemHuntBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            startGemHuntBattle();
            return;
          }
          var buyBtn = e.target.closest('[data-buy-wardrobe-item]');
          if(buyBtn){
            handleBuyWardrobeItem(buyBtn.getAttribute('data-buy-wardrobe-item'), function(){
              renderWardrobePane();
            });
            return;
          }
          var eqSlotBtn = e.target.closest('[data-equip-slot][data-equip-item]');
          if(eqSlotBtn){
            handleEquipWardrobePiece(
              eqSlotBtn.getAttribute('data-equip-slot'),
              eqSlotBtn.getAttribute('data-equip-item'),
              function(){ renderWardrobePane(); }
            );
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
          var devTierBtn = e.target.closest('[data-dev-skill-tier]');
          if(devTierBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            saveData.devSkillTier = devTierBtn.getAttribute('data-dev-skill-tier') || '';
            persistSave();
            updatePreviewToggleBtn();
            renderDexDialog();
            return;
          }
          var gotoBtn = e.target.closest('[data-goto-stage]');
          if(!gotoBtn) return;
          var sid = gotoBtn.getAttribute('data-goto-stage');
          if(MathApp.sfx) MathApp.sfx('click');
          jumpToStageFromDex(sid);
        });
      }

      if(els.paneSprites){
        els.paneSprites.addEventListener('click', function(e){
          var devBondBtn = e.target.closest('[data-dev-bond]');
          if(devBondBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            saveData.devBondLevel = Number(devBondBtn.getAttribute('data-dev-bond')) || 0;
            persistSave();
            updatePreviewToggleBtn();
            renderDexDialog();
            renderMap();
            if(els.treehouseView && els.treehouseView.style.display !== 'none'){
              renderCurrentTreehouse();
            }
            return;
          }
          var goThBtn = e.target.closest('[data-goto-treehouse-sprite]');
          if(goThBtn){
            var targetPid = toCanonicalPartnerId(goThBtn.getAttribute('data-goto-treehouse-sprite'));
            if(MathApp.sfx) MathApp.sfx('click');
            if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
            openTreehouse('sprites', targetPid);
            return;
          }
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

      if(els.paneAlbum){
        els.paneAlbum.addEventListener('click', function(e){
          var filterBtn = e.target.closest('[data-album-filter]');
          if(filterBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            renderAlbumPane(filterBtn.getAttribute('data-album-filter'));
            return;
          }
          var bossBtn = e.target.closest('[data-goto-boss]');
          if(bossBtn){
            var bSid = bossBtn.getAttribute('data-goto-boss');
            if(MathApp.sfx) MathApp.sfx('click');
            jumpToStageFromDex(bSid);
            return;
          }
          var stageBtn = e.target.closest('[data-goto-stage]');
          if(stageBtn){
            var sid = stageBtn.getAttribute('data-goto-stage');
            if(MathApp.sfx) MathApp.sfx('click');
            jumpToStageFromDex(sid);
          }
        });
      }

      bindTabGroup(dexTabs, 'data-dex', switchDexTab);

      if(els.dexNav && typeof window.matchMedia === 'function'){
        var dexNarrowMql = window.matchMedia('(max-width: 639px)');
        var syncDexNavOrientation = function(){
          if(els.dexNav){
            els.dexNav.setAttribute('aria-orientation', dexNarrowMql.matches ? 'horizontal' : 'vertical');
          }
        };
        syncDexNavOrientation();
        if(typeof dexNarrowMql.addEventListener === 'function'){
          dexNarrowMql.addEventListener('change', syncDexNavOrientation);
        } else if(typeof dexNarrowMql.addListener === 'function'){
          dexNarrowMql.addListener(syncDexNavOrientation);
        }
      }

      if(els.dexNav && typeof IntersectionObserver === 'function' && (!window.CSS || !CSS.supports('animation-timeline', 'scroll()'))){
        var firstDexTab = els.dexNav.firstElementChild;
        var lastDexTab = els.dexNav.lastElementChild;
        if(firstDexTab && lastDexTab){
          var dexFadeObserver = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
              var cls = entry.target === firstDexTab ? 'more-start' : 'more-end';
              els.dexNav.classList.toggle(cls, entry.intersectionRatio < 1);
            });
          }, { root: els.dexNav, threshold: 1, rootMargin: '1px' });
          dexFadeObserver.observe(firstDexTab);
          dexFadeObserver.observe(lastDexTab);
        }
      }
    }

    function bumpTreehouseDailyInteract(){
      var completed = recordDailyQuestProgress(saveData, { type: 'treehouse_interact' }, getLocalDateKey());
      persistSave();
      updateHubStats();
      if(completed.length > 0 && MathApp.utils && MathApp.utils.showToast){
        MathApp.utils.showToast('📅 每日委託【' + completed[0].title + '】達成！回地圖點「📅 每日委託」領獎＋蓋印章！');
      }
    }

    setupDialogPolyfill(els.dailyDialog);
    if(els.openDailyBtn && els.dailyDialog){
      els.openDailyBtn.addEventListener('click', openDailyDialog);
    }
    if(els.dailyBody){
      els.dailyBody.addEventListener('click', function(e){
        var claimBtn = e.target.closest('[data-claim-daily-task]');
        if(claimBtn){
          var taskId = claimBtn.getAttribute('data-claim-daily-task');
          var res = claimDailyQuestReward(saveData, taskId, getLocalDateKey());
          if(!res.ok) return;
          persistSave();
          updateHubStats();
          renderDailyDialog();

          var parts = ['🎁 已領取【' + res.task.title + '】+' + res.taskCoins + ' 🪙'];
          if(res.allClearBonus > 0){
            parts.push('🌟 全勤加碼 +' + res.allClearBonus + ' 🪙');
          }
          if(res.completedRound){
            parts.push(
              '💮 印章集滿 7 章贈 +' + res.stampCoins + ' 🪙' +
              (res.unlockedDecorItem ? ('＋限定擺飾【' + res.unlockedDecorItem.name + '】') : '') +
              '，開啟新一輪印章本！'
            );
            if(MathApp.sfx) MathApp.sfx('fanfare');
            if(MathApp.utils && MathApp.utils.launchConfetti) MathApp.utils.launchConfetti(true);
          } else {
            if(res.stampAwarded){
              parts.push('💮 冒險印章第 ' + res.stampNumber + '/7 章 (+' + res.stampCoins + ' 🪙)');
            }
            if(MathApp.sfx) MathApp.sfx('magic');
          }
          if(MathApp.utils && MathApp.utils.showToast){
            MathApp.utils.showToast(parts.join('・'));
          }
          return;
        }
        var goThBtn = e.target.closest('[data-daily-goto-treehouse]');
        if(goThBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          if(els.dailyDialog && els.dailyDialog.open) els.dailyDialog.close();
          openTreehouse('decor');
          return;
        }
        var goClassBtn = e.target.closest('[data-daily-goto-classroom]');
        if(goClassBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          navigateToClassroom(null);
          return;
        }
        var goTowerBtn = e.target.closest('[data-daily-goto-tower]');
        if(goTowerBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          if(els.dailyDialog && els.dailyDialog.open) els.dailyDialog.close();
          openTowerDialog();
          return;
        }
        var goRealmBtn = e.target.closest('[data-daily-goto-realm]');
        if(goRealmBtn){
          var realmId = goRealmBtn.getAttribute('data-daily-goto-realm');
          if(realmId && isRealmUnlocked(realmId, saveData)){
            if(MathApp.sfx) MathApp.sfx('click');
            if(els.dailyDialog && els.dailyDialog.open) els.dailyDialog.close();
            if(els.treehouseView && els.treehouseView.style.display !== 'none'){
              showView('map');
            }
            switchRealm(realmId, true);
          }
        }
      });
    }

    setupDialogPolyfill(els.shopDialog);
    if(els.openShopBtn && els.shopDialog){
      els.openShopBtn.addEventListener('click', function(){ openShopDialog('wardrobe'); });
    }
    if(els.shopDialog){
      var shopTabs = els.shopDialog.querySelectorAll('.mqst-dex-tab[data-shop]');
      bindTabGroup(shopTabs, 'data-shop', switchShopTab);

      els.shopDialog.addEventListener('click', function(e){
        var buyWardrobeBtn = e.target.closest('[data-shop-buy-wardrobe]');
        if(buyWardrobeBtn){
          handleBuyWardrobeItem(buyWardrobeBtn.getAttribute('data-shop-buy-wardrobe'), function(){
            renderShopDialog();
          });
          return;
        }
        var eqWardrobeBtn = e.target.closest('[data-shop-equip-wardrobe-slot][data-shop-equip-wardrobe-id]');
        if(eqWardrobeBtn){
          handleEquipWardrobePiece(
            eqWardrobeBtn.getAttribute('data-shop-equip-wardrobe-slot'),
            eqWardrobeBtn.getAttribute('data-shop-equip-wardrobe-id'),
            function(){ renderShopDialog(); }
          );
          return;
        }
        var buyThBtn = e.target.closest('[data-shop-buy-treehouse]');
        if(buyThBtn){
          handleBuyTreehouseItem(buyThBtn.getAttribute('data-shop-buy-treehouse'), function(){
            renderShopDialog();
            if(els.treehouseView && els.treehouseView.style.display !== 'none'){
              renderCurrentTreehouse({ skipStageRender: true });
            }
          });
          return;
        }
        var eqThBtn = e.target.closest('[data-shop-equip-th-slot][data-shop-equip-th-id]');
        if(eqThBtn){
          handleEquipTreehouseDecor(
            eqThBtn.getAttribute('data-shop-equip-th-slot'),
            eqThBtn.getAttribute('data-shop-equip-th-id'),
            function(){
              renderShopDialog();
              if(els.treehouseView && els.treehouseView.style.display !== 'none'){
                renderCurrentTreehouse({ skipStageRender: true });
              }
            }
          );
          return;
        }
        var goThShopBtn = e.target.closest('[data-shop-goto-treehouse]');
        if(goThShopBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          if(els.shopDialog && els.shopDialog.open) els.shopDialog.close();
          openTreehouse('decor');
          return;
        }
        var pickPartnerBtn = e.target.closest('[data-shop-select-partner]');
        if(pickPartnerBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          dialogs.setShopSelectedPartnerId(pickPartnerBtn.getAttribute('data-shop-select-partner'));
          renderShopDialog();
          return;
        }
        var feedSnackBtn = e.target.closest('[data-shop-feed-snack]');
        if(feedSnackBtn){
          var activeChip = els.shopPaneSnacks ? els.shopPaneSnacks.querySelector('[data-shop-select-partner].is-active') : null;
          var pid = (activeChip && activeChip.getAttribute('data-shop-select-partner')) || getActivePartnerId(saveData);
          if(!pid) return;
          handleFeedPartnerSnack(pid, feedSnackBtn.getAttribute('data-shop-feed-snack'), function(){
            renderShopDialog();
            renderMap();
          });
        }
      });
    }

    if(els.openTreehouseBtn){
      els.openTreehouseBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        openTreehouse('decor');
      });
    }
    if(els.thBackMapBtn){
      els.thBackMapBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        showView('map');
      });
    }
    if(els.thExitBtn){
      els.thExitBtn.addEventListener('click', closeArcade);
    }
    if(els.thOpenShopBtn){
      els.thOpenShopBtn.addEventListener('click', function(){ openShopDialog('treehouse'); });
    }
    if(els.thOpenWardrobeBtn){
      els.thOpenWardrobeBtn.addEventListener('click', function(){ openDexDialog('wardrobe'); });
    }
    if(els.thDecorateModeBtn){
      els.thDecorateModeBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        session.treehouseDecorateMode = !session.treehouseDecorateMode;
        if(session.treehouseDecorateMode){
          session.treehouseTab = 'decor';
          if(session.treehouseDockCollapsed) setTreehouseDockCollapsed(false);
          renderCurrentTreehouse({ skipStageRender: true });
          if(els.thToast){
            els.thToast.textContent = '✨ 快速佈置模式開啟！直接點屋內的窗戶、吊燈、掛飾或家具就能馬上挑選更換！';
          }
        } else {
          syncTreehouseDecorateModeUi();
          if(els.thToast){
            els.thToast.textContent = '🏡 已回到溫馨陪玩模式！點點家具和精靈會有可愛驚喜喔！';
          }
        }
      });
    }
    if(els.thDockToggleBtn){
      els.thDockToggleBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        setTreehouseDockCollapsed(!session.treehouseDockCollapsed);
      });
    }
    if(els.treehouseView){
      var thTabs = els.treehouseView.querySelectorAll('.mqst-th-tab[data-th-tab]');
      bindTabGroup(thTabs, 'data-th-tab', function(target, focusTab){
        syncTreehouseTabUi(target, focusTab);
        if(session.treehouseDockCollapsed) setTreehouseDockCollapsed(false);
      });
    }
    if(els.thStage){
      els.thStage.addEventListener('click', function(e){
        var interactEl = e.target.closest('[data-th-interact]');
        if(interactEl){
          var kind = interactEl.getAttribute('data-th-interact');
          var itemId = interactEl.getAttribute('data-item-id') || '';
          if(session.treehouseDecorateMode && kind !== 'bunny'){
            if(MathApp.sfx) MathApp.sfx('click');
            session.treehouseSlot = kind;
            session.treehouseTab = 'decor';
            if(session.treehouseDockCollapsed) setTreehouseDockCollapsed(false);
            renderCurrentTreehouse({ skipStageRender: true });
            playObjectEasterEgg(els.thStage, interactEl, { kind: kind, itemId: itemId });
            var slotObj = TREEHOUSE_SLOTS.find(function(s){ return s.id === kind; });
            if(els.thToast){
              els.thToast.textContent = '✨ 已選取【' + (slotObj ? slotObj.name : kind) + '】，請在下方挑選要更換的款式！';
            }
            return;
          }

          if(kind === 'ceiling' && isLightableCeiling(itemId)){
            session.treehouseLampLit = !session.treehouseLampLit;
            var roomEl = els.thStage.querySelector('.mqst-th-room');
            if(roomEl) roomEl.classList.toggle('is-lamp-lit', session.treehouseLampLit);
            interactEl.innerHTML = renderTreehouseSlotContentHtml('ceiling', itemId, {
              lampLit: session.treehouseLampLit
            });
          }

          if((itemId === 'gramophone' || itemId === 'rainbow_musicbox' || itemId === 'cloud_windchime') && MathApp.audio && MathApp.audio.sfxMusicBox){
            MathApp.audio.sfxMusicBox();
          } else if(kind === 'ceiling' && isLightableCeiling(itemId) && MathApp.audio && MathApp.audio.sfxChime){
            MathApp.audio.sfxChime();
          } else if(MathApp.audio && MathApp.audio.sfxJump){
            MathApp.audio.sfxJump();
          } else if(MathApp.sfx){
            MathApp.sfx('pop');
          }

          var progressStats = dialogs.buildTreehouseProgressStats(saveData);
          var msg = getTreehouseInteractMessage(kind, itemId, {
            progressStats: progressStats,
            lampLit: session.treehouseLampLit
          });
          playObjectEasterEgg(els.thStage, interactEl, { kind: kind, itemId: itemId });
          if(kind === 'bunny'){
            showActorSpeechBubble(els.thStage, interactEl, msg.replace(/^🐰\s*粉紅小兔[^：「]*：「?|」$/g, ''));
          }
          if(els.thToast){
            els.thToast.textContent = msg;
          }
          bumpTreehouseDailyInteract();
          return;
        }
        var playmateBtn = e.target.closest('[data-th-playmate-btn]');
        if(playmateBtn){
          var pid = toCanonicalPartnerId(playmateBtn.getAttribute('data-th-playmate-btn'));
          session.treehouseSelectedPartner = pid;
          els.thStage.querySelectorAll('.mqst-th-playmate-slot.is-occupied').forEach(function(el){
            el.classList.toggle('is-selected', toCanonicalPartnerId(el.getAttribute('data-th-playmate-btn')) === pid);
          });
          var spIsl = getIslandById(pid);
          var bond = getPartnerBondInfo(saveData, pid);
          var specMeta = spIsl ? getSpecialtyMeta(spIsl.specialty) : null;
          if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
          else if(MathApp.sfx) MathApp.sfx('pop');
          playObjectEasterEgg(els.thStage, playmateBtn, { kind: 'playmate', itemId: pid });
          if(spIsl){
            var fullLine = bond.level >= 3 && spIsl.lv3Cheer
              ? (spIsl.partnerProjectile + ' ' + spIsl.spriteName + ' (Lv.3)：' + spIsl.lv3Cheer)
              : (spIsl.partnerProjectile + ' 【' + spIsl.spriteName + '】開心地轉圈圈！（Lv.' + bond.level + ' · ' + (specMeta ? specMeta.name : '') + '）');
            var shortBubble = bond.level >= 3 && spIsl.lv3Cheer
              ? spIsl.lv3Cheer
              : (spIsl.spriteName + '好喜歡這間樹屋！✨');
            showActorSpeechBubble(els.thStage, playmateBtn, shortBubble);
            if(els.thToast) els.thToast.textContent = fullLine;
          }
          bumpTreehouseDailyInteract();
          renderCurrentTreehouse({ skipStageRender: true });
          return;
        }
        var emptySlot = e.target.closest('[data-th-empty-slot]');
        if(emptySlot){
          if(MathApp.sfx) MathApp.sfx('click');
          session.treehouseTab = 'sprites';
          if(session.treehouseDockCollapsed) setTreehouseDockCollapsed(false);
          renderCurrentTreehouse({ skipStageRender: true });
          if(els.thToast){
            els.thToast.textContent = '👇 在下方點選已收服的守護小精靈，就可以邀請進來坐坐喔！';
          }
        }
      });
    }
    if(els.thDock){
      els.thDock.addEventListener('click', function(e){
        var slotBtn = e.target.closest('[data-th-slot-select]');
        if(slotBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          session.treehouseSlot = slotBtn.getAttribute('data-th-slot-select');
          renderCurrentTreehouse({ skipStageRender: true });
          return;
        }
        var eqBtn = e.target.closest('[data-th-equip-slot][data-th-equip-item]');
        if(eqBtn){
          handleEquipTreehouseDecor(
            eqBtn.getAttribute('data-th-equip-slot'),
            eqBtn.getAttribute('data-th-equip-item'),
            function(){ renderCurrentTreehouse({ skipStageRender: true }); }
          );
          return;
        }
        var buyBtn = e.target.closest('[data-th-buy-item]');
        if(buyBtn){
          handleBuyTreehouseItem(buyBtn.getAttribute('data-th-buy-item'), function(){
            renderCurrentTreehouse({ skipStageRender: true });
          });
          return;
        }
        var toggleBtn = e.target.closest('[data-th-toggle-playmate]');
        if(toggleBtn){
          var pid = toCanonicalPartnerId(toggleBtn.getAttribute('data-th-toggle-playmate'));
          var res = toggleTreehousePlaymate(saveData, pid);
          if(!res.ok){
            if(res.reason === 'max_playmates'){
              if(MathApp.sfx) MathApp.sfx('wrong');
              if(els.thToast){
                els.thToast.textContent = '🐾 樹屋遊樂位最多只能同時邀請 ' + res.max + ' 隻小精靈！請先點一隻讓牠休息再邀請喔！';
              }
            }
            return;
          }
          if(res.action === 'added'){
            session.treehouseSelectedPartner = pid;
          }
          persistSave();
          if(MathApp.sfx) MathApp.sfx(res.action === 'added' ? 'star' : 'click');
          var islObj = getIslandById(pid);
          if(els.thToast && islObj){
            els.thToast.textContent = res.action === 'added'
              ? ('🏡 已邀請【' + islObj.spriteName + '】來秘密樹屋遊玩！點牠互動或餵點心吧！')
              : ('👋 已讓【' + islObj.spriteName + '】先回精靈草原休息囉！');
          }
          renderCurrentTreehouse();
          return;
        }
        var selectFeedBtn = e.target.closest('[data-th-select-feed]');
        if(selectFeedBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          session.treehouseSelectedPartner = toCanonicalPartnerId(selectFeedBtn.getAttribute('data-th-select-feed'));
          if(els.thStage){
            els.thStage.querySelectorAll('.mqst-th-playmate-slot.is-occupied').forEach(function(el){
              el.classList.toggle('is-selected', toCanonicalPartnerId(el.getAttribute('data-th-playmate-btn')) === session.treehouseSelectedPartner);
            });
          }
          renderCurrentTreehouse({ skipStageRender: true });
          return;
        }
        var gotoRealmBtn = e.target.closest('[data-th-goto-realm]');
        if(gotoRealmBtn){
          var targetRealmId = gotoRealmBtn.getAttribute('data-th-goto-realm');
          if(MathApp.sfx) MathApp.sfx('click');
          showView('map');
          if(targetRealmId){
            switchRealm(targetRealmId, false);
          }
          return;
        }
        var feedBtn = e.target.closest('[data-th-feed-snack][data-th-feed-partner]');
        if(feedBtn){
          handleFeedPartnerSnack(
            feedBtn.getAttribute('data-th-feed-partner'),
            feedBtn.getAttribute('data-th-feed-snack'),
            function(){
              renderCurrentTreehouse({ skipStageRender: true });
              renderMap();
            }
          );
        }
      });
    }

    setupDialogPolyfill(els.parentDialog);
    if(els.openParentBtn && els.parentDialog){
      var openParentSettings = function(){
        if(MathApp.sfx) MathApp.sfx('click');
        updatePreviewToggleBtn();
        refreshParentLock();
        if(els.backupFeedback){
          els.backupFeedback.textContent = '';
          els.backupFeedback.className = 'mqst-parent-status mqst-backup-status';
        }
        els.parentDialog.showModal();
      };
      els.openParentBtn.addEventListener('click', openParentSettings);
      if(els.devBadge){
        els.devBadge.addEventListener('click', openParentSettings);
      }
    }
    if(els.devToggle){
      els.devToggle.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        saveData.devMode = !saveData.devMode;
        if(!saveData.devMode){
          saveData = normalizeSaveDataV2(saveData);
        }
        persistSave();
        updatePreviewToggleBtn();
        syncAllBunnyVisuals();
        syncProjectileVisual();
        updateHubStats();
        renderMap();
        if(els.treehouseView && els.treehouseView.style.display !== 'none'){
          renderCurrentTreehouse();
        }
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast(
            saveData.devMode
              ? '🧪 已開啟開發者全解鎖檢視模式！可自由預覽全部精靈、三部位裝扮、樹屋家具與徽章！'
              : '已關閉開發者模式，恢復真實冒險存檔進度。'
          );
        }
      });
    }
    if(els.devToolbox){
      els.devToolbox.addEventListener('click', function(e){
        var bondBtn = e.target.closest('[data-dev-bond]');
        if(bondBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          saveData.devBondLevel = Number(bondBtn.getAttribute('data-dev-bond')) || 0;
          persistSave();
          updatePreviewToggleBtn();
          renderMap();
          if(els.treehouseView && els.treehouseView.style.display !== 'none'){
            renderCurrentTreehouse();
          }
          if(MathApp.utils && MathApp.utils.showToast){
            MathApp.utils.showToast(
              saveData.devBondLevel > 0
                ? ('🐣 已切換精靈親密度預覽為 Lv.' + saveData.devBondLevel + (saveData.devBondLevel >= 3 ? '（滿級星光環✨）' : ''))
                : '🐣 已恢復顯示精靈真實親密度進度'
            );
          }
          return;
        }
        var tierBtn = e.target.closest('[data-dev-skill-tier]');
        if(tierBtn){
          if(MathApp.sfx) MathApp.sfx('click');
          saveData.devSkillTier = tierBtn.getAttribute('data-dev-skill-tier') || '';
          persistSave();
          updatePreviewToggleBtn();
          if(MathApp.utils && MathApp.utils.showToast){
            MathApp.utils.showToast(
              saveData.devSkillTier
                ? ('📖 已切換技能卡框材質預覽為：' + (saveData.devSkillTier === 'gold' ? '🥇 金卡' : saveData.devSkillTier === 'silver' ? '🥈 銀卡' : '🥉 銅卡'))
                : '📖 已恢復顯示技能卡真實進度'
            );
          }
          return;
        }
      });
    }
    if(els.devAddCoinsBtn){
      els.devAddCoinsBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('star');
        saveData.starCoins = Math.max(0, Math.floor(Number(saveData.starCoins || 0))) + 500;
        persistSave();
        updateHubStats();
        if(els.treehouseView && els.treehouseView.style.display !== 'none'){
          renderCurrentTreehouse();
        }
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast('🪙 已發放 +500 測試星星幣！（目前共 ' + saveData.starCoins + ' 🪙）');
        }
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
        ensureDailyQuests(saveData, getLocalDateKey());
        persistSave();
        updatePreviewToggleBtn();
        refreshParentLock();
        syncAllBunnyVisuals();
        syncProjectileVisual();
        updateHubStats();
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
        if(
          (els.dexDialog && els.dexDialog.open) ||
          (els.dailyDialog && els.dailyDialog.open) ||
          (els.shopDialog && els.shopDialog.open) ||
          (els.towerDialog && els.towerDialog.open) ||
          (els.helperConfirmDialog && els.helperConfirmDialog.open) ||
          (els.parentDialog && els.parentDialog.open) ||
          (els.audioDialog && els.audioDialog.open)
        ) return;
        // 戰鬥中或秘密樹屋內誤按 Esc 僅安全返回（若試煉塔已有過層則進行結算避免遺失戰績）
        if(
          (session.active && els.battleView && els.battleView.style.display !== 'none') ||
          (els.treehouseView && els.treehouseView.style.display !== 'none')
        ){
          if(session.isTowerMode && session.towerRun && session.towerRun.clearedFloors > 0){
            finishTowerRun('retreat');
          } else {
            showView('map');
          }
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
      var capNotifiedDate = '';
      MathApp.on('classroomPractice', function(payload){
        var todayKey = getLocalDateKey();
        var res = applyClassroomPracticeReward(saveData, payload, todayKey);
        if(!res.ok) return;
        var unlockedBadges = checkAndUnlockBadges();
        persistSave();
        updateHubStats();

        if(MathApp.utils && MathApp.utils.showToast){
          if(res.coinsAwarded > 0){
            var note = '🪙 教室探索練習很棒！+' + res.coinsAwarded + ' 星星幣（今日 ' + res.classroomCoinEarned + '/' + CLASSROOM_DAILY_COIN_CAP + '）';
            if(res.newlyCompleted.length > 0){
              note += '・📅 委託【' + res.newlyCompleted[0].title + '】達成！';
            }
            if(unlockedBadges.length > 0){
              note += '・🏅 解鎖【' + unlockedBadges[0].name + '】！';
            }
            MathApp.utils.showToast(note);
            if(res.capReached) capNotifiedDate = todayKey;
          } else if(res.newlyCompleted.length > 0){
            MathApp.utils.showToast('📅 每日委託【' + res.newlyCompleted[0].title + '】達成！回冒險島即可領獎＋蓋印章！');
          } else if(res.capReached && capNotifiedDate !== todayKey){
            capNotifiedDate = todayKey;
            MathApp.utils.showToast('✨ 今日教室練習星幣已集滿 ' + CLASSROOM_DAILY_COIN_CAP + ' 🪙，快去冒險島實戰挑戰吧！');
          }
        }
      });
      MathApp.on('tabChange', function(tab){
        if(tab === 'quest'){
          updateHubStats();
          syncAllBunnyVisuals();
          syncProjectileVisual();
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

    ensureDailyQuests(saveData, getLocalDateKey());
    syncAlbumFromProgress(saveData);
    // 升級舊存檔時自動補齊已達標的小兔造型
    if(checkAndUnlockCostumes(true).length > 0){
      persistSave();
    }
    syncAllBunnyVisuals();
    syncProjectileVisual();

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
    getWardrobeItems: function(){ return WARDROBE_ITEMS.slice(); },
    getTreehouseItems: function(){ return TREEHOUSE_ITEMS.slice(); },
    getPartnerSnacks: function(){ return PARTNER_SNACKS.slice(); },
    getSkillCards: function(){ return SKILL_CARDS.slice(); },
    getBossAlbumEntries: function(){ return BOSS_ALBUM_ENTRIES.slice(); },
    getStoryAlbumEntries: function(){ return STORY_ALBUM_ENTRIES.slice(); },
    getTowerRoutes: function(){ return TOWER_ROUTES.slice(); },
    getDailyState: function(){
      ensureDailyQuests(saveData, getLocalDateKey());
      return {
        daily: Object.assign({}, saveData.daily, { tasks: (saveData.daily.tasks || []).slice() }),
        stampBook: Object.assign({}, saveData.stampBook)
      };
    },
    openDailyDialog: openDailyDialog,
    openShopDialog: openShopDialog,
    openTreehouse: openTreehouse,
    openTowerDialog: openTowerDialog,
    startTowerRun: startTowerRun,
    getTowerStats: function(){
      return Object.assign({}, saveData.tower || { bestFloors: { all: 0, sunny: 0, mul: 0, word: 0 } });
    },
    getAlbumStats: function(){
      return {
        bossesDefeated: countDefeatedBosses(saveData, { ignoreDevMode: true }),
        unlockedStories: countUnlockedStories(saveData, { ignoreDevMode: true })
      };
    },
    buildStageQuestions: buildStageQuestions,
    generateChoicesForQuestion: function(q, count){
      if(!q) return [];
      if(q.kind === 'mul') return MathApp.mulQuiz.generateChoices(q, count);
      if(q.realm === 'cloud') return generateCloudChoices(q, count);
      return generateCalcChoices(q, count);
    },
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
      ensureDailyQuests(saveData, getLocalDateKey());
      persistSave();
      updatePreviewToggleBtn();
      syncAllBunnyVisuals();
      syncProjectileVisual();
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
