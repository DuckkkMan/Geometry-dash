/* Geometry Dash Web - expansão principal v1.2
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
  if(gameState==='EDITOR'&&editorToolMode==='place'&&editorSelectedItem==='platform')snapshotEditor();
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
const clearLevelButton=document.getElementById('editor-clear-btn');
if(clearLevelButton)clearLevelButton.addEventListener('click',()=>snapshotEditor(),true);
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
  {id:'trig_gravity_flip',label:'BALL/SPIDER FLIP',color:'#f472b6'},
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
