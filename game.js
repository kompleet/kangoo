// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Chargement des images
const background = new Image(); background.src = 'assets/background.png';
const kangooImg = new Image(); kangooImg.src = 'assets/kangoo.png';
const sanglierImg = new Image(); sanglierImg.src = 'assets/sanglier.png';
const chatImg = new Image(); chatImg.src = 'assets/chat.png';

// Chargement des sons
const jumpSound = new Audio('assets/jump.mp3');
const crashSound = new Audio('assets/crash.mp3');
const bravoSound = new Audio('assets/bravo.mp3');

// Configuration du jeu
let solY = canvas.height - 64;
let showChat = false;
let gameOver = false;
let score = 0;

// Classe Kangoo
class Kangoo {
  constructor() {
    this.x = 64;
    this.y = solY;
    this.width = 64;
    this.height = 32;
    this.vy = 0;
    this.onGround = true;
  }
  
  jump() {
    if (this.onGround) {
      this.vy = -12;
      this.onGround = false;
      playSound(jumpSound);
    }
  }
  
  update() {
    this.y += this.vy;
    this.vy += 0.8; // gravité
    if (this.y >= solY) {
      this.y = solY;
      this.vy = 0;
      this.onGround = true;
    }
  }
  
  draw() {
    ctx.drawImage(kangooImg, this.x, this.y, this.width, this.height);
  }
}

let kangoo = new Kangoo();

// Classe Obstacle (Sanglier)
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y = solY + 8;
    this.width = 32;
    this.height = 24;
    this.speed = 4;
  }
  
  update() {
    this.x -= this.speed;
  }
  
  draw() {
    ctx.drawImage(sanglierImg, this.x, this.y, this.width, this.height);
  }
}

let obstacles = [];
let obstacleTimer = 0;

// Gestion du fond défilant
let bgX = 0;
function drawBackground() {
  bgX = (bgX - 2) % background.width;
  if (bgX > 0) bgX -= background.width;
  
  for (let x = bgX; x < canvas.width; x += background.width) {
    ctx.drawImage(background, x, canvas.height - background.height);
  }
}

// Gestion audio
function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(e => console.log("Audio playback failed:", e));
}

// Détection des collisions
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Mise à jour des éléments du jeu
function update() {
  if (showChat) return;
  
  // Update de la Kangoo
  kangoo.update();
  
  // Génération des obstacles
  obstacleTimer++;
  if (obstacleTimer > 90) {
    obstacles.push(new Obstacle());
    obstacleTimer = 0;
  }
  
  // Mise à jour des obstacles
  obstacles.forEach(ob => ob.update());
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
  
  // Détection des collisions
  for (let ob of obstacles) {
    if (checkCollision(kangoo, ob)) {
      playSound(crashSound);
      showChat = true;
      gameOver = true;
      
      // Joue le son "bravo" après une courte pause
      setTimeout(() => playSound(bravoSound), 500);
    }
  }
  
  // Augmentation du score
  if (!gameOver) {
    score++;
  }
}

// Rendu graphique
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fond
  drawBackground();
  
  // Kangoo
  kangoo.draw();
  
  // Obstacles
  obstacles.forEach(ob => ob.draw());
  
  // Score
  ctx.font = '16px monospace';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + Math.floor(score/10), 10, 20);
  
  // Chat et message de fin
  if (showChat) {
    // Assombrit le fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Affiche le chat
    ctx.drawImage(chatImg, canvas.width/2 - 32, canvas.height/2 - 64, 64, 64);
    
    // Affiche le message
    ctx.font = '24px monospace';
    ctx.fillStyle = '#FFA500';
    ctx.fillText('Bravo !', canvas.width/2 - 40, canvas.height/2 + 30);
    
    // Affiche le score final
    ctx.font = '16px monospace';
    ctx.fillText('Score final: ' + Math.floor(score/10), canvas.width/2 - 60, canvas.height/2 + 60);
    
    // Instructions pour rejouer
    ctx.font = '14px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText('Appuyez sur ESPACE pour rejouer', canvas.width/2 - 115, canvas.height/2 + 90);
  }
}

// Boucle de jeu principale
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Gestion des contrôles
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (showChat) {
      // Réinitialise le jeu
      showChat = false;
      gameOver = false;
      score = 0;
      obstacles = [];
      obstacleTimer = 0;
      kangoo = new Kangoo();
    } else {
      kangoo.jump();
    }
  }
});

canvas.addEventListener('touchstart', e => {
  if (showChat) {
    // Réinitialise le jeu
    showChat = false;
    gameOver = false;
    score = 0;
    obstacles = [];
    obstacleTimer = 0;
    kangoo = new Kangoo();
  } else {
    kangoo.jump();
  }
});

// Ajuste la taille du canvas lors du redimensionnement de la fenêtre
function resizeCanvas() {
  // Garde le ratio correct
  const ratio = canvas.width / canvas.height;
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  
  if (maxWidth / ratio > maxHeight) {
    canvas.style.width = (maxHeight * ratio) + 'px';
    canvas.style.height = maxHeight + 'px';
  } else {
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (maxWidth / ratio) + 'px';
  }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  gameLoop();
});