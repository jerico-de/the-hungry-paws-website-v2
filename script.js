// Login
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginClose = loginModal.querySelector(".booking-close");
const goSignup = document.getElementById("goSignup");

// SignUp
const signupModal = document.getElementById("signupModal");
const signupBtn = document.getElementById("signupBtn");
const signupClose = signupModal.querySelector(".booking-close");
const goLogin = document.getElementById("goLogin");

// Open Modal
loginBtn.onclick = () => (loginModal.style.display = "flex");
signupBtn.onclick = () => (signupModal.style.display = "flex");

// Close Modal
loginClose.onclick = () => (loginModal.style.display = "none");
signupClose.onclick = () => (signupModal.style.display = "none");

// Click outside modal
window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === signupModal) signupModal.style.display = "none";
});

// Switch Sign Up => Login
if (goLogin) {
  goLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.style.display = "none";
    loginModal.style.display = "flex";
  });
}

// Switch Login => Signup
if (goSignup) {
  goSignup.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "none";
    signupModal.style.display = "flex";
  });
}

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
