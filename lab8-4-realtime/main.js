const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs').promises;
const config = require('./api-config');

let mainWindow;

function createWindow() {
    console.log('🚀 [MAIN] สร้าง Real-time Wallboard...');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'Agent Wallboard - Real-time Dashboard'
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();

    console.log('✅ [MAIN] Wallboard พร้อมแล้ว');
}

// ===== HTTP API FUNCTIONS =====

// 🌐 ฟังก์ชันเรียก HTTP API
function callAPI(url) {
    return new Promise((resolve, reject) => {
        console.log('🌐 [MAIN] เรียก API:', url);

        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('✅ [MAIN] API สำเร็จ');
                    resolve(jsonData);
                } catch (error) {
                    console.error('❌ [MAIN] Parse error:', error);
                    reject(error);
                }
            });

        }).on('error', (error) => {
            console.error('❌ [MAIN] API error:', error);
            reject(error);
        });
    });
}

function fetchTimeWithAPIKey(url) {
    return new Promise((resolve, reject) => {
        console.log('🌐 [MAIN] เรียก API:', url);

        const options = {
            headers: {
                'c290336db1mshc317feebdc587e2p12175fjsnfca91a88e8a6': config.timeKey,  
                'world-time-api3.p.rapidapi.com ': config.timeHost,  
            }
        };

        // Use https.get with the options to include the headers
        https.get(url, options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('✅ [MAIN] API สำเร็จ');
                    resolve(jsonData);
                } catch (error) {
                    console.error('❌ [MAIN] Parse error:', error);
                    reject(error);
                }
            });

        }).on('error', (error) => {
            console.error('❌ [MAIN] API error:', error);
            reject(error);
        });
    });
}

// ===== IPC HANDLERS =====

// 🕒 ดึงเวลาจาก World Time API
ipcMain.handle('get-world-time', async () => {
    try {
        console.log('🕒 [MAIN] ดึงเวลาจาก API...');
        const timeData = await fetchTimeWithAPIKey(config.timeAPI);
        console.log('🕒 [MAIN] API Response:', timeData);

        if (!timeData || !timeData.datetime || !timeData.timezone) {
            throw new Error('API response missing datetime or timezone');
        }

        return {
            success: true,
            datetime: timeData.datetime,
            timezone: timeData.timezone,
            formatted: new Date(timeData.datetime).toLocaleString('th-TH')
        };

    } catch (error) {
        console.error('❌ [MAIN] Time API error:', error);
        // fallback: ใช้เวลาจากเครื่อง
        return {
            success: false,
            error: error.message,
            fallback: new Date().toLocaleString('th-TH'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
});

// 📊 ดึงข้อมูล mock users (จำลอง agents)
ipcMain.handle('get-mock-agents', async () => {
    try {
        console.log('📊 [MAIN] ดึงข้อมูล mock agents...');
        const users = await callAPI(config.usersAPI);
        console.log('📊 [MAIN] Users API Response:', users);

        if (!Array.isArray(users) || users.length === 0) {
            throw new Error('Users API response invalid');
        }

        // แปลง users เป็น agent format
        const agents = users.slice(0, 5).map((user, index) => {
            const statuses = ['Available', 'Busy', 'Break', 'Offline'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            return {
                id: `AG${String(index + 1).padStart(3, '0')}`,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: randomStatus,
                extension: `100${index + 1}`,
                company: user.company?.name || 'Unknown',
                lastUpdate: new Date().toISOString()
            };
        });

        return {
            success: true,
            agents: agents,
            count: agents.length,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [MAIN] Mock agents error:', error);
        // Fallback: อ่าน mock-data.json ถ้ามี
        try {
            const mockData = await fs.readFile('mock-data.json', 'utf8');
            const fallbackData = JSON.parse(mockData);
            return {
                success: true,
                agents: fallbackData.agents || [],
                fallback: true,
                error: error.message
            };
        } catch (fileError) {
            console.error('❌ [MAIN] Fallback file error:', fileError);
            // Fallback: mock agents แบบ hardcoded
            return {
                success: true,
                agents: [
                    { id: 'AG001', name: 'Agent 1', status: 'Available', extension: '1001', company: 'Demo', lastUpdate: new Date().toISOString() },
                    { id: 'AG002', name: 'Agent 2', status: 'Busy', extension: '1002', company: 'Demo', lastUpdate: new Date().toISOString() }
                ],
                fallback: true,
                error: error.message + ' | ' + fileError.message
            };
        }
    }
});

// 🌤️ ดึงข้อมูลสภาพอากาศ (ถ้ามี API key)
ipcMain.handle('get-weather', async () => {
    if (!config.weatherKey || config.weatherKey === '9857c718d2d23b557f2d5406a9798898') {
        return {
            success: false,
            error: 'ไม่ได้ตั้งค่า Weather API key',
            fallback: {
                location: 'Bangkok',
                temperature: '32°C',
                description: 'Sunny',
                humidity: '65%'
            }
        };
    }

    try {
        const weatherURL = `${config.weatherAPI}?q=Bangkok&appid=${config.weatherKey}&units=metric`;
        const weatherData = await callAPI(weatherURL);
        console.log('🌤️ [MAIN] Weather API Response:', weatherData);

        if (!weatherData || !weatherData.main || !weatherData.weather) {
            throw new Error('Weather API response invalid');
        }

        return {
            success: true,
            location: weatherData.name,
            temperature: Math.round(weatherData.main.temp) + '°C',
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity + '%',
            icon: weatherData.weather[0].icon
        };

    } catch (error) {
        console.error('❌ [MAIN] Weather API error:', error);
        // fallback: ข้อมูล hardcoded
        return {
            success: false,
            error: error.message,
            fallback: {
                location: 'Bangkok',
                temperature: '32°C',
                description: 'Data unavailable',
                humidity: 'N/A'
            }
        };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// เพิ่มส่วนนี้ใน main.js

// ===== AGENT STATUS SIMULATOR =====

let agentStatusInterval = null;

// จำลองการเปลี่ยนสถานะ agent แบบสุ่ม
ipcMain.handle('start-agent-simulator', () => {
    console.log('🎭 [MAIN] เริ่ม Agent Status Simulator...');

    if (agentStatusInterval) {
        clearInterval(agentStatusInterval);
    }

    const statuses = ['Available', 'Busy', 'Break'];
    const agentIds = ['AG001', 'AG002', 'AG003'];

    agentStatusInterval = setInterval(() => {
        const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        console.log(`🎭 [SIMULATOR] ${randomAgent} → ${randomStatus}`);

        // ส่งข้อมูลไปยัง renderer
        mainWindow.webContents.send('agent-status-changed', {
            agentId: randomAgent,
            newStatus: randomStatus,
            timestamp: new Date().toISOString(),
            simulated: true
        });

    }, 10000); // ทุก 10 วินาที

    return { success: true, message: 'Agent Simulator เริ่มทำงานแล้ว' };
});

ipcMain.handle('stop-agent-simulator', () => {
    console.log('⏹️ [MAIN] หยุด Agent Status Simulator');

    if (agentStatusInterval) {
        clearInterval(agentStatusInterval);
        agentStatusInterval = null;
    }

    return { success: true, message: 'Agent Simulator หยุดแล้ว' };
});