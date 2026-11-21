import { describe, it, expect } from 'vitest';
import {
  SKILL_CARDS,
  getRealmById,
  getIslandsByRealm,
  getStagesByRealm,
  getStageById,
  toCanonicalPartnerId
} from '../src/domain/quest-data.js';
import {
  createDefaultSaveV2,
  isRealmUnlocked,
  getRealmUnlockProgress,
  isStageUnlocked,
  setStageStars,
  createRescueCaseFromQuestion,
  buildStageQuestions,
  buildRescueQuestions,
  recordSkillCodexHit,
  countUnlockedSkillCards
} from '../src/domain/quest-questions.js';
import {
  TWO_STEP_CHANGE_BILLS,
  pickMinimalTwoStepBill,
  buildCloudStageQuestions,
  validateCloudQuestionInvariants,
  generateCloudChoices
} from '../src/domain/quest-cloud-questions.js';
import { generateMulChoices } from '../src/domain/multiplication.js';
import { renderCloudQuestionHtml, renderCloudHelperHtml } from '../src/quest/cloud-ui.js';
import { getStageChestSvg, getCharacterSvg } from '../src/quest/svg-art.js';

describe('Phase 2b：雲端應用王國靜態架構、SVG 與跨海域解鎖門檻', () => {
  it('應完整配置 5 座雲端島嶼、15 個關卡、Boss 護盾與全部 24 張技能卡', () => {
    const cloudRealm = getRealmById('cloud');
    expect(cloudRealm.status).toBe('active');
    expect(cloudRealm.unlockMode).toBe('conditional');

    const cloudIslands = getIslandsByRealm('cloud');
    const cloudStages = getStagesByRealm('cloud');
    expect(cloudIslands).toHaveLength(5);
    expect(cloudStages).toHaveLength(15);

    expect(SKILL_CARDS).toHaveLength(24);
    expect(SKILL_CARDS.filter((c) => c.realmId === 'sunny')).toHaveLength(10);
    expect(SKILL_CARDS.filter((c) => c.realmId === 'mul')).toHaveLength(4);
    expect(SKILL_CARDS.filter((c) => c.realmId === 'cloud')).toHaveLength(9);
    expect(SKILL_CARDS.filter((c) => c.realmId === 'global')).toHaveLength(1);

    for (const isl of cloudIslands) {
      expect(toCanonicalPartnerId(isl.id)).toBe('cloud:' + isl.id);
      const bossSt = getStageById(isl.bossStageId);
      expect(bossSt).not.toBeNull();
      expect(bossSt.isBoss).toBe(true);
      expect(bossSt.bossShield).toBeGreaterThanOrEqual(1);

      expect(getStageChestSvg(isl.theme, 'normal')).toContain('<svg');
      expect(getStageChestSvg(isl.theme, 'open')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, true, 'hit')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, true, 'dizzy')).toContain('<svg');
      expect(getCharacterSvg(isl.theme, false, 'happy')).toContain('<svg');
    }
  });

  it('跨海域門檻：未達標鎖定並精確計算尚差星數與魔王數，達 15 星／2 魔王／預習皆可開啟 cloud:1-1', () => {
    const save = createDefaultSaveV2();
    expect(isRealmUnlocked('cloud', save)).toBe(false);
    expect(isStageUnlocked('cloud:1-1', save)).toBe(false);

    const prog0 = getRealmUnlockProgress('cloud', save);
    expect(prog0.unlocked).toBe(false);
    expect(prog0.remainingStars).toBe(15);
    expect(prog0.remainingBosses).toBe(2);

    // 跨兩大前驅海域湊滿 15 星
    setStageStars(save, 'sunny:1-1', 3);
    setStageStars(save, 'sunny:1-2', 3);
    setStageStars(save, 'sunny:2-1', 3);
    setStageStars(save, 'mul:1-1', 3);
    setStageStars(save, 'mul:1-2', 3);
    expect(isRealmUnlocked('cloud', save)).toBe(true);
    expect(isStageUnlocked('cloud:1-1', save)).toBe(true);
    expect(isStageUnlocked('cloud:1-2', save)).toBe(false);

    // 改以擊敗任 2 位魔王（1 位陽光魔王 + 1 位乘法魔王）也解鎖
    const bossSave = createDefaultSaveV2();
    setStageStars(bossSave, 'sunny:1-3', 1);
    setStageStars(bossSave, 'mul:1-3', 1);
    const progBoss = getRealmUnlockProgress('cloud', bossSave);
    expect(progBoss.bosses).toBe(2);
    expect(progBoss.remainingBosses).toBe(0);
    expect(isRealmUnlocked('cloud', bossSave)).toBe(true);
    expect(isStageUnlocked('cloud:1-1', bossSave)).toBe(true);

    // 自由預習模式一鍵全開
    const previewSave = createDefaultSaveV2();
    previewSave.previewAll = true;
    expect(isRealmUnlocked('cloud', previewSave)).toBe(true);
    expect(isStageUnlocked('cloud:5-3', previewSave)).toBe(true);
  });
});

describe('Phase 2b：1000+ 次跳數、位值與兩步驟應用題不變量壓力測試', () => {
  it('pickMinimalTwoStepBill 應選取 >= step1 + 5 的最小台灣合理面額', () => {
    expect(pickMinimalTwoStepBill(24)).toBe(50);
    expect(pickMinimalTwoStepBill(45)).toBe(50);
    expect(pickMinimalTwoStepBill(46)).toBe(100);
    expect(pickMinimalTwoStepBill(81)).toBe(100);
    expect(pickMinimalTwoStepBill(110)).toBe(150);
    expect(pickMinimalTwoStepBill(160)).toBe(200);
  });

  it('全部 15 關隨機出題超過 1000 題，兩步驟無負找零、跳數遞推與位值規則 100% 通過', () => {
    const cloudStages = getStagesByRealm('cloud');
    let tested = 0;
    let guidedChecked = 0;
    let directChecked = 0;
    let changeChecked = 0;

    // 15 關 × 每關跑 20 輪（合計 ~1,680 題）
    for (let round = 0; round < 20; round++) {
      for (const st of cloudStages) {
        const qs = buildStageQuestions(st, {});
        expect(qs).toHaveLength(st.count);

        let lastWordTpl = '';
        for (const q of qs) {
          tested += 1;
          const inv = validateCloudQuestionInvariants(q);
          expect(inv.errors).toEqual([]);
          expect(inv.ok).toBe(true);

          if (q.stepMode === 'guided_two_step') guidedChecked += 1;
          if (q.stepMode === 'direct_two_step') directChecked += 1;
          if (q.twoStepModel && q.twoStepModel.variant === 'mul_sub_change') {
            changeChecked += 1;
            expect(TWO_STEP_CHANGE_BILLS).toContain(q.paid);
            expect(q.paid - q.a * q.b).toBeGreaterThanOrEqual(5);
          }

          if (q.kind === 'word_two_step' || q.kind === 'word_single') {
            expect(q.templateId).not.toBe(lastWordTpl);
            lastWordTpl = q.templateId;
          }

          if (q.uiMode === 'choice') {
            const opts = q.kind === 'mul' ? generateMulChoices(q, 4) : generateCloudChoices(q, 4);
            expect(opts).toHaveLength(4);
            expect(opts).toContain(q.slots[0].expected);
            expect(new Set(opts).size).toBe(4);
          }
        }
      }
    }

    expect(tested).toBeGreaterThanOrEqual(1000);
    expect(guidedChecked).toBeGreaterThan(200);
    expect(directChecked).toBeGreaterThan(150);
    expect(changeChecked).toBeGreaterThan(100);
  });

  it('跳數列車、位值卡片與兩步驟分步／直解 UI 及小幫手 HTML 應正確渲染且不劇透答案', () => {
    const seqQ = buildCloudStageQuestions(getStageById('cloud:1-1'))[0];
    const seqHtml = renderCloudQuestionHtml(seqQ);
    expect(seqHtml).toContain('mqst-seq-train');
    const miniTrainHtml = renderCloudHelperHtml(seqQ, () => '');
    expect(miniTrainHtml).toContain('mqst-mini-train-row');
    expect(miniTrainHtml).toContain('？');
    expect(miniTrainHtml).toContain('data-goto-unit="seq"');

    const pvQ = buildCloudStageQuestions(getStageById('cloud:2-1'))[0];
    const pvHtml = renderCloudQuestionHtml(pvQ);
    expect(pvHtml).toContain('mqst-pv-cards-row');
    const pvHelper = renderCloudHelperHtml(pvQ, (k) => `<span class="blk blk-${k}"></span>`);
    expect(pvHelper).toContain('data-goto-unit="learn"');
    expect(pvHelper).not.toContain(`＝ ${pvQ.expected}`);

    const twoStepQ = buildCloudStageQuestions(getStageById('cloud:3-1'))[0];
    const step1Html = renderCloudQuestionHtml(twoStepQ, { stepIdx: 0 });
    expect(step1Html).toContain('aria-current="step"');
    expect(step1Html).toContain('data-slot-id="step1"');
    expect(step1Html).not.toContain('data-slot-id="step2"');
    expect(step1Html).toContain('🔒 第 2 步');

    const step2Html = renderCloudQuestionHtml(twoStepQ, { stepIdx: 1 });
    expect(step2Html).toContain('✅ 第 1 步完成');
    expect(step2Html).toContain(String(twoStepQ.step1Expected));
    expect(step2Html).toContain('data-slot-id="step2"');

    const barHelper = renderCloudHelperHtml(twoStepQ, () => '');
    expect(barHelper).toContain('mqst-twostep-diagram');
    expect(barHelper).toContain('第 1 步：算乘法小計');
    expect(barHelper).not.toContain(`＝ ${twoStepQ.answer}`);
  });

  it('結構化救援案件經 JSON 序列化再還原後，應精準重建跳數、位值與兩步驟分步／直解題目', () => {
    const sampleStageIds = ['cloud:1-3', 'cloud:2-3', 'cloud:3-1', 'cloud:4-1', 'cloud:4-3', 'cloud:5-3'];
    const pairs = [];

    for (const sid of sampleStageIds) {
      const qs = buildStageQuestions(getStageById(sid), {});
      for (const q of qs) {
        const rc = createRescueCaseFromQuestion(q, 1763800000000);
        expect(rc).not.toBeNull();
        expect(rc.realm).toBe('cloud');
        pairs.push({ orig: q, rc: JSON.parse(JSON.stringify(rc)) });
      }
    }

    for (let i = 0; i < pairs.length; i += 6) {
      const batch = pairs.slice(i, i + 6);
      const rebuilt = buildRescueQuestions(batch.map((p) => p.rc));
      expect(rebuilt).toHaveLength(batch.length);
      for (let j = 0; j < rebuilt.length; j++) {
        const r = rebuilt[j];
        const o = batch[j].orig;
        expect(r.realm).toBe('cloud');
        expect(r.kind).toBe(o.kind);
        expect(r.stepMode).toBe(o.stepMode);
        expect(r.skillTag).toBe(o.skillTag);
        expect(r.slots.map((s) => s.expected)).toEqual(o.slots.map((s) => s.expected));
      }
    }
  });
});

describe('Phase 2b：全部 24 張數學技能卡完整登錄與升階驗證', () => {
  it('saveData 可逐張累計並解鎖全部 24 張技能卡（包含雲端 9 張與全域救援大隊長）', () => {
    const save = createDefaultSaveV2();
    for (const card of SKILL_CARDS) {
      for (let k = 0; k < 3; k++) {
        recordSkillCodexHit(save, card.id);
      }
    }
    expect(countUnlockedSkillCards(save)).toBe(24);
  });
});
