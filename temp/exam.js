const express = require('express')
const exam = express.Router()
const wrtc = require('wrtc')
const server = new wrtc.RTCPeerConnection()

exam.post('/credentials/local-description', async (req, res) => {
  try {
    await server.setRemoteDescription(req.body)
    const ans = await server.createAnswer()
    await server.setLocalDescription(ans)
    res.status(200).send(server.localDescription)
  } catch (error) {
    console.log(error)
  }
})

server.ondatachannel = evt => {
  serverChannel = evt.channel
  serverChannel.onmessage = evt => {
    console.log(evt.data)
  }
  serverChannel.onopen = () => {
    serverChannel.send('Hi')
  }
}

module.exports = exam
