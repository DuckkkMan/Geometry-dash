/* Geometry Dash Web - expansão principal v1.0
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
  const s=skin || modeSkins[mode] || modeSkins.cube;
  const cx=x+size/2, cy=y+size/2, scale=size/44;
  c.save(); c.translate(cx,cy); c.rotate(rotation||0); c.scale(scale,scale);
  c.lineWidth=3; c.strokeStyle='#080d18'; c.fillStyle=s.primary;
  if(mode==='cube') {
    roundedRect(c,-21,-21,42,42,5); c.fill(); c.stroke();
    c.fillStyle=s.secondary; c.fillRect(-13,-11,8,8); c.fillRect(5,-11,8,8);
    c.fillRect(-12,5,24,7);
  } else if(mode==='ship') {
    c.beginPath(); c.moveTo(-23,-7); c.lineTo(11,-15); c.lineTo(23,0); c.lineTo(9,15); c.lineTo(-23,8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle=s.secondary; c.beginPath(); c.moveTo(-10,-5); c.lineTo(7,-9); c.lineTo(13,0); c.lineTo(5,7); c.lineTo(-10,5); c.closePath(); c.fill(); c.stroke();
  } else if(mode==='ball') {
    c.beginPath(); c.arc(0,0,20,0,Math.PI*2); c.fill(); c.stroke();
    c.strokeStyle=s.secondary; c.lineWidth=5; c.beginPath(); c.arc(0,0,12,-.8,2.3); c.stroke();
    c.fillStyle=s.secondary; c.beginPath(); c.arc(-6,-5,3,0,Math.PI*2); c.arc(7,7,3,0,Math.PI*2); c.fill();
  } else if(mode==='ufo') {
    c.beginPath(); c.ellipse(0,5,23,11,0,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle=s.secondary; c.beginPath(); c.arc(0,-5,11,Math.PI,Math.PI*2); c.closePath(); c.fill(); c.stroke();
    [-12,0,12].forEach(px=>{c.fillStyle='#fff';c.beginPath();c.arc(px,7,2,0,Math.PI*2);c.fill();});
  } else if(mode==='wave') {
    c.beginPath(); c.moveTo(-22,13); c.lineTo(0,-15); c.lineTo(22,13); c.lineTo(9,13); c.lineTo(0,1); c.lineTo(-9,13); c.closePath(); c.fill(); c.stroke();
  } else if(mode==='robot') {
    roundedRect(c,-18,-20,36,37,5); c.fill(); c.stroke();
    c.fillStyle=s.secondary; c.fillRect(-12,-10,7,8); c.fillRect(5,-10,7,8);
    c.fillRect(-7,3,14,5); c.strokeStyle='#080d18'; c.strokeRect(-7,3,14,5);
    c.strokeStyle=s.primary; c.lineWidth=5; c.beginPath(); c.moveTo(-12,16); c.lineTo(-16,22); c.moveTo(12,16); c.lineTo(16,22); c.stroke();
  } else {
    c.beginPath(); c.arc(0,0,14,0,Math.PI*2); c.fill(); c.stroke();
    c.strokeStyle=s.secondary; c.lineWidth=4;
    for(let a=0;a<Math.PI*2;a+=Math.PI/3){c.beginPath();c.moveTo(Math.cos(a)*10,Math.sin(a)*10);c.lineTo(Math.cos(a)*23,Math.sin(a)*23);c.stroke();}
    c.fillStyle=s.secondary; c.beginPath(); c.arc(-5,-3,2.5,0,Math.PI*2); c.arc(5,-3,2.5,0,Math.PI*2); c.fill();
  }
  // Variações reais de rosto/decoração para os oito ícones de cada modo.
  const variant=(Number(s.model)||0)%8;
  c.fillStyle=s.secondary; c.strokeStyle='#07101d'; c.lineWidth=2;
  if(variant===0){c.fillRect(-12,-7,7,7);c.fillRect(5,-7,7,7);}
  else if(variant===1){c.beginPath();c.arc(-8,-4,4,0,Math.PI*2);c.arc(8,-4,4,0,Math.PI*2);c.fill();}
  else if(variant===2){c.fillRect(-13,-8,10,4);c.fillRect(3,-8,10,4);c.fillRect(-7,7,14,4);}
  else if(variant===3){c.beginPath();c.moveTo(-13,-7);c.lineTo(-4,-2);c.lineTo(-13,2);c.fill();c.beginPath();c.moveTo(13,-7);c.lineTo(4,-2);c.lineTo(13,2);c.fill();}
  else if(variant===4){c.fillRect(-12,-5,24,5);c.fillRect(-8,7,16,3);}
  else if(variant===5){c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.stroke();}
  else if(variant===6){c.fillRect(-14,-10,28,3);c.fillRect(-14,8,28,3);}
  else {c.beginPath();c.moveTo(-12,-8);c.lineTo(-5,-1);c.lineTo(-12,6);c.moveTo(12,-8);c.lineTo(5,-1);c.lineTo(12,6);c.stroke();}
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
  if(playerMode==='cube') { drawCubeSkin(ctx,this.x,this.y,this.size,this.rotation,modeSkins.cube); return; }
  if(playerMode==='ship') { drawShipPlayer(ctx,this.x,this.y,this.size,this.dy,modeSkins.ship); return; }
  drawModeIcon(ctx,playerMode,this.x,this.y,this.size,this.rotation,modeSkins[playerMode]);
};
const originalStartAttempt=startAttempt;
startAttempt=function(countNewAttempt=true) {
  activeTrail=[];
  trailTick=0;
  modeGravity=1;
  originalStartAttempt(countNewAttempt);
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
    eCtx.save();eCtx.shadowColor=color;eCtx.shadowBlur=10;eCtx.strokeStyle=color;eCtx.lineWidth=4;
    eCtx.beginPath();eCtx.ellipse(sx+16,cy,12,30,0,0,Math.PI*2);eCtx.stroke();eCtx.restore();
  });
};
renderEditorPalettes();

// === GARAGEM DE ÍCONES MULTIMODO ===
const originalRenderSkinUI=renderSkinUI;
renderSkinUI=function() {
  originalRenderSkinUI();
  const icon=document.getElementById('skin-btn-icon');
  if(icon)drawModeIcon(icon.getContext('2d'),activeSkinMode,4,4,36,0,modeSkins[activeSkinMode]);
  const preview=document.getElementById('skin-preview');
  if(preview){const pc=preview.getContext('2d');pc.clearRect(0,0,80,80);drawModeIcon(pc,activeSkinMode,12,12,56,0,modeSkins[activeSkinMode]);}
};
function renderModeGarage() {
  const garage=document.querySelector('.garage-box');
  if(!garage)return;
  let panel=document.getElementById('mode-skin-panel');
  if(!panel) {
    panel=document.createElement('section');panel.id='mode-skin-panel';panel.className='mode-skin-panel';
    const preview=garage.querySelector('.preview-stage');
    preview.insertAdjacentElement('afterend',panel);
  }
  panel.innerHTML='';
  const heading=document.createElement('div');heading.className='mode-skin-heading';heading.textContent='MODO / ÍCONE';panel.appendChild(heading);
  const modes=document.createElement('div');modes.className='mode-skin-tabs';
  MODE_LIST.forEach(mode=>{
    const b=document.createElement('button');b.type='button';b.className='mode-skin-tab'+(activeSkinMode===mode?' selected':'');b.textContent=MODE_INFO[mode].name;
    b.addEventListener('click',()=>setActiveMode(mode));modes.appendChild(b);
  });
  panel.appendChild(modes);
  const models=document.createElement('div');models.className='mode-skin-models';
  for(let i=0;i<8;i++){
    const b=document.createElement('button');b.type='button';b.className='mode-model'+(modeSkins[activeSkinMode].model===i?' selected':'');
    const cv=document.createElement('canvas');cv.width=48;cv.height=48;
    drawModeIcon(cv.getContext('2d'),activeSkinMode,4,4,40,0,{...modeSkins[activeSkinMode],model:i});
    b.appendChild(cv);b.title='Ícone '+(i+1);
    b.addEventListener('click',()=>{
      modeSkins[activeSkinMode].model=i;
      playerSkin.model=i;saveModeSkins();renderModeGarage();renderSkinUI();
    });
    models.appendChild(b);
  }
  panel.appendChild(models);
  const colors=document.createElement('div');colors.className='mode-skin-colors';
  const label=document.createElement('span');label.textContent='CORES DO ÍCONE';colors.appendChild(label);
  const colorRow=document.createElement('div');colorRow.className='mode-color-row';
  const palette=['#ffde00','#9dff00','#00e5ff','#ff0055','#ff7b00','#b5179e','#ffffff','#111827','#8b5cf6','#14b8a6','#f97316','#f8fafc'];
  palette.forEach(color=>{
    const b=document.createElement('button');b.type='button';b.className='mode-color-swatch';b.style.background=color;b.title=color;
    b.addEventListener('click',()=>{
      const skin=modeSkins[activeSkinMode];
      if(!skin.primarySelected){skin.primary=color;skin.primarySelected=true;}else{skin.secondary=color;skin.primarySelected=false;}
      playerSkin.primary=skin.primary;playerSkin.secondary=skin.secondary;saveModeSkins();renderModeGarage();renderSkinUI();
    });
    colorRow.appendChild(b);
  });
  colors.appendChild(colorRow);panel.appendChild(colors);
}
const originalSetupGarage=setupGarage;
setupGarage=function() {
  originalSetupGarage();
  setActiveMode('cube');
};
renderModeGarage();

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
  if(gameState!=='EDITOR'||editorToolMode!=='select')return;
  e.preventDefault();e.stopImmediatePropagation();
  const p=getEditorWorldCoords(e);selectedEditorObject=locateEditorObject(p);
  if(selectedEditorObject){snapshotEditor();editorCanvas.setPointerCapture?.(e.pointerId);editorCanvas.dataset.moving='1';editorCanvas.dataset.lastX=String(p.x);editorCanvas.dataset.lastY=String(p.y);}
  drawEditorCanvas();
},true);
editorCanvas.addEventListener('pointermove',e=>{
  if(gameState!=='EDITOR'||editorToolMode!=='select'||editorCanvas.dataset.moving!=='1'||!selectedEditorObject)return;
  const p=getEditorWorldCoords(e),dx=p.x-Number(editorCanvas.dataset.lastX),dy=p.y-Number(editorCanvas.dataset.lastY);
  selectedEditorObject.obj.x=Math.max(250,(selectedEditorObject.obj.x||0)+dx);
  if(selectedEditorObject.obj.y!==undefined)selectedEditorObject.obj.y=Math.max(CEILING_Y,Math.min(GROUND_Y-20,selectedEditorObject.obj.y+dy));
  editorCanvas.dataset.lastX=String(p.x);editorCanvas.dataset.lastY=String(p.y);
},true);
editorCanvas.addEventListener('pointerup',()=>{editorCanvas.dataset.moving='0';},true);
const oldDrawEditor2=drawEditorCanvas;
drawEditorCanvas=function(){
  oldDrawEditor2();
  // Guia visual permanente do personagem inicial no editor.
  const guideX=160-editorScrollX+80, guideY=(GROUND_Y-BLOCK_SIZE)*EDITOR_SCALE_Y+22;
  eCtx.save();eCtx.strokeStyle='rgba(255,255,255,.65)';eCtx.setLineDash([5,5]);eCtx.lineWidth=2;
  eCtx.beginPath();eCtx.moveTo(guideX-70,guideY);eCtx.lineTo(guideX+2,guideY);eCtx.stroke();eCtx.setLineDash([]);
  drawModeIcon(eCtx,'cube',guideX-22,guideY-22,44,0,modeSkins.cube);eCtx.restore();
  if(selectedEditorObject){
    const o=selectedEditorObject.obj,sx=o.x-editorScrollX+80,sy=(o.y===undefined?GROUND_Y-40:o.y)*EDITOR_SCALE_Y;
    eCtx.save();eCtx.strokeStyle='#fff';eCtx.lineWidth=2;eCtx.setLineDash([5,4]);eCtx.strokeRect(sx-9,sy-22,Math.max(34,(o.w||30)+18),44);eCtx.restore();
  }
};
window.addEventListener('keydown',e=>{
  if(gameState!=='EDITOR')return;
  if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();undoEditor();}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();redoEditor();}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyC'&&selectedEditorObject){editorClipboard=JSON.parse(JSON.stringify(selectedEditorObject.obj));}
  else if((e.ctrlKey||e.metaKey)&&e.code==='KeyV'&&editorClipboard&&selectedEditorObject){
    e.preventDefault();const key=selectedEditorObject.key;snapshotEditor();const clone=JSON.parse(JSON.stringify(editorClipboard));clone.x+=EDITOR_GRID;editorDraft[key].push(clone);selectedEditorObject={key,obj:clone};
  } else if(e.code==='Delete'&&selectedEditorObject){
    const arr=editorDraft[selectedEditorObject.key];const idx=arr.indexOf(selectedEditorObject.obj);if(idx>=0){snapshotEditor();arr.splice(idx,1);}selectedEditorObject=null;
  }
});
const oldSyncTools=syncEditorToolButtons;
syncEditorToolButtons=function(){oldSyncTools();if(selectToolBtn)selectToolBtn.classList.toggle('active',editorToolMode==='select');};

// Extra triggers: slow speed, reverse gravity, and background color preset.
TRIGGER_PALETTE.push(
  {id:'trig_speed_slow',label:'VEL 0.75x',color:'#60a5fa'},
  {id:'trig_gravity_flip',label:'GRAV FLIP',color:'#f472b6'},
  {id:'trig_bg_cyan',label:'BG CYAN',color:'#06b6d4'}
);
const oldPlace3=placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord=function(x,y){
  if(editorSelectedItem==='trig_speed_slow'){editorDraft.triggers.push({x,kind:'speed_slow',triggered:false});return;}
  if(editorSelectedItem==='trig_gravity_flip'){editorDraft.triggers.push({x,kind:'gravity_flip',triggered:false});return;}
  if(editorSelectedItem==='trig_bg_cyan'){editorDraft.triggers.push({x,kind:'bg',bgTop:'#083344',bgBottom:'#0891b2',triggered:false});return;}
  oldPlace3(x,y);
};
const oldCheckTrigger=checkTriggerActivation;
checkTriggerActivation=function(p,trig,sx){
  if(trig.triggered)return;
  if(p.x+p.size>=sx){
    if(trig.kind==='speed_slow'){trig.triggered=true;currentGameSpeed=BASE_GAME_SPEED*.75;return;}
    if(trig.kind==='gravity_flip'){trig.triggered=true;modeGravity*=-1;p.dy=0;return;}
  }
  oldCheckTrigger(p,trig,sx);
};
renderEditorPalettes();

// A few more built-in stages to test the new modes.
function makeStage(name,difficulty,top,bottom,finish,portals,spikes,coins) {
  return {name,difficulty,stars:difficulty==='HARD'?3:2,faceKey:'verde',bgTop:top,bgBottom:bottom,
    groundFill:'#071426',groundGrid:'#164e63',finishX:finish,spikes:spikes||[],
    platforms:[],pads:[],orbs:[],saws:[],pillars:[],coins:coins||[],triggers:[],portals:portals||[]};
}
if(!LEVELS.some(l=>l.name==='Gravity Garden')){
  LEVELS.push(
    makeStage('Gravity Garden','NORMAL','#312e81','#7c3aed',4100,
      [{x:1350,type:'ball'},{x:2800,type:'cube'}],
      [{x:760},{x:1080,sizeType:'mini'},{x:1900},{x:3200,sizeType:'mini'}],
      [{x:2200,y:GROUND_Y-150,collected:false}]),
    makeStage('UFO Galaxy','HARD','#3b0764','#c026d3',4700,
      [{x:900,type:'ufo'},{x:2450,type:'wave'},{x:3650,type:'cube'}],
      [{x:700},{x:1500,sizeType:'mini'},{x:2000},{x:3000,sizeType:'mini'},{x:4100}],
      [{x:1800,y:GROUND_Y-170,collected:false}]),
    makeStage('Mechanical Core','HARD','#431407','#ea580c',5000,
      [{x:1000,type:'robot'},{x:2600,type:'spider'},{x:4100,type:'cube'}],
      [{x:720},{x:1500},{x:2200,sizeType:'mini'},{x:3400},{x:4500}],
      [{x:1850,y:GROUND_Y-155,collected:false}])
  );
}

// Accessible jump button and mobile-friendly pause affordance.
const mobileHint=document.getElementById('platform-hint');
if(mobileHint)mobileHint.textContent='PC: Espaço/clique para jogar. Celular: toque para pular/voar. Segure 5s para pausar.';
const originalApplyPlatform=applyPlatformSettingsUI;
applyPlatformSettingsUI=function(){originalApplyPlatform();canvas.style.touchAction='none';};

// Os controles antigos de skin ficam ocultos: a garagem nova substitui esses quatro slots.
document.querySelectorAll('#skin-models,.color-section').forEach(el=>el.style.display='none');
renderSkinUI();
// Refresh card and garage after expansion.
updateLevelCard();
renderModeGarage();
})();
