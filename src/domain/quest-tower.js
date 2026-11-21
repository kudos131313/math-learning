/**
 * 數學冒險島：無盡試煉塔（Endless Tower）純函式引擎
 * 支援：3 顆愛心生存制（無計時壓迫）、4 條路線、樓層難度階梯（高層切換一步直解兩步驟）、
 * 每 5 層守塔小魔王回心（上限 3 顆）＋ 寶箱獎勵、個人最高樓層紀錄
 */
import { ISLANDS, getStageById, getIslandById } from './quest-data.js';
import { countUnlockedSprites } from './quest-questions.js';
import { randInt } from './number-text.js';
import { buildMulQuestion } from './multiplication.js';
import { buildSunnyStageQuestions } from './quest-calc-questions.js';
import { buildCloudStageQuestions } from './quest-cloud-questions.js';

export const TOWER_MAX_HEARTS = 3;
export const TOWER_BOSS_INTERVAL = 5;
export const TOWER_COINS_PER_FLOOR = 3;
export const TOWER_BOSS_CHEST_COINS = 25;

export const TOWER_ROUTES = [
  {
    id: 'all',
    icon: '🌟',
    name: '全能混合高塔',
    subtitle: '跨越加減進退位、九九乘法、跳數位值與兩步驟應用題的全能試煉',
    badge: '綜合全課綱',
    bgImg: 'assets/quest/bg-skycastle.jpg'
  },
  {
    id: 'sunny',
    icon: '☀️',
    name: '加減專精高塔',
    subtitle: '從二位數加減進階至三位數進退位、跨零借位與未知數反推',
    badge: '加減計算力',
    bgImg: 'assets/quest/bg-lighthouse.jpg'
  },
  {
    id: 'mul',
    icon: '🌲',
    name: '九九乘法高塔',
    subtitle: '1～9 乘法口訣、交換律配對與逆向未知乘數快速試煉',
    badge: '口訣與倍數',
    bgImg: 'assets/quest/bg-castle.jpg'
  },
  {
    id: 'word',
    icon: '🛒',
    name: '生活應用高塔',
    subtitle: '從單步驟購物找錢、比多比少，爬升至兩步驟先乘後加／後減直解',
    badge: '生活情境題',
    bgImg: 'assets/quest/bg-patisserie.jpg'
  }
];

export function getTowerRouteById(routeId) {
  for (let i = 0; i < TOWER_ROUTES.length; i++) {
    if (TOWER_ROUTES[i].id === routeId) return TOWER_ROUTES[i];
  }
  return TOWER_ROUTES[0];
}

export function isTowerUnlocked(saveData) {
  if (!saveData) return false;
  if (saveData.previewAll || saveData.devMode) return true;
  return countUnlockedSprites(saveData, null, { ignoreDevMode: true }) >= 1;
}

export function isTowerBossFloor(floor) {
  const f = Math.floor(Number(floor) || 0);
  return f >= TOWER_BOSS_INTERVAL && f % TOWER_BOSS_INTERVAL === 0;
}

export function getTowerTierForFloor(floor) {
  const f = Math.max(1, Math.floor(Number(floor) || 1));
  if (f <= 5) return 1;
  if (f <= 10) return 2;
  if (f <= 15) return 3;
  return 4;
}

const ROUTE_ISLAND_CYCLE = {
  all: [
    'sunny:bakery',
    'mul:workshop',
    'cloud:station',
    'sunny:market',
    'mul:castle',
    'cloud:park',
    'sunny:lighthouse',
    'cloud:skycastle'
  ],
  sunny: ['sunny:bakery', 'sunny:candy', 'sunny:bay', 'sunny:market', 'sunny:lighthouse'],
  mul: ['mul:forest', 'mul:workshop', 'mul:garden', 'mul:valley', 'mul:castle'],
  word: ['sunny:candy', 'sunny:bay', 'mul:garden', 'cloud:park', 'cloud:patisserie', 'cloud:skycastle']
};

export function getTowerGuardianForFloor(floor, routeId = 'all') {
  const f = Math.max(1, Math.floor(Number(floor) || 1));
  const cycle = ROUTE_ISLAND_CYCLE[routeId] || ROUTE_ISLAND_CYCLE.all;
  const bossIdx = Math.max(0, Math.floor((f - 1) / TOWER_BOSS_INTERVAL));
  const islandFullId = cycle[bossIdx % cycle.length];
  const isl = getIslandById(islandFullId) || ISLANDS[0];
  const bossStage = getStageById(isl.bossStageId);
  const bossMeta = (bossStage && bossStage.boss) || {};

  return {
    floor: f,
    name: `第 ${f} 層守塔小魔王・${bossMeta.name || isl.spriteName}`,
    shortName: bossMeta.name || isl.spriteName,
    svgKey: bossMeta.svgKey || isl.theme,
    theme: isl.theme,
    bgImg: isl.bgImg,
    tauntStart: `「來到第 ${f} 層試煉塔啦！答對這題就送你守塔寶箱和回補愛心！」`,
    tauntHit: bossMeta.tauntHit || '「哎呀！被你的數學魔法擊中了！」',
    tauntWin: `「太強了！第 ${f} 層守塔寶箱與愛心能量交給你囉！」`
  };
}

function pickFrom(arr, randIntFn) {
  return arr[randIntFn(0, arr.length - 1)];
}

function pickSunnyTowerQuestion(tier, isBossFloor, randIntFn, avoidTemplateId) {
  const pools = {
    1: ['add_2d_plain', 'sub_2d_plain', 'add_make_ten'],
    2: ['add_2d_carry', 'sub_2d_borrow', 'add_2d_double_carry'],
    3: ['add_3d', 'sub_3d', 'sub_across_zero'],
    4: ['sub_across_zero', 'calc_missing_add', 'calc_missing_sub', 'add_3d', 'sub_3d']
  };
  const calcType = pickFrom(pools[tier] || pools[1], randIntFn);
  const inputMode = tier === 1 && !isBossFloor ? 'choice' : 'keypad';
  const qs = buildSunnyStageQuestions(
    { id: 'tower_sunny', realmId: 'sunny', calcTypes: [calcType], count: 1, inputMode },
    { randIntFn }
  );
  if (qs[0] && avoidTemplateId && qs[0].templateId === avoidTemplateId) {
    return buildSunnyStageQuestions(
      { id: 'tower_sunny', realmId: 'sunny', calcTypes: pools[tier], count: 1, inputMode },
      { randIntFn }
    )[0];
  }
  return qs[0];
}

function pickMulTowerQuestion(tier, isBossFloor, randIntFn) {
  const tablePools = {
    1: [2, 3, 4, 5],
    2: [6, 7, 8, 9],
    3: [3, 4, 6, 7, 8, 9],
    4: [6, 7, 8, 9]
  };
  const qTypePools = {
    1: ['standard'],
    2: ['standard', 'commutative'],
    3: ['standard', 'missing_b', 'missing_a'],
    4: ['missing_b', 'missing_a', 'commutative', 'standard']
  };

  const tables = tablePools[tier] || tablePools[1];
  const a = pickFrom(tables, randIntFn);
  const b = randIntFn(2, 9);
  const qType = pickFrom(qTypePools[tier] || qTypePools[1], randIntFn);
  const q = buildMulQuestion(a, b, qType, randIntFn);

  let skillTag = 'mul_basic';
  if (q.qType === 'commutative') skillTag = 'mul_commutative';
  else if (q.qType === 'missing_a' || q.qType === 'missing_b') skillTag = 'mul_missing';

  q.realm = 'mul';
  q.kind = 'mul';
  q.skillTag = skillTag;
  q.uiMode = tier === 1 && !isBossFloor ? 'choice' : 'keypad';
  q.rescueDedupeKey = `mul:${q.a}x${q.b}`;
  q.rescueSnapshot = { a: q.a, b: q.b, qType: 'standard' };
  return q;
}

function pickWordTowerQuestion(tier, isBossFloor, randIntFn) {
  if (tier === 1) {
    const useMul = randIntFn(0, 2) === 0;
    if (useMul) {
      const a = randIntFn(2, 6);
      const b = randIntFn(2, 6);
      const q = buildMulQuestion(a, b, 'standard', randIntFn);
      const icons = ['🍎', '🍪', '✏️', '🌟'];
      const units = ['盤', '袋', '盒', '排'];
      const idx = randIntFn(0, icons.length - 1);
      q.realm = 'mul';
      q.kind = 'mul';
      q.skillTag = 'word_mul_life';
      q.badge = '🗼 試煉生活分組';
      q.uiMode = isBossFloor ? 'keypad' : 'choice';
      q.storyHtml = `${icons[idx]} 每${units[idx]}有 <b>${a}</b> 個，共有 <b>${b}</b> ${units[idx]}，一共有幾個？`;
      q.spokenPrompt = `每${units[idx]}有 ${a} 個，共有 ${b} ${units[idx]}，一共有幾個？`;
      q.rescueDedupeKey = `mul:${a}x${b}`;
      q.rescueSnapshot = { a, b, qType: 'standard' };
      return q;
    }
    return buildSunnyStageQuestions(
      {
        id: 'tower_word_1',
        realmId: 'sunny',
        calcTypes: ['word_bakery_plain', 'word_buy_merge_carry'],
        count: 1,
        inputMode: isBossFloor ? 'keypad' : 'choice'
      },
      { randIntFn }
    )[0];
  }

  if (tier === 2) {
    return buildSunnyStageQuestions(
      {
        id: 'tower_word_2',
        realmId: 'sunny',
        calcTypes: ['word_buy_change', 'word_compare', 'word_buy_merge_carry'],
        count: 1,
        inputMode: 'keypad'
      },
      { randIntFn }
    )[0];
  }

  if (tier === 3) {
    const cloudTypes = ['word_mul_add_guided', 'word_mul_sub_change_guided', 'word_mul_sub_left_guided'];
    return buildCloudStageQuestions(
      { id: 'tower_word_3', realmId: 'cloud', cloudTypes: [pickFrom(cloudTypes, randIntFn)], count: 1, inputMode: 'keypad' },
      { randIntFn }
    )[0];
  }

  const directTypes = [
    'word_mul_add_direct',
    'word_mul_sub_change_direct',
    'word_mul_sub_left_direct'
  ];
  return buildCloudStageQuestions(
    { id: 'tower_word_4', realmId: 'cloud', cloudTypes: [pickFrom(directTypes, randIntFn)], count: 1, inputMode: 'keypad' },
    { randIntFn }
  )[0];
}

function pickCloudPuzzleTowerQuestion(tier, isBossFloor, randIntFn) {
  const pool =
    tier <= 2
      ? ['seq_step_1_10', 'seq_step_2_5', 'pv_compose', 'pv_compare_pair']
      : ['seq_reverse_left', 'pv_compare_max_min', 'pv_thousand_exchange'];
  const cType = pickFrom(pool, randIntFn);
  const inputMode = tier === 1 && !isBossFloor ? 'choice' : 'keypad';
  return buildCloudStageQuestions(
    { id: 'tower_cloud', realmId: 'cloud', cloudTypes: [cType], count: 1, inputMode },
    { randIntFn }
  )[0];
}

/**
 * 依據試煉塔路線與樓層生成單題（層數越高難度越進階；11~15 出現分步兩步驟，16+ 切換為一步直解與未知數混合）
 */
export function generateTowerFloorQuestion(routeId = 'all', floor = 1, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  const f = Math.max(1, Math.floor(Number(floor) || 1));
  const tier = getTowerTierForFloor(f);
  const bossFloor = isTowerBossFloor(f);
  const avoidTemplateId = options.avoidTemplateId || '';
  const avoidSet = new Set(Array.isArray(options.avoidDedupeKeys) ? options.avoidDedupeKeys : []);

  let q = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    let candidate = null;
    if (routeId === 'sunny') {
      candidate = pickSunnyTowerQuestion(tier, bossFloor, randIntFn, avoidTemplateId);
    } else if (routeId === 'mul') {
      candidate = pickMulTowerQuestion(tier, bossFloor, randIntFn);
    } else if (routeId === 'word') {
      candidate = pickWordTowerQuestion(tier, bossFloor, randIntFn);
    } else {
      // 全能混合高塔：隨樓層比例抽出加減、乘法、跳數/位值與兩步驟應用題
      const slot = (f + attempt) % 4;
      if (tier <= 2) {
        if (slot === 0) candidate = pickSunnyTowerQuestion(tier, bossFloor, randIntFn, avoidTemplateId);
        else if (slot === 1) candidate = pickMulTowerQuestion(tier, bossFloor, randIntFn);
        else if (slot === 2) candidate = pickCloudPuzzleTowerQuestion(tier, bossFloor, randIntFn);
        else candidate = pickWordTowerQuestion(tier, bossFloor, randIntFn);
      } else if (tier === 3) {
        if (slot === 0) candidate = pickSunnyTowerQuestion(3, bossFloor, randIntFn, avoidTemplateId);
        else if (slot === 1) candidate = pickMulTowerQuestion(3, bossFloor, randIntFn);
        else if (slot === 2) candidate = pickCloudPuzzleTowerQuestion(3, bossFloor, randIntFn);
        else candidate = pickWordTowerQuestion(3, bossFloor, randIntFn);
      } else {
        if (slot === 0) candidate = pickWordTowerQuestion(4, bossFloor, randIntFn);
        else if (slot === 1) candidate = pickSunnyTowerQuestion(4, bossFloor, randIntFn, avoidTemplateId);
        else if (slot === 2) candidate = pickMulTowerQuestion(4, bossFloor, randIntFn);
        else candidate = pickWordTowerQuestion(4, bossFloor, randIntFn);
      }
    }

    if (candidate) {
      const dupTpl = avoidTemplateId && candidate.templateId && candidate.templateId === avoidTemplateId;
      const dupKey = candidate.rescueDedupeKey && avoidSet.has(candidate.rescueDedupeKey);
      if ((!dupTpl && !dupKey) || attempt === 11) {
        q = candidate;
        break;
      }
    }
  }

  const guardian = bossFloor ? getTowerGuardianForFloor(f, routeId) : null;
  if (q) {
    q.towerMeta = {
      routeId,
      floor: f,
      tier,
      isBossFloor: bossFloor,
      boss: guardian
    };
    if (bossFloor) {
      q.badge = `👑 第 ${f} 層守塔小魔王`;
    }
  }
  return q;
}

export function createTowerRunState(routeId = 'all') {
  const safeRoute = getTowerRouteById(routeId).id;
  return {
    routeId: safeRoute,
    currentFloor: 1,
    clearedFloors: 0,
    hearts: TOWER_MAX_HEARTS,
    maxHearts: TOWER_MAX_HEARTS,
    bossDefeatedCount: 0,
    earnedCoins: 0,
    bossChestCoins: 0,
    isGameOver: false,
    recentTemplateId: '',
    recentDedupeKeys: []
  };
}

export function applyTowerWrongAnswer(runState) {
  if (!runState) {
    return { hearts: 0, maxHearts: TOWER_MAX_HEARTS, isGameOver: true };
  }
  const maxH = Math.max(1, Number(runState.maxHearts) || TOWER_MAX_HEARTS);
  const nextHearts = Math.max(0, Math.floor(Number(runState.hearts) || 0) - 1);
  runState.hearts = nextHearts;
  runState.isGameOver = nextHearts <= 0;
  return {
    hearts: nextHearts,
    maxHearts: maxH,
    isGameOver: runState.isGameOver
  };
}

export function applyTowerFloorClear(runState) {
  if (!runState) {
    return {
      clearedFloor: 0,
      nextFloor: 1,
      floorCoins: 0,
      chestCoins: 0,
      totalFloorCoins: 0,
      isBossFloor: false,
      healedHeart: false,
      hearts: 0
    };
  }

  const clearedFloor = Math.max(1, Math.floor(Number(runState.currentFloor) || 1));
  const bossFloor = isTowerBossFloor(clearedFloor);
  const floorCoins = TOWER_COINS_PER_FLOOR;
  const chestCoins = bossFloor ? TOWER_BOSS_CHEST_COINS : 0;
  const maxH = Math.max(1, Number(runState.maxHearts) || TOWER_MAX_HEARTS);
  const prevHearts = Math.max(0, Math.min(maxH, Math.floor(Number(runState.hearts) || 0)));

  let healedHeart = false;
  if (bossFloor) {
    runState.bossDefeatedCount = Math.max(0, Number(runState.bossDefeatedCount || 0)) + 1;
    if (prevHearts < maxH) {
      runState.hearts = Math.min(maxH, prevHearts + 1);
      healedHeart = true;
    } else {
      runState.hearts = maxH;
    }
  }

  const totalFloorCoins = floorCoins + chestCoins;
  runState.earnedCoins = Math.max(0, Number(runState.earnedCoins || 0)) + totalFloorCoins;
  runState.bossChestCoins = Math.max(0, Number(runState.bossChestCoins || 0)) + chestCoins;
  runState.clearedFloors = clearedFloor;
  runState.currentFloor = clearedFloor + 1;

  return {
    clearedFloor,
    nextFloor: runState.currentFloor,
    floorCoins,
    chestCoins,
    totalFloorCoins,
    isBossFloor: bossFloor,
    healedHeart,
    hearts: runState.hearts
  };
}

export function recordTowerBestFloor(saveData, routeId, clearedFloors) {
  const safeFloors = Math.max(0, Math.floor(Number(clearedFloors) || 0));
  const safeRoute = getTowerRouteById(routeId).id;
  if (!saveData || typeof saveData !== 'object') {
    return { isNewRecord: false, prevBest: 0, newBest: safeFloors };
  }
  if (!saveData.tower || typeof saveData.tower !== 'object') {
    saveData.tower = { bestFloors: { all: 0, sunny: 0, mul: 0, word: 0 } };
  }
  if (!saveData.tower.bestFloors || typeof saveData.tower.bestFloors !== 'object') {
    saveData.tower.bestFloors = { all: 0, sunny: 0, mul: 0, word: 0 };
  }
  const prevBest = Math.max(0, Math.floor(Number(saveData.tower.bestFloors[safeRoute]) || 0));
  const newBest = Math.max(prevBest, safeFloors);
  const isNewRecord = safeFloors > prevBest;
  if (isNewRecord) {
    saveData.tower.bestFloors[safeRoute] = newBest;
  }
  return { isNewRecord, prevBest, newBest };
}

export function getTowerBestFloor(saveData, routeId) {
  const bestMap = saveData && saveData.tower && saveData.tower.bestFloors;
  if (!bestMap || typeof bestMap !== 'object') return 0;
  if (routeId) {
    return Math.max(0, Math.floor(Number(bestMap[routeId]) || 0));
  }
  return Math.max(
    0,
    Math.floor(Number(bestMap.all) || 0),
    Math.floor(Number(bestMap.sunny) || 0),
    Math.floor(Number(bestMap.mul) || 0),
    Math.floor(Number(bestMap.word) || 0)
  );
}
