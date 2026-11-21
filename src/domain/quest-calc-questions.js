/**
 * 陽光加減群島：加減法題庫引擎、單步驟生活應用題不變量檢查、選擇題誘答與救援快照還原（純函式領域模組）
 */
import { randInt } from './number-text.js';
import { getCalcDecomp } from './vertical-calc.js';

export const ALLOWED_SUNNY_SKILL_TAGS = [
  'add_2d_plain',
  'sub_2d_plain',
  'add_2d_carry',
  'sub_2d_borrow',
  'add_3d',
  'sub_3d',
  'sub_across_zero',
  'calc_missing',
  'word_buy_change',
  'word_compare'
];

export const TAIWAN_CHANGE_BILLS = [50, 100, 150, 200, 300, 500];

const COMPARE_ACTORS = ['小兔', '熊熊', '小貓', '企鵝', '狐狸', '松鼠', '小狗', '鴨鴨'];

const BAKERY_PLAIN_TEMPLATES = [
  {
    id: 'bakery_plain_merge_croissant',
    op: 'add',
    icon: '🥐',
    unit: '個',
    buildStory: (a, b) =>
      `🥐 麵包師傅早上烤了 <b>${a}</b> 個牛角可頌，下午又烤了 <b>${b}</b> 個牛奶餐包，今天一共烤了幾個麵包？`,
    buildSpoken: (a, b) => `麵包師傅早上烤了 ${a} 個牛角可頌，下午又烤了 ${b} 個牛奶餐包，今天一共烤了幾個麵包？`,
    hint: '把早上和下午烤的麵包數量合起來算算看！'
  },
  {
    id: 'bakery_plain_merge_toast',
    op: 'add',
    icon: '🍞',
    unit: '條',
    buildStory: (a, b) =>
      `🍞 架上有 <b>${a}</b> 條鮮奶吐司和 <b>${b}</b> 條葡萄吐司，架上一共有幾條吐司？`,
    buildSpoken: (a, b) => `架上有 ${a} 條鮮奶吐司和 ${b} 條葡萄吐司，架上一共有幾條吐司？`,
    hint: '將兩種吐司的數量加起來，就能算出總數喔！'
  },
  {
    id: 'bakery_plain_sell_muffin',
    op: 'sub',
    icon: '🧁',
    unit: '個',
    buildStory: (a, b) =>
      `🧁 盤子裡原來有 <b>${a}</b> 個藍莓馬芬蛋糕，被客人買走了 <b>${b}</b> 個，現在還剩下幾個？`,
    buildSpoken: (a, b) => `盤子裡原來有 ${a} 個藍莓馬芬蛋糕，被客人買走了 ${b} 個，現在還剩下幾個？`,
    hint: '從原來的數量拿走賣掉的數量，用減法算算看！'
  },
  {
    id: 'bakery_plain_sell_bagel',
    op: 'sub',
    icon: '🥯',
    unit: '個',
    buildStory: (a, b) =>
      `🥯 麵包籃裡一共有 <b>${a}</b> 個原味貝果，分給小朋友吃掉 <b>${b}</b> 個後，籃子裡還剩幾個貝果？`,
    buildSpoken: (a, b) => `麵包籃裡一共有 ${a} 個原味貝果，分給小朋友吃掉 ${b} 個後，籃子裡還剩幾個貝果？`,
    hint: '吃掉後變少了，從全部減掉吃掉的數量！'
  }
];

const BUY_MERGE_CARRY_TEMPLATES = [
  {
    id: 'candy_merge_lollipop',
    icon: '🍭',
    unit: '元',
    itemA: '彩虹棒棒糖',
    itemB: '草莓棉花糖',
    buildStory: (a, b) =>
      `🍭 買一支彩虹棒棒糖要 <b>${a}</b> 元，再買一包草莓棉花糖要 <b>${b}</b> 元，合起來一共要付幾元？`,
    buildSpoken: (a, b) => `買一支彩虹棒棒糖要 ${a} 元，再買一包草莓棉花糖要 ${b} 元，合起來一共要付幾元？`
  },
  {
    id: 'candy_merge_gummy',
    icon: '🍬',
    unit: '顆',
    itemA: '橘子軟糖',
    itemB: '葡萄硬糖',
    buildStory: (a, b) =>
      `🍬 玻璃罐裡有 <b>${a}</b> 顆橘子軟糖和 <b>${b}</b> 顆葡萄硬糖，罐子裡一共有幾顆糖果？`,
    buildSpoken: (a, b) => `玻璃罐裡有 ${a} 顆橘子軟糖和 ${b} 顆葡萄硬糖，罐子裡一共有幾顆糖果？`
  },
  {
    id: 'candy_merge_choco',
    icon: '🍫',
    unit: '元',
    itemA: '牛奶巧克力',
    itemB: '核桃餅乾',
    buildStory: (a, b) =>
      `🍫 牛奶巧克力賣 <b>${a}</b> 元，核桃餅乾賣 <b>${b}</b> 元，兩種各買一份共要幾元？`,
    buildSpoken: (a, b) => `牛奶巧克力賣 ${a} 元，核桃餅乾賣 ${b} 元，兩種各買一份共要幾元？`
  },
  {
    id: 'candy_merge_donut',
    icon: '🍩',
    unit: '元',
    itemA: '草莓甜甜圈',
    itemB: '香草泡芙',
    buildStory: (a, b) =>
      `🍩 草莓甜甜圈一個 <b>${a}</b> 元，香草泡芙一個 <b>${b}</b> 元，合起來共要幾元？`,
    buildSpoken: (a, b) => `草莓甜甜圈一個 ${a} 元，香草泡芙一個 ${b} 元，合起來共要幾元？`
  }
];

const BUY_CHANGE_SMALL_TEMPLATES = [
  { id: 'change_shell', icon: '🐚', item: '貝殼風鈴', unit: '元' },
  { id: 'change_sticker', icon: '🌟', item: '珍珠貼紙簿', unit: '元' },
  { id: 'change_drink', icon: '🧃', item: '海灣氣泡飲', unit: '元' },
  { id: 'change_pouch', icon: '👛', item: '泡泡零錢包', unit: '元' }
];

const BUY_CHANGE_LARGE_TEMPLATES = [
  { id: 'change_blocks', icon: '🧱', item: '彩色木積木盒', unit: '元' },
  { id: 'change_puzzle', icon: '🧩', item: '城堡拼圖組', unit: '元' },
  { id: 'change_lantern', icon: '🏮', item: '彩虹小夜燈', unit: '元' },
  { id: 'change_backpack', icon: '🎒', item: '市集小背包', unit: '元' }
];

const COMPARE_TEMPLATES = [
  { id: 'compare_shells', icon: '🐚', noun: '閃亮貝殼', unit: '顆' },
  { id: 'compare_stickers', icon: '⭐', noun: '星星貼紙', unit: '張' },
  { id: 'compare_marbles', icon: '🔮', noun: '彩色彈珠', unit: '顆' },
  { id: 'compare_blocks', icon: '🧱', noun: '彩色積木', unit: '塊' }
];

let qSeqCounter = 0;

function pickFrom(arr, randIntFn) {
  return arr[randIntFn(0, arr.length - 1)];
}

function pickTwoActors(randIntFn) {
  const idxA = randIntFn(0, COMPARE_ACTORS.length - 1);
  let idxB = randIntFn(0, COMPARE_ACTORS.length - 2);
  if (idxB >= idxA) idxB += 1;
  return [COMPARE_ACTORS[idxA], COMPARE_ACTORS[idxB]];
}

function buildCalcExplanation(a, b, op, answer, decomp) {
  const sym = op === 'add' ? '＋' : '−';
  if (op === 'add') {
    const carryDesc =
      decomp.carry_o > 0 && decomp.carry_t > 0
        ? '個位滿十進 1 到十位，十位也滿十進 1 到百位！'
        : decomp.carry_o > 0
          ? '個位滿十記得向十位進 1 喔！'
          : decomp.carry_t > 0
            ? '十位滿十記得向百位進 1 喔！'
            : '個位、十位對齊直接相加！';
    return {
      html: `✨ <b>${a} ${sym} ${b} ＝ ${answer}</b>（${carryDesc}）`,
      spoken: `答對了！${a} 加 ${b} 等於 ${answer}`
    };
  }
  const borrowDesc = decomp.isAcrossZeroBorrow
    ? '十位是 0，先向百位借 1 拆成 10 個十，再借 1 個十給個位，十位剩 9！'
    : decomp.needsBorrow_o && decomp.needsBorrow_t
      ? '個位不夠向十位借 1，十位不夠再向百位借 1！'
      : decomp.needsBorrow_o
        ? '個位不夠減，向十位借 1 條十拆成 10 個一！'
        : decomp.needsBorrow_t
          ? '十位不夠減，向百位借 1 片百拆成 10 條十！'
          : '個位與十位夠減，對齊直接相減！';
  return {
    html: `✨ <b>${a} ${sym} ${b} ＝ ${answer}</b>（${borrowDesc}）`,
    spoken: `答對了！${a} 減 ${b} 等於 ${answer}`
  };
}

function pickBillForPrice(price, randIntFn) {
  // 依台灣日常付錢習慣挑選最合理面額（確保找零恆 >= 3 且非大額找零關不出現三位數零錢）
  if (price <= 44) {
    return randIntFn(0, 1) === 0 ? 50 : 100;
  }
  if (price <= 54) {
    return 100;
  }
  if (price <= 92) {
    return randIntFn(0, 2) === 0 ? 150 : 100;
  }
  if (price <= 142) {
    return randIntFn(0, 1) === 0 ? 150 : 200;
  }
  if (price <= 190) {
    return randIntFn(0, 2) === 0 ? 300 : 200;
  }
  if (price <= 288) {
    return 300;
  }
  return 500;
}

function generateOperandsByType(calcType, randIntFn, options = {}) {
  if (calcType === 'add_2d_plain') {
    const ao = randIntFn(1, 8);
    const bo = randIntFn(1, 9 - ao);
    const at = randIntFn(1, 7);
    const bt = randIntFn(1, 9 - at);
    return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 2 };
  }

  if (calcType === 'sub_2d_plain') {
    const ao = randIntFn(2, 9);
    const bo = randIntFn(1, ao);
    const at = randIntFn(2, 9);
    const bt = randIntFn(1, at - 1);
    return { op: 'sub', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 2 };
  }

  if (calcType === 'add_tens') {
    const isAdd = randIntFn(0, 1) === 0;
    if (isAdd) {
      const at = randIntFn(1, 7);
      const bt = randIntFn(1, 9 - at);
      return { op: 'add', a: at * 10, b: bt * 10, maxLen: 2 };
    }
    const at = randIntFn(3, 9);
    const bt = randIntFn(1, at - 1);
    return { op: 'sub', a: at * 10, b: bt * 10, maxLen: 2 };
  }

  if (calcType === 'add_make_ten') {
    const ao = randIntFn(1, 9);
    const bo = 10 - ao;
    const at = randIntFn(1, 7);
    const bt = randIntFn(1, 8 - at);
    return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 2 };
  }

  if (calcType === 'add_2d_carry') {
    const ao = randIntFn(2, 9);
    const bo = randIntFn(10 - ao, 9);
    const at = randIntFn(1, 7);
    const bt = randIntFn(1, 8 - at);
    return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 2 };
  }

  if (calcType === 'add_2d_double_carry') {
    const ao = randIntFn(2, 9);
    const bo = randIntFn(10 - ao, 9);
    const at = randIntFn(2, 9);
    const bt = randIntFn(9 - at, 9);
    return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 3 };
  }

  if (calcType === 'sub_2d_borrow') {
    const ao = randIntFn(0, 8);
    const bo = randIntFn(ao + 1, 9);
    const at = randIntFn(2, 9);
    let bt = randIntFn(1, at - 1);
    if ((at * 10 + ao) - (bt * 10 + bo) < 5 && bt > 1) {
      bt -= 1;
    }
    return { op: 'sub', a: at * 10 + ao, b: bt * 10 + bo, maxLen: 2 };
  }

  if (calcType === 'add_3d') {
    for (let t = 0; t < 30; t++) {
      const a = randIntFn(115, 689);
      const b = randIntFn(45, 999 - a);
      const d = getCalcDecomp(a, b, 'add');
      if (d.carry_o > 0 || d.carry_t > 0) {
        return { op: 'add', a, b, maxLen: 3 };
      }
    }
    return { op: 'add', a: 248, b: 175, maxLen: 3 };
  }

  if (calcType === 'sub_3d') {
    for (let t = 0; t < 40; t++) {
      const ah = randIntFn(2, 8);
      const at = randIntFn(2, 8);
      const ao = randIntFn(0, 7);
      const a = ah * 100 + at * 10 + ao;
      const bh = randIntFn(0, ah - 1);
      const bt = randIntFn(1, at - 1);
      const bo = randIntFn(ao + 1, 9);
      const b = bh * 100 + bt * 10 + bo;
      const d = getCalcDecomp(a, b, 'sub');
      if (a - b >= 15 && !d.isAcrossZeroBorrow && (d.needsBorrow_o || d.needsBorrow_t)) {
        return { op: 'sub', a, b, maxLen: 3 };
      }
    }
    return { op: 'sub', a: 452, b: 128, maxLen: 3 };
  }

  if (calcType === 'sub_across_zero') {
    for (let t = 0; t < 40; t++) {
      const ah = randIntFn(1, 5);
      const ao = randIntFn(0, 4) === 0 ? 0 : randIntFn(1, 7);
      const a = ah * 100 + ao;
      const bo = randIntFn(ao + 1, 9);
      const bt = randIntFn(1, 8);
      const bh = ah > 1 && randIntFn(0, 2) === 0 ? randIntFn(1, ah - 1) : 0;
      const b = bh * 100 + bt * 10 + bo;
      const d = getCalcDecomp(a, b, 'sub');
      if (a - b >= 11 && d.isAcrossZeroBorrow) {
        return { op: 'sub', a, b, maxLen: 3 };
      }
    }
    return { op: 'sub', a: 205, b: 68, maxLen: 3 };
  }

  if (calcType === 'calc_missing_add') {
    const a = randIntFn(12, 72);
    const b = randIntFn(12, 98 - a);
    const missingSlot = randIntFn(0, 1) === 0 ? 'left' : 'right';
    return { op: 'add', a, b, missingSlot, maxLen: 2 };
  }

  if (calcType === 'calc_missing_sub') {
    const ans = randIntFn(12, 62);
    const b = randIntFn(12, 95 - ans);
    const a = ans + b;
    const missingSlot = randIntFn(0, 1) === 0 ? 'right' : 'left';
    return { op: 'sub', a, b, missingSlot, maxLen: 2 };
  }

  if (calcType === 'word_bakery_plain') {
    const avoidId = options.avoidTemplateId || '';
    const pool = BAKERY_PLAIN_TEMPLATES.filter((tpl) => tpl.id !== avoidId);
    const tpl = pickFrom(pool.length > 0 ? pool : BAKERY_PLAIN_TEMPLATES, randIntFn);
    if (tpl.op === 'add') {
      const ao = randIntFn(1, 8);
      const bo = randIntFn(1, 9 - ao);
      const at = randIntFn(1, 7);
      const bt = randIntFn(1, 8 - at);
      return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, templateId: tpl.id, maxLen: 2 };
    }
    const ao = randIntFn(2, 9);
    const bo = randIntFn(1, ao);
    const at = randIntFn(2, 9);
    const bt = randIntFn(1, at - 1);
    return { op: 'sub', a: at * 10 + ao, b: bt * 10 + bo, templateId: tpl.id, maxLen: 2 };
  }

  if (calcType === 'word_buy_merge_carry') {
    const avoidId = options.avoidTemplateId || '';
    const pool = BUY_MERGE_CARRY_TEMPLATES.filter((tpl) => tpl.id !== avoidId);
    const tpl = pickFrom(pool.length > 0 ? pool : BUY_MERGE_CARRY_TEMPLATES, randIntFn);
    const ao = randIntFn(2, 9);
    const bo = randIntFn(10 - ao, 9);
    const at = randIntFn(1, 8);
    const bt = randIntFn(1, 8);
    return { op: 'add', a: at * 10 + ao, b: bt * 10 + bo, templateId: tpl.id, maxLen: 3 };
  }

  if (calcType === 'word_buy_change' || calcType === 'word_buy_change_large') {
    const isLarge = calcType === 'word_buy_change_large';
    const baseList = isLarge ? BUY_CHANGE_LARGE_TEMPLATES : BUY_CHANGE_SMALL_TEMPLATES;
    const avoidId = options.avoidTemplateId || '';
    const pool = baseList.filter((tpl) => tpl.id !== avoidId);
    const tpl = pickFrom(pool.length > 0 ? pool : baseList, randIntFn);

    let price;
    if (isLarge) {
      const ph = randIntFn(1, 2);
      const pt = randIntFn(1, 8);
      const po = randIntFn(1, 9);
      price = ph * 100 + pt * 10 + po;
    } else {
      const pt = randIntFn(1, 8);
      const po = randIntFn(1, 9);
      price = pt * 10 + po;
    }
    const paid = pickBillForPrice(price, randIntFn);
    return { op: 'sub', a: paid, b: price, paid, price, templateId: tpl.id, maxLen: isLarge ? 3 : 2 };
  }

  if (calcType === 'word_compare' || calcType === 'word_compare_large') {
    const isLarge = calcType === 'word_compare_large';
    const avoidId = options.avoidTemplateId || '';
    const pool = COMPARE_TEMPLATES.filter((tpl) => tpl.id !== avoidId);
    const tpl = pickFrom(pool.length > 0 ? pool : COMPARE_TEMPLATES, randIntFn);
    const [actorA, actorB] = pickTwoActors(randIntFn);
    const variants = ['diff', 'find_more', 'reverse_more', 'reverse_less'];
    const compareVariant = pickFrom(variants, randIntFn);

    let big, small, diff;
    if (isLarge) {
      small = randIntFn(108, 420);
      diff = randIntFn(24, 185);
      big = small + diff;
    } else {
      small = randIntFn(14, 58);
      diff = randIntFn(9, 36);
      big = small + diff;
    }

    let op = 'sub';
    let a = big;
    let b = small;
    if (compareVariant === 'diff') {
      op = 'sub';
      a = big;
      b = small;
    } else if (compareVariant === 'find_more') {
      op = 'add';
      a = small;
      b = diff;
    } else if (compareVariant === 'reverse_more') {
      op = 'sub';
      a = big;
      b = diff;
    } else {
      op = 'add';
      a = small;
      b = diff;
    }

    return {
      op,
      a,
      b,
      big,
      small,
      diff,
      actorA,
      actorB,
      compareVariant,
      templateId: tpl.id,
      maxLen: isLarge ? 3 : 2
    };
  }

  return generateOperandsByType('add_2d_plain', randIntFn, options);
}

/**
 * 依據快照參數重建完整的加減法／生活應用題（支援初始出題與求救小精靈還原）
 */
export function buildCalcQuestionFromSpec(spec, options = {}) {
  const {
    calcType = 'add_2d_plain',
    templateId = 'pure_' + calcType,
    op = 'add',
    a = 23,
    b = 14,
    missingSlot = null,
    maxLen = 2,
    paid = null,
    price = null,
    actorA = '小兔',
    actorB = '熊熊',
    compareVariant = 'diff',
    big = null,
    small = null,
    diff = null
  } = spec;

  const uiMode = options.uiMode || 'keypad';
  qSeqCounter += 1;
  const qId = options.id || `sunny_q_${qSeqCounter}`;

  // 1. 未知數填空題 (calc_missing_add / calc_missing_sub)
  if (calcType === 'calc_missing_add' || calcType === 'calc_missing_sub') {
    const isAdd = op === 'add';
    const c = isAdd ? a + b : a - b;
    const target = missingSlot === 'left' ? a : b;
    const eqModel = isAdd
      ? {
          op: 'add',
          left: missingSlot === 'left' ? null : a,
          right: missingSlot === 'right' ? null : b,
          result: c,
          missingSlot
        }
      : {
          op: 'sub',
          left: missingSlot === 'left' ? null : a,
          right: missingSlot === 'right' ? null : b,
          result: c,
          missingSlot
        };

    const spokenPrompt = isAdd
      ? missingSlot === 'left'
        ? `多少加 ${b} 等於 ${c}？`
        : `${a} 加多少等於 ${c}？`
      : missingSlot === 'left'
        ? `多少減 ${b} 等於 ${c}？`
        : `${a} 減多少等於 ${c}？`;

    const explanationHtml = isAdd
      ? `✨ <b>${a} ＋ ${b} ＝ ${c}</b>（想一想：用總和 <b>${c} − ${missingSlot === 'left' ? b : a} ＝ ${target}</b> 就找到空格裡的數！）`
      : missingSlot === 'right'
        ? `✨ <b>${a} − ${b} ＝ ${c}</b>（從原來的 <b>${a}</b> 減掉剩下的 <b>${c}</b>，就知道拿走了 <b>${b}</b>！）`
        : `✨ <b>${a} − ${b} ＝ ${c}</b>（把減掉的 <b>${b}</b> 和剩下的 <b>${c}</b> 加起來，原本有 <b>${a}</b>！）`;

    const dedupeKey = `sunny:calc_missing:${op}_${missingSlot}:${a}_${b}`;
    return {
      id: qId,
      realm: 'sunny',
      kind: 'calc_missing',
      calcType,
      templateId: 'pure_' + calcType,
      skillTag: 'calc_missing',
      uiMode,
      stepMode: 'single',
      displayFormat: 'equation',
      canToggleFormat: false,
      badge: '🔍 神秘缺角算式',
      hint: isAdd ? '想一想，填上哪一個數字會讓等號兩邊相等？' : '仔細想想被減數或減數是多少！',
      storyHtml: '',
      equationModel: eqModel,
      spokenPrompt,
      a,
      b,
      op,
      answer: target,
      slots: [{ id: 'ans', expected: target, maxLen: 2, label: '未知數字' }],
      helperSpec: {
        type: 'base10_calc',
        mode: 'missing',
        a,
        b,
        c,
        op,
        missingSlot,
        decomp: getCalcDecomp(a, b, op)
      },
      rescueDedupeKey: dedupeKey,
      rescueSnapshot: {
        calcType,
        templateId: 'pure_' + calcType,
        op,
        a,
        b,
        missingSlot,
        maxLen: 2
      },
      explanationHtml,
      spokenExplanation: `答對了！空格裡的數字是 ${target}`
    };
  }

  // 2. 麵包村無進退位應用題
  if (calcType === 'word_bakery_plain') {
    const tpl = BAKERY_PLAIN_TEMPLATES.find((t) => t.id === templateId) || BAKERY_PLAIN_TEMPLATES[0];
    const answer = op === 'add' ? a + b : a - b;
    const decomp = getCalcDecomp(a, b, op);
    const exp = buildCalcExplanation(a, b, op, answer, decomp);
    return {
      id: qId,
      realm: 'sunny',
      kind: 'word_single',
      calcType,
      templateId: tpl.id,
      skillTag: 'word_buy_change',
      uiMode,
      stepMode: 'single',
      displayFormat: 'equation',
      canToggleFormat: true,
      badge: `${tpl.icon} 麵包村小任務`,
      hint: tpl.hint,
      storyHtml: tpl.buildStory(a, b),
      equationModel: { op, left: a, right: b, result: null, missingSlot: 'result', unit: tpl.unit },
      spokenPrompt: tpl.buildSpoken(a, b),
      a,
      b,
      op,
      answer,
      slots: [{ id: 'ans', expected: answer, maxLen: 2, label: `答案（${tpl.unit}）` }],
      helperSpec: {
        type: 'base10_calc',
        mode: 'normal',
        a,
        b,
        op,
        decomp
      },
      rescueDedupeKey: `sunny:${tpl.id}:${a}_${b}`,
      rescueSnapshot: { calcType, templateId: tpl.id, op, a, b, maxLen: 2 },
      explanationHtml: exp.html,
      spokenExplanation: exp.spoken
    };
  }

  // 3. 糖果鎮購物合併進位應用題
  if (calcType === 'word_buy_merge_carry') {
    const tpl = BUY_MERGE_CARRY_TEMPLATES.find((t) => t.id === templateId) || BUY_MERGE_CARRY_TEMPLATES[0];
    const answer = a + b;
    const decomp = getCalcDecomp(a, b, 'add');
    const exp = buildCalcExplanation(a, b, 'add', answer, decomp);
    return {
      id: qId,
      realm: 'sunny',
      kind: 'word_single',
      calcType,
      templateId: tpl.id,
      skillTag: 'word_buy_change',
      uiMode,
      stepMode: 'single',
      displayFormat: 'vertical_mini',
      canToggleFormat: true,
      badge: `${tpl.icon} 糖果合併採購`,
      hint: '把兩個價錢或數量合起來，注意個位滿十進位！',
      storyHtml: tpl.buildStory(a, b),
      equationModel: { op: 'add', left: a, right: b, result: null, missingSlot: 'result', unit: tpl.unit },
      spokenPrompt: tpl.buildSpoken(a, b),
      a,
      b,
      op: 'add',
      answer,
      slots: [{ id: 'ans', expected: answer, maxLen: 3, label: `答案（${tpl.unit}）` }],
      helperSpec: {
        type: 'base10_calc',
        mode: 'normal',
        a,
        b,
        op: 'add',
        decomp
      },
      rescueDedupeKey: `sunny:${tpl.id}:${a}_${b}`,
      rescueSnapshot: { calcType, templateId: tpl.id, op: 'add', a, b, maxLen: 3 },
      explanationHtml: exp.html,
      spokenExplanation: exp.spoken
    };
  }

  // 4. 購物付錢找零應用題
  if (calcType === 'word_buy_change' || calcType === 'word_buy_change_large') {
    const isLarge = calcType === 'word_buy_change_large';
    const list = isLarge ? BUY_CHANGE_LARGE_TEMPLATES : BUY_CHANGE_SMALL_TEMPLATES;
    const tpl = list.find((t) => t.id === templateId) || list[0];
    const paidAmt = Number(paid || a);
    const itemPrice = Number(price || b);
    const answer = paidAmt - itemPrice;
    const decomp = getCalcDecomp(paidAmt, itemPrice, 'sub');
    const exp = buildCalcExplanation(paidAmt, itemPrice, 'sub', answer, decomp);
    const resolvedChangeMaxLen = answer >= 100 || isLarge ? 3 : 2;
    return {
      id: qId,
      realm: 'sunny',
      kind: 'word_single',
      calcType,
      templateId: tpl.id,
      skillTag: 'word_buy_change',
      uiMode,
      stepMode: 'single',
      displayFormat: 'vertical_mini',
      canToggleFormat: true,
      badge: '🛒 購物找零',
      hint: '用付出的錢減去商品價格，就是老闆要找回的錢喔！',
      storyHtml: `${tpl.icon} 買一個 <b>${tpl.item}</b> 要 <b>${itemPrice}</b> 元，拿一張或合起來 <b>${paidAmt}</b> 元去結帳，應該找回幾元？`,
      equationModel: { op: 'sub', left: paidAmt, right: itemPrice, result: null, missingSlot: 'result', unit: '元' },
      spokenPrompt: `買一個 ${tpl.item} 要 ${itemPrice} 元，付了 ${paidAmt} 元，應該找回幾元？`,
      a: paidAmt,
      b: itemPrice,
      paid: paidAmt,
      price: itemPrice,
      op: 'sub',
      answer,
      slots: [{ id: 'ans', expected: answer, maxLen: resolvedChangeMaxLen, label: '找零金額（元）' }],
      helperSpec: {
        type: 'base10_calc',
        mode: 'normal',
        a: paidAmt,
        b: itemPrice,
        op: 'sub',
        decomp
      },
      rescueDedupeKey: `sunny:${tpl.id}:${paidAmt}-${itemPrice}`,
      rescueSnapshot: {
        calcType,
        templateId: tpl.id,
        op: 'sub',
        a: paidAmt,
        b: itemPrice,
        paid: paidAmt,
        price: itemPrice,
        maxLen: resolvedChangeMaxLen
      },
      explanationHtml: exp.html,
      spokenExplanation: exp.spoken
    };
  }

  // 5. 比多／比少生活應用題（含逆向語意）
  if (calcType === 'word_compare' || calcType === 'word_compare_large') {
    const isLarge = calcType === 'word_compare_large';
    const tpl = COMPARE_TEMPLATES.find((t) => t.id === templateId) || COMPARE_TEMPLATES[0];
    const bigVal = Number(big || (op === 'add' ? a + b : a));
    const smallVal = Number(small || (op === 'add' ? a : a - b));
    const diffVal = Number(diff || (bigVal - smallVal));
    const answer = op === 'add' ? a + b : a - b;
    const decomp = getCalcDecomp(a, b, op);
    const exp = buildCalcExplanation(a, b, op, answer, decomp);

    let storyHtml = '';
    let spokenPrompt = '';
    let barSpec = {};

    if (compareVariant === 'diff') {
      storyHtml = `${tpl.icon} <b>${actorA}</b> 有 <b>${bigVal}</b> ${tpl.unit}${tpl.noun}，<b>${actorB}</b> 有 <b>${smallVal}</b> ${tpl.unit}，${actorA} 比 ${actorB} 多幾${tpl.unit}？`;
      spokenPrompt = `${actorA} 有 ${bigVal} ${tpl.unit}${tpl.noun}，${actorB} 有 ${smallVal} ${tpl.unit}，${actorA} 比 ${actorB} 多幾${tpl.unit}？`;
      barSpec = {
        type: 'bar_diagram',
        mode: 'compare',
        topLabel: actorA,
        topText: `${bigVal} ${tpl.unit}`,
        bottomLabel: actorB,
        bottomText: `${smallVal} ${tpl.unit}`,
        diffText: `多 ？ ${tpl.unit}`,
        prompt: '兩條數量比一比：大數減小數就能知道相差多少喔！'
      };
    } else if (compareVariant === 'find_more') {
      storyHtml = `${tpl.icon} <b>${actorA}</b> 有 <b>${smallVal}</b> ${tpl.unit}${tpl.noun}，<b>${actorB}</b> 比 ${actorA} <b>多 ${diffVal}</b> ${tpl.unit}，${actorB} 有幾${tpl.unit}？`;
      spokenPrompt = `${actorA} 有 ${smallVal} ${tpl.unit}${tpl.noun}，${actorB} 比 ${actorA} 多 ${diffVal} ${tpl.unit}，${actorB} 有幾${tpl.unit}？`;
      barSpec = {
        type: 'bar_diagram',
        mode: 'compare',
        topLabel: actorB,
        topText: `？ ${tpl.unit}`,
        bottomLabel: actorA,
        bottomText: `${smallVal} ${tpl.unit}`,
        diffText: `多 ${diffVal} ${tpl.unit}`,
        prompt: `${actorB} 比 ${actorA} 多，要求比較長的那一條，要用加法！`
      };
    } else if (compareVariant === 'reverse_more') {
      storyHtml = `${tpl.icon} <b>${actorA}</b> 有 <b>${bigVal}</b> ${tpl.unit}${tpl.noun}，<b>${actorA} 比 ${actorB} 多 ${diffVal}</b> ${tpl.unit}，請問 <b>${actorB}</b> 有幾${tpl.unit}？`;
      spokenPrompt = `${actorA} 有 ${bigVal} ${tpl.unit}${tpl.noun}，${actorA} 比 ${actorB} 多 ${diffVal} ${tpl.unit}，請問 ${actorB} 有幾${tpl.unit}？`;
      barSpec = {
        type: 'bar_diagram',
        mode: 'compare',
        topLabel: actorA,
        topText: `${bigVal} ${tpl.unit}`,
        bottomLabel: actorB,
        bottomText: `？ ${tpl.unit}`,
        diffText: `相差 ${diffVal} ${tpl.unit}`,
        prompt: `看清楚誰比較多！${actorA} 比較多，所以 ${actorB} 比較少，要用減法算！`
      };
    } else {
      // reverse_less
      storyHtml = `${tpl.icon} <b>${actorA}</b> 有 <b>${smallVal}</b> ${tpl.unit}${tpl.noun}，<b>${actorA} 比 ${actorB} 少 ${diffVal}</b> ${tpl.unit}，請問 <b>${actorB}</b> 有幾${tpl.unit}？`;
      spokenPrompt = `${actorA} 有 ${smallVal} ${tpl.unit}${tpl.noun}，${actorA} 比 ${actorB} 少 ${diffVal} ${tpl.unit}，請問 ${actorB} 有幾${tpl.unit}？`;
      barSpec = {
        type: 'bar_diagram',
        mode: 'compare',
        topLabel: actorB,
        topText: `？ ${tpl.unit}`,
        bottomLabel: actorA,
        bottomText: `${smallVal} ${tpl.unit}`,
        diffText: `少 ${diffVal} ${tpl.unit}`,
        prompt: `想一想誰比較多！${actorA} 比較少，所以 ${actorB} 比較多，要用加法算！`
      };
    }

    const resolvedCompareMaxLen = answer >= 100 || isLarge ? 3 : 2;
    return {
      id: qId,
      realm: 'sunny',
      kind: 'word_single',
      calcType,
      templateId: tpl.id,
      skillTag: 'word_compare',
      uiMode,
      stepMode: 'single',
      displayFormat: 'vertical_mini',
      canToggleFormat: true,
      badge: '⚖️ 比多比少挑戰',
      hint: '先看清楚誰比較多、誰比較少，再決定要用加還是減喔！',
      storyHtml,
      equationModel: { op, left: a, right: b, result: null, missingSlot: 'result', unit: tpl.unit },
      spokenPrompt,
      a,
      b,
      op,
      answer,
      actorA,
      actorB,
      slots: [{ id: 'ans', expected: answer, maxLen: resolvedCompareMaxLen, label: `答案（${tpl.unit}）` }],
      helperSpec: barSpec,
      rescueDedupeKey: `sunny:${tpl.id}:${compareVariant}:${a}_${b}`,
      rescueSnapshot: {
        calcType,
        templateId: tpl.id,
        op,
        a,
        b,
        actorA,
        actorB,
        compareVariant,
        big: bigVal,
        small: smallVal,
        diff: diffVal,
        maxLen: resolvedCompareMaxLen
      },
      explanationHtml: exp.html,
      spokenExplanation: exp.spoken
    };
  }

  // 6. 純加減算式（二～三位數、進退位與跨零退位）
  const answer = op === 'add' ? a + b : a - b;
  const decomp = getCalcDecomp(a, b, op);
  const exp = buildCalcExplanation(a, b, op, answer, decomp);
  const resolvedMaxLen = answer >= 100 || a >= 100 || maxLen === 3 ? 3 : 2;

  const metaMap = {
    add_2d_plain: { kind: 'add', skillTag: 'add_2d_plain', fmt: 'equation', badge: '☀️ 二位數加法', hint: '個位加個位、十位加十位！' },
    sub_2d_plain: { kind: 'sub', skillTag: 'sub_2d_plain', fmt: 'equation', badge: '🍃 二位數減法', hint: '個位減個位、十位減十位！' },
    add_tens: {
      kind: op,
      skillTag: op === 'add' ? 'add_2d_plain' : 'sub_2d_plain',
      fmt: 'equation',
      badge: '🔟 整十加減快算',
      hint: '把十位數合起來或減掉，個位保持 0！'
    },
    add_make_ten: { kind: 'add', skillTag: 'add_2d_plain', fmt: 'equation', badge: '✨ 湊十好味道', hint: '個位剛好湊成 10，進給十位變成整十喔！' },
    add_2d_carry: { kind: 'add', skillTag: 'add_2d_carry', fmt: 'vertical_mini', badge: '🔥 滿十進位加法', hint: '個位相加超過 9 時，記得滿十向十位進 1！' },
    add_2d_double_carry: { kind: 'add', skillTag: 'add_2d_carry', fmt: 'vertical_mini', badge: '💥 連續進位破百', hint: '個位進十位、十位又滿十進到百位喔！' },
    sub_2d_borrow: { kind: 'sub', skillTag: 'sub_2d_borrow', fmt: 'vertical_mini', badge: '🫧 借一拆十減法', hint: '個位不夠減時，向十位借 1 條十拆成 10 個一！' },
    add_3d: { kind: 'add', skillTag: 'add_3d', fmt: 'vertical_mini', badge: '🚚 三位數進位加法', hint: '百位、十位、個位對齊，由個位開始往左加！' },
    sub_3d: { kind: 'sub', skillTag: 'sub_3d', fmt: 'vertical_mini', badge: '🧱 三位數退位減法', hint: '從個位開始相減，不夠減就向左邊借 1！' },
    sub_across_zero: { kind: 'sub', skillTag: 'sub_across_zero', fmt: 'vertical_mini', badge: '🌈 跨零借位密室', hint: '十位是 0 時，要先向百位借 1 拆成 10 個十，十位最後剩 9！' }
  };

  const meta = metaMap[calcType] || metaMap.add_2d_plain;
  const symWord = op === 'add' ? '加' : '減';

  return {
    id: qId,
    realm: 'sunny',
    kind: meta.kind,
    calcType,
    templateId: 'pure_' + calcType,
    skillTag: meta.skillTag,
    uiMode,
    stepMode: 'single',
    displayFormat: meta.fmt,
    canToggleFormat: true,
    badge: meta.badge,
    hint: meta.hint,
    storyHtml: '',
    equationModel: { op, left: a, right: b, result: null, missingSlot: 'result', unit: '' },
    spokenPrompt: `${a} ${symWord} ${b} 等於多少？`,
    a,
    b,
    op,
    answer,
    slots: [{ id: 'ans', expected: answer, maxLen: resolvedMaxLen, label: '計算答案' }],
    helperSpec: {
      type: 'base10_calc',
      mode: 'normal',
      a,
      b,
      op,
      decomp
    },
    rescueDedupeKey: `sunny:${meta.kind}:${a}_${op}_${b}`,
    rescueSnapshot: {
      calcType,
      templateId: 'pure_' + calcType,
      op,
      a,
      b,
      maxLen: resolvedMaxLen
    },
    explanationHtml: exp.html,
    spokenExplanation: exp.spoken
  };
}

/**
 * 檢查陽光加減群島題目是否符合全部數學與生活常識不變量
 */
export function validateCalcQuestionInvariants(q) {
  const errors = [];
  if (!q || typeof q !== 'object') {
    return { ok: false, errors: ['題目物件為空'] };
  }
  if (!ALLOWED_SUNNY_SKILL_TAGS.includes(q.skillTag)) {
    errors.push(`未知 skillTag: ${q.skillTag}`);
  }
  if (!Array.isArray(q.slots) || q.slots.length !== 1) {
    errors.push('slots 長度應為 1');
  } else {
    const exp = q.slots[0].expected;
    if (!Number.isInteger(exp) || exp <= 0) {
      errors.push(`預期答案必須為正整數: ${exp}`);
    }
    if (exp >= 100 && q.slots[0].maxLen < 3) {
      errors.push(`三位數答案 (${exp}) 的 maxLen 不得小於 3`);
    }
  }

  if (q.kind === 'calc_missing') {
    const computed = q.op === 'add' ? q.a + q.b : q.a - q.b;
    const expected = q.slots[0].expected;
    if (q.equationModel.missingSlot === 'left' && expected !== q.a) errors.push('左格未知數不符');
    if (q.equationModel.missingSlot === 'right' && expected !== q.b) errors.push('右格未知數不符');
    if (computed < 0 || q.a < 0 || q.b < 0) errors.push('未知數運算出現負數');
  } else {
    const expected = q.slots[0].expected;
    const computed = q.op === 'add' ? q.a + q.b : q.a - q.b;
    if (computed !== expected) {
      errors.push(`算式計算 (${q.a} ${q.op} ${q.b} = ${computed}) 與答案 ${expected} 不符`);
    }
  }

  if (q.calcType === 'sub_across_zero') {
    const d = getCalcDecomp(q.a, q.b, 'sub');
    if (!d.isAcrossZeroBorrow) {
      errors.push(`跨零退位題 ${q.a} - ${q.b} 未觸發 isAcrossZeroBorrow`);
    }
  }

  if (q.calcType === 'word_buy_change' || q.calcType === 'word_buy_change_large') {
    if (!TAIWAN_CHANGE_BILLS.includes(q.paid)) {
      errors.push(`付款面額 ${q.paid} 不在合法面額清單`);
    }
    if (!(q.paid > q.price && q.paid - q.price >= 3)) {
      errors.push(`找零不合理：paid=${q.paid}, price=${q.price}`);
    }
  }

  if (q.calcType === 'word_compare' || q.calcType === 'word_compare_large') {
    if (!q.actorA || !q.actorB || q.actorA === q.actorB) {
      errors.push(`比較題角色重複或缺失：${q.actorA} vs ${q.actorB}`);
    }
    if (q.slots[0].expected < 5) {
      errors.push(`比較題答案過小: ${q.slots[0].expected}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * 產生陽光加減法選擇題誘答（含進退位忘記進/借位、位值偏差與比較逆算陷阱）
 */
export function generateCalcChoices(q, count = 4, randIntFn = randInt) {
  if (!q || !q.slots || q.slots.length !== 1) return [];
  const target = q.slots[0].expected;
  const candidates = [];

  function pushCand(val) {
    if (typeof val !== 'number' || !Number.isInteger(val) || val <= 0 || val > 999) return;
    if (val === target) return;
    if (candidates.indexOf(val) === -1) candidates.push(val);
  }

  // 1. 教學意義誘答：進退位多/少 10、或加/減反算
  if (q.op === 'add' && q.kind === 'word_single' && q.calcType === 'word_compare') {
    pushCand(Math.abs(q.a - q.b));
  } else if (q.op === 'sub' && q.kind === 'word_single' && q.calcType === 'word_compare') {
    pushCand(q.a + q.b);
  }
  pushCand(target + 10);
  pushCand(target - 10);
  pushCand(target + 1);
  pushCand(target - 1);
  pushCand(target + 2);
  pushCand(target - 2);
  if (target >= 100 || q.a >= 100) {
    pushCand(target + 100);
    pushCand(target - 100);
  }
  if (q.op === 'add' && (q.a % 10) + (q.b % 10) >= 10) {
    // 常見錯法：忘記進 1 導致十位少 1
    pushCand(target - 10);
  }
  if (q.op === 'sub' && (q.a % 10) < (q.b % 10)) {
    // 常見錯法：個位拿大減小、十位忘記退 1
    const wrongOnes = (q.b % 10) - (q.a % 10);
    const wrongTen = Math.floor(q.a / 10) - Math.floor(q.b / 10);
    pushCand(wrongTen * 10 + wrongOnes);
    pushCand(target + 10);
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
  let guard = 0;
  while (options.length < count && guard < 40) {
    guard++;
    const delta = randIntFn(-18, 18);
    const cand = target + delta;
    if (cand > 0 && cand <= 999 && options.indexOf(cand) === -1) {
      options.push(cand);
    }
  }

  for (let m = options.length - 1; m > 0; m--) {
    const r = randIntFn(0, m);
    const swap = options[m];
    options[m] = options[r];
    options[r] = swap;
  }
  return options;
}

/**
 * 依據陽光加減關卡設定生成一組題目，確保單關不連出同情境模板與不重題
 */
export function buildSunnyStageQuestions(stage, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  const count = Number(stage && stage.count) || 5;
  const calcTypes = (stage && Array.isArray(stage.calcTypes) && stage.calcTypes.length > 0)
    ? stage.calcTypes
    : ['add_2d_plain'];

  const usedDedupeKeys = new Set();
  let lastWordTemplateId = '';
  const selected = [];

  for (let i = 0; i < count; i++) {
    const calcType = calcTypes[i % calcTypes.length];
    let mode = (stage && stage.inputMode) || 'keypad';
    if (mode === 'mixed') {
      mode = i < Math.ceil(count / 2) ? 'choice' : 'keypad';
    }

    let q = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const spec = generateOperandsByType(calcType, randIntFn, {
        avoidTemplateId: lastWordTemplateId
      });
      const candidate = buildCalcQuestionFromSpec(
        Object.assign({ calcType }, spec),
        { uiMode: mode }
      );
      if (!usedDedupeKeys.has(candidate.rescueDedupeKey)) {
        q = candidate;
        break;
      }
      if (attempt === 14) {
        q = candidate;
      }
    }

    usedDedupeKeys.add(q.rescueDedupeKey);
    if (q.kind === 'word_single') {
      lastWordTemplateId = q.templateId;
    }
    selected.push(q);
  }

  return selected;
}

/**
 * 從 RescueCase 重建陽光加減法題目（供求救小精靈特訓使用）
 */
export function rebuildCalcQuestionFromSnapshot(entry) {
  if (!entry || !entry.snapshot) return null;
  const q = buildCalcQuestionFromSpec(entry.snapshot, { uiMode: 'keypad' });
  q.badge = '🆘 求救小精靈特訓';
  q.rescueCaseId = entry.id;
  q.rescueDedupeKey = entry.dedupeKey || q.rescueDedupeKey;
  return q;
}
