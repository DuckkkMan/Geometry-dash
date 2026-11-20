const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos de UI
const hud = document.getElementById('hud');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const mainMenu = document.getElementById('main-menu');
const levelSelect = document.getElementById('level-select');
const skinGarage = document.getElementById('skin-garage');
const winScreen = document.getElementById('win-screen');

// Estados: 'MENU', 'LEVEL_SELECT', 'SKINS', 'PLAYING', 'ENDING_ANIM', 'WIN'
let gameState = 'MENU';

// Física
const GRAVITY = 0.95;
const JUMP_FORCE = -14.8;
const GROUND_Y = 390;
const GAME_SPEED = 7.2;
const BLOCK_SIZE = 44;

let bgScroll = 0;
let groundScroll = 0;
let levelDistance = 0;
let isHoldingJump = false;
let particles = [];
let winFlashAlpha = 0; // Flash branco suave ao completar a fase

// === SISTEMA DE SALVAMENTO LOCAL (localStorage) ===
const STORAGE_KEY = 'gd_web_save_v02';

function loadSaveData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Erro ao carregar save local:', e);
    }
    return {
        skin: { model: 0, primary: '#ffde00', secondary: '#00e5ff' },
        progress: {} // Ex: { "Spike Run": 100 }
    };
}

function writeSaveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            skin: playerSkin,
            progress: levelProgress
        }));
    } catch (e) {
        console.warn('Erro ao salvar no navegador:', e);
    }
}

const savedData = loadSaveData();
let playerSkin = savedData.skin || { model: 0, primary: '#ffde00', secondary: '#00e5ff' };
let levelProgress = savedData.progress || {};

const COLORS = ['#ffde00', '#7fff00', '#00e5ff', '#ff0055', '#ff7b00', '#b5179e', '#ffffff'];

// Fases disponíveis
const LEVELS = [
    {
        name: 'Spike Run',
        difficulty: 'NORMAL',
        stars: 1,
        color: '#38b000',
        face: ':)',
        finishX: 2400,
        spikes: [850, 1350, 1850]
    },
    {
        name: 'Double Trouble',
        difficulty: 'HARD',
        stars: 3,
        color: '#ff9900',
        face: ':|',
        finishX: 2800,
        spikes: [850, 894, 1450, 1950, 1994]
    }
];
let currentLevelIndex = 0;

function recordBestProgress(levelName, percent) {
    const cleanPercent = Math.min(100, Math.max(0, Math.floor(percent)));
    const prev = levelProgress[levelName] || 0;
    if (cleanPercent > prev) {
        levelProgress[levelName] = cleanPercent;
        writeSaveData();
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
        // Tamanho sempre 100% original (BLOCK_SIZE)
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
let activeFinishX = 2400;
let lockedFinishScreenX = 0;
let currentRunPercent = 0;

function initLevel() {
    const lvl = LEVELS[currentLevelIndex];
    levelDistance = 0;
    currentRunPercent = 0;
    particles = [];
    winFlashAlpha = 0;
    player.reset();
    activeFinishX = lvl.finishX;
    activeSpikes = lvl.spikes.map(x => ({ x, width: BLOCK_SIZE, height: BLOCK_SIZE }));
    updateProgressUI(0);
}

function updateProgressUI(percent) {
    const clamped = Math.min(100, Math.max(0, Math.floor(percent)));
    currentRunPercent = clamped;
    progressFill.style.width = clamped + '%';
    progressText.textContent = clamped + '%';
}

// Cenário
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0038a8');
    grad.addColorStop(1, '#0066ff');
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
    ctx.fillStyle = '#001d5c';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    ctx.strokeStyle = '#0044cc';
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

// Parede de Fim de Fase
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

// Partículas
function spawnEndParticles(x, y, count = 4, burst = false) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + Math.random() * 30,
            y: y + Math.random() * 40,
            vx: burst ? (Math.random() - 0.5) * 12 : -2 - Math.random() * 4,
            vy: burst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 6,
            size: 5 + Math.random() * 6,
            color: Math.random() > 0.5 ? '#7fff00' : '#ffe600',
            alpha: 1
        });
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.025;

        if (pt.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
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

    if (gameState === 'MENU' || gameState === 'LEVEL_SELECT' || gameState === 'SKINS') {
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

        const cameraStopDistance = (activeFinishX + 160) - (canvas.width - 120);
        const progress = (levelDistance / cameraStopDistance) * 97;
        updateProgressUI(progress);

        for (let s of activeSpikes) {
            const screenX = s.x - levelDistance + 160;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);

                if (checkSpikeCollision(player, screenX, s.width, s.height)) {
                    recordBestProgress(LEVELS[currentLevelIndex].name, currentRunPercent);
                    initLevel();
                    break;
                }
            }
        }

        const finishScreenX = activeFinishX - levelDistance + 160;
        drawFinishWall(finishScreenX);

        player.update();
        player.draw();

        if (levelDistance >= cameraStopDistance) {
            lockedFinishScreenX = finishScreenX;
            gameState = 'ENDING_ANIM';
            isHoldingJump = false;
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

        // Cubo avança até a parede mantendo o tamanho 100% original
        player.x += 8.5;
        player.y += (GROUND_Y / 2 - player.y) * 0.08;
        player.rotation += 0.22;

        spawnEndParticles(player.x, player.y, 4, false);
        updateAndDrawParticles();
        player.draw();

        const travelDone = Math.max(0, player.x - 160);
        const totalTravel = Math.max(1, (lockedFinishScreenX - player.size / 2) - 160);
        const finalPercent = 97 + (travelDone / totalTravel) * 3;
        updateProgressUI(finalPercent);

        if (player.x + player.size / 2 >= lockedFinishScreenX) {
            updateProgressUI(100);
            recordBestProgress(LEVELS[currentLevelIndex].name, 100);

            // Explosão de partículas e flash branco na batida final
            spawnEndParticles(lockedFinishScreenX - 10, player.y, 28, true);
            winFlashAlpha = 0.75;

            gameState = 'WIN';
            hud.classList.add('hidden');
            document.getElementById('win-level-name').textContent = `${LEVELS[currentLevelIndex].name} • 100%`;
            winScreen.classList.remove('hidden');
        }
    }
    else if (gameState === 'WIN') {
        drawBackground();
        drawGround();
        drawFinishWall(lockedFinishScreenX);
        updateAndDrawParticles();

        // Flash suave que desaparece rapidamente
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
            writeSaveData(); // Salva escolha localmente
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
            writeSaveData(); // Salva cor 1 localmente
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
            writeSaveData(); // Salva cor 2 localmente
        });
        secDiv.appendChild(sw2);
    });

    renderSkinUI();
}

// === SELEÇÃO DE FASES ===
function updateLevelCard() {
    const lvl = LEVELS[currentLevelIndex];
    const best = levelProgress[lvl.name] || 0;

    document.getElementById('level-name').textContent = lvl.name;
    document.getElementById('level-diff-text').textContent = `${lvl.difficulty} • RECORDE: ${best}%`;
    document.getElementById('level-stars').textContent = best === 100 ? `★ ${lvl.stars} (COMPLETA)` : `☆ ${lvl.stars}`;

    const face = document.getElementById('level-diff-face');
    face.textContent = lvl.face;
    face.style.backgroundColor = lvl.color;
}

// Navegação dos Menus
document.getElementById('play-btn').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    updateLevelCard();
    levelSelect.classList.remove('hidden');
    gameState = 'LEVEL_SELECT';
});

document.getElementById('skin-btn').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    skinGarage.classList.remove('hidden');
    gameState = 'SKINS';
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
    initLevel();
    gameState = 'PLAYING';
});

document.getElementById('pause-menu-btn').addEventListener('click', () => {
    recordBestProgress(LEVELS[currentLevelIndex].name, currentRunPercent);
    hud.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

document.getElementById('replay-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    initLevel();
    gameState = 'PLAYING';
});

document.getElementById('win-menu-btn').addEventListener('click', () => {
    winScreen.classList.add('hidden');
    updateLevelCard();
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

// Controles de Pulo
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        isHoldingJump = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        isHoldingJump = false;
    }
});

canvas.addEventListener('mousedown', () => { isHoldingJump = true; });
window.addEventListener('mouseup', () => { isHoldingJump = false; });

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isHoldingJump = true;
});
window.addEventListener('touchend', () => { isHoldingJump = false; });

// Inicializa
setupGarage();
loop();
