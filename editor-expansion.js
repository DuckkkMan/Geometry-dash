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
    ['half_block', 'Half Block', 'decoration', '#38bdf8'],
    ['slope', 'Slope', 'decoration', '#60a5fa'],
    ['double_block', 'Double Block', 'decoration', '#2563eb'],
    ['outlined_block', 'Outlined Block', 'decoration', '#93c5fd']
  ]},
  { id: 'spikes', name: 'Spikes', icon: '▲', items: [
    ['spike', 'Spike', 'spike', '#ff595e'],
    ['mini_spike', 'Mini Spike', 'mini_spike', '#ff924c'],
    ['ceil_spike', 'Ceiling Spike', 'ceil_spike', '#d62828']
  ]},
  { id: 'orbs', name: 'Orbs', icon: '◉', items: [
    ['orb_yellow', 'Yellow Orb', 'orb_yellow', '#ffd60a'],
    ['orb_pink', 'Pink Orb', 'orb_pink', '#f72585']
  ]},
  { id: 'pads', name: 'Pads', icon: '⌁', items: [
    ['pad_yellow', 'Yellow Pad', 'pad_yellow', '#ffe600'],
    ['pad_pink', 'Pink Pad', 'pad_pink', '#ff4fd8']
  ]},
  { id: 'portals', name: 'Portals', icon: '◌', items: [
    ['portal_cube', 'Cube Portal', 'portal_cube', '#80ed99'],
    ['portal_ship', 'Ship Portal', 'portal_ship', '#38bdf8'],
    ['portal_ball', 'Ball Portal', 'portal_extra', '#f59e0b'],
    ['portal_ufo', 'UFO Portal', 'portal_extra', '#a78bfa'],
    ['portal_wave', 'Wave Portal', 'portal_extra', '#22d3ee'],
    ['portal_robot', 'Robot Portal', 'portal_extra', '#fb923c'],
    ['portal_spider', 'Spider Portal', 'portal_extra', '#f472b6']
  ]},
  { id: 'decorations', name: 'Decorations', icon: '✦', items: [
    ['deco_star', 'Star', 'decoration', '#fde68a'],
    ['deco_crystal', 'Crystal', 'decoration', '#67e8f9'],
    ['deco_ring', 'Ring', 'decoration', '#c4b5fd'],
    ['deco_arrow', 'Arrow', 'decoration', '#fca5a5']
  ]},
  { id: 'structures', name: 'Structures', icon: '▤', items: [
    ['saw', 'Saw', 'saw', '#94a3b8'],
    ['pillar', 'Pillar', 'pillar', '#e2e8f0']
  ]},
  { id: 'triggers', name: 'Triggers', icon: '⚡', items: [
    ['trig_speed_fast', 'Speed 1.25x', 'legacy_trigger', '#00e5ff'],
    ['trig_speed_norm', 'Speed 1.0x', 'legacy_trigger', '#38bdf8'],
    ['trig_bg_purple', 'BG Color Trigger', 'legacy_trigger', '#9b5de5'],
    ['trig_shake', 'Shake Trigger', 'legacy_trigger', '#f15bb5'],
    ['trig_low_grav', 'Low Gravity', 'legacy_trigger', '#fee440'],
    ['trig_norm_grav', 'Normal Gravity', 'legacy_trigger', '#9dff00']
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
    if (typeof savedGrid.visible === 'boolean') editorShowGrid = savedGrid.visible;
    if (['soft', 'normal', 'strong'].includes(savedGrid.strength)) gridLineStrength = savedGrid.strength;
  }
} catch (_) {}

function persistGridSettings() {
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

function allEditorArrays(draft) {
  return ['spikes', 'platforms', 'blocks', 'pads', 'orbs', 'saws', 'pillars', 'coins', 'portals', 'triggers', 'decorations', 'structures']
    .map(key => ({ key, items: Array.isArray(draft[key]) ? draft[key] : [] }));
}

function objectCenter(obj) {
  let y = obj.y;
  if (y === undefined) {
    if (obj.cooldown !== undefined) y = GROUND_Y - 5;
    else if (obj.h !== undefined) y = GROUND_Y - (Number(obj.h) || 90) / 2;
    else if (obj.type) y = GROUND_Y - PORTAL_HEIGHT / 2;
    else y = GROUND_Y - 45;
  }
  return { x: Number(obj.x) || 0, y: Number(y) };
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
  if (family === 'star') {
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
  } else if (type === 'saw') {
    tCtx.beginPath();
    tCtx.arc(0, 0, size * 0.34, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.stroke();
  } else if (type === 'block' || type === 'platform' || type === 'pillar') {
    tCtx.fillRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    tCtx.strokeRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
  } else if (type === 'coin') {
    tCtx.beginPath();
    tCtx.ellipse(0, 0, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.stroke();
  } else if (type === 'legacy_trigger') {
    tCtx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
    tCtx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
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
  const query = ($('editor-asset-search')?.value || '').trim().toLocaleLowerCase();
  const visibleItems = cat.items.filter(raw => !query || raw[1].toLocaleLowerCase().includes(query) || raw[0].toLocaleLowerCase().includes(query));
  $('editor-category-title').textContent = cat.name;
  $('editor-asset-count').textContent = visibleItems.length + ' / ' + cat.items.length;

  visibleItems.forEach(raw => {
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
  panel.innerHTML = '<div class="editor-library-head"><button id="editor-category-prev" type="button" aria-label="Categoria anterior">◀</button><div><small>CATEGORIA</small><strong id="editor-category-title">Blocks</strong></div><span id="editor-asset-count"></span><button id="editor-category-next" type="button" aria-label="Próxima categoria">▶</button></div><input id="editor-asset-search" class="editor-asset-search" type="search" placeholder="Buscar nesta categoria..." autocomplete="off"><div class="editor-asset-grid"></div><div class="editor-selected-label" id="editor-selected-name">Selecione um objeto</div>';
  bottom.appendChild(panel);
  $('editor-category-prev').addEventListener('click', () => changeEditorCategory(-1));
  $('editor-category-next').addEventListener('click', () => changeEditorCategory(1));
  $('editor-asset-search').addEventListener('input', renderAssetLibrary);
  renderAssetLibrary();
}

function addEditorCommandBar() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-tool-rail')) return;
  editorRoot.querySelector('.editor-top-center')?.classList.add('hidden');

  const rail = document.createElement('nav');
  rail.id = 'editor-tool-rail';
  rail.innerHTML = '<button type="button" data-tool="place" class="active"><b>＋</b><span>Colocar</span></button><button type="button" data-tool="select"><b>↖</b><span>Editar</span></button><button type="button" data-tool="pan"><b>✋</b><span>Mover</span></button><button type="button" data-tool="erase"><b>⌫</b><span>Apagar</span></button>';
  editorRoot.appendChild(rail);

  rail.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => {
    editorToolMode = b.dataset.tool;
    $('editor-delete-panel')?.classList.toggle('hidden', editorToolMode !== 'erase');
    $('editor-inspector')?.classList.toggle('editor-inspector-open', editorToolMode === 'select');
    syncEditorToolButtons();
  }));

  const previousSyncEditorToolButtons = syncEditorToolButtons;
  syncEditorToolButtons = function () {
    previousSyncEditorToolButtons();
    rail.querySelectorAll('[data-tool]').forEach(button => {
      button.classList.toggle('active', button.dataset.tool === editorToolMode);
    });
  };

  const del = document.createElement('section');
  del.id = 'editor-delete-panel';
  del.className = 'hidden';
  del.innerHTML = '<strong>APAGAR OBJETOS</strong><div class="editor-delete-modes"><button type="button" data-erase="click" class="active">Clique</button><button type="button" data-erase="drag">Deslize</button></div><label class="editor-clear-slider"><span>Limpar fase</span><input id="editor-clear-swipe" type="range" min="0" max="100" value="0"><small>Deslize até o final para limpar tudo</small></label>';
  editorRoot.appendChild(del);

  del.querySelectorAll('[data-erase]').forEach(b => b.addEventListener('click', () => {
    eraseGestureMode = b.dataset.erase;
    del.querySelectorAll('[data-erase]').forEach(x => x.classList.toggle('active', x === b));
  }));

  $('editor-clear-swipe').addEventListener('input', e => {
    if (Number(e.target.value) < 98) return;
    recordHistory();
    ['spikes', 'platforms', 'blocks', 'pads', 'orbs', 'saws', 'pillars', 'coins', 'portals', 'triggers', 'decorations', 'structures'].forEach(k => { editorDraft[k] = []; });
    selectedObjects = [];
    refreshInspector();
    drawEditorCanvas();
    e.target.value = 0;
  });

  const undoBtn = document.createElement('button');
  undoBtn.id = 'editor-undo-btn';
  undoBtn.type = 'button';
  undoBtn.className = 'mini-btn';
  undoBtn.textContent = '↶';
  undoBtn.title = 'Desfazer';
  undoBtn.addEventListener('click', undoLocalEditor);

  const redoBtn = document.createElement('button');
  redoBtn.id = 'editor-redo-btn';
  redoBtn.type = 'button';
  redoBtn.className = 'mini-btn';
  redoBtn.textContent = '↷';
  redoBtn.title = 'Refazer';
  redoBtn.addEventListener('click', redoLocalEditor);

  top.querySelector('.editor-top-right')?.prepend(redoBtn, undoBtn);
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
  panel.innerHTML = '<div class="editor-inspector-title">OBJECT INSPECTOR <span id="editor-selection-count">0 selected</span></div><div class="editor-inspector-fields"><label>X<input id="inspect-x" type="number" step="1"></label><label>Y<input id="inspect-y" type="number" step="1"></label><label>ROTATION<input id="inspect-rotation" type="number" step="1" value="0"></label><label>SCALE %<input id="inspect-scale" type="number" min="10" max="500" step="5" value="100"></label><label class="group-field">GROUPS<input id="inspect-groups" type="text" placeholder="Ex.: 1, 2, 10"></label><button id="inspect-apply-btn" type="button">APPLY</button></div>';
  editorRoot.appendChild(panel);
  $('inspect-apply-btn').addEventListener('click', applyInspector);
}

function getSelectionRecords() {
  return selectedObjects.map(sel => ({ key: sel.key, obj: sel.obj })).filter(s => (editorDraft[s.key] || []).includes(s.obj));
}

function refreshInspector() {
  const records = getSelectionRecords();
  const first = records[0];
  if (!$('editor-selection-count')) return;
  $('editor-selection-count').textContent = records.length + ' selected';
  ['inspect-x', 'inspect-y', 'inspect-rotation', 'inspect-scale', 'inspect-groups'].forEach(id => {
    if ($(id)) $(id).disabled = !first;
  });
  if (!first) return;
  $('inspect-x').value = Math.round(first.obj.x || 0);
  $('inspect-y').value = Math.round(first.obj.y === undefined ? GROUND_Y - 45 : first.obj.y);
  $('inspect-rotation').value = Math.round(((first.obj.rotation || 0) * 180) / Math.PI);
  $('inspect-scale').value = Math.round((first.obj.scale || 1) * 100);
  $('inspect-groups').value = objectGroupList(first.obj).join(', ');
}

function applyInspector() {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  const x = Number($('inspect-x').value);
  const y = Number($('inspect-y').value);
  const rot = Number($('inspect-rotation').value);
  const scale = Number($('inspect-scale').value) / 100;
  const first = records[0].obj;
  const dx = Number.isFinite(x) ? x - (first.x || 0) : 0;
  const dy = Number.isFinite(y) ? y - (first.y === undefined ? GROUND_Y - 45 : first.y) : 0;

  records.forEach(s => {
    if (Number.isFinite(x)) s.obj.x = Math.round(((s.obj.x || 0) + dx) / gridUnit) * gridUnit;
    if (Number.isFinite(y)) s.obj.y = Math.round(((s.obj.y === undefined ? GROUND_Y - 45 : s.obj.y) + dy) / gridUnit) * gridUnit;
    if (Number.isFinite(rot)) s.obj.rotation = (rot * Math.PI) / 180;
    if (Number.isFinite(scale)) s.obj.scale = Math.max(0.1, Math.min(5, scale));
    assignGroups(s.obj, $('inspect-groups').value);
  });
  drawEditorCanvas();
}

function findObjectAt(point) {
  let found = null;
  let best = Infinity;
  allEditorArrays(editorDraft).forEach(group => group.items.forEach(obj => {
    const p = objectCenter(obj);
    const dist = Math.hypot(point.x - p.x, point.y - p.y);
    const radius = Math.max(30, (obj.w || obj.r || 40) * (obj.scale || 1) * 0.65);
    if (dist < radius && dist < best) {
      best = dist;
      found = { key: group.key, obj };
    }
  }));
  return found;
}

function addAssetAtWorld(x, y) {
  const item = ASSET_BY_ID[selectedAssetId];
  if (!item) return false;
  const base = { id: makeId(), x: Math.max(gridUnit * Math.ceil(200 / gridUnit), x), y, rotation: 0, scale: 1, groups: [] };

  if (item.type === 'spike' || item.type === 'mini_spike' || item.type === 'ceil_spike') {
    editorDraft.spikes.push({
      x: base.x,
      y: item.type === 'ceil_spike' ? CEILING_Y : GROUND_Y,
      sizeType: item.type === 'mini_spike' ? 'mini' : 'normal',
      inverted: item.type === 'ceil_spike'
    });
  } else if (item.type === 'platform') {
    editorDraft.platforms.push({ x: base.x, y: Math.min(GROUND_Y - 32, y), w: EDITOR_GRID * 2, h: 28 });
  } else if (item.type === 'block') {
    editorDraft.blocks.push({ x: base.x, y: Math.min(GROUND_Y - BLOCK_SIZE, y), w: BLOCK_SIZE, h: BLOCK_SIZE });
  } else if (item.type.indexOf('orb_') === 0) {
    editorDraft.orbs.push({ x: base.x, y: Math.min(GROUND_Y - 24, y), color: selectedAssetId.replace('orb_', ''), used: false });
  } else if (item.type.indexOf('pad_') === 0) {
    editorDraft.pads.push({ x: base.x, color: selectedAssetId.replace('pad_', ''), cooldown: 0 });
  } else if (item.type === 'portal_cube' || item.type === 'portal_ship' || item.type === 'portal_extra') {
    const portalType = selectedAssetId.replace('portal_', '');
    editorDraft.portals.push({ x: base.x, type: portalType, triggered: false });
  } else if (item.type === 'saw') {
    editorDraft.saws.push({ x: base.x, y: Math.min(GROUND_Y - 28, y), r: 22, angle: 0 });
  } else if (item.type === 'pillar') {
    editorDraft.pillars.push({ x: base.x, h: 90, w: 34 });
  } else if (item.type === 'coin') {
    editorDraft.coins.push({ x: base.x, y: Math.min(GROUND_Y - 24, y), collected: false });
  } else if (item.type === 'legacy_trigger') {
    const map = {
      trig_speed_fast: { kind: 'speed_fast' },
      trig_speed_norm: { kind: 'speed_normal' },
      trig_bg_purple: { kind: 'bg', bgTop: '#311042', bgBottom: '#7209b7' },
      trig_shake: { kind: 'shake' },
      trig_low_grav: { kind: 'low_grav' },
      trig_norm_grav: { kind: 'norm_grav' }
    };
    const cfg = map[selectedAssetId];
    if (cfg) editorDraft.triggers.push({ x: base.x, triggered: false, ...cfg });
  } else {
    editorDraft.decorations.push(Object.assign(base, { kind: selectedAssetId, color: item.color }));
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
      selectedObjects = hit ? [hit] : [];
      selectedDragState = hit ? {
        key: hit.key, obj: hit.obj, startX: point.x, startY: point.y,
        objectX: Number(hit.obj.x) || 0, objectY: Number.isFinite(Number(hit.obj.y)) ? Number(hit.obj.y) : objectCenter(hit.obj).y,
        moved: false
      } : { empty: true };
      refreshInspector();
      return;
    }
    if (selectedDragState.empty) return;
    const dx = point.x - selectedDragState.startX;
    const dy = point.y - selectedDragState.startY;
    if (!selectedDragState.moved && Math.hypot(dx, dy) < 5) return;
    if (!selectedDragState.moved) {
      recordHistory();
      selectedDragState.moved = true;
    }
    const obj = selectedDragState.obj;
    obj.x = Math.max(0, Math.round((selectedDragState.objectX + dx) / gridUnit) * gridUnit);
    if (obj.y !== undefined || ['blocks','platforms','orbs','saws','coins','spikes','decorations'].includes(selectedDragState.key)) {
      obj.y = Math.round((selectedDragState.objectY + dy) / gridUnit) * gridUnit;
    }
    refreshInspector();
    return;
  }

  if (editorToolMode === 'erase') {
    if (eraseGestureMode === 'click' && lastEditorDragPoint) {
      lastEditorDragPoint = point;
      return;
    }
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

// Mantém a grade desenhada exatamente na mesma unidade (44px) e deslocamento (editorScrollX) que o clique
const oldDrawEditor = drawEditorCanvas;
drawEditorCanvas = function () {
  // O renderizador original também desenha a grade. Desative-a temporariamente
  // para evitar linhas duplicadas e deixar o contraste controlado por esta camada.
  const showGrid = editorShowGrid;
  editorShowGrid = false;
  try {
    oldDrawEditor();
  } finally {
    editorShowGrid = showGrid;
  }
  if (gameState !== 'EDITOR' || !editorDraft) return;

  // Decorações vetoriais: antes eram salvas no rascunho, mas não tinham renderização.
  (editorDraft.decorations || []).forEach(obj => {
    const sx = (Number(obj.x) || 0) - editorScrollX + 80;
    const sy = Number.isFinite(Number(obj.y)) ? Number(obj.y) : Math.min(editorCanvas.height - 44, GROUND_Y) - 45;
    const scale = Math.max(0.1, Math.min(5, Number(obj.scale) || 1));
    if (sx < -50 || sx > editorCanvas.width + 50 || sy < -50 || sy > editorCanvas.height + 50) return;
    eCtx.save();
    eCtx.translate(sx, sy);
    eCtx.rotate(Number(obj.rotation) || 0);
    drawDecorGraphic(eCtx, obj.kind, obj.color || '#7dd3fc', 16 * scale);
    eCtx.restore();
  });
  if (!editorShowGrid) return;

  const w = editorCanvas.width;
  const h = editorCanvas.height;
  const groundY = Math.min(h - 44, GROUND_Y);
  const alpha = gridLineStrength === 'strong' ? 0.34 : (gridLineStrength === 'soft' ? 0.09 : 0.18);

  eCtx.save();
  eCtx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
  eCtx.lineWidth = 1;

  const startX = -((editorScrollX - 80) % gridUnit);
  for (let gx = startX; gx < w; gx += gridUnit) {
    eCtx.beginPath();
    eCtx.moveTo(gx, 0);
    eCtx.lineTo(gx, groundY);
    eCtx.stroke();
  }
  for (let gy = 0; gy <= groundY; gy += gridUnit) {
    eCtx.beginPath();
    eCtx.moveTo(0, gy);
    eCtx.lineTo(w, gy);
    eCtx.stroke();
  }

  // Destaque do objeto selecionado no inspetor
  getSelectionRecords().forEach(s => {
    const c = objectCenter(s.obj);
    const sx = c.x - editorScrollX + 80;
    eCtx.strokeStyle = '#ffe600';
    eCtx.lineWidth = 2;
    eCtx.strokeRect(sx - gridUnit / 2, c.y - gridUnit / 2, gridUnit, gridUnit);
  });

  eCtx.restore();
};

// Cada sessão de edição começa com histórico próprio; limpar também pode ser desfeito.
const originalOpenEditorWithLevel = openEditorWithLevel;
openEditorWithLevel = function (level) {
  localUndoStack.length = 0;
  localRedoStack.length = 0;
  selectedObjects = [];
  originalOpenEditorWithLevel.call(this, level);
};
$('editor-clear-btn')?.addEventListener('click', () => recordHistory(), true);

addCategoryPanel();
addEditorCommandBar();
addGridSettings();
addInspector();
refreshInspector();

document.addEventListener('keydown', event => {
  if (gameState !== 'EDITOR') return;
  const target = event.target;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;
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
