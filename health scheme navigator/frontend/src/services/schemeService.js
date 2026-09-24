import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5005/api/schemes" });

export const getAllSchemes = async (params = {}) => {
  const response = await API.get("/", { params });
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getSchemeById = async (id) => {
  const response = await API.get(`/${encodeURIComponent(id)}`);
  return response.data?.data;
};

export const getSchemesByCategory = async (category) => {
  const response = await API.get(`/category/${encodeURIComponent(category)}`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getNewSchemes = async () => {
  const response = await API.get("/new");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const getActiveSchemes = async () => {
  const response = await API.get("/active");
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

export const createScheme = async (scheme) => {
  const token = localStorage.getItem("token");
  const response = await API.post("/", scheme, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
