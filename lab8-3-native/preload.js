
const { contextBridge, ipcRenderer } = require('electron');

console.log('🌉 [PRELOAD] ตั้งค่า Native APIs...');

// --- แก้ไข: รวมทุก nativeAPI ใน object เดียวและ exposeInMainWorld แค่ครั้งเดียว ---
contextBridge.exposeInMainWorld('nativeAPI', {
  // 📁 File Operations
  openFile: () => {
    console.log('📁 [PRELOAD] เปิดไฟล์...');
    return ipcRenderer.invoke('open-file');
  },
  saveFile: (content, fileName) => {
    console.log('💾 [PRELOAD] บันทึกไฟล์...');
    return ipcRenderer.invoke('save-file', { content, fileName });
  },

  // 🔔 Notifications
  showNotification: (title, body, urgent = false) =>
    ipcRenderer.invoke('show-notification', { title, body, urgent }),
  notifyAgentEvent: (agentName, eventType, details = {}) =>
    ipcRenderer.invoke('notify-agent-event', { agentName, eventType, details }),

  // 🖱️ System Tray
  hideToTray: () => ipcRenderer.send('hide-to-tray'),
  showApp: () => ipcRenderer.send('show-app'),

  // รับ event เปลี่ยนสถานะจาก tray
  onStatusChangedFromTray: (callback) => {
    ipcRenderer.on('status-changed-from-tray', (event, data) => {
      callback(data);
    });
  }
});

console.log('✅ [PRELOAD] Native APIs พร้อมใช้งาน');

