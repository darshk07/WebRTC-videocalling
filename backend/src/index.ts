const express = require('express');
const { createServer } = require('http');
import { Request, Response } from "express";
import { Socket, Server } from "socket.io";
import { UserManager } from "./managers/user";

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	}
});

const userManager = new UserManager();

io.on('connection', (socket: Socket) => {
	console.log("Connected : ", socket.id);
	userManager.initHandlers(socket);
	socket.on('disconnect', () => {
		userManager.removeUser(socket.id);
		console.log('User Disconnected : ', socket.id);
	})

})

app.get('/', (req: Request, res: Response) => {
	res.send('Hello World!')
})

server.listen(3000, () => {
	console.log('Server is running on port 3000')
})