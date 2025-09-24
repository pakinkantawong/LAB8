// api-config.js - การตั้งค่า APIs ที่ใช้

module.exports = {
  // 🕒 World Time API (ฟรี)
  timeAPI: 'https://world-time-api3.p.rapidapi.com/ip.txt ',
  timeHost: 'world-time-api3.p.rapidapi.com',
  timeKey: 'c290336db1mshc317feebdc587e2p12175fjsnfca91a88e8a6', // แทนที่ด้วย API key จริง


  // 📊 JSONPlaceholder (ฟรี - สำหรับทดสอบ HTTP requests)
  usersAPI: 'https://jsonplaceholder.typicode.com/users',
  postsAPI: 'https://jsonplaceholder.typicode.com/posts',
  
  // ⚡ WebSocket Echo Test (ฟรี)
  websocketURL: 'wss://echo.websocket.org/',
  
  // 🌤️ OpenWeatherMap (ฟรี - ต้องสมัคร API key)
  // ไปสมัครที่: https://openweathermap.org/api
  weatherAPI: 'https://api.openweathermap.org/data/2.5/weather',
  weatherKey: '9857c718d2d23b557f2d5406a9798898', // แทนที่ด้วย API key จริง
  
  // 📱 จำลอง Agent API endpoints
  mockAgentAPI: {
    status: 'http://localhost:3001/api/agents/status',
    update: 'http://localhost:3001/api/agents/update'
  }
};