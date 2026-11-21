import { describe, it, expect } from 'vitest';
import {
  ISLANDS,
  WARDROBE_ITEMS,
  TREEHOUSE_SLOTS,
  TREEHOUSE_ITEMS,
  DEFAULT_TREEHOUSE_SLOTS,
  PARTNER_SNACKS,
  getIslandById,
  getWardrobeItemById,
  getTreehouseItemById
} from '../src/domain/quest-data.js';
import {
  createDefaultSaveV2,
  migrateV1ToV2,
  normalizeSaveDataV2,
  setStageStars,
  getLocalDateKey
} from '../src/domain/quest-questions.js';
import {
  DAILY_ALL_CLEAR_BONUS,
  STAMP_STEP_COINS,
  STAMP_ROUND_COMPLETE_COINS,
  STAMP_OVERFLOW_BONUS_COINS,
  generateDailyQuests,
  ensureDailyQuests,
  recordDailyQuestProgress,
  countClaimableDailyQuests,
  claimDailyQuestReward,
  getBondLevelFromXp,
  getPartnerBondInfo,
  addPartnerBondXp,
  getPartnerSpecialtyEffects,
  resolveWrongAnswerWithShield,
  calculateLuckyCoinBonus,
  rollLuckyPerCorrectDrop,
  getActiveWardrobe,
  isWardrobeItemUnlocked,
  isTreehouseItemUnlocked,
  isPartnerUnlocked,
  purchaseWardrobeItem,
  equipWardrobeItem,
  purchaseTreehouseItem,
  equipTreehouseSlot,
  toggleTreehousePlaymate,
  feedPartnerSnack
} from '../src/domain/quest-retention.js';
import {
  renderPinkBunnySvg,
  buildBunnyCostumeLayers,
  getCharacterSvg,
  getProjectileSvg
} from '../src/quest/svg-art.js';
import {
  renderTreehouseSceneHtml,
  renderTreehouseItemPreviewHtml,
  getTreehouseInteractMessage
} from '../src/quest/treehouse-svg.js';

describe('Phase 3：每日冒險委託確定性、海域過濾與不斷簽印章本', () => {
  it('同一本地日期應生成完全一致的 3 個委託，且在未解鎖雲端海域時 120 天內絕不抽出雲端委託', () => {
    const day = '2026-11-21';
    const q1 = generateDailyQuests(day, ['sunny', 'mul']);
    const q2 = generateDailyQuests(day, ['sunny', 'mul']);
    expect(q1).toEqual(q2);
    expect(q1).toHaveLength(3);
    expect(q1.map((t) => t.slot)).toEqual(['warmup', 'theme', 'challenge']);

    for (let i = 0; i < 120; i++) {
      const d = getLocalDateKey(new Date(2026, 0, 1 + i));
      const tasks = generateDailyQuests(d, ['sunny', 'mul']);
      expect(tasks.some((t) => t.realmFilter === 'cloud')).toBe(false);
    }

    // 解鎖雲端後應能涵蓋到 cloud 主題委託
    let sawCloud = false;
    for (let i = 0; i < 90; i++) {
      const d = getLocalDateKey(new Date(2026, 0, 1 + i));
      const tasks = generateDailyQuests(d, ['sunny', 'mul', 'cloud']);
      if (tasks.some((t) => t.realmFilter === 'cloud')) sawCloud = true;
    }
    expect(sawCloud).toBe(true);
  });

  it('委託進度推進、防重複領取與全勤 +25 獎勵正確運作', () => {
    const save = createDefaultSaveV2(new Date(2026, 10, 21));
    const daily = ensureDailyQuests(save, '2026-11-21');
    daily.tasks[0] = {
      id: 't1',
      slot: 'warmup',
      slotLabel: '暖身委託',
      icon: '🗺️',
      title: '小試身手',
      desc: '完成 1 關',
      metric: 'clear_any_stage',
      realmFilter: 'any',
      target: 1,
      progress: 0,
      rewardCoins: 20,
      claimed: false
    };
    daily.tasks[1] = {
      id: 't2',
      slot: 'theme',
      slotLabel: '主題委託',
      icon: '☀️',
      title: '陽光神射手',
      desc: '答對 2 題',
      metric: 'clean_correct_realm',
      realmFilter: 'sunny',
      target: 2,
      progress: 0,
      rewardCoins: 30,
      claimed: false
    };
    daily.tasks[2] = {
      id: 't3',
      slot: 'challenge',
      slotLabel: '挑戰委託',
      icon: '⭐',
      title: '三星閃耀王',
      desc: '拿 3 星',
      metric: 'earn_3_stars',
      realmFilter: 'any',
      target: 1,
      progress: 0,
      rewardCoins: 45,
      claimed: false
    };

    recordDailyQuestProgress(save, { type: 'question_correct', realmId: 'sunny', cleanFirstTry: true, combo: 1 }, '2026-11-21');
    recordDailyQuestProgress(save, { type: 'question_correct', realmId: 'sunny', cleanFirstTry: true, combo: 2 }, '2026-11-21');
    recordDailyQuestProgress(save, { type: 'stage_clear', realmId: 'sunny', stars: 3, maxCombo: 2 }, '2026-11-21');

    expect(countClaimableDailyQuests(save)).toBe(3);

    const r1 = claimDailyQuestReward(save, 't1', '2026-11-21');
    expect(r1.ok).toBe(true);
    expect(r1.stampAwarded).toBe(true);
    expect(r1.stampCoins).toBe(STAMP_STEP_COINS);
    expect(r1.totalCoinsEarned).toBe(20 + STAMP_STEP_COINS);

    // 重複領取 t1 必須拒絕
    expect(claimDailyQuestReward(save, 't1', '2026-11-21').ok).toBe(false);

    // 同日領第 2、3 個委託不會重複蓋章，第 3 個全勤發額外 +25
    const r2 = claimDailyQuestReward(save, 't2', '2026-11-21');
    expect(r2.stampAwarded).toBe(false);
    expect(r2.totalCoinsEarned).toBe(30);

    const r3 = claimDailyQuestReward(save, 't3', '2026-11-21');
    expect(r3.allClearBonus).toBe(DAILY_ALL_CLEAR_BONUS);
    expect(r3.totalCoinsEarned).toBe(45 + DAILY_ALL_CLEAR_BONUS);
    expect(save.starCoins).toBe(20 + STAMP_STEP_COINS + 30 + 45 + DAILY_ALL_CLEAR_BONUS);
  });

  it('冒險印章本斷簽不歸零，滿 7 章領 +100 幣與限定樹屋裝飾並開啟新一輪', () => {
    const save = createDefaultSaveV2(new Date(2026, 10, 1));
    const days = [
      '2026-11-01',
      '2026-11-03', // 跳過一天斷簽
      '2026-11-08', // 跳過五天斷簽
      '2026-11-09',
      '2026-11-12',
      '2026-11-15',
      '2026-11-20'
    ];

    days.forEach((day, idx) => {
      const d = ensureDailyQuests(save, day);
      // 跨日後原本蓋的章數絕對不歸零
      expect(save.stampBook.count).toBe(idx);
      d.tasks[0].progress = d.tasks[0].target;
      const res = claimDailyQuestReward(save, d.tasks[0].id, day);
      expect(res.ok).toBe(true);
      expect(res.stampAwarded).toBe(true);
      if (idx < 6) {
        expect(res.completedRound).toBe(false);
        expect(res.stampCoins).toBe(STAMP_STEP_COINS);
      } else {
        expect(res.completedRound).toBe(true);
        expect(res.stampCoins).toBe(STAMP_ROUND_COMPLETE_COINS);
        expect(res.unlockedDecorItem?.id).toBe('star_lantern');
        expect(save.treehouse.unlockedItems).toContain('star_lantern');
        expect(save.stampBook.count).toBe(0);
        expect(save.stampBook.round).toBe(2);
      }
    });

    // 若全部限定裝飾已解鎖，第 7 章額外加發補償幣
    save.treehouse.unlockedItems.push('rainbow_musicbox');
    save.stampBook.count = 6;
    const d2 = ensureDailyQuests(save, '2026-11-25');
    d2.tasks[0].progress = d2.tasks[0].target;
    const round3 = claimDailyQuestReward(save, d2.tasks[0].id, '2026-11-25');
    expect(round3.unlockedDecorItem).toBeNull();
    expect(round3.stampCoins).toBe(STAMP_ROUND_COMPLETE_COINS + STAMP_OVERFLOW_BONUS_COINS);
  });
});

describe('Phase 3：星星幣商店防呆、小兔三部位混搭與舊版 8 款遷移一致性', () => {
  it('舊版 8 款造型遷移與三部位 SVG 混搭渲染均正確且不遮臉', () => {
    const v1 = {
      version: 1,
      activeCostume: 'crown',
      unlockedCostumes: {
        default: true,
        ribbon: true,
        sprout: true,
        explorer: true,
        flower: true,
        glasses: true,
        cape: true,
        crown: true
      },
      stageStars: { '1-1': 3 }
    };
    const v2 = migrateV1ToV2(v1);
    expect(v2.wardrobe.active).toEqual({
      hat: 'diamond_crown',
      outfit: 'diamond_shawl',
      wand: 'none'
    });
    for (const item of WARDROBE_ITEMS) {
      if (item.source === 'milestone' || item.source === 'free') {
        expect(isWardrobeItemUnlocked(v2, item.id)).toBe(true);
      }
    }

    // 三部位任意混搭與魔法杖皆產生合法 SVG
    const mixed = renderPinkBunnySvg('happy', {
      hat: 'unicorn_band',
      outfit: 'space_suit',
      wand: 'rainbow_wand'
    });
    expect(mixed).toContain('<svg');
    expect(mixed).toContain('</svg>');

    // 確認單獨舊版字串呼叫亦維持相容
    const legacyCrown = buildBunnyCostumeLayers('crown');
    expect(legacyCrown.headFrontLayer).toContain('polygon');
    expect(legacyCrown.backLayer).toContain('#fef08a');

    // 5 種攻擊光彈皆能產出合法 SVG
    for (const theme of ['star', 'carrot', 'petal', 'meteor', 'rainbow']) {
      expect(getProjectileSvg(theme)).toContain('<svg');
    }
  });

  it('商店購買裝扮與樹屋家具在餘額不足與重複購買時絕不扣負值', () => {
    const save = createDefaultSaveV2();
    save.starCoins = 50;

    // 買不起 80 幣的列車長帽
    const failBuy = purchaseWardrobeItem(save, 'conductor_cap');
    expect(failBuy.ok).toBe(false);
    expect(failBuy.reason).toBe('insufficient_coins');
    expect(failBuy.missing).toBe(30);
    expect(save.starCoins).toBe(50);

    // 未解鎖不可穿戴
    expect(equipWardrobeItem(save, 'hat', 'conductor_cap').ok).toBe(false);

    // 買得起 50 幣的彩虹條紋毯
    const okRug = purchaseTreehouseItem(save, 'rainbow_stripe');
    expect(okRug.ok).toBe(true);
    expect(save.starCoins).toBe(0);
    expect(save.treehouse.slots.rug).toBe('rainbow_stripe');

    // 重複購買不可再扣款
    save.starCoins = 200;
    const dupBuy = purchaseTreehouseItem(save, 'rainbow_stripe');
    expect(dupBuy.ok).toBe(false);
    expect(dupBuy.reason).toBe('already_owned');
    expect(save.starCoins).toBe(200);

    // 購買三部位各一件混搭
    expect(purchaseWardrobeItem(save, 'croissant_beret').ok).toBe(true);
    expect(purchaseWardrobeItem(save, 'carrot_wand').ok).toBe(true);
    expect(getActiveWardrobe(save)).toEqual({
      hat: 'croissant_beret',
      outfit: 'none',
      wand: 'carrot_wand'
    });
  });
});

describe('Phase 3：秘密樹屋互動、精靈遊樂位上限與四大專長／親密度成長', () => {
  it('15 隻精靈四大專長分佈均衡且 Lv.1～Lv.3 專長參數正確', () => {
    const counts = { eliminate: 0, blocks: 0, shield: 0, lucky: 0 };
    for (const isl of ISLANDS) {
      counts[isl.specialty] = (counts[isl.specialty] || 0) + 1;
    }
    expect(counts).toEqual({ eliminate: 4, blocks: 4, shield: 3, lucky: 4 });

    expect(getBondLevelFromXp(0)).toBe(1);
    expect(getBondLevelFromXp(49)).toBe(1);
    expect(getBondLevelFromXp(50)).toBe(2);
    expect(getBondLevelFromXp(149)).toBe(2);
    expect(getBondLevelFromXp(150)).toBe(3);

    const marketCat = getIslandById('sunny:market');
    expect(getPartnerSpecialtyEffects(marketCat, 1).passiveShieldCharges).toBe(1);
    expect(getPartnerSpecialtyEffects(marketCat, 2).autoOpenFreeHelper).toBe(true);
    expect(getPartnerSpecialtyEffects(marketCat, 3).passiveShieldCharges).toBe(2);

    const bakerySprite = getIslandById('sunny:bakery');
    expect(calculateLuckyCoinBonus(50, 1)).toBe(10); // +20%
    expect(calculateLuckyCoinBonus(50, 2)).toBe(18); // +35% ceil(17.5)=18
    expect(calculateLuckyCoinBonus(50, 3)).toBe(25); // +50%
    expect(rollLuckyPerCorrectDrop(2, () => 0)).toBe(0);
    expect(rollLuckyPerCorrectDrop(3, () => 0.1)).toBe(2);
    expect(rollLuckyPerCorrectDrop(3, () => 0.9)).toBe(0);
  });

  it('守護護盾被動擋錯應保住連擊與三星資格，次數用盡後才正常扣判', () => {
    const lv1Hit = resolveWrongAnswerWithShield({ specialty: 'shield', bondLevel: 1, shieldChargesLeft: 1 });
    expect(lv1Hit).toEqual({
      absorbed: true,
      nextShieldCharges: 0,
      preserveCombo: true,
      preserveCleanFirstTry: true,
      autoOpenFreeHelper: false
    });

    const depleted = resolveWrongAnswerWithShield({ specialty: 'shield', bondLevel: 1, shieldChargesLeft: 0 });
    expect(depleted.absorbed).toBe(false);
    expect(depleted.preserveCombo).toBe(false);

    const lv2Hit = resolveWrongAnswerWithShield({ specialty: 'shield', bondLevel: 2, shieldChargesLeft: 1 });
    expect(lv2Hit.absorbed).toBe(true);
    expect(lv2Hit.autoOpenFreeHelper).toBe(true);
  });

  it('秘密樹屋遊樂位上限 3 隻、點心餵食升至 Lv.3 解鎖光環且餘額不足防呆', () => {
    const save = createDefaultSaveV2();
    // 未打敗魔王不可邀請或餵食
    expect(toggleTreehousePlaymate(save, 'mul:forest').ok).toBe(false);
    expect(feedPartnerSnack(save, 'mul:forest', 'carrot_cookie').ok).toBe(false);

    // 收服 4 隻精靈
    setStageStars(save, 'mul:1-3', 3);
    setStageStars(save, 'mul:2-3', 3);
    setStageStars(save, 'mul:3-3', 3);
    setStageStars(save, 'sunny:4-3', 3);

    expect(toggleTreehousePlaymate(save, 'mul:forest').action).toBe('added');
    expect(toggleTreehousePlaymate(save, 'mul:workshop').action).toBe('added');
    expect(toggleTreehousePlaymate(save, 'mul:garden').action).toBe('added');
    const fourth = toggleTreehousePlaymate(save, 'sunny:market');
    expect(fourth.ok).toBe(false);
    expect(fourth.reason).toBe('max_playmates');

    // 請走 1 隻後才能再邀第 4 隻
    expect(toggleTreehousePlaymate(save, 'mul:workshop').action).toBe('removed');
    expect(toggleTreehousePlaymate(save, 'sunny:market').action).toBe('added');

    // 餵點心餘額不足不扣款
    save.starCoins = 10;
    const noMoney = feedPartnerSnack(save, 'sunny:market', 'carrot_cookie');
    expect(noMoney.ok).toBe(false);
    expect(noMoney.reason).toBe('insufficient_coins');
    expect(save.starCoins).toBe(10);

    // 餵 3 次星空果凍（135 幣）升至 Lv.3 (150 xp)
    save.starCoins = 200;
    feedPartnerSnack(save, 'sunny:market', 'star_jelly');
    expect(getPartnerBondInfo(save, 'sunny:market').level).toBe(2);
    feedPartnerSnack(save, 'sunny:market', 'star_jelly');
    const lv3Res = feedPartnerSnack(save, 'sunny:market', 'star_jelly');
    expect(lv3Res.ok).toBe(true);
    expect(lv3Res.bondRes.newLevel).toBe(3);
    expect(lv3Res.bondRes.unlockedAura).toBe(true);
    expect(save.starCoins).toBe(65);

    // Lv.3 SVG 應包含光環圖層
    const auraSvg = getCharacterSvg('market', false, 'happy', { bondLevel: 3 });
    expect(auraSvg).toContain('mqst-lv3-aura');

    // 樹屋場景 HTML 與 normalizeSaveDataV2 槽位校驗
    const html = renderTreehouseSceneHtml({
      slots: save.treehouse.slots,
      playmates: save.treehouse.playmates,
      wardrobe: getActiveWardrobe(save),
      bonds: save.partners.bonds,
      selectedPlaymateId: 'sunny:market',
      getPinkBunnySvg: renderPinkBunnySvg,
      getCharacterSvg
    });
    expect(html).toContain('mqst-th-room');
    expect(html).toContain('積木市集貓');

    // 若人為篡改未解鎖槽位或無效精靈，normalizeSaveDataV2 應修正回合法預設
    const corrupted = normalizeSaveDataV2({
      version: 2,
      stageStars: { 'sunny:4-3': 2 },
      treehouse: {
        slots: { wallpaper: 'starry_violet', rug: 'carrot_round' },
        unlockedItems: ['wood_cozy'],
        playmates: ['sunny:market', 'cloud:skycastle']
      }
    });
    expect(corrupted.treehouse.slots.wallpaper).toBe('wood_cozy');
    expect(corrupted.treehouse.playmates).toEqual(['sunny:market']);

    // 驗證樹屋商品與點心資料完整性
    expect(TREEHOUSE_ITEMS.some((i) => i.id === getTreehouseItemById('star_lantern')?.id)).toBe(true);
    expect(getWardrobeItemById('carrot_wand', 'wand')?.preferredFinisher).toBe('carrot');
    expect(PARTNER_SNACKS).toHaveLength(2);
  });

  it('開發者全解鎖檢視模式（devMode）可無損預覽所有精靈、三部位裝扮、樹屋家具與親密度等級，關閉後還原真實存檔', () => {
    let save = createDefaultSaveV2();
    expect(isPartnerUnlocked(save, 'cloud:skycastle')).toBe(false);
    expect(isWardrobeItemUnlocked(save, 'unicorn_band')).toBe(false);
    expect(isTreehouseItemUnlocked(save, 'star_lantern')).toBe(false);

    // 開啟開發者模式
    save.devMode = true;
    save.devBondLevel = 3;
    expect(isPartnerUnlocked(save, 'cloud:skycastle')).toBe(true);
    expect(isPartnerUnlocked(save, 'cloud:skycastle', { ignoreDevMode: true })).toBe(false);
    expect(isWardrobeItemUnlocked(save, 'unicorn_band')).toBe(true);
    expect(isWardrobeItemUnlocked(save, 'unicorn_band', { ignoreDevMode: true })).toBe(false);
    expect(isTreehouseItemUnlocked(save, 'star_lantern')).toBe(true);
    expect(isTreehouseItemUnlocked(save, 'star_lantern', { ignoreDevMode: true })).toBe(false);

    // 開發者模式下可自由試穿未購買裝扮與邀請精靈進樹屋
    expect(equipWardrobeItem(save, 'hat', 'unicorn_band').ok).toBe(true);
    expect(toggleTreehousePlaymate(save, 'cloud:skycastle').action).toBe('added');
    expect(getPartnerBondInfo(save, 'cloud:skycastle').level).toBe(3);

    // 關閉開發者模式並經 normalizeSaveDataV2 校驗，應自動還原至真實已解鎖狀態
    save.devMode = false;
    save = normalizeSaveDataV2(save);
    expect(isPartnerUnlocked(save, 'cloud:skycastle')).toBe(false);
    expect(save.wardrobe.active.hat).toBe('star_clip');
    expect(save.treehouse.playmates).toEqual([]);
  });

  it('秘密樹屋 7 槽位擴充、舊版 star_lantern 無損遷移、實物縮圖 ID 唯一性與數學戰績連動', () => {
    const def = createDefaultSaveV2();
    expect(TREEHOUSE_SLOTS).toHaveLength(7);
    expect(Object.keys(def.treehouse.slots)).toEqual([
      'wallpaper',
      'ceiling',
      'window',
      'wall_decor',
      'furniture',
      'decor',
      'rug'
    ]);
    expect(def.treehouse.slots).toEqual(DEFAULT_TREEHOUSE_SLOTS);
    expect(isTreehouseItemUnlocked(def, 'forest_bunting')).toBe(true);
    expect(isTreehouseItemUnlocked(def, 'math_chalkboard')).toBe(true);
    expect(isTreehouseItemUnlocked(def, 'pinecone_lights')).toBe(false);

    // 商店新上架的天花板與牆面掛飾餘額不足不扣負值、買完自動裝配
    def.starCoins = 60;
    expect(purchaseTreehouseItem(def, 'honor_gallery').ok).toBe(false);
    expect(def.starCoins).toBe(60);
    const buyLights = purchaseTreehouseItem(def, 'pinecone_lights');
    expect(buyLights.ok).toBe(true);
    expect(def.starCoins).toBe(0);
    expect(def.treehouse.slots.ceiling).toBe('pinecone_lights');

    // 舊版 5 槽存檔：原本裝在 decor 的 star_lantern 應自動無損歸位到 ceiling，缺漏新槽補預設
    const migratedOld = normalizeSaveDataV2({
      version: 2,
      treehouse: {
        slots: {
          wallpaper: 'wood_cozy',
          rug: 'carrot_round',
          window: 'forest_morning',
          furniture: 'block_shelf',
          decor: 'star_lantern'
        },
        unlockedItems: ['wood_cozy', 'carrot_round', 'forest_morning', 'block_shelf', 'sprout_pot', 'star_lantern'],
        playmates: []
      }
    });
    expect(migratedOld.treehouse.slots.ceiling).toBe('star_lantern');
    expect(migratedOld.treehouse.slots.decor).toBe('sprout_pot');
    expect(migratedOld.treehouse.slots.wall_decor).toBe('math_chalkboard');

    // 場景 HTML 包含繪本底圖、7 槽位標記、空位實體坐墊（無虛線按鈕字樣）與動態戰績數字
    const html = renderTreehouseSceneHtml({
      slots: { ...DEFAULT_TREEHOUSE_SLOTS, wallpaper: 'starry_violet', wall_decor: 'math_chalkboard' },
      playmates: [],
      wardrobe: getActiveWardrobe(def),
      bonds: {},
      progressStats: {
        totalStars: 42,
        maxStars: 135,
        litGems: 27,
        spriteCount: 4,
        maxSprites: 15,
        realmStars: { sunny: 15, mul: 21, cloud: 6 }
      },
      getPinkBunnySvg: renderPinkBunnySvg,
      getCharacterSvg
    });
    expect(html).toContain('assets/quest/treehouse-starry.jpg');
    expect(html).toContain('data-th-slot="ceiling"');
    expect(html).toContain('data-th-slot="wall_decor"');
    expect(html).toContain('mqst-th-empty-cushion-art');
    expect(html).not.toContain('邀請精靈');
    expect(html).toContain('42 / 135');
    expect(html).toContain('27/81');

    // 互動台詞應反映實時戰績
    const boardMsg = getTreehouseInteractMessage('wall_decor', 'math_chalkboard', {
      progressStats: { totalStars: 42, litGems: 27, spriteCount: 4 }
    });
    expect(boardMsg).toContain('42');
    expect(boardMsg).toContain('27/81');

    // 所有商品縮圖均可產出且同頁產生的 clipPath / linearGradient id 絕不重複
    const seenIds = new Set();
    for (const item of TREEHOUSE_ITEMS) {
      const thumb = renderTreehouseItemPreviewHtml(item, {
        progressStats: { totalStars: 12, litGems: 9, spriteCount: 2, realmStars: { sunny: 6, mul: 6, cloud: 0 } }
      });
      expect(thumb.length).toBeGreaterThan(20);
      const idMatches = [...thumb.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
      for (const id of idMatches) {
        expect(seenIds.has(id)).toBe(false);
        seenIds.add(id);
      }
    }
  });
});
