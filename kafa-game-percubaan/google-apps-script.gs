// ========================================
// GAME KAFA - Google Apps Script
// Salin kod ini ke: script.google.com
// ========================================
// 
// CARA SETUP:
// 1. Buka Google Sheets baru
// 2. Klik Extensions > Apps Script
// 3. Padam kod yang ada, tampal kod ini
// 4. Klik Save, kemudian Deploy > New Deployment
// 5. Pilih "Web App", Execute as: Me, Access: Anyone
// 6. Klik Deploy, salin URL
// 7. Tampal URL tersebut di dalam js/app.js dan game files
//    (gantikan 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')
// ========================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ── Header untuk setiap sheet ──
const HEADERS = ['Nama', 'Kelas', 'Markah', 'Tarikh', 'TopikId', 'Subjek', 'Tahap1', 'Tahap2', 'Tahap3', 'Masa Hantar'];

// ════════════════════════════════
//  HANDLE GET (Fetch Ranking)
// ════════════════════════════════
function doGet(e) {
  const action  = e.parameter.action || '';
  const topik   = e.parameter.topik  || '';
  const subjek  = e.parameter.subjek || '';

  if (action === 'getRanking') {
    const data = getRanking(topik, subjek);
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════
//  HANDLE POST (Submit Markah)
// ════════════════════════════════
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    saveMarkah(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ════════════════════════════════
//  SIMPAN MARKAH
// ════════════════════════════════
function saveMarkah(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Nama sheet = TopikId (e.g. "sirah-biodata-nabi")
  const sheetName = payload.topikId || 'umum';
  let sheet = ss.getSheetByName(sheetName);

  // Auto buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(HEADERS);
    
    // Format header
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1a3c5e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);
    
    // Set lebar kolum
    sheet.setColumnWidth(1, 220); // Nama
    sheet.setColumnWidth(2, 160); // Kelas
    sheet.setColumnWidth(3, 80);  // Markah
    sheet.setColumnWidth(4, 120); // Tarikh
    sheet.setColumnWidth(5, 160); // TopikId
    sheet.setColumnWidth(6, 100); // Subjek
    sheet.setColumnWidth(7, 70);  // Tahap1
    sheet.setColumnWidth(8, 70);  // Tahap2
    sheet.setColumnWidth(9, 70);  // Tahap3
    sheet.setColumnWidth(10, 160); // Masa Hantar
  }

  // Semak duplikasi (nama + kelas + topik)
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Cari baris sedia ada untuk nama + kelas yang sama
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.nama && data[i][1] === payload.kelas) {
      existingRow = i + 1; // 1-indexed
      break;
    }
  }

  const stageMark = payload.stageMark || [0, 0, 0];
  const now = new Date();
  const masaHantar = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');
  const tarikhPendek = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy');

  const rowData = [
    payload.nama,
    payload.kelas,
    payload.markah,
    tarikhPendek,
    payload.topikId,
    payload.subjek,
    stageMark[0] || 0,
    stageMark[1] || 0,
    stageMark[2] || 0,
    masaHantar
  ];

  if (existingRow > 0) {
    // Update jika markah baru lebih tinggi
    const currentMarkah = parseInt(data[existingRow - 1][2]) || 0;
    if (payload.markah > currentMarkah) {
      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([rowData]);
    }
  } else {
    // Tambah baris baru
    sheet.appendRow(rowData);
  }

  // Auto sort by markah (descending) — kecuali header
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    const range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
    range.sort({ column: 3, ascending: false });
  }
}

// ════════════════════════════════
//  AMBIL RANKING
// ════════════════════════════════
function getRanking(topikId, subjek) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(topikId);
  
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Hanya header

  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip baris kosong
    result.push({
      nama:   row[0],
      kelas:  row[1],
      markah: parseInt(row[2]) || 0,
      masa:   row[3] || '-'
    });
  }

  // Sort by markah desc
  result.sort((a, b) => b.markah - a.markah);
  return result;
}

// ════════════════════════════════
//  TEST FUNCTION (Jalankan manual)
// ════════════════════════════════
function testSimpan() {
  saveMarkah({
    nama:      'TEST PELAJAR BIN TEST',
    kelas:     '2 Saidina Abu Bakar',
    markah:    65,
    topikId:   'sirah-biodata-nabi',
    topikNama: 'Biodata Nabi Muhammad SAW',
    subjek:    'Sirah',
    stageMark: [20, 25, 20]
  });
  Logger.log('Test berjaya!');
}
