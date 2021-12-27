const express = require('express')
const firebase = require('firebase-admin')
const bcrypt = require('bcrypt')
const serviceAccount = require("../keys/proctron-651a8-firebase-adminsdk-ou3ww-511dca51da.json")
const auth = express.Router()

const firebaseConfig = {
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://proctron-651a8-default-rtdb.firebaseio.com"
};

const ref = firebase.initializeApp(firebaseConfig).firestore()


auth.post('/login', async(req, res) => {
  try {
    const userRef = ref.collection('users').doc(req.body.email)
    const doc = await userRef.get()
    if(!doc.exists)
    {
      res.status(404).send({auth: false, message: "invalid email"})
    }
    else
    {
      const validUser = doc.data()
      if(bcrypt.compareSync(req.body.password, validUser.password))
      {
        res.status(200).send({auth: true, message: {email: validUser.email, name: validUser.name}})
      }
      else
      {
        res.status(401).send({auth: false, message: "incorrect password"})
      }
    }
  } catch(error) {
    res.status(500).send({auth: false, message: "internal error"})
  }
})

auth.post('/register', async (req, res) => {
  try {
    const userRef = ref.collection('users').doc(req.body.email)
    const doc = await userRef.get()
    if(!doc.exists)
    {
      const salt = await bcrypt.genSalt()
      const hashedPassword = await bcrypt.hash(req.body.password, salt)
      const user = {name: req.body.name, email: req.body.email, password: hashedPassword}
      await ref.collection('users').doc(req.body.email).set(user)
      res.status(200).send({auth: true, message: "user created"})
    }
    else
    {
      res.status(409).send({auth: false, message: "email already exists"})
    }
  } catch(error) {
    res.status(500).send({auth: false, message: "internal error"})
  }
})

module.exports = auth;