/**
 * 直式加減法數值拆解與教學步驟解說（純函式領域模組）
 */

export const CALC_PRESETS = {
  add: [
    { label: '無進位 (23 + 14)', a: 23, b: 14, desc: '個位十位直接合體，沒有滿十' },
    { label: '個位進位 (28 + 15)', a: 28, b: 15, desc: '個位滿十，捆成一條十進位' },
    { label: '九的進位 (59 + 24)', a: 59, b: 24, desc: '遇到 9，加 1 就滿十進位' },
    { label: '進到百位 (86 + 47)', a: 86, b: 47, desc: '個位進位，十位也滿十進到百位' }
  ],
  sub: [
    { label: '無退位 (35 − 12)', a: 35, b: 12, desc: '個位與十位直接扣除，個位夠減' },
    { label: '個位退位 (42 − 17)', a: 42, b: 17, desc: '個位不夠減，向十位借 1 條拆成 10 個一' },
    { label: '尾數是零 (60 − 24)', a: 60, b: 24, desc: '個位是 0，一定要向十位借一條' },
    { label: '百位退位 (105 − 38)', a: 105, b: 38, desc: '向十位借、十位再向百位借' }
  ]
};

export function getCalcDecomp(a, b, op) {
  const a_h = Math.floor(a / 100);
  const a_t = Math.floor((a % 100) / 10);
  const a_o = a % 10;

  const b_h = Math.floor(b / 100);
  const b_t = Math.floor((b % 100) / 10);
  const b_o = b % 10;

  if (op === 'add') {
    const o_sum = a_o + b_o;
    const carry_o = o_sum >= 10 ? 1 : 0;
    const ans_o = o_sum % 10;

    const t_sum = a_t + b_t + carry_o;
    const carry_t = t_sum >= 10 ? 1 : 0;
    const ans_t = t_sum % 10;

    const ans_h = a_h + b_h + carry_t;
    const total = a + b;

    return {
      a, b, op: 'add',
      a_h, a_t, a_o,
      b_h, b_t, b_o,
      o_sum, carry_o, ans_o,
      t_sum, carry_t, ans_t,
      ans_h, total,
      needsCarry: carry_o > 0
    };
  }

  const needsBorrow_o = a_o < b_o;
  const isAcrossZeroBorrow = needsBorrow_o && a_t === 0 && a_h > 0;
  const borrowed_t = needsBorrow_o ? a_t - 1 : a_t;
  const effective_o = needsBorrow_o ? a_o + 10 : a_o;
  const ans_o = effective_o - b_o;

  let needsBorrow_t = false;
  let borrowed_h = a_h;
  let effective_t = borrowed_t;

  if (isAcrossZeroBorrow) {
    // 百位跨零退位：十位先向百位借 1 個百拆成 10 個十，再借 1 條給個位，十位留下 9 個十
    needsBorrow_t = true;
    borrowed_h = a_h - 1;
    effective_t = 9;
  } else if (borrowed_t < b_t) {
    needsBorrow_t = true;
    borrowed_h = a_h - 1;
    effective_t = borrowed_t + 10;
  }

  const ans_t = effective_t - b_t;
  const ans_h = borrowed_h - b_h;
  const diff = a - b;

  return {
    a, b, op: 'sub',
    a_h, a_t, a_o,
    b_h, b_t, b_o,
    needsBorrow_o,
    isAcrossZeroBorrow,
    borrowed_t,
    effective_o,
    ans_o,
    needsBorrow_t,
    borrowed_h,
    effective_t,
    ans_t,
    ans_h,
    total: diff
  };
}

export function getStepExplanation(d, step) {
  if (step === 0) {
    return {
      pill: '第 1 步 / 共 4 步：位值對齊排排站',
      text: '先把數字排整齊！<em>個位對齊個位</em>（小方塊）、<em>十位對齊十位</em>（長條），同一種位置才能相加減喔！',
      speak: '先把數字排整齊！個位對齊個位，十位對齊十位，同一種位置才能相加減喔！',
      showPrompt: false
    };
  }

  if (step === 1) {
    if (d.op === 'add') {
      if (d.needsCarry) {
        return {
          pill: '第 2 步 / 共 4 步：先算個位',
          text: '先算個位：' + d.a_o + ' ＋ ' + d.b_o + ' ＝ <em>' + d.o_sum + '</em>。超過 9 顆了！個位放不下，必須把 <em>10 個一捆成 1 條十</em>！',
          speak: '先算個位：' + d.a_o + ' 加 ' + d.b_o + ' 等於 ' + d.o_sum + '。超過 9 個了！必須滿十進一喔！',
          showPrompt: true,
          promptBtn: '點擊把 10 顆積木捆成 1 條十'
        };
      }
      return {
        pill: '第 2 步 / 共 4 步：先算個位',
        text: '先算個位：' + d.a_o + ' ＋ ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>。沒有超過 9，在個位寫上 <em>' + d.ans_o + '</em>！',
        speak: '先算個位：' + d.a_o + ' 加 ' + d.b_o + ' 等於 ' + d.ans_o + '，在個位寫上 ' + d.ans_o + '。',
        showPrompt: false
      };
    }

    if (d.isAcrossZeroBorrow) {
      return {
        pill: '第 2 步 / 共 4 步：先算個位',
        text: '先算個位：個位只有 <em>' + d.a_o + '</em> 顆，拿不走 <em>' + d.b_o + '</em> 顆！想向十位借，但<em>十位是 0 條</em>，要先向百位借 1 個百拆成 10 條十，再借 1 條給個位！',
        speak: '先算個位：個位只有 ' + d.a_o + ' 個，不夠減 ' + d.b_o + ' 個！十位是 0，要先向百位借 1 個百拆開，再借給個位！',
        showPrompt: true,
        promptBtn: '點擊啟動百位退位借十',
        isBorrow: true
      };
    }
    if (d.needsBorrow_o) {
      return {
        pill: '第 2 步 / 共 4 步：先算個位',
        text: '先算個位：個位只有 <em>' + d.a_o + '</em> 顆，拿不走 <em>' + d.b_o + '</em> 顆！個位不夠減，要向十位<em>借 1 條十</em>來拆開幫忙！',
        speak: '先算個位：個位只有 ' + d.a_o + ' 個，不夠減 ' + d.b_o + ' 個！要向十位借一條十來拆開幫忙！',
        showPrompt: true,
        promptBtn: '點擊向十位借 1 條拆成 10 顆一',
        isBorrow: true
      };
    }
    return {
      pill: '第 2 步 / 共 4 步：先算個位',
      text: '先算個位：從 ' + d.a_o + ' 顆拿走 ' + d.b_o + ' 顆，' + d.a_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>，在個位寫上 <em>' + d.ans_o + '</em>！',
      speak: '先算個位：' + d.a_o + ' 減 ' + d.b_o + ' 等於 ' + d.ans_o + '，在個位寫上 ' + d.ans_o + '。',
      showPrompt: false
    };
  }

  if (step === 2) {
    if (d.op === 'add') {
      if (d.needsCarry) {
        return {
          pill: '第 2 步 (進位)：滿十進一到十位',
          text: '10 顆積木聚合成 1 條十，送給十位！直式十位上方寫一個<em>金色小 1</em>，個位留下 <em>' + d.ans_o + '</em> 顆！',
          speak: '滿十進一！十位頭上寫一個小小的 1，個位寫 ' + d.ans_o + '！',
          showPrompt: false,
          sound: 'carry'
        };
      }
      return {
        pill: '第 2 步：個位算好囉',
        text: '個位計算完畢，寫上 <em>' + d.ans_o + '</em>。接下來準備計算十位！',
        speak: '個位算好囉，接下來準備計算十位！',
        showPrompt: false
      };
    }

    if (d.isAcrossZeroBorrow) {
      return {
        pill: '第 2 步 (借位)：百位退位與借一拆十',
        text: '百位借 1 劃掉記 <em>0</em>，十位向百位借 10 條、再借 1 條給個位後劃掉記 <em>9</em>；個位得到 10 顆變成 <em>' + d.effective_o + '</em> 顆，' + d.effective_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>！',
        speak: '百位退位！百位劃掉記 0，十位劃掉記 9；個位得到 10 顆，減 ' + d.b_o + ' 等於 ' + d.ans_o + '！',
        showPrompt: false,
        sound: 'borrow'
      };
    }
    if (d.needsBorrow_o) {
      return {
        pill: '第 2 步 (借位)：借一拆十到個位',
        text: '向十位借 1 條十，十位劃掉記上剩餘的 <em>' + d.borrowed_t + '</em>；拆成 10 顆積木到個位，個位變成 <em>' + d.effective_o + '</em> 顆，' + d.effective_o + ' − ' + d.b_o + ' ＝ <em>' + d.ans_o + '</em>！',
        speak: '借一拆十！十位劃掉記 ' + d.borrowed_t + '，個位現在有 ' + d.effective_o + ' 個，減 ' + d.b_o + ' 等於 ' + d.ans_o + '！',
        showPrompt: false,
        sound: 'borrow'
      };
    }
    return {
      pill: '第 2 步：個位算好囉',
      text: '個位扣除完畢，寫上 <em>' + d.ans_o + '</em>。接下來準備計算十位！',
      speak: '個位算好囉，接下來準備計算十位！',
      showPrompt: false
    };
  }

  if (step === 3) {
    if (d.op === 'add') {
      const carryTNote = d.carry_t > 0 ? '，滿十向百位進 1（百位頭上記上金色小 1）！' : '！';
      const expText = d.carry_o > 0
        ? '接著算十位：別忘了頭上的小 1 喔！<em>1 ＋ ' + d.a_t + ' ＋ ' + d.b_t + ' ＝ ' + d.t_sum + '</em>。在十位寫上 <em>' + d.ans_t + '</em>' + carryTNote
        : '接著算十位：' + d.a_t + ' ＋ ' + d.b_t + ' ＝ <em>' + d.t_sum + '</em>。在十位寫上 <em>' + d.ans_t + '</em>' + carryTNote;
      const expSpeak = d.carry_o > 0
        ? '接著算十位：進位的小 1 加上 ' + d.a_t + ' 再加 ' + d.b_t + ' 等於 ' + d.t_sum + '，在十位寫上 ' + d.ans_t + (d.carry_t > 0 ? '，滿十進一到百位！' : '！')
        : '接著算十位：' + d.a_t + ' 加 ' + d.b_t + ' 等於 ' + d.t_sum + '，在十位寫上 ' + d.ans_t + (d.carry_t > 0 ? '，滿十進一到百位！' : '！');
      return {
        pill: '第 3 步 / 共 4 步：再算十位',
        text: expText,
        speak: expSpeak,
        showPrompt: false
      };
    }

    let subExpText = '';
    let subExpSpeak = '';

    if (d.isAcrossZeroBorrow) {
      subExpText = '接著算十位：看著十位頭頂沒被劃掉的 <em>9</em> 條十。<em>9 − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
      subExpSpeak = '接著算十位：十位剩下 9 條十，9 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，在十位寫上 ' + d.ans_t + '！';
    } else if (d.needsBorrow_t) {
      const tMarkDesc = d.needsBorrow_o ? ('劃掉合併記 <em>' + d.effective_t + '</em>') : ('劃掉改記 <em>' + d.effective_t + '</em>');
      const tMarkSpeak = d.needsBorrow_o ? ('十位劃掉合併記 ' + d.effective_t) : ('十位劃掉改記 ' + d.effective_t);
      subExpText = '接著算十位：百位劃掉記 <em>' + d.borrowed_h + '</em>，十位' + tMarkDesc + '。<em>' + d.effective_t + ' − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
      subExpSpeak = '接著算十位：百位借出 1 剩下 ' + d.borrowed_h + '，' + tMarkSpeak + '，' + d.effective_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
    } else if (d.needsBorrow_o) {
      subExpText = '接著算十位：看著十位頭頂劃掉後剩餘的 <em>' + d.borrowed_t + '</em> 條。<em>' + d.borrowed_t + ' − ' + d.b_t + ' ＝ ' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
      subExpSpeak = '接著算十位：十位借出 1 條剩下 ' + d.borrowed_t + ' 條，' + d.borrowed_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，在十位寫上 ' + d.ans_t + '！';
    } else {
      subExpText = '接著算十位：' + d.a_t + ' − ' + d.b_t + ' ＝ <em>' + d.ans_t + '</em>，在十位寫上 <em>' + d.ans_t + '</em>！';
      subExpSpeak = '接著算十位：' + d.a_t + ' 減 ' + d.b_t + ' 等於 ' + d.ans_t + '，寫上 ' + d.ans_t + '！';
    }

    return {
      pill: '第 3 步 / 共 4 步：再算十位',
      text: subExpText,
      speak: subExpSpeak,
      showPrompt: false
    };
  }

  const opWord = d.op === 'add' ? ' 加 ' : ' 減 ';
  let extraHNote = '';
  if (d.op === 'sub' && d.a_h > 0 && d.ans_h === 0 && d.b_h === 0) {
    extraHNote = '（百位借出後剩 0，最高位 0 省略不寫喔！）';
  }
  return {
    pill: '第 4 步 / 共 4 步：計算完成！',
    text: '太厲害了！<em>' + d.a + (d.op === 'add' ? ' ＋ ' : ' − ') + d.b + ' ＝ ' + d.total + '</em>' + extraHNote + '。橫式與直式的答案完全一致！',
    speak: '太棒了！' + d.a + opWord + d.b + ' 等於 ' + d.total + '！計算完成！',
    showPrompt: false,
    sound: 'correct'
  };
}
