// Sharing helpers: encode/decode a design to a URL-safe string, generate a
// 6-digit code, build share + prefill links, and look a design up from the
// published Google Sheet CSV by its code.

import { FORM, SHEET_CSV_URL, CODE_COLUMN, DESIGN_COLUMN, formConfigured, sheetConfigured } from './config.js';

// ---- URL-safe base64 -----------------------------------------------------
// Design data is plain ASCII (type ids, coords, numbers, booleans), so btoa is
// safe. We still route through encode/decodeURIComponent to be defensive.
function toB64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s) {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(escape(atob(b64)));
}

// ---- design <-> string ---------------------------------------------------
export function encodeDesign(design) {
  const slim = {
    anchor: design.anchor,
    squares: design.squares,
    connectors: design.connectors,
    accessories: design.accessories || {},
  };
  return toB64Url(JSON.stringify(slim));
}

export function decodeDesign(str) {
  try {
    const obj = JSON.parse(fromB64Url(str));
    if (!obj || !Array.isArray(obj.squares)) return null;
    return {
      anchor: obj.anchor ?? null,
      squares: obj.squares,
      connectors: Array.isArray(obj.connectors) ? obj.connectors : [],
      accessories: obj.accessories && typeof obj.accessories === 'object' ? obj.accessories : {},
    };
  } catch (e) {
    return null;
  }
}

// ---- codes & links -------------------------------------------------------
export function generateCode() {
  // 6 digits, no leading-zero loss (always a 6-char string 100000–999999).
  let n = 0;
  const buf = new Uint32Array(1);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(buf);
    n = 100000 + (buf[0] % 900000);
  } else {
    n = 100000 + Math.floor(Math.random() * 900000);
  }
  return String(n);
}

export function buildShareLink(code, encoded) {
  const base = location.origin + location.pathname;
  return `${base}?c=${code}#d=${encoded}`;
}

export function buildPrefillUrl(code, encoded) {
  if (!formConfigured()) return null;
  const sep = FORM.prefillBase.includes('?') ? '&' : '?';
  return (
    FORM.prefillBase +
    sep +
    encodeURIComponent(FORM.codeEntry) +
    '=' +
    encodeURIComponent(code) +
    '&' +
    encodeURIComponent(FORM.designEntry) +
    '=' +
    encodeURIComponent(encoded)
  );
}

// ---- read share params from the current URL ------------------------------
export function readShareParams() {
  const params = new URLSearchParams(location.search);
  const code = params.get('c');
  let encoded = null;
  const hash = location.hash || '';
  const m = hash.match(/(?:^#|&)d=([^&]+)/);
  if (m) encoded = m[1];
  return { code, encoded };
}

// ---- Google Sheet lookup -------------------------------------------------
export async function fetchDesignByCode(code) {
  if (!sheetConfigured()) return { ok: false, reason: 'unconfigured' };
  let text;
  try {
    const res = await fetch(SHEET_CSV_URL, { redirect: 'follow' });
    if (!res.ok) return { ok: false, reason: 'fetch' };
    text = await res.text();
  } catch (e) {
    return { ok: false, reason: 'cors' };
  }
  const rows = parseCSV(text);
  if (!rows.length) return { ok: false, reason: 'empty' };
  const header = rows[0].map((h) => h.trim());
  const codeCol = header.indexOf(CODE_COLUMN);
  const designCol = header.indexOf(DESIGN_COLUMN);
  if (codeCol === -1 || designCol === -1) return { ok: false, reason: 'columns' };
  // last matching row wins (most recent submission of that code)
  for (let i = rows.length - 1; i >= 1; i--) {
    if ((rows[i][codeCol] || '').trim() === String(code).trim()) {
      const design = decodeDesign((rows[i][designCol] || '').trim());
      if (design) return { ok: true, design };
      return { ok: false, reason: 'decode' };
    }
  }
  return { ok: false, reason: 'notfound' };
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, newlines).
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}
