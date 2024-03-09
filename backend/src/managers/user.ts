import { Socket } from "socket.io";
// import { RoomManager } from "./room";

export interface User {
	name: string;
	socket: Socket;
}

export interface UserObj {
	name: string;
	socketId: string;
}

export class UserManager {
	private users: User[];

	constructor() {
		this.users = [];
	}

	addUser(name: string, socket: Socket) {
		this.users.push({ name, socket });
	}

	removeUser(socketId: string) {
		this.users = this.users.filter((user) => user.socket.id != socketId);
	}

	getUser(socketId: string): User | undefined {
		return this.users.find((user) => user.socket.id == socketId);
	}

	onOffer(data: {
		user: UserObj,
		sdp: string
	}, socket: Socket) {
		let usertemp = this.getUser(data.user.socketId);
		let user = this.getUser(socket.id);
		const payload = {
			name: user?.name,
			socketId: user?.socket.id
		}
		usertemp?.socket.emit('offer', { user: payload, sdp: data.sdp });
	}

	onAnswer(data: {
		user: UserObj,
		sdp: string
	}) {
		console.log("in user ", data.user.name);
		let usertemp = this.getUser(data.user.socketId);
		usertemp?.socket.emit('answer', {
			user: {
				name: usertemp?.name,
				socketId: usertemp?.socket.id
			}, sdp: data.sdp
		});
	}

	iceCandidate(data: {
		user: UserObj,
		iceCandidate: any,
		socket: Socket
	}) {
		let usertemp = this.getUser(data.socket.id);
		usertemp?.socket.emit('ice-candidate', { user: data.user, iceCandidate: data.iceCandidate });
	}

	onboard(user: UserObj, socket: Socket) {
		this.addUser(user.name, socket);
	}

	getUsers() {
		let payload: UserObj[] = [];
		this.users.map((user: User) => {
			payload.push({
				name: user.name,
				socketId: user.socket.id
			})
		})
		return payload;
	}

	sendData(socket: Socket, callback: Function) {
		callback(this.getUsers());
	}


	initHandlers(socket: Socket) {
		socket.on('onboard', (user: UserObj, callback: Function) => {
			this.onboard(user, socket);
			socket.broadcast.emit('new-user', this.getUsers());
			callback();
		});
		socket.on('fetch-data', (callback: Function) => { this.sendData(socket, callback) });
		socket.on('offer', (data) => {
			this.onOffer(data, socket);
		});
		socket.on('answer', (data) => {
			console.log(data);
			let user = this.getUser(data.user.socketId);
			user?.socket.emit('answer', {
				user: data.user, sdp: data.sdp
			});
		});
		socket.on('ice-candidate', (data) => {
			this.iceCandidate({
				user: data.user,
				iceCandidate: data.iceCandidate,
				socket: socket
			})
		});
		socket.on('send-offer', (user: UserObj) => {
			socket.emit('send-offer', user);
		});
	}
}

