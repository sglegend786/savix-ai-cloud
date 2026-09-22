import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      default: null,
    },

    schemeName: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    link: {
      type: String,
      default: "",
    },

    sentTo: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        email: String,
        phone: String,
        read: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
