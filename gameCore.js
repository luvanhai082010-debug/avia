// gameCore.js - Phiên bản IN-MEMORY
const provablyFair = require('./utils/provablyFair'); 
const bcrypt = require('bcrypt'); 

// Tạo mật khẩu hash mẫu
const HASHED_ADMIN_PASS = bcrypt.hashSync('123456', 10); 
const HASHED_USER_PASS = bcrypt.hashSync('pass123', 10); 

// --- IN-MEMORY DATA STORE ---
let globalState = { 
    state: 'PREPARING', crashMultiplier: 1.00, currentMultiplier: 1.00,
    serverSeed: provablyFair.generateServerSeed(), serverSeedHash: '',
    bets: [], gameTimer: null, countdown: 10, roundId: 1,

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

// ... (Các hàm startNewRound, runGame, updateMultiplier, initializeGame - Giữ nguyên logic)
exports.notifyUser = (userId, event, data) => { /* Logic thông báo Socket.io */ };
// ... (Các hàm này đã được cung cấp ở các câu trả lời trước)
