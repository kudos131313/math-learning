/**
 * ==========================================================================
 * 單元 4 子分頁 3：九九乘法冒險闖關模組（全螢幕繪本小遊戲版）
 * 支援全螢幕遊戲機台、16:9 五島世界大地圖、粉紅小兔主角跳躍尋路、
 * 繪本戰鬥劇場、彩色玩具按鍵盤、懸浮積木泡泡、81 格寶石牆與守護小精靈
 * ==========================================================================
 */
(function(){
  "use strict";

  var MathApp = window.MathApp = window.MathApp || {};

  var STORAGE_KEY = 'math_mul_quest_v1';

  /* ---------------- 5 座主題島嶼座標與守護小精靈 ---------------- */
  var ISLANDS = [
    {
      id: 'forest',
      order: 1,
      theme: 'forest',
      title: '1. 啟程森林',
      rangeText: '1·2·5 的乘法',
      signPos: { x: 14, y: 24 },
      bgImg: 'assets/quest/bg-forest.jpg',
      spriteName: '嫩芽積木寶寶',
      spriteDesc: '打敗森林守門員即可收服，喜歡數著 2 個、5 個一組的葉子！',
      bossStageId: '1-3'
    },
    {
      id: 'workshop',
      order: 2,
      theme: 'workshop',
      title: '2. 積木工坊',
      rangeText: '3·4 的乘法',
      signPos: { x: 34, y: 15 },
      bgImg: 'assets/quest/bg-workshop.jpg',
      spriteName: '方塊小工匠',
      spriteDesc: '打敗工坊機甲怪即可收服，最擅長用積木排整齊！',
      bossStageId: '2-3'
    },
    {
      id: 'garden',
      order: 3,
      theme: 'garden',
      title: '3. 魔法花園',
      rangeText: '6 ＋ 交換律',
      signPos: { x: 52, y: 29 },
      bgImg: 'assets/quest/bg-garden.jpg',
      spriteName: '雙胞胎蝴蝶精靈',
      spriteDesc: '打敗花園迷宮怪即可收服，會變出 a×b ＝ b×a 的魔法！',
      bossStageId: '3-3'
    },
    {
      id: 'valley',
      order: 4,
      theme: 'valley',
      title: '4. 巨龍山谷',
      rangeText: '7·8·9 挑戰',
      signPos: { x: 71, y: 17 },
      bgImg: 'assets/quest/bg-valley.jpg',
      spriteName: '雲朵小飛龍',
      spriteDesc: '打敗山谷噴火龍即可收服，專治最容易搞混的大口訣！',
      bossStageId: '4-3'
    },
    {
      id: 'castle',
      order: 5,
      theme: 'castle',
      title: '5. 大師城堡',
      rangeText: '全範圍 ＋ 未知數',
      signPos: { x: 89, y: 21 },
      bgImg: 'assets/quest/bg-castle.jpg',
      spriteName: '皇冠積木王',
      spriteDesc: '通過城堡最終試煉即可收服，是所有乘法小精靈的領袖！',
      bossStageId: '5-3'
    }
  ];

  /* ---------------- 15 個冒險關卡（含世界地圖精確座標） ---------------- */
  var STAGES = [
    { id: '1-1', islandId: 'forest', label: '1·2 暖身營', mapPos: { x: 24, y: 69 }, tables: [1, 2], qTypes: ['standard'], count: 5, inputMode: 'choice', isBoss: false },
    { id: '1-2', islandId: 'forest', label: '5 跳數小徑', mapPos: { x: 16, y: 61 }, tables: [5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
    {
      id: '1-3', islandId: 'forest', label: '森林守門員', mapPos: { x: 11, y: 49 }, tables: [1, 2, 5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'keypad', isBoss: true,
      boss: { name: '森林樹樁怪', svgKey: 'forest', tauntStart: '「想進積木世界？接下 1、2、5 的乘法考驗！」', tauntHit: '「哎呀！口訣好準，葉子掉下來啦！」', tauntWin: '「太強了！森林寶石交給你守護！」' }
    },
    { id: '2-1', islandId: 'workshop', label: '3 的口訣屋', mapPos: { x: 28, y: 46 }, tables: [3], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
    { id: '2-2', islandId: 'workshop', label: '4 的分組盒', mapPos: { x: 34, y: 39 }, tables: [4], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
    {
      id: '2-3', islandId: 'workshop', label: '工坊機甲怪', mapPos: { x: 40, y: 45 }, tables: [3, 4], qTypes: ['standard', 'concept'], count: 5, inputMode: 'keypad', isBoss: true,
      boss: { name: '積木發條怪', svgKey: 'workshop', tauntStart: '「喀啦喀啦！看看你懂不懂幾個幾！」', tauntHit: '「叮咚！發條鬆掉一格啦！」', tauntWin: '「運算好精準！方塊小工匠跟你走！」' }
    },
    { id: '3-1', islandId: 'garden', label: '6 的花田', mapPos: { x: 46, y: 59 }, tables: [6], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
    { id: '3-2', islandId: 'garden', label: '交換律魔法', mapPos: { x: 53, y: 54 }, tables: [2, 3, 4, 5, 6], qTypes: ['commutative'], count: 5, inputMode: 'choice', isBoss: false },
    {
      id: '3-3', islandId: 'garden', label: '花園迷宮怪', mapPos: { x: 59, y: 59 }, tables: [3, 4, 5, 6], qTypes: ['standard', 'commutative'], count: 6, inputMode: 'keypad', isBoss: true,
      boss: { name: '花瓣迷宮怪', svgKey: 'garden', tauntStart: '「我把數字左右交換，看你還認不認得！」', tauntHit: '「哇！交換律魔法被你看穿了！」', tauntWin: '「a×b 跟 b×a 一樣，太佩服了！」' }
    },
    { id: '4-1', islandId: 'valley', label: '7 的山谷', mapPos: { x: 66, y: 45 }, tables: [7], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
    { id: '4-2', islandId: 'valley', label: '8·9 攀登戰', mapPos: { x: 72, y: 39 }, tables: [8, 9], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
    {
      id: '4-3', islandId: 'valley', label: '山谷噴火龍', mapPos: { x: 77, y: 47 }, tables: [7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'keypad', isBoss: true,
      boss: { name: '泡泡噴火龍', svgKey: 'valley', tauntStart: '「呼——！7、8、9 最容易忘記囉！」', tauntHit: '「嗚！星星光束把我泡泡打散了！」', tauntWin: '「你征服了巨龍山谷，真是不簡單！」' }
    },
    { id: '5-1', islandId: 'castle', label: '全段混戰', mapPos: { x: 83, y: 63 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'mixed', isBoss: false },
    { id: '5-2', islandId: 'castle', label: '神秘未知數', mapPos: { x: 89, y: 58 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['missing_b', 'missing_a'], count: 6, inputMode: 'keypad', isBoss: false },
    {
      id: '5-3', islandId: 'castle', label: '城堡大魔王', mapPos: { x: 92, y: 46 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard', 'missing_b', 'commutative'], count: 8, inputMode: 'keypad', isBoss: true,
      boss: { name: '積木大魔王', svgKey: 'castle', tauntStart: '「歡迎來到大師城堡！接受終極試煉吧！」', tauntHit: '「可惡，居然連這題都秒殺我！」', tauntWin: '「太閃耀了！你就是九九乘法大師！」' }
    }
  ];

  /* ---------------- 10 枚成就徽章定義 ---------------- */
  var BADGES = [
    { id: 'first_clear', icon: '🌱', name: '冒險啟程', desc: '完成第一個乘法闖關關卡' },
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

  /* ---------------- 原創可愛粉紅小兔子與怪物/精靈 SVG ---------------- */
  function getPinkBunnySvg(){
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      /* 左耳與右耳 */
      '<ellipse cx="36" cy="24" rx="9" ry="20" transform="rotate(-10 36 24)" fill="#fbcfe8" stroke="#332b22" stroke-width="3.2"/>' +
      '<ellipse cx="36" cy="25" rx="4.5" ry="13" transform="rotate(-10 36 25)" fill="#f472b6"/>' +
      '<ellipse cx="64" cy="24" rx="9" ry="20" transform="rotate(10 64 24)" fill="#fbcfe8" stroke="#332b22" stroke-width="3.2"/>' +
      '<ellipse cx="64" cy="25" rx="4.5" ry="13" transform="rotate(10 64 25)" fill="#f472b6"/>' +
      /* 探險小背包邊緣 */
      '<rect x="20" y="60" width="14" height="20" rx="6" fill="#fbbf24" stroke="#332b22" stroke-width="2.8"/>' +
      /* 身體 */
      '<ellipse cx="50" cy="72" rx="22" ry="18" fill="#f9a8d4" stroke="#332b22" stroke-width="3.2"/>' +
      '<ellipse cx="50" cy="74" rx="13" ry="11" fill="#fff1f2"/>' +
      /* 頭部 */
      '<ellipse cx="50" cy="48" rx="25" ry="20" fill="#fbcfe8" stroke="#332b22" stroke-width="3.2"/>' +
      /* 頭頂小星星裝飾 */
      '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#fde047" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
      /* 亮晶晶眼睛與粉腮 */
      '<circle cx="40" cy="48" r="4" fill="#332b22"/><circle cx="38.8" cy="46.6" r="1.4" fill="#ffffff"/>' +
      '<circle cx="60" cy="48" r="4" fill="#332b22"/><circle cx="58.8" cy="46.6" r="1.4" fill="#ffffff"/>' +
      '<ellipse cx="33" cy="54" rx="4.5" ry="2.6" fill="#f472b6" opacity="0.65"/>' +
      '<ellipse cx="67" cy="54" rx="4.5" ry="2.6" fill="#f472b6" opacity="0.65"/>' +
      /* 鼻與微笑 */
      '<ellipse cx="50" cy="52" rx="3" ry="2" fill="#e11d48"/>' +
      '<path d="M44 56 Q50 61 56 56" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round"/>' +
      /* 小腳丫 */
      '<ellipse cx="39" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
      '<ellipse cx="61" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
    '</svg>';
  }

  function getStageChestSvg(theme){
    var colors = {
      forest: ['#86efac', '#22c55e'],
      workshop: ['#fde047', '#f59e0b'],
      garden: ['#fbcfe8', '#ec4899'],
      valley: ['#bae6fd', '#3b82f6'],
      castle: ['#ddd6fe', '#8b5cf6']
    };
    var pal = colors[theme] || colors.forest;
    return '<svg viewBox="0 0 90 90">' +
      '<rect x="15" y="34" width="60" height="40" rx="12" fill="' + pal[0] + '" stroke="#332b22" stroke-width="3.2"/>' +
      '<path d="M15 44 Q45 36 75 44" fill="none" stroke="#332b22" stroke-width="3"/>' +
      '<rect x="38" y="38" width="14" height="14" rx="4" fill="#fde047" stroke="#332b22" stroke-width="2.5"/>' +
      '<circle cx="30" cy="58" r="3.5" fill="#332b22"/><circle cx="60" cy="58" r="3.5" fill="#332b22"/>' +
      '<path d="M39 62 Q45 67 51 62" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round"/>' +
      '<polygon points="45,14 48,22 56,22 50,27 52,34 45,29 38,34 40,27 34,22 42,22" fill="#fde047" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
    '</svg>';
  }

  function getCharacterSvg(key, isBoss){
    if(isBoss){
      var bossMap = {
        forest: '<svg viewBox="0 0 80 80"><rect x="16" y="24" width="48" height="44" rx="14" fill="#86efac" stroke="#332b22" stroke-width="3"/><circle cx="28" cy="18" r="10" fill="#4ade80" stroke="#332b22" stroke-width="3"/><circle cx="52" cy="18" r="10" fill="#4ade80" stroke="#332b22" stroke-width="3"/><circle cx="31" cy="43" r="4.5" fill="#332b22"/><circle cx="49" cy="43" r="4.5" fill="#332b22"/><path d="M31 54 Q40 49 49 54" fill="none" stroke="#332b22" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="49" r="4" fill="#fda4af" opacity="0.8"/><circle cx="56" cy="49" r="4" fill="#fda4af" opacity="0.8"/></svg>',
        workshop: '<svg viewBox="0 0 80 80"><rect x="14" y="22" width="52" height="46" rx="10" fill="#fcd34d" stroke="#332b22" stroke-width="3"/><line x1="40" y1="8" x2="40" y2="22" stroke="#332b22" stroke-width="3"/><circle cx="40" cy="8" r="5" fill="#ef4444" stroke="#332b22" stroke-width="2.5"/><rect x="24" y="34" width="12" height="10" rx="3" fill="#fff" stroke="#332b22" stroke-width="2.5"/><rect x="44" y="34" width="12" height="10" rx="3" fill="#fff" stroke="#332b22" stroke-width="2.5"/><circle cx="30" cy="39" r="2.5" fill="#332b22"/><circle cx="50" cy="39" r="2.5" fill="#332b22"/><rect x="28" y="52" width="24" height="8" rx="3" fill="#fff" stroke="#332b22" stroke-width="2.5"/></svg>',
        garden: '<svg viewBox="0 0 80 80"><circle cx="40" cy="44" r="22" fill="#f9a8d4" stroke="#332b22" stroke-width="3"/><circle cx="22" cy="24" r="10" fill="#f472b6" stroke="#332b22" stroke-width="3"/><circle cx="58" cy="24" r="10" fill="#f472b6" stroke="#332b22" stroke-width="3"/><circle cx="40" cy="18" r="10" fill="#fb7185" stroke="#332b22" stroke-width="3"/><circle cx="33" cy="42" r="4" fill="#332b22"/><circle cx="47" cy="42" r="4" fill="#332b22"/><path d="M33 52 Q40 58 47 52" fill="none" stroke="#332b22" stroke-width="3" stroke-linecap="round"/></svg>',
        valley: '<svg viewBox="0 0 80 80"><path d="M18 58 Q14 26 40 20 Q66 26 62 58 Z" fill="#60a5fa" stroke="#332b22" stroke-width="3"/><polygon points="26,23 20,10 34,19" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/><polygon points="54,23 60,10 46,19" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/><circle cx="32" cy="38" r="4.5" fill="#332b22"/><circle cx="48" cy="38" r="4.5" fill="#332b22"/><ellipse cx="40" cy="52" rx="14" ry="8" fill="#dbeafe" stroke="#332b22" stroke-width="2.5"/></svg>',
        castle: '<svg viewBox="0 0 80 80"><polygon points="20,24 28,10 40,20 52,10 60,24" fill="#fbbf24" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="24" width="48" height="44" rx="14" fill="#a78bfa" stroke="#332b22" stroke-width="3"/><circle cx="31" cy="43" r="4.5" fill="#332b22"/><circle cx="49" cy="43" r="4.5" fill="#332b22"/><path d="M31 55 L36 51 L40 55 L44 51 L49 55" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      };
      return bossMap[key] || bossMap.forest;
    }

    var spriteMap = {
      forest: '<svg viewBox="0 0 64 64"><rect x="14" y="22" width="36" height="32" rx="11" fill="#bbf7d0" stroke="#332b22" stroke-width="2.6"/><path d="M32 22 C28 10 18 10 20 18 C22 22 32 22 32 22 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.2"/><path d="M32 22 C36 10 46 10 44 18 C42 22 32 22 32 22 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2"/><circle cx="25" cy="36" r="3" fill="#332b22"/><circle cx="39" cy="36" r="3" fill="#332b22"/><path d="M27 43 Q32 47 37 43" fill="none" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/></svg>',
      workshop: '<svg viewBox="0 0 64 64"><rect x="15" y="18" width="34" height="34" rx="8" fill="#fde047" stroke="#332b22" stroke-width="2.6"/><rect x="22" y="12" width="20" height="8" rx="4" fill="#fb923c" stroke="#332b22" stroke-width="2.4"/><circle cx="26" cy="33" r="3" fill="#332b22"/><circle cx="38" cy="33" r="3" fill="#332b22"/><path d="M26 42 Q32 46 38 42" fill="none" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/></svg>',
      garden: '<svg viewBox="0 0 64 64"><ellipse cx="20" cy="32" rx="11" ry="14" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4"/><ellipse cx="44" cy="32" rx="11" ry="14" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4"/><rect x="24" y="20" width="16" height="28" rx="8" fill="#f472b6" stroke="#332b22" stroke-width="2.5"/><circle cx="29" cy="31" r="2.5" fill="#332b22"/><circle cx="35" cy="31" r="2.5" fill="#332b22"/><path d="M29 38 Q32 41 35 38" fill="none" stroke="#332b22" stroke-width="2.2" stroke-linecap="round"/></svg>',
      valley: '<svg viewBox="0 0 64 64"><circle cx="22" cy="40" r="10" fill="#bae6fd" stroke="#332b22" stroke-width="2.4"/><circle cx="42" cy="40" r="10" fill="#bae6fd" stroke="#332b22" stroke-width="2.4"/><circle cx="32" cy="32" r="16" fill="#e0f2fe" stroke="#332b22" stroke-width="2.6"/><circle cx="27" cy="31" r="2.8" fill="#332b22"/><circle cx="37" cy="31" r="2.8" fill="#332b22"/><path d="M28 38 Q32 42 36 38" fill="none" stroke="#332b22" stroke-width="2.3" stroke-linecap="round"/></svg>',
      castle: '<svg viewBox="0 0 64 64"><polygon points="20,20 26,10 32,18 38,10 44,20" fill="#fbbf24" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/><rect x="16" y="20" width="32" height="32" rx="10" fill="#c4b5fd" stroke="#332b22" stroke-width="2.6"/><circle cx="26" cy="34" r="3" fill="#332b22"/><circle cx="38" cy="34" r="3" fill="#332b22"/><path d="M27 42 Q32 46 37 42" fill="none" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/></svg>'
    };
    return spriteMap[key] || spriteMap.forest;
  }

  /* ---------------- 存檔管理 ---------------- */
  function createDefaultSave(){
    return {
      version: 1,
      previewAll: false,
      stageStars: {},
      gems: {},
      rescueQueue: [],
      badges: {},
      stats: {
        totalCorrect: 0,
        selfHealed: 0,
        maxCombo: 0,
        rescuedCount: 0,
        exploredInLab: false
      }
    };
  }

  function loadSave(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return createDefaultSave();
      var parsed = JSON.parse(raw);
      var def = createDefaultSave();
      return {
        version: 1,
        previewAll: Boolean(parsed.previewAll),
        stageStars: parsed.stageStars || {},
        gems: parsed.gems || {},
        rescueQueue: Array.isArray(parsed.rescueQueue) ? parsed.rescueQueue : [],
        badges: parsed.badges || {},
        stats: Object.assign({}, def.stats, parsed.stats || {})
      };
    } catch(e){
      return createDefaultSave();
    }
  }

  function persistSave(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch(e){}
  }

  var saveData = loadSave();

  /* ---------------- 狀態機 ---------------- */
  var session = {
    arcadeOpen: false,
    active: false,
    isRescueMode: false,
    isMovingOnMap: false,
    stage: null,
    questions: [],
    idx: 0,
    combo: 0,
    maxCombo: 0,
    firstTryCorrect: 0,
    hadWrongOnCurrent: false,
    usedHelperOnCurrent: false,
    usedHelperInStage: false,
    newGemsThisRun: [],
    locked: false,
    enemyHp: 0,
    enemyMaxHp: 0,
    activeInput: null
  };

  var els = {};
  var motionReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bunnyIdleTween = null;

  function initGsapMedia(){
    if(typeof window.gsap === 'undefined') return;
    if(window.gsap.matchMedia){
      var mm = window.gsap.matchMedia();
      mm.add({ reduce: '(prefers-reduced-motion: reduce)' }, function(ctx){
        motionReduced = Boolean(ctx.conditions.reduce);
      });
    }
  }

  function runAnim(fn){
    if(typeof window.gsap === 'undefined' || motionReduced) return;
    try { fn(window.gsap); } catch(e){}
  }

  /* ---------------- 查詢輔助 ---------------- */
  function getIslandById(id){
    for(var i = 0; i < ISLANDS.length; i++){
      if(ISLANDS[i].id === id) return ISLANDS[i];
    }
    return ISLANDS[0];
  }

  function getStageById(id){
    for(var i = 0; i < STAGES.length; i++){
      if(STAGES[i].id === id) return STAGES[i];
    }
    return null;
  }

  function isStageUnlocked(stageId){
    if(saveData.previewAll) return true;
    for(var i = 0; i < STAGES.length; i++){
      if(STAGES[i].id === stageId){
        if(i === 0) return true;
        return Number(saveData.stageStars[STAGES[i - 1].id] || 0) >= 1;
      }
    }
    return false;
  }

  function getNextPlayableStageId(){
    for(var i = 0; i < STAGES.length; i++){
      if(!saveData.stageStars[STAGES[i].id]) return STAGES[i].id;
    }
    return STAGES[STAGES.length - 1].id;
  }

  function countTotalStars(){
    var total = 0;
    STAGES.forEach(function(s){ total += Number(saveData.stageStars[s.id] || 0); });
    return total;
  }

  function countLitGems(){
    return Object.keys(saveData.gems).filter(function(k){ return saveData.gems[k]; }).length;
  }

  function countUnlockedSprites(){
    var cnt = 0;
    ISLANDS.forEach(function(isl){
      if(Number(saveData.stageStars[isl.bossStageId] || 0) >= 1) cnt++;
    });
    return cnt;
  }

  function checkAndUnlockBadges(){
    var newlyUnlocked = [];
    function grant(id){
      if(!saveData.badges[id]){
        saveData.badges[id] = true;
        for(var i = 0; i < BADGES.length; i++){
          if(BADGES[i].id === id) newlyUnlocked.push(BADGES[i]);
        }
      }
    }

    if(countTotalStars() >= 1) grant('first_clear');
    if(STAGES.some(function(s){ return Number(saveData.stageStars[s.id] || 0) === 3; })) grant('three_stars');
    if(saveData.stats.maxCombo >= 5) grant('combo_5');
    if(saveData.stats.selfHealed >= 5) grant('never_give_up');
    if(saveData.stats.rescuedCount >= 1) grant('rescue_hero');
    if(saveData.stats.exploredInLab) grant('lab_explorer');
    if(Number(saveData.stageStars['3-3'] || 0) >= 1) grant('island_3_boss');
    if(Number(saveData.stageStars['4-3'] || 0) >= 1) grant('island_4_boss');
    if(Number(saveData.stageStars['5-3'] || 0) >= 1) grant('master_castle');
    if(countLitGems() >= 81) grant('gems_81');
    return newlyUnlocked;
  }

  /* ---------------- 題庫生成 ---------------- */
  function shuffleArr(arr){
    for(var i = arr.length - 1; i > 0; i--){
      var j = MathApp.utils.randInt(0, i);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildStageQuestions(stage){
    var poolPairs = [];
    stage.tables.forEach(function(a){
      for(var b = 1; b <= 9; b++) poolPairs.push({ a: a, b: b });
    });
    shuffleArr(poolPairs);

    var selected = [];
    for(var i = 0; i < stage.count; i++){
      var pair = poolPairs[i % poolPairs.length];
      var qType = stage.qTypes[i % stage.qTypes.length];
      var mode = stage.inputMode;
      if(mode === 'mixed') mode = (i < Math.ceil(stage.count / 2)) ? 'choice' : 'keypad';

      var effectiveType = (qType === 'story_choice' || (mode === 'choice' && qType === 'concept')) ? 'standard' : qType;
      var q = MathApp.mulQuiz.buildQuestion(pair.a, pair.b, effectiveType);

      if(qType === 'story_choice' && effectiveType === 'standard'){
        var icons = ['🍎', '🍪', '✏️', '🌟', '🎈'];
        var units = ['盤', '袋', '盒', '排', '串'];
        var idx = MathApp.utils.randInt(0, icons.length - 1);
        var bVal = Math.max(2, Math.min(7, pair.b));
        if(bVal !== pair.b) q = MathApp.mulQuiz.buildQuestion(pair.a, bVal, 'standard');
        q.badge = '情境乘法冒險';
        q.storyHtml = icons[idx] + ' 每' + units[idx] + '有 <b>' + q.a + '</b> 個，共有 <b>' + q.b + '</b> ' + units[idx] + '，合起來有幾個？';
      }
      q.uiMode = mode;
      selected.push(q);
    }
    return selected;
  }

  function buildRescueQuestions(){
    return saveData.rescueQueue.slice(0, 6).map(function(k){
      var parts = k.split('x');
      var q = MathApp.mulQuiz.buildQuestion(Number(parts[0]) || 3, Number(parts[1]) || 4, 'standard');
      q.uiMode = 'keypad';
      q.badge = '🆘 求救小精靈特訓';
      q.rescueKey = k;
      return q;
    });
  }

  /* ---------------- DOM 快取 ---------------- */
  function cacheDom(){
    els.launcherBunny  = document.getElementById('mqst-launcher-bunny');
    els.launchStars    = document.getElementById('mqst-launch-stars');
    els.launchGems     = document.getElementById('mqst-launch-gems');
    els.launchSprites  = document.getElementById('mqst-launch-sprites');
    els.enterArcadeBtn = document.getElementById('mqst-enter-arcade-btn');
    els.arcadeOverlay  = document.getElementById('mqst-arcade-overlay');
    els.exitArcadeBtn  = document.getElementById('mqst-exit-arcade-btn');
    els.battleExitBtn  = document.getElementById('mqst-battle-exit-btn');

    els.hudAvatar      = document.getElementById('mqst-hud-avatar');
    els.totalStars     = document.getElementById('mqst-total-stars');
    els.gemCount       = document.getElementById('mqst-gem-count');
    els.spriteCount    = document.getElementById('mqst-sprite-count');
    els.rescueBtn      = document.getElementById('mqst-rescue-btn');
    els.rescueCount    = document.getElementById('mqst-rescue-count');
    els.openDexBtn     = document.getElementById('mqst-open-dex-btn');
    els.openParentBtn  = document.getElementById('mqst-open-parent-btn');

    els.mapView        = document.getElementById('mqst-map-view');
    els.previewBadge   = document.getElementById('mqst-preview-badge');
    els.worldViewport  = document.getElementById('mqst-world-viewport');
    els.worldCanvas    = document.getElementById('mqst-world-canvas');
    els.pathSvg        = document.getElementById('mqst-path-svg');
    els.islandSigns    = document.getElementById('mqst-island-signs');
    els.islandsGrid    = document.getElementById('mqst-islands-grid');
    els.bunnyAvatar    = document.getElementById('mqst-bunny-avatar');

    els.battleView     = document.getElementById('mqst-battle-view');
    els.backMapBtn     = document.getElementById('mqst-back-map-btn');
    els.stageChip      = document.getElementById('mqst-stage-chip');
    els.qProgressText  = document.getElementById('mqst-q-progress-text');
    els.comboPill      = document.getElementById('mqst-combo-pill');
    els.comboCount     = document.getElementById('mqst-combo-count');
    els.progressFill   = document.getElementById('mqst-progress-fill');

    els.stageArena     = document.getElementById('mqst-stage-arena');
    els.stageBgImg     = document.getElementById('mqst-stage-bg-img');
    els.heroActor      = document.getElementById('mqst-hero-actor');
    els.heroAura       = document.getElementById('mqst-hero-aura');
    els.heroSvg        = document.getElementById('mqst-hero-svg');
    els.projectile     = document.getElementById('mqst-projectile');
    els.enemyActor     = document.getElementById('mqst-enemy-actor');
    els.bossSvg        = document.getElementById('mqst-boss-svg');
    els.bossName       = document.getElementById('mqst-boss-name');
    els.bossHpBar      = document.getElementById('mqst-boss-hp-bar');
    els.bossTaunt      = document.getElementById('mqst-boss-taunt');
    els.hitCallout     = document.getElementById('mqst-hit-callout');

    els.typeBadge      = document.getElementById('mqst-type-badge');
    els.promptText     = document.getElementById('mqst-prompt-text');
    els.speakBtn       = document.getElementById('mqst-speak-btn');
    els.questionStage  = document.getElementById('mqst-question-stage');
    els.storyBanner    = document.getElementById('mqst-story-banner');
    els.equationRow    = document.getElementById('mqst-equation-row');
    els.choicesGrid    = document.getElementById('mqst-choices-grid');
    els.keypadWrap     = document.getElementById('mqst-keypad-wrap');
    els.toyKeysGrid    = document.getElementById('mqst-toy-keys-grid');
    els.nextDock       = document.getElementById('mqst-next-dock');
    els.helperToggleBtn= document.getElementById('mqst-helper-toggle-btn');
    els.helperCloseBtn = document.getElementById('mqst-helper-close-btn');
    els.nextBtn        = document.getElementById('mqst-next-btn');
    els.helperDrawer   = document.getElementById('mqst-helper-drawer');
    els.helperStage    = document.getElementById('mqst-helper-blocks-stage');
    els.feedback       = document.getElementById('mqst-feedback');
    els.explanationBox = document.getElementById('mqst-explanation-box');

    els.resultView     = document.getElementById('mqst-result-view');
    els.resultCard     = document.getElementById('mqst-result-card');
    els.victoryBunny   = document.getElementById('mqst-victory-bunny');
    els.victorySprite  = document.getElementById('mqst-victory-sprite');
    els.resultStars    = document.getElementById('mqst-result-stars');
    els.resultTitle    = document.getElementById('mqst-result-title');
    els.resultSub      = document.getElementById('mqst-result-sub');
    els.unlockShowcase = document.getElementById('mqst-unlock-showcase');
    els.resFirstAcc    = document.getElementById('mqst-res-first-acc');
    els.resNewGems     = document.getElementById('mqst-res-new-gems');
    els.resMaxCombo    = document.getElementById('mqst-res-max-combo');
    els.resNextBtn     = document.getElementById('mqst-res-next-btn');
    els.resRetryBtn    = document.getElementById('mqst-res-retry-btn');
    els.resMapBtn      = document.getElementById('mqst-res-map-btn');

    els.dexDialog      = document.getElementById('mqst-dex-dialog');
    els.paneGems       = document.getElementById('mqst-pane-gems');
    els.paneSprites    = document.getElementById('mqst-pane-sprites');
    els.paneBadges     = document.getElementById('mqst-pane-badges');

    els.parentDialog   = document.getElementById('mqst-parent-dialog');
    els.previewToggle  = document.getElementById('mqst-preview-toggle-btn');
    els.parentLockBox  = document.getElementById('mqst-parent-lock-box');
    els.parentLockQ    = document.getElementById('mqst-parent-lock-q');
    els.parentLockIn   = document.getElementById('mqst-parent-lock-input');
    els.parentUnlockBtn= document.getElementById('mqst-parent-unlock-btn');
    els.resetConfirmRow= document.getElementById('mqst-reset-confirm-row');
    els.resetAllBtn    = document.getElementById('mqst-reset-all-btn');
  }

  /* ---------------- 全螢幕開關與統計更新 ---------------- */
  function openArcade(){
    if(!els.arcadeOverlay) return;
    session.arcadeOpen = true;
    els.arcadeOverlay.classList.add('is-open');
    els.arcadeOverlay.setAttribute('aria-hidden', 'false');
    showView('map');
  }

  function closeArcade(){
    if(!els.arcadeOverlay) return;
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    session.arcadeOpen = false;
    session.active = false;
    els.arcadeOverlay.classList.remove('is-open');
    els.arcadeOverlay.setAttribute('aria-hidden', 'true');
    updateHubStats();
  }

  function updateHubStats(){
    var stars = countTotalStars();
    var gems = countLitGems();
    var sprites = countUnlockedSprites();

    if(els.totalStars)    els.totalStars.textContent    = String(stars);
    if(els.gemCount)      els.gemCount.textContent      = String(gems);
    if(els.spriteCount)   els.spriteCount.textContent   = String(sprites);
    if(els.launchStars)   els.launchStars.textContent   = String(stars);
    if(els.launchGems)    els.launchGems.textContent    = String(gems);
    if(els.launchSprites) els.launchSprites.textContent = String(sprites);

    var rLen = saveData.rescueQueue.length;
    if(els.rescueCount) els.rescueCount.textContent = String(rLen);
    if(els.rescueBtn){
      els.rescueBtn.classList.toggle('has-rescue', rLen > 0);
      els.rescueBtn.disabled = (rLen === 0);
    }
    if(els.previewBadge){
      els.previewBadge.style.display = saveData.previewAll ? 'inline-flex' : 'none';
    }
  }

  function formatStarsStr(n){
    var s = '';
    for(var i = 1; i <= 3; i++) s += (i <= n) ? '⭐' : '☆';
    return s;
  }

  /* ---------------- 全景世界大地圖與粉紅小兔渲染 ---------------- */
  function renderMap(){
    updateHubStats();
    if(!els.islandsGrid) return;

    var nextPlayableId = getNextPlayableStageId();

    // 1. SVG 冒險虛線小徑 (viewBox 1000 x 562.5)
    if(els.pathSvg){
      var pathHtml = '';
      for(var p = 0; p < STAGES.length - 1; p++){
        var s1 = STAGES[p];
        var s2 = STAGES[p + 1];
        var x1 = (s1.mapPos.x / 100) * 1000;
        var y1 = (s1.mapPos.y / 100) * 562.5;
        var x2 = (s2.mapPos.x / 100) * 1000;
        var y2 = (s2.mapPos.y / 100) * 562.5;
        var cleared = Number(saveData.stageStars[s1.id] || 0) >= 1;
        pathHtml += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' +
          'stroke="' + (cleared ? '#f59e0b' : 'rgba(255,255,255,0.88)') + '" ' +
          'stroke-width="6" stroke-linecap="round" ' +
          (cleared ? '' : 'stroke-dasharray="10 10"') + '/>';
      }
      els.pathSvg.innerHTML = pathHtml;
    }

    // 2. 島嶼木牌名稱
    if(els.islandSigns){
      var signHtml = '';
      ISLANDS.forEach(function(isl){
        var got = Number(saveData.stageStars[isl.bossStageId] || 0) >= 1;
        signHtml += '<div class="mqst-island-sign" style="left:' + isl.signPos.x + '%;top:' + isl.signPos.y + '%;">' +
          isl.title + ' · ' + isl.rangeText + (got ? ' 🐣' : '') +
          '</div>';
      });
      els.islandSigns.innerHTML = signHtml;
    }

    // 3. 15 個關卡石頭／糖果節點
    var nodeHtml = '';
    var focusStage = STAGES[0];
    STAGES.forEach(function(st){
      var unlocked = isStageUnlocked(st.id);
      var stars = Number(saveData.stageStars[st.id] || 0);
      var isCurrent = unlocked && (st.id === nextPlayableId);
      if(isCurrent) focusStage = st;

      var cls = 'mqst-map-node';
      if(st.isBoss) cls += ' is-boss';
      if(!unlocked) cls += ' is-locked';
      else if(isCurrent) cls += ' is-current';
      else if(stars > 0) cls += ' is-cleared';

      nodeHtml += '<button type="button" class="' + cls + '" data-stage-id="' + st.id + '"' +
        ' style="left:' + st.mapPos.x + '%;top:' + st.mapPos.y + '%;"' +
        (unlocked ? '' : ' disabled') +
        ' aria-label="' + st.id + ' ' + st.label + '">' +
        '<span class="mqst-map-node-id">' + (st.isBoss ? '👑' : '') + st.id + '</span>' +
        '<span class="mqst-map-node-stars">' + (unlocked ? formatStarsStr(stars) : '🔒') + '</span>' +
        '<span class="mqst-map-node-title">' + st.label + '</span>' +
        '</button>';
    });
    els.islandsGrid.innerHTML = nodeHtml;

    // 4. 放置粉紅小兔子在目前進度關卡上
    if(els.bunnyAvatar){
      els.bunnyAvatar.style.left = focusStage.mapPos.x + '%';
      els.bunnyAvatar.style.top  = focusStage.mapPos.y + '%';
      if(bunnyIdleTween){ bunnyIdleTween.kill(); bunnyIdleTween = null; }
      runAnim(function(gsap){
        bunnyIdleTween = gsap.to(els.bunnyAvatar, {
          y: -8, duration: 0.7, repeat: -1, yoyo: true, ease: 'sine.inOut'
        });
      });
    }

    // 直向/小螢幕自動捲動將小兔子置中
    if(els.worldViewport && els.worldCanvas){
      requestAnimationFrame(function(){
        var cw = els.worldCanvas.offsetWidth;
        var vw = els.worldViewport.clientWidth;
        if(cw > vw){
          var targetScroll = (focusStage.mapPos.x / 100) * cw - (vw / 2);
          els.worldViewport.scrollLeft = Math.max(0, targetScroll);
        }
      });
    }
  }

  /* ---------------- 視圖切換 ---------------- */
  function showView(viewName){
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(els.mapView)    els.mapView.style.display    = (viewName === 'map') ? 'flex' : 'none';
    if(els.battleView) els.battleView.style.display = (viewName === 'battle') ? 'flex' : 'none';
    if(els.resultView) els.resultView.style.display = (viewName === 'result') ? 'flex' : 'none';

    if(viewName === 'map'){
      session.active = false;
      session.isMovingOnMap = false;
      renderMap();
    }
  }

  /* ---------------- 小兔子跳向關卡後開戰 ---------------- */
  function walkBunnyAndStart(stageId){
    if(session.isMovingOnMap) return;
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(stageId)) return;

    if(typeof window.gsap === 'undefined' || motionReduced || !els.bunnyAvatar){
      startStage(stageId);
      return;
    }

    session.isMovingOnMap = true;
    if(bunnyIdleTween){ bunnyIdleTween.kill(); bunnyIdleTween = null; }
    if(MathApp.sfx) MathApp.sfx('pop');

    var tl = window.gsap.timeline({
      onComplete: function(){
        session.isMovingOnMap = false;
        startStage(stageId);
      }
    });
    tl.to(els.bunnyAvatar, {
      left: st.mapPos.x + '%',
      top: st.mapPos.y + '%',
      duration: 0.48,
      ease: 'power2.inOut'
    }).to(els.bunnyAvatar, {
      y: -18,
      scale: 1.15,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: 'power1.out'
    });
  }

  /* ---------------- 開始關卡或求救復仇戰 ---------------- */
  function startStage(stageId){
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(stageId)) return;

    session.active = true;
    session.isRescueMode = false;
    session.stage = st;
    session.questions = buildStageQuestions(st);
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;

    var isl = getIslandById(st.islandId);
    beginBattleUI(st.id + ' · ' + st.label, isl.bgImg, st.islandId, st.isBoss ? st.boss : null);
  }

  function startRescueBattle(){
    if(saveData.rescueQueue.length === 0) return;
    session.active = true;
    session.isRescueMode = true;
    session.stage = null;
    session.questions = buildRescueQuestions();
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;

    beginBattleUI('🆘 求救小精靈特訓', 'assets/quest/bg-garden.jpg', 'garden', null);
  }

  function beginBattleUI(chipTitle, bgSrc, theme, bossObj){
    showView('battle');
    if(els.stageChip) els.stageChip.textContent = chipTitle;
    if(els.stageBgImg) els.stageBgImg.src = bgSrc;
    if(els.stageArena) els.stageArena.setAttribute('data-theme', theme);

    if(bossObj){
      if(els.bossName)  els.bossName.textContent  = bossObj.name;
      if(els.bossSvg)   els.bossSvg.innerHTML     = getCharacterSvg(bossObj.svgKey, true);
      if(els.bossTaunt) els.bossTaunt.textContent = bossObj.tauntStart;
    } else {
      if(els.bossName)  els.bossName.textContent  = session.isRescueMode ? '迷路小精靈籠子' : '關卡寶箱怪';
      if(els.bossSvg)   els.bossSvg.innerHTML     = getStageChestSvg(theme);
      if(els.bossTaunt) els.bossTaunt.textContent = session.isRescueMode ? '「快用正確口訣打開魔法鎖！」' : '「答對全部題目就能打開大寶箱！」';
    }

    renderEnemyHp();
    updateComboUI();
    renderCurrentQuestion();
  }

  function renderEnemyHp(){
    if(!els.bossHpBar) return;
    var html = '';
    for(var i = 0; i < session.enemyMaxHp; i++){
      var lost = (i >= session.enemyHp) ? ' lost' : '';
      html += '<span class="mqst-hp-pip' + lost + '"></span>';
    }
    els.bossHpBar.innerHTML = html;
  }

  function updateComboUI(){
    if(els.comboCount) els.comboCount.textContent = String(session.combo);
    if(els.comboPill) els.comboPill.classList.toggle('fever', session.combo >= 3);
    if(els.heroAura)  els.heroAura.classList.toggle('active', session.combo >= 3);
  }

  /* ---------------- 渲染單題與控制台切換 ---------------- */
  function setActiveInput(inp){
    var allInputs = els.equationRow ? els.equationRow.querySelectorAll('.mq-input-slot') : [];
    for(var i = 0; i < allInputs.length; i++){
      allInputs[i].classList.remove('active-input');
    }
    session.activeInput = inp;
    if(inp) inp.classList.add('active-input');
  }

  function renderCurrentQuestion(){
    var q = session.questions[session.idx];
    var total = session.questions.length;
    session.locked = false;
    session.hadWrongOnCurrent = false;
    session.usedHelperOnCurrent = false;

    if(els.qProgressText) els.qProgressText.textContent = (session.idx + 1) + ' / ' + total;
    if(els.progressFill)  els.progressFill.style.width = Math.round((session.idx / total) * 100) + '%';

    if(els.typeBadge)  els.typeBadge.textContent  = q.badge;
    if(els.promptText) els.promptText.textContent = q.hint;

    if(els.feedback){
      els.feedback.textContent = '';
      els.feedback.className = 'mqst-stage-toast';
    }
    if(els.helperDrawer){
      els.helperDrawer.classList.remove('open');
    }
    if(els.nextDock){
      els.nextDock.style.display = 'none';
    }

    if(q.storyHtml){
      els.storyBanner.style.display = 'block';
      els.storyBanner.innerHTML = q.storyHtml;
    } else {
      els.storyBanner.style.display = 'none';
      els.storyBanner.innerHTML = '';
    }

    var eqHtml = '';
    if(q.uiMode === 'choice'){
      if(q.qType === 'missing_b'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="background:#fef9c3;">？</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'missing_a'){
        eqHtml = '<span class="mq-num-box" style="background:#fef9c3;">？</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else {
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box" style="background:#fef9c3;">？</span>';
      }
      els.equationRow.innerHTML = eqHtml;

      els.choicesGrid.style.display = 'grid';
      els.keypadWrap.style.display  = 'none';

      var choices = MathApp.mulQuiz.generateChoices(q, 4);
      var cHtml = '';
      choices.forEach(function(val){
        cHtml += '<button type="button" class="mqst-choice-bubble" data-choice="' + val + '">' + val + '</button>';
      });
      els.choicesGrid.innerHTML = cHtml;

      runAnim(function(gsap){
        var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
        gsap.fromTo(bubbles, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.04, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility' });
      });
    } else {
      if(q.qType === 'missing_b'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知乘數" placeholder="?"><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'missing_a'){
        eqHtml = '<input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入未知被乘數" placeholder="?"><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><span class="mq-num-box">' + q.product + '</span>';
      } else if(q.qType === 'concept'){
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="slot_b" maxlength="1" inputmode="none" readonly aria-label="輸入共有幾組" placeholder="?"><span>＝</span><input type="text" class="mq-input-slot" data-slot-id="slot_p" maxlength="2" inputmode="none" readonly aria-label="輸入總數乘積" placeholder="?">';
      } else {
        eqHtml = '<span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>＝</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="2" inputmode="none" readonly aria-label="輸入乘積答案" placeholder="?">';
      }
      els.equationRow.innerHTML = eqHtml;

      els.choicesGrid.style.display = 'none';
      els.keypadWrap.style.display  = 'block';

      var inputs = els.equationRow.querySelectorAll('.mq-input-slot');
      for(var k = 0; k < inputs.length; k++){
        (function(inp){
          inp.addEventListener('click', function(){
            if(session.locked) return;
            if(MathApp.sfx) MathApp.sfx('click');
            setActiveInput(inp);
          });
        })(inputs[k]);
      }
      if(inputs.length > 0) setActiveInput(inputs[0]);
    }

    if(els.helperStage && MathApp.mulQuiz.buildHelperBlocksHtml){
      els.helperStage.innerHTML = MathApp.mulQuiz.buildHelperBlocksHtml(q);
    }

    if(MathApp.refreshIcons) MathApp.refreshIcons();

    runAnim(function(gsap){
      gsap.fromTo(els.questionStage, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
    });

    if(MathApp.speak){
      MathApp.speak(q.spokenPrompt);
    }
  }

  /* ---------------- 粉紅小兔攻擊演出 & 答對/答錯 ---------------- */
  function playBunnyAttackAnim(isCombo){
    runAnim(function(gsap){
      var tl = gsap.timeline();
      if(els.heroActor){
        tl.to(els.heroActor, { y: -18, duration: 0.14, ease: 'power1.out' })
          .to(els.heroActor, { y: 0, duration: 0.18, ease: 'bounce.out', clearProps: 'transform' });
      }
      if(els.projectile){
        tl.fromTo(els.projectile,
          { autoAlpha: 1, x: 0, y: 0, scale: 0.8, rotation: 0 },
          { autoAlpha: 0, x: 260, y: -30, scale: 1.5, rotation: 360, duration: 0.34, ease: 'power2.in' },
          0.05
        );
      }
      if(els.enemyActor){
        tl.to(els.enemyActor, { scaleX: 1.14, scaleY: 0.86, x: 10, duration: 0.09 }, 0.3)
          .to(els.enemyActor, { scaleX: 1, scaleY: 1, x: 0, duration: 0.3, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
      }
      if(els.hitCallout){
        els.hitCallout.textContent = isCombo ? ('COMBO ×' + session.combo + ' 🔥') : 'GREAT! ✨';
        tl.fromTo(els.hitCallout,
          { autoAlpha: 1, y: 10, scale: 0.6 },
          { autoAlpha: 0, y: -28, scale: 1.15, duration: 0.7, ease: 'back.out(1.6)' },
          0.28
        );
      }
    });
  }

  function handleCorrect(q){
    session.locked = true;
    session.combo++;
    if(session.combo > session.maxCombo) session.maxCombo = session.combo;
    if(session.maxCombo > saveData.stats.maxCombo) saveData.stats.maxCombo = session.maxCombo;
    saveData.stats.totalCorrect++;

    var cleanFirstTry = (!session.hadWrongOnCurrent && !session.usedHelperOnCurrent);
    if(cleanFirstTry){
      session.firstTryCorrect++;
    } else if(session.hadWrongOnCurrent){
      saveData.stats.selfHealed++;
    }

    var gemKey = q.a + 'x' + q.b;
    if((cleanFirstTry || session.isRescueMode) && !saveData.gems[gemKey]){
      saveData.gems[gemKey] = true;
      session.newGemsThisRun.push(gemKey);
    }

    if(session.isRescueMode && q.rescueKey){
      saveData.rescueQueue = saveData.rescueQueue.filter(function(k){ return k !== q.rescueKey; });
      saveData.stats.rescuedCount++;
    }

    session.enemyHp = Math.max(0, session.enemyHp - 1);
    renderEnemyHp();
    updateComboUI();
    persistSave();
    updateHubStats();

    if(session.stage && session.stage.isBoss && els.bossTaunt){
      els.bossTaunt.textContent = (session.enemyHp === 0) ? session.stage.boss.tauntWin : session.stage.boss.tauntHit;
    } else if(els.bossTaunt){
      els.bossTaunt.textContent = (session.enemyHp === 0) ? '「寶箱喀嚓打開啦！太棒了！」' : '「漂亮的一擊！繼續加油！」';
    }

    if(MathApp.sfx){
      MathApp.sfx(session.combo >= 3 ? 'combo' : (session.stage && session.stage.isBoss ? 'hit' : 'correct'));
    }

    playBunnyAttackAnim(session.combo >= 3);

    var gemNote = session.newGemsThisRun.indexOf(gemKey) !== -1 ? ('（💎 新點亮 ' + q.a + '×' + q.b + ' 寶石！）') : '';
    if(els.feedback){
      els.feedback.textContent = '🎉 答對了！' + gemNote;
      els.feedback.className = 'mqst-stage-toast good';
    }

    if(els.helperDrawer) els.helperDrawer.classList.remove('open');

    // 切換控制台為超大「下一題」橫幅
    if(els.choicesGrid) els.choicesGrid.style.display = 'none';
    if(els.keypadWrap)  els.keypadWrap.style.display  = 'none';
    if(els.nextDock)    els.nextDock.style.display    = 'flex';

    if(els.explanationBox){
      els.explanationBox.innerHTML = '✨ <b>' + q.a + ' × ' + q.b + ' ＝ ' + q.product + '</b>（口訣：<b>' + q.mantra + '</b>）';
    }

    var isLast = (session.idx + 1 >= session.questions.length);
    if(els.nextBtn){
      els.nextBtn.innerHTML = isLast
        ? '看勝利成績 <i data-lucide="trophy" aria-hidden="true"></i>'
        : '下一題 <i data-lucide="arrow-right" aria-hidden="true"></i>';
    }
    if(MathApp.refreshIcons) MathApp.refreshIcons();

    if(MathApp.speak){
      MathApp.speak('答對了！' + q.mantra);
    }

    runAnim(function(gsap){
      if(els.nextBtn) gsap.fromTo(els.nextBtn, { scale: 0.85 }, { scale: 1, duration: 0.25, ease: 'back.out(1.7)', clearProps: 'transform' });
    });
  }

  function handleWrong(q){
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    session.hadWrongOnCurrent = true;
    session.combo = 0;
    updateComboUI();

    var key = q.a + 'x' + q.b;
    if(!session.isRescueMode && saveData.rescueQueue.indexOf(key) === -1){
      saveData.rescueQueue.push(key);
      persistSave();
      updateHubStats();
    }

    if(MathApp.sfx) MathApp.sfx('wrong');

    if(els.feedback){
      els.feedback.textContent = '💡 沒關係！看看魔法積木提示泡泡，再試一次吧！';
      els.feedback.className = 'mqst-stage-toast bad';
    }
    if(els.helperDrawer && !els.helperDrawer.classList.contains('open')){
      els.helperDrawer.classList.add('open');
    }

    runAnim(function(gsap){
      gsap.fromTo(els.questionStage, { x: -7 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.35)', clearProps: 'transform' });
    });
  }

  function checkChoiceAnswer(val, btnEl){
    if(session.locked) return;
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    var q = session.questions[session.idx];
    if(Number(val) === q.slots[0].expected){
      btnEl.classList.add('is-correct');
      var allBtns = els.choicesGrid.querySelectorAll('.mqst-choice-bubble');
      for(var i = 0; i < allBtns.length; i++) allBtns[i].disabled = true;
      handleCorrect(q);
    } else {
      btnEl.classList.add('is-wrong');
      btnEl.disabled = true;
      handleWrong(q);
    }
  }

  function checkKeypadAnswer(){
    if(session.locked) return;
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    var q = session.questions[session.idx];
    var inputs = els.equationRow.querySelectorAll('.mq-input-slot');
    var userValues = {};
    var hasEmpty = false;

    for(var i = 0; i < inputs.length; i++){
      var id = inputs[i].getAttribute('data-slot-id');
      var val = inputs[i].value.trim();
      if(val === '') hasEmpty = true;
      userValues[id] = val;
    }

    if(hasEmpty){
      if(MathApp.sfx) MathApp.sfx('wrong');
      if(els.feedback){
        els.feedback.textContent = '⚠️ 先用下方彩色玩具數字鍵盤填入答案喔！';
        els.feedback.className = 'mqst-stage-toast bad';
      }
      return;
    }

    var allOk = true;
    for(var k = 0; k < q.slots.length; k++){
      var spec = q.slots[k];
      var inp = els.equationRow.querySelector('[data-slot-id="' + spec.id + '"]');
      var ok = Number(userValues[spec.id]) === spec.expected;
      if(inp){
        inp.classList.remove('active-input', 'correct', 'wrong');
        inp.classList.add(ok ? 'correct' : 'wrong');
      }
      if(!ok) allOk = false;
    }

    if(allOk){
      handleCorrect(q);
    } else {
      handleWrong(q);
      var wrongInp = els.equationRow.querySelector('.mq-input-slot.wrong');
      if(wrongInp){
        wrongInp.value = '';
        setActiveInput(wrongInp);
      }
    }
  }

  function handleKeypadInput(key){
    if(!session.active) return;
    if(session.locked){
      if(key === 'enter') goNextQuestion();
      return;
    }
    var q = session.questions[session.idx];
    if(!q || q.uiMode !== 'keypad' || !session.activeInput) return;
    if(MathApp.stopSpeak) MathApp.stopSpeak();

    if(key === 'enter'){
      checkKeypadAnswer();
      return;
    }

    if(MathApp.sfx) MathApp.sfx('pop');
    session.activeInput.classList.remove('wrong', 'correct');

    if(key === 'backspace' || key === 'clear'){
      session.activeInput.value = session.activeInput.value.slice(0, -1);
      return;
    }

    if(/^[0-9]$/.test(key)){
      var maxLen = Number(session.activeInput.getAttribute('maxlength')) || 2;
      if(session.activeInput.value.length >= maxLen){
        session.activeInput.value = key;
      } else {
        session.activeInput.value += key;
      }

      if(maxLen === 1 && session.activeInput.value.length === 1){
        var allInputs = els.equationRow.querySelectorAll('.mq-input-slot');
        if(allInputs.length > 1 && session.activeInput === allInputs[0]){
          setActiveInput(allInputs[1]);
        }
      }
    }
  }

  function goNextQuestion(){
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(MathApp.sfx) MathApp.sfx('click');
    session.idx++;
    if(session.idx >= session.questions.length){
      finishStage();
    } else {
      renderCurrentQuestion();
    }
  }

  /* ---------------- 勝利大舞台結算 ---------------- */
  function finishStage(){
    if(els.progressFill) els.progressFill.style.width = '100%';
    showView('result');

    var total = session.questions.length;
    var accPct = Math.round((session.firstTryCorrect / total) * 100);
    var stars = 1;
    if(!session.usedHelperInStage && accPct >= 80){
      stars = 3;
    } else if(accPct >= 60){
      stars = 2;
    }

    var unlockedSprite = null;
    if(!session.isRescueMode && session.stage){
      var prevStars = Number(saveData.stageStars[session.stage.id] || 0);
      if(stars > prevStars) saveData.stageStars[session.stage.id] = stars;
      if(session.stage.isBoss && prevStars === 0){
        for(var i = 0; i < ISLANDS.length; i++){
          if(ISLANDS[i].bossStageId === session.stage.id){
            unlockedSprite = ISLANDS[i];
            break;
          }
        }
      }
    }

    var newBadges = checkAndUnlockBadges();
    persistSave();
    updateHubStats();

    if(els.victoryBunny) els.victoryBunny.innerHTML = getPinkBunnySvg();
    if(els.victorySprite){
      if(unlockedSprite){
        els.victorySprite.style.display = 'block';
        els.victorySprite.innerHTML = getCharacterSvg(unlockedSprite.theme, false);
      } else {
        els.victorySprite.style.display = 'none';
      }
    }

    if(els.resFirstAcc) els.resFirstAcc.textContent = session.firstTryCorrect + ' / ' + total;
    if(els.resNewGems)  els.resNewGems.textContent  = '+' + session.newGemsThisRun.length + ' 💎';
    if(els.resMaxCombo) els.resMaxCombo.textContent = session.maxCombo + ' 🔥';

    if(session.isRescueMode){
      els.resultTitle.textContent = '🆘 求救小精靈全數救出！';
      els.resultSub.textContent = '粉紅小兔把你卡住的乘法通通變成強項囉！';
      els.resNextBtn.style.display = 'none';
      els.resRetryBtn.style.display = 'none';
    } else {
      els.resultTitle.textContent = stars === 3 ? '滿分三星！閃耀大勝利！' : (stars === 2 ? '表現超棒！冒險成功！' : '完成冒險！繼續加油！');
      els.resultSub.textContent = stars === 3 ? '粉紅小兔為你拍拍手，全靠自己破關太強了！' : '再挑戰一次就能收集三顆閃亮大星星！';
      var curIdx = STAGES.indexOf(session.stage);
      els.resNextBtn.style.display = (curIdx >= 0 && curIdx + 1 < STAGES.length) ? 'inline-flex' : 'none';
      els.resRetryBtn.style.display = 'inline-flex';
    }

    var starNodes = els.resultStars.querySelectorAll('.mqst-star-item');
    for(var s = 0; s < starNodes.length; s++){
      starNodes[s].classList.toggle('earned', (s + 1) <= stars);
    }

    var showcaseHtml = '';
    if(unlockedSprite){
      showcaseHtml += '<div class="mqst-unlock-banner">' +
        getCharacterSvg(unlockedSprite.theme, false) +
        '<div><div>🎉 收服守護小精靈：【' + unlockedSprite.spriteName + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + unlockedSprite.spriteDesc + '</div></div></div>';
    }
    newBadges.forEach(function(b){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%);">' +
        '<span style="font-size:34px;">' + b.icon + '</span>' +
        '<div><div>🏅 解鎖新成就徽章：【' + b.name + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + b.desc + '</div></div></div>';
    });
    els.unlockShowcase.innerHTML = showcaseHtml;

    if(MathApp.sfx) MathApp.sfx('fanfare');
    if(MathApp.utils && MathApp.utils.launchConfetti){
      MathApp.utils.launchConfetti(stars === 3 || Boolean(unlockedSprite));
    }
    if(MathApp.speak){
      MathApp.speak(session.isRescueMode ? '太棒了，求救小精靈全部救出來了！' : ('恭喜過關！獲得 ' + stars + ' 顆星！'));
    }

    runAnim(function(gsap){
      var tl = gsap.timeline();
      tl.fromTo(els.resultCard, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'transform,opacity,visibility' });
      if(els.victoryBunny){
        tl.to(els.victoryBunny, { y: -14, duration: 0.32, yoyo: true, repeat: 3, ease: 'power1.out', clearProps: 'transform' }, '<0.1');
      }
      var earnedEls = els.resultStars.querySelectorAll('.mqst-star-item.earned');
      if(earnedEls.length > 0){
        tl.fromTo(earnedEls,
          { scale: 0.2, rotation: -25, autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.35, stagger: 0.16, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' },
          0.18
        );
      }
    });
  }

  /* ---------------- 圖鑑 Modal 渲染 ---------------- */
  function renderDexDialog(){
    var litCount = countLitGems();
    var gemHtml = '<div class="mqst-gem-summary">' +
      '<span>💎 已點亮九九乘法寶石：<b>' + litCount + ' / 81</b> 格</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">在冒險中一次答對該算式即可永久點亮！</span>' +
      '</div><div class="mqst-gem-grid">';
    gemHtml += '<div class="mqst-gem-cell head">×</div>';
    for(var c = 1; c <= 9; c++) gemHtml += '<div class="mqst-gem-cell head">' + c + '</div>';
    for(var r = 1; r <= 9; r++){
      gemHtml += '<div class="mqst-gem-cell head">' + r + '</div>';
      for(var col = 1; col <= 9; col++){
        var lit = Boolean(saveData.gems[r + 'x' + col]);
        gemHtml += '<div class="mqst-gem-cell' + (lit ? ' lit' : '') + '">' + (lit ? (r * col) : '·') + '</div>';
      }
    }
    gemHtml += '</div>';
    if(els.paneGems) els.paneGems.innerHTML = gemHtml;

    var spHtml = '<div class="mqst-collection-grid">';
    ISLANDS.forEach(function(isl){
      var got = Number(saveData.stageStars[isl.bossStageId] || 0) >= 1;
      spHtml += '<div class="mqst-collect-card' + (got ? '' : ' locked') + '">' +
        '<div class="mqst-collect-art">' + getCharacterSvg(isl.theme, false) + '</div>' +
        '<div class="mqst-collect-name">' + (got ? isl.spriteName : '???（尚未收服）') + '</div>' +
        '<p class="mqst-collect-desc">' + isl.spriteDesc + '</p></div>';
    });
    spHtml += '</div>';
    if(els.paneSprites) els.paneSprites.innerHTML = spHtml;

    var bdHtml = '<div class="mqst-collection-grid">';
    BADGES.forEach(function(b){
      var unlocked = Boolean(saveData.badges[b.id]);
      bdHtml += '<div class="mqst-collect-card' + (unlocked ? '' : ' locked') + '">' +
        '<div class="mqst-collect-art">' + (unlocked ? b.icon : '🔒') + '</div>' +
        '<div class="mqst-collect-name">' + b.name + '</div>' +
        '<p class="mqst-collect-desc">' + b.desc + '</p></div>';
    });
    bdHtml += '</div>';
    if(els.paneBadges) els.paneBadges.innerHTML = bdHtml;
  }

  function setupDialogPolyfill(dlg){
    if(!dlg) return;
    dlg.addEventListener('close', function(){ dlg.returnValue = ''; });
    if(typeof HTMLDialogElement === 'undefined' || !('closedBy' in HTMLDialogElement.prototype)){
      var pressedOutside = false;
      var isOutside = function(e){
        var r = dlg.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      dlg.addEventListener('pointerdown', function(e){ pressedOutside = isOutside(e); });
      dlg.addEventListener('pointerup', function(e){ if(pressedOutside && isOutside(e)) dlg.close(); });
    }
  }

  var parentChallengeAns = 42;
  function refreshParentLock(){
    var a = MathApp.utils.randInt(12, 18);
    var b = MathApp.utils.randInt(3, 5);
    parentChallengeAns = a * b;
    if(els.parentLockQ) els.parentLockQ.textContent = '請計算：' + a + ' × ' + b + ' ＝';
    if(els.parentLockIn) els.parentLockIn.value = '';
    if(els.parentLockBox) els.parentLockBox.style.display = 'flex';
    if(els.resetConfirmRow) els.resetConfirmRow.style.display = 'none';
  }

  function updatePreviewToggleBtn(){
    if(!els.previewToggle) return;
    els.previewToggle.setAttribute('aria-pressed', String(saveData.previewAll));
    els.previewToggle.textContent = saveData.previewAll ? '已開啟' : '未開啟';
  }

  /* ---------------- 事件綁定 ---------------- */
  function bindEvents(){
    if(els.enterArcadeBtn) els.enterArcadeBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      openArcade();
    });
    if(els.exitArcadeBtn) els.exitArcadeBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      closeArcade();
    });
    if(els.battleExitBtn) els.battleExitBtn.addEventListener('click', function(){
      if(MathApp.sfx) MathApp.sfx('click');
      closeArcade();
    });

    if(els.islandsGrid){
      els.islandsGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-map-node[data-stage-id]');
        if(!btn || btn.disabled) return;
        walkBunnyAndStart(btn.getAttribute('data-stage-id'));
      });
    }

    if(els.rescueBtn){
      els.rescueBtn.addEventListener('click', function(){
        if(saveData.rescueQueue.length === 0) return;
        if(MathApp.sfx) MathApp.sfx('click');
        startRescueBattle();
      });
    }

    if(els.backMapBtn){
      els.backMapBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        showView('map');
      });
    }

    if(els.speakBtn){
      els.speakBtn.addEventListener('click', function(){
        if(!session.active) return;
        if(MathApp.sfx) MathApp.sfx('click');
        var q = session.questions[session.idx];
        if(q && MathApp.speak) MathApp.speak(q.spokenPrompt);
      });
    }

    if(els.choicesGrid){
      els.choicesGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-choice-bubble[data-choice]');
        if(!btn || btn.disabled) return;
        checkChoiceAnswer(btn.getAttribute('data-choice'), btn);
      });
    }

    if(els.toyKeysGrid){
      els.toyKeysGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.mqst-toy-key[data-key]');
        if(!btn) return;
        e.preventDefault();
        handleKeypadInput(btn.getAttribute('data-key'));
      });
    }

    if(els.nextBtn) els.nextBtn.addEventListener('click', goNextQuestion);

    if(els.helperToggleBtn){
      els.helperToggleBtn.addEventListener('click', function(){
        if(!els.helperDrawer) return;
        if(MathApp.sfx) MathApp.sfx('click');
        var open = els.helperDrawer.classList.toggle('open');
        if(open){
          session.usedHelperOnCurrent = true;
          session.usedHelperInStage = true;
        }
      });
    }
    if(els.helperCloseBtn){
      els.helperCloseBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(els.helperDrawer) els.helperDrawer.classList.remove('open');
      });
    }

    if(els.resNextBtn){
      els.resNextBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        var curIdx = STAGES.indexOf(session.stage);
        if(curIdx >= 0 && curIdx + 1 < STAGES.length){
          startStage(STAGES[curIdx + 1].id);
        } else {
          showView('map');
        }
      });
    }
    if(els.resRetryBtn){
      els.resRetryBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        if(session.stage) startStage(session.stage.id);
      });
    }
    if(els.resMapBtn){
      els.resMapBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        showView('map');
      });
    }

    setupDialogPolyfill(els.dexDialog);
    if(els.openDexBtn && els.dexDialog){
      els.openDexBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        renderDexDialog();
        els.dexDialog.showModal();
      });

      var dexTabs = els.dexDialog.querySelectorAll('.mqst-dex-tab[data-dex]');
      dexTabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          if(MathApp.sfx) MathApp.sfx('click');
          var target = tab.getAttribute('data-dex');
          dexTabs.forEach(function(t){
            var act = (t === tab);
            t.classList.toggle('active', act);
            t.setAttribute('aria-selected', String(act));
          });
          if(els.paneGems)    els.paneGems.style.display    = (target === 'gems') ? 'block' : 'none';
          if(els.paneSprites) els.paneSprites.style.display = (target === 'sprites') ? 'block' : 'none';
          if(els.paneBadges)  els.paneBadges.style.display  = (target === 'badges') ? 'block' : 'none';
        });
      });
    }

    setupDialogPolyfill(els.parentDialog);
    if(els.openParentBtn && els.parentDialog){
      els.openParentBtn.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        updatePreviewToggleBtn();
        refreshParentLock();
        els.parentDialog.showModal();
      });
    }
    if(els.previewToggle){
      els.previewToggle.addEventListener('click', function(){
        if(MathApp.sfx) MathApp.sfx('click');
        saveData.previewAll = !saveData.previewAll;
        persistSave();
        updatePreviewToggleBtn();
        renderMap();
        if(MathApp.utils && MathApp.utils.showToast){
          MathApp.utils.showToast(saveData.previewAll ? '已開啟自由挑選／預習模式' : '已恢復依序闖關模式');
        }
      });
    }
    if(els.parentUnlockBtn){
      els.parentUnlockBtn.addEventListener('click', function(){
        var val = Number((els.parentLockIn && els.parentLockIn.value) || '');
        if(val === parentChallengeAns){
          if(MathApp.sfx) MathApp.sfx('correct');
          if(els.parentLockBox) els.parentLockBox.style.display = 'none';
          if(els.resetConfirmRow) els.resetConfirmRow.style.display = 'block';
        } else {
          if(MathApp.sfx) MathApp.sfx('wrong');
          if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast('驗證答案不正確，請再算算看！');
        }
      });
    }
    if(els.resetAllBtn){
      els.resetAllBtn.addEventListener('click', function(){
        saveData = createDefaultSave();
        persistSave();
        updatePreviewToggleBtn();
        refreshParentLock();
        renderMap();
        if(els.parentDialog) els.parentDialog.close();
        if(MathApp.sfx) MathApp.sfx('click');
        if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast('已重置所有九九乘法冒險紀錄！');
      });
    }

    document.addEventListener('keydown', function(e){
      if(!session.arcadeOpen) return;
      if(e.key === 'Escape'){
        if((els.dexDialog && els.dexDialog.open) || (els.parentDialog && els.parentDialog.open)) return;
        closeArcade();
        return;
      }
      if(!session.active || els.battleView.style.display === 'none') return;

      if(e.key >= '0' && e.key <= '9'){
        e.preventDefault();
        handleKeypadInput(e.key);
      } else if(e.key === 'Backspace'){
        e.preventDefault();
        handleKeypadInput('backspace');
      } else if(e.key === 'Enter'){
        e.preventDefault();
        handleKeypadInput('enter');
      }
    });

    if(MathApp.on){
      MathApp.on('mulExplore', function(){
        if(!saveData.stats.exploredInLab){
          saveData.stats.exploredInLab = true;
          checkAndUnlockBadges();
          persistSave();
        }
      });
      MathApp.on('subTabChange', function(info){
        if(info && info.unit === 'mul' && info.subTab === 'quest'){
          openArcade();
        } else {
          if(session.arcadeOpen) closeArcade();
          if(MathApp.stopSpeak) MathApp.stopSpeak();
        }
      });
      MathApp.on('tabChange', function(tab){
        if(tab !== 'mul'){
          if(session.arcadeOpen) closeArcade();
          if(MathApp.stopSpeak) MathApp.stopSpeak();
        }
      });
    }
  }

  function init(){
    cacheDom();
    if(!els.islandsGrid) return;

    var bunnySvg = getPinkBunnySvg();
    if(els.launcherBunny) els.launcherBunny.innerHTML = bunnySvg;
    if(els.hudAvatar)     els.hudAvatar.innerHTML     = bunnySvg;
    if(els.bunnyAvatar)   els.bunnyAvatar.innerHTML   = bunnySvg;
    if(els.heroSvg)       els.heroSvg.innerHTML       = bunnySvg;
    if(els.victoryBunny)  els.victoryBunny.innerHTML  = bunnySvg;

    initGsapMedia();
    bindEvents();
    updateHubStats();
    renderMap();
  }

  MathApp.mulQuest = {
    init: init,
    getIslands: function(){ return ISLANDS.slice(); },
    getStages: function(){ return STAGES.slice(); },
    getBadges: function(){ return BADGES.slice(); },
    buildStageQuestions: buildStageQuestions,
    getSaveSummary: function(){
      return {
        stars: countTotalStars(),
        gems: countLitGems(),
        sprites: countUnlockedSprites(),
        rescueCount: saveData.rescueQueue.length
      };
    }
  };

})();
