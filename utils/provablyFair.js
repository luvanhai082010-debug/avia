// utils/provablyFair.js

const crypto = require('crypto');

// Tạo Server Seed bí mật (64 ký tự hex)
exports.generateServerSeed = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Hàm Hash SHA256 (Dùng cho việc công bố Hash trước)
exports.hashSeed = (seed) => {
    return crypto.createHash('sha256').update(seed).digest('hex');
};

/**
 * Tính toán điểm rớt (Crash Point) theo thuật toán Provably Fair
 * Công thức dựa trên một phần của Hash(serverSeed + clientSeed + nonce)
 * @param {string} serverSeed - Seed bí mật của server (công bố sau)
 * @param {number} nonces - Số vòng chơi (tăng dần)
 * @returns {number} Điểm rớt (VD: 1.25, 5.00)
 */
exports.calculateCrashPoint = (serverSeed, nonces = 1) => {
    // Chúng ta chỉ sử dụng Server Seed và Nonce để đơn giản hóa
    const hash = crypto.createHmac('sha256', serverSeed)
                       .update(String(nonces))
                       .digest('hex');

    // Lấy 8 ký tự đầu (32 bit) của Hash làm giá trị ngẫu nhiên
    const hex = hash.substring(0, 8);
    const result = parseInt(hex, 16);

    // Tính toán Multiplier (Ví dụ: 0.99 / (1 - (Số ngẫu nhiên / Max_Value)))
    const max_value = 0xFFFFFFFF; // 4,294,967,295
    
    // Nếu kết quả rất gần Max_Value, coi là 1.00x
    if (result < max_value / 50) return 1.00; 

    // Áp dụng công thức (đảo ngược xác suất)
    const multiplier = 0.99 / (1 - (result / (max_value + 1))); 
    
    // Giới hạn 2 chữ số thập phân
    return Math.floor(multiplier * 100) / 100;
};
