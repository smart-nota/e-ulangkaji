// ============================================
// KAFA KIDS — LOGIN LOGIC
// ============================================

const PASSWORD = 'kafa2026';

// Generate star particles
function createStars() {
  const bg = document.getElementById('starsBg');
  if (!bg) return;
  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    const size = Math.random() * 4 + 1;
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --dur: ${Math.random() * 3 + 2}s;
      animation-delay: ${Math.random() * 4}s;
    `;
    bg.appendChild(star);
  }
}

function togglePass() {
  const inp = document.getElementById('passwordInput');
  const btn = document.getElementById('eyeBtn');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁️';
  }
}

function doLogin() {
  const student = document.getElementById('studentSelect').value;
  const pass = document.getElementById('passwordInput').value;
  const errDiv = document.getElementById('loginError');

  if (!student || pass !== PASSWORD) {
    errDiv.style.display = 'block';
    setTimeout(() => { errDiv.style.display = 'none'; }, 3000);
    return;
  }

  // Save session
  sessionStorage.setItem('kafaStudent', student);
  sessionStorage.setItem('kafaLoggedIn', '1');

  // Animate button
  const btn = document.querySelector('.signin-btn');
  btn.innerHTML = '<span class="btn-text">⏳ Memuatkan...</span>';
  btn.disabled = true;

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 800);
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  createStars();

  document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doLogin();
  });
});