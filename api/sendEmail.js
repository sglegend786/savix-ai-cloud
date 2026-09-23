const nodemailer = require("nodemailer");

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    const { to, subject, html, user, pass } = req.body;

    if (!to || !subject || !html || !user || !pass) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass }
        });

        await transporter.sendMail({
            from: `"SAVIX Health" <${user}>`,
            to,
            subject,
            html
        });

        res.status(200).json({ success: true, message: "Email sent successfully via Vercel Relay" });
    } catch (err) {
        console.error("Vercel Email Error:", err);
        res.status(500).json({ error: err.message });
    }
}
