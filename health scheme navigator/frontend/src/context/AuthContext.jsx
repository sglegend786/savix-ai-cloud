import React, { createContext, useState, useEffect } from "react";
import { getMe } from "../services/authService";
import { subscribeToPush, unsubscribeFromPush } from "../services/pushService";

export const AuthContext = createContext();

// NavigationHandler is a helper used inside BrowserRouter
// The actual navigate calls are done via callbacks stored here
let _navigate = null;
export const setNavigateRef = (fn) => { _navigate = fn; };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Load user profile if token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const data = await getMe(token);
          setUser(data);
        } catch (err) {
          console.error("Auth load error", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
    };
    fetchProfile();
  }, [token]);

  const login = (jwt, userData) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
    setUser(userData);
    // Subscribe to browser push notifications (only for regular users, not admin)
    if (userData.role !== "admin") {
      subscribeToPush(jwt);
    }
    if (userData.role === "admin") {
      if (_navigate) _navigate("/admin");
    } else {
      if (_navigate) _navigate("/");
    }
  };

  const logout = () => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) unsubscribeFromPush(currentToken);
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.replace("https://savix-ai-cloud.vercel.app/index.html?logout=true");
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
