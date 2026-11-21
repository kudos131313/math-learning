/**
 * 數學冒險島：圖鑑面板、換裝衣櫥、家長鎖定對話框與預習切換模組
 */
import {
  REALMS,
  ISLANDS,
  STAGES,
  BADGES,
  BUNNY_COSTUMES,
  SKILL_CARDS,
  SKILL_TIER_THRESHOLDS,
  getStageById,
  getCostumeById,
  getIslandsByRealm
} from '../domain/quest-data.js';
import {
  isStageUnlocked,
  getStageStars,
  getActivePartnerId,
  countTotalStars,
  countLitGems,
  countUnlockedSprites,
  getActiveCostumeId,
  countUnlockedCostumes,
  getCostumeProgress,
  getSkillCardProgress,
  countUnlockedSkillCards
} from '../domain/quest-questions.js';
import { randInt } from '../domain/number-text.js';

export function createQuestDialogs({
  els,
  getSaveData,
  getPinkBunnySvg,
  getCharacterSvg,
  getCollectableUnlitGems
}) {
  let parentChallengeAns = 42;

  function renderWardrobePane() {
    if (!els.paneWardrobe) return;
    const saveData = getSaveData();
    const activeId = getActiveCostumeId(saveData);
    const activeCostume = getCostumeById(activeId);
    const stars = countTotalStars(saveData);
    const gems = countLitGems(saveData);
    const unlockedCount = countUnlockedCostumes(saveData);
    const collectableUnlit = getCollectableUnlitGems();

    let nextHintHtml = '';
    let nextLocked = null;
    let bestRemainRatio = 2;
    BUNNY_COSTUMES.forEach(function (c) {
      const prog = getCostumeProgress(c, saveData);
      if (!prog.unlocked) {
        const ratio = (prog.target - prog.current) / prog.target;
        if (ratio < bestRemainRatio) {
          bestRemainRatio = ratio;
          nextLocked = { costume: c, prog };
        }
      }
    });
    if (nextLocked) {
      const diff = Math.max(1, nextLocked.prog.target - nextLocked.prog.current);
      nextHintHtml =
        '<div class="mqst-wardrobe-next-tip">🎯 下一個目標：再收集 <b>' +
        diff +
        ' ' +
        nextLocked.prog.unit +
        '</b>，就能解鎖【' +
        nextLocked.costume.icon +
        ' ' +
        nextLocked.costume.name +
        '】喔！</div>';
    } else {
      nextHintHtml =
        '<div class="mqst-wardrobe-next-tip" style="border-color:#16a34a;color:#14532d;background:#dcfce7;">🎉 太厲害了！你已集齊全部 <b>' +
        BUNNY_COSTUMES.length +
        '</b> 款小兔夢幻造型！</div>';
    }

    let wbHtml =
      '<div class="mqst-gem-summary">' +
      '<span>🎀 已解鎖小兔造型：<b>' +
      unlockedCount +
      ' / ' +
      BUNNY_COSTUMES.length +
      '</b> 款</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">收集星星與 81 顆寶石就能解鎖頭飾，換上後全遊戲都會變裝喔！</span>' +
      '</div>';

    wbHtml +=
      '<div class="mqst-wardrobe-stage">' +
      '<button type="button" class="mqst-wardrobe-preview-btn" id="mqst-wardrobe-preview-btn" aria-label="點擊試衣鏡中的粉紅小兔互動" title="點點粉紅小兔試穿效果！">' +
      getPinkBunnySvg('happy', activeId) +
      '</button>' +
      '<div class="mqst-wardrobe-info">' +
      '<div class="mqst-wardrobe-current">' +
      activeCostume.icon +
      ' 目前穿戴：' +
      activeCostume.name +
      '</div>' +
      '<p class="mqst-wardrobe-sub">' +
      activeCostume.desc +
      '</p>' +
      '<div class="mqst-wardrobe-meters">' +
      '<span class="mqst-wardrobe-meter-pill">⭐ 星星收集：<b>' +
      stars +
      ' / ' +
      STAGES.length * 3 +
      '</b></span>' +
      '<span class="mqst-wardrobe-meter-pill">💎 寶石圖鑑：<b>' +
      gems +
      ' / 81</b></span>' +
      '</div>' +
      nextHintHtml +
      '</div></div>';

    wbHtml += '<div class="mqst-collection-grid">';
    BUNNY_COSTUMES.forEach(function (c) {
      const prog = getCostumeProgress(c, saveData);
      const isEquipped = prog.unlocked && activeId === c.id;
      wbHtml +=
        '<div class="mqst-collect-card' +
        (prog.unlocked ? '' : ' locked') +
        (isEquipped ? ' is-equipped' : '') +
        '">' +
        (isEquipped ? '<span class="mqst-equipped-tag">⭐ 穿戴中</span>' : '') +
        '<div class="mqst-costume-art" aria-hidden="true">' +
        getPinkBunnySvg(isEquipped ? 'happy' : 'normal', c.id) +
        '</div>' +
        '<div class="mqst-collect-name">' +
        c.icon +
        ' ' +
        c.name +
        '</div>' +
        '<p class="mqst-collect-desc">' +
        c.desc +
        '</p>';

      if (prog.unlocked) {
        wbHtml +=
          '<p class="mqst-collect-skill">' +
          (c.unlockType === 'free' ? '✨ 冒險初始造型' : '🔓 達成條件：' + c.goalText) +
          '</p>' +
          '<button type="button" class="mqst-costume-equip-btn' +
          (isEquipped ? ' active' : '') +
          '" data-equip-costume="' +
          c.id +
          '" aria-pressed="' +
          String(isEquipped) +
          '">' +
          (isEquipped ? '✅ 目前穿戴中' : '👗 換上這套') +
          '</button>';
      } else {
        wbHtml +=
          '<div class="mqst-costume-progress-wrap">' +
          '<div class="mqst-costume-goal-text">🔒 ' +
          c.goalText +
          '（' +
          prog.current +
          ' / ' +
          prog.target +
          '）</div>' +
          '<div class="mqst-costume-progress-track" role="progressbar" aria-label="' +
          c.name +
          ' 解鎖進度" aria-valuenow="' +
          prog.current +
          '" aria-valuemin="0" aria-valuemax="' +
          prog.target +
          '">' +
          '<div class="mqst-costume-progress-fill" style="width:' +
          prog.pct +
          '%;"></div>' +
          '</div>' +
          (c.unlockType === 'gems' && collectableUnlit.length > 0
            ? '<button type="button" class="mqst-sprite-equip-btn goto" data-wardrobe-gem-hunt="1">✨ 補齊寶石衝進度</button>'
            : '') +
          '</div>';
      }
      wbHtml += '</div>';
    });
    wbHtml += '</div>';
    els.paneWardrobe.innerHTML = wbHtml;
  }

  function renderSkillCodexPane() {
    if (!els.paneSprites && !els.paneSkills) return;
    if (!els.paneSkills) return;
    const saveData = getSaveData();
    const unlockedSkills = countUnlockedSkillCards(saveData);
    const tierMeta = {
      none: { label: '尚未啟封', badgeCls: 'tier-none', icon: '🔒' },
      bronze: { label: '🥉 銅卡', badgeCls: 'tier-bronze', icon: '🥉' },
      silver: { label: '🥈 銀卡', badgeCls: 'tier-silver', icon: '🥈' },
      gold: { label: '🥇 金卡大師', badgeCls: 'tier-gold', icon: '🥇' }
    };

    let html =
      '<div class="mqst-gem-summary">' +
      '<span>📖 已解鎖技能卡：<b>' +
      unlockedSkills +
      ' / ' +
      SKILL_CARDS.length +
      '</b> 張</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">未使用小幫手且一次答對累積：銅卡（' +
      SKILL_TIER_THRESHOLDS.bronze +
      ' 題）➔ 銀卡（' +
      SKILL_TIER_THRESHOLDS.silver +
      ' 題）➔ 金卡（' +
      SKILL_TIER_THRESHOLDS.gold +
      ' 題），升階送星星幣！</span>' +
      '</div>';

    html += '<div class="mqst-collection-grid">';
    SKILL_CARDS.forEach(function (card) {
      const prog = getSkillCardProgress(card.id, saveData);
      const tm = tierMeta[prog.tier] || tierMeta.none;
      const sampleSt = getStageById(card.sampleStageId);
      const canPlay = sampleSt && isStageUnlocked(sampleSt.stageKey || sampleSt.id, saveData);
      const goalTxt = prog.isMax
        ? '🏆 已達最高金卡榮譽（共 ' + prog.count + ' 題）'
        : '進度：' + prog.count + ' / ' + prog.nextTarget + ' 題（下一階：' + (prog.nextTier === 'bronze' ? '銅卡' : prog.nextTier === 'silver' ? '銀卡' : '金卡') + '）';

      html +=
        '<div class="mqst-collect-card mqst-skill-card ' +
        tm.badgeCls +
        '">' +
        '<span class="mqst-skill-tier-pill ' +
        tm.badgeCls +
        '">' +
        tm.label +
        '</span>' +
        '<div class="mqst-skill-ico" aria-hidden="true">' +
        card.icon +
        '</div>' +
        '<div class="mqst-collect-name">' +
        card.name +
        '</div>' +
        '<p class="mqst-collect-desc">' +
        card.desc +
        '</p>' +
        '<div class="mqst-costume-progress-wrap">' +
        '<div class="mqst-costume-goal-text">' +
        goalTxt +
        '</div>' +
        '<div class="mqst-costume-progress-track" role="progressbar" aria-label="' +
        card.name +
        ' 技能進度" aria-valuenow="' +
        prog.count +
        '" aria-valuemin="0" aria-valuemax="' +
        prog.nextTarget +
        '">' +
        '<div class="mqst-costume-progress-fill" style="width:' +
        prog.pct +
        '%;"></div>' +
        '</div>' +
        (canPlay
          ? '<button type="button" class="mqst-sprite-equip-btn goto" data-goto-stage="' +
            (sampleSt.stageKey || sampleSt.id) +
            '">⚔️ 前往 ' +
            (sampleSt.displayNum || sampleSt.id) +
            ' 練習</button>'
          : '') +
        '</div>' +
        '</div>';
    });
    html += '</div>';
    els.paneSkills.innerHTML = html;
  }

  function renderDexDialog() {
    const saveData = getSaveData();
    const litCount = countLitGems(saveData);
    const collectableUnlit = getCollectableUnlitGems();
    let gemHtml =
      '<div class="mqst-gem-summary">' +
      '<span>💎 已點亮九九乘法寶石：<b>' +
      litCount +
      ' / 81</b> 格</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">點擊任一格子可聽口訣或查看該去哪關點亮！</span>' +
      '</div><div class="mqst-gem-grid">';
    gemHtml += '<div class="mqst-gem-cell head">×</div>';
    for (let c = 1; c <= 9; c++) gemHtml += '<div class="mqst-gem-cell head">' + c + '</div>';
    for (let r = 1; r <= 9; r++) {
      gemHtml += '<div class="mqst-gem-cell head">' + r + '</div>';
      for (let col = 1; col <= 9; col++) {
        const lit = Boolean(saveData.gems[r + 'x' + col]);
        gemHtml +=
          '<button type="button" class="mqst-gem-cell' +
          (lit ? ' lit' : '') +
          '"' +
          ' data-gem-a="' +
          r +
          '" data-gem-b="' +
          col +
          '" data-gem-lit="' +
          (lit ? '1' : '0') +
          '"' +
          ' aria-label="' +
          r +
          ' 乘以 ' +
          col +
          (lit ? ' 等於 ' + r * col + '，點擊朗讀口訣' : ' 尚未點亮，點擊查看提示') +
          '">' +
          (lit ? r * col : '·') +
          '</button>';
      }
    }
    gemHtml += '</div>';
    gemHtml +=
      '<div class="mqst-gem-inspector" id="mqst-gem-inspector">' +
      '<span class="mqst-gem-inspector-msg" id="mqst-gem-inspector-msg">👆 點擊上方寶石格，可以聽口訣或查看對應關卡喔！</span>' +
      '<div class="mqst-gem-inspector-actions" id="mqst-gem-inspector-actions">' +
      (collectableUnlit.length > 0
        ? '<button type="button" class="mqst-tool-btn mqst-gem-hunt-btn" id="mqst-gem-hunt-btn">✨ 補齊未點亮寶石（剩 ' +
          collectableUnlit.length +
          ' 顆）</button>'
        : '<span class="mqst-gem-all-done">🎉 已收齊目前可收集的全部寶石！</span>') +
      '</div></div>';
    if (els.paneGems) els.paneGems.innerHTML = gemHtml;

    let spHtml =
      '<div class="mqst-gem-summary">' +
      '<span>🐣 已收服守護小精靈：<b>' +
      countUnlockedSprites(saveData) +
      ' / ' +
      ISLANDS.length +
      '</b> 隻</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">打敗每座島嶼的 👑 魔王關即可收服！每關可免費施展 1 次精靈魔法（選擇題消錯／鍵盤題開積木），不扣星、照拿收藏！</span>' +
      '</div>';

    const activePartnerFullId = getActivePartnerId(saveData);
    REALMS.forEach(function (realm) {
      const realmIslands = getIslandsByRealm(realm.id);
      if (!realmIslands || realmIslands.length === 0) return;
      spHtml +=
        '<div class="mqst-dex-group-title">' +
        realm.icon +
        ' ' +
        realm.title +
        '（' +
        countUnlockedSprites(saveData, realm.id) +
        ' / ' +
        realmIslands.length +
        '）</div>';
      spHtml += '<div class="mqst-collection-grid">';
      realmIslands.forEach(function (isl) {
        const got = getStageStars(saveData, isl.bossStageId) >= 1;
        const equipped = got && activePartnerFullId === isl.fullId;
        const bossSt = getStageById(isl.bossStageId);
        const bossUnlocked = isStageUnlocked(isl.bossStageId, saveData);
        const bossLabel = bossSt ? (bossSt.displayNum || bossSt.id) : isl.bossStageId;
        spHtml +=
          '<div class="mqst-collect-card' +
          (got ? '' : ' locked') +
          (equipped ? ' is-equipped' : '') +
          '">' +
          (equipped ? '<span class="mqst-equipped-tag">⭐ 同行夥伴</span>' : '') +
          '<div class="mqst-collect-art">' +
          getCharacterSvg(isl.theme, false, equipped ? 'happy' : 'normal') +
          '</div>' +
          '<div class="mqst-collect-name">' +
          (got ? isl.spriteName : '???（尚未收服）') +
          '</div>' +
          '<p class="mqst-collect-desc">' +
          isl.spriteDesc +
          '</p>' +
          (got
            ? '<p class="mqst-collect-skill">' +
              isl.partnerProjectile +
              ' 助陣魔法：' +
              isl.partnerSkillDesc +
              '</p>' +
              '<button type="button" class="mqst-sprite-equip-btn' +
              (equipped ? ' active' : '') +
              '" data-equip-sprite="' +
              isl.fullId +
              '">' +
              (equipped ? '✅ 目前同行中（點此休息）' : '🤝 帶牠去冒險') +
              '</button>'
            : '<p class="mqst-collect-skill mqst-locked-goal">👑 打敗【' +
              bossLabel +
              ' · ' +
              (bossSt ? bossSt.label : '島嶼魔王') +
              '】即可收服</p>' +
              (bossUnlocked
                ? '<button type="button" class="mqst-sprite-equip-btn goto" data-goto-boss="' +
                  isl.bossStageId +
                  '">⚔️ 前往挑戰 ' +
                  bossLabel +
                  '</button>'
                : '')) +
          '</div>';
      });
      spHtml += '</div>';
    });
    if (els.paneSprites) els.paneSprites.innerHTML = spHtml;

    let bdHtml = '<div class="mqst-collection-grid">';
    BADGES.forEach(function (b) {
      const unlocked = Boolean(saveData.badges[b.id]);
      bdHtml +=
        '<div class="mqst-collect-card' +
        (unlocked ? '' : ' locked') +
        '">' +
        '<div class="mqst-collect-art">' +
        (unlocked ? b.icon : '🔒') +
        '</div>' +
        '<div class="mqst-collect-name">' +
        b.name +
        '</div>' +
        '<p class="mqst-collect-desc">' +
        b.desc +
        '</p></div>';
    });
    bdHtml += '</div>';
    if (els.paneBadges) els.paneBadges.innerHTML = bdHtml;

    renderSkillCodexPane();
    renderWardrobePane();
  }

  function setupDialogPolyfill(dlg) {
    if (!dlg) return;
    dlg.addEventListener('close', function () {
      dlg.returnValue = '';
    });
    if (typeof HTMLDialogElement === 'undefined' || !('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = function (e) {
        const r = dlg.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      dlg.addEventListener('pointerdown', function (e) {
        pressedOutside = isOutside(e);
      });
      dlg.addEventListener('pointerup', function (e) {
        if (pressedOutside && isOutside(e)) dlg.close();
      });
    }
  }

  function refreshParentLock() {
    const a = randInt(12, 18);
    const b = randInt(3, 5);
    parentChallengeAns = a * b;
    if (els.parentLockQ) els.parentLockQ.textContent = '請計算：' + a + ' × ' + b + ' ＝';
    if (els.parentLockIn) els.parentLockIn.value = '';
    if (els.parentFeedback) els.parentFeedback.textContent = '';
    if (els.parentLockBox) els.parentLockBox.style.display = 'flex';
    if (els.resetConfirmRow) els.resetConfirmRow.style.display = 'none';
  }

  function updatePreviewToggleBtn() {
    if (!els.previewToggle) return;
    const saveData = getSaveData();
    els.previewToggle.setAttribute('aria-pressed', String(saveData.previewAll));
    els.previewToggle.textContent = saveData.previewAll ? '已開啟' : '未開啟';
    if (els.previewStatusMsg) {
      els.previewStatusMsg.classList.toggle('is-active', Boolean(saveData.previewAll));
      els.previewStatusMsg.textContent = saveData.previewAll
        ? '目前狀態：已開啟自由挑選／預習模式'
        : '目前狀態：依序闖關模式';
    }
  }

  return {
    renderDexDialog,
    renderWardrobePane,
    setupDialogPolyfill,
    refreshParentLock,
    getParentChallengeAns: () => parentChallengeAns,
    updatePreviewToggleBtn
  };
}
