document.addEventListener("DOMContentLoaded", () => {
  // ===== Hamburger Menu =====
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenuBtn = document.getElementById("closeMenu");

  function closeMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      document.body.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : "";
    });

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeMobileMenu);

    mobileMenu.querySelectorAll(".mobile-nav-links a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) closeMobileMenu();
    });
  }

  // ===== Auth Modal Helpers =====
  const loginModal  = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  function openModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  [loginModal, signupModal].forEach((modal) => {
    if (!modal) return;
    modal.querySelector(".auth-modal-backdrop")?.addEventListener("click", () => closeModal(modal));
  });

  document.getElementById("loginClose")?.addEventListener("click",  () => closeModal(loginModal));
  document.getElementById("signupClose")?.addEventListener("click", () => closeModal(signupModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(loginModal); closeModal(signupModal); }
  });

  document.getElementById("loginBtn")?.addEventListener("click",   () => openModal(loginModal));
  document.getElementById("signupBtn")?.addEventListener("click",  () => openModal(signupModal));
  document.getElementById("mobileLoginBtn")?.addEventListener("click",  () => { closeMobileMenu(); openModal(loginModal); });
  document.getElementById("mobileSignupBtn")?.addEventListener("click", () => { closeMobileMenu(); openModal(signupModal); });

  document.getElementById("goSignup")?.addEventListener("click", (e) => { e.preventDefault(); closeModal(loginModal);  openModal(signupModal); });
  document.getElementById("goLogin")?.addEventListener("click",  (e) => { e.preventDefault(); closeModal(signupModal); openModal(loginModal);  });

  // ===== Password Toggle =====
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.innerHTML = isHidden
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
             <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
             <circle cx="12" cy="12" r="3"/>
           </svg>`;
    });
  });

  // ===== Signup Form =====
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector(".auth-submit-btn");
      const data = {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        contact: form.contact.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
      };
      if (data.password !== data.confirmPassword) { showAuthError(signupModal, "Passwords do not match"); return; }
      setLoading(submitBtn, true, "Creating Account...");
      try {
        const res    = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const result = await res.json();
        if (result.success) { closeModal(signupModal); showAuthSuccess("Account created! Please check your email to verify your account. 🐾"); form.reset(); }
        else showAuthError(signupModal, result.message);
      } catch (err) { showAuthError(signupModal, "Something went wrong. Please try again."); }
      finally { setLoading(submitBtn, false, "Create Account"); }
    });
  }

  // ===== Login Form =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector(".auth-submit-btn");
      const formData = { email: form.email.value.trim(), password: form.password.value };
      setLoading(submitBtn, true, "Logging in...");
      try {
        const res    = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        const result = await res.json();
        if (result.success) { if (result.token) sessionStorage.setItem("jwtToken", result.token); window.location.href = result.redirect; }
        else showAuthError(loginModal, result.message);
      } catch (err) { showAuthError(loginModal, "Something went wrong. Please try again."); }
      finally { setLoading(submitBtn, false, "Login"); }
    });
  }

  // ===== Contact Form =====
  const contactMessage  = document.getElementById("contactMessage");
  const charCount       = document.getElementById("charCount");
  const contactForm     = document.getElementById("contactForm");

  if (contactMessage && charCount) {
    contactMessage.addEventListener("input", () => {
      charCount.textContent = `${contactMessage.value.length} / 300 characters`;
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = {
        name:    contactForm.querySelector("#contactName").value,
        email:   contactForm.querySelector("#contactEmail").value,
        message: contactForm.querySelector("#contactMessage").value,
      };
      try {
        const res    = await fetch("/api/contact/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        const result = await res.json();
        if (result.success) {
          const modal = new bootstrap.Modal(document.getElementById("thankYouModal"));
          modal.show();
          contactForm.reset();
          if (charCount) charCount.textContent = "0 / 300 characters";
        } else alert(result.message || "Failed to send message");
      } catch (err) { alert("Something went wrong. Please try again."); }
    });
  }

  // ===== Utilities =====
  function setLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.querySelector("span").textContent = label;
  }

  function showAuthError(modal, message) {
    if (!modal) return;
    modal.querySelectorAll(".auth-error-msg").forEach((el) => el.remove());
    const err = document.createElement("p");
    err.className = "auth-error-msg";
    err.textContent = message;
    err.style.cssText = "color:#d44d7c;font-size:0.85rem;font-weight:700;text-align:center;margin:8px 0 0;";
    const form = modal.querySelector(".auth-form");
    const submitBtn = form?.querySelector(".auth-submit-btn");
    if (submitBtn) submitBtn.insertAdjacentElement("afterend", err);
    else form?.appendChild(err);
    setTimeout(() => err.remove(), 4000);
  }

  function showAuthSuccess(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);background:#d44d7c;color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;font-size:0.95rem;z-index:99999;box-shadow:0 8px 24px rgba(212,77,124,0.35);opacity:0;transition:opacity 0.3s ease,transform 0.3s ease;max-width:90vw;text-align:center;font-family:'Nunito','Segoe UI',sans-serif;`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateX(-50%) translateY(0)"; });
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateX(-50%) translateY(20px)"; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  window.authFetch = function (url, options = {}) {
    const token = sessionStorage.getItem("jwtToken");
    return fetch(url, { ...options, headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  };

  // ===== Booking Choice Modal =====
  const bookingChoiceModal = document.getElementById("bookingChoiceModal");
  const guestBookingModal  = document.getElementById("guestBookingModal");
  const guestHotelModal    = document.getElementById("guestHotelModal");

  function openBookingChoice(forHotel = false) {
    if (!bookingChoiceModal) return;
    bookingChoiceModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    document.getElementById("choiceGuest").onclick = forHotel ? openHotelGuestForm : openGuestForm;
  }

  function closeBookingChoice() {
    if (!bookingChoiceModal) return;
    bookingChoiceModal.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("choiceGuest").onclick = openGuestForm;
  }

  /* Grooming guest form */
  function openGuestForm() {
    closeBookingChoice();
    if (!guestBookingModal) return;
    guestBookingModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    loadGuestGroomers();
    setGuestMinDate();
  }

  function closeGuestForm() {
    if (!guestBookingModal) return;
    guestBookingModal.style.display = "none";
    document.body.style.overflow = "";
  }

  /* Hotel guest form */
  function openHotelGuestForm() {
    closeBookingChoice();
    if (!guestHotelModal) return;
    guestHotelModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    const today = new Date().toISOString().split("T")[0];
    const ciEl = document.getElementById("guestHotelCheckIn");
    const coEl = document.getElementById("guestHotelCheckOut");
    if (ciEl) ciEl.min = today;
    if (coEl) coEl.min = today;
  }

  function closeHotelGuestForm() {
    if (!guestHotelModal) return;
    guestHotelModal.style.display = "none";
    document.body.style.overflow = "";
  }

  /* Trigger buttons — support both IDs (bookGroomingBtn and bookGroomingBtn2) */
  document.getElementById("bookGroomingBtn")?.addEventListener("click",  () => openBookingChoice(false));
  document.getElementById("bookGroomingBtn2")?.addEventListener("click", () => openBookingChoice(false));
  document.getElementById("bookHotelBtn")?.addEventListener("click",     () => openBookingChoice(true));

  /* Choice modal buttons */
  document.getElementById("choiceClose")?.addEventListener("click",  closeBookingChoice);
  document.getElementById("choiceLogin")?.addEventListener("click",  () => { closeBookingChoice(); openModal(loginModal); });
  document.getElementById("choiceSignup")?.addEventListener("click", () => { closeBookingChoice(); openModal(signupModal); });
  document.getElementById("choiceGuest").onclick = openGuestForm; // default

  /* Close buttons */
  document.getElementById("guestFormClose")?.addEventListener("click",       closeGuestForm);
  document.getElementById("guestSuccessClose")?.addEventListener("click",    closeGuestForm);
  document.getElementById("guestHotelClose")?.addEventListener("click",        closeHotelGuestForm);
  document.getElementById("guestHotelSuccessClose")?.addEventListener("click", closeHotelGuestForm);

  /* Backdrop clicks */
  bookingChoiceModal?.addEventListener("click", (e) => { if (e.target === bookingChoiceModal) closeBookingChoice(); });
  guestBookingModal?.addEventListener("click",  (e) => { if (e.target === guestBookingModal)  closeGuestForm(); });
  guestHotelModal?.addEventListener("click",   (e) => { if (e.target === guestHotelModal)    closeHotelGuestForm(); });

  /* Set min date for grooming form */
  function setGuestMinDate() {
    const today = new Date().toISOString().split("T")[0];
    const el = document.getElementById("guestApptDate");
    if (el) el.min = today;
  }

  /* Hotel check-out min = check-in date */
  document.getElementById("guestHotelCheckIn")?.addEventListener("change", function () {
    const co = document.getElementById("guestHotelCheckOut");
    if (co) co.min = this.value;
  });

  /* Load active groomers into dropdown */
  async function loadGuestGroomers() {
    try {
      const res  = await fetch("/api/bookings/groomers");
      const data = await res.json();
      const sel  = document.getElementById("guestGroomerSelect");
      if (!sel) return;
      sel.innerHTML = '<option value="">No preference</option>';
      (data.groomers || []).forEach(g => {
        const opt = document.createElement("option");
        opt.value       = g._id;
        opt.textContent = g.name + (g.shift ? " — " + g.shift : "");
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  /* Load time slots when grooming date changes */
  document.getElementById("guestApptDate")?.addEventListener("change", async function () {
    const wrap = document.getElementById("guestTimeWrap");
    const date = this.value;
    if (!date || !wrap) return;
    wrap.innerHTML = '<select name="appointmentTime" disabled style="padding:10px 12px;border:2px solid #eee;border-radius:10px;font-size:0.92rem;font-family:inherit;width:100%;"><option>Loading...</option></select>';
    try {
      const res   = await fetch(`/api/bookings/available-slots?date=${date}&type=grooming`);
      const data  = await res.json();
      const slots = data.slots || [];
      if (!slots.length) {
        wrap.innerHTML = '<select name="appointmentTime" disabled style="padding:10px 12px;border:2px solid #eee;border-radius:10px;font-size:0.92rem;font-family:inherit;width:100%;"><option>No slots available</option></select>';
        return;
      }
      const options  = slots.map(s => s.available ? `<option value="${s.time}">${s.time}</option>` : `<option disabled>${s.time} — booked</option>`).join("");
      const hasAvail = slots.some(s => s.available);
      wrap.innerHTML = `<select name="appointmentTime" ${hasAvail ? "required" : "disabled"} style="padding:10px 12px;border:2px solid #eee;border-radius:10px;font-size:0.92rem;font-family:inherit;width:100%;outline:none;" onfocus="this.style.borderColor='#d44d7c'" onblur="this.style.borderColor='#eee'"><option value="">Select time</option>${options}</select>`;
    } catch (_) {
      wrap.innerHTML = '<select name="appointmentTime" disabled style="padding:10px 12px;border:2px solid #eee;border-radius:10px;font-size:0.92rem;font-family:inherit;width:100%;"><option>Error loading slots</option></select>';
    }
  });

  /* Submit grooming guest booking */
  document.getElementById("guestBookingForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("guestSubmitBtn");
    const msg = document.getElementById("guestBookingMsg");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    msg.style.display = "none";

    const fd = new FormData(this);
    const mainService = fd.get("mainService");
    if (!mainService) {
      msg.textContent = "Please select a main grooming service.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Booking Request"; return;
    }

    const services = [mainService, ...fd.getAll("addonServices")];
    const body = {
      ownerName:          fd.get("ownerName"),
      email:              fd.get("email"),
      phone:              fd.get("phone"),
      petName:            fd.get("petName"),
      breed:              fd.get("breed"),
      gender:             fd.get("gender"),
      age:                fd.get("age"),
      lastAntiRabiesShot: fd.get("lastAntiRabiesShot") || null,
      services,
      requestedGroomerId: fd.get("requestedGroomerId") || null,
      appointmentDate:    fd.get("appointmentDate"),
      appointmentTime:    fd.get("appointmentTime"),
    };

    if (!body.appointmentTime) {
      msg.textContent = "Please select an appointment time.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Booking Request"; return;
    }

    try {
      const res    = await fetch("/api/guest.bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.success) {
        document.getElementById("guestBookingForm").style.display    = "none";
        document.getElementById("guestBookingSuccess").style.display = "block";
        document.getElementById("guestRefNo").textContent = "Reference No: " + result.refNo;
      } else {
        msg.textContent   = result.message;
        msg.style.display = "block";
        btn.disabled = false; btn.textContent = "Submit Booking Request";
      }
    } catch (_) {
      msg.textContent   = "Something went wrong. Please try again.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Booking Request";
    }
  });

  /* Submit hotel guest booking */
  document.getElementById("guestHotelForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("guestHotelSubmitBtn");
    const msg = document.getElementById("guestHotelMsg");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    msg.style.display = "none";

    const fd       = new FormData(this);
    const stayType = fd.get("stayType");
    if (!stayType) {
      msg.textContent = "Please select a stay type.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Hotel Booking Request"; return;
    }

    const checkInDate  = fd.get("checkInDate");
    const checkOutDate = fd.get("checkOutDate");
    if (checkOutDate <= checkInDate) {
      msg.textContent = "Check-out date must be after check-in date.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Hotel Booking Request"; return;
    }

    const body = {
      ownerName:    fd.get("ownerName"),
      email:        fd.get("email"),
      phone:        fd.get("phone"),
      petName:      fd.get("petName"),
      breed:        fd.get("breed"),
      gender:       fd.get("gender"),
      age:          fd.get("age"),
      stayType,
      checkInDate,
      checkInTime:  fd.get("checkInTime"),
      checkOutDate,
      checkOutTime: fd.get("checkOutTime"),
    };

    try {
      const res    = await fetch("/api/guest.bookings/hotel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.success) {
        document.getElementById("guestHotelForm").style.display    = "none";
        document.getElementById("guestHotelSuccess").style.display = "block";
        document.getElementById("guestHotelRefNo").textContent = "Reference No: " + result.refNo;
      } else {
        msg.textContent   = result.message;
        msg.style.display = "block";
        btn.disabled = false; btn.textContent = "Submit Hotel Booking Request";
      }
    } catch (_) {
      msg.textContent   = "Something went wrong. Please try again.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Hotel Booking Request";
    }
  });

  /* ── Load featured reviews on homepage ── */
  async function loadFeaturedReviews() {
    const grid = document.getElementById("featuredReviewsGrid");
    const indicators = document.getElementById("testimonialIndicators");

    if (!grid) return;

    try {
      const res  = await fetch("/api/feedback/featured");
      const data = await res.json();

      if (!data.success || !data.feedbacks?.length) {
        grid.innerHTML = `
          <div class="carousel-item active">
            <p class="review-cards-empty">Be the first to leave a review! 🐾</p>
          </div>`;
        return;
      }

      grid.innerHTML = data.feedbacks.map((f, index) => {
        const stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
        return `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <div class="review-card" style="max-width:560px;margin:auto;">
              <div class="review-card-stars">${stars}</div>
              <div class="review-card-text">${f.comment}</div>
              <div class="review-card-meta">${f.name || "Anonymous"}</div>
              <div class="review-card-service">${f.serviceType || ""}</div>
            </div>
          </div>
        `;
      }).join("");

      if (indicators) {
        indicators.innerHTML = data.feedbacks.map((_, i) => `
          <button type="button"
            data-bs-target="#testimonialsCarousel"
            data-bs-slide-to="${i}"
            class="${i === 0 ? "active" : ""}"
            ${i === 0 ? 'aria-current="true"' : ""}
            aria-label="Slide ${i + 1}">
          </button>
        `).join("");
      }

      const carouselElement = document.querySelector("#testimonialsCarousel");
      if (carouselElement && typeof bootstrap !== "undefined") {
        new bootstrap.Carousel(carouselElement);
      }

    } catch (_) {
      grid.innerHTML = `
        <div class="carousel-item active">
          <p class="review-cards-empty">Reviews unavailable.</p>
        </div>`;
    }
  }

  loadFeaturedReviews();

  /* ── Public Feedback Modal ── */
  const pubModal = document.getElementById("publicFeedbackModal");
  let pubRating = 0;
  let pubService = "";

  function openPubFeedback() {
    if (!pubModal) return;
    pubModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closePubFeedback() {
    if (!pubModal) return;
    pubModal.style.display = "none";
    document.body.style.overflow = "";
  }

  document.getElementById("publicFeedbackBtn")?.addEventListener("click", openPubFeedback);
  document.getElementById("pubFbClose")?.addEventListener("click", closePubFeedback);
  document.getElementById("pubFbSuccessClose")?.addEventListener("click", closePubFeedback);
  pubModal?.addEventListener("click", e => { if (e.target === pubModal) closePubFeedback(); });

  /* Stars */
  const pubStars = document.querySelectorAll("#pubStarRating .star");
  pubStars.forEach(s => {
    s.addEventListener("mouseenter", () => {
      pubStars.forEach(x => x.classList.toggle("hover", Number(x.dataset.val) <= Number(s.dataset.val)));
    });
    s.addEventListener("mouseleave", () => {
      pubStars.forEach(x => { x.classList.remove("hover"); x.classList.toggle("active", Number(x.dataset.val) <= pubRating); });
    });
    s.addEventListener("click", () => {
      pubRating = Number(s.dataset.val);
      pubStars.forEach(x => x.classList.toggle("active", Number(x.dataset.val) <= pubRating));
    });
  });

  /* Service toggle */
  document.querySelectorAll("#publicFeedbackModal .feedback-service-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#publicFeedbackModal .feedback-service-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      pubService = btn.dataset.svc;
    });
  });

  /* Char count */
  document.getElementById("pubFbComment")?.addEventListener("input", function () {
    document.getElementById("pubFbCharCount").textContent = this.value.length;
  });

  /* Submit */
  document.getElementById("pubFbSubmit")?.addEventListener("click", async () => {
    const msg     = document.getElementById("pubFbMsg");
    const comment = document.getElementById("pubFbComment")?.value.trim();
    const name    = document.getElementById("pubFbName")?.value.trim();
    msg.style.display = "none";

    if (!pubRating) { msg.textContent = "Please select a star rating."; msg.style.display = "block"; return; }
    if (!comment)   { msg.textContent = "Please write a comment."; msg.style.display = "block"; return; }

    const btn = document.getElementById("pubFbSubmit");
    btn.disabled = true; btn.textContent = "Submitting...";

    try {
      const res    = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rating: pubRating, comment, name: name || "Anonymous", serviceType: pubService || "General" }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById("pubFbFormBody").style.display = "none";
        document.getElementById("pubFbSuccess").style.display  = "block";
      } else {
        msg.textContent = result.message || "Error submitting.";
        msg.style.display = "block";
        btn.disabled = false; btn.textContent = "Submit Review";
      }
    } catch (_) {
      msg.textContent = "Something went wrong.";
      msg.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit Review";
    }
  });

  // ===== Lightbox Fix (prevent scroll-to-top on close) =====
document.querySelectorAll('a[href^="#"]').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    const href = trigger.getAttribute('href');
    if (!href || href === '#' || href === ' ') return;
    const target = document.querySelector(href);
    if (!target || !target.classList.contains('lightbox')) return;
    e.preventDefault();
    target.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    history.pushState(null, '', ' ');
  });
});

document.querySelectorAll('.lightbox .close').forEach(closeBtn => {
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const lightbox = closeBtn.closest('.lightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});

document.querySelectorAll('.lightbox').forEach(lightbox => {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.lightbox').forEach(lb => {
      lb.style.display = 'none';
    });
    document.body.style.overflow = '';
  }
});

// ===== Scroll Animations =====
const animateOnScroll = () => {
  const elements = document.querySelectorAll(
    '#about .about-img-col, #about .about-text-col, ' +
    '.about-stat-mini, ' +
    '.service-card, ' +
    '.promotions-card, ' +
    '.trust-item, ' +
    '#our-shop .photo-grid, ' +
    '.contact-form-wrap, .contact-info-col, ' +
    '.testi-cta, #testimonialsCarousel, ' +
    '.section-header-center, .section-eyebrow, .section-title, .section-sub, ' +
    '.footer-inner'
  );

  elements.forEach(el => el.classList.add('scroll-hidden'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-visible');
        observer.unobserve(entry.target); // animate once only
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
};

animateOnScroll();

});