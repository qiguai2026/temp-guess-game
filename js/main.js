// 游戏主入口
import { GameState, CONFIG } from './game.js';
import { getTemperatureColor, getTemperatureGradient, getTemperatureDescription } from './similarity.js';

// 游戏实例
const game = new GameState();

// 画布和上下文
let canvas, ctx;
let screenWidth, screenHeight;
let dpr;

// UI状态
let currentScreen = 'menu';
let inputValue = '';

// 真机兼容：输入状态管理
let isInputActive = false;
let inputCursorVisible = true;
let lastInputTime = 0;
let keyboardHeight = 0;

// 按钮区域
let buttons = [];

// 动画状态
let animationFrame = 0;
let pulseScale = 1;

// 颜色配置 - 柳二龙UI设计 v3.1（清晰版）
const COLORS = {
  background: '#1A1A2E',
  card: '#16213E',
  cardHover: '#1F3A5F',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  accent: '#E94560',
  accentLight: '#FF6B6B',
  accentGlow: 'rgba(233, 69, 96, 0.4)',
  input: '#0F3460',
  inputBorder: '#1F3A5F',
  border: '#1F3A5F',
  success: '#238636',
  warning: '#D29922',
  danger: '#DA3633',
  // 高对比度历史记录颜色
  historyText: '#FFFFFF',
  historyHint: '#A0A0A0',
  divider: 'rgba(255, 255, 255, 0.15)'
};

// 温度颜色映射
function getTempColor(temp) {
  if (temp >= 90) return { main: '#FF2D2D', glow: '#FF6B6B', gradient: ['#FF6B6B', '#FF0000'] };
  if (temp >= 75) return { main: '#FF9500', glow: '#FFB84D', gradient: ['#FFB84D', '#FF9500'] };
  if (temp >= 60) return { main: '#FFD700', glow: '#FFE55C', gradient: ['#FFE55C', '#FFD700'] };
  if (temp >= 45) return { main: '#3FB950', glow: '#7EE787', gradient: ['#7EE787', '#3FB950'] };
  if (temp >= 30) return { main: '#58A6FF', glow: '#79C0FF', gradient: ['#79C0FF', '#58A6FF'] };
  if (temp >= 15) return { main: '#A371F7', glow: '#BC8CFF', gradient: ['#BC8CFF', '#A371F7'] };
  return { main: '#8B949E', glow: '#C9D1D9', gradient: ['#C9D1D9', '#8B949E'] };
}

// 初始化
function init() {
  console.log('[Main] 初始化游戏...');

  // 真机调试：记录系统信息
  const sysInfo = wx.getSystemInfoSync();
  console.log('[Main] 系统信息:', JSON.stringify({
    model: sysInfo.model,
    system: sysInfo.system,
    version: sysInfo.version,
    SDKVersion: sysInfo.SDKVersion,
    platform: sysInfo.platform,
    screenWidth: sysInfo.screenWidth,
    screenHeight: sysInfo.screenHeight,
    windowWidth: sysInfo.windowWidth,
    windowHeight: sysInfo.windowHeight,
    statusBarHeight: sysInfo.statusBarHeight,
    safeArea: sysInfo.safeArea
  }));

  canvas = wx.createCanvas();
  ctx = canvas.getContext('2d');

  screenWidth = sysInfo.windowWidth;
  screenHeight = sysInfo.windowHeight;
  dpr = sysInfo.pixelRatio;

  canvas.width = screenWidth * dpr;
  canvas.height = screenHeight * dpr;
  ctx.scale(dpr, dpr);

  console.log(`[Main] 屏幕尺寸: ${screenWidth}x${screenHeight}, DPR: ${dpr}`);

  // 设置键盘监听
  setupKeyboardInput();

  startAnimationLoop();
  wx.onTouchStart(handleTouchStart);

  renderMenu();
}

// 动画循环
function startAnimationLoop() {
  function animate() {
    animationFrame++;
    pulseScale = 1 + Math.sin(animationFrame * 0.05) * 0.05;

    // 真机适配：光标闪烁动画（每30帧切换一次）
    if (animationFrame % 30 === 0) {
      inputCursorVisible = !inputCursorVisible;
    }

    if (currentScreen === 'playing') {
      // 只重绘动画元素，不清空画布，不重新添加按钮
      renderGame(false);
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// 绘制圆角矩形
function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 绘制发光效果
function drawGlow(ctx, x, y, width, height, radius, color, blur = 10) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

// 绘制胶囊形状
function drawCapsule(ctx, x, y, width, height, color) {
  const radius = height / 2;
  ctx.fillStyle = color;
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

// 渲染主菜单
function renderMenu() {
  console.log('[Main] 渲染主菜单...');
  currentScreen = 'menu';
  buttons = [];
  
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  const sysInfo = wx.getSystemInfoSync();
  const statusBarHeight = sysInfo.statusBarHeight || 20;
  const safeTop = statusBarHeight + 20;
  
  const centerX = screenWidth / 2;
  const startY = safeTop + 60;
  
  drawFloatingIcons(startY);
  
  // 游戏标题
  const titleGradient = ctx.createLinearGradient(centerX - 100, startY - 40, centerX + 100, startY);
  titleGradient.addColorStop(0, '#FF6B6B');
  titleGradient.addColorStop(0.5, '#FFD93D');
  titleGradient.addColorStop(1, '#6BCB77');
  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔥 温差猜词', centerX, startY);
  
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '22px sans-serif';
  ctx.fillText('根据温度提示猜出目标词汇', centerX, startY + 45);
  
  // 模式选择按钮
  const modes = [
    { key: 'normal', label: '普通模式', desc: '20次机会', color: COLORS.success, icon: '🌟' },
    { key: 'hard', label: '困难模式', desc: '10次机会', color: COLORS.warning, icon: '⚡' },
    { key: 'endless', label: '无尽模式', desc: '无限机会', color: COLORS.accent, icon: '♾️' }
  ];
  
  let btnY = startY + 110;
  const btnWidth = Math.min(300, screenWidth - 50);
  const btnHeight = 75;
  
  modes.forEach((mode, index) => {
    const btnX = centerX - btnWidth / 2;
    
    drawGlow(ctx, btnX, btnY, btnWidth, btnHeight, 16, mode.color + '40', 15);
    ctx.fillStyle = COLORS.card;
    drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 16);
    ctx.fill();
    
    ctx.fillStyle = mode.color;
    ctx.fillRect(btnX, btnY + 15, 4, btnHeight - 30);
    
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(mode.icon, btnX + 20, btnY + 48);
    
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(mode.label, btnX + 60, btnY + 38);
    
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '15px sans-serif';
    ctx.fillText(mode.desc, btnX + 60, btnY + 60);
    
    ctx.fillStyle = mode.color;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('→', btnX + btnWidth - 20, btnY + 45);
    
    buttons.push({
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      action: () => startGame(mode.key)
    });
    
    btnY += btnHeight + 18;
  });
  
  // 帮助按钮
  const helpBtnY = btnY + 25;
  const helpBtnWidth = 180;
  const helpBtnX = centerX - helpBtnWidth / 2;
  
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, helpBtnX, helpBtnY, helpBtnWidth, 48, 24);
  ctx.stroke();
  
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📖 游戏说明', centerX, helpBtnY + 32);
  
  buttons.push({
    x: helpBtnX,
    y: helpBtnY,
    width: helpBtnWidth,
    height: 48,
    action: showHelp
  });
  
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '13px sans-serif';
  ctx.fillText('v2.3 柳二龙清晰版', centerX, screenHeight - 25);
  
  console.log('[Main] 主菜单渲染完成，按钮数量:', buttons.length);
}

// 绘制浮动装饰图标（已禁用，保持界面简洁）
function drawFloatingIcons(baseY) {
  // 背景简化，不绘制浮动图标
}

// 键盘输入处理
function setupKeyboardInput() {
  console.log('[Main] 设置键盘输入监听...');

  // 监听键盘输入事件
  wx.onKeyboardInput((res) => {
    console.log('[Main] 键盘输入事件触发:', JSON.stringify(res));
    inputValue = res.value || '';
    lastInputTime = Date.now();
    console.log('[Main] 输入值更新为:', inputValue);
    renderGame(true);
  });

  // 监听键盘确认事件（用户点击完成/确认）
  wx.onKeyboardConfirm((res) => {
    console.log('[Main] 键盘确认事件触发:', JSON.stringify(res));
    inputValue = res.value || inputValue || '';
    isInputActive = false;
    console.log('[Main] 键盘确认，准备提交猜测:', inputValue);
    makeGuess();
  });

  // 监听键盘完成事件（备用）
  wx.onKeyboardComplete((res) => {
    console.log('[Main] 键盘完成事件触发:', JSON.stringify(res));
    inputValue = res.value || inputValue || '';
    isInputActive = false;
  });

  // 监听键盘高度变化（真机适配）
  wx.onKeyboardHeightChange((res) => {
    console.log('[Main] 键盘高度变化:', res.height);
    keyboardHeight = res.height;
    if (res.height === 0) {
      isInputActive = false;
    }
  });
}

// 显示系统键盘 - 真机适配版
function showKeyboard() {
  console.log('[Main] 显示键盘，当前输入值:', inputValue);
  isInputActive = true;
  lastInputTime = Date.now();

  // 真机适配：使用 wx.showKeyboard 并添加错误处理
  wx.showKeyboard({
    defaultValue: inputValue || '',
    maxLength: 10,
    multiple: false,
    confirmHold: false,
    confirmType: 'done',
    success: (res) => {
      console.log('[Main] 键盘显示成功');
    },
    fail: (err) => {
      console.error('[Main] 键盘显示失败:', err);
      // 真机兼容：如果键盘显示失败，立即使用备用方案
      isInputActive = false;
      showModalInput();
    }
  });

  // 真机兼容：添加触摸输入作为备用方案
  // 某些真机可能不支持 showKeyboard，使用触摸事件模拟输入
  renderGame(true);

  // 真机调试：2秒后检查键盘是否真的弹出
  setTimeout(() => {
    if (isInputActive && Date.now() - lastInputTime > 1500) {
      console.log('[Main] 键盘可能未响应，切换到备用输入方案');
      isInputActive = false;
      wx.hideKeyboard();
      showModalInput();
    }
  }, 2000);
}

// 备用输入方案 - 使用 showModal 的 editable
function showModalInput() {
  console.log('[Main] 使用 showModal 备用输入方案');

  wx.showModal({
    title: '输入猜测词汇',
    content: inputValue || '',
    editable: true,
    placeholderText: '请输入词汇（2-10个字）',
    confirmText: '猜测',
    cancelText: '取消',
    success: (res) => {
      console.log('[Main] Modal 输入结果:', res);
      if (res.confirm) {
        const newValue = (res.content || '').trim();
        if (newValue) {
          inputValue = newValue;
          renderGame(true);
          // 延迟执行猜测，确保UI更新
          setTimeout(() => makeGuess(), 100);
        } else {
          wx.showToast({ title: '请输入词汇', icon: 'none' });
        }
      }
      isInputActive = false;
    },
    fail: (err) => {
      console.error('[Main] Modal 输入失败:', err);
      isInputActive = false;
      // 最后的备用方案：使用 prompt
      showPromptInput();
    }
  });
}

// 最后的备用方案 - 使用 prompt
function showPromptInput() {
  console.log('[Main] 使用 prompt 最终备用方案');

  wx.prompt({
    placeholder: '请输入猜测词汇',
    success: (res) => {
      console.log('[Main] Prompt 输入结果:', res);
      if (res.result) {
        inputValue = res.result.trim();
        renderGame(true);
        setTimeout(() => makeGuess(), 100);
      }
    },
    fail: () => {
      wx.showToast({ title: '输入功能不可用，请重试', icon: 'none' });
    }
  });
}

// 开始游戏
function startGame(mode) {
  console.log(`[Main] 开始游戏，模式: ${mode}`);
  game.init(mode);
  currentScreen = 'playing';
  inputValue = '';
  renderGame(true);
}

// 渲染游戏界面
function renderGame(clearCanvas = true) {
  if (clearCanvas) {
    buttons = [];
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, screenWidth, screenHeight);
  }
  
  const centerX = screenWidth / 2;
  const padding = 20;
  
  const sysInfo = wx.getSystemInfoSync();
  const statusBarHeight = sysInfo.statusBarHeight || 20;
  const safeAreaTop = statusBarHeight + 10;
  
  if (clearCanvas) {
    const headerHeight = 65;
    ctx.fillStyle = COLORS.card;
    drawRoundRect(ctx, 0, safeAreaTop, screenWidth, headerHeight, 0);
    ctx.fill();
    
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('← 返回', padding, safeAreaTop + 42);
    buttons.push({
      x: padding,
      y: safeAreaTop + 5,
      width: 80,
      height: 55,
      action: () => renderMenu()
    });
    
    const modeNames = { normal: '普通', hard: '困难', endless: '无尽' };
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(modeNames[game.gameMode] + '模式', centerX, safeAreaTop + 40);
    
    const remaining = game.getRemainingGuesses();
    ctx.textAlign = 'right';
    ctx.fillStyle = remaining < 5 ? COLORS.danger : COLORS.text;
    ctx.font = '18px sans-serif';
    if (remaining === -1) {
      ctx.fillText('∞ 次', screenWidth - padding, safeAreaTop + 40);
    } else {
      ctx.fillText(`${remaining} 次`, screenWidth - padding, safeAreaTop + 40);
    }
  }
  
  const contentTop = safeAreaTop + 85;
  
  // 初始提示词区域 - 柳二龙清晰版：纯文字，22-24px，加粗，无背景
  let hintY = contentTop;
  if (game.initialHints && game.initialHints.length > 0) {
    if (clearCanvas) {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💡 初始提示', centerX, hintY);
    }

    hintY += 28;
    const hintSpacing = 40;
    const totalWidth = game.initialHints.length * 140 + (game.initialHints.length - 1) * hintSpacing;
    let startX = centerX - totalWidth / 2;

    game.initialHints.forEach((hint, index) => {
      const hintX = startX + index * (140 + hintSpacing);
      const tempColor = getTempColor(hint.temp);

      if (clearCanvas) {
        // 纯文字显示，无背景胶囊
        // 温度数值 - 24px 加粗
        ctx.fillStyle = tempColor.main;
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${hint.temp}°`, hintX, hintY);

        // 词汇 - 22px 加粗，白色
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(hint.word, hintX + 55, hintY);
      }
    });
    hintY += 40;
  }
  
  // 温度显示区域 - 放大版
  const ringRadius = 85;
  const ringCenterY = hintY + ringRadius + 30;
  const ringX = centerX;
  const ringY = ringCenterY;
  
  if (clearCanvas) {
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.save();
  ctx.strokeStyle = COLORS.accent + '20';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringRadius + 10 * pulseScale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  
  let inputAreaY = ringY + ringRadius + 50;
  
  if (game.guessHistory.length > 0) {
    const latest = game.guessHistory[game.guessHistory.length - 1];
    const tempColor = getTempColor(latest.temp);
    
    if (clearCanvas) {
      // 安卓/iOS兼容：分段绘制彩虹渐变圆弧（替代createConicGradient）
      const progress = latest.temp / 100;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + progress * Math.PI * 2;
      const segments = 30; // 分段数，确保平滑渐变
      const angleStep = (endAngle - startAngle) / segments;

      ctx.lineWidth = 16;
      ctx.lineCap = 'round';

      for (let i = 0; i < segments; i++) {
        const segStart = startAngle + i * angleStep;
        const segEnd = startAngle + (i + 1) * angleStep;
        const ratio = i / segments;

        // 插值计算当前段的颜色
        const r1 = parseInt(tempColor.gradient[0].slice(1, 3), 16);
        const g1 = parseInt(tempColor.gradient[0].slice(3, 5), 16);
        const b1 = parseInt(tempColor.gradient[0].slice(5, 7), 16);
        const r2 = parseInt(tempColor.gradient[1].slice(1, 3), 16);
        const g2 = parseInt(tempColor.gradient[1].slice(3, 5), 16);
        const b2 = parseInt(tempColor.gradient[1].slice(5, 7), 16);

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, segStart, segEnd);
        ctx.stroke();
      }
      
      ctx.save();
      ctx.shadowColor = tempColor.glow;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = tempColor.main;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ringX, ringY, ringRadius, -Math.PI / 2, -Math.PI / 2 + (latest.temp / 100) * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      ctx.fillStyle = tempColor.main;
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${latest.temp}°`, ringX, ringY + 18);
      
      ctx.fillStyle = COLORS.text;
      ctx.font = '20px sans-serif';
      ctx.fillText(latest.description, centerX, ringY + ringRadius + 35);
      
      const wordWidth = ctx.measureText(latest.word).width + 40;
      const wordX = centerX - wordWidth / 2;
      const wordY = ringY + ringRadius + 50;
      
      drawGlow(ctx, wordX, wordY, wordWidth, 36, 18, tempColor.glow + '50', 10);
      drawCapsule(ctx, wordX, wordY, wordWidth, 36, tempColor.main + '25');
      ctx.strokeStyle = tempColor.main;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(latest.word, centerX, wordY + 25);
      
      inputAreaY = wordY + 55;
    }
  } else {
    if (clearCanvas) {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('--°', ringX, ringY + 16);
      
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '16px sans-serif';
      ctx.fillText('输入词汇开始猜测', centerX, ringY + ringRadius + 35);
      ctx.fillText('温度越高越接近目标', centerX, ringY + ringRadius + 58);
      
      inputAreaY = ringY + ringRadius + 85;
    }
  }
  
  if (clearCanvas) {
    // 输入框和猜测按钮并排
    const inputWidth = screenWidth - padding * 2 - 100;
    const btnWidth = 90;
    const inputBtnY = inputAreaY;

    // 输入框 - 点击弹出键盘（真机适配：添加视觉反馈）
    ctx.fillStyle = isInputActive ? COLORS.cardHover : COLORS.input;
    drawRoundRect(ctx, padding, inputBtnY, inputWidth, 52, 12);
    ctx.fill();

    // 真机适配：输入激活时显示高亮边框
    ctx.strokeStyle = isInputActive ? COLORS.accent : COLORS.inputBorder;
    ctx.lineWidth = isInputActive ? 3 : 2;
    ctx.stroke();

    // 显示输入值或占位符
    ctx.fillStyle = inputValue ? COLORS.text : COLORS.textSecondary;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';

    // 真机适配：显示输入值和光标
    let displayText = inputValue || '点击输入词汇...';
    ctx.fillText(displayText, padding + 15, inputBtnY + 34);

    // 真机适配：输入激活时显示光标
    if (isInputActive && inputCursorVisible) {
      const textWidth = ctx.measureText(inputValue || '').width;
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(padding + 15 + textWidth + 2, inputBtnY + 12, 2, 28);
    }

    buttons.push({
      x: padding,
      y: inputBtnY,
      width: inputWidth,
      height: 52,
      action: showKeyboard
    });
    
    // 猜测按钮（在输入框右侧）
    const guessBtnX = padding + inputWidth + 10;
    drawGlow(ctx, guessBtnX, inputBtnY, btnWidth, 52, 12, COLORS.accentGlow, 10);
    ctx.fillStyle = COLORS.accent;
    drawRoundRect(ctx, guessBtnX, inputBtnY, btnWidth, 52, 12);
    ctx.fill();
    
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('猜测', guessBtnX + btnWidth / 2, inputBtnY + 35);
    
    buttons.push({
      x: guessBtnX,
      y: inputBtnY,
      width: btnWidth,
      height: 52,
      action: makeGuess
    });
    
    // 历史记录区域在输入框下方
    const historyTop = inputBtnY + 70;
    renderHistoryRanking(historyTop);
    
    const bottomSafeHeight = sysInfo.safeArea ? (screenHeight - sysInfo.safeArea.bottom) : 0;
    const bottomPadding = Math.max(20, bottomSafeHeight + 10);
    const bottomY = screenHeight - bottomPadding - 52;
    
    const giveUpBtnWidth = 130;
    const giveUpBtnX = centerX - giveUpBtnWidth / 2;
    
    ctx.fillStyle = COLORS.card;
    drawRoundRect(ctx, giveUpBtnX, bottomY, giveUpBtnWidth, 48, 10);
    ctx.fill();
    
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = COLORS.text;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏳️ 放弃', centerX, bottomY + 31);
    
    buttons.push({
      x: giveUpBtnX,
      y: bottomY,
      width: giveUpBtnWidth,
      height: 48,
      action: giveUp
    });
  }
  
  if (clearCanvas) {
    if (game.gameStatus === 'won') {
      renderGameOver(true);
    } else if (game.gameStatus === 'lost') {
      renderGameOver(false);
    }
  }
}

// 渲染历史记录 - 柳二龙清晰版：无背景，仅分隔线，20px，高对比度
function renderHistoryRanking(startY) {
  const padding = 20;
  const itemHeight = 50; // 紧凑行高
  const maxItems = 5;

  // 只显示用户的猜测，不显示初始提示词
  const allHistory = game.getSortedHistory();

  if (allHistory.length === 0) return;

  // 标题
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏆 历史排名', padding, startY);

  // 表头
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('排名', padding + 25, startY + 26);
  ctx.fillText('词汇', padding + 100, startY + 26);
  ctx.fillText('温度', screenWidth - padding - 50, startY + 26);

  let itemY = startY + 35;

  allHistory.slice(0, maxItems).forEach((item, index) => {
    const tempColor = getTempColor(item.temp);
    const isTop3 = index < 3;

    // 仅分隔线，无背景
    if (index > 0) {
      ctx.strokeStyle = COLORS.divider;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding + 60, itemY - 5);
      ctx.lineTo(screenWidth - padding, itemY - 5);
      ctx.stroke();
    }

    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#A0A0A0', '#A0A0A0'];
    const rankIcons = ['🥇', '🥈', '🥉', '4', '5'];

    // 排名 - 20px
    ctx.fillStyle = rankColors[index];
    ctx.font = isTop3 ? '20px sans-serif' : 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    if (isTop3) {
      ctx.fillText(rankIcons[index], padding + 25, itemY + 22);
    } else {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.fillText(rankIcons[index], padding + 25, itemY + 22);
    }

    // 词汇 - 20px 加粗，高对比度
    ctx.fillStyle = COLORS.historyText;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.word, padding + 70, itemY + 22);

    // 温度 - 20px 加粗，颜色区分
    ctx.fillStyle = tempColor.main;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.temp}°`, screenWidth - padding - 20, itemY + 22);

    itemY += itemHeight;
  });
}

// 显示输入对话框 - 真机备用方案（已合并到 showKeyboard）
function showInputDialog() {
  console.log('[Main] showInputDialog 被调用，直接使用 showKeyboard');
  showKeyboard();
}

// 进行猜测 - 真机适配版
function makeGuess() {
  console.log('[Main] ========== makeGuess 被调用 ==========');
  console.log('[Main] 当前输入值:', inputValue);
  console.log('[Main] 输入激活状态:', isInputActive);
  console.log('[Main] 游戏状态:', game.gameStatus);

  // 隐藏键盘
  wx.hideKeyboard();
  isInputActive = false;

  // 真机兼容：强制从全局状态获取最新输入值
  const currentInput = (inputValue || '').trim();

  console.log('[Main] 处理输入:', currentInput);

  if (!currentInput) {
    console.log('[Main] ❌ 输入值为空，显示提示');
    wx.showToast({ title: '请先输入词汇', icon: 'none' });
    // 真机兼容：重新显示键盘让用户输入
    setTimeout(() => {
      showKeyboard();
    }, 500);
    return;
  }

  console.log('[Main] 调用 game.makeGuess，输入:', currentInput);
  const result = game.makeGuess(currentInput);
  console.log('[Main] 猜测结果:', JSON.stringify(result));

  if (result.error) {
    console.log('[Main] ❌ 猜测出错:', result.error);
    wx.showToast({ title: result.error, icon: 'none' });
    return;
  }

  if (result.isCorrect) {
    console.log('[Main] ✅ 猜对了！');
    wx.vibrateShort({ type: 'heavy' });
  } else {
    console.log('[Main] 猜测温度:', result.temp);
    wx.vibrateShort({ type: 'light' });
  }

  // 清空输入值
  inputValue = '';
  isInputActive = false;
  console.log('[Main] 重新渲染游戏界面');
  renderGame(true);
  console.log('[Main] ========== makeGuess 完成 ==========');
}

// 放弃游戏
function giveUp() {
  wx.showModal({
    title: '确认放弃',
    content: '确定要放弃这局游戏吗？',
    success: (res) => {
      if (res.confirm) {
        game.giveUp();
        renderGameOver(false);
      }
    }
  });
}

// 渲染游戏结束画面
function renderGameOver(isWin) {
  const overlayWidth = screenWidth - 50;
  const overlayHeight = 380;
  const overlayX = 25;
  const overlayY = (screenHeight - overlayHeight) / 2;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  drawGlow(ctx, overlayX, overlayY, overlayWidth, overlayHeight, 20, isWin ? '#3FB95040' : '#DA363340', 20);
  ctx.fillStyle = COLORS.card;
  drawRoundRect(ctx, overlayX, overlayY, overlayWidth, overlayHeight, 20);
  ctx.fill();
  
  const centerX = screenWidth / 2;
  
  const iconScale = 1 + Math.sin(animationFrame * 0.1) * 0.1;
  ctx.save();
  ctx.translate(centerX, overlayY + 70);
  ctx.scale(iconScale, iconScale);
  ctx.textAlign = 'center';
  ctx.font = '70px sans-serif';
  ctx.fillText(isWin ? '🎉' : '😢', 0, 0);
  ctx.restore();
  
  ctx.fillStyle = isWin ? COLORS.success : COLORS.danger;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isWin ? '恭喜你猜中了！' : '游戏结束', centerX, overlayY + 140);
  
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px sans-serif';
  ctx.fillText(`答案: ${game.targetWord}`, centerX, overlayY + 180);
  
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '18px sans-serif';
  ctx.fillText(`共猜测 ${game.guessCount} 次`, centerX, overlayY + 215);
  
  if (isWin) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = '26px sans-serif';
    ctx.fillText(game.getRating(), centerX, overlayY + 255);
  }
  
  const btnY = overlayY + 295;
  drawGlow(ctx, centerX - 110, btnY, 220, 52, 12, COLORS.accentGlow, 15);
  ctx.fillStyle = COLORS.accent;
  drawRoundRect(ctx, centerX - 110, btnY, 220, 52, 12);
  ctx.fill();
  
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('🔄 再来一局', centerX, btnY + 35);
  
  buttons = [{
    x: centerX - 110,
    y: btnY,
    width: 220,
    height: 52,
    action: () => startGame(game.gameMode)
  }];
}

// 显示帮助
function showHelp() {
  wx.showModal({
    title: '📖 游戏说明',
    content: `温差猜词游戏规则：

1. 系统会随机选择一个中文词汇作为目标
2. 游戏开始时会给出2个初始提示词（温度40-50度）
3. 你输入猜测的词汇
4. 系统根据语义相似度给出0-100的温度值
5. 温度越高表示越接近目标
6. 根据温度提示调整猜测策略

祝你游戏愉快！`,
    showCancel: false
  });
}

// 触摸事件处理 - 真机适配版
function handleTouchStart(e) {
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;

  console.log('[Main] 触摸事件:', x, y, '按钮数量:', buttons.length);
  console.log('[Main] 当前屏幕:', currentScreen, '输入值:', inputValue, '输入激活:', isInputActive);

  // 检查是否点击了按钮
  for (const btn of buttons) {
    console.log('[Main] 检查按钮:', btn.x, btn.y, btn.width, btn.height, btn.action ? (btn.action.name || '匿名') : '无动作');
    if (x >= btn.x && x <= btn.x + btn.width &&
        y >= btn.y && y <= btn.y + btn.height) {
      console.log('[Main] 按钮被点击:', btn.action ? (btn.action.name || '匿名函数') : '无动作');
      if (btn.action) {
        btn.action();
      }
      return;
    }
  }

  // 真机兼容：检测输入框区域点击
  if (currentScreen === 'playing') {
    const padding = 20;
    const inputWidth = screenWidth - padding * 2 - 100;
    const inputBtnY = getInputAreaY();

    if (x >= padding && x <= padding + inputWidth &&
        y >= inputBtnY && y <= inputBtnY + 52) {
      // 点击输入框，显示键盘或备用输入
      console.log('[Main] 点击输入框区域');
      showKeyboard();
    }
  }
}

// 获取输入框Y坐标（用于触摸检测）
function getInputAreaY() {
  const sysInfo = wx.getSystemInfoSync();
  const statusBarHeight = sysInfo.statusBarHeight || 20;
  const safeAreaTop = statusBarHeight + 10;
  const contentTop = safeAreaTop + 85;

  let hintY = contentTop;
  if (game.initialHints && game.initialHints.length > 0) {
    hintY += 68;
  }

  const ringRadius = 85;
  const ringCenterY = hintY + ringRadius + 30;
  const ringY = ringCenterY;

  let inputAreaY = ringY + ringRadius + 50;

  if (game.guessHistory.length > 0) {
    const wordY = ringY + ringRadius + 50;
    inputAreaY = wordY + 55;
  } else {
    inputAreaY = ringY + ringRadius + 85;
  }

  return inputAreaY;
}

// 启动游戏
init();
