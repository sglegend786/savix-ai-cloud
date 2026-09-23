import React, { useState, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createScheme } from "../services/schemeService";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

function AdminDashboard() {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    link: "",
    visibleUntil: null,
    validUntil: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.role !== "admin") {
      toast.error("Only admins can add schemes");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        visibleUntil: form.visibleUntil ? form.visibleUntil.toISOString() : undefined,
        validUntil: form.validUntil ? form.validUntil.toISOString() : undefined,
      };
      await createScheme(payload);
      toast.success("Scheme created successfully");
      setForm({
        name: "",
        description: "",
        category: "",
        link: "",
        visibleUntil: null,
        validUntil: null,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create scheme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard – Create Scheme</h1>
      <form className="scheme-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Scheme Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          required
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          name="link"
          placeholder="Official Link (optional)"
          value={form.link}
          onChange={handleChange}
        />
        <div className="date-pickers">
          <label>Visible Until</label>
          <DatePicker
            selected={form.visibleUntil}
            onChange={(date) => setForm((p) => ({ ...p, visibleUntil: date }))}
            showTimeSelect
            dateFormat="Pp"
          />
          <label>Valid Until</label>
          <DatePicker
            selected={form.validUntil}
            onChange={(date) => setForm((p) => ({ ...p, validUntil: date }))}
            showTimeSelect
            dateFormat="Pp"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Scheme"}
        </button>
      </form>
    </div>
  );
}

export default AdminDashboard;
