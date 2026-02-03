const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// index.htmlをブラウザに表示するための設定
app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('A snake slithered in:', socket.id);

    // プレイヤーがゲームに参加したとき
    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name,
            segments: [],
            score: 0
        };
        // 全員に現在のプレイヤーリストを即座に同期
        io.emit('updatePlayers', players);
    });

    // プレイヤーが移動したとき
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].segments = data.segments;
            players[socket.id].score = data.score;
            // サーバーの負荷を抑えつつ、全員に位置をブロードキャスト
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    // プレイヤーが死亡したとき（エサをばらまく）
    socket.on('died', (data) => {
        if (data.segments) {
            // 死亡した蛇の節（一部）をエサとして全員の画面に生成させる
            const deadFoods = data.segments.filter((_, i) => i % 5 === 0);
            io.emit('spawnFoods', deadFoods);
        }
        // サーバー上のデータを削除
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });

    // 接続が切れたとき
    socket.on('disconnect', () => {
        console.log('A snake left:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

// Renderのデフォルトポート10000を使用
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`--- SLITHERIN SERVER ACTIVE ON PORT ${PORT} ---`);
});
