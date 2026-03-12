/**
 * 温差游戏 - 游戏主逻辑
 */

import { getRandomWord, getHint, getWordCategory, getAllWords } from './words.js';
import { calculateTemperature, getTemperatureDescription, getTemperatureColor, getTemperatureGradient } from './similarity.js';

// 游戏配置
const CONFIG = {
  maxGuesses: {
    normal: 20,
    hard: 10,
    endless: Infinity
  },
  hints: {
    normal: 3,
    hard: 1,
    endless: 5
  }
};

// 游戏状态
class GameState {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.targetWord = '';
    this.guessCount = 0;
    this.guessHistory = [];
    this.gameMode = 'normal';
    this.hintsUsed = 0;
    this.gameStatus = 'menu'; // menu, playing, won, lost
    this.currentHint = '';
    this.initialHints = []; // 初始提示词（2个40-50度的词）
  }
  
  init(mode = 'normal') {
    this.reset();
    this.gameMode = mode;
    this.targetWord = getRandomWord();
    this.gameStatus = 'playing';
    this.currentHint = getHint(this.targetWord);
    
    // 生成2个初始提示词（温度在40-50度之间）
    this.initialHints = this.generateInitialHints();
    
    console.log('[调试] 目标词:', this.targetWord); // 调试用
    return this.targetWord;
  }
  
  // 生成2个温度在40-50度之间的初始提示词
  generateInitialHints() {
    const allWords = getAllWords();
    const hints = [];
    
    // 尝试找到2个温度在40-50度之间的词
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (hints.length < 2 && attempts < maxAttempts) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      if (randomWord === this.targetWord) {
        attempts++;
        continue;
      }
      
      const temp = calculateTemperature(randomWord, this.targetWord);
      
      // 温度在40-50度之间，且不与已选词重复
      if (temp >= 40 && temp <= 50 && !hints.find(h => h.word === randomWord)) {
        hints.push({
          word: randomWord,
          temp: temp,
          color: getTemperatureColor(temp)
        });
      }
      attempts++;
    }
    
    // 如果找不到足够的词，放宽条件再试一次
    if (hints.length < 2) {
      attempts = 0;
      while (hints.length < 2 && attempts < maxAttempts) {
        const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (randomWord === this.targetWord || hints.find(h => h.word === randomWord)) {
          attempts++;
          continue;
        }
        
        const temp = calculateTemperature(randomWord, this.targetWord);
        hints.push({
          word: randomWord,
          temp: temp,
          color: getTemperatureColor(temp)
        });
        attempts++;
      }
    }
    
    return hints;
  }
  
  makeGuess(guessWord) {
    if (this.gameStatus !== 'playing') {
      return { error: '游戏未开始' };
    }
    
    const trimmed = guessWord.trim();
    if (!trimmed) {
      return { error: '请输入词汇' };
    }
    
    if (trimmed.length > 10) {
      return { error: '词汇太长了' };
    }
    
    // 计算温度
    const temp = calculateTemperature(trimmed, this.targetWord);
    this.guessCount++;
    
    const result = {
      word: trimmed,
      temp: temp,
      description: getTemperatureDescription(temp),
      color: getTemperatureColor(temp),
      gradient: getTemperatureGradient(temp),
      isCorrect: trimmed === this.targetWord,
      guessNumber: this.guessCount
    };
    
    this.guessHistory.push(result);
    
    // 检查游戏状态
    if (result.isCorrect) {
      this.gameStatus = 'won';
      result.rating = this.getRating();
    } else if (this.guessCount >= CONFIG.maxGuesses[this.gameMode]) {
      this.gameStatus = 'lost';
      result.answer = this.targetWord;
    }
    
    return result;
  }
  
  useHint() {
    if (this.hintsUsed >= CONFIG.hints[this.gameMode]) {
      return { error: '提示次数已用完' };
    }
    this.hintsUsed++;
    return {
      hint: this.currentHint,
      remaining: CONFIG.hints[this.gameMode] - this.hintsUsed
    };
  }
  
  getRemainingGuesses() {
    const max = CONFIG.maxGuesses[this.gameMode];
    return max === Infinity ? -1 : max - this.guessCount;
  }
  
  getRemainingHints() {
    return CONFIG.hints[this.gameMode] - this.hintsUsed;
  }
  
  getRating() {
    if (this.guessCount <= 3) return '⭐⭐⭐ 天才！';
    if (this.guessCount <= 6) return '⭐⭐ 高手！';
    if (this.guessCount <= 10) return '⭐ 不错！';
    return '💪 坚持就是胜利！';
  }
  
  giveUp() {
    this.gameStatus = 'lost';
    return { answer: this.targetWord };
  }
  
  // 获取排序后的历史（按温度降序，温度高的排在上面）
  getSortedHistory() {
    return [...this.guessHistory].sort((a, b) => b.temp - a.temp);
  }
  
  // 获取所有历史记录（包括初始提示）按温度排序
  getAllHistorySorted() {
    const allItems = [...this.guessHistory];
    // 将初始提示也加入列表（标记为提示）
    this.initialHints.forEach(hint => {
      allItems.push({
        word: hint.word,
        temp: hint.temp,
        color: hint.color,
        isHint: true
      });
    });
    // 按温度降序排列（温度高的在上面）
    return allItems.sort((a, b) => b.temp - a.temp);
  }
}

// 导出游戏状态和配置
export { GameState, CONFIG };