const express = require("express");
const examiner = express.Router();
const key = require("../keys/client_secret.json");
const { google } = require("googleapis");
const ref = require("../services/firestoreDb");
const crypto = require("crypto");

randomIdentifier = (size = 10) => {
  var identifier = crypto.randomBytes(size).toString("hex").slice(0, size);
  var pat = /([0-9a-z]{3})([0-9a-z]{4})([0-9a-z]{3})/;
  return identifier.replace(pat, "$1-$2-$3");
};

fetchForm = async (formID) => {
  const oauth2Client = new google.auth.OAuth2(
    key.web.client_id,
    key.web.client_secret,
    key.web.redirect_uris[1]
  );
  oauth2Client.setCredentials({ refresh_token: key.refresh_token });
  const forms = google.forms({
    version: "v1",
    auth: oauth2Client,
  });
  return (response = await forms.forms.get({ formId: formID }));
};

// demo form ID
// 1cY_QRq9mlAsvIKaGVojSwWfdNdBjLho5aR5yk0rm8Mo
/* const scope = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/forms.body.readonly'
]
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scope,
    prompt: 'consent'
});
console.log(authUrl);
oauth2Client.getToken('4/0AX4XfWjGAPnghT6D2dYzptkvQhxyxKGjK-8Bl8VLMW4oY9QxQHGdbB_HNrWseIM1b86cXw', (error, token) => {
    if(error) {
        return console.log(error);
    }
    console.log(token);
}) */

examiner.post("/create-credentials", async (req, res) => {
  console.log(req.body);
  try {
    const identifier = randomIdentifier();
    const timestamp = new Date().toISOString();
    const { allotedTime, maxScore, formId } = req.body;
    const response = await fetchForm(formId);
    console.log(response);
    await ref
      .collection("users")
      .doc(req.body.email)
      .collection("exam_ids")
      .doc(identifier)
      .set({
        timestamp: timestamp,
      });
    await ref.collection("exams").doc(identifier).set({
      examiner_id: req.body.email,
      timestamp: timestamp,
      alloted_time: allotedTime,
      max_score: maxScore,
      exam_struct: response.data.items,
    });
    res.status(200).send({
      auth: true,
      message: {
        info: "room created",
        exam_id: identifier,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ auth: false, message: "internal error" });
  }
});

examiner.get("/update-credentials", async (req, res) => {
  try {
    const { credentials, allotedTime, maxScore, formID } = req.body;
    const oldForm = await ref.collection("exams").doc(credentials).get();
    if (!oldForm.exists) {
      res.status(404).send({ auth: false, message: "invalid credentials" });
    } else {
      const response = await fetchForm(formID);
      const timestamp = new Date().toISOString();
      console.log({
        examiner_id: req.body.email,
        timestamp: timestamp,
        alloted_time: allotedTime,
        max_score: maxScore,
        exam_struct: response.data.items,
      });
      await ref.collection("exams").doc(credentials).set({
        examiner_id: req.body.email,
        timestamp: timestamp,
        alloted_time: allotedTime,
        max_score: maxScore,
        exam_struct: response.data.items,
      });
      res.status(200).send({
        auth: true,
        message: {
          info: "room updated",
        },
      });
    }
  } catch (error) {
    res.status(500).send({ auth: false, message: "internal error" });
  }
});
module.exports = examiner;
