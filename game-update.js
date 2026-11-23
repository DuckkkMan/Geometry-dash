/* Conteúdo original: 3 fases, música procedural e edição dos níveis oficiais do projeto. */
(() => {
'use strict';
const G = 390;
const spike = (x, sizeType='normal') => ({x, y:G, sizeType});
const platform = (x,y,w=132,h=28) => ({x,y,w,h});
const orb = (x,y,color='yellow') => ({x,y,color,used:false});
const saw = (x,y,r=22) => ({x,y,r,angle:0});
const deco = (x,y,kind,color,scale=1) => ({x,y,kind,color,scale});
const base = (name,difficulty,faceKey,bgTop,bgBottom,groundFill,groundGrid,finishX) => ({
 id:'builtin_'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_'),name,difficulty,stars:difficulty==='EASY'?2:difficulty==='NORMAL'?4:7,faceKey,
 bgTop,bgBottom,groundFill,groundGrid,finishX,initialSpeed:1,
 spikes:[],platforms:[],blocks:[],pads:[],orbs:[],saws:[],pillars:[],
 coins:[],triggers:[],portals:[],decorations:[]
});
const blue=base('Skyline Sprint','EASY','azul','#073b83','#1599e8','#08264b','#1c78bd',3600);
blue.spikes=[spike(720),spike(1110,'mini'),spike(1480),spike(1940,'mini'),spike(1984,'mini'),spike(2480),spike(3020,'mini')];
blue.platforms=[platform(900,G-62,132),platform(1640,G-74,150),platform(2600,G-62,132)];
blue.pads=[{x:1280,color:'yellow',cooldown:0},{x:2780,color:'yellow',cooldown:0}];
blue.orbs=[orb(1810,G-112),orb(2220,G-120,'pink')];
blue.coins=[{x:1860,y:G-175,collected:false}];
blue.decorations=[deco(1050,120,'deco_star_02','#ffe066',1.2),deco(2060,95,'deco_shard_04','#7deaff',1.4),deco(2860,140,'deco_ring_03','#b9a1ff',1.1)];
const green=base('Neon Circuit','NORMAL','verde','#063c35','#12a36b','#06291f','#13865b',4500);
green.spikes=[spike(680),spike(980,'mini'),spike(1024,'mini'),spike(1510),spike(1900,'mini'),spike(1944,'mini'),spike(2460),spike(2910),spike(3280,'mini'),spike(3324,'mini'),spike(3820)];
green.platforms=[platform(1160,G-65,120),platform(2110,G-130,140),platform(3020,G-72,150),platform(3650,G-92,130)];
green.pads=[{x:1210,color:'yellow',cooldown:0},{x:2700,color:'pink',cooldown:0}];
green.orbs=[orb(1680,G-118),orb(2290,G-150,'pink'),orb(3480,G-125)];
green.saws=[saw(1770,G-150),saw(3150,G-165,24)];
green.pillars=[{x:2560,h:92,w:34},{x:3560,h:78,w:34}];
green.coins=[{x:2170,y:G-190,collected:false},{x:3490,y:G-195,collected:false}];
green.portals=[{x:1320,type:'ship',triggered:false},{x:2370,type:'cube',triggered:false}];
green.triggers=[{x:1450,kind:'bg_cyan',triggered:false},{x:2400,kind:'bg',bgTop:'#073b35',bgBottom:'#087b65',triggered:false}];
green.decorations=[deco(920,95,'deco_hex_03','#58f0ba',1.3),deco(2800,105,'deco_bolt_02','#b5ff78',1.2),deco(3900,120,'deco_star_05','#b7ffe3',1.3)];
const yellow=base('Solar Overdrive','HARD','amarelo','#54240a','#df7914','#321704','#a94b0c',5200);
yellow.initialSpeed=1.12;
yellow.spikes=[spike(640),spike(684),spike(728),spike(1120,'mini'),spike(1164,'mini'),spike(1560),spike(1820),spike(1864),spike(1908),spike(2340,'mini'),spike(2384,'mini'),spike(2660),spike(3020),spike(3064),spike(3108),spike(3540,'mini'),spike(3584,'mini'),spike(3980),spike(4420),spike(4464),spike(4508),spike(4820)];
yellow.platforms=[platform(900,G-82,128),platform(2020,G-140,132),platform(2820,G-90,120),platform(3740,G-150,145),platform(4620,G-86,132)];
yellow.pads=[{x:940,color:'pink',cooldown:0},{x:2160,color:'yellow',cooldown:0},{x:3860,color:'pink',cooldown:0}];
yellow.orbs=[orb(1420,G-135,'pink'),orb(2480,G-160),orb(3300,G-145,'pink'),orb(4250,G-155)];
yellow.saws=[saw(1700,G-115,25),saw(3210,G-175,25),saw(4140,G-130,27)];
yellow.pillars=[{x:1280,h:112,w:36},{x:2960,h:105,w:38},{x:4380,h:120,w:38}];
yellow.coins=[{x:2050,y:G-205,collected:false},{x:3790,y:G-220,collected:false}];
yellow.portals=[{x:1510,type:'ship',triggered:false},{x:2570,type:'cube',triggered:false},{x:3400,type:'ship',triggered:false},{x:4310,type:'cube',triggered:false}];
yellow.triggers=[{x:1600,kind:'speed_fast',triggered:false},{x:2700,kind:'bg_custom',bgTop:'#33134d',bgBottom:'#9c3d18',triggered:false},{x:3500,kind:'speed_slow',triggered:false},{x:4380,kind:'shake_custom',shakeAmount:7,triggered:false}];
yellow.decorations=[deco(1080,90,'deco_flame_03','#ffb347',1.4),deco(2360,105,'deco_gear_04','#ffd166',1.2),deco(3600,85,'deco_star_06','#fff0a6',1.4),deco(4760,115,'deco_bolt_05','#ffbd59',1.3)];
const gravity=base('Gravity Garden','HARD','vermelho','#10204f','#5130a5','#17143d','#5542a8',5100);
gravity.initialSpeed=1.04;gravity.spikes=[spike(620),spike(980,'mini'),spike(1460),spike(1900,'mini'),spike(1944,'mini'),spike(2510),spike(3020),spike(3580,'mini'),spike(3624,'mini'),spike(4250),spike(4700)];
gravity.platforms=[platform(820,G-90,130),platform(1640,G-145,145),platform(2760,G-110,145),platform(3900,G-135,150)];
gravity.pads=[{x:860,color:'red',cooldown:0},{x:2820,color:'blue',cooldown:0},{x:3940,color:'green',cooldown:0}];
gravity.orbs=[orb(1180,G-135,'blue'),orb(2100,G-160,'red'),orb(3300,G-145,'green'),orb(4470,G-165,'black')];
gravity.portals=[{x:1080,type:'ball',triggered:false},{x:2300,type:'spider',triggered:false},{x:3480,type:'cube',triggered:false}];
gravity.saws=[saw(1740,G-175,24),saw(3160,G-160,26)];gravity.coins=[{x:2120,y:G-215,collected:false},{x:4300,y:G-220,collected:false}];
gravity.decorations=[deco(1000,90,'deco_ring_04','#8be9fd',1.4),deco(2600,105,'deco_hex_06','#d7b7ff',1.3),deco(4100,95,'deco_star_08','#ffe066',1.4)];
const prism=base('Prism Breaker','INSANE','roxo','#220b46','#a21caf','#190c32','#8b35a8',6200);
prism.initialSpeed=1.16;prism.spikes=[spike(560),spike(604),spike(648),spike(1050,'mini'),spike(1094,'mini'),spike(1550),spike(1594),spike(2080,'mini'),spike(2124,'mini'),spike(2670),spike(2714),spike(3160,'mini'),spike(3204,'mini'),spike(3740),spike(3784),spike(4320,'mini'),spike(4364,'mini'),spike(4910),spike(4954),spike(5480),spike(5524),spike(5900)];
prism.platforms=[platform(820,G-115,130),platform(1800,G-145,145),platform(2860,G-120,145),platform(3980,G-155,150),platform(5100,G-125,150)];
prism.pads=[{x:850,color:'pink',cooldown:0},{x:2910,color:'red',cooldown:0},{x:5150,color:'green',cooldown:0}];
prism.orbs=[orb(1320,G-150,'red'),orb(2380,G-175,'blue'),orb(3500,G-150,'black'),orb(4680,G-170,'green')];
prism.portals=[{x:1120,type:'ufo',triggered:false},{x:2200,type:'wave',triggered:false},{x:3300,type:'robot',triggered:false},{x:4500,type:'spider',triggered:false},{x:5650,type:'cube',triggered:false}];
prism.saws=[saw(1700,G-185,25),saw(2760,G-170,25),saw(4140,G-190,26),saw(5350,G-170,27)];prism.pillars=[{x:1450,h:100,w:36},{x:3050,h:118,w:38},{x:4800,h:105,w:38}];
prism.coins=[{x:1850,y:G-220,collected:false},{x:3800,y:G-230,collected:false},{x:5200,y:G-220,collected:false}];
prism.decorations=[deco(980,90,'deco_bolt_04','#f0abfc',1.4),deco(2500,110,'deco_star_09','#67e8f9',1.4),deco(4200,90,'deco_gear_05','#f9a8d4',1.3),deco(5700,105,'deco_ring_07','#d8b4fe',1.5)];
LEVELS.splice(0,LEVELS.length,blue,green,yellow,gravity,prism);

currentLevelIndex=0;
activePlayableLevel=LEVELS[0];

/* Música 100% sintetizada pelo Web Audio: sem MP3, download ou arquivo externo. */
let musicContext=null, musicTimer=null, musicStep=0, musicGain=null;
const melodies={
 'Skyline Sprint':{bpm:118,notes:[392,440,523.25,587.33,523.25,440,392,329.63],bass:[98,110,130.81,110]},
 'Neon Circuit':{bpm:132,notes:[329.63,392,493.88,587.33,493.88,440,392,329.63],bass:[82.41,98,123.47,98]},
 'Solar Overdrive':{bpm:148,notes:[220,261.63,329.63,392,440,392,329.63,261.63],bass:[55,65.41,82.41,73.42]}
};
function stopLevelMusic(){
 if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
 if(musicGain&&musicContext){try{musicGain.gain.setTargetAtTime(0,musicContext.currentTime,.08);}catch(_){}}
}
function startLevelMusic(level){
 stopLevelMusic();
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return;
 try{
  if(!musicContext)musicContext=new Audio();
  if(musicContext.state==='suspended')musicContext.resume();
  if(!musicGain){musicGain=musicContext.createGain();musicGain.gain.value=.075;musicGain.connect(musicContext.destination);}
  musicGain.gain.setTargetAtTime(.075,musicContext.currentTime,.08);
  const tune=melodies[level.name]||melodies['Skyline Sprint'];musicStep=0;
  const playTone=(freq,duration,wave,volume,delay=0)=>{
   const now=musicContext.currentTime+delay,osc=musicContext.createOscillator(),gain=musicContext.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(freq,now);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.018);
   gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
   osc.connect(gain);gain.connect(musicGain);osc.start(now);osc.stop(now+duration+.03);
  };
  const tick=()=>{
   const i=musicStep++,n=tune.notes[i%tune.notes.length],b=tune.bass[Math.floor(i/2)%tune.bass.length],beat=60/tune.bpm;
   playTone(n,beat*.72,'square',.23);
   if(i%2===0)playTone(b,beat*1.65,'triangle',.36);
   if(i%4===2)playTone(n*2,beat*.12,'sine',.08);
   if(i%2===1)playTone(75,beat*.06,'triangle',.09);
  };
  tick();musicTimer=setInterval(tick,60000/tune.bpm);
 }catch(err){console.warn('[Music] Web Audio indisponível:',err);}
}
const originalStartLevel=startLevel;
startLevel=function(level,fromEditor=false){
 originalStartLevel(level,fromEditor);
 if(gameState==='PLAYING')startLevelMusic(activePlayableLevel);
};
const originalTriggerDeath=triggerDeath;
triggerDeath=function(){stopLevelMusic();return originalTriggerDeath.apply(this,arguments);};
const originalTriggerWin=triggerWin;
triggerWin=function(){stopLevelMusic();return originalTriggerWin.apply(this,arguments);};
const originalShowOverlay=showOverlay;
showOverlay=function(el,state){if(state!=='PLAYING')stopLevelMusic();return originalShowOverlay.apply(this,arguments);};

/* As três fases oficiais do projeto podem ser abertas diretamente no editor. */
const originalRenderLevelSelect=renderLevelSelect;
renderLevelSelect=function(){
 originalRenderLevelSelect();
 const card=document.getElementById('level-card');
 if(!card)return;
 let edit=document.getElementById('builtin-edit-level');
 if(!edit){edit=document.createElement('button');edit.id='builtin-edit-level';edit.type='button';edit.textContent='EDITAR FASE';edit.className='builtin-edit-level';card.appendChild(edit);}
 const lvl=getAllSelectableLevels()[currentLevelIndex];
 edit.onclick=(event)=>{event.stopPropagation();openEditorWithLevel(lvl);};
 edit.textContent=LEVELS.includes(lvl)?'EDITAR ESTA FASE':'EDITAR CRIAÇÃO';
};

/* Objetos com collision=false continuam visíveis, mas deixam de participar das colisões. */
const oldPlatformCollision=handlePlatformCollision;
handlePlatformCollision=function(p,obj,x){if(obj&&obj.collision===false)return false;return oldPlatformCollision(p,obj,x);};
const oldSpikeCollision=checkSpikeCollision;
checkSpikeCollision=function(p,obj,x){if(obj&&obj.collision===false)return false;return oldSpikeCollision(p,obj,x);};
const oldSawCollision=checkSawCollision;
checkSawCollision=function(p,obj,x){if(obj&&obj.collision===false)return false;return oldSawCollision(p,obj,x);};
const oldPadCollision=checkPadCollision;
checkPadCollision=function(p,obj,x){if(obj&&obj.collision===false)return;return oldPadCollision(p,obj,x);};
const oldCoinTrigger=checkCoinTrigger;
checkCoinTrigger=function(p,obj,x){if(obj&&obj.collision===false)return;return oldCoinTrigger(p,obj,x);};
const oldOrbTrigger=checkOrbTrigger;
checkOrbTrigger=function(p,obj,x){if(obj&&obj.collision===false)return;return oldOrbTrigger(p,obj,x);};
const oldPortalTrigger=checkPortalTrigger;
checkPortalTrigger=function(p,obj,x){if(obj&&obj.collision===false)return;return oldPortalTrigger(p,obj,x);};

/* Aparência individual: cor e transparência são aplicadas durante o desenho. */
const drawPairs=[
 ['drawPlatform','platforms'],['drawSpike','spikes'],['drawSaw','saws'],['drawPad','pads'],['drawPortal','portals'],
 ['drawOrb','orbs'],['drawCoin','coins'],['drawPillar','pillars'],
 ['drawLevelDecoration','decorations']
];
drawPairs.forEach(([fn])=>{
 const original=window[fn]||eval(fn);
 if(typeof original!=='function')return;
 const wrapped=function(obj,...args){
  ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,Number(obj.opacity??1)));
  const result=original.call(this,obj,...args);ctx.restore();return result;
 };
 try{eval(fn+' = wrapped');}catch(_){}
});

/* Controles extras do inspetor: a seleção real é fornecida pela expansão do editor. */
function installObjectControls(){
 const panel=document.getElementById('editor-inspector');if(!panel||document.getElementById('inspect-object-color'))return;
 const fields=panel.querySelector('.editor-inspector-fields');if(!fields)return;
 const group=document.createElement('div');group.className='object-style-fields';
 group.innerHTML='<label>Cor do objeto<input id="inspect-object-color" type="color" value="#ffffff"></label><label>Transparência <span id="inspect-opacity-value">100%</span><input id="inspect-object-opacity" type="range" min="0" max="100" value="100"></label><label class="collision-option"><input id="inspect-object-collision" type="checkbox" checked> Colisão ativada</label>';
 fields.appendChild(group);
 const color=document.getElementById('inspect-object-color'),opacity=document.getElementById('inspect-object-opacity'),collision=document.getElementById('inspect-object-collision'),label=document.getElementById('inspect-opacity-value');
 window.__gdSyncObjectStyle=records=>{
  const first=records&&records[0];[color,opacity,collision].forEach(input=>input.disabled=!first);if(!first)return;
  const obj=first.obj;color.value=/^#[0-9a-f]{6}$/i.test(obj.colorOverride||obj.color||'')?(obj.colorOverride||obj.color):'#ffffff';
  opacity.value=Math.round(Math.max(0,Math.min(1,Number(obj.opacity??1)))*100);label.textContent=opacity.value+'%';collision.checked=obj.collision!==false;
  color.dataset.originalValue=color.value;opacity.dataset.originalValue=opacity.value;collision.dataset.originalValue=String(collision.checked);
 };
 opacity.addEventListener('input',()=>label.textContent=opacity.value+'%');
 document.getElementById('inspect-apply-btn').addEventListener('click',()=>{
  const records=window.__gdEditorSelection?.()||[];if(!records.length)return;
  const cc=color.value!==color.dataset.originalValue,oc=String(opacity.value)!==String(opacity.dataset.originalValue),hc=String(collision.checked)!==collision.dataset.originalValue;
  if(!cc&&!oc&&!hc)return;window.__gdRecordEditorHistory?.();
  records.forEach(({obj})=>{const ox=obj.x,oy=obj.y;if(cc){obj.colorOverride=color.value;obj.color=color.value;}if(oc)obj.opacity=Number(opacity.value)/100;if(hc)obj.collision=collision.checked;obj.x=ox;if(oy===undefined)delete obj.y;else obj.y=oy;});
  window.__gdSyncObjectStyle(records);drawEditorCanvas();
 },true);
}
const style=document.createElement('style');
style.textContent='.builtin-edit-level{position:absolute;right:14px;bottom:14px;z-index:5;padding:9px 13px;border:2px solid #66d9ff;border-radius:7px;background:#123d68;color:#fff;font:900 10px Orbitron,sans-serif;cursor:pointer}.object-style-fields{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:8px;border:1px solid #2d83aa;border-radius:7px;background:#071d32}.object-style-fields label{display:flex;flex-direction:column;gap:4px;color:#d9f5ff;font-size:9px}.object-style-fields input[type=color]{width:100%;height:28px}.object-style-fields .collision-option{grid-column:1/-1;flex-direction:row;align-items:center}.object-style-fields input[type=range]{width:100%}';
document.head.appendChild(style);
const observer=new MutationObserver(installObjectControls);observer.observe(document.body,{childList:true,subtree:true});installObjectControls();
const musicStateMonitor=setInterval(()=>{if(gameState==='PLAYING'&&!musicTimer)startLevelMusic(activePlayableLevel);else if(gameState!=='PLAYING'&&musicTimer)stopLevelMusic();},350);
})();
