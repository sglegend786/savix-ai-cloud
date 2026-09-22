import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Scheme from "../models/Scheme.js";


// ==========================================
// SEND NOTIFICATION TO ALL USERS
// When admin publishes a new scheme
// POST /api/notifications/broadcast
// ==========================================

export const broadcastNotification = async (req, res) => {
  try {
    const { schemeId, schemeName, message, category, link } = req.body;

    // Get all registered users (with email or phone)
    const users = await User.find({ role: "user" }).select("_id email phone name");

    const sentTo = users.map((u) => ({
      userId: u._id,
      email: u.email,
      phone: u.phone,
      read: false,
    }));

    const notification = await Notification.create({
      schemeId: schemeId || null,
      schemeName,
      message,
      category: category || "",
      link: link || "",
      sentTo,
    });

    // Also push notification into each user's notifications array
    await User.updateMany(
      { role: "user" },
      {
        $push: {
          notifications: {
            $each: [
              {
                schemeId: schemeId || "",
                schemeName,
                message,
                read: false,
                createdAt: new Date(),
              },
            ],
            $position: 0,
          },
        },
      }
    );

    res.status(201).json({
      success: true,
      message: `Notification broadcasted to ${users.length} users.`,
      notificationId: notification._id,
      recipientCount: users.length,
      recipients: users.map((u) => ({ name: u.name, email: u.email, phone: u.phone })),
    });

  } catch (error) {
    console.error("Broadcast error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to broadcast notification.",
      error: error.message,
    });
  }
};


// ==========================================
// GET MY NOTIFICATIONS
// GET /api/notifications/my
// ==========================================

export const getMyNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      count: user.notifications.length,
      data: user.notifications,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};


// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/mark-read
// ==========================================

export const markAllRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "notifications.$[].read": true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      error: error.message,
    });
  }
};


// ==========================================
// GET ALL BROADCAST HISTORY (Admin)
// GET /api/notifications/all
// ==========================================

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};
