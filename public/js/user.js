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
    if (section === "pets") loadPets();
    if (section === "bookings") loadBookingsSection();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});

/* ===============================
   PROFILE SECTION
================================ */
async function loadProfile() {
  content.innerHTML = `<h2>Profile</h2><p>Loading...</p>`;

  try {
    const res = await fetch("/api/user/profile");
    const data = await res.json();

    if (!data.success) {
      content.innerHTML = `<h2>Profile</h2><p>Error: ${data.message}</p>`;
      return;
    }

    const user = data.user;

    content.innerHTML = `
      <h2>My Profile</h2>
      
      <div class="profile-section">
        <h3>Personal Information</h3>
        <p><strong>Full Name:</strong> ${user.fullName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Contact:</strong> ${user.contact}</p>
        <p><strong>Address:</strong> ${user.address || "Not set"}</p>
        <p><strong>Member Since:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
        
        <button id="editProfileBtn" class="user-link">Edit Profile</button>
      </div>

      <div class="profile-section" style="margin-top: 30px;">
        <h3>Security</h3>
        <button id="changePasswordBtn" class="user-link">Change Password</button>
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>Profile</h2><p>Error loading profile.</p>`;
  }
}

/* ===============================
   PROFILE ACTIONS (DELEGATED)
================================ */
content.onclick = async (e) => {
  if (e.target.id === "editProfileBtn") {
    showEditProfileForm();
    return;
  }

  if (e.target.id === "changePasswordBtn") {
    showChangePasswordForm();
    return;
  }

  if (e.target.id === "addPetBtn") {
    showAddPetForm();
    return;
  }

  if (e.target.classList.contains("deletePetBtn")) {
    const card = e.target.closest(".pet-card");
    const petId = card.dataset.id;

    if (!confirm("Delete this pet?")) return;

    try {
      const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        alert(result.message);
        loadPets();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting pet");
    }
    return;
  }

  if (e.target.classList.contains("editPetBtn")) {
    const card = e.target.closest(".pet-card");
    const petId = card.dataset.id;

    fetch(`/api/pets/${petId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          alert("Error loading pet data");
          return;
        }

        const pet = data.pet;
        const rabiesDate = pet.lastAntiRabiesShot ? new Date(pet.lastAntiRabiesShot).toISOString().split("T")[0] : "";

        content.innerHTML = `
        <h2>Edit Pet</h2>
        <form id="editPetForm" data-id="${petId}">
          <label>Name</label>
          <input name="name" value="${pet.name}" required />

          <label>Breed</label>
          <input name="breed" value="${pet.breed}" required />

          <label>Age</label>
          <input name="age" type="number" value="${pet.age}" min="0" required />

          <label>Gender</label>
          <select name="gender" required>
            <option value="">Select gender</option>
            <option value="male" ${pet.gender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${pet.gender === "female" ? "selected" : ""}>Female</option>
          </select>

          <label>Last Anti-Rabies Shot (Optional)</label>
          <input name="lastAntiRabiesShot" type="date" value="${rabiesDate}">

          <div class="form-buttons">
            <button type="submit" class="user-link">Save</button>
            <button type="button" id="cancelEditPet" class="logout-btn">Cancel</button>
          </div>
        </form>
      `;
      })
      .catch((err) => {
        console.error(err);
        alert("Error loading pet data");
      });
  }

  if (e.target.id === "cancelEditPet") { loadPets(); return; }
  if (e.target.id === "cancelEditProfile") { loadProfile(); return; }
  if (e.target.id === "cancelChangePassword") { loadProfile(); return; }

  if (e.target.closest("#editPetForm")) {
    const form = e.target.closest("#editPetForm");

    form.onsubmit = async (ev) => {
      ev.preventDefault();

      const petId = form.dataset.id;
      const data = {
        name: form.name.value,
        breed: form.breed.value,
        age: form.age.value,
        gender: form.gender.value,
        lastAntiRabiesShot: form.lastAntiRabiesShot.value,
      };

      try {
        const res = await fetch(`/api/pets/${petId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          alert(result.message);
          loadPets();
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Error updating pet");
      }
    };
  }

  if (e.target.closest("#editProfileForm")) {
    const form = e.target.closest("#editProfileForm");

    form.onsubmit = async (ev) => {
      ev.preventDefault();

      const data = {
        fullName: form.fullName.value,
        contact: form.contact.value,
        address: form.address.value,
      };

      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          alert(result.message);
          loadProfile();
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Error updating profile");
      }
    };
  }

  if (e.target.closest("#changePasswordForm")) {
    const form = e.target.closest("#changePasswordForm");

    form.onsubmit = async (ev) => {
      ev.preventDefault();

      const data = {
        currentPassword: form.currentPassword.value,
        newPassword: form.newPassword.value,
        confirmNewPassword: form.confirmNewPassword.value,
      };

      if (data.newPassword !== data.confirmNewPassword) {
        alert("New passwords do not match");
        return;
      }

      try {
        const res = await fetch("/api/user/change-password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          alert(result.message);
          form.reset();
          loadProfile();
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Error changing password");
      }
    };
  }
};

/* ===============================
   EDIT PROFILE FORM
================================ */
async function showEditProfileForm() {
  try {
    const res = await fetch("/api/user/profile");
    const data = await res.json();

    if (!data.success) {
      alert("Error loading profile: " + data.message);
      return;
    }

    const user = data.user;

    content.innerHTML = `
      <h2>Edit Profile</h2>
      <form id="editProfileForm">
        <label>Full Name</label>
        <input name="fullName" value="${user.fullName}" required />
        
        <label>Contact Number</label>
        <input name="contact" value="${user.contact}" required />
        
        <label>Address (Optional)</label>
        <textarea name="address" rows="3">${user.address || ""}</textarea>
        
        <div class="form-buttons">
          <button type="submit" class="user-link">Save Changes</button>
          <button type="button" id="cancelEditProfile" class="logout-btn">Cancel</button>
        </div>
      </form>
    `;
  } catch (err) {
    console.error(err);
    alert("Error loading profile form");
  }
}

/* ===============================
   CHANGE PASSWORD FORM
================================ */
function showChangePasswordForm() {
  content.innerHTML = `
    <h2>Change Password</h2>
    <form id="changePasswordForm">
      <label>Current Password</label>
      <input name="currentPassword" type="password" required />
      
      <label>New Password</label>
      <input name="newPassword" type="password" required />
      
      <label>Confirm New Password</label>
      <input name="confirmNewPassword" type="password" required />
      
      <div style="font-size: 12px; color: #666; margin: 10px 0;">
        Password must contain:
        <ul style="margin: 5px 0 0 20px;">
          <li>At least 8 characters</li>
          <li>One uppercase letter</li>
          <li>One lowercase letter</li>
          <li>One number</li>
        </ul>
      </div>
      
      <div class="form-buttons">
        <button type="submit" class="user-link">Change Password</button>
        <button type="button" id="cancelChangePassword" class="logout-btn">Cancel</button>
      </div>
    </form>
  `;
}

/* ===============================
   BOOKINGS SECTION
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>My Bookings</h2>
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
      const res = await fetch(`/api/bookings?type=${type}`);
      const data = await res.json();

      if (!data.success) {
        bookingsContent.innerHTML = `<p>Error: ${data.message}</p>`;
        return;
      }

      let html = `
        <h3>${type === "grooming" ? "Grooming Bookings" : "Pet Hotel Bookings"}</h3>
        <button id="newBookingBtn" class="user-link" style="margin-bottom:15px;">
          + New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking
        </button>
      `;

      if (data.bookings && data.bookings.length > 0) {
        html += `<div class="bookings-grid">`;
        data.bookings.forEach((b) => {
          const rejectReasonHtml = b.status === "rejected" && b.rejectReason
            ? `<p class="booking-reject-reason"><strong>Reason:</strong> ${b.rejectReason}</p>`
            : "";

          html += `
            <div class="booking-card">
              <p><strong>Pets:</strong> ${b.pets.map((p) => p.name).join(", ")}</p>
              ${type === "grooming" && b.services ? `<p><strong>Services:</strong> ${Array.isArray(b.services) ? b.services.join(", ") : b.services}</p>` : ""}
              <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${b.appointmentTime || "N/A"}</p>
              ${type === "hotel" ? `<p><strong>Checkout:</strong> ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString() : "N/A"} ${b.hotelCheckoutTime || ""}</p>` : ""}
              <p><strong>Status:</strong> <span class="booking-status ${b.status}">${b.status.toUpperCase()}</span></p>
              ${rejectReasonHtml}
              <button class="deleteBookingBtn" data-id="${b._id}">Delete</button>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p>No bookings found.</p>`;
      }

      bookingsContent.innerHTML = html;

      document.getElementById("newBookingBtn").onclick = () => showBookingForm(type);

      document.querySelectorAll(".deleteBookingBtn").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Delete this booking?")) return;

          try {
            const res = await fetch(`/api/bookings/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();

            if (result.success) {
              alert(result.message);
              loadBookings(type);
            } else {
              alert(result.message);
            }
          } catch (err) {
            console.error(err);
            alert("Error deleting booking");
          }
        };
      });
    } catch (err) {
      console.error(err);
      bookingsContent.innerHTML = "<p>Error loading bookings.</p>";
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

/* ===============================
   AVAILABLE SLOTS HELPER
================================ */
async function fetchAvailableSlots(date, type) {
  try {
    const res = await fetch(`/api/bookings/available-slots?date=${date}&type=${type}`);
    const data = await res.json();
    // API now returns [{time, available}]
    if (data.success) return data.slots;
    return [];
  } catch (err) {
    console.error("Error fetching slots:", err);
    return [];
  }
}

function buildTimeSelect(slots, name, required = true) {
  const reqAttr = required ? "required" : "";
  if (!slots.length) {
    return `<select name="${name}" ${reqAttr} disabled>
              <option value="">No slots available for this date</option>
            </select>`;
  }
  const options = slots.map((s) => {
    if (s.available) {
      return `<option value="${s.time}">${s.time}</option>`;
    }
    return `<option value="" disabled>${s.time} — fully booked</option>`;
  }).join("");
  const hasAvailable = slots.some((s) => s.available);
  return `<select name="${name}" ${reqAttr} ${!hasAvailable ? "disabled" : ""}>
            <option value="">Select time</option>
            ${options}
          </select>`;
}

/* ===============================
   BOOKING FORM
================================ */
async function showBookingForm(type) {
  try {
    const petsRes = await fetch("/api/pets");
    const petsData = await petsRes.json();

    if (!petsData.success) {
      alert("Error loading pets: " + petsData.message);
      return;
    }

    if (!petsData.pets || petsData.pets.length === 0) {
      alert("Please add a pet first before creating a booking.");
      document.querySelector('[data-section="pets"]').click();
      return;
    }

    window.petsData = petsData.pets;

    let petOptions = `<option value="">Select pet</option>`;
    petsData.pets.forEach((p) => {
      petOptions += `<option value="${p._id}" data-rabies="${p.lastAntiRabiesShot || ""}">${p.name} (${p.breed})</option>`;
    });

    // Set min date to today
    const todayStr = new Date().toISOString().split("T")[0];

    let groomingServicesHTML = "";
    if (type === "grooming") {
      groomingServicesHTML = `
        <div class="service-section">
          <h4>Select Main Grooming Service</h4>
          <div class="main-service-options">
            <div class="service-option">
              <input type="radio" id="fullGroom" name="mainService" value="Full Groom" required>
              <label for="fullGroom">Full Groom</label>
            </div>
            <div class="service-option">
              <input type="radio" id="bathBlowdry" name="mainService" value="Bath and Blowdry">
              <label for="bathBlowdry">Bath and Blowdry</label>
            </div>
          </div>
        </div>

        <div class="addon-toggle-container">
          <button type="button" id="toggleAddonsBtn" class="toggle-addons-btn">
            + Add Optional Services
          </button>
          <div id="addonServicesSection" class="addon-services-section" style="display: none;">
            <h4>Select Additional Services:</h4>
            <div class="addon-services-grid">
              <div class="service-option">
                <input type="checkbox" id="nailTrim" name="addonServices" value="Nail Trim">
                <label for="nailTrim">Nail Cut/Nail Trim</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="earCleaning" name="addonServices" value="Ear Cleaning">
                <label for="earCleaning">Ear Cleaning and Hair Removal</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="hairTrim" name="addonServices" value="Hair Trim">
                <label for="hairTrim">Hair Trim</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="poodleFeet" name="addonServices" value="Poodle Feet">
                <label for="poodleFeet">Poodle Feet</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="tearStain" name="addonServices" value="Tear Stain Removal">
                <label for="tearStain">Tear Stain Removal</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="teethCleaning" name="addonServices" value="Teeth Cleaning">
                <label for="teethCleaning">Teeth Cleaning</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="dematting" name="addonServices" value="Dematting">
                <label for="dematting">Dematting</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="analSac" name="addonServices" value="Anal Sac Draining">
                <label for="analSac">Anal Sac Draining</label>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const dateTimeHTML = type === "grooming"
      ? `
        <label>Appointment Date:</label>
        <input type="date" name="appointmentDate" id="appointmentDate" min="${todayStr}" required />

        <label>Appointment Time:</label>
        <div id="timeSlotWrap">
          <select name="appointmentTime" disabled>
            <option value="">Select a date first</option>
          </select>
        </div>
        <p id="timeSlotNote" class="slot-note" style="display:none;"></p>
      `
      : `
        <label>Check-in Date:</label>
        <input type="date" name="appointmentDate" id="appointmentDate" min="${todayStr}" required />

        <label>Check-in Time:</label>
        <input type="time" name="appointmentTime" required />

        <label>Checkout Date:</label>
        <input type="date" name="hotelCheckoutDate" min="${todayStr}" required />

        <label>Checkout Time:</label>
        <input type="time" name="hotelCheckoutTime" required />
      `;

    document.getElementById("bookingsContent").innerHTML = `
      <h3>New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking</h3>
      <form id="bookingForm">
        <div id="petsBookingContainer">
          <label>Select Pet:</label>
          <select class="booking-pet" required>${petOptions}</select>
          <div class="pet-rabies-info" style="display: none;">
            <strong>Last Anti-Rabies Shot:</strong> <span class="rabies-date"></span>
          </div>
        </div>

        ${groomingServicesHTML}

        ${dateTimeHTML}

        <div class="add-pet-checkbox">
          <input type="checkbox" id="addAnotherPet">
          <label for="addAnotherPet">Add another pet</label>
        </div>

        <div class="form-buttons">
          <button class="user-link" type="submit">Book Appointment</button>
          <button type="button" id="cancelBooking" class="logout-btn">Cancel</button>
        </div>
      </form>
    `;

    /* ---- Date change → fetch available slots (grooming only) ---- */
    if (type === "grooming") {
      const dateInput = document.getElementById("appointmentDate");
      const timeWrap = document.getElementById("timeSlotWrap");
      const noteEl = document.getElementById("timeSlotNote");

      dateInput.addEventListener("change", async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        timeWrap.innerHTML = `<select name="appointmentTime" disabled><option>Loading...</option></select>`;
        noteEl.style.display = "none";

        const slots = await fetchAvailableSlots(selectedDate, type);

        timeWrap.innerHTML = buildTimeSelect(slots, "appointmentTime", true);

        const hasAvailable = slots.some((s) => s.available);
        if (!hasAvailable) {
          const allTaken = slots.length > 0 && slots.every((s) => !s.available);
          noteEl.textContent = allTaken
            ? "All time slots for this date are fully booked."
            : "No available time slots for this date. Slots require at least 3 hours advance notice.";
          noteEl.style.display = "block";
        } else {
          noteEl.style.display = "none";
        }
      });
    }

    /* ---- Toggle add-ons ---- */
    const toggleBtn = document.getElementById("toggleAddonsBtn");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const addonsSection = document.getElementById("addonServicesSection");
        const isHidden = addonsSection.style.display === "none";
        addonsSection.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "− Hide Optional Services" : "+ Add Optional Services";
        toggleBtn.classList.toggle("active", isHidden);
      };
    }

    /* ---- Anti-rabies info display ---- */
    const updateRabiesInfo = (selectElement) => {
      const container = selectElement.closest("#petsBookingContainer") || selectElement.parentElement;
      const infoDiv = container.querySelector(".pet-rabies-info");
      const rabiesSpan = container.querySelector(".rabies-date");

      if (selectElement.value) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const rabiesDate = selectedOption.dataset.rabies;
        rabiesSpan.textContent = rabiesDate ? new Date(rabiesDate).toLocaleDateString() : "Not set";
        infoDiv.style.display = "block";
      } else {
        infoDiv.style.display = "none";
      }
    };

    document.querySelector(".booking-pet").addEventListener("change", function () {
      updateRabiesInfo(this);
    });

    document.getElementById("cancelBooking").onclick = () => loadBookingsSection();

    /* ---- Add another pet ---- */
    document.getElementById("addAnotherPet").onchange = (e) => {
      if (e.target.checked) {
        const container = document.getElementById("petsBookingContainer");
        const newSelect = document.createElement("select");
        newSelect.className = "booking-pet";
        newSelect.required = true;
        newSelect.innerHTML = petOptions;
        newSelect.style.marginTop = "10px";

        const newInfoDiv = document.createElement("div");
        newInfoDiv.className = "pet-rabies-info";
        newInfoDiv.style.display = "none";
        newInfoDiv.innerHTML = '<strong>Last Anti-Rabies Shot:</strong> <span class="rabies-date"></span>';

        container.appendChild(newSelect);
        container.appendChild(newInfoDiv);

        newSelect.addEventListener("change", function () {
          updateRabiesInfo(this);
        });
      } else {
        const selects = document.querySelectorAll(".booking-pet");
        const infoDivs = document.querySelectorAll(".pet-rabies-info");
        if (selects.length > 1) {
          selects[selects.length - 1].remove();
          infoDivs[infoDivs.length - 1].remove();
        }
      }
    };

    /* ---- Submit ---- */
    document.getElementById("bookingForm").onsubmit = async (e) => {
      e.preventDefault();

      const pets = [...document.querySelectorAll(".booking-pet")].map((s) => s.value).filter(Boolean);

      if (pets.length === 0) {
        alert("Please select at least one pet");
        return;
      }

      let services = null;
      if (type === "grooming") {
        const mainService = document.querySelector('input[name="mainService"]:checked')?.value;

        if (!mainService) {
          alert("Please select a main grooming service (Full Groom or Bath and Blowdry)");
          return;
        }

        services = [mainService];
        const selectedAddons = [...document.querySelectorAll('input[name="addonServices"]:checked')].map((cb) => cb.value);
        if (selectedAddons.length > 0) {
          services = [...services, ...selectedAddons];
        }
      }

      showBookingConfirmation(type, pets, services, e.target);
    };
  } catch (err) {
    console.error(err);
    alert("Error loading booking form");
  }
}

/* ===============================
   BOOKING CONFIRMATION DIALOG
================================ */
function showBookingConfirmation(type, pets, services, form) {
  const modal = document.createElement("div");
  modal.className = "confirmation-modal active";
  modal.innerHTML = `
    <div class="confirmation-content">
      <h3>⚠️ Important Booking Information</h3>
      
      <div class="important-notice">
        <p><strong>Please read and confirm that you understand:</strong></p>
        <ul>
          <li>✓ Your booking status will be <strong>PENDING</strong> until approved by staff</li>
          <li>✓ Payment is to be made <strong>AT THE SHOP</strong> upon arrival</li>
          <li>✓ Prices may vary depending on:
            <ul style="margin-top: 5px;">
              <li>Pet size</li>
              <li>Fur length and condition</li>
              <li>Selected services</li>
            </ul>
          </li>
          <li>✓ Final pricing will be confirmed at the shop</li>
          <li>✓ Please arrive on time for your appointment</li>
        </ul>
      </div>

      <p style="text-align: center; margin-top: 15px; font-weight: 600;">
        Do you understand and wish to proceed with the booking?
      </p>

      <div class="confirmation-buttons">
        <button class="confirm-yes">Yes, I Understand</button>
        <button class="confirm-no">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".confirm-yes").onclick = async () => {
    modal.remove();
    await submitBooking(type, pets, services, form);
  };

  modal.querySelector(".confirm-no").onclick = () => {
    modal.remove();
  };
}

/* ===============================
   SUBMIT BOOKING
================================ */
async function submitBooking(type, pets, services, form) {
  const formData = {
    type,
    pets,
    services,
    appointmentDate: form.appointmentDate?.value,
    appointmentTime: form.appointmentTime?.value,
    hotelCheckoutDate: form.hotelCheckoutDate?.value,
    hotelCheckoutTime: form.hotelCheckoutTime?.value,
  };

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (result.success) {
      alert(result.message);
      loadBookingsSection();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error creating booking");
  }
}

/* ===============================
   PETS SECTION
================================ */
function loadPets() {
  content.innerHTML = `<h2>My Pets</h2><p>Loading...</p>`;

  fetch("/api/pets")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        content.innerHTML = `<h2>My Pets</h2><p>Error: ${data.message}</p>`;
        return;
      }

      let html = `
        <h2>My Pets</h2>
        <button id="addPetBtn" class="user-link">+ Add Pet</button>
      `;

      if (data.pets && data.pets.length > 0) {
        html += `<div class="pets-grid">`;
        data.pets.forEach((p) => {
          const bgColor = p.gender === "female" ? 'style="background-color: #ffc0cb;"' : p.gender === "male" ? 'style="background-color: #1870c7; color: white;"' : "";
          const rabiesDate = p.lastAntiRabiesShot ? new Date(p.lastAntiRabiesShot).toLocaleDateString() : "Not set";
          html += `
            <div class="pet-card" data-id="${p._id}" ${bgColor}>
              <div class="pet-photo-wrap">
                <img class="pet-photo" 
                  src="${p.photo ? "" : "/images/default-pet.png"}" 
                  alt="${p.name}"
                  data-s3key="${p.photo || ""}"
                  onerror="this.src='/images/default-pet.png'" />
              </div>
              <h3>${p.name}</h3>
              <p><strong>Breed:</strong> ${p.breed}</p>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "N/A"}</p>
              <p><strong>Last Anti-Rabies:</strong> ${rabiesDate}</p>
              <div class="pet-actions">
                <button class="editPetBtn">Edit</button>
                <button class="deletePetBtn">Delete</button>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p>No pets added yet.</p>`;
      }

      content.innerHTML = html;

      document.querySelectorAll(".pet-photo[data-s3key]").forEach(async (img) => {
        const key = img.dataset.s3key;
        if (!key) return;
        try {
          const url = await getSignedUrl(key);
          img.src = url;
        } catch (err) {
          img.src = "/images/default-pet.png";
        }
      });
    })
    .catch((err) => {
      console.error(err);
      content.innerHTML = `<h2>My Pets</h2><p>Error loading pets.</p>`;
    });
}

/* ===============================
   ADD PET FORM
================================ */
function showAddPetForm() {
  content.innerHTML = `
    <h2>Add Pet</h2>
    <form id="addPetForm">
      <label>Name</label>
      <input name="name" placeholder="Enter pet name" required>

      <label>Breed</label>
      <input name="breed" placeholder="Enter breed" required>

      <label>Age</label>
      <input name="age" type="number" placeholder="Enter age" min="0" required>

      <label>Gender</label>
      <select name="gender" required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label>Last Anti-Rabies Shot</label>
      <input name="lastAntiRabiesShot" type="date" required>

      <label>Pet Photo (Optional)</label>
      <input type="file" id="petPhotoInput" accept="image/jpeg,image/png,image/webp" />
      <div id="petPhotoPreviewWrap" style="display:none; margin-top:8px;">
        <img id="petPhotoPreview" src="" alt="Preview"
          style="width:100px; height:100px; object-fit:cover; border-radius:50%; border:3px solid #d44d7c;" />
      </div>
      <p id="petPhotoError" style="color:#d44d7c; font-size:0.85rem; display:none;"></p>

      <div class="form-buttons">
        <button class="user-link" type="submit">Add Pet</button>
        <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById("cancelAdd").onclick = loadPets;

  document.getElementById("petPhotoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const errorEl = document.getElementById("petPhotoError");
    const previewWrap = document.getElementById("petPhotoPreviewWrap");
    errorEl.style.display = "none";

    if (!file) return;
    const err = validateFile(file, "image");
    if (err) {
      errorEl.textContent = err;
      errorEl.style.display = "block";
      e.target.value = "";
      return;
    }
    document.getElementById("petPhotoPreview").src = URL.createObjectURL(file);
    previewWrap.style.display = "block";
  });

  document.getElementById("addPetForm").onsubmit = async (e) => {
    e.preventDefault();

    let photoFileName = null;
    const photoFile = document.getElementById("petPhotoInput").files[0];

    if (photoFile) {
      try {
        photoFileName = await uploadToS3(photoFile, "/api/upload/pet-photo");
      } catch (err) {
        alert("Photo upload failed: " + err.message);
        return;
      }
    }

    const data = {
      name: e.target.name.value,
      breed: e.target.breed.value,
      age: e.target.age.value,
      gender: e.target.gender.value,
      lastAntiRabiesShot: e.target.lastAntiRabiesShot.value,
      photo: photoFileName,
    };

    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        loadPets();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error adding pet");
    }
  };
}