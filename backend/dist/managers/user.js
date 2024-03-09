"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(name, socketId) {
        this.name = name;
        this.socketId = socketId;
    }
    getSocketId() {
        return this.socketId;
    }
    getUser() {
        return {
            name: this.name,
            socketId: this.socketId
        };
    }
}
exports.User = User;
