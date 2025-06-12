// Kangoo Jump - Jeu inspiré du jeu du dinosaure de Chrome
// Variables globales du jeu
let game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    speed: 6,
    score: 0,
    isRunning: false,
    isJumping: false,
    groundLevel: 0,
    gravity: 0.6,
    images: {},
    obstacles: [],
    obstacleTimer: 0,
    minObstacleInterval: 60,
    maxObstacleInterval: 150,
    nextObstacleTime: 0,
    animationFrame: 0,
    groundOffset: 0,
    backgroundOffset: 0
};

// Joueur (Kangoo)
let player = {
    x: 0,
    y: 0,
    width: 80,
    height: 50,
    jumpStrength: -12,
    velocityY: 0,
    initialY: 0
};

// Chargement des images
function loadImages() {
    const imageUrls = {
        kangoo: 'https://pplx-res.cloudinary.com/image/upload/v1749755098/gpt4o_images/q7zxhzl8e71fjmrda0ul.png',
        sanglier: 'https://pplx-res.cloudinary.com/image/upload/v1749755157/gpt4o_images/ljsgh5p91dny25h1najh.png',
        background: 'https://pplx-res.cloudinary.com/image/upload/v1749755219/gpt4o_images/woqty1n22vgl80yzjnwj.png',
        chat: 'https://pplx-res.cloudinary.com/image/upload/v1749755304/gpt4o_images/bkmfv5gmnjpjr9z9zfet.png'
    };

    const promises = [];

    for (const key in imageUrls) {
        promises.push(new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                game.images[key] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Erreur de chargement de l'image: ${key}`);
                reject();
            };
            img.src = imageUrls[key];
        }));
    }

    return Promise.all(promises);
}

// Initialisation du jeu
function initGame() {
    // Récupération du canvas
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');

    // Adaptation du canvas à la taille de l'écran
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialisation du joueur
    player.x = game.width * 0.2;
    player.y = game.groundLevel - player.height;
    player.initialY = player.y;

    // Écouteurs d'événements
    document.addEventListener('keydown', handleKeyDown);
    game.canvas.addEventListener('touchstart', handleTouchStart);
}

// Configuration des boutons de l'interface
function setupButtons() {
    // Boutons UI
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }
}

// Redimensionnement du canvas
function resizeCanvas() {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
    game.width = game.canvas.width;
    game.height = game.canvas.height;
    game.groundLevel = game.height * 0.8;
    
    // Recalcul de la position du joueur après redimensionnement
    if (player.initialY) {
        player.y = game.groundLevel - player.height;
        player.initialY = player.y;
    }
}

// Affichage d'un écran spécifique
function showScreen(screenId) {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    document.getElementById(screenId).classList.remove('hidden');
}

// Démarrage du jeu
function startGame() {
    console.log("Démarrage du jeu");
    showScreen('game-screen');
    
    // Réinitialisation des variables du jeu
    game.score = 0;
    game.isRunning = true;
    game.obstacles = [];
    game.nextObstacleTime = game.minObstacleInterval;
    
    // Réinitialisation du joueur
    player.y = player.initialY;
    player.velocityY = 0;
    game.isJumping = false;
    
    updateScore();
    gameLoop();
}

// Redémarrage du jeu
function restartGame() {
    startGame();
}

// Boucle principale du jeu
function gameLoop() {
    if (!game.isRunning) return;
    
    // Effacement du canvas
    game.ctx.clearRect(0, 0, game.width, game.height);
    
    // Mise à jour du jeu
    update();
    
    // Dessin des éléments
    draw();
    
    // Animation
    game.animationFrame++;
    
    // Prochaine frame
    requestAnimationFrame(gameLoop);
}

// Mise à jour des éléments du jeu
function update() {
    // Mise à jour du score
    game.score++;
    
    // Augmentation progressive de la vitesse
    if (game.score % 500 === 0) {
        game.speed += 0.1;
    }
    
    // Mise à jour de l'affichage du score
    if (game.score % 10 === 0) {
        updateScore();
    }
    
    // Mise à jour du joueur (saut)
    if (game.isJumping) {
        player.velocityY += game.gravity;
        player.y += player.velocityY;
        
        // Vérification si retour au sol
        if (player.y >= player.initialY) {
            player.y = player.initialY;
            player.velocityY = 0;
            game.isJumping = false;
        }
    }
    
    // Défilement du fond
    game.backgroundOffset = (game.backgroundOffset + game.speed * 0.5) % game.width;
    game.groundOffset = (game.groundOffset + game.speed) % 100;
    
    // Génération des obstacles
    game.obstacleTimer++;
    if (game.obstacleTimer >= game.nextObstacleTime) {
        generateObstacle();
        game.obstacleTimer = 0;
        game.nextObstacleTime = Math.floor(
            Math.random() * (game.maxObstacleInterval - game.minObstacleInterval) + game.minObstacleInterval
        );
        
        // Réduction progressive de l'intervalle entre les obstacles
        if (game.minObstacleInterval > 30 && game.score > 1000) {
            game.minObstacleInterval -= 0.05;
            game.maxObstacleInterval -= 0.05;
        }
    }
    
    // Mise à jour des obstacles
    updateObstacles();
    
    // Vérification des collisions
    checkCollisions();
}

// Génération d'un nouvel obstacle
function generateObstacle() {
    const obstacle = {
        x: game.width,
        y: game.groundLevel - 40, // Hauteur du sanglier
        width: 50,
        height: 40
    };
    
    game.obstacles.push(obstacle);
}

// Mise à jour des obstacles
function updateObstacles() {
    for (let i = 0; i < game.obstacles.length; i++) {
        game.obstacles[i].x -= game.speed;
        
        // Suppression des obstacles hors écran
        if (game.obstacles[i].x + game.obstacles[i].width < 0) {
            game.obstacles.splice(i, 1);
            i--;
        }
    }
}

// Vérification des collisions
function checkCollisions() {
    for (let i = 0; i < game.obstacles.length; i++) {
        const obstacle = game.obstacles[i];
        
        // Détection de collision simplifiée (rectangle vs rectangle)
        if (
            player.x < obstacle.x + obstacle.width * 0.7 &&
            player.x + player.width * 0.7 > obstacle.x &&
            player.y < obstacle.y + obstacle.height * 0.7 &&
            player.y + player.height * 0.7 > obstacle.y
        ) {
            gameOver();
            return;
        }
    }
}

// Fin du jeu
function gameOver() {
    game.isRunning = false;
    document.getElementById('crash-sound').play();
    setTimeout(() => {
        document.getElementById('game-over-sound').play();
        document.getElementById('final-score').textContent = game.score;
        showScreen('game-over-screen');
    }, 500);
}

// Faire sauter la Kangoo
function jump() {
    if (!game.isJumping && game.isRunning) {
        game.isJumping = true;
        player.velocityY = player.jumpStrength;
        document.getElementById('jump-sound').play();
    }
}

// Gestion des événements clavier
function handleKeyDown(event) {
    // Espace pour sauter
    if (event.code === 'Space') {
        event.preventDefault();
        jump();
    }
}

// Gestion des événements tactiles
function handleTouchStart(event) {
    event.preventDefault();
    jump();
}

// Mise à jour de l'affichage du score
function updateScore() {
    document.getElementById('score').textContent = game.score;
}

// Dessin des éléments du jeu
function draw() {
    // Dessin du fond (arrière-pays niçois)
    drawBackground();
    
    // Dessin du sol
    drawGround();
    
    // Dessin des obstacles (sangliers)
    drawObstacles();
    
    // Dessin du joueur (Kangoo)
    drawPlayer();
}

// Dessin du fond
function drawBackground() {
    const bgImg = game.images.background;
    
    // Si l'image est chargée, dessiner le fond en mode répété
    if (bgImg) {
        // Premier panneau
        game.ctx.drawImage(
            bgImg,
            game.backgroundOffset, 0,
            game.width, game.height,
            0, 0,
            game.width, game.height
        );
        
        // Deuxième panneau pour la continuité
        game.ctx.drawImage(
            bgImg,
            0, 0,
            game.width - game.backgroundOffset, game.height,
            game.width - game.backgroundOffset, 0,
            game.width - game.backgroundOffset, game.height
        );
    }
}

// Dessin du sol
function drawGround() {
    // Ligne de sol
    game.ctx.fillStyle = '#8B4513';
    game.ctx.fillRect(0, game.groundLevel, game.width, 2);
    
    // Route
    game.ctx.fillStyle = '#555555';
    game.ctx.fillRect(0, game.groundLevel + 2, game.width, game.height - game.groundLevel - 2);
    
    // Lignes de la route
    game.ctx.fillStyle = '#FFFFFF';
    for (let i = -game.groundOffset; i < game.width; i += 100) {
        game.ctx.fillRect(i, game.groundLevel + 15, 50, 5);
    }
}

// Dessin du joueur (Kangoo)
function drawPlayer() {
    const kangooImg = game.images.kangoo;
    
    if (kangooImg) {
        // Animation de saut (inclinaison)
        let angle = 0;
        if (game.isJumping) {
            // Inclinaison basée sur la vélocité
            angle = player.velocityY * 0.02;
        }
        
        game.ctx.save();
        game.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        game.ctx.rotate(angle);
        game.ctx.drawImage(
            kangooImg,
            -player.width / 2, -player.height / 2,
            player.width, player.height
        );
        game.ctx.restore();
    }
}

// Dessin des obstacles (sangliers)
function drawObstacles() {
    const sanglierImg = game.images.sanglier;
    
    if (sanglierImg) {
        for (const obstacle of game.obstacles) {
            game.ctx.drawImage(
                sanglierImg,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
            );
        }
    }
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // Préchargement des sons
    document.getElementById('jump-sound').load();
    document.getElementById('crash-sound').load();
    document.getElementById('game-over-sound').load();
    
    // Initialisation du jeu
    setupButtons();
    
    // Affichage de l'écran d'accueil
    showScreen('start-screen');
    
    // Chargement des images et initialisation
    loadImages().then(() => {
        initGame();
        console.log("Jeu initialisé et prêt");
    }).catch(error => {
        console.error('Erreur lors du chargement des ressources:', error);
    });
});