const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content = document.getElementById("dashboardContent");

/* ===============================
   Dashboard Mobile Menu Toggle
================================ */
const dashboardMenuToggle = document.getElementById("dashboardMenuToggle");
const dashboardSidebar    = document.getElementById("dashboardSidebar");
const dashboardOverlay    = document.getElementById("dashboardOverlay");

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
    if (section === "profile")  loadProfile();
    if (section === "pets")     loadPets();
    if (section === "bookings") loadBookingsSection();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  pollBookingBadge();
  setInterval(pollBookingBadge, 60000);
});

/* ===============================
   BOOKING BADGE POLL
================================ */
async function pollBookingBadge() {
  try {
    const [g, h] = await Promise.all([
      fetch("/api/bookings?type=grooming").then(r => r.json()),
      fetch("/api/bookings?type=hotel").then(r => r.json()),
    ]);
    const all = [...(g.bookings || []), ...(h.bookings || [])];
    const pendingCount = all.filter(b => b.status === "pending").length;

    const bookingsLink = document.querySelector('[data-section="bookings"]');
    if (!bookingsLink) return;

    let badge = bookingsLink.querySelector(".notification-badge");
    if (pendingCount > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "notification-badge";
        bookingsLink.appendChild(badge);
      }
      badge.textContent = pendingCount;
      badge.style.display = "inline-flex";
    } else {
      if (badge) badge.style.display = "none";
    }
  } catch (err) {
    console.error("Badge poll error:", err);
  }
}

/* ===============================
   PROFILE SECTION
================================ */
async function loadProfile() {
  content.innerHTML = `<h2>Profile</h2><p>Loading...</p>`;

  try {
    const res  = await fetch("/api/user/profile");
    const data = await res.json();

    if (!data.success) {
      content.innerHTML = `<h2>Profile</h2><p>Error: ${data.message}</p>`;
      return;
    }

    const user   = data.user;
    const joined = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" })
      : "—";

    content.innerHTML = `
      <h2>My Profile</h2>

      <!-- ── View card ── -->
      <div class="profile-section" id="profileViewSection">
        <div class="profile-avatar-row">
          <div class="profile-avatar-circle">${(user.fullName || "?").charAt(0).toUpperCase()}</div>
          <div>
            <p class="profile-big-name">${user.fullName}</p>
            <p class="profile-role-tag">Member</p>
          </div>
        </div>
        <div class="profile-info-grid">
          <div class="profile-info-item">
            <span class="profile-info-label">Email</span>
            <span class="profile-info-value">${user.email}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Full Name</span>
            <span class="profile-info-value">${user.fullName}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Contact</span>
            <span class="profile-info-value">${user.contact || "—"}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Address</span>
            <span class="profile-info-value">${user.address || "—"}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">Member Since</span>
            <span class="profile-info-value">${joined}</span>
          </div>
        </div>
        <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
          <button id="editProfileBtn" class="user-link">Edit Profile</button>
          <button id="changePasswordBtn" class="user-link" style="background:#6c757d;">Change Password</button>
        </div>
      </div>

      <!-- ── Edit Profile form (hidden by default) ── -->
      <div id="editProfileFormWrap" style="display:none; margin-top:20px;">
        <h3 style="color:#d44d7c; margin-bottom:16px;">Edit Profile</h3>
        <div class="admin-form-box" style="max-width:500px;">
          <label class="admin-form-label">Full Name
            <input type="text" id="epName" value="${user.fullName}" class="admin-form-input" />
          </label>
          <label class="admin-form-label">Contact Number
            <input type="text" id="epContact" value="${user.contact || ""}" class="admin-form-input" />
          </label>
          <label class="admin-form-label">Address (Optional)
            <input type="text" id="epAddress" value="${user.address || ""}" class="admin-form-input" />
          </label>
          <div class="admin-form-btns">
            <button class="btn" id="saveProfileBtn">Save Changes</button>
            <button class="btn" id="cancelProfileBtn" style="background:#6c757d;">Cancel</button>
          </div>
          <p id="profileMsg" class="admin-form-msg"></p>
        </div>
      </div>

      <!-- ── Change Password form (hidden by default) ── -->
      <div id="changePasswordFormWrap" style="display:none; margin-top:20px;">
        <h3 style="color:#d44d7c; margin-bottom:16px;">Change Password</h3>
        <div class="admin-form-box" style="max-width:500px;">
          <label class="admin-form-label">Current Password
            <input type="password" id="cpCurrent" class="admin-form-input" />
          </label>
          <label class="admin-form-label">New Password
            <input type="password" id="cpNew" class="admin-form-input" />
          </label>
          <label class="admin-form-label">Confirm New Password
            <input type="password" id="cpConfirm" class="admin-form-input" />
          </label>
          <div style="font-size:12px; color:#666; margin:4px 0 8px;">
            Must have 8+ chars, one uppercase, one lowercase, one number.
          </div>
          <div class="admin-form-btns">
            <button class="btn" id="savePassBtn">Update Password</button>
            <button class="btn" id="cancelPassBtn" style="background:#6c757d;">Cancel</button>
          </div>
          <p id="passMsg" class="admin-form-msg"></p>
        </div>
      </div>
    `;

    /* ── Edit profile toggle ── */
    document.getElementById("editProfileBtn").onclick = () => {
      document.getElementById("profileViewSection").style.display     = "none";
      document.getElementById("editProfileFormWrap").style.display    = "block";
      document.getElementById("changePasswordFormWrap").style.display = "none";
    };
    document.getElementById("cancelProfileBtn").onclick = () => {
      document.getElementById("profileViewSection").style.display     = "block";
      document.getElementById("editProfileFormWrap").style.display    = "none";
    };
    document.getElementById("saveProfileBtn").onclick = async () => {
      const msg  = document.getElementById("profileMsg");
      const body = {
        fullName: document.getElementById("epName").value.trim(),
        contact:  document.getElementById("epContact").value.trim(),
        address:  document.getElementById("epAddress").value.trim(),
      };
      try {
        const res    = await fetch("/api/user/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const result = await res.json();
        if (result.success) { alert(result.message); loadProfile(); }
        else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch (err) { msg.textContent = "Error saving profile."; msg.style.display = "block"; }
    };

    /* ── Change password toggle ── */
    document.getElementById("changePasswordBtn").onclick = () => {
      document.getElementById("profileViewSection").style.display     = "none";
      document.getElementById("editProfileFormWrap").style.display    = "none";
      document.getElementById("changePasswordFormWrap").style.display = "block";
    };
    document.getElementById("cancelPassBtn").onclick = () => {
      document.getElementById("profileViewSection").style.display     = "block";
      document.getElementById("changePasswordFormWrap").style.display = "none";
    };
    document.getElementById("savePassBtn").onclick = async () => {
      const msg     = document.getElementById("passMsg");
      const current = document.getElementById("cpCurrent").value;
      const newPass = document.getElementById("cpNew").value;
      const confirm = document.getElementById("cpConfirm").value;
      if (newPass !== confirm) { msg.textContent = "Passwords do not match."; msg.style.display = "block"; return; }
      try {
        const res    = await fetch("/api/user/change-password", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ currentPassword:current, newPassword:newPass, confirmNewPassword:confirm }) });
        const result = await res.json();
        if (result.success) { alert(result.message); loadProfile(); }
        else { msg.textContent = result.message; msg.style.display = "block"; }
      } catch (err) { msg.textContent = "Error updating password."; msg.style.display = "block"; }
    };

  } catch (err) {
    console.error(err);
    content.innerHTML = `<h2>Profile</h2><p>Error loading profile.</p>`;
  }
}

/* ===============================
   PROFILE ACTIONS (DELEGATED)
================================ */
content.onclick = async (e) => {
  if (e.target.id === "editProfileBtn")    { showEditProfileForm();   return; }
  if (e.target.id === "changePasswordBtn") { showChangePasswordForm(); return; }
  if (e.target.id === "addPetBtn")         { showAddPetForm();         return; }

  if (e.target.classList.contains("deletePetBtn")) {
    const card  = e.target.closest(".pet-card");
    const petId = card.dataset.id;
    if (!confirm("Delete this pet?")) return;
    try {
      const res    = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) { alert(result.message); loadPets(); }
      else alert(result.message);
    } catch (err) { console.error(err); alert("Error deleting pet"); }
    return;
  }

  if (e.target.classList.contains("editPetBtn")) {
    const card  = e.target.closest(".pet-card");
    const petId = card.dataset.id;
    fetch(`/api/pets/${petId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { alert("Error loading pet data"); return; }
        showEditPetForm(data.pet, petId);
      })
      .catch(() => alert("Error loading pet data"));
    return;
  }

  if (e.target.id === "cancelEditPet") { loadPets(); return; }

  /* profile & password forms are wired directly inside loadProfile() */
};

/* showEditProfileForm and showChangePasswordForm are now inline in loadProfile() */

/* ===============================
   PETS SECTION
================================ */
function loadPets() {
  content.innerHTML = `<h2>My Pets</h2><p>Loading...</p>`;

  fetch("/api/pets")
    .then(r => r.json())
    .then(data => {
      if (!data.success) { content.innerHTML = `<h2>My Pets</h2><p>Error: ${data.message}</p>`; return; }

      let html = `<h2>My Pets</h2><button id="addPetBtn" class="user-link">+ Add Pet</button>`;

      if (data.pets && data.pets.length > 0) {
        html += `<div class="pets-grid">`;
        data.pets.forEach(p => {
          const bgColor    = p.gender === "female" ? 'style="background-color: #ffc0cb;"' : p.gender === "male" ? 'style="background-color: #1870c7; color: white;"' : "";
          const rabiesDate = p.lastAntiRabiesShot ? new Date(p.lastAntiRabiesShot).toLocaleDateString() : "Not set";
          const posStyle   = p.photoPosition || "50% 50%";
          const zoom       = Number(p.photoZoom || 100);
          const posXVal    = p.photoPosition ? parseFloat(p.photoPosition.split(" ")[0]) : 50;
          const posYVal    = p.photoPosition ? parseFloat(p.photoPosition.split(" ")[1]) : 50;
          const overhang   = zoom - 100;
          const imgLeft    = -(overhang * (posXVal / 100));
          const imgTop     = -(overhang * (posYVal / 100));
          html += `
            <div class="pet-card" data-id="${p._id}" ${bgColor}>
              <div class="pet-photo-wrap">
                <img class="pet-photo"
                  src="${p.photo ? "" : "/images/default-pet.png"}"
                  alt="${p.name}"
                  data-s3key="${p.photo || ""}"
                  style="width:${zoom}%; height:${zoom}%; left:${imgLeft}%; top:${imgTop}%;"
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
            </div>`;
        });
        html += `</div>`;
      } else {
        html += `<p>No pets added yet.</p>`;
      }

      content.innerHTML = html;

      /* Load S3 photos */
      document.querySelectorAll(".pet-photo[data-s3key]").forEach(async img => {
        const key = img.dataset.s3key;
        if (!key) return;
        try { img.src = await getSignedUrl(key); }
        catch (_) { img.src = "/images/default-pet.png"; }
      });
    })
    .catch(err => { console.error(err); content.innerHTML = `<h2>My Pets</h2><p>Error loading pets.</p>`; });
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

      <div id="petPhotoPreviewWrap" style="display:none; margin-top:10px;">
        <div class="pet-photo-wrap" style="margin-bottom:10px;">
          <img id="petPhotoPreview" src="" alt="Preview" class="pet-photo" />
        </div>
        <label style="font-size:0.85rem; font-weight:600; color:#555; margin-bottom:4px; display:block;">
          Adjust photo position in circle
        </label>
        <div class="photo-pos-sliders">
          <div class="photo-pos-row">
            <span>⬅ Left / Right ➡</span>
            <input type="range" id="photoPosX" min="0" max="100" value="50" />
          </div>
          <div class="photo-pos-row">
            <span>⬆ Up / Down ⬇</span>
            <input type="range" id="photoPosY" min="0" max="100" value="50" />
          </div>
          <div class="photo-pos-row">
            <span>🔍 Zoom</span>
            <input type="range" id="photoZoom" min="100" max="200" value="100" />
          </div>
        </div>
      </div>
      <p id="petPhotoError" style="color:#d44d7c; font-size:0.85rem; display:none;"></p>

      <div class="form-buttons">
        <button class="user-link" type="submit">Add Pet</button>
        <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById("cancelAdd").onclick = loadPets;

  const photoInput  = document.getElementById("petPhotoInput");
  const previewWrap = document.getElementById("petPhotoPreviewWrap");
  const previewImg  = document.getElementById("petPhotoPreview");
  const errorEl     = document.getElementById("petPhotoError");
  const posX        = document.getElementById("photoPosX");
  const posY        = document.getElementById("photoPosY");
  const posZoom     = document.getElementById("photoZoom");

  photoInput.addEventListener("change", e => {
    errorEl.style.display = "none";
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file, "image");
    if (err) { errorEl.textContent = err; errorEl.style.display = "block"; e.target.value = ""; return; }
    previewImg.src = URL.createObjectURL(file);
    previewWrap.style.display = "block";
  });

  const updatePos = () => {
    const z        = Number(posZoom.value);  // 100–200
    const overhang = z - 100;                // how much bigger than wrapper
    const left     = -(overhang * (posX.value / 100));
    const top      = -(overhang * (posY.value / 100));
    previewImg.style.width  = `${z}%`;
    previewImg.style.height = `${z}%`;
    previewImg.style.left   = `${left}%`;
    previewImg.style.top    = `${top}%`;
  };
  posX.addEventListener("input", updatePos);
  posY.addEventListener("input", updatePos);
  posZoom.addEventListener("input", updatePos);

  document.getElementById("addPetForm").onsubmit = async e => {
    e.preventDefault();

    let photoFileName = null;
    const photoFile = photoInput.files[0];
    if (photoFile) {
      try { photoFileName = await uploadToS3(photoFile, "/api/upload/pet-photo"); }
      catch (err) { alert("Photo upload failed: " + err.message); return; }
    }

    const data = {
      name:              e.target.name.value,
      breed:             e.target.breed.value,
      age:               e.target.age.value,
      gender:            e.target.gender.value,
      lastAntiRabiesShot: e.target.lastAntiRabiesShot.value,
      photo:             photoFileName,
      photoPosition:     photoFileName ? `${posX.value}% ${posY.value}%` : null,
      photoZoom:         photoFileName ? posZoom.value : null,
    };

    try {
      const res    = await fetch("/api/pets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { alert(result.message); loadPets(); }
      else alert(result.message);
    } catch (err) { console.error(err); alert("Error adding pet"); }
  };
}

/* ===============================
   EDIT PET FORM  ← updated with photo edit + crop
================================ */
async function showEditPetForm(pet, petId) {
  const rabiesDate   = pet.lastAntiRabiesShot ? new Date(pet.lastAntiRabiesShot).toISOString().split("T")[0] : "";
  const posX         = pet.photoPosition ? pet.photoPosition.split(" ")[0].replace("%", "") : "50";
  const posY         = pet.photoPosition ? pet.photoPosition.split(" ")[1].replace("%", "") : "50";
  const existingZoom = pet.photoZoom || 100;
  const hasPhoto     = !!pet.photo;

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
        <option value="male"   ${pet.gender === "male"   ? "selected" : ""}>Male</option>
        <option value="female" ${pet.gender === "female" ? "selected" : ""}>Female</option>
      </select>
      <label>Last Anti-Rabies Shot (Optional)</label>
      <input name="lastAntiRabiesShot" type="date" value="${rabiesDate}">

      <!-- ── Pet Photo ── -->
      <label>Pet Photo</label>
      <div class="pet-photo-wrap" style="margin-bottom:8px;">
        <img id="editPhotoPreview" class="pet-photo"
          src="/images/default-pet.png"
          alt="${pet.name}"
          style="object-position: ${posX}% ${posY}%;" />
      </div>

      <input type="file" id="editPetPhotoInput" accept="image/jpeg,image/png,image/webp"
        style="margin-bottom:6px;" />
      <p id="editPhotoError" style="color:#d44d7c; font-size:0.85rem; display:none;"></p>

      <!-- Position sliders — visible if pet already has a photo or user uploads new one -->
      <div id="cropControls" style="display:${hasPhoto ? "block" : "none"}; margin-bottom:14px;">
        <label style="font-size:0.85rem; font-weight:600; color:#555; display:block; margin-bottom:4px;">
          Adjust photo position in circle
        </label>
        <div class="photo-pos-sliders">
          <div class="photo-pos-row">
            <span>⬅ Left / Right ➡</span>
            <input type="range" id="editPosX" min="0" max="100" value="${posX}" />
          </div>
          <div class="photo-pos-row">
            <span>⬆ Up / Down ⬇</span>
            <input type="range" id="editPosY" min="0" max="100" value="${posY}" />
          </div>
          <div class="photo-pos-row">
            <span>🔍 Zoom</span>
            <input type="range" id="editPosZoom" min="100" max="200" value="${existingZoom}" />
          </div>
        </div>
      </div>

      <div class="form-buttons">
        <button type="submit" class="user-link">Save Changes</button>
        <button type="button" id="cancelEditPet" class="logout-btn">Cancel</button>
      </div>
    </form>
  `;

  const form       = document.getElementById("editPetForm");
  const preview    = document.getElementById("editPhotoPreview");
  const photoInput = document.getElementById("editPetPhotoInput");
  const errorEl    = document.getElementById("editPhotoError");
  const cropDiv    = document.getElementById("cropControls");
  const sliderX    = document.getElementById("editPosX");
  const sliderY    = document.getElementById("editPosY");
  const sliderZoom = document.getElementById("editPosZoom");

  /* Load existing photo from S3 */
  if (pet.photo) {
    try { preview.src = await getSignedUrl(pet.photo); }
    catch (_) { preview.src = "/images/default-pet.png"; }
    const z0        = Number(existingZoom);
    const overhang0 = z0 - 100;
    const left0     = -(overhang0 * (Number(posX) / 100));
    const top0      = -(overhang0 * (Number(posY) / 100));
    preview.style.width  = `${z0}%`;
    preview.style.height = `${z0}%`;
    preview.style.left   = `${left0}%`;
    preview.style.top    = `${top0}%`;
  }

  /* Slider → update preview */
  const updatePos = () => {
    const z        = Number(sliderZoom.value); // 100–200
    const overhang = z - 100;
    const left     = -(overhang * (sliderX.value / 100));
    const top      = -(overhang * (sliderY.value / 100));
    preview.style.width  = `${z}%`;
    preview.style.height = `${z}%`;
    preview.style.left   = `${left}%`;
    preview.style.top    = `${top}%`;
    form.dataset.photoPos  = `${sliderX.value}% ${sliderY.value}%`;
    form.dataset.photoZoom = z;
  };
  sliderX.addEventListener("input", updatePos);
  sliderY.addEventListener("input", updatePos);
  sliderZoom.addEventListener("input", updatePos);

  /* New photo chosen */
  photoInput.addEventListener("change", async e => {
    errorEl.style.display = "none";
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file, "image");
    if (err) { errorEl.textContent = err; errorEl.style.display = "block"; e.target.value = ""; return; }

    preview.src = URL.createObjectURL(file);
    cropDiv.style.display = "block";

    try {
      const key = await uploadToS3(file, "/api/upload/pet-photo");
      form.dataset.newPhoto = key;
    } catch (err) {
      errorEl.textContent = "Upload failed: " + err.message;
      errorEl.style.display = "block";
      e.target.value = "";
      delete form.dataset.newPhoto;
    }
  });

  /* Submit */
  form.onsubmit = async ev => {
    ev.preventDefault();
    const body = {
      name:               form.name.value,
      breed:              form.breed.value,
      age:                form.age.value,
      gender:             form.gender.value,
      lastAntiRabiesShot: form.lastAntiRabiesShot.value,
    };
    if (form.dataset.newPhoto) body.photo = form.dataset.newPhoto;
    /* always send position + zoom so sliders work even without a new photo upload */
    body.photoPosition = `${sliderX.value}% ${sliderY.value}%`;
    body.photoZoom     = sliderZoom.value;

    try {
      const res    = await fetch(`/api/pets/${petId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.success) { alert(result.message); loadPets(); }
      else alert(result.message);
    } catch (err) { console.error(err); alert("Error updating pet"); }
  };
}

/* ===============================
   BOOKINGS SECTION
================================ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>My Bookings</h2>

    <!-- Type tabs: Grooming / Hotel -->
    <div class="booking-tabs">
      <button class="tab-btn active" data-type="grooming">Grooming</button>
      <button class="tab-btn" data-type="hotel">Pet Hotel</button>
    </div>

    <!-- Status filter row -->
    <div class="status-tabs">
      <button class="status-tab-btn active" data-status="all">All</button>
      <button class="status-tab-btn" data-status="pending">Pending</button>
      <button class="status-tab-btn" data-status="approved">Approved</button>
      <button class="status-tab-btn" data-status="rejected">Rejected</button>
    </div>

    <div id="bookingsContent"><p>Loading bookings...</p></div>
  `;

  let currentType   = "grooming";
  let currentStatus = "all";
  const bookingsContent = document.getElementById("bookingsContent");

  const loadBookings = async (type, status) => {
    bookingsContent.innerHTML = "<p>Loading...</p>";
    try {
      const res  = await fetch(`/api/bookings?type=${type}`);
      const data = await res.json();

      if (!data.success) { bookingsContent.innerHTML = `<p>Error: ${data.message}</p>`; return; }

      let bookings = data.bookings || [];
      if (status !== "all") bookings = bookings.filter(b => b.status === status);

      /* refresh badge whenever bookings are loaded */
      pollBookingBadge();

      let html = `
        <button id="newBookingBtn" class="user-link" style="margin-bottom:15px;">
          + New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking
        </button>
      `;

      if (bookings.length > 0) {
        html += `<div class="bookings-grid">`;
        bookings.forEach(b => {
          const rejectReasonHtml = b.status === "rejected" && b.rejectReason
            ? `<p class="booking-reject-reason"><strong>Reason:</strong> ${b.rejectReason}</p>` : "";

          html += `
            <div class="booking-card">
              <div class="booking-card-header">
                <p><strong>Pets:</strong> ${b.pets.map(p => p.name).join(", ")}</p>
                ${type === "grooming" && b.services ? `<p><strong>Services:</strong> ${Array.isArray(b.services) ? b.services.join(", ") : b.services}</p>` : ""}
              </div>
              <div class="booking-card-datetime">
                <p><strong>Date:</strong> ${new Date(b.appointmentDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${b.appointmentTime || "N/A"}</p>
                ${type === "hotel" ? `<p><strong>Checkout:</strong> ${b.hotelCheckoutDate ? new Date(b.hotelCheckoutDate).toLocaleDateString() : "N/A"} ${b.hotelCheckoutTime || ""}</p>` : ""}
              </div>
              <p style="text-align:center; margin:10px 0;">
                <span class="booking-status ${b.status}">${b.status.toUpperCase()}</span>
              </p>
              ${rejectReasonHtml}
              <div class="booking-actions">
                <button class="deleteBookingBtn" data-id="${b._id}">Delete</button>
              </div>
            </div>`;
        });
        html += `</div>`;
      } else {
        html += `<p>No ${status !== "all" ? status + " " : ""}bookings found.</p>`;
      }

      bookingsContent.innerHTML = html;

      document.getElementById("newBookingBtn").onclick = () => showBookingForm(type);

      document.querySelectorAll(".deleteBookingBtn").forEach(btn => {
        btn.onclick = async () => {
          if (!confirm("Delete this booking?")) return;
          try {
            const res    = await fetch(`/api/bookings/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) { alert(result.message); loadBookings(currentType, currentStatus); }
            else alert(result.message);
          } catch (err) { console.error(err); alert("Error deleting booking"); }
        };
      });
    } catch (err) {
      console.error(err);
      bookingsContent.innerHTML = "<p>Error loading bookings.</p>";
    }
  };

  /* Type tab clicks */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentType = btn.dataset.type;
      loadBookings(currentType, currentStatus);
    };
  });

  /* Status filter clicks */
  document.querySelectorAll(".status-tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".status-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentStatus = btn.dataset.status;
      loadBookings(currentType, currentStatus);
    };
  });

  loadBookings("grooming", "all");
}

/* ===============================
   AVAILABLE SLOTS HELPER
================================ */
async function fetchAvailableSlots(date, type) {
  try {
    const res  = await fetch(`/api/bookings/available-slots?date=${date}&type=${type}`);
    const data = await res.json();
    if (data.success) return data.slots;
    return [];
  } catch (err) { console.error("Error fetching slots:", err); return []; }
}

function buildTimeSelect(slots, name, required = true) {
  const reqAttr = required ? "required" : "";
  if (!slots.length) return `<select name="${name}" ${reqAttr} disabled><option value="">No slots available for this date</option></select>`;
  const options = slots.map(s =>
    s.available
      ? `<option value="${s.time}">${s.time}</option>`
      : `<option value="" disabled>${s.time} — already booked</option>`
  ).join("");
  const hasAvailable = slots.some(s => s.available);
  return `<select name="${name}" ${reqAttr} ${!hasAvailable ? "disabled" : ""}><option value="">Select time</option>${options}</select>`;
}

/* ===============================
   BOOKING FORM
================================ */
async function showBookingForm(type) {
  try {
    const petsRes  = await fetch("/api/pets");
    const petsData = await petsRes.json();

    if (!petsData.success) { alert("Error loading pets: " + petsData.message); return; }
    if (!petsData.pets || petsData.pets.length === 0) {
      alert("Please add a pet first before creating a booking.");
      document.querySelector('[data-section="pets"]').click();
      return;
    }

    window.petsData = petsData.pets;

    let petOptions = `<option value="">Select pet</option>`;
    petsData.pets.forEach(p => {
      petOptions += `<option value="${p._id}" data-rabies="${p.lastAntiRabiesShot || ""}">${p.name} (${p.breed})</option>`;
    });

    const todayStr = new Date().toISOString().split("T")[0];

    let groomingServicesHTML = "";
    if (type === "grooming") {
      groomingServicesHTML = `
        <div class="service-section">
          <h4>Select Main Grooming Service</h4>
          <div class="main-service-options">
            <div class="service-option"><input type="radio" id="fullGroom" name="mainService" value="Full Groom" required><label for="fullGroom">Full Groom</label></div>
            <div class="service-option"><input type="radio" id="bathBlowdry" name="mainService" value="Bath and Blowdry"><label for="bathBlowdry">Bath and Blowdry</label></div>
          </div>
        </div>
        <div class="addon-toggle-container">
          <button type="button" id="toggleAddonsBtn" class="toggle-addons-btn">+ Add Optional Services</button>
          <div id="addonServicesSection" class="addon-services-section" style="display:none;">
            <h4>Select Additional Services:</h4>
            <div class="addon-services-grid">
              <div class="service-option"><input type="checkbox" id="nailTrim"      name="addonServices" value="Nail Trim"><label for="nailTrim">Nail Cut/Nail Trim</label></div>
              <div class="service-option"><input type="checkbox" id="earCleaning"   name="addonServices" value="Ear Cleaning"><label for="earCleaning">Ear Cleaning and Hair Removal</label></div>
              <div class="service-option"><input type="checkbox" id="hairTrim"      name="addonServices" value="Hair Trim"><label for="hairTrim">Hair Trim</label></div>
              <div class="service-option"><input type="checkbox" id="poodleFeet"    name="addonServices" value="Poodle Feet"><label for="poodleFeet">Poodle Feet</label></div>
              <div class="service-option"><input type="checkbox" id="tearStain"     name="addonServices" value="Tear Stain Removal"><label for="tearStain">Tear Stain Removal</label></div>
              <div class="service-option"><input type="checkbox" id="teethCleaning" name="addonServices" value="Teeth Cleaning"><label for="teethCleaning">Teeth Cleaning</label></div>
              <div class="service-option"><input type="checkbox" id="dematting"     name="addonServices" value="Dematting"><label for="dematting">Dematting</label></div>
              <div class="service-option"><input type="checkbox" id="analSac"       name="addonServices" value="Anal Sac Draining"><label for="analSac">Anal Sac Draining</label></div>
            </div>
          </div>
        </div>`;
    }

    const dateTimeHTML = type === "grooming"
      ? `<label>Appointment Date:</label>
         <input type="date" name="appointmentDate" id="appointmentDate" min="${todayStr}" required />
         <label>Appointment Time:</label>
         <div id="timeSlotWrap"><select name="appointmentTime" disabled><option value="">Select a date first</option></select></div>
         <p id="timeSlotNote" class="slot-note" style="display:none;"></p>`
      : `<label>Check-in Date:</label>
         <input type="date" name="appointmentDate" id="appointmentDate" min="${todayStr}" required />
         <label>Check-in Time:</label>
         <input type="time" name="appointmentTime" required />
         <label>Checkout Date:</label>
         <input type="date" name="hotelCheckoutDate" min="${todayStr}" required />
         <label>Checkout Time:</label>
         <input type="time" name="hotelCheckoutTime" required />`;

    document.getElementById("bookingsContent").innerHTML = `
      <h3>New ${type === "grooming" ? "Grooming" : "Pet Hotel"} Booking</h3>
      <form id="bookingForm">
        <div id="petsBookingContainer">
          <label>Select Pet:</label>
          <select class="booking-pet" required>${petOptions}</select>
          <div class="pet-rabies-info" style="display:none;">
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
      </form>`;

    if (type === "grooming") {
      const dateInput = document.getElementById("appointmentDate");
      const timeWrap  = document.getElementById("timeSlotWrap");
      const noteEl    = document.getElementById("timeSlotNote");
      dateInput.addEventListener("change", async () => {
        if (!dateInput.value) return;
        timeWrap.innerHTML = `<select name="appointmentTime" disabled><option>Loading...</option></select>`;
        noteEl.style.display = "none";
        const slots = await fetchAvailableSlots(dateInput.value, type);
        timeWrap.innerHTML = buildTimeSelect(slots, "appointmentTime", true);
        const hasAvailable = slots.some(s => s.available);
        if (!hasAvailable) {
          noteEl.textContent = slots.length > 0 && slots.every(s => !s.available)
            ? "All time slots for this date are fully booked."
            : "No available time slots for this date. Slots require at least 3 hours advance notice.";
          noteEl.style.display = "block";
        } else noteEl.style.display = "none";
      });
    }

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

    const updateRabiesInfo = sel => {
      const container = sel.closest("#petsBookingContainer") || sel.parentElement;
      const infoDiv   = container.querySelector(".pet-rabies-info");
      const span      = container.querySelector(".rabies-date");
      if (sel.value) {
        const opt = sel.options[sel.selectedIndex];
        span.textContent = opt.dataset.rabies ? new Date(opt.dataset.rabies).toLocaleDateString() : "Not set";
        infoDiv.style.display = "block";
      } else infoDiv.style.display = "none";
    };

    document.querySelector(".booking-pet").addEventListener("change", function () { updateRabiesInfo(this); });
    document.getElementById("cancelBooking").onclick = () => loadBookingsSection();

    document.getElementById("addAnotherPet").onchange = e => {
      if (e.target.checked) {
        const container = document.getElementById("petsBookingContainer");
        const newSel = document.createElement("select");
        newSel.className = "booking-pet"; newSel.required = true;
        newSel.innerHTML = petOptions; newSel.style.marginTop = "10px";
        const newInfo = document.createElement("div");
        newInfo.className = "pet-rabies-info"; newInfo.style.display = "none";
        newInfo.innerHTML = '<strong>Last Anti-Rabies Shot:</strong> <span class="rabies-date"></span>';
        container.appendChild(newSel); container.appendChild(newInfo);
        newSel.addEventListener("change", function () { updateRabiesInfo(this); });
      } else {
        const selects  = document.querySelectorAll(".booking-pet");
        const infoDivs = document.querySelectorAll(".pet-rabies-info");
        if (selects.length > 1) { selects[selects.length - 1].remove(); infoDivs[infoDivs.length - 1].remove(); }
      }
    };

    document.getElementById("bookingForm").onsubmit = async e => {
      e.preventDefault();
      const pets = [...document.querySelectorAll(".booking-pet")].map(s => s.value).filter(Boolean);
      if (pets.length === 0) { alert("Please select at least one pet"); return; }
      let services = null;
      if (type === "grooming") {
        const mainService = document.querySelector('input[name="mainService"]:checked')?.value;
        if (!mainService) { alert("Please select a main grooming service"); return; }
        services = [mainService, ...[...document.querySelectorAll('input[name="addonServices"]:checked')].map(cb => cb.value)];
      }
      showBookingConfirmation(type, pets, services, e.target);
    };
  } catch (err) { console.error(err); alert("Error loading booking form"); }
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
          <li>✓ Prices may vary depending on pet size, fur length and condition, and selected services</li>
          <li>✓ Final pricing will be confirmed at the shop</li>
          <li>✓ Please arrive on time for your appointment</li>
        </ul>
      </div>
      <p style="text-align:center; margin-top:15px; font-weight:600;">Do you understand and wish to proceed with the booking?</p>
      <div class="confirmation-buttons">
        <button class="confirm-yes">Yes, I Understand</button>
        <button class="confirm-no">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".confirm-yes").onclick = async () => { modal.remove(); await submitBooking(type, pets, services, form); };
  modal.querySelector(".confirm-no").onclick  = () => modal.remove();
}

/* ===============================
   SUBMIT BOOKING
================================ */
async function submitBooking(type, pets, services, form) {
  const formData = {
    type, pets, services,
    appointmentDate:   form.appointmentDate?.value,
    appointmentTime:   form.appointmentTime?.value,
    hotelCheckoutDate: form.hotelCheckoutDate?.value,
    hotelCheckoutTime: form.hotelCheckoutTime?.value,
  };
  try {
    const res    = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    const result = await res.json();
    if (result.success) { alert(result.message); loadBookingsSection(); }
    else alert(result.message);
  } catch (err) { console.error(err); alert("Error creating booking"); }
}