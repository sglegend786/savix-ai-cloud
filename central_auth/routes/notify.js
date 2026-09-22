/**
 * SAVIX Notification API
 * POST /api/notify/task-registered   { email, task }
 * POST /api/notify/task-reminder     { email, task }
 * POST /api/notify/task-completed    { email, task }
 * POST /api/notify/new-scheme        { emails: [...], scheme }
 */

const express = require('express');
const router  = express.Router();
const { sendTaskRegistered, sendTaskReminder, sendTaskCompleted, sendNewSchemeNotification } = require('../emailService');

router.post('/task-registered', async (req, res) => {
  const { email, task } = req.body;
  if (!email || !task) return res.status(400).json({ success: false, message: 'email and task required' });
  await sendTaskRegistered(email, task);
  res.json({ success: true });
});

router.post('/task-reminder', async (req, res) => {
  const { email, task } = req.body;
  if (!email || !task) return res.status(400).json({ success: false, message: 'email and task required' });
  await sendTaskReminder(email, task);
  res.json({ success: true });
});

router.post('/task-completed', async (req, res) => {
  const { email, task } = req.body;
  if (!email || !task) return res.status(400).json({ success: false, message: 'email and task required' });
  await sendTaskCompleted(email, task);
  res.json({ success: true });
});

router.post('/new-scheme', async (req, res) => {
  const { emails, scheme } = req.body;
  if (!emails || !scheme) return res.status(400).json({ success: false, message: 'emails and scheme required' });
  const emailList = Array.isArray(emails) ? emails : [emails];
  // Send to all without blocking response
  Promise.all(emailList.map(e => sendNewSchemeNotification(e, scheme)));
  res.json({ success: true, message: `Notifications queued for ${emailList.length} users.` });
});

module.exports = router;
