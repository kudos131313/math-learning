/**
 * 九九乘法冒險：GSAP 戰鬥演出、必殺技與粒子特效模組
 */
import { FINISHER_DEFS } from '../domain/quest-data.js';

export function createBattleFx({
  els,
  session,
  getPinkBunnySvg,
  getActivePartnerIsland,
  updateBattleMoods,
  clearNextUnlockTimer
}) {
  let motionReduced = Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  let battleIdleAnims = [];
  let attackTimeline = null;

  function initGsapMedia() {
    if (typeof window.gsap === 'undefined') return;
    if (window.gsap.matchMedia) {
      const mm = window.gsap.matchMedia();
      mm.add({ reduce: '(prefers-reduced-motion: reduce)' }, function (ctx) {
        motionReduced = Boolean(ctx.conditions.reduce);
        if (motionReduced) stopBattleIdleAnims();
      });
    }
  }

  function stopAttackAnim() {
    clearNextUnlockTimer();
    if (attackTimeline) {
      try {
        attackTimeline.kill();
      } catch (e) {}
      attackTimeline = null;
    }
    if (els.hitCallout) {
      els.hitCallout.classList.remove('is-ult');
      els.hitCallout.style.opacity = '0';
      els.hitCallout.style.visibility = 'hidden';
    }
    if (els.partnerProjectile) {
      els.partnerProjectile.classList.remove('is-lucky-rainbow');
    }
    if (typeof window.gsap !== 'undefined') {
      const resetNodes = [
        els.projectile,
        els.partnerProjectile,
        els.fxImpact,
        els.hitCallout,
        els.ultBackdrop,
        els.ultFlashVeil,
        els.ultMagicRing,
        els.heroAfterimage,
        els.ultCutin,
        els.ultSkyRift,
        els.ultBeam,
        els.ultTargetRing,
        els.ultShockwave,
        els.ultCarrot,
        els.ultSlash
      ].filter(Boolean);
      if (resetNodes.length > 0) {
        try {
          window.gsap.set(resetNodes, { autoAlpha: 0, clearProps: 'transform' });
        } catch (e) {}
      }
      if (els.ultSpeedlines) {
        try {
          window.gsap.set(els.ultSpeedlines, { clearProps: 'transform,opacity' });
        } catch (e) {}
      }
      if (els.ultCutin) {
        const shine = els.ultCutin.querySelector('.mqst-ult-cutin-shine');
        if (shine) {
          try {
            window.gsap.set(shine, { clearProps: 'transform' });
          } catch (e) {}
        }
      }
      if (els.fxLayer) {
        const fxResetNodes = els.fxLayer.querySelectorAll(
          '.mqst-fx-trail, .mqst-ult-meteor, .mqst-ult-beam-ring, .mqst-ult-carrot-chip, .mqst-ult-slash-blade, .mqst-ult-slash-cross'
        );
        if (fxResetNodes.length > 0) {
          try {
            window.gsap.set(fxResetNodes, { autoAlpha: 0, clearProps: 'transform' });
          } catch (e) {}
        }
      }
      if (els.ultBeam) {
        const beamParts = els.ultBeam.querySelectorAll('.mqst-ult-beam-orb, .mqst-ult-beam-aura, .mqst-ult-beam-shaft');
        if (beamParts.length > 0) {
          try {
            window.gsap.set(beamParts, { clearProps: 'transform,opacity' });
          } catch (e) {}
        }
      }
      const actorNodes = [
        els.heroActor,
        els.partnerActor,
        els.enemyActor,
        els.stageArena,
        els.stageBgImg,
        els.heroAura
      ].filter(Boolean);
      if (actorNodes.length > 0) {
        try {
          window.gsap.set(actorNodes, { clearProps: 'transform,opacity' });
        } catch (e) {}
      }
      if (els.bossSvg) {
        try {
          els.bossSvg.style.filter = '';
          window.gsap.set(els.bossSvg, { clearProps: 'opacity,filter' });
        } catch (e) {}
      }
    }
  }

  function stopBattleIdleAnims() {
    stopAttackAnim();
    for (let i = 0; i < battleIdleAnims.length; i++) {
      try {
        battleIdleAnims[i].kill();
      } catch (e) {}
    }
    battleIdleAnims = [];
    if (els.stageArena) els.stageArena.classList.remove('no-gsap-idle');
    if (typeof window.gsap !== 'undefined') {
      const targets = [els.heroSvg, els.partnerSvg, els.bossSvg].filter(Boolean);
      if (targets.length > 0) {
        try {
          window.gsap.set(targets, { clearProps: 'transform' });
        } catch (e) {}
      }
    }
  }

  function startBattleIdleAnims() {
    stopBattleIdleAnims();
    if (motionReduced) return;
    if (typeof window.gsap === 'undefined') {
      if (els.stageArena) els.stageArena.classList.add('no-gsap-idle');
      return;
    }
    const gsap = window.gsap;
    if (els.heroSvg) {
      battleIdleAnims.push(
        gsap.fromTo(
          els.heroSvg,
          { y: 0, scaleX: 1.02, scaleY: 0.97, rotation: -1.5 },
          { y: -6, scaleX: 0.98, scaleY: 1.03, rotation: 1.5, duration: 0.68, ease: 'sine.inOut', repeat: -1, yoyo: true }
        )
      );
    }
    if (els.partnerSvg && getActivePartnerIsland()) {
      battleIdleAnims.push(
        gsap.fromTo(
          els.partnerSvg,
          { y: -2, rotation: -3.5 },
          { y: -10, rotation: 3.5, duration: 0.95, delay: 0.2, ease: 'sine.inOut', repeat: -1, yoyo: true }
        )
      );
    }
    if (els.bossSvg) {
      if (session.battleBossObj) {
        battleIdleAnims.push(
          gsap.fromTo(
            els.bossSvg,
            { y: 0, scaleX: 1.04, scaleY: 0.96, rotation: 1.2 },
            { y: -5, scaleX: 0.98, scaleY: 1.03, rotation: -1.2, duration: 0.85, delay: 0.15, ease: 'sine.inOut', repeat: -1, yoyo: true }
          )
        );
      } else {
        const chestTl = gsap.timeline({ repeat: -1, repeatDelay: 0.75 });
        chestTl
          .to(els.bossSvg, { y: -6, scaleY: 1.05, rotation: -3, duration: 0.22, ease: 'power1.out' })
          .to(els.bossSvg, { y: 0, scaleY: 0.95, rotation: 3, duration: 0.2, ease: 'power1.inOut' })
          .to(els.bossSvg, { y: 0, scaleY: 1, rotation: 0, duration: 0.28, ease: 'elastic.out(1, 0.4)' });
        battleIdleAnims.push(chestTl);
      }
    }
  }

  function runAnim(fn) {
    if (typeof window.gsap === 'undefined' || motionReduced) return;
    try {
      fn(window.gsap);
    } catch (e) {}
  }

  function measureStageCoords(withPartner) {
    const arenaRect = els.stageArena ? els.stageArena.getBoundingClientRect() : null;
    const heroRect = els.heroSvg ? els.heroSvg.getBoundingClientRect() : null;
    const bossRect = els.bossSvg ? els.bossSvg.getBoundingClientRect() : null;
    const partnerRect = withPartner && els.partnerSvg ? els.partnerSvg.getBoundingClientRect() : null;

    const coords = {
      w: arenaRect && arenaRect.width > 0 ? arenaRect.width : 800,
      h: arenaRect && arenaRect.height > 0 ? arenaRect.height : 320,
      sx: 120,
      sy: 180,
      tx: 480,
      ty: 170,
      px: 175,
      py: 185
    };
    if (arenaRect && arenaRect.width > 0) {
      if (heroRect) {
        coords.sx = heroRect.left - arenaRect.left + heroRect.width * 0.72;
        coords.sy = heroRect.top - arenaRect.top + heroRect.height * 0.42;
      }
      if (bossRect) {
        coords.tx = bossRect.left - arenaRect.left + bossRect.width * 0.48;
        coords.ty = bossRect.top - arenaRect.top + bossRect.height * 0.46;
      }
      if (partnerRect) {
        coords.px = partnerRect.left - arenaRect.left + partnerRect.width * 0.65;
        coords.py = partnerRect.top - arenaRect.top + partnerRect.height * 0.45;
      }
    }
    return coords;
  }

  function fireFinisherConfetti(tx, ty, isBoss) {
    if (motionReduced || typeof window.confetti !== 'function' || !els.stageArena) return;
    try {
      const rect = els.stageArena.getBoundingClientRect();
      if (!rect || rect.width <= 0 || !window.innerWidth || !window.innerHeight) return;
      const ox = Math.max(0.08, Math.min(0.92, (rect.left + tx) / window.innerWidth));
      const oy = Math.max(0.08, Math.min(0.92, (rect.top + ty) / window.innerHeight));
      window.confetti({
        particleCount: isBoss ? 52 : 34,
        spread: isBoss ? 88 : 68,
        startVelocity: isBoss ? 44 : 36,
        scalar: 0.95,
        ticks: 110,
        origin: { x: ox, y: oy },
        colors: ['#fde047', '#f97316', '#ec4899', '#38bdf8', '#a855f7', '#ffffff']
      });
    } catch (e) {}
  }

  function appendImpactBurst(tl, impactLabel, tx, ty, heavyHit, bossFinisher, isFinisher) {
    const mult = bossFinisher ? 1.48 : isFinisher ? 1.28 : 1;
    if (els.fxImpact) {
      const shockRing = els.fxImpact.querySelector('.mqst-fx-ring.shock');
      const outerRing = els.fxImpact.querySelector('.mqst-fx-ring.outer');
      const innerRing = els.fxImpact.querySelector('.mqst-fx-ring.inner');
      const flashEl = els.fxImpact.querySelector('.mqst-fx-flash');
      const sparks = els.fxImpact.querySelectorAll('.mqst-fx-spark');

      tl.set(els.fxImpact, { x: tx, y: ty, xPercent: -50, yPercent: -50, autoAlpha: 1 }, impactLabel);
      if (shockRing) {
        if (isFinisher) {
          tl.fromTo(
            shockRing,
            { scale: 0.25, rotation: 0, autoAlpha: 1 },
            { scale: 2.35 * mult, rotation: 60, autoAlpha: 0, duration: 0.68, ease: 'power2.out' },
            impactLabel
          );
        } else {
          tl.set(shockRing, { autoAlpha: 0 }, impactLabel);
        }
      }
      if (outerRing) {
        tl.fromTo(
          outerRing,
          { scale: 0.2, autoAlpha: 1 },
          { scale: (heavyHit ? 1.95 : 1.5) * mult, autoAlpha: 0, duration: isFinisher ? 0.64 : 0.56, ease: 'power2.out' },
          impactLabel
        );
      }
      if (innerRing) {
        tl.fromTo(
          innerRing,
          { scale: 0.18, autoAlpha: 1 },
          { scale: (heavyHit ? 1.55 : 1.18) * mult, autoAlpha: 0, duration: isFinisher ? 0.54 : 0.46, ease: 'power2.out' },
          impactLabel + '+=0.06'
        );
      }
      if (flashEl) {
        tl.fromTo(
          flashEl,
          { scale: 0.3, rotation: 0, autoAlpha: 1 },
          { scale: (heavyHit ? 1.85 : 1.35) * mult, rotation: 55, duration: 0.16, ease: 'power3.out' },
          impactLabel
        ).to(
          flashEl,
          { autoAlpha: 0, scale: (heavyHit ? 2.15 : 1.5) * mult, duration: 0.3, ease: 'power1.in' },
          impactLabel + '+=0.16'
        );
      }
      for (let k = 0; k < sparks.length; k++) {
        const sp = sparks[k];
        const ang = (k / sparks.length) * Math.PI * 2 + (k % 2 === 0 ? 0.18 : -0.15);
        const rad = ((heavyHit ? 102 : 68) + (k % 3) * 20) * mult;
        tl.fromTo(
          sp,
          { x: 0, y: 0, scale: (isFinisher ? 1.45 : 1.25) * mult, rotation: 0, autoAlpha: 1 },
          {
            x: Math.cos(ang) * rad,
            y: Math.sin(ang) * rad + 20,
            scale: 0,
            rotation: 270,
            autoAlpha: 0,
            duration: isFinisher ? 0.72 : 0.62,
            ease: 'power2.out'
          },
          impactLabel + '+=' + k * 0.012
        );
      }
      tl.set(els.fxImpact, { autoAlpha: 0 }, impactLabel + '+=0.86');
    }

    if (isFinisher && els.ultFlashVeil) {
      tl.fromTo(els.ultFlashVeil, { autoAlpha: 0 }, { autoAlpha: bossFinisher ? 0.72 : 0.52, duration: 0.07, ease: 'power2.out' }, impactLabel).to(
        els.ultFlashVeil,
        { autoAlpha: 0, duration: 0.42, ease: 'power2.out' },
        impactLabel + '+=0.07'
      );
    }

    if (isFinisher) {
      tl.add(function () {
        fireFinisherConfetti(tx, ty, bossFinisher);
      }, impactLabel);
    }

    if (els.enemyActor) {
      const kickX = isFinisher ? (bossFinisher ? 42 : 34) : heavyHit ? 22 : 16;
      const kickY = isFinisher ? (bossFinisher ? -22 : -16) : -6;
      tl.to(
        els.enemyActor,
        { x: kickX, y: kickY, scaleX: 0.72, scaleY: 1.28, rotation: isFinisher ? (bossFinisher ? 22 : 18) : 11, duration: 0.12, ease: 'power2.out' },
        impactLabel
      ).to(
        els.enemyActor,
        { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: isFinisher ? 0.72 : 0.58, ease: 'elastic.out(1.2, 0.30)', clearProps: 'transform' },
        impactLabel + '+=0.12'
      );
    }
    if (els.bossSvg) {
      tl.to(els.bossSvg, { opacity: 0.28, duration: 0.07, ease: 'power1.out' }, impactLabel)
        .to(els.bossSvg, { opacity: 1, duration: 0.08, ease: 'power1.in' }, impactLabel + '+=0.07')
        .to(els.bossSvg, { opacity: 0.35, duration: 0.07, ease: 'power1.out' }, impactLabel + '+=0.15')
        .to(els.bossSvg, { opacity: 1, duration: 0.14, ease: 'power1.in', clearProps: 'opacity' }, impactLabel + '+=0.22');
    }
    if (els.stageArena) {
      const shakeAmp = isFinisher ? (bossFinisher ? 15 : 11) : heavyHit ? 7 : 3;
      const shakeY = isFinisher ? (bossFinisher ? 9 : 7) : heavyHit ? 4 : 2;
      tl.to(els.stageArena, { x: -shakeAmp, y: shakeY, duration: 0.045 }, impactLabel)
        .to(els.stageArena, { x: shakeAmp, y: -shakeY, duration: 0.045 }, impactLabel + '+=0.045')
        .to(els.stageArena, { x: -Math.round(shakeAmp * 0.72), y: Math.round(shakeY * 0.72), duration: 0.045 }, impactLabel + '+=0.09')
        .to(els.stageArena, { x: Math.round(shakeAmp * 0.45), y: -Math.round(shakeY * 0.45), duration: 0.045 }, impactLabel + '+=0.135')
        .to(els.stageArena, { x: 0, y: 0, duration: 0.08, clearProps: 'transform' }, impactLabel + '+=0.18');
    }
    if (isFinisher && els.stageBgImg) {
      tl.to(els.stageBgImg, { scale: bossFinisher ? 1.12 : 1.09, duration: 0.12, ease: 'power2.out' }, impactLabel).to(
        els.stageBgImg,
        { scale: 1, duration: 0.56, ease: 'power2.out', clearProps: 'transform' },
        impactLabel + '+=0.14'
      );
    }
    if (els.hitCallout) {
      if (isFinisher) {
        els.hitCallout.classList.add('is-ult');
      } else {
        els.hitCallout.classList.remove('is-ult');
      }
      tl.fromTo(
        els.hitCallout,
        { autoAlpha: 0, y: 14, scale: isFinisher ? 0.28 : 0.45 },
        { autoAlpha: 1, y: isFinisher ? -18 : -10, scale: isFinisher ? (bossFinisher ? 1.48 : 1.35) : heavyHit ? 1.24 : 1.12, duration: 0.2, ease: 'back.out(2.2)' },
        impactLabel
      ).to(
        els.hitCallout,
        { autoAlpha: 0, y: isFinisher ? -52 : -36, scale: 1.02, duration: 0.34, ease: 'power1.in', clearProps: 'transform' },
        impactLabel + '+=' + (isFinisher ? '0.78' : '0.52')
      );
    }
  }

  function choreographMeteor(tl, coords, launchAt, isBoss) {
    const meteors = els.fxLayer ? els.fxLayer.querySelectorAll('.mqst-ult-meteor') : [];
    const riftX = Math.max(115, coords.tx - 210);
    const riftY = 30;

    if (els.ultSkyRift) {
      tl.set(els.ultSkyRift, { x: riftX, y: riftY, xPercent: -50, yPercent: -50, scaleX: 0.15, scaleY: 0.15, rotation: -16, autoAlpha: 0 }, launchAt)
        .to(els.ultSkyRift, { scaleX: 1.45, scaleY: 1.05, autoAlpha: 1, duration: 0.22, ease: 'back.out(1.8)' }, launchAt)
        .to(els.ultSkyRift, { scaleX: 1.6, scaleY: 1.15, duration: 0.72, ease: 'sine.inOut' }, launchAt + 0.22)
        .to(els.ultSkyRift, { scaleX: 0.1, scaleY: 0.05, autoAlpha: 0, duration: 0.24, ease: 'power2.in' }, launchAt + 1.02);
    }

    const step = 0.092;
    const count = meteors.length;
    let lastImpact = launchAt + 0.95;

    for (let i = 0; i < count; i++) {
      const m = meteors[i];
      const isLast = i === count - 1;
      const spreadX = isLast ? 0 : ((i % 3) - 1) * 42;
      const spreadY = isLast ? 0 : i % 2 === 0 ? -24 : 18;
      const endX = coords.tx + spreadX;
      const endY = coords.ty + spreadY;
      const startX = riftX + ((i % 3) - 1) * 48;
      const startY = riftY - 22;

      if (!isLast) {
        const startAt = launchAt + 0.14 + i * step;
        const dur = 0.24;
        tl.set(m, { x: startX, y: startY, xPercent: -50, yPercent: -50, scale: 0.9 + (i % 2) * 0.2, rotation: 0, autoAlpha: 0 }, startAt)
          .to(m, { autoAlpha: 1, duration: 0.04 }, startAt)
          .to(m, { x: endX, y: endY, rotation: 110, duration: dur, ease: 'power2.in' }, startAt)
          .to(m, { autoAlpha: 0, scale: 1.55, duration: 0.09, ease: 'power1.out' }, startAt + dur);

        if (els.enemyActor) {
          tl.to(els.enemyActor, { x: 10, y: 3, rotation: 5, duration: 0.045 }, startAt + dur).to(
            els.enemyActor,
            { x: 0, y: 0, rotation: 0, duration: 0.055 },
            startAt + dur + 0.045
          );
        }
      } else {
        const chargeBigAt = launchAt + 0.56;
        const dropAt = chargeBigAt + 0.16;
        const dropDur = 0.26;
        tl.set(m, { x: riftX, y: riftY, xPercent: -50, yPercent: -50, scale: 0.3, rotation: -30, autoAlpha: 0 }, chargeBigAt)
          .to(m, { autoAlpha: 1, scale: isBoss ? 1.55 : 1.35, rotation: 15, duration: 0.15, ease: 'back.out(2)' }, chargeBigAt)
          .to(m, { x: endX, y: endY, scale: isBoss ? 1.75 : 1.5, rotation: 165, duration: dropDur, ease: 'power3.in' }, dropAt)
          .to(m, { autoAlpha: 0, scale: 2.4, duration: 0.12, ease: 'power2.out' }, dropAt + dropDur);
        lastImpact = dropAt + dropDur;
      }
    }
    return lastImpact;
  }

  function choreographRainbow(tl, coords, launchAt, isBoss) {
    if (!els.ultBeam) return launchAt + 0.68;
    const orb = els.ultBeam.querySelector('.mqst-ult-beam-orb');
    const aura = els.ultBeam.querySelector('.mqst-ult-beam-aura');
    const shaft = els.ultBeam.querySelector('.mqst-ult-beam-shaft');
    const rings = els.ultBeam.querySelectorAll('.mqst-ult-beam-ring');
    const dx = coords.tx - coords.sx;
    const dy = coords.ty - coords.sy;
    const dist = Math.max(240, Math.sqrt(dx * dx + dy * dy) + 75);
    const deg = Math.atan2(dy, dx) * (180 / Math.PI);
    const targetScaleX = dist / 540;
    const fireAt = launchAt + 0.22;
    const holdDur = isBoss ? 0.58 : 0.44;

    tl.set(els.ultBeam, { x: coords.sx, y: coords.sy, rotation: deg, autoAlpha: 1 }, launchAt);
    if (orb) {
      tl.fromTo(orb, { scale: 0.2, autoAlpha: 0 }, { scale: isBoss ? 1.65 : 1.45, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, launchAt)
        .to(orb, { scale: 0.65, duration: 0.08, ease: 'power2.in' }, launchAt + 0.14)
        .to(orb, { scale: isBoss ? 1.55 : 1.35, duration: 0.14, ease: 'back.out(2)' }, fireAt)
        .to(orb, { scale: 0.3, autoAlpha: 0, duration: 0.18 }, fireAt + holdDur + 0.08);
    }
    if (aura) {
      tl.fromTo(
        aura,
        { scaleX: 0.04, scaleY: 0.4, autoAlpha: 0 },
        { scaleX: targetScaleX * 1.04, scaleY: isBoss ? 1.48 : 1.25, autoAlpha: 0.92, duration: 0.18, ease: 'power3.out' },
        fireAt
      )
        .to(aura, { scaleY: isBoss ? 1.72 : 1.45, duration: holdDur * 0.48, yoyo: true, repeat: 1, ease: 'sine.inOut' }, fireAt + 0.18)
        .to(aura, { scaleY: 0.1, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, fireAt + holdDur + 0.08);
    }
    if (shaft) {
      tl.fromTo(
        shaft,
        { scaleX: 0.04, scaleY: 0.5, autoAlpha: 0.98 },
        { scaleX: targetScaleX, scaleY: isBoss ? 1.35 : 1.15, duration: 0.16, ease: 'power3.out' },
        fireAt
      )
        .to(shaft, { scaleY: isBoss ? 1.55 : 1.32, duration: holdDur * 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut' }, fireAt + 0.16)
        .to(shaft, { scaleY: 0.05, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, fireAt + holdDur + 0.08);
    }
    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      const rAt = fireAt + 0.04 + r * 0.1;
      tl.fromTo(ring, { x: 12, scale: 0.48, autoAlpha: 0 }, { x: dist * 0.92, scale: isBoss ? 1.55 : 1.32, autoAlpha: 1, duration: 0.28, ease: 'power1.in' }, rAt).to(
        ring,
        { autoAlpha: 0, scale: 1.85, duration: 0.08 },
        rAt + 0.26
      );
    }
    if (els.enemyActor) {
      tl.to(els.enemyActor, { x: 16, rotation: 6, duration: 0.08, repeat: 4, yoyo: true, ease: 'sine.inOut' }, fireAt + 0.1);
    }
    tl.set(els.ultBeam, { autoAlpha: 0 }, fireAt + holdDur + 0.28);
    return fireAt + holdDur * 0.72;
  }

  function choreographCarrot(tl, coords, launchAt, isBoss) {
    if (!els.ultCarrot) return launchAt + 0.65;
    const hoverY = Math.max(16, coords.ty - 165);
    const targetScale = isBoss ? 2.15 : 1.85;
    const slamAt = launchAt + 0.4;
    const impactAt = slamAt + 0.2;

    if (els.ultTargetRing) {
      tl.set(els.ultTargetRing, { x: coords.tx, y: coords.ty + 36, xPercent: -50, yPercent: -50, scale: 1.55, autoAlpha: 0 }, launchAt)
        .to(els.ultTargetRing, { scale: 0.85, autoAlpha: 0.95, duration: 0.34, ease: 'power2.out' }, launchAt)
        .to(els.ultTargetRing, { scale: 1.25, autoAlpha: 0, duration: 0.12 }, impactAt);
    }

    tl.set(els.ultCarrot, { x: coords.tx, y: hoverY - 56, xPercent: -50, yPercent: -50, scale: 0.2, rotation: -210, autoAlpha: 0 }, launchAt)
      .to(els.ultCarrot, { y: hoverY, scale: targetScale, rotation: 0, autoAlpha: 1, duration: 0.3, ease: 'back.out(1.9)' }, launchAt)
      .to(els.ultCarrot, { y: hoverY - 22, scaleX: targetScale * 0.92, scaleY: targetScale * 1.12, duration: 0.09, ease: 'sine.out' }, launchAt + 0.3)
      .to(els.ultCarrot, { y: coords.ty - 6, scaleX: targetScale * 1.32, scaleY: targetScale * 0.68, duration: 0.2, ease: 'power3.in' }, slamAt)
      .to(els.ultCarrot, { y: coords.ty - 52, rotation: 18, scaleX: targetScale * 0.75, scaleY: targetScale * 0.75, autoAlpha: 0, duration: 0.28, ease: 'power2.out' }, impactAt + 0.1);

    if (els.ultShockwave) {
      tl.set(els.ultShockwave, { x: coords.tx, y: coords.ty + 34, xPercent: -50, yPercent: -50, scale: 0.2, autoAlpha: 0 }, impactAt)
        .to(els.ultShockwave, { scaleX: 2.35, scaleY: 1.65, autoAlpha: 1, duration: 0.12, ease: 'power3.out' }, impactAt)
        .to(els.ultShockwave, { scaleX: 3.1, scaleY: 2.0, autoAlpha: 0, duration: 0.32, ease: 'power2.out' }, impactAt + 0.12);
    }
    if (els.fxLayer) {
      const chips = els.fxLayer.querySelectorAll('.mqst-ult-carrot-chip');
      const chipDirs = [
        { dx: -95, dy: -88, rot: -260 },
        { dx: -48, dy: -120, rot: -180 },
        { dx: 52, dy: -115, rot: 210 },
        { dx: 96, dy: -82, rot: 280 }
      ];
      for (let c = 0; c < chips.length; c++) {
        const cd = chipDirs[c % chipDirs.length];
        tl.set(chips[c], { x: coords.tx, y: coords.ty + 18, xPercent: -50, yPercent: -50, scale: 0.5, rotation: 0, autoAlpha: 0 }, impactAt)
          .to(chips[c], { x: coords.tx + cd.dx, y: coords.ty + cd.dy, scale: 1.35, rotation: cd.rot, autoAlpha: 1, duration: 0.26, ease: 'power2.out' }, impactAt)
          .to(chips[c], { y: coords.ty + 32, scale: 0.4, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, impactAt + 0.26);
      }
    }
    return impactAt;
  }

  function choreographSlash(tl, coords, launchAt, isBoss) {
    if (!els.ultSlash) return launchAt + 0.8;
    const bladeA = els.ultSlash.querySelector('.mqst-ult-slash-blade.a');
    const bladeB = els.ultSlash.querySelector('.mqst-ult-slash-blade.b');
    const bladeC = els.ultSlash.querySelector('.mqst-ult-slash-blade.c');
    const bladeD = els.ultSlash.querySelector('.mqst-ult-slash-blade.d');
    const crossSub = els.ultSlash.querySelector('.mqst-ult-slash-cross.sub');
    const crossMain = els.ultSlash.querySelector('.mqst-ult-slash-cross.main');
    const dashDist = Math.max(120, coords.tx - coords.sx + 56);
    const impactAt = launchAt + 0.78;

    if (els.heroAfterimage) {
      els.heroAfterimage.innerHTML = getPinkBunnySvg('fever');
      tl.set(els.heroAfterimage, { x: coords.sx - 24, y: coords.sy + 8, xPercent: -50, yPercent: -50, scale: 1, autoAlpha: 0.85 }, launchAt).to(
        els.heroAfterimage,
        { scale: 1.28, autoAlpha: 0, duration: 0.34, ease: 'power2.out' },
        launchAt + 0.04
      );
    }
    if (els.heroActor) {
      tl.to(els.heroActor, { x: dashDist, y: -16, scaleX: 1.15, scaleY: 0.92, rotation: 16, duration: 0.14, ease: 'power3.out' }, launchAt)
        .to(els.heroActor, { x: dashDist + 18, y: -6, rotation: 8, duration: 0.48, ease: 'none' }, launchAt + 0.14)
        .to(els.heroActor, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.24, ease: 'back.out(1.6)', clearProps: 'transform' }, impactAt - 0.12);
    }

    tl.set(els.ultSlash, { x: coords.tx, y: coords.ty, xPercent: -50, yPercent: -50, scale: isBoss ? 1.28 : 1.12, autoAlpha: 1 }, launchAt);

    const blades = [
      { el: bladeA, at: launchAt + 0.05, rotFrom: -45, rotTo: 0 },
      { el: bladeB, at: launchAt + 0.18, rotFrom: 45, rotTo: 0 },
      { el: bladeC, at: launchAt + 0.31, rotFrom: -18, rotTo: 0 },
      { el: bladeD, at: launchAt + 0.44, rotFrom: 18, rotTo: 0 }
    ];
    for (let b = 0; b < blades.length; b++) {
      const item = blades[b];
      if (item.el) {
        tl.fromTo(
          item.el,
          { scale: 0.25, rotation: item.rotFrom, autoAlpha: 0 },
          { scale: 1.22, rotation: item.rotTo, autoAlpha: 1, duration: 0.12, ease: 'power3.out' },
          item.at
        ).to(item.el, { autoAlpha: 0, scale: 1.45, duration: 0.18 }, item.at + 0.18);
      }
      if (els.enemyActor) {
        const shakeDir = b % 2 === 0 ? 11 : -8;
        tl.to(els.enemyActor, { x: shakeDir, rotation: b % 2 === 0 ? 7 : -6, duration: 0.045 }, item.at + 0.03).to(
          els.enemyActor,
          { x: 0, rotation: 0, duration: 0.055 },
          item.at + 0.075
        );
      }
    }

    if (crossSub) {
      tl.fromTo(
        crossSub,
        { scale: 0.2, rotation: 0, autoAlpha: 0 },
        { scale: isBoss ? 1.75 : 1.45, rotation: 90, autoAlpha: 1, duration: 0.18, ease: 'back.out(2)' },
        impactAt - 0.03
      ).to(crossSub, { scale: 2.1, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, impactAt + 0.16);
    }
    if (crossMain) {
      tl.fromTo(
        crossMain,
        { scale: 0.2, rotation: 45, autoAlpha: 0 },
        { scale: isBoss ? 1.55 : 1.3, rotation: 0, autoAlpha: 1, duration: 0.18, ease: 'back.out(2.2)' },
        impactAt - 0.02
      ).to(crossMain, { scale: 1.9, autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, impactAt + 0.16);
    }
    tl.set(els.ultSlash, { autoAlpha: 0 }, impactAt + 0.5);
    return impactAt;
  }

  function playFinisherAnim(finisherId, isBoss, partner) {
    const def = FINISHER_DEFS[finisherId] || FINISHER_DEFS.meteor;
    const hasPartner = Boolean(partner);
    if (els.ultCutinTag) {
      els.ultCutinTag.textContent = isBoss ? '⚡ 終極奧義' : '✨ 必殺技';
    }
    if (els.ultCutinTitle) {
      els.ultCutinTitle.textContent = def.title;
    }
    if (els.ultCutinHero) {
      els.ultCutinHero.innerHTML = getPinkBunnySvg('fever');
    }
    if (els.hitCallout) {
      els.hitCallout.textContent = def.badge;
    }
    if (els.partnerProjectile && hasPartner) {
      els.partnerProjectile.textContent = partner.partnerProjectile || '✨';
    }

    if (motionReduced || typeof window.gsap === 'undefined') {
      updateBattleMoods('fever', isBoss ? 'dizzy' : 'open', 'happy');
      if (els.hitCallout) {
        els.hitCallout.classList.add('is-ult');
        els.hitCallout.style.opacity = '1';
        els.hitCallout.style.visibility = 'visible';
      }
      return;
    }

    runAnim(function (gsap) {
      stopAttackAnim();
      const coords = measureStageCoords(hasPartner);
      const chargeDur = isBoss ? 0.48 : 0.36;
      const launchAt = chargeDur;

      const tl = gsap.timeline({
        onComplete: function () {
          attackTimeline = null;
        }
      });
      attackTimeline = tl;

      tl.addLabel('charge', 0);
      if (els.ultBackdrop) {
        tl.fromTo(els.ultBackdrop, { autoAlpha: 0 }, { autoAlpha: isBoss ? 1 : 0.82, duration: 0.24, ease: 'power2.out' }, 'charge');
      }
      if (els.ultSpeedlines) {
        tl.fromTo(
          els.ultSpeedlines,
          { xPercent: -50, yPercent: -50, rotation: 0, scale: 0.85, autoAlpha: 0.4 },
          { xPercent: -50, yPercent: -50, rotation: 95, scale: 1.1, autoAlpha: 1, duration: 1.55, ease: 'none' },
          'charge'
        );
      }
      if (els.stageBgImg) {
        tl.to(els.stageBgImg, { scale: isBoss ? 1.08 : 1.05, duration: chargeDur, ease: 'power2.out' }, 'charge');
      }
      if (els.ultMagicRing) {
        tl.set(els.ultMagicRing, { x: coords.sx - 20, y: coords.sy + 30, xPercent: -50, yPercent: -50, scale: 0.2, rotation: 0, autoAlpha: 0 }, 'charge')
          .to(els.ultMagicRing, { scale: isBoss ? 1.25 : 1.08, rotation: 180, autoAlpha: 1, duration: chargeDur, ease: 'back.out(1.6)' }, 'charge')
          .to(els.ultMagicRing, { scale: 1.65, rotation: 300, autoAlpha: 0, duration: 0.32, ease: 'power2.out' }, launchAt + 0.08);
      }

      if (els.ultCutin) {
        const shine = els.ultCutin.querySelector('.mqst-ult-cutin-shine');
        tl.fromTo(
          els.ultCutin,
          { xPercent: -145, yPercent: -50, skewX: -8, scale: 0.9, autoAlpha: 0 },
          { xPercent: -50, yPercent: -50, skewX: -8, scale: isBoss ? 1.06 : 0.98, autoAlpha: 1, duration: 0.24, ease: 'back.out(1.5)' },
          'charge'
        ).to(els.ultCutin, { xPercent: 45, autoAlpha: 0, duration: 0.22, ease: 'power2.in' }, 'charge+=' + (isBoss ? '1.12' : '0.96'));
        if (shine) {
          tl.fromTo(shine, { x: -40 }, { x: 460, duration: 0.42, ease: 'power1.inOut' }, 'charge+=0.20');
        }
      }

      if (els.heroActor) {
        tl.to(els.heroActor, { x: -18, y: 8, scaleX: 1.22, scaleY: 0.8, rotation: -14, duration: chargeDur * 0.85, ease: 'power2.out' }, 'charge');
        if (finisherId !== 'slash') {
          tl.to(els.heroActor, { x: 30, y: -26, scaleX: 0.9, scaleY: 1.15, rotation: 12, duration: 0.2, ease: 'back.out(2)' }, launchAt).to(
            els.heroActor,
            { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.36, ease: 'power2.out', clearProps: 'transform' },
            launchAt + 0.24
          );
        }
      }
      if (els.heroAura) {
        tl.fromTo(els.heroAura, { autoAlpha: 0, scale: 0.65 }, { autoAlpha: 1, scale: isBoss ? 1.75 : 1.5, duration: chargeDur, ease: 'power1.out' }, 'charge').to(
          els.heroAura,
          { autoAlpha: 0, scale: 1.15, duration: 0.45, clearProps: 'opacity,transform' },
          launchAt + 0.32
        );
      }

      if (hasPartner && els.partnerActor) {
        tl.to(els.partnerActor, { y: -16, scale: 1.18, rotation: -8, duration: chargeDur * 0.85, ease: 'power2.out' }, 'charge')
          .to(els.partnerActor, { x: 16, y: -22, scale: 1.25, rotation: 10, duration: 0.2, ease: 'back.out(2)' }, launchAt)
          .to(els.partnerActor, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.36, ease: 'power2.out', clearProps: 'transform' }, launchAt + 0.26);
      }
      if (hasPartner && els.partnerProjectile) {
        const pPeak = Math.min(coords.py, coords.ty) - 82;
        tl.set(els.partnerProjectile, { x: coords.px, y: coords.py, xPercent: -50, yPercent: -50, scale: 0.7, autoAlpha: 1 }, launchAt + 0.05)
          .to(els.partnerProjectile, { x: coords.tx, rotation: -600, duration: 0.5, ease: 'power1.inOut' }, launchAt + 0.05)
          .to(els.partnerProjectile, { y: pPeak, scale: 1.55, duration: 0.24, ease: 'sine.out' }, launchAt + 0.05)
          .to(els.partnerProjectile, { y: coords.ty, scale: 1.75, autoAlpha: 0, duration: 0.26, ease: 'sine.in' }, launchAt + 0.29);
      }

      tl.addLabel('launch', launchAt);
      let impactAt = launchAt + 0.8;
      if (finisherId === 'meteor') {
        impactAt = choreographMeteor(tl, coords, launchAt, isBoss);
      } else if (finisherId === 'rainbow') {
        impactAt = choreographRainbow(tl, coords, launchAt, isBoss);
      } else if (finisherId === 'carrot') {
        impactAt = choreographCarrot(tl, coords, launchAt, isBoss);
      } else {
        impactAt = choreographSlash(tl, coords, launchAt, isBoss);
      }

      tl.addLabel('impact', impactAt);
      tl.add(function () {
        updateBattleMoods('fever', isBoss ? 'dizzy' : 'open', 'happy');
      }, 'impact');
      appendImpactBurst(tl, 'impact', coords.tx, coords.ty, true, isBoss, true);

      if (els.ultBackdrop) {
        tl.to(els.ultBackdrop, { autoAlpha: 0, duration: 0.48, ease: 'power2.inOut' }, 'impact+=0.74');
      }
    });
  }

  function playBunnyAttackAnim(isCombo, shieldEvent, partner, fxOptions = {}) {
    const dualAttack = Boolean(partner && session.combo >= 2);
    const heavyHit = isCombo || Boolean(shieldEvent);
    const luckyRainbowFx = Boolean(fxOptions && fxOptions.luckyRainbowFx);
    if (els.partnerProjectile && dualAttack) {
      els.partnerProjectile.textContent = partner.partnerProjectile || '✨';
      els.partnerProjectile.classList.toggle('is-lucky-rainbow', luckyRainbowFx);
    }
    if (els.hitCallout) {
      if (shieldEvent === 'broken-all') {
        els.hitCallout.textContent = '護盾全破 💥';
      } else if (shieldEvent === 'crack') {
        els.hitCallout.textContent = '護盾碎裂 🛡️';
      } else if (dualAttack) {
        els.hitCallout.textContent = luckyRainbowFx
          ? '幸運彩虹合擊 ×' + session.combo + ' 🌈'
          : '精靈合擊 ×' + session.combo + ' 🔥';
      } else {
        els.hitCallout.textContent = isCombo ? 'COMBO ×' + session.combo + ' 🔥' : 'GREAT! ✨';
      }
    }

    runAnim(function (gsap) {
      stopAttackAnim();
      const coords = measureStageCoords(dualAttack);
      const sx = coords.sx;
      const sy = coords.sy;
      const tx = coords.tx;
      const ty = coords.ty;
      const px = coords.px;
      const py = coords.py;

      const flightDur = 0.62;
      const halfDur = flightDur * 0.48;
      const peakY = Math.min(sy, ty) - Math.max(68, Math.abs(tx - sx) * 0.2);
      const partnerPeakY = Math.min(py, ty) - Math.max(82, Math.abs(tx - px) * 0.23);

      const tl = gsap.timeline({
        onComplete: function () {
          attackTimeline = null;
        }
      });
      attackTimeline = tl;

      tl.addLabel('charge', 0);
      if (els.heroActor) {
        tl.to(els.heroActor, { x: -14, y: 6, scaleX: 1.15, scaleY: 0.84, rotation: -10, duration: 0.22, ease: 'power2.out' }, 'charge');
      }
      if (els.heroAura) {
        tl.fromTo(els.heroAura, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1.28, duration: 0.24, ease: 'power1.out' }, 'charge').to(
          els.heroAura,
          { autoAlpha: session.combo >= 3 ? 0.9 : 0, scale: 1, duration: 0.4, clearProps: 'opacity,transform' },
          'charge+=0.26'
        );
      }
      if (els.partnerActor && dualAttack) {
        tl.to(els.partnerActor, { x: -9, y: 4, scale: 0.88, rotation: -8, duration: 0.22, ease: 'power2.out' }, 'charge');
      }

      tl.addLabel('launch', 0.24);
      if (els.heroActor) {
        tl.to(els.heroActor, { x: 26, y: -22, scaleX: 0.92, scaleY: 1.1, rotation: 10, duration: 0.18, ease: 'back.out(2)' }, 'launch').to(
          els.heroActor,
          { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.34, ease: 'power2.out', clearProps: 'transform' },
          'launch+=0.20'
        );
      }
      if (els.partnerActor && dualAttack) {
        tl.to(els.partnerActor, { x: 18, y: -18, scale: 1.15, rotation: 8, duration: 0.18, ease: 'back.out(2)' }, 'launch+=0.05').to(
          els.partnerActor,
          { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.34, ease: 'power2.out', clearProps: 'transform' },
          'launch+=0.25'
        );
      }

      if (els.projectile) {
        const boltScale = isCombo ? 1.55 : 1.28;
        tl.set(els.projectile, { x: sx, y: sy, xPercent: -50, yPercent: -50, scale: 0.55, rotation: -30, autoAlpha: 1 }, 'launch')
          .to(els.projectile, { x: tx, rotation: isCombo ? 720 : 540, duration: flightDur, ease: 'power1.inOut' }, 'launch')
          .to(els.projectile, { y: peakY, scale: boltScale, duration: halfDur, ease: 'sine.out' }, 'launch')
          .to(els.projectile, { y: ty, scale: boltScale * 1.15, duration: flightDur - halfDur, ease: 'sine.in' }, 'launch+=' + halfDur);
      }

      if (els.fxLayer) {
        const trails = els.fxLayer.querySelectorAll('.mqst-fx-trail');
        for (let t = 0; t < trails.length; t++) {
          const dot = trails[t];
          const d = 0.055 * (t + 1);
          const tScale = 1.2 - t * 0.14;
          const tDur = flightDur * 0.85;
          const tHalf = tDur * 0.48;
          tl.set(dot, { x: sx, y: sy, xPercent: -50, yPercent: -50, scale: tScale, autoAlpha: 0 }, 0)
            .to(dot, { autoAlpha: 0.95, duration: 0.06 }, 'launch+=' + d)
            .to(dot, { x: tx, scale: 0.25, duration: tDur, ease: 'power1.inOut' }, 'launch+=' + d)
            .to(dot, { y: peakY, duration: tHalf, ease: 'sine.out' }, 'launch+=' + d)
            .to(dot, { y: ty, autoAlpha: 0, duration: tDur - tHalf, ease: 'sine.in' }, 'launch+=' + (d + tHalf));
        }
      }

      if (els.partnerProjectile && dualAttack) {
        const pDelay = 0.06;
        const pFlight = flightDur * 0.92;
        const pHalf = pFlight * 0.48;
        tl.set(els.partnerProjectile, { x: px, y: py, xPercent: -50, yPercent: -50, scale: 0.6, rotation: 0, autoAlpha: 1 }, 'launch+=' + pDelay)
          .to(els.partnerProjectile, { x: tx, rotation: -540, duration: pFlight, ease: 'power1.inOut' }, 'launch+=' + pDelay)
          .to(els.partnerProjectile, { y: partnerPeakY, scale: 1.32, duration: pHalf, ease: 'sine.out' }, 'launch+=' + pDelay)
          .to(els.partnerProjectile, { y: ty, autoAlpha: 0, scale: 1.55, duration: pFlight - pHalf, ease: 'sine.in' }, 'launch+=' + (pDelay + pHalf));
      }

      tl.addLabel('impact', 'launch+=' + flightDur);
      if (els.projectile) {
        tl.to(els.projectile, { autoAlpha: 0, scale: 2.35, duration: 0.16, ease: 'power2.out' }, 'impact');
      }
      appendImpactBurst(tl, 'impact', tx, ty, heavyHit, false);
    });
  }

  function playPartnerShieldAnim() {
    runAnim(function (gsap) {
      if (els.partnerActor) {
        gsap.fromTo(
          els.partnerActor,
          { scale: 1, y: 0 },
          { scale: 1.18, y: -12, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' }
        );
      }
      if (els.heroAura) {
        gsap.fromTo(
          els.heroAura,
          { autoAlpha: 0, scale: 0.7 },
          { autoAlpha: 0.95, scale: 1.55, duration: 0.25, ease: 'power2.out' }
        ).to(els.heroAura, {
          autoAlpha: session.combo >= 3 ? 0.9 : 0,
          scale: 1,
          duration: 0.45,
          clearProps: 'opacity,transform'
        });
      }
    });
  }

  return {
    initGsapMedia,
    stopAttackAnim,
    stopBattleIdleAnims,
    startBattleIdleAnims,
    runAnim,
    isMotionReduced: () => motionReduced,
    playFinisherAnim,
    playBunnyAttackAnim,
    playPartnerShieldAnim
  };
}
