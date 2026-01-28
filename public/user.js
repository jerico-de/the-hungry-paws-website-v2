const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content = document.getElementById("dashboardContent");

sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    // Remove active class from all
    sidebarLinks.forEach((l) => l.classList.remove("active"));

    // Add active to clicked
    link.classList.add("active");

    const section = link.dataset.section;

    // Swap content
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
      content.innerHTML = `
        <h2>My Bookings</h2>
        <p>No bookings found.</p>
        <p>Your grooming history will appear here.</p>
      `;
    }
  });
});

// -----------------------------
// Load Pets Function
// -----------------------------
function loadPets() {
  content.innerHTML = `<h2>My Pets</h2><p>Loading pets...</p>`;

  fetch("/api/pets")
    .then((res) => res.json())
    .then((data) => {
      let petsHTML = `<h2>My Pets</h2>`;
      petsHTML += `<button id="addPetBtn" class="user-link" style="margin-bottom:15px;">+ Add Pet</button>`;

      if (data.success && data.pets.length > 0) {
        petsHTML += `<div class="pets-grid">`;
        data.pets.forEach((pet) => {
          petsHTML += `
            <div class="pet-card">
              <h3>${pet.name}</h3>
              <p><strong>Breed:</strong> ${pet.breed}</p>
              <p><strong>Age:</strong> ${pet.age}</p>
              <div class="pet-actions" style="margin-top:10px;">
                <button class="editPetBtn" data-id="${pet._id}">Edit</button>
                <button class="deletePetBtn" data-id="${pet._id}">Delete</button>
              </div>
            </div>
          `;
        });
        petsHTML += `</div>`;
      } else {
        petsHTML += `<p>You haven’t added any pets yet.</p>`;
      }

      content.innerHTML = petsHTML;
    })
    .catch((err) => {
      console.error(err);
      content.innerHTML = `<h2>My Pets</h2><p>Error loading pets.</p>`;
    });
}

// -----------------------------
// Delegated Event Handling
// -----------------------------
content.addEventListener("click", (e) => {
  const target = e.target;

  // ---------- Add Pet ----------
  if (target.id === "addPetBtn") {
    showAddPetForm();
  }

  // ---------- Delete Pet ----------
  if (target.classList.contains("deletePetBtn")) {
    const petId = target.dataset.id;
    if (!confirm("Are you sure you want to delete this pet?")) return;

    fetch(`/api/pets/${petId}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert(result.message);
          loadPets();
        } else {
          alert(result.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error deleting pet");
      });
  }

  // ---------- Edit Pet ----------
  if (target.classList.contains("editPetBtn")) {
    const petCard = target.closest(".pet-card");
    const petId = target.dataset.id;
    const name = petCard.querySelector("h3").innerText;
    const breed = petCard.querySelector("p:nth-of-type(1)").innerText.replace("Breed: ", "");
    const age = petCard.querySelector("p:nth-of-type(2)").innerText.replace("Age: ", "");

    content.innerHTML = `
      <h2>Edit Pet</h2>
      <form id="editPetForm">
        <label>Name:</label>
        <input type="text" name="name" value="${name}" required />
        <label>Breed:</label>
        <input type="text" name="breed" value="${breed}" required />
        <label>Age:</label>
        <input type="number" name="age" value="${age}" min="0" required />
        <button type="submit" class="user-link">Save Changes</button>
        <button type="button" id="cancelEditPet" class="logout-btn" style="margin-top:10px;">Cancel</button>
      </form>
    `;
  }

  // ---------- Cancel Edit ----------
  if (target.id === "cancelEditPet") {
    loadPets();
  }

  // ---------- Submit Edit ----------
  if (target.id === "editPetForm" || target.closest("#editPetForm")) {
    const form = target.closest("#editPetForm");
    if (!form) return;

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const petId = form.querySelector(".editPetBtn")?.dataset.id || form.dataset.id;

      const formData = {
        name: form.name.value,
        breed: form.breed.value,
        age: form.age.value,
      };

      try {
        const res = await fetch(`/api/pets/${petId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
    });
  }
});

// -----------------------------
// Add Pet Form
// -----------------------------
function showAddPetForm() {
  content.innerHTML = `
    <h2>Add a New Pet</h2>
    <form id="addPetForm">
      <label>Name:</label>
      <input type="text" name="name" required />
      <label>Breed:</label>
      <input type="text" name="breed" required />
      <label>Age:</label>
      <input type="number" name="age" min="0" required />
      <button type="submit" class="user-link">Add Pet</button>
      <button type="button" id="cancelAddPet" class="logout-btn" style="margin-top:10px;">Cancel</button>
    </form>
  `;

  content.addEventListener("click", (e) => {
    if (e.target.id === "cancelAddPet") loadPets();
  });

  document.getElementById("addPetForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const formData = {
      name: ev.target.name.value,
      breed: ev.target.breed.value,
      age: ev.target.age.value,
    };

    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      alert("Something went wrong");
    }
  });
}
