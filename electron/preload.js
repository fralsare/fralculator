const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('fralculator', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
