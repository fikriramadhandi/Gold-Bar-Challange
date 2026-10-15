/**
 * Gold Bar Challenge — backend Google Sheets
 * BSI International Expo 2026 · BSI Tabungan Emas
 *
 * Cara pasang: lihat README.md (Langkah 1).
 * 1. Buka Google Sheet baru → Ekstensi → Apps Script → tempel seluruh file ini.
 * 2. Ganti API_KEY di bawah dengan kunci rahasia buatan sendiri.
 * 3. Terapkan → Deployment baru → Aplikasi web
 *    (Jalankan sebagai: Saya · Yang memiliki akses: Siapa saja).
 */

const API_KEY = 'GANTI-DENGAN-KUNCI-RAHASIA';   // ← wajib diganti, minimal 12 karakter
const SHEET_NAME = 'Peserta';

const HEADERS = [
  'id', 'dibuat', 'tanggal', 'jam', 'nama', 'no_hp', 'no_rekening_emas',
  'waktu_detik', 'waktu_ms', 'status', 'diskualifikasi', 'device', 'pid', 'hp_tersamar',
];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i + 1]));
const STATUS_OUT = { success: 'berhasil', timeout: 'waktu_habis', giveup: 'menyerah' };
const STATUS_IN = { berhasil: 'success', waktu_habis: 'timeout', menyerah: 'giveup' };

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@'); // semua teks: nol di depan No. HP aman
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function findRow_(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const cell = sh.getRange(2, COL.id, sh.getLastRow() - 1, 1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function toRow_(r) {
  return [
    r.id, r.at, r.day, r.jam || '', r.name, r.phone || '', r.acc || '',
    r.status === 'success' ? (r.ms / 1000).toFixed(2) : '', String(r.ms),
    STATUS_OUT[r.status] || r.status, r.dq ? 'Ya' : '', r.device || '', r.pid || '', r.mask || '',
  ].map((v) => String(v == null ? '' : v));
}

/** GET: daftar publik untuk leaderboard (tanpa No. HP lengkap & rekening). */
function doGet() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return json_({ ok: true, rows: [] });
  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getDisplayValues();
  const rows = values.filter((v) => v[0]).map((v) => ({
    id: v[COL.id - 1],
    at: v[COL.dibuat - 1],
    day: v[COL.tanggal - 1],
    name: v[COL.nama - 1],
    ms: Number(v[COL.waktu_ms - 1]) || 60000,
    status: STATUS_IN[v[COL.status - 1]] || v[COL.status - 1],
    dq: String(v[COL.diskualifikasi - 1]).trim() !== '',
    device: v[COL.device - 1],
    pid: v[COL.pid - 1],
    mask: v[COL.hp_tersamar - 1],
  }));
  return json_({ ok: true, rows });
}

/** POST: menerima antrean operasi dari tablet. Body: {key, ops:[...]} sebagai text/plain. */
function doPost(e) {
  let body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  if (!API_KEY || API_KEY === 'GANTI-DENGAN-KUNCI-RAHASIA') return json_({ ok: false, error: 'api_key_not_set' });
  if (body.key !== API_KEY) return json_({ ok: false, error: 'unauthorized' });

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sh = sheet_();
    const ops = Array.isArray(body.ops) ? body.ops : [];
    for (const op of ops) {
      if (op.op === 'upsert' && op.rec && op.rec.id) {
        const row = findRow_(sh, op.rec.id);
        const target = row || sh.getLastRow() + 1;
        const range = sh.getRange(target, 1, 1, HEADERS.length);
        range.setNumberFormat('@');
        range.setValues([toRow_(op.rec)]);
      } else if (op.op === 'patch' && op.id) {
        const row = findRow_(sh, op.id);
        if (row && op.fields && 'dq' in op.fields) sh.getRange(row, COL.diskualifikasi).setValue(op.fields.dq ? 'Ya' : '');
      } else if (op.op === 'delete' && op.id) {
        const row = findRow_(sh, op.id);
        if (row) sh.deleteRow(row);
      } else if (op.op === 'wipe') {
        const last = sh.getLastRow();
        if (last > 1) sh.deleteRows(2, last - 1);
      }
    }
    return json_({ ok: true, done: ops.map((o) => o.opId) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
