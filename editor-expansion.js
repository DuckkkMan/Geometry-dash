/* Geometry Dash Web — Editor Expansion 2.0
   Camada aditiva do editor: biblioteca categorizada, inspetor, grade ajustada e histórico.
*/
(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const editorRoot = $('level-editor');
if (!editorRoot || typeof editorDraft === 'undefined') return;

const EXTRA_CATEGORIES = [
  { id: 'blocks', name: 'Blocks', icon: '▦', items: [
    ['block', 'Block', 'block', '#4cc9f0'],
    ['platform', 'Platform', 'platform', '#00e5ff'],
    ['half_block', 'Half Block', 'half_block', '#38bdf8'],
    ['slope', 'Slope', 'slope', '#60a5fa'],
    ['slope_reverse', 'Reverse Slope', 'slope_reverse', '#3b82f6'],
    ['quarter_block', 'Quarter Block', 'quarter_block', '#93c5fd'],
    ['block_tall', 'Tall Block', 'block_tall', '#60a5fa'],
    ['block_wide', 'Wide Block', 'block_wide', '#3b82f6'],
    ['block_big', '2×2 Block', 'block_big', '#2563eb'],
    ['block_3x2', '3×2 Block', 'block_3x2', '#1d4ed8'],
    ['platform_short', 'Short Platform', 'platform_short', '#22d3ee'],
    ['platform_long', 'Long Platform', 'platform_long', '#06b6d4'],
    ['platform_xl', 'Extra Long Platform', 'platform_xl', '#0891b2'],
    ['platform_thin', 'Thin Platform', 'platform_thin', '#67e8f9'],
    ['double_block', 'Double Block', 'decoration', '#2563eb'],
    ['outlined_block', 'Outlined Block', 'decoration', '#93c5fd']
  ]},
  { id: 'spikes', name: 'Spikes', icon: '▲', items: [
    ['spike', 'Spike', 'spike', '#ff595e'],
    ['mini_spike', 'Mini Spike', 'mini_spike', '#ff924c'],
    ['ceil_spike', 'Ceiling Spike', 'ceil_spike', '#d62828']
  ]},
  { id: 'orbs_pads', name: 'Orbs & Pads', icon: '◉', items: [
    ['orb_yellow', 'Yellow Orb', 'orb_yellow', '#ffd60a'],
    ['orb_pink', 'Pink Orb', 'orb_pink', '#f72585'],
    ['orb_red', 'Red Orb', 'orb_red', '#ff334f'],
    ['orb_blue', 'Blue Orb', 'orb_blue', '#28a9ff'],
    ['orb_green', 'Green Orb', 'orb_green', '#45e06f'],
    ['orb_black', 'Black Orb', 'orb_black', '#242424'],
    ['pad_yellow', 'Yellow Pad', 'pad_yellow', '#ffe600'],
    ['pad_pink', 'Pink Pad', 'pad_pink', '#ff4fd8'],
    ['pad_red', 'Red Pad', 'pad_red', '#ff334f'],
    ['pad_blue', 'Blue Pad', 'pad_blue', '#28a9ff'],
    ['pad_green', 'Green Pad', 'pad_green', '#45e06f']
  ]},
  { id: 'portals', name: 'Portals', icon: '◌', items: [
    ['portal_cube', 'Cube Portal', 'portal_cube', '#80ed99'],
    ['portal_ship', 'Ship Portal', 'portal_ship', '#38bdf8'],
    ['portal_ball', 'Ball Portal', 'portal_extra', '#f59e0b'],
    ['portal_ufo', 'UFO Portal', 'portal_extra', '#a78bfa'],
    ['portal_wave', 'Wave Portal', 'portal_extra', '#22d3ee'],
    ['portal_robot', 'Robot Portal', 'portal_extra', '#fb923c']
  ]},
  { id: 'decorations', name: 'Decorations', icon: '✦', items: [
    ['deco_star', 'Star', 'decoration', '#fde68a'],
    ['deco_crystal', 'Crystal', 'decoration', '#67e8f9'],
    ['deco_ring', 'Ring', 'decoration', '#c4b5fd'],
    ['deco_arrow', 'Arrow', 'decoration', '#fca5a5']
  ]},
  { id: 'structures', name: 'Structures', icon: '▤', items: [
    ['saw', 'Saw', 'saw', '#94a3b8'],
    ['saw_small', 'Small Saw', 'saw_small', '#cbd5e1'],
    ['saw_large', 'Large Saw', 'saw_large', '#64748b'],
    ['pillar', 'Pillar', 'pillar', '#e2e8f0']
  ]},
  { id: 'triggers', name: 'Triggers', icon: '⚡', items: [
    ['trig_speed_fast', 'Speed 1.25x', 'legacy_trigger', '#00e5ff'],
    ['trig_speed_slow', 'Speed 0.75x', 'legacy_trigger', '#38bdf8'],
    ['trig_speed_norm', 'Speed 1.0x', 'legacy_trigger', '#60a5fa'],
    ['trig_bg_purple', 'Purple Color', 'legacy_trigger', '#9b5de5'],
    ['trig_bg_cyan', 'Cyan Color', 'legacy_trigger', '#22d3ee'],
    ['trig_shake', 'Camera Shake', 'legacy_trigger', '#f15bb5'],
    ['trig_low_grav', 'Low Gravity', 'legacy_trigger', '#fee440'],
    ['trig_high_grav', 'High Gravity', 'legacy_trigger', '#fb923c'],
    ['trig_norm_grav', 'Normal Gravity', 'legacy_trigger', '#9dff00'],
    ['trig_custom_speed', 'Custom Speed', 'custom_trigger', '#00e5ff'],
    ['trig_move', 'Move Group', 'custom_trigger', '#38bdf8'],
    ['trig_color', 'Group Color', 'custom_trigger', '#f472b6'],
    ['trig_bg_custom', 'BG Color', 'custom_trigger', '#a78bfa'],
    ['trig_shake_custom', 'Custom Shake', 'custom_trigger', '#fb7185'],
    ['trig_rotate', 'Rotate Group', 'custom_trigger', '#f59e0b'],
    ['trig_pulse', 'Pulse Group', 'custom_trigger', '#2dd4bf']
  ]},
  { id: 'other', name: 'Other', icon: '◇', items: [
    ['coin', 'Coin', 'coin', '#ffb703']
  ]}
];


/* Biblioteca vetorial adicional: 100 peças originais, leves e sem downloads externos. */
const EXTRA_DECORATION_FAMILIES = [
  ['star','Stars'],['shard','Crystals'],['ring','Rings'],['arrow','Arrows'],
  ['bolt','Energy'],['hex','Hexagons'],['cross','Crosses'],['chevron','Chevrons'],
  ['gear','Gears'],['orb','Ornaments']
];
const EXTRA_ASSET_COLORS = ['#ffe066','#ff9f1c','#ff6b6b','#f06595','#cc5de8','#845ef7','#5c7cfa','#339af0','#22b8cf','#20c997'];
EXTRA_DECORATION_FAMILIES.forEach(([family, label], familyIndex) => {
  const items = [];
  for (let variant = 0; variant < 10; variant++) {
    const id = 'deco_' + family + '_' + String(variant + 1).padStart(2, '0');
    items.push([id, label + ' ' + String(variant + 1).padStart(2, '0'), 'decoration',
      EXTRA_ASSET_COLORS[(variant + familyIndex * 2) % EXTRA_ASSET_COLORS.length]]);
  }
  EXTRA_CATEGORIES.push({ id: 'extra_' + family, name: label, icon: '✦', items });
});
const EDITOR_SHAPE_ITEMS = [
  ['deco_triangle', 'Triangle', 'decoration', '#38bdf8'],
  ['deco_diamond', 'Diamond', 'decoration', '#a78bfa'],
  ['deco_square', 'Square Frame', 'decoration', '#60a5fa'],
  ['deco_wave', 'Wave Line', 'decoration', '#22d3ee'],
  ['deco_spiral', 'Spiral', 'decoration', '#c084fc'],
  ['deco_spark', 'Spark', 'decoration', '#fde047'],
  ['deco_moon', 'Moon', 'decoration', '#e0e7ff'],
  ['deco_heart', 'Heart', 'decoration', '#fb7185'],
  ['deco_flame', 'Flame', 'decoration', '#fb923c']
];
EXTRA_CATEGORIES.push({ id: 'geometry', name: 'Geometry', icon: '◇', items: EDITOR_SHAPE_ITEMS });

const ASSET_BY_ID = {};
EXTRA_CATEGORIES.forEach(cat => {
  cat.items.forEach(item => {
    ASSET_BY_ID[item[0]] = { id: item[0], label: item[1], type: item[2], color: item[3], category: cat.id };
  });
});

let activeCategory = 'blocks';
let selectedAssetId = 'block';
let selectedObjects = [];
let localUndoStack = [];
let localRedoStack = [];
let localHistoryLock = false;
let snapEnabled = true;
const gridUnit = BLOCK_SIZE;
const GRID_PREF_KEY = 'gd_web_editor_grid_v1';
let gridLineStrength = 'normal';
let gridSettingsOpen = false;
let eraseGestureMode = 'click';
let selectedDragState = null;
let editorClipboard = [];

try {
  const savedGrid = JSON.parse(localStorage.getItem(GRID_PREF_KEY) || 'null');
  if (savedGrid && typeof savedGrid === 'object') {
    editorShowGrid = savedGrid.visible !== false;
    if (['soft', 'normal', 'strong'].includes(savedGrid.strength)) gridLineStrength = savedGrid.strength;
  }
} catch (_) {}
window.__editorGridStrength = gridLineStrength;

function persistGridSettings() {
  window.__editorGridStrength = gridLineStrength;
  try {
    localStorage.setItem(GRID_PREF_KEY, JSON.stringify({
      visible: Boolean(editorShowGrid),
      strength: gridLineStrength
    }));
  } catch (_) {}
}

function makeId() {
  return 'obj_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

const EDITOR_LAYERS = [['blocks','Blocos'],['platforms','Plataformas'],['spikes','Espinhos'],['pads','Pads'],['orbs','Orbs'],['saws','Serras'],['pillars','Pilares'],['coins','Moedas'],['portals','Portais'],['triggers','Triggers'],['decorations','Decorações'],['structures','Estruturas']];
let editorLayerVisibility = {};
try { editorLayerVisibility = JSON.parse(localStorage.getItem('gd_editor_layers_v1') || '{}') || {}; } catch (_) {}
function allEditorArrays(draft) {
  return ['spikes', 'platforms', 'blocks', 'pads', 'orbs', 'saws', 'pillars', 'coins', 'portals', 'triggers', 'decorations', 'structures']
    .map(key => ({ key, items: editorLayerVisibility[key] === false ? [] : (Array.isArray(draft[key]) ? draft[key] : []) }));
}

function objectCenter(obj, key) {
  const x = Number(obj.x) || 0;
  const y = Number.isFinite(Number(obj.y)) ? Number(obj.y) : null;
  const w = Number(obj.w) || (key === 'spikes' ? (obj.sizeType === 'mini' ? MINI_SPIKE_W : BLOCK_SIZE) : 0);
  const h = Number(obj.h) || (key === 'spikes' ? (obj.sizeType === 'mini' ? MINI_SPIKE_H : BLOCK_SIZE) : 0);

  // Coordenadas armazenadas como canto superior esquerdo precisam de centro geométrico.
  if (key === 'blocks' || key === 'platforms') {
    return { x: x + w / 2, y: (y === null ? GROUND_Y - (h || BLOCK_SIZE) : y) + (h || BLOCK_SIZE) / 2 };
  }
  if (key === 'pillars') return { x: x + (w || 34) / 2, y: GROUND_Y - (Number(obj.h) || 90) / 2 };
  if (key === 'spikes') {
    const height = h || (obj.sizeType === 'mini' ? MINI_SPIKE_H : BLOCK_SIZE);
    const baseY = y === null ? (obj.inverted ? CEILING_Y : GROUND_Y) : y;
    return { x: x + (w || BLOCK_SIZE) / 2, y: baseY + (obj.inverted ? height / 2 : -height / 2) };
  }
  if (key === 'pads') return { x: x + 18, y: GROUND_Y - 5 };
  if (key === 'portals') return { x: x + PORTAL_WIDTH / 2, y: y === null ? GROUND_Y - PORTAL_HEIGHT / 2 : y };
  if (key === 'triggers') return { x: x + 15, y: y === null ? GROUND_Y - 50 : y + 50 };
  if (y !== null) return { x, y };
  if (obj.cooldown !== undefined) return { x: x + 18, y: GROUND_Y - 5 };
  if (obj.h !== undefined) return { x: x + (w || 34) / 2, y: GROUND_Y - (Number(obj.h) || 90) / 2 };
  if (obj.type) return { x: x + PORTAL_WIDTH / 2, y: GROUND_Y - PORTAL_HEIGHT / 2 };
  return { x, y: GROUND_Y - 45 };
}

function objectGroupList(obj) {
  if (Array.isArray(obj.groups)) return obj.groups.map(String);
  if (obj.group !== undefined && obj.group !== null && String(obj.group).trim()) return [String(obj.group)];
  return [];
}

function assignGroups(obj, value) {
  obj.groups = String(value || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);
  delete obj.group;
}

function recordHistory() {
  if (localHistoryLock || !editorDraft) return;
  localUndoStack.push(JSON.stringify(editorDraft));
  if (localUndoStack.length > 80) localUndoStack.shift();
  localRedoStack.length = 0;
}

function restoreLocalSnapshot(raw) {
  if (!raw) return;
  localHistoryLock = true;
  try {
    editorDraft = JSON.parse(raw);
  } finally {
    localHistoryLock = false;
  }
  selectedObjects = [];
  syncStyleInputsFromDraft();
  refreshInspector();
  drawEditorCanvas();
}

function undoLocalEditor() {
  if (!localUndoStack.length) return;
  localRedoStack.push(JSON.stringify(editorDraft));
  restoreLocalSnapshot(localUndoStack.pop());
}

function redoLocalEditor() {
  if (!localRedoStack.length) return;
  localUndoStack.push(JSON.stringify(editorDraft));
  restoreLocalSnapshot(localRedoStack.pop());
}

function drawDecorGraphic(targetCtx, kind, color, r) {
  const parts = String(kind || '').split('_');
  const family = parts[1] || 'diamond';
  const variant = Math.max(0, (parseInt(parts[2], 10) || 1) - 1);
  const rotation = (variant % 5) * Math.PI / 10;
  targetCtx.save();
  targetCtx.rotate(rotation);
  targetCtx.lineWidth = Math.max(1.5, r * 0.12);
  targetCtx.lineJoin = 'round';
  targetCtx.lineCap = 'round';
  targetCtx.strokeStyle = '#06101e';
  targetCtx.fillStyle = color || '#38bdf8';
  targetCtx.shadowColor = color || '#38bdf8';
  targetCtx.shadowBlur = Math.max(2, r * 0.24);
  const polygon = points => {
    targetCtx.beginPath();
    targetCtx.moveTo(points[0][0] * r, points[0][1] * r);
    for (let i = 1; i < points.length; i++) targetCtx.lineTo(points[i][0] * r, points[i][1] * r);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
  };
  if (kind === 'half_block') {
    polygon([[-0.82,0.05],[0.82,0.05],[0.82,0.82],[-0.82,0.82]]);
  } else if (kind === 'slope') {
    polygon([[-0.86,0.78],[0.86,0.78],[0.86,-0.78]]);
  } else if (kind === 'double_block') {
    polygon([[-0.92,-0.72],[-0.08,-0.72],[-0.08,0.72],[-0.92,0.72]]);
    polygon([[0.08,-0.72],[0.92,-0.72],[0.92,0.72],[0.08,0.72]]);
  } else if (kind === 'outlined_block') {
    targetCtx.shadowBlur = 0;
    targetCtx.strokeRect(-r*0.78,-r*0.78,r*1.56,r*1.56);
    targetCtx.strokeRect(-r*0.48,-r*0.48,r*0.96,r*0.96);
  } else if (family === 'star') {
    const points = [];
    const count = 5 + (variant % 4);
    for (let i = 0; i < count * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / count;
      const rad = i % 2 ? 0.48 : 1;
      points.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    polygon(points);
  } else if (family === 'shard') {
    polygon([[-0.18,-1],[0.72,-0.28],[0.22,1],[-0.7,0.25]]);
    targetCtx.shadowBlur = 0;
    targetCtx.strokeStyle = 'rgba(255,255,255,.7)';
    targetCtx.beginPath(); targetCtx.moveTo(-r*.08,-r*.72); targetCtx.lineTo(r*.12,r*.52); targetCtx.stroke();
  } else if (family === 'ring' || family === 'orb') {
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r * (family === 'ring' ? 0.72 : 0.56), 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r * (family === 'ring' ? 0.4 : 0.24), 0, Math.PI * 2);
    if (family === 'orb') { targetCtx.fill(); targetCtx.stroke(); } else targetCtx.stroke();
    if (variant % 2) { targetCtx.beginPath(); targetCtx.arc(0,0,r*.9,Math.PI*.15,Math.PI*1.1); targetCtx.stroke(); }
  } else if (family === 'arrow' || family === 'chevron') {
    polygon(family === 'arrow'
      ? [[-1,-.28],[.18,-.28],[.18,-.72],[1,0],[.18,.72],[.18,.28],[-1,.28]]
      : [[-.85,-.7],[-.48,-1],[.5,0],[-.48,1],[-.85,.7],[.28,0]]);
  } else if (family === 'bolt') {
    polygon([[-.1,-1],[.72,-.16],[.18,-.08],[.36,1],[-.72,.12],[-.16,.08]]);
  } else if (family === 'hex') {
    const sides = 6 + (variant % 3) * 2, points = [];
    for (let i=0;i<sides;i++){const a=-Math.PI/2+i*Math.PI*2/sides;points.push([Math.cos(a)*.86,Math.sin(a)*.86]);}
    polygon(points);
    targetCtx.shadowBlur=0; targetCtx.beginPath(); targetCtx.arc(0,0,r*.35,0,Math.PI*2); targetCtx.stroke();
  } else if (family === 'cross') {
    const w = .28 + (variant % 3) * .08;
    polygon([[-w,-1],[w,-1],[w,-w],[1,-w],[1,w],[w,w],[w,1],[-w,1],[-w,w],[-1,w],[-1,-w],[-w,-w]]);
  } else if (family === 'triangle') {
    polygon([[0,-1],[.92,.78],[-.92,.78]]);
    targetCtx.shadowBlur=0; targetCtx.beginPath(); targetCtx.moveTo(0,-.45*r); targetCtx.lineTo(0,.55*r); targetCtx.stroke();
  } else if (family === 'diamond') {
    polygon([[0,-1],[.72,0],[0,1],[-.72,0]]);
    targetCtx.shadowBlur=0; targetCtx.strokeStyle='rgba(255,255,255,.75)'; targetCtx.beginPath(); targetCtx.moveTo(0,-.7*r); targetCtx.lineTo(0,.7*r); targetCtx.stroke();
  } else if (family === 'square') {
    polygon([[-.8,-.8],[.8,-.8],[.8,.8],[-.8,.8]]);
    targetCtx.shadowBlur=0; targetCtx.strokeRect(-r*.45,-r*.45,r*.9,r*.9);
  } else if (family === 'wave') {
    targetCtx.shadowBlur=0; targetCtx.beginPath();
    for(let i=0;i<=24;i++){const x=-r+(i/24)*r*2;const y=Math.sin(i/24*Math.PI*4)*r*.55;if(i===0)targetCtx.moveTo(x,y);else targetCtx.lineTo(x,y);}
    targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.arc(0,0,r*.88,0,Math.PI*2); targetCtx.stroke();
  } else if (family === 'spiral') {
    targetCtx.shadowBlur=0; targetCtx.beginPath();
    for(let i=0;i<=80;i++){const a=i/80*Math.PI*4;const rad=(i/80)*r*.9;const x=Math.cos(a)*rad;const y=Math.sin(a)*rad;if(i===0)targetCtx.moveTo(x,y);else targetCtx.lineTo(x,y);}
    targetCtx.stroke();
  } else if (family === 'spark') {
    polygon([[0,-1],[.18,-.2],[1,0],[.18,.2],[0,1],[-.18,.2],[-1,0],[-.18,-.2]]);
  } else if (family === 'moon') {
    targetCtx.beginPath(); targetCtx.arc(-r*.1,0,r*.78,-Math.PI*.72,Math.PI*.72); targetCtx.arc(r*.42,-r*.2,r*.72,Math.PI*.7,-Math.PI*.7,true); targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
  } else if (family === 'heart') {
    targetCtx.beginPath(); targetCtx.moveTo(0,r*.82); targetCtx.bezierCurveTo(-r*1.2,r*.1,-r*.9,-r*.8,-r*.35,-r*.7); targetCtx.bezierCurveTo(-r*.05,-r*.65,0,-r*.35,0,-r*.25); targetCtx.bezierCurveTo(0,-r*.35,r*.2,-r*.8,r*.55,-r*.7); targetCtx.bezierCurveTo(r*1.15,-r*.55,r*1.0,r*.15,0,r*.82); targetCtx.fill(); targetCtx.stroke();
  } else if (family === 'flame') {
    polygon([[0,1],[-.72,.55],[-.62,-.1],[-.25,-.55],[-.12,-1],[.35,-.42],[.72,-.12],[.62,.58]]);
    targetCtx.shadowBlur=0; targetCtx.fillStyle='rgba(255,255,255,.65)'; targetCtx.beginPath(); targetCtx.ellipse(0,r*.35,r*.18,r*.3,0,0,Math.PI*2); targetCtx.fill();
  } else if (family === 'gear') {
    const points=[];
    for(let i=0;i<24;i++){const a=i*Math.PI/12;const rad=i%3===0?.98:(i%3===1?.82:.72);points.push([Math.cos(a)*rad,Math.sin(a)*rad]);}
    polygon(points);
    targetCtx.shadowBlur=0; targetCtx.fillStyle='#06101e'; targetCtx.beginPath(); targetCtx.arc(0,0,r*.28,0,Math.PI*2); targetCtx.fill();
  } else {
    polygon([[-.75,-.75],[.75,-.75],[.75,.75],[-.75,.75]]);
  }
  targetCtx.restore();
}

function drawAssetThumb(tCtx, item, size) {
  const c = item.color || '#38bdf8';
  tCtx.save();
  tCtx.translate(size / 2, size / 2);
  tCtx.lineWidth = Math.max(1.5, size * 0.055);
  tCtx.strokeStyle = '#06101e';
  tCtx.fillStyle = c;
  const type = item.type;

  if (type === 'spike' || type === 'mini_spike' || type === 'ceil_spike') {
    tCtx.beginPath();
    tCtx.moveTo(-size * 0.38, size * 0.32);
    tCtx.lineTo(0, -size * 0.4);
    tCtx.lineTo(size * 0.38, size * 0.32);
    tCtx.closePath();
    tCtx.fill();
    tCtx.stroke();
  } else if (type.indexOf('orb_') === 0) {
    tCtx.beginPath();
    tCtx.arc(0, 0, size * 0.31, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.stroke();
  } else if (type.indexOf('pad_') === 0) {
    tCtx.fillRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
    tCtx.strokeRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
  } else if (type.indexOf('portal') === 0) {
    tCtx.beginPath();
    tCtx.ellipse(0, 0, size * 0.25, size * 0.42, 0, 0, Math.PI * 2);
    tCtx.strokeStyle = c;
    tCtx.lineWidth = size * 0.13;
    tCtx.stroke();
  } else if (type === 'saw' || type === 'saw_small' || type === 'saw_large') {
    const sawRadius = type === 'saw_small' ? .23 : type === 'saw_large' ? .42 : .34;
    tCtx.beginPath(); tCtx.arc(0, 0, size * sawRadius, 0, Math.PI * 2); tCtx.fill(); tCtx.stroke();
    tCtx.beginPath(); tCtx.arc(0, 0, size * sawRadius * .48, 0, Math.PI * 2); tCtx.stroke();
  } else if (type === 'block' || type === 'platform' || type === 'pillar') {
    tCtx.fillRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    tCtx.strokeRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
  } else if (['block_tall','block_wide','block_big','platform_short','platform_long','platform_thin'].includes(type)) {
    const dims = ({block_tall:[.42,.78],block_wide:[.78,.42],block_big:[.78,.78],platform_short:[.48,.22],platform_long:[.88,.22],platform_thin:[.78,.12]})[type];
    tCtx.fillRect(-size*dims[0]/2,-size*dims[1]/2,size*dims[0],size*dims[1]);
    tCtx.strokeRect(-size*dims[0]/2,-size*dims[1]/2,size*dims[0],size*dims[1]);
  } else if (['half_block','quarter_block','slope','slope_reverse'].includes(type)) {
    tCtx.beginPath();
    if (type === 'half_block') { tCtx.rect(-size*.36, 0, size*.72, size*.36); }
    else if (type === 'quarter_block') { tCtx.rect(0, 0, size*.36, size*.36); }
    else if (type === 'slope') { tCtx.moveTo(-size*.36,size*.36); tCtx.lineTo(size*.36,size*.36); tCtx.lineTo(size*.36,-size*.36); }
    else { tCtx.moveTo(-size*.36,-size*.36); tCtx.lineTo(-size*.36,size*.36); tCtx.lineTo(size*.36,size*.36); }
    tCtx.closePath(); tCtx.fill(); tCtx.stroke();
  } else if (type === 'coin') {
    tCtx.beginPath();
    tCtx.ellipse(0, 0, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.stroke();
  } else if ((type === 'legacy_trigger' || type === 'custom_trigger')) {
    tCtx.shadowColor = c;
    tCtx.shadowBlur = size * 0.18;
    tCtx.fillStyle = c + '33';
    tCtx.fillRect(-size * 0.28, -size * 0.38, size * 0.56, size * 0.76);
    tCtx.strokeStyle = c;
    tCtx.lineWidth = size * 0.07;
    tCtx.strokeRect(-size * 0.28, -size * 0.38, size * 0.56, size * 0.76);
    tCtx.beginPath();
    tCtx.moveTo(0, -size * 0.23);
    tCtx.lineTo(-size * 0.15, 0);
    tCtx.lineTo(-size * 0.02, 0);
    tCtx.lineTo(-size * 0.10, size * 0.23);
    tCtx.lineTo(size * 0.17, -size * 0.08);
    tCtx.lineTo(size * 0.04, -size * 0.08);
    tCtx.closePath();
    tCtx.fillStyle = c;
    tCtx.fill();
  } else {
    drawDecorGraphic(tCtx, item.id, c, size * 0.34);
  }
  tCtx.restore();
}

function renderAssetLibrary() {
  const grid = editorRoot.querySelector('.editor-asset-grid');
  if (!grid) return;
  grid.replaceChildren();
  const cat = EXTRA_CATEGORIES.find(c => c.id === activeCategory) || EXTRA_CATEGORIES[0];
  const search = String($('editor-asset-search')?.value || '').trim().toLocaleLowerCase();
  const sourceItems = search
    ? EXTRA_CATEGORIES.flatMap(category => category.items.map(raw => ({ raw, category })))
        .filter(entry => (entry.raw[0] + ' ' + entry.raw[1] + ' ' + entry.category.name).toLocaleLowerCase().includes(search))
    : cat.items.map(raw => ({ raw, category: cat }));
  $('editor-category-title').textContent = search ? 'Resultados da busca' : cat.name;
  $('editor-asset-count').textContent = sourceItems.length + ' OBJETOS' + (search ? ' ENCONTRADOS' : '');

  sourceItems.forEach(entry => {
    const raw = entry.raw;
    const item = ASSET_BY_ID[raw[0]];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'editor-asset-card' + (selectedAssetId === item.id ? ' selected' : '');
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    drawAssetThumb(cv.getContext('2d'), item, 56);
    const name = document.createElement('span');
    name.textContent = item.label;
    b.append(cv, name);
    b.addEventListener('click', () => {
      activeCategory = entry.category.id;
      selectedAssetId = item.id;
      editorSelectedItem = item.id;
      editorToolMode = 'place';
      $('editor-selected-name').textContent = item.label;
      syncEditorToolButtons();
      renderAssetLibrary();
    });
    grid.appendChild(b);
  });
  $('editor-selected-name').textContent = (ASSET_BY_ID[selectedAssetId] || { label: 'Selecione um objeto' }).label;
}

function changeEditorCategory(direction) {
  const index = EXTRA_CATEGORIES.findIndex(c => c.id === activeCategory);
  activeCategory = EXTRA_CATEGORIES[(index + direction + EXTRA_CATEGORIES.length) % EXTRA_CATEGORIES.length].id;
  renderAssetLibrary();
}

function addCategoryPanel() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-library')) return;
  bottom.querySelector('.editor-tabs')?.classList.add('hidden');
  ['editor-panel-assets', 'editor-panel-triggers', 'editor-panel-style'].forEach(id => $(id)?.classList.add('hidden'));
  const panel = document.createElement('section');
  panel.id = 'editor-library';
  panel.innerHTML = '<div class="editor-library-head"><button class="editor-category-arrow" id="editor-category-prev" type="button" aria-label="Categoria anterior" title="Categoria anterior">‹</button><div class="editor-category-current"><small>BIBLIOTECA DE OBJETOS</small><strong id="editor-category-title">Blocks</strong><span id="editor-asset-count"></span><input id="editor-asset-search" type="search" placeholder="Buscar blocos, orbs, portais..." autocomplete="off"></div><button class="editor-category-arrow" id="editor-category-next" type="button" aria-label="Próxima categoria" title="Próxima categoria">›</button></div><div class="editor-asset-grid"></div><div class="editor-selected-label" id="editor-selected-name">Selecione um objeto</div>';
  bottom.appendChild(panel);
  $('editor-asset-search').addEventListener('input', renderAssetLibrary);
  $('editor-category-prev').addEventListener('click', () => changeEditorCategory(-1));
  $('editor-category-next').addEventListener('click', () => changeEditorCategory(1));
  renderAssetLibrary();
}

function addEditorCommandBar() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top) return;

  // Ferramenta de seleção fica junto aos controles originais, não numa barra lateral.
  const selectButton = document.createElement('button');
  selectButton.id = 'tool-select-btn';
  selectButton.type = 'button';
  selectButton.className = 'mini-btn';
  selectButton.textContent = 'SELECIONAR';
  selectButton.title = 'Selecionar e mover objetos';
  top.querySelector('.editor-top-center')?.appendChild(selectButton);
  const previousToolSync = syncEditorToolButtons;
  syncEditorToolButtons = function () {
    previousToolSync();
    selectButton.classList.toggle('active', editorToolMode === 'select');
    $('editor-inspector')?.classList.toggle('editor-inspector-open', editorToolMode === 'select');
    const gridCheckbox = $('grid-setting-visible');
    if (gridCheckbox) gridCheckbox.checked = Boolean(editorShowGrid);
  };
  selectButton.addEventListener('click', () => {
    editorToolMode = 'select';
    syncEditorToolButtons();
  });

  const groupButton = document.createElement('button');
  groupButton.id = 'editor-select-group-btn';
  groupButton.type = 'button';
  groupButton.className = 'mini-btn';
  groupButton.textContent = 'GRUPO';
  groupButton.title = 'Selecionar todos os objetos dos mesmos grupos';
  groupButton.addEventListener('click', selectMatchingGroup);
  top.querySelector('.editor-top-center')?.appendChild(groupButton);

  const del = document.createElement('section');
  del.id = 'editor-delete-panel';
  del.className = 'hidden';
  del.innerHTML = '<strong>APAGAR OBJETOS</strong><div class="editor-delete-modes"><button type="button" data-erase="click" class="active">Clique</button><button type="button" data-erase="drag">Deslize</button></div><label class="editor-clear-slider"><span>Limpar fase</span><input id="editor-clear-swipe" type="range" min="0" max="100" value="0"><small>Deslize até o final para limpar tudo</small></label>';
  editorRoot.appendChild(del);
  del.querySelectorAll('[data-erase]').forEach(button => button.addEventListener('click', () => {
    eraseGestureMode = button.dataset.erase;
    del.querySelectorAll('[data-erase]').forEach(other => other.classList.toggle('active', other === button));
  }));
  $('editor-clear-swipe').addEventListener('input', event => {
    if (Number(event.target.value) < 98) return;
    recordHistory();
    ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'].forEach(key => { editorDraft[key] = []; });
    selectedObjects = [];
    refreshInspector();
    drawEditorCanvas();
    event.target.value = 0;
  });

  const undo = document.createElement('button');
  undo.id = 'editor-undo-btn'; undo.type = 'button'; undo.className = 'mini-btn';
  undo.textContent = '↶'; undo.title = 'Desfazer'; undo.addEventListener('click', undoLocalEditor);
  const redo = document.createElement('button');
  redo.id = 'editor-redo-btn'; redo.type = 'button'; redo.className = 'mini-btn';
  redo.textContent = '↷'; redo.title = 'Refazer'; redo.addEventListener('click', redoLocalEditor);
  top.querySelector('.editor-top-right')?.prepend(redo, undo);
  const recovery = document.createElement('button');
  recovery.id = 'editor-recover-btn';
  recovery.type = 'button';
  recovery.className = 'mini-btn';
  recovery.textContent = 'RECUPERAR';
  recovery.title = 'Restaurar o último rascunho salvo automaticamente';
  recovery.addEventListener('click', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('gd_editor_autosave_v1') || 'null');
      if (!saved || !saved.level) { alert('Nenhum rascunho automático encontrado.'); return; }
      if (!confirm('Restaurar o rascunho automático? O conteúdo atual do editor será substituído.')) return;
      recordHistory();
      editorDraft = JSON.parse(JSON.stringify(saved.level));
      selectedObjects = [];
      syncStyleInputsFromDraft();
      refreshInspector();
      drawEditorCanvas();
    } catch (_) { alert('Não foi possível recuperar o rascunho.'); }
  });
  top.querySelector('.editor-top-right')?.prepend(recovery);
}
function addLayerManager() {
 const top=editorRoot.querySelector('.editor-topbar'); if(!top||$('editor-layers-open')) return;
 const button=document.createElement('button'); button.id='editor-layers-open'; button.type='button'; button.className='mini-btn'; button.textContent='CAMADAS'; button.title='Mostrar ou ocultar categorias de objetos'; top.querySelector('.editor-top-right')?.prepend(button);
 const panel=document.createElement('section'); panel.id='editor-layers-panel'; panel.className='hidden';
 panel.innerHTML='<div class="grid-settings-head"><strong>CAMADAS DO EDITOR</strong><button type="button" id="editor-layers-close">×</button></div><div id="editor-layer-list"></div><div class="editor-layer-actions"><button type="button" id="editor-layers-show-all">MOSTRAR TODAS</button><button type="button" id="editor-layers-hide-all">OCULTAR TODAS</button></div>';
 editorRoot.appendChild(panel); const list=$('editor-layer-list');
 EDITOR_LAYERS.forEach(([key,label])=>{const row=document.createElement('label');row.className='editor-layer-row';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=editorLayerVisibility[key]!==false;checkbox.addEventListener('change',()=>{editorLayerVisibility[key]=checkbox.checked;try{localStorage.setItem('gd_editor_layers_v1',JSON.stringify(editorLayerVisibility));}catch(_){}drawEditorCanvas();});const span=document.createElement('span');span.textContent=label;row.append(checkbox,span);list.appendChild(row);});
 button.addEventListener('click',()=>panel.classList.toggle('hidden')); $('editor-layers-close').addEventListener('click',()=>panel.classList.add('hidden'));
 $('editor-layers-show-all').addEventListener('click',()=>{EDITOR_LAYERS.forEach(([key])=>editorLayerVisibility[key]=true);list.querySelectorAll('input').forEach(input=>input.checked=true);try{localStorage.setItem('gd_editor_layers_v1',JSON.stringify(editorLayerVisibility));}catch(_){}drawEditorCanvas();});
 $('editor-layers-hide-all').addEventListener('click',()=>{EDITOR_LAYERS.forEach(([key])=>editorLayerVisibility[key]=false);list.querySelectorAll('input').forEach(input=>input.checked=false);try{localStorage.setItem('gd_editor_layers_v1',JSON.stringify(editorLayerVisibility));}catch(_){}drawEditorCanvas();});
}
function addGridSettings() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-grid-settings-open')) return;

  const button = document.createElement('button');
  button.id = 'editor-grid-settings-open';
  button.type = 'button';
  button.className = 'mini-btn';
  button.textContent = '▦';
  button.title = 'Configurações da grade';
  top.querySelector('.editor-top-right')?.prepend(button);

  const panel = document.createElement('section');
  panel.id = 'editor-grid-settings-panel';
  panel.className = 'hidden';
  panel.innerHTML = '<div class="grid-settings-head"><strong>GRADE DO EDITOR</strong><button type="button" id="editor-grid-settings-close" aria-label="Fechar">×</button></div><div class="grid-settings-cell"><span>Tamanho da célula</span><b>44 × 44 px · 1 CUBO</b><small>Fixo para manter o alinhamento idêntico ao jogo.</small></div><label class="grid-settings-option"><input id="grid-setting-visible" type="checkbox"><span>Mostrar grade</span></label><label class="grid-settings-option"><span>Contraste das linhas</span><select id="grid-setting-strength"><option value="soft">Suave</option><option value="normal">Normal</option><option value="strong">Forte</option></select></label>';
  editorRoot.appendChild(panel);
  $('grid-setting-visible').checked = Boolean(editorShowGrid);
  $('grid-setting-strength').value = gridLineStrength;

  button.addEventListener('click', () => {
    gridSettingsOpen = !gridSettingsOpen;
    panel.classList.toggle('hidden', !gridSettingsOpen);
  });
  $('editor-grid-settings-close').addEventListener('click', () => {
    gridSettingsOpen = false;
    panel.classList.add('hidden');
  });
  $('grid-setting-visible').addEventListener('change', ev => {
    editorShowGrid = ev.target.checked;
    persistGridSettings();
    syncEditorToolButtons();
    drawEditorCanvas();
  });
  // O botão GRID: ON/OFF também salva a preferência e mantém o painel sincronizado.
  $('editor-grid-btn')?.addEventListener('click', () => {
    persistGridSettings();
    const gridCheckbox = $('grid-setting-visible');
    if (gridCheckbox) gridCheckbox.checked = Boolean(editorShowGrid);
  });
  $('grid-setting-strength').addEventListener('change', ev => {
    gridLineStrength = ev.target.value;
    persistGridSettings();
    drawEditorCanvas();
  });
}

function addInspector() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-inspector')) return;
  const panel = document.createElement('aside');
  panel.id = 'editor-inspector';
  panel.innerHTML = '<div class="editor-inspector-title">OBJECT INSPECTOR <span id="editor-selection-count">0 selected</span></div><div class="editor-inspector-fields"><label>ROTATION<input id="inspect-rotation" type="number" step="1" value="0"></label><label>SCALE %<input id="inspect-scale" type="number" min="10" max="500" step="5" value="100"></label><label class="group-field">GROUPS<input id="inspect-groups" type="text" placeholder="Ex.: 1, 2, 10"></label><div id="trigger-config" class="trigger-config hidden"></div><button id="inspect-apply-btn" type="button">APPLY</button></div>';
  editorRoot.appendChild(panel);
  $('inspect-apply-btn').addEventListener('click', applyInspector);
  $('trigger-config').addEventListener('change', ev => {
    const rec = getSelectionRecords()[0], key = ev.target.dataset.trg;
    if (!rec || rec.key !== 'triggers' || !key) return;
    recordHistory();
    const nums = ['speed','moveX','moveY','shakeAmount','rotateAmount','pulseAmount'];
    rec.obj[key] = nums.includes(key) ? Number(ev.target.value) : ev.target.value;
    drawEditorCanvas();
  });
}

function getSelectionRecords() {
  return selectedObjects.map(sel => ({ key: sel.key, obj: sel.obj })).filter(s => (editorDraft[s.key] || []).includes(s.obj));
}
window.__gdEditorSelection = () => getSelectionRecords();
window.__gdRecordEditorHistory = () => recordHistory();

function refreshInspector() {
  const records = getSelectionRecords();
  const first = records[0];
  if (!$('editor-selection-count')) return;
  $('editor-selection-count').textContent = records.length + ' selected';

  ['inspect-rotation', 'inspect-scale', 'inspect-groups'].forEach(id => {
    const input = $(id);
    if (input) input.disabled = !first;
  });
  if ($('inspect-rotation')) $('inspect-rotation').disabled = !first || first.key !== 'decorations';
  if ($('inspect-scale')) $('inspect-scale').disabled = !first || first.key !== 'decorations';
  if (!first) {
    if (typeof window.__gdSyncObjectStyle === 'function') window.__gdSyncObjectStyle([]);
    return;
  }
  if (typeof window.__gdSyncObjectStyle === 'function') window.__gdSyncObjectStyle(records);

  const values = {
    'inspect-rotation': Math.round(((first.obj.rotation || 0) * 180) / Math.PI),
    'inspect-scale': Math.round((first.obj.scale || 1) * 100),
    'inspect-groups': objectGroupList(first.obj).join(', ')
  };
  Object.entries(values).forEach(([id, value]) => {
    const input = $(id);
    if (!input) return;
    input.value = value;
    input.dataset.originalValue = String(value);
  });

  const cfg = $('trigger-config');
  if (cfg) {
    const show = records[0].key === 'triggers';
    cfg.classList.toggle('hidden', !show);
    if (show) {
      const t = first.obj;
      const f = (label, key, value, type = 'number', min = '', max = '', step = '1') =>
        '<label>' + label + '<input data-trg="' + key + '" type="' + type + '" value="' + String(value ?? '') + '" ' +
        (min !== '' ? 'min="' + min + '" ' : '') +
        (max !== '' ? 'max="' + max + '" ' : '') +
        (step !== '' ? 'step="' + step + '"' : '') + '></label>';
      let h = '<strong>' + String(t.kind).toUpperCase() + ' CONFIG</strong>';
      if (t.kind === 'speed_custom') h += f('Speed multiplier', 'speed', t.speed ?? 1.5, 'number', .25, 3, .05);
      if (['move', 'color', 'rotate', 'pulse'].includes(t.kind)) h += '<label>Group ID<input data-trg="groupId" value="' + (t.groupId || '1') + '"></label>';
      if (t.kind === 'move') h += f('Move X blocks', 'moveX', t.moveX ?? 1, 'number', -100, 100, 1) + f('Move Y blocks', 'moveY', t.moveY ?? 0, 'number', -100, 100, 1);
      if (t.kind === 'color') h += f('Object color', 'color', t.color || '#ff4fd8', 'color', '', '', '');
      if (t.kind === 'bg_custom') h += f('BG top', 'bgTop', t.bgTop || '#182848', 'color', '', '', '') + f('BG bottom', 'bgBottom', t.bgBottom || '#4b6cb7', 'color', '', '', '');
      if (t.kind === 'shake_custom') h += f('Shake intensity', 'shakeAmount', t.shakeAmount ?? 8, 'number', 1, 30, 1);
      if (t.kind === 'rotate') h += f('Rotation degrees', 'rotateAmount', t.rotateAmount ?? 45, 'number', -360, 360, 1);
      if (t.kind === 'pulse') h += f('Pulse scale', 'pulseAmount', t.pulseAmount ?? 1.25, 'number', .2, 3, .05);
      cfg.innerHTML = h;
    }
  }
}

function applyInspector() {
  const records = getSelectionRecords();
  if (!records.length) return;
  const rotationInput = $('inspect-rotation');
  const scaleInput = $('inspect-scale');
  const groupsInput = $('inspect-groups');
  const canTransform = records.every(record => record.key === 'decorations');
  const rot = canTransform && rotationInput && !rotationInput.disabled ? Number(rotationInput.value) : null;
  const scalePercent = canTransform && scaleInput && !scaleInput.disabled ? Number(scaleInput.value) : null;
  const groupsValue = groupsInput ? groupsInput.value : '';
  const changeRotation = rot !== null && Number.isFinite(rot) && rot !== Number(rotationInput.dataset.originalValue);
  const changeScale = scalePercent !== null && Number.isFinite(scalePercent) && scalePercent >= 10 && scalePercent <= 500 && scalePercent !== Number(scaleInput.dataset.originalValue);
  const changeGroups = Boolean(groupsInput && !groupsInput.disabled && String(groupsValue) !== String(groupsInput.dataset.originalValue));
  if (!changeRotation && !changeScale && !changeGroups) return;
  recordHistory();
  records.forEach(record => {
    const obj = record.obj;
    if (record.key === 'decorations' && changeRotation) obj.rotation = rot * Math.PI / 180;
    if (record.key === 'decorations' && changeScale) obj.scale = scalePercent / 100;
    if (changeGroups) assignGroups(obj, groupsValue);
  });
  refreshInspector();
  drawEditorCanvas();
  queueEditorAutosave();
}

function findObjectAt(point) {
  let found = null;
  let best = Infinity;
  allEditorArrays(editorDraft).forEach(group => group.items.forEach(obj => {
    const key = group.key;
    const p = objectCenter(obj, key);
    const scale = Math.max(0.2, Math.min(5, Number(obj.scale) || 1));
    let halfW = 22, halfH = 22;
    if (key === 'platforms' || key === 'blocks') {
      halfW = Math.max(22, (Number(obj.w) || BLOCK_SIZE) / 2);
      halfH = Math.max(22, (Number(obj.h) || BLOCK_SIZE) / 2);
    } else if (key === 'spikes') {
      halfW = (obj.sizeType === 'mini' ? MINI_SPIKE_W : BLOCK_SIZE) / 2;
      halfH = (obj.sizeType === 'mini' ? MINI_SPIKE_H : BLOCK_SIZE) / 2;
    } else if (key === 'pillars') {
      halfW = (Number(obj.w) || 34) / 2;
      halfH = (Number(obj.h) || 90) / 2;
    } else if (key === 'portals') {
      halfW = PORTAL_WIDTH / 2;
      halfH = PORTAL_HEIGHT / 2;
    } else if (key === 'saws') {
      halfW = halfH = Math.max(22, Number(obj.r) || 22);
    } else if (key === 'decorations') {
      halfW = halfH = 22 * scale;
    } else if (key === 'triggers') {
      halfW = 20; halfH = 48;
    } else if (key === 'coins' || key === 'orbs') {
      halfW = halfH = 25;
    } else if (key === 'pads') {
      halfW = 26; halfH = 18;
    } else if (key === 'structures') {
      halfW = Math.max(28, (Number(obj.w) || 60) / 2);
      halfH = Math.max(28, (Number(obj.h) || 60) / 2);
    }
    halfW *= scale;
    halfH *= scale;
    const dx = Math.max(0, Math.abs(point.x - p.x) - halfW);
    const dy = Math.max(0, Math.abs(point.y - p.y) - halfH);
    const dist = Math.hypot(dx, dy);
    if (dist <= 18 && dist < best) {
      best = dist;
      found = { key, obj };
    }
  }));
  return found;
}

function addAssetAtWorld(x, y) {
  const item = ASSET_BY_ID[selectedAssetId];
  if (!item) return false;
  const floor = GROUND_Y;
  const snapX = Math.max(gridUnit * Math.ceil(200 / gridUnit), Math.round(x / gridUnit) * gridUnit);
  const snapY = Math.max(0, Math.min(floor, floor - Math.round((floor - y) / gridUnit) * gridUnit));
  const base = { id: makeId(), x: snapX, y: snapY, rotation: 0, scale: 1, groups: [] };
  const clampTop = (value, height) => Math.max(0, Math.min(floor - height, value));
  const clampCenter = (value, radius) => Math.max(radius, Math.min(floor - radius, value));

  if (item.type === 'spike' || item.type === 'mini_spike' || item.type === 'ceil_spike') {
    editorDraft.spikes.push({
      x: base.x, y: Math.max(item.type === 'ceil_spike' ? 0 : 40, Math.min(floor, snapY)),
      sizeType: item.type === 'mini_spike' ? 'mini' : 'normal',
      inverted: item.type === 'ceil_spike'
    });
  } else if (item.type === 'platform' || item.type.indexOf('platform_') === 0) {
    const platformSize = item.type === 'platform_short' ? {w: BLOCK_SIZE, h: 20} : item.type === 'platform_long' ? {w: BLOCK_SIZE * 4, h: 24} : item.type === 'platform_xl' ? {w: BLOCK_SIZE * 6, h: 24} : item.type === 'platform_thin' ? {w: BLOCK_SIZE * 3, h: 12} : {w: EDITOR_GRID * 2, h: 28};
    editorDraft.platforms.push({ x: base.x, y: clampTop(snapY, platformSize.h), ...platformSize });
  } else if (item.type === 'block' || item.type.indexOf('block_') === 0) {
    const blockSize = item.type === 'block_tall' ? {w: BLOCK_SIZE, h: BLOCK_SIZE * 2} : item.type === 'block_wide' ? {w: BLOCK_SIZE * 2, h: BLOCK_SIZE} : item.type === 'block_big' ? {w: BLOCK_SIZE * 2, h: BLOCK_SIZE * 2} : item.type === 'block_3x2' ? {w: BLOCK_SIZE * 3, h: BLOCK_SIZE * 2} : {w: BLOCK_SIZE, h: BLOCK_SIZE};
    editorDraft.blocks.push({ x: base.x, y: clampTop(snapY, blockSize.h), ...blockSize, shape: 'full' });
  } else if (item.type === 'half_block') {
    editorDraft.blocks.push({ x: base.x, y: clampTop(snapY, BLOCK_SIZE / 2), w: BLOCK_SIZE, h: BLOCK_SIZE / 2, shape: 'half' });
  } else if (item.type === 'quarter_block') {
    editorDraft.blocks.push({ x: base.x, y: clampTop(snapY, BLOCK_SIZE / 2), w: BLOCK_SIZE / 2, h: BLOCK_SIZE / 2, shape: 'quarter' });
  } else if (item.type === 'slope' || item.type === 'slope_reverse') {
    editorDraft.blocks.push({ x: base.x, y: clampTop(snapY, BLOCK_SIZE), w: BLOCK_SIZE, h: BLOCK_SIZE, shape: item.type });
  } else if (item.type.indexOf('orb_') === 0) {
    editorDraft.orbs.push({ x: base.x, y: clampCenter(snapY, 18), color: selectedAssetId.replace('orb_', ''), used: false });
  } else if (item.type.indexOf('pad_') === 0) {
    editorDraft.pads.push({ x: base.x, color: selectedAssetId.replace('pad_', ''), cooldown: 0 });
  } else if (item.type === 'portal_cube' || item.type === 'portal_ship' || item.type === 'portal_extra') {
    editorDraft.portals.push({ x: base.x, y: clampCenter(snapY, PORTAL_HEIGHT / 2), type: selectedAssetId.replace('portal_', ''), triggered: false });
  } else if (item.type === 'saw' || item.type === 'saw_small' || item.type === 'saw_large') {
    const radius = item.type === 'saw_small' ? 14 : item.type === 'saw_large' ? 34 : 22;
    editorDraft.saws.push({ x: base.x, y: clampCenter(snapY, radius), r: radius, angle: 0 });
  } else if (item.type === 'pillar') {
    editorDraft.pillars.push({ x: base.x, h: 90, w: 34 });
  } else if (item.type === 'coin') {
    editorDraft.coins.push({ x: base.x, y: clampCenter(snapY, 14), collected: false });
  } else if (item.type === 'legacy_trigger' || item.type === 'custom_trigger') {
    const map = {
      trig_speed_fast:{kind:'speed_fast'},trig_speed_slow:{kind:'speed_slow'},trig_speed_norm:{kind:'speed_normal'},
      trig_bg_purple:{kind:'bg',bgTop:'#311042',bgBottom:'#7209b7'},trig_bg_cyan:{kind:'bg_cyan',bgTop:'#083344',bgBottom:'#0891b2'},
      trig_shake:{kind:'shake',shakeAmount:12},trig_low_grav:{kind:'low_grav'},trig_high_grav:{kind:'high_grav'},trig_norm_grav:{kind:'norm_grav'},
      trig_custom_speed:{kind:'speed_custom',speed:1.5},trig_move:{kind:'move',groupId:'1',moveX:1,moveY:0},
      trig_color:{kind:'color',groupId:'1',color:'#ff4fd8'},trig_bg_custom:{kind:'bg_custom',bgTop:'#182848',bgBottom:'#4b6cb7'},
      trig_shake_custom:{kind:'shake_custom',shakeAmount:8},trig_rotate:{kind:'rotate',groupId:'1',rotateAmount:45},trig_pulse:{kind:'pulse',groupId:'1',pulseAmount:1.25}
    };
    const cfg=map[selectedAssetId];
    if(cfg)editorDraft.triggers.push({id:makeId(),x:base.x,y:clampTop(snapY-50,100),triggered:false,...cfg});
  } else {
    const radius = 18 * (base.scale || 1);
    editorDraft.decorations.push({ ...base, y: clampCenter(snapY, radius), kind: selectedAssetId, color: item.color, collision: false });
  }
  return true;
}

const oldPlace = placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord = function (x, y) {
  recordHistory();
  if (ASSET_BY_ID[selectedAssetId]) {
    addAssetAtWorld(x, y);
  } else {
    oldPlace.call(this, x, y);
  }
};

const oldEditAtPointer = editAtEditorPointer;
editAtEditorPointer = function (pointerEvent) {
  const point = getEditorWorldCoords(pointerEvent);
  expandEditorLevelIfNeeded(point.x);
  if (editorToolMode === 'select') {
    if (!selectedDragState) {
      const hit = findObjectAt(point);
      if (pointerEvent.shiftKey && hit) {
        const existing = selectedObjects.findIndex(item => item.key === hit.key && item.obj === hit.obj);
        if (existing >= 0) selectedObjects.splice(existing, 1);
        else selectedObjects.push(hit);
      } else if (hit && !selectedObjects.some(item => item.key === hit.key && item.obj === hit.obj)) {
        selectedObjects = [hit];
      } else if (!hit && !pointerEvent.shiftKey) selectedObjects = [];
      const records = getSelectionRecords();
      selectedDragState = records.length ? {
        records: records.map(record => ({
          key: record.key, obj: record.obj,
          objectX: Number(record.obj.x) || 0,
          objectY: Number.isFinite(Number(record.obj.y)) ? Number(record.obj.y) : record.key === 'spikes' ? (record.obj.inverted ? CEILING_Y : GROUND_Y) : objectCenter(record.obj, record.key).y
        })),
        startX: point.x, startY: point.y, moved: false
      } : { empty: true };
      refreshInspector();
      drawEditorCanvas();
      return;
    }
    if (selectedDragState.empty) return;
    const dx = point.x - selectedDragState.startX;
    const dy = point.y - selectedDragState.startY;
    if (!selectedDragState.moved && Math.hypot(dx, dy) < 5) return;
    if (!selectedDragState.moved) { recordHistory(); selectedDragState.moved = true; }
    selectedDragState.records.forEach(record => {
      const obj = record.obj;
      obj.x = Math.max(0, Math.round((record.objectX + dx) / gridUnit) * gridUnit);
      if (obj.y !== undefined || ['blocks','platforms','orbs','saws','coins','decorations','spikes','portals'].includes(record.key)) {
        obj.y = Math.max(0, Math.min(GROUND_Y, Math.round((record.objectY + dy) / gridUnit) * gridUnit));
      }
    });
    refreshInspector();
    drawEditorCanvas();
    return;
  }
  if (editorToolMode === 'erase') {
    if (eraseGestureMode === 'click' && lastEditorDragPoint) { lastEditorDragPoint = point; return; }
    recordHistory();
    eraseAtWorldCoord(point.x, point.y);
    editorDraft.decorations = (editorDraft.decorations || []).filter(o => Math.hypot((o.x || 0) - point.x, (o.y || 0) - point.y) > 28);
    lastEditorDragPoint = point;
    return;
  }
  oldEditAtPointer(pointerEvent);
};
window.addEventListener('pointerup', () => { selectedDragState = null; });
window.addEventListener('pointercancel', () => { selectedDragState = null; });
function selectMatchingGroup() {
  const first = getSelectionRecords()[0];
  if (!first) return;
  const groups = objectGroupList(first.obj);
  if (!groups.length) return;
  selectedObjects = allEditorArrays(editorDraft).flatMap(bucket =>
    bucket.items.filter(obj => objectGroupList(obj).some(group => groups.includes(group)))
      .map(obj => ({ key: bucket.key, obj }))
  );
  refreshInspector();
  drawEditorCanvas();
}
// Mantém a grade desenhada exatamente na mesma unidade (44px) e deslocamento (editorScrollX) que o clique
const oldDrawEditor = drawEditorCanvas;
drawEditorCanvas = function () {
  oldDrawEditor();
  if (gameState !== 'EDITOR' || !editorDraft) return;

  // Decorações do editor usam as mesmas coordenadas lógicas do jogo (900 × 500).
  (editorDraft.decorations || []).forEach(obj => {
    const sx = (Number(obj.x) || 0) - editorScrollX + 80;
    const sy = Number.isFinite(Number(obj.y)) ? Number(obj.y) : GROUND_Y - 22;
    const scale = Math.max(0.1, Math.min(5, Number(obj.scale) || 1));
    if (sx < -50 || sx > editorCanvas.width + 50 || sy < -50 || sy > GROUND_Y + 50) return;
    eCtx.save();
    eCtx.translate(sx, sy);
    eCtx.rotate(Number(obj.rotation) || 0);
    drawDecorGraphic(eCtx, obj.kind, obj.color || '#7dd3fc', 16 * scale);
    eCtx.restore();
  });

  // Seleção com contorno amarelo alinhado ao centro real do objeto.
  eCtx.save();
  eCtx.strokeStyle = '#ffe600';
  eCtx.lineWidth = 2;
  getSelectionRecords().forEach(record => {
    const center = objectCenter(record.obj, record.key);
    const sx = center.x - editorScrollX + 80;
    const boxW = Math.max(gridUnit, Number(record.obj.w) || gridUnit);
    const boxH = Math.max(gridUnit, Number(record.obj.h) || gridUnit);
    eCtx.strokeRect(sx - boxW / 2, center.y - boxH / 2, boxW, boxH);
  });
  eCtx.restore();
};
// Backup automático local: não depende de conta, servidor ou conexão.
let editorAutosaveTimer = null;
function queueEditorAutosave() {
  if (editorAutosaveTimer) clearTimeout(editorAutosaveTimer);
  editorAutosaveTimer = setTimeout(() => {
    if (gameState !== 'EDITOR' || !editorDraft) return;
    try {
      localStorage.setItem('gd_editor_autosave_v1', JSON.stringify({ savedAt: Date.now(), level: editorDraft }));
      const button = $('editor-recover-btn');
      if (button) button.title = 'Rascunho salvo automaticamente às ' + new Date().toLocaleTimeString();
    } catch (_) {
      const button = $('editor-recover-btn');
      if (button) button.title = 'Armazenamento local cheio: salve a fase manualmente';
    }
  }, 450);
}
const drawWithAutosave = drawEditorCanvas;
drawEditorCanvas = function () {
 if (!editorDraft) { drawWithAutosave(); return; }
 const hidden=[];
 EDITOR_LAYERS.forEach(([key])=>{if(editorLayerVisibility[key]===false){hidden.push([key,editorDraft[key]]);editorDraft[key]=[];}});
 try { drawWithAutosave(); } finally { hidden.forEach(([key,items])=>{editorDraft[key]=items;}); }
 queueEditorAutosave();
};

// Cada sessão de edição começa com histórico próprio; limpar também pode ser desfeito.
// Trilha procedural exclusiva do editor: sintetizador leve, sem arquivos externos.
let editorMusicTimer = null;
let editorMusicStep = 0;
function startEditorMusic() {
  if (editorMusicTimer || !visualSettings.music) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && AC) audioCtx = new AC();
    if (!audioCtx) return;
    audioCtx.resume();
    const melody = [392, 523.25, 659.25, 523.25, 440, 587.33, 698.46, 587.33, 349.23, 440, 523.25, 659.25, 392, 493.88, 587.33, 493.88];
    editorMusicTimer = setInterval(() => {
      if (!visualSettings.music || !audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const note = melody[editorMusicStep % melody.length];
      const tone = (frequency, duration, wave, level, attack = 0.012) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, visualSettings.volume * level), now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + duration + 0.02);
      };
      tone(note, 0.30, 'triangle', 0.075);
      if (editorMusicStep % 2 === 0) tone(note * 0.5, 0.52, 'sine', 0.065, 0.035);
      if (editorMusicStep % 4 === 2) tone(note * 2, 0.13, 'sine', 0.025);
      editorMusicStep++;
    }, 220);
  } catch (_) {}
}
function stopEditorMusic() {
  if (editorMusicTimer) clearInterval(editorMusicTimer);
  editorMusicTimer = null;
}


const originalShowOverlayForEditorMusic = showOverlay;
showOverlay = function (overlayEl, nextState) {
  originalShowOverlayForEditorMusic.call(this, overlayEl, nextState);
  if (nextState === 'EDITOR') {
    stopProceduralMusic();
    startEditorMusic();
  } else {
    stopEditorMusic();
    if (nextState === 'MENU' && visualSettings.music) startProceduralMusic();
  }
};

const originalOpenEditorWithLevel = openEditorWithLevel;
openEditorWithLevel = function (level) {
  localUndoStack.length = 0;
  localRedoStack.length = 0;
  selectedObjects = [];
  selectedDragState = null;

  // Compatibilidade com fases antigas: garante todas as listas antes de usar a biblioteca nova.
  const safeLevel = JSON.parse(JSON.stringify(level || createEmptyEditorDraft()));
  if (Array.isArray(safeLevel.portals)) safeLevel.portals = safeLevel.portals.filter(portal => portal && portal.type !== 'spider');
  ['spikes', 'platforms', 'blocks', 'pads', 'orbs', 'saws', 'pillars', 'coins',
   'portals', 'triggers', 'decorations', 'structures'].forEach(key => {
    if (!Array.isArray(safeLevel[key])) safeLevel[key] = [];
  });
  if (!Number.isFinite(Number(safeLevel.finishX))) safeLevel.finishX = 4400;
  originalOpenEditorWithLevel.call(this, safeLevel);
};
$('editor-clear-btn')?.addEventListener('click', () => recordHistory(), true);

addCategoryPanel();
addEditorCommandBar();
addGridSettings();
addLayerManager();
addInspector();
refreshInspector();

document.addEventListener('keydown', event => {
  if (gameState !== 'EDITOR') return;
  const target = event.target;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && key === 'a') {
    event.preventDefault();
    selectedObjects = allEditorArrays(editorDraft).flatMap(bucket => bucket.items.map(obj => ({ key: bucket.key, obj })));
    refreshInspector();
    drawEditorCanvas();
    return;
  }
  if (modifier && key === 'c') {
    const records = getSelectionRecords();
    if (!records.length) return;
    editorClipboard = records.map(record => ({ key: record.key, obj: JSON.parse(JSON.stringify(record.obj)) }));
    event.preventDefault();
    return;
  }
  if (modifier && (key === 'v' || key === 'd')) {
    if (key === 'd' && getSelectionRecords().length) {
      editorClipboard = getSelectionRecords().map(record => ({ key: record.key, obj: JSON.parse(JSON.stringify(record.obj)) }));
    }
    if (!editorClipboard.length) return;
    event.preventDefault();
    recordHistory();
    selectedObjects = editorClipboard.map(entry => {
      const obj = JSON.parse(JSON.stringify(entry.obj));
      obj.id = makeId();
      obj.x = Math.max(0, (Number(obj.x) || 0) + gridUnit);
      if (obj.y !== undefined) obj.y = Number(obj.y) + gridUnit;
      (editorDraft[entry.key] || (editorDraft[entry.key] = [])).push(obj);
      return { key: entry.key, obj };
    });
    refreshInspector();
    drawEditorCanvas();
    return;
  }
  if (modifier && key === 'x') {
    const records = getSelectionRecords();
    if (!records.length) return;
    editorClipboard = records.map(record => ({ key: record.key, obj: JSON.parse(JSON.stringify(record.obj)) }));
    event.preventDefault();
    recordHistory();
    records.forEach(record => {
      const list = editorDraft[record.key], index = list.indexOf(record.obj);
      if (index >= 0) list.splice(index, 1);
    });
    selectedObjects = [];
    refreshInspector();
    drawEditorCanvas();
    return;
  }
  if (key === 'escape') {
    selectedObjects = [];
    selectedDragState = null;
    refreshInspector();
    drawEditorCanvas();
    return;
  }
  if (modifier && key === 'z') {
    event.preventDefault();
    if (event.shiftKey) redoLocalEditor();
    else undoLocalEditor();
    return;
  }
  if (modifier && key === 'y') {
    event.preventDefault();
    redoLocalEditor();
    return;
  }
  if ((key === 'delete' || key === 'backspace') && getSelectionRecords().length) {
    event.preventDefault();
    recordHistory();
    getSelectionRecords().forEach(record => {
      const list = editorDraft[record.key];
      const index = list.indexOf(record.obj);
      if (index >= 0) list.splice(index, 1);
    });
    selectedObjects = [];
    refreshInspector();
    drawEditorCanvas();
  }
});
if (gameState === 'EDITOR') drawEditorCanvas();
})();
