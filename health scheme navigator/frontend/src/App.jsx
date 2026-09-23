import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Schemes from "./pages/Schemes.jsx";
import FindSchemes from "./pages/FindSchemes.jsx";
import Categories from "./pages/Categories.jsx";
import SchemeDetails from "./pages/SchemeDetails.jsx";
import About from "./pages/About.jsx";
import CategorySchemes from "./pages/CategorySchemes.jsx";
import CompareSchemes from "./pages/CompareSchemes.jsx";
import Login from "./pages/Login.jsx";
import SSO from "./pages/SSO.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { AuthContext, setNavigateRef } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import GoogleTranslate from "./components/GoogleTranslate.jsx";
import VoiceOSWidget from "./components/voice/VoiceOSWidget.jsx";
import AIChatbot from "./components/AIChatbot.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

function App() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateRef(navigate);
  }, [navigate]);

  return (
    <>
      {/* NAVBAR — only show when logged in */}
      {token && (
        <nav className="navbar">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '8px', marginBottom: 0 }}>
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontWeight: '900', fontSize: '15px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Sx</span>
  <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px', color: '#0F172A', fontFamily: 'sans-serif', marginBottom: 0, lineHeight: 1 }}>SAVIX</span>
</Link>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/schemes">Schemes</Link>
            <Link to="/find-schemes">Find Schemes</Link>
            <Link to="/compare">Compare (AI)</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About</Link>
            {user && user.role === "admin" && (
              <Link to="/admin">Admin Dashboard</Link>
            )}
          </div>

          <div className="nav-actions">
            <GoogleTranslate />
            {user && user.role !== "admin" && <NotificationBell />}
            <span className="profile-pill">{user?.name || user?.email}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </nav>
      )}

      {/* ROUTES */}
      <Routes>
        {/* Public — login & register */}
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/sso" element={<SSO />} />

        {/* Protected — login required */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
        <Route path="/find-schemes" element={<ProtectedRoute><FindSchemes /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/scheme/:id" element={<ProtectedRoute><SchemeDetails /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="/categories/:tag" element={<ProtectedRoute><CategorySchemes /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><CompareSchemes /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Catch all — redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <VoiceOSWidget />
      <AIChatbot />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
}

export default App;