import { describe, it, expect } from 'vitest';
import { CALC_PRESETS, getCalcDecomp, getStepExplanation } from '../src/domain/vertical-calc.js';

describe('CALC_PRESETS 預設題庫', () => {
  it('加法與減法預設範例皆符合規則', () => {
    expect(CALC_PRESETS.add.length).toBeGreaterThanOrEqual(4);
    expect(CALC_PRESETS.sub.length).toBeGreaterThanOrEqual(4);
    for (const p of CALC_PRESETS.add) {
      expect(p.a + p.b).toBeLessThanOrEqual(999);
    }
    for (const p of CALC_PRESETS.sub) {
      expect(p.a).toBeGreaterThanOrEqual(p.b);
    }
  });
});

describe('getCalcDecomp 直式加減法數值拆解', () => {
  it('加法無進位 (23 + 14)', () => {
    const d = getCalcDecomp(23, 14, 'add');
    expect(d.total).toBe(37);
    expect(d.needsCarry).toBe(false);
    expect(d.carry_o).toBe(0);
    expect(d.ans_o).toBe(7);
    expect(d.ans_t).toBe(3);
    expect(d.ans_h).toBe(0);
  });

  it('加法個位進位 (28 + 15)', () => {
    const d = getCalcDecomp(28, 15, 'add');
    expect(d.total).toBe(43);
    expect(d.needsCarry).toBe(true);
    expect(d.carry_o).toBe(1);
    expect(d.carry_t).toBe(0);
    expect(d.ans_o).toBe(3);
    expect(d.ans_t).toBe(4);
  });

  it('加法進到百位 (86 + 47)', () => {
    const d = getCalcDecomp(86, 47, 'add');
    expect(d.total).toBe(133);
    expect(d.carry_o).toBe(1);
    expect(d.carry_t).toBe(1);
    expect(d.ans_o).toBe(3);
    expect(d.ans_t).toBe(3);
    expect(d.ans_h).toBe(1);
  });

  it('減法無退位 (35 - 12)', () => {
    const d = getCalcDecomp(35, 12, 'sub');
    expect(d.total).toBe(23);
    expect(d.needsBorrow_o).toBe(false);
    expect(d.needsBorrow_t).toBe(false);
    expect(d.ans_o).toBe(3);
    expect(d.ans_t).toBe(2);
  });

  it('減法個位退位 (42 - 17)', () => {
    const d = getCalcDecomp(42, 17, 'sub');
    expect(d.total).toBe(25);
    expect(d.needsBorrow_o).toBe(true);
    expect(d.isAcrossZeroBorrow).toBe(false);
    expect(d.borrowed_t).toBe(3);
    expect(d.effective_o).toBe(12);
    expect(d.ans_o).toBe(5);
    expect(d.ans_t).toBe(2);
  });

  it('減法百位跨零退位 (105 - 38)', () => {
    const d = getCalcDecomp(105, 38, 'sub');
    expect(d.total).toBe(67);
    expect(d.needsBorrow_o).toBe(true);
    expect(d.isAcrossZeroBorrow).toBe(true);
    expect(d.needsBorrow_t).toBe(true);
    expect(d.borrowed_h).toBe(0);
    expect(d.effective_t).toBe(9);
    expect(d.effective_o).toBe(15);
    expect(d.ans_o).toBe(7);
    expect(d.ans_t).toBe(6);
    expect(d.ans_h).toBe(0);
  });

  it('減法一般百位向十位整合借位 (125 - 48)', () => {
    const d = getCalcDecomp(125, 48, 'sub');
    expect(d.total).toBe(77);
    expect(d.needsBorrow_o).toBe(true);
    expect(d.isAcrossZeroBorrow).toBe(false);
    expect(d.needsBorrow_t).toBe(true);
    expect(d.borrowed_h).toBe(0);
    expect(d.effective_t).toBe(11);
    expect(d.ans_o).toBe(7);
    expect(d.ans_t).toBe(7);
    expect(d.ans_h).toBe(0);
  });
});

describe('getStepExplanation 步驟文案與提示生成', () => {
  it('進位加法步驟 0~4 應正確產生進位提示與音效標記', () => {
    const d = getCalcDecomp(28, 15, 'add');
    expect(getStepExplanation(d, 0).showPrompt).toBe(false);
    const s1 = getStepExplanation(d, 1);
    expect(s1.showPrompt).toBe(true);
    expect(s1.promptBtn).toContain('捆成 1 條十');
    const s2 = getStepExplanation(d, 2);
    expect(s2.sound).toBe('carry');
    expect(getStepExplanation(d, 3).text).toContain('小 1');
    const s4 = getStepExplanation(d, 4);
    expect(s4.sound).toBe('correct');
    expect(s4.text).toContain('43');
  });

  it('跨零退位減法步驟 1~4 應正確標示借位提示、音效與省略最高位 0 說明', () => {
    const d = getCalcDecomp(105, 38, 'sub');
    const s1 = getStepExplanation(d, 1);
    expect(s1.showPrompt).toBe(true);
    expect(s1.isBorrow).toBe(true);
    expect(s1.promptBtn).toContain('百位退位');
    const s2 = getStepExplanation(d, 2);
    expect(s2.sound).toBe('borrow');
    expect(getStepExplanation(d, 3).text).toContain('9');
    const s4 = getStepExplanation(d, 4);
    expect(s4.sound).toBe('correct');
    expect(s4.text).toContain('最高位 0 省略不寫');
  });
});
