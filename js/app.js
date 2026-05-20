// ========================================
// GAME KAFA - Main Application Logic
// ========================================

// ── Google Apps Script URL (gantikan dengan URL anda) ──
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwqS_zYmSlsaA5rCed753WQ2EOIUg1dff4u85jCh1NABd_OUZm9z7GfhRlbGwQ38vabow/exec';

// ── State ──
let currentUser = null; // { nama, kelas, gender }
let activeTab    = 'ujiminda';
let activeSubjek = 'Sirah';
let activeTajuk  = null;

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  renderCoffeeBtn();
});

// ════════════════════════════════
//  LOGIN / AKSES
// ════════════════════════════════
function initLogin() {
  const selKelas = document.getElementById('selKelas');
  const selPelajar = document.getElementById('selPelajar');
  const btnMasuk = document.getElementById('btnMasuk');

  // Populate kelas
  Object.keys(KELAS_DATA).forEach(kelas => {
    const opt = document.createElement('option');
    opt.value = kelas;
    opt.textContent = kelas;
    selKelas.appendChild(opt);
  });

  selKelas.addEventListener('change', () => {
    const kelas = selKelas.value;
    selPelajar.innerHTML = '<option value="">-- Pilih Nama Pelajar --</option>';
    selPelajar.disabled = !kelas;
    if (kelas) {
      KELAS_DATA[kelas].forEach(nama => {
        const opt = document.createElement('option');
        opt.value = nama;
        opt.textContent = formatNama(nama);
        selPelajar.appendChild(opt);
      });
    }
  });

  btnMasuk.addEventListener('click', handleLogin);
}

function handleLogin() {
  const kelas = document.getElementById('selKelas').value;
  const nama  = document.getElementById('selPelajar').value;
  if (!kelas || !nama) {
    showToast('Sila pilih kelas dan nama pelajar dahulu! 😊');
    return;
  }
  currentUser = { nama, kelas, gender: getGender(nama) };
  document.getElementById('loginScreen').style.display = 'none';
  showDashboard();
}

// ════════════════════════════════
//  DASHBOARD
// ════════════════════════════════
function showDashboard() {
  const sec = document.getElementById('welcomeSection');
  sec.style.display = 'block';

  // Welcome card
  document.getElementById('avatarWrap').innerHTML = getAvatar(currentUser.nama);
  document.getElementById('namaPelajar').textContent = formatNama(currentUser.nama);
  document.getElementById('kelasPelajar').textContent = currentUser.kelas;

  // Tab listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      activeTab = tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
      if (tab === 'ujiminda') renderSubjekButtons('ujiminda');
      if (tab === 'ranking') renderSubjekButtons('ranking');
    });
  });

  // Keluar
  document.getElementById('btnKeluar').addEventListener('click', () => {
    if (confirm('Adakah anda ingin keluar?')) {
      currentUser = null;
      location.reload();
    }
  });

  // Init tabs
  renderSubjekButtons('ujiminda');
  renderSubjekButtons('ranking');
  renderTajukGrid('ujiminda', activeSubjek);
  renderRanking(activeSubjek, null);
}

// ════════════════════════════════
//  SUBJEK BUTTONS
// ════════════════════════════════
function renderSubjekButtons(tab) {
  const container = document.getElementById(tab + 'SubjekRow');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(SUBJEK_TOPIK).forEach(subjek => {
    const btn = document.createElement('button');
    btn.className = 'selector-btn' + (subjek === activeSubjek ? ' active' : '');
    btn.textContent = subjek;
    btn.addEventListener('click', () => {
      activeSubjek = subjek;
      document.querySelectorAll('#' + tab + 'SubjekRow .selector-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (tab === 'ujiminda') renderTajukGrid('ujiminda', subjek);
      if (tab === 'ranking') renderRanking(subjek, null);
    });
    container.appendChild(btn);
  });
}

// ════════════════════════════════
//  TAJUK GRID (UJI MINDA)
// ════════════════════════════════
function renderTajukGrid(tab, subjek) {
  const container = document.getElementById('tajukGrid');
  if (!container) return;
  container.innerHTML = '';
  const topik = SUBJEK_TOPIK[subjek] || [];

  if (topik.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p>Topik akan ditambah tidak lama lagi.</p></div>`;
    return;
  }

  topik.forEach(t => {
    const locked = isGameLocked(t.id);
    const selesai = locked;
    const card = document.createElement('div');
    card.className = 'topic-card' + (selesai ? ' selesai' : '') + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="topic-icon">${t.icon}</div>
      <div class="topic-name">${t.nama}</div>
      <div class="topic-status">${locked ? '🔒 Selesai' : '▶ Mula'}</div>
    `;
    if (!locked) {
      card.addEventListener('click', () => openGame(t));
    } else {
      card.addEventListener('click', () => showToast('Permainan ini telah selesai dan dikunci. 🔒'));
    }
    container.appendChild(card);
  });
}

// ════════════════════════════════
//  OPEN GAME
// ════════════════════════════════
function openGame(topik) {
  // Semak percubaan
  const attempts = getAttempts(topik.id);
  if (attempts >= 3) {
    showToast('Maaf, percubaan anda telah habis (3/3). 🔒');
    return;
  }
  // Pass user data + topik to game page
  const params = new URLSearchParams({
    nama: currentUser.nama,
    kelas: currentUser.kelas,
    topikId: topik.id,
    topikNama: topik.nama,
    subjek: activeSubjek
  });
  window.location.href = topik.file + '?' + params.toString();
}

// ════════════════════════════════
//  RANKING
// ════════════════════════════════
function renderRanking(subjek, tajuk) {
  const topikList = SUBJEK_TOPIK[subjek] || [];
  const tajukContainer = document.getElementById('rankingTajukRow');
  const tableWrap = document.getElementById('rankingTableWrap');
  if (!tajukContainer) return;

  tajukContainer.innerHTML = '';
  topikList.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'selector-btn' + (i === 0 && !tajuk ? ' active' : (tajuk === t.id ? ' active' : ''));
    btn.textContent = t.nama;
    btn.dataset.id = t.id;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rankingTajukRow .selector-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadRankingTable(t.id, subjek, tableWrap);
    });
    tajukContainer.appendChild(btn);
  });

  if (topikList.length > 0) {
    loadRankingTable(topikList[0].id, subjek, tableWrap);
  } else {
    tableWrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>Tiada data ranking lagi.</p></div>`;
  }
}

async function loadRankingTable(topikId, subjek, container) {
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Memuatkan ranking...</p></div>`;
  try {
    const url = `${GAS_URL}?action=getRanking&topik=${encodeURIComponent(topikId)}&subjek=${encodeURIComponent(subjek)}`;
    const res = await fetch(url);
    const data = await res.json();
    renderRankingTable(data, container);
  } catch (e) {
    // Fallback: data tempatan dari localStorage
    const localData = getLocalRanking(topikId);
    renderRankingTable(localData, container);
  }
}

function renderRankingTable(data, container) {
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>Belum ada markah lagi. Jadi yang pertama!</p></div>`;
    return;
  }
  // Sort by markah desc
  data.sort((a, b) => b.markah - a.markah);

  let rows = data.map((d, i) => {
    const rank = i + 1;
    let medal = '';
    let rankClass = '';
    if (rank <= 5)      { medal = '🥇'; rankClass = 'rank-1'; }
    else if (rank <= 10) { medal = '🥈'; rankClass = 'rank-2'; }
    else if (rank <= 15) { medal = '🥉'; rankClass = 'rank-3'; }

    // Highlight current user
    const isMe = d.nama === currentUser?.nama && d.kelas === currentUser?.kelas;
    return `
      <tr style="${isMe ? 'background:rgba(37,99,168,0.06);font-weight:800;' : ''}">
        <td><span class="rank-num ${rankClass}">${rank}</span> ${medal}</td>
        <td>${formatNama(d.nama)}</td>
        <td>${d.kelas}</td>
        <td><b>${d.markah}</b><span style="color:var(--text-muted);font-size:0.8rem">/75</span></td>
        <td style="color:var(--text-muted);font-size:0.8rem">${d.masa || '-'}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="ranking-table-wrap">
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Markah</th>
            <th>Tarikh</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ════════════════════════════════
//  ATTEMPTS (PERCUBAAN)
// ════════════════════════════════
function getAttempts(topikId) {
  const key = `kafa_attempts_${currentUser?.nama}_${topikId}`;
  return parseInt(localStorage.getItem(key) || '0');
}

function addAttempt(topikId) {
  const key = `kafa_attempts_${currentUser?.nama}_${topikId}`;
  const current = getAttempts(topikId);
  localStorage.setItem(key, current + 1);
  return current + 1;
}

function isGameLocked(topikId) {
  const key = `kafa_lock_${currentUser?.nama}_${topikId}`;
  return localStorage.getItem(key) === 'locked';
}

function lockGame(topikId) {
  const key = `kafa_lock_${currentUser?.nama}_${topikId}`;
  localStorage.setItem(key, 'locked');
}

// ════════════════════════════════
//  LOCAL RANKING
// ════════════════════════════════
function getLocalRanking(topikId) {
  try {
    return JSON.parse(localStorage.getItem('kafa_ranking_' + topikId) || '[]');
  } catch { return []; }
}

function saveLocalRanking(topikId, entry) {
  const data = getLocalRanking(topikId);
  // Gantikan jika nama+kelas sama (ambil markah terbaik)
  const idx = data.findIndex(d => d.nama === entry.nama && d.kelas === entry.kelas);
  if (idx >= 0) {
    if (entry.markah > data[idx].markah) data[idx] = entry;
  } else {
    data.push(entry);
  }
  localStorage.setItem('kafa_ranking_' + topikId, JSON.stringify(data));
}

// ════════════════════════════════
//  SUBMIT MARKAH KE GAS
// ════════════════════════════════
async function submitMarkah(payload) {
  // Simpan lokal dulu
  saveLocalRanking(payload.topikId, {
    nama: payload.nama,
    kelas: payload.kelas,
    markah: payload.markah,
    masa: new Date().toLocaleDateString('ms-MY')
  });

  // Cuba hantar ke GAS
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('GAS tidak dapat dihubungi. Markah disimpan secara lokal.');
  }
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ════════════════════════════════
//  COFFEE BUTTON
// ════════════════════════════════
function renderCoffeeBtn() {
  // Already in HTML, nothing to do here
}

// Show/hide coffee btn during game (called by game pages)
function hideCoffeeBtn() {
  const el = document.querySelector('.support-btn-wrapper');
  if (el) el.classList.add('hidden');
}
function showCoffeeBtn() {
  const el = document.querySelector('.support-btn-wrapper');
  if (el) el.classList.remove('hidden');
}
