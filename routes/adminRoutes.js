// routes/adminRoutes.js (Đã gửi trước)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyAdminToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.adminLogin);
router.use(verifyAdminToken); // Bảo vệ các tuyến đường sau
router.get('/users', userController.getUsers);
router.post('/adjust_balance/:userId', userController.adjustBalance);
router.post('/grant_tool/:userId', userController.toggleToolAccess);
router.post('/revoke_tool/:userId', userController.toggleToolAccess);
module.exports = router;
