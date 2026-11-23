/* Geometry Dash Web - expansão principal v1.2
   Modos, portais procedurais, garagem multi-ícone, editor avançado e trilha.
   Sem bibliotecas externas. */
(() => {
'use strict';

const MODE_INFO = {
  cube: { name: 'CUBE', color: '#9dff00', secondary: '#eaff9d' },
  ship: { name: 'SHIP', color: '#00c8ff', secondary: '#a5f3fc' },
  ball: { name: 'BALL', color: '#ffb703', secondary: '#fff1a8' },
  ufo: { name: 'UFO', color: '#d946ef', secondary: '#f5b5ff' },
  wave: { name: 'WAVE', color: '#22d3ee', secondary: '#b6f7ff' },
  robot: { name: 'ROBOT', color: '#fb923c', secondary: '#ffdfb8' }
};
const MODE_LIST = Object.keys(MODE_INFO);
const MODE_SKIN_COUNTS = { cube: 6, ship: 2, ball: 2, ufo: 2, wave: 2, robot: 2 };
const MODE_SKIN_PREFIX = { cube: 'Cube', ship: 'Ship', ball: 'Ball', ufo: 'Ufo', wave: 'Wave', robot: 'Robot' };
const MODE_SKIN_KEY = 'gd_web_mode_skins_v1';
if (Array.isArray(customLevels)) {
  let changed = false;
  customLevels.forEach(level => {
    if (level.initialMode === 'spider') { level.initialMode = 'cube'; changed = true; }
    if (!Array.isArray(level.portals)) return;
    const valid = level.portals.filter(portal => portal && portal.type !== 'spider');
    if (valid.length !== level.portals.length) { level.portals = valid; changed = true; }
  });
  if (changed && typeof writeSaveData === 'function') writeSaveData();
}

const modeSkins = (() => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(MODE_SKIN_KEY) || '{}') || {}; } catch (_) {}
  const result = {};
  MODE_LIST.forEach((mode, index) => {
    const fallback = {
      model: 0,
      primary: MODE_INFO[mode].color,
      secondary: MODE_INFO[mode].secondary
    };
    result[mode] = Object.assign(fallback, saved[mode] || {});
    result[mode].model = Math.max(0, Math.min(MODE_SKIN_COUNTS[mode] - 1, Math.floor(Number(result[mode].model) || 0)));
  });
  return result;
})();

let activeSkinMode = 'cube';
let activeTrail = [];
let trailTick = 0;
let modeGravity = 1;
let activeColorChannel = 'primary';

function saveModeSkins() {
  try { localStorage.setItem(MODE_SKIN_KEY, JSON.stringify(modeSkins)); } catch (_) {}
}

function syncPlayerSkinFromMode() {
  const selected = modeSkins[activeSkinMode] || modeSkins.cube;
  playerSkin.model = selected.model;
  playerSkin.primary = selected.primary;
  playerSkin.secondary = selected.secondary;
  if (typeof writeSaveData === 'function') writeSaveData();
}

function roundedRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function drawModeIcon(c, mode, x, y, size, rotation, skin) {
  const s = skin || modeSkins[mode] || modeSkins.cube;
  const variant = ((Number(s.model) || 0) % 8 + 8) % 8;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const scale = size / 44;
  const primary = /^#[0-9a-f]{6}$/i.test(s.primary) ? s.primary : '#9dff00';
  const secondary = /^#[0-9a-f]{6}$/i.test(s.secondary) ? s.secondary : '#eaff9d';

  const shade = (hex, amount) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (n & 255) + amount));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  };

  c.save();
  c.translate(cx, cy);
  c.rotate(rotation || 0);
  c.scale(scale, scale);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  const fill = c.createLinearGradient(-18, -20, 18, 22);
  fill.addColorStop(0, shade(primary, 42));
  fill.addColorStop(0.48, primary);
  fill.addColorStop(1, shade(primary, -48));

  const outline = '#07101d';
  const path = (points) => {
    c.beginPath();
    c.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
    c.closePath();
  };
  const polygon = (points) => { path(points); c.fillStyle = fill; c.fill(); c.lineWidth = 3; c.strokeStyle = outline; c.stroke(); };
  const circle = (rx, ry, r) => { c.beginPath(); c.ellipse(rx, ry, r, r, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); c.lineWidth = 3; c.strokeStyle = outline; c.stroke(); };
  const rounded = (xx, yy, w, h, r) => { roundedRect(c, xx, yy, w, h, r); c.fillStyle = fill; c.fill(); c.lineWidth = 3; c.strokeStyle = outline; c.stroke(); };

  c.shadowColor = primary;
  c.shadowBlur = 5;

  if (mode === 'cube') {
    const shapes = [
      [[-20, -20], [20, -20], [20, 20], [-20, 20]],
      [[-13, -22], [13, -22], [22, -13], [22, 13], [13, 22], [-13, 22], [-22, 13], [-22, -13]],
      [[0, -23], [20, -12], [20, 12], [0, 23], [-20, 12], [-20, -12]],
      [[0, -24], [24, 0], [0, 24], [-24, 0]],
      [[-17, -22], [17, -22], [22, -17], [22, 17], [17, 22], [-17, 22], [-22, 17], [-22, -17]],
      [[-22, -16], [-10, -22], [10, -22], [22, -16], [22, 16], [10, 22], [-10, 22], [-22, 16]],
      [[-20, -22], [20, -22], [20, 8], [0, 23], [-20, 8]],
      [[-16, -22], [16, -22], [22, -16], [22, 16], [16, 22], [-16, 22], [-22, 16], [-22, -16]]
    ];
    polygon(shapes[variant]);
    c.shadowBlur = 0;
    c.fillStyle = secondary;
    c.strokeStyle = outline;
    c.lineWidth = 2.2;
    const eyeY = variant === 3 ? -7 : -8;
    if (variant === 1 || variant === 5) {
      c.fillRect(-12, eyeY, 7, 7); c.strokeRect(-12, eyeY, 7, 7);
      c.fillRect(5, eyeY, 7, 7); c.strokeRect(5, eyeY, 7, 7);
    } else if (variant === 2 || variant === 6) {
      c.beginPath(); c.arc(-8, eyeY + 3, 3.5, 0, Math.PI * 2); c.arc(8, eyeY + 3, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
    } else {
      c.fillRect(-13, eyeY, 8, 8); c.strokeRect(-13, eyeY, 8, 8);
      c.fillRect(5, eyeY, 8, 8); c.strokeRect(5, eyeY, 8, 8);
    }
    c.fillRect(-11, 7, 22, 5);
    c.strokeRect(-11, 7, 22, 5);
  } else if (mode === 'ship') {
    const ships = [
      [[-23, -8], [12, -17], [24, 0], [12, 17], [-23, 8], [-14, 0]],
      [[-24, -5], [17, -14], [24, 0], [17, 14], [-24, 5]],
      [[-20, -13], [6, -13], [24, 0], [6, 13], [-20, 13], [-8, 0]],
      [[-23, -3], [2, -18], [24, 0], [2, 18], [-23, 3]],
      [[-17, -13], [13, -13], [22, 0], [13, 13], [-17, 13], [-8, 0]],
      [[-24, -10], [12, -15], [20, -4], [20, 4], [12, 15], [-24, 10], [-12, 0]],
      [[-20, -16], [18, -8], [24, 0], [18, 8], [-20, 16], [-8, 0]],
      [[-24, -4], [7, -19], [18, -8], [24, 0], [18, 8], [7, 19], [-24, 4]]
    ];
    polygon(ships[variant]);
    c.shadowBlur = 0;
    c.fillStyle = secondary;
    c.strokeStyle = outline;
    c.lineWidth = 2;
    path([[-12, -5], [7, -7], [15, 0], [7, 7], [-12, 5]]);
    c.fill(); c.stroke();
  } else if (mode === 'ball') {
    const radius = [20, 18, 21, 17, 20, 19, 21, 18][variant];
    circle(0, 0, radius);
    c.shadowBlur = 0;
    c.strokeStyle = secondary;
    c.fillStyle = secondary;
    c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
  } else if (mode === 'ufo') {
    const body = variant % 2 === 0
      ? [[-23, 2], [-17, -7], [0, -12], [17, -7], [23, 2], [16, 12], [-16, 12]]
      : [[-22, 0], [-12, -10], [12, -10], [22, 0], [17, 11], [-17, 11]];
    polygon(body);
    c.shadowBlur = 0;
    c.fillStyle = secondary;
    c.strokeStyle = outline;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-12, -7); c.quadraticCurveTo(-9, -22, 0, -22); c.quadraticCurveTo(10, -22, 12, -7);
    c.closePath();
    c.fill(); c.stroke();
  } else if (mode === 'wave') {
    // Wave é uma seta/zigue-zague horizontal: a ponta sempre aponta para a direita.
    const waves = [
      [[-21,-14],[7,-14],[22,0],[7,14],[-21,14],[-8,0]],
      [[-20,-16],[4,-16],[22,0],[4,16],[-20,16],[-5,0]],
      [[-22,-11],[-5,-11],[5,-20],[22,0],[5,20],[-5,11],[-22,11],[-8,0]],
      [[-22,-15],[-8,-15],[0,-4],[9,-20],[22,0],[8,8],[0,-2],[-9,15],[-22,15],[-8,0]],
      [[-21,-13],[8,-13],[22,0],[8,13],[-21,13],[-9,0]],
      [[-20,-15],[-20,-5],[0,-5],[0,-17],[22,0],[0,17],[0,5],[-20,5]],
      [[-22,-12],[-7,-12],[0,-21],[7,-12],[22,0],[7,12],[0,21],[-7,12],[-22,12],[-10,0]],
      [[-22,-8],[-4,-8],[7,-20],[22,0],[7,20],[-4,8],[-22,8],[-9,0]]
    ];
    polygon(waves[variant]);
    c.shadowBlur = 0;
    c.strokeStyle = secondary;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-13, 0); c.lineTo(-4, -6); c.lineTo(5, 0); c.lineTo(14, -6); c.stroke();
  } else if (mode === 'robot') {
    const headShapes = [
      [-17, -20, 34, 36, 5], [-20, -17, 40, 32, 3], [-16, -22, 32, 40, 8], [-20, -20, 40, 40, 2],
      [-18, -18, 36, 36, 12], [-21, -15, 42, 30, 5], [-16, -20, 32, 38, 2], [-19, -19, 38, 38, 8]
    ];
    const r = headShapes[variant];
    rounded(r[0], r[1], r[2], r[3], r[4]);
    c.shadowBlur = 0;
    c.fillStyle = secondary;
    c.strokeStyle = outline;
    c.lineWidth = 2;
    c.fillRect(-12, -9, 7, 8); c.strokeRect(-12, -9, 7, 8);
    c.fillRect(5, -9, 7, 8); c.strokeRect(5, -9, 7, 8);
    c.fillRect(-8, 5, 16, 4); c.strokeRect(-8, 5, 16, 4);
  }

  c.shadowBlur = 0;
  c.globalAlpha = 0.24;
  c.strokeStyle = '#fff';
  c.lineWidth = 1.5;
  if (mode === 'ball') {
    c.beginPath(); c.arc(-5, -7, 8, 3.5, 5.7); c.stroke();
  } else {
    c.beginPath(); c.moveTo(-14, -17); c.lineTo(7, -17); c.stroke();
  }
  c.restore();
}

 
// PNGs monocromáticos: as áreas claras recebem um degradê COR 1 -> COR 2;
// contornos escuros permanecem escuros e a proporção de cada imagem é mantida.
const MODE_SKIN_FILES = {
  cube: ['Cube1.png','Cube2.png','Cube3.png','Cube4.png','Cube5.png','Cube6.png'],
  ship: ['Ship1.png','Ship2.png'],
  ball: ['Ball1.png','Ball2.png'],
  ufo: ['Ufo1.png','Ufo2.png'],
  wave: ['Wave1.png','Wave2.png'],
  robot: ['Robot1.png','Robot2.png']
};
const skinImageCache = new Map();
const tintedSkinCache = new Map();
function skinGradientCanvas(mode, index, skin) {
  const key = [mode,index,skin.primary,skin.secondary].join('|');
  if (tintedSkinCache.has(key)) return tintedSkinCache.get(key);
  const image = skinImageCache.get(mode + ':' + index);
  if (!image || !image.complete || !image.naturalWidth) return null;
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  c.drawImage(image, 0, 0);
  try {
    const pixels = c.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;
    const rgb = hex => [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
    const a = rgb(skin.primary), b = rgb(skin.secondary);
    const width = Math.max(1, canvas.width - 1);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const p = (y * canvas.width + x) * 4;
        const lum = (data[p] * .299 + data[p+1] * .587 + data[p+2] * .114) / 255;
        const t = x / width;
        data[p] = Math.round((a[0] + (b[0]-a[0])*t) * lum);
        data[p+1] = Math.round((a[1] + (b[1]-a[1])*t) * lum);
        data[p+2] = Math.round((a[2] + (b[2]-a[2])*t) * lum);
      }
    }
    c.putImageData(pixels, 0, 0);
  } catch (_) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(image, 0, 0);
  }
  tintedSkinCache.set(key, canvas);
  if (tintedSkinCache.size > 96) tintedSkinCache.delete(tintedSkinCache.keys().next().value);
  return canvas;
}
Object.entries(MODE_SKIN_FILES).forEach(([mode, names]) => names.forEach((name, index) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    skinImageCache.set(mode + ':' + index, image);
    tintedSkinCache.clear();
    if (typeof renderModeGarage === 'function') renderModeGarage();
    if (typeof renderSkinUI === 'function') renderSkinUI();
  };
  image.src = 'Skins/' + name;
  skinImageCache.set(mode + ':' + index, image);
}));
const drawVectorModeIcon = drawModeIcon;
drawModeIcon = function (c, mode, x, y, size, rotation, skin) {
  const selected = skin || modeSkins[mode] || modeSkins.cube;
  const count = MODE_SKIN_COUNTS[mode] || 1;
  const index = Math.max(0, Math.min(count - 1, Math.floor(Number(selected.model) || 0)));
  const tinted = skinGradientCanvas(mode, index, selected);
  if (!tinted) { drawVectorModeIcon(c, mode, x, y, size, rotation, selected); return; }
  const fit = Math.min(size * .94 / tinted.width, size * .94 / tinted.height);
  const w = tinted.width * fit, h = tinted.height * fit;
  c.save();
  c.translate(x + size / 2, y + size / 2);
  c.rotate(rotation || 0);
  c.drawImage(tinted, -w/2, -h/2, w, h);
  c.restore();
};

function portalColor(type) {
  return (MODE_INFO[type] || MODE_INFO.cube).color;
}

function drawProceduralPortal(portal, screenX) {
  if (screenX + PORTAL_WIDTH < -70 || screenX > canvas.width + 70) return;
  const mode = MODE_INFO[portal.type] ? portal.type : 'cube';
  const color = portalColor(mode);
  const t = performance.now() / 1000;
  const cx = screenX + PORTAL_WIDTH / 2;
  const cy = Number.isFinite(Number(portal.y)) ? Number(portal.y) : GROUND_Y - PORTAL_HEIGHT / 2;
  const pulse = 1 + Math.sin(t * 5 + screenX * 0.01) * 0.045;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = color;
  ctx.shadowBlur = lowPerformanceMode ? 8 : 24;
  ctx.translate(cx, cy);
  ctx.scale(pulse, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 53, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 45, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function mapPortalMode(type) {
  return MODE_INFO[type] ? type : (type === 'ship' ? 'ship' : 'cube');
}

function portalCollision(p, portal, screenX) {
  if (portal.triggered) return;
  const centerY = Number.isFinite(Number(portal.y)) ? Number(portal.y) : GROUND_Y - PORTAL_HEIGHT / 2;
  const top = centerY - PORTAL_HEIGHT / 2;
  const bottom = centerY + PORTAL_HEIGHT / 2;
  if (p.x + p.size > screenX + 5 && p.x < screenX + PORTAL_WIDTH - 5 && p.y + p.size > top && p.y < bottom) {
    portal.triggered = true;
    const next = mapPortalMode(portal.type);
    if (next !== playerMode) {
      playerMode = next;
      modeGravity = 1;
      p.dy = 0;
      p.grounded = false;
      if (next === 'ship') p.dy = -3;
      if (next === 'wave') p.dy = -7;
      playSfx('portal');
      spawnEndParticles(screenX + PORTAL_WIDTH / 2, p.y + p.size / 2, 18, true);
    }
  }
}

drawPortal = drawProceduralPortal;
checkPortalTrigger = portalCollision;

const originalPlayerUpdate = player.update.bind(player);
const originalPlayerJump = player.jump.bind(player);

player.update = function () {
  if (playerMode === 'cube' || playerMode === 'ship') {
    originalPlayerUpdate();
    return;
  }
  this.prevY = this.y;
  const floor = GROUND_Y - this.size;
  const ceiling = CEILING_Y;

  if (playerMode === 'wave') {
    this.dy = isHoldingJump ? -7.4 : 7.4;
    this.y += this.dy;
    this.grounded = false;
    if (this.y < ceiling) { this.y = ceiling; if (this.dy < 0) this.dy = 0; }
    if (this.y > floor) { this.y = floor; if (this.dy > 0) this.dy = 0; }
    return;
  }
  if (playerMode === 'ball') {
    if (jumpJustPressed) { modeGravity *= -1; this.dy = 0; playSfx('jump'); jumpJustPressed = false; }
    this.dy += GRAVITY * gravityMultiplier * modeGravity;
    this.y += this.dy;
    if (this.y >= floor) { this.y = floor; this.dy = 0; this.grounded = true; }
    else if (this.y <= ceiling) { this.y = ceiling; this.dy = 0; this.grounded = true; }
    else this.grounded = false;
    // A bola continua girando mesmo quando a velocidade vertical zera no contato.
    this.rotation += 0.13 * modeGravity;
    return;
  }
  if (playerMode === 'ufo') {
    if (jumpJustPressed) { this.dy = -12.5; playSfx('jump'); jumpJustPressed = false; }
    this.dy = Math.min(8, this.dy + GRAVITY * 0.78 * gravityMultiplier);
    this.y += this.dy;
    if (this.y >= floor) { this.y = floor; this.dy = 0; this.grounded = true; } else this.grounded = false;
    if (this.y < ceiling) { this.y = ceiling; this.dy = 0; }
    this.rotation += 0.025;
    return;
  }
  if (playerMode === 'robot') {
    const pressed = jumpJustPressed;
    jumpJustPressed = false;
    if (pressed && this.grounded) { this.dy = -14.5; this.grounded = false; playSfx('jump'); }
    // Segurar durante a subida aumenta gradualmente a altura do salto.
    if (isHoldingJump && this.dy < 0) this.dy = Math.max(-19, this.dy - 0.42);
    this.dy += GRAVITY * gravityMultiplier;
    this.y += this.dy;
    if (this.y >= floor) { this.y = floor; this.dy = 0; this.grounded = true; } else this.grounded = false;
    if (this.y < ceiling) { this.y = ceiling; this.dy = 0; }
    // O Robot usa a física de salto própria, mas mantém rotação contínua como ícone.
    this.rotation += 0.13;
    return;
  }
  originalPlayerUpdate();
};

player.jump = function () {
  if (playerMode === 'cube' || playerMode === 'robot') originalPlayerJump();
};

player.draw = function () {
  const skin = modeSkins[playerMode] || modeSkins.cube;
  const angle = playerMode === 'ship' ? Math.max(-0.45, Math.min(0.45, this.dy * 0.048)) : this.rotation;
  if (playerMode === 'ship' && isHoldingJump && gameState === 'PLAYING') {
    ctx.save();
    ctx.fillStyle = '#ff8a00';
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(this.x - 5, this.y + this.size * 0.35);
    ctx.lineTo(this.x - 22 - Math.random() * 8, this.y + this.size * 0.5);
    ctx.lineTo(this.x - 5, this.y + this.size * 0.65);
    ctx.fill();
    ctx.restore();
  }
  drawModeIcon(ctx, playerMode, this.x, this.y, this.size, angle, skin);
};

const originalSaveCheckpoint = saveCheckpointAtCurrentState;
saveCheckpointAtCurrentState = function () {
  originalSaveCheckpoint();
  if (activeCheckpoint) activeCheckpoint.modeGravity = modeGravity;
};

const originalStartAttempt = startAttempt;
startAttempt = function (countNewAttempt = true) {
  activeTrail = [];
  trailTick = 0;
  modeGravity = 1;
  originalStartAttempt(countNewAttempt);
  if (isPracticeMode && activeCheckpoint && Number.isFinite(activeCheckpoint.modeGravity)) {
    modeGravity = activeCheckpoint.modeGravity;
  }
  activeTrail.push({ x: levelDistance, y: player.y + player.size / 2 });
};

const originalLoop = loop;
function drawActivePlayerTrail() {
  if (!visualSettings.trail || activeTrail.length < 2) return;
  const visibleTrail = activeTrail.filter(pt => pt.x >= levelDistance - 900 && pt.x <= levelDistance + player.x);
  if (visibleTrail.length < 2) return;
  ctx.save();
  ctx.beginPath();
  visibleTrail.forEach((pt, i) => {
    const sx = pt.x - levelDistance;
    if (i === 0) ctx.moveTo(sx, pt.y);
    else ctx.lineTo(sx, pt.y);
  });
  const skin = modeSkins[playerMode] || modeSkins.cube;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = skin.secondary || '#e9fdff';
  ctx.lineWidth = 10;
  ctx.globalAlpha = 0.24;
  ctx.shadowColor = skin.primary || '#00e5ff';
  ctx.shadowBlur = 13;
  ctx.stroke();
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 5;
  ctx.stroke();
  ctx.restore();
}
// O loop original chama drawPlayerTrail globalmente. Substituímos a função global
// para desenhar o rastro real de movimento, em vez do antigo conjunto de quadrados.
drawPlayerTrail = drawActivePlayerTrail;

loop = function () {
  if (gameState === 'PLAYING' && visualSettings.trail) {
    if (trailTick++ % 2 === 0) {
      activeTrail.push({ x: levelDistance + player.x, y: player.y + player.size / 2 });
      if (activeTrail.length > 150) activeTrail.splice(0, activeTrail.length - 150);
    }
  } else if (!visualSettings.trail) activeTrail.length = 0;
  originalLoop();
};

// Portais extras na paleta base
MODE_LIST.forEach(mode => {
  if (mode === 'cube' || mode === 'ship') return;
  ASSET_PALETTE.push({ id: 'portal_' + mode, label: 'PORTAL ' + MODE_INFO[mode].name, color: MODE_INFO[mode].color });
});

const oldPlace = placeSelectedAtWorldCoord;
placeSelectedAtWorldCoord = function (x, y) {
  if (editorSelectedItem && editorSelectedItem.indexOf('portal_') === 0) {
    const type = editorSelectedItem.slice(7);
    editorDraft.portals.push({ x, type, triggered: false });
    return;
  }
  oldPlace(x, y);
};

// === GARAGEM DE ÍCONES MULTIMODO ===
const MODE_SKIN_NAMES = Object.fromEntries(MODE_LIST.map(mode => [mode,
  Array.from({ length: MODE_SKIN_COUNTS[mode] }, (_, index) => MODE_SKIN_PREFIX[mode] + (index + 1))
]));

renderSkinUI = function () {
  const icon = document.getElementById('skin-btn-icon');
  if (icon) {
    const ic = icon.getContext('2d');
    ic.clearRect(0, 0, icon.width, icon.height);
    drawModeIcon(ic, activeSkinMode, 4, 4, 36, 0, modeSkins[activeSkinMode]);
  }
  const preview = document.getElementById('skin-preview');
  if (preview) {
    const pc = preview.getContext('2d');
    pc.clearRect(0, 0, preview.width, preview.height);
    drawModeIcon(pc, activeSkinMode, 12, 12, 56, 0, modeSkins[activeSkinMode]);
  }
};

function setActiveMode(mode) {
  if (!MODE_INFO[mode]) return;
  activeSkinMode = mode;
  try { localStorage.setItem('gd_web_active_skin_mode', mode); } catch (_) {}
  activeColorChannel = 'primary';
  syncPlayerSkinFromMode();
  renderModeGarage();
  renderSkinUI();
}

function renderModeGarage() {
  const garage = document.querySelector('#skin-garage .garage-box');
  if (!garage) return;
  let panel = document.getElementById('mode-skin-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'mode-skin-panel';
    panel.className = 'mode-skin-panel';
    const preview = garage.querySelector('.preview-stage');
    preview.insertAdjacentElement('afterend', panel);
  }
  panel.replaceChildren();
  garage.querySelector('.skin-row')?.classList.add('hidden');
  garage.querySelectorAll('.color-section').forEach(section => section.classList.add('hidden'));
  const skin = modeSkins[activeSkinMode];
  const skinCount = MODE_SKIN_COUNTS[activeSkinMode] || 2;

  const head = document.createElement('div');
  head.className = 'skin-panel-head';
  const title = document.createElement('div');
  title.className = 'mode-skin-heading';
  title.textContent = 'GARAGEM DE ÍCONES';
  const subtitle = document.createElement('div');
  subtitle.className = 'mode-skin-subtitle';
  subtitle.textContent = 'Escolha o modo, o desenho e as cores';
  head.append(title, subtitle);
  panel.appendChild(head);

  const tabs = document.createElement('div');
  tabs.className = 'mode-skin-tabs';
  tabs.setAttribute('role', 'tablist');
  MODE_LIST.forEach(mode => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-skin-tab' + (activeSkinMode === mode ? ' selected' : '');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(activeSkinMode === mode));
    b.textContent = MODE_INFO[mode].name;
    b.addEventListener('click', () => setActiveMode(mode));
    tabs.appendChild(b);
  });
  panel.appendChild(tabs);

  const modelHeader = document.createElement('div');
  modelHeader.className = 'skin-section-heading';
  const modelTitle = document.createElement('span');
  modelTitle.textContent = 'DESENHO';
  const modelCount = document.createElement('span');
  modelCount.textContent = '' + (skin.model + 1) + ' / ' + skinCount;
  modelHeader.append(modelTitle, modelCount);
  panel.appendChild(modelHeader);

  const models = document.createElement('div');
  models.className = 'mode-skin-models';
  for (let i = 0; i < skinCount; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-model' + (skin.model === i ? ' selected' : '');
    b.setAttribute('aria-label', MODE_SKIN_NAMES[activeSkinMode][i]);
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    drawModeIcon(cv.getContext('2d'), activeSkinMode, 6, 6, 52, 0, { ...skin, model: i });
    const name = document.createElement('span');
    name.textContent = MODE_SKIN_NAMES[activeSkinMode][i];
    b.append(cv, name);
    b.addEventListener('click', () => {
      skin.model = i;
      syncPlayerSkinFromMode();
      saveModeSkins();
      renderModeGarage();
      renderSkinUI();
    });
    models.appendChild(b);
  }
  panel.appendChild(models);

  const colorSection = document.createElement('div');
  colorSection.className = 'skin-color-section';
  const colorHead = document.createElement('div');
  colorHead.className = 'skin-section-heading';
  const colorTitle = document.createElement('span');
  colorTitle.textContent = 'PERSONALIZAR CORES';
  colorHead.appendChild(colorTitle);
  colorSection.appendChild(colorHead);

  const channelRow = document.createElement('div');
  channelRow.className = 'skin-channel-row';
  ['primary', 'secondary'].forEach((channel, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'skin-channel' + (activeColorChannel === channel ? ' selected' : '');
    b.textContent = index === 0 ? 'COR 1' : 'COR 2';
    const dot = document.createElement('i');
    dot.style.background = skin[channel];
    b.prepend(dot);
    b.addEventListener('click', () => { activeColorChannel = channel; renderModeGarage(); });
    channelRow.appendChild(b);
  });
  colorSection.appendChild(channelRow);

  const customRow = document.createElement('label');
  customRow.className = 'skin-custom-color';
  const customLabel = document.createElement('span');
  customLabel.textContent = activeColorChannel === 'primary' ? 'COR 1 — ESCOLHA QUALQUER COR' : 'COR 2 — ESCOLHA QUALQUER COR';
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.value = skin[activeColorChannel];
  picker.addEventListener('input', () => {
    skin[activeColorChannel] = picker.value;
    tintedSkinCache.clear();
    syncPlayerSkinFromMode();
    saveModeSkins();
    // Atualiza as miniaturas sem recriar o input (o seletor de cor continua aberto).
    panel.querySelectorAll('.mode-model').forEach((card, index) => {
      const cv = card.querySelector('canvas');
      if (!cv) return;
      const previewCtx = cv.getContext('2d');
      previewCtx.clearRect(0, 0, cv.width, cv.height);
      drawModeIcon(previewCtx, activeSkinMode, 6, 6, 52, 0, { ...skin, model: index });
    });
    panel.querySelectorAll('.skin-channel').forEach((button, index) => {
      const dot = button.querySelector('i');
      if (dot) dot.style.background = index === 0 ? skin.primary : skin.secondary;
    });
    renderSkinUI();
  });
  picker.addEventListener('change', () => renderModeGarage());
  customRow.append(customLabel, picker);
  colorSection.appendChild(customRow);

  const footer = document.createElement('div');
  footer.className = 'skin-panel-footer';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'skin-reset-btn';
  reset.textContent = 'RESTAURAR CORES DO MODO';
  reset.addEventListener('click', () => {
    skin.primary = MODE_INFO[activeSkinMode].color;
    skin.secondary = MODE_INFO[activeSkinMode].secondary;
    skin.model = 0;
    syncPlayerSkinFromMode();
    saveModeSkins();
    renderModeGarage();
    renderSkinUI();
  });
  footer.appendChild(reset);
  panel.appendChild(footer);
}

const originalSetupGarage = setupGarage;
setupGarage = function () {
  originalSetupGarage();
  setActiveMode(activeSkinMode || 'cube');
};

try {
  const storedMode = localStorage.getItem('gd_web_active_skin_mode');
  if (MODE_INFO[storedMode]) activeSkinMode = storedMode;
} catch (_) {}

MODE_LIST.forEach(mode => {
  const skin = modeSkins[mode];
  skin.model = Math.max(0, Math.min(MODE_SKIN_COUNTS[mode] - 1, Math.floor(Number(skin.model) || 0)));
  if (!/^#[0-9a-f]{6}$/i.test(skin.primary)) skin.primary = MODE_INFO[mode].color;
  if (!/^#[0-9a-f]{6}$/i.test(skin.secondary)) skin.secondary = MODE_INFO[mode].secondary;
});

syncPlayerSkinFromMode();
saveModeSkins();
document.querySelectorAll('#skin-models, .color-section').forEach(el => { el.style.display = 'none'; });
renderModeGarage();
renderSkinUI();

// === JANELA 900x500: TAMANHO ORIGINAL COMO MÍNIMO ===
(() => {
  const container = document.getElementById('game-container');
  const handle = document.getElementById('game-resize-handle');
  const editorCanvas = document.getElementById('editorCanvas');
  const SIZE_KEY = 'gd-web-window-size-v1';
  const ASPECT = 900 / 500;
  if (!container) return;

  // O jogo nunca fica menor que o tamanho lógico original.
  const bounds = () => ({
    maxW: Math.max(900, window.innerWidth - 16),
    maxH: Math.max(500, window.innerHeight - 16)
  });

  function applySize(width, persist = false) {
    const b = bounds();
    let w = Math.max(900, Math.min(b.maxW, Number(width) || 900));
    let h = w / ASPECT;
    if (h > b.maxH) {
      h = b.maxH;
      w = Math.max(900, h * ASPECT);
    }
    container.style.width = Math.round(w) + 'px';
    container.style.height = Math.round(w / ASPECT) + 'px';
    if (persist) {
      try { localStorage.setItem(SIZE_KEY, JSON.stringify({ width: Math.round(w), height: Math.round(w / ASPECT) })); } catch (_) {}
    }
  }

  if (editorCanvas) {
    editorCanvas.width = 900;
    editorCanvas.height = 500;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
    if (saved && Number.isFinite(saved.width)) applySize(Math.max(900, saved.width));
    else applySize(900);
  } catch (_) { applySize(900); }

  if (handle) {
    let drag = null;
    handle.addEventListener('pointerdown', event => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      drag = { pointerId: event.pointerId, x: event.clientX, width: rect.width };
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('resizing');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      applySize(drag.width + event.clientX - drag.x);
    });
    const stop = event => {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      drag = null;
      handle.classList.remove('resizing');
      applySize(container.getBoundingClientRect().width, true);
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }
})();
})();
