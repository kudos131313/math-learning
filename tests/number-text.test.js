import { describe, it, expect } from 'vitest';
import {
  randInt,
  formatTime,
  numberToChinese,
  numberToTaiwanSpokenText,
  formatSpokenMathText
} from '../src/domain/number-text.js';

describe('numberToChinese 中文數字轉換', () => {
  it('應正確轉換個、十、百、千位含補零與十位省略規則', () => {
    const cases = [
      [0, '零'],
      [10, '十'],
      [15, '十五'],
      [100, '一百'],
      [105, '一百零五'],
      [324, '三百二十四'],
      [999, '九百九十九'],
      [1000, '一千'],
      [1005, '一千零五'],
      [3245, '三千二百四十五'],
      [9999, '九千九百九十九']
    ];
    for (const [input, expected] of cases) {
      expect(numberToChinese(input)).toBe(expected);
    }
  });
});

describe('numberToTaiwanSpokenText 臺灣國小口語讀法', () => {
  it('應落實兩/二區分、中間補零、15 與 215 規則以及萬位', () => {
    const cases = [
      [0, '零'],
      [2, '二'],
      [10, '十'],
      [15, '十五'],
      [20, '二十'],
      [22, '二十二'],
      [100, '一百'],
      [200, '兩百'],
      [203, '兩百零三'],
      [215, '兩百一十五'],
      [220, '兩百二十'],
      [223, '兩百二十三'],
      [2000, '兩千'],
      [2003, '兩千零三'],
      [2050, '兩千零五十'],
      [2222, '兩千兩百二十二'],
      [20000, '兩萬'],
      [22000, '兩萬兩千']
    ];
    for (const [input, expected] of cases) {
      expect(numberToTaiwanSpokenText(input)).toBe(expected);
    }
  });

  it('非數字輸入時應回傳原字串', () => {
    expect(numberToTaiwanSpokenText('abc')).toBe('abc');
  });
});

describe('formatSpokenMathText 算式口語化與正音修補', () => {
  it('應正確替換運算符號並轉換阿拉伯數字為口語讀法', () => {
    expect(formatSpokenMathText('223 + 12 = 235').trim()).toBe('兩百二十三 加 十二 等於 兩百三十五');
    expect(formatSpokenMathText('200 - 20 = 180').trim()).toBe('兩百 減 二十 等於 一百八十');
    expect(formatSpokenMathText('3 × 4 = 12').trim()).toBe('三 乘以 四 等於 十二');
    expect(formatSpokenMathText('20 / 4 = 5').trim()).toBe('二十 除以 四 等於 五');
  });

  it('應將書面「二百／二千／二萬」修補為口語「兩」但保留「十二萬」', () => {
    expect(formatSpokenMathText('二百零五')).toBe('兩百零五');
    expect(formatSpokenMathText('二千')).toBe('兩千');
    expect(formatSpokenMathText('二萬')).toBe('兩萬');
    expect(formatSpokenMathText('十二萬')).toBe('十二萬');
    expect(formatSpokenMathText(205)).toBe('兩百零五');
  });
});

describe('formatTime 與 randInt 輔助工具', () => {
  it('formatTime 應格式化為 mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
  });

  it('randInt 應落在閉區間 [min, max]', () => {
    expect(randInt(5, 5)).toBe(5);
    for (let i = 0; i < 50; i++) {
      const val = randInt(1, 9);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(9);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
