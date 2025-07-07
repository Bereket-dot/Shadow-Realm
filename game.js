// Constants
const playerSize = 15;
const maxHealth = 100;
const playerSpeed = 5;
const orbSize = 8;
const shadowSize = 20;

window.addEventListener('load', () => {
  // Get DOM elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const levelEl = document.getElementById('level');
  const scoreEl = document.getElementById('score');
  const healthEl = document.getElementById('health');
  const finalScoreEl = document.getElementById('finalScore');
  const pauseBtn = document.getElementById('pauseBtn');
  const backBtn = document.getElementById('backBtn');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const menuBtn = document.getElementById('menuBtn');
  const bgMusic = document.getElementById('bgMusic');
  const orbSound = document.getElementById('orbSound');
  const hitSound = document.getElementById('hitSound');

  // Game state
  let walls = [];
  let orbs = [];
  let shadows = [];
  let keys = {};
  let player = { x: 100, y: 100, size: playerSize, health: maxHealth, score: 0 };
  let level = 1;
  let paused = false;
  let gameOver = false;
  let animationFrameId;

  // Initialize game
  function initGame() {
    // Reset game state
    paused = false;
    gameOver = false;
    player = { x: 100, y: 100, size: playerSize, health: maxHealth, score: 0 };
    level = 1;
    
    // Generate game elements
    generateWalls();
    generateOrbs();
    generateShadows();
    
    // Set up audio - FIXED AUDIO LOADING
    bgMusic.volume = 0.3;
    orbSound.volume = 0.7;
    hitSound.volume = 0.7;
    
    // Start audio playback safely
    const playAudio = () => {
      bgMusic.play().catch(e => console.log("Audio play error:", e));
    };
    
    // Audio requires user interaction
    document.addEventListener('click', playAudio, { once: true });
    document.addEventListener('keydown', playAudio, { once: true });
    
    // Ensure UI is in correct state
    gameOverScreen.classList.add('hidden');
    pauseBtn.textContent = '⏸ Pause';
    
    // Start game loop
    gameLoop();
  }

  // Walls configuration
  function generateWalls() {
    walls = [
      { x: 200, y: 100, width: 20, height: 300 },
      { x: 400, y: 0, width: 20, height: 200 },
      { x: 600, y: 150, width: 20, height: 400 },
      { x: 300, y: 400, width: 300, height: 20 },
      { x: 100, y: 500, width: 500, height: 20 }
    ];
  }

  // Orbs generation
  function generateOrbs() {
    orbs = [];
    let orbCount = 5 + level * 2;
    
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * (canvas.width - orbSize * 2) + orbSize,
        y: Math.random() * (canvas.height - orbSize * 2) + orbSize,
        collected: false
      });
    }
  }

  // Shadows generation
  function generateShadows() {
    shadows = [];
    let shadowCount = Math.min(5 + level * 2, 25);
    
    for (let i = 0; i < shadowCount; i++) {
      shadows.push({
        x: Math.random() * (canvas.width - shadowSize * 2) + shadowSize,
        y: Math.random() * (canvas.height - shadowSize * 2) + shadowSize,
        size: shadowSize,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 1.5
      });
    }
  }

  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function collidesWithWalls(x, y, size) {
    for (const wall of walls) {
      if (x + size > wall.x && 
          x - size < wall.x + wall.width && 
          y + size > wall.y && 
          y - size < wall.y + wall.height) {
        return true;
      }
    }
    return false;
  }

  function drawPlayer() {
    ctx.save();
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWalls() {
    ctx.fillStyle = '#004466';
    for (const wall of walls) {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00ffff33';
      ctx.lineWidth = 4;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      ctx.restore();
    }
  }

  function drawOrbs() {
    for (const orb of orbs) {
      if (!orb.collected) {
        ctx.save();
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orbSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawShadows() {
    for (const shadow of shadows) {
      ctx.save();
      ctx.shadowColor = '#9900cc';
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(shadow.x, shadow.y, shadow.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function updatePlayer() {
    if (keys['ArrowUp'] && player.y - player.size > 0 && 
        !collidesWithWalls(player.x, player.y - playerSpeed, player.size)) {
      player.y -= playerSpeed;
    }
    if (keys['ArrowDown'] && player.y + player.size < canvas.height && 
        !collidesWithWalls(player.x, player.y + playerSpeed, player.size)) {
      player.y += playerSpeed;
    }
    if (keys['ArrowLeft'] && player.x - player.size > 0 && 
        !collidesWithWalls(player.x - playerSpeed, player.y, player.size)) {
      player.x -= playerSpeed;
    }
    if (keys['ArrowRight'] && player.x + player.size < canvas.width && 
        !collidesWithWalls(player.x + playerSpeed, player.y, player.size)) {
      player.x += playerSpeed;
    }
  }

  function updateShadows() {
    for (const shadow of shadows) {
      shadow.x += shadow.speedX;
      shadow.y += shadow.speedY;
      
      if (shadow.x - shadow.size < 0 || shadow.x + shadow.size > canvas.width) {
        shadow.speedX *= -1;
      }
      if (shadow.y - shadow.size < 0 || shadow.y + shadow.size > canvas.height) {
        shadow.speedY *= -1;
      }
    }
  }

  function checkCollisions() {
    for (const orb of orbs) {
      if (!orb.collected && 
          distance(player.x, player.y, orb.x, orb.y) < player.size + orbSize) {
        orb.collected = true;
        player.score += 10;
        orbSound.currentTime = 0;
        orbSound.play().catch(e => console.log("Orb sound error:", e));
      }
    }
    
    for (const shadow of shadows) {
      if (distance(player.x, player.y, shadow.x, shadow.y) < player.size + shadow.size) {
        player.health -= 0.7;
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.log("Hit sound error:", e));
        player.health = Math.max(0, player.health);
      }
    }
  }

  function updateHUD() {
    levelEl.textContent = level;
    scoreEl.textContent = player.score;
    healthEl.textContent = Math.floor(player.health);
  }

  function checkLevelUp() {
    const collectedOrbs = orbs.filter(orb => orb.collected).length;
    if (collectedOrbs === orbs.length) {
      level++;
      player.health = maxHealth;
      generateOrbs();
      generateShadows();
      player.x = 100;
      player.y = 100;
    }
  }

  function checkGameOver() {
    if (player.health <= 0) {
      gameOver = true;
      bgMusic.pause();
      showGameOver();
    }
  }

  function showGameOver() {
    finalScoreEl.textContent = player.score;
    gameOverScreen.classList.remove('hidden');
  }

  function resetGame() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    initGame();
  }

  function gameLoop() {
    if (!paused && !gameOver) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updatePlayer();
      updateShadows();
      checkCollisions();
      checkLevelUp();
      checkGameOver();
      
      drawWalls();
      drawOrbs();
      drawShadows();
      drawPlayer();
      updateHUD();
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    
    if (e.key === 'Escape') {
      paused = !paused;
      pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // Button event handlers
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
    
    if (paused) {
      bgMusic.pause();
    } else {
      bgMusic.play().catch(e => console.log("Resume audio error:", e));
    }
  });
  
  playAgainBtn.addEventListener('click', resetGame);
  menuBtn.addEventListener('click', () => window.location.href = 'index.html');
  backBtn.addEventListener('click', () => window.location.href = 'index.html');

  // Initialize game
  initGame();
});