const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Environment Variables から取得
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI)
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.error("DB connection error:", err));
}

const ScoreSchema = new mongoose.Schema({
    name: String,
    score: Number,
    date: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', ScoreSchema);

let players = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { 
            id: socket.id, 
            name: data.name, 
            x: Math.random() * 5000, 
            y: Math.random() * 5000, 
            segments: [], 
            length: 20,
            score: 0 
        };
        io.emit('updatePlayers', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', async () => {
        if (players[socket.id] && mongoURI) {
            // 切断時にスコアを保存
            await Score.create({ name: players[socket.id].name, score: players[socket.id].score });
        }
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
