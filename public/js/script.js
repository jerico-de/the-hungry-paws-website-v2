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
  const loginModal = document.getElementById("loginModal");
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

  // Backdrop click closes modal
  [loginModal, signupModal].forEach((modal) => {
    if (!modal) return;
    modal.querySelector(".auth-modal-backdrop")?.addEventListener("click", () => closeModal(modal));
  });

  // Close buttons
  document.getElementById("loginClose")?.addEventListener("click", () => closeModal(loginModal));
  document.getElementById("signupClose")?.addEventListener("click", () => closeModal(signupModal));

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(loginModal);
      closeModal(signupModal);
    }
  });

  // Open buttons — desktop
  document.getElementById("loginBtn")?.addEventListener("click", () => openModal(loginModal));
  document.getElementById("signupBtn")?.addEventListener("click", () => openModal(signupModal));

  // Open buttons — mobile
  document.getElementById("mobileLoginBtn")?.addEventListener("click", () => {
    closeMobileMenu();
    openModal(loginModal);
  });
  document.getElementById("mobileSignupBtn")?.addEventListener("click", () => {
    closeMobileMenu();
    openModal(signupModal);
  });

  // Switch between modals
  document.getElementById("goSignup")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(signupModal);
  });

  document.getElementById("goLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal(signupModal);
    openModal(loginModal);
  });

  // ===== Password Toggle =====
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      // Swap icon
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

      if (data.password !== data.confirmPassword) {
        showAuthError(signupModal, "Passwords do not match");
        return;
      }

      setLoading(submitBtn, true, "Creating Account...");

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();

        if (result.success) {
          closeModal(signupModal);
          showAuthSuccess("Account created! Please check your email to verify your account. 🐾");
          form.reset();
        } else {
          showAuthError(signupModal, result.message);
        }
      } catch (err) {
        console.error("Signup failed:", err);
        showAuthError(signupModal, "Something went wrong. Please try again.");
      } finally {
        setLoading(submitBtn, false, "Create Account");
      }
    });
  }

  // ===== Login Form =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector(".auth-submit-btn");

      const formData = {
        email: form.email.value.trim(),
        password: form.password.value,
      };

      setLoading(submitBtn, true, "Logging in...");

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();

        if (result.success) {
          window.location.href = result.redirect;
        } else {
          showAuthError(loginModal, result.message);
        }
      } catch (err) {
        console.error("Login failed:", err);
        showAuthError(loginModal, "Something went wrong. Please try again.");
      } finally {
        setLoading(submitBtn, false, "Login");
      }
    });
  }

  // ===== Contact Form =====
  const message = document.getElementById("message");
  const charCount = document.getElementById("charCount");
  const contactForm = document.getElementById("contactForm");

  if (message && charCount) {
    message.addEventListener("input", () => {
      charCount.textContent = `${message.value.length} / 300 characters`;
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = {
        name: contactForm.querySelector("#name").value,
        email: contactForm.querySelector("#email").value,
        message: contactForm.querySelector("#message").value,
      };

      try {
        const res = await fetch("/api/contact/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();

        if (result.success) {
          const modal = new bootstrap.Modal(document.getElementById("thankYouModal"));
          modal.show();
          contactForm.reset();
          if (charCount) charCount.textContent = "0 / 300 characters";
        } else {
          alert(result.message || "Failed to send message");
        }
      } catch (err) {
        console.error("Contact form error:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }

  // ===== Utility: loading state =====
  function setLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.querySelector("span").textContent = label;
  }

  // ===== Utility: inline auth error =====
  function showAuthError(modal, message) {
    if (!modal) return;
    // Remove any existing error
    modal.querySelectorAll(".auth-error-msg").forEach((el) => el.remove());

    const err = document.createElement("p");
    err.className = "auth-error-msg";
    err.textContent = message;
    err.style.cssText = "color:#d44d7c;font-size:0.85rem;font-weight:600;text-align:center;margin:8px 0 0;animation:authModalIn .2s ease both;";

    const form = modal.querySelector(".auth-form");
    form?.appendChild(err);

    // Auto-remove after 4s
    setTimeout(() => err.remove(), 4000);
  }

  // ===== Utility: success toast =====
  function showAuthSuccess(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #d44d7c;
      color: #fff;
      padding: 14px 28px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 0.95rem;
      z-index: 99999;
      box-shadow: 0 8px 24px rgba(212,77,124,0.35);
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      max-width: 90vw;
      text-align: center;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
});
