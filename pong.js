const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 13;
const PADDLE_SPEED = 8;
const AI_SPEED = 5.3;

let playerScore = 0,
    computerScore = 0;

// Paddle positions
let playerY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
let computerY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
let playerDY = 0;

// Ball position and velocity
let ballX = CANVAS_WIDTH / 2;
let ballY = CANVAS_HEIGHT / 2;
let ballDX = 6 * (Math.random() > 0.5 ? 1 : -1);
let ballDY = 5 * (Math.random() > 0.5 ? 1 : -1);

// For simple trail effect
let trails = [];

function resetBall() {
    ballX = CANVAS_WIDTH / 2;
    ballY = CANVAS_HEIGHT / 2;
    ballDX = 6 * (Math.random() > 0.5 ? 1 : -1);
    ballDY = 5 * (Math.random() > 0.5 ? 1 : -1);
    trails = [];
}

function drawPaddle(x, y, isPlayer) {
    ctx.save();
    ctx.shadowColor = isPlayer ? "#00ffe7" : "#ff8c00";
    ctx.shadowBlur = 18;
    ctx.fillStyle = isPlayer ? "#00ffe7" : "#ffcc00";
    ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.restore();

    // Neon edge
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isPlayer ? "#00ffe7bb" : "#ffcc00bb";
    ctx.strokeRect(x + 1, y + 1, PADDLE_WIDTH - 2, PADDLE_HEIGHT - 2);
    ctx.restore();
}

function drawBall() {
    // Draw trails
    for (let i = 0; i < trails.length; i++) {
        let t = trails[i];
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#fff900";
        ctx.shadowColor = "#fff900";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    // Draw main ball with glow
    ctx.save();
    ctx.shadowColor = "#fff900";
    ctx.shadowBlur = 32;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

function drawNet() {
    ctx.save();
    ctx.strokeStyle = "#fffcc0";
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 24]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawGlowBorder() {
    ctx.save();
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#ffcc00aa";
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 24;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
}

function draw() {
    // Background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Glow border
    drawGlowBorder();

    // Net
    drawNet();

    // Paddles
    drawPaddle(0, playerY, true);
    drawPaddle(CANVAS_WIDTH - PADDLE_WIDTH, computerY, false);

    // Ball + trails
    drawBall();
}

function update() {
    // Move player
    playerY += playerDY;
    if (playerY < 0) playerY = 0;
    if (playerY + PADDLE_HEIGHT > CANVAS_HEIGHT) playerY = CANVAS_HEIGHT - PADDLE_HEIGHT;

    // Move computer AI
    if (computerY + PADDLE_HEIGHT / 2 < ballY - 18) {
        computerY += AI_SPEED;
    } else if (computerY + PADDLE_HEIGHT / 2 > ballY + 18) {
        computerY -= AI_SPEED;
    }
    if (computerY < 0) computerY = 0;
    if (computerY + PADDLE_HEIGHT > CANVAS_HEIGHT) computerY = CANVAS_HEIGHT - PADDLE_HEIGHT;

    // Ball trail
    trails.unshift({ x: ballX, y: ballY, alpha: 0.26 });
    if (trails.length > 12) trails.pop();
    for (let i = 0; i < trails.length; i++) trails[i].alpha *= 0.96;

    // Move ball
    ballX += ballDX;
    ballY += ballDY;

    // Ball collision with top/bottom
    if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > CANVAS_HEIGHT) {
        ballDY = -ballDY;
        // Clamp
        if (ballY - BALL_RADIUS < 0) ballY = BALL_RADIUS;
        if (ballY + BALL_RADIUS > CANVAS_HEIGHT) ballY = CANVAS_HEIGHT - BALL_RADIUS;
    }

    // Ball collision with paddles
    // Player paddle
    if (
        ballX - BALL_RADIUS < PADDLE_WIDTH + 2 &&
        ballY > playerY &&
        ballY < playerY + PADDLE_HEIGHT
    ) {
        ballDX = Math.abs(ballDX);
        let collidePoint = ballY - (playerY + PADDLE_HEIGHT / 2);
        ballDY = collidePoint * 0.24 + (Math.random() - 0.5) * 2;
        // Neon feedback
        flashCanvas("#00ffe7");
    }
    // Computer paddle
    if (
        ballX + BALL_RADIUS > CANVAS_WIDTH - PADDLE_WIDTH - 2 &&
        ballY > computerY &&
        ballY < computerY + PADDLE_HEIGHT
    ) {
        ballDX = -Math.abs(ballDX);
        let collidePoint = ballY - (computerY + PADDLE_HEIGHT / 2);
        ballDY = collidePoint * 0.24 + (Math.random() - 0.5) * 2;
        // Neon feedback
        flashCanvas("#ffcc00");
    }

    // Ball out of bounds (score)
    if (ballX - BALL_RADIUS < 0) {
        computerScore++;
        updateScoreboard();
        resetBall();
    }
    if (ballX + BALL_RADIUS > CANVAS_WIDTH) {
        playerScore++;
        updateScoreboard();
        resetBall();
    }
}

function updateScoreboard() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('computer-score').textContent = computerScore;
}

// Neon flash feedback
let flashTimeout = null;

function flashCanvas(color) {
    canvas.style.boxShadow = `0 0 60px 16px ${color}, 0 2px 14px #000a`;
    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
        canvas.style.boxShadow = "";
    }, 110);
}

// Mouse control
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    if (playerY < 0) playerY = 0;
    if (playerY + PADDLE_HEIGHT > CANVAS_HEIGHT) playerY = CANVAS_HEIGHT - PADDLE_HEIGHT;
});

// Keyboard control
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp') playerDY = -PADDLE_SPEED;
    else if (e.key === 'ArrowDown') playerDY = PADDLE_SPEED;
});
document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') playerDY = 0;
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Use a web font for extra flair
(function loadFont() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
})();

gameLoop();