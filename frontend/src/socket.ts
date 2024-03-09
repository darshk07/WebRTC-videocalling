import { io } from 'socket.io-client';

const socket = io('172.16.150.10:3000');

export default socket;