const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content = document.getElementById("dashboardContent");

/* ===============================
   Dashboard Mobile Menu Toggle
================================ */
const dashboardMenuToggle = document.getElementById("dashboardMenuToggle");
const dashboardSidebar = document.getElementById("dashboardSidebar");
const dashboardOverlay = document.getElementById("dashboardOverlay");

if (dashboardMenuToggle && dashboardSidebar && dashboardOverlay) {
  // Toggle menu
  dashboardMenuToggle.addEventListener("click", () => {
    dashboardMenuToggle.classList.toggle("active");
    dashboardSidebar.classList.toggle("active");
    dashboardOverlay.classList.toggle("active");
    document.body.style.overflow = dashboardSidebar.classList.contains("active") ? "hidden" : "";
  });

  // Close menu when clicking overlay
  dashboardOverlay.addEventListener("click", () => {
    dashboardMenuToggle.classList.remove("active");
    dashboardSidebar.classList.remove("active");
    dashboardOverlay.classList.remove("active");
    document.body.style.overflow = "";
  });

  // Close menu when clicking a sidebar link
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

    if (section === "pets") {
      loadPets();
    }

    if (section === "bookings") {
      loadBookingsSection();
    }
  });
});

// Load profile on page load
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
  // ---------- EDIT PROFILE ----------
  if (e.target.id === "editProfileBtn") {
    showEditProfileForm();
    return;
  }

  // ---------- CHANGE PASSWORD ----------
  if (e.target.id === "changePasswordBtn") {
    showChangePasswordForm();
    return;
  }

  // ---------- ADD PET ----------
  if (e.target.id === "addPetBtn") {
    showAddPetForm();
    return;
  }

  // ---------- DELETE PET ----------
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

  // ---------- EDIT PET ----------
  if (e.target.classList.contains("editPetBtn")) {
    const card = e.target.closest(".pet-card");
    const petId = card.dataset.id;

    const name = card.querySelector("h3").innerText;
    const breed = card.querySelector("p:nth-of-type(1)").innerText.replace("Breed: ", "");
    const age = card.querySelector("p:nth-of-type(2)").innerText.replace("Age: ", "");
    const genderText = card.querySelector("p:nth-of-type(3)").innerText.replace("Gender: ", "");
    const gender = genderText.toLowerCase();

    content.innerHTML = `
      <h2>Edit Pet</h2>
      <form id="editPetForm" data-id="${petId}">
        <label>Name</label>
        <input name="name" value="${name}" required />

        <label>Breed</label>
        <input name="breed" value="${breed}" required />

        <label>Age</label>
        <input name="age" type="number" value="${age}" min="0" required />

        <label>Gender</label>
        <select name="gender" required>
          <option value="">Select gender</option>
          <option value="male" ${gender === "male" ? "selected" : ""}>Male</option>
          <option value="female" ${gender === "female" ? "selected" : ""}>Female</option>
        </select>

        <button type="submit" class="user-link">Save</button>
        <button type="button" id="cancelEditPet" class="logout-btn">Cancel</button>
      </form>
    `;
    return;
  }

  // ---------- CANCEL EDIT PET ----------
  if (e.target.id === "cancelEditPet") {
    loadPets();
    return;
  }

  // ---------- CANCEL EDIT PROFILE ----------
  if (e.target.id === "cancelEditProfile") {
    loadProfile();
    return;
  }

  // ---------- CANCEL CHANGE PASSWORD ----------
  if (e.target.id === "cancelChangePassword") {
    loadProfile();
    return;
  }

  // ---------- SUBMIT EDIT PET ----------
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

  // ---------- SUBMIT EDIT PROFILE ----------
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

  // ---------- SUBMIT CHANGE PASSWORD ----------
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
        
        <button type="submit" class="user-link">Save Changes</button>
        <button type="button" id="cancelEditProfile" class="logout-btn">Cancel</button>
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
      
      <button type="submit" class="user-link">Change Password</button>
      <button type="button" id="cancelChangePassword" class="logout-btn">Cancel</button>
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
          html += `
            <div class="booking-card">
              <p><strong>Pets:</strong> ${b.pets.map((p) => p.name).join(", ")}</p>
              ${type === "grooming" && b.services ? `<p><strong>Services:</strong> ${Array.isArray(b.services) ? b.services.join(", ") : b.services}</p>` : ""}
              <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${b.appointmentTime || "N/A"}</p>
              ${type === "hotel" ? `<p><strong>Checkout:</strong> ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString() : "N/A"} ${b.hotelCheckoutTime || ""}</p>` : ""}
              <p><strong>Status:</strong> <span class="booking-status ${b.status}">${b.status.toUpperCase()}</span></p>
              <button class="deleteBookingBtn" data-id="${b._id}">Delete</button>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p>No bookings found.</p>`;
      }

      bookingsContent.innerHTML = html;

      // Bind new booking button
      document.getElementById("newBookingBtn").onclick = () => showBookingForm(type);

      // Bind delete buttons
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

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadBookings(btn.dataset.type);
    };
  });

  // Load initial bookings
  loadBookings("grooming");
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

    let petOptions = `<option value="">Select pet</option>`;
    petsData.pets.forEach((p) => {
      petOptions += `<option value="${p._id}">${p.name} (${p.breed})</option>`;
    });

    let groomingServicesHTML = "";
    if (type === "grooming") {
      groomingServicesHTML = `
        <div class="service-section">
          <h4>Select Grooming Services</h4>
          
          <div class="service-options">
            <div class="service-option">
              <input type="radio" id="fullGroom" name="serviceType" value="Full Groom" required>
              <label for="fullGroom">Full Groom</label>
            </div>
            
            <div class="service-option">
              <input type="radio" id="bathBlowdry" name="serviceType" value="Bath and Blowdry">
              <label for="bathBlowdry">Bath and Blowdry</label>
            </div>
            
            <div class="service-option">
              <input type="radio" id="alacarte" name="serviceType" value="alacarte">
              <label for="alacarte">A La Carte Services</label>
            </div>
          </div>

          <div id="alacarteOptions" style="display: none; margin-top: 15px; padding-left: 20px;">
            <p style="margin-bottom: 10px; font-weight: 600; color: #666;">Select A La Carte Services:</p>
            <div class="service-options">
              <div class="service-option">
                <input type="checkbox" id="nailTrim" name="alacarteServices" value="Nail Trim">
                <label for="nailTrim">Nail Cut/Nail Trim</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="earCleaning" name="alacarteServices" value="Ear Cleaning">
                <label for="earCleaning">Ear Cleaning and Hair Removal</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="hairTrim" name="alacarteServices" value="Hair Trim">
                <label for="hairTrim">Hair Trim</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="poodleFeet" name="alacarteServices" value="Poodle Feet">
                <label for="poodleFeet">Poodle Feet</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="tearStain" name="alacarteServices" value="Tear Stain Removal">
                <label for="tearStain">Tear Stain Removal</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="teethCleaning" name="alacarteServices" value="Teeth Cleaning">
                <label for="teethCleaning">Teeth Cleaning</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="dematting" name="alacarteServices" value="Dematting">
                <label for="dematting">Dematting</label>
              </div>
              <div class="service-option">
                <input type="checkbox" id="analSac" name="alacarteServices" value="Anal Sac Draining">
                <label for="analSac">Anal Sac Draining</label>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    document.getElementById("bookingsContent").innerHTML = `
      <h3>New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking</h3>
      <form id="bookingForm">
        <div id="petsBookingContainer">
          <label>Pet:</label>
          <select class="booking-pet" required>${petOptions}</select>
        </div>

        ${groomingServicesHTML}

        ${
          type === "grooming"
            ? `
          <label>Last Anti-Rabies Shot:</label>
          <input type="date" name="antiRabiesDate" required />

          <label>Appointment Date:</label>
          <input type="date" name="appointmentDate" required />

          <label>Time:</label>
          <select name="appointmentTime" required>
            <option value="">Select time</option>
            <option>9:00 AM</option>
            <option>10:00 AM</option>
            <option>11:00 AM</option>
            <option>12:00 PM</option>
            <option>1:00 PM</option>
            <option>2:00 PM</option>
            <option>3:00 PM</option>
            <option>4:00 PM</option>
            <option>5:00 PM</option>
            <option>6:00 PM</option>
          </select>
        `
            : `
          <label>Check-in Date:</label>
          <input type="date" name="appointmentDate" required />
          
          <label>Check-in Time:</label>
          <input type="time" name="appointmentTime" required />

          <label>Checkout Date:</label>
          <input type="date" name="hotelCheckoutDate" required />
          
          <label>Checkout Time:</label>
          <input type="time" name="hotelCheckoutTime" required />
        `
        }

        <label><input type="checkbox" id="addAnotherPet"> Add another pet</label>

        <div class="form-buttons">
          <button class="user-link" type="submit">Book</button>
          <button type="button" id="cancelBooking" class="logout-btn">Cancel</button>
        </div>
      </form>
    `;

    // Show/hide alacarte options
    if (type === "grooming") {
      const serviceTypeRadios = document.querySelectorAll('input[name="serviceType"]');
      const alacarteOptions = document.getElementById("alacarteOptions");

      serviceTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          if (e.target.value === "alacarte") {
            alacarteOptions.style.display = "block";
          } else {
            alacarteOptions.style.display = "none";
            // Uncheck all alacarte checkboxes
            document.querySelectorAll('input[name="alacarteServices"]').forEach((cb) => (cb.checked = false));
          }
        });
      });
    }

    document.getElementById("cancelBooking").onclick = () => loadBookingsSection();

    document.getElementById("addAnotherPet").onchange = (e) => {
      if (e.target.checked) {
        const newSelect = document.createElement("select");
        newSelect.className = "booking-pet";
        newSelect.required = true;
        newSelect.innerHTML = petOptions;
        document.getElementById("petsBookingContainer").appendChild(newSelect);
      } else {
        const selects = document.querySelectorAll(".booking-pet");
        if (selects.length > 1) {
          selects[selects.length - 1].remove();
        }
      }
    };

    document.getElementById("bookingForm").onsubmit = async (e) => {
      e.preventDefault();

      const pets = [...document.querySelectorAll(".booking-pet")].map((s) => s.value).filter(Boolean);

      if (pets.length === 0) {
        alert("Please select at least one pet");
        return;
      }

      // Get selected services for grooming
      let services = null;
      if (type === "grooming") {
        const serviceType = document.querySelector('input[name="serviceType"]:checked')?.value;

        if (!serviceType) {
          alert("Please select a grooming service");
          return;
        }

        if (serviceType === "alacarte") {
          const selectedAlacarte = [...document.querySelectorAll('input[name="alacarteServices"]:checked')].map((cb) => cb.value);
          if (selectedAlacarte.length === 0) {
            alert("Please select at least one a la carte service");
            return;
          }
          services = selectedAlacarte;
        } else {
          services = [serviceType];
        }
      }

      // Show confirmation dialog before booking
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
  // Create modal
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

  // Handle confirmation
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
    antiRabiesDate: form.antiRabiesDate?.value,
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
          html += `
            <div class="pet-card" data-id="${p._id}" ${bgColor}>
              <h3>${p.name}</h3>
              <p><strong>Breed:</strong> ${p.breed}</p>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "N/A"}</p>
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
      
      <div class="form-buttons">
        <button class="user-link" type="submit">Add Pet</button>
        <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById("cancelAdd").onclick = loadPets;

  document.getElementById("addPetForm").onsubmit = async (e) => {
    e.preventDefault();

    const data = {
      name: e.target.name.value,
      breed: e.target.breed.value,
      age: e.target.age.value,
      gender: e.target.gender.value,
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
