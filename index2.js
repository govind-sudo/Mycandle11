/* index2.js — smooth scroll effects only, zero layout changes */

(function () {

  /* ── Scroll progress bar ── */
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'fixed', top: 0, left: 0, height: '3px',
    background: '#7b5e57', zIndex: 9999999,
    width: '0%', pointerEvents: 'none',
    transition: 'width 0.1s linear'
  });
  document.body.appendChild(bar);

  window.addEventListener('scroll', function () {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrolled / total * 100).toFixed(1) + '%';
  }, { passive: true });

  /* ── Nav shrink on scroll ── */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.style.padding    = '5px 22px';
        nav.style.transition = 'padding 0.3s ease';
      } else {
        nav.style.padding    = '10px 30px';
        nav.style.transition = 'padding 0.3s ease';
      }
    }, { passive: true });
  }

  /* ── Hero parallax ── */
  const hero = document.querySelector('header');
  if (hero) {
    window.addEventListener('scroll', function () {
      if (window.scrollY < window.innerHeight) {
        hero.style.backgroundPositionY = (window.scrollY * 0.3) + 'px';
      }
    }, { passive: true });
  }

  /* ── Scroll-triggered fade+slideUp for sections ──
     Uses CSS classes only — does NOT touch width, height, display, grid, flex or any layout prop.
     Only opacity and transform (translateY) are changed, and only on elements
     that are NOT already managed by your existing IntersectionObserver (.reveal, .info-card, .contact-form-box). ── */

  const style = document.createElement('style');
  style.textContent = `
    .js-fade {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.85s ease, transform 0.45s ease;
    }
    .js-fade.js-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  /* Selectors to animate — explicitly excludes contact section elements */
  const targets = [
    '#products-section h2',
    '#about h2',
    '#testimonials h2',
    '#testimonials .section-eyebrow',
    '#testimonials .section-sub',
    '.testi-track-wrapper',
    '.testi-stats',
    '.product-card',
    '.about-card',
    '.cat-section-title',
  ];

  const els = document.querySelectorAll(targets.join(','));
  els.forEach(el => el.classList.add('js-fade'));

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        /* Stagger cards by their index among siblings */
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.js-fade'));
        const i        = siblings.indexOf(entry.target);
        setTimeout(function () {
          entry.target.classList.add('js-visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));

})();