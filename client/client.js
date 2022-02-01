const wrtc = require('wrtc')
const io = require('socket.io-client')

const client = new wrtc.RTCPeerConnection()

const socket = io.connect('http://localhost:3000', {query: {email: 'slayer@gmail.com'}})
var readyForIce = false
var remoteIceCandidates = []

const clientChannel = client.createDataChannel("clientChannel")

client.onicecandidate = evt => {
    if(evt.candidate)
        socket.emit('exam/credentials', {ice: evt.candidate})
}

client.onnegotiationneeded = async() => {
    try {
        const offer = await client.createOffer()
        await client.setLocalDescription(offer)
        socket.emit('exam/credentials', {sdp: client.localDescription})
    }
    catch(error) {
        console.log(error)
    }

}
drainRemoteIce = () => {
    if(readyForIce) {
        remoteIceCandidates.forEach (async(candidate) => {
            try {
                await client.addIceCandidate(candidate)
            }
            catch(error) {
                console.log(error)
            }
        })
        remoteIceCandidates = []
    }
}

socket.on('credentials', async({sdp, ice}) => {
    try {
        if(sdp) {
            await client.setRemoteDescription(sdp)
            if (sdp.type == 'offer') {
                const ans = await client.createAnswer()
                await client.setLocalDescription(ans)
                socket.emit('exam/credentials', {sdp: client.localDescription})
            }
            readyForIce = true
            drainRemoteIce()
        }
        else if(ice)
        {
            remoteIceCandidates.push(ice)
            drainRemoteIce()
        }
    }
    catch(error) {
        console.log(error)
    }
})
clientChannel.onopen = () => {
    clientChannel.send('Yo')
}
clientChannel.onmessage = evt => {
    console.log(evt.data)
}