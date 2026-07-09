/* ============================================
   app.js — Expense Tracker Logic
   Pencatatan Pengeluaran
   ============================================ */

'use strict';

// ── Storage keys ───────────────────────────────────────────
const KEY_TRANSAKSI  = 'pengeluaran_data';
const KEY_CATEGORIES = 'pengeluaran_categories';
const KEY_THEME      = 'pengeluaran_theme';
const KEY_SORT       = 'pengeluaran_sort';

// ── Built-in categories ────────────────────────────────────
const BUILTIN_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan', 'Lainnya'];

const BUILTIN_COLORS = {
  Makanan:      '#34d399',
  Transportasi: '#60a5fa',
  Hiburan:      '#fb923c',
  Lainnya:      '#a78bfa',
};

const BUILTIN_BADGE = {
  Makanan:      'badge-makanan',
  Transportasi: 'badge-transportasi',
  Hiburan:      'badge-hiburan',
  Lainnya:      'badge-lainnya',
};

const BUILTIN_EMOJI = {
  Makanan:      '🥗',
  Transportasi: '🚗',
  Hiburan:      '🎮',
  Lainnya:      '📦',
};

// Palette for auto-assigning colors to custom categories
const CUSTOM_COLOR_PALETTE = [
  '#f472b6', '#38bdf8', '#facc15', '#4ade80',
  '#fb7185', '#a78bfa', '#34d399', '#f97316',
  '#22d3ee', '#e879f9', '#86efac', '#fbbf24',
];

// ── State ──────────────────────────────────────────────────
let transaksi      = loadJSON(KEY_TRANSAKSI,  []);
let customCategories = loadJSON(KEY_CATEGORIES, []); // [{ name, color, emoji }]
let currentSort    = loadJSON(KEY_SORT, { field: 'date', dir: 'desc' });
let isDark         = localStorage.getItem(KEY_THEME) !== 'light';

// ── Persistence helpers ─────────────────────────────────────
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Category helpers ────────────────────────────────────────
function allCategories() {
  return [
    ...BUILTIN_CATEGORIES.map(name => ({
      name,
      color: BUILTIN_COLORS[name],
      emoji: BUILTIN_EMOJI[name],
      builtin: true,
    })),
    ...customCategories.map(c => ({ ...c, builtin: false })),
  ];
}

function getCategoryMeta(name) {
  if (BUILTIN_CATEGORIES.includes(name)) {
    return {
      color:     BUILTIN_COLORS[name],
      emoji:     BUILTIN_EMOJI[name],
      badgeClass: BUILTIN_BADGE[name],
      builtin:   true,
    };
  }
  const custom = customCategories.find(c => c.name === name);
  return {
    color:     custom?.color || '#a78bfa',
    emoji:     custom?.emoji || '🏷️',
    badgeClass: 'badge-custom',
    builtin:   false,
  };
}

function nextCustomColor() {
  const used = customCategories.map(c => c.color);
  return CUSTOM_COLOR_PALETTE.find(c => !used.includes(c))
    || CUSTOM_COLOR_PALETTE[customCategories.length % CUSTOM_COLOR_PALETTE.length];
}

// ── Theme ───────────────────────────────────────────────────
function applyTheme(dark) {
  isDark = dark;
  document.body.classList.toggle('light', !dark);
  localStorage.setItem(KEY_THEME, dark ? 'dark' : 'light');
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
  // Canvas donut hole colour depends on theme — redraw
  renderChart();
}

function toggleTheme() {
  applyTheme(!isDark);
}

// ── Formatting ──────────────────────────────────────────────
function formatRp(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Sorting ─────────────────────────────────────────────────
const SORT_OPTIONS = [
  { field: 'date',     dir: 'desc', label: 'Terbaru',   icon: '🕐' },
  { field: 'date',     dir: 'asc',  label: 'Terlama',   icon: '🕐' },
  { field: 'amount',   dir: 'desc', label: 'Terbesar',  icon: '↓' },
  { field: 'amount',   dir: 'asc',  label: 'Terkecil',  icon: '↑' },
  { field: 'category', dir: 'asc',  label: 'Kategori',  icon: '🏷️' },
];

function sortKey(opt) { return `${opt.field}_${opt.dir}`; }

function getSortedList() {
  const list = transaksi.slice();
  const { field, dir } = currentSort;
  list.sort((a, b) => {
    let va, vb;
    if (field === 'amount') {
      va = a.jumlah; vb = b.jumlah;
    } else if (field === 'category') {
      va = a.kategori.toLowerCase(); vb = b.kategori.toLowerCase();
    } else {
      // date — use id (timestamp)
      va = a.id; vb = b.id;
    }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
  return list;
}

function setSort(field, dir) {
  currentSort = { field, dir };
  saveJSON(KEY_SORT, currentSort);
  renderSortBar();
  renderList();
}

// ── Render: sort bar ────────────────────────────────────────
function renderSortBar() {
  const bar = document.getElementById('sortBar');
  if (!bar) return;

  bar.innerHTML = `<span class="sort-label">Urutkan:</span>` +
    SORT_OPTIONS.map(opt => {
      const active = currentSort.field === opt.field && currentSort.dir === opt.dir
        ? 'active' : '';
      return `<button
        class="btn-sort ${active}"
        data-field="${opt.field}"
        data-dir="${opt.dir}"
        aria-pressed="${active === 'active'}"
      >${opt.icon} ${opt.label}</button>`;
    }).join('');

  bar.querySelectorAll('.btn-sort').forEach(btn => {
    btn.addEventListener('click', () => setSort(btn.dataset.field, btn.dataset.dir));
  });
}

// ── Render: total ───────────────────────────────────────────
function renderTotal() {
  const total = transaksi.reduce((sum, t) => sum + t.jumlah, 0);
  document.getElementById('JumlahTotal').textContent = formatRp(total);
}

// ── Render: expense list ────────────────────────────────────
function renderList() {
  const container = document.getElementById('daftarTransaksi');

  if (transaksi.length === 0) {
    container.innerHTML = '<p class="expense-empty">Belum ada data yang dimasukkan</p>';
    return;
  }

  const sorted = getSortedList();

  const html = sorted.map(t => {
    const meta = getCategoryMeta(t.kategori);
    const badgeStyle = meta.badgeClass === 'badge-custom'
      ? `style="background:${hexAlpha(meta.color, 0.2)}; color:${meta.color}"`
      : '';

    // find original index for deletion
    const origIndex = transaksi.findIndex(x => x.id === t.id);

    return `
      <div class="expense-item">
        <div class="item-left">
          <p class="item-name">${escapeHtml(t.nama)}</p>
          <span class="badge ${meta.badgeClass}" ${badgeStyle}>
            ${meta.emoji} ${escapeHtml(t.kategori)}
          </span>
        </div>
        <div class="item-right">
          <span class="item-amount">${formatRp(t.jumlah)}</span>
          <button
            class="btn-delete"
            aria-label="Hapus ${escapeHtml(t.nama)}"
            data-index="${origIndex}"
          >✕</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="expense-list">${html}</div>`;

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => hapus(Number(btn.dataset.index)));
  });
}

// ── Hex → rgba helper ───────────────────────────────────────
function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Delete ──────────────────────────────────────────────────
function hapus(index) {
  transaksi.splice(index, 1);
  saveJSON(KEY_TRANSAKSI, transaksi);
  render();
}

// ── Render: category <select> ───────────────────────────────
function renderCategorySelect() {
  const sel = document.getElementById('kategori');
  if (!sel) return;

  const prev = sel.value;
  sel.innerHTML = '<option value="">— Pilih Kategori —</option>';

  allCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    sel.appendChild(opt);
  });

  if (prev) sel.value = prev;
}

// ── Render: custom category tags list ──────────────────────
function renderCustomCatList() {
  const wrap = document.getElementById('customCatList');
  if (!wrap) return;

  if (customCategories.length === 0) {
    wrap.innerHTML = '<span style="font-size:12px; color:var(--empty-color)">Belum ada kategori kustom</span>';
    return;
  }

  wrap.innerHTML = customCategories.map((cat, i) => `
    <span class="custom-cat-tag" style="border-color:${hexAlpha(cat.color, 0.4)}; color:${cat.color}">
      ${cat.emoji} ${escapeHtml(cat.name)}
      <button class="remove-cat" data-index="${i}" aria-label="Hapus kategori ${escapeHtml(cat.name)}">✕</button>
    </span>
  `).join('');

  wrap.querySelectorAll('.remove-cat').forEach(btn => {
    btn.addEventListener('click', () => removeCustomCategory(Number(btn.dataset.index)));
  });
}

// ── Add custom category ─────────────────────────────────────
function addCustomCategory() {
  const input = document.getElementById('customCatInput');
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  // Prevent duplicates (case-insensitive)
  const exists = allCategories().some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    input.style.borderColor = 'rgba(248,113,113,0.7)';
    setTimeout(() => { input.style.borderColor = ''; }, 1200);
    return;
  }

  const color = nextCustomColor();
  const emoji = '🏷️';
  customCategories.push({ name, color, emoji });
  saveJSON(KEY_CATEGORIES, customCategories);

  input.value = '';
  renderCustomCatList();
  renderCategorySelect();
}

// ── Remove custom category ──────────────────────────────────
function removeCustomCategory(index) {
  const removed = customCategories[index];
  customCategories.splice(index, 1);
  saveJSON(KEY_CATEGORIES, customCategories);

  // Reclassify orphaned transactions to 'Lainnya'
  let changed = false;
  transaksi.forEach(t => {
    if (t.kategori === removed.name) {
      t.kategori = 'Lainnya';
      changed = true;
    }
  });
  if (changed) saveJSON(KEY_TRANSAKSI, transaksi);

  renderCustomCatList();
  renderCategorySelect();
  render();
}

// ── Toggle custom category panel ───────────────────────────
function toggleCustomCatPanel() {
  const panel = document.getElementById('customCatPanel');
  if (!panel) return;
  panel.classList.toggle('open');
  const btn = document.getElementById('btnToggleCustomCat');
  if (btn) btn.textContent = panel.classList.contains('open') ? '✕ Tutup' : '＋ Kategori';
}

// ── Render: donut chart ─────────────────────────────────────
function renderChart() {
  const canvas = document.getElementById('grafikLingkaran');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const outerR = W / 2 - 8;
  const innerR = W / 3.4;

  // Theme-aware hole colour
  const holeColor = isDark ? 'rgba(15,12,41,0.75)' : 'rgba(232,234,246,0.9)';
  const holeColorEmpty = isDark ? 'rgba(15,12,41,0.7)' : 'rgba(232,234,246,0.8)';
  const gapColor = isDark ? 'rgba(15,12,41,0.6)' : 'rgba(232,234,246,0.8)';
  const emptyFill = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,46,0.85)';
  const subTextColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)';
  const emptyTextColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(26,26,46,0.3)';

  ctx.clearRect(0, 0, W, H);

  const perKategori = {};
  transaksi.forEach(t => {
    perKategori[t.kategori] = (perKategori[t.kategori] || 0) + t.jumlah;
  });

  const total = Object.values(perKategori).reduce((s, v) => s + v, 0);
  const legend = document.getElementById('legendGrafik');
  legend.innerHTML = '';

  // ── Empty state ──
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = emptyFill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = holeColorEmpty;
    ctx.fill();
    ctx.fillStyle = emptyTextColor;
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tidak ada data', cx, cy);
    return;
  }

  // ── Draw slices ──
  let startAngle = -Math.PI / 2;

  Object.entries(perKategori).forEach(([kat, val]) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    const color = getCategoryMeta(kat).color;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.strokeStyle = gapColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    startAngle += sliceAngle;
  });

  // ── Donut hole ──
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = holeColor;
  ctx.fill();

  // ── Center text ──
  const katCount = Object.keys(perKategori).length;
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.round(W * 0.085)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(katCount, cx, cy - 9);
  ctx.font = `${Math.round(W * 0.052)}px -apple-system, sans-serif`;
  ctx.fillStyle = subTextColor;
  ctx.fillText('kategori', cx, cy + 12);

  // ── Legend ──
  Object.entries(perKategori).forEach(([kat, val]) => {
    const color = getCategoryMeta(kat).color;
    const pct = ((val / total) * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
      <div class="legend-dot-label">
        <span class="legend-dot" style="background:${color}"></span>
        <span>${escapeHtml(kat)}</span>
      </div>
      <span class="legend-pct">${pct}%</span>
    `;
    legend.appendChild(row);
  });
}

// ── Full render ─────────────────────────────────────────────
function render() {
  renderTotal();
  renderList();
  renderChart();
}

// ── Form submission ─────────────────────────────────────────
document.getElementById('formTransaksi').addEventListener('submit', function (e) {
  e.preventDefault();

  const nama     = document.getElementById('namaBarang').value.trim();
  const jumlah   = parseFloat(document.getElementById('jumlahUang').value);
  const kategori = document.getElementById('kategori').value;

  if (!nama || isNaN(jumlah) || jumlah <= 0 || !kategori) return;

  transaksi.push({ nama, jumlah, kategori, id: Date.now() });
  saveJSON(KEY_TRANSAKSI, transaksi);
  render();
  this.reset();
});

// ── Wire up custom category controls ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const btnTheme = document.getElementById('btnTheme');
  if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

  // Custom category toggle panel
  const btnToggle = document.getElementById('btnToggleCustomCat');
  if (btnToggle) btnToggle.addEventListener('click', toggleCustomCatPanel);

  // Add category on button click
  const btnAddCat = document.getElementById('btnAddCat');
  if (btnAddCat) btnAddCat.addEventListener('click', addCustomCategory);

  // Add category on Enter key
  const catInput = document.getElementById('customCatInput');
  if (catInput) {
    catInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); }
    });
  }

  // Init theme
  applyTheme(isDark);

  // Init category select + custom list
  renderCategorySelect();
  renderCustomCatList();

  // Init sort bar
  renderSortBar();

  // Initial render
  render();
});
