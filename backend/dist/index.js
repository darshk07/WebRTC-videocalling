"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { createServer } = require('http');
const socket_io_1 = require("socket.io");
const room_1 = require("./managers/room");
const app = express();
const server = createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    }
});
const roomManager = new room_1.RoomManager();
io.on('connection', (socket) => {
    console.log("Connected : ", socket.id);
    roomManager.initHandlers(socket);
    socket.on('disconnect', () => {
        roomManager.deboard(socket);
        console.log('User Disconnected : ', socket.id);
        socket.broadcast.emit('receive-user-list', roomManager.sendUsers());
    });
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
