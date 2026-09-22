import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      default: "",
    },
    benefits: {
      type: [String],
      default: [],
    },
    eligibility: {
      type: [String],
      default: [],
    },
    documents: {
      type: [String],
      default: [],
    },
    howToApply: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "",
    },

    // --- Phase 1.1 New Filter Fields ---
    gender: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    minAge: {
      type: Number,
      default: 0,
    },
    maxAge: {
      type: Number,
      default: 100,
    },
    caste: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    residence: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    benefitType: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    maritalStatus: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    disabilityPercentage: {
      type: Number,
      default: 0,
    },
    employmentStatus: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    occupation: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
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
    isStudent: {
      type: Boolean,
      default: false,
    },

    // Lifecycle
    visibleUntil: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Scheme = mongoose.model("Scheme", schemeSchema);
export default Scheme;
