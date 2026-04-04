// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

navToggle?.addEventListener('click', () => {
  nav.classList.toggle('nav-open');
  navToggle.setAttribute('aria-expanded', nav.classList.contains('nav-open'));
});

// Close nav when clicking a link
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('nav-open');
  });
});

// Booking form submit
const bookingForm = document.querySelector('.booking-form');
bookingForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  // Replace with your form handler (e.g., Formspree, Netlify Forms, API)
  alert('Thanks! We\'ll be in touch shortly. Replace this with your form handler.');
});
