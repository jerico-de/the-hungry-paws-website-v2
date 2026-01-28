document.addEventListener("DOMContentLoaded", () => {
  // ===== Modal Elements =====
  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginClose = loginModal ? loginModal.querySelector(".booking-close") : null;
  const goSignup = document.getElementById("goSignup");

  const signupModal = document.getElementById("signupModal");
  const signupBtn = document.getElementById("signupBtn");
  const signupClose = signupModal ? signupModal.querySelector(".booking-close") : null;
  const goLogin = document.getElementById("goLogin");

  // ===== Open Modal =====
  if (loginBtn && loginModal) loginBtn.onclick = () => (loginModal.style.display = "flex");
  if (signupBtn && signupModal) signupBtn.onclick = () => (signupModal.style.display = "flex");

  // ===== Close Modal =====
  if (loginClose && loginModal) loginClose.onclick = () => (loginModal.style.display = "none");
  if (signupClose && signupModal) signupClose.onclick = () => (signupModal.style.display = "none");

  // ===== Click outside modal =====
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.style.display = "none";
    if (e.target === signupModal) signupModal.style.display = "none";
  });

  // ===== Switch Sign Up => Login =====
  if (goLogin && signupModal && loginModal) {
    goLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupModal.style.display = "none";
      loginModal.style.display = "flex";
    });
  }

  // ===== Switch Login => Signup =====
  if (goSignup && loginModal && signupModal) {
    goSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginModal.style.display = "none";
      signupModal.style.display = "flex";
    });
  }

  // ===== Signup Form to Backend =====
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) {
    console.error("❌ Signup form not found");
    return;
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;

    const data = {
      fullName: form.fullName.value,
      email: form.email.value,
      contact: form.contact.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
    };

    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await res.json();
        if (result.success) {
          alert("Account created successfully 🐾");
          form.reset();
        } else {
          alert(result.message);
        }
      } else {
        // If we get here, the server sent HTML (likely a 404 or 500 error page)
        const text = await res.text();
        console.error("Server returned non-JSON response:", text);
        alert("Server error: Received HTML instead of JSON. Check the console.");
      }
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Something went wrong. Please try again.");
    }
  });

  // ===== Login Form to Backend ===== //
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = {
        email: e.target.email.value,
        password: e.target.password.value,
      };

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await res.json();

        if (result.success) {
          alert("Login successful 🐾");
          // Redirect to user page
          window.location.href = "/user";
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error("Login failed:", err);
        alert("Something went wrong. Please try again.");
      }
    });
  }
});

// Contact Form
const message = document.getElementById("message");
const charCount = document.getElementById("charCount");
const contactForm = document.getElementById("contactForm");

// Character counter
message.addEventListener("input", () => {
  charCount.textContent = `${message.value.length} / 300 characters`;
});

// Submit handler
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const modal = new bootstrap.Modal(document.getElementById("thankYouModal"));
  modal.show();
  contactForm.reset();
  charCount.textContent = "0 / 300 characters";
});
