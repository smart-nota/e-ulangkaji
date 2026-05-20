// ==============================
// KAFA LEARN - Main JS
// ==============================

// Generate stars background
function createStars() {
  const bg = document.getElementById('starsBg');
  if (!bg) return;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star-dot';
    const size = Math.random() * 3 + 1;
    star.style.cssText = `
      width:${size}px; height:${size}px;
      top:${Math.random()*100}%; left:${Math.random()*100}%;
      animation-delay:${Math.random()*4}s;
      animation-duration:${2+Math.random()*3}s;
    `;
    bg.appendChild(star);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  createStars();
});