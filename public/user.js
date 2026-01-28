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
      content.innerHTML = `
        <h2>Profile</h2>
        <p><strong>Email:</strong> ${content.dataset.email}</p>
        <p>More profile info will go here.</p>
      `;
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
    const res = await fetch(`/api/bookings?type=${type}`);
    const data = await res.json();

    let html = `
      <h3>${type === "grooming" ? "Grooming Bookings" : "Pet Hotel Bookings"}</h3>
      <button id="newBookingBtn" class="user-link" style="margin-bottom:15px;">
        + New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking
      </button>
    `;

    if (data.success && data.bookings.length) {
      html += `<div class="bookings-grid">`;
      data.bookings.forEach((b) => {
        html += `
          <div class="booking-card">
            <p><strong>Pets:</strong> ${b.pets.map((p) => p.name).join(", ")}</p>
            <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${b.appointmentTime || "N/A"}</p>
            ${type === "hotel" ? `<p><strong>Checkout:</strong> ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString() : "N/A"} ${b.hotelCheckoutTime || ""}</p>` : ""}
            <p><strong>Status:</strong><span class="booking-status ${b.status}">${b.status.toUpperCase()}</span></p>
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
        const res = await fetch(`/api/bookings/${btn.dataset.id}`, { method: "DELETE" });
        const result = await res.json();
        if (result.success) loadBookings(type);
      };
    });
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
   BOOKING FORM
================================ */
async function showBookingForm(type) {
  const petsRes = await fetch("/api/pets");
  const petsData = await petsRes.json();

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
          ${[9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((h) => `<option>${h}:00 ${h < 9 ? "PM" : "AM"}</option>`).join("")}
        </select>
      `
          : `
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

  document.getElementById("cancelBooking").onclick = () => document.querySelector('[data-section="bookings"]').click();

  document.getElementById("addAnotherPet").onchange = (e) => {
    if (e.target.checked) {
      const clone = document.querySelector(".booking-pet").cloneNode(true);
      document.getElementById("petsBookingContainer").appendChild(clone);
    }
  };

  document.getElementById("bookingForm").onsubmit = async (e) => {
    e.preventDefault();

    const pets = [...document.querySelectorAll(".booking-pet")].map((s) => s.value).filter(Boolean);

    const formData = {
      type,
      pets,
      antiRabiesDate: e.target.antiRabiesDate?.value,
      appointmentDate: e.target.appointmentDate?.value,
      appointmentTime: e.target.appointmentTime?.value,
      hotelCheckoutDate: e.target.hotelCheckoutDate?.value,
      hotelCheckoutTime: e.target.hotelCheckoutTime?.value,
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    if (result.success) {
      alert("Booking successful!");
      document.querySelector('[data-section="bookings"]').click();
    } else {
      alert(result.message);
    }
  };
}

/* ===============================
   PETS
================================ */
function loadPets() {
  content.innerHTML = `<h2>My Pets</h2><p>Loading...</p>`;

  fetch("/api/pets")
    .then((res) => res.json())
    .then((data) => {
      let html = `
        <h2>My Pets</h2>
        <button id="addPetBtn" class="user-link">+ Add Pet</button>
      `;

      if (data.success && data.pets.length) {
        html += `<div class="pets-grid">`;
        data.pets.forEach((p) => {
          html += `
            <div class="pet-card" data-id="${p._id}">
              <h3>${p.name}</h3>
              <p><strong>Breed:</strong> ${p.breed}</p>
              <p><strong>Age:</strong> ${p.age}</p>
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
      await fetch(`/api/pets/${petId}`, { method: "DELETE" });
      loadPets();
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

    content.innerHTML = `
      <h2>Edit Pet</h2>
      <form id="editPetForm" data-id="${petId}">
        <label>Name</label>
        <input name="name" value="${name}" required />

        <label>Breed</label>
        <input name="breed" value="${breed}" required />

        <label>Age</label>
        <input name="age" type="number" value="${age}" min="0" required />

        <button type="submit">Save</button>
        <button type="button" id="cancelEditPet">Cancel</button>
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
      };

      try {
        const res = await fetch(`/api/pets/${petId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();
        if (result.success) {
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
   ADD PET
================================ */
function showAddPetForm() {
  content.innerHTML = `
    <h2>Add Pet</h2>
    <form id="addPetForm">
      <input name="name" placeholder="Name" required>
      <input name="breed" placeholder="Breed" required>
      <input name="age" type="number" placeholder="Age" required>
      <button class="user-link">Add</button>
      <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
    </form>
  `;

  document.getElementById("cancelAdd").onclick = loadPets;

  document.getElementById("addPetForm").onsubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: e.target.name.value,
        breed: e.target.breed.value,
        age: e.target.age.value,
      }),
    });
    loadPets();
  };
}
