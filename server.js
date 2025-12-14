// server.js - Phiên bản IN-MEMORY
require('dotenv').config(); 
const PORT = process.env.PORT || 3000;
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } }); 

global.io = io; // Xuất IO cho gameCore
app.use(express.json());
app.use(express.static('public')); // Phục vụ Frontend (admin.html, index.html)

const gameCore = require('./gameCore'); 
const adminRoutes = require('./routes/adminRoutes');
const gameRoutes = require('./routes/gameRoutes'); 

app.use('/api/admin', adminRoutes);
app.use('/api/game', gameRoutes);

gameCore.initializeGame(); 

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy IN-MEMORY trên cổng ${PORT}`);
});
