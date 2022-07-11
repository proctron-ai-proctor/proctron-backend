const express = require("express");
const path = require("path");
const pyBackend = express.Router();
const multer = require("multer");
const fs = require("fs");
const { decode } = require("../services/crypt");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads");
	},
	filename: (req, file, cb) => {
		const { originalname } = file;
		if (!fs.existsSync(`uploads/${req.body.examId}`))
			fs.mkdirSync(`uploads/${req.body.examId}`);
		if (!fs.existsSync(`uploads/${req.body.examId}/${req.body.email}`))
			fs.mkdirSync(`uploads/${req.body.examId}/${req.body.email}`);

		cb(null, `${req.body.examId}/${req.body.email}/${originalname}`);
	},
});

const upload = multer({ storage });

pyBackend.post(
	"/notify-result-video",
	upload.single("outputFile"),
	async (req, res) => {
		console.log(req.body);
		return res.end();
	}
);

pyBackend.post("/notify-result-audio", async (req, res) => {
	try {
		const payload = req.body;
		const decoded = await decode(
			payload.encoded,
			Buffer.from(payload.iv, "base64")
		);
		console.log(decoded);

		if (!fs.existsSync(`uploads/${req.body.examId}`))
			fs.mkdirSync(`uploads/${req.body.examId}`);
		if (!fs.existsSync(`uploads/${req.body.examId}/${req.body.email}`))
			fs.mkdirSync(`uploads/${req.body.examId}/${req.body.email}`);

		fs.writeFileSync(
			`uploads/${req.body.examId}/${req.body.email}/transcript.json`,
			JSON.stringify(decoded, null, 4)
		);
		res.status(200).send({ auth: true });
	} catch (error) {
		res.status(401).send({ auth: false });
	}
});

module.exports = pyBackend;
