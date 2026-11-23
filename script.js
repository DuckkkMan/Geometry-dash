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

// Estados do jogo
let gameState = 'MENU';
let stateBeforePause = 'PLAYING';
let isTestingFromEditor = false;
let deadRemainingMs = 0;
let deadStartedAt = 0;

// Modo do jogador ('cube' | 'ship' | ...)
let playerMode = 'cube';

// Modo Prática e Checkpoints
let isPracticeMode = false;
let checkpoints = [];
let activeCheckpoint = null;
let lastAutoCheckpointDist = -9999;
const AUTO_CHECKPOINT_STEP = 550;

// Timer para segurar 5 segundos no toque e ir para o pause

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

// Demonstração automática do menu: não altera o estado real da fase.
let menuDemoScroll = 0;
let menuDemoY = GROUND_Y - BLOCK_SIZE;
let menuDemoDy = 0;
let menuDemoRotation = 0;
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

// Entidades ativas da fase em execução
let activeSpikes = [];
let activePlatforms = [];
let activeBlocks = [];
let activePads = [];
let activeOrbs = [];
let activeSaws = [];
let activePillars = [];
let activeDecorations = [];
let activeCoins = [];
let activeTriggers = [];
let activePortals = [];

// === ÁUDIO SINTÉTICO ===
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
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
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
    } catch (_) {}
}

// === ROSTOS DE DIFICULDADE ===
/* Todos os rostos usam o mesmo desenho vetorial, gerado por código.
   Só mudam a cor e a expressão de cada dificuldade. */
function makeDifficultyFace(color, expression, horns = false) {
    const mouth = expression === 'happy'
        ? '<path d="M34 59 Q50 78 66 59" fill="none" stroke="#17121d" stroke-width="6" stroke-linecap="round"/>'
        : expression === 'flat'
            ? '<path d="M36 64 H64" fill="none" stroke="#17121d" stroke-width="6" stroke-linecap="round"/>'
            : '<path d="M35 68 Q50 54 65 68" fill="none" stroke="#17121d" stroke-width="6" stroke-linecap="round"/><path d="M27 38 L42 43 M73 38 L58 43" fill="none" stroke="#17121d" stroke-width="5" stroke-linecap="round"/>';
    const hornShape = horns
        ? '<path d="M20 28 Q5 5 5 1 Q27 7 34 22 M80 28 Q95 5 95 1 Q73 7 66 22" fill="#f1d9ff" stroke="#24142e" stroke-width="4" stroke-linejoin="round"/>'
        : '';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        hornShape +
        '<rect x="9" y="13" width="82" height="78" rx="19" fill="' + color + '" stroke="#17121d" stroke-width="6"/>' +
        '<path d="M17 26 Q50 8 83 26" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="35" cy="45" r="6" fill="#17121d"/><circle cx="65" cy="45" r="6" fill="#17121d"/>' +
        mouth + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const DIFFICULTY_FACES = {
    azul: makeDifficultyFace('#168cff', 'happy'),
    verde: makeDifficultyFace('#35c96b', 'happy'),
    amarelo: makeDifficultyFace('#ffd43b', 'flat'),
    vermelho: makeDifficultyFace('#f04444', 'angry'),
    roxo: makeDifficultyFace('#9b59d0', 'angry', true)
};

// === IMAGENS DOS PORTAIS ===
const PORTAL_IMAGES = {
    cube: new Image(),
    ship: new Image()
};
PORTAL_IMAGES.cube.src = 'Assets/Portal Cubo.png';
PORTAL_IMAGES.ship.src = 'Assets/Portal Ship.png';

// === SAVE LOCAL ===
const STORAGE_KEY = 'gd_web_save_v07';

function loadSaveData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        }
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
const storedSkin = savedData.skin && typeof savedData.skin === 'object' ? savedData.skin : {};
const isValidHexColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
let playerSkin = {
    model: Number.isInteger(Number(storedSkin.model)) ? Math.max(0, Math.min(7, Number(storedSkin.model))) : 0,
    primary: isValidHexColor(storedSkin.primary) ? storedSkin.primary : '#ffde00',
    secondary: isValidHexColor(storedSkin.secondary) ? storedSkin.secondary : '#00e5ff'
};
const isSaveRecord = value => value && typeof value === 'object' && !Array.isArray(value);
let levelProgress = isSaveRecord(savedData.progress) ? savedData.progress : {};
let levelAttempts = isSaveRecord(savedData.attempts) ? savedData.attempts : {};
let customLevels = Array.isArray(savedData.customLevels) ? savedData.customLevels : [];

const COLORS = ['#ffde00', '#7fff00', '#00e5ff', '#ff0055', '#ff7b00', '#b5179e', '#ffffff'];

// Fases oficiais
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
        blocks: [],
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
        blocks: [],
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
LEVELS.push({name:'Triple Spike',difficulty:'EASY',stars:1,faceKey:'azul',bgTop:'#063b91',bgBottom:'#1684e8',groundFill:'#05285d',groundGrid:'#1765bd',finishX:3100,
spikes:[760,804,848,1420,1464,1508,2180,2224,2268].map(x=>({x,sizeType:'normal'})),platforms:[{x:1080,y:GROUND_Y-60,w:132,h:28},{x:1800,y:GROUND_Y-80,w:132,h:28}],blocks:[],pads:[{x:1120,color:'yellow',cooldown:0}],orbs:[{x:1900,y:GROUND_Y-120,color:'yellow',used:false}],saws:[],pillars:[],coins:[{x:1980,y:GROUND_Y-155,collected:false}],triggers:[],portals:[]});
const surprisePick=a=>a[Math.floor(Math.random()*a.length)],surpriseSpikes=[];for(let i=0;i<10;i++){const x=650+i*330;for(let j=0,n=surprisePick([1,2,3]);j<n;j++)surpriseSpikes.push({x:x+j*44,sizeType:surprisePick(['normal','mini'])});}
LEVELS.push({name:'??? Surprise ???',difficulty:'HARD',stars:3,faceKey:'azul',bgTop:'#160b35',bgBottom:'#6d28d9',groundFill:'#100a24',groundGrid:'#9333ea',finishX:4200,spikes:surpriseSpikes,platforms:[{x:980,y:GROUND_Y-70,w:132,h:28},{x:2460,y:GROUND_Y-115,w:150,h:28}],blocks:[],pads:[{x:1320,color:'pink',cooldown:0}],orbs:[{x:1760,y:GROUND_Y-130,color:'pink',used:false}],saws:[{x:2110,y:GROUND_Y-80,r:22,angle:0}],pillars:[],coins:[{x:2800,y:GROUND_Y-150,collected:false}],triggers:[{x:1120,kind:'speed_custom',speed:surprisePick([.75,1.25,1.5,2]),triggered:false},{x:1940,kind:'bg_custom',bgTop:'#09203f',bgBottom:'#00a6a6',triggered:false},{x:3000,kind:'shake_custom',shakeAmount:surprisePick([5,10,16]),triggered:false}],portals:[{x:3480,type:'ship',triggered:false},{x:3780,type:'cube',triggered:false}]});
let activePlayableLevel = LEVELS[0];
let currentLevelIndex = 0;

function applyPlatformSettingsUI() {
    lowPerformanceMode = controlPlatform === 'mobile';
    const lowHint = document.getElementById('low-performance-status');
    if (lowHint) {
        lowHint.textContent = lowPerformanceMode
            ? 'ATIVADO — efeitos reduzidos para melhorar o desempenho.'
            : 'Desativado no modo PC.';
    }
    const pcBtn = document.getElementById('mode-pc-btn');
    const mobileBtn = document.getElementById('mode-mobile-btn');
    const hint = document.getElementById('platform-hint');

    if (controlPlatform === 'mobile') {
        pcBtn.classList.remove('selected');
        mobileBtn.classList.add('selected');
        pauseMenuBtn.classList.remove('hidden');
        gameContainer.classList.add('mobile-ui-drag');
        gameContainer.classList.add('mobile-game-scale');
        hint.textContent = 'Modo Celular: toque para pular/voar. Use o botão II para pausar.';
    } else {
        controlPlatform = 'pc';
        mobileBtn.classList.remove('selected');
        pcBtn.classList.add('selected');
        pauseMenuBtn.classList.remove('hidden');
        gameContainer.classList.remove('mobile-ui-drag');
        gameContainer.classList.remove('mobile-game-scale');
        hint.textContent = 'Modo PC: clique/espaço para pular/voar e botão II para pausar.';
    }
}

function setPlatformMode(mode) {
    controlPlatform = mode === 'mobile' ? 'mobile' : 'pc';
    applyPlatformSettingsUI();
    writeSaveData();
}

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

function spawnEndParticles(x, y, count = 16, soft = false) {
    const maxParticles = lowPerformanceMode ? Math.min(count, 6) : count;
    for (let i = 0; i < maxParticles; i++) {
        const angle = (Math.PI * 2 * i) / maxParticles + Math.random() * 0.4;
        const speed = (soft ? 1.8 : 3.2) + Math.random() * 4.5;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            size: 4 + Math.random() * 5,
            alpha: 1,
            color: i % 2 === 0 ? playerSkin.primary : playerSkin.secondary
        });
    }
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

// === PORTAIS ===
function drawPortal(portal, screenX) {
    if (screenX + PORTAL_WIDTH < -70 || screenX > canvas.width + 70) return;

    const isCubePortal = portal.type === 'cube';
    const img = isCubePortal ? PORTAL_IMAGES.cube : PORTAL_IMAGES.ship;
    const drawY = (Number.isFinite(Number(portal.y)) ? Number(portal.y) : GROUND_Y - PORTAL_HEIGHT / 2) - PORTAL_HEIGHT / 2;

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

    const portalCenterY = Number.isFinite(Number(portal.y)) ? Number(portal.y) : GROUND_Y - PORTAL_HEIGHT / 2;
    const portalTop = portalCenterY - PORTAL_HEIGHT / 2;
    const portalBottom = portalCenterY + PORTAL_HEIGHT / 2;

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

// === PADS DE PULO ===
function drawPad(pad, screenX) {
    const w = 36;
    const h = 11;
    const y = GROUND_Y - h;
    if (screenX + w < -40 || screenX > canvas.width + 40) return;

    const isPink = pad.color === 'pink';
    const mainColor = pad.colorOverride || (isPink ? '#ff4fd8' : '#ffe600');
    const glowColor = pad.colorOverride || (isPink ? 'rgba(255, 79, 216, 0.35)' : 'rgba(255, 230, 0, 0.35)');

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

// === ORBS DE PULO ===
function drawOrb(orb, screenX) {
    const radius = 17;
    if (screenX + radius * 2 < -40 || screenX - radius * 2 > canvas.width + 40) return;

    const isPink = orb.color === 'pink';
    const outerColor = orb.colorOverride || (isPink ? '#ff4fd8' : '#ffe600');
    const innerColor = orb.colorOverride || (isPink ? '#ffd1f5' : '#fff8b8');

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

// === PLATAFORMAS E BLOCOS ===
function drawPlatform(plat, screenX) {
    const w = plat.w || BLOCK_SIZE;
    const h = plat.h || 28;
    const y = plat.y !== undefined ? plat.y : GROUND_Y - BLOCK_SIZE;
    if (screenX + w < -60 || screenX > canvas.width + 60) return;

    ctx.save();
    ctx.fillStyle = plat.colorOverride || '#18376b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.fillRect(screenX, y, w, h);
    ctx.strokeRect(screenX, y, w, h);

    ctx.strokeStyle = plat.colorOverride || '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 3, y + 3, Math.max(0, w - 6), Math.max(0, h - 6));
    ctx.restore();
}

function handlePlatformCollision(p, plat, screenX) {
    const w = plat.w || BLOCK_SIZE;
    const h = plat.h || 28;
    const y = plat.y !== undefined ? plat.y : GROUND_Y - BLOCK_SIZE;

    const prevBottom = p.prevY + p.size;
    const currBottom = p.y + p.size;
    const horizOverlap = p.x + p.size - 5 > screenX && p.x + 5 < screenX + w;

    if (!horizOverlap) return false;

    if (p.dy >= 0 && prevBottom <= y + 10 && currBottom >= y) {
        p.y = y - p.size;
        p.dy = 0;
        p.grounded = true;
        if (playerMode === 'cube') {
            p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
        }
        return false;
    }

    const vertOverlap = p.y + p.size - 6 > y && p.y + 6 < y + h;
    if (vertOverlap && p.x + p.size > screenX + 4 && p.x < screenX + w - 4) {
        triggerDeath();
        return true;
    }

    return false;
}

// === ESPINHOS, SERRAS, PILARES, MOEDAS E TRIGGERS ===
function drawSpike(spike, screenX) {
    const isMini = spike.sizeType === 'mini';
    const w = isMini ? MINI_SPIKE_W : BLOCK_SIZE;
    const h = isMini ? MINI_SPIKE_H : BLOCK_SIZE;
    if (screenX + w < -50 || screenX > canvas.width + 50) return;

    const inverted = Boolean(spike.inverted);
    const defaultBaseY = inverted ? CEILING_Y : GROUND_Y;
    const baseY = Number.isFinite(Number(spike.y)) ? Number(spike.y) : defaultBaseY;
    const tipY = inverted ? baseY + h : baseY - h;

    ctx.save();
    ctx.fillStyle = spike.colorOverride || '#ff3b5c';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + 3, baseY);
    ctx.lineTo(screenX + w / 2, tipY);
    ctx.lineTo(screenX + w - 3, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function checkSpikeCollision(p, spike, screenX) {
    const isMini = spike.sizeType === 'mini';
    const w = isMini ? MINI_SPIKE_W : BLOCK_SIZE;
    const h = isMini ? MINI_SPIKE_H : BLOCK_SIZE;
    const inverted = Boolean(spike.inverted);
    const defaultBaseY = inverted ? CEILING_Y : GROUND_Y;
    const baseY = Number.isFinite(Number(spike.y)) ? Number(spike.y) : defaultBaseY;
    const tipY = inverted ? baseY + h : baseY - h;

    const left = screenX + 9;
    const right = screenX + w - 9;
    const top = Math.min(baseY, tipY) + 7;
    const bottom = Math.max(baseY, tipY) - 4;

    return p.x + p.size - 6 > left && p.x + 6 < right && p.y + p.size - 5 > top && p.y + 5 < bottom;
}

function drawSaw(saw, screenX) {
    const r = saw.r || 22;
    if (screenX + r * 2 < -50 || screenX - r * 2 > canvas.width + 50) return;

    ctx.save();
    ctx.translate(screenX, saw.y);
    ctx.rotate(saw.angle || 0);

    const teeth = 10;
    ctx.fillStyle = saw.colorOverride || '#334155';
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

    ctx.fillStyle = saw.colorOverride || '#ff0055';
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


function drawLevelDecoration(item, screenX) {
    const y = Number.isFinite(Number(item.y)) ? Number(item.y) : GROUND_Y - 45;
    const scale = Math.max(0.1, Math.min(5, Number(item.scale) || 1));
    const r = 16 * scale;
    if (screenX < -r - 20 || screenX > canvas.width + r + 20 || y < -r - 20 || y > canvas.height + r + 20) return;
    const parts = String(item.kind || '').split('_');
    const family = parts[1] || 'diamond';
    const variant = Math.max(0, (parseInt(parts[2], 10) || 1) - 1);
    ctx.save();
    ctx.translate(screenX, y);
    ctx.rotate((Number(item.rotation) || 0) + (variant % 5) * Math.PI / 10);
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#06101e';
    ctx.fillStyle = item.color || '#7dd3fc';
    ctx.shadowColor = item.color || '#7dd3fc';
    ctx.shadowBlur = lowPerformanceMode ? 2 : Math.max(3, r * 0.22);
    const poly = points => {
        ctx.beginPath();
        ctx.moveTo(points[0][0] * r, points[0][1] * r);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * r, points[i][1] * r);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    if (item.kind === 'half_block') {
        poly([[-.82,.05],[.82,.05],[.82,.82],[-.82,.82]]);
    } else if (item.kind === 'slope') {
        poly([[-.86,.78],[.86,.78],[.86,-.78]]);
    } else if (item.kind === 'double_block') {
        poly([[-.92,-.72],[-.08,-.72],[-.08,.72],[-.92,.72]]);
        poly([[.08,-.72],[.92,-.72],[.92,.72],[.08,.72]]);
    } else if (item.kind === 'outlined_block') {
        ctx.shadowBlur = 0;
        ctx.strokeRect(-r*.78,-r*.78,r*1.56,r*1.56);
        ctx.strokeRect(-r*.48,-r*.48,r*.96,r*.96);
    } else if (family === 'star') {
        const count = 5 + variant % 4, pts = [];
        for (let i = 0; i < count * 2; i++) {
            const a = -Math.PI / 2 + i * Math.PI / count, d = i % 2 ? .48 : 1;
            pts.push([Math.cos(a) * d, Math.sin(a) * d]);
        }
        poly(pts);
    } else if (family === 'shard') {
        poly([[-.18,-1],[.72,-.28],[.22,1],[-.7,.25]]);
    } else if (family === 'ring' || family === 'orb') {
        ctx.beginPath(); ctx.arc(0,0,r*(family === 'ring' ? .72 : .56),0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,r*(family === 'ring' ? .4 : .24),0,Math.PI*2);
        if (family === 'orb') { ctx.fill(); ctx.stroke(); } else ctx.stroke();
    } else if (family === 'arrow') {
        poly([[-1,-.28],[.18,-.28],[.18,-.72],[1,0],[.18,.72],[.18,.28],[-1,.28]]);
    } else if (family === 'chevron') {
        poly([[-.85,-.7],[-.48,-1],[.5,0],[-.48,1],[-.85,.7],[.28,0]]);
    } else if (family === 'bolt') {
        poly([[-.1,-1],[.72,-.16],[.18,-.08],[.36,1],[-.72,.12],[-.16,.08]]);
    } else if (family === 'hex') {
        const count = 6 + (variant % 3) * 2, pts = [];
        for (let i=0;i<count;i++){const a=-Math.PI/2+i*Math.PI*2/count;pts.push([Math.cos(a)*.86,Math.sin(a)*.86]);}
        poly(pts);
    } else if (family === 'cross') {
        const w=.28+(variant%3)*.08;
        poly([[-w,-1],[w,-1],[w,-w],[1,-w],[1,w],[w,w],[w,1],[-w,1],[-w,w],[-1,w],[-1,-w],[-w,-w]]);
    } else if (family === 'gear') {
        const pts=[]; for(let i=0;i<24;i++){const a=i*Math.PI/12,d=i%3===0?.98:(i%3===1?.82:.72);pts.push([Math.cos(a)*d,Math.sin(a)*d]);}
        poly(pts); ctx.shadowBlur=0; ctx.fillStyle='#06101e'; ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fill();
    } else {
        poly([[-.75,-.75],[.75,-.75],[.75,.75],[-.75,.75]]);
    }
    ctx.restore();
}

function drawPillar(pillar, screenX) {
    const w = pillar.w || 34;
    const h = pillar.h || 90;
    if (screenX + w < -50 || screenX > canvas.width + 50) return;

    ctx.save();
    ctx.fillStyle = pillar.colorOverride || 'rgba(255, 255, 255, 0.14)';
    ctx.strokeStyle = pillar.colorOverride || 'rgba(255, 255, 255, 0.32)';
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
    ctx.fillStyle = coin.colorOverride || '#ffd60a';
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
        speed_slow: '0.75x',
        speed_normal: '1.0x',
        bg: 'COLOR',
        bg_cyan: 'CYAN',
        shake: 'SHAKE',
        low_grav: 'LOW G',
        high_grav: 'HIGH G',
        norm_grav: 'NORM G', speed_custom:'CUSTOM', move:'MOVE', color:'COLOR', bg_custom:'BG', shake_custom:'SHAKE', rotate:'ROTATE', pulse:'PULSE'
    };
    ctx.save();
    const color = trig.kind.indexOf('speed') === 0 ? '#00e5ff' : trig.kind.indexOf('bg') === 0 ? '#c084fc' : trig.kind.indexOf('grav') >= 0 ? '#ffe066' : '#fb7185';
    const top = Number.isFinite(Number(trig.y)) ? Number(trig.y) : GROUND_Y - 112;
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '22';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(screenX, top, 30, 112);
    ctx.fillRect(screenX, top, 30, 112);
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(screenX + 15, top + 8);
    ctx.lineTo(screenX + 22, top + 18);
    ctx.lineTo(screenX + 15, top + 28);
    ctx.lineTo(screenX + 8, top + 18);
    ctx.closePath();
    ctx.fill();
    ctx.font = '900 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelMap[trig.kind] || 'TRG', screenX + 15, top - 7);
    ctx.restore();
}

function checkTriggerActivation(p, trig, screenX) {
    if (trig.triggered) return;
    if (p.x + p.size >= screenX) {
        trig.triggered = true;
        if(trig.kind==='speed_fast')currentGameSpeed=BASE_GAME_SPEED*1.25;
        else if(trig.kind==='speed_slow')currentGameSpeed=BASE_GAME_SPEED*.75;
        else if(trig.kind==='speed_normal')currentGameSpeed=BASE_GAME_SPEED;
        else if(trig.kind==='speed_custom')currentGameSpeed=BASE_GAME_SPEED*Math.max(.25,Math.min(3,Number(trig.speed)||1));
        else if(['bg','bg_cyan','bg_custom'].includes(trig.kind)){runtimeBgTop=trig.bgTop||(trig.kind==='bg_cyan'?'#083344':'#311042');runtimeBgBottom=trig.bgBottom||(trig.kind==='bg_cyan'?'#0891b2':'#7209b7');}
        else if(trig.kind==='shake'||trig.kind==='shake_custom')screenShake=Math.max(1,Math.min(30,Number(trig.shakeAmount)||12));
        else if(trig.kind==='low_grav')gravityMultiplier=.65;
        else if(trig.kind==='high_grav')gravityMultiplier=1.35;
        else if(trig.kind==='norm_grav')gravityMultiplier=1;
        else if(['move','color','rotate','pulse'].includes(trig.kind)){const gid=String(trig.groupId||'1');[activeBlocks,activePlatforms,activeSpikes,activePads,activeOrbs,activeSaws,activePillars,activeCoins,activePortals,activeDecorations].forEach(list=>list.forEach(obj=>{const gs=Array.isArray(obj.groups)?obj.groups.map(String):(obj.group!==undefined?[String(obj.group)]:[]);if(!gs.includes(gid))return;if(trig.kind==='move'){obj.x=(Number(obj.x)||0)+Math.max(-100,Math.min(100,Number(trig.moveX)||0))*BLOCK_SIZE;if(Number.isFinite(Number(obj.y)))obj.y+=Math.max(-100,Math.min(100,Number(trig.moveY)||0))*BLOCK_SIZE;}else if(trig.kind==='color')obj.colorOverride=trig.color||'#ff4fd8';else if(trig.kind==='rotate')obj.rotation=(Number(obj.rotation)||0)+(Number(trig.rotateAmount)||45)*Math.PI/180;else obj.scale=Math.max(.2,Math.min(3,Number(trig.pulseAmount)||1.25));}));}
    }
}

// Cubo base
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
    targetCtx.fillRect(-13, -12, 9, 9);
    targetCtx.strokeRect(-13, -12, 9, 9);
    targetCtx.fillRect(4, -12, 9, 9);
    targetCtx.strokeRect(4, -12, 9, 9);
    targetCtx.fillRect(-13, 4, 26, 8);
    targetCtx.strokeRect(-13, 4, 26, 8);

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
            spawnEndParticles(this.x + this.size / 2, this.y + this.size, 6, true);
        }
    },

    draw() {
        drawCubeSkin(ctx, this.x, this.y, this.size, this.rotation, playerSkin);
    }
};

// === CONTROLE DE TELAS E FLUXO DE JOGO ===
function hideAllOverlays() {
    [
        mainMenu, editorHub, creationsScreen, levelEditor,
        settingsScreen, levelSelect, skinGarage, pauseScreen, winScreen
    ].forEach(el => el && el.classList.add('hidden'));
}

function showOverlay(overlayEl, nextState) {

    hideAllOverlays();
    hud.classList.add('hidden');
    if (overlayEl) overlayEl.classList.remove('hidden');
    if (nextState) gameState = nextState;
}

function cloneLevelEntities(lvl) {
    activeSpikes = (lvl.spikes || []).map(o => ({ ...o }));
    activePlatforms = (lvl.platforms || []).map(o => ({ ...o }));
    activeBlocks = (lvl.blocks || []).map(o => ({ ...o }));
    activePads = (lvl.pads || []).map(o => ({ ...o, cooldown: 0 }));
    activeOrbs = (lvl.orbs || []).map(o => ({ ...o, used: false }));
    activeSaws = (lvl.saws || []).map(o => ({ ...o, angle: o.angle || 0 }));
    activePillars = (lvl.pillars || []).map(o => ({ ...o }));
    activeDecorations = (lvl.decorations || []).map(o => ({ ...o }));
    activeCoins = (lvl.coins || []).map(o => ({ ...o, collected: false }));
    activeTriggers = (lvl.triggers || []).map(o => ({ ...o, triggered: false }));
    activePortals = (lvl.portals || []).map(o => ({ ...o, triggered: false }));
}

function startLevel(lvl, fromEditor = false) {
    clearRespawnTimer();

    hideAllOverlays();
    hud.classList.remove('hidden');
    isTestingFromEditor = Boolean(fromEditor);
    activePlayableLevel = lvl || LEVELS[0];
    cloneLevelEntities(activePlayableLevel);
    updatePracticeUI();
    startAttempt(true);
}

function startAttempt(countNewAttempt = true) {
    clearRespawnTimer();
    particles = [];
    winFlashAlpha = 0;
    screenShake = 0;
    currentGameSpeed = BASE_GAME_SPEED * (activePlayableLevel.initialSpeed || 1);
    gravityMultiplier = 1;
    runtimeBgTop = null;
    runtimeBgBottom = null;
    runtimeGroundFill = null;
    runtimeGroundGrid = null;

    if (countNewAttempt) {
        incrementAttempt(activePlayableLevel.name);
        renderLevelSelect();
    }

    if (isPracticeMode && activeCheckpoint) {
        levelDistance = activeCheckpoint.levelDistance;
        player.reset();
        player.y = activeCheckpoint.playerY;
        player.prevY = activeCheckpoint.playerY;
        player.dy = activeCheckpoint.playerDy;
        player.rotation = activeCheckpoint.playerRotation;
        player.grounded = activeCheckpoint.playerGrounded;
        playerMode = activeCheckpoint.playerMode || activePlayableLevel.initialMode || 'cube';
        currentGameSpeed = activeCheckpoint.currentGameSpeed || BASE_GAME_SPEED;
        gravityMultiplier = activeCheckpoint.gravityMultiplier || 1;
        runtimeBgTop = activeCheckpoint.runtimeBgTop || null;
        runtimeBgBottom = activeCheckpoint.runtimeBgBottom || null;
        runtimeGroundFill = activeCheckpoint.runtimeGroundFill || null;
        runtimeGroundGrid = activeCheckpoint.runtimeGroundGrid || null;

        activePortals.forEach((pt, i) => { pt.triggered = Boolean(activeCheckpoint.portalsTriggered?.[i]); });
        activeOrbs.forEach((o, i) => { o.used = Boolean(activeCheckpoint.orbsUsed?.[i]); });
        activeCoins.forEach((c, i) => { c.collected = Boolean(activeCheckpoint.coinsCollected?.[i]); });
        activeTriggers.forEach((t, i) => { t.triggered = Boolean(activeCheckpoint.triggersFired?.[i]); });
    } else {
        levelDistance = 0;
        lastAutoCheckpointDist = -9999;
        playerMode = activePlayableLevel.initialMode || 'cube';
        player.reset();
        cloneLevelEntities(activePlayableLevel);
    }

    gameState = 'PLAYING';
}

function triggerDeath() {
    if (gameState !== 'PLAYING') return;
    gameState = 'DEAD';
    isHoldingJump = false;

    screenShake = 10;
    playSfx('death');
    spawnEndParticles(player.x + player.size / 2, player.y + player.size / 2, 22, false);

    const finishX = activePlayableLevel.finishX || 3400;
    const pct = (levelDistance / Math.max(1, finishX)) * 100;
    recordBestProgress(activePlayableLevel.name, pct);

    scheduleRespawn(RESPAWN_DELAY_MS);
}

function triggerWin() {
    if (gameState !== 'PLAYING') return;
    gameState = 'WIN';
    isHoldingJump = false;

    winFlashAlpha = 0.85;
    recordBestProgress(activePlayableLevel.name, 100);
    spawnEndParticles(player.x + player.size / 2, player.y + player.size / 2, 30, false);
    document.getElementById('win-level-name').textContent = `${activePlayableLevel.name} • 100%`;
    winScreen.classList.remove('hidden');
}

function pauseCurrentGame() {
    if (gameState !== 'PLAYING' && gameState !== 'DEAD') return;
    stateBeforePause = gameState;
    if (gameState === 'DEAD' && respawnTimer) {
        clearTimeout(respawnTimer);
        respawnTimer = null;
        deadRemainingMs = Math.max(150, RESPAWN_DELAY_MS - (Date.now() - deadStartedAt));
    }
    gameState = 'PAUSED';
    isHoldingJump = false;

    document.getElementById('pause-level-name').textContent = activePlayableLevel.name;
    pauseScreen.classList.remove('hidden');
}

function resumeCurrentGame() {
    if (gameState !== 'PAUSED') return;
    pauseScreen.classList.add('hidden');
    if (stateBeforePause === 'DEAD') {
        gameState = 'DEAD';
        scheduleRespawn(deadRemainingMs || RESPAWN_DELAY_MS);
    } else {
        gameState = 'PLAYING';
    }
}

// === RENDERIZAÇÃO DO MUNDO DO JOGO ===
function drawBackgroundAndGround() {
    const bgTop = runtimeBgTop || activePlayableLevel.bgTop || '#0038a8';
    const bgBottom = runtimeBgBottom || activePlayableLevel.bgBottom || '#0066ff';
    const groundFill = runtimeGroundFill || activePlayableLevel.groundFill || '#001d5c';
    const groundGrid = runtimeGroundGrid || activePlayableLevel.groundGrid || '#0044cc';

    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    // Linhas decorativas no fundo
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    const stepBg = 120;
    const offsetBg = -(bgScroll % stepBg);
    for (let x = offsetBg; x < canvas.width; x += stepBg) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
    }
    ctx.restore();

    // O teto escurecido só aparece durante uma fase no modo Ship.
    const inGameplay = ['PLAYING', 'DEAD', 'PAUSED', 'WIN'].includes(gameState);
    if (inGameplay && playerMode === 'ship') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvas.width, CEILING_Y);
    }

    // Chão
    ctx.fillStyle = groundFill;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    ctx.save();
    ctx.strokeStyle = groundGrid;
    ctx.lineWidth = 2;
    const offsetG = -(groundScroll % BLOCK_SIZE);
    for (let x = offsetG; x < canvas.width; x += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = GROUND_Y; y < canvas.height; y += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, GROUND_Y - 2, canvas.width, 4);
}

function drawLevelElementsInWorld() {
    const camOffset = levelDistance - player.x;

    activePillars.forEach(pil => drawPillar(pil, pil.x - camOffset));
    activeDecorations.forEach(item => drawLevelDecoration(item, item.x - camOffset));
    activePlatforms.forEach(plat => drawPlatform(plat, plat.x - camOffset));
    activeBlocks.forEach(blk => drawPlatform(blk, blk.x - camOffset));
    activePads.forEach(pad => drawPad(pad, pad.x - camOffset));
    activeOrbs.forEach(orb => drawOrb(orb, orb.x - camOffset));
    activeSpikes.forEach(spk => drawSpike(spk, spk.x - camOffset));
    activeSaws.forEach(saw => drawSaw(saw, saw.x - camOffset));
    activeCoins.forEach(coin => drawCoin(coin, coin.x - camOffset));
    activePortals.forEach(pt => drawPortal(pt, pt.x - camOffset));
    if (gameState !== 'PLAYING') {
        activeTriggers.forEach(trg => drawTriggerMarker(trg, trg.x - camOffset));
    }

    // Linha de chegada
    const finishScreenX = (activePlayableLevel.finishX || 3400) - camOffset;
    if (finishScreenX >= -40 && finishScreenX <= canvas.width + 40) {
        ctx.save();
        ctx.strokeStyle = '#9dff00';
        ctx.lineWidth = 5;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(finishScreenX, CEILING_Y);
        ctx.lineTo(finishScreenX, GROUND_Y);
        ctx.stroke();
        ctx.restore();
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.25;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.restore();
    }
}

function updateGameplay() {
    if (gameState !== 'PLAYING') return;

    levelDistance += currentGameSpeed;
    bgScroll += currentGameSpeed * 0.35;
    groundScroll += currentGameSpeed;

    if (isPracticeMode && levelDistance - lastAutoCheckpointDist >= AUTO_CHECKPOINT_STEP) {
        lastAutoCheckpointDist = levelDistance;
        saveCheckpointAtCurrentState();
    }

    player.update();

    const camOffset = levelDistance - player.x;

    // Triggers
    for (const trg of activeTriggers) {
        checkTriggerActivation(player, trg, trg.x - camOffset);
    }

    // Portais
    for (const pt of activePortals) {
        checkPortalTrigger(player, pt, pt.x - camOffset);
    }

    // Pads
    for (const pad of activePads) {
        checkPadCollision(player, pad, pad.x - camOffset);
    }

    // Orbs
    for (const orb of activeOrbs) {
        checkOrbTrigger(player, orb, orb.x - camOffset);
    }

    // Moedas
    for (const coin of activeCoins) {
        checkCoinTrigger(player, coin, coin.x - camOffset);
    }

    // Plataformas e blocos sólidos
    for (const plat of activePlatforms) {
        if (handlePlatformCollision(player, plat, plat.x - camOffset)) return;
    }
    for (const blk of activeBlocks) {
        if (handlePlatformCollision(player, blk, blk.x - camOffset)) return;
    }

    // Espinhos
    for (const spk of activeSpikes) {
        if (checkSpikeCollision(player, spk, spk.x - camOffset)) {
            triggerDeath();
            return;
        }
    }

    // Serras
    for (const saw of activeSaws) {
        saw.angle = (saw.angle || 0) + 0.16;
        if (checkSawCollision(player, saw, saw.x - camOffset)) {
            triggerDeath();
            return;
        }
    }

    // Progresso HUD
    const finishX = activePlayableLevel.finishX || 3400;
    const pct = Math.min(100, Math.max(0, Math.floor((levelDistance / Math.max(1, finishX)) * 100)));
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;
    recordBestProgress(activePlayableLevel.name, pct);

    if (levelDistance >= finishX) {
        triggerWin();
    }
}

function drawMenuPreview() {
    // Demonstração em duas etapas: cubo caminha até uma parede; depois a ship atravessa o céu.
    const phaseLength = 1900;
    const phase = menuDemoScroll % phaseLength;
    const groundTop = GROUND_Y - BLOCK_SIZE;
    if (phase < 900) {
        const playerX = 110 + Math.min(1, phase / 760) * 285;
        const wallX = 445;
        ctx.fillStyle = '#182d4a';
        ctx.fillRect(wallX, GROUND_Y - 112, 28, 112);
        ctx.fillStyle = '#4f83b9';
        ctx.fillRect(wallX + 4, GROUND_Y - 108, 20, 104);
        // Trail de caminhada em pequenos losangos.
        for (let i = 1; i <= 5; i++) {
            const tx = playerX - i * 13;
            const alpha = 0.34 - i * 0.05;
            ctx.fillStyle = `rgba(80,225,255,${alpha})`;
            ctx.fillRect(tx, groundTop + 17 + Math.sin((menuDemoScroll - i * 5) * 0.18) * 3, 6, 6);
        }
        drawCubeSkin(ctx, playerX, groundTop, BLOCK_SIZE, 0, playerSkin);
    } else {
        const flight = (phase - 900) / 1000;
        const shipX = 90 + flight * 760;
        const shipY = 245 + Math.sin(flight * Math.PI * 5) * 48;
        // Trilho luminoso da ship.
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#53eaff';
        ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(shipX - 95, shipY + 20); ctx.lineTo(shipX - 12, shipY + 20); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(shipX + 22, shipY + 22);
        ctx.fillStyle = playerSkin.primary;
        ctx.strokeStyle = '#07101d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-24, -15); ctx.lineTo(5, -15); ctx.lineTo(25, 0);
        ctx.lineTo(5, 15); ctx.lineTo(-24, 15); ctx.lineTo(-14, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = playerSkin.secondary;
        ctx.beginPath(); ctx.arc(2, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    menuDemoScroll += 2.4;
}
function loop() {
    ctx.save();
    if (visualSettings.shake && screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
        screenShake = Math.max(0, screenShake - 0.9);
    }

    drawBackgroundAndGround();

    if (gameState === 'PLAYING' || gameState === 'DEAD' || gameState === 'PAUSED' || gameState === 'WIN') {
        updateGameplay();
        drawLevelElementsInWorld();
        if (gameState !== 'DEAD') {
            if (visualSettings.trail && playerTrailTick++ % 3 === 0) {
                playerTrail.push({ x: player.x - 8, y: player.y + player.size / 2, life: 1 });
                if (playerTrail.length > 18) playerTrail.shift();
            }
            drawPlayerTrail();
            player.draw();
        }
        if (visualSettings.particles) updateAndDrawParticles(); else particles.length = 0;
    } else {
        // Fundo e demonstração jogável animados no menu principal e nos submenus.
        bgScroll += 1.2;
        groundScroll += 2.4;
        drawMenuPreview();
    }

    if (winFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${winFlashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        winFlashAlpha = Math.max(0, winFlashAlpha - 0.04);
    }

    ctx.restore();
    requestAnimationFrame(loop);
}

// === SELEÇÃO DE FASES, GARAGEM E CRIAÇÕES ===
function getAllSelectableLevels() {
    return [...LEVELS, ...customLevels];
}

function renderLevelSelect() {
    const list = getAllSelectableLevels();
    if (!list.length) return;
    currentLevelIndex = ((currentLevelIndex % list.length) + list.length) % list.length;
    const lvl = list[currentLevelIndex];

    document.getElementById('level-name').textContent = lvl.name;
    const best = levelProgress[lvl.name] || 0;
    const att = levelAttempts[lvl.name] || 0;
    document.getElementById('level-diff-text').textContent = `${lvl.difficulty || 'NORMAL'} • RECORDE: ${best}% • ATT: ${att}`;
    document.getElementById('level-stars').textContent = `☆ ${lvl.stars || 1}`;

    const faceEl = document.getElementById('level-diff-face');
    const faceSrc = DIFFICULTY_FACES[lvl.faceKey] || DIFFICULTY_FACES.azul;
    faceEl.innerHTML = `<img src="${faceSrc}" alt="${lvl.difficulty || 'Dificuldade'}">`;
}

function renderSkinUI() {
    const icon = document.getElementById('skin-btn-icon');
    if (icon) {
        const ic = icon.getContext('2d');
        ic.clearRect(0, 0, icon.width, icon.height);
        drawCubeSkin(ic, 4, 4, 36, 0, playerSkin);
    }
    const preview = document.getElementById('skin-preview');
    if (preview) {
        const pc = preview.getContext('2d');
        pc.clearRect(0, 0, preview.width, preview.height);
        drawCubeSkin(pc, 14, 14, 52, 0, playerSkin);
    }
}

function setupGarage() {
    const modelsRow = document.getElementById('skin-models');
    const priRow = document.getElementById('primary-colors');
    const secRow = document.getElementById('secondary-colors');
    if (!modelsRow || !priRow || !secRow) return;

    modelsRow.innerHTML = '';
    for (let m = 0; m < 4; m++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'skin-option' + (playerSkin.model === m ? ' selected' : '');
        const cv = document.createElement('canvas');
        cv.width = 40;
        cv.height = 40;
        drawCubeSkin(cv.getContext('2d'), 4, 4, 32, 0, { ...playerSkin, model: m });
        btn.appendChild(cv);
        btn.addEventListener('click', () => {
            playerSkin.model = m;
            writeSaveData();
            setupGarage();
            renderSkinUI();
        });
        modelsRow.appendChild(btn);
    }

    const buildSwatches = (container, prop) => {
        container.innerHTML = '';
        COLORS.forEach(col => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'color-swatch' + (playerSkin[prop].toLowerCase() === col ? ' selected' : '');
            b.style.background = col;
            b.addEventListener('click', () => {
                playerSkin[prop] = col;
                writeSaveData();
                setupGarage();
                renderSkinUI();
            });
            container.appendChild(b);
        });
    };

    buildSwatches(priRow, 'primary');
    buildSwatches(secRow, 'secondary');
    renderSkinUI();
}

function renderCreationsList() {
    const container = document.getElementById('creations-list');
    if (!container) return;
    container.innerHTML = '';

    if (!customLevels.length) {
        container.innerHTML = '<div class="empty-creations">Nenhuma fase criada ainda. Clique em "+ NOVA" para começar!</div>';
        return;
    }

    customLevels.forEach((lvl, idx) => {
        const item = document.createElement('div');
        item.className = 'creation-item';

        const meta = document.createElement('div');
        meta.className = 'creation-meta';
        meta.innerHTML = `
            <span class="creation-name">${lvl.name || 'Sem Título'}</span>
            <span class="creation-sub">${lvl.difficulty || 'NORMAL'} • Tamanho: ${lvl.finishX || 4400}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'creation-actions';

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'tiny-btn green';
        playBtn.textContent = 'JOGAR';
        playBtn.addEventListener('click', () => startLevel(lvl, false));

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'tiny-btn blue';
        editBtn.textContent = 'EDITAR';
        editBtn.addEventListener('click', () => openEditorWithLevel(lvl));

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'tiny-btn red';
        delBtn.textContent = 'APAGAR';
        delBtn.addEventListener('click', () => {
            customLevels.splice(idx, 1);
            writeSaveData();
            renderCreationsList();
        });

        actions.append(playBtn, editBtn, delBtn);
        item.append(meta, actions);
        container.appendChild(item);
    });
}

// === EDITOR BASE (SEM CONFLITO DE ESCALA/GRID) ===
const EDITOR_GRID = BLOCK_SIZE;
const EDITOR_SCALE_Y = 1;
const EDITOR_GROUND_Y = GROUND_Y;

let editorDraft = null;
let editorScrollX = 0;
let editorSelectedItem = 'spike';
let editorToolMode = 'place';
let editorShowGrid = true;
let isPointerEditing = false;
let lastEditorDragPoint = null;
let panDragState = null;

const ASSET_PALETTE = [
    { id: 'spike', label: 'SPIKE', color: '#ff3b5c' },
    { id: 'mini_spike', label: 'MINI SPIKE', color: '#ff924c' },
    { id: 'ceil_spike', label: 'CEIL SPIKE', color: '#d62828' },
    { id: 'platform', label: 'PLATFORM', color: '#00e5ff' },
    { id: 'block', label: 'BLOCK', color: '#4cc9f0' },
    { id: 'pad_yellow', label: 'PAD Y', color: '#ffe600' },
    { id: 'pad_pink', label: 'PAD P', color: '#ff4fd8' },
    { id: 'orb_yellow', label: 'ORB Y', color: '#ffd60a' },
    { id: 'orb_pink', label: 'ORB P', color: '#f72585' },
    { id: 'saw', label: 'SAW', color: '#94a3b8' },
    { id: 'pillar', label: 'PILLAR', color: '#cbd5e1' },
    { id: 'coin', label: 'COIN', color: '#ffb703' },
    { id: 'portal_ship', label: 'PORTAL SHIP', color: '#00c8ff' },
    { id: 'portal_cube', label: 'PORTAL CUBE', color: '#9dff00' }
];

const TRIGGER_PALETTE = [
    { id: 'trig_speed_fast', label: 'SPEED 1.25x', color: '#00e5ff' },
    { id: 'trig_speed_norm', label: 'SPEED 1.0x', color: '#38bdf8' },
    { id: 'trig_bg_purple', label: 'BG PURPLE', color: '#9b5de5' },
    { id: 'trig_shake', label: 'SHAKE', color: '#f15bb5' },
    { id: 'trig_low_grav', label: 'LOW GRAV', color: '#fee440' },
    { id: 'trig_norm_grav', label: 'NORM GRAV', color: '#9dff00' }
];

function createEmptyEditorDraft() {
    return {
        id: 'lvl_' + Date.now(),
        name: 'Minha Fase',
        difficulty: 'NORMAL',
        stars: 2,
        faceKey: 'verde',
        bgTop: '#0757a5',
        bgBottom: '#123a70',
        groundFill: '#09264b',
        groundGrid: '#2875ba',
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
        portals: [],
        decorations: [],
        structures: []
    };
}

function syncStyleInputsFromDraft() {
    if (!editorDraft) return;
    const titleEl = document.getElementById('editor-level-title');
    const diffEl = document.getElementById('editor-level-diff');
    const bgTopEl = document.getElementById('style-bg-top');
    const bgBotEl = document.getElementById('style-bg-bottom');
    const gFillEl = document.getElementById('style-ground-fill');
    const gGridEl = document.getElementById('style-ground-grid');
    const finEl = document.getElementById('style-finish-x');
    const finLbl = document.getElementById('style-finish-label');

    if (titleEl) titleEl.value = editorDraft.name || 'Minha Fase';
    if (diffEl) diffEl.value = editorDraft.difficulty || 'NORMAL';
    if (bgTopEl) bgTopEl.value = editorDraft.bgTop || '#1e1b4b';
    if (bgBotEl) bgBotEl.value = editorDraft.bgBottom || '#4338ca';
    if (gFillEl) gFillEl.value = editorDraft.groundFill || '#110e2e';
    if (gGridEl) gGridEl.value = editorDraft.groundGrid || '#3730a3';
    if (finEl) finEl.value = String(editorDraft.finishX || 4400);
    if (finLbl) finLbl.textContent = String(editorDraft.finishX || 4400);
}

function syncEditorToolButtons() {
    const placeBtn = document.getElementById('tool-place-btn');
    const eraseBtn = document.getElementById('tool-erase-btn');
    const panBtn = document.getElementById('tool-pan-btn');
    const gridBtn = document.getElementById('editor-grid-btn');

    if (placeBtn) placeBtn.classList.toggle('active', editorToolMode === 'place');
    if (eraseBtn) eraseBtn.classList.toggle('active', editorToolMode === 'erase');
    if (panBtn) panBtn.classList.toggle('active', editorToolMode === 'pan');
    if (gridBtn) {
        gridBtn.classList.toggle('active', editorShowGrid);
        gridBtn.textContent = editorShowGrid ? 'GRID: ON' : 'GRID: OFF';
    }
}

function renderEditorPalettes() {
    const assetPal = document.getElementById('editor-palette');
    const trigPal = document.getElementById('editor-triggers-palette');

    const buildItems = (container, items) => {
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => {
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
            container.appendChild(btn);
        });
    };

    buildItems(assetPal, ASSET_PALETTE);
    buildItems(trigPal, TRIGGER_PALETTE);
}

function openEditorWithLevel(lvl) {
    editorDraft = JSON.parse(JSON.stringify(lvl || createEmptyEditorDraft()));
    if (!editorDraft.id) editorDraft.id = 'lvl_' + Date.now();
    editorScrollX = 0;

    // Abrir a tela primeiro: uma falha na paleta ou em um painel não pode
    // impedir que o editor inteiro desapareça.
    showOverlay(levelEditor, 'EDITOR');
    if (levelEditor) {
        levelEditor.classList.remove('hidden');
        levelEditor.style.display = 'flex';
        levelEditor.style.visibility = 'visible';
        levelEditor.style.opacity = '1';
        levelEditor.style.pointerEvents = 'auto';
    }

    const safeEditorSetup = (label, callback) => {
        try {
            callback();
        } catch (error) {
            console.error('[Editor] Falha ao preparar ' + label + ':', error);
        }
    };

    safeEditorSetup('configurações visuais', syncStyleInputsFromDraft);
    safeEditorSetup('ferramentas', syncEditorToolButtons);
    safeEditorSetup('paleta de objetos', renderEditorPalettes);
    safeEditorSetup('desenho da fase', drawEditorCanvas);
}

function saveEditorDraftToCustomLevels() {
    if (!editorDraft) return;
    const titleEl = document.getElementById('editor-level-title');
    const diffEl = document.getElementById('editor-level-diff');
    editorDraft.name = (titleEl && titleEl.value.trim()) || 'Minha Fase';
    editorDraft.difficulty = (diffEl && diffEl.value) || 'NORMAL';

    const copy = JSON.parse(JSON.stringify(editorDraft));
    const builtinIdx = LEVELS.findIndex(l => l.id && l.id === editorDraft.id);
    const existingIdx = customLevels.findIndex(l => l.id === editorDraft.id);
    if (builtinIdx >= 0) Object.assign(LEVELS[builtinIdx], copy);
    else if (existingIdx >= 0) customLevels[existingIdx] = copy;
    else customLevels.push(copy);
    writeSaveData();
}

function expandEditorLevelIfNeeded(worldX) {
    if (!editorDraft) return;
    if (worldX + 600 > (editorDraft.finishX || 4400)) {
        editorDraft.finishX = Math.min(1000000, Math.ceil((worldX + 1200) / EDITOR_GRID) * EDITOR_GRID);
        const inp = document.getElementById('style-finish-x');
        const lbl = document.getElementById('style-finish-label');
        if (inp) inp.value = String(editorDraft.finishX);
        if (lbl) lbl.textContent = String(editorDraft.finishX);
    }
}

function getEditorWorldCoords(e, fineEdit = false) {
    const rect = editorCanvas.getBoundingClientRect();
    const sx = editorCanvas.width / Math.max(1, rect.width);
    const sy = editorCanvas.height / Math.max(1, rect.height);
    const canvasX = (e.clientX - rect.left) * sx;
    const canvasY = (e.clientY - rect.top) * sy;

    const step = fineEdit ? EDITOR_GRID / 2 : EDITOR_GRID;
    const rawX = canvasX + editorScrollX - 80;
    const x = Math.max(0, Math.round(rawX / step) * step);

    // A grade horizontal é ancorada no piso do jogo (GROUND_Y), não no topo.
    // Assim, o clique, o encaixe e as linhas visuais usam exatamente a mesma célula.
    const floorY = Math.min(editorCanvas.height - 44, GROUND_Y);
    const y = floorY - Math.round((floorY - canvasY) / step) * step;
    return { x, y, rawX, canvasX, canvasY };
}

function placeSelectedAtWorldCoord(x, y) {
    if (!editorDraft) return;
    const clampedX = Math.max(EDITOR_GRID * Math.ceil(200 / EDITOR_GRID), x);
    const snapY = Math.round(y / EDITOR_GRID) * EDITOR_GRID;

    if (editorSelectedItem === 'spike') {
        editorDraft.spikes.push({ x: clampedX, y: GROUND_Y, sizeType: 'normal' });
    } else if (editorSelectedItem === 'mini_spike') {
        editorDraft.spikes.push({ x: clampedX, y: GROUND_Y, sizeType: 'mini' });
    } else if (editorSelectedItem === 'ceil_spike') {
        editorDraft.spikes.push({ x: clampedX, y: CEILING_Y, sizeType: 'normal', inverted: true });
    } else if (editorSelectedItem === 'platform') {
        editorDraft.platforms.push({ x: clampedX, y: Math.min(GROUND_Y - 32, Math.max(CEILING_Y + 20, snapY)), w: EDITOR_GRID * 2, h: 28 });
    } else if (editorSelectedItem === 'block') {
        editorDraft.blocks.push({ x: clampedX, y: Math.min(GROUND_Y - BLOCK_SIZE, Math.max(CEILING_Y, snapY)), w: BLOCK_SIZE, h: BLOCK_SIZE });
    } else if (editorSelectedItem === 'pad_yellow') {
        editorDraft.pads.push({ x: clampedX, color: 'yellow', cooldown: 0 });
    } else if (editorSelectedItem === 'pad_pink') {
        editorDraft.pads.push({ x: clampedX, color: 'pink', cooldown: 0 });
    } else if (editorSelectedItem === 'orb_yellow') {
        editorDraft.orbs.push({ x: clampedX, y: Math.min(GROUND_Y - 24, Math.max(CEILING_Y + 20, snapY)), color: 'yellow', used: false });
    } else if (editorSelectedItem === 'orb_pink') {
        editorDraft.orbs.push({ x: clampedX, y: Math.min(GROUND_Y - 24, Math.max(CEILING_Y + 20, snapY)), color: 'pink', used: false });
    } else if (editorSelectedItem === 'saw') {
        editorDraft.saws.push({ x: clampedX, y: Math.min(GROUND_Y - 28, Math.max(CEILING_Y + 28, snapY)), r: 22, angle: 0 });
    } else if (editorSelectedItem === 'pillar') {
        editorDraft.pillars.push({ x: clampedX, h: 90, w: 34 });
    } else if (editorSelectedItem === 'coin') {
        editorDraft.coins.push({ x: clampedX, y: Math.min(GROUND_Y - 24, Math.max(CEILING_Y + 24, snapY)), collected: false });
    } else if (editorSelectedItem === 'portal_ship') {
        editorDraft.portals.push({ x: clampedX, type: 'ship', triggered: false });
    } else if (editorSelectedItem === 'portal_cube') {
        editorDraft.portals.push({ x: clampedX, type: 'cube', triggered: false });
    } else if (editorSelectedItem === 'trig_speed_fast') {
        editorDraft.triggers.push({ x: clampedX, kind: 'speed_fast', triggered: false });
    } else if (editorSelectedItem === 'trig_speed_norm') {
        editorDraft.triggers.push({ x: clampedX, kind: 'speed_normal', triggered: false });
    } else if (editorSelectedItem === 'trig_bg_purple') {
        editorDraft.triggers.push({ x: clampedX, kind: 'bg', bgTop: '#311042', bgBottom: '#7209b7', triggered: false });
    } else if (editorSelectedItem === 'trig_shake') {
        editorDraft.triggers.push({ x: clampedX, kind: 'shake', triggered: false });
    } else if (editorSelectedItem === 'trig_low_grav') {
        editorDraft.triggers.push({ x: clampedX, kind: 'low_grav', triggered: false });
    } else if (editorSelectedItem === 'trig_norm_grav') {
        editorDraft.triggers.push({ x: clampedX, kind: 'norm_grav', triggered: false });
    }
}

function eraseAtWorldCoord(x, y) {
    if (!editorDraft) return;
    const hitRadius = EDITOR_GRID * 0.85;
    const matchX = (ox, ow = 0) => x >= ox - hitRadius && x <= ox + Math.max(EDITOR_GRID, ow) + hitRadius;

    editorDraft.spikes = editorDraft.spikes.filter(o => !(matchX(o.x, o.sizeType === 'mini' ? MINI_SPIKE_W : BLOCK_SIZE) && Math.abs((Number.isFinite(Number(o.y)) ? Number(o.y) : (o.inverted ? CEILING_Y : GROUND_Y)) - y) <= hitRadius * 2));
    editorDraft.pads = editorDraft.pads.filter(o => !matchX(o.x, 36));
    editorDraft.pillars = editorDraft.pillars.filter(o => !matchX(o.x, o.w || 34));
    editorDraft.portals = editorDraft.portals.filter(o => !(matchX(o.x, PORTAL_WIDTH) && Math.abs((Number.isFinite(Number(o.y)) ? Number(o.y) : GROUND_Y - PORTAL_HEIGHT / 2) - y) <= PORTAL_HEIGHT / 2 + hitRadius));
    editorDraft.triggers = editorDraft.triggers.filter(o => !(matchX(o.x, 30) && Math.abs((Number.isFinite(Number(o.y)) ? Number(o.y) + 50 : GROUND_Y - 50) - y) <= 70));

    editorDraft.platforms = editorDraft.platforms.filter(o =>
        !(matchX(o.x, o.w || 120) && Math.abs((o.y || GROUND_Y - 28) - y) <= hitRadius)
    );
    editorDraft.blocks = editorDraft.blocks.filter(o =>
        !(matchX(o.x, o.w || BLOCK_SIZE) && Math.abs((o.y || GROUND_Y - BLOCK_SIZE) - y) <= hitRadius)
    );
    editorDraft.orbs = editorDraft.orbs.filter(o => Math.hypot((o.x || 0) - x, (o.y || GROUND_Y - 80) - y) > hitRadius);
    editorDraft.saws = editorDraft.saws.filter(o => Math.hypot((o.x || 0) - x, (o.y || GROUND_Y - 80) - y) > hitRadius);
    editorDraft.coins = editorDraft.coins.filter(o => Math.hypot((o.x || 0) - x, (o.y || GROUND_Y - 80) - y) > hitRadius);
}

function editAtEditorPointer(pointerEvent) {
    const point = getEditorWorldCoords(pointerEvent);
    expandEditorLevelIfNeeded(point.x);

    if (editorToolMode === 'erase') {
        eraseAtWorldCoord(point.x, point.y);
    } else if (editorToolMode === 'place') {
        if (!lastEditorDragPoint || Math.hypot(point.x - lastEditorDragPoint.x, point.y - lastEditorDragPoint.y) >= EDITOR_GRID * 0.7) {
            placeSelectedAtWorldCoord(point.x, point.y);
        }
    }
    lastEditorDragPoint = point;
}

function drawEditorCanvas() {
    if (!editorDraft) return;
    const w = editorCanvas.width;
    const h = editorCanvas.height;
    const groundY = Math.min(h - 44, GROUND_Y);

    eCtx.save();
    eCtx.clearRect(0, 0, w, h);

    const grad = eCtx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, editorDraft.bgTop || '#1e1b4b');
    grad.addColorStop(1, editorDraft.bgBottom || '#4338ca');
    eCtx.fillStyle = grad;
    eCtx.fillRect(0, 0, w, groundY);

    // Grid alinhada exatamente ao EDITOR_GRID (44px) e editorScrollX
    if (editorShowGrid) {
        const gridStrength = window.__editorGridStrength || 'normal';
        const gridAlpha = gridStrength === 'soft' ? 0.07 : (gridStrength === 'strong' ? 0.24 : 0.14);
        eCtx.strokeStyle = 'rgba(255, 255, 255, ' + gridAlpha + ')';
        eCtx.lineWidth = 1;
        const startX = -((editorScrollX - 80) % EDITOR_GRID);
        for (let gx = startX; gx < w; gx += EDITOR_GRID) {
            eCtx.beginPath();
            eCtx.moveTo(gx, 0);
            eCtx.lineTo(gx, groundY);
            eCtx.stroke();
        }
        // A grade vertical nasce no chão: cada célula de 44px sobe a partir da linha de piso.
        for (let gy = groundY; gy >= 0; gy -= EDITOR_GRID) {
            eCtx.beginPath();
            eCtx.moveTo(0, gy);
            eCtx.lineTo(w, gy);
            eCtx.stroke();
        }
    }

    // Chão do editor
    eCtx.fillStyle = editorDraft.groundFill || '#110e2e';
    eCtx.fillRect(0, groundY, w, h - groundY);
    eCtx.strokeStyle = editorDraft.groundGrid || '#3730a3';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.moveTo(0, groundY);
    eCtx.lineTo(w, groundY);
    eCtx.stroke();

    const ox = -editorScrollX + 80;

    // Objetos do rascunho
    (editorDraft.pillars || []).forEach(pil => {
        const sx = pil.x + ox;
        if (sx < -60 || sx > w + 60) return;
        eCtx.globalAlpha = Math.max(0, Math.min(1, Number(pil.opacity ?? 1))); eCtx.fillStyle = pil.colorOverride || '#ffffff';
        eCtx.fillRect(sx, groundY - (pil.h || 90), pil.w || 34, pil.h || 90);
    });

    (editorDraft.platforms || []).forEach(plat => {
        const sx = plat.x + ox;
        const py = plat.y !== undefined ? plat.y : groundY - 28;
        if (sx + (plat.w || 120) < -60 || sx > w + 60) return;
        eCtx.globalAlpha = Math.max(0, Math.min(1, Number(plat.opacity ?? 1)));
        eCtx.fillStyle = plat.colorOverride || '#18376b';
        eCtx.strokeStyle = plat.colorOverride || '#00e5ff';
        eCtx.lineWidth = 2;
        eCtx.fillRect(sx, py, plat.w || 120, plat.h || 28);
        eCtx.strokeRect(sx, py, plat.w || 120, plat.h || 28);
    });

    (editorDraft.blocks || []).forEach(blk => {
        const sx = blk.x + ox;
        const by = blk.y !== undefined ? blk.y : groundY - BLOCK_SIZE;
        if (sx + BLOCK_SIZE < -60 || sx > w + 60) return;
        eCtx.globalAlpha = Math.max(0, Math.min(1, Number(blk.opacity ?? 1)));
        eCtx.fillStyle = blk.colorOverride || '#2563eb';
        eCtx.strokeStyle = blk.colorOverride || '#93c5fd';
        eCtx.lineWidth = 2;
        eCtx.fillRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
        eCtx.strokeRect(sx, by, BLOCK_SIZE, BLOCK_SIZE);
    });

    (editorDraft.pads || []).forEach(pad => {
        const sx = pad.x + ox;
        if (sx < -50 || sx > w + 50) return;
        eCtx.fillStyle = pad.color === 'pink' ? '#ff4fd8' : '#ffe600';
        eCtx.fillRect(sx, groundY - 10, 36, 10);
    });

    (editorDraft.orbs || []).forEach(orb => {
        const sx = orb.x + ox;
        if (sx < -50 || sx > w + 50) return;
        eCtx.fillStyle = orb.color === 'pink' ? '#ff4fd8' : '#ffd60a';
        eCtx.beginPath();
        eCtx.arc(sx, orb.y || groundY - 80, 14, 0, Math.PI * 2);
        eCtx.fill();
    });

    (editorDraft.spikes || []).forEach(spk => {
        const sx = spk.x + ox;
        const isMini = spk.sizeType === 'mini';
        const sw = isMini ? MINI_SPIKE_W : BLOCK_SIZE;
        const sh = isMini ? MINI_SPIKE_H : BLOCK_SIZE;
        if (sx + sw < -50 || sx > w + 50) return;
        const inv = Boolean(spk.inverted);
        const baseY = Number.isFinite(Number(spk.y)) ? Number(spk.y) : (inv ? CEILING_Y : groundY);
        const tipY = inv ? baseY + sh : baseY - sh;
        eCtx.globalAlpha = Math.max(0, Math.min(1, Number(spk.opacity ?? 1)));
        eCtx.fillStyle = spk.colorOverride || '#ff3b5c';
        eCtx.beginPath();
        eCtx.moveTo(sx + 2, baseY);
        eCtx.lineTo(sx + sw / 2, tipY);
        eCtx.lineTo(sx + sw - 2, baseY);
        eCtx.closePath();
        eCtx.fill();
    });

    (editorDraft.saws || []).forEach(saw => {
        const sx = saw.x + ox;
        if (sx < -50 || sx > w + 50) return;
        eCtx.fillStyle = '#ff0055';
        eCtx.beginPath();
        eCtx.arc(sx, saw.y || groundY - 80, saw.r || 22, 0, Math.PI * 2);
        eCtx.fill();
    });

    (editorDraft.coins || []).forEach(coin => {
        const sx = coin.x + ox;
        if (sx < -50 || sx > w + 50) return;
        eCtx.fillStyle = '#ffd60a';
        eCtx.beginPath();
        eCtx.arc(sx, coin.y || groundY - 80, 12, 0, Math.PI * 2);
        eCtx.fill();
    });

    (editorDraft.portals || []).forEach(pt => {
        const sx = pt.x + ox;
        if (sx < -70 || sx > w + 70) return;
        eCtx.strokeStyle = pt.type === 'ship' ? '#00c8ff' : '#9dff00';
        eCtx.lineWidth = 4;
        eCtx.beginPath();
        eCtx.ellipse(sx + PORTAL_WIDTH / 2, Number.isFinite(Number(pt.y)) ? Number(pt.y) : groundY - PORTAL_HEIGHT / 2, 18, 45, 0, 0, Math.PI * 2);
        eCtx.stroke();
    });

    (editorDraft.triggers || []).forEach(trg => {
        const sx = trg.x + ox;
        if (sx < -50 || sx > w + 50) return;
        const triggerTop = Number.isFinite(Number(trg.y)) ? Number(trg.y) : groundY - 100;
        const triggerColor = trg.kind && trg.kind.indexOf('speed') === 0 ? '#22d3ee' : trg.kind === 'bg' || trg.kind === 'bg_cyan' ? '#c084fc' : '#fbbf24';
        eCtx.strokeStyle = triggerColor;
        eCtx.fillStyle = triggerColor + '22';
        eCtx.lineWidth = 2.5;
        eCtx.setLineDash([5, 4]);
        eCtx.fillRect(sx, triggerTop, 30, 100);
        eCtx.strokeRect(sx, triggerTop, 30, 100);
        eCtx.setLineDash([]);
        eCtx.fillStyle = triggerColor;
        eCtx.font = 'bold 9px sans-serif';
        eCtx.fillText(String(trg.kind || 'TRG').toUpperCase().replace('_',' ').slice(0,8), sx + 2, triggerTop - 5);
    });

    // Linha de chegada no editor
    const finX = (editorDraft.finishX || 4400) + ox;
    if (finX >= -20 && finX <= w + 20) {
        eCtx.strokeStyle = '#9dff00';
        eCtx.lineWidth = 3;
        eCtx.beginPath();
        eCtx.moveTo(finX, 0);
        eCtx.lineTo(finX, groundY);
        eCtx.stroke();
    }

    eCtx.restore();
}

// === EVENTOS E CONTROLES ===
function bindEvents() {
    document.getElementById('play-btn').addEventListener('click', () => {
        renderLevelSelect();
        showOverlay(levelSelect, 'LEVEL_SELECT');
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        applyPlatformSettingsUI();
        showOverlay(settingsScreen, 'SETTINGS');
    });

    document.getElementById('skin-btn').addEventListener('click', () => {
        setupGarage();
        showOverlay(skinGarage, 'SKINS');
    });

    document.getElementById('editor-btn').addEventListener('click', () => {
        showOverlay(editorHub, 'EDITOR_HUB');
    });

    document.getElementById('back-from-settings').addEventListener('click', () => showOverlay(mainMenu, 'MENU'));
    document.getElementById('back-from-levels').addEventListener('click', () => showOverlay(mainMenu, 'MENU'));
    document.getElementById('back-from-skins').addEventListener('click', () => showOverlay(mainMenu, 'MENU'));
    document.getElementById('back-from-editor-hub').addEventListener('click', () => showOverlay(mainMenu, 'MENU'));
    document.getElementById('back-from-creations').addEventListener('click', () => showOverlay(editorHub, 'EDITOR_HUB'));

    document.getElementById('mode-pc-btn').addEventListener('click', () => setPlatformMode('pc'));
    document.getElementById('mode-mobile-btn').addEventListener('click', () => setPlatformMode('mobile'));

    document.getElementById('prev-level').addEventListener('click', () => {
        currentLevelIndex--;
        renderLevelSelect();
    });
    document.getElementById('next-level').addEventListener('click', () => {
        currentLevelIndex++;
        renderLevelSelect();
    });
    document.getElementById('level-card').addEventListener('click', () => {
        const list = getAllSelectableLevels();
        startLevel(list[currentLevelIndex] || LEVELS[0], false);
    });

    document.getElementById('open-create-editor-btn').addEventListener('click', () => {
        openEditorWithLevel(createEmptyEditorDraft());
    });
    document.getElementById('open-creations-btn').addEventListener('click', () => {
        renderCreationsList();
        showOverlay(creationsScreen, 'CREATIONS');
    });
    document.getElementById('creations-new-btn').addEventListener('click', () => {
        openEditorWithLevel(createEmptyEditorDraft());
    });

    // Controles do editor
    document.getElementById('editor-exit-btn').addEventListener('click', () => {
        showOverlay(editorHub, 'EDITOR_HUB');
    });
    document.getElementById('tool-place-btn').addEventListener('click', () => {
        editorToolMode = 'place';
        syncEditorToolButtons();
    });
    document.getElementById('tool-erase-btn').addEventListener('click', () => {
        editorToolMode = 'erase';
        syncEditorToolButtons();
    });
    document.getElementById('tool-pan-btn').addEventListener('click', () => {
        editorToolMode = 'pan';
        syncEditorToolButtons();
    });
    document.getElementById('editor-grid-btn').addEventListener('click', () => {
        editorShowGrid = !editorShowGrid;
        syncEditorToolButtons();
        drawEditorCanvas();
    });
    document.getElementById('editor-clear-btn').addEventListener('click', () => {
        if (!editorDraft) return;
        ['spikes', 'platforms', 'blocks', 'pads', 'orbs', 'saws', 'pillars', 'coins', 'triggers', 'portals', 'decorations', 'structures'].forEach(k => {
            editorDraft[k] = [];
        });
        drawEditorCanvas();
    });
    document.getElementById('editor-save-btn').addEventListener('click', () => {
        saveEditorDraftToCustomLevels();
        alert('Fase salva em Criações!');
    });
    document.getElementById('editor-test-btn').addEventListener('click', () => {
        saveEditorDraftToCustomLevels();
        startLevel(editorDraft, true);
    });

    // Abas do editor
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('editor-panel-assets').classList.toggle('hidden', target !== 'assets');
            document.getElementById('editor-panel-triggers').classList.toggle('hidden', target !== 'triggers');
            document.getElementById('editor-panel-style').classList.toggle('hidden', target !== 'style');
        });
    });

    // Estilo da fase
    ['style-bg-top', 'style-bg-bottom', 'style-ground-fill', 'style-ground-grid', 'style-finish-x', 'editor-level-title', 'editor-level-diff'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            if (!editorDraft) return;
            if (id === 'style-bg-top') editorDraft.bgTop = el.value;
            if (id === 'style-bg-bottom') editorDraft.bgBottom = el.value;
            if (id === 'style-ground-fill') editorDraft.groundFill = el.value;
            if (id === 'style-ground-grid') editorDraft.groundGrid = el.value;
            if (id === 'style-finish-x') {
                editorDraft.finishX = Number(el.value) || 4400;
                const lbl = document.getElementById('style-finish-label');
                if (lbl) lbl.textContent = String(editorDraft.finishX);
            }
            if (id === 'editor-level-title') editorDraft.name = el.value;
            if (id === 'editor-level-diff') editorDraft.difficulty = el.value;
            drawEditorCanvas();
        });
    });

    // Pointer no canvas do editor
    editorCanvas.addEventListener('pointerdown', (e) => {
        if (gameState !== 'EDITOR') return;
        isPointerEditing = true;
        lastEditorDragPoint = null;
        if (editorCanvas.setPointerCapture && e.pointerId !== undefined) {
            try { editorCanvas.setPointerCapture(e.pointerId); } catch (_) {}
        }
        if (editorToolMode === 'pan' || e.button === 1) {
            panDragState = { startX: e.clientX, startScrollX: editorScrollX };
            return;
        }
        editAtEditorPointer(e);
        drawEditorCanvas();
    });

    window.addEventListener('pointermove', (e) => {
        if (gameState !== 'EDITOR' || !isPointerEditing) return;
        if (panDragState) {
            editorScrollX = Math.max(0, panDragState.startScrollX - (e.clientX - panDragState.startX));
            drawEditorCanvas();
            return;
        }
        editAtEditorPointer(e);
        drawEditorCanvas();
    });

    window.addEventListener('pointerup', () => {
        isPointerEditing = false;
        lastEditorDragPoint = null;
        panDragState = null;
    });

    editorCanvas.addEventListener('wheel', (e) => {
        if (gameState !== 'EDITOR') return;
        e.preventDefault();
        editorScrollX = Math.max(0, editorScrollX + (e.deltaY || e.deltaX));
        drawEditorCanvas();
    }, { passive: false });

    // HUD, Prática, Checkpoint, Pause e Vitória
    practiceToggleBtn.addEventListener('click', () => setPracticeMode(!isPracticeMode));
    checkpointBtn.addEventListener('click', () => saveCheckpointAtCurrentState());
    pauseMenuBtn.addEventListener('click', () => pauseCurrentGame());

    document.getElementById('resume-btn').addEventListener('click', () => resumeCurrentGame());
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
        pauseScreen.classList.add('hidden');
        setPracticeMode(false);
        resetAttemptsForLevel(activePlayableLevel.name);
        startLevel(activePlayableLevel, isTestingFromEditor);
    });
    document.getElementById('pause-exit-menu-btn').addEventListener('click', () => {
        clearRespawnTimer();
        setPracticeMode(false);
        if (isTestingFromEditor && editorDraft) {
            isTestingFromEditor = false;
            openEditorWithLevel(editorDraft);
        } else {
            showOverlay(mainMenu, 'MENU');
        }
    });

    document.getElementById('replay-btn').addEventListener('click', () => {
        winScreen.classList.add('hidden');
        startLevel(activePlayableLevel, isTestingFromEditor);
    });
    document.getElementById('win-menu-btn').addEventListener('click', () => {
        winScreen.classList.add('hidden');
        setPracticeMode(false);
        if (isTestingFromEditor && editorDraft) {
            isTestingFromEditor = false;
            openEditorWithLevel(editorDraft);
        } else {
            showOverlay(mainMenu, 'MENU');
        }
    });

    // Controles de pulo / voo (Teclado e Canvas)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            if (gameState === 'PLAYING') {
                e.preventDefault();
                if (!isHoldingJump) jumpJustPressed = true;
                isHoldingJump = true;
            }
        } else if (e.code === 'Escape') {
            if (gameState === 'PLAYING' || gameState === 'DEAD') pauseCurrentGame();
            else if (gameState === 'PAUSED') resumeCurrentGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            isHoldingJump = false;
        }
    });

    canvas.addEventListener('pointerdown', (e) => {
        if (gameState !== 'PLAYING') return;
        e.preventDefault();
        if (!isHoldingJump) jumpJustPressed = true;
        isHoldingJump = true;
        });

    window.addEventListener('pointerup', () => {
        isHoldingJump = false;
    });
}


/* Configurações extras, trail e música inteiramente sintetizada no navegador. */
const visualSettings = { trail: true, music: true, shake: true, particles: true, volume: 0.35 };
let playerTrail = [];
let playerTrailTick = 0;
let musicTimer = null;
let musicStep = 0;
const musicNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 329.63, 293.66, 349.23];
function startProceduralMusic() {
    if (!visualSettings.music || musicTimer) return;
    try {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            audioCtx = new AC();
        }
        audioCtx.resume();
        musicTimer = setInterval(() => {
            if (!visualSettings.music || !audioCtx || audioCtx.state !== 'running') return;
            const now = audioCtx.currentTime;
            const base = musicNotes[musicStep % musicNotes.length];
            const playTone = (frequency, duration, type, volume) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type; osc.frequency.setValueAtTime(frequency, now);
                gain.gain.setValueAtTime(Math.max(0.0001, visualSettings.volume * volume), now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(now); osc.stop(now + duration);
            };
            playTone(base, 0.20, 'triangle', 0.11);
            if (musicStep % 4 === 0) playTone(base / 2, 0.48, 'sine', 0.10);
            if (musicStep % 2 === 1) playTone(base * 1.5, 0.12, 'sine', 0.035);
            musicStep++;
        }, 190);
    } catch (_) {}
}
function stopProceduralMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
}
function drawPlayerTrail() {
    if (!visualSettings.trail) { playerTrail.length = 0; return; }
    ctx.save();
    playerTrail.forEach((p, i) => {
        const alpha = Math.max(0, p.life * (1 - i / Math.max(1, playerTrail.length)) * 0.32);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = playerSkin.secondary;
        ctx.fillRect(p.x, p.y, 7, 7);
        p.life -= 0.055;
    });
    ctx.restore();
    playerTrail = playerTrail.filter(p => p.life > 0);
}
function setupExtraSettings() {
    const bind = (id, key, type = 'checkbox') => {
        const el = document.getElementById(id);
        if (!el) return;
        const stored = localStorage.getItem('gd_setting_' + key);
        if (stored !== null) visualSettings[key] = type === 'range' ? Number(stored) / 100 : stored === 'true';
        el.checked = type === 'checkbox' ? visualSettings[key] : el.checked;
        if (type === 'range') el.value = Math.round(visualSettings[key] * 100);
        el.addEventListener('change', () => {
            visualSettings[key] = type === 'range' ? Number(el.value) / 100 : el.checked;
            localStorage.setItem('gd_setting_' + key, String(type === 'range' ? Number(el.value) : visualSettings[key]));
            if (key === 'music') visualSettings.music ? startProceduralMusic() : stopProceduralMusic();
        });
    };
    bind('setting-trail', 'trail');
    bind('setting-music', 'music');
    bind('setting-shake', 'shake');
    bind('setting-particles', 'particles');
    bind('setting-volume', 'volume', 'range');
    document.addEventListener('pointerdown', () => { if (visualSettings.music) startProceduralMusic(); }, { once: true });
}

applyPlatformSettingsUI();
setupExtraSettings();
setupMobileUiDrag();
setupGarage();
renderLevelSelect();
bindEvents();
requestAnimationFrame(loop);
