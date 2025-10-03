import axios from "axios";

// const API_BASE = import.meta.env.VITE_API_BASE || "https://dosaworld-backend-xypt.onrender.com/api";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});
