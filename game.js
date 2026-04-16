class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'init';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;

        this.player = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            speed: 5,
            health: 200,
            maxHealth: 200,
            stamina: 100,
            damage: 1,
            coins: 0
        };

        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];

        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 2000;

        this.images = {};
        this.loadAssets();

        this.keys = {};
        this.setupInputHandlers();

        this.startGame();
    }

    loadAssets() {
        const images = {
            player: 'assets/player-avatar.png',
            enemy: 'assets/tricaluctus(underwater-monster).png',
            background: 'assets/game-background.png'
        };

        let loadedImages = 0;
        const totalImages = Object.keys(images).length;

        for (const [key, src] of Object.entries(images)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.images[key] = img;
                loadedImages++;
                if (loadedImages === totalImages) {
                    this.gameState = 'playing';
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${key}`);
            };
        }
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        document.getElementById('upgradeSpeed').addEventListener('click', () => this.upgradeSpeed());
        document.getElementById('upgradeDamage').addEventListener('click', () => this.upgradeDamage());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleClick(e) {
        if (this.gameState !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.shoot(x, y);
    }

    shoot(targetX, targetY) {
        const now = Date.now();
        if (now - (this.lastShot || 0) < 300) return;

        const dx = targetX - (this.player.x + this.player.width/2);
        const dy = targetY - (this.player.y + this.player.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.projectiles.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2,
            width: 10,
            height: 10,
            dx: dx / distance,
            dy: dy / distance,
            speed: 10,
            damage: this.player.damage
        });

        this.lastShot = now;
    }

    startGame() {

        this.resize();


        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height / 2 - this.player.height / 2;


        this.lastTimestamp = performance.now();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateEnemies(deltaTime);
        this.spawnEnemies();
        this.checkCollisions();
        this.updateUI();
    }

    updatePlayer(deltaTime) {

        if (this.keys['ArrowUp'] || this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.x += this.player.speed;


        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));


        if (this.player.stamina < 100) {
            this.player.stamina = Math.min(100, this.player.stamina + 0.1);
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.dx * proj.speed;
            proj.y += proj.dy * proj.speed;

            if (proj.x < 0 || proj.x > this.canvas.width ||
                proj.y < 0 || proj.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }
    }

    spawnEnemies() {
        const now = Date.now();
        if (now - this.lastEnemySpawn >= this.enemySpawnInterval) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch(side) {
                case 0: // top
                    x = Math.random() * this.canvas.width;
                    y = -50;
                    break;
                case 1: // right
                    x = this.canvas.width + 50;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + 50;
                    break;
                case 3: // left
                    x = -50;
                    y = Math.random() * this.canvas.height;
                    break;
            }

            this.enemies.push({
                x,
                y,
                width: 50,
                height: 50,
                speed: 2,
                health: 100,
                value: 10 
            });

            this.lastEnemySpawn = now;
        }
    }

    checkCollisions() {

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.checkCollision(this.player, enemy)) {
                this.player.health -= 10;
                this.enemies.splice(i, 1);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }


        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(proj, enemy)) {
                    enemy.health -= proj.damage;
                    this.projectiles.splice(i, 1);
                    
                    if (enemy.health <= 0) {
                        this.score += 10;
                        this.player.coins += enemy.value;
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    updateUI() {
        document.getElementById('health').textContent = `Health: ${Math.ceil(this.player.health)}`;
        document.getElementById('stamina').textContent = `Stamina: ${Math.ceil(this.player.stamina)}`;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('currentCoins').textContent = this.player.coins;
        document.getElementById('currentSpeed').textContent = this.player.speed.toFixed(1);
        document.getElementById('currentDamage').textContent = this.player.damage;
    }

    upgradeSpeed() {
        const price = parseInt(document.getElementById('speedPrice').textContent);
        if (this.player.coins >= price) {
            this.player.coins -= price;
            this.player.speed += 0.5;
            document.getElementById('speedPrice').textContent = Math.floor(price * 1.5);
        }
    }

    upgradeDamage() {
        const price = parseInt(document.getElementById('damagePrice').textContent);
        if (this.player.coins >= price) {
            this.player.coins -= price;
            this.player.damage += 1;
            document.getElementById('damagePrice').textContent = Math.floor(price * 1.5);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        }


        this.enemies.forEach(enemy => {
            if (this.images.enemy) {
                this.ctx.drawImage(this.images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }

            const healthPercent = enemy.health / 100;
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 5);
        });


        this.ctx.fillStyle = 'yellow';
        this.projectiles.forEach(proj => {
            this.ctx.fillRect(proj.x - 5, proj.y - 5, 10, 10);
        });


        if (this.images.player) {
            this.ctx.drawImage(this.images.player, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }

        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press ESC to resume', this.canvas.width/2, this.canvas.height/2 + 40);
        }
    }

    togglePause() {
        this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
    }

    gameOver() {
        this.gameState = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('deathScreen').style.display = 'block';
    }

    restart() {
        this.player.health = this.player.maxHealth;
        this.player.stamina = 100;
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height / 2 - this.player.height / 2;
        this.score = 0;
        this.player.coins = 0;
        this.enemies = [];
        this.projectiles = [];
        this.gameState = 'playing';
        document.getElementById('deathScreen').style.display = 'none';

        this.player.speed = 5;
        this.player.damage = 1;
        document.getElementById('speedPrice').textContent = '100';
        document.getElementById('damagePrice').textContent = '150';
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
});
