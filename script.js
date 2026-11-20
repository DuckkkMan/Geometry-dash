const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mainMenu = document.getElementById('main-menu');
const winScreen = document.getElementById('win-screen');
const playBtn = document.getElementById('play-btn');
const menuBtn = document.getElementById('menu-btn');

// Estados do jogo: 'MENU', 'PLAYING', 'WIN'
let gameState = 'MENU';

// Física calibrada no estilo Geometry Dash
const GRAVITY = 0.95;
const JUMP_FORCE = -14.8;
const GROUND_Y = 390;
const GAME_SPEED = 7.2;
const BLOCK_SIZE = 44;

let bgScroll = 0;
let groundScroll = 0;
let levelDistance = 0;
let isHoldingJump = false;

// Jogador (Cubo Clássico)
const player = {
    x: 160,
    y: GROUND_Y - BLOCK_SIZE,
    size: BLOCK_SIZE,
    dy: 0,
    grounded: true,
    rotation: 0,

    reset() {
        this.y = GROUND_Y - this.size;
        this.dy = 0;
        this.grounded = true;
        this.rotation = 0;
    },

    update() {
        // Pulo contínuo se segurar o botão (igual no GD original!)
        if (isHoldingJump && this.grounded) {
            this.jump();
        }

        this.dy += GRAVITY;
        this.y += this.dy;

        // Colisão com o chão
        if (this.y + this.size >= GROUND_Y) {
            this.y = GROUND_Y - this.size;
            this.dy = 0;
            this.grounded = true;
            // Trava a rotação exatamente em múltiplos de 90 graus
            this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            this.grounded = false;
            // Rotação exata para dar 180° por pulo
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
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        const half = this.size / 2;

        // Base Amarela
        ctx.fillStyle = '#ffde00';
        ctx.fillRect(-half, -half, this.size, this.size);

        // Borda Preta Grossa
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#000';
        ctx.strokeRect(-half, -half, this.size, this.size);

        // Detalhes Ciano (Olhos e Boca do Ícone 1)
        ctx.fillStyle = '#00e5ff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        // Olho Esquerdo
        ctx.fillRect(-13, -12, 9, 9);
        ctx.strokeRect(-13, -12, 9, 9);

        // Olho Direito
        ctx.fillRect(4, -12, 9, 9);
        ctx.strokeRect(4, -12, 9, 9);

        // Boca
        ctx.fillRect(-13, 4, 26, 8);
        ctx.strokeRect(-13, 4, 26, 8);

        ctx.restore();
    }
};

// Configuração da fase "Spike Run" (3 Espinhos)
let spikes = [];
const FINISH_LINE_X = 2350;

function initLevel() {
    levelDistance = 0;
    player.reset();
    // Posições exatas dos 3 espinhos na fase
    spikes = [
        { x: 850, width: BLOCK_SIZE, height: BLOCK_SIZE },
        { x: 1350, width: BLOCK_SIZE, height: BLOCK_SIZE },
        { x: 1850, width: BLOCK_SIZE, height: BLOCK_SIZE }
    ];
}

// Desenha o fundo azul estilo Stereo Madness
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0038a8');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y);

    // Quadrados sutis no fundo (Parallax lento)
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

// Desenha o chão azul escuro com grade
function drawGround() {
    ctx.fillStyle = '#001d5c';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // Grade do chão
    ctx.strokeStyle = '#0044cc';
    ctx.lineWidth = 2;
    const tile = 55;
    const offset = -(groundScroll % tile);

    for (let x = offset; x < canvas.width; x += tile) {
        ctx.strokeRect(x, GROUND_Y, tile, tile);
        ctx.strokeRect(x, GROUND_Y + tile, tile, tile);
    }

    // Linha branca brilhante do topo do chão
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();
}

// Desenha um espinho estilo Geometry Dash
function drawSpike(x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y - h);
    ctx.lineTo(x + w, y);
    ctx.closePath();

    // Gradiente interno do espinho
    const grad = ctx.createLinearGradient(x, y - h, x, y);
    grad.addColorStop(0, '#222');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fill();

    // Borda branca característica
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
}

// Desenha o portal/parede de chegada no final dos 3 espinhos
function drawFinishLine(screenX) {
    if (screenX > canvas.width + 50) return;

    // Feixe de luz vertical
    const grad = ctx.createLinearGradient(screenX, 0, screenX + 40, 0);
    grad.addColorStop(0, 'rgba(0, 255, 170, 0.8)');
    grad.addColorStop(1, 'rgba(0, 255, 170, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(screenX, 0, 40, GROUND_Y);

    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(screenX, 0, 6, GROUND_Y);
}

// Hitbox justa (menor que o visual do espinho, igual no GD original)
function checkSpikeCollision(p, spikeScreenX, spikeW, spikeH) {
    const spikeCenterX = spikeScreenX + spikeW / 2;
    const hitW = 12; // Hitbox fina no centro do espinho
    const hitH = spikeH * 0.65;

    return (
        p.x + 6 < spikeCenterX + hitW / 2 &&
        p.x + p.size - 6 > spikeCenterX - hitW / 2 &&
        p.y + p.size - 4 > GROUND_Y - hitH
    );
}

// Loop Principal (60 FPS)
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'MENU') {
        // Fundo animado na tela inicial
        bgScroll += 1.2;
        groundScroll += 4;
        drawBackground();
        drawGround();
    } 
    else if (gameState === 'PLAYING') {
        bgScroll += GAME_SPEED * 0.25;
        groundScroll += GAME_SPEED;
        levelDistance += GAME_SPEED;

        drawBackground();
        drawGround();

        // Desenha e verifica os 3 espinhos
        for (let s of spikes) {
            const screenX = s.x - levelDistance + player.x;
            if (screenX + s.width > -50 && screenX < canvas.width + 50) {
                drawSpike(screenX, GROUND_Y, s.width, s.height);

                // Se bater, reinicia a fase instantaneamente (como no GD)
                if (checkSpikeCollision(player, screenX, s.width, s.height)) {
                    initLevel();
                    break;
                }
            }
        }

        // Chegada
        const finishScreenX = FINISH_LINE_X - levelDistance + player.x;
        drawFinishLine(finishScreenX);

        player.update();
        player.draw();

        // Verifica se passou pelos 3 espinhos e cruzou a chegada
        if (player.x >= finishScreenX) {
            gameState = 'WIN';
            winScreen.classList.remove('hidden');
        }
    } 
    else if (gameState === 'WIN') {
        drawBackground();
        drawGround();
        player.draw();
    }

    requestAnimationFrame(loop);
}

// Eventos dos Botões
playBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    winScreen.classList.add('hidden');
    initLevel();
    gameState = 'PLAYING';
});

menuBtn.addEventListener('click', () => {
    winScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

// Controles (Espaço, Seta para cima, Mouse ou Toque)
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

// Inicia o loop
loop();
