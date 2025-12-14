// middlewares/userAuth.js - Phiên bản IN-MEMORY
const jwt = require('jsonwebtoken');
const globalState = require('../gameCore').globalState;

exports.verifyUserToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token người dùng không tìm thấy.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id; // Giả sử ID người dùng được lưu trong Token

        const user = globalState.users[userId];
        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại.' });
        }
        
        req.userId = userId; // Gán ID người dùng cho Controller
        next(); 

    } catch (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn.' });
    }
};
