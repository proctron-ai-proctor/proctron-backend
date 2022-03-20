const firebase = require('firebase-admin')
const serviceAccount = require('../keys/firebase-keys.json')

const firebaseConfig = {
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://proctronapp-344514.asia-southeast2.firebasedatabase.app'
}

const ref = firebase.initializeApp(firebaseConfig).firestore()

module.exports = ref
