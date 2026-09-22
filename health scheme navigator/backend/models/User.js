import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Eligibility Profile
    gender: {
      type: String,
      enum: ["male", "female", "other", "all", ""],
      default: "",
      lowercase: true,
      trim: true,
    },

    age: {
      type: Number,
      default: null,
    },

    state: {
      type: String,
      default: "",
    },

    occupation: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    annualIncome: {
      type: Number,
      default: null,
    },

    category: {
      type: String,
      enum: ["general", "obc", "sc", "st", "other", ""],
      default: "general",
    },

    // --- Phase 1.1 New Filter Fields ---
    caste: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    residence: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    benefitType: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    maritalStatus: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    disabilityPercentage: {
      type: Number,
      default: 0,
    },

    employmentStatus: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    isMinority: {
      type: Boolean,
      default: false,
    },

    isDifferentlyAbled: {
      type: Boolean,
      default: false,
    },

    isDBT: {
      type: Boolean,
      default: false,
    },

    isBPL: {
      type: Boolean,
      default: false,
    },

    isEconomicDistress: {
      type: Boolean,
      default: false,
    },

    isGovtEmployee: {
      type: Boolean,
      default: false,
    },

    isFarmer: {
      type: Boolean,
      default: false,
    },

    isStudent: {
      type: Boolean,
      default: false,
    },

    isSeniorCitizen: {
      type: Boolean,
      default: false,
    },

    hasDisability: {
      type: Boolean,
      default: false,
    },

    // Notifications (in-app)
    notifications: [
      {
        schemeId: String,
        schemeName: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Browser Push Subscription
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (Mongoose 8+ async pre-save without next())
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
