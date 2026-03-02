const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

// Use environment variables (set in Vercel/host or in .env locally)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URL = process.env.GMAIL_REDIRECT_URL;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_EMAIL = process.env.GMAIL_EMAIL;

const oauth2Client = new OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URL
);

oauth2Client.setCredentials({
  refresh_token: GMAIL_REFRESH_TOKEN,
});

async function sendTextEmail(to, subject, body) {
  try {
    // Skip sending if Gmail is not configured (e.g. in production without env vars)
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_EMAIL) {
      console.warn("⚠️ Gmail not configured (missing env vars). Email not sent.");
      return { accepted: [], response: "Gmail not configured" };
    }

    // ✅ Get fresh access token
    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GMAIL_EMAIL,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
        accessToken: accessToken?.token, // ✅ important
      },
    });

    const mailOptions = {
      from: `"EcoLoop" <${GMAIL_EMAIL}>`,
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
