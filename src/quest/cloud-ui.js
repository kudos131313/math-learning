/**
 * 數學冒險島：雲端應用王國題卡（跳數車廂／位值金庫卡／兩步驟分步與直解）及小幫手渲染模組
 */

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDigitInputHtml(slotId, maxLen, extraClass = '') {
  const cls =
    'mq-input-slot' +
    (maxLen >= 4 ? ' is-4d' : maxLen === 3 ? ' is-3d' : '') +
    (extraClass ? ' ' + extraClass : '');
  return (
    '<input type="text" class="' +
    cls +
    '" data-slot-id="' +
    escapeHtml(slotId) +
    '" maxlength="' +
    maxLen +
    '" inputmode="none" readonly aria-label="輸入答案" placeholder="?">'
  );
}

/**
 * 渲染雲端應用王國題目主視覺算式列 HTML
 */
export function renderCloudQuestionHtml(q, state = { stepIdx: 0 }) {
  const stepIdx = Number(state && state.stepIdx) || 0;

  // 1. 跳數密碼 5 節迷你火車車廂
  if (q.displayFormat === 'sequence_cards' && q.sequenceModel) {
    const m = q.sequenceModel;
    const stepStr = m.step > 0 ? `+${m.step}` : `${m.step}`;
    const maxLen = (q.slots && q.slots[0] && q.slots[0].maxLen) || 3;
    let html = '<div class="mqst-seq-train">';
    m.numbers.forEach((num, idx) => {
      const isBlank = idx === m.blankIdx;
      html += '<div class="mqst-seq-car' + (isBlank ? ' is-blank' : '') + '">';
      if (isBlank) {
        html +=
          q.uiMode === 'choice'
            ? '<span class="mq-num-box mqst-num-q">？</span>'
            : buildDigitInputHtml('ans', maxLen, 'mqst-seq-input');
      } else {
        html += '<span class="mqst-seq-num">' + num + '</span>';
      }
      html += '</div>';
      if (idx < m.numbers.length - 1) {
        html += '<div class="mqst-seq-arc"><span>' + escapeHtml(stepStr) + '</span>➔</div>';
      }
    });
    html += '</div>';
    return html;
  }

  // 2. 位值金庫卡片（組數／比大小／排最大最小／千位換算）
  if (q.displayFormat === 'place_value_cards' && q.placeValueModel) {
    const pm = q.placeValueModel;
    const maxLen = (q.slots && q.slots[0] && q.slots[0].maxLen) || 3;
    const cardsHtml = (pm.cards || [])
      .map(
        (c) =>
          '<div class="mqst-pv-card tone-' +
          escapeHtml(c.tone || 'h') +
          '">' +
          '<span class="mqst-pv-card-lbl">' +
          escapeHtml(c.label) +
          '</span>' +
          '<strong class="mqst-pv-card-val">' +
          escapeHtml(c.value) +
          '</strong>' +
          '</div>'
      )
      .join('');
    const ansSlotHtml =
      q.uiMode === 'choice'
        ? '<span class="mq-num-box mqst-num-q">？</span>'
        : buildDigitInputHtml('ans', maxLen, 'mqst-pv-input');
    const unitHtml = pm.unit ? '<span class="mqst-eq-unit">' + escapeHtml(pm.unit) + '</span>' : '';

    return (
      '<div class="mqst-pv-stage">' +
      '<div class="mqst-pv-cards-row">' +
      cardsHtml +
      '</div>' +
      '<div class="mqst-pv-answer-row">' +
      '<span class="mqst-pv-eq-arrow">＝</span>' +
      ansSlotHtml +
      unitHtml +
      '</div>' +
      '</div>'
    );
  }

  // 3. 兩步驟分步引導模式（第 1 步鎖定 ➔ 第 2 步解鎖）
  if (q.stepMode === 'guided_two_step' && q.twoStepModel) {
    const m = q.twoStepModel;
    const step1Slot = q.slots[0] || { id: 'step1', expected: m.step1, maxLen: 2 };
    const step2Slot = q.slots[1] || { id: 'step2', expected: m.answer, maxLen: 3 };
    const unitHtml = m.unit ? '<span class="mqst-eq-unit">' + escapeHtml(m.unit) + '</span>' : '';

    const trackerHtml =
      '<ol class="mqst-step-tracker" aria-label="兩步驟解題進度">' +
      '<li class="mqst-step-chip' +
      (stepIdx === 0 ? ' is-current' : ' is-done') +
      '"' +
      (stepIdx === 0 ? ' aria-current="step"' : '') +
      '>' +
      (stepIdx === 0 ? '① 第 1 步：算小計' : '✅ 第 1 步已完成') +
      '</li>' +
      '<li class="mqst-step-chip' +
      (stepIdx === 1 ? ' is-current' : ' is-locked') +
      '"' +
      (stepIdx === 1 ? ' aria-current="step"' : '') +
      '>' +
      (stepIdx === 1 ? '② 第 2 步：算最後答案' : '🔒 第 2 步待解鎖') +
      '</li>' +
      '</ol>';

    const step1RowHtml =
      stepIdx === 0
        ? '<div class="mqst-two-step-row is-active">' +
          '<span class="mqst-two-step-badge">第 1 步</span>' +
          '<span class="mq-num-box is-a">' +
          m.a +
          '</span><span>×</span><span class="mq-num-box is-b">' +
          m.b +
          '</span><span>＝</span>' +
          buildDigitInputHtml(step1Slot.id, step1Slot.maxLen, 'mqst-step-input') +
          unitHtml +
          '</div>'
        : '<div class="mqst-two-step-row is-done">' +
          '<span class="mqst-two-step-badge is-done">✅ 第 1 步完成</span>' +
          '<span class="mq-num-box is-a">' +
          m.a +
          '</span><span>×</span><span class="mq-num-box is-b">' +
          m.b +
          '</span><span>＝</span><span class="mqst-step-locked-val">' +
          m.step1 +
          ' ' +
          escapeHtml(m.unit) +
          '</span>' +
          '</div>';

    let step2FormulaHtml = '';
    if (m.variant === 'mul_sub_change') {
      step2FormulaHtml =
        '<span class="mq-num-box is-a">' +
        m.paid +
        '</span><span>−</span><span class="mqst-step-carry-pill">' +
        (stepIdx === 1 ? m.step1 : '第1步結果') +
        '</span>';
    } else if (m.variant === 'mul_sub_left') {
      step2FormulaHtml =
        '<span class="mqst-step-carry-pill">' +
        (stepIdx === 1 ? m.step1 : '第1步結果') +
        '</span><span>−</span><span class="mq-num-box is-b">' +
        m.c +
        '</span>';
    } else {
      step2FormulaHtml =
        '<span class="mqst-step-carry-pill">' +
        (stepIdx === 1 ? m.step1 : '第1步結果') +
        '</span><span>＋</span><span class="mq-num-box is-b">' +
        m.c +
        '</span>';
    }

    const step2RowHtml =
      stepIdx === 1
        ? '<div class="mqst-two-step-row is-active">' +
          '<span class="mqst-two-step-badge">第 2 步</span>' +
          step2FormulaHtml +
          '<span>＝</span>' +
          buildDigitInputHtml(step2Slot.id, step2Slot.maxLen, 'mqst-step-input') +
          unitHtml +
          '</div>'
        : '<div class="mqst-two-step-row is-waiting">' +
          '<span class="mqst-two-step-badge is-locked">🔒 第 2 步</span>' +
          step2FormulaHtml +
          '<span>＝</span><span class="mqst-step-wait-q">？</span>' +
          unitHtml +
          '</div>';

    return '<div class="mqst-two-step-wrap">' + trackerHtml + step1RowHtml + step2RowHtml + '</div>';
  }

  // 4. 兩步驟一步直解模式（魔王關與星光天空城）
  if (q.stepMode === 'direct_two_step' && q.twoStepModel) {
    const m = q.twoStepModel;
    const ansSlot = q.slots[0] || { id: 'ans', maxLen: 3 };
    const unitHtml = m.unit ? '<span class="mqst-eq-unit">' + escapeHtml(m.unit) + '</span>' : '';
    return (
      '<div class="mqst-direct-step-wrap">' +
      '<span class="mqst-direct-step-pill">⚡ 一步直解挑戰</span>' +
      '<div class="mqst-direct-answer-line">' +
      '<span>最後答案 ＝</span>' +
      buildDigitInputHtml(ansSlot.id, ansSlot.maxLen, 'mqst-direct-input') +
      unitHtml +
      '</div>' +
      '</div>'
    );
  }

  return '';
}

/**
 * 渲染雲端應用王國 3 種視覺小幫手 HTML（不劇透答案）
 */
export function renderCloudHelperHtml(q, blockGlyphFn) {
  const spec = q && q.helperSpec;
  if (!spec) return '';

  // A. 5 節跳數迷你火車小幫手
  if (spec.type === 'mini_train') {
    const nums = spec.numbers || [];
    const step = Number(spec.step || 10);
    const arcTxt = step > 0 ? `+${step}` : `${step}`;
    let trainHtml = '<div class="mqst-mini-train-row">';
    nums.forEach((n, idx) => {
      const hidden = idx === spec.blankIdx;
      trainHtml +=
        '<div class="mqst-mini-car' +
        (hidden ? ' is-mystery' : '') +
        '">' +
        (hidden ? '？' : n) +
        '</div>';
      if (idx < nums.length - 1) {
        trainHtml += '<span class="mqst-mini-arc">' + escapeHtml(arcTxt) + '</span>';
      }
    });
    trainHtml += '</div>';

    return (
      '<div class="mqst-calc-helper">' +
      trainHtml +
      '<div class="mqst-calc-helper-tip">🚂 <b>列車規律提示：</b>每往右跳一節車廂就變化 <b>' +
      escapeHtml(arcTxt) +
      '</b>，先看相鄰兩節已知車廂的差距！</div>' +
      '<div class="mqst-calc-helper-actions">' +
      '<button type="button" class="mqst-calc-goto-lab-btn" data-goto-unit="seq">🚂 去跳數列車教室慢慢看</button>' +
      '</div>' +
      '</div>'
    );
  }

  // B. 千以內位值積木提示卡（含補零提示，絕不暴雷組成數）
  if (spec.type === 'place_value_blocks') {
    let visualHtml = '';
    if (spec.mode === 'compose' && typeof blockGlyphFn === 'function') {
      let hStr = '';
      for (let i = 0; i < (spec.h || 0); i++) hStr += blockGlyphFn('h');
      let tStr = '';
      for (let j = 0; j < (spec.t || 0); j++) tStr += blockGlyphFn('t');
      let oStr = '';
      for (let k = 0; k < (spec.o || 0); k++) oStr += blockGlyphFn('o');

      visualHtml =
        '<div class="mqst-calc-helper-cols">' +
        '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-h">百位 ' +
        (spec.h || 0) +
        '</span><div class="mqst-calc-pblks">' +
        (hStr || '<span class="mqst-calc-zero">0</span>') +
        '</div></div>' +
        '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-t">十位 ' +
        (spec.t || 0) +
        '</span><div class="mqst-calc-pblks">' +
        (tStr || '<span class="mqst-calc-zero">0（補零）</span>') +
        '</div></div>' +
        '<div class="mqst-calc-pcol"><span class="mqst-calc-ptag is-o">個位 ' +
        (spec.o || 0) +
        '</span><div class="mqst-calc-pblks">' +
        (oStr || '<span class="mqst-calc-zero">0（補零）</span>') +
        '</div></div>' +
        '</div>';
    }

    return (
      '<div class="mqst-calc-helper">' +
      visualHtml +
      '<div class="mqst-calc-helper-tip">💎 <b>位值偵探提示：</b>' +
      escapeHtml(spec.tip) +
      '</div>' +
      '<div class="mqst-calc-helper-actions">' +
      '<button type="button" class="mqst-calc-goto-lab-btn" data-goto-unit="learn">🧱 去位值探索屋動手擺積木</button>' +
      '</div>' +
      '</div>'
    );
  }

  // C. 兩步驟推理框線段圖（不劇透答案）
  if (spec.type === 'bar_diagram' && spec.mode === 'two_step') {
    return (
      '<div class="mqst-twostep-diagram">' +
      '<div class="mqst-twostep-flow">' +
      '<div class="mqst-twostep-box is-step1">' +
      '<span class="mqst-twostep-tag">第 1 步：算乘法小計</span>' +
      '<strong>' +
      escapeHtml(spec.step1Box) +
      '</strong>' +
      '</div>' +
      '<span class="mqst-twostep-arrow" aria-hidden="true">➔</span>' +
      '<div class="mqst-twostep-box is-step2">' +
      '<span class="mqst-twostep-tag">第 2 步：算出最終結果</span>' +
      '<strong>' +
      escapeHtml(spec.step2Box) +
      '</strong>' +
      '</div>' +
      '</div>' +
      '<div class="mqst-calc-helper-tip">💡 ' +
      escapeHtml(spec.prompt) +
      '</div>' +
      '</div>'
    );
  }

  return '';
}
