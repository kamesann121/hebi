const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = { id: socket.id, name: data.name, segments: [], score: 0 };
    });
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].segments = data.segments;
            players[socket.id].score = data.score;
            socket.broadcast.emit('updatePlayers', players);
        }
    });
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Active on ${PORT}`));
