/**
 * 數的規律與考卷真題題庫及遞推驗證（純函式領域模組）
 */

export const PAPER_EXAMS = [
  {
    id: 'paper-1',
    title: '考卷第 (1) 題：1 個 1 個倒數（跨百退位）',
    ruleDesc: '每次減少 1（倒數），注意 200 的前一個是 199！',
    step: -1,
    numbers: [201, 200, 199, 198, 197, 196],
    blanks: [1, 4, 5]
  },
  {
    id: 'paper-2',
    title: '考卷第 (2) 題：10 個 10 個數（跨百進位）',
    ruleDesc: '每次增加 10，十位 9 滿十進一，199 變成 209！',
    step: 10,
    numbers: [189, 199, 209, 219, 229, 239],
    blanks: [2, 4]
  },
  {
    id: 'paper-3',
    title: '考卷第 (3) 題：1 個 1 個倒數（整十退位）',
    ruleDesc: '每次減少 1（倒數），注意 190 倒退 1 個是 189！',
    step: -1,
    numbers: [190, 189, 188, 187, 186, 185],
    blanks: [1, 4, 5]
  },
  {
    id: 'paper-4',
    title: '考卷第 (4) 題：10 個 10 個倒數（跨百退位與反推）',
    ruleDesc: '每次減少 10，205 倒退是 195；最左邊第一格反推加 10 是 215！',
    step: -10,
    numbers: [215, 205, 195, 185, 175],
    blanks: [0, 2]
  },
  {
    id: 'paper-5',
    title: '考卷第 (5) 題：10 個 10 個數（標準十位進階）',
    ruleDesc: '每次增加 10，個位 4 固定不動，十位依序增加！',
    step: 10,
    numbers: [124, 134, 144, 154, 164, 174],
    blanks: [1, 4]
  },
  {
    id: 'paper-6',
    title: '考卷第 (6) 題：10 個 10 個數（二位數跨百）',
    ruleDesc: '每次增加 10，99 加 10 跨入三位數變成 109！',
    step: 10,
    numbers: [89, 99, 109, 119, 129, 139],
    blanks: [2, 3]
  }
];

export function validateSequenceProgression(numbers, step) {
  if (!Array.isArray(numbers) || numbers.length < 2) return false;
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] + step !== numbers[i + 1]) {
      return false;
    }
  }
  return true;
}
