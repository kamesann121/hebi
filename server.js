const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

// 静的ファイルの提供（index.htmlを表示するため）
app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('A snake joined:', socket.id);

    socket.on('join', (data) => {
        players[socket.id] = { 
            id: socket.id, 
            name: data.name, 
            x: Math.random() * 5000, 
            y: Math.random() * 5000, 
            segments: [], 
            length: 25,
            score: 0 
        };
        // 全員に現在のプレイヤーリストを送信
        io.emit('updatePlayers', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            // 他の全員に動いたことを通知
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        console.log('A snake left:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
