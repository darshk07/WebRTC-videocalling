import { useCallback, useEffect, useRef, useState } from 'react'
import socket from '../socket'
import IncomingCall from './incomingCall'

type User = {
	name: string;
	socketId: string;
}

const User = ({ user, sendCall }: { user: User, sendCall: (socketId: string) => void }) => {
	return (
		<div className="flex justify-between">
			<div>
				{user.name}
			</div>
			<div onClick={() => { sendCall(user.socketId) }} className="mr-4 text-green-100 text-lg hover:cursor-pointer">
				Call
			</div>
		</div>
	)
}

const Users = () => {

	const [users, setUsers] = useState<User[]>([]);
	const [isIncoming, setIsIncoming] = useState<boolean>(false);
	const [onCall, setOnCall] = useState<boolean>(false);
	const [localStream, setLocalStream] = useState<MediaStream>();
	const [remoteStream, setRemoteStream] = useState<MediaStream>();
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const peerConnection = useRef<any>(null);
	// const videoRef = useRef<HTMLVideoElement>(null);

	const getLocalMedia = async () => {
		// const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setLocalStream((prev) => stream);
				if (localVideoRef.current)
					localVideoRef.current.srcObject = stream;
			})
			.catch((err) => {
				console.log(err);
			})
	}

	const transformerFunctionForUserList = useCallback((response: User[]) => {
		setUsers(response);
	}, [])

	useEffect(() => {
		const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
		peerConnection.current = new RTCPeerConnection(configuration);
		socket.on('offer', async (data) => {
			try {
				setIsIncoming(true);
				setIncomingCall((prev) => data.user);
				// console.log('received call from ', data.sender);
				// Set the received offer as the remote description
				console.log(data);
				await peerConnection.current.setRemoteDescription(data.sdp);

				// Create an answer to the offer
				const answer = await peerConnection.current.createAnswer();
				await peerConnection.current.setLocalDescription(answer);

				// Send the answer to the signaling server
				socket.emit('answer', { userId: data.user.socketId, sdp: answer });
			} catch (error) {
				console.error('Error handling offer:', error);
			}
		})

		socket.on('ice-candidate', async (data) => {
			try {
				console.log(data);
				// Add the received ICE candidate to the peer connection
				await peerConnection.current.addIceCandidate(data.candidate);
			} catch (error) {
				console.error('Error handling ICE candidate:', error);
			}
		});

		socket.on('answer', async (data) => {
			try {
				console.log(data);
				// Set the received answer as the remote description
				await peerConnection.current.setRemoteDescription(data.answer);
			} catch (error) {
				console.error('Error handling answer:', error);
			}
		});

		// socket.on('incoming-call', async (data) => {
		// 	console.log(data);
		// 	setIsIncoming(true);
		// 	setIncomingCall(data.sender);
		// 	console.log('received call from ', data.sender);
		// })

		socket.on('receive-user-list', transformerFunctionForUserList);

		socket.on('call-accepted', (data) => {
			console.log('call accepted', data);
			setOnCall(true);
		})
		socket.on('call-rejected', (data) => {
			console.log('call rejected', data);
		})
		socket.emit('receive-user-list');


		return () => {
			socket.off('incoming-call');
			socket.off('receive-user-list');
			socket.off('call-accepted');
			socket.off('call-rejected');
			// remotePeerConnection?.close();
		}
	}, [transformerFunctionForUserList])

	const sendCall = async (socketId: string) => {
		getLocalMedia();
		setOutgoingCall({ socketId });

		// Add local stream to peer connection
		localStream?.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream));

		// Set up event handlers for ICE candidates and remote stream
		peerConnection.current.onicecandidate = handleICECandidate;
		peerConnection.current.ontrack = handleTrackEvent;
		// console.log('sending');
		const offer = await peerConnection.current.createOffer();
		await peerConnection.current.setLocalDescription(offer);
		// console.log(offer);
		socket.emit('offer', { userId: socketId, sdp: offer });
	}

	const handleTrackEvent = (event: any) => {
		setRemoteStream(event.streams[0]);
		if (remoteVideoRef.current)
			remoteVideoRef.current.srcObject = event.streams[0];
	};

	const handleICECandidate = event => {
		if (event.candidate) {
			// Send the ICE candidate to the other peer via signaling
		}
	};

	const renderUsers = () => {
		return users?.map((user: User, index: number) => {
			if (user.socketId !== socket.id)
				return <User key={index} user={user} sendCall={sendCall} />
		}
		)
	};

	const declineHandler = () => {
		setIsIncoming(false);
		socket.emit('call-rejected', { receiver: socket.id, sender: incomingCall?.socketId });
		setIncomingCall(null);
	}

	const acceptHandler = () => {
		setIsIncoming(false);
		socket.emit('call-accepted', { receiver: socket.id, sender: incomingCall?.socketId })
		setOnCall(true);
	}

	return (
		<>
			<div className="h-screen text-primary bg-gradient-to-b from-[#7c899a] to-[#78808d] p-10 flex gap-4 relative">
				{
					isIncoming ?
						<IncomingCall call={incomingCall} onDecline={() => { declineHandler() }} onAccept={() => { acceptHandler() }} />
						: null
				}
				<div className="flex flex-col gap-4 flex-1">
					<div className="text-2xl">Your ID: {socket.id}</div>
					<div className="text-2xl">Users Online</div>
					<div className={`w-[100%] ${onCall ? 'w-[50%]' : ''} h-full rounded-lg p-2 flex flex-col gap-4 border-2 border-primary`}>
						{renderUsers()}
					</div>
				</div>
				{
					onCall &&
					<div className="bg-black w-[70%] flex-1 h-full rounded-lg p-2 flex flex-col gap-4 border-2 border-primary">
						<video ref={localVideoRef} autoPlay playsInline controls={false} />
						<video ref={remoteVideoRef} autoPlay playsInline controls={false} />
					</div>
				}
			</div>
		</>
	)
}

export default Users