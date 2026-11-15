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
      partnerProjectile: '🌿',
      partnerSkillDesc: '吹出嫩芽陣風，幫你消除錯選項或免費打開積木提示！',
      partnerCheers: ['嫩芽陪你一起數！', '葉子排好隊囉！', '一擊命中太厲害！'],
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
      partnerProjectile: '🧱',
      partnerSkillDesc: '拋出彩色積木，幫你看出分組或免費消去一個干擾選項！',
      partnerCheers: ['積木整齊排好了！', '組裝完成大加分！', '小工匠替你拍拍手！'],
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
      partnerProjectile: '🦋',
      partnerSkillDesc: '撒出蝴蝶光粉，免費開積木提示或變走一個錯答案！',
      partnerCheers: ['蝴蝶翩翩飛來幫你！', '乘法交換魔法超棒！', '花園開滿幸運花！'],
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
      partnerProjectile: '🔥',
      partnerSkillDesc: '噴出暖呼呼龍焰，幫你免費提示或震飛一個干擾泡泡！',
      partnerCheers: ['龍龍噴出助陣火球！', '大口訣也難不倒我們！', '氣勢滿分繼續衝！'],
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
      partnerProjectile: '👑',
      partnerSkillDesc: '施展皇冠星光，給粉紅小兔最強大的免費提示與雙重助陣！',
      partnerCheers: ['皇冠星光閃耀加持！', '乘法大師就是你！', '守護小隊無人能敵！'],
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

  /* ---------------- 8 款小兔子頭飾／換裝解鎖定義 ---------------- */
  var BUNNY_COSTUMES = [
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
      desc: '全部 15 關都拿到滿分三星！閃耀夜空的勇者披風！',
      goalText: '收集全部 45 顆星星（全關卡三星）'
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

  /* ---------------- 原創可愛粉紅小兔子與怪物/精靈多表情 SVG ---------------- */
  function buildFaceExpression(mood, lx, rx, y, mouthY, r){
    var m = mood || 'normal';
    var rad = r || 4;
    if(m === 'happy'){
      return '<path d="M' + (lx - rad) + ' ' + y + ' Q' + lx + ' ' + (y - rad * 1.4) + ' ' + (lx + rad) + ' ' + y + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round"/>' +
        '<path d="M' + (rx - rad) + ' ' + y + ' Q' + rx + ' ' + (y - rad * 1.4) + ' ' + (rx + rad) + ' ' + y + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round"/>' +
        '<path d="M' + (lx + 3) + ' ' + (mouthY - 1) + ' Q' + ((lx + rx) / 2) + ' ' + (mouthY + 8) + ' ' + (rx - 3) + ' ' + (mouthY - 1) + ' Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>';
    }
    if(m === 'fever'){
      return '<polygon points="' + lx + ',' + (y - 5) + ' ' + (lx + 1.6) + ',' + (y - 1.5) + ' ' + (lx + 5) + ',' + (y - 1) + ' ' + (lx + 2.3) + ',' + (y + 1.5) + ' ' + (lx + 3) + ',' + (y + 5) + ' ' + lx + ',' + (y + 3) + ' ' + (lx - 3) + ',' + (y + 5) + ' ' + (lx - 2.3) + ',' + (y + 1.5) + ' ' + (lx - 5) + ',' + (y - 1) + ' ' + (lx - 1.6) + ',' + (y - 1.5) + '" fill="#f59e0b" stroke="#332b22" stroke-width="1.3"/>' +
        '<polygon points="' + rx + ',' + (y - 5) + ' ' + (rx + 1.6) + ',' + (y - 1.5) + ' ' + (rx + 5) + ',' + (y - 1) + ' ' + (rx + 2.3) + ',' + (y + 1.5) + ' ' + (rx + 3) + ',' + (y + 5) + ' ' + rx + ',' + (y + 3) + ' ' + (rx - 3) + ',' + (y + 5) + ' ' + (rx - 2.3) + ',' + (y + 1.5) + ' ' + (rx - 5) + ',' + (y - 1) + ' ' + (rx - 1.6) + ',' + (y - 1.5) + '" fill="#f59e0b" stroke="#332b22" stroke-width="1.3"/>' +
        '<path d="M' + (lx + 2) + ' ' + (mouthY - 1) + ' Q' + ((lx + rx) / 2) + ' ' + (mouthY + 9) + ' ' + (rx - 2) + ' ' + (mouthY - 1) + ' Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>';
    }
    if(m === 'oops'){
      return '<path d="M' + (lx - 3) + ' ' + (y - 3) + ' L' + (lx + 3) + ' ' + y + ' L' + (lx - 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M' + (rx + 3) + ' ' + (y - 3) + ' L' + (rx - 3) + ' ' + y + ' L' + (rx + 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M' + (lx + 4) + ' ' + (mouthY + 2) + ' Q' + ((lx + rx) / 2) + ' ' + (mouthY - 3) + ' ' + (rx - 4) + ' ' + (mouthY + 2) + '" fill="none" stroke="#332b22" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M' + (rx + 12) + ' ' + (y - 8) + ' Q' + (rx + 16) + ' ' + (y - 2) + ' ' + (rx + 12) + ' ' + (y + 2) + ' Q' + (rx + 8) + ' ' + (y - 2) + ' ' + (rx + 12) + ' ' + (y - 8) + ' Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.4"/>';
    }
    if(m === 'hit'){
      return '<path d="M' + (lx - 3) + ' ' + (y - 3) + ' L' + (lx + 3) + ' ' + y + ' L' + (lx - 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M' + (rx + 3) + ' ' + (y - 3) + ' L' + (rx - 3) + ' ' + y + ' L' + (rx + 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse cx="' + ((lx + rx) / 2) + '" cy="' + (mouthY + 1) + '" rx="5" ry="4" fill="#fb7185" stroke="#332b22" stroke-width="2.4"/>';
    }
    if(m === 'dizzy'){
      return '<circle cx="' + lx + '" cy="' + y + '" r="' + (rad + 1) + '" fill="none" stroke="#332b22" stroke-width="2.4"/><circle cx="' + lx + '" cy="' + y + '" r="1.6" fill="#332b22"/>' +
        '<circle cx="' + rx + '" cy="' + y + '" r="' + (rad + 1) + '" fill="none" stroke="#332b22" stroke-width="2.4"/><circle cx="' + rx + '" cy="' + y + '" r="1.6" fill="#332b22"/>' +
        '<path d="M' + (lx + 2) + ' ' + mouthY + ' Q' + ((lx + rx) / 2 - 3) + ' ' + (mouthY + 4) + ' ' + ((lx + rx) / 2) + ' ' + mouthY + ' T' + (rx - 2) + ' ' + mouthY + '" fill="none" stroke="#332b22" stroke-width="2.5" stroke-linecap="round"/>';
    }
    return '<circle cx="' + lx + '" cy="' + y + '" r="' + rad + '" fill="#332b22"/><circle cx="' + (lx - 1.2) + '" cy="' + (y - 1.4) + '" r="1.4" fill="#ffffff"/>' +
      '<circle cx="' + rx + '" cy="' + y + '" r="' + rad + '" fill="#332b22"/><circle cx="' + (rx - 1.2) + '" cy="' + (y - 1.4) + '" r="1.4" fill="#ffffff"/>' +
      '<path d="M' + (lx + 4) + ' ' + mouthY + ' Q' + ((lx + rx) / 2) + ' ' + (mouthY + 5) + ' ' + (rx - 4) + ' ' + mouthY + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round"/>';
  }

  function buildBunnyCostumeLayers(costumeId){
    var cId = costumeId || 'default';
    var backLayer = '';
    var headFrontLayer = '';
    var faceOverlayLayer = '';

    if(cId === 'default'){
      headFrontLayer = '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#fde047" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>';
    } else if(cId === 'ribbon'){
      headFrontLayer = '<g transform="rotate(-14 63 30)">' +
        '<path d="M63 30 C54 21, 47 23, 50 31 C47 38, 55 39, 63 32 Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M63 30 C72 21, 79 23, 76 31 C79 38, 71 39, 63 32 Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<circle cx="53" cy="28" r="1.6" fill="#fff1f2"/>' +
        '<circle cx="55" cy="33" r="1.3" fill="#fff1f2"/>' +
        '<circle cx="73" cy="28" r="1.6" fill="#fff1f2"/>' +
        '<circle cx="71" cy="33" r="1.3" fill="#fff1f2"/>' +
        '<circle cx="63" cy="31" r="4.2" fill="#f43f5e" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="63" cy="31" r="1.6" fill="#fde047"/>' +
      '</g>';
    } else if(cId === 'sprout'){
      headFrontLayer = '<path d="M27 40 Q50 21 73 40" fill="none" stroke="#332b22" stroke-width="5.6" stroke-linecap="round"/>' +
        '<path d="M27 40 Q50 21 73 40" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M50 29 Q50 18 50 15" fill="none" stroke="#332b22" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M50 17 C41 8, 33 14, 39 21 C43 24, 50 20, 50 17 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M50 17 C59 7, 68 13, 62 20 C58 24, 50 20, 50 17 Z" fill="#86efac" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>';
    } else if(cId === 'explorer'){
      headFrontLayer = '<path d="M35 30 Q50 13 65 30 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M36 27 Q50 23 64 27" fill="none" stroke="#b45309" stroke-width="3.2"/>' +
        '<ellipse cx="50" cy="31" rx="26" ry="5.5" fill="#fde68a" stroke="#332b22" stroke-width="2.6"/>' +
        '<circle cx="50" cy="22" r="4" fill="#38bdf8" stroke="#332b22" stroke-width="1.8"/>' +
        '<circle cx="50" cy="22" r="1.5" fill="#fde047"/>';
    } else if(cId === 'flower'){
      headFrontLayer = '<path d="M29 38 Q50 22 71 38" fill="none" stroke="#16a34a" stroke-width="3.2" stroke-linecap="round"/>' +
        /* 左小花 */
        '<g transform="translate(35,30)">' +
          '<circle cx="0" cy="-4.5" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="4.3" cy="-1.4" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="2.7" cy="3.6" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-2.7" cy="3.6" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-4.3" cy="-1.4" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="0" cy="0" r="2.6" fill="#fde047" stroke="#332b22" stroke-width="1.2"/>' +
        '</g>' +
        /* 中央主花 */
        '<g transform="translate(50,26)">' +
          '<circle cx="0" cy="-5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="4.8" cy="-1.5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="3" cy="4" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-3" cy="4" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-4.8" cy="-1.5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="0" cy="0" r="2.9" fill="#fb7185" stroke="#332b22" stroke-width="1.2"/>' +
        '</g>' +
        /* 右小花 */
        '<g transform="translate(65,30)">' +
          '<circle cx="0" cy="-4.5" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="4.3" cy="-1.4" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="2.7" cy="3.6" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-2.7" cy="3.6" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="-4.3" cy="-1.4" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
          '<circle cx="0" cy="0" r="2.6" fill="#fde047" stroke="#332b22" stroke-width="1.2"/>' +
        '</g>';
    } else if(cId === 'glasses'){
      headFrontLayer = '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#38bdf8" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>';
      faceOverlayLayer = '<g>' +
        '<rect x="30" y="42" width="16" height="11" rx="4.5" fill="#1e293b" fill-opacity="0.58" stroke="#fde047" stroke-width="2.4"/>' +
        '<rect x="54" y="42" width="16" height="11" rx="4.5" fill="#1e293b" fill-opacity="0.58" stroke="#fde047" stroke-width="2.4"/>' +
        '<path d="M46 46 Q50 44 54 46" fill="none" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/>' +
        '<line x1="33" y1="45" x2="37" y2="50" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>' +
        '<line x1="57" y1="45" x2="61" y2="50" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>' +
      '</g>';
    } else if(cId === 'cape'){
      backLayer = '<path d="M25 60 Q11 79 16 93 Q50 97 84 93 Q89 79 75 60 Z" fill="#312e81" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
        '<path d="M26 63 Q17 79 20 89 Q50 93 80 89 Q83 79 74 63" fill="none" stroke="#fde047" stroke-width="1.8" stroke-dasharray="4 3"/>' +
        '<polygon points="22,79 23.5,82 27,82 24.2,84 25.2,87 22,85 18.8,87 19.8,84 17,82 20.5,82" fill="#fde047"/>' +
        '<polygon points="78,79 79.5,82 83,82 80.2,84 81.2,87 78,85 74.8,87 75.8,84 73,82 76.5,82" fill="#fde047"/>';
      headFrontLayer = '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#fde047" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>';
      faceOverlayLayer = '<path d="M36 64 L50 70 L64 64" fill="none" stroke="#312e81" stroke-width="3.6" stroke-linecap="round"/>' +
        '<polygon points="50,65 52,69 56,69 53,71.5 54,75.5 50,73 46,75.5 47,71.5 44,69 48,69" fill="#fde047" stroke="#332b22" stroke-width="1.6" stroke-linejoin="round"/>';
    } else if(cId === 'crown'){
      backLayer = '<path d="M23 59 Q9 78 15 93 Q50 98 85 93 Q91 78 77 59 Z" fill="#fef08a" stroke="#b45309" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<polygon points="15,24 16.5,27.5 20,27.5 17.2,29.8 18.2,33 15,31 11.8,33 12.8,29.8 10,27.5 13.5,27.5" fill="#38bdf8"/>' +
        '<polygon points="85,24 86.5,27.5 90,27.5 87.2,29.8 88.2,33 85,31 81.8,33 82.8,29.8 80,27.5 83.5,27.5" fill="#f472b6"/>';
      headFrontLayer = '<polygon points="36,30 37,16 44,23 50,12 56,23 63,16 64,30" fill="#fbbf24" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="37" cy="15" r="2.3" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
        '<circle cx="50" cy="11" r="2.7" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
        '<circle cx="63" cy="15" r="2.3" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
        '<circle cx="43" cy="26" r="2.2" fill="#f43f5e" stroke="#332b22" stroke-width="1.1"/>' +
        '<circle cx="50" cy="24" r="2.8" fill="#38bdf8" stroke="#332b22" stroke-width="1.2"/>' +
        '<circle cx="57" cy="26" r="2.2" fill="#22c55e" stroke="#332b22" stroke-width="1.1"/>';
      faceOverlayLayer = '<path d="M41 66 L50 70 L59 66 L59 73 L50 70 L41 73 Z" fill="#f43f5e" stroke="#332b22" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<circle cx="50" cy="70" r="2.8" fill="#38bdf8" stroke="#332b22" stroke-width="1.4"/>';
    }

    return {
      backLayer: backLayer,
      headFrontLayer: headFrontLayer,
      faceOverlayLayer: faceOverlayLayer
    };
  }

  function getPinkBunnySvg(mood, costumeId){
    var m = mood || 'normal';
    var activeId = costumeId || ((typeof saveData !== 'undefined' && saveData && saveData.activeCostume) ? saveData.activeCostume : 'default');
    var layers = buildBunnyCostumeLayers(activeId);
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      layers.backLayer +
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
      /* 頭飾配件 */
      layers.headFrontLayer +
      /* 粉腮與動態表情 */
      '<ellipse cx="33" cy="54" rx="4.8" ry="2.8" fill="#f472b6" opacity="' + (m === 'fever' ? '0.9' : '0.65') + '"/>' +
      '<ellipse cx="67" cy="54" rx="4.8" ry="2.8" fill="#f472b6" opacity="' + (m === 'fever' ? '0.9' : '0.65') + '"/>' +
      '<ellipse cx="50" cy="52" rx="3" ry="2" fill="#e11d48"/>' +
      buildFaceExpression(m, 40, 60, 48, 56, 4) +
      layers.faceOverlayLayer +
      /* 小腳丫 */
      '<ellipse cx="39" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
      '<ellipse cx="61" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
    '</svg>';
  }

  function getStageChestSvg(theme, mood){
    var m = mood || 'normal';
    var colors = {
      forest: ['#86efac', '#22c55e'],
      workshop: ['#fde047', '#f59e0b'],
      garden: ['#fbcfe8', '#ec4899'],
      valley: ['#bae6fd', '#3b82f6'],
      castle: ['#ddd6fe', '#8b5cf6']
    };
    var pal = colors[theme] || colors.forest;
    if(m === 'open'){
      return '<svg viewBox="0 0 90 90">' +
        '<rect x="15" y="42" width="60" height="34" rx="11" fill="' + pal[0] + '" stroke="#332b22" stroke-width="3.2"/>' +
        '<rect x="16" y="22" width="58" height="16" rx="8" transform="rotate(-10 18 38)" fill="' + pal[1] + '" stroke="#332b22" stroke-width="3"/>' +
        '<circle cx="34" cy="39" r="6" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="46" cy="36" r="7" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="57" cy="39" r="6" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
        buildFaceExpression('happy', 30, 60, 58, 63, 3.5) +
        '<polygon points="45,6 48,14 56,14 50,19 52,26 45,21 38,26 40,19 34,14 42,14" fill="#fde047" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>';
    }
    return '<svg viewBox="0 0 90 90">' +
      '<rect x="15" y="34" width="60" height="40" rx="12" fill="' + pal[0] + '" stroke="#332b22" stroke-width="3.2"/>' +
      '<path d="M15 44 Q45 36 75 44" fill="none" stroke="#332b22" stroke-width="3"/>' +
      '<rect x="38" y="38" width="14" height="14" rx="4" fill="#fde047" stroke="#332b22" stroke-width="2.5"/>' +
      buildFaceExpression(m === 'hit' ? 'hit' : 'normal', 30, 60, 58, 62, 3.5) +
      '<polygon points="45,14 48,22 56,22 50,27 52,34 45,29 38,34 40,27 34,22 42,22" fill="#fde047" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
    '</svg>';
  }

  function getCharacterSvg(key, isBoss, mood){
    var m = mood || 'normal';
    if(isBoss){
      var bossMap = {
        forest: '<svg viewBox="0 0 80 80"><rect x="16" y="24" width="48" height="44" rx="14" fill="#86efac" stroke="#332b22" stroke-width="3"/><circle cx="28" cy="18" r="10" fill="#4ade80" stroke="#332b22" stroke-width="3"/><circle cx="52" cy="18" r="10" fill="#4ade80" stroke="#332b22" stroke-width="3"/><circle cx="24" cy="49" r="4" fill="#fda4af" opacity="0.8"/><circle cx="56" cy="49" r="4" fill="#fda4af" opacity="0.8"/>' + buildFaceExpression(m, 31, 49, 43, 54, 4.2) + '</svg>',
        workshop: '<svg viewBox="0 0 80 80"><rect x="14" y="22" width="52" height="46" rx="10" fill="#fcd34d" stroke="#332b22" stroke-width="3"/><line x1="40" y1="8" x2="40" y2="22" stroke="#332b22" stroke-width="3"/><circle cx="40" cy="8" r="5" fill="#ef4444" stroke="#332b22" stroke-width="2.5"/><rect x="24" y="34" width="12" height="10" rx="3" fill="#fff" stroke="#332b22" stroke-width="2.5"/><rect x="44" y="34" width="12" height="10" rx="3" fill="#fff" stroke="#332b22" stroke-width="2.5"/>' + buildFaceExpression(m, 30, 50, 39, 55, 3) + '</svg>',
        garden: '<svg viewBox="0 0 80 80"><circle cx="40" cy="44" r="22" fill="#f9a8d4" stroke="#332b22" stroke-width="3"/><circle cx="22" cy="24" r="10" fill="#f472b6" stroke="#332b22" stroke-width="3"/><circle cx="58" cy="24" r="10" fill="#f472b6" stroke="#332b22" stroke-width="3"/><circle cx="40" cy="18" r="10" fill="#fb7185" stroke="#332b22" stroke-width="3"/>' + buildFaceExpression(m, 33, 47, 42, 52, 3.8) + '</svg>',
        valley: '<svg viewBox="0 0 80 80"><path d="M18 58 Q14 26 40 20 Q66 26 62 58 Z" fill="#60a5fa" stroke="#332b22" stroke-width="3"/><polygon points="26,23 20,10 34,19" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/><polygon points="54,23 60,10 46,19" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/><ellipse cx="40" cy="52" rx="14" ry="8" fill="#dbeafe" stroke="#332b22" stroke-width="2.5"/>' + buildFaceExpression(m, 32, 48, 38, 51, 4) + '</svg>',
        castle: '<svg viewBox="0 0 80 80"><polygon points="20,24 28,10 40,20 52,10 60,24" fill="#fbbf24" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="24" width="48" height="44" rx="14" fill="#a78bfa" stroke="#332b22" stroke-width="3"/>' + buildFaceExpression(m, 31, 49, 43, 55, 4.2) + '</svg>'
      };
      return bossMap[key] || bossMap.forest;
    }

    var spMood = (m === 'happy' || m === 'fever') ? 'happy' : 'normal';
    var spriteMap = {
      forest: '<svg viewBox="0 0 64 64"><rect x="14" y="22" width="36" height="32" rx="11" fill="#bbf7d0" stroke="#332b22" stroke-width="2.6"/><path d="M32 22 C28 10 18 10 20 18 C22 22 32 22 32 22 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.2"/><path d="M32 22 C36 10 46 10 44 18 C42 22 32 22 32 22 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2"/>' + buildFaceExpression(spMood, 25, 39, 36, 43, 3) + '</svg>',
      workshop: '<svg viewBox="0 0 64 64"><rect x="15" y="18" width="34" height="34" rx="8" fill="#fde047" stroke="#332b22" stroke-width="2.6"/><rect x="22" y="12" width="20" height="8" rx="4" fill="#fb923c" stroke="#332b22" stroke-width="2.4"/>' + buildFaceExpression(spMood, 26, 38, 33, 41, 3) + '</svg>',
      garden: '<svg viewBox="0 0 64 64"><ellipse cx="20" cy="32" rx="11" ry="14" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4"/><ellipse cx="44" cy="32" rx="11" ry="14" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4"/><rect x="24" y="20" width="16" height="28" rx="8" fill="#f472b6" stroke="#332b22" stroke-width="2.5"/>' + buildFaceExpression(spMood, 29, 35, 31, 38, 2.5) + '</svg>',
      valley: '<svg viewBox="0 0 64 64"><circle cx="22" cy="40" r="10" fill="#bae6fd" stroke="#332b22" stroke-width="2.4"/><circle cx="42" cy="40" r="10" fill="#bae6fd" stroke="#332b22" stroke-width="2.4"/><circle cx="32" cy="32" r="16" fill="#e0f2fe" stroke="#332b22" stroke-width="2.6"/>' + buildFaceExpression(spMood, 27, 37, 31, 38, 2.8) + '</svg>',
      castle: '<svg viewBox="0 0 64 64"><polygon points="20,20 26,10 32,18 38,10 44,20" fill="#fbbf24" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/><rect x="16" y="20" width="32" height="32" rx="10" fill="#c4b5fd" stroke="#332b22" stroke-width="2.6"/>' + buildFaceExpression(spMood, 26, 38, 34, 41, 3) + '</svg>'
    };
    return spriteMap[key] || spriteMap.forest;
  }

  /* ---------------- 存檔管理 ---------------- */
  function createDefaultSave(){
    return {
      version: 1,
      previewAll: false,
      activePartner: '',
      activeCostume: 'default',
      unlockedCostumes: { 'default': true },
      hasNewCostume: false,
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
      var stageStars = parsed.stageStars || {};
      var activePartner = typeof parsed.activePartner === 'string' ? parsed.activePartner : '';
      // 相容舊存檔：若尚未紀錄夥伴設定但已收服精靈，自動派最新收服的小精靈登場
      if(typeof parsed.activePartner !== 'string'){
        for(var i = ISLANDS.length - 1; i >= 0; i--){
          if(Number(stageStars[ISLANDS[i].bossStageId] || 0) >= 1){
            activePartner = ISLANDS[i].id;
            break;
          }
        }
      }
      var unlockedCostumes = Object.assign({ 'default': true }, parsed.unlockedCostumes || {});
      var activeCostume = (typeof parsed.activeCostume === 'string' && unlockedCostumes[parsed.activeCostume])
        ? parsed.activeCostume
        : 'default';
      return {
        version: 1,
        previewAll: Boolean(parsed.previewAll),
        activePartner: activePartner,
        activeCostume: activeCostume,
        unlockedCostumes: unlockedCostumes,
        hasNewCostume: Boolean(parsed.hasNewCostume),
        stageStars: stageStars,
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
    isGemHuntMode: false,
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
    bossShield: 0,
    bossShieldMax: 0,
    partnerUsedSkill: false,
    battleTheme: 'forest',
    battleBossObj: null,
    activeInput: null
  };

  var els = {};
  var motionReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bunnyIdleTween = null;
  var partnerIdleTween = null;
  var speakTimer = null;

  function getActivePartnerIsland(){
    if(!saveData.activePartner) return null;
    for(var i = 0; i < ISLANDS.length; i++){
      var isl = ISLANDS[i];
      if(isl.id === saveData.activePartner && Number(saveData.stageStars[isl.bossStageId] || 0) >= 1){
        return isl;
      }
    }
    return null;
  }

  function clearSpeakTimer(){
    if(speakTimer){
      clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function scheduleSpeak(text, delayMs){
    clearSpeakTimer();
    if(!text || !MathApp.speak) return;
    if(!delayMs || delayMs <= 0){
      MathApp.speak(text);
      return;
    }
    speakTimer = setTimeout(function(){
      speakTimer = null;
      if(session.arcadeOpen && MathApp.speak){
        MathApp.speak(text);
      }
    }, delayMs);
  }

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

  function getCostumeById(id){
    for(var i = 0; i < BUNNY_COSTUMES.length; i++){
      if(BUNNY_COSTUMES[i].id === id) return BUNNY_COSTUMES[i];
    }
    return BUNNY_COSTUMES[0];
  }

  function getActiveCostumeId(){
    var id = saveData.activeCostume || 'default';
    if(saveData.unlockedCostumes && saveData.unlockedCostumes[id]) return id;
    return 'default';
  }

  function countUnlockedCostumes(){
    var cnt = 0;
    BUNNY_COSTUMES.forEach(function(c){
      if(saveData.unlockedCostumes && saveData.unlockedCostumes[c.id]) cnt++;
    });
    return cnt;
  }

  function getCostumeProgress(costume){
    var stars = countTotalStars();
    var gems = countLitGems();
    var unlocked = Boolean(saveData.unlockedCostumes && saveData.unlockedCostumes[costume.id]);
    if(costume.unlockType === 'free'){
      return { current: 1, target: 1, pct: 100, unlocked: true, unit: '' };
    }
    var cur = (costume.unlockType === 'stars') ? stars : gems;
    var tgt = costume.target || 1;
    var pct = Math.min(100, Math.round((cur / tgt) * 100));
    var unit = (costume.unlockType === 'stars') ? '顆星星' : '顆寶石';
    return { current: cur, target: tgt, pct: pct, unlocked: unlocked || (cur >= tgt), unit: unit };
  }

  function checkAndUnlockCostumes(silent){
    var stars = countTotalStars();
    var gems = countLitGems();
    var newlyUnlocked = [];
    if(!saveData.unlockedCostumes) saveData.unlockedCostumes = { 'default': true };

    BUNNY_COSTUMES.forEach(function(c){
      if(saveData.unlockedCostumes[c.id]) return;
      var ok = (c.unlockType === 'free') ||
        (c.unlockType === 'stars' && stars >= c.target) ||
        (c.unlockType === 'gems' && gems >= c.target);
      if(ok){
        saveData.unlockedCostumes[c.id] = true;
        newlyUnlocked.push(c);
      }
    });
    if(newlyUnlocked.length > 0 && !silent){
      saveData.hasNewCostume = true;
    }
    return newlyUnlocked;
  }

  function syncAllBunnyVisuals(){
    var cId = getActiveCostumeId();
    var normalSvg = getPinkBunnySvg('normal', cId);
    if(els.launcherBunny) els.launcherBunny.innerHTML = normalSvg;
    if(els.hudAvatar)     els.hudAvatar.innerHTML     = normalSvg;
    if(els.bunnyAvatar)   els.bunnyAvatar.innerHTML   = normalSvg;
    if(els.heroSvg){
      var battleMood = (session.active && session.combo >= 3) ? 'fever' : 'normal';
      els.heroSvg.innerHTML = getPinkBunnySvg(battleMood, cId);
    }
    if(els.victoryBunny){
      els.victoryBunny.innerHTML = getPinkBunnySvg('happy', cId);
    }
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
    var unlitPairs = [];
    var litPairs = [];
    stage.tables.forEach(function(a){
      for(var b = 1; b <= 9; b++){
        var pair = { a: a, b: b };
        if(saveData.gems[a + 'x' + b]){
          litPairs.push(pair);
        } else {
          unlitPairs.push(pair);
        }
      }
    });
    // 優先抽選尚未點亮寶石的算式，再以已點亮算式補齊複習，避免重刷關卡總是撞見同一題
    shuffleArr(unlitPairs);
    shuffleArr(litPairs);
    var poolPairs = unlitPairs.concat(litPairs);

    // 若為 Boss 關卡，優先將理解／交換律／未知數題安排在前面作為護盾試煉
    var orderedTypes = [];
    for(var t = 0; t < stage.count; t++){
      orderedTypes.push(stage.qTypes[t % stage.qTypes.length]);
    }
    if(stage.isBoss && stage.qTypes.length > 1){
      orderedTypes.sort(function(t1, t2){
        var w1 = (t1 === 'standard') ? 1 : 0;
        var w2 = (t2 === 'standard') ? 1 : 0;
        return w1 - w2;
      });
    }

    var selected = [];
    for(var i = 0; i < stage.count; i++){
      var pair = poolPairs[i % poolPairs.length];
      var qType = orderedTypes[i];
      var mode = stage.inputMode;
      if(mode === 'mixed') mode = (i < Math.ceil(stage.count / 2)) ? 'choice' : 'keypad';

      var effectiveType = (qType === 'story_choice' || (mode === 'choice' && qType === 'concept')) ? 'standard' : qType;
      var q = MathApp.mulQuiz.buildQuestion(pair.a, pair.b, effectiveType);

      // 僅對 2~7 組套用情境文字，不再覆寫 pair.b 而導致同場題目重複
      if(qType === 'story_choice' && effectiveType === 'standard' && pair.b >= 2 && pair.b <= 7){
        var icons = ['🍎', '🍪', '✏️', '🌟', '🎈'];
        var units = ['盤', '袋', '盒', '排', '串'];
        var idx = MathApp.utils.randInt(0, icons.length - 1);
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

  function getCollectableUnlitGems(){
    var allowedTables = {};
    STAGES.forEach(function(st){
      if(isStageUnlocked(st.id)){
        st.tables.forEach(function(t){ allowedTables[t] = true; });
      }
    });
    var list = [];
    for(var a = 1; a <= 9; a++){
      if(!allowedTables[a]) continue;
      for(var b = 1; b <= 9; b++){
        if(!saveData.gems[a + 'x' + b]){
          list.push({ a: a, b: b });
        }
      }
    }
    return list;
  }

  function findRecommendedStageForTable(a){
    for(var i = 0; i < STAGES.length; i++){
      if(STAGES[i].tables.indexOf(a) !== -1) return STAGES[i];
    }
    return STAGES[0];
  }

  function buildGemHuntQuestions(pairs){
    shuffleArr(pairs);
    return pairs.slice(0, 6).map(function(p){
      var q = MathApp.mulQuiz.buildQuestion(p.a, p.b, 'standard');
      q.uiMode = 'keypad';
      q.badge = '💎 未點亮寶石特訓';
      return q;
    });
  }

  /* ---------------- DOM 快取 ---------------- */
  function cacheDom(){
    els.launcherBunny  = document.getElementById('mqst-launcher-bunny');
    els.launchStars    = document.getElementById('mqst-launch-stars');
    els.launchGems     = document.getElementById('mqst-launch-gems');
    els.launchSprites  = document.getElementById('mqst-launch-sprites');
    els.launchCostumes = document.getElementById('mqst-launch-costumes');
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
    els.openWardrobeBtn= document.getElementById('mqst-open-wardrobe-btn');
    els.openDexBtn     = document.getElementById('mqst-open-dex-btn');
    els.openParentBtn  = document.getElementById('mqst-open-parent-btn');
    els.mapBgmBtn      = document.getElementById('mqst-map-bgm-btn');
    els.mapSoundBtn    = document.getElementById('mqst-map-sound-btn');
    els.mapVoiceBtn    = document.getElementById('mqst-map-voice-btn');
    els.battleBgmBtn   = document.getElementById('mqst-battle-bgm-btn');
    els.battleSoundBtn = document.getElementById('mqst-battle-sound-btn');
    els.battleVoiceBtn = document.getElementById('mqst-battle-voice-btn');

    els.mapView        = document.getElementById('mqst-map-view');
    els.previewBadge   = document.getElementById('mqst-preview-badge');
    els.worldViewport  = document.getElementById('mqst-world-viewport');
    els.worldCanvas    = document.getElementById('mqst-world-canvas');
    els.pathSvg        = document.getElementById('mqst-path-svg');
    els.islandSigns    = document.getElementById('mqst-island-signs');
    els.islandsGrid    = document.getElementById('mqst-islands-grid');
    els.partnerMapAvatar = document.getElementById('mqst-partner-map-avatar');
    els.bunnyAvatar    = document.getElementById('mqst-bunny-avatar');
    els.mapTip         = document.getElementById('mqst-map-tip');

    els.battleView     = document.getElementById('mqst-battle-view');
    els.backMapBtn     = document.getElementById('mqst-back-map-btn');
    els.stageChip      = document.getElementById('mqst-stage-chip');
    els.progressTrack  = document.querySelector('#mqst-battle-view .mqst-progress-track');
    els.qProgressText  = document.getElementById('mqst-q-progress-text');
    els.comboPill      = document.getElementById('mqst-combo-pill');
    els.comboCount     = document.getElementById('mqst-combo-count');
    els.progressFill   = document.getElementById('mqst-progress-fill');

    els.stageArena     = document.getElementById('mqst-stage-arena');
    els.stageBgImg     = document.getElementById('mqst-stage-bg-img');
    els.heroActor      = document.getElementById('mqst-hero-actor');
    els.heroAura       = document.getElementById('mqst-hero-aura');
    els.heroSvg        = document.getElementById('mqst-hero-svg');
    els.partnerActor   = document.getElementById('mqst-partner-actor');
    els.partnerSpeech  = document.getElementById('mqst-partner-speech');
    els.partnerSvg     = document.getElementById('mqst-partner-svg');
    els.partnerLabel   = document.getElementById('mqst-partner-label');
    els.partnerSkillBtn= document.getElementById('mqst-partner-skill-btn');
    els.projectile     = document.getElementById('mqst-projectile');
    els.partnerProjectile = document.getElementById('mqst-partner-projectile');
    els.enemyActor     = document.getElementById('mqst-enemy-actor');
    els.bossSvg        = document.getElementById('mqst-boss-svg');
    els.bossName       = document.getElementById('mqst-boss-name');
    els.bossShieldRow  = document.getElementById('mqst-boss-shield-row');
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
    els.paneWardrobe   = document.getElementById('mqst-pane-wardrobe');
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
  function syncAudioButtons(){
    var bOn = (MathApp.audio && MathApp.audio.isBgmOn) ? MathApp.audio.isBgmOn() : true;
    var sOn = (MathApp.audio && MathApp.audio.isSoundOn) ? MathApp.audio.isSoundOn() : true;
    var vOn = (MathApp.audio && MathApp.audio.isVoiceOn) ? MathApp.audio.isVoiceOn() : true;

    [els.mapBgmBtn, els.battleBgmBtn].forEach(function(btn){
      if(!btn) return;
      var iconOnly = btn.classList.contains('icon-only');
      btn.setAttribute('aria-pressed', String(bOn));
      btn.classList.toggle('is-off', !bOn);
      btn.innerHTML = '<i data-lucide="music" aria-hidden="true"></i>' +
        (iconOnly ? '' : '<span>' + (bOn ? '音樂' : '音樂(關)') + '</span>');
    });

    [els.mapSoundBtn, els.battleSoundBtn].forEach(function(btn){
      if(!btn) return;
      var iconOnly = btn.classList.contains('icon-only');
      btn.setAttribute('aria-pressed', String(sOn));
      btn.classList.toggle('is-off', !sOn);
      btn.innerHTML = '<i data-lucide="' + (sOn ? 'volume-2' : 'volume-x') + '" aria-hidden="true"></i>' +
        (iconOnly ? '' : '<span>' + (sOn ? '音效' : '靜音') + '</span>');
    });

    [els.mapVoiceBtn, els.battleVoiceBtn].forEach(function(btn){
      if(!btn) return;
      var iconOnly = btn.classList.contains('icon-only');
      btn.setAttribute('aria-pressed', String(vOn));
      btn.classList.toggle('is-off', !vOn);
      btn.innerHTML = '<i data-lucide="' + (vOn ? 'speech' : 'message-square-off') + '" aria-hidden="true"></i>' +
        (iconOnly ? '' : '<span>' + (vOn ? '語音' : '無聲') + '</span>');
    });

    if(MathApp.refreshIcons) MathApp.refreshIcons();
  }

  function openArcade(){
    if(!els.arcadeOverlay) return;
    session.arcadeOpen = true;
    els.arcadeOverlay.classList.add('is-open');
    els.arcadeOverlay.setAttribute('aria-hidden', 'false');
    syncAudioButtons();
    showView('map');
  }

  function closeArcade(){
    if(!els.arcadeOverlay) return;
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(MathApp.audio && MathApp.audio.stopBgm) MathApp.audio.stopBgm();
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
    var costumes = countUnlockedCostumes();

    if(els.totalStars)     els.totalStars.textContent     = String(stars);
    if(els.gemCount)       els.gemCount.textContent       = String(gems);
    if(els.spriteCount)    els.spriteCount.textContent    = String(sprites);
    if(els.launchStars)    els.launchStars.textContent    = String(stars);
    if(els.launchGems)     els.launchGems.textContent     = String(gems);
    if(els.launchSprites)  els.launchSprites.textContent  = String(sprites);
    if(els.launchCostumes) els.launchCostumes.textContent = String(costumes);

    if(els.openWardrobeBtn){
      els.openWardrobeBtn.classList.toggle('has-new', Boolean(saveData.hasNewCostume));
    }

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
        ' aria-label="' + st.id + ' ' + st.label + (st.isBoss && stars === 0 ? '（打敗可收服守護精靈）' : '') + '">' +
        (st.isBoss && stars === 0 ? '<span class="mqst-boss-sprite-tag">🥚 收服精靈</span>' : '') +
        '<span class="mqst-map-node-id">' + (st.isBoss ? '👑' : '') + st.id + '</span>' +
        '<span class="mqst-map-node-stars">' + (unlocked ? formatStarsStr(stars) : '🔒') + '</span>' +
        '<span class="mqst-map-node-title">' + st.label + '</span>' +
        '</button>';
    });
    els.islandsGrid.innerHTML = nodeHtml;

    // 4. 放置粉紅小兔子與守護小精靈跟班在目前進度關卡上
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

    var partner = getActivePartnerIsland();
    if(els.partnerMapAvatar){
      if(partner){
        els.partnerMapAvatar.style.display = 'block';
        els.partnerMapAvatar.innerHTML = getCharacterSvg(partner.theme, false, 'normal');
        els.partnerMapAvatar.style.left = focusStage.mapPos.x + '%';
        els.partnerMapAvatar.style.top  = focusStage.mapPos.y + '%';
        if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
        runAnim(function(gsap){
          partnerIdleTween = gsap.to(els.partnerMapAvatar, {
            y: -6, duration: 0.62, delay: 0.12, repeat: -1, yoyo: true, ease: 'sine.inOut'
          });
        });
      } else {
        if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
        els.partnerMapAvatar.style.display = 'none';
        els.partnerMapAvatar.innerHTML = '';
      }
    }

    // 5. 動態更新地圖底部探索與收服小精靈提示
    if(els.mapTip){
      var focusIsland = getIslandById(focusStage.islandId);
      var focusStars = Number(saveData.stageStars[focusStage.id] || 0);
      if(focusStage.isBoss && focusStars === 0 && focusIsland){
        els.mapTip.textContent = '👑 【' + focusStage.label + '】就在前方！打敗牠就能收服【' + focusIsland.spriteName + '】加入隊伍喔！';
      } else if(partner){
        els.mapTip.textContent = '🐣 【' + partner.spriteName + '】正陪著粉紅小兔冒險中！可在右上「圖鑑」切換精靈夥伴。';
      } else {
        els.mapTip.textContent = '✨ 點擊發亮的關卡圓牌開始冒險！打敗各島 👑 魔王關就能收服守護小精靈喔！';
      }
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
    clearSpeakTimer();
    if(MathApp.stopSpeak) MathApp.stopSpeak();
    if(els.mapView)    els.mapView.style.display    = (viewName === 'map') ? 'flex' : 'none';
    if(els.battleView) els.battleView.style.display = (viewName === 'battle') ? 'flex' : 'none';
    if(els.resultView) els.resultView.style.display = (viewName === 'result') ? 'flex' : 'none';

    if(viewName === 'map'){
      session.active = false;
      session.isMovingOnMap = false;
      renderMap();
      if(session.arcadeOpen && MathApp.audio && MathApp.audio.startBgm){
        MathApp.audio.startBgm('map');
      }
    } else if(viewName === 'result'){
      if(MathApp.audio && MathApp.audio.stopBgm){
        MathApp.audio.stopBgm();
      }
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
    if(partnerIdleTween){ partnerIdleTween.kill(); partnerIdleTween = null; }
    if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
    else if(MathApp.sfx) MathApp.sfx('pop');

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

    if(els.partnerMapAvatar && getActivePartnerIsland()){
      tl.to(els.partnerMapAvatar, {
        left: st.mapPos.x + '%',
        top: st.mapPos.y + '%',
        duration: 0.48,
        ease: 'power2.inOut'
      }, 0.08).to(els.partnerMapAvatar, {
        y: -14,
        scale: 1.12,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power1.out'
      }, 0.56);
    }
  }

  /* ---------------- 開始關卡或特訓戰鬥 ---------------- */
  function startStage(stageId){
    var st = getStageById(stageId);
    if(!st || !isStageUnlocked(stageId)) return;

    session.active = true;
    session.isRescueMode = false;
    session.isGemHuntMode = false;
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
    session.bossShieldMax = st.isBoss ? ((st.islandId === 'forest' || st.islandId === 'workshop') ? 1 : 2) : 0;
    session.bossShield = session.bossShieldMax;
    session.partnerUsedSkill = false;

    var isl = getIslandById(st.islandId);
    beginBattleUI(st.id + ' · ' + st.label, isl.bgImg, st.islandId, st.isBoss ? st.boss : null);
  }

  function startRescueBattle(){
    if(saveData.rescueQueue.length === 0) return;
    session.active = true;
    session.isRescueMode = true;
    session.isGemHuntMode = false;
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
    session.bossShieldMax = 0;
    session.bossShield = 0;
    session.partnerUsedSkill = false;

    beginBattleUI('🆘 求救小精靈特訓', 'assets/quest/bg-garden.jpg', 'garden', null);
  }

  function startGemHuntBattle(){
    var unlit = getCollectableUnlitGems();
    if(unlit.length === 0) return;
    if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();

    session.active = true;
    session.isRescueMode = false;
    session.isGemHuntMode = true;
    session.stage = null;
    session.questions = buildGemHuntQuestions(unlit);
    session.idx = 0;
    session.combo = 0;
    session.maxCombo = 0;
    session.firstTryCorrect = 0;
    session.usedHelperInStage = false;
    session.newGemsThisRun = [];
    session.enemyMaxHp = session.questions.length;
    session.enemyHp = session.enemyMaxHp;
    session.bossShieldMax = 0;
    session.bossShield = 0;
    session.partnerUsedSkill = false;

    beginBattleUI('💎 未點亮寶石補完特訓', 'assets/quest/bg-castle.jpg', 'castle', null);
  }

  function updateBattleMoods(heroMood, enemyMood, partnerMood){
    if(els.heroSvg){
      els.heroSvg.innerHTML = getPinkBunnySvg(heroMood || (session.combo >= 3 ? 'fever' : 'normal'));
    }
    if(els.bossSvg){
      if(session.battleBossObj){
        els.bossSvg.innerHTML = getCharacterSvg(session.battleBossObj.svgKey, true, enemyMood || (session.enemyHp === 0 ? 'dizzy' : 'normal'));
      } else {
        els.bossSvg.innerHTML = getStageChestSvg(session.battleTheme || 'forest', enemyMood || (session.enemyHp === 0 ? 'open' : 'normal'));
      }
    }
    var partner = getActivePartnerIsland();
    if(partner && els.partnerSvg){
      els.partnerSvg.innerHTML = getCharacterSvg(partner.theme, false, partnerMood || 'normal');
    }
  }

  function setPartnerSpeech(text){
    if(!els.partnerSpeech) return;
    if(!text){
      els.partnerSpeech.textContent = '';
      els.partnerSpeech.classList.remove('visible');
      return;
    }
    els.partnerSpeech.textContent = text;
    els.partnerSpeech.classList.add('visible');
  }

  function updatePartnerSkillButton(){
    if(!els.partnerSkillBtn) return;
    var partner = getActivePartnerIsland();
    if(!partner){
      els.partnerSkillBtn.style.display = 'none';
      return;
    }
    els.partnerSkillBtn.style.display = 'inline-flex';
    els.partnerSkillBtn.disabled = Boolean(session.partnerUsedSkill);
    els.partnerSkillBtn.textContent = session.partnerUsedSkill ? '✨ 魔法已施展' : '✨ 精靈魔法';
  }

  function beginBattleUI(chipTitle, bgSrc, theme, bossObj){
    session.battleTheme = theme;
    session.battleBossObj = bossObj;
    showView('battle');
    if(MathApp.audio && MathApp.audio.startBgm){
      MathApp.audio.startBgm(bossObj ? 'boss' : 'battle');
    }
    if(els.stageChip) els.stageChip.textContent = chipTitle;
    if(els.stageBgImg) els.stageBgImg.src = bgSrc;
    if(els.stageArena) els.stageArena.setAttribute('data-theme', theme);

    if(bossObj){
      if(els.bossName)  els.bossName.textContent  = bossObj.name;
      if(els.bossTaunt) els.bossTaunt.textContent = session.bossShield > 0
        ? ('「先打破我的 ' + session.bossShield + ' 層魔法護盾再說吧！」')
        : bossObj.tauntStart;
    } else {
      if(els.bossName)  els.bossName.textContent  = session.isRescueMode ? '迷路小精靈籠子' : (session.isGemHuntMode ? '閃耀寶石守護箱' : '關卡寶箱怪');
      if(els.bossTaunt) els.bossTaunt.textContent = session.isRescueMode
        ? '「快用正確口訣打開魔法鎖！」'
        : (session.isGemHuntMode ? '「一次答對就能立刻點亮新寶石喔！」' : '「答對全部題目就能打開大寶箱！」');
    }

    var partner = getActivePartnerIsland();
    if(els.partnerActor){
      if(partner){
        els.partnerActor.style.display = 'flex';
        if(els.partnerLabel) els.partnerLabel.textContent = partner.spriteName;
        setPartnerSpeech('一起加油吧！');
      } else {
        els.partnerActor.style.display = 'none';
        setPartnerSpeech('');
      }
    }

    updateBattleMoods('normal', 'normal', 'normal');
    updatePartnerSkillButton();
    renderEnemyHp();
    updateComboUI();
    renderCurrentQuestion();

    // 若挑戰尚未通關的島嶼魔王，提示孩子打敗即可收服該島守護小精靈
    if(bossObj && session.stage && Number(saveData.stageStars[session.stage.id] || 0) === 0 && els.feedback){
      var bossIsl = getIslandById(session.stage.islandId);
      if(bossIsl){
        els.feedback.textContent = '🥚 打敗 ' + bossObj.name + '，即可收服守護小精靈【' + bossIsl.spriteName + '】！';
        els.feedback.className = 'mqst-stage-toast hint';
      }
    }
  }

  function renderEnemyHp(){
    if(els.bossShieldRow){
      if(session.bossShieldMax > 0){
        els.bossShieldRow.style.display = 'flex';
        if(session.bossShield > 0){
          var shields = '';
          for(var s = 0; s < session.bossShieldMax; s++){
            shields += '<span class="mqst-shield-pip' + (s >= session.bossShield ? ' broken' : '') + '">🛡️</span>';
          }
          els.bossShieldRow.innerHTML = shields + '<span class="mqst-shield-txt">魔法護盾 ' + session.bossShield + ' 層</span>';
        } else {
          els.bossShieldRow.innerHTML = '<span class="mqst-shield-txt broken-all">💥 護盾全破！全力進攻！</span>';
        }
      } else {
        els.bossShieldRow.style.display = 'none';
        els.bossShieldRow.innerHTML = '';
      }
    }

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

  /**
   * 同步更新頂部戰鬥進度條與已完成題數文字（數值與填滿比例完全一致）
   * @param {number} completedCount 目前已答對完成的題數
   */
  function updateBattleProgressUI(completedCount){
    var total = session.questions.length || 1;
    var done = Math.max(0, Math.min(total, Number(completedCount) || 0));
    var pct = Math.round((done / total) * 100);
    if(els.qProgressText) els.qProgressText.textContent = '完成 ' + done + ' / ' + total;
    if(els.progressFill)  els.progressFill.style.width = pct + '%';
    if(els.progressTrack) els.progressTrack.setAttribute('aria-valuenow', String(pct));
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
    updateBattleMoods(session.combo >= 3 ? 'fever' : 'normal', 'normal', 'normal');
    updatePartnerSkillButton();
    updateBattleProgressUI(session.idx);

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
      if(q.qType === 'commutative'){
        eqHtml = '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>×</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>＝</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><span class="mq-num-box" style="background:#fef9c3;">？</span>';
      } else if(q.qType === 'missing_b'){
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
      if(q.qType === 'commutative'){
        eqHtml = '<span class="mq-num-box" style="color:var(--t-color-dark);background:#ffedd5;">' + q.b + '</span><span>×</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>＝</span><span class="mq-num-box" style="color:var(--h-color-dark);background:#dbeafe;">' + q.a + '</span><span>×</span><input type="text" class="mq-input-slot" data-slot-id="ans" maxlength="1" inputmode="none" readonly aria-label="輸入交換後的乘數" placeholder="?">';
      } else if(q.qType === 'missing_b'){
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

    scheduleSpeak(q.spokenPrompt, 120);
  }

  /* ---------------- 粉紅小兔攻擊演出 & 精靈助陣 & 答對/答錯 ---------------- */
  function usePartnerSkill(){
    if(!session.active || session.locked || session.partnerUsedSkill) return;
    var q = session.questions[session.idx];
    var partner = getActivePartnerIsland();
    if(!q || !partner) return;

    session.partnerUsedSkill = true;
    updatePartnerSkillButton();
    updateBattleMoods(session.combo >= 3 ? 'fever' : 'happy', 'normal', 'happy');
    if(MathApp.sfx) MathApp.sfx('magic');

    runAnim(function(gsap){
      if(els.partnerActor){
        gsap.fromTo(els.partnerActor, { y: 0, scale: 1 }, { y: -14, scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
      }
    });

    if(q.uiMode === 'choice' && els.choicesGrid){
      var bubbles = els.choicesGrid.querySelectorAll('.mqst-choice-bubble:not(:disabled)');
      var wrongBtns = [];
      for(var i = 0; i < bubbles.length; i++){
        if(Number(bubbles[i].getAttribute('data-choice')) !== q.slots[0].expected){
          wrongBtns.push(bubbles[i]);
        }
      }
      if(wrongBtns.length > 0){
        var picked = wrongBtns[MathApp.utils.randInt(0, wrongBtns.length - 1)];
        picked.classList.add('is-wrong');
        picked.disabled = true;
        setPartnerSpeech('幫你變走一個錯答案囉！');
        if(els.feedback){
          els.feedback.textContent = '✨ ' + partner.spriteName + ' 施展魔法！消除了 1 個干擾選項（不影響滿星！）';
          els.feedback.className = 'mqst-stage-toast good';
        }
        return;
      }
    }

    // 鍵盤題或無法消除泡泡時，免費展開魔法積木輔助且不扣三星資格
    if(els.helperDrawer && !els.helperDrawer.classList.contains('open')){
      els.helperDrawer.classList.add('open');
    }
    setPartnerSpeech('積木提示免費幫你看，一樣拿滿星！');
    if(els.feedback){
      els.feedback.textContent = '✨ ' + partner.spriteName + ' 施展魔法！免費打開積木提示（不影響滿星！）';
      els.feedback.className = 'mqst-stage-toast good';
    }
  }

  function playBunnyAttackAnim(isCombo, shieldEvent, partner){
    var dualAttack = Boolean(partner && session.combo >= 2);
    if(els.projectile){
      els.projectile.textContent = (isCombo && session.bossShield === 0) ? '💫' : '🌟';
    }
    if(els.partnerProjectile && dualAttack){
      els.partnerProjectile.textContent = partner.partnerProjectile || '✨';
    }
    runAnim(function(gsap){
      var tl = gsap.timeline();
      if(els.heroActor){
        tl.to(els.heroActor, { y: -18, duration: 0.14, ease: 'power1.out' })
          .to(els.heroActor, { y: 0, duration: 0.18, ease: 'bounce.out', clearProps: 'transform' });
      }
      if(els.partnerActor && dualAttack){
        tl.to(els.partnerActor, { y: -16, duration: 0.14, ease: 'power1.out' }, 0.04)
          .to(els.partnerActor, { y: 0, duration: 0.18, ease: 'bounce.out', clearProps: 'transform' });
      }
      if(els.projectile){
        tl.fromTo(els.projectile,
          { autoAlpha: 1, x: 0, y: 0, scale: 0.8, rotation: 0 },
          { autoAlpha: 0, x: 260, y: -30, scale: isCombo ? 1.8 : 1.5, rotation: 360, duration: 0.34, ease: 'power2.in' },
          0.05
        );
      }
      if(els.partnerProjectile && dualAttack){
        tl.fromTo(els.partnerProjectile,
          { autoAlpha: 1, x: 0, y: 0, scale: 0.85, rotation: 0 },
          { autoAlpha: 0, x: 245, y: -42, scale: 1.55, rotation: -320, duration: 0.34, ease: 'power2.in' },
          0.09
        );
      }
      if(els.enemyActor){
        tl.to(els.enemyActor, { scaleX: 1.14, scaleY: 0.86, x: 10, duration: 0.09 }, 0.3)
          .to(els.enemyActor, { scaleX: 1, scaleY: 1, x: 0, duration: 0.3, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
      }
      if(els.hitCallout){
        if(shieldEvent === 'broken-all'){
          els.hitCallout.textContent = '護盾全破 💥';
        } else if(shieldEvent === 'crack'){
          els.hitCallout.textContent = '護盾碎裂 🛡️';
        } else if(dualAttack){
          els.hitCallout.textContent = '精靈合擊 ×' + session.combo + ' 🔥';
        } else {
          els.hitCallout.textContent = isCombo ? ('COMBO ×' + session.combo + ' 🔥') : 'GREAT! ✨';
        }
        tl.fromTo(els.hitCallout,
          { autoAlpha: 1, y: 10, scale: 0.6 },
          { autoAlpha: 0, y: -28, scale: 1.15, duration: 0.72, ease: 'back.out(1.6)' },
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
    if((cleanFirstTry || session.isRescueMode || session.isGemHuntMode) && !saveData.gems[gemKey]){
      saveData.gems[gemKey] = true;
      session.newGemsThisRun.push(gemKey);
    }

    if(session.isRescueMode && q.rescueKey){
      saveData.rescueQueue = saveData.rescueQueue.filter(function(k){ return k !== q.rescueKey; });
      saveData.stats.rescuedCount++;
    }

    var shieldEvent = '';
    if(session.bossShield > 0){
      session.bossShield--;
      shieldEvent = (session.bossShield === 0) ? 'broken-all' : 'crack';
    }

    session.enemyHp = Math.max(0, session.enemyHp - 1);
    renderEnemyHp();
    updateBattleProgressUI(session.idx + 1);
    updateComboUI();
    persistSave();
    updateHubStats();

    if(session.stage && session.stage.isBoss && els.bossTaunt){
      if(session.enemyHp === 0){
        els.bossTaunt.textContent = session.stage.boss.tauntWin;
      } else if(shieldEvent === 'broken-all'){
        els.bossTaunt.textContent = '「糟糕！我的魔法護盾被打破啦！」';
      } else {
        els.bossTaunt.textContent = session.stage.boss.tauntHit;
      }
    } else if(els.bossTaunt){
      els.bossTaunt.textContent = (session.enemyHp === 0) ? '「寶箱喀嚓打開啦！太棒了！」' : '「漂亮的一擊！繼續加油！」';
    }

    if(MathApp.audio && MathApp.audio.sfxCombo){
      MathApp.audio.sfxCombo(session.combo, Boolean(session.stage && session.stage.isBoss));
    } else if(MathApp.sfx){
      MathApp.sfx(session.combo >= 3 ? 'combo' : (session.stage && session.stage.isBoss ? 'hit' : 'correct'));
    }

    var partner = getActivePartnerIsland();
    var heroMood = session.combo >= 3 ? 'fever' : 'happy';
    var enemyMood = session.enemyHp === 0 ? (session.battleBossObj ? 'dizzy' : 'open') : 'hit';
    updateBattleMoods(heroMood, enemyMood, 'happy');
    if(partner && partner.partnerCheers && partner.partnerCheers.length > 0){
      var cheer = partner.partnerCheers[(session.combo - 1) % partner.partnerCheers.length];
      setPartnerSpeech(cheer);
    }

    playBunnyAttackAnim(session.combo >= 3, shieldEvent, partner);

    var gemNote = session.newGemsThisRun.indexOf(gemKey) !== -1 ? ('（💎 新點亮 ' + q.a + '×' + q.b + ' 寶石！）') : '';
    var shieldNote = shieldEvent === 'broken-all' ? ' 💥 Boss 護盾全破！' : (shieldEvent === 'crack' ? ' 🛡️ 擊碎一層護盾！' : '');
    if(els.feedback){
      els.feedback.textContent = '🎉 答對了！' + shieldNote + gemNote;
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

    // 延遲 340ms 再朗讀口訣，避免與答對叮咚音效重疊互吃聲音
    scheduleSpeak('答對了！' + q.mantra, 340);

    runAnim(function(gsap){
      if(els.nextBtn) gsap.fromTo(els.nextBtn, { scale: 0.85 }, { scale: 1, duration: 0.25, ease: 'back.out(1.7)', clearProps: 'transform' });
    });
  }

  function handleWrong(q){
    clearSpeakTimer();
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
    updateBattleMoods('oops', 'normal', 'normal');
    if(getActivePartnerIsland()){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }

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
    clearSpeakTimer();
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
    clearSpeakTimer();
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
    updateBattleMoods('oops', 'normal', 'normal');
    if(getActivePartnerIsland()){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }
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
    clearSpeakTimer();
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
    updateBattleProgressUI(session.questions.length);
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
            // 收服新精靈時自動派牠成為冒險夥伴
            saveData.activePartner = unlockedSprite.id;
            break;
          }
        }
      }
    }

    var newBadges = checkAndUnlockBadges();
    var newCostumes = checkAndUnlockCostumes(false);
    persistSave();
    updateHubStats();

    var partner = getActivePartnerIsland();
    if(els.victoryBunny) els.victoryBunny.innerHTML = getPinkBunnySvg('happy');
    if(els.victorySprite){
      var showSp = unlockedSprite || partner;
      if(showSp){
        els.victorySprite.style.display = 'block';
        els.victorySprite.innerHTML = getCharacterSvg(showSp.theme, false, 'happy');
      } else {
        els.victorySprite.style.display = 'none';
      }
    }

    if(els.resFirstAcc) els.resFirstAcc.textContent = session.firstTryCorrect + ' / ' + total;
    if(els.resNewGems)  els.resNewGems.textContent  = '+' + session.newGemsThisRun.length + ' 💎';
    if(els.resMaxCombo) els.resMaxCombo.textContent = session.maxCombo + ' 🔥';

    if(session.isRescueMode){
      var remainingRescue = saveData.rescueQueue.length;
      if(remainingRescue === 0){
        els.resultTitle.textContent = '🆘 求救小精靈全數救出！';
        els.resultSub.textContent = '粉紅小兔把你卡住的乘法通通變成強項囉！';
      } else {
        els.resultTitle.textContent = '🆘 本批小精靈救出成功！';
        els.resultSub.textContent = '還有 ' + remainingRescue + ' 隻迷路小精靈在等你，回地圖再救援一次吧！';
      }
      els.resNextBtn.style.display = 'none';
      els.resRetryBtn.style.display = 'none';
    } else if(session.isGemHuntMode){
      els.resultTitle.textContent = '💎 寶石補完特訓完成！';
      els.resultSub.textContent = session.newGemsThisRun.length > 0
        ? ('太棒了！又替 81 格寶石牆點亮了 ' + session.newGemsThisRun.length + ' 顆閃亮寶石！')
        : '完成特訓！再多試一次，就能把沒亮的寶石一次點亮喔！';
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
        getCharacterSvg(unlockedSprite.theme, false, 'happy') +
        '<div><div>🎉 成功收服守護小精靈：【' + unlockedSprite.spriteName + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + unlockedSprite.spriteDesc + '</div>' +
        '<div class="mqst-unlock-subnote">🤝 已自動加入冒險隊伍！戰鬥時點「✨ 精靈魔法」可幫忙解圍，2連擊還會合體攻擊！</div></div></div>';
    }
    newCostumes.forEach(function(c){
      var isEq = (getActiveCostumeId() === c.id);
      showcaseHtml += '<div class="mqst-unlock-banner is-costume">' +
        '<div class="mqst-unlock-costume-main">' +
          getPinkBunnySvg('happy', c.id) +
          '<div><div>' + c.icon + ' 解鎖小兔新造型：【' + c.name + '】！</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + c.goalText + ' 達成！' + c.desc + '</div></div>' +
        '</div>' +
        '<button type="button" class="mqst-unlock-equip-btn' + (isEq ? ' equipped' : '') + '" data-quick-equip-costume="' + c.id + '">' +
          (isEq ? '✅ 已換上！' : '✨ 馬上換上') +
        '</button></div>';
    });
    newBadges.forEach(function(b){
      showcaseHtml += '<div class="mqst-unlock-banner" style="background:linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%);">' +
        '<span style="font-size:34px;">' + b.icon + '</span>' +
        '<div><div>🏅 解鎖新成就徽章：【' + b.name + '】！</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink-soft);">' + b.desc + '</div></div></div>';
    });
    els.unlockShowcase.innerHTML = showcaseHtml;

    if(unlockedSprite && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎉 成功收服【' + unlockedSprite.spriteName + '】！已加入你的冒險隊伍！');
    } else if(newCostumes.length > 0 && MathApp.utils && MathApp.utils.showToast){
      MathApp.utils.showToast('🎀 解鎖小兔新造型【' + newCostumes[0].name + '】！點「馬上換上」試穿吧！');
    }

    if(MathApp.sfx) MathApp.sfx('fanfare');
    if(MathApp.utils && MathApp.utils.launchConfetti){
      MathApp.utils.launchConfetti(stars === 3 || Boolean(unlockedSprite) || newCostumes.length > 0);
    }
    var costumeVoiceNote = newCostumes.length > 0
      ? ('，還解鎖了小兔新造型 ' + newCostumes[0].name + ' 喔！')
      : '';
    var victoryMsg = session.isRescueMode
      ? (saveData.rescueQueue.length === 0 ? '太棒了，求救小精靈全部救出來了！' : ('太棒了！還有 ' + saveData.rescueQueue.length + ' 隻小精靈等你去救喔！'))
      : (session.isGemHuntMode
          ? ('太厲害了，寶石補完特訓完成' + costumeVoiceNote)
          : (unlockedSprite
              ? ('恭喜過關獲得 ' + stars + ' 顆星！還成功收服了守護小精靈 ' + unlockedSprite.spriteName + costumeVoiceNote)
              : ('恭喜過關！獲得 ' + stars + ' 顆星' + costumeVoiceNote)));
    scheduleSpeak(victoryMsg, 420);

    runAnim(function(gsap){
      var tl = gsap.timeline();
      tl.fromTo(els.resultCard, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'transform,opacity,visibility' });
      if(els.victoryBunny){
        tl.to(els.victoryBunny, { y: -14, duration: 0.32, yoyo: true, repeat: 3, ease: 'power1.out', clearProps: 'transform' }, '<0.1');
      }
      var unlockBanners = els.unlockShowcase ? els.unlockShowcase.querySelectorAll('.mqst-unlock-banner') : [];
      if(unlockBanners.length > 0){
        tl.fromTo(unlockBanners, { scale: 0.84, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.38, stagger: 0.12, ease: 'back.out(1.7)', clearProps: 'transform,opacity,visibility' }, 0.25);
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
    var collectableUnlit = getCollectableUnlitGems();
    var gemHtml = '<div class="mqst-gem-summary">' +
      '<span>💎 已點亮九九乘法寶石：<b>' + litCount + ' / 81</b> 格</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">點擊任一格子可聽口訣或查看該去哪關點亮！</span>' +
      '</div><div class="mqst-gem-grid">';
    gemHtml += '<div class="mqst-gem-cell head">×</div>';
    for(var c = 1; c <= 9; c++) gemHtml += '<div class="mqst-gem-cell head">' + c + '</div>';
    for(var r = 1; r <= 9; r++){
      gemHtml += '<div class="mqst-gem-cell head">' + r + '</div>';
      for(var col = 1; col <= 9; col++){
        var lit = Boolean(saveData.gems[r + 'x' + col]);
        gemHtml += '<button type="button" class="mqst-gem-cell' + (lit ? ' lit' : '') + '"' +
          ' data-gem-a="' + r + '" data-gem-b="' + col + '" data-gem-lit="' + (lit ? '1' : '0') + '"' +
          ' aria-label="' + r + ' 乘以 ' + col + (lit ? (' 等於 ' + (r * col) + '，點擊朗讀口訣') : ' 尚未點亮，點擊查看提示') + '">' +
          (lit ? (r * col) : '·') + '</button>';
      }
    }
    gemHtml += '</div>';
    gemHtml += '<div class="mqst-gem-inspector" id="mqst-gem-inspector">' +
      '<span class="mqst-gem-inspector-msg" id="mqst-gem-inspector-msg">👆 點擊上方寶石格，可以聽口訣或查看對應關卡喔！</span>' +
      '<div class="mqst-gem-inspector-actions" id="mqst-gem-inspector-actions">' +
      (collectableUnlit.length > 0
        ? ('<button type="button" class="mqst-tool-btn mqst-gem-hunt-btn" id="mqst-gem-hunt-btn">✨ 補齊未點亮寶石（剩 ' + collectableUnlit.length + ' 顆）</button>')
        : '<span class="mqst-gem-all-done">🎉 已收齊目前可收集的全部寶石！</span>') +
      '</div></div>';
    if(els.paneGems) els.paneGems.innerHTML = gemHtml;

    var spHtml = '<div class="mqst-gem-summary">' +
      '<span>🐣 已收服守護小精靈：<b>' + countUnlockedSprites() + ' / ' + ISLANDS.length + '</b> 隻</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">打敗每座島嶼的 👑 魔王關即可收服！點「帶牠去冒險」可派牠上場施展魔法。</span>' +
      '</div><div class="mqst-collection-grid">';
    ISLANDS.forEach(function(isl){
      var got = Number(saveData.stageStars[isl.bossStageId] || 0) >= 1;
      var equipped = got && saveData.activePartner === isl.id;
      var bossSt = getStageById(isl.bossStageId);
      var bossUnlocked = isStageUnlocked(isl.bossStageId);
      spHtml += '<div class="mqst-collect-card' + (got ? '' : ' locked') + (equipped ? ' is-equipped' : '') + '">' +
        (equipped ? '<span class="mqst-equipped-tag">⭐ 同行夥伴</span>' : '') +
        '<div class="mqst-collect-art">' + getCharacterSvg(isl.theme, false, equipped ? 'happy' : 'normal') + '</div>' +
        '<div class="mqst-collect-name">' + (got ? isl.spriteName : '???（尚未收服）') + '</div>' +
        '<p class="mqst-collect-desc">' + isl.spriteDesc + '</p>' +
        (got
          ? ('<p class="mqst-collect-skill">' + isl.partnerProjectile + ' 助陣魔法：' + isl.partnerSkillDesc + '</p>' +
             '<button type="button" class="mqst-sprite-equip-btn' + (equipped ? ' active' : '') + '" data-equip-sprite="' + isl.id + '">' +
             (equipped ? '✅ 目前同行中（點此休息）' : '🤝 帶牠去冒險') + '</button>')
          : ('<p class="mqst-collect-skill mqst-locked-goal">👑 打敗【' + isl.bossStageId + ' · ' + (bossSt ? bossSt.label : '島嶼魔王') + '】即可收服</p>' +
             (bossUnlocked ? ('<button type="button" class="mqst-sprite-equip-btn goto" data-goto-boss="' + isl.bossStageId + '">⚔️ 前往挑戰 ' + isl.bossStageId + '</button>') : ''))) +
        '</div>';
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

    renderWardrobePane();
  }

  function renderWardrobePane(){
    if(!els.paneWardrobe) return;
    var activeId = getActiveCostumeId();
    var activeCostume = getCostumeById(activeId);
    var stars = countTotalStars();
    var gems = countLitGems();
    var unlockedCount = countUnlockedCostumes();
    var collectableUnlit = getCollectableUnlitGems();

    // 找出下一個最近即將解鎖的造型預告
    var nextHintHtml = '';
    var nextLocked = null;
    var bestRemainRatio = 2;
    BUNNY_COSTUMES.forEach(function(c){
      var prog = getCostumeProgress(c);
      if(!prog.unlocked){
        var ratio = (prog.target - prog.current) / prog.target;
        if(ratio < bestRemainRatio){
          bestRemainRatio = ratio;
          nextLocked = { costume: c, prog: prog };
        }
      }
    });
    if(nextLocked){
      var diff = Math.max(1, nextLocked.prog.target - nextLocked.prog.current);
      nextHintHtml = '<div class="mqst-wardrobe-next-tip">🎯 下一個目標：再收集 <b>' + diff + ' ' + nextLocked.prog.unit + '</b>，就能解鎖【' +
        nextLocked.costume.icon + ' ' + nextLocked.costume.name + '】喔！</div>';
    } else {
      nextHintHtml = '<div class="mqst-wardrobe-next-tip" style="border-color:#16a34a;color:#14532d;background:#dcfce7;">🎉 太厲害了！你已集齊全部 <b>' + BUNNY_COSTUMES.length + '</b> 款小兔夢幻造型！</div>';
    }

    var wbHtml = '<div class="mqst-gem-summary">' +
      '<span>🎀 已解鎖小兔造型：<b>' + unlockedCount + ' / ' + BUNNY_COSTUMES.length + '</b> 款</span>' +
      '<span style="font-size:13px;color:var(--ink-soft);">收集星星與 81 顆寶石就能解鎖頭飾，換上後全遊戲都會變裝喔！</span>' +
      '</div>';

    wbHtml += '<div class="mqst-wardrobe-stage">' +
      '<button type="button" class="mqst-wardrobe-preview-btn" id="mqst-wardrobe-preview-btn" aria-label="點擊試衣鏡中的粉紅小兔互動" title="點點粉紅小兔試穿效果！">' +
        getPinkBunnySvg('happy', activeId) +
      '</button>' +
      '<div class="mqst-wardrobe-info">' +
        '<div class="mqst-wardrobe-current">' + activeCostume.icon + ' 目前穿戴：' + activeCostume.name + '</div>' +
        '<p class="mqst-wardrobe-sub">' + activeCostume.desc + '</p>' +
        '<div class="mqst-wardrobe-meters">' +
          '<span class="mqst-wardrobe-meter-pill">⭐ 星星收集：<b>' + stars + ' / 45</b></span>' +
          '<span class="mqst-wardrobe-meter-pill">💎 寶石圖鑑：<b>' + gems + ' / 81</b></span>' +
        '</div>' +
        nextHintHtml +
      '</div></div>';

    wbHtml += '<div class="mqst-collection-grid">';
    BUNNY_COSTUMES.forEach(function(c){
      var prog = getCostumeProgress(c);
      var isEquipped = prog.unlocked && (activeId === c.id);
      wbHtml += '<div class="mqst-collect-card' + (prog.unlocked ? '' : ' locked') + (isEquipped ? ' is-equipped' : '') + '">' +
        (isEquipped ? '<span class="mqst-equipped-tag">⭐ 穿戴中</span>' : '') +
        '<div class="mqst-costume-art" aria-hidden="true">' + getPinkBunnySvg(isEquipped ? 'happy' : 'normal', c.id) + '</div>' +
        '<div class="mqst-collect-name">' + c.icon + ' ' + c.name + '</div>' +
        '<p class="mqst-collect-desc">' + c.desc + '</p>';

      if(prog.unlocked){
        wbHtml += '<p class="mqst-collect-skill">' + (c.unlockType === 'free' ? '✨ 冒險初始造型' : ('🔓 達成條件：' + c.goalText)) + '</p>' +
          '<button type="button" class="mqst-costume-equip-btn' + (isEquipped ? ' active' : '') + '" data-equip-costume="' + c.id + '" aria-pressed="' + String(isEquipped) + '">' +
            (isEquipped ? '✅ 目前穿戴中' : '👗 換上這套') +
          '</button>';
      } else {
        wbHtml += '<div class="mqst-costume-progress-wrap">' +
          '<div class="mqst-costume-goal-text">🔒 ' + c.goalText + '（' + prog.current + ' / ' + prog.target + '）</div>' +
          '<div class="mqst-costume-progress-track" role="progressbar" aria-label="' + c.name + ' 解鎖進度" aria-valuenow="' + prog.current + '" aria-valuemin="0" aria-valuemax="' + prog.target + '">' +
            '<div class="mqst-costume-progress-fill" style="width:' + prog.pct + '%;"></div>' +
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

    // 漂浮白雲點擊小驚喜彩蛋
    if(els.worldCanvas){
      els.worldCanvas.addEventListener('click', function(e){
        var cloud = e.target.closest('.mqst-cloud-btn');
        if(!cloud) return;
        if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
        else if(MathApp.sfx) MathApp.sfx('pop');
        runAnim(function(gsap){
          gsap.fromTo(cloud, { scale: 1 }, { scale: 1.32, y: -12, duration: 0.18, yoyo: true, repeat: 1, ease: 'back.out(2)', clearProps: 'transform' });
        });
        if(MathApp.utils && MathApp.utils.showToast){
          var msgs = ['☁️ 軟綿綿白雲抖了一下！', '✨ 發現藏在雲裡的幸運微風！', '🐰 小兔子朝白雲揮揮手！'];
          MathApp.utils.showToast(msgs[MathApp.utils.randInt(0, msgs.length - 1)]);
        }
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
    if(els.partnerSkillBtn) els.partnerSkillBtn.addEventListener('click', usePartnerSkill);

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

    function equipCostume(cId, showToast){
      if(!saveData.unlockedCostumes || !saveData.unlockedCostumes[cId]) return false;
      saveData.activeCostume = cId;
      saveData.hasNewCostume = false;
      persistSave();
      syncAllBunnyVisuals();
      updateHubStats();
      if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
      else if(MathApp.sfx) MathApp.sfx('pop');
      if(showToast && MathApp.utils && MathApp.utils.showToast){
        var cObj = getCostumeById(cId);
        MathApp.utils.showToast(cObj.icon + ' 粉紅小兔已經換上【' + cObj.name + '】囉！');
      }
      return true;
    }

    if(els.unlockShowcase){
      els.unlockShowcase.addEventListener('click', function(e){
        var quickBtn = e.target.closest('[data-quick-equip-costume]');
        if(!quickBtn) return;
        var cId = quickBtn.getAttribute('data-quick-equip-costume');
        if(!equipCostume(cId, true)) return;
        els.unlockShowcase.querySelectorAll('[data-quick-equip-costume]').forEach(function(b){
          var active = b.getAttribute('data-quick-equip-costume') === cId;
          b.classList.toggle('equipped', active);
          b.textContent = active ? '✅ 已換上！' : '✨ 馬上換上';
        });
      });
    }

    setupDialogPolyfill(els.dexDialog);
    if(els.dexDialog){
      var dexTabs = Array.prototype.slice.call(els.dexDialog.querySelectorAll('.mqst-dex-tab[data-dex]'));

      function switchDexTab(target, focusTab){
        if(target === 'wardrobe' && saveData.hasNewCostume){
          saveData.hasNewCostume = false;
          persistSave();
          updateHubStats();
        }
        dexTabs.forEach(function(t){
          var act = (t.getAttribute('data-dex') === target);
          t.classList.toggle('active', act);
          t.setAttribute('aria-selected', String(act));
          t.setAttribute('tabindex', act ? '0' : '-1');
          if(act){
            if(t.scrollIntoView){
              try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch(err){}
            }
            if(focusTab) t.focus();
          }
        });
        if(els.paneGems)     els.paneGems.style.display     = (target === 'gems') ? 'block' : 'none';
        if(els.paneWardrobe) els.paneWardrobe.style.display = (target === 'wardrobe') ? 'block' : 'none';
        if(els.paneSprites)  els.paneSprites.style.display  = (target === 'sprites') ? 'block' : 'none';
        if(els.paneBadges)   els.paneBadges.style.display   = (target === 'badges') ? 'block' : 'none';
      }

      function openDexDialog(initialTab){
        if(MathApp.sfx) MathApp.sfx('click');
        var tab = initialTab || 'gems';
        if(tab === 'wardrobe' && saveData.hasNewCostume){
          saveData.hasNewCostume = false;
          persistSave();
          updateHubStats();
        }
        renderDexDialog();
        switchDexTab(tab, false);
        els.dexDialog.showModal();
      }

      if(els.openDexBtn){
        els.openDexBtn.addEventListener('click', function(){ openDexDialog('gems'); });
      }
      if(els.openWardrobeBtn){
        els.openWardrobeBtn.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }
      if(els.hudAvatar){
        els.hudAvatar.addEventListener('click', function(){ openDexDialog('wardrobe'); });
      }

      if(els.paneWardrobe){
        els.paneWardrobe.addEventListener('click', function(e){
          var previewBtn = e.target.closest('#mqst-wardrobe-preview-btn');
          if(previewBtn){
            if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
            else if(MathApp.sfx) MathApp.sfx('pop');
            runAnim(function(gsap){
              gsap.fromTo(previewBtn, { y: 0, scale: 1 }, { y: -10, scale: 1.08, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
            });
            return;
          }
          var gemHuntBtn = e.target.closest('[data-wardrobe-gem-hunt]');
          if(gemHuntBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            startGemHuntBattle();
            return;
          }
          var eqCostumeBtn = e.target.closest('[data-equip-costume]');
          if(!eqCostumeBtn) return;
          var cId = eqCostumeBtn.getAttribute('data-equip-costume');
          if(equipCostume(cId, true)){
            renderWardrobePane();
          }
        });
      }

      if(els.paneGems){
        els.paneGems.addEventListener('click', function(e){
          var huntBtn = e.target.closest('#mqst-gem-hunt-btn');
          if(huntBtn){
            if(MathApp.sfx) MathApp.sfx('click');
            startGemHuntBattle();
            return;
          }

          var gotoBtn = e.target.closest('[data-goto-stage]');
          if(gotoBtn){
            var sid = gotoBtn.getAttribute('data-goto-stage');
            if(MathApp.sfx) MathApp.sfx('click');
            if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
            walkBunnyAndStart(sid);
            return;
          }

          var cell = e.target.closest('button.mqst-gem-cell[data-gem-a]');
          if(!cell) return;
          var ga = Number(cell.getAttribute('data-gem-a'));
          var gb = Number(cell.getAttribute('data-gem-b'));
          var isLit = cell.getAttribute('data-gem-lit') === '1';
          var msgEl = document.getElementById('mqst-gem-inspector-msg');
          var actEl = document.getElementById('mqst-gem-inspector-actions');
          var collectableUnlit = getCollectableUnlitGems();
          var huntBtnHtml = collectableUnlit.length > 0
            ? ('<button type="button" class="mqst-tool-btn mqst-gem-hunt-btn" id="mqst-gem-hunt-btn">✨ 補齊未點亮寶石（剩 ' + collectableUnlit.length + ' 顆）</button>')
            : '';

          if(isLit){
            var mantra = (MathApp.mul && MathApp.mul.getMantra) ? MathApp.mul.getMantra(ga, gb) : (ga + '×' + gb);
            if(MathApp.sfx) MathApp.sfx('pop');
            if(msgEl) msgEl.innerHTML = '💎 <b>' + ga + ' × ' + gb + ' ＝ ' + (ga * gb) + '</b>（口訣：<b>' + mantra + '</b>）';
            if(actEl) actEl.innerHTML = huntBtnHtml;
            scheduleSpeak(mantra + '，' + ga + ' 乘以 ' + gb + ' 等於 ' + (ga * gb), 60);
          } else {
            var rec = findRecommendedStageForTable(ga);
            var unlocked = rec && isStageUnlocked(rec.id);
            if(MathApp.sfx) MathApp.sfx('click');
            if(msgEl){
              msgEl.innerHTML = unlocked
                ? ('🔒 <b>' + ga + ' × ' + gb + '</b> 尚未點亮，可在【<b>' + rec.id + ' · ' + rec.label + '</b>】一次答對點亮！')
                : ('🔒 <b>' + ga + ' × ' + gb + '</b> 尚未點亮，先解鎖【<b>' + rec.id + ' · ' + rec.label + '</b>】就能遇到喔！');
            }
            if(actEl){
              actEl.innerHTML = (unlocked ? ('<button type="button" class="mqst-tool-btn mqst-gem-goto-btn" data-goto-stage="' + rec.id + '">前往 ' + rec.id + '</button>') : '') + huntBtnHtml;
            }
          }
        });
      }

      if(els.paneSprites){
        els.paneSprites.addEventListener('click', function(e){
          var gotoBossBtn = e.target.closest('[data-goto-boss]');
          if(gotoBossBtn){
            var sid = gotoBossBtn.getAttribute('data-goto-boss');
            if(MathApp.sfx) MathApp.sfx('click');
            if(els.dexDialog && els.dexDialog.open) els.dexDialog.close();
            walkBunnyAndStart(sid);
            return;
          }
          var eqBtn = e.target.closest('[data-equip-sprite]');
          if(!eqBtn) return;
          var spId = eqBtn.getAttribute('data-equip-sprite');
          var wasSame = (saveData.activePartner === spId);
          saveData.activePartner = wasSame ? '' : spId;
          persistSave();
          if(MathApp.audio && MathApp.audio.sfxJump) MathApp.audio.sfxJump();
          else if(MathApp.sfx) MathApp.sfx('pop');
          renderDexDialog();
          renderMap();
          if(MathApp.utils && MathApp.utils.showToast){
            if(wasSame){
              MathApp.utils.showToast('已讓守護小精靈先回圖鑑休息囉！');
            } else {
              var picked = getActivePartnerIsland();
              MathApp.utils.showToast('🤝 【' + (picked ? picked.spriteName : '守護小精靈') + '】已加入冒險隊伍！');
            }
          }
        });
      }

      dexTabs.forEach(function(tab, idx){
        tab.addEventListener('click', function(){
          if(MathApp.sfx) MathApp.sfx('click');
          switchDexTab(tab.getAttribute('data-dex'), false);
        });
        tab.addEventListener('keydown', function(e){
          var nextIdx = -1;
          if(e.key === 'ArrowRight') nextIdx = (idx + 1) % dexTabs.length;
          else if(e.key === 'ArrowLeft') nextIdx = (idx - 1 + dexTabs.length) % dexTabs.length;
          else if(e.key === 'Home') nextIdx = 0;
          else if(e.key === 'End') nextIdx = dexTabs.length - 1;
          if(nextIdx !== -1){
            e.preventDefault();
            if(MathApp.sfx) MathApp.sfx('click');
            switchDexTab(dexTabs[nextIdx].getAttribute('data-dex'), true);
          }
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
    updateBattleMoods('oops', 'normal', 'normal');
    if(getActivePartnerIsland()){
      setPartnerSpeech('沒關係！看看積木再試一次！');
    }
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
        syncAllBunnyVisuals();
        renderMap();
        if(els.parentDialog) els.parentDialog.close();
        if(MathApp.sfx) MathApp.sfx('click');
        if(MathApp.utils && MathApp.utils.showToast) MathApp.utils.showToast('已重置所有九九乘法冒險紀錄！');
      });
    }

    [els.mapBgmBtn, els.battleBgmBtn].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleBgm) MathApp.audio.toggleBgm();
      });
    });
    [els.mapSoundBtn, els.battleSoundBtn].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleSound) MathApp.audio.toggleSound();
      });
    });
    [els.mapVoiceBtn, els.battleVoiceBtn].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click', function(){
        if(MathApp.audio && MathApp.audio.toggleVoice) MathApp.audio.toggleVoice();
      });
    });

    document.addEventListener('keydown', function(e){
      if(!session.arcadeOpen) return;
      if(e.key === 'Escape'){
        if((els.dexDialog && els.dexDialog.open) || (els.parentDialog && els.parentDialog.open)) return;
        // 戰鬥中誤按 Esc 僅返回世界地圖，避免直接關閉全螢幕而失去進度
        if(session.active && els.battleView && els.battleView.style.display !== 'none'){
          showView('map');
        } else {
          closeArcade();
        }
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
      MathApp.on('audioChange', syncAudioButtons);
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

    // 升級舊存檔時自動補齊已達標的小兔造型
    if(checkAndUnlockCostumes(true).length > 0){
      persistSave();
    }
    syncAllBunnyVisuals();

    initGsapMedia();
    bindEvents();
    syncAudioButtons();
    updateHubStats();
    renderMap();
  }

  MathApp.mulQuest = {
    init: init,
    getIslands: function(){ return ISLANDS.slice(); },
    getStages: function(){ return STAGES.slice(); },
    getBadges: function(){ return BADGES.slice(); },
    getCostumes: function(){ return BUNNY_COSTUMES.slice(); },
    buildStageQuestions: buildStageQuestions,
    getPinkBunnySvg: getPinkBunnySvg,
    getStageChestSvg: getStageChestSvg,
    getCharacterSvg: getCharacterSvg,
    getActivePartnerIsland: getActivePartnerIsland,
    getSaveSummary: function(){
      return {
        stars: countTotalStars(),
        gems: countLitGems(),
        sprites: countUnlockedSprites(),
        costumes: countUnlockedCostumes(),
        rescueCount: saveData.rescueQueue.length
      };
    }
  };

})();
