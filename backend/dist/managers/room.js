"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const user_1 = require("./user");
class RoomManager {
    constructor() {
        this.users = new Map();
    }
    onboard(name = "", socketId) {
        const user = new user_1.User(name, socketId);
        this.users.set(socketId, user);
        console.log(this.users);
    }
    deboard(socket) {
        this.users.delete(socket.id);
        console.log(this.users);
    }
    handleChange() {
        console.log("HERRE");
        console.log(this.users);
    }
    sendUsers() {
        return Array.from(this.users.values());
    }
    initHandlers(socket) {
        socket.on('onboard', (name, socketId, func) => { this.onboard(name, socketId); func(); socket.broadcast.emit('receive-user-list', this.sendUsers()); });
        socket.on('receive-user-list', () => {
            socket.emit('receive-user-list', this.sendUsers());
        });
        socket.on('call-request', (data) => {
            var _a;
            console.log(socket.id, ' sending call to ', data.socketId);
            socket.to(data.socketId).emit('incoming-call', (_a = this.users.get(socket.id)) === null || _a === void 0 ? void 0 : _a.getUser());
        });
        // socket.on('')
    }
}
exports.RoomManager = RoomManager;
