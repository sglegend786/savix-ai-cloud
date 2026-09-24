import nodemailer from "nodemailer";
import User from "../models/User.js";
import { getIO, getSocketId } from "./socketManager.js";
import { sendFCMNotification } from "./firebaseAdmin.js";

// ============================================================
// MASTER NOTIFICATION SENDER
// ============================================================
export const notifyAllUsers = async (scheme, options = { push: true, email: true, socket: true }) => {
  try {
    // 1. Get all eligible users or just all users for now
    const users = await User.find({ role: "user" }).select("_id email name fcmTokens");

    const newNotification = {
      schemeId: scheme._id,
      schemeName: scheme.name,
      message: `A new scheme "${scheme.name}" is available. Check if you are eligible!`,
      read: false,
      createdAt: new Date(),
    };

    // 2. Store in MongoDB for all users
    await User.updateMany(
      { role: "user" },
      {
        $push: {
          notifications: {
            $each: [newNotification],
            $position: 0,
          },
        },
      }
    );

    // 3. Emit via Socket.IO
    if (options.socket) {
      const io = getIO();
      users.forEach((user) => {
        const socketId = getSocketId(user._id);
        if (socketId) {
          io.to(socketId).emit("new-notification", newNotification);
        }
      });
    }

    // 4. Send Emails via Nodemailer
    if (options.email) {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        });

        const emails = users.map(u => u.email).filter(Boolean);
        
        if (emails.length > 0) {
           await transporter.sendMail({
            from: `"SchemeSathi 🇮🇳" <${gmailUser}>`,
            bcc: emails, // Use bcc to hide emails from each other
            subject: `New Scheme Alert: ${scheme.name}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8faf8;border-radius:12px;">
                <h2 style="color:#3f7c54;">✨ SchemeSathi</h2>
                <h3 style="color:#17221b;">New Scheme: ${scheme.name}</h3>
                <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #3f7c54;">
                  <p><strong>Category:</strong> ${scheme.category}</p>
                  <p><strong>Description:</strong> ${scheme.description}</p>
                </div>
                <p style="color:#6b8071;font-size:13px;margin-top:16px;">
                  Check your SchemeSathi dashboard for more details.<br/>
                  <a href="https://savix-scheme-ui.vercel.app" style="color:#3f7c54;">Open SchemeSathi</a>
                </p>
              </div>`,
          });
          console.log(`✅ [Email] Sent to ${emails.length} users`);
        }
      } else {
        console.log("[Email] Gmail not configured properly.");
      }
    }

    // 5. FCM Push Notifications
    if (options.push) {
      // Collect all fcmTokens from all users
      const allTokens = users.reduce((acc, user) => {
        if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
          return acc.concat(user.fcmTokens);
        }
        return acc;
      }, []);

      if (allTokens.length > 0) {
        await sendFCMNotification(
          allTokens,
          `🇮🇳 New Scheme: ${scheme.name}`,
          scheme.description?.slice(0, 100) || "Ek nayi sarkari yojana publish hui hai!",
          { url: scheme.link || "https://savix-scheme-ui.vercel.app" }
        );
      }
    }

  } catch (error) {
    console.error("❌ Failed to send notifications:", error);
  }
};
