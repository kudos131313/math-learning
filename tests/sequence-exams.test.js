import { describe, it, expect } from 'vitest';
import { PAPER_EXAMS, validateSequenceProgression } from '../src/domain/sequence-exams.js';

describe('PAPER_EXAMS 數的規律考卷真題驗證', () => {
  it('應包含 6 道考卷經典真題且每題遞推完全正確', () => {
    expect(PAPER_EXAMS.length).toBeGreaterThanOrEqual(6);
    for (const exam of PAPER_EXAMS) {
      expect(validateSequenceProgression(exam.numbers, exam.step)).toBe(true);
      expect(exam.blanks.length).toBeGreaterThan(0);
      for (const bIdx of exam.blanks) {
        expect(bIdx).toBeGreaterThanOrEqual(0);
        expect(bIdx).toBeLessThan(exam.numbers.length);
      }
    }
  });

  it('應精準通過跨百關鍵案例（200→199、199→209、205→195、首格反推 215、99→109）', () => {
    expect(PAPER_EXAMS[0].numbers[1]).toBe(200);
    expect(PAPER_EXAMS[0].numbers[2]).toBe(199);

    expect(PAPER_EXAMS[1].numbers[1]).toBe(199);
    expect(PAPER_EXAMS[1].numbers[2]).toBe(209);

    expect(PAPER_EXAMS[3].numbers[0]).toBe(215);
    expect(PAPER_EXAMS[3].numbers[2]).toBe(195);

    expect(PAPER_EXAMS[5].numbers[1]).toBe(99);
    expect(PAPER_EXAMS[5].numbers[2]).toBe(109);
  });

  it('validateSequenceProgression 對非法輸入或非等差數列應回傳 false', () => {
    expect(validateSequenceProgression([], 1)).toBe(false);
    expect(validateSequenceProgression([10], 1)).toBe(false);
    expect(validateSequenceProgression([10, 20, 35], 10)).toBe(false);
  });
});
