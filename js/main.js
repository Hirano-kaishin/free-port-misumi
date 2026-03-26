/* =============================================
   FREE PORT â CafÃ© & Outdoor | ä¸è§è¥¿æ¸¯
   main.js
   ============================================= */

/* ââ Nav: ã¹ã¯ã­ã¼ã«ã§è¥²æ¢ãè¿å  ââ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ââ Reveal on scroll (IntersectionObserver) ââ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ââ Mobile menu toggle ââ */
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  const isOpen = links.style.display === 'flex';
  links.style.cssText = isOpen
    ? 'display: none'
    : 'display:flex; flex-direction:column; position:fixed; top:72px; left:0; right:0; background:rgba(42,42,42,0.97); padding:32px; gap:24px;';
}
