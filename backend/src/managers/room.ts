import { Socket } from "socket.io";
import { User } from "./user";

export class RoomManager {
	users: Map<string, User>;

	constructor() {
		this.users = new Map<string, User>();
	}

	onboard(name: string = "", socketId: string,) {
		const user = new User(name, socketId);
		this.users.set(socketId, user);
		console.log(this.users);
	}

	deboard(socket: Socket) {
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

	initHandlers(socket: Socket) {
		socket.on('onboard', (name, socketId, func) => { this.onboard(name, socketId); func(); socket.broadcast.emit('receive-user-list', this.sendUsers()) });
		socket.on('receive-user-list', () => {
			socket.emit('receive-user-list', this.sendUsers());
		})
		socket.on('call-request', (data) => {
			console.log(socket.id, ' sending call to ', data.socketId);
			socket.to(data.socketId).emit('incoming-call', this.users.get(socket.id)?.getUser());
		})
		socket.on('call-accept', (data) => {
			console.log(socket.id, ' accepted call of ', data.socketId);
			
		})
	}
}