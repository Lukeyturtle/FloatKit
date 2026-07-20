// FloatKit product catalog — all square types, customization options,
// connector types and pricing/capacity data live here so the rest of the
// app never hard-codes product knowledge.

export const GRID_COLS = 9; // odd, so the grid has a single true centre cell
export const GRID_ROWS = 7; // odd, so the grid has a single true centre cell
export const SQUARE_METERS = 2; // each square is 2m x 2m => 4 m² footprint

// The one fixed centre cell where the locked anchor block always sits.
export const CENTER = { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };

// The locked square that lives in the centre of every platform. It is never in
// the palette, can't be changed or removed, and is where the anchor attaches.
export const ANCHOR_BLOCK = {
  id: 'anchor',
  name: 'Anchor block',
  icon: '⚓',
  color: '#0d3b4f',
  blurb: 'The fixed centre of your platform — everything builds out from here.',
  price: 0, // the anchor itself is priced in step 1
  capacity: 0,
  customizable: false,
  locked: true,
};

export const ANCHORS = [
  {
    id: 'pool',
    name: 'Pool anchor',
    tag: 'Permanent · for pools',
    icon: '🏊‍♂️',
    blurb: 'Bolts to the walls of your pool for a rock-solid, permanent install.',
    price: 400,
  },
  {
    id: 'portable',
    name: 'Portable anchor',
    tag: 'No pool needed',
    icon: '⚓',
    blurb: 'Weighted, removable anchor for lakes and open water. Pack it up and go.',
    price: 550,
  },
  {
    id: 'permanent',
    name: 'Permanent anchor',
    tag: 'No pool needed',
    icon: '🛠️',
    blurb: 'Seabed / lakebed mooring for a fixed installation in open water.',
    price: 900,
  },
];

// The 8 square types placeable on the grid.
export const SQUARE_TYPES = [
  {
    id: 'normal',
    name: 'Normal',
    icon: '⬜',
    color: '#7fd1e6',
    blurb: 'A plain deck square — open space to stand, sit or add gear later.',
    price: 300,
    capacity: 4,
    customizable: false,
  },
  {
    id: 'covered',
    name: 'Covered',
    icon: '⛱️',
    color: '#8bb3e8',
    blurb: 'Shaded canopy square to duck out of the sun.',
    price: 520,
    capacity: 4,
    customizable: false,
  },
  {
    id: 'watersports',
    name: 'Watersports',
    icon: '🚣',
    color: '#5ec8c8',
    blurb: 'Hooks and racks for kayaks, paddleboards and more.',
    price: 640,
    capacity: 3,
    customizable: false,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '🤸',
    color: '#ff9f5a',
    blurb: 'Pick your thrill — trampoline, high dive or slide.',
    price: 780,
    capacity: 4,
    customizable: true,
  },
  {
    id: 'slip',
    name: "Slip 'n slide",
    icon: '🛝',
    color: '#ffd34e',
    blurb: "A literal slip ’n slide, straight into the water.",
    price: 700,
    capacity: 2,
    customizable: false,
  },
  {
    id: 'water',
    name: 'Water',
    icon: '🪜',
    color: '#3fa9d6',
    blurb: 'Open access with a ladder to get in and out of the water.',
    price: 360,
    capacity: 2,
    customizable: false,
    waterAccess: true,
  },
  {
    id: 'relax',
    name: 'Relax',
    icon: '🛋️',
    color: '#c9a3ff',
    blurb: 'Lounge in comfort — pick your style.',
    price: 600,
    capacity: 4,
    customizable: true,
  },
  {
    id: 'twostory',
    name: '2-story',
    icon: '🏗️',
    color: '#f57ea6',
    blurb: 'Double-decker square — fully customizable top, bottom and walls.',
    price: 1400,
    capacity: 8,
    customizable: true,
  },
];

export const ADVENTURE_OPTIONS = [
  { id: 'trampoline', name: 'Trampoline', icon: '🤾', price: 180, blurb: 'Bounce right off the platform.' },
  { id: 'highdive', name: 'High dive', icon: '🤿', price: 240, blurb: 'A springboard for the brave.' },
  { id: 'slide', name: 'Slide', icon: '🛝', price: 200, blurb: 'Curved slide into open water.' },
];

export const RELAX_OPTIONS = [
  { id: 'water', name: 'Water relax', icon: '💧', price: 160, blurb: 'Sunken seating with water at your feet.' },
  { id: 'beanbag', name: 'Beanbag relax', icon: '🫘', price: 120, blurb: 'Oversized floating beanbags.' },
  { id: 'couch', name: 'Couch relax', icon: '🛋️', price: 200, blurb: 'A proper weatherproof couch.' },
];

export const TWOSTORY_TOP_OPTIONS = [
  { id: 'zipline', name: 'Zipline station', icon: '🚡', price: 300, blurb: 'Launch point for a zipline connector.', ziplineStation: true },
  { id: 'xtrahighdive', name: 'Xtra high dive', icon: '🤿', price: 360, blurb: 'A seriously high platform dive.' },
  { id: 'normal', name: 'Normal', icon: '⬜', price: 0, blurb: 'An open upper deck.' },
];

export const WALL_TYPES = [
  { id: 'none', name: 'No walls', icon: '⬛', counted: false, price: 0, blurb: 'Fully open upper deck.' },
  { id: 'normal', name: 'Normal walls', icon: '🧱', counted: true, min: 1, max: 3, price: 80, blurb: 'Safety railing walls.' },
  { id: 'ladder', name: 'Ladder wall', icon: '🪜', counted: true, min: 1, max: 3, price: 120, blurb: 'Walls with built-in climbing ladders.' },
  { id: 'slide', name: 'Slide wall', icon: '🛝', counted: true, min: 1, max: 4, price: 160, blurb: 'Walls that double as slides.' },
];

export const CONNECTORS = [
  { id: 'direct', name: 'Direct', icon: '🔗', price: 0, blurb: 'Squares clip straight together, edge to edge.' },
  { id: 'bridge', name: 'Bridge', icon: '🌉', price: 220, blurb: 'A short bridge spans a gap between two squares.' },
  { id: 'spaced', name: 'Spaced', icon: '↔️', price: 60, blurb: 'Squares float set apart, tethered but not touching. The square must already have another connection to the platform.' },
  { id: 'zipline', name: 'Zipline', icon: '🚡', price: 480, blurb: 'Zip between a 2-story station and a normal-square station.' },
  { id: 'swim', name: 'Swim', icon: '🏊', price: 140, blurb: 'A ladder into the water on both squares — swim across.' },
];

// Accessories added on the dedicated Accessories step. All are "counted"
// (quantity per platform) except the Roof, which is placed onto a chosen tile.
export const ACCESSORIES = [
  { id: 'kayak', name: 'Kayak', icon: '🛶', price: 320, blurb: 'Single sit-on-top kayak.' },
  { id: 'paddleboard', name: 'Paddle board', icon: '🏄', price: 280, blurb: 'Stand-up paddle board.' },
  { id: 'paddle', name: 'Kayak / paddle-board paddle', icon: '🚣', price: 60, blurb: 'Spare paddle.' },
  { id: 'donut', name: 'Donut inflatable', icon: '🍩', price: 90, blurb: 'Towable donut float.' },
  { id: 'wifi', name: 'Wi-Fi', icon: '📶', price: 150, blurb: 'Floating Wi-Fi hotspot.' },
  { id: 'docking', name: 'Docking station', icon: '🚢', price: 400, blurb: 'Dock for boats & jet-skis.' },
  { id: 'fridge', name: 'Mini fridge', icon: '🧊', price: 260, blurb: 'Weatherproof mini fridge.' },
  { id: 'power', name: 'Waterproof power station', icon: '🔋', price: 350, blurb: 'Battery power for your gear.' },
  { id: 'waterstation', name: 'Water station', icon: '🚰', price: 180, blurb: 'Fresh drinking-water tap.' },
  { id: 'shower', name: 'Shower', icon: '🚿', price: 220, blurb: 'Rinse-off deck shower.' },
];

// The Roof is placed on a specific tile (stored as sq.config.roof), not counted.
export const ROOF = { id: 'roof', name: 'Roof / cabana', icon: '⛺', price: 240, blurb: 'Shade canopy — tap any tile to add one.' };

export const accessoryById = (id) =>
  ACCESSORIES.find((a) => a.id === id) || (id === ROOF.id ? ROOF : null);

// Lookup helpers
export const squareType = (id) => (id === ANCHOR_BLOCK.id ? ANCHOR_BLOCK : SQUARE_TYPES.find((t) => t.id === id));
export const anchorById = (id) => ANCHORS.find((a) => a.id === id);
export const connectorById = (id) => CONNECTORS.find((c) => c.id === id);
