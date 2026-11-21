/**
 * 數學冒險島：粉紅小兔（三部位混搭）、關卡寶箱、島嶼魔王、守護小精靈（含 Lv.3 光環）與魔法彈 SVG 繪圖器（純函式模組）
 */
import { LEGACY_COSTUME_MIGRATION_MAP } from '../domain/quest-data.js';

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return uidCounter;
}

export function buildFaceExpression(mood, lx, rx, y, mouthY, r) {
  const m = mood || 'normal';
  const rad = r || 4;
  if (m === 'happy') {
    return (
      '<path d="M' + (lx - rad) + ' ' + y + ' Q' + lx + ' ' + (y - rad * 1.4) + ' ' + (lx + rad) + ' ' + y + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M' + (rx - rad) + ' ' + y + ' Q' + rx + ' ' + (y - rad * 1.4) + ' ' + (rx + rad) + ' ' + y + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M' + (lx + 3) + ' ' + (mouthY - 1) + ' Q' + (lx + rx) / 2 + ' ' + (mouthY + 8) + ' ' + (rx - 3) + ' ' + (mouthY - 1) + ' Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>'
    );
  }
  if (m === 'fever') {
    return (
      '<polygon points="' + lx + ',' + (y - 5) + ' ' + (lx + 1.6) + ',' + (y - 1.5) + ' ' + (lx + 5) + ',' + (y - 1) + ' ' + (lx + 2.3) + ',' + (y + 1.5) + ' ' + (lx + 3) + ',' + (y + 5) + ' ' + lx + ',' + (y + 3) + ' ' + (lx - 3) + ',' + (y + 5) + ' ' + (lx - 2.3) + ',' + (y + 1.5) + ' ' + (lx - 5) + ',' + (y - 1) + ' ' + (lx - 1.6) + ',' + (y - 1.5) + '" fill="#f59e0b" stroke="#332b22" stroke-width="1.3"/>' +
      '<polygon points="' + rx + ',' + (y - 5) + ' ' + (rx + 1.6) + ',' + (y - 1.5) + ' ' + (rx + 5) + ',' + (y - 1) + ' ' + (rx + 2.3) + ',' + (y + 1.5) + ' ' + (rx + 3) + ',' + (y + 5) + ' ' + rx + ',' + (y + 3) + ' ' + (rx - 3) + ',' + (y + 5) + ' ' + (rx - 2.3) + ',' + (y + 1.5) + ' ' + (rx - 5) + ',' + (y - 1) + ' ' + (rx - 1.6) + ',' + (y - 1.5) + '" fill="#f59e0b" stroke="#332b22" stroke-width="1.3"/>' +
      '<path d="M' + (lx + 2) + ' ' + (mouthY - 1) + ' Q' + (lx + rx) / 2 + ' ' + (mouthY + 9) + ' ' + (rx - 2) + ' ' + (mouthY - 1) + ' Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>'
    );
  }
  if (m === 'oops') {
    return (
      '<path d="M' + (lx - 3) + ' ' + (y - 3) + ' L' + (lx + 3) + ' ' + y + ' L' + (lx - 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (rx + 3) + ' ' + (y - 3) + ' L' + (rx - 3) + ' ' + y + ' L' + (rx + 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (lx + 4) + ' ' + (mouthY + 2) + ' Q' + (lx + rx) / 2 + ' ' + (mouthY - 3) + ' ' + (rx - 4) + ' ' + (mouthY + 2) + '" fill="none" stroke="#332b22" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M' + (rx + 12) + ' ' + (y - 8) + ' Q' + (rx + 16) + ' ' + (y - 2) + ' ' + (rx + 12) + ' ' + (y + 2) + ' Q' + (rx + 8) + ' ' + (y - 2) + ' ' + (rx + 12) + ' ' + (y - 8) + ' Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.4"/>'
    );
  }
  if (m === 'hit') {
    return (
      '<path d="M' + (lx - 3) + ' ' + (y - 3) + ' L' + (lx + 3) + ' ' + y + ' L' + (lx - 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M' + (rx + 3) + ' ' + (y - 3) + ' L' + (rx - 3) + ' ' + y + ' L' + (rx + 3) + ' ' + (y + 3) + '" fill="none" stroke="#332b22" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="' + (lx + rx) / 2 + '" cy="' + (mouthY + 1) + '" rx="5" ry="4" fill="#fb7185" stroke="#332b22" stroke-width="2.4"/>'
    );
  }
  if (m === 'dizzy') {
    return (
      '<circle cx="' + lx + '" cy="' + y + '" r="' + (rad + 1) + '" fill="none" stroke="#332b22" stroke-width="2.4"/><circle cx="' + lx + '" cy="' + y + '" r="1.6" fill="#332b22"/>' +
      '<circle cx="' + rx + '" cy="' + y + '" r="' + (rad + 1) + '" fill="none" stroke="#332b22" stroke-width="2.4"/><circle cx="' + rx + '" cy="' + y + '" r="1.6" fill="#332b22"/>' +
      '<path d="M' + (lx + 2) + ' ' + mouthY + ' Q' + ((lx + rx) / 2 - 3) + ' ' + (mouthY + 4) + ' ' + (lx + rx) / 2 + ' ' + mouthY + ' T' + (rx - 2) + ' ' + mouthY + '" fill="none" stroke="#332b22" stroke-width="2.5" stroke-linecap="round"/>'
    );
  }
  return (
    '<circle cx="' + lx + '" cy="' + y + '" r="' + rad + '" fill="#332b22"/><circle cx="' + (lx - 1.2) + '" cy="' + (y - 1.4) + '" r="1.4" fill="#ffffff"/>' +
    '<circle cx="' + rx + '" cy="' + y + '" r="' + rad + '" fill="#332b22"/><circle cx="' + (rx - 1.2) + '" cy="' + (y - 1.4) + '" r="1.4" fill="#ffffff"/>' +
    '<path d="M' + (lx + 4) + ' ' + mouthY + ' Q' + (lx + rx) / 2 + ' ' + (mouthY + 5) + ' ' + (rx - 4) + ' ' + mouthY + '" fill="none" stroke="#332b22" stroke-width="2.6" stroke-linecap="round"/>'
  );
}

export function resolveWardrobeSpec(costumeOrWardrobe) {
  if (costumeOrWardrobe && typeof costumeOrWardrobe === 'object') {
    return {
      hat: typeof costumeOrWardrobe.hat === 'string' && costumeOrWardrobe.hat ? costumeOrWardrobe.hat : 'star_clip',
      outfit: typeof costumeOrWardrobe.outfit === 'string' && costumeOrWardrobe.outfit ? costumeOrWardrobe.outfit : 'none',
      wand: typeof costumeOrWardrobe.wand === 'string' && costumeOrWardrobe.wand ? costumeOrWardrobe.wand : 'none'
    };
  }
  const cId = typeof costumeOrWardrobe === 'string' && costumeOrWardrobe ? costumeOrWardrobe : 'default';
  const mapped = LEGACY_COSTUME_MIGRATION_MAP[cId];
  if (mapped) {
    return {
      hat: mapped.hat || 'star_clip',
      outfit: mapped.outfit || 'none',
      wand: mapped.wand || 'none'
    };
  }
  return { hat: cId, outfit: 'none', wand: 'none' };
}

function buildHatLayer(hatId) {
  let headFrontLayer = '';
  let faceOverlayLayer = '';

  if (hatId === 'star_clip' || hatId === 'default') {
    headFrontLayer =
      '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#fde047" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<circle cx="64" cy="34.5" r="1.6" fill="#ffffff" opacity="0.85"/>';
  } else if (hatId === 'ribbon') {
    headFrontLayer =
      '<g transform="rotate(-14 63 30)">' +
      '<path d="M63 30 C54 21, 47 23, 50 31 C47 38, 55 39, 63 32 Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M63 30 C72 21, 79 23, 76 31 C79 38, 71 39, 63 32 Z" fill="#fb7185" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<circle cx="53" cy="28" r="1.6" fill="#fff1f2"/><circle cx="55" cy="33" r="1.3" fill="#fff1f2"/>' +
      '<circle cx="73" cy="28" r="1.6" fill="#fff1f2"/><circle cx="71" cy="33" r="1.3" fill="#fff1f2"/>' +
      '<circle cx="63" cy="31" r="4.2" fill="#f43f5e" stroke="#332b22" stroke-width="2"/>' +
      '<circle cx="63" cy="31" r="1.6" fill="#fde047"/>' +
      '</g>';
  } else if (hatId === 'sprout') {
    headFrontLayer =
      '<path d="M27 38 Q50 21 73 38" fill="none" stroke="#332b22" stroke-width="5.2" stroke-linecap="round"/>' +
      '<path d="M27 38 Q50 21 73 38" fill="none" stroke="#4ade80" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M50 28 Q50 18 50 15" fill="none" stroke="#332b22" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 17 C41 8, 33 14, 39 21 C43 24, 50 20, 50 17 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M50 17 C59 7, 68 13, 62 20 C58 24, 50 20, 50 17 Z" fill="#86efac" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<circle cx="58" cy="14" r="1.6" fill="#ffffff" opacity="0.9"/>';
  } else if (hatId === 'explorer') {
    headFrontLayer =
      '<path d="M35 30 Q50 13 65 30 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M36 27 Q50 23 64 27" fill="none" stroke="#b45309" stroke-width="3.2"/>' +
      '<ellipse cx="50" cy="31" rx="26" ry="5.5" fill="#fde68a" stroke="#332b22" stroke-width="2.6"/>' +
      '<circle cx="50" cy="22" r="4" fill="#38bdf8" stroke="#332b22" stroke-width="1.8"/>' +
      '<circle cx="50" cy="22" r="1.5" fill="#fde047"/>';
  } else if (hatId === 'flower') {
    headFrontLayer =
      '<path d="M29 36 Q50 22 71 36" fill="none" stroke="#16a34a" stroke-width="3.2" stroke-linecap="round"/>' +
      '<g transform="translate(35,30)">' +
      '<circle cx="0" cy="-4.5" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="4.3" cy="-1.4" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="2.7" cy="3.6" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-2.7" cy="3.6" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-4.3" cy="-1.4" r="3.4" fill="#f472b6" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="0" cy="0" r="2.6" fill="#fde047" stroke="#332b22" stroke-width="1.2"/>' +
      '</g>' +
      '<g transform="translate(50,26)">' +
      '<circle cx="0" cy="-5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="4.8" cy="-1.5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="3" cy="4" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-3" cy="4" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-4.8" cy="-1.5" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="0" cy="0" r="2.9" fill="#fb7185" stroke="#332b22" stroke-width="1.2"/>' +
      '</g>' +
      '<g transform="translate(65,30)">' +
      '<circle cx="0" cy="-4.5" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="4.3" cy="-1.4" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="2.7" cy="3.6" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-2.7" cy="3.6" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="-4.3" cy="-1.4" r="3.4" fill="#60a5fa" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="0" cy="0" r="2.6" fill="#fde047" stroke="#332b22" stroke-width="1.2"/>' +
      '</g>';
  } else if (hatId === 'glasses') {
    headFrontLayer =
      '<polygon points="64,28 66,33 71,33 67,36 69,41 64,38 59,41 61,36 57,33 62,33" fill="#38bdf8" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>';
    faceOverlayLayer =
      '<g>' +
      '<rect x="30" y="42" width="16" height="11" rx="4.5" fill="#1e293b" fill-opacity="0.48" stroke="#fde047" stroke-width="2.4"/>' +
      '<rect x="54" y="42" width="16" height="11" rx="4.5" fill="#1e293b" fill-opacity="0.48" stroke="#fde047" stroke-width="2.4"/>' +
      '<path d="M46 46 Q50 44 54 46" fill="none" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/>' +
      '<line x1="33" y1="45" x2="37" y2="50" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>' +
      '<line x1="57" y1="45" x2="61" y2="50" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>' +
      '</g>';
  } else if (hatId === 'diamond_crown' || hatId === 'crown') {
    headFrontLayer =
      '<polygon points="36,30 37,16 44,23 50,12 56,23 63,16 64,30" fill="#fbbf24" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="37" cy="15" r="2.3" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="50" cy="11" r="2.7" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="63" cy="15" r="2.3" fill="#fffbeb" stroke="#332b22" stroke-width="1.4"/>' +
      '<circle cx="43" cy="26" r="2.2" fill="#f43f5e" stroke="#332b22" stroke-width="1.1"/>' +
      '<circle cx="50" cy="24" r="2.8" fill="#38bdf8" stroke="#332b22" stroke-width="1.2"/>' +
      '<circle cx="57" cy="26" r="2.2" fill="#22c55e" stroke="#332b22" stroke-width="1.1"/>';
  } else if (hatId === 'croissant_beret') {
    // 頭頂貝雷帽（嚴格保持 y <= 34，完全不遮眼睛與臉部）
    headFrontLayer =
      '<g transform="rotate(-7 50 28)">' +
      '<ellipse cx="50" cy="24" rx="18" ry="8.5" fill="#f59e0b" stroke="#332b22" stroke-width="2.4"/>' +
      '<path d="M36 25 Q50 18 64 25" fill="none" stroke="#fef3c7" stroke-width="2.4" stroke-linecap="round"/>' +
      '<line x1="50" y1="15.5" x2="50" y2="11.5" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="30" rx="15" ry="3.2" fill="#b45309" stroke="#332b22" stroke-width="2"/>' +
      '<circle cx="41" cy="23" r="1.8" fill="#fef3c7"/><circle cx="59" cy="23" r="1.8" fill="#fef3c7"/>' +
      '</g>';
  } else if (hatId === 'conductor_cap') {
    headFrontLayer =
      '<path d="M35 28 L38 15 Q50 12 62 15 L65 28 Z" fill="#1e3a8a" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="35" y="25" width="30" height="4.5" rx="2" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
      '<path d="M33 30 Q50 35 67 30 Q50 27 33 30 Z" fill="#172554" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="20" r="3.4" fill="#fde047" stroke="#332b22" stroke-width="1.5"/>' +
      '<circle cx="50" cy="20" r="1.3" fill="#ef4444"/>';
  } else if (hatId === 'unicorn_band') {
    headFrontLayer =
      '<path d="M29 36 Q50 22 71 36" fill="none" stroke="#38bdf8" stroke-width="3.6" stroke-linecap="round"/>' +
      '<polygon points="50,7 45,27 55,27" fill="#fde047" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<line x1="47.5" y1="17" x2="53.5" y2="19" stroke="#f59e0b" stroke-width="1.6"/>' +
      '<line x1="46.5" y1="22" x2="54.2" y2="24" stroke="#f59e0b" stroke-width="1.6"/>' +
      '<circle cx="38" cy="28" r="4.8" fill="#ffffff" stroke="#332b22" stroke-width="1.8"/>' +
      '<circle cx="62" cy="28" r="4.8" fill="#ffffff" stroke="#332b22" stroke-width="1.8"/>' +
      '<circle cx="50" cy="27" r="4" fill="#fbcfe8" stroke="#332b22" stroke-width="1.8"/>';
  }

  return { headFrontLayer, faceOverlayLayer };
}

function buildOutfitLayer(outfitId) {
  let backLayer = '';
  let bodyOutfitLayer = '';

  if (outfitId === 'star_cape' || outfitId === 'cape') {
    backLayer =
      '<path d="M25 60 Q11 79 16 93 Q50 97 84 93 Q89 79 75 60 Z" fill="#312e81" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<path d="M26 63 Q17 79 20 89 Q50 93 80 89 Q83 79 74 63" fill="none" stroke="#fde047" stroke-width="1.8" stroke-dasharray="4 3"/>' +
      '<polygon points="22,79 23.5,82 27,82 24.2,84 25.2,87 22,85 18.8,87 19.8,84 17,82 20.5,82" fill="#fde047"/>' +
      '<polygon points="78,79 79.5,82 83,82 80.2,84 81.2,87 78,85 74.8,87 75.8,84 73,82 76.5,82" fill="#fde047"/>';
    bodyOutfitLayer =
      '<path d="M36 64 L50 70 L64 64" fill="none" stroke="#312e81" stroke-width="3.6" stroke-linecap="round"/>' +
      '<polygon points="50,65 52,69 56,69 53,71.5 54,75.5 50,73 46,75.5 47,71.5 44,69 48,69" fill="#fde047" stroke="#332b22" stroke-width="1.6" stroke-linejoin="round"/>';
  } else if (outfitId === 'diamond_shawl' || outfitId === 'crown') {
    backLayer =
      '<path d="M23 59 Q9 78 15 93 Q50 98 85 93 Q91 78 77 59 Z" fill="#fef08a" stroke="#b45309" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<polygon points="15,24 16.5,27.5 20,27.5 17.2,29.8 18.2,33 15,31 11.8,33 12.8,29.8 10,27.5 13.5,27.5" fill="#38bdf8"/>' +
      '<polygon points="85,24 86.5,27.5 90,27.5 87.2,29.8 88.2,33 85,31 81.8,33 82.8,29.8 80,27.5 83.5,27.5" fill="#f472b6"/>';
    bodyOutfitLayer =
      '<path d="M41 66 L50 70 L59 66 L59 73 L50 70 L41 73 Z" fill="#f43f5e" stroke="#332b22" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="70" r="2.8" fill="#38bdf8" stroke="#332b22" stroke-width="1.4"/>';
  } else if (outfitId === 'baker_apron') {
    bodyOutfitLayer =
      '<path d="M36 65 H64 L66 84 Q50 88 34 84 Z" fill="#fffbeb" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M34 83 Q42 87 50 84 Q58 87 66 83" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="42" y="72" width="16" height="9" rx="3" fill="#fde68a" stroke="#332b22" stroke-width="1.6"/>' +
      '<path d="M46 77 Q50 73 54 77" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>';
  } else if (outfitId === 'magic_robe') {
    backLayer =
      '<path d="M24 60 Q12 79 17 93 Q50 97 83 93 Q88 79 76 60 Z" fill="#6d28d9" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
      '<path d="M25 64 Q18 79 21 89 Q50 93 79 89 Q82 79 75 64" fill="none" stroke="#c4b5fd" stroke-width="1.8" stroke-dasharray="4 3"/>';
    bodyOutfitLayer =
      '<path d="M35 64 L50 73 L65 64" fill="none" stroke="#4c1d95" stroke-width="4" stroke-linecap="round"/>' +
      '<polygon points="50,67 53,72 50,77 47,72" fill="#38bdf8" stroke="#332b22" stroke-width="1.6"/>';
  } else if (outfitId === 'space_suit') {
    backLayer =
      '<rect x="19" y="57" width="62" height="27" rx="12" fill="#cbd5e1" stroke="#332b22" stroke-width="2.6"/>';
    bodyOutfitLayer =
      '<rect x="33" y="65" width="34" height="20" rx="8" fill="#f8fafc" stroke="#332b22" stroke-width="2.2"/>' +
      '<rect x="39" y="69" width="22" height="10" rx="4" fill="#0284c7" stroke="#332b22" stroke-width="1.6"/>' +
      '<circle cx="44" cy="74" r="2.2" fill="#fde047"/><circle cx="50" cy="74" r="2.2" fill="#4ade80"/><circle cx="56" cy="74" r="2.2" fill="#fb7185"/>';
  }

  return { backLayer, bodyOutfitLayer };
}

function buildWandLayer(wandId) {
  if (!wandId || wandId === 'none') return '';
  if (wandId === 'carrot_wand') {
    return (
      '<g transform="rotate(14 78 60)">' +
      '<line x1="77" y1="80" x2="77" y2="42" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="77" y1="80" x2="77" y2="42" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M77 25 L71 19 M77 25 L77 16 M77 25 L83 19" stroke="#22c55e" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M69 27 Q77 23 85 27 L79 44 Q77 46 75 44 Z" fill="#f97316" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<circle cx="77" cy="33" r="2" fill="#fef08a"/>' +
      '</g>'
    );
  }
  if (wandId === 'butterfly_wand') {
    return (
      '<g transform="rotate(14 78 60)">' +
      '<line x1="77" y1="82" x2="77" y2="40" stroke="#be185d" stroke-width="3.8" stroke-linecap="round"/>' +
      '<path d="M77 33 C67 24 64 36 73 39 Z" fill="#f472b6" stroke="#332b22" stroke-width="2"/>' +
      '<path d="M77 33 C87 24 90 36 81 39 Z" fill="#c084fc" stroke="#332b22" stroke-width="2"/>' +
      '<circle cx="77" cy="34" r="4.5" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
      '</g>'
    );
  }
  if (wandId === 'meteor_wand') {
    return (
      '<g transform="rotate(14 78 60)">' +
      '<line x1="77" y1="82" x2="77" y2="40" stroke="#312e81" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="77" cy="31" r="9" fill="#38bdf8" stroke="#332b22" stroke-width="2.2"/>' +
      '<polygon points="77,23 79.3,28.5 85,29 80.5,32.5 82,38 77,35 72,38 73.5,32.5 69,29 74.7,28.5" fill="#fde047" stroke="#332b22" stroke-width="1.3"/>' +
      '</g>'
    );
  }
  if (wandId === 'rainbow_wand') {
    return (
      '<g transform="rotate(14 78 60)">' +
      '<line x1="77" y1="82" x2="77" y2="42" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M67 36 A10 10 0 0 1 87 36" fill="none" stroke="#f43f5e" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M70 36 A7 7 0 0 1 84 36" fill="none" stroke="#facc15" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M73 36 A4 4 0 0 1 81 36" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>' +
      '<polygon points="77,17 79.2,22 84.5,22.5 80.3,25.8 81.6,31 77,28 72.4,31 73.7,25.8 69.5,22.5 74.8,22" fill="#fde047" stroke="#332b22" stroke-width="1.5"/>' +
      '</g>'
    );
  }
  return '';
}

export function buildBunnyCostumeLayers(costumeOrWardrobe) {
  const spec = resolveWardrobeSpec(costumeOrWardrobe);
  const hatLayers = buildHatLayer(spec.hat);
  const outfitLayers = buildOutfitLayer(spec.outfit);
  const handWandLayer = buildWandLayer(spec.wand);

  // 相容舊版：當以單一舊字串 (如 'ribbon', 'explorer') 呼叫時保持舊的胸前小飾品呈現
  let legacyAccent = '';
  if (typeof costumeOrWardrobe === 'string' && spec.outfit === 'none') {
    if (costumeOrWardrobe === 'default') {
      legacyAccent =
        '<path d="M39 65 L50 71 L61 65" fill="none" stroke="#f59e0b" stroke-width="3.6" stroke-linecap="round"/>' +
        '<polygon points="50,67 51.8,70.5 55.6,70.8 52.8,73.3 53.6,77 50,75 46.4,77 47.2,73.3 44.4,70.8 48.2,70.5" fill="#fde047" stroke="#332b22" stroke-width="1.4" stroke-linejoin="round"/>';
    } else if (costumeOrWardrobe === 'ribbon') {
      legacyAccent =
        '<path d="M50 69 L41 64 C39 67 39 71 41 74 Z" fill="#fb7185" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M50 69 L59 64 C61 67 61 71 59 74 Z" fill="#fb7185" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="50" cy="69" r="3" fill="#f43f5e" stroke="#332b22" stroke-width="1.6"/>';
    } else if (costumeOrWardrobe === 'sprout') {
      legacyAccent =
        '<path d="M35 64 Q42 74 50 69 Q58 74 65 64 Q58 68 50 67 Q42 68 35 64 Z" fill="#4ade80" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>';
    } else if (costumeOrWardrobe === 'explorer') {
      legacyAccent =
        '<path d="M37 64 L50 75 L63 64 Q50 68 37 64 Z" fill="#38bdf8" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="50" cy="69" r="3" fill="#fde047" stroke="#332b22" stroke-width="1.4"/>';
    } else if (costumeOrWardrobe === 'flower') {
      legacyAccent =
        '<path d="M35 65 Q40 72 45 67 Q50 73 55 67 Q60 72 65 65" fill="#fbcfe8" stroke="#332b22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (costumeOrWardrobe === 'glasses') {
      legacyAccent =
        '<path d="M50 69 L41 64 L41 73 Z" fill="#38bdf8" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M50 69 L59 64 L59 73 Z" fill="#38bdf8" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="50" cy="69" r="3" fill="#fde047" stroke="#332b22" stroke-width="1.6"/>';
    }
  }

  return {
    backLayer: outfitLayers.backLayer,
    headFrontLayer: hatLayers.headFrontLayer,
    bodyOutfitLayer: outfitLayers.bodyOutfitLayer || legacyAccent,
    faceOverlayLayer: hatLayers.faceOverlayLayer,
    handWandLayer
  };
}

export function renderPinkBunnySvg(mood = 'normal', costumeOrWardrobe = 'default') {
  const m = mood || 'normal';
  const layers = buildBunnyCostumeLayers(costumeOrWardrobe);
  const bid = 'bn-' + nextUid();

  return (
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="' + bid + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fce7f3"/><stop offset="100%" stop-color="#f9a8d4"/></linearGradient>' +
    '<linearGradient id="' + bid + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#f472b6"/></linearGradient>' +
    '</defs>' +
    '<ellipse cx="50" cy="93" rx="24" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
    layers.backLayer +
    '<circle cx="72" cy="78" r="6" fill="#fff1f2" stroke="#332b22" stroke-width="2.6"/>' +
    '<ellipse cx="36" cy="24" rx="9" ry="20" transform="rotate(-10 36 24)" fill="#fbcfe8" stroke="#332b22" stroke-width="3.2"/>' +
    '<ellipse cx="36" cy="25" rx="4.5" ry="13" transform="rotate(-10 36 25)" fill="#f472b6"/>' +
    '<ellipse cx="64" cy="24" rx="9" ry="20" transform="rotate(10 64 24)" fill="#fbcfe8" stroke="#332b22" stroke-width="3.2"/>' +
    '<ellipse cx="64" cy="25" rx="4.5" ry="13" transform="rotate(10 64 25)" fill="#f472b6"/>' +
    '<rect x="18" y="59" width="15" height="21" rx="6" fill="#fbbf24" stroke="#332b22" stroke-width="2.8"/>' +
    '<path d="M18 66 Q25.5 70 33 66" fill="none" stroke="#b45309" stroke-width="2.4"/>' +
    '<circle cx="25.5" cy="68.5" r="2.2" fill="#fffbeb" stroke="#332b22" stroke-width="1.3"/>' +
    '<ellipse cx="29" cy="70" rx="6.5" ry="4.5" transform="rotate(-28 29 70)" fill="#fbcfe8" stroke="#332b22" stroke-width="2.6"/>' +
    '<ellipse cx="71" cy="70" rx="6.5" ry="4.5" transform="rotate(28 71 70)" fill="#fbcfe8" stroke="#332b22" stroke-width="2.6"/>' +
    '<ellipse cx="50" cy="72" rx="22" ry="18" fill="url(#' + bid + 'b)" stroke="#332b22" stroke-width="3.2"/>' +
    '<ellipse cx="50" cy="75" rx="13" ry="10.5" fill="#fff1f2"/>' +
    layers.bodyOutfitLayer +
    layers.handWandLayer +
    '<ellipse cx="50" cy="48" rx="25" ry="20" fill="url(#' + bid + 'h)" stroke="#332b22" stroke-width="3.2"/>' +
    layers.headFrontLayer +
    '<ellipse cx="33" cy="54" rx="4.8" ry="2.8" fill="#f472b6" opacity="' + (m === 'fever' ? '0.9' : '0.65') + '"/>' +
    '<ellipse cx="67" cy="54" rx="4.8" ry="2.8" fill="#f472b6" opacity="' + (m === 'fever' ? '0.9' : '0.65') + '"/>' +
    '<ellipse cx="50" cy="52" rx="3" ry="2" fill="#e11d48"/>' +
    buildFaceExpression(m, 40, 60, 48, 56, 4) +
    layers.faceOverlayLayer +
    '<ellipse cx="39" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
    '<ellipse cx="61" cy="89" rx="8" ry="5" fill="#fbcfe8" stroke="#332b22" stroke-width="2.8"/>' +
    '<circle cx="37" cy="88.5" r="1.5" fill="#ffffff" opacity="0.75"/>' +
    '<circle cx="59" cy="88.5" r="1.5" fill="#ffffff" opacity="0.75"/>' +
    '</svg>'
  );
}

export function getStageChestSvg(theme, mood) {
  const m = mood || 'normal';
  const colors = {
    forest: { top: '#86efac', body: '#4ade80', trim: '#bbf7d0', accent: '#22c55e', badge: 'leaf' },
    workshop: { top: '#fde047', body: '#facc15', trim: '#fef08a', accent: '#f97316', badge: 'gear' },
    garden: { top: '#fbcfe8', body: '#f472b6', trim: '#fce7f3', accent: '#ec4899', badge: 'bow' },
    valley: { top: '#bae6fd', body: '#60a5fa', trim: '#e0f2fe', accent: '#3b82f6', badge: 'wing' },
    castle: { top: '#ddd6fe', body: '#a78bfa', trim: '#ede9fe', accent: '#7c3aed', badge: 'crown' },
    bakery: { top: '#fde68a', body: '#f59e0b', trim: '#fef3c7', accent: '#d97706', badge: 'croissant' },
    candy: { top: '#fecdd3', body: '#fb7185', trim: '#ffe4e6', accent: '#e11d48', badge: 'berry' },
    bay: { top: '#a5f3fc', body: '#22d3ee', trim: '#cffafe', accent: '#0891b2', badge: 'shell' },
    market: { top: '#fed7aa', body: '#fb923c', trim: '#ffedd5', accent: '#ea580c', badge: 'blocks' },
    lighthouse: { top: '#c7d2fe', body: '#818cf8', trim: '#e0e7ff', accent: '#4f46e5', badge: 'prism' },
    station: { top: '#bae6fd', body: '#38bdf8', trim: '#e0f2fe', accent: '#0284c7', badge: 'train' },
    vault: { top: '#fde68a', body: '#f59e0b', trim: '#fef3c7', accent: '#b45309', badge: 'vault' },
    park: { top: '#bbf7d0', body: '#22c55e', trim: '#dcfce7', accent: '#15803d', badge: 'balloon' },
    patisserie: { top: '#fbcfe8', body: '#ec4899', trim: '#fce7f3', accent: '#be185d', badge: 'macaron' },
    skycastle: { top: '#e9d5ff', body: '#a855f7', trim: '#f3e8ff', accent: '#7e22ce', badge: 'starlight' }
  };
  const pal = colors[theme] || colors.forest;
  const cid = 'ch-' + (theme || 'forest') + '-' + nextUid();

  function buildThemeAddon(b) {
    if (b === 'leaf') {
      return (
        '<path d="M48 27 C41 14 27 16 30 25 C34 30 44 29 48 27 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M48 27 C55 13 69 15 66 24 C62 29 52 29 48 27 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.2"/>'
      );
    }
    if (b === 'gear') {
      return (
        '<circle cx="48" cy="24" r="7" fill="#fb923c" stroke="#332b22" stroke-width="2.2"/>' +
        '<circle cx="48" cy="24" r="2.6" fill="#fef08a" stroke="#332b22" stroke-width="1.6"/>'
      );
    }
    if (b === 'bow') {
      return (
        '<path d="M48 26 L36 19 C33 23 33 29 36 33 Z" fill="#ec4899" stroke="#332b22" stroke-width="2.1"/>' +
        '<path d="M48 26 L60 19 C63 23 63 29 60 33 Z" fill="#ec4899" stroke="#332b22" stroke-width="2.1"/>' +
        '<circle cx="48" cy="26" r="4" fill="#fde047" stroke="#332b22" stroke-width="2"/>'
      );
    }
    if (b === 'wing') {
      return (
        '<path d="M16 48 C6 38 4 50 11 56 C14 58 18 55 18 51 Z" fill="#fde047" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M80 48 C90 38 92 50 85 56 C82 58 78 55 78 51 Z" fill="#fde047" stroke="#332b22" stroke-width="2.2"/>'
      );
    }
    if (b === 'croissant') {
      return (
        '<path d="M35 26 Q48 14 61 26 Q54 29 48 27 Q42 29 35 26 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<circle cx="48" cy="22" r="2.4" fill="#fffbeb"/>'
      );
    }
    if (b === 'berry') {
      return (
        '<path d="M40 20 C40 14 56 14 56 20 C56 27 48 31 48 31 C48 31 40 27 40 20 Z" fill="#f43f5e" stroke="#332b22" stroke-width="2.1"/>' +
        '<path d="M42 16 L48 13 L54 16" fill="none" stroke="#22c55e" stroke-width="2.4" stroke-linecap="round"/>'
      );
    }
    if (b === 'shell') {
      return (
        '<path d="M37 27 C37 16 59 16 59 27 Z" fill="#fde68a" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<circle cx="48" cy="23" r="3" fill="#ffffff" stroke="#332b22" stroke-width="1.5"/>'
      );
    }
    if (b === 'blocks') {
      return (
        '<rect x="37" y="19" width="10" height="8" rx="1.5" fill="#60a5fa" stroke="#332b22" stroke-width="1.8"/>' +
        '<rect x="49" y="19" width="10" height="8" rx="1.5" fill="#fbbf24" stroke="#332b22" stroke-width="1.8"/>' +
        '<rect x="43" y="12" width="10" height="8" rx="1.5" fill="#fb7185" stroke="#332b22" stroke-width="1.8"/>'
      );
    }
    if (b === 'prism') {
      return (
        '<path d="M34 27 A14 14 0 0 1 62 27" fill="none" stroke="#f43f5e" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M38 27 A10 10 0 0 1 58 27" fill="none" stroke="#facc15" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M42 27 A6 6 0 0 1 54 27" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>'
      );
    }
    if (b === 'train') {
      return (
        '<rect x="36" y="15" width="24" height="12" rx="4" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="42" cy="14" r="3" fill="#ffffff" stroke="#332b22" stroke-width="1.5"/>' +
        '<circle cx="53" cy="21" r="2.2" fill="#fde047"/>'
      );
    }
    if (b === 'vault') {
      return (
        '<circle cx="48" cy="20" r="8" fill="#fef08a" stroke="#332b22" stroke-width="2.1"/>' +
        '<line x1="48" y1="14" x2="48" y2="26" stroke="#b45309" stroke-width="2"/>' +
        '<line x1="42" y1="20" x2="54" y2="20" stroke="#b45309" stroke-width="2"/>'
      );
    }
    if (b === 'balloon') {
      return (
        '<ellipse cx="42" cy="18" rx="5.5" ry="7" fill="#fb7185" stroke="#332b22" stroke-width="1.9"/>' +
        '<ellipse cx="54" cy="17" rx="5.5" ry="7" fill="#fde047" stroke="#332b22" stroke-width="1.9"/>' +
        '<line x1="42" y1="25" x2="48" y2="29" stroke="#332b22" stroke-width="1.5"/>' +
        '<line x1="54" y1="24" x2="48" y2="29" stroke="#332b22" stroke-width="1.5"/>'
      );
    }
    if (b === 'macaron') {
      return (
        '<rect x="37" y="16" width="22" height="5" rx="2.5" fill="#fbcfe8" stroke="#332b22" stroke-width="1.8"/>' +
        '<rect x="38" y="21" width="20" height="3" fill="#fef3c7"/>' +
        '<rect x="37" y="24" width="22" height="4" rx="2" fill="#a7f3d0" stroke="#332b22" stroke-width="1.8"/>'
      );
    }
    if (b === 'starlight') {
      return (
        '<polygon points="48,11 51,19 59,20 53,25 55,32 48,28 41,32 43,25 37,20 45,19" fill="#fde047" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>'
      );
    }
    return '<polygon points="36,27 40,16 48,22 56,16 60,27" fill="#fbbf24" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>';
  }

  if (m === 'open') {
    return (
      '<svg viewBox="0 0 96 96">' +
      '<defs><linearGradient id="' + cid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + pal.top + '"/><stop offset="100%" stop-color="' + pal.body + '"/></linearGradient></defs>' +
      '<ellipse cx="48" cy="84" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
      '<g transform="rotate(-14 20 42)">' +
      '<path d="M16 42 C16 25 80 25 80 42 Z" fill="' + pal.accent + '" stroke="#332b22" stroke-width="3"/>' +
      '<rect x="14" y="38" width="68" height="8" rx="4" fill="#fbbf24" stroke="#332b22" stroke-width="2.6"/>' +
      '</g>' +
      '<ellipse cx="48" cy="46" rx="26" ry="7" fill="#332b22"/>' +
      '<circle cx="33" cy="41" r="6.5" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
      '<polygon points="48,30 55,38 48,46 41,38" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
      '<polygon points="63,34 69,41 63,47 57,41" fill="#fb7185" stroke="#332b22" stroke-width="2"/>' +
      '<rect x="16" y="45" width="64" height="36" rx="12" fill="url(#' + cid + ')" stroke="#332b22" stroke-width="3.2"/>' +
      '<rect x="23" y="45" width="7" height="36" fill="#fbbf24" opacity="0.85" stroke="#332b22" stroke-width="2"/>' +
      '<rect x="66" y="45" width="7" height="36" fill="#fbbf24" opacity="0.85" stroke="#332b22" stroke-width="2"/>' +
      '<ellipse cx="32" cy="66" rx="4" ry="2.4" fill="#fb7185" opacity="0.6"/>' +
      '<ellipse cx="64" cy="66" rx="4" ry="2.4" fill="#fb7185" opacity="0.6"/>' +
      buildFaceExpression('happy', 38, 58, 63, 68, 3.6) +
      '<polygon points="48,8 51,16 59,16 53,21 55,28 48,23 41,28 43,21 37,16 45,16" fill="#fde047" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>'
    );
  }

  return (
    '<svg viewBox="0 0 96 96">' +
    '<defs><linearGradient id="' + cid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + pal.trim + '"/><stop offset="100%" stop-color="' + pal.body + '"/></linearGradient></defs>' +
    '<ellipse cx="48" cy="84" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
    '<ellipse cx="33" cy="79" rx="7" ry="4.5" fill="' + pal.accent + '" stroke="#332b22" stroke-width="2.5"/>' +
    '<ellipse cx="63" cy="79" rx="7" ry="4.5" fill="' + pal.accent + '" stroke="#332b22" stroke-width="2.5"/>' +
    '<path d="M16 45 C16 24 80 24 80 45 Z" fill="' + pal.top + '" stroke="#332b22" stroke-width="3.2"/>' +
    '<rect x="16" y="42" width="64" height="36" rx="12" fill="url(#' + cid + ')" stroke="#332b22" stroke-width="3.2"/>' +
    '<rect x="24" y="31" width="6" height="47" rx="2" fill="#fbbf24" stroke="#332b22" stroke-width="2"/>' +
    '<rect x="66" y="31" width="6" height="47" rx="2" fill="#fbbf24" stroke="#332b22" stroke-width="2"/>' +
    '<path d="M16 44 Q48 38 80 44" fill="none" stroke="#332b22" stroke-width="3"/>' +
    buildThemeAddon(pal.badge) +
    '<rect x="41" y="37" width="14" height="13" rx="4" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
    '<circle cx="48" cy="43.5" r="2.2" fill="#332b22"/>' +
    '<ellipse cx="30" cy="63" rx="4" ry="2.4" fill="#fb7185" opacity="0.6"/>' +
    '<ellipse cx="66" cy="63" rx="4" ry="2.4" fill="#fb7185" opacity="0.6"/>' +
    buildFaceExpression(m === 'hit' ? 'hit' : 'normal', 38, 58, 60, 65, 3.6) +
    '<path d="M12 24 L14 28 L18 30 L14 32 L12 36 L10 32 L6 30 L10 28 Z" fill="#fde047"/>' +
    '<circle cx="83" cy="27" r="2.3" fill="#fde047"/>' +
    '</svg>'
  );
}

export function getCharacterSvg(key, isBoss, mood, options = {}) {
  const m = mood || 'normal';
  const uid = nextUid();

  if (isBoss) {
    const bossMap = {
      forest: () => {
        const gId = 'bs-for-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="27" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M22 55 L11 47 M14 49 L11 42" stroke="#332b22" stroke-width="3.5" stroke-linecap="round"/>' +
          '<path d="M74 55 L85 47 M82 49 L85 42" stroke="#332b22" stroke-width="3.5" stroke-linecap="round"/>' +
          '<path d="M22 36 H74 L77 77 C77 82 68 83 62 81 L57 77 L39 77 L34 81 C28 83 19 82 19 77 Z" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2" stroke-linejoin="round"/>' +
          '<path d="M29 44 V53 M67 45 V55 M31 69 V75 M65 69 V75" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>' +
          '<circle cx="28" cy="27" r="14" fill="#4ade80" stroke="#332b22" stroke-width="3"/>' +
          '<circle cx="68" cy="27" r="14" fill="#4ade80" stroke="#332b22" stroke-width="3"/>' +
          '<circle cx="48" cy="22" r="17" fill="#86efac" stroke="#332b22" stroke-width="3"/>' +
          '<circle cx="62" cy="18" r="4.5" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
          '<circle cx="62" cy="18" r="1.8" fill="#f97316"/>' +
          '<ellipse cx="30" cy="60" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.7"/>' +
          '<ellipse cx="66" cy="60" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.7"/>' +
          buildFaceExpression(m, 37, 59, 53, 62, 4.3) +
          '</svg>'
        );
      },
      workshop: () => {
        const gId = 'bs-wrk-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="27" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<rect x="10" y="48" width="10" height="14" rx="4" fill="#94a3b8" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="76" y="48" width="10" height="14" rx="4" fill="#94a3b8" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="27" y="74" width="13" height="9" rx="4" fill="#475569" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="56" y="74" width="13" height="9" rx="4" fill="#475569" stroke="#332b22" stroke-width="2.6"/>' +
          '<line x1="48" y1="12" x2="48" y2="26" stroke="#332b22" stroke-width="3.2"/>' +
          '<circle cx="48" cy="11" r="6" fill="#ef4444" stroke="#332b22" stroke-width="2.6"/>' +
          '<circle cx="46" cy="9" r="2" fill="#fecaca"/>' +
          '<rect x="18" y="25" width="60" height="52" rx="14" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<rect x="25" y="34" width="46" height="20" rx="8" fill="#1e293b" stroke="#332b22" stroke-width="2.5"/>' +
          '<circle cx="24" cy="31" r="2" fill="#94a3b8"/><circle cx="72" cy="31" r="2" fill="#94a3b8"/>' +
          '<rect x="31" y="61" width="34" height="11" rx="5" fill="#dbeafe" stroke="#332b22" stroke-width="2.2"/>' +
          '<circle cx="40" cy="66.5" r="3" fill="#38bdf8"/><circle cx="48" cy="66.5" r="3" fill="#4ade80"/><circle cx="56" cy="66.5" r="3" fill="#fb7185"/>' +
          '<rect x="29" y="37" width="16" height="13" rx="4" fill="#ffffff"/>' +
          '<rect x="51" y="37" width="16" height="13" rx="4" fill="#ffffff"/>' +
          buildFaceExpression(m, 37, 59, 44, 57, 3.4) +
          '</svg>'
        );
      },
      garden: () => {
        const gId = 'bs-gar-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="25" ry="5" fill="rgba(51,43,34,0.15)"/>' +
          '<path d="M48 76 C28 84 18 72 28 65 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M48 76 C68 84 78 72 68 65 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.6"/>' +
          '<circle cx="48" cy="20" r="14" fill="#fb7185" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="22" cy="37" r="14" fill="#f472b6" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="74" cy="37" r="14" fill="#f472b6" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="30" cy="64" r="13" fill="#f9a8d4" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="66" cy="64" r="13" fill="#f9a8d4" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="48" cy="48" r="24" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<ellipse cx="33" cy="51" rx="4.2" ry="2.5" fill="#be185d" opacity="0.5"/>' +
          '<ellipse cx="63" cy="51" rx="4.2" ry="2.5" fill="#be185d" opacity="0.5"/>' +
          buildFaceExpression(m, 39, 57, 47, 55, 4) +
          '</svg>'
        );
      },
      valley: () => {
        const gId = 'bs-val-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M24 44 C6 28 4 48 14 58 C18 61 24 58 26 52 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.8"/>' +
          '<path d="M72 44 C90 28 92 48 82 58 C78 61 72 58 70 52 Z" fill="#fbbf24" stroke="#332b22" stroke-width="2.8"/>' +
          '<polygon points="31,28 24,10 41,22" fill="#fbbf24" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<polygon points="65,28 72,10 55,22" fill="#fbbf24" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<ellipse cx="34" cy="79" rx="8" ry="5" fill="#2563eb" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="62" cy="79" rx="8" ry="5" fill="#2563eb" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M21 72 Q16 27 48 21 Q80 27 75 72 Z" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2" stroke-linejoin="round"/>' +
          '<ellipse cx="48" cy="64" rx="17" ry="11" fill="#fefce8" stroke="#332b22" stroke-width="2.4"/>' +
          '<path d="M36 63 H60 M39 69 H57" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"/>' +
          '<path d="M81 20 C85 13 88 21 84 26 C81 28 78 24 81 20 Z" fill="#f97316" stroke="#332b22" stroke-width="1.8"/>' +
          '<ellipse cx="31" cy="48" rx="4.2" ry="2.4" fill="#fb7185" opacity="0.65"/>' +
          '<ellipse cx="65" cy="48" rx="4.2" ry="2.4" fill="#fb7185" opacity="0.65"/>' +
          buildFaceExpression(m, 38, 58, 45, 52, 4.1) +
          '</svg>'
        );
      },
      castle: () => {
        const gId = 'bs-cas-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ddd6fe"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M23 40 L10 75 Q48 84 86 75 L73 40 Z" fill="#5b21b6" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M14 72 Q48 80 82 72" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
          '<ellipse cx="35" cy="79" rx="7.5" ry="4.5" fill="#7c3aed" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="61" cy="79" rx="7.5" ry="4.5" fill="#7c3aed" stroke="#332b22" stroke-width="2.6"/>' +
          '<polygon points="24,30 30,11 40,22 48,8 56,22 66,11 72,30" fill="#fbbf24" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="31" cy="23" r="2.6" fill="#ef4444" stroke="#332b22" stroke-width="1.2"/>' +
          '<circle cx="48" cy="20" r="3.2" fill="#38bdf8" stroke="#332b22" stroke-width="1.2"/>' +
          '<circle cx="65" cy="23" r="2.6" fill="#4ade80" stroke="#332b22" stroke-width="1.2"/>' +
          '<rect x="21" y="28" width="54" height="49" rx="16" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<polygon points="48,62 53,67 48,72 43,67" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
          '<ellipse cx="31" cy="52" rx="4.4" ry="2.5" fill="#f472b6" opacity="0.65"/>' +
          '<ellipse cx="65" cy="52" rx="4.4" ry="2.5" fill="#f472b6" opacity="0.65"/>' +
          buildFaceExpression(m, 37, 59, 49, 57, 4.2) +
          '<path d="M12 24 L14 28 L18 30 L14 32 L12 36 L10 32 L6 30 L10 28 Z" fill="#fde047"/>' +
          '<circle cx="84" cy="24" r="2.5" fill="#fde047"/>' +
          '</svg>'
        );
      },
      bakery: () => {
        const gId = 'bs-bak-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M16 56 C8 43 13 24 26 24 C29 24 32 33 32 38 Z" fill="#f59e0b" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M80 56 C88 43 83 24 70 24 C67 24 64 33 64 38 Z" fill="#f59e0b" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/>' +
          '<ellipse cx="15" cy="60" rx="6" ry="4.5" transform="rotate(-20 15 60)" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/>' +
          '<ellipse cx="81" cy="60" rx="6" ry="4.5" transform="rotate(20 81 60)" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/>' +
          '<ellipse cx="34" cy="79" rx="7.5" ry="4.5" fill="#b45309" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="62" cy="79" rx="7.5" ry="4.5" fill="#b45309" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M18 54 C18 28 78 28 78 54 C78 74 64 81 48 81 C32 81 18 74 18 54 Z" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<path d="M29 37 Q32 52 28 65 M67 37 Q64 52 68 65" fill="none" stroke="#92400e" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path d="M35 28 C29 14 42 9 48 15 C54 9 67 14 61 28 Z" fill="#ffffff" stroke="#332b22" stroke-width="2.6" stroke-linejoin="round"/>' +
          '<rect x="34" y="25" width="28" height="5" rx="2.5" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
          '<rect x="43" y="68" width="10" height="7" rx="2" fill="#fef08a" stroke="#332b22" stroke-width="1.8"/>' +
          '<path d="M32 37 Q40 33 47 34" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.75"/>' +
          '<ellipse cx="31" cy="56" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.72"/>' +
          '<ellipse cx="65" cy="56" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.72"/>' +
          buildFaceExpression(m, 38, 58, 51, 59, 4.1) +
          '</svg>'
        );
      },
      candy: () => {
        const gId = 'bs-can-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe4e6"/><stop offset="100%" stop-color="#fb7185"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="27" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<rect x="9" y="47" width="11" height="15" rx="5" fill="#f472b6" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="76" y="47" width="11" height="15" rx="5" fill="#f472b6" stroke="#332b22" stroke-width="2.6"/>' +
          '<circle cx="14.5" cy="54.5" r="2.5" fill="#fef08a"/>' +
          '<circle cx="81.5" cy="54.5" r="2.5" fill="#fef08a"/>' +
          '<rect x="28" y="75" width="12" height="8" rx="4" fill="#e11d48" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="56" y="75" width="12" height="8" rx="4" fill="#e11d48" stroke="#332b22" stroke-width="2.6"/>' +
          '<line x1="48" y1="12" x2="48" y2="26" stroke="#332b22" stroke-width="3.2"/>' +
          '<circle cx="48" cy="12" r="6.5" fill="#fb7185" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M44 12 A4 4 0 0 1 52 12" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>' +
          '<rect x="18" y="25" width="60" height="53" rx="15" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<path d="M19 34 Q28 42 36 33 Q44 43 52 33 Q60 43 68 33 Q73 39 77 34 L77 27 Q48 22 19 27 Z" fill="#ffffff" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="30" r="2.2" fill="#f43f5e"/><circle cx="48" cy="29" r="2.2" fill="#38bdf8"/><circle cx="64" cy="30" r="2.2" fill="#facc15"/>' +
          '<rect x="27" y="40" width="42" height="20" rx="8" fill="#1e293b" stroke="#332b22" stroke-width="2.4"/>' +
          '<rect x="30" y="43" width="15" height="13" rx="4" fill="#ffffff"/>' +
          '<rect x="51" y="43" width="15" height="13" rx="4" fill="#ffffff"/>' +
          '<rect x="31" y="64" width="34" height="9" rx="4.5" fill="#fef08a" stroke="#332b22" stroke-width="2"/>' +
          '<circle cx="38" cy="68.5" r="2.2" fill="#fb7185"/><circle cx="48" cy="68.5" r="2.2" fill="#38bdf8"/><circle cx="58" cy="68.5" r="2.2" fill="#4ade80"/>' +
          buildFaceExpression(m, 37.5, 58.5, 49.5, 61, 3.3) +
          '</svg>'
        );
      },
      bay: () => {
        const gId = 'bs-bay-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a5f3fc"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M22 62 C11 66 8 78 18 81 C24 82 28 76 30 70 Z" fill="#22d3ee" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M74 62 C85 66 88 78 78 81 C72 82 68 76 66 70 Z" fill="#22d3ee" stroke="#332b22" stroke-width="2.6"/>' +
          '<circle cx="17" cy="75" r="2.2" fill="#fffbeb"/><circle cx="79" cy="75" r="2.2" fill="#fffbeb"/>' +
          '<circle cx="31" cy="79" r="6" fill="#67e8f9" stroke="#332b22" stroke-width="2.5"/>' +
          '<circle cx="48" cy="80" r="6.5" fill="#67e8f9" stroke="#332b22" stroke-width="2.5"/>' +
          '<circle cx="65" cy="79" r="6" fill="#67e8f9" stroke="#332b22" stroke-width="2.5"/>' +
          '<circle cx="48" cy="46" r="26" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<path d="M32 29 Q40 24 47 26" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>' +
          '<polygon points="36,22 41,11 48,17 55,11 60,22" fill="#fde047" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<circle cx="48" cy="18" r="2.5" fill="#fb7185" stroke="#332b22" stroke-width="1.2"/>' +
          '<circle cx="17" cy="24" r="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.8" opacity="0.85"/>' +
          '<circle cx="80" cy="28" r="4" fill="#fce7f3" stroke="#db2777" stroke-width="1.6" opacity="0.85"/>' +
          '<ellipse cx="30" cy="50" rx="4.2" ry="2.5" fill="#fb7185" opacity="0.72"/>' +
          '<ellipse cx="66" cy="50" rx="4.2" ry="2.5" fill="#fb7185" opacity="0.72"/>' +
          buildFaceExpression(m, 38, 58, 45, 53, 4.1) +
          '</svg>'
        );
      },
      market: () => {
        const gId = 'bs-mkt-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#eab308"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<ellipse cx="12" cy="52" rx="5.5" ry="4.5" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/>' +
          '<ellipse cx="84" cy="52" rx="5.5" ry="4.5" fill="#fbbf24" stroke="#332b22" stroke-width="2.5"/>' +
          '<ellipse cx="34" cy="79" rx="7" ry="4.5" fill="#b45309" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="62" cy="79" rx="7" ry="4.5" fill="#b45309" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="17" y="21" width="62" height="56" rx="11" fill="#92400e" stroke="#332b22" stroke-width="3.2"/>' +
          '<rect x="23" y="27" width="50" height="44" rx="7" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.4"/>' +
          '<line x1="23" y1="36" x2="73" y2="36" stroke="#78350f" stroke-width="2.4"/>' +
          '<circle cx="32" cy="36" r="4.2" fill="#ef4444" stroke="#332b22" stroke-width="1.8"/>' +
          '<circle cx="42" cy="36" r="4.2" fill="#38bdf8" stroke="#332b22" stroke-width="1.8"/>' +
          '<circle cx="54" cy="36" r="4.2" fill="#4ade80" stroke="#332b22" stroke-width="1.8"/>' +
          '<circle cx="64" cy="36" r="4.2" fill="#a855f7" stroke="#332b22" stroke-width="1.8"/>' +
          '<circle cx="48" cy="16" r="7" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
          '<rect x="45.5" y="13.5" width="5" height="5" fill="#ffffff" stroke="#332b22" stroke-width="1.4"/>' +
          '<ellipse cx="31" cy="54" rx="4" ry="2.4" fill="#fb7185" opacity="0.68"/>' +
          '<ellipse cx="65" cy="54" rx="4" ry="2.4" fill="#fb7185" opacity="0.68"/>' +
          buildFaceExpression(m, 38, 58, 50, 58, 3.8) +
          '</svg>'
        );
      },
      lighthouse: () => {
        const gId = 'bs-lgh-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<path d="M18 52 C8 54 8 68 18 70 L28 70 Z" fill="#64748b" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M78 52 C88 54 88 68 78 70 L68 70 Z" fill="#64748b" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="35" cy="80" rx="7" ry="4" fill="#475569" stroke="#332b22" stroke-width="2.4"/>' +
          '<ellipse cx="61" cy="80" rx="7" ry="4" fill="#475569" stroke="#332b22" stroke-width="2.4"/>' +
          '<path d="M29 35 L23 79 H73 L67 35 Z" fill="#ffffff" stroke="#332b22" stroke-width="3.2" stroke-linejoin="round"/>' +
          '<path d="M27 52 H69 L71 64 H25 Z" fill="#ef4444" stroke="#332b22" stroke-width="2.2"/>' +
          '<rect x="33" y="20" width="30" height="16" rx="4" fill="#fef08a" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M29 21 L48 9 L67 21 Z" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<rect x="26" y="34" width="44" height="5" rx="2.5" fill="#1e293b" stroke="#332b22" stroke-width="2"/>' +
          '<circle cx="48" cy="28" r="5" fill="#fde047" stroke="#f59e0b" stroke-width="1.5"/>' +
          '<rect x="44" y="68" width="8" height="11" rx="4" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
          '<ellipse cx="33" cy="48" rx="4" ry="2.2" fill="#fb7185" opacity="0.68"/>' +
          '<ellipse cx="63" cy="48" rx="4" ry="2.2" fill="#fb7185" opacity="0.68"/>' +
          buildFaceExpression(m, 39, 57, 45, 55, 3.8) +
          '</svg>'
        );
      },
      station: () => {
        const gId = 'bs-sta-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="29" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<rect x="9" y="45" width="9" height="16" rx="4" fill="#fbbf24" stroke="#332b22" stroke-width="2.4"/>' +
          '<rect x="78" y="45" width="9" height="16" rx="4" fill="#fbbf24" stroke="#332b22" stroke-width="2.4"/>' +
          '<circle cx="29" cy="78" r="8" fill="#475569" stroke="#332b22" stroke-width="2.6"/><circle cx="29" cy="78" r="3" fill="#fde047"/>' +
          '<circle cx="48" cy="79" r="8.5" fill="#475569" stroke="#332b22" stroke-width="2.6"/><circle cx="48" cy="79" r="3" fill="#fde047"/>' +
          '<circle cx="67" cy="78" r="8" fill="#475569" stroke="#332b22" stroke-width="2.6"/><circle cx="67" cy="78" r="3" fill="#fde047"/>' +
          '<rect x="26" y="13" width="14" height="16" rx="4" fill="#64748b" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="24" y="11" width="18" height="5" rx="2.5" fill="#ef4444" stroke="#332b22" stroke-width="2"/>' +
          '<circle cx="23" cy="7" r="4.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8"/>' +
          '<circle cx="15" cy="5" r="3.2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.4"/>' +
          '<rect x="58" y="16" width="10" height="11" rx="3" fill="#fde047" stroke="#332b22" stroke-width="2.2"/>' +
          '<rect x="16" y="26" width="64" height="49" rx="14" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<circle cx="48" cy="48" r="19" fill="#fffbeb" stroke="#332b22" stroke-width="2.8"/>' +
          '<circle cx="48" cy="32.5" r="1.4" fill="#332b22"/><circle cx="63.5" cy="48" r="1.4" fill="#332b22"/><circle cx="48" cy="63.5" r="1.4" fill="#332b22"/><circle cx="32.5" cy="48" r="1.4" fill="#332b22"/>' +
          '<line x1="48" y1="36" x2="48" y2="48" stroke="#ef4444" stroke-width="2.6" stroke-linecap="round"/>' +
          '<line x1="48" y1="48" x2="57" y2="52" stroke="#332b22" stroke-width="2.4" stroke-linecap="round"/>' +
          '<ellipse cx="36" cy="50" rx="3.4" ry="2" fill="#fb7185" opacity="0.65"/>' +
          '<ellipse cx="60" cy="50" rx="3.4" ry="2" fill="#fb7185" opacity="0.65"/>' +
          buildFaceExpression(m, 39, 57, 45, 56, 3.3) +
          '</svg>'
        );
      },
      vault: () => {
        const gId = 'bs-vlt-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<ellipse cx="12" cy="53" rx="6" ry="4.5" fill="#f59e0b" stroke="#332b22" stroke-width="2.5"/>' +
          '<ellipse cx="84" cy="53" rx="6" ry="4.5" fill="#f59e0b" stroke="#332b22" stroke-width="2.5"/>' +
          '<polygon points="24,28 19,12 34,21" fill="#f59e0b" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<polygon points="72,28 77,12 62,21" fill="#f59e0b" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<ellipse cx="33" cy="79" rx="7" ry="4.5" fill="#92400e" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="63" cy="79" rx="7" ry="4.5" fill="#92400e" stroke="#332b22" stroke-width="2.6"/>' +
          '<rect x="17" y="24" width="62" height="53" rx="14" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<rect x="22" y="29" width="52" height="43" rx="10" fill="none" stroke="#fef3c7" stroke-width="2" opacity="0.75"/>' +
          '<circle cx="48" cy="64" r="9.5" fill="#e2e8f0" stroke="#332b22" stroke-width="2.4"/>' +
          '<line x1="48" y1="57" x2="48" y2="71" stroke="#475569" stroke-width="2.2"/>' +
          '<line x1="41" y1="64" x2="55" y2="64" stroke="#475569" stroke-width="2.2"/>' +
          '<circle cx="48" cy="64" r="3.2" fill="#fde047" stroke="#332b22" stroke-width="1.6"/>' +
          '<polygon points="48,14 54,21 48,28 42,21" fill="#38bdf8" stroke="#332b22" stroke-width="2.2"/>' +
          '<ellipse cx="31" cy="49" rx="4" ry="2.4" fill="#fb7185" opacity="0.65"/>' +
          '<ellipse cx="65" cy="49" rx="4" ry="2.4" fill="#fb7185" opacity="0.65"/>' +
          buildFaceExpression(m, 37, 59, 44, 52, 4) +
          '</svg>'
        );
      },
      park: () => {
        const gId = 'bs-prk-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#4ade80"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<circle cx="20" cy="21" r="9" fill="#fb7185" stroke="#332b22" stroke-width="2.5"/><circle cx="17" cy="18" r="2.2" fill="#ffffff" opacity="0.8"/>' +
          '<circle cx="76" cy="21" r="9" fill="#60a5fa" stroke="#332b22" stroke-width="2.5"/><circle cx="73" cy="18" r="2.2" fill="#ffffff" opacity="0.8"/>' +
          '<path d="M23 29 L20 53 M73 29 L76 53" stroke="#332b22" stroke-width="2.2"/>' +
          '<circle cx="18" cy="56" r="5.5" fill="#ffffff" stroke="#332b22" stroke-width="2.4"/>' +
          '<circle cx="78" cy="56" r="5.5" fill="#ffffff" stroke="#332b22" stroke-width="2.4"/>' +
          '<ellipse cx="35" cy="80" rx="7.5" ry="4.5" fill="#f43f5e" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="61" cy="80" rx="7.5" ry="4.5" fill="#3b82f6" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M24 72 Q32 80 40 73 Q48 81 56 73 Q64 80 72 72" fill="#fbcfe8" stroke="#332b22" stroke-width="2.4"/>' +
          '<polygon points="32,27 48,10 64,27" fill="#f43f5e" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<path d="M32 27 Q23 16 18 22" fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M64 27 Q73 16 78 22" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="48" cy="9" r="4.5" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
          '<circle cx="48" cy="53" r="25" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<circle cx="48" cy="54" r="4.5" fill="#ef4444" stroke="#332b22" stroke-width="2"/><circle cx="46.5" cy="52.5" r="1.4" fill="#ffffff"/>' +
          '<ellipse cx="30" cy="54" rx="4.2" ry="2.5" fill="#fb7185" opacity="0.72"/>' +
          '<ellipse cx="66" cy="54" rx="4.2" ry="2.5" fill="#fb7185" opacity="0.72"/>' +
          buildFaceExpression(m, 37, 59, 47, 61, 3.9) +
          '</svg>'
        );
      },
      patisserie: () => {
        const gId = 'bs-pat-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff1f2"/><stop offset="100%" stop-color="#f9a8d4"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<ellipse cx="14" cy="58" rx="6" ry="4" transform="rotate(-18 14 58)" fill="#fef3c7" stroke="#332b22" stroke-width="2.4"/>' +
          '<ellipse cx="82" cy="58" rx="6" ry="4" transform="rotate(18 82 58)" fill="#fef3c7" stroke="#332b22" stroke-width="2.4"/>' +
          '<ellipse cx="35" cy="79" rx="7" ry="4.5" fill="#f472b6" stroke="#332b22" stroke-width="2.6"/>' +
          '<ellipse cx="61" cy="79" rx="7" ry="4.5" fill="#f472b6" stroke="#332b22" stroke-width="2.6"/>' +
          '<path d="M18 46 H78 L73 76 H23 Z" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2" stroke-linejoin="round"/>' +
          '<path d="M21 67 H75" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M21 67 H75" stroke="#332b22" stroke-width="1.6" stroke-dasharray="6 4"/>' +
          '<path d="M16 46 Q24 24 48 24 Q72 24 80 46 Q68 52 58 46 Q48 53 38 46 Q28 52 16 46 Z" fill="#fef3c7" stroke="#332b22" stroke-width="3" stroke-linejoin="round"/>' +
          '<circle cx="34" cy="36" r="2" fill="#fb7185"/><circle cx="62" cy="36" r="2" fill="#38bdf8"/><circle cx="48" cy="33" r="2" fill="#4ade80"/>' +
          '<circle cx="48" cy="19" r="6.5" fill="#f43f5e" stroke="#332b22" stroke-width="2.4"/><circle cx="46" cy="17" r="1.8" fill="#ffffff" opacity="0.85"/>' +
          '<path d="M48 13 Q54 9 57 12" fill="none" stroke="#16a34a" stroke-width="2.6" stroke-linecap="round"/>' +
          '<ellipse cx="31" cy="60" rx="4.2" ry="2.4" fill="#fb7185" opacity="0.72"/>' +
          '<ellipse cx="65" cy="60" rx="4.2" ry="2.4" fill="#fb7185" opacity="0.72"/>' +
          buildFaceExpression(m, 38, 58, 55, 63, 3.8) +
          '</svg>'
        );
      },
      skycastle: () => {
        const gId = 'bs-sky-' + uid;
        return (
          '<svg viewBox="0 0 96 96">' +
          '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f3e8ff"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs>' +
          '<ellipse cx="48" cy="86" rx="28" ry="5.5" fill="rgba(51,43,34,0.16)"/>' +
          '<circle cx="48" cy="48" r="34" fill="none" stroke="#fde047" stroke-width="2.6" stroke-dasharray="9 6" opacity="0.9"/>' +
          '<circle cx="14" cy="48" r="4.5" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
          '<circle cx="82" cy="48" r="4.5" fill="#38bdf8" stroke="#332b22" stroke-width="2"/>' +
          '<path d="M22 36 L11 66 Q48 75 85 66 L74 36 Z" fill="#4c1d95" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<ellipse cx="36" cy="78" rx="6.5" ry="4" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
          '<ellipse cx="60" cy="78" rx="6.5" ry="4" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
          '<polygon points="26,28 32,10 42,20 48,7 54,20 64,10 70,28" fill="#fde047" stroke="#332b22" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<circle cx="48" cy="18" r="2.8" fill="#38bdf8" stroke="#332b22" stroke-width="1.2"/>' +
          '<circle cx="48" cy="49" r="24" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="3.2"/>' +
          '<polygon points="48,62 50,66 54,66.5 51,69 52,73 48,71 44,73 45,69 42,66.5 46,66" fill="#fde047" stroke="#332b22" stroke-width="1.5"/>' +
          '<ellipse cx="32" cy="54" rx="4.2" ry="2.4" fill="#f472b6" opacity="0.7"/>' +
          '<ellipse cx="64" cy="54" rx="4.2" ry="2.4" fill="#f472b6" opacity="0.7"/>' +
          buildFaceExpression(m, 38, 58, 48, 57, 4) +
          '</svg>'
        );
      }
    };
    const fn = bossMap[key] || bossMap.forest;
    return fn();
  }

  const spMood = m === 'happy' || m === 'fever' ? 'happy' : 'normal';

  function buildSparkles(color) {
    return (
      '<g fill="' + color + '" opacity="0.9">' +
      '<path d="M11 22 L12.6 25.4 L16 27 L12.6 28.6 L11 32 L9.4 28.6 L6 27 L9.4 25.4 Z"/>' +
      '<circle cx="69" cy="20" r="2.2"/>' +
      '<circle cx="67" cy="58" r="1.7"/>' +
      '</g>'
    );
  }

  const spriteMap = {
    forest: () => {
      const gId = 'sp-for-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dcfce7"/><stop offset="100%" stop-color="#86efac"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#4ade80') +
        '<ellipse cx="30" cy="65" rx="6.5" ry="4" fill="#4ade80" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="50" cy="65" rx="6.5" ry="4" fill="#4ade80" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="16" cy="48" rx="5" ry="3.8" transform="rotate(-20 16 48)" fill="#bbf7d0" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="64" cy="48" rx="5" ry="3.8" transform="rotate(20 64 48)" fill="#bbf7d0" stroke="#332b22" stroke-width="2.4"/>' +
        '<rect x="18" y="27" width="44" height="39" rx="14" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<rect x="34" y="22" width="12" height="6" rx="3" fill="#86efac" stroke="#332b22" stroke-width="2.4"/>' +
        '<path d="M40 23 C33 9 18 11 21 21 C24 27 36 25 40 23 Z" fill="#4ade80" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M40 23 C47 8 62 10 59 20 C56 26 44 25 40 23 Z" fill="#22c55e" stroke="#332b22" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M26 19 Q33 20 39 22 M54 18 Q47 19 41 22" stroke="#166534" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
        '<circle cx="27" cy="16" r="2" fill="#ffffff" opacity="0.9"/>' +
        '<ellipse cx="26" cy="49" rx="4" ry="2.4" fill="#fb7185" opacity="0.62"/>' +
        '<ellipse cx="54" cy="49" rx="4" ry="2.4" fill="#fb7185" opacity="0.62"/>' +
        buildFaceExpression(spMood, 31, 49, 44, 53, 3.3) +
        '</svg>'
      );
    },
    workshop: () => {
      const gId = 'sp-wrk-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#facc15"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="71" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#f59e0b') +
        '<ellipse cx="30" cy="66" rx="6.5" ry="4" fill="#fb923c" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="50" cy="66" rx="6.5" ry="4" fill="#fb923c" stroke="#332b22" stroke-width="2.4"/>' +
        '<circle cx="16" cy="49" r="4.5" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
        '<circle cx="64" cy="49" r="4.5" fill="#fde047" stroke="#332b22" stroke-width="2.4"/>' +
        '<rect x="18" y="25" width="44" height="41" rx="11" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<path d="M22 55 H58 V58 C58 63 54 66 49 66 H31 C26 66 22 63 22 58 Z" fill="#60a5fa" stroke="#332b22" stroke-width="2.2"/>' +
        '<rect x="33" y="57" width="14" height="6" rx="2.5" fill="#93c5fd" stroke="#332b22" stroke-width="1.8"/>' +
        '<circle cx="26" cy="56.5" r="1.8" fill="#fef08a" stroke="#332b22" stroke-width="1.2"/>' +
        '<circle cx="54" cy="56.5" r="1.8" fill="#fef08a" stroke="#332b22" stroke-width="1.2"/>' +
        '<path d="M21 26 C21 13 59 13 59 26 Z" fill="#fb923c" stroke="#332b22" stroke-width="2.6"/>' +
        '<rect x="16" y="23" width="48" height="6" rx="3" fill="#f97316" stroke="#332b22" stroke-width="2.5"/>' +
        '<circle cx="40" cy="18" r="3.5" fill="#fef08a" stroke="#332b22" stroke-width="1.8"/>' +
        '<path d="M28 19 Q34 15 41 16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.7"/>' +
        '<ellipse cx="26" cy="45" rx="3.8" ry="2.3" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="45" rx="3.8" ry="2.3" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 40, 44, 3.2) +
        '</svg>'
      );
    },
    garden: () => {
      const gW = 'sp-garW-' + uid;
      const gB = 'sp-garB-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs>' +
        '<linearGradient id="' + gW + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#c084fc"/></linearGradient>' +
        '<linearGradient id="' + gB + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fce7f3"/><stop offset="100%" stop-color="#f472b6"/></linearGradient>' +
        '</defs>' +
        '<ellipse cx="40" cy="70" rx="18" ry="4" fill="rgba(51,43,34,0.13)"/>' +
        buildSparkles('#f472b6') +
        '<path d="M35 38 C16 14 6 28 14 42 C18 48 28 46 35 44 Z" fill="url(#' + gW + ')" stroke="#332b22" stroke-width="2.5"/>' +
        '<path d="M45 38 C64 14 74 28 66 42 C62 48 52 46 45 44 Z" fill="url(#' + gW + ')" stroke="#332b22" stroke-width="2.5"/>' +
        '<path d="M35 46 C18 46 14 62 24 64 C31 65 35 56 36 50 Z" fill="#f9a8d4" stroke="#332b22" stroke-width="2.4"/>' +
        '<path d="M45 46 C62 46 66 62 56 64 C49 65 45 56 44 50 Z" fill="#f9a8d4" stroke="#332b22" stroke-width="2.4"/>' +
        '<circle cx="19" cy="34" r="3.5" fill="#fef08a" opacity="0.85"/><circle cx="61" cy="34" r="3.5" fill="#fef08a" opacity="0.85"/>' +
        '<circle cx="24" cy="56" r="2.2" fill="#ffffff" opacity="0.8"/><circle cx="56" cy="56" r="2.2" fill="#ffffff" opacity="0.8"/>' +
        '<path d="M34 25 Q29 14 23 16" fill="none" stroke="#332b22" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M46 25 Q51 14 57 16" fill="none" stroke="#332b22" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="23" cy="16" r="3" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
        '<circle cx="57" cy="16" r="3" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
        '<rect x="27" y="23" width="26" height="39" rx="13" fill="url(#' + gB + ')" stroke="#332b22" stroke-width="2.6"/>' +
        '<ellipse cx="32" cy="43" rx="3.2" ry="2" fill="#be185d" opacity="0.45"/>' +
        '<ellipse cx="48" cy="43" rx="3.2" ry="2" fill="#be185d" opacity="0.45"/>' +
        buildFaceExpression(spMood, 34, 46, 39, 44, 2.8) +
        '</svg>'
      );
    },
    valley: () => {
      const gId = 'sp-val-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="71" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#38bdf8') +
        '<path d="M22 44 C10 34 8 46 15 53 C18 55 23 53 24 49 Z" fill="#fde047" stroke="#332b22" stroke-width="2.3"/>' +
        '<path d="M58 44 C70 34 72 46 65 53 C62 55 57 53 56 49 Z" fill="#fde047" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="30" cy="65" rx="6.5" ry="4.2" fill="#93c5fd" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="50" cy="65" rx="6.5" ry="4.2" fill="#93c5fd" stroke="#332b22" stroke-width="2.4"/>' +
        '<polygon points="27,25 22,12 34,21" fill="#fbbf24" stroke="#332b22" stroke-width="2.3" stroke-linejoin="round"/>' +
        '<polygon points="53,25 58,12 46,21" fill="#fbbf24" stroke="#332b22" stroke-width="2.3" stroke-linejoin="round"/>' +
        '<circle cx="40" cy="42" r="21" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<ellipse cx="40" cy="54" rx="12" ry="8" fill="#fefce8" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M33 54 H47 M35 58 H45" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>' +
        '<polygon points="40,24 43.5,29 40,33 36.5,29" fill="#38bdf8" stroke="#332b22" stroke-width="1.6"/>' +
        '<ellipse cx="26" cy="44" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.6"/>' +
        '<ellipse cx="54" cy="44" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.6"/>' +
        buildFaceExpression(spMood, 31, 49, 40, 44, 3.1) +
        '</svg>'
      );
    },
    castle: () => {
      const gId = 'sp-cas-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ede9fe"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="71" rx="21" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#fbbf24') +
        '<path d="M22 40 L12 63 Q40 69 68 63 L58 40 Z" fill="#7c3aed" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M15 61 Q40 67 65 61" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>' +
        '<ellipse cx="31" cy="66" rx="6" ry="3.8" fill="#c4b5fd" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="49" cy="66" rx="6" ry="3.8" fill="#c4b5fd" stroke="#332b22" stroke-width="2.4"/>' +
        '<rect x="19" y="25" width="42" height="40" rx="13" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<polygon points="22,26 26,12 34,20 40,9 46,20 54,12 58,26" fill="#fbbf24" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="27" cy="21" r="2.1" fill="#ef4444" stroke="#332b22" stroke-width="1"/>' +
        '<circle cx="40" cy="19" r="2.6" fill="#38bdf8" stroke="#332b22" stroke-width="1"/>' +
        '<circle cx="53" cy="21" r="2.1" fill="#ef4444" stroke="#332b22" stroke-width="1"/>' +
        '<polygon points="40,54 42,58 46,58 43,60.5 44,64.5 40,62 36,64.5 37,60.5 34,58 38,58" fill="#fde047" stroke="#332b22" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<ellipse cx="26" cy="45" rx="3.8" ry="2.2" fill="#f472b6" opacity="0.65"/>' +
        '<ellipse cx="54" cy="45" rx="3.8" ry="2.2" fill="#f472b6" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 41, 44, 3.1) +
        '</svg>'
      );
    },
    bakery: () => {
      const gId = 'sp-bak-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#f59e0b') +
        '<ellipse cx="15" cy="50" rx="5" ry="3.6" transform="rotate(-22 15 50)" fill="#fde68a" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="65" cy="50" rx="5" ry="3.6" transform="rotate(22 65 50)" fill="#fde68a" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="30" cy="65" rx="6" ry="3.8" fill="#f59e0b" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="50" cy="65" rx="6" ry="3.8" fill="#f59e0b" stroke="#332b22" stroke-width="2.4"/>' +
        '<path d="M16 44 C11 33 17 21 26 24 L29 34 Z" fill="#f59e0b" stroke="#332b22" stroke-width="2.4"/>' +
        '<path d="M64 44 C69 33 63 21 54 24 L51 34 Z" fill="#f59e0b" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="40" cy="46" rx="23" ry="20" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<path d="M29 25 C24 14 35 11 40 16 C45 11 56 14 51 25 Z" fill="#ffffff" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<rect x="28" y="23" width="24" height="4" rx="2" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
        '<path d="M29 57 L40 64 L51 57 Z" fill="#fb7185" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="40" cy="59" r="2.2" fill="#fde047" stroke="#332b22" stroke-width="1.2"/>' +
        '<ellipse cx="26" cy="48" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="48" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 32, 48, 44, 49, 3.1) +
        '</svg>'
      );
    },
    candy: () => {
      const gId = 'sp-can-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff1f2"/><stop offset="100%" stop-color="#fbcfe8"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#f472b6') +
        '<ellipse cx="30" cy="65" rx="6" ry="3.8" fill="#f472b6" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="50" cy="65" rx="6" ry="3.8" fill="#f472b6" stroke="#332b22" stroke-width="2.3"/>' +
        '<circle cx="23" cy="39" r="11" fill="#fce7f3" stroke="#332b22" stroke-width="2.4"/>' +
        '<circle cx="57" cy="39" r="11" fill="#fce7f3" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="15" cy="51" rx="4.8" ry="3.4" transform="rotate(-18 15 51)" fill="#fbcfe8" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="65" cy="51" rx="4.8" ry="3.4" transform="rotate(18 65 51)" fill="#fbcfe8" stroke="#332b22" stroke-width="2.2"/>' +
        '<circle cx="40" cy="46" r="21" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<circle cx="28" cy="34" r="1.7" fill="#38bdf8"/><circle cx="52" cy="34" r="1.7" fill="#facc15"/><circle cx="40" cy="59" r="2" fill="#4ade80"/>' +
        '<path d="M33 21 C33 14 47 14 47 21 C47 27 40 31 40 31 C40 31 33 27 33 21 Z" fill="#f43f5e" stroke="#332b22" stroke-width="2.2"/>' +
        '<circle cx="38" cy="19" r="1.5" fill="#ffffff" opacity="0.85"/>' +
        '<path d="M34 16 L40 12 L46 16" fill="none" stroke="#22c55e" stroke-width="2.4" stroke-linecap="round"/>' +
        '<ellipse cx="27" cy="49" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.68"/>' +
        '<ellipse cx="53" cy="49" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.68"/>' +
        buildFaceExpression(spMood, 32, 48, 45, 50, 3.1) +
        '</svg>'
      );
    },
    bay: () => {
      const gId = 'sp-bay-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#cffafe"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="71" rx="18" ry="4" fill="rgba(51,43,34,0.13)"/>' +
        buildSparkles('#38bdf8') +
        '<path d="M52 34 C63 31 66 43 56 48 C63 50 62 59 53 56 Z" fill="#f9a8d4" stroke="#332b22" stroke-width="2.3" stroke-linejoin="round"/>' +
        '<polygon points="34,21 37,13 41,18 45,13 48,21" fill="#fde047" stroke="#332b22" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M24 38 C22 22 52 22 52 40 C52 54 46 66 36 66 C25 66 23 57 29 53 C34 50 38 56 34 60" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.6" stroke-linecap="round"/>' +
        '<ellipse cx="22" cy="49" rx="4.5" ry="3.2" transform="rotate(24 22 49)" fill="#7dd3fc" stroke="#332b22" stroke-width="2.1"/>' +
        '<circle cx="29" cy="52" r="7" fill="#fffbeb" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="27" cy="50" r="2.2" fill="#ffffff"/>' +
        '<ellipse cx="29" cy="41" rx="3.2" ry="2" fill="#fb7185" opacity="0.6"/>' +
        '<ellipse cx="46" cy="41" rx="3.2" ry="2" fill="#fb7185" opacity="0.6"/>' +
        buildFaceExpression(spMood, 32, 44, 37, 42, 2.7) +
        '</svg>'
      );
    },
    market: () => {
      const gId = 'sp-mkt-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffedd5"/><stop offset="100%" stop-color="#fb923c"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="71" rx="20" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#fb923c') +
        '<ellipse cx="15" cy="50" rx="5" ry="3.6" transform="rotate(-18 15 50)" fill="#fdba74" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="65" cy="50" rx="5" ry="3.6" transform="rotate(18 65 50)" fill="#fdba74" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="30" cy="66" rx="6" ry="3.8" fill="#ea580c" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="50" cy="66" rx="6" ry="3.8" fill="#ea580c" stroke="#332b22" stroke-width="2.4"/>' +
        '<polygon points="21,31 19,15 33,24" fill="#fb923c" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<polygon points="23,28 22,19 30,24" fill="#fbcfe8"/>' +
        '<polygon points="59,31 61,15 47,24" fill="#fb923c" stroke="#332b22" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<polygon points="57,28 58,19 50,24" fill="#fbcfe8"/>' +
        '<rect x="19" y="25" width="42" height="40" rx="16" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<ellipse cx="40" cy="57" rx="13" ry="8" fill="#ffffff"/>' +
        '<path d="M26 53 Q40 58 54 53" fill="none" stroke="#ef4444" stroke-width="3.2" stroke-linecap="round"/>' +
        '<circle cx="40" cy="56" r="3" fill="#fde047" stroke="#332b22" stroke-width="1.5"/>' +
        '<rect x="31" y="16" width="9" height="8" rx="1.5" fill="#60a5fa" stroke="#332b22" stroke-width="2"/>' +
        '<rect x="40" y="16" width="9" height="8" rx="1.5" fill="#fde047" stroke="#332b22" stroke-width="2"/>' +
        '<ellipse cx="26" cy="46" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="46" rx="3.8" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        '<path d="M15 44 L22 44 M15 48 L22 48 M58 44 L65 44 M58 48 L65 48" stroke="#332b22" stroke-width="1.8" stroke-linecap="round"/>' +
        buildFaceExpression(spMood, 31, 49, 41, 46, 3) +
        '</svg>'
      );
    },
    lighthouse: () => {
      const gId = 'sp-lgh-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#bae6fd"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#facc15') +
        '<ellipse cx="32" cy="66" rx="5.5" ry="3.5" fill="#f59e0b" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="48" cy="66" rx="5.5" ry="3.5" fill="#f59e0b" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M21 44 C10 38 9 50 18 55 L25 52 Z" fill="#7dd3fc" stroke="#332b22" stroke-width="2.4"/>' +
        '<path d="M59 44 C70 38 71 50 62 55 L55 52 Z" fill="#7dd3fc" stroke="#332b22" stroke-width="2.4"/>' +
        '<ellipse cx="40" cy="46" rx="20" ry="20" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<path d="M30 27 A10 10 0 0 1 50 27" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M33 27 A7 7 0 0 1 47 27" fill="none" stroke="#facc15" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M36 27 A4 4 0 0 1 44 27" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>' +
        '<polygon points="36,44 44,44 40,50" fill="#f59e0b" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M30 55 L40 61 L50 55" fill="none" stroke="#1e40af" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle cx="40" cy="59" r="3.8" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
        '<ellipse cx="26" cy="46" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="46" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 40, 46, 2.9) +
        '</svg>'
      );
    },
    station: () => {
      const gId = 'sp-sta-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#7dd3fc"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#38bdf8') +
        '<ellipse cx="62" cy="58" rx="8" ry="5" transform="rotate(-18 62 58)" fill="#0284c7" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="15" cy="49" rx="5" ry="3.6" transform="rotate(-20 15 49)" fill="#bae6fd" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="65" cy="49" rx="5" ry="3.6" transform="rotate(20 65 49)" fill="#bae6fd" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="30" cy="65" rx="6" ry="3.8" fill="#0284c7" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="50" cy="65" rx="6" ry="3.8" fill="#0284c7" stroke="#332b22" stroke-width="2.3"/>' +
        '<circle cx="24" cy="28" r="7" fill="#bae6fd" stroke="#332b22" stroke-width="2.3"/><circle cx="24" cy="28" r="3.2" fill="#fbcfe8"/>' +
        '<circle cx="56" cy="28" r="7" fill="#bae6fd" stroke="#332b22" stroke-width="2.3"/><circle cx="56" cy="28" r="3.2" fill="#fbcfe8"/>' +
        '<ellipse cx="40" cy="46" rx="21" ry="20" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<ellipse cx="40" cy="56" rx="13" ry="8" fill="#ffffff"/>' +
        '<polygon points="40,54 35,61 45,61" fill="#ef4444" stroke="#332b22" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<rect x="26" y="16" width="28" height="10" rx="3" fill="#1e40af" stroke="#332b22" stroke-width="2.3"/>' +
        '<rect x="22" y="23" width="36" height="4" rx="2" fill="#fde047" stroke="#332b22" stroke-width="1.8"/>' +
        '<circle cx="40" cy="20" r="2.2" fill="#fde047"/>' +
        '<ellipse cx="26" cy="48" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="48" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 42, 49, 3) +
        '</svg>'
      );
    },
    vault: () => {
      const gId = 'sp-vlt-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#fbbf24') +
        '<ellipse cx="30" cy="65" rx="6" ry="3.8" fill="#b45309" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="50" cy="65" rx="6" ry="3.8" fill="#b45309" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="16" cy="50" rx="6" ry="4" transform="rotate(-15 16 50)" fill="#fed7aa" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="64" cy="50" rx="6" ry="4" transform="rotate(15 64 50)" fill="#fed7aa" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="40" cy="46" rx="21" ry="19" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<ellipse cx="40" cy="57" rx="11" ry="6.5" fill="#fffbeb"/>' +
        '<polygon points="40,54 43,58 40,62 37,58" fill="#38bdf8" stroke="#332b22" stroke-width="1.4"/>' +
        '<path d="M24 27 C24 14 56 14 56 27 Z" fill="#fde047" stroke="#332b22" stroke-width="2.3"/>' +
        '<rect x="21" y="24" width="38" height="4.5" rx="2.2" fill="#f59e0b" stroke="#332b22" stroke-width="2"/>' +
        '<circle cx="40" cy="20" r="4.2" fill="#38bdf8" stroke="#332b22" stroke-width="1.8"/><circle cx="38.8" cy="18.8" r="1.3" fill="#ffffff"/>' +
        '<ellipse cx="40" cy="46" rx="4.5" ry="3" fill="#fb7185" stroke="#332b22" stroke-width="1.6"/>' +
        '<ellipse cx="26" cy="47" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="54" cy="47" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 41, 50, 2.9) +
        '</svg>'
      );
    },
    park: () => {
      const gId = 'sp-prk-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#4ade80') +
        '<circle cx="64" cy="19" r="7.5" fill="#fb7185" stroke="#332b22" stroke-width="2.2"/><circle cx="61.5" cy="16.5" r="2" fill="#ffffff" opacity="0.85"/>' +
        '<line x1="61" y1="26" x2="57" y2="45" stroke="#332b22" stroke-width="1.8"/>' +
        '<ellipse cx="31" cy="66" rx="6" ry="3.6" fill="#fbbf24" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="49" cy="66" rx="6" ry="3.6" fill="#fbbf24" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M21 44 C12 42 12 53 20 55 Z" fill="#60a5fa" stroke="#332b22" stroke-width="2.3"/>' +
        '<path d="M59 44 C68 42 68 53 60 55 Z" fill="#60a5fa" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="40" cy="46" rx="20" ry="20" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<ellipse cx="40" cy="52" rx="13.5" ry="12.5" fill="#ffffff"/>' +
        '<polygon points="36,44 44,44 40,49.5" fill="#fbbf24" stroke="#332b22" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M40 55 L34 52 L34 58 Z M40 55 L46 52 L46 58 Z" fill="#f43f5e" stroke="#332b22" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<ellipse cx="27" cy="46" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="53" cy="46" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 32, 48, 40, 46, 2.9) +
        '</svg>'
      );
    },
    patisserie: () => {
      const gId = 'sp-pat-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#f472b6') +
        '<ellipse cx="18" cy="39" rx="9" ry="5.5" transform="rotate(-22 18 39)" fill="#ffffff" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="62" cy="39" rx="9" ry="5.5" transform="rotate(22 62 39)" fill="#ffffff" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="32" cy="66" rx="5.2" ry="3.4" fill="#b45309" stroke="#332b22" stroke-width="2.2"/>' +
        '<ellipse cx="48" cy="66" rx="5.2" ry="3.4" fill="#b45309" stroke="#332b22" stroke-width="2.2"/>' +
        '<path d="M35 28 Q32 17 26 19 M45 28 Q48 17 54 19" fill="none" stroke="#332b22" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="26" cy="19" r="2.6" fill="#f472b6" stroke="#332b22" stroke-width="1.6"/>' +
        '<circle cx="54" cy="19" r="2.6" fill="#f472b6" stroke="#332b22" stroke-width="1.6"/>' +
        '<ellipse cx="40" cy="46" rx="20" ry="19" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<path d="M21 51 Q30 55 40 51 Q50 55 59 51" fill="none" stroke="#f472b6" stroke-width="4.2" stroke-linecap="round"/>' +
        '<path d="M23 57 H57" stroke="#332b22" stroke-width="2.8" stroke-linecap="round"/>' +
        '<ellipse cx="27" cy="45" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.68"/>' +
        '<ellipse cx="53" cy="45" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.68"/>' +
        buildFaceExpression(spMood, 32, 48, 40, 44, 2.9) +
        '</svg>'
      );
    },
    skycastle: () => {
      const gId = 'sp-sky-' + uid;
      return (
        '<svg viewBox="0 0 80 80">' +
        '<defs><linearGradient id="' + gId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e9d5ff"/></linearGradient></defs>' +
        '<ellipse cx="40" cy="70" rx="19" ry="4.5" fill="rgba(51,43,34,0.14)"/>' +
        buildSparkles('#c084fc') +
        '<ellipse cx="30" cy="65" rx="6" ry="3.8" fill="#fde047" stroke="#332b22" stroke-width="2.3"/>' +
        '<ellipse cx="50" cy="65" rx="6" ry="3.8" fill="#fde047" stroke="#332b22" stroke-width="2.3"/>' +
        '<path d="M20 44 C9 37 10 50 19 54 Z" fill="#fbcfe8" stroke="#332b22" stroke-width="2.3"/>' +
        '<path d="M60 44 C71 37 70 50 61 54 Z" fill="#fbcfe8" stroke="#332b22" stroke-width="2.3"/>' +
        '<polygon points="25,29 22,18 32,24" fill="#f3e8ff" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<polygon points="55,29 58,18 48,24" fill="#f3e8ff" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<polygon points="40,7 35,25 45,25" fill="#fde047" stroke="#332b22" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<line x1="37" y1="18" x2="43" y2="20" stroke="#b45309" stroke-width="1.6"/>' +
        '<ellipse cx="40" cy="46" rx="20" ry="19.5" fill="url(#' + gId + ')" stroke="#332b22" stroke-width="2.8"/>' +
        '<path d="M29 26 Q40 21 51 26" fill="none" stroke="#f472b6" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M32 28 Q40 24 48 28" fill="none" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round"/>' +
        '<polygon points="40,54 41.8,57.5 45.5,58 42.8,60.5 43.5,64 40,62 36.5,64 37.2,60.5 34.5,58 38.2,57.5" fill="#fde047" stroke="#332b22" stroke-width="1.5"/>' +
        '<ellipse cx="27" cy="47" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        '<ellipse cx="53" cy="47" rx="3.5" ry="2.1" fill="#fb7185" opacity="0.65"/>' +
        buildFaceExpression(spMood, 31, 49, 41, 47, 2.9) +
        '</svg>'
      );
    }
  };
  const fn = spriteMap[key] || spriteMap.forest;
  const svg = fn();
  const bondLevel = Number(options && options.bondLevel) || 1;
  if (!isBoss && bondLevel >= 3) {
    const auraGroup =
      '<g class="mqst-lv3-aura">' +
      '<circle cx="40" cy="43" r="34" fill="rgba(254,240,138,0.22)" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="6 4"/>' +
      '<circle cx="40" cy="43" r="29" fill="none" stroke="#fde047" stroke-width="1.6" opacity="0.85"/>' +
      '<polygon points="10,16 11.8,20 16,20.5 12.8,23.2 13.6,27 10,25 6.4,27 7.2,23.2 4,20.5 8.2,20" fill="#fde047" stroke="#b45309" stroke-width="1"/>' +
      '<polygon points="70,16 71.8,20 76,20.5 72.8,23.2 73.6,27 70,25 66.4,27 67.2,23.2 64,20.5 68.2,20" fill="#38bdf8" stroke="#0284c7" stroke-width="1"/>' +
      '</g>';
    return svg.replace('<svg viewBox="0 0 80 80">', '<svg viewBox="0 0 80 80">' + auraGroup);
  }
  return svg;
}

export function getProjectileSvg(boltTheme = 'star') {
  if (boltTheme === 'carrot') {
    return (
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="32" r="27" fill="#fb923c" opacity="0.45"/>' +
      '<path d="M18 14 L25 22 M29 10 L30 20 M14 26 L23 28" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M22 24 Q34 18 42 28 L54 52 Q30 44 22 24 Z" fill="#f97316" stroke="#7c2d12" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<polygon points="48,14 50,19 55,20 51,23 52,28 48,25 44,28 45,23 41,20 46,19" fill="#fde047"/>' +
      '</svg>'
    );
  }
  if (boltTheme === 'petal') {
    return (
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="32" r="27" fill="#f472b6" opacity="0.42"/>' +
      '<circle cx="32" cy="17" r="9" fill="#fbcfe8" stroke="#be185d" stroke-width="2.6"/>' +
      '<circle cx="46" cy="27" r="9" fill="#f9a8d4" stroke="#be185d" stroke-width="2.6"/>' +
      '<circle cx="41" cy="44" r="9" fill="#fbcfe8" stroke="#be185d" stroke-width="2.6"/>' +
      '<circle cx="23" cy="44" r="9" fill="#f9a8d4" stroke="#be185d" stroke-width="2.6"/>' +
      '<circle cx="18" cy="27" r="9" fill="#fbcfe8" stroke="#be185d" stroke-width="2.6"/>' +
      '<circle cx="32" cy="32" r="8" fill="#fde047" stroke="#b45309" stroke-width="2.4"/>' +
      '</svg>'
    );
  }
  if (boltTheme === 'meteor') {
    return (
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="32" r="27" fill="#38bdf8" opacity="0.45"/>' +
      '<path d="M12 48 L30 30 M18 54 L36 36" stroke="#c4b5fd" stroke-width="5" stroke-linecap="round"/>' +
      '<polygon points="37,6 43,21 59,22 46,32 50,48 37,39 24,48 28,32 15,22 31,21" fill="#38bdf8" stroke="#1e3a8a" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<polygon points="37,14 40,24 50,25 42,31 45,41 37,35 29,41 32,31 24,25 34,24" fill="#fef08a"/>' +
      '</svg>'
    );
  }
  if (boltTheme === 'rainbow') {
    return (
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="32" r="27" fill="#a855f7" opacity="0.42"/>' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="#f43f5e" stroke-width="5"/>' +
      '<circle cx="32" cy="32" r="16" fill="none" stroke="#facc15" stroke-width="5"/>' +
      '<circle cx="32" cy="32" r="10" fill="#38bdf8" stroke="#ffffff" stroke-width="2.4"/>' +
      '<polygon points="32,18 35,27 44,28 37,34 39,43 32,38 25,43 27,34 20,28 29,27" fill="#ffffff"/>' +
      '</svg>'
    );
  }
  return (
    '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="32" cy="32" r="27" fill="#fb923c" opacity="0.45"/>' +
    '<polygon points="32,3 39,21 59,22 44,35 49,55 32,44 15,55 20,35 5,22 25,21" fill="#facc15" stroke="#ea580c" stroke-width="4" stroke-linejoin="round"/>' +
    '<polygon points="32,9 37,23 53,24 41,34 45,49 32,40 19,49 23,34 11,24 27,23" fill="#fde047" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>' +
    '<polygon points="32,16 35,26 45,27 37,33 40,42 32,37 24,42 27,33 19,27 29,26" fill="#fffbeb"/>' +
    '</svg>'
  );
}
