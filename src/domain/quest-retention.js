/**
 * 數學冒險島耐玩度養成純函式領域模組
 * 涵蓋：每日冒險委託、不斷簽冒險印章本、三部位裝扮交易、秘密樹屋佈置與精靈親密度／四大專長計算
 */
import {
  REALMS,
  ISLANDS,
  WARDROBE_ITEMS,
  TREEHOUSE_ITEMS,
  STAMP_MILESTONE_DECOR_IDS,
  PARTNER_BOND_THRESHOLDS,
  PARTNER_SNACKS,
  LEGACY_COSTUME_MIGRATION_MAP,
  getWardrobeItemById,
  getTreehouseItemById,
  getSnackById,
  getIslandById,
  toCanonicalPartnerId
} from './quest-data.js';
import { getLocalDateKey, isRealmUnlocked, getStageStars } from './quest-questions.js';

export const DAILY_ALL_CLEAR_BONUS = 25;
export const STAMP_STEP_COINS = 15;
export const STAMP_ROUND_COMPLETE_COINS = 100;
export const STAMP_OVERFLOW_BONUS_COINS = 40;
export const MAX_TREEHOUSE_PLAYMATES = 3;

const WARMUP_TEMPLATES = [
  {
    id: 'w_clear1',
    icon: '🗺️',
    title: '小試身手',
    desc: '在任一海域完成 1 個冒險關卡',
    metric: 'clear_any_stage',
    realmFilter: 'any',
    target: 1
  },
  {
    id: 'w_correct5',
    icon: '✨',
    title: '數學暖身操',
    desc: '在冒險島累計答對 5 題',
    metric: 'correct_any',
    realmFilter: 'any',
    target: 5
  },
  {
    id: 'w_treehouse2',
    icon: '🏡',
    title: '樹屋好朋友',
    desc: '進入秘密樹屋點擊家具或精靈互動 2 次',
    metric: 'treehouse_interact',
    realmFilter: 'any',
    target: 2
  },
  {
    id: 'w_classroom3',
    icon: '🏫',
    title: '教室暖身操',
    desc: '去四大教學教室動手探索或練習答對 3 次',
    metric: 'classroom_practice',
    realmFilter: 'any',
    target: 3
  }
];

const THEME_TEMPLATES_BY_REALM = {
  sunny: [
    {
      id: 't_sunny_clean4',
      icon: '☀️',
      title: '陽光神射手',
      desc: '在陽光加減群島不用小幫手一次答對 4 題',
      metric: 'clean_correct_realm',
      realmFilter: 'sunny',
      target: 4
    },
    {
      id: 't_sunny_clear1',
      icon: '🥐',
      title: '陽光島巡禮',
      desc: '在陽光加減群島完成 1 個關卡',
      metric: 'clear_realm',
      realmFilter: 'sunny',
      target: 1
    }
  ],
  mul: [
    {
      id: 't_mul_clean4',
      icon: '🌲',
      title: '口訣閃電手',
      desc: '在九九乘法奇幻群島不用小幫手一次答對 4 題',
      metric: 'clean_correct_realm',
      realmFilter: 'mul',
      target: 4
    },
    {
      id: 't_mul_clear1',
      icon: '🏰',
      title: '乘法島冒險',
      desc: '在九九乘法奇幻群島完成 1 個關卡',
      metric: 'clear_realm',
      realmFilter: 'mul',
      target: 1
    }
  ],
  cloud: [
    {
      id: 't_cloud_clean3',
      icon: '☁️',
      title: '雲端解謎家',
      desc: '在雲端應用王國不用小幫手一次答對 3 題',
      metric: 'clean_correct_realm',
      realmFilter: 'cloud',
      target: 3
    },
    {
      id: 't_cloud_clear1',
      icon: '🚂',
      title: '雲端王國啟航',
      desc: '在雲端應用王國完成 1 個關卡',
      metric: 'clear_realm',
      realmFilter: 'cloud',
      target: 1
    }
  ]
};

const CHALLENGE_TEMPLATES = [
  {
    id: 'c_three_star',
    icon: '⭐',
    title: '三星閃耀王',
    desc: '在任一冒險關卡獲得 3 顆星評價',
    metric: 'earn_3_stars',
    realmFilter: 'any',
    target: 1
  },
  {
    id: 'c_combo5',
    icon: '🔥',
    title: '五連擊神手',
    desc: '在戰鬥中達成連續答對 5 題（5 連擊）',
    metric: 'reach_combo_5',
    realmFilter: 'any',
    target: 1
  },
  {
    id: 'c_clear2',
    icon: '🧭',
    title: '雙關探險家',
    desc: '今日完成 2 個冒險關卡',
    metric: 'clear_any_stage',
    realmFilter: 'any',
    target: 2
  },
  {
    id: 'c_clean8',
    icon: '💎',
    title: '專注八連對',
    desc: '不用小幫手一次答對累計 8 題',
    metric: 'clean_correct_any',
    realmFilter: 'any',
    target: 8
  },
  {
    id: 'c_tower5',
    icon: '🗼',
    title: '高塔守門挑戰',
    desc: '在無盡試煉塔打敗第 5 層守塔小魔王',
    metric: 'tower_floor_5',
    realmFilter: 'any',
    target: 1
  }
];

function clampInt(val, min, max) {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function hashSeedString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createDateSeededRng(dateKey, salt = '') {
  let state = hashSeedString(String(dateKey || '') + '|' + String(salt || ''));
  if (state === 0) state = 0x6d2b79f5;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getUnlockedRealmsForDaily(saveData) {
  const list = [];
  REALMS.forEach((realm) => {
    if (realm.status === 'active' && isRealmUnlocked(realm.id, saveData)) {
      list.push(realm.id);
    }
  });
  return list.length > 0 ? list : ['sunny', 'mul'];
}

export function generateDailyQuests(dateKey, unlockedRealms = ['sunny', 'mul'], options = {}) {
  const safeDate = typeof dateKey === 'string' && dateKey ? dateKey : getLocalDateKey();
  const rng = createDateSeededRng(safeDate, 'daily_v1');

  const validRealms = Array.isArray(unlockedRealms) && unlockedRealms.length > 0
    ? unlockedRealms.filter((id) => Boolean(THEME_TEMPLATES_BY_REALM[id]))
    : ['sunny', 'mul'];
  const realmsPool = validRealms.length > 0 ? validRealms : ['sunny', 'mul'];

  const towerUnlocked = options.towerUnlocked !== false;
  const challengePool = towerUnlocked
    ? CHALLENGE_TEMPLATES
    : CHALLENGE_TEMPLATES.filter((c) => c.id !== 'c_tower5');

  const wPick = WARMUP_TEMPLATES[Math.floor(rng() * WARMUP_TEMPLATES.length)];
  const rId = realmsPool[Math.floor(rng() * realmsPool.length)];
  const themePool = THEME_TEMPLATES_BY_REALM[rId] || THEME_TEMPLATES_BY_REALM.mul;
  const tPick = themePool[Math.floor(rng() * themePool.length)];
  const cPick = challengePool[Math.floor(rng() * challengePool.length)];

  return [
    {
      id: 'dq_' + safeDate + '_warmup_' + wPick.id,
      slot: 'warmup',
      slotLabel: '暖身委託',
      icon: wPick.icon,
      title: wPick.title,
      desc: wPick.desc,
      metric: wPick.metric,
      realmFilter: wPick.realmFilter,
      target: wPick.target,
      progress: 0,
      rewardCoins: 20,
      claimed: false
    },
    {
      id: 'dq_' + safeDate + '_theme_' + tPick.id,
      slot: 'theme',
      slotLabel: '主題委託',
      icon: tPick.icon,
      title: tPick.title,
      desc: tPick.desc,
      metric: tPick.metric,
      realmFilter: tPick.realmFilter,
      target: tPick.target,
      progress: 0,
      rewardCoins: 30,
      claimed: false
    },
    {
      id: 'dq_' + safeDate + '_challenge_' + cPick.id,
      slot: 'challenge',
      slotLabel: '挑戰委託',
      icon: cPick.icon,
      title: cPick.title,
      desc: cPick.desc,
      metric: cPick.metric,
      realmFilter: cPick.realmFilter,
      target: cPick.target,
      progress: 0,
      rewardCoins: 45,
      claimed: false
    }
  ];
}

function hasTowerAccessForDaily(saveData) {
  if (!saveData) return false;
  if (saveData.previewAll || saveData.devMode) return true;
  const defeated = saveData.bossesDefeated && typeof saveData.bossesDefeated === 'object' ? saveData.bossesDefeated : {};
  if (Object.keys(defeated).some((k) => Number(defeated[k] || 0) > 0)) return true;
  const stars = saveData.stageStars && typeof saveData.stageStars === 'object' ? saveData.stageStars : {};
  return ISLANDS.some((isl) => Number(stars[isl.bossStageId] || stars[isl.bossStageId.replace(/^mul:/, '')] || 0) >= 1);
}

export function ensureDailyQuests(saveData, dateKey = getLocalDateKey()) {
  if (!saveData || typeof saveData !== 'object') return null;
  const safeDate = typeof dateKey === 'string' && dateKey ? dateKey : getLocalDateKey();
  const unlockedRealms = getUnlockedRealmsForDaily(saveData);
  const dailyOpts = { towerUnlocked: hasTowerAccessForDaily(saveData) };

  if (!saveData.stampBook || typeof saveData.stampBook !== 'object') {
    saveData.stampBook = { count: 0, round: 1 };
  }

  if (!saveData.daily || typeof saveData.daily !== 'object' || saveData.daily.date !== safeDate) {
    saveData.daily = {
      date: safeDate,
      tasks: generateDailyQuests(safeDate, unlockedRealms, dailyOpts),
      replayRewardCount: 0,
      classroomCoinEarned: 0,
      stampedToday: false,
      allClearBonusClaimed: false
    };
    return saveData.daily;
  }

  if (!Array.isArray(saveData.daily.tasks) || saveData.daily.tasks.length !== 3) {
    saveData.daily.tasks = generateDailyQuests(safeDate, unlockedRealms, dailyOpts);
  } else {
    // 若先前生成的任務池包含尚未解鎖的海域，強制替換為安全題池
    const allowedSet = new Set(unlockedRealms);
    const hasInvalidRealm = saveData.daily.tasks.some(
      (t) => t && t.realmFilter && t.realmFilter !== 'any' && !allowedSet.has(t.realmFilter)
    );
    if (hasInvalidRealm) {
      saveData.daily.tasks = generateDailyQuests(safeDate, unlockedRealms, dailyOpts);
    }
  }
  if (typeof saveData.daily.allClearBonusClaimed !== 'boolean') {
    saveData.daily.allClearBonusClaimed = false;
  }
  return saveData.daily;
}

export function recordDailyQuestProgress(saveData, event, dateKey = getLocalDateKey()) {
  if (!saveData || !event || typeof event !== 'object') return [];
  const daily = ensureDailyQuests(saveData, dateKey);
  if (!daily || !Array.isArray(daily.tasks)) return [];

  const newlyCompleted = [];
  daily.tasks.forEach((task) => {
    if (!task || task.claimed) return;
    const prev = clampInt(task.progress, 0, task.target);
    let next = prev;

    if (event.type === 'question_correct') {
      if (task.metric === 'correct_any') {
        next = Math.min(task.target, prev + 1);
      } else if (task.metric === 'clean_correct_any' && event.cleanFirstTry) {
        next = Math.min(task.target, prev + 1);
      } else if (
        task.metric === 'clean_correct_realm' &&
        event.cleanFirstTry &&
        event.realmId &&
        event.realmId === task.realmFilter
      ) {
        next = Math.min(task.target, prev + 1);
      } else if (task.metric === 'reach_combo_5' && (Number(event.combo) || 0) >= 5) {
        next = task.target;
      }
    } else if (event.type === 'stage_clear') {
      if (task.metric === 'clear_any_stage') {
        next = Math.min(task.target, prev + 1);
      } else if (
        task.metric === 'clear_realm' &&
        !event.isRescueMode &&
        !event.isGemHuntMode &&
        event.realmId === task.realmFilter
      ) {
        next = Math.min(task.target, prev + 1);
      } else if (
        task.metric === 'earn_3_stars' &&
        !event.isRescueMode &&
        !event.isGemHuntMode &&
        (Number(event.stars) || 0) >= 3
      ) {
        next = task.target;
      } else if (task.metric === 'reach_combo_5' && (Number(event.maxCombo) || 0) >= 5) {
        next = task.target;
      }
    } else if (event.type === 'treehouse_interact') {
      if (task.metric === 'treehouse_interact') {
        next = Math.min(task.target, prev + 1);
      }
    } else if (event.type === 'classroom_practice') {
      if (task.metric === 'classroom_practice') {
        next = Math.min(task.target, prev + (Number(event.count) || 1));
      }
    } else if (event.type === 'tower_floor_clear') {
      if (task.metric === 'tower_floor_5') {
        if ((Number(event.floor) || 0) >= 5) {
          next = task.target;
        }
      } else if (task.metric === 'correct_any') {
        next = Math.min(task.target, prev + 1);
      } else if (task.metric === 'clean_correct_any' && event.isClean) {
        next = Math.min(task.target, prev + 1);
      }
    }

    if (next !== prev) {
      task.progress = next;
      if (prev < task.target && next >= task.target) {
        newlyCompleted.push(task);
      }
    }
  });

  return newlyCompleted;
}

export function countClaimableDailyQuests(saveData) {
  if (!saveData || !saveData.daily || !Array.isArray(saveData.daily.tasks)) return 0;
  let cnt = 0;
  saveData.daily.tasks.forEach((t) => {
    if (t && !t.claimed && Number(t.progress || 0) >= Number(t.target || 1)) {
      cnt++;
    }
  });
  return cnt;
}

export function claimDailyQuestReward(saveData, taskId, dateKey = getLocalDateKey()) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const daily = ensureDailyQuests(saveData, dateKey);
  const task = (daily.tasks || []).find((t) => t && t.id === taskId);
  if (!task) return { ok: false, reason: 'not_found' };
  if (task.claimed) return { ok: false, reason: 'already_claimed' };
  if (Number(task.progress || 0) < Number(task.target || 1)) {
    return { ok: false, reason: 'not_completed' };
  }

  task.claimed = true;
  const taskCoins = Number(task.rewardCoins || 0);
  let allClearBonus = 0;
  let stampAwarded = false;
  let stampCoins = 0;
  let completedRound = false;
  let unlockedDecorItem = null;

  const allClaimed = daily.tasks.every((t) => Boolean(t && t.claimed));
  if (allClaimed && !daily.allClearBonusClaimed) {
    daily.allClearBonusClaimed = true;
    allClearBonus = DAILY_ALL_CLEAR_BONUS;
  }

  if (!saveData.stampBook || typeof saveData.stampBook !== 'object') {
    saveData.stampBook = { count: 0, round: 1 };
  }
  let stampNumber = clampInt(saveData.stampBook.count, 0, 7);

  if (!daily.stampedToday) {
    daily.stampedToday = true;
    stampAwarded = true;
    const nextCount = clampInt(saveData.stampBook.count, 0, 6) + 1;
    stampNumber = nextCount;
    if (nextCount >= 7) {
      completedRound = true;
      stampCoins = STAMP_ROUND_COMPLETE_COINS;
      if (!saveData.treehouse || typeof saveData.treehouse !== 'object') {
        saveData.treehouse = { slots: {}, unlockedItems: [], playmates: [] };
      }
      if (!Array.isArray(saveData.treehouse.unlockedItems)) {
        saveData.treehouse.unlockedItems = [];
      }
      const nextDecorId = STAMP_MILESTONE_DECOR_IDS.find(
        (id) => saveData.treehouse.unlockedItems.indexOf(id) === -1
      );
      if (nextDecorId) {
        saveData.treehouse.unlockedItems.push(nextDecorId);
        unlockedDecorItem = getTreehouseItemById(nextDecorId);
      } else {
        stampCoins += STAMP_OVERFLOW_BONUS_COINS;
      }
      saveData.stampBook.count = 0;
      saveData.stampBook.round = clampInt(saveData.stampBook.round || 1, 1, 99999) + 1;
    } else {
      stampCoins = STAMP_STEP_COINS;
      saveData.stampBook.count = nextCount;
    }
  }

  const totalCoinsEarned = taskCoins + allClearBonus + stampCoins;
  saveData.starCoins = Math.max(0, Math.floor(Number(saveData.starCoins || 0))) + totalCoinsEarned;

  return {
    ok: true,
    task,
    taskCoins,
    allClearBonus,
    stampAwarded,
    stampNumber,
    stampCoins,
    completedRound,
    unlockedDecorItem,
    totalCoinsEarned
  };
}

/* ---------------- 守護小精靈親密度與四大專長效果 ---------------- */
export function getBondLevelFromXp(xp) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0));
  if (safeXp >= PARTNER_BOND_THRESHOLDS.lv3) return 3;
  if (safeXp >= PARTNER_BOND_THRESHOLDS.lv2) return 2;
  return 1;
}

export function getPartnerBondInfo(saveData, partnerFullId, { ignoreDevMode = false } = {}) {
  const canonical = toCanonicalPartnerId(partnerFullId);
  const raw =
    saveData &&
    saveData.partners &&
    saveData.partners.bonds &&
    saveData.partners.bonds[canonical];
  const realXp = Math.max(0, Math.floor(Number((raw && raw.xp) || 0)));
  const realLevel = getBondLevelFromXp(realXp);

  let xp = realXp;
  let level = realLevel;
  let devOverridden = false;
  if (!ignoreDevMode && saveData && saveData.devMode && Number(saveData.devBondLevel) >= 1) {
    level = clampInt(saveData.devBondLevel, 1, 3);
    xp = level === 3 ? Math.max(realXp, PARTNER_BOND_THRESHOLDS.lv3) : level === 2 ? Math.max(realXp, PARTNER_BOND_THRESHOLDS.lv2) : realXp;
    devOverridden = level !== realLevel;
  }

  const isMax = level >= 3;
  const prevThreshold = level === 1 ? 0 : PARTNER_BOND_THRESHOLDS.lv2;
  const nextThreshold = level === 1 ? PARTNER_BOND_THRESHOLDS.lv2 : PARTNER_BOND_THRESHOLDS.lv3;
  const span = Math.max(1, nextThreshold - prevThreshold);
  const pct = isMax ? 100 : Math.min(100, Math.round(((xp - prevThreshold) / span) * 100));
  return { xp, level, realXp, realLevel, devOverridden, prevThreshold, nextThreshold, pct, isMax };
}

export function computeBattleBondXp({ stars = 1, isRescueMode = false, isGemHuntMode = false } = {}) {
  if (isRescueMode || isGemHuntMode) return 10;
  return 10 + (Number(stars) === 3 ? 5 : 0);
}

export function addPartnerBondXp(saveData, partnerFullId, xpDelta) {
  if (!saveData || !partnerFullId) {
    return { prevLevel: 1, newLevel: 1, leveledUp: false, unlockedAura: false, xp: 0 };
  }
  const canonical = toCanonicalPartnerId(partnerFullId);
  if (!saveData.partners || typeof saveData.partners !== 'object') {
    saveData.partners = { activeId: '', bonds: {} };
  }
  if (!saveData.partners.bonds || typeof saveData.partners.bonds !== 'object') {
    saveData.partners.bonds = {};
  }
  const cur = saveData.partners.bonds[canonical] || { xp: 0, level: 1 };
  const prevLevel = getBondLevelFromXp(cur.xp);
  const nextXp = Math.max(0, Math.floor(Number(cur.xp || 0)) + Math.max(0, Math.floor(Number(xpDelta) || 0)));
  const newLevel = getBondLevelFromXp(nextXp);
  saveData.partners.bonds[canonical] = { xp: nextXp, level: newLevel };

  return {
    prevLevel,
    newLevel,
    leveledUp: newLevel > prevLevel,
    unlockedAura: prevLevel < 3 && newLevel >= 3,
    xp: nextXp
  };
}

export function getPartnerSpecialtyEffects(island, bondLevel = 1) {
  const lv = clampInt(bondLevel, 1, 3);
  const spec = (island && island.specialty) || 'eliminate';
  if (spec === 'eliminate') {
    return {
      type: 'eliminate',
      isActive: true,
      maxUses: lv >= 3 ? 2 : 1,
      removeWrongCount: lv >= 2 ? 2 : 1,
      keypadHintLevel: lv >= 2 ? 'range' : 'first_digit'
    };
  }
  if (spec === 'blocks') {
    return {
      type: 'blocks',
      isActive: true,
      maxUses: lv >= 3 ? 2 : 1,
      bonusCoinsOnUse: lv >= 2 ? 5 : 0
    };
  }
  if (spec === 'shield') {
    return {
      type: 'shield',
      isActive: false,
      passiveShieldCharges: lv >= 3 ? 2 : 1,
      autoOpenFreeHelper: lv >= 2
    };
  }
  return {
    type: 'lucky',
    isActive: false,
    coinMultiplier: lv >= 3 ? 1.5 : lv === 2 ? 1.35 : 1.2,
    bonusPct: lv >= 3 ? 50 : lv === 2 ? 35 : 20,
    feverComboFx: lv >= 2,
    perCorrectBonusChance: lv >= 3 ? 0.35 : 0,
    perCorrectBonusCoins: 2
  };
}

export function resolveWrongAnswerWithShield({ specialty, bondLevel = 1, shieldChargesLeft = 0 }) {
  const safeLeft = Math.max(0, Math.floor(Number(shieldChargesLeft) || 0));
  if (specialty === 'shield' && safeLeft > 0) {
    return {
      absorbed: true,
      nextShieldCharges: safeLeft - 1,
      preserveCombo: true,
      preserveCleanFirstTry: true,
      autoOpenFreeHelper: clampInt(bondLevel, 1, 3) >= 2
    };
  }
  return {
    absorbed: false,
    nextShieldCharges: safeLeft,
    preserveCombo: false,
    preserveCleanFirstTry: false,
    autoOpenFreeHelper: false
  };
}

export function calculateLuckyCoinBonus(baseCoins, bondLevel = 1) {
  const base = Math.max(0, Math.floor(Number(baseCoins) || 0));
  if (base <= 0) return 0;
  const lv = clampInt(bondLevel, 1, 3);
  const rate = lv >= 3 ? 0.5 : lv === 2 ? 0.35 : 0.2;
  return Math.ceil(base * rate);
}

export function rollLuckyPerCorrectDrop(bondLevel = 1, randomFn = Math.random) {
  if (clampInt(bondLevel, 1, 3) < 3) return 0;
  return randomFn() < 0.35 ? 2 : 0;
}

export function buildEliminateKeypadHint(q, stepIdx = 0, hintLevel = 'first_digit') {
  if (!q || !Array.isArray(q.slots) || q.slots.length === 0) {
    return '先把題目數字拆開再試試看喔！';
  }
  const slot = q.slots[Math.max(0, Math.min(q.slots.length - 1, stepIdx))] || q.slots[0];
  const ans = Number(slot.expected);
  if (!Number.isFinite(ans)) return '仔細檢查算式符號再輸入答案喔！';
  const absStr = String(Math.abs(Math.round(ans)));
  if (hintLevel === 'range') {
    if (absStr.length === 1) {
      const low = Math.max(0, ans - 2);
      const high = ans + 2;
      return '🌿 進階提示：這格答案在 ' + low + ' 到 ' + high + ' 之間，是' + (ans % 2 === 0 ? '偶數' : '奇數') + '！';
    }
    const low = Math.max(0, ans - 8);
    const high = ans + 8;
    return '🌿 進階提示：這格是 ' + absStr.length + ' 位數（約在 ' + low + ' ～ ' + high + ' 之間），最高位是 ' + absStr[0] + '！';
  }
  if (absStr.length === 1) {
    return '🌿 智慧提示：這格是 1 位數，且是' + (ans % 2 === 0 ? '偶數' : '奇數') + '喔！';
  }
  return '🌿 智慧提示：這格答案是 ' + absStr.length + ' 位數，最左邊開頭是「' + absStr[0] + '」！';
}

/* ---------------- 三部位裝扮與商店交易檢核 ---------------- */
export function getActiveWardrobe(saveData) {
  const rawActive = (saveData && saveData.wardrobe && saveData.wardrobe.active) || {};
  const legacyCostume = (saveData && saveData.activeCostume) || 'default';
  const mapped = LEGACY_COSTUME_MIGRATION_MAP[legacyCostume] || LEGACY_COSTUME_MIGRATION_MAP.default;
  return {
    hat: typeof rawActive.hat === 'string' && rawActive.hat ? rawActive.hat : mapped.hat || 'star_clip',
    outfit: typeof rawActive.outfit === 'string' && rawActive.outfit ? rawActive.outfit : mapped.outfit || 'none',
    wand: typeof rawActive.wand === 'string' && rawActive.wand ? rawActive.wand : 'none'
  };
}

export function isWardrobeItemUnlocked(saveData, itemId, { ignoreDevMode = false } = {}) {
  const item = getWardrobeItemById(itemId);
  if (!item) return false;
  if (item.source === 'free') return true;
  if (!ignoreDevMode && saveData && saveData.devMode) return true;
  const unlockedBySlot =
    saveData &&
    saveData.wardrobe &&
    saveData.wardrobe.unlocked &&
    Array.isArray(saveData.wardrobe.unlocked[item.slot])
      ? saveData.wardrobe.unlocked[item.slot]
      : [];
  if (unlockedBySlot.indexOf(item.id) !== -1) return true;
  if (
    item.legacyCostumeId &&
    saveData &&
    saveData.unlockedCostumes &&
    saveData.unlockedCostumes[item.legacyCostumeId]
  ) {
    return true;
  }
  return false;
}

export function countUnlockedWardrobeItems(saveData, { ignoreDevMode = false } = {}) {
  let cnt = 0;
  WARDROBE_ITEMS.forEach((item) => {
    if (item.id !== 'none' && isWardrobeItemUnlocked(saveData, item.id, { ignoreDevMode })) {
      cnt++;
    }
  });
  return Math.max(1, cnt);
}

export function purchaseWardrobeItem(saveData, itemId, { autoEquip = true } = {}) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const item = getWardrobeItemById(itemId);
  if (!item || item.source !== 'shop') return { ok: false, reason: 'not_purchasable' };
  if (isWardrobeItemUnlocked(saveData, item.id, { ignoreDevMode: true })) return { ok: false, reason: 'already_owned' };

  const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
  if (coins < item.price) {
    return { ok: false, reason: 'insufficient_coins', missing: item.price - coins, price: item.price };
  }

  saveData.starCoins = coins - item.price;
  if (!saveData.wardrobe || typeof saveData.wardrobe !== 'object') {
    saveData.wardrobe = {
      active: { hat: 'star_clip', outfit: 'none', wand: 'none' },
      unlocked: { hat: ['star_clip'], outfit: ['none'], wand: ['none'] }
    };
  }
  if (!saveData.wardrobe.unlocked) {
    saveData.wardrobe.unlocked = { hat: ['star_clip'], outfit: ['none'], wand: ['none'] };
  }
  if (!Array.isArray(saveData.wardrobe.unlocked[item.slot])) {
    saveData.wardrobe.unlocked[item.slot] = [];
  }
  if (saveData.wardrobe.unlocked[item.slot].indexOf(item.id) === -1) {
    saveData.wardrobe.unlocked[item.slot].push(item.id);
  }
  if (autoEquip) {
    if (!saveData.wardrobe.active) {
      saveData.wardrobe.active = { hat: 'star_clip', outfit: 'none', wand: 'none' };
    }
    saveData.wardrobe.active[item.slot] = item.id;
  }
  return { ok: true, item, remainingCoins: saveData.starCoins };
}

export function equipWardrobeItem(saveData, slot, itemId) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const item = getWardrobeItemById(itemId);
  if (!item || item.slot !== slot) return { ok: false, reason: 'invalid_item' };
  if (!isWardrobeItemUnlocked(saveData, item.id)) return { ok: false, reason: 'locked' };

  if (!saveData.wardrobe || typeof saveData.wardrobe !== 'object') {
    saveData.wardrobe = {
      active: { hat: 'star_clip', outfit: 'none', wand: 'none' },
      unlocked: { hat: ['star_clip'], outfit: ['none'], wand: ['none'] }
    };
  }
  if (!saveData.wardrobe.active) {
    saveData.wardrobe.active = { hat: 'star_clip', outfit: 'none', wand: 'none' };
  }
  saveData.wardrobe.active[slot] = item.id;
  if (item.legacyCostumeId && saveData.unlockedCostumes && saveData.unlockedCostumes[item.legacyCostumeId]) {
    saveData.activeCostume = item.legacyCostumeId;
  }
  return { ok: true, item, active: getActiveWardrobe(saveData) };
}

/* ---------------- 秘密樹屋佈置、精靈遊樂位與點心餵食 ---------------- */
export function isTreehouseItemUnlocked(saveData, itemId, { ignoreDevMode = false } = {}) {
  const item = getTreehouseItemById(itemId);
  if (!item) return false;
  if (item.source === 'free') return true;
  if (!ignoreDevMode && saveData && saveData.devMode) return true;
  const list = saveData && saveData.treehouse && Array.isArray(saveData.treehouse.unlockedItems)
    ? saveData.treehouse.unlockedItems
    : [];
  return list.indexOf(item.id) !== -1;
}

export function purchaseTreehouseItem(saveData, itemId, { autoEquip = true } = {}) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const item = getTreehouseItemById(itemId);
  if (!item || item.source !== 'shop') return { ok: false, reason: 'not_purchasable' };
  if (isTreehouseItemUnlocked(saveData, item.id, { ignoreDevMode: true })) return { ok: false, reason: 'already_owned' };

  const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
  if (coins < item.price) {
    return { ok: false, reason: 'insufficient_coins', missing: item.price - coins, price: item.price };
  }

  saveData.starCoins = coins - item.price;
  if (!saveData.treehouse || typeof saveData.treehouse !== 'object') {
    saveData.treehouse = {
      slots: {
        wallpaper: 'wood_cozy',
        rug: 'carrot_round',
        window: 'forest_morning',
        furniture: 'block_shelf',
        decor: 'sprout_pot'
      },
      unlockedItems: ['wood_cozy', 'carrot_round', 'forest_morning', 'block_shelf', 'sprout_pot'],
      playmates: []
    };
  }
  if (!Array.isArray(saveData.treehouse.unlockedItems)) {
    saveData.treehouse.unlockedItems = ['wood_cozy', 'carrot_round', 'forest_morning', 'block_shelf', 'sprout_pot'];
  }
  if (saveData.treehouse.unlockedItems.indexOf(item.id) === -1) {
    saveData.treehouse.unlockedItems.push(item.id);
  }
  if (autoEquip) {
    if (!saveData.treehouse.slots) saveData.treehouse.slots = {};
    saveData.treehouse.slots[item.slot] = item.id;
  }
  return { ok: true, item, remainingCoins: saveData.starCoins };
}

export function equipTreehouseSlot(saveData, slot, itemId) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const item = getTreehouseItemById(itemId);
  if (!item || item.slot !== slot) return { ok: false, reason: 'invalid_item' };
  if (!isTreehouseItemUnlocked(saveData, item.id)) return { ok: false, reason: 'locked' };
  if (!saveData.treehouse) saveData.treehouse = { slots: {}, unlockedItems: [], playmates: [] };
  if (!saveData.treehouse.slots) saveData.treehouse.slots = {};
  saveData.treehouse.slots[slot] = item.id;
  return { ok: true, item };
}

export function isPartnerUnlocked(saveData, partnerFullId, { ignoreDevMode = false } = {}) {
  if (!saveData || !partnerFullId) return false;
  const canonical = toCanonicalPartnerId(partnerFullId);
  const isl = getIslandById(canonical);
  if (!isl || isl.fullId !== canonical) return false;
  if (!ignoreDevMode && saveData.devMode) return true;
  return getStageStars(saveData, isl.bossStageId) >= 1;
}

export function getTreehousePlaymates(saveData) {
  const raw = saveData && saveData.treehouse && Array.isArray(saveData.treehouse.playmates)
    ? saveData.treehouse.playmates
    : [];
  const valid = [];
  raw.forEach((pid) => {
    const c = toCanonicalPartnerId(pid);
    if (c && valid.indexOf(c) === -1 && isPartnerUnlocked(saveData, c)) {
      valid.push(c);
    }
  });
  return valid.slice(0, MAX_TREEHOUSE_PLAYMATES);
}

export function toggleTreehousePlaymate(saveData, partnerFullId) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const canonical = toCanonicalPartnerId(partnerFullId);
  if (!isPartnerUnlocked(saveData, canonical)) return { ok: false, reason: 'locked_partner' };

  if (!saveData.treehouse || typeof saveData.treehouse !== 'object') {
    saveData.treehouse = { slots: {}, unlockedItems: [], playmates: [] };
  }
  const current = getTreehousePlaymates(saveData);
  const idx = current.indexOf(canonical);
  if (idx !== -1) {
    current.splice(idx, 1);
    saveData.treehouse.playmates = current;
    return { ok: true, action: 'removed', playmates: current };
  }
  if (current.length >= MAX_TREEHOUSE_PLAYMATES) {
    return { ok: false, reason: 'max_playmates', max: MAX_TREEHOUSE_PLAYMATES, playmates: current };
  }
  current.push(canonical);
  saveData.treehouse.playmates = current;
  return { ok: true, action: 'added', playmates: current };
}

export function feedPartnerSnack(saveData, partnerFullId, snackId) {
  if (!saveData) return { ok: false, reason: 'invalid_save' };
  const canonical = toCanonicalPartnerId(partnerFullId);
  if (!isPartnerUnlocked(saveData, canonical)) return { ok: false, reason: 'locked_partner' };
  const snack = getSnackById(snackId);
  if (!snack) return { ok: false, reason: 'invalid_snack' };

  const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
  if (coins < snack.price) {
    return { ok: false, reason: 'insufficient_coins', missing: snack.price - coins, price: snack.price };
  }

  saveData.starCoins = coins - snack.price;
  const bondRes = addPartnerBondXp(saveData, canonical, snack.bondXp);
  return {
    ok: true,
    snack,
    partnerId: canonical,
    remainingCoins: saveData.starCoins,
    bondRes
  };
}

/* ---------------- Phase 4：四大教學教室雙向連動獎勵（每日上限 15 星幣） ---------------- */
export const CLASSROOM_COINS_PER_PRACTICE = 3;
export const CLASSROOM_DAILY_COIN_CAP = 15;

export function applyClassroomPracticeReward(saveData, payload = {}, dateKey = getLocalDateKey()) {
  if (!saveData || typeof saveData !== 'object') {
    return {
      ok: false,
      coinsAwarded: 0,
      classroomCoinEarned: 0,
      dailyCap: CLASSROOM_DAILY_COIN_CAP,
      capReached: false,
      exploredInLabUpdated: false,
      newlyCompleted: []
    };
  }

  const daily = ensureDailyQuests(saveData, dateKey);
  const unit = payload && payload.unit ? String(payload.unit) : 'learn';
  const action = payload && payload.action ? String(payload.action) : 'explore';
  const count = clampInt(payload && payload.count != null ? payload.count : 1, 1, 10);

  if (!saveData.stats || typeof saveData.stats !== 'object') {
    saveData.stats = {};
  }
  const exploredInLabUpdated = unit === 'mul' && action === 'explore';
  if (exploredInLabUpdated) {
    saveData.stats.exploredInLab = true;
  }

  const prevEarned = clampInt(daily.classroomCoinEarned, 0, 999);
  const remainingCap = Math.max(0, CLASSROOM_DAILY_COIN_CAP - prevEarned);
  const coinsAwarded = Math.min(CLASSROOM_COINS_PER_PRACTICE, remainingCap);
  daily.classroomCoinEarned = prevEarned + coinsAwarded;

  saveData.starCoins = clampInt((saveData.starCoins || 0) + coinsAwarded, 0, 9999999);

  const newlyCompleted = recordDailyQuestProgress(
    saveData,
    { type: 'classroom_practice', unit, action, count },
    dateKey
  );

  return {
    ok: true,
    unit,
    action,
    coinsAwarded,
    classroomCoinEarned: daily.classroomCoinEarned,
    dailyCap: CLASSROOM_DAILY_COIN_CAP,
    capReached: daily.classroomCoinEarned >= CLASSROOM_DAILY_COIN_CAP,
    exploredInLabUpdated,
    newlyCompleted
  };
}

export { WARDROBE_ITEMS, TREEHOUSE_ITEMS, PARTNER_SNACKS, ISLANDS };
