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

    if (section === "profile") {
      loadProfile();
    }

    if (section === "bookings") {
      loadBookingsSection();
    }

    if (section === "messages") {
      loadMessagesSection();
    }
  });
});

// Load profile on page load and start polling for unread messages
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  pollUnreadMessages();
  setInterval(pollUnreadMessages, 30000); // Check every 30 seconds
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
        badge.style.display = "inline-block";
      }
    } else {
      const badge = document.querySelector(".notification-badge");
      if (badge) {
        badge.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Error polling unread messages:", err);
  }
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

      if (!data.success) {
        messagesContent.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

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
            </div>
          `;
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

            if (result.success) {
              loadMessages(status);
              pollUnreadMessages();
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error marking message as read");
          }
        };
      });

      document.querySelectorAll(".deleteMessageBtn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Delete this message?")) return;

          try {
            const res = await fetch(`/api/contact/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadMessages(status);
              pollUnreadMessages();
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error deleting message");
          }
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
   BOOKINGS SECTION
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>Manage Bookings</h2>
    <div class="booking-tabs">
      <button class="tab-btn active" data-type="grooming">Grooming</button>
      <button class="tab-btn" data-type="hotel">Pet Hotel</button>
    </div>
    <div id="bookingsContent"><p>Loading bookings...</p></div>
  `;

  const bookingsContent = document.getElementById("bookingsContent");

  const loadBookings = async (type) => {
    bookingsContent.innerHTML = "<p>Loading...</p>";

    try {
      const res = await fetch(`/api/admin/bookings?type=${type}`);
      const data = await res.json();

      if (!data.success) {
        bookingsContent.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

      let html = `
        <h3>${type === "grooming" ? "Grooming Bookings" : "Pet Hotel Bookings"}</h3>
        
        <div class="status-tabs">
          <button class="status-tab-btn active" data-status="pending">Pending</button>
          <button class="status-tab-btn" data-status="approved">Approved</button>
          <button class="status-tab-btn" data-status="rejected">Rejected</button>
        </div>

        <div id="statusBookingsContent"></div>
      `;

      bookingsContent.innerHTML = html;

      document.querySelectorAll(".status-tab-btn").forEach((btn) => {
        btn.onclick = () => {
          document.querySelectorAll(".status-tab-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          loadBookingsByStatus(type, btn.dataset.status);
        };
      });

      loadBookingsByStatus(type, "pending");
    } catch (err) {
      console.error(err);
      bookingsContent.innerHTML = "<p>Error loading bookings.</p>";
    }
  };

  const loadBookingsByStatus = async (type, status) => {
    const statusContent = document.getElementById("statusBookingsContent");
    statusContent.innerHTML = "<p>Loading...</p>";

    try {
      const res = await fetch(`/api/admin/bookings?type=${type}&status=${status}`);
      const data = await res.json();

      if (!data.success) {
        statusContent.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

      let html = "";

      if (data.bookings && data.bookings.length > 0) {
        html += `<div class="bookings-grid">`;
        data.bookings.forEach((b) => {
          // Build pets info with anti-rabies dates
          let petsInfo = b.pets
            .map((p) => {
              const rabiesDate = p.lastAntiRabiesShot ? new Date(p.lastAntiRabiesShot).toLocaleDateString() : "Not set";
              return `<div style="margin: 6px 0;">${p.name} <span style="color: #666; font-size: 0.85rem;">(Anti-Rabies: ${rabiesDate})</span></div>`;
            })
            .join("");

          html += `
            <div class="booking-card">
              <div class="booking-card-header">
                <p><strong>Customer:</strong> ${b.userName}</p>
                <p><strong>Email:</strong> ${b.userEmail}</p>
                <p><strong>Contact:</strong> ${b.userContact}</p>
              </div>
              
              <div class="booking-card-divider"></div>
              
              <div class="booking-card-pets">
                <p><strong>Pets:</strong></p>
                <div class="pets-list">${petsInfo}</div>
              </div>
              
              ${
                type === "grooming" && b.services
                  ? `
                <div class="booking-card-services">
                  <p><strong>Services:</strong> ${Array.isArray(b.services) ? b.services.join(", ") : b.services}</p>
                </div>
              `
                  : ""
              }
              
              <div class="booking-card-datetime">
                <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${b.appointmentTime || "N/A"}</p>
                ${type === "hotel" ? `<p><strong>Checkout:</strong> ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString() : "N/A"} ${b.hotelCheckoutTime || ""}</p>` : ""}
              </div>
              
              <p style="text-align: center; margin: 12px 0;"><strong>Status:</strong> <span class="booking-status ${b.status}">${b.status.toUpperCase()}</span></p>
              
              <div class="booking-actions">
                ${status === "pending" ? `<button class="approve-btn" data-id="${b._id}">Approve</button>` : ""}
                ${status === "pending" ? `<button class="reject-btn" data-id="${b._id}">Reject</button>` : ""}
              </div>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p>No ${status} bookings found.</p>`;
      }

      statusContent.innerHTML = html;

      document.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Approve this booking?")) return;

          try {
            const res = await fetch(`/api/admin/bookings/${btn.dataset.id}/approve`, { method: "PUT" });
            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadBookingsByStatus(type, status);
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error approving booking");
          }
        };
      });

      document.querySelectorAll(".reject-btn").forEach((btn) => {
        btn.onclick = async () => {
          const reason = prompt("Rejection reason (optional):");
          if (reason === null) return;

          try {
            const res = await fetch(`/api/admin/bookings/${btn.dataset.id}/reject`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            });

            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadBookingsByStatus(type, status);
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error rejecting booking");
          }
        };
      });
    } catch (err) {
      console.error(err);
      statusContent.innerHTML = "<p>Error loading bookings.</p>";
    }
  };

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadBookings(btn.dataset.type);
    };
  });

  loadBookings("grooming");
}
