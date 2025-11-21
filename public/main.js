const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    title: 'ConvoHub',
    frame:true,
    icon: path.join(__dirname,'..','assets','logo.ico'),
    
    width: 1200,
    height: 800,

    maxWidth: 1920,
    maxHeight: 1080,
    minWidth: 800,
    minHeight: 600,
    
    backgroundColor:"white",
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecution: true,
      contextIsolation: true,
      preload: path.join(__dirname,'preload.js'),
    }
  });


  // Remove menu options
  win.removeMenu();

  // load the index.html from a url
  win.loadURL(
    true
      ? 'http://localhost:3000'
      : `file://${path.resolve(path.join(__dirname,'..','build','index.html'))}`
  );
  
  // Open the DevTools.
  // win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  
  // Enable notifications
  if (Notification.isSupported()) {
    console.log('Notifications are supported');
  }
});

// Handle notification requests from renderer process
ipcMain.on('show-notification', (event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title || 'ConvoHub',
      body: body || 'New message',
      icon: icon || path.join(__dirname, 'logo192.png')
    });
    
    notification.on('click', () => {
      // Focus the window when notification is clicked
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
        windows[0].focus();
      }
    });
    
    notification.show();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})