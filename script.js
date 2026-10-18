/**
 * BuraqDev - Interactive Logic & Performance Enhancements
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle & Accessibility
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  function openNav() {
    nav?.classList.add('nav-open');
    navToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = window.innerWidth <= 768 ? 'hidden' : '';
  }

  function closeNav() {
    nav?.classList.remove('nav-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  navToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav?.classList.contains('nav-open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close mobile nav when clicking a link
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (nav?.classList.contains('nav-open') && !nav.contains(e.target)) {
      closeNav();
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('nav-open')) {
      closeNav();
      navToggle?.focus();
    }
  });

  // 2. Active Section Highlighting in Header
  const sections = document.querySelectorAll('section[id], header[id]');
  const navAnchorLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navAnchorLinks.forEach((link) => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // 3. Performance Optimization: Lazy Load Calendly Widget
  let calendlyLoaded = false;
  function loadCalendly() {
    if (calendlyLoaded) return;
    calendlyLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }

  const bookingSection = document.getElementById('booking');
  if (bookingSection && 'IntersectionObserver' in window) {
    const bookingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadCalendly();
          bookingObserver.disconnect();
        }
      });
    }, { rootMargin: '300px' });

    bookingObserver.observe(bookingSection);
  } else {
    // Fallback if IntersectionObserver is unsupported
    window.addEventListener('scroll', loadCalendly, { once: true });
  }

  // If user clicks any Book Call button, ensure Calendly is loaded immediately
  document.querySelectorAll('a[href*="calendly.com"], a[href="#booking"]').forEach((cta) => {
    cta.addEventListener('click', () => {
      loadCalendly();
    });
  });

  // 4. Smooth Accordion Handling
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) {
            other.removeAttribute('open');
          }
        });
      }
    });
  });

  // 5. Dynamic Google Reviews Fetcher (Option 2 - /api/reviews)
  async function loadGoogleReviews() {
    const grid = document.getElementById('google-reviews-grid');
    const liveScore = document.getElementById('google-live-score');
    const liveCount = document.getElementById('google-live-count');

    if (!grid) return;

    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) return;

      const data = await res.json();
      if (!data || !data.reviews || data.reviews.length === 0) return;

      if (data.rating && liveScore) {
        liveScore.textContent = Number(data.rating).toFixed(1);
      }
      if (data.totalReviews && liveCount) {
        liveCount.textContent = `${data.totalReviews}+`;
      }

      // If live Google reviews are returned, dynamically hydrate the grid
      if (data.source === 'google_live') {
        grid.innerHTML = data.reviews.map((rev) => {
          const starsHtml = '★'.repeat(Math.min(5, Math.max(1, rev.rating || 5)));
          const avatarHtml = rev.profile_photo_url
            ? `<img src="${rev.profile_photo_url}" alt="${escapeHtml(rev.author_name)}" class="testimonial-avatar testimonial-avatar-image" loading="lazy">`
            : `<div class="testimonial-avatar" aria-hidden="true">${(rev.author_name || 'C').charAt(0).toUpperCase()}</div>`;
          const subText = rev.relative_time_description || rev.role || 'Google Review';

          return `
            <blockquote class="testimonial-card">
              <div class="testimonial-card-top">
                <div class="testimonial-stars" aria-label="${rev.rating} stars">${starsHtml}</div>
                <span class="verified-source-tag">
                  <span class="verified-check">✓</span> Google Verified
                </span>
              </div>
              <p class="testimonial-quote">"${escapeHtml(rev.text)}"</p>
              <footer class="testimonial-author">
                ${avatarHtml}
                <div class="testimonial-meta">
                  <span class="author-name">${escapeHtml(rev.author_name)}</span>
                  <span class="author-role">${escapeHtml(subText)}</span>
                </div>
              </footer>
            </blockquote>
          `;
        }).join('');
      }
    } catch (e) {
      console.debug('Dynamic reviews notice (serving pre-rendered baseline):', e);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Fetch reviews when page loads
  loadGoogleReviews();
});
