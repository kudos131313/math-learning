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
    subtitle: '二～三位數進退位、跨零借位與生活採購大冒險',
    unlockMode: 'initial',
    status: 'active',
    mapImg: 'assets/quest/world-map-sunny.jpg'
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
    status: 'active',
    releaseNote: '',
    mapImg: 'assets/quest/world-map-cloud.jpg',
    plannedIslands: [
      '1. 跳數雲朵車站（跨百跳數密碼）',
      '2. 積木金庫港（千以內位值機關）',
      '3. 森林遊樂園（兩步驟先乘後加）',
      '4. 魔法點心店（兩步驟先乘後減找零）',
      '5. 星光天空城（全課綱大魔王試煉）'
    ]
  }
];

/* ---------------- 十五大主題島嶼與守護小精靈（陽光加減 ＋ 九九乘法 ＋ 雲端應用） ---------------- */
export const ISLANDS = [
  {
    id: 'bakery',
    fullId: 'sunny:bakery',
    realmId: 'sunny',
    order: 1,
    theme: 'bakery',
    specialty: 'lucky',
    title: '1. 奶油麵包村',
    rangeText: '二位數無進退位',
    signPos: { x: 14, y: 21 },
    bgImg: 'assets/quest/bg-bakery.jpg',
    spriteName: '可頌小精靈',
    spriteDesc: '打敗牛角麵包怪即可收服，最喜歡把剛出爐的麵包算得剛剛好！',
    partnerProjectile: '🥐',
    partnerSkillDesc: '灑出香噴噴奶油星粉，協助答題並提升星星幣收穫！',
    partnerCheers: ['麵包香噴噴，加油！', '個位十位對齊算得超穩！', '一擊命中太厲害！'],
    lv3Cheer: '金燦燦的光環點亮麵包村，星星幣滿滿出爐啦！',
    bossStageId: 'sunny:1-3'
  },
  {
    id: 'candy',
    fullId: 'sunny:candy',
    realmId: 'sunny',
    order: 2,
    theme: 'candy',
    specialty: 'blocks',
    title: '2. 草莓糖果鎮',
    rangeText: '進位與購物合併',
    signPos: { x: 31, y: 16 },
    bgImg: 'assets/quest/bg-candy.jpg',
    spriteName: '草莓棉花精靈',
    spriteDesc: '打敗糖霜機器人即可收服，滿十就會變出一條甜滋滋十格棒！',
    partnerProjectile: '🍓',
    partnerSkillDesc: '變出草莓積木，滿十進一一看就懂！',
    partnerCheers: ['滿十變長條囉！', '草莓魔法甜甜的！', '繼續向下一顆進位前進！'],
    lv3Cheer: '滿十進化大成功！我們是最甜蜜的進位拍檔！',
    bossStageId: 'sunny:2-3'
  },
  {
    id: 'bay',
    fullId: 'sunny:bay',
    realmId: 'sunny',
    order: 3,
    theme: 'bay',
    specialty: 'eliminate',
    title: '3. 泡泡海灣',
    rangeText: '退位找錢與比較',
    signPos: { x: 51, y: 21 },
    bgImg: 'assets/quest/bg-bay.jpg',
    spriteName: '珍珠小海馬',
    spriteDesc: '打敗泡泡章魚王即可收服，最懂購物找零和比多比少！',
    partnerProjectile: '🫧',
    partnerSkillDesc: '吹出珍珠泡泡，幫你找出關鍵線索並消除干擾！',
    partnerCheers: ['找零算得剛剛好！', '泡泡裡藏著正確線索！', '海灣小幫手替你加油！'],
    lv3Cheer: '閃亮珍珠光環綻放！所有找錢和比較題都難不倒我們！',
    bossStageId: 'sunny:3-3'
  },
  {
    id: 'market',
    fullId: 'sunny:market',
    realmId: 'sunny',
    order: 4,
    theme: 'market',
    specialty: 'shield',
    title: '4. 積木大市集',
    rangeText: '三位數進退位',
    signPos: { x: 70, y: 22 },
    bgImg: 'assets/quest/bg-market.jpg',
    spriteName: '積木市集貓',
    spriteDesc: '打敗金色算盤怪即可收服，守護三位數百格板的市集小隊長！',
    partnerProjectile: '🐾',
    partnerSkillDesc: '揮出貓貓肉球護盾，幫你安心挑戰三位數大採購！',
    partnerCheers: ['三位數難不倒你！', '百格板排整齊囉！', '市集貓咪為你歡呼！'],
    lv3Cheer: '雙重金色肉球護盾全開！大市集最安心的守護貓隊長！',
    bossStageId: 'sunny:4-3'
  },
  {
    id: 'lighthouse',
    fullId: 'sunny:lighthouse',
    realmId: 'sunny',
    order: 5,
    theme: 'lighthouse',
    specialty: 'lucky',
    title: '5. 彩虹燈塔',
    rangeText: '跨零退位與未知數',
    signPos: { x: 86, y: 15 },
    bgImg: 'assets/quest/bg-lighthouse.jpg',
    spriteName: '彩虹燈塔鳥',
    spriteDesc: '打敗暗雲燈塔巨像即可收服，能照亮十位是 0 的跨零借位密室！',
    partnerProjectile: '🌈',
    partnerSkillDesc: '展翅發出七彩光芒，照亮跨零借位與神秘未知數！',
    partnerCheers: ['跨零借位看穿啦！', '十位剩 9 記得超清楚！', '陽光群島閃耀七彩光！'],
    lv3Cheer: '七彩燈塔光環大放異彩！跨零大師和幸運星幣一起飛來啦！',
    bossStageId: 'sunny:5-3'
  },
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
    lv3Cheer: '翠綠星光繞身轉圈！森林小隊長帶你橫掃所有乘法難題！',
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
    lv3Cheer: '黃金小工匠誕生！積木陣法加上滿滿加碼星星幣超開心！',
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
    lv3Cheer: '雙翼閃耀花園星環！有我們守護連擊絕對不會斷！',
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
    lv3Cheer: '聖龍光環覺醒！7、8、9 大口訣通通變成金閃閃星星幣！',
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
    lv3Cheer: '皇家金環降臨！榮耀大師的積木神力無可匹敵！',
    bossStageId: '5-3'
  },
  {
    id: 'station',
    fullId: 'cloud:station',
    realmId: 'cloud',
    order: 1,
    theme: 'station',
    specialty: 'eliminate',
    title: '1. 跳數雲朵車站',
    rangeText: '跨百跳數密碼',
    signPos: { x: 14, y: 21 },
    bgImg: 'assets/quest/bg-station.jpg',
    spriteName: '雲朵車長狸',
    spriteDesc: '打敗蒸汽時鐘列車怪即可收服，能一眼看出列車每隔幾格的跳數密碼！',
    partnerProjectile: '🚂',
    partnerSkillDesc: '吹響小車長哨子，幫你找出跳數規則或震飛錯選項！',
    partnerCheers: ['噗噗！準時發車向前衝！', '跳數規則抓得超準！', '車站小車長幫你加油！'],
    lv3Cheer: '雲端特快車全速滿星！小車長光環亮晶晶！',
    bossStageId: 'cloud:1-3'
  },
  {
    id: 'vault',
    fullId: 'cloud:vault',
    realmId: 'cloud',
    order: 2,
    theme: 'vault',
    specialty: 'blocks',
    title: '2. 積木金庫港',
    rangeText: '千以內位值機關',
    signPos: { x: 32, y: 12 },
    bgImg: 'assets/quest/bg-vault.jpg',
    spriteName: '金庫小鼴鼠',
    spriteDesc: '打敗寶石金庫守衛即可收服，專解百十個補零陷阱與 10 個百換 1000 機關！',
    partnerProjectile: '💎',
    partnerSkillDesc: '亮出金庫密碼手電筒，讓缺失十位或個位的補零細節無所遁形！',
    partnerCheers: ['卡滋！金庫密碼解開啦！', '補零陷阱完全難不倒你！', '十張百格板閃閃發亮！'],
    lv3Cheer: '金庫秘寶之環啟動！千以內位值一看就通！',
    bossStageId: 'cloud:2-3'
  },
  {
    id: 'park',
    fullId: 'cloud:park',
    realmId: 'cloud',
    order: 3,
    theme: 'park',
    specialty: 'shield',
    title: '3. 森林遊樂園',
    rangeText: '兩步驟先乘後加',
    signPos: { x: 50, y: 22 },
    bgImg: 'assets/quest/bg-park.jpg',
    spriteName: '氣球小企鵝',
    spriteDesc: '打敗摩天輪小丑王即可收服，帶著安全氣球陪你完成遊樂園先乘後加任務！',
    partnerProjectile: '🎈',
    partnerSkillDesc: '送出遊樂園彩色氣球，幫你穩住兩步驟節奏！',
    partnerCheers: ['先算乘法小計太棒了！', '氣球飛高高，第二步驟也秒殺！', '遊樂園今日滿星大豐收！'],
    lv3Cheer: '雙層安全氣球光環展開！遊樂園冒險零失誤！',
    bossStageId: 'cloud:3-3'
  },
  {
    id: 'patisserie',
    fullId: 'cloud:patisserie',
    realmId: 'cloud',
    order: 4,
    theme: 'patisserie',
    specialty: 'eliminate',
    title: '4. 魔法點心店',
    rangeText: '先乘後減找零',
    signPos: { x: 68, y: 12 },
    bgImg: 'assets/quest/bg-patisserie.jpg',
    spriteName: '馬卡龍蜜蜂',
    spriteDesc: '打敗千層舒芙蕾怪即可收服，最擅長算幾盒點心總價再找回零錢！',
    partnerProjectile: '🧁',
    partnerSkillDesc: '飛舞點心花香，替你消除干擾或展開找零推理框！',
    partnerCheers: ['找零一毛錢也不會算錯！', '甜點買好準備派對囉！', '嗡嗡！心算速度超快！'],
    lv3Cheer: '黃金蜂蜜光環閃耀！點心帳房小神算就是我們！',
    bossStageId: 'cloud:4-3'
  },
  {
    id: 'skycastle',
    fullId: 'cloud:skycastle',
    realmId: 'cloud',
    order: 5,
    theme: 'skycastle',
    specialty: 'lucky',
    title: '5. 星光天空城',
    rangeText: '全課綱大魔王',
    signPos: { x: 86, y: 21 },
    bgImg: 'assets/quest/bg-skycastle.jpg',
    spriteName: '星光獨角獸',
    spriteDesc: '打敗星穹時計大帝即可收服，雲端應用王國的終極聖獸，閃耀彩虹加持！',
    partnerProjectile: '🦄',
    partnerSkillDesc: '揮動彩虹獨角魔法，為粉紅小兔灑下星光祝福與豐盛星星幣！',
    partnerCheers: ['星光彩虹照亮天空城！', '全課綱題目通通難不倒！', '我們是最強冒險拍檔！'],
    lv3Cheer: '星穹聖獸終極彩虹光環降臨！傳說冒險大勝利！',
    bossStageId: 'cloud:5-3'
  }
];

/* ---------------- 45 個冒險關卡（陽光 15 關 ＋ 九九乘法 15 關 ＋ 雲端應用 15 關） ---------------- */
export const STAGES = [
  // 海域 1：陽光加減群島（sunny）
  {
    id: 'sunny:1-1', stageKey: 'sunny:1-1', displayNum: '1-1', realmId: 'sunny', islandId: 'bakery',
    label: '麵包出爐啦', mapPos: { x: 7.5, y: 58 },
    calcTypes: ['add_2d_plain', 'sub_2d_plain'], count: 5, inputMode: 'choice', isBoss: false
  },
  {
    id: 'sunny:1-2', stageKey: 'sunny:1-2', displayNum: '1-2', realmId: 'sunny', islandId: 'bakery',
    label: '湊十好味道', mapPos: { x: 13, y: 71 },
    calcTypes: ['add_make_ten', 'add_tens', 'word_bakery_plain'], count: 5, inputMode: 'choice', isBoss: false
  },
  {
    id: 'sunny:1-3', stageKey: 'sunny:1-3', displayNum: '1-3', realmId: 'sunny', islandId: 'bakery',
    label: '奶油麵包魔王', mapPos: { x: 18.5, y: 53 },
    calcTypes: ['add_2d_plain', 'sub_2d_plain', 'word_bakery_plain'], count: 5, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: {
      name: '牛角麵包怪',
      svgKey: 'bakery',
      tauntStart: '「剛出爐的可頌香噴噴！接下無進退位考驗吧！」',
      tauntHit: '「哎呀！我的酥皮被你算得掉滿地啦！」',
      tauntWin: '「太厲害了！可頌小精靈決定跟著你冒險！」'
    }
  },
  {
    id: 'sunny:2-1', stageKey: 'sunny:2-1', displayNum: '2-1', realmId: 'sunny', islandId: 'candy',
    label: '滿十變長條', mapPos: { x: 25, y: 52 },
    calcTypes: ['add_2d_carry'], count: 5, inputMode: 'choice', isBoss: false
  },
  {
    id: 'sunny:2-2', stageKey: 'sunny:2-2', displayNum: '2-2', realmId: 'sunny', islandId: 'candy',
    label: '糖果罐大採購', mapPos: { x: 31, y: 59 },
    calcTypes: ['word_buy_merge_carry', 'add_2d_carry'], count: 5, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'sunny:2-3', stageKey: 'sunny:2-3', displayNum: '2-3', realmId: 'sunny', islandId: 'candy',
    label: '糖果屋守衛戰', mapPos: { x: 37, y: 49 },
    calcTypes: ['add_2d_double_carry', 'word_buy_merge_carry'], count: 5, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: {
      name: '糖霜機器人',
      svgKey: 'candy',
      tauntStart: '「喀喀！個位滿十、十位又滿十進到百位，你會嗎？」',
      tauntHit: '「滋滋！進位計算太準了，糖霜要融化啦！」',
      tauntWin: '「滿十進一超熟練！草莓棉花精靈加入隊伍！」'
    }
  },
  {
    id: 'sunny:3-1', stageKey: 'sunny:3-1', displayNum: '3-1', realmId: 'sunny', islandId: 'bay',
    label: '向十位借一根', mapPos: { x: 45, y: 57 },
    calcTypes: ['sub_2d_borrow'], count: 5, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'sunny:3-2', stageKey: 'sunny:3-2', displayNum: '3-2', realmId: 'sunny', islandId: 'bay',
    label: '貝殼找錢小舖', mapPos: { x: 51, y: 65 },
    calcTypes: ['word_buy_change', 'word_compare'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'sunny:3-3', stageKey: 'sunny:3-3', displayNum: '3-3', realmId: 'sunny', islandId: 'bay',
    label: '海灣泡泡大王', mapPos: { x: 56.5, y: 53 },
    calcTypes: ['sub_2d_borrow', 'word_buy_change', 'word_compare'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '泡泡章魚王',
      svgKey: 'bay',
      tauntStart: '「咕嚕咕嚕！敢不敢挑戰找零錢和比多比少陷阱？」',
      tauntHit: '「噗哇！居然沒被『誰比誰多』騙到！」',
      tauntWin: '「你太聰明了！珍珠小海馬是你的新夥伴！」'
    }
  },
  {
    id: 'sunny:4-1', stageKey: 'sunny:4-1', displayNum: '4-1', realmId: 'sunny', islandId: 'market',
    label: '三位數進位車', mapPos: { x: 64, y: 56 },
    calcTypes: ['add_3d'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'sunny:4-2', stageKey: 'sunny:4-2', displayNum: '4-2', realmId: 'sunny', islandId: 'market',
    label: '市集買大禮', mapPos: { x: 70, y: 67 },
    calcTypes: ['sub_3d', 'word_buy_change_large'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'sunny:4-3', stageKey: 'sunny:4-3', displayNum: '4-3', realmId: 'sunny', islandId: 'market',
    label: '市集算盤怪', mapPos: { x: 75, y: 54 },
    calcTypes: ['add_3d', 'sub_3d', 'word_compare_large'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '金色算盤怪',
      svgKey: 'market',
      tauntStart: '「噼哩啪啦！百位、十位、個位一起算，看你多快！」',
      tauntHit: '「喀啦！算盤珠子被你彈飛啦！」',
      tauntWin: '「三位數加減大師！積木市集貓跟你回家！」'
    }
  },
  {
    id: 'sunny:5-1', stageKey: 'sunny:5-1', displayNum: '5-1', realmId: 'sunny', islandId: 'lighthouse',
    label: '跨零借位密室', mapPos: { x: 82, y: 49 },
    calcTypes: ['sub_across_zero'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'sunny:5-2', stageKey: 'sunny:5-2', displayNum: '5-2', realmId: 'sunny', islandId: 'lighthouse',
    label: '神秘缺角算式', mapPos: { x: 87.5, y: 69 },
    calcTypes: ['calc_missing_add', 'calc_missing_sub'], count: 6, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'sunny:5-3', stageKey: 'sunny:5-3', displayNum: '5-3', realmId: 'sunny', islandId: 'lighthouse',
    label: '彩虹燈塔巨像', mapPos: { x: 93.5, y: 54 },
    calcTypes: [
      'sub_across_zero',
      'calc_missing_add',
      'calc_missing_sub',
      'add_3d',
      'sub_3d',
      'word_buy_change_large',
      'word_compare_large'
    ],
    count: 8, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '暗雲燈塔巨像',
      svgKey: 'lighthouse',
      tauntStart: '「轟隆！想點亮彩虹燈塔？先通過跨零借位和全範圍試煉！」',
      tauntHit: '「嗚哇！烏雲被陽光穿透一大片啦！」',
      tauntWin: '「彩虹閃耀整片群島！彩虹燈塔鳥永遠守護你！」'
    }
  },

  // 海域 2：九九乘法奇幻群島（mul）
  { id: '1-1', stageKey: 'mul:1-1', legacyId: '1-1', displayNum: '1-1', realmId: 'mul', islandId: 'forest', label: '1·2 暖身營', mapPos: { x: 24, y: 69 }, tables: [1, 2], qTypes: ['standard'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '1-2', stageKey: 'mul:1-2', legacyId: '1-2', displayNum: '1-2', realmId: 'mul', islandId: 'forest', label: '5 跳數小徑', mapPos: { x: 16, y: 61 }, tables: [5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '1-3', stageKey: 'mul:1-3', legacyId: '1-3', displayNum: '1-3', realmId: 'mul', islandId: 'forest', label: '森林守門員', mapPos: { x: 11, y: 49 }, tables: [1, 2, 5], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: { name: '森林樹樁怪', svgKey: 'forest', tauntStart: '「想進積木世界？接下 1、2、5 的乘法考驗！」', tauntHit: '「哎呀！口訣好準，葉子掉下來啦！」', tauntWin: '「太強了！森林寶石交給你守護！」' }
  },
  { id: '2-1', stageKey: 'mul:2-1', legacyId: '2-1', displayNum: '2-1', realmId: 'mul', islandId: 'workshop', label: '3 的口訣屋', mapPos: { x: 28, y: 46 }, tables: [3], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '2-2', stageKey: 'mul:2-2', legacyId: '2-2', displayNum: '2-2', realmId: 'mul', islandId: 'workshop', label: '4 的分組盒', mapPos: { x: 34, y: 39 }, tables: [4], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '2-3', stageKey: 'mul:2-3', legacyId: '2-3', displayNum: '2-3', realmId: 'mul', islandId: 'workshop', label: '工坊機甲怪', mapPos: { x: 40, y: 45 }, tables: [3, 4], qTypes: ['standard', 'concept'], count: 5, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: { name: '積木發條怪', svgKey: 'workshop', tauntStart: '「喀啦喀啦！看看你懂不懂幾個幾！」', tauntHit: '「叮咚！發條鬆掉一格啦！」', tauntWin: '「運算好精準！方塊小工匠跟你走！」' }
  },
  { id: '3-1', stageKey: 'mul:3-1', legacyId: '3-1', displayNum: '3-1', realmId: 'mul', islandId: 'garden', label: '6 的花田', mapPos: { x: 46, y: 59 }, tables: [6], qTypes: ['standard', 'story_choice'], count: 5, inputMode: 'choice', isBoss: false },
  { id: '3-2', stageKey: 'mul:3-2', legacyId: '3-2', displayNum: '3-2', realmId: 'mul', islandId: 'garden', label: '交換律魔法', mapPos: { x: 53, y: 54 }, tables: [2, 3, 4, 5, 6], qTypes: ['commutative'], count: 5, inputMode: 'choice', isBoss: false },
  {
    id: '3-3', stageKey: 'mul:3-3', legacyId: '3-3', displayNum: '3-3', realmId: 'mul', islandId: 'garden', label: '花園迷宮怪', mapPos: { x: 59, y: 59 }, tables: [3, 4, 5, 6], qTypes: ['standard', 'commutative'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: { name: '花瓣迷宮怪', svgKey: 'garden', tauntStart: '「我把數字左右交換，看你還認不認得！」', tauntHit: '「哇！交換律魔法被你看穿了！」', tauntWin: '「a×b 跟 b×a 一樣，太佩服了！」' }
  },
  { id: '4-1', stageKey: 'mul:4-1', legacyId: '4-1', displayNum: '4-1', realmId: 'mul', islandId: 'valley', label: '7 的山谷', mapPos: { x: 66, y: 45 }, tables: [7], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
  { id: '4-2', stageKey: 'mul:4-2', legacyId: '4-2', displayNum: '4-2', realmId: 'mul', islandId: 'valley', label: '8·9 攀登戰', mapPos: { x: 72, y: 39 }, tables: [8, 9], qTypes: ['standard'], count: 5, inputMode: 'keypad', isBoss: false },
  {
    id: '4-3', stageKey: 'mul:4-3', legacyId: '4-3', displayNum: '4-3', realmId: 'mul', islandId: 'valley', label: '山谷噴火龍', mapPos: { x: 77, y: 47 }, tables: [7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: { name: '泡泡噴火龍', svgKey: 'valley', tauntStart: '「呼——！7、8、9 最容易忘記囉！」', tauntHit: '「嗚！星星光束把我泡泡打散了！」', tauntWin: '「你征服了巨龍山谷，真是不簡單！」' }
  },
  { id: '5-1', stageKey: 'mul:5-1', legacyId: '5-1', displayNum: '5-1', realmId: 'mul', islandId: 'castle', label: '全段混戰', mapPos: { x: 83, y: 63 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard'], count: 6, inputMode: 'mixed', isBoss: false },
  { id: '5-2', stageKey: 'mul:5-2', legacyId: '5-2', displayNum: '5-2', realmId: 'mul', islandId: 'castle', label: '神秘未知數', mapPos: { x: 89, y: 58 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['missing_b', 'missing_a'], count: 6, inputMode: 'keypad', isBoss: false },
  {
    id: '5-3', stageKey: 'mul:5-3', legacyId: '5-3', displayNum: '5-3', realmId: 'mul', islandId: 'castle', label: '城堡大魔王', mapPos: { x: 92, y: 46 }, tables: [2, 3, 4, 5, 6, 7, 8, 9], qTypes: ['standard', 'missing_b', 'commutative'], count: 8, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: { name: '積木大魔王', svgKey: 'castle', tauntStart: '「歡迎來到大師城堡！接受終極試煉吧！」', tauntHit: '「可惡，居然連這題都秒殺我！」', tauntWin: '「太閃耀了！你就是九九乘法大師！」' }
  },

  // 海域 3：雲端應用王國（cloud）
  {
    id: 'cloud:1-1', stageKey: 'cloud:1-1', displayNum: '1-1', realmId: 'cloud', islandId: 'station',
    label: '跨百列車門', mapPos: { x: 6.5, y: 63 },
    cloudTypes: ['seq_step_1_10'], count: 5, inputMode: 'choice', isBoss: false
  },
  {
    id: 'cloud:1-2', stageKey: 'cloud:1-2', displayNum: '1-2', realmId: 'cloud', islandId: 'station',
    label: '時間與錢幣跳跳', mapPos: { x: 11.5, y: 75 },
    cloudTypes: ['seq_step_2_5'], count: 5, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'cloud:1-3', stageKey: 'cloud:1-3', displayNum: '1-3', realmId: 'cloud', islandId: 'station',
    label: '列車長大考驗', mapPos: { x: 16.5, y: 58 },
    cloudTypes: ['seq_step_1_10', 'seq_step_2_5', 'seq_reverse_left'], count: 5, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: {
      name: '蒸汽時鐘列車怪',
      svgKey: 'station',
      tauntStart: '「嗚嗚——！看得懂跨百跳數和倒數反推才准上車！」',
      tauntHit: '「噗嗤！煙囪裡的數字密碼被你破解啦！」',
      tauntWin: '「太神了！雲朵車長狸正式加入你的冒險隊伍！」'
    }
  },
  {
    id: 'cloud:2-1', stageKey: 'cloud:2-1', displayNum: '2-1', realmId: 'cloud', islandId: 'vault',
    label: '積木組成密碼', mapPos: { x: 24.5, y: 60 },
    cloudTypes: ['pv_compose'], count: 5, inputMode: 'choice', isBoss: false
  },
  {
    id: 'cloud:2-2', stageKey: 'cloud:2-2', displayNum: '2-2', realmId: 'cloud', islandId: 'vault',
    label: '最大與最小金幣', mapPos: { x: 30.5, y: 73 },
    cloudTypes: ['pv_compare_max_min', 'pv_compare_pair'], count: 5, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'cloud:2-3', stageKey: 'cloud:2-3', displayNum: '2-3', realmId: 'cloud', islandId: 'vault',
    label: '金庫守門巨龍', mapPos: { x: 36, y: 57 },
    cloudTypes: ['pv_compose', 'pv_compare_max_min', 'pv_thousand_exchange'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 1,
    boss: {
      name: '寶石金庫守衛',
      svgKey: 'vault',
      tauntStart: '「喀喀！沒有十位的數記得補 0，10 張百格板又是多少？」',
      tauntHit: '「叮噹！我的大金庫鎖頭鬆掉一道啦！」',
      tauntWin: '「位值判斷無懈可擊！金庫小鼴鼠跟你一起去挖寶！」'
    }
  },
  {
    id: 'cloud:3-1', stageKey: 'cloud:3-1', displayNum: '3-1', realmId: 'cloud', islandId: 'park',
    label: '買票再買爆米花', mapPos: { x: 43, y: 58 },
    cloudTypes: ['word_mul_add_guided'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'cloud:3-2', stageKey: 'cloud:3-2', displayNum: '3-2', realmId: 'cloud', islandId: 'park',
    label: '貼紙收集大比拼', mapPos: { x: 50.5, y: 72 },
    cloudTypes: ['word_mul_add_compare_guided'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'cloud:3-3', stageKey: 'cloud:3-3', displayNum: '3-3', realmId: 'cloud', islandId: 'park',
    label: '摩天輪魔術師', mapPos: { x: 56.5, y: 58 },
    cloudTypes: ['word_mul_add_direct'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '摩天輪小丑王',
      svgKey: 'park',
      tauntStart: '「哈哈！這關沒有分步提示，要一次把先乘後加直解算出來！」',
      tauntHit: '「哇呀！你的心算速度比摩天輪轉得還快！」',
      tauntWin: '「不靠提示也全對！氣球小企鵝飛來陪你啦！」'
    }
  },
  {
    id: 'cloud:4-1', stageKey: 'cloud:4-1', displayNum: '4-1', realmId: 'cloud', islandId: 'patisserie',
    label: '付百元找零錢', mapPos: { x: 64.5, y: 60 },
    cloudTypes: ['word_mul_sub_change_guided'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'cloud:4-2', stageKey: 'cloud:4-2', displayNum: '4-2', realmId: 'cloud', islandId: 'patisserie',
    label: '分完點心剩多少', mapPos: { x: 70.5, y: 72 },
    cloudTypes: ['word_mul_sub_left_guided'], count: 5, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'cloud:4-3', stageKey: 'cloud:4-3', displayNum: '4-3', realmId: 'cloud', islandId: 'patisserie',
    label: '千層蛋糕魔王', mapPos: { x: 76, y: 58 },
    cloudTypes: ['word_mul_sub_change_direct', 'word_mul_sub_left_direct'], count: 6, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '千層舒芙蕾怪',
      svgKey: 'patisserie',
      tauntStart: '「甜滋滋兩步驟直解考驗！先乘後減找零和剩餘一次算出來！」',
      tauntHit: '「呼哇！舒芙蕾要塌下來啦！」',
      tauntWin: '「超強帳房小高手！馬卡龍蜜蜂嗡嗡加入團隊！」'
    }
  },
  {
    id: 'cloud:5-1', stageKey: 'cloud:5-1', displayNum: '5-1', realmId: 'cloud', islandId: 'skycastle',
    label: '全能冒險清單', mapPos: { x: 83, y: 53 },
    cloudTypes: ['sky_mixed_calc', 'sky_mixed_mul', 'seq_step_1_10', 'pv_compose'], count: 6, inputMode: 'mixed', isBoss: false
  },
  {
    id: 'cloud:5-2', stageKey: 'cloud:5-2', displayNum: '5-2', realmId: 'cloud', islandId: 'skycastle',
    label: '謎題大迴廊', mapPos: { x: 88, y: 70 },
    cloudTypes: ['word_mul_add_direct', 'word_mul_sub_change_direct', 'word_mul_sub_left_direct', 'sky_mixed_word_single'], count: 6, inputMode: 'keypad', isBoss: false
  },
  {
    id: 'cloud:5-3', stageKey: 'cloud:5-3', displayNum: '5-3', realmId: 'cloud', islandId: 'skycastle',
    label: '星光天空大帝', mapPos: { x: 94, y: 56 },
    cloudTypes: [
      'word_mul_add_direct',
      'word_mul_sub_change_direct',
      'word_mul_sub_left_direct',
      'seq_reverse_left',
      'pv_compose',
      'sky_mixed_calc',
      'sky_mixed_mul'
    ],
    count: 8, inputMode: 'keypad', isBoss: true, bossShield: 2,
    boss: {
      name: '星穹時計大帝',
      svgKey: 'skycastle',
      tauntStart: '「星光天空城最終試煉！迎戰跨海域全課綱混合大考驗吧！」',
      tauntHit: '「不可思議！星辰魔法也擋不住你的數學實力！」',
      tauntWin: '「榮耀歸於雲端冒險王！星光獨角獸永遠守護著你！」'
    }
  }
];

/* ---------------- 數學技能圖鑑（完整 24 張銅／銀／金技能卡） ---------------- */
export const SKILL_TIER_THRESHOLDS = {
  bronze: 3,
  silver: 8,
  gold: 15
};

export const SKILL_TIER_COINS = {
  bronze: 15,
  silver: 30,
  gold: 60
};

export const SKILL_CARDS = [
  { id: 'add_2d_plain', realmId: 'sunny', icon: '☀️', name: '陽光直達車', desc: '二位數無進位加法與湊十運算', sampleStageId: 'sunny:1-1' },
  { id: 'sub_2d_plain', realmId: 'sunny', icon: '🍃', name: '輕巧減法師', desc: '二位數無退位減法', sampleStageId: 'sunny:1-1' },
  { id: 'add_2d_carry', realmId: 'sunny', icon: '🔥', name: '滿十進位手', desc: '二位數個位滿十進一與連續進位', sampleStageId: 'sunny:2-1' },
  { id: 'sub_2d_borrow', realmId: 'sunny', icon: '🫧', name: '拆十借位手', desc: '二位數向十位借一拆成十個一', sampleStageId: 'sunny:3-1' },
  { id: 'add_3d', realmId: 'sunny', icon: '🚚', name: '百位疊疊樂', desc: '三位數進位與跨百加法', sampleStageId: 'sunny:4-1' },
  { id: 'sub_3d', realmId: 'sunny', icon: '🧱', name: '百位拆拆樂', desc: '三位數普通退位減法', sampleStageId: 'sunny:4-2' },
  { id: 'sub_across_zero', realmId: 'sunny', icon: '🌈', name: '跨零破關者', desc: '十位是 0 時向百位借一的跨零退位', sampleStageId: 'sunny:5-1' },
  { id: 'calc_missing', realmId: 'sunny', icon: '🔍', name: '算式偵探家', desc: '加減未知數反推（□ ＋ b ＝ c、a − □ ＝ c）', sampleStageId: 'sunny:5-2' },
  { id: 'word_buy_change', realmId: 'sunny', icon: '🛒', name: '購物找錢達人', desc: '單步驟購物合併與付錢找零生活題', sampleStageId: 'sunny:3-2' },
  { id: 'word_compare', realmId: 'sunny', icon: '⚖️', name: '比多比少秤', desc: '單步驟比多比少生活比較應用題', sampleStageId: 'sunny:3-2' },
  { id: 'mul_commutative', realmId: 'mul', icon: '🪄', name: '交換律魔術師', desc: 'a × b ＝ b × a 乘法交換律配對', sampleStageId: '3-2' },
  { id: 'mul_missing', realmId: 'mul', icon: '🔎', name: '逆向口訣王', desc: '乘法未知乘數或被乘數反推填空', sampleStageId: '5-2' },
  { id: 'mul_concept', realmId: 'mul', icon: '🧱', name: '幾個幾倍數通', desc: '連加轉化為「幾個幾」倍數概念', sampleStageId: '2-3' },
  { id: 'word_mul_life', realmId: 'mul', icon: '🍎', name: '生活分組家', desc: '單步驟包裝、花瓣與車輪乘法生活題', sampleStageId: '1-2' },
  { id: 'seq_step_1_10', realmId: 'cloud', icon: '🚂', name: '跨百列車長', desc: '+1 / −1 / +10 / −10 跨百數列規律', sampleStageId: 'cloud:1-1' },
  { id: 'seq_step_2_5', realmId: 'cloud', icon: '🕒', name: '時鐘硬幣手', desc: '+2 / +5 跳數與時間錢幣數數', sampleStageId: 'cloud:1-2' },
  { id: 'pv_compose', realmId: 'cloud', icon: '🏛️', name: '千位建築師', desc: '百十個位值組數與讀數（含補零位值）', sampleStageId: 'cloud:2-1' },
  { id: 'pv_compare', realmId: 'cloud', icon: '🪙', name: '大小比較王', desc: '三位數比大小與數字卡排最大／最小', sampleStageId: 'cloud:2-2' },
  { id: 'word_mul_add_guided', realmId: 'cloud', icon: '🎡', name: '遊園小幫手', desc: '兩步驟先乘後加（分步引導模式）', sampleStageId: 'cloud:3-1' },
  { id: 'word_mul_sub_guided', realmId: 'cloud', icon: '🧁', name: '點心帳房通', desc: '兩步驟先乘後減找零與剩餘（分步引導）', sampleStageId: 'cloud:4-1' },
  { id: 'word_two_step_direct', realmId: 'cloud', icon: '⚡', name: '心算雙連擊', desc: '兩步驟生活應用題（一步直解挑戰）', sampleStageId: 'cloud:3-3' },
  { id: 'sky_mixed_calc', realmId: 'cloud', icon: '🌩️', name: '運算大總管', desc: '加減進退位與九九乘法綜合混戰', sampleStageId: 'cloud:5-1' },
  { id: 'sky_boss_slayer', realmId: 'cloud', icon: '🦄', name: '天空試煉者', desc: '雲端應用王國大魔王與高階試煉關卡', sampleStageId: 'cloud:5-3' },
  { id: 'rescue_master', realmId: 'global', icon: '🆘', name: '救援大隊長', desc: '完成求救小精靈特訓累計救回案件數', sampleStageId: '' }
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
  if (partnerId.indexOf(':') !== -1) return partnerId;
  for (let i = 0; i < ISLANDS.length; i++) {
    if (ISLANDS[i].id === partnerId) return ISLANDS[i].fullId;
  }
  return 'mul:' + partnerId;
}

export function toLegacyPartnerId(partnerId) {
  if (typeof partnerId !== 'string' || !partnerId) return '';
  const colonIdx = partnerId.indexOf(':');
  return colonIdx !== -1 ? partnerId.slice(colonIdx + 1) : partnerId;
}

export function getSkillCardById(id) {
  for (let i = 0; i < SKILL_CARDS.length; i++) {
    if (SKILL_CARDS[i].id === id) return SKILL_CARDS[i];
  }
  return null;
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

/* ---------------- Phase 3：守護小精靈親密度與四大專長定義 ---------------- */
export const PARTNER_BOND_THRESHOLDS = {
  lv2: 50,
  lv3: 150
};

export const PARTNER_SPECIALTIES = {
  eliminate: {
    id: 'eliminate',
    icon: '🌿',
    name: '智慧消錯系',
    mode: 'active',
    modeLabel: '主動技能',
    shortDesc: '選擇題消除錯選項；鍵盤題提供不劇透的高位或範圍提示',
    lvDesc: {
      1: '每關主動施放 1 次：選擇題消 1 錯選項；鍵盤題提示位數與首位數字',
      2: '進階智慧：選擇題消 2 錯選項；鍵盤題提示更精確的數值範圍',
      3: '大師共鳴：每關可施放 2 次智慧協助，並閃耀 Lv.3 專屬星光環'
    }
  },
  blocks: {
    id: 'blocks',
    icon: '🧱',
    name: '積木導師系',
    mode: 'active',
    modeLabel: '主動技能',
    shortDesc: '免費開啟積木小幫手，不影響滿星評價與收藏進度',
    lvDesc: {
      1: '每關免費開啟 1 次積木小幫手（不扣三星、照拿寶石與技能卡）',
      2: '導師鼓勵：免費開小幫手外，本關首次施放再送額外 +5 星星幣',
      3: '大師共鳴：每關可免費開啟 2 次積木小幫手，並閃耀 Lv.3 專屬星光環'
    }
  },
  shield: {
    id: 'shield',
    icon: '🛡️',
    name: '守護護盾系',
    mode: 'passive',
    modeLabel: '被動護盾',
    shortDesc: '答錯瞬間自動發動護盾吸收失誤，保住連擊與三星資格',
    lvDesc: {
      1: '被動觸發：每關自動擋下第 1 次答錯（保連擊、不扣三星、不入救援）',
      2: '貼心護航：護盾擋錯瞬間同步免費展開積木提示方向',
      3: '大師共鳴：每關可自動擋下 2 次答錯，並閃耀 Lv.3 專屬星光環'
    }
  },
  lucky: {
    id: 'lucky',
    icon: '🌟',
    name: '幸運尋寶系',
    mode: 'passive',
    modeLabel: '被動增益',
    shortDesc: '大幅提升過關星星幣獎勵，高親密度時答題也會掉金幣',
    lvDesc: {
      1: '幸運加持：通關獲得的星星幣獎勵 +20%',
      2: '閃亮連擊：通關星星幣獎勵 +35%，2 連擊精靈合體必出炫彩星光特效',
      3: '大師共鳴：通關星星幣獎勵 +50%，答對每題有機率額外掉 +2 星星幣'
    }
  }
};

export function getSpecialtyMeta(specialtyId) {
  return PARTNER_SPECIALTIES[specialtyId] || PARTNER_SPECIALTIES.eliminate;
}

/* ---------------- Phase 3：小兔三部位裝扮（頭飾 / 服裝 / 魔法杖） ---------------- */
export const WARDROBE_SLOTS = [
  { id: 'hat', icon: '👒', name: '頭飾' },
  { id: 'outfit', icon: '🧥', name: '服裝' },
  { id: 'wand', icon: '🪄', name: '魔法杖' }
];

export const WARDROBE_ITEMS = [
  // 頭飾類（hat）
  {
    id: 'star_clip',
    slot: 'hat',
    icon: '🌟',
    name: '經典小星星髮夾',
    desc: '粉紅小兔最喜歡的金閃閃星星髮飾！',
    source: 'free',
    price: 0,
    legacyCostumeId: 'default',
    goalText: '初始免費頭飾'
  },
  {
    id: 'ribbon',
    slot: 'hat',
    icon: '🎀',
    name: '草莓蝴蝶結',
    desc: '戴上甜美點點蝴蝶結，跳躍起來超有精神！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'ribbon',
    unlockType: 'stars',
    target: 10,
    goalText: '累積收集 10 顆星星'
  },
  {
    id: 'sprout',
    slot: 'hat',
    icon: '🌱',
    name: '森林嫩芽髮箍',
    desc: '兩片會晃呀晃的翠綠小嫩芽，帶著森林元氣！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'sprout',
    unlockType: 'gems',
    target: 15,
    goalText: '點亮 15 顆九九乘法寶石'
  },
  {
    id: 'explorer',
    slot: 'hat',
    icon: '🧢',
    name: '探險家漁夫帽',
    desc: '專為兔耳朵留洞的探險帽，出發去高難度島嶼囉！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'explorer',
    unlockType: 'stars',
    target: 25,
    goalText: '累積收集 25 顆星星'
  },
  {
    id: 'flower',
    slot: 'hat',
    icon: '🌸',
    name: '魔法花園花冠',
    desc: '用三色幸運小花編成的花環，讓算式像花一樣綻放！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'flower',
    unlockType: 'gems',
    target: 35,
    goalText: '點亮 35 顆九九乘法寶石'
  },
  {
    id: 'glasses',
    slot: 'hat',
    icon: '🕶️',
    name: '炫酷星星墨鏡',
    desc: '戴上透明星光墨鏡，再難的大魔王也難不倒我！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'glasses',
    unlockType: 'gems',
    target: 55,
    goalText: '點亮 55 顆九九乘法寶石'
  },
  {
    id: 'diamond_crown',
    slot: 'hat',
    icon: '👑',
    name: '81 寶石鑽石皇冠',
    desc: '點亮 81 格寶石牆的終極榮譽！閃耀三色寶石皇冠！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'crown',
    unlockType: 'gems',
    target: 81,
    goalText: '點亮全部 81 顆九九乘法寶石'
  },
  {
    id: 'croissant_beret',
    slot: 'hat',
    icon: '🥐',
    name: '牛角麵包貝雷帽',
    desc: '奶油麵包村師傅特製的鬆軟金黃貝雷帽！',
    source: 'shop',
    price: 60,
    goalText: '星星幣商店 60 枚'
  },
  {
    id: 'conductor_cap',
    slot: 'hat',
    icon: '🚂',
    name: '雲端列車長帽',
    desc: '戴上神氣深藍列車長帽，準時出發解密跨百跳數！',
    source: 'shop',
    price: 80,
    goalText: '星星幣商店 80 枚'
  },
  {
    id: 'unicorn_band',
    slot: 'hat',
    icon: '🦄',
    name: '雲朵獨角獸髮箍',
    desc: '粉藍軟綿雲朵配上金色小獨角，夢幻又可愛！',
    source: 'shop',
    price: 90,
    goalText: '星星幣商店 90 枚'
  },

  // 服裝類（outfit）
  {
    id: 'none',
    slot: 'outfit',
    icon: '🎀',
    name: '經典小兔裝',
    desc: '粉紅小兔原本的經典粉色小背心與金黃星星書包。',
    source: 'free',
    price: 0,
    goalText: '初始免費服裝'
  },
  {
    id: 'star_cape',
    slot: 'outfit',
    icon: '🦸',
    name: '星光小斗篷',
    desc: '閃耀夜空金星的勇者披風，跑起來帥氣滿分！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'cape',
    unlockType: 'stars',
    target: 45,
    goalText: '累積收集 45 顆星星'
  },
  {
    id: 'diamond_shawl',
    slot: 'outfit',
    icon: '✨',
    name: '鑽石星輝披肩',
    desc: '點亮 81 格寶石牆獲贈的華麗黃金披肩與寶石領結！',
    source: 'milestone',
    price: 0,
    legacyCostumeId: 'crown',
    unlockType: 'gems',
    target: 81,
    goalText: '點亮全部 81 顆九九乘法寶石'
  },
  {
    id: 'baker_apron',
    slot: 'outfit',
    icon: '🧥',
    name: '麵包師傅小圍裙',
    desc: '印著可愛小可頌的荷葉邊烘焙圍裙，算數像烤麵包一樣準！',
    source: 'shop',
    price: 70,
    goalText: '星星幣商店 70 枚'
  },
  {
    id: 'magic_robe',
    slot: 'outfit',
    icon: '🧙',
    name: '魔法學院披風',
    desc: '紫羅蘭星空學院斗篷，滿滿都是數學小魔導士氣息！',
    source: 'shop',
    price: 100,
    goalText: '星星幣商店 100 枚'
  },
  {
    id: 'space_suit',
    slot: 'outfit',
    icon: '🚀',
    name: '星空太空服',
    desc: '穿上宇宙探索小太空服，一口氣飛向星光天空城！',
    source: 'shop',
    price: 120,
    goalText: '星星幣商店 120 枚'
  },

  // 魔法杖類（wand）
  {
    id: 'none',
    slot: 'wand',
    icon: '✨',
    name: '經典星星魔法',
    desc: '用雙手發出金黃閃亮星星彈（四種必殺技隨機施放）。',
    source: 'free',
    price: 0,
    boltTheme: 'star',
    preferredFinisher: '',
    goalText: '初始免費魔法'
  },
  {
    id: 'carrot_wand',
    slot: 'wand',
    icon: '🥕',
    name: '胡蘿蔔糖果杖',
    desc: '發射香甜胡蘿蔔星彈！最後一擊優先召喚「🥕 巨無霸胡蘿蔔砸擊」！',
    source: 'shop',
    price: 75,
    boltTheme: 'carrot',
    preferredFinisher: 'carrot',
    goalText: '星星幣商店 75 枚'
  },
  {
    id: 'butterfly_wand',
    slot: 'wand',
    icon: '🌸',
    name: '蝴蝶星辰杖',
    desc: '發射粉櫻花瓣光彈！最後一擊優先發動「⚔️ 星辰十字斬」！',
    source: 'shop',
    price: 95,
    boltTheme: 'petal',
    preferredFinisher: 'slash',
    goalText: '星星幣商店 95 枚'
  },
  {
    id: 'meteor_wand',
    slot: 'wand',
    icon: '🌠',
    name: '流星許願權杖',
    desc: '發射新月藍紫星彈！最後一擊優先召喚「🌠 超級流星雨」！',
    source: 'shop',
    price: 110,
    boltTheme: 'meteor',
    preferredFinisher: 'meteor',
    goalText: '星星幣商店 110 枚'
  },
  {
    id: 'rainbow_wand',
    slot: 'wand',
    icon: '⚡',
    name: '彩虹星星魔杖',
    desc: '發射七彩稜鏡光彈！最後一擊優先施放「🌈 彩虹光束砲」！',
    source: 'shop',
    price: 130,
    boltTheme: 'rainbow',
    preferredFinisher: 'rainbow',
    goalText: '星星幣商店 130 枚'
  }
];

export function getWardrobeItemById(id, slotHint) {
  for (let i = 0; i < WARDROBE_ITEMS.length; i++) {
    const it = WARDROBE_ITEMS[i];
    if (it.id === id && (!slotHint || it.slot === slotHint)) return it;
  }
  return null;
}

export function getWardrobeItemsBySlot(slot) {
  return WARDROBE_ITEMS.filter((item) => item.slot === slot);
}

/* ---------------- Phase 3：秘密樹屋 5 槽位家具與精靈點心 ---------------- */
export const TREEHOUSE_SLOTS = [
  { id: 'wallpaper', icon: '🎨', name: '牆紙風格' },
  { id: 'rug', icon: '🧶', name: '地毯樣式' },
  { id: 'window', icon: '🪟', name: '窗外風景' },
  { id: 'furniture', icon: '🛋️', name: '主家具' },
  { id: 'decor', icon: '🪴', name: '角落擺飾' }
];

export const STAMP_MILESTONE_DECOR_IDS = ['star_lantern', 'rainbow_musicbox'];

export const TREEHOUSE_ITEMS = [
  // 1. 牆紙風格（wallpaper）
  { id: 'wood_cozy', slot: 'wallpaper', icon: '🪵', name: '暖木繪本牆', desc: '溫潤原木紋理，像走進森林裡的小樹屋。', source: 'free', price: 0 },
  { id: 'cream_bakery', slot: 'wallpaper', icon: '🧈', name: '奶油麵包黃', desc: '像剛烤好的奶油吐司一樣溫暖香甜。', source: 'shop', price: 55 },
  { id: 'ocean_breeze', slot: 'wallpaper', icon: '🌊', name: '泡泡海洋藍', desc: '清爽海風與細小水波紋，涼爽又好專心。', source: 'shop', price: 65 },
  { id: 'starry_violet', slot: 'wallpaper', icon: '🌌', name: '夢幻星空紫', desc: '夜空紫點綴閃亮小星塵，浪漫童話感滿分。', source: 'shop', price: 85 },

  // 2. 地毯樣式（rug）
  { id: 'carrot_round', slot: 'rug', icon: '🥕', name: '胡蘿蔔圓毯', desc: '軟綿綿橘粉圓地毯，小兔最愛在上面打滾。', source: 'free', price: 0 },
  { id: 'rainbow_stripe', slot: 'rug', icon: '🌈', name: '彩虹條紋毯', desc: '七彩編織條紋地毯，讓精靈夥伴跳得更開心！', source: 'shop', price: 50 },
  { id: 'checker_cream', slot: 'rug', icon: '♟️', name: '野餐棋盤格毯', desc: '奶油粉綠格紋地毯，像在森林裡開下午茶派對。', source: 'shop', price: 60 },

  // 3. 窗外風景（window）
  { id: 'forest_morning', slot: 'window', icon: '🌲', name: '森林清晨', desc: '窗外是翠綠森林與飄浮白雲，小鳥正唱歌呢。', source: 'free', price: 0 },
  { id: 'sunny_bay', slot: 'window', icon: '⛵', name: '陽光海灣', desc: '金色沙灘與藍藍海浪，還有帆船慢慢航過。', source: 'shop', price: 65 },
  { id: 'cloud_starlight', slot: 'window', icon: '🌠', name: '雲端星海', desc: '整片雲朵與流星銀河在窗外閃閃發光。', source: 'shop', price: 90 },

  // 4. 主家具（furniture）
  { id: 'block_shelf', slot: 'furniture', icon: '📚', name: '積木書架櫃', desc: '擺滿彩色十進位積木與數學繪本的木櫃。', source: 'free', price: 0 },
  { id: 'dessert_table', slot: 'furniture', icon: '🍰', name: '雙層甜點茶几', desc: '放著草莓蛋糕與熱可可的小圓茶几。', source: 'shop', price: 80 },
  { id: 'cloud_sofa', slot: 'furniture', icon: '☁️', name: '雲朵沙發組', desc: '蓬鬆軟綿的雲朵抱枕沙發，精靈坐上去就不想起來！', source: 'shop', price: 100 },

  // 5. 角落擺飾（decor）
  { id: 'sprout_pot', slot: 'decor', icon: '🪴', name: '微笑小盆栽', desc: '每天澆水就會長出新葉子的幸運小盆栽。', source: 'free', price: 0 },
  { id: 'trophy_stand', slot: 'decor', icon: '🏆', name: '冒險獎盃展示座', desc: '閃亮亮黃金獎盃，記錄粉紅小兔的勇敢戰績！', source: 'shop', price: 70 },
  { id: 'mini_globe', slot: 'decor', icon: '🌍', name: '航行迷你地球儀', desc: '標記三大海域航線的旋轉小地球儀。', source: 'shop', price: 75 },
  { id: 'gramophone', slot: 'decor', icon: '🎵', name: '童話留聲機', desc: '轉動把手就會飄出叮叮咚咚的快樂音符。', source: 'shop', price: 85 },
  { id: 'star_lantern', slot: 'decor', icon: '🏮', name: '星願樹屋吊燈', desc: '【冒險印章本滿 7 章限定贈禮】照亮整個樹屋的暖金星光吊燈！', source: 'stamp_reward', price: 0 },
  { id: 'rainbow_musicbox', slot: 'decor', icon: '🎼', name: '彩虹許願音樂盒', desc: '【冒險印章本第 2 輪滿 7 章限定贈禮】打開會飄出七彩音符！', source: 'stamp_reward', price: 0 }
];

export function getTreehouseItemById(id) {
  for (let i = 0; i < TREEHOUSE_ITEMS.length; i++) {
    if (TREEHOUSE_ITEMS[i].id === id) return TREEHOUSE_ITEMS[i];
  }
  return null;
}

export function getTreehouseItemsBySlot(slot) {
  return TREEHOUSE_ITEMS.filter((item) => item.slot === slot);
}

export const PARTNER_SNACKS = [
  {
    id: 'carrot_cookie',
    icon: '🍪',
    name: '胡蘿蔔餅乾',
    price: 20,
    bondXp: 20,
    desc: '烤得酥酥脆脆的胡蘿蔔造型餅乾，小精靈吃了立刻增加 +20 親密度！'
  },
  {
    id: 'star_jelly',
    icon: '🍮',
    name: '星空果凍',
    price: 45,
    bondXp: 50,
    desc: '閃著星塵微光的夢幻果凍，一口就能提升 +50 親密度！'
  }
];

export function getSnackById(id) {
  for (let i = 0; i < PARTNER_SNACKS.length; i++) {
    if (PARTNER_SNACKS[i].id === id) return PARTNER_SNACKS[i];
  }
  return null;
}
