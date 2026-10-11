import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("cp_token");
      localStorage.removeItem("cp_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper to pull a friendly message out of an API error
export const apiErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";

// Receipts need the login header, so a plain <a href> can't open them. Fetch the
// PDF and show it in a new tab - the browser's PDF viewer has Print and Download.
export const openReceipt = async (paymentId) => {
  const win = window.open("", "_blank"); // opened right away so popup blockers allow it
  try {
    const res = await api.get(`/fees/payments/${paymentId}/receipt`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    if (win) win.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (err) {
    if (win) win.close();
    throw err;
  }
};

export default api;
