// ================================================================
// apps-script-export.gs  –  SparePart Monitor Export to Sheets
// ================================================================
// CARA PAKAI:
// 1. Buka Spreadsheet: https://docs.google.com/spreadsheets/d/1XcutKioxyaY7lJzKOTNKk-TnLmgcMOJGYsng-MhUiZY/
// 2. Klik Extensions → Apps Script
// 3. Hapus semua kode yang ada, paste kode ini
// 4. Klik Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Klik Deploy, izinkan akses
// 6. Copy URL Web App yang muncul
// 7. Paste URL tersebut di dashboard (tombol ⚙️ Export Config)
// ================================================================

const SPREADSHEET_ID = '1XcutKioxyaY7lJzKOTNKk-TnLmgcMOJGYsng-MhUiZY';
const STOCK_SHEET_NAME = 'Stock';   // Nama tab sheet (ganti jika berbeda)

// ── Warna tema (hex) ──────────────────────────────────────────
const COLOR_HEADER_BG   = '#1e3a5f';   // Biru tua untuk header
const COLOR_HEADER_FG   = '#ffffff';   // Putih untuk teks header
const COLOR_ROW_ODD     = '#f0f4ff';   // Biru sangat muda (row ganjil)
const COLOR_ROW_EVEN    = '#ffffff';   // Putih (row genap)
const COLOR_STATUS_OK   = '#d4edda';   // Hijau muda (Tersedia)
const COLOR_STATUS_LOW  = '#fff3cd';   // Kuning muda (Low Stock)
const COLOR_STATUS_OUT  = '#f8d7da';   // Merah muda (Habis)
const COLOR_BORDER      = '#bfcde0';   // Border biru muda
const COLOR_TITLE_BG    = '#0d2137';   // Latar judul

// ── doPost: Terima data dari dashboard ────────────────────────
function doPost(e) {
  try {
    const raw    = e.postData ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const action  = payload.action || 'exportStock';

    if (action === 'exportStock') {
      return exportStockToSheet(payload.data || []);
    }
    return jsonResp(false, 'Unknown action: ' + action);

  } catch (err) {
    return jsonResp(false, 'Server error: ' + err.message);
  }
}

// ── doGet: Test endpoint ──────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'SparePart Export API ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── EXPORT STOCK → SHEET ──────────────────────────────────────
function exportStockToSheet(rows) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(STOCK_SHEET_NAME);

  // Buat tab jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(STOCK_SHEET_NAME);
  }

  // Kosongkan isi sheet
  sheet.clearContents();
  sheet.clearFormats();

  const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  const totalRows = rows.length;

  // ── BARIS 1: Judul ───────────────────────────────────────────
  sheet.getRange('A1:H1').merge();
  sheet.getRange('A1').setValue('📦 LAPORAN STOK SPAREPART')
    .setFontSize(14).setFontWeight('bold').setFontColor(COLOR_HEADER_FG)
    .setBackground(COLOR_TITLE_BG).setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  // ── BARIS 2: Info waktu & summary ────────────────────────────
  sheet.getRange('A2').setValue('Export: ' + now).setFontSize(9).setFontColor('#888888');
  sheet.getRange('C2').setValue('Total Item: ' + totalRows).setFontSize(9).setFontWeight('bold').setFontColor('#1e3a5f');
  const avail = rows.filter(r => r.quantity > 10).length;
  const low   = rows.filter(r => r.quantity > 0 && r.quantity <= 10).length;
  const out   = rows.filter(r => r.quantity === 0).length;
  sheet.getRange('E2').setValue('✅ Tersedia: ' + avail).setFontSize(9).setFontColor('#155724');
  sheet.getRange('F2').setValue('⚠️ Low: ' + low).setFontSize(9).setFontColor('#856404');
  sheet.getRange('G2').setValue('❌ Habis: ' + out).setFontSize(9).setFontColor('#721c24');

  // ── BARIS 3: Header kolom ─────────────────────────────────────
  const headers = ['No', 'Part No', 'Job No', 'Alamat Part', 'Customer', 'Quantity', 'Kategori', 'Status'];
  const headerRange = sheet.getRange(3, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange
    .setBackground(COLOR_HEADER_BG)
    .setFontColor(COLOR_HEADER_FG)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, COLOR_BORDER, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(3, 30);

  // ── BARIS 4+: Data ────────────────────────────────────────────
  if (totalRows > 0) {
    const dataArr = rows.map((r, i) => {
      let status = 'Tersedia';
      if (r.quantity === 0)          status = 'Habis';
      else if (r.quantity <= 10)     status = 'Low Stock';
      return [
        i + 1,
        r.partNo   || '',
        r.jobNo    || '',
        r.address  || '',
        r.customer || '',
        r.quantity || 0,
        r.category ? r.category.charAt(0).toUpperCase() + r.category.slice(1) : '',
        status
      ];
    });

    const dataRange = sheet.getRange(4, 1, totalRows, headers.length);
    dataRange.setValues(dataArr);

    // Format per baris
    for (let i = 0; i < totalRows; i++) {
      const rowNum  = i + 4;
      const rowBg   = (i % 2 === 0) ? COLOR_ROW_ODD : COLOR_ROW_EVEN;
      const qty     = rows[i].quantity || 0;
      const range   = sheet.getRange(rowNum, 1, 1, headers.length);

      // Background alternating
      range.setBackground(rowBg);
      range.setFontSize(10).setVerticalAlignment('middle');
      range.setBorder(false, true, true, true, true, false, COLOR_BORDER, SpreadsheetApp.BorderStyle.SOLID_THIN);
      sheet.setRowHeight(rowNum, 24);

      // No (col A) — center, bold
      sheet.getRange(rowNum, 1).setHorizontalAlignment('center').setFontWeight('bold').setFontColor('#5a7099');

      // Part No (col B) — monospace feel, bold biru
      sheet.getRange(rowNum, 2).setFontWeight('bold').setFontColor('#1a3c6e');

      // Quantity (col F) — center, bold
      sheet.getRange(rowNum, 6).setHorizontalAlignment('center').setFontWeight('bold');

      // Status (col H) — warna berdasarkan nilai
      const statusCell = sheet.getRange(rowNum, 8);
      statusCell.setHorizontalAlignment('center').setFontWeight('bold').setFontSize(9);
      if (qty === 0) {
        statusCell.setBackground(COLOR_STATUS_OUT).setFontColor('#721c24');
      } else if (qty <= 10) {
        statusCell.setBackground(COLOR_STATUS_LOW).setFontColor('#856404');
      } else {
        statusCell.setBackground(COLOR_STATUS_OK).setFontColor('#155724');
      }
    }

    // Border luar tebal
    sheet.getRange(4, 1, totalRows, headers.length)
      .setBorder(true, true, true, true, null, null, '#1e3a5f', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }

  // ── Baris terakhir: Footer ────────────────────────────────────
  const footerRow = totalRows + 5;
  sheet.getRange(footerRow, 1, 1, 8).merge();
  sheet.getRange(footerRow, 1)
    .setValue('Data diekspor dari SparePart Monitor Dashboard · ' + now)
    .setFontSize(8).setFontColor('#aaaaaa').setHorizontalAlignment('center');

  // ── Freeze header ─────────────────────────────────────────────
  sheet.setFrozenRows(3);

  // ── Auto-resize kolom ─────────────────────────────────────────
  const colWidths = [40, 120, 110, 120, 180, 80, 110, 90];
  colWidths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // ── Aktifkan filter ───────────────────────────────────────────
  if (totalRows > 0) {
    sheet.getRange(3, 1, totalRows + 1, headers.length).createFilter();
  }

  return jsonResp(true, `Berhasil mengekspor ${totalRows} item ke sheet "${STOCK_SHEET_NAME}"`, {
    sheetName: STOCK_SHEET_NAME,
    rows: totalRows,
    time: now,
    url: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit'
  });
}

// ── Helper: JSON response ─────────────────────────────────────
function jsonResp(success, message, extra = {}) {
  const body = JSON.stringify({ success, message, ...extra });
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
