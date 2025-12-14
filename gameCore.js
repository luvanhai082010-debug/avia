// gameCore.js - Phiên bản IN-MEMORY (ĐÃ SỬA LỖI EXPORTS)

const provablyFair = require('./utils/provablyFair'); 
const bcrypt = require('bcrypt'); 
const io = global.io; 

// Tạo mật khẩu hash mẫu (Mật khẩu Admin mẫu: '123456', User mẫu: 'pass123')
const HASHED_ADMIN_PASS = bcrypt.hashSync('123456', 10); 
const HASHED_USER_PASS = bcrypt.hashSync('pass123', 10); 

// --- IN-MEMORY DATA STORE & GAME STATE ---
let globalState = { 
    state: 'PREPARING', 
    crashMultiplier: 1.00, 
    currentMultiplier: 1.00,
    serverSeed: provablyFair.generateServerSeed(), 
    serverSeedHash: '',
    bets: [], 
    gameTimer: null, 
    countdown: 10,
    roundId: 1,

    // Dữ liệu User (userId là key)
    users: {
        '1001': { userId: '1001', username: 'testuser1', passwordHash: HASHED_USER_PASS, balance: 50000.00, isToolGranted: false },
        '1002': { userId: '1002', username: 'testuser2', passwordHash: HASHED_USER_PASS, balance: 1000.00, isToolGranted: true },
    },
    
    // Dữ liệu Admin (username là key)
    admins: {
        'admin': { adminId: 1, username: 'admin', passwordHash: HASHED_ADMIN_PASS, currentSessionToken: null },
    },

    transactionLog: [], 
};
exports.globalState = globalState;

// Hàm thông báo riêng cho một User (cần thiết cho Controllers)
exports.notifyUser = (userId, event, data) => {
    // Để đơn giản, ta chỉ log ra console, nhưng trong thực tế cần map userId -> socketId
    console.log(`[NOTIFY] User ${userId} received ${event}`);
};


/* ========================= LOGIC GAME LOOP ========================= */

function startNewRound() {
    console.log(`\n--- Bắt đầu Vòng mới: ${globalState.roundId} ---`);
    // 1. Tính toán Seed và Crash Point
    globalState.serverSeed = provablyFair.generateServerSeed();
    globalState.serverSeedHash = provablyFair.hashSeed(globalState.serverSeed);
    globalState.crashMultiplier = provablyFair.calculateCrashPoint(globalState.serverSeed, globalState.roundId);
    
    globalState.state = 'PREPARING';
    globalState.currentMultiplier = 1.00;
    globalState.bets = [];
    globalState.countdown = 10;
    
    io.emit('round_status', { 
        state: 'PREPARING', 
        countdown: globalState.countdown,
        server_seed_hash: globalState.serverSeedHash 
    });

    // 2. Khởi động Countdown (Giai đoạn đặt cược)
    globalState.gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (globalState.countdown > 0) {
        globalState.countdown--;
        io.emit('countdown', globalState.countdown);
    } else {
        clearInterval(globalState.gameTimer);
        runGame();
    }
}

function runGame() {
    globalState.state = 'RUNNING';
    io.emit('round_status', { state: 'RUNNING' });
    globalState.gameTimer = setInterval(updateMultiplier, 100); // Cập nhật 10 lần/giây
}

function handleCrash() {
    clearInterval(globalState.gameTimer);
    globalState.state = 'CRASHED';
    
    console.log(`!!! CRASH tại: ${globalState.crashMultiplier.toFixed(2)}x`);

    // Gửi kết quả vòng chơi và công bố Seed
    io.emit('round_status', { 
        state: 'CRASHED', 
        crashPoint: globalState.crashMultiplier.toFixed(2),
        server_seed: globalState.serverSeed
    });

    // Tăng Round ID và Khởi động vòng mới sau 3 giây
    globalState.roundId++;
    setTimeout(startNewRound, 3000);
}

function updateMultiplier() {
    // Công thức tăng Multiplier
    const timeElapsed = (10 - globalState.countdown);
    const m = Math.floor(Math.pow(Math.E, 0.06 * timeElapsed) * 100) / 100;
    
    globalState.currentMultiplier = m;

    if (globalState.currentMultiplier >= globalState.crashMultiplier) {
        handleCrash();
        return;
    }

    // Gửi Multiplier qua Socket.io
    io.emit('multiplier_update', globalState.currentMultiplier);

    // * Ở đây, bạn sẽ cần thêm logic Auto-Cashout dựa trên globalState.bets
}

/* ========================= HÀM KHỞI TẠO ĐƯỢC EXPORT ========================= */

/**
 * Hàm khởi tạo chính của Game Core
 * Thiết lập Socket.io và bắt đầu vòng chơi đầu tiên
 */
const initializeGame = () => {
    startNewRound(); // Bắt đầu vòng chơi đầu tiên khi server khởi động
    
    global.io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Gửi trạng thái hiện tại cho người dùng mới kết nối
        socket.emit('round_status', { 
            state: globalState.state, 
            countdown: globalState.countdown,
            server_seed_hash: globalState.serverSeedHash 
        });
        
        // * Thêm listeners cho các sự kiện frontend nếu cần (VD: tool_subscribe)
    });
};

// --- XUẤT HÀM: ĐÂY LÀ PHẦN SỬA LỖI CỦA BẠN ---
exports.initializeGame = initializeGame;
