// @ts-nocheck

/* ═══════════════════════════════════════════════════════
   UNIVERSAL TOAST  –  showToast(msg, type, duration)
════════════════════════════════════════════════════════ */
function showToast(msg, type = "success", duration = 3200) {
  const ICONS  = { success:"✅", error:"❌", info:"ℹ️", warning:"⚠️" };
  const COLORS = {
    success:{ bg:"#d1fae5", border:"#6ee7b7", text:"#065f46" },
    error:  { bg:"#fee2e2", border:"#fca5a5", text:"#991b1b" },
    info:   { bg:"#dbeafe", border:"#93c5fd", text:"#1e40af" },
    warning:{ bg:"#fef3c7", border:"#fcd34d", text:"#92400e" },
  };
  const c = COLORS[type]||COLORS.info;
  const existing = document.querySelectorAll(".hp-toast");
  const offset   = 24 + existing.length*68;
  const t = document.createElement("div");
  t.className="hp-toast";
  t.style.cssText=`position:fixed;bottom:${offset}px;right:24px;z-index:99999;display:flex;align-items:center;gap:10px;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:13px 18px;border-radius:12px;font-size:0.9rem;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,0.12);max-width:340px;animation:toastIn .28s cubic-bezier(.34,1.56,.64,1) both;font-family:"Segoe UI",Tahoma,sans-serif;`;
  t.innerHTML=`<span style="font-size:1.1rem;flex-shrink:0;">${ICONS[type]}</span><span>${msg}</span>`;
  if (!document.getElementById("toastStyle")) {
    const s=document.createElement("style"); s.id="toastStyle";
    s.textContent=`@keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes toastOut{to{opacity:0;transform:translateY(12px) scale(.95)}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.animation="toastOut .25s ease forwards"; setTimeout(()=>t.remove(),260); },duration);
}

/* ═══════════════════════════════════════════════════════
   UNIVERSAL CONFIRM  –  returns Promise<boolean>
════════════════════════════════════════════════════════ */
function showConfirm({ title="Are you sure?", message="", confirmText="Confirm", cancelText="Cancel", danger=false }={}) {
  return new Promise(resolve => {
    document.getElementById("hpConfirmModal")?.remove();
    const el=document.createElement("div"); el.id="hpConfirmModal";
    el.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:statFadeIn .18s ease;font-family:'Segoe UI',Tahoma,sans-serif;";
    const btnColor=danger?"background:#d44d7c;color:#fff;":"background:#1870c7;color:#fff;";
    el.innerHTML=`<div style="background:#fff;border-radius:16px;padding:28px 26px;max-width:380px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.18);animation:statSlideUp .22s ease;"><h3 style="font-size:1.1rem;font-weight:700;color:#222;margin:0 0 8px;">${title}</h3>${message?`<p style="font-size:0.88rem;color:#666;margin:0 0 22px;line-height:1.55;">${message}</p>`:`<div style="margin-bottom:22px;"></div>`}<div style="display:flex;gap:10px;"><button id="hpConfirmYes" style="flex:1;padding:11px 0;border:none;border-radius:30px;${btnColor}font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;">${confirmText}</button><button id="hpConfirmNo" style="flex:1;padding:11px 0;border:2px solid #e0e0e0;border-radius:30px;background:none;color:#777;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit;">${cancelText}</button></div></div>`;
    document.body.appendChild(el); document.body.style.overflow="hidden";
    const done=v=>{ el.remove(); document.body.style.overflow=""; resolve(v); };
    document.getElementById("hpConfirmYes").onclick=()=>done(true);
    document.getElementById("hpConfirmNo").onclick=()=>done(false);
    el.addEventListener("click",e=>{ if(e.target===el)done(false); });
  });
}

const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content      = document.getElementById("dashboardContent");

/* ===============================
   Mobile Menu Toggle
================================ */
const dashboardMenuToggle = document.getElementById("dashboardMenuToggle");
const dashboardSidebar    = document.getElementById("dashboardSidebar");
const dashboardOverlay    = document.getElementById("dashboardOverlay");

if (dashboardMenuToggle && dashboardSidebar && dashboardOverlay) {
  dashboardMenuToggle.addEventListener("click", () => {
    dashboardMenuToggle.classList.toggle("active");
    dashboardSidebar.classList.toggle("active");
    dashboardOverlay.classList.toggle("active");
    document.body.style.overflow = dashboardSidebar.classList.contains("active") ? "hidden" : "";
  });
  dashboardOverlay.addEventListener("click", closeSidebarMobile);
  sidebarLinks.forEach((link) => link.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeSidebarMobile();
  }));
}

function closeSidebarMobile() {
  dashboardMenuToggle.classList.remove("active");
  dashboardSidebar.classList.remove("active");
  dashboardOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* ===============================
   Sidebar Navigation
================================ */
sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sidebarLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    const s = link.dataset.section;
    if (s === "dashboard")  loadDashboard();
    if (s === "profile")    loadProfile();
    if (s === "bookings")   loadBookingsSection();
    if (s === "employees")  loadEmployees();
    if (s === "duty")       loadDutySection();
    if (s === "leave")      loadLeaveSection();
    if (s === "messages")   loadMessagesSection();
    if (s === "payroll")    loadPayrollSection();
    if (s === "feedback")   loadFeedbackSection();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  pollUnreadMessages();
  setInterval(pollUnreadMessages, 30000);

  document.getElementById("adminLogoutBtn")?.addEventListener("click", function(e) {
    e.preventDefault();
    const form = document.getElementById("adminLogoutForm");
    showLogoutConfirmAdmin(() => form.submit());
  });
});

/* ===============================
   LOGOUT CONFIRM (ADMIN)
================================ */
function showLogoutConfirmAdmin(onConfirm) {
  document.getElementById("logoutConfirmAdmin")?.remove();
  const el = document.createElement("div");
  el.id = "logoutConfirmAdmin";
  el.className = "logout-confirm-overlay";
  el.innerHTML = `
    <div class="logout-confirm-box">
      <div class="logout-confirm-icon">👋</div>
      <h3>Logging Out?</h3>
      <p>Are you sure you want to log out of the admin panel?</p>
      <div class="logout-confirm-btns">
        <button class="logout-confirm-yes" id="ladmYes">Yes, Log Out</button>
        <button class="logout-confirm-no"  id="ladmNo">Stay</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  document.body.style.overflow = "hidden";
  const close = () => { el.remove(); document.body.style.overflow = ""; };
  document.getElementById("ladmNo").onclick = close;
  el.addEventListener("click", e => { if (e.target === el) close(); });
  document.getElementById("ladmYes").onclick = () => { close(); onConfirm(); };
}

/* ===============================
   SHARED HELPERS
================================ */
const COLOR_MAP = {
  pink:  { bg: "#fce7f0", num: "#9d174d", border: "#f9c0d2" },
  blue:  { bg: "#dbeafe", num: "#1e40af", border: "#93c5fd" },
  teal:  { bg: "#d1fae5", num: "#065f46", border: "#6ee7b7" },
  amber: { bg: "#fef3c7", num: "#92400e", border: "#fcd34d" },
  red:   { bg: "#fee2e2", num: "#991b1b", border: "#fca5a5" },
  green: { bg: "#dcfce7", num: "#166534", border: "#86efac" },
};

function skeletonCards(n) {
  return [...Array(n)].map(() => `
    <div class="admin-stat-card admin-stat-loading">
      <div class="admin-stat-skeleton-label"></div>
      <div class="admin-stat-skeleton-num"></div>
    </div>`).join("");
}

/* ===============================
   1. DASHBOARD
================================ */
async function loadDashboard() {
  content.innerHTML = `
    <h2>Admin Dashboard</h2>
    <div class="admin-stats-section">
      <h3 class="admin-stats-title">Today's Overview</h3>
      <div class="admin-stats-grid" id="adminStatsGrid">${skeletonCards(6)}</div>
    </div>
    <div class="admin-stats-section">
      <h3 class="admin-stats-title">All-Time Totals</h3>
      <div class="admin-stats-grid" id="adminTotalsGrid">${skeletonCards(4)}</div>
    </div>
  `;
  try {
    const res  = await fetch("/api/admin/dashboard-stats");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    renderDashboardStats(data.stats);
  } catch (err) {
    console.error("Stats error:", err);
    document.getElementById("adminStatsGrid").innerHTML = `<p style="color:#999;font-size:13px;">Could not load stats.</p>`;
    document.getElementById("adminTotalsGrid").innerHTML = "";
  }
}

function renderDashboardStats(s) {
  const todayCards = [
    { label: "Grooming today",         value: s.groomingToday,    color: "pink",  fetchKey: "groomingToday"    },
    { label: "Hotel check-ins today",  value: s.checkInsToday,    color: "blue",  fetchKey: "checkInsToday"    },
    { label: "Hotel check-outs today", value: s.checkOutsToday,   color: "teal",  fetchKey: "checkOutsToday"   },
    { label: "Pending approvals",      value: s.pendingTotal,     color: "amber", fetchKey: "pendingTotal"     },
    { label: "Messages unread",        value: s.unreadMessages,   color: "red"                                 },
    { label: "Active hotel stays",     value: s.activeHotelStays, color: "green", fetchKey: "activeHotelStays" },
  ];
  const totalCards = [
    { label: "Total grooming bookings", value: s.totalGrooming,  color: "pink"  },
    { label: "Total hotel bookings",    value: s.totalHotel,     color: "blue"  },
    { label: "Total customers",         value: s.totalCustomers, color: "teal"  },
    { label: "Total employees",         value: s.totalEmployees, color: "green" },
  ];

  function buildCards(cards, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    cards.forEach(({ label, value, color, fetchKey }) => {
      const c    = COLOR_MAP[color] || COLOR_MAP.blue;
      const card = document.createElement("div");
      card.className = "admin-stat-card" + (fetchKey ? " admin-stat-clickable" : "");
      card.style.cssText = `background:${c.bg};border-color:${c.border};`;
      card.innerHTML = `
        <p class="admin-stat-label">${label}</p>
        <p class="admin-stat-num" style="color:${c.num};">${value ?? "—"}</p>
        ${fetchKey ? `<span class="admin-stat-hint">Click to view details</span>` : ""}
      `;
      if (fetchKey) card.addEventListener("click", () => openStatModal(label, fetchKey, c));
      grid.appendChild(card);
    });
  }
  buildCards(todayCards, "adminStatsGrid");
  buildCards(totalCards, "adminTotalsGrid");
}

async function openStatModal(title, fetchKey, colors) {
  document.getElementById("statDetailModal")?.remove();
  const modal = document.createElement("div");
  modal.id = "statDetailModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal">
      <div class="stat-modal-header" style="border-bottom-color:${colors.border};">
        <h3 class="stat-modal-title" style="color:${colors.num};">${title}</h3>
        <button class="stat-modal-close" id="statModalClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" id="statModalBody">
        <div class="stat-modal-loading">
          <div class="stat-modal-spinner"></div>
          <p>Loading bookings…</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  const closeModal = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("statModalClose").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  try {
    const res  = await fetch(`/api/admin/dashboard-stats/detail?type=${fetchKey}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    renderStatModalBody(data.bookings, closeModal);
  } catch (err) {
    document.getElementById("statModalBody").innerHTML = `<p class="stat-modal-error">Could not load booking details.</p>`;
  }
}

function renderStatModalBody(bookings, closeModal) {
  const body = document.getElementById("statModalBody");
  if (!bookings || !bookings.length) { body.innerHTML = `<p class="stat-modal-empty">No bookings found.</p>`; return; }
  const cards = bookings.map((b) => {
    const isHotel     = b.type === "hotel";
    const statusClass = b.status === "approved" ? "approved" : b.status === "rejected" ? "rejected" : "pending";
    const petsStr     = Array.isArray(b.pets) && b.pets.length ? b.pets.map((p) => p.name || p).join(", ") : "N/A";
    const detailLine  = isHotel
      ? `Check-in: ${new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"})} ${b.appointmentTime||""} &bull; Check-out: ${b.hotelCheckoutDate?new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"}):"N/A"}`
      : `Time: ${b.appointmentTime||"N/A"} &bull; ${Array.isArray(b.services)?b.services.join(", "):(b.services||"N/A")}`;
    return `
      <div class="stat-modal-card">
        <div class="stat-modal-card-top">
          <div>
            <p class="stat-modal-card-name">${b.userName||"Unknown"}</p>
            <p class="stat-modal-card-email">${b.userEmail||""}</p>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="cal-type-pill ${isHotel?"cal-pill-hotel":"cal-pill-grooming"}">${b.type}</span>
            <span class="booking-status ${statusClass}">${statusClass.toUpperCase()}</span>
          </div>
        </div>
        <p class="stat-modal-card-detail">${detailLine}</p>
        <p class="stat-modal-card-pets">Pets: ${petsStr}</p>
        <p class="stat-modal-card-contact">${b.userContact||""}</p>
      </div>`;
  }).join("");
  body.innerHTML = `
    <div class="stat-modal-cards">${cards}</div>
    <div class="stat-modal-footer">
      <button class="stat-modal-goto-btn" id="statModalGotoCalBtn">View on Booking Calendar &rarr;</button>
    </div>
  `;
  document.getElementById("statModalGotoCalBtn").addEventListener("click", () => {
    closeModal();
    sidebarLinks.forEach((l) => l.classList.remove("active"));
    document.querySelector('[data-section="bookings"]')?.classList.add("active");
    loadBookingsSection();
  });
}

/* ===============================
   2. PROFILE
================================ */
function loadProfile() {
  const el      = content;
  const email   = el.dataset.email   || "";
  const name    = el.dataset.name    || "";
  const contact = el.dataset.contact || "";
  const address = el.dataset.address || "";
  const joined  = el.dataset.joined
    ? new Date(el.dataset.joined).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}) : "—";

  content.innerHTML = `
    <h2>My Profile</h2>

    <div class="profile-section" id="profileViewSection">
      <div class="profile-avatar-row">
        <div class="profile-avatar-circle">${name.charAt(0).toUpperCase()}</div>
        <div>
          <p class="profile-big-name">${name}</p>
          <p class="profile-role-tag">Administrator</p>
        </div>
      </div>
      <div class="profile-info-grid">
        <div class="profile-info-item">
          <span class="profile-info-label">Email</span>
          <span class="profile-info-value">${email}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Full Name</span>
          <span class="profile-info-value">${name}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Contact</span>
          <span class="profile-info-value">${contact || "—"}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Address</span>
          <span class="profile-info-value">${address || "—"}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Date Joined</span>
          <span class="profile-info-value">${joined}</span>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="user-link" id="editProfileBtn">Edit Profile</button>
        <button class="user-link" id="changePassBtn" style="background:#6c757d;">Change Password</button>
      </div>
    </div>

    <div id="editProfileForm" style="display:none;margin-top:20px;">
      <h3 style="color:#d44d7c;margin-bottom:16px;">Edit Profile</h3>
      <div class="admin-form-box">
        <label class="admin-form-label">Full Name
          <input type="text" id="epName" value="${name}" class="admin-form-input" />
        </label>
        <label class="admin-form-label">Contact
          <input type="text" id="epContact" value="${contact}" class="admin-form-input" />
        </label>
        <label class="admin-form-label">Address
          <input type="text" id="epAddress" value="${address}" class="admin-form-input" />
        </label>
        <div class="admin-form-btns">
          <button class="btn" id="saveProfileBtn">Save Changes</button>
          <button class="btn" id="cancelProfileBtn" style="background:#6c757d;">Cancel</button>
        </div>
        <p id="profileMsg" class="admin-form-msg"></p>
      </div>
    </div>

    <div id="changePasswordForm" style="display:none;margin-top:20px;">
      <h3 style="color:#d44d7c;margin-bottom:16px;">Change Password</h3>
      <div class="admin-form-box">
        <label class="admin-form-label">Current Password
          <input type="password" id="cpCurrent" class="admin-form-input" />
        </label>
        <label class="admin-form-label">New Password
          <input type="password" id="cpNew" class="admin-form-input" />
        </label>
        <label class="admin-form-label">Confirm New Password
          <input type="password" id="cpConfirm" class="admin-form-input" />
        </label>
        <div class="admin-form-btns">
          <button class="btn" id="savePassBtn">Update Password</button>
          <button class="btn" id="cancelPassBtn" style="background:#6c757d;">Cancel</button>
        </div>
        <p id="passMsg" class="admin-form-msg"></p>
      </div>
    </div>
  `;

  document.getElementById("editProfileBtn").onclick = () => {
    document.getElementById("profileViewSection").style.display = "none";
    document.getElementById("editProfileForm").style.display = "block";
    document.getElementById("changePasswordForm").style.display = "none";
  };
  document.getElementById("cancelProfileBtn").onclick = () => {
    document.getElementById("profileViewSection").style.display = "block";
    document.getElementById("editProfileForm").style.display = "none";
  };
  document.getElementById("saveProfileBtn").onclick = async () => {
    const msg  = document.getElementById("profileMsg");
    const body = { fullName: document.getElementById("epName").value.trim(), contact: document.getElementById("epContact").value.trim(), address: document.getElementById("epAddress").value.trim() };
    try {
      const res    = await fetch("/api/user/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const result = await res.json();
      if (result.success) {
        content.dataset.name = body.fullName; content.dataset.contact = body.contact; content.dataset.address = body.address;
        showToast("Profile updated!"); loadProfile();
      } else { msg.textContent = result.message; msg.style.display = "block"; }
    } catch (err) { msg.textContent = "Error saving profile."; msg.style.display = "block"; }
  };

  document.getElementById("changePassBtn").onclick = () => {
    document.getElementById("profileViewSection").style.display = "none";
    document.getElementById("editProfileForm").style.display = "none";
    document.getElementById("changePasswordForm").style.display = "block";
  };
  document.getElementById("cancelPassBtn").onclick = () => {
    document.getElementById("profileViewSection").style.display = "block";
    document.getElementById("changePasswordForm").style.display = "none";
  };
  document.getElementById("savePassBtn").onclick = async () => {
    const msg     = document.getElementById("passMsg");
    const current = document.getElementById("cpCurrent").value;
    const newPass = document.getElementById("cpNew").value;
    const confirm = document.getElementById("cpConfirm").value;
    if (newPass !== confirm) { msg.textContent = "Passwords do not match."; msg.style.display = "block"; return; }
    try {
      const res    = await fetch("/api/user/change-password", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ currentPassword:current, newPassword:newPass }) });
      const result = await res.json();
      if (result.success) { showToast("Password updated!"); loadProfile(); }
      else { msg.textContent = result.message; msg.style.display = "block"; }
    } catch (err) { msg.textContent = "Error updating password."; msg.style.display = "block"; }
  };
}

/* ===============================
   3. EMPLOYEES
================================ */
async function loadEmployees() {
  content.innerHTML = `
    <h2>Employees</h2>
    <button class="btn" id="addEmpBtn" style="margin-bottom:20px;">+ Add Employee</button>

    <div id="empForm" style="display:none;margin-bottom:24px;">
      <div class="admin-form-box" style="max-width:600px;">
        <h3 id="empFormTitle" style="color:#d44d7c;margin-bottom:16px;">Add Employee</h3>
        <input type="hidden" id="empId" />

        <div class="ops-tabs" style="margin-bottom:16px;">
          <button class="ops-tab-btn active" data-tab="info">Info</button>
          <button class="ops-tab-btn" data-tab="payroll">Payroll</button>
        </div>

        <div id="empTabInfo">
          <label class="admin-form-label">Full Name *
            <input type="text" id="empName" class="admin-form-input" placeholder="e.g. Maria Santos" />
          </label>
          <label class="admin-form-label">Role / Position *
            <select id="empRole" class="admin-form-input">
              <option value="">Select role</option>
              <option value="Groomer">Groomer</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Pet Hotel Staff">Pet Hotel Staff</option>
              <option value="Veterinary Assistant">Veterinary Assistant</option>
              <option value="Manager">Manager</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label class="admin-form-label">Email
            <input type="email" id="empEmail" class="admin-form-input" placeholder="email@example.com" />
          </label>
          <label class="admin-form-label">Contact Number
            <input type="text" id="empContact" class="admin-form-input" placeholder="09XX-XXX-XXXX" />
          </label>
          <label class="admin-form-label">Address
            <input type="text" id="empAddress" class="admin-form-input" placeholder="Home address" />
          </label>
          <label class="admin-form-label">Shift Schedule
            <input type="text" id="empShift" class="admin-form-input" placeholder="e.g. Mon–Fri 8AM–5PM" />
          </label>
          <label class="admin-form-label">Date Hired
            <input type="date" id="empDateHired" class="admin-form-input" />
          </label>
          <label class="admin-form-label">Status
            <select id="empStatus" class="admin-form-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on leave">On Leave</option>
            </select>
          </label>
          <label class="admin-form-label">Portal Password
            <input type="password" id="empPassword" class="admin-form-input" placeholder="Set login password" />
            <span style="font-size:0.75rem;color:#aaa;margin-top:3px;display:block;">Leave blank when editing to keep existing password.</span>
          </label>
        </div>

        <div id="empTabPayroll" style="display:none;">
          <p style="font-size:0.82rem;color:#888;margin-bottom:12px;">All amounts in Philippine Peso (₱)</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label class="admin-form-label">Basic Pay (monthly) ₱
              <input type="number" id="empBasicPay" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">Hourly Rate ₱
              <input type="number" id="empHourlyRate" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">Overtime Rate ₱/hr
              <input type="number" id="empOvertimeRate" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">Commission Rate %
              <input type="number" id="empCommissionRate" class="admin-form-input" placeholder="0" min="0" max="100" step="0.1" />
            </label>
          </div>
          <p style="font-weight:600;color:#444;margin:16px 0 8px;">Government Benefits</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label class="admin-form-label">SSS No.
              <input type="text" id="empSSSNo" class="admin-form-input" placeholder="XX-XXXXXXX-X" />
            </label>
            <label class="admin-form-label">SSS Contribution ₱
              <input type="number" id="empSSSAmt" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">PhilHealth No.
              <input type="text" id="empPhilHealthNo" class="admin-form-input" placeholder="XX-XXXXXXXXX-X" />
            </label>
            <label class="admin-form-label">PhilHealth Contribution ₱
              <input type="number" id="empPhilHealthAmt" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">Pag-IBIG No.
              <input type="text" id="empPagIbigNo" class="admin-form-input" placeholder="XXXX-XXXX-XXXX" />
            </label>
            <label class="admin-form-label">Pag-IBIG Contribution ₱
              <input type="number" id="empPagIbigAmt" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
            <label class="admin-form-label">TIN
              <input type="text" id="empTIN" class="admin-form-input" placeholder="XXX-XXX-XXX" />
            </label>
            <label class="admin-form-label">Withholding Tax ₱
              <input type="number" id="empTax" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
            </label>
          </div>
          <p style="font-weight:600;color:#444;margin:16px 0 8px;">Other</p>
          <label class="admin-form-label">Bank / Wallet (for payroll)
            <input type="text" id="empBank" class="admin-form-input" placeholder="e.g. BDO, GCash" />
          </label>
          <label class="admin-form-label">Account Number
            <input type="text" id="empBankAcct" class="admin-form-input" placeholder="Account number" />
          </label>
          <label class="admin-form-label">Notes
            <textarea id="empPayrollNotes" rows="2" class="admin-form-input" style="resize:vertical;" placeholder="Any additional payroll notes..."></textarea>
          </label>
        </div>

        <div class="admin-form-btns" style="margin-top:16px;">
          <button class="btn" id="saveEmpBtn">Save Employee</button>
          <button class="btn" id="cancelEmpBtn" style="background:#6c757d;">Cancel</button>
        </div>
        <p id="empMsg" class="admin-form-msg"></p>
      </div>
    </div>

    <div id="empListWrap"><p>Loading employees...</p></div>
  `;

  document.querySelectorAll("#empForm .ops-tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#empForm .ops-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("empTabInfo").style.display    = btn.dataset.tab === "info"    ? "block" : "none";
      document.getElementById("empTabPayroll").style.display = btn.dataset.tab === "payroll" ? "block" : "none";
    };
  });

  document.getElementById("addEmpBtn").onclick    = () => openEmpForm(null);
  document.getElementById("cancelEmpBtn").onclick = () => { document.getElementById("empForm").style.display = "none"; };
  document.getElementById("saveEmpBtn").onclick   = saveEmployee;
  await fetchAndRenderEmployees();
}

function openEmpForm(emp) {
  const form = document.getElementById("empForm");
  document.getElementById("empFormTitle").textContent = emp ? "Edit Employee" : "Add Employee";

  document.querySelectorAll("#empForm .ops-tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector("#empForm .ops-tab-btn[data-tab='info']").classList.add("active");
  document.getElementById("empTabInfo").style.display    = "block";
  document.getElementById("empTabPayroll").style.display = "none";

  document.getElementById("empId").value        = emp ? emp._id        : "";
  document.getElementById("empName").value      = emp ? emp.name       : "";
  document.getElementById("empRole").value      = emp ? emp.role       : "";
  document.getElementById("empEmail").value     = emp ? emp.email      : "";
  document.getElementById("empContact").value   = emp ? emp.contact    : "";
  document.getElementById("empAddress").value   = emp ? emp.address    : "";
  document.getElementById("empShift").value     = emp ? emp.shift      : "";
  document.getElementById("empDateHired").value = emp && emp.dateHired ? emp.dateHired.slice(0,10) : "";
  document.getElementById("empStatus").value    = emp ? emp.status     : "active";
  document.getElementById("empPassword").value  = "";

  const p = emp?.payroll || {};
  document.getElementById("empBasicPay").value       = p.basicPay       || "";
  document.getElementById("empHourlyRate").value     = p.hourlyRate     || "";
  document.getElementById("empOvertimeRate").value   = p.overtimeRate   || "";
  document.getElementById("empCommissionRate").value = p.commissionRate || "";
  document.getElementById("empSSSNo").value          = p.sssNo          || "";
  document.getElementById("empSSSAmt").value         = p.sssAmt         || "";
  document.getElementById("empPhilHealthNo").value   = p.philHealthNo   || "";
  document.getElementById("empPhilHealthAmt").value  = p.philHealthAmt  || "";
  document.getElementById("empPagIbigNo").value      = p.pagIbigNo      || "";
  document.getElementById("empPagIbigAmt").value     = p.pagIbigAmt     || "";
  document.getElementById("empTIN").value            = p.tin            || "";
  document.getElementById("empTax").value            = p.tax            || "";
  document.getElementById("empBank").value           = p.bank           || "";
  document.getElementById("empBankAcct").value       = p.bankAcct       || "";
  document.getElementById("empPayrollNotes").value   = p.notes          || "";

  document.getElementById("empMsg").style.display = "none";
  form.style.display = "block";
  form.scrollIntoView({ behavior:"smooth", block:"start" });
}

async function saveEmployee() {
  const msg = document.getElementById("empMsg");
  const id  = document.getElementById("empId").value;
  const pw  = document.getElementById("empPassword").value;

  const body = {
    name:      document.getElementById("empName").value.trim(),
    role:      document.getElementById("empRole").value,
    email:     document.getElementById("empEmail").value.trim(),
    contact:   document.getElementById("empContact").value.trim(),
    address:   document.getElementById("empAddress").value.trim(),
    shift:     document.getElementById("empShift").value.trim(),
    dateHired: document.getElementById("empDateHired").value || null,
    status:    document.getElementById("empStatus").value,
    payroll: {
      basicPay:       parseFloat(document.getElementById("empBasicPay").value)       || 0,
      hourlyRate:     parseFloat(document.getElementById("empHourlyRate").value)     || 0,
      overtimeRate:   parseFloat(document.getElementById("empOvertimeRate").value)   || 0,
      commissionRate: parseFloat(document.getElementById("empCommissionRate").value) || 0,
      sssNo:          document.getElementById("empSSSNo").value.trim(),
      sssAmt:         parseFloat(document.getElementById("empSSSAmt").value)         || 0,
      philHealthNo:   document.getElementById("empPhilHealthNo").value.trim(),
      philHealthAmt:  parseFloat(document.getElementById("empPhilHealthAmt").value)  || 0,
      pagIbigNo:      document.getElementById("empPagIbigNo").value.trim(),
      pagIbigAmt:     parseFloat(document.getElementById("empPagIbigAmt").value)     || 0,
      tin:            document.getElementById("empTIN").value.trim(),
      tax:            parseFloat(document.getElementById("empTax").value)            || 0,
      bank:           document.getElementById("empBank").value.trim(),
      bankAcct:       document.getElementById("empBankAcct").value.trim(),
      notes:          document.getElementById("empPayrollNotes").value.trim(),
    },
  };
  if (pw) body.password = pw;
  if (!body.name || !body.role) { msg.textContent = "Name and role are required."; msg.style.display = "block"; return; }

  try {
    const url    = id ? `/api/admin/employees/${id}` : "/api/admin/employees";
    const method = id ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const result = await res.json();
    if (result.success) { document.getElementById("empForm").style.display = "none"; await fetchAndRenderEmployees(); }
    else { msg.textContent = result.message; msg.style.display = "block"; }
  } catch (err) { msg.textContent = "Error saving employee."; msg.style.display = "block"; }
}

async function fetchAndRenderEmployees() {
  const wrap = document.getElementById("empListWrap");
  if (!wrap) return;
  wrap.innerHTML = "<p>Loading...</p>";
  try {
    const res  = await fetch("/api/admin/employees");
    const data = await res.json();
    if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }
    if (!data.employees.length) { wrap.innerHTML = `<p style="color:#999;">No employees yet. Add one above.</p>`; return; }

    const STATUS_COLOR = { active:"#d4edda", inactive:"#f8d7da", "on leave":"#fff3cd" };
    const STATUS_TEXT  = { active:"#155724", inactive:"#721c24", "on leave":"#856404" };

    wrap.innerHTML = `
      <div class="emp-grid">
        ${data.employees.map((e) => `
          <div class="emp-card emp-card-clickable" data-id="${e._id}" style="cursor:pointer;">
            <div class="emp-card-avatar">${(e.name||"?").charAt(0).toUpperCase()}</div>
            <div class="emp-card-info">
              <p class="emp-card-name">${e.name}</p>
              <p class="emp-card-role">${e.role}</p>
              ${e.email   ? `<p class="emp-card-meta">${e.email}</p>`    : ""}
              ${e.contact ? `<p class="emp-card-meta">${e.contact}</p>`  : ""}
              ${e.shift   ? `<p class="emp-card-meta">🕐 ${e.shift}</p>` : ""}
              <span class="emp-status-badge" style="background:${STATUS_COLOR[e.status]||"#e9ecef"};color:${STATUS_TEXT[e.status]||"#333"};">
                ${(e.status||"active").toUpperCase()}
              </span>
            </div>
            <div class="emp-card-actions">
              <button class="emp-edit-btn" data-id="${e._id}">Edit</button>
              <button class="emp-del-btn"  data-id="${e._id}">Delete</button>
            </div>
          </div>`).join("")}
      </div>`;

    wrap.querySelectorAll(".emp-card-clickable").forEach((card) => {
      card.onclick = (ev) => {
        if (ev.target.closest("button")) return;
        const emp = data.employees.find((e) => e._id === card.dataset.id);
        if (emp) openEmpDetail(emp);
      };
    });

    wrap.querySelectorAll(".emp-edit-btn").forEach((btn) => {
      btn.onclick = (ev) => { ev.stopPropagation(); const emp = data.employees.find((e) => e._id === btn.dataset.id); if (emp) openEmpForm(emp); };
    });
    wrap.querySelectorAll(".emp-del-btn").forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.stopPropagation();
        if (!await showConfirm({title:"Confirm Action",message:"Delete this employee?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
        try {
          const res    = await fetch(`/api/admin/employees/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) await fetchAndRenderEmployees();
          else showToast(result.message,"error");
        } catch (err) { showToast("Error deleting employee.","error"); }
      };
    });
  } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading employees.</p>"; }
}

function openEmpDetail(emp) {
  document.getElementById("empDetailModal")?.remove();

  const STATUS_COLOR = { active:"#d4edda", inactive:"#f8d7da", "on leave":"#fff3cd" };
  const STATUS_TEXT  = { active:"#155724", inactive:"#721c24", "on leave":"#856404" };
  const sc = STATUS_COLOR[emp.status] || "#e9ecef";
  const st = STATUS_TEXT[emp.status]  || "#333";
  const p  = emp.payroll || {};

  const fmt   = (v) => v ? `₱${parseFloat(v).toLocaleString("en-PH", {minimumFractionDigits:2})}` : "—";
  const hired = emp.dateHired ? new Date(emp.dateHired).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}) : "—";

  const modal = document.createElement("div");
  modal.id = "empDetailModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:560px;width:95%;">
      <div class="stat-modal-header" style="border-bottom-color:#f9c0d2;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="emp-card-avatar" style="width:44px;height:44px;font-size:1.2rem;flex-shrink:0;">${(emp.name||"?").charAt(0).toUpperCase()}</div>
          <div>
            <h3 class="stat-modal-title" style="color:#9d174d;margin:0;">${emp.name}</h3>
            <p style="margin:0;font-size:0.85rem;color:#888;">${emp.role}</p>
          </div>
        </div>
        <button class="stat-modal-close" id="empDetailClose">&#x2715;</button>
      </div>
      <div class="ops-tabs" style="padding:12px 20px 0;border-bottom:1px solid #f0e0e8;">
        <button class="ops-tab-btn active" data-dtab="info">Info</button>
        <button class="ops-tab-btn" data-dtab="payroll">Payroll</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;">
        <div id="dtabInfo">
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="profile-info-label">Status</span><span class="emp-status-badge" style="background:${sc};color:${st};">${(emp.status||"active").toUpperCase()}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Email</span><span class="profile-info-value">${emp.email || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Contact</span><span class="profile-info-value">${emp.contact || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Address</span><span class="profile-info-value">${emp.address || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Shift</span><span class="profile-info-value">${emp.shift || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Date Hired</span><span class="profile-info-value">${hired}</span></div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px;">
            <button class="btn" id="empDetailEditBtn">Edit Info</button>
          </div>
        </div>
        <div id="dtabPayroll" style="display:none;">
          <p style="font-weight:700;color:#d44d7c;margin-bottom:10px;">Compensation</p>
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="profile-info-label">Basic Pay (monthly)</span><span class="profile-info-value">${fmt(p.basicPay)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Hourly Rate</span><span class="profile-info-value">${fmt(p.hourlyRate)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Overtime Rate</span><span class="profile-info-value">${fmt(p.overtimeRate)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Commission Rate</span><span class="profile-info-value">${p.commissionRate ? p.commissionRate + "%" : "—"}</span></div>
          </div>
          <p style="font-weight:700;color:#d44d7c;margin:16px 0 10px;">Government Benefits</p>
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="profile-info-label">SSS No.</span><span class="profile-info-value">${p.sssNo || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">SSS Contribution</span><span class="profile-info-value">${fmt(p.sssAmt)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">PhilHealth No.</span><span class="profile-info-value">${p.philHealthNo || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">PhilHealth Contribution</span><span class="profile-info-value">${fmt(p.philHealthAmt)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Pag-IBIG No.</span><span class="profile-info-value">${p.pagIbigNo || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Pag-IBIG Contribution</span><span class="profile-info-value">${fmt(p.pagIbigAmt)}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">TIN</span><span class="profile-info-value">${p.tin || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Withholding Tax</span><span class="profile-info-value">${fmt(p.tax)}</span></div>
          </div>
          <p style="font-weight:700;color:#d44d7c;margin:16px 0 10px;">Bank / Wallet</p>
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="profile-info-label">Bank / Wallet</span><span class="profile-info-value">${p.bank || "—"}</span></div>
            <div class="profile-info-item"><span class="profile-info-label">Account Number</span><span class="profile-info-value">${p.bankAcct || "—"}</span></div>
            ${p.notes ? `<div class="profile-info-item" style="grid-column:1/-1;"><span class="profile-info-label">Notes</span><span class="profile-info-value">${p.notes}</span></div>` : ""}
          </div>
          <div style="margin-top:16px;">
            <button class="btn" id="empDetailPayrollEditBtn">Edit Payroll</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("empDetailClose").onclick = close;
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  modal.querySelectorAll(".ops-tab-btn[data-dtab]").forEach((btn) => {
    btn.onclick = () => {
      modal.querySelectorAll(".ops-tab-btn[data-dtab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("dtabInfo").style.display    = btn.dataset.dtab === "info"    ? "block" : "none";
      document.getElementById("dtabPayroll").style.display = btn.dataset.dtab === "payroll" ? "block" : "none";
    };
  });

  document.getElementById("empDetailEditBtn").onclick = () => { close(); openEmpForm(emp); };
  document.getElementById("empDetailPayrollEditBtn").onclick = () => {
    close();
    openEmpForm(emp);
    setTimeout(() => {
      const btn = document.querySelector("#empForm .ops-tab-btn[data-tab='payroll']");
      if (btn) btn.click();
    }, 50);
  };
}

/* ===============================
   4. ON DUTY
================================ */
async function loadDutySection() {
  content.innerHTML = `<h2>Groomer on Duty</h2><div id="dutyPageContent"><p>Loading...</p></div>`;
  await renderDutyPage();
}

async function renderDutyPage() {
  const wrap = document.getElementById("dutyPageContent");
  if (!wrap) return;

  try {
    const [empRes, dutyRes] = await Promise.all([
      fetch("/api/admin/employees"),
      fetch("/api/admin/operations/duty"),
    ]);
    const empData  = await empRes.json();
    const dutyData = await dutyRes.json();

    const groomers = (empData.employees  || []).filter((e) => e.status === "active");
    const allDuty  = (dutyData.duty      || []);
    const today    = new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

    const grouped = {};
    allDuty.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });

    wrap.innerHTML = `
      <div class="duty-page-layout">
        <div class="duty-form-panel">
          <div class="ops-section-card">
            <h3 class="ops-card-title">Assign Groomer on Duty</h3>
            <div style="display:flex;flex-direction:column;gap:14px;margin-top:12px;">
              <label class="admin-form-label">Groomer / Staff
                <select id="dutyGroomer" class="admin-form-input">
                  <option value="">Select employee</option>
                  ${groomers.map((g) => `<option value="${g._id}">${g.name} — ${g.role}</option>`).join("")}
                </select>
              </label>
              <label class="admin-form-label">Date
                <input type="date" id="dutyDate" class="admin-form-input" value="${new Date().toISOString().slice(0,10)}" />
              </label>
              <label class="admin-form-label">Notes (optional)
                <input type="text" id="dutyNotes" class="admin-form-input" placeholder="e.g. Morning shift only" />
              </label>
              <button class="btn" id="saveDutyBtn" style="align-self:flex-start;">Assign</button>
            </div>
          </div>
        </div>
        <div class="duty-list-panel">
          <div class="ops-section-card">
            <div class="ops-header-row">
              <div>
                <h3 class="ops-card-title">Duty Schedule</h3>
                <p class="ops-section-sub">Today: ${today}</p>
              </div>
            </div>
            ${Object.keys(grouped).length === 0
              ? `<p class="cal-empty" style="padding:28px 0;">No duty assignments yet.</p>`
              : Object.entries(grouped).map(([dateLabel, entries]) => `
                  <div class="duty-date-group">
                    <p class="duty-date-label">${dateLabel}</p>
                    ${entries.map((d) => `
                      <div class="ops-duty-card">
                        <div class="ops-duty-avatar">${(d.groomerName||"?").charAt(0)}</div>
                        <div style="flex:1;">
                          <p class="ops-duty-name">${d.groomerName}</p>
                          ${d.notes ? `<p class="ops-duty-meta">${d.notes}</p>` : ""}
                        </div>
                        <button class="duty-remove-btn" data-id="${d._id}">✕</button>
                      </div>`).join("")}
                  </div>`).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("saveDutyBtn").onclick = async () => {
      const groomerId = document.getElementById("dutyGroomer").value;
      const date      = document.getElementById("dutyDate").value;
      const notes     = document.getElementById("dutyNotes").value.trim();
      if (!groomerId || !date) { showToast("Please select an employee and date.","warning"); return; }
      try {
        const res    = await fetch("/api/admin/operations/duty", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ groomerId, date, notes }) });
        const result = await res.json();
        if (result.success) await renderDutyPage();
        else showToast(result.message,"error");
      } catch (err) { showToast("Error assigning duty.","error"); }
    };

    wrap.querySelectorAll(".duty-remove-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!await showConfirm({title:"Confirm Action",message:"Remove this duty assignment?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
        try {
          const res    = await fetch(`/api/admin/operations/duty/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) await renderDutyPage();
          else showToast(result.message,"error");
        } catch (err) { showToast("Error removing assignment.","error"); }
      };
    });

  } catch (err) {
    console.error(err);
    wrap.innerHTML = "<p>Error loading duty schedule.</p>";
  }
}

/* ===============================
   5. LEAVE REQUESTS
================================ */
async function loadLeaveSection() {
  content.innerHTML = `<h2>Leave Requests</h2><div id="leavePageContent"><p>Loading...</p></div>`;
  await renderLeavePage();
}

async function renderLeavePage() {
  const wrap = document.getElementById("leavePageContent");
  if (!wrap) return;

  try {
    const res    = await fetch("/api/admin/operations/leave");
    const data   = await res.json();
    const leaves = data.leaves || [];

    const STATUS_STYLE = {
      pending:  { bg:"#fff3cd", color:"#856404" },
      approved: { bg:"#d4edda", color:"#155724" },
      rejected: { bg:"#f8d7da", color:"#721c24" },
    };

    const counts = { pending:0, approved:0, rejected:0 };
    leaves.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    wrap.innerHTML = `
      <div class="leave-summary-row">
        <div class="leave-summary-badge" style="background:#fff3cd;border-color:#fcd34d;">
          <span class="leave-summary-num" style="color:#92400e;">${counts.pending}</span>
          <span class="leave-summary-label">Pending</span>
        </div>
        <div class="leave-summary-badge" style="background:#d4edda;border-color:#86efac;">
          <span class="leave-summary-num" style="color:#166534;">${counts.approved}</span>
          <span class="leave-summary-label">Approved</span>
        </div>
        <div class="leave-summary-badge" style="background:#fee2e2;border-color:#fca5a5;">
          <span class="leave-summary-num" style="color:#991b1b;">${counts.rejected}</span>
          <span class="leave-summary-label">Rejected</span>
        </div>
        <button class="btn" id="fileLeaveBtn" style="margin-left:auto;">+ File Leave</button>
      </div>

      <div id="leaveForm" style="display:none;margin-bottom:24px;">
        <div class="admin-form-box" style="max-width:520px;">
          <h3 style="color:#d44d7c;margin-bottom:16px;">File Leave Request</h3>
          <label class="admin-form-label">Employee *
            <select id="leaveEmployee" class="admin-form-input">
              <option value="">Loading...</option>
            </select>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label class="admin-form-label">From *<input type="date" id="leaveFrom" class="admin-form-input" /></label>
            <label class="admin-form-label">To *<input type="date" id="leaveTo" class="admin-form-input" /></label>
          </div>
          <label class="admin-form-label">Leave Type
            <select id="leaveType" class="admin-form-input">
              <option value="Sick Leave">Sick Leave</option>
              <option value="Vacation Leave">Vacation Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label class="admin-form-label">Reason
            <textarea id="leaveReason" rows="2" class="admin-form-input" style="resize:vertical;" placeholder="Brief reason..."></textarea>
          </label>
          <div class="admin-form-btns">
            <button class="btn" id="saveLeaveBtn">Submit Request</button>
            <button class="btn" id="cancelLeaveBtn" style="background:#6c757d;">Cancel</button>
          </div>
        </div>
      </div>

      <div class="ops-section-card" style="margin-top:0;">
        <h3 class="ops-card-title" style="margin-bottom:16px;">All Leave Requests</h3>
        ${leaves.length === 0
          ? `<p class="cal-empty" style="padding:28px 0;">No leave requests on file.</p>`
          : `<div class="leave-table-wrap">
              <table class="leave-table">
                <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  ${leaves.map((l) => {
                    const s    = STATUS_STYLE[l.status] || STATUS_STYLE.pending;
                    const from = new Date(l.fromDate);
                    const to   = new Date(l.toDate);
                    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
                    return `
                      <tr>
                        <td><strong>${l.employeeName||"—"}</strong></td>
                        <td>${l.leaveType||"—"}</td>
                        <td>${from.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</td>
                        <td>${to.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</td>
                        <td style="text-align:center;">${days}</td>
                        <td style="max-width:180px;word-break:break-word;">${l.reason||"—"}</td>
                        <td><span class="leave-status-badge" style="background:${s.bg};color:${s.color};">${(l.status||"pending").toUpperCase()}</span></td>
                        <td style="white-space:nowrap;">
                          ${l.status === "pending" ? `
                            <button class="leave-approve-btn" data-id="${l._id}">Approve</button>
                            <button class="leave-reject-btn"  data-id="${l._id}">Reject</button>` : ""}
                          <button class="leave-del-btn" data-id="${l._id}">Delete</button>
                        </td>
                      </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>`}
      </div>
    `;

    document.getElementById("fileLeaveBtn").onclick = async () => {
      const form = document.getElementById("leaveForm");
      form.style.display = "block";
      form.scrollIntoView({ behavior:"smooth", block:"start" });
      try {
        const r = await fetch("/api/admin/employees");
        const d = await r.json();
        const sel = document.getElementById("leaveEmployee");
        sel.innerHTML = `<option value="">Select employee</option>` +
          (d.employees||[]).map((e) => `<option value="${e._id}">${e.name} — ${e.role}</option>`).join("");
      } catch(_) {}
    };

    document.getElementById("cancelLeaveBtn").onclick = () => { document.getElementById("leaveForm").style.display = "none"; };

    document.getElementById("saveLeaveBtn").onclick = async () => {
      const body = {
        employeeId: document.getElementById("leaveEmployee").value,
        fromDate:   document.getElementById("leaveFrom").value,
        toDate:     document.getElementById("leaveTo").value,
        leaveType:  document.getElementById("leaveType").value,
        reason:     document.getElementById("leaveReason").value.trim(),
      };
      if (!body.employeeId || !body.fromDate || !body.toDate) { showToast("Employee and dates are required.","warning"); return; }
      try {
        const res    = await fetch("/api/admin/operations/leave", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const result = await res.json();
        if (result.success) await renderLeavePage();
        else showToast(result.message,"error");
      } catch (err) { showToast("Error filing leave.","error"); }
    };

    wrap.querySelectorAll(".leave-approve-btn").forEach((btn) => {
      btn.onclick = async () => {
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/approve`, { method:"PUT" });
          const result = await res.json();
          if (result.success) { showToast(result.message,"success"); await renderLeavePage(); }
          else showToast(result.message,"error");
        } catch (err) { showToast("Error approving leave.","error"); }
      };
    });

    wrap.querySelectorAll(".leave-reject-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!await showConfirm({title:"Confirm Action",message:"Reject this leave request?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/reject`, { method:"PUT" });
          const result = await res.json();
          if (result.success) { showToast(result.message,"success"); await renderLeavePage(); }
          else showToast(result.message,"error");
        } catch (err) { showToast("Error rejecting leave.","error"); }
      };
    });

    wrap.querySelectorAll(".leave-del-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!await showConfirm({title:"Confirm Action",message:"Delete this leave request?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) { showToast(result.message,"success"); await renderLeavePage(); }
          else showToast(result.message,"error");
        } catch (err) { showToast("Error deleting leave.","error"); }
      };
    });

  } catch (err) {
    console.error(err);
    wrap.innerHTML = "<p>Error loading leave requests.</p>";
  }
}

/* ===============================
   6. MESSAGES
================================ */
function loadMessagesSection() {
  content.innerHTML = `
    <h2>Contact Messages</h2>
    <div class="booking-tabs">
      <button class="tab-btn active" data-status="all">All Messages</button>
      <button class="tab-btn" data-status="unread">Unread</button>
      <button class="tab-btn" data-status="read">Read</button>
    </div>
    <div id="messagesContent"><p>Loading messages...</p></div>
  `;
  const messagesContent = document.getElementById("messagesContent");
  const loadMessages = async (status) => {
    messagesContent.innerHTML = "<p>Loading...</p>";
    try {
      const res  = await fetch(`/api/contact?status=${status}`);
      const data = await res.json();
      if (!data.success) { messagesContent.innerHTML = `<p>Error: ${data.message}</p>`; return; }
      let html = `<h3>Customer Messages</h3>`;
      if (data.contacts && data.contacts.length > 0) {
        html += `<div class="bookings-grid">`;
        data.contacts.forEach((c) => {
          const sc = c.status === "unread" ? "status-unread" : "status-read";
          html += `
            <div class="booking-card ${sc}">
              <div class="booking-card-header">
                <p><strong>Name:</strong> ${c.name}</p>
                <p><strong>Email:</strong> ${c.email}</p>
              </div>
              <div class="booking-card-divider"></div>
              <div style="padding:15px;">
                <p><strong>Message:</strong></p>
                <p style="font-style:italic;background:#f9f9f9;padding:10px;border-radius:5px;margin:8px 0;">${c.message}</p>
                <p style="font-size:0.85rem;color:#666;"><strong>Received:</strong> ${new Date(c.createdAt).toLocaleString()}</p>
              </div>
              <p style="text-align:center;"><strong>Status:</strong> <span class="booking-status ${c.status}">${c.status.toUpperCase()}</span></p>
              <div class="booking-actions">
                ${c.status==="unread"?`<button class="markReadBtn" data-id="${c._id}">Mark as Read</button>`:""}
                <button class="deleteMessageBtn" data-id="${c._id}">Delete</button>
              </div>
            </div>`;
        });
        html += `</div>`;
      } else { html += `<p>No messages found.</p>`; }
      messagesContent.innerHTML = html;
      document.querySelectorAll(".markReadBtn").forEach((btn) => {
        btn.onclick = async () => {
          try {
            const res = await fetch(`/api/contact/${btn.dataset.id}/read`,{method:"PUT"});
            const r   = await res.json();
            if (r.success) { loadMessages(status); pollUnreadMessages(); }
            else showToast(r.message,"error");
          } catch(err) { showToast("Error","error"); }
        };
      });
      document.querySelectorAll(".deleteMessageBtn").forEach((btn) => {
        btn.onclick = async () => {
          if (!await showConfirm({title:"Confirm Action",message:"Delete this message?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
          try {
            const res = await fetch(`/api/contact/${btn.dataset.id}`,{method:"DELETE"});
            const r   = await res.json();
            if (r.success) { showToast("Message deleted.","success"); loadMessages(status); pollUnreadMessages(); }
            else showToast(r.message,"error");
          } catch(err) { showToast("Error","error"); }
        };
      });
    } catch (err) { messagesContent.innerHTML = "<p>Error loading messages.</p>"; }
  };
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => { document.querySelectorAll(".tab-btn").forEach((b)=>b.classList.remove("active")); btn.classList.add("active"); loadMessages(btn.dataset.status); };
  });
  loadMessages("all");
}

/* ===============================
   POLL UNREAD MESSAGES
================================ */
async function pollUnreadMessages() {
  try {
    const res  = await fetch("/api/contact/unread-count");
    const data = await res.json();
    if (data.success && data.count > 0) {
      const link = document.querySelector('[data-section="messages"]');
      if (link) {
        let badge = link.querySelector(".notification-badge");
        if (!badge) { badge = document.createElement("span"); badge.className = "notification-badge"; link.appendChild(badge); }
        badge.textContent = data.count; badge.style.display = "inline-flex";
      }
    } else {
      const badge = document.querySelector(".notification-badge");
      if (badge) badge.style.display = "none";
    }
  } catch (err) { console.error("Error polling unread messages:", err); }
}

/* ===============================
   REJECT REASON MODAL
================================ */
function showRejectModal(bookingId, onConfirm) {
  const PRESETS = ["Time slot already booked","Pet requirements not met","Incomplete booking information","Outside service hours","Other"];
  const modal = document.createElement("div");
  modal.className = "reject-modal-overlay";
  modal.innerHTML = `
    <div class="reject-modal">
      <h3>Reject Booking</h3>
      <p class="reject-modal-sub">Select a reason or type a custom one:</p>
      <div class="reject-presets">
        ${PRESETS.map((r)=>`<button type="button" class="reject-preset-btn" data-reason="${r}">${r}</button>`).join("")}
      </div>
      <textarea id="rejectReasonText" class="reject-textarea" placeholder="Or type a custom reason here..." rows="3"></textarea>
      <div class="reject-modal-actions">
        <button type="button" class="reject-modal-confirm" id="rejectConfirmBtn">Confirm Rejection</button>
        <button type="button" class="reject-modal-cancel"  id="rejectCancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const ta = modal.querySelector("#rejectReasonText");
  modal.querySelectorAll(".reject-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".reject-preset-btn").forEach((b)=>b.classList.remove("selected"));
      btn.classList.add("selected");
      ta.value = btn.dataset.reason !== "Other" ? btn.dataset.reason : "";
      if (btn.dataset.reason === "Other") ta.focus();
    });
  });
  modal.querySelector("#rejectConfirmBtn").onclick = () => { const r = ta.value.trim()||"Rejected by admin"; modal.remove(); onConfirm(r); };
  modal.querySelector("#rejectCancelBtn").onclick  = () => modal.remove();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

/* ===============================
   7. BOOKINGS — CALENDAR VIEW
================================ */
function loadBookingsSection(defaultTab = "calendar") {
  content.innerHTML = `
    <h2>Manage Bookings</h2>
    <div class="ops-tabs" style="margin-bottom:20px;">
      <button class="ops-tab-btn ${defaultTab === "calendar" ? "active" : ""}" data-view="calendar">&#128197; Calendar</button>
      <button class="ops-tab-btn ${defaultTab === "history"  ? "active" : ""}" data-view="history">&#128203; Booking History</button>
      <button class="ops-tab-btn ${defaultTab === "guest"    ? "active" : ""}" data-view="guest">&#128100; Guest Bookings</button>
    </div>
    <div id="bookingViewCalendar" style="display:block;">
    <div class="cal-layout">
      <div class="cal-main">
        <div class="cal-toolbar">
          <div class="cal-type-tabs">
            <button class="cal-type-btn active" data-type="all">All</button>
            <button class="cal-type-btn" data-type="grooming">Grooming</button>
            <button class="cal-type-btn" data-type="hotel">Hotel</button>
          </div>
          <div class="cal-nav-row">
            <button class="cal-nav-btn" id="calPrev">&#8592;</button>
            <span class="cal-month-title" id="calMonthLabel"></span>
            <button class="cal-nav-btn" id="calNext">&#8594;</button>
          </div>
        </div>
        <div class="cal-grid-wrap">
          <div class="cal-day-labels">
            <span>Sun</span><span>Mon</span><span>Tue</span>
            <span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div class="cal-cells" id="calCells"></div>
        </div>
      </div>
      <div class="cal-side">
        <div class="cal-side-head">
          <h3 id="calSideTitle">Pending Bookings</h3>
          <span class="cal-badge" id="calBadge">0</span>
        </div>
        <p class="cal-side-date" id="calSideDate"></p>
        <div class="cal-side-list" id="calSideList">
          <p class="cal-empty">Select a date to view bookings</p>
        </div>
      </div>
    </div>
    <div class="cal-drawer-overlay" id="calDrawerOverlay"></div>
    <div class="cal-drawer" id="calDrawer">
      <div class="cal-drawer-handle"></div>
      <div class="cal-drawer-head">
        <h3 id="calDrawerTitle">Bookings</h3>
        <button class="cal-drawer-close" id="calDrawerClose">&#x2715;</button>
      </div>
      <p class="cal-side-date" id="calDrawerDate" style="padding:8px 16px;font-size:12px;color:#999;"></p>
      <div class="cal-side-list" id="calDrawerList" style="max-height:60vh;overflow-y:auto;"></div>
    </div>
    </div>
    <div id="bookingViewHistory" style="display:none;"></div>
    <div id="bookingViewGuest"   style="display:none;"></div>
  `;

  const today = new Date();
  let yr = today.getFullYear(), mo = today.getMonth(), selDate = null, activeType = "all", allBookings = [];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dk = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  function midnight(d) { const c = new Date(d); c.setHours(0,0,0,0); return c; }

  async function fetchAll() {
    const types = activeType==="all"?["grooming","hotel"]:[activeType];
    const results = [];
    for (const type of types) {
      for (const status of ["pending","approved","rejected"]) {
        try {
          const res = await fetch(`/api/admin/bookings?type=${type}&status=${status}`);
          const data = await res.json();
          if (data.success && data.bookings) data.bookings.forEach((b)=>results.push({...b,type,status}));
        } catch(err){ console.error(err); }
      }
    }
    try {
      const gRes  = await fetch("/api/guest.bookings?status=all");
      const gData = await gRes.json();
      if (gData.success) {
        (gData.bookings || []).forEach(b => {
          results.push({
            ...b,
            type:        b.type || "grooming",
            status:      b.status,
            isGuest:     true,
            userName:    b.ownerName,
            userEmail:   b.email,
            userContact: b.phone,
            pets:        [{ name: b.petName, breed: b.breed, photo: null }],
            services:    b.services,
          });
        });
      }
    } catch(err){ console.error("Guest booking calendar fetch error:", err); }

    allBookings = results; renderCal(); updateBadge();
    if (selDate) { window.innerWidth<=768 ? openDrawer(selDate) : populateSidePanel(selDate); }
  }

  function getFor(date) {
    const target = midnight(date);
    return allBookings.filter((b) => {
      if (b.type==="hotel"&&b.hotelCheckoutDate) return target>=midnight(new Date(b.appointmentDate))&&target<=midnight(new Date(b.hotelCheckoutDate));
      return dk(new Date(b.appointmentDate))===dk(date);
    });
  }

  function renderCal() {
    document.getElementById("calMonthLabel").textContent=`${MONTHS[mo]} ${yr}`;
    const container=document.getElementById("calCells"); container.innerHTML="";
    const fd=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate(),prev=new Date(yr,mo,0).getDate();
    for(let i=0;i<fd;i++) container.appendChild(makeCell(new Date(yr,mo-1,prev-fd+i+1),true));
    for(let d=1;d<=dim;d++) container.appendChild(makeCell(new Date(yr,mo,d),false));
    const rem=(fd+dim)%7===0?0:7-(fd+dim)%7;
    for(let i=1;i<=rem;i++) container.appendChild(makeCell(new Date(yr,mo+1,i),true));
  }

  function makeCell(date,other) {
    const cell=document.createElement("div"); cell.className="cal-cell"+(other?" cal-other":"");
    if(dk(date)===dk(today)) cell.classList.add("cal-today");
    if(selDate&&dk(date)===dk(selDate)) cell.classList.add("cal-selected");
    const num=document.createElement("span"); num.className="cal-cell-num"; num.textContent=date.getDate(); cell.appendChild(num);
    const dayB=getFor(date);
    if(window.innerWidth<=768){
      const c={pending:0,approved:0,rejected:0,guest:0}; dayB.forEach((b)=>{if(b.isGuest)c.guest++;else if(c[b.status]!==undefined)c[b.status]++;});
      const dr=document.createElement("div"); dr.className="cal-dot-row";
      if(c.pending)  dr.innerHTML+=`<span class="cal-mini-dot cal-mini-pending">${c.pending}</span>`;
      if(c.approved) dr.innerHTML+=`<span class="cal-mini-dot cal-mini-approved">${c.approved}</span>`;
      if(c.rejected) dr.innerHTML+=`<span class="cal-mini-dot cal-mini-rejected">${c.rejected}</span>`;
      if(c.guest)    dr.innerHTML+=`<span class="cal-mini-dot cal-mini-guest">${c.guest}</span>`;
      if(dr.innerHTML) cell.appendChild(dr);
    } else {
      dayB.slice(0,3).forEach((b)=>{
        const isGuest = !!b.isGuest;
        const dotClass = isGuest ? `cal-dot cal-dot-grooming-guest-${b.status}` : `cal-dot cal-dot-${b.type}-${b.status}`;
        const dot=document.createElement("div"); dot.className=dotClass;
        let p = isGuest ? "👤 " : "G ";
        if(b.type==="hotel"&&!isGuest){if(b.hotelCheckoutDate){const ci=midnight(new Date(b.appointmentDate)),co=midnight(new Date(b.hotelCheckoutDate)),cur=midnight(date);if(cur.getTime()===ci.getTime())p="H-CI ";else if(cur.getTime()===co.getTime())p="H-CO ";else p="H-";}else p="H ";}
        dot.textContent=p+(b.userName||"?").split(" ")[0]; cell.appendChild(dot);
      });
      if(dayB.length>3){const m=document.createElement("div");m.className="cal-more";m.textContent=`+${dayB.length-3} more`;cell.appendChild(m);}
    }
    if(!other) cell.addEventListener("click",()=>{selDate=date;renderCal();window.innerWidth<=768?openDrawer(date):populateSidePanel(date);});
    return cell;
  }

  /* ─────────────────────────────────────────
     BUILD BOOKING CARD
     Key change: vet card pills wired AFTER
     innerHTML is set, using DOM queries on
     the item element itself.
  ───────────────────────────────────────── */
  function buildCard(b, isPending, listEl) {
    const item    = document.createElement("div");
    item.className = "cal-booking-item";

    const isGuest    = !!b.isGuest;
    const guestBadge = isGuest
      ? `<span style="font-size:9px;background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:8px;font-weight:700;letter-spacing:.03em;margin-left:4px;">GUEST</span>`
      : "";

    // Pet photo chips
    const pH = b.pets.map((p) =>
      `<span class="cal-pet-chip">
        <img src="/images/default-pet.png"
          ${!isGuest && p.photo ? `data-s3key="${p.photo}"` : ""}
          alt="${p.name}"
          class="cal-pet-av ${!isGuest && p.photo ? "pet-photo" : ""}"/>
        ${p.name}
      </span>`
    ).join("");

    // Vet card pills — collect pets that have a vetCard key
    const vetCards = isGuest
      ? []
      : b.pets.filter(p => p.vetCard).map(p => ({ name: p.name, key: p.vetCard }));

    const vetHTML = vetCards.length
      ? `<div class="cal-bi-vetcards">
          ${vetCards.map(v =>
            `<button class="cal-vet-pill" data-key="${v.key}" type="button">💉 ${v.name}'s vet card</button>`
          ).join("")}
        </div>`
      : "";

    // Date / detail line
    const dH = b.type === "hotel"
      ? `Check-in: ${new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"})} ${b.appointmentTime||""} &bull; Check-out: ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"}) : "N/A"} ${b.hotelCheckoutTime||""}`
      : `Time: ${b.appointmentTime||"N/A"} &bull; ${Array.isArray(b.services) ? b.services.join(", ") : (b.services||"")}`;

    const sb = isPending
      ? ""
      : `<span class="cal-status-badge cal-status-${b.status}">${b.status.toUpperCase()}</span>`;

    const ac = isPending
      ? `<div class="cal-bi-actions">
          <button class="cal-btn-approve" data-id="${b._id}" data-guest="${isGuest}">Approve</button>
          <button class="cal-btn-reject"  data-id="${b._id}" data-guest="${isGuest}">Reject</button>
        </div>`
      : `<div class="cal-bi-actions">
          <button class="cal-btn-edit" data-id="${b._id}" data-guest="${isGuest}">Move to Pending</button>
        </div>`;

    const groomerLine = b.requestedGroomerName
      ? `<p class="cal-bi-detail" style="color:#d44d7c;">✂️ Requested: <strong>${b.requestedGroomerName}</strong></p>`
      : "";

    const contactLine = isGuest && b.phone
      ? `<p class="cal-bi-contact">${b.userEmail||""} · ${b.phone}</p>`
      : `<p class="cal-bi-contact">${b.userContact||""}</p>`;

    item.innerHTML = `
      <div class="cal-bi-top">
        <div>
          <p class="cal-bi-name" style="display:inline;">${b.userName||"Unknown"}</p>${guestBadge}
          <p class="cal-bi-email">${b.userEmail||""}</p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span class="cal-type-pill ${b.type==="hotel"?"cal-pill-hotel":"cal-pill-grooming"}">${b.type}</span>
          ${sb}
        </div>
      </div>
      <div class="cal-bi-pets">${pH}</div>
      ${vetHTML}
      <p class="cal-bi-detail">${dH}</p>
      ${groomerLine}
      ${contactLine}
      ${ac}
    `;

    listEl.appendChild(item);

    // ── Load signed URLs for pet photos ──
    if (!isGuest) {
      item.querySelectorAll(".pet-photo[data-s3key]").forEach(async (img) => {
        const k = img.dataset.s3key;
        if (!k) return;
        try {
          const r = await fetch(`/api/file?name=${encodeURIComponent(k)}`);
          const d = await r.json();
          if (d.success) img.src = d.url;
        } catch (_) {}
      });
    }

    // ── Vet card pill click handlers ──
    // Must be wired AFTER innerHTML is set and item is in the DOM
    item.querySelectorAll(".cal-vet-pill").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof showVetCardPreview === "function") {
          showVetCardPreview(btn.dataset.key);
        } else {
          console.warn("showVetCardPreview not found — is upload.helper.js loaded?");
        }
      });
    });

    const approveUrl = (id) => isGuest ? `/api/guest.bookings/${id}/approve` : `/api/admin/bookings/${id}/approve`;
    const rejectUrl  = (id) => isGuest ? `/api/guest.bookings/${id}/reject`  : `/api/admin/bookings/${id}/reject`;
    const pendingUrl = (id) => isGuest ? `/api/guest.bookings/${id}/pending` : `/api/admin/bookings/${id}/pending`;

    // ── APPROVE button ──
    const ab = item.querySelector(".cal-btn-approve");
    if (ab) {
      ab.onclick = async () => {
        const emailNote = isGuest
          ? "A confirmation email will be sent to the guest."
          : "A confirmation email will be sent to the customer.";
        const confirmed = await showConfirm({
          title:       "Approve Booking?",
          message:     emailNote,
          confirmText: "Yes, Approve",
          cancelText:  "Cancel",
        });
        if (!confirmed) return;
        try {
          const r  = await fetch(approveUrl(ab.dataset.id), { method: "PUT" });
          const rs = await r.json();
          if (rs.success) { showToast(rs.message, "success"); closeDrawer(); await fetchAll(); }
          else showToast(rs.message, "error");
        } catch (e) { showToast("Error approving booking.", "error"); }
      };
    }

    // ── REJECT button ──
    const rb = item.querySelector(".cal-btn-reject");
    if (rb) {
      rb.onclick = () => {
        showRejectModal(rb.dataset.id, async (reason) => {
          try {
            const r  = await fetch(rejectUrl(rb.dataset.id), {
              method:  "PUT",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ reason }),
            });
            const rs = await r.json();
            if (rs.success) { showToast(rs.message, "success"); closeDrawer(); await fetchAll(); }
            else showToast(rs.message, "error");
          } catch (e) { showToast("Error rejecting booking.", "error"); }
        });
      };
    }

    // ── MOVE TO PENDING button ──
    const eb = item.querySelector(".cal-btn-edit");
    if (eb) {
      eb.onclick = async () => {
        if (!await showConfirm({title:"Move to Pending?",message:"Move this booking back to pending?",confirmText:"Yes",cancelText:"Cancel",danger:false})) return;
        try {
          const r  = await fetch(pendingUrl(eb.dataset.id), { method: "PUT", headers: { "Content-Type": "application/json" } });
          const rs = await r.json();
          if (rs.success) { showToast(rs.message, "success"); closeDrawer(); await fetchAll(); }
          else showToast(rs.message, "error");
        } catch (e) { showToast("Error updating booking.", "error"); }
      };
    }
  }

  function populateSidePanel(date) {
    const sd=document.getElementById("calSideDate"),sl=document.getElementById("calSideList"),st=document.getElementById("calSideTitle");
    sd.textContent=date.toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const allDay=getFor(date),pending=allDay.filter((b)=>b.status==="pending"),settled=allDay.filter((b)=>b.status==="approved"||b.status==="rejected");
    st.textContent=`Pending (${pending.length})`; sl.innerHTML="";
    if(!pending.length){const e=document.createElement("p");e.className="cal-empty";e.textContent="No pending bookings for this date.";sl.appendChild(e);}
    else pending.forEach((b)=>buildCard(b,true,sl));
    if(settled.length){const d=document.createElement("div");d.className="cal-section-divider";d.innerHTML=`<span>Approved &amp; Rejected</span>`;sl.appendChild(d);settled.forEach((b)=>buildCard(b,false,sl));}
  }

  function openDrawer(date) {
    const ov=document.getElementById("calDrawerOverlay"),dr=document.getElementById("calDrawer");
    const allDay=getFor(date),pending=allDay.filter((b)=>b.status==="pending"),settled=allDay.filter((b)=>b.status==="approved"||b.status==="rejected");
    document.getElementById("calDrawerTitle").textContent=`Bookings (${allDay.length})`;
    document.getElementById("calDrawerDate").textContent=date.toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const dl=document.getElementById("calDrawerList"); dl.innerHTML="";
    if(!allDay.length){dl.innerHTML=`<p class="cal-empty">No bookings for this date.</p>`;}
    else{
      if(pending.length){const l=document.createElement("p");l.className="cal-drawer-section-label";l.textContent=`Pending (${pending.length})`;dl.appendChild(l);pending.forEach((b)=>buildCard(b,true,dl));}
      if(settled.length){const d=document.createElement("div");d.className="cal-section-divider";d.innerHTML=`<span>Approved &amp; Rejected</span>`;dl.appendChild(d);settled.forEach((b)=>buildCard(b,false,dl));}
    }
    ov.classList.add("active");dr.classList.add("active");document.body.style.overflow="hidden";
  }

  function closeDrawer() {
    const ov=document.getElementById("calDrawerOverlay"),dr=document.getElementById("calDrawer");
    if(ov)ov.classList.remove("active");if(dr)dr.classList.remove("active");document.body.style.overflow="";
  }

  document.getElementById("calDrawerClose").onclick  = closeDrawer;
  document.getElementById("calDrawerOverlay").onclick = closeDrawer;
  function updateBadge(){ document.getElementById("calBadge").textContent=allBookings.filter((b)=>b.status==="pending").length; }
  document.getElementById("calPrev").onclick=()=>{mo--;if(mo<0){mo=11;yr--;}renderCal();};
  document.getElementById("calNext").onclick=()=>{mo++;if(mo>11){mo=0;yr++;}renderCal();};
  document.querySelectorAll(".cal-type-btn").forEach((btn)=>{btn.onclick=()=>{document.querySelectorAll(".cal-type-btn").forEach((b)=>b.classList.remove("active"));btn.classList.add("active");activeType=btn.dataset.type;fetchAll();};});
  window.addEventListener("resize",()=>renderCal());
  fetchAll();

  document.querySelectorAll(".ops-tab-btn[data-view]").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".ops-tab-btn[data-view]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cal   = document.getElementById("bookingViewCalendar");
      const hist  = document.getElementById("bookingViewHistory");
      const guest = document.getElementById("bookingViewGuest");
      cal.style.display = hist.style.display = guest.style.display = "none";
      if (btn.dataset.view === "calendar")       cal.style.display   = "block";
      else if (btn.dataset.view === "history") { hist.style.display  = "block"; loadBookingHistory(); }
      else if (btn.dataset.view === "guest")   { guest.style.display = "block"; loadGuestBookings(); }
    };
  });

  if (defaultTab === "history") {
    document.getElementById("bookingViewCalendar").style.display = "none";
    document.getElementById("bookingViewHistory").style.display  = "block";
    loadBookingHistory();
  }
  if (defaultTab === "guest") {
    document.getElementById("bookingViewCalendar").style.display = "none";
    document.getElementById("bookingViewGuest").style.display    = "block";
    loadGuestBookings();
  }
}

/* ═══════════════════════════════════════
   BOOKING HISTORY
═══════════════════════════════════════ */
async function loadBookingHistory() {
  const wrap = document.getElementById("bookingViewHistory");
  if (!wrap) return;
  wrap.innerHTML = "<p>Loading history...</p>";

  try {
    const [grRes, htRes] = await Promise.all([
      fetch("/api/admin/bookings?type=grooming&status=approved"),
      fetch("/api/admin/bookings?type=hotel&status=approved"),
    ]);
    const grData = await grRes.json();
    const htData = await htRes.json();
    const bookings = [
      ...(grData.bookings || []).map((b) => ({ ...b, type:"grooming" })),
      ...(htData.bookings || []).map((b) => ({ ...b, type:"hotel"    })),
    ].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    const OUTCOME_STYLE = {
      completed:   { bg:"#d1fae5", color:"#065f46", label:"Completed"   },
      "no-show":   { bg:"#fee2e2", color:"#991b1b", label:"No Show"     },
      "cancelled": { bg:"#f3f4f6", color:"#374151", label:"Cancelled"   },
      rescheduled: { bg:"#dbeafe", color:"#1e40af", label:"Rescheduled" },
    };

    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <div class="cal-type-tabs" style="margin:0;">
          <button class="cal-type-btn active" data-htype="all">All</button>
          <button class="cal-type-btn" data-htype="grooming">Grooming</button>
          <button class="cal-type-btn" data-htype="hotel">Hotel</button>
        </div>
        <div class="cal-type-tabs" style="margin:0;">
          <button class="cal-type-btn active" data-houtcome="all">All Outcomes</button>
          <button class="cal-type-btn" data-houtcome="none">Pending Action</button>
          <button class="cal-type-btn" data-houtcome="completed">Completed</button>
          <button class="cal-type-btn" data-houtcome="no-show">No Show</button>
        </div>
      </div>
      <div id="historyList"></div>
    `;

    let activeHType    = "all";
    let activeHOutcome = "all";

    function renderHistory() {
      const list = document.getElementById("historyList");
      if (!list) return;

      const filtered = bookings.filter((b) => {
        const typeMatch    = activeHType === "all" || b.type === activeHType;
        const outcomeMatch = activeHOutcome === "all" ? true
          : activeHOutcome === "none" ? !b.outcome
          : b.outcome === activeHOutcome;
        return typeMatch && outcomeMatch;
      });

      if (!filtered.length) {
        list.innerHTML = `<p class="cal-empty" style="padding:32px 0;">No bookings found.</p>`;
        return;
      }

      list.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead>
              <tr>
                <th>Customer</th><th>Pets</th><th>Type</th><th>Date</th>
                <th>Time</th><th>Services</th><th>Outcome</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((b) => {
                const isHotel = b.type === "hotel";
                const dateStr = new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                const coStr   = isHotel && b.hotelCheckoutDate ? ` → ${new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"})}` : "";
                const petsStr = Array.isArray(b.pets) ? b.pets.map((p) => p.name||p).join(", ") : "—";
                const svcStr  = !isHotel && b.services ? (Array.isArray(b.services) ? b.services.join(", ") : b.services) : isHotel ? "Pet Hotel" : "—";
                const oc      = b.outcome;
                const ocStyle = oc ? (OUTCOME_STYLE[oc] || { bg:"#e9ecef", color:"#333", label:oc }) : null;
                return `
                  <tr data-id="${b._id}">
                    <td>
                      <strong>${b.userName||"—"}</strong>
                      <p style="font-size:0.78rem;color:#888;margin:0;">${b.userContact||""}</p>
                    </td>
                    <td>${petsStr}</td>
                    <td><span class="cal-type-pill ${isHotel?"cal-pill-hotel":"cal-pill-grooming"}">${b.type}</span></td>
                    <td style="white-space:nowrap;">${dateStr}${coStr}</td>
                    <td>${b.appointmentTime||"—"}</td>
                    <td style="max-width:140px;word-break:break-word;">${svcStr}${b.requestedGroomerName?`<br><span style="font-size:0.75rem;color:#d44d7c;">✂️ ${b.requestedGroomerName}</span>`:""}</td>
                    <td>
                      ${oc ? `<span class="leave-status-badge" style="background:${ocStyle.bg};color:${ocStyle.color};">${ocStyle.label}</span>` : `<span style="color:#aaa;font-size:0.8rem;">—</span>`}
                      ${b.outcomeNote ? `<p style="font-size:0.75rem;color:#888;margin:2px 0 0;">${b.outcomeNote}</p>` : ""}
                    </td>
                    <td style="white-space:nowrap;">
                      <div class="history-action-btns" data-id="${b._id}">
                        <button class="hist-btn hist-complete" data-id="${b._id}" title="Completed">✅ Done</button>
                        <button class="hist-btn hist-noshow"   data-id="${b._id}" title="No Show">🚫 No Show</button>
                        <button class="hist-btn hist-cancel"   data-id="${b._id}" title="Cancelled">❌ Cancelled</button>
                        <button class="hist-btn hist-resched"  data-id="${b._id}" title="Rescheduled">🔄 Rescheduled</button>
                      </div>
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;

      const setOutcome = async (id, outcome, groomerId = null, note = "") => {
        try {
          const res    = await fetch(`/api/admin/bookings/${id}/outcome`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ outcome, outcomeNote: note, actualGroomerId: groomerId }),
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message, "success");
            const b = bookings.find((x) => x._id === id);
            if (b) { b.outcome = outcome; b.outcomeNote = note; }
            renderHistory();
          } else showToast(result.message, "error");
        } catch (err) { showToast("Error updating outcome.", "error"); }
      };

      list.querySelectorAll(".hist-complete").forEach((btn) => {
        btn.onclick = async () => {
          const booking = bookings.find(b => b._id === btn.dataset.id);
          openGroomerPickerModal(btn.dataset.id, booking, setOutcome);
        };
      });
      list.querySelectorAll(".hist-noshow").forEach((btn) => {
        btn.onclick = async () => {
          const note = prompt("Optional note (e.g. called but no answer):", "") ?? "";
          setOutcome(btn.dataset.id, "no-show", null, note);
        };
      });
      list.querySelectorAll(".hist-cancel").forEach((btn) => {
        btn.onclick = async () => {
          const note = prompt("Cancellation reason (optional):", "") ?? "";
          setOutcome(btn.dataset.id, "cancelled", null, note);
        };
      });
      list.querySelectorAll(".hist-resched").forEach((btn) => {
        btn.onclick = async () => {
          const note = prompt("New date or note:", "") ?? "";
          setOutcome(btn.dataset.id, "rescheduled", null, note);
        };
      });
    }

    wrap.querySelectorAll(".cal-type-btn[data-htype]").forEach((btn) => {
      btn.onclick = () => {
        wrap.querySelectorAll(".cal-type-btn[data-htype]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active"); activeHType = btn.dataset.htype; renderHistory();
      };
    });
    wrap.querySelectorAll(".cal-type-btn[data-houtcome]").forEach((btn) => {
      btn.onclick = () => {
        wrap.querySelectorAll(".cal-type-btn[data-houtcome]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active"); activeHOutcome = btn.dataset.houtcome; renderHistory();
      };
    });

    renderHistory();

  } catch (err) {
    console.error(err);
    document.getElementById("historyList").innerHTML = "<p>Error loading history.</p>";
  }
}

/* ═══════════════════════════════════════
   PAYROLL SECTION
═══════════════════════════════════════ */
async function loadPayrollSection() {
  const now = new Date();

  content.innerHTML = `<h2>Payroll</h2><p>Loading...</p>`;
 
  function getPeriods(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const pad = n => String(n).padStart(2, "0");
    return [
      { label:`${year}-${pad(month+1)}-01 to ${year}-${pad(month+1)}-15`,       from:`${year}-${pad(month+1)}-01`, to:`${year}-${pad(month+1)}-15` },
      { label:`${year}-${pad(month+1)}-16 to ${year}-${pad(month+1)}-${lastDay}`, from:`${year}-${pad(month+1)}-16`, to:`${year}-${pad(month+1)}-${lastDay}` },
    ];
  }
 
  function getWeeklyPeriods(year, month) {
  const periods = [];
  let start = new Date(year, month, 1);

  while (start.getMonth() === month) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    // Clamp to end of month
    if (end.getMonth() !== month) {
      end.setMonth(month + 1, 0); // last day of month
    }

    const from = start.toISOString().split("T")[0];
    const to   = end.toISOString().split("T")[0];

    periods.push({
      from,
      to,
      label: `${start.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} - ${end.toLocaleDateString("en-PH",{day:"numeric",year:"numeric"})}`
    });

    start = new Date(end);
    start.setDate(start.getDate() + 1);
  }

  return periods;
}

const weeklyPeriods = getWeeklyPeriods(now.getFullYear(), now.getMonth());

const curPeriod = weeklyPeriods.find(p => {
  const today = now.toISOString().split("T")[0];
  return today >= p.from && today <= p.to;
});

let periodOptions = "";

for (let i = 0; i < 3; i++) { // last 3 months (adjust if needed)
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

  getWeeklyPeriods(d.getFullYear(), d.getMonth())
    .reverse()
    .forEach(p => {
      periodOptions += `<option value="${p.from}|${p.to}" ${
        curPeriod && p.from === curPeriod.from ? "selected" : ""
      }>${p.label}</option>`;
    });
}
 
  content.innerHTML = `
    <h2>Payroll</h2>
    <div class="ops-tabs" style="margin-bottom:20px;">
      <button class="ops-tab-btn active" data-ptab="payslips">📋 Payslips</button>
      <button class="ops-tab-btn" data-ptab="attendance">🕐 Attendance</button>
      <button class="ops-tab-btn" data-ptab="advances">💵 Advances</button>
      <button class="ops-tab-btn" data-ptab="history">📂 Release History</button>
    </div>
 
    <div id="ptabPayslips">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:8px;">
          Period: <select id="periodSelect" class="admin-form-input" style="width:auto;min-width:240px;">${periodOptions}</select>
        </label>
        <button class="btn" id="loadPayslipsBtn">Load</button>
        <button class="btn" id="releasePayrollBtn" style="background:#065f46;">✅ Mark as Released</button>
      </div>
      <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:10px;padding:11px 15px;margin-bottom:14px;font-size:0.8rem;color:#1e40af;">
        <strong>ℹ️ Benefit rates (auto when not manually set):</strong>
        SSS 4.5% of MSC (₱135–₱1,350/mo) · PhilHealth 2.5% (₱200–₱1,800/mo) · Pag-IBIG 2% (max ₱100/mo) · Tax: manual only
      </div>
      <p style="font-size:0.82rem;color:#888;margin-bottom:14px;">
        Click <strong>✏️ Edit</strong> to correct any value before releasing. Click <strong>🖨️ Slip</strong> to preview and print.
      </p>
      <div id="payslipList"><p style="color:#aaa;">Select a period and click Load.</p></div>
    </div>
 
    <div id="ptabAttendance" style="display:none;">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:8px;">
          From: <input type="date" id="attFrom" class="admin-form-input" style="width:auto;" value="${curPeriod.from}" />
        </label>
        <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:8px;">
          To: <input type="date" id="attTo" class="admin-form-input" style="width:auto;" value="${curPeriod.to}" />
        </label>
        <button class="btn" id="loadAttendanceBtn">Load</button>
      </div>
      <div id="attendanceList"><p style="color:#aaa;">Select a date range and click Load.</p></div>
    </div>
 
    <div id="ptabAdvances" style="display:none;">
      <div class="ops-section-card" style="max-width:480px;margin-bottom:20px;">
        <h3 class="ops-card-title">Give Advance Salary</h3>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
          <label class="admin-form-label">Employee
            <select id="advEmployee" class="admin-form-input"><option value="">Loading...</option></select>
          </label>
          <label class="admin-form-label">Amount ₱
            <input type="number" id="advAmount" class="admin-form-input" placeholder="0.00" min="0" step="0.01" />
          </label>
          <label class="admin-form-label">Period to Deduct From
            <select id="advPeriod" class="admin-form-input" style="width:auto;min-width:240px;">${periodOptions}</select>
          </label>
          <label class="admin-form-label">Note (optional)
            <input type="text" id="advNote" class="admin-form-input" placeholder="e.g. Emergency advance" />
          </label>
          <button class="btn" id="giveAdvanceBtn">Record Advance</button>
          <p id="advMsg" class="admin-form-msg"></p>
        </div>
      </div>
      <div class="ops-section-card">
        <h3 class="ops-card-title" style="margin-bottom:12px;">Advance History</h3>
        <div id="advanceList"><p>Loading...</p></div>
      </div>
    </div>
 
    <div id="ptabHistory" style="display:none;">
      <div id="payrollHistoryList"><p>Loading...</p></div>
    </div>
  `;
 
  // ── Tab switching ──
  document.querySelectorAll(".ops-tab-btn[data-ptab]").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".ops-tab-btn[data-ptab]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ["Payslips","Attendance","Advances","History"].forEach(t => {
        const el = document.getElementById(`ptab${t}`);
        if (el) el.style.display = btn.dataset.ptab === t.toLowerCase() ? "block" : "none";
      });
      if (btn.dataset.ptab === "history")  loadReleaseHistory();
      if (btn.dataset.ptab === "advances") initAdvancesTab();
    };
  });
 
  document.getElementById("loadPayslipsBtn").onclick  = loadPayslips;
  document.getElementById("loadAttendanceBtn").onclick = loadAttendanceView;
  loadPayslips();
 
  document.getElementById("releasePayrollBtn").onclick = async () => {
    const [from, to] = document.getElementById("periodSelect").value.split("|");
    if (!await showConfirm({ title:"Release Payroll?", message:"Mark this period as released? This will be recorded in history.", confirmText:"Yes, Release", cancelText:"Cancel" })) return;
    try {
      const res = await fetch("/api/admin/payroll/release", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ from, to }) });
      const r   = await res.json();
      if (r.success) showToast("Payroll released and recorded!", "success");
      else showToast(r.message, "error");
    } catch { showToast("Error releasing payroll.", "error"); }
  };

 /* ── PAYSLIPS ── */
  async function loadPayslips() {
    const wrap = document.getElementById("payslipList");
    const [from, to] = document.getElementById("periodSelect").value.split("|");
    wrap.innerHTML = "<p>Loading...</p>";
    try {
      const res  = await fetch(`/api/admin/payroll?from=${from}&to=${to}`);
      const data = await res.json();
      if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }
      if (!data.payroll.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No active employees found.</p>`; return; }
 
      const fmt = v => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
 
      // rowData holds the live state; _edit* keys are added by openEditSlipModal
      const rowData = data.payroll.map(p => ({ ...p, manualOT:0, manualCommission:0 }));

      function calcNet(row) {
        const p = row.payroll || {};
 
        // Resolve effective values — prefer _edit* overrides
        const effectiveHourly = "_editHourlyRate" in row ? parseFloat(row._editHourlyRate) : parseFloat(p.hourlyRate  || 0);
        const effectiveBasic  = "_editBasicPay"   in row ? parseFloat(row._editBasicPay)   : parseFloat(p.basicPay   || 0);
        const effectiveOTRate = "_editOTRate"     in row ? parseFloat(row._editOTRate)      : parseFloat(p.overtimeRate || 0);
        const effectiveHours  = "_editHours"      in row ? parseFloat(row._editHours)       : parseFloat(row.attendance?.totalHours || 0);
        const effectiveOT     = "_editOT"         in row ? parseFloat(row._editOT)          : parseFloat(row.manualOT || 0);
        const effectiveComm   = "_editCommission" in row ? parseFloat(row._editCommission)  : parseFloat(row.manualCommission || 0);
      
        // Base pay: hourly × hours, or semi-monthly basic
        const basePay = effectiveHourly > 0
          ? effectiveHourly * effectiveHours
          : effectiveBasic / 4;
      
        const otPay = effectiveOT * effectiveOTRate;
        const gross = basePay + otPay + effectiveComm;
      
        // Monthly estimate for benefit computation
        const effMonthly = effectiveHourly > 0
          ? effectiveHourly * effectiveHours * 4
          : effectiveBasic;
      
        // Compute base benefits, then allow _edit* overrides
        const benefits = calcBenefits(effMonthly, p);
      
        const sssSemi     = "_editSSS"     in row ? parseFloat(row._editSSS)     : benefits.sssSemi;
        const philSemi    = "_editPhil"    in row ? parseFloat(row._editPhil)    : benefits.philSemi;
        const pagIbigSemi = "_editPagIbig" in row ? parseFloat(row._editPagIbig) : benefits.pagIbigSemi;
        const taxSemi     = "_editTax"     in row ? parseFloat(row._editTax)     : benefits.taxSemi;
      
        const deductions = sssSemi + philSemi + pagIbigSemi + taxSemi;
        const advance    = parseFloat(row.advance || 0);
        const net        = gross - deductions - advance;
      
        return {
          basePay:        parseFloat(basePay.toFixed(2)),
          otPay:          parseFloat(otPay.toFixed(2)),
          commission:     parseFloat(effectiveComm.toFixed(2)),
          gross:          parseFloat(gross.toFixed(2)),
          sssSemi:        parseFloat(sssSemi.toFixed(2)),
          philSemi:       parseFloat(philSemi.toFixed(2)),
          pagIbigSemi:    parseFloat(pagIbigSemi.toFixed(2)),
          taxSemi:        parseFloat(taxSemi.toFixed(2)),
          deductions:     parseFloat(deductions.toFixed(2)),
          advance:        parseFloat(advance.toFixed(2)),
          net:            parseFloat(net.toFixed(2)),
          hourlyBased:    effectiveHourly > 0,
          effectiveHours, effectiveOT, effectiveHourly,
          effectiveBasic, effectiveOTRate,
          benefits,
        };
      }

      function calcBenefits(monthlyBasic, savedPayroll) {
        const p = savedPayroll || {};
        const mb = parseFloat(monthlyBasic) || 0;
      
        // ── SSS: 4.5% of MSC, clamped ₱135–₱1,350/mo ──
        let sssMonthly;
        if (parseFloat(p.sssAmt || 0) > 0) {
          sssMonthly = parseFloat(p.sssAmt);
        } else {
          const msc = Math.min(Math.max(mb, 3000), 30000);
          sssMonthly = Math.max(135, Math.min(parseFloat((msc * 0.045).toFixed(2)), 1350));
        }
      
        // ── PhilHealth: 2.5% of basic, clamped ₱200–₱1,800/mo ──
        let philMonthly;
        if (parseFloat(p.philHealthAmt || 0) > 0) {
          philMonthly = parseFloat(p.philHealthAmt);
        } else {
          philMonthly = Math.max(200, Math.min(parseFloat((mb * 0.025).toFixed(2)), 1800));
        }
      
        // ── Pag-IBIG: 2% of basic, max ₱100/mo ──
        let pagIbigMonthly;
        if (parseFloat(p.pagIbigAmt || 0) > 0) {
          pagIbigMonthly = parseFloat(p.pagIbigAmt);
        } else {
          pagIbigMonthly = parseFloat(Math.min(mb * 0.02, 100).toFixed(2));
        }
      
        // ── Withholding Tax: manual only ──
        const taxMonthly = parseFloat(p.tax || 0);
      
        return {
          sssMonthly,
          philMonthly,
          pagIbigMonthly,
          taxMonthly,
          sssSemi:      parseFloat((sssMonthly     / 2).toFixed(2)),
          philSemi:     parseFloat((philMonthly    / 2).toFixed(2)),
          pagIbigSemi:  parseFloat((pagIbigMonthly / 2).toFixed(2)),
          taxSemi:      parseFloat((taxMonthly     / 2).toFixed(2)),
          totalMonthly: parseFloat((sssMonthly + philMonthly + pagIbigMonthly + taxMonthly).toFixed(2)),
          totalSemi:    parseFloat(((sssMonthly + philMonthly + pagIbigMonthly + taxMonthly) / 2).toFixed(2)),
          sssIsManual:     parseFloat(p.sssAmt       || 0) > 0,
          philIsManual:    parseFloat(p.philHealthAmt || 0) > 0,
          pagIbigIsManual: parseFloat(p.pagIbigAmt   || 0) > 0,
          taxIsManual:     parseFloat(p.tax          || 0) > 0,
        };
      }

      function renderTable() {
        const totalNet = rowData.reduce((s, row) => s + calcNet(row).net, 0);
 
        wrap.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <p style="font-size:0.85rem;color:#888;">Period: <strong>${from} to ${to}</strong> &bull; ${rowData.length} employee(s)</p>
            <p style="font-weight:700;color:#d44d7c;">Total Net Payroll: ${fmt(totalNet)}</p>
          </div>
          <div class="leave-table-wrap">
            <table class="leave-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Hours</th><th>Base Pay</th>
                  <th>OT Hrs</th><th>OT Pay</th><th>Commission ₱</th>
                  <th>Gross</th><th>Deductions</th><th>Advance</th>
                  <th style="color:#065f46;">Net Pay</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowData.map((row, i) => {
                  const c = calcNet(row);
                  const edited = Object.keys(row).some(k => k.startsWith("_edit"));
                  return `
                    <tr${edited ? ' style="background:#fffbeb;"' : ""}>
                      <td>
                        <strong>${row.employee.name}</strong>
                        <p style="font-size:0.75rem;color:#888;margin:0;">${row.employee.role}</p>
                        ${edited ? `<span style="font-size:0.7rem;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;">✏️ edited</span>` : ""}
                      </td>
                      <td style="text-align:center;">${c.effectiveHours}h<p style="font-size:0.72rem;color:#888;margin:0;">${row.attendance.daysPresent}d</p></td>
                      <td>${fmt(c.basePay)}<p style="font-size:0.72rem;color:#888;margin:0;">${c.hourlyBased?"hourly":"semi-basic"}</p></td>
                      <td><input type="number" class="admin-form-input ot-input" data-idx="${i}" value="${c.effectiveOT}" min="0" step="0.5" style="width:68px;padding:4px 6px;font-size:0.85rem;" /></td>
                      <td>${fmt(c.otPay)}</td>
                      <td><input type="number" class="admin-form-input comm-input" data-idx="${i}" value="${c.commission}" min="0" step="0.01" style="width:88px;padding:4px 6px;font-size:0.85rem;" /></td>
                      <td style="font-weight:600;">${fmt(c.gross)}</td>
                      <td style="color:#721c24;">${fmt(c.deductions)}</td>
                      <td style="color:#856404;">${c.advance > 0 ? fmt(c.advance) : "—"}</td>
                      <td style="font-weight:700;color:${c.net>=0?"#065f46":"#991b1b"};">${fmt(c.net)}</td>
                      <td style="white-space:nowrap;">
                        <button class="hist-btn hist-resched edit-slip-btn" data-idx="${i}" style="margin-bottom:3px;display:block;">✏️ Edit</button>
                        <button class="hist-btn hist-complete payslip-btn" data-idx="${i}" style="display:block;">🖨️ Slip</button>
                      </td>
                    </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>`;
 
        wrap.querySelectorAll(".ot-input").forEach(inp => {
          inp.onchange = () => { rowData[inp.dataset.idx].manualOT = parseFloat(inp.value) || 0; renderTable(); };
        });
        wrap.querySelectorAll(".comm-input").forEach(inp => {
          inp.onchange = () => { rowData[inp.dataset.idx].manualCommission = parseFloat(inp.value) || 0; renderTable(); };
        });
 
        // ── Edit slip button ──
        wrap.querySelectorAll(".edit-slip-btn").forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            openEditSlipModal(rowData[idx], calcNet(rowData[idx]), overrides => {
              Object.assign(rowData[idx], overrides);
              renderTable();
            });
          };
        });
 
        // ── View/print payslip button ──
        wrap.querySelectorAll(".payslip-btn").forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            openPayslipModal(rowData[idx], calcNet(rowData[idx]), from, to);
          };
        });
      }
 
      renderTable();
    } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading payslips.</p>"; }
  }

  async function loadAttendanceView() {
    const wrap = document.getElementById("attendanceList");
    const from = document.getElementById("attFrom").value;
    const to   = document.getElementById("attTo").value;
    if (!from || !to) { showToast("Please select both dates.", "warning"); return; }
    wrap.innerHTML = "<p>Loading...</p>";
    try {
      const res  = await fetch(`/api/admin/attendance?from=${from}&to=${to}`);
      const data = await res.json();
      if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }
      if (!data.records.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No records found.</p>`; return; }
      wrap.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead><tr><th>Employee</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>OT</th><th>Note</th><th></th></tr></thead>
            <tbody>
              ${data.records.map(r => {
                const date = new Date(r.date).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                const tIn  = r.timeIn  ? new Date(r.timeIn).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                const tOut = r.timeOut ? new Date(r.timeOut).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                return `<tr>
                  <td><strong>${r.employeeName||"—"}</strong></td>
                  <td>${date}</td><td>${tIn}</td>
                  <td style="${!r.timeOut?"color:#d44d7c;font-weight:600;":""}">${tOut}${!r.timeOut?" (active)":""}</td>
                  <td style="text-align:center;">${r.hoursWorked!=null?r.hoursWorked+"h":"—"}</td>
                  <td style="text-align:center;">${r.overtimeHours>0?r.overtimeHours+"h":"—"}</td>
                  <td style="font-size:0.78rem;color:#888;">${r.adminNote||""}</td>
                  <td style="white-space:nowrap;">
                    <button class="hist-btn hist-resched att-adj" data-id="${r._id}" data-ti="${r.timeIn||""}" data-to="${r.timeOut||""}">Adjust</button>
                    <button class="hist-btn hist-cancel att-del" data-id="${r._id}">Delete</button>
                  </td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`;
      wrap.querySelectorAll(".att-adj").forEach(btn => {
        btn.onclick = () => openAdjustModal(btn.dataset.id, btn.dataset.ti, btn.dataset.to, from, to, loadAttendanceView);
      });
      wrap.querySelectorAll(".att-del").forEach(btn => {
        btn.onclick = async () => {
          if (!await showConfirm({title:"Confirm",message:"Delete this attendance record?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
          const r = await (await fetch(`/api/admin/attendance/${btn.dataset.id}`,{method:"DELETE"})).json();
          if (r.success) loadAttendanceView(); else showToast(r.message,"error");
        };
      });
    } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading attendance.</p>"; }
  }

  async function initAdvancesTab() {
    try {
      const data = await (await fetch("/api/admin/employees")).json();
      const sel  = document.getElementById("advEmployee");
      if (sel) sel.innerHTML = `<option value="">Select employee</option>` +
        (data.employees||[]).map(e => `<option value="${e._id}">${e.name} — ${e.role}</option>`).join("");
    } catch (_) {}
    loadAdvanceList();
    document.getElementById("giveAdvanceBtn").onclick = async () => {
      const msg    = document.getElementById("advMsg");
      const empId  = document.getElementById("advEmployee").value;
      const amount = parseFloat(document.getElementById("advAmount").value);
      const period = document.getElementById("advPeriod").value;
      const note   = document.getElementById("advNote").value.trim();
      if (!empId || !amount || !period) { msg.textContent="Employee, amount, and period are required."; msg.style.display="block"; return; }
      const [from, to] = period.split("|");
      try {
        const r = await (await fetch("/api/admin/payroll/advance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({employeeId:empId,amount,periodFrom:from,periodTo:to,note})})).json();
        if (r.success) { document.getElementById("advAmount").value=""; document.getElementById("advNote").value=""; msg.style.display="none"; showToast("Advance recorded.","success"); loadAdvanceList(); }
        else { msg.textContent=r.message; msg.style.display="block"; }
      } catch { msg.textContent="Error recording advance."; msg.style.display="block"; }
    };
  }

  async function loadAdvanceList() {
    const wrap = document.getElementById("advanceList");
    if (!wrap) return;
    try {
      const data = await (await fetch("/api/admin/payroll/advances")).json();
      const fmt  = v => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
      if (!data.advances.length) { wrap.innerHTML=`<p style="color:#aaa;">No advances recorded yet.</p>`; return; }
      wrap.innerHTML = `<div class="leave-table-wrap"><table class="leave-table">
        <thead><tr><th>Employee</th><th>Amount</th><th>Period</th><th>Note</th><th>Status</th><th></th></tr></thead>
        <tbody>${data.advances.map(a=>`<tr>
          <td><strong>${a.employeeName||"—"}</strong></td>
          <td style="font-weight:600;color:#856404;">${fmt(a.amount)}</td>
          <td>${a.periodFrom?a.periodFrom.slice(0,10):"—"} to ${a.periodTo?a.periodTo.slice(0,10):"—"}</td>
          <td style="font-size:0.8rem;color:#888;">${a.note||"—"}</td>
          <td><span class="leave-status-badge" style="background:${a.deducted?"#d4edda":"#fff3cd"};color:${a.deducted?"#155724":"#856404"};">${a.deducted?"Deducted":"Pending"}</span></td>
          <td>${!a.deducted?`<button class="hist-btn hist-cancel adv-del-btn" data-id="${a._id}">Remove</button>`:""}</td>
        </tr>`).join("")}</tbody>
      </table></div>`;
      wrap.querySelectorAll(".adv-del-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!await showConfirm({title:"Confirm",message:"Remove this advance?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
          const r = await (await fetch(`/api/admin/payroll/advance/${btn.dataset.id}`,{method:"DELETE"})).json();
          if (r.success) loadAdvanceList(); else showToast(r.message,"error");
        };
      });
    } catch { wrap.innerHTML="<p>Error loading advances.</p>"; }
  }

  async function loadReleaseHistory() {
    const wrap = document.getElementById("payrollHistoryList");
    if (!wrap) return;
    wrap.innerHTML = "<p>Loading...</p>";
    try {
      const data = await (await fetch("/api/admin/payroll/history")).json();
      if (!data.history.length) { wrap.innerHTML=`<p class="cal-empty" style="padding:28px 0;">No releases recorded yet.</p>`; return; }
      wrap.innerHTML = `<div class="leave-table-wrap"><table class="leave-table">
        <thead><tr><th>Period</th><th>Released At</th><th>Notes</th></tr></thead>
        <tbody>${data.history.map(h=>`<tr>
          <td><strong>${h.period.label}</strong></td>
          <td>${new Date(h.releasedAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</td>
          <td style="color:#888;">${h.notes||"—"}</td>
        </tr>`).join("")}</tbody>
      </table></div>`;
    } catch { wrap.innerHTML="<p>Error loading history.</p>"; }
  }
}

//----- Edit Slip Modal ----- //
function openEditSlipModal(row, c, onSave) {
  document.getElementById("editSlipModal")?.remove();
 
  const p  = row.payroll || {};
  // FIXED: always call calcBenefits so b is never undefined
  const b  = c.benefits || calcBenefits(c.effectiveBasic || parseFloat(p.basicPay||0), p);
  const f  = v => (parseFloat(v)||0).toFixed(2);  // format for inputs
 
  const modal = document.createElement("div");
  modal.id    = "editSlipModal";
  modal.className = "stat-modal-overlay";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;";
 
  // Build the HTML — note: NO nested template literals with ${} inside attribute strings
  // to avoid parsing issues. Use data attributes for all dynamic values.
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
 
      <!-- Header -->
      <div style="padding:18px 20px 14px;border-bottom:2px solid #fcd34d;position:sticky;top:0;background:#fff;z-index:2;border-radius:16px 16px 0 0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="font-size:1rem;font-weight:700;color:#92400e;margin:0;">✏️ Edit Payslip — ${row.employee.name}</p>
            <p style="font-size:0.8rem;color:#888;margin:3px 0 0;">${row.employee.role} · Changes apply to this payslip only</p>
          </div>
          <button id="esCloseBtn" style="border:none;background:none;font-size:1.2rem;cursor:pointer;color:#999;padding:0 4px;">✕</button>
        </div>
      </div>
 
      <!-- Body -->
      <div style="padding:20px;">
 
        <!-- Time & Pay -->
        <p style="font-weight:700;color:#444;margin:0 0 10px;font-size:0.9rem;">⏱️ Time &amp; Pay</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <label class="admin-form-label">Total Hours Worked
            <input type="number" id="es_hours" class="admin-form-input" value="${f(c.effectiveHours)}" min="0" step="0.5" />
            <span style="font-size:0.72rem;color:#aaa;">Attendance logged: ${row.attendance.totalHours}h</span>
          </label>
          <label class="admin-form-label">Overtime Hours
            <input type="number" id="es_ot" class="admin-form-input" value="${f(c.effectiveOT)}" min="0" step="0.5" />
          </label>
          <label class="admin-form-label">Hourly Rate ₱
            <input type="number" id="es_hourlyRate" class="admin-form-input" value="${f(c.effectiveHourly)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Set 0 to use semi-monthly basic instead</span>
          </label>
          <label class="admin-form-label">Semi-Monthly Basic ₱
            <input type="number" id="es_basicPay" class="admin-form-input" value="${f(c.effectiveBasic)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Used only when hourly rate = 0</span>
          </label>
          <label class="admin-form-label">Overtime Rate ₱/hr
            <input type="number" id="es_otRate" class="admin-form-input" value="${f(c.effectiveOTRate)}" min="0" step="0.01" />
          </label>
          <label class="admin-form-label">Commission ₱
            <input type="number" id="es_commission" class="admin-form-input" value="${f(c.commission)}" min="0" step="0.01" />
          </label>
        </div>
 
        <!-- Benefits -->
        <p style="font-weight:700;color:#444;margin:0 0 4px;font-size:0.9rem;">🏛️ Benefit Deductions (Semi-Monthly)</p>
        <p style="font-size:0.78rem;color:#888;margin:0 0 12px;">
          Override computed or manual amounts for this payslip only.
          <span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:3px;font-size:0.7rem;">computed</span> = auto-calculated.
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <label class="admin-form-label">SSS ₱ ${!b.sssIsManual?`<span style="background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;font-size:0.68rem;">computed</span>`:""}
            <input type="number" id="es_sss" class="admin-form-input" value="${f(c.sssSemi)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Monthly ≈ ₱${(c.sssSemi*2).toFixed(2)}</span>
          </label>
          <label class="admin-form-label">PhilHealth ₱ ${!b.philIsManual?`<span style="background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;font-size:0.68rem;">computed</span>`:""}
            <input type="number" id="es_phil" class="admin-form-input" value="${f(c.philSemi)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Monthly ≈ ₱${(c.philSemi*2).toFixed(2)}</span>
          </label>
          <label class="admin-form-label">Pag-IBIG ₱ ${!b.pagIbigIsManual?`<span style="background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;font-size:0.68rem;">computed</span>`:""}
            <input type="number" id="es_pagibig" class="admin-form-input" value="${f(c.pagIbigSemi)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Monthly ≈ ₱${(c.pagIbigSemi*2).toFixed(2)}</span>
          </label>
          <label class="admin-form-label">Withholding Tax ₱ ${!b.taxIsManual?`<span style="background:#fee2e2;color:#991b1b;padding:1px 4px;border-radius:3px;font-size:0.68rem;">not set</span>`:""}
            <input type="number" id="es_tax" class="admin-form-input" value="${f(c.taxSemi)}" min="0" step="0.01" />
            <span style="font-size:0.72rem;color:#aaa;">Monthly ≈ ₱${(c.taxSemi*2).toFixed(2)}</span>
          </label>
        </div>
 
        <!-- Live preview box -->
        <div id="esPreviewBox" style="background:#f8f9fa;border:1.5px solid #e0e0e0;border-radius:10px;padding:14px;margin-bottom:18px;">
          <p style="font-weight:700;color:#555;font-size:0.82rem;margin:0 0 10px;">📊 Live Preview</p>
          <div id="esPreviewContent"></div>
        </div>
 
        <!-- Buttons -->
        <div style="display:flex;gap:10px;">
          <button id="esApplyBtn" style="flex:1;padding:11px 0;border:none;border-radius:30px;background:linear-gradient(135deg,#d44d7c,#e8739b);color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;">
            ✅ Apply to Payslip
          </button>
          <button id="esResetBtn" style="padding:11px 18px;border:none;border-radius:30px;background:#6c757d;color:#fff;font-weight:600;font-size:0.9rem;cursor:pointer;">↺ Reset</button>
          <button id="esCancelBtn" style="padding:11px 18px;border:none;border-radius:30px;background:#6c757d;color:#fff;font-weight:600;font-size:0.9rem;cursor:pointer;">Cancel</button>
        </div>
 
      </div>
    </div>`;
 
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
 
  // ── Helpers ──
  const fmt2 = v => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  const getVal = id => parseFloat(document.getElementById(id)?.value ?? 0) || 0;
 
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
 
  // Wire close buttons immediately after appending
  document.getElementById("esCloseBtn").onclick  = close;
  document.getElementById("esCancelBtn").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
 
  // ── Live preview ──
  function updatePreview() {
    // Build a temporary row with current input values
    const draftRow = {
      ...row,
      _editHours:      getVal("es_hours"),
      _editOT:         getVal("es_ot"),
      _editHourlyRate: getVal("es_hourlyRate"),
      _editBasicPay:   getVal("es_basicPay"),
      _editOTRate:     getVal("es_otRate"),
      _editCommission: getVal("es_commission"),
      _editSSS:        getVal("es_sss"),
      _editPhil:       getVal("es_phil"),
      _editPagIbig:    getVal("es_pagibig"),
      _editTax:        getVal("es_tax"),
    };
    const dc = calcNet(draftRow);
    const nc = dc.net >= 0 ? "#065f46" : "#991b1b";
 
    document.getElementById("esPreviewContent").innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 16px;font-size:0.83rem;">
        <div style="background:#fff;border-radius:8px;padding:8px 10px;">
          <span style="color:#888;font-size:0.75rem;display:block;">Base Pay</span>
          <strong>${fmt2(dc.basePay)}</strong>
          <span style="font-size:0.7rem;color:#aaa;"> ${dc.hourlyBased?"hourly":"semi-basic"}</span>
        </div>
        <div style="background:#fff;border-radius:8px;padding:8px 10px;">
          <span style="color:#888;font-size:0.75rem;display:block;">OT Pay</span>
          <strong>${fmt2(dc.otPay)}</strong>
        </div>
        <div style="background:#fff;border-radius:8px;padding:8px 10px;">
          <span style="color:#888;font-size:0.75rem;display:block;">Commission</span>
          <strong>${fmt2(dc.commission)}</strong>
        </div>
        <div style="background:#fff;border-radius:8px;padding:8px 10px;">
          <span style="color:#888;font-size:0.75rem;display:block;">Gross</span>
          <strong style="color:#065f46;">${fmt2(dc.gross)}</strong>
        </div>
        <div style="background:#fff;border-radius:8px;padding:8px 10px;">
          <span style="color:#888;font-size:0.75rem;display:block;">Deductions</span>
          <strong style="color:#721c24;">−${fmt2(dc.deductions)}</strong>
          ${dc.advance > 0 ? `<span style="font-size:0.7rem;color:#856404;display:block;">+adv −${fmt2(dc.advance)}</span>` : ""}
        </div>
        <div style="background:${nc === "#065f46" ? "#d1fae5" : "#fee2e2"};border-radius:8px;padding:8px 10px;border:1px solid ${nc === "#065f46" ? "#6ee7b7" : "#fca5a5"};">
          <span style="color:${nc};font-size:0.75rem;display:block;font-weight:600;">NET PAY</span>
          <strong style="color:${nc};font-size:1.05rem;">${fmt2(dc.net)}</strong>
        </div>
      </div>`;
  }
 
  // Attach input listeners — use "input" event so preview fires on every keystroke
  ["es_hours","es_ot","es_hourlyRate","es_basicPay","es_otRate","es_commission",
   "es_sss","es_phil","es_pagibig","es_tax"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updatePreview);
  });
 
  // Run once immediately to populate preview
  updatePreview();
 
  // ── Reset ──
  document.getElementById("esResetBtn").onclick = () => {
    document.getElementById("es_hours").value      = f(c.effectiveHours);
    document.getElementById("es_ot").value         = f(c.effectiveOT);
    document.getElementById("es_hourlyRate").value = f(c.effectiveHourly);
    document.getElementById("es_basicPay").value   = f(c.effectiveBasic);
    document.getElementById("es_otRate").value     = f(c.effectiveOTRate);
    document.getElementById("es_commission").value = f(c.commission);
    document.getElementById("es_sss").value        = f(c.sssSemi);
    document.getElementById("es_phil").value       = f(c.philSemi);
    document.getElementById("es_pagibig").value    = f(c.pagIbigSemi);
    document.getElementById("es_tax").value        = f(c.taxSemi);
    updatePreview();
  };
 
  // ── Apply ──
  document.getElementById("esApplyBtn").onclick = () => {
    const overrides = {
      _editHours:       getVal("es_hours"),
      _editOT:          getVal("es_ot"),
      _editHourlyRate:  getVal("es_hourlyRate"),
      _editBasicPay:    getVal("es_basicPay"),
      _editOTRate:      getVal("es_otRate"),
      _editCommission:  getVal("es_commission"),
      _editSSS:         getVal("es_sss"),
      _editPhil:        getVal("es_phil"),
      _editPagIbig:     getVal("es_pagibig"),
      _editTax:         getVal("es_tax"),
      // keep table OT/commission inputs in sync
      manualOT:         getVal("es_ot"),
      manualCommission: getVal("es_commission"),
    };
    close();
    onSave(overrides);
    showToast(`${row.employee.name}'s payslip updated. Click 🖨️ Slip to preview.`, "success");
  };
}

/* ── Groomer Picker Modal ── */
async function openGroomerPickerModal(bookingId, booking, setOutcomeFn) {
  document.getElementById("groomerPickerModal")?.remove();
  let groomers = [];
  try {
    const res  = await fetch("/api/admin/employees");
    const data = await res.json();
    groomers   = (data.employees || []).filter(e => e.role === "Groomer" && e.status === "active");
  } catch (_) {}

  const requestedId   = booking?.requestedGroomerId   || null;
  const requestedName = booking?.requestedGroomerName || null;

  let options = `<option value="">— No specific groomer —</option>`;
  if (requestedName) options += `<option value="${requestedId}" selected>✂️ ${requestedName} (requested)</option>`;
  groomers.forEach(g => {
    if (g._id === requestedId) return;
    options += `<option value="${g._id}">${g.name} — ${g.role}</option>`;
  });

  const modal = document.createElement("div");
  modal.id    = "groomerPickerModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:420px;width:95%;">
      <div class="stat-modal-header" style="border-bottom-color:#6ee7b7;">
        <h3 class="stat-modal-title" style="color:#065f46;">✅ Mark as Completed</h3>
        <button class="stat-modal-close" id="groomerPickerClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;display:flex;flex-direction:column;gap:16px;">
        ${requestedName ? `<div style="background:#fce7f0;border:1px solid #f9c0d2;border-radius:8px;padding:10px 14px;font-size:0.88rem;"><strong>Requested groomer:</strong> ${requestedName}</div>` : ""}
        <label class="admin-form-label">Who actually groomed the pet(s)?
          <select id="actualGroomerSelect" class="admin-form-input">${options}</select>
        </label>
        <label class="admin-form-label">Note (optional)
          <input type="text" id="completionNote" class="admin-form-input" placeholder="e.g. Completed on time" />
        </label>
        <div style="display:flex;gap:10px;">
          <button class="btn" id="confirmDoneBtn" style="background:linear-gradient(135deg,#059669,#10b981);flex:1;">Confirm Done</button>
          <button class="btn" id="cancelDoneBtn" style="background:#6c757d;">Cancel</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("groomerPickerClose").onclick = close;
  document.getElementById("cancelDoneBtn").onclick      = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.getElementById("confirmDoneBtn").onclick = async () => {
    const groomerId = document.getElementById("actualGroomerSelect").value || null;
    const note      = document.getElementById("completionNote").value.trim();
    close();
    await setOutcomeFn(bookingId, "completed", groomerId, note);
  };
}

/* ── Payslip Detail Modal ── */
function openPayslipModal(row, c, from, to) {
  document.getElementById("payslipModal")?.remove();
 
  const fmt = v => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  const p   = row.payroll || {};
  // FIXED: always derive benefits so labels never crash
  const b   = c.benefits || calcBenefits(c.effectiveBasic || parseFloat(p.basicPay||0), p);
  const isEdited = Object.keys(row).some(k => k.startsWith("_edit"));
 
  const basePayLabel = c.hourlyBased
    ? `Hourly Pay (${fmt(c.effectiveHourly)}/hr × ${c.effectiveHours}h)`
    : `Semi-Monthly Basic Pay`;
 
  const computedTag = `<span style="font-size:0.68rem;background:#fef3c7;color:#92400e;padding:0 4px;border-radius:3px;margin-left:4px;">auto</span>`;
 
  const modal = document.createElement("div");
  modal.id = "payslipModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:520px;width:96%;max-height:92vh;overflow-y:auto;">
      <div class="stat-modal-header" style="border-bottom-color:#f9c0d2;position:sticky;top:0;background:#fff;z-index:2;">
        <div>
          <h3 class="stat-modal-title" style="color:#9d174d;">🧾 Payslip — ${row.employee.name}</h3>
          <p style="font-size:0.8rem;color:#888;margin:2px 0 0;">
            ${row.employee.role} &bull; ${from} to ${to}
            ${isEdited ? `<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:0.7rem;margin-left:6px;">✏️ edited</span>` : ""}
          </p>
        </div>
        <button class="stat-modal-close" id="payslipClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;">
 
        <p style="font-weight:700;color:#444;margin-bottom:8px;">Attendance</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Days Present</span><span class="profile-info-value">${row.attendance.daysPresent}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Hours Worked</span><span class="profile-info-value">${c.effectiveHours}h</span></div>
        </div>
 
        <p style="font-weight:700;color:#444;margin-bottom:8px;">Earnings</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item" style="grid-column:1/-1;">
            <span class="profile-info-label">${basePayLabel}</span>
            <span class="profile-info-value">${fmt(c.basePay)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">OT (${c.effectiveOT}h × ${fmt(c.effectiveOTRate)}/hr)</span>
            <span class="profile-info-value">${fmt(c.otPay)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Commission</span>
            <span class="profile-info-value">${fmt(c.commission)}</span>
          </div>
          <div class="profile-info-item" style="grid-column:1/-1;border-top:1px solid #f0e0e8;padding-top:8px;margin-top:4px;">
            <span class="profile-info-label">Gross Pay</span>
            <span class="profile-info-value" style="font-weight:700;font-size:1.05rem;">${fmt(c.gross)}</span>
          </div>
        </div>
 
        <p style="font-weight:700;color:#444;margin-bottom:4px;">Government Benefit Deductions <span style="font-size:0.75rem;font-weight:400;color:#888;">(semi-monthly share)</span></p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item">
            <span class="profile-info-label">SSS ${!b.sssIsManual ? computedTag : ""}</span>
            <span class="profile-info-value" style="color:#721c24;">${fmt(c.sssSemi)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label" style="font-size:0.72rem;color:#aaa;">Monthly</span>
            <span class="profile-info-value" style="font-size:0.8rem;color:#aaa;">${fmt(c.sssSemi*2)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">PhilHealth ${!b.philIsManual ? computedTag : ""}</span>
            <span class="profile-info-value" style="color:#721c24;">${fmt(c.philSemi)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label" style="font-size:0.72rem;color:#aaa;">Monthly</span>
            <span class="profile-info-value" style="font-size:0.8rem;color:#aaa;">${fmt(c.philSemi*2)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Pag-IBIG ${!b.pagIbigIsManual ? computedTag : ""}</span>
            <span class="profile-info-value" style="color:#721c24;">${fmt(c.pagIbigSemi)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label" style="font-size:0.72rem;color:#aaa;">Monthly</span>
            <span class="profile-info-value" style="font-size:0.8rem;color:#aaa;">${fmt(c.pagIbigSemi*2)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Withholding Tax ${!b.taxIsManual ? `<span style="font-size:0.68rem;background:#fee2e2;color:#991b1b;padding:0 4px;border-radius:3px;margin-left:3px;">not set</span>` : ""}</span>
            <span class="profile-info-value" style="color:#721c24;">${fmt(c.taxSemi)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label" style="font-size:0.72rem;color:#aaa;">Monthly</span>
            <span class="profile-info-value" style="font-size:0.8rem;color:#aaa;">${fmt(c.taxSemi*2)}</span>
          </div>
          ${c.advance > 0 ? `
          <div class="profile-info-item">
            <span class="profile-info-label">Advance Salary</span>
            <span class="profile-info-value" style="color:#856404;">${fmt(c.advance)}</span>
          </div><div class="profile-info-item"></div>` : ""}
          <div class="profile-info-item" style="grid-column:1/-1;border-top:1px solid #f0e0e8;padding-top:8px;margin-top:4px;">
            <span class="profile-info-label">Total Deductions</span>
            <span class="profile-info-value" style="color:#721c24;font-weight:700;">${fmt(c.deductions + c.advance)}</span>
          </div>
        </div>
 
        <div style="background:${c.net>=0?"#d1fae5":"#fee2e2"};border:1px solid ${c.net>=0?"#6ee7b7":"#fca5a5"};border-radius:10px;padding:16px;text-align:center;margin-bottom:16px;">
          <p style="margin:0;font-size:0.85rem;color:${c.net>=0?"#065f46":"#991b1b"};">Net Pay</p>
          <p style="margin:4px 0 0;font-size:1.7rem;font-weight:700;color:${c.net>=0?"#065f46":"#991b1b"};">${fmt(c.net)}</p>
          ${c.net<0?`<p style="font-size:0.78rem;color:#991b1b;margin:4px 0 0;">Advance exceeds net — carry over balance.</p>`:""}
        </div>
 
        <button id="printPayslipBtn" style="width:100%;padding:12px;border:none;border-radius:30px;background:linear-gradient(135deg,#9d174d,#d44d7c);color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>`;
 
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
 
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("payslipClose").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.getElementById("printPayslipBtn").onclick = () => printPayslip(row, c, from, to);
}

/* ── Attendance Adjust Modal ── */
function openAdjustModal(id, timeIn, timeOut, from, to, reloadFn) {
  document.getElementById("adjustModal")?.remove();
  const fmt = (iso) => iso ? new Date(iso).toISOString().slice(0,16) : "";
  const modal = document.createElement("div");
  modal.id = "adjustModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:400px;width:95%;">
      <div class="stat-modal-header" style="border-bottom-color:#f9c0d2;">
        <h3 class="stat-modal-title" style="color:#9d174d;">Adjust Attendance</h3>
        <button class="stat-modal-close" id="adjustClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <label class="admin-form-label">Time In
          <input type="datetime-local" id="adjTimeIn" class="admin-form-input" value="${fmt(timeIn)}" />
        </label>
        <label class="admin-form-label">Time Out
          <input type="datetime-local" id="adjTimeOut" class="admin-form-input" value="${fmt(timeOut)}" />
        </label>
        <label class="admin-form-label">Admin Note
          <input type="text" id="adjNote" class="admin-form-input" placeholder="Reason for adjustment" />
        </label>
        <button class="btn" id="adjSaveBtn">Save</button>
        <p id="adjMsg" style="font-size:0.85rem;color:#d44d7c;display:none;"></p>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("adjustClose").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.getElementById("adjSaveBtn").onclick = async () => {
    const msg = document.getElementById("adjMsg");
    try {
      const res    = await fetch(`/api/admin/attendance/${id}/adjust`, {
        method:  "POST",
        headers: {"Content-Type":"application/json"},
        body:    JSON.stringify({
          timeIn:  document.getElementById("adjTimeIn").value  || null,
          timeOut: document.getElementById("adjTimeOut").value || null,
          note:    document.getElementById("adjNote").value.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) { close(); if (reloadFn) reloadFn(); }
      else { msg.textContent = result.message; msg.style.display = "block"; }
    } catch { msg.textContent = "Error saving."; msg.style.display = "block"; }
  };
}

/* ── Print Payslip ── */
function printPayslip(row, c, from, to) {
  const fmt = v => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  const p   = row.payroll || {};
  const b   = c.benefits || calcBenefits(c.effectiveBasic || parseFloat(p.basicPay||0), p);
  const now = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
  const isEdited = Object.keys(row).some(k => k.startsWith("_edit"));
 
  const basePayLabel = c.hourlyBased
    ? `Hourly Pay (${fmt(c.effectiveHourly)}/hr × ${c.effectiveHours} hrs)`
    : `Semi-Monthly Basic Pay (½ of ${fmt(c.effectiveBasic)} / month)`;
 
  const autoTag = `<span style="background:#fef3c7;color:#92400e;border-radius:3px;padding:0 4px;font-size:9px;font-weight:700;">AUTO</span>`;
 
  const bRow = (label, semi, monthly, isManual, idNum) => `
    <tr>
      <td>${label} ${!isManual ? autoTag : ""}${idNum ? `<div style="color:#aaa;font-size:9px;padding-left:10px;">No. ${idNum}</div>` : ""}</td>
      <td style="text-align:right;color:#721c24;">${fmt(semi)}</td>
      <td style="text-align:right;color:#aaa;font-size:11px;">${fmt(monthly)}</td>
    </tr>`;
 
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payslip — ${row.employee.name} — ${from}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:"DM Sans",Arial,sans-serif;font-size:12.5px;color:#1a1a2e;background:#fff;padding:32px 40px;max-width:700px;margin:auto;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d44d7c;padding-bottom:16px;margin-bottom:20px;}
    .brand{display:flex;align-items:center;gap:12px;}
    .logo{width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid #f9c0d2;}
    .logo-fb{width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#d44d7c,#9d174d);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;border:2px solid #f9c0d2;}
    .bname{font-family:"DM Serif Display",serif;font-size:22px;color:#9d174d;line-height:1;}
    .bsub{font-size:10px;color:#d44d7c;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:3px;}
    .dmeta{text-align:right;}
    .dtitle{font-family:"DM Serif Display",serif;font-size:18px;color:#9d174d;letter-spacing:2px;text-transform:uppercase;}
    .dsub{font-size:10.5px;color:#888;margin-top:4px;line-height:1.6;}
    .empband{background:linear-gradient(135deg,#fce7f0,#fff5f8);border:1px solid #f9c0d2;border-radius:10px;padding:13px 17px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;}
    .ename{font-family:"DM Serif Display",serif;font-size:17px;color:#9d174d;}
    .erole{font-size:11px;color:#888;margin-top:2px;}
    .period{background:#9d174d;color:#fff;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700;}
    .edited{display:inline-block;background:#fef3c7;color:#92400e;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:700;margin-top:4px;}
    .sec{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#d44d7c;margin:16px 0 7px;padding-bottom:4px;border-bottom:1px solid #f9c0d2;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    td{padding:5px 8px;vertical-align:top;}
    tr:nth-child(even) td{background:#fdf7fa;}
    .thd td{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;padding-bottom:3px;border-bottom:1px solid #e0e0e0;}
    .subtot td{border-top:1px solid #d44d7c;font-weight:700;padding-top:7px;}
    .netbox{margin:16px 0 22px;border:2px solid ${c.net>=0?"#6ee7b7":"#fca5a5"};background:${c.net>=0?"#d1fae5":"#fee2e2"};border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;}
    .netlabel{font-size:11px;font-weight:700;color:${c.net>=0?"#065f46":"#991b1b"};text-transform:uppercase;letter-spacing:.5px;}
    .netamt{font-family:"DM Serif Display",serif;font-size:28px;color:${c.net>=0?"#065f46":"#991b1b"};}
    .idgrid{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;font-size:10.5px;color:#555;margin-bottom:14px;}
    .idgrid span{color:#aaa;display:block;font-size:9.5px;}
    .sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:26px;}
    .sig{text-align:center;border-top:1.5px solid #ccc;padding-top:5px;font-size:10px;color:#888;}
    .sig strong{display:block;color:#444;font-size:10.5px;margin-bottom:2px;}
    .foot{margin-top:18px;text-align:center;font-size:9px;color:#ccc;border-top:1px dashed #eee;padding-top:8px;}
    @media print{body{padding:20px 26px;}.noprint{display:none!important;}}
  </style>
</head>
<body>
  <div class="hdr">
    <div class="brand">
      <img src="/images/logo.png" alt="Logo" class="logo" onerror="this.outerHTML='<div class=logo-fb>🐾</div>'" />
      <div><div class="bname">Hungry Paws</div><div class="bsub">Pet Grooming &amp; Hotel</div></div>
    </div>
    <div class="dmeta">
      <div class="dtitle">Payslip</div>
      <div class="dsub">Date Issued: ${now}<br/>Pay Period: ${from} – ${to}</div>
    </div>
  </div>
 
  <div class="empband">
    <div>
      <div class="ename">${row.employee.name}</div>
      <div class="erole">${row.employee.role}${row.employee.email?` · ${row.employee.email}`:""}</div>
      ${isEdited?`<div class="edited">✏️ Manually Adjusted</div>`:""}
    </div>
    <div class="period">${from} – ${to}</div>
  </div>
 
  <div class="sec">Attendance Summary</div>
  <table>
    <tr><td>Days Present</td><td style="text-align:right;font-weight:600;">${row.attendance.daysPresent} day(s)</td><td></td></tr>
    <tr><td>Total Hours Worked</td><td style="text-align:right;font-weight:600;">${c.effectiveHours} hr(s)</td><td></td></tr>
    ${c.effectiveOT>0?`<tr><td>Overtime Hours</td><td style="text-align:right;font-weight:600;">${c.effectiveOT} hr(s)</td><td></td></tr>`:""}
  </table>
 
  <div class="sec">Earnings</div>
  <table>
    <tr class="thd"><td>Description</td><td style="text-align:right;">This Period</td><td style="text-align:right;">Notes</td></tr>
    <tr><td>${basePayLabel}</td><td style="text-align:right;">${fmt(c.basePay)}</td><td style="text-align:right;color:#aaa;font-size:11px;">${c.hourlyBased?`${fmt(c.effectiveHourly)}/hr`:`÷2`}</td></tr>
    ${c.otPay>0?`<tr><td>Overtime Pay (${c.effectiveOT}h × ${fmt(c.effectiveOTRate)}/hr)</td><td style="text-align:right;">${fmt(c.otPay)}</td><td></td></tr>`:""}
    ${c.commission>0?`<tr><td>Commission / Incentive</td><td style="text-align:right;">${fmt(c.commission)}</td><td></td></tr>`:""}
    <tr class="subtot"><td>Gross Pay</td><td style="text-align:right;">${fmt(c.gross)}</td><td></td></tr>
  </table>
 
  <div class="sec">Statutory Deductions <span style="font-size:9px;font-weight:400;letter-spacing:0;">(semi-monthly employee share)</span></div>
  <table>
    <tr class="thd"><td>Description</td><td style="text-align:right;">This Period</td><td style="text-align:right;">Monthly</td></tr>
    ${bRow("SSS Contribution",           c.sssSemi,    c.sssSemi*2,    b.sssIsManual,    p.sssNo)}
    ${bRow("PhilHealth Contribution",    c.philSemi,   c.philSemi*2,   b.philIsManual,   p.philHealthNo)}
    ${bRow("Pag-IBIG (HDMF)",           c.pagIbigSemi,c.pagIbigSemi*2,b.pagIbigIsManual,p.pagIbigNo)}
    ${c.taxSemi>0?bRow("Withholding Tax",c.taxSemi,    c.taxSemi*2,    b.taxIsManual,    p.tin):""}
    ${c.advance>0?`<tr style="color:#856404;"><td>Advance Salary Deduction</td><td style="text-align:right;">${fmt(c.advance)}</td><td style="text-align:right;">—</td></tr>`:""}
    <tr class="subtot" style="color:#721c24;"><td>Total Deductions</td><td style="text-align:right;">${fmt(c.deductions+c.advance)}</td><td></td></tr>
  </table>
 
  ${(p.sssNo||p.philHealthNo||p.pagIbigNo||p.tin)?`
  <div class="sec">Government ID Numbers</div>
  <div class="idgrid">
    ${p.sssNo?`<div><span>SSS No.</span>${p.sssNo}</div>`:""}
    ${p.philHealthNo?`<div><span>PhilHealth No.</span>${p.philHealthNo}</div>`:""}
    ${p.pagIbigNo?`<div><span>Pag-IBIG No.</span>${p.pagIbigNo}</div>`:""}
    ${p.tin?`<div><span>TIN</span>${p.tin}</div>`:""}
  </div>`:""}
 
  <div class="netbox">
    <div>
      <div class="netlabel">Net Pay — Take Home</div>
      <div style="font-size:10px;color:#888;">${from} to ${to}</div>
      ${c.net<0?`<div style="font-size:10px;color:#991b1b;margin-top:3px;">⚠️ Advance exceeds net — carry over balance</div>`:""}
    </div>
    <div class="netamt">${fmt(c.net)}</div>
  </div>
 
  ${(p.bank||p.bankAcct)?`
  <div class="sec">Payment Details</div>
  <table>
    ${p.bank?`<tr><td>Bank / Wallet</td><td style="text-align:right;">${p.bank}</td></tr>`:""}
    ${p.bankAcct?`<tr><td>Account Number</td><td style="text-align:right;">${p.bankAcct}</td></tr>`:""}
  </table>`:""}
 
  <div class="sigs">
    <div class="sig"><strong>Prepared by</strong><br/><br/>_______________________<br/>HR / Admin Officer</div>
    <div class="sig"><strong>Received by</strong><br/><br/>_______________________<br/>${row.employee.name}</div>
    <div class="sig"><strong>Approved by</strong><br/><br/>_______________________<br/>Management</div>
  </div>
 
  <div class="foot">
    Computer-generated payslip · Hungry Paws Pet Grooming &amp; Hotel · ${now}
    ${isEdited?" · ✏️ Values manually adjusted by admin":""}
  </div>
 
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
 
  const win = window.open("", "_blank", "width=800,height=950");
  if (!win) { showToast("Pop-up blocked — please allow pop-ups for this site.", "warning"); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/* ═══════════════════════════════════════
   GUEST BOOKINGS
═══════════════════════════════════════ */
async function loadGuestBookings() {
  const wrap = document.getElementById("bookingViewGuest");
  if (!wrap) return;
  wrap.innerHTML = "<p>Loading guest bookings...</p>";

  const STATUS_STYLE = {
    pending:  { bg:"#fff3cd", color:"#856404" },
    approved: { bg:"#d4edda", color:"#155724" },
    rejected: { bg:"#f8d7da", color:"#721c24" },
  };

  try {
    const res  = await fetch("/api/guest.bookings?status=all");
    const data = await res.json();
    if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }

    const bookings = data.bookings || [];

    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <div class="cal-type-tabs" style="margin:0;">
          <button class="cal-type-btn active" data-gs="all">All</button>
          <button class="cal-type-btn" data-gs="pending">Pending</button>
          <button class="cal-type-btn" data-gs="approved">Approved</button>
          <button class="cal-type-btn" data-gs="rejected">Rejected</button>
        </div>
        <p style="font-size:0.82rem;color:#888;margin:0;">${bookings.length} total guest bookings</p>
      </div>
      <div id="guestBookingList"></div>
    `;

    let activeFilter = "all";

    function renderGuest() {
      const list     = document.getElementById("guestBookingList");
      const filtered = activeFilter === "all" ? bookings : bookings.filter(b => b.status === activeFilter);

      if (!filtered.length) {
        list.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No ${activeFilter === "all" ? "" : activeFilter + " "}guest bookings found.</p>`;
        return;
      }

      list.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead>
              <tr>
                <th>Owner</th><th>Pet</th><th>Services</th><th>Date & Time</th>
                <th>Groomer Req.</th><th>Submitted</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(b => {
                const s       = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
                const date    = new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                const svcs    = Array.isArray(b.services) ? b.services.join(", ") : b.services;
                const subDate = new Date(b.createdAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                return `
                  <tr>
                    <td>
                      <strong>${b.ownerName}</strong>
                      <p style="font-size:0.75rem;color:#888;margin:0;">${b.email}</p>
                      <p style="font-size:0.75rem;color:#888;margin:0;">${b.phone}</p>
                    </td>
                    <td>
                      <strong>${b.petName}</strong>
                      <p style="font-size:0.75rem;color:#888;margin:0;">${b.breed} • ${b.gender}</p>
                      ${b.age ? `<p style="font-size:0.75rem;color:#888;margin:0;">${b.age}</p>` : ""}
                    </td>
                    <td style="max-width:160px;font-size:0.82rem;">${svcs}</td>
                    <td style="white-space:nowrap;">${date}<br/><span style="color:#888;font-size:0.8rem;">${b.appointmentTime}</span></td>
                    <td style="font-size:0.82rem;">${b.requestedGroomerName || "—"}</td>
                    <td style="font-size:0.8rem;color:#888;">${subDate}</td>
                    <td>
                      <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">${b.status.toUpperCase()}</span>
                      ${b.rejectReason ? `<p style="font-size:0.72rem;color:#888;margin:2px 0 0;">${b.rejectReason}</p>` : ""}
                    </td>
                    <td style="white-space:nowrap;">
                      <button class="hist-btn guest-detail-btn" style="background:#dbeafe;color:#1e40af;" data-id="${b._id}">View</button>
                      ${b.status === "pending" ? `
                        <button class="hist-btn hist-complete guest-approve-btn" data-id="${b._id}">✅ Approve</button>
                        <button class="hist-btn hist-noshow guest-reject-btn" data-id="${b._id}">❌ Reject</button>
                      ` : `
                        <button class="hist-btn hist-cancel guest-pending-btn" data-id="${b._id}">↩ Pending</button>
                      `}
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`;

      list.querySelectorAll(".guest-detail-btn").forEach(btn => {
        btn.onclick = () => {
          const b = bookings.find(x => x._id === btn.dataset.id);
          if (b) openGuestDetailModal(b);
        };
      });

      // ── Guest Approve ──
      list.querySelectorAll(".guest-approve-btn").forEach(btn => {
        btn.onclick = async () => {
          const b = bookings.find(x => x._id === btn.dataset.id);
          const confirmed = await showConfirm({
            title:       "Approve Guest Booking?",
            message:     `A confirmation email will be sent to ${b?.email}.`,
            confirmText: "Yes, Approve",
            cancelText:  "Cancel",
          });
          if (!confirmed) return;
          try {
            const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/approve`, { method:"PUT" });
            const result = await res.json();
            if (result.success) { showToast(result.message, "success"); loadGuestBookings(); }
            else showToast(result.message, "error");
          } catch { showToast("Error approving booking.", "error"); }
        };
      });

      // ── Guest Reject ──
      list.querySelectorAll(".guest-reject-btn").forEach(btn => {
        btn.onclick = () => {
          showRejectModal(btn.dataset.id, async (reason) => {
            try {
              const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/reject`, {
                method:  "PUT",
                headers: {"Content-Type":"application/json"},
                body:    JSON.stringify({ reason }),
              });
              const result = await res.json();
              if (result.success) { showToast(result.message, "success"); loadGuestBookings(); }
              else showToast(result.message, "error");
            } catch { showToast("Error rejecting booking.", "error"); }
          });
        };
      });

      // ── Guest Revert to Pending ──
      list.querySelectorAll(".guest-pending-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!await showConfirm({title:"Confirm Action",message:"Move this booking back to pending?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
          try {
            const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/pending`, { method:"PUT" });
            const result = await res.json();
            if (result.success) { showToast(result.message, "success"); loadGuestBookings(); }
            else showToast(result.message, "error");
          } catch { showToast("Error updating booking.", "error"); }
        };
      });
    }

    wrap.querySelectorAll(".cal-type-btn[data-gs]").forEach(btn => {
      btn.onclick = () => {
        wrap.querySelectorAll(".cal-type-btn[data-gs]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.gs;
        renderGuest();
      };
    });

    renderGuest();

  } catch (err) {
    console.error(err);
    wrap.innerHTML = "<p>Error loading guest bookings.</p>";
  }
}

/* ── Guest Detail Modal ── */
function openGuestDetailModal(b) {
  document.getElementById("guestDetailModal")?.remove();
  const svcs   = Array.isArray(b.services) ? b.services.join(", ") : b.services;
  const date   = new Date(b.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const rabies = b.lastAntiRabiesShot ? new Date(b.lastAntiRabiesShot).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "Not provided";

  const STATUS_STYLE = { pending:{bg:"#fff3cd",color:"#856404"}, approved:{bg:"#d4edda",color:"#155724"}, rejected:{bg:"#f8d7da",color:"#721c24"} };
  const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;

  const modal = document.createElement("div");
  modal.id = "guestDetailModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:500px;width:95%;">
      <div class="stat-modal-header" style="border-bottom-color:#93c5fd;">
        <div>
          <h3 class="stat-modal-title" style="color:#1e40af;">👤 Guest Booking</h3>
          <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">${b.status.toUpperCase()}</span>
        </div>
        <button class="stat-modal-close" id="guestDetailClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;">
        <p style="font-weight:700;color:#444;margin-bottom:8px;">Owner</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Name</span><span class="profile-info-value">${b.ownerName}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Email</span><span class="profile-info-value">${b.email}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Phone</span><span class="profile-info-value">${b.phone}</span></div>
        </div>
        <p style="font-weight:700;color:#444;margin-bottom:8px;">Pet</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Name</span><span class="profile-info-value">${b.petName}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Breed</span><span class="profile-info-value">${b.breed}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Gender</span><span class="profile-info-value">${b.gender}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Age</span><span class="profile-info-value">${b.age || "—"}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Last Anti-Rabies</span><span class="profile-info-value">${rabies}</span></div>
        </div>
        <p style="font-weight:700;color:#444;margin-bottom:8px;">Appointment</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Date</span><span class="profile-info-value">${date}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Time</span><span class="profile-info-value">${b.appointmentTime}</span></div>
          <div class="profile-info-item" style="grid-column:1/-1;"><span class="profile-info-label">Services</span><span class="profile-info-value">${svcs}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Requested Groomer</span><span class="profile-info-value">${b.requestedGroomerName || "No preference"}</span></div>
        </div>
        ${b.rejectReason ? `<div style="background:#fee2e2;border-radius:8px;padding:12px;font-size:0.85rem;"><strong>Rejection reason:</strong> ${b.rejectReason}</div>` : ""}
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("guestDetailClose").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
}

/* ═══════════════════════════════════════
   ADMIN FEEDBACK SECTION
═══════════════════════════════════════ */
async function loadFeedbackSection() {
  content.innerHTML = `
    <h2>Customer Feedback</h2>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;">
      <div class="cal-type-tabs" style="margin:0;">
        <button class="cal-type-btn active" data-fb="all">All</button>
        <button class="cal-type-btn" data-fb="featured">⭐ Featured</button>
        <button class="cal-type-btn" data-fb="Grooming">Grooming</button>
        <button class="cal-type-btn" data-fb="Pet Hotel">Pet Hotel</button>
        <button class="cal-type-btn" data-fb="General">General</button>
      </div>
    </div>
    <div id="feedbackListWrap"><p>Loading...</p></div>
  `;

  let activeFilter = "all";

  try {
    const res  = await fetch("/api/feedback/all");
    const data = await res.json();
    if (!data.success) { document.getElementById("feedbackListWrap").innerHTML = `<p>Error: ${data.message}</p>`; return; }

    const feedbacks = data.feedbacks || [];

    function renderFeedbacks() {
      const wrap = document.getElementById("feedbackListWrap");
      let filtered = feedbacks;
      if (activeFilter === "featured")  filtered = feedbacks.filter(f => f.featured);
      else if (activeFilter !== "all")  filtered = feedbacks.filter(f => f.serviceType === activeFilter);

      if (!filtered.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:32px 0;">No feedback found.</p>`; return; }

      const rows = filtered.map(f => {
        const stars     = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
        const starColor = f.rating >= 4 ? "#f59e0b" : f.rating === 3 ? "#fb923c" : "#ef4444";
        const date      = new Date(f.createdAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
        return `
          <tr>
            <td>
              <strong style="font-size:0.92rem;">${f.name || "Anonymous"}</strong>
              ${f.email ? `<p style="font-size:0.75rem;color:#888;margin:0;">${f.email}</p>` : ""}
            </td>
            <td>
              <span style="color:${starColor};font-size:1rem;letter-spacing:1px;">${stars}</span>
              <span style="font-size:0.75rem;color:#aaa;margin-left:4px;">(${f.rating}/5)</span>
            </td>
            <td><span class="leave-status-badge" style="background:#f5d5d5;color:#9d174d;">${f.serviceType || "General"}</span></td>
            <td style="max-width:280px;font-size:0.85rem;color:#444;font-style:italic;">"${f.comment}"</td>
            <td style="font-size:0.78rem;color:#888;">${date}</td>
            <td style="white-space:nowrap;">
              <button class="fb-feature-btn ${f.featured ? "on" : "off"}" data-id="${f._id}" data-featured="${f.featured}">
                ${f.featured ? "★ Featured" : "☆ Feature"}
              </button>
              <button class="hist-btn hist-cancel fb-del-btn" data-id="${f._id}" style="margin-left:4px;">Delete</button>
            </td>
          </tr>`;
      }).join("");

      wrap.innerHTML = `
        <p style="font-size:0.82rem;color:#888;margin-bottom:12px;">${filtered.length} feedback${filtered.length !== 1 ? "s" : ""} found
          · <strong style="color:#f59e0b;">${feedbacks.filter(f=>f.featured).length} featured</strong> (shown on homepage)
        </p>
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead>
              <tr><th>Customer</th><th>Rating</th><th>Service</th><th>Comment</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

      wrap.querySelectorAll(".fb-feature-btn").forEach(btn => {
        btn.onclick = async () => {
          const isFeatured = btn.dataset.featured === "true";
          try {
            const res    = await fetch(`/api/feedback/${btn.dataset.id}/feature`, {
              method:  "PUT",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ featured: !isFeatured }),
            });
            const result = await res.json();
            if (result.success) {
              const fb = feedbacks.find(x => x._id === btn.dataset.id);
              if (fb) fb.featured = !isFeatured;
              renderFeedbacks();
            } else showToast(result.message, "error");
          } catch { showToast("Error updating feedback.", "error"); }
        };
      });

      wrap.querySelectorAll(".fb-del-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!await showConfirm({title:"Confirm Action",message:"Delete this feedback?",confirmText:"Yes",cancelText:"Cancel",danger:true})) return;
          try {
            const res    = await fetch(`/api/feedback/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
              const idx = feedbacks.findIndex(x => x._id === btn.dataset.id);
              if (idx !== -1) feedbacks.splice(idx, 1);
              renderFeedbacks();
              showToast("Feedback deleted.", "success");
            } else showToast(result.message, "error");
          } catch { showToast("Error deleting feedback.", "error"); }
        };
      });
    }

    content.querySelectorAll(".cal-type-btn[data-fb]").forEach(btn => {
      btn.onclick = () => {
        content.querySelectorAll(".cal-type-btn[data-fb]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.fb;
        renderFeedbacks();
      };
    });

    renderFeedbacks();
  } catch (err) {
    console.error(err);
    document.getElementById("feedbackListWrap").innerHTML = "<p>Error loading feedback.</p>";
  }
}