const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWin = null;

function webPrefs() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  };
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    title: 'Fralculator',
    backgroundColor: '#0f1117',
    webPreferences: webPrefs(),
  });
  loadInto(mainWin, {});
}

function loadInto(win, query) {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    const qs = Object.entries(query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    win.loadURL(qs ? `${devUrl}?${qs}` : devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { query });
  }
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
