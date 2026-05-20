// ============================================
// KAFA KIDS — GAME ENGINE (shared)
// ============================================

const SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwVQl3ne0OZzV9wC7bHlViO-OVDn8UYI5YAOD10kc8EvLqE0PgNE69pZMUH0pIJbpO_/exec';

const TIMER_PER_Q = 20; // seconds per question
const QUESTIONS_PER_LEVEL = 5;
const MAX_ATTEMPTS = 2;

const MOTIVASI_GAGAL = [
  { emoji: '💪', msg: 'Jangan putus asa! Cuba lagi, kamu pasti boleh!' },
  { emoji: '🌈', msg: 'Setiap kegagalan adalah pelajaran. Teruskan usaha!' },
  { emoji: '🦁', msg: 'Orang hebat tidak menyerah! Ulang dan buat lebih baik!' },
  { emoji: '⭐', msg: 'Kamu hampir berjaya! Cuba sekali lagi dengan yakin!' },
];

const MOTIVASI_BERJAYA = [
  { emoji: '🎉', msg: 'Luar biasa! Teruskan semangat perjuangan!' },
  { emoji: '🌟', msg: 'Syabas! Kamu semakin hebat setiap hari!' },
  { emoji: '🏆', msg: 'Cemerlang! Nabi Muhammad SAW suka umatnya yang belajar!' },
  { emoji: '🚀', msg: 'Mantap! Terus ke peringkat seterusnya!' },
];

class KafaGame {
  constructor(topicId, subj, allLevels) {
    this.topicId = topicId;
    this.subj = subj;
    this.allLevels = allLevels; // array of 3 arrays, each 5 questions
    this.currentLevel = 0;
    this.currentQ = 0;
    this.score = 0;
    this.levelScores = [0, 0, 0];
    this.levelTimes = [0, 0, 0];
    this.totalTime = 0;
    this.levelStartTime = null;
    this.timerInterval = null;
    this.timeLeft = TIMER_PER_Q;
    this.answered = false;
    this.attempts = this.loadAttempts();
    this.student = sessionStorage.getItem('kafaStudent') || 'Pelajar';
  }

  loadAttempts() {
    const key = `kafaAttempts_${this.topicId}`;
    return parseInt(localStorage.getItem(key) || '0');
  }

  saveAttempts() {
    const key = `kafaAttempts_${this.topicId}`;
    localStorage.setItem(key, this.attempts);
  }

  canPlay() {
    return this.attempts < MAX_ATTEMPTS;
  }

  getRemainingAttempts() {
    return Math.max(0, MAX_ATTEMPTS - this.attempts);
  }

  getCurrentQuestions() {
    return this.allLevels[this.currentLevel];
  }

  getCurrentQuestion() {
    return this.getCurrentQuestions()[this.currentQ];
  }

  startLevel() {
    this.currentQ = 0;
    this.levelStartTime = Date.now();
    this.renderQuestion();
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timeLeft = TIMER_PER_Q;
    this.updateTimerUI();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerUI();
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        if (!this.answered) this.handleAnswer(null);
      }
    }, 1000);
  }

  updateTimerUI() {
    const numEl = document.getElementById('timerNum');
    const fillEl = document.getElementById('timerFill');
    if (numEl) numEl.textContent = this.timeLeft;
    if (fillEl) {
      const circ = 2 * Math.PI * 30;
      const offset = circ * (1 - this.timeLeft / TIMER_PER_Q);
      fillEl.style.strokeDashoffset = offset;
      fillEl.style.strokeDasharray = circ;

      if (this.timeLeft <= 5) fillEl.style.stroke = '#F44336';
      else if (this.timeLeft <= 10) fillEl.style.stroke = '#FF8A65';
      else fillEl.style.stroke = '#FFD700';
    }
  }

  renderQuestion() {
    const q = this.getCurrentQuestion();
    const qNum = this.currentQ + 1;
    const total = QUESTIONS_PER_LEVEL;

    document.getElementById('qProgress').textContent = `Soalan ${qNum} / ${total}`;
    document.getElementById('qText').textContent = q.soalan;
    document.getElementById('scoreVal').textContent = this.score;
    document.getElementById('levelVal').textContent = this.currentLevel + 1;

    this.answered = false;
    const grid = document.getElementById('optionsGrid');

    // Shuffle options
    const opts = [...q.pilihan].sort(() => Math.random() - 0.5);
    grid.innerHTML = opts.map((opt, i) => `
      <button class="option-btn" onclick="game.handleAnswer('${escapeHtml(opt)}')" id="opt${i}">
        ${opt}
      </button>
    `).join('');
  }

  handleAnswer(chosen) {
    if (this.answered) return;
    this.answered = true;
    clearInterval(this.timerInterval);

    const q = this.getCurrentQuestion();
    const correct = q.jawapan;
    const isCorrect = chosen === correct;

    // Highlight buttons
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent.trim() === correct) btn.classList.add('correct');
      else if (btn.textContent.trim() === chosen && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
      this.score += 10;
      this.levelScores[this.currentLevel] += 10;
      playSound('correct');
    } else {
      playSound('wrong');
    }

    document.getElementById('scoreVal').textContent = this.score;

    setTimeout(() => {
      this.currentQ++;
      if (this.currentQ >= QUESTIONS_PER_LEVEL) {
        this.finishLevel();
      } else {
        this.renderQuestion();
        this.startTimer();
      }
    }, 1200);
  }

  finishLevel() {
    const elapsed = Math.round((Date.now() - this.levelStartTime) / 1000);
    this.levelTimes[this.currentLevel] = elapsed;
    this.totalTime += elapsed;

    const passed = this.levelScores[this.currentLevel] >= 30; // 3/5 correct to pass

    if (passed) {
      this.showSuccessPopup(elapsed);
    } else {
      this.showFailPopup(elapsed);
    }
  }

  showSuccessPopup(elapsed) {
    const mot = MOTIVASI_BERJAYA[Math.floor(Math.random() * MOTIVASI_BERJAYA.length)];
    const isLast = this.currentLevel >= 2;

    const html = `
      <div class="popup-overlay" id="popup">
        <div class="popup-card">
          <span class="popup-emoji">${isLast ? '🏆' : mot.emoji}</span>
          <div class="popup-title">${isLast ? 'Tahniah! Selesai!' : 'Tahap Lepas! 🎉'}</div>
          <p class="popup-sub">${isLast ? 'Kamu telah berjaya menyempurnakan semua tahap!' : mot.msg}</p>
          <div class="popup-score">
            <div class="popup-score-item">
              <span class="popup-score-val gold">${this.levelScores[this.currentLevel]}</span>
              <span class="popup-score-lbl">Markah</span>
            </div>
            <div class="popup-score-item">
              <span class="popup-score-val blue">${formatTime(elapsed)}</span>
              <span class="popup-score-lbl">Masa</span>
            </div>
          </div>
          ${isLast
            ? `<button class="popup-btn primary" onclick="game.submitAndFinish()">🏠 Hantar & Selesai</button>`
            : `<button class="popup-btn primary" onclick="game.nextLevel()">➡️ Seterusnya</button>`
          }
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    if (isLast) launchConfetti();
  }

  showFailPopup(elapsed) {
    const mot = MOTIVASI_GAGAL[Math.floor(Math.random() * MOTIVASI_GAGAL.length)];
    this.attempts++;
    this.saveAttempts();
    const remaining = this.getRemainingAttempts();

    const html = `
      <div class="popup-overlay" id="popup">
        <div class="popup-card">
          <span class="popup-emoji">${mot.emoji}</span>
          <div class="popup-title">Teruskan Usaha!</div>
          <p class="popup-sub">${mot.msg}<br><br>
            <strong style="color:var(--gold-light)">Percubaan tersisa: ${remaining}</strong>
          </p>
          <div class="popup-score">
            <div class="popup-score-item">
              <span class="popup-score-val gold">${this.levelScores[this.currentLevel]}</span>
              <span class="popup-score-lbl">Markah</span>
            </div>
            <div class="popup-score-item">
              <span class="popup-score-val blue">${formatTime(elapsed)}</span>
              <span class="popup-score-lbl">Masa</span>
            </div>
          </div>
          ${remaining > 0
            ? `<button class="popup-btn primary" onclick="game.retry()">🔄 Ulang Semula</button>`
            : `<button class="popup-btn primary" onclick="goBack()">🏠 Kembali</button>`
          }
          <button class="popup-btn secondary" onclick="goBack()">📚 Dashboard</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  nextLevel() {
    document.getElementById('popup')?.remove();
    this.currentLevel++;
    this.updateLevelDots();
    this.startLevel();
  }

  retry() {
    document.getElementById('popup')?.remove();
    this.score = 0;
    this.levelScores = [0, 0, 0];
    this.levelTimes = [0, 0, 0];
    this.totalTime = 0;
    this.currentLevel = 0;
    this.updateLevelDots();
    this.startLevel();
  }

  async submitAndFinish() {
    document.getElementById('popup')?.remove();

    // Load existing scores for this student/topic
    const rankKey = `kafaRanking_${this.subj}`;
    const existing = JSON.parse(localStorage.getItem(rankKey) || '[]');

    // Check if student already has an entry — keep highest
    const idx = existing.findIndex(r => r.name === this.student && r.topicId === this.topicId);
    const entry = {
      name: this.student,
      topicId: this.topicId,
      score: this.score,
      time: this.totalTime,
      date: new Date().toLocaleDateString('ms-MY')
    };

    if (idx >= 0) {
      if (this.score > existing[idx].score || (this.score === existing[idx].score && this.totalTime < existing[idx].time)) {
        existing[idx] = entry;
      }
    } else {
      existing.push(entry);
    }

    localStorage.setItem(rankKey, JSON.stringify(existing));

    // Try send to Google Sheet
    try {
      await fetch(SHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveScore',
          subject: this.subj,
          topicId: this.topicId,
          name: this.student,
          score: this.score,
          time: this.totalTime,
          date: entry.date
        })
      });
    } catch (e) {
      console.log('Sheet not configured, saved locally.');
    }

    // Show final card
    const html = `
      <div class="popup-overlay" id="popup">
        <div class="popup-card">
          <span class="popup-emoji">🏆</span>
          <div class="popup-title">Rekod Disimpan!</div>
          <p class="popup-sub">Markah kamu telah dicatat dalam senarai ranking.</p>
          <div class="popup-score">
            <div class="popup-score-item">
              <span class="popup-score-val gold">${this.score}</span>
              <span class="popup-score-lbl">Jumlah Markah</span>
            </div>
            <div class="popup-score-item">
              <span class="popup-score-val blue">${formatTime(this.totalTime)}</span>
              <span class="popup-score-lbl">Jumlah Masa</span>
            </div>
          </div>
          <button class="popup-btn primary" onclick="goBack()">🏠 Kembali ke Dashboard</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    launchConfetti();
  }

  updateLevelDots() {
    document.querySelectorAll('.level-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < this.currentLevel) dot.classList.add('done');
      else if (i === this.currentLevel) dot.classList.add('active');
    });
  }

  checkAttemptsAndStart() {
    if (!this.canPlay()) {
      showNoAttemptsUI();
      return;
    }
    this.updateLevelDots();
    this.startLevel();
  }
}

// ---- Utilities ----
function escapeHtml(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function goBack() {
  window.location.href = '../../dashboard.html';
}

function showNoAttemptsUI() {
  const content = document.getElementById('gameMainContent');
  if (content) {
    content.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem;">
        <div style="font-size:4rem; margin-bottom:1rem">🚫</div>
        <div style="font-family:var(--ff-display); font-size:1.5rem; color:var(--gold); margin-bottom:0.8rem">Percubaan Habis</div>
        <p style="color:var(--text-dim); font-size:0.9rem; margin-bottom:1.5rem">
          Kamu telah menggunakan 2 percubaan. Hubungi guru untuk buka semula.
        </p>
        <button class="popup-btn primary" onclick="goBack()" style="max-width:260px; margin:0 auto">🏠 Kembali</button>
      </div>
    `;
  }
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
    }
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function launchConfetti() {
  const colors = ['#FFD700', '#FF8A65', '#42A5F5', '#AB47BC', '#4CAF50', '#FF7043'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${Math.random() * 8 + 6}px;
        height: ${Math.random() * 8 + 6}px;
        animation-duration: ${Math.random() * 2 + 2}s;
        animation-delay: ${Math.random() * 0.5}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }, i * 30);
  }
}