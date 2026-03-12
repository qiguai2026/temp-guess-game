/**
 * 温差游戏 - 相似度计算模块
 * 计算两个词汇的"温度"相似度 (0-100)
 */

import { getWordCategory } from './words.js';

/**
 * 计算编辑距离 (Levenshtein Distance)
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * 计算字符串相似度 (基于编辑距离)
 */
function stringSimilarity(str1, str2) {
  if (str1 === str2) return 100;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(str1, str2);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * 计算字符重叠度
 */
function charOverlap(str1, str2) {
  const set1 = new Set(str1);
  const set2 = new Set(str2);
  
  let common = 0;
  for (const char of set1) {
    if (set2.has(char)) common++;
  }
  
  const total = Math.max(set1.size, set2.size);
  return total === 0 ? 0 : Math.round((common / total) * 100);
}

/**
 * 获取部首（简化版）
 */
function getRadical(char) {
  // 常见部首映射（简化版）
  const radicalMap = {
    '木': ['木', '林', '森', '树', '枝', '根', '果', '杏', '桃', '李', '松', '柏', '柳'],
    '水': ['水', '河', '湖', '海', '洋', '江', '波', '浪', '沙', '汽', '汁', '汤', '酒'],
    '火': ['火', '灯', '热', '烈', '烤', '烧', '炒', '烟', '炎', '焰'],
    '金': ['金', '银', '铜', '铁', '钢', '钱', '针', '钟', '铃', '链'],
    '土': ['土', '地', '城', '墙', '壁', '块', '坪', '坡', '坑', '埋'],
    '口': ['口', '吃', '喝', '叫', '喊', '唱', '吹', '咬', '吞'],
    '心': ['心', '思', '想', '念', '忘', '急', '怒', '愁', '恐'],
    '手': ['手', '打', '抓', '拿', '扔', '拍', '推', '拉', '握'],
    '足': ['足', '跑', '跳', '踢', '踏', '踩', '路', '跟', '距'],
    '人': ['人', '你', '他', '她', '们', '作', '住', '位', '依']
  };
  
  for (const [radical, chars] of Object.entries(radicalMap)) {
    if (chars.includes(char)) return radical;
  }
  return null;
}

/**
 * 计算部首相似度
 */
function radicalSimilarity(str1, str2) {
  const radicals1 = new Set();
  const radicals2 = new Set();
  
  for (const char of str1) {
    const r = getRadical(char);
    if (r) radicals1.add(r);
  }
  
  for (const char of str2) {
    const r = getRadical(char);
    if (r) radicals2.add(r);
  }
  
  let common = 0;
  for (const r of radicals1) {
    if (radicals2.has(r)) common++;
  }
  
  const total = Math.max(radicals1.size, radicals2.size);
  return total === 0 ? 0 : Math.round((common / total) * 100);
}

/**
 * 计算词汇的"温度"相似度 (0-100)
 */
function calculateTemperature(guess, target) {
  if (guess === target) return 100;
  
  const cat1 = getWordCategory(guess);
  const cat2 = getWordCategory(target);
  
  // 1. 字符串相似度 (20%)
  const strSim = stringSimilarity(guess, target);
  
  // 2. 字符重叠度 (20%)
  const charSim = charOverlap(guess, target);
  
  // 3. 部首相似度 (10%)
  const radSim = radicalSimilarity(guess, target);
  
  // 4. 类别匹配度 (40%) - 这是最重要的因素
  let catSim = 0;
  if (cat1 && cat2) {
    if (cat1 === cat2) {
      // 同类别给予较高基础分
      catSim = 60 + Math.floor(Math.random() * 20); // 60-80分
    } else {
      // 不同类别但都有分类
      catSim = 15 + Math.floor(Math.random() * 15); // 15-30分
    }
  } else {
    // 至少一个未分类
    catSim = 5 + Math.floor(Math.random() * 15); // 5-20分
  }
  
  // 5. 长度相似度 (10%)
  const lenDiff = Math.abs(guess.length - target.length);
  const lenSim = Math.max(0, 100 - lenDiff * 30);
  
  // 综合计算
  let baseScore = strSim * 0.20 + charSim * 0.20 + radSim * 0.10 + catSim * 0.40 + lenSim * 0.10;
  
  // 添加一些随机性（-5 到 +5）
  const noise = Math.floor((Math.random() - 0.5) * 10);
  
  let finalScore = Math.round(baseScore + noise);
  
  // 确保在合理范围内
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * 根据温度获取描述文字
 */
function getTemperatureDescription(temp) {
  if (temp >= 95) return "🔥 滚烫！非常接近了！";
  if (temp >= 85) return "🌡️ 很热！方向对了！";
  if (temp >= 70) return "☀️ 温暖，在附近徘徊";
  if (temp >= 55) return "🌤️ 有点暖，继续探索";
  if (temp >= 40) return "☁️ 微凉，换个思路";
  if (temp >= 25) return "❄️ 冷，差距有点大";
  if (temp >= 10) return "🧊 冰冷，完全不对";
  return "🥶 极寒，彻底偏离了";
}

/**
 * 获取温度对应的颜色
 */
function getTemperatureColor(temp) {
  if (temp >= 80) return '#FF4444';
  if (temp >= 60) return '#FFAA00';
  if (temp >= 40) return '#44AA44';
  if (temp >= 20) return '#44AAAA';
  return '#4444FF';
}

/**
 * 获取温度条渐变
 */
function getTemperatureGradient(temp) {
  if (temp >= 80) {
    return { start: '#FF6B6B', end: '#FF0000' };
  } else if (temp >= 60) {
    return { start: '#FFD93D', end: '#FF9500' };
  } else if (temp >= 40) {
    return { start: '#6BCB77', end: '#4CAF50' };
  } else if (temp >= 20) {
    return { start: '#4D96FF', end: '#2196F3' };
  } else {
    return { start: '#7B68EE', end: '#5C6BC0' };
  }
}

export {
  calculateTemperature,
  getTemperatureDescription,
  getTemperatureColor,
  getTemperatureGradient,
  stringSimilarity,
  charOverlap,
  levenshteinDistance
};