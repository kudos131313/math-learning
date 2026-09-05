/**
 * ==========================================================================
 * 數字製造機與位值探索模組 (LEARN & NUMBER MACHINE)
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var state = { th: 0, h: 1, t: 2, o: 3 };
  var animating = false;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var els = {};
  var colEl = {};
  var blocksBoxEl = {};
  var placeLabel = { th: '千位', h: '百位', t: '十位', o: '個位' };

  function initElements(){
    els = {
      displayBox: document.getElementById('display'),
      expand: document.getElementById('expand'),
      countTh: document.getElementById('count-th'),
      countH: document.getElementById('count-h'),
      countT: document.getElementById('count-t'),
      countO: document.getElementById('count-o'),
      blocksTh: document.getElementById('blocks-th'),
      blocksH: document.getElementById('blocks-h'),
      blocksT: document.getElementById('blocks-t'),
      blocksO: document.getElementById('blocks-o'),
      minusTh: document.getElementById('minus-th'),
      plusTh: document.getElementById('plus-th'),
      minusH: document.getElementById('minus-h'),
      plusH: document.getElementById('plus-h'),
      minusT: document.getElementById('minus-t'),
      plusT: document.getElementById('plus-t'),
      minusO: document.getElementById('minus-o'),
      plusO: document.getElementById('plus-o'),
      randomize: document.getElementById('randomize'),
      speakBtn: document.getElementById('speak-number-btn')
    };

    colEl = {
      th: document.getElementById('col-th'),
      h: document.getElementById('col-h'),
      t: document.getElementById('col-t'),
      o: document.getElementById('col-o')
    };

    blocksBoxEl = {
      th: els.blocksTh,
      h: els.blocksH,
      t: els.blocksT,
      o: els.blocksO
    };
  }

  function renderDisplay(){
    if(!els.displayBox || !els.expand) return;
    var thousandEnabled = MathApp.thousand.isEnabled();
    var th = thousandEnabled ? state.th : 0;
    var h = state.h, t = state.t, o = state.o;
    var parts = [];

    if(thousandEnabled && th > 0){
      parts.push({ v: th, cls: 'th' });
      parts.push({ v: h,  cls: 'h' });
      parts.push({ v: t,  cls: 't' });
      parts.push({ v: o,  cls: 'o' });
    } else if(h > 0){
      parts.push({ v: h,  cls: 'h' });
      parts.push({ v: t,  cls: 't' });
      parts.push({ v: o,  cls: 'o' });
    } else if(t > 0){
      parts.push({ v: t,  cls: 't' });
      parts.push({ v: o,  cls: 'o' });
    } else {
      parts.push({ v: o,  cls: 'o' });
    }

    var html = '';
    parts.forEach(function(p){
      html += '<span class="digit ' + p.cls + ' num-font">' + p.v + '</span>';
    });
    els.displayBox.innerHTML = html;
    els.displayBox.classList.remove('pop');
    void els.displayBox.offsetWidth;
    els.displayBox.classList.add('pop');

    var expandBits = [];
    if(thousandEnabled && th > 0) expandBits.push('<b class="th">' + th + '個千</b>');
    if(h > 0) expandBits.push('<b class="h">' + h + '個百</b>');
    if(t > 0) expandBits.push('<b class="t">' + t + '個十</b>');
    if(o > 0 || (th === 0 && h === 0 && t === 0)) expandBits.push('<b class="o">' + o + '個一</b>');

    var totalVal = (th * 1000 + h * 100 + t * 10 + o);
    els.expand.innerHTML = expandBits.length ? expandBits.join(' ＋ ') + ' ＝ ' + totalVal : '';
  }

  function renderColumns(){
    if(els.countTh){
      els.countTh.textContent = state.th;
      MathApp.utils.renderBlocks(els.blocksTh, 'th', state.th);
      if(els.minusTh) els.minusTh.disabled = !canDec('th');
      if(els.plusTh)  els.plusTh.disabled  = !canInc('th');
    }

    if(els.countH) els.countH.textContent = state.h;
    if(els.countT) els.countT.textContent = state.t;
    if(els.countO) els.countO.textContent = state.o;

    MathApp.utils.renderBlocks(els.blocksH, 'h', state.h);
    MathApp.utils.renderBlocks(els.blocksT, 't', state.t);
    MathApp.utils.renderBlocks(els.blocksO, 'o', state.o);

    if(els.minusH) els.minusH.disabled = !canDec('h');
    if(els.plusH)  els.plusH.disabled  = !canInc('h');
    if(els.minusT) els.minusT.disabled = !canDec('t');
    if(els.minusO) els.minusO.disabled = !canDec('o');
    if(els.plusO)  els.plusO.disabled  = !canInc('o');

    // 升級積木支援手勢拖曳
    updateDraggableBlocks();
  }

  function renderMachine(){
    renderDisplay();
    renderColumns();
  }

  /* ---- 支援連鎖進位/借位的位值計算 ---- */
  function canInc(place){
    var thousandEnabled = MathApp.thousand.isEnabled();
    if(place === 'th') return state.th < 9;
    if(place === 'h') return thousandEnabled ? (state.h < 9 || canInc('th')) : state.h < 9;
    if(place === 't') return state.t < 9 || canInc('h');
    return state.o < 9 || canInc('t');
  }

  function canDec(place){
    var thousandEnabled = MathApp.thousand.isEnabled();
    if(place === 'th') return state.th > 0;
    if(place === 'h') return thousandEnabled ? (state.h > 0 || canDec('th')) : state.h > 0;
    if(place === 't') return state.t > 0 || canDec('h');
    return state.o > 0 || canDec('t');
  }

  function incPlace(place){
    var thousandEnabled = MathApp.thousand.isEnabled();
    if(place === 'th'){
      if(state.th < 9){ state.th++; return true; }
      return false;
    }
    if(place === 'h'){
      if(state.h < 9){ state.h++; return true; }
      if(thousandEnabled && incPlace('th')){ state.h = 0; return true; }
      return false;
    }
    if(place === 't'){
      if(state.t < 9){ state.t++; return true; }
      if(incPlace('h')){ state.t = 0; return true; }
      return false;
    }
    if(state.o < 9){ state.o++; return true; }
    if(incPlace('t')){ state.o = 0; return true; }
    return false;
  }

  function decPlace(place){
    var thousandEnabled = MathApp.thousand.isEnabled();
    if(place === 'th'){
      if(state.th > 0){ state.th--; return true; }
      return false;
    }
    if(place === 'h'){
      if(state.h > 0){ state.h--; return true; }
      if(thousandEnabled && decPlace('th')){ state.h = 9; return true; }
      return false;
    }
    if(place === 't'){
      if(state.t > 0){ state.t--; return true; }
      if(decPlace('h')){ state.t = 9; return true; }
      return false;
    }
    if(state.o > 0){ state.o--; return true; }
    if(decPlace('t')){ state.o = 9; return true; }
    return false;
  }

  /* ---- 進位脈衝圓圈特效 ---- */
  function spawnBurst(fromEl){
    if(prefersReduced || !fromEl) return;
    var rect = fromEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var burst = document.createElement('div');
    burst.className = 'carry-burst';
    burst.style.left   = cx + 'px';
    burst.style.top    = cy + 'px';
    burst.style.width  = rect.width + 'px';
    burst.style.height = rect.height + 'px';
    document.body.appendChild(burst);
    setTimeout(function(){ burst.remove(); }, 600);
  }

  function flashColumns(places){
    places.forEach(function(p){
      var el = colEl[p];
      if(!el) return;
      el.classList.remove('carry-flash');
      void el.offsetWidth;
      el.classList.add('carry-flash');
    });
  }

  /* 飛行動畫：結合 Anime.js 將打包積木拋物線平滑移動至目標箱 */
  function flyBlock(fromEl, toEl, kind, onDone){
    if(!fromEl || !toEl){ if(onDone) onDone(); return; }
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();
    var flyer = document.createElement('div');
    var glyphCls = kind === 'th' ? 'blk-th' : kind === 'h' ? 'blk-h' : kind === 't' ? 'blk-t' : 'blk-o';
    flyer.className = 'flyer blk ' + glyphCls;
    if(MathApp.utils && MathApp.utils.getBlockSvg){
      flyer.innerHTML = MathApp.utils.getBlockSvg(kind);
    }
    document.body.appendChild(flyer);
    var startX = fromRect.left + fromRect.width / 2;
    var startY = fromRect.top + fromRect.height / 2;
    var endX = toRect.left + toRect.width / 2;
    var endY = toRect.top + toRect.height / 2;

    if(typeof window.anime !== 'undefined'){
      flyer.style.position = 'fixed';
      flyer.style.left = startX + 'px';
      flyer.style.top = startY + 'px';
      flyer.style.transform = 'translate(-50%, -50%)';
      flyer.style.zIndex = '9999';

      var midY = Math.min(startY, endY) - 50;

      window.anime({
        targets: flyer,
        left: endX + 'px',
        top: [
          { value: midY + 'px', duration: 280, easing: 'easeOutQuad' },
          { value: endY + 'px', duration: 320, easing: 'easeInQuad' }
        ],
        scale: [1.8, 1],
        rotate: [0, 8],
        duration: 600,
        easing: 'easeInOutQuad',
        complete: function(){
          if(toEl.parentElement){
            window.anime({
              targets: toEl.parentElement,
              scale: [1, 1.05, 0.98, 1],
              duration: 380,
              easing: 'easeOutElastic(1, .5)'
            });
          }
          flyer.remove();
          if(onDone) onDone();
        }
      });
    } else {
      // 離線自動降級
      flyer.style.left = startX + 'px';
      flyer.style.top = startY + 'px';
      flyer.style.transform = 'translate(-50%,-50%) scale(1.6)';
      flyer.style.opacity = '1';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          flyer.style.left = endX + 'px';
          flyer.style.top = endY + 'px';
          flyer.style.transform = 'translate(-50%,-50%) scale(.85) rotate(8deg)';
        });
      });
      setTimeout(function(){
        flyer.style.opacity = '0';
        setTimeout(function(){ flyer.remove(); if(onDone) onDone(); }, 190);
      }, 560);
    }
  }

  /* ---------------- Interact.js 手動拖曳湊十與拆解教具互動 ---------------- */
  var interactInitialized = false;
  function updateDraggableBlocks(){
    if(typeof window.interact === 'undefined') return;

    // 為個位珠與十位棒加上可拖曳標記
    if(els.blocksO){
      var oBlks = els.blocksO.querySelectorAll('.blk');
      for(var i = 0; i < oBlks.length; i++){
        oBlks[i].classList.add('draggable-block');
        oBlks[i].setAttribute('data-drag-type', 'unit');
      }
    }
    if(els.blocksT){
      var tBlks = els.blocksT.querySelectorAll('.blk');
      for(var j = 0; j < tBlks.length; j++){
        tBlks[j].classList.add('draggable-block');
        tBlks[j].setAttribute('data-drag-type', 'ten');
      }
    }

    if(interactInitialized) return;
    interactInitialized = true;

    // 拖曳積木手勢監聽
    window.interact('.draggable-block').draggable({
      inertia: false,
      autoScroll: false,
      listeners: {
        start: function(event){
          var target = event.target;
          target.classList.add('is-dragging');
          target.setAttribute('data-x', '0');
          target.setAttribute('data-y', '0');
          MathApp.sfx('click');
        },
        move: function(event){
          var target = event.target;
          var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
          target.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.2)';
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
        end: function(event){
          var target = event.target;
          target.classList.remove('is-dragging');
          // 若未被 Dropzone 接收，平滑彈回原位
          if(!target.dataset.dropped){
            if(typeof window.anime !== 'undefined'){
              window.anime({
                targets: target,
                translateX: 0,
                translateY: 0,
                scale: 1,
                duration: 350,
                easing: 'easeOutElastic(1, .6)',
                complete: function(){
                  target.style.transform = '';
                  target.removeAttribute('data-x');
                  target.removeAttribute('data-y');
                }
              });
            } else {
              target.style.transform = '';
              target.removeAttribute('data-x');
              target.removeAttribute('data-y');
            }
          }
          delete target.dataset.dropped;
        }
      }
    });

    // 十位欄位：放置目標區 (接收個位珠 -> 湊十進位)
    if(colEl.t){
      colEl.t.classList.add('dropzone-target');
      window.interact(colEl.t).dropzone({
        accept: '[data-drag-type="unit"]',
        overlap: 0.35,
        ondropactivate: function(event){
          event.target.classList.add('drop-possible');
        },
        ondragenter: function(event){
          event.target.classList.add('drop-hover');
        },
        ondragleave: function(event){
          event.target.classList.remove('drop-hover');
        },
        ondrop: function(event){
          event.relatedTarget.dataset.dropped = 'true';
          event.target.classList.remove('drop-hover');
          event.target.classList.remove('drop-possible');

          // 手動推進個位珠湊十
          handleButton('o', 1);
          MathApp.utils.showToast('🎯 手動把個位珠推進十位！滿十就能湊成一條十喔！');
        },
        ondropdeactivate: function(event){
          event.target.classList.remove('drop-possible');
          event.target.classList.remove('drop-hover');
        }
      });
    }

    // 個位欄位：放置目標區 (接收十位長條 -> 拆解成 10 顆珠子)
    if(colEl.o){
      colEl.o.classList.add('dropzone-target');
      window.interact(colEl.o).dropzone({
        accept: '[data-drag-type="ten"]',
        overlap: 0.35,
        ondropactivate: function(event){
          event.target.classList.add('drop-possible');
        },
        ondragenter: function(event){
          event.target.classList.add('drop-hover');
        },
        ondragleave: function(event){
          event.target.classList.remove('drop-hover');
        },
        ondrop: function(event){
          event.relatedTarget.dataset.dropped = 'true';
          event.target.classList.remove('drop-hover');
          event.target.classList.remove('drop-possible');

          // 手動拆解十位長條
          if(state.t > 0){
            state.t--;
            state.o = Math.min(99, state.o + 10);
            renderMachine();
            MathApp.sfx('borrow');
            MathApp.utils.showToast('✂️ 一條十位棒被你拆開成 10 顆個位珠囉！');
            MathApp.speak('拆解成功！一條十變成十個一！');
            if(MathApp.utils.launchConfetti) MathApp.utils.launchConfetti();
          }
        },
        ondropdeactivate: function(event){
          event.target.classList.remove('drop-possible');
          event.target.classList.remove('drop-hover');
        }
      });
    }
  }

  function chainFor(place){
    var thousandEnabled = MathApp.thousand.isEnabled();
    if(thousandEnabled){
      if(place === 'o') return ['o','t','h','th'];
      if(place === 't') return ['t','h','th'];
      if(place === 'h') return ['h','th'];
      return ['th'];
    }
    if(place === 'o') return ['o','t','h'];
    if(place === 't') return ['t','h'];
    return ['h'];
  }

  function buildSteps(path, dir){
    var steps = [];
    if(dir > 0){
      for(var k = 0; k < path.length - 1; k++){
        steps.push({ from: path[k], to: path[k + 1] });
      }
    } else {
      for(var k = path.length - 1; k > 0; k--){
        steps.push({ from: path[k], to: path[k - 1] });
      }
    }
    return steps;
  }

  function playSteps(steps, idx, dir, changed, place, onComplete){
    if(idx >= steps.length){
      renderMachine();
      flashColumns(changed);
      var extra = changed.filter(function(p){ return p !== place; });
      var target = extra[extra.length - 1] || place;
      var msg = dir > 0
        ? ('🎉 ' + placeLabel[place] + '滿10了，疊合搬到' + placeLabel[target] + '！')
        : ('🔄 ' + placeLabel[place] + '不夠減，向' + placeLabel[target] + '借了一份！');
      MathApp.utils.showToast(msg);
      MathApp.sfx(dir > 0 ? 'carry' : 'borrow');
      MathApp.speak(msg);
      onComplete();
      return;
    }
    var step = steps[idx];
    var fromBox = blocksBoxEl[step.from];
    var toBox = blocksBoxEl[step.to];
    var kind = dir > 0 ? step.to : step.from;
    if(!fromBox || !toBox){
      playSteps(steps, idx + 1, dir, changed, place, onComplete);
      return;
    }
    fromBox.classList.add('bundle-pulse');
    spawnBurst(colEl[step.from]);
    setTimeout(function(){
      fromBox.classList.remove('bundle-pulse');
      flyBlock(fromBox, toBox, kind, function(){
        playSteps(steps, idx + 1, dir, changed, place, onComplete);
      });
    }, 260);
  }

  function handleButton(place, dir){
    if(animating) return;
    var thousandEnabled = MathApp.thousand.isEnabled();
    var prev = { th: state.th, h: state.h, t: state.t, o: state.o };
    var ok = dir > 0 ? incPlace(place) : decPlace(place);
    if(!ok){
      MathApp.sfx('boundary');
      var maxLimitText = thousandEnabled ? '已經是最大的四位數 9999 囉！' : '已經是最大的三位數 999 囉！';
      MathApp.utils.showToast(dir > 0 ? maxLimitText : '已經是 0，不能再少囉！');
      return;
    }

    var changed = [];
    if(state.th !== prev.th) changed.push('th');
    if(state.h !== prev.h) changed.push('h');
    if(state.t !== prev.t) changed.push('t');
    if(state.o !== prev.o) changed.push('o');
    var extra = changed.filter(function(p){ return p !== place; });

    if(extra.length === 0){
      renderMachine();
      MathApp.sfx('click');
      return;
    }

    if(prefersReduced){
      renderMachine();
      flashColumns(changed);
      var msg2 = dir > 0
        ? ('🎉 ' + placeLabel[place] + '滿10了，疊合搬到' + placeLabel[extra[extra.length - 1]] + '！')
        : ('🔄 ' + placeLabel[place] + '不夠減，向' + placeLabel[extra[extra.length - 1]] + '借了一份！');
      MathApp.utils.showToast(msg2);
      MathApp.sfx(dir > 0 ? 'carry' : 'borrow');
      MathApp.speak(msg2);
      return;
    }

    animating = true;
    var path = chainFor(place).filter(function(p){ return p === place || changed.indexOf(p) !== -1; });
    var steps = buildSteps(path, dir);
    playSteps(steps, 0, dir, changed, place, function(){ animating = false; });
  }

  function init(){
    initElements();

    if(els.speakBtn){
      els.speakBtn.addEventListener('click', function(){
        var thousandEnabled = MathApp.thousand.isEnabled();
        var totalVal = (thousandEnabled ? state.th * 1000 : 0) + state.h * 100 + state.t * 10 + state.o;
        MathApp.speak(MathApp.utils.numberToChinese(totalVal));
      });
    }

    if(els.minusTh) els.minusTh.addEventListener('click', function(){ handleButton('th', -1); });
    if(els.plusTh)  els.plusTh.addEventListener('click',  function(){ handleButton('th', 1); });
    if(els.minusH)  els.minusH.addEventListener('click',  function(){ handleButton('h', -1); });
    if(els.plusH)   els.plusH.addEventListener('click',   function(){ handleButton('h', 1); });
    if(els.minusT)  els.minusT.addEventListener('click',  function(){ handleButton('t', -1); });
    if(els.plusT)   els.plusT.addEventListener('click',   function(){ handleButton('t', 1); });
    if(els.minusO)  els.minusO.addEventListener('click',  function(){ handleButton('o', -1); });
    if(els.plusO)   els.plusO.addEventListener('click',   function(){ handleButton('o', 1); });

    if(els.randomize){
      els.randomize.addEventListener('click', function(){
        var thousandEnabled = MathApp.thousand.isEnabled();
        state.th = thousandEnabled ? Math.floor(Math.random() * 10) : 0;
        state.h  = Math.floor(Math.random() * 10);
        state.t  = Math.floor(Math.random() * 10);
        state.o  = Math.floor(Math.random() * 10);
        renderMachine();
      });
    }

    // 監聽千位數模式變更事件
    MathApp.on('thousandChange', function(enabled){
      if(!enabled && state.th > 0){
        state.th = 0;
      }
      renderMachine();
    });

    renderMachine();
  }

  MathApp.learn = {
    init: init,
    renderMachine: renderMachine,
    getState: function(){ return state; },
    setState: function(s){
      if(s.th !== undefined) state.th = s.th;
      if(s.h  !== undefined) state.h  = s.h;
      if(s.t  !== undefined) state.t  = s.t;
      if(s.o  !== undefined) state.o  = s.o;
      renderMachine();
    },
    canInc: canInc,
    canDec: canDec,
    incPlace: incPlace,
    decPlace: decPlace
  };

})();
