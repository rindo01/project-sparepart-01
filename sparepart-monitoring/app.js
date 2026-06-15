// ============================================================
// app.js  –  SparePart Monitor
// ============================================================

// ── SAMPLE DATA ──────────────────────────────────────────────
let stockData = [];
let stockNextId = 1;

const catalogData = [
  { id: 1, name: 'Bearing SKF 6205', partNo: 'BRG-SKF-6205', category: 'mechanical', stock: 45, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', desc: 'Deep groove ball bearing, single row, steel cage.' },
  { id: 2, name: 'V-Belt A-38', partNo: 'VBT-A38-STD', category: 'mechanical', stock: 120, img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&q=80', desc: 'Klasik V-belt untuk transmisi daya standar.' },
  { id: 3, name: 'Proximity Sensor NPN', partNo: 'SEN-PX-NPN-12', category: 'electrical', stock: 18, img: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=300&q=80', desc: 'Sensor induktif 12mm, output NPN, PNP tersedia.' },
  { id: 4, name: 'O-Ring NBR 50x3', partNo: 'ORC-NBR-503', category: 'pneumatic', stock: 300, img: 'https://images.unsplash.com/photo-1563115298-e9585e7943d4?w=300&q=80', desc: 'O-ring karet NBR tahan minyak dan temperatur tinggi.' },
  { id: 5, name: 'Hydraulic Seal Kit', partNo: 'HSK-STD-80MM', category: 'hydraulic', stock: 8, img: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&q=80', desc: 'Kit seal lengkap untuk silinder hidrolik 80mm.' },
  { id: 6, name: 'Solenoid Valve 24VDC', partNo: 'SOL-24V-14BSP', category: 'pneumatic', stock: 22, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', desc: 'Solenoid valve 5/2-way untuk sistem pneumatik.' },
  { id: 7, name: 'Relay Omron MK2P', partNo: 'RLY-OMR-MK2P', category: 'electrical', stock: 55, img: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=300&q=80', desc: 'General purpose relay 8-pin, 10A, 230VAC.' },
  { id: 8, name: 'Gear Spur M2 Z30', partNo: 'GER-SP-M2-Z30', category: 'mechanical', stock: 3, img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&q=80', desc: 'Spur gear modul 2, 30 gigi, bahan besi cor.' },
];
let catalogNextId = 9;

// ── STATE ─────────────────────────────────────────────────────
const state = {
  currentPage: 'stock',
  filter: 'all',
  search: '',
  sortCol: null,
  sortDir: 1,
  tablePage: 1,
  pageSize: 8,
  catalogSearch: '',
  catalogCat: 'all',
  catalogView: 'grid',
};

// ── DOM REFS ──────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const hamburger = document.getElementById('hamburger');
const sidebarClose = document.getElementById('sidebarClose');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('theme-icon');
const pageTitle = document.getElementById('page-title');
const toastContainer = document.getElementById('toastContainer');

// ── SIDEBAR TOGGLE ────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  sidebar.classList.add('open');
  overlay.classList.add('show');
});
[sidebarClose, overlay].forEach(el => el.addEventListener('click', closeSidebar));
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

// ── THEME ─────────────────────────────────────────────────────
let isDark = localStorage.getItem('theme') !== 'light';
function applyTheme() {
  document.body.classList.toggle('light', !isDark);
  themeIcon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}
applyTheme();
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
});

// ── NAVIGATION ────────────────────────────────────────────────
document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    switchPage(btn.dataset.page);
    if (window.innerWidth <= 900) closeSidebar();
  });
});

const pageTitles = { stock: 'Stock Overview', planning: 'Planning & Spreadsheet', catalog: 'Katalog Sparepart' };

function switchPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  pageTitle.textContent = pageTitles[page] || page;
  // Show/hide sidebar sub-actions
  const sidebarStockActions = document.getElementById('sidebarStockActions');
  const sidebarPlanningActions = document.getElementById('sidebarPlanningActions');
  if (sidebarStockActions) sidebarStockActions.classList.toggle('visible', page === 'stock');
  if (sidebarPlanningActions) sidebarPlanningActions.classList.toggle('visible', page === 'planning');
}

// ── COUNT-UP ANIMATION ────────────────────────────────────────
function animateCount(el, target, suffix = '') {
  const duration = 900;
  const start = Date.now();
  const update = () => {
    const t = Math.min((Date.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target).toLocaleString() + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── SUMMARY CARDS ─────────────────────────────────────────────
function updateSummary(data) {
  const uniqueCustomers = new Set(data.map(d => d.customer)).size;
  const totalQty = data.reduce((s, d) => s + d.quantity, 0);
  const lowStock = data.filter(d => d.quantity > 0 && d.quantity <= 10).length;

  animateCount(document.getElementById('val-total-items'), data.length);
  animateCount(document.getElementById('val-total-qty'), totalQty);
  animateCount(document.getElementById('val-customers'), uniqueCustomers);
  animateCount(document.getElementById('val-low-stock'), lowStock);
  document.getElementById('badge-stock').textContent = data.length;
}

// ── STATUS HELPER ─────────────────────────────────────────────
function getStatus(qty) {
  if (qty === 0) return { label: 'Habis', cls: 'badge-red', dot: '●' };
  if (qty <= 10) return { label: 'Low Stock', cls: 'badge-orange', dot: '●' };
  return { label: 'Tersedia', cls: 'badge-green', dot: '●' };
}

// ── FILTER & SORT DATA ────────────────────────────────────────
function getFilteredData() {
  let data = [...stockData];
  const q = state.search.toLowerCase();
  if (q) data = data.filter(d =>
    d.partNo.toLowerCase().includes(q) ||
    d.jobNo.toLowerCase().includes(q) ||
    d.customer.toLowerCase().includes(q) ||
    d.address.toLowerCase().includes(q)
  );
  if (state.filter === 'available') data = data.filter(d => d.quantity > 10);
  if (state.filter === 'low') data = data.filter(d => d.quantity > 0 && d.quantity <= 10);
  if (state.filter === 'out') data = data.filter(d => d.quantity === 0);
  if (state.sortCol) {
    data.sort((a, b) => {
      let av = a[state.sortCol], bv = b[state.sortCol];
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase();
      return av < bv ? -state.sortDir : av > bv ? state.sortDir : 0;
    });
  }
  return data;
}

// ── RENDER TABLE ──────────────────────────────────────────────
function renderTable() {
  const data = getFilteredData();
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.tablePage = Math.min(state.tablePage, pages);
  const start = (state.tablePage - 1) * state.pageSize;
  const slice = data.slice(start, start + state.pageSize);

  const tbody = document.getElementById('stockTableBody');
  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text3)"><i class="fa-solid fa-box-open" style="font-size:2rem;display:block;margin-bottom:10px"></i>Tidak ada data ditemukan</td></tr>`;
  } else {
    tbody.innerHTML = slice.map((d, i) => {
      const st = getStatus(d.quantity);
      const pct = Math.min(100, Math.round((d.quantity / 150) * 100));
      const barCls = d.quantity === 0 ? 'low' : d.quantity <= 10 ? 'mid' : '';
      const imgHtml = d.img
        ? `<div class="part-img"><img src="${d.img}" alt="${d.partNo}" loading="lazy"/></div>`
        : `<div class="part-img no-img"><i class="fa-solid fa-image"></i></div>`;
      return `
      <tr data-id="${d.id}" style="cursor:pointer">
        <td class="col-no" style="text-align:center;color:var(--text3);font-size:.78rem">${start + i + 1}</td>
        <td class="col-img">${imgHtml}</td>
        <td><code style="font-size:.82rem;color:var(--primary-light)">${d.partNo}</code></td>
        <td style="font-size:.82rem">${d.jobNo}</td>
        <td style="font-size:.82rem">${d.address}</td>
        <td><span style="font-weight:600;font-size:.83rem">${d.customer}</span></td>
        <td class="col-qty">
          <div class="qty-bar">
            <span style="font-weight:700;font-size:.88rem;min-width:28px;text-align:right">${d.quantity}</span>
            <div class="qty-bar-track"><div class="qty-bar-fill ${barCls}" style="width:${pct}%"></div></div>
          </div>
        </td>
        <td class="col-status"><span class="badge ${st.cls}">${st.dot} ${st.label}</span></td>
        <td class="col-action"><button class="stock-delete-btn" data-sid="${d.id}" aria-label="Hapus ${d.partNo}" title="Hapus item"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`;
    }).join('');
    // Row click → modal
    tbody.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => openModal(+tr.dataset.id));
    });
    // Delete buttons
    tbody.querySelectorAll('.stock-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deleteStockItem(+btn.dataset.sid); });
    });
  }

  document.getElementById('tableInfo').textContent = `Menampilkan ${Math.min(start + 1, total)}–${Math.min(start + state.pageSize, total)} dari ${total} data`;
  renderPagination(pages);
}

// ── PAGINATION ────────────────────────────────────────────────
function renderPagination(pages) {
  const pg = document.getElementById('pagination');
  let html = '';
  const cur = state.tablePage;
  const addBtn = (label, page, cls = '') => {
    html += `<button class="page-btn${cls ? ` ${cls}` : ''}" data-pg="${page}" aria-label="Page ${page}">${label}</button>`;
  };
  addBtn('<i class="fa-solid fa-chevron-left"></i>', Math.max(1, cur - 1));
  for (let p = 1; p <= pages; p++) {
    if (pages <= 7 || p === 1 || p === pages || Math.abs(p - cur) <= 1) {
      addBtn(p, p, p === cur ? 'active' : '');
    } else if (Math.abs(p - cur) === 2) {
      html += `<span style="padding:0 4px;color:var(--text3)">…</span>`;
    }
  }
  addBtn('<i class="fa-solid fa-chevron-right"></i>', Math.min(pages, cur + 1));
  pg.innerHTML = html;
  pg.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tablePage = +btn.dataset.pg;
      renderTable();
      document.getElementById('stockTable').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

// ── SEARCH & FILTER ───────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
  state.search = e.target.value;
  state.tablePage = 1;
  renderTable();
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.filter = pill.dataset.filter;
    state.tablePage = 1;
    renderTable();
  });
});

// ── SORT ──────────────────────────────────────────────────────
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (state.sortCol === col) state.sortDir *= -1;
    else { state.sortCol = col; state.sortDir = 1; }
    renderTable();
  });
});

// ── REFRESH ───────────────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', () => {
  const btn = document.getElementById('refreshBtn');
  const icon = btn.querySelector('i');
  icon.classList.add('spin');
  btn.disabled = true;
  fetchStockFromSheets().finally(() => {
    setTimeout(() => { icon.classList.remove('spin'); btn.disabled = false; }, 600);
  });
});

// ── MODAL ─────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function openModal(id) {
  const d = stockData.find(s => s.id === id);
  if (!d) return;
  const st = getStatus(d.quantity);
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-part-img">
      ${d.img ? `<img src="${d.img}" alt="${d.partNo}"/>` : `<i class="fa-solid fa-image" style="font-size:3rem;color:var(--text3)"></i>`}
    </div>
    <h2 class="modal-title">${d.partNo}</h2>
    <p class="modal-partno">Job No: ${d.jobNo}</p>
    <div class="modal-details">
      <div class="modal-detail-item"><p class="modal-detail-label">Customer</p><p class="modal-detail-value">${d.customer}</p></div>
      <div class="modal-detail-item"><p class="modal-detail-label">Alamat Part</p><p class="modal-detail-value">${d.address}</p></div>
      <div class="modal-detail-item"><p class="modal-detail-label">Quantity</p><p class="modal-detail-value">${d.quantity} unit</p></div>
      <div class="modal-detail-item"><p class="modal-detail-label">Status</p><p class="modal-detail-value"><span class="badge ${st.cls}">${st.label}</span></p></div>
      <div class="modal-detail-item"><p class="modal-detail-label">Kategori</p><p class="modal-detail-value" style="text-transform:capitalize">${d.category}</p></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn-outline" style="flex:1" onclick="openStockForm(${d.id});closeModal()">
        <i class="fa-solid fa-pen"></i> Edit
      </button>
      <button class="btn-danger" style="flex:1" onclick="deleteStockItem(${d.id});closeModal()">
        <i class="fa-solid fa-trash"></i> Hapus
      </button>
    </div>`;
  modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

// ── PLANNING SCHEDULE PAGE ────────────────────────────────────

// ── GOOGLE SHEETS CONFIG ─────────────────────────────────────
const SHEET_ID = '1XcutKioxyaY7lJzKOTNKk-TnLmgcMOJGYsng-MhUiZY';
const SHEET_GID = '1993337943';   // tab: Small
// Header row in the spreadsheet (1-based). Row 4 = index 3 after gviz offset.
// gviz?tqx=out:json returns rows AFTER the header row it detects. We use
// tq with row offset to skip rows 1-3 (titles/empty) so row 4 becomes header.
const SHEETS_JSON_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&headers=1&range=A4:J`;

const REFRESH_INTERVAL_MS = 30000; // 30 detik
let   sheetsRefreshTimer  = null;
let   sheetsFetchLoading  = false;

// ── STOCK SHEET CONFIG ──────────────────────────────────────────────
// GID 1277047503 = tab Stock di spreadsheet Anda
// Kolom (baris 1 = header): A=Part No | B=Job No | C=Alamat Part
//   D=Customer | E=Quantity | F=Kategori | G=Foto URL
const STOCK_SHEET_GID       = '1277047503';
// URL utama: baca mulai baris 1 dengan header otomatis
const STOCK_SHEETS_JSON_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${STOCK_SHEET_GID}&headers=1&range=A1:G`;
// URL fallback tanpa header (jika baris 1 kosong)
const STOCK_SHEETS_NOHDR_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${STOCK_SHEET_GID}&headers=0&range=A2:G`;
const STOCK_REFRESH_MS      = 30000; // 30 detik
let   stockRefreshTimer     = null;
let   stockFetchLoading     = false;
let   stockFromSheets       = false; // flag: apakah data sudah dari Sheets

// ── STOCK WRITE CONFIG (via Apps Script) ───────────────────────────
// Setelah deploy apps-script-stock.gs sebagai Web App,
// klik ikon ⚙️ di halaman Stock lalu paste URL-nya.
let STOCK_WRITE_URL = localStorage.getItem('stockWriteUrl') || '';

// ── WRITE TO SHEETS (fire-and-forget) ──────────────────────────────
async function writeStock(action, payload) {
  if (!STOCK_WRITE_URL) return; // URL belum dikonfigurasi
  try {
    const res  = await fetch(STOCK_WRITE_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'text/plain' }, // hindari CORS preflight
      body   : JSON.stringify({ action, ...payload }),
    });
    const json = await res.json();
    if (!json.success) console.warn('[StockWrite]', json.message);
  } catch (err) {
    console.error('[StockWrite] Gagal menulis ke Sheets:', err);
  }
}

// Planning data — diisi dari Google Sheets, bisa juga ditambah lokal
let planningData = [];
let planNextId = 1;
let planFilter = 'all';
let planSearch = '';
let scanQueue = [];
let scanQueueIndex = 0;
let scanTargetId = null;

// Scan-override: menyimpan status scan lokal (keputusan user) agar tidak
// ditimpa saat refresh. key = partNo, value = true/false
const scanOverrides = {};

// ── GVIZ COLUMN MAP ──────────────────────────────────────────
// Spreadsheet: A=NO PO, B=NO, C=TGL., D=PART NO, E=PART NAME,
//              F=QTY ORD, G=CUSTOMER, H=DIFF, I=REMARK, J=STATUS
function parseGvizRow(row) {
  const cell = (i) => (row.c[i] && row.c[i].v !== null) ? row.c[i].v : '';
  const fmt = (i) => (row.c[i] && row.c[i].f !== null) ? row.c[i].f : '';

  // Tanggal: gviz mengembalikan Date object sebagai string "Date(Y,M,D)"
  let rawDate = cell(2);
  let dateStr = '';
  if (typeof rawDate === 'string' && rawDate.startsWith('Date(')) {
    const parts = rawDate.replace('Date(', '').replace(')', '').split(',').map(Number);
    const d = new Date(parts[0], parts[1], parts[2]);
    dateStr = d.toISOString().slice(0, 10);
  } else if (fmt(2)) {
    // fallback ke format string seperti "24-Dec-25"
    const parsed = new Date(fmt(2));
    dateStr = isNaN(parsed) ? '' : parsed.toISOString().slice(0, 10);
  } else if (rawDate) {
    dateStr = String(rawDate);
  }

  const partNo = String(cell(3)).trim();
  const partName = String(cell(4)).trim();
  const qty = parseFloat(cell(5)) || 0;
  const customer = String(cell(6)).trim();
  const remark = String(cell(8)).trim();
  const status = String(cell(9)).trim().toUpperCase();
  const noPo = String(cell(0)).trim();

  // Scanned = CLOSE atau DONE di kolom STATUS, kecuali user override
  const autoScanned = (status === 'CLOSE' || status === 'DONE');
  const scanned = (partNo in scanOverrides) ? scanOverrides[partNo] : autoScanned;

  return { partNo, partName, qty, customer, remark, status, noPo, dateStr, scanned };
}

// ── STOCK GVIZ COLUMN MAP ───────────────────────────────────────────────
// Kolom: A=Part No, B=Job No, C=Alamat Part, D=Customer,
//        E=Quantity, F=Kategori, G=Foto URL
function parseStockGvizRow(row) {
  const cell = (i) => (row.c[i] && row.c[i].v !== null) ? String(row.c[i].v) : '';
  return {
    partNo  : cell(0).trim(),
    jobNo   : cell(1).trim(),
    address : cell(2).trim(),
    customer: cell(3).trim(),
    quantity: parseFloat(cell(4)) || 0,
    category: cell(5).trim().toLowerCase() || 'mechanical',
    img     : cell(6).trim(),
  };
}

// ── FETCH FROM GOOGLE SHEETS ──────────────────────────────────
async function fetchFromSheets() {
  if (sheetsFetchLoading) return;
  sheetsFetchLoading = true;
  setSyncStatus('loading');
  setSidebarStockSync('loading');

  try {
    const res = await fetch(SHEETS_JSON_URL + '&nocache=' + Date.now());
    const text = await res.text();
    // gviz returns: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/s)[1]);

    if (!json || !json.table || !json.table.rows) {
      throw new Error('Format data tidak valid dari Google Sheets');
    }

    const rows = json.table.rows.filter(r => r && r.c && r.c.some(c => c && c.v !== null && c.v !== ''));

    // Rebuild planningData dari Sheets (preserve local-only entries dengan id < 0)
    const localOnly = planningData.filter(p => p._local === true);
    planningData = [];
    planNextId = 1;

    rows.forEach(row => {
      const p = parseGvizRow(row);
      if (!p.partNo) return; // skip baris kosong
      planningData.push({
        id: planNextId++,
        date: p.dateStr,
        partNo: p.partNo,
        partName: p.partName,
        customer: p.customer,
        qty: p.qty,
        scanned: p.scanned,
        note: p.remark,
        noPo: p.noPo,
        status: p.status,
        _fromSheets: true,
      });
    });

    // Tambahkan kembali entri lokal
    localOnly.forEach(p => planningData.push(p));

    setSyncStatus('ok');
    renderPlanning();
    updateSummary(stockData);
    // Update sidebar stock panel
    setSidebarStockSync('ok');
    renderSidebarStock();
  } catch (err) {
    console.error('[Sheets] Fetch error:', err);
    setSyncStatus('error', err.message);
    setSidebarStockSync('error', err.message);
  } finally {
    sheetsFetchLoading = false;
  }
}

// ── SYNC STATUS INDICATOR ─────────────────────────────────────
function setSyncStatus(state, msg = '') {
  const el = document.getElementById('syncStatusBadge');
  if (!el) return;
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (state === 'loading') {
    el.className = 'sync-badge sync-loading';
    el.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Mengambil data…';
  } else if (state === 'ok') {
    el.className = 'sync-badge sync-ok';
    el.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sinkron · ${now}`;
  } else {
    el.className = 'sync-badge sync-error';
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Gagal · ${now}`;
    if (msg) el.title = msg;
  }
}

function startSheetsAutoRefresh() {
  fetchFromSheets();
  sheetsRefreshTimer = setInterval(fetchFromSheets, REFRESH_INTERVAL_MS);
}

// ── FETCH STOCK FROM GOOGLE SHEETS ──────────────────────────────────
async function fetchStockFromSheets() {
  if (stockFetchLoading) return;
  stockFetchLoading = true;
  setStockSyncStatus('loading');
  try {
    // Coba URL utama (dengan header baris 1)
    const res  = await fetch(STOCK_SHEETS_JSON_URL + '&nocache=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/s);
    if (!match) throw new Error('Response bukan format gviz yang valid');
    const json = JSON.parse(match[1]);

    if (!json || !json.table) throw new Error('Format data tidak valid dari Google Sheets');

    let rows = (json.table.rows || []).filter(r => r && r.c && r.c.some(c => c && c.v !== null && c.v !== ''));

    // Jika baris kosong, coba URL tanpa header (mungkin header tidak di baris 1)
    if (rows.length === 0) {
      const res2  = await fetch(STOCK_SHEETS_NOHDR_URL + '&nocache=' + Date.now());
      const text2 = await res2.text();
      const match2 = text2.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/s);
      if (match2) {
        const json2 = JSON.parse(match2[1]);
        if (json2 && json2.table && json2.table.rows) {
          rows = json2.table.rows.filter(r => r && r.c && r.c.some(c => c && c.v !== null && c.v !== ''));
        }
      }
    }

    if (rows.length === 0) {
      // Sheet kosong — tampilkan sample data dengan status info
      setStockSyncStatus('empty');
      renderTable();
      updateSummary(stockData);
      renderSidebarStock();
      setSidebarStockSync('empty');
      return;
    }

    // Data ditemukan — parse dan tampilkan
    stockData   = [];
    stockNextId = 1;
    rows.forEach(row => {
      const d = parseStockGvizRow(row);
      if (!d.partNo) return;
      stockData.push({ id: stockNextId++, ...d });
    });
    stockFromSheets = true;
    setStockSyncStatus('ok');
    renderTable();
    updateSummary(stockData);
    renderSidebarStock();
    setSidebarStockSync('ok');
  } catch (err) {
    console.error('[Stock Sheets]', err);
    setStockSyncStatus('error', err.message);
    setSidebarStockSync('error', err.message);
    renderTable();
    updateSummary(stockData);
  } finally {
    stockFetchLoading = false;
  }
}

// ── STOCK SYNC STATUS INDICATOR ───────────────────────────────────
function setStockSyncStatus(st, msg = '') {
  const el  = document.getElementById('stockSyncBadge');
  if (!el) return;
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (st === 'loading') {
    el.className = 'sync-badge sync-loading';
    el.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Menghubungkan ke Sheet Stock…';
  } else if (st === 'ok') {
    el.className = 'sync-badge sync-ok';
    el.innerHTML = `<i class="fa-solid fa-circle-check"></i> Tersinkron · ${now}`;
  } else if (st === 'empty') {
    el.className = 'sync-badge sync-info';
    el.innerHTML = `<i class="fa-solid fa-circle-info"></i> Sheet kosong – Tampil sample data · ${now}`;
    el.title = 'Tambahkan data ke sheet Stock dengan header: Part No | Job No | Alamat Part | Customer | Quantity | Kategori | Foto URL';
  } else {
    el.className = 'sync-badge sync-error';
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Koneksi gagal · ${now}`;
    if (msg) el.title = msg;
  }
}

function startStockAutoRefresh() {
  fetchStockFromSheets();
  stockRefreshTimer = setInterval(fetchStockFromSheets, STOCK_REFRESH_MS);
}

// ── STOCK WRITE CONFIG BUTTON ──────────────────────────────────────
document.getElementById('stockWriteConfigBtn')?.addEventListener('click', () => {
  const url = prompt(
    'Paste URL Google Apps Script untuk menulis data Stock ke Sheets:\n' +
    '(Lihat panduan di file: apps-script-stock.gs)\n\nURL saat ini: ' +
    (STOCK_WRITE_URL || '(belum diatur)'),
    STOCK_WRITE_URL
  );
  if (url !== null) {
    STOCK_WRITE_URL = url.trim();
    localStorage.setItem('stockWriteUrl', STOCK_WRITE_URL);
    showToast(STOCK_WRITE_URL ? '✅ URL Apps Script disimpan!' : '⚠️ URL dikosongkan', STOCK_WRITE_URL ? 'success' : 'info');
  }
});

// Set today label
document.getElementById('planDateLabel').textContent =
  new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


// ── RENDER PLANNING TABLE ─────────────────────────────────────
function renderPlanning() {
  let data = [...planningData];
  const q = planSearch.toLowerCase();
  if (q) data = data.filter(d =>
    d.partNo.toLowerCase().includes(q) ||
    d.partName.toLowerCase().includes(q) ||
    d.customer.toLowerCase().includes(q)
  );
  if (planFilter === 'pending') data = data.filter(d => !d.scanned);
  if (planFilter === 'scanned') data = data.filter(d => d.scanned);

  // sort by date asc
  data.sort((a, b) => a.date.localeCompare(b.date));

  const tbody = document.getElementById('planTableBody');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text3)">
      <i class="fa-solid fa-calendar-xmark" style="font-size:2rem;display:block;margin-bottom:10px"></i>
      Tidak ada data planning ditemukan</td></tr>`;
  } else {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    tbody.innerHTML = data.map((d, i) => {
      const dDate = new Date(d.date);
      const diff = d.date ? Math.round((dDate - today) / 86400000) : null;
      let dateCls = '', dateLabel = '';
      if (diff !== null) {
        if (diff < 0) { dateCls = 'urgent'; dateLabel = ' <small style="color:var(--red)">(Terlambat)</small>'; }
        else if (diff === 0) { dateCls = 'urgent'; dateLabel = ' <small style="color:var(--red)">(Hari ini)</small>'; }
        else if (diff === 1) { dateCls = 'soon'; dateLabel = ' <small style="color:var(--orange)">(Besok)</small>'; }
      }
      const dateStr = d.date
        ? dDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '<span style="color:var(--text3)">—</span>';

      const scanBadge = d.scanned
        ? `<span class="badge-scan-done"><i class="fa-solid fa-check"></i> Scanned</span>`
        : `<span class="badge-scan-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;

      // Status badge from Google Sheets column J (STATUS)
      const st = (d.status || '').toUpperCase();
      let statusBadge = '';
      if (st === 'OPEN' || st === 'PROGRESS') statusBadge = `<span class="sheet-status-badge status-open">${d.status}</span>`;
      else if (st === 'CLOSE' || st === 'DONE') statusBadge = `<span class="sheet-status-badge status-done">${d.status}</span>`;
      else if (st === 'HOLD' || st === 'CANCEL') statusBadge = `<span class="sheet-status-badge status-hold">${d.status}</span>`;
      else if (st) statusBadge = `<span class="sheet-status-badge status-default">${d.status}</span>`;
      else statusBadge = `<span style="color:var(--text3);font-size:.75rem">—</span>`;

      return `
      <tr class="${d.scanned ? 'row-scanned' : ''}" data-pid="${d.id}">
        <td style="color:var(--text3);font-size:.78rem;text-align:center">${i + 1}</td>
        <td style="font-size:.78rem;color:var(--text3);white-space:nowrap">${d.noPo || '—'}</td>
        <td><span class="date-chip ${dateCls}"><i class="fa-regular fa-calendar"></i>${dateStr}</span>${dateLabel}</td>
        <td><code style="font-size:.8rem;color:var(--primary-light)">${d.partNo}</code></td>
        <td style="font-weight:600;color:var(--text)">${d.partName}</td>
        <td style="font-size:.82rem">${d.customer}</td>
        <td style="font-weight:700;text-align:center">${d.qty || '—'}</td>
        <td>${statusBadge}</td>
        <td>${scanBadge}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:nowrap">
            ${!d.scanned
          ? `<button class="plan-row-btn scan-btn" data-pid="${d.id}" aria-label="Scan ${d.partNo}"><i class="fa-solid fa-barcode"></i> Scan</button>`
          : `<button class="plan-row-btn" data-pid="${d.id}" data-action="unscan" aria-label="Reset scan"><i class="fa-solid fa-rotate-left"></i> Reset</button>`
        }
            <button class="plan-row-btn" data-pid="${d.id}" data-action="edit" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="plan-row-btn delete-btn" data-pid="${d.id}" data-action="delete" aria-label="Hapus"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Row events
    tbody.querySelectorAll('.scan-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); quickScanItem(+btn.dataset.pid); });
    });
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openPlanForm(+btn.dataset.pid); });
    });
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deletePlanItem(+btn.dataset.pid); });
    });
    tbody.querySelectorAll('[data-action="unscan"]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); resetScan(+btn.dataset.pid); });
    });
  }

  updatePlanSummary();
}

function updatePlanSummary() {
  const total = planningData.length;
  const scanned = planningData.filter(d => d.scanned).length;
  const pending = total - scanned;
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  document.getElementById('psTotalPlan').textContent = total;
  document.getElementById('psScanned').textContent = scanned;
  document.getElementById('psPending').textContent = pending;
  document.getElementById('psPercent').textContent = pct + '%';
  document.getElementById('planProgressFill').style.width = pct + '%';
  // Update sidebar badge & info
  const badgePlanning = document.getElementById('badge-planning');
  if (badgePlanning) badgePlanning.textContent = pending;
  const sidebarPending = document.getElementById('sidebarScanPending');
  if (sidebarPending) sidebarPending.textContent = pending > 0 ? `${pending} belum discan` : 'Semua sudah discan ✓';
}

// ── QUICK SCAN (langsung tanpa modal) ─────────────────────────
function quickScanItem(id) {
  const item = planningData.find(p => p.id === id);
  if (!item) return;
  if (item.scanned) { showToast(`Part "${item.partNo}" sudah pernah discan`, 'info'); return; }

  // Tandai sebagai scanned
  item.scanned = true;
  scanOverrides[item.partNo] = true;

  // Cari & kurangi stock
  const deductQty = item.qty || 1;
  const stockIdx = stockData.findIndex(s =>
    s.partNo.toUpperCase() === item.partNo.toUpperCase()
  );

  if (stockIdx !== -1) {
    const before = stockData[stockIdx].quantity;
    const after = Math.max(0, before - deductQty);
    stockData[stockIdx].quantity = after;
    renderTable();
    updateSummary(stockData);
    writeStock('updateQty', { partNo: item.partNo, quantity: after }); // sync ke Sheets
    showToast(`✅ Scan "${item.partNo}" — Stock: ${before} → ${after} unit`, 'success');
    if (after === 0) {
      setTimeout(() => showToast(`⚠️ Stock "${item.partNo}" sekarang HABIS!`, 'error'), 500);
    } else if (after <= 10) {
      setTimeout(() => showToast(`⚠️ Stock "${item.partNo}" hampir habis (${after} unit)`, 'info'), 500);
    }
  } else {
    showToast(`⚠️ Part "${item.partNo}" tidak ditemukan di data Stock!`, 'error');
  }

  renderPlanning();
}

// ── PLAN FILTER & SEARCH ───────────────────────────────────────
document.querySelectorAll('.plan-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    planFilter = tab.dataset.planfilter;
    renderPlanning();
  });
});
document.getElementById('planSearchInput').addEventListener('input', e => {
  planSearch = e.target.value;
  renderPlanning();
});

// ── PLAN FORM (ADD / EDIT) ─────────────────────────────────────
const planFormOverlay = document.getElementById('planFormOverlay');

function openPlanForm(id = null) {
  const titleEl = document.getElementById('plan-form-title');
  const subtitleEl = document.getElementById('planFormSubtitle');
  document.getElementById('planFormId').value = id || '';

  if (id) {
    const d = planningData.find(p => p.id === id);
    if (!d) return;
    titleEl.textContent = 'Edit Planning';
    subtitleEl.textContent = 'Ubah detail jadwal pengiriman';
    document.getElementById('planFormDate').value = d.date;
    document.getElementById('planFormQty').value = d.qty;
    document.getElementById('planFormPartNo').value = d.partNo;
    document.getElementById('planFormPartName').value = d.partName;
    document.getElementById('planFormCustomer').value = d.customer;
    document.getElementById('planFormNote').value = d.note || '';
  } else {
    titleEl.textContent = 'Tambah Planning';
    subtitleEl.textContent = 'Isi detail jadwal pengiriman part';
    document.getElementById('planForm').reset();
    // default date to today
    document.getElementById('planFormDate').value = new Date().toISOString().slice(0, 10);
  }
  planFormOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closePlanForm() {
  planFormOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('planFormClose').addEventListener('click', closePlanForm);
document.getElementById('planFormCancel').addEventListener('click', closePlanForm);
planFormOverlay.addEventListener('click', e => { if (e.target === planFormOverlay) closePlanForm(); });
document.getElementById('planAddBtn').addEventListener('click', () => openPlanForm());

// Manual refresh from Sheets
document.getElementById('planRefreshBtn').addEventListener('click', () => {
  const icon = document.getElementById('planRefreshIcon');
  icon.classList.add('spin');
  fetchFromSheets().finally(() => {
    setTimeout(() => icon.classList.remove('spin'), 600);
  });
});

document.getElementById('planForm').addEventListener('submit', e => {
  e.preventDefault();
  const date = document.getElementById('planFormDate').value;
  const qty = parseInt(document.getElementById('planFormQty').value, 10);
  const partNo = document.getElementById('planFormPartNo').value.trim();
  const partName = document.getElementById('planFormPartName').value.trim();
  const customer = document.getElementById('planFormCustomer').value.trim();
  const note = document.getElementById('planFormNote').value.trim();
  const idVal = document.getElementById('planFormId').value;

  if (!date || !partNo || !partName || !customer || isNaN(qty) || qty < 1) {
    showToast('Mohon isi semua field yang wajib diisi', 'error'); return;
  }
  if (idVal) {
    const idx = planningData.findIndex(p => p.id === +idVal);
    if (idx !== -1) {
      planningData[idx] = { ...planningData[idx], date, partNo, partName, customer, qty, note };
      showToast(`Planning "${partNo}" berhasil diperbarui`, 'success');
    }
  } else {
    planningData.push({ id: planNextId++, date, partNo, partName, customer, qty, scanned: false, note });
    showToast(`Planning "${partNo}" berhasil ditambahkan`, 'success');
  }
  closePlanForm();
  renderPlanning();
});

function deletePlanItem(id) {
  const idx = planningData.findIndex(p => p.id === id);
  if (idx === -1) return;
  const name = planningData[idx].partNo;
  if (!confirm(`Hapus planning "${name}" dari jadwal?`)) return;
  planningData.splice(idx, 1);
  renderPlanning();
  showToast(`Planning "${name}" dihapus`, 'success');
}

function resetScan(id) {
  const item = planningData.find(p => p.id === id);
  if (!item) return;
  item.scanned = false;
  // simpan override agar refresh tidak menimpa
  scanOverrides[item.partNo] = false;
  renderPlanning();
  showToast(`Scan "${item.partNo}" direset`, 'info');
}


// ── SCAN MODAL ─────────────────────────────────────────────────
const scanOverlay = document.getElementById('scanOverlay');

function openScanModal(id) {
  // single item scan
  scanTargetId = id;
  scanQueue = [];
  const item = planningData.find(p => p.id === id);
  if (!item) return;

  document.getElementById('scan-modal-title').textContent = 'Scan Part';
  document.getElementById('scanPartInfo').textContent = `${item.partNo} — ${item.partName}`;
  document.getElementById('scanInput').value = '';
  const res = document.getElementById('scanResult');
  res.style.display = 'none'; res.className = 'scan-result';

  // reset icon
  const wrap = document.getElementById('scanIconWrap');
  wrap.querySelector('i').className = 'fa-solid fa-barcode scan-icon';
  wrap.style.background = '';
  wrap.style.borderColor = '';

  scanOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('scanInput').focus(), 200);
}

function openScanAll() {
  // scan all pending in order
  scanQueue = planningData.filter(d => !d.scanned).map(d => d.id);
  if (scanQueue.length === 0) {
    showToast('Semua part sudah discan!', 'success'); return;
  }
  scanQueueIndex = 0;
  loadScanQueueItem();
  scanOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('scanInput').focus(), 200);
}

function loadScanQueueItem() {
  const id = scanQueue[scanQueueIndex];
  const item = planningData.find(p => p.id === id);
  if (!item) return;
  scanTargetId = id;
  const remaining = scanQueue.length - scanQueueIndex;
  document.getElementById('scan-modal-title').textContent = `Scan Part (${scanQueueIndex + 1}/${scanQueue.length})`;
  document.getElementById('scanPartInfo').textContent = `${item.partNo} — ${item.partName}`;
  document.getElementById('scanInput').value = '';
  const res = document.getElementById('scanResult');
  res.style.display = 'none'; res.className = 'scan-result';
  const wrap = document.getElementById('scanIconWrap');
  wrap.querySelector('i').className = 'fa-solid fa-barcode scan-icon';
  wrap.style.background = '';
  wrap.style.borderColor = '';
}

function closeScanModal() {
  scanOverlay.classList.remove('show');
  document.body.style.overflow = '';
  scanTargetId = null; scanQueue = []; scanQueueIndex = 0;
}

function confirmScan() {
  const input = document.getElementById('scanInput').value.trim();
  const item = planningData.find(p => p.id === scanTargetId);
  if (!item) return;
  const res = document.getElementById('scanResult');
  const wrap = document.getElementById('scanIconWrap');

  if (!input) { showToast('Input scan kosong', 'error'); return; }

  if (input.toUpperCase() === item.partNo.toUpperCase()) {
    // SUCCESS — mark as scanned
    item.scanned = true;
    scanOverrides[item.partNo] = true;

    // ── KURANGI STOCK ─────────────────────────────────────────
    const deductQty = item.qty || 1;
    const stockIdx = stockData.findIndex(s =>
      s.partNo.toUpperCase() === item.partNo.toUpperCase()
    );

    let stockMsg = '';
    if (stockIdx !== -1) {
      const before = stockData[stockIdx].quantity;
      const after = Math.max(0, before - deductQty);
      stockData[stockIdx].quantity = after;
      stockMsg = ` · Stock ${item.partNo}: ${before} → ${after}`;
      // Refresh stock page
      renderTable();
      updateSummary(stockData);
      writeStock('updateQty', { partNo: item.partNo, quantity: after }); // sync ke Sheets
      // Peringatan jika stock habis setelah scan
      if (after === 0) {
        setTimeout(() => showToast(`⚠️ Stock "${item.partNo}" sekarang HABIS!`, 'error'), 400);
      } else if (after <= 10) {
        setTimeout(() => showToast(`⚠️ Stock "${item.partNo}" hampir habis (${after} unit)`, 'info'), 400);
      }
    } else {
      // Item tidak ada di stock → tampilkan notifikasi
      setTimeout(() => {
        showToast(`⚠️ Part "${item.partNo}" tidak ditemukan di data Stock!`, 'error');
      }, 300);
    }
    // ─────────────────────────────────────────────────────────

    res.className = 'scan-result success';
    res.innerHTML = `<i class="fa-solid fa-circle-check"></i> Part <strong>${item.partNo}</strong> berhasil discan!${stockMsg ? `<br><small style="opacity:.8">${stockMsg}</small>` : ''}`;
    res.style.display = 'block';
    wrap.querySelector('i').className = 'fa-solid fa-circle-check scan-icon';
    wrap.style.background = 'linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.08))';
    wrap.style.borderColor = 'rgba(34,197,94,.4)';
    renderPlanning();
    showToast(`Scan "${item.partNo}" berhasil ✓`, 'success');

    // If queue mode, auto-advance after 1.2s
    if (scanQueue.length > 0) {
      scanQueueIndex++;
      if (scanQueueIndex < scanQueue.length) {
        setTimeout(() => loadScanQueueItem(), 1200);
      } else {
        setTimeout(() => { closeScanModal(); showToast('Semua part berhasil discan!', 'success'); }, 1200);
      }
    }
  } else {
    // FAIL
    res.className = 'scan-result error';
    res.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Part No tidak cocok. Coba lagi!`;
    res.style.display = 'block';
    wrap.querySelector('i').className = 'fa-solid fa-circle-xmark scan-icon';
    wrap.style.background = 'linear-gradient(135deg,rgba(239,68,68,.15),rgba(239,68,68,.05))';
    wrap.style.borderColor = 'rgba(239,68,68,.35)';
    document.getElementById('scanInput').value = '';
    document.getElementById('scanInput').focus();
  }
}

document.getElementById('scanModalClose').addEventListener('click', closeScanModal);
scanOverlay.addEventListener('click', e => { if (e.target === scanOverlay) closeScanModal(); });
document.getElementById('scanConfirmBtn').addEventListener('click', confirmScan);
document.getElementById('scanSkipBtn').addEventListener('click', () => {
  if (scanQueue.length > 0) {
    scanQueueIndex++;
    if (scanQueueIndex < scanQueue.length) loadScanQueueItem();
    else { closeScanModal(); showToast('Scan selesai', 'info'); }
  } else {
    closeScanModal();
  }
});
// Allow Enter key to confirm scan
document.getElementById('scanInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmScan();
});

document.getElementById('planScanAllBtn').addEventListener('click', openScanAll);

// Sidebar "Scan Part" button — quick scan all pending items directly
document.getElementById('sidebarScanAllBtn').addEventListener('click', () => {
  quickScanAll();
  if (window.innerWidth <= 900) closeSidebar();
});

// ── QUICK SCAN ALL (scan semua pending sekaligus, tanpa modal) ──
function quickScanAll() {
  const pending = planningData.filter(d => !d.scanned);
  if (pending.length === 0) {
    showToast('Semua part sudah discan!', 'success');
    return;
  }
  let doneCount = 0, notFoundList = [];
  pending.forEach(item => {
    item.scanned = true;
    scanOverrides[item.partNo] = true;
    const deductQty = item.qty || 1;
    const stockIdx = stockData.findIndex(s =>
      s.partNo.toUpperCase() === item.partNo.toUpperCase()
    );
    if (stockIdx !== -1) {
      const after = Math.max(0, stockData[stockIdx].quantity - deductQty);
      stockData[stockIdx].quantity = after;
      doneCount++;
      writeStock('updateQty', { partNo: item.partNo, quantity: after }); // sync ke Sheets
    } else {
      notFoundList.push(item.partNo);
    }
  });
  renderTable();
  updateSummary(stockData);
  renderPlanning();
  if (doneCount > 0) showToast(`✅ ${doneCount} part berhasil discan & stock diperbarui`, 'success');
  if (notFoundList.length > 0) {
    setTimeout(() => showToast(`⚠️ ${notFoundList.length} part tidak ditemukan di Stock: ${notFoundList.join(', ')}`, 'error'), 600);
  }
}



// ── CATALOG PAGE ──────────────────────────────────────────────
function renderCatalog() {
  let data = [...catalogData];
  const q = state.catalogSearch.toLowerCase();
  if (q) data = data.filter(d => d.name.toLowerCase().includes(q) || d.partNo.toLowerCase().includes(q));
  if (state.catalogCat !== 'all') data = data.filter(d => d.category === state.catalogCat);

  const grid = document.getElementById('catalogGrid');
  grid.className = 'catalog-grid' + (state.catalogView === 'list' ? ' list-view' : '');

  if (data.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3)"><i class="fa-solid fa-search" style="font-size:2rem;display:block;margin-bottom:10px"></i>Tidak ada katalog ditemukan</div>`;
    return;
  }
  grid.innerHTML = data.map(d => {
    const st = getStatus(d.stock);
    return `
    <div class="catalog-card" data-cid="${d.id}" role="button" tabindex="0" aria-label="${d.name}">
      <div class="catalog-card-img">
        ${d.img ? `<img src="${d.img}" alt="${d.name}" loading="lazy"/>` : `<i class="fa-solid fa-image img-placeholder"></i>`}
        <span class="catalog-cat-badge">${d.category}</span>
      </div>
      <div class="catalog-card-body">
        <p class="catalog-card-name">${d.name}</p>
        <p class="catalog-card-partno">${d.partNo}</p>
        <div class="catalog-card-footer">
          <span class="catalog-card-stock badge ${st.cls}">${st.dot} ${d.stock} unit</span>
        </div>
        <div class="catalog-card-actions">
          <button class="cat-action-btn edit-btn" data-cid="${d.id}" aria-label="Edit ${d.name}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="cat-action-btn delete delete-btn" data-cid="${d.id}" aria-label="Hapus ${d.name}"><i class="fa-solid fa-trash"></i> Hapus</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // View detail on card click (not on action buttons)
  grid.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.cat-action-btn')) return;
      openCatalogModal(+card.dataset.cid);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.target.closest('.cat-action-btn')) openCatalogModal(+card.dataset.cid);
    });
  });
  grid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openCatalogForm(+btn.dataset.cid); });
  });
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteCatalogItem(+btn.dataset.cid); });
  });
}

function openCatalogModal(id) {
  const d = catalogData.find(c => c.id === id);
  if (!d) return;
  const st = getStatus(d.stock);
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-part-img">
      ${d.img ? `<img src="${d.img}" alt="${d.name}"/>` : `<i class="fa-solid fa-image" style="font-size:3rem;color:var(--text3)"></i>`}
    </div>
    <span class="badge" style="background:rgba(99,102,241,.15);color:var(--primary-light);margin-bottom:10px;display:inline-flex">${d.category}</span>
    <h2 class="modal-title">${d.name}</h2>
    <p class="modal-partno">${d.partNo}</p>
    <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px">${d.desc}</p>
    <div class="modal-details">
      <div class="modal-detail-item"><p class="modal-detail-label">Stok</p><p class="modal-detail-value"><span class="badge ${st.cls}">${st.dot} ${d.stock} unit</span></p></div>
      <div class="modal-detail-item"><p class="modal-detail-label">Kategori</p><p class="modal-detail-value" style="text-transform:capitalize">${d.category}</p></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn-outline" style="flex:1" onclick="openCatalogForm(${d.id});closeModal()"><i class="fa-solid fa-pen"></i> Edit Barang</button>
    </div>`;
  modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ── CATALOG FORM (ADD / EDIT) ─────────────────────────────────
const catalogFormOverlay = document.getElementById('catalogFormOverlay');

function openCatalogForm(id = null) {
  const titleEl = document.getElementById('catalog-form-title');
  const subtitleEl = document.getElementById('catalogFormSubtitle');
  const preview = document.getElementById('filePreview');
  document.getElementById('formItemId').value = id || '';
  // Reset file data
  document.getElementById('formImgData').value = '';
  document.getElementById('formImg').value = '';
  if (id) {
    const d = catalogData.find(c => c.id === id);
    if (!d) return;
    titleEl.textContent = 'Edit Barang';
    subtitleEl.textContent = 'Ubah detail barang yang dipilih';
    document.getElementById('formName').value = d.name;
    document.getElementById('formPartNo').value = d.partNo;
    document.getElementById('formCategory').value = d.category;
    document.getElementById('formStock').value = d.stock;
    document.getElementById('formDesc').value = d.desc || '';
    // Show existing image in preview
    if (d.img) {
      preview.innerHTML = `<img src="${d.img}" alt="preview"/>`;
    } else {
      preview.innerHTML = `<i class="fa-solid fa-image"></i><span>Belum ada foto dipilih</span>`;
    }
  } else {
    titleEl.textContent = 'Tambah Barang';
    subtitleEl.textContent = 'Isi detail barang baru';
    document.getElementById('catalogForm').reset();
    preview.innerHTML = `<i class="fa-solid fa-image"></i><span>Belum ada foto dipilih</span>`;
  }
  catalogFormOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCatalogForm() {
  catalogFormOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('catalogFormClose').addEventListener('click', closeCatalogForm);
document.getElementById('catalogFormCancel').addEventListener('click', closeCatalogForm);
catalogFormOverlay.addEventListener('click', e => { if (e.target === catalogFormOverlay) closeCatalogForm(); });
document.getElementById('addItemBtn').addEventListener('click', () => openCatalogForm());

// File picker preview
document.getElementById('formImg').addEventListener('change', function () {
  const file = this.files[0];
  const preview = document.getElementById('filePreview');
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('formImgData').value = e.target.result;
    preview.innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('catalogForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('formName').value.trim();
  const partNo = document.getElementById('formPartNo').value.trim();
  const cat = document.getElementById('formCategory').value;
  const stock = parseInt(document.getElementById('formStock').value, 10);
  const desc = document.getElementById('formDesc').value.trim();
  const img = document.getElementById('formImgData').value || '';
  const idVal = document.getElementById('formItemId').value;

  if (!name || !partNo || isNaN(stock) || stock < 0) {
    showToast('Mohon isi semua field yang wajib diisi', 'error');
    return;
  }

  if (idVal) {
    const idx = catalogData.findIndex(c => c.id === +idVal);
    if (idx !== -1) {
      // Keep old img if user didn't pick new one
      const oldImg = catalogData[idx].img;
      catalogData[idx] = { ...catalogData[idx], name, partNo, category: cat, stock, desc, img: img || oldImg };
      showToast(`Barang "${name}" berhasil diperbarui`, 'success');
    }
  } else {
    catalogData.push({ id: catalogNextId++, name, partNo, category: cat, stock, desc, img });
    showToast(`Barang "${name}" berhasil ditambahkan`, 'success');
  }
  closeCatalogForm();
  renderCatalog();
});

function deleteCatalogItem(id) {
  const idx = catalogData.findIndex(c => c.id === id);
  if (idx === -1) return;
  const name = catalogData[idx].name;
  if (!confirm(`Hapus barang "${name}" dari katalog?`)) return;
  catalogData.splice(idx, 1);
  renderCatalog();
  showToast(`Barang "${name}" berhasil dihapus`, 'success');
}

document.getElementById('catalogSearch').addEventListener('input', e => {
  state.catalogSearch = e.target.value;
  renderCatalog();
});

document.querySelectorAll('.cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.catalogCat = tab.dataset.cat;
    renderCatalog();
  });
});

document.getElementById('gridViewBtn').addEventListener('click', () => {
  state.catalogView = 'grid';
  document.getElementById('gridViewBtn').classList.add('active');
  document.getElementById('listViewBtn').classList.remove('active');
  renderCatalog();
});
document.getElementById('listViewBtn').addEventListener('click', () => {
  state.catalogView = 'list';
  document.getElementById('listViewBtn').classList.add('active');
  document.getElementById('gridViewBtn').classList.remove('active');
  renderCatalog();
});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${msg}`;
  toastContainer.appendChild(t);
  setTimeout(() => {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove());
  }, 3200);
}

// ── STOCK FORM (ADD / EDIT) ───────────────────────────────────
const stockFormOverlay = document.getElementById('stockFormOverlay');

function openStockForm(id = null) {
  const titleEl = document.getElementById('stock-form-title');
  const subtitleEl = document.getElementById('stockFormSubtitle');
  const iconEl = document.getElementById('stockFormIcon');
  document.getElementById('stockFormId').value = id || '';

  if (id) {
    const d = stockData.find(s => s.id === id);
    if (!d) return;
    titleEl.textContent = 'Edit Item Stock';
    subtitleEl.textContent = 'Ubah detail item stok yang dipilih';
    iconEl.innerHTML = '<i class="fa-solid fa-pen"></i>';
    iconEl.style.background = 'linear-gradient(135deg,rgba(99,102,241,.2),rgba(99,102,241,.08))';
    iconEl.style.borderColor = 'rgba(99,102,241,.35)';
    document.getElementById('stockFormPartNo').value = d.partNo;
    document.getElementById('stockFormJobNo').value = d.jobNo;
    document.getElementById('stockFormAddress').value = d.address;
    document.getElementById('stockFormCategory').value = d.category;
    document.getElementById('stockFormCustomer').value = d.customer;
    document.getElementById('stockFormQty').value = d.quantity;
    document.getElementById('stockFormImg').value = d.img || '';
  } else {
    titleEl.textContent = 'Tambah Item Stock';
    subtitleEl.textContent = 'Isi detail item stok baru';
    iconEl.innerHTML = '<i class="fa-solid fa-plus"></i>';
    iconEl.style.background = '';
    iconEl.style.borderColor = '';
    document.getElementById('stockForm').reset();
  }
  stockFormOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('stockFormPartNo').focus(), 150);
}

function closeStockForm() {
  stockFormOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('stockFormClose').addEventListener('click', closeStockForm);
document.getElementById('stockFormCancel').addEventListener('click', closeStockForm);
stockFormOverlay.addEventListener('click', e => { if (e.target === stockFormOverlay) closeStockForm(); });

// Sidebar button
document.getElementById('sidebarAddStockBtn').addEventListener('click', () => {
  openStockForm();
  if (window.innerWidth <= 900) closeSidebar();
});

// Qty ± buttons
document.getElementById('qtyPlus').addEventListener('click', () => {
  const inp = document.getElementById('stockFormQty');
  inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + 1);
});
document.getElementById('qtyMinus').addEventListener('click', () => {
  const inp = document.getElementById('stockFormQty');
  inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) - 1);
});

document.getElementById('stockForm').addEventListener('submit', e => {
  e.preventDefault();
  const partNo = document.getElementById('stockFormPartNo').value.trim();
  const jobNo = document.getElementById('stockFormJobNo').value.trim();
  const address = document.getElementById('stockFormAddress').value.trim();
  const category = document.getElementById('stockFormCategory').value;
  const customer = document.getElementById('stockFormCustomer').value.trim();
  const quantity = parseInt(document.getElementById('stockFormQty').value, 10);
  const img = document.getElementById('stockFormImg').value.trim();
  const idVal = document.getElementById('stockFormId').value;

  if (!partNo || !jobNo || !address || !customer || isNaN(quantity) || quantity < 0) {
    showToast('Mohon isi semua field yang wajib diisi', 'error');
    return;
  }

  if (idVal) {
    const idx = stockData.findIndex(s => s.id === +idVal);
    if (idx !== -1) {
      const oldPartNo = stockData[idx].partNo; // simpan sebelum diubah
      stockData[idx] = { ...stockData[idx], partNo, jobNo, address, category, customer, quantity, img };
      showToast(`Item "${partNo}" berhasil diperbarui`, 'success');
      writeStock('update', { partNo, jobNo, address, customer, quantity, category, img, oldPartNo }); // sync ke Sheets
    }
  } else {
    stockData.push({ id: stockNextId++, partNo, jobNo, address, customer, quantity, category, img });
    showToast(`Item "${partNo}" berhasil ditambahkan`, 'success');
    writeStock('add', { partNo, jobNo, address, customer, quantity, category, img }); // sync ke Sheets
  }

  closeStockForm();
  renderTable();
  updateSummary(stockData);
});

function deleteStockItem(id) {
  const idx = stockData.findIndex(s => s.id === id);
  if (idx === -1) return;
  const name = stockData[idx].partNo;
  if (!confirm(`Hapus item "${name}" dari daftar stok?`)) return;
  stockData.splice(idx, 1);
  renderTable();
  updateSummary(stockData);
  showToast(`Item "${name}" berhasil dihapus`, 'success');
  writeStock('delete', { partNo: name }); // sync ke Sheets
}

// ── SIDEBAR STOCK PANEL ──────────────────────────────────────────
// Aggregates parts from planningData (Google Sheets) into a compact
// stock list in the sidebar. Auto-updates when Sheets data refreshes.

let sidebarStockFilter = 'all';
let sidebarStockSearch = '';

// Toggle collapse
document.getElementById('sidebarStockToggle')?.addEventListener('click', () => {
  const panel = document.getElementById('sidebarStockPanel');
  panel.classList.toggle('collapsed');
  localStorage.setItem('sidebarStockCollapsed', panel.classList.contains('collapsed'));
});

// Search
document.getElementById('sidebarStockSearch')?.addEventListener('input', e => {
  sidebarStockSearch = e.target.value;
  renderSidebarStock();
});

// Filter chips
document.querySelectorAll('.sb-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.sb-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    sidebarStockFilter = chip.dataset.sbfilter;
    renderSidebarStock();
  });
});

/**
 * Build aggregated stock map from planningData.
 * Groups by partNo, sums qty, tracks latest status/customer/partName.
 */
function buildSidebarStockData() {
  const map = new Map();

  planningData.forEach(item => {
    const key = item.partNo.toUpperCase();
    if (!key) return;

    if (map.has(key)) {
      const existing = map.get(key);
      existing.totalQty += (item.qty || 0);
      existing.orderCount += 1;
      // Keep latest customer/status
      if (item.date > existing.latestDate) {
        existing.latestDate = item.date;
        existing.customer = item.customer;
        existing.status = item.status;
      }
    } else {
      map.set(key, {
        partNo: item.partNo,
        partName: item.partName,
        customer: item.customer,
        status: item.status || '',
        totalQty: item.qty || 0,
        orderCount: 1,
        latestDate: item.date || '',
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
}

/**
 * Render the sidebar stock list.
 */
function renderSidebarStock() {
  const list = document.getElementById('sidebarStockList');
  if (!list) return;

  let data = buildSidebarStockData();

  // Apply search filter
  const q = sidebarStockSearch.toLowerCase().trim();
  if (q) {
    data = data.filter(d =>
      d.partNo.toLowerCase().includes(q) ||
      d.partName.toLowerCase().includes(q) ||
      d.customer.toLowerCase().includes(q)
    );
  }

  // Apply status filter
  if (sidebarStockFilter === 'open') {
    data = data.filter(d => {
      const st = (d.status || '').toUpperCase();
      return st !== 'CLOSE' && st !== 'DONE';
    });
  } else if (sidebarStockFilter === 'close') {
    data = data.filter(d => {
      const st = (d.status || '').toUpperCase();
      return st === 'CLOSE' || st === 'DONE';
    });
  }

  // Find max qty for bar scaling
  const maxQty = data.reduce((m, d) => Math.max(m, d.totalQty), 1);

  if (data.length === 0) {
    list.innerHTML = `
      <div class="sb-stock-empty">
        <i class="fa-solid fa-box-open"></i>
        <span>${q ? 'Tidak ditemukan' : 'Belum ada data'}</span>
      </div>`;
  } else {
    list.innerHTML = data.map(d => {
      const st = (d.status || '').toUpperCase();
      const dotCls = d.totalQty >= 10 ? 'green' : d.totalQty >= 3 ? 'orange' : 'red';
      const barPct = Math.min(100, Math.round((d.totalQty / maxQty) * 100));
      const barCls = d.totalQty <= 2 ? 'low' : d.totalQty <= 5 ? 'mid' : '';

      // Status class mapping
      let statusCls = 'status-other';
      if (st === 'CLOSE' || st === 'DONE') statusCls = 'status-close';
      else if (st === 'OPEN' || st === 'PROGRESS') statusCls = 'status-open';
      else if (st === 'IKAR') statusCls = 'status-ikar';
      else if (st === 'CGS') statusCls = 'status-cgs';

      return `
        <div class="sb-stock-item" title="${d.partNo}\n${d.partName}\nCustomer: ${d.customer}\nTotal Qty: ${d.totalQty}\nOrders: ${d.orderCount}">
          <div class="sb-stock-item-header">
            <span class="sb-stock-partno">${d.partNo}</span>
            <span class="sb-stock-qty">
              <span class="qty-dot ${dotCls}"></span>
              ${d.totalQty}
            </span>
          </div>
          <div class="sb-stock-name">${d.partName}</div>
          <div class="sb-stock-meta">
            <span class="sb-stock-customer">${d.customer}</span>
            ${d.status ? `<span class="sb-stock-status ${statusCls}">${d.status}</span>` : ''}
          </div>
          <div class="sb-stock-bar">
            <div class="sb-stock-bar-fill ${barCls}" style="width:${barPct}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  // Update count badge
  const allData = buildSidebarStockData();
  const totalParts = allData.length;
  const totalQty = allData.reduce((s, d) => s + d.totalQty, 0);

  document.getElementById('sidebarStockCount').textContent = totalParts;
  document.getElementById('sbFooterTotal').textContent = totalParts;
  document.getElementById('sbFooterQty').textContent = totalQty.toLocaleString();
}

/**
 * Update sidebar stock sync status indicator.
 */
function setSidebarStockSync(status, msg = '') {
  const el = document.getElementById('sidebarStockSync');
  if (!el) return;
  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (status === 'loading') {
    el.className = 'sidebar-stock-sync';
    el.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span>Menghubungkan…</span>';
  } else if (status === 'ok') {
    el.className = 'sidebar-stock-sync synced';
    el.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Tersinkron · ${now}</span>`;
  } else if (status === 'empty') {
    el.className = 'sidebar-stock-sync';
    el.style.color = 'var(--blue)';
    el.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>Sheet kosong · ${now}</span>`;
  } else {
    el.className = 'sidebar-stock-sync error';
    el.style.color = '';
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>Gagal · ${now}</span>`;
  }
}

/**
 * Initialize sidebar stock panel state.
 */
function initSidebarStockPanel() {
  // Restore collapsed state
  const collapsed = localStorage.getItem('sidebarStockCollapsed') === 'true';
  const panel = document.getElementById('sidebarStockPanel');
  if (panel && collapsed) panel.classList.add('collapsed');

  // Initial render
  renderSidebarStock();
}


// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeStockForm(); closeExportConfirm(); }
});

// ── EXPORT TO GOOGLE SHEETS ───────────────────────────────────

// URL Apps Script Web App (disimpan di localStorage)
let EXPORT_SCRIPT_URL = localStorage.getItem('exportScriptUrl') || '';

const exportConfigOverlay = document.getElementById('exportConfigOverlay');
const exportToSheetsBtn   = document.getElementById('exportToSheetsBtn');
const exportConfigClose   = document.getElementById('exportConfigClose');
const exportConfigCancel  = document.getElementById('exportConfigCancel');
const exportConfigSave    = document.getElementById('exportConfigSave');
const exportScriptUrlInput = document.getElementById('exportScriptUrl');

/** Buka modal setup export */
function openExportConfig() {
  if (exportScriptUrlInput) exportScriptUrlInput.value = EXPORT_SCRIPT_URL;
  exportConfigOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/** Tutup modal setup export */
function closeExportConfig() {
  exportConfigOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

// Tombol "Export ke Sheets" — buka konfirmasi dulu, jangan langsung export
exportToSheetsBtn?.addEventListener('click', () => {
  if (!EXPORT_SCRIPT_URL) {
    openExportConfig();   // belum ada URL → setup dulu
  } else {
    openExportConfirm();  // URL sudah ada → tampilkan konfirmasi
  }
});

exportConfigClose?.addEventListener('click', closeExportConfig);
exportConfigCancel?.addEventListener('click', closeExportConfig);
exportConfigOverlay?.addEventListener('click', e => {
  if (e.target === exportConfigOverlay) closeExportConfig();
});

/** Simpan URL SAJA — tidak langsung export */
exportConfigSave?.addEventListener('click', () => {
  const url = exportScriptUrlInput?.value.trim();
  if (!url || !url.startsWith('https://script.google.com/')) {
    showToast('⚠️ URL tidak valid. Pastikan URL dari Google Apps Script.', 'error');
    exportScriptUrlInput?.focus();
    return;
  }
  EXPORT_SCRIPT_URL = url;
  localStorage.setItem('exportScriptUrl', url);
  closeExportConfig();
  showToast('✅ URL Apps Script disimpan!', 'success');
  // Tampilkan konfirmasi setelah simpan
  setTimeout(openExportConfirm, 350);
});

/**
 * Buka modal konfirmasi + preview data sebelum export.
 * User harus klik tombol konfirmasi untuk memulai export.
 */
function openExportConfirm() {
  if (!stockData || stockData.length === 0) {
    showToast('⚠️ Tidak ada data untuk diekspor.', 'error');
    return;
  }

  const total = stockData.length;
  const avail = stockData.filter(d => d.quantity > 10).length;
  const low   = stockData.filter(d => d.quantity > 0 && d.quantity <= 10).length;
  const out   = stockData.filter(d => d.quantity === 0).length;

  // Preview 5 baris pertama
  const previewRows = stockData.slice(0, 5).map((d, i) => {
    const qty = d.quantity;
    const stColor = qty === 0 ? 'var(--red)' : qty <= 10 ? 'var(--orange)' : 'var(--green)';
    const stLabel = qty === 0 ? 'Habis' : qty <= 10 ? 'Low' : 'OK';
    return `<tr>
      <td style="text-align:center;color:var(--text3);font-size:.75rem">${i+1}</td>
      <td><code style="font-size:.78rem;color:var(--primary-light)">${d.partNo}</code></td>
      <td style="font-size:.78rem">${d.customer}</td>
      <td style="text-align:center;font-weight:700">${qty}</td>
      <td style="text-align:center">
        <span style="color:${stColor};font-weight:700;font-size:.75rem">${stLabel}</span>
      </td>
    </tr>`;
  }).join('');

  const moreLabel = total > 5 ? `<tr><td colspan="5" style="text-align:center;color:var(--text3);font-size:.75rem;padding:8px">… dan ${total - 5} item lainnya</td></tr>` : '';

  // Bangun atau update modal konfirmasi
  let confirmOverlay = document.getElementById('exportConfirmOverlay');
  if (!confirmOverlay) {
    confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'exportConfirmOverlay';
    confirmOverlay.className = 'modal-overlay';
    confirmOverlay.setAttribute('role', 'dialog');
    confirmOverlay.setAttribute('aria-modal', 'true');
    document.body.appendChild(confirmOverlay);
  }

  confirmOverlay.innerHTML = `
    <div class="modal" style="max-width:520px">
      <button class="modal-close" id="exportConfirmClose" aria-label="Tutup">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="modal-body">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--border)">
          <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,rgba(22,163,74,.2),rgba(22,163,74,.08));border:2px solid rgba(22,163,74,.35);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#22c55e;flex-shrink:0">
            <i class="fa-solid fa-file-export"></i>
          </div>
          <div>
            <h2 class="modal-title" style="margin-bottom:3px">Konfirmasi Export ke Sheets</h2>
            <p class="modal-partno">Data akan ditulis ke tab <b>Stock</b> di spreadsheet Anda</p>
          </div>
        </div>

        <!-- Summary stat pills -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:99px;padding:5px 14px;font-size:.78rem;font-weight:700;color:var(--primary-light)">
            <i class="fa-solid fa-cubes" style="margin-right:5px"></i>${total} Item
          </div>
          <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);border-radius:99px;padding:5px 14px;font-size:.78rem;font-weight:700;color:var(--green)">
            <i class="fa-solid fa-circle-check" style="margin-right:5px"></i>${avail} Tersedia
          </div>
          <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:99px;padding:5px 14px;font-size:.78rem;font-weight:700;color:var(--orange)">
            <i class="fa-solid fa-triangle-exclamation" style="margin-right:5px"></i>${low} Low Stock
          </div>
          <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:99px;padding:5px 14px;font-size:.78rem;font-weight:700;color:var(--red)">
            <i class="fa-solid fa-circle-xmark" style="margin-right:5px"></i>${out} Habis
          </div>
        </div>

        <!-- Preview tabel -->
        <p style="font-size:.78rem;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Preview Data (${Math.min(5,total)} dari ${total})</p>
        <div style="overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;min-width:380px">
            <thead>
              <tr style="background:var(--surface2)">
                <th style="padding:8px 10px;font-size:.7rem;font-weight:700;color:var(--text3);text-align:center">#</th>
                <th style="padding:8px 10px;font-size:.7rem;font-weight:700;color:var(--text3);text-align:left">Part No</th>
                <th style="padding:8px 10px;font-size:.7rem;font-weight:700;color:var(--text3);text-align:left">Customer</th>
                <th style="padding:8px 10px;font-size:.7rem;font-weight:700;color:var(--text3);text-align:center">Qty</th>
                <th style="padding:8px 10px;font-size:.7rem;font-weight:700;color:var(--text3);text-align:center">Status</th>
              </tr>
            </thead>
            <tbody style="font-size:.82rem;color:var(--text2)">
              ${previewRows}
              ${moreLabel}
            </tbody>
          </table>
        </div>

        <!-- Info format Excel -->
        <div style="background:rgba(22,163,74,.07);border:1px solid rgba(22,163,74,.2);border-radius:var(--radius);padding:12px 14px;margin-bottom:20px;font-size:.78rem;color:var(--text2);line-height:1.6">
          <i class="fa-solid fa-table" style="color:#22c55e;margin-right:6px"></i>
          <b>Format Excel yang akan ditulis:</b> Header biru navy · Baris selang-seling · 
          Kolom Status berwarna · Filter dropdown · Freeze row header
        </div>

        <!-- Tombol aksi -->
        <div class="form-actions">
          <button type="button" class="btn-outline" id="exportConfirmCancel">
            <i class="fa-solid fa-xmark"></i> Batal
          </button>
          <button type="button" class="btn-export" id="exportConfirmRun">
            <i class="fa-solid fa-file-export"></i> Ya, Export Sekarang
          </button>
        </div>
      </div>
    </div>`;

  confirmOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Event listeners pada modal konfirmasi
  document.getElementById('exportConfirmClose')?.addEventListener('click', closeExportConfirm);
  document.getElementById('exportConfirmCancel')?.addEventListener('click', closeExportConfirm);
  confirmOverlay.addEventListener('click', e => {
    if (e.target === confirmOverlay) closeExportConfirm();
  });
  document.getElementById('exportConfirmRun')?.addEventListener('click', () => {
    closeExportConfirm();
    setTimeout(runExport, 200);   // jalankan export setelah modal tertutup
  });
}

/** Tutup modal konfirmasi */
function closeExportConfirm() {
  const el = document.getElementById('exportConfirmOverlay');
  if (el) { el.classList.remove('show'); }
  document.body.style.overflow = '';
}

/**
 * Kirim seluruh stockData ke Google Sheets via Apps Script.
 * Menampilkan progress bar animasi & toast hasil.
 */
async function runExport() {
  if (!EXPORT_SCRIPT_URL) { openExportConfig(); return; }
  if (!stockData || stockData.length === 0) {
    showToast('⚠️ Tidak ada data untuk diekspor.', 'error');
    return;
  }

  // Ubah tampilan tombol → loading
  const btn  = exportToSheetsBtn;
  const icon = btn?.querySelector('i');
  const text = btn?.querySelector('.btn-text');
  if (btn)  { btn.disabled = true; }
  if (icon) { icon.className = 'fa-solid fa-rotate fa-spin'; }
  if (text) { text.textContent = 'Mengekspor…'; }

  // Tampilkan progress bar di badge sync
  setStockSyncStatus('loading');
  const badge = document.getElementById('stockSyncBadge');
  if (badge) {
    badge.innerHTML = `
      <i class="fa-solid fa-rotate fa-spin"></i>
      <span>Mengekspor ${stockData.length} item ke Sheets…</span>`;
  }

  try {
    const payload = {
      action : 'exportStock',
      data   : stockData.map(d => ({
        partNo  : d.partNo   || '',
        jobNo   : d.jobNo    || '',
        address : d.address  || '',
        customer: d.customer || '',
        quantity: d.quantity || 0,
        category: d.category || '',
        img     : d.img      || '',
      }))
    };

    const res  = await fetch(EXPORT_SCRIPT_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'text/plain' },   // avoid CORS preflight
      body   : JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.success) {
      // ── Sukses ──────────────────────────────────────────────
      const sheetUrl = json.url ||
        'https://docs.google.com/spreadsheets/d/1XcutKioxyaY7lJzKOTNKk-TnLmgcMOJGYsng-MhUiZY/edit';

      showToast(`✅ ${json.message || `Berhasil export ${stockData.length} item!`}`, 'success');

      // Update badge dengan link buka sheet
      if (badge) {
        badge.className = 'sync-badge sync-ok';
        badge.innerHTML = `
          <i class="fa-solid fa-circle-check"></i>
          <span>Export selesai · ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
          <a href="${sheetUrl}" target="_blank"
             style="margin-left:6px;color:inherit;text-decoration:underline;font-size:.72rem;"
             title="Buka Google Sheets">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka
          </a>`;
      }

      // Toast kedua dengan link
      setTimeout(() => {
        showToast(`📊 <a href="${sheetUrl}" target="_blank" style="color:#4ade80;text-decoration:underline;">Klik untuk buka spreadsheet</a>`, 'success', 6000);
      }, 800);

    } else {
      throw new Error(json.message || 'Export gagal tanpa keterangan');
    }

  } catch (err) {
    console.error('[Export]', err);
    const msg = err.message || 'Koneksi ke Apps Script gagal';
    showToast(`❌ Export gagal: ${msg}`, 'error');
    setStockSyncStatus('error', msg);
  } finally {
    // Kembalikan tombol ke normal
    if (btn)  btn.disabled  = false;
    if (icon) icon.className = 'fa-solid fa-file-export';
    if (text) text.textContent = 'Export ke Sheets';
  }
}

// ── Tombol Gear (⚙) — buka config export URL ───────────────────
document.getElementById('stockWriteConfigBtn')?.addEventListener('click', () => {
  openExportConfig();
});

// ── INIT ──────────────────────────────────────────────────────
function init() {
  const sidebarStockActions = document.getElementById('sidebarStockActions');
  if (sidebarStockActions) sidebarStockActions.classList.add('visible');

  initSidebarStockPanel();

  updateSummary(stockData);
  renderTable();
  renderCatalog();
  startStockAutoRefresh();
  startSheetsAutoRefresh();
  showToast('Dashboard siap digunakan', 'success');
}

init();


