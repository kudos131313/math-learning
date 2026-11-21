/**
 * 數學冒險島：秘密樹屋繪本場景 SVG 渲染器、實物縮圖與物件互動台詞（純函式模組）
 */
import {
  getIslandById,
  getTreehouseItemById,
  getSpecialtyMeta,
  toCanonicalPartnerId,
  DEFAULT_TREEHOUSE_SLOTS
} from '../domain/quest-data.js';
import { getPartnerBondInfo } from '../domain/quest-retention.js';

let svgUidCounter = 0;
function nextSvgId(prefix) {
  svgUidCounter += 1;
  return prefix + '-' + svgUidCounter;
}

const INK = '#332b22';

const WALLPAPER_THEMES = {
  wood_cozy: {
    bgSrc: 'assets/quest/treehouse-wood.jpg',
    fallbackBg: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 58%, #d97706 58%, #b45309 100%)',
    sunbeamColor: 'rgba(255, 250, 224, 0.30)',
    lampColor: 'rgba(253, 224, 71, 0.34)',
    dustColor: '#fef9c3',
    frameAccent: '#b45309',
    ambientTint: 'rgba(254, 243, 199, 0.06)'
  },
  cream_bakery: {
    bgSrc: 'assets/quest/treehouse-cream.jpg',
    fallbackBg: 'linear-gradient(180deg, #fffbeb 0%, #fed7aa 58%, #eab308 58%, #ca8a04 100%)',
    sunbeamColor: 'rgba(255, 247, 230, 0.32)',
    lampColor: 'rgba(251, 191, 36, 0.34)',
    dustColor: '#fff7ed',
    frameAccent: '#d97706',
    ambientTint: 'rgba(255, 237, 213, 0.06)'
  },
  ocean_breeze: {
    bgSrc: 'assets/quest/treehouse-ocean.jpg',
    fallbackBg: 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 58%, #d6a26d 58%, #a16207 100%)',
    sunbeamColor: 'rgba(224, 242, 254, 0.32)',
    lampColor: 'rgba(253, 224, 71, 0.28)',
    dustColor: '#e0f2fe',
    frameAccent: '#0284c7',
    ambientTint: 'rgba(186, 230, 253, 0.06)'
  },
  starry_violet: {
    bgSrc: 'assets/quest/treehouse-starry.jpg',
    fallbackBg: 'linear-gradient(180deg, #ede9fe 0%, #ddd6fe 58%, #a855f7 58%, #6b21a8 100%)',
    sunbeamColor: 'rgba(221, 214, 254, 0.20)',
    lampColor: 'rgba(253, 224, 71, 0.40)',
    dustColor: '#fef08a',
    frameAccent: '#7c3aed',
    ambientTint: 'rgba(139, 92, 246, 0.08)'
  }
};

export function getTreehouseWallpaperMeta(wallKey) {
  return WALLPAPER_THEMES[wallKey] || WALLPAPER_THEMES.wood_cozy;
}

export function isLightableCeiling(itemId) {
  return itemId === 'pinecone_lights' || itemId === 'star_lantern';
}

/* ---------------- 1. 天花板吊飾 SVG (260x88) ---------------- */
function renderCeilingSvg(ceilingId, { lampLit = true } = {}) {
  if (ceilingId === 'pinecone_lights') {
    const glowOp = lampLit ? '0.52' : '0.12';
    const bulbFill = lampLit ? '#fde047' : '#fed7aa';
    const bulbs = [
      { x: 42, y: 27, r: 0 },
      { x: 86, y: 38, r: -4 },
      { x: 130, y: 42, r: 0 },
      { x: 174, y: 38, r: 4 },
      { x: 218, y: 27, r: 0 }
    ];
    let bulbsSvg = '';
    bulbs.forEach((b) => {
      bulbsSvg +=
        `<g transform="translate(${b.x} ${b.y}) rotate(${b.r})">` +
        `<circle cx="0" cy="18" r="19" fill="#fef08a" opacity="${glowOp}"/>` +
        `<path d="M-7 4 Q0 -4 7 4 L5 10 H-5 Z" fill="#92400e" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M-8 10 C-9 22 -5 29 0 30 C5 29 9 22 8 10 Z" fill="${bulbFill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M-4 15 H4 M-3 20 H3" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/>` +
        `<circle cx="-2.5" cy="13" r="1.8" fill="#ffffff" opacity="0.85"/>` +
        '</g>';
    });
    return (
      '<svg viewBox="0 0 260 88" xmlns="http://www.w3.org/2000/svg">' +
      `<path d="M12 10 Q130 56 248 10" fill="none" stroke="#15803d" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M12 10 Q130 56 248 10" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>` +
      '<g class="mqst-th-sway-part">' +
      bulbsSvg +
      '</g>' +
      `<circle cx="14" cy="10" r="5" fill="#d97706" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="246" cy="10" r="5" fill="#d97706" stroke="${INK}" stroke-width="2"/>` +
      '</svg>'
    );
  }

  if (ceilingId === 'cloud_windchime') {
    const gid = nextSvgId('th-chime-cloud');
    const strings = [
      { x: 96, len: 32, kind: 'star', c: '#fb7185' },
      { x: 113, len: 42, kind: 'bell', c: '#fde047' },
      { x: 130, len: 48, kind: 'moon', c: '#38bdf8' },
      { x: 147, len: 40, kind: 'bell', c: '#a78bfa' },
      { x: 164, len: 30, kind: 'star', c: '#4ade80' }
    ];
    let chimesSvg = '';
    strings.forEach((s) => {
      const cy = 34 + s.len;
      chimesSvg += `<line x1="${s.x}" y1="34" x2="${s.x}" y2="${cy - 6}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
      if (s.kind === 'star') {
        chimesSvg += `<polygon points="${s.x},${cy - 8} ${s.x + 2.5},${cy - 2} ${s.x + 8},${cy - 1} ${s.x + 4},${cy + 3} ${s.x + 5},${cy + 9} ${s.x},${cy + 6} ${s.x - 5},${cy + 9} ${s.x - 4},${cy + 3} ${s.x - 8},${cy - 1} ${s.x - 2.5},${cy - 2}" fill="${s.c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
      } else if (s.kind === 'moon') {
        chimesSvg += `<path d="M${s.x + 4} ${cy - 7} A8 8 0 1 0 ${s.x + 4} ${cy + 8} A6 6 0 1 1 ${s.x + 4} ${cy - 7} Z" fill="${s.c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
      } else {
        chimesSvg += `<path d="M${s.x - 6} ${cy + 5} H${s.x + 6} L${s.x + 4} ${cy - 5} Q${s.x} ${cy - 8} ${s.x - 4} ${cy - 5} Z" fill="${s.c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${s.x}" cy="${cy + 7}" r="2.2" fill="#f97316" stroke="${INK}" stroke-width="1.4"/>`;
      }
    });
    return (
      '<svg viewBox="0 0 260 88" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient></defs>` +
      `<line x1="130" y1="0" x2="130" y2="14" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>` +
      '<g class="mqst-th-sway-part">' +
      chimesSvg +
      `<path d="M90 36 C82 36 78 28 84 22 C84 12 97 7 108 13 C114 4 132 2 142 11 C152 6 168 12 169 22 C176 26 173 36 164 36 Z" fill="url(#${gid})" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<circle cx="119" cy="24" r="1.8" fill="${INK}"/><circle cx="139" cy="24" r="1.8" fill="${INK}"/>` +
      `<path d="M126 27 Q129 30 132 27" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<ellipse cx="113" cy="27" rx="3.2" ry="1.8" fill="#fb7185" opacity="0.6"/><ellipse cx="145" cy="27" rx="3.2" ry="1.8" fill="#fb7185" opacity="0.6"/>` +
      '</g>' +
      '</svg>'
    );
  }

  if (ceilingId === 'star_lantern') {
    const gid = nextSvgId('th-star-lantern');
    const glowOp = lampLit ? '0.62' : '0.15';
    const coreFill = lampLit ? '#fef9c3' : '#fde68a';
    return (
      '<svg viewBox="0 0 260 88" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>` +
      `<rect x="118" y="0" width="24" height="8" rx="4" fill="#92400e" stroke="${INK}" stroke-width="2.2"/>` +
      '<g class="mqst-th-sway-part">' +
      `<line x1="130" y1="8" x2="130" y2="24" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="130" cy="52" r="34" fill="#fde047" opacity="${glowOp}"/>` +
      `<polygon points="130,20 139,39 160,41 144,54 149,75 130,64 111,75 116,54 100,41 121,39" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<polygon points="130,30 136,42 149,43 139,51 142,64 130,57 118,64 121,51 111,43 124,42" fill="${coreFill}" stroke="#b45309" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<circle cx="130" cy="49" r="5" fill="#ffffff" opacity="${lampLit ? '0.95' : '0.5'}"/>` +
      `<circle cx="94" cy="30" r="2.2" fill="#fde047" opacity="${glowOp}"/><circle cx="166" cy="34" r="2.5" fill="#fef08a" opacity="${glowOp}"/>` +
      '</g>' +
      '</svg>'
    );
  }

  // 預設：forest_bunting 森林三角彩旗
  const flags = [
    { x: 30, y: 18, rot: 14, c1: '#fda4af', c2: '#fb7185', dot: '#fff1f2' },
    { x: 63, y: 28, rot: 9, c1: '#fef08a', c2: '#facc15', dot: '#ffffff' },
    { x: 96, y: 35, rot: 4, c1: '#7dd3fc', c2: '#38bdf8', dot: '#f0f9ff' },
    { x: 130, y: 37, rot: 0, c1: '#86efac', c2: '#4ade80', dot: '#ffffff' },
    { x: 164, y: 35, rot: -4, c1: '#fdba74', c2: '#fb923c', dot: '#fff7ed' },
    { x: 197, y: 28, rot: -9, c1: '#ddd6fe', c2: '#a78bfa', dot: '#ffffff' },
    { x: 230, y: 18, rot: -14, c1: '#f9a8d4', c2: '#f472b6', dot: '#fdf2f8' }
  ];
  let flagsHtml = '';
  flags.forEach((f, idx) => {
    const fgid = nextSvgId('th-flag-' + idx);
    flagsHtml +=
      `<defs><linearGradient id="${fgid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${f.c1}"/><stop offset="100%" stop-color="${f.c2}"/></linearGradient></defs>` +
      `<g transform="translate(${f.x} ${f.y}) rotate(${f.rot})">` +
      `<polygon points="-13,0 13,0 0,26" fill="url(#${fgid})" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<circle cx="0" cy="9" r="3" fill="${f.dot}" opacity="0.9"/>` +
      '</g>';
  });
  return (
    '<svg viewBox="0 0 260 88" xmlns="http://www.w3.org/2000/svg">' +
    `<path d="M10 10 Q130 56 250 10" fill="none" stroke="#92400e" stroke-width="3.2" stroke-linecap="round"/>` +
    '<g class="mqst-th-sway-part">' +
    flagsHtml +
    '</g>' +
    `<path d="M6 8 L18 14 L10 19 Z" fill="#fb7185" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M254 8 L242 14 L250 19 Z" fill="#fb7185" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    '</svg>'
  );
}

/* ---------------- 2. 剪紙景深窗景 SVG (180x156) ---------------- */
function renderWindowSvg(windowId) {
  const clipId = nextSvgId('th-win-clip');
  const skyGradId = nextSvgId('th-win-sky');
  let skyGrad = `<linearGradient id="${skyGradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient>`;
  let scene = '';
  let sillProp = '';
  let curtainMain = '#fb7185';
  let curtainStripe = '#fda4af';

  if (windowId === 'sunny_bay') {
    skyGrad = `<linearGradient id="${skyGradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#fef9c3"/></linearGradient>`;
    curtainMain = '#fb923c';
    curtainStripe = '#fed7aa';
    scene =
      `<circle cx="122" cy="44" r="15" fill="#fde047" stroke="#f59e0b" stroke-width="2"/>` +
      `<ellipse cx="58" cy="40" rx="18" ry="8" fill="#ffffff" opacity="0.9"/>` +
      `<path d="M52 28 Q56 24 60 28 Q64 24 68 28" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M22 92 Q62 84 158 92 V136 H22 Z" fill="#0ea5e9"/>` +
      `<path d="M22 98 Q46 92 72 98 T122 98 T160 98" fill="none" stroke="#e0f2fe" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M116 92 Q136 74 158 88 V94 H116 Z" fill="#fde68a" stroke="${INK}" stroke-width="1.6"/>` +
      '<g class="mqst-th-win-boat">' +
      `<polygon points="74,90 96,90 84,56" fill="#ffffff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<polygon points="84,60 99,86 84,86" fill="#fb7185" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M62 90 H106 L99 102 H69 Z" fill="#f97316" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      '</g>';
    sillProp =
      `<path d="M132 132 C132 122 148 122 148 132 Z" fill="#fbcfe8" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M136 132 V124 M140 132 V123 M144 132 V124" stroke="${INK}" stroke-width="1.2"/>`;
  } else if (windowId === 'cloud_starlight') {
    skyGrad = `<linearGradient id="${skyGradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b2f6e"/><stop offset="65%" stop-color="#5b4b9c"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient>`;
    curtainMain = '#a78bfa';
    curtainStripe = '#ddd6fe';
    scene =
      `<circle cx="56" cy="46" r="14" fill="#fef08a"/>` +
      `<circle cx="62" cy="42" r="11.5" fill="#463982"/>` +
      '<g class="mqst-th-win-stars">' +
      `<polygon points="116,32 118,37 123,38 118,40 116,45 114,40 109,38 114,37" fill="#fde047"/>` +
      `<polygon points="94,54 95.5,58 99.5,59 95.5,60.5 94,64.5 92.5,60.5 88.5,59 92.5,58" fill="#fef9c3"/>` +
      `<circle cx="134" cy="58" r="2.6" fill="#7dd3fc"/><circle cx="72" cy="70" r="2.2" fill="#fbcfe8"/><circle cx="44" cy="76" r="2" fill="#ffffff"/>` +
      '</g>' +
      `<ellipse cx="58" cy="112" rx="40" ry="15" fill="#e0e7ff"/>` +
      `<ellipse cx="116" cy="118" rx="44" ry="16" fill="#c7d2fe"/>` +
      `<ellipse cx="86" cy="124" rx="48" ry="14" fill="#eef2ff"/>`;
    sillProp =
      `<polygon points="42,118 45,124 51,125 46,129 47,134 42,131 37,134 38,129 33,125 39,124" fill="#fde047" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  } else {
    // forest_morning
    scene =
      `<circle cx="122" cy="42" r="14" fill="#fde047" stroke="#f59e0b" stroke-width="1.8"/>` +
      `<ellipse cx="58" cy="42" rx="20" ry="9" fill="#ffffff" opacity="0.95"/>` +
      `<ellipse cx="72" cy="46" rx="14" ry="7" fill="#ffffff" opacity="0.95"/>` +
      `<path d="M22 134 Q54 78 96 102 Q130 82 158 134 Z" fill="#86efac"/>` +
      `<path d="M22 134 Q68 96 112 114 Q142 98 158 134 Z" fill="#4ade80"/>` +
      `<polygon points="50,94 34,132 66,132" fill="#16a34a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<polygon points="134,102 120,132 148,132" fill="#22c55e" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M24 88 Q42 84 54 90" fill="none" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>` +
      '<g class="mqst-th-win-bird">' +
      `<ellipse cx="44" cy="80" rx="8" ry="6.5" fill="#38bdf8" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="49" cy="77" r="4.5" fill="#38bdf8" stroke="${INK}" stroke-width="1.8"/>` +
      `<polygon points="53,77 58,79 53,80" fill="#fb923c" stroke="${INK}" stroke-width="1.2"/>` +
      `<circle cx="50" cy="76.5" r="1.2" fill="${INK}"/>` +
      '</g>';
    sillProp =
      `<path d="M126 122 H144 L141 134 H129 Z" fill="#fb923c" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<circle cx="131" cy="117" r="4" fill="#fde047" stroke="${INK}" stroke-width="1.4"/>` +
      `<circle cx="139" cy="116" r="4" fill="#fb7185" stroke="${INK}" stroke-width="1.4"/>`;
  }

  return (
    '<svg viewBox="0 0 180 156" xmlns="http://www.w3.org/2000/svg">' +
    `<defs><clipPath id="${clipId}"><rect x="24" y="14" width="132" height="122" rx="66"/></clipPath>${skyGrad}</defs>` +
    `<ellipse cx="90" cy="146" rx="74" ry="6" fill="rgba(51,43,34,0.16)"/>` +
    `<rect x="18" y="8" width="144" height="132" rx="72" fill="#92400e" stroke="${INK}" stroke-width="3"/>` +
    `<g clip-path="url(#${clipId})">` +
    `<rect x="24" y="14" width="132" height="122" fill="url(#${skyGradId})"/>` +
    scene +
    // 左右綁帶可愛布窗簾
    `<path d="M24 14 H58 Q48 56 36 82 Q44 108 50 136 H24 Z" fill="${curtainMain}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M24 14 H42 Q37 54 30 82" fill="none" stroke="${curtainStripe}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M156 14 H122 Q132 56 144 82 Q136 108 130 136 H156 Z" fill="${curtainMain}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M156 14 H138 Q143 54 150 82" fill="none" stroke="${curtainStripe}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="26" y="78" width="12" height="6" rx="3" fill="#fde047" stroke="${INK}" stroke-width="1.6"/>` +
    `<rect x="142" y="78" width="12" height="6" rx="3" fill="#fde047" stroke="${INK}" stroke-width="1.6"/>` +
    '</g>' +
    // 窗格木框與十字窗欞
    `<rect x="24" y="14" width="132" height="122" rx="66" fill="none" stroke="${INK}" stroke-width="3"/>` +
    `<line x1="90" y1="14" x2="90" y2="134" stroke="#78350f" stroke-width="4.5"/>` +
    `<line x1="24" y1="80" x2="156" y2="80" stroke="#78350f" stroke-width="4.5"/>` +
    `<line x1="90" y1="14" x2="90" y2="134" stroke="${INK}" stroke-width="1.4" opacity="0.45"/>` +
    // 窗台與擺設
    `<rect x="12" y="132" width="156" height="14" rx="6" fill="#d97706" stroke="${INK}" stroke-width="2.8"/>` +
    `<rect x="18" y="135" width="144" height="4" rx="2" fill="#fbbf24" opacity="0.5"/>` +
    sillProp +
    '</svg>'
  );
}

/* ---------------- 3. 牆面掛飾 SVG (160x124) 含真實數學戰績連動 ---------------- */
function renderWallDecorSvg(wallDecorId, progressStats = {}) {
  const totalStars = Math.max(0, Math.floor(Number(progressStats.totalStars || 0)));
  const maxStars = Math.max(1, Math.floor(Number(progressStats.maxStars || 135)));
  const litGems = Math.max(0, Math.floor(Number(progressStats.litGems || 0)));
  const spriteCount = Math.max(0, Math.floor(Number(progressStats.spriteCount || 0)));
  const maxSprites = Math.max(1, Math.floor(Number(progressStats.maxSprites || 15)));
  const realmStars = progressStats.realmStars || {};

  if (wallDecorId === 'realm_map_frame') {
    const gid = nextSvgId('th-map-parch');
    return (
      '<svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fde68a"/></linearGradient></defs>` +
      `<polyline points="52,22 80,8 108,22" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="80" cy="8" r="3.5" fill="#fbbf24" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="12" y="20" width="136" height="94" rx="12" fill="#b45309" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="20" y="28" width="120" height="78" rx="7" fill="url(#${gid})" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M24 68 Q62 56 90 70 T136 62" fill="none" stroke="#38bdf8" stroke-width="10" opacity="0.32" stroke-linecap="round"/>` +
      // 三大海域島嶼小地標
      `<circle cx="42" cy="54" r="11" fill="#fed7aa" stroke="${INK}" stroke-width="1.8"/><circle cx="42" cy="54" r="4" fill="#f97316"/>` +
      `<path d="M72 48 Q84 36 96 48 Q98 62 82 64 Q68 60 72 48 Z" fill="#86efac" stroke="${INK}" stroke-width="1.8"/>` +
      `<ellipse cx="118" cy="46" rx="14" ry="9" fill="#e0f2fe" stroke="${INK}" stroke-width="1.8"/>` +
      // 紅虛線航道與小旗
      `<path d="M48 62 Q68 82 84 62 T116 54" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-dasharray="4 4" stroke-linecap="round"/>` +
      `<circle cx="122" cy="86" r="10" fill="#ffffff" stroke="${INK}" stroke-width="1.8"/>` +
      `<polygon points="122,78 125,86 122,94 119,86" fill="#ef4444"/>` +
      `<polygon points="114,86 122,83 130,86 122,89" fill="#38bdf8"/>` +
      '</svg>'
    );
  }

  if (wallDecorId === 'cuckoo_clock') {
    const gid = nextSvgId('th-clock-wood');
    return (
      '<svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs>` +
      // 擺動的鐘擺與砝碼鏈
      '<g class="mqst-th-clock-pendulum">' +
      `<line x1="80" y1="78" x2="80" y2="110" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>` +
      `<circle cx="80" cy="112" r="8" fill="#fde047" stroke="${INK}" stroke-width="2.4"/>` +
      `<circle cx="80" cy="112" r="3" fill="#f97316"/>` +
      '</g>' +
      `<line x1="64" y1="86" x2="64" y2="106" stroke="${INK}" stroke-width="2" stroke-dasharray="3 2"/>` +
      `<path d="M60 104 H68 L66 116 H62 Z" fill="#92400e" stroke="${INK}" stroke-width="1.8"/>` +
      `<line x1="96" y1="86" x2="96" y2="106" stroke="${INK}" stroke-width="2" stroke-dasharray="3 2"/>` +
      `<path d="M92 104 H100 L98 116 H94 Z" fill="#92400e" stroke="${INK}" stroke-width="1.8"/>` +
      // 小木屋鐘身
      `<rect x="44" y="34" width="72" height="56" rx="10" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8"/>` +
      `<polygon points="32,38 80,6 128,38 118,46 80,19 42,46" fill="#dc2626" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
      // 小鳥小窗
      `<path d="M72 34 A8 8 0 0 1 88 34 V40 H72 Z" fill="#451a03" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="80" cy="34" r="4.5" fill="#fde047" stroke="${INK}" stroke-width="1.6"/>` +
      `<polygon points="84,33 88,35 84,36" fill="#fb923c"/>` +
      // 鐘面
      `<circle cx="80" cy="64" r="19" fill="#fffbeb" stroke="${INK}" stroke-width="2.6"/>` +
      `<circle cx="80" cy="49" r="1.5" fill="${INK}"/><circle cx="95" cy="64" r="1.5" fill="${INK}"/><circle cx="80" cy="79" r="1.5" fill="${INK}"/><circle cx="65" cy="64" r="1.5" fill="${INK}"/>` +
      `<polyline points="72,56 80,64 90,60" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="80" cy="64" r="2.4" fill="#ef4444"/>` +
      '</svg>'
    );
  }

  if (wallDecorId === 'honor_gallery') {
    const frames = [
      { x: 14, key: 'sunny', title: '陽光', cOn: '#fef3c7', bOn: '#f59e0b', medal: '#fb923c' },
      { x: 58, key: 'mul', title: '乘法', cOn: '#dcfce7', bOn: '#16a34a', medal: '#4ade80' },
      { x: 102, key: 'cloud', title: '雲端', cOn: '#e0f2fe', bOn: '#0284c7', medal: '#38bdf8' }
    ];
    let frameHtml = '';
    frames.forEach((f) => {
      const stars = Math.max(0, Math.floor(Number(realmStars[f.key] || 0)));
      const lit = stars > 0;
      const bg = lit ? f.cOn : '#f1f5f9';
      const bd = lit ? f.bOn : '#94a3b8';
      frameHtml +=
        `<polyline points="${f.x + 10},22 ${f.x + 22},10 ${f.x + 34},22" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
        `<rect x="${f.x}" y="22" width="44" height="84" rx="9" fill="#b45309" stroke="${INK}" stroke-width="2.6"/>` +
        `<rect x="${f.x + 5}" y="27" width="34" height="74" rx="5" fill="${bg}" stroke="${bd}" stroke-width="2"/>` +
        (lit
          ? `<polygon points="${f.x + 22},36 ${f.x + 25},44 ${f.x + 33},45 ${f.x + 27},50 ${f.x + 29},58 ${f.x + 22},54 ${f.x + 15},58 ${f.x + 17},50 ${f.x + 11},45 ${f.x + 19},44" fill="#fde047" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
            `<circle cx="${f.x + 22}" cy="70" r="8" fill="${f.medal}" stroke="${INK}" stroke-width="1.8"/>` +
            `<text x="${f.x + 22}" y="94" text-anchor="middle" font-size="11" font-weight="900" fill="${INK}" font-family="var(--font-num), sans-serif">${stars}★</text>`
          : `<circle cx="${f.x + 22}" cy="56" r="11" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="3 3"/>` +
            `<text x="${f.x + 22}" y="60" text-anchor="middle" font-size="12" font-weight="900" fill="#94a3b8">?</text>` +
            `<text x="${f.x + 22}" y="94" text-anchor="middle" font-size="10" font-weight="800" fill="#64748b">${f.title}</text>`);
    });
    return (
      '<svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">' +
      `<line x1="16" y1="10" x2="144" y2="10" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>` +
      frameHtml +
      '</svg>'
    );
  }

  // 預設：math_chalkboard 冒險成果小黑板（動態寫入真實星數／寶石數／精靈數）
  const gid = nextSvgId('th-board-bg');
  return (
    '<svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">' +
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e4d38"/><stop offset="100%" stop-color="#143627"/></linearGradient></defs>` +
    `<polyline points="48,20 80,6 112,20" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="80" cy="6" r="3.5" fill="#fde047" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="10" y="18" width="140" height="94" rx="12" fill="#b45309" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="18" y="26" width="124" height="74" rx="7" fill="url(#${gid})" stroke="${INK}" stroke-width="2"/>` +
    `<text x="80" y="42" text-anchor="middle" font-size="11.5" font-weight="900" fill="#fef08a" font-family="var(--font-display), sans-serif">✨ 冒險小黑板</text>` +
    `<line x1="30" y1="48" x2="130" y2="48" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    `<text x="80" y="69" text-anchor="middle" font-size="14.5" font-weight="900" fill="#ffffff" font-family="var(--font-num), sans-serif">⭐ ${totalStars} / ${maxStars}</text>` +
    `<text x="80" y="89" text-anchor="middle" font-size="11.5" font-weight="800" fill="#bae6fd" font-family="var(--font-num), sans-serif">💎 ${litGems}/81  🐣 ${spriteCount}/${maxSprites}</text>` +
    // 黑板底部粉筆架、粉筆與板擦
    `<rect x="26" y="102" width="108" height="10" rx="4" fill="#d97706" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="38" y="96" width="16" height="6" rx="2" fill="#f43f5e" stroke="${INK}" stroke-width="1.5"/>` +
    `<rect x="104" y="97" width="14" height="5" rx="2" fill="#fde047" stroke="${INK}" stroke-width="1.4"/>` +
    '</svg>'
  );
}

/* ---------------- 4. 主家具 SVG (210x168) ---------------- */
function renderFurnitureSvg(furnitureId) {
  if (furnitureId === 'dessert_table') {
    const gid = nextSvgId('th-cake-cream');
    return (
      '<svg viewBox="0 0 210 168" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff1f2"/><stop offset="100%" stop-color="#fbcfe8"/></linearGradient></defs>` +
      `<ellipse cx="96" cy="156" rx="74" ry="8" fill="rgba(51,43,34,0.16)"/>` +
      // 桌腳與橫桿
      `<rect x="46" y="102" width="12" height="52" rx="4" fill="#b45309" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="134" y="102" width="12" height="52" rx="4" fill="#b45309" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="52" y="132" width="88" height="8" rx="4" fill="#92400e" stroke="${INK}" stroke-width="2"/>` +
      // 桌上圓形桌布與盤子
      `<ellipse cx="96" cy="98" rx="72" ry="18" fill="#fef3c7" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M26 100 Q44 114 62 104 Q80 116 96 106 Q114 116 132 104 Q150 114 166 100" fill="#fffbeb" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<ellipse cx="96" cy="94" rx="60" ry="12" fill="#fde68a"/>` +
      // 雙層草莓鮮奶油蛋糕
      `<rect x="86" y="78" width="12" height="14" rx="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="92" cy="78" rx="32" ry="7" fill="#ffffff" stroke="${INK}" stroke-width="2.2"/>` +
      `<rect x="64" y="48" width="56" height="28" rx="8" fill="url(#${gid})" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M64 56 Q78 65 92 56 Q106 65 120 56" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="76" y="30" width="32" height="18" rx="6" fill="#fda4af" stroke="${INK}" stroke-width="2.2"/>` +
      `<circle cx="92" cy="23" r="6" fill="#f43f5e" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M90 17 L94 14" stroke="#15803d" stroke-width="2.2" stroke-linecap="round"/>` +
      // 熱可可杯與飄浮熱氣
      `<rect x="132" y="74" width="22" height="18" rx="5" fill="#38bdf8" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M154 78 C161 78 161 88 154 88" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` +
      '<g class="mqst-th-steam">' +
      `<path d="M139 68 Q135 62 140 56 M147 68 Q143 62 148 56" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.88"/>` +
      '</g>' +
      // 桌旁可愛小圓凳
      `<ellipse cx="176" cy="152" rx="22" ry="5" fill="rgba(51,43,34,0.14)"/>` +
      `<rect x="164" y="130" width="8" height="22" rx="3" fill="#92400e" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="180" y="130" width="8" height="22" rx="3" fill="#92400e" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="176" cy="126" rx="20" ry="9" fill="#fbcfe8" stroke="${INK}" stroke-width="2.4"/>` +
      '</svg>'
    );
  }

  if (furnitureId === 'cloud_sofa') {
    const gid = nextSvgId('th-sofa-cloud');
    return (
      '<svg viewBox="0 0 210 168" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient></defs>` +
      `<ellipse cx="105" cy="156" rx="82" ry="8" fill="rgba(51,43,34,0.16)"/>` +
      // 木質沙發腳
      `<rect x="40" y="136" width="14" height="18" rx="5" fill="#92400e" stroke="${INK}" stroke-width="2.4"/>` +
      `<rect x="156" y="136" width="14" height="18" rx="5" fill="#92400e" stroke="${INK}" stroke-width="2.4"/>` +
      // 蓬鬆大雲朵靠背
      `<ellipse cx="56" cy="76" rx="34" ry="30" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8"/>` +
      `<ellipse cx="154" cy="76" rx="34" ry="30" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8"/>` +
      `<ellipse cx="105" cy="64" rx="46" ry="36" fill="#ffffff" stroke="${INK}" stroke-width="2.8"/>` +
      // 扶手與厚坐墊
      `<ellipse cx="32" cy="104" rx="20" ry="22" fill="#e0f2fe" stroke="${INK}" stroke-width="2.8"/>` +
      `<ellipse cx="178" cy="104" rx="20" ry="22" fill="#e0f2fe" stroke="${INK}" stroke-width="2.8"/>` +
      `<rect x="26" y="96" width="158" height="42" rx="18" fill="#bae6fd" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M44 106 H166" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>` +
      // 星星抱枕與粉紅抱枕
      `<polygon points="72,82 76,90 85,91 78,97 80,106 72,101 64,106 66,97 59,91 68,90" fill="#fde047" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<ellipse cx="136" cy="96" rx="18" ry="13" transform="rotate(10 136 96)" fill="#fbcfe8" stroke="${INK}" stroke-width="2.2"/>` +
      // 扶手上的針織小毛毯
      `<path d="M168 92 H190 L194 126 H170 Z" fill="#fda4af" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<line x1="170" y1="104" x2="192" y2="104" stroke="#ffffff" stroke-width="2.2"/>` +
      `<line x1="170" y1="115" x2="193" y2="115" stroke="#fde047" stroke-width="2.2"/>` +
      '</svg>'
    );
  }

  // 預設：block_shelf 積木書架櫃（內含位值語意色積木＋數學繪本＋旁邊靠墊疊書）
  const gid = nextSvgId('th-shelf-wood');
  return (
    '<svg viewBox="0 0 210 168" xmlns="http://www.w3.org/2000/svg">' +
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs>` +
    `<ellipse cx="105" cy="156" rx="84" ry="8" fill="rgba(51,43,34,0.16)"/>` +
    // 書架主體
    `<rect x="24" y="16" width="134" height="138" rx="12" fill="url(#${gid})" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="34" y="26" width="114" height="32" rx="5" fill="#fef3c7" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="34" y="66" width="114" height="34" rx="5" fill="#fef3c7" stroke="${INK}" stroke-width="2.2"/>` +
    // 上層彩色數學繪本＋小鬧鐘
    `<rect x="42" y="34" width="13" height="23" rx="2.5" fill="#fb7185" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="57" y="30" width="13" height="27" rx="2.5" fill="#38bdf8" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="72" y="35" width="13" height="22" rx="2.5" fill="#4ade80" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="87" y="32" width="12" height="25" rx="2.5" fill="#fbbf24" stroke="${INK}" stroke-width="1.8"/>` +
    `<circle cx="126" cy="44" r="11" fill="#ffffff" stroke="${INK}" stroke-width="2"/><polyline points="122,40 126,44 131,42" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
    // 下層課本位值語意色積木（水藍百格板、暖橘十格棒、石板白單位方塊）
    `<rect x="42" y="74" width="24" height="24" rx="3" fill="#60a5fa" stroke="${INK}" stroke-width="1.8"/>` +
    `<path d="M50 74 V98 M58 74 V98 M42 82 H66 M42 90 H66" stroke="#dbeafe" stroke-width="1.3"/>` +
    `<rect x="74" y="75" width="9" height="23" rx="2" fill="#fb923c" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="86" y="75" width="9" height="23" rx="2" fill="#fb923c" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="104" y="86" width="11" height="11" rx="2" fill="#f8fafc" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="118" y="86" width="11" height="11" rx="2" fill="#f8fafc" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="111" y="73" width="11" height="11" rx="2" fill="#f8fafc" stroke="${INK}" stroke-width="1.8"/>` +
    // 下方雙抽屜
    `<rect x="34" y="108" width="53" height="34" rx="5" fill="#d97706" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="95" y="108" width="53" height="34" rx="5" fill="#d97706" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="60" cy="125" r="3.5" fill="#fde047" stroke="${INK}" stroke-width="1.6"/>` +
    `<circle cx="121" cy="125" r="3.5" fill="#fde047" stroke="${INK}" stroke-width="1.6"/>` +
    // 櫃旁疊放繪本與胡蘿蔔小圓墊
    `<rect x="164" y="134" width="32" height="12" rx="4" fill="#a78bfa" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="167" y="122" width="28" height="12" rx="4" fill="#fb7185" stroke="${INK}" stroke-width="2.2"/>` +
    '</svg>'
  );
}

/* ---------------- 5. 角落擺飾 SVG (120x130) ---------------- */
function renderDecorSvg(decorId) {
  if (decorId === 'trophy_stand') {
    const gid = nextSvgId('th-trophy-gold');
    return (
      '<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>` +
      `<ellipse cx="60" cy="121" rx="40" ry="6" fill="rgba(51,43,34,0.16)"/>` +
      `<rect x="28" y="92" width="64" height="26" rx="6" fill="#92400e" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="36" y="84" width="48" height="10" rx="4" fill="#dc2626" stroke="${INK}" stroke-width="2.2"/>` +
      `<rect x="44" y="101" width="32" height="10" rx="3" fill="#fde047" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M38 34 C22 34 22 54 40 56 M82 34 C98 34 98 54 80 56" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M38 26 H82 L74 60 Q60 72 46 60 Z" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<rect x="54" y="64" width="12" height="20" fill="#f59e0b" stroke="${INK}" stroke-width="2.2"/>` +
      `<polygon points="60,34 63,41 70,42 65,47 66,54 60,50 54,54 55,47 50,42 57,41" fill="#ffffff" stroke="${INK}" stroke-width="1.4"/>` +
      '</svg>'
    );
  }

  if (decorId === 'mini_globe') {
    const gid = nextSvgId('th-globe-sea');
    return (
      '<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs>` +
      `<ellipse cx="60" cy="121" rx="38" ry="6" fill="rgba(51,43,34,0.16)"/>` +
      `<rect x="32" y="98" width="56" height="20" rx="6" fill="#b45309" stroke="${INK}" stroke-width="2.6"/>` +
      `<path d="M60 78 V98" stroke="${INK}" stroke-width="4.5"/>` +
      `<path d="M32 28 A32 32 0 1 1 88 74" fill="none" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>` +
      '<g class="mqst-th-globe-ball">' +
      `<circle cx="60" cy="52" r="26" fill="url(#${gid})" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M44 40 Q55 34 62 44 Q74 40 76 54 Q64 64 50 56 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.6"/>` +
      `<path d="M46 66 Q54 62 60 70 Q50 74 46 66 Z" fill="#86efac" stroke="#15803d" stroke-width="1.4"/>` +
      `<circle cx="48" cy="37" r="3" fill="#ffffff" opacity="0.8"/>` +
      '</g>' +
      '</svg>'
    );
  }

  if (decorId === 'gramophone') {
    const gid = nextSvgId('th-gramo-horn');
    return (
      '<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>` +
      `<ellipse cx="60" cy="121" rx="40" ry="6" fill="rgba(51,43,34,0.16)"/>` +
      `<rect x="24" y="76" width="72" height="42" rx="8" fill="#b45309" stroke="${INK}" stroke-width="2.8"/>` +
      `<rect x="34" y="85" width="52" height="24" rx="5" fill="#fde68a" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="60" cy="97" r="7" fill="#d97706" stroke="${INK}" stroke-width="1.8"/>` +
      `<ellipse cx="60" cy="76" rx="24" ry="5" fill="#334155" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M74 74 Q84 48 64 32 L42 16 Q76 12 94 42 Q94 60 74 74 Z" fill="url(#${gid})" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<ellipse cx="46" cy="26" rx="8" ry="13" transform="rotate(-24 46 26)" fill="#fde047" stroke="${INK}" stroke-width="2.4"/>` +
      '<g class="mqst-th-gramo-notes" stroke="#332b22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      `<circle cx="22" cy="36" r="4" fill="#fb7185"/>` +
      `<circle cx="34" cy="32" r="4" fill="#38bdf8"/>` +
      `<path d="M26 36 V20 L38 16 V32" fill="none"/>` +
      '</g>' +
      '</svg>'
    );
  }

  if (decorId === 'rainbow_musicbox') {
    return (
      '<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">' +
      `<ellipse cx="60" cy="121" rx="40" ry="6" fill="rgba(51,43,34,0.16)"/>` +
      `<rect x="22" y="74" width="76" height="44" rx="10" fill="#f472b6" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M26 74 L36 44 H88 L78 74 Z" fill="#fbcfe8" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M36 66 A22 22 0 0 1 80 66" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M41 66 A17 17 0 0 1 75 66" fill="none" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M46 66 A12 12 0 0 1 70 66" fill="none" stroke="#4ade80" stroke-width="3.5" stroke-linecap="round"/>` +
      `<polygon points="60,86 63,92 70,93 65,98 66,105 60,101 54,105 55,98 50,93 57,92" fill="#fde047" stroke="${INK}" stroke-width="1.8"/>` +
      '</svg>'
    );
  }

  // 預設：sprout_pot 微笑小盆栽＋迷你天藍灑水壺
  return (
    '<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">' +
    `<ellipse cx="60" cy="121" rx="40" ry="6" fill="rgba(51,43,34,0.16)"/>` +
    // 花盆
    `<path d="M24 78 H76 L68 118 H32 Z" fill="#fb923c" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<rect x="18" y="68" width="64" height="12" rx="5" fill="#fdba74" stroke="${INK}" stroke-width="2.6"/>` +
    `<circle cx="43" cy="94" r="2" fill="${INK}"/><circle cx="57" cy="94" r="2" fill="${INK}"/>` +
    `<path d="M46 99 Q50 103 54 99" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
    `<ellipse cx="38" cy="97" rx="3" ry="1.8" fill="#fb7185" opacity="0.65"/><ellipse cx="62" cy="97" rx="3" ry="1.8" fill="#fb7185" opacity="0.65"/>` +
    // 枝葉與花朵
    `<line x1="50" y1="68" x2="50" y2="34" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M50 52 C32 34 18 48 34 58 Z" fill="#4ade80" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M50 52 C68 34 82 48 66 58 Z" fill="#22c55e" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="24" r="9" fill="#fde047" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="38" cy="30" r="6" fill="#fda4af" stroke="${INK}" stroke-width="1.8"/>` +
    `<circle cx="62" cy="30" r="6" fill="#fda4af" stroke="${INK}" stroke-width="1.8"/>` +
    `<circle cx="47" cy="22" r="2.2" fill="#ffffff"/>` +
    // 迷你天藍灑水壺
    `<rect x="78" y="92" width="24" height="22" rx="6" fill="#38bdf8" stroke="${INK}" stroke-width="2.2"/>` +
    `<path d="M102 96 C110 96 110 108 102 108" fill="none" stroke="${INK}" stroke-width="2.2"/>` +
    `<path d="M78 100 L66 88" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    '</svg>'
  );
}

/* ---------------- 6. 地毯樣式 SVG (360x96) ---------------- */
function renderRugSvg(rugId) {
  if (rugId === 'rainbow_stripe') {
    return (
      '<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg">' +
      `<ellipse cx="180" cy="52" rx="164" ry="37" fill="rgba(51,43,34,0.14)"/>` +
      `<ellipse cx="180" cy="48" rx="160" ry="36" fill="#fde047" stroke="${INK}" stroke-width="3"/>` +
      `<ellipse cx="180" cy="48" rx="136" ry="29" fill="#fb7185" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="180" cy="48" rx="108" ry="22" fill="#38bdf8" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="180" cy="48" rx="76" ry="14" fill="#86efac" stroke="${INK}" stroke-width="1.8"/>` +
      `<ellipse cx="180" cy="48" rx="44" ry="8" fill="#fffbeb"/>` +
      `<circle cx="16" cy="48" r="5" fill="#fb7185" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="344" cy="48" r="5" fill="#38bdf8" stroke="${INK}" stroke-width="1.8"/>` +
      '</svg>'
    );
  }
  if (rugId === 'checker_cream') {
    const clipId = nextSvgId('th-rug-check');
    return (
      '<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg">' +
      `<defs><clipPath id="${clipId}"><ellipse cx="180" cy="48" rx="146" ry="31"/></clipPath></defs>` +
      `<ellipse cx="180" cy="52" rx="164" ry="37" fill="rgba(51,43,34,0.14)"/>` +
      `<ellipse cx="180" cy="48" rx="160" ry="36" fill="#fffbeb" stroke="${INK}" stroke-width="3"/>` +
      `<g clip-path="url(#${clipId})">` +
      `<rect x="30" y="14" width="300" height="68" fill="#dcfce7"/>` +
      `<path d="M50 14 L110 82 M100 14 L160 82 M150 14 L210 82 M200 14 L260 82 M250 14 L310 82" stroke="#fbcfe8" stroke-width="14" opacity="0.65"/>` +
      `<path d="M310 14 L250 82 M260 14 L200 82 M210 14 L150 82 M160 14 L100 82 M110 14 L50 82" stroke="#fef08a" stroke-width="10" opacity="0.55"/>` +
      '</g>' +
      `<ellipse cx="180" cy="48" rx="146" ry="31" fill="none" stroke="#15803d" stroke-width="2" stroke-dasharray="10 8"/>` +
      '</svg>'
    );
  }
  // carrot_round 胡蘿蔔圓毯
  return (
    '<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg">' +
    `<ellipse cx="180" cy="52" rx="164" ry="37" fill="rgba(51,43,34,0.14)"/>` +
    `<ellipse cx="180" cy="48" rx="160" ry="36" fill="#fed7aa" stroke="${INK}" stroke-width="3"/>` +
    `<ellipse cx="180" cy="48" rx="134" ry="29" fill="#fb923c" stroke="#9a3412" stroke-width="2.2" stroke-dasharray="9 6"/>` +
    `<ellipse cx="180" cy="48" rx="92" ry="18" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>` +
    // 中心小胡蘿蔔刺繡
    `<path d="M174 44 L188 48 L174 52 Q170 48 174 44 Z" fill="#f97316" stroke="${INK}" stroke-width="1.5"/>` +
    `<path d="M171 45 L167 43 M171 48 L166 48 M171 51 L167 53" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round"/>` +
    '</svg>'
  );
}

/* ---------------- 7. 精靈空位實體坐墊 SVG (110x74) ---------------- */
function renderEmptyCushionSvg(slotIndex) {
  if (slotIndex === 1) {
    // 原木年輪樹樁小圓凳＋刺繡布巾
    return (
      '<svg viewBox="0 0 110 74" xmlns="http://www.w3.org/2000/svg">' +
      `<ellipse cx="55" cy="65" rx="40" ry="7" fill="rgba(51,43,34,0.16)"/>` +
      `<path d="M24 30 H86 L82 60 Q55 68 28 60 Z" fill="#b45309" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M40 38 V58 M58 40 V60 M72 38 V57" stroke="#78350f" stroke-width="1.8" stroke-linecap="round"/>` +
      `<ellipse cx="55" cy="28" rx="33" ry="12" fill="#fde68a" stroke="${INK}" stroke-width="2.6"/>` +
      `<ellipse cx="55" cy="28" rx="22" ry="7" fill="none" stroke="#d97706" stroke-width="1.6"/>` +
      `<path d="M36 26 Q55 34 74 26 L70 40 Q55 46 40 40 Z" fill="#fffbeb" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      '</svg>'
    );
  }
  if (slotIndex === 2) {
    // 雲朵藤編小軟墊籃
    return (
      '<svg viewBox="0 0 110 74" xmlns="http://www.w3.org/2000/svg">' +
      `<ellipse cx="55" cy="64" rx="42" ry="7" fill="rgba(51,43,34,0.16)"/>` +
      `<path d="M18 36 H92 L84 60 Q55 66 26 60 Z" fill="#d97706" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<ellipse cx="55" cy="34" rx="34" ry="13" fill="#e0f2fe" stroke="${INK}" stroke-width="2.4"/>` +
      `<path d="M32 34 Q42 26 55 32 Q68 26 78 34" fill="#ffffff" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M26 46 H84 M30 54 H80" stroke="#92400e" stroke-width="1.8"/>` +
      '</svg>'
    );
  }
  // slotIndex === 0：蓬鬆草莓粉蝴蝶結大抱枕
  return (
    '<svg viewBox="0 0 110 74" xmlns="http://www.w3.org/2000/svg">' +
    `<ellipse cx="55" cy="64" rx="42" ry="7" fill="rgba(51,43,34,0.16)"/>` +
    `<ellipse cx="55" cy="44" rx="40" ry="20" fill="#fb7185" stroke="${INK}" stroke-width="2.6"/>` +
    `<ellipse cx="55" cy="39" rx="37" ry="17" fill="#fbcfe8" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M30 38 Q55 48 80 38" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<circle cx="55" cy="37" r="5" fill="#fde047" stroke="${INK}" stroke-width="1.8"/>` +
    '</svg>'
  );
}

/* ---------------- 單槽內容分派與實物縮圖 ---------------- */
export function renderTreehouseSlotContentHtml(slot, itemId, { progressStats = {}, lampLit = true } = {}) {
  switch (slot) {
    case 'ceiling':
      return renderCeilingSvg(itemId, { lampLit });
    case 'window':
      return renderWindowSvg(itemId);
    case 'wall_decor':
      return renderWallDecorSvg(itemId, progressStats);
    case 'furniture':
      return renderFurnitureSvg(itemId);
    case 'decor':
      return renderDecorSvg(itemId);
    case 'rug':
      return renderRugSvg(itemId);
    default:
      return '';
  }
}

export function renderTreehouseItemPreviewHtml(item, { progressStats = {} } = {}) {
  if (!item) return '';
  if (item.slot === 'wallpaper') {
    const theme = getTreehouseWallpaperMeta(item.id);
    return (
      `<div class="mqst-th-thumb-wallpaper" style="background:${theme.fallbackBg};">` +
      `<img src="${theme.bgSrc}" alt="" loading="lazy" decoding="async">` +
      `<span class="mqst-th-thumb-swatch" style="background:${theme.frameAccent};"></span>` +
      '</div>'
    );
  }
  return (
    '<div class="mqst-th-thumb-svg">' +
    renderTreehouseSlotContentHtml(item.slot, item.id, { progressStats, lampLit: true }) +
    '</div>'
  );
}

/* ---------------- 互動對話與彩蛋台詞 ---------------- */
export function getTreehouseInteractMessage(kind, itemId, { progressStats = {}, lampLit = true } = {}) {
  if (kind === 'bunny') {
    const lines = [
      '🐰 粉紅小兔開心地轉了一圈：「今天的樹屋好溫暖，我們一起再破一關吧！」',
      '🐰 粉紅小兔揮揮手：「換上新造型心情超好！快去邀請守護小精靈來玩！」',
      '🐰 粉紅小兔笑嘻嘻：「在樹屋點一點家具，就能完成每日暖身委託喔！」'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (itemId === 'math_chalkboard') {
    const stars = Math.max(0, Math.floor(Number(progressStats.totalStars || 0)));
    const gems = Math.max(0, Math.floor(Number(progressStats.litGems || 0)));
    const sprites = Math.max(0, Math.floor(Number(progressStats.spriteCount || 0)));
    return `📝 冒險成果小黑板：目前已經集滿 ⭐ ${stars} 顆星星、💎 ${gems}/81 顆寶石、🐣 ${sprites}/15 隻守護小精靈囉！`;
  }
  if (itemId === 'honor_gallery') {
    const rs = progressStats.realmStars || {};
    const clearedRealms = ['sunny', 'mul', 'cloud'].filter((r) => (rs[r] || 0) > 0).length;
    return `🖼️ 冒險榮譽相框牆：已點亮 ${clearedRealms} / 3 大海域勳章（陽光 ${rs.sunny || 0}★ · 乘法 ${rs.mul || 0}★ · 雲端 ${rs.cloud || 0}★）！`;
  }
  if (isLightableCeiling(itemId)) {
    const item = getTreehouseItemById(itemId);
    const title = item ? item.name : '樹屋暖燈';
    return lampLit
      ? `💡 點亮了【${title}】！暖洋洋的星光把秘密樹屋照得好溫馨！`
      : `🌙 調柔了【${title}】的燈光，享受安靜舒服的樹屋時光～`;
  }
  if (itemId === 'cuckoo_clock') {
    return '🕰️ 布穀鳥掛鐘叮咚報時：「咕咕！現在是開心學數學與休息玩耍的好時間！」';
  }
  if (itemId === 'cloud_windchime') {
    return '🎐 雲朵星星風鈴輕輕搖晃，發出叮叮咚咚的清脆聲音！';
  }
  if (itemId === 'gramophone' || itemId === 'rainbow_musicbox') {
    return (itemId === 'gramophone' ? '🎵 ' : '🎼 ') + '飄出輕快的童話八音盒旋律，小兔和精靈都跟著擺動起來！';
  }
  const item = getTreehouseItemById(itemId);
  if (item) {
    return item.icon + ' 點擊了【' + item.name + '】！' + item.desc;
  }
  return '🏡 樹屋裡傳來開心的笑聲！';
}

/* ---------------- 完整秘密樹屋 5 層場景渲染 ---------------- */
export function renderTreehouseSceneHtml({
  slots = {},
  playmates = [],
  wardrobe = {},
  bonds = {},
  selectedPlaymateId = '',
  progressStats = {},
  activeSlot = 'wallpaper',
  decorateMode = false,
  lampLit = true,
  getPinkBunnySvg,
  getCharacterSvg
}) {
  const wallKey = slots.wallpaper || DEFAULT_TREEHOUSE_SLOTS.wallpaper;
  const theme = getTreehouseWallpaperMeta(wallKey);
  const ceilingId = slots.ceiling || DEFAULT_TREEHOUSE_SLOTS.ceiling;
  const winId = slots.window || DEFAULT_TREEHOUSE_SLOTS.window;
  const wallDecorId = slots.wall_decor || DEFAULT_TREEHOUSE_SLOTS.wall_decor;
  const furnId = slots.furniture || DEFAULT_TREEHOUSE_SLOTS.furniture;
  const decorId = slots.decor || DEFAULT_TREEHOUSE_SLOTS.decor;
  const rugId = slots.rug || DEFAULT_TREEHOUSE_SLOTS.rug;

  const focusClass = (slotId) => (activeSlot === slotId ? ' is-slot-focus' : '');

  let playmateSpotsHtml = '';
  for (let i = 0; i < 3; i++) {
    const pid = playmates[i] ? toCanonicalPartnerId(playmates[i]) : '';
    const isl = pid ? getIslandById(pid) : null;
    if (isl) {
      const bond = bonds[isl.fullId] || { xp: 0, level: 1 };
      const specMeta = getSpecialtyMeta(isl.specialty);
      const isSelected = selectedPlaymateId === isl.fullId;
      playmateSpotsHtml +=
        `<div class="mqst-th-actor mqst-th-playmate-spot spot-${i}">` +
        `<button type="button" class="mqst-th-playmate-slot is-occupied${isSelected ? ' is-selected' : ''}${bond.level >= 3 ? ' is-lv3' : ''}" data-th-playmate-btn="${isl.fullId}" aria-label="${isl.spriteName} 親密度 Lv.${bond.level}">` +
        `<span class="mqst-th-sprite-lv">${specMeta.icon} Lv.${bond.level}</span>` +
        `<div class="mqst-th-sprite-svg">${getCharacterSvg(isl.theme, false, isSelected ? 'happy' : 'normal', { bondLevel: bond.level })}</div>` +
        `<span class="mqst-th-sprite-name">${isl.spriteName}</span>` +
        '</button>' +
        '</div>';
    } else {
      playmateSpotsHtml +=
        `<div class="mqst-th-actor mqst-th-playmate-spot spot-${i}">` +
        `<button type="button" class="mqst-th-playmate-slot is-empty" data-th-empty-slot="${i}" aria-label="邀請守護小精靈來坐這個位置">` +
        `<div class="mqst-th-empty-cushion-art" aria-hidden="true">${renderEmptyCushionSvg(i)}</div>` +
        '<span class="mqst-th-empty-pill">＋ 邀請</span>' +
        '</button>' +
        '</div>';
    }
  }

  return (
    `<div class="mqst-th-room${lampLit ? ' is-lamp-lit' : ''}${decorateMode ? ' is-decorate-mode' : ''}" data-wallpaper="${wallKey}" style="background:${theme.fallbackBg};--th-sunbeam:${theme.sunbeamColor};--th-lamp-glow:${theme.lampColor};--th-dust:${theme.dustColor};--th-ambient-tint:${theme.ambientTint};">` +
    // 第 1 層：繪本室內底圖（雙 img 支援橫掃轉場）
    '<div class="mqst-th-bg-layer" aria-hidden="true">' +
    `<img src="${theme.bgSrc}" alt="" class="mqst-th-bg-img is-current" draggable="false">` +
    `<img src="${theme.bgSrc}" alt="" class="mqst-th-bg-img is-incoming" draggable="false">` +
    '</div>' +
    // 第 2 層：環境氛圍光束與星塵
    '<div class="mqst-th-atmosphere" aria-hidden="true">' +
    '<div class="mqst-th-ambient-tint"></div>' +
    '<div class="mqst-th-sunbeam"></div>' +
    '<div class="mqst-th-lamp-glow"></div>' +
    '<span class="mqst-th-dust d1"></span>' +
    '<span class="mqst-th-dust d2"></span>' +
    '<span class="mqst-th-dust d3"></span>' +
    '<span class="mqst-th-dust d4"></span>' +
    '<span class="mqst-th-dust d5"></span>' +
    '<span class="mqst-th-dust d6"></span>' +
    '</div>' +
    // 第 3 層：6 個實體互動家具槽位（底圖為第 7 槽 wallpaper）
    '<div class="mqst-th-objects-layer">' +
    `<button type="button" class="mqst-th-obj mqst-th-rug${focusClass('rug')}" data-th-interact="rug" data-th-slot="rug" data-item-id="${rugId}" aria-label="點擊樹屋地毯互動">${renderRugSvg(rugId)}</button>` +
    `<button type="button" class="mqst-th-obj mqst-th-ceiling${focusClass('ceiling')}" data-th-interact="ceiling" data-th-slot="ceiling" data-item-id="${ceilingId}" aria-label="點擊天花板吊飾互動">${renderCeilingSvg(ceilingId, { lampLit })}</button>` +
    `<button type="button" class="mqst-th-obj mqst-th-window${focusClass('window')}" data-th-interact="window" data-th-slot="window" data-item-id="${winId}" aria-label="點擊窗外風景互動">${renderWindowSvg(winId)}</button>` +
    `<button type="button" class="mqst-th-obj mqst-th-wall-decor${focusClass('wall_decor')}" data-th-interact="wall_decor" data-th-slot="wall_decor" data-item-id="${wallDecorId}" aria-label="點擊牆面掛飾互動">${renderWallDecorSvg(wallDecorId, progressStats)}</button>` +
    `<button type="button" class="mqst-th-obj mqst-th-furniture${focusClass('furniture')}" data-th-interact="furniture" data-th-slot="furniture" data-item-id="${furnId}" aria-label="點擊主家具互動">${renderFurnitureSvg(furnId)}</button>` +
    `<button type="button" class="mqst-th-obj mqst-th-decor${focusClass('decor')}" data-th-interact="decor" data-th-slot="decor" data-item-id="${decorId}" aria-label="點擊角落擺飾互動">${renderDecorSvg(decorId)}</button>` +
    '</div>' +
    // 第 4 層：粉紅小兔與 3 個自然錯落精靈遊樂位
    '<div class="mqst-th-actors-layer">' +
    '<div class="mqst-th-actor mqst-th-bunny-spot">' +
    `<button type="button" class="mqst-th-bunny-btn" data-th-interact="bunny" aria-label="與粉紅小兔互動">${getPinkBunnySvg('happy', wardrobe)}<span class="mqst-th-bunny-tag">粉紅小兔</span></button>` +
    '</div>' +
    playmateSpotsHtml +
    '</div>' +
    // 第 5 層：動畫粒子、對話氣泡與點心飛行特效層
    '<div class="mqst-th-fx-layer" aria-hidden="true"></div>' +
    '</div>'
  );
}

export { getPartnerBondInfo };
