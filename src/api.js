// CivicFix Pakistan — API client
// Talks to the backend built in /civicfix-backend. Set VITE_API_BASE_URL in
// .env (see .env.example) before building — without it, every call below
// will fail against a relative "/api/..." path with no server behind it.

const BASE = "https://civicfix-backend-8gk6.onrender.com";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, body, isForm } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* e.g. CSV/empty responses */ }

  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  return data;
}

/* ---------------- Normalizers ----------------
   Backend rows use snake_case; the UI components were written against the
   original camelCase prototype shape. Normalizing here means the screens
   below barely had to change when wiring up the real API. */

export const normUser = (u) => u && ({
  id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email,
  createdAt: u.created_at ? new Date(u.created_at).getTime() : null,
});

export const normComplaint = (c) => c && ({
  id: c.id,
  userId: c.user_id,
  category: c.category_id,
  photo: c.photo_url,
  resolutionPhoto: c.resolution_photo_url,
  lat: c.latitude,
  lng: c.longitude,
  address: c.address,
  landmark: c.landmark,
  description: c.description,
  status: c.status,
  createdAt: new Date(c.created_at).getTime(),
  reporterName: c.reporter_name,
  reporterPhone: c.reporter_phone,
});

export const normTx = (t) => t && ({
  id: t.id, userId: t.user_id, amount: t.amount, label: t.label,
  createdAt: new Date(t.created_at).getTime(),
});

export const normWithdrawal = (w) => w && ({
  id: w.id,
  userId: w.user_id,
  amount: w.amount_pkr,
  provider: w.provider,
  holder: w.account_holder,
  account: w.account_number,
  cnic: w.cnic,
  status: w.status,
  createdAt: new Date(w.created_at).getTime(),
  userName: w.user_name,
  userPhone: w.user_phone,
});

export const normNotif = (n) => n && ({
  id: n.id, userId: n.user_id, title: n.title, body: n.body,
  read: n.is_read, createdAt: new Date(n.created_at).getTime(),
});

export const normProfile = (p) => p && ({
  provider: p.provider, holder: p.account_holder, account: p.account_number, cnic: p.cnic,
});

/* ---------------- Auth ---------------- */

export const sendOtp = (name, phone) => request("/api/auth/otp/send", { method: "POST", body: { name, phone } });
export const verifyOtp = (name, phone, otp) =>
  request("/api/auth/otp/verify", { method: "POST", body: { name, phone, otp } })
    .then((d) => ({ token: d.token, user: normUser(d.user) }));
export const adminLogin = (email, password) =>
  request("/api/auth/admin/login", { method: "POST", body: { email, password } })
    .then((d) => ({ token: d.token, user: normUser(d.user) }));
export const fetchMe = (token) => request("/api/me", { token }).then((d) => normUser(d.user));
export const deleteAccount = (token) => request("/api/account", { method: "DELETE", token });

/* ---------------- Complaints ---------------- */

export const createComplaint = (token, { category, lat, lng, address, landmark, description, photoBlob }) => {
  const form = new FormData();
  form.append("category", category);
  form.append("lat", lat);
  form.append("lng", lng);
  form.append("address", address || "");
  form.append("landmark", landmark || "");
  form.append("description", description || "");
  form.append("photo", photoBlob, "report.jpg");
  return request("/api/complaints", { method: "POST", token, body: form, isForm: true })
    .then((d) => normComplaint(d.complaint));
};

export const fetchMyComplaints = (token) =>
  request("/api/complaints/mine", { token }).then((d) => d.complaints.map(normComplaint));

/* ---------------- Wallet ---------------- */

export const fetchWalletSummary = (token) => request("/api/wallet/summary", { token });
export const fetchWalletTx = (token) =>
  request("/api/wallet/transactions", { token }).then((d) => d.transactions.map(normTx));

/* ---------------- Withdrawals ---------------- */

export const createWithdrawal = (token, payload) =>
  request("/api/withdrawals", { method: "POST", token, body: payload }).then((d) => normWithdrawal(d.withdrawal));
export const fetchMyWithdrawals = (token) =>
  request("/api/withdrawals/mine", { token }).then((d) => d.withdrawals.map(normWithdrawal));
export const fetchPayoutProfile = (token) =>
  request("/api/payout-profile", { token }).then((d) => normProfile(d.profile));

/* ---------------- Notifications ---------------- */

export const fetchNotifications = (token) =>
  request("/api/notifications", { token }).then((d) => d.notifications.map(normNotif));
export const markAllNotificationsRead = (token) => request("/api/notifications/read-all", { method: "PATCH", token });

/* ---------------- Admin ---------------- */

export const fetchAdminStats = (token) => request("/api/admin/stats", { token }).then((d) => d.stats);

export const fetchAdminComplaint = (token, id) =>
  request(`/api/admin/complaints/${id}`, { token }).then((d) => normComplaint(d.complaint));

export const fetchAdminComplaints = (token, { status, q } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  const qs = params.toString();
  return request(`/api/admin/complaints${qs ? `?${qs}` : ""}`, { token }).then((d) => d.complaints.map(normComplaint));
};

export const updateComplaintStatus = (token, id, { status, resolutionPhotoBlob }) => {
  const form = new FormData();
  form.append("status", status);
  if (resolutionPhotoBlob) form.append("resolutionPhoto", resolutionPhotoBlob, "resolution.jpg");
  return request(`/api/admin/complaints/${id}`, { method: "PATCH", token, body: form, isForm: true })
    .then((d) => normComplaint(d.complaint));
};

export const fetchAdminWithdrawals = (token, { status } = {}) => {
  const qs = status && status !== "all" ? `?status=${status}` : "";
  return request(`/api/admin/withdrawals${qs}`, { token }).then((d) => d.withdrawals.map(normWithdrawal));
};

export const decideWithdrawal = (token, id, action) =>
  request(`/api/admin/withdrawals/${id}`, { method: "PATCH", token, body: { action } }).then((d) => normWithdrawal(d.withdrawal));

export const exportUrl = (path) => `${BASE}${path}`; // opened directly with an auth-carrying <a>, see AdminExport

/* ---------------- Categories ---------------- */

export const fetchCategories = () => request("/api/categories").then((d) => d.categories);

export { ApiError };
