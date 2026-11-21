/**
 * 數字積木屋 - Vite 應用程式主入口
 */

// 1. 樣式表（tokens 與 base 最先載入，建立 Hum 系統底座並維持既有單元優先權）
import '../css/tokens.css';
import '../css/base.css';
import '../css/variables.css';
import '../css/blocks.css';
import '../css/learn.css';
import '../css/quiz.css';
import '../css/seq.css';
import '../css/calc.css';
import '../css/calc-quiz.css';
import '../css/mul.css';
import '../css/mul-quest.css';
import '../css/modal.css';

// 2. 第三方函式庫全域橋接（必須在所有應用模組之前求值）
import './vendor.js';

// 3. 依原順序載入既有 IIFE 應用模組
import '../js/core.js';
import '../js/audio.js';
import '../js/utils.js';
import '../js/learn.js';
import '../js/quiz.js';
import '../js/seq.js';
import '../js/seq-quiz.js';
import '../js/calc.js';
import '../js/calc-quiz.js';
import '../js/mul.js';
import '../js/mul-quiz.js';
import '../js/mul-quest.js';
import '../js/diagnostics.js';
import '../js/app.js';
