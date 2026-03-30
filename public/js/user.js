const sidebarLinks = document.querySelectorAll(".sidebar-link[data-section]");
const content      = document.getElementById("dashboardContent");

/* ═══════════════════════════════════════════════════════
   UNIVERSAL TOAST  –  showToast(msg, type, duration)
   type: "success" | "error" | "info" | "warning"
════════════════════════════════════════════════════════ */
function showToast(msg, type = "success", duration = 3200) {
  const ICONS = { success:"✅", error:"❌", info:"ℹ️", warning:"⚠️" };
  const COLORS = {
    success: { bg:"#d1fae5", border:"#6ee7b7", text:"#065f46" },
    error:   { bg:"#fee2e2", border:"#fca5a5", text:"#991b1b" },
    info:    { bg:"#dbeafe", border:"#93c5fd", text:"#1e40af" },
    warning: { bg:"#fef3c7", border:"#fcd34d", text:"#92400e" },
  };
  const c = COLORS[type] || COLORS.info;

  // Stack toasts vertically
  const existing = document.querySelectorAll(".hp-toast");
  const offset   = 24 + existing.length * 68;

  const t = document.createElement("div");
  t.className = "hp-toast";
  t.style.cssText = `
    position:fixed;bottom:${offset}px;right:24px;z-index:99999;
    display:flex;align-items:center;gap:10px;
    background:${c.bg};border:1.5px solid ${c.border};color:${c.text};
    padding:13px 18px;border-radius:12px;font-size:0.9rem;font-weight:600;
    box-shadow:0 6px 20px rgba(0,0,0,0.12);max-width:340px;
    animation:toastIn .28s cubic-bezier(.34,1.56,.64,1) both;
    font-family:"Segoe UI",Tahoma,sans-serif;
  `;
  t.innerHTML = `<span style="font-size:1.1rem;flex-shrink:0;">${ICONS[type]}</span><span>${msg}</span>`;

  if (!document.getElementById("toastStyle")) {
    const s = document.createElement("style");
    s.id = "toastStyle";
    s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes toastOut{to{opacity:0;transform:translateY(12px) scale(.95)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(t);
  setTimeout(() => {
    t.style.animation = "toastOut .25s ease forwards";
    setTimeout(() => t.remove(), 260);
  }, duration);
}

/* ═══════════════════════════════════════════════════════
   UNIVERSAL CONFIRM MODAL  –  showConfirm(options)
   returns Promise<boolean>
   options: { title, message, confirmText, cancelText, danger }
════════════════════════════════════════════════════════ */
function showConfirm({ title = "Are you sure?", message = "", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
  return new Promise(resolve => {
    document.getElementById("hpConfirmModal")?.remove();
    const el = document.createElement("div");
    el.id = "hpConfirmModal";
    el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:statFadeIn .18s ease;font-family:'Segoe UI',Tahoma,sans-serif;";
    const btnColor = danger ? "background:#d44d7c;color:#fff;" : "background:#1870c7;color:#fff;";
    el.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:28px 26px;max-width:380px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.18);animation:statSlideUp .22s ease;">
        <h3 style="font-size:1.1rem;font-weight:700;color:#222;margin:0 0 8px;">${title}</h3>
        ${message ? `<p style="font-size:0.88rem;color:#666;margin:0 0 22px;line-height:1.55;">${message}</p>` : `<div style="margin-bottom:22px;"></div>`}
        <div style="display:flex;gap:10px;">
          <button id="hpConfirmYes" style="flex:1;padding:11px 0;border:none;border-radius:30px;${btnColor}font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;">${confirmText}</button>
          <button id="hpConfirmNo"  style="flex:1;padding:11px 0;border:2px solid #e0e0e0;border-radius:30px;background:none;color:#777;font-weight:600;font-size:0.95rem;cursor:pointer;font-family:inherit;">${cancelText}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    const done = v => { el.remove(); document.body.style.overflow = ""; resolve(v); };
    document.getElementById("hpConfirmYes").onclick = () => done(true);
    document.getElementById("hpConfirmNo").onclick  = () => done(false);
    el.addEventListener("click", e => { if (e.target === el) done(false); });
  });
}

/* ═══════════════════════════════════════════════════════
   MOBILE SIDEBAR TOGGLE
════════════════════════════════════════════════════════ */
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
  sidebarLinks.forEach(link => {
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

/* ═══════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
════════════════════════════════════════════════════════ */
sidebarLinks.forEach(link => {
  link.addEventListener("click", () => {
    sidebarLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    const s = link.dataset.section;
    if (s === "profile")  loadProfile();
    if (s === "pets")     loadPets();
    if (s === "bookings") loadBookingsSection();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  pollBookingBadge();
  setInterval(pollBookingBadge, 60000);
  initFeedbackFAB();

  /* Intercept logout */
  document.querySelectorAll(".logout-btn, [href='/logout'], form[action='/logout'] button").forEach(el => {
    el.addEventListener("click", async e => {
      e.preventDefault();
      const ok = await showConfirm({ title: "Log Out?", message: "Are you sure you want to log out of your account?", confirmText: "Yes, Log Out", cancelText: "Stay", danger: true });
      if (!ok) return;
      fetch("/logout", { method: "POST" }).then(() => window.location.href = "/").catch(() => window.location.href = "/");
    });
  });
});

/* ═══════════════════════════════════════════════════════
   BOOKING BADGE POLL
════════════════════════════════════════════════════════ */
async function pollBookingBadge() {
  try {
    const [g, h] = await Promise.all([
      fetch("/api/bookings?type=grooming").then(r => r.json()),
      fetch("/api/bookings?type=hotel").then(r => r.json()),
    ]);
    const pendingCount = [...(g.bookings || []), ...(h.bookings || [])].filter(b => b.status === "pending").length;
    const link = document.querySelector('[data-section="bookings"]');
    if (!link) return;
    let badge = link.querySelector(".notification-badge");
    if (pendingCount > 0) {
      if (!badge) { badge = document.createElement("span"); badge.className = "notification-badge"; link.appendChild(badge); }
      badge.textContent = pendingCount; badge.style.display = "inline-flex";
    } else if (badge) badge.style.display = "none";
  } catch (_) {}
}

/* ═══════════════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════════════════ */
async function loadProfile() {
  content.innerHTML = `<h2>Profile</h2><p>Loading...</p>`;
  try {
    const res  = await fetch("/api/user/profile");
    const data = await res.json();
    if (!data.success) { content.innerHTML = `<h2>Profile</h2><p>Error: ${data.message}</p>`; return; }
    const user   = data.user;
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}) : "—";

    content.innerHTML = `
      <h2>My Profile</h2>
      <div class="profile-section" id="profileViewSection">
        <div class="profile-avatar-row">
          <div class="profile-avatar-circle">${(user.fullName||"?").charAt(0).toUpperCase()}</div>
          <div><p class="profile-big-name">${user.fullName}</p><p class="profile-role-tag">Member</p></div>
        </div>
        <div class="profile-info-grid">
          <div class="profile-info-item"><span class="profile-info-label">Email</span><span class="profile-info-value">${user.email}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Full Name</span><span class="profile-info-value">${user.fullName}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Contact</span><span class="profile-info-value">${user.contact||"—"}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Address</span><span class="profile-info-value">${user.address||"—"}</span></div>
          <div class="profile-info-item"><span class="profile-info-label">Member Since</span><span class="profile-info-value">${joined}</span></div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
          <button id="editProfileBtn" class="user-link">Edit Profile</button>
          <button id="changePasswordBtn" class="user-link" style="background:#6c757d;">Change Password</button>
        </div>
      </div>

      <div id="editProfileFormWrap" style="display:none;margin-top:20px;">
        <h3 style="color:#d44d7c;margin-bottom:16px;">Edit Profile</h3>
        <div class="admin-form-box" style="max-width:500px;">
          <label class="admin-form-label">Full Name<input type="text" id="epName" value="${user.fullName}" class="admin-form-input"/></label>
          <label class="admin-form-label">Contact Number<input type="text" id="epContact" value="${user.contact||""}" class="admin-form-input"/></label>
          <label class="admin-form-label">Address (Optional)<input type="text" id="epAddress" value="${user.address||""}" class="admin-form-input"/></label>
          <div class="admin-form-btns">
            <button class="btn" id="saveProfileBtn">Save Changes</button>
            <button class="btn" id="cancelProfileBtn" style="background:#6c757d;">Cancel</button>
          </div>
          <p id="profileMsg" class="admin-form-msg"></p>
        </div>
      </div>

      <div id="changePasswordFormWrap" style="display:none;margin-top:20px;">
        <h3 style="color:#d44d7c;margin-bottom:16px;">Change Password</h3>
        <div class="admin-form-box" style="max-width:500px;">
          <label class="admin-form-label">Current Password<input type="password" id="cpCurrent" class="admin-form-input"/></label>
          <label class="admin-form-label">New Password<input type="password" id="cpNew" class="admin-form-input"/></label>
          <label class="admin-form-label">Confirm New Password<input type="password" id="cpConfirm" class="admin-form-input"/></label>
          <div style="font-size:12px;color:#666;margin:4px 0 8px;">Must have 8+ chars, one uppercase, one lowercase, one number.</div>
          <div class="admin-form-btns">
            <button class="btn" id="savePassBtn">Update Password</button>
            <button class="btn" id="cancelPassBtn" style="background:#6c757d;">Cancel</button>
          </div>
          <p id="passMsg" class="admin-form-msg"></p>
        </div>
      </div>`;

    document.getElementById("editProfileBtn").onclick = () => { document.getElementById("profileViewSection").style.display="none"; document.getElementById("editProfileFormWrap").style.display="block"; document.getElementById("changePasswordFormWrap").style.display="none"; };
    document.getElementById("cancelProfileBtn").onclick = () => { document.getElementById("profileViewSection").style.display="block"; document.getElementById("editProfileFormWrap").style.display="none"; };
    document.getElementById("saveProfileBtn").onclick = async () => {
      const msg = document.getElementById("profileMsg");
      const body = { fullName: document.getElementById("epName").value.trim(), contact: document.getElementById("epContact").value.trim(), address: document.getElementById("epAddress").value.trim() };
      try {
        const r = await fetch("/api/user/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        const d = await r.json();
        if (d.success) { showToast(d.message||"Profile updated!"); loadProfile(); }
        else { msg.textContent = d.message; msg.style.display = "block"; }
      } catch { msg.textContent = "Error saving profile."; msg.style.display = "block"; }
    };

    document.getElementById("changePasswordBtn").onclick = () => { document.getElementById("profileViewSection").style.display="none"; document.getElementById("editProfileFormWrap").style.display="none"; document.getElementById("changePasswordFormWrap").style.display="block"; };
    document.getElementById("cancelPassBtn").onclick = () => { document.getElementById("profileViewSection").style.display="block"; document.getElementById("changePasswordFormWrap").style.display="none"; };
    document.getElementById("savePassBtn").onclick = async () => {
      const msg = document.getElementById("passMsg");
      const current = document.getElementById("cpCurrent").value;
      const newPass = document.getElementById("cpNew").value;
      const confirm = document.getElementById("cpConfirm").value;
      if (newPass !== confirm) { msg.textContent="Passwords do not match."; msg.style.display="block"; return; }
      try {
        const r = await fetch("/api/user/change-password",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:current,newPassword:newPass,confirmNewPassword:confirm})});
        const d = await r.json();
        if (d.success) { showToast(d.message||"Password updated!"); loadProfile(); }
        else { msg.textContent = d.message; msg.style.display = "block"; }
      } catch { msg.textContent = "Error updating password."; msg.style.display = "block"; }
    };
  } catch { content.innerHTML = `<h2>Profile</h2><p>Error loading profile.</p>`; }
}

/* ═══════════════════════════════════════════════════════
   DELEGATED CLICK HANDLER (content area)
════════════════════════════════════════════════════════ */
content.onclick = async e => {
  if (e.target.id === "addPetBtn") { showAddPetForm(); return; }

  if (e.target.classList.contains("deletePetBtn")) {
    const card  = e.target.closest(".pet-card");
    const petId = card?.dataset.id;
    if (!petId) return;
    const ok = await showConfirm({ title:"Delete Pet?", message:"This will permanently remove this pet from your account.", confirmText:"Yes, Delete", cancelText:"Keep", danger:true });
    if (!ok) return;
    try {
      const r = await fetch(`/api/pets/${petId}`,{method:"DELETE"});
      const d = await r.json();
      if (d.success) { showToast(d.message||"Pet deleted."); loadPets(); }
      else showToast(d.message||"Failed to delete pet.","error");
    } catch { showToast("Error deleting pet.","error"); }
    return;
  }

  if (e.target.classList.contains("editPetBtn")) {
    const card  = e.target.closest(".pet-card");
    const petId = card?.dataset.id;
    if (!petId) return;
    try {
      const r = await fetch(`/api/pets/${petId}`);
      const d = await r.json();
      if (d.success) showEditPetForm(d.pet, petId);
      else showToast("Error loading pet data.","error");
    } catch { showToast("Error loading pet data.","error"); }
    return;
  }

  if (e.target.id === "cancelEditPet") { loadPets(); return; }
};

/* ═══════════════════════════════════════════════════════
   PETS
════════════════════════════════════════════════════════ */
function loadPets() {
  content.innerHTML = `<h2>My Pets</h2><p>Loading...</p>`;
  fetch("/api/pets").then(r=>r.json()).then(data => {
    if (!data.success) { content.innerHTML=`<h2>My Pets</h2><p>Error: ${data.message}</p>`; return; }

    let html = `<h2>My Pets</h2><button id="addPetBtn" class="user-link" style="margin-bottom:20px;">+ Add Pet</button>`;

    if (data.pets?.length) {
      html += `<div class="pets-grid">`;
      data.pets.forEach(p => {
        const bgColor    = p.gender==="female" ? 'style="background-color:#ffc0cb;"' : p.gender==="male" ? 'style="background-color:#1870c7;color:white;"' : "";
        const rabiesDate = p.lastAntiRabiesShot ? new Date(p.lastAntiRabiesShot).toLocaleDateString() : "Not set";
        const vetCardLink = p.vetCard ? `<p><strong>💉 Vet Card:</strong> <a href="#" class="view-vet-btn" data-key="${p.vetCard}" style="color:#1870c7;font-size:0.82rem;">View file</a></p>` : "";
        const zoom   = Number(p.photoZoom||100);
        const posXV  = p.photoPosition ? parseFloat(p.photoPosition.split(" ")[0]) : 50;
        const posYV  = p.photoPosition ? parseFloat(p.photoPosition.split(" ")[1]) : 50;
        const ov     = zoom-100;
        html += `
          <div class="pet-card" data-id="${p._id}" ${bgColor}>
            <div class="pet-photo-wrap">
              <img class="pet-photo" src="${p.photo?"":"/images/default-pet.png"}" alt="${p.name}"
                data-s3key="${p.photo||""}" style="width:${zoom}%;height:${zoom}%;left:${-(ov*(posXV/100))}%;top:${-(ov*(posYV/100))}%;"
                onerror="this.src='/images/default-pet.png'" />
            </div>
            <h3>${p.name}</h3>
            <p><strong>Breed:</strong> ${p.breed}</p>
            <p><strong>Age:</strong> ${p.age}</p>
            <p><strong>Gender:</strong> ${p.gender?p.gender.charAt(0).toUpperCase()+p.gender.slice(1):"N/A"}</p>
            <p><strong>Last Anti-Rabies:</strong> ${rabiesDate}</p>
            ${vetCardLink}
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

    document.querySelectorAll(".pet-photo[data-s3key]").forEach(async img => {
      const key = img.dataset.s3key; if (!key) return;
      try { img.src = await getSignedUrl(key); } catch { img.src="/images/default-pet.png"; }
    });
    document.querySelectorAll(".view-vet-btn").forEach(link => {
      link.addEventListener("click", async e => {
        e.preventDefault();
        try { window.open(await getSignedUrl(link.dataset.key),"_blank"); }
        catch { showToast("Could not load vet card.","error"); }
      });
    });
  }).catch(() => { content.innerHTML=`<h2>My Pets</h2><p>Error loading pets.</p>`; });
}

/* ═══════════════════════════════════════════════════════
   ADD PET FORM
════════════════════════════════════════════════════════ */
function showAddPetForm() {
  content.innerHTML = `
    <h2>Add Pet</h2>
    <form id="addPetForm" style="max-width:500px;">
      <label>Name</label><input name="name" placeholder="Enter pet name" required>
      <label>Breed</label><input name="breed" placeholder="Enter breed" required>
      <label>Age</label><input name="age" type="number" placeholder="Enter age" min="0" required>
      <label>Gender</label>
      <select name="gender" required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <label>Last Anti-Rabies Shot <span style="font-size:0.78rem;font-weight:400;color:#aaa;">(required)</span></label>
      <input name="lastAntiRabiesShot" type="date" required>

      <label style="margin-top:12px;">Vaccine / Vet Card <span style="font-size:0.78rem;font-weight:400;color:#aaa;">(photo or PDF — optional)</span></label>
      <div id="vetUploadArea" class="bk-vet-upload"
  ondragover="event.preventDefault();this.classList.add('drag-over')"
  ondragleave="this.classList.remove('drag-over')"
  ondrop="handleVetDrop(event)">
        <input type="file" id="vetCardInput" accept="image/jpeg,image/png,image/webp,application/pdf"/>
        <div class="bk-vet-icon">💉</div>
        <div>Click to upload or drag &amp; drop</div>
        <div style="font-size:0.75rem;margin-top:3px;">JPG, PNG, WEBP or PDF · max 10MB</div>
      </div>
      <div class="bk-vet-preview" id="vetPreview"><span id="vetFileName">file.pdf</span><button type="button" class="bk-vet-remove" id="vetRemoveBtn" title="Remove">✕</button></div>
      <p id="vetUploadError" style="color:#d44d7c;font-size:0.82rem;display:none;margin-top:4px;"></p>

      <label style="margin-top:12px;">Pet Photo <span style="font-size:0.78rem;font-weight:400;color:#aaa;">(optional)</span></label>
      <input type="file" id="petPhotoInput" accept="image/jpeg,image/png,image/webp"/>
      <div id="petPhotoPreviewWrap" style="display:none;margin-top:10px;">
        <div class="pet-photo-wrap" style="margin-bottom:10px;"><img id="petPhotoPreview" src="" alt="Preview" class="pet-photo"/></div>
        <label style="font-size:0.85rem;font-weight:600;color:#555;margin-bottom:4px;display:block;">Adjust photo position in circle</label>
        <div class="photo-pos-sliders">
          <div class="photo-pos-row"><span>⬅ Left / Right ➡</span><input type="range" id="photoPosX" min="0" max="100" value="50"/></div>
          <div class="photo-pos-row"><span>⬆ Up / Down ⬇</span><input type="range" id="photoPosY" min="0" max="100" value="50"/></div>
          <div class="photo-pos-row"><span>🔍 Zoom</span><input type="range" id="photoZoom" min="100" max="200" value="100"/></div>
        </div>
      </div>
      <p id="petPhotoError" style="color:#d44d7c;font-size:0.85rem;display:none;"></p>

      <div class="form-buttons" style="margin-top:16px;">
        <button class="user-link" type="submit">Add Pet</button>
        <button type="button" id="cancelAdd" class="logout-btn">Cancel</button>
      </div>
    </form>`;

  document.getElementById("cancelAdd").onclick = loadPets;

  /* Vet card */
  let vetFile = null;
  const vetInput   = document.getElementById("vetCardInput");
  const vetPreview = document.getElementById("vetPreview");
  const vetName    = document.getElementById("vetFileName");
  const vetErrEl   = document.getElementById("vetUploadError");
  const vetArea    = document.getElementById("vetUploadArea");

  vetArea.addEventListener("click", () => {
      vetInput.click();
  });

  function setVetFile(file) {
    if (!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)) { vetErrEl.textContent="Only JPG, PNG, WEBP or PDF allowed."; vetErrEl.style.display="block"; return; }
    if (file.size>10*1024*1024) { vetErrEl.textContent="File too large. Max 10MB."; vetErrEl.style.display="block"; return; }
    vetFile=file; vetErrEl.style.display="none"; vetName.textContent=file.name; vetPreview.classList.add("show"); vetArea.style.display="none";
  }
  vetInput.addEventListener("change", e => { if (e.target.files[0]) setVetFile(e.target.files[0]); });
  document.getElementById("vetRemoveBtn").onclick = () => { vetFile=null; vetInput.value=""; vetPreview.classList.remove("show"); vetArea.style.display=""; };
  window.handleVetDrop = e => { e.preventDefault(); vetArea.classList.remove("drag-over"); if (e.dataTransfer.files[0]) setVetFile(e.dataTransfer.files[0]); };

  /* Photo */
  const photoInput  = document.getElementById("petPhotoInput");
  const previewWrap = document.getElementById("petPhotoPreviewWrap");
  const previewImg  = document.getElementById("petPhotoPreview");
  const errorEl     = document.getElementById("petPhotoError");
  const posX        = document.getElementById("photoPosX");
  const posY        = document.getElementById("photoPosY");
  const posZoom     = document.getElementById("photoZoom");

  photoInput.addEventListener("change", e => {
    errorEl.style.display="none";
    const file = e.target.files[0]; if (!file) return;
    const err = validateFile(file,"image");
    if (err) { errorEl.textContent=err; errorEl.style.display="block"; e.target.value=""; return; }
    previewImg.src=URL.createObjectURL(file); previewWrap.style.display="block";
  });
  const updatePos = () => {
    const z=Number(posZoom.value), ov=z-100;
    previewImg.style.width=`${z}%`; previewImg.style.height=`${z}%`;
    previewImg.style.left=`${-(ov*(posX.value/100))}%`; previewImg.style.top=`${-(ov*(posY.value/100))}%`;
  };
  posX.addEventListener("input",updatePos); posY.addEventListener("input",updatePos); posZoom.addEventListener("input",updatePos);

  document.getElementById("addPetForm").onsubmit = async e => {
    e.preventDefault();
    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true; submitBtn.textContent = "Saving...";

    let photoFileName = null;
    const photoFile = photoInput.files[0];
    if (photoFile) {
      try { photoFileName = await uploadToS3(photoFile,"/api/upload/pet-photo"); }
      catch (err) { showToast("Photo upload failed: "+err.message,"error"); submitBtn.disabled=false; submitBtn.textContent="Add Pet"; return; }
    }
    let vetCardFileName = null;
    if (vetFile) {
      try { vetCardFileName = await uploadToS3(vetFile,"/api/upload/vet-record"); }
      catch (err) { showToast("Vet card upload failed: "+err.message,"error"); submitBtn.disabled=false; submitBtn.textContent="Add Pet"; return; }
    }

    const body = {
      name: e.target.name.value, breed: e.target.breed.value,
      age: e.target.age.value, gender: e.target.gender.value,
      lastAntiRabiesShot: e.target.lastAntiRabiesShot.value,
      photo: photoFileName, vetCard: vetCardFileName,
      photoPosition: photoFileName ? `${posX.value}% ${posY.value}%` : null,
      photoZoom: photoFileName ? posZoom.value : null,
    };
    try {
      const r = await fetch("/api/pets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d = await r.json();
      if (d.success) { showToast(d.message||"Pet added successfully! 🐾"); loadPets(); }
      else { showToast(d.message||"Failed to add pet.","error"); submitBtn.disabled=false; submitBtn.textContent="Add Pet"; }
    } catch { showToast("Error adding pet.","error"); submitBtn.disabled=false; submitBtn.textContent="Add Pet"; }
  };
}

/* ═══════════════════════════════════════════════════════
   EDIT PET FORM
════════════════════════════════════════════════════════ */
async function showEditPetForm(pet, petId) {
  const rabiesDate   = pet.lastAntiRabiesShot ? new Date(pet.lastAntiRabiesShot).toISOString().split("T")[0] : "";
  const posX         = pet.photoPosition ? pet.photoPosition.split(" ")[0].replace("%","") : "50";
  const posY         = pet.photoPosition ? pet.photoPosition.split(" ")[1].replace("%","") : "50";
  const existingZoom = pet.photoZoom || 100;
  const hasPhoto     = !!pet.photo;

  content.innerHTML = `
    <h2>Edit Pet</h2>
    <form id="editPetForm" data-id="${petId}" style="max-width:500px;">
      <label>Name</label><input name="name" value="${pet.name}" required/>
      <label>Breed</label><input name="breed" value="${pet.breed}" required/>
      <label>Age</label><input name="age" type="number" value="${pet.age}" min="0" required/>
      <label>Gender</label>
      <select name="gender" required>
        <option value="">Select gender</option>
        <option value="male" ${pet.gender==="male"?"selected":""}>Male</option>
        <option value="female" ${pet.gender==="female"?"selected":""}>Female</option>
      </select>
      <label>Last Anti-Rabies Shot (Optional)</label>
      <input name="lastAntiRabiesShot" type="date" value="${rabiesDate}">

      <label style="margin-top:12px;">Vaccine / Vet Card <span style="font-size:0.78rem;font-weight:400;color:#aaa;">(photo or PDF — optional)</span></label>
      ${pet.vetCard ? `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#d1fae5;border-radius:8px;margin-bottom:6px;font-size:0.85rem;color:#065f46;">
        <span>📄 Current vet card on file</span>
        <a href="#" id="viewVetCardBtn" style="color:#1870c7;font-weight:600;">View</a>
        <label style="margin-left:auto;font-size:0.78rem;cursor:pointer;color:#991b1b;"><input type="checkbox" id="removeVetCard" style="margin-right:4px;"/>Remove</label>
      </div>` : ""}
      <div id="editVetUploadArea" class="bk-vet-upload" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleEditVetDrop(event)">
        <input type="file" id="editVetCardInput" accept="image/jpeg,image/png,image/webp,application/pdf"/>
        <div class="bk-vet-icon">💉</div>
        <div>${pet.vetCard?"Upload new vet card (replaces current)":"Click to upload or drag &amp; drop"}</div>
        <div style="font-size:0.75rem;margin-top:3px;">JPG, PNG, WEBP or PDF · max 10MB</div>
      </div>
      <div class="bk-vet-preview" id="editVetPreview"><span id="editVetFileName">file.pdf</span><button type="button" class="bk-vet-remove" id="editVetRemoveBtn" title="Remove">✕</button></div>
      <p id="editVetError" style="color:#d44d7c;font-size:0.82rem;display:none;margin-top:4px;"></p>

      <label style="margin-top:12px;">Pet Photo</label>
      <div class="pet-photo-wrap" style="margin-bottom:8px;">
        <img id="editPhotoPreview" class="pet-photo" src="/images/default-pet.png" alt="${pet.name}"/>
      </div>
      <input type="file" id="editPetPhotoInput" accept="image/jpeg,image/png,image/webp" style="margin-bottom:6px;"/>
      <p id="editPhotoError" style="color:#d44d7c;font-size:0.85rem;display:none;"></p>

      <div id="cropControls" style="display:${hasPhoto?"block":"none"};margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;color:#555;display:block;margin-bottom:4px;">Adjust photo position in circle</label>
        <div class="photo-pos-sliders">
          <div class="photo-pos-row"><span>⬅ Left / Right ➡</span><input type="range" id="editPosX" min="0" max="100" value="${posX}"/></div>
          <div class="photo-pos-row"><span>⬆ Up / Down ⬇</span><input type="range" id="editPosY" min="0" max="100" value="${posY}"/></div>
          <div class="photo-pos-row"><span>🔍 Zoom</span><input type="range" id="editPosZoom" min="100" max="200" value="${existingZoom}"/></div>
        </div>
      </div>

      <div class="form-buttons" style="margin-top:16px;">
        <button type="submit" class="user-link">Save Changes</button>
        <button type="button" id="cancelEditPet" class="logout-btn">Cancel</button>
      </div>
    </form>`;

  const form       = document.getElementById("editPetForm");
  const preview    = document.getElementById("editPhotoPreview");
  const photoInput = document.getElementById("editPetPhotoInput");
  const errorEl    = document.getElementById("editPhotoError");
  const cropDiv    = document.getElementById("cropControls");
  const sliderX    = document.getElementById("editPosX");
  const sliderY    = document.getElementById("editPosY");
  const sliderZoom = document.getElementById("editPosZoom");

  if (pet.photo) {
    try { preview.src = await getSignedUrl(pet.photo); } catch { preview.src="/images/default-pet.png"; }
    const z0=Number(existingZoom), ov0=z0-100;
    preview.style.width=`${z0}%`; preview.style.height=`${z0}%`;
    preview.style.left=`${-(ov0*(Number(posX)/100))}%`; preview.style.top=`${-(ov0*(Number(posY)/100))}%`;
  }

  const updatePos = () => {
    const z=Number(sliderZoom.value), ov=z-100;
    preview.style.width=`${z}%`; preview.style.height=`${z}%`;
    preview.style.left=`${-(ov*(sliderX.value/100))}%`; preview.style.top=`${-(ov*(sliderY.value/100))}%`;
    form.dataset.photoPos=`${sliderX.value}% ${sliderY.value}%`; form.dataset.photoZoom=z;
  };
  sliderX.addEventListener("input",updatePos); sliderY.addEventListener("input",updatePos); sliderZoom.addEventListener("input",updatePos);

  photoInput.addEventListener("change", async e => {
    errorEl.style.display="none";
    const file=e.target.files[0]; if (!file) return;
    const err=validateFile(file,"image");
    if (err) { errorEl.textContent=err; errorEl.style.display="block"; e.target.value=""; return; }
    preview.src=URL.createObjectURL(file); cropDiv.style.display="block";
    try { const key=await uploadToS3(file,"/api/upload/pet-photo"); form.dataset.newPhoto=key; }
    catch (err) { errorEl.textContent="Upload failed: "+err.message; errorEl.style.display="block"; e.target.value=""; delete form.dataset.newPhoto; }
  });

  /* Vet card edit */
  let editVetFile = null;
  const editVetInput   = document.getElementById("editVetCardInput");
  const editVetPreview = document.getElementById("editVetPreview");
  const editVetName    = document.getElementById("editVetFileName");
  const editVetErrEl   = document.getElementById("editVetError");
  const editVetArea    = document.getElementById("editVetUploadArea");

  editVetArea.addEventListener("click", () => {
      editVetInput.click();
  });

  if (pet.vetCard) {
    document.getElementById("viewVetCardBtn")?.addEventListener("click", async e => {
      e.preventDefault();
      try { window.open(await getSignedUrl(pet.vetCard),"_blank"); }
      catch { showToast("Could not load vet card.","error"); }
    });
  }
  function setEditVetFile(file) {
    if (!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)) { editVetErrEl.textContent="Only JPG, PNG, WEBP or PDF allowed."; editVetErrEl.style.display="block"; return; }
    if (file.size>10*1024*1024) { editVetErrEl.textContent="File too large. Max 10MB."; editVetErrEl.style.display="block"; return; }
    editVetFile=file; editVetErrEl.style.display="none"; editVetName.textContent=file.name; editVetPreview.classList.add("show"); editVetArea.style.display="none";
  }
  editVetInput?.addEventListener("change", e => { if (e.target.files[0]) setEditVetFile(e.target.files[0]); });
  document.getElementById("editVetRemoveBtn")?.addEventListener("click", () => { editVetFile=null; if(editVetInput)editVetInput.value=""; editVetPreview.classList.remove("show"); editVetArea.style.display=""; });
  window.handleEditVetDrop = e => { e.preventDefault(); editVetArea?.classList.remove("drag-over"); if (e.dataTransfer.files[0]) setEditVetFile(e.dataTransfer.files[0]); };

  form.onsubmit = async ev => {
    ev.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled=true; submitBtn.textContent="Saving...";

    const body = { name:form.name.value, breed:form.breed.value, age:form.age.value, gender:form.gender.value, lastAntiRabiesShot:form.lastAntiRabiesShot.value };
    if (form.dataset.newPhoto) body.photo=form.dataset.newPhoto;
    body.photoPosition=`${sliderX.value}% ${sliderY.value}%`;
    body.photoZoom=sliderZoom.value;

    if (editVetFile) {
      try { body.vetCard=await uploadToS3(editVetFile,"/api/upload/vet-record"); }
      catch (err) { showToast("Vet card upload failed: "+err.message,"error"); submitBtn.disabled=false; submitBtn.textContent="Save Changes"; return; }
    }
    if (document.getElementById("removeVetCard")?.checked) body.vetCard=null;

    try {
      const r=await fetch(`/api/pets/${petId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if (d.success) { showToast(d.message||"Pet updated!"); loadPets(); }
      else { showToast(d.message||"Failed to update.","error"); submitBtn.disabled=false; submitBtn.textContent="Save Changes"; }
    } catch { showToast("Error updating pet.","error"); submitBtn.disabled=false; submitBtn.textContent="Save Changes"; }
  };
}

/* ═══════════════════════════════════════════════════════
   BOOKINGS SECTION  —  list view
════════════════════════════════════════════════════════ */
function loadBookingsSection() {
  content.innerHTML = `
    <h2>My Bookings</h2>
    <div class="booking-tabs">
      <button class="tab-btn active" data-type="grooming">Grooming</button>
      <button class="tab-btn" data-type="hotel">Pet Hotel</button>
    </div>
    <div class="status-tabs">
      <button class="status-tab-btn active" data-status="all">All</button>
      <button class="status-tab-btn" data-status="pending">Pending</button>
      <button class="status-tab-btn" data-status="approved">Approved</button>
      <button class="status-tab-btn" data-status="rejected">Rejected</button>
    </div>
    <div id="bookingsContent"><p>Loading bookings...</p></div>`;

  let currentType   = "grooming";
  let currentStatus = "all";
  const bookingsContent = document.getElementById("bookingsContent");

  const loadBookings = async (type, status) => {
    bookingsContent.innerHTML = "<p>Loading...</p>";
    try {
      const r    = await fetch(`/api/bookings?type=${type}`);
      const data = await r.json();
      if (!data.success) { bookingsContent.innerHTML=`<p>Error: ${data.message}</p>`; return; }

      let bookings = data.bookings||[];
      if (status!=="all") bookings=bookings.filter(b=>b.status===status);
      pollBookingBadge();

      const SC = { pending:{bg:"#fef3c7",color:"#856404",label:"Pending"}, approved:{bg:"#d1fae5",color:"#065f46",label:"Approved"}, rejected:{bg:"#fee2e2",color:"#991b1b",label:"Rejected"} };

      let html = `<button id="newBookingBtn" class="btn" style="margin-bottom:18px;">+ New ${type==="grooming"?"Grooming":"Pet Hotel"} Booking</button>`;

      if (bookings.length) {
        html += `<div class="bk-cards-grid">`;
        bookings.forEach(b => {
          const sc      = SC[b.status]||SC.pending;
          const isHotel = type==="hotel";
          const petNames= b.pets.map(p=>p.name).join(", ");
          const breeds  = b.pets.map(p=>p.breed).filter(Boolean).join(", ");
          const dateStr = new Date(b.appointmentDate).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
          const svcs    = !isHotel&&b.services?(Array.isArray(b.services)?b.services.join(" · "):b.services):null;
          const coRow   = isHotel&&b.hotelCheckoutDate
            ? `<div class="bk-card-row"><span class="bk-icon">📤</span><span>Checkout: <strong>${new Date(b.hotelCheckoutDate).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</strong> ${b.hotelCheckoutTime||""}</span></div>` : "";
          const groomerRow = !isHotel&&b.requestedGroomerName
            ? `<div class="bk-card-row"><span class="bk-icon">✂️</span><span>Requested: <strong>${b.requestedGroomerName}</strong> <span style="color:#aaa;font-size:0.75rem;">(subject to availability)</span></span></div>` : "";
          const rejectBox = b.status==="rejected"&&b.rejectReason ? `<div class="bk-card-reject">❌ ${b.rejectReason}</div>` : "";
          const canCancel = b.status==="pending"||b.status==="approved";
          html += `
            <div class="bk-card">
              <div class="bk-card-header${isHotel?" hotel":""}">
                <span class="bk-card-type">${isHotel?"🏨 Pet Hotel":"✂️ Grooming"}</span>
                <span class="bk-card-status" style="background:${sc.bg};color:${sc.color};">${sc.label}</span>
              </div>
              <div class="bk-card-body">
                <p class="bk-card-pets">${petNames}</p>
                ${breeds?`<p class="bk-card-breed">${breeds}</p>`:""}
                <div class="bk-card-row"><span class="bk-icon">📅</span><span><strong>${dateStr}</strong> at ${b.appointmentTime||"—"}</span></div>
                ${coRow}${groomerRow}
                ${svcs?`<div class="bk-card-services">${svcs}</div>`:""}
                ${rejectBox}
              </div>
              <div class="bk-card-footer">
                ${canCancel?`<button class="bk-card-btn bk-card-btn-cancel cancelBookingBtn" data-id="${b._id}">Cancel</button>`:""}
                <button class="bk-card-btn bk-card-btn-delete deleteBookingBtn" data-id="${b._id}">Delete</button>
              </div>
            </div>`;
        });
        html += `</div>`;
      } else {
        html += `<p style="color:#aaa;padding:28px 0;text-align:center;">No ${status!=="all"?status+" ":""}bookings found.</p>`;
      }

      bookingsContent.innerHTML = html;
      document.getElementById("newBookingBtn").onclick = () => showBookingForm(type);

      bookingsContent.querySelectorAll(".cancelBookingBtn").forEach(btn => {
        btn.onclick = async () => {
          const ok = await showConfirm({ title:"Cancel Booking?", message:"Your booking will be marked as cancelled. This cannot be undone.", confirmText:"Yes, Cancel It", cancelText:"Keep Booking", danger:true });
          if (!ok) return;
          try {
            const r=await fetch(`/api/bookings/${btn.dataset.id}/cancel`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason:"Cancelled by user"})});
            const d=await r.json();
            if (d.success) { showToast("Booking cancelled.","info"); loadBookings(currentType,currentStatus); }
            else showToast(d.message||"Failed to cancel.","error");
          } catch { showToast("Error cancelling booking.","error"); }
        };
      });

      bookingsContent.querySelectorAll(".deleteBookingBtn").forEach(btn => {
        btn.onclick = async () => {
          const ok = await showConfirm({ title:"Delete Booking?", message:"This will permanently remove this booking record.", confirmText:"Yes, Delete", cancelText:"Keep", danger:true });
          if (!ok) return;
          try {
            const r=await fetch(`/api/bookings/${btn.dataset.id}`,{method:"DELETE"});
            const d=await r.json();
            if (d.success) { showToast("Booking deleted."); loadBookings(currentType,currentStatus); }
            else showToast(d.message||"Failed to delete.","error");
          } catch { showToast("Error deleting booking.","error"); }
        };
      });
    } catch { bookingsContent.innerHTML="<p>Error loading bookings.</p>"; }
  };

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => { document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); currentType=btn.dataset.type; loadBookings(currentType,currentStatus); };
  });
  document.querySelectorAll(".status-tab-btn").forEach(btn => {
    btn.onclick = () => { document.querySelectorAll(".status-tab-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); currentStatus=btn.dataset.status; loadBookings(currentType,currentStatus); };
  });

  loadBookings("grooming","all");
}

/* ═══════════════════════════════════════════════════════
   BOOKING FORM  —  complete rewrite
════════════════════════════════════════════════════════ */
async function showBookingForm(type) {
  const bookingsContent = document.getElementById("bookingsContent");
  bookingsContent.innerHTML = `<p>Loading booking form...</p>`;

  try {
    const [petsRes, groomersRes] = await Promise.all([
      fetch("/api/pets"),
      type==="grooming" ? fetch("/api/bookings/groomers") : Promise.resolve(null),
    ]);
    const petsData = await petsRes.json();

    if (!petsData.success) { showToast("Error loading pets: "+petsData.message,"error"); return; }
    if (!petsData.pets?.length) {
      showToast("Please add a pet first before creating a booking.","warning");
      document.querySelector('[data-section="pets"]')?.click();
      return;
    }

    const todayStr    = new Date().toISOString().split("T")[0];
    const isGrooming  = type==="grooming";
    const accentColor = isGrooming ? "#d44d7c" : "#1870c7";
    const icon        = isGrooming ? "✂️" : "🏨";
    const title       = isGrooming ? "New Grooming Booking" : "New Pet Hotel Booking";

    /* Pet dropdown options */
    const petOptions = `<option value="">— Select pet —</option>` +
      petsData.pets.map(p=>`<option value="${p._id}" data-rabies="${p.lastAntiRabiesShot||""}">${p.name} (${p.breed})</option>`).join("");

    /* Groomer options */
    let groomerOpts = `<option value="">No preference — any available groomer</option>`;
    if (groomersRes) {
      const grData = await groomersRes.json();
      (grData.groomers||[]).forEach(g => { groomerOpts+=`<option value="${g._id}">${g.name}${g.shift?" — "+g.shift:""}</option>`; });
    }

    bookingsContent.innerHTML = `
      <div class="bk-form-wrap">
        <!-- Header -->
        <div class="bk-fw-header" style="border-bottom:3px solid ${accentColor}20;">
          <div class="bk-fw-icon" style="background:${accentColor}18;color:${accentColor};">${icon}</div>
          <div>
            <h3 class="bk-fw-title" style="color:${accentColor};">${title}</h3>
            <p class="bk-fw-sub">Fill in the details below to request an appointment</p>
          </div>
        </div>

        <form id="bookingForm" autocomplete="off">

          <!-- ── PET SELECTION ── -->
          <div class="bk-fw-section">
            <div class="bk-fw-section-label" style="color:${accentColor};">🐾 Select Pet(s)</div>
            <div id="petsContainer">
              <div class="bk-fw-pet-row">
                <select class="bk-fw-select booking-pet" required>${petOptions}</select>
                <div class="bk-fw-rabies" style="display:none;">
                  💉 Last Anti-Rabies: <strong class="rabies-date"></strong>
                </div>
              </div>
            </div>
            <label class="bk-fw-addpet-label">
              <button type="button" id="addPetRowBtn" class="bk-fw-add-btn">+ Add another pet</button>
            </label>
          </div>

          <!-- ── GROOMING SERVICES ── -->
          ${isGrooming ? `
          <div class="bk-fw-section">
            <div class="bk-fw-section-label" style="color:${accentColor};">✂️ Main Service <span style="color:#d44d7c;font-weight:400;">*</span></div>
            <div class="bk-fw-radio-group">
              <label class="bk-fw-radio-pill">
                <input type="radio" name="mainService" value="Full Groom" required>
                <span>Full Groom</span>
              </label>
              <label class="bk-fw-radio-pill">
                <input type="radio" name="mainService" value="Bath and Blowdry">
                <span>Bath and Blowdry</span>
              </label>
            </div>

            <div class="bk-fw-section-label" style="color:${accentColor};margin-top:14px;">Add-on Services <span style="font-weight:400;font-size:0.8rem;color:#aaa;">(optional)</span></div>
            <div class="bk-fw-addon-grid">
              ${["Nail Trim","Ear Cleaning","Hair Trim","Poodle Feet","Tear Stain Removal","Teeth Cleaning","Dematting","Anal Sac Draining"].map(s=>
                `<label class="bk-fw-check-pill"><input type="checkbox" name="addonServices" value="${s}"><span>${s}</span></label>`
              ).join("")}
            </div>

            <div class="bk-fw-section-label" style="color:${accentColor};margin-top:14px;">Request a Groomer <span style="font-weight:400;font-size:0.8rem;color:#aaa;">(optional — subject to availability)</span></div>
            <select name="requestedGroomerId" id="userGroomerSelect" class="bk-fw-select">${groomerOpts}</select>
          </div>` : `
          <div class="bk-fw-section">
            <div class="bk-fw-section-label" style="color:${accentColor};">🏨 Stay Type <span style="color:#d44d7c;font-weight:400;">*</span></div>
            <div class="bk-fw-radio-group">
              <label class="bk-fw-radio-pill"><input type="radio" name="stayType" value="24 Hours Stay" required><span>24 Hours Stay</span></label>
              <label class="bk-fw-radio-pill"><input type="radio" name="stayType" value="12 Hours Stay"><span>12 Hours Stay</span></label>
              <label class="bk-fw-radio-pill"><input type="radio" name="stayType" value="Day Care"><span>Day Care</span></label>
            </div>
          </div>`}

          <!-- ── DATE & TIME ── -->
          <div class="bk-fw-section">
            <div class="bk-fw-section-label" style="color:${accentColor};">📅 ${isGrooming ? "Appointment" : "Check-in & Check-out"}</div>
            ${isGrooming ? `
            <div class="bk-fw-grid2">
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Date <span style="color:#d44d7c;">*</span></label>
                <input type="date" name="appointmentDate" id="bkApptDate" min="${todayStr}" class="bk-fw-input" required>
              </div>
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Time <span style="color:#d44d7c;">*</span></label>
                <div id="bkTimeWrap">
                  <select name="appointmentTime" disabled class="bk-fw-select" style="background:#f8f9fa;color:#aaa;">
                    <option>Select date first</option>
                  </select>
                </div>
                <p id="bkTimeNote" style="font-size:0.78rem;color:#d44d7c;display:none;margin-top:4px;"></p>
              </div>
            </div>` : `
            <div class="bk-fw-grid2">
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Check-in Date <span style="color:#d44d7c;">*</span></label>
                <input type="date" name="appointmentDate" id="bkCheckIn" min="${todayStr}" class="bk-fw-input" required>
              </div>
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Check-in Time <span style="color:#d44d7c;">*</span></label>
                <input type="time" name="appointmentTime" class="bk-fw-input" required>
              </div>
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Check-out Date <span style="color:#d44d7c;">*</span></label>
                <input type="date" name="hotelCheckoutDate" id="bkCheckOut" min="${todayStr}" class="bk-fw-input" required>
              </div>
              <div class="bk-fw-field">
                <label class="bk-fw-field-label">Check-out Time <span style="color:#d44d7c;">*</span></label>
                <input type="time" name="hotelCheckoutTime" class="bk-fw-input" required>
              </div>
            </div>`}
          </div>

          <!-- ── NOTICE ── -->
          <div class="bk-fw-notice" style="border-left-color:${accentColor};background:${accentColor}0d;">
            <strong>📌 Please note</strong><br>
            • Your booking will be <strong>PENDING</strong> until approved by our team<br>
            • Payment is made <strong>at the shop</strong> upon arrival<br>
            • Prices vary by pet size, fur condition, and selected services
          </div>

          <!-- ── BUTTONS ── -->
          <div class="bk-fw-actions">
            <button type="submit" class="bk-fw-submit" id="bookingSubmitBtn" style="background:linear-gradient(135deg,${accentColor},${isGrooming?"#e8739b":"#2d8ef0"});">
              Book Appointment
            </button>
            <button type="button" id="cancelBookingForm" class="bk-fw-cancel">Cancel</button>
          </div>

        </form>
      </div>`;

    document.getElementById("cancelBookingForm").onclick = () => loadBookingsSection();

    /* ── Pet rabies info helper ── */
    const updateRabiesInfo = sel => {
      const row     = sel.closest(".bk-fw-pet-row");
      const infoDiv = row?.querySelector(".bk-fw-rabies");
      const span    = row?.querySelector(".rabies-date");
      if (!infoDiv) return;
      if (sel.value) {
        const opt = sel.options[sel.selectedIndex];
        if (span) span.textContent = opt.dataset.rabies ? new Date(opt.dataset.rabies).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "Not set";
        infoDiv.style.display = "block";
      } else infoDiv.style.display = "none";
    };
    document.querySelector(".booking-pet")?.addEventListener("change", function(){ updateRabiesInfo(this); });

    /* ── Add another pet ── */
    document.getElementById("addPetRowBtn").onclick = () => {
      const container = document.getElementById("petsContainer");

      const row = document.createElement("div");
      row.className = "bk-fw-pet-row";
      row.innerHTML = `
        <select class="bk-fw-select booking-pet" required>${petOptions}</select>
        <div class="bk-fw-rabies" style="display:none;">
          💉 Last Anti-Rabies: <strong class="rabies-date"></strong>
        </div>
        <button type="button" class="removePetRow">✕</button>
      `;

      container.appendChild(row);

      row.querySelector(".booking-pet").addEventListener("change", function () {
        updateRabiesInfo(this);
      });

      row.querySelector(".removePetRow").onclick = () => row.remove();
    };

    /* ── Time slot loader (grooming only) ── */
    if (isGrooming) {
      const dateInput = document.getElementById("bkApptDate");
      const timeWrap  = document.getElementById("bkTimeWrap");
      const noteEl    = document.getElementById("bkTimeNote");

      dateInput.addEventListener("change", async () => {
        if (!dateInput.value) return;
        timeWrap.innerHTML = `<select name="appointmentTime" disabled class="bk-fw-select" style="color:#aaa;"><option>Loading slots...</option></select>`;
        noteEl.style.display = "none";
        try {
          const r     = await fetch(`/api/bookings/available-slots?date=${dateInput.value}&type=grooming`);
          const data  = await r.json();
          const slots = data.slots||[];
          const hasAvail = slots.some(s=>s.available);
          const opts  = slots.map(s=>s.available?`<option value="${s.time}">${s.time}</option>`:`<option disabled>${s.time} — booked</option>`).join("");
          timeWrap.innerHTML = `<select name="appointmentTime" ${hasAvail?"required":"disabled"} class="bk-fw-select ${hasAvail?"":"bk-fw-select-disabled"}"><option value="">Select time</option>${opts}</select>`;
          if (!hasAvail) { noteEl.textContent="All slots for this date are fully booked. Please pick another date."; noteEl.style.display="block"; }
        } catch {
          timeWrap.innerHTML = `<select name="appointmentTime" disabled class="bk-fw-select" style="color:#aaa;"><option>Error loading slots</option></select>`;
        }
      });

      /* Hotel checkout min date */
      const checkIn = document.getElementById("bkCheckIn");
      if (checkIn) checkIn.addEventListener("change", () => { const co=document.getElementById("bkCheckOut"); if(co) co.min=checkIn.value; });
    } else {
      const checkIn = document.getElementById("bkCheckIn");
      if (checkIn) checkIn.addEventListener("change", () => { const co=document.getElementById("bkCheckOut"); if(co) co.min=checkIn.value; });
    }

    /* ── Radio / checkbox pill visual toggle ── */
    document.querySelectorAll(".bk-fw-radio-pill input[type=radio]").forEach(r => {
      r.addEventListener("change", () => {
        document.querySelectorAll(`.bk-fw-radio-pill input[name="${r.name}"]`).forEach(x => x.closest(".bk-fw-radio-pill").classList.toggle("selected", x.checked));
      });
    });
    document.querySelectorAll(".bk-fw-check-pill input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => cb.closest(".bk-fw-check-pill").classList.toggle("selected", cb.checked));
    });

    /* ── Form submit ── */
    document.getElementById("bookingForm").onsubmit = async e => {
      e.preventDefault();

      const pets = [...document.querySelectorAll(".booking-pet")].map(s=>s.value).filter(Boolean);
      if (!pets.length) { showToast("Please select at least one pet.","warning"); return; }

      const uniquePets = new Set(pets);

      if(pets.length !== uniquePets.size) {
        showToast("You selected the same pet more than once.","warning");
        return;
      }

      let services = null;
      if (isGrooming) {
        const main = document.querySelector('input[name="mainService"]:checked')?.value;
        if (!main) { showToast("Please select a main grooming service.","warning"); return; }
        services = [main, ...[...document.querySelectorAll('input[name="addonServices"]:checked')].map(cb=>cb.value)];
      }

      const apptDate = document.querySelector('[name="appointmentDate"]')?.value;
      const apptTime = document.querySelector('[name="appointmentTime"]')?.value;

      if (!apptDate) { showToast("Please select a date.","warning"); return; }
      if (!apptTime) { showToast("Please select a time.","warning"); return; }

      if (!isGrooming) {
        const coDate = document.querySelector('[name="hotelCheckoutDate"]')?.value;
        const coTime = document.querySelector('[name="hotelCheckoutTime"]')?.value;
        if (!coDate||!coTime) { showToast("Please fill in check-out date and time.","warning"); return; }
        if (coDate < apptDate) { showToast("Check-out date cannot be before check-in date.","warning"); return; }
      }

      const now = new Date();
      const selectedDateTime = new Date(`${apptDate}T${apptTime}`);

      if (selectedDateTime < now) {
        showToast("You cannot select a past time.","warning");
        return;
      }

      /* Confirmation modal */
      const groomerSel  = document.getElementById("userGroomerSelect");
      const groomerName = groomerSel?.selectedOptions[0]?.text||"";
      const groomerId   = groomerSel?.value||null;
      const groomerNote = groomerId && groomerName && !groomerName.includes("No preference")
        ? `<br>• Requested groomer: <strong>${groomerName}</strong> (subject to availability)` : "";

      const ok = await showConfirm({
        title: "Confirm Booking",
        message: `<ul style="margin:0;padding-left:18px;line-height:1.9;">
          <li>Status will be <strong>PENDING</strong> until approved by staff</li>
          <li>Payment is made <strong>at the shop</strong> upon arrival</li>
          <li>Prices vary by pet size and fur condition${groomerNote}</li>
        </ul>`,
        confirmText: "Yes, Book Now",
        cancelText:  "Go Back",
      });
      if (!ok) return;

      const submitBtn = document.getElementById("bookingSubmitBtn");
      submitBtn.disabled=true; submitBtn.textContent="Submitting...";

      const formEl  = document.getElementById("bookingForm");
      const payload = {
        type, pets, services,
        appointmentDate:   apptDate,
        appointmentTime:   apptTime,
        hotelCheckoutDate: formEl.querySelector('[name="hotelCheckoutDate"]')?.value||null,
        hotelCheckoutTime: formEl.querySelector('[name="hotelCheckoutTime"]')?.value||null,
        requestedGroomer:  groomerId,
      };

      try {
        const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const d=await r.json();
        if (d.success) { showToast(d.message||"Booking submitted! We'll review it shortly. 🐾"); loadBookingsSection(); }
        else { showToast(d.message||"Booking failed.","error"); submitBtn.disabled=false; submitBtn.textContent="Book Appointment"; }
      } catch { showToast("Error submitting booking.","error"); submitBtn.disabled=false; submitBtn.textContent="Book Appointment"; }
    };

  } catch (err) { console.error(err); showToast("Error loading booking form.","error"); loadBookingsSection(); }
}

/* ═══════════════════════════════════════════════════════
   LOGOUT CONFIRM (kept for any external calls)
════════════════════════════════════════════════════════ */
function showLogoutConfirm(onConfirm) {
  showConfirm({ title:"Log Out?", message:"Are you sure you want to log out?", confirmText:"Yes, Log Out", cancelText:"Stay", danger:true })
    .then(ok => { if (ok) onConfirm(); });
}

/* ═══════════════════════════════════════════════════════
   FEEDBACK FAB + MODAL  (user dashboard)
════════════════════════════════════════════════════════ */
function initFeedbackFAB() {
  if (document.getElementById("feedbackFAB")) return;
  const fab = document.createElement("button");
  fab.id = "feedbackFAB"; fab.className = "feedback-fab";
  fab.innerHTML = "⭐ Leave Feedback";
  document.body.appendChild(fab);
  fab.onclick = openFeedbackModal;
}

function openFeedbackModal() {
  document.getElementById("feedbackModalEl")?.remove();
  let selectedRating=0, selectedService="", isAnon=false;

  const el = document.createElement("div");
  el.id="feedbackModalEl"; el.className="feedback-modal-overlay";
  el.innerHTML = `
    <div class="feedback-modal">
      <button class="feedback-modal-close" id="fbClose">&#x2715;</button>
      <div class="feedback-modal-header">
        <div class="feedback-modal-icon">⭐</div>
        <h3>Leave Us Feedback</h3>
        <p>We'd love to hear about your experience!</p>
      </div>

      <div id="fbFormBody">
        <div style="text-align:center;margin-bottom:4px;"><span style="font-size:0.82rem;font-weight:600;color:#888;">Your Rating *</span></div>
        <div class="star-rating" id="starRating">
          <span class="star" data-val="1">★</span><span class="star" data-val="2">★</span>
          <span class="star" data-val="3">★</span><span class="star" data-val="4">★</span>
          <span class="star" data-val="5">★</span>
        </div>

        <div style="margin-bottom:10px;">
          <span class="feedback-label">Service Type</span>
          <div class="feedback-service-row">
            <button type="button" class="feedback-service-btn" data-svc="Grooming">✂️ Grooming</button>
            <button type="button" class="feedback-service-btn" data-svc="Pet Hotel">🏨 Pet Hotel</button>
            <button type="button" class="feedback-service-btn" data-svc="General">🐾 General</button>
          </div>
        </div>

        <span class="feedback-label">Your Comment *</span>
        <textarea class="feedback-textarea" id="fbComment" maxlength="500" placeholder="Tell us about your experience..."></textarea>
        <div style="text-align:right;font-size:0.75rem;color:#bbb;margin-top:3px;"><span id="fbCharCount">0</span>/500</div>

        <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:0.85rem;font-weight:600;color:#555;cursor:pointer;">
          <input type="checkbox" id="fbAnon" style="width:15px;height:15px;accent-color:#d44d7c;">
          Post anonymously <span style="font-weight:400;color:#aaa;font-size:0.78rem;">(your name won't be shown)</span>
        </label>

        <p class="feedback-msg" id="fbMsg"></p>
        <button class="feedback-submit-btn" id="fbSubmit">Submit Feedback</button>
      </div>

      <div class="feedback-success" id="fbSuccess">
        <div class="feedback-success-icon">🎉</div>
        <h4>Thank you for your feedback!</h4>
        <p>Your review helps us improve our services.</p>
        <button class="feedback-submit-btn" id="fbSuccessClose" style="margin-top:16px;">Close</button>
      </div>
    </div>`;

  document.body.appendChild(el);
  document.body.style.overflow="hidden";
  const close=()=>{ el.remove(); document.body.style.overflow=""; };
  document.getElementById("fbClose").onclick=close;
  document.getElementById("fbSuccessClose")?.addEventListener("click",close);
  el.addEventListener("click",e=>{ if(e.target===el)close(); });

  /* Stars */
  const stars=el.querySelectorAll(".star");
  stars.forEach(s=>{
    s.addEventListener("mouseenter",()=>stars.forEach(x=>x.classList.toggle("hover",Number(x.dataset.val)<=Number(s.dataset.val))));
    s.addEventListener("mouseleave",()=>stars.forEach(x=>{ x.classList.remove("hover"); x.classList.toggle("active",Number(x.dataset.val)<=selectedRating); }));
    s.addEventListener("click",()=>{ selectedRating=Number(s.dataset.val); stars.forEach(x=>x.classList.toggle("active",Number(x.dataset.val)<=selectedRating)); });
  });

  /* Service toggle */
  el.querySelectorAll(".feedback-service-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{ el.querySelectorAll(".feedback-service-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); selectedService=btn.dataset.svc; });
  });

  /* Char count */
  document.getElementById("fbComment").addEventListener("input",function(){ document.getElementById("fbCharCount").textContent=this.value.length; });

  /* Anonymous toggle */
  document.getElementById("fbAnon").addEventListener("change",function(){ isAnon=this.checked; });

  /* Submit */
  document.getElementById("fbSubmit").onclick=async()=>{
    const msg=document.getElementById("fbMsg");
    const comment=document.getElementById("fbComment").value.trim();
    if (!selectedRating){ msg.textContent="Please select a star rating."; msg.style.display="block"; return; }
    if (!comment){ msg.textContent="Please write a comment."; msg.style.display="block"; return; }
    msg.style.display="none";
    const btn=document.getElementById("fbSubmit"); btn.disabled=true; btn.textContent="Submitting...";
    try {
      const r=await fetch("/api/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating:selectedRating,comment,serviceType:selectedService||"General",anonymous:isAnon})});
      const d=await r.json();
      if (d.success){ document.getElementById("fbFormBody").style.display="none"; document.getElementById("fbSuccess").style.display="block"; }
      else{ msg.textContent=d.message||"Error submitting feedback."; msg.style.display="block"; btn.disabled=false; btn.textContent="Submit Feedback"; }
    } catch { msg.textContent="Something went wrong."; msg.style.display="block"; btn.disabled=false; btn.textContent="Submit Feedback"; }
  };
}