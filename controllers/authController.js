// controllers/authController.js

const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
// Import globalState từ gameCore để truy cập dữ liệu In-Memory
const globalState = require('../gameCore').globalState; 

/**
 * Xử lý đăng nhập Admin
 * @param {object} req - Request object (chứa username, password)
 * @param {object} res - Response object
 */
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;
    
    // 1. Kiểm tra Admin trong In-Memory Data Store
    const adminRecord = globalState.admins[username];
    
    if (!adminRecord) {
        return res.status(401).json({ message: 'Tên đăng nhập không đúng.' });
    }

    // 2. So sánh mật khẩu (Mật khẩu mẫu đã được hash là '123456')
    const isPasswordValid = await bcrypt.compare(password, adminRecord.passwordHash); 
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mật khẩu không đúng.' });
    }
    
    // 3. Tạo JWT Token
    // ID được dùng để tìm lại Admin trong Middleware
    const sessionToken = jwt.sign({ id: username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
    
    // 4. Lưu Token vào In-Memory để kiểm tra phiên (Single-Device Login)
    adminRecord.currentSessionToken = sessionToken;

    res.json({ message: 'Đăng nhập Admin thành công.', token: sessionToken });
};

// **********************************************
// * Thêm hàm userLogin tương tự nếu bạn cần API *
// * cho người chơi lấy Token (không có DB)      *
// **********************************************
