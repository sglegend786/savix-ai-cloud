import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================
// GENERATE JWT
// ==========================================
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET || "schemesathi_secret_key_2026",
    { expiresIn: "7d" }
  );
};

// Helper function to build user response object
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  gender: user.gender,
  age: user.age,
  state: user.state,
  occupation: user.occupation,
  annualIncome: user.annualIncome,
  category: user.category,
  caste: user.caste,
  residence: user.residence,
  benefitType: user.benefitType,
  maritalStatus: user.maritalStatus,
  disabilityPercentage: user.disabilityPercentage,
  employmentStatus: user.employmentStatus,
  isMinority: user.isMinority,
  isDifferentlyAbled: user.isDifferentlyAbled,
  isDBT: user.isDBT,
  isBPL: user.isBPL,
  isEconomicDistress: user.isEconomicDistress,
  isGovtEmployee: user.isGovtEmployee,
  isFarmer: user.isFarmer,
  isStudent: user.isStudent,
  isSeniorCitizen: user.isSeniorCitizen,
  hasDisability: user.hasDisability,
});

// ==========================================
// REGISTER USER
// POST /api/auth/register
// ==========================================
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      gender,
      age,
      state,
      occupation,
      annualIncome,
      category,
      isFarmer,
      isStudent,
      isSeniorCitizen,
      hasDisability,
      caste,
      residence,
      benefitType,
      maritalStatus,
      disabilityPercentage,
      employmentStatus,
      isMinority,
      isDifferentlyAbled,
      isDBT,
      isBPL,
      isEconomicDistress,
      isGovtEmployee,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      gender: gender || "",
      age: age !== undefined && age !== null ? Number(age) : null,
      state: state || "",
      occupation: occupation || "",
      annualIncome: annualIncome !== undefined && annualIncome !== null ? Number(annualIncome) : null,
      category: category || "general",
      caste: caste || "",
      residence: residence || "",
      benefitType: benefitType || "",
      maritalStatus: maritalStatus || "",
      disabilityPercentage: disabilityPercentage ? Number(disabilityPercentage) : 0,
      employmentStatus: employmentStatus || "",
      isMinority: Boolean(isMinority),
      isDifferentlyAbled: Boolean(isDifferentlyAbled || hasDisability),
      isDBT: Boolean(isDBT),
      isBPL: Boolean(isBPL),
      isEconomicDistress: Boolean(isEconomicDistress),
      isGovtEmployee: Boolean(isGovtEmployee),
      isFarmer: Boolean(isFarmer),
      isStudent: Boolean(isStudent),
      isSeniorCitizen: Boolean(isSeniorCitizen),
      hasDisability: Boolean(hasDisability || isDifferentlyAbled),
      role: "user",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

// ==========================================
// LOGIN USER (User or Admin)
// POST /api/auth/login
// ==========================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY PROFILE
// GET /api/auth/me
// ==========================================
export const getMe = async (req, res) => {
  try {
    // Avoid cross-DB lookups; just return the trusted JWT payload from Central Auth
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL USERS (Admin only)
// GET /api/auth/users
// ==========================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};
