const express = require('express')
const ref = require('../services/firestoreDb')
const crypto = require('crypto')
const cred = express.Router()

randomIdentifier = (size = 10) => {
  var identifier = crypto
    .randomBytes(size)
    .toString('hex')
    .slice(0, size)
  var pat = /([0-9a-z]{3})([0-9a-z]{4})([0-9a-z]{3})/
  return identifier.replace(pat, '$1-$2-$3')
}

cred.post('/create-credentials', async (req, res) => {
  try {
    const identifier = randomIdentifier()
    const timestamp = new Date().toISOString()
    const { allotedTime, maxScore } = req.body
    await ref
      .collection('users')
      .doc(req.user.email)
      .collection('exam_ids')
      .doc(identifier)
      .set({
        timestamp: timestamp
      })
    await ref
      .collection('exams')
      .doc(identifier)
      .set({
        creator_id: req.user.email,
        timestamp: timestamp,
        alloted_time: allotedTime,
        max_score: maxScore
      })
    res.status(200).send({
      auth: true,
      message: {
        info: 'room created',
        exam_id: identifier
      }
    })
  } catch (error) {
    res.status(500).send({ auth: false, message: 'internal error' })
  }
})

module.exports = cred
