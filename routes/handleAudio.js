const express = require("express");
const ref = require("../services/firestoreDb");
const key = require("../keys/jwt-token.json");
const { decode } = require("../services/crypt");
const audio = express.Router();

audio.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const decoded = await decode(
      payload.encoded,
      Buffer.from(payload.iv, "base64")
    );
    console.log(decoded);
    res.status(200).send({ auth: true });
  } catch (error) {
    res.status(401).send({ auth: false });
  }
});
module.exports = audio;
