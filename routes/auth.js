const express = require('express')
const ref = require('../services/firestoreDb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const verifyMail = require('../services/mailService')
const key = require('../keys/jwt-token.json')
const { decode } = require('../services/crypt')
const auth = express.Router()

const generateToken = email => {
  return jwt.sign(email, key.secret, { expiresIn: '1d' })
}

auth.post('/login', async (req, res) => {
  try {
    const userRef = ref.collection('users').doc(req.body.email)
    const doc = await userRef.get()
    if (!doc.exists) {
      res.status(404).send({ auth: false, message: 'invalid email' })
    } else {
      const validUser = doc.data()
      if (bcrypt.compareSync(req.body.password, validUser.password)) {
        res.status(200).send({
          auth: true,
          message: {
            email: validUser.email,
            name: validUser.name,
            token: generateToken({ email: validUser.email })
          }
        })
      } else {
        res.status(401).send({ auth: false, message: 'incorrect password' })
      }
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ auth: false, message: 'internal error' })
  }
})

auth.post('/register', async (req, res) => {
  try {
    const userRef = ref.collection('users').doc(req.body.email)
    const doc = await userRef.get()
    if (!doc.exists) {
      const salt = await bcrypt.genSalt()
      const hashedPassword = await bcrypt.hash(req.body.password, salt)
      const user = {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      }
      const payload = await verifyMail(user)
      res.status(200).send({
        auth: false,
        message: {
          info: 'email sent',
          payload: JSON.stringify(payload)
        }
      })
    } else {
      res.status(409).send({ auth: false, message: 'email already exists' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ auth: false, message: 'internal error' })
  }
})

auth.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    const payload = JSON.parse(req.body.payload)
    const decoded = await decode(payload.encoded, Buffer.from(payload.iv.data))
    if (!otp) {
      res.status(400).send({ auth: false, message: 'OTP not provided' })
    }
    if (new Date().toISOString() < decoded.expirationTime) {
      if (email == decoded.user.email) {
        if (otp == decoded.otp) {
          await ref
            .collection('users')
            .doc(req.body.email)
            .set(decoded.user)
          res.status(200).send({ auth: true, message: 'user created' })
        } else {
          res.status(400).send({ auth: false, message: 'invalid OTP' })
        }
      } else {
        res.status(400).send({ auth: false, message: 'invalid email' })
      }
    } else {
      res.status(400).send({ auth: false, message: 'OTP expired' })
    }
  } catch (error) {
    res.status(500).send({ auth: false, message: 'internal error' })
  }
})

auth.post('/resend-otp', async (req, res) => {
  try {
    var payload = JSON.parse(req.body.payload)
    const decoded = await decode(payload.encoded, Buffer.from(payload.iv.data))
    payload = await verifyMail(decoded.user)
    res.status(200).send({
      auth: false,
      message: {
        info: 'OTP resend',
        payload: JSON.stringify(payload)
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ auth: false, message: 'internal error' })
  }
})

module.exports = auth
