const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// 微信小程序预览二维码数据
// 这里使用微信小程序的体验版/预览版链接格式
const previewData = {
  appId: 'wxe2cd2e2cd6afde25',
  path: 'pages/index/index',
  version: 'v3.0',
  timestamp: Date.now()
};

// 生成预览链接
const previewUrl = `https://servicewechat.com/${previewData.appId}/${previewData.version}/page-frame.html`;

// 生成二维码
async function generateQR() {
  try {
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    const outputPath = path.join(desktopPath, '温差猜词-v3-真机修复版.png');
    
    await QRCode.toFile(outputPath, previewUrl, {
      width: 400,
      height: 400,
      margin: 2,
      color: {
        dark: '#0D1117',
        light: '#FFFFFF'
      }
    });
    
    console.log('✅ 预览二维码已生成:', outputPath);
    console.log('📱 预览链接:', previewUrl);
    
    // 同时更新项目中的二维码
    const projectQRPath = path.join(__dirname, 'preview-qr.png');
    await QRCode.toFile(projectQRPath, previewUrl, {
      width: 400,
      height: 400,
      margin: 2,
      color: {
        dark: '#0D1117',
        light: '#FFFFFF'
      }
    });
    console.log('✅ 项目二维码已更新:', projectQRPath);
    
  } catch (err) {
    console.error('❌ 生成二维码失败:', err);
    process.exit(1);
  }
}

generateQR();
