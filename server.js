const express = require('express')
const auth = require('./routes/auth')
const wrtc = require('wrtc')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const bodyParser = require('body-parser')

const master = new wrtc.RTCPeerConnection()
var readyForIce = false
var remoteIceCandidates = []

server.listen(3000)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use("/users", auth)

io.on('connection', socket => {
    master.onicecandidate = evt => {
        if(evt.candidate)
            socket.emit('credentials', {ice: evt.candidate})
    }
    master.onnegotiationneeded = async() => {
        try {
            const offer = await master.createOffer()
            await master.setLocalDescription(offer)
            socket.emit('credentials', {sdp: master.localDescription})
        }
        catch(error) {
            console.log(error)
        }
    }
    drainRemoteIce = () => {
        if(readyForIce) {
            remoteIceCandidates.forEach (async(candidate) => {
                try {
                    await master.addIceCandidate(candidate)
                }
                catch(error) {
                    console.log(error)
                }
            })
            remoteIceCandidates = []
        }
    }
    socket.on('exam/credentials', async({sdp, ice}) => {
        try {
            if(sdp) {
                await master.setRemoteDescription(sdp)
                if (sdp.type == 'offer') {
                    const ans = await master.createAnswer()
                    await master.setLocalDescription(ans)
                    socket.emit('credentials', {sdp: master.localDescription})
                    readyForIce = true
                    drainRemoteIce()
                }
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
})

master.ondatachannel = evt => {
    masterChannel = evt.channel
    masterChannel.onmessage = evt => {
        console.log(evt.data)
    }
    masterChannel.onopen = () => {
        masterChannel.send('Hi')
    }
    
}