const express = require('express')
const auth = require('./routes/auth')

const app = express()
const bodyParser = require('body-parser')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use("/users", auth)


app.listen(3000)