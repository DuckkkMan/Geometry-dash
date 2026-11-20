(() => {
  const $ = (id) => document.getElementById(id);
  const screens = {home:$('homeScreen'), skin:$('skinScreen'), game:$('gameScreen')};
  const icons = [
    {name:'Clássico',kind:0},{name:'Olhos',kind:1},{name:'Raio',kind:2},{name:'Cruz',kind:3},
    {name:'Robô',kind:4},{name:'Diamante',kind:5},{name:'Pixel',kind:6},{name:'Rosto',kind:7},
    {name:'Estrela',kind:8},{name:'Duplo',kind:9}
  ];
  const defaults = {icon:0,primary:'#35e8ff',secondary:'#ffdc36'};
  let skin = {...defaults,...JSON.parse(localStorage.getItem('gd-fan-skin')||'{}')};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function drawIcon(ctx,x,y,size,rotation=0,variant=skin.icon){
    const p=skin.primary,s=skin.secondary;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size/100,size/100);
    const kind=variant%icons.length;
    ctx.shadowColor='#050b20';ctx.shadowBlur=0;ctx.shadowOffsetX=5;ctx.shadowOffsetY=6;
    ctx.fillStyle=p;ctx.strokeStyle='#08132f';ctx.lineWidth=8;ctx.lineJoin='round';
    if(kind===5){ctx.beginPath();ctx.moveTo(0,-43);ctx.lineTo(43,0);ctx.lineTo(0,43);ctx.lineTo(-43,0);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(kind===8){ctx.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?24:46;let xx=Math.cos(a)*r,yy=Math.sin(a)*r;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.closePath();ctx.fill();ctx.stroke();}
    else{ctx.beginPath();ctx.roundRect(-42,-42,84,84,kind===6?2:8);ctx.fill();ctx.stroke();}
    ctx.shadowColor='transparent';ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    ctx.fillStyle=s;
    if(kind===2){ctx.beginPath();ctx.moveTo(12,-32);ctx.lineTo(-13,3);ctx.lineTo(3,3);ctx.lineTo(-8,33);ctx.lineTo(20,-5);ctx.lineTo(4,-5);ctx.closePath();ctx.fill();}
    else if(kind===3){ctx.fillRect(-9,-31,18,62);ctx.fillRect(-31,-9,62,18);}
    else if(kind===9){ctx.fillRect(-28,-15,18,18);ctx.fillRect(10,-15,18,18);ctx.fillRect(-28,15,56,10);}
    else if(kind===6){ctx.fillRect(-27,-25,17,17);ctx.fillRect(10,-25,17,17);ctx.fillRect(-27,9,54,17);}
    else if(kind===4){ctx.fillRect(-27,-24,16,19);ctx.fillRect(11,-24,16,19);ctx.fillRect(-19,15,38,12);}
    else{ctx.fillRect(-25,-22,16,22);ctx.fillRect(9,-22,16,22);ctx.fillRect(-20,16,40,8);}
    ctx.restore();
  }
  function renderPreview(){
    for(const id of ['menuIcon','skinPreview']){const c=$(id),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);drawIcon(ctx,c.width/2,c.height/2, id==='menuIcon'?72:145, id==='menuIcon'?Math.sin(Date.now()/650)*.12:0);}
    document.querySelectorAll('.icon-choice').forEach((el,i)=>el.classList.toggle('selected',i===skin.icon));
    $('primaryColor').value=skin.primary;$('secondaryColor').value=skin.secondary;
  }
  icons.forEach((item,i)=>{const b=document.createElement('button');b.className='icon-choice';b.title=item.name;b.setAttribute('aria-label',item.name);const c=document.createElement('canvas');c.width=90;c.height=90;b.append(c);b.addEventListener('click',()=>{skin.icon=i;renderPreview()});$('iconGrid').append(b);drawIcon(c.getContext('2d'),45,45,65,0,i)});
  ['#35e8ff','#ffdc36','#ff5b70','#9b70ff','#69f05c','#ffffff','#ff9d38','#f36bff'].forEach(color=>{const b=document.createElement('button');b.className='preset';b.style.background=color;b.title=color;b.addEventListener('click',()=>{skin.primary=color;renderPreview()});$('colorPresets').append(b)});
  $('primaryColor').addEventListener('input',e=>{skin.primary=e.target.value;renderPreview()});
  $('secondaryColor').addEventListener('input',e=>{skin.secondary=e.target.value;renderPreview()});
  function show(name){Object.entries(screens).forEach(([key,node])=>node.classList.toggle('hidden',key!==name));}
  $('openSkins').onclick=()=>{show('skin');renderPreview()};
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('home'));
  $('saveSkin').onclick=()=>{localStorage.setItem('gd-fan-skin',JSON.stringify(skin));show('home');renderPreview()};
  $('soundToggle').onclick=()=>{$('soundToggle').classList.toggle('muted');$('soundToggle').textContent=$('soundToggle').classList.contains('muted')?'♪':'♫'};
  const canvas=$('gameCanvas'),ctx=canvas.getContext('2d');
  const W=960,H=540,ground=432,block=48,goal=3000;
  let running=false,paused=false,frame=0,last=0,raf=0,world=0,attempt=1,player,obstacles=[],audioCtx=null;
  function makeLevel(){obstacles=[];for(let x=520;x<goal+500;x+=block*5)obstacles.push(x);}
  function reset(){world=0;frame=0;player={x:170,y:ground-42,w:42,h:42,vy:0,grounded:true,rot:0};makeLevel();$('progressFill').style.width='0%';$('percentLabel').textContent='0%';$('attemptLabel').textContent='TENTATIVA '+attempt;$('gameHint').style.opacity='1';}
  function start(){cancelAnimationFrame(raf);$('pauseModal').classList.add('hidden');attempt=1;reset();running=true;paused=false;show('game');last=performance.now();raf=requestAnimationFrame(loop);}
  function jump(){if(!running||paused)return;if(player.grounded){player.vy=-790;player.grounded=false;$('gameHint').style.opacity='0';}}
  function playTone(freq,duration=.06){if($('soundToggle').classList.contains('muted'))return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(e){}}
  function drawBackground(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#203b79');g.addColorStop(1,'#152650');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#9bdfff18';ctx.lineWidth=2;for(let x=-(world*.35%80);x<W;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=30;y<ground;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.fillStyle='#263d77';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#4deaff';ctx.fillRect(0,ground,W,6);ctx.fillStyle='#162653';for(let x=-(world%block);x<W;x+=block){ctx.fillRect(x,ground+15,block-4,block-4);ctx.strokeStyle='#41649d';ctx.strokeRect(x,ground+15,block-4,block-4)}
  }
  function draw(){drawBackground();ctx.fillStyle='#ffdc36';ctx.strokeStyle='#09142f';ctx.lineWidth=5;
    obstacles.forEach(wx=>{const x=wx-world;if(x<-50||x>W+50)return;ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+block/2,ground-43);ctx.lineTo(x+block,ground);ctx.closePath();ctx.fillStyle='#ff526a';ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x+block/2,ground-32);ctx.lineTo(x+block/2,ground);ctx.strokeStyle='#ffb0bb';ctx.lineWidth=2;ctx.stroke()});
    drawIcon(ctx,player.x+player.w/2,player.y+player.h/2,player.w,player.rot);
    ctx.fillStyle='#d8f8ff';ctx.font='bold 18px Rajdhani';ctx.fillText('SPIKE RUN',22,34);
    if(world>=goal){ctx.fillStyle='#fff';ctx.font='bold 52px Russo One';ctx.textAlign='center';ctx.fillText('FASE COMPLETA!',W/2,H/2);ctx.textAlign='left';}
  }
  function fail(){running=false;cancelAnimationFrame(raf);playTone(110,.2);$('pauseModal').classList.remove('hidden');$('pauseModal').querySelector('h2').textContent='TENTE NOVAMENTE';$('resumeButton').textContent='RECOMEÇAR';$('restartButton').textContent='MENU';$('menuButton').classList.add('hidden');}
  function win(){running=false;cancelAnimationFrame(raf);playTone(660,.25);$('pauseModal').classList.remove('hidden');$('pauseModal').querySelector('h2').textContent='FASE COMPLETA!';$('resumeButton').textContent='JOGAR DE NOVO';$('restartButton').textContent='MENU';$('menuButton').classList.add('hidden');}
  function loop(now){if(!running)return;const dt=Math.min((now-last)/1000,.033);last=now;
    if(!paused){world+=360*dt;player.vy+=1900*dt;player.y+=player.vy*dt;if(player.y+player.h>=ground){player.y=ground-player.h;player.vy=0;player.grounded=true;player.rot=Math.round(player.rot/(Math.PI/2))*(Math.PI/2)}else player.rot+=dt*7;
      const px=player.x+8,pr=player.x+player.w-8,py=player.y+7, pb=player.y+player.h-4;
      for(const wx of obstacles){const sx=wx-world;if(pr>sx+7&&px<sx+block-7&&pb>ground-39&&py<ground){fail();return}}
      const pct=clamp(Math.floor(world/goal*100),0,100);$('progressFill').style.width=pct+'%';$('percentLabel').textContent=pct+'%';if(world>=goal){win();draw();return}
    }
    draw();raf=requestAnimationFrame(loop);
  }
  function pause(){if(!running)return;paused=true;$('pauseModal').classList.remove('hidden');$('pauseModal').querySelector('h2').textContent='PAUSADO';$('resumeButton').textContent='CONTINUAR';$('restartButton').textContent='REINICIAR';$('menuButton').classList.remove('hidden')}
  $('playButton').onclick=start;
  $('quitGame').onclick=()=>{running=false;cancelAnimationFrame(raf);$('pauseModal').classList.add('hidden');show('home')};
  $('resumeButton').onclick=()=>{if(!running){start();return}paused=false;$('pauseModal').classList.add('hidden');last=performance.now();raf=requestAnimationFrame(loop)};
  $('restartButton').onclick=()=>{if($('pauseModal').querySelector('h2').textContent==='TENTE NOVAMENTE'||$('pauseModal').querySelector('h2').textContent==='FASE COMPLETA!'){$('pauseModal').classList.add('hidden');show('home')}else{attempt++;reset();paused=false;$('pauseModal').classList.add('hidden');last=performance.now();raf=requestAnimationFrame(loop)}};
  $('menuButton').onclick=()=>{running=false;cancelAnimationFrame(raf);$('pauseModal').classList.add('hidden');show('home')};
  canvas.addEventListener('pointerdown',jump);
  window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){if(!screens.game.classList.contains('hidden')){e.preventDefault();jump()}}if(e.code==='Escape'&&!screens.game.classList.contains('hidden')){if(paused){paused=false;$('pauseModal').classList.add('hidden');last=performance.now();raf=requestAnimationFrame(loop)}else pause()}});
  function animateMenu(){if(screens.home.classList.contains('hidden')===false){const c=$('menuIcon'),cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);drawIcon(cx,55,55,72,Math.sin(Date.now()/650)*.13)}requestAnimationFrame(animateMenu)}
  renderPreview();animateMenu();
})();