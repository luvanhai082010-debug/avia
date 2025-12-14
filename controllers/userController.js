// controllers/userController.js - Logic Quản lý User (Admin) - IN-MEMORY

const globalState = require('../gameCore').globalState;
const gameCore = require('../gameCore'); 

/**
 * Lấy danh sách tất cả người dùng (Dùng cho Admin Dashboard)
 */
exports.getUsers = (req, res) => {
    // Chuyển đối tượng users (key là userId) thành mảng để gửi đi
    const usersArray = Object.values(globalState.users).map(user => ({
        userId: user.userId,
        username: user.username,
        balance: user.balance,
        isToolGranted: user.isToolGranted
    }));
    
    // Sắp xếp theo ID người dùng
    usersArray.sort((a, b) => a.userId - b.userId);

    return res.json(usersArray);
};

/**
 * Điều chỉnh số dư của người dùng (Cấp tiền hoặc Trừ tiền)
 * API: POST /api/admin/adjust_balance/:userId
 */
exports.adjustBalance = (req, res) => {
    const targetUserId = req.params.userId;
    const { amount, reason } = req.body;
    const amountFloat = parseFloat(amount);
    const adminId = req.adminId; // Lấy từ Middleware (đã xác thực)

    const user = globalState.users[targetUserId];
    
    if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    
    if (isNaN(amountFloat) || amountFloat === 0) {
        return res.status(400).json({ message: 'Số tiền điều chỉnh không hợp lệ.' });
    }
    
    // 1. Cập nhật Số dư trực tiếp (In-Memory)
    const oldBalance = user.balance;
    user.balance = parseFloat((user.balance + amountFloat).toFixed(2));

    // 2. Xử lý số dư âm (Tùy chọn: ngăn chặn số dư âm)
    if (user.balance < 0) {
        // Hoàn lại giao dịch và báo lỗi
        user.balance = oldBalance;
        return res.status(400).json({ message: 'Giao dịch thất bại: Số dư không thể âm.' });
    }

    // 3. Ghi Log Giao dịch (In-Memory)
    globalState.transactionLog.push({ 
        userId: targetUserId, 
        amount: amountFloat, 
        type: amountFloat > 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT', 
        reason, 
        adminId, 
        timestamp: Date.now() 
    });

    // 4. Thông báo cho người dùng (qua Socket.io, nếu người đó đang online)
    gameCore.notifyUser(targetUserId, 'user_balance_update', { newBalance: user.balance });

    return res.json({ 
        message: amountFloat > 0 ? 'Cấp tiền thành công.' : 'Trừ tiền thành công.', 
        newBalance: user.balance 
    });
};

/**
 * Cấp hoặc Thu hồi quyền truy cập Tool/Bot
 * API: POST /api/admin/grant_tool/:userId HOẶC /api/admin/revoke_tool/:userId
 */
exports.toggleToolAccess = (req, res) => {
    const targetUserId = req.params.userId;
    // Kiểm tra đường dẫn API để xác định hành động (grant hay revoke)
    const grantStatus = req.originalUrl.includes('grant_tool'); 
    
    const user = globalState.users[targetUserId];
    if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    user.isToolGranted = grantStatus;

    // Thông báo cho người dùng
    gameCore.notifyUser(targetUserId, 'tool_access_changed', { granted: grantStatus });
    
    return res.json({ 
        message: grantStatus ? 'Đã cấp quyền truy cập Tool thành công.' : 'Đã thu hồi quyền truy cập Tool thành công.' 
    });
};
