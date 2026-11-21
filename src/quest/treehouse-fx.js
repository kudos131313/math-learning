/**
 * 數學冒險島：秘密樹屋 GSAP 魔法換裝動畫、物件彩蛋、頭頂對話氣泡與點心餵食特效
 */

function isMotionReduced() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getFxLayer(stageEl) {
  return stageEl ? stageEl.querySelector('.mqst-th-fx-layer') : null;
}

function getRoomEl(stageEl) {
  return stageEl ? stageEl.querySelector('.mqst-th-room') : null;
}

function getRelativeCenterPercent(stageEl, targetEl) {
  const room = getRoomEl(stageEl);
  if (!room || !targetEl) return { xPct: 50, yPct: 50 };
  const rRect = room.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  if (!rRect.width || !rRect.height) return { xPct: 50, yPct: 50 };
  const xPct = ((tRect.left + tRect.width / 2 - rRect.left) / rRect.width) * 100;
  const yPct = ((tRect.top + tRect.height / 2 - rRect.top) / rRect.height) * 100;
  return {
    xPct: Math.max(6, Math.min(94, xPct)),
    yPct: Math.max(8, Math.min(92, yPct))
  };
}

function spawnParticles(stageEl, { xPct = 50, yPct = 50, glyphs = ['✨', '⭐'], count = 6, spreadX = 9, riseY = 12, duration = 0.8 } = {}) {
  if (isMotionReduced()) return;
  const fxLayer = getFxLayer(stageEl);
  if (!fxLayer) return;

  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  for (let i = 0; i < count; i++) {
    const node = document.createElement('span');
    node.className = 'mqst-th-fx-particle';
    node.textContent = glyphs[i % glyphs.length];
    const offsetX = (Math.random() - 0.5) * spreadX;
    const offsetY = (Math.random() - 0.5) * 4;
    node.style.left = Math.max(4, Math.min(96, xPct + offsetX)) + '%';
    node.style.top = Math.max(6, Math.min(92, yPct + offsetY)) + '%';
    fxLayer.appendChild(node);

    if (gsap) {
      const dx = (Math.random() - 0.5) * 42;
      const dy = -(22 + Math.random() * riseY * 3);
      gsap.fromTo(
        node,
        { opacity: 0, scale: 0.4, x: 0, y: 0, rotation: -15 + Math.random() * 30 },
        {
          opacity: 1,
          scale: 1.08,
          x: dx * 0.45,
          y: dy * 0.45,
          duration: duration * 0.32,
          ease: 'back.out(2)',
          onComplete: () => {
            gsap.to(node, {
              opacity: 0,
              scale: 0.7,
              x: dx,
              y: dy,
              duration: duration * 0.68,
              ease: 'power1.out',
              onComplete: () => node.remove()
            });
          }
        }
      );
    } else {
      setTimeout(() => node.remove(), 450);
    }
  }
}

/* ---------------- 1. 局部換裝魔法轉場 ---------------- */
export function animateSlotSwap(stageEl, slot, { nextHtml = '', wallpaperMeta = null, wallKey = '', itemId = '', lampLit = true } = {}) {
  const room = getRoomEl(stageEl);
  if (!room) return;
  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  const reduced = isMotionReduced();

  if (slot === 'wallpaper' && wallpaperMeta) {
    if (wallKey) room.setAttribute('data-wallpaper', wallKey);
    room.style.background = wallpaperMeta.fallbackBg;
    room.style.setProperty('--th-sunbeam', wallpaperMeta.sunbeamColor);
    room.style.setProperty('--th-lamp-glow', wallpaperMeta.lampColor);
    room.style.setProperty('--th-dust', wallpaperMeta.dustColor);
    room.style.setProperty('--th-ambient-tint', wallpaperMeta.ambientTint);

    const curImg = room.querySelector('.mqst-th-bg-img.is-current');
    const incImg = room.querySelector('.mqst-th-bg-img.is-incoming');
    if (curImg && incImg) {
      if (reduced || !gsap) {
        curImg.src = wallpaperMeta.bgSrc;
        incImg.src = wallpaperMeta.bgSrc;
        return;
      }
      gsap.killTweensOf(incImg);
      incImg.src = wallpaperMeta.bgSrc;
      incImg.style.opacity = '1';
      gsap.fromTo(
        incImg,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.55,
          ease: 'power2.inOut',
          onComplete: () => {
            curImg.src = wallpaperMeta.bgSrc;
            incImg.style.clipPath = '';
            incImg.style.opacity = '0';
          }
        }
      );
      spawnParticles(stageEl, { xPct: 50, yPct: 38, glyphs: ['✨', '🌟', '💫'], count: 9, spreadX: 60, riseY: 10, duration: 0.85 });
    }
    return;
  }

  const slotEl = room.querySelector('[data-th-slot="' + slot + '"]');
  if (!slotEl) return;
  slotEl.setAttribute('data-item-id', itemId);

  if (slot === 'ceiling') {
    const canLight = itemId === 'pinecone_lights' || itemId === 'star_lantern';
    room.classList.toggle('is-lamp-lit', Boolean(lampLit && canLight));
  }

  const center = getRelativeCenterPercent(stageEl, slotEl);

  if (reduced || !gsap) {
    slotEl.innerHTML = nextHtml;
    return;
  }

  gsap.killTweensOf(slotEl);

  if (slot === 'rug') {
    slotEl.innerHTML = nextHtml;
    gsap.fromTo(
      slotEl,
      { opacity: 0.35, scaleX: 0.25, scaleY: 0.72 },
      { opacity: 1, scaleX: 1, scaleY: 1, duration: 0.42, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }
    );
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct, glyphs: ['✨', '🧶', '⭐'], count: 6, spreadX: 28, riseY: 6 });
    return;
  }

  if (slot === 'ceiling') {
    slotEl.innerHTML = nextHtml;
    gsap.fromTo(
      slotEl,
      { y: -30, opacity: 0, rotation: 8, transformOrigin: '50% 0%' },
      {
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 0.52,
        ease: 'elastic.out(1, 0.5)',
        clearProps: 'transform,opacity'
      }
    );
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct + 6, glyphs: ['✨', '🌟'], count: 6, spreadX: 18, riseY: 6 });
    return;
  }

  if (slot === 'window') {
    gsap.to(slotEl, {
      scale: 0.88,
      opacity: 0.25,
      duration: 0.14,
      ease: 'power1.in',
      onComplete: () => {
        slotEl.innerHTML = nextHtml;
        gsap.fromTo(
          slotEl,
          { scale: 0.88, opacity: 0.25 },
          { scale: 1, opacity: 1, duration: 0.34, ease: 'back.out(1.7)', clearProps: 'transform,opacity' }
        );
      }
    });
    const winGlyphs = itemId === 'cloud_starlight' ? ['🌠', '✨', '⭐'] : itemId === 'sunny_bay' ? ['🫧', '🌊', '✨'] : ['🍃', '🐦', '✨'];
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct, glyphs: winGlyphs, count: 6, spreadX: 14, riseY: 8 });
    return;
  }

  if (slot === 'wall_decor') {
    slotEl.innerHTML = nextHtml;
    gsap.fromTo(
      slotEl,
      { y: -14, opacity: 0, rotation: -6, transformOrigin: '50% 8%' },
      { y: 0, opacity: 1, rotation: 0, duration: 0.44, ease: 'elastic.out(1, 0.55)', clearProps: 'transform,opacity' }
    );
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct, glyphs: ['✨', '⭐'], count: 5, spreadX: 12, riseY: 6 });
    return;
  }

  // furniture / decor：Q彈落地擠壓回彈＋下方星塵雲
  gsap.to(slotEl, {
    scale: 0.78,
    opacity: 0,
    duration: 0.14,
    ease: 'power1.in',
    onComplete: () => {
      slotEl.innerHTML = nextHtml;
      gsap.fromTo(
        slotEl,
        { y: -24, opacity: 0.3, scaleX: 0.9, scaleY: 1.1, transformOrigin: '50% 95%' },
        {
          y: 0,
          opacity: 1,
          scaleX: 1.07,
          scaleY: 0.92,
          duration: 0.22,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(slotEl, {
              scaleX: 1,
              scaleY: 1,
              duration: 0.28,
              ease: 'elastic.out(1, 0.45)',
              clearProps: 'transform,opacity'
            });
          }
        }
      );
      spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct + 8, glyphs: ['✨', '💫', '⭐'], count: 7, spreadX: 14, riseY: 8 });
    }
  });
}

/* ---------------- 2. 物件與角色點擊專屬彩蛋 ---------------- */
export function playObjectEasterEgg(stageEl, targetEl, { kind = '', itemId = '' } = {}) {
  if (!stageEl || !targetEl || isMotionReduced()) return;
  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  const center = getRelativeCenterPercent(stageEl, targetEl);

  if (gsap) {
    gsap.killTweensOf(targetEl);
    if (kind === 'ceiling' || itemId === 'cuckoo_clock') {
      gsap.fromTo(
        targetEl,
        { rotation: 0, transformOrigin: '50% 0%' },
        {
          keyframes: [
            { rotation: -7, duration: 0.11 },
            { rotation: 6, duration: 0.13 },
            { rotation: -3, duration: 0.11 },
            { rotation: 0, duration: 0.12 }
          ],
          ease: 'power1.inOut',
          clearProps: 'transform'
        }
      );
    } else if (kind === 'furniture' && itemId === 'cloud_sofa') {
      gsap.fromTo(
        targetEl,
        { scaleX: 1, scaleY: 1, transformOrigin: '50% 95%' },
        { scaleX: 1.07, scaleY: 0.91, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' }
      );
    } else if (itemId === 'mini_globe') {
      const ball = targetEl.querySelector('.mqst-th-globe-ball');
      gsap.fromTo(targetEl, { y: 0 }, { y: -8, duration: 0.15, yoyo: true, repeat: 1, clearProps: 'transform' });
      if (ball) {
        gsap.fromTo(ball, { scaleX: 1, transformOrigin: '50% 50%' }, { scaleX: -1, duration: 0.18, yoyo: true, repeat: 1, clearProps: 'transform' });
      }
    } else {
      gsap.fromTo(
        targetEl,
        { y: 0, scale: 1 },
        { y: -11, scale: 1.06, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' }
      );
    }
  }

  // 分別放出專屬繪本彩蛋微粒
  if (itemId === 'gramophone' || itemId === 'rainbow_musicbox' || itemId === 'cloud_windchime') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 6, glyphs: ['🎵', '🎶', '✨'], count: 6, spreadX: 12, riseY: 14, duration: 0.95 });
  } else if (itemId === 'sprout_pot') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 8, glyphs: ['🌼', '🌸', '💚'], count: 5, spreadX: 10, riseY: 10 });
  } else if (itemId === 'dessert_table') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 8, glyphs: ['🍓', '🍰', '✨'], count: 5, spreadX: 12, riseY: 10 });
  } else if (itemId === 'cloud_sofa') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 6, glyphs: ['☁️', '💤', '✨'], count: 4, spreadX: 14, riseY: 10 });
  } else if (itemId === 'block_shelf') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 6, glyphs: ['🟦', '🟧', '📖'], count: 5, spreadX: 12, riseY: 10 });
  } else if (kind === 'window') {
    const winGlyphs = itemId === 'cloud_starlight' ? ['🌠', '⭐', '✨'] : itemId === 'sunny_bay' ? ['⛵', '🫧', '✨'] : ['🐦', '🍃', '✨'];
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 4, glyphs: winGlyphs, count: 5, spreadX: 14, riseY: 10 });
  } else if (kind === 'ceiling') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct + 4, glyphs: ['✨', '🌟', '💛'], count: 6, spreadX: 20, riseY: 8 });
  } else if (kind === 'bunny' || kind === 'playmate') {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 10, glyphs: ['💖', '✨', '⭐'], count: 5, spreadX: 10, riseY: 10 });
  } else {
    spawnParticles(stageEl, { xPct: center.xPct, yPct: center.yPct - 4, glyphs: ['✨', '⭐'], count: 4, spreadX: 10, riseY: 8 });
  }
}

/* ---------------- 3. 角色頭頂繪本漫畫對話氣泡 ---------------- */
let bubbleCleanupTimer = null;

export function showActorSpeechBubble(stageEl, actorEl, text) {
  const fxLayer = getFxLayer(stageEl);
  if (!fxLayer || !actorEl || !text) return;

  if (bubbleCleanupTimer) {
    clearTimeout(bubbleCleanupTimer);
    bubbleCleanupTimer = null;
  }
  fxLayer.querySelectorAll('.mqst-th-speech-bubble').forEach((old) => old.remove());

  const room = getRoomEl(stageEl);
  if (!room) return;
  const rRect = room.getBoundingClientRect();
  const aRect = actorEl.getBoundingClientRect();
  let xPct = 50;
  let yPct = 45;
  if (rRect.width && rRect.height) {
    xPct = ((aRect.left + aRect.width / 2 - rRect.left) / rRect.width) * 100;
    yPct = ((aRect.top - rRect.top) / rRect.height) * 100;
  }

  const bubble = document.createElement('div');
  bubble.className = 'mqst-th-speech-bubble';
  bubble.textContent = text;
  bubble.style.left = Math.max(16, Math.min(84, xPct)) + '%';
  bubble.style.top = Math.max(14, Math.min(68, yPct - 3)) + '%';
  fxLayer.appendChild(bubble);

  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  const reduced = isMotionReduced();
  if (gsap && !reduced) {
    gsap.fromTo(
      bubble,
      { opacity: 0, y: 10, scale: 0.85 },
      { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: 'back.out(1.8)' }
    );
  }

  bubbleCleanupTimer = setTimeout(() => {
    bubbleCleanupTimer = null;
    if (!bubble.isConnected) return;
    if (gsap && !reduced) {
      gsap.to(bubble, {
        opacity: 0,
        y: -8,
        duration: 0.25,
        ease: 'power1.in',
        onComplete: () => bubble.remove()
      });
    } else {
      bubble.remove();
    }
  }, 3600);
}

/* ---------------- 4. 餵食點心拋物線飛行＆升級慶祝 ---------------- */
export function playFeedSnackAnimation(stageEl, partnerId, { snackIcon = '🍪', bondXp = 20, leveledUp = false, unlockedAura = false } = {}) {
  const fxLayer = getFxLayer(stageEl);
  const room = getRoomEl(stageEl);
  if (!fxLayer || !room) return;

  const targetEl =
    room.querySelector('[data-th-playmate-btn="' + partnerId + '"]') ||
    room.querySelector('.mqst-th-bunny-btn');
  const center = getRelativeCenterPercent(stageEl, targetEl);

  if (isMotionReduced()) {
    return;
  }

  const gsap = typeof window !== 'undefined' ? window.gsap : null;
  const flyer = document.createElement('span');
  flyer.className = 'mqst-th-snack-flyer';
  flyer.textContent = snackIcon;
  flyer.style.left = '50%';
  flyer.style.top = '90%';
  fxLayer.appendChild(flyer);

  const onArrive = () => {
    flyer.remove();
    if (targetEl && gsap) {
      gsap.fromTo(
        targetEl,
        { y: 0, scale: 1 },
        { y: -15, scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' }
      );
    }

    const badge = document.createElement('span');
    badge.className = 'mqst-th-bond-float' + (leveledUp ? ' is-levelup' : '');
    badge.textContent = unlockedAura
      ? '✨ Lv.3 光環解鎖！'
      : leveledUp
        ? '💖 升級囉！+' + bondXp
        : '+' + bondXp + ' 💖';
    badge.style.left = center.xPct + '%';
    badge.style.top = Math.max(12, center.yPct - 10) + '%';
    fxLayer.appendChild(badge);

    if (gsap) {
      gsap.fromTo(
        badge,
        { opacity: 0, y: 8, scale: 0.75 },
        {
          opacity: 1,
          y: -18,
          scale: 1.05,
          duration: 0.35,
          ease: 'back.out(1.7)',
          onComplete: () => {
            gsap.to(badge, {
              opacity: 0,
              y: -36,
              duration: 0.65,
              delay: 0.45,
              ease: 'power1.out',
              onComplete: () => badge.remove()
            });
          }
        }
      );
    } else {
      setTimeout(() => badge.remove(), 900);
    }

    spawnParticles(stageEl, {
      xPct: center.xPct,
      yPct: center.yPct - 4,
      glyphs: unlockedAura ? ['✨', '🌟', '💖', '🎉'] : ['💖', '✨', '⭐'],
      count: unlockedAura ? 12 : 7,
      spreadX: unlockedAura ? 22 : 14,
      riseY: 14,
      duration: 1.0
    });
  };

  if (gsap) {
    gsap.fromTo(
      flyer,
      { left: '50%', top: '90%', scale: 0.8, rotation: -18 },
      {
        left: center.xPct + '%',
        top: center.yPct + '%',
        scale: 1.25,
        rotation: 20,
        duration: 0.42,
        ease: 'power2.out',
        onComplete: onArrive
      }
    );
  } else {
    onArrive();
  }
}
