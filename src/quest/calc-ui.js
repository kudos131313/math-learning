/**
 * 數學冒險島：陽光加減群島題卡（橫式／位值色碼迷你直式）與小幫手（十進位積木／比較線段圖）HTML 渲染輔助模組
 */

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitDigits3(n) {
  const val = Math.max(0, Math.floor(Number(n) || 0));
  const h = Math.floor(val / 100);
  const t = Math.floor((val % 100) / 10);
  const o = val % 10;
  return { h, t, o };
}

/**
 * 渲染加減法橫式或迷你直式對齊卡 HTML
 */
export function renderCalcEquationHtml(q, displayFormat) {
  const fmt = displayFormat || q.displayFormat || 'equation';
  const eq = q.equationModel || { op: q.op || 'add', left: q.a, right: q.b, result: null, missingSlot: 'result', unit: '' };
  const opSym = eq.op === 'add' ? '＋' : '−';
  const unitHtml = eq.unit ? '<span class="mqst-eq-unit">' + escapeHtml(eq.unit) + '</span>' : '';
  const maxLen = (q.slots && q.slots[0] && q.slots[0].maxLen) || 2;
  const inputCls = 'mq-input-slot' + (maxLen >= 3 ? ' is-3d' : '');
  const slotHtml =
    '<input type="text" class="' +
    inputCls +
    '" data-slot-id="ans" maxlength="' +
    maxLen +
    '" inputmode="none" readonly aria-label="輸入答案" placeholder="?">';

  if (fmt === 'vertical_mini' && eq.missingSlot === 'result') {
    const aVal = Number(eq.left || 0);
    const bVal = Number(eq.right || 0);
    const ansVal = q.slots && q.slots[0] ? Number(q.slots[0].expected || 0) : 0;
    const hasHundreds = aVal >= 100 || bVal >= 100 || ansVal >= 100 || maxLen >= 3;
    const da = splitDigits3(aVal);
    const db = splitDigits3(bVal);

    const hHead = hasHundreds ? '<div class="mqst-vmini-head is-h">百位</div>' : '';
    const tHead = '<div class="mqst-vmini-head is-t">十位</div>';
    const oHead = '<div class="mqst-vmini-head is-o">個位</div>';

    const aHCell = hasHundreds
      ? '<div class="mqst-vmini-cell is-h">' + (da.h > 0 ? da.h : '') + '</div>'
      : '';
    const aTCell =
      '<div class="mqst-vmini-cell is-t">' + (da.h > 0 || da.t > 0 ? da.t : '') + '</div>';
    const aOCell = '<div class="mqst-vmini-cell is-o">' + da.o + '</div>';

    const bHCell = hasHundreds
      ? '<div class="mqst-vmini-cell is-h">' + (db.h > 0 ? db.h : '') + '</div>'
      : '';
    const bTCell =
      '<div class="mqst-vmini-cell is-t">' + (db.h > 0 || db.t > 0 ? db.t : '') + '</div>';
    const bOCell = '<div class="mqst-vmini-cell is-o">' + db.o + '</div>';

    const ansDisplay =
      q.uiMode === 'choice'
        ? '<span class="mqst-vmini-qmark">？</span>'
        : '<input type="text" class="mq-input-slot mqst-vmini-input' +
          (maxLen >= 3 ? ' is-3d' : '') +
          '" data-slot-id="ans" maxlength="' +
          maxLen +
          '" inputmode="none" readonly aria-label="輸入直式答案" placeholder="?">';

    return (
      '<div class="mqst-vmini-card' +
      (hasHundreds ? ' is-3col' : ' is-2col') +
      '">' +
      '<div class="mqst-vmini-grid">' +
      '<div class="mqst-vmini-op"></div>' +
      hHead +
      tHead +
      oHead +
      '<div class="mqst-vmini-op"></div>' +
      aHCell +
      aTCell +
      aOCell +
      '<div class="mqst-vmini-op">' +
      opSym +
      '</div>' +
      bHCell +
      bTCell +
      bOCell +
      '<div class="mqst-vmini-line"></div>' +
      '<div class="mqst-vmini-op"></div>' +
      '<div class="mqst-vmini-ans-wrap">' +
      ansDisplay +
      unitHtml +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  // 橫式呈現（含未知數左/右填空與一般橫式）
  const leftNode =
    eq.left === null
      ? q.uiMode === 'choice'
        ? '<span class="mq-num-box mqst-num-q">？</span>'
        : slotHtml
      : '<span class="mq-num-box is-a">' + eq.left + '</span>';

  const rightNode =
    eq.right === null
      ? q.uiMode === 'choice'
        ? '<span class="mq-num-box mqst-num-q">？</span>'
        : slotHtml
      : '<span class="mq-num-box is-b">' + eq.right + '</span>';

  const resultNode =
    eq.result === null
      ? q.uiMode === 'choice'
        ? '<span class="mq-num-box mqst-num-q">？</span>'
        : slotHtml
      : '<span class="mq-num-box">' + eq.result + '</span>';

  return (
    leftNode +
    '<span>' +
    opSym +
    '</span>' +
    rightNode +
    '<span>＝</span>' +
    resultNode +
    unitHtml
  );
}

function buildPlaceBlocksRow(num, label, blockGlyphFn) {
  const d = splitDigits3(num);
  let groups = '';
  if (d.h > 0) {
    let hs = '';
    for (let i = 0; i < d.h; i++) hs += blockGlyphFn('h');
    groups +=
      '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-h">百位 ' +
      d.h +
      '</span><div class="mqst-calc-pblks">' +
      hs +
      '</div></div>';
  }
  if (d.t > 0 || d.h > 0) {
    let ts = '';
    for (let i = 0; i < d.t; i++) ts += blockGlyphFn('t');
    groups +=
      '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-t">十位 ' +
      d.t +
      '</span><div class="mqst-calc-pblks">' +
      (ts || '<span class="mqst-calc-zero">0</span>') +
      '</div></div>';
  }
  let os = '';
  for (let i = 0; i < d.o; i++) os += blockGlyphFn('o');
  groups +=
    '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-o">個位 ' +
    d.o +
    '</span><div class="mqst-calc-pblks">' +
    (os || '<span class="mqst-calc-zero">0</span>') +
    '</div></div>';

  return (
    '<div class="mqst-calc-helper-num">' +
    '<div class="mqst-calc-helper-num-head">' +
    escapeHtml(label) +
    ' <strong>' +
    num +
    '</strong></div>' +
    '<div class="mqst-calc-helper-cols">' +
    groups +
    '</div>' +
    '</div>'
  );
}

/**
 * 渲染陽光加減群島小幫手 HTML（base10_calc 十進位積木拆解 或 bar_diagram 比較線段圖）
 */
export function renderCalcHelperHtml(q, blockGlyphFn) {
  const spec = q && q.helperSpec;
  if (!spec) return '';

  if (spec.type === 'bar_diagram') {
    return (
      '<div class="mqst-bar-diagram">' +
      '<div class="mqst-bar-row">' +
      '  <span class="mqst-bar-name">' +
      escapeHtml(spec.topLabel) +
      '</span>' +
      '  <div class="mqst-bar-track"><div class="mqst-bar-fill is-long">' +
      escapeHtml(spec.topText) +
      '</div></div>' +
      '</div>' +
      '<div class="mqst-bar-row">' +
      '  <span class="mqst-bar-name">' +
      escapeHtml(spec.bottomLabel) +
      '</span>' +
      '  <div class="mqst-bar-track"><div class="mqst-bar-fill is-short">' +
      escapeHtml(spec.bottomText) +
      '</div><div class="mqst-bar-diff">' +
      escapeHtml(spec.diffText) +
      '</div></div>' +
      '</div>' +
      '<div class="mqst-calc-helper-tip">💡 ' +
      escapeHtml(spec.prompt) +
      '</div>' +
      (Number.isFinite(Number(q && q.a)) && Number.isFinite(Number(q && q.b)) && Number(q.a) >= 1 && Number(q.a) <= 999 && Number(q.b) >= 1 && Number(q.b) <= 999
        ? '<div class="mqst-calc-helper-actions">' +
          '<button type="button" class="mqst-calc-goto-lab-btn" data-goto-calc-lab="1" data-a="' +
          Math.floor(Number(q.a)) +
          '" data-b="' +
          Math.floor(Number(q.b)) +
          '" data-op="' +
          (q.op === '-' ? 'sub' : 'add') +
          '">🧱 去直式教室用積木排排看</button></div>'
        : '') +
      '</div>'
    );
  }

  // base10_calc 十進位積木小幫手
  if (spec.mode === 'missing') {
    const isAdd = spec.op === 'add';
    const knownPart = q.equationModel && q.equationModel.missingSlot === 'left' ? spec.b : spec.a;
    const tipText = isAdd
      ? `總和是 ${spec.c}，拿走已知的 ${knownPart}，剩下的就是空格裡的數！`
      : q.equationModel && q.equationModel.missingSlot === 'left'
        ? `被減數是原來的全部，把拿走的 ${spec.b} 和剩下的 ${spec.c} 合起來！`
        : `原本有 ${spec.a}，最後剩下 ${spec.c}，兩數相差的就是被減去的數！`;
    const labOp = isAdd ? 'sub' : q.equationModel && q.equationModel.missingSlot === 'left' ? 'add' : 'sub';
    const labA = Number.isFinite(Number(spec.c)) && isAdd ? spec.c : Math.max(Number(spec.a || 0), Number(spec.b || 0), Number(spec.c || 0));
    const labB = isAdd ? knownPart : Math.min(Number(spec.b || spec.c || 10), labA);
    return (
      '<div class="mqst-calc-helper">' +
      '<div class="mqst-calc-helper-tip">🔍 <b>偵探提示：</b>' +
      escapeHtml(tipText) +
      '</div>' +
      (labA >= 1 && labA <= 999 && labB >= 1 && labB <= 999
        ? '<div class="mqst-calc-helper-actions">' +
          '<button type="button" class="mqst-calc-goto-lab-btn" data-goto-calc-lab="1" data-a="' +
          Math.floor(labA) +
          '" data-b="' +
          Math.floor(labB) +
          '" data-op="' +
          labOp +
          '">🧱 去直式教室試算看看</button></div>'
        : '') +
      '</div>'
    );
  }

  const d = spec.decomp;
  const isAdd = spec.op === 'add';
  let tipMsg = '';
  if (isAdd) {
    if (d.carry_o > 0 && d.carry_t > 0) {
      tipMsg = `個位 ${d.a_o} ＋ ${d.b_o} ＝ ${d.o_sum}，把 10 個一捆成 1 條十；十位相加後也滿十，再進 1 片百！`;
    } else if (d.carry_o > 0) {
      tipMsg = `個位 ${d.a_o} ＋ ${d.b_o} ＝ ${d.o_sum}，超過 9 顆！記得把 10 個一捆成 1 條十送給十位！`;
    } else if (d.carry_t > 0) {
      tipMsg = `十位 ${d.a_t} ＋ ${d.b_t} 滿十了，10 條十合成 1 片水藍百格板！`;
    } else {
      tipMsg = `個位對個位、十位對十位，把兩邊的積木直接合在一起數一數！`;
    }
  } else if (d.isAcrossZeroBorrow) {
    tipMsg = `十位是 0 條不夠借！先向百位借 1 片百拆成 10 條十，再借 1 條十給個位，十位留下 9 條、個位變成 ${d.effective_o} 顆再減！`;
  } else if (d.needsBorrow_o) {
    tipMsg = `個位只有 ${d.a_o} 顆，拿不走 ${d.b_o} 顆！先向十位借 1 條十拆成 10 顆一，變成 ${d.effective_o} − ${d.b_o}！`;
  } else if (d.needsBorrow_t) {
    tipMsg = `十位不夠減時，向百位借 1 片百格板拆成 10 條十！`;
  } else {
    tipMsg = `個位與十位都夠減，從 ${spec.a} 拿走 ${spec.b} 的積木數量！`;
  }

  const rowHtml =
    '<div class="mqst-calc-helper-row">' +
    buildPlaceBlocksRow(spec.a, isAdd ? '被加數' : '被減數', blockGlyphFn) +
    '<div class="mqst-calc-helper-op">' +
    (isAdd ? '＋' : '−') +
    '</div>' +
    buildPlaceBlocksRow(spec.b, isAdd ? '加數' : '減數', blockGlyphFn) +
    '</div>';

  const labBtnHtml =
    spec.a >= 1 && spec.a <= 999 && spec.b >= 1 && spec.b <= 999
      ? '<div class="mqst-calc-helper-actions">' +
        '<button type="button" class="mqst-calc-goto-lab-btn" data-goto-calc-lab="1" data-a="' +
        spec.a +
        '" data-b="' +
        spec.b +
        '" data-op="' +
        spec.op +
        '">🧱 去直式教室用動畫慢慢看</button>' +
        '</div>'
      : '';

  return (
    '<div class="mqst-calc-helper">' +
    rowHtml +
    '<div class="mqst-calc-helper-tip">💡 ' +
    escapeHtml(tipMsg) +
    '</div>' +
    labBtnHtml +
    '</div>'
  );
}
