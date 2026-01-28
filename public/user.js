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

    if (section === "pets") {
      loadPets();
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

    document.getElementById("bookingsContent").innerHTML = `
      <h3>New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking</h3>
      <form id="bookingForm">
        <div id="petsBookingContainer">
          <label>Pet:</label>
          <select class="booking-pet" required>${petOptions}</select>
        </div>

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

        <button class="user-link" type="submit">Book</button>
        <button type="button" id="cancelBooking" class="logout-btn">Cancel</button>
      </form>
    `;

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

      const formData = {
        type,
        pets,
        antiRabiesDate: e.target.antiRabiesDate?.value,
        appointmentDate: e.target.appointmentDate?.value,
        appointmentTime: e.target.appointmentTime?.value,
        hotelCheckoutDate: e.target.hotelCheckoutDate?.value,
        hotelCheckoutTime: e.target.hotelCheckoutTime?.value,
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
    };
  } catch (err) {
    console.error(err);
    alert("Error loading booking form");
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
              <button class="editPetBtn">Edit</button>
              <button class="deletePetBtn">Delete</button>
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
   PET ACTIONS (DELEGATED)
================================ */
content.onclick = async (e) => {
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

  // ---------- CANCEL EDIT ----------
  if (e.target.id === "cancelEditPet") {
    loadPets();
    return;
  }

  // ---------- SUBMIT EDIT ----------
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
};

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
      
      <button class="user-link" type="submit">Add Pet</button>
      <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
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
