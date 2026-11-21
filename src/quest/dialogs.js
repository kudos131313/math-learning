/**
 * 數學冒險島：圖鑑面板、三部位換裝衣櫥、每日委託＆印章本、星星幣商店、秘密樹屋與家長設定模組
 */
import {
  REALMS,
  ISLANDS,
  STAGES,
  BADGES,
  SKILL_CARDS,
  SKILL_TIER_THRESHOLDS,
  WARDROBE_SLOTS,
  WARDROBE_ITEMS,
  TREEHOUSE_SLOTS,
  TREEHOUSE_ITEMS,
  PARTNER_SNACKS,
  getStageById,
  getIslandById,
  getIslandsByRealm,
  getSpecialtyMeta,
  getWardrobeItemById,
  BOSS_ALBUM_ENTRIES,
  STORY_ALBUM_ENTRIES
} from '../domain/quest-data.js';
import {
  isStageUnlocked,
  getStageStars,
  getActivePartnerId,
  countTotalStars,
  countLitGems,
  countUnlockedSprites,
  getSkillCardProgress,
  countUnlockedSkillCards,
  countDefeatedBosses,
  countUnlockedStories,
  getLocalDateKey
} from '../domain/quest-questions.js';
import {
  DAILY_ALL_CLEAR_BONUS,
  STAMP_STEP_COINS,
  STAMP_ROUND_COMPLETE_COINS,
  CLASSROOM_DAILY_COIN_CAP,
  ensureDailyQuests,
  getPartnerBondInfo,
  getPartnerSpecialtyEffects,
  getActiveWardrobe,
  isWardrobeItemUnlocked,
  countUnlockedWardrobeItems,
  isTreehouseItemUnlocked,
  isPartnerUnlocked,
  getTreehousePlaymates
} from '../domain/quest-retention.js';
import {
  TOWER_ROUTES,
  isTowerUnlocked,
  getTowerBestFloor
} from '../domain/quest-tower.js';
import { getStoryStickerSvg } from './svg-art.js';
import {
  renderTreehouseSceneHtml,
  renderTreehouseItemPreviewHtml
} from './treehouse-svg.js';
import { randInt } from '../domain/number-text.js';

function buildShopBuyBtnHtml({ attrName, itemId, price, coins, labelPrefix = '🪙 ' }) {
  const safeCoins = Math.max(0, Math.floor(Number(coins || 0)));
  const canAfford = safeCoins >= price;
  if (canAfford) {
    return (
      '<button type="button" class="mqst-costume-equip-btn mqst-buy-btn" ' +
      attrName +
      '="' +
      itemId +
      '">' +
      labelPrefix +
      price +
      ' 購買</button>'
    );
  }
  const missing = price - safeCoins;
  return (
    '<button type="button" class="mqst-costume-equip-btn mqst-buy-btn is-short" ' +
    attrName +
    '="' +
    itemId +
    '" disabled aria-disabled="true">🔒 ' +
    price +
    ' 🪙（還差 ' +
    missing +
    ' 枚）</button>'
  );
}

export function createQuestDialogs({
  els,
  getSaveData,
  getPinkBunnySvg,
  getCharacterSvg,
  getCollectableUnlitGems
}) {
  let parentChallengeAns = 42;
  let wardrobeSlotFilter = 'all';
  let albumSectionFilter = 'all';
  let shopSelectedPartnerId = '';

  function buildTreehouseProgressStats(saveData) {
    return {
      totalStars: countTotalStars(saveData),
      maxStars: STAGES.length * 3,
      litGems: countLitGems(saveData),
      spriteCount: countUnlockedSprites(saveData),
      maxSprites: ISLANDS.length,
      realmStars: {
        sunny: countTotalStars(saveData, 'sunny'),
        mul: countTotalStars(saveData, 'mul'),
        cloud: countTotalStars(saveData, 'cloud')
      }
    };
  }

  function getWardrobeProgressMeta(item, saveData, stars, gems) {
    const unlocked = isWardrobeItemUnlocked(saveData, item.id);
    const realUnlocked = isWardrobeItemUnlocked(saveData, item.id, { ignoreDevMode: true });
    if (item.source !== 'milestone') {
      return { unlocked, realUnlocked, current: 1, target: 1, pct: 100, unit: '' };
    }
    const cur = item.unlockType === 'stars' ? stars : gems;
    const tgt = item.target || 1;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const unit = item.unlockType === 'stars' ? '顆星星' : '顆寶石';
    return { unlocked, realUnlocked, current: cur, target: tgt, pct, unit };
  }

  function renderWardrobePane(filterOverride) {
    if (!els.paneWardrobe) return;
    if (filterOverride) wardrobeSlotFilter = filterOverride;

    const saveData = getSaveData();
    const activeW = getActiveWardrobe(saveData);
    const stars = countTotalStars(saveData);
    const gems = countLitGems(saveData);
    const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
    const collectableUnlit = getCollectableUnlitGems();

    const activeHat = getWardrobeItemById(activeW.hat, 'hat') || getWardrobeItemById('star_clip', 'hat');
    const activeOutfit = getWardrobeItemById(activeW.outfit, 'outfit') || getWardrobeItemById('none', 'outfit');
    const activeWand = getWardrobeItemById(activeW.wand, 'wand') || getWardrobeItemById('none', 'wand');

    const totalCollectable = WARDROBE_ITEMS.filter((it) => it.id !== 'none').length;
    const unlockedCount = countUnlockedWardrobeItems(saveData);

    let wbHtml =
      '<div class="mqst-gem-summary">' +
      '<span>🎀 已解鎖小兔裝扮：<b>' +
      unlockedCount +
      ' / ' +
      totalCollectable +
      '</b> 件</span>' +
      '<button type="button" class="mqst-tool-btn mqst-mini-shop-btn" data-goto-shop="wardrobe">🛍️ 逛星星幣商店（🪙 ' +
      coins +
      '）</button>' +
      '</div>';

    wbHtml +=
      '<div class="mqst-wardrobe-stage">' +
      '<button type="button" class="mqst-wardrobe-preview-btn" id="mqst-wardrobe-preview-btn" aria-label="點擊試衣鏡中的粉紅小兔互動" title="點點粉紅小兔試穿效果！">' +
      getPinkBunnySvg('happy', activeW) +
      '</button>' +
      '<div class="mqst-wardrobe-info">' +
      '<div class="mqst-wardrobe-current">✨ 目前混搭造型</div>' +
      '<div class="mqst-wardrobe-slot-pills">' +
      '<span class="mqst-wardrobe-slot-pill">👒 頭飾：<b>' +
      (activeHat ? activeHat.name : '經典小星星') +
      '</b></span>' +
      '<span class="mqst-wardrobe-slot-pill">🧥 服裝：<b>' +
      (activeOutfit ? activeOutfit.name : '經典小兔裝') +
      '</b></span>' +
      '<span class="mqst-wardrobe-slot-pill">🪄 魔法杖：<b>' +
      (activeWand ? activeWand.name : '經典星星魔法') +
      '</b></span>' +
      '</div>' +
      (activeWand && activeWand.id !== 'none'
        ? '<div class="mqst-wardrobe-next-tip">⚡ 魔法杖效果：' + activeWand.desc + '</div>'
        : '<div class="mqst-wardrobe-next-tip">💡 可自由混搭「頭飾＋服裝＋魔法杖」，裝備魔法杖還會改變戰鬥魔法彈與必殺技喔！</div>') +
      '</div></div>';

    wbHtml += '<div class="mqst-wardrobe-filters" role="group" aria-label="裝扮部位篩選">';
    const filters = [{ id: 'all', icon: '✨', name: '全部部位' }].concat(WARDROBE_SLOTS);
    filters.forEach((f) => {
      const act = wardrobeSlotFilter === f.id;
      wbHtml +=
        '<button type="button" class="mqst-filter-pill' +
        (act ? ' is-active' : '') +
        '" data-wardrobe-filter="' +
        f.id +
        '" aria-pressed="' +
        String(act) +
        '">' +
        f.icon +
        ' ' +
        f.name +
        '</button>';
    });
    wbHtml += '</div>';

    const visibleItems = WARDROBE_ITEMS.filter(
      (it) => wardrobeSlotFilter === 'all' || it.slot === wardrobeSlotFilter
    );

    wbHtml += '<div class="mqst-collection-grid">';
    visibleItems.forEach((item) => {
      const prog = getWardrobeProgressMeta(item, saveData, stars, gems);
      const isEquipped = prog.unlocked && activeW[item.slot] === item.id;
      const previewSpec = Object.assign({}, activeW);
      previewSpec[item.slot] = item.id;

      const slotMeta = WARDROBE_SLOTS.find((s) => s.id === item.slot);
      wbHtml +=
        '<div class="mqst-collect-card' +
        (prog.unlocked ? '' : ' locked') +
        (isEquipped ? ' is-equipped' : '') +
        '">' +
        '<span class="mqst-slot-badge">' +
        (slotMeta ? slotMeta.icon + ' ' + slotMeta.name : item.slot) +
        '</span>' +
        (isEquipped ? '<span class="mqst-equipped-tag">⭐ 穿戴中</span>' : '') +
        '<div class="mqst-costume-art" aria-hidden="true">' +
        getPinkBunnySvg(isEquipped ? 'happy' : 'normal', previewSpec) +
        '</div>' +
        '<div class="mqst-collect-name">' +
        item.icon +
        ' ' +
        item.name +
        '</div>' +
        '<p class="mqst-collect-desc">' +
        item.desc +
        '</p>';

      if (prog.unlocked) {
        const originHint = !prog.realUnlocked
          ? item.source === 'shop'
            ? '🧪 開發者免解鎖試穿（原為商店 🪙 ' + item.price + '）'
            : '🧪 開發者免解鎖試穿（原條件：' + item.goalText + '）'
          : item.source === 'free'
            ? '✨ 基礎造型'
            : item.source === 'shop'
              ? '🛍️ 商店收藏品'
              : '🔓 ' + item.goalText;
        wbHtml +=
          '<p class="mqst-collect-skill' + (!prog.realUnlocked ? ' is-dev-preview' : '') + '">' +
          originHint +
          '</p>' +
          '<button type="button" class="mqst-costume-equip-btn' +
          (isEquipped ? ' active' : '') +
          '" data-equip-slot="' +
          item.slot +
          '" data-equip-item="' +
          item.id +
          '" aria-pressed="' +
          String(isEquipped) +
          '">' +
          (isEquipped ? '✅ 穿戴中' : '👗 穿戴此部位') +
          '</button>';
      } else if (item.source === 'shop') {
        wbHtml +=
          '<div class="mqst-costume-progress-wrap">' +
          '<div class="mqst-costume-goal-text">🛍️ 星星幣商店限定</div>' +
          buildShopBuyBtnHtml({
            attrName: 'data-buy-wardrobe-item',
            itemId: item.id,
            price: item.price,
            coins
          }) +
          '</div>';
      } else {
        wbHtml +=
          '<div class="mqst-costume-progress-wrap">' +
          '<div class="mqst-costume-goal-text">🔒 ' +
          item.goalText +
          '（' +
          prog.current +
          ' / ' +
          prog.target +
          '）</div>' +
          '<div class="mqst-costume-progress-track" role="progressbar" aria-label="' +
          item.name +
          ' 解鎖進度" aria-valuenow="' +
          prog.current +
          '" aria-valuemin="0" aria-valuemax="' +
          prog.target +
          '">' +
          '<div class="mqst-costume-progress-fill" style="width:' +
          prog.pct +
          '%;"></div>' +
          '</div>' +
          (item.unlockType === 'gems' && collectableUnlit.length > 0
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
    if (!els.paneSkills) return;
    const saveData = getSaveData();
    const unlockedSkills = countUnlockedSkillCards(saveData);
    const tierMeta = {
      none: { label: '尚未啟封', badgeCls: 'tier-none' },
      bronze: { label: '🥉 銅卡', badgeCls: 'tier-bronze' },
      silver: { label: '🥈 銀卡', badgeCls: 'tier-silver' },
      gold: { label: '🥇 金卡大師', badgeCls: 'tier-gold' }
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

    if (saveData.devMode) {
      const curTier = saveData.devSkillTier || '';
      const tierOpts = [
        { id: '', label: '真實進度' },
        { id: 'bronze', label: '🥉 全銅卡預覽' },
        { id: 'silver', label: '🥈 全銀卡預覽' },
        { id: 'gold', label: '🥇 全金卡預覽' }
      ];
      html += '<div class="mqst-dev-inline-bar"><span>🧪 開發者卡框材質預覽：</span><div class="mqst-dev-pills">';
      tierOpts.forEach((opt) => {
        const act = curTier === opt.id;
        html +=
          '<button type="button" class="mqst-filter-pill' +
          (act ? ' is-active' : '') +
          '" data-dev-skill-tier="' +
          opt.id +
          '" aria-pressed="' +
          String(act) +
          '">' +
          opt.label +
          '</button>';
      });
      html += '</div></div>';
    }

    const groups = [
      { id: 'sunny', title: '☀️ 陽光加減群島（10 張）' },
      { id: 'mul', title: '🌲 九九乘法奇幻群島（4 張）' },
      { id: 'cloud', title: '☁️ 雲端應用王國（9 張）' },
      { id: 'global', title: '🆘 全域救援專精（1 張）' }
    ];

    groups.forEach(function (grp) {
      const groupCards = SKILL_CARDS.filter((c) => c.realmId === grp.id);
      if (groupCards.length === 0) return;
      const unlockedInGroup = groupCards.filter((c) => getSkillCardProgress(c.id, saveData).tier !== 'none').length;
      html +=
        '<div class="mqst-dex-group-title">' +
        grp.title +
        ' · 已啟封 ' +
        unlockedInGroup +
        ' / ' +
        groupCards.length +
        '</div>';
      html += '<div class="mqst-collection-grid">';
      groupCards.forEach(function (card) {
        const prog = getSkillCardProgress(card.id, saveData);
        const tm = tierMeta[prog.tier] || tierMeta.none;
        const sampleSt = card.sampleStageId ? getStageById(card.sampleStageId) : null;
        const canPlay = sampleSt && isStageUnlocked(sampleSt.stageKey || sampleSt.id, saveData);
        const goalTxt = prog.isMax
          ? '🏆 已達最高金卡榮譽（共 ' + prog.count + ' 題）'
          : '進度：' +
            prog.count +
            ' / ' +
            prog.nextTarget +
            ' 題（下一階：' +
            (prog.nextTier === 'bronze' ? '銅卡' : prog.nextTier === 'silver' ? '銀卡' : '金卡') +
            '）';

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
    });
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
      '<span style="font-size:13px;color:var(--ink-soft);">四大專長各顯神通！帶牠出戰或到秘密樹屋餵點心升至 Lv.3，即可強化專長並解鎖閃耀星光環！</span>' +
      '</div>';

    if (saveData.devMode) {
      const curBond = Number(saveData.devBondLevel || 0);
      const bondOpts = [
        { lv: 0, label: '真實進度' },
        { lv: 1, label: 'Lv.1 初識' },
        { lv: 2, label: 'Lv.2 熟稔' },
        { lv: 3, label: 'Lv.3 滿級光環✨' }
      ];
      spHtml += '<div class="mqst-dev-inline-bar"><span>🧪 開發者精靈親密度＆光環預覽：</span><div class="mqst-dev-pills">';
      bondOpts.forEach((opt) => {
        const act = curBond === opt.lv;
        spHtml +=
          '<button type="button" class="mqst-filter-pill' +
          (act ? ' is-active' : '') +
          '" data-dev-bond="' +
          opt.lv +
          '" aria-pressed="' +
          String(act) +
          '">' +
          opt.label +
          '</button>';
      });
      spHtml += '</div></div>';
    }

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
        const realGot = getStageStars(saveData, isl.bossStageId) >= 1;
        const got = Boolean(realGot || saveData.devMode);
        const equipped = got && activePartnerFullId === isl.fullId;
        const bond = getPartnerBondInfo(saveData, isl.fullId);
        const specMeta = getSpecialtyMeta(isl.specialty);
        const bossSt = getStageById(isl.bossStageId);
        const bossUnlocked = isStageUnlocked(isl.bossStageId, saveData);
        const bossLabel = bossSt ? bossSt.displayNum || bossSt.id : isl.bossStageId;

        spHtml +=
          '<div class="mqst-collect-card' +
          (got ? '' : ' locked') +
          (equipped ? ' is-equipped' : '') +
          '">' +
          '<span class="mqst-spec-badge spec-' +
          isl.specialty +
          '">' +
          specMeta.icon +
          ' ' +
          specMeta.name +
          '</span>' +
          (equipped ? '<span class="mqst-equipped-tag">⭐ 同行夥伴</span>' : '') +
          (!realGot && saveData.devMode ? '<span class="mqst-dev-preview-tag">🧪 開發者檢視（原需打敗 ' + bossLabel + '）</span>' : '') +
          '<div class="mqst-collect-art">' +
          getCharacterSvg(isl.theme, false, equipped ? 'happy' : 'normal', { bondLevel: got ? bond.level : 1 }) +
          '</div>' +
          '<div class="mqst-collect-name">' +
          (got ? isl.spriteName : '???（尚未收服）') +
          (got ? ' <span class="mqst-lv-chip">Lv.' + bond.level + '</span>' : '') +
          '</div>' +
          '<p class="mqst-collect-desc">' +
          isl.spriteDesc +
          '</p>';

        if (got) {
          spHtml +=
            '<p class="mqst-collect-skill">' +
            specMeta.icon +
            ' <b>Lv.' +
            bond.level +
            ' 效果：</b>' +
            specMeta.lvDesc[bond.level] +
            '</p>' +
            '<div class="mqst-bond-bar-wrap">' +
            '<div class="mqst-costume-goal-text">' +
            (bond.isMax ? '✨ 親密度滿級（' + bond.xp + ' 點）・專屬光環閃耀中' : '💖 親密度：' + bond.xp + ' / ' + bond.nextThreshold + '（Lv.' + (bond.level + 1) + '）') +
            '</div>' +
            '<div class="mqst-costume-progress-track"><div class="mqst-costume-progress-fill" style="width:' +
            bond.pct +
            '%;"></div></div>' +
            '</div>' +
            '<div class="mqst-sprite-card-actions">' +
            '<button type="button" class="mqst-sprite-equip-btn' +
            (equipped ? ' active' : '') +
            '" data-equip-sprite="' +
            isl.fullId +
            '">' +
            (equipped ? '✅ 同行中（點此休息）' : '🤝 帶牠去冒險') +
            '</button>' +
            '<button type="button" class="mqst-sprite-equip-btn treehouse-go" data-goto-treehouse-sprite="' +
            isl.fullId +
            '">🏡 樹屋餵點心</button>' +
            '</div>';
        } else {
          spHtml +=
            '<p class="mqst-collect-skill mqst-locked-goal">👑 打敗【' +
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
              : '');
        }
        spHtml += '</div>';
      });
      spHtml += '</div>';
    });
    if (els.paneSprites) els.paneSprites.innerHTML = spHtml;

    let bdHtml = '<div class="mqst-collection-grid">';
    BADGES.forEach(function (b) {
      const realUnlocked = Boolean(saveData.badges[b.id]);
      const unlocked = Boolean(realUnlocked || saveData.devMode);
      bdHtml +=
        '<div class="mqst-collect-card' +
        (unlocked ? '' : ' locked') +
        '">' +
        (!realUnlocked && saveData.devMode ? '<span class="mqst-dev-preview-tag">🧪 開發者預覽（尚未達成）</span>' : '') +
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
    renderAlbumPane();
  }

  /* ---------------- Phase 4：魔王與故事收集冊渲染（15 位魔王 ＋ 12 張生活貼紙牆） ---------------- */
  function renderAlbumPane(filterOverride) {
    if (!els.paneAlbum) return;
    if (filterOverride) albumSectionFilter = filterOverride;

    const saveData = getSaveData();
    const defeatedCnt = countDefeatedBosses(saveData);
    const storyCnt = countUnlockedStories(saveData);
    const showBosses = albumSectionFilter === 'all' || albumSectionFilter === 'bosses';
    const showStories = albumSectionFilter === 'all' || albumSectionFilter === 'stories';

    const filters = [
      { id: 'all', label: '📚 全部收藏' },
      { id: 'bosses', label: `👹 魔王檔案 (${defeatedCnt}/15)` },
      { id: 'stories', label: `📖 生活故事貼紙 (${storyCnt}/12)` }
    ];

    let html =
      '<div class="mqst-gem-summary">' +
      `<span>👹 魔王打敗數：<b>${defeatedCnt} / ${BOSS_ALBUM_ENTRIES.length}</b> 位 · 📖 生活故事貼紙：<b>${storyCnt} / ${STORY_ALBUM_ENTRIES.length}</b> 張</span>` +
      '<span style="font-size:13px;color:var(--ink-soft);">打敗島嶼魔王累積討伐次數，答對或通過生活應用關卡即可貼上可愛繪本貼紙！</span>' +
      '</div>';

    html += '<div class="mqst-wardrobe-filters" role="group" aria-label="收集冊篩選">';
    filters.forEach((f) => {
      const act = albumSectionFilter === f.id;
      html +=
        `<button type="button" class="mqst-filter-pill${act ? ' is-active' : ''}" data-album-filter="${f.id}" aria-pressed="${act}">` +
        `${f.label}</button>`;
    });
    html += '</div>';

    if (showBosses) {
      html += `<div class="mqst-dex-group-title">👹 呆萌玩具魔王檔案（${defeatedCnt} / ${BOSS_ALBUM_ENTRIES.length}）</div>`;
      html += '<div class="mqst-album-boss-grid">';
      BOSS_ALBUM_ENTRIES.forEach((entry) => {
        const realDefeats = Number(saveData.bossesDefeated && saveData.bossesDefeated[entry.id]) || (getStageStars(saveData, entry.bossStageId) >= 1 ? 1 : 0);
        const unlocked = realDefeats > 0 || Boolean(saveData.devMode);
        const canChallenge = unlocked || isStageUnlocked(entry.bossStageId, saveData) || Boolean(saveData.previewAll);

        html +=
          `<article class="mqst-album-boss-card${unlocked ? ' is-unlocked' : ' is-locked'}">` +
          (!realDefeats && saveData.devMode ? '<span class="mqst-dev-preview-tag">🧪 開發者預覽</span>' : '') +
          `<div class="mqst-album-boss-art">${getCharacterSvg(entry.svgKey)}</div>` +
          '<div class="mqst-album-boss-body">' +
          '<div class="mqst-album-boss-top">' +
          `<strong class="mqst-album-boss-name">${unlocked ? entry.name : '???（待挑戰魔王）'}</strong>` +
          `<span class="mqst-album-count-pill${realDefeats > 0 ? ' is-hit' : ''}">${realDefeats > 0 ? `已擊敗 ${realDefeats} 次` : '尚未打敗'}</span>` +
          '</div>' +
          `<div class="mqst-album-boss-meta">${entry.islandTitle} · 主題：${entry.mathTopic}</div>` +
          `<p class="mqst-album-boss-bio">${unlocked ? entry.bio : '通關這座島嶼的所有試煉關卡，就能掀開魔王小檔案！'}</p>` +
          (unlocked && entry.tauntWin ? `<div class="mqst-album-boss-quote">💬 ${entry.tauntWin}</div>` : '') +
          (canChallenge
            ? `<button type="button" class="mqst-sprite-equip-btn goto" data-goto-boss="${entry.bossStageId}">⚔️ 前往挑戰魔王</button>`
            : '') +
          '</div></article>';
      });
      html += '</div>';
    }

    if (showStories) {
      html += `<div class="mqst-dex-group-title">📖 生活應用故事貼紙牆（${storyCnt} / ${STORY_ALBUM_ENTRIES.length}）</div>`;
      html += '<div class="mqst-album-story-grid">';
      STORY_ALBUM_ENTRIES.forEach((story) => {
        const realGot = Boolean(saveData.unlockedStories && saveData.unlockedStories[story.id]);
        const unlocked = realGot || Boolean(saveData.devMode);
        const canGo = story.sampleStageId && (isStageUnlocked(story.sampleStageId, saveData) || Boolean(saveData.previewAll || saveData.devMode));

        html +=
          `<article class="mqst-album-story-card${unlocked ? ' is-unlocked' : ' is-locked'}">` +
          (!realGot && saveData.devMode ? '<span class="mqst-dev-preview-tag">🧪 開發者預覽</span>' : '') +
          `<div class="mqst-album-sticker-wrap">${getStoryStickerSvg(story.id, { unlocked })}</div>` +
          `<div class="mqst-album-story-tag">${story.sceneTag}</div>` +
          `<h4 class="mqst-album-story-title">${story.icon} ${unlocked ? story.title : '神秘生活故事貼紙'}</h4>` +
          `<p class="mqst-album-story-text">${unlocked ? story.storyText : `練習「${story.mathLesson}」題目即可撕下保護膜貼上收集冊！`}</p>` +
          `<div class="mqst-album-story-lesson">🎯 核心能力：${story.mathLesson}</div>` +
          (canGo
            ? `<button type="button" class="mqst-sprite-equip-btn goto" data-goto-stage="${story.sampleStageId}">${realGot ? '🔁 回味故事關卡' : '🧭 前往解鎖關卡'}</button>`
            : '') +
          '</article>';
      });
      html += '</div>';
    }

    els.paneAlbum.innerHTML = html;
  }

  /* ---------------- Phase 4：無盡試煉塔路線選擇視窗渲染 ---------------- */
  function renderTowerDialog() {
    if (!els.towerBody) return;
    const saveData = getSaveData();
    const unlocked = isTowerUnlocked(saveData);
    const overallBest = getTowerBestFloor(saveData, 'all');

    let html = '<div class="mqst-tower-intro-card">';
    html +=
      '<div class="mqst-tower-intro-copy">' +
      '<h4>🗼 勇者不限時生存爬塔規則</h4>' +
      '<p>全心思考、沒有倒數計時壓力！開局擁有 <b>3 顆愛心 ❤️❤️❤️</b>，答對 1 層立刻獲得 <b>+3 🪙</b>，每爬上 <b>第 5、10、15… 層</b> 由可愛守塔小魔王守護，打敗即領 <b>+25 🪙 守塔寶箱</b>並補回 <b>1 ❤️</b>（上限 3 顆）！</p>' +
      '</div>' +
      `<div class="mqst-tower-best-summary"><span>最高綜合紀錄</span><strong>${overallBest > 0 ? `第 ${overallBest} 層` : '尚未挑戰'}</strong></div>` +
      '</div>';

    if (!unlocked) {
      html +=
        '<div class="mqst-tower-lock-banner">' +
        '<div><strong>🔒 試煉塔大門尚未開啟</strong><p>先打敗任一海域第 1 座島嶼的魔王（或於設定開啟自由預習模式），即可啟動無限試煉！</p></div>' +
        '<button type="button" class="mqst-sprite-equip-btn goto" data-goto-boss="mul:1-3">⚔️ 去打第 1 座森林魔王</button>' +
        '</div>';
    }

    html += '<div class="mqst-tower-routes-grid">';
    TOWER_ROUTES.forEach((route) => {
      const best = getTowerBestFloor(saveData, route.id);
      html +=
        `<div class="mqst-tower-route-card${unlocked ? '' : ' is-locked'}">` +
        `<div class="mqst-tower-route-head"><span class="mqst-tower-route-ico" aria-hidden="true">${route.icon}</span>` +
        `<div class="mqst-tower-route-titles"><strong>${route.name}</strong><span class="mqst-tower-route-badge">${route.badge}</span></div>` +
        `<span class="mqst-tower-route-best">${best > 0 ? `🏆 最佳 ${best} 層` : '✨ 新路線'}</span>` +
        '</div>' +
        `<p class="mqst-tower-route-desc">${route.subtitle}</p>` +
        '<div class="mqst-tower-route-tiers">階梯：1～5 基礎 → 6～10 進階 → 11～15 複合 → 16+ 一步直解與未知數</div>' +
        `<button type="button" class="mqst-play-big-btn mqst-tower-start-btn" data-start-tower-route="${route.id}"${unlocked ? '' : ' disabled aria-disabled="true"'}>` +
        (unlocked ? '🚀 出發挑戰這條路線' : '🔒 打敗第 1 座魔王後解鎖') +
        '</button>' +
        '</div>';
    });
    html += '</div>';

    els.towerBody.innerHTML = html;
  }

  /* ---------------- 每日冒險委託與不斷簽印章本渲染 ---------------- */
  function renderDailyDialog() {
    if (!els.dailyBody) return;
    const saveData = getSaveData();
    const todayKey = getLocalDateKey();
    const daily = ensureDailyQuests(saveData, todayKey);
    const stampBook = saveData.stampBook || { count: 0, round: 1 };
    const count = Math.max(0, Math.min(7, Number(stampBook.count || 0)));
    const round = Math.max(1, Number(stampBook.round || 1));

    let stampHtml = '<div class="mqst-stamp-panel">';
    stampHtml +=
      '<div class="mqst-stamp-head">' +
      '<div><h4>📖 冒險印章本 · 第 ' +
      round +
      ' 輪（已集 ' +
      count +
      ' / 7 章）</h4>' +
      '<p>每天完成並領取任 1 項委託就能蓋章（每日限 1 章），<b>中斷天數絕不歸零</b>！</p></div>' +
      '<span class="mqst-stamp-status-pill ' +
      (daily.stampedToday ? 'is-done' : 'is-wait') +
      '">' +
      (daily.stampedToday ? '✅ 今日已蓋章' : '✨ 今日尚未蓋章') +
      '</span></div>';

    stampHtml += '<div class="mqst-stamp-board">';
    for (let i = 1; i <= 7; i++) {
      const stamped = i <= count;
      const is7 = i === 7;
      stampHtml +=
        '<div class="mqst-stamp-cell' +
        (stamped ? ' is-stamped' : '') +
        (is7 ? ' is-milestone' : '') +
        '">' +
        '<span class="mqst-stamp-day">第 ' +
        i +
        ' 章</span>' +
        '<span class="mqst-stamp-ico" aria-hidden="true">' +
        (stamped ? '💮' : is7 ? '🎁' : '⬜') +
        '</span>' +
        '<span class="mqst-stamp-reward">' +
        (is7 ? '+' + STAMP_ROUND_COMPLETE_COINS + '🪙<br>＋限定擺飾' : '+' + STAMP_STEP_COINS + '🪙') +
        '</span>' +
        '</div>';
    }
    stampHtml += '</div></div>';

    const tasks = daily.tasks || [];
    const claimedCount = tasks.filter((t) => t && t.claimed).length;
    let tasksHtml =
      '<div class="mqst-daily-section-head">' +
      '<span>🗓️ 今日冒險委託（' +
      todayKey +
      '）</span>' +
      '<span class="mqst-daily-allclear-pill' +
      (daily.allClearBonusClaimed ? ' is-done' : '') +
      '">' +
      (daily.allClearBonusClaimed
        ? '🎉 全勤獎勵 +' + DAILY_ALL_CLEAR_BONUS + ' 🪙 已領取！'
        : '🌟 三項全領再加碼 +' + DAILY_ALL_CLEAR_BONUS + ' 🪙（' + claimedCount + '/3）') +
      '</span></div>';

    tasksHtml += '<div class="mqst-daily-list">';
    tasks.forEach((t) => {
      const prog = Math.min(t.target, Number(t.progress || 0));
      const done = prog >= t.target;
      const pct = Math.min(100, Math.round((prog / Math.max(1, t.target)) * 100));

      let actionHtml = '';
      if (t.claimed) {
        actionHtml = '<span class="mqst-daily-done-tag">✅ 已領取</span>';
      } else if (done) {
        actionHtml =
          '<button type="button" class="mqst-claim-daily-btn" data-claim-daily-task="' +
          t.id +
          '">🎁 領取 +' +
          t.rewardCoins +
          ' 🪙</button>';
      } else if (t.metric === 'treehouse_interact') {
        actionHtml =
          '<button type="button" class="mqst-tool-btn mqst-daily-go-btn" data-daily-goto-treehouse="1">🏡 去樹屋互動</button>';
      } else if (t.metric === 'classroom_practice') {
        actionHtml =
          '<button type="button" class="mqst-tool-btn mqst-daily-go-btn" data-daily-goto-classroom="1">🏫 去教室探索賺幣</button>';
      } else if (t.metric === 'tower_floor_5') {
        actionHtml =
          '<button type="button" class="mqst-tool-btn mqst-daily-go-btn" data-daily-goto-tower="1">🗼 去挑戰試煉塔</button>';
      } else if (t.realmFilter && t.realmFilter !== 'any') {
        const realmObj = REALMS.find((r) => r.id === t.realmFilter);
        actionHtml =
          '<button type="button" class="mqst-tool-btn mqst-daily-go-btn" data-daily-goto-realm="' +
          t.realmFilter +
          '">' +
          (realmObj ? realmObj.icon + ' 前往' + realmObj.shortTitle : '🗺️ 前往挑戰') +
          '</button>';
      } else {
        actionHtml = '<span class="mqst-daily-pending-tag">進行中（' + prog + ' / ' + t.target + '）</span>';
      }

      tasksHtml +=
        '<div class="mqst-daily-card' +
        (t.claimed ? ' is-claimed' : done ? ' is-ready' : '') +
        '">' +
        '<div class="mqst-daily-ico" aria-hidden="true">' +
        t.icon +
        '</div>' +
        '<div class="mqst-daily-main">' +
        '<div class="mqst-daily-title-row">' +
        '<span class="mqst-daily-slot-tag">' +
        t.slotLabel +
        '</span>' +
        '<strong>' +
        t.title +
        '</strong>' +
        '<span class="mqst-daily-coin-tag">+' +
        t.rewardCoins +
        ' 🪙</span>' +
        '</div>' +
        '<p class="mqst-daily-desc">' +
        t.desc +
        '</p>' +
        '<div class="mqst-costume-progress-track"><div class="mqst-costume-progress-fill" style="width:' +
        pct +
        '%;"></div></div>' +
        '</div>' +
        '<div class="mqst-daily-action">' +
        actionHtml +
        '</div></div>';
    });
    const classroomEarned = Math.max(0, Math.floor(Number(daily.classroomCoinEarned || 0)));
    tasksHtml +=
      '</div><div class="mqst-daily-classroom-bar">' +
      `<span>🏫 今日教學教室探索練習獎勵：<b>${classroomEarned} / ${CLASSROOM_DAILY_COIN_CAP} 🪙</b>（在位值／跳數／直式／乘法教室動手或答對每次 +3 🪙）</span>` +
      '<button type="button" class="mqst-tool-btn mqst-daily-go-btn" data-daily-goto-classroom="1">🏫 去教室探索賺幣</button>' +
      '</div>';

    els.dailyBody.innerHTML = stampHtml + tasksHtml;
  }

  /* ---------------- 星星幣冒險商店渲染 ---------------- */
  function renderShopDialog() {
    const saveData = getSaveData();
    const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
    if (els.shopCoinBal) els.shopCoinBal.textContent = String(coins);

    // 1. 小兔裝扮分頁
    if (els.shopPaneWardrobe) {
      const activeW = getActiveWardrobe(saveData);
      const shopWardrobe = WARDROBE_ITEMS.filter((it) => it.source === 'shop');
      let wHtml =
        '<div class="mqst-gem-summary">' +
        '<span>🎀 三部位混搭新品（頭飾・服裝・魔法杖）</span>' +
        '<span style="font-size:13px;color:var(--ink-soft);">買下後會直接放入小兔衣櫥，裝備魔法杖還會改變戰鬥魔法彈喔！</span>' +
        '</div><div class="mqst-collection-grid">';

      shopWardrobe.forEach((item) => {
        const owned = isWardrobeItemUnlocked(saveData, item.id);
        const equipped = owned && activeW[item.slot] === item.id;
        const previewSpec = Object.assign({}, activeW);
        previewSpec[item.slot] = item.id;
        const slotMeta = WARDROBE_SLOTS.find((s) => s.id === item.slot);

        wHtml +=
          '<div class="mqst-collect-card' +
          (equipped ? ' is-equipped' : '') +
          '">' +
          '<span class="mqst-slot-badge">' +
          (slotMeta ? slotMeta.icon + ' ' + slotMeta.name : item.slot) +
          '</span>' +
          '<div class="mqst-costume-art" aria-hidden="true">' +
          getPinkBunnySvg(equipped ? 'happy' : 'normal', previewSpec) +
          '</div>' +
          '<div class="mqst-collect-name">' +
          item.icon +
          ' ' +
          item.name +
          '</div>' +
          '<p class="mqst-collect-desc">' +
          item.desc +
          '</p>' +
          '<div class="mqst-costume-progress-wrap">' +
          (owned
            ? '<button type="button" class="mqst-costume-equip-btn' +
              (equipped ? ' active' : '') +
              '" data-shop-equip-wardrobe-slot="' +
              item.slot +
              '" data-shop-equip-wardrobe-id="' +
              item.id +
              '">' +
              (equipped ? '✅ 穿戴中' : '👗 穿戴這件') +
              '</button>'
            : buildShopBuyBtnHtml({
                attrName: 'data-shop-buy-wardrobe',
                itemId: item.id,
                price: item.price,
                coins
              })) +
          '</div></div>';
      });
      wHtml += '</div>';
      els.shopPaneWardrobe.innerHTML = wHtml;
    }

    // 2. 樹屋家具分頁
    if (els.shopPaneTreehouse) {
      const thSlots = (saveData.treehouse && saveData.treehouse.slots) || {};
      const progressStats = buildTreehouseProgressStats(saveData);
      let tHtml =
        '<div class="mqst-gem-summary">' +
        '<span>🏡 秘密樹屋家具與風景裝飾（7 大佈置部位）</span>' +
        '<button type="button" class="mqst-tool-btn mqst-mini-shop-btn" data-shop-goto-treehouse="1">🏡 前往秘密樹屋佈置</button>' +
        '</div>';

      TREEHOUSE_SLOTS.forEach((slotMeta) => {
        const items = TREEHOUSE_ITEMS.filter((it) => it.slot === slotMeta.id);
        tHtml += '<div class="mqst-dex-group-title">' + slotMeta.icon + ' ' + slotMeta.name + '</div>';
        tHtml += '<div class="mqst-collection-grid">';
        items.forEach((item) => {
          const owned = isTreehouseItemUnlocked(saveData, item.id);
          const equipped = owned && thSlots[item.slot] === item.id;
          tHtml +=
            '<div class="mqst-collect-card' +
            (equipped ? ' is-equipped' : '') +
            '">' +
            '<div class="mqst-th-shop-thumb" aria-hidden="true">' +
            renderTreehouseItemPreviewHtml(item, { progressStats }) +
            '</div>' +
            '<div class="mqst-collect-name">' +
            item.name +
            '</div>' +
            '<p class="mqst-collect-desc">' +
            item.desc +
            '</p>' +
            '<div class="mqst-costume-progress-wrap">';

          if (owned) {
            tHtml +=
              '<button type="button" class="mqst-costume-equip-btn' +
              (equipped ? ' active' : '') +
              '" data-shop-equip-th-slot="' +
              item.slot +
              '" data-shop-equip-th-id="' +
              item.id +
              '">' +
              (equipped ? '✅ 樹屋擺設中' : '🏡 擺進樹屋') +
              '</button>';
          } else if (item.source === 'stamp_reward') {
            tHtml += '<span class="mqst-costume-goal-text">🎁 冒險印章本滿 7 章限定贈禮</span>';
          } else {
            tHtml += buildShopBuyBtnHtml({
              attrName: 'data-shop-buy-treehouse',
              itemId: item.id,
              price: item.price,
              coins
            });
          }
          tHtml += '</div></div>';
        });
        tHtml += '</div>';
      });
      els.shopPaneTreehouse.innerHTML = tHtml;
    }

    // 3. 精靈點心分頁
    if (els.shopPaneSnacks) {
      const unlockedIslands = ISLANDS.filter((isl) => isPartnerUnlocked(saveData, isl.fullId));
      if (unlockedIslands.length === 0) {
        els.shopPaneSnacks.innerHTML =
          '<div class="mqst-realm-unlock-box">🐣 尚未收服守護小精靈！打敗任一座島嶼的 👑 魔王關後，就能買點心餵食牠、提升親密度到 Lv.3 囉！</div>';
        return;
      }

      if (!shopSelectedPartnerId || !isPartnerUnlocked(saveData, shopSelectedPartnerId)) {
        const activeP = getActivePartnerId(saveData);
        shopSelectedPartnerId = activeP || unlockedIslands[0].fullId;
      }
      const targetIsl = getIslandById(shopSelectedPartnerId);
      const bond = getPartnerBondInfo(saveData, targetIsl.fullId);

      let sHtml =
        '<div class="mqst-gem-summary">' +
        '<span>🍪 餵點心提升守護小精靈親密度（Lv.1 ➔ Lv.2 需 50 點・Lv.3 需 150 點）</span>' +
        '</div>';

      sHtml += '<div class="mqst-snack-target-bar" role="group" aria-label="選擇要餵食的守護小精靈">';
      unlockedIslands.forEach((isl) => {
        const b = getPartnerBondInfo(saveData, isl.fullId);
        const active = isl.fullId === targetIsl.fullId;
        sHtml +=
          '<button type="button" class="mqst-filter-pill' +
          (active ? ' is-active' : '') +
          '" data-shop-select-partner="' +
          isl.fullId +
          '" aria-pressed="' +
          String(active) +
          '">' +
          isl.partnerProjectile +
          ' ' +
          isl.spriteName +
          ' (Lv.' +
          b.level +
          ')</button>';
      });
      sHtml += '</div>';

      sHtml +=
        '<div class="mqst-wardrobe-stage mqst-snack-preview">' +
        '<div class="mqst-collect-art">' +
        getCharacterSvg(targetIsl.theme, false, 'happy', { bondLevel: bond.level }) +
        '</div>' +
        '<div class="mqst-wardrobe-info">' +
        '<div class="mqst-wardrobe-current">' +
        targetIsl.spriteName +
        ' · 親密度 Lv.' +
        bond.level +
        '</div>' +
        '<p class="mqst-wardrobe-sub">' +
        (bond.isMax
          ? '🏆 已達最高 Lv.3（' + bond.xp + ' 點），專屬閃耀光環已啟用！繼續餵食也會開心感謝你！'
          : '目前經驗：' + bond.xp + ' / ' + bond.nextThreshold + '（再 ' + (bond.nextThreshold - bond.xp) + ' 點升至 Lv.' + (bond.level + 1) + '）') +
        '</p>' +
        '<div class="mqst-costume-progress-track"><div class="mqst-costume-progress-fill" style="width:' +
        bond.pct +
        '%;"></div></div>' +
        '</div></div>';

      sHtml += '<div class="mqst-collection-grid">';
      PARTNER_SNACKS.forEach((snack) => {
        sHtml +=
          '<div class="mqst-collect-card">' +
          '<div class="mqst-skill-ico" aria-hidden="true">' +
          snack.icon +
          '</div>' +
          '<div class="mqst-collect-name">' +
          snack.name +
          '（+' +
          snack.bondXp +
          ' 親密度）</div>' +
          '<p class="mqst-collect-desc">' +
          snack.desc +
          '</p>' +
          '<div class="mqst-costume-progress-wrap">' +
          buildShopBuyBtnHtml({
            attrName: 'data-shop-feed-snack',
            itemId: snack.id,
            price: snack.price,
            coins,
            labelPrefix: '🪙 '
          }).replace(' 購買</button>', ' 餵食</button>') +
          '</div></div>';
      });
      sHtml += '</div>';
      els.shopPaneSnacks.innerHTML = sHtml;
    }
  }

  /* ---------------- 秘密樹屋視圖渲染 ---------------- */
  function renderTreehouseView({
    activeTab = 'decor',
    activeSlot = 'wallpaper',
    selectedPlaymateId = '',
    decorateMode = false,
    lampLit = true,
    skipStageRender = false
  } = {}) {
    const saveData = getSaveData();
    const coins = Math.max(0, Math.floor(Number(saveData.starCoins || 0)));
    if (els.thCoins) els.thCoins.textContent = String(coins);

    const th = saveData.treehouse || { slots: {}, unlockedItems: [], playmates: [] };
    const playmates = getTreehousePlaymates(saveData);
    const activeW = getActiveWardrobe(saveData);
    const bonds = (saveData.partners && saveData.partners.bonds) || {};
    const progressStats = buildTreehouseProgressStats(saveData);
    const validSelected =
      selectedPlaymateId && isPartnerUnlocked(saveData, selectedPlaymateId)
        ? selectedPlaymateId
        : playmates[0] || '';

    if (els.thStage && !skipStageRender) {
      els.thStage.innerHTML = renderTreehouseSceneHtml({
        slots: th.slots || {},
        playmates,
        wardrobe: activeW,
        bonds,
        selectedPlaymateId: validSelected,
        progressStats,
        activeSlot,
        decorateMode,
        lampLit,
        getPinkBunnySvg,
        getCharacterSvg
      });
    }

    if (els.thPaneDecor) {
      let dHtml = '<div class="mqst-th-slot-bar" role="group" aria-label="樹屋佈置槽位切換">';
      TREEHOUSE_SLOTS.forEach((slotMeta) => {
        const act = activeSlot === slotMeta.id;
        dHtml +=
          '<button type="button" class="mqst-filter-pill' +
          (act ? ' is-active' : '') +
          '" data-th-slot-select="' +
          slotMeta.id +
          '" aria-pressed="' +
          String(act) +
          '">' +
          slotMeta.icon +
          ' ' +
          slotMeta.name +
          '</button>';
      });
      dHtml += '</div><div class="mqst-th-items-strip">';

      TREEHOUSE_ITEMS.filter((it) => it.slot === activeSlot).forEach((item) => {
        const owned = isTreehouseItemUnlocked(saveData, item.id);
        const realOwned = isTreehouseItemUnlocked(saveData, item.id, { ignoreDevMode: true });
        const equipped = owned && th.slots && th.slots[activeSlot] === item.id;

        dHtml +=
          '<div class="mqst-th-item-card' +
          (equipped ? ' is-equipped' : '') +
          (owned ? '' : ' is-locked') +
          '">' +
          '<div class="mqst-th-item-thumb" aria-hidden="true">' +
          renderTreehouseItemPreviewHtml(item, { progressStats }) +
          '</div>' +
          '<div class="mqst-th-item-meta">' +
          '<strong class="mqst-th-item-name">' +
          item.name +
          (!realOwned && saveData.devMode ? ' 🧪' : '') +
          '</strong>';

        if (owned) {
          dHtml +=
            '<button type="button" class="mqst-th-item-btn' +
            (equipped ? ' active' : '') +
            '" data-th-equip-slot="' +
            item.slot +
            '" data-th-equip-item="' +
            item.id +
            '">' +
            (equipped ? '✅ 擺設中' : '擺上這個') +
            '</button>';
        } else if (item.source === 'stamp_reward') {
          dHtml += '<span class="mqst-th-item-lock-note">🎁 印章本 7 章解鎖</span>';
        } else {
          const canBuy = coins >= item.price;
          dHtml +=
            '<button type="button" class="mqst-th-item-btn is-buy' +
            (canBuy ? '' : ' is-short') +
            '" data-th-buy-item="' +
            item.id +
            '"' +
            (canBuy ? '' : ' disabled aria-disabled="true"') +
            '>' +
            (canBuy ? '🪙 ' + item.price + ' 購買' : '🔒 ' + item.price + '（差 ' + (item.price - coins) + '）') +
            '</button>';
        }
        dHtml += '</div></div>';
      });
      dHtml += '</div>';
      els.thPaneDecor.innerHTML = dHtml;
    }

    if (els.thPaneSprites) {
      const unlockedIslands = ISLANDS.filter((isl) => isPartnerUnlocked(saveData, isl.fullId));
      if (unlockedIslands.length === 0) {
        let emptySnacksHtml = '';
        PARTNER_SNACKS.forEach((sn) => {
          emptySnacksHtml +=
            '<button type="button" class="mqst-th-snack-btn is-short" disabled aria-disabled="true">' +
            sn.icon +
            ' ' +
            sn.name +
            ' (+' +
            sn.bondXp +
            '💖) · 🪙 ' +
            sn.price +
            '（收服後可餵食）</button>';
        });
        els.thPaneSprites.innerHTML =
          '<div class="mqst-th-sprites-flex is-empty-state">' +
          '<div class="mqst-th-playmate-picker mqst-th-panel-card">' +
          '<div class="mqst-th-sub-label">🐣 遊樂位邀請（目前已收服 0 / ' + ISLANDS.length + ' 隻）</div>' +
          '<div class="mqst-th-empty-sprites">' +
          '<span>👑 尚未收服任何守護小精靈！前往海域挑戰各島第 3 關 <b>魔王關</b>，就能收服小精靈邀請來樹屋玩喔！</span>' +
          '<div class="mqst-th-empty-actions">' +
          '<button type="button" class="mqst-th-snack-btn" data-th-goto-realm="sunny">☀️ 前往陽光加減群島</button>' +
          '<button type="button" class="mqst-th-snack-btn" data-th-goto-realm="mul">🌲 前往九九乘法群島</button>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="mqst-th-feed-box mqst-th-panel-card">' +
          '<div class="mqst-th-sub-label">🍪 精靈點心櫃預覽（Lv.1 ➔ Lv.2 需 50💖・Lv.3 解鎖閃耀光環✨）</div>' +
          '<p class="mqst-th-empty-feed-note">收服任一隻守護小精靈後，即可在此用星星幣餵食點心、快速提升親密度等級：</p>' +
          '<div class="mqst-th-snack-btns">' +
          emptySnacksHtml +
          '</div>' +
          '</div>' +
          '</div>';
        return;
      }

      let sHtml = '<div class="mqst-th-sprites-flex">';
      sHtml += '<div class="mqst-th-playmate-picker mqst-th-panel-card"><div class="mqst-th-sub-label">🐣 遊樂位邀請（最多 3 隻・已邀請 ' + playmates.length + '/3）</div><div class="mqst-th-picker-list">';
      unlockedIslands.forEach((isl) => {
        const inRoom = playmates.indexOf(isl.fullId) !== -1;
        const bond = getPartnerBondInfo(saveData, isl.fullId);
        const fullDisabled = !inRoom && playmates.length >= 3;
        sHtml +=
          '<button type="button" class="mqst-th-sprite-chip' +
          (inRoom ? ' is-in' : '') +
          '" data-th-toggle-playmate="' +
          isl.fullId +
          '"' +
          (fullDisabled ? ' disabled title="樹屋遊樂位已滿 3 隻，請先請一隻休息"' : '') +
          '>' +
          '<span class="mqst-th-chip-mini-art" aria-hidden="true">' +
          getCharacterSvg(isl.theme, false, inRoom ? 'happy' : 'normal', { bondLevel: bond.level }) +
          '</span>' +
          '<span class="mqst-th-chip-text">' +
          isl.spriteName +
          ' <small>Lv.' +
          bond.level +
          '</small></span>' +
          '<span class="mqst-th-chip-status">' +
          (inRoom ? '✅ 樹屋中' : fullDisabled ? '已滿' : '＋ 邀請') +
          '</span>' +
          '</button>';
      });
      sHtml += '</div></div>';

      const feedTarget = getIslandById(validSelected || unlockedIslands[0].fullId);
      const feedBond = getPartnerBondInfo(saveData, feedTarget.fullId);
      sHtml += '<div class="mqst-th-feed-box mqst-th-panel-card">';
      sHtml +=
        '<div class="mqst-th-feed-head">' +
        '<div class="mqst-th-sub-label">🍪 餵食點心對象：<b>' +
        feedTarget.spriteName +
        '</b>（Lv.' +
        feedBond.level +
        '・' +
        (feedBond.isMax ? '滿級光環✨' : feedBond.xp + '/' + feedBond.nextThreshold) +
        '）</div>' +
        '<div class="mqst-th-feed-xp-track" aria-hidden="true"><div class="mqst-th-feed-xp-fill" style="width:' +
        feedBond.pct +
        '%;"></div></div>' +
        '</div>';
      sHtml += '<div class="mqst-th-feed-targets">';
      unlockedIslands.forEach((isl) => {
        const sel = isl.fullId === feedTarget.fullId;
        sHtml +=
          '<button type="button" class="mqst-filter-pill' +
          (sel ? ' is-active' : '') +
          '" data-th-select-feed="' +
          isl.fullId +
          '" aria-pressed="' +
          String(sel) +
          '">' +
          isl.partnerProjectile +
          ' ' +
          isl.spriteName +
          '</button>';
      });
      sHtml += '</div><div class="mqst-th-snack-btns">';
      PARTNER_SNACKS.forEach((sn) => {
        const canAfford = coins >= sn.price;
        sHtml +=
          '<button type="button" class="mqst-th-snack-btn' +
          (canAfford ? '' : ' is-short') +
          '" data-th-feed-snack="' +
          sn.id +
          '" data-th-feed-partner="' +
          feedTarget.fullId +
          '"' +
          (canAfford ? '' : ' disabled aria-disabled="true"') +
          '>' +
          sn.icon +
          ' ' +
          sn.name +
          ' (+' +
          sn.bondXp +
          '💖) · ' +
          (canAfford ? '🪙 ' + sn.price : '還差 ' + (sn.price - coins) + ' 🪙') +
          '</button>';
      });
      sHtml += '</div></div></div>';
      els.thPaneSprites.innerHTML = sHtml;
    }
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
    const saveData = getSaveData();
    if (els.previewToggle) {
      els.previewToggle.setAttribute('aria-pressed', String(Boolean(saveData.previewAll)));
      els.previewToggle.textContent = saveData.previewAll ? '已開啟' : '未開啟';
    }
    if (els.previewStatusMsg) {
      els.previewStatusMsg.classList.toggle('is-active', Boolean(saveData.previewAll));
      els.previewStatusMsg.textContent = saveData.previewAll
        ? '目前狀態：已開啟自由挑選／預習模式'
        : '目前狀態：依序闖關模式';
    }
    if (els.devToggle) {
      els.devToggle.setAttribute('aria-pressed', String(Boolean(saveData.devMode)));
      els.devToggle.textContent = saveData.devMode ? '已開啟' : '未開啟';
    }
    if (els.devStatusMsg) {
      els.devStatusMsg.classList.toggle('is-active', Boolean(saveData.devMode));
      els.devStatusMsg.textContent = saveData.devMode
        ? '目前狀態：🧪 已開啟全解鎖檢視（所有精靈、服裝、樹屋家具與徽章皆可免解鎖試用）'
        : '目前狀態：一般玩家視角（僅顯示已解鎖項目）';
    }
    if (els.devToolbox) {
      els.devToolbox.style.display = saveData.devMode ? 'flex' : 'none';
      const curBond = Number(saveData.devBondLevel || 0);
      const bondBtns = els.devToolbox.querySelectorAll('[data-dev-bond]');
      bondBtns.forEach((btn) => {
        const act = Number(btn.getAttribute('data-dev-bond')) === curBond;
        btn.classList.toggle('is-active', act);
        btn.setAttribute('aria-pressed', String(act));
      });
      const curTier = saveData.devSkillTier || '';
      const tierBtns = els.devToolbox.querySelectorAll('[data-dev-skill-tier]');
      tierBtns.forEach((btn) => {
        const act = (btn.getAttribute('data-dev-skill-tier') || '') === curTier;
        btn.classList.toggle('is-active', act);
        btn.setAttribute('aria-pressed', String(act));
      });
    }
  }

  return {
    renderDexDialog,
    renderWardrobePane,
    renderAlbumPane,
    renderDailyDialog,
    renderShopDialog,
    renderTreehouseView,
    buildTreehouseProgressStats,
    renderTowerDialog,
    setupDialogPolyfill,
    refreshParentLock,
    getParentChallengeAns: () => parentChallengeAns,
    updatePreviewToggleBtn,
    setShopSelectedPartnerId: (pid) => {
      shopSelectedPartnerId = pid;
    }
  };
}
