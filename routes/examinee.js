const express = require("express");
const examinee = express.Router();
const ref = require("../services/firestoreDb");

examinee.post("/face-metadata", async (req, res) => {
  try {
    const { face1, face2, face3 } = req.body;
    await ref
      .collection("users")
      .doc(req.user.email)
      .collection("encoded_face")
      .doc("base64encoded")
      .set({
        face_1: face1,
        face_2: face2,
        face_3: face3,
      });
    res.status(200).send({ auth: true, message: "database updated" });
  } catch (error) {
    res.status(500).send({ auth: false, message: "internal error" });
  }
});
examinee.get("/face-metadata", async (req, res) => {
  try {
    const response = await ref
      .collection("users")
      .doc(req.user.email)
      .collection("encoded_face")
      .doc("base64encoded")
      .get();
    if (!response.exists) {
      res
        .status(404)
        .send({ auth: false, message: "face metadata not uploaded" });
    } else {
      res.status(200).send({ auth: true, payload: response.data() });
    }
  } catch (error) {
    res.status(500).send({ auth: false, message: "internal error" });
  }
});

examinee.get("/fetch-questions", async (req, res) => {
  try {
    const cred = req.body.credentials;
    const response = await ref.collection("exams").doc(cred).get();
    if (!response.exists) {
      res.status(404).send({ auth: false, message: "invalid credentials" });
    } else {
      res.status(200).send({ auth: true, payload: response.data() });
    }
  } catch (error) {
    res.status(500).send({ auth: false, message: "internal error" });
  }
});

examinee.post("/submit-answers", async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const cred = req.body.credentials;
    await ref
      .collection("exams")
      .doc(cred)
      .collection("submissions")
      .doc(req.user.email)
      .set({
        timestamp: timestamp,
        exam_ans: req.body.answer,
      });
    res.status(200).send({ auth: true, message: "answers uploaded" });
  } catch (error) {
    res.status(500).send({ auth: false, message: "internal error" });
  }
});

module.exports = examinee;
