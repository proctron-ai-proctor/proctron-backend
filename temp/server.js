const express = require('express')
const auth = require('./routes/auth')
const exam = require('./routes/exam')
const app = express()
const server = require('http').createServer(app)
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/users', auth)
app.use('/exam', exam)

server.listen(3000)
