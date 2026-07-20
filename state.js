// Central design state for FloatKit. One object holds the whole in-progress
// platform; it is persisted to localStorage so a refresh resumes where you left off.

import {
  squareType,
  anchorById,
  connectorById,
  ADVENTURE_OPTIONS,
  RELAX_OPTIONS,
  TWOSTORY_TOP_OPTIONS,
  WALL_TYPES,
  SQUARE_METERS,
  CENTER,
  ANCHOR_BLOCK,
} from './catalog.js';

const STORAGE_KEY = 'floatkit.design.v2';

// config shape per square:
//   adventure: { option }
//   relax:     { option }
//   twostory:  { bottomType, bottomConfig, top, wallType, wallCount }
//   any:       { ladder?: bool, ziplineStation?: bool }  (add-ons)
export const design = {
  anchor: null,
  squares: [], // { id, x, y, type, config }
  connectors: [], // { key, a, b, type }
  lastScreen: 'landing',
};

let _id = 1;
const nextId = () => `sq${_id++}`;

// When true the design was opened from a share link/code — it renders but is
// never edited or persisted, so a visitor never clobbers their own draft.
export let readOnly = false;

// ---- persistence ---------------------------------------------------------
export function save() {
  if (readOnly) return; // shared designs are never written to localStorage
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        anchor: design.anchor,
        squares: design.squares,
        connectors: design.connectors,
        lastScreen: design.lastScreen,
        _id,
      })
    );
  } catch (e) {
    /* storage may be unavailable — ignore for a prototype */
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    design.anchor = data.anchor ?? null;
    design.squares = Array.isArray(data.squares) ? data.squares : [];
    design.connectors = Array.isArray(data.connectors) ? data.connectors : [];
    design.lastScreen = data.lastScreen ?? 'landing';
    _id = data._id ?? design.squares.length + 1;
    ensureCenterAnchor();
    return design;
  } catch (e) {
    return null;
  }
}

export function resetDesign() {
  design.anchor = null;
  design.squares = [];
  design.connectors = [];
  design.lastScreen = 'landing';
  _id = 1;
  ensureCenterAnchor();
  save();
}

// Load a design decoded from a share link/code into memory WITHOUT persisting,
// and flag the app read-only so nothing can be edited or saved.
export function loadSharedDesign(obj) {
  readOnly = true;
  design.anchor = obj.anchor ?? null;
  design.squares = Array.isArray(obj.squares) ? obj.squares : [];
  design.connectors = Array.isArray(obj.connectors) ? obj.connectors : [];
  design.lastScreen = 'configure';
  _id = design.squares.length + 1;
  ensureCenterAnchor();
}

// Turn a shared (read-only) design into the visitor's own editable draft.
export function remixSharedDesign() {
  readOnly = false;
  // give every square a fresh local id space so nothing collides
  _id = design.squares.length + 1;
  design.lastScreen = 'configure';
  save();
}

// Guarantee the locked anchor block exists at the centre of the grid.
export function ensureCenterAnchor() {
  let sq = design.squares.find((s) => s.locked);
  if (!sq) {
    sq = { id: ANCHOR_BLOCK.id, x: CENTER.x, y: CENTER.y, type: ANCHOR_BLOCK.id, config: {}, locked: true };
    // if a stray square sits on the centre, move it aside is overkill for a
    // fresh design — just place the anchor first in the list.
    design.squares.unshift(sq);
    save();
  } else {
    sq.x = CENTER.x;
    sq.y = CENTER.y;
  }
  return sq;
}

// ---- squares -------------------------------------------------------------
export const squareAt = (x, y) => design.squares.find((s) => s.x === x && s.y === y);
export const squareById = (id) => design.squares.find((s) => s.id === id);

export function addSquare(x, y, type) {
  if (squareAt(x, y)) return squareAt(x, y);
  const sq = { id: nextId(), x, y, type, config: {} };
  design.squares.push(sq);
  save();
  return sq;
}

export function setSquareType(id, type) {
  const sq = squareById(id);
  if (!sq || sq.locked) return;
  sq.type = type;
  sq.config = {}; // reset customization when the type changes
  save();
}

export function updateSquareConfig(id, patch) {
  const sq = squareById(id);
  if (!sq || sq.locked) return;
  sq.config = { ...sq.config, ...patch };
  save();
}

export function removeSquare(id) {
  const sq = squareById(id);
  if (sq && sq.locked) return; // the anchor block can't be removed
  design.squares = design.squares.filter((s) => s.id !== id);
  // drop any connectors touching this square
  design.connectors = design.connectors.filter((c) => c.a !== id && c.b !== id);
  save();
}

// ---- capability helpers --------------------------------------------------
export function hasWaterAccess(sq) {
  if (!sq) return false;
  const t = squareType(sq.type);
  return !!(t && t.waterAccess) || !!sq.config.ladder;
}

// Does this square provide a valid zipline station, and of which kind?
// Returns 'twostory' | 'normal' | null.
export function ziplineStationKind(sq) {
  if (!sq) return null;
  if (sq.type === 'twostory' && sq.config.top === 'zipline') return 'twostory';
  if (sq.type === 'normal' && sq.config.ziplineStation) return 'normal';
  return null;
}

// ---- connectors ----------------------------------------------------------
export const pairKey = (a, b) => [a, b].sort().join('~');

export function getConnector(a, b) {
  const key = pairKey(a, b);
  return design.connectors.find((c) => c.key === key) || null;
}

export function setConnector(a, b, type) {
  const key = pairKey(a, b);
  const existing = design.connectors.find((c) => c.key === key);
  if (type == null) {
    design.connectors = design.connectors.filter((c) => c.key !== key);
  } else if (existing) {
    existing.type = type;
  } else {
    design.connectors.push({ key, a, b, type });
  }
  save();
}

// How many connections a square has to squares OTHER than the given partner.
function otherConnectionCount(squareId, excludeKey) {
  return design.connectors.filter(
    (c) => (c.a === squareId || c.b === squareId) && c.key !== excludeKey
  ).length;
}

// Which connector types are valid for a given pair of squares, with reasons.
export function connectorEligibility(sqA, sqB, distance) {
  const kindA = ziplineStationKind(sqA);
  const kindB = ziplineStationKind(sqB);
  const ziplineOk =
    (kindA === 'twostory' && kindB === 'normal') ||
    (kindA === 'normal' && kindB === 'twostory');
  const swimOk = hasWaterAccess(sqA) && hasWaterAccess(sqB);
  // "Spaced" separates the squares, so each must already be held to the
  // platform by at least one other connection.
  const excludeKey = pairKey(sqA.id, sqB.id);
  const spacedOk =
    otherConnectionCount(sqA.id, excludeKey) >= 1 && otherConnectionCount(sqB.id, excludeKey) >= 1;
  return {
    direct: {
      ok: distance === 1,
      hint: distance === 1 ? '' : 'Squares must be touching for a direct clip.',
    },
    bridge: { ok: true, hint: '' },
    spaced: {
      ok: spacedOk,
      hint: spacedOk
        ? ''
        : 'Both squares need at least one other connection before they can be spaced apart.',
    },
    zipline: {
      ok: ziplineOk,
      hint: ziplineOk
        ? ''
        : 'Needs a 2-story zipline station on one end and a normal square with a zipline station on the other.',
    },
    swim: {
      ok: swimOk,
      hint: swimOk ? '' : 'Needs water access (Water square or a ladder) on both squares.',
    },
  };
}

// All connectable pairs: orthogonally adjacent (distance 1) or one empty cell
// apart in a straight line (distance 2).
export function connectablePairs() {
  const pairs = [];
  for (const sq of design.squares) {
    // look right and down only, to avoid duplicate pairs
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      const adj = squareAt(sq.x + dx, sq.y + dy);
      if (adj) {
        pairs.push({ a: sq, b: adj, distance: 1 });
        continue;
      }
      const between = squareAt(sq.x + dx, sq.y + dy);
      const far = squareAt(sq.x + dx * 2, sq.y + dy * 2);
      if (!between && far) {
        pairs.push({ a: sq, b: far, distance: 2 });
      }
    }
  }
  return pairs;
}

// ---- pricing & stats -----------------------------------------------------
export function squarePrice(sq) {
  const t = squareType(sq.type);
  let price = t ? t.price : 0;
  const cfg = sq.config || {};
  if (sq.type === 'adventure' && cfg.option) {
    price += ADVENTURE_OPTIONS.find((o) => o.id === cfg.option)?.price || 0;
  }
  if (sq.type === 'relax' && cfg.option) {
    price += RELAX_OPTIONS.find((o) => o.id === cfg.option)?.price || 0;
  }
  if (sq.type === 'twostory') {
    if (cfg.bottomType) price += squareType(cfg.bottomType)?.price || 0;
    if (cfg.bottomConfig?.option) {
      const opts = cfg.bottomType === 'adventure' ? ADVENTURE_OPTIONS : RELAX_OPTIONS;
      price += opts.find((o) => o.id === cfg.bottomConfig.option)?.price || 0;
    }
    if (cfg.top) price += TWOSTORY_TOP_OPTIONS.find((o) => o.id === cfg.top)?.price || 0;
    // walls: an object of { wallTypeId: count } — sum each selected wall type
    for (const [id, count] of Object.entries(cfg.walls || {})) {
      const w = WALL_TYPES.find((o) => o.id === id);
      if (w && count > 0) price += w.price * count;
    }
  }
  if (cfg.ladder) price += 150;
  if (cfg.ziplineStation) price += 200;
  return price;
}

export function computeStats() {
  // stats describe the squares the user adds — not the locked anchor block.
  const userSquares = design.squares.filter((s) => !s.locked);
  const count = userSquares.length;
  const footprint = count * SQUARE_METERS * SQUARE_METERS; // m²
  const capacity = userSquares.reduce((sum, sq) => sum + (squareType(sq.type)?.capacity || 0), 0);
  let price = userSquares.reduce((sum, sq) => sum + squarePrice(sq), 0);
  if (design.anchor) price += anchorById(design.anchor)?.price || 0;
  price += design.connectors.reduce((sum, c) => sum + (connectorById(c.type)?.price || 0), 0);
  return { count, footprint, capacity, price };
}
