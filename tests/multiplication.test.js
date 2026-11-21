import { describe, it, expect } from 'vitest';
import {
  getMantra,
  getSpokenExplanation,
  getPoolByLevel,
  buildMulQuestion,
  generateMulChoices
} from '../src/domain/multiplication.js';

describe('getMantra 與 getSpokenExplanation 臺灣國小口訣規則', () => {
  it('應正確產生九九乘法口訣（含得十與十幾）', () => {
    const cases = [
      [2, 3, '二三得六'],
      [3, 2, '三二得六'],
      [2, 5, '二五得十'],
      [3, 4, '三四十二'],
      [7, 8, '七八五十六'],
      [9, 9, '九九八十一']
    ];
    for (const [a, b, expected] of cases) {
      expect(getMantra(a, b)).toBe(expected);
    }
  });

  it('口語說明應支援簡短與完整兩種版本', () => {
    expect(getSpokenExplanation(3, 4, true)).toBe('三四十二，3 乘以 4 等於 12');
    expect(getSpokenExplanation(3, 4, false)).toContain('共有 4 組');
  });
});

describe('getPoolByLevel 關卡乘數池過濾', () => {
  it('應依關卡難度或單段篩選回傳正確候選陣列', () => {
    expect(getPoolByLevel('basic', 'all')).toEqual([1, 2, 5]);
    expect(getPoolByLevel('mid', 'all')).toEqual([3, 4, 6]);
    expect(getPoolByLevel('hard', 'all')).toEqual([7, 8, 9]);
    expect(getPoolByLevel('all', 'all')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(getPoolByLevel('hard', '7')).toEqual([7]);
    expect(getPoolByLevel('basic', 5)).toEqual([5]);
  });
});

describe('buildMulQuestion 與 generateMulChoices 題型與選項誘答', () => {
  it('應正確建立 standard / commutative / missing_a / missing_b / concept 題目', () => {
    const std = buildMulQuestion(6, 7, 'standard');
    expect(std.product).toBe(42);
    expect(std.slots).toHaveLength(1);
    expect(std.slots[0].expected).toBe(42);

    const comm = buildMulQuestion(3, 6, 'commutative');
    expect(comm.qType).toBe('commutative');
    expect(comm.slots[0].expected).toBe(6);

    const sameComm = buildMulQuestion(5, 5, 'commutative');
    expect(sameComm.qType).toBe('standard');
    expect(sameComm.slots[0].expected).toBe(25);

    const missB = buildMulQuestion(8, 9, 'missing_b');
    expect(missB.slots[0].expected).toBe(9);

    const missA = buildMulQuestion(7, 4, 'missing_a');
    expect(missA.slots[0].expected).toBe(7);

    const concept = buildMulQuestion(4, 3, 'concept', () => 0);
    expect(concept.slots).toHaveLength(2);
    expect(concept.slots[0].expected).toBe(3);
    expect(concept.slots[1].expected).toBe(12);
    expect(concept.storyHtml).toContain('4 ＋ 4 ＋ 4');
  });

  it('單槽題型的 4 個選擇題選項應不重複、含正解且落在 1..81', () => {
    const types = ['standard', 'commutative', 'missing_a', 'missing_b'];
    for (const qType of types) {
      for (let a = 1; a <= 9; a++) {
        const b = a === 9 ? 4 : a + 1;
        const q = buildMulQuestion(a, b, qType);
        const choices = generateMulChoices(q, 4);
        expect(choices).toHaveLength(4);
        expect(choices).toContain(q.slots[0].expected);
        expect(new Set(choices).size).toBe(4);
        for (const c of choices) {
          expect(c).toBeGreaterThanOrEqual(1);
          expect(c).toBeLessThanOrEqual(81);
        }
      }
    }
  });

  it('雙槽 concept 題呼叫 generateMulChoices 應回傳空陣列', () => {
    const concept = buildMulQuestion(3, 4, 'concept');
    expect(generateMulChoices(concept, 4)).toEqual([]);
  });
});
