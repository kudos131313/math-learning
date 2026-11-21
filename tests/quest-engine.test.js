import { describe, it, expect } from 'vitest';
import {
  REALMS,
  ISLANDS,
  STAGES,
  BADGES,
  BUNNY_COSTUMES,
  MAX_RESCUE_CASES,
  getRealmById,
  getIslandById,
  getStageById
} from '../src/domain/quest-data.js';
import {
  createDefaultSave,
  normalizeSaveData,
  createDefaultSaveV2,
  migrateV1ToV2,
  normalizeSaveDataV2,
  getLocalDateKey,
  getStageStars,
  setStageStars,
  isRealmUnlocked,
  getRealmUnlockProgress,
  isStageUnlocked,
  getNextPlayableStageId,
  getActivePartnerId,
  evaluateUnlockedBadges,
  getCostumeProgress,
  evaluateUnlockedCostumes,
  createMulRescueCase,
  enqueueRescueCase,
  removeRescueCase,
  calculateStageCoinReward,
  serializeBackupPayload,
  parseAndValidateBackupJson,
  buildStageQuestions,
  buildRescueQuestions
} from '../src/domain/quest-questions.js';
import { generateMulChoices } from '../src/domain/multiplication.js';
import {
  renderPinkBunnySvg,
  getStageChestSvg,
  getCharacterSvg
} from '../src/quest/svg-art.js';

describe('數學冒險島靜態配置與多海域完整性', () => {
  it('應定義 3 大海域、5 座乘法島嶼、15 個關卡、10 枚徽章與 8 款小兔造型', () => {
    expect(REALMS).toHaveLength(3);
    expect(getRealmById('sunny').unlockMode).toBe('initial');
    expect(getRealmById('mul').status).toBe('active');
    expect(getRealmById('cloud').unlockMode).toBe('conditional');

    expect(ISLANDS).toHaveLength(5);
    expect(STAGES).toHaveLength(15);
    expect(BADGES).toHaveLength(10);
    expect(BUNNY_COSTUMES).toHaveLength(8);

    for (const isl of ISLANDS) {
      expect(isl.realmId).toBe('mul');
      expect(isl.fullId).toBe('mul:' + isl.id);
      const bossStage = getStageById(isl.bossStageId);
      expect(bossStage).not.toBeNull();
      expect(bossStage.isBoss).toBe(true);
      expect(getIslandById(isl.fullId).id).toBe(isl.id);
    }

    expect(getStageById('mul:1-1')).toEqual(getStageById('1-1'));
  });
});

describe('存檔正規化、關卡解鎖與進度判定（向後相容 v1）', () => {
  it('normalizeSaveData 應處理空資料與舊存檔自動派駐精靈', () => {
    const empty = normalizeSaveData(null);
    expect(empty.activeCostume).toBe('default');
    expect(empty.unlockedCostumes.default).toBe(true);

    // 舊存檔沒有 activePartner 欄位，但已擊敗 2-3 Boss
    const legacy = normalizeSaveData({
      stageStars: { '1-3': 3, '2-3': 2 },
      activeCostume: 'non_existent'
    });
    expect(legacy.activePartner).toBe('workshop');
    expect(legacy.activeCostume).toBe('default');
  });

  it('isStageUnlocked 與 getNextPlayableStageId 應正確判斷依序與預習模式', () => {
    const save = createDefaultSave();
    expect(isStageUnlocked('1-1', save)).toBe(true);
    expect(isStageUnlocked('1-2', save)).toBe(false);
    expect(getNextPlayableStageId(save)).toBe('1-1');

    save.stageStars['1-1'] = 2;
    expect(isStageUnlocked('1-2', save)).toBe(true);
    expect(isStageUnlocked('1-3', save)).toBe(false);
    expect(getNextPlayableStageId(save)).toBe('1-2');

    save.previewAll = true;
    expect(isStageUnlocked('5-3', save)).toBe(true);
  });

  it('evaluateUnlockedBadges 與 evaluateUnlockedCostumes 應準確評估新解鎖項目', () => {
    const save = createDefaultSave();
    save.stageStars['1-1'] = 3;
    save.stageStars['3-3'] = 2;
    save.stats.maxCombo = 5;
    save.stageStars['1-2'] = 3;
    save.stageStars['1-3'] = 3;
    save.stageStars['2-1'] = 2;
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        save.gems[a + 'x' + b] = true;
      }
    }

    const newBadges = evaluateUnlockedBadges(save).map((b) => b.id);
    expect(newBadges).toContain('first_clear');
    expect(newBadges).toContain('three_stars');
    expect(newBadges).toContain('combo_5');
    expect(newBadges).toContain('island_3_boss');
    expect(newBadges).toContain('gems_81');

    // 已解鎖過的不應重複回傳
    save.badges.first_clear = true;
    expect(evaluateUnlockedBadges(save).map((b) => b.id)).not.toContain('first_clear');

    const ribbon = BUNNY_COSTUMES.find((c) => c.id === 'ribbon');
    expect(getCostumeProgress(ribbon, save).unlocked).toBe(true);
    const crown = BUNNY_COSTUMES.find((c) => c.id === 'crown');
    expect(getCostumeProgress(crown, save).unlocked).toBe(true);

    const newCostumes = evaluateUnlockedCostumes(save).map((c) => c.id);
    expect(newCostumes).toContain('ribbon');
    expect(newCostumes).toContain('crown');
  });
});

describe('Phase 1：v1 → v2 無縫存檔遷移、海域解鎖、救援案件與星星幣', () => {
  it('migrateV1ToV2 應完整保留舊版星星、寶石、造型三部位歸位、精靈、救援案件與歡迎星星幣', () => {
    const fixedNow = new Date(2026, 10, 21, 17, 30, 0);
    const v1 = {
      version: 1,
      previewAll: false,
      activeCostume: 'crown',
      unlockedCostumes: { default: true, ribbon: true, cape: true, crown: true },
      stageStars: { '1-1': 3, '1-2': 2, '1-3': 3, '2-3': 1 },
      gems: { '2x3': true, '5x5': true },
      rescueQueue: ['7x8', '7x8', '9x6'],
      badges: { first_clear: true },
      stats: { totalCorrect: 22, selfHealed: 1, maxCombo: 5, rescuedCount: 0, exploredInLab: true }
    };

    const v2 = migrateV1ToV2(v1, fixedNow);
    expect(v2.version).toBe(2);
    expect(v2.migratedFromV1).toBe(true);
    expect(v2.daily.date).toBe('2026-11-21');
    expect(getStageStars(v2, 'mul:1-1')).toBe(3);
    expect(getStageStars(v2, '1-3')).toBe(3);
    expect(getStageStars(v2, 'mul:2-3')).toBe(1);
    expect(v2.gems['2x3']).toBe(true);
    expect(v2.gems['5x5']).toBe(true);
    expect(v2.badges.first_clear).toBe(true);

    // 總星數 = 3 + 2 + 3 + 1 = 9，歡迎禮 = 9 * 5 + 30 = 75
    expect(v2.starCoins).toBe(75);

    // 未寫 activePartner 時應自動派最新打敗的 2 島精靈 mul:workshop
    expect(v2.partners.activeId).toBe('mul:workshop');
    expect(getActivePartnerId(v2)).toBe('mul:workshop');
    expect(v2.partners.bonds['mul:forest']).toEqual({ xp: 0, level: 1 });
    expect(v2.partners.bonds['mul:workshop']).toEqual({ xp: 0, level: 1 });

    // 造型三部位歸位（crown 同時解鎖頭冠與星輝披肩）
    expect(v2.wardrobe.unlocked.hat).toContain('ribbon');
    expect(v2.wardrobe.unlocked.hat).toContain('diamond_crown');
    expect(v2.wardrobe.unlocked.outfit).toContain('star_cape');
    expect(v2.wardrobe.unlocked.outfit).toContain('diamond_shawl');
    expect(v2.wardrobe.active.hat).toBe('diamond_crown');
    expect(v2.wardrobe.active.outfit).toBe('diamond_shawl');

    // 舊救援佇列應去重並轉為結構化 RescueCase
    expect(v2.rescueCases).toHaveLength(2);
    expect(v2.rescueCases[0].dedupeKey).toBe('mul:7x8');
    expect(v2.rescueCases[1].dedupeKey).toBe('mul:9x6');
  });

  it('跨海域解鎖條件：陽光加減與九九乘法初始開放，雲端應用王國需 ≥15 星或 ≥2 魔王或預習模式', () => {
    const save = createDefaultSaveV2();
    expect(isRealmUnlocked('sunny', save)).toBe(true);
    expect(isRealmUnlocked('mul', save)).toBe(true);
    expect(isRealmUnlocked('cloud', save)).toBe(false);

    // 打敗 2 位島嶼魔王即可解鎖雲端
    setStageStars(save, 'mul:1-3', 1);
    setStageStars(save, 'mul:2-3', 1);
    expect(getRealmUnlockProgress('cloud', save).bosses).toBe(2);
    expect(isRealmUnlocked('cloud', save)).toBe(true);

    // 另一情境：只靠總星數滿 15 星也應解鎖
    const starSave = createDefaultSaveV2();
    setStageStars(starSave, 'mul:1-1', 3);
    setStageStars(starSave, 'mul:1-2', 3);
    setStageStars(starSave, 'mul:2-1', 3);
    setStageStars(starSave, 'mul:2-2', 3);
    setStageStars(starSave, 'mul:3-1', 3);
    expect(getRealmUnlockProgress('cloud', starSave).stars).toBe(15);
    expect(isRealmUnlocked('cloud', starSave)).toBe(true);

    // 預習模式全開
    const previewSave = createDefaultSaveV2();
    previewSave.previewAll = true;
    expect(isRealmUnlocked('cloud', previewSave)).toBe(true);
  });

  it('結構化救援案件應支援去重、18 筆上限 FIFO 淘汰、移除與跨格式重建題目', () => {
    let queue = [];
    for (let i = 1; i <= 20; i++) {
      const a = Math.floor((i - 1) / 9) + 2;
      const b = ((i - 1) % 9) + 1;
      queue = enqueueRescueCase(queue, createMulRescueCase(a, b, 1000 + i));
    }
    expect(queue).toHaveLength(MAX_RESCUE_CASES);
    // 前 2 筆 (2x1, 2x2) 應已被淘汰
    expect(queue.some((c) => c.dedupeKey === 'mul:2x1')).toBe(false);
    expect(queue.some((c) => c.dedupeKey === 'mul:2x2')).toBe(false);
    expect(queue[0].dedupeKey).toBe('mul:2x3');

    // 重複案件不應重複入隊
    const dupRes = enqueueRescueCase(queue, createMulRescueCase(2, 3, 9999));
    expect(dupRes).toHaveLength(MAX_RESCUE_CASES);

    // 移除後減少一筆
    const afterRemove = removeRescueCase(queue, { dedupeKey: 'mul:2x3' });
    expect(afterRemove).toHaveLength(MAX_RESCUE_CASES - 1);

    const qs = buildRescueQuestions(afterRemove);
    expect(qs).toHaveLength(6);
    expect(qs[0].uiMode).toBe('keypad');
    expect(qs[0].rescueCaseId).toBeTruthy();
  });

  it('calculateStageCoinReward 應正確計算首通、補星差額、每日重玩上限與救援獎金', () => {
    const normal = getStageById('1-1');
    const boss = getStageById('1-3');

    expect(calculateStageCoinReward({ stage: normal, prevStars: 0, newStars: 3 }).coins).toBe(50);
    expect(calculateStageCoinReward({ stage: normal, prevStars: 1, newStars: 3 }).coins).toBe(25);
    expect(calculateStageCoinReward({ stage: boss, prevStars: 0, newStars: 3 }).coins).toBe(90);
    expect(calculateStageCoinReward({ stage: boss, prevStars: 2, newStars: 3 }).coins).toBe(25);

    // 每日重玩前 3 次 +15，之後 +3
    expect(calculateStageCoinReward({ stage: normal, prevStars: 3, newStars: 2, dailyReplayCount: 0 })).toEqual({
      coins: 15,
      reason: 'daily_replay',
      consumesDailyReplay: true
    });
    expect(calculateStageCoinReward({ stage: normal, prevStars: 3, newStars: 3, dailyReplayCount: 3 })).toEqual({
      coins: 3,
      reason: 'practice_bonus',
      consumesDailyReplay: false
    });

    // 救援每人 +8
    expect(calculateStageCoinReward({ isRescueMode: true, rescuedCount: 4 }).coins).toBe(32);
  });

  it('備份匯出與匯入應支援標準 v2 與舊版 v1，並拒絕損毀或無關 JSON', () => {
    const now = new Date(2026, 10, 21, 18, 0, 0);
    const save = createDefaultSaveV2(now);
    setStageStars(save, 'mul:1-1', 3);
    save.starCoins = 120;
    save.gems['3x4'] = true;

    const json = serializeBackupPayload(save, now);
    const imported = parseAndValidateBackupJson(json, now);
    expect(imported.ok).toBe(true);
    expect(imported.save.starCoins).toBe(120);
    expect(getStageStars(imported.save, 'mul:1-1')).toBe(3);
    expect(imported.save.gems['3x4']).toBe(true);

    // 也支援匯入裸 v1 存檔
    const v1Import = parseAndValidateBackupJson(JSON.stringify({ stageStars: { '1-1': 2 }, gems: { '2x2': true } }), now);
    expect(v1Import.ok).toBe(true);
    expect(v1Import.save.migratedFromV1).toBe(true);
    expect(v1Import.save.starCoins).toBe(40);

    // 拒絕無效或無關 JSON
    expect(parseAndValidateBackupJson('', now).ok).toBe(false);
    expect(parseAndValidateBackupJson('{broken json', now).ok).toBe(false);
    expect(parseAndValidateBackupJson('{"hello":"world"}', now).ok).toBe(false);
    expect(parseAndValidateBackupJson('{"app":"other-app","save":{}}', now).ok).toBe(false);
    expect(parseAndValidateBackupJson('{"stageStars":[1,2,3]}', now).ok).toBe(false);
  });

  it('getLocalDateKey 應依本機日期格式化 YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 5, 23, 55, 0);
    expect(getLocalDateKey(d)).toBe('2026-01-05');
  });
});

describe('冒險關卡題庫與低 1 乘法權重驗證', () => {
  it('15 個關卡皆能產出符合數量的題目，且選擇題誘答有效不重複', () => {
    for (const st of STAGES) {
      const qs = buildStageQuestions(st, {});
      expect(qs).toHaveLength(st.count);
      for (const q of qs) {
        if (q.uiMode === 'choice') {
          const opts = generateMulChoices(q, 4);
          expect(opts).toHaveLength(4);
          expect(opts).toContain(q.slots[0].expected);
          expect(new Set(opts).size).toBe(4);
        }
      }
    }
  });

  it('關卡 5-1 與 1-1 應大幅降低 1 的乘法出現機率', () => {
    const stage51 = getStageById('5-1');
    const stage11 = getStageById('1-1');

    let one51 = 0;
    let total51 = 0;
    for (let r = 0; r < 60; r++) {
      for (const q of buildStageQuestions(stage51, {})) {
        total51++;
        if (q.a === 1 || q.b === 1) one51++;
      }
    }
    expect(one51 / total51).toBeLessThan(0.08);

    let one11 = 0;
    let total11 = 0;
    for (let r = 0; r < 40; r++) {
      for (const q of buildStageQuestions(stage11, {})) {
        total11++;
        if (q.a === 1 || q.b === 1) one11++;
      }
    }
    expect(one11 / total11).toBeLessThan(0.42);
  });

  it('buildRescueQuestions 應將錯題佇列轉換為鍵盤特訓題', () => {
    const qs = buildRescueQuestions(['7x8', '9x6']);
    expect(qs).toHaveLength(2);
    expect(qs[0].a).toBe(7);
    expect(qs[0].b).toBe(8);
    expect(qs[0].uiMode).toBe('keypad');
    expect(qs[0].rescueKey).toBe('7x8');
  });
});

describe('SVG 角色與造型圖形產生器', () => {
  it('粉紅小兔、寶箱與島嶼角色皆應產生合法 SVG 字串', () => {
    for (const c of BUNNY_COSTUMES) {
      const svg = renderPinkBunnySvg('happy', c.id);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
    for (const isl of ISLANDS) {
      expect(getStageChestSvg(isl.theme, 'normal')).toContain('<svg');
      expect(getStageChestSvg(isl.theme, 'open')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, true, 'hit')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, false, 'happy')).toContain('<svg');
    }
  });
});
