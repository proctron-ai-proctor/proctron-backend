const express = require('express')
const auth = require('./routes/auth')
const master = require('./routes/exam')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const bodyParser = require('body-parser')


server.listen(3000)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use("/users", auth)

io.on('connection', socket => {
    const id = socket.handshake.query.email
    socket.join(id)
    const newPeer = new master(socket, id)
})
