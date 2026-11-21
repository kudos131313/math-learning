/**
 * 直式加減法積木操作舞台與直式算則板渲染模組
 */

export function createCalcStageRenderer({ calcEls, calcState, prefersReduced, blockAnim }) {
  /* 渲染積木操作舞台 (支援各步驟即時具體積木數量過渡) */
  function renderCalcBlocksStage(d, step) {
    if (!calcEls.blocksContainerA) return;

    calcEls.labelBlockB.textContent = (calcState.op === 'add' ? '加數 ' : '減數 ') + d.b;
    calcEls.blockDividerSymbol.textContent = calcState.op === 'add' ? '＋' : '−';
    calcEls.blockDividerText.textContent = calcState.op === 'add' ? '合起來相加' : '拿走扣除';

    let dispA_h = d.a_h;
    let dispA_t = d.a_t;
    let dispA_o = d.a_o;
    let labelA_text = (calcState.op === 'add' ? '被加數 ' : '被減數 ') + d.a;

    const dispB_h = d.b_h;
    const dispB_t = d.b_t;
    const dispB_o = d.b_o;

    let slashA_h = 0;
    let slashA_t = 0;
    let slashA_o = 0;

    let slashB_h = 0;
    let slashB_t = 0;
    let slashB_o = 0;

    if (calcState.op === 'sub') {
      if (step === 2) {
        if (d.isAcrossZeroBorrow) {
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = 9;
          dispA_o = d.effective_o;
          labelA_text = '被減數 ' + d.a + '（百位退位拆借：十位留 9 條、個位變 ' + d.effective_o + ' 顆，劃掉 ' + d.b_o + ' 顆）';
        } else if (d.needsBorrow_o) {
          dispA_t = d.borrowed_t;
          dispA_o = d.effective_o;
          labelA_text = '被減數 ' + d.a + '（借一拆十：十位借 1 留 ' + d.borrowed_t + ' 條、個位變 ' + d.effective_o + ' 顆，劃掉 ' + d.b_o + ' 顆）';
        } else {
          labelA_text = '被減數 ' + d.a + '（個位有 ' + d.a_o + ' 顆，劃掉 ' + d.b_o + ' 顆，剩 ' + d.ans_o + ' 顆）';
        }
        slashA_o = d.b_o;
        slashB_o = dispB_o;
      } else if (step >= 3) {
        if (d.isAcrossZeroBorrow) {
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = 9;
          dispA_o = d.effective_o;
        } else if (d.needsBorrow_t) {
          dispA_h = Math.max(0, d.a_h - 1);
          dispA_t = d.effective_t;
          dispA_o = d.effective_o;
        } else if (d.needsBorrow_o) {
          dispA_t = d.borrowed_t;
          dispA_o = d.effective_o;
        }
        slashA_o = d.b_o;
        slashA_t = d.b_t;
        slashB_o = dispB_o;
        slashB_t = dispB_t;
        if (step >= 4 && d.b_h > 0) {
          slashA_h = d.b_h;
          slashB_h = dispB_h;
        }
        labelA_text = '被減數 ' + d.a + '（扣除積木已劃紅斜線，未劃掉的即為相減結果）';
      }
    }

    if (calcEls.labelBlockA) {
      calcEls.labelBlockA.textContent = labelA_text;
    }

    let activePlace = '';
    if (step === 1 || step === 2) {
      activePlace = 'o';
    } else if (step === 3) {
      activePlace = 't';
    } else if (step === 4 && (d.a_h > 0 || d.b_h > 0 || d.ans_h > 0)) {
      activePlace = 'h';
    }

    let htmlA = '';
    if (dispA_h > 0) htmlA += blockAnim.createBlockColGroupHtml('百位', 'h', dispA_h, 'h-title', '', activePlace === 'h', false, slashA_h, 0);
    htmlA += blockAnim.createBlockColGroupHtml('十位', 't', dispA_t, 't-title', '', activePlace === 't', false, slashA_t, 0);
    htmlA += blockAnim.createBlockColGroupHtml(
      '個位',
      'o',
      dispA_o,
      'o-title',
      '',
      activePlace === 'o',
      calcState.op === 'add' && step === 1 && d.needsCarry,
      slashA_o,
      0
    );
    calcEls.blocksContainerA.innerHTML = htmlA;

    let htmlB = '';
    if (dispB_h > 0) htmlB += blockAnim.createBlockColGroupHtml('百位', 'h', dispB_h, 'h-title', '', activePlace === 'h', false, slashB_h, 0);
    htmlB += blockAnim.createBlockColGroupHtml('十位', 't', dispB_t, 't-title', '', activePlace === 't', false, slashB_t, 0);
    htmlB += blockAnim.createBlockColGroupHtml('個位', 'o', dispB_o, 'o-title', '', activePlace === 'o', false, slashB_o, 0);
    calcEls.blocksContainerB.innerHTML = htmlB;

    if (step === 1) {
      if (calcState.op === 'sub' && d.needsBorrow_o) {
        const wrapT = calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="t"]');
        if (wrapT) {
          const blkTs = wrapT.querySelectorAll('.svg-blk-t, .blk-t');
          if (blkTs.length > 0) {
            blkTs[blkTs.length - 1].classList.add('blk-borrow-source');
          }
        }
        if (d.isAcrossZeroBorrow) {
          const wrapH = calcEls.blocksContainerA.querySelector('.block-items-wrap[data-place="h"]');
          if (wrapH) {
            const blkHs = wrapH.querySelectorAll('.svg-blk-h, .blk-h');
            if (blkHs.length > 0) blkHs[blkHs.length - 1].classList.add('blk-borrow-source');
          }
        }
      }
    }

    calcEls.rowResult.style.display = 'none';

    if (calcState.op === 'add') {
      if (step === 2) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計進度（個位已算好：' + d.ans_o + (d.needsCarry ? '，進位 1 條十' : '') + '）';
        let htmlResStep2 = '';
        if (d.needsCarry) {
          htmlResStep2 += blockAnim.createBlockColGroupHtml('十位 (進位)', 't', 1, 't-title', '', activePlace === 't', false, 0, 1);
        }
        htmlResStep2 += blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', activePlace === 'o');
        calcEls.blocksContainerResult.innerHTML = htmlResStep2;
      } else if (step === 3) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計進度（十位已算好：' + d.ans_t + (d.needsCarry ? '，含進位的 1 條十' : '') + '）';
        let htmlResStep3 = '';
        if (d.ans_h > 0) {
          htmlResStep3 += blockAnim.createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', activePlace === 'h', false, 0, d.carry_t > 0 ? 1 : 0);
        }
        htmlResStep3 += blockAnim.createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', activePlace === 't', false, 0, d.needsCarry ? 1 : 0);
        htmlResStep3 += blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', false);
        calcEls.blocksContainerResult.innerHTML = htmlResStep3;
      } else if (step >= 4) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '合計最終積木 (結果 ' + d.total + (d.needsCarry ? '，其中 1 條十為滿十進位得來' : '') + ')';
        let htmlResStep4 = '';
        if (d.ans_h > 0) {
          htmlResStep4 += blockAnim.createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', false, false, 0, d.carry_t > 0 ? 1 : 0);
        }
        htmlResStep4 += blockAnim.createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', false, false, 0, d.needsCarry ? 1 : 0);
        htmlResStep4 += blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title');
        calcEls.blocksContainerResult.innerHTML = htmlResStep4;
      }
    } else {
      if (step === 2) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減進度（個位剩餘：' + d.ans_o + '）';
        calcEls.blocksContainerResult.innerHTML = blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', activePlace === 'o');
      } else if (step === 3) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減進度（十位剩餘：' + d.ans_t + '）';
        let htmlSubStep3 = '';
        if (d.ans_h > 0) htmlSubStep3 += blockAnim.createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title', '', activePlace === 'h');
        htmlSubStep3 += blockAnim.createBlockColGroupHtml('十位', 't', d.ans_t, 't-title', '', activePlace === 't');
        htmlSubStep3 += blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title', '', false);
        calcEls.blocksContainerResult.innerHTML = htmlSubStep3;
      } else if (step >= 4) {
        calcEls.rowResult.style.display = 'block';
        calcEls.labelBlockResult.textContent = '相減剩餘積木 (結果 ' + d.total + ')';
        let htmlSubRes = '';
        if (d.ans_h > 0) htmlSubRes += blockAnim.createBlockColGroupHtml('百位', 'h', d.ans_h, 'h-title');
        htmlSubRes += blockAnim.createBlockColGroupHtml('十位', 't', d.ans_t, 't-title');
        htmlSubRes += blockAnim.createBlockColGroupHtml('個位', 'o', d.ans_o, 'o-title');
        calcEls.blocksContainerResult.innerHTML = htmlSubRes;
      }
    }
  }

  /* 直式算則滑鼠懸停反向高亮左側具體積木 (Cross-Hover) */
  function bindVerticalMathBoardHover() {
    if (!calcEls.verticalBoard) return;
    const cells = calcEls.verticalBoard.querySelectorAll('.vm-cell-o, .vm-cell-t, .vm-cell-h');
    cells.forEach(function (cell) {
      let place = '';
      if (cell.classList.contains('vm-cell-o')) place = 'o';
      else if (cell.classList.contains('vm-cell-t')) place = 't';
      else if (cell.classList.contains('vm-cell-h')) place = 'h';
      if (!place) return;

      cell.addEventListener('mouseenter', function () {
        const targetGroups = document.querySelectorAll('.block-col-group[data-place="' + place + '"]');
        targetGroups.forEach(function (grp) {
          grp.classList.add('blk-hover-highlight');
        });
      });
      cell.addEventListener('mouseleave', function () {
        const targetGroups = document.querySelectorAll('.block-col-group[data-place="' + place + '"]');
        targetGroups.forEach(function (grp) {
          grp.classList.remove('blk-hover-highlight');
        });
      });
    });
  }

  /* 渲染作業簿直式算則 */
  function renderVerticalMathBoard(d, step) {
    if (!calcEls.verticalBoard) return;

    const opSymbol = d.op === 'add' ? '＋' : '−';
    const hasH = d.a_h > 0 || d.b_h > 0 || (d.op === 'add' && d.ans_h > 0);
    const showCarryT = d.op === 'add' && d.carry_o > 0 && step >= 2;
    const showCarryH = d.op === 'add' && d.carry_t > 0 && step >= 3;
    const showBorrow = d.op === 'sub' && (d.needsBorrow_o || d.needsBorrow_t) && step >= 2;

    const isOActive = step === 1 || step === 2;
    const isTActive = step === 3;
    const isHActive = step === 4 && hasH && d.ans_h > 0;

    const clsO = 'vm-cell vm-cell-o' + (isOActive ? ' active-col' : '');
    const clsT = 'vm-cell vm-cell-t' + (isTActive ? ' active-col' : '');
    const clsH = 'vm-cell vm-cell-h' + (isHActive ? ' active-col' : '');

    let isTSlashed = false;
    let isHSlashed = false;

    if (d.op === 'sub') {
      if (d.needsBorrow_o && step >= 2) {
        isTSlashed = true;
      } else if (d.needsBorrow_t && step >= 3) {
        isTSlashed = true;
      }
      if (d.a_h > 0) {
        if (d.isAcrossZeroBorrow && step >= 2) {
          isHSlashed = true;
        } else if (d.needsBorrow_t && step >= 3) {
          isHSlashed = true;
        }
      }
    }

    let mark_h = '';
    let mark_t = '';
    let mark_o = '';
    if (d.op === 'add') {
      if (showCarryH) {
        mark_h = '<span class="vm-carry-badge" title="十位滿十進一">1</span>';
      }
      if (showCarryT) {
        mark_t = '<span class="vm-carry-badge" title="個位滿十進一">1</span>';
      }
    } else if (showBorrow) {
      if (d.needsBorrow_o && step >= 2) {
        mark_o = '<span class="vm-borrow-tag" title="借來的 10">10</span>';
      }

      if (isHSlashed) {
        const remH = d.borrowed_h !== undefined ? d.borrowed_h : d.a_h - 1;
        mark_h = '<span class="vm-borrow-tag rem-mark" title="百位借走剩 ' + remH + '">' + remH + '</span>';
      }

      if (d.isAcrossZeroBorrow && step >= 2) {
        mark_t = '<span class="vm-borrow-tag rem-mark" title="十位向百位借10再借出1剩9">9</span>';
      } else if (d.needsBorrow_o && step === 2) {
        const remT = d.a_t - 1;
        mark_t = '<span class="vm-borrow-tag rem-mark" title="十位被借走1剩 ' + remT + '">' + remT + '</span>';
      } else if (step >= 3) {
        if (d.needsBorrow_t) {
          const totalT = d.needsBorrow_o ? d.a_t - 1 + 10 : d.a_t + 10;
          mark_t = '<span class="vm-borrow-tag rem-mark" title="十位向百位借10，現有 ' + totalT + '">' + totalT + '</span>';
        } else if (d.needsBorrow_o) {
          mark_t = '<span class="vm-borrow-tag rem-mark" title="十位被借走1剩 ' + (d.a_t - 1) + '">' + (d.a_t - 1) + '</span>';
        }
      }
    }

    let numA_h_html = '';
    if (d.a_h > 0) {
      numA_h_html = '<div class="vm-num-box' + (isHSlashed ? ' is-slashed' : '') + '">' + d.a_h + '</div>';
    }
    const numA_t_html = '<div class="vm-num-box' + (isTSlashed ? ' is-slashed' : '') + '">' + d.a_t + '</div>';
    const numA_o_html = '<div class="vm-num-box">' + d.a_o + '</div>';

    let ans_o_html = '<div class="vm-ans-placeholder"></div>';
    let ans_t_html = '<div class="vm-ans-placeholder"></div>';
    let ans_h_html = '<div class="vm-ans-placeholder"></div>';

    if (step >= 2) {
      ans_o_html = '<div class="vm-cell-ans revealed" style="color:var(--o-color-dark);">' + d.ans_o + '</div>';
    }
    if (step >= 3) {
      ans_t_html = '<div class="vm-cell-ans revealed" style="color:var(--t-color-dark);">' + d.ans_t + '</div>';
    }
    if (step >= 4 && hasH && d.ans_h > 0) {
      ans_h_html = '<div class="vm-cell-ans revealed" style="color:var(--h-color-dark);">' + d.ans_h + '</div>';
    }

    let html = '<div class="vm-notebook"><div class="vm-table">';

    html += '<div class="vm-row vm-row-header">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if (hasH) html += '<div class="' + clsH + '"><span class="vm-col-badge h-badge">百位</span></div>';
    html += '<div class="' + clsT + '"><span class="vm-col-badge t-badge">十位</span></div>';
    html += '<div class="' + clsO + '"><span class="vm-col-badge o-badge">個位</span></div>';
    html += '</div>';

    html += '<div class="vm-row vm-row-mark">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if (hasH) html += '<div class="' + clsH + '">' + mark_h + '</div>';
    html += '<div class="' + clsT + '">' + mark_t + '</div>';
    html += '<div class="' + clsO + '">' + mark_o + '</div>';
    html += '</div>';

    html += '<div class="vm-row vm-row-num">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if (hasH) html += '<div class="' + clsH + '">' + numA_h_html + '</div>';
    html += '<div class="' + clsT + '">' + numA_t_html + '</div>';
    html += '<div class="' + clsO + '">' + numA_o_html + '</div>';
    html += '</div>';

    html += '<div class="vm-row vm-row-num">';
    html += '<div class="vm-cell vm-cell-op"><span class="vm-op-symbol">' + opSymbol + '</span></div>';
    if (hasH) html += '<div class="' + clsH + '">' + (d.b_h > 0 ? d.b_h : '') + '</div>';
    html += '<div class="' + clsT + '"><div class="vm-num-box">' + d.b_t + '</div></div>';
    html += '<div class="' + clsO + '"><div class="vm-num-box">' + d.b_o + '</div></div>';
    html += '</div>';

    html += '<div class="vm-divider-row"><div class="vm-divider-line"></div></div>';

    html += '<div class="vm-row vm-row-ans">';
    html += '<div class="vm-cell vm-cell-op"></div>';
    if (hasH) html += '<div class="' + clsH + '">' + ans_h_html + '</div>';
    html += '<div class="' + clsT + '">' + ans_t_html + '</div>';
    html += '<div class="' + clsO + '">' + ans_o_html + '</div>';
    html += '</div>';

    html += '</div></div>';
    calcEls.verticalBoard.innerHTML = html;
    bindVerticalMathBoardHover();
  }

  /* 直式算則步驟補間動態 (Anime.js) */
  function animateVerticalStep(d, step) {
    if (prefersReduced || typeof window.anime === 'undefined') return;

    if (d.op === 'add') {
      let carryBadge = null;
      let startCell = null;
      if (step === 2 && d.carry_o > 0) {
        carryBadge = document.querySelector('.vm-cell-t .vm-carry-badge');
        startCell = document.querySelector('.vm-cell-o .vm-num-box');
      } else if (step === 3 && d.carry_t > 0) {
        carryBadge = document.querySelector('.vm-cell-h .vm-carry-badge');
        startCell = document.querySelector('.vm-cell-t .vm-num-box');
      }
      if (carryBadge && startCell) {
        const rBadge = carryBadge.getBoundingClientRect();
        const rStart = startCell.getBoundingClientRect();

        const flyer = document.createElement('div');
        flyer.className = 'anime-carry-flyer';
        flyer.textContent = '1';
        flyer.style.position = 'fixed';
        flyer.style.left = rStart.left + 'px';
        flyer.style.top = rStart.top + 'px';
        flyer.style.zIndex = '9999';
        flyer.style.pointerEvents = 'none';
        document.body.appendChild(flyer);

        carryBadge.style.opacity = '0';

        window.anime({
          targets: flyer,
          left: rBadge.left + 'px',
          top: [
            { value: rStart.top - 46 + 'px', duration: 320, easing: 'easeOutQuad' },
            { value: rBadge.top + 'px', duration: 380, easing: 'easeInQuad' }
          ],
          scale: [1.8, 1],
          duration: 700,
          easing: 'easeInOutQuad',
          complete: function () {
            flyer.remove();
            carryBadge.style.opacity = '1';
            window.anime({
              targets: carryBadge,
              scale: [0.2, 1.35, 1],
              rotate: [-15, 8, 0],
              duration: 450,
              easing: 'easeOutElastic(1, .5)'
            });
          }
        });
      }
    }

    if (step === 2 && d.op === 'sub' && d.needsBorrow_o) {
      const slashStroke = document.querySelector('.vm-slash-stroke');
      if (slashStroke) {
        window.anime({
          targets: slashStroke,
          scaleX: [0, 1],
          duration: 320,
          easing: 'easeOutExpo'
        });
      }

      const borrowTagO = document.querySelector('.vm-cell-o .vm-borrow-tag');
      const numAT = document.querySelector('.vm-cell-t .vm-num-box');
      if (borrowTagO && numAT) {
        const rTag = borrowTagO.getBoundingClientRect();
        const rT = numAT.getBoundingClientRect();

        const flyerB = document.createElement('div');
        flyerB.className = 'anime-borrow-flyer';
        flyerB.textContent = '10';
        flyerB.style.position = 'fixed';
        flyerB.style.left = rT.left + 'px';
        flyerB.style.top = rT.top + 'px';
        flyerB.style.zIndex = '9999';
        flyerB.style.pointerEvents = 'none';
        document.body.appendChild(flyerB);

        borrowTagO.style.opacity = '0';

        window.anime({
          targets: flyerB,
          left: rTag.left + 'px',
          top: [
            { value: rT.top - 38 + 'px', duration: 280, easing: 'easeOutQuad' },
            { value: rTag.top + 'px', duration: 380, easing: 'easeInQuad' }
          ],
          scale: [1.7, 1],
          duration: 660,
          easing: 'easeInOutQuad',
          complete: function () {
            flyerB.remove();
            borrowTagO.style.opacity = '1';
            window.anime({
              targets: borrowTagO,
              scale: [0.2, 1.3, 1],
              duration: 450,
              easing: 'easeOutElastic(1, .5)'
            });
          }
        });
      }
    }

    const revealedAns = document.querySelectorAll('.vm-cell-ans.revealed');
    if (revealedAns.length > 0) {
      window.anime({
        targets: revealedAns,
        scale: [0.4, 1.15, 1],
        opacity: [0, 1],
        duration: 420,
        easing: 'easeOutBack'
      });
    }
  }

  return {
    renderCalcBlocksStage,
    renderVerticalMathBoard,
    bindVerticalMathBoardHover,
    animateVerticalStep
  };
}
