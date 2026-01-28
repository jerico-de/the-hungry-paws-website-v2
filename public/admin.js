const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content = document.getElementById("dashboardContent");

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
  });
});

/* ===============================
   PROFILE SECTION
================================ */
function loadProfile() {
  content.innerHTML = `
    <h2>Profile</h2>
    <p><strong>Email:</strong> ${content.dataset.email}</p>
    <p>More profile info will go here.</p>
  `;
}

/* ===============================
   BOOKINGS SECTION
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>Bookings</h2>
    <div class="booking-tabs">
      <button class="tab-btn active" data-type="grooming">Grooming</button>
      <button class="tab-btn" data-type="hotel">Pet Hotel</button>
    </div>
    <div class="status-tabs" style="margin-top: 15px;">
      <button class="status-tab-btn active" data-status="pending">Pending</button>
      <button class="status-tab-btn" data-status="approved">Approved</button>
      <button class="status-tab-btn" data-status="rejected">Rejected</button>
    </div>
    <div id="bookingsContent"><p>Loading bookings...</p></div>
  `;

  const bookingsContent = document.getElementById("bookingsContent");
  let currentType = "grooming";
  let currentStatus = "pending";

  const loadBookings = async (type, status) => {
    bookingsContent.innerHTML = "<p>Loading...</p>";
    currentType = type;
    currentStatus = status;

    try {
      const res = await fetch(`/api/admin/bookings?type=${type}&status=${status}`);
      const data = await res.json();

      if (!data.success) {
        bookingsContent.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

      if (!data.bookings || data.bookings.length === 0) {
        bookingsContent.innerHTML = `<p>No ${status} bookings found.</p>`;
        return;
      }

      let html = '<div class="bookings-grid">';

      data.bookings.forEach((b) => {
        const petNames = b.pets.map((p) => p.name).join(", ");

        let dateInfo = "";
        if (type === "grooming") {
          dateInfo = `
            <p><strong>Appointment:</strong> ${new Date(b.appointmentDate).toLocaleDateString()} at ${b.appointmentTime}</p>
            <p><strong>Last Anti-Rabies:</strong> ${new Date(b.antiRabiesDate).toLocaleDateString()}</p>
          `;
        } else {
          dateInfo = `
            <p><strong>Check-in:</strong> ${new Date(b.appointmentDate).toLocaleDateString()} at ${b.appointmentTime}</p>
            <p><strong>Checkout:</strong> ${new Date(b.hotelCheckoutDate).toLocaleDateString()} at ${b.hotelCheckoutTime}</p>
          `;
        }

        html += `
          <div class="booking-card">
            <p><strong>Customer:</strong> ${b.userName}</p>
            <p><strong>Email:</strong> ${b.userEmail}</p>
            <p><strong>Pets:</strong> ${petNames}</p>
            ${dateInfo}
            <p><strong>Status:</strong> <span class="booking-status ${b.status}">${b.status.toUpperCase()}</span></p>
        `;

        // Show action buttons based on status
        if (status === "pending") {
          html += `
            <div class="booking-actions">
              <button class="approve-btn" data-id="${b._id}">Approve</button>
              <button class="reject-btn" data-id="${b._id}">Reject</button>
            </div>
          `;
        } else if (status === "approved") {
          html += `
            <div class="booking-actions">
              <button class="reject-btn" data-id="${b._id}">Reject</button>
            </div>
          `;
        } else if (status === "rejected") {
          html += `
            <div class="booking-actions">
              <button class="approve-btn" data-id="${b._id}">Approve</button>
            </div>
          `;
        }

        html += `</div>`;
      });

      html += "</div>";
      bookingsContent.innerHTML = html;

      // Bind approve buttons
      document.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Approve this booking?")) return;

          try {
            const res = await fetch(`/api/admin/bookings/${btn.dataset.id}/approve`, {
              method: "POST",
            });
            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadBookings(currentType, currentStatus);
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error approving booking");
          }
        };
      });

      // Bind reject buttons
      document.querySelectorAll(".reject-btn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Reject this booking?")) return;

          try {
            const res = await fetch(`/api/admin/bookings/${btn.dataset.id}/reject`, {
              method: "POST",
            });
            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadBookings(currentType, currentStatus);
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
      bookingsContent.innerHTML = "<p>Error loading bookings.</p>";
    }
  };

  // Type tab switching (Grooming/Hotel)
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadBookings(btn.dataset.type, currentStatus);
    };
  });

  // Status tab switching (Pending/Approved/Rejected)
  document.querySelectorAll(".status-tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".status-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadBookings(currentType, btn.dataset.status);
    };
  });

  // Load initial bookings
  loadBookings("grooming", "pending");
}
