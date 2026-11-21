/**
 * 第三方函式庫全域橋接層
 * 於所有既有 IIFE 應用模組之前執行，將 npm 套件掛載至 window 命名空間。
 */
import anime from 'animejs';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { createIcons, icons } from 'lucide';

window.anime = anime;
window.gsap = gsap;
window.confetti = confetti;
window.lucide = {
  createIcons: (options = {}) => createIcons({ icons, ...options }),
  icons,
};
