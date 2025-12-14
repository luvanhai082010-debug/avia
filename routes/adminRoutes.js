// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyAdminToken } = require('../middlewares/authMiddleware');

// 1. Tuyến đường công khai (Đăng nhập)
router.post('/login', authController.adminLogin);

// Áp dụng Middleware xác thực Token cho tất cả các tuyến đường còn lại
router.use(verifyAdminToken); 

// 2. Tuyến đường bảo mật (Quản lý)
router.get('/users', userController.getUsers);
router.post('/adjust_balance/:userId', userController.adjustBalance);
router.post('/grant_tool/:userId', userController.toggleToolAccess);
router.post('/revoke_tool/:userId', userController.toggleToolAccess);

module.exports = router;
