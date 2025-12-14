// middlewares/authMiddleware.js - IN-MEMORY (Đã gửi trước)
const jwt = require('jsonwebtoken');
const globalState = require('../gameCore').globalState;

exports.verifyAdminToken = (req, res, next) => {
    // ... (Logic xác thực Token và kiểm tra currentSessionToken trên globalState.admins)
    // Mã nguồn này đã được cung cấp ở câu trả lời về chuyển đổi sang In-Memory.
};
