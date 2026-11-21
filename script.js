/* Geometry Dash Web — Editor Expansion 2.0
- Additive editor layer: categorized asset library, inspector, transforms,
- groups, stage settings, precise grid and configurable runtime triggers.
 */
(function () {
'use strict';/* Geometry Dash Web — Editor Expansion 2.0
- Additive editor layer: categorized asset library, inspector, transforms,
- groups, stage settings, precise grid and configurable runtime triggers.
 */
(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const editorRoot = $('level-editor');
const editorCanvas = $('editor-canvas');
if (!editorRoot || !editorCanvas || typeof editorDraft === 'undefined') return;

const EXTRA_CATEGORIES = [
  { id:'blocks', name:'Blocks', icon:'▦', items:[
    ['block','Block','block','#4cc9f0'],['platform','Platform','platform','#00e5ff'],
    ['half_block','Half Block','decoration','#38bdf8'],['slope','Slope','decoration','#60a5fa'],
    ['double_block','Double Block','decoration','#2563eb'],['outlined_block','Outlined Block','decoration','#93c5fd']
  ]},
  { id:'spikes', name:'Spikes', icon:'▲', items:[
    ['spike','Spike','spike','#ff595e'],['mini_spike','Mini Spike','mini_spike','#ff924c'],
    ['ceil_spike','Ceiling Spike','ceil_spike','#d62828'],['double_spike','Double Spike','decoration','#fb7185'],
    ['wide_spike','Wide Spike','decoration','#e11d48'],['saw_spike','Saw Spike','decoration','#be123c']
  ]},
  { id:'orbs', name:'Orbs', icon:'◉', items:[
    ['orb_yellow','Yellow Orb','orb_yellow','#ffd60a'],['orb_pink','Pink Orb','orb_pink','#f72585'],
    ['orb_blue','Blue Orb','orb_blue','#38bdf8'],['orb_red','Red Orb','orb_red','#ef4444'],
    ['orb_green','Green Orb','orb_green','#22c55e'],['orb_black','Black Orb','orb_black','#334155'],
    ['orb_purple','Purple Orb','orb_purple','#a855f7'],['orb_cyan','Cyan Orb','orb_cyan','#06b6d4'],
    ['orb_dash','Dash Orb','orb_dash','#f97316']
  ]},
  { id:'pads', name:'Pads', icon:'⌁', items:[
    ['pad_yellow','Yellow Pad','pad_yellow','#ffe600'],['pad_pink','Pink Pad','pad_pink','#ff4fd8'],
    ['pad_red','Red Pad','pad_red','#ef4444'],['pad_blue','Blue Pad','pad_blue','#38bdf8'],
    ['pad_green','Green Pad','pad_green','#22c55e'],['pad_black','Black Pad','pad_black','#334155']
  ]},
  { id:'portals', name:'Portals', icon:'◌', items:[
    ['portal_cube','Cube Portal','portal_cube','#80ed99'],['portal_ship','Ship Portal','portal_ship','#38bdf8'],
    ['portal_ball','Ball Portal','portal_extra','#f59e0b'],['portal_ufo','UFO Portal','portal_extra','#a78bfa'],
    ['portal_wave','Wave Portal','portal_extra','#22d3ee'],['portal_robot','Robot Portal','portal_extra','#fb923c'],
    ['portal_spider','Spider Portal','portal_extra','#f472b6'],['portal_gravity','Gravity Portal','portal_extra','#c084fc'],
    ['portal_mirror','Mirror Portal','portal_extra','#e2e8f0']
  ]},
  { id:'decorations', name:'Decorations', icon:'✦', items:[
    ['deco_star','Star','decoration','#fde68a'],['deco_crystal','Crystal','decoration','#67e8f9'],
    ['deco_ring','Ring','decoration','#c4b5fd'],['deco_arrow','Arrow','decoration','#fca5a5'],
    ['deco_spark','Spark','decoration','#fef08a'],['deco_triangle','Triangle','decoration','#fb7185'],
    ['deco_window','Window','decoration','#93c5fd'],['deco_chain','Chain','decoration','#cbd5e1'],
    ['deco_gear','Gear','decoration','#94a3b8'],['deco_flower','Flower','decoration','#f9a8d4']
  ]},
  { id:'effects', name:'Effects', icon:'✧', items:[
    ['effect_glow','Glow','decoration','#a5f3fc'],['effect_burst','Burst','decoration','#fef08a'],
    ['effect_flame','Flame','decoration','#fb923c'],['effect_portal_fx','Portal Effect','decoration','#c4b5fd'],
    ['effect_wave','Wave Effect','decoration','#67e8f9'],['effect_sparkle','Sparkle','decoration','#fff7ae']
  ]},
  { id:'structures', name:'Structures', icon:'▤', items:[
    ['saw','Saw','saw','#94a3b8'],['pillar','Pillar','pillar','#e2e8f0'],
    ['structure_wall','Wall','structure','#64748b'],['structure_column','Column','structure','#cbd5e1'],
    ['structure_arch','Arch','structure','#94a3b8'],['structure_chain','Chain','structure','#a1a1aa'],
    ['structure_gear','Gear','structure','#9ca3af'],['structure_spikeball','Spike Ball','saw','#64748b']
  ]},
  { id:'triggers', name:'Triggers', icon:'⚡', items:[
    ['trigger_move','Move Trigger','trigger','#38bdf8'],['trigger_pulse','Pulse Trigger','trigger','#f472b6'],
    ['trigger_scale','Scale Trigger','trigger','#a78bfa'],['trigger_color','Color Trigger','trigger','#22c55e'],
    ['trigger_speed','Speed Trigger','trigger','#facc15'],['trig_bg_purple','BG Color Trigger','legacy_trigger','#9b5de5'],
    ['trig_shake','Shake Trigger','legacy_trigger','#f15bb5'],['trig_low_grav','Low Gravity','legacy_trigger','#fee440'],
    ['trig_norm_grav','Normal Gravity','legacy_trigger','#9dff00']
  ]},
  { id:'other', name:'Other', icon:'◇', items:[
    ['coin','Coin','coin','#ffb703'],['checkpoint','Checkpoint','decoration','#4ade80'],
    ['finish_marker','Finish Marker','decoration','#34d399'],['text_sign','Text Sign','decoration','#e2e8f0']
  ]}
];

const ASSET_BY_ID = {};
EXTRA_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    ASSET_BY_ID[item[0]] = {
      id: item[0],
      label: item[1],
      type: item[2],
      color: item[3],
      category: cat.id
    };
  });
});

let activeCategory = 'blocks';
let selectedAssetId = 'block';
if (typeof editorSelectedItem === 'undefined') {
  var editorSelectedItem = 'block';
} else {
  editorSelectedItem = 'block';
}
let selectedObjects = [];
let selectedEditorObject = null;
let clipboardObjects = [];
let localUndoStack = [];
let localRedoStack = [];
let localHistoryLock = false;
let inspectorLock = false;
let dragState = null;
let snapEnabled = true;
const gridUnit = typeof BLOCK_SIZE !== 'undefined' ? BLOCK_SIZE : 44;
const scaleY = typeof EDITOR_SCALE_Y !== 'undefined' ? EDITOR_SCALE_Y : 1;
const groundY = typeof GROUND_Y !== 'undefined' ? GROUND_Y : 400;
const ceilingY = typeof CEILING_Y !== 'undefined' ? CEILING_Y : 60;
const portalW = typeof PORTAL_WIDTH !== 'undefined' ? PORTAL_WIDTH : 50;
const portalH = typeof PORTAL_HEIGHT !== 'undefined' ? PORTAL_HEIGHT : 90;

let gridLineStrength = 'normal';
let gridSettingsOpen = false;
let editorZoom = 1;

const zoomBuffer = document.createElement('canvas');
zoomBuffer.width = editorCanvas.width;
zoomBuffer.height = editorCanvas.height;
const zoomBufferCtx = zoomBuffer.getContext('2d');

function zoomOffsetX() {
  return (editorCanvas.width - editorCanvas.width * editorZoom) / 2;
}
function zoomOffsetY() {
  return (editorCanvas.height - editorCanvas.height * editorZoom) / 2;
}

let stageSettingsOpen = false;
let extraRuntimeObjects = [];
let runtimeEffects = [];
let lastFrameAt = 0;

function ensureDraftSchema(draft) {
  draft.decorations = Array.isArray(draft.decorations) ? draft.decorations : [];
  draft.structures = Array.isArray(draft.structures) ? draft.structures : [];
  draft.initialMode = draft.initialMode || 'cube';
  draft.initialSpeed = Number.isFinite(Number(draft.initialSpeed)) ? Number(draft.initialSpeed) : 1;
  draft.groups = Array.isArray(draft.groups) ? draft.groups : [];
  draft.triggers = Array.isArray(draft.triggers) ? draft.triggers : [];
  draft.decorations.forEach((o) => { if (!o.id) o.id = makeId(); });
  draft.structures.forEach((o) => { if (!o.id) o.id = makeId(); });
  draft.triggers.forEach((o) => { if (!o.id) o.id = makeId(); });
  return draft;
}

function makeId() {
  return 'obj_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}
function allEditorArrays(draft) {
  return ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures']
    .map((key) => ({ key, items: Array.isArray(draft[key]) ? draft[key] : [] }));
}
function objectCenter(obj) {
  let y = obj.y;
  if (y === undefined) {
    if (obj.cooldown !== undefined) y = groundY - 5;
    else if (obj.h !== undefined) y = groundY - (Number(obj.h) || 90) / 2;
    else if (obj.type) y = groundY - portalH / 2;
    else y = groundY - 45;
  }
  return { x: Number(obj.x) || 0, y: Number(y) };
}
function objectGroupList(obj) {
  if (Array.isArray(obj.groups)) return obj.groups.map(String);
  if (obj.group !== undefined && obj.group !== null && String(obj.group).trim()) return [String(obj.group)];
  return [];
}
function assignGroups(obj, value) {
  obj.groups = String(value || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10);
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
    ensureDraftSchema(editorDraft);
  } finally {
    localHistoryLock = false;
  }
  selectedObjects = [];
  selectedEditorObject = null;
  if (typeof syncStyleInputsFromDraft === 'function') syncStyleInputsFromDraft();
  if (typeof refreshInspector === 'function') refreshInspector();
  if (typeof renderEditorPalettes === 'function') renderEditorPalettes();
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
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

function addCategoryPanel() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-library')) return;
  bottom.querySelector('.editor-tabs')?.classList.add('hidden');
  ['editor-panel-assets','editor-panel-triggers','editor-panel-style'].forEach((id) => $(id)?.classList.add('hidden'));
  const panel = document.createElement('section');
  panel.id = 'editor-library';
  panel.innerHTML = '<div class="editor-library-head"><button id="editor-category-prev" type="button" aria-label="Categoria anterior">◀</button><div><small>CATEGORIA</small><strong id="editor-category-title">Blocks</strong></div><span id="editor-asset-count"></span><button id="editor-category-next" type="button" aria-label="Próxima categoria">▶</button></div><div class="editor-asset-grid"></div><div class="editor-selected-label" id="editor-selected-name">Selecione um objeto</div>';
  bottom.appendChild(panel);
  $('editor-category-prev').addEventListener('click', () => changeEditorCategory(-1));
  $('editor-category-next').addEventListener('click', () => changeEditorCategory(1));
  renderAssetLibrary();
}
function changeEditorCategory(direction) {
  const index = EXTRA_CATEGORIES.findIndex((c) => c.id === activeCategory);
  activeCategory = EXTRA_CATEGORIES[(index + direction + EXTRA_CATEGORIES.length) % EXTRA_CATEGORIES.length].id;
  renderAssetLibrary();
}
function activateEditorPanel(target) {
  const panel = $('editor-library');
  if (panel) panel.classList.toggle('hidden', target !== 'library');
}

function drawAssetThumb(ctx, item, size) {
  const c = item.color || '#38bdf8';
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.lineWidth = Math.max(1.5, size * 0.055);
  ctx.strokeStyle = '#06101e';
  ctx.fillStyle = c;
  const type = item.type;
  if (type === 'spike' || type === 'mini_spike' || item.id.indexOf('spike') >= 0) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.38, size * 0.32);
    ctx.lineTo(0, -size * 0.4);
    ctx.lineTo(size * 0.38, size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'orb_yellow' || type.indexOf('orb_') === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.31, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.19, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type.indexOf('pad_') === 0) {
    ctx.fillRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
    ctx.strokeRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, size * 0.1);
    ctx.lineTo(0, -size * 0.2);
    ctx.lineTo(size * 0.28, size * 0.1);
    ctx.stroke();
  } else if (type.indexOf('portal') === 0) {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.42, 0, 0, Math.PI * 2);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.13;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.14, size * 0.32, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (type === 'saw' || item.id.indexOf('gear') >= 0 || item.id.indexOf('chain') >= 0) {
    ctx.rotate(Math.PI / 8);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      const r = i % 2 ? size * 0.25 : size * 0.39;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1728';
    ctx.fill();
  } else if (type === 'trigger' || type === 'legacy_trigger') {
    ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
    ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (size * 0.3) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 0, size * 0.1);
  } else if (type === 'block' || type === 'platform' || type === 'structure') {
    ctx.fillRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    ctx.strokeRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.strokeRect(-size * 0.23, -size * 0.23, size * 0.46, size * 0.46);
  } else if (type === 'coin') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'decoration' && typeof drawDecorGraphic === 'function') {
    drawDecorGraphic(ctx, item.id.replace('structure_', ''), c, size * 0.34);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.38);
    ctx.lineTo(size * 0.34, 0);
    ctx.lineTo(0, size * 0.38);
    ctx.lineTo(-size * 0.34, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, 0);
    ctx.lineTo(size * 0.2, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function renderAssetLibrary() {
  const grid = editorRoot.querySelector('.editor-asset-grid');
  if (!grid) return;
  grid.replaceChildren();
  const cat = EXTRA_CATEGORIES.find((c) => c.id === activeCategory) || EXTRA_CATEGORIES[0];
  if ($('editor-category-title')) $('editor-category-title').textContent = cat.name;
  if ($('editor-asset-count')) $('editor-asset-count').textContent = cat.items.length + ' OBJETOS';
  cat.items.forEach((raw) => {
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
      if (typeof editorToolMode !== 'undefined') editorToolMode = 'place';
      if ($('editor-selected-name')) $('editor-selected-name').textContent = item.label;
      if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
      renderAssetLibrary();
      showEditorLibrary(true);
    });
    grid.appendChild(b);
  });
  if ($('editor-selected-name')) {
    $('editor-selected-name').textContent = (ASSET_BY_ID[selectedAssetId] || { label: 'Selecione um objeto' }).label;
  }
}
function showEditorLibrary(show) {
  const panel = $('editor-library');
  if (panel) panel.classList.toggle('hidden', !show);
}

let eraseGestureMode = 'click';
function addEditorCommandBar() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-tool-rail')) return;
  editorRoot.querySelector('.editor-top-center')?.classList.add('hidden');
  const rail = document.createElement('nav');
  rail.id = 'editor-tool-rail';
  rail.innerHTML = '<button type="button" data-tool="place" class="active"><b>＋</b><span>Colocar</span></button><button type="button" data-tool="select"><b>↖</b><span>Editar</span></button><button type="button" data-tool="erase"><b>⌫</b><span>Apagar</span></button>';
  editorRoot.appendChild(rail);
  rail.querySelectorAll('[data-tool]').forEach((b) => {
    b.addEventListener('click', () => {
      if (typeof editorToolMode !== 'undefined') editorToolMode = b.dataset.tool;
      rail.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('active', x === b));
      showEditorLibrary(b.dataset.tool === 'place');
      $('editor-delete-panel')?.classList.toggle('hidden', b.dataset.tool !== 'erase');
      $('editor-inspector')?.classList.toggle('editor-inspector-open', b.dataset.tool === 'select');
      if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
    });
  });

  const del = document.createElement('section');
  del.id = 'editor-delete-panel';
  del.className = 'hidden';
  del.innerHTML = '<strong>APAGAR OBJETOS</strong><div class="editor-delete-modes"><button type="button" data-erase="click" class="active">Clique</button><button type="button" data-erase="drag">Deslize</button></div><label class="editor-clear-slider"><span>Limpar fase</span><input id="editor-clear-swipe" type="range" min="0" max="100" value="0"><small>Deslize até o final para limpar tudo</small></label>';
  editorRoot.appendChild(del);
  del.querySelectorAll('[data-erase]').forEach((b) => {
    b.addEventListener('click', () => {
      eraseGestureMode = b.dataset.erase;
      del.querySelectorAll('[data-erase]').forEach((x) => x.classList.toggle('active', x === b));
    });
  });
  $('editor-clear-swipe')?.addEventListener('input', (e) => {
    if (Number(e.target.value) < 98) return;
    recordHistory();
    ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'].forEach((k) => {
      editorDraft[k] = [];
    });
    selectedObjects = [];
    selectedEditorObject = null;
    updateAutoFinish();
    refreshInspector();
    if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
    e.target.value = 0;
  });

  if (typeof openStageSettings === 'function') {
    const settings = document.createElement('button');
    settings.id = 'editor-level-settings-open';
    settings.type = 'button';
    settings.textContent = '⚙';
    settings.title = 'Configurações da fase';
    settings.addEventListener('click', openStageSettings);
    top.querySelector('.editor-top-right')?.prepend(settings);
  }
  $('editor-undo-btn')?.addEventListener('click', undoLocalEditor);
  $('editor-redo-btn')?.addEventListener('click', redoLocalEditor);
}

function addGridSettings() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-grid-settings-open')) return;
  const button = document.createElement('button');
  button.id = 'editor-grid-settings-open';
  button.type = 'button';
  button.textContent = '▦';
  button.title = 'Configurações da grade';
  button.setAttribute('aria-label', 'Configurações da grade');
  top.querySelector('.editor-top-right')?.prepend(button);

  const panel = document.createElement('section');
  panel.id = 'editor-grid-settings-panel';
  panel.className = 'hidden';
  panel.innerHTML = '<div class="grid-settings-head"><strong>GRADE DO EDITOR</strong><button type="button" id="editor-grid-settings-close" aria-label="Fechar">×</button></div><div class="grid-settings-cell"><span>Tamanho da célula</span><b>44 × 44 px · 1 CUBO</b><small>Fixo para manter o alinhamento idêntico ao jogo.</small></div><label class="grid-settings-option"><input id="grid-setting-visible" type="checkbox" checked><span>Mostrar grade</span></label><label class="grid-settings-option"><input id="grid-setting-snap" type="checkbox" checked disabled><span>Encaixe 1×1 obrigatório</span></label><label class="grid-settings-option"><span>Contraste das linhas</span><select id="grid-setting-strength"><option value="soft">Suave</option><option value="normal" selected>Normal</option><option value="strong">Forte</option></select></label>';
  editorRoot.appendChild(panel);

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('gd-editor-grid-settings') || '{}'); }
    catch (_) { return {}; }
  })();
  if (typeof editorShowGrid !== 'undefined') editorShowGrid = saved.visible !== false;
  snapEnabled = true;
  gridLineStrength = ['soft', 'normal', 'strong'].includes(saved.strength) ? saved.strength : 'normal';
  if ($('grid-setting-visible')) $('grid-setting-visible').checked = typeof editorShowGrid !== 'undefined' ? editorShowGrid : true;
  if ($('grid-setting-snap')) $('grid-setting-snap').checked = true;
  if ($('grid-setting-strength')) $('grid-setting-strength').value = gridLineStrength;

  const save = () => {
    try {
      localStorage.setItem('gd-editor-grid-settings', JSON.stringify({
        visible: typeof editorShowGrid !== 'undefined' ? editorShowGrid : true,
        snap: snapEnabled,
        strength: gridLineStrength
      }));
    } catch (_) {}
    if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
    if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  };

  button.addEventListener('click', () => {
    gridSettingsOpen = !gridSettingsOpen;
    panel.classList.toggle('hidden', !gridSettingsOpen);
  });
  $('editor-grid-settings-close')?.addEventListener('click', () => {
    gridSettingsOpen = false;
    panel.classList.add('hidden');
  });
  $('grid-setting-visible')?.addEventListener('change', (ev) => {
    if (typeof editorShowGrid !== 'undefined') editorShowGrid = ev.target.checked;
    save();
  });
  $('grid-setting-snap')?.addEventListener('change', () => {
    snapEnabled = true;
    if ($('grid-setting-snap')) $('grid-setting-snap').checked = true;
    save();
  });
  $('grid-setting-strength')?.addEventListener('change', (ev) => {
    gridLineStrength = ev.target.value;
    save();
  });
}

function addInspector() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-inspector')) return;
  const panel = document.createElement('aside');
  panel.id = 'editor-inspector';
  panel.innerHTML = '<div class="editor-inspector-title">OBJECT INSPECTOR <span id="editor-selection-count">0 selected</span></div><div class="editor-inspector-fields"><label>X<input id="inspect-x" type="number" step="1"></label><label>Y<input id="inspect-y" type="number" step="1"></label><label>ROTATION<input id="inspect-rotation" type="number" step="1" value="0"></label><label>SCALE %<input id="inspect-scale" type="number" min="10" max="500" step="5" value="100"></label><label class="group-field">GROUPS<input id="inspect-groups" type="text" placeholder="Ex.: 1, 2, 10"></label><button id="inspect-apply-btn" type="button">APPLY</button></div>';
  editorRoot.appendChild(panel);
  panel.classList.add('editor-inspector-floating');
  $('inspect-apply-btn')?.addEventListener('click', applyInspector);
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach((id) => {
    $(id)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyInspector(); });
  });
}

function getSelectionRecords() {
  return selectedObjects.map((sel) => ({ key: sel.key, obj: sel.obj })).filter((s) => (editorDraft[s.key] || []).includes(s.obj));
}
function setSelection(records) {
  selectedObjects = records.slice();
  selectedEditorObject = selectedObjects.length ? selectedObjects[selectedObjects.length - 1] : null;
  refreshInspector();
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
}
function refreshInspector() {
  const records = getSelectionRecords();
  const first = records[0];
  if ($('editor-selection-count')) $('editor-selection-count').textContent = records.length + ' selected';
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach((id) => {
    if ($(id)) $(id).disabled = !first;
  });
  if (!first) return;
  inspectorLock = true;
  if ($('inspect-x')) $('inspect-x').value = Math.round(first.obj.x || 0);
  if ($('inspect-y')) $('inspect-y').value = Math.round(first.obj.y === undefined ? groundY - 45 : first.obj.y);
  if ($('inspect-rotation')) $('inspect-rotation').value = Math.round(((first.obj.rotation || 0) * 180) / Math.PI);
  if ($('inspect-scale')) $('inspect-scale').value = Math.round((first.obj.scale || 1) * 100);
  if ($('inspect-groups')) $('inspect-groups').value = objectGroupList(first.obj).join(', ');
  inspectorLock = false;
}
function applyInspector() {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  const x = Number($('inspect-x')?.value);
  const y = Number($('inspect-y')?.value);
  const rot = Number($('inspect-rotation')?.value);
  const scale = Number($('inspect-scale')?.value) / 100;
  const first = records[0].obj;
  const dx = Number.isFinite(x) ? x - (first.x || 0) : 0;
  const dy = Number.isFinite(y) ? y - (first.y === undefined ? groundY - 45 : first.y) : 0;
  records.forEach((s) => {
    if (Number.isFinite(x)) s.obj.x = Math.round(((s.obj.x || 0) + dx) / (gridUnit / 2)) * (gridUnit / 2);
    if (Number.isFinite(y)) s.obj.y = Math.round(((s.obj.y === undefined ? groundY - 45 : s.obj.y) + dy) / (gridUnit / scaleY)) * (gridUnit / scaleY);
    if (Number.isFinite(rot)) s.obj.rotation = (rot * Math.PI) / 180;
    if (Number.isFinite(scale)) applyObjectScale(s.obj, Math.max(0.1, Math.min(5, scale)));
    if ($('inspect-groups')) assignGroups(s.obj, $('inspect-groups').value);
  });
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
}
function applyObjectScale(obj, scale) {
  obj.scale = scale;
  if (obj.w !== undefined) { if (obj._baseW === undefined) obj._baseW = obj.w; obj.w = obj._baseW * scale; }
  if (obj.h !== undefined) { if (obj._baseH === undefined) obj._baseH = obj.h; obj.h = obj._baseH * scale; }
  if (obj.r !== undefined) { if (obj._baseR === undefined) obj._baseR = obj.r; obj.r = obj._baseR * scale; }
  if (obj.radius !== undefined) { if (obj._baseRadius === undefined) obj._baseRadius = obj.radius; obj.radius = obj._baseRadius * scale; }
  if (obj.width !== undefined) { if (obj._baseWidth === undefined) obj._baseWidth = obj.width; obj.width = obj._baseWidth * scale; }
  if (obj.cooldown !== undefined) {
    if (obj._baseWidth === undefined) obj._baseWidth = 36;
    if (obj._baseHeight === undefined) obj._baseHeight = 11;
    obj.width = obj._baseWidth * scale;
    obj.height = obj._baseHeight * scale;
  }
  if (obj.used !== undefined && obj.color) { if (obj._baseRadius === undefined) obj._baseRadius = 17; obj.radius = obj._baseRadius * scale; }
  if (obj.collected !== undefined) { if (obj._baseRadius === undefined) obj._baseRadius = 13; obj.radius = obj._baseRadius * scale; }
  if (obj.type) {
    if (obj._baseWidth === undefined) obj._baseWidth = portalW;
    if (obj._baseHeight === undefined) obj._baseHeight = portalH;
    obj.width = obj._baseWidth * scale;
    obj.height = obj._baseHeight * scale;
  }
  if (obj.height !== undefined) { if (obj._baseHeight === undefined) obj._baseHeight = obj.height; obj.height = obj._baseHeight * scale; }
}
function transformSelection(fn) {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  records.forEach((s) => fn(s.obj));
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  refreshInspector();
}
function duplicateSelection() {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  const next = [];
  records.forEach((s) => {
    const clone = deepClone(s.obj);
    clone.id = makeId();
    clone.x = (clone.x || 0) + gridUnit;
    clone.y = clone.y === undefined ? groundY - 45 : clone.y;
    editorDraft[s.key].push(clone);
    next.push({ key: s.key, obj: clone });
  });
  setSelection(next);
}
function findObjectAt(point) {
  let found = null;
  let best = Infinity;
  allEditorArrays(editorDraft).forEach((group) => {
    group.items.forEach((obj) => {
      const p = objectCenter(obj);
      const dist = Math.hypot(point.x - p.x, point.y - p.y);
      const radius = Math.max(30, (obj.w || obj.r || 40) * (obj.scale || 1) * 0.65);
      if (dist < radius && dist < best) {
        best = dist;
        found = { key: group.key, obj };
      }
    });
  });
  return found;
}
function addAssetAtWorld(x, y) {
  const item = ASSET_BY_ID[selectedAssetId];
  if (!item) return false;
  const maxX = (editorDraft.finishX || 4000) - 80;
  const base = { id: makeId(), x: Math.max(240, Math.min(maxX, x)), y, rotation: 0, scale: 1, groups: [] };
  const color = selectedAssetId.replace(/^orb_|^pad_/, '');
  if (item.type === 'spike' || item.type === 'mini_spike' || item.type === 'ceil_spike') {
    editorDraft.spikes.push({
      x: base.x,
      y: item.type === 'ceil_spike' ? ceilingY : groundY,
      sizeType: item.type === 'mini_spike' ? 'mini' : 'normal',
      inverted: item.type === 'ceil_spike',
      groups: []
    });
  } else if (item.type === 'block') {
    if (selectedAssetId === 'platform') editorDraft.platforms.push({ x: base.x, y: Math.min(groundY - 36, y), w: gridUnit, h: 26, groups: [] });
    else editorDraft.blocks.push({ x: base.x, y: Math.min(groundY - gridUnit, Math.max(ceilingY, y)), w: gridUnit, h: gridUnit, groups: [] });
  } else if (item.type.indexOf('orb_') === 0) {
    editorDraft.orbs.push({ x: base.x, y: Math.min(groundY - 30, y), color, used: false, groups: [] });
  } else if (item.type.indexOf('pad_') === 0) {
    editorDraft.pads.push({ x: base.x, color, cooldown: 0, groups: [] });
  } else if (item.type === 'portal_

const $ = (id) => document.getElementById(id);
const editorRoot = $('level-editor');
const editorCanvas = $('editor-canvas');
if (!editorRoot || !editorCanvas || typeof editorDraft === 'undefined') return;

const EXTRA_CATEGORIES = [
  { id:'blocks', name:'Blocks', icon:'▦', items:[
    ['block','Block','block','#4cc9f0'],['platform','Platform','platform','#00e5ff'],
    ['half_block','Half Block','decoration','#38bdf8'],['slope','Slope','decoration','#60a5fa'],
    ['double_block','Double Block','decoration','#2563eb'],['outlined_block','Outlined Block','decoration','#93c5fd']
  ]},
  { id:'spikes', name:'Spikes', icon:'▲', items:[
    ['spike','Spike','spike','#ff595e'],['mini_spike','Mini Spike','mini_spike','#ff924c'],
    ['ceil_spike','Ceiling Spike','ceil_spike','#d62828'],['double_spike','Double Spike','decoration','#fb7185'],
    ['wide_spike','Wide Spike','decoration','#e11d48'],['saw_spike','Saw Spike','decoration','#be123c']
  ]},
  { id:'orbs', name:'Orbs', icon:'◉', items:[
    ['orb_yellow','Yellow Orb','orb_yellow','#ffd60a'],['orb_pink','Pink Orb','orb_pink','#f72585'],
    ['orb_blue','Blue Orb','orb_blue','#38bdf8'],['orb_red','Red Orb','orb_red','#ef4444'],
    ['orb_green','Green Orb','orb_green','#22c55e'],['orb_black','Black Orb','orb_black','#334155'],
    ['orb_purple','Purple Orb','orb_purple','#a855f7'],['orb_cyan','Cyan Orb','orb_cyan','#06b6d4'],
    ['orb_dash','Dash Orb','orb_dash','#f97316']
  ]},
  { id:'pads', name:'Pads', icon:'⌁', items:[
    ['pad_yellow','Yellow Pad','pad_yellow','#ffe600'],['pad_pink','Pink Pad','pad_pink','#ff4fd8'],
    ['pad_red','Red Pad','pad_red','#ef4444'],['pad_blue','Blue Pad','pad_blue','#38bdf8'],
    ['pad_green','Green Pad','pad_green','#22c55e'],['pad_black','Black Pad','pad_black','#334155']
  ]},
  { id:'portals', name:'Portals', icon:'◌', items:[
    ['portal_cube','Cube Portal','portal_cube','#80ed99'],['portal_ship','Ship Portal','portal_ship','#38bdf8'],
    ['portal_ball','Ball Portal','portal_extra','#f59e0b'],['portal_ufo','UFO Portal','portal_extra','#a78bfa'],
    ['portal_wave','Wave Portal','portal_extra','#22d3ee'],['portal_robot','Robot Portal','portal_extra','#fb923c'],
    ['portal_spider','Spider Portal','portal_extra','#f472b6'],['portal_gravity','Gravity Portal','portal_extra','#c084fc'],
    ['portal_mirror','Mirror Portal','portal_extra','#e2e8f0']
  ]},
  { id:'decorations', name:'Decorations', icon:'✦', items:[
    ['deco_star','Star','decoration','#fde68a'],['deco_crystal','Crystal','decoration','#67e8f9'],
    ['deco_ring','Ring','decoration','#c4b5fd'],['deco_arrow','Arrow','decoration','#fca5a5'],
    ['deco_spark','Spark','decoration','#fef08a'],['deco_triangle','Triangle','decoration','#fb7185'],
    ['deco_window','Window','decoration','#93c5fd'],['deco_chain','Chain','decoration','#cbd5e1'],
    ['deco_gear','Gear','decoration','#94a3b8'],['deco_flower','Flower','decoration','#f9a8d4']
  ]},
  { id:'effects', name:'Effects', icon:'✧', items:[
    ['effect_glow','Glow','decoration','#a5f3fc'],['effect_burst','Burst','decoration','#fef08a'],
    ['effect_flame','Flame','decoration','#fb923c'],['effect_portal_fx','Portal Effect','decoration','#c4b5fd'],
    ['effect_wave','Wave Effect','decoration','#67e8f9'],['effect_sparkle','Sparkle','decoration','#fff7ae']
  ]},
  { id:'structures', name:'Structures', icon:'▤', items:[
    ['saw','Saw','saw','#94a3b8'],['pillar','Pillar','pillar','#e2e8f0'],
    ['structure_wall','Wall','structure','#64748b'],['structure_column','Column','structure','#cbd5e1'],
    ['structure_arch','Arch','structure','#94a3b8'],['structure_chain','Chain','structure','#a1a1aa'],
    ['structure_gear','Gear','structure','#9ca3af'],['structure_spikeball','Spike Ball','saw','#64748b']
  ]},
  { id:'triggers', name:'Triggers', icon:'⚡', items:[
    ['trigger_move','Move Trigger','trigger','#38bdf8'],['trigger_pulse','Pulse Trigger','trigger','#f472b6'],
    ['trigger_scale','Scale Trigger','trigger','#a78bfa'],['trigger_color','Color Trigger','trigger','#22c55e'],
    ['trigger_speed','Speed Trigger','trigger','#facc15'],['trig_bg_purple','BG Color Trigger','legacy_trigger','#9b5de5'],
    ['trig_shake','Shake Trigger','legacy_trigger','#f15bb5'],['trig_low_grav','Low Gravity','legacy_trigger','#fee440'],
    ['trig_norm_grav','Normal Gravity','legacy_trigger','#9dff00']
  ]},
  { id:'other', name:'Other', icon:'◇', items:[
    ['coin','Coin','coin','#ffb703'],['checkpoint','Checkpoint','decoration','#4ade80'],
    ['finish_marker','Finish Marker','decoration','#34d399'],['text_sign','Text Sign','decoration','#e2e8f0']
  ]}
];

const ASSET_BY_ID = {};
EXTRA_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    ASSET_BY_ID[item[0]] = {
      id: item[0],
      label: item[1],
      type: item[2],
      color: item[3],
      category: cat.id
    };
  });
});

let activeCategory = 'blocks';
let selectedAssetId = 'block';
if (typeof editorSelectedItem === 'undefined') {
  var editorSelectedItem = 'block';
} else {
  editorSelectedItem = 'block';
}
let selectedObjects = [];
let selectedEditorObject = null;
let clipboardObjects = [];
let localUndoStack = [];
let localRedoStack = [];
let localHistoryLock = false;
let inspectorLock = false;
let dragState = null;
let snapEnabled = true;
const gridUnit = typeof BLOCK_SIZE !== 'undefined' ? BLOCK_SIZE : 44;
const scaleY = typeof EDITOR_SCALE_Y !== 'undefined' ? EDITOR_SCALE_Y : 1;
const groundY = typeof GROUND_Y !== 'undefined' ? GROUND_Y : 400;
const ceilingY = typeof CEILING_Y !== 'undefined' ? CEILING_Y : 60;
const portalW = typeof PORTAL_WIDTH !== 'undefined' ? PORTAL_WIDTH : 50;
const portalH = typeof PORTAL_HEIGHT !== 'undefined' ? PORTAL_HEIGHT : 90;

let gridLineStrength = 'normal';
let gridSettingsOpen = false;
let editorZoom = 1;

const zoomBuffer = document.createElement('canvas');
zoomBuffer.width = editorCanvas.width;
zoomBuffer.height = editorCanvas.height;
const zoomBufferCtx = zoomBuffer.getContext('2d');

function zoomOffsetX() {
  return (editorCanvas.width - editorCanvas.width * editorZoom) / 2;
}
function zoomOffsetY() {
  return (editorCanvas.height - editorCanvas.height * editorZoom) / 2;
}

let stageSettingsOpen = false;
let extraRuntimeObjects = [];
let runtimeEffects = [];
let lastFrameAt = 0;

function ensureDraftSchema(draft) {
  draft.decorations = Array.isArray(draft.decorations) ? draft.decorations : [];
  draft.structures = Array.isArray(draft.structures) ? draft.structures : [];
  draft.initialMode = draft.initialMode || 'cube';
  draft.initialSpeed = Number.isFinite(Number(draft.initialSpeed)) ? Number(draft.initialSpeed) : 1;
  draft.groups = Array.isArray(draft.groups) ? draft.groups : [];
  draft.triggers = Array.isArray(draft.triggers) ? draft.triggers : [];
  draft.decorations.forEach((o) => { if (!o.id) o.id = makeId(); });
  draft.structures.forEach((o) => { if (!o.id) o.id = makeId(); });
  draft.triggers.forEach((o) => { if (!o.id) o.id = makeId(); });
  return draft;
}

function makeId() {
  return 'obj_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}
function allEditorArrays(draft) {
  return ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures']
    .map((key) => ({ key, items: Array.isArray(draft[key]) ? draft[key] : [] }));
}
function objectCenter(obj) {
  let y = obj.y;
  if (y === undefined) {
    if (obj.cooldown !== undefined) y = groundY - 5;
    else if (obj.h !== undefined) y = groundY - (Number(obj.h) || 90) / 2;
    else if (obj.type) y = groundY - portalH / 2;
    else y = groundY - 45;
  }
  return { x: Number(obj.x) || 0, y: Number(y) };
}
function objectGroupList(obj) {
  if (Array.isArray(obj.groups)) return obj.groups.map(String);
  if (obj.group !== undefined && obj.group !== null && String(obj.group).trim()) return [String(obj.group)];
  return [];
}
function assignGroups(obj, value) {
  obj.groups = String(value || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10);
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
    ensureDraftSchema(editorDraft);
  } finally {
    localHistoryLock = false;
  }
  selectedObjects = [];
  selectedEditorObject = null;
  if (typeof syncStyleInputsFromDraft === 'function') syncStyleInputsFromDraft();
  if (typeof refreshInspector === 'function') refreshInspector();
  if (typeof renderEditorPalettes === 'function') renderEditorPalettes();
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
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

function addCategoryPanel() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-library')) return;
  bottom.querySelector('.editor-tabs')?.classList.add('hidden');
  ['editor-panel-assets','editor-panel-triggers','editor-panel-style'].forEach((id) => $(id)?.classList.add('hidden'));
  const panel = document.createElement('section');
  panel.id = 'editor-library';
  panel.innerHTML = '<div class="editor-library-head"><button id="editor-category-prev" type="button" aria-label="Categoria anterior">◀</button><div><small>CATEGORIA</small><strong id="editor-category-title">Blocks</strong></div><span id="editor-asset-count"></span><button id="editor-category-next" type="button" aria-label="Próxima categoria">▶</button></div><div class="editor-asset-grid"></div><div class="editor-selected-label" id="editor-selected-name">Selecione um objeto</div>';
  bottom.appendChild(panel);
  $('editor-category-prev').addEventListener('click', () => changeEditorCategory(-1));
  $('editor-category-next').addEventListener('click', () => changeEditorCategory(1));
  renderAssetLibrary();
}
function changeEditorCategory(direction) {
  const index = EXTRA_CATEGORIES.findIndex((c) => c.id === activeCategory);
  activeCategory = EXTRA_CATEGORIES[(index + direction + EXTRA_CATEGORIES.length) % EXTRA_CATEGORIES.length].id;
  renderAssetLibrary();
}
function activateEditorPanel(target) {
  const panel = $('editor-library');
  if (panel) panel.classList.toggle('hidden', target !== 'library');
}

function drawAssetThumb(ctx, item, size) {
  const c = item.color || '#38bdf8';
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.lineWidth = Math.max(1.5, size * 0.055);
  ctx.strokeStyle = '#06101e';
  ctx.fillStyle = c;
  const type = item.type;
  if (type === 'spike' || type === 'mini_spike' || item.id.indexOf('spike') >= 0) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.38, size * 0.32);
    ctx.lineTo(0, -size * 0.4);
    ctx.lineTo(size * 0.38, size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'orb_yellow' || type.indexOf('orb_') === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.31, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.19, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type.indexOf('pad_') === 0) {
    ctx.fillRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
    ctx.strokeRect(-size * 0.38, size * 0.15, size * 0.76, size * 0.2);
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, size * 0.1);
    ctx.lineTo(0, -size * 0.2);
    ctx.lineTo(size * 0.28, size * 0.1);
    ctx.stroke();
  } else if (type.indexOf('portal') === 0) {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.42, 0, 0, Math.PI * 2);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.13;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.14, size * 0.32, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (type === 'saw' || item.id.indexOf('gear') >= 0 || item.id.indexOf('chain') >= 0) {
    ctx.rotate(Math.PI / 8);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      const r = i % 2 ? size * 0.25 : size * 0.39;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1728';
    ctx.fill();
  } else if (type === 'trigger' || type === 'legacy_trigger') {
    ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
    ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (size * 0.3) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('T', 0, size * 0.1);
  } else if (type === 'block' || type === 'platform' || type === 'structure') {
    ctx.fillRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    ctx.strokeRect(-size * 0.36, -size * 0.36, size * 0.72, size * 0.72);
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.strokeRect(-size * 0.23, -size * 0.23, size * 0.46, size * 0.46);
  } else if (type === 'coin') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'decoration' && typeof drawDecorGraphic === 'function') {
    drawDecorGraphic(ctx, item.id.replace('structure_', ''), c, size * 0.34);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.38);
    ctx.lineTo(size * 0.34, 0);
    ctx.lineTo(0, size * 0.38);
    ctx.lineTo(-size * 0.34, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, 0);
    ctx.lineTo(size * 0.2, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function renderAssetLibrary() {
  const grid = editorRoot.querySelector('.editor-asset-grid');
  if (!grid) return;
  grid.replaceChildren();
  const cat = EXTRA_CATEGORIES.find((c) => c.id === activeCategory) || EXTRA_CATEGORIES[0];
  if ($('editor-category-title')) $('editor-category-title').textContent = cat.name;
  if ($('editor-asset-count')) $('editor-asset-count').textContent = cat.items.length + ' OBJETOS';
  cat.items.forEach((raw) => {
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
      if (typeof editorToolMode !== 'undefined') editorToolMode = 'place';
      if ($('editor-selected-name')) $('editor-selected-name').textContent = item.label;
      if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
      renderAssetLibrary();
      showEditorLibrary(true);
    });
    grid.appendChild(b);
  });
  if ($('editor-selected-name')) {
    $('editor-selected-name').textContent = (ASSET_BY_ID[selectedAssetId] || { label: 'Selecione um objeto' }).label;
  }
}
function showEditorLibrary(show) {
  const panel = $('editor-library');
  if (panel) panel.classList.toggle('hidden', !show);
}

let eraseGestureMode = 'click';
function addEditorCommandBar() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-tool-rail')) return;
  editorRoot.querySelector('.editor-top-center')?.classList.add('hidden');
  const rail = document.createElement('nav');
  rail.id = 'editor-tool-rail';
  rail.innerHTML = '<button type="button" data-tool="place" class="active"><b>＋</b><span>Colocar</span></button><button type="button" data-tool="select"><b>↖</b><span>Editar</span></button><button type="button" data-tool="erase"><b>⌫</b><span>Apagar</span></button>';
  editorRoot.appendChild(rail);
  rail.querySelectorAll('[data-tool]').forEach((b) => {
    b.addEventListener('click', () => {
      if (typeof editorToolMode !== 'undefined') editorToolMode = b.dataset.tool;
      rail.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('active', x === b));
      showEditorLibrary(b.dataset.tool === 'place');
      $('editor-delete-panel')?.classList.toggle('hidden', b.dataset.tool !== 'erase');
      $('editor-inspector')?.classList.toggle('editor-inspector-open', b.dataset.tool === 'select');
      if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
    });
  });

  const del = document.createElement('section');
  del.id = 'editor-delete-panel';
  del.className = 'hidden';
  del.innerHTML = '<strong>APAGAR OBJETOS</strong><div class="editor-delete-modes"><button type="button" data-erase="click" class="active">Clique</button><button type="button" data-erase="drag">Deslize</button></div><label class="editor-clear-slider"><span>Limpar fase</span><input id="editor-clear-swipe" type="range" min="0" max="100" value="0"><small>Deslize até o final para limpar tudo</small></label>';
  editorRoot.appendChild(del);
  del.querySelectorAll('[data-erase]').forEach((b) => {
    b.addEventListener('click', () => {
      eraseGestureMode = b.dataset.erase;
      del.querySelectorAll('[data-erase]').forEach((x) => x.classList.toggle('active', x === b));
    });
  });
  $('editor-clear-swipe')?.addEventListener('input', (e) => {
    if (Number(e.target.value) < 98) return;
    recordHistory();
    ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'].forEach((k) => {
      editorDraft[k] = [];
    });
    selectedObjects = [];
    selectedEditorObject = null;
    updateAutoFinish();
    refreshInspector();
    if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
    e.target.value = 0;
  });

  if (typeof openStageSettings === 'function') {
    const settings = document.createElement('button');
    settings.id = 'editor-level-settings-open';
    settings.type = 'button';
    settings.textContent = '⚙';
    settings.title = 'Configurações da fase';
    settings.addEventListener('click', openStageSettings);
    top.querySelector('.editor-top-right')?.prepend(settings);
  }
  $('editor-undo-btn')?.addEventListener('click', undoLocalEditor);
  $('editor-redo-btn')?.addEventListener('click', redoLocalEditor);
}

function addGridSettings() {
  const top = editorRoot.querySelector('.editor-topbar');
  if (!top || $('editor-grid-settings-open')) return;
  const button = document.createElement('button');
  button.id = 'editor-grid-settings-open';
  button.type = 'button';
  button.textContent = '▦';
  button.title = 'Configurações da grade';
  button.setAttribute('aria-label', 'Configurações da grade');
  top.querySelector('.editor-top-right')?.prepend(button);

  const panel = document.createElement('section');
  panel.id = 'editor-grid-settings-panel';
  panel.className = 'hidden';
  panel.innerHTML = '<div class="grid-settings-head"><strong>GRADE DO EDITOR</strong><button type="button" id="editor-grid-settings-close" aria-label="Fechar">×</button></div><div class="grid-settings-cell"><span>Tamanho da célula</span><b>44 × 44 px · 1 CUBO</b><small>Fixo para manter o alinhamento idêntico ao jogo.</small></div><label class="grid-settings-option"><input id="grid-setting-visible" type="checkbox" checked><span>Mostrar grade</span></label><label class="grid-settings-option"><input id="grid-setting-snap" type="checkbox" checked disabled><span>Encaixe 1×1 obrigatório</span></label><label class="grid-settings-option"><span>Contraste das linhas</span><select id="grid-setting-strength"><option value="soft">Suave</option><option value="normal" selected>Normal</option><option value="strong">Forte</option></select></label>';
  editorRoot.appendChild(panel);

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('gd-editor-grid-settings') || '{}'); }
    catch (_) { return {}; }
  })();
  if (typeof editorShowGrid !== 'undefined') editorShowGrid = saved.visible !== false;
  snapEnabled = true;
  gridLineStrength = ['soft', 'normal', 'strong'].includes(saved.strength) ? saved.strength : 'normal';
  if ($('grid-setting-visible')) $('grid-setting-visible').checked = typeof editorShowGrid !== 'undefined' ? editorShowGrid : true;
  if ($('grid-setting-snap')) $('grid-setting-snap').checked = true;
  if ($('grid-setting-strength')) $('grid-setting-strength').value = gridLineStrength;

  const save = () => {
    try {
      localStorage.setItem('gd-editor-grid-settings', JSON.stringify({
        visible: typeof editorShowGrid !== 'undefined' ? editorShowGrid : true,
        snap: snapEnabled,
        strength: gridLineStrength
      }));
    } catch (_) {}
    if (typeof syncEditorToolButtons === 'function') syncEditorToolButtons();
    if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  };

  button.addEventListener('click', () => {
    gridSettingsOpen = !gridSettingsOpen;
    panel.classList.toggle('hidden', !gridSettingsOpen);
  });
  $('editor-grid-settings-close')?.addEventListener('click', () => {
    gridSettingsOpen = false;
    panel.classList.add('hidden');
  });
  $('grid-setting-visible')?.addEventListener('change', (ev) => {
    if (typeof editorShowGrid !== 'undefined') editorShowGrid = ev.target.checked;
    save();
  });
  $('grid-setting-snap')?.addEventListener('change', () => {
    snapEnabled = true;
    if ($('grid-setting-snap')) $('grid-setting-snap').checked = true;
    save();
  });
  $('grid-setting-strength')?.addEventListener('change', (ev) => {
    gridLineStrength = ev.target.value;
    save();
  });
}

function addInspector() {
  const bottom = editorRoot.querySelector('.editor-bottom-panel');
  if (!bottom || $('editor-inspector')) return;
  const panel = document.createElement('aside');
  panel.id = 'editor-inspector';
  panel.innerHTML = '<div class="editor-inspector-title">OBJECT INSPECTOR <span id="editor-selection-count">0 selected</span></div><div class="editor-inspector-fields"><label>X<input id="inspect-x" type="number" step="1"></label><label>Y<input id="inspect-y" type="number" step="1"></label><label>ROTATION<input id="inspect-rotation" type="number" step="1" value="0"></label><label>SCALE %<input id="inspect-scale" type="number" min="10" max="500" step="5" value="100"></label><label class="group-field">GROUPS<input id="inspect-groups" type="text" placeholder="Ex.: 1, 2, 10"></label><button id="inspect-apply-btn" type="button">APPLY</button></div>';
  editorRoot.appendChild(panel);
  panel.classList.add('editor-inspector-floating');
  $('inspect-apply-btn')?.addEventListener('click', applyInspector);
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach((id) => {
    $(id)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyInspector(); });
  });
}

function getSelectionRecords() {
  return selectedObjects.map((sel) => ({ key: sel.key, obj: sel.obj })).filter((s) => (editorDraft[s.key] || []).includes(s.obj));
}
function setSelection(records) {
  selectedObjects = records.slice();
  selectedEditorObject = selectedObjects.length ? selectedObjects[selectedObjects.length - 1] : null;
  refreshInspector();
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
}
function refreshInspector() {
  const records = getSelectionRecords();
  const first = records[0];
  if ($('editor-selection-count')) $('editor-selection-count').textContent = records.length + ' selected';
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach((id) => {
    if ($(id)) $(id).disabled = !first;
  });
  if (!first) return;
  inspectorLock = true;
  if ($('inspect-x')) $('inspect-x').value = Math.round(first.obj.x || 0);
  if ($('inspect-y')) $('inspect-y').value = Math.round(first.obj.y === undefined ? groundY - 45 : first.obj.y);
  if ($('inspect-rotation')) $('inspect-rotation').value = Math.round(((first.obj.rotation || 0) * 180) / Math.PI);
  if ($('inspect-scale')) $('inspect-scale').value = Math.round((first.obj.scale || 1) * 100);
  if ($('inspect-groups')) $('inspect-groups').value = objectGroupList(first.obj).join(', ');
  inspectorLock = false;
}
function applyInspector() {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  const x = Number($('inspect-x')?.value);
  const y = Number($('inspect-y')?.value);
  const rot = Number($('inspect-rotation')?.value);
  const scale = Number($('inspect-scale')?.value) / 100;
  const first = records[0].obj;
  const dx = Number.isFinite(x) ? x - (first.x || 0) : 0;
  const dy = Number.isFinite(y) ? y - (first.y === undefined ? groundY - 45 : first.y) : 0;
  records.forEach((s) => {
    if (Number.isFinite(x)) s.obj.x = Math.round(((s.obj.x || 0) + dx) / (gridUnit / 2)) * (gridUnit / 2);
    if (Number.isFinite(y)) s.obj.y = Math.round(((s.obj.y === undefined ? groundY - 45 : s.obj.y) + dy) / (gridUnit / scaleY)) * (gridUnit / scaleY);
    if (Number.isFinite(rot)) s.obj.rotation = (rot * Math.PI) / 180;
    if (Number.isFinite(scale)) applyObjectScale(s.obj, Math.max(0.1, Math.min(5, scale)));
    if ($('inspect-groups')) assignGroups(s.obj, $('inspect-groups').value);
  });
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
}
function applyObjectScale(obj, scale) {
  obj.scale = scale;
  if (obj.w !== undefined) { if (obj._baseW === undefined) obj._baseW = obj.w; obj.w = obj._baseW * scale; }
  if (obj.h !== undefined) { if (obj._baseH === undefined) obj._baseH = obj.h; obj.h = obj._baseH * scale; }
  if (obj.r !== undefined) { if (obj._baseR === undefined) obj._baseR = obj.r; obj.r = obj._baseR * scale; }
  if (obj.radius !== undefined) { if (obj._baseRadius === undefined) obj._baseRadius = obj.radius; obj.radius = obj._baseRadius * scale; }
  if (obj.width !== undefined) { if (obj._baseWidth === undefined) obj._baseWidth = obj.width; obj.width = obj._baseWidth * scale; }
  if (obj.cooldown !== undefined) {
    if (obj._baseWidth === undefined) obj._baseWidth = 36;
    if (obj._baseHeight === undefined) obj._baseHeight = 11;
    obj.width = obj._baseWidth * scale;
    obj.height = obj._baseHeight * scale;
  }
  if (obj.used !== undefined && obj.color) { if (obj._baseRadius === undefined) obj._baseRadius = 17; obj.radius = obj._baseRadius * scale; }
  if (obj.collected !== undefined) { if (obj._baseRadius === undefined) obj._baseRadius = 13; obj.radius = obj._baseRadius * scale; }
  if (obj.type) {
    if (obj._baseWidth === undefined) obj._baseWidth = portalW;
    if (obj._baseHeight === undefined) obj._baseHeight = portalH;
    obj.width = obj._baseWidth * scale;
    obj.height = obj._baseHeight * scale;
  }
  if (obj.height !== undefined) { if (obj._baseHeight === undefined) obj._baseHeight = obj.height; obj.height = obj._baseHeight * scale; }
}
function transformSelection(fn) {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  records.forEach((s) => fn(s.obj));
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  refreshInspector();
}
function duplicateSelection() {
  const records = getSelectionRecords();
  if (!records.length) return;
  recordHistory();
  const next = [];
  records.forEach((s) => {
    const clone = deepClone(s.obj);
    clone.id = makeId();
    clone.x = (clone.x || 0) + gridUnit;
    clone.y = clone.y === undefined ? groundY - 45 : clone.y;
    editorDraft[s.key].push(clone);
    next.push({ key: s.key, obj: clone });
  });
  setSelection(next);
}
function findObjectAt(point) {
  let found = null;
  let best = Infinity;
  allEditorArrays(editorDraft).forEach((group) => {
    group.items.forEach((obj) => {
      const p = objectCenter(obj);
      const dist = Math.hypot(point.x - p.x, point.y - p.y);
      const radius = Math.max(30, (obj.w || obj.r || 40) * (obj.scale || 1) * 0.65);
      if (dist < radius && dist < best) {
        best = dist;
        found = { key: group.key, obj };
      }
    });
  });
  return found;
}
function addAssetAtWorld(x, y) {
  const item = ASSET_BY_ID[selectedAssetId];
  if (!item) return false;
  const maxX = (editorDraft.finishX || 4000) - 80;
  const base = { id: makeId(), x: Math.max(240, Math.min(maxX, x)), y, rotation: 0, scale: 1, groups: [] };
  const color = selectedAssetId.replace(/^orb_|^pad_/, '');
  if (item.type === 'spike' || item.type === 'mini_spike' || item.type === 'ceil_spike') {
    editorDraft.spikes.push({
      x: base.x,
      y: item.type === 'ceil_spike' ? ceilingY : groundY,
      sizeType: item.type === 'mini_spike' ? 'mini' : 'normal',
      inverted: item.type === 'ceil_spike',
      groups: []
    });
  } else if (item.type === 'block') {
    if (selectedAssetId === 'platform') editorDraft.platforms.push({ x: base.x, y: Math.min(groundY - 36, y), w: gridUnit, h: 26, groups: [] });
    else editorDraft.blocks.push({ x: base.x, y: Math.min(groundY - gridUnit, Math.max(ceilingY, y)), w: gridUnit, h: gridUnit, groups: [] });
  } else if (item.type.indexOf('orb_') === 0) {
    editorDraft.orbs.push({ x: base.x, y: Math.min(groundY - 30, y), color, used: false, groups: [] });
  } else if (item.type.indexOf('pad_') === 0) {
    editorDraft.pads.push({ x: base.x, color, cooldown: 0, groups: [] });
  } else if (item.type === 'portal_cube' || item.type === 'portal_ship') {
    editorDraft.portals.push({ x: base.x, type: item.type === 'portal_cube' ? 'cube' : 'ship', triggered: false, groups: [] });
  } else if (item.type === 'portal_extra') {
    editorDraft.portals.push({ x: base.x, type: selectedAssetId.replace('portal_', ''), triggered: false, groups: [] });
  } else if (item.type === 'saw') {
    editorDraft.saws.push({ x: base.x, y: Math.min(groundY - 30, y), r: 22, angle: 0, groups: [] });
  } else if (item.type === 'pillar') {
    editorDraft.pillars.push({ x: base.x, h: 90, w: 34, groups: [] });
  } else if (item.type === 'coin') {
    editorDraft.coins.push({ x: base.x, y: Math.min(groundY - 30, y), collected: false, groups: [] });
  } else if (item.type === 'trigger' || item.type === 'legacy_trigger') {
    const kindMap = {
      trigger_move: 'move', trigger_pulse: 'pulse', trigger_scale: 'scale',
      trigger_color: 'color', trigger_speed: 'speed', trig_bg_purple: 'bg',
      trig_shake: 'shake', trig_low_grav: 'low_grav', trig_norm_grav: 'norm_grav'
    };
    const kind = kindMap[selectedAssetId];
    if (!kind) return false;
    editorDraft.triggers.push({
      id: makeId(), x: base.x, y: Math.min(groundY - 20, Math.max(ceilingY, y)),
      kind, group: '1', duration: 1, intensity: 1, distance: 120, scale: 1.5,
      color: '#00e5ff', speedMultiplier: 1, customSpeed: 1, triggered: false
    });
  } else if (item.type === 'structure') {
    editorDraft.structures.push(Object.assign(base, { kind: selectedAssetId.replace('structure_', ''), color: item.color, gameplay: false }));
  } else {
    editorDraft.decorations.push(Object.assign(base, { kind: selectedAssetId, color: item.color, gameplay: false }));
  }
  updateAutoFinish();
  if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  return true;
}

if (typeof placeSelectedAtWorldCoord === 'function') {
  const oldPlace = placeSelectedAtWorldCoord;
  placeSelectedAtWorldCoord = function (x, y) {
    recordHistory();
    if (ASSET_BY_ID[selectedAssetId] && !['spike','mini_spike','ceil_spike','platform','block','pad_yellow','pad_pink','orb_yellow','orb_pink','saw','pillar','coin','portal_ship','portal_cube','trig_speed_fast','trig_speed_norm','trig_bg_purple','trig_shake','trig_low_grav','trig_norm_grav'].includes(selectedAssetId)) {
      addAssetAtWorld(x, y);
      updateAutoFinish();
      if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
      return;
    }
    oldPlace.call(this, x, y);
    updateAutoFinish();
    if (typeof drawEditorCanvas === 'function') drawEditorCanvas();
  };
}

let lastEditorDragPoint = null;
if (typeof editAtEditorPointer === 'function') {
  const oldEditAtPointer = editAtEditorPointer;
  editAtEditorPointer = function (pointerEvent) {
    const point = getEditorWorldCoords(pointerEvent);
    if (typeof expandEditorLevelIfNeeded === 'function') expandEditorLevelIfNeeded(point.x);
    if (typeof editorToolMode !== 'undefined' && editorToolMode === 'erase') {
      if (!lastEditorDragPoint) recordHistory();
      if (eraseGestureMode === 'click' && lastEditorDragPoint) {
        lastEditorDragPoint = point;
        return;
      }
      if (!lastEditorDragPoint) {
        eraseAtWorldCoord(point.x, point.y);
      } else {
        const dx = point.x - lastEditorDragPoint.x;
        const dy = point.y - lastEditorDragPoint.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / gridUnit));
        for (let i = 1; i <= steps; i++) {
          eraseAtWorldCoord(lastEditorDragPoint.x + (dx * i) / steps, lastEditorDragPoint.y + (dy * i) / steps);
        }
      }
    } else if (typeof editorToolMode !== 'undefined' && editorToolMode === 'place' && editorSelectedItem !== 'platform') {
      if (!lastEditorDragPoint) {
        placeSelectedAtWorldCoord(point.x, point.y);
      } else {
        const dx = point.x - lastEditorDragPoint.x;
        const dy = point.y - lastEditorDragPoint.y;
        const dist = Math.hypot(dx, dy * scaleY);
        if (dist >= gridUnit * 0.65) {
          const steps = Math.max(1, Math.ceil(dist / gridUnit));
          for (let i = 1; i <= steps; i++) {
            let x = lastEditorDragPoint.x + (dx * i) / steps;
            let y = lastEditorDragPoint.y + (dy * i) / steps;
            if (snapEnabled) {
              x = Math.round(x / gridUnit) * gridUnit;
              y = Math.round(y / (gridUnit / scaleY)) * (gridUnit / scaleY);
            }
            placeSelectedAtWorldCoord(x, y);
          }
        }
      }
    }
    lastEditorDragPoint = point;
  };
}

if (typeof eraseAtWorldCoord === 'function') {
  const oldErase = eraseAtWorldCoord;
  eraseAtWorldCoord = function (x, y) {
    oldErase(x, y);
    ['decorations', 'structures'].forEach((key) => {
      editorDraft[key] = (editorDraft[key] || []).filter((o) => Math.hypot((o.x || 0) - x, (o.y || 0) - y) > Math.max(24, (o.scale || 1) * 28));
    });
    updateAutoFinish();
  };
}

getEditorWorldCoords = function (e, fineEdit = false) {
  const rect = editorCanvas.getBoundingClientRect();
  const sx = editorCanvas.width / Math.max(1, rect.width);
  const sy = editorCanvas.height / Math.max(1, rect.height);
  const rawX = (e.clientX - rect.left) * sx;
  const rawY = (e.clientY - rect.top) * sy;
  const logicalX = (rawX - zoomOffsetX()) / editorZoom;
  const logicalY = (rawY - zoomOffsetY()) / editorZoom;
  const scrollX = typeof editorScrollX !== 'undefined' ? editorScrollX : 0;
  let x = logicalX + scrollX - 80;
  let y = logicalY / scaleY;
  const step = fineEdit ? gridUnit / 2 : gridUnit;
  x = Math.round(x / step) * step;
  y = Math.round(y / (step / scaleY)) * (step / scaleY);
  return { x, y };
};

function updateAutoFinish() {
  const keys = ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'];
  let farthest = 0;
  keys.forEach((k) => {
    (editorDraft[k] || []).forEach((o) => {
      const right = (Number(o.x) || 0) + (Number(o.w || o.width) || 0);
      farthest = Math.max(farthest, right);
    });
  });
  const next = Math.max(gridUnit * 10, Math.ceil((farthest + gridUnit * 10) / gridUnit) * gridUnit);
  editorDraft.finishX = next;
  const input = $('style-finish-x');
  const label = $('style-finish-label');
  if (input) {
    input.max = String(Math.max(next + 10000, Number(input.max) || 0));
    input.value = String(next);
  }
  if (label) label.textContent = String(next);
}

const eCtx = editorCanvas.getContext('2d');
if (typeof drawEditorCanvas === 'function') {
  const oldDrawEditor = drawEditorCanvas;
  drawEditorCanvas = function () {
    if (typeof gameState !== 'undefined' && gameState !== 'EDITOR') {
      oldDrawEditor();
      return;
    }
    eCtx.setTransform(1, 0, 0, 1, 0, 0);
    eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    const show = typeof editorShowGrid !== 'undefined' ? editorShowGrid : true;
    if (typeof editorShowGrid !== 'undefined') editorShowGrid = false;
    oldDrawEditor();
    if (typeof editorShowGrid !== 'undefined') editorShowGrid = show;

    if (editorZoom !== 1) {
      zoomBufferCtx.clearRect(0, 0, zoomBuffer.width, zoomBuffer.height);
      zoomBufferCtx.drawImage(editorCanvas, 0, 0);
      eCtx.setTransform(1, 0, 0, 1, 0, 0);
      eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
      eCtx.drawImage(zoomBuffer, zoomOffsetX(), zoomOffsetY(), editorCanvas.width * editorZoom, editorCanvas.height * editorZoom);
    }

    eCtx.save();
    eCtx.translate(zoomOffsetX(), zoomOffsetY());
    eCtx.scale(editorZoom, editorZoom);
    if (show) {
      const alpha = gridLineStrength === 'strong'
        ? { minor: 0.2, major: 0.38 }
        : gridLineStrength === 'soft'
          ? { minor: 0.05, major: 0.12 }
          : { minor: 0.11, major: 0.22 };
      const scrollX = typeof editorScrollX !== 'undefined' ? editorScrollX : 0;
      const startX = Math.floor((scrollX - 80) / gridUnit) * gridUnit;
      const endX = startX + editorCanvas.width / editorZoom + gridUnit * 2;
      eCtx.lineWidth = 1;
      for (let gx = startX; gx <= endX; gx += gridUnit) {
        const sx = gx - scrollX + 80;
        const isMajor = Math.round(gx / gridUnit) % 4 === 0;
        eCtx.strokeStyle = `rgba(255,255,255,${isMajor ? alpha.major : alpha.minor})`;
        eCtx.beginPath();
        eCtx.moveTo(sx, 0);
        eCtx.lineTo(sx, editorCanvas.height / editorZoom);
        eCtx.stroke();
      }
      for (let gy = 0; gy <= editorCanvas.height / editorZoom; gy += gridUnit) {
        const isMajor = Math.round(gy / gridUnit) % 4 === 0;
        eCtx.strokeStyle = `rgba(255,255,255,${isMajor ? alpha.major : alpha.minor})`;
        eCtx.beginPath();
        eCtx.moveTo(0, gy);
        eCtx.lineTo(editorCanvas.width / editorZoom, gy);
        eCtx.stroke();
      }
    }
    eCtx.restore();
  };
}

ensureDraftSchema(editorDraft);
addCategoryPanel();
addEditorCommandBar();
addGridSettings();
addInspector();
})();/* Geometry Dash Web — Editor Expansion 2.0
- Additive editor layer: categorized asset library, inspector, transforms,
- groups, stage settings, precise grid and configurable runtime triggers.
 */
(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const editorRoot = $('level-editor');
if (!editorRoot || typeof editorDraft === 'undefined') return;

const EXTRA_CATEGORIES = [
  { id:'blocks', name:'Blocks', icon:'▦', items:[
    ['block','Block','block','#4cc9f0'],['platform','Platform','platform','#00e5ff'],
    ['half_block','Half Block','decoration','#38bdf8'],['slope','Slope','decoration','#60a5fa'],
    ['double_block','Double Block','decoration','#2563eb'],['outlined_block','Outlined Block','decoration','#93c5fd']
  ]},
  { id:'spikes', name:'Spikes', icon:'▲', items:[
    ['spike','Spike','spike','#ff595e'],['mini_spike','Mini Spike','mini_spike','#ff924c'],
    ['ceil_spike','Ceiling Spike','ceil_spike','#d62828'],['double_spike','Double Spike','decoration','#fb7185'],
    ['wide_spike','Wide Spike','decoration','#e11d48'],['saw_spike','Saw Spike','decoration','#be123c']
  ]},
  { id:'orbs', name:'Orbs', icon:'◉', items:[
    ['orb_yellow','Yellow Orb','orb_yellow','#ffd60a'],['orb_pink','Pink Orb','orb_pink','#f72585'],
    ['orb_blue','Blue Orb','orb_blue','#38bdf8'],['orb_red','Red Orb','orb_red','#ef4444'],
    ['orb_green','Green Orb','orb_green','#22c55e'],['orb_black','Black Orb','orb_black','#334155'],
    ['orb_purple','Purple Orb','orb_purple','#a855f7'],['orb_cyan','Cyan Orb','orb_cyan','#06b6d4'],
    ['orb_dash','Dash Orb','orb_dash','#f97316']
  ]},
  { id:'pads', name:'Pads', icon:'⌁', items:[
    ['pad_yellow','Yellow Pad','pad_yellow','#ffe600'],['pad_pink','Pink Pad','pad_pink','#ff4fd8'],
    ['pad_red','Red Pad','pad_red','#ef4444'],['pad_blue','Blue Pad','pad_blue','#38bdf8'],
    ['pad_green','Green Pad','pad_green','#22c55e'],['pad_black','Black Pad','pad_black','#334155']
  ]},
  { id:'portals', name:'Portals', icon:'◌', items:[
    ['portal_cube','Cube Portal','portal_cube','#80ed99'],['portal_ship','Ship Portal','portal_ship','#38bdf8'],
    ['portal_ball','Ball Portal','portal_extra','#f59e0b'],['portal_ufo','UFO Portal','portal_extra','#a78bfa'],
    ['portal_wave','Wave Portal','portal_extra','#22d3ee'],['portal_robot','Robot Portal','portal_extra','#fb923c'],
    ['portal_spider','Spider Portal','portal_extra','#f472b6'],['portal_gravity','Gravity Portal','portal_extra','#c084fc'],
    ['portal_mirror','Mirror Portal','portal_extra','#e2e8f0']
  ]},
  { id:'decorations', name:'Decorations', icon:'✦', items:[
    ['deco_star','Star','decoration','#fde68a'],['deco_crystal','Crystal','decoration','#67e8f9'],
    ['deco_ring','Ring','decoration','#c4b5fd'],['deco_arrow','Arrow','decoration','#fca5a5'],
    ['deco_spark','Spark','decoration','#fef08a'],['deco_triangle','Triangle','decoration','#fb7185'],
    ['deco_window','Window','decoration','#93c5fd'],['deco_chain','Chain','decoration','#cbd5e1'],
    ['deco_gear','Gear','decoration','#94a3b8'],['deco_flower','Flower','decoration','#f9a8d4']
  ]},
  { id:'effects', name:'Effects', icon:'✧', items:[
    ['effect_glow','Glow','decoration','#a5f3fc'],['effect_burst','Burst','decoration','#fef08a'],
    ['effect_flame','Flame','decoration','#fb923c'],['effect_portal_fx','Portal Effect','decoration','#c4b5fd'],
    ['effect_wave','Wave Effect','decoration','#67e8f9'],['effect_sparkle','Sparkle','decoration','#fff7ae']
  ]},
  { id:'structures', name:'Structures', icon:'▤', items:[
    ['saw','Saw','saw','#94a3b8'],['pillar','Pillar','pillar','#e2e8f0'],
    ['structure_wall','Wall','structure','#64748b'],['structure_column','Column','structure','#cbd5e1'],
    ['structure_arch','Arch','structure','#94a3b8'],['structure_chain','Chain','structure','#a1a1aa'],
    ['structure_gear','Gear','structure','#9ca3af'],['structure_spikeball','Spike Ball','saw','#64748b']
  ]},
  { id:'triggers', name:'Triggers', icon:'⚡', items:[
    ['trigger_move','Move Trigger','trigger','#38bdf8'],['trigger_pulse','Pulse Trigger','trigger','#f472b6'],
    ['trigger_scale','Scale Trigger','trigger','#a78bfa'],['trigger_color','Color Trigger','trigger','#22c55e'],
    ['trigger_speed','Speed Trigger','trigger','#facc15'],['trig_bg_purple','BG Color Trigger','legacy_trigger','#9b5de5'],
    ['trig_shake','Shake Trigger','legacy_trigger','#f15bb5'],['trig_low_grav','Low Gravity','legacy_trigger','#fee440'],
    ['trig_norm_grav','Normal Gravity','legacy_trigger','#9dff00']
  ]},
  { id:'other', name:'Other', icon:'◇', items:[
    ['coin','Coin','coin','#ffb703'],['checkpoint','Checkpoint','decoration','#4ade80'],
    ['finish_marker','Finish Marker','decoration','#34d399'],['text_sign','Text Sign','decoration','#e2e8f0']
  ]}
];
const ASSET_BY_ID = {};
EXTRA_CATEGORIES.forEach(cat => cat.items.forEach(item => ASSET_BY_ID[item[0]] = {id:item[0],label:item[1],type:item[2],color:item[3],category:cat.id}));

let activeCategory = 'blocks';
let selectedAssetId = 'block';editorSelectedItem='block';
let selectedObjects = [];
let selectedEditorObject = null;
let clipboardObjects = [];
let localUndoStack=[];
let localRedoStack=[];
let localHistoryLock=false;
let inspectorLock = false;
let dragState = null;
let snapEnabled = true;
const gridUnit = BLOCK_SIZE;
let gridLineStrength = 'normal';
let gridSettingsOpen = false;
let editorZoom = 1;
const zoomBuffer=document.createElement('canvas');zoomBuffer.width=editorCanvas.width;zoomBuffer.height=editorCanvas.height;
const zoomBufferCtx=zoomBuffer.getContext('2d');
function zoomOffsetX(){return (editorCanvas.width-editorCanvas.width*editorZoom)/2;}
function zoomOffsetY(){return (editorCanvas.height-editorCanvas.height*editorZoom)/2;}
let stageSettingsOpen = false;
let extraRuntimeObjects = [];
let runtimeEffects = [];
let lastFrameAt = 0;

function ensureDraftSchema(draft) {
  draft.decorations = Array.isArray(draft.decorations) ? draft.decorations : [];
  draft.structures = Array.isArray(draft.structures) ? draft.structures : [];
  draft.initialMode = draft.initialMode || 'cube';
  draft.initialSpeed = Number.isFinite(Number(draft.initialSpeed)) ? Number(draft.initialSpeed) : 1;
  draft.groups = Array.isArray(draft.groups) ? draft.groups : [];
  draft.triggers = Array.isArray(draft.triggers) ? draft.triggers : [];
  draft.decorations.forEach(o => { if (!o.id) o.id = makeId(); });
  draft.structures.forEach(o => { if (!o.id) o.id = makeId(); });
  draft.triggers.forEach(o => { if (!o.id) o.id = makeId(); });
  return draft;
}
function makeId() { return 'obj_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
function deepClone(v) { return JSON.parse(JSON.stringify(v)); }
function allEditorArrays(draft) {
  return ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures']
    .map(key => ({key,items:Array.isArray(draft[key])?draft[key]:[]}));
}
function objectCenter(obj) {
  let y=obj.y;
  if(y===undefined){
    if(obj.cooldown!==undefined)y=GROUND_Y-5;
    else if(obj.h!==undefined)y=GROUND_Y-(Number(obj.h)||90)/2;
    else if(obj.type)y=GROUND_Y-PORTAL_HEIGHT/2;
    else y=GROUND_Y-45;
  }
  return {x:Number(obj.x)||0,y:Number(y)};
}
function objectGroupList(obj) {
  if (Array.isArray(obj.groups)) return obj.groups.map(String);
  if (obj.group !== undefined && obj.group !== null && String(obj.group).trim()) return [String(obj.group)];
  return [];
}
function assignGroups(obj, value) {
  obj.groups = String(value||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,10);
  delete obj.group;
}
function recordHistory() {
  if(localHistoryLock||!editorDraft)return;
  localUndoStack.push(JSON.stringify(editorDraft));
  if(localUndoStack.length>80)localUndoStack.shift();
  localRedoStack.length=0;
}
function restoreLocalSnapshot(raw) {
  if(!raw)return;
  localHistoryLock=true;
  try{editorDraft=JSON.parse(raw);ensureDraftSchema(editorDraft);}finally{localHistoryLock=false;}
  selectedObjects=[];selectedEditorObject=null;
  syncStyleInputsFromDraft();refreshInspector();renderEditorPalettes();drawEditorCanvas();
}
function undoLocalEditor() {
  if(!localUndoStack.length)return;
  localRedoStack.push(JSON.stringify(editorDraft));restoreLocalSnapshot(localUndoStack.pop());
}
function redoLocalEditor() {
  if(!localRedoStack.length)return;
  localUndoStack.push(JSON.stringify(editorDraft));restoreLocalSnapshot(localRedoStack.pop());
}
function addCategoryPanel() {
  const bottom=editorRoot.querySelector('.editor-bottom-panel');
  if(!bottom||$('editor-library'))return;
  bottom.querySelector('.editor-tabs')?.classList.add('hidden');
  ['editor-panel-assets','editor-panel-triggers','editor-panel-style'].forEach(id=>$(id)?.classList.add('hidden'));
  const panel=document.createElement('section');
  panel.id='editor-library';
  panel.innerHTML='<div class="editor-library-head"><button id="editor-category-prev" type="button" aria-label="Categoria anterior">◀</button><div><small>CATEGORIA</small><strong id="editor-category-title">Blocks</strong></div><span id="editor-asset-count"></span><button id="editor-category-next" type="button" aria-label="Próxima categoria">▶</button></div><div class="editor-asset-grid"></div><div class="editor-selected-label" id="editor-selected-name">Selecione um objeto</div>';
  bottom.appendChild(panel);
  $('editor-category-prev').addEventListener('click',()=>changeEditorCategory(-1));
  $('editor-category-next').addEventListener('click',()=>changeEditorCategory(1));
  renderAssetLibrary();
}
function changeEditorCategory(direction){
  const index=EXTRA_CATEGORIES.findIndex(c=>c.id===activeCategory);
  activeCategory=EXTRA_CATEGORIES[(index+direction+EXTRA_CATEGORIES.length)%EXTRA_CATEGORIES.length].id;
  renderAssetLibrary();
}
function activateEditorPanel(target){
  const panel=$('editor-library');
  if(panel)panel.classList.toggle('hidden',target!=='library');
}
function drawAssetThumb(ctx,item,size) {
  const c=item.color||'#38bdf8';ctx.save();ctx.translate(size/2,size/2);
  ctx.lineWidth=Math.max(1.5,size*.055);ctx.strokeStyle='#06101e';ctx.fillStyle=c;
  const type=item.type;
  if(type==='spike'||type==='mini_spike'||item.id.indexOf('spike')>=0){
    ctx.beginPath();ctx.moveTo(-size*.38,size*.32);ctx.lineTo(0,-size*.4);ctx.lineTo(size*.38,size*.32);ctx.closePath();ctx.fill();ctx.stroke();
  } else if(type==='orb_yellow'||type.indexOf('orb_')===0){
    ctx.beginPath();ctx.arc(0,0,size*.31,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,size*.19,0,Math.PI*2);ctx.stroke();
  } else if(type.indexOf('pad_')===0){
    ctx.fillRect(-size*.38,size*.15,size*.76,size*.2);ctx.strokeRect(-size*.38,size*.15,size*.76,size*.2);
    ctx.beginPath();ctx.moveTo(-size*.28,size*.1);ctx.lineTo(0,-size*.2);ctx.lineTo(size*.28,size*.1);ctx.stroke();
  } else if(type.indexOf('portal')===0){
    ctx.beginPath();ctx.ellipse(0,0,size*.25,size*.42,0,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=size*.13;ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,size*.14,size*.32,0,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
  } else if(type==='saw'||item.id.indexOf('gear')>=0||item.id.indexOf('chain')>=0){
    ctx.rotate(Math.PI/8);ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?size*.25:size*.39;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,size*.1,0,Math.PI*2);ctx.fillStyle='#0b1728';ctx.fill();
  } else if(type==='trigger'||type==='legacy_trigger'){
    ctx.fillRect(-size*.25,-size*.35,size*.5,size*.7);ctx.strokeRect(-size*.25,-size*.35,size*.5,size*.7);
    ctx.fillStyle='#fff';ctx.font='bold '+(size*.3)+'px sans-serif';ctx.textAlign='center';ctx.fillText('T',0,size*.1);
  } else if(type==='block'||type==='platform'||type==='structure'){
    ctx.fillRect(-size*.36,-size*.36,size*.72,size*.72);ctx.strokeRect(-size*.36,-size*.36,size*.72,size*.72);
    ctx.strokeStyle='rgba(255,255,255,.65)';ctx.strokeRect(-size*.23,-size*.23,size*.46,size*.46);
  } else if(type==='coin'){
    ctx.beginPath();ctx.ellipse(0,0,size*.2,size*.34,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  } else if(type==='decoration'||type==='structure'){
    drawDecorGraphic(ctx,item.id.replace('structure_',''),c,size*.34);
  } else {
    ctx.beginPath();ctx.moveTo(0,-size*.38);ctx.lineTo(size*.34,0);ctx.lineTo(0,size*.38);ctx.lineTo(-size*.34,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(-size*.2,0);ctx.lineTo(size*.2,0);ctx.stroke();
  }
  ctx.restore();
}
function renderAssetLibrary() {
  const grid=editorRoot.querySelector('.editor-asset-grid');
  if(!grid)return;
  grid.replaceChildren();
  const cat=EXTRA_CATEGORIES.find(c=>c.id===activeCategory)||EXTRA_CATEGORIES[0];
  $('editor-category-title').textContent=cat.name;
  $('editor-asset-count').textContent=cat.items.length+' OBJETOS';
  cat.items.forEach(raw=>{
    const item=ASSET_BY_ID[raw[0]],b=document.createElement('button');
    b.type='button';b.className='editor-asset-card'+(selectedAssetId===item.id?' selected':'');
    const cv=document.createElement('canvas');cv.width=64;cv.height=64;
    drawAssetThumb(cv.getContext('2d'),item,56);
    const name=document.createElement('span');name.textContent=item.label;
    b.append(cv,name);
    b.addEventListener('click',()=>{
      selectedAssetId=item.id;editorSelectedItem=item.id;editorToolMode='place';
      $('editor-selected-name').textContent=item.label;
      syncEditorToolButtons();renderAssetLibrary();showEditorLibrary(true);
    });
    grid.appendChild(b);
  });
  $('editor-selected-name').textContent=(ASSET_BY_ID[selectedAssetId]||{label:'Selecione um objeto'}).label;
}
function showEditorLibrary(show){
  const panel=$('editor-library');
  if(panel)panel.classList.toggle('hidden',!show);
}
let eraseGestureMode='click';
function addEditorCommandBar() {
  const top=editorRoot.querySelector('.editor-topbar');
  if(!top||$('editor-tool-rail'))return;
  editorRoot.querySelector('.editor-top-center')?.classList.add('hidden');
  const rail=document.createElement('nav');
  rail.id='editor-tool-rail';
  rail.innerHTML='<button type="button" data-tool="place" class="active"><b>＋</b><span>Colocar</span></button><button type="button" data-tool="select"><b>↖</b><span>Editar</span></button><button type="button" data-tool="erase"><b>⌫</b><span>Apagar</span></button>';
  editorRoot.appendChild(rail);
  rail.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{
    editorToolMode=b.dataset.tool;
    rail.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));
    showEditorLibrary(editorToolMode==='place');
    $('editor-delete-panel')?.classList.toggle('hidden',editorToolMode!=='erase');
    $('editor-inspector')?.classList.toggle('editor-inspector-open',editorToolMode==='select');
    syncEditorToolButtons();
  }));
  const del=document.createElement('section');
  del.id='editor-delete-panel';del.className='hidden';
  del.innerHTML='<strong>APAGAR OBJETOS</strong><div class="editor-delete-modes"><button type="button" data-erase="click" class="active">Clique</button><button type="button" data-erase="drag">Deslize</button></div><label class="editor-clear-slider"><span>Limpar fase</span><input id="editor-clear-swipe" type="range" min="0" max="100" value="0"><small>Deslize até o final para limpar tudo</small></label>';
  editorRoot.appendChild(del);
  del.querySelectorAll('[data-erase]').forEach(b=>b.addEventListener('click',()=>{
    eraseGestureMode=b.dataset.erase;
    del.querySelectorAll('[data-erase]').forEach(x=>x.classList.toggle('active',x===b));
  }));
  $('editor-clear-swipe').addEventListener('input',e=>{
    if(Number(e.target.value)<98)return;
    recordHistory();
    ['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'].forEach(k=>editorDraft[k]=[]);
    selectedObjects=[];selectedEditorObject=null;updateAutoFinish();refreshInspector();drawEditorCanvas();
    e.target.value=0;
  });
  const settings=document.createElement('button');
  settings.id='editor-level-settings-open';settings.type='button';settings.textContent='⚙';
  settings.title='Configurações da fase';
  settings.addEventListener('click',openStageSettings);
  top.querySelector('.editor-top-right')?.prepend(settings);
  const undo=$('editor-undo-btn'),redo=$('editor-redo-btn');
  if(undo)undo.addEventListener('click',undoLocalEditor);
  if(redo)redo.addEventListener('click',redoLocalEditor);
}
function addGridSettings() {
  const top=editorRoot.querySelector('.editor-topbar');
  if(!top||$('editor-grid-settings-open'))return;
  const button=document.createElement('button');
  button.id='editor-grid-settings-open';button.type='button';button.textContent='▦';
  button.title='Configurações da grade';button.setAttribute('aria-label','Configurações da grade');
  top.querySelector('.editor-top-right')?.prepend(button);
  const panel=document.createElement('section');
  panel.id='editor-grid-settings-panel';panel.className='hidden';
  panel.innerHTML='<div class="grid-settings-head"><strong>GRADE DO EDITOR</strong><button type="button" id="editor-grid-settings-close" aria-label="Fechar">×</button></div><div class="grid-settings-cell"><span>Tamanho da célula</span><b>44 × 44 px · 1 CUBO</b><small>Fixo para manter o alinhamento idêntico ao jogo.</small></div><label class="grid-settings-option"><input id="grid-setting-visible" type="checkbox" checked><span>Mostrar grade</span></label><label class="grid-settings-option"><input id="grid-setting-snap" type="checkbox" checked disabled><span>Encaixe 1×1 obrigatório</span></label><label class="grid-settings-option"><span>Contraste das linhas</span><select id="grid-setting-strength"><option value="soft">Suave</option><option value="normal" selected>Normal</option><option value="strong">Forte</option></select></label>';
  editorRoot.appendChild(panel);
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('gd-editor-grid-settings')||'{}')}catch(_){return {}}})();
  editorShowGrid=saved.visible!==false;snapEnabled=true;
  gridLineStrength=['soft','normal','strong'].includes(saved.strength)?saved.strength:'normal';
  $('grid-setting-visible').checked=editorShowGrid;$('grid-setting-snap').checked=true;
  $('grid-setting-strength').value=gridLineStrength;
  const save=()=>{
    try{localStorage.setItem('gd-editor-grid-settings',JSON.stringify({visible:editorShowGrid,snap:snapEnabled,strength:gridLineStrength}));}catch(_){}
    syncEditorToolButtons();drawEditorCanvas();
  };
  button.addEventListener('click',()=>{gridSettingsOpen=!gridSettingsOpen;panel.classList.toggle('hidden',!gridSettingsOpen);});
  $('editor-grid-settings-close').addEventListener('click',()=>{gridSettingsOpen=false;panel.classList.add('hidden');});
  $('grid-setting-visible').addEventListener('change',ev=>{editorShowGrid=ev.target.checked;save();});
  $('grid-setting-snap').addEventListener('change',()=>{snapEnabled=true;$('grid-setting-snap').checked=true;save();});
  $('grid-setting-strength').addEventListener('change',ev=>{gridLineStrength=ev.target.value;save();});
}
function addInspector() {
  const bottom=editorRoot.querySelector('.editor-bottom-panel');
  if(!bottom||$('editor-inspector'))return;
  const panel=document.createElement('aside');panel.id='editor-inspector';panel.innerHTML='<div class="editor-inspector-title">OBJECT INSPECTOR <span id="editor-selection-count">0 selected</span></div><div class="editor-inspector-fields"><label>X<input id="inspect-x" type="number" step="1"></label><label>Y<input id="inspect-y" type="number" step="1"></label><label>ROTATION<input id="inspect-rotation" type="number" step="1" value="0"></label><label>SCALE %<input id="inspect-scale" type="number" min="10" max="500" step="5" value="100"></label><label class="group-field">GROUPS<input id="inspect-groups" type="text" placeholder="Ex.: 1, 2, 10"></label><button id="inspect-apply-btn" type="button">APPLY</button></div>';
  editorRoot.appendChild(panel);panel.classList.add('editor-inspector-floating');
  $('inspect-apply-btn').addEventListener('click',applyInspector);
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')applyInspector();}));
}
function getSelectionRecords() {
  return selectedObjects.map(sel=>({key:sel.key,obj:sel.obj})).filter(s=>(editorDraft[s.key]||[]).includes(s.obj));
}
function setSelection(records) {
  selectedObjects=records.slice();selectedEditorObject=selectedObjects.length?selectedObjects[selectedObjects.length-1]:null;
  refreshInspector();drawEditorCanvas();
}
function refreshInspector() {
  const records=getSelectionRecords(),first=records[0];
  $('editor-selection-count').textContent=records.length+' selected';
  ['inspect-x','inspect-y','inspect-rotation','inspect-scale','inspect-groups'].forEach(id=>$(id).disabled=!first);
  if(!first)return;
  inspectorLock=true;
  $('inspect-x').value=Math.round(first.obj.x||0);
  $('inspect-y').value=Math.round(first.obj.y===undefined?GROUND_Y-45:first.obj.y);
  $('inspect-rotation').value=Math.round(first.obj.rotation||0);
  $('inspect-scale').value=Math.round((first.obj.scale||1)*100);
  $('inspect-groups').value=objectGroupList(first.obj).join(', ');
  inspectorLock=false;
}
function applyInspector() {
  const records=getSelectionRecords();if(!records.length)return;
  recordHistory();
  const x=Number($('inspect-x').value),y=Number($('inspect-y').value);
  const rot=Number($('inspect-rotation').value),scale=Number($('inspect-scale').value)/100;
  const first=records[0].obj,dx=Number.isFinite(x)?x-(first.x||0):0,dy=Number.isFinite(y)?y-(first.y===undefined?GROUND_Y-45:first.y):0;
  records.forEach(s=>{
    if(Number.isFinite(x))s.obj.x=Math.round(((s.obj.x||0)+dx)/(gridUnit/2))*(gridUnit/2);
    if(Number.isFinite(y))s.obj.y=Math.round(((s.obj.y===undefined?GROUND_Y-45:s.obj.y)+dy)/(gridUnit/(2*EDITOR_SCALE_Y)))*(gridUnit/(2*EDITOR_SCALE_Y));
    if(Number.isFinite(rot))s.obj.rotation=rot*Math.PI/180;
    if(Number.isFinite(scale))applyObjectScale(s.obj,Math.max(.1,Math.min(5,scale)));
    assignGroups(s.obj,$('inspect-groups').value);
  });
  drawEditorCanvas();
}
function applyObjectScale(obj,scale) {
  obj.scale=scale;
  if(obj.w!==undefined){if(obj._baseW===undefined)obj._baseW=obj.w;obj.w=obj._baseW*scale;}
  if(obj.h!==undefined){if(obj._baseH===undefined)obj._baseH=obj.h;obj.h=obj._baseH*scale;}
  if(obj.r!==undefined){if(obj._baseR===undefined)obj._baseR=obj.r;obj.r=obj._baseR*scale;}
  if(obj.radius!==undefined){if(obj._baseRadius===undefined)obj._baseRadius=obj.radius;obj.radius=obj._baseRadius*scale;}
  if(obj.width!==undefined){if(obj._baseWidth===undefined)obj._baseWidth=obj.width;obj.width=obj._baseWidth*scale;}
  if(obj.cooldown!==undefined){if(obj._baseWidth===undefined)obj._baseWidth=36;if(obj._baseHeight===undefined)obj._baseHeight=11;obj.width=obj._baseWidth*scale;obj.height=obj._baseHeight*scale;}
  if(obj.used!==undefined&&obj.color){if(obj._baseRadius===undefined)obj._baseRadius=17;obj.radius=obj._baseRadius*scale;}
  if(obj.collected!==undefined){if(obj._baseRadius===undefined)obj._baseRadius=13;obj.radius=obj._baseRadius*scale;}
  if(obj.type){if(obj._baseWidth===undefined)obj._baseWidth=PORTAL_WIDTH;if(obj._baseHeight===undefined)obj._baseHeight=PORTAL_HEIGHT;obj.width=obj._baseWidth*scale;obj.height=obj._baseHeight*scale;}
  if(obj.height!==undefined){if(obj._baseHeight===undefined)obj._baseHeight=obj.height;obj.height=obj._baseHeight*scale;}
}
function transformSelection(fn) {
  const records=getSelectionRecords();if(!records.length)return;
  recordHistory();records.forEach(s=>fn(s.obj));drawEditorCanvas();refreshInspector();
}
function duplicateSelection() {
  const records=getSelectionRecords();if(!records.length)return;
  recordHistory();const next=[];
  records.forEach(s=>{
    const clone=deepClone(s.obj);clone.id=makeId();clone.x=(clone.x||0)+gridUnit;clone.y=(clone.y===undefined?GROUND_Y-45:clone.y)+0;
    editorDraft[s.key].push(clone);next.push({key:s.key,obj:clone});
  });setSelection(next);
}
function findObjectAt(point) {
  let found=null,best=Infinity;
  allEditorArrays(editorDraft).forEach(group=>group.items.forEach(obj=>{
    const p=objectCenter(obj),dist=Math.hypot(point.x-p.x,point.y-p.y);
    const radius=Math.max(30,(obj.w||obj.r||40)*(obj.scale||1)*.65);
    if(dist<radius&&dist<best){best=dist;found={key:group.key,obj};}
  }));
  return found;
}
function addAssetAtWorld(x,y) {
  const item=ASSET_BY_ID[selectedAssetId];if(!item)return false;
  const base={id:makeId(),x:Math.max(240,Math.min(editorDraft.finishX-80,x)),y:y,rotation:0,scale:1,groups:[]};
  const color=selectedAssetId.replace(/^orb_|^pad_/,'');
  if(item.type==='spike'||item.type==='mini_spike'||item.type==='ceil_spike'){
    editorDraft.spikes.push({x:base.x,y:item.type==='ceil_spike'?CEILING_Y:GROUND_Y,sizeType:item.type==='mini_spike'?'mini':'normal',inverted:item.type==='ceil_spike',groups:[]});
  } else if(item.type==='block') {
    if(selectedAssetId==='platform')editorDraft.platforms.push({x:base.x,y:Math.min(GROUND_Y-36,y),w:EDITOR_GRID,h:26,groups:[]});
    else editorDraft.blocks.push({x:base.x,y:Math.min(GROUND_Y-BLOCK_SIZE,Math.max(CEILING_Y,y)),w:BLOCK_SIZE,h:BLOCK_SIZE,groups:[]});
  } else if(item.type.indexOf('orb_')===0) {
    editorDraft.orbs.push({x:base.x,y:Math.min(GROUND_Y-30,y),color:color,used:false,groups:[]});
  } else if(item.type.indexOf('pad_')===0) {
    editorDraft.pads.push({x:base.x,color:color,cooldown:0,groups:[]});
  } else if(item.type==='portal_cube'||item.type==='portal_ship') {
    editorDraft.portals.push({x:base.x,type:item.type==='portal_cube'?'cube':'ship',triggered:false,groups:[]});
  } else if(item.type==='portal_extra') {
    const portalType=selectedAssetId.replace('portal_','');editorDraft.portals.push({x:base.x,type:portalType,triggered:false,groups:[]});
  } else if(item.type==='saw') {
    editorDraft.saws.push({x:base.x,y:Math.min(GROUND_Y-30,y),r:22,angle:0,groups:[]});
  } else if(item.type==='pillar') {
    editorDraft.pillars.push({x:base.x,h:90,w:34,groups:[]});
  } else if(item.type==='coin') {
    editorDraft.coins.push({x:base.x,y:Math.min(GROUND_Y-30,y),collected:false,groups:[]});
  } else if(item.type==='trigger'||item.type==='legacy_trigger') {
    const kind={trigger_move:'move',trigger_pulse:'pulse',trigger_scale:'scale',trigger_color:'color',trigger_speed:'speed',trig_bg_purple:'bg',trig_shake:'shake',trig_low_grav:'low_grav',trig_norm_grav:'norm_grav'}[selectedAssetId];
    if(kind)editorDraft.triggers.push({id:makeId(),x:base.x,y:Math.min(GROUND_Y-20,Math.max(CEILING_Y,y)),kind:kind,group:'1',duration:1,intensity:1,distance:120,scale:1.5,color:'#00e5ff',speedMultiplier:1,customSpeed:1,triggered:false});
    else return false;
  } else if(item.type==='structure') {
    editorDraft.structures.push(Object.assign(base,{kind:selectedAssetId.replace('structure_',''),color:item.color,gameplay:false}));
  } else {
    editorDraft.decorations.push(Object.assign(base,{kind:selectedAssetId,color:item.color,gameplay:false}));
  }
  updateAutoFinish();drawEditorCanvas();
  return true;
}
const oldPlace = placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord = function(x,y) {
  if(ASSET_BY_ID[selectedAssetId] && !['spike','mini_spike','ceil_spike','platform','block','pad_yellow','pad_pink','orb_yellow','orb_pink','saw','pillar','coin','portal_ship','portal_cube','trig_speed_fast','trig_speed_norm','trig_bg_purple','trig_shake','trig_low_grav','trig_norm_grav'].includes(selectedAssetId)){
    recordHistory();addAssetAtWorld(x,y);updateAutoFinish();drawEditorCanvas();return;
  }
  if(ASSET_BY_ID[selectedAssetId] && ['orb_blue','orb_red','orb_green','orb_black','orb_purple','orb_cyan','orb_dash','pad_red','pad_blue','pad_green','pad_black'].includes(selectedAssetId)){
    recordHistory();addAssetAtWorld(x,y);return;
  }
  recordHistory();oldPlace.call(this,x,y);updateAutoFinish();drawEditorCanvas();
};
const oldEditAtPointer=editAtEditorPointer;
editAtEditorPointer=function(pointerEvent){
  const point=getEditorWorldCoords(pointerEvent);expandEditorLevelIfNeeded(point.x);
  if(editorToolMode==='erase'){
    if(eraseGestureMode==='click'&&lastEditorDragPoint){lastEditorDragPoint=point;return;}
    if(!lastEditorDragPoint)eraseAtWorldCoord(point.x,point.y);
    else{
      const dx=point.x-lastEditorDragPoint.x,dy=point.y-lastEditorDragPoint.y;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/gridUnit));
      for(let i=1;i<=steps;i++)eraseAtWorldCoord(lastEditorDragPoint.x+dx*i/steps,lastEditorDragPoint.y+dy*i/steps);
    }
  }else if(editorToolMode==='place'&&editorSelectedItem!=='platform'){
    if(!lastEditorDragPoint)placeSelectedAtWorldCoord(point.x,point.y);
    else{
      const dx=point.x-lastEditorDragPoint.x,dy=point.y-lastEditorDragPoint.y,dist=Math.hypot(dx,dy*EDITOR_SCALE_Y);
      if(dist>=gridUnit*.65){
        const steps=Math.max(1,Math.ceil(dist/gridUnit));
        for(let i=1;i<=steps;i++){
          let x=lastEditorDragPoint.x+dx*i/steps,y=lastEditorDragPoint.y+dy*i/steps;
          if(snapEnabled){x=Math.round(x/gridUnit)*gridUnit;y=Math.round(y/(gridUnit/EDITOR_SCALE_Y))*(gridUnit/EDITOR_SCALE_Y);}
          placeSelectedAtWorldCoord(x,y);
        }
      }
    }
  }
  lastEditorDragPoint=point;
};
const oldErase = eraseAtWorldCoord;
eraseAtWorldCoord = function(x,y) {
  recordHistory();oldErase(x,y);updateAutoFinish();
  ['decorations','structures'].forEach(key=>{editorDraft[key]=(editorDraft[key]||[]).filter(o=>Math.hypot((o.x||0)-x,(o.y||0)-y)>Math.max(24,(o.scale||1)*28));});
};
getEditorWorldCoords = function(e, fineEdit=false) {
  const rect=editorCanvas.getBoundingClientRect();
  const sx=editorCanvas.width/Math.max(1,rect.width),sy=editorCanvas.height/Math.max(1,rect.height);
  const rawX=(e.clientX-rect.left)*sx,rawY=(e.clientY-rect.top)*sy;
  const logicalX=(rawX-zoomOffsetX())/editorZoom,logicalY=(rawY-zoomOffsetY())/editorZoom;
  let x=logicalX+editorScrollX-80,y=logicalY/EDITOR_SCALE_Y;
  const step=fineEdit?gridUnit/2:gridUnit;
  x=Math.round(x/step)*step;
  y=Math.round(y/(step/EDITOR_SCALE_Y))*(step/EDITOR_SCALE_Y);
  return {x,y};
};
function updateAutoFinish(){
  const keys=['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers','decorations','structures'];
  let farthest=0;
  keys.forEach(k=>(editorDraft[k]||[]).forEach(o=>{
    const right=(Number(o.x)||0)+(Number(o.w||o.width)||0);
    farthest=Math.max(farthest,right);
  }));
  const next=Math.max(gridUnit*10,Math.ceil((farthest+gridUnit*10)/gridUnit)*gridUnit);
  editorDraft.finishX=next;
  const input=$('style-finish-x'),label=$('style-finish-label');
  if(input){input.max=String(Math.max(next+10000,Number(input.max)||0));input.value=String(next);}
  if(label)label.textContent=String(next);
}
const oldDrawEditor = drawEditorCanvas;
drawEditorCanvas = function() {
  if(gameState!=='EDITOR'){oldDrawEditor();return;}
  eCtx.setTransform(1,0,0,1,0,0);eCtx.clearRect(0,0,editorCanvas.width,editorCanvas.height);
  const show=editorShowGrid;editorShowGrid=false;oldDrawEditor();editorShowGrid=show;
  if(editorZoom!==1){
    zoomBufferCtx.clearRect(0,0,zoomBuffer.width,zoomBuffer.height);
    zoomBufferCtx.drawImage(editorCanvas,0,0);
    eCtx.setTransform(1,0,0,1,0,0);eCtx.clearRect(0,0,editorCanvas.width,editorCanvas.height);
    eCtx.drawImage(zoomBuffer,zoomOffsetX(),zoomOffsetY(),editorCanvas.width*editorZoom,editorCanvas.height*editorZoom);
  }
  eCtx.save();eCtx.translate(zoomOffsetX(),zoomOffsetY());eCtx.scale(editorZoom,editorZoom);
  if(show){
    const alpha=gridLineStrength==='strong'?{minor:.2,major:.38}:gri/* Geometry Dash Web - expansão principal v1.2
   Modos, portais procedurais, garagem multi-ícone, editor avançado e trilha.
   Sem bibliotecas externas. */
(() => {
'use strict';

const MODE_INFO = {
  cube:{name:'CUBE',color:'#9dff00',secondary:'#eaff9d'},
  ship:{name:'SHIP',color:'#00c8ff',secondary:'#a5f3fc'},
  ball:{name:'BALL',color:'#ffb703',secondary:'#fff1a8'},
  ufo:{name:'UFO',color:'#d946ef',secondary:'#f5b5ff'},
  wave:{name:'WAVE',color:'#22d3ee',secondary:'#b6f7ff'},
  robot:{name:'ROBOT',color:'#fb923c',secondary:'#ffdfb8'},
  spider:{name:'SPIDER',color:'#f43f5e',secondary:'#ffc0cb'}
};
const MODE_LIST = Object.keys(MODE_INFO);
const MODE_SKIN_KEY = 'gd_web_mode_skins_v1';
const modeSkins = (() => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(MODE_SKIN_KEY) || '{}') || {}; } catch (_) {}
  const result = {};
  MODE_LIST.forEach((mode, index) => {
    const fallback = {model:index % 6, primary:MODE_INFO[mode].color, secondary:MODE_INFO[mode].secondary};
    result[mode] = Object.assign(fallback, saved[mode] || {});
  });
  return result;
})();
let activeSkinMode = 'cube';
let activeTrail = [];
let trailTick = 0;
let modeGravity = 1;
let selectedEditorObject = null;
let editorUndoStack = [];
let editorRedoStack = [];
let editorClipboard = null;
let editorHistoryLock = false;
let editorZoom = 1;

function saveModeSkins() {
  try { localStorage.setItem(MODE_SKIN_KEY, JSON.stringify(modeSkins)); } catch (_) {}
}
function currentModeSkin() { return modeSkins[activeSkinMode] || modeSkins.cube; }
function setActiveMode(mode) {
  if (!MODE_INFO[mode]) return;
  activeSkinMode = mode;
  playerSkin.model = modeSkins[mode].model;
  playerSkin.primary = modeSkins[mode].primary;
  playerSkin.secondary = modeSkins[mode].secondary;
  renderModeGarage();
  renderSkinUI();
}

function roundedRect(c,x,y,w,h,r) {
  const rr=Math.min(r,w/2,h/2);
  c.beginPath(); c.moveTo(x+rr,y); c.arcTo(x+w,y,x+w,y+h,rr);
  c.arcTo(x+w,y+h,x,y+h,rr); c.arcTo(x,y+h,x,y,rr); c.arcTo(x,y,x+w,y,rr); c.closePath();
}
function drawModeIcon(c,mode,x,y,size,rotation,skin) {
  const s=skin||modeSkins[mode]||modeSkins.cube;
  const variant=((Number(s.model)||0)%8+8)%8;
  const cx=x+size/2,cy=y+size/2,scale=size/44;
  const primary=/^#[0-9a-f]{6}$/i.test(s.primary)?s.primary:'#9dff00';
  const secondary=/^#[0-9a-f]{6}$/i.test(s.secondary)?s.secondary:'#eaff9d';
  const shade=(hex,amount)=>{
    const n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amount));
    const g=Math.max(0,Math.min(255,((n>>8)&255)+amount));
    const b=Math.max(0,Math.min(255,(n&255)+amount));
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  };
  c.save();c.translate(cx,cy);c.rotate(rotation||0);c.scale(scale,scale);
  c.lineJoin='round';c.lineCap='round';
  const fill=c.createLinearGradient(-18,-20,18,22);
  fill.addColorStop(0,shade(primary,42));fill.addColorStop(.48,primary);fill.addColorStop(1,shade(primary,-48));
  const outline='#07101d';
  const path=(points)=>{c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();};
  const polygon=(points)=>{path(points);c.fillStyle=fill;c.fill();c.lineWidth=3;c.strokeStyle=outline;c.stroke();};
  const circle=(rx,ry,r)=>{c.beginPath();c.ellipse(rx,ry,r,r,0,0,Math.PI*2);c.fillStyle=fill;c.fill();c.lineWidth=3;c.strokeStyle=outline;c.stroke();};
  const rounded=(xx,yy,w,h,r)=>{roundedRect(c,xx,yy,w,h,r);c.fillStyle=fill;c.fill();c.lineWidth=3;c.strokeStyle=outline;c.stroke();};
  c.shadowColor=primary;c.shadowBlur=5;
  if(mode==='cube'){
    const shapes=[
      [[-20,-20],[20,-20],[20,20],[-20,20]],
      [[-13,-22],[13,-22],[22,-13],[22,13],[13,22],[-13,22],[-22,13],[-22,-13]],
      [[0,-23],[20,-12],[20,12],[0,23],[-20,12],[-20,-12]],
      [[0,-24],[24,0],[0,24],[-24,0]],
      [[-17,-22],[17,-22],[22,-17],[22,17],[17,22],[-17,22],[-22,17],[-22,-17]],
      [[-22,-16],[-10,-22],[10,-22],[22,-16],[22,16],[10,22],[-10,22],[-22,16]],
      [[-20,-22],[20,-22],[20,8],[0,23],[-20,8]],
      [[-16,-22],[16,-22],[22,-16],[22,16],[16,22],[-16,22],[-22,16],[-22,-16]]
    ];
    polygon(shapes[variant]);
    c.shadowBlur=0;c.fillStyle=secondary;c.strokeStyle=outline;c.lineWidth=2.2;
    const eyeY=variant===3?-7:-8;
    if(variant===1||variant===5){c.fillRect(-12,eyeY,7,7);c.strokeRect(-12,eyeY,7,7);c.fillRect(5,eyeY,7,7);c.strokeRect(5,eyeY,7,7);}
    else if(variant===2||variant===6){c.beginPath();c.arc(-8,eyeY+3,3.5,0,Math.PI*2);c.arc(8,eyeY+3,3.5,0,Math.PI*2);c.fill();c.stroke();}
    else {c.fillRect(-13,eyeY,8,8);c.strokeRect(-13,eyeY,8,8);c.fillRect(5,eyeY,8,8);c.strokeRect(5,eyeY,8,8);}
    if(variant===4){c.fillRect(-10,7,20,5);c.strokeRect(-10,7,20,5);}
    else {c.fillRect(-11,7,22,5);c.strokeRect(-11,7,22,5);}
  } else if(mode==='ship'){
    const ships=[
      [[-23,-8],[12,-17],[24,0],[12,17],[-23,8],[-14,0]],
      [[-24,-5],[17,-14],[24,0],[17,14],[-24,5]],
      [[-20,-13],[6,-13],[24,0],[6,13],[-20,13],[-8,0]],
      [[-23,-3],[2,-18],[24,0],[2,18],[-23,3]],
      [[-17,-13],[13,-13],[22,0],[13,13],[-17,13],[-8,0]],
      [[-24,-10],[12,-15],[20,-4],[20,4],[12,15],[-24,10],[-12,0]],
      [[-20,-16],[18,-8],[24,0],[18,8],[-20,16],[-8,0]],
      [[-24,-4],[7,-19],[18,-8],[24,0],[18,8],[7,19],[-24,4]]
    ];
    polygon(ships[variant]);
    c.shadowBlur=0;c.fillStyle=secondary;c.strokeStyle=outline;c.lineWidth=2;
    path([[-12,-5],[7,-7],[15,0],[7,7],[-12,5]]);c.fill();c.stroke();
    c.fillStyle='#fff';c.beginPath();c.arc(variant%2?5:-3,0,2.5,0,Math.PI*2);c.fill();
    c.fillStyle=secondary;c.beginPath();c.moveTo(-22,-3);c.lineTo(-30,0);c.lineTo(-22,3);c.fill();
  } else if(mode==='ball'){
    const radius=[20,18,21,17,20,19,21,18][variant];
    circle(0,0,radius);
    c.shadowBlur=0;c.strokeStyle=secondary;c.fillStyle=secondary;c.lineWidth=3;
    if(variant===0){c.beginPath();c.arc(0,0,12,-.8,2.3);c.stroke();c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fill();}
    if(variant===1){c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.fill();}
    if(variant===2){for(let a=0;a<Math.PI*2;a+=Math.PI/2){c.beginPath();c.moveTo(Math.cos(a)*7,Math.sin(a)*7);c.lineTo(Math.cos(a)*17,Math.sin(a)*17);c.stroke();}}
    if(variant===3){c.beginPath();c.arc(0,0,12,Math.PI,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,12,0,Math.PI);c.stroke();}
    if(variant===4){c.beginPath();c.arc(0,0,13,-2.4,2.4);c.stroke();c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fill();}
    if(variant===5){c.beginPath();c.moveTo(-13,-8);c.lineTo(0,-15);c.lineTo(13,-8);c.lineTo(13,8);c.lineTo(0,15);c.lineTo(-13,8);c.closePath();c.stroke();}
    if(variant===6){c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();}
    if(variant===7){c.beginPath();c.moveTo(-13,0);c.lineTo(0,-13);c.lineTo(13,0);c.lineTo(0,13);c.closePath();c.stroke();}
  } else if(mode==='ufo'){
    const body=variant%2===0?[[-23,2],[-17,-7],[0,-12],[17,-7],[23,2],[16,12],[-16,12]]:[[-22,0],[-12,-10],[12,-10],[22,0],[17,11],[-17,11]];
    polygon(body);
    c.shadowBlur=0;c.fillStyle=secondary;c.strokeStyle=outline;c.lineWidth=2;
    c.beginPath();c.moveTo(-12,-7);c.quadraticCurveTo(-9,-22,0,-22);c.quadraticCurveTo(10,-22,12,-7);c.closePath();c.fill();c.stroke();
    if(variant===1||variant===4){c.fillStyle='#fff';[-11,0,11].forEach(px=>{c.beginPath();c.arc(px,6,2.5,0,Math.PI*2);c.fill();});}
    else {c.strokeStyle=secondary;c.lineWidth=2.5;c.beginPath();c.moveTo(-15,5);c.lineTo(15,5);c.stroke();}
    if(variant===2||variant===6){c.strokeStyle=secondary;c.beginPath();c.arc(0,0,26,Math.PI,Math.PI*2);c.stroke();}
  } else if(mode==='wave'){
    const waves=[
      [[-22,13],[0,-17],[22,13],[9,13],[0,0],[-9,13]],
      [[-21,15],[0,-20],[21,15],[8,15],[0,-2],[-8,15]],
      [[-22,11],[-7,11],[0,-15],[7,11],[22,11],[0,22]],
      [[-22,0],[-8,-15],[0,-4],[9,-20],[22,-5],[7,8],[0,-2],[-9,14]],
      [[-22,14],[0,-22],[22,14],[11,14],[0,-3],[-11,14]],
      [[-20,15],[-20,4],[0,-18],[20,4],[20,15],[0,-5]],
      [[-22,12],[-8,12],[0,-16],[8,12],[22,12],[0,22]],
      [[-22,-8],[0,-20],[22,-8],[10,0],[0,-8],[-10,0]]
    ];
    polygon(waves[variant]);
    c.shadowBlur=0;c.strokeStyle=secondary;c.lineWidth=2;c.beginPath();c.moveTo(-8,9);c.lineTo(0,-7);c.lineTo(8,9);c.stroke();
  } else if(mode==='robot'){
    const headShapes=[
      [-17,-20,34,36,5],[-20,-17,40,32,3],[-16,-22,32,40,8],[-20,-20,40,40,2],
      [-18,-18,36,36,12],[-21,-15,42,30,5],[-16,-20,32,38,2],[-19,-19,38,38,8]
    ];
    const r=headShapes[variant];rounded(r[0],r[1],r[2],r[3],r[4]);
    c.shadowBlur=0;c.fillStyle=secondary;c.strokeStyle=outline;c.lineWidth=2;
    if(variant%3===0){c.fillRect(-12,-9,7,8);c.strokeRect(-12,-9,7,8);c.fillRect(5,-9,7,8);c.strokeRect(5,-9,7,8);}
    else if(variant%3===1){c.beginPath();c.arc(-8,-5,4,0,Math.PI*2);c.arc(8,-5,4,0,Math.PI*2);c.fill();c.stroke();}
    else {c.fillRect(-12,-6,24,5);c.strokeRect(-12,-6,24,5);}
    c.fillRect(-8,5,16,4);c.strokeRect(-8,5,16,4);
    c.strokeStyle=primary;c.lineWidth=4;c.beginPath();
    if(variant%2===0){c.moveTo(-12,17);c.lineTo(-17,23);c.moveTo(12,17);c.lineTo(17,23);}
    else {c.moveTo(-12,17);c.lineTo(-12,23);c.lineTo(-17,23);c.moveTo(12,17);c.lineTo(12,23);c.lineTo(17,23);}
    c.stroke();
    if(variant>=4){c.strokeStyle=secondary;c.lineWidth=2;c.beginPath();c.moveTo(0,-20);c.lineTo(0,-26);c.stroke();c.beginPath();c.arc(0,-27,2,0,Math.PI*2);c.fill();}
  } else if(mode==='spider'){
    const legSets=[
      [-1,1],[-.7,.7],[-1.2,1.2],[-.5,.5],[-1.4,1.4],[-.9,.9],[-1.1,1.1],[-.6,.6]
    ];
    const spread=legSets[variant][0];
    c.shadowBlur=0;c.strokeStyle=primary;c.lineWidth=4;
    for(let i=0;i<4;i++){
      const side=i<2?-1:1, row=i%2===0?-1:1;
      c.beginPath();c.moveTo(side*10,row*5);c.lineTo(side*(18+(variant%3)*2),row*(13+(variant%2)*2));c.lineTo(side*(22+(variant%2)*3),row*(20+(variant%3)));c.stroke();
    }
    circle(0,0,variant%2===0?15:13);
    c.fillStyle=secondary;c.strokeStyle=outline;c.lineWidth=1.5;
    c.beginPath();c.arc(-5,-3,2.5,0,Math.PI*2);c.arc(5,-3,2.5,0,Math.PI*2);c.fill();c.stroke();
    if(variant===2||variant===5){c.strokeStyle=secondary;c.lineWidth=2;c.beginPath();c.arc(0,0,20,Math.PI,Math.PI*2);c.stroke();}
    if(variant===7){c.fillStyle=secondary;c.beginPath();c.arc(0,7,3,0,Math.PI*2);c.fill();}
  }
  // Brilho superior discreto para dar volume sem esconder os detalhes.
  c.shadowBlur=0;c.globalAlpha=.24;c.strokeStyle='#fff';c.lineWidth=1.5;
  if(mode==='ball'){c.beginPath();c.arc(-5,-7,8,3.5,5.7);c.stroke();}
  else {c.beginPath();c.moveTo(-14,-17);c.lineTo(7,-17);c.stroke();}
  c.restore();
}
function portalColor(type) { return (MODE_INFO[type] || MODE_INFO.cube).color; }
function drawProceduralPortal(portal,screenX) {
  if(screenX+PORTAL_WIDTH < -70 || screenX > canvas.width+70) return;
  const mode=MODE_INFO[portal.type] ? portal.type : 'cube';
  const color=portalColor(mode), t=performance.now()/1000;
  const cx=screenX+PORTAL_WIDTH/2, cy=GROUND_Y-PORTAL_HEIGHT/2;
  const pulse=1+Math.sin(t*5+screenX*.01)*.045;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.shadowColor=color; ctx.shadowBlur=24;
  ctx.translate(cx,cy); ctx.scale(pulse,1);
  ctx.strokeStyle=color; ctx.lineWidth=9; ctx.beginPath(); ctx.ellipse(0,0,21,53,0,0,Math.PI*2); ctx.stroke();
  ctx.shadowBlur=8; ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.ellipse(0,0,14,45,0,0,Math.PI*2); ctx.stroke();
  const grad=ctx.createLinearGradient(-20,0,20,0);
  grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(.5,color+'66'); grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad; ctx.beginPath(); ctx.ellipse(0,0,17,46,0,0,Math.PI*2); ctx.fill();
  for(let i=0;i<5;i++){
    const a=t*1.7+i*Math.PI*2/5;
    ctx.fillStyle='#fff'; ctx.globalAlpha=.55+Math.sin(t*4+i)*.3;
    ctx.beginPath(); ctx.arc(Math.cos(a)*23,Math.sin(a)*49,2.1,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.restore();
}
function mapPortalMode(type) { return MODE_INFO[type] ? type : (type==='ship'?'ship':'cube'); }
function portalCollision(p,portal,screenX) {
  if(portal.triggered) return;
  const top=GROUND_Y-PORTAL_HEIGHT;
  if(p.x+p.size>screenX+5 && p.x<screenX+PORTAL_WIDTH-5 && p.y+p.size>top && p.y<GROUND_Y) {
    portal.triggered=true;
    const next=mapPortalMode(portal.type);
    if(next!==playerMode) {
      playerMode=next; modeGravity=1; p.dy=0; p.grounded=false;
      if(next==='ball'||next==='spider') modeGravity=1;
      if(next==='ship') p.dy=-3;
      if(next==='wave') p.dy=-7;
      playSfx('portal');
      spawnEndParticles(screenX+PORTAL_WIDTH/2,p.y+p.size/2,18,true);
    }
  }
}
drawPortal = drawProceduralPortal;
checkPortalTrigger = portalCollision;

// Mode-specific player physics. Cube/ship keep the original tuning.
const originalPlayerUpdate=player.update.bind(player);
const originalPlayerDraw=player.draw.bind(player);
const originalPlayerJump=player.jump.bind(player);
player.update=function() {
  if(playerMode==='cube'||playerMode==='ship') {
    originalPlayerUpdate();
    return;
  }
  this.prevY=this.y;
  const floor=GROUND_Y-this.size, ceiling=CEILING_Y;
  if(playerMode==='wave') {
    this.dy=isHoldingJump?-7.4:7.4;
    this.y+=this.dy;
    this.grounded=false;
    if(this.y<ceiling){this.y=ceiling; if(this.dy<0)this.dy=0;}
    if(this.y>floor){this.y=floor;if(this.dy>0)this.dy=0;}
    return;
  }
  if(playerMode==='ball') {
    if(jumpJustPressed){modeGravity*=-1;this.dy=0;playSfx('jump');jumpJustPressed=false;}
    this.dy+=GRAVITY*gravityMultiplier*modeGravity;
    this.y+=this.dy;
    if(this.y>=floor){this.y=floor;this.dy=0;this.grounded=true;}
    else if(this.y<=ceiling){this.y=ceiling;this.dy=0;this.grounded=true;}
    else this.grounded=false;
    this.rotation+=this.dy*.025;
    return;
  }
  if(playerMode==='ufo') {
    if(jumpJustPressed){this.dy=-12.5;playSfx('jump');jumpJustPressed=false;}
    this.dy=Math.min(8,this.dy+GRAVITY*.78*gravityMultiplier);
    this.y+=this.dy;
    if(this.y>=floor){this.y=floor;this.dy=0;this.grounded=true;} else this.grounded=false;
    if(this.y<ceiling){this.y=ceiling;this.dy=0;}
    this.rotation+=.025;
    return;
  }
  if(playerMode==='robot') {
    if(jumpJustPressed&&this.grounded){this.dy=isHoldingJump?-17.2:-14.5;this.grounded=false;playSfx('jump');}
    jumpJustPressed=false;
    this.dy+=GRAVITY*gravityMultiplier;
    this.y+=this.dy;
    if(this.y>=floor){this.y=floor;this.dy=0;this.grounded=true;}else this.grounded=false;
    if(this.y<ceiling){this.y=ceiling;this.dy=0;}
    if(!this.grounded)this.rotation+=.07;
    return;
  }
  if(playerMode==='spider') {
    if(jumpJustPressed){modeGravity*=-1;this.dy=0;this.y=modeGravity===1?floor:ceiling;this.grounded=true;playSfx('jump');spawnEndParticles(this.x+this.size/2,this.y+this.size/2,8,true);}
    jumpJustPressed=false;
    this.dy+=GRAVITY*gravityMultiplier*modeGravity;
    this.y+=this.dy;
    if(modeGravity===1&&this.y>=floor){this.y=floor;this.dy=0;this.grounded=true;}
    else if(modeGravity===-1&&this.y<=ceiling){this.y=ceiling;this.dy=0;this.grounded=true;}
    else this.grounded=false;
    this.rotation=0;
    return;
  }
  originalPlayerUpdate();
};
player.jump=function() {
  if(playerMode==='cube'||playerMode==='robot') originalPlayerJump();
};
player.draw=function() {
  const skin=modeSkins[playerMode]||modeSkins.cube;
  const angle=playerMode==='ship'?Math.max(-.45,Math.min(.45,this.dy*.048)):this.rotation;
  if(playerMode==='ship'&&isHoldingJump&&gameState==='PLAYING'){
    ctx.save();ctx.fillStyle='#ff8a00';ctx.shadowColor='#ff6a00';ctx.shadowBlur=9;
    ctx.beginPath();ctx.moveTo(this.x-5,this.y+this.size*.35);ctx.lineTo(this.x-22-Math.random()*8,this.y+this.size*.5);ctx.lineTo(this.x-5,this.y+this.size*.65);ctx.fill();ctx.restore();
  }
  drawModeIcon(ctx,playerMode,this.x,this.y,this.size,angle,skin);
};
const originalSaveCheckpoint=saveCheckpointAtCurrentState;
saveCheckpointAtCurrentState=function(){originalSaveCheckpoint();if(activeCheckpoint)activeCheckpoint.modeGravity=modeGravity;};
const originalStartAttempt=startAttempt;
startAttempt=function(countNewAttempt=true) {
  activeTrail=[];
  trailTick=0;
  modeGravity=1;
  originalStartAttempt(countNewAttempt);
  if(isPracticeMode&&activeCheckpoint&&Number.isFinite(activeCheckpoint.modeGravity))modeGravity=activeCheckpoint.modeGravity;
  activeTrail.push({x:levelDistance,y:player.y+player.size/2});
};
const originalLoop=loop;
function drawPlayerTrail() {
  if(activeTrail.length<2) return;
  ctx.save(); ctx.beginPath();
  activeTrail.forEach((pt,i)=>{
    const sx=pt.x-levelDistance+160, sy=pt.y;
    if(i===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);
  });
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(0,229,255,.25)';ctx.lineWidth=10;ctx.shadowColor='#00e5ff';ctx.shadowBlur=14;ctx.stroke();
  ctx.strokeStyle='#e9fdff';ctx.lineWidth=3;ctx.shadowBlur=5;ctx.stroke();ctx.restore();
}
loop=function() {
  if(gameState==='PLAYING') {
    if(trailTick++%2===0) {
      activeTrail.push({x:levelDistance,y:player.y+player.size/2});
      if(activeTrail.length>1500)activeTrail.splice(0,300);
    }
  }
  originalLoop();
};
const oldDrawLevelElements=drawLevelElementsInWorld;
drawLevelElementsInWorld=function() { oldDrawLevelElements(); drawPlayerTrail(); };

// Add modes to editor palette and draw their portals using Canvas rings.
MODE_LIST.forEach(mode=>{
  if(mode==='cube'||mode==='ship')return;
  ASSET_PALETTE.push({id:'portal_'+mode,label:'PORTAL '+MODE_INFO[mode].name,color:MODE_INFO[mode].color});
});
const oldPlace=placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord=function(x,y) {
  if(editorSelectedItem && editorSelectedItem.indexOf('portal_')===0) {
    const type=editorSelectedItem.slice(7);
    editorDraft.portals.push({x,type,triggered:false});
    return;
  }
  oldPlace(x,y);
};
const oldEditorDraw=drawEditorCanvas;
drawEditorCanvas=function() {
  oldEditorDraw();
  editorDraft.portals.forEach(pt=>{
    const sx=pt.x-editorScrollX+80, cy=EDITOR_GROUND_Y-38;
    const color=portalColor(mapPortalMode(pt.type));
    const bg=eCtx.createLinearGradient(0,0,0,EDITOR_GROUND_Y);
    bg.addColorStop(0,document.getElementById('style-bg-top').value);
    bg.addColorStop(1,document.getElementById('style-bg-bottom').value);
    eCtx.save();
    // Apaga o retângulo antigo do editor e desenha o portal oval diretamente.
    eCtx.fillStyle=bg;eCtx.fillRect(sx-2,EDITOR_GROUND_Y-80,36,82);
    eCtx.shadowColor=color;eCtx.shadowBlur=12;eCtx.strokeStyle=color;eCtx.lineWidth=5;
    eCtx.beginPath();eCtx.ellipse(sx+16,cy,12,30,0,0,Math.PI*2);eCtx.stroke();
    eCtx.shadowBlur=4;eCtx.strokeStyle='#ffffff';eCtx.lineWidth=1.5;
    eCtx.beginPath();eCtx.ellipse(sx+16,cy,7,24,0,0,Math.PI*2);eCtx.stroke();
    eCtx.restore();
  });
};
renderEditorPalettes();

// === GARAGEM DE ÍCONES MULTIMODO ===
const originalRenderSkinUI=renderSkinUI;
let activeColorChannel='primary';
const MODE_SKIN_NAMES=[
  ['Classic','Edge','Hex','Diamond','Armor','Tech','Shield','Prism'],
  ['Glider','Arrow','Delta','Dart','Rocket','Blade','Wing','Phantom'],
  ['Orbit','Core','Gear','Split','Pulse','Hexa','Nova','Prism'],
  ['Classic UFO','Saucer','Scout','Disk','Mothership','Comet','Nova','Orbit'],
  ['Classic Wave','Bolt','Arrow','Zigzag','Pulse','Spike','Vortex','Flash'],
  ['Classic Bot','Mech','Droid','Guard','Titan','Scout','Core','Prime'],
  ['Classic Spider','Crawler','Arachnid','Stalker','Orb','Tarantula','Venom','Specter']
];
function syncPlayerSkinFromMode() {
  const selected=modeSkins[activeSkinMode];
  playerSkin.model=selected.model;
  playerSkin.primary=selected.primary;
  playerSkin.secondary=selected.secondary;
  if(typeof writeSaveData==='function')writeSaveData();
}
renderSkinUI=function() {
  const icon=document.getElementById('skin-btn-icon');
  if(icon){const ic=icon.getContext('2d');ic.clearRect(0,0,icon.width,icon.height);drawModeIcon(ic,activeSkinMode,4,4,36,0,modeSkins[activeSkinMode]);}
  const preview=document.getElementById('skin-preview');
  if(preview){const pc=preview.getContext('2d');pc.clearRect(0,0,preview.width,preview.height);drawModeIcon(pc,activeSkinMode,12,12,56,0,modeSkins[activeSkinMode]);}
};
function setActiveMode(mode) {
  if(!MODE_INFO[mode])return;
  activeSkinMode=mode;
  try{localStorage.setItem('gd_web_active_skin_mode',mode);}catch(_){}
  activeColorChannel='primary';
  syncPlayerSkinFromMode();
  renderModeGarage();
  renderSkinUI();
}
function renderModeGarage() {
  const garage=document.querySelector('#skin-garage .garage-box');
  if(!garage)return;
  let panel=document.getElementById('mode-skin-panel');
  if(!panel){
    panel=document.createElement('section');panel.id='mode-skin-panel';panel.className='mode-skin-panel';
    const preview=garage.querySelector('.preview-stage');
    preview.insertAdjacentElement('afterend',panel);
  }
  panel.replaceChildren();
  const modeIndex=MODE_LIST.indexOf(activeSkinMode);
  const skin=modeSkins[activeSkinMode];
  const head=document.createElement('div');head.className='skin-panel-head';
  const title=document.createElement('div');title.className='mode-skin-heading';title.textContent='GARAGEM DE ÍCONES';
  const subtitle=document.createElement('div');subtitle.className='mode-skin-subtitle';subtitle.textContent='Escolha o modo, o desenho e as cores';
  head.append(title,subtitle);panel.appendChild(head);

  const tabs=document.createElement('div');tabs.className='mode-skin-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Modo de jogo');
  MODE_LIST.forEach(mode=>{
    const b=document.createElement('button');b.type='button';b.className='mode-skin-tab'+(activeSkinMode===mode?' selected':'');
    b.setAttribute('role','tab');b.setAttribute('aria-selected',String(activeSkinMode===mode));b.textContent=MODE_INFO[mode].name;
    b.addEventListener('click',()=>setActiveMode(mode));tabs.appendChild(b);
  });
  panel.appendChild(tabs);

  const modelHeader=document.createElement('div');modelHeader.className='skin-section-heading';
  const modelTitle=document.createElement('span');modelTitle.textContent='DESENHO';
  const modelCount=document.createElement('span');modelCount.textContent=''+(skin.model+1)+' / 8';
  modelHeader.append(modelTitle,modelCount);panel.appendChild(modelHeader);
  const models=document.createElement('div');models.className='mode-skin-models';
  for(let i=0;i<8;i++){
    const b=document.createElement('button');b.type='button';b.className='mode-model'+(skin.model===i?' selected':'');
    b.setAttribute('aria-label',MODE_SKIN_NAMES[modeIndex][i]);b.setAttribute('aria-pressed',String(skin.model===i));
    const cv=document.createElement('canvas');cv.width=64;cv.height=64;
    drawModeIcon(cv.getContext('2d'),activeSkinMode,6,6,52,0,{...skin,model:i});
    const name=document.createElement('span');name.textContent=MODE_SKIN_NAMES[modeIndex][i];
    b.append(cv,name);
    b.addEventListener('click',()=>{
      skin.model=i;syncPlayerSkinFromMode();saveModeSkins();renderModeGarage();renderSkinUI();
    });
    models.appendChild(b);
  }
  panel.appendChild(models);

  const colorSection=document.createElement('div');colorSection.className='skin-color-section';
  const colorHead=document.createElement('div');colorHead.className='skin-section-heading';
  const colorTitle=document.createElement('span');colorTitle.textContent='PERSONALIZAR CORES';
  colorHead.appendChild(colorTitle);colorSection.appendChild(colorHead);
  const channelRow=document.createElement('div');channelRow.className='skin-channel-row';
  ['primary','secondary'].forEach((channel,index)=>{
    const b=document.createElement('button');b.type='button';b.className='skin-channel'+(activeColorChannel===channel?' selected':'');
    b.textContent=index===0?'COR 1':'COR 2';b.setAttribute('aria-pressed',String(activeColorChannel===channel));
    const dot=document.createElement('i');dot.style.background=skin[channel];b.prepend(dot);
    b.addEventListener('click',()=>{activeColorChannel=channel;renderModeGarage();});channelRow.appendChild(b);
  });
  colorSection.appendChild(channelRow);
  const palette=['#ffde00','#9dff00','#00e5ff','#ff0055','#ff7b00','#b5179e','#ffffff','#111827','#8b5cf6','#14b8a6','#f97316','#f8fafc','#60a5fa','#f472b6','#a3e635','#facc15'];
  const swatches=document.createElement('div');swatches.className='mode-color-row';
  palette.forEach(color=>{
    const b=document.createElement('button');b.type='button';b.className='mode-color-swatch'+(skin[activeColorChannel].toLowerCase()===color?' selected':'');
    b.style.background=color;b.title=color;b.setAttribute('aria-label','Selecionar '+color);
    b.addEventListener('click',()=>{
      skin[activeColorChannel]=color;syncPlayerSkinFromMode();saveModeSkins();renderModeGarage();renderSkinUI();
    });
    swatches.appendChild(b);
  });
  colorSection.appendChild(swatches);
  const customRow=document.createElement('label');customRow.className='skin-custom-color';
  const customLabel=document.createElement('span');customLabel.textContent='Cor personalizada';
  const picker=document.createElement('input');picker.type='color';picker.value=skin[activeColorChannel];
  picker.addEventListener('input',()=>{
    skin[activeColorChannel]=picker.value;syncPlayerSkinFromMode();saveModeSkins();renderSkinUI();
    swatches.querySelectorAll('.mode-color-swatch').forEach(b=>b.classList.remove('selected'));
  });
  customRow.append(customLabel,picker);colorSection.appendChild(customRow);
  panel.appendChild(colorSection);

  const footer=document.createElement('div');footer.className='skin-panel-footer';
  const reset=document.createElement('button');reset.type='button';reset.className='skin-reset-btn';reset.textContent='RESTAURAR CORES DO MODO';
  reset.addEventListener('click',()=>{
    skin.primary=MODE_INFO[activeSkinMode].color;skin.secondary=MODE_INFO[activeSkinMode].secondary;
    skin.model=0;syncPlayerSkinFromMode();saveModeSkins();renderModeGarage();renderSkinUI();
  });
  footer.appendChild(reset);panel.appendChild(footer);
}
const originalSetupGarage=setupGarage;
setupGarage=function(){originalSetupGarage();setActiveMode('cube');};
try{
  const storedMode=localStorage.getItem('gd_web_active_skin_mode');
  if(MODE_INFO[storedMode])activeSkinMode=storedMode;
}catch(_){}
MODE_LIST.forEach(mode=>{
  const skin=modeSkins[mode];
  skin.model=Math.max(0,Math.min(7,Math.floor(Number(skin.model)||0)));
  if(!/^#[0-9a-f]{6}$/i.test(skin.primary))skin.primary=MODE_INFO[mode].color;
  if(!/^#[0-9a-f]{6}$/i.test(skin.secondary))skin.secondary=MODE_INFO[mode].secondary;
});
// Migrate the legacy saved cube colors only when the new garage has no saved cube yet.
try{
  const saved=JSON.parse(localStorage.getItem(MODE_SKIN_KEY)||'{}');
  if(!saved.cube&&playerSkin){
    modeSkins.cube={model:Math.max(0,Math.min(7,Number(playerSkin.model)||0)),primary:playerSkin.primary||MODE_INFO.cube.color,secondary:playerSkin.secondary||MODE_INFO.cube.secondary};
  }
}catch(_){}
syncPlayerSkinFromMode();
saveModeSkins();
document.querySelectorAll('#skin-models,.color-section').forEach(el=>el.style.display='none');
renderModeGarage();
renderSkinUI();
// === EDITOR: SELEÇÃO, MOVER, HISTÓRICO, COPIAR/COLAR ===
function snapshotEditor() {
  if(editorHistoryLock||!editorDraft)return;
  editorUndoStack.push(JSON.stringify(editorDraft));
  if(editorUndoStack.length>80)editorUndoStack.shift();
  editorRedoStack.length=0;
}
function restoreEditorSnapshot(raw) {
  if(!raw)return;
  editorDraft=JSON.parse(raw);selectedEditorObject=null;
  syncStyleInputsFromDraft();drawEditorCanvas();
}
function undoEditor() {
  if(!editorUndoStack.length)return;
  editorRedoStack.push(JSON.stringify(editorDraft));
  restoreEditorSnapshot(editorUndoStack.pop());
}
function redoEditor() {
  if(!editorRedoStack.length)return;
  editorUndoStack.push(JSON.stringify(editorDraft));
  restoreEditorSnapshot(editorRedoStack.pop());
}
const trackedArrays=['spikes','platforms','blocks','pads','orbs','saws','pillars','coins','portals','triggers'];
function locateEditorObject(point) {
  let best=null,bestDist=Infinity;
  trackedArrays.forEach(key=>(editorDraft[key]||[]).forEach(obj=>{
    const x=(obj.x||0)+(obj.w||0)/2;
    let y=obj.y;
    if(y===undefined)y=(key==='spikes'||key==='pads'||key==='pillars')?GROUND_Y-22:GROUND_Y-90;
    const d=Math.hypot(point.x-x,point.y-y);
    if(d<bestDist&&d<62){bestDist=d;best={key,obj};}
  }));
  return best;
}
function addEditorToolbarButton(id,label,title) {
  const bar=document.querySelector('.editor-top-center');
  if(!bar||document.getElementById(id))return;
  const b=document.createElement('button');b.id=id;b.type='button';b.className='mini-btn';b.textContent=label;b.title=title||label;bar.appendChild(b);return b;
}
const selectToolBtn=addEditorToolbarButton('tool-select-btn','SELECIONAR','Selecionar e mover objetos');
const undoBtn=addEditorToolbarButton('editor-undo-btn','↶','Desfazer');
const redoBtn=addEditorToolbarButton('editor-redo-btn','↷','Refazer');
const copyBtn=addEditorToolbarButton('editor-copy-btn','COPIAR','Copiar objeto selecionado');
const pasteBtn=addEditorToolbarButton('editor-paste-btn','COLAR','Colar objeto copiado');
const exportBtn=addEditorToolbarButton('editor-export-btn','EXPORTAR','Exportar fase em JSON');
const importBtn=addEditorToolbarButton('editor-import-btn','IMPORTAR','Importar fase em JSON');
if(selectToolBtn)selectToolBtn.addEventListener('click',()=>{editorToolMode='select';syncEditorToolButtons();selectToolBtn.classList.add('active');});
if(undoBtn)undoBtn.addEventListener('click',undoEditor);
if(redoBtn)redoBtn.addEventListener('click',redoEditor);
if(copyBtn)copyBtn.addEventListener('click',()=>{if(selectedEditorObject)editorClipboard=JSON.parse(JSON.stringify(selectedEditorObject.obj));});
if(pasteBtn)pasteBtn.addEventListener('click',()=>{
  if(!editorClipboard||!selectedEditorObject)return;
  snapshotEditor();const key=selectedEditorObject.key;const clone=JSON.parse(JSON.stringify(editorClipboard));clone.x=(clone.x||0)+EDITOR_GRID;editorDraft[key].push(clone);selectedEditorObject={key,obj:clone};drawEditorCanvas();
});
function exportEditorLevel() {
  const blob=new Blob([JSON.stringify(editorDraft,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=(editorDraft.name||'fase').replace(/[^a-z0-9-_]/gi,'_')+'.json';a.click();URL.revokeObjectURL(url);
}
if(exportBtn)exportBtn.addEventListener('click',exportEditorLevel);
const importInput=document.createElement('input');importInput.type='file';importInput.accept='.json,application/json';importInput.hidden=true;document.body.appendChild(importInput);
if(importBtn)importBtn.addEventListener('click',()=>importInput.click());
importInput.addEventListener('change',async()=>{
  const file=importInput.files&&importInput.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!data||typeof data!=='object'||!Array.isArray(data.spikes)||!Number.isFinite(Number(data.finishX)))throw new Error('Arquivo de fase inválido');
    snapshotEditor();
    const fresh=createEmptyEditorDraft();
    editorDraft=Object.assign(fresh,data,{id:fresh.id,finishX:Math.max(1000,Math.min(1000000,Number(data.finishX)))});
    trackedArrays.forEach(k=>{if(!Array.isArray(editorDraft[k]))editorDraft[k]=[];});
    openEditorWithLevel(editorDraft);drawEditorCanvas();
  }catch(err){alert('Não foi possível importar: '+err.message);}
  importInput.value='';
});
const oldErase=eraseAtWorldCoord;
eraseAtWorldCoord=function(x,y){snapshotEditor();oldErase(x,y);};
const oldPlace2=placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord=function(x,y){snapshotEditor();oldPlace2(x,y);};
editorCanvas.addEventListener('pointerdown',e=>{
  if(gameState==='EDITOR'&&editorToolMode==='place'&&editorSelectedIt<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geometry Dash v1.2</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="900" height="500"></canvas>

        <!-- BARRA DE PROGRESSO + % + PRÁTICA -->
        <div id="hud" class="hidden">
            <div class="progress-wrapper">
                <div class="progress-bar-bg">
                    <div id="progress-fill"></div>
                </div>
                <span id="progress-text">0%</span>
                <button id="practice-toggle-btn" class="hud-chip" type="button" title="Modo Prática">PRÁTICA: OFF</button>
                <button id="checkpoint-btn" class="hud-chip hidden" type="button" title="Marcar Checkpoint">CKPT</button>
            </div>
            <button id="pause-menu-btn" title="Pausar">II</button>
        </div>

        <!-- MENU DE PAUSE -->
        <div id="pause-screen" class="overlay hidden">
            <div class="win-box">
                <h2>PAUSED</h2>
                <p id="pause-level-name">Spike Rush</p>
                <div class="win-buttons">
                    <button id="resume-btn" class="gd-btn green">▶</button>
                    <button id="pause-restart-btn" class="gd-btn yellow">↻</button>
                    <button id="pause-exit-menu-btn" class="gd-btn blue">MENU</button>
                </div>
            </div>
        </div>

        <!-- TELA INICIAL (MENU PRINCIPAL) -->
        <div id="main-menu" class="overlay">
            <button id="settings-btn" class="corner-settings-btn" aria-label="Configurações" title="Configurações">⚙</button>

            <div class="logo-container">
                <h1 class="gd-title">GEOMETRY<br><span>DASH</span></h1>
                <div class="version-badge">v1.2</div>
            </div>

            <div class="menu-buttons-row">
                <button id="skin-btn" class="side-btn" aria-label="Skins" title="Skins">
                    <canvas id="skin-btn-icon" width="44" height="44"></canvas>
                </button>

                <button id="play-btn" aria-label="Jogar" title="Jogar">
                    <div class="play-triangle"></div>
                </button>

                <button id="editor-btn" class="side-btn editor-main-btn" aria-label="Editor" title="Editor de Fases">
                    <span class="hammer-icon">🛠</span>
                </button>
            </div>
        </div>

        <!-- SUBMENU DO EDITOR: CRIAR OU CRIAÇÕES -->
        <div id="editor-hub" class="overlay hidden">
            <button id="back-from-editor-hub" class="corner-back-btn">←</button>

            <div class="editor-hub-box">
                <h2>EDITOR</h2>
                <p class="settings-subtitle">ESCOLHA UMA OPÇÃO</p>

                <div class="editor-hub-actions">
                    <button id="open-create-editor-btn" class="gd-btn green hub-action-btn" type="button">CRIAR</button>
                    <button id="open-creations-btn" class="gd-btn blue hub-action-btn" type="button">CRIAÇÕES</button>
                </div>
            </div>
        </div>

        <!-- LISTA DE CRIAÇÕES (JOGAR, EDITAR, RENOMEAR, DIFICULDADE, APAGAR) -->
        <div id="creations-screen" class="overlay hidden">
            <button id="back-from-creations" class="corner-back-btn">←</button>

            <div class="creations-box">
                <div class="creations-header">
                    <h2>CRIAÇÕES</h2>
                    <button id="creations-new-btn" class="gd-btn green small-gd-btn" type="button">+ NOVA</button>
                </div>

                <div id="creations-list" class="creations-list"></div>
            </div>
        </div>

        <!-- EDITOR DE FASES COMPLETO (GRID + PALETA + TRIGGERS + BG/GROUND + TESTE) -->
        <div id="level-editor" class="overlay hidden">
            <div class="editor-topbar">
                <div class="editor-top-left">
                    <button id="editor-exit-btn" class="mini-btn red" type="button">← SAIR</button>
                    <input id="editor-level-title" class="editor-title-input" type="text" maxlength="26" value="Minha Fase">
                    <select id="editor-level-diff" class="editor-select">
                        <option value="EASY">EASY</option>
                        <option value="NORMAL" selected>NORMAL</option>
                        <option value="HARD">HARD</option>
                        <option value="INSANE">INSANE</option>
                    </select>
                </div>

                <div class="editor-top-center">
                    <button id="tool-place-btn" class="mini-btn active" type="button">COLOCAR</button>
                    <button id="tool-erase-btn" class="mini-btn" type="button">APAGAR</button>
                    <button id="tool-pan-btn" class="mini-btn" type="button">MÃO / MOVER</button>
                    <button id="editor-grid-btn" class="mini-btn active" type="button">GRID: ON</button>
                    <button id="editor-clear-btn" class="mini-btn warn" type="button">LIMPAR</button>
                </div>

                <div class="editor-top-right">
                    <button id="editor-save-btn" class="mini-btn blue" type="button">SALVAR</button>
                    <button id="editor-test-btn" class="mini-btn green" type="button">▶ TESTAR</button>
                </div>
            </div>

            <div class="editor-main-area">
                <canvas id="editorCanvas" width="900" height="330"></canvas>
            </div>

            <div class="editor-bottom-panel">
                <div class="editor-tabs">
                    <button class="editor-tab active" data-tab="assets" type="button">ASSETS</button>
                    <button class="editor-tab" data-tab="triggers" type="button">TRIGGERS</button>
                    <button class="editor-tab" data-tab="style" type="button">BG / GROUND</button>
                </div>

                <div id="editor-panel-assets" class="editor-tab-content">
                    <div id="editor-palette" class="editor-palette"></div>
                </div>

                <div id="editor-panel-triggers" class="editor-tab-content hidden">
                    <div id="editor-triggers-palette" class="editor-palette"></div>
                </div>

                <div id="editor-panel-style" class="editor-tab-content hidden">
                    <div class="style-controls-grid">
                        <label class="style-control">
                            <span>BG TOPO</span>
                            <input id="style-bg-top" type="color" value="#1e1b4b">
                        </label>
                        <label class="style-control">
                            <span>BG BASE</span>
                            <input id="style-bg-bottom" type="color" value="#4338ca">
                        </label>
                        <label class="style-control">
                            <span>GROUND</span>
                            <input id="style-ground-fill" type="color" value="#110e2e">
                        </label>
                        <label class="style-control">
                            <span>GRID CHÃO</span>
                            <input id="style-ground-grid" type="color" value="#3730a3">
                        </label>
                        <label class="style-control">
                            <span>TAMANHO (X)</span>
                            <input id="style-finish-x" type="range" min="2200" max="1000000" step="100" value="4400">
                            <span id="style-finish-label">4400</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- CONFIGURAÇÕES (PC / CELULAR) -->
        <div id="settings-screen" class="overlay hidden">
            <button id="back-from-settings" class="corner-back-btn">←</button>

            <div class="settings-box">
                <h2>CONFIGURAÇÕES</h2>
                <p class="settings-subtitle">PLATAFORMA / CONTROLE</p>

                <div class="platform-toggle">
                    <button id="mode-pc-btn" class="platform-btn selected" type="button">PC</button>
                    <button id="mode-mobile-btn" class="platform-btn" type="button">CELULAR</button>
                </div>

                <p id="platform-hint" class="platform-hint">Modo PC: clique/espaço para pular/voar e botão II para pausar.</p>
                <div class="low-performance-setting"><strong>DESEMPENHO</strong><span id="low-performance-status">Desativado no modo PC.</span><small>Ao selecionar CELULAR, o jogo reduz automaticamente os efeitos visuais e partículas.</small></div>
            </div>
        </div>

        <!-- SELEÇÃO DE FASES -->
        <div id="level-select" class="overlay hidden">
            <button id="back-from-levels" class="corner-back-btn">←</button>
            
            <div class="level-carousel">
                <button id="prev-level" class="arrow-btn">‹</button>
                
                <div id="level-card" class="level-card">
                    <div class="level-header">
                        <div class="difficulty-face" id="level-diff-face"></div>
                        <div class="level-title-group">
                            <h2 id="level-name">Spike Rush</h2>
                            <div class="level-stats">
                                <span id="level-diff-text">EASY • RECORDE: 0% • ATT: 0</span>
                                <span id="level-stars">☆ 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button id="next-level" class="arrow-btn">›</button>
            </div>
            <p class="hint-text">Clique no cartão da fase para iniciar</p>
        </div>

        <!-- GARAGEM DE SKINS -->
        <div id="skin-garage" class="overlay hidden">
            <button id="back-from-skins" class="corner-back-btn">←</button>
            
            <div class="garage-box">
                <h2>ICON KIT</h2>
                
                <div class="preview-stage">
                    <canvas id="skin-preview" width="80" height="80"></canvas>
                </div>

                <div class="skin-row" id="skin-models"></div>

                <div class="color-section">
                    <span>COR 1</span>
                    <div class="color-row" id="primary-colors"></div>
                </div>

                <div class="color-section">
                    <span>COR 2</span>
                    <div class="color-row" id="secondary-colors"></div>
                </div>
            </div>
        </div>

        <!-- TELA DE VITÓRIA (LEVEL COMPLETE) -->
        <div id="win-screen" class="overlay hidden">
            <div class="win-box">
                <h2>LEVEL COMPLETE!</h2>
                <p id="win-level-name">Spike Rush • 100%</p>
                <div class="win-buttons">
                    <button id="replay-btn" class="gd-btn green">↻</button>
                    <button id="win-menu-btn" class="gd-btn blue">MENU</button>
                </div>
            </div>
        </div>
        <div id="game-resize-handle" aria-label="Redimensionar janela do jogo" title="Arraste para redimensionar"></div>
    </div>

    <script src="script.js"></script>
    <script src="enhancements.js"></script>
    <script src="editor-expansion.js"></script>
</body>
</html>const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const editorCanvas = document.getElementById('editorCanvas');
const eCtx = editorCanvas.getContext('2d');
const gameContainer = document.getElementById('game-container');

// Elementos de UI
const hud = document.getElementById('hud');
const pauseMenuBtn = document.getElementById('pause-menu-btn');
const practiceToggleBtn = document.getElementById('practice-toggle-btn');
const checkpointBtn = document.getElementById('checkpoint-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const mainMenu = document.getElementById('main-menu');
const editorHub = document.getElementById('editor-hub');
const creationsScreen = document.getElementById('creations-screen');
const levelEditor = document.getElementById('level-editor');
const settingsScreen = document.getElementById('settings-screen');
const levelSelect = document.getElementById('level-select');
const skinGarage = document.getElementById('skin-garage');
const pauseScreen = document.getElementById('pause-screen');
const winScreen = document.getElementById('win-screen');

// Estados: 'MENU', 'EDITOR_HUB', 'CREATIONS', 'EDITOR', 'SETTINGS', 'LEVEL_SELECT', 'SKINS', 'PLAYING', 'DEAD', 'PAUSED', 'ENDING_ANIM', 'WIN'
let gameState = 'MENU';
let stateBeforePause = 'PLAYING';
let isTestingFromEditor = false;
let deadRemainingMs = 0;
let deadStartedAt = 0;

// Modo do jogador ('cube' | 'ship')
let playerMode = 'cube';

// Modo Prática e Checkpoints
let isPracticeMode = false;
let checkpoints = [];
let activeCheckpoint = null;
let lastAutoCheckpointDist = -9999;
const AUTO_CHECKPOINT_STEP = 550;

// Timer para segurar 5 segundos no toque e ir para o pause
const HOLD_PAUSE_MS = 5000;
let holdPauseTimer = null;

// Física do Cubo
const GRAVITY = 0.95;
const JUMP_FORCE = -14.8;

// Física do Hoverboard (Ship)
const SHIP_LIFT = -0.68;
const SHIP_GRAVITY = 0.56;
const SHIP_MAX_FALL = 7.5;
const SHIP_MAX_RISE = -7.2;
const CEILING_Y = 48;

// Impulsos de Pads e Orbs
const PAD_YELLOW_FORCE = -19.5;
const PAD_PINK_FORCE = -24.5;
const ORB_YELLOW_FORCE = -17.5;
const ORB_PINK_FORCE = -22.5;

// Dimensões gerais
const GROUND_Y = 390;
const BASE_GAME_SPEED = 7.2;
let currentGameSpeed = BASE_GAME_SPEED;
let gravityMultiplier = 1;
const BLOCK_SIZE = 44;
const MINI_SPIKE_H = 26;
const MINI_SPIKE_W = 36;
const PORTAL_WIDTH = 56;
const PORTAL_HEIGHT = 122;
const RESPAWN_DELAY_MS = 1200;

let bgScroll = 0;
let groundScroll = 0;
let levelDistance = 0;
let isHoldingJump = false;
let jumpJustPressed = false;
let particles = [];
let winFlashAlpha = 0;
let screenShake = 0;
let respawnTimer = null;

// Cores dinâmicas alteráveis por triggers durante a fase
let runtimeBgTop = null;
let runtimeBgBottom = null;
let runtimeGroundFill = null;
let runtimeGroundGrid = null;

// === ÁUDIO SINTÉTICO (Web Audio API - zero assets externos necessários) ===
let audioCtx = null;
function playSfx(type) {
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'pad') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'portal') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(980, now);
            osc.frequency.setValueAtTime(1320, now + 0.06);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'death') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(52, now + 0.25);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) {}
}

// === ROSTOS DE DIFICULDADE (Assets/) ===
const DIFFICULTY_FACES = {
    azul: 'Assets/cara_azul.png',
    verde: 'Assets/cara_verde.png'
};

// === IMAGENS DOS PORTAIS (Assets/) ===
const PORTAL_IMAGES = {
    cube: new Image(),
    ship: new Image()
};
PORTAL_IMAGES.cube.src = 'Assets/Portal Cubo.png';
PORTAL_IMAGES.ship.src = 'Assets/Portal Ship.png';

// === SISTEMA DE SALVAMENTO LOCAL (localStorage) ===
const STORAGE_KEY = 'gd_web_save_v07';

function loadSaveData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Erro ao carregar save local:', e);
    }
    return {
        platform: 'pc',
        skin: { model: 0, primary: '#ffde00', secondary: '#00e5ff' },
        progress: {},
        attempts: {},
        customLevels: []
    };
}

function writeSaveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            platform: controlPlatform,
            skin: playerSkin,
            progress: levelProgress,
            attempts: levelAttempts,
            customLevels: customLevels
        }));
    } catch (e) {
        console.warn('Erro ao salvar no navegador:', e);
    }
}

const savedData = loadSaveData();
let controlPlatform = savedData.platform === 'mobile' ? 'mobile' : 'pc';
let lowPerformanceMode = controlPlatform === 'mobile';
let playerSkin = savedData.skin || { model: 0, primary: '#ffde00', secondary: '#00e5ff' };
let levelProgress = savedData.progress || {};
let levelAttempts = savedData.attempts || {};
let customLevels = Array.isArray(savedData.customLevels) ? savedData.customLevels : [];

const COLORS = ['#ffde00', '#7fff00', '#00e5ff', '#ff0055', '#ff7b00', '#b5179e', '#ffffff'];

// Fases oficiais do jogo
const LEVELS = [
    {
        name: 'Spike Rush',
        difficulty: 'EASY',
        stars: 1,
        faceKey: 'azul',
        bgTop: '#0038a8',
        bgBottom: '#0066ff',
        groundFill: '#001d5c',
        groundGrid: '#0044cc',
        finishX: 3400,
        spikes: [
            { x: 760, sizeType: 'normal' },
            { x: 1120, sizeType: 'mini' },
            { x: 1520, sizeType: 'normal' },
            { x: 1960, sizeType: 'mini' },
            { x: 2000, sizeType: 'mini' },
            { x: 2480, sizeType: 'normal' },
            { x: 2940, sizeType: 'mini' }
        ],
        platforms: [
            { x: 1260, y: GROUND_Y - 56, w: 132, h: 28 },
            { x: 2140, y: GROUND_Y - 72, w: 150, h: 28 }
        ],
        pads: [
            { x: 960, color: 'yellow', cooldown: 0 },
            { x: 2700, color: 'pink', cooldown: 0 }
        ],
        orbs: [
            { x: 1740, y: GROUND_Y - 92, color: 'yellow', used: false },
            { x: 2310, y: GROUND_Y - 115, color: 'pink', used: false }
        ],
        saws: [],
        pillars: [],
        coins: [{ x: 1840, y: GROUND_Y - 140, collected: false }],
        triggers: [],
        portals: []
    },
    {
        name: 'Emerald Pulse',
        difficulty: 'NORMAL',
        stars: 2,
        faceKey: 'verde',
        bgTop: '#064e2b',
        bgBottom: '#139a56',
        groundFill: '#042b18',
        groundGrid: '#0c6b3b',
        finishX: 4300,
        spikes: [
            { x: 740, sizeType: 'normal' },
            { x: 1120, sizeType: 'mini' },
            { x: 1160, sizeType: 'mini' },
            { x: 1720, sizeType: 'normal' },
            { x: 2040, sizeType: 'mini' },
            { x: 2780, sizeType: 'normal' },
            { x: 3220, sizeType: 'mini' },
            { x: 3260, sizeType: 'mini' },
            { x: 3740, sizeType: 'normal' }
        ],
        platforms: [
            { x: 920, y: GROUND_Y - 56, w: 120, h: 28 },
            { x: 1890, y: GROUND_Y - 140, w: 140, h: 28 },
            { x: 2950, y: GROUND_Y - 64, w: 140, h: 28 }
        ],
        pads: [
            { x: 1260, color: 'yellow', cooldown: 0 },
            { x: 2560, color: 'pink', cooldown: 0 }
        ],
        orbs: [
            { x: 1580, y: GROUND_Y - 110, color: 'yellow', used: false },
            { x: 2190, y: GROUND_Y - 125, color: 'pink', used: false },
            { x: 3480, y: GROUND_Y - 105, color: 'yellow', used: false }
        ],
        saws: [{ x: 1620, y: GROUND_Y - 165, r: 22, angle: 0 }],
        pillars: [{ x: 2680, h: 90, w: 34 }],
        coins: [{ x: 1960, y: GROUND_Y - 190, collected: false }],
        triggers: [
            { x: 1400, kind: 'bg', bgTop: '#0b2545', bgBottom: '#134074', triggered: false },
            { x: 2400, kind: 'bg', bgTop: '#064e2b', bgBottom: '#139a56', triggered: false }
        ],
        portals: [
            { x: 1420, type: 'ship', triggered: false },
            { x: 2420, type: 'cube', triggered: false }
        ]
    }
];

let activePlayableLevel = LEVELS[0];
let currentLevelIndex = 0;

function applyPlatformSettingsUI() {
    lowPerformanceMode = controlPlatform === 'mobile';
    const lowHint = document.getElementById('low-performance-status');
    if (lowHint) lowHint.textContent = lowPerformanceMode ? 'ATIVADO — efeitos reduzidos para melhorar o desempenho.' : 'Desativado no modo PC.';
    const pcBtn = document.getElementById('mode-pc-btn');
    const mobileBtn = document.getElementById('mode-mobile-btn');
    const hint = document.getElementById('platform-hint');

    if (controlPlatform === 'mobile') {
        pcBtn.classList.remove('selected');
        mobileBtn.classList.add('selected');
        pauseMenuBtn.classList.add('hidden');
        gameContainer.classList.add('mobile-ui-drag');
        hint.textContent = 'Modo Celular: toque para pular/voar, arraste na UI para ver tudo e segure por 5s para ir ao pause.';
    } else {
        controlPlatform = 'pc';
        mobileBtn.classList.remove('selected');
        pcBtn.classList.add('selected');
        pauseMenuBtn.classList.remove('hidden');
        gameContainer.classList.remove('mobile-ui-drag');
        hint.textContent = 'Modo PC: clique/espaço para pular/voar e botão II para pausar.';
    }
}

function setPlatformMode(mode) {
    controlPlatform = mode === 'mobile' ? 'mobile' : 'pc';
    clearHoldPauseTimer();
    applyPlatformSettingsUI();
    writeSaveData();
}

// === ARRASTAR UI APENAS NO MODO CELULAR ===
function setupMobileUiDrag() {
    const scrollableSelectors = '.overlay, .creations-list, .editor-topbar, .editor-tab-content';

    document.querySelectorAll(scrollableSelectors).forEach(el => {
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let startScrollLeft = 0;
        let startScrollTop = 0;

        el.addEventListener('pointerdown', (e) => {
            if (controlPlatform !== 'mobile') return;
            if (e.target.closest('button, input, select, canvas')) return;
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            startScrollLeft = el.scrollLeft;
            startScrollTop = el.scrollTop;
        });

        el.addEventListener('pointermove', (e) => {
            if (!dragging || controlPlatform !== 'mobile') return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            el.scrollLeft = startScrollLeft - dx;
            el.scrollTop = startScrollTop - dy;
        });

        const stopDrag = () => {
            dragging = false;
            if (moved) {
                setTimeout(() => { moved = false; }, 0);
            }
        };

        el.addEventListener('pointerup', stopDrag);
        el.addEventListener('pointercancel', stopDrag);
    });
}

function updatePracticeUI() {
    practiceToggleBtn.textContent = isPracticeMode ? 'PRÁTICA: ON' : 'PRÁTICA: OFF';
    practiceToggleBtn.classList.toggle('active', isPracticeMode);
    checkpointBtn.classList.toggle('hidden', !isPracticeMode);
}

function saveCheckpointAtCurrentState() {
    if (!isPracticeMode || gameState !== 'PLAYING') return;
    activeCheckpoint = {
        levelDistance,
        playerY: player.y,
        playerDy: player.dy,
        playerRotation: player.rotation,
        playerGrounded: player.grounded,
        playerMode,
        currentGameSpeed,
        gravityMultiplier,
        runtimeBgTop,
        runtimeBgBottom,
        runtimeGroundFill,
        runtimeGroundGrid,
        portalsTriggered: activePortals.map(pt => pt.triggered),
        orbsUsed: activeOrbs.map(o => o.used),
        coinsCollected: activeCoins.map(c => c.collected),
        triggersFired: activeTriggers.map(t => t.triggered)
    };
    checkpoints.push({ levelDistance, y: player.y });
    spawnEndParticles(player.x, player.y, 10, true);
}

function setPracticeMode(enabled) {
    isPracticeMode = Boolean(enabled);
    if (!isPracticeMode) {
        activeCheckpoint = null;
        checkpoints = [];
    } else if (gameState === 'PLAYING' && !activeCheckpoint) {
        saveCheckpointAtCurrentState();
    }
    updatePracticeUI();
}

function clearRespawnTimer() {
    if (respawnTimer) {
        clearTimeout(respawnTimer);
        respawnTimer = null;
    }
    deadRemainingMs = 0;
}

function clearHoldPauseTimer() {
    if (holdPauseTimer) {
        clearTimeout(holdPauseTimer);
        holdPauseTimer = null;
    }
}

function startHoldPauseTimer() {
    if (controlPlatform !== 'mobile') return;
    clearHoldPauseTimer();
    holdPauseTimer = setTimeout(() => {
        isHoldingJump = false;
        pauseCurrentGame();
    }, HOLD_PAUSE_MS);
}

function scheduleRespawn(delayMs) {
    clearRespawnTimer();
    deadRemainingMs = delayMs;
    deadStartedAt = Date.now();
    respawnTimer = setTimeout(() => {
        if (gameState === 'DEAD') {
            startAttempt(false);
        }
    }, delayMs);
}

function recordBestProgress(levelName, percent) {
    if (isPracticeMode || isTestingFromEditor) return;
    const cleanPercent = Math.min(100, Math.max(0, Math.floor(percent)));
    const prev = levelProgress[levelName] || 0;
    if (cleanPercent > prev) {
        levelProgress[levelName] = cleanPercent;
        writeSaveData();
    }
}

function incrementAttempt(levelName) {
    if (isTestingFromEditor) return 1;
    const current = levelAttempts[levelName] || 0;
    levelAttempts[levelName] = current + 1;
    writeSaveData();
    return levelAttempts[levelName];
}

function resetAttemptsForLevel(levelName) {
    if (isTestingFromEditor) return;
    levelAttempts[levelName] = 0;
    writeSaveData();
}

// === PORTAIS (Assets/Portal Cubo.png e Assets/Portal Ship.png) ===
function drawPortal(portal, screenX) {
    if (screenX + PORTAL_WIDTH < -70 || screenX > canvas.width + 70) return;

    const isCubePortal = portal.type === 'cube';
    const img = isCubePortal ? PORTAL_IMAGES.cube : PORTAL_IMAGES.ship;
    const drawY = GROUND_Y - PORTAL_HEIGHT;

    ctx.save();
    if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, screenX, drawY, PORTAL_WIDTH, PORTAL_HEIGHT);
    } else {
        const centerX = screenX + PORTAL_WIDTH / 2;
        const centerY = drawY + PORTAL_HEIGHT / 2;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = isCubePortal ? '#38b000' : '#0096ff';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, PORTAL_WIDTH / 2, PORTAL_HEIGHT / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function checkPortalTrigger(p, portal, portalScreenX) {
    if (portal.triggered) return;

    const portalTop = GROUND_Y - PORTAL_HEIGHT;
    const portalBottom = GROUND_Y;

    const overlaps =
        p.x + p.size > portalScreenX + 6 &&
        p.x < portalScreenX + PORTAL_WIDTH - 6 &&
        p.y + p.size > portalTop &&
        p.y < portalBottom;

    if (overlaps) {
        portal.triggered = true;
        const nextMode = portal.type === 'ship' ? 'ship' : 'cube';
        if (nextMode !== playerMode) {
            playerMode = nextMode;
            playSfx('portal');
            if (playerMode === 'ship') {
                p.dy = Math.min(p.dy, -3);
                p.grounded = false;
            } else {
                p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
            }
            spawnEndParticles(portalScreenX + PORTAL_WIDTH / 2, p.y + p.size / 2, 16, true);
        }
    }
}

// === PADS DE PULO (AMARELO E ROSA) ===
function drawPad(pad, screenX) {
    const w = 36;
    const h = 11;
    const y = GROUND_Y - h;
    if (screenX + w < -40 || screenX > canvas.width + 40) return;

    const isPink = pad.color === 'pink';
    const mainColor = isPink ? '#ff4fd8' : '#ffe600';
    const glowColor = isPink ? 'rgba(255, 79, 216, 0.35)' : 'rgba(255, 230, 0, 0.35)';

    ctx.save();
    ctx.fillStyle = glowColor;
    ctx.fillRect(screenX - 4, y - 8, w + 8, h + 10);

    ctx.fillStyle = mainColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(screenX, y, w, h, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function checkPadCollision(p, pad, screenX) {
    if (pad.cooldown > 0) {
        pad.cooldown--;
        return;
    }
    const w = 36;
    const h = 14;
    const padTop = GROUND_Y - h;

    const overlaps =
        p.x + p.size > screenX + 3 &&
        p.x < screenX + w - 3 &&
        p.y + p.size >= padTop &&
        p.y < GROUND_Y;

    if (overlaps) {
        pad.cooldown = 12;
        playerMode = 'cube';
        p.dy = pad.color === 'pink' ? PAD_PINK_FORCE : PAD_YELLOW_FORCE;
        p.grounded = false;
        playSfx('pad');
        spawnEndParticles(screenX + w / 2, padTop, 10, true);
    }
}

// === ORBS DE PULO (AMARELO E ROSA) ===
function drawOrb(orb, screenX) {
    const radius = 17;
    if (screenX + radius * 2 < -40 || screenX - radius * 2 > canvas.width + 40) return;

    const isPink = orb.color === 'pink';
    const outerColor = isPink ? '#ff4fd8' : '#ffe600';
    const innerColor = isPink ? '#ffd1f5' : '#fff8b8';

    ctx.save();
    ctx.globalAlpha = orb.used ? 0.45 : 1;

    ctx.fillStyle = isPink ? 'rgba(255, 79, 216, 0.25)' : 'rgba(255, 230, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(screenX, orb.y, radius + 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = outerColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, orb.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(screenX, orb.y, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function checkOrbTrigger(p, orb, screenX) {
    if (orb.used) return;
    if (!isHoldingJump && !jumpJustPressed) return;

    const pcx = p.x + p.size / 2;
    const pcy = p.y + p.size / 2;
    const dx = pcx - screenX;
    const dy = pcy - orb.y;
    const hitDist = p.size * 0.65 + 18;

    if (dx * dx + dy * dy <= hitDist * hitDist) {
        orb.used = true;
        jumpJustPressed = false;
        playerMode = 'cube';
        p.dy = orb.color === 'pink' ? ORB_PINK_FORCE : ORB_YELLOW_FORCE;
        p.grounded = false;
        playSfx('pad');
        spawnEndParticles(screenX, orb.y, 12, true);
    }
}

// === PLATAFORMAS (BLOCOS SÓLIDOS) ===
function drawPlatform(plat, screenX) {
    if (screenX + plat.w < -60 || screenX > canvas.width + 60) return;

    ctx.save();
    ctx.fillStyle = '#18376b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.fillRect(screenX, plat.y, plat.w, plat.h);
    ctx.strokeRect(screenX, plat.y, plat.w, plat.h);

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 3, plat.y + 3, plat.w - 6, plat.h - 6);
    ctx.restore();
}

function handlePlatformCollision(p, plat, screenX) {
    const prevBottom = p.prevY + p.size;
    const currBottom = p.y + p.size;
    const horizOverlap = p.x + p.size - 5 > screenX && p.x + 5 < screenX + plat.w;

    if (!horizOverlap) return false;

    if (p.dy >= 0 && prevBottom <= plat.y + 10 && currBottom >= plat.y) {
        p.y = plat.y - p.size;
        p.dy = 0;
        p.grounded = true;
        if (playerMode === 'cube') {
            p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
        }
        return false;
    }

    const vertOverlap = p.y + p.size - 6 > plat.y && p.y + 6 < plat.y + plat.h;
    if (vertOverlap && p.x + p.size > screenX + 4 && p.x < screenX + plat.w - 4) {
        triggerDeath();
        return true;
    }

    return false;
}

// === ASSETS EXTRA v0.7: SERRAS, PILARES DECORATIVOS, MOEDAS E TRIGGERS ===
function drawSaw(saw, screenX) {
    const r = saw.r || 22;
    if (screenX + r * 2 < -50 || screenX - r * 2 > canvas.width + 50) return;

    ctx.save();
    ctx.translate(screenX, saw.y);
    ctx.rotate(saw.angle || 0);

    const teeth = 10;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
        const rad = i % 2 === 0 ? r + 6 : r - 3;
        const a = (i * Math.PI) / teeth;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff0055';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function checkSawCollision(p, saw, screenX) {
    const r = (saw.r || 22) * 0.72;
    const pcx = p.x + p.size / 2;
    const pcy = p.y + p.size / 2;
    const dx = pcx - screenX;
    const dy = pcy - saw.y;
    const minDist = r + p.size * 0.36;
    return dx * dx + dy * dy <= minDist * minDist;
}

function drawPillar(pillar, screenX) {
    const w = pillar.w || 34;
    const h = pillar.h || 90;
    if (screenX + w < -50 || screenX > canvas.width + 50) return;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 2;
    ctx.fillRect(screenX, GROUND_Y - h, w, h);
    ctx.strokeRect(screenX, GROUND_Y - h, w, h);
    ctx.restore();
}

function drawCoin(coin, screenX) {
    if (coin.collected) return;
    const r = 13;
    if (screenX + r * 2 < -40 || screenX - r * 2 > canvas.width + 40) return;

    ctx.save();
    ctx.fillStyle = '#ffd60a';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(screenX, coin.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(screenX - 3, coin.y - 3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function checkCoinTrigger(p, coin, screenX) {
    if (coin.collected) return;
    const pcx = p.x + p.size / 2;
    const pcy = p.y + p.size / 2;
    const dx = pcx - screenX;
    const dy = pcy - coin.y;
    const hitDist = p.size * 0.55 + 14;
    if (dx * dx + dy * dy <= hitDist * hitDist) {
        coin.collected = true;
        playSfx('coin');
        spawnEndParticles(screenX, coin.y, 12, true);
    }
}

function drawTriggerMarker(trig, screenX) {
    if (screenX < -50 || screenX > canvas.width + 50) return;
    const labelMap = {
        speed_fast: '1.25x',
        speed_normal: '1.0x',
        bg: 'BG',
        shake: 'SHK',
        low_grav: 'LOWG',
        norm_grav: 'NORMG'
    };
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, GROUND_Y - 120, 28, 120);
    ctx.fillRect(screenX, GROUND_Y - 120, 28, 120);

    ctx.font = '900 9px Orbitron, sans-serif';
    ctx.fillStyle = '#ffe600';
    ctx.textAlign = 'center';
    ctx.fillText(labelMap[trig.kind] || 'TRG', screenX + 14, GROUND_Y - 126);
    ctx.restore();
}

function checkTriggerActivation(p, trig, screenX) {
    if (trig.triggered) return;
    if (p.x + p.size >= screenX) {
        trig.triggered = true;
        if (trig.kind === 'speed_fast') {
            currentGameSpeed = BASE_GAME_SPEED * 1.25;
        } else if (trig.kind === 'speed_normal') {
            currentGameSpeed = BASE_GAME_SPEED;
        } else if (trig.kind === 'bg') {
            runtimeBgTop = trig.bgTop || '#311042';
            runtimeBgBottom = trig.bgBottom || '#7209b7';
        } else if (trig.kind === 'shake') {
            screenShake = 12;
        } else if (trig.kind === 'low_grav') {
            gravityMultiplier = 0.65;
        } else if (trig.kind === 'norm_grav') {
            gravityMultiplier = 1;
        }
    }
}

// Desenha o cubo em qualquer canvas
function drawCubeSkin(targetCtx, x, y, size, rotation, skin) {
    targetCtx.save();
    targetCtx.translate(x + size / 2, y + size / 2);
    targetCtx.rotate(rotation);

    const scale = size / 44;
    targetCtx.scale(scale, scale);

    targetCtx.fillStyle = skin.primary;
    targetCtx.fillRect(-22, -22, 44, 44);
    targetCtx.lineWidth = 3.5;
    targetCtx.strokeStyle = '#000';
    targetCtx.strokeRect(-22, -22, 44, 44);

    targetCtx.fillStyle = skin.secondary;
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = 2;

    if (skin.model === 0) {
        targetCtx.fillRect(-13, -12, 9, 9);
        targetCtx.strokeRect(-13, -12, 9, 9);
        targetCtx.fillRect(4, -12, 9, 9);
        targetCtx.strokeRect(4, -12, 9, 9);
        targetCtx.fillRect(-13, 4, 26, 8);
        targetCtx.strokeRect(-13, 4, 26, 8);
    } else if (skin.model === 1) {
        targetCtx.fillRect(-12, -11, 8, 8);
        targetCtx.strokeRect(-12, -11, 8, 8);
        targetCtx.fillRect(4, -11, 8, 8);
        targetCtx.strokeRect(4, -11, 8, 8);
        targetCtx.fillRect(-6, -2, 12, 14);
        targetCtx.strokeRect(-6, -2, 12, 14);
    } else if (skin.model === 2) {
        targetCtx.beginPath();
        targetCtx.moveTo(0, -14);
        targetCtx.lineTo(14, 0);
        targetCtx.lineTo(0, 14);
        targetCtx.lineTo(-14, 0);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();
    } else {
        targetCtx.fillRect(-15, -9, 30, 10);
        targetCtx.strokeRect(-15, -9, 30, 10);
        targetCtx.fillRect(-8, 6, 16, 5);
        targetCtx.strokeRect(-8, 6, 16, 5);
    }

    targetCtx.restore();
}

// Hoverboard estilizado usando apenas as cores da skin e o cubo encaixado
function drawShipPlayer(targetCtx, x, y, size, dy, skin) {
    const cx = x + size / 2;
    const cy = y + size / 2 + 4;
    const tilt = Math.max(-0.45, Math.min(0.45, dy * 0.048));

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate(tilt);

    if (isHoldingJump && gameState === 'PLAYING') {
        const flameLen = 14 + Math.random() * 10;
        targetCtx.fillStyle = '#ff6a00';
        targetCtx.strokeStyle = '#000';
        targetCtx.lineWidth = 2;
        targetCtx.beginPath();
        targetCtx.moveTo(-26, 4);
        targetCtx.lineTo(-26 - flameLen, 9);
        targetCtx.lineTo(-26, 14);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.stroke();

        targetCtx.fillStyle = '#ffe600';
        targetCtx.beginPath();
        targetCtx.moveTo(-26, 6);
        targetCtx.lineTo(-26 - flameLen * 0.6, 9);
        targetCtx.lineTo(-26, 12);
        targetCtx.closePath();
        targetCtx.fill();
    }

    const cubeSize = 28;
    drawCubeSkin(targetCtx, -cubeSize / 2 + 1, -24, cubeSize, 0, skin);

    targetCtx.lineJoin = 'round';
    targetCtx.lineCap = 'round';

    targetCtx.fillStyle = skin.secondary;
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = 3.2;
    targetCtx.beginPath();
    targetCtx.moveTo(-30, -2);
    targetCtx.lineTo(-10, 4);
    targetCtx.lineTo(14, 2);
    targetCtx.lineTo(34, 9);
    targetCtx.lineTo(22, 18);
    targetCtx.lineTo(-22, 18);
    targetCtx.lineTo(-32, 9);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = skin.primary;
    targetCtx.lineWidth = 2.4;
    targetCtx.beginPath();
    targetCtx.moveTo(-20, 6);
    targetCtx.lineTo(16, 6);
    targetCtx.lineTo(22, 11);
    targetCtx.lineTo(-18, 11);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    targetCtx.beginPath();
    targetCtx.moveTo(-12, -2);
    targetCtx.lineTo(12, -2);
    targetCtx.lineTo(16, 3);
    targetCtx.lineTo(-10, 3);
    targetCtx.closePath();
    targetCtx.fill();

    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.moveTo(14, 4);
    targetCtx.lineTo(29, 8.5);
    targetCtx.stroke();

    targetCtx.restore();
}

// Jogador Principal
const player = {
    x: 160,
    y: GROUND_Y - BLOCK_SIZE,
    prevY: GROUND_Y - BLOCK_SIZE,
    size: BLOCK_SIZE,
    dy: 0,
    grounded: true,
    rotation: 0,

    reset() {
        this.x = 160;
        this.y = GROUND_Y - this.size;
        this.prevY = this.y;
        this.dy = 0;
        this.grounded = true;
        this.rotation = 0;
    },

    update() {
        this.prevY = this.y;

        if (playerMode === 'ship') {
            if (isHoldingJump) {
                this.dy += SHIP_LIFT * gravityMultiplier;
            } else {
                this.dy += SHIP_GRAVITY * gravityMultiplier;
            }

            if (this.dy < SHIP_MAX_RISE) this.dy = SHIP_MAX_RISE;
            if (this.dy > SHIP_MAX_FALL) this.dy = SHIP_MAX_FALL;

            this.y += this.dy;
            this.grounded = false;

            if (this.y < CEILING_Y) {
                this.y = CEILING_Y;
                if (this.dy < 0) this.dy = 0;
            }

            if (this.y + this.size >= GROUND_Y) {
                this.y = GROUND_Y - this.size;
                if (this.dy > 0) this.dy = 0;
                this.grounded = true;
            }
            return;
        }

        if ((isHoldingJump || jumpJustPressed) && this.grounded) {
            this.jump();
            jumpJustPressed = false;
        }

        this.dy += GRAVITY * gravityMultiplier;
        this.y += this.dy;

        if (this.y + this.size >= GROUND_Y) {
            this.y = GROUND_Y - this.size;
            this.dy = 0;
            this.grounded = true;
            this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            this.grounded = false;
            this.rotation += 0.105;
        }
    },

    jump() {
        if (playerMode ===
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    user-select: none;
}

body {
    background-color: #090d16;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: 'Orbitron', sans-serif;
    overflow: hidden;
}

#game-container {
    position: relative;
    width: 900px;
    max-width: 100vw;
    height: 500px;
    max-height: 100vh;
    border: 4px solid #000;
    box-shadow: 0 0 40px rgba(0, 140, 255, 0.5);
    overflow: hidden;
}

canvas {
    display: block;
}

/* MODO ARRASTAR UI ATIVO APENAS QUANDO "CELULAR" ESTÁ SELECIONADO */
#game-container.mobile-ui-drag .overlay {
    overflow: auto;
    justify-content: flex-start;
    padding: 58px 18px 24px 18px;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
}

#game-container.mobile-ui-drag .settings-box,
#game-container.mobile-ui-drag .editor-hub-box,
#game-container.mobile-ui-drag .creations-box,
#game-container.mobile-ui-drag .garage-box,
#game-container.mobile-ui-drag .level-card,
#game-container.mobile-ui-drag .win-box {
    max-width: 100%;
    flex-shrink: 0;
    touch-action: pan-x pan-y;
}

#game-container.mobile-ui-drag .editor-topbar,
#game-container.mobile-ui-drag .editor-tab-content,
#game-container.mobile-ui-drag .creations-list {
    overflow-x: auto;
    overflow-y: auto;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
}

/* Overlays */
.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.hidden {
    display: none !important;
}

/* HUD: BARRA DE PROGRESSO + % + PRÁTICA */
#hud {
    position: absolute;
    top: 16px;
    left: 0;
    width: 100%;
    padding: 0 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 15;
    pointer-events: none;
}

.progress-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
}

.progress-bar-bg {
    width: 280px;
    height: 18px;
    background: rgba(0, 0, 0, 0.65);
    border: 3px solid #000;
    outline: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    overflow: hidden;
    padding: 2px;
}

#progress-fill {
    width: 0%;
    height: 100%;
    background: linear-gradient(180deg, #9dff00 0%, #38b000 100%);
    border-radius: 6px;
    transition: width 0.05s linear;
}

#progress-text {
    color: #fff;
    font-size: 16px;
    font-weight: 900;
    -webkit-text-stroke: 1px #000;
    text-shadow: 0 2px 0 #000;
    min-width: 50px;
}

.hud-chip {
    pointer-events: auto;
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 900;
    padding: 5px 10px;
    border-radius: 7px;
    border: 2px solid #000;
    background: rgba(15, 35, 70, 0.85);
    color: #d7ecff;
    cursor: pointer;
    box-shadow: 0 3px 0 #000;
}

.hud-chip.active {
    background: linear-gradient(180deg, #00e5ff, #0077b6);
    color: #fff;
    -webkit-text-stroke: 0.6px #000;
}

.hud-chip:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #000;
}

#pause-menu-btn {
    position: absolute;
    right: 20px;
    pointer-events: auto;
    width: 38px;
    height: 38px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    border-radius: 8px;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    cursor: pointer;
}

#pause-screen {
    background: rgba(0, 10, 30, 0.65);
    z-index: 25;
}

/* BOTÃO DE CONFIGURAÇÃO NO CANTO DO MENU */
.corner-settings-btn {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: linear-gradient(180deg, #4da6ff, #0059b3);
    border: 3px solid #000;
    color: #ffe600;
    font-size: 26px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 5px 0 #000;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.1s ease;
    z-index: 12;
}

.corner-settings-btn:hover {
    transform: scale(1.08);
    filter: brightness(1.1);
}

.corner-settings-btn:active {
    transform: translateY(3px);
    box-shadow: 0 2px 0 #000;
}

/* LOGO GEOMETRY DASH */
.logo-container {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
}

.gd-title {
    font-size: 62px;
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: 3px;
    color: #7fff00;
    -webkit-text-stroke: 3px #000;
    text-shadow: 0 5px 0 #000, 0 0 20px rgba(127, 255, 0, 0.6);
}

.gd-title span {
    color: #00e5ff;
    font-size: 70px;
    text-shadow: 0 5px 0 #000, 0 0 20px rgba(0, 229, 255, 0.6);
}

.version-badge {
    position: absolute;
    bottom: -14px;
    right: -10px;
    background: #ffcc00;
    color: #000;
    font-size: 14px;
    padding: 3px 8px;
    border: 2px solid #000;
    border-radius: 6px;
    transform: rotate(-8deg);
}

/* LINHA DE BOTÕES DO MENU INICIAL */
.menu-buttons-row {
    display: flex;
    align-items: center;
    gap: 24px;
}

.side-btn {
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #4da6ff, #0059b3);
    border: 4px solid #000;
    box-shadow:
        inset 0 5px 0 rgba(255, 255, 255, 0.45),
        inset 0 -6px 0 rgba(0, 30, 80, 0.6),
        0 6px 0 #000;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.1s ease;
}

.editor-main-btn {
    background: radial-gradient(circle at 30% 30%, #ff9f1c, #d95d00);
}

.hammer-icon {
    font-size: 36px;
    filter: drop-shadow(0 3px 0 #000);
}

.side-btn:hover {
    transform: scale(1.08);
    filter: brightness(1.1);
}

.side-btn:active {
    transform: scale(0.95) translateY(3px);
}

#play-btn {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #9dff00, #38b000);
    border: 5px solid #000;
    box-shadow: 
        inset 0 6px 0 rgba(255, 255, 255, 0.5),
        inset 0 -8px 0 rgba(0, 70, 0, 0.6),
        0 8px 0 #000,
        0 0 30px rgba(127, 255, 0, 0.7);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.1s ease;
    animation: pulse 1.8s infinite ease-in-out;
}

#play-btn:hover {
    transform: scale(1.08);
    filter: brightness(1.1);
}

#play-btn:active {
    transform: scale(0.95) translateY(4px);
}

.play-triangle {
    width: 0;
    height: 0;
    margin-left: 12px;
    border-top: 28px solid transparent;
    border-bottom: 28px solid transparent;
    border-left: 48px solid #ffe600;
    filter: drop-shadow(0 4px 0 #000);
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* BOTÃO VOLTAR CANTO SUPERIOR ESQUERDO */
.corner-back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: linear-gradient(180deg, #ff5555, #b30000);
    border: 3px solid #000;
    color: #fff;
    font-size: 26px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 5px 0 #000;
    z-index: 15;
}

.corner-back-btn:active {
    transform: translateY(3px);
    box-shadow: 0 2px 0 #000;
}

/* TELA DE CONFIGURAÇÕES, EDITOR HUB E CRIAÇÕES */
#settings-screen, #level-select, #skin-garage, #editor-hub, #creations-screen {
    background: rgba(0, 15, 45, 0.82);
    backdrop-filter: blur(3px);
}

.settings-box, .editor-hub-box {
    background: linear-gradient(180deg, #1e4b94 0%, #0d1f3d 100%);
    border: 4px solid #000;
    outline: 3px solid #00e5ff;
    border-radius: 18px;
    padding: 32px 44px;
    text-align: center;
    width: 540px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);
}

.settings-box h2, .editor-hub-box h2 {
    color: #00e5ff;
    font-size: 30px;
    -webkit-text-stroke: 1.5px #000;
    text-shadow: 0 4px 0 #000;
    margin-bottom: 8px;
}

.settings-subtitle {
    color: #ffe600;
    font-size: 13px;
    letter-spacing: 1px;
    -webkit-text-stroke: 0.7px #000;
    margin-bottom: 24px;
}

.editor-hub-actions {
    display: flex;
    justify-content: center;
    gap: 24px;
}

.hub-action-btn {
    padding: 16px 34px;
    font-size: 20px;
}

/* CRIAÇÕES */
.creations-box {
    background: linear-gradient(180deg, #1b3b70 0%, #0b1830 100%);
    border: 4px solid #000;
    outline: 3px solid #00e5ff;
    border-radius: 18px;
    padding: 22px 26px;
    width: 760px;
    max-height: 410px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85);
}

.creations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
}

.creations-header h2 {
    color: #ffe600;
    font-size: 26px;
    -webkit-text-stroke: 1.5px #000;
}

.small-gd-btn {
    font-size: 13px !important;
    padding: 8px 14px !important;
}

.creations-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 4px;
}

.creation-item {
    background: rgba(10, 25, 55, 0.9);
    border: 2px solid #000;
    outline: 2px solid rgba(0, 229, 255, 0.45);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.creation-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.creation-name {
    color: #fff;
    font-size: 15px;
    -webkit-text-stroke: 0.7px #000;
}

.creation-sub {
    color: #9dff00;
    font-size: 11px;
}

.creation-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.creation-diff-select {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 800;
    padding: 5px 7px;
    border-radius: 6px;
    border: 2px solid #000;
    background: #142b52;
    color: #ffe600;
}

.tiny-btn {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 900;
    padding: 6px 10px;
    border-radius: 6px;
    border: 2px solid #000;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 2px 0 #000;
}

.tiny-btn.green { background: #38b000; }
.tiny-btn.blue { background: #0077b6; }
.tiny-btn.yellow { background: #d48800; }
.tiny-btn.red { background: #c1121f; }

.empty-creations {
    text-align: center;
    color: #aaddff;
    padding: 36px 10px;
    font-size: 13px;
}

/* EDITOR DE FASES */
#level-editor {
    background: #09101d;
    justify-content: space-between;
    z-index: 20;
}

.editor-topbar {
    width: 100%;
    height: 44px;
    background: #101d36;
    border-bottom: 3px solid #000;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.editor-top-left, .editor-top-center, .editor-top-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.editor-title-input {
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    font-weight: 800;
    width: 150px;
    padding: 5px 8px;
    border-radius: 6px;
    border: 2px solid #000;
    background: #081224;
    color: #fff;
}

.editor-select {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 900;
    padding: 5px 6px;
    border-radius: 6px;
    border: 2px solid #000;
    background: #162f5c;
    color: #ffe600;
}

.mini-btn {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 900;
    padding: 5px 9px;
    border-radius: 6px;
    border: 2px solid #000;
    background: #1b3461;
    color: #d7ecff;
    cursor: pointer;
    box-shadow: 0 2px 0 #000;
}

.mini-btn.active {
    background: #0096c7;
    color: #fff;
    outline: 2px solid #ffe600;
}

.mini-btn.green { background: #38b000; color: #fff; }
.mini-btn.blue { background: #0077b6; color: #fff; }
.mini-btn.red { background: #c1121f; color: #fff; }
.mini-btn.warn { background: #b5651d; color: #fff; }

.editor-main-area {
    width: 900px;
    height: 330px;
    position: relative;
    overflow: hidden;
}

#editorCanvas {
    width: 900px;
    height: 330px;
    cursor: crosshair;
}

.editor-bottom-panel {
    width: 100%;
    height: 126px;
    background: #0d182b;
    border-top: 3px solid #000;
    display: flex;
    flex-direction: column;
}

.editor-tabs {
    display: flex;
    gap: 6px;
    padding: 6px 10px 0 10px;
}

.editor-tab {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 900;
    padding: 4px 12px;
    border-radius: 6px 6px 0 0;
    border: 2px solid #000;
    border-bottom: none;
    background: #162642;
    color: #9ec5eb;
    cursor: pointer;
}

.editor-tab.active {
    background: #234275;
    color: #ffe600;
}

.editor-tab-content {
    flex: 1;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    overflow-x: auto;
}

.editor-palette {
    display: flex;
    gap: 8px;
    align-items: center;
}

.palette-item {
    min-width: 74px;
    height: 66px;
    padding: 4px 6px;
    border-radius: 8px;
    border: 2px solid #000;
    background: #132442;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.palette-item.selected {
    background: #1f447a;
    outline: 2px solid #9dff00;
    transform: translateY(-2px);
}

.palette-dot {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 2px solid #000;
}

.style-controls-grid {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
}

.style-control {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #d7ecff;
    font-size: 10px;
}

/* CONFIGURAÇÕES */
.platform-toggle {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
}

.platform-btn {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 900;
    padding: 14px 32px;
    border-radius: 12px;
    border: 3px solid #000;
    background: linear-gradient(180deg, #2b4c7e, #162947);
    color: #b8d0eb;
    cursor: pointer;
    box-shadow: 0 5px 0 #000;
    transition: transform 0.1s ease, filter 0.15s ease;
}

.platform-btn:hover {
    transform: scale(1.04);
}

.platform-btn.selected {
    background: linear-gradient(180deg, #9dff00, #38b000);
    color: #fff;
    outline: 3px solid #ffe600;
    -webkit-text-stroke: 1px #000;
    transform: scale(1.06);
}

.platform-hint {
    color: #d7ecff;
    font-size: 13px;
    line-height: 1.45;
}

/* SELEÇÃO DE FASES */
.level-carousel {
    display: flex;
    align-items: center;
    gap: 24px;
}

.arrow-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 72px;
    font-weight: 900;
    cursor: pointer;
    -webkit-text-stroke: 3px #000;
    text-shadow: 0 5px 0 #000;
    transition: transform 0.1s;
}

.arrow-btn:hover {
    transform: scale(1.15);
    color: #ffe600;
}

.level-card {
    width: 600px;
    min-height: 235px;
    background: linear-gradient(180deg, #1e4b94 0%, #0e2652 100%);
    border: 4px solid #000;
    outline: 3px solid #00e5ff;
    border-radius: 18px;
    padding: 22px 26px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
    transition: transform 0.15s;
}

.level-card:hover {
    transform: scale(1.02);
}

.level-header {
    display: flex;
    align-items: center;
    gap: 22px;
}

.difficulty-face {
    width: 180px;
    height: 180px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
}

.difficulty-face img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 5px 0 rgba(0, 0, 0, 0.75));
}

.level-title-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.level-card h2 {
    color: #fff;
    font-size: 30px;
    -webkit-text-stroke: 2px #000;
    text-shadow: 0 4px 0 #000;
}

.level-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #ffe600;
    font-size: 14px;
    -webkit-text-stroke: 0.8px #000;
}

.hint-text {
    margin-top: 20px;
    color: #aaddff;
    font-size: 14px;
}

/* GARAGEM DE SKINS */
.garage-box {
    background: linear-gradient(180deg, #1b3b70 0%, #0d1f3d 100%);
    border: 4px solid #000;
    outline: 3px solid #7fff00;
    border-radius: 18px;
    padding: 22px 36px;
    text-align: center;
    width: 540px;
}

.garage-box h2 {
    color: #7fff00;
    font-size: 28px;
    -webkit-text-stroke: 1.5px #000;
    margin-bottom: 12px;
}

.preview-stage {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 12px;
    border: 2px solid #000;
}

.skin-row, .color-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 14px;
}

.skin-option {
    width: 52px;
    height: 52px;
    background: #0a1930;
    border: 3px solid #000;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.skin-option.selected {
    outline: 3px solid #ffe600;
    transform: scale(1.1);
}

.color-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
}

.color-section span {
    color: #fff;
    font-size: 14px;
    -webkit-text-stroke: 1px #000;
}

.color-swatch {
    width: 32px;
    height: 32px;
    border: 3px solid #000;
    border-radius: 6px;
    cursor: pointer;
}

.color-swatch.selected {
    outline: 3px solid #fff;
    transform: scale(1.15);
}

/* TELA DE VITÓRIA & PAUSE */
#win-screen {
    background: rgba(0, 0, 0, 0.35);
    animation: overlayFadeIn 0.25s ease-out forwards;
}

.win-box {
    background: linear-gradient(180deg, #1e4b94 0%, #0d1f3d 100%);
    border: 4px solid #000;
    outline: 3px solid #00e5ff;
    border-radius: 18px;
    padding: 35px 50px;
    text-align: center;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 229, 255, 0.4);
    animation: gdPopBounce 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.win-box h2 {
    color: #ffe600;
    font-size: 38px;
    -webkit-text-stroke: 2px #000;
    text-shadow: 0 4px 0 #000;
    margin-bottom: 10px;
    animation: titleGlow 1.5s infinite alternate ease-in-out;
}

.win-box p {
    color: #7fff00;
    font-size: 17px;
    -webkit-text-stroke: 0.8px #000;
    margin-bottom: 26px;
}

.win-buttons {
    display: flex;
    justify-content: center;
    gap: 22px;
}

.gd-btn {
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 900;
    padding: 12px 28px;
    border: 3px solid #000;
    border-radius: 10px;
    cursor: pointer;
    -webkit-text-stroke: 1px #000;
    box-shadow: 0 5px 0 #000;
    transition: transform 0.1s ease;
}

.gd-btn:hover { transform: scale(1.06); }
.gd-btn.green { background: linear-gradient(180deg, #7fff00, #38b000); }
.gd-btn.yellow { background: linear-gradient(180deg, #ffe600, #d48800); }
.gd-btn.blue { background: linear-gradient(180deg, #00e5ff, #0077b6); }
.gd-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #000; }

@keyframes gdPopBounce {
    0% {
        opacity: 0;
        transform: scale(0.35) translateY(30px);
    }
    70% {
        opacity: 1;
        transform: scale(1.07) translateY(-4px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes titleGlow {
    from { text-shadow: 0 4px 0 #000, 0 0 10px rgba(255, 230, 0, 0.3); }
    to { text-shadow: 0 4px 0 #000, 0 0 24px rgba(255, 230, 0, 0.85); }
}


/* === RESPONSIVIDADE: CELULAR + EDITOR === */
#game-container {
    width: min(900px, 100vw);
    height: min(500px, 100dvh);
}

#gameCanvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

#level-editor {
    padding: 0;
    overflow: hidden;
}

#level-editor .editor-topbar {
    flex: 0 0 44px;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    justify-content: flex-start;
    scrollbar-width: thin;
}

#level-editor .editor-top-left,
#level-editor .editor-top-center,
#level-editor .editor-top-right {
    flex: 0 0 auto;
    white-space: nowrap;
}

#level-editor .editor-main-area {
    width: 100%;
    flex: 1 1 auto;
    min-height: 120px;
    height: auto;
}

#level-editor #editorCanvas {
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
}

#level-editor .editor-bottom-panel {
    flex: 0 0 126px;
    min-width: 0;
}

#level-editor .editor-tab-content {
    min-width: 0;
}

@media (max-width: 700px) {
    #game-container {
        width: 100vw;
        height: min(500px, 100dvh);
        max-width: 100vw;
        max-height: 100dvh;
        border-width: 2px;
        box-shadow: none;
    }

    .mobile-ui-drag #level-editor {
        padding: 0;
        justify-content: space-between;
        overflow: hidden;
    }

    #level-editor .editor-topbar {
        height: 48px;
        flex-basis: 48px;
        padding: 0 6px;
        gap: 6px;
    }

    #level-editor .editor-title-input {
        width: 112px;
        min-width: 112px;
        font-size: 10px;
    }

    #level-editor .editor-select {
        font-size: 10px;
    }

    #level-editor .mini-btn {
        font-size: 10px;
        padding: 6px 8px;
    }

    #level-editor .editor-main-area {
        flex: 1 1 auto;
        min-height: 180px;
        max-height: min(42vh, 260px);
        display: flex;
        align-items: stretch;
        justify-content: center;
        overflow: hidden;
        background: #070d18;
    }

    #level-editor #editorCanvas {
        display: block;
        width: 100%;
        height: 100%;
        aspect-ratio: auto;
        touch-action: none;
    }

    #level-editor .editor-bottom-panel {
        flex-basis: 142px;
        height: 142px;
    }

    #level-editor .editor-tabs {
        flex: 0 0 auto;
        overflow-x: auto;
    }

    #level-editor .editor-tab-content {
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
    }

    #level-editor .palette-item {
        min-width: 82px;
    }

    .gd-title {
        font-size: clamp(34px, 9vw, 62px);
    }

    .gd-title span {
        font-size: clamp(40px, 10vw, 70px);
    }
}


/* Editor mobile: canvas maior para manter o chão visível e área de toque confortável. */
@media (max-width: 700px) {
    #level-editor .editor-topbar {
        overflow-x: auto;
        justify-content: flex-start;
    }

    #level-editor .editor-top-center,
    #level-editor .editor-top-left,
    #level-editor .editor-top-right {
        flex: 0 0 auto;
    }

    #level-editor .editor-main-area {
        min-height: 180px;
    }

    #level-editor .editor-bottom-panel {
        flex: 0 0 142px;
    }

    #level-editor .palette-item {
        min-width: 86px;
        min-height: 70px;
    }
}


/* === EXPANSÃO V1: GARAGEM MULTIMODO E FERRAMENTAS DO EDITOR === */
.mode-skin-panel{width:min(680px,92vw);margin:10px auto 0;padding:12px;background:rgba(3,12,28,.72);border:2px solid rgba(0,229,255,.5);border-radius:12px}
.mode-skin-heading{color:#00e5ff;font-size:12px;font-weight:900;letter-spacing:2px;margin-bottom:8px}
.mode-skin-tabs{display:flex;gap:6px;overflow-x:auto;padding:3px 2px 9px;scrollbar-width:thin}
.mode-skin-tab{flex:0 0 auto;padding:8px 12px;border:2px solid #06101f;border-radius:7px;background:linear-gradient(#284a72,#12233d);color:#dbeafe;font:900 10px Orbitron,sans-serif;cursor:pointer}
.mode-skin-tab.selected{border-color:#ffe600;background:linear-gradient(#2789b8,#14517a);color:#fff;box-shadow:0 0 10px #00e5ff66}
.mode-skin-models{display:grid;grid-template-columns:repeat(8,minmax(42px,1fr));gap:6px;margin:6px 0}
.mode-model{min-width:0;display:grid;place-items:center;background:#101e34;border:2px solid #030914;border-radius:8px;cursor:pointer;padding:2px}
.mode-model.selected{border-color:#ffe600;box-shadow:0 0 9px #ffe60066}
.mode-model canvas{width:42px;height:42px;max-width:100%}
.mode-skin-colors{display:flex;flex-direction:column;gap:7px;color:#fff;font-size:10px;font-weight:900;text-align:left}
.mode-color-row{display:flex;flex-wrap:wrap;gap:7px}
.mode-color-swatch{width:25px;height:25px;border:2px solid #050b16;border-radius:50%;box-shadow:0 0 0 1px #ffffff66;cursor:pointer}
#tool-select-btn.active{background:linear-gradient(#ffe600,#e58b00);color:#111}
#editor-undo-btn,#editor-redo-btn{min-width:34px;font-size:16px}
#editor-export-btn,#editor-import-btn{background:linear-gradient(#2684c7,#124a86);color:white}
#level-editor .editor-top-center{flex-wrap:nowrap}
#mode-skin-panel button:focus-visible,#level-editor button:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:700px){
 .mode-skin-panel{width:94vw;padding:9px}
 .mode-skin-models{grid-template-columns:repeat(4,minmax(42px,1fr))}
 .mode-skin-tab{padding:9px 11px}
 #level-editor .editor-topbar{min-height:50px}
 #level-editor .editor-top-center{gap:5px}
 #level-editor .mini-btn{white-space:nowrap}
}

@media(max-width:700px){
 #skin-garage{overflow-y:auto;justify-content:flex-start;align-items:center;padding:58px 8px 18px;touch-action:pan-y}
 #skin-garage .garage-box{width:100%;max-width:560px;padding:14px 12px;margin:0 auto;flex:0 0 auto}
 #skin-garage .mode-skin-panel{margin-top:8px}
 #skin-garage .preview-stage{margin-bottom:8px}
}


/* === GARAGEM DE SKINS REFEITA === */
#skin-garage{
  justify-content:flex-start;
  align-items:center;
  overflow-x:hidden;
  overflow-y:auto;
  padding:72px 18px 28px;
  box-sizing:border-box;
  gap:12px;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
}
#skin-garage .garage-box{
  width:min(720px,100%);
  max-width:720px;
  flex:0 0 auto;
  box-sizing:border-box;
  padding:22px clamp(12px,3vw,30px) 24px;
  margin:0 auto;
  border:3px solid #050b17;
  outline:2px solid #00e5ff;
  background:
    radial-gradient(ellipse at 50% 0%,rgba(0,229,255,.16),transparent 55%),
    linear-gradient(160deg,#183d70 0%,#102747 52%,#08182d 100%);
  box-shadow:0 16px 42px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12);
}
#skin-garage .garage-box h2{
  margin:0 0 12px;
  color:#e9fbff;
  font-size:clamp(22px,4vw,30px);
  letter-spacing:3px;
  text-shadow:0 3px 0 #07101d,0 0 16px #00d9ff88;
}
#skin-garage .preview-stage{
  min-height:112px;
  box-sizing:border-box;
  align-items:center;
  background:
    radial-gradient(circle at 50% 45%,rgba(0,229,255,.18),transparent 48%),
    linear-gradient(180deg,rgba(1,8,20,.8),rgba(6,20,39,.8));
  border:1px solid rgba(114,226,255,.4);
  box-shadow:inset 0 0 22px rgba(0,0,0,.35);
}
#skin-garage #skin-preview{width:96px;height:96px;image-rendering:auto}
#skin-garage #skin-models,
#skin-garage .color-section{display:none!important}
#mode-skin-panel{
  width:100%;
  max-width:100%;
  box-sizing:border-box;
  margin:0;
  padding:16px;
  border:1px solid rgba(104,224,255,.35);
  border-radius:14px;
  background:linear-gradient(180deg,rgba(4,17,35,.94),rgba(7,24,46,.96));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 8px 24px rgba(0,0,0,.2);
}
.skin-panel-head{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.mode-skin-heading{color:#8ceeff;font-size:14px;font-weight:1000;letter-spacing:2px}
.mode-skin-subtitle{color:#9db8d2;font-size:11px;letter-spacing:.35px}
.mode-skin-tabs{
  display:grid;
  grid-template-columns:repeat(7,minmax(0,1fr));
  gap:5px;
  padding:0 0 14px;
  overflow:visible;
}
.mode-skin-tab{
  min-width:0;
  padding:10px 3px;
  border:1px solid #27496c;
  border-radius:8px;
  background:linear-gradient(180deg,#183657,#0c2038);
  color:#b9d5eb;
  font-size:clamp(9px,1.4vw,11px);
  font-weight:900;
  letter-spacing:.2px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
  transition:transform .12s,border-color .12s,background .12s;
}
.mode-skin-tab:active{transform:translateY(1px)}
.mode-skin-tab.selected{
  color:#fff;
  border:1px solid #70edff;
  background:linear-gradient(180deg,#167ca2,#124c77);
  box-shadow:0 0 0 1px rgba(0,229,255,.18),0 0 14px rgba(0,210,255,.18);
}
.skin-section-heading{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  margin:4px 0 9px;
  color:#dff8ff;
  font-size:11px;
  font-weight:1000;
  letter-spacing:1.2px;
}
.skin-section-heading span:last-child{color:#69dff6}
.mode-skin-models{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:8px;
  margin:0 0 17px;
}
.mode-model{
  min-width:0;
  min-height:92px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3px;
  padding:5px 3px 7px;
  border:1px solid #254361;
  border-radius:10px;
  background:linear-gradient(180deg,#122c49,#091a30);
  color:#a9c7df;
  font-size:9px;
  font-weight:900;
  letter-spacing:.35px;
  transition:transform .12s,border-color .12s,background .12s;
}
.mode-model canvas{display:block;width:58px;height:58px;max-width:100%}
.mode-model.selected{
  border:1px solid #ffe477;
  background:linear-gradient(180deg,#35476a,#192b48);
  color:#fff6bd;
  box-shadow:0 0 0 1px rgba(255,220,75,.2),0 0 13px rgba(255,220,75,.14);
  transform:translateY(-1px);
}
.skin-color-section{
  padding-top:13px;
  border-top:1px solid rgba(126,195,229,.18);
}
.skin-channel-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.skin-channel{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:38px;
  border:1px solid #294966;
  border-radius:8px;
  background:#0b1d32;
  color:#a9c5dc;
  font-size:10px;
  font-weight:1000;
  letter-spacing:1px;
}
.skin-channel i{width:15px;height:15px;border:1px solid rgba(255,255,255,.7);border-radius:50%;box-shadow:0 0 7px currentColor}
.skin-channel.selected{border-color:#74eaff;background:#12486a;color:#fff;box-shadow:0 0 10px rgba(0,229,255,.14)}
.mode-color-row{
  display:grid;
  grid-template-columns:repeat(8,minmax(0,1fr));
  justify-items:center;
  gap:10px 7px;
  margin:10px 0 12px;
}
.mode-color-swatch{
  width:28px;height:28px;
  padding:0;
  border:2px solid rgba(0,0,0,.75);
  border-radius:50%;
  box-shadow:0 0 0 1px rgba(255,255,255,.22);
  cursor:pointer;
  transition:transform .12s,box-shadow .12s;
}
.mode-color-swatch.selected{
  transform:scale(1.16);
  box-shadow:0 0 0 2px #fff,0 0 0 4px #00dfff,0 0 12px rgba(0,220,255,.45);
}
.skin-custom-color{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  min-height:40px;
  padding:5px 10px;
  border:1px solid #23435f;
  border-radius:8px;
  background:rgba(0,0,0,.18);
  color:#c3d9eb;
  font-size:11px;
  font-weight:800;
}
.skin-custom-color input{width:44px;height:30px;padding:0;border:0;background:transparent;cursor:pointer}
.skin-panel-footer{display:flex;justify-content:flex-end;margin-top:12px}
.skin-reset-btn{
  min-height:34px;
  padding:7px 12px;
  border:1px solid #45627d;
  border-radius:7px;
  background:#172c44;
  color:#bdd2e4;
  font-size:9px;
  font-weight:900;
  letter-spacing:.6px;
  cursor:pointer;
}
.skin-reset-btn:hover{border-color:#8ceeff;color:#fff}
#mode-skin-panel button:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:700px){
  #skin-garage{padding:64px 10px 20px;gap:10px}
  #skin-garage .garage-box{width:100%;padding:16px 10px 18px}
  #skin-garage .preview-stage{min-height:96px;padding:2px;margin-bottom:10px}
  #skin-garage #skin-preview{width:84px;height:84px}
  #mode-skin-panel{padding:12px 9px}
  .mode-skin-tabs{gap:3px;padding-bottom:12px}
  .mode-skin-tab{padding:10px 1px;font-size:8px}
  .mode-skin-models{gap:6px}
  .mode-model{min-height:82px}
  .mode-model canvas{width:52px;height:52px}
  .mode-color-row{grid-template-columns:repeat(8,minmax(0,1fr));
