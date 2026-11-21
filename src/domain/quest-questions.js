/**
 * 九九乘法冒險存檔正規化、進度計算與關卡題庫生成（純函式領域模組）
 */
import { ISLANDS, STAGES, BADGES, BUNNY_COSTUMES } from './quest-data.js';
import { buildMulQuestion } from './multiplication.js';
import { randInt } from './number-text.js';

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
    for (let i = ISLANDS.length - 1; i >= 0; i--) {
      if (Number(stageStars[ISLANDS[i].bossStageId] || 0) >= 1) {
        activePartner = ISLANDS[i].id;
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

export function isStageUnlocked(stageId, saveData) {
  if (saveData && saveData.previewAll) return true;
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].id === stageId) {
      if (i === 0) return true;
      return Number((saveData && saveData.stageStars && saveData.stageStars[STAGES[i - 1].id]) || 0) >= 1;
    }
  }
  return false;
}

export function getNextPlayableStageId(saveData) {
  for (let i = 0; i < STAGES.length; i++) {
    if (!saveData || !saveData.stageStars || !saveData.stageStars[STAGES[i].id]) {
      return STAGES[i].id;
    }
  }
  return STAGES[STAGES.length - 1].id;
}

export function countTotalStars(saveData) {
  let total = 0;
  const stars = (saveData && saveData.stageStars) || {};
  STAGES.forEach((s) => {
    total += Number(stars[s.id] || 0);
  });
  return total;
}

export function countLitGems(saveData) {
  const gems = (saveData && saveData.gems) || {};
  return Object.keys(gems).filter((k) => gems[k]).length;
}

export function countUnlockedSprites(saveData) {
  let cnt = 0;
  const stars = (saveData && saveData.stageStars) || {};
  ISLANDS.forEach((isl) => {
    if (Number(stars[isl.bossStageId] || 0) >= 1) cnt++;
  });
  return cnt;
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
  const stageStars = (saveData && saveData.stageStars) || {};
  const stats = (saveData && saveData.stats) || {};

  function check(id, cond) {
    if (cond && !badges[id]) {
      for (let i = 0; i < BADGES.length; i++) {
        if (BADGES[i].id === id) newlyUnlocked.push(BADGES[i]);
      }
    }
  }

  check('first_clear', countTotalStars(saveData) >= 1);
  check('three_stars', STAGES.some((s) => Number(stageStars[s.id] || 0) === 3));
  check('combo_5', (stats.maxCombo || 0) >= 5);
  check('never_give_up', (stats.selfHealed || 0) >= 5);
  check('rescue_hero', (stats.rescuedCount || 0) >= 1);
  check('lab_explorer', Boolean(stats.exploredInLab));
  check('island_3_boss', Number(stageStars['3-3'] || 0) >= 1);
  check('island_4_boss', Number(stageStars['4-3'] || 0) >= 1);
  check('master_castle', Number(stageStars['5-3'] || 0) >= 1);
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
  const randIntFn = options.randIntFn || randInt;
  const randomFn = options.randomFn || Math.random;
  const candidatePairs = [];
  stage.tables.forEach((a) => {
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

    if (qType === 'story_choice' && effectiveType === 'standard' && pair.b >= 2 && pair.b <= 7) {
      const icons = ['🍎', '🍪', '✏️', '🌟', '🎈'];
      const units = ['盤', '袋', '盒', '排', '串'];
      const idx = randIntFn(0, icons.length - 1);
      q.badge = '情境乘法冒險';
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
    q.uiMode = mode;
    selected.push(q);
  }
  return selected;
}

export function buildRescueQuestions(rescueQueue, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  return (rescueQueue || []).slice(0, 6).map((k) => {
    const parts = k.split('x');
    const q = buildMulQuestion(Number(parts[0]) || 3, Number(parts[1]) || 4, 'standard', randIntFn);
    q.uiMode = 'keypad';
    q.badge = '🆘 求救小精靈特訓';
    q.rescueKey = k;
    return q;
  });
}

export function getCollectableUnlitGems(saveData) {
  const allowedTables = {};
  STAGES.forEach((st) => {
    if (isStageUnlocked(st.id, saveData)) {
      st.tables.forEach((t) => {
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
    q.uiMode = 'keypad';
    q.badge = '💎 未點亮寶石特訓';
    return q;
  });
}
