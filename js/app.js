// ========================================
// GAME KAFA - Main Application Logic (v2.0)
// Status pelajar diambil dari Google Sheet
// ========================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwDnalkeOQ_g9eYtKFlaIRsCbx6WG7LK1X1pA6BidjHckNVcIk5CCT7kytIKxQDFXebfQ/exec';

let currentUser   = null; // { nama, kelas, gender }
let activeTab     = 'ujiminda';
let activeSubjek  = 'Sirah';
let playerStatus  = {}; // Cache status semua topik dari Sheet

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  handleReturnFromGame(); // Semak jika kembali dari game
});

// ════════════════════════════════
//  KEMBALI DARI GAME
// ════════════════════════════════
function handleReturnFromGame() {
  const params  = new URLSearchParams(window.location.search);
  const nama    = params.get('nama');
  const kelas   = params.get('kelas');
  const tab     = params.get('tab');

  if (nama && kelas) {
    currentUser = {
      nama,
      kelas,
      gender: getGender(nama)
    };
    // Terus ke dashboard, buka tab ranking jika berkenaan
    showDashboard();
    if (tab === 'ranking') {
      setTimeout(() => {
        const rankBtn = document.querySelector('[data-tab="ranking"]');
        if (rankBtn) rankBtn.click();
      }, 300);
    }
    // Bersihkan URL
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// ════════════════════════════════
//  LOGIN
// ════════════════════════════════
function initLogin() {
  if (currentUser) return; // Dah login (dari handleReturnFromGame)

  const selKelas   = document.getElementById('selKelas');
  const selPelajar = document.getElementById('selPelajar');
  const btnMasuk   = document.getElementById('btnMasuk');

  Object.keys(KELAS_DATA).forEach(kelas => {
    const opt       = document.createElement('option');
    opt.value       = kelas;
    opt.textContent = kelas;
    selKelas.appendChild(opt);
  });

  selKelas.addEventListener('change', () => {
    const kelas = selKelas.value;
    selPelajar.innerHTML = '<option value="">-- Pilih Nama Pelajar --</option>';
    selPelajar.disabled  = !kelas;
    if (kelas) {
      KELAS_DATA[kelas].forEach(nama => {
        const opt       = document.createElement('option');
        opt.value       = nama;
        opt.textContent = formatNama(nama);
        selPelajar.appendChild(opt);
      });
    }
  });

  btnMasuk.addEventListener('click', handleLogin);
}

async function handleLogin() {
  const kelas = document.getElementById('selKelas').value;
  const nama  = document.getElementById('selPelajar').value;

  if (!kelas || !nama) {
    showToast('Sila pilih kelas dan nama pelajar dahulu! 😊');
    return;
  }

  // Disable button semasa loading
  const btn       = document.getElementById('btnMasuk');
  btn.disabled    = true;
  btn.textContent = '⏳ Memuatkan...';

  currentUser = { nama, kelas, gender: getGender(nama) };

  // Muatkan status semua topik dari Sheet
  await loadPlayerStatus();

  document.getElementById('loginScreen').style.display = 'none';
  showDashboard();
}

// ════════════════════════════════
//  MUATKAN STATUS PELAJAR
// ════════════════════════════════
async function loadPlayerStatus() {
  try {
    const url = `${GAS_URL}?action=getAllStatus`
      + `&nama=${encodeURIComponent(currentUser.nama)}`
      + `&kelas=${encodeURIComponent(currentUser.kelas)}`;

    const res  = await fetch(url);
    playerStatus = await res.json();
  } catch (e) {
    console.warn('Tidak dapat ambil status pelajar:', e);
    playerStatus = {}; // Kosong = semua boleh main
  }
}

// ════════════════════════════════
//  DASHBOARD
// ════════════════════════════════
function showDashboard() {
  const sec = document.getElementById('welcomeSection');
  sec.style.display = 'block';

  document.getElementById('avatarWrap').innerHTML = getAvatar(currentUser.nama);
  document.getElementById('namaPelajar').textContent  = formatNama(currentUser.nama);
  document.getElementById('kelasPelajar').textContent = currentUser.kelas;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      activeTab = tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
      if (tab === 'ujiminda') {
        loadPlayerStatus().then(() => renderSubjekButtons('ujiminda'));
      }
      if (tab === 'ranking') renderSubjekButtons('ranking');
    });
  });

  document.getElementById('btnKeluar').addEventListener('click', () => {
    if (confirm('Adakah anda ingin keluar?')) {
      currentUser  = null;
      playerStatus = {};
      location.reload();
    }
  });

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
    const btn         = document.createElement('button');
    btn.className     = 'selector-btn' + (subjek === activeSubjek ? ' active' : '');
    btn.textContent   = subjek;
    btn.addEventListener('click', () => {
      activeSubjek = subjek;
      document.querySelectorAll('#' + tab + 'SubjekRow .selector-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (tab === 'ujiminda') renderTajukGrid('ujiminda', subjek);
      if (tab === 'ranking')  renderRanking(subjek, null);
    });
    container.appendChild(btn);
  });
}

// ════════════════════════════════
//  TAJUK GRID
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
    // Status dari cache Sheet (bukan localStorage)
    const status   = playerStatus[t.id] || { percubaan: 0, dikunci: false };
    const locked   = status.dikunci;
    const attempts = status.percubaan;

    const card    = document.createElement('div');
    card.className = 'topic-card' + (locked ? ' selesai locked' : '');

    // Tunjuk bilangan percubaan yang tinggal
    const attemptLabel = locked
      ? '🔒 Selesai'
      : attempts > 0
        ? `▶ Mula (${attempts}/3 percubaan)`
        : '▶ Mula';

    card.innerHTML = `
      <div class="topic-icon">${t.icon}</div>
      <div class="topic-name">${t.nama}</div>
      <div class="topic-status">${attemptLabel}</div>
    `;

    if (!locked) {
      card.addEventListener('click', () => openGame(t, attempts));
    } else {
      card.addEventListener('click', () => showToast('Permainan ini telah selesai dan dikunci. 🔒'));
    }

    container.appendChild(card);
  });
}

// ════════════════════════════════
//  OPEN GAME
// ════════════════════════════════
function openGame(topik, attempts) {
  if (attempts >= 3) {
    showToast('Maaf, percubaan anda telah habis (3/3). 🔒');
    return;
  }

  const params = new URLSearchParams({
    nama:      currentUser.nama,
    kelas:     currentUser.kelas,
    topikId:   topik.id,
    topikNama: topik.nama,
    subjek:    activeSubjek
  });
  window.location.href = topik.file + '?' + params.toString();
}

// ════════════════════════════════
//  RANKING
// ════════════════════════════════
function renderRanking(subjek, tajuk) {
  const topikList      = SUBJEK_TOPIK[subjek] || [];
  const tajukContainer = document.getElementById('rankingTajukRow');
  const tableWrap      = document.getElementById('rankingTableWrap');
  if (!tajukContainer) return;

  tajukContainer.innerHTML = '';
  topikList.forEach((t, i) => {
    const btn       = document.createElement('button');
    btn.className   = 'selector-btn' + (i === 0 && !tajuk ? ' active' : (tajuk === t.id ? ' active' : ''));
    btn.textContent = t.nama;
    btn.dataset.id  = t.id;
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
    const url  = `${GAS_URL}?action=getRanking&topik=${encodeURIComponent(topikId)}&subjek=${encodeURIComponent(subjek)}`;
    const res  = await fetch(url);
    const data = await res.json();
    renderRankingTable(data, container);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Tidak dapat muatkan ranking. Semak sambungan internet.</p></div>`;
  }
}

function renderRankingTable(data, container) {
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>Belum ada markah lagi. Jadi yang pertama!</p></div>`;
    return;
  }

  data.sort((a, b) => b.markah - a.markah);

  const rows = data.map((d, i) => {
    const rank  = i + 1;
    let medal   = '';
    let rankClass = '';
    if (rank <= 5)        { medal = '🥇'; rankClass = 'rank-1'; }
    else if (rank <= 10)  { medal = '🥈'; rankClass = 'rank-2'; }
    else if (rank <= 15)  { medal = '🥉'; rankClass = 'rank-3'; }

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
          <tr><th>#</th><th>Nama</th><th>Kelas</th><th>Markah</th><th>Tarikh</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
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
