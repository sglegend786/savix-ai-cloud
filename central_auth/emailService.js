/**
 * SAVIX Shared Email Notification Service
 * Uses Gmail SMTP (same credentials as Central Auth)
 */

const nodemailer = require('nodemailer');

const GMAIL_USER = 'rico.animation037@gmail.com';
const GMAIL_PASS = 'kkbfhowzaamflufd';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// ── Generic send helper ──
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: `"SAVIX Health" <${GMAIL_USER}>`, to, subject, html });
    console.log(`📧 Email sent → ${to} | ${subject}`);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
  }
}

// ── Task registered notification ──
async function sendTaskRegistered(toEmail, task) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0d1117;border:1px solid #21262d;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0a3d62,#1e3a5f);padding:28px 32px;text-align:center">
        <span style="font-size:11px;color:#00d4ff;letter-spacing:.15em;text-transform:uppercase;font-weight:700">SAVIX Daily Planner</span>
        <h2 style="color:#fff;margin:10px 0 0;font-size:20px">✅ New Task Registered!</h2>
      </div>
      <div style="padding:28px 32px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#8b949e;font-size:13px;width:120px">Title</td><td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600">${task.title}</td></tr>
          <tr><td style="padding:8px 0;color:#8b949e;font-size:13px">Category</td><td style="padding:8px 0;color:#fff;font-size:13px">${task.category || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#8b949e;font-size:13px">Priority</td><td style="padding:8px 0;font-size:13px"><span style="background:${task.priority === 'High' ? '#ff453a' : task.priority === 'Medium' ? '#ff9f0a' : '#30d158'};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700">${task.priority}</span></td></tr>
          <tr><td style="padding:8px 0;color:#8b949e;font-size:13px">Start Date</td><td style="padding:8px 0;color:#fff;font-size:13px">${task.start_date || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#8b949e;font-size:13px">End Date</td><td style="padding:8px 0;color:#fff;font-size:13px">${task.end_date || '—'}</td></tr>
          ${task.description ? `<tr><td style="padding:8px 0;color:#8b949e;font-size:13px;vertical-align:top">Description</td><td style="padding:8px 0;color:#c9d1d9;font-size:13px">${task.description}</td></tr>` : ''}
        </table>
        <p style="margin:20px 0 0;color:#8b949e;font-size:12px">You can manage this task in your SAVIX Daily Planner dashboard.</p>
      </div>
      <div style="padding:16px 32px;background:#161b22;text-align:center;border-top:1px solid #21262d">
        <p style="color:#484f58;font-size:11px;margin:0">© SAVIX Health Platform · Task Notification</p>
      </div>
    </div>`;
  await sendEmail(toEmail, `✅ New Task: ${task.title}`, html);
}

// ── Task reminder notification ──
async function sendTaskReminder(toEmail, task) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0d1117;border:1px solid #21262d;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;text-align:center">
        <span style="font-size:11px;color:#c4b5fd;letter-spacing:.15em;text-transform:uppercase;font-weight:700">SAVIX Daily Planner</span>
        <h2 style="color:#fff;margin:10px 0 0;font-size:20px">⏰ Task Reminder</h2>
      </div>
      <div style="padding:28px 32px">
        <p style="color:#c9d1d9;font-size:15px;margin:0 0 16px">It's time for your scheduled task:</p>
        <div style="background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px 20px;margin-bottom:20px">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0 0 6px">${task.title}</p>
          ${task.description ? `<p style="color:#8b949e;font-size:13px;margin:0">${task.description}</p>` : ''}
        </div>
        <p style="color:#8b949e;font-size:12px;margin:0">Ends: ${task.end_date || '—'}</p>
      </div>
      <div style="padding:16px 32px;background:#161b22;text-align:center;border-top:1px solid #21262d">
        <p style="color:#484f58;font-size:11px;margin:0">© SAVIX Health Platform · Reminder Notification</p>
      </div>
    </div>`;
  await sendEmail(toEmail, `⏰ Reminder: ${task.title}`, html);
}

// ── Task completed notification ──
async function sendTaskCompleted(toEmail, task) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0d1117;border:1px solid #21262d;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:28px 32px;text-align:center">
        <span style="font-size:11px;color:#6ee7b7;letter-spacing:.15em;text-transform:uppercase;font-weight:700">SAVIX Daily Planner</span>
        <h2 style="color:#fff;margin:10px 0 0;font-size:20px">🎉 Task Completed!</h2>
      </div>
      <div style="padding:28px 32px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">🏆</div>
        <p style="color:#fff;font-size:18px;font-weight:700;margin:0 0 8px">${task.title}</p>
        <p style="color:#6ee7b7;font-size:14px;margin:0 0 20px">Great job! Your task has been successfully completed.</p>
        <p style="color:#8b949e;font-size:12px;margin:0">Keep up the healthy habits with SAVIX Daily Planner!</p>
      </div>
      <div style="padding:16px 32px;background:#161b22;text-align:center;border-top:1px solid #21262d">
        <p style="color:#484f58;font-size:11px;margin:0">© SAVIX Health Platform · Completion Notification</p>
      </div>
    </div>`;
  await sendEmail(toEmail, `🎉 Task Completed: ${task.title}`, html);
}

// ── New scheme notification (to all users) ──
async function sendNewSchemeNotification(toEmail, scheme) {
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0d1117;border:1px solid #21262d;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 32px;text-align:center">
        <span style="font-size:11px;color:#00d4ff;letter-spacing:.15em;text-transform:uppercase;font-weight:700">SAVIX Health Scheme Navigator</span>
        <h2 style="color:#fff;margin:10px 0 0;font-size:20px">🆕 New Government Scheme Available!</h2>
      </div>
      <div style="padding:28px 32px">
        <div style="background:#161b22;border-left:4px solid #00d4ff;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:20px">
          <p style="color:#fff;font-size:17px;font-weight:700;margin:0 0 6px">${scheme.name}</p>
          <p style="color:#8b949e;font-size:13px;margin:0">${scheme.category || 'Government Scheme'}</p>
        </div>
        <p style="color:#c9d1d9;font-size:14px;line-height:1.6;margin:0 0 16px">${scheme.description ? scheme.description.substring(0, 200) + '...' : 'A new government scheme has been added. Check it out now!'}</p>
        ${scheme.department ? `<p style="color:#8b949e;font-size:12px;margin:0 0 8px"><strong style="color:#c9d1d9">Department:</strong> ${scheme.department}</p>` : ''}
        ${scheme.link ? `<div style="text-align:center;margin-top:20px"><a href="${scheme.link}" style="background:linear-gradient(90deg,#00d4ff,#0066ff);color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:700">View Scheme →</a></div>` : ''}
      </div>
      <div style="padding:16px 32px;background:#161b22;text-align:center;border-top:1px solid #21262d">
        <p style="color:#484f58;font-size:11px;margin:0">© SAVIX Health Platform · Scheme Notification · <a href="#" style="color:#484f58">Unsubscribe</a></p>
      </div>
    </div>`;
  await sendEmail(toEmail, `🆕 New Scheme: ${scheme.name}`, html);
}

module.exports = { sendTaskRegistered, sendTaskReminder, sendTaskCompleted, sendNewSchemeNotification };
