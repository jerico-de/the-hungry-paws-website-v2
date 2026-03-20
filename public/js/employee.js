const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content      = document.getElementById("dashboardContent");

/* ===============================
   Mobile Menu Toggle
================================ */
const menuToggle = document.getElementById("dashboardMenuToggle");
const sidebar    = document.getElementById("dashboardSidebar");
const overlay    = document.getElementById("dashboardOverlay");

if (menuToggle && sidebar && overlay) {
  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = sidebar.classList.contains("active") ? "hidden" : "";
  });
  overlay.addEventListener("click", closeMobile);
  sidebarLinks.forEach(link => link.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeMobile();
  }));
}

function closeMobile() {
  menuToggle.classList.remove("active");
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* ===============================
   Sidebar Navigation
================================ */
sidebarLinks.forEach(link => {
  link.addEventListener("click", () => {
    sidebarLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    const s = link.dataset.section;
    if (s === "overview") loadOverview();
    if (s === "leave")    loadLeave();
    if (s === "duty")     loadDuty();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
});

/* ===============================
   1. OVERVIEW
================================ */
async function loadOverview() {
  content.innerHTML = `<h2>Overview</h2><p>Loading...</p>`;
  try {
    const [empRes, leaveRes, dutyRes] = await Promise.all([
      fetch("/api/employee/me").then(r => r.json()),
      fetch("/api/employee/leave").then(r => r.json()),
      fetch("/api/employee/duty").then(r => r.json()),
    ]);

    const emp    = empRes.employee  || {};
    const leaves = leaveRes.leaves  || [];
    const duties = dutyRes.duty     || [];

    const pending  = leaves.filter(l => l.status === "pending").length;
    const approved = leaves.filter(l => l.status === "approved").length;
    const upcoming = duties.filter(d => new Date(d.date) >= new Date()).length;

    const joined = emp.createdAt
      ? new Date(emp.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" })
      : "—";

    content.innerHTML = `
      <h2>My Profile</h2>

      <div class="profile-section" style="margin-bottom:24px;">
        <div class="profile-avatar-row">
          <div class="profile-avatar-circle">${(emp.name || "?").charAt(0).toUpperCase()}</div>
          <div>
            <p class="profile-big-name">${emp.name || "—"}</p>
            <p class="profile-role-tag">${emp.role || "Staff"}</p>
          </div>
        </div>
        <div class="profile-info-grid">
          <div class="profile-info-item">
            <span class="profile-info-label">Email</span>
            <span class="profile-info-value">${emp.email || "—"}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Contact</span>
            <span class="profile-info-value">${emp.contact || "—"}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Shift</span>
            <span class="profile-info-value">${emp.shift || "—"}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Status</span>
            <span class="profile-info-value">${(emp.status || "active").toUpperCase()}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Date Joined</span>
            <span class="profile-info-value">${joined}</span>
          </div>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="admin-stats-grid" style="max-width:600px;">
        <div class="admin-stat-card" style="background:#fce7f0;border-color:#f9c0d2;">
          <p class="admin-stat-label">Pending Leave</p>
          <p class="admin-stat-num" style="color:#9d174d;">${pending}</p>
        </div>
        <div class="admin-stat-card" style="background:#d1fae5;border-color:#6ee7b7;">
          <p class="admin-stat-label">Approved Leave</p>
          <p class="admin-stat-num" style="color:#065f46;">${approved}</p>
        </div>
        <div class="admin-stat-card" style="background:#dbeafe;border-color:#93c5fd;">
          <p class="admin-stat-label">Upcoming Duties</p>
          <p class="admin-stat-num" style="color:#1e40af;">${upcoming}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>Overview</h2><p>Error loading overview.</p>`;
  }
}

/* ===============================
   2. LEAVE REQUESTS
================================ */
async function loadLeave() {
  content.innerHTML = `<h2>Leave Requests</h2><p>Loading...</p>`;
  try {
    const res    = await fetch("/api/employee/leave");
    const data   = await res.json();
    const leaves = data.leaves || [];

    const STATUS_STYLE = {
      pending:  { bg: "#fff3cd", color: "#856404" },
      approved: { bg: "#d4edda", color: "#155724" },
      rejected: { bg: "#f8d7da", color: "#721c24" },
    };

    content.innerHTML = `
      <h2>Leave Requests</h2>

      <!-- File leave form -->
      <div class="ops-section-card" style="max-width:520px; margin-bottom:24px;">
        <h3 class="ops-card-title" style="margin-bottom:16px;">File a Leave Request</h3>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <label class="admin-form-label">Leave Type *
            <select id="leaveType" class="admin-form-input">
              <option value="">Select type</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Vacation Leave">Vacation Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Other">Other</option>
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
          <label class="admin-form-label">Reason (optional)
            <textarea id="leaveReason" rows="2" class="admin-form-input" style="resize:vertical;" placeholder="Brief description..."></textarea>
          </label>
          <div class="admin-form-btns">
            <button class="btn" id="submitLeaveBtn">Submit Request</button>
          </div>
          <p id="leaveMsg" class="admin-form-msg"></p>
        </div>
      </div>

      <!-- Leave history -->
      <div class="ops-section-card">
        <h3 class="ops-card-title" style="margin-bottom:16px;">My Leave History</h3>
        ${leaves.length === 0
          ? `<p class="cal-empty" style="padding:28px 0;">No leave requests yet.</p>`
          : `<div class="leave-table-wrap">
              <table class="leave-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${leaves.map(l => {
                    const s    = STATUS_STYLE[l.status] || STATUS_STYLE.pending;
                    const from = new Date(l.fromDate);
                    const to   = new Date(l.toDate);
                    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
                    return `
                      <tr>
                        <td>${l.leaveType || "—"}</td>
                        <td>${from.toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })}</td>
                        <td>${to.toLocaleDateString("en-PH",   { month:"short", day:"numeric", year:"numeric" })}</td>
                        <td style="text-align:center;">${days}</td>
                        <td style="max-width:160px;word-break:break-word;">${l.reason || "—"}</td>
                        <td>
                          <span class="leave-status-badge" style="background:${s.bg};color:${s.color};">
                            ${(l.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          ${l.status === "pending"
                            ? `<button class="leave-del-btn cancel-leave-btn" data-id="${l._id}">Cancel</button>`
                            : ""}
                        </td>
                      </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>`}
      </div>
    `;

    /* Submit leave */
    document.getElementById("submitLeaveBtn").onclick = async () => {
      const msg       = document.getElementById("leaveMsg");
      const leaveType = document.getElementById("leaveType").value;
      const fromDate  = document.getElementById("leaveFrom").value;
      const toDate    = document.getElementById("leaveTo").value;
      const reason    = document.getElementById("leaveReason").value.trim();

      if (!leaveType || !fromDate || !toDate) {
        msg.textContent = "Leave type, from date, and to date are required.";
        msg.style.display = "block";
        return;
      }
      if (new Date(toDate) < new Date(fromDate)) {
        msg.textContent = "To date must be on or after the from date.";
        msg.style.display = "block";
        return;
      }

      try {
        const res    = await fetch("/api/employee/leave", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ leaveType, fromDate, toDate, reason }),
        });
        const result = await res.json();
        if (result.success) { alert(result.message); loadLeave(); }
        else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch (err) { msg.textContent = "Error submitting request."; msg.style.display = "block"; }
    };

    /* Cancel pending leave */
    document.querySelectorAll(".cancel-leave-btn").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Cancel this leave request?")) return;
        try {
          const res    = await fetch(`/api/employee/leave/${btn.dataset.id}`, { method: "DELETE" });
          const result = await res.json();
          if (result.success) { alert(result.message); loadLeave(); }
          else alert(result.message);
        } catch (err) { alert("Error cancelling request."); }
      };
    });

  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>Leave Requests</h2><p>Error loading leave requests.</p>`;
  }
}

/* ===============================
   3. DUTY SCHEDULE
================================ */
async function loadDuty() {
  content.innerHTML = `<h2>My Duty Schedule</h2><p>Loading...</p>`;
  try {
    const res   = await fetch("/api/employee/duty");
    const data  = await res.json();
    const duty  = data.duty || [];

    const today    = new Date(); today.setHours(0,0,0,0);
    const upcoming = duty.filter(d => new Date(d.date) >= today);
    const past     = duty.filter(d => new Date(d.date) < today);

    const renderGroup = (entries, label) => {
      if (!entries.length) return "";
      return `
        <div class="duty-date-group" style="margin-top:20px;">
          <p class="duty-date-label">${label}</p>
          ${entries.map(d => `
            <div class="ops-duty-card">
              <div class="ops-duty-avatar">📅</div>
              <div style="flex:1;">
                <p class="ops-duty-name">${new Date(d.date).toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
                ${d.notes ? `<p class="ops-duty-meta">${d.notes}</p>` : ""}
              </div>
            </div>`).join("")}
        </div>`;
    };

    content.innerHTML = `
      <h2>My Duty Schedule</h2>
      <div class="ops-section-card">
        ${!duty.length
          ? `<p class="cal-empty" style="padding:28px 0;">No duty assignments found.</p>`
          : renderGroup(upcoming, "Upcoming") + renderGroup(past, "Past Assignments")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>My Duty Schedule</h2><p>Error loading duty schedule.</p>`;
  }
}