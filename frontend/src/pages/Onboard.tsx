import { useCallback, useEffect, useState } from 'react'
import socket from "../socket";

function Onboard({
	setIsboarded,
	setCurrUser
}: any) {
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [name, setName] = useState<string | null>(null);

	useEffect(() => {
		setCurrUser({
			name: name,
			socketId: socket.id,
		})
	}, [name, setCurrUser]);

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
		}

		function onDisconnect() {
			setIsConnected(false);
		}
		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
		};
	}, []);

	const onboard = () => {
		socket.emit('onboard', { name: name, socketId: socket.id }, transformerForOnboarding);
	}

	const transformerForOnboarding = useCallback(() => {
		console.log("onboarded successfully")
		setIsboarded(true);
	}, [])

	return (
		<div className="h-screen bg-black text-white">
			{socket.id}
			<form onSubmit={(e) => e.preventDefault()}>
				<input className="text-black" onChange={(e) => { setName(e.target.value) }} />
				<button type="submit" onClick={onboard}>Onboard</button>
			</form>
		</div>
	)
}

export default Onboard
