const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron');

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true
    }
  });
  screen.getPrimaryDisplay().touchSupport
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');

  ipcMain.on("save-file-prompt", (event) => {
    var filter = [
      { name: 'RPG TouchTable Map', extensions: ['rtmap'] },
      { name: 'RPG TouchTable Map - Embedded Image', extensions: ['rtmape'] },
    ];
    event.returnValue = dialog.showSaveDialogSync(win, {filters: filter, defaultPath:"rpg-map.rtmap"});
  });
  
  ipcMain.on("open-file-prompt", (event) => {
    var filter = [
      { name: 'RPG TouchTable Maps', extensions: ['rtmap', 'rtmape'] },
    ];
    event.returnValue = dialog.showOpenDialogSync(win, {filters: filter, defaultPath:"rpg-map.rtmap"});
  });
}


app.whenReady().then(createWindow);
