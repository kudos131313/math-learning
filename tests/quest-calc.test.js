import { describe, it, expect } from 'vitest';
import {
  SKILL_CARDS,
  SKILL_TIER_THRESHOLDS,
  SKILL_TIER_COINS,
  getIslandsByRealm,
  getStagesByRealm,
  getStageById,
  toCanonicalPartnerId
} from '../src/domain/quest-data.js';
import {
  createDefaultSaveV2,
  isStageUnlocked,
  setStageStars,
  createRescueCaseFromQuestion,
  buildStageQuestions,
  buildRescueQuestions,
  getSkillTier,
  getSkillCardProgress,
  recordSkillCodexHit,
  countUnlockedSkillCards
} from '../src/domain/quest-questions.js';
import {
  TAIWAN_CHANGE_BILLS,
  buildSunnyStageQuestions,
  validateCalcQuestionInvariants,
  generateCalcChoices
} from '../src/domain/quest-calc-questions.js';
import { getCalcDecomp } from '../src/domain/vertical-calc.js';
import { renderCalcEquationHtml, renderCalcHelperHtml } from '../src/quest/calc-ui.js';
import { getStageChestSvg, getCharacterSvg } from '../src/quest/svg-art.js';

describe('Phase 2a：陽光加減群島靜態結構與 SVG 美術完整性', () => {
  it('應完整配置 5 座陽光加減島嶼、15 個關卡、Boss 護盾與 10 張技能卡', () => {
    const sunnyIslands = getIslandsByRealm('sunny');
    const sunnyStages = getStagesByRealm('sunny');
    expect(sunnyIslands).toHaveLength(5);
    expect(sunnyStages).toHaveLength(15);
    expect(SKILL_CARDS).toHaveLength(10);

    for (const isl of sunnyIslands) {
      expect(toCanonicalPartnerId(isl.id)).toBe('sunny:' + isl.id);
      const bossSt = getStageById(isl.bossStageId);
      expect(bossSt).not.toBeNull();
      expect(bossSt.isBoss).toBe(true);
      expect(bossSt.bossShield).toBeGreaterThanOrEqual(1);

      // 驗證寶箱、魔王與守護小精靈 SVG 皆正確生成
      expect(getStageChestSvg(isl.theme, 'normal')).toContain('<svg');
      expect(getStageChestSvg(isl.theme, 'open')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, true, 'hit')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, true, 'dizzy')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, false, 'happy')).toContain('<svg');
    }
  });

  it('陽光加減群島第 1 關初始開放，後續依序推進解鎖', () => {
    const save = createDefaultSaveV2();
    expect(isStageUnlocked('sunny:1-1', save)).toBe(true);
    expect(isStageUnlocked('sunny:1-2', save)).toBe(false);

    setStageStars(save, 'sunny:1-1', 2);
    expect(isStageUnlocked('sunny:1-2', save)).toBe(true);
    expect(isStageUnlocked('sunny:1-3', save)).toBe(false);
  });
});

describe('Phase 2a：1000+ 次陽光加減與生活應用題不變量壓力測試', () => {
  it('全部 15 關隨機出題超過 1000 題，應 100% 通過數學與生活合理性不變量', () => {
    const sunnyStages = getStagesByRealm('sunny');
    let testedQuestions = 0;
    let acrossZeroChecked = 0;
    let changeChecked = 0;
    let compareReverseChecked = 0;

    // 15 關 × 每關跑 20 輪（每輪 5~8 題，約 1650 題）
    for (let round = 0; round < 20; round++) {
      for (const st of sunnyStages) {
        const qs = buildStageQuestions(st, {});
        expect(qs).toHaveLength(st.count);

        let lastWordTpl = '';
        for (const q of qs) {
          testedQuestions += 1;
          const inv = validateCalcQuestionInvariants(q);
          expect(inv.errors).toEqual([]);
          expect(inv.ok).toBe(true);

          if (q.calcType === 'sub_across_zero') {
            acrossZeroChecked += 1;
            const d = getCalcDecomp(q.a, q.b, 'sub');
            expect(d.isAcrossZeroBorrow).toBe(true);
            expect(d.effective_t).toBe(9);
          }

          if (q.calcType === 'word_buy_change' || q.calcType === 'word_buy_change_large') {
            changeChecked += 1;
            expect(TAIWAN_CHANGE_BILLS).toContain(q.paid);
            expect(q.paid - q.price).toBeGreaterThanOrEqual(3);
            expect(q.answer).toBe(q.paid - q.price);
          }

          if (q.calcType === 'word_compare' || q.calcType === 'word_compare_large') {
            if (
              q.rescueSnapshot.compareVariant === 'reverse_more' ||
              q.rescueSnapshot.compareVariant === 'reverse_less'
            ) {
              compareReverseChecked += 1;
            }
          }

          if (q.kind === 'word_single') {
            expect(q.templateId).not.toBe(lastWordTpl);
            lastWordTpl = q.templateId;
          }

          if (q.uiMode === 'choice') {
            const opts = generateCalcChoices(q, 4);
            expect(opts).toHaveLength(4);
            expect(opts).toContain(q.slots[0].expected);
            expect(new Set(opts).size).toBe(4);
            opts.forEach((v) => expect(v).toBeGreaterThan(0));
          }
        }
      }
    }

    expect(testedQuestions).toBeGreaterThanOrEqual(1000);
    expect(acrossZeroChecked).toBeGreaterThan(40);
    expect(changeChecked).toBeGreaterThan(40);
    expect(compareReverseChecked).toBeGreaterThan(20);
  });

  it('迷你直式對齊卡、十進位積木與線段對照小幫手 HTML 應正確渲染且不劇透答案', () => {
    const stage51 = getStageById('sunny:5-1');
    const qAcross = buildSunnyStageQuestions(stage51)[0];
    const vminiHtml = renderCalcEquationHtml(qAcross, 'vertical_mini');
    expect(vminiHtml).toContain('mqst-vmini-card');
    expect(vminiHtml).toContain('is-h');
    expect(vminiHtml).toContain('maxlength="3"');

    const helperHtml = renderCalcHelperHtml(qAcross, (k) => `<span class="blk blk-${k}"></span>`);
    expect(helperHtml).toContain('十位是 0 條不夠借');
    expect(helperHtml).toContain('data-goto-calc-lab="1"');

    const stage32 = getStageById('sunny:3-2');
    const compareQs = buildSunnyStageQuestions({ ...stage32, calcTypes: ['word_compare'], count: 4 });
    const barHtml = renderCalcHelperHtml(compareQs[0], () => '');
    expect(barHtml).toContain('mqst-bar-diagram');
    expect(barHtml).toContain('？');
  });

  it('結構化救援案件經 JSON 序列化再還原後，應精準重建加減題目與答案', () => {
    const sampleStageIds = ['sunny:1-3', 'sunny:2-3', 'sunny:3-2', 'sunny:4-3', 'sunny:5-1', 'sunny:5-2'];
    const cases = [];

    for (const sid of sampleStageIds) {
      const qs = buildStageQuestions(getStageById(sid), {});
      for (const q of qs) {
        const rc = createRescueCaseFromQuestion(q, 1763712000000);
        expect(rc).not.toBeNull();
        expect(rc.realm).toBe('sunny');
        cases.push({ orig: q, rc: JSON.parse(JSON.stringify(rc)) });
      }
    }

    for (let i = 0; i < cases.length; i += 6) {
      const batch = cases.slice(i, i + 6);
      const rebuilt = buildRescueQuestions(batch.map((b) => b.rc));
      expect(rebuilt).toHaveLength(batch.length);
      for (let j = 0; j < rebuilt.length; j++) {
        const r = rebuilt[j];
        const o = batch[j].orig;
        expect(r.uiMode).toBe('keypad');
        expect(r.realm).toBe('sunny');
        expect(r.kind).toBe(o.kind);
        expect(r.a).toBe(o.a);
        expect(r.b).toBe(o.b);
        expect(r.op).toBe(o.op);
        expect(r.slots[0].expected).toBe(o.slots[0].expected);
        expect(r.skillTag).toBe(o.skillTag);
      }
    }
  });
});

describe('Phase 2a：數學技能圖鑑銅／銀／金升階與星星幣獎勵', () => {
  it('應依 3 / 8 / 15 次正確門檻升階並僅在升階瞬間發放一次獎勵幣', () => {
    const save = createDefaultSaveV2();
    expect(getSkillTier(0)).toBe('none');
    expect(getSkillTier(SKILL_TIER_THRESHOLDS.bronze)).toBe('bronze');
    expect(getSkillTier(SKILL_TIER_THRESHOLDS.silver)).toBe('silver');
    expect(getSkillTier(SKILL_TIER_THRESHOLDS.gold)).toBe('gold');
    expect(countUnlockedSkillCards(save)).toBe(0);

    let totalBonus = 0;
    const upgrades = [];
    for (let i = 1; i <= 18; i++) {
      const res = recordSkillCodexHit(save, 'sub_across_zero');
      if (res.upgraded) {
        upgrades.push(res.newTier);
        totalBonus += res.bonusCoins;
      }
    }

    expect(upgrades).toEqual(['bronze', 'silver', 'gold']);
    expect(totalBonus).toBe(SKILL_TIER_COINS.bronze + SKILL_TIER_COINS.silver + SKILL_TIER_COINS.gold);
    expect(countUnlockedSkillCards(save)).toBe(1);

    const prog = getSkillCardProgress('sub_across_zero', save);
    expect(prog.count).toBe(18);
    expect(prog.tier).toBe('gold');
    expect(prog.isMax).toBe(true);
    expect(prog.pct).toBe(100);
  });
});
