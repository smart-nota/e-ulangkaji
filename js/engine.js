// ========================================
// GAME KAFA - Game Engine (Versi 2.1)
// Fix: CORS — mode no-cors + Content-Type text/plain
// ========================================

const ENGINE = {
  currentStage: 1,
  currentQ:     0,
  stageMark:    [0, 0, 0],
  timerInterval: null,
  timeLeft:     20,
  answered:     false,
  userInfo:     {},
  attempts:     0,
  isLocked:     false,

  // ── Init ──
  async init() {
    const params = new URLSearchParams(window.location.search);
    this.userInfo = {
      nama:      params.get('nama')      || '',
      kelas:     params.get('kelas')     || '',
      topikId:   params.get('topikId')   || '',
      topikNama: params.get('topikNama') || '',
      subjek:    params.get('subjek')    || ''
    };

    this.showLoading('Menyemak status permainan...');

    const status = await this.fetchStatus();
    this.attempts = status.percubaan;
    this.isLocked = status.dikunci;

    if (this.isLocked || this.attempts >= 3) {
      this.showLockedScreen();
      return;
    }

    const newAttempts = await this.addAttemptToSheet();
    this.attempts = newAttempts;

    this.renderGameHeader();
    this.startStage(1);
  },

  // ── Loading Screen ──
  showLoading(msg) {
    const el = document.getElementById('gameArea');
    if (el) {
      el.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:#64748b">
          <div style="font-size:2.5rem;margin-bottom:12px">⏳</div>
          <p>${msg}</p>
        </div>`;
    }
  },

  // ── Fetch status dari GAS (GET — tiada CORS issue) ──
  async fetchStatus() {
    try {
      const url = `${window.GAS_URL}?action=getAttempts`
        + `&nama=${encodeURIComponent(this.userInfo.nama)}`
        + `&kelas=${encodeURIComponent(this.userInfo.kelas)}`
        + `&topik=${encodeURIComponent(this.userInfo.topikId)}`;

      const res  = await fetch(url);
      const data = await res.json();
      return {
        percubaan: data.percubaan || 0,
        dikunci:   data.dikunci   || false
      };
    } catch (e) {
      console.warn('Tidak dapat semak status dari Sheet:', e);
      return { percubaan: 0, dikunci: false };
    }
  },

  // ── Tambah percubaan dalam GAS ──
  // FIX: tambah mode:'no-cors' + Content-Type:'text/plain'
  async addAttemptToSheet() {
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
    return this.attempts + 1;
  },

  // ── Header ──
  renderGameHeader() {
    const el = document.getElementById('gameHeaderInfo');
    if (!el) return;
    el.innerHTML = `
      <div class="game-info">
        <h2>${this.userInfo.topikNama}</h2>
        <p>${this.userInfo.subjek} • ${formatNama ? formatNama(this.userInfo.nama) : this.userInfo.nama}</p>
      </div>
      <div class="stage-indicator" id="stageDots">
        ${[1,2,3].map(s => `<div class="stage-dot ${s === 1 ? 'active' : ''}" id="stageDot${s}" title="Tahap ${s}">T${s}</div>`).join('')}
      </div>`;
  },

  // ── Stage ──
  startStage(stage) {
    this.currentStage = stage;
    this.currentQ     = 0;
    this.stageMark[stage - 1] = 0;

    for (let s = 1; s <= 3; s++) {
      const dot = document.getElementById('stageDot' + s);
      if (!dot) continue;
      dot.className = 'stage-dot';
      if (s < stage)   dot.classList.add('done');
      if (s === stage) dot.classList.add('active');
    }

    const allSoalan = window.GAME_CONFIG.soalan;
    const perStage  = Math.floor(allSoalan.length / 3);
    const start     = (stage - 1) * perStage;
    this.stageSoalan = allSoalan.slice(start, start + perStage);

    this.renderScoreBar();
    this.renderQuestion();
  },

  // ── Score Bar ──
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

  // ── Question ──
  renderQuestion() {
    const soalan = this.stageSoalan[this.currentQ];
    if (!soalan) return;

    const el = document.getElementById('gameArea');
    if (!el)  return;

    const opts    = this.shuffleOptions([...soalan.pilihan]);
    const letters = ['A', 'B', 'C', 'D'];
    const optHtml = opts.map((opt, i) => `
      <button class="option-btn" data-ans="${opt}" onclick="ENGINE.selectAnswer('${opt.replace(/'/g, "\\'")}')">
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

  updateScoreBar() {
    const mt = document.getElementById('markahTahap');
    const sn = document.getElementById('soalanNum');
    if (mt) mt.textContent = this.stageMark[this.currentStage - 1];
    if (sn) sn.textContent = (this.currentQ + 1) + '/5';
  },

  // ── Timer ──
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

  // ── Answer ──
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

  // ── End Stage ──
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

  showFinalResult() {
    const total    = this.stageMark.reduce((a, b) => a + b, 0);
    const stars    = total >= 60 ? 3 : total >= 40 ? 2 : 1;
    const starHtml = '⭐'.repeat(stars).split('').map((s, i) =>
      `<span class="star-pop" style="animation-delay:${i * 0.1}s">${s}</span>`
    ).join('');

    const motivasi = [
      'Jangan mudah putus asa. Setiap usaha ada nilainya! 💪',
      'Bagus! Anda berjaya siapkan kesemuanya! 🌟',
      'Luar Biasa! Anda Cemerlang! 🏆✨'
    ];

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
          <div class="breakdown-row">
            <span class="br-label" style="font-weight:800;color:var(--primary)">Jumlah</span>
            <span class="br-val" style="font-size:1.1rem">${total} / 75</span>
          </div>
        </div>

        <div class="attempt-info">Percubaan: ${this.attempts}/3</div>

        <div class="final-actions">
          ${this.attempts < 3 ? `
            <button class="btn-secondary" onclick="ENGINE.tryAgain()">
              🔄 Cuba Semula (${this.attempts}/3 percubaan)
            </button>` : ''}
          <button class="btn-success" onclick="ENGINE.confirmSubmit(${total})">
            ✅ Hantar Markah
          </button>
        </div>
      </div>`;

    const coffeeWrap = document.querySelector('.support-btn-wrapper');
    if (coffeeWrap) coffeeWrap.style.display = 'flex';
  },

  // ── Try Again ──
  tryAgain() {
    if (this.attempts >= 3) {
      alert('Maaf! Anda telah menggunakan semua 3 percubaan.');
      return;
    }
    this.currentStage = 1;
    this.stageMark    = [0, 0, 0];
    this.renderGameHeader();
    this.startStage(1);

    const coffeeWrap = document.querySelector('.support-btn-wrapper');
    if (coffeeWrap) coffeeWrap.style.display = 'none';
  },

  // ── Submit ──
  confirmSubmit(total) {
    if (confirm(`Anda pasti ingin menghantar markah ${total}/75? Selepas ini, permainan tidak dapat diulang.`)) {
      this.submitAndLock(total);
    }
  },

  // FIX: tambah mode:'no-cors' + Content-Type:'text/plain'
  async submitAndLock(total) {
    const actionsDiv = document.querySelector('.final-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `<div style="text-align:center;color:#64748b;padding:12px">⏳ Menghantar markah...</div>`;
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

    alert('✅ Markah anda telah dihantar! Tahniah!');

    const params = new URLSearchParams({
      nama:    this.userInfo.nama,
      kelas:   this.userInfo.kelas,
      tab:     'ranking',
      subjek:  this.userInfo.subjek,
      topikId: this.userInfo.topikId
    });
    window.location.href = '../../index.html?' + params.toString();
  },

  // ── Locked Screen ──
  showLockedScreen() {
    const el = document.getElementById('gameArea');
    if (el) {
      el.innerHTML = `
        <div class="result-card">
          <div class="result-emoji">🔒</div>
          <div class="result-title">Permainan Terkunci</div>
          <div class="result-msg">Anda telah menghantar markah atau menggunakan semua 3 percubaan untuk topik ini.</div>
          <a href="../../index.html" class="btn-next" style="text-decoration:none;display:inline-flex;margin-top:8px">← Kembali</a>
        </div>`;
    }
  },

  // ── Helpers ──
  shuffleOptions(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};

function formatNama(nama) {
  return nama.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}
