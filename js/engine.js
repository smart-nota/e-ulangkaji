// ========================================
// GAME KAFA - Game Engine (Versi 3.0)
// Perbaikan:
//  - Status kunci & percubaan dari GAS (bukan localStorage)
//  - Tiada butang "Share" pada skrin penamat
//  - Submit & kunci menggunakan GAS
// ========================================

const ENGINE = {
  currentStage:  1,
  currentQ:      0,
  stageMark:     [0, 0, 0],
  timerInterval: null,
  timeLeft:      20,
  answered:      false,
  userInfo:      {},
  attempts:      0,
  isLocked:      false,

  // ════════════════════════════════
  //  INIT — dipanggil dari halaman game
  // ════════════════════════════════
  async init() {
    const params = new URLSearchParams(window.location.search);
    this.userInfo = {
      nama:      params.get('nama')      || '',
      kelas:     params.get('kelas')     || '',
      topikId:   params.get('topikId')   || '',
      topikNama: params.get('topikNama') || '',
      subjek:    params.get('subjek')    || ''
    };

    // Pastikan nama & kelas ada
    if (!this.userInfo.nama || !this.userInfo.kelas) {
      this.showErrorScreen('Maklumat pengguna tidak lengkap. Sila kembali dan log masuk semula.');
      return;
    }

    this.showLoading('Menyemak status permainan...');

    // Semak status dari GAS
    const status = await this.fetchStatus();
    this.attempts = status.percubaan || 0;
    this.isLocked = status.dikunci   || false;

    // Jika dikunci atau percubaan >= 3 → tunjuk skrin kunci
    if (this.isLocked || this.attempts >= 3) {
      this.showLockedScreen();
      return;
    }

    // Tambah percubaan dalam GAS (fire-and-forget)
    this.addAttemptToSheet();
    this.attempts = this.attempts + 1;

    this.renderGameHeader();
    this.startStage(1);
  },

  // ════════════════════════════════
  //  LOADING SCREEN
  // ════════════════════════════════
  showLoading(msg) {
    const el = document.getElementById('gameArea');
    if (el) {
      el.innerHTML = `
        <div style="text-align:center;padding:60px 24px;color:#64748b">
          <div style="font-size:2.5rem;margin-bottom:16px;animation:spin 1s linear infinite;display:inline-block">⏳</div>
          <p style="font-size:0.95rem;font-weight:600">${msg}</p>
        </div>`;
    }
  },

  // ════════════════════════════════
  //  ERROR SCREEN
  // ════════════════════════════════
  showErrorScreen(msg) {
    const el = document.getElementById('gameArea');
    if (el) {
      el.innerHTML = `
        <div class="result-card">
          <div class="result-emoji">⚠️</div>
          <div class="result-title">Ralat</div>
          <div class="result-msg">${msg}</div>
          <a href="../../index.html" class="btn-next" style="text-decoration:none;display:inline-flex;margin-top:8px">← Kembali</a>
        </div>`;
    }
  },

  // ════════════════════════════════
  //  FETCH STATUS DARI GAS (GET)
  //  GET request — tiada CORS issue
  // ════════════════════════════════
  async fetchStatus() {
    try {
      const url = `${window.GAS_URL}?action=getAttempts`
        + `&nama=${encodeURIComponent(this.userInfo.nama)}`
        + `&kelas=${encodeURIComponent(this.userInfo.kelas)}`
        + `&topik=${encodeURIComponent(this.userInfo.topikId)}`;

      const res  = await fetch(url);
      const data = await res.json();
      return {
        percubaan: parseInt(data.percubaan) || 0,
        dikunci:   data.dikunci === true || data.dikunci === 'TRUE'
      };
    } catch (e) {
      console.warn('Tidak dapat semak status dari GAS:', e);
      return { percubaan: 0, dikunci: false };
    }
  },

  // ════════════════════════════════
  //  TAMBAH PERCUBAAN DALAM GAS (POST)
  //  no-cors + Content-Type text/plain
  // ════════════════════════════════
  addAttemptToSheet() {
    try {
      fetch(window.GAS_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({
          action:  'addAttempt',
          nama:    this.userInfo.nama,
          kelas:   this.userInfo.kelas,
          topikId: this.userInfo.topikId
        })
      });
    } catch (e) {
      console.warn('Tidak dapat tambah percubaan:', e);
    }
  },

  // ════════════════════════════════
  //  HEADER GAME
  // ════════════════════════════════
  renderGameHeader() {
    const el = document.getElementById('gameHeaderInfo');
    if (!el) return;

    const namaPapar = typeof formatNama === 'function'
      ? formatNama(this.userInfo.nama)
      : this.userInfo.nama;

    el.innerHTML = `
      <div class="game-info">
        <h2>${this.userInfo.topikNama}</h2>
        <p>${this.userInfo.subjek} · ${namaPapar}</p>
      </div>
      <div class="stage-indicator" id="stageDots">
        ${[1,2,3].map(s =>
          `<div class="stage-dot ${s === 1 ? 'active' : ''}" id="stageDot${s}" title="Tahap ${s}">T${s}</div>`
        ).join('')}
      </div>`;
  },

  // ════════════════════════════════
  //  MULAKAN TAHAP
  // ════════════════════════════════
  startStage(stage) {
    this.currentStage = stage;
    this.currentQ     = 0;
    this.stageMark[stage - 1] = 0;

    // Kemaskini titik tahap
    for (let s = 1; s <= 3; s++) {
      const dot = document.getElementById('stageDot' + s);
      if (!dot) continue;
      dot.className = 'stage-dot';
      if (s < stage)   dot.classList.add('done');
      if (s === stage) dot.classList.add('active');
    }

    // Bahagikan soalan kepada 3 tahap
    const allSoalan = window.GAME_CONFIG.soalan;
    const perStage  = Math.floor(allSoalan.length / 3);
    const start     = (stage - 1) * perStage;
    this.stageSoalan = allSoalan.slice(start, start + perStage);

    this.renderScoreBar();
    this.renderQuestion();
  },

  // ════════════════════════════════
  //  BAR MARKAH
  // ════════════════════════════════
  renderScoreBar() {
    const el = document.getElementById('scoreBar');
    if (!el) return;
    el.innerHTML = `
      <div class="score-item">
        <div class="s-val">Tahap ${this.currentStage}</div>
        <div class="s-label">Tahap</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-item">
        <div class="s-val" id="markahTahap">${this.stageMark[this.currentStage - 1]}</div>
        <div class="s-label">Markah</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-item">
        <div class="s-val" id="soalanNum">${this.currentQ + 1}/5</div>
        <div class="s-label">Soalan</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-item">
        <div class="s-val" id="timerDisplay">20</div>
        <div class="s-label">Saat</div>
      </div>`;
  },

  // ════════════════════════════════
  //  PAPAR SOALAN
  // ════════════════════════════════
  renderQuestion() {
    const soalan = this.stageSoalan[this.currentQ];
    if (!soalan) return;

    const el = document.getElementById('gameArea');
    if (!el)  return;

    const opts    = this.shuffleOptions([...soalan.pilihan]);
    const letters = ['A', 'B', 'C', 'D'];
    const optHtml = opts.map((opt, i) => `
      <button class="option-btn" data-ans="${this.escHtml(opt)}"
        onclick="ENGINE.selectAnswer('${opt.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
        <span class="option-letter">${letters[i]}</span> ${opt}
      </button>`).join('');

    el.innerHTML = `
      <div class="timer-wrap">
        <div class="timer-label">
          <span>⏱ Masa</span>
          <span class="time-left" id="timeLeftDisplay">20</span>
        </div>
        <div class="timer-bar-bg">
          <div class="timer-bar-fill" id="timerBarFill" style="width:100%"></div>
        </div>
      </div>
      <div class="question-card">
        <div class="q-num">Soalan ${this.currentQ + 1} daripada 5 — Tahap ${this.currentStage}</div>
        <div class="q-text">${soalan.soalan}</div>
        <div class="options-grid">${optHtml}</div>
      </div>`;

    this.answered = false;
    this.startTimer(20);
    this.updateScoreBar();
  },

  escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  updateScoreBar() {
    const mt = document.getElementById('markahTahap');
    const sn = document.getElementById('soalanNum');
    if (mt) mt.textContent = this.stageMark[this.currentStage - 1];
    if (sn) sn.textContent = (this.currentQ + 1) + '/5';
  },

  // ════════════════════════════════
  //  TIMER
  // ════════════════════════════════
  startTimer(seconds) {
    clearInterval(this.timerInterval);
    this.timeLeft = seconds;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        if (!this.answered) this.timeUp();
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const el   = document.getElementById('timeLeftDisplay');
    const bar  = document.getElementById('timerBarFill');
    const disp = document.getElementById('timerDisplay');
    const pct  = (this.timeLeft / 20) * 100;

    if (el) {
      el.textContent = this.timeLeft;
      el.className   = 'time-left';
      if (this.timeLeft <= 5)       el.classList.add('danger');
      else if (this.timeLeft <= 10) el.classList.add('warning');
    }
    if (bar) {
      bar.style.width = pct + '%';
      if (this.timeLeft <= 5) bar.classList.add('warning');
      else bar.classList.remove('warning');
    }
    if (disp) disp.textContent = this.timeLeft;
  },

  timeUp() {
    this.showFeedback(null);
  },

  // ════════════════════════════════
  //  PILIH JAWAPAN
  // ════════════════════════════════
  selectAnswer(ans) {
    if (this.answered) return;
    this.answered = true;
    clearInterval(this.timerInterval);
    this.showFeedback(ans);
  },

  showFeedback(selected) {
    const soalan    = this.stageSoalan[this.currentQ];
    const betul     = soalan.jawapan;
    const isCorrect = selected === betul;

    if (isCorrect) {
      this.stageMark[this.currentStage - 1] += 5;
    }

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.ans === betul)                  btn.classList.add('correct');
      if (btn.dataset.ans === selected && !isCorrect) btn.classList.add('wrong');
    });

    setTimeout(() => this.nextQuestion(), 1400);
  },

  nextQuestion() {
    this.currentQ++;
    if (this.currentQ >= 5) {
      this.endStage();
    } else {
      this.renderQuestion();
    }
  },

  // ════════════════════════════════
  //  TAMAT TAHAP
  // ════════════════════════════════
  endStage() {
    clearInterval(this.timerInterval);
    const mark    = this.stageMark[this.currentStage - 1];
    const isFinal = this.currentStage === 3;

    if (isFinal) {
      this.showFinalResult();
    } else {
      this.showStageResult(mark);
    }
  },

  showStageResult(mark) {
    const msgs  = ['Bagus! Teruskan usaha anda! 💪', 'Hebat! Anda semakin mahir! 🌟', 'Cemerlang! Hampir ke puncak! 🚀'];
    const msg   = mark >= 20 ? msgs[2] : mark >= 10 ? msgs[1] : msgs[0];
    const emoji = mark >= 20 ? '🎉' : mark >= 10 ? '⭐' : '💡';

    document.getElementById('gameArea').innerHTML = `
      <div class="result-card">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title">Tahniah! Tahap ${this.currentStage} Selesai!</div>
        <div class="result-score">${mark} <span>/ 25</span></div>
        <div class="result-detail">${mark >= 20 ? 'Luar biasa!' : mark >= 10 ? 'Baik sekali!' : 'Cuba lagi lebih baik!'} ${msg}</div>
        <button class="btn-next" onclick="ENGINE.startStage(${this.currentStage + 1})">
          Tahap ${this.currentStage + 1} ▶
        </button>
      </div>`;
  },

  // ════════════════════════════════
  //  SKRIN AKHIR — TANPA BUTANG SHARE
  // ════════════════════════════════
  showFinalResult() {
    const total    = this.stageMark.reduce((a, b) => a + b, 0);
    const stars    = total >= 60 ? 3 : total >= 40 ? 2 : 1;
    const starHtml = Array(stars).fill('⭐').map((s, i) =>
      `<span class="star-pop" style="animation-delay:${i * 0.15}s">${s}</span>`
    ).join('');

    const motivasi = [
      'Jangan mudah putus asa. Setiap usaha ada nilainya! 💪',
      'Bagus! Anda berjaya siapkan kesemuanya! 🌟',
      'Luar Biasa! Anda Cemerlang! 🏆✨'
    ];

    // Butang cuba semula — hanya jika belum guna 3 percubaan
    const retryBtn = this.attempts < 3 ? `
      <button class="btn-secondary" onclick="ENGINE.tryAgain()">
        🔄 Cuba Semula (${this.attempts}/3 percubaan)
      </button>` : '';

    document.getElementById('gameArea').innerHTML = `
      <div class="result-card">
        <div class="result-emoji">🏆</div>
        <div class="stars-row">${starHtml}</div>
        <div class="result-title">Tamat! Anda Berjaya!</div>
        <div class="result-score">${total} <span>/ 75</span></div>
        <div class="result-msg">${motivasi[stars - 1]}</div>

        <div class="total-breakdown">
          ${this.stageMark.map((m, i) => `
            <div class="breakdown-row">
              <span class="br-label">Tahap ${i + 1}</span>
              <span class="br-val">${m} / 25</span>
            </div>`).join('')}
          <div class="breakdown-row total-row">
            <span class="br-label" style="font-weight:800;color:var(--primary)">Jumlah</span>
            <span class="br-val" style="font-size:1.1rem;color:var(--primary)">${total} / 75</span>
          </div>
        </div>

        <div class="attempt-info">Percubaan ke: ${this.attempts} / 3</div>

        <div class="final-actions">
          ${retryBtn}
          <button class="btn-success" onclick="ENGINE.confirmSubmit(${total})">
            ✅ Hantar Markah &amp; Selesai
          </button>
        </div>
      </div>`;

    // Tunjuk coffee btn
    const coffeeWrap = document.querySelector('.support-btn-wrapper');
    if (coffeeWrap) coffeeWrap.style.display = 'flex';
  },

  // ════════════════════════════════
  //  CUBA SEMULA
  // ════════════════════════════════
  tryAgain() {
    if (this.attempts >= 3) {
      alert('Maaf! Anda telah menggunakan semua 3 percubaan.');
      return;
    }

    // Tambah percubaan dalam GAS
    this.addAttemptToSheet();
    this.attempts++;

    this.currentStage = 1;
    this.stageMark    = [0, 0, 0];
    this.renderGameHeader();
    this.startStage(1);

    const coffeeWrap = document.querySelector('.support-btn-wrapper');
    if (coffeeWrap) coffeeWrap.style.display = 'none';
  },

  // ════════════════════════════════
  //  HANTAR MARKAH
  // ════════════════════════════════
  confirmSubmit(total) {
    if (confirm(`Anda pasti ingin menghantar markah ${total}/75?\n\nSelepas ini, permainan tidak dapat diulang.`)) {
      this.submitAndLock(total);
    }
  },

  async submitAndLock(total) {
    // Tunjuk status menghantar
    const actionsDiv = document.querySelector('.final-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `<div style="text-align:center;color:#64748b;padding:16px">
        <div style="font-size:1.5rem;margin-bottom:8px">⏳</div>
        <p>Menghantar markah ke pelayan...</p>
      </div>`;
    }

    const payload = {
      action:    'submitMarkah',
      nama:      this.userInfo.nama,
      kelas:     this.userInfo.kelas,
      markah:    total,
      topikId:   this.userInfo.topikId,
      topikNama: this.userInfo.topikNama,
      subjek:    this.userInfo.subjek,
      masa:      new Date().toLocaleDateString('ms-MY'),
      stageMark: this.stageMark
    };

    // Hantar ke GAS
    try {
      await fetch(window.GAS_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('GAS tidak dapat dihubungi:', e);
    }

    // Tunggu sebentar untuk GAS proses
    await new Promise(r => setTimeout(r, 1200));

    alert('✅ Markah anda telah dihantar! Tahniah, ' + (typeof formatNama === 'function'
      ? formatNama(this.userInfo.nama)
      : this.userInfo.nama) + '!');

    // Balik ke halaman utama dengan tab ranking
    const params = new URLSearchParams({
      nama:    this.userInfo.nama,
      kelas:   this.userInfo.kelas,
      tab:     'ranking',
      subjek:  this.userInfo.subjek,
      topikId: this.userInfo.topikId
    });
    window.location.href = '../../index.html?' + params.toString();
  },

  // ════════════════════════════════
  //  SKRIN KUNCI
  // ════════════════════════════════
  showLockedScreen() {
    const el = document.getElementById('gameArea');
    if (el) {
      const sebab = this.isLocked
        ? 'Anda telah menghantar markah untuk topik ini.'
        : 'Anda telah menggunakan semua 3 percubaan untuk topik ini.';

      el.innerHTML = `
        <div class="result-card">
          <div class="result-emoji">🔒</div>
          <div class="result-title">Permainan Terkunci</div>
          <div class="result-msg">${sebab}</div>
          <a href="../../index.html" class="btn-next"
             style="text-decoration:none;display:inline-flex;margin-top:16px">
            ← Kembali ke Utama
          </a>
        </div>`;
    }
  },

  // ════════════════════════════════
  //  HELPER — Kacak pilihan jawapan
  // ════════════════════════════════
  shuffleOptions(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};

// Helper formatNama jika tidak diimport dari data.js
if (typeof formatNama === 'undefined') {
  function formatNama(nama) {
    return nama.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  }
}
