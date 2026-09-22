/**
 * Admin Seed Script
 * Run: node seedAdmin.js
 * Creates the first admin account in the database.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const db = mongoose.connection.db;
    const usersCol = db.collection("users");

    const existing = await usersCol.findOne({ email: "admin@schemesathi.com" });
    if (existing) {
      console.log("⚠️  Admin already exists with email: admin@schemesathi.com");
      process.exit(0);
    }

    // Hash password manually (bypass Mongoose pre-save hook issues in seed)
    const hashedPassword = await bcrypt.hash("admin@123", 10);

    await usersCol.insertOne({
      name: "SchemeSathi Admin",
      email: "admin@schemesathi.com",
      phone: "9999999999",
      password: hashedPassword,
      role: "admin",
      gender: "",
      age: null,
      state: "",
      occupation: "",
      annualIncome: null,
      category: "general",
      isFarmer: false,
      isStudent: false,
      isSeniorCitizen: false,
      hasDisability: false,
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Admin created successfully!");
    console.log("   Email   : admin@schemesathi.com");
    console.log("   Password: admin@123");
    console.log("   Role    : admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
