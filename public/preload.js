const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('api', {
    lin:(msg)=>fs.appendFileSync('/home/trackerR324/log.txt', msg),
    win:(msg)=>fs.appendFileSync('C:/trackerR324/log.txt', msg),
    part: returnParticipants(),
    // Expose notification API to renderer
    showNotification: (title, body, icon) => {
        ipcRenderer.send('show-notification', { title, body, icon });
    }
});