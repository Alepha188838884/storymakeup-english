const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// 添加错误日志记录，帮助排查问题
function logError(error) {
  console.error('应用错误:', error);
}

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  logError(error);
});

function createWindow() {
  try {
    // 创建浏览器窗口
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // 禁用安全警告以提高兼容性
        webSecurity: false
      }
    })

    // 添加控制台日志，帮助调试
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`加载失败: ${errorCode} - ${errorDescription}`);
    });

    // 加载应用 - 使用更可靠的路径处理方式
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    } else {
      // 使用app.getAppPath()获取应用根目录
      const appPath = app.getAppPath();
      const indexPath = path.join(appPath, 'dist', 'index.html');
      console.log(`尝试加载: ${indexPath}`);
      mainWindow.loadFile(indexPath);
    }

    // 窗口关闭时触发
    mainWindow.on('closed', function () {
      // 如果你的应用支持多窗口，可以在这里保存窗口引用
    })
  } catch (error) {
    logError(error);
  }
}

// Electron 初始化完成后创建窗口
app.on('ready', createWindow)

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})