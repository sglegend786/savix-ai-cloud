import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Filter,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  User,
  Briefcase,
  HeartHandshake,
  Award,
  Layers,
  X,
  Search,
} from "lucide-react";
import { getAllSchemes } from "../services/schemeService";

// List of Indian States & Union Territories
const STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const SCHEME_CATEGORIES = [
  "Agriculture & Farmers",
  "Education & Student Welfare",
  "Healthcare & Medical",
  "Women & Child Development",
  "Financial Support & Banking",
  "Housing & Urban Development",
  "Social Security & Pension",
  "Skill Development & Employment",
  "Business & Entrepreneurship",
  "Disability Support",
  "Senior Citizen Care",
];

const BENEFIT_TYPES = [
  "Direct Benefit Transfer (DBT)",
  "Financial Assistance / Cash Grant",
  "Subsidies & Discounts",
  "Educational Grants & Scholarships",
  "Free Healthcare / Insurance",
  "Loans & Credit Facility",
  "Skill Training & Equipment",
];

const OCCUPATIONS = [
  "Farmer / Agriculture Worker",
  "Student",
  "Artisan / Craftsperson",
  "Daily Wage Laborer",
  "Small Business Owner / Trader",
  "Private Sector Employee",
  "Government Employee",
  "Healthcare / Frontline Worker",
  "Homemaker",
  "Unemployed / Job Seeker",
];


function FindSchemes() {

  // ==========================================
  // STATE
  // ==========================================

  const [step, setStep] = useState(1);
  const [viewMode, setViewMode] = useState("wizard"); // "wizard" | "all"
  const [showResults, setShowResults] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialFormData = {
    state: "",
    category: "",
    gender: "",
    age: "",
    caste: "",
    residence: "",
    benefitType: "",
    maritalStatus: "",
    disabilityPercentage: "",
    employmentStatus: "",
    occupation: "",
    minority: "",
    differentlyAbled: "",
    dbtScheme: "",
    bpl: "",
    economicDistress: "",
    govtEmployee: "",
    student: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const activeFilterCount = Object.values(formData).filter(v => v !== "").length;

  const handleResetFilters = () => {
    setFormData(initialFormData);
    setSchemes([]); // clear results too, or fetch all
    setShowResults(false);
  };

  // Helper to convert form fields to query params for backend GET /api/schemes
  const buildQueryParams = (data) => {
    const params = {};
    if (data.state) params.state = data.state;
    if (data.category) params.category = data.category;
    if (data.gender) params.gender = data.gender;
    if (data.age !== "" && data.age !== null) params.age = data.age;
    if (data.caste) params.caste = data.caste;
    if (data.residence) params.residence = data.residence;
    if (data.benefitType) params.benefitType = data.benefitType;
    if (data.maritalStatus) params.maritalStatus = data.maritalStatus;
    if (data.disabilityPercentage !== "" && data.disabilityPercentage !== null)
      params.disabilityPercentage = data.disabilityPercentage;
    if (data.employmentStatus) params.employmentStatus = data.employmentStatus;
    if (data.occupation) params.occupation = data.occupation;
    if (data.minority !== "") params.minority = data.minority;
    if (data.differentlyAbled !== "") params.differentlyAbled = data.differentlyAbled;
    if (data.dbtScheme !== "") params.dbtScheme = data.dbtScheme;
    if (data.bpl !== "") params.bpl = data.bpl;
    if (data.economicDistress !== "") params.economicDistress = data.economicDistress;
    if (data.govtEmployee !== "") params.govtEmployee = data.govtEmployee;
    if (data.student !== "") params.student = data.student;

    return params;
  };

  const fetchSchemes = async (dataToUse = formData) => {
    try {
      setLoading(true);
      setError("");
      const params = buildQueryParams(dataToUse);
      const data = await getAllSchemes(params);
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load schemes:", err);
      setError(
        "Unable to load government schemes. Please check whether the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes(initialFormData);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (Array.from(params.keys()).length > 0) {
      const newFormData = { ...initialFormData };
      let hasData = false;
      
      // Map query params to form fields
      if (params.get('state')) { newFormData.state = params.get('state'); hasData = true; }
      if (params.get('category')) { newFormData.category = params.get('category'); hasData = true; }
      if (params.get('isStudent') === 'true') { newFormData.student = 'Yes'; hasData = true; }
      if (params.get('isFarmer') === 'true') { newFormData.occupation = 'Farmer'; hasData = true; }
      if (params.get('gender')) { newFormData.gender = params.get('gender'); hasData = true; }
      if (params.get('age')) { newFormData.age = params.get('age'); hasData = true; }
      
      if (hasData) {
        setFormData(newFormData);
        // Automatically search after a small delay to ensure state updates
        setTimeout(() => {
          fetchSchemes(newFormData);
          setShowResults(true);
        }, 300);
      }
    }
  }, []);



  // ==========================================
  // UPDATE FORM
  // ==========================================

  const updateForm = (
    field,
    value
  ) => {

    setFormData((prev) => ({

      ...prev,

      [field]: value,

    }));

  };


  const nextStep = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };


  // ==========================================
  // ELIGIBILITY MATCHING ENGINE
  // ==========================================

  const getRecommendedSchemes = () => {

    const recommendations = [];


    // ========================================
    // USER PROFILE
    // ========================================

    const age = Number(
      formData.age
    );


    // STUDENT

    const isStudent =
      formData.student === "Yes" ||
      formData.occupation === "Student";


    // FARMER

    const isFarmer =
      formData.farmer === "Yes" ||
      formData.occupation === "Farmer";


    // SENIOR CITIZEN

    const isSeniorCitizen =
      formData.seniorCitizen === "Yes" ||
      age >= 60 ||
      formData.occupation === "Retired";


    // WOMAN

    const isWoman =
      formData.gender === "Female";


    // DISABILITY

    const hasDisability =
      formData.disability === "Yes";


    // EMPLOYMENT

    const isUnemployed =
      formData.occupation === "Unemployed";


    const isSelfEmployed =
      formData.occupation === "Self Employed";


    // LOW INCOME

    const isLowIncome =
      formData.income ===
        "Below ₹1 Lakh" ||

      formData.income ===
        "₹1 Lakh - ₹2.5 Lakh";


    // ========================================
    // CHECK ALL SCHEMES
    // ========================================

    schemes.forEach((scheme) => {


      // ======================================
      // NORMALIZE SCHEME DATA
      // ======================================

      const category = String(
        scheme.category || ""
      )
        .toLowerCase()
        .trim();


      const tags = Array.isArray(
        scheme.tags
      )

        ? scheme.tags.map(
            (tag) =>
              String(tag)
                .toLowerCase()
                .trim()
          )

        : [];


      const schemeName = String(
        scheme.name || ""
      )
        .toLowerCase()
        .trim();


      // ======================================
      // IDENTIFY SCHEME TYPE
      // ======================================

      const isStudentScheme =

        category === "student" ||

        category === "students" ||

        tags.includes("student") ||

        tags.includes("students");


      const isFarmerScheme =

        category === "farmer" ||

        category === "farmers" ||

        tags.includes("farmer") ||

        tags.includes("farmers");


      const isWomenScheme =

        category === "woman" ||

        category === "women" ||

        tags.includes("woman") ||

        tags.includes("women");


      const isSeniorScheme =

        category === "senior" ||

        category ===
          "senior citizen" ||

        category ===
          "senior citizens" ||

        tags.includes("senior") ||

        tags.includes(
          "senior-citizen"
        ) ||

        tags.includes(
          "senior-citizens"
        );


      const isDisabilityScheme =

        category.includes(
          "disability"
        ) ||

        tags.includes(
          "disability"
        ) ||

        tags.includes(
          "disabled"
        ) ||

        tags.includes(
          "persons-with-disabilities"
        );


      const isEmploymentScheme =

        tags.includes(
          "employment"
        ) ||

        tags.includes(
          "employment-support"
        ) ||

        tags.includes(
          "skill-development"
        );


      const isHealthScheme =

        tags.includes(
          "health"
        ) ||

        tags.includes(
          "healthcare"
        );


      const isScholarshipScheme =

        tags.includes(
          "scholarship"
        ) ||

        schemeName.includes(
          "scholarship"
        );


      // ======================================
      // HARD EXCLUSION RULES
      // ======================================
      //
      // IMPORTANT:
      //
      // These rules prevent unrelated
      // schemes from appearing.
      //
      // Example:
      //
      // Farmer
      // ↓
      // Student Scheme = HIDE
      //
      // Student
      // ↓
      // Farmer Scheme = HIDE
      //
      // ======================================


      // --------------------------------------
      // STUDENT SCHEME
      // --------------------------------------

      if (
        isStudentScheme &&
        !isStudent
      ) {

        return;

      }


      // --------------------------------------
      // FARMER SCHEME
      // --------------------------------------

      if (
        isFarmerScheme &&
        !isFarmer
      ) {

        return;

      }


      // --------------------------------------
      // WOMEN SCHEME
      // --------------------------------------

      if (
        isWomenScheme &&
        !isWoman
      ) {

        return;

      }


      // --------------------------------------
      // SENIOR CITIZEN
      // --------------------------------------

      if (
        isSeniorScheme &&
        !isSeniorCitizen
      ) {

        return;

      }


      // --------------------------------------
      // DISABILITY
      // --------------------------------------

      if (
        isDisabilityScheme &&
        !hasDisability
      ) {

        return;

      }


      // ======================================
      // SCORE
      // ======================================

      let score = 0;


      const reasons = [];


      // ======================================
      // PRIMARY PROFILE MATCH
      // ======================================


      // --------------------------------------
      // STUDENT
      // --------------------------------------

      if (
        isStudent &&
        isStudentScheme
      ) {

        score += 70;


        reasons.push(
          "You are a student and this scheme is related to students."
        );

      }


      // --------------------------------------
      // FARMER
      // --------------------------------------

      if (
        isFarmer &&
        isFarmerScheme
      ) {

        score += 80;


        reasons.push(
          "You are a farmer and this scheme is related to farmers."
        );

      }


      // --------------------------------------
      // WOMEN
      // --------------------------------------

      if (
        isWoman &&
        isWomenScheme
      ) {

        score += 80;


        reasons.push(
          "This scheme is focused on women."
        );

      }


      // --------------------------------------
      // SENIOR CITIZEN
      // --------------------------------------

      if (
        isSeniorCitizen &&
        isSeniorScheme
      ) {

        score += 80;


        reasons.push(
          "This scheme is designed for senior citizens."
        );

      }


      // --------------------------------------
      // DISABILITY
      // --------------------------------------

      if (
        hasDisability &&
        isDisabilityScheme
      ) {

        score += 80;


        reasons.push(
          "You indicated that you have a disability."
        );

      }


      // --------------------------------------
      // EMPLOYMENT
      // --------------------------------------

      if (
        (
          isUnemployed ||
          isSelfEmployed
        ) &&
        isEmploymentScheme
      ) {

        score += 50;


        reasons.push(
          "This scheme may support employment or skill development."
        );

      }


      // ======================================
      // INCOME MATCH
      // ======================================

      const isIncomeBasedScheme =

        tags.includes(
          "income-based"
        ) ||

        tags.includes(
          "low-income"
        );


      if (
        isLowIncome &&
        isIncomeBasedScheme
      ) {

        score += 15;


        reasons.push(
          "Your income range may match this income-based scheme."
        );

      }


      // ======================================
      // SCHOLARSHIP MATCH
      // ======================================
      //
      // Scholarship bonus ONLY applies to
      // actual students.
      //
      // Farmer with low income will NOT get
      // student scholarship bonus.
      //
      // ======================================

      if (
        isStudent &&
        isStudentScheme &&
        isScholarshipScheme &&
        isLowIncome
      ) {

        score += 20;


        reasons.push(
          "Your student status and income range may match this scholarship."
        );

      }


      // ======================================
      // HEALTH MATCH
      // ======================================

      if (
        isSeniorCitizen &&
        isHealthScheme
      ) {

        score += 15;


        reasons.push(
          "Healthcare-related support may be relevant to you."
        );

      }


      // ======================================
      // NO MATCH SAFETY CHECK
      // ======================================

      if (
        score <= 0
      ) {

        return;

      }


      // ======================================
      // ADD RECOMMENDATION
      // ======================================

      recommendations.push({

        ...scheme,

        score: Math.min(
          score,
          100
        ),

        reasons,

      });

    });


    // ========================================
    // SORT RESULTS
    // ========================================

    return recommendations.sort(
      (a, b) =>
        b.score - a.score
    );

  };


  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await fetchSchemes(formData);
    setShowResults(true);
  };


  // ==========================================
  // TRY AGAIN
  // ==========================================

  const handleTryAgain = () => {

    setShowResults(false);

    setStep(1);

    setFormData(
      initialFormData
    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="find-page">

        <section className="results-section">

          <div className="results-header">

            <span className="section-label">
              LOADING SCHEMES
            </span>


            <h1>
              Finding Government Schemes
            </h1>


            <p>
              Please wait while we load
              the latest schemes.
            </p>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (

      <div className="find-page">

        <section className="results-section">

          <div className="results-header">

            <span className="section-label">
              ERROR
            </span>


            <h1>
              Unable to Load Schemes
            </h1>


            <p>
              {error}
            </p>


            <button
              className="try-again-button"
              onClick={() =>
                window.location.reload()
              }
            >

              Try Again

            </button>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================
  // RESULTS PAGE
  // ==========================================

  if (showResults) {

    const recommendations =
      getRecommendedSchemes();


    return (

      <div className="find-page">

        <section className="results-section">


          {/* ==================================
              RESULTS HEADER
          ================================== */}

          <div className="results-header">

            <span className="section-label">
              PERSONALIZED RESULTS
            </span>


            <h1>
              Schemes You May Be Eligible For
            </h1>


            <p>
              Based on the information you
              provided, here are schemes that
              may be relevant to your profile.
            </p>

          </div>


          {/* ==================================
              RESULTS GRID
          ================================== */}

          <div className="results-grid">

            {recommendations.length > 0 ? (

              recommendations.map(
                (scheme) => (

                  <div
                    className="result-card"
                    key={scheme._id}
                  >


                    {/* =========================
                        TOP
                    ========================== */}

                    <div className="result-top">


                      <div className="result-icon">

                        <CheckCircle2
                          size={28}
                        />

                      </div>


                      <div className="match-score">

                        {scheme.score}%
                        {" "}
                        Match

                      </div>


                    </div>


                    {/* =========================
                        CATEGORY
                    ========================== */}

                    <span className="result-category">

                      {scheme.category}

                    </span>


                    {/* =========================
                        NAME
                    ========================== */}

                    <h2>

                      {scheme.name}

                    </h2>


                    {/* =========================
                        DESCRIPTION
                    ========================== */}

                    <p>

                      {scheme.description}

                    </p>


                    {/* =========================
                        WHY MATCH
                    ========================== */}

                    {scheme.reasons.length > 0 && (

                      <div className="why-match">


                        <h4>
                          Why this may match you
                        </h4>


                        {scheme.reasons.map(
                          (
                            reason,
                            index
                          ) => (

                            <div
                              className="reason"
                              key={index}
                            >

                              <CheckCircle2
                                size={16}
                              />


                              <span>

                                {reason}

                              </span>

                            </div>

                          )
                        )}

                      </div>

                    )}


                    {/* =========================
                        VIEW SCHEME
                    ========================== */}

                    <Link
                      to={`/scheme/${scheme._id}`}
                      className="view-scheme-button"
                    >

                      View Scheme


                      <ArrowRight
                        size={17}
                      />

                    </Link>


                  </div>

                )

              )

            ) : (

              // =================================
              // NO RESULTS
              // =================================

              <div className="no-results">


                <h2>
                  No Matching Schemes Found
                </h2>


                <p>
                  We couldn't find a suitable
                  government scheme based on
                  your profile.
                </p>


                <p>
                  Try changing your profile
                  details and search again.
                </p>


              </div>

            )}

          </div>


          {/* ==================================
              TRY AGAIN
          ================================== */}

          <button
            className="try-again-button"
            onClick={
              handleTryAgain
            }
          >

            <ArrowLeft
              size={18}
            />


            Try Again

          </button>


        </section>

      </div>

    );

  }


  // ==========================================
  // FORM PAGE
  // ==========================================

  return (

    <div className="find-page">


      {/* ======================================
          HERO
      ======================================= */}

      <section className="find-hero">


        <span className="section-label">

          PERSONALIZED SCHEME FINDER

        </span>


        <h1>

          Find Government Schemes

          <span>

            Made for You

          </span>

        </h1>


        <p>
          Select from 18 filter options (State/UT, Category, Gender, Age, Caste, Residence, Benefit Type, Marital Status, Disability %, Employment, Occupation, Minority, Differently Abled, DBT Scheme, BPL, Economic Distress, Govt Employee, Student) to find relevant schemes.
        </p>

        <div className="find-mode-bar">
          <div className="mode-toggle">
            <button
              type="button"
              className={viewMode === "wizard" ? "mode-btn active" : "mode-btn"}
              onClick={() => setViewMode("wizard")}
            >
              <SlidersHorizontal size={16} /> Step Wizard
            </button>
            <button
              type="button"
              className={viewMode === "all" ? "mode-btn active" : "mode-btn"}
              onClick={() => setViewMode("all")}
            >
              <Filter size={16} /> All 18 Filters
            </button>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" className="reset-filters-btn" onClick={handleResetFilters}>
              <RotateCcw size={15} /> Reset Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </section>


      {/* STEP PROGRESS BAR (WIZARD MODE) */}
      {viewMode === "wizard" && (
        <div className="find-progress">
          <div
            className={step >= 1 ? "progress-step active" : "progress-step"}
            onClick={() => setStep(1)}
            style={{ cursor: "pointer" }}
          >
            <span>1</span>
            <p>Location & Category</p>
          </div>

          <div className="progress-line"></div>

          <div
            className={step >= 2 ? "progress-step active" : "progress-step"}
            onClick={() => setStep(2)}
            style={{ cursor: "pointer" }}
          >
            <span>2</span>
            <p>Demographics</p>
          </div>

          <div className="progress-line"></div>

          <div
            className={step >= 3 ? "progress-step active" : "progress-step"}
            onClick={() => setStep(3)}
            style={{ cursor: "pointer" }}
          >
            <span>3</span>
            <p>Employment & Income</p>
          </div>

          <div className="progress-line"></div>

          <div
            className={step >= 4 ? "progress-step active" : "progress-step"}
            onClick={() => setStep(4)}
            style={{ cursor: "pointer" }}
          >
            <span>4</span>
            <p>Special Status</p>
          </div>
        </div>
      )}

      {/* FORM SECTION */}
      <section className="find-form-section">
        <form onSubmit={handleSubmit} className="find-form-card">
          {/* SECTION 1: LOCATION & CATEGORY */}
          {(viewMode === "all" || step === 1) && (
            <div className="form-step">
              <h2>Location & Scheme Type</h2>
              <p className="form-subtitle">Filter schemes by State/UT, Category, and Benefit Type.</p>

              <div className="form-grid">
                {/* 1. STATE / UT */}
                <div className="form-group">
                  <label>State / Union Territory</label>
                  <select value={formData.state} onChange={(e) => updateForm("state", e.target.value)}>
                    <option value="">All States / UTs (Central & All India)</option>
                    {STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* 2. SCHEME CATEGORY */}
                <div className="form-group">
                  <label>Scheme Category</label>
                  <select value={formData.category} onChange={(e) => updateForm("category", e.target.value)}>
                    <option value="">All Categories</option>
                    {SCHEME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 3. BENEFIT TYPE */}
                <div className="form-group">
                  <label>Benefit Type</label>
                  <select value={formData.benefitType} onChange={(e) => updateForm("benefitType", e.target.value)}>
                    <option value="">All Benefit Types</option>
                    {BENEFIT_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                {/* 4. DBT SCHEME */}
                <div className="form-group">
                  <label>Direct Benefit Transfer (DBT) Scheme</label>
                  <select value={formData.dbtScheme} onChange={(e) => updateForm("dbtScheme", e.target.value)}>
                    <option value="">Any / All Schemes</option>
                    <option value="Yes">Yes (DBT Schemes Only)</option>
                    <option value="No">No (Non-DBT Schemes)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DEMOGRAPHICS */}
          {(viewMode === "all" || step === 2) && (
            <div className="form-step" style={{ marginTop: viewMode === "all" ? "35px" : "0" }}>
              <h2>Demographics & Profile</h2>
              <p className="form-subtitle">Age, gender, caste, residence area, and social categories.</p>

              <div className="form-grid">
                {/* 5. AGE */}
                <div className="form-group">
                  <label>Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Enter your age (e.g. 25)"
                    value={formData.age}
                    onChange={(e) => updateForm("age", e.target.value)}
                  />
                </div>

                {/* 6. GENDER */}
                <div className="form-group">
                  <label>Gender</label>
                  <select value={formData.gender} onChange={(e) => updateForm("gender", e.target.value)}>
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>

                {/* 7. CASTE */}
                <div className="form-group">
                  <label>Caste / Social Category</label>
                  <select value={formData.caste} onChange={(e) => updateForm("caste", e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC (Other Backward Classes)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>

                {/* 8. RESIDENCE AREA */}
                <div className="form-group">
                  <label>Residence Area</label>
                  <select value={formData.residence} onChange={(e) => updateForm("residence", e.target.value)}>
                    <option value="">All Areas</option>
                    <option value="Rural">Rural</option>
                    <option value="Urban">Urban</option>
                    <option value="Semi-Urban">Semi-Urban</option>
                  </select>
                </div>

                {/* 9. MARITAL STATUS */}
                <div className="form-group">
                  <label>Marital Status</label>
                  <select value={formData.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Single">Single / Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced / Separated</option>
                  </select>
                </div>

                {/* 10. MINORITY STATUS */}
                <div className="form-group">
                  <label>Minority Community Status</label>
                  <select value={formData.minority} onChange={(e) => updateForm("minority", e.target.value)}>
                    <option value="">Any / Unspecified</option>
                    <option value="Yes">Yes (Minority Community Member)</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EMPLOYMENT & FINANCIAL */}
          {(viewMode === "all" || step === 3) && (
            <div className="form-step" style={{ marginTop: viewMode === "all" ? "35px" : "0" }}>
              <h2>Employment, Occupation & Financial Status</h2>
              <p className="form-subtitle">Employment details help identify specific financial and skill grants.</p>

              <div className="form-grid">
                {/* 11. EMPLOYMENT STATUS */}
                <div className="form-group">
                  <label>Employment Status</label>
                  <select value={formData.employmentStatus} onChange={(e) => updateForm("employmentStatus", e.target.value)}>
                    <option value="">All Employment Statuses</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired / Pensioner</option>
                  </select>
                </div>

                {/* 12. OCCUPATION */}
                <div className="form-group">
                  <label>Occupation / Profession</label>
                  <select value={formData.occupation} onChange={(e) => updateForm("occupation", e.target.value)}>
                    <option value="">All Occupations</option>
                    {OCCUPATIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                {/* 13. GOVERNMENT EMPLOYEE */}
                <div className="question-box">
                  <h3>Are you a Government Employee?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={formData.govtEmployee === "Yes" ? "choice active" : "choice"}
                      onClick={() => updateForm("govtEmployee", "Yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={formData.govtEmployee === "No" ? "choice active" : "choice"}
                      onClick={() => updateForm("govtEmployee", "No")}
                    >No</button>
                    <button
                      type="button"
                      className={formData.govtEmployee === "" ? "choice active" : "choice"}
                      onClick={() => updateForm("govtEmployee", "")}
                    >Any</button>
                  </div>
                </div>

                {/* 14. STUDENT */}
                <div className="question-box">
                  <h3>Are you currently a Student?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={formData.student === "Yes" ? "choice active" : "choice"}
                      onClick={() => updateForm("student", "Yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={formData.student === "No" ? "choice active" : "choice"}
                      onClick={() => updateForm("student", "No")}
                    >No</button>
                    <button
                      type="button"
                      className={formData.student === "" ? "choice active" : "choice"}
                      onClick={() => updateForm("student", "")}
                    >Any</button>
                  </div>
                </div>

                {/* 15. BPL */}
                <div className="question-box">
                  <h3>Below Poverty Line (BPL) Cardholder?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={formData.bpl === "Yes" ? "choice active" : "choice"}
                      onClick={() => updateForm("bpl", "Yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={formData.bpl === "No" ? "choice active" : "choice"}
                      onClick={() => updateForm("bpl", "No")}
                    >No</button>
                    <button
                      type="button"
                      className={formData.bpl === "" ? "choice active" : "choice"}
                      onClick={() => updateForm("bpl", "")}
                    >Any</button>
                  </div>
                </div>

                {/* 16. ECONOMIC DISTRESS */}
                <div className="question-box">
                  <h3>Experiencing Severe Economic Distress?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={formData.economicDistress === "Yes" ? "choice active" : "choice"}
                      onClick={() => updateForm("economicDistress", "Yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={formData.economicDistress === "No" ? "choice active" : "choice"}
                      onClick={() => updateForm("economicDistress", "No")}
                    >No</button>
                    <button
                      type="button"
                      className={formData.economicDistress === "" ? "choice active" : "choice"}
                      onClick={() => updateForm("economicDistress", "")}
                    >Any</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DISABILITY & SPECIAL STATUS */}
          {(viewMode === "all" || step === 4) && (
            <div className="form-step" style={{ marginTop: viewMode === "all" ? "35px" : "0" }}>
              <h2>Special Status & Accessibility</h2>
              <p className="form-subtitle">Disability details unlock specialized welfare & accessibility schemes.</p>

              <div className="form-grid">
                {/* 17. DIFFERENTLY ABLED */}
                <div className="question-box">
                  <h3>Are you Differently Abled (Person with Disability)?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={formData.differentlyAbled === "Yes" ? "choice active" : "choice"}
                      onClick={() => updateForm("differentlyAbled", "Yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={formData.differentlyAbled === "No" ? "choice active" : "choice"}
                      onClick={() => updateForm("differentlyAbled", "No")}
                    >No</button>
                    <button
                      type="button"
                      className={formData.differentlyAbled === "" ? "choice active" : "choice"}
                      onClick={() => updateForm("differentlyAbled", "")}
                    >Any</button>
                  </div>
                </div>

                {/* 18. DISABILITY PERCENTAGE */}
                <div className="form-group">
                  <label>Disability Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter percentage e.g. 40"
                    value={formData.disabilityPercentage}
                    onChange={(e) => updateForm("disabilityPercentage", e.target.value)}
                  />
                  <small style={{ color: "#718078", fontSize: "12px", marginTop: "4px" }}>
                    Benchmark disability is usually 40% or higher.
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* FORM ACTIONS */}
          <div className="form-actions">
            {viewMode === "wizard" && step > 1 && (
              <button type="button" className="back-button" onClick={previousStep}>
                <ArrowLeft size={18} /> Back
              </button>
            )}

            {viewMode === "wizard" && step < 4 ? (
              <button type="button" className="next-button" onClick={nextStep}>
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button type="submit" className="next-button">
                Find My Schemes <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default FindSchemes;