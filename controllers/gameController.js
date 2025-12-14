// controllers/gameController.js - Phiên bản IN-MEMORY

const globalState = require('../gameCore').globalState;
const gameCore = require('../gameCore'); 

exports.placeBet = (req, res) => {
    const { betAmount, autoCashoutMultiplier, clientSeed } = req.body; 
    const userId = req.userId; // Lấy từ Middleware

    if (globalState.state !== 'PREPARING') {
        return res.status(400).json({ message: 'Không thể đặt cược lúc này.' });
    }
    
    const user = globalState.users[userId];
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

    if (user.balance < betAmount) {
        return res.status(400).json({ message: 'Số dư không đủ.' });
    }

    // 1. Trừ tiền (In-Memory)
    user.balance -= betAmount;
    user.balance = parseFloat(user.balance.toFixed(2));
    
    // 2. Ghi log (In-Memory)
    globalState.transactionLog.push({ userId, amount: -betAmount, type: 'BET', reason: 'Đặt cược', roundId: globalState.roundId, timestamp: Date.now() });

    // 3. Thêm cược vào vòng chơi hiện tại
    globalState.bets.push({ user_id: userId, bet_amount: betAmount, auto_cashout: autoCashoutMultiplier, client_seed: clientSeed, has_cashed_out: false });

    // Thông báo cập nhật số dư qua Socket.io
    gameCore.notifyUser(userId, 'user_balance_update', { newBalance: user.balance });
    global.io.emit('new_bet_placed', { userId, betAmount });

    return res.json({ message: 'Đặt cược thành công.', newBalance: user.balance });
};

exports.cashout = (req, res) => {
    const userId = req.userId;
    
    if (globalState.state !== 'RUNNING') {
        return res.status(400).json({ message: 'Chỉ có thể rút tiền khi vòng đang chạy.' });
    }

    const userBetIndex = globalState.bets.findIndex(b => b.user_id === userId && !b.has_cashed_out);
    if (userBetIndex === -1) {
        return res.status(400).json({ message: 'Bạn chưa đặt cược hoặc đã rút tiền rồi.' });
    }

    const bet = globalState.bets[userBetIndex];
    const currentMultiplier = globalState.currentMultiplier;
    const payoutAmount = parseFloat((bet.bet_amount * currentMultiplier).toFixed(2));
    const profit = payoutAmount - bet.bet_amount;

    const user = globalState.users[userId];

    // 1. Cộng tiền thắng (In-Memory)
    user.balance += payoutAmount;
    user.balance = parseFloat(user.balance.toFixed(2));

    // 2. Ghi log Giao dịch (In-Memory)
    globalState.transactionLog.push({ userId, amount: profit, type: 'WIN_PAYOUT', reason: `Rút tiền @ ${currentMultiplier.toFixed(2)}x`, roundId: globalState.roundId, timestamp: Date.now() });

    // 3. Đánh dấu đã rút tiền (In-Memory)
    globalState.bets[userBetIndex].has_cashed_out = true;
    globalState.bets[userBetIndex].cashout_multiplier = currentMultiplier;

    global.io.emit('user_cashed_out', { userId, multiplier: currentMultiplier.toFixed(2), winnings: payoutAmount.toFixed(2) });
    gameCore.notifyUser(userId, 'user_balance_update', { newBalance: user.balance });

    return res.json({ message: 'Rút tiền thành công.', multiplier: currentMultiplier.toFixed(2), winnings: payoutAmount.toFixed(2) });
};

exports.getCurrentRoundInfo = (req, res) => {
    // Thông tin cơ bản, không cần xác thực Token
    return res.json({ 
        state: globalState.state,
        server_seed_hash: globalState.serverSeedHash,
        countdown: globalState.countdown,
        current_multiplier: globalState.currentMultiplier
    });
};
