const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;
const env = require("../utils/config/config.gmail.env");

const oauth2Client = new OAuth2(
  env.ClientID,
  env.Client_secret,
  env.redirect_url
);

oauth2Client.setCredentials({
  refresh_token: env.refresh_token,
});

async function sendTextEmail(to, subject, body) {
  try {
    // ✅ Get fresh access token
    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: env.emailId,
        clientId: env.ClientID,
        clientSecret: env.Client_secret,
        refreshToken: env.refresh_token,
        accessToken: accessToken?.token, // ✅ important
      },
    });

    const mailOptions = {
      from: `"EcoLoop" <${env.emailId}>`,
      to,
      subject,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message, error);
    throw error;
  }
}

module.exports.sendTextEmail = sendTextEmail;
