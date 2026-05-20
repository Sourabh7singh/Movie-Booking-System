const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("access_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const json = await res.json();
      errMsg = json.message || errMsg;
    } catch {}
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// ─── Showings ──────────────────────────────────────────────────────────────
export const showingsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/showings${qs ? `?${qs}` : ""}`);
  },
  getById: (showingId) => apiFetch(`/api/showings/${showingId}`),
  getSeats: (showingId) => apiFetch(`/api/showings/${showingId}/seats`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (showingId, seatLabels) =>
    apiFetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ showingId, seatLabels }),
    }),
  getById: (bookingId) => apiFetch(`/api/bookings/${bookingId}`),
  cancel: (bookingId) =>
    apiFetch(`/api/bookings/${bookingId}`, { method: "DELETE" }),
};

// ─── Payments ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  createIntent: (bookingId) =>
    apiFetch("/api/payments/intent", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    }),
  // Simulate Stripe webhook (mock payment)
  mockPay: (bookingId) =>
    apiFetch("/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    }),
  status: (bookingId) => apiFetch(`/api/payments/${bookingId}/status`),
};

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
};
