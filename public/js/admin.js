const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content = document.getElementById("dashboardContent");

/* ===============================
   Dashboard Mobile Menu Toggle
================================ */
const dashboardMenuToggle = document.getElementById("dashboardMenuToggle");
const dashboardSidebar = document.getElementById("dashboardSidebar");
const dashboardOverlay = document.getElementById("dashboardOverlay");

if (dashboardMenuToggle && dashboardSidebar && dashboardOverlay) {
  dashboardMenuToggle.addEventListener("click", () => {
    dashboardMenuToggle.classList.toggle("active");
    dashboardSidebar.classList.toggle("active");
    dashboardOverlay.classList.toggle("active");
    document.body.style.overflow = dashboardSidebar.classList.contains("active") ? "hidden" : "";
  });

  dashboardOverlay.addEventListener("click", () => {
    dashboardMenuToggle.classList.remove("active");
    dashboardSidebar.classList.remove("active");
    dashboardOverlay.classList.remove("active");
    document.body.style.overflow = "";
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        dashboardMenuToggle.classList.remove("active");
        dashboardSidebar.classList.remove("active");
        dashboardOverlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });
}

/* ===============================
   Sidebar Navigation
================================ */
sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sidebarLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    const section = link.dataset.section;
    if (section === "profile") loadProfile();
    if (section === "bookings") loadBookingsSection();
    if (section === "messages") loadMessagesSection();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  pollUnreadMessages();
  setInterval(pollUnreadMessages, 30000);
});

/* ===============================
   PROFILE SECTION
================================ */
function loadProfile() {
  content.innerHTML = `
    <h2>Admin Profile</h2>
    <div class="profile-section">
      <h3>Account Information</h3>
      <p><strong>Email:</strong> ${content.dataset.email}</p>
      <p><strong>Role:</strong> Administrator</p>
    </div>
  `;
}

/* ===============================
   POLL UNREAD MESSAGES
================================ */
async function pollUnreadMessages() {
  try {
    const res = await fetch("/api/contact/unread-count");
    const data = await res.json();
    if (data.success && data.count > 0) {
      const messagesLink = document.querySelector('[data-section="messages"]');
      if (messagesLink) {
        let badge = messagesLink.querySelector(".notification-badge");
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "notification-badge";
          messagesLink.appendChild(badge);
        }
        badge.textContent = data.count;
        badge.style.display = "inline-flex";
      }
    } else {
      const badge = document.querySelector(".notification-badge");
      if (badge) badge.style.display = "none";
    }
  } catch (err) {
    console.error("Error polling unread messages:", err);
  }
}

/* ===============================
   REJECT REASON MODAL
================================ */
function showRejectModal(bookingId, onConfirm) {
  const PRESET_REASONS = [
    "Time slot already booked",
    "Pet requirements not met",
    "Incomplete booking information",
    "Outside service hours",
    "Other",
  ];

  const modal = document.createElement("div");
  modal.className = "reject-modal-overlay";
  modal.innerHTML = `
    <div class="reject-modal">
      <h3>Reject Booking</h3>
      <p class="reject-modal-sub">Select a reason or type a custom one:</p>

      <div class="reject-presets">
        ${PRESET_REASONS.map((r) => `
          <button type="button" class="reject-preset-btn" data-reason="${r}">${r}</button>
        `).join("")}
      </div>

      <textarea
        id="rejectReasonText"
        class="reject-textarea"
        placeholder="Or type a custom reason here..."
        rows="3"
      ></textarea>

      <div class="reject-modal-actions">
        <button type="button" class="reject-modal-confirm" id="rejectConfirmBtn">Confirm Rejection</button>
        <button type="button" class="reject-modal-cancel" id="rejectCancelBtn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const textarea = modal.querySelector("#rejectReasonText");

  modal.querySelectorAll(".reject-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".reject-preset-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      textarea.value = btn.dataset.reason !== "Other" ? btn.dataset.reason : "";
      if (btn.dataset.reason === "Other") textarea.focus();
    });
  });

  modal.querySelector("#rejectConfirmBtn").onclick = () => {
    const reason = textarea.value.trim() || "Rejected by admin";
    modal.remove();
    onConfirm(reason);
  };

  modal.querySelector("#rejectCancelBtn").onclick = () => modal.remove();

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

/* ===============================
   MESSAGES SECTION
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
      const res = await fetch(`/api/contact?status=${status}`);
      const data = await res.json();
      if (!data.success) { messagesContent.innerHTML = `<p>Error: ${data.message}</p>`; return; }

      let html = `<h3>Customer Messages</h3>`;
      if (data.contacts && data.contacts.length > 0) {
        html += `<div class="bookings-grid">`;
        data.contacts.forEach((c) => {
          const statusClass = c.status === "unread" ? "status-unread" : "status-read";
          html += `
            <div class="booking-card ${statusClass}">
              <div class="booking-card-header">
                <p><strong>Name:</strong> ${c.name}</p>
                <p><strong>Email:</strong> ${c.email}</p>
              </div>
              <div class="booking-card-divider"></div>
              <div style="padding: 15px;">
                <p><strong>Message:</strong></p>
                <p style="font-style: italic; background-color: #f9f9f9; padding: 10px; border-radius: 5px; margin: 8px 0;">${c.message}</p>
                <p style="font-size: 0.85rem; color: #666;"><strong>Received:</strong> ${new Date(c.createdAt).toLocaleString()}</p>
              </div>
              <p style="text-align: center;"><strong>Status:</strong> <span class="booking-status ${c.status}">${c.status.toUpperCase()}</span></p>
              <div class="booking-actions">
                ${c.status === "unread" ? `<button class="markReadBtn" data-id="${c._id}">Mark as Read</button>` : ""}
                <button class="deleteMessageBtn" data-id="${c._id}">Delete</button>
              </div>
            </div>`;
        });
        html += `</div>`;
      } else {
        html += `<p>No messages found.</p>`;
      }
      messagesContent.innerHTML = html;

      document.querySelectorAll(".markReadBtn").forEach((btn) => {
        btn.onclick = async () => {
          try {
            const res = await fetch(`/api/contact/${btn.dataset.id}/read`, { method: "PUT" });
            const result = await res.json();
            if (result.success) { loadMessages(status); pollUnreadMessages(); }
            else alert(result.message);
          } catch (err) { console.error(err); alert("Error marking message as read"); }
        };
      });

      document.querySelectorAll(".deleteMessageBtn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Delete this message?")) return;
          try {
            const res = await fetch(`/api/contact/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) { alert(result.message); loadMessages(status); pollUnreadMessages(); }
            else alert(result.message);
          } catch (err) { console.error(err); alert("Error deleting message"); }
        };
      });
    } catch (err) {
      console.error(err);
      messagesContent.innerHTML = "<p>Error loading messages.</p>";
    }
  };

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadMessages(btn.dataset.status);
    };
  });

  loadMessages("all");
}

/* ===============================
   BOOKINGS SECTION — CALENDAR VIEW
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>Manage Bookings</h2>
    <div class="cal-layout">

      <!-- LEFT: Calendar -->
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

      <!-- RIGHT: Side Panel (desktop only) -->
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

    <!-- Mobile slide-up drawer -->
    <div class="cal-drawer-overlay" id="calDrawerOverlay"></div>
    <div class="cal-drawer" id="calDrawer">
      <div class="cal-drawer-handle"></div>
      <div class="cal-drawer-head">
        <h3 id="calDrawerTitle">Bookings</h3>
        <button class="cal-drawer-close" id="calDrawerClose">&#x2715;</button>
      </div>
      <p class="cal-side-date" id="calDrawerDate" style="padding: 8px 16px; font-size: 12px; color: #999;"></p>
      <div class="cal-side-list" id="calDrawerList" style="max-height: 60vh; overflow-y: auto;"></div>
    </div>
  `;

  /* ---------- state ---------- */
  const today = new Date();
  let yr = today.getFullYear();
  let mo = today.getMonth();
  let selDate = null;
  let activeType = "all";
  let allBookings = [];

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const dk = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  /* ---------- fetch ---------- */
  async function fetchAll() {
    const types = activeType === "all" ? ["grooming", "hotel"] : [activeType];
    const statuses = ["pending", "approved", "rejected"];
    const results = [];

    for (const type of types) {
      for (const status of statuses) {
        try {
          const res = await fetch(`/api/admin/bookings?type=${type}&status=${status}`);
          const data = await res.json();
          if (data.success && data.bookings) {
            data.bookings.forEach((b) => results.push({ ...b, type, status }));
          }
        } catch (err) {
          console.error(`Fetch error ${type}/${status}`, err);
        }
      }
    }

    allBookings = results;
    renderCal();
    updateBadge();
    if (selDate) {
      if (window.innerWidth <= 768) {
        openDrawer(selDate);
      } else {
        populateSidePanel(selDate);
      }
    }
  }

  function getFor(date) {
    return allBookings.filter((b) => dk(new Date(b.appointmentDate)) === dk(date));
  }

  /* ---------- calendar ---------- */
  function renderCal() {
    document.getElementById("calMonthLabel").textContent = `${MONTHS[mo]} ${yr}`;
    const container = document.getElementById("calCells");
    container.innerHTML = "";

    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const prevDays = new Date(yr, mo, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      container.appendChild(makeCell(new Date(yr, mo - 1, prevDays - firstDay + i + 1), true));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      container.appendChild(makeCell(new Date(yr, mo, d), false));
    }
    const total = firstDay + daysInMonth;
    const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= rem; i++) {
      container.appendChild(makeCell(new Date(yr, mo + 1, i), true));
    }
  }

  function makeCell(date, other) {
    const cell = document.createElement("div");
    cell.className = "cal-cell" + (other ? " cal-other" : "");
    if (dk(date) === dk(today)) cell.classList.add("cal-today");
    if (selDate && dk(date) === dk(selDate)) cell.classList.add("cal-selected");

    const num = document.createElement("span");
    num.className = "cal-cell-num";
    num.textContent = date.getDate();
    cell.appendChild(num);

    const dayBookings = getFor(date);
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      /* Mobile: compact colour dots with count */
      const counts = { pending: 0, approved: 0, rejected: 0 };
      dayBookings.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++; });

      const dotRow = document.createElement("div");
      dotRow.className = "cal-dot-row";
      if (counts.pending)  dotRow.innerHTML += `<span class="cal-mini-dot cal-mini-pending">${counts.pending}</span>`;
      if (counts.approved) dotRow.innerHTML += `<span class="cal-mini-dot cal-mini-approved">${counts.approved}</span>`;
      if (counts.rejected) dotRow.innerHTML += `<span class="cal-mini-dot cal-mini-rejected">${counts.rejected}</span>`;
      if (dotRow.innerHTML) cell.appendChild(dotRow);
    } else {
      /* Desktop: name labels */
      dayBookings.slice(0, 3).forEach((b) => {
        const dot = document.createElement("div");
        dot.className = `cal-dot cal-dot-${b.type}-${b.status}`;
        const firstName = (b.userName || "?").split(" ")[0];
        dot.textContent = (b.type === "hotel" ? "H " : "G ") + firstName;
        cell.appendChild(dot);
      });
      if (dayBookings.length > 3) {
        const more = document.createElement("div");
        more.className = "cal-more";
        more.textContent = `+${dayBookings.length - 3} more`;
        cell.appendChild(more);
      }
    }

    if (!other) {
      cell.addEventListener("click", () => {
        selDate = date;
        renderCal();
        if (window.innerWidth <= 768) {
          openDrawer(date);
        } else {
          populateSidePanel(date);
        }
      });
    }

    return cell;
  }

  /* ---------- shared card builder ---------- */
  function buildCard(b, isPending, listEl) {
    const item = document.createElement("div");
    item.className = "cal-booking-item";

    const petsHtml = b.pets
      .map((p) => `
        <span class="cal-pet-chip">
          <img src="/images/default-pet.png"
               data-s3key="${p.photo || ""}"
               alt="${p.name}"
               class="cal-pet-av pet-photo" />
          ${p.name}
        </span>`)
      .join("");

    const detailHtml = b.type === "hotel"
      ? `Check-in: ${b.appointmentTime || "N/A"} &bull; Check-out: ${
          b.hotelCheckoutDate
            ? new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
            : "N/A"
        }`
      : `Time: ${b.appointmentTime || "N/A"} &bull; ${Array.isArray(b.services) ? b.services.join(", ") : (b.services || "")}`;

    const statusBadge = isPending ? "" :
      `<span class="cal-status-badge cal-status-${b.status}">${b.status.toUpperCase()}</span>`;

    const actions = isPending
      ? `<div class="cal-bi-actions">
           <button class="cal-btn-approve" data-id="${b._id}">Approve</button>
           <button class="cal-btn-reject"  data-id="${b._id}">Reject</button>
         </div>`
      : `<div class="cal-bi-actions">
           <button class="cal-btn-edit" data-id="${b._id}">Move to Pending</button>
         </div>`;

    item.innerHTML = `
      <div class="cal-bi-top">
        <div>
          <p class="cal-bi-name">${b.userName || "Unknown"}</p>
          <p class="cal-bi-email">${b.userEmail || ""}</p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span class="cal-type-pill ${b.type === "hotel" ? "cal-pill-hotel" : "cal-pill-grooming"}">${b.type}</span>
          ${statusBadge}
        </div>
      </div>
      <div class="cal-bi-pets">${petsHtml}</div>
      <p class="cal-bi-detail">${detailHtml}</p>
      <p class="cal-bi-contact">${b.userContact || ""}</p>
      ${actions}
    `;

    listEl.appendChild(item);

    /* load pet photos */
    item.querySelectorAll(".pet-photo[data-s3key]").forEach(async (img) => {
      const key = img.dataset.s3key;
      if (!key) return;
      try {
        const r = await fetch(`/api/file?name=${encodeURIComponent(key)}`);
        const d = await r.json();
        if (d.success) img.src = d.url;
      } catch (_) {}
    });

    /* approve */
    const approveBtn = item.querySelector(".cal-btn-approve");
    if (approveBtn) {
      approveBtn.onclick = async () => {
        if (!confirm("Approve this booking?")) return;
        try {
          const res = await fetch(`/api/admin/bookings/${approveBtn.dataset.id}/approve`, { method: "PUT" });
          const result = await res.json();
          if (result.success) { closeDrawer(); alert(result.message); await fetchAll(); }
          else alert(result.message);
        } catch (err) { console.error(err); alert("Error approving booking"); }
      };
    }

    /* reject — reason modal */
    const rejectBtn = item.querySelector(".cal-btn-reject");
    if (rejectBtn) {
      rejectBtn.onclick = () => {
        showRejectModal(rejectBtn.dataset.id, async (reason) => {
          try {
            const res = await fetch(`/api/admin/bookings/${rejectBtn.dataset.id}/reject`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            });
            const result = await res.json();
            if (result.success) { closeDrawer(); alert(result.message); await fetchAll(); }
            else alert(result.message);
          } catch (err) { console.error(err); alert("Error rejecting booking"); }
        });
      };
    }

    /* move to pending */
    const editBtn = item.querySelector(".cal-btn-edit");
    if (editBtn) {
      editBtn.onclick = async () => {
        if (!confirm("Move this booking back to pending?")) return;
        try {
          const res = await fetch(`/api/admin/bookings/${editBtn.dataset.id}/pending`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          });
          const result = await res.json();
          if (result.success) { closeDrawer(); alert(result.message); await fetchAll(); }
          else alert(result.message);
        } catch (err) { console.error(err); alert("Error updating booking"); }
      };
    }
  }

  /* ---------- desktop side panel ---------- */
  function populateSidePanel(date) {
    const sideDate  = document.getElementById("calSideDate");
    const sideList  = document.getElementById("calSideList");
    const sideTitle = document.getElementById("calSideTitle");

    sideDate.textContent = date.toLocaleDateString("en-PH", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    const allDay  = getFor(date);
    const pending = allDay.filter((b) => b.status === "pending");
    const settled = allDay.filter((b) => b.status === "approved" || b.status === "rejected");
    sideTitle.textContent = `Pending (${pending.length})`;
    sideList.innerHTML = "";

    if (!pending.length) {
      const empty = document.createElement("p");
      empty.className = "cal-empty";
      empty.textContent = "No pending bookings for this date.";
      sideList.appendChild(empty);
    } else {
      pending.forEach((b) => buildCard(b, true, sideList));
    }

    if (settled.length) {
      const divider = document.createElement("div");
      divider.className = "cal-section-divider";
      divider.innerHTML = `<span>Approved &amp; Rejected</span>`;
      sideList.appendChild(divider);
      settled.forEach((b) => buildCard(b, false, sideList));
    }
  }

  /* ---------- mobile drawer ---------- */
  function openDrawer(date) {
    const overlay     = document.getElementById("calDrawerOverlay");
    const drawer      = document.getElementById("calDrawer");
    const drawerTitle = document.getElementById("calDrawerTitle");
    const drawerDate  = document.getElementById("calDrawerDate");
    const drawerList  = document.getElementById("calDrawerList");

    const allDay  = getFor(date);
    const pending = allDay.filter((b) => b.status === "pending");
    const settled = allDay.filter((b) => b.status === "approved" || b.status === "rejected");

    drawerTitle.textContent = `Bookings (${allDay.length})`;
    drawerDate.textContent  = date.toLocaleDateString("en-PH", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    drawerList.innerHTML = "";

    if (!allDay.length) {
      drawerList.innerHTML = `<p class="cal-empty">No bookings for this date.</p>`;
    } else {
      if (pending.length) {
        const label = document.createElement("p");
        label.className = "cal-drawer-section-label";
        label.textContent = `Pending (${pending.length})`;
        drawerList.appendChild(label);
        pending.forEach((b) => buildCard(b, true, drawerList));
      }
      if (settled.length) {
        const divider = document.createElement("div");
        divider.className = "cal-section-divider";
        divider.innerHTML = `<span>Approved &amp; Rejected</span>`;
        drawerList.appendChild(divider);
        settled.forEach((b) => buildCard(b, false, drawerList));
      }
    }

    overlay.classList.add("active");
    drawer.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    const overlay = document.getElementById("calDrawerOverlay");
    const drawer  = document.getElementById("calDrawer");
    if (overlay) overlay.classList.remove("active");
    if (drawer)  drawer.classList.remove("active");
    document.body.style.overflow = "";
  }

  document.getElementById("calDrawerClose").onclick  = closeDrawer;
  document.getElementById("calDrawerOverlay").onclick = closeDrawer;

  /* ---------- badge ---------- */
  function updateBadge() {
    const count = allBookings.filter((b) => b.status === "pending").length;
    document.getElementById("calBadge").textContent = count;
  }

  /* ---------- nav & type tabs ---------- */
  document.getElementById("calPrev").onclick = () => {
    mo--; if (mo < 0) { mo = 11; yr--; } renderCal();
  };
  document.getElementById("calNext").onclick = () => {
    mo++; if (mo > 11) { mo = 0; yr++; } renderCal();
  };

  document.querySelectorAll(".cal-type-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".cal-type-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeType = btn.dataset.type;
      fetchAll();
    };
  });

  window.addEventListener("resize", () => renderCal());

  fetchAll();
}