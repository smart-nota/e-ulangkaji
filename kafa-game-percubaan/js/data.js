// ========================================
// GAME KAFA - Data Pelajar
// Tambah / edit nama pelajar di sini
// ========================================

const KELAS_DATA = {
  "Percubaan": [
    "AHMAD SYAKIR AZFAR BIN SABRI",
    "AMIRASURIATI BINTI MOHD ISHAK",
    "HAMIRA BINTI MAT KELAI",
    "MUHAMMAD FAHIMI BIN MD ANUAR",
    "NUR AISYAH AFIFAH BINTI ZUNAIDI",
    "NUR ASYIQIN BT AZMI",
    "NURAISYAH AFIQAH BINTI ZUNAIDI",
    "NURUL ALYA NAJEBA BINTI SHAHRUDIN",
    "NURUL AMIRAH BINTI MOHD ADNAN",
    "RUSNAH BINTI ZAKARIA",
    "SYED MUHAMMAD AYOB BIN SAYED RAZAMAN",
    "TUAN AHMAD SUHARDIE BIN TUAN SAIDI",
    "TUAN NUR AZLINA BINTI TUAN ARIFFIN",
    "UMMI MAISARAH BINTI RAMLI",
    ]
};

// Tentukan jantina berdasarkan nama (BIN = lelaki, BINTI = perempuan)
function getGender(name) {
  const upper = name.toUpperCase();
  if (upper.includes(' BINTI ') || upper.includes(' BINTE ')) return 'perempuan';
  return 'lelaki';
}

// Avatar berdasarkan jantina
function getAvatar(name) {
  const gender = getGender(name);
  if (gender === 'perempuan') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="56" height="56">
      <!-- Badan -->
      <ellipse cx="40" cy="70" rx="22" ry="14" fill="#a78bfa"/>
      <!-- Kepala -->
      <circle cx="40" cy="34" r="18" fill="#fcd9b6"/>
      <!-- Hijab -->
      <ellipse cx="40" cy="30" rx="21" ry="13" fill="#7c3aed"/>
      <ellipse cx="40" cy="42" rx="24" ry="10" fill="#7c3aed"/>
      <!-- Muka -->
      <circle cx="35" cy="34" r="2" fill="#374151"/>
      <circle cx="45" cy="34" r="2" fill="#374151"/>
      <path d="M36 40 Q40 44 44 40" stroke="#374151" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="56" height="56">
      <!-- Badan -->
      <ellipse cx="40" cy="70" rx="22" ry="14" fill="#60a5fa"/>
      <!-- Kepala -->
      <circle cx="40" cy="36" r="18" fill="#fcd9b6"/>
      <!-- Kopiah -->
      <ellipse cx="40" cy="20" rx="18" ry="7" fill="#1e293b"/>
      <rect x="22" y="18" width="36" height="6" rx="3" fill="#1e293b"/>
      <!-- Muka -->
      <circle cx="35" cy="36" r="2" fill="#374151"/>
      <circle cx="45" cy="36" r="2" fill="#374151"/>
      <path d="M36 42 Q40 46 44 42" stroke="#374151" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }
}

// Format nama: capitalize tiap perkataan
function formatNama(nama) {
  return nama.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

// Senarai subjek dan tajuk
const SUBJEK_TOPIK = {
  "Sirah": [
    { id: "sirah-biodata-nabi", nama: "Biodata Nabi Muhammad SAW", icon: "🌙", file: "games/sirah/biodata-nabi.html" },
    // Tambah tajuk Sirah di sini
  ],
  "Ibadah": [
    // Tambah tajuk Ibadah di sini
    // Contoh: { id: "ibadah-solat", nama: "Rukun Solat", icon: "🕌", file: "games/ibadah/rukun-solat.html" },
  ],
  "Jawi": [
    // Tambah tajuk Jawi di sini
    // Contoh: { id: "jawi-huruf", nama: "Huruf Hijaiyyah", icon: "ب", file: "games/jawi/huruf-hijaiyyah.html" },
  ]
};
