/* Geometry Dash Web — Editor Expansion 2.0
 * Additive editor layer: categorized asset library, inspector, transforms,
 * groups, stage settings, precise grid and configurable runtime triggers.
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
    const alpha=gridLineStrength==='strong'?{minor:.2,major:.38}:gridLineStrength==='soft'?{minor:.045,major:.12}:{minor:.09,major:.22};
    for(let x=Math.ceil((editorScrollX-80)/gridUnit)*gridUnit;x<editorScrollX+editorCanvas.width-80;x+=gridUnit){
      const sx=x-editorScrollX+80,major=Math.round(x/gridUnit)%4===0;
      eCtx.strokeStyle=major?`rgba(255,255,255,${alpha.major})`:`rgba(255,255,255,${alpha.minor})`;
      eCtx.lineWidth=major?1.4:1;eCtx.beginPath();eCtx.moveTo(sx,0);eCtx.lineTo(sx,EDITOR_GROUND_Y);eCtx.stroke();
    }
    for(let y=0;y<=EDITOR_GROUND_Y;y+=gridUnit){
      const major=Math.round(y/gridUnit)%4===0;
      eCtx.strokeStyle=major?`rgba(255,255,255,${alpha.major})`:`rgba(255,255,255,${alpha.minor})`;
      eCtx.lineWidth=major?1.4:1;eCtx.beginPath();eCtx.moveTo(0,y);eCtx.lineTo(editorCanvas.width,y);eCtx.stroke();
    }
  }
  (editorDraft.decorations||[]).forEach(o=>drawExtraEditorObject(o,'decoration'));
  (editorDraft.structures||[]).forEach(o=>drawExtraEditorObject(o,'structure'));
  (editorDraft.triggers||[]).filter(t=>['move','pulse','scale','color','speed','bg','shake','low_grav','norm_grav'].includes(t.kind)).forEach(t=>drawExtraEditorObject(t,'trigger'));
  getSelectionRecords().forEach(s=>{
    const o=s.obj,x=o.x-editorScrollX+80,y=(o.y===undefined?GROUND_Y-40:o.y)*EDITOR_SCALE_Y,scale=o.scale||1;
    eCtx.save();eCtx.translate(x,y);eCtx.rotate(o.rotation||0);eCtx.scale(o.flipX?-1:1,o.flipY?-1:1);eCtx.strokeStyle='#fff';eCtx.lineWidth=2;eCtx.setLineDash([5,4]);eCtx.strokeRect(-24*scale,-24*scale,48*scale,48*scale);eCtx.restore();
  });
  // The editor begins at the first grid cell; no decorative spawn object is rendered.
  const finishScreenX=editorDraft.finishX-editorScrollX+80;
  eCtx.fillStyle='rgba(0,255,170,.14)';eCtx.fillRect(finishScreenX-5,0,10,EDITOR_GROUND_Y);
  eCtx.strokeStyle='#00ffaa';eCtx.lineWidth=3;eCtx.beginPath();eCtx.moveTo(finishScreenX,0);eCtx.lineTo(finishScreenX,EDITOR_GROUND_Y);eCtx.stroke();
  eCtx.fillStyle='#fff';eCtx.font='900 9px Orbitron,sans-serif';eCtx.fillText('FINISH',finishScreenX,18);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){eCtx.fillStyle=(row+col)%2?'#fff':'#111827';eCtx.fillRect(finishScreenX+5+col*8,26+row*8,8,8);}
  eCtx.restore();
  eCtx.restore();eCtx.restore();
};
function drawDecorGraphic(c,kind,color,s) {
  c.fillStyle=color||'#67e8f9';c.strokeStyle='#071426';c.lineWidth=2;
  if(kind==='deco_star'||kind==='deco_spark'||kind==='effect_burst'||kind==='effect_sparkle'){
    c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*.42:s;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();c.stroke();
  }else if(kind==='deco_ring'||kind==='effect_glow'||kind==='effect_portal_fx'){
    c.globalAlpha=kind==='effect_glow'?.28:1;c.beginPath();c.arc(0,0,s*.82,0,Math.PI*2);c.fill();c.globalAlpha=1;c.strokeStyle=color;c.lineWidth=Math.max(2,s*.18);c.beginPath();c.arc(0,0,s*.58,0,Math.PI*2);c.stroke();
  }else if(kind==='deco_arrow'){
    c.beginPath();c.moveTo(-s,-s*.3);c.lineTo(s*.15,-s*.3);c.lineTo(s*.15,-s*.75);c.lineTo(s,s*.0);c.lineTo(s*.15,s*.75);c.lineTo(s*.15,s*.3);c.lineTo(-s,s*.3);c.closePath();c.fill();c.stroke();
  }else if(kind==='deco_triangle'||kind==='deco_crystal'){
    c.beginPath();c.moveTo(0,-s);c.lineTo(s*.72,s*.72);c.lineTo(-s*.72,s*.72);c.closePath();c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.75)';c.beginPath();c.moveTo(0,-s);c.lineTo(0,s*.72);c.moveTo(0,-s);c.lineTo(s*.72,s*.72);c.stroke();
  }else if(kind==='half_block'){
    c.fillRect(-s*.8,0,s*1.6,s*.8);c.strokeRect(-s*.8,0,s*1.6,s*.8);c.strokeStyle='rgba(255,255,255,.6)';c.beginPath();c.moveTo(-s*.8,0);c.lineTo(s*.8,0);c.stroke();
  }else if(kind==='slope'){
    c.beginPath();c.moveTo(-s*.8,s*.7);c.lineTo(s*.8,-s*.7);c.lineTo(s*.8,s*.7);c.closePath();c.fill();c.stroke();
  }else if(kind==='double_block'||kind==='outlined_block'){
    c.strokeRect(-s*.8,-s*.8,s*1.6,s*1.6);c.strokeRect(-s*.52,-s*.52,s*1.04,s*1.04);
    if(kind==='double_block'){c.beginPath();c.moveTo(-s*.8,0);c.lineTo(s*.8,0);c.moveTo(0,-s*.8);c.lineTo(0,s*.8);c.stroke();}
  }else if(kind==='double_spike'){
    c.beginPath();c.moveTo(-s*.8,s*.7);c.lineTo(-s*.35,-s*.7);c.lineTo(s*.1,s*.7);c.lineTo(s*.55,-s*.7);c.lineTo(s*.9,s*.7);c.closePath();c.fill();c.stroke();
  }else if(kind==='wide_spike'){
    c.beginPath();c.moveTo(-s,s*.7);c.lineTo(0,-s*.9);c.lineTo(s,s*.7);c.closePath();c.fill();c.stroke();
  }else if(kind==='saw_spike'){
    c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%2?s*.6:s;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();c.stroke();
  }else if(kind==='deco_window'){
    c.fillRect(-s*.8,-s*.8,s*1.6,s*1.6);c.strokeRect(-s*.8,-s*.8,s*1.6,s*1.6);c.strokeStyle='rgba(255,255,255,.75)';c.beginPath();c.moveTo(0,-s*.8);c.lineTo(0,s*.8);c.moveTo(-s*.8,0);c.lineTo(s*.8,0);c.stroke();
  }else if(kind==='deco_flower'){
    for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.ellipse(Math.cos(a)*s*.48,Math.sin(a)*s*.48,s*.3,s*.46,a,0,Math.PI*2);c.fill();c.stroke();}
    c.fillStyle='#ffe58a';c.beginPath();c.arc(0,0,s*.24,0,Math.PI*2);c.fill();c.stroke();
  }else if(kind==='effect_flame'){
    c.beginPath();c.moveTo(0,s);c.bezierCurveTo(-s*.9,s*.2,-s*.35,-s*.25,-s*.1,-s);c.bezierCurveTo(s*.15,-s*.35,s*.9,-s*.15,0,s);c.fill();c.stroke();
    c.fillStyle='#fff2a8';c.beginPath();c.ellipse(0,s*.25,s*.2,s*.42,0,0,Math.PI*2);c.fill();
  }else if(kind==='effect_wave'){
    c.strokeStyle=color;c.lineWidth=Math.max(3,s*.18);c.beginPath();for(let i=0;i<=20;i++){const x=-s+i*s*2/20,y=Math.sin(i/20*Math.PI*3)*s*.35;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();
  }else if(kind==='checkpoint'){
    c.fillRect(-s*.12,-s,s*.24,s*2);c.beginPath();c.moveTo(0,-s);c.lineTo(s,s*.0);c.lineTo(0,s*.4);c.closePath();c.fill();c.stroke();
  }else if(kind==='finish_marker'){
    for(let y=-1;y<2;y++)for(let x=-1;x<2;x++){c.fillStyle=(x+y)%2?'#fff':'#172033';c.fillRect(x*s*.35,y*s*.35,s*.35,s*.35);}
    c.strokeStyle='#fff';c.strokeRect(-s*.52,-s*.52,s*1.04,s*1.04);
  }else if(kind==='text_sign'){
    c.fillRect(-s,-s*.55,s*2,s*1.1);c.strokeRect(-s,-s*.55,s*2,s*1.1);c.fillStyle='#fff';c.font='bold '+(s*.65)+'px sans-serif';c.textAlign='center';c.fillText('GO',0,s*.22);
  }else if(kind==='gear'||kind==='structure_gear'||String(kind).indexOf('gear')>=0){
    c.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%3===0?s:s*.78,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();c.stroke();c.fillStyle='#0b1728';c.beginPath();c.arc(0,0,s*.28,0,Math.PI*2);c.fill();c.stroke();
  }else if(kind==='chain'||String(kind).indexOf('chain')>=0){
    c.lineWidth=s*.22;c.beginPath();c.ellipse(0,-s*.45,s*.36,s*.52,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,s*.45,s*.36,s*.52,0,0,Math.PI*2);c.stroke();
  }else if(kind==='column'||kind==='wall'||kind==='arch'){
    c.fillRect(-s*.55,-s*1.4,s*1.1,s*2.8);c.strokeRect(-s*.55,-s*1.4,s*1.1,s*2.8);
    if(kind==='arch'){c.clearRect(-s*.3,-s*.9,s*.6,s*1.8);c.beginPath();c.arc(0,-s*.9,s*.3,0,Math.PI,true);c.stroke();}
    else{c.strokeStyle='rgba(255,255,255,.5)';c.strokeRect(-s*.35,-s*1.2,s*.7,s*2.4);}
  }else{
    c.beginPath();c.moveTo(0,-s);c.lineTo(s*.8,0);c.lineTo(0,s);c.lineTo(-s*.8,0);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.65)';c.beginPath();c.arc(-s*.22,-s*.25,s*.18,0,Math.PI*2);c.fill();
  }
}
function drawExtraEditorObject(o,kind) {
  const x=(o.x||0)-editorScrollX+80,y=(o.y===undefined?GROUND_Y-45:o.y)*EDITOR_SCALE_Y,s=(o.scale||1)*24;
  if(x<-80||x>editorCanvas.width+80)return;
  eCtx.save();eCtx.translate(x,y);eCtx.rotate(o.rotation||0);eCtx.scale(o.flipX?-1:1,o.flipY?-1:1);
  if(kind==='trigger'){
    const triggerColor=o.color||({move:'#38bdf8',pulse:'#f472b6',scale:'#a78bfa',color:'#22c55e',speed:'#facc15'}[o.kind]||'#facc15');
    eCtx.shadowColor=triggerColor;eCtx.shadowBlur=12;eCtx.fillStyle='rgba(5,15,35,.94)';eCtx.strokeStyle=triggerColor;eCtx.lineWidth=3;
    eCtx.fillRect(-17,-25,34,50);eCtx.strokeRect(-17,-25,34,50);eCtx.shadowBlur=0;
    eCtx.fillStyle=triggerColor;eCtx.font='900 9px Orbitron,sans-serif';eCtx.textAlign='center';eCtx.fillText(String(o.kind||'TRG').toUpperCase().slice(0,6),0,4);
    eCtx.fillStyle='#fff';eCtx.font='bold 8px sans-serif';eCtx.fillText('G'+String(o.group||'1'),0,16);
    eCtx.fillStyle='#fff';eCtx.beginPath();eCtx.arc(0,-30,4,0,Math.PI*2);eCtx.fill();
  } else if(o.kind==='portal') {
    eCtx.strokeStyle=o.color||'#a78bfa';eCtx.lineWidth=6;eCtx.beginPath();eCtx.ellipse(0,0,s*.55,s*1.25,0,0,Math.PI*2);eCtx.stroke();
    eCtx.strokeStyle='#fff';eCtx.lineWidth=1.5;eCtx.beginPath();eCtx.ellipse(0,0,s*.38,s,0,0,Math.PI*2);eCtx.stroke();
  } else drawDecorGraphic(eCtx,o.kind,o.color,s);
  eCtx.restore();
}
function drawRuntimeExtraObjects() {
  extraRuntimeObjects.forEach(o=>{
    const x=o.x-levelDistance+160,y=o.y===undefined?GROUND_Y-40:o.y;
    if(x<-100||x>canvas.width+100)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(o.rotation||0);ctx.scale(o.flipX?-1:1,o.flipY?-1:1);
    drawDecorGraphic(ctx,o.kind,o.color,24*(o.scale||1));
    ctx.restore();
  });
}
const oldStartAttempt=startAttempt;
startAttempt=function(countNewAttempt) {
  ensureDraftSchema(activePlayableLevel);
  oldStartAttempt(countNewAttempt);
  extraRuntimeObjects=deepClone(activePlayableLevel.decorations||[]).concat(deepClone(activePlayableLevel.structures||[]));
  activePlatforms.forEach(o=>{if(o.scale&&o.scale!==1)applyObjectScale(o,o.scale);});
  activeSaws.forEach(o=>{if(o.scale&&o.scale!==1)applyObjectScale(o,o.scale);});
  activePillars.forEach(o=>{if(o.scale&&o.scale!==1)applyObjectScale(o,o.scale);});
  activeOrbs.forEach(o=>{if(o.scale&&o.scale!==1)applyObjectScale(o,o.scale);});
  activePads.forEach(o=>{if(o.scale&&o.scale!==1)applyObjectScale(o,o.scale);});
  activeSpikes.forEach(o=>{const src=(activePlayableLevel.spikes||[]).find(s=>s.x===o.x);if(src){o.groups=deepClone(src.groups||[]);o.color=src.color||null;o.rotation=src.rotation||0;o.scale=src.scale||1;if(o.scale!==1)applyObjectScale(o,o.scale);}});
  runtimeEffects=[];
  if(activePlayableLevel.initialMode)playerMode=activePlayableLevel.initialMode;
  const multiplier=Number(activePlayableLevel.initialSpeed)||1;
  currentGameSpeed=BASE_GAME_SPEED*multiplier;
};

const ORB_COLOR_MAP={yellow:'#ffe600',pink:'#ff4fd8',blue:'#38bdf8',red:'#ef4444',green:'#22c55e',black:'#475569',purple:'#a855f7',cyan:'#06b6d4',dash:'#f97316'};
const oldDrawOrb=drawOrb;
drawOrb=function(orb,screenX){
  const color=ORB_COLOR_MAP[orb.color]||(/^#[0-9a-f]{6}$/i.test(orb.color||'')?orb.color:null);if(!color){oldDrawOrb(orb,screenX);return;}
  const radius=Number(orb.radius)||17;if(screenX+radius*2<-40||screenX-radius*2>canvas.width+40)return;
  ctx.save();ctx.globalAlpha=orb.used?.45:1;ctx.fillStyle=color+'44';ctx.beginPath();ctx.arc(screenX,orb.y,radius+7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.arc(screenX,orb.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.globalAlpha*=.8;ctx.beginPath();ctx.arc(screenX-radius*.2,orb.y-radius*.2,radius*.32,0,Math.PI*2);ctx.fill();ctx.restore();
};
const oldCheckOrb=checkOrbTrigger;
checkOrbTrigger=function(p,orb,screenX){
  if(orb.used||(!isHoldingJump&&!jumpJustPressed))return;
  const radius=Number(orb.radius)||17,pcx=p.x+p.size/2,pcy=p.y+p.size/2,dx=pcx-screenX,dy=pcy-orb.y;
  if(dx*dx+dy*dy>(p.size*.65+radius+1)*(p.size*.65+radius+1))return;
  orb.used=true;jumpJustPressed=false;playerMode='cube';p.grounded=false;
  const force={yellow:-17.5,pink:-22.5,blue:-16,red:-27,green:-14,black:11,purple:-21,cyan:-18,dash:-19};
  p.dy=force[orb.color]===undefined?-17.5:force[orb.color];
  if(orb.color==='blue')gravityMultiplier*=-1;
  if(orb.color==='dash')currentGameSpeed=Math.min(BASE_GAME_SPEED*1.5,currentGameSpeed*1.15);
  playSfx('pad');spawnEndParticles(screenX,orb.y,12,true);
};
const PAD_COLOR_MAP={yellow:'#ffe600',pink:'#ff4fd8',red:'#ef4444',blue:'#38bdf8',green:'#22c55e',black:'#475569'};
const oldDrawPad=drawPad;
drawPad=function(pad,screenX){
  const color=PAD_COLOR_MAP[pad.color]||(/^#[0-9a-f]{6}$/i.test(pad.color||'')?pad.color:null);if(!color){oldDrawPad(pad,screenX);return;}
  const w=Number(pad.width)||36,h=Number(pad.height)||11,y=pad.y===undefined?GROUND_Y-h:pad.y-h/2;
  if(screenX+w<-40||screenX>canvas.width+40)return;
  ctx.save();if(pad.rotation){ctx.translate(screenX+w/2,y+h/2);ctx.rotate(pad.rotation);screenX=-w/2;}
  else ctx.translate(0,0);
  const top=pad.rotation?-h/2:y;
  ctx.fillStyle=color+'55';ctx.fillRect(screenX-4,top-8,w+8,h+10);
  ctx.fillStyle=color;ctx.strokeStyle='#000';ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(screenX,top,w,h,[6,6,2,2]);ctx.fill();ctx.stroke();ctx.restore();
};
const oldCheckPad=checkPadCollision;
checkPadCollision=function(p,pad,screenX){
  if(pad.cooldown>0){pad.cooldown--;return;}
  const w=Number(pad.width)||36,h=Number(pad.height)||14,padTop=pad.y===undefined?GROUND_Y-h:pad.y-h/2;
  const overlaps=p.x+p.size>screenX+3&&p.x<screenX+w-3&&p.y+p.size>=padTop&&p.y<GROUND_Y;
  if(!overlaps)return;
  pad.cooldown=12;playerMode='cube';p.grounded=false;
  const force={yellow:PAD_YELLOW_FORCE,pink:PAD_PINK_FORCE,red:-29,blue:-16,green:-17,black:12};
  p.dy=force[pad.color]===undefined?PAD_YELLOW_FORCE:force[pad.color];
  if(pad.color==='blue')gravityMultiplier*=-1;
  playSfx('pad');spawnEndParticles(screenX+w/2,padTop,10,true);
};

const oldPlayerUpdate=player.update;
player.update=function(){
  if(playerMode==='cube'||playerMode==='ship'){oldPlayerUpdate.call(this);return;}
  this.prevY=this.y;
  if(playerMode==='wave'){
    this.dy=(isHoldingJump?-7.2:7.2)*(gravityMultiplier<0?-1:1);
    this.y+=this.dy;
  } else if(playerMode==='ball'){
    if(jumpJustPressed){gravityMultiplier*=-1;this.dy=0;jumpJustPressed=false;playSfx('jump');}
    this.dy+=GRAVITY*gravityMultiplier;this.y+=this.dy;
  } else if(playerMode==='ufo'){
    if(jumpJustPressed){this.dy=-13.5*gravityMultiplier;jumpJustPressed=false;playSfx('jump');}
    this.dy+=GRAVITY*gravityMultiplier;this.y+=this.dy;
  } else if(playerMode==='robot'){
    if(jumpJustPressed&&this.grounded){this.dy=-17.5*gravityMultiplier;this.grounded=false;jumpJustPressed=false;playSfx('jump');}
    else if(isHoldingJump&&this.dy<0)this.dy-=.18*gravityMultiplier;
    this.dy+=GRAVITY*gravityMultiplier;this.y+=this.dy;
  } else if(playerMode==='spider'){
    if(jumpJustPressed){gravityMultiplier*=-1;this.y=gravityMultiplier>0?GROUND_Y-this.size:CEILING_Y;this.dy=0;this.grounded=true;jumpJustPressed=false;playSfx('portal');}
    else {this.dy+=GRAVITY*gravityMultiplier;this.y+=this.dy;}
  }
  if(this.y+this.size>=GROUND_Y){this.y=GROUND_Y-this.size;if(this.dy>0)this.dy=0;this.grounded=gravityMultiplier>0;}
  if(this.y<=CEILING_Y){this.y=CEILING_Y;if(this.dy<0)this.dy=0;this.grounded=gravityMultiplier<0;}
  if(playerMode!=='wave'&&playerMode!=='spider')this.rotation+=.105;
};
const oldDrawPortal=drawPortal;
drawPortal=function(portal,screenX){
  if((portal.type==='cube'||portal.type==='ship')&&portal.y===undefined&&!portal.rotation&&!portal.color&&(!portal.scale||portal.scale===1)){oldDrawPortal(portal,screenX);return;}
  if(screenX+PORTAL_WIDTH<-70||screenX>canvas.width+70)return;
  const colors={cube:'#80ed99',ship:'#38bdf8',ball:'#f59e0b',ufo:'#a78bfa',wave:'#22d3ee',robot:'#fb923c',spider:'#f472b6',gravity:'#c084fc',mirror:'#e2e8f0'};
  const pw=portal.width||PORTAL_WIDTH,ph=portal.height||PORTAL_HEIGHT,color=portal.color||colors[portal.type]||'#38bdf8',cx=screenX+pw/2,cy=portal.y===undefined?GROUND_Y-ph/2:portal.y;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(portal.rotation||0);ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,pw*.38,ph*.43,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,pw*.25,ph*.34,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 8px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillText(String(portal.type).toUpperCase(),0,ph*.53);ctx.restore();
};
const oldPlayerDraw=player.draw;
player.draw=function(){
  if(playerMode==='cube'||playerMode==='ship'){oldPlayerDraw.call(this);return;}
  const cx=this.x+this.size/2,cy=this.y+this.size/2,s=this.size/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(playerMode==='wave'?Math.atan2(this.dy,BASE_GAME_SPEED):this.rotation);
  ctx.fillStyle=playerSkin.primary;ctx.strokeStyle='#000';ctx.lineWidth=3;
  if(playerMode==='ball'){
    ctx.beginPath();ctx.arc(0,0,s*.95,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=playerSkin.secondary;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,s*.62,0,Math.PI*1.5);ctx.stroke();
  }else if(playerMode==='ufo'){
    ctx.beginPath();ctx.ellipse(0,2,s, s*.48,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(0,-s*.22,s*.48,Math.PI,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=playerSkin.secondary;ctx.fillRect(-s*.55,s*.12,s*1.1,s*.16);
  }else if(playerMode==='wave'){
    ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(-s,-s*.78);ctx.lineTo(-s,s*.78);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=playerSkin.secondary;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-s*.35,0);ctx.lineTo(s*.35,0);ctx.stroke();
  }else if(playerMode==='robot'){
    ctx.fillRect(-s*.82,-s*.82,s*1.64,s*1.45);ctx.strokeRect(-s*.82,-s*.82,s*1.64,s*1.45);
    ctx.fillStyle=playerSkin.secondary;ctx.fillRect(-s*.5,-s*.35,s*.28,s*.28);ctx.fillRect(s*.22,-s*.35,s*.28,s*.28);
    ctx.fillStyle=playerSkin.primary;ctx.fillRect(-s*.58,s*.62,s*.35,s*.42);ctx.fillRect(s*.23,s*.62,s*.35,s*.42);
  }else if(playerMode==='spider'){
    ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/8,r=i%2?s*.72:s*.95,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=playerSkin.secondary;ctx.lineWidth=3;for(let i=0;i<4;i++){const y=(i-1.5)*s*.36;ctx.beginPath();ctx.moveTo(-s*.65,y);ctx.lineTo(-s*1.12,y-s*.2);ctx.moveTo(s*.65,y);ctx.lineTo(s*1.12,y-s*.2);ctx.stroke();}
  }
  ctx.restore();
};
const oldPortalCheck=checkPortalTrigger;
checkPortalTrigger=function(p,portal,screenX){
  if(portal.triggered)return;
  const pw=portal.width||PORTAL_WIDTH,ph=portal.height||PORTAL_HEIGHT,top=portal.y===undefined?GROUND_Y-ph:portal.y-ph/2,bottom=top+ph;
  const overlaps=p.x+p.size>screenX+6&&p.x<screenX+pw-6&&p.y+p.size>top&&p.y<bottom;
  if(!overlaps)return;
  portal.triggered=true;
  if(['cube','ship','ball','ufo','wave','robot','spider'].includes(portal.type))playerMode=portal.type;
  else if(portal.type==='gravity'||portal.type==='mirror'){gravityMultiplier*=-1;p.dy=0;}
  if(portal.type==='ship'){p.dy=Math.min(p.dy,-3);p.grounded=false;}
  playSfx('portal');spawnEndParticles(screenX+PORTAL_WIDTH/2,p.y+p.size/2,16,true);
};
const oldDrawPlatform=drawPlatform;
drawPlatform=function(plat,screenX){
  if(screenX+plat.w<-60||screenX>canvas.width+60)return;
  const paint=(obj,x)=>{
    if(!obj.color){oldDrawPlatform(obj,x);return;}
    ctx.save();ctx.fillStyle=obj.color;ctx.strokeStyle='#000';ctx.lineWidth=3;
    ctx.fillRect(x,obj.y,obj.w,obj.h);ctx.strokeRect(x,obj.y,obj.w,obj.h);
    ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.strokeRect(x+3,obj.y+3,Math.max(0,obj.w-6),Math.max(0,obj.h-6));ctx.restore();
  };
  if(plat.rotation){ctx.save();ctx.translate(screenX+plat.w/2,plat.y+plat.h/2);ctx.rotate(plat.rotation);paint(Object.assign({},plat,{y:-plat.h/2}),-plat.w/2);ctx.restore();}
  else paint(plat,screenX);
};
const oldDrawPillar=drawPillar;
drawPillar=function(pillar,screenX){
  const w=pillar.w||34,h=pillar.h||90,centerY=pillar.y===undefined?GROUND_Y-h/2:pillar.y,top=centerY-h/2;if(screenX+w<-50||screenX>canvas.width+50)return;
  ctx.save();if(pillar.rotation){ctx.translate(screenX+w/2,centerY);ctx.rotate(pillar.rotation);ctx.fillStyle=pillar.color||'rgba(255,255,255,.14)';ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);}
  else{ctx.fillStyle=pillar.color||'rgba(255,255,255,.14)';ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.fillRect(screenX,top,w,h);ctx.strokeRect(screenX,top,w,h);}ctx.restore();
};
const oldDrawSaw=drawSaw;
drawSaw=function(saw,screenX){
  const base=saw.angle||0;saw.angle=base+(saw.rotation||0);oldDrawSaw(saw,screenX);saw.angle=base;
  if(saw.color){ctx.save();ctx.fillStyle=saw.color;ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(screenX,saw.y,(saw.r||22)*.42,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
};
const oldCheckCoin=checkCoinTrigger;
checkCoinTrigger=function(p,coin,screenX){
  if(!coin.radius){oldCheckCoin(p,coin,screenX);return;}
  if(coin.collected)return;const dx=p.x+p.size/2-screenX,dy=p.y+p.size/2-coin.y,hit=p.size*.55+coin.radius;
  if(dx*dx+dy*dy<=hit*hit){coin.collected=true;playSfx('coin');spawnEndParticles(screenX,coin.y,12,true);}
};
const oldDrawCoin=drawCoin;
drawCoin=function(coin,screenX){
  if(coin.collected)return;const r=coin.radius||13;if(screenX+r*2<-40||screenX-r*2>canvas.width+40)return;
  ctx.save();ctx.fillStyle=coin.color||'#ffd60a';ctx.strokeStyle='#000';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(screenX,coin.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
};
const oldDrawElements=drawLevelElementsInWorld;
drawLevelElementsInWorld=function(){
  oldDrawElements();drawRuntimeExtraObjects();
  activeSpikes.forEach(s=>{
    if(!s.color)return;const sx=s.x-levelDistance+160,sy=s.inverted?(s.y||CEILING_Y):GROUND_Y;
    ctx.save();ctx.fillStyle=s.color;ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();
    if(s.inverted){ctx.moveTo(sx,sy);ctx.lineTo(sx+s.width/2,sy+s.height);ctx.lineTo(sx+s.width,sy);}
    else{ctx.moveTo(sx,sy);ctx.lineTo(sx+s.width/2,sy-s.height);ctx.lineTo(sx+s.width,sy);}
    ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  });
};
const oldTriggerCheck=checkTriggerActivation;
checkTriggerActivation=function(p,trig,screenX) {
  const was=trig.triggered;oldTriggerCheck(p,trig,screenX);
  if(was||!trig.triggered||!['move','pulse','scale','color','speed'].includes(trig.kind))return;
  const targets=allRuntimeObjects().filter(o=>objectGroupList(o).includes(String(trig.group||'1')));
  const duration=Math.max(.05,Number(trig.duration)||1);
  targets.forEach(o=>{
    if(trig.kind==='move'){runtimeEffects.push({type:'move',object:o,elapsed:0,duration:duration,remaining:duration,fromX:o.x||0,fromY:objectCenter(o).y,toX:(o.x||0)+(Number(trig.distance)||0),toY:objectCenter(o).y+(Number(trig.verticalDistance)||0)});}
    if(trig.kind==='scale'){runtimeEffects.push({type:'scale',object:o,elapsed:0,duration:duration,remaining:duration,fromScale:o.scale||1,toScale:Math.max(.1,Math.min(5,Number(trig.scale)||1.5))});}
    if(trig.kind==='color'){o.color=trig.color||'#00e5ff';}
    if(trig.kind==='pulse'){runtimeEffects.push({object:o,remaining:duration,elapsed:0,baseScale:o.scale||1,intensity:Math.max(.05,Number(trig.intensity)||1)});}
  });
  if(trig.kind==='speed'){
    const multiplier=Number(trig.speedMultiplier);
    const custom=Number(trig.customSpeed);
    const target=BASE_GAME_SPEED*(multiplier===99?(Number.isFinite(custom)?custom:1):(Number.isFinite(multiplier)?multiplier:1));
    runtimeEffects.push({type:'speed',elapsed:0,duration:duration,remaining:duration,fromSpeed:currentGameSpeed,toSpeed:target});
  }
};
function allRuntimeObjects() {
  const arrays=[activePlatforms,activeSpikes,activePads,activeOrbs,activeSaws,activePillars,activeCoins,activePortals,extraRuntimeObjects];
  return arrays.flatMap(a=>Array.isArray(a)?a:[]);
}
const oldLoop=loop;
loop=function() {
  const now=performance.now(),dt=gameState==='PLAYING'&&lastFrameAt?Math.min(.05,(now-lastFrameAt)/1000):0;lastFrameAt=now;
  runtimeEffects=runtimeEffects.filter(effect=>{
    effect.elapsed+=dt;effect.remaining-=dt;
    const progress=Math.min(1,effect.elapsed/Math.max(.001,effect.duration||1));
    if(effect.type==='move'){
      effect.object.x=effect.fromX+(effect.toX-effect.fromX)*progress;
      if(effect.object.y!==undefined||effect.toY!==effect.fromY)effect.object.y=effect.fromY+(effect.toY-effect.fromY)*progress;
      if(effect.remaining<=0){effect.object.x=effect.toX;effect.object.y=effect.toY;return false;}return true;
    }
    if(effect.type==='scale'){
      applyObjectScale(effect.object,effect.fromScale+(effect.toScale-effect.fromScale)*progress);
      if(effect.remaining<=0){applyObjectScale(effect.object,effect.toScale);return false;}return true;
    }
    if(effect.type==='speed'){
      currentGameSpeed=effect.fromSpeed+(effect.toSpeed-effect.fromSpeed)*progress;
      if(effect.remaining<=0){currentGameSpeed=effect.toSpeed;return false;}return true;
    }
    const pulse=1+Math.sin(effect.elapsed*Math.PI*4)*.12*effect.intensity;
    applyObjectScale(effect.object,effect.baseScale*pulse);
    if(effect.remaining<=0){applyObjectScale(effect.object,effect.baseScale);return false;}return true;
  });
  if(gameState==='PLAYING'&&currentGameSpeed<0&&levelDistance<=0)currentGameSpeed=0;
  oldLoop();
};

function openStageSettings() {
  let panel=$('stage-settings-panel');
  if(!panel){
    panel=document.createElement('section');panel.id='stage-settings-panel';panel.className='stage-settings-panel';
    panel.innerHTML='<div class="stage-settings-head"><strong>LEVEL SETTINGS</strong><button id="stage-settings-close" type="button">×</button></div><div class="stage-settings-grid"><label>START MODE<select id="stage-start-mode"><option value="cube">Cube</option><option value="ship">Ship</option><option value="ball">Ball</option><option value="ufo">UFO</option><option value="wave">Wave</option><option value="robot">Robot</option><option value="spider">Spider</option></select></label><label>START SPEED<select id="stage-start-speed"><option value="0.5">0.5x</option><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option><option value="3">3x</option><option value="4">4x</option><option value="5">5x</option></select></label><label>BACKGROUND TOP<input id="stage-bg-top" type="color"></label><label>BACKGROUND BOTTOM<input id="stage-bg-bottom" type="color"></label><label>GROUND<input id="stage-ground" type="color"></label><label>GROUND GRID<input id="stage-ground-grid" type="color"></label></div><p>Changes are saved with the level.</p>';
    editorRoot.appendChild(panel);
    $('stage-settings-close').addEventListener('click',()=>panel.classList.add('hidden'));
    ['stage-start-mode','stage-start-speed','stage-bg-top','stage-bg-bottom','stage-ground','stage-ground-grid'].forEach(id=>$(id).addEventListener('input',syncStageSettings));
  }
  panel.classList.remove('hidden');
  $('stage-start-mode').value=editorDraft.initialMode||'cube';$('stage-start-speed').value=String(editorDraft.initialSpeed||1);
  $('stage-bg-top').value=editorDraft.bgTop;$('stage-bg-bottom').value=editorDraft.bgBottom;
  $('stage-ground').value=editorDraft.groundFill;$('stage-ground-grid').value=editorDraft.groundGrid;
}
function syncStageSettings() {
  editorDraft.initialMode=$('stage-start-mode').value;editorDraft.initialSpeed=Number($('stage-start-speed').value)||1;
  editorDraft.bgTop=$('stage-bg-top').value;editorDraft.bgBottom=$('stage-bg-bottom').value;
  editorDraft.groundFill=$('stage-ground').value;editorDraft.groundGrid=$('stage-ground-grid').value;
  $('style-bg-top').value=editorDraft.bgTop;$('style-bg-bottom').value=editorDraft.bgBottom;
  $('style-ground-fill').value=editorDraft.groundFill;$('style-ground-grid').value=editorDraft.groundGrid;
  drawEditorCanvas();
}
function addAdvancedTriggerEditor() {
  const tabBar=editorRoot.querySelector('.editor-tabs');
  const styleTab=tabBar&&tabBar.querySelector('[data-tab="style"]');
  if(styleTab&&!$('stage-settings-btn')){
    const b=document.createElement('button');b.id='stage-settings-btn';b.type='button';b.className='editor-tab';b.textContent='LEVEL SETTINGS';
    b.addEventListener('click',openStageSettings);tabBar.appendChild(b);
  }
  const cat=EXTRA_CATEGORIES.find(c=>c.id==='triggers');
  cat.items.forEach(it=>{
    const existing=TRIGGER_PALETTE.find(t=>t.id===it[0]);if(!existing)TRIGGER_PALETTE.push({id:it[0],label:it[1],color:it[3]});
  });
}
function configureSelectedTrigger() {
  const rec=getSelectionRecords().find(s=>s.key==='triggers');if(!rec)return;
  const t=rec.obj;
  let panel=$('trigger-config-panel');
  if(!panel){
    panel=document.createElement('div');panel.id='trigger-config-panel';panel.className='trigger-config-panel';
    panel.innerHTML='<strong>TRIGGER SETTINGS</strong><label>GROUP<input id="trigger-group" type="text" value="1"></label><label>DURATION<input id="trigger-duration" type="number" min="0.05" step="0.1" value="1"></label><label>INTENSITY<input id="trigger-intensity" type="number" min="0.05" step="0.1" value="1"></label><label>DISTANCE X<input id="trigger-distance" type="number" step="1" value="120"></label><label>DISTANCE Y<input id="trigger-distance-y" type="number" step="1" value="0"></label><label>SCALE<input id="trigger-scale" type="number" min="0.1" max="5" step="0.1" value="1.5"></label><label>COLOR<input id="trigger-color" type="color" value="#00e5ff"></label><label>SPEED<select id="trigger-speed"><option value="-1">-1x</option><option value="1">1x</option><option value="2">2x</option><option value="3">3x</option><option value="4">4x</option><option value="5">5x</option><option value="99">Custom</option></select></label><label>CUSTOM SPEED<input id="trigger-custom-speed" type="number" min="0.1" max="10" step="0.1" value="1"></label><button id="trigger-apply" type="button">APPLY TRIGGER</button>';
    editorRoot.appendChild(panel);
    $('trigger-apply').addEventListener('click',()=>{
      const s=getSelectionRecords().find(x=>x.key==='triggers');if(!s)return;recordHistory();
      const o=s.obj;o.group=$('trigger-group').value||'1';o.duration=Math.max(.05,Number($('trigger-duration').value)||1);
      o.intensity=Math.max(.05,Number($('trigger-intensity').value)||1);o.distance=Number($('trigger-distance').value)||0;
      o.verticalDistance=Number($('trigger-distance-y').value)||0;o.scale=Math.max(.1,Math.min(5,Number($('trigger-scale').value)||1));
      o.color=$('trigger-color').value;o.speedMultiplier=Number($('trigger-speed').value);
      o.customSpeed=Math.max(.1,Math.min(10,Number($('trigger-custom-speed').value)||1));drawEditorCanvas();
    });
  }
  panel.classList.remove('hidden');
  $('trigger-group').value=t.group||'1';$('trigger-duration').value=t.duration||1;$('trigger-intensity').value=t.intensity||1;
  $('trigger-distance').value=t.distance||120;$('trigger-distance-y').value=t.verticalDistance||0;
  $('trigger-scale').value=t.scale||1.5;$('trigger-color').value=t.color||'#00e5ff';
  $('trigger-speed').value=String(t.speedMultiplier===undefined?1:t.speedMultiplier);$('trigger-custom-speed').value=t.customSpeed||1;
}
const oldSetSelection=setSelection;
setSelection=function(records){oldSetSelection(records);const rec=getSelectionRecords().find(s=>s.key==='triggers');if(rec)configureSelectedTrigger();else if($('trigger-config-panel'))$('trigger-config-panel').classList.add('hidden');};
function installSelectionInput() {
  document.addEventListener('pointerdown',e=>{
    if(e.target!==editorCanvas||gameState!=='EDITOR'||editorToolMode!=='select')return;
    e.preventDefault();e.stopImmediatePropagation();
    const p=getEditorWorldCoords(e,false),found=findObjectAt(p),multi=e.shiftKey||e.ctrlKey||e.metaKey;
    if(!found){if(!multi)setSelection([]);return;}
    let next=getSelectionRecords();
    if(multi&&next.some(s=>s.obj===found.obj))next=next.filter(s=>s.obj!==found.obj);
    else if(multi)next.push(found);else next=[found];
    setSelection(next);
    if(next.some(s=>s.obj===found.obj)){
      recordHistory();dragState={pointerId:e.pointerId,lastX:p.x,lastY:p.y,items:next.map(s=>({key:s.key,obj:s.obj}))};
      editorCanvas.setPointerCapture(e.pointerId);
    }
  },true);
  editorCanvas.addEventListener('pointermove',e=>{
    if(!dragState||dragState.pointerId!==e.pointerId)return;
    const p=getEditorWorldCoords(e,Boolean(e.shiftKey)),dx=p.x-dragState.lastX,dy=p.y-dragState.lastY;
    const step=e.shiftKey?gridUnit/2:gridUnit;
    dragState.items.forEach(s=>{
      s.obj.x=Math.round(((s.obj.x||0)+dx)/step)*step;
      if(s.obj.y!==undefined)s.obj.y=Math.round((s.obj.y+dy)/(step/EDITOR_SCALE_Y))*(step/EDITOR_SCALE_Y);
    });
    dragState.lastX=p.x;dragState.lastY=p.y;refreshInspector();drawEditorCanvas();
  },true);
  const end=()=>{dragState=null;updateAutoFinish();drawEditorCanvas();};
  editorCanvas.addEventListener('pointerup',end,true);editorCanvas.addEventListener('pointercancel',end,true);
}
document.addEventListener('keydown',e=>{
  if(gameState!=='EDITOR'||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
  if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();e.stopImmediatePropagation();undoLocalEditor();}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();e.stopImmediatePropagation();redoLocalEditor();}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyC'){e.preventDefault();e.stopImmediatePropagation();clipboardObjects=getSelectionRecords().map(s=>({key:s.key,obj:deepClone(s.obj)}));}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyV'&&clipboardObjects.length){e.preventDefault();e.stopImmediatePropagation();recordHistory();const next=clipboardObjects.map(s=>{const o=deepClone(s.obj);o.id=makeId();o.x=(o.x||0)+gridUnit;editorDraft[s.key].push(o);return {key:s.key,obj:o};});setSelection(next);}
},true);
function addKeyboardEditorShortcuts() {
  window.addEventListener('keydown',e=>{
    if(gameState!=='EDITOR'||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyD'){e.preventDefault();duplicateSelection();}
    if(e.key==='Delete'&&getSelectionRecords().length){recordHistory();getSelectionRecords().forEach(s=>{const a=editorDraft[s.key],i=a.indexOf(s.obj);if(i>=0)a.splice(i,1);});setSelection([]);}
    if(e.key==='Escape')setSelection([]);
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='ArrowDown'){
      const delta=e.shiftKey?gridUnit/2:gridUnit;if(!getSelectionRecords().length)return;e.preventDefault();recordHistory();
      getSelectionRecords().forEach(s=>{if(e.key==='ArrowLeft')s.obj.x-=delta;if(e.key==='ArrowRight')s.obj.x+=delta;if(e.key==='ArrowUp')s.obj.y=(s.obj.y||0)-delta;if(e.key==='ArrowDown')s.obj.y=(s.obj.y||0)+delta;});drawEditorCanvas();refreshInspector();
    }
  });
}
const clearButton=$('editor-clear-btn');if(clearButton)clearButton.classList.add('hidden');
document.addEventListener('pointerdown',e=>{
  if(e.target===editorCanvas&&gameState==='EDITOR'&&editorToolMode==='place'&&editorSelectedItem==='platform')recordHistory();
},true);
const oldSave=saveEditorDraftToCreations;
saveEditorDraftToCreations=function(){ensureDraftSchema(editorDraft);oldSave();};
const oldOpen=openEditorWithLevel;
openEditorWithLevel=function(level){oldOpen(level);ensureDraftSchema(editorDraft);selectedObjects=[];selectedEditorObject=null;localUndoStack=[];localRedoStack=[];refreshInspector();};
const oldRenderPalettes=renderEditorPalettes;
renderEditorPalettes=function(){oldRenderPalettes();renderAssetLibrary();};
const oldSyncTools=syncEditorToolButtons;
syncEditorToolButtons=function(){oldSyncTools();const bar=$('editor-command-bar');if(bar)bar.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===editorToolMode));};

function installGameWindowResize(){
  const container=$('game-container'),handle=$('game-resize-handle');
  if(!container||!handle||handle.dataset.ready)return;
  handle.dataset.ready='1';
  let startX=0,startWidth=container.getBoundingClientRect().width,active=false;
  handle.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();active=true;startX=e.clientX;
    startWidth=container.getBoundingClientRect().width;
    handle.setPointerCapture?.(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
    if(!active)return;
    const maxWidth=Math.max(480,Math.min(window.innerWidth-18,window.innerHeight*.94*1.8));
    const width=Math.max(480,Math.min(maxWidth,startWidth+e.clientX-startX));
    container.style.width=width+'px';
    container.style.height=(width*5/9)+'px';
  });
  const stop=()=>{active=false;};
  handle.addEventListener('pointerup',stop);
  handle.addEventListener('pointercancel',stop);
}

addCategoryPanel();addEditorCommandBar();addGridSettings();addInspector();addAdvancedTriggerEditor();installSelectionInput();addKeyboardEditorShortcuts();installGameWindowResize();
ensureDraftSchema(editorDraft);
renderAssetLibrary();
})();
