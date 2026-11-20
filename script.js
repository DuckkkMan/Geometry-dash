const canvas = document.getElementById('gameCanvas');
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

// Linha contínua que registra o caminho percorrido pelo jogador nesta tentativa.
function drawPlayerTrail(targetCtx, points, distance) {
    if (!points || points.length < 2) return;
    targetCtx.save();
    targetCtx.beginPath();
    let started = false;
    for (const point of points) {
        const screenX = point.x - distance + 160;
        if (screenX < -30 || screenX > targetCtx.canvas.width + 30) {
            if (started) targetCtx.stroke();
            targetCtx.beginPath();
            started = false;
            continue;
        }
        if (!started) {
            targetCtx.moveTo(screenX, point.y);
            started = true;
        } else {
            targetCtx.lineTo(screenX, point.y);
        }
    }
    if (started) {
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 3;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        targetCtx.shadowColor = '#00e5ff';
        targetCtx.shadowBlur = 8;
        targetCtx.stroke();
    }
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
        if (playerMode === 'cube' && this.grounded) {
            this.dy = JUMP_FORCE;
            this.grounded = false;
            playSfx('jump');
        }
    },

    draw() {
        if (playerMode === 'ship') {
            drawShipPlayer(ctx, this.x, this.y, this.size, this.dy, playerSkin);
        } else {
            drawCubeSkin(ctx, this.x, this.y, this.size, this.rotation, playerSkin);
        }
    }
};

// Cubo Bot da Tela Inicial
const bgBot = {
    x: 180,
    y: GROUND_Y - BLOCK_SIZE,
    size: BLOCK_SIZE,
    dy: 0,
    grounded: true,
    rotation: 0,
    spikes: [600, 950, 1320],

    update() {
        for (let i = 0; i < this.spikes.length; i++) {
            this.spikes[i] -= BASE_GAME_SPEED;
            if (this.spikes[i] < -60) {
                const maxSpike = Math.max(...this.spikes);
                this.spikes[i] = maxSpike + 320 + Math.random() * 140;
            }

            const distToSpike = this.spikes[i] - (this.x + this.size);
            if (distToSpike > 0 && distToSpike < 105 && this.grounded) {
                this.dy = JUMP_FORCE;
                this.grounded = false;
            }
        }

        this.dy += GRAVITY;
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

    draw() {
        for (let sx of this.spikes) {
            drawSpike(sx, GROUND_Y, BLOCK_SIZE, BLOCK_SIZE);
        }
        drawCubeSkin(ctx, this.x, this.y, this.size, this.rotation, playerSkin);
    }
};

// Variáveis da fase ativa
let activeSpikes = [];
let activePlatforms = [];
let activePads = [];
let activeOrbs = [];
let activeSaws = [];
let activePillars = [];
let activeCoins = [];
let activeTriggers = [];
let activePortals = [];
let activeFinishX = 3400;
let lockedFinishScreenX = 0;
let currentRunPercent = 0;
let activeAttemptNumber = 1;
let playerTrail = [];

function startAttempt(countNewAttempt = true) {
    clearRespawnTimer();
    clearHoldPauseTimer();
    applyPlatformSettingsUI();
    updatePracticeUI();
    const lvl = activePlayableLevel;

    if (countNewAttempt) {
        activeAttemptNumber = incrementAttempt(lvl.name);
        activeCheckpoint = null;
        checkpoints = [];
        lastAutoCheckpointDist = -9999;
    } else if (!isPracticeMode || !activeCheckpoint) {
        activeAttemptNumber = incrementAttempt(lvl.name);
    }

    particles = [];
    playerTrail = [];
    winFlashAlpha = 0;
    screenShake = 0;
    currentGameSpeed = BASE_GAME_SPEED;
    gravityMultiplier = 1;
    runtimeBgTop = lvl.bgTop;
    runtimeBgBottom = lvl.bgBottom;
    runtimeGroundFill = lvl.groundFill;
    runtimeGroundGrid = lvl.groundGrid;

    activeFinishX = lvl.finishX || 3400;
    activeSpikes = (lvl.spikes || []).map(sp => {
        const isMini = sp.sizeType === 'mini';
        return {
            x: sp.x,
            y: sp.y || GROUND_Y,
            inverted: Boolean(sp.inverted),
            width: isMini ? MINI_SPIKE_W : BLOCK_SIZE,
            height: isMini ? MINI_SPIKE_H : BLOCK_SIZE
        };
    });
    activePlatforms = [
        ...(lvl.platforms || []).map(pl => ({ ...pl })),
        ...(lvl.blocks || []).map(block => ({ ...block, isBlock: true }))
    ];
    activePads = (lvl.pads || []).map(pd => ({ ...pd, cooldown: 0 }));
    activeOrbs = (lvl.orbs || []).map(ob => ({ ...ob, used: false }));
    activeSaws = (lvl.saws || []).map(sw => ({ ...sw, angle: 0 }));
    activePillars = (lvl.pillars || []).map(pi => ({ ...pi }));
    activeCoins = (lvl.coins || []).map(co => ({ ...co, collected: false }));
    activeTriggers = (lvl.triggers || []).map(tr => ({ ...tr, triggered: false }));
    activePortals = (lvl.portals || []).map(pt => ({ ...pt, triggered: false }));

    if (isPracticeMode && activeCheckpoint) {
        levelDistance = activeCheckpoint.levelDistance;
        player.reset();
        player.y = activeCheckpoint.playerY;
        player.prevY = activeCheckpoint.playerY;
        player.dy = activeCheckpoint.playerDy;
        player.rotation = activeCheckpoint.playerRotation;
        player.grounded = activeCheckpoint.playerGrounded;
        playerMode = activeCheckpoint.playerMode;
        currentGameSpeed = activeCheckpoint.currentGameSpeed || BASE_GAME_SPEED;
        gravityMultiplier = activeCheckpoint.gravityMultiplier || 1;
        runtimeBgTop = activeCheckpoint.runtimeBgTop || lvl.bgTop;
        runtimeBgBottom = activeCheckpoint.runtimeBgBottom || lvl.bgBottom;
        runtimeGroundFill = activeCheckpoint.runtimeGroundFill || lvl.groundFill;
        runtimeGroundGrid = activeCheckpoint.runtimeGroundGrid || lvl.groundGrid;
        activePortals.forEach((pt, idx) => { pt.triggered = Boolean(activeCheckpoint.portalsTriggered[idx]); });
        activeOrbs.forEach((ob, idx) => { ob.used = Boolean(activeCheckpoint.orbsUsed[idx]); });
        activeCoins.forEach((co, idx) => { co.collected = Boolean(activeCheckpoint.coinsCollected[idx]); });
        activeTriggers.forEach((tr, idx) => { tr.triggered = Boolean(activeCheckpoint.triggersFired[idx]); });
    } else {
        playerMode = 'cube';
        levelDistance = 0;
        player.reset();
    }

    const cameraStopDistance = (activeFinishX + 160) - (canvas.width - 120);
    updateProgressUI((levelDistance / cameraStopDistance) * 97);
    gameState = 'PLAYING';
}

function triggerDeath() {
    if (gameState !== 'PLAYING') return;

    playSfx('death');
    screenShake = 10;
    recordBestProgress(activePlayableLevel.name, currentRunPercent);
    gameState = 'DEAD';
    isHoldingJump = false;
    jumpJustPressed = false;

    const cx = player.x + player.size / 2;
    const cy = player.y + player.size / 2;
    for (let i = 0; i < 36; i++) {
        const angle = (Math.PI * 2 * i) / 36 + (Math.random() - 0.5) * 0.35;
        const speed = 2.5 + Math.random() * 9.5;
        particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 6 + Math.random() * 9,
            color: i % 3 === 0 ? playerSkin.primary : (i % 3 === 1 ? playerSkin.secondary : '#ffffff'),
            alpha: 1,
            decay: 0.014,
            gravity: 0.25,
            rot: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.25
        });
    }

    scheduleRespawn(RESPAWN_DELAY_MS);
}

function pauseCurrentGame() {
    const pausableStates = ['PLAYING', 'DEAD', 'ENDING_ANIM'];
    if (!pausableStates.includes(gameState)) return;

    clearHoldPauseTimer();
    isHoldingJump = false;
    jumpJustPressed = false;
    stateBeforePause = gameState;

    if (gameState === 'DEAD' && respawnTimer) {
        clearTimeout(respawnTimer);
        respawnTimer = null;
        deadRemainingMs = Math.max(100, deadRemainingMs - (Date.now() - deadStartedAt));
    }

    gameState = 'PAUSED';
    document.getElementById('pause-level-name').textContent = `${activePlayableLevel.name} • ${currentRunPercent}%`;
    pauseScreen.classList.remove('hidden');
}

function resumeCurrentGame() {
    if (gameState !== 'PAUSED') return;

    pauseScreen.classList.add('hidden');
    gameState = stateBeforePause;

    if (gameState === 'DEAD') {
        scheduleRespawn(deadRemainingMs || RESPAWN_DELAY_MS);
    }
}

function updateProgressUI(percent) {
    const clamped = Math.min(100, Math.max(0, Math.floor(percent)));
    currentRunPercent = clamped;
    progressFill.style.width = clamped + '%';
    progressText.textContent = clamped + '%';
}

function drawAttemptLabel() {
    const attemptX = 280 - levelDistance + 160;
    if (attemptX < -220 || attemptX > canvas.width + 220) return;

    ctx.save();
    ctx.font = '900 28px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ffffff';
    const label = isPracticeMode ? 'Practice' : `Attempt ${activeAttemptNumber}`;
    ctx.strokeText(label, attemptX, GROUND_Y - 125);
    ctx.fillText(label, attemptX, GROUND_Y - 125);
    ctx.restore();
}

function drawCheckpoints() {
    if (!isPracticeMode || checkpoints.length === 0) return;
    for (let ck of checkpoints) {
        const sx = ck.levelDistance - levelDistance + 160 + player.size / 2;
        if (sx < -30 || sx > canvas.width + 30) continue;
        ctx.save();
        ctx.strokeStyle = '#00e5ff';
        ctx.fillStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, GROUND_Y);
        ctx.lineTo(sx, GROUND_Y - 26);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, GROUND_Y - 28, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawBackground() {
    const isInLevel = ['PLAYING', 'DEAD', 'PAUSED', 'ENDING_ANIM', 'WIN'].includes(gameState);
    const lvl = activePlayableLevel;

    const topColor = isInLevel ? (runtimeBgTop || lvl.bgTop) : '#0038a8';
    const bottomColor = isInLevel ? (runtimeBgBottom || lvl.bgBottom) : '#0066ff';

    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    const tileSize = 90;
    const offsetX = -(bgScroll % tileSize);

    for (let x = offsetX; x < canvas.width; x += tileSize) {
        for (let y = 0; y < GROUND_Y; y += tileSize) {
            ctx.strokeRect(x + 8, y + 8, tileSize - 16, tileSize - 16);
        }
    }
}

function drawGround() {
    const isInLevel = ['PLAYING', 'DEAD', 'PAUSED', 'ENDING_ANIM', 'WIN'].includes(gameState);
    const lvl = activePlayableLevel;

    ctx.fillStyle = isInLevel ? (runtimeGroundFill || lvl.groundFill) : '#001d5c';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    ctx.strokeStyle = isInLevel ? (runtimeGroundGrid || lvl.groundGrid) : '#0044cc';
    ctx.lineWidth = 2;
    const tile = 55;
    const offset = -(groundScroll % tile);

    for (let x = offset; x < canvas.width; x += tile) {
        ctx.strokeRect(x, GROUND_Y, tile, tile);
        ctx.strokeRect(x, GROUND_Y + tile, tile, tile);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();
}

function drawSpike(x, y, w, h, inverted = false) {
    ctx.save();
    ctx.beginPath();
    if (inverted) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x + w, y);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y - h);
        ctx.lineTo(x + w, y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y - h, x, y + h);
    grad.addColorStop(0, '#222');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
}

function drawFinishWall(screenX) {
    if (screenX > canvas.width + 50) return;

    const wallWidth = Math.max(120, canvas.width - screenX + 50);
    const grad = ctx.createLinearGradient(screenX, 0, screenX + 90, 0);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#00ffaa');
    grad.addColorStop(1, '#004433');
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, 0, wallWidth, GROUND_Y);

    const aura = ctx.createLinearGradient(screenX - 50, 0, screenX, 0);
    aura.addColorStop(0, 'rgba(0, 255, 170, 0)');
    aura.addColorStop(1, 'rgba(0, 255, 170, 0.55)');
    ctx.fillStyle = aura;
    ctx.fillRect(screenX - 50, 0, 50, GROUND_Y);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX, 0, 6, GROUND_Y);
}

function spawnEndParticles(x, y, count = 4, burst = false) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + Math.random() * 30,
            y: y + Math.random() * 40,
            vx: burst ? (Math.random() - 0.5) * 12 : -2 - Math.random() * 4,
            vy: burst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 6,
            size: 5 + Math.random() * 6,
            color: Math.random() > 0.5 ? '#7fff00' : '#ffe600',
            alpha: 1,
            decay: 0.025,
            gravity: 0,
            rot: 0,
            vRot: 0
        });
    }
}

function updateParticlesOnly() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.gravity) pt.vy += pt.gravity;
        if (pt.vRot) pt.rot += pt.vRot;
        pt.alpha -= pt.decay || 0.025;
        if (pt.alpha <= 0) particles.splice(i, 1);
    }
}

function drawParticlesOnly() {
    for (let pt of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.fillStyle = pt.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.strokeRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.restore();
    }
}

function checkSpikeCollision(p, spikeScreenX, spikeW, spikeH, spikeY = GROUND_Y, inverted = false) {
    const spikeCenterX = spikeScreenX + spikeW / 2;
    const hitW = spikeW * 0.28;
    const hitH = spikeH * 0.65;

    const horizHit = p.x + 6 < spikeCenterX + hitW / 2 && p.x + p.size - 6 > spikeCenterX - hitW / 2;
    if (!horizHit) return false;

    if (inverted) {
        return p.y + 4 < spikeY + hitH && p.y + p.size > spikeY;
    }
    return p.y + p.size - 4 > spikeY - hitH && p.y < spikeY;
}

function drawLevelElementsInWorld() {
    drawCheckpoints();

    for (let pi of activePillars) {
        const screenX = pi.x - levelDistance + 160;
        drawPillar(pi, screenX);
    }

    for (let tr of activeTriggers) {
        const screenX = tr.x - levelDistance + 160;
        drawTriggerMarker(tr, screenX);
    }

    for (let pl of activePlatforms) {
        const screenX = pl.x - levelDistance + 160;
        drawPlatform(pl, screenX);
    }

    for (let pd of activePads) {
        const screenX = pd.x - levelDistance + 160;
        drawPad(pd, screenX);
    }

    for (let ob of activeOrbs) {
        const screenX = ob.x - levelDistance + 160;
        drawOrb(ob, screenX);
    }

    for (let co of activeCoins) {
        const screenX = co.x - levelDistance + 160;
        drawCoin(co, screenX);
    }

    for (let sw of activeSaws) {
        const screenX = sw.x - levelDistance + 160;
        drawSaw(sw, screenX);
    }

    for (let pt of activePortals) {
        const screenX = pt.x - levelDistance + 160;
        drawPortal(pt, screenX);
    }

    for (let s of activeSpikes) {
        const screenX = s.x - levelDistance + 160;
        if (screenX + s.width > -50 && screenX < canvas.width + 50) {
            drawSpike(screenX, s.y || GROUND_Y, s.width, s.height, s.inverted);
        }
    }
}

// Loop Principal
function loop() {
    ctx.save();
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake = Math.max(0, screenShake - 0.8);
    }
    ctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);

    if (gameState === 'MENU' || gameState === 'EDITOR_HUB' || gameState === 'CREATIONS' || gameState === 'SETTINGS' || gameState === 'LEVEL_SELECT' || gameState === 'SKINS') {
        bgScroll += BASE_GAME_SPEED * 0.25;
        groundScroll += BASE_GAME_SPEED;
        drawBackground();
        drawGround();

        bgBot.update();
        bgBot.draw();
    } 
    else if (gameState === 'PLAYING') {
        bgScroll += currentGameSpeed * 0.25;
        groundScroll += currentGameSpeed;
        levelDistance += currentGameSpeed;

        if (isPracticeMode && levelDistance - lastAutoCheckpointDist >= AUTO_CHECKPOINT_STEP) {
            lastAutoCheckpointDist = levelDistance;
            saveCheckpointAtCurrentState();
        }

        drawBackground();
        drawGround();
        drawAttemptLabel();
        drawLevelElementsInWorld();

        const cameraStopDistance = (activeFinishX + 160) - (canvas.width - 120);
        const progress = (levelDistance / cameraStopDistance) * 97;
        updateProgressUI(progress);

        for (let tr of activeTriggers) {
            const screenX = tr.x - levelDistance + 160;
            checkTriggerActivation(player, tr, screenX);
        }

        for (let pt of activePortals) {
            const screenX = pt.x - levelDistance + 160;
            checkPortalTrigger(player, pt, screenX);
        }

        for (let pd of activePads) {
            const screenX = pd.x - levelDistance + 160;
            checkPadCollision(player, pd, screenX);
        }

        for (let ob of activeOrbs) {
            const screenX = ob.x - levelDistance + 160;
            checkOrbTrigger(player, ob, screenX);
        }

        for (let co of activeCoins) {
            const screenX = co.x - levelDistance + 160;
            checkCoinTrigger(player, co, screenX);
        }

        for (let sw of activeSaws) {
            sw.angle = (sw.angle || 0) + 0.18;
            const screenX = sw.x - levelDistance + 160;
            if (checkSawCollision(player, sw, screenX)) {
                triggerDeath();
                break;
            }
        }

        if (gameState === 'PLAYING') {
            for (let s of activeSpikes) {
                const screenX = s.x - levelDistance + 160;
                if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                    if (checkSpikeCollision(player, screenX, s.width, s.height, s.y || GROUND_Y, s.inverted)) {
                        triggerDeath();
                        break;
                    }
                }
            }
        }

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        if (gameState === 'PLAYING') {
            player.update();
            playerTrail.push({ x: levelDistance, y: player.y + player.size / 2 });
            if (playerTrail.length > 1400) playerTrail.shift();

            for (let pl of activePlatforms) {
                const screenX = pl.x - levelDistance + 160;
                if (handlePlatformCollision(player, pl, screenX)) break;
            }

            if (gameState === 'PLAYING') {
                drawPlayerTrail(ctx, playerTrail, levelDistance);
                player.draw();
                jumpJustPressed = false;
            }

            if (levelDistance >= cameraStopDistance) {
                lockedFinishScreenX = finishScreenX;
                clearHoldPauseTimer();
                gameState = 'ENDING_ANIM';
                isHoldingJump = false;
                jumpJustPressed = false;
            }
        }
    }
    else if (gameState === 'DEAD') {
        drawBackground();
        drawGround();
        drawAttemptLabel();
        drawLevelElementsInWorld();

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        updateParticlesOnly();
        drawParticlesOnly();
    }
    else if (gameState === 'PAUSED') {
        drawBackground();
        drawGround();
        drawAttemptLabel();
        drawLevelElementsInWorld();

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        if (stateBeforePause === 'DEAD') {
            drawParticlesOnly();
        } else {
            drawPlayerTrail(ctx, playerTrail, levelDistance);
            player.draw();
        }
    }
    else if (gameState === 'ENDING_ANIM') {
        drawBackground();
        drawGround();
        drawLevelElementsInWorld();
        drawFinishWall(lockedFinishScreenX);

        player.x += 8.5;
        player.y += (GROUND_Y / 2 - player.y) * 0.08;
        player.rotation += 0.22;

        spawnEndParticles(player.x, player.y, 4, false);
        updateParticlesOnly();
        drawParticlesOnly();
        player.draw();

        const travelDone = Math.max(0, player.x - 160);
        const totalTravel = Math.max(1, (lockedFinishScreenX - player.size / 2) - 160);
        const finalPercent = 97 + (travelDone / totalTravel) * 3;
        updateProgressUI(finalPercent);

        if (player.x + player.size / 2 >= lockedFinishScreenX) {
            const completedLevelName = activePlayableLevel.name;
            updateProgressUI(100);
            recordBestProgress(completedLevelName, 100);
            if (!isPracticeMode) {
                resetAttemptsForLevel(completedLevelName);
            }

            spawnEndParticles(lockedFinishScreenX - 10, player.y, 28, true);
            winFlashAlpha = 0.75;

            gameState = 'WIN';
            hud.classList.add('hidden');
            document.getElementById('win-level-name').textContent = isPracticeMode
                ? `${completedLevelName} • 100% (PRÁTICA)`
                : `${completedLevelName} • 100% • ATTEMPTS ZERADOS`;
            winScreen.classList.remove('hidden');
        }
    }
    else if (gameState === 'WIN') {
        drawBackground();
        drawGround();
        drawFinishWall(lockedFinishScreenX);
        updateParticlesOnly();
        drawParticlesOnly();

        if (winFlashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${winFlashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            winFlashAlpha = Math.max(0, winFlashAlpha - 0.04);
        }
    }

    ctx.restore();
    requestAnimationFrame(loop);
}

// === EDITOR DE FASES (GRID + ASSETS + TRIGGERS + BG/GROUND + CRIAÇÕES) ===
const EDITOR_GRID = 38;
const EDITOR_GROUND_Y = 270;
const EDITOR_SCALE_Y = EDITOR_GROUND_Y / GROUND_Y;

let editorToolMode = 'place'; // 'place' | 'erase' | 'pan'
let editorShowGrid = true;
let editorSelectedItem = 'spike';
let editorPlatformDrag = null;
let editorPanLastX = null;
let editorScrollX = 0;
let editorEditingId = null;
let editorDraft = createEmptyEditorDraft();

const ASSET_PALETTE = [
    { id: 'spike', label: 'ESPINHO', color: '#ff595e' },
    { id: 'mini_spike', label: 'MINI SPIKE', color: '#ff924c' },
    { id: 'ceil_spike', label: 'TETO SPIKE', color: '#d62828' },
    { id: 'platform', label: 'PLATAFORMA', color: '#00e5ff' },
    { id: 'block', label: 'BLOCO', color: '#4cc9f0' },
    { id: 'pad_yellow', label: 'PAD AMAR.', color: '#ffe600' },
    { id: 'pad_pink', label: 'PAD ROSA', color: '#ff4fd8' },
    { id: 'orb_yellow', label: 'ORB AMAR.', color: '#ffd60a' },
    { id: 'orb_pink', label: 'ORB ROSA', color: '#f72585' },
    { id: 'saw', label: 'SERRA', color: '#94a3b8' },
    { id: 'pillar', label: 'PILAR', color: '#e2e8f0' },
    { id: 'coin', label: 'MOEDA', color: '#ffb703' },
    { id: 'portal_ship', label: 'PORTAL SHIP', color: '#38bdf8' },
    { id: 'portal_cube', label: 'PORTAL CUBO', color: '#80ed99' }
];

const TRIGGER_PALETTE = [
    { id: 'trig_speed_fast', label: 'VEL 1.25x', color: '#00f5d4' },
    { id: 'trig_speed_norm', label: 'VEL 1.0x', color: '#00bbf9' },
    { id: 'trig_bg_purple', label: 'BG ROXO', color: '#9b5de5' },
    { id: 'trig_shake', label: 'SHAKE', color: '#f15bb5' },
    { id: 'trig_low_grav', label: 'GRAV BAIXA', color: '#fee440' },
    { id: 'trig_norm_grav', label: 'GRAV NORM', color: '#9dff00' }
];

function createEmptyEditorDraft() {
    return {
        id: 'lvl_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: 'Fase Custom',
        difficulty: 'NORMAL',
        bgTop: '#1e1b4b',
        bgBottom: '#4338ca',
        groundFill: '#110e2e',
        groundGrid: '#3730a3',
        finishX: 4400,
        spikes: [],
        platforms: [],
        blocks: [],
        pads: [],
        orbs: [],
        saws: [],
        pillars: [],
        coins: [],
        triggers: [],
        portals: []
    };
}

function syncStyleInputsFromDraft() {
    document.getElementById('editor-level-title').value = editorDraft.name;
    document.getElementById('editor-level-diff').value = editorDraft.difficulty || 'NORMAL';
    document.getElementById('style-bg-top').value = editorDraft.bgTop;
    document.getElementById('style-bg-bottom').value = editorDraft.bgBottom;
    document.getElementById('style-ground-fill').value = editorDraft.groundFill;
    document.getElementById('style-ground-grid').value = editorDraft.groundGrid;
    const finishInput = document.getElementById('style-finish-x');
    finishInput.max = String(Math.max(Number(finishInput.max) || 7500, editorDraft.finishX + 100000));
    finishInput.value = editorDraft.finishX;
    document.getElementById('style-finish-label').textContent = editorDraft.finishX;
}

function openEditorWithLevel(existingLevel = null) {
    if (existingLevel) {
        editorEditingId = existingLevel.id;
        editorDraft = JSON.parse(JSON.stringify(existingLevel));
        editorDraft.blocks = editorDraft.blocks || [];
    } else {
        editorEditingId = null;
        editorDraft = createEmptyEditorDraft();
    }
    editorScrollX = 0;
    syncStyleInputsFromDraft();
    renderEditorPalettes();
    gameState = 'EDITOR';
    drawEditorCanvas();
}

function saveEditorDraftToCreations() {
    editorDraft.name = (document.getElementById('editor-level-title').value || 'Sem Nome').trim().slice(0, 26);
    editorDraft.difficulty = document.getElementById('editor-level-diff').value || 'NORMAL';
    editorDraft.bgTop = document.getElementById('style-bg-top').value;
    editorDraft.bgBottom = document.getElementById('style-bg-bottom').value;
    editorDraft.groundFill = document.getElementById('style-ground-fill').value;
    editorDraft.groundGrid = document.getElementById('style-ground-grid').value;
    editorDraft.finishX = Number(document.getElementById('style-finish-x').value) || 4400;

    const existingIdx = customLevels.findIndex(item => item.id === editorDraft.id);
    if (existingIdx >= 0) {
        customLevels[existingIdx] = JSON.parse(JSON.stringify(editorDraft));
    } else {
        customLevels.push(JSON.parse(JSON.stringify(editorDraft)));
    }
    writeSaveData();
}

function renderCreationsList() {
    const listEl = document.getElementById('creations-list');
    listEl.innerHTML = '';

    if (customLevels.length === 0) {
        listEl.innerHTML = '<div class="empty-creations">Nenhuma fase criada ainda. Clique em + NOVA ou em CRIAR!</div>';
        return;
    }

    customLevels.forEach((lvl) => {
        const item = document.createElement('div');
        item.className = 'creation-item';

        const meta = document.createElement('div');
        meta.className = 'creation-meta';
        meta.innerHTML = `
            <span class="creation-name">${lvl.name}</span>
            <span class="creation-sub">${lvl.difficulty} • TAMANHO: ${lvl.finishX}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'creation-actions';

        const playBtn = document.createElement('button');
        playBtn.className = 'tiny-btn green';
        playBtn.textContent = 'JOGAR';
        playBtn.addEventListener('click', () => {
            activePlayableLevel = lvl;
            isTestingFromEditor = false;
            creationsScreen.classList.add('hidden');
            hud.classList.remove('hidden');
            startAttempt(true);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'tiny-btn blue';
        editBtn.textContent = 'EDITAR';
        editBtn.addEventListener('click', () => {
            creationsScreen.classList.add('hidden');
            levelEditor.classList.remove('hidden');
            openEditorWithLevel(lvl);
        });

        const renameBtn = document.createElement('button');
        renameBtn.className = 'tiny-btn yellow';
        renameBtn.textContent = 'RENOMEAR';
        renameBtn.addEventListener('click', () => {
            const nextName = prompt('Novo nome da fase:', lvl.name);
            if (nextName && nextName.trim()) {
                lvl.name = nextName.trim().slice(0, 26);
                writeSaveData();
                renderCreationsList();
            }
        });

        const diffSel = document.createElement('select');
        diffSel.className = 'creation-diff-select';
        ['EASY', 'NORMAL', 'HARD', 'INSANE'].forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            if (lvl.difficulty === d) opt.selected = true;
            diffSel.appendChild(opt);
        });
        diffSel.addEventListener('change', () => {
            lvl.difficulty = diffSel.value;
            writeSaveData();
            renderCreationsList();
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'tiny-btn red';
        delBtn.textContent = 'APAGAR';
        delBtn.addEventListener('click', () => {
            customLevels = customLevels.filter(c => c.id !== lvl.id);
            writeSaveData();
            renderCreationsList();
        });

        actions.append(playBtn, editBtn, renameBtn, diffSel, delBtn);
        item.append(meta, actions);
        listEl.appendChild(item);
    });
}

function renderEditorPalettes() {
    const assetsDiv = document.getElementById('editor-palette');
    const trigDiv = document.getElementById('editor-triggers-palette');
    assetsDiv.innerHTML = '';
    trigDiv.innerHTML = '';

    ASSET_PALETTE.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'palette-item' + (editorSelectedItem === item.id ? ' selected' : '');
        btn.innerHTML = `<span class="palette-dot" style="background:${item.color}"></span><span>${item.label}</span>`;
        btn.addEventListener('click', () => {
            editorSelectedItem = item.id;
            editorToolMode = 'place';
            syncEditorToolButtons();
            renderEditorPalettes();
        });
        assetsDiv.appendChild(btn);
    });

    TRIGGER_PALETTE.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'palette-item' + (editorSelectedItem === item.id ? ' selected' : '');
        btn.innerHTML = `<span class="palette-dot" style="background:${item.color}"></span><span>${item.label}</span>`;
        btn.addEventListener('click', () => {
            editorSelectedItem = item.id;
            editorToolMode = 'place';
            syncEditorToolButtons();
            renderEditorPalettes();
        });
        trigDiv.appendChild(btn);
    });
}

function syncEditorToolButtons() {
    document.getElementById('tool-place-btn').classList.toggle('active', editorToolMode === 'place');
    document.getElementById('tool-erase-btn').classList.toggle('active', editorToolMode === 'erase');
    document.getElementById('tool-pan-btn').classList.toggle('active', editorToolMode === 'pan');
    document.getElementById('editor-grid-btn').textContent = editorShowGrid ? 'GRID: ON' : 'GRID: OFF';
    document.getElementById('editorCanvas').style.cursor = editorToolMode === 'pan' ? 'grab' : (editorToolMode === 'erase' ? 'not-allowed' : 'crosshair');
}

function eraseAtWorldCoord(worldX, worldY) {
    const tolX = 36;
    const tolY = 42;
    const nearX = (x) => Math.abs(x - worldX) <= tolX;
    const nearY = (y) => Math.abs(y - worldY) <= tolY;

    editorDraft.spikes = editorDraft.spikes.filter(s => !(nearX(s.x) && nearY(s.y || GROUND_Y)));
    editorDraft.platforms = editorDraft.platforms.filter(p => !(worldX >= p.x - 16 && worldX <= p.x + p.w + 16 && nearY(p.y)));
    editorDraft.blocks = (editorDraft.blocks || []).filter(b => !(worldX >= b.x - 8 && worldX <= b.x + b.w + 8 && worldY >= b.y - 8 && worldY <= b.y + b.h + 8));
    editorDraft.pads = editorDraft.pads.filter(p => !nearX(p.x));
    editorDraft.orbs = editorDraft.orbs.filter(o => !(nearX(o.x) && nearY(o.y)));
    editorDraft.saws = editorDraft.saws.filter(sw => !(nearX(sw.x) && nearY(sw.y)));
    editorDraft.pillars = editorDraft.pillars.filter(pi => !nearX(pi.x));
    editorDraft.coins = editorDraft.coins.filter(co => !(nearX(co.x) && nearY(co.y)));
    editorDraft.triggers = editorDraft.triggers.filter(tr => !nearX(tr.x));
    editorDraft.portals = editorDraft.portals.filter(pt => !nearX(pt.x));
}

function placeSelectedAtWorldCoord(worldX, worldY) {
    const clampedX = Math.max(260, Math.min(editorDraft.finishX - 120, worldX));
    const clampedY = Math.max(CEILING_Y + 20, Math.min(GROUND_Y, worldY));

    switch (editorSelectedItem) {
        case 'spike':
            editorDraft.spikes.push({ x: clampedX, y: GROUND_Y, sizeType: 'normal', inverted: false });
            break;
        case 'mini_spike':
            editorDraft.spikes.push({ x: clampedX, y: GROUND_Y, sizeType: 'mini', inverted: false });
            break;
        case 'ceil_spike':
            editorDraft.spikes.push({ x: clampedX, y: CEILING_Y, sizeType: 'normal', inverted: true });
            break;
        case 'platform':
            editorDraft.platforms.push({ x: clampedX, y: Math.min(GROUND_Y - 36, clampedY), w: EDITOR_GRID, h: 26 });
            break;
        case 'block':
            editorDraft.blocks.push({ x: clampedX, y: Math.min(GROUND_Y - BLOCK_SIZE, Math.max(CEILING_Y, clampedY - BLOCK_SIZE / 2)), w: BLOCK_SIZE, h: BLOCK_SIZE });
            break;
        case 'pad_yellow':
            editorDraft.pads.push({ x: clampedX, color: 'yellow', cooldown: 0 });
            break;
        case 'pad_pink':
            editorDraft.pads.push({ x: clampedX, color: 'pink', cooldown: 0 });
            break;
        case 'orb_yellow':
            editorDraft.orbs.push({ x: clampedX, y: Math.min(GROUND_Y - 30, clampedY), color: 'yellow', used: false });
            break;
        case 'orb_pink':
            editorDraft.orbs.push({ x: clampedX, y: Math.min(GROUND_Y - 30, clampedY), color: 'pink', used: false });
            break;
        case 'saw':
            editorDraft.saws.push({ x: clampedX, y: Math.min(GROUND_Y - 30, clampedY), r: 22, angle: 0 });
            break;
        case 'pillar':
            editorDraft.pillars.push({ x: clampedX, h: 90, w: 34 });
            break;
        case 'coin':
            editorDraft.coins.push({ x: clampedX, y: Math.min(GROUND_Y - 30, clampedY), collected: false });
            break;
        case 'portal_ship':
            editorDraft.portals.push({ x: clampedX, type: 'ship', triggered: false });
            break;
        case 'portal_cube':
            editorDraft.portals.push({ x: clampedX, type: 'cube', triggered: false });
            break;
        case 'trig_speed_fast':
            editorDraft.triggers.push({ x: clampedX, kind: 'speed_fast', triggered: false });
            break;
        case 'trig_speed_norm':
            editorDraft.triggers.push({ x: clampedX, kind: 'speed_normal', triggered: false });
            break;
        case 'trig_bg_purple':
            editorDraft.triggers.push({ x: clampedX, kind: 'bg', bgTop: '#240046', bgBottom: '#7b2cbf', triggered: false });
            break;
        case 'trig_shake':
            editorDraft.triggers.push({ x: clampedX, kind: 'shake', triggered: false });
            break;
        case 'trig_low_grav':
            editorDraft.triggers.push({ x: clampedX, kind: 'low_grav', triggered: false });
            break;
        case 'trig_norm_grav':
            editorDraft.triggers.push({ x: clampedX, kind: 'norm_grav', triggered: false });
            break;
    }
}

function drawEditorCanvas() {
    if (gameState !== 'EDITOR') return;

    const bgTop = document.getElementById('style-bg-top').value;
    const bgBottom = document.getElementById('style-bg-bottom').value;
    const groundFill = document.getElementById('style-ground-fill').value;
    const groundGrid = document.getElementById('style-ground-grid').value;
    const finishX = Number(document.getElementById('style-finish-x').value) || 4400;

    eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    const grad = eCtx.createLinearGradient(0, 0, 0, EDITOR_GROUND_Y);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBottom);
    eCtx.fillStyle = grad;
    eCtx.fillRect(0, 0, editorCanvas.width, EDITOR_GROUND_Y);

    eCtx.fillStyle = groundFill;
    eCtx.fillRect(0, EDITOR_GROUND_Y, editorCanvas.width, editorCanvas.height - EDITOR_GROUND_Y);

    if (editorShowGrid) {
        eCtx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        eCtx.lineWidth = 1;
        const startGridX = -(editorScrollX % EDITOR_GRID);
        for (let gx = startGridX; gx < editorCanvas.width; gx += EDITOR_GRID) {
            eCtx.beginPath();
            eCtx.moveTo(gx, 0);
            eCtx.lineTo(gx, EDITOR_GROUND_Y);
            eCtx.stroke();
        }
        for (let gy = 0; gy <= EDITOR_GROUND_Y; gy += EDITOR_GRID) {
            eCtx.beginPath();
            eCtx.moveTo(0, gy);
            eCtx.lineTo(editorCanvas.width, gy);
            eCtx.stroke();
        }
    }

    eCtx.strokeStyle = groundGrid;
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.moveTo(0, EDITOR_GROUND_Y);
    eCtx.lineTo(editorCanvas.width, EDITOR_GROUND_Y);
    eCtx.stroke();

    const toSX = (wx) => wx - editorScrollX + 80;
    const toSY = (wy) => wy * EDITOR_SCALE_Y;

    editorDraft.pillars.forEach(pi => {
        const sx = toSX(pi.x);
        const h = (pi.h || 90) * EDITOR_SCALE_Y;
        eCtx.fillStyle = 'rgba(255,255,255,0.2)';
        eCtx.fillRect(sx, EDITOR_GROUND_Y - h, 24, h);
    });

    editorDraft.platforms.forEach(pl => {
        const sx = toSX(pl.x);
        const sy = toSY(pl.y);
        const width = Math.max(EDITOR_GRID, pl.w);
        const height = Math.max(12, (pl.h || 26) * EDITOR_SCALE_Y);
        eCtx.fillStyle = '#00e5ff';
        eCtx.strokeStyle = '#000';
        eCtx.lineWidth = 2;
        eCtx.fillRect(sx, sy, width, height);
        eCtx.strokeRect(sx, sy, width, height);
    });

    (editorDraft.blocks || []).forEach(block => {
        const sx = toSX(block.x);
        const sy = toSY(block.y);
        const width = (block.w || BLOCK_SIZE);
        const height = (block.h || BLOCK_SIZE) * EDITOR_SCALE_Y;
        eCtx.fillStyle = '#2475bd';
        eCtx.strokeStyle = '#ffffff';
        eCtx.lineWidth = 2;
        eCtx.fillRect(sx, sy, width, height);
        eCtx.strokeRect(sx, sy, width, height);
        eCtx.strokeStyle = 'rgba(255,255,255,0.35)';
        eCtx.strokeRect(sx + 5, sy + 5, width - 10, Math.max(5, height - 10));
    });

    editorDraft.spikes.forEach(sp => {
        const sx = toSX(sp.x);
        const sy = sp.inverted ? toSY(CEILING_Y) : EDITOR_GROUND_Y;
        const h = (sp.sizeType === 'mini' ? 18 : 30);
        eCtx.fillStyle = '#ff595e';
        eCtx.strokeStyle = '#fff';
        eCtx.beginPath();
        if (sp.inverted) {
            eCtx.moveTo(sx, sy);
            eCtx.lineTo(sx + 15, sy + h);
            eCtx.lineTo(sx + 30, sy);
        } else {
            eCtx.moveTo(sx, sy);
            eCtx.lineTo(sx + 15, sy - h);
            eCtx.lineTo(sx + 30, sy);
        }
        eCtx.closePath();
        eCtx.fill();
        eCtx.stroke();
    });

    editorDraft.pads.forEach(pd => {
        const sx = toSX(pd.x);
        eCtx.fillStyle = pd.color === 'pink' ? '#ff4fd8' : '#ffe600';
        eCtx.fillRect(sx, EDITOR_GROUND_Y - 8, 26, 8);
    });

    editorDraft.orbs.forEach(ob => {
        const sx = toSX(ob.x);
        const sy = toSY(ob.y);
        eCtx.fillStyle = ob.color === 'pink' ? '#ff4fd8' : '#ffe600';
        eCtx.beginPath();
        eCtx.arc(sx, sy, 11, 0, Math.PI * 2);
        eCtx.fill();
    });

    editorDraft.saws.forEach(sw => {
        eCtx.fillStyle = '#94a3b8';
        eCtx.beginPath();
        eCtx.arc(toSX(sw.x), toSY(sw.y), 14, 0, Math.PI * 2);
        eCtx.fill();
    });

    editorDraft.coins.forEach(co => {
        eCtx.fillStyle = '#ffd60a';
        eCtx.beginPath();
        eCtx.arc(toSX(co.x), toSY(co.y), 9, 0, Math.PI * 2);
        eCtx.fill();
    });

    editorDraft.portals.forEach(pt => {
        const sx = toSX(pt.x);
        eCtx.strokeStyle = pt.type === 'ship' ? '#38bdf8' : '#80ed99';
        eCtx.lineWidth = 3;
        eCtx.strokeRect(sx, EDITOR_GROUND_Y - 78, 32, 78);
    });

    editorDraft.triggers.forEach(tr => {
        const sx = toSX(tr.x);
        eCtx.strokeStyle = '#ffe600';
        eCtx.strokeRect(sx, 30, 16, EDITOR_GROUND_Y - 30);
    });

    // Personagem-guia e sua linha ficam visíveis o tempo todo no editor.
    const guideX = 160;
    const guideY = EDITOR_GROUND_Y - BLOCK_SIZE * EDITOR_SCALE_Y;
    eCtx.save();
    eCtx.strokeStyle = '#ffffff';
    eCtx.lineWidth = 3;
    eCtx.lineCap = 'round';
    eCtx.shadowColor = '#00e5ff';
    eCtx.shadowBlur = 8;
    eCtx.beginPath();
    eCtx.moveTo(72, guideY + BLOCK_SIZE * EDITOR_SCALE_Y / 2);
    eCtx.lineTo(guideX, guideY + BLOCK_SIZE * EDITOR_SCALE_Y / 2);
    eCtx.stroke();
    eCtx.shadowBlur = 0;
    eCtx.fillStyle = '#ffde00';
    eCtx.strokeStyle = '#000000';
    eCtx.lineWidth = 2;
    eCtx.fillRect(guideX, guideY, BLOCK_SIZE, BLOCK_SIZE * EDITOR_SCALE_Y);
    eCtx.strokeRect(guideX, guideY, BLOCK_SIZE, BLOCK_SIZE * EDITOR_SCALE_Y);
    eCtx.restore();

    const finX = toSX(finishX);
    eCtx.strokeStyle = '#00ffaa';
    eCtx.lineWidth = 4;
    eCtx.beginPath();
    eCtx.moveTo(finX, 0);
    eCtx.lineTo(finX, EDITOR_GROUND_Y);
    eCtx.stroke();

    eCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    eCtx.fillRect(10, 10, 210, 22);
    eCtx.fillStyle = '#ffe600';
    eCtx.font = '800 10px Orbitron, sans-serif';
    eCtx.fillText(`X: ${editorScrollX} | SETAS/A-D: ANDAR`, 16, 25);

    requestAnimationFrame(drawEditorCanvas);
}

// Coordenadas corretas mesmo quando o canvas está reduzido no celular.
function getEditorWorldCoords(pointerEvent) {
    const rect = editorCanvas.getBoundingClientRect();
    const scaleX = editorCanvas.width / Math.max(1, rect.width);
    const scaleY = editorCanvas.height / Math.max(1, rect.height);
    const canvasX = (pointerEvent.clientX - rect.left) * scaleX;
    const canvasY = (pointerEvent.clientY - rect.top) * scaleY;

    let worldX = canvasX + editorScrollX - 80;
    let worldY = canvasY / EDITOR_SCALE_Y;

    if (editorShowGrid) {
        worldX = Math.round(worldX / EDITOR_GRID) * EDITOR_GRID;
        worldY = Math.round(worldY / EDITOR_GRID) * EDITOR_GRID;
    }

    return { x: worldX, y: worldY };
}

// A fase cresce automaticamente quando o usuário continua arrastando.
function expandEditorLevelIfNeeded(worldX) {
    if (worldX < editorDraft.finishX - 240) return;

    const nextFinish = Math.ceil((worldX + 700) / 100) * 100;
    if (nextFinish <= editorDraft.finishX) return;

    editorDraft.finishX = nextFinish;
    const finishInput = document.getElementById('style-finish-x');
    finishInput.max = String(Math.max(Number(finishInput.max) || 7500, nextFinish + 100000));
    finishInput.value = String(nextFinish);
    document.getElementById('style-finish-label').textContent = String(nextFinish);
}

let lastEditorDragPoint = null;

function editAtEditorPointer(pointerEvent) {
    const point = getEditorWorldCoords(pointerEvent);
    expandEditorLevelIfNeeded(point.x);

    if (editorToolMode === 'erase') {
        if (!lastEditorDragPoint) eraseAtWorldCoord(point.x, point.y);
        else {
            const dx = point.x - lastEditorDragPoint.x;
            const dy = point.y - lastEditorDragPoint.y;
            const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / EDITOR_GRID));
            for (let i = 1; i <= steps; i++) {
                eraseAtWorldCoord(
                    lastEditorDragPoint.x + dx * i / steps,
                    lastEditorDragPoint.y + dy * i / steps
                );
            }
        }
    } else if (editorToolMode === 'place' && editorSelectedItem !== 'platform') {
        if (!lastEditorDragPoint) placeSelectedAtWorldCoord(point.x, point.y);
        else {
            const dx = point.x - lastEditorDragPoint.x;
            const dy = point.y - lastEditorDragPoint.y;
            const distance = Math.hypot(dx, dy);
            if (distance >= EDITOR_GRID * 0.65) {
                const steps = Math.max(1, Math.ceil(distance / EDITOR_GRID));
                for (let i = 1; i <= steps; i++) {
                    const x = lastEditorDragPoint.x + dx * (i / steps);
                    const y = lastEditorDragPoint.y + dy * (i / steps);
                    placeSelectedAtWorldCoord(
                        editorShowGrid ? Math.round(x / EDITOR_GRID) * EDITOR_GRID : x,
                        editorShowGrid ? Math.round(y / EDITOR_GRID) * EDITOR_GRID : y
                    );
                }
            }
        }
    }
    lastEditorDragPoint = point;
}

editorCanvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'EDITOR' || e.button > 0) return;
    e.preventDefault();
    lastEditorDragPoint = null;
    editorCanvas.setPointerCapture?.(e.pointerId);

    if (editorToolMode === 'pan') {
        editorPanLastX = e.clientX;
        editorCanvas.style.cursor = 'grabbing';
        return;
    }

    const point = getEditorWorldCoords(e);
    if (editorToolMode === 'place' && editorSelectedItem === 'platform') {
        expandEditorLevelIfNeeded(point.x);
        const x = Math.max(260, Math.min(editorDraft.finishX - 120, point.x));
        const y = Math.min(GROUND_Y - 36, Math.max(CEILING_Y, point.y));
        const platform = { x, y, w: EDITOR_GRID, h: 26 };
        editorDraft.platforms.push(platform);
        editorPlatformDrag = { platform, startX: x };
        lastEditorDragPoint = point;
        return;
    }
    editAtEditorPointer(e);
});

editorCanvas.addEventListener('pointermove', (e) => {
    if (gameState !== 'EDITOR') return;

    if (editorToolMode === 'pan' && editorPanLastX !== null) {
        const rect = editorCanvas.getBoundingClientRect();
        const scaleX = editorCanvas.width / Math.max(1, rect.width);
        const delta = (e.clientX - editorPanLastX) * scaleX;
        editorScrollX = Math.max(0, Math.min(editorDraft.finishX - 120, editorScrollX - delta));
        editorPanLastX = e.clientX;
        return;
    }

    if (editorPlatformDrag) {
        const point = getEditorWorldCoords(e);
        expandEditorLevelIfNeeded(point.x);
        const x = Math.min(editorPlatformDrag.startX, point.x);
        const right = Math.max(editorPlatformDrag.startX + EDITOR_GRID, point.x);
        editorPlatformDrag.platform.x = Math.max(260, x);
        editorPlatformDrag.platform.w = Math.max(EDITOR_GRID, right - x);
        return;
    }

    if (lastEditorDragPoint) editAtEditorPointer(e);
});

function stopEditorPointerDrag() {
    lastEditorDragPoint = null;
    editorPlatformDrag = null;
    editorPanLastX = null;
    if (editorToolMode === 'pan') editorCanvas.style.cursor = 'grab';
}
editorCanvas.addEventListener('pointerup', stopEditorPointerDrag);
editorCanvas.addEventListener('pointercancel', stopEditorPointerDrag);
editorCanvas.addEventListener('lostpointercapture', stopEditorPointerDrag);
editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

// === GARAGEM DE SKINS ===
function renderSkinUI() {
    const btnCanvas = document.getElementById('skin-btn-icon');
    drawCubeSkin(btnCanvas.getContext('2d'), 4, 4, 36, 0, playerSkin);

    const prevCanvas = document.getElementById('skin-preview');
    const pCtx = prevCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 80, 80);
    drawCubeSkin(pCtx, 12, 12, 56, 0, playerSkin);
}

function setupGarage() {
    const modelsDiv = document.getElementById('skin-models');
    const primDiv = document.getElementById('primary-colors');
    const secDiv = document.getElementById('secondary-colors');

    for (let i = 0; i < 4; i++) {
        const opt = document.createElement('div');
        opt.className = 'skin-option' + (playerSkin.model === i ? ' selected' : '');
        const c = document.createElement('canvas');
        c.width = 40;
        c.height = 40;
        drawCubeSkin(c.getContext('2d'), 4, 4, 32, 0, { ...playerSkin, model: i });
        opt.appendChild(c);

        opt.addEventListener('click', () => {
            playerSkin.model = i;
            document.querySelectorAll('.skin-option').forEach(el => el.classList.remove('selected'));
            opt.classList.add('selected');
            renderSkinUI();
            writeSaveData();
        });
        modelsDiv.appendChild(opt);
    }

    COLORS.forEach(color => {
        const sw1 = document.createElement('div');
        sw1.className = 'color-swatch' + (playerSkin.primary === color ? ' selected' : '');
        sw1.style.backgroundColor = color;
        sw1.addEventListener('click', () => {
            playerSkin.primary = color;
            primDiv.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
            sw1.classList.add('selected');
            renderSkinUI();
            writeSaveData();
        });
        primDiv.appendChild(sw1);

        const sw2 = document.createElement('div');
        sw2.className = 'color-swatch' + (playerSkin.secondary === color ? ' selected' : '');
        sw2.style.backgroundColor = color;
        sw2.addEventListener('click', () => {
            playerSkin.secondary = color;
            secDiv.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
            sw2.classList.add('selected');
            renderSkinUI();
            writeSaveData();
        });
        secDiv.appendChild(sw2);
    });

    renderSkinUI();
}

// === SELEÇÃO DE FASES ===
function updateLevelCard() {
    const lvl = LEVELS[currentLevelIndex];
    const best = levelProgress[lvl.name] || 0;
    const attempts = levelAttempts[lvl.name] || 0;

    document.getElementById('level-name').textContent = lvl.name;
    document.getElementById('level-diff-text').textContent = `${lvl.difficulty} • RECORDE: ${best}% • ATT: ${attempts}`;
    document.getElementById('level-stars').textContent = best === 100 ? `★ ${lvl.stars} (COMPLETA)` : `☆ ${lvl.stars}`;

    const face = document.getElementById('level-diff-face');
    const src = DIFFICULTY_FACES[lvl.faceKey] || DIFFICULTY_FACES.azul;
    face.innerHTML = `<img src="${src}" alt="${lvl.difficulty}" onerror="this.style.display='none';">`;
}

// Navegação dos Menus, Editor, Configurações, Prática e Pause
document.getElementById('play-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    mainMenu.classList.add('hidden');
    updateLevelCard();
    levelSelect.classList.remove('hidden');
    gameState = 'LEVEL_SELECT';
});

document.getElementById('editor-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    mainMenu.classList.add('hidden');
    editorHub.classList.remove('hidden');
    gameState = 'EDITOR_HUB';
});

document.getElementById('back-from-editor-hub').addEventListener('click', () => {
    editorHub.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('open-create-editor-btn').addEventListener('click', () => {
    editorHub.classList.add('hidden');
    levelEditor.classList.remove('hidden');
    openEditorWithLevel(null);
});

document.getElementById('open-creations-btn').addEventListener('click', () => {
    editorHub.classList.add('hidden');
    renderCreationsList();
    creationsScreen.classList.remove('hidden');
    gameState = 'CREATIONS';
});

document.getElementById('back-from-creations').addEventListener('click', () => {
    creationsScreen.classList.add('hidden');
    editorHub.classList.remove('hidden');
    gameState = 'EDITOR_HUB';
});

document.getElementById('creations-new-btn').addEventListener('click', () => {
    creationsScreen.classList.add('hidden');
    levelEditor.classList.remove('hidden');
    openEditorWithLevel(null);
});

document.getElementById('editor-exit-btn').addEventListener('click', () => {
    levelEditor.classList.add('hidden');
    renderCreationsList();
    creationsScreen.classList.remove('hidden');
    gameState = 'CREATIONS';
});

document.getElementById('tool-place-btn').addEventListener('click', () => {
    editorToolMode = 'place';
    if (!editorSelectedItem) editorSelectedItem = 'spike';
    renderEditorPalettes();
    syncEditorToolButtons();
});

document.getElementById('tool-erase-btn').addEventListener('click', () => {
    editorToolMode = 'erase';
    editorSelectedItem = null;
    renderEditorPalettes();
    syncEditorToolButtons();
});

document.getElementById('tool-pan-btn').addEventListener('click', () => {
    editorToolMode = 'pan';
    editorSelectedItem = null;
    renderEditorPalettes();
    syncEditorToolButtons();
});

document.getElementById('editor-grid-btn').addEventListener('click', () => {
    editorShowGrid = !editorShowGrid;
    syncEditorToolButtons();
});

document.getElementById('editor-clear-btn').addEventListener('click', () => {
    const fresh = createEmptyEditorDraft();
    fresh.id = editorDraft.id;
    fresh.name = editorDraft.name;
    fresh.difficulty = editorDraft.difficulty;
    editorDraft = fresh;
});

document.getElementById('editor-save-btn').addEventListener('click', () => {
    saveEditorDraftToCreations();
    alert('Fase salva em Criações!');
});

document.getElementById('editor-test-btn').addEventListener('click', () => {
    saveEditorDraftToCreations();
    activePlayableLevel = JSON.parse(JSON.stringify(editorDraft));
    isTestingFromEditor = true;
    levelEditor.classList.add('hidden');
    hud.classList.remove('hidden');
    startAttempt(true);
});

document.querySelectorAll('.editor-tab').forEach(tabEl => {
    tabEl.addEventListener('click', () => {
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');
        const target = tabEl.getAttribute('data-tab');
        document.getElementById('editor-panel-assets').classList.toggle('hidden', target !== 'assets');
        document.getElementById('editor-panel-triggers').classList.toggle('hidden', target !== 'triggers');
        document.getElementById('editor-panel-style').classList.toggle('hidden', target !== 'style');
    });
});

document.getElementById('style-finish-x').addEventListener('input', (e) => {
    document.getElementById('style-finish-label').textContent = e.target.value;
});

document.getElementById('skin-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    mainMenu.classList.add('hidden');
    skinGarage.classList.remove('hidden');
    gameState = 'SKINS';
});

document.getElementById('settings-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    applyPlatformSettingsUI();
    mainMenu.classList.add('hidden');
    settingsScreen.classList.remove('hidden');
    gameState = 'SETTINGS';
});

document.getElementById('back-from-settings').addEventListener('click', () => {
    settingsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('mode-pc-btn').addEventListener('click', () => {
    setPlatformMode('pc');
});

document.getElementById('mode-mobile-btn').addEventListener('click', () => {
    setPlatformMode('mobile');
});

practiceToggleBtn.addEventListener('click', () => {
    setPracticeMode(!isPracticeMode);
});

checkpointBtn.addEventListener('click', () => {
    saveCheckpointAtCurrentState();
});

document.getElementById('back-from-levels').addEventListener('click', () => {
    levelSelect.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('back-from-skins').addEventListener('click', () => {
    skinGarage.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('prev-level').addEventListener('click', () => {
    currentLevelIndex = (currentLevelIndex - 1 + LEVELS.length) % LEVELS.length;
    updateLevelCard();
});

document.getElementById('next-level').addEventListener('click', () => {
    currentLevelIndex = (currentLevelIndex + 1) % LEVELS.length;
    updateLevelCard();
});

document.getElementById('level-card').addEventListener('click', () => {
    activePlayableLevel = LEVELS[currentLevelIndex];
    isTestingFromEditor = false;
    levelSelect.classList.add('hidden');
    hud.classList.remove('hidden');
    startAttempt(true);
});

pauseMenuBtn.addEventListener('click', () => {
    pauseCurrentGame();
});

document.getElementById('resume-btn').addEventListener('click', () => {
    resumeCurrentGame();
});

document.getElementById('pause-restart-btn').addEventListener('click', () => {
    pauseScreen.classList.add('hidden');
    startAttempt(true);
});

document.getElementById('pause-exit-menu-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    recordBestProgress(activePlayableLevel.name, currentRunPercent);
    pauseScreen.classList.add('hidden');
    hud.classList.add('hidden');

    if (isTestingFromEditor) {
        isTestingFromEditor = false;
        levelEditor.classList.remove('hidden');
        openEditorWithLevel(editorDraft);
    } else {
        mainMenu.classList.remove('hidden');
        gameState = 'MENU';
    }
});

document.getElementById('replay-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    startAttempt(true);
});

document.getElementById('win-menu-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    if (isTestingFromEditor) {
        isTestingFromEditor = false;
        levelEditor.classList.remove('hidden');
        openEditorWithLevel(editorDraft);
    } else {
        updateLevelCard();
        mainMenu.classList.remove('hidden');
        gameState = 'MENU';
    }
});

// Controles de Pulo/Voo, Editor e Pause
window.addEventListener('keydown', (e) => {
    if (gameState === 'EDITOR') {
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            editorScrollX = Math.min(Math.max(0, editorDraft.finishX - 400), editorScrollX + 60);
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            editorScrollX = Math.max(0, editorScrollX - 60);
        }
        return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'PAUSED') resumeCurrentGame();
        else pauseCurrentGame();
        return;
    }
    if (gameState === 'PLAYING' && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        if (!isHoldingJump) jumpJustPressed = true;
        isHoldingJump = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        isHoldingJump = false;
    }
});

canvas.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        jumpJustPressed = true;
        isHoldingJump = true;
    }
});
window.addEventListener('mouseup', () => { isHoldingJump = false; });

canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        e.preventDefault();
        jumpJustPressed = true;
        isHoldingJump = true;
        if (controlPlatform === 'mobile') {
            startHoldPauseTimer();
        }
    }
}, { passive: false });

function cancelMobileTouch() {
    isHoldingJump = false;
    clearHoldPauseTimer();
}

window.addEventListener('touchend', cancelMobileTouch);
window.addEventListener('touchcancel', cancelMobileTouch);

// Inicializa
applyPlatformSettingsUI();
setupMobileUiDrag();
updatePracticeUI();
setupGarage();
loop();
