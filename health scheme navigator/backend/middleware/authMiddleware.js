import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "schemesathi_secret_key_2026"
    );

    req.user = { 
      id: decoded.id, 
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
      phone: decoded.phone,
      age: decoded.age,
      gender: decoded.gender
    };
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired.",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
};

export { protect, adminOnly };
