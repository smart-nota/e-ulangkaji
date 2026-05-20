# 📘 PANDUAN TAMBAH GAME BARU — GAME KAFA

## 🗂️ Struktur Fail
```
game-kafa/
├── games/
│   ├── sirah/
│   │   └── biodata-nabi.html     ← Contoh sedia ada
│   ├── ibadah/
│   │   └── [nama-topik].html     ← Tambah di sini
│   └── jawi/
│       └── [nama-topik].html     ← Tambah di sini
└── js/
    └── data.js                   ← Daftarkan topik baru di sini
```

---

## ✅ LANGKAH 1: Daftarkan Topik Baru dalam `js/data.js`

Buka fail `js/data.js`, cari `SUBJEK_TOPIK` dan tambah entri:

```javascript
const SUBJEK_TOPIK = {
  "Sirah": [
    { id: "sirah-biodata-nabi", nama: "Biodata Nabi Muhammad SAW", icon: "🌙", file: "games/sirah/biodata-nabi.html" },
    // ← Tambah topik Sirah baru di sini:
    { id: "sirah-hijrah",       nama: "Peristiwa Hijrah",          icon: "🐫", file: "games/sirah/hijrah.html" },
  ],
  "Ibadah": [
    // ← Tambah topik Ibadah di sini:
    { id: "ibadah-rukun-solat", nama: "Rukun Solat",               icon: "🕌", file: "games/ibadah/rukun-solat.html" },
  ],
  "Jawi": [
    // ← Tambah topik Jawi di sini:
    { id: "jawi-huruf",         nama: "Huruf Hijaiyyah",           icon: "ب", file: "games/jawi/huruf-hijaiyyah.html" },
  ]
};
```

### Peraturan ID:
- Gunakan format: `[subjek]-[nama-topik-tanpa-spasi]`
- Huruf kecil semua, guna tanda `-` untuk pisah perkataan
- Contoh: `ibadah-rukun-islam`, `jawi-huruf-sambung`, `sirah-nabi-ibrahim`

---

## ✅ LANGKAH 2: Cipta Fail Game Baru

Salin fail `games/sirah/biodata-nabi.html` sebagai template, kemudian ubah bahagian berikut:

---

## 📋 PROMPT UNTUK AI (ChatGPT / Claude)

Gunakan prompt di bawah untuk jana soalan bagi topik baru:

---

### 🔵 PROMPT STANDARD GAME KAFA

```
Saya membangunkan web app pendidikan bernama "Game KAFA" untuk pelajar KAFA berumur 8 tahun.

Sila cipta DATA SOALAN untuk satu topik permainan dengan spesifikasi berikut:

**Maklumat Topik:**
- Subjek: [SUBJEK — contoh: Sirah / Ibadah / Jawi]
- Tajuk: [TAJUK — contoh: Biodata Nabi Muhammad SAW]
- ID Topik: [ID — contoh: sirah-biodata-nabi]

**Format Output:**
Sila hasilkan 15 soalan dalam format JavaScript seperti di bawah.
- 5 soalan pertama: Tahap 1 (mudah)
- 5 soalan seterusnya: Tahap 2 (sederhana)
- 5 soalan terakhir: Tahap 3 (mencabar)

**Peraturan Soalan:**
1. Bahasa Melayu sepenuhnya
2. Soalan mestilah objektif (pilihan berganda) — TIADA soalan isian kosong
3. Setiap soalan mempunyai TEPAT 4 pilihan jawapan
4. Hanya 1 jawapan betul
5. Pilihan jawapan mestilah munasabah dan tidak terlalu mudah diteka
6. Sesuai untuk pelajar berumur 8 tahun
7. Soalan berkaitan kandungan sukatan KAFA

**Format Output yang diperlukan (JSON dalam JavaScript):**

soalan: [
  // TAHAP 1
  {
    soalan: "[Teks soalan di sini?]",
    pilihan: ["Jawapan A", "Jawapan B", "Jawapan C", "Jawapan D"],
    jawapan: "Jawapan A"  // <-- mestilah sama persis dengan salah satu pilihan
  },
  // ... 4 soalan lagi untuk Tahap 1
  
  // TAHAP 2
  {
    soalan: "[Teks soalan di sini?]",
    pilihan: ["Jawapan A", "Jawapan B", "Jawapan C", "Jawapan D"],
    jawapan: "Jawapan B"
  },
  // ... 4 soalan lagi untuk Tahap 2
  
  // TAHAP 3
  {
    soalan: "[Teks soalan di sini?]",
    pilihan: ["Jawapan A", "Jawapan B", "Jawapan C", "Jawapan D"],
    jawapan: "Jawapan C"
  },
  // ... 4 soalan lagi untuk Tahap 3
]
```

---

## ✅ LANGKAH 3: Masukkan Soalan dalam Fail Game

Selepas dapat soalan dari AI, buka fail game HTML baru anda dan cari bahagian `window.GAME_CONFIG`, kemudian:

1. Ubah `topikId` → sama dengan ID dalam `data.js`
2. Ubah `topikNama` → nama tajuk penuh
3. Ubah `subjek` → nama subjek
4. Tampal array `soalan` yang dijana AI

**Contoh:**
```javascript
window.GAME_CONFIG = {
  topikId:   'ibadah-rukun-solat',       // ← ubah
  topikNama: 'Rukun Solat',              // ← ubah
  subjek:    'Ibadah',                   // ← ubah

  soalan: [
    // ← tampal soalan dari AI di sini
  ]
};
```

---

## ✅ LANGKAH 4: Kemaskini Path Fail dalam HTML

Dalam fail game baru, pastikan path CSS dan JS betul bergantung pada lokasi fail:

**Jika fail dalam `games/sirah/` atau `games/ibadah/` atau `games/jawi/`:**
```html
<link rel="stylesheet" href="../../css/game.css"/>
<script src="../../js/engine.js"></script>
```

---

## ✅ LANGKAH 5: Test

1. Buka `index.html` dalam pelayar
2. Log masuk dengan nama pelajar
3. Klik tab "Uji Minda"
4. Pilih subjek yang betul
5. Pastikan topik baru muncul
6. Klik topik dan mainkan game

---

## 🔧 TEMPLATE FAIL GAME PENUH

Salin template ini sebagai asas fail game baru:

```html
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>[NAMA TAJUK] | Game KAFA</title>
  <link rel="stylesheet" href="../../css/game.css"/>
</head>
<body>
<div class="game-topbar" id="gameHeaderInfo">
  <a href="../../index.html" class="back-btn">← Kembali</a>
  <div class="game-info">
    <h2>[NAMA TAJUK PENUH]</h2>
    <p>[NAMA SUBJEK] • 3 Tahap • 15 Soalan</p>
  </div>
  <div class="stage-indicator" id="stageDots">
    <div class="stage-dot active" id="stageDot1">T1</div>
    <div class="stage-dot" id="stageDot2">T2</div>
    <div class="stage-dot" id="stageDot3">T3</div>
  </div>
</div>
<div class="score-bar" id="scoreBar"></div>
<div id="gameArea"></div>

<script src="../../js/engine.js"></script>
<script>
window.GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

window.GAME_CONFIG = {
  topikId:   '[id-topik]',
  topikNama: '[Nama Tajuk Penuh]',
  subjek:    '[Nama Subjek]',
  soalan: [
    // TAHAP 1
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "A" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "B" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "C" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "D" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "A" },
    // TAHAP 2
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "B" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "C" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "D" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "A" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "B" },
    // TAHAP 3
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "C" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "D" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "A" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "B" },
    { soalan: "...", pilihan: ["A","B","C","D"], jawapan: "C" },
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  ENGINE.init();
  const coffeeWrap = document.getElementById('coffeeWrap');
  if (coffeeWrap) coffeeWrap.style.display = 'none';
  const origFinal = ENGINE.showFinalResult.bind(ENGINE);
  ENGINE.showFinalResult = function() {
    origFinal();
    if (coffeeWrap) coffeeWrap.style.display = 'flex';
  };
});
</script>
</body>
</html>
```

---

## 📌 Senarai Semak Sebelum Push ke GitHub

- [ ] ID topik dalam `data.js` sama dengan `topikId` dalam fail game
- [ ] Path fail game dalam `data.js` betul (relative dari root)
- [ ] 15 soalan (5 per tahap) lengkap dalam `soalan: []`
- [ ] `jawapan` adalah persis sama dengan salah satu pilihan dalam `pilihan: []`
- [ ] `window.GAS_URL` ditetapkan (atau biar sebagai placeholder)
- [ ] Test dalam pelayar sebelum push
