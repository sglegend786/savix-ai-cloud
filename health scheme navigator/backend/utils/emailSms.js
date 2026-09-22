import nodemailer from "nodemailer";
import webpush from "web-push";
import twilio from "twilio";

// ============================================================
// VAPID (Browser Push) — lazy init
// ============================================================
let vapidReady = false;
const initVapid = () => {
  if (vapidReady) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@schemesathi.com";
  if (pub && priv) {
    webpush.setVapidDetails(email, pub, priv);
    vapidReady = true;
    return true;
  }
  return false;
};

// ============================================================
// TWILIO SMS — lazy init
// ============================================================
let twilioClient = null;
const initTwilio = () => {
  if (twilioClient) return true;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE_NUMBER;
  if (sid && token && phone && !phone.includes("YOUR_TWILIO")) {
    twilioClient = twilio(sid, token);
    return true;
  }
  return false;
};

// ============================================================
// SEND SMS via Twilio
// ============================================================
export const sendSMS = async (phone, message) => {
  if (!phone) return;

  if (!initTwilio()) {
    console.log(`[SMS - NOT CONFIGURED] To: ${phone} | Msg: ${message}`);
    return;
  }

  // Format Indian number: add +91 if not present
  let formattedPhone = phone.toString().replace(/\s/g, "");
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.replace(/^0+/, "");
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }
    formattedPhone = "+" + formattedPhone;
  }

  try {
    // Twilio trial accounts require predefined template names as body
    // 'sms_event_notifications' is an approved Twilio trial template
    const result = await twilioClient.messages.create({
      body: "sms_event_notifications",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    console.log(`✅ [SMS] Sent to ${formattedPhone} | SID: ${result.sid}`);
  } catch (err) {
    // Helpful error messages for trial account issues
    if (err.code === 21608) {
      console.error(`❌ [SMS] ${formattedPhone}: Number not verified. Verify at https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
    } else if (err.code === 21211) {
      console.error(`❌ [SMS] ${formattedPhone}: Invalid phone number format`);
    } else if (err.code === 21610) {
      console.error(`❌ [SMS] ${formattedPhone}: User has opted out of messages`);
    } else {
      console.error(`❌ [SMS] Failed for ${formattedPhone}: [${err.code}] ${err.message}`);
    }
  }
};

// ============================================================
// SEND EMAIL via Gmail SMTP (Nodemailer)
// ============================================================
export const sendEmail = async (to, subject, html) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass || gmailUser === "YOUR_GMAIL@gmail.com") {
    console.log(`[Email - NOT CONFIGURED] To: ${to} | Subject: ${subject}`);
    return;
  }
  if (!to) return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"SchemeSathi 🇮🇳" <${gmailUser}>`,
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8faf8;border-radius:12px;">
          <h2 style="color:#3f7c54;">✨ SchemeSathi</h2>
          <h3 style="color:#17221b;">${subject}</h3>
          <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #3f7c54;">
            ${html}
          </div>
          <p style="color:#6b8071;font-size:13px;margin-top:16px;">
            Ye notification aapke SchemeSathi account ke liye hai.<br/>
            <a href="http://localhost:5174" style="color:#3f7c54;">SchemeSathi kholen</a>
          </p>
        </div>`,
    });
    console.log(`✅ [Email] Sent to ${to}`);
  } catch (err) {
    console.error(`❌ [Email] Failed for ${to}:`, err.message);
  }
};

// ============================================================
// SEND BROWSER PUSH NOTIFICATION
// ============================================================
export const sendPushNotification = async (subscription, payload) => {
  if (!subscription || !subscription.endpoint) return;
  if (!initVapid()) {
    console.log("[Push] VAPID not configured – skipping push");
    return;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`✅ [Push] Sent to ${subscription.endpoint.slice(0, 50)}...`);
  } catch (err) {
    if (err.statusCode === 410) {
      console.log("[Push] Subscription expired");
    } else {
      console.error("❌ [Push] Failed:", err.message);
    }
  }
};
