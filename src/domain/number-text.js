/**
 * 數字中文轉換、臺灣國小口語讀法與通用數值工具（純函式領域模組）
 */

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
}

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function numberToChinese(n) {
  if (n === 0) return '零';
  const th = Math.floor(n / 1000);
  const remTh = n % 1000;
  const h = Math.floor(remTh / 100);
  const remH = remTh % 100;
  const t = Math.floor(remH / 10);
  const o = remH % 10;
  let s = '';

  if (th > 0) s += CN_DIGITS[th] + '千';

  if (h > 0) {
    s += CN_DIGITS[h] + '百';
  } else if (th > 0 && (t > 0 || o > 0)) {
    s += '零';
  }

  if (t > 0) {
    if (t === 1 && th === 0 && h === 0) {
      s += '十';
    } else {
      s += CN_DIGITS[t] + '十';
    }
  } else if ((th > 0 || h > 0) && o > 0 && !s.endsWith('零')) {
    s += '零';
  }

  if (o > 0) s += CN_DIGITS[o];
  return s;
}

/* 阿拉伯數字轉臺灣國小口語讀法 (支援 0 ~ 99999)
 * 1. 「兩」與「二」：百位、千位、萬位若為 2 讀作「兩」；十位、個位讀作「二」
 * 2. 中間零之補位：連續零壓縮只補一個零，末尾零不補
 * 3. 10 ~ 19 開頭省略「一」，百位之後保留「一」（如 215 讀「兩百一十五」）
 */
export function numberToTaiwanSpokenText(num) {
  const n = Number(num);
  if (Number.isNaN(n)) return String(num);
  if (n === 0) return '零';

  const w = Math.floor(n / 10000);
  const remW = n % 10000;
  const th = Math.floor(remW / 1000);
  const remTh = remW % 1000;
  const h = Math.floor(remTh / 100);
  const remH = remTh % 100;
  const t = Math.floor(remH / 10);
  const o = remH % 10;

  let res = '';

  if (w > 0) {
    res += (w === 2 ? '兩' : CN_DIGITS[w]) + '萬';
  }

  if (th > 0) {
    res += (th === 2 ? '兩' : CN_DIGITS[th]) + '千';
  } else if (w > 0 && (h > 0 || t > 0 || o > 0)) {
    res += '零';
  }

  if (h > 0) {
    res += (h === 2 ? '兩' : CN_DIGITS[h]) + '百';
  } else if ((w > 0 || th > 0) && (t > 0 || o > 0) && !res.endsWith('零')) {
    res += '零';
  }

  if (t > 0) {
    if (t === 1 && w === 0 && th === 0 && h === 0) {
      res += '十';
    } else {
      res += CN_DIGITS[t] + '十';
    }
  } else if ((w > 0 || th > 0 || h > 0) && o > 0 && !res.endsWith('零')) {
    res += '零';
  }

  if (o > 0) {
    res += CN_DIGITS[o];
  }

  return res;
}

export function formatSpokenMathText(text) {
  if (typeof text === 'number') {
    return numberToTaiwanSpokenText(text);
  }
  if (typeof text !== 'string') return text;

  return text
    .replace(/\s*\+\s*/g, ' 加 ')
    .replace(/\s*-\s*/g, ' 減 ')
    .replace(/\s*[×*]\s*/g, ' 乘以 ')
    .replace(/\s*[÷/]\s*/g, ' 除以 ')
    .replace(/\s*=\s*/g, ' 等於 ')
    .replace(/\d+/g, (match) => numberToTaiwanSpokenText(match))
    .replace(/二百/g, '兩百')
    .replace(/二千/g, '兩千')
    .replace(/(^|[^十\d一二三四五六七八九])二萬/g, (m, p1) => p1 + '兩萬');
}
