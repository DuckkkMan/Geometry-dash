/* Melhorias de menu, atalhos de dificuldade e configuração de ativação dos portais. */
(() => {
 'use strict';
 const menu=document.getElementById('main-menu');
 if(menu && !document.getElementById('menu-tagline')){
  const tagline=document.createElement('div');tagline.id='menu-tagline';tagline.className='menu-tagline';tagline.textContent='JUMP • SURVIVE • COMPLETE';
  menu.querySelector('.logo-container')?.appendChild(tagline);
  const labels=document.createElement('div');labels.className='menu-button-labels';labels.innerHTML='<span>SKINS</span><span>JOGAR</span><span>EDITOR</span>';
  menu.querySelector('.menu-buttons-row')?.after(labels);
 }
 const levelSelect=document.getElementById('level-select');
 if(levelSelect && !document.getElementById('difficulty-shortcuts')){
  const shortcuts=document.createElement('div');shortcuts.id='difficulty-shortcuts';shortcuts.className='difficulty-shortcuts';
  shortcuts.innerHTML='<button type="button" data-difficulty="EASY">FÁCIL</button><button type="button" data-difficulty="NORMAL">MÉDIO</button><button type="button" data-difficulty="HARD">DIFÍCIL</button>';
  levelSelect.querySelector('.level-carousel')?.after(shortcuts);
  shortcuts.addEventListener('click',event=>{
   const button=event.target.closest('button[data-difficulty]');if(!button)return;
   const wanted=button.dataset.difficulty;
   const index=(typeof LEVELS!=='undefined'?LEVELS:[]).findIndex(level=>String(level.difficulty||'NORMAL').toUpperCase()===wanted);
   if(index<0)return;
   currentLevelIndex=index;renderLevelSelect();
  });
 }
 // Portal: quando ativado, basta atravessar sua coordenada X, mesmo por cima/baixo.
 const originalPortalTrigger=checkPortalTrigger;
 checkPortalTrigger=function(player,portal,screenX){
  if(!portal || portal.triggered)return;
  if(!portal.triggerByX){return originalPortalTrigger(player,portal,screenX);}
  const crossed=player.x+player.size>screenX+6 && player.x<screenX+PORTAL_WIDTH-6;
  if(!crossed)return;
  portal.triggered=true;
  const nextMode=portal.type==='ship'?'ship':'cube';
  if(nextMode===playerMode)return;
  playerMode=nextMode;playSfx('portal');
  if(playerMode==='ship'){player.dy=Math.min(player.dy,-3);player.grounded=false;}
  else{player.rotation=Math.round(player.rotation/(Math.PI/2))*(Math.PI/2);}
  spawnEndParticles(screenX+PORTAL_WIDTH/2,player.y+player.size/2,16,true);
 };
 // Opção aparece no inspetor apenas quando um portal está selecionado.
 const installPortalOption=()=>{
  const panel=document.getElementById('editor-inspector');
  const fields=panel?.querySelector('.editor-inspector-fields');
  if(!fields || document.getElementById('inspect-portal-trigger-x'))return;
  const wrap=document.createElement('label');wrap.id='portal-trigger-x-option';wrap.className='portal-trigger-option';
  wrap.innerHTML='<input id="inspect-portal-trigger-x" type="checkbox"><span><strong>Ativar por coordenada X</strong><small>Ativado: funciona mesmo se passar por cima ou por baixo. Desativado: precisa atravessar o portal por dentro.</small></span>';
  fields.appendChild(wrap);
  const checkbox=wrap.querySelector('input');
  checkbox.addEventListener('change',()=>{
   const records=window.__gdEditorSelection?.()||[];
   const portals=records.filter(record=>record.key==='portals');
   portals.forEach(record=>{record.obj.triggerByX=checkbox.checked;});
   if(portals.length)drawEditorCanvas();
  });
 };
 const syncPortalOption=()=>{
  const wrap=document.getElementById('portal-trigger-x-option');if(!wrap)return;
  const records=window.__gdEditorSelection?.()||[];
  const portals=records.filter(record=>record.key==='portals');
  wrap.classList.toggle('hidden',!portals.length);
  const checkbox=document.getElementById('inspect-portal-trigger-x');
  if(checkbox)checkbox.checked=portals.length>0 && portals.every(record=>record.obj.triggerByX===true);
 };
 const observer=new MutationObserver(()=>{installPortalOption();syncPortalOption();});
 observer.observe(document.body,{childList:true,subtree:true});
 installPortalOption();
 setInterval(syncPortalOption,350);
 const style=document.createElement('style');
 style.textContent='.portal-trigger-option{grid-column:1/-1;display:flex!important;flex-direction:row!important;align-items:flex-start;gap:9px;padding:10px;border:1px solid #2999c9;border-radius:8px;background:#09233b;color:#e5f7ff;font-size:10px}.portal-trigger-option.hidden{display:none!important}.portal-trigger-option input{flex:0 0 auto;margin-top:2px;accent-color:#00dfff}.portal-trigger-option span{display:flex;flex-direction:column;gap:5px}.portal-trigger-option strong{color:#7ceaff;font:900 10px Orbitron,sans-serif}.portal-trigger-option small{color:#b9d9ef;line-height:1.4}';
 document.head.appendChild(style);
})();