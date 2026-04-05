const BASE_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("visapath_token");

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.message || "Request failed", code: data.code };
  }

  return data;
};

// Auth
export const authAPI = {
  register: (body) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiFetch("/auth/me"),
  registerSendOtp: (body) => apiFetch("/auth/register/send-otp", { method: "POST", body: JSON.stringify(body) }),
  registerVerifyOtp: (body) => apiFetch("/auth/register/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  forgotSendOtp: (body) => apiFetch("/auth/forgot-password/send-otp", { method: "POST", body: JSON.stringify(body) }),
  forgotVerifyOtp: (body) => apiFetch("/auth/forgot-password/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  forgotReset: (body) => apiFetch("/auth/forgot-password/reset", { method: "POST", body: JSON.stringify(body) }),
};

// Visa Applications
export const applicationsAPI = {
  list: () => apiFetch("/applications"),
  create: (body) => apiFetch("/applications", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/applications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/applications/${id}`, { method: "DELETE" }),
};

// AI
export const aiAPI = {
  invoke: (prompt) => apiFetch("/ai/invoke", { method: "POST", body: JSON.stringify({ prompt }) }),
};

// Experts
export const expertsAPI = {
  list: (country) => apiFetch(`/experts${country ? `?country=${country}` : ''}`),
  getById: (id) => apiFetch(`/experts/${id}`),
  register: (body) => apiFetch("/experts/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => apiFetch("/experts/login", { method: "POST", body: JSON.stringify(body) }),
  addSlots: (body) => apiFetch("/experts/slots", { method: "POST", body: JSON.stringify(body) }),
  getMySlots: () => apiFetch("/experts/my/slots"),
  book: (body) => apiFetch("/experts/book", { method: "POST", body: JSON.stringify(body) }),
  getMyBookings: () => apiFetch("/experts/my/bookings"),
};

// Stripe
export const stripeAPI = {
  createCheckout: () => apiFetch("/stripe/create-checkout", { method: "POST" }),
  getStatus: () => apiFetch("/stripe/status"),
  cancel: () => apiFetch("/stripe/cancel", { method: "POST" }),
  activatePremium: () => apiFetch("/stripe/activate-premium", { method: "POST" }),
};

// VisaMates
export const visaMatesAPI = {
  saveProfile: (body) => apiFetch("/visamates/profile", { method: "POST", body: JSON.stringify(body) }),
  getMyProfile: () => apiFetch("/visamates/profile/me"),
  getMatches: () => apiFetch("/visamates/matches"),
  connect: (receiver_id) => apiFetch("/visamates/connect", { method: "POST", body: JSON.stringify({ receiver_id }) }),
  respondConnection: (id, status) => apiFetch(`/visamates/connect/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  getConnections: () => apiFetch("/visamates/connections"),
  getRequests: () => apiFetch("/visamates/requests"),
  getMessages: (connectionId) => apiFetch(`/visamates/messages/${connectionId}`),
  pollMessages: (connectionId, after) => apiFetch(`/visamates/messages/${connectionId}/poll?after=${after}`),
  sendMessage: (connectionId, content) =>
    apiFetch(`/visamates/messages/${connectionId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

// Document Scanner
export const documentScanAPI = {
  scan: (formData) =>
    fetch(`${BASE_URL}/documents/scan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // ❗ Do NOT set Content-Type manually (multipart handled automatically)
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw { status: res.status, message: data.message };
      return data;
    }),
};