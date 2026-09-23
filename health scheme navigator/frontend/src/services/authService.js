import axios from "axios";

const API = axios.create({ baseURL: "https://savix-scheme-backend.onrender.com/api" });

// Attach JWT to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend checks email + password only. Phone is stored in user profile.
export const login = async (email, phone, password) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data; // { success, token, user }
};

export const getMe = async (token) => {
  const response = await API.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user; // user object
};

