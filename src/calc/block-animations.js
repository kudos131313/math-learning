/**
 * 直式加減法積木動畫與進借位拆解效果模組
 */

export function createCalcBlockAnimations({ calcEls, calcState, prefersReduced, getBlockSvg, sfx }) {
  function playSfx(name) {
    if (sfx) sfx(name);
  }

  /* 視覺粒子光爆特效 */
  function spawnCalcBurst(cx, cy, color) {
    if (prefersReduced) return;
    const burst = document.createElement('div');
    burst.className = 'blk-burst-glow';
    burst.style.left = cx + 'px';
    burst.style.top = cy + 'px';
    burst.style.background = 'radial-gradient(circle, ' + (color || '#f59e0b') + ' 0%, rgba(255,255,255,0) 75%)';
    burst.style.boxShadow = '0 0 24px ' + (color || '#f59e0b');
    document.body.appendChild(burst);
    setTimeout(function () {
      if (burst && burst.parentNode) burst.remove();
    }, 520);
  }

  /* 清除飛行中的積木元素與動畫鎖 */
  function cleanupCalcBlockAnimations() {
    const flyers = document.querySelectorAll('.blk-anim-flyer, .blk-split-shard, .blk-burst-glow');
    for (let i = 0; i < flyers.length; i++) {
      if (flyers[i].parentNode) flyers[i].parentNode.removeChild(flyers[i]);
    }
    if (calcEls.blocksStage) {
      calcEls.blocksStage.classList.remove('calc-stage-animating');
    }
    calcState.isAnimating = false;
  }

  /* 支援劃掉扣除 (slashedCount) 與進位標示 (carriedCount) 的具體積木渲染器 */
  function renderCustomBlocksHtml(kind, count, slashedCount, carriedCount) {
    if (count <= 0) return '';
    const slashed = Math.min(count, Math.max(0, slashedCount || 0));
    const carried = Math.min(count, Math.max(0, carriedCount || 0));

    const slashStartIdx = count - slashed;
    const carryStartIdx = count - carried;

    let html = '';
    let totalRendered = 0;
    while (totalRendered < count) {
      const gSize = Math.min(5, count - totalRendered);
      html += '<div class="blk-group-5" aria-label="' + gSize + '個積木">';
      for (let i = 0; i < gSize; i++) {
        const idx = totalRendered + i;
        const isSlashed = idx >= slashStartIdx;
        const isCarried = !isSlashed && idx >= carryStartIdx;

        let extraClasses = '';
        if (isSlashed) extraClasses += ' blk-slash-crossed';
        if (isCarried) extraClasses += ' blk-carried';

        const cls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
        html += '<span class="blk ' + cls + extraClasses + '" data-kind="' + kind + '">';
        if (isCarried) {
          html += '<span class="carried-tag-pill">進位＋1</span>';
        }
        html += getBlockSvg(kind);
        html += '</span>';
      }
      html += '</div>';
      totalRendered += gSize;
    }
    return html;
  }

  /* 渲染具體積木群組 (百位、十位與個位，支援跨欄焦點高亮、滿十收納框、劃掉扣除與進位標示) */
  function createBlockColGroupHtml(
    title,
    kind,
    count,
    titleClass,
    extraWrapClass,
    isColActive,
    hasTenFrame,
    slashedCount,
    carriedCount
  ) {
    const activeClass = isColActive ? ' active-col-group col-focus-' + kind : '';
    let html = '<div class="block-col-group' + activeClass + '" data-place="' + kind + '">';
    html += '<span class="block-col-title ' + (titleClass || '') + '">' + title + ' (' + count + ')</span>';
    html += '<div class="block-items-wrap ' + (extraWrapClass || '') + '" data-place="' + kind + '">';
    if (count === 0) {
      html += '<span style="font-size:12px;color:var(--ink-soft);padding:4px;">0 (無積木)</span>';
    } else if (hasTenFrame && count >= 10) {
      html += '<div class="blk-ten-frame-box" id="calc-ten-frame-box">';
      html += '<span class="ten-frame-badge">滿10進1</span>';
      html += renderCustomBlocksHtml(kind, 10, 0, 0);
      html += '</div>';
      if (count > 10) {
        html += renderCustomBlocksHtml(kind, count - 10, slashedCount, carriedCount);
      }
    } else {
      html += renderCustomBlocksHtml(kind, count, slashedCount, carriedCount);
    }
    html += '</div></div>';
    return html;
  }

  /* 減法：成對劃紅斜線打叉動態 */
  function playDeductSlashAnimation(place, deductCount, onDone) {
    if (prefersReduced || typeof window.anime === 'undefined' || deductCount <= 0) {
      if (onDone) onDone();
      return;
    }
    const wrapA = calcEls.blocksContainerA
      ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="' + place + '"]')
      : null;
    const wrapB = calcEls.blocksContainerB
      ? calcEls.blocksContainerB.querySelector('.block-items-wrap[data-place="' + place + '"]')
      : null;
    if (!wrapA) {
      if (onDone) onDone();
      return;
    }

    const itemsA = wrapA.querySelectorAll('.blk');
    const itemsB = wrapB ? wrapB.querySelectorAll('.blk') : [];

    const toSlashA = [];
    const startIdxA = Math.max(0, itemsA.length - deductCount);
    for (let i = startIdxA; i < itemsA.length; i++) {
      toSlashA.push(itemsA[i]);
    }

    const toSlashB = [];
    for (let j = 0; j < Math.min(deductCount, itemsB.length); j++) {
      toSlashB.push(itemsB[j]);
    }

    const allToSlash = toSlashA.concat(toSlashB);
    if (allToSlash.length === 0) {
      if (onDone) onDone();
      return;
    }

    allToSlash.forEach(function (el, idx) {
      setTimeout(function () {
        el.classList.add('blk-slash-crossed');
        if (idx === 0) playSfx('click');
        if (idx === allToSlash.length - 1 && onDone) {
          setTimeout(onDone, 300);
        }
      }, idx * 45);
    });
  }

  /* 加法：滿十合體轉化為長條十 ➔ 拋物線飛向下方合計結果欄十位 */
  function playBlockCarryAnimation(d, onComplete) {
    if (prefersReduced || typeof window.anime === 'undefined') {
      if (onComplete) onComplete();
      return;
    }
    cleanupCalcBlockAnimations();
    calcState.isAnimating = true;
    if (calcEls.blocksStage) calcEls.blocksStage.classList.add('calc-stage-animating');

    const wrapA_o = calcEls.blocksContainerA
      ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="o"]')
      : null;
    const wrapB_o = calcEls.blocksContainerB
      ? calcEls.blocksContainerB.querySelector('.block-items-wrap[data-place="o"]')
      : null;
    const wrapRes_t = calcEls.blocksContainerResult
      ? calcEls.blocksContainerResult.querySelector('.block-items-wrap[data-place="t"]')
      : null;
    const wrapRes = calcEls.blocksContainerResult;

    if (!wrapA_o) {
      cleanupCalcBlockAnimations();
      if (onComplete) onComplete();
      return;
    }

    const rectA = wrapA_o.getBoundingClientRect();
    const rectB = wrapB_o ? wrapB_o.getBoundingClientRect() : rectA;

    const centerX = (rectA.left + rectA.width / 2 + rectB.left + rectB.width / 2) / 2;
    const centerY = (rectA.top + rectB.top + rectB.height) / 2;

    const carryBadge = document.createElement('div');
    carryBadge.className = 'ten-frame-badge blk-anim-flyer';
    carryBadge.style.position = 'fixed';
    carryBadge.style.left = centerX + 'px';
    carryBadge.style.top = centerY - 22 + 'px';
    carryBadge.style.transform = 'translate(-50%, -50%) scale(0.6)';
    carryBadge.style.opacity = '0';
    carryBadge.style.zIndex = '99998';
    carryBadge.style.pointerEvents = 'none';
    carryBadge.textContent = '滿10進1';
    document.body.appendChild(carryBadge);

    window.anime({
      targets: carryBadge,
      scale: [0.5, 1],
      opacity: [0, 1],
      duration: 260,
      easing: 'easeOutBack'
    });

    const oSvg = getBlockSvg('o');
    const shards = [];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.className = 'blk-split-shard';
      s.innerHTML = oSvg;
      const angle = (i / 10) * Math.PI * 2;
      const dist = 42 + (i % 3) * 10;
      const initX = centerX + Math.cos(angle) * dist;
      const initY = centerY + Math.sin(angle) * dist;
      s.style.left = initX + 'px';
      s.style.top = initY + 'px';
      document.body.appendChild(s);
      shards.push(s);
    }

    window.anime({
      targets: shards,
      left: centerX + 'px',
      top: centerY + 'px',
      scale: [1, 0.45],
      opacity: [1, 0.85],
      duration: 420,
      easing: 'easeInOutCubic',
      complete: function () {
        shards.forEach(function (el) {
          el.remove();
        });

        playSfx('pop');
        spawnCalcBurst(centerX, centerY, '#fbbf24');

        window.anime({
          targets: carryBadge,
          scale: [1, 0.2],
          opacity: [1, 0],
          duration: 220,
          easing: 'easeInQuad',
          complete: function () {
            carryBadge.remove();
          }
        });

        const flyer = document.createElement('div');
        flyer.className = 'blk-anim-flyer';
        flyer.innerHTML = getBlockSvg('t');
        flyer.style.left = centerX + 'px';
        flyer.style.top = centerY + 'px';
        flyer.style.transform = 'translate(-50%, -50%) scale(0.65)';
        document.body.appendChild(flyer);

        let endX;
        let endY;
        if (wrapRes_t) {
          const rT = wrapRes_t.getBoundingClientRect();
          endX = rT.left + rT.width / 2;
          endY = rT.top + rT.height / 2;
        } else if (wrapRes) {
          const rR = wrapRes.getBoundingClientRect();
          endX = rR.left + Math.min(180, rR.width * 0.4);
          endY = rR.top + rR.height / 2;
        } else {
          endX = centerX - 100;
          endY = centerY + 80;
        }

        const arcY = Math.min(centerY, endY) - 50;

        window.anime({
          targets: flyer,
          left: endX + 'px',
          top: [
            { value: arcY + 'px', duration: 360, easing: 'easeOutQuad' },
            { value: endY + 'px', duration: 340, easing: 'easeInQuad' }
          ],
          scale: [0.65, 1.25, 1],
          rotate: [-18, 6, 0],
          duration: 700,
          easing: 'easeInOutCubic',
          complete: function () {
            flyer.remove();
            spawnCalcBurst(endX, endY, '#14b8a6');
            playSfx('carry');
            cleanupCalcBlockAnimations();
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  /* 單條十位長條飛渡至個位上方並裂解成 10 個小方塊 */
  function playSingleTenBorrowToOnes(fromX, fromY, rectO, onDone) {
    const targetOX = rectO.left + rectO.width / 2;
    const targetOY = rectO.top + rectO.height / 2;

    const flyerT = document.createElement('div');
    flyerT.className = 'blk-anim-flyer';
    flyerT.innerHTML = getBlockSvg('t');
    flyerT.style.left = fromX + 'px';
    flyerT.style.top = fromY + 'px';
    flyerT.style.transform = 'translate(-50%, -50%) scale(1)';
    document.body.appendChild(flyerT);

    const hoverOX = targetOX;
    const hoverOY = targetOY - 46;

    window.anime({
      targets: flyerT,
      left: hoverOX + 'px',
      top: hoverOY + 'px',
      scale: [1, 1.2],
      duration: 440,
      easing: 'easeOutQuad',
      complete: function () {
        window.anime({
          targets: flyerT,
          rotate: [-12, 12, -6, 6, 0],
          duration: 240,
          easing: 'linear',
          complete: function () {
            flyerT.remove();
            spawnCalcBurst(hoverOX, hoverOY, '#3b82f6');
            playSfx('borrow');

            const oSvg = getBlockSvg('o');
            const shards = [];
            for (let i = 0; i < 10; i++) {
              const s = document.createElement('div');
              s.className = 'blk-split-shard';
              s.innerHTML = oSvg;
              s.style.left = hoverOX + 'px';
              s.style.top = hoverOY + 'px';
              s.style.transform = 'translate(-50%, -50%) scale(1)';
              document.body.appendChild(s);
              shards.push(s);
            }

            shards.forEach(function (s, idx) {
              const angle = (idx / 10) * Math.PI * 2;
              const burstR = 32 + (idx % 3) * 12;
              const burstX = hoverOX + Math.cos(angle) * burstR;
              const burstY = hoverOY + Math.sin(angle) * burstR;

              const finalTargetX = targetOX + ((idx % 5) - 2) * 20;
              const finalTargetY = targetOY + (Math.floor(idx / 5) - 0.5) * 20;

              window.anime({
                targets: s,
                keyframes: [
                  { left: burstX + 'px', top: burstY + 'px', scale: 1.4, duration: 250, easing: 'easeOutBack' },
                  { left: finalTargetX + 'px', top: finalTargetY + 'px', scale: 1, duration: 320, easing: 'easeInQuad' }
                ],
                complete: function () {
                  s.remove();
                  if (idx === shards.length - 1) {
                    spawnCalcBurst(targetOX, targetOY, '#f59e0b');
                    if (onDone) onDone();
                  }
                }
              });
            });
          }
        });
      }
    });
  }

  /* 減法：十位抽出長條 ➔ 平移至個位 ➔ 震動裂解為 10 顆小白方塊 */
  function playBlockBorrowAnimation(d, onComplete) {
    if (prefersReduced || typeof window.anime === 'undefined') {
      if (onComplete) onComplete();
      return;
    }
    cleanupCalcBlockAnimations();
    calcState.isAnimating = true;
    if (calcEls.blocksStage) calcEls.blocksStage.classList.add('calc-stage-animating');

    const wrapA_h = calcEls.blocksContainerA
      ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="h"]')
      : null;
    const wrapA_t = calcEls.blocksContainerA
      ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="t"]')
      : null;
    const wrapA_o = calcEls.blocksContainerA
      ? calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="o"]')
      : null;

    if (d.isAcrossZeroBorrow && wrapA_h && wrapA_t && wrapA_o) {
      const rectH = wrapA_h.getBoundingClientRect();
      const rectT = wrapA_t.getBoundingClientRect();
      const rectO = wrapA_o.getBoundingClientRect();

      const flyerH = document.createElement('div');
      flyerH.className = 'blk-anim-flyer';
      flyerH.innerHTML = getBlockSvg('h');
      const startHX = rectH.left + rectH.width / 2;
      const startHY = rectH.top + rectH.height / 2;
      flyerH.style.left = startHX + 'px';
      flyerH.style.top = startHY + 'px';
      flyerH.style.transform = 'translate(-50%, -50%) scale(1)';
      document.body.appendChild(flyerH);

      const midTX = rectT.left + rectT.width / 2;
      const midTY = rectT.top + rectT.height / 2;

      window.anime({
        targets: flyerH,
        left: midTX + 'px',
        top: midTY + 'px',
        scale: [1, 1.12, 0.85],
        duration: 460,
        easing: 'easeInOutQuad',
        complete: function () {
          flyerH.remove();
          spawnCalcBurst(midTX, midTY, '#3b82f6');
          playSfx('borrow');

          playSingleTenBorrowToOnes(midTX, midTY, rectO, function () {
            cleanupCalcBlockAnimations();
            if (onComplete) onComplete();
          });
        }
      });
      return;
    }

    if (!wrapA_t || !wrapA_o) {
      cleanupCalcBlockAnimations();
      if (onComplete) onComplete();
      return;
    }

    const rectT2 = wrapA_t.getBoundingClientRect();
    const rectO2 = wrapA_o.getBoundingClientRect();
    const startTX = rectT2.left + rectT2.width / 2;
    const startTY = rectT2.top + rectT2.height / 2;

    playSingleTenBorrowToOnes(startTX, startTY, rectO2, function () {
      cleanupCalcBlockAnimations();
      if (onComplete) onComplete();
    });
  }

  return {
    spawnCalcBurst,
    cleanupCalcBlockAnimations,
    renderCustomBlocksHtml,
    createBlockColGroupHtml,
    playDeductSlashAnimation,
    playBlockCarryAnimation,
    playBlockBorrowAnimation,
    playSingleTenBorrowToOnes
  };
}
