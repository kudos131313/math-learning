/**
 * 數學冒險島存檔正規化、v1→v2 無縫遷移、跨海域進度、結構化救援案件與星星幣帳本（純函式領域模組）
 */
import {
  REALMS,
  ISLANDS,
  STAGES,
  BADGES,
  BUNNY_COSTUMES,
  MAX_RESCUE_CASES,
  LEGACY_COSTUME_MIGRATION_MAP,
  SKILL_CARDS,
  SKILL_TIER_THRESHOLDS,
  SKILL_TIER_COINS,
  toCanonicalStageId,
  toLegacyStageId,
  toCanonicalPartnerId,
  toLegacyPartnerId,
  getRealmById,
  getIslandsByRealm,
  getIslandById,
  getStageById,
  getStagesByRealm,
  getSkillCardById,
  BOSS_ALBUM_ENTRIES,
  STORY_ALBUM_ENTRIES,
  getStoryEntryById,
  DEFAULT_TREEHOUSE_SLOTS,
  DEFAULT_TREEHOUSE_UNLOCKED,
  getTreehouseItemById
} from './quest-data.js';
import { buildMulQuestion } from './multiplication.js';
import { randInt } from './number-text.js';
import { buildSunnyStageQuestions, rebuildCalcQuestionFromSnapshot } from './quest-calc-questions.js';
import { buildCloudStageQuestions, rebuildCloudQuestionFromSnapshot } from './quest-cloud-questions.js';

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function clampInt(val, min, max) {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function uniqueStrings(arr) {
  const seen = new Set();
  const out = [];
  if (!Array.isArray(arr)) return out;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === 'string' && item && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

export function getLocalDateKey(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* ---------------- 舊版 v1 存檔預設與相容正規化 ---------------- */
export function createDefaultSave() {
  return {
    version: 1,
    previewAll: false,
    activePartner: '',
    activeCostume: 'default',
    unlockedCostumes: { default: true },
    hasNewCostume: false,
    stageStars: {},
    gems: {},
    rescueQueue: [],
    badges: {},
    stats: {
      totalCorrect: 0,
      selfHealed: 0,
      maxCombo: 0,
      rescuedCount: 0,
      exploredInLab: false
    }
  };
}

export function normalizeSaveData(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return createDefaultSave();
  }
  const def = createDefaultSave();
  const stageStars = parsed.stageStars || {};
  let activePartner = typeof parsed.activePartner === 'string' ? parsed.activePartner : '';
  // 相容舊存檔：若尚未紀錄夥伴設定但已收服精靈，自動派最新收服的小精靈登場
  if (typeof parsed.activePartner !== 'string') {
    const mulIslands = getIslandsByRealm('mul');
    for (let i = mulIslands.length - 1; i >= 0; i--) {
      if (Number(stageStars[mulIslands[i].bossStageId] || 0) >= 1) {
        activePartner = mulIslands[i].id;
        break;
      }
    }
  }
  const unlockedCostumes = Object.assign({ default: true }, parsed.unlockedCostumes || {});
  const activeCostume =
    typeof parsed.activeCostume === 'string' && unlockedCostumes[parsed.activeCostume]
      ? parsed.activeCostume
      : 'default';

  return {
    version: 1,
    previewAll: Boolean(parsed.previewAll),
    activePartner,
    activeCostume,
    unlockedCostumes,
    hasNewCostume: Boolean(parsed.hasNewCostume),
    stageStars,
    gems: parsed.gems || {},
    rescueQueue: Array.isArray(parsed.rescueQueue) ? parsed.rescueQueue : [],
    badges: parsed.badges || {},
    stats: Object.assign({}, def.stats, parsed.stats || {})
  };
}

/* ---------------- 結構化救援案件（RescueCase）操作 ---------------- */
export function createMulRescueCase(a, b, now = Date.now()) {
  const safeA = clampInt(a, 1, 9);
  const safeB = clampInt(b, 1, 9);
  const dedupeKey = 'mul:' + safeA + 'x' + safeB;
  return {
    id: 'rc_' + now + '_' + safeA + 'x' + safeB,
    realm: 'mul',
    kind: 'mul',
    skillTag: 'mul_basic',
    dedupeKey,
    snapshot: { a: safeA, b: safeB, qType: 'standard' },
    createdAt: Number(now) || Date.now()
  };
}

export function createRescueCaseFromQuestion(q, now = Date.now()) {
  if (!q) return null;
  const realm = q.realm || 'mul';
  const kind = q.kind || 'mul';
  if (q.rescueSnapshot && q.rescueDedupeKey) {
    return {
      id: 'rc_' + now + '_' + Math.random().toString(36).slice(2, 6),
      realm,
      kind,
      skillTag: q.skillTag || 'general',
      dedupeKey: String(q.rescueDedupeKey),
      snapshot: Object.assign({}, q.rescueSnapshot),
      createdAt: Number(now) || Date.now()
    };
  }
  const a = clampInt(q.a || 3, 1, 9);
  const b = clampInt(q.b || 4, 1, 9);
  return createMulRescueCase(a, b, now);
}

function normalizeRescueCaseItem(item, idx, fallbackTime) {
  if (typeof item === 'string') {
    const m = /^(\d+)x(\d+)$/.exec(item.trim());
    if (!m) return null;
    return createMulRescueCase(Number(m[1]), Number(m[2]), fallbackTime + idx);
  }
  if (!isPlainObject(item) || !isPlainObject(item.snapshot)) return null;
  const kind = typeof item.kind === 'string' && item.kind ? item.kind : 'mul';
  const realm = typeof item.realm === 'string' && item.realm ? item.realm : 'mul';
  let dedupeKey = typeof item.dedupeKey === 'string' && item.dedupeKey ? item.dedupeKey : '';
  if (!dedupeKey && kind === 'mul' && item.snapshot.a && item.snapshot.b) {
    dedupeKey = 'mul:' + item.snapshot.a + 'x' + item.snapshot.b;
  }
  if (!dedupeKey) return null;
  return {
    id: typeof item.id === 'string' && item.id ? item.id : 'rc_' + (fallbackTime + idx) + '_' + dedupeKey,
    realm,
    kind,
    skillTag: typeof item.skillTag === 'string' && item.skillTag ? item.skillTag : 'mul_basic',
    dedupeKey,
    snapshot: Object.assign({}, item.snapshot),
    createdAt: clampInt(item.createdAt || fallbackTime + idx, 0, Number.MAX_SAFE_INTEGER)
  };
}

export function enqueueRescueCase(rescueCases, newCase, maxLen = MAX_RESCUE_CASES) {
  const list = Array.isArray(rescueCases) ? rescueCases.slice() : [];
  if (!newCase || !newCase.dedupeKey) return list;
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].dedupeKey === newCase.dedupeKey) {
      return list;
    }
  }
  list.push(newCase);
  if (list.length > maxLen) {
    return list.slice(list.length - maxLen);
  }
  return list;
}

export function removeRescueCase(rescueCases, matcher) {
  const list = Array.isArray(rescueCases) ? rescueCases : [];
  if (!matcher) return list.slice();
  return list.filter((item) => {
    if (!item) return false;
    if (typeof matcher === 'string') {
      return item.id !== matcher && item.dedupeKey !== matcher;
    }
    if (matcher.id && item.id === matcher.id) return false;
    if (matcher.dedupeKey && item.dedupeKey === matcher.dedupeKey) return false;
    return true;
  });
}

/* ---------------- 新版 v2 存檔預設、遷移與正規化 ---------------- */
function mapUnlockedCostumesToWardrobe(unlockedCostumes, activeCostume) {
  const hats = ['star_clip'];
  const outfits = ['none'];
  const wands = ['none'];

  Object.keys(unlockedCostumes || {}).forEach((cid) => {
    if (!unlockedCostumes[cid]) return;
    const mapped = LEGACY_COSTUME_MIGRATION_MAP[cid];
    if (!mapped) return;
    if (mapped.hat && hats.indexOf(mapped.hat) === -1) hats.push(mapped.hat);
    if (mapped.outfit && outfits.indexOf(mapped.outfit) === -1) outfits.push(mapped.outfit);
    if (mapped.wand && wands.indexOf(mapped.wand) === -1) wands.push(mapped.wand);
  });

  const activeMapped = LEGACY_COSTUME_MIGRATION_MAP[activeCostume] || LEGACY_COSTUME_MIGRATION_MAP.default;
  const active = {
    hat: activeMapped.hat && hats.indexOf(activeMapped.hat) !== -1 ? activeMapped.hat : 'star_clip',
    outfit: activeMapped.outfit && outfits.indexOf(activeMapped.outfit) !== -1 ? activeMapped.outfit : 'none',
    wand: activeMapped.wand && wands.indexOf(activeMapped.wand) !== -1 ? activeMapped.wand : 'none'
  };

  return {
    active,
    unlocked: {
      hat: hats,
      outfit: outfits,
      wand: wands
    }
  };
}

export function createDefaultSaveV2(now = new Date()) {
  const dateKey = getLocalDateKey(now);
  return {
    version: 2,
    previewAll: false,
    devMode: false,
    devBondLevel: 0,
    devSkillTier: '',
    starCoins: 0,
    activeRealm: 'mul',
    activeCostume: 'default',
    unlockedCostumes: { default: true },
    hasNewCostume: false,
    stageStars: {},
    gems: {},
    skillCodex: {},
    bossesDefeated: {},
    unlockedStories: {},
    rescueCases: [],
    badges: {},
    partners: {
      activeId: '',
      bonds: {}
    },
    wardrobe: {
      active: { hat: 'star_clip', outfit: 'none', wand: 'none' },
      unlocked: {
        hat: ['star_clip'],
        outfit: ['none'],
        wand: ['none']
      }
    },
    treehouse: {
      slots: Object.assign({}, DEFAULT_TREEHOUSE_SLOTS),
      unlockedItems: DEFAULT_TREEHOUSE_UNLOCKED.slice(),
      playmates: []
    },
    daily: {
      date: dateKey,
      tasks: [],
      replayRewardCount: 0,
      classroomCoinEarned: 0,
      stampedToday: false,
      allClearBonusClaimed: false
    },
    stampBook: {
      count: 0,
      round: 1
    },
    tower: {
      bestFloors: { all: 0, sunny: 0, mul: 0, word: 0 }
    },
    stats: {
      totalCorrect: 0,
      selfHealed: 0,
      maxCombo: 0,
      rescuedCount: 0,
      exploredInLab: false
    },
    migratedFromV1: false
  };
}

export function migrateV1ToV2(v1Data, now = new Date()) {
  const base = createDefaultSaveV2(now);
  if (!isPlainObject(v1Data)) return base;

  const v1Norm = normalizeSaveData(v1Data);
  const stageStars = {};
  Object.keys(v1Norm.stageStars || {}).forEach((k) => {
    const val = clampInt(v1Norm.stageStars[k], 0, 3);
    if (val > 0) {
      stageStars[toCanonicalStageId(k)] = val;
    }
  });

  const gems = {};
  Object.keys(v1Norm.gems || {}).forEach((k) => {
    if (v1Norm.gems[k]) gems[k] = true;
  });

  const badges = {};
  Object.keys(v1Norm.badges || {}).forEach((k) => {
    if (v1Norm.badges[k]) badges[k] = true;
  });

  const bonds = {};
  const bossesDefeated = {};
  ISLANDS.forEach((isl) => {
    const bossKey = toCanonicalStageId(isl.bossStageId);
    if ((stageStars[bossKey] || 0) >= 1) {
      bonds[isl.fullId] = { xp: 0, level: 1 };
      bossesDefeated[isl.fullId] = 1;
    }
  });

  let activePartnerId = '';
  if (v1Norm.activePartner) {
    const canonical = toCanonicalPartnerId(v1Norm.activePartner);
    if (bonds[canonical]) {
      activePartnerId = canonical;
    }
  }

  let rescueCases = [];
  const nowMs = now instanceof Date ? now.getTime() : Date.now();
  (v1Norm.rescueQueue || []).forEach((item, idx) => {
    const rc = normalizeRescueCaseItem(item, idx, nowMs);
    if (rc) rescueCases = enqueueRescueCase(rescueCases, rc, MAX_RESCUE_CASES);
  });

  const totalStars = Object.keys(stageStars).reduce((acc, k) => acc + stageStars[k], 0);
  const litGems = Object.keys(gems).length;
  const hasProgress = totalStars > 0 || litGems > 0 || (v1Norm.stats && v1Norm.stats.totalCorrect > 0);
  const welcomeCoins = hasProgress ? totalStars * 5 + 30 : 0;

  return Object.assign(base, {
    previewAll: Boolean(v1Norm.previewAll),
    starCoins: welcomeCoins,
    activeRealm: 'mul',
    activeCostume: v1Norm.activeCostume,
    unlockedCostumes: Object.assign({ default: true }, v1Norm.unlockedCostumes),
    hasNewCostume: Boolean(v1Norm.hasNewCostume),
    stageStars,
    gems,
    bossesDefeated,
    rescueCases,
    badges,
    partners: {
      activeId: activePartnerId,
      bonds
    },
    wardrobe: mapUnlockedCostumesToWardrobe(v1Norm.unlockedCostumes, v1Norm.activeCostume),
    treehouse: Object.assign({}, base.treehouse, {
      playmates: Object.keys(bonds).slice(0, 3)
    }),
    stats: Object.assign({}, base.stats, v1Norm.stats),
    migratedFromV1: true
  });
}

export function normalizeSaveDataV2(parsed, now = new Date()) {
  if (!isPlainObject(parsed)) {
    return createDefaultSaveV2(now);
  }
  if (parsed.version !== 2 && !isPlainObject(parsed.partners) && !isPlainObject(parsed.wardrobe)) {
    return migrateV1ToV2(parsed, now);
  }

  const def = createDefaultSaveV2(now);
  const todayKey = getLocalDateKey(now);

  const stageStars = {};
  if (isPlainObject(parsed.stageStars)) {
    Object.keys(parsed.stageStars).forEach((k) => {
      const val = clampInt(parsed.stageStars[k], 0, 3);
      if (val > 0) {
        stageStars[toCanonicalStageId(k)] = val;
      }
    });
  }

  const gems = {};
  if (isPlainObject(parsed.gems)) {
    Object.keys(parsed.gems).forEach((k) => {
      if (parsed.gems[k]) gems[k] = true;
    });
  }

  const badges = {};
  if (isPlainObject(parsed.badges)) {
    Object.keys(parsed.badges).forEach((k) => {
      if (parsed.badges[k]) badges[k] = true;
    });
  }

  const skillCodex = {};
  if (isPlainObject(parsed.skillCodex)) {
    Object.keys(parsed.skillCodex).forEach((k) => {
      if (isPlainObject(parsed.skillCodex[k])) {
        skillCodex[k] = { count: clampInt(parsed.skillCodex[k].count, 0, 999999) };
      }
    });
  }

  const bossesDefeated = {};
  if (isPlainObject(parsed.bossesDefeated)) {
    Object.keys(parsed.bossesDefeated).forEach((k) => {
      const c = clampInt(parsed.bossesDefeated[k], 0, 99999);
      if (c > 0) bossesDefeated[toCanonicalPartnerId(k)] = c;
    });
  }

  const unlockedStories = {};
  if (isPlainObject(parsed.unlockedStories)) {
    Object.keys(parsed.unlockedStories).forEach((k) => {
      if (parsed.unlockedStories[k]) unlockedStories[k] = true;
    });
  }

  let rescueCases = [];
  const rawRescue = Array.isArray(parsed.rescueCases)
    ? parsed.rescueCases
    : Array.isArray(parsed.rescueQueue)
      ? parsed.rescueQueue
      : [];
  const fallbackMs = now instanceof Date ? now.getTime() : Date.now();
  rawRescue.forEach((item, idx) => {
    const rc = normalizeRescueCaseItem(item, idx, fallbackMs);
    if (rc) rescueCases = enqueueRescueCase(rescueCases, rc, MAX_RESCUE_CASES);
  });

  const unlockedCostumes = Object.assign(
    { default: true },
    isPlainObject(parsed.unlockedCostumes) ? parsed.unlockedCostumes : {}
  );
  const activeCostume =
    typeof parsed.activeCostume === 'string' && unlockedCostumes[parsed.activeCostume]
      ? parsed.activeCostume
      : 'default';

  const mappedWardrobe = mapUnlockedCostumesToWardrobe(unlockedCostumes, activeCostume);
  const rawWardrobe = isPlainObject(parsed.wardrobe) ? parsed.wardrobe : {};
  const rawUnlockedW = isPlainObject(rawWardrobe.unlocked) ? rawWardrobe.unlocked : {};
  const unlockedHats = uniqueStrings(['star_clip', ...mappedWardrobe.unlocked.hat, ...(rawUnlockedW.hat || [])]);
  const unlockedOutfits = uniqueStrings(['none', ...mappedWardrobe.unlocked.outfit, ...(rawUnlockedW.outfit || [])]);
  const unlockedWands = uniqueStrings(['none', ...mappedWardrobe.unlocked.wand, ...(rawUnlockedW.wand || [])]);

  const isDevMode = Boolean(parsed.devMode);
  const devBondLevel = clampInt(parsed.devBondLevel || 0, 0, 3);
  const devSkillTier =
    parsed.devSkillTier === 'bronze' || parsed.devSkillTier === 'silver' || parsed.devSkillTier === 'gold'
      ? parsed.devSkillTier
      : '';

  const rawActiveW = isPlainObject(rawWardrobe.active) ? rawWardrobe.active : {};
  const activeHat =
    typeof rawActiveW.hat === 'string' && (isDevMode || unlockedHats.indexOf(rawActiveW.hat) !== -1)
      ? rawActiveW.hat
      : mappedWardrobe.active.hat;
  const activeOutfit =
    typeof rawActiveW.outfit === 'string' && (isDevMode || unlockedOutfits.indexOf(rawActiveW.outfit) !== -1)
      ? rawActiveW.outfit
      : mappedWardrobe.active.outfit;
  const activeWand =
    typeof rawActiveW.wand === 'string' && (isDevMode || unlockedWands.indexOf(rawActiveW.wand) !== -1)
      ? rawActiveW.wand
      : mappedWardrobe.active.wand;

  const rawPartners = isPlainObject(parsed.partners) ? parsed.partners : {};
  const bonds = {};
  if (isPlainObject(rawPartners.bonds)) {
    Object.keys(rawPartners.bonds).forEach((k) => {
      const pid = toCanonicalPartnerId(k);
      const b = rawPartners.bonds[k];
      if (isPlainObject(b)) {
        const xp = clampInt(b.xp, 0, 999999);
        const lv = xp >= 150 ? 3 : xp >= 50 ? 2 : 1;
        bonds[pid] = {
          xp,
          level: lv
        };
      }
    });
  }
  ISLANDS.forEach((isl) => {
    if ((stageStars[toCanonicalStageId(isl.bossStageId)] || 0) >= 1 && !bonds[isl.fullId]) {
      bonds[isl.fullId] = { xp: 0, level: 1 };
    }
  });
  let activePartnerId = typeof rawPartners.activeId === 'string' ? toCanonicalPartnerId(rawPartners.activeId) : '';
  if (activePartnerId) {
    const isl = getIslandById(activePartnerId);
    if (!isl || (!isDevMode && (stageStars[toCanonicalStageId(isl.bossStageId)] || 0) < 1)) {
      activePartnerId = '';
    }
  }

  const rawTreehouse = isPlainObject(parsed.treehouse) ? parsed.treehouse : {};
  const treehouseUnlocked = uniqueStrings([...def.treehouse.unlockedItems, ...(rawTreehouse.unlockedItems || [])]);
  const rawSlots = isPlainObject(rawTreehouse.slots) ? rawTreehouse.slots : {};
  const treehouseSlots = Object.assign({}, def.treehouse.slots);
  Object.keys(def.treehouse.slots).forEach((slotKey) => {
    const candidate = rawSlots[slotKey];
    const meta = typeof candidate === 'string' ? getTreehouseItemById(candidate) : null;
    if (meta && meta.slot === slotKey && (isDevMode || treehouseUnlocked.indexOf(candidate) !== -1)) {
      treehouseSlots[slotKey] = candidate;
    }
  });
  // 舊版 5 槽存檔無損遷移：將原先歸於角落擺飾的星願吊燈自動移回天花板槽位
  if (
    rawSlots.decor === 'star_lantern' &&
    !rawSlots.ceiling &&
    (isDevMode || treehouseUnlocked.indexOf('star_lantern') !== -1)
  ) {
    treehouseSlots.ceiling = 'star_lantern';
  }
  const treehousePlaymates = uniqueStrings(
    (rawTreehouse.playmates || []).map((pid) => toCanonicalPartnerId(pid))
  )
    .filter((pid) => {
      const isl = getIslandById(pid);
      return Boolean(
        isl &&
          isl.fullId === pid &&
          (isDevMode || (stageStars[toCanonicalStageId(isl.bossStageId)] || 0) >= 1)
      );
    })
    .slice(0, 3);

  const rawDaily = isPlainObject(parsed.daily) ? parsed.daily : {};
  const sameDay = rawDaily.date === todayKey;
  const daily = {
    date: todayKey,
    tasks: sameDay && Array.isArray(rawDaily.tasks) ? rawDaily.tasks : [],
    replayRewardCount: sameDay ? clampInt(rawDaily.replayRewardCount, 0, 999) : 0,
    classroomCoinEarned: sameDay ? clampInt(rawDaily.classroomCoinEarned, 0, 999) : 0,
    stampedToday: sameDay ? Boolean(rawDaily.stampedToday) : false,
    allClearBonusClaimed: sameDay ? Boolean(rawDaily.allClearBonusClaimed) : false
  };

  const rawStamp = isPlainObject(parsed.stampBook) ? parsed.stampBook : {};
  const stampBook = {
    count: clampInt(rawStamp.count, 0, 7),
    round: clampInt(rawStamp.round || 1, 1, 99999)
  };

  const rawTower = isPlainObject(parsed.tower) ? parsed.tower : {};
  const rawBest = isPlainObject(rawTower.bestFloors) ? rawTower.bestFloors : {};
  const tower = {
    bestFloors: {
      all: clampInt(rawBest.all, 0, 9999),
      sunny: clampInt(rawBest.sunny, 0, 9999),
      mul: clampInt(rawBest.mul, 0, 9999),
      word: clampInt(rawBest.word, 0, 9999)
    }
  };

  const rawStats = isPlainObject(parsed.stats) ? parsed.stats : {};
  const stats = {
    totalCorrect: clampInt(rawStats.totalCorrect, 0, 9999999),
    selfHealed: clampInt(rawStats.selfHealed, 0, 9999999),
    maxCombo: clampInt(rawStats.maxCombo, 0, 9999999),
    rescuedCount: clampInt(rawStats.rescuedCount, 0, 9999999),
    exploredInLab: Boolean(rawStats.exploredInLab)
  };

  const realmValid = REALMS.some((r) => r.id === parsed.activeRealm);

  const normalized = {
    version: 2,
    previewAll: Boolean(parsed.previewAll),
    devMode: isDevMode,
    devBondLevel,
    devSkillTier,
    starCoins: clampInt(parsed.starCoins, 0, 9999999),
    activeRealm: realmValid ? parsed.activeRealm : 'mul',
    activeCostume,
    unlockedCostumes,
    hasNewCostume: Boolean(parsed.hasNewCostume),
    stageStars,
    gems,
    skillCodex,
    bossesDefeated,
    unlockedStories,
    rescueCases,
    badges,
    partners: {
      activeId: activePartnerId,
      bonds
    },
    wardrobe: {
      active: { hat: activeHat, outfit: activeOutfit, wand: activeWand },
      unlocked: {
        hat: unlockedHats,
        outfit: unlockedOutfits,
        wand: unlockedWands
      }
    },
    treehouse: {
      slots: treehouseSlots,
      unlockedItems: treehouseUnlocked,
      playmates: treehousePlaymates
    },
    daily,
    stampBook,
    tower,
    stats,
    migratedFromV1: Boolean(parsed.migratedFromV1)
  };
  syncAlbumFromProgress(normalized);
  if (Array.isArray(normalized.daily.tasks) && normalized.daily.tasks.length > 0) {
    const hasIneligibleUnfinished = normalized.daily.tasks.some((t) => {
      if (!t || typeof t !== 'object') return false;
      const doneOrClaimed = Boolean(t.claimed) || Number(t.progress || 0) >= Number(t.target || 1);
      if (doneOrClaimed) return false;
      if (t.realmFilter && t.realmFilter !== 'any' && !isRealmUnlocked(t.realmFilter, normalized)) {
        return true;
      }
      if (
        (t.requires === 'tower' ||
          t.metric === 'tower_floor_5' ||
          t.id === 'c_tower5' ||
          (typeof t.id === 'string' && t.id.endsWith('_c_tower5'))) &&
        !isTowerUnlocked(normalized)
      ) {
        return true;
      }
      return false;
    });
    const allUntouched = normalized.daily.tasks.every(
      (t) => !t || (!t.claimed && Number(t.progress || 0) <= 0)
    );
    if (hasIneligibleUnfinished && allUntouched) {
      normalized.daily.tasks = [];
    }
  }
  return normalized;
}

/* ---------------- 跨海域星數讀寫、解鎖判定與進度查詢（相容 v1 與 v2） ---------------- */
export function getStageStars(saveData, stageId) {
  const stars = (saveData && saveData.stageStars) || {};
  const canonical = toCanonicalStageId(stageId);
  const legacy = toLegacyStageId(stageId);
  return Math.max(Number(stars[canonical] || 0), Number(stars[legacy] || 0));
}

export function setStageStars(saveData, stageId, stars) {
  if (!saveData) return 0;
  if (!saveData.stageStars) saveData.stageStars = {};
  const clamped = clampInt(stars, 0, 3);
  const key = saveData.version === 2 ? toCanonicalStageId(stageId) : stageId;
  saveData.stageStars[key] = clamped;
  return clamped;
}

export function countTotalStars(saveData, realmId) {
  let total = 0;
  const list = realmId ? getStagesByRealm(realmId) : STAGES;
  list.forEach((s) => {
    total += getStageStars(saveData, s.stageKey || s.id);
  });
  return total;
}

export function countLitGems(saveData) {
  const gems = (saveData && saveData.gems) || {};
  return Object.keys(gems).filter((k) => gems[k]).length;
}

export function countUnlockedSprites(saveData, realmId, { ignoreDevMode = false } = {}) {
  let cnt = 0;
  ISLANDS.forEach((isl) => {
    if (realmId && isl.realmId !== realmId) return;
    if ((!ignoreDevMode && saveData && saveData.devMode) || getStageStars(saveData, isl.bossStageId) >= 1) cnt++;
  });
  return cnt;
}

export function isTowerUnlocked(saveData, { ignoreDevMode = false } = {}) {
  if (!saveData) return false;
  if (saveData.previewAll) return true;
  if (!ignoreDevMode && saveData.devMode) return true;
  return countUnlockedSprites(saveData, null, { ignoreDevMode: true }) >= 1;
}

export function isRealmUnlocked(realmId, saveData) {
  if (saveData && (saveData.previewAll || saveData.devMode)) return true;
  const realm = getRealmById(realmId);
  if (!realm || realm.unlockMode === 'initial') return true;
  const rule = realm.unlockRule || {};
  const minStars = Number(rule.minStars || 15);
  const minBosses = Number(rule.minBosses || 2);
  return countTotalStars(saveData) >= minStars || countUnlockedSprites(saveData, null, { ignoreDevMode: true }) >= minBosses;
}

export function getRealmUnlockProgress(realmId, saveData) {
  const realm = getRealmById(realmId);
  const rule = (realm && realm.unlockRule) || { minStars: 15, minBosses: 2 };
  const stars = countTotalStars(saveData);
  const bosses = countUnlockedSprites(saveData, null, { ignoreDevMode: true });
  const minStars = Number(rule.minStars || 15);
  const minBosses = Number(rule.minBosses || 2);
  return {
    unlocked: isRealmUnlocked(realmId, saveData),
    stars,
    minStars,
    remainingStars: Math.max(0, minStars - stars),
    bosses,
    minBosses,
    remainingBosses: Math.max(0, minBosses - bosses)
  };
}

export function isStageUnlocked(stageId, saveData) {
  const st = getStageById(stageId);
  if (!st) return false;
  if (saveData && (saveData.previewAll || saveData.devMode)) return true;
  if (!isRealmUnlocked(st.realmId, saveData)) return false;

  const realmStages = getStagesByRealm(st.realmId);
  for (let i = 0; i < realmStages.length; i++) {
    if (realmStages[i].id === st.id || realmStages[i].stageKey === st.stageKey) {
      if (i === 0) return true;
      return getStageStars(saveData, realmStages[i - 1].stageKey || realmStages[i - 1].id) >= 1;
    }
  }
  return false;
}

export function getNextPlayableStageId(saveData, realmId = 'mul') {
  const list = getStagesByRealm(realmId);
  if (list.length === 0) return STAGES[0].id;
  for (let i = 0; i < list.length; i++) {
    if (getStageStars(saveData, list[i].stageKey || list[i].id) === 0) {
      return list[i].id;
    }
  }
  return list[list.length - 1].id;
}

export function getActivePartnerId(saveData) {
  if (!saveData) return '';
  let raw = '';
  if (saveData.partners && typeof saveData.partners.activeId === 'string') {
    raw = saveData.partners.activeId;
  } else if (typeof saveData.activePartner === 'string') {
    raw = saveData.activePartner;
  }
  if (!raw) return '';
  const canonical = toCanonicalPartnerId(raw);
  const isl = getIslandById(canonical);
  if (!isl || isl.fullId !== canonical) return '';
  return saveData.devMode || getStageStars(saveData, isl.bossStageId) >= 1 ? canonical : '';
}

export function getActiveCostumeId(saveData) {
  const id = (saveData && saveData.activeCostume) || 'default';
  if (saveData && saveData.unlockedCostumes && saveData.unlockedCostumes[id]) return id;
  return 'default';
}

export function countUnlockedCostumes(saveData) {
  let cnt = 0;
  BUNNY_COSTUMES.forEach((c) => {
    if (saveData && saveData.unlockedCostumes && saveData.unlockedCostumes[c.id]) cnt++;
  });
  return cnt;
}

export function getCostumeProgress(costume, saveData) {
  const stars = countTotalStars(saveData);
  const gems = countLitGems(saveData);
  const unlocked = Boolean(saveData && saveData.unlockedCostumes && saveData.unlockedCostumes[costume.id]);
  if (costume.unlockType === 'free') {
    return { current: 1, target: 1, pct: 100, unlocked: true, unit: '' };
  }
  const cur = costume.unlockType === 'stars' ? stars : gems;
  const tgt = costume.target || 1;
  const pct = Math.min(100, Math.round((cur / tgt) * 100));
  const unit = costume.unlockType === 'stars' ? '顆星星' : '顆寶石';
  return { current: cur, target: tgt, pct, unlocked: unlocked || cur >= tgt, unit };
}

export function evaluateUnlockedBadges(saveData) {
  const newlyUnlocked = [];
  const badges = (saveData && saveData.badges) || {};
  const stats = (saveData && saveData.stats) || {};

  function check(id, cond) {
    if (cond && !badges[id]) {
      for (let i = 0; i < BADGES.length; i++) {
        if (BADGES[i].id === id) newlyUnlocked.push(BADGES[i]);
      }
    }
  }

  check('first_clear', countTotalStars(saveData) >= 1);
  check('three_stars', STAGES.some((s) => getStageStars(saveData, s.stageKey || s.id) === 3));
  check('combo_5', (stats.maxCombo || 0) >= 5);
  check('never_give_up', (stats.selfHealed || 0) >= 5);
  check('rescue_hero', (stats.rescuedCount || 0) >= 1);
  check('lab_explorer', Boolean(stats.exploredInLab));
  check('island_3_boss', getStageStars(saveData, '3-3') >= 1);
  check('island_4_boss', getStageStars(saveData, '4-3') >= 1);
  check('master_castle', getStageStars(saveData, '5-3') >= 1);
  check('gems_81', countLitGems(saveData) >= 81);

  return newlyUnlocked;
}

export function evaluateUnlockedCostumes(saveData) {
  const stars = countTotalStars(saveData);
  const gems = countLitGems(saveData);
  const unlockedMap = (saveData && saveData.unlockedCostumes) || {};
  const newlyUnlocked = [];

  BUNNY_COSTUMES.forEach((c) => {
    if (unlockedMap[c.id]) return;
    const ok =
      c.unlockType === 'free' ||
      (c.unlockType === 'stars' && stars >= c.target) ||
      (c.unlockType === 'gems' && gems >= c.target);
    if (ok) {
      newlyUnlocked.push(c);
    }
  });
  return newlyUnlocked;
}

/* ---------------- 數學技能圖鑑（Skill Codex）累積與銅／銀／金升階純函式 ---------------- */
export function getSkillTier(count) {
  const c = Math.max(0, Math.floor(Number(count) || 0));
  if (c >= SKILL_TIER_THRESHOLDS.gold) return 'gold';
  if (c >= SKILL_TIER_THRESHOLDS.silver) return 'silver';
  if (c >= SKILL_TIER_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

export function getSkillCardProgress(cardId, saveData, { ignoreDevMode = false } = {}) {
  const raw =
    saveData && saveData.skillCodex && saveData.skillCodex[cardId]
      ? saveData.skillCodex[cardId].count
      : 0;
  const realCount = Math.max(0, Math.floor(Number(raw) || 0));
  const realTier = getSkillTier(realCount);

  let count = realCount;
  let tier = realTier;
  let devOverridden = false;
  if (!ignoreDevMode && saveData && saveData.devMode && saveData.devSkillTier) {
    if (saveData.devSkillTier === 'bronze' || saveData.devSkillTier === 'silver' || saveData.devSkillTier === 'gold') {
      tier = saveData.devSkillTier;
      count = Math.max(realCount, SKILL_TIER_THRESHOLDS[tier]);
      devOverridden = tier !== realTier;
    }
  }

  let nextTier = 'bronze';
  let nextTarget = SKILL_TIER_THRESHOLDS.bronze;
  if (tier === 'bronze') {
    nextTier = 'silver';
    nextTarget = SKILL_TIER_THRESHOLDS.silver;
  } else if (tier === 'silver') {
    nextTier = 'gold';
    nextTarget = SKILL_TIER_THRESHOLDS.gold;
  } else if (tier === 'gold') {
    nextTier = 'gold';
    nextTarget = SKILL_TIER_THRESHOLDS.gold;
  }
  const pct = tier === 'gold' ? 100 : Math.min(100, Math.round((count / nextTarget) * 100));
  return {
    count,
    tier,
    realCount,
    realTier,
    devOverridden,
    nextTier,
    nextTarget,
    pct,
    isMax: tier === 'gold'
  };
}

export function recordSkillCodexHit(saveData, skillTag) {
  const card = getSkillCardById(skillTag);
  if (!saveData || !card) {
    return {
      upgraded: false,
      card: null,
      prevTier: 'none',
      newTier: 'none',
      bonusCoins: 0,
      count: 0
    };
  }
  if (!saveData.skillCodex || typeof saveData.skillCodex !== 'object') {
    saveData.skillCodex = {};
  }
  const prevCount = Math.max(
    0,
    Math.floor(Number((saveData.skillCodex[skillTag] && saveData.skillCodex[skillTag].count) || 0))
  );
  const prevTier = getSkillTier(prevCount);
  const nextCount = prevCount + 1;
  saveData.skillCodex[skillTag] = { count: nextCount };
  const newTier = getSkillTier(nextCount);
  const upgraded = newTier !== prevTier;
  const bonusCoins = upgraded ? Number(SKILL_TIER_COINS[newTier] || 0) : 0;

  return {
    upgraded,
    card,
    prevTier,
    newTier,
    bonusCoins,
    count: nextCount
  };
}

export function countUnlockedSkillCards(saveData) {
  let cnt = 0;
  SKILL_CARDS.forEach((c) => {
    if (getSkillCardProgress(c.id, saveData).tier !== 'none') cnt++;
  });
  return cnt;
}

/* ---------------- 星星幣（StarCoin）獎勵結算純函式 ---------------- */
export function calculateStageCoinReward({
  stage,
  prevStars = 0,
  newStars = 0,
  isRescueMode = false,
  rescuedCount = 0,
  isGemHuntMode = false,
  dailyReplayCount = 0
}) {
  if (isRescueMode) {
    const count = Math.max(0, Math.floor(Number(rescuedCount) || 0));
    return {
      coins: count * 8,
      reason: 'rescue',
      consumesDailyReplay: false
    };
  }
  if (isGemHuntMode) {
    const withinCap = dailyReplayCount < 3;
    return {
      coins: withinCap ? 15 : 3,
      reason: 'gem_hunt',
      consumesDailyReplay: withinCap
    };
  }

  const table = stage && stage.isBoss ? { 0: 0, 1: 45, 2: 65, 3: 90 } : { 0: 0, 1: 25, 2: 35, 3: 50 };
  const safePrev = clampInt(prevStars, 0, 3);
  const safeNew = clampInt(newStars, 0, 3);

  if (safeNew > safePrev) {
    return {
      coins: Math.max(0, table[safeNew] - table[safePrev]),
      reason: safePrev === 0 ? 'first_clear' : 'star_upgrade',
      consumesDailyReplay: false
    };
  }

  const withinCap = dailyReplayCount < 3;
  return {
    coins: withinCap ? 15 : 3,
    reason: withinCap ? 'daily_replay' : 'practice_bonus',
    consumesDailyReplay: withinCap
  };
}

/* ---------------- 備份 JSON 序列化與匯入檢核 ---------------- */
export function serializeBackupPayload(saveData, now = new Date()) {
  const safeNow = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const normalized = normalizeSaveDataV2(saveData, safeNow);
  return JSON.stringify(
    {
      app: 'math-adventure-island',
      schemaVersion: 2,
      exportedAt: safeNow.toISOString(),
      save: normalized
    },
    null,
    2
  );
}

export function parseAndValidateBackupJson(rawText, now = new Date()) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { ok: false, error: '備份檔案內容是空的，請重新選擇有效的備份 JSON 檔案。' };
  }
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return { ok: false, error: '檔案不是合法的 JSON 格式，請確認選擇正確的冒險備份檔。' };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: '備份檔案結構不正確，無法識別冒險進度。' };
  }

  let candidate = parsed;
  if ('app' in parsed || 'schemaVersion' in parsed) {
    if (parsed.app !== 'math-adventure-island' || !isPlainObject(parsed.save)) {
      return { ok: false, error: '這份檔案不是數學冒險島的進度備份檔，未修改目前紀錄。' };
    }
    candidate = parsed.save;
  }

  const hasKnownShape =
    isPlainObject(candidate.stageStars) ||
    isPlainObject(candidate.gems) ||
    typeof candidate.starCoins === 'number' ||
    candidate.version === 1 ||
    candidate.version === 2;

  if (!hasKnownShape) {
    return { ok: false, error: '檔案缺少冒險進度欄位，無法匯入。' };
  }
  if ('stageStars' in candidate && !isPlainObject(candidate.stageStars)) {
    return { ok: false, error: '備份檔的關卡星星格式異常，匯入已取消。' };
  }
  if ('gems' in candidate && !isPlainObject(candidate.gems)) {
    return { ok: false, error: '備份檔的寶石格式異常，匯入已取消。' };
  }

  const normalized = normalizeSaveDataV2(candidate, now);
  return {
    ok: true,
    save: normalized,
    summary: {
      stars: countTotalStars(normalized),
      gems: countLitGems(normalized),
      starCoins: normalized.starCoins,
      sprites: countUnlockedSprites(normalized)
    }
  };
}

/* ---------------- 題庫生成與加權抽題 ---------------- */
export function weightedSortPairs(pairs, weightFn, randomFn = Math.random) {
  return pairs
    .map((p) => {
      const w = Math.max(0.001, weightFn(p));
      const u = Math.max(1e-9, randomFn());
      return {
        pair: p,
        key: Math.pow(u, 1 / w)
      };
    })
    .sort((x, y) => y.key - x.key)
    .map((x) => x.pair);
}

export function getStagePairWeight(pair, isLit) {
  const hasOne = pair.a === 1 || pair.b === 1;
  const bothOne = pair.a === 1 && pair.b === 1;
  if (!hasOne) {
    return isLit ? 1.0 : 3.0;
  }
  if (bothOne) {
    return isLit ? 0.03 : 0.12;
  }
  return isLit ? 0.06 : 0.25;
}

export function buildStageQuestions(stage, gemsMap = {}, options = {}) {
  if (stage && stage.realmId === 'sunny') {
    return buildSunnyStageQuestions(stage, options);
  }
  if (stage && stage.realmId === 'cloud') {
    return buildCloudStageQuestions(stage, options);
  }

  const randIntFn = options.randIntFn || randInt;
  const randomFn = options.randomFn || Math.random;
  const candidatePairs = [];
  (stage.tables || []).forEach((a) => {
    for (let b = 1; b <= 9; b++) {
      const isLit = Boolean(gemsMap[a + 'x' + b]);
      candidatePairs.push({ a, b, isLit });
    }
  });

  const poolPairs = weightedSortPairs(
    candidatePairs,
    (p) => getStagePairWeight(p, p.isLit),
    randomFn
  );

  const orderedTypes = [];
  for (let t = 0; t < stage.count; t++) {
    orderedTypes.push(stage.qTypes[t % stage.qTypes.length]);
  }
  if (stage.isBoss && stage.qTypes.length > 1) {
    orderedTypes.sort((t1, t2) => {
      const w1 = t1 === 'standard' ? 1 : 0;
      const w2 = t2 === 'standard' ? 1 : 0;
      return w1 - w2;
    });
  }

  const selected = [];
  for (let i = 0; i < stage.count; i++) {
    const pair = poolPairs[i % poolPairs.length];
    const qType = orderedTypes[i];
    let mode = stage.inputMode;
    if (mode === 'mixed') mode = i < Math.ceil(stage.count / 2) ? 'choice' : 'keypad';

    const effectiveType =
      qType === 'story_choice' || (mode === 'choice' && qType === 'concept') ? 'standard' : qType;
    const q = buildMulQuestion(pair.a, pair.b, effectiveType, randIntFn);

    let skillTag = 'mul_basic';
    if (effectiveType === 'commutative') skillTag = 'mul_commutative';
    else if (effectiveType === 'missing_a' || effectiveType === 'missing_b') skillTag = 'mul_missing';
    else if (effectiveType === 'concept') skillTag = 'mul_concept';

    if (qType === 'story_choice' && effectiveType === 'standard' && pair.b >= 2 && pair.b <= 7) {
      const icons = ['🍎', '🍪', '✏️', '🌟', '🎈'];
      const units = ['盤', '袋', '盒', '排', '串'];
      const idx = randIntFn(0, icons.length - 1);
      q.badge = '情境乘法冒險';
      skillTag = 'word_mul_life';
      q.storyHtml =
        icons[idx] +
        ' 每' +
        units[idx] +
        '有 <b>' +
        q.a +
        '</b> 個，共有 <b>' +
        q.b +
        '</b> ' +
        units[idx] +
        '，合起來有幾個？';
    }
    q.realm = stage.realmId || 'mul';
    q.kind = 'mul';
    q.skillTag = skillTag;
    q.uiMode = mode;
    q.rescueDedupeKey = 'mul:' + q.a + 'x' + q.b;
    q.rescueSnapshot = { a: q.a, b: q.b, qType: 'standard' };
    selected.push(q);
  }
  return selected;
}

export function buildRescueQuestions(rescueList, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  return (rescueList || [])
    .slice(0, 6)
    .map((entry) => {
      if (typeof entry === 'string') {
        const parts = entry.split('x');
        const a = Number(parts[0]) || 3;
        const b = Number(parts[1]) || 4;
        const q = buildMulQuestion(a, b, 'standard', randIntFn);
        q.realm = 'mul';
        q.kind = 'mul';
        q.uiMode = 'keypad';
        q.badge = '🆘 求救小精靈特訓';
        q.rescueKey = entry;
        q.rescueDedupeKey = 'mul:' + a + 'x' + b;
        return q;
      }
      if (!isPlainObject(entry) || !isPlainObject(entry.snapshot)) return null;
      if (
        entry.realm === 'cloud' ||
        entry.kind === 'seq' ||
        entry.kind === 'place_value' ||
        entry.kind === 'word_two_step'
      ) {
        return rebuildCloudQuestionFromSnapshot(entry);
      }
      if (
        entry.realm === 'sunny' ||
        entry.kind === 'add' ||
        entry.kind === 'sub' ||
        entry.kind === 'calc_missing' ||
        entry.kind === 'word_single'
      ) {
        return rebuildCalcQuestionFromSnapshot(entry);
      }
      const a = Number(entry.snapshot.a) || 3;
      const b = Number(entry.snapshot.b) || 4;
      const q = buildMulQuestion(a, b, entry.snapshot.qType || 'standard', randIntFn);
      q.realm = entry.realm || 'mul';
      q.kind = entry.kind || 'mul';
      q.uiMode = 'keypad';
      q.badge = '🆘 求救小精靈特訓';
      q.rescueCaseId = entry.id;
      q.rescueDedupeKey = entry.dedupeKey;
      q.rescueKey = a + 'x' + b;
      return q;
    })
    .filter(Boolean);
}

export function getCollectableUnlitGems(saveData) {
  const allowedTables = {};
  STAGES.forEach((st) => {
    if (isStageUnlocked(st.stageKey || st.id, saveData)) {
      (st.tables || []).forEach((t) => {
        allowedTables[t] = true;
      });
    }
  });
  const list = [];
  const gems = (saveData && saveData.gems) || {};
  for (let a = 1; a <= 9; a++) {
    if (!allowedTables[a]) continue;
    for (let b = 1; b <= 9; b++) {
      if (!gems[a + 'x' + b]) {
        list.push({ a, b });
      }
    }
  }
  return list;
}

export function buildGemHuntQuestions(pairs, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  const randomFn = options.randomFn || Math.random;
  const sorted = weightedSortPairs(
    pairs,
    (p) => {
      if (p.a === 1 && p.b === 1) return 0.08;
      if (p.a === 1 || p.b === 1) return 0.2;
      return 1.0;
    },
    randomFn
  );
  return sorted.slice(0, 6).map((p) => {
    const q = buildMulQuestion(p.a, p.b, 'standard', randIntFn);
    q.realm = 'mul';
    q.kind = 'mul';
    q.uiMode = 'keypad';
    q.badge = '💎 未點亮寶石特訓';
    q.rescueDedupeKey = 'mul:' + q.a + 'x' + q.b;
    q.rescueSnapshot = { a: q.a, b: q.b, qType: 'standard' };
    return q;
  });
}

/* ---------------- Phase 4：魔王與故事收集冊、教室精準回流解析 ---------------- */
export function syncAlbumFromProgress(saveData) {
  if (!isPlainObject(saveData)) return { bossesAdded: 0, storiesAdded: 0 };
  if (!isPlainObject(saveData.bossesDefeated)) saveData.bossesDefeated = {};
  if (!isPlainObject(saveData.unlockedStories)) saveData.unlockedStories = {};

  let bossesAdded = 0;
  let storiesAdded = 0;

  ISLANDS.forEach((isl) => {
    if (getStageStars(saveData, isl.bossStageId) >= 1 && !(Number(saveData.bossesDefeated[isl.fullId]) > 0)) {
      saveData.bossesDefeated[isl.fullId] = 1;
      bossesAdded++;
    }
  });

  STORY_ALBUM_ENTRIES.forEach((entry) => {
    if (entry.sampleStageId && getStageStars(saveData, entry.sampleStageId) >= 1 && !saveData.unlockedStories[entry.id]) {
      saveData.unlockedStories[entry.id] = true;
      storiesAdded++;
    }
  });

  return { bossesAdded, storiesAdded };
}

export function resolveStoryIdForQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  if (q.storyId && getStoryEntryById(q.storyId)) return q.storyId;

  const skill = String(q.skillTag || q.skillId || '');
  const kind = String(q.kind || '');
  const realm = String(q.realm || '');
  const text = String(q.storyHtml || q.spokenPrompt || q.prompt || q.word || '');
  const a = Number(q.a) || 0;
  const b = Number(q.b) || 0;
  const ans = Number(q.answer ?? q.expected ?? q.ans ?? (q.slots && q.slots[0] && q.slots[0].expected)) || 0;

  if (
    realm === 'cloud' ||
    kind === 'seq' ||
    kind === 'place_value' ||
    kind === 'word_two_step' ||
    skill.startsWith('seq_') ||
    skill.startsWith('pv_') ||
    skill.startsWith('word_mul_')
  ) {
    if (kind === 'word_two_step' || skill.startsWith('word_mul_') || q.twoStepModel) {
      if (
        (q.twoStepModel && q.twoStepModel.step2Op === 'sub') ||
        skill.includes('sub') ||
        /找回|剩下|還剩|少/.test(text)
      ) {
        return 'patisserie_sweet_change';
      }
      return 'park_ferris_popcorn';
    }
    if (kind === 'place_value' || skill.startsWith('pv_')) return 'vault_gold_blocks';
    if (kind === 'seq' || skill.startsWith('seq_')) return 'station_cloud_train';
    return 'station_cloud_train';
  }

  if (
    realm === 'sunny' ||
    kind === 'add' ||
    kind === 'sub' ||
    kind === 'calc_missing' ||
    kind === 'word_single' ||
    skill.startsWith('add_') ||
    skill.startsWith('sub_') ||
    skill.startsWith('word_buy') ||
    skill === 'word_compare' ||
    skill === 'calc_missing'
  ) {
    if (skill === 'word_compare' || (q.helperSpec && q.helperSpec.type === 'bar_diagram') || /誰|比.*多|比.*少/.test(text)) {
      return 'bay_compare_scale';
    }
    if (
      skill === 'add_3d' ||
      skill === 'sub_3d' ||
      skill === 'sub_across_zero' ||
      a >= 100 ||
      b >= 100 ||
      ans >= 100
    ) {
      return 'market_big_gift';
    }
    if (skill === 'word_buy_change' || /找回|找錢|零錢|付款|元/.test(text)) {
      return 'bay_change_shop';
    }
    if (
      skill === 'add_2d_carry' ||
      ((q.op === 'add' || q.op === '+') && (((a % 10) + (b % 10)) >= 10)) ||
      /糖|顆|草莓/.test(text)
    ) {
      return 'candy_shopping';
    }
    return 'bakery_morning';
  }

  if (q.qType === 'commutative' || skill === 'mul_commutative' || a === 6 || b === 6) {
    return 'garden_flower_symmetry';
  }
  if ((a >= 3 && a <= 4) || (b >= 3 && b <= 4) || skill === 'mul_missing') {
    return 'workshop_wheels_legs';
  }
  return 'forest_snack_groups';
}

export function unlockStoryForQuestion(saveData, q) {
  if (!saveData || !q) return { unlocked: false, story: null };
  if (!isPlainObject(saveData.unlockedStories)) saveData.unlockedStories = {};
  const storyId = resolveStoryIdForQuestion(q);
  if (!storyId) return { unlocked: false, story: null };
  const story = getStoryEntryById(storyId);
  if (!story) return { unlocked: false, story: null };
  if (saveData.unlockedStories[storyId]) {
    return { unlocked: false, story };
  }
  saveData.unlockedStories[storyId] = true;
  return { unlocked: true, story };
}

export function countDefeatedBosses(saveData, { ignoreDevMode = false } = {}) {
  if (!saveData) return 0;
  if (saveData.devMode && !ignoreDevMode) return BOSS_ALBUM_ENTRIES.length;
  const map = isPlainObject(saveData.bossesDefeated) ? saveData.bossesDefeated : {};
  let cnt = 0;
  BOSS_ALBUM_ENTRIES.forEach((entry) => {
    if (Number(map[entry.id]) > 0 || getStageStars(saveData, entry.bossStageId) >= 1) {
      cnt++;
    }
  });
  return cnt;
}

export function countUnlockedStories(saveData, { ignoreDevMode = false } = {}) {
  if (!saveData) return 0;
  if (saveData.devMode && !ignoreDevMode) return STORY_ALBUM_ENTRIES.length;
  const map = isPlainObject(saveData.unlockedStories) ? saveData.unlockedStories : {};
  let cnt = 0;
  STORY_ALBUM_ENTRIES.forEach((entry) => {
    if (map[entry.id]) cnt++;
  });
  return cnt;
}

export function resolveClassroomTargetForQuestion(q) {
  if (!q || typeof q !== 'object') {
    return {
      unit: 'mul',
      subTab: 'learn',
      label: '回到九九乘法探索台看陣列積木',
      row: 3,
      col: 4
    };
  }
  const kind = String(q.kind || '');
  const skill = String(q.skillTag || q.skillId || '');
  const realm = String(q.realm || '');

  if (kind === 'place_value' || skill.startsWith('pv_')) {
    const pv = q.placeValueModel || q.helperSpec || {};
    const composedFromBlocks =
      (Number(pv.h || 0) * 100) + (Number(pv.t || 0) * 10) + Number(pv.o || 0);
    const slotExpected = q.slots && q.slots[0] && q.slots[0].expected;
    const rawNum = Number(
      q.expected ?? slotExpected ?? q.targetNum ?? (composedFromBlocks > 0 ? composedFromBlocks : 305)
    );
    const presetNum = Number.isFinite(rawNum) && rawNum >= 10 && rawNum <= 9999 ? Math.floor(rawNum) : 305;
    return {
      unit: 'learn',
      subTab: 'learn',
      label: '回到位值探索台看積木排數字',
      presetNum
    };
  }

  if (kind === 'seq' || skill.startsWith('seq_')) {
    const seqModel = q.sequenceModel || q.helperSpec || {};
    const nums = Array.isArray(seqModel.numbers) ? seqModel.numbers : [];
    const startNum = Number.isFinite(Number(nums[0]))
      ? Math.max(0, Math.min(900, Math.floor(Number(nums[0]))))
      : 185;
    const step = Number.isFinite(Number(seqModel.step)) && Number(seqModel.step) !== 0
      ? Math.floor(Number(seqModel.step))
      : 10;
    return {
      unit: 'seq',
      subTab: 'learn',
      label: '回到跳數列車教室看數字節奏',
      startNum,
      step
    };
  }

  if (
    realm === 'sunny' ||
    kind === 'add' ||
    kind === 'sub' ||
    kind === 'calc_missing' ||
    kind === 'word_single' ||
    skill.startsWith('add_') ||
    skill.startsWith('sub_') ||
    skill === 'calc_missing' ||
    skill.startsWith('word_buy') ||
    skill === 'word_compare'
  ) {
    const eq = q.equationModel || {};
    const hSpec = q.helperSpec || {};
    const rawOp = q.op || eq.op || hSpec.op || '+';
    const op = rawOp === 'sub' || rawOp === '-' ? '-' : '+';

    let rawA = q.a ?? hSpec.a ?? eq.left;
    let rawB = q.b ?? hSpec.b ?? eq.right;
    if (kind === 'calc_missing') {
      if (rawA == null || rawB == null) {
        const cVal = Number(hSpec.c ?? eq.result ?? 60);
        const knownVal = Number(rawA ?? rawB ?? hSpec.a ?? hSpec.b ?? 24);
        rawA = op === '-' ? Math.max(cVal, knownVal) : Math.max(knownVal, cVal - knownVal);
        rawB = op === '-' ? Math.min(cVal, knownVal) : Math.min(knownVal, Math.abs(cVal - knownVal));
      }
    }

    let a = Number.isFinite(Number(rawA)) ? Math.floor(Number(rawA)) : 48;
    let b = Number.isFinite(Number(rawB)) ? Math.floor(Number(rawB)) : 25;
    a = Math.max(10, Math.min(999, a));
    b = Math.max(1, Math.min(999, b));
    if (op === '-' && a < b) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    return {
      unit: 'calc',
      subTab: 'learn',
      label: '回到直式加減積木教室看進退位',
      op,
      a,
      b
    };
  }

  // 乘法海域或兩步驟應用題優先帶回九九乘法探索台看「幾個幾」積木陣列
  const rawA = Number(q.a);
  const rawB = Number(q.b);
  const row = Number.isFinite(rawA) && rawA >= 1 && rawA <= 9 ? Math.floor(rawA) : 3;
  const col = Number.isFinite(rawB) && rawB >= 1 && rawB <= 9 ? Math.floor(rawB) : 4;
  return {
    unit: 'mul',
    subTab: 'learn',
    label: '回到九九乘法探索台看陣列積木',
    row,
    col
  };
}

export { toLegacyPartnerId };
