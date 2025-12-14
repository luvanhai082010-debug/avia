// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { verifyUserToken } = require('../middlewares/userAuth'); // Cần tạo file này

// Áp dụng Middleware xác thực User cho các tuyến đặt cược
router.use(verifyUserToken); 

router.post('/place_bet', gameController.placeBet);
router.post('/cashout', gameController.cashout);

// Tuyến đường công khai (hoặc chỉ cần kiểm tra Token)
router.get('/info', gameController.getCurrentRoundInfo); // Lấy trạng thái vòng chơi

module.exports = router;
