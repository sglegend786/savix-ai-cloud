import Scheme from "../models/Scheme.js";
import User from "../models/User.js";
import { sendEmail, sendSMS, sendPushNotification } from "../utils/emailSms.js";
import { notifyAllUsers } from "../utils/notificationService.js";

// Helper function to parse boolean values from query parameters
const parseBooleanParam = (paramVal) => {
  if (paramVal === true || paramVal === "true" || paramVal === "1") return true;
  if (paramVal === false || paramVal === "false" || paramVal === "0") return false;
  return undefined;
};

// ==========================================
// CREATE SCHEME (Admin only)
// POST /api/schemes
// ==========================================
export const createScheme = async (req, res) => {
  try {
    const {
      name,
      description,
      about,
      category,
      tags,
      department,
      benefits,
      eligibility,
      documents,
      howToApply,
      link,
      source,
      visibleUntil,
      validUntil,
      notifyUsers,
      // Filter fields (Phase 1.1)
      gender,
      minAge,
      maxAge,
      caste,
      residence,
      benefitType,
      maritalStatus,
      disabilityPercentage,
      employmentStatus,
      occupation,
      isMinority,
      isDifferentlyAbled,
      isDBT,
      isBPL,
      isEconomicDistress,
      isGovtEmployee,
      isStudent,
    } = req.body;

    const scheme = await Scheme.create({
      name,
      description,
      about,
      category,
      tags,
      department,
      benefits,
      eligibility,
      documents,
      howToApply,
      link,
      source,
      visibleUntil: visibleUntil ? new Date(visibleUntil) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      gender: gender || "all",
      minAge: minAge !== undefined ? Number(minAge) : 0,
      maxAge: maxAge !== undefined ? Number(maxAge) : 100,
      caste: caste || "all",
      residence: residence || "all",
      benefitType: benefitType || "all",
      maritalStatus: maritalStatus || "all",
      disabilityPercentage: disabilityPercentage !== undefined ? Number(disabilityPercentage) : 0,
      employmentStatus: employmentStatus || "all",
      occupation: occupation || "all",
      isMinority: Boolean(isMinority),
      isDifferentlyAbled: Boolean(isDifferentlyAbled),
      isDBT: Boolean(isDBT),
      isBPL: Boolean(isBPL),
      isEconomicDistress: Boolean(isEconomicDistress),
      isGovtEmployee: Boolean(isGovtEmployee),
      isStudent: Boolean(isStudent),
      createdBy: req.user.id,
    });

    if (notifyUsers !== false) { // Default true unless explicitly false
      // This handles Socket, Email, and FCM (if configured)
      notifyAllUsers(scheme);
    }

    res.status(201).json({
      success: true,
      message: "Scheme created successfully.",
      data: scheme,
    });
  } catch (error) {
    console.error("Create scheme error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create scheme.",
      error: error.message,
    });
  }
};

// ==========================================
// GET NEW SCHEMES (visibleUntil > now OR no limit)
// GET /api/schemes/new
// ==========================================
export const getNewSchemes = async (req, res) => {
  try {
    const now = new Date();
    const schemes = await Scheme.find({
      $or: [
        { visibleUntil: { $gt: now } },
        { visibleUntil: null },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    console.error("Get new schemes error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch new schemes", error: error.message });
  }
};

// ==========================================
// GET ACTIVE SCHEMES (validUntil > now or no expiry)
// GET /api/schemes/active
// ==========================================
export const getActiveSchemes = async (req, res) => {
  try {
    const now = new Date();
    const schemes = await Scheme.find({
      $or: [{ validUntil: { $gt: now } }, { validUntil: null }],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    console.error("Get active schemes error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch active schemes", error: error.message });
  }
};

// ==========================================
// GET ALL SCHEMES (Supports Phase 1.1 Filters)
// GET /api/schemes
// ==========================================
export const getAllSchemes = async (req, res) => {
  try {
    const query = {};

    const {
      gender,
      age,
      minAge,
      maxAge,
      caste,
      category,
      residence,
      benefitType,
      maritalStatus,
      disabilityPercentage,
      employmentStatus,
      occupation,
      isMinority,
      minority,
      isDifferentlyAbled,
      differentlyAbled,
      hasDisability,
      isDBT,
      dbtScheme,
      dbt,
      isBPL,
      belowPovertyLine,
      bpl,
      isEconomicDistress,
      economicDistress,
      isGovtEmployee,
      governmentEmployee,
      govtEmployee,
      isStudent,
      student,
      search,
    } = req.query;

    // 1. Gender filter
    if (gender && gender.trim() !== "" && gender.toLowerCase() !== "all") {
      const gVal = gender.toLowerCase().trim();
      query.gender = { $in: [gVal, "all", "", null] };
    }

    // 2. Age filter (User age vs scheme minAge/maxAge or direct minAge/maxAge query)
    if (age !== undefined && age !== null && age !== "") {
      const userAge = Number(age);
      if (!isNaN(userAge)) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { minAge: { $lte: userAge } },
            { minAge: null },
            { minAge: { $exists: false } },
          ],
        });
        query.$and.push({
          $or: [
            { maxAge: { $gte: userAge } },
            { maxAge: null },
            { maxAge: { $exists: false } },
          ],
        });
      }
    }
    if (minAge !== undefined && minAge !== "") {
      const mAge = Number(minAge);
      if (!isNaN(mAge)) {
        query.minAge = { $gte: mAge };
      }
    }
    if (maxAge !== undefined && maxAge !== "") {
      const mxAge = Number(maxAge);
      if (!isNaN(mxAge)) {
        query.maxAge = { $lte: mxAge };
      }
    }

    // 3. Caste / Category filter
    const casteFilter = caste || category;
    if (casteFilter && casteFilter.trim() !== "" && casteFilter.toLowerCase() !== "all") {
      const cVal = casteFilter.toLowerCase().trim();
      query.caste = { $in: [cVal, "all", "", null] };
    }

    // 4. Residence filter (Urban / Rural / All)
    if (residence && residence.trim() !== "" && residence.toLowerCase() !== "all") {
      const rVal = residence.toLowerCase().trim();
      query.residence = { $in: [rVal, "all", "", null] };
    }

    // 5. Benefit Type filter
    if (benefitType && benefitType.trim() !== "" && benefitType.toLowerCase() !== "all") {
      const bVal = benefitType.toLowerCase().trim();
      query.benefitType = { $in: [new RegExp(bVal, "i"), "all", "", null] };
    }

    // 6. Marital Status filter
    if (maritalStatus && maritalStatus.trim() !== "" && !["all", "any"].includes(maritalStatus.toLowerCase())) {
      const mVal = maritalStatus.toLowerCase().trim();
      query.maritalStatus = { $in: [mVal, "all", "any", "", null] };
    }

    // 7. Disability Percentage filter
    if (disabilityPercentage !== undefined && disabilityPercentage !== null && disabilityPercentage !== "") {
      const disVal = Number(disabilityPercentage);
      if (!isNaN(disVal)) {
        query.disabilityPercentage = { $lte: disVal };
      }
    }

    // 8. Employment Status filter
    if (employmentStatus && employmentStatus.trim() !== "" && employmentStatus.toLowerCase() !== "all") {
      const empVal = employmentStatus.toLowerCase().trim();
      query.employmentStatus = { $in: [empVal, "all", "", null] };
    }

    // 9. Occupation filter
    if (occupation && occupation.trim() !== "" && occupation.toLowerCase() !== "all") {
      const occVal = occupation.toLowerCase().trim();
      query.occupation = { $in: [new RegExp(occVal, "i"), "all", "", null] };
    }

    // 10. Minority filter
    const minParam = isMinority !== undefined ? isMinority : minority;
    const minBool = parseBooleanParam(minParam);
    if (minBool !== undefined) {
      query.isMinority = minBool;
    }

    // 11. Differently Abled filter
    const diffParam = isDifferentlyAbled !== undefined ? isDifferentlyAbled : (differentlyAbled !== undefined ? differentlyAbled : hasDisability);
    const diffBool = parseBooleanParam(diffParam);
    if (diffBool !== undefined) {
      query.isDifferentlyAbled = diffBool;
    }

    // 12. DBT Scheme filter
    const dbtParam = isDBT !== undefined ? isDBT : (dbtScheme !== undefined ? dbtScheme : dbt);
    const dbtBool = parseBooleanParam(dbtParam);
    if (dbtBool !== undefined) {
      query.isDBT = dbtBool;
    }

    // 13. Below Poverty Line filter
    const bplParam = isBPL !== undefined ? isBPL : (belowPovertyLine !== undefined ? belowPovertyLine : bpl);
    const bplBool = parseBooleanParam(bplParam);
    if (bplBool !== undefined) {
      query.isBPL = bplBool;
    }

    // 14. Economic Distress filter
    const ecoParam = isEconomicDistress !== undefined ? isEconomicDistress : economicDistress;
    const ecoBool = parseBooleanParam(ecoParam);
    if (ecoBool !== undefined) {
      query.isEconomicDistress = ecoBool;
    }

    // 15. Government Employee filter
    const govtParam = isGovtEmployee !== undefined ? isGovtEmployee : (governmentEmployee !== undefined ? governmentEmployee : govtEmployee);
    const govtBool = parseBooleanParam(govtParam);
    if (govtBool !== undefined) {
      query.isGovtEmployee = govtBool;
    }

    // 16. Student filter
    const stuParam = isStudent !== undefined ? isStudent : student;
    const stuBool = parseBooleanParam(stuParam);
    if (stuBool !== undefined) {
      query.isStudent = stuBool;
    }

    // Generic search parameter (name, description, category, tags, department)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { department: searchRegex },
      ];
    }

    const schemes = await Scheme.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    console.error("Error fetching schemes:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch schemes", error: error.message });
  }
};

// ==========================================
// GET SINGLE SCHEME
// GET /api/schemes/:id
// ==========================================
export const getSchemeById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }
    res.status(200).json({ success: true, data: scheme });
  } catch (error) {
    console.error("Error fetching scheme:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch scheme", error: error.message });
  }
};

// ==========================================
// GET SCHEMES BY CATEGORY
// GET /api/schemes/category/:category
// ==========================================
export const getSchemesByCategory = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const schemes = await Scheme.find({ tags: category }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    console.error("Error fetching category schemes:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch category schemes", error: error.message });
  }
};

// ==========================================
// GET LATEST GOVERNMENT SCHEMES
// ==========================================
export const getLatestSchemes = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const schemes = await Scheme.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    console.error("Error fetching latest schemes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest government schemes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
