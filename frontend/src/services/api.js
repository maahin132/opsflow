import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:8000/api/" : "/api/"),

  withCredentials: true,
  withXSRFToken: true,

  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;