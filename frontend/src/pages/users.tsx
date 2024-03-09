import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import socket from '../socket'

export type User = {
	name: string;
	socketId: string;
}

const User = ({ user, sendCall, setCurrentCall }: { user: User, sendCall: (user: User) => void, setCurrentCall: Dispatch<SetStateAction<User | null>> }) => {
	return (
		<div className="flex justify-between">
			<div>
				{user.name}
			</div>

			<div onClick={() => { sendCall(user); setCurrentCall(prev => user); }} className="mr-4 text-green-100 text-lg hover:cursor-pointer">
				Call
			</div>
		</div>
	)
}

const Users = ({
	currUser
}: {
	currUser: User | null;
}) => {

	const [users, setUsers] = useState<User[]>([]);
	const [currentCall, setCurrentCall] = useState<User | null>(null);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const [localStream, setLocalStream] = useState<any>(null);
	const [remoteStream, setRemoteStream] = useState<any>(null);
	const peerConnection = useRef<any>(null);
	const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
	const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);

	const getLocalMedia = async () => {
		// const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
		navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
			.then((stream) => {
				setLocalStream((prev) => stream);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
					localVideoRef.current.play();
				}
			})
			.catch((err) => {
				console.log(err);
			})
	}

	const transformerFunctionForUserList = useCallback((response: User[]) => {
		setUsers(response);
	}, [])

	const fetchUsers = useCallback(() => {
		socket.emit('fetch-data', transformerFunctionForUserList);
	}, [transformerFunctionForUserList]);

	useEffect(() => {
		fetchUsers();

		async function onSendOffer(user: User) {
			const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
			peerConnection.current = new RTCPeerConnection(configuration);
			console.log("sending offer", peerConnection);
			navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
				.then((stream) => {
					const mediaStream = new MediaStream();
					setLocalStream((prev) => mediaStream);
					mediaStream.addTrack(stream.getAudioTracks()[0]);
					mediaStream.addTrack(stream.getVideoTracks()[0]);
					console.log(mediaStream.getTracks());
					mediaStream?.getTracks().forEach(track => peerConnection.current.addTrack(track, mediaStream));
					if (localVideoRef.current) {
						localVideoRef.current.srcObject = mediaStream;
						localVideoRef.current.play();
					}
				})
				.catch((err) => {
					console.log(err);
				})


			async function handleICECandidate(event) {
				console.log("handleICECandidate", event);
				socket.emit('ice-candidate', {
					user: user,
					iceCandidate: event
				})
			}


			// Set up event handlers for ICE candidates and remote stream
			peerConnection.current.onicecandidate = handleICECandidate;
			// console.log('sending');
			peerConnection.current.onnegotiationneeded = async () => {
				console.log('onnegotiationneeded');
				if (peerConnection.current.isNegotiating) {
					console.log('isNegotiating');
					return;
				}
				peerConnection.current.isNegotiating = true;
				const offer = await peerConnection.current.createOffer();
				await peerConnection.current.setLocalDescription(offer);
				socket.emit('offer', {
					user,
					sdp: offer.sdp
				});
			}

		}

		function onNewUser(data: User[]) {
			transformerFunctionForUserList(data);
		}

		async function onOffer(data: any) {
			const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
			peerConnection.current = new RTCPeerConnection(configuration);
			console.log("offer received", peerConnection);
			await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.then((stream) => {
					const mediaStream = new MediaStream();
					setLocalStream((prev) => mediaStream);
					mediaStream.addTrack(stream.getAudioTracks()[0]);
					mediaStream.addTrack(stream.getVideoTracks()[0]);
					mediaStream?.getTracks().forEach(track => peerConnection.current.addTrack(track, mediaStream));
					if (localVideoRef.current) {
						localVideoRef.current.srcObject = mediaStream;
						localVideoRef.current.play();
					}
				})
				.catch((err) => {
					console.log(err);
				})

			// console.log(data);

			await peerConnection.current.setRemoteDescription(
				{ type: "offer", sdp: data.sdp }
			);

			async function ontrack(event: any) {
				console.log('ontrack receiver', event);
				setRemoteStream(event.streams[0]);
				if (remoteVideoRef.current)
					remoteVideoRef.current.srcObject = event.streams[0];
			}

			async function onIceCandidate(event: any) {
				console.log("onIceCandidate receiver", event);
				socket.emit('ice-candidate', {
					user: data.user,
					iceCandidate: event
				})
			}

			peerConnection.current.track = ontrack;
			peerConnection.current.onicecandidate = onIceCandidate;

			// // Create an answer to the offer
			const answer = await peerConnection.current.createAnswer();
			await peerConnection.current.setLocalDescription(answer);
			// // Send the answer to the signaling server
			socket.emit('answer', { user: data.user, sdp: answer.sdp });

			setTimeout(async () => {
				const track1 = peerConnection.current.getTransceivers()[0].receiver.track
				const track2 = peerConnection.current.getTransceivers()[1].receiver.track
				if (track1.kind === "video") {
					setRemoteAudioTrack(track2)
					setRemoteVideoTrack(track1)
				} else {
					setRemoteAudioTrack(track1)
					setRemoteVideoTrack(track2)
				}
				const stream = new MediaStream();
				stream.addTrack(track1);
				stream.addTrack(track2);
				console.log(stream);
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = stream;
					await remoteVideoRef.current.play();
				}
			}, 5000)
		}

		async function onIceCandidate(data: any) {
			console.log('ice candidate');
			await peerConnection.current.addIceCandidate(data.iceCandidate);
		}

		async function onAnswer(data: any) {
			console.log('answer received');
			await peerConnection.current.setRemoteDescription({
				type: "answer",
				sdp: data.sdp
			})
			if (peerConnection.current.connectionState === "new") {
				console.log(peerConnection.current.getTransceivers());
				const track1 = peerConnection.current.getTransceivers()[0].receiver.track;
				const track2 = peerConnection.current.getTransceivers()[1].receiver.track;
				if (track1.kind === "video") {
					setRemoteAudioTrack(track2)
					setRemoteVideoTrack(track1)
				} else {
					setRemoteAudioTrack(track1)
					setRemoteVideoTrack(track2)
				}
				const stream = new MediaStream();
				stream.addTrack(track1);
				stream.addTrack(track2);
				console.log(stream.getTracks());
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = stream;
					await remoteVideoRef.current.play();
				}
			}
		}

		socket.on('send-offer', onSendOffer);
		socket.on('new-user', onNewUser);
		socket.on('offer', onOffer);
		socket.on('ice-candidate', onIceCandidate);
		socket.on('answer', onAnswer);

		return () => {
			socket.off('new-user');
			socket.off('offer');
			socket.off('ice-candidate');
			socket.off('answer');
			socket.off('send-offer');
		}
	}, [])


	const sendCall = async (user: User) => {
		socket.emit('send-offer', user);
		// async function handleICECandidate(event) {
		// 	socket.emit('ice-candidate', {
		// 		user: user,
		// 		iceCandidate: event
		// 	})
		// }

		// localStream?.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream));
		// // Set up event handlers for ICE candidates and remote stream
		// peerConnection.current.onicecandidate = handleICECandidate;
		// // peerConnection.current.ontrack = handleTrackEvent;
		// // console.log('sending');
		// const offer = await peerConnection.current.createOffer();
		// await peerConnection.current.setLocalDescription(offer);
		// socket.emit('offer', {
		// 	user,
		// 	sdp: offer.sdp
		// });
	}



	const renderUsers = () => {
		return users?.map((user: User, index: number) => {
			if (user.socketId !== socket.id)
				return <User key={index} user={user} sendCall={sendCall}
					setCurrentCall={setCurrentCall}
				/>
		}
		)
	};

	return (
		<>
			<div className="h-screen text-primary bg-gradient-to-b from-[#7c899a] to-[#78808d] p-10 flex gap-4 relative">
				<div className="flex flex-col gap-4 flex-1">
					<div className="text-2xl">Your name: {currUser?.name}</div>

					<div className="text-2xl">Your ID: {socket.id}</div>
					<div className="text-2xl">Users Online</div>
					<div className={`w-[100%] 
					h-full rounded-lg p-2 flex flex-col gap-4 border-2 border-primary`}>
						{renderUsers()}
					</div>
				</div>
				{
					// onCall &&
					<div className="bg-white w-[70%] flex-1 h-full rounded-lg p-2 flex flex-col gap-4 border-2 border-primary">
						<video ref={localVideoRef} autoPlay playsInline controls={false} />
						<video ref={remoteVideoRef} autoPlay playsInline controls={false} />
					</div>
				}
			</div>
		</>
	)
}

export default Users