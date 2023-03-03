const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ["toMain"];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ["fromMainConfig", "fromMainLoadAll", "fromMainSaveSuc", "fromMainSaveFail", "fromMainRefNum", "fromMainRefNumFail", "fromMainWaiting", "fromMainUpdateRepairs", "fromMainDisconnected", "fromMainConnected", "fromMainRemoteVersion", "fromMainUpdateProgress", "fromMainLoadfile", "fromMainLoadSearch", "fromMainLoanerSaved", "fromMainLoanerSaveFail", "fromMainAction"];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
}
);