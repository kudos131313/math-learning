/**
 * 雲端應用王國：跳數密碼、千以內位值機關、兩步驟生活應用題生成器與不變量驗證（純函式領域模組）
 */
import { PAPER_EXAMS, validateSequenceProgression } from './sequence-exams.js';
import { randInt, numberToTaiwanSpokenText, numberToChinese } from './number-text.js';
import { buildMulQuestion } from './multiplication.js';
import { buildCalcQuestionFromSpec, generateCalcChoices } from './quest-calc-questions.js';

export const ALLOWED_CLOUD_SKILL_TAGS = [
  'seq_step_1_10',
  'seq_step_2_5',
  'pv_compose',
  'pv_compare',
  'word_mul_add_guided',
  'word_mul_sub_guided',
  'word_two_step_direct',
  'sky_mixed_calc',
  'sky_boss_slayer'
];

export const TWO_STEP_CHANGE_BILLS = [50, 100, 150, 200];

const ACTORS = ['小兔', '熊熊', '小貓', '企鵝', '狐狸', '松鼠', '小狗', '鴨鴨'];

const TWO_STEP_ADD_TEMPLATES = [
  {
    id: 'park_ticket_popcorn',
    icon: '🎡',
    itemUnit: '元',
    step1Item: '摩天輪券',
    buildStory: (a, b, c) =>
      `🎡 小朋友買了 <b>${b}</b> 張摩天輪券，每張 <b>${a}</b> 元，又花 <b>${c}</b> 元買了一桶爆米花，一共花了幾元？`,
    buildSpoken: (a, b, c) =>
      `買了 ${b} 張摩天輪券，每張 ${a} 元，又花 ${c} 元買爆米花，一共花了幾元？`,
    step1Formula: (a, b) => `每張 ${a} 元 × ${b} 張`,
    step2Label: '再加上爆米花',
    step2Hint: (c) => `把剛剛算出的票價，再加上爆米花的 ${c} 元！`
  },
  {
    id: 'park_carousel_cotton',
    icon: '🎠',
    itemUnit: '元',
    step1Item: '旋轉木馬代幣',
    buildStory: (a, b, c) =>
      `🎠 買 <b>${b}</b> 份遊樂代幣，每份 <b>${a}</b> 元，另外買一支草莓棉花糖 <b>${c}</b> 元，總共要付幾元？`,
    buildSpoken: (a, b, c) =>
      `買 ${b} 份遊樂代幣，每份 ${a} 元，另外買棉花糖 ${c} 元，總共要付幾元？`,
    step1Formula: (a, b) => `每份 ${a} 元 × ${b} 份`,
    step2Label: '再加上棉花糖',
    step2Hint: (c) => `把代幣的錢再加上棉花糖的 ${c} 元就是總金額！`
  },
  {
    id: 'park_balloon_juice',
    icon: '🎈',
    itemUnit: '個',
    step1Item: '彩色氣球組',
    buildStory: (a, b, c) =>
      `🎈 攤位上每串氣球有 <b>${a}</b> 個，小老闆綁了 <b>${b}</b> 串，箱子裡另外還有 <b>${c}</b> 個氣球，合起來共有幾個氣球？`,
    buildSpoken: (a, b, c) =>
      `每串氣球有 ${a} 個，綁了 ${b} 串，箱子裡還有 ${c} 個氣球，共有幾個氣球？`,
    step1Formula: (a, b) => `每串 ${a} 個 × ${b} 串`,
    step2Label: '加上箱子裡的',
    step2Hint: (c) => `把綁好的氣球數量，加上箱子裡的 ${c} 個！`
  },
  {
    id: 'park_cookies_box',
    icon: '🍪',
    itemUnit: '塊',
    step1Item: '點心積木餅乾',
    buildStory: (a, b, c) =>
      `🍪 每盒小熊餅乾有 <b>${a}</b> 塊，桌上排了 <b>${b}</b> 盒，旁邊盤子上還有 <b>${c}</b> 塊，一共多少塊餅乾？`,
    buildSpoken: (a, b, c) =>
      `每盒餅乾有 ${a} 塊，排了 ${b} 盒，盤子上還有 ${c} 塊，一共多少塊餅乾？`,
    step1Formula: (a, b) => `每盒 ${a} 塊 × ${b} 盒`,
    step2Label: '加上盤子裡的',
    step2Hint: (c) => `先算出幾盒的總數，再加上盤子上的 ${c} 塊！`
  }
];

const TWO_STEP_COMPARE_ADD_TEMPLATES = [
  {
    id: 'park_sticker_collect',
    icon: '⭐',
    itemUnit: '張',
    buildStory: (a, b, c, actorA, actorB) =>
      `⭐ <b>${actorA}</b> 收集了 <b>${b}</b> 排星星貼紙，每排有 <b>${a}</b> 張；<b>${actorB}</b> 有 <b>${c}</b> 張貼紙，兩人合起來共有幾張？`,
    buildSpoken: (a, b, c, actorA, actorB) =>
      `${actorA} 收集了 ${b} 排貼紙，每排 ${a} 張；${actorB} 有 ${c} 張，兩人合起來共有幾張？`,
    step1Formula: (a, b) => `每排 ${a} 張 × ${b} 排`,
    step2Label: '合起來共幾張'
  },
  {
    id: 'park_stamp_album',
    icon: '🎫',
    itemUnit: '張',
    buildStory: (a, b, c, actorA, actorB) =>
      `🎫 <b>${actorA}</b> 在遊樂園拿到 <b>${b}</b> 束遊戲券，每束 <b>${a}</b> 張；<b>${actorB}</b> 帶了 <b>${c}</b> 張來交換，一共幾張遊戲券？`,
    buildSpoken: (a, b, c, actorA, actorB) =>
      `${actorA} 拿到 ${b} 束遊戲券，每束 ${a} 張；${actorB} 帶了 ${c} 張，一共有幾張遊戲券？`,
    step1Formula: (a, b) => `每束 ${a} 張 × ${b} 束`,
    step2Label: '兩人合起來'
  },
  {
    id: 'park_marble_jars',
    icon: '🔮',
    itemUnit: '顆',
    buildStory: (a, b, c, actorA, actorB) =>
      `🔮 <b>${actorA}</b> 贏得 <b>${b}</b> 袋彈珠，每袋 <b>${a}</b> 顆；<b>${actorB}</b> 有 <b>${c}</b> 顆，兩人一共有幾顆彈珠？`,
    buildSpoken: (a, b, c, actorA, actorB) =>
      `${actorA} 贏得 ${b} 袋彈珠，每袋 ${a} 顆；${actorB} 有 ${c} 顆，兩人一共有幾顆？`,
    step1Formula: (a, b) => `每袋 ${a} 顆 × ${b} 袋`,
    step2Label: '加上另一人'
  }
];

const TWO_STEP_SUB_CHANGE_TEMPLATES = [
  {
    id: 'patisserie_macaron_change',
    icon: '🧁',
    itemName: '彩色馬卡龍',
    unitWord: '顆',
    buildStory: (a, b, paid) =>
      `🧁 一顆彩色馬卡龍賣 <b>${a}</b> 元，買了 <b>${b}</b> 顆後，拿一張 <b>${paid}</b> 元鈔票去付錢，可以找回幾元？`,
    buildSpoken: (a, b, paid) =>
      `一顆馬卡龍 ${a} 元，買 ${b} 顆，拿 ${paid} 元付錢，可以找回幾元？`
  },
  {
    id: 'patisserie_tart_change',
    icon: '🥧',
    itemName: '草莓小塔',
    unitWord: '個',
    buildStory: (a, b, paid) =>
      `🥧 草莓小塔每個 <b>${a}</b> 元，小兔買了 <b>${b}</b> 個，付給老闆 <b>${paid}</b> 元，應該找回幾元？`,
    buildSpoken: (a, b, paid) =>
      `草莓小塔每個 ${a} 元，買 ${b} 個，付給老闆 ${paid} 元，應該找回幾元？`
  },
  {
    id: 'patisserie_puff_change',
    icon: '🥐',
    itemName: '香草泡芙',
    unitWord: '個',
    buildStory: (a, b, paid) =>
      `🥐 香草泡芙一個 <b>${a}</b> 元，買了 <b>${b}</b> 個，拿 <b>${paid}</b> 元結帳，老闆會找回幾元？`,
    buildSpoken: (a, b, paid) =>
      `香草泡芙一個 ${a} 元，買了 ${b} 個，拿 ${paid} 元結帳，會找回幾元？`
  },
  {
    id: 'patisserie_latte_change',
    icon: '🧋',
    itemName: '珍珠鮮奶茶',
    unitWord: '杯',
    buildStory: (a, b, paid) =>
      `🧋 珍珠鮮奶茶一杯 <b>${a}</b> 元，點了 <b>${b}</b> 杯請大家喝，付了 <b>${paid}</b> 元，還要找回幾元？`,
    buildSpoken: (a, b, paid) =>
      `珍珠鮮奶茶一杯 ${a} 元，點了 ${b} 杯，付了 ${paid} 元，找回幾元？`
  }
];

const TWO_STEP_SUB_LEFT_TEMPLATES = [
  {
    id: 'patisserie_cookie_left',
    icon: '🍪',
    unit: '片',
    buildStory: (a, b, c) =>
      `🍪 點心盒每盒裝 <b>${a}</b> 片餅乾，買了 <b>${b}</b> 盒，分給同學吃掉 <b>${c}</b> 片後，還剩下幾片餅乾？`,
    buildSpoken: (a, b, c) =>
      `每盒裝 ${a} 片餅乾，買了 ${b} 盒，分掉 ${c} 片後，還剩下幾片餅乾？`
  },
  {
    id: 'patisserie_canele_left',
    icon: '🧁',
    unit: '個',
    buildStory: (a, b, c) =>
      `🧁 烤盤上每排擺 <b>${a}</b> 個可麗露，共擺了 <b>${b}</b> 排，客人買走 <b>${c}</b> 個後，還剩幾個？`,
    buildSpoken: (a, b, c) =>
      `每排擺 ${a} 個可麗露，擺了 ${b} 排，被買走 ${c} 個後，還剩幾個？`
  },
  {
    id: 'patisserie_candy_left',
    icon: '🍬',
    unit: '顆',
    buildStory: (a, b, c) =>
      `🍬 糖果包每袋有 <b>${a}</b> 顆牛奶糖，拿了 <b>${b}</b> 袋全部打開後，吃掉 <b>${c}</b> 顆，還剩下幾顆？`,
    buildSpoken: (a, b, c) =>
      `每袋有 ${a} 顆牛奶糖，拿了 ${b} 袋，吃掉 ${c} 顆，還剩下幾顆？`
  },
  {
    id: 'patisserie_berry_left',
    icon: '🍓',
    unit: '顆',
    buildStory: (a, b, c) =>
      `🍓 甜點師準備了 <b>${b}</b> 籃草莓，每籃有 <b>${a}</b> 顆，做蛋糕用掉 <b>${c}</b> 顆，籃子裡還剩幾顆草莓？`,
    buildSpoken: (a, b, c) =>
      `準備了 ${b} 籃草莓，每籃 ${a} 顆，用掉 ${c} 顆，還剩幾顆草莓？`
  }
];

let cloudSeqCounter = 0;

function pickFrom(arr, randIntFn) {
  return arr[randIntFn(0, arr.length - 1)];
}

function pickTwoActors(randIntFn) {
  const idxA = randIntFn(0, ACTORS.length - 1);
  let idxB = randIntFn(0, ACTORS.length - 2);
  if (idxB >= idxA) idxB += 1;
  return [ACTORS[idxA], ACTORS[idxB]];
}

/**
 * 依據第一步總花費金額挑選最小且合理（paid >= step1 + 5）的台灣生活面額
 */
export function pickMinimalTwoStepBill(step1) {
  const cost = Math.max(0, Math.floor(Number(step1) || 0));
  for (let i = 0; i < TWO_STEP_CHANGE_BILLS.length; i++) {
    if (TWO_STEP_CHANGE_BILLS[i] >= cost + 5) {
      return TWO_STEP_CHANGE_BILLS[i];
    }
  }
  return 200;
}

function buildSeqStep110Spec(randIntFn, forceLeftReverse) {
  const useExam = !forceLeftReverse && randIntFn(0, 3) === 0;
  if (useExam) {
    const exam = pickFrom(PAPER_EXAMS, randIntFn);
    const numbers = exam.numbers.slice(0, 5);
    const blankIdx = pickFrom(
      exam.blanks.filter((bi) => bi >= 0 && bi < 5),
      randIntFn
    );
    return {
      cloudType: 'seq_step_1_10',
      templateId: 'seq_exam_' + exam.id,
      numbers,
      step: exam.step,
      blankIdx: typeof blankIdx === 'number' ? blankIdx : 2,
      storyTheme: 'station_track'
    };
  }

  const steps = forceLeftReverse ? [-10, 10, -1, 1] : [10, -10, 1, -1];
  const step = pickFrom(steps, randIntFn);
  let start = 189;
  if (step === 10) {
    start = pickFrom([79, 89, 179, 189, 285, 382, 475, 588], randIntFn) + randIntFn(0, 8);
  } else if (step === -10) {
    start = pickFrom([125, 130, 215, 224, 318, 420, 512, 616], randIntFn) + randIntFn(0, 8);
  } else if (step === 1) {
    start = pickFrom([98, 198, 298, 397, 498, 698], randIntFn);
  } else {
    start = pickFrom([102, 202, 301, 403, 501, 702], randIntFn);
  }
  const numbers = [0, 1, 2, 3, 4].map((i) => start + i * step);
  const blankIdx = forceLeftReverse ? 0 : randIntFn(1, 3);
  return {
    cloudType: forceLeftReverse ? 'seq_reverse_left' : 'seq_step_1_10',
    templateId: 'seq_cross_' + (step > 0 ? 'p' : 'm') + Math.abs(step) + (forceLeftReverse ? '_left' : ''),
    numbers,
    step,
    blankIdx,
    storyTheme: 'station_track'
  };
}

function buildSeqStep25Spec(randIntFn) {
  const mode = pickFrom(['coin_5', 'clock_5', 'pair_2', 'step_down_5'], randIntFn);
  if (mode === 'coin_5') {
    const start = randIntFn(2, 14) * 5;
    const numbers = [0, 1, 2, 3, 4].map((i) => start + i * 5);
    return {
      cloudType: 'seq_step_2_5',
      templateId: 'seq_coin_5',
      numbers,
      step: 5,
      blankIdx: randIntFn(1, 3),
      storyTheme: 'coin_5'
    };
  }
  if (mode === 'clock_5') {
    const start = randIntFn(1, 7) * 5;
    const numbers = [0, 1, 2, 3, 4].map((i) => start + i * 5);
    return {
      cloudType: 'seq_step_2_5',
      templateId: 'seq_clock_5',
      numbers,
      step: 5,
      blankIdx: randIntFn(1, 3),
      storyTheme: 'clock_5'
    };
  }
  if (mode === 'pair_2') {
    const start = randIntFn(2, 24) * 2;
    const numbers = [0, 1, 2, 3, 4].map((i) => start + i * 2);
    return {
      cloudType: 'seq_step_2_5',
      templateId: 'seq_pair_2',
      numbers,
      step: 2,
      blankIdx: randIntFn(1, 4),
      storyTheme: 'pair_2'
    };
  }
  const start = randIntFn(7, 16) * 5;
  const numbers = [0, 1, 2, 3, 4].map((i) => start - i * 5);
  return {
    cloudType: 'seq_step_2_5',
    templateId: 'seq_down_5',
    numbers,
    step: -5,
    blankIdx: randIntFn(1, 3),
    storyTheme: 'down_5'
  };
}

function buildPvComposeSpec(randIntFn) {
  // 重點練習補零位值（缺十位 / 缺個位）與讀寫組合
  const mode = pickFrom(['zero_tens', 'zero_ones', 'standard_3d', 'read_words'], randIntFn);
  const h = randIntFn(1, 9);
  const t = mode === 'zero_tens' ? 0 : randIntFn(1, 9);
  const o = mode === 'zero_ones' ? 0 : randIntFn(1, 9);
  const expected = h * 100 + t * 10 + o;
  return {
    cloudType: 'pv_compose',
    templateId: 'pv_' + mode,
    h,
    t,
    o,
    expected,
    pvMode: mode
  };
}

function buildPvCompareMaxMinSpec(randIntFn) {
  const hasZero = randIntFn(0, 1) === 0;
  let d1 = randIntFn(1, 8);
  let d2 = randIntFn(d1 + 1, 9);
  let d3 = hasZero ? 0 : randIntFn(1, 9);
  if (!hasZero) {
    while (d3 === d1 || d3 === d2) {
      d3 = randIntFn(1, 9);
    }
  }
  const digits = [d1, d2, d3];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = randIntFn(0, i);
    const tmp = digits[i];
    digits[i] = digits[j];
    digits[j] = tmp;
  }
  const pickMax = randIntFn(0, 1) === 0;
  const sortedAsc = digits.slice().sort((x, y) => x - y);
  const sortedDesc = sortedAsc.slice().reverse();
  let minNum;
  if (sortedAsc[0] === 0) {
    minNum = sortedAsc[1] * 100 + 0 * 10 + sortedAsc[2];
  } else {
    minNum = sortedAsc[0] * 100 + sortedAsc[1] * 10 + sortedAsc[2];
  }
  const maxNum = sortedDesc[0] * 100 + sortedDesc[1] * 10 + sortedDesc[2];

  return {
    cloudType: 'pv_compare_max_min',
    templateId: pickMax ? 'pv_arrange_max' : 'pv_arrange_min',
    digits,
    pickMax,
    expected: pickMax ? maxNum : minNum
  };
}

function buildPvComparePairSpec(randIntFn) {
  const h = randIntFn(2, 8);
  const dA = randIntFn(1, 8);
  const dB = randIntFn(1, 8);
  let left = h * 100 + dA * 10 + dB;
  let right;
  const trick = randIntFn(0, 2);
  if (trick === 0 && dA !== dB) {
    right = h * 100 + dB * 10 + dA; // 例 427 vs 472（十位個位對調）
  } else if (trick === 1) {
    right = h * 100 + 0 * 10 + dA; // 補零陷阱，如 530 vs 503
    left = h * 100 + dA * 10 + 0;
  } else {
    right = h * 100 + dA * 10 + ((dB + randIntFn(1, 4)) % 9 || 9);
  }
  if (left === right) {
    right = left + 10;
  }
  const askLarger = randIntFn(0, 1) === 0;
  const expected = askLarger ? Math.max(left, right) : Math.min(left, right);
  return {
    cloudType: 'pv_compare_pair',
    templateId: 'pv_pair_' + (askLarger ? 'big' : 'small'),
    pairValues: [left, right],
    askLarger,
    expected
  };
}

function buildPvThousandExchangeSpec(randIntFn) {
  const kind = pickFrom(['ten_hundreds', 'compose_big_tens', 'which_makes_1000'], randIntFn);
  if (kind === 'ten_hundreds') {
    return {
      cloudType: 'pv_thousand_exchange',
      templateId: 'pv_th_1000',
      exchangeKind: 'ten_hundreds',
      hCount: 10,
      expected: 1000
    };
  }
  if (kind === 'compose_big_tens') {
    const tens = pickFrom([20, 30, 40, 50, 60, 70, 80, 90], randIntFn);
    return {
      cloudType: 'pv_thousand_exchange',
      templateId: 'pv_th_tens',
      exchangeKind: 'compose_big_tens',
      tensCount: tens,
      expected: tens * 10
    };
  }
  const h = randIntFn(3, 8);
  return {
    cloudType: 'pv_thousand_exchange',
    templateId: 'pv_th_need_more',
    exchangeKind: 'which_makes_1000',
    hCount: h,
    expected: 10 - h
  };
}

function buildWordMulAddSpec(cloudType, randIntFn, avoidId) {
  const isCompareStyle = cloudType === 'word_mul_add_compare_guided';
  const basePool = isCompareStyle ? TWO_STEP_COMPARE_ADD_TEMPLATES : TWO_STEP_ADD_TEMPLATES;
  const pool = basePool.filter((t) => t.id !== avoidId);
  const tpl = pickFrom(pool.length > 0 ? pool : basePool, randIntFn);
  const a = randIntFn(2, 9);
  const b = randIntFn(2, 9);
  const step1 = a * b;
  const maxC = Math.min(85, 200 - step1);
  const c = randIntFn(5, Math.max(5, maxC));
  const [actorA, actorB] = pickTwoActors(randIntFn);
  return {
    cloudType,
    templateId: tpl.id,
    a,
    b,
    c,
    actorA,
    actorB,
    stepMode: cloudType === 'word_mul_add_direct' ? 'direct_two_step' : 'guided_two_step'
  };
}

function buildWordMulSubChangeSpec(cloudType, randIntFn, avoidId) {
  const pool = TWO_STEP_SUB_CHANGE_TEMPLATES.filter((t) => t.id !== avoidId);
  const tpl = pickFrom(pool.length > 0 ? pool : TWO_STEP_SUB_CHANGE_TEMPLATES, randIntFn);
  const a = randIntFn(2, 9);
  const b = randIntFn(2, 9);
  const step1 = a * b;
  const paid = pickMinimalTwoStepBill(step1);
  return {
    cloudType,
    templateId: tpl.id,
    a,
    b,
    paid,
    stepMode: cloudType === 'word_mul_sub_change_direct' ? 'direct_two_step' : 'guided_two_step'
  };
}

function buildWordMulSubLeftSpec(cloudType, randIntFn, avoidId) {
  const pool = TWO_STEP_SUB_LEFT_TEMPLATES.filter((t) => t.id !== avoidId);
  const tpl = pickFrom(pool.length > 0 ? pool : TWO_STEP_SUB_LEFT_TEMPLATES, randIntFn);
  const a = randIntFn(3, 9);
  const b = randIntFn(3, 9);
  const step1 = a * b;
  const maxC = Math.min(Math.floor(step1 * 0.75), step1 - 4);
  const c = randIntFn(3, Math.max(3, maxC));
  return {
    cloudType,
    templateId: tpl.id,
    a,
    b,
    c,
    stepMode: cloudType === 'word_mul_sub_left_direct' ? 'direct_two_step' : 'guided_two_step'
  };
}

/**
 * 依據 spec 物件建構完整雲端應用王國 Question 物件（支援一般關與救援案件還原）
 */
export function buildCloudQuestionFromSpec(spec, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  const uiMode = options.uiMode || 'keypad';
  cloudSeqCounter += 1;
  const qId = options.id || `cloud_q_${cloudSeqCounter}`;
  const cloudType = (spec && spec.cloudType) || 'seq_step_1_10';
  const skillOverride = options.skillTagOverride || (spec && spec.skillTag) || null;

  // 1. 跳數密碼題（seq_step_1_10 / seq_reverse_left / seq_step_2_5）
  if (cloudType === 'seq_step_1_10' || cloudType === 'seq_reverse_left' || cloudType === 'seq_step_2_5') {
    const numbers = (spec.numbers || [189, 199, 209, 219, 229]).slice(0, 5);
    const step = Number(spec.step || 10);
    const blankIdx = Math.max(0, Math.min(4, Number(spec.blankIdx ?? 2)));
    const expected = numbers[blankIdx];
    const maxLen = Math.max(2, String(expected).length);
    const stepLabel = step > 0 ? `+${step}` : `${step}`;
    const storyTheme = spec.storyTheme || 'station_track';
    const isStep25 = cloudType === 'seq_step_2_5';

    let badge = '🚂 跨百跳數密碼';
    let storyHtml = `🚂 雲朵車站列車啟動密碼：每往下一節車廂 <b>${step > 0 ? '增加 ' + step : '倒數減 ' + Math.abs(step)}</b>，請算出問號車廂的號碼！`;
    let spokenPrompt = `數的規律是每次${step > 0 ? '加' : '減'}${Math.abs(step)}，問號車廂應該填多少？`;
    let hint = `觀察相鄰兩節車廂的變化規律（${stepLabel}），算出缺席的數字！`;

    if (storyTheme === 'coin_5') {
      badge = '🪙 5 元硬幣跳數';
      storyHtml = '🪙 數著 5 元硬幣存錢筒！每多放 1 個 5 元硬幣金額 <b>加 5 元</b>，問號處是多少元？';
      spokenPrompt = '每多一個 5 元硬幣就多 5 元，問號處應該是多少元？';
    } else if (storyTheme === 'clock_5') {
      badge = '🕒 時鐘分鐘跳數';
      storyHtml = '🕒 時鐘上的分針每走一大格會 <b>多 5 分鐘</b>，算出空格處經過了幾分鐘！';
      spokenPrompt = '分針每走一大格多 5 分鐘，空格處是幾分鐘？';
    } else if (storyTheme === 'pair_2') {
      badge = '👟 2 個 2 個數雙數';
      storyHtml = '👟 小精靈每雙有 2 隻鞋子，每數一雙就 <b>加 2</b>，填出空格裡總共有幾隻鞋！';
      spokenPrompt = '每次加 2，填出空格裡的數字是多少？';
    } else if (cloudType === 'seq_reverse_left' || blankIdx === 0) {
      badge = '🔍 反推最左格密碼';
      storyHtml = `🔍 列車最左邊第 1 節車廂密碼不見了！已知每格規律 <b>${stepLabel}</b>，從第 2 節 <b>${numbers[1]}</b> 往左反推！`;
      spokenPrompt = `從第 2 節數字 ${numbers[1]} 往左反推，最左邊第一格原來是多少？`;
      hint = step > 0
        ? `往右加 ${step}，所以往左反推要減掉 ${step}！`
        : `往右減 ${Math.abs(step)}，所以往左反推要加回 ${Math.abs(step)}！`;
    }

    const skillTag = skillOverride || (isStep25 ? 'seq_step_2_5' : 'seq_step_1_10');
    const expWord = `每往右 1 格規則是 <b>${stepLabel}</b>，所以空缺車廂是 <b>${expected}</b>！`;
    return {
      id: qId,
      realm: 'cloud',
      kind: 'seq',
      cloudType,
      templateId: spec.templateId || cloudType,
      skillTag,
      uiMode,
      stepMode: 'single',
      displayFormat: 'sequence_cards',
      canToggleFormat: false,
      badge,
      hint,
      storyHtml,
      sequenceModel: { numbers, step, blankIdx },
      spokenPrompt,
      expected,
      slots: [{ id: 'ans', expected, maxLen, label: '空缺車廂數字' }],
      helperSpec: {
        type: 'mini_train',
        numbers,
        step,
        blankIdx
      },
      rescueDedupeKey: `cloud:seq:${step}:${numbers.join('_')}:${blankIdx}`,
      rescueSnapshot: {
        cloudType,
        templateId: spec.templateId || cloudType,
        numbers,
        step,
        blankIdx,
        storyTheme,
        skillTag
      },
      explanationHtml: `🚂 <b>規律密碼：${expWord}</b>`,
      spokenExplanation: `答對了！規律是每次${step > 0 ? '加' : '減'}${Math.abs(step)}，答案是 ${expected}`
    };
  }

  // 2. 位值金庫題（pv_compose / pv_compare_max_min / pv_compare_pair / pv_thousand_exchange）
  if (
    cloudType === 'pv_compose' ||
    cloudType === 'pv_compare_max_min' ||
    cloudType === 'pv_compare_pair' ||
    cloudType === 'pv_thousand_exchange'
  ) {
    if (cloudType === 'pv_compose') {
      const h = Number(spec.h || 3);
      const t = Number(spec.t ?? 0);
      const o = Number(spec.o ?? 5);
      const expected = h * 100 + t * 10 + o;
      const pvMode = spec.pvMode || 'zero_tens';
      const spokenWords = numberToChinese(expected);

      let storyHtml = '';
      let cards = [];
      if (pvMode === 'read_words') {
        storyHtml = `🔐 金庫語音門鎖念出：「<b>${spokenWords}</b>」，請輸入正確的阿拉伯數字密碼！`;
        cards = [{ label: '國字讀數', value: spokenWords, tone: 'word' }];
      } else if (t === 0) {
        storyHtml = `💎 金庫裡裝了 <b>${h}</b> 片百格板和 <b>${o}</b> 顆小白積木（沒有十格條），這組密碼是多少？`;
        cards = [
          { label: '百位（藍）', value: `${h} 個百`, tone: 'h' },
          { label: '十位（橘）', value: '0 個十', tone: 't' },
          { label: '個位（白）', value: `${o} 個一`, tone: 'o' }
        ];
      } else if (o === 0) {
        storyHtml = `💎 金庫裡裝了 <b>${h}</b> 片百格板和 <b>${t}</b> 條橘色十格條（沒有個位），合起來是多少？`;
        cards = [
          { label: '百位（藍）', value: `${h} 個百`, tone: 'h' },
          { label: '十位（橘）', value: `${t} 個十`, tone: 't' },
          { label: '個位（白）', value: '0 個一', tone: 'o' }
        ];
      } else {
        storyHtml = `💎 金庫裡有 <b>${h}</b> 個百、<b>${t}</b> 個十和 <b>${o}</b> 個一，組成的三位數是多少？`;
        cards = [
          { label: '百位（藍）', value: `${h} 個百`, tone: 'h' },
          { label: '十位（橘）', value: `${t} 個十`, tone: 't' },
          { label: '個位（白）', value: `${o} 個一`, tone: 'o' }
        ];
      }

      const skillTag = skillOverride || 'pv_compose';
      return {
        id: qId,
        realm: 'cloud',
        kind: 'place_value',
        cloudType,
        templateId: spec.templateId || 'pv_compose',
        skillTag,
        uiMode,
        stepMode: 'single',
        displayFormat: 'place_value_cards',
        canToggleFormat: false,
        badge: '💎 位值密碼組合',
        hint: '百位寫幾個百、十位寫幾個十、個位寫幾個一；沒有的那一位要補 0！',
        storyHtml,
        placeValueModel: { mode: 'compose', cards, h, t, o, unit: '' },
        spokenPrompt: storyHtml.replace(/<[^>]+>/g, ''),
        expected,
        slots: [{ id: 'ans', expected, maxLen: 3, label: '三位數密碼' }],
        helperSpec: {
          type: 'place_value_blocks',
          mode: 'compose',
          h,
          t,
          o,
          tip: t === 0 || o === 0 ? '沒有積木的那個位值要填上 0 佔位，數字才不會縮水喔！' : '把百位、十位、個位數字依序寫出來就是密碼！'
        },
        rescueDedupeKey: `cloud:pv_compose:${expected}:${pvMode}`,
        rescueSnapshot: {
          cloudType,
          templateId: spec.templateId || 'pv_compose',
          h,
          t,
          o,
          pvMode,
          skillTag
        },
        explanationHtml: `💎 <b>${h}</b> 個百、<b>${t}</b> 個十、<b>${o}</b> 個一 ＝ <b>${expected}</b>（讀作：${numberToTaiwanSpokenText(expected)}）`,
        spokenExplanation: `答對了！組成的數字是 ${numberToTaiwanSpokenText(expected)}`
      };
    }

    if (cloudType === 'pv_compare_max_min') {
      const digits = (spec.digits || [4, 0, 7]).slice(0, 3);
      const pickMax = Boolean(spec.pickMax);
      const expected = Number(spec.expected);
      const cards = digits.map((d, idx) => ({ label: `數字卡 ${idx + 1}`, value: String(d), tone: 'digit' }));
      const skillTag = skillOverride || 'pv_compare';
      const hasZeroCard = digits.indexOf(0) !== -1;
      const tipMsg = pickMax
        ? '要排最大的三位數，把最大的數字放在最左邊「百位」，其餘依序由大排到小！'
        : hasZeroCard
          ? '要排最小的三位數時，百位不能放 0！先選不是 0 裡最小的放百位，再把 0 放十位！'
          : '要排最小的三位數，把最小的數字放「百位」，再由小排到大！';

      return {
        id: qId,
        realm: 'cloud',
        kind: 'place_value',
        cloudType,
        templateId: spec.templateId || 'pv_max_min',
        skillTag,
        uiMode,
        stepMode: 'single',
        displayFormat: 'place_value_cards',
        canToggleFormat: false,
        badge: pickMax ? '🏆 排最大三位數' : '🔍 排最小三位數',
        hint: tipMsg,
        storyHtml: `🪙 用這三張數字卡 <b>[ ${digits.join(' ][ ')} ]</b>，排成一個<b>${pickMax ? '最大' : '最小'}的三位數</b>（每張用一次，0 不能放百位）是多少？`,
        placeValueModel: { mode: 'digits', cards, unit: '' },
        spokenPrompt: `用數字卡 ${digits.join('、')} 排成${pickMax ? '最大' : '最小'}的三位數是多少？`,
        digits,
        pickMax,
        expected,
        slots: [{ id: 'ans', expected, maxLen: 3, label: pickMax ? '最大三位數' : '最小三位數' }],
        helperSpec: {
          type: 'place_value_blocks',
          mode: 'max_min',
          digits,
          pickMax,
          tip: tipMsg
        },
        rescueDedupeKey: `cloud:pv_mm:${digits.slice().sort().join('')}:${pickMax ? 'max' : 'min'}`,
        rescueSnapshot: {
          cloudType,
          templateId: spec.templateId || 'pv_max_min',
          digits,
          pickMax,
          expected,
          skillTag
        },
        explanationHtml: `🪙 用 ${digits.join('、')} 排出的${pickMax ? '最大' : '最小'}三位數是 <b>${expected}</b>！`,
        spokenExplanation: `答對了！排出的三位數是 ${numberToTaiwanSpokenText(expected)}`
      };
    }

    if (cloudType === 'pv_compare_pair') {
      const pairValues = (spec.pairValues || [409, 490]).slice(0, 2);
      const askLarger = Boolean(spec.askLarger);
      const expected = askLarger ? Math.max(pairValues[0], pairValues[1]) : Math.min(pairValues[0], pairValues[1]);
      const cards = [
        { label: '金庫 A', value: `${pairValues[0]} 枚`, tone: 'h' },
        { label: '金庫 B', value: `${pairValues[1]} 枚`, tone: 't' }
      ];
      const skillTag = skillOverride || 'pv_compare';
      return {
        id: qId,
        realm: 'cloud',
        kind: 'place_value',
        cloudType,
        templateId: spec.templateId || 'pv_pair',
        skillTag,
        uiMode,
        stepMode: 'single',
        displayFormat: 'place_value_cards',
        canToggleFormat: false,
        badge: '⚖️ 三位數比大小',
        hint: '先比百位，百位一樣大就比十位，十位也一樣就比個位！',
        storyHtml: `🪙 金庫 A 有 <b>${pairValues[0]}</b> 枚金幣，金庫 B 有 <b>${pairValues[1]}</b> 枚金幣，請問數量<b>比較${askLarger ? '多' : '少'}</b>的金庫有幾枚？`,
        placeValueModel: { mode: 'compare_pair', cards, unit: '枚' },
        spokenPrompt: `金庫 A 有 ${pairValues[0]} 枚金幣，金庫 B 有 ${pairValues[1]} 枚金幣，比較${askLarger ? '多' : '少'}的是幾枚？`,
        pairValues,
        askLarger,
        expected,
        slots: [{ id: 'ans', expected, maxLen: 3, label: '比較結果（枚）' }],
        helperSpec: {
          type: 'place_value_blocks',
          mode: 'compare_pair',
          pairValues,
          tip: '從最高位「百位」開始一格一格比，馬上就能分出大小喔！'
        },
        rescueDedupeKey: `cloud:pv_pair:${pairValues[0]}_${pairValues[1]}:${askLarger ? 'max' : 'min'}`,
        rescueSnapshot: {
          cloudType,
          templateId: spec.templateId || 'pv_pair',
          pairValues,
          askLarger,
          expected,
          skillTag
        },
        explanationHtml: `⚖️ 比較 <b>${pairValues[0]}</b> 和 <b>${pairValues[1]}</b>，較${askLarger ? '大' : '小'}的數是 <b>${expected}</b>！`,
        spokenExplanation: `答對了！較${askLarger ? '多' : '少'}的是 ${numberToTaiwanSpokenText(expected)}`
      };
    }

    // pv_thousand_exchange
    const exchangeKind = spec.exchangeKind || 'ten_hundreds';
    const expected = Number(spec.expected || 1000);
    const maxLen = expected >= 1000 ? 4 : expected >= 100 ? 3 : 2;
    let storyHtml = '';
    let cards = [];
    let tip = '';
    if (exchangeKind === 'ten_hundreds') {
      storyHtml = '🧱 金庫有 <b>10</b> 片水藍色的百格板，疊起來剛好可以換成 1 個大千位立方體，一共是多少？';
      cards = [{ label: '十進位換算', value: '10 個百 ＝ ？', tone: 'th' }];
      tip = '10 個十是 100；10 個百疊在一起就是「1 千（1000）」喔！';
    } else if (exchangeKind === 'compose_big_tens') {
      const tc = Number(spec.tensCount || 40);
      storyHtml = `🧱 寶箱裡有 <b>${tc}</b> 條橘色的十格棒，10 條十會換成 1 片百，這樣一共有多少？`;
      cards = [{ label: '十位積木兌換', value: `${tc} 個十 ＝ ？`, tone: 't' }];
      tip = `把 ${tc} 個 10 合起來，每 10 條十換 1 個百，共是 ${tc / 10} 個百！`;
    } else {
      const hc = Number(spec.hCount || 6);
      storyHtml = `🧱 已經存了 <b>${hc}</b> 片百格板，想要存滿 <b>1000</b>（1 個千）的話，還要再拿<b>幾片</b>百格板？`;
      cards = [
        { label: '已有', value: `${hc} 片百`, tone: 'h' },
        { label: '目標', value: '1000（10 片百）', tone: 'th' }
      ];
      tip = '1000 等於 10 片百格板，算算 10 減去已有的數量就知道還要幾片！';
    }
    const skillTag = skillOverride || 'pv_compose';
    return {
      id: qId,
      realm: 'cloud',
      kind: 'place_value',
      cloudType,
      templateId: spec.templateId || exchangeKind,
      skillTag,
      uiMode,
      stepMode: 'single',
      displayFormat: 'place_value_cards',
      canToggleFormat: false,
      badge: '🏛️ 千以內進位機關',
      hint: tip,
      storyHtml,
      placeValueModel: { mode: 'thousand', cards, unit: '' },
      spokenPrompt: storyHtml.replace(/<[^>]+>/g, ''),
      expected,
      slots: [{ id: 'ans', expected, maxLen, label: '機關答案' }],
      helperSpec: {
        type: 'place_value_blocks',
        mode: 'thousand',
        tip
      },
      rescueDedupeKey: `cloud:pv_th:${exchangeKind}:${expected}`,
      rescueSnapshot: {
        cloudType,
        templateId: spec.templateId || exchangeKind,
        exchangeKind,
        hCount: spec.hCount,
        tensCount: spec.tensCount,
        expected,
        skillTag
      },
      explanationHtml: `🏛️ <b>10 個百 ＝ 1000</b>，本題機關密碼為 <b>${expected}</b>！`,
      spokenExplanation: `答對了！答案是 ${numberToTaiwanSpokenText(expected)}`
    };
  }

  // 3. 兩步驟先乘後加（guided / direct）
  if (
    cloudType === 'word_mul_add_guided' ||
    cloudType === 'word_mul_add_compare_guided' ||
    cloudType === 'word_mul_add_direct'
  ) {
    const isDirect = spec.stepMode === 'direct_two_step' || cloudType === 'word_mul_add_direct';
    const stepMode = isDirect ? 'direct_two_step' : 'guided_two_step';
    const isCompare = cloudType === 'word_mul_add_compare_guided';
    const list = isCompare ? TWO_STEP_COMPARE_ADD_TEMPLATES : TWO_STEP_ADD_TEMPLATES;
    const tpl = list.find((t) => t.id === spec.templateId) || list[0];
    const a = Number(spec.a || 5);
    const b = Number(spec.b || 4);
    const c = Number(spec.c || 15);
    const step1 = a * b;
    const answer = step1 + c;
    const actorA = spec.actorA || '小兔';
    const actorB = spec.actorB || '熊熊';

    const storyHtml = isCompare
      ? tpl.buildStory(a, b, c, actorA, actorB)
      : tpl.buildStory(a, b, c);
    const spokenPrompt = isCompare
      ? tpl.buildSpoken(a, b, c, actorA, actorB)
      : tpl.buildSpoken(a, b, c);

    const skillTag = skillOverride || (isDirect ? 'word_two_step_direct' : 'word_mul_add_guided');
    const step1MaxLen = String(step1).length;
    const ansMaxLen = answer >= 100 ? 3 : 2;
    const twoStepModel = {
      variant: 'mul_add',
      a,
      b,
      c,
      step1,
      answer,
      unit: tpl.itemUnit,
      step1Text: `${a} × ${b}`,
      step2Op: 'add',
      step2TextPrefix: '',
      step2TextSuffix: `＋ ${c}`,
      step1Label: '第 1 步：先算乘法',
      step2Label: `第 2 步：再加上 ${c}`
    };

    return {
      id: qId,
      realm: 'cloud',
      kind: 'word_two_step',
      cloudType,
      templateId: tpl.id,
      skillTag,
      uiMode: 'keypad',
      stepMode,
      displayFormat: isDirect ? 'direct_two_step' : 'guided_two_step',
      canToggleFormat: false,
      badge: isDirect ? `${tpl.icon} 兩步驟一步直解` : `${tpl.icon} 先乘後加挑戰`,
      hint: isDirect ? '先在心裡算出乘法小計，再加上第二項，直接填入最終答案！' : '先把每題分成兩步：先算「幾個幾」，再把另一項合起來！',
      storyHtml,
      twoStepModel,
      spokenPrompt,
      a,
      b,
      c,
      actorA,
      actorB,
      step1Expected: step1,
      answer,
      slots: isDirect
        ? [{ id: 'ans', expected: answer, maxLen: ansMaxLen, label: `最終答案（${tpl.itemUnit}）` }]
        : [
            { id: 'step1', expected: step1, maxLen: Math.max(2, step1MaxLen), label: `第 1 步（${tpl.itemUnit}）` },
            { id: 'step2', expected: answer, maxLen: ansMaxLen, label: `第 2 步（${tpl.itemUnit}）` }
          ],
      helperSpec: {
        type: 'bar_diagram',
        mode: 'two_step',
        step1Box: `${a} × ${b} ＝ ？（${tpl.itemUnit}）`,
        step2Box: `小計 ＋ ${c} ＝ 最終共幾${tpl.itemUnit}？`,
        prompt: `先算 ${a} × ${b} 得到第 1 步小計，再把結果加上 ${c} 就是總數！`
      },
      rescueDedupeKey: `cloud:${tpl.id}:${a}x${b}_add_${c}`,
      rescueSnapshot: {
        cloudType,
        templateId: tpl.id,
        a,
        b,
        c,
        actorA,
        actorB,
        stepMode,
        skillTag
      },
      explanationHtml: `✨ 第 1 步 <b>${a} × ${b} ＝ ${step1}</b>，第 2 步 <b>${step1} ＋ ${c} ＝ ${answer} ${tpl.itemUnit}</b>！`,
      spokenExplanation: `答對了！先算 ${a} 乘 ${b} 等於 ${step1}，再加 ${c} 等於 ${answer}`
    };
  }

  // 4. 兩步驟先乘後減・付錢找零（paid - a × b）
  if (cloudType === 'word_mul_sub_change_guided' || cloudType === 'word_mul_sub_change_direct') {
    const isDirect = spec.stepMode === 'direct_two_step' || cloudType === 'word_mul_sub_change_direct';
    const stepMode = isDirect ? 'direct_two_step' : 'guided_two_step';
    const tpl = TWO_STEP_SUB_CHANGE_TEMPLATES.find((t) => t.id === spec.templateId) || TWO_STEP_SUB_CHANGE_TEMPLATES[0];
    const a = Number(spec.a || 8);
    const b = Number(spec.b || 4);
    const step1 = a * b;
    const paid = Number(spec.paid || pickMinimalTwoStepBill(step1));
    const answer = paid - step1;
    const skillTag = skillOverride || (isDirect ? 'word_two_step_direct' : 'word_mul_sub_guided');
    const ansMaxLen = answer >= 100 ? 3 : 2;
    const twoStepModel = {
      variant: 'mul_sub_change',
      a,
      b,
      paid,
      step1,
      answer,
      unit: '元',
      step1Text: `${a} × ${b}`,
      step2Op: 'sub',
      step2TextPrefix: `${paid} − `,
      step2TextSuffix: '',
      step1Label: '第 1 步：先算一共買幾元',
      step2Label: `第 2 步：拿 ${paid} 元減去花費`
    };

    return {
      id: qId,
      realm: 'cloud',
      kind: 'word_two_step',
      cloudType,
      templateId: tpl.id,
      skillTag,
      uiMode: 'keypad',
      stepMode,
      displayFormat: isDirect ? 'direct_two_step' : 'guided_two_step',
      canToggleFormat: false,
      badge: isDirect ? `${tpl.icon} 兩步驟找零直解` : `${tpl.icon} 付錢找零兩步驟`,
      hint: isDirect ? `先算總價 ${a} × ${b}，再從付的 ${paid} 元扣掉總價算找零！` : '第 1 步先算總共買了幾元，第 2 步用付出去的錢減去花費！',
      storyHtml: tpl.buildStory(a, b, paid),
      twoStepModel,
      spokenPrompt: tpl.buildSpoken(a, b, paid),
      a,
      b,
      paid,
      step1Expected: step1,
      answer,
      slots: isDirect
        ? [{ id: 'ans', expected: answer, maxLen: ansMaxLen, label: '找回金額（元）' }]
        : [
            { id: 'step1', expected: step1, maxLen: 2, label: '第 1 步總價（元）' },
            { id: 'step2', expected: answer, maxLen: ansMaxLen, label: '第 2 步找零（元）' }
          ],
      helperSpec: {
        type: 'bar_diagram',
        mode: 'two_step',
        step1Box: `${a} 元 × ${b} ＝ 花費 ？（元）`,
        step2Box: `${paid} 元 − 花費 ＝ 找回幾元？`,
        prompt: `先算 ${a} × ${b} 花了多少元，再用帶去的 ${paid} 元減掉花費！`
      },
      rescueDedupeKey: `cloud:${tpl.id}:${paid}-${a}x${b}`,
      rescueSnapshot: {
        cloudType,
        templateId: tpl.id,
        a,
        b,
        paid,
        stepMode,
        skillTag
      },
      explanationHtml: `🛒 第 1 步花費 <b>${a} × ${b} ＝ ${step1} 元</b>，第 2 步找零 <b>${paid} − ${step1} ＝ ${answer} 元</b>！`,
      spokenExplanation: `答對了！一共花 ${step1} 元，付 ${paid} 元應找回 ${answer} 元`
    };
  }

  // 5. 兩步驟先乘後減・拿走剩餘（a × b - c）
  if (cloudType === 'word_mul_sub_left_guided' || cloudType === 'word_mul_sub_left_direct') {
    const isDirect = spec.stepMode === 'direct_two_step' || cloudType === 'word_mul_sub_left_direct';
    const stepMode = isDirect ? 'direct_two_step' : 'guided_two_step';
    const tpl = TWO_STEP_SUB_LEFT_TEMPLATES.find((t) => t.id === spec.templateId) || TWO_STEP_SUB_LEFT_TEMPLATES[0];
    const a = Number(spec.a || 6);
    const b = Number(spec.b || 4);
    const step1 = a * b;
    const c = Number(spec.c || 9);
    const answer = step1 - c;
    const skillTag = skillOverride || (isDirect ? 'word_two_step_direct' : 'word_mul_sub_guided');
    const ansMaxLen = answer >= 100 ? 3 : 2;
    const twoStepModel = {
      variant: 'mul_sub_left',
      a,
      b,
      c,
      step1,
      answer,
      unit: tpl.unit,
      step1Text: `${a} × ${b}`,
      step2Op: 'sub',
      step2TextPrefix: '',
      step2TextSuffix: `− ${c}`,
      step1Label: '第 1 步：先算原來一共有多少',
      step2Label: `第 2 步：減掉拿走或吃掉的 ${c}`
    };

    return {
      id: qId,
      realm: 'cloud',
      kind: 'word_two_step',
      cloudType,
      templateId: tpl.id,
      skillTag,
      uiMode: 'keypad',
      stepMode,
      displayFormat: isDirect ? 'direct_two_step' : 'guided_two_step',
      canToggleFormat: false,
      badge: isDirect ? `${tpl.icon} 兩步驟剩餘直解` : `${tpl.icon} 先乘後減兩步驟`,
      hint: isDirect ? `先算出總共 ${a} × ${b}，再減去用掉或分掉的 ${c}！` : '第 1 步算出原來全部有多少，第 2 步減去用掉的數量！',
      storyHtml: tpl.buildStory(a, b, c),
      twoStepModel,
      spokenPrompt: tpl.buildSpoken(a, b, c),
      a,
      b,
      c,
      step1Expected: step1,
      answer,
      slots: isDirect
        ? [{ id: 'ans', expected: answer, maxLen: ansMaxLen, label: `剩餘（${tpl.unit}）` }]
        : [
            { id: 'step1', expected: step1, maxLen: 2, label: `第 1 步全部（${tpl.unit}）` },
            { id: 'step2', expected: answer, maxLen: ansMaxLen, label: `第 2 步剩餘（${tpl.unit}）` }
          ],
      helperSpec: {
        type: 'bar_diagram',
        mode: 'two_step',
        step1Box: `${a} × ${b} ＝ 全部 ？（${tpl.unit}）`,
        step2Box: `全部 − ${c} ＝ 還剩幾${tpl.unit}？`,
        prompt: `先乘出原來的全部，再把拿走的 ${c} ${tpl.unit}扣掉！`
      },
      rescueDedupeKey: `cloud:${tpl.id}:${a}x${b}_sub_${c}`,
      rescueSnapshot: {
        cloudType,
        templateId: tpl.id,
        a,
        b,
        c,
        stepMode,
        skillTag
      },
      explanationHtml: `🍰 第 1 步共有 <b>${a} × ${b} ＝ ${step1} ${tpl.unit}</b>，第 2 步剩餘 <b>${step1} − ${c} ＝ ${answer} ${tpl.unit}</b>！`,
      spokenExplanation: `答對了！原有 ${step1}，拿走 ${c} 還剩 ${answer}`
    };
  }

  // 6. 雲端混戰復習題（sky_mixed_calc / sky_mixed_mul / sky_mixed_word_single）
  if (cloudType === 'sky_mixed_mul') {
    const a = Number(spec.a || randIntFn(6, 9));
    const b = Number(spec.b || randIntFn(3, 9));
    const qType = spec.qType || 'standard';
    const q = buildMulQuestion(a, b, qType, randIntFn);
    q.id = qId;
    q.realm = 'cloud';
    q.kind = 'mul';
    q.cloudType = 'sky_mixed_mul';
    q.templateId = 'sky_mul_' + qType;
    q.skillTag = skillOverride || 'sky_mixed_calc';
    q.uiMode = uiMode;
    q.stepMode = 'single';
    q.badge = '🌩️ 天空乘法混戰';
    q.rescueDedupeKey = `cloud:sky_mul:${qType}:${a}x${b}`;
    q.rescueSnapshot = {
      cloudType: 'sky_mixed_mul',
      templateId: q.templateId,
      a,
      b,
      qType,
      skillTag: q.skillTag
    };
    return q;
  }

  if (cloudType === 'sky_mixed_calc' || cloudType === 'sky_mixed_word_single') {
    const innerSpec = spec.innerSpec || { calcType: 'sub_across_zero', op: 'sub', a: 205, b: 68, maxLen: 3 };
    const q = buildCalcQuestionFromSpec(innerSpec, { uiMode, id: qId });
    q.realm = 'cloud';
    q.cloudType = cloudType;
    q.skillTag = skillOverride || 'sky_mixed_calc';
    q.rescueDedupeKey = 'cloud:sky_' + (q.rescueDedupeKey || qId);
    q.rescueSnapshot = {
      cloudType,
      templateId: q.templateId,
      innerSpec: q.rescueSnapshot || innerSpec,
      skillTag: q.skillTag
    };
    return q;
  }

  return buildCloudQuestionFromSpec(buildSeqStep110Spec(randIntFn, false), options);
}

/**
 * 檢查雲端應用王國全部題型的數學合理性與課綱範圍不變量
 */
export function validateCloudQuestionInvariants(q) {
  const errors = [];
  if (!q || typeof q !== 'object') {
    return { ok: false, errors: ['題目物件為空'] };
  }
  if (!ALLOWED_CLOUD_SKILL_TAGS.includes(q.skillTag)) {
    errors.push(`未知雲端 skillTag: ${q.skillTag}`);
  }
  if (!Array.isArray(q.slots) || q.slots.length === 0) {
    errors.push('slots 不得為空');
  }

  if (q.kind === 'seq') {
    const m = q.sequenceModel;
    if (!m || !validateSequenceProgression(m.numbers, m.step)) {
      errors.push('數列未能滿足固定步長遞推不變量');
    }
    if (m && m.numbers.some((n) => !Number.isInteger(n) || n < 0 || n > 1000)) {
      errors.push('數列出現負數或超出千以內範圍');
    }
    if (m && q.slots && q.slots[0] && q.slots[0].expected !== m.numbers[m.blankIdx]) {
      errors.push('數列預期答案與挖空車廂不符');
    }
  } else if (q.kind === 'place_value') {
    const exp = q.slots[0].expected;
    if (!Number.isInteger(exp) || exp <= 0 || exp > 1000) {
      errors.push(`位值題預期答案超出範圍: ${exp}`);
    }
    if (exp >= 1000 && q.slots[0].maxLen < 4) {
      errors.push(`1000 解答之 maxLen 必須 >= 4（實為 ${q.slots[0].maxLen}）`);
    } else if (exp >= 100 && q.slots[0].maxLen < 3) {
      errors.push(`三位數密碼 (${exp}) 之 maxLen 不得小於 3`);
    }
    if (q.cloudType === 'pv_compare_max_min') {
      if (exp < 100 || exp > 999) {
        errors.push(`三位數排數 (${exp}) 不得小於 100（禁止 0 在百位）`);
      }
    }
    if (q.cloudType === 'pv_compare_pair') {
      if (!Array.isArray(q.pairValues) || q.pairValues[0] === q.pairValues[1]) {
        errors.push('比較大小兩數不可相等');
      }
    }
  } else if (q.kind === 'word_two_step') {
    if (q.stepMode === 'guided_two_step' && q.slots.length !== 2) {
      errors.push('guided_two_step 必須恰好有 2 個步驟槽位');
    }
    if (q.stepMode === 'direct_two_step' && q.slots.length !== 1) {
      errors.push('direct_two_step 必須恰好有 1 個最終答案槽位');
    }
    const v = q.twoStepModel && q.twoStepModel.variant;
    if (v === 'mul_add') {
      if (q.a < 2 || q.a > 9 || q.b < 2 || q.b > 9) errors.push('先乘後加乘數超出 [2,9]');
      if (q.c < 5 || q.c > 85) errors.push(`先乘後加加數 c=${q.c} 超出 [5,85]`);
      if (q.answer > 200) errors.push(`先乘後加總和 ${q.answer} 超出 200`);
      if (q.actorA && q.actorB && q.actorA === q.actorB) errors.push('兩步驟比較題角色重複');
    } else if (v === 'mul_sub_change') {
      if (q.a < 2 || q.a > 9 || q.b < 2 || q.b > 9) errors.push('找零題乘數超出 [2,9]');
      if (!TWO_STEP_CHANGE_BILLS.includes(q.paid)) errors.push(`找零付款面額 ${q.paid} 不在清單中`);
      if (q.paid - q.a * q.b < 5) errors.push(`找零過小或為負：${q.paid} - ${q.a * q.b}`);
    } else if (v === 'mul_sub_left') {
      if (q.a < 3 || q.a > 9 || q.b < 3 || q.b > 9) errors.push('剩餘題乘數超出 [3,9]');
      const prod = q.a * q.b;
      if (q.c < 3 || q.c > Math.floor(prod * 0.75)) errors.push(`扣除數量 c=${q.c} 超出合理比例`);
      if (prod - q.c < 4) errors.push(`剩餘數量過少：${prod - q.c}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * 產生雲端選擇題誘答選項（跳數步差偏移、補零漏零陷阱與鄰近數）
 */
export function generateCloudChoices(q, count = 4, randIntFn = randInt) {
  if (!q || !q.slots || q.slots.length !== 1) return [];
  if (q.kind === 'add' || q.kind === 'sub' || q.kind === 'calc_missing' || q.kind === 'word_single') {
    return generateCalcChoices(q, count, randIntFn);
  }

  const target = q.slots[0].expected;
  const candidates = [];

  function pushCand(val) {
    if (typeof val !== 'number' || !Number.isInteger(val) || val <= 0 || val > 1000) return;
    if (val === target) return;
    if (candidates.indexOf(val) === -1) candidates.push(val);
  }

  if (q.kind === 'seq' && q.sequenceModel) {
    const step = q.sequenceModel.step || 10;
    pushCand(target + step);
    pushCand(target - step);
    pushCand(target + 10);
    pushCand(target - 10);
    pushCand(target + 1);
    pushCand(target - 1);
    pushCand(target + 5);
    pushCand(target - 5);
  } else if (q.kind === 'place_value') {
    if (q.placeValueModel && q.placeValueModel.mode === 'compose') {
      const h = q.placeValueModel.h || 1;
      const t = q.placeValueModel.t || 0;
      const o = q.placeValueModel.o || 0;
      // 補零常見錯誤（漏掉 0 變二位數、或百十個對調）
      if (t === 0) {
        pushCand(h * 10 + o);
        pushCand(h * 100 + o * 10);
      }
      if (o === 0) {
        pushCand(h * 10 + t);
        pushCand(h * 100 + t);
      }
      pushCand(h * 100 + o * 10 + t);
      pushCand(target + 10);
      pushCand(target - 10);
    } else if (q.cloudType === 'pv_compare_max_min' && Array.isArray(q.digits)) {
      const ds = q.digits;
      const p1 = ds[0] * 100 + ds[1] * 10 + ds[2];
      const p2 = ds[1] * 100 + ds[2] * 10 + ds[0];
      const p3 = ds[2] * 100 + ds[0] * 10 + ds[1];
      const p4 = ds[2] * 100 + ds[1] * 10 + ds[0];
      [p1, p2, p3, p4].forEach((val) => {
        if (val >= 100) pushCand(val);
      });
      pushCand(target + 9);
      pushCand(target - 9);
      pushCand(target + 10);
    } else if (q.cloudType === 'pv_compare_pair' && Array.isArray(q.pairValues)) {
      q.pairValues.forEach((v) => pushCand(v));
      pushCand(target + 10);
      pushCand(target - 10);
      pushCand(target + 1);
    } else {
      pushCand(target + 100);
      pushCand(target - 100);
      pushCand(target + 10);
      pushCand(target - 10);
      pushCand(target + 1);
    }
  } else {
    pushCand(target + 10);
    pushCand(target - 10);
    pushCand(target + 2);
    pushCand(target - 2);
    pushCand(target + 1);
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
    const cand = Math.max(1, target + randIntFn(-25, 25));
    if (cand <= 999 && options.indexOf(cand) === -1) {
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

function createSpecForCloudType(cloudType, randIntFn, avoidTemplateId) {
  if (cloudType === 'seq_step_1_10') return buildSeqStep110Spec(randIntFn, false);
  if (cloudType === 'seq_reverse_left') return buildSeqStep110Spec(randIntFn, true);
  if (cloudType === 'seq_step_2_5') return buildSeqStep25Spec(randIntFn);
  if (cloudType === 'pv_compose') return buildPvComposeSpec(randIntFn);
  if (cloudType === 'pv_compare_max_min') return buildPvCompareMaxMinSpec(randIntFn);
  if (cloudType === 'pv_compare_pair') return buildPvComparePairSpec(randIntFn);
  if (cloudType === 'pv_thousand_exchange') return buildPvThousandExchangeSpec(randIntFn);
  if (
    cloudType === 'word_mul_add_guided' ||
    cloudType === 'word_mul_add_compare_guided' ||
    cloudType === 'word_mul_add_direct'
  ) {
    return buildWordMulAddSpec(cloudType, randIntFn, avoidTemplateId);
  }
  if (cloudType === 'word_mul_sub_change_guided' || cloudType === 'word_mul_sub_change_direct') {
    return buildWordMulSubChangeSpec(cloudType, randIntFn, avoidTemplateId);
  }
  if (cloudType === 'word_mul_sub_left_guided' || cloudType === 'word_mul_sub_left_direct') {
    return buildWordMulSubLeftSpec(cloudType, randIntFn, avoidTemplateId);
  }
  if (cloudType === 'sky_mixed_mul') {
    return {
      cloudType: 'sky_mixed_mul',
      a: randIntFn(4, 9),
      b: randIntFn(2, 9),
      qType: pickFrom(['standard', 'missing_b', 'commutative'], randIntFn)
    };
  }
  if (cloudType === 'sky_mixed_word_single') {
    const subType = pickFrom(['word_buy_change_large', 'word_compare_large'], randIntFn);
    if (subType === 'word_buy_change_large') {
      const price = randIntFn(112, 265);
      const paid = price <= 145 ? 150 : price <= 192 ? 200 : 300;
      return {
        cloudType: 'sky_mixed_word_single',
        innerSpec: {
          calcType: 'word_buy_change_large',
          templateId: pickFrom(['change_blocks', 'change_puzzle', 'change_lantern'], randIntFn),
          op: 'sub',
          a: paid,
          b: price,
          paid,
          price,
          maxLen: 3
        }
      };
    }
    const small = randIntFn(110, 320);
    const diff = randIntFn(25, 140);
    const [actorA, actorB] = pickTwoActors(randIntFn);
    return {
      cloudType: 'sky_mixed_word_single',
      innerSpec: {
        calcType: 'word_compare_large',
        templateId: pickFrom(['compare_shells', 'compare_stickers', 'compare_blocks'], randIntFn),
        op: 'sub',
        a: small + diff,
        b: diff,
        big: small + diff,
        small,
        diff,
        actorA,
        actorB,
        compareVariant: 'reverse_more',
        maxLen: 3
      }
    };
  }

  // sky_mixed_calc：三位數加減、跨零退位或未知數混戰
  const pickCalc = pickFrom(['add_3d', 'sub_3d', 'sub_across_zero', 'calc_missing'], randIntFn);
  if (pickCalc === 'add_3d') {
    const a = randIntFn(125, 580);
    const b = randIntFn(115, 899 - a);
    return { cloudType: 'sky_mixed_calc', innerSpec: { calcType: 'add_3d', op: 'add', a, b, maxLen: 3 } };
  }
  if (pickCalc === 'sub_3d') {
    const a = randIntFn(325, 845);
    const b = randIntFn(112, a - 25);
    return { cloudType: 'sky_mixed_calc', innerSpec: { calcType: 'sub_3d', op: 'sub', a, b, maxLen: 3 } };
  }
  if (pickCalc === 'calc_missing') {
    const a = randIntFn(18, 65);
    const b = randIntFn(14, 95 - a);
    return {
      cloudType: 'sky_mixed_calc',
      innerSpec: { calcType: 'calc_missing_add', op: 'add', a, b, missingSlot: randIntFn(0, 1) === 0 ? 'left' : 'right', maxLen: 2 }
    };
  }
  const ah = randIntFn(2, 5);
  const ao = randIntFn(1, 6);
  const a = ah * 100 + ao;
  const bo = randIntFn(ao + 1, 9);
  const bt = randIntFn(2, 7);
  return {
    cloudType: 'sky_mixed_calc',
    innerSpec: { calcType: 'sub_across_zero', op: 'sub', a, b: bt * 10 + bo, maxLen: 3 }
  };
}

/**
 * 依據雲端應用王國關卡設定建構一組題目
 */
export function buildCloudStageQuestions(stage, options = {}) {
  const randIntFn = options.randIntFn || randInt;
  const count = Number(stage && stage.count) || 5;
  const cloudTypes =
    stage && Array.isArray(stage.cloudTypes) && stage.cloudTypes.length > 0
      ? stage.cloudTypes
      : ['seq_step_1_10'];

  const usedDedupeKeys = new Set();
  let lastWordTemplateId = '';
  const selected = [];
  const isFinalSkyBoss = Boolean(stage && (stage.stageKey === 'cloud:5-3' || stage.id === 'cloud:5-3'));

  for (let i = 0; i < count; i++) {
    const cloudType = cloudTypes[i % cloudTypes.length];
    let mode = (stage && stage.inputMode) || 'keypad';
    if (mode === 'mixed') {
      mode = i < Math.ceil(count / 2) ? 'choice' : 'keypad';
    }

    const skillTagOverride = isFinalSkyBoss && i >= count - 3 ? 'sky_boss_slayer' : null;
    let q = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const spec = createSpecForCloudType(cloudType, randIntFn, lastWordTemplateId);
      const candidate = buildCloudQuestionFromSpec(spec, {
        randIntFn,
        uiMode: mode,
        skillTagOverride
      });
      if (!usedDedupeKeys.has(candidate.rescueDedupeKey)) {
        q = candidate;
        break;
      }
      if (attempt === 14) {
        q = candidate;
      }
    }

    usedDedupeKeys.add(q.rescueDedupeKey);
    if (q.kind === 'word_two_step' || q.kind === 'word_single') {
      lastWordTemplateId = q.templateId;
    }
    selected.push(q);
  }

  return selected;
}

/**
 * 從 RescueCase JSON 快照重建雲端應用王國題目（支援一般、分步與直解模式）
 */
export function rebuildCloudQuestionFromSnapshot(entry) {
  if (!entry || !entry.snapshot) return null;
  const q = buildCloudQuestionFromSpec(entry.snapshot, { uiMode: 'keypad' });
  q.badge = '🆘 求救小精靈特訓';
  q.rescueCaseId = entry.id;
  q.rescueDedupeKey = entry.dedupeKey || q.rescueDedupeKey;
  return q;
}
