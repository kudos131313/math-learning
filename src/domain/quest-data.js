/**
 * 數學冒險島：海域、島嶼、關卡、徽章、小兔裝扮與必殺技靜態設定（純領域資料模組）
 */

export const STORAGE_KEY = 'math_mul_quest_v1';
export const STORAGE_KEY_V2 = 'math_adventure_v2';
export const MAX_RESCUE_CASES = 18;

/* ---------------- 舊版 8 款造型遷移對照表（三部位裝扮歸位） ---------------- */
export const LEGACY_COSTUME_MIGRATION_MAP = {
  default: { hat: 'star_clip' },
  ribbon: { hat: 'ribbon' },
  sprout: { hat: 'sprout' },
  explorer: { hat: 'explorer' },
  flower: { hat: 'flower' },
  glasses: { hat: 'glasses' },
  cape: { outfit: 'star_cape' },
  crown: { hat: 'diamond_crown', outfit: 'diamond_shawl' }
};

/* ---------------- 3 大冒險海域定義 (Realm) ---------------- */
export const REALMS = [
  {
    id: 'sunny',
    order: 1,
    icon: '☀️',
    title: '陽光加減群島',
    shortTitle: '陽光加減',
    subtitle: '加減運算與生活採購大冒險',
    unlockMode: 'initial',
    status: 'coming_soon',
    releaseNote: 'Phase 2a 啟航',
    mapImg: 'assets/quest/world-map.jpg',
    plannedIslands: [
      '1. 奶油麵包村（二位數無進退位）',
      '2. 草莓糖果鎮（進位與購物合併）',
      '3. 泡泡海灣（退位找錢與比較）',
      '4. 積木大市集（三位數進退位）',
      '5. 彩虹燈塔（跨零退位與未知數）'
    ]
  },
  {
    id: 'mul',
    order: 2,
    icon: '🌲',
    title: '九九乘法奇幻群島',
    shortTitle: '九九乘法',
    subtitle: '五座童話小島與 81 顆乘法寶石',
    unlockMode: 'initial',
    status: 'active',
    mapImg: 'assets/quest/world-map.jpg'
  },
  {
    id: 'cloud',
    order: 3,
    icon: '☁️',
    title: '雲端應用王國',
    shortTitle: '雲端應用',
    subtitle: '跳數密碼、千以內位值與兩步驟生活大挑戰',
    unlockMode: 'conditional',
    unlockRule: { minStars: 15, minBosses: 2 },
    status: 'coming_soon',
    releaseNote: 'Phase 2b 啟航',
    mapImg: 'assets/quest/world-map.jpg',
    plannedIslands: [
      '1. 跳數雲朵車站（跨百跳數密碼）',
      '2. 積木金庫港（千以內位值機關）',
      '3. 森林遊樂園（兩步驟先乘後加）',
      '4. 魔法點心店（兩步驟先乘後減找零）',
      '5. 星光天空城（全課綱大魔王試煉）'
    ]
  }
];

/* ---------------- 九九乘法奇幻群島：5 座主題島嶼與守護小精靈 ---------------- */
export const ISLANDS = [
  {
    id: 'forest',
    fullId: 'mul:forest',
    realmId: 'mul',
    order: 1,
    theme: 'forest',
    specialty: 'eliminate',
    title: '1. 啟程森林',
    rangeText: '1·2·5 的乘法',
    signPos: { x: 14, y: 24 },
    bgImg: 'assets/quest/bg-forest.jpg',
    spriteName: '嫩芽積木寶寶',
    spriteDesc: '打敗森林守門員即可收服，喜歡數著 2 個、5 個一組的葉子！',
    partnerProjectile: '🌿',
    partnerSkillDesc: '吹出嫩芽陣風，幫你消除錯選項或免費打開積木提示！',
    partnerCheers: ['嫩芽陪你一起數！', '葉子排好隊囉！', '一擊命中太厲害！'],
    bossStageId: '1-3'
  },
  {
    id: 'workshop',
    fullId: 'mul:workshop',
    realmId: 'mul',
    order: 2,
    theme: 'workshop',
    specialty: 'blocks',
    title: '2. 積木工坊',
    rangeText: '3·4 的乘法',
    signPos: { x: 34, y: 15 },
    bgImg: 'assets/quest/bg-workshop.jpg',
    spriteName: '方塊小工匠',
    spriteDesc: '打敗工坊機甲怪即可收服，最擅長用積木排整齊！',
    partnerProjectile: '🧱',
    partnerSkillDesc: '拋出彩色積木，幫你看出分組或免費消去一個干擾選項！',
    partnerCheers: ['積木整齊排好了！', '組裝完成大加分！', '小工匠替你拍拍手！'],
    bossStageId: '2-3'
  },
  {
    id: 'garden',
    fullId: 'mul:garden',
    realmId: 'mul',
    order: 3,
    theme: 'garden',
    specialty: 'shield',
    title: '3. 魔法花園',
    rangeText: '6 ＋ 交換律',
    signPos: { x: 52, y: 29 },
    bgImg: 'assets/quest/bg-garden.jpg',
    spriteName: '雙胞胎蝴蝶精靈',
    spriteDesc: '打敗花園迷宮怪即可收服，會變出 a×b ＝ b×a 的魔法！',
    partnerProjectile: '🦋',
    partnerSkillDesc: '撒出蝴蝶光粉，免費開積木提示或變走一個錯答案！',
    partnerCheers: ['蝴蝶翩翩飛來幫你！', '乘法交換魔法超棒！', '花園開滿幸運花！'],
    bossStageId: '3-3'
  },
  {
    id: 'valley',
    fullId: 'mul:valley',
    realmId: 'mul',
    order: 4,
    theme: 'valley',
    specialty: 'lucky',
    title: '4. 巨龍山谷',
    rangeText: '7·8·9 挑戰',
    signPos: { x: 71, y: 17 },
    bgImg: 'assets/quest/bg-valley.jpg',
    spriteName: '雲朵小飛龍',
    spriteDesc: '打敗山谷噴火龍即可收服，專治最容易搞混的大口訣！',
    partnerProjectile: '🔥',
    partnerSkillDesc: '噴出暖呼呼龍焰，幫你免費提示或震飛一個干擾泡泡！',
    partnerCheers: ['龍龍噴出助陣火球！', '大口訣也難不倒我們！', '氣勢滿分繼續衝！'],
    bossStageId: '4-3'
  },
  {
    id: 'castle',
    fullId: 'mul:castle',
    realmId: 'mul',
    order: 5,
    theme: 'castle',
    specialty: 'blocks',
    title: '5. 大師城堡',
    rangeText: '全範圍 ＋ 未知數',
    signPos: { x: 89, y: 21 },
    bgImg: 'assets/quest/bg-castle.jpg',
    spriteName: '皇冠積木王',
    spriteDesc: '通過城堡最終試煉即可收服，是所有乘法小精靈的領袖！',
    partnerProjectile: '👑',
    partnerSkillDesc: '施展皇冠星光，給粉紅小兔最強大的免費提示與雙重助陣！',
    partnerCheers: ['皇冠星光閃耀加持！', '乘法大師就是你！', '守護小隊無人能敵！'],
    bossStageId: '5-3'
  }
];

/* ---------------- 九九乘法奇幻群島：15 個冒險關卡 ---------------- */
export const STAGES = [
  { id: '1-1', stageKey: 'mul:1-1', legacyId: '1-1', realmId: 'mul', islandId: 'forest', label: '1·2 暖身營', mapPos: { x: 24, y: 69 }, tables: [1, 2], qTypes: ['standard'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '1-2', stageKey: 'mul:1-2', legacyId: '1-2', realmId: 'mul', islandId: 'forest', label: '5 跳數小徑', mapPos: { x: 16, y: 61 }, tables: [5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '1-3', stageKey: 'mul:1-3', legacyId: '1-3', realmId: 'mul', islandId: 'forest', label: '森林守門員', mapPos: { x: 11, y: 49 }, tables: [1, 2, 5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'keypad', isBoss: true,
    boss: { name: '森林樹樁怪', svgKey: 'forest', tauntStart: '「想進積木世界？接下 1、2、5 的乘法考驗！」', tauntHit: '「哎呀！口訣好準，葉子掉下來啦！」', tauntWin: '「太強了！森林寶石交給你守護！」' }
  },
  { id: '2-1', stageKey: 'mul:2-1', legacyId: '2-1', realmId: 'mul', islandId: 'workshop', label: '3 的口訣屋', mapPos: { x: 28, y: 46 }, tables: [3], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '2-2', stageKey: 'mul:2-2', legacyId: '2-2', realmId: 'mul', islandId: 'workshop', label: '4 的分組盒', mapPos: { x: 34, y: 39 }, tables: [4], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '2-3', stageKey: 'mul:2-3', legacyId: '2-3', realmId: 'mul', islandId: 'workshop', label: '工坊機甲怪', mapPos: { x: 40, y: 45 }, tables: [3, 4], qTypes: ['standard', 'concept'], count: 5, inputMode: 'keypad', isBoss: true,
    boss: { name: '積木發條怪', svgKey: 'workshop', tauntStart: '「喀啦喀啦！看看你懂不懂幾個幾！」', tauntHit: '「叮咚！發條鬆掉一格啦！」', tauntWin: '「運算好精準！方塊小工匠跟你走！」' }
  },
  { id: '3-1', stageKey: 'mul:3-1', legacyId: '3-1', realmId: 'mul', islandId: 'garden', label: '6 的花田', mapPos: { x: 46, y: 59 }, tables: [6], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '3-2', stageKey: 'mul:3-2', legacyId: '3-2', realmId: 'mul', islandId: 'garden', label: '交換律魔法', mapPos: { x: 53, y: 54 }, tables: [2, 3, 4, 5, 6], qTypes: ['commutative'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '3-3', stageKey: 'mul:3-3', legacyId: '3-3', realmId: 'mul', islandId: 'garden', label: '花園迷宮怪', mapPos: { x: 59, y: 59 }, tables: [3, 4, 5, 6], qTypes: ['standard', 'commutative'], count: 6, inputMode: 'keypad', isBoss: true,
    boss: { name: '花瓣迷宮怪', svgKey: 'garden', tauntStart: '「我把數字左右交換，看你還認不認得！」', tauntHit: '「哇！交換律魔法被你看穿了！」', tauntWin: '「a×b 跟 b×a 一樣，太佩服了！」' }
  },
  { id: '4-1', stageKey: 'mul:4-1', legacyId: '4-1', realmId: 'mul', islandId: 'valley', label: '7 的山谷', mapPos: { x: 66, y: 45 }, tables: [7], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
  { id: '4-2', stageKey: 'mul:4-2', legacyId: '4-2', realmId: 'mul', islandId: 'valley', label: '8·9 攀登戰', mapPos: { x: 72, y: 39 }, tables: [8, 9], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
  {
    id: '4-3', stageKey: 'mul:4-3', legacyId: '4-3', realmId: 'mul', islandId: 'valley', label: '山谷噴火龍', mapPos: { x: 77, y: 47 }, tables: [7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'keypad', isBoss: true,
    boss: { name: '泡泡噴火龍', svgKey: 'valley', tauntStart: '「呼——！7、8、9 最容易忘記囉！」', tauntHit: '「嗚！星星光束把我泡泡打散了！」', tauntWin: '「你征服了巨龍山谷，真是不簡單！」' }
  },
  { id: '5-1', stageKey: 'mul:5-1', legacyId: '5-1', realmId: 'mul', islandId: 'castle', label: '全段混戰', mapPos: { x: 83, y: 63 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'mixed', isBoss: false },
  { id: '5-2', stageKey: 'mul:5-2', legacyId: '5-2', realmId: 'mul', islandId: 'castle', label: '神秘未知數', mapPos: { x: 89, y: 58 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['missing_b', 'missing_a'], count: 6, inputMode: 'keypad', isBoss: false },
  {
    id: '5-3', stageKey: 'mul:5-3', legacyId: '5-3', realmId: 'mul', islandId: 'castle', label: '城堡大魔王', mapPos: { x: 92, y: 46 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard', 'missing_b', 'commutative'], count: 8, inputMode: 'keypad', isBoss: true,
    boss: { name: '積木大魔王', svgKey: 'castle', tauntStart: '「歡迎來到大師城堡！接受終極試煉吧！」', tauntHit: '「可惡，居然連這題都秒殺我！」', tauntWin: '「太閃耀了！你就是九九乘法大師！」' }
  }
];

/* ---------------- 10 枚成就徽章定義 ---------------- */
export const BADGES = [
  { id: 'first_clear', icon: '🌱', name: '冒險啟程', desc: '完成第一個冒險闖關關卡' },
  { id: 'three_stars', icon: '🌟', name: '閃耀三星王', desc: '任一關卡獲得 3 顆星評價' },
  { id: 'combo_5', icon: '🔥', name: '五連擊神手', desc: '單場關卡連續答對 5 題' },
  { id: 'never_give_up', icon: '🧱', name: '不放棄勇者', desc: '用積木小幫手訂正成功累積 5 次' },
  { id: 'rescue_hero', icon: '🆘', name: '小精靈救星', desc: '完成一次求救小精靈錯題復仇戰' },
  { id: 'lab_explorer', icon: '🔍', name: '探索台好學寶寶', desc: '在探索台使用交換律或整段連播功能' },
  { id: 'island_3_boss', icon: '🦋', name: '交換律偵探', desc: '打敗魔法花園守護者 Boss' },
  { id: 'island_4_boss', icon: '🐉', name: '屠龍口訣勇者', desc: '打敗巨龍山谷噴火龍 Boss' },
  { id: 'master_castle', icon: '👑', name: '九九乘法大師', desc: '通過乘法大師城堡最終試煉' },
  { id: 'gems_81', icon: '💎', name: '81 格大滿貫', desc: '點亮全部 81 格九九乘法寶石牆' }
];

/* ---------------- 8 款小兔子頭飾／換裝解鎖定義 ---------------- */
export const BUNNY_COSTUMES = [
  {
    id: 'default',
    icon: '🌟',
    name: '經典小星星',
    unlockType: 'free',
    target: 0,
    desc: '粉紅小兔最喜歡的金閃閃星星髮飾！',
    goalText: '初始免費造型'
  },
  {
    id: 'ribbon',
    icon: '🎀',
    name: '草莓蝴蝶結',
    unlockType: 'stars',
    target: 10,
    desc: '戴上甜美點點蝴蝶結，跳躍起來超有精神！',
    goalText: '累積收集 10 顆星星'
  },
  {
    id: 'sprout',
    icon: '🌱',
    name: '森林嫩芽髮箍',
    unlockType: 'gems',
    target: 15,
    desc: '兩片會晃呀晃的翠綠小嫩芽，帶著森林元氣！',
    goalText: '點亮 15 顆九九乘法寶石'
  },
  {
    id: 'explorer',
    icon: '🧢',
    name: '探險家漁夫帽',
    unlockType: 'stars',
    target: 25,
    desc: '專為兔耳朵留洞的探險帽，出發去高難度島嶼囉！',
    goalText: '累積收集 25 顆星星'
  },
  {
    id: 'flower',
    icon: '🌸',
    name: '魔法花園花冠',
    unlockType: 'gems',
    target: 35,
    desc: '用三色幸運小花編成的花環，讓口訣像花一樣綻放！',
    goalText: '點亮 35 顆九九乘法寶石'
  },
  {
    id: 'glasses',
    icon: '🕶️',
    name: '炫酷星星墨鏡',
    unlockType: 'gems',
    target: 55,
    desc: '戴上透明星光墨鏡，再難的乘法魔王也難不倒我！',
    goalText: '點亮 55 顆九九乘法寶石'
  },
  {
    id: 'cape',
    icon: '🦸',
    name: '星光小斗篷',
    unlockType: 'stars',
    target: 45,
    desc: '在九九乘法奇幻群島收集 45 顆星！閃耀夜空的勇者披風！',
    goalText: '累積收集 45 顆星星'
  },
  {
    id: 'crown',
    icon: '👑',
    name: '81 寶石鑽石皇冠',
    unlockType: 'gems',
    target: 81,
    desc: '點亮 81 格寶石牆的終極榮譽！黃金寶石皇冠＋星輝披肩！',
    goalText: '點亮全部 81 顆九九乘法寶石'
  }
];

export const FINISHER_DEFS = {
  meteor: { id: 'meteor', title: '超級流星雨！', badge: '🌠 超級流星雨！' },
  rainbow: { id: 'rainbow', title: '彩虹光束砲！', badge: '🌈 彩虹光束砲！' },
  carrot: { id: 'carrot', title: '巨無霸胡蘿蔔砸擊！', badge: '🥕 巨蘿蔔重砸！' },
  slash: { id: 'slash', title: '星辰十字斬！', badge: '⚔️ 星辰十字斬！' }
};

export const FINISHER_KEYS = ['meteor', 'rainbow', 'carrot', 'slash'];

/* ---------------- ID 標準化與三層版圖查詢輔助 ---------------- */
export function toCanonicalStageId(stageId) {
  if (typeof stageId !== 'string' || !stageId) return '';
  return stageId.indexOf(':') !== -1 ? stageId : 'mul:' + stageId;
}

export function toLegacyStageId(stageId) {
  if (typeof stageId !== 'string' || !stageId) return '';
  return stageId.indexOf('mul:') === 0 ? stageId.slice(4) : stageId;
}

export function toCanonicalPartnerId(partnerId) {
  if (typeof partnerId !== 'string' || !partnerId) return '';
  return partnerId.indexOf(':') !== -1 ? partnerId : 'mul:' + partnerId;
}

export function toLegacyPartnerId(partnerId) {
  if (typeof partnerId !== 'string' || !partnerId) return '';
  return partnerId.indexOf('mul:') === 0 ? partnerId.slice(4) : partnerId;
}

export function getRealmById(id) {
  for (let i = 0; i < REALMS.length; i++) {
    if (REALMS[i].id === id) return REALMS[i];
  }
  return REALMS[1];
}

export function getIslandsByRealm(realmId) {
  return ISLANDS.filter((isl) => isl.realmId === realmId);
}

export function getStagesByRealm(realmId) {
  return STAGES.filter((st) => st.realmId === realmId);
}

export function getIslandById(id) {
  const canonical = toCanonicalPartnerId(id);
  for (let i = 0; i < ISLANDS.length; i++) {
    if (ISLANDS[i].id === id || ISLANDS[i].fullId === id || ISLANDS[i].fullId === canonical) {
      return ISLANDS[i];
    }
  }
  return ISLANDS[0];
}

export function getStageById(id) {
  const canonical = toCanonicalStageId(id);
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].id === id || STAGES[i].stageKey === id || STAGES[i].stageKey === canonical) {
      return STAGES[i];
    }
  }
  return null;
}

export function getCostumeById(id) {
  for (let i = 0; i < BUNNY_COSTUMES.length; i++) {
    if (BUNNY_COSTUMES[i].id === id) return BUNNY_COSTUMES[i];
  }
  return BUNNY_COSTUMES[0];
}

export function findRecommendedStageForTable(a) {
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].tables && STAGES[i].tables.indexOf(a) !== -1) return STAGES[i];
  }
  return STAGES[0];
}
