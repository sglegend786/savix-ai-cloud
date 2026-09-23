import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: "",
    state: "",
    occupation: "",
    annualIncome: "",
    category: "general",
    isFarmer: false,
    isStudent: false,
    isSeniorCitizen: false,
    hasDisability: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      delete payload.confirmPassword;
      if (payload.age) payload.age = Number(payload.age);
      if (payload.annualIncome) payload.annualIncome = Number(payload.annualIncome);

      const response = await axios.post("/api/auth/register", payload);
      if (response.data.success) {
        toast.success("Account created! Please login.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>Create Account</h1>
        <p>Join SchemeSathi to discover schemes made for you.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-section-label">Basic Information</div>

          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
          <input name="phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={handleChange} required />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />

          <div className="form-section-label">Eligibility Profile</div>
          <p className="form-section-hint">Helps us show schemes relevant to you.</p>

          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} min="1" max="120" />

          <select name="state" value={form.state} onChange={handleChange}>
            <option value="">Select State / UT</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input name="occupation" placeholder="Occupation (e.g. Farmer, Student)" value={form.occupation} onChange={handleChange} />
          <input name="annualIncome" type="number" placeholder="Annual Income (₹)" value={form.annualIncome} onChange={handleChange} min="0" />

          <select name="category" value={form.category} onChange={handleChange}>
            <option value="general">General</option>
            <option value="obc">OBC</option>
            <option value="sc">SC</option>
            <option value="st">ST</option>
          </select>

          <div className="checkbox-group">
            <label className="checkbox-label"><input type="checkbox" name="isFarmer" checked={form.isFarmer} onChange={handleChange} /> I am a Farmer</label>
            <label className="checkbox-label"><input type="checkbox" name="isStudent" checked={form.isStudent} onChange={handleChange} /> I am a Student</label>
            <label className="checkbox-label"><input type="checkbox" name="isSeniorCitizen" checked={form.isSeniorCitizen} onChange={handleChange} /> I am a Senior Citizen (60+)</label>
            <label className="checkbox-label"><input type="checkbox" name="hasDisability" checked={form.hasDisability} onChange={handleChange} /> I have a Disability</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;