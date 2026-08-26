import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Droplets, Lightbulb, Waves, Construction, Flame, Home as HomeIcon,
  ClipboardList, Wallet as WalletIcon, Bell, User, MapPin, Camera,
  CheckCircle2, Clock, XCircle, ArrowLeft, LogOut, Globe, Moon, Sun,
  Download, ShieldCheck, CreditCard, Landmark, AlertTriangle, Plus,
  ChevronRight, X, Loader2, Navigation, Image as ImageIcon, Smartphone,
  FileText, Trash2, Lock, Mail, Phone, Check, TrendingUp,
  Coins, ArrowUpRight, ArrowDownRight, Building2, Search
} from "lucide-react";
import {
  sendOtp, verifyOtp, adminLogin, fetchMe, deleteAccount,
  createComplaint, fetchMyComplaints,
  fetchWalletSummary, fetchWalletTx,
  createWithdrawal, fetchMyWithdrawals, fetchPayoutProfile,
  fetchNotifications, markAllNotificationsRead,
  fetchAdminStats, fetchAdminComplaints, fetchAdminComplaint, updateComplaintStatus,
  fetchAdminWithdrawals, decideWithdrawal,
} from "./api.js";

/* ============================================================
   CivicFix Pakistan — wired to the real backend (see /civicfix-backend).
   Set VITE_API_BASE_URL in .env before building (see .env.example).
   ============================================================ */

if (typeof window !== "undefined") window.L = L;
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const TOKEN_KEY = "civicfix_token";
const loadToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const saveToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

/* ---------------- Constants ---------------- */

const CATEGORIES = [
  { id: "water", en: "Water Supply", ur: "Paani Ki Qillat / Ganda Paani", tokens: 200, color: "#2563eb", icon: Droplets },
  { id: "streetlight", en: "Broken Streetlight", ur: "Kharab Streetlight", tokens: 100, color: "#d97706", icon: Lightbulb },
  { id: "sewerage", en: "Sewerage Overflow", ur: "Ubalte Hue Gutter / Badboo", tokens: 200, color: "#7c3aed", icon: Waves },
  { id: "road", en: "Road Potholes & Damage", ur: "Sarak Ke Khadday", tokens: 150, color: "#57534e", icon: Construction },
  { id: "gas", en: "Gas Leakage / Low Pressure", ur: "Gas Leakage / Kam Pressure", tokens: 200, color: "#dc2626", icon: Flame },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const STATUS_ORDER = ["pending", "in_progress", "resolved", "rejected"];
const STATUS_META = {
  pending: { en: "Pending Verification", ur: "Tasdeeq Baqi Hai", color: "#d97706", icon: Clock },
  in_progress: { en: "In Progress", ur: "Kaarwai Jaari Hai", color: "#2563eb", icon: Loader2 },
  resolved: { en: "Resolved", ur: "Hal Ho Gaya", color: "#16a34a", icon: CheckCircle2 },
  rejected: { en: "Rejected", ur: "Mustarad", color: "#dc2626", icon: XCircle },
};
const PROVIDERS = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "EasyPaisa" },
  { id: "raast", label: "Raast (Mobile/CNIC)" },
  { id: "bank", label: "Bank Account (IBAN)" },
];
const MIN_WITHDRAWAL = 500;
const PK_CENTER = [30.3753, 69.3451];

/* ---------------- Translations ---------------- */

const T = {
  en: {
    appName: "CivicFix Pakistan", tagline: "Report it. Track it. Get rewarded.",
    home: "Home", report: "Report", wallet: "Wallet", notifications: "Alerts", profile: "Profile",
    welcome: "Welcome back", totalReports: "Total Reports", resolved: "Resolved",
    tokenBalance: "Token Balance", reportIssue: "Report an Issue", chooseCategory: "Choose a category",
    recentReports: "Your Recent Reports", noReports: "No reports yet. Tap Report to file your first civic issue.",
    selectCategory: "Select Category", addPhoto: "Add Photo Evidence", tapToCapture: "Tap to capture or upload a photo",
    compressing: "Compressing image...", pinLocation: "Pin Exact Location", useMyLocation: "Use My Location",
    locating: "Locating...", landmark: "Landmark / Area Details", landmarkPlaceholder: "e.g. Near Al-Falah Masjid, Block C",
    description: "Description (optional)", descriptionPlaceholder: "Add any extra details...",
    submitReport: "Submit Report", address: "Detected Address",
    reportSubmitted: "Report submitted successfully! You'll earn tokens once it's resolved.",
    selectCategoryFirst: "Please select a category.", addPhotoFirst: "Please attach a photo as evidence.",
    pinLocationFirst: "Please pin the location on the map.",
    walletTitle: "Digital Wallet", totalEarned: "Total Earned", currentBalance: "Current Balance",
    withdraw: "Withdraw Funds", ledger: "Transaction Ledger",
    noTransactions: "No transactions yet.", withdrawTitle: "Withdraw to Bank / Wallet", amount: "Amount (PKR)",
    minWithdraw: `Minimum withdrawal is ${MIN_WITHDRAWAL} PKR.`, provider: "Payment Provider",
    accountHolder: "Account Holder Name", accountNumber: "Mobile Number / IBAN", cnic: "CNIC (for Raast)",
    saveProfile: "Save this as a payout profile", submitWithdrawal: "Submit Withdrawal Request",
    insufficientBalance: "Insufficient balance for this withdrawal.", withdrawalSubmitted: "Withdrawal request submitted for review.",
    myRequests: "My Withdrawal Requests", pendingReview: "Pending Review", approvedPaid: "Approved & Paid",
    rejectedStatus: "Rejected", notifTitle: "Notifications", noNotifs: "No notifications yet.",
    markAllRead: "Mark all as read", profileTitle: "Profile & Settings", language: "Language",
    theme: "Appearance", light: "Light", dark: "Dark", savedProfiles: "Saved Payout Profiles",
    legal: "Legal & Policies", privacyPolicy: "Privacy Policy", termsOfService: "Terms of Service",
    disclaimer: "Non-Government Disclaimer", logout: "Log Out", deleteAccount: "Delete My Account & Data",
    deleteConfirmTitle: "Delete Account?", deleteConfirmBody: "This will permanently remove your account, reports and wallet data from our servers. This action cannot be undone.",
    cancel: "Cancel", confirmDelete: "Yes, Delete Everything",
    loginTitle: "Welcome to CivicFix", loginSub: "Report civic issues in your area and earn rewards for verified reports.",
    citizen: "Citizen", admin: "Admin", fullName: "Full Name", mobileNumber: "Mobile Number", sendOtp: "Send OTP",
    otpSent: "OTP sent (demo): 1234", enterOtp: "Enter OTP", verifyLogin: "Verify & Continue",
    adminEmail: "Admin Email", adminPassword: "Password", loginAsAdmin: "Login as Admin",
    invalidAdmin: "Invalid admin credentials.", locationPermTitle: "Allow Location Access",
    locationPermBody: "CivicFix needs your location to accurately pin civic issues and verify report locations. You can change this anytime in your device settings.",
    allow: "Allow", deny: "Not Now",
    reportedOn: "Reported on",
    adminDashboard: "Admin Dashboard", overview: "Overview", complaints: "Complaints", payouts: "Payouts", exportData: "Export",
    totalComplaints: "Total Complaints", pendingCount: "Pending", inProgressCount: "In Progress", resolvedCount: "Resolved",
    filterAll: "All", updateStatus: "Update Status", resolutionPhoto: "Resolution Photo (After)",
    resolutionPhotoRequired: "A resolution photo is required to mark this issue as Resolved.",
    saveUpdate: "Save Update", statusUpdated: "Status updated successfully.", reporterInfo: "Reporter",
    complaintId: "Complaint ID", exportComplaints: "Export Complaints (CSV)", exportPayouts: "Export Payout Log (CSV)",
    approveAndPay: "Approve & Mark Paid", reject: "Reject", noWithdrawalRequests: "No withdrawal requests.",
    requestedOn: "Requested on", tokensCredited: "tokens credited", forComplaint: "for complaint",
    withdrawalApproved: "Marked as Approved & Paid.", withdrawalRejected: "Rejected — tokens refunded.",
    searchPlaceholder: "Search complaints...",
  },
  ur: {
    appName: "CivicFix Pakistan", tagline: "Report karain. Track karain. Reward paayen.",
    home: "Home", report: "Report", wallet: "Wallet", notifications: "Alerts", profile: "Profile",
    welcome: "Khush aamdeed", totalReports: "Kul Reports", resolved: "Hal Shuda",
    tokenBalance: "Token Balance", reportIssue: "Masla Report Karain", chooseCategory: "Category Chunein",
    recentReports: "Aap Ki Haaliya Reports", noReports: "Abhi tak koi report nahi. Pehli civic issue report karne ke liye Report par tap karein.",
    selectCategory: "Category Muntakhib Karein", addPhoto: "Tasveer Shamil Karein", tapToCapture: "Tasveer khenchne ya upload karne ke liye tap karein",
    compressing: "Tasveer compress ho rahi hai...", pinLocation: "Sahi Location Pin Karein", useMyLocation: "Meri Location Istemal Karein",
    locating: "Location talash ho rahi hai...", landmark: "Landmark / Ilaqe Ki Tafseel", landmarkPlaceholder: "misaal: Al-Falah Masjid ke qareeb, Block C",
    description: "Tafseel (ikhtiyari)", descriptionPlaceholder: "Koi bhi additional tafseel likhein...",
    submitReport: "Report Jama Karein", address: "Mutayyen Kardah Pata",
    reportSubmitted: "Report kaamyabi se jama ho gayi! Hal hone par aap ko tokens milenge.",
    selectCategoryFirst: "Baraye meherbani category muntakhib karein.", addPhotoFirst: "Baraye meherbani saboot ke taur par tasveer laga'ein.",
    pinLocationFirst: "Baraye meherbani map par location pin karein.",
    walletTitle: "Digital Wallet", totalEarned: "Kul Kamaya Gaya", currentBalance: "Mojooda Balance",
    withdraw: "Paise Nikalain", ledger: "Transaction Tafseel",
    noTransactions: "Abhi tak koi transaction nahi.", withdrawTitle: "Bank / Wallet Mein Nikalain", amount: "Raqam (PKR)",
    minWithdraw: `Kam se kam nikaasi ${MIN_WITHDRAWAL} PKR hai.`, provider: "Payment Provider",
    accountHolder: "Account Holder Ka Naam", accountNumber: "Mobile Number / IBAN", cnic: "CNIC (Raast ke liye)",
    saveProfile: "Ise payout profile ke taur par save karein", submitWithdrawal: "Nikaasi Ki Darkhwast Jama Karein",
    insufficientBalance: "Is nikaasi ke liye balance kam hai.", withdrawalSubmitted: "Nikaasi ki darkhwast review ke liye jama ho gayi.",
    myRequests: "Meri Nikaasi Ki Darkhwastain", pendingReview: "Review Baqi Hai", approvedPaid: "Manzoor & Ada Shuda",
    rejectedStatus: "Mustarad", notifTitle: "Notifications", noNotifs: "Abhi tak koi notification nahi.",
    markAllRead: "Sab ko parh liya nishan zad karein", profileTitle: "Profile & Settings", language: "Zaban",
    theme: "Zaahiri Shakal", light: "Roshan", dark: "Tareek", savedProfiles: "Save Kardah Payout Profiles",
    legal: "Qawaneen & Policies", privacyPolicy: "Privacy Policy", termsOfService: "Terms of Service",
    disclaimer: "Ghair Sarkari Wazahat", logout: "Log Out", deleteAccount: "Mera Account & Data Delete Karein",
    deleteConfirmTitle: "Account Delete Karein?", deleteConfirmBody: "Ye aap ka account, reports aur wallet data hamare server se hamesha ke liye hata dega. Ye wapis nahi ho sakta.",
    cancel: "Cancel", confirmDelete: "Haan, Sab Kuch Delete Karein",
    loginTitle: "CivicFix Mein Khush Aamdeed", loginSub: "Apne ilaqe ke civic masail report karein aur tasdeeq shuda reports par reward hasil karein.",
    citizen: "Shehri", admin: "Admin", fullName: "Pura Naam", mobileNumber: "Mobile Number", sendOtp: "OTP Bhejein",
    otpSent: "OTP bheja gaya (demo): 1234", enterOtp: "OTP Darj Karein", verifyLogin: "Tasdeeq Karein & Aage Barhein",
    adminEmail: "Admin Email", adminPassword: "Password", loginAsAdmin: "Admin Ke Taur Par Login Karein",
    invalidAdmin: "Ghalat admin credentials.", locationPermTitle: "Location Tak Rasai Dein",
    locationPermBody: "CivicFix ko civic masail ki sahi location pin karne ke liye aap ki location chahiye. Aap ise kabhi bhi device settings mein tabdeel kar sakte hain.",
    allow: "Ijazat Dein", deny: "Abhi Nahi",
    reportedOn: "Report kiya gaya",
    adminDashboard: "Admin Dashboard", overview: "Overview", complaints: "Complaints", payouts: "Payouts", exportData: "Export",
    totalComplaints: "Kul Complaints", pendingCount: "Pending", inProgressCount: "Jaari", resolvedCount: "Hal Shuda",
    filterAll: "Sab", updateStatus: "Status Update Karein", resolutionPhoto: "Hal Shuda Tasveer (Baad Ki)",
    resolutionPhotoRequired: "Is masle ko Resolved mark karne ke liye tasveer zaroori hai.",
    saveUpdate: "Update Save Karein", statusUpdated: "Status kaamyabi se update ho gaya.", reporterInfo: "Reporter",
    complaintId: "Complaint ID", exportComplaints: "Complaints Export Karein (CSV)", exportPayouts: "Payout Log Export Karein (CSV)",
    approveAndPay: "Manzoor Karein & Ada Karein", reject: "Mustarad Karein", noWithdrawalRequests: "Koi nikaasi ki darkhwast nahi.",
    requestedOn: "Darkhwast Ki Tareekh", tokensCredited: "tokens credit hue", forComplaint: "complaint ke liye",
    withdrawalApproved: "Manzoor & Ada Shuda mark ho gaya.", withdrawalRejected: "Mustarad — tokens wapis kar diye gaye.",
    searchPlaceholder: "Complaints talash karein...",
  },
};

/* ---------------- Utilities ---------------- */

function fmtDate(ts, lang) {
  try {
    return new Date(ts).toLocaleString(lang === "ur" ? "en-GB" : "en-US", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return new Date(ts).toDateString();
  }
}

function compressImage(file, maxDim = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve({ blob, previewUrl: canvas.toDataURL("image/jpeg", quality) }),
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

async function downloadWithAuth(token, path, filename) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- Small UI atoms ---------------- */

function StatusBadge({ status, lang, small }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${small ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
      style={{ backgroundColor: meta.color + "1A", color: meta.color }}
    >
      <Icon size={small ? 11 : 13} className={status === "in_progress" ? "animate-spin" : ""} />
      {meta[lang]}
    </span>
  );
}

function StatusProgressBar({ status, lang }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <XCircle size={16} /> {STATUS_META.rejected[lang]}
      </div>
    );
  }
  const steps = ["pending", "in_progress", "resolved"];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2"
              style={{ backgroundColor: i <= idx ? STATUS_META[s].color : "transparent", borderColor: STATUS_META[s].color }}
            >
              {i <= idx && <Check size={13} color="white" />}
            </div>
            <span className="text-[9px] text-center leading-tight" style={{ color: i <= idx ? STATUS_META[s].color : "#9ca3af", maxWidth: 56 }}>
              {STATUS_META[s][lang]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mb-4" style={{ backgroundColor: i < idx ? STATUS_META[s].color : "#e5e7eb" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-[92%] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 animate-[fadein_0.2s_ease] w-full justify-center ${
            t.type === "error" ? "bg-red-600" : t.type === "info" ? "bg-blue-600" : "bg-emerald-600"
          }`}
        >
          {t.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span className="text-center">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function useLeaflet() {
  return true; // bundled at build time, always ready
}

/* ---------------- Map Picker (Report form) ---------------- */

function MapPicker({ value, onChange, T_ }) {
  const ready = useLeaflet();
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObj = useRef(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return;
   const KARACHI_CENTER = [24.8607, 67.0011];
const start = value.lat ? [value.lat, value.lng] : KARACHI_CENTER;
const map = L.map(mapRef.current, { zoomControl: true }).setView(start, value.lat ? 16 : 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapObj.current = map;
    setTimeout(() => { map.invalidateSize(); }, 300);
    const marker = L.marker(start, { draggable: true }).addTo(map);
    markerObj.current = marker;
    if (!value.lat) marker.setOpacity(0.001);
map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      marker.setOpacity(1);
      applyLatLng(lat, lng);
    });

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      applyLatLng(pos.lat, pos.lng);
    });
    const applyLatLng = async (lat, lng) => {
      marker.setLatLng([lat, lng]);
      marker.setOpacity(1);
      onChange((v) => ({ ...v, lat, lng }));
      const addr = await reverseGeocode(lat, lng);
      onChange((v) => ({ ...v, lat, lng, address: addr || v.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
    };

    
    mapObj.current = map;
    markerObj.current = marker;
    setTimeout(() => map.invalidateSize(), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (mapObj.current && value.lat && markerObj.current) {
      markerObj.current.setLatLng([value.lat, value.lng]);
      markerObj.current.setOpacity(1);
      mapObj.current.setView([value.lat, value.lng], 16);
    }
  }, [value.lat, value.lng]);

  const useMyLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapObj.current) {
          mapObj.current.setView([latitude, longitude], 16);
        }
        if (markerObj.current) {
          markerObj.current.setLatLng([latitude, longitude]);
          markerObj.current.setOpacity(1);
        }
        onChange((v) => ({ ...v, lat: latitude, lng: longitude }));
        const addr = await reverseGeocode(latitude, longitude);
        onChange((v) => ({ ...v, lat: latitude, lng: longitude, address: addr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
        setLocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        setGeoError("Location access unavailable. Please tap map to pin manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  };
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white active:scale-95 transition"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
          {locating ? T_.locating : T_.useMyLocation}
        </button>
        {value.lat && <span className="text-[11px] text-gray-500">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>}
      </div>
      <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-black/10 bg-gray-100" />
      {geoError && <div className="text-[11px] text-red-500 mt-1">{geoError}</div>}
      {value.address && (
        <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>{value.address}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Admin overview Map ---------------- */

function AdminMap({ complaints }) {
  const ready = useLeaflet();
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!mapObj.current) {
      mapObj.current = L.map(mapRef.current).setView(PK_CENTER, 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapObj.current);
      layerRef.current = L.layerGroup().addTo(mapObj.current);
    }
    layerRef.current.clearLayers();
    complaints.forEach((c) => {
      if (!c.lat) return;
      const color = STATUS_META[c.status].color;
      L.circleMarker([c.lat, c.lng], { radius: 7, color, fillColor: color, fillOpacity: 0.85, weight: 1.5 })
        .bindPopup(`<b>${CATEGORY_MAP[c.category]?.en}</b><br/>${STATUS_META[c.status].en}<br/><small>${c.address || ""}</small>`)
        .addTo(layerRef.current);
    });
    setTimeout(() => mapObj.current.invalidateSize(), 150);
  }, [ready, complaints]);

  return <div ref={mapRef} className="w-full h-56 rounded-xl overflow-hidden border border-black/10 bg-gray-100" />;
}

/* ---------------- Location Permission Dialog ---------------- */

function LocationPermDialog({ onDecide, T_ }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <MapPin className="text-emerald-600" size={22} />
        </div>
        <h3 className="font-bold text-lg mb-1.5">{T_.locationPermTitle}</h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{T_.locationPermBody}</p>
        <div className="flex gap-2">
          <button onClick={() => onDecide(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">{T_.deny}</button>
          <button onClick={() => onDecide(true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white">{T_.allow}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Legal Content ---------------- */

const LEGAL_CONTENT = {
  privacyPolicy: {
    title: { en: "Privacy Policy", ur: "Privacy Policy" },
    body: `Effective Date: 2026

CivicFix Pakistan ("the App") is an independent, citizen-led civic reporting platform. This policy explains what information we collect and how it is used.

1. Information We Collect
- Account details: name and mobile number you provide at signup.
- Report data: photos, GPS coordinates, category and description you submit with a civic report.
- Wallet data: token balances, transaction history and payout details you provide (bank/mobile wallet account information) when requesting a withdrawal.

2. How We Use Information
- To display and route your civic reports to the relevant municipal category.
- To calculate and credit token rewards, and to process withdrawal requests.
- To send you in-app notifications about the status of your reports and payouts.

3. Data Sharing
We do not sell your personal data. Location and photo evidence attached to a report may be visible to municipal reviewers and, in anonymized/aggregate form, to the public map.

4. Data Retention & Deletion
You may permanently delete your account and all associated data at any time from Profile → Delete My Account & Data. This action is irreversible.

5. Security
Reasonable technical safeguards are used to protect stored data. No system is 100% secure; please avoid submitting sensitive personal information beyond what is required.

6. Contact
For privacy questions, contact: support@civicfix.pk (demo contact for prototype purposes).`,
  },
  termsOfService: {
    title: { en: "Terms of Service", ur: "Terms of Service" },
    body: `By using CivicFix Pakistan, you agree to the following terms:

1. Purpose
CivicFix is a citizen engagement tool for reporting civic infrastructure issues (water, electricity/streetlights, sewerage, roads, gas). It is not an emergency service — for emergencies, contact 1122 (Rescue), 15 (Police) or your relevant emergency line.

2. Accurate Reporting
You agree to submit truthful, accurate reports with genuine photo evidence and location data. Fraudulent, duplicate or malicious reports may result in account suspension and forfeiture of tokens.

3. Rewards & Tokens
Tokens are awarded at the sole discretion of CivicFix upon verified resolution of a report by an authorized reviewer. Token values may change. Tokens have no monetary value until converted through an approved withdrawal request.

4. Withdrawals
Withdrawal requests are reviewed manually. CivicFix reserves the right to reject withdrawal requests that fail verification, and to reverse tokens for reports later found to be fraudulent.

5. Conduct
You agree not to misuse the platform, upload offensive content, or submit reports about private property disputes unrelated to public civic infrastructure.

6. Limitation of Liability
CivicFix is provided "as is" without warranty. We do not guarantee that any reported issue will be resolved within a specific timeframe, as resolution depends on third-party municipal authorities.

7. Changes
These terms may be updated periodically; continued use constitutes acceptance of the revised terms.`,
  },
  disclaimer: {
    title: { en: "Non-Government Disclaimer", ur: "Ghair Sarkari Wazahat" },
    body: `IMPORTANT: CivicFix Pakistan is an independent, privately-operated civic-tech application. It is NOT owned, operated, endorsed, or affiliated with the Government of Pakistan, any provincial government, WASA, LESCO/K-Electric, SSGC/SNGPL, any Development Authority, or any other government or municipal body.

CivicFix acts solely as a citizen reporting and community engagement tool. Reports submitted through this app are shared for awareness and, where possible, forwarded informally to relevant departments — but CivicFix has no authority to compel any government agency to act.

Any resemblance to official government branding, colors, or terminology is coincidental and used only in a descriptive civic context. Token rewards are funded and issued by CivicFix independently and do not represent any government subsidy, benefit, or program.

If you require an official government complaint, please additionally use your relevant government department's official complaint channel (e.g. Citizen Portal, WASA helpline, or your provincial Ombudsman).`,
  },
};

function LegalModal({ page, lang, onClose }) {
  if (!page) return null;
  const item = LEGAL_CONTENT[page];
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
          <h3 className="font-bold text-base">{item.title[lang] || item.title.en}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-gray-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-gray-600 whitespace-pre-line leading-relaxed">{item.body}</div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN APP
   ================================================================ */

export default function CivicFixApp() {
  const [booted, setBooted] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("home");
  const [toasts, setToasts] = useState([]);
  const [legalPage, setLegalPage] = useState(null);
  const [locationPerm, setLocationPerm] = useState(null);
  const [showLocDialog, setShowLocDialog] = useState(false);
  const [reportPrefill, setReportPrefill] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const T_ = T[lang];

  useEffect(() => {
    (async () => {
      const t = loadToken();
      if (t) {
        try {
          const u = await fetchMe(t);
          setToken(t);
          setUser(u);
        } catch {
          saveToken(null);
        }
      }
      setBooted(true);
    })();
  }, []);

  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user && !isAdmin && locationPerm === null) setShowLocDialog(true);
  }, [user, isAdmin, locationPerm]);

  useEffect(() => {
    if (!user || isAdmin || !token) return;
    let cancelled = false;
    fetchNotifications(token)
      .then((list) => { if (!cancelled) setUnreadCount(list.filter((n) => !n.read).length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, token, page, isAdmin]);

  const themeClass = dark
    ? { bg: "bg-[#0e1512]", card: "bg-[#161f1a]", text: "text-gray-100", sub: "text-gray-400", border: "border-white/10", input: "bg-[#1e2a23] text-white border-white/10" }
    : { bg: "bg-[#F6F8F5]", card: "bg-white", text: "text-gray-900", sub: "text-gray-500", border: "border-black/5", input: "bg-gray-50 text-gray-900 border-gray-200" };

  if (!booted) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-[#0B6E4F]">
        <div className="text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <ShieldCheck size={30} />
          </div>
          <div className="font-bold text-lg tracking-tight">CivicFix Pakistan</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`w-full min-h-[700px] ${themeClass.bg} flex flex-col`}>
        <Toast toasts={toasts} />
        <LoginScreen
          lang={lang} setLang={setLang} T_={T_} toast={toast} themeClass={themeClass}
          onAuthed={(tok, u) => { saveToken(tok); setToken(tok); setUser(u); }}
        />
      </div>
    );
  }

  const doLogout = () => { saveToken(null); setToken(null); setUser(null); setPage("home"); };

  return (
    <div className={`w-full min-h-[700px] max-w-md mx-auto relative ${themeClass.bg} ${themeClass.text} font-[system-ui]`} style={{ fontFamily: "'Manrope','Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadein { from { opacity:0; transform:translateY(-6px);} to {opacity:1; transform:translateY(0);} }
        .cx-scroll::-webkit-scrollbar{display:none}
      `}</style>
      <Toast toasts={toasts} />
      {showLocDialog && (
        <LocationPermDialog
          T_={T_}
          onDecide={(v) => { setLocationPerm(v); setShowLocDialog(false); toast(v ? "Location access granted" : "Location access denied — you can pin manually", v ? "success" : "info"); }}
        />
      )}
      <LegalModal page={legalPage} lang={lang} onClose={() => setLegalPage(null)} />

      <div className="pb-20 min-h-[700px]">
        {isAdmin ? (
          <AdminApp token={token} lang={lang} setLang={setLang} T_={T_} toast={toast} onLogout={doLogout} dark={dark} setDark={setDark} themeClass={themeClass} />
        ) : (
          <>
            {page === "home" && (
              <HomeScreen
                token={token} user={user} lang={lang} T_={T_} themeClass={themeClass}
                onSelectCategory={(catId) => { setReportPrefill(catId); setPage("report"); }}
                onGoReport={() => { setReportPrefill(null); setPage("report"); }}
              />
            )}
            {page === "report" && (
              <ReportScreen
                token={token} lang={lang} T_={T_} toast={toast} prefillCategory={reportPrefill} themeClass={themeClass}
                onDone={() => setPage("home")}
              />
            )}
            {page === "wallet" && <WalletScreen token={token} user={user} lang={lang} T_={T_} toast={toast} themeClass={themeClass} />}
            {page === "notifications" && (
              <NotificationsScreen token={token} lang={lang} T_={T_} themeClass={themeClass} onRead={() => setUnreadCount(0)} />
            )}
            {page === "profile" && (
              <ProfileScreen
                token={token} user={user} lang={lang} setLang={setLang} dark={dark} setDark={setDark}
                T_={T_} toast={toast} themeClass={themeClass} onLogout={doLogout} openLegal={setLegalPage} onDeleted={doLogout}
              />
            )}
            <BottomNav page={page} setPage={setPage} T_={T_} themeClass={themeClass} unread={unreadCount} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Login Screen ---------------- */

function LoginScreen({ lang, setLang, T_, toast, themeClass, onAuthed }) {
  const [tab, setTab] = useState("citizen");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtpNow = async () => {
    if (!name.trim() || phone.trim().length < 10) {
      toast(lang === "ur" ? "Baraye meherbani naam aur sahi mobile number darj karein." : "Please enter your name and a valid mobile number.", "error");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(name.trim(), phone.trim());
      setOtpStage(true);
      toast(T_.otpSent, "info");
    } catch (e) {
      toast(e.message || "Could not send OTP.", "error");
    }
    setBusy(false);
  };

  const verifyCitizen = async () => {
    setBusy(true);
    try {
      const { token, user } = await verifyOtp(name.trim(), phone.trim(), otp.trim());
      onAuthed(token, user);
      toast(lang === "ur" ? "Khush aamdeed!" : "Welcome!");
    } catch (e) {
      toast(e.message || (lang === "ur" ? "Ghalat OTP." : "Incorrect OTP."), "error");
    }
    setBusy(false);
  };

  const loginAdminNow = async () => {
    setBusy(true);
    try {
      const { token, user } = await adminLogin(email.trim(), password);
      onAuthed(token, user);
      toast("Welcome, Admin");
    } catch (e) {
      toast(e.message || T_.invalidAdmin, "error");
    }
    setBusy(false);
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-md mx-auto w-full">
      <div className="flex justify-end mb-4">
        <button onClick={() => setLang(lang === "en" ? "ur" : "en")} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/5">
          <Globe size={13} /> {lang === "en" ? "Roman Urdu" : "English"}
        </button>
      </div>
      <div className="flex flex-col items-center mb-8 mt-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0B6E4F] flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/20">
          <ShieldCheck size={30} color="white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-center">{T_.loginTitle}</h1>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">{T_.loginSub}</p>
      </div>

      <div className="flex bg-black/5 rounded-xl p-1 mb-5">
        <button onClick={() => setTab("citizen")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === "citizen" ? "bg-white shadow text-[#0B6E4F]" : "text-gray-500"}`}>{T_.citizen}</button>
        <button onClick={() => setTab("admin")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === "admin" ? "bg-white shadow text-[#0B6E4F]" : "text-gray-500"}`}>{T_.admin}</button>
      </div>

      {tab === "citizen" ? (
        !otpStage ? (
          <div className="flex flex-col gap-3">
            <FieldInput icon={User} placeholder={T_.fullName} value={name} onChange={setName} />
            <FieldInput icon={Phone} placeholder={T_.mobileNumber + " (03XXXXXXXXX)"} value={phone} onChange={setPhone} type="tel" />
            <button onClick={sendOtpNow} disabled={busy} className="mt-2 py-3 rounded-xl bg-[#0B6E4F] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <>{T_.sendOtp} <ChevronRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{T_.otpSent}</div>
            <FieldInput icon={Lock} placeholder={T_.enterOtp} value={otp} onChange={setOtp} type="tel" />
            <button onClick={verifyCitizen} disabled={busy} className="mt-2 py-3 rounded-xl bg-[#0B6E4F] text-white font-semibold active:scale-[0.98] transition disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin mx-auto" /> : T_.verifyLogin}
            </button>
            <button onClick={() => setOtpStage(false)} className="text-xs text-gray-400 text-center">
              <ArrowLeft size={12} className="inline mr-1" />{T_.cancel}
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <FieldInput icon={Mail} placeholder={T_.adminEmail} value={email} onChange={setEmail} type="email" />
          <FieldInput icon={Lock} placeholder={T_.adminPassword} value={password} onChange={setPassword} type="password" />
          <button onClick={loginAdminNow} disabled={busy} className="mt-2 py-3 rounded-xl bg-gray-900 text-white font-semibold active:scale-[0.98] transition disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin mx-auto" /> : T_.loginAsAdmin}
          </button>
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center mt-10 leading-relaxed">
        CivicFix Pakistan is an independent citizen platform — not a government service.
      </p>
    </div>
  );
}

function FieldInput({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2.5 bg-black/5 rounded-xl px-3.5 py-3">
      <Icon size={16} className="text-gray-400 shrink-0" />
      <input {...props} onChange={(e) => props.onChange(e.target.value)} className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-gray-400" />
    </div>
  );
}

/* ---------------- Top Bar / Bottom Nav ---------------- */

function TopBar({ title, subtitle, themeClass, right }) {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className={`text-xs mt-0.5 ${themeClass.sub}`}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function BottomNav({ page, setPage, T_, themeClass, unread }) {
  const items = [
    { id: "home", label: T_.home, icon: HomeIcon },
    { id: "report", label: T_.report, icon: Plus, primary: true },
    { id: "wallet", label: T_.wallet, icon: WalletIcon },
    { id: "notifications", label: T_.notifications, icon: Bell, badge: unread },
    { id: "profile", label: T_.profile, icon: User },
  ];
  return (
    <div className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto ${themeClass.card} border-t ${themeClass.border} px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] flex items-stretch justify-between z-50`}>
      {items.map((it) => {
        const active = page === it.id;
        const Icon = it.icon;
        if (it.primary) {
          return (
            <button key={it.id} onClick={() => setPage(it.id)} className="flex-1 flex flex-col items-center justify-center -mt-5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6E4F] flex items-center justify-center shadow-lg shadow-emerald-900/30 active:scale-90 transition">
                <Icon size={22} color="white" />
              </div>
              <span className="text-[10px] mt-1 font-semibold text-[#0B6E4F]">{it.label}</span>
            </button>
          );
        }
        return (
          <button key={it.id} onClick={() => setPage(it.id)} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative">
            <Icon size={20} className={active ? "text-[#0B6E4F]" : themeClass.sub} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-[10px] font-medium ${active ? "text-[#0B6E4F]" : themeClass.sub}`}>{it.label}</span>
            {!!it.badge && <span className="absolute top-0 right-6 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{it.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Home Screen ---------------- */

function HomeScreen({ token, user, lang, T_, themeClass, onSelectCategory, onGoReport }) {
  const [complaints, setComplaints] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyComplaints(token), fetchWalletSummary(token)])
      .then(([c, w]) => { if (!cancelled) { setComplaints(c); setBalance(w.balance); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  return (
    <div className="cx-scroll overflow-y-auto">
      <TopBar title={`${T_.welcome}, ${user.name?.split(" ")[0] || ""} 👋`} subtitle={T_.tagline} themeClass={themeClass} />

      <div className="px-5 grid grid-cols-3 gap-3 mb-5">
        <StatCard label={T_.totalReports} value={complaints.length} color="#0B6E4F" icon={ClipboardList} themeClass={themeClass} />
        <StatCard label={T_.resolved} value={resolvedCount} color="#16a34a" icon={CheckCircle2} themeClass={themeClass} />
        <StatCard label={T_.tokenBalance} value={balance} color="#d97706" icon={Coins} themeClass={themeClass} />
      </div>

      <div className="px-5 mb-2"><h2 className="font-bold text-sm">{T_.chooseCategory}</h2></div>
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => onSelectCategory(c.id)} className={`${themeClass.card} rounded-2xl p-3.5 text-left border ${themeClass.border} active:scale-95 transition shadow-sm`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: c.color + "20" }}>
                <Icon size={18} style={{ color: c.color }} />
              </div>
              <div className="text-xs font-bold leading-tight mb-0.5">{lang === "ur" ? c.ur : c.en}</div>
              <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: c.color }}>
                <Coins size={10} /> {c.tokens} Tokens
              </div>
            </button>
          );
        })}
        <button onClick={onGoReport} className="rounded-2xl p-3.5 text-left border-2 border-dashed border-[#0B6E4F]/30 flex flex-col items-center justify-center active:scale-95 transition">
          <Plus size={20} className="text-[#0B6E4F] mb-1" />
          <span className="text-xs font-bold text-[#0B6E4F]">{T_.reportIssue}</span>
        </button>
      </div>

      <div className="px-5 mb-2"><h2 className="font-bold text-sm">{T_.recentReports}</h2></div>
      <div className="px-5 flex flex-col gap-3 pb-4">
        {complaints.length === 0 && (
          <div className={`${themeClass.card} rounded-2xl p-6 text-center border ${themeClass.border}`}>
            <ClipboardList size={26} className="mx-auto text-gray-300 mb-2" />
            <p className={`text-xs ${themeClass.sub}`}>{T_.noReports}</p>
          </div>
        )}
        {complaints.slice(0, 8).map((c) => <ComplaintCard key={c.id} c={c} lang={lang} themeClass={themeClass} />)}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon, themeClass }) {
  return (
    <div className={`${themeClass.card} rounded-2xl p-3 border ${themeClass.border} shadow-sm`}>
      <Icon size={15} style={{ color }} className="mb-1.5" />
      <div className="text-lg font-extrabold leading-none">{value}</div>
      <div className={`text-[10px] mt-1 ${themeClass.sub} leading-tight`}>{label}</div>
    </div>
  );
}

function ComplaintCard({ c, lang, themeClass }) {
  const cat = CATEGORY_MAP[c.category];
  const Icon = cat.icon;
  return (
    <div className={`${themeClass.card} rounded-2xl p-3.5 border ${themeClass.border} shadow-sm`}>
      <div className="flex gap-3">
        {c.photo ? <img src={c.photo} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" /> : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><ImageIcon size={20} className="text-gray-300" /></div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={13} style={{ color: cat.color }} />
            <span className="text-xs font-bold truncate">{lang === "ur" ? cat.ur : cat.en}</span>
          </div>
          <p className={`text-[11px] ${themeClass.sub} truncate mb-1.5`}>{c.landmark || c.address}</p>
          <StatusBadge status={c.status} lang={lang} small />
        </div>
      </div>
      <div className="mt-3"><StatusProgressBar status={c.status} lang={lang} /></div>
    </div>
  );
}

/* ---------------- Report Screen ---------------- */

function ReportScreen({ token, lang, T_, toast, prefillCategory, themeClass, onDone }) {
  const [category, setCategory] = useState(prefillCategory || null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [loc, setLoc] = useState({ lat: null, lng: null, address: "" });
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const { blob, previewUrl } = await compressImage(file, 1024, 0.7);
      setPhotoBlob(blob);
      setPhotoPreview(previewUrl);
    } catch {
      toast("Could not process image.", "error");
    }
    setCompressing(false);
  };

  const submit = async () => {
    if (!category) return toast(T_.selectCategoryFirst, "error");
    if (!photoBlob) return toast(T_.addPhotoFirst, "error");
    if (!loc.lat) return toast(T_.pinLocationFirst, "error");

    setSubmitting(true);
    try {
      await createComplaint(token, {
        category, lat: loc.lat, lng: loc.lng, address: loc.address,
        landmark: landmark.trim(), description: description.trim(), photoBlob,
      });
      toast(T_.reportSubmitted);
      onDone();
    } catch (e) {
      toast(e.message || "Could not submit report.", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="cx-scroll overflow-y-auto pb-6">
      <TopBar title={T_.reportIssue} themeClass={themeClass} />

      <div className="px-5 mb-5">
        <label className="text-xs font-bold mb-2 block">{T_.selectCategory}</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`rounded-xl p-2.5 flex flex-col items-center gap-1.5 border-2 transition ${themeClass.card}`} style={active ? { borderColor: c.color, backgroundColor: c.color + "12" } : { borderColor: "transparent" }}>
                <Icon size={18} style={{ color: c.color }} />
                <span className="text-[10px] font-semibold text-center leading-tight">{lang === "ur" ? c.ur : c.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mb-5">
        <label className="text-xs font-bold mb-2 block">{T_.addPhoto}</label>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="" className="w-full h-44 object-cover rounded-xl" />
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full font-semibold">
              {lang === "ur" ? "Tabdeel Karein" : "Change"}
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className={`w-full h-32 rounded-xl border-2 border-dashed ${themeClass.border} flex flex-col items-center justify-center gap-1.5 ${themeClass.sub}`}>
            {compressing ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
            <span className="text-xs">{compressing ? T_.compressing : T_.tapToCapture}</span>
          </button>
        )}
      </div>

      <div className="px-5 mb-5">
        <label className="text-xs font-bold mb-2 block">{T_.pinLocation}</label>
        <MapPicker value={loc} onChange={setLoc} T_={T_} />
      </div>

      <div className="px-5 mb-4">
        <label className="text-xs font-bold mb-2 block">{T_.landmark}</label>
        <textarea value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder={T_.landmarkPlaceholder} rows={2} className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${themeClass.input}`} />
      </div>

      <div className="px-5 mb-6">
        <label className="text-xs font-bold mb-2 block">{T_.description}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={T_.descriptionPlaceholder} rows={3} className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border ${themeClass.input}`} />
      </div>

      <div className="px-5">
        <button onClick={submit} disabled={submitting} className="w-full py-3.5 rounded-2xl bg-[#0B6E4F] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <ClipboardList size={17} />}
          {T_.submitReport}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Wallet Screen ---------------- */

function WalletScreen({ token, user, lang, T_, toast, themeClass }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [tx, setTx] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, totalEarned: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchWalletTx(token), fetchMyWithdrawals(token), fetchWalletSummary(token)])
      .then(([t, w, s]) => { if (!cancelled) { setTx(t); setWithdrawals(w); setSummary(s); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  if (showWithdraw) {
    return (
      <WithdrawScreen
        token={token} user={user} lang={lang} T_={T_} toast={toast} themeClass={themeClass}
        balance={summary.balance}
        onBack={() => { setShowWithdraw(false); setRefreshKey((k) => k + 1); }}
      />
    );
  }

  return (
    <div className="cx-scroll overflow-y-auto pb-6">
      <TopBar title={T_.walletTitle} themeClass={themeClass} />

      <div className="px-5 mb-5">
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0B6E4F,#0a5540)" }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-xs text-white/70 mb-1 relative">{T_.currentBalance}</p>
          <div className="flex items-end gap-2 relative">
            <span className="text-3xl font-extrabold">{summary.balance}</span>
            <span className="text-sm font-semibold text-white/80 mb-1">Tokens</span>
          </div>
          <p className="text-xs text-white/70 mt-1 relative">≈ PKR {summary.balance.toLocaleString()}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/15 relative">
            <div>
              <p className="text-[10px] text-white/60">{T_.totalEarned}</p>
              <p className="text-sm font-bold">{summary.totalEarned} Tokens</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowWithdraw(true)} className="w-full mt-3 py-3 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <CreditCard size={16} /> {T_.withdraw}
        </button>
      </div>

      {withdrawals.length > 0 && (
        <div className="px-5 mb-5">
          <h2 className="font-bold text-sm mb-2">{T_.myRequests}</h2>
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => (
              <div key={w.id} className={`${themeClass.card} rounded-xl p-3 border ${themeClass.border} flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-bold">PKR {w.amount}</p>
                  <p className={`text-[10px] ${themeClass.sub}`}>{PROVIDERS.find((p) => p.id === w.provider)?.label} · {fmtDate(w.createdAt, lang)}</p>
                </div>
                <WithdrawStatusBadge status={w.status} T_={T_} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5">
        <h2 className="font-bold text-sm mb-2">{T_.ledger}</h2>
        <div className="flex flex-col gap-2">
          {tx.length === 0 && (
            <div className={`${themeClass.card} rounded-2xl p-6 text-center border ${themeClass.border}`}>
              <Coins size={24} className="mx-auto text-gray-300 mb-2" />
              <p className={`text-xs ${themeClass.sub}`}>{T_.noTransactions}</p>
            </div>
          )}
          {tx.map((t) => (
            <div key={t.id} className={`${themeClass.card} rounded-xl p-3 border ${themeClass.border} flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.amount > 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                {t.amount > 0 ? <ArrowDownRight size={16} className="text-emerald-600" /> : <ArrowUpRight size={16} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{t.label}</p>
                <p className={`text-[10px] ${themeClass.sub}`}>{fmtDate(t.createdAt, lang)}</p>
              </div>
              <span className={`text-sm font-extrabold ${t.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WithdrawStatusBadge({ status, T_ }) {
  const map = {
    pending_review: { label: T_.pendingReview, color: "#d97706" },
    approved_paid: { label: T_.approvedPaid, color: "#16a34a" },
    rejected: { label: T_.rejectedStatus, color: "#dc2626" },
  };
  const m = map[status];
  return <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: m.color + "1A", color: m.color }}>{m.label}</span>;
}

/* ---------------- Withdraw Screen ---------------- */

function WithdrawScreen({ token, user, lang, T_, toast, themeClass, balance, onBack }) {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("jazzcash");
  const [holder, setHolder] = useState(user.name || "");
  const [account, setAccount] = useState("");
  const [cnic, setCnic] = useState("");
  const [saveProfileChk, setSaveProfileChk] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayoutProfile(token).then((p) => {
      if (p) { setProvider(p.provider); setHolder(p.holder); setAccount(p.account); setCnic(p.cnic || ""); }
    }).catch(() => {});
  }, [token]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < MIN_WITHDRAWAL) return toast(T_.minWithdraw, "error");
    if (amt > balance) return toast(T_.insufficientBalance, "error");
    if (!holder.trim() || !account.trim()) {
      return toast(lang === "ur" ? "Baraye meherbani tamam maloomat darj karein." : "Please fill in all payout details.", "error");
    }
    setSubmitting(true);
    try {
      await createWithdrawal(token, { amount: amt, provider, holder: holder.trim(), account: account.trim(), cnic: cnic.trim(), saveProfile: saveProfileChk });
      toast(T_.withdrawalSubmitted);
      onBack();
    } catch (e) {
      toast(e.message || "Could not submit withdrawal.", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="cx-scroll overflow-y-auto pb-6">
      <TopBar title={T_.withdrawTitle} themeClass={themeClass} right={<button onClick={onBack} className="p-2 rounded-full bg-black/5"><ArrowLeft size={16} /></button>} />

      <div className="px-5 mb-4">
        <div className={`${themeClass.card} rounded-xl p-3 border ${themeClass.border} flex items-center justify-between mb-4`}>
          <span className={`text-xs ${themeClass.sub}`}>{T_.currentBalance}</span>
          <span className="text-sm font-extrabold text-[#0B6E4F]">{balance} Tokens</span>
        </div>

        <label className="text-xs font-bold mb-1.5 block">{T_.amount}</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className={`w-full rounded-xl px-3.5 py-3 text-sm outline-none border mb-1 ${themeClass.input}`} />
        <p className={`text-[11px] ${themeClass.sub} mb-4`}>{T_.minWithdraw}</p>

        <label className="text-xs font-bold mb-1.5 block">{T_.provider}</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PROVIDERS.map((p) => (
            <button key={p.id} onClick={() => setProvider(p.id)} className={`py-2.5 rounded-xl text-xs font-semibold border-2 flex items-center justify-center gap-1.5 ${provider === p.id ? "border-[#0B6E4F] bg-[#0B6E4F]/10 text-[#0B6E4F]" : `${themeClass.border} ${themeClass.sub}`}`}>
              {p.id === "bank" ? <Landmark size={13} /> : <Smartphone size={13} />} {p.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold mb-1.5 block">{T_.accountHolder}</label>
        <input value={holder} onChange={(e) => setHolder(e.target.value)} className={`w-full rounded-xl px-3.5 py-3 text-sm outline-none border mb-4 ${themeClass.input}`} />

        <label className="text-xs font-bold mb-1.5 block">{provider === "bank" ? "IBAN" : T_.accountNumber}</label>
        <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={provider === "bank" ? "PKXX BANK 0000 0000 0000 0000" : "03XXXXXXXXX"} className={`w-full rounded-xl px-3.5 py-3 text-sm outline-none border mb-4 ${themeClass.input}`} />

        {provider === "raast" && (
          <>
            <label className="text-xs font-bold mb-1.5 block">{T_.cnic}</label>
            <input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" className={`w-full rounded-xl px-3.5 py-3 text-sm outline-none border mb-4 ${themeClass.input}`} />
          </>
        )}

        <label className="flex items-center gap-2 mb-6 text-xs">
          <input type="checkbox" checked={saveProfileChk} onChange={(e) => setSaveProfileChk(e.target.checked)} className="accent-[#0B6E4F]" />
          {T_.saveProfile}
        </label>

        <button onClick={submit} disabled={submitting} className="w-full py-3.5 rounded-2xl bg-[#0B6E4F] text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60">
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />} {T_.submitWithdrawal}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Notifications Screen ---------------- */

function NotificationsScreen({ token, lang, T_, themeClass, onRead }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchNotifications(token).then((n) => !cancelled && setNotifs(n)).catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      onRead && onRead();
    } catch {}
  };

  return (
    <div className="cx-scroll overflow-y-auto pb-6">
      <TopBar title={T_.notifTitle} themeClass={themeClass} right={notifs.length > 0 && <button onClick={markAllRead} className="text-[11px] font-semibold text-[#0B6E4F]">{T_.markAllRead}</button>} />
      <div className="px-5 flex flex-col gap-2">
        {notifs.length === 0 && (
          <div className={`${themeClass.card} rounded-2xl p-8 text-center border ${themeClass.border}`}>
            <Bell size={26} className="mx-auto text-gray-300 mb-2" />
            <p className={`text-xs ${themeClass.sub}`}>{T_.noNotifs}</p>
          </div>
        )}
        {notifs.map((n) => (
          <div key={n.id} className={`${themeClass.card} rounded-xl p-3.5 border ${themeClass.border} flex gap-3 ${!n.read ? "ring-1 ring-[#0B6E4F]/30" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Bell size={15} className="text-[#0B6E4F]" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{n.title}</p>
              <p className={`text-[11px] ${themeClass.sub} mt-0.5`}>{n.body}</p>
              <p className="text-[10px] text-gray-400 mt-1">{fmtDate(n.createdAt, lang)}</p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-[#0B6E4F] mt-1 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Profile Screen ---------------- */

function ProfileScreen({ token, user, lang, setLang, dark, setDark, T_, toast, themeClass, onLogout, openLegal, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => { fetchPayoutProfile(token).then(setProfile).catch(() => {}); }, [token]);

  const doDelete = async () => {
    try {
      await deleteAccount(token);
      toast(lang === "ur" ? "Account delete ho gaya." : "Account deleted.");
      onDeleted();
    } catch (e) {
      toast(e.message || "Could not delete account.", "error");
    }
  };

  return (
    <div className="cx-scroll overflow-y-auto pb-6">
      <TopBar title={T_.profileTitle} themeClass={themeClass} />

      <div className="px-5 mb-5">
        <div className={`${themeClass.card} rounded-2xl p-4 border ${themeClass.border} flex items-center gap-3`}>
          <div className="w-12 h-12 rounded-full bg-[#0B6E4F] flex items-center justify-center text-white font-bold text-lg shrink-0">{user.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{user.name}</p>
            <p className={`text-xs ${themeClass.sub}`}>{user.phone}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-5">
        <SectionLabel label={T_.language} />
        <div className={`${themeClass.card} rounded-xl border ${themeClass.border} p-1 flex`}>
          <button onClick={() => setLang("en")} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${lang === "en" ? "bg-[#0B6E4F] text-white" : themeClass.sub}`}>English</button>
          <button onClick={() => setLang("ur")} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${lang === "ur" ? "bg-[#0B6E4F] text-white" : themeClass.sub}`}>Roman Urdu</button>
        </div>
      </div>

      <div className="px-5 mb-5">
        <SectionLabel label={T_.theme} />
        <div className={`${themeClass.card} rounded-xl border ${themeClass.border} p-1 flex`}>
          <button onClick={() => setDark(false)} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${!dark ? "bg-[#0B6E4F] text-white" : themeClass.sub}`}><Sun size={13} />{T_.light}</button>
          <button onClick={() => setDark(true)} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${dark ? "bg-[#0B6E4F] text-white" : themeClass.sub}`}><Moon size={13} />{T_.dark}</button>
        </div>
      </div>

      {profile && (
        <div className="px-5 mb-5">
          <SectionLabel label={T_.savedProfiles} />
          <div className={`${themeClass.card} rounded-xl border ${themeClass.border} p-3.5 flex items-center gap-3`}>
            <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center shrink-0">{profile.provider === "bank" ? <Landmark size={15} /> : <Smartphone size={15} />}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold">{PROVIDERS.find((p) => p.id === profile.provider)?.label}</p>
              <p className={`text-[11px] ${themeClass.sub} truncate`}>{profile.holder} · {profile.account}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mb-5">
        <SectionLabel label={T_.legal} />
        <div className={`${themeClass.card} rounded-xl border ${themeClass.border} divide-y ${themeClass.border} overflow-hidden`}>
          {[
            { key: "privacyPolicy", label: T_.privacyPolicy, icon: FileText },
            { key: "termsOfService", label: T_.termsOfService, icon: FileText },
            { key: "disclaimer", label: T_.disclaimer, icon: AlertTriangle },
          ].map((it) => (
            <button key={it.key} onClick={() => openLegal(it.key)} className="w-full flex items-center justify-between px-3.5 py-3">
              <span className="flex items-center gap-2.5 text-xs font-semibold"><it.icon size={14} className={themeClass.sub} />{it.label}</span>
              <ChevronRight size={14} className={themeClass.sub} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2.5">
        <button onClick={onLogout} className={`w-full py-3 rounded-xl border ${themeClass.border} font-semibold text-sm flex items-center justify-center gap-2`}><LogOut size={15} /> {T_.logout}</button>
        <button onClick={() => setConfirmDelete(true)} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"><Trash2 size={15} /> {T_.deleteAccount}</button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center mb-3"><Trash2 className="text-red-600" size={20} /></div>
            <h3 className="font-bold text-base mb-1.5">{T_.deleteConfirmTitle}</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">{T_.deleteConfirmBody}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">{T_.cancel}</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white">{T_.confirmDelete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">{label}</p>;
}

/* ================================================================
   ADMIN APP
   ================================================================ */

function AdminApp({ token, lang, setLang, T_, toast, onLogout, themeClass }) {
  const [tab, setTab] = useState("overview");
  const [selectedId, setSelectedId] = useState(null);

  const tabs = [
    { id: "overview", label: T_.overview, icon: TrendingUp },
    { id: "complaints", label: T_.complaints, icon: ClipboardList },
    { id: "payouts", label: T_.payouts, icon: CreditCard },
    { id: "export", label: T_.exportData, icon: Download },
  ];

  return (
    <div className="cx-scroll overflow-y-auto min-h-[700px]">
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2"><Building2 size={20} className="text-[#0B6E4F]" />{T_.adminDashboard}</h1>
          <p className={`text-xs mt-0.5 ${themeClass.sub}`}>CivicFix Pakistan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === "en" ? "ur" : "en")} className="p-2 rounded-full bg-black/5"><Globe size={15} /></button>
          <button onClick={onLogout} className="p-2 rounded-full bg-black/5"><LogOut size={15} /></button>
        </div>
      </div>

      <div className="px-5 flex gap-2 mb-4 overflow-x-auto cx-scroll">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedId(null); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${tab === t.id ? "bg-[#0B6E4F] text-white" : `${themeClass.card} border ${themeClass.border} ${themeClass.sub}`}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <AdminOverview token={token} lang={lang} T_={T_} themeClass={themeClass} />}
      {tab === "complaints" && (
        selectedId
          ? <AdminComplaintDetail token={token} complaintId={selectedId} lang={lang} T_={T_} toast={toast} themeClass={themeClass} onBack={() => setSelectedId(null)} />
          : <AdminComplaintsList token={token} lang={lang} T_={T_} themeClass={themeClass} onSelect={(c) => setSelectedId(c.id)} />
      )}
      {tab === "payouts" && <AdminPayouts token={token} lang={lang} T_={T_} toast={toast} themeClass={themeClass} />}
      {tab === "export" && <AdminExport token={token} T_={T_} themeClass={themeClass} toast={toast} />}
    </div>
  );
}

function AdminOverview({ token, lang, T_, themeClass }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 });
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchAdminStats(token).then(setStats).catch(() => {});
    fetchAdminComplaints(token, {}).then(setComplaints).catch(() => {});
  }, [token]);

  return (
    <div className="px-5 pb-6">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label={T_.totalComplaints} value={stats.total} color="#0B6E4F" icon={ClipboardList} themeClass={themeClass} />
        <StatCard label={T_.pendingCount} value={stats.pending} color="#d97706" icon={Clock} themeClass={themeClass} />
        <StatCard label={T_.inProgressCount} value={stats.in_progress} color="#2563eb" icon={Loader2} themeClass={themeClass} />
        <StatCard label={T_.resolvedCount} value={stats.resolved} color="#16a34a" icon={CheckCircle2} themeClass={themeClass} />
      </div>
      <AdminMap complaints={complaints} />
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(STATUS_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />{m[lang]}</div>
        ))}
      </div>
    </div>
  );
}

function AdminComplaintsList({ token, lang, T_, themeClass, onSelect }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetchAdminComplaints(token, { status: filter, q }).then((c) => !cancelled && setList(c)).catch(() => {});
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [token, filter, q]);

  return (
    <div className="px-5 pb-6">
      <div className={`flex items-center gap-2 ${themeClass.card} border ${themeClass.border} rounded-xl px-3 py-2.5 mb-3`}>
        <Search size={14} className={themeClass.sub} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T_.searchPlaceholder} className="bg-transparent outline-none text-xs flex-1" />
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto cx-scroll">
        {["all", ...STATUS_ORDER].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === s ? "bg-gray-900 text-white" : `${themeClass.card} border ${themeClass.border} ${themeClass.sub}`}`}>
            {s === "all" ? T_.filterAll : STATUS_META[s][lang]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((c) => {
          const cat = CATEGORY_MAP[c.category];
          return (
            <button key={c.id} onClick={() => onSelect(c)} className={`${themeClass.card} rounded-xl p-3 border ${themeClass.border} flex gap-3 text-left`}>
              {c.photo ? <img src={c.photo} className="w-14 h-14 rounded-lg object-cover shrink-0" /> : <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{lang === "ur" ? cat.ur : cat.en}</span>
                  <StatusBadge status={c.status} lang={lang} small />
                </div>
                <p className={`text-[11px] ${themeClass.sub} truncate mt-0.5`}>{c.reporterName} · {c.landmark || c.address}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(c.createdAt, lang)}</p>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className={`text-xs ${themeClass.sub} text-center py-8`}>No complaints found.</p>}
      </div>
    </div>
  );
}

function AdminComplaintDetail({ token, complaintId, lang, T_, toast, themeClass, onBack }) {
  const [c, setC] = useState(null);
  const [status, setStatus] = useState(null);
  const [resPhotoBlob, setResPhotoBlob] = useState(null);
  const [resPhotoPreview, setResPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchAdminComplaint(token, complaintId)
      .then((data) => { setC(data); setStatus(data.status); setResPhotoPreview(data.resolutionPhoto || null); })
      .catch(() => toast("Could not load complaint.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, complaintId]);

  if (!c) return <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>;
  const cat = CATEGORY_MAP[c.category];

  const handleResPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { blob, previewUrl } = await compressImage(file, 1024, 0.7);
    setResPhotoBlob(blob);
    setResPhotoPreview(previewUrl);
  };

  const save = async () => {
    if (status === "resolved" && !resPhotoBlob && !c.resolutionPhoto) {
      toast(T_.resolutionPhotoRequired, "error");
      return;
    }
    setSaving(true);
    try {
      await updateComplaintStatus(token, c.id, { status, resolutionPhotoBlob: resPhotoBlob });
      toast(T_.statusUpdated);
      onBack();
    } catch (e) {
      toast(e.message || "Could not update status.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="px-5 pb-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold mb-4"><ArrowLeft size={14} /> {T_.complaints}</button>

      <div className={`${themeClass.card} rounded-2xl border ${themeClass.border} overflow-hidden mb-4`}>
        {c.photo && <img src={c.photo} className="w-full h-52 object-cover" />}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-extrabold">{lang === "ur" ? cat.ur : cat.en}</span>
            <StatusBadge status={c.status} lang={lang} />
          </div>
          <p className="text-[11px] text-gray-400 mb-3">{T_.complaintId}: {c.id}</p>

          <InfoRow icon={User} label={T_.reporterInfo} value={`${c.reporterName || "—"} · ${c.reporterPhone || "—"}`} />
          <InfoRow icon={MapPin} label={T_.address} value={c.address || "—"} />
          <InfoRow icon={Building2} label={T_.landmark} value={c.landmark || "—"} />
          {c.description && <InfoRow icon={FileText} label={T_.description} value={c.description} />}
          <InfoRow icon={Clock} label={T_.reportedOn} value={fmtDate(c.createdAt, lang)} />
        </div>
      </div>

      <AdminMap complaints={[c]} />

      <div className={`${themeClass.card} rounded-2xl border ${themeClass.border} p-4 mt-4`}>
        <label className="text-xs font-bold mb-2 block">{T_.updateStatus}</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {STATUS_ORDER.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className="py-2.5 rounded-xl text-xs font-semibold border-2 flex items-center justify-center gap-1.5" style={status === s ? { borderColor: STATUS_META[s].color, backgroundColor: STATUS_META[s].color + "15", color: STATUS_META[s].color } : { borderColor: "transparent" }}>
              {STATUS_META[s][lang]}
            </button>
          ))}
        </div>

        {status === "resolved" && (
          <div className="mb-4">
            <label className="text-xs font-bold mb-2 block">{T_.resolutionPhoto}</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleResPhoto} />
            {resPhotoPreview ? (
              <img src={resPhotoPreview} onClick={() => fileRef.current?.click()} className="w-full h-36 object-cover rounded-xl" />
            ) : (
              <button onClick={() => fileRef.current?.click()} className={`w-full h-28 rounded-xl border-2 border-dashed ${themeClass.border} flex flex-col items-center justify-center gap-1 ${themeClass.sub}`}>
                <Camera size={20} /> <span className="text-xs">{T_.resolutionPhoto}</span>
              </button>
            )}
          </div>
        )}

        <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-[#0B6E4F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {T_.saveUpdate}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 mb-2.5">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0"><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs font-medium break-words">{value}</p></div>
    </div>
  );
}

function AdminPayouts({ token, lang, T_, toast, themeClass }) {
  const [list, setList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { fetchAdminWithdrawals(token, {}).then(setList).catch(() => {}); }, [token, refreshKey]);

  const decide = async (w, approve) => {
    try {
      await decideWithdrawal(token, w.id, approve ? "approve" : "reject");
      toast(approve ? T_.withdrawalApproved : T_.withdrawalRejected);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast(e.message || "Could not process request.", "error");
    }
  };

  return (
    <div className="px-5 pb-6 flex flex-col gap-2.5">
      {list.length === 0 && <p className={`text-xs ${themeClass.sub} text-center py-8`}>{T_.noWithdrawalRequests}</p>}
      {list.map((w) => (
        <div key={w.id} className={`${themeClass.card} rounded-xl border ${themeClass.border} p-3.5`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-extrabold">PKR {w.amount}</span>
            <WithdrawStatusBadge status={w.status} T_={T_} />
          </div>
          <p className="text-[11px] text-gray-500 mb-0.5">{w.userName} · {w.userPhone}</p>
          <p className="text-[11px] text-gray-500 mb-0.5">{PROVIDERS.find((p) => p.id === w.provider)?.label} — {w.holder} — {w.account}{w.cnic ? ` (CNIC: ${w.cnic})` : ""}</p>
          <p className="text-[10px] text-gray-400 mb-2.5">{T_.requestedOn}: {fmtDate(w.createdAt, lang)}</p>
          {w.status === "pending_review" && (
            <div className="flex gap-2">
              <button onClick={() => decide(w, true)} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">{T_.approveAndPay}</button>
              <button onClick={() => decide(w, false)} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold">{T_.reject}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminExport({ token, T_, themeClass, toast }) {
  const download = async (path, filename) => {
    try {
      await downloadWithAuth(token, path, filename);
    } catch {
      toast("Could not export file.", "error");
    }
  };
  return (
    <div className="px-5 pb-6 flex flex-col gap-3">
      <button onClick={() => download("/api/admin/export/complaints.csv", "civicfix_complaints.csv")} className={`${themeClass.card} border ${themeClass.border} rounded-xl p-4 flex items-center justify-between`}>
        <span className="text-sm font-semibold flex items-center gap-2"><ClipboardList size={16} className="text-[#0B6E4F]" />{T_.exportComplaints}</span>
        <Download size={16} className="text-gray-400" />
      </button>
      <button onClick={() => download("/api/admin/export/payouts.csv", "civicfix_payouts.csv")} className={`${themeClass.card} border ${themeClass.border} rounded-xl p-4 flex items-center justify-between`}>
        <span className="text-sm font-semibold flex items-center gap-2"><CreditCard size={16} className="text-[#0B6E4F]" />{T_.exportPayouts}</span>
        <Download size={16} className="text-gray-400" />
      </button>
    </div>
  );
}
