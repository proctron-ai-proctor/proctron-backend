const nodemailer = require("nodemailer");
const emailAccount = require("../keys/client_secret.json");
const otpGenerator = require("otp-generator");
const { encode } = require("./crypt");

const addMinutesToDate = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};
const OTPMail = async (user) => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expirationTime = addMinutesToDate(new Date(), 10);
  const details = {
    user: user,
    otp: otp,
    expirationTime: expirationTime,
  };
  const { encoded, iv } = await encode(JSON.stringify(details));
  const mailOptions = {
    from: "proctronapp@gmail.com",
    to: user.email,
    subject: "[Proctron] OTP Verification",
    text: `Hey ${user.name}!\n\nCreation of a new account requires further verification because we do not need users to have multiple accounts in our domain. To complete this log in procedure, enter the OTP verification code in your application field.\n\nVerification code: ${otp}\n\nThanks,\nThe Proctron Team`,
  };
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAUTH2",
      user: emailAccount.user,
      pass: emailAccount.pass,
      clientId: emailAccount.web.client_id,
      clientSecret: emailAccount.web.client_secret,
      refreshToken: emailAccount.refresh_token,
    },
  });
  const info = await transporter.sendMail(mailOptions);
  return {
    encoded: encoded,
    iv: iv,
  };
};

module.exports = OTPMail;
