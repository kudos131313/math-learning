import { describe, it, expect } from 'vitest';
import {
  ISLANDS,
  STAGES,
  BADGES,
  BUNNY_COSTUMES,
  getStageById
} from '../src/domain/quest-data.js';
import {
  createDefaultSave,
  normalizeSaveData,
  isStageUnlocked,
  getNextPlayableStageId,
  evaluateUnlockedBadges,
  getCostumeProgress,
  evaluateUnlockedCostumes,
  buildStageQuestions,
  buildRescueQuestions
} from '../src/domain/quest-questions.js';
import { generateMulChoices } from '../src/domain/multiplication.js';
import {
  renderPinkBunnySvg,
  getStageChestSvg,
  getCharacterSvg
} from '../src/quest/svg-art.js';

describe('九九乘法冒險靜態配置完整性', () => {
  it('應定義 5 座島嶼、15 個關卡、10 枚徽章與 8 款小兔造型', () => {
    expect(ISLANDS).toHaveLength(5);
    expect(STAGES).toHaveLength(15);
    expect(BADGES).toHaveLength(10);
    expect(BUNNY_COSTUMES).toHaveLength(8);

    for (const isl of ISLANDS) {
      const bossStage = getStageById(isl.bossStageId);
      expect(bossStage).not.toBeNull();
      expect(bossStage.isBoss).toBe(true);
    }
  });
});

describe('存檔正規化、關卡解鎖與進度判定', () => {
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
    for (let i = 1; i <= 10; i++) {
      save.stageStars['s' + i] = 3;
    }
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
    expect(getCostumeProgress(ribbon, save).unlocked).toBe(false);

    save.stageStars['1-2'] = 3;
    save.stageStars['1-3'] = 3;
    save.stageStars['2-1'] = 2; // 總星數達 11 >= 10
    const newCostumes = evaluateUnlockedCostumes(save).map((c) => c.id);
    expect(newCostumes).toContain('ribbon');
    expect(newCostumes).toContain('crown');
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
