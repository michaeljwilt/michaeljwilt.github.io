/* ═══════════════════════════════════════════════════
   Michael Wilt — personal site
   Starfield background, nav, scroll reveals
═══════════════════════════════════════════════════ */

// ─── Footer year ───
document.getElementById('year').textContent = new Date().getFullYear();

// ─── Mobile nav ───
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile-menu');
hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  })
);

// ─── Starfield background ───
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
const STAR_COLORS = ['rgba(45,212,191,', 'rgba(255,180,84,', 'rgba(242,242,250,'];

function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = Math.min(140, Math.floor((canvas.width * canvas.height) / 12000));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.3,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    baseAlpha: Math.random() * 0.5 + 0.15,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.0012 + 0.0004,
    drift: Math.random() * 0.05 + 0.01,
  }));
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawStars(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color + alpha.toFixed(3) + ')';
    ctx.fill();
    s.y -= s.drift;
    if (s.y < -2) s.y = canvas.height + 2;
  }
  if (!reducedMotion) requestAnimationFrame(drawStars);
}

initStars();
window.addEventListener('resize', initStars);
requestAnimationFrame(drawStars);

// ─── Scroll reveals ───
if (window.gsap && window.ScrollTrigger && !reducedMotion) {
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: () => el.classList.add('visible'),
    });
  });
} else {
  // Fallback: show everything
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}
