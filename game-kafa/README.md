# 🌙 Game KAFA

Platform pembelajaran interaktif untuk pelajar KAFA Tahun 2.

## 📁 Struktur Projek

```
game-kafa/
├── index.html                    ← Halaman utama (login + dashboard)
├── css/
│   ├── main.css                  ← Gaya utama (login, dashboard, ranking)
│   └── game.css                  ← Gaya enjin permainan
├── js/
│   ├── data.js                   ← Data pelajar + senarai subjek/topik
│   ├── app.js                    ← Logik utama app (login, ranking, navigasi)
│   └── engine.js                 ← Enjin permainan (timer, soalan, markah)
├── games/
│   ├── sirah/
│   │   └── biodata-nabi.html     ← ✅ Game: Biodata Nabi Muhammad SAW
│   ├── ibadah/                   ← (tambah game Ibadah di sini)
│   └── jawi/                     ← (tambah game Jawi di sini)
├── google-apps-script.gs         ← Kod Google Apps Script (Google Sheets)
└── PANDUAN-TAMBAH-GAME.md        ← Panduan tambah game baru
```

## 🚀 Cara Guna

1. **Upload ke GitHub Pages** atau server web mana-mana
2. **Setup Google Sheets** (lihat bahagian bawah)
3. **Buka `index.html`** dalam pelayar

## ⚙️ Setup Google Apps Script

1. Buka Google Sheets baru
2. Klik **Extensions → Apps Script**
3. Padam kod sedia ada, tampal kandungan `google-apps-script.gs`
4. Klik **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Access: **Anyone**
5. Klik Deploy, salin URL
6. Tampal URL dalam:
   - `js/app.js` → `const GAS_URL = '...'`
   - Setiap fail game → `window.GAS_URL = '...'`

## ➕ Tambah Game Baru

Lihat fail **`PANDUAN-TAMBAH-GAME.md`** untuk panduan lengkap.

## ✨ Ciri-ciri

- Login dengan kelas + nama pelajar
- Avatar mengikut jantina (hijab untuk perempuan, kopiah untuk lelaki)
- 3 tahap permainan, 5 soalan setiap tahap
- Masa bergerak (20 saat per soalan)
- Pilihan berganda (tiada menaip)
- 3 percubaan sahaja
- Kunci auto selepas hantar
- Papan ranking dengan medal emas/perak/gangsa
- Simpan markah ke Google Sheets secara auto
- Reka bentuk premium fintech-for-kids
- Mesra handphone dan desktop
