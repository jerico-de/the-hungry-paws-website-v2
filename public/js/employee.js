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
    if (s === "overview")    loadOverview();
    if (s === "leave")       loadLeave();
    if (s === "duty")        loadDuty();
    if (s === "attendance")  loadAttendanceHistory();
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
    const [empRes, leaveRes, dutyRes, attendRes, groomRes] = await Promise.all([
      fetch("/api/employee/me").then(r => r.json()),
      fetch("/api/employee/leave").then(r => r.json()),
      fetch("/api/employee/duty").then(r => r.json()),
      fetch("/api/employee/attendance/today").then(r => r.json()),
      fetch("/api/employee/grooming-stats").then(r => r.json()).catch(() => ({ total: 0 })),
    ]);

    const emp    = empRes.employee  || {};
    const leaves = leaveRes.leaves  || [];
    const duties = dutyRes.duty     || [];
    const todayRecord = attendRes.record || null;

    const pending    = leaves.filter(l => l.status === "pending").length;
    const approved   = leaves.filter(l => l.status === "approved").length;
    const upcoming   = duties.filter(d => new Date(d.date) >= new Date()).length;
    const groomedTotal = groomRes.total || 0;
    const isGroomer    = true; // show for all — groomed count will just be 0 for non-groomers

    const joined = emp.createdAt
      ? new Date(emp.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" })
      : "—";

    const isClockedIn  = todayRecord && !todayRecord.timeOut;
    const isClockedOut = todayRecord && todayRecord.timeOut;
    const timeInStr    = todayRecord?.timeIn  ? new Date(todayRecord.timeIn).toLocaleTimeString("en-PH",  {hour:"2-digit", minute:"2-digit"}) : null;
    const timeOutStr   = todayRecord?.timeOut ? new Date(todayRecord.timeOut).toLocaleTimeString("en-PH", {hour:"2-digit", minute:"2-digit"}) : null;

    const attendanceCard = `
      <div class="ops-section-card" style="max-width:480px;margin-bottom:24px;">
        <h3 class="ops-card-title" style="margin-bottom:4px;">Today's Attendance</h3>
        <p style="font-size:0.82rem;color:#888;margin-bottom:16px;">${new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>

        ${isClockedOut ? `
          <div style="text-align:center;padding:12px 0;">
            <p style="font-size:1rem;font-weight:700;color:#065f46;margin-bottom:4px;">✅ Shift Complete</p>
            <p style="color:#555;font-size:0.9rem;">Time In: <strong>${timeInStr}</strong> &bull; Time Out: <strong>${timeOutStr}</strong></p>
            <p style="color:#555;font-size:0.9rem;">Hours Worked: <strong>${todayRecord.hoursWorked}h</strong>${todayRecord.overtimeHours > 0 ? ` &bull; OT: <strong>${todayRecord.overtimeHours}h</strong>` : ""}</p>
          </div>
        ` : isClockedIn ? `
          <div style="text-align:center;padding:8px 0 16px;">
            <p style="font-size:0.9rem;color:#555;">Clocked in at <strong>${timeInStr}</strong></p>
            <div id="elapsedTimer" style="font-size:1.6rem;font-weight:700;color:#d44d7c;margin:8px 0;"></div>
          </div>
          <button id="timeOutBtn" class="btn" style="width:100%;padding:14px;font-size:1rem;background:linear-gradient(135deg,#6c757d,#495057);">
            🔴 Time Out
          </button>
        ` : `
          <p style="color:#888;font-size:0.88rem;margin-bottom:16px;">You have not timed in yet today.</p>
          <button id="timeInBtn" class="btn" style="width:100%;padding:14px;font-size:1rem;background:linear-gradient(135deg,#d44d7c,#e8739b);">
            🟢 Time In
          </button>
        `}
        <p id="attendMsg" style="font-size:0.85rem;color:#d44d7c;margin-top:10px;display:none;"></p>
      </div>`;

    content.innerHTML = `
      <h2>My Profile</h2>

      ${attendanceCard}

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
      <div class="admin-stats-grid" style="max-width:700px;">
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
        ${isGroomer ? `
        <div class="admin-stat-card" style="background:#fef3c7;border-color:#fcd34d;">
          <p class="admin-stat-label">✂️ Dogs Groomed</p>
          <p class="admin-stat-num" style="color:#92400e;">${groomedTotal}</p>
          <span class="admin-stat-hint" style="font-size:0.72rem;color:#888;">confirmed completed</span>
        </div>` : ""}
      </div>
    `;

    /* Append recent grooming completions separately to avoid nested template literal issues */
    if (isGroomer && groomRes.recent?.length) {
      const recentCards = groomRes.recent.map(b => {
        const pets = Array.isArray(b.pets) ? b.pets.length : "?";
        const date = b.outcomeAt ? new Date(b.outcomeAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "—";
        return `
          <div class="ops-duty-card">
            <div class="ops-duty-avatar">✂️</div>
            <div>
              <p class="ops-duty-name">${b.userName || "Customer"}</p>
              <p class="ops-duty-meta">${pets} pet(s) &bull; ${date}</p>
            </div>
          </div>`;
      }).join("");
      content.innerHTML += `
        <div class="ops-section-card" style="max-width:520px;margin-top:20px;">
          <h3 class="ops-card-title" style="margin-bottom:12px;">Recent Grooming Completions</h3>
          ${recentCards}
        </div>`;
    }

    /* Elapsed timer while clocked in */
    if (isClockedIn && todayRecord?.timeIn) {
      const clockInTime = new Date(todayRecord.timeIn);
      const timerEl = document.getElementById("elapsedTimer");
      const tick = () => {
        if (!document.getElementById("elapsedTimer")) return; // navigated away
        const elapsed = Math.floor((Date.now() - clockInTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        timerEl.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
        setTimeout(tick, 1000);
      };
      tick();
    }

    /* Time In button */
    document.getElementById("timeInBtn")?.addEventListener("click", async () => {
      const msg = document.getElementById("attendMsg");
      try {
        const res    = await fetch("/api/employee/attendance/timein", { method: "POST" });
        const result = await res.json();
        if (result.success) { loadOverview(); }
        else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch { msg.textContent = "Error clocking in."; msg.style.display = "block"; }
    });

    /* Time Out button */
    document.getElementById("timeOutBtn")?.addEventListener("click", async () => {
      const msg = document.getElementById("attendMsg");
      if (!confirm("Are you sure you want to time out?")) return;
      try {
        const res    = await fetch("/api/employee/attendance/timeout", { method: "POST" });
        const result = await res.json();
        if (result.success) { loadOverview(); }
        else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch { msg.textContent = "Error clocking out."; msg.style.display = "block"; }
    });

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

/* ===============================
   4. ATTENDANCE HISTORY
================================ */
async function loadAttendanceHistory() {
  content.innerHTML = `<h2>Attendance History</h2><p>Loading...</p>`;

  // Default: current month
  const now   = new Date();
  const defFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const defTo   = now.toISOString().split("T")[0];

  content.innerHTML = `
    <h2>Attendance History</h2>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:6px;font-size:0.88rem;">
        From: <input type="date" id="attHistFrom" class="admin-form-input" style="width:auto;" value="${defFrom}" />
      </label>
      <label class="admin-form-label" style="margin:0;flex-direction:row;align-items:center;gap:6px;font-size:0.88rem;">
        To: <input type="date" id="attHistTo" class="admin-form-input" style="width:auto;" value="${defTo}" />
      </label>
      <button class="btn" id="attHistLoadBtn" style="padding:8px 16px;">View</button>
    </div>

    <div id="attHistResults"><p style="color:#aaa;">Select a date range and click View.</p></div>
  `;

  document.getElementById("attHistLoadBtn").onclick = fetchAttendanceHistory;
  fetchAttendanceHistory(); // auto-load current month

  async function fetchAttendanceHistory() {
    const from = document.getElementById("attHistFrom").value;
    const to   = document.getElementById("attHistTo").value;
    const wrap = document.getElementById("attHistResults");
    if (!from || !to) return;
    wrap.innerHTML = "<p>Loading...</p>";

    try {
      const res  = await fetch(`/api/employee/attendance?from=${from}&to=${to}`);
      const data = await res.json();
      const records = data.records || [];

      if (!records.length) {
        wrap.innerHTML = `<p class="cal-empty" style="padding:28px 0;">No attendance records for this period.</p>`;
        return;
      }

      // Summary stats
      const totalDays  = records.length;
      const totalHours = records.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      const totalOT    = records.reduce((s, r) => s + (r.overtimeHours || 0), 0);
      const incomplete = records.filter(r => !r.timeOut).length;

      wrap.innerHTML = `
        <!-- Summary cards -->
        <div class="admin-stats-grid" style="max-width:600px;margin-bottom:20px;">
          <div class="admin-stat-card" style="background:#dbeafe;border-color:#93c5fd;">
            <p class="admin-stat-label">Days Present</p>
            <p class="admin-stat-num" style="color:#1e40af;">${totalDays}</p>
          </div>
          <div class="admin-stat-card" style="background:#d1fae5;border-color:#6ee7b7;">
            <p class="admin-stat-label">Total Hours</p>
            <p class="admin-stat-num" style="color:#065f46;">${parseFloat(totalHours.toFixed(1))}<span style="font-size:1rem;">h</span></p>
          </div>
          <div class="admin-stat-card" style="background:#fef3c7;border-color:#fcd34d;">
            <p class="admin-stat-label">Overtime Hours</p>
            <p class="admin-stat-num" style="color:#92400e;">${parseFloat(totalOT.toFixed(1))}<span style="font-size:1rem;">h</span></p>
          </div>
          ${incomplete ? `<div class="admin-stat-card" style="background:#fee2e2;border-color:#fca5a5;">
            <p class="admin-stat-label">Incomplete</p>
            <p class="admin-stat-num" style="color:#991b1b;">${incomplete}</p>
          </div>` : ""}
        </div>

        <!-- Records table -->
        <div class="ops-section-card">
          <div class="leave-table-wrap">
            <table class="leave-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Hours Worked</th>
                  <th>Overtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(r => {
                  const date   = new Date(r.date).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
                  const tIn    = r.timeIn  ? new Date(r.timeIn).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                  const tOut   = r.timeOut ? new Date(r.timeOut).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "—";
                  const hrs    = r.hoursWorked  != null ? r.hoursWorked  + "h" : "—";
                  const ot     = r.overtimeHours > 0    ? r.overtimeHours + "h" : "—";
                  const status = !r.timeOut ? "Incomplete" : r.hoursWorked >= 8 ? "Full" : "Partial";
                  const statusBg = !r.timeOut ? "#fee2e2" : r.hoursWorked >= 8 ? "#d1fae5" : "#fff3cd";
                  const statusColor = !r.timeOut ? "#991b1b" : r.hoursWorked >= 8 ? "#065f46" : "#856404";
                  const noteRow = r.adminNote
                    ? `<tr><td colspan="6" style="font-size:0.78rem;color:#888;padding:2px 12px 8px;font-style:italic;">📝 ${r.adminNote}</td></tr>`
                    : "";
                  return `
                    <tr>
                      <td>${date}</td>
                      <td>${tIn}</td>
                      <td style="${!r.timeOut?"color:#d44d7c;font-weight:600;":""}">${tOut}</td>
                      <td style="text-align:center;">${hrs}</td>
                      <td style="text-align:center;${r.overtimeHours>0?"color:#92400e;font-weight:600;":""}">${ot}</td>
                      <td>
                        <span class="leave-status-badge" style="background:${statusBg};color:${statusColor};">${status}</span>
                      </td>
                    </tr>${noteRow}`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      console.error(err);
      document.getElementById("attHistResults").innerHTML = "<p>Error loading attendance history.</p>";
    }
  }
}