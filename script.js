const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos de UI
const hud = document.getElementById('hud');
const pauseMenuBtn = document.getElementById('pause-menu-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const mainMenu = document.getElementById('main-menu');
const settingsScreen = document.getElementById('settings-screen');
const levelSelect = document.getElementById('level-select');
const skinGarage = document.getElementById('skin-garage');
const pauseScreen = document.getElementById('pause-screen');
const winScreen = document.getElementById('win-screen');

// Estados: 'MENU', 'SETTINGS', 'LEVEL_SELECT', 'SKINS', 'PLAYING', 'DEAD', 'PAUSED', 'ENDING_ANIM', 'WIN'
let gameState = 'MENU';
let stateBeforePause = 'PLAYING';
let deadRemainingMs = 0;
let deadStartedAt = 0;

// Timer para segurar 5 segundos no toque no modo CELULAR e ir ao pause
const HOLD_PAUSE_MS = 2000;
let holdPauseTimer = null;

// Física
const GRAVITY = 0.95;
const JUMP_FORCE = -14.8;
const GROUND_Y = 390;
const GAME_SPEED = 7.2;
const BLOCK_SIZE = 44;
const RESPAWN_DELAY_MS = 1500;

let bgScroll = 0;
let groundScroll = 0;
let levelDistance = 0;
let isHoldingJump = false;
let particles = [];
let winFlashAlpha = 0;
let respawnTimer = null;

// === ROSTOS DE DIFICULDADE (Assets/) ===
const DIFFICULTY_FACES = {
    azul: 'Assets/cara_azul.png',
    verde: 'Assets/cara_verde.png'
};

// === SISTEMA DE SALVAMENTO LOCAL (localStorage) ===
const STORAGE_KEY = 'gd_web_save_v03';

function loadSaveData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Erro ao carregar save local:', e);
    }
    return {
        platform: 'pc', // Padrão original de PC
        skin: { model: 0, primary: '#ffde00', secondary: '#00e5ff' },
        progress: {},
        attempts: {}
    };
}

function writeSaveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            platform: controlPlatform,
            skin: playerSkin,
            progress: levelProgress,
            attempts: levelAttempts
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

const COLORS = ['#ffde00', '#7fff00', '#00e5ff', '#ff0055', '#ff7b00', '#b5179e', '#ffffff'];

// Fases oficiais da v0.3
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
        finishX: 3100,
        spikes: [
            780,
            1220,
            1680,
            2120, 2164,
            2620
        ]
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
        finishX: 4100,
        spikes: [
            760,
            1160, 1204,
            1640,
            2050, 2094, 2138,
            2620,
            3060, 3104,
            3580
        ]
    }
];
let currentLevelIndex = 0;

function applyPlatformSettingsUI() {
    const pcBtn = document.getElementById('mode-pc-btn');
    const mobileBtn = document.getElementById('mode-mobile-btn');
    const hint = document.getElementById('platform-hint');

    if (controlPlatform === 'mobile') {
        pcBtn.classList.remove('selected');
        mobileBtn.classList.add('selected');
        pauseMenuBtn.classList.add('hidden');
        hint.textContent = 'Modo Celular: toque para pular e segure por 5s para ir ao pause.';
    } else {
        controlPlatform = 'pc';
        mobileBtn.classList.remove('selected');
        pcBtn.classList.add('selected');
        pauseMenuBtn.classList.remove('hidden');
        hint.textContent = 'Modo PC: clique/espaço para pular e botão II para pausar.';
    }
}

function setPlatformMode(mode) {
    controlPlatform = mode === 'mobile' ? 'mobile' : 'pc';
    clearHoldPauseTimer();
    applyPlatformSettingsUI();
    writeSaveData();
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
            startAttempt(true);
        }
    }, delayMs);
}

function recordBestProgress(levelName, percent) {
    const cleanPercent = Math.min(100, Math.max(0, Math.floor(percent)));
    const prev = levelProgress[levelName] || 0;
    if (cleanPercent > prev) {
        levelProgress[levelName] = cleanPercent;
        writeSaveData();
    }
}

function incrementAttempt(levelName) {
    const current = levelAttempts[levelName] || 0;
    levelAttempts[levelName] = current + 1;
    writeSaveData();
    return levelAttempts[levelName];
}

function resetAttemptsForLevel(levelName) {
    levelAttempts[levelName] = 0;
    writeSaveData();
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

// Jogador Principal
const player = {
    x: 160,
    y: GROUND_Y - BLOCK_SIZE,
    size: BLOCK_SIZE,
    dy: 0,
    grounded: true,
    rotation: 0,

    reset() {
        this.x = 160;
        this.y = GROUND_Y - this.size;
        this.dy = 0;
        this.grounded = true;
        this.rotation = 0;
    },

    update() {
        if (isHoldingJump && this.grounded) {
            this.jump();
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

    jump() {
        if (this.grounded) {
            this.dy = JUMP_FORCE;
            this.grounded = false;
        }
    },

    draw() {
        drawCubeSkin(ctx, this.x, this.y, this.size, this.rotation, playerSkin);
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
            this.spikes[i] -= GAME_SPEED;
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
let activeFinishX = 3100;
let lockedFinishScreenX = 0;
let currentRunPercent = 0;
let activeAttemptNumber = 1;

function startAttempt(countNewAttempt = true) {
    clearRespawnTimer();
    clearHoldPauseTimer();
    applyPlatformSettingsUI();
    const lvl = LEVELS[currentLevelIndex];

    if (countNewAttempt) {
        activeAttemptNumber = incrementAttempt(lvl.name);
    } else {
        activeAttemptNumber = 1;
    }

    levelDistance = 0;
    currentRunPercent = 0;
    particles = [];
    winFlashAlpha = 0;
    player.reset();
    activeFinishX = lvl.finishX;
    activeSpikes = lvl.spikes.map(x => ({ x, width: BLOCK_SIZE, height: BLOCK_SIZE }));
    updateProgressUI(0);
    gameState = 'PLAYING';
}

function triggerDeath() {
    if (gameState !== 'PLAYING') return;

    recordBestProgress(LEVELS[currentLevelIndex].name, currentRunPercent);
    gameState = 'DEAD';
    isHoldingJump = false;

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
    stateBeforePause = gameState;

    if (gameState === 'DEAD' && respawnTimer) {
        clearTimeout(respawnTimer);
        respawnTimer = null;
        deadRemainingMs = Math.max(100, deadRemainingMs - (Date.now() - deadStartedAt));
    }

    gameState = 'PAUSED';
    document.getElementById('pause-level-name').textContent = `${LEVELS[currentLevelIndex].name} • ${currentRunPercent}%`;
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
    const label = `Attempt ${activeAttemptNumber}`;
    ctx.strokeText(label, attemptX, GROUND_Y - 125);
    ctx.fillText(label, attemptX, GROUND_Y - 125);
    ctx.restore();
}

function drawBackground() {
    const isInLevel = ['PLAYING', 'DEAD', 'PAUSED', 'ENDING_ANIM', 'WIN'].includes(gameState);
    const lvl = LEVELS[currentLevelIndex];

    const topColor = isInLevel ? lvl.bgTop : '#0038a8';
    const bottomColor = isInLevel ? lvl.bgBottom : '#0066ff';

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
    const lvl = LEVELS[currentLevelIndex];

    ctx.fillStyle = isInLevel ? lvl.groundFill : '#001d5c';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    ctx.strokeStyle = isInLevel ? lvl.groundGrid : '#0044cc';
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

function drawSpike(x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y - h);
    ctx.lineTo(x + w, y);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y - h, x, y);
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

function checkSpikeCollision(p, spikeScreenX, spikeW, spikeH) {
    const spikeCenterX = spikeScreenX + spikeW / 2;
    const hitW = 12;
    const hitH = spikeH * 0.65;

    return (
        p.x + 6 < spikeCenterX + hitW / 2 &&
        p.x + p.size - 6 > spikeCenterX - hitW / 2 &&
        p.y + p.size - 4 > GROUND_Y - hitH
    );
}

// Loop Principal
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'MENU' || gameState === 'SETTINGS' || gameState === 'LEVEL_SELECT' || gameState === 'SKINS') {
        bgScroll += GAME_SPEED * 0.25;
        groundScroll += GAME_SPEED;
        drawBackground();
        drawGround();

        bgBot.update();
        bgBot.draw();
    } 
    else if (gameState === 'PLAYING') {
        bgScroll += GAME_SPEED * 0.25;
        groundScroll += GAME_SPEED;
        levelDistance += GAME_SPEED;

        drawBackground();
        drawGround();
        drawAttemptLabel();

        const cameraStopDistance = (activeFinishX + 160) - (canvas.width - 120);
        const progress = (levelDistance / cameraStopDistance) * 97;
        updateProgressUI(progress);

        for (let s of activeSpikes) {
            const screenX = s.x - levelDistance + 160;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);

                if (checkSpikeCollision(player, screenX, s.width, s.height)) {
                    triggerDeath();
                    break;
                }
            }
        }

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        if (gameState === 'PLAYING') {
            player.update();
            player.draw();

            if (levelDistance >= cameraStopDistance) {
                lockedFinishScreenX = finishScreenX;
                clearHoldPauseTimer();
                gameState = 'ENDING_ANIM';
                isHoldingJump = false;
            }
        }
    }
    else if (gameState === 'DEAD') {
        drawBackground();
        drawGround();
        drawAttemptLabel();

        for (let s of activeSpikes) {
            const screenX = s.x - levelDistance + 160;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);
            }
        }

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        updateParticlesOnly();
        drawParticlesOnly();
    }
    else if (gameState === 'PAUSED') {
        drawBackground();
        drawGround();
        drawAttemptLabel();

        for (let s of activeSpikes) {
            const screenX = s.x - levelDistance + 160;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);
            }
        }

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        if (stateBeforePause === 'DEAD') {
            drawParticlesOnly();
        } else {
            player.draw();
        }
    }
    else if (gameState === 'ENDING_ANIM') {
        drawBackground();
        drawGround();

        for (let s of activeSpikes) {
            const screenX = s.x - levelDistance + 160;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);
            }
        }

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
            const completedLevelName = LEVELS[currentLevelIndex].name;
            updateProgressUI(100);
            recordBestProgress(completedLevelName, 100);
            resetAttemptsForLevel(completedLevelName);

            spawnEndParticles(lockedFinishScreenX - 10, player.y, 28, true);
            winFlashAlpha = 0.75;

            gameState = 'WIN';
            hud.classList.add('hidden');
            document.getElementById('win-level-name').textContent = `${completedLevelName} • 100% • ATTEMPTS ZERADOS`;
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

    requestAnimationFrame(loop);
}

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

// Navegação dos Menus, Configurações e Pause
document.getElementById('play-btn').addEventListener('click', () => {
    clearRespawnTimer();
    clearHoldPauseTimer();
    mainMenu.classList.add('hidden');
    updateLevelCard();
    levelSelect.classList.remove('hidden');
    gameState = 'LEVEL_SELECT';
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
    recordBestProgress(LEVELS[currentLevelIndex].name, currentRunPercent);
    pauseScreen.classList.add('hidden');
    hud.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('replay-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    startAttempt(true);
});

document.getElementById('win-menu-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    updateLevelCard();
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

// Controles de Pulo e Pause
window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'PAUSED') resumeCurrentGame();
        else pauseCurrentGame();
        return;
    }
    if (gameState === 'PLAYING' && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        isHoldingJump = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        isHoldingJump = false;
    }
});

canvas.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') isHoldingJump = true;
});
window.addEventListener('mouseup', () => { isHoldingJump = false; });

canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        e.preventDefault();
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
setupGarage();
loop();
