import React from 'react'

const IncomingCall = ({
	call,
	onDecline,
	onAccept
}) => {
	return (
		<div className="flex justify-center items-center absolute top-4 left-[calc(50%_-_100px)]">
			<div className="w-[200px] bg-white text-black p-4 rounded-lg shadow-lg flex flex-col items-center gap-4">
				<div className="text-2xl font-bold">Incoming Call</div>
				<div className="text-xl font-bold">{call.name}</div>
				<div className="flex justify-center items-center gap-2">
					<button onClick={onDecline} className="bg-red-500 p-2 rounded-full text-white">Reject</button>
					<button onClick={onAccept} className="bg-green-500 p-2 rounded-full text-white">Accept</button>
				</div>
			</div>
		</div>
	)
}

export default IncomingCall