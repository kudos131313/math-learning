import { describe, it, expect } from 'vitest';
import {
  BOSS_ALBUM_ENTRIES,
  STORY_ALBUM_ENTRIES
} from '../src/domain/quest-data.js';
import {
  createDefaultSaveV2,
  normalizeSaveDataV2,
  setStageStars,
  syncAlbumFromProgress,
  resolveStoryIdForQuestion,
  unlockStoryForQuestion,
  countDefeatedBosses,
  countUnlockedStories,
  resolveClassroomTargetForQuestion
} from '../src/domain/quest-questions.js';
import { buildMulQuestion } from '../src/domain/multiplication.js';
import { buildSunnyStageQuestions } from '../src/domain/quest-calc-questions.js';
import { buildCloudStageQuestions } from '../src/domain/quest-cloud-questions.js';
import {
  TOWER_MAX_HEARTS,
  TOWER_COINS_PER_FLOOR,
  TOWER_BOSS_CHEST_COINS,
  TOWER_ROUTES,
  isTowerUnlocked,
  isTowerBossFloor,
  getTowerTierForFloor,
  generateTowerFloorQuestion,
  createTowerRunState,
  applyTowerWrongAnswer,
  applyTowerFloorClear,
  recordTowerBestFloor,
  getTowerBestFloor
} from '../src/domain/quest-tower.js';
import {
  CLASSROOM_COINS_PER_PRACTICE,
  CLASSROOM_DAILY_COIN_CAP,
  generateDailyQuests,
  ensureDailyQuests,
  recordDailyQuestProgress,
  applyClassroomPracticeReward
} from '../src/domain/quest-retention.js';
import { getStoryStickerSvg } from '../src/quest/svg-art.js';

describe('Phase 4：無盡試煉塔（解鎖、4 路線階梯出題與 3 愛心生存）', () => {
  it('任一海域打敗第 1 座魔王或開啟預習/開發者模式即可解鎖試煉塔', () => {
    const fresh = createDefaultSaveV2(new Date(2026, 10, 21));
    expect(isTowerUnlocked(fresh)).toBe(false);

    const previewSave = createDefaultSaveV2(new Date(2026, 10, 21));
    previewSave.previewAll = true;
    expect(isTowerUnlocked(previewSave)).toBe(true);

    const sunnyWinner = createDefaultSaveV2(new Date(2026, 10, 21));
    setStageStars(sunnyWinner, 'sunny:1-3', 2);
    expect(isTowerUnlocked(sunnyWinner)).toBe(true);

    const mulWinner = createDefaultSaveV2(new Date(2026, 10, 21));
    setStageStars(mulWinner, 'mul:1-3', 1);
    expect(isTowerUnlocked(mulWinner)).toBe(true);
  });

  it('4 條路線於不同樓層應生成合法題目，每 5 層守塔小魔王且 16+ 層切換一步直解兩步驟', () => {
    expect(TOWER_ROUTES.map((r) => r.id)).toEqual(['all', 'sunny', 'mul', 'word']);
    expect(isTowerBossFloor(1)).toBe(false);
    expect(isTowerBossFloor(5)).toBe(true);
    expect(isTowerBossFloor(10)).toBe(true);
    expect(getTowerTierForFloor(1)).toBe(1);
    expect(getTowerTierForFloor(6)).toBe(2);
    expect(getTowerTierForFloor(12)).toBe(3);
    expect(getTowerTierForFloor(16)).toBe(4);

    const floors = [1, 5, 8, 12, 16, 20];
    TOWER_ROUTES.forEach((route) => {
      floors.forEach((floor) => {
        const q = generateTowerFloorQuestion(route.id, floor);
        expect(q).toBeTruthy();
        expect(Array.isArray(q.slots)).toBe(true);
        expect(q.slots.length).toBeGreaterThanOrEqual(1);
        expect(Number.isFinite(q.slots[0].expected)).toBe(true);
        expect(q.towerMeta.floor).toBe(floor);
        expect(q.towerMeta.isBossFloor).toBe(floor % 5 === 0);
        if (floor % 5 === 0) {
          expect(q.towerMeta.boss).toBeTruthy();
          expect(q.towerMeta.boss.name).toContain(`第 ${floor} 層守塔小魔王`);
        } else {
          expect(q.towerMeta.boss).toBeNull();
        }
      });
    });

    const tier4Word = generateTowerFloorQuestion('word', 16);
    expect(tier4Word.displayFormat).toBe('direct_two_step');
    expect(tier4Word.slots).toHaveLength(1);
  });

  it('生存制 3 顆愛心、每層 +3 幣、第 5 層守塔小魔王 +25 寶箱與回心上限 3 顆、個人最佳樓層', () => {
    const run = createTowerRunState('mul');
    expect(run.hearts).toBe(TOWER_MAX_HEARTS);
    expect(run.currentFloor).toBe(1);

    // 過第 1 層得 +3 幣
    const c1 = applyTowerFloorClear(run);
    expect(c1.clearedFloor).toBe(1);
    expect(c1.nextFloor).toBe(2);
    expect(c1.totalFloorCoins).toBe(TOWER_COINS_PER_FLOOR);

    // 答錯 1 次扣 1 愛心
    const w1 = applyTowerWrongAnswer(run);
    expect(w1.hearts).toBe(2);
    expect(w1.isGameOver).toBe(false);

    // 推至第 5 層打敗守塔小魔王：獲 3 + 25 = 28 幣且愛心 2 -> 3
    run.currentFloor = 5;
    const c5 = applyTowerFloorClear(run);
    expect(c5.isBossFloor).toBe(true);
    expect(c5.totalFloorCoins).toBe(TOWER_COINS_PER_FLOOR + TOWER_BOSS_CHEST_COINS);
    expect(c5.healedHeart).toBe(true);
    expect(run.hearts).toBe(3);

    // 滿血再過第 10 層不超過上限 3
    run.currentFloor = 10;
    const c10 = applyTowerFloorClear(run);
    expect(c10.healedHeart).toBe(false);
    expect(run.hearts).toBe(3);

    // 連錯 3 次結束
    expect(applyTowerWrongAnswer(run).isGameOver).toBe(false);
    expect(applyTowerWrongAnswer(run).isGameOver).toBe(false);
    expect(applyTowerWrongAnswer(run).isGameOver).toBe(true);

    const save = createDefaultSaveV2(new Date(2026, 10, 21));
    const rec1 = recordTowerBestFloor(save, 'mul', 7);
    expect(rec1).toEqual({ isNewRecord: true, prevBest: 0, newBest: 7 });
    expect(recordTowerBestFloor(save, 'mul', 5).isNewRecord).toBe(false);
    expect(getTowerBestFloor(save, 'mul')).toBe(7);

    const reloaded = normalizeSaveDataV2(JSON.parse(JSON.stringify(save)), new Date(2026, 10, 21));
    expect(getTowerBestFloor(reloaded, 'mul')).toBe(7);
  });
});

describe('Phase 4：魔王與故事收集冊（15 魔王 ＋ 12 生活貼紙牆）', () => {
  it('靜態冊條目數量與 SVG 繪本貼紙生成器皆完備無重複', () => {
    expect(BOSS_ALBUM_ENTRIES).toHaveLength(15);
    expect(STORY_ALBUM_ENTRIES).toHaveLength(12);
    const storyIds = new Set(STORY_ALBUM_ENTRIES.map((s) => s.id));
    expect(storyIds.size).toBe(12);

    STORY_ALBUM_ENTRIES.forEach((s) => {
      const svgUnlocked = getStoryStickerSvg(s.id, { unlocked: true });
      const svgLocked = getStoryStickerSvg(s.id, { unlocked: false });
      expect(svgUnlocked).toContain('<svg');
      expect(svgUnlocked).toContain('#332b22');
      expect(svgLocked).toContain('grayscale');
    });
  });

  it('syncAlbumFromProgress 與答對真實題目可正確自動解鎖魔王檔案與對應生活故事', () => {
    const save = createDefaultSaveV2(new Date(2026, 10, 21));
    setStageStars(save, 'sunny:1-3', 3);
    setStageStars(save, 'sunny:3-2', 2);

    const syncRes = syncAlbumFromProgress(save);
    expect(syncRes.bossesAdded).toBe(1);
    expect(save.bossesDefeated['sunny:bakery']).toBe(1);
    expect(countDefeatedBosses(save)).toBe(1);
    expect(save.unlockedStories.bay_change_shop).toBe(true);

    // 真實雲端兩步驟（先乘後加 / 先乘後減）與九九交換律皆可對應到正確故事
    const qAdd2 = buildCloudStageQuestions({
      id: 'cloud:3-1',
      realmId: 'cloud',
      cloudTypes: ['word_mul_add_guided'],
      count: 1,
      inputMode: 'keypad'
    })[0];
    expect(resolveStoryIdForQuestion(qAdd2)).toBe('park_ferris_popcorn');
    const r1 = unlockStoryForQuestion(save, qAdd2);
    expect(r1.unlocked).toBe(true);
    expect(unlockStoryForQuestion(save, qAdd2).unlocked).toBe(false);

    const qSub2 = buildCloudStageQuestions({
      id: 'cloud:4-1',
      realmId: 'cloud',
      cloudTypes: ['word_mul_sub_change_guided'],
      count: 1,
      inputMode: 'keypad'
    })[0];
    expect(resolveStoryIdForQuestion(qSub2)).toBe('patisserie_sweet_change');
    expect(unlockStoryForQuestion(save, qSub2).unlocked).toBe(true);

    const qSeq = buildCloudStageQuestions({
      id: 'cloud:1-1',
      realmId: 'cloud',
      cloudTypes: ['seq_step_1_10'],
      count: 1,
      inputMode: 'choice'
    })[0];
    expect(resolveStoryIdForQuestion(qSeq)).toBe('station_cloud_train');

    const qPv = buildCloudStageQuestions({
      id: 'cloud:2-1',
      realmId: 'cloud',
      cloudTypes: ['pv_compose'],
      count: 1,
      inputMode: 'keypad'
    })[0];
    expect(resolveStoryIdForQuestion(qPv)).toBe('vault_gold_blocks');

    const qComm = buildMulQuestion(6, 4, 'commutative');
    qComm.realm = 'mul';
    qComm.kind = 'mul';
    expect(resolveStoryIdForQuestion(qComm)).toBe('garden_flower_symmetry');

    expect(countUnlockedStories(save)).toBeGreaterThanOrEqual(3);
  });
});

describe('Phase 4：四大教學教室雙向連動、上限鎖定與精準回流目標解析', () => {
  it('教室探索／練習每次 +3 幣、每日上限 +15 🪙、跨日重算，並相容探索台好學寶寶旗標', () => {
    const save = createDefaultSaveV2(new Date(2026, 10, 21));
    const d1 = '2026-11-21';
    const daily = ensureDailyQuests(save, d1);
    daily.tasks[0] = {
      id: 'dq_class_test',
      slot: 'warmup',
      slotLabel: '暖身委託',
      icon: '🏫',
      title: '教室暖身操',
      desc: '練習 3 次',
      metric: 'classroom_practice',
      realmFilter: 'any',
      target: 3,
      progress: 0,
      rewardCoins: 20,
      claimed: false
    };

    for (let i = 0; i < 5; i++) {
      const r = applyClassroomPracticeReward(save, { unit: 'calc', action: 'explore', count: 1 }, d1);
      expect(r.coinsAwarded).toBe(CLASSROOM_COINS_PER_PRACTICE);
      expect(r.classroomCoinEarned).toBe((i + 1) * CLASSROOM_COINS_PER_PRACTICE);
    }
    expect(save.starCoins).toBe(CLASSROOM_DAILY_COIN_CAP);
    expect(daily.tasks[0].progress).toBe(3);

    // 第 6 次：每日上限已達，不再多發星星幣
    const r6 = applyClassroomPracticeReward(save, { unit: 'mul', action: 'explore', count: 1 }, d1);
    expect(r6.coinsAwarded).toBe(0);
    expect(r6.capReached).toBe(true);
    expect(r6.exploredInLabUpdated).toBe(true);
    expect(save.stats.exploredInLab).toBe(true);
    expect(save.starCoins).toBe(CLASSROOM_DAILY_COIN_CAP);

    // 隔天可重新累積上限
    const rNextDay = applyClassroomPracticeReward(save, { unit: 'learn', action: 'quiz_correct', count: 1 }, '2026-11-22');
    expect(rNextDay.coinsAwarded).toBe(CLASSROOM_COINS_PER_PRACTICE);
    expect(save.starCoins).toBe(CLASSROOM_DAILY_COIN_CAP + CLASSROOM_COINS_PER_PRACTICE);
  });

  it('未解鎖試煉塔時不會抽到高塔每日委託；已解鎖後塔 5 層通關可推進高塔每日挑戰', () => {
    for (let i = 0; i < 60; i++) {
      const d = `2026-11-${String((i % 28) + 1).padStart(2, '0')}`;
      const lockedPool = generateDailyQuests(d, ['sunny', 'mul'], { towerUnlocked: false });
      expect(lockedPool.some((t) => t.metric === 'tower_floor_5')).toBe(false);
    }

    const save = createDefaultSaveV2(new Date(2026, 10, 21));
    setStageStars(save, 'mul:1-3', 2);
    const daily = ensureDailyQuests(save, '2026-11-21');
    daily.tasks[2] = {
      id: 'dq_tower_test',
      slot: 'challenge',
      slotLabel: '挑戰委託',
      icon: '🗼',
      title: '高塔守門挑戰',
      desc: '打敗第 5 層守塔小魔王',
      metric: 'tower_floor_5',
      realmFilter: 'any',
      target: 1,
      progress: 0,
      rewardCoins: 45,
      claimed: false
    };

    const hitFloor4 = recordDailyQuestProgress(save, { type: 'tower_floor_clear', floor: 4, isClean: true }, '2026-11-21');
    expect(hitFloor4).toHaveLength(0);
    expect(daily.tasks[2].progress).toBe(0);

    const hitFloor5 = recordDailyQuestProgress(save, { type: 'tower_floor_clear', floor: 5, isClean: true }, '2026-11-21');
    expect(hitFloor5).toHaveLength(1);
    expect(daily.tasks[2].progress).toBe(1);
  });

  it('試煉塔解鎖單一真相來源與每日委託完全同步（不受殘留 bossesDefeated 誤導）', () => {
    const phantomSave = createDefaultSaveV2(new Date(2026, 10, 22));
    phantomSave.bossesDefeated = { 'mul:forest': 1 };
    expect(isTowerUnlocked(phantomSave)).toBe(false);
    const phantomDaily = ensureDailyQuests(phantomSave, '2026-11-22');
    expect(phantomDaily.tasks.some((t) => t.metric === 'tower_floor_5')).toBe(false);

    const mulCleared = createDefaultSaveV2(new Date(2026, 10, 22));
    setStageStars(mulCleared, 'mul:1-3', 1);
    expect(isTowerUnlocked(mulCleared)).toBe(true);
    const mulDaily = ensureDailyQuests(mulCleared, '2026-11-22');
    expect(mulDaily.tasks.some((t) => t.metric === 'tower_floor_5')).toBe(true);

    const sunnyCleared = createDefaultSaveV2(new Date(2026, 10, 22));
    setStageStars(sunnyCleared, 'sunny:1-3', 2);
    expect(isTowerUnlocked(sunnyCleared)).toBe(true);
    const sunnyDaily = ensureDailyQuests(sunnyCleared, '2026-11-22');
    expect(sunnyDaily.tasks.some((t) => t.metric === 'tower_floor_5')).toBe(true);
  });

  it('卡關回流解析應對各海域真實題目精準回傳對應教學教室與預載參數', () => {
    const qCalc = buildSunnyStageQuestions({
      id: 'sunny:2-1',
      realmId: 'sunny',
      calcTypes: ['sub_2d_borrow'],
      count: 1,
      inputMode: 'keypad'
    })[0];
    const tCalc = resolveClassroomTargetForQuestion(qCalc);
    expect(tCalc.unit).toBe('calc');
    expect(tCalc.op).toBe('-');
    expect(tCalc.a).toBeGreaterThanOrEqual(tCalc.b);

    const qPv = buildCloudStageQuestions({
      id: 'cloud:2-1',
      realmId: 'cloud',
      cloudTypes: ['pv_compose'],
      count: 1,
      inputMode: 'keypad'
    })[0];
    const tPv = resolveClassroomTargetForQuestion(qPv);
    expect(tPv.unit).toBe('learn');
    expect(tPv.presetNum).toBe(qPv.expected);

    const qSeq = buildCloudStageQuestions({
      id: 'cloud:1-1',
      realmId: 'cloud',
      cloudTypes: ['seq_step_1_10'],
      count: 1,
      inputMode: 'choice'
    })[0];
    const tSeq = resolveClassroomTargetForQuestion(qSeq);
    expect(tSeq.unit).toBe('seq');
    expect(tSeq.startNum).toBe(qSeq.sequenceModel.numbers[0]);
    expect(tSeq.step).toBe(qSeq.sequenceModel.step);

    const qMul = buildMulQuestion(7, 8, 'standard');
    qMul.realm = 'mul';
    qMul.kind = 'mul';
    const tMul = resolveClassroomTargetForQuestion(qMul);
    expect(tMul).toMatchObject({ unit: 'mul', row: 7, col: 8 });
  });
});
