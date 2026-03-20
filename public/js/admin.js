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

    <div id="empForm" style="display:none;margin-bottom:24px;">
      <div class="admin-form-box" style="max-width:520px;">
        <h3 id="empFormTitle" style="color:#d44d7c;margin-bottom:16px;">Add Employee</h3>
        <input type="hidden" id="empId" />
        <label class="admin-form-label">Full Name *
          <input type="text" id="empName" class="admin-form-input" placeholder="e.g. Maria Santos" />
        </label>
        <label class="admin-form-label">Role / Position *
          <select id="empRole" class="admin-form-input">
            <option value="">Select role</option>
            <option value="Groomer">Groomer</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Pet Hotel Staff">Pet Hotel Staff</option>
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
        <label class="admin-form-label">Shift Schedule
          <input type="text" id="empShift" class="admin-form-input" placeholder="e.g. Mon–Fri 8AM–5PM" />
        </label>
        <label class="admin-form-label">Status
          <select id="empStatus" class="admin-form-input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on leave">On Leave</option>
          </select>
        </label>
        <div class="admin-form-btns">
          <button class="btn" id="saveEmpBtn">Save Employee</button>
          <button class="btn" id="cancelEmpBtn" style="background:#6c757d;">Cancel</button>
        </div>
        <p id="empMsg" class="admin-form-msg"></p>
      </div>
    </div>

    <div id="empListWrap"><p>Loading employees...</p></div>
  `;

  document.getElementById("addEmpBtn").onclick  = () => openEmpForm(null);
  document.getElementById("cancelEmpBtn").onclick = () => { document.getElementById("empForm").style.display = "none"; };
  document.getElementById("saveEmpBtn").onclick  = saveEmployee;
  await fetchAndRenderEmployees();
}

function openEmpForm(emp) {
  const form = document.getElementById("empForm");
  document.getElementById("empFormTitle").textContent = emp ? "Edit Employee" : "Add Employee";
  document.getElementById("empId").value      = emp ? emp._id     : "";
  document.getElementById("empName").value    = emp ? emp.name    : "";
  document.getElementById("empRole").value    = emp ? emp.role    : "";
  document.getElementById("empEmail").value   = emp ? emp.email   : "";
  document.getElementById("empContact").value = emp ? emp.contact : "";
  document.getElementById("empShift").value   = emp ? emp.shift   : "";
  document.getElementById("empStatus").value  = emp ? emp.status  : "active";
  document.getElementById("empMsg").style.display = "none";
  form.style.display = "block";
  form.scrollIntoView({ behavior:"smooth", block:"start" });
}

async function saveEmployee() {
  const msg  = document.getElementById("empMsg");
  const id   = document.getElementById("empId").value;
  const body = {
    name:    document.getElementById("empName").value.trim(),
    role:    document.getElementById("empRole").value,
    email:   document.getElementById("empEmail").value.trim(),
    contact: document.getElementById("empContact").value.trim(),
    shift:   document.getElementById("empShift").value.trim(),
    status:  document.getElementById("empStatus").value,
  };
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
          <div class="emp-card">
            <div class="emp-card-avatar">${(e.name||"?").charAt(0).toUpperCase()}</div>
            <div class="emp-card-info">
              <p class="emp-card-name">${e.name}</p>
              <p class="emp-card-role">${e.role}</p>
              ${e.email   ? `<p class="emp-card-meta">${e.email}</p>`         : ""}
              ${e.contact ? `<p class="emp-card-meta">${e.contact}</p>`       : ""}
              ${e.shift   ? `<p class="emp-card-meta">🕐 ${e.shift}</p>`      : ""}
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

    wrap.querySelectorAll(".emp-edit-btn").forEach((btn) => {
      btn.onclick = () => { const emp = data.employees.find((e) => e._id === btn.dataset.id); if (emp) openEmpForm(emp); };
    });
    wrap.querySelectorAll(".emp-del-btn").forEach((btn) => {
      btn.onclick = async () => {
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

/* ===============================
   4. ON DUTY — full page
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
   5. LEAVE REQUESTS — full page
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
    const res    = await fetch("/api/admin/operations/leave");
    const data   = await res.json();
    const leaves = data.leaves || [];

    const STATUS_STYLE = {
      pending:  { bg: "#fff3cd", color: "#856404" },
      approved: { bg: "#d4edda", color: "#155724" },
      rejected: { bg: "#f8d7da", color: "#721c24" },
    };

    const counts = { pending: 0, approved: 0, rejected: 0 };
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
        <p class="leave-portal-note">Employees submit leave requests via their own portal.</p>
      </div>

      <!-- Leave table -->
      <div class="ops-section-card" style="margin-top:0;">
        <h3 class="ops-card-title" style="margin-bottom:16px;">All Leave Requests</h3>
        ${leaves.length === 0
          ? `<p class="cal-empty" style="padding:28px 0;">No leave requests submitted yet.</p>`
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
                        <td><strong>${l.employeeName || "—"}</strong></td>
                        <td>${l.leaveType || "—"}</td>
                        <td>${from.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td>${to.toLocaleDateString("en-PH",   { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td style="text-align:center;">${days}</td>
                        <td style="max-width:180px;word-break:break-word;">${l.reason || "—"}</td>
                        <td>
                          <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">
                            ${(l.status || "pending").toUpperCase()}
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

    wrap.querySelectorAll(".leave-approve-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Approve this leave request?")) return;
        try {
          const res    = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/approve`, { method: "PUT" });
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
          const res    = await fetch(`/api/admin/operations/leave/${btn.dataset.id}/reject`, { method: "PUT" });
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
          const res    = await fetch(`/api/admin/operations/leave/${btn.dataset.id}`, { method: "DELETE" });
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
   7. BOOKINGS — CALENDAR VIEW
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>Manage Bookings</h2>
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
    item.innerHTML=`<div class="cal-bi-top"><div><p class="cal-bi-name">${b.userName||"Unknown"}</p><p class="cal-bi-email">${b.userEmail||""}</p></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><span class="cal-type-pill ${b.type==="hotel"?"cal-pill-hotel":"cal-pill-grooming"}">${b.type}</span>${sb}</div></div><div class="cal-bi-pets">${pH}</div><p class="cal-bi-detail">${dH}</p><p class="cal-bi-contact">${b.userContact||""}</p>${ac}`;
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
}