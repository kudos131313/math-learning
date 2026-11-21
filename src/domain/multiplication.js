/**
 * 九九乘法口訣、題庫生成與選項誘答演算法（純函式領域模組）
 */
import { numberToChinese, randInt } from './number-text.js';

export const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export const STORY_TEMPLATES = [
  { icon: '🍎', unit: '盤', item: '顆蘋果' },
  { icon: '✏️', unit: '盒', item: '枝鉛筆' },
  { icon: '🍪', unit: '袋', item: '片餅乾' },
  { icon: '🌸', unit: '朵花，每朵有', item: '片花瓣', flowerMode: true },
  { icon: '🚗', unit: '輛玩具車，每輛有', item: '個輪子', flowerMode: true }
];

/* 降低 1 乘法在隨機抽題中的權重（單段專練 1 段時不影響） */
export const ONE_FACTOR_WEIGHT = 0.15;

export function getMantra(a, b) {
  const p = a * b;
  const prefix = (CN_DIGITS[a] || a) + (CN_DIGITS[b] || b);
  if (p < 10) {
    return prefix + '得' + CN_DIGITS[p];
  }
  if (p === 10) {
    return prefix + '得十';
  }
  return prefix + numberToChinese(p);
}

export function getSpokenExplanation(a, b, shortOnly) {
  const p = a * b;
  const mantra = getMantra(a, b);
  if (shortOnly) {
    return mantra + '，' + a + ' 乘以 ' + b + ' 等於 ' + p;
  }
  return (
    mantra +
    '。' +
    a +
    ' 乘以 ' +
    b +
    ' 等於 ' +
    p +
    '，代表每組 ' +
    a +
    ' 個，共有 ' +
    b +
    ' 組，也就是 ' +
    b +
    ' 個 ' +
    a +
    ' 相加等於 ' +
    p +
    '。'
  );
}

export function pickWeightedItem(items, weightFn, randomFn = Math.random) {
  let total = 0;
  const weights = [];
  for (let i = 0; i < items.length; i++) {
    const w = Math.max(0.001, weightFn(items[i]));
    weights.push(w);
    total += w;
  }
  let r = randomFn() * total;
  for (let j = 0; j < items.length; j++) {
    r -= weights[j];
    if (r <= 0) return items[j];
  }
  return items[items.length - 1];
}

export function pickFactorB(randomFn = Math.random) {
  return pickWeightedItem(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    (n) => (n === 1 ? ONE_FACTOR_WEIGHT : 1),
    randomFn
  );
}

export function getPoolByLevel(level, tableFilter) {
  if (tableFilter !== 'all' && typeof tableFilter !== 'undefined') {
    const n = Number(tableFilter);
    if (n >= 1 && n <= 9) return [n];
  }
  if (level === 'basic') return [1, 2, 5];
  if (level === 'mid') return [3, 4, 6];
  if (level === 'hard') return [7, 8, 9];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

export function buildMulQuestion(a, b, qType, randIntFn = randInt) {
  let resolvedType = qType || 'standard';
  if (resolvedType === 'commutative' && a === b) {
    resolvedType = 'standard';
  }

  const product = a * b;
  const mantra = getMantra(a, b);

  let badge = '九九乘法練習';
  let hint = '想一想 ' + a + ' 的乘法口訣，算出正確答案！';
  let storyHtml = '';
  let spokenPrompt = '';
  let slots = [];

  if (resolvedType === 'standard') {
    badge = a + ' 的乘法口訣';
    hint = '每組 ' + a + ' 個，共有 ' + b + ' 組（' + b + ' 個 ' + a + ' 相加）是多少呢？';
    spokenPrompt = a + ' 乘以 ' + b + ' 等於多少？';
    slots = [{ id: 'ans', expected: product, maxLen: 2, label: '乘積答案' }];
  } else if (resolvedType === 'commutative') {
    badge = '交換律魔法配對';
    storyHtml = '✨ 交換律魔法：把兩個數字左右交換，積木總數還是一樣多喔！';
    hint = '想一想：' + b + ' × ' + a + ' 等於 ' + a + ' 乘以多少呢？';
    spokenPrompt = b + ' 乘以 ' + a + ' 等於 ' + a + ' 乘以多少？';
    slots = [{ id: 'ans', expected: b, maxLen: 1, label: '交換後的乘數' }];
  } else if (resolvedType === 'missing_b') {
    badge = '逆向填空挑戰';
    hint = '背背看 ' + a + ' 的口訣：' + a + ' 乘以多少會等於 ' + product + ' 呢？';
    spokenPrompt = a + ' 乘以多少等於 ' + product + '？';
    slots = [{ id: 'ans', expected: b, maxLen: 1, label: '未知乘數' }];
  } else if (resolvedType === 'missing_a') {
    badge = '逆向被乘數挑戰';
    hint = '想一想：哪一個數字乘以 ' + b + ' 會等於 ' + product + ' 呢？';
    spokenPrompt = '多少乘以 ' + b + ' 等於 ' + product + '？';
    slots = [{ id: 'ans', expected: a, maxLen: 1, label: '未知被乘數' }];
  } else {
    badge = '幾個幾 · 倍數概念';
    const tpl = STORY_TEMPLATES[randIntFn(0, STORY_TEMPLATES.length - 1)];
    const addStr = [];
    for (let i = 0; i < b; i++) addStr.push(a);
    const repeatedStr = addStr.join(' ＋ ');

    if (tpl.flowerMode) {
      storyHtml =
        tpl.icon +
        ' 有 <b>' +
        b +
        '</b> ' +
        tpl.unit +
        ' <b>' +
        a +
        '</b> ' +
        tpl.item +
        '<br><span style="font-size:13.5px;color:var(--ink-soft);">（連加算式：' +
        repeatedStr +
        ' ＝ <b>' +
        b +
        ' 個 ' +
        a +
        '</b>，也就是 <b>' +
        a +
        ' 的 ' +
        b +
        ' 倍</b>）</span>';
    } else {
      storyHtml =
        tpl.icon +
        ' 每' +
        tpl.unit +
        '有 <b>' +
        a +
        '</b> ' +
        tpl.item +
        '，共有 <b>' +
        b +
        '</b> ' +
        tpl.unit +
        '<br><span style="font-size:13.5px;color:var(--ink-soft);">（連加算式：' +
        repeatedStr +
        ' ＝ <b>' +
        b +
        ' 個 ' +
        a +
        '</b>，也就是 <b>' +
        a +
        ' 的 ' +
        b +
        ' 倍</b>）</span>';
    }
    hint = '請填入乘數（共有幾組）與最後的總數！';
    spokenPrompt =
      '每組有 ' +
      a +
      ' 個，共有 ' +
      b +
      ' 組，也就是 ' +
      b +
      ' 個 ' +
      a +
      ' 相加，寫成乘法算式是 ' +
      a +
      ' 乘以多少，等於多少？';
    slots = [
      { id: 'slot_b', expected: b, maxLen: 1, label: '乘數（幾組）' },
      { id: 'slot_p', expected: product, maxLen: 2, label: '總數乘積' }
    ];
  }

  return {
    a,
    b,
    product,
    qType: resolvedType,
    mantra,
    badge,
    hint,
    storyHtml,
    spokenPrompt,
    slots
  };
}

export function generateMulChoices(q, count = 4, randIntFn = randInt) {
  if (!q || !q.slots || q.slots.length !== 1) return [];
  const target = q.slots[0].expected;
  const candidates = [];

  function pushCand(val) {
    if (typeof val !== 'number' || Number.isNaN(val)) return;
    if (val <= 0 || val > 81) return;
    if (val === target) return;
    if (candidates.indexOf(val) === -1) candidates.push(val);
  }

  if (q.qType === 'commutative') {
    pushCand(q.a);
    pushCand(q.product);
    pushCand(target - 1);
    pushCand(target + 1);
    pushCand(target + 2);
    for (let cn = 1; cn <= 9; cn++) {
      if (candidates.length >= 6) break;
      pushCand(cn);
    }
  } else if (q.qType === 'missing_a' || q.qType === 'missing_b') {
    pushCand(target - 1);
    pushCand(target + 1);
    pushCand(target - 2);
    pushCand(target + 2);
    for (let n = 1; n <= 9; n++) {
      if (candidates.length >= 6) break;
      pushCand(n);
    }
  } else {
    pushCand(q.a * (q.b + 1));
    pushCand(q.a * (q.b - 1));
    pushCand((q.a + 1) * q.b);
    pushCand((q.a - 1) * q.b);
    pushCand(q.a + q.b);
    pushCand(target + 10);
    pushCand(target - 10);
    pushCand(target + 2);
    pushCand(target - 2);
    pushCand(target + 1);
    pushCand(target - 1);
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = randIntFn(0, i);
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }

  const options = [target];
  for (let k = 0; k < candidates.length && options.length < count; k++) {
    options.push(candidates[k]);
  }
  while (options.length < count) {
    const fallback = randIntFn(1, 81);
    if (options.indexOf(fallback) === -1) options.push(fallback);
  }

  for (let m = options.length - 1; m > 0; m--) {
    const r = randIntFn(0, m);
    const swap = options[m];
    options[m] = options[r];
    options[r] = swap;
  }
  return options;
}
