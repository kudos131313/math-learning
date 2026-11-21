/**
 * 數學冒險島：秘密樹屋繪本場景 SVG 渲染器與物件互動台詞（純函式模組）
 */
import {
  getIslandById,
  getTreehouseItemById,
  getSpecialtyMeta,
  toCanonicalPartnerId
} from '../domain/quest-data.js';
import { getPartnerBondInfo } from '../domain/quest-retention.js';

const WALLPAPER_THEMES = {
  wood_cozy: { wallTop: '#fef3c7', wallBottom: '#fde68a', stripe: 'rgba(180,83,9,0.10)', beam: '#92400e', floor: '#d97706' },
  cream_bakery: { wallTop: '#fffbeb', wallBottom: '#fed7aa', stripe: 'rgba(245,158,11,0.12)', beam: '#b45309', floor: '#eab308' },
  ocean_breeze: { wallTop: '#e0f2fe', wallBottom: '#bae6fd', stripe: 'rgba(2,132,199,0.10)', beam: '#0369a1', floor: '#d6a26d' },
  starry_violet: { wallTop: '#ede9fe', wallBottom: '#ddd6fe', stripe: 'rgba(109,40,217,0.12)', beam: '#5b21b6', floor: '#c084fc' }
};

function renderWindowSvg(windowId) {
  let sky = '<rect x="6" y="6" width="128" height="108" rx="64" fill="#bae6fd"/>';
  let scene = '';
  if (windowId === 'sunny_bay') {
    sky = '<rect x="6" y="6" width="128" height="108" rx="64" fill="#7dd3fc"/>';
    scene =
      '<circle cx="102" cy="34" r="14" fill="#fde047"/>' +
      '<rect x="6" y="72" width="128" height="42" fill="#0284c7"/>' +
      '<path d="M12 80 Q40 74 70 80 T128 80" fill="none" stroke="#e0f2fe" stroke-width="2.5"/>' +
      '<polygon points="48,72 68,72 58,46" fill="#ffffff" stroke="#332b22" stroke-width="1.8"/>' +
      '<path d="M40 72 H76 L70 82 H46 Z" fill="#f97316" stroke="#332b22" stroke-width="1.8"/>';
  } else if (windowId === 'cloud_starlight') {
    sky = '<rect x="6" y="6" width="128" height="108" rx="64" fill="#1e1b4b"/>';
    scene =
      '<circle cx="42" cy="34" r="12" fill="#fef08a"/>' +
      '<circle cx="47" cy="31" r="10" fill="#1e1b4b"/>' +
      '<circle cx="94" cy="30" r="2.5" fill="#fde047"/><circle cx="76" cy="48" r="2" fill="#38bdf8"/>' +
      '<circle cx="108" cy="54" r="2.2" fill="#fbcfe8"/><circle cx="32" cy="64" r="2" fill="#ffffff"/>' +
      '<ellipse cx="52" cy="88" rx="34" ry="12" fill="#e0e7ff"/>' +
      '<ellipse cx="92" cy="92" rx="30" ry="11" fill="#c7d2fe"/>';
  } else {
    scene =
      '<circle cx="98" cy="34" r="13" fill="#fde047"/>' +
      '<ellipse cx="44" cy="38" rx="18" ry="8" fill="#ffffff"/>' +
      '<path d="M6 114 Q36 66 74 88 Q106 68 134 114 Z" fill="#4ade80"/>' +
      '<polygon points="36,88 26,114 46,114" fill="#16a34a"/>';
  }
  return (
    '<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><clipPath id="th-win-clip"><rect x="6" y="6" width="128" height="108" rx="60"/></clipPath></defs>' +
    '<g clip-path="url(#th-win-clip)">' + sky + scene + '</g>' +
    '<rect x="6" y="6" width="128" height="108" rx="60" fill="none" stroke="#78350f" stroke-width="6"/>' +
    '<line x1="70" y1="6" x2="70" y2="114" stroke="#78350f" stroke-width="4"/>' +
    '<line x1="6" y1="68" x2="134" y2="68" stroke="#78350f" stroke-width="4"/>' +
    '<rect x="2" y="108" width="136" height="10" rx="4" fill="#b45309" stroke="#332b22" stroke-width="2.4"/>' +
    '</svg>'
  );
}

function renderRugSvg(rugId) {
  if (rugId === 'rainbow_stripe') {
    return (
      '<svg viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="130" cy="34" rx="122" ry="25" fill="#fde047" stroke="#332b22" stroke-width="3"/>' +
      '<ellipse cx="130" cy="34" rx="102" ry="19" fill="#fb7185" stroke="#332b22" stroke-width="2"/>' +
      '<ellipse cx="130" cy="34" rx="80" ry="13" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
      '<ellipse cx="130" cy="34" rx="54" ry="8" fill="#a7f3d0"/>' +
      '</svg>'
    );
  }
  if (rugId === 'checker_cream') {
    return (
      '<svg viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="130" cy="34" rx="122" ry="25" fill="#fffbeb" stroke="#332b22" stroke-width="3"/>' +
      '<ellipse cx="130" cy="34" rx="106" ry="20" fill="#bbf7d0" stroke="#15803d" stroke-width="2" stroke-dasharray="14 10"/>' +
      '<ellipse cx="130" cy="34" rx="74" ry="12" fill="#fbcfe8"/>' +
      '</svg>'
    );
  }
  return (
    '<svg viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="130" cy="34" rx="122" ry="25" fill="#fed7aa" stroke="#332b22" stroke-width="3"/>' +
    '<ellipse cx="130" cy="34" rx="100" ry="19" fill="#fb923c" stroke="#9a3412" stroke-width="2" stroke-dasharray="8 5"/>' +
    '<ellipse cx="130" cy="34" rx="64" ry="11" fill="#fff7ed"/>' +
    '</svg>'
  );
}

function renderFurnitureSvg(furnitureId) {
  if (furnitureId === 'dessert_table') {
    return (
      '<svg viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="65" cy="103" rx="46" ry="5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="30" y="64" width="10" height="40" rx="3" fill="#b45309" stroke="#332b22" stroke-width="2.4"/>' +
      '<rect x="90" y="64" width="10" height="40" rx="3" fill="#b45309" stroke="#332b22" stroke-width="2.4"/>' +
      '<ellipse cx="65" cy="64" rx="54" ry="13" fill="#fde68a" stroke="#332b22" stroke-width="2.8"/>' +
      '<ellipse cx="65" cy="62" rx="46" ry="9" fill="#fef3c7"/>' +
      '<rect x="44" y="34" width="42" height="22" rx="6" fill="#fbcfe8" stroke="#332b22" stroke-width="2.2"/>' +
      '<path d="M44 42 Q54 48 65 42 Q76 48 86 42" fill="#ffffff" stroke="#332b22" stroke-width="1.8"/>' +
      '<circle cx="65" cy="29" r="5" fill="#f43f5e" stroke="#332b22" stroke-width="1.8"/><circle cx="63.5" cy="27.5" r="1.5" fill="#ffffff"/>' +
      '<rect x="92" y="47" width="16" height="12" rx="4" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
      '<path d="M108 50 C113 50 113 56 108 56" fill="none" stroke="#332b22" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>'
    );
  }
  if (furnitureId === 'cloud_sofa') {
    return (
      '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="70" cy="103" rx="54" ry="5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="30" y="88" width="12" height="14" rx="4" fill="#92400e" stroke="#332b22" stroke-width="2.2"/>' +
      '<rect x="98" y="88" width="12" height="14" rx="4" fill="#92400e" stroke="#332b22" stroke-width="2.2"/>' +
      '<ellipse cx="42" cy="48" rx="26" ry="22" fill="#e0f2fe" stroke="#332b22" stroke-width="2.8"/>' +
      '<ellipse cx="98" cy="48" rx="26" ry="22" fill="#e0f2fe" stroke="#332b22" stroke-width="2.8"/>' +
      '<ellipse cx="70" cy="40" rx="32" ry="24" fill="#ffffff" stroke="#332b22" stroke-width="2.8"/>' +
      '<rect x="18" y="58" width="104" height="30" rx="14" fill="#bae6fd" stroke="#332b22" stroke-width="2.8"/>' +
      '<path d="M30 64 H110" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.75"/>' +
      '<polygon points="48,66 51,71 57,72 52,76 53,81 48,78 43,81 44,76 39,72 45,71" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<ellipse cx="92" cy="69" rx="11" ry="8" transform="rotate(12 92 69)" fill="#fbcfe8" stroke="#332b22" stroke-width="1.8"/>' +
      '</svg>'
    );
  }
  return (
    '<svg viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="65" cy="103" rx="50" ry="5" fill="rgba(51,43,34,0.15)"/>' +
    '<rect x="18" y="14" width="94" height="88" rx="10" fill="#d97706" stroke="#332b22" stroke-width="3"/>' +
    '<rect x="26" y="22" width="78" height="24" rx="4" fill="#fef3c7" stroke="#332b22" stroke-width="2"/>' +
    '<rect x="26" y="54" width="78" height="26" rx="4" fill="#fef3c7" stroke="#332b22" stroke-width="2"/>' +
    '<rect x="33" y="28" width="10" height="17" rx="2" fill="#fb7185" stroke="#332b22" stroke-width="1.5"/>' +
    '<rect x="45" y="25" width="10" height="20" rx="2" fill="#38bdf8" stroke="#332b22" stroke-width="1.5"/>' +
    '<rect x="57" y="30" width="10" height="15" rx="2" fill="#4ade80" stroke="#332b22" stroke-width="1.5"/>' +
    '<rect x="76" y="29" width="16" height="16" rx="2" fill="#60a5fa" stroke="#332b22" stroke-width="1.6"/>' +
    '<rect x="34" y="62" width="22" height="14" rx="3" fill="#fb923c" stroke="#332b22" stroke-width="1.6"/>' +
    '<rect x="64" y="60" width="28" height="16" rx="3" fill="#a78bfa" stroke="#332b22" stroke-width="1.6"/>' +
    '<circle cx="48" cy="91" r="2.5" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
    '<circle cx="82" cy="91" r="2.5" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
    '</svg>'
  );
}

function renderDecorSvg(decorId) {
  if (decorId === 'trophy_stand') {
    return (
      '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="45" cy="93" rx="26" ry="4.5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="25" y="72" width="40" height="20" rx="5" fill="#92400e" stroke="#332b22" stroke-width="2.4"/>' +
      '<path d="M30 28 C19 28 19 42 32 44 M60 28 C71 28 71 42 58 44" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M30 22 H60 L55 48 Q45 58 35 48 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<rect x="41" y="52" width="8" height="16" fill="#f59e0b" stroke="#332b22" stroke-width="2"/>' +
      '<rect x="33" y="65" width="24" height="7" rx="3" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
      '<polygon points="45,28 47,33 52,33 48,36 49,41 45,38 41,41 42,36 38,33 43,33" fill="#ffffff"/>' +
      '</svg>'
    );
  }
  if (decorId === 'mini_globe') {
    return (
      '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="45" cy="92" rx="25" ry="4.5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="26" y="76" width="38" height="14" rx="5" fill="#b45309" stroke="#332b22" stroke-width="2.4"/>' +
      '<path d="M45 62 V76" stroke="#332b22" stroke-width="4"/>' +
      '<path d="M25 22 A24 24 0 1 1 65 58" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="45" cy="40" r="20" fill="#38bdf8" stroke="#332b22" stroke-width="2.6"/>' +
      '<path d="M34 32 Q42 28 46 36 Q54 34 56 44 Q46 50 38 44 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.4"/>' +
      '<circle cx="38" cy="29" r="2.2" fill="#ffffff" opacity="0.8"/>' +
      '</svg>'
    );
  }
  if (decorId === 'gramophone') {
    return (
      '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="45" cy="92" rx="28" ry="4.5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="20" y="60" width="50" height="30" rx="6" fill="#b45309" stroke="#332b22" stroke-width="2.6"/>' +
      '<rect x="27" y="67" width="36" height="16" rx="4" fill="#fde68a" stroke="#332b22" stroke-width="1.8"/>' +
      '<ellipse cx="45" cy="60" rx="18" ry="4" fill="#1e293b"/>' +
      '<path d="M54 58 Q62 40 46 28 L32 16 Q56 12 68 34 Q68 48 54 58 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<ellipse cx="34" cy="24" rx="6" ry="10" transform="rotate(-24 34 24)" fill="#fde047" stroke="#332b22" stroke-width="2.2"/>' +
      '<g stroke="#332b22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="17" cy="30" r="3.4" fill="#fb7185"/>' +
      '<circle cx="27" cy="27" r="3.4" fill="#38bdf8"/>' +
      '<path d="M20 30 V17 L30 14 V27" fill="none"/>' +
      '</g>' +
      '</svg>'
    );
  }
  if (decorId === 'star_lantern') {
    return (
      '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="45" cy="92" rx="22" ry="4" fill="rgba(51,43,34,0.13)"/>' +
      '<line x1="45" y1="0" x2="45" y2="24" stroke="#332b22" stroke-width="3"/>' +
      '<circle cx="45" cy="52" r="28" fill="#fef08a" opacity="0.45"/>' +
      '<polygon points="45,22 52,40 71,42 56,55 60,74 45,64 30,74 34,55 19,42 38,40" fill="#fde047" stroke="#b45309" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<circle cx="45" cy="49" r="6" fill="#ffffff"/>' +
      '</svg>'
    );
  }
  if (decorId === 'rainbow_musicbox') {
    return (
      '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="45" cy="91" rx="29" ry="4.5" fill="rgba(51,43,34,0.15)"/>' +
      '<rect x="18" y="54" width="54" height="34" rx="8" fill="#f472b6" stroke="#332b22" stroke-width="2.6"/>' +
      '<path d="M22 54 L30 34 H66 L58 54 Z" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M28 48 A16 16 0 0 1 60 48" fill="none" stroke="#38bdf8" stroke-width="3"/>' +
      '<path d="M32 48 A12 12 0 0 1 56 48" fill="none" stroke="#fde047" stroke-width="3"/>' +
      '<polygon points="45,64 47,69 52,69 48,72 49,77 45,74 41,77 42,72 38,69 43,69" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '</svg>'
    );
  }
  return (
    '<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="45" cy="92" rx="22" ry="4.5" fill="rgba(51,43,34,0.15)"/>' +
    '<path d="M26 60 H64 L58 90 H32 Z" fill="#fb923c" stroke="#332b22" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<rect x="22" y="54" width="46" height="9" rx="4" fill="#fdba74" stroke="#332b22" stroke-width="2.4"/>' +
    '<line x1="45" y1="54" x2="45" y2="34" stroke="#15803d" stroke-width="3.6" stroke-linecap="round"/>' +
    '<path d="M45 38 C31 24 22 36 33 44 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.2"/>' +
    '<path d="M45 38 C59 24 68 36 57 44 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2"/>' +
    '<circle cx="45" cy="28" r="6" fill="#fde047" stroke="#332b22" stroke-width="2"/><circle cx="43.5" cy="26.5" r="1.8" fill="#ffffff"/>' +
    '</svg>'
  );
}

export function getTreehouseInteractMessage(kind, itemId) {
  if (kind === 'bunny') {
    const lines = [
      '🐰 粉紅小兔開心地轉了一圈：「今天的樹屋好溫暖，我們一起再破一關吧！」',
      '🐰 粉紅小兔揮揮手：「換上新造型心情超好！快去邀請守護小精靈來玩！」',
      '🐰 粉紅小兔笑嘻嘻：「在樹屋點一點家具，就能完成每日暖身委託喔！」'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  const item = getTreehouseItemById(itemId);
  if (item) {
    return item.icon + ' 點擊了【' + item.name + '】！' + item.desc;
  }
  return '🏡 樹屋裡傳來開心的笑聲！';
}

export function renderTreehouseSceneHtml({
  slots = {},
  playmates = [],
  wardrobe = {},
  bonds = {},
  selectedPlaymateId = '',
  getPinkBunnySvg,
  getCharacterSvg
}) {
  const wallKey = slots.wallpaper || 'wood_cozy';
  const theme = WALLPAPER_THEMES[wallKey] || WALLPAPER_THEMES.wood_cozy;
  const winId = slots.window || 'forest_morning';
  const rugId = slots.rug || 'carrot_round';
  const furnId = slots.furniture || 'block_shelf';
  const decorId = slots.decor || 'sprout_pot';

  let playmateSlotsHtml = '';
  for (let i = 0; i < 3; i++) {
    const pid = playmates[i] ? toCanonicalPartnerId(playmates[i]) : '';
    const isl = pid ? getIslandById(pid) : null;
    if (isl) {
      const bond = bonds[isl.fullId] || { xp: 0, level: 1 };
      const specMeta = getSpecialtyMeta(isl.specialty);
      const isSelected = selectedPlaymateId === isl.fullId;
      playmateSlotsHtml +=
        '<button type="button" class="mqst-th-playmate-slot is-occupied' +
        (isSelected ? ' is-selected' : '') +
        (bond.level >= 3 ? ' is-lv3' : '') +
        '" data-th-playmate-btn="' +
        isl.fullId +
        '" aria-label="' +
        isl.spriteName +
        ' 親密度 Lv.' +
        bond.level +
        '">' +
        '<span class="mqst-th-sprite-lv">' +
        specMeta.icon +
        ' Lv.' +
        bond.level +
        '</span>' +
        '<div class="mqst-th-sprite-svg">' +
        getCharacterSvg(isl.theme, false, isSelected ? 'happy' : 'normal', { bondLevel: bond.level }) +
        '</div>' +
        '<span class="mqst-th-sprite-name">' +
        isl.spriteName +
        '</span>' +
        '</button>';
    } else {
      playmateSlotsHtml +=
        '<button type="button" class="mqst-th-playmate-slot is-empty" data-th-empty-slot="' +
        i +
        '" aria-label="空的精靈遊樂位，點此邀請守護小精靈">' +
        '<span class="mqst-th-empty-cushion">➕ 邀請精靈</span>' +
        '</button>';
    }
  }

  return (
    '<div class="mqst-th-room" style="--th-wall-top:' +
    theme.wallTop +
    ';--th-wall-bottom:' +
    theme.wallBottom +
    ';--th-wall-stripe:' +
    theme.stripe +
    ';--th-beam:' +
    theme.beam +
    ';--th-floor:' +
    theme.floor +
    ';">' +
    '<div class="mqst-th-beam-top" aria-hidden="true"></div>' +
    '<div class="mqst-th-wall-items">' +
    '<button type="button" class="mqst-th-obj mqst-th-furniture" data-th-interact="furniture" data-item-id="' +
    furnId +
    '" aria-label="點擊主家具互動">' +
    renderFurnitureSvg(furnId) +
    '</button>' +
    '<button type="button" class="mqst-th-obj mqst-th-window" data-th-interact="window" data-item-id="' +
    winId +
    '" aria-label="點擊窗外風景互動">' +
    renderWindowSvg(winId) +
    '</button>' +
    '<button type="button" class="mqst-th-obj mqst-th-decor" data-th-interact="decor" data-item-id="' +
    decorId +
    '" aria-label="點擊角落擺飾互動">' +
    renderDecorSvg(decorId) +
    '</button>' +
    '</div>' +
    '<div class="mqst-th-floor">' +
    '<button type="button" class="mqst-th-rug" data-th-interact="rug" data-item-id="' +
    rugId +
    '" aria-label="點擊樹屋地毯互動">' +
    renderRugSvg(rugId) +
    '</button>' +
    '<div class="mqst-th-characters-row">' +
    '<button type="button" class="mqst-th-bunny-btn" data-th-interact="bunny" aria-label="與粉紅小兔互動">' +
    getPinkBunnySvg('happy', wardrobe) +
    '<span class="mqst-th-bunny-tag">粉紅小兔</span>' +
    '</button>' +
    '<div class="mqst-th-playmates-row" role="group" aria-label="三個守護小精靈遊樂位">' +
    playmateSlotsHtml +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

export { getPartnerBondInfo };
