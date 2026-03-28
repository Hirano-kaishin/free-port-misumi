/* FREE PORT — main.js */

/* ── JS読み込み完了を body に通知 ── */
document.body.classList.add('js-loaded');

/* ── Nav: スクロールで背景を追加 ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── Reveal on scroll ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Mobile menu toggle ── */
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  const isOpen = links.style.display === 'flex';
  links.style.cssText = isOpen
    ? 'display: none'
    : 'display:flex; flex-direction:column; position:fixed; top:72px; left:0; right:0; background:rgba(42,42,42,0.97); padding:32px; gap:24px;';
}
