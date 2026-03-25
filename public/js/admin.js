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
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  pollUnreadMessages();
  setInterval(pollUnreadMessages, 30000);
});

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
        <p class="admin-stat-num" style="color:${c.num};">${value ?? "u2014"}</p>
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
          <p>Loading bookingsu2026</p>
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
    ? new Date(el.dataset.joined).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}) : "u2014";

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
          <span class="profile-info-value">${contact || "u2014"}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Address</span>
          <span class="profile-info-value">${address || "u2014"}</span>
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
        alert("Profile updated!"); loadProfile();
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
      if (result.success) { alert("Password updated!"); loadProfile(); }
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

    <!-- Add/Edit Form -->
    <div id="empForm" style="display:none;margin-bottom:24px;">
      <div class="admin-form-box" style="max-width:600px;">
        <h3 id="empFormTitle" style="color:#d44d7c;margin-bottom:16px;">Add Employee</h3>
        <input type="hidden" id="empId" />

        <!-- Form tabs -->
        <div class="ops-tabs" style="margin-bottom:16px;">
          <button class="ops-tab-btn active" data-tab="info">Info</button>
          <button class="ops-tab-btn" data-tab="payroll">Payroll</button>
        </div>

        <!-- INFO TAB -->
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

        <!-- PAYROLL TAB -->
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

    <!-- Employee list -->
    <div id="empListWrap"><p>Loading employees...</p></div>
  `;

  /* Form tab switching */
  document.querySelectorAll("#empForm .ops-tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#empForm .ops-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("empTabInfo").style.display    = btn.dataset.tab === "info"    ? "block" : "none";
      document.getElementById("empTabPayroll").style.display = btn.dataset.tab === "payroll" ? "block" : "none";
    };
  });

  document.getElementById("addEmpBtn").onclick   = () => openEmpForm(null);
  document.getElementById("cancelEmpBtn").onclick = () => { document.getElementById("empForm").style.display = "none"; };
  document.getElementById("saveEmpBtn").onclick   = saveEmployee;
  await fetchAndRenderEmployees();
}

function openEmpForm(emp) {
  const form = document.getElementById("empForm");
  document.getElementById("empFormTitle").textContent = emp ? "Edit Employee" : "Add Employee";

  /* Reset to info tab */
  document.querySelectorAll("#empForm .ops-tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector("#empForm .ops-tab-btn[data-tab='info']").classList.add("active");
  document.getElementById("empTabInfo").style.display    = "block";
  document.getElementById("empTabPayroll").style.display = "none";

  /* Info fields */
  document.getElementById("empId").value        = emp ? emp._id        : "";
  document.getElementById("empName").value      = emp ? emp.name       : "";
  document.getElementById("empRole").value      = emp ? emp.role       : "";
  document.getElementById("empEmail").value     = emp ? emp.email      : "";
  document.getElementById("empContact").value   = emp ? emp.contact    : "";
  document.getElementById("empAddress").value   = emp ? emp.address    : "";
  document.getElementById("empShift").value     = emp ? emp.shift      : "";
  document.getElementById("empDateHired").value = emp && emp.dateHired ? emp.dateHired.slice(0,10) : "";
  document.getElementById("empStatus").value    = emp ? emp.status     : "active";
  document.getElementById("empPassword").value  = ""; // never pre-fill

  /* Payroll fields */
  const p = emp?.payroll || {};
  document.getElementById("empBasicPay").value      = p.basicPay      || "";
  document.getElementById("empHourlyRate").value    = p.hourlyRate    || "";
  document.getElementById("empOvertimeRate").value  = p.overtimeRate  || "";
  document.getElementById("empCommissionRate").value= p.commissionRate|| "";
  document.getElementById("empSSSNo").value         = p.sssNo         || "";
  document.getElementById("empSSSAmt").value        = p.sssAmt        || "";
  document.getElementById("empPhilHealthNo").value  = p.philHealthNo  || "";
  document.getElementById("empPhilHealthAmt").value = p.philHealthAmt || "";
  document.getElementById("empPagIbigNo").value     = p.pagIbigNo     || "";
  document.getElementById("empPagIbigAmt").value    = p.pagIbigAmt    || "";
  document.getElementById("empTIN").value           = p.tin           || "";
  document.getElementById("empTax").value           = p.tax           || "";
  document.getElementById("empBank").value          = p.bank          || "";
  document.getElementById("empBankAcct").value      = p.bankAcct      || "";
  document.getElementById("empPayrollNotes").value  = p.notes         || "";

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
              ${e.email   ? `<p class="emp-card-meta">${e.email}</p>`   : ""}
              ${e.contact ? `<p class="emp-card-meta">${e.contact}</p>` : ""}
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

    /* Click card → detail view */
    wrap.querySelectorAll(".emp-card-clickable").forEach((card) => {
      card.onclick = (ev) => {
        if (ev.target.closest("button")) return; // don't open detail on button click
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
        if (!confirm("Delete this employee?")) return;
        try {
          const res    = await fetch(`/api/admin/employees/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) await fetchAndRenderEmployees();
          else alert(result.message);
        } catch (err) { alert("Error deleting employee."); }
      };
    });
  } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading employees.</p>"; }
}

/* ── Employee Detail Modal ── */
function openEmpDetail(emp) {
  document.getElementById("empDetailModal")?.remove();

  const STATUS_COLOR = { active:"#d4edda", inactive:"#f8d7da", "on leave":"#fff3cd" };
  const STATUS_TEXT  = { active:"#155724", inactive:"#721c24", "on leave":"#856404" };
  const sc = STATUS_COLOR[emp.status] || "#e9ecef";
  const st = STATUS_TEXT[emp.status]  || "#333";
  const p  = emp.payroll || {};

  const fmt  = (v) => v ? `₱${parseFloat(v).toLocaleString("en-PH", {minimumFractionDigits:2})}` : "—";
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

      <!-- Detail tabs -->
      <div class="ops-tabs" style="padding:12px 20px 0;border-bottom:1px solid #f0e0e8;">
        <button class="ops-tab-btn active" data-dtab="info">Info</button>
        <button class="ops-tab-btn" data-dtab="payroll">Payroll</button>
      </div>

      <div class="stat-modal-body" style="padding:20px;">

        <!-- INFO TAB -->
        <div id="dtabInfo">
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-info-label">Status</span>
              <span class="emp-status-badge" style="background:${sc};color:${st};">${(emp.status||"active").toUpperCase()}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Email</span>
              <span class="profile-info-value">${emp.email || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Contact</span>
              <span class="profile-info-value">${emp.contact || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Address</span>
              <span class="profile-info-value">${emp.address || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Shift</span>
              <span class="profile-info-value">${emp.shift || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Date Hired</span>
              <span class="profile-info-value">${hired}</span>
            </div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px;">
            <button class="btn" id="empDetailEditBtn">Edit Info</button>
          </div>
        </div>

        <!-- PAYROLL TAB -->
        <div id="dtabPayroll" style="display:none;">
          <p style="font-weight:700;color:#d44d7c;margin-bottom:10px;">Compensation</p>
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-info-label">Basic Pay (monthly)</span>
              <span class="profile-info-value">${fmt(p.basicPay)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Hourly Rate</span>
              <span class="profile-info-value">${fmt(p.hourlyRate)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Overtime Rate</span>
              <span class="profile-info-value">${fmt(p.overtimeRate)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Commission Rate</span>
              <span class="profile-info-value">${p.commissionRate ? p.commissionRate + "%" : "—"}</span>
            </div>
          </div>

          <p style="font-weight:700;color:#d44d7c;margin:16px 0 10px;">Government Benefits</p>
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-info-label">SSS No.</span>
              <span class="profile-info-value">${p.sssNo || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">SSS Contribution</span>
              <span class="profile-info-value">${fmt(p.sssAmt)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">PhilHealth No.</span>
              <span class="profile-info-value">${p.philHealthNo || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">PhilHealth Contribution</span>
              <span class="profile-info-value">${fmt(p.philHealthAmt)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Pag-IBIG No.</span>
              <span class="profile-info-value">${p.pagIbigNo || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Pag-IBIG Contribution</span>
              <span class="profile-info-value">${fmt(p.pagIbigAmt)}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">TIN</span>
              <span class="profile-info-value">${p.tin || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Withholding Tax</span>
              <span class="profile-info-value">${fmt(p.tax)}</span>
            </div>
          </div>

          <p style="font-weight:700;color:#d44d7c;margin:16px 0 10px;">Bank / Wallet</p>
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-info-label">Bank / Wallet</span>
              <span class="profile-info-value">${p.bank || "—"}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-info-label">Account Number</span>
              <span class="profile-info-value">${p.bankAcct || "—"}</span>
            </div>
            ${p.notes ? `<div class="profile-info-item" style="grid-column:1/-1;">
              <span class="profile-info-label">Notes</span>
              <span class="profile-info-value">${p.notes}</span>
            </div>` : ""}
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

  /* Detail tab switching */
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
    // Switch to payroll tab after form opens
    setTimeout(() => {
      const btn = document.querySelector("#empForm .ops-tab-btn[data-tab='payroll']");
      if (btn) btn.click();
    }, 50);
  };
}

/* ===============================
   4. ON DUTY u2014 full page
================================ */
async function loadDutySection() {
  content.innerHTML = `
    <h2>Groomer on Duty</h2>
    <div id="dutyPageContent"><p>Loading...</p></div>
  `;
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

    const groomers  = (empData.employees  || []).filter((e) => e.status === "active");
    const allDuty   = (dutyData.duty      || []);
    const today     = new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

    // Group duty by date for display
    const grouped = {};
    allDuty.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });

    wrap.innerHTML = `
      <div class="duty-page-layout">

        <!-- LEFT: Add assignment form -->
        <div class="duty-form-panel">
          <div class="ops-section-card">
            <h3 class="ops-card-title">Assign Groomer on Duty</h3>
            <div style="display:flex;flex-direction:column;gap:14px;margin-top:12px;">
              <label class="admin-form-label">Groomer / Staff
                <select id="dutyGroomer" class="admin-form-input">
                  <option value="">Select employee</option>
                  ${groomers.map((g) => `<option value="${g._id}">${g.name} u2014 ${g.role}</option>`).join("")}
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

        <!-- RIGHT: Schedule list -->
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
                        <button class="duty-remove-btn" data-id="${d._id}">u2715</button>
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
      if (!groomerId || !date) { alert("Please select an employee and date."); return; }
      try {
        const res    = await fetch("/api/admin/operations/duty", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ groomerId, date, notes }) });
        const result = await res.json();
        if (result.success) await renderDutyPage();
        else alert(result.message);
      } catch (err) { alert("Error assigning duty."); }
    };

    wrap.querySelectorAll(".duty-remove-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Remove this duty assignment?")) return;
        try {
          const res    = await fetch(`/api/admin/operations/duty/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) await renderDutyPage();
          else alert(result.message);
        } catch (err) { alert("Error removing assignment."); }
      };
    });

  } catch (err) {
    console.error(err);
    wrap.innerHTML = "<p>Error loading duty schedule.</p>";
  }
}

/* ===============================
   5. LEAVE REQUESTS u2014 full page
================================ */
async function loadLeaveSection() {
  content.innerHTML = `
    <h2>Leave Requests</h2>
    <div id="leavePageContent"><p>Loading...</p></div>
  `;
  await renderLeavePage();
}

async function renderLeavePage() {
  const wrap = document.getElementById("leavePageContent");
  if (!wrap) return;

  try {
    const res  = await fetch("/api/admin/operations/leave");
    const data = await res.json();
    const leaves = data.leaves || [];

    const STATUS_STYLE = {
      pending:  { bg:"#fff3cd", color:"#856404" },
      approved: { bg:"#d4edda", color:"#155724" },
      rejected: { bg:"#f8d7da", color:"#721c24" },
    };

    // Summary counts
    const counts = { pending:0, approved:0, rejected:0 };
    leaves.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });

    wrap.innerHTML = `

      <!-- Summary badges -->
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

      <!-- File Leave Form -->
      <div id="leaveForm" style="display:none;margin-bottom:24px;">
        <div class="admin-form-box" style="max-width:520px;">
          <h3 style="color:#d44d7c;margin-bottom:16px;">File Leave Request</h3>
          <label class="admin-form-label">Employee *
            <select id="leaveEmployee" class="admin-form-input">
              <option value="">Loading...</option>
            </select>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label class="admin-form-label">From *
              <input type="date" id="leaveFrom" class="admin-form-input" />
            </label>
            <label class="admin-form-label">To *
              <input type="date" id="leaveTo" class="admin-form-input" />
            </label>
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

      <!-- Leave table -->
      <div class="ops-section-card" style="margin-top:0;">
        <h3 class="ops-card-title" style="margin-bottom:16px;">All Leave Requests</h3>
        ${leaves.length === 0
          ? `<p class="cal-empty" style="padding:28px 0;">No leave requests on file.</p>`
          : `<div class="leave-table-wrap">
              <table class="leave-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaves.map((l) => {
                    const s    = STATUS_STYLE[l.status] || STATUS_STYLE.pending;
                    const from = new Date(l.fromDate);
                    const to   = new Date(l.toDate);
                    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
                    return `
                      <tr>
                        <td><strong>${l.employeeName||"u2014"}</strong></td>
                        <td>${l.leaveType||"u2014"}</td>
                        <td>${from.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</td>
                        <td>${to.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</td>
                        <td style="text-align:center;">${days}</td>
                        <td style="max-width:180px;word-break:break-word;">${l.reason||"u2014"}</td>
                        <td>
                          <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">
                            ${(l.status||"pending").toUpperCase()}
                          </span>
                        </td>
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

    /* File leave button u2014 load employee list on open */
    document.getElementById("fileLeaveBtn").onclick = async () => {
      const form = document.getElementById("leaveForm");
      form.style.display = "block";
      form.scrollIntoView({ behavior:"smooth", block:"start" });
      try {
        const r = await fetch("/api/admin/employees");
        const d = await r.json();
        const sel = document.getElementById("leaveEmployee");
        sel.innerHTML = `<option value="">Select employee</option>` +
          (d.employees||[]).map((e) => `<option value="${e._id}">${e.name} u2014 ${e.role}</option>`).join("");
      } catch(_) {}
    };

    document.getElementById("cancelLeaveBtn").onclick = () => {
      document.getElementById("leaveForm").style.display = "none";
    };

    document.getElementById("saveLeaveBtn").onclick = async () => {
      const body = {
        employeeId: document.getElementById("leaveEmployee").value,
        fromDate:   document.getElementById("leaveFrom").value,
        toDate:     document.getElementById("leaveTo").value,
        leaveType:  document.getElementById("leaveType").value,
        reason:     document.getElementById("leaveReason").value.trim(),
      };
      if (!body.employeeId || !body.fromDate || !body.toDate) { alert("Employee and dates are required."); return; }
      try {
        const res    = await fetch("/api/admin/operations/leave", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const result = await res.json();
        if (result.success) await renderLeavePage();
        else alert(result.message);
      } catch (err) { alert("Error filing leave."); }
    };

    wrap.querySelectorAll(".leave-approve-btn").forEach((btn) => {
      btn.onclick = async () => {
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/approve`, { method:"PUT" });
          const result = await res.json();
          if (result.success) await renderLeavePage();
          else alert(result.message);
        } catch (err) { alert("Error approving leave."); }
      };
    });

    wrap.querySelectorAll(".leave-reject-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Reject this leave request?")) return;
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/reject`, { method:"PUT" });
          const result = await res.json();
          if (result.success) await renderLeavePage();
          else alert(result.message);
        } catch (err) { alert("Error rejecting leave."); }
      };
    });

    wrap.querySelectorAll(".leave-del-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Delete this leave request?")) return;
        try {
          const res = await fetch(`/api/admin/operations/leave/${btn.dataset.id}`, { method:"DELETE" });
          const result = await res.json();
          if (result.success) await renderLeavePage();
          else alert(result.message);
        } catch (err) { alert("Error deleting leave."); }
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
          try { const res = await fetch(`/api/contact/${btn.dataset.id}/read`,{method:"PUT"}); const r = await res.json(); if(r.success){loadMessages(status);pollUnreadMessages();}else alert(r.message); } catch(err){alert("Error");}
        };
      });
      document.querySelectorAll(".deleteMessageBtn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Delete this message?")) return;
          try { const res = await fetch(`/api/contact/${btn.dataset.id}`,{method:"DELETE"}); const r = await res.json(); if(r.success){alert(r.message);loadMessages(status);pollUnreadMessages();}else alert(r.message); } catch(err){alert("Error");}
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
    const res = await fetch("/api/contact/unread-count");
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
      btn.classList.add("selected"); ta.value = btn.dataset.reason !== "Other" ? btn.dataset.reason : "";
      if (btn.dataset.reason === "Other") ta.focus();
    });
  });
  modal.querySelector("#rejectConfirmBtn").onclick = () => { const r = ta.value.trim()||"Rejected by admin"; modal.remove(); onConfirm(r); };
  modal.querySelector("#rejectCancelBtn").onclick  = () => modal.remove();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

/* ===============================
   7. BOOKINGS u2014 CALENDAR VIEW
================================ */
function loadBookingsSection(defaultTab = "calendar") {
  content.innerHTML = `
    <h2>Manage Bookings</h2>

    <!-- Top-level view tabs -->
    <div class="ops-tabs" style="margin-bottom:20px;">
      <button class="ops-tab-btn ${defaultTab === "calendar" ? "active" : ""}" data-view="calendar">&#128197; Calendar</button>
      <button class="ops-tab-btn ${defaultTab === "history"  ? "active" : ""}" data-view="history">&#128203; Booking History</button>
      <button class="ops-tab-btn ${defaultTab === "guest"    ? "active" : ""}" data-view="guest">&#128100; Guest Bookings</button>
    </div>

    <!-- Calendar view -->
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
    </div><!-- /bookingViewCalendar -->

    <!-- History view -->
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
    allBookings = results; renderCal(); updateBadge();
    if (selDate) { window.innerWidth<=768?openDrawer(selDate):populateSidePanel(selDate); }
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
      const c={pending:0,approved:0,rejected:0}; dayB.forEach((b)=>{if(c[b.status]!==undefined)c[b.status]++;});
      const dr=document.createElement("div"); dr.className="cal-dot-row";
      if(c.pending)  dr.innerHTML+=`<span class="cal-mini-dot cal-mini-pending">${c.pending}</span>`;
      if(c.approved) dr.innerHTML+=`<span class="cal-mini-dot cal-mini-approved">${c.approved}</span>`;
      if(c.rejected) dr.innerHTML+=`<span class="cal-mini-dot cal-mini-rejected">${c.rejected}</span>`;
      if(dr.innerHTML) cell.appendChild(dr);
    } else {
      dayB.slice(0,3).forEach((b)=>{
        const dot=document.createElement("div"); dot.className=`cal-dot cal-dot-${b.type}-${b.status}`;
        let p="G ";
        if(b.type==="hotel"){if(b.hotelCheckoutDate){const ci=midnight(new Date(b.appointmentDate)),co=midnight(new Date(b.hotelCheckoutDate)),cur=midnight(date);if(cur.getTime()===ci.getTime())p="H-CI ";else if(cur.getTime()===co.getTime())p="H-CO ";else p="H-";}else p="H ";}
        dot.textContent=p+(b.userName||"?").split(" ")[0]; cell.appendChild(dot);
      });
      if(dayB.length>3){const m=document.createElement("div");m.className="cal-more";m.textContent=`+${dayB.length-3} more`;cell.appendChild(m);}
    }
    if(!other) cell.addEventListener("click",()=>{selDate=date;renderCal();window.innerWidth<=768?openDrawer(date):populateSidePanel(date);});
    return cell;
  }

  function buildCard(b,isPending,listEl) {
    const item=document.createElement("div"); item.className="cal-booking-item";
    const pH=b.pets.map((p)=>`<span class="cal-pet-chip"><img src="/images/default-pet.png" data-s3key="${p.photo||""}" alt="${p.name}" class="cal-pet-av pet-photo"/>${p.name}</span>`).join("");
    const dH=b.type==="hotel"?`Check-in: ${new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"})} ${b.appointmentTime||""} &bull; Check-out: ${b.hotelCheckoutDate?new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"}):"N/A"} ${b.hotelCheckoutTime||""}`:`Time: ${b.appointmentTime||"N/A"} &bull; ${Array.isArray(b.services)?b.services.join(", "):(b.services||"")}`;
    const sb=isPending?"":`<span class="cal-status-badge cal-status-${b.status}">${b.status.toUpperCase()}</span>`;
    const ac=isPending?`<div class="cal-bi-actions"><button class="cal-btn-approve" data-id="${b._id}">Approve</button><button class="cal-btn-reject" data-id="${b._id}">Reject</button></div>`:`<div class="cal-bi-actions"><button class="cal-btn-edit" data-id="${b._id}">Move to Pending</button></div>`;
    const groomerLine=b.requestedGroomerName?`<p class="cal-bi-detail" style="color:#d44d7c;">✂️ Requested groomer: <strong>${b.requestedGroomerName}</strong></p>`:""; item.innerHTML=`<div class="cal-bi-top"><div><p class="cal-bi-name">${b.userName||"Unknown"}</p><p class="cal-bi-email">${b.userEmail||""}</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><span class="cal-type-pill ${b.type==="hotel"?"cal-pill-hotel":"cal-pill-grooming"}">${b.type}</span>${sb}</div></div><div class="cal-bi-pets">${pH}</div><p class="cal-bi-detail">${dH}</p>${groomerLine}<p class="cal-bi-contact">${b.userContact||""}</p>${ac}`;
    listEl.appendChild(item);
    item.querySelectorAll(".pet-photo[data-s3key]").forEach(async(img)=>{const k=img.dataset.s3key;if(!k)return;try{const r=await fetch(`/api/file?name=${encodeURIComponent(k)}`);const d=await r.json();if(d.success)img.src=d.url;}catch(_){}});
    const ab=item.querySelector(".cal-btn-approve");
    if(ab){ab.onclick=async()=>{if(!confirm("Approve this booking?"))return;try{const r=await fetch(`/api/admin/bookings/${ab.dataset.id}/approve`,{method:"PUT"});const rs=await r.json();if(rs.success){closeDrawer();alert(rs.message);await fetchAll();}else alert(rs.message);}catch(e){alert("Error approving booking");}};}
    const rb=item.querySelector(".cal-btn-reject");
    if(rb){rb.onclick=()=>{showRejectModal(rb.dataset.id,async(reason)=>{try{const r=await fetch(`/api/admin/bookings/${rb.dataset.id}/reject`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});const rs=await r.json();if(rs.success){closeDrawer();alert(rs.message);await fetchAll();}else alert(rs.message);}catch(e){alert("Error rejecting booking");}});};}
    const eb=item.querySelector(".cal-btn-edit");
    if(eb){eb.onclick=async()=>{if(!confirm("Move this booking back to pending?"))return;try{const r=await fetch(`/api/admin/bookings/${eb.dataset.id}/pending`,{method:"PUT",headers:{"Content-Type":"application/json"}});const rs=await r.json();if(rs.success){closeDrawer();alert(rs.message);await fetchAll();}else alert(rs.message);}catch(e){alert("Error updating booking");}};}
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

  document.getElementById("calDrawerClose").onclick=closeDrawer;
  document.getElementById("calDrawerOverlay").onclick=closeDrawer;
  function updateBadge(){document.getElementById("calBadge").textContent=allBookings.filter((b)=>b.status==="pending").length;}
  document.getElementById("calPrev").onclick=()=>{mo--;if(mo<0){mo=11;yr--;}renderCal();};
  document.getElementById("calNext").onclick=()=>{mo++;if(mo>11){mo=0;yr++;}renderCal();};
  document.querySelectorAll(".cal-type-btn").forEach((btn)=>{btn.onclick=()=>{document.querySelectorAll(".cal-type-btn").forEach((b)=>b.classList.remove("active"));btn.classList.add("active");activeType=btn.dataset.type;fetchAll();};});
  window.addEventListener("resize",()=>renderCal());
  fetchAll();

  /* ── View tab switching (Calendar / History) ── */
  document.querySelectorAll(".ops-tab-btn[data-view]").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".ops-tab-btn[data-view]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cal   = document.getElementById("bookingViewCalendar");
      const hist  = document.getElementById("bookingViewHistory");
      const guest = document.getElementById("bookingViewGuest");
      cal.style.display   = "none";
      hist.style.display  = "none";
      guest.style.display = "none";
      if (btn.dataset.view === "calendar") { cal.style.display  = "block"; }
      else if (btn.dataset.view === "history") { hist.style.display = "block"; loadBookingHistory(); }
      else if (btn.dataset.view === "guest")   { guest.style.display = "block"; loadGuestBookings(); }
    };
  });

  /* If defaultTab is history, load it now */
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
    /* Fetch all approved bookings for both types */
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
      completed:   { bg:"#d1fae5", color:"#065f46", label:"Completed"      },
      "no-show":   { bg:"#fee2e2", color:"#991b1b", label:"No Show"        },
      "cancelled": { bg:"#f3f4f6", color:"#374151", label:"Cancelled"      },
      rescheduled: { bg:"#dbeafe", color:"#1e40af", label:"Rescheduled"    },
    };

    /* Filter controls */
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
        const outcomeMatch = activeHOutcome === "all"
          ? true
          : activeHOutcome === "none"
            ? !b.outcome
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
                <th>Customer</th>
                <th>Pets</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Services</th>
                <th>Outcome</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((b) => {
                const isHotel   = b.type === "hotel";
                const dateStr   = new Date(b.appointmentDate).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                const coStr     = isHotel && b.hotelCheckoutDate
                  ? ` → ${new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric"})}`
                  : "";
                const petsStr   = Array.isArray(b.pets) ? b.pets.map((p) => p.name||p).join(", ") : "—";
                const svcStr    = !isHotel && b.services
                  ? (Array.isArray(b.services) ? b.services.join(", ") : b.services)
                  : isHotel ? "Pet Hotel" : "—";
                const oc        = b.outcome;
                const ocStyle   = oc ? (OUTCOME_STYLE[oc] || { bg:"#e9ecef", color:"#333", label:oc }) : null;
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
                      ${oc
                        ? `<span class="leave-status-badge" style="background:${ocStyle.bg};color:${ocStyle.color};">${ocStyle.label}</span>`
                        : `<span style="color:#aaa;font-size:0.8rem;">—</span>`}
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

      /* Outcome buttons */
      const setOutcome = async (id, outcome, groomerId = null, note = "") => {
        try {
          const res    = await fetch(`/api/admin/bookings/${id}/outcome`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ outcome, outcomeNote: note, actualGroomerId: groomerId }),
          });
          const result = await res.json();
          if (result.success) {
            const b = bookings.find((x) => x._id === id);
            if (b) { b.outcome = outcome; b.outcomeNote = note; }
            renderHistory();
          } else alert(result.message);
        } catch (err) { alert("Error updating outcome."); }
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
          setOutcome(btn.dataset.id, "no-show", note);
        };
      });
      list.querySelectorAll(".hist-cancel").forEach((btn) => {
        btn.onclick = async () => {
          const note = prompt("Cancellation reason (optional):", "") ?? "";
          setOutcome(btn.dataset.id, "cancelled", note);
        };
      });
      list.querySelectorAll(".hist-resched").forEach((btn) => {
        btn.onclick = async () => {
          const note = prompt("New date or note:", "") ?? "";
          setOutcome(btn.dataset.id, "rescheduled", note);
        };
      });
    }

    /* Filter tab listeners */
    wrap.querySelectorAll(".cal-type-btn[data-htype]").forEach((btn) => {
      btn.onclick = () => {
        wrap.querySelectorAll(".cal-type-btn[data-htype]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeHType = btn.dataset.htype;
        renderHistory();
      };
    });
    wrap.querySelectorAll(".cal-type-btn[data-houtcome]").forEach((btn) => {
      btn.onclick = () => {
        wrap.querySelectorAll(".cal-type-btn[data-houtcome]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeHOutcome = btn.dataset.houtcome;
        renderHistory();
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
   - Semi-monthly (1–15 and 16–end of month)
   - Admin manually inputs OT hours + commission per employee
   - Advance salary tracked and deducted from next period
   - Deductions: SSS, PhilHealth, Pag-IBIG, withholding tax
═══════════════════════════════════════ */
async function loadPayrollSection() {
  content.innerHTML = `<h2>Payroll</h2><p>Loading...</p>`;

  function getPeriods(year, month) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const pad = (n) => String(n).padStart(2, "0");
    return [
      { label: `${year}-${pad(month+1)}-01 to ${year}-${pad(month+1)}-15`, from: `${year}-${pad(month+1)}-01`, to: `${year}-${pad(month+1)}-15` },
      { label: `${year}-${pad(month+1)}-16 to ${year}-${pad(month+1)}-${lastDay}`, from: `${year}-${pad(month+1)}-16`, to: `${year}-${pad(month+1)}-${lastDay}` },
    ];
  }

  const now      = new Date();
  const curPeriod = now.getDate() <= 15
    ? getPeriods(now.getFullYear(), now.getMonth())[0]
    : getPeriods(now.getFullYear(), now.getMonth())[1];

  let periodOptions = "";
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    getPeriods(d.getFullYear(), d.getMonth()).reverse().forEach(p => {
      const sel = p.from === curPeriod.from ? " selected" : "";
      periodOptions += `<option value="${p.from}|${p.to}"${sel}>${p.label}</option>`;
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

    <!-- PAYSLIPS TAB -->
    <div id="ptabPayslips">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:8px;">
          Period:
          <select id="periodSelect" class="admin-form-input" style="width:auto;min-width:240px;">${periodOptions}</select>
        </label>
        <button class="btn" id="loadPayslipsBtn">Load</button>
        <button class="btn" id="releasePayrollBtn" style="background:#065f46;">✅ Mark as Released</button>
      </div>
      <p style="font-size:0.82rem;color:#888;margin:-12px 0 16px;">
        OT hours and commission can be entered per employee before releasing payroll.
        Advance salary already given this period will be automatically deducted.
      </p>
      <div id="payslipList"><p style="color:#aaa;">Select a period and click Load.</p></div>
    </div>

    <!-- ATTENDANCE TAB -->
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

    <!-- ADVANCES TAB -->
    <div id="ptabAdvances" style="display:none;">
      <div style="margin-bottom:20px;">
        <div class="ops-section-card" style="max-width:480px;margin-bottom:20px;">
          <h3 class="ops-card-title">Give Advance Salary</h3>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
            <label class="admin-form-label">Employee
              <select id="advEmployee" class="admin-form-input">
                <option value="">Loading employees...</option>
              </select>
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
    </div>

    <!-- HISTORY TAB -->
    <div id="ptabHistory" style="display:none;">
      <div id="payrollHistoryList"><p>Loading...</p></div>
    </div>
  `;

  /* ── Tab switching ── */
  document.querySelectorAll(".ops-tab-btn[data-ptab]").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".ops-tab-btn[data-ptab]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ["Payslips","Attendance","Advances","History"].forEach(t => {
        const el = document.getElementById(`ptab${t}`);
        if (el) el.style.display = btn.dataset.ptab === t.toLowerCase() ? "block" : "none";
      });
      if (btn.dataset.ptab === "history")   loadReleaseHistory();
      if (btn.dataset.ptab === "advances")  initAdvancesTab();
    };
  });

  /* ── Load payslips ── */
  document.getElementById("loadPayslipsBtn").onclick = loadPayslips;
  loadPayslips();

  /* ── Release payroll ── */
  document.getElementById("releasePayrollBtn").onclick = async () => {
    const [from, to] = document.getElementById("periodSelect").value.split("|");
    if (!confirm(`Mark payroll for ${from} to ${to} as released? This will be recorded in history.`)) return;
    try {
      const res    = await fetch("/api/admin/payroll/release", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ from, to }) });
      const result = await res.json();
      if (result.success) alert("Payroll released and recorded!");
      else alert(result.message);
    } catch { alert("Error releasing payroll."); }
  };

  /* ── Attendance tab ── */
  document.getElementById("loadAttendanceBtn").onclick = loadAttendanceView;

  /* ─────────────────────────────
     PAYSLIPS LOADER
  ───────────────────────────── */
  async function loadPayslips() {
    const wrap = document.getElementById("payslipList");
    const [from, to] = document.getElementById("periodSelect").value.split("|");
    wrap.innerHTML = "<p>Loading...</p>";

    try {
      const res  = await fetch(`/api/admin/payroll?from=${from}&to=${to}`);
      const data = await res.json();
      if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }
      if (!data.payroll.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No active employees found.</p>`; return; }

      const fmt = (v) => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;

      /* Store mutable OT/commission per row */
      const rowData = data.payroll.map(p => ({
        ...p,
        manualOT:         0,
        manualCommission: 0,
      }));

      function calcNet(row) {
        const p          = row.payroll || {};
        const semiBasic  = parseFloat(p.basicPay || 0) / 2;
        const otPay      = row.manualOT * parseFloat(p.overtimeRate || 0);
        const commission = row.manualCommission;
        const gross      = semiBasic + otPay + commission;
        const deductions = (parseFloat(p.sssAmt||0) + parseFloat(p.philHealthAmt||0) + parseFloat(p.pagIbigAmt||0) + parseFloat(p.tax||0)) / 2;
        const advance    = parseFloat(row.advance || 0);
        const net        = gross - deductions - advance;
        return { semiBasic, otPay, commission, gross, deductions, advance, net };
      }

      function renderTable() {
        const totalNet = rowData.reduce((s, row) => s + calcNet(row).net, 0);

        wrap.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <p style="font-size:0.85rem;color:#888;">Period: <strong>${from} to ${to}</strong> &bull; ${rowData.length} employees</p>
            <p style="font-weight:700;color:#d44d7c;">Total Net Payroll: ${fmt(totalNet)}</p>
          </div>
          <div class="leave-table-wrap">
            <table class="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Days Present</th>
                  <th>Semi-Basic</th>
                  <th>OT Hours <span style="font-size:0.7rem;font-weight:400;">(edit)</span></th>
                  <th>OT Pay</th>
                  <th>Commission ₱ <span style="font-size:0.7rem;font-weight:400;">(edit)</span></th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Advance</th>
                  <th>Net Pay</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${rowData.map((row, i) => {
                  const c = calcNet(row);
                  return `
                    <tr>
                      <td>
                        <strong>${row.employee.name}</strong>
                        <p style="font-size:0.75rem;color:#888;margin:0;">${row.employee.role}</p>
                      </td>
                      <td style="text-align:center;">${row.attendance.daysPresent}</td>
                      <td>${fmt(c.semiBasic)}</td>
                      <td>
                        <input type="number" class="admin-form-input ot-input" data-idx="${i}"
                          value="${row.manualOT}" min="0" step="0.5"
                          style="width:70px;padding:4px 6px;font-size:0.85rem;" />
                      </td>
                      <td>${fmt(c.otPay)}</td>
                      <td>
                        <input type="number" class="admin-form-input comm-input" data-idx="${i}"
                          value="${row.manualCommission}" min="0" step="0.01"
                          style="width:90px;padding:4px 6px;font-size:0.85rem;" />
                      </td>
                      <td style="font-weight:600;">${fmt(c.gross)}</td>
                      <td style="color:#721c24;">${fmt(c.deductions)}</td>
                      <td style="color:#856404;">${c.advance > 0 ? fmt(c.advance) : "—"}</td>
                      <td style="font-weight:700;color:${c.net >= 0 ? "#065f46" : "#991b1b"};">${fmt(c.net)}</td>
                      <td>
                        <button class="hist-btn hist-complete payslip-btn" data-idx="${i}">Slip</button>
                      </td>
                    </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>`;

        /* OT input listeners */
        wrap.querySelectorAll(".ot-input").forEach(inp => {
          inp.onchange = () => {
            rowData[inp.dataset.idx].manualOT = parseFloat(inp.value) || 0;
            renderTable();
          };
        });

        /* Commission input listeners */
        wrap.querySelectorAll(".comm-input").forEach(inp => {
          inp.onchange = () => {
            rowData[inp.dataset.idx].manualCommission = parseFloat(inp.value) || 0;
            renderTable();
          };
        });

        /* Payslip detail buttons */
        wrap.querySelectorAll(".payslip-btn").forEach(btn => {
          btn.onclick = () => {
            const row = rowData[btn.dataset.idx];
            const c   = calcNet(row);
            openPayslipModal(row, c, from, to);
          };
        });
      }

      renderTable();

    } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading payslips.</p>"; }
  }

  /* ─────────────────────────────
     ATTENDANCE VIEW
  ───────────────────────────── */
  async function loadAttendanceView() {
    const wrap = document.getElementById("attendanceList");
    const from = document.getElementById("attFrom").value;
    const to   = document.getElementById("attTo").value;
    if (!from || !to) { alert("Please select both dates."); return; }
    wrap.innerHTML = "<p>Loading...</p>";

    try {
      const res  = await fetch(`/api/admin/attendance?from=${from}&to=${to}`);
      const data = await res.json();
      if (!data.success) { wrap.innerHTML = `<p>Error: ${data.message}</p>`; return; }
      if (!data.records.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No records found.</p>`; return; }

      wrap.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>OT</th><th>Note</th><th></th></tr>
            </thead>
            <tbody>
              ${data.records.map(r => {
                const date    = new Date(r.date).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
                const tIn     = r.timeIn  ? new Date(r.timeIn).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                const tOut    = r.timeOut ? new Date(r.timeOut).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                return `
                  <tr>
                    <td><strong>${r.employeeName||"—"}</strong></td>
                    <td>${date}</td>
                    <td>${tIn}</td>
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
          if (!confirm("Delete this attendance record?")) return;
          const res = await fetch(`/api/admin/attendance/${btn.dataset.id}`, { method:"DELETE" });
          const r   = await res.json();
          if (r.success) loadAttendanceView(); else alert(r.message);
        };
      });
    } catch (err) { console.error(err); wrap.innerHTML = "<p>Error loading attendance.</p>"; }
  }

  /* ─────────────────────────────
     ADVANCES TAB
  ───────────────────────────── */
  async function initAdvancesTab() {
    /* Populate employee dropdown */
    try {
      const res  = await fetch("/api/admin/employees");
      const data = await res.json();
      const sel  = document.getElementById("advEmployee");
      if (sel) {
        sel.innerHTML = `<option value="">Select employee</option>` +
          (data.employees||[]).map(e => `<option value="${e._id}">${e.name} — ${e.role}</option>`).join("");
      }
    } catch (_) {}

    loadAdvanceList();

    document.getElementById("giveAdvanceBtn").onclick = async () => {
      const msg    = document.getElementById("advMsg");
      const empId  = document.getElementById("advEmployee").value;
      const amount = parseFloat(document.getElementById("advAmount").value);
      const period = document.getElementById("advPeriod").value;
      const note   = document.getElementById("advNote").value.trim();

      if (!empId || !amount || !period) {
        msg.textContent = "Employee, amount, and period are required.";
        msg.style.display = "block"; return;
      }

      const [from, to] = period.split("|");
      try {
        const res    = await fetch("/api/admin/payroll/advance", {
          method:  "POST",
          headers: {"Content-Type":"application/json"},
          body:    JSON.stringify({ employeeId: empId, amount, periodFrom: from, periodTo: to, note }),
        });
        const result = await res.json();
        if (result.success) {
          document.getElementById("advAmount").value = "";
          document.getElementById("advNote").value   = "";
          msg.style.display = "none";
          alert("Advance salary recorded.");
          loadAdvanceList();
        } else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch { msg.textContent = "Error recording advance."; msg.style.display = "block"; }
    };
  }

  async function loadAdvanceList() {
    const wrap = document.getElementById("advanceList");
    if (!wrap) return;
    try {
      const res  = await fetch("/api/admin/payroll/advances");
      const data = await res.json();
      if (!data.advances.length) { wrap.innerHTML = `<p style="color:#aaa;">No advances recorded yet.</p>`; return; }
      const fmt  = (v) => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
      wrap.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead><tr><th>Employee</th><th>Amount</th><th>Deduct from Period</th><th>Note</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${data.advances.map(a => `
                <tr>
                  <td><strong>${a.employeeName||"—"}</strong></td>
                  <td style="font-weight:600;color:#856404;">${fmt(a.amount)}</td>
                  <td>${a.periodFrom ? a.periodFrom.slice(0,10) : "—"} to ${a.periodTo ? a.periodTo.slice(0,10) : "—"}</td>
                  <td style="font-size:0.8rem;color:#888;">${a.note||"—"}</td>
                  <td>
                    <span class="leave-status-badge" style="background:${a.deducted?"#d4edda":"#fff3cd"};color:${a.deducted?"#155724":"#856404"};">
                      ${a.deducted?"Deducted":"Pending"}
                    </span>
                  </td>
                  <td>
                    ${!a.deducted ? `<button class="hist-btn hist-cancel adv-del-btn" data-id="${a._id}">Remove</button>` : ""}
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;

      wrap.querySelectorAll(".adv-del-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!confirm("Remove this advance record?")) return;
          const res = await fetch(`/api/admin/payroll/advance/${btn.dataset.id}`, { method:"DELETE" });
          const r   = await res.json();
          if (r.success) loadAdvanceList(); else alert(r.message);
        };
      });
    } catch { wrap.innerHTML = "<p>Error loading advances.</p>"; }
  }

  /* ─────────────────────────────
     RELEASE HISTORY
  ───────────────────────────── */
  async function loadReleaseHistory() {
    const wrap = document.getElementById("payrollHistoryList");
    if (!wrap) return;
    wrap.innerHTML = "<p>Loading...</p>";
    try {
      const res  = await fetch("/api/admin/payroll/history");
      const data = await res.json();
      if (!data.history.length) { wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No payroll releases recorded yet.</p>`; return; }
      wrap.innerHTML = `
        <div class="leave-table-wrap">
          <table class="leave-table">
            <thead><tr><th>Period</th><th>Released At</th><th>Notes</th></tr></thead>
            <tbody>
              ${data.history.map(h => `
                <tr>
                  <td><strong>${h.period.label}</strong></td>
                  <td>${new Date(h.releasedAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}</td>
                  <td style="color:#888;">${h.notes||"—"}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    } catch { wrap.innerHTML = "<p>Error loading history.</p>"; }
  }
}

/* ── Payslip Detail Modal ── */
/* ── Groomer Picker Modal (shown when marking booking as Done) ── */
async function openGroomerPickerModal(bookingId, booking, setOutcomeFn) {
  document.getElementById("groomerPickerModal")?.remove();

  // Fetch active groomers
  let groomers = [];
  try {
    const res  = await fetch("/api/admin/employees");
    const data = await res.json();
    groomers   = (data.employees || []).filter(e => e.role === "Groomer" && e.status === "active");
  } catch (_) {}

  const requestedId   = booking?.requestedGroomerId   || null;
  const requestedName = booking?.requestedGroomerName || null;

  // Build groomer options — put requested first if present
  let options = `<option value="">— No specific groomer —</option>`;
  if (requestedName) {
    options += `<option value="${requestedId}" selected>✂️ ${requestedName} (requested)</option>`;
  }
  groomers.forEach(g => {
    if (g._id === requestedId) return; // already added
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

        ${requestedName ? `
          <div style="background:#fce7f0;border:1px solid #f9c0d2;border-radius:8px;padding:10px 14px;font-size:0.88rem;">
            <strong>Requested groomer:</strong> ${requestedName}
          </div>` : ""}

        <label class="admin-form-label">Who actually groomed the pet(s)?
          <select id="actualGroomerSelect" class="admin-form-input">
            ${options}
          </select>
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

function openPayslipModal(row, c, from, to) {
  document.getElementById("payslipModal")?.remove();
  const fmt = (v) => `₱${(v||0).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
  const p   = row.payroll || {};
  const modal = document.createElement("div");
  modal.id = "payslipModal";
  modal.className = "stat-modal-overlay";
  modal.innerHTML = `
    <div class="stat-modal" style="max-width:480px;width:95%;">
      <div class="stat-modal-header" style="border-bottom-color:#f9c0d2;">
        <div>
          <h3 class="stat-modal-title" style="color:#9d174d;">Payslip — ${row.employee.name}</h3>
          <p style="font-size:0.8rem;color:#888;margin:2px 0 0;">${row.employee.role} &bull; ${from} to ${to}</p>
        </div>
        <button class="stat-modal-close" id="payslipClose">&#x2715;</button>
      </div>
      <div class="stat-modal-body" style="padding:20px;">

        <p style="font-weight:700;color:#444;margin-bottom:8px;">Attendance</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Days Present</span><span class="profile-info-value">${row.attendance.daysPresent}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Total Hours Logged</span><span class="profile-info-value">${row.attendance.totalHours}h</span></div>
        </div>

        <p style="font-weight:700;color:#444;margin-bottom:8px;">Earnings</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">Semi-Monthly Basic</span><span class="profile-info-value">${fmt(c.semiBasic)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">OT Hours</span><span class="profile-info-value">${row.manualOT}h @ ${fmt(p.overtimeRate||0)}/hr</span></div>
          <div class="profile-info-item"><span class="profile-info-label">OT Pay</span><span class="profile-info-value">${fmt(c.otPay)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Commission</span><span class="profile-info-value">${fmt(c.commission)}</span></div>
          <div class="profile-info-item" style="grid-column:1/-1;border-top:1px solid #f0e0e8;padding-top:8px;margin-top:4px;">
            <span class="profile-info-label">Gross Pay</span>
            <span class="profile-info-value" style="font-weight:700;font-size:1.05rem;">${fmt(c.gross)}</span>
          </div>
        </div>

        <p style="font-weight:700;color:#444;margin-bottom:8px;">Deductions</p>
        <div class="profile-info-grid" style="margin-bottom:16px;">
          <div class="profile-info-item"><span class="profile-info-label">SSS</span><span class="profile-info-value">${fmt((p.sssAmt||0)/2)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">PhilHealth</span><span class="profile-info-value">${fmt((p.philHealthAmt||0)/2)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Pag-IBIG</span><span class="profile-info-value">${fmt((p.pagIbigAmt||0)/2)}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Withholding Tax</span><span class="profile-info-value">${fmt((p.tax||0)/2)}</span></div>
          ${c.advance > 0 ? `<div class="profile-info-item"><span class="profile-info-label">Advance Salary</span><span class="profile-info-value" style="color:#856404;">${fmt(c.advance)}</span></div>` : ""}
          <div class="profile-info-item" style="grid-column:1/-1;border-top:1px solid #f0e0e8;padding-top:8px;margin-top:4px;">
            <span class="profile-info-label">Total Deductions</span>
            <span class="profile-info-value" style="color:#721c24;font-weight:700;">${fmt(c.deductions + c.advance)}</span>
          </div>
        </div>

        <div style="background:${c.net>=0?"#d1fae5":"#fee2e2"};border:1px solid ${c.net>=0?"#6ee7b7":"#fca5a5"};border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:0.85rem;color:${c.net>=0?"#065f46":"#991b1b"};">Net Pay</p>
          <p style="margin:4px 0 0;font-size:1.7rem;font-weight:700;color:${c.net>=0?"#065f46":"#991b1b"};">${fmt(c.net)}</p>
          ${c.net < 0 ? `<p style="font-size:0.78rem;color:#991b1b;margin:4px 0 0;">Advance exceeds net — carry over balance.</p>` : ""}
        </div>

      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  const close = () => { modal.remove(); document.body.style.overflow = ""; };
  document.getElementById("payslipClose").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
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
      const list = document.getElementById("guestBookingList");
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
                <th>Owner</th>
                <th>Pet</th>
                <th>Services</th>
                <th>Date & Time</th>
                <th>Groomer Req.</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
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
                      <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">
                        ${b.status.toUpperCase()}
                      </span>
                      ${b.rejectReason ? `<p style="font-size:0.72rem;color:#888;margin:2px 0 0;">${b.rejectReason}</p>` : ""}
                    </td>
                    <td style="white-space:nowrap;">
                      <button class="hist-btn guest-detail-btn" style="background:#dbeafe;color:#1e40af;" data-id="${b._id}">View</button>
                      ${b.status === "pending" ? `
                        <button class="hist-btn hist-complete guest-approve-btn" data-id="${b._id}">✅ Approve</button>
                        <button class="hist-btn hist-noshow guest-reject-btn" data-id="${b._id}">❌ Reject</button>
                      ` : b.status !== "pending" ? `
                        <button class="hist-btn hist-cancel guest-pending-btn" data-id="${b._id}">↩ Pending</button>
                      ` : ""}
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`;

      /* Detail view */
      list.querySelectorAll(".guest-detail-btn").forEach(btn => {
        btn.onclick = () => {
          const b = bookings.find(x => x._id === btn.dataset.id);
          if (b) openGuestDetailModal(b);
        };
      });

      /* Approve */
      list.querySelectorAll(".guest-approve-btn").forEach(btn => {
        btn.onclick = async () => {
          const b = bookings.find(x => x._id === btn.dataset.id);
          if (!confirm(`Approve booking for ${b?.ownerName}? An email will be sent to ${b?.email}.`)) return;
          try {
            const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/approve`, { method:"PUT" });
            const result = await res.json();
            if (result.success) { alert(result.message); loadGuestBookings(); }
            else alert(result.message);
          } catch { alert("Error approving booking."); }
        };
      });

      /* Reject */
      list.querySelectorAll(".guest-reject-btn").forEach(btn => {
        btn.onclick = () => {
          const b = bookings.find(x => x._id === btn.dataset.id);
          showRejectModal(btn.dataset.id, async (reason) => {
            try {
              const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/reject`, {
                method:  "PUT",
                headers: {"Content-Type":"application/json"},
                body:    JSON.stringify({ reason }),
              });
              const result = await res.json();
              if (result.success) { alert(result.message); loadGuestBookings(); }
              else alert(result.message);
            } catch { alert("Error rejecting booking."); }
          });
        };
      });

      /* Revert to pending */
      list.querySelectorAll(".guest-pending-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!confirm("Move this booking back to pending?")) return;
          try {
            const res    = await fetch(`/api/guest.bookings/${btn.dataset.id}/pending`, { method:"PUT" });
            const result = await res.json();
            if (result.success) loadGuestBookings();
            else alert(result.message);
          } catch { alert("Error updating booking."); }
        };
      });
    }

    /* Filter tabs */
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
  const svcs = Array.isArray(b.services) ? b.services.join(", ") : b.services;
  const date = new Date(b.appointmentDate).toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
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