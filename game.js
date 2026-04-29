const STORAGE_KEYS = {
    META: 'sh_meta_v2',
    HIGH_RUN: 'sh_high_run_v2'
};

const GAME_CONFIG = {
    player: {
        width: 46,
        height: 46,
        baseSpeed: 280,
        baseHealth: 180,
        maxStamina: 100,
        staminaRegen: 20,
        dashCost: 35,
        dashCooldown: 650,
        dashMultiplier: 3,
        invulnerabilityMs: 300
    },
    weapons: {
        pistol: {
            id: 'pistol',
            name: 'Pistol',
            fireInterval: 280,
            projectileSpeed: 700,
            projectileSize: 8,
            projectileLife: 1.4,
            ammoCapacity: 14,
            reloadTime: 950,
            pellets: 1,
            spread: 0,
            pierce: 0,
            splashRadius: 0,
            damageMult: 1
        },
        shotgun: {
            id: 'shotgun',
            name: 'Shotgun',
            fireInterval: 700,
            projectileSpeed: 560,
            projectileSize: 7,
            projectileLife: 0.75,
            ammoCapacity: 6,
            reloadTime: 1250,
            pellets: 5,
            spread: 0.24,
            pierce: 0,
            splashRadius: 0,
            damageMult: 0.7
        },
        railgun: {
            id: 'railgun',
            name: 'Railgun',
            fireInterval: 620,
            projectileSpeed: 860,
            projectileSize: 10,
            projectileLife: 1.6,
            ammoCapacity: 4,
            reloadTime: 1450,
            pellets: 1,
            spread: 0,
            pierce: 3,
            splashRadius: 0,
            damageMult: 2.2
        }
    },
    enemyTypes: {
        basic: {
            name: 'Basic',
            color: '#f06595',
            size: 44,
            speed: 95,
            health: 50,
            touchDamage: 12,
            value: 14,
            score: 12
        },
        fast: {
            name: 'Fast',
            color: '#ffe066',
            size: 32,
            speed: 170,
            health: 30,
            touchDamage: 9,
            value: 12,
            score: 14
        },
        tank: {
            name: 'Tank',
            color: '#74c0fc',
            size: 56,
            speed: 62,
            health: 155,
            touchDamage: 22,
            value: 30,
            score: 28
        },
        ranged: {
            name: 'Ranged',
            color: '#63e6be',
            size: 40,
            speed: 78,
            health: 60,
            touchDamage: 10,
            value: 20,
            score: 18,
            preferredRange: 220,
            shootInterval: 1600,
            projectileSpeed: 280,
            projectileDamage: 12
        },
        exploder: {
            name: 'Exploder',
            color: '#ff922b',
            size: 38,
            speed: 115,
            health: 45,
            touchDamage: 16,
            value: 24,
            score: 22,
            explosionRadius: 96,
            explosionDamage: 28
        }
    },
    wave: {
        preparationDuration: 8000,
        baseCount: 8,
        growthPerWave: 4,
        baseSpawnInterval: 1200,
        minSpawnInterval: 350
    },
    drops: {
        baseChance: 0.24,
        durationMs: 7000,
        coinBurst: 14
    },
    visuals: {
        hitFlashMs: 120,
        deathFadeMs: 1400,
        screenShakeDecay: 0.84
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dom = this.cacheDOM();

        this.images = {};
        this.audioCtx = null;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.gameState = 'init';
        this.lastTimestamp = performance.now();

        this.meta = this.loadMetaProgress();
        this.bestRun = this.loadBestRun();

        this.baseShopDefinitions = [
            { id: 'speed', label: 'Movement Speed', baseCost: 45, scale: 1.38, apply: () => (this.runUpgrades.speed += 1), tooltip: 'Run 8% faster pro level.' },
            { id: 'damage', label: 'Weapon Damage', baseCost: 55, scale: 1.45, apply: () => (this.runUpgrades.damage += 1), tooltip: 'Increase base projectile damage.' },
            { id: 'maxHealth', label: 'Max Health', baseCost: 65, scale: 1.42, apply: () => (this.runUpgrades.maxHealth += 1), tooltip: 'More survivability each run.' },
            { id: 'fireRate', label: 'Fire Rate', baseCost: 70, scale: 1.48, apply: () => (this.runUpgrades.fireRate += 1), tooltip: 'Shoot faster with all weapons.' },
            { id: 'critChance', label: 'Crit Chance', baseCost: 60, scale: 1.5, apply: () => (this.runUpgrades.critChance += 1), tooltip: 'Chance for 2x critical hits.' },
            { id: 'ammoCap', label: 'Ammo Capacity', baseCost: 50, scale: 1.34, apply: () => (this.runUpgrades.ammoCap += 1), tooltip: 'Larger magazines before reload.' },
            { id: 'reload', label: 'Reload Speed', baseCost: 50, scale: 1.34, apply: () => (this.runUpgrades.reload += 1), tooltip: 'Shorter reload times.' },
            { id: 'pickupRadius', label: 'Pickup Radius', baseCost: 40, scale: 1.36, apply: () => (this.runUpgrades.pickupRadius += 1), tooltip: 'Collect drops from farther away.' }
        ];

        this.metaUpgradeDefs = [
            { id: 'survivor', label: '+10 Start HP', baseCost: 10, scale: 1.7, maxLevel: 8, apply: () => this.meta.survivor++ },
            { id: 'prospector', label: '+15 Start Coins', baseCost: 12, scale: 1.8, maxLevel: 6, apply: () => this.meta.prospector++ },
            { id: 'arsenal', label: 'Unlock Shotgun', baseCost: 24, scale: 1, maxLevel: 1, apply: () => (this.meta.arsenal = 1) },
            { id: 'veteran', label: '+4% Start Damage', baseCost: 15, scale: 1.7, maxLevel: 7, apply: () => this.meta.veteran++ }
        ];

        this.setupInputHandlers();
        this.createShopUI();
        this.createMetaUI();
        this.assetsReady = false;
        this.loadingAssets = false;
        this.resize();
        this.resetRun(true);
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    cacheDOM() {
        return {
            startScreen: document.getElementById('startScreen'),
            deathScreen: document.getElementById('deathScreen'),
            pauseMenu: document.getElementById('pauseMenu'),
            waveComplete: document.getElementById('waveComplete'),
            startButton: document.getElementById('startButton'),
            restartButton: document.getElementById('restartButton'),
            menuButton: document.getElementById('menuButton'),
            pauseResume: document.getElementById('pauseResume'),
            pauseRestart: document.getElementById('pauseRestart'),
            pauseMenuBtn: document.getElementById('pauseMenuBtn'),
            health: document.getElementById('health'),
            stamina: document.getElementById('stamina'),
            score: document.getElementById('score'),
            coins: document.getElementById('coins'),
            wave: document.getElementById('wave'),
            waveRemaining: document.getElementById('waveRemaining'),
            weapon: document.getElementById('weapon'),
            ammo: document.getElementById('ammo'),
            waveStatus: document.getElementById('waveStatus'),
            finalScore: document.getElementById('finalScore'),
            finalWave: document.getElementById('finalWave'),
            finalKills: document.getElementById('finalKills'),
            finalMeta: document.getElementById('finalMeta'),
            bestRun: document.getElementById('bestRun'),
            waveBonus: document.getElementById('waveBonus'),
            shopRows: document.getElementById('shopRows'),
            activeBuffs: document.getElementById('activeBuffs'),
            metaCredits: document.getElementById('metaCredits'),
            metaRows: document.getElementById('metaRows')
        };
    }

    loadAssets() {
        if (this.assetsReady) return Promise.resolve();
        if (this.loadingAssets) return this.loadingAssets;

        const imageMap = {
            background: 'assets/game-background.png',
            player: 'assets/player-avatar.png',
            basic: 'assets/enemy-basic.png',
            fast: 'assets/enemy-fast.png',
            tank: 'assets/enemy-tank.png',
            ranged: 'assets/enemy-ranged.png',
            exploder: 'assets/enemy-exploder.png'
        };

        this.loadingAssets = new Promise((resolve) => {
            let loaded = 0;
            const total = Object.keys(imageMap).length;

            const onAssetDone = () => {
                loaded += 1;
                if (loaded === total) {
                    this.assetsReady = true;
                    this.loadingAssets = null;
                    this.dom.waveStatus.textContent = 'Assets loaded. Press Start Run.';
                    resolve();
                }
            };

            Object.entries(imageMap).forEach(([key, src]) => {
                const img = new Image();
                img.decoding = 'async';
                img.loading = 'eager';
                img.src = src;
                img.onload = () => {
                    this.images[key] = img;
                    onAssetDone();
                };
                img.onerror = () => onAssetDone();
            });
        });

        return this.loadingAssets;
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') {
                this.togglePause();
            }
            if (e.key.toLowerCase() === 'q' && this.gameState === 'playing') {
                this.switchWeapon();
            }
            if (e.key.toLowerCase() === 'r' && this.gameState === 'playing') {
                this.startReload();
            }
            if (e.key === 'Shift' && this.gameState === 'playing') {
                this.tryDash();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', (e) => this.handleShootInput(e));

        this.dom.startButton.addEventListener('click', async () => {
            if (this.assetsReady || this.loadingAssets) return;
            this.dom.waveStatus.textContent = 'Loading assets...';
            this.dom.startButton.disabled = true;
            await this.loadAssets();
            this.dom.startButton.disabled = false;
            this.startRun();
        });
        this.dom.restartButton.addEventListener('click', () => this.restart());
        this.dom.menuButton.addEventListener('click', () => this.backToMenu());
        this.dom.pauseResume.addEventListener('click', () => this.togglePause());
        this.dom.pauseRestart.addEventListener('click', () => this.restart());
        this.dom.pauseMenuBtn.addEventListener('click', () => this.backToMenu());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    loadMetaProgress() {
        const fallback = { credits: 0, survivor: 0, prospector: 0, arsenal: 0, veteran: 0 };
        const raw = localStorage.getItem(STORAGE_KEYS.META);
        if (!raw) return fallback;
        try {
            return { ...fallback, ...JSON.parse(raw) };
        } catch {
            return fallback;
        }
    }

    saveMeta() {
        localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(this.meta));
    }

    loadBestRun() {
        const raw = localStorage.getItem(STORAGE_KEYS.HIGH_RUN);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    saveBestRun(run) {
        localStorage.setItem(STORAGE_KEYS.HIGH_RUN, JSON.stringify(run));
        this.bestRun = run;
    }

    createShopUI() {
        this.dom.shopRows.innerHTML = '';
        this.baseShopDefinitions.forEach((def) => {
            const row = document.createElement('button');
            row.className = 'shop-btn';
            row.dataset.id = def.id;
            row.title = def.tooltip;
            row.addEventListener('click', () => this.buyShopUpgrade(def.id));
            this.dom.shopRows.appendChild(row);
        });
    }

    createMetaUI() {
        this.dom.metaRows.innerHTML = '';
        this.metaUpgradeDefs.forEach((def) => {
            const btn = document.createElement('button');
            btn.className = 'meta-btn';
            btn.dataset.id = def.id;
            btn.addEventListener('click', () => this.buyMetaUpgrade(def.id));
            this.dom.metaRows.appendChild(btn);
        });
    }

    resetRun(initial = false) {
        this.runStats = {
            score: 0,
            kills: 0,
            elapsedMs: 0,
            wave: 1,
            coins: 0,
            incomingDamageFlash: 0,
            shake: 0,
            killsInWave: 0
        };

        this.runUpgrades = {
            speed: 0,
            damage: 0,
            maxHealth: 0,
            fireRate: 0,
            critChance: 0,
            ammoCap: 0,
            reload: 0,
            pickupRadius: 0
        };

        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: GAME_CONFIG.player.width,
            height: GAME_CONFIG.player.height,
            speed: GAME_CONFIG.player.baseSpeed,
            maxHealth: GAME_CONFIG.player.baseHealth + this.meta.survivor * 10,
            health: GAME_CONFIG.player.baseHealth + this.meta.survivor * 10,
            stamina: GAME_CONFIG.player.maxStamina,
            coins: this.meta.prospector * 15,
            baseDamage: 16 * (1 + this.meta.veteran * 0.04),
            pickupRadius: 70,
            shield: 0,
            reloadUntil: 0,
            weaponIds: ['pistol'],
            weaponIndex: 0,
            ammoInMag: 0,
            lastShotAt: 0,
            lastDamageAt: 0,
            dashUntil: 0,
            dashCooldownUntil: 0
        };

        if (this.meta.arsenal > 0) {
            this.player.weaponIds.push('shotgun');
        }

        this.wave = {
            status: 'prep',
            prepEndAt: performance.now() + (initial ? 1200 : GAME_CONFIG.wave.preparationDuration),
            targetKills: this.getWaveKillTarget(1),
            spawned: 0,
            killed: 0,
            nextSpawnAt: 0,
            spawnInterval: GAME_CONFIG.wave.baseSpawnInterval
        };

        this.enemies = [];
        this.enemyProjectiles = [];
        this.playerProjectiles = [];
        this.pickups = [];
        this.particles = [];
        this.activeBuffs = [];

        this.syncWeaponState(true);
        this.updateBestRunUI();
    }

    startRun() {
        this.resetRun();
        this.gameState = 'playing';
        this.dom.startScreen.style.display = 'none';
        this.dom.deathScreen.style.display = 'none';
        this.dom.pauseMenu.style.display = 'none';
        this.dom.waveStatus.textContent = 'Prepare... Shop and breathe.';
    }

    restart() {
        this.startRun();
    }

    backToMenu() {
        this.gameState = 'init';
        this.dom.pauseMenu.style.display = 'none';
        this.dom.deathScreen.style.display = 'none';
        this.dom.startScreen.style.display = 'flex';
        this.dom.waveStatus.textContent = 'Press Start Run.';
        this.resetRun(true);
    }

    get currentWeapon() {
        return GAME_CONFIG.weapons[this.player.weaponIds[this.player.weaponIndex]];
    }

    getWaveKillTarget(waveNumber) {
        return GAME_CONFIG.wave.baseCount + (waveNumber - 1) * GAME_CONFIG.wave.growthPerWave;
    }

    syncWeaponState(forceFill = false) {
        const weapon = this.currentWeapon;
        const cap = Math.round(weapon.ammoCapacity * (1 + this.runUpgrades.ammoCap * 0.1));
        if (forceFill || this.player.ammoInMag > cap) {
            this.player.ammoInMag = cap;
        }
    }

    switchWeapon() {
        this.player.weaponIndex = (this.player.weaponIndex + 1) % this.player.weaponIds.length;
        this.syncWeaponState(true);
        this.playTone(660, 0.04, 'square');
    }

    startReload() {
        const weapon = this.currentWeapon;
        const cap = Math.round(weapon.ammoCapacity * (1 + this.runUpgrades.ammoCap * 0.1));
        if (this.player.ammoInMag >= cap || performance.now() < this.player.reloadUntil) return;
        const speedMult = 1 - Math.min(0.45, this.runUpgrades.reload * 0.06);
        this.player.reloadUntil = performance.now() + weapon.reloadTime * speedMult;
        this.playTone(250, 0.05, 'sawtooth');
    }

    finishReloadIfNeeded(now) {
        if (this.player.reloadUntil > 0 && now >= this.player.reloadUntil) {
            this.player.reloadUntil = 0;
            this.syncWeaponState(true);
            this.playTone(520, 0.06, 'triangle');
        }
    }

    tryDash() {
        const now = performance.now();
        if (now < this.player.dashCooldownUntil || this.player.stamina < GAME_CONFIG.player.dashCost) return;
        this.player.stamina -= GAME_CONFIG.player.dashCost;
        this.player.dashUntil = now + 180;
        this.player.dashCooldownUntil = now + GAME_CONFIG.player.dashCooldown;
        this.runStats.shake = Math.max(this.runStats.shake, 6);
        this.playTone(760, 0.05, 'square');
    }

    buyShopUpgrade(id) {
        if (!(this.gameState === 'playing' || this.gameState === 'waveComplete')) return;
        const def = this.baseShopDefinitions.find((entry) => entry.id === id);
        const lvl = this.runUpgrades[id];
        const cost = Math.floor(def.baseCost * Math.pow(def.scale, lvl));
        if (this.player.coins < cost) return;
        this.player.coins -= cost;
        def.apply();
        this.recalculatePlayerDerivedStats();
        this.playTone(480, 0.05, 'triangle');
    }

    buyMetaUpgrade(id) {
        const def = this.metaUpgradeDefs.find((entry) => entry.id === id);
        const level = this.meta[id] || 0;
        if (level >= def.maxLevel) return;
        const cost = Math.floor(def.baseCost * Math.pow(def.scale, level));
        if (this.meta.credits < cost) return;
        this.meta.credits -= cost;
        def.apply();
        this.saveMeta();
        this.createMetaUI();
        this.updateUI();
        this.playTone(310, 0.07, 'triangle');
    }

    recalculatePlayerDerivedStats() {
        this.player.speed = GAME_CONFIG.player.baseSpeed * (1 + this.runUpgrades.speed * 0.08);
        this.player.maxHealth = GAME_CONFIG.player.baseHealth + this.meta.survivor * 10 + this.runUpgrades.maxHealth * 14;
        this.player.health = Math.min(this.player.health, this.player.maxHealth);
        this.player.pickupRadius = 70 + this.runUpgrades.pickupRadius * 16;
        this.syncWeaponState();
    }

    handleShootInput(e) {
        if (this.gameState !== 'playing') return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.tryShoot();
    }

    tryShoot() {
        const now = performance.now();
        const weapon = this.currentWeapon;
        const fireScale = 1 - Math.min(0.55, this.runUpgrades.fireRate * 0.05);
        if (now - this.player.lastShotAt < weapon.fireInterval * fireScale) return;
        if (this.player.reloadUntil > 0) return;
        if (this.player.ammoInMag <= 0) {
            this.startReload();
            return;
        }

        const baseAngle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
        for (let p = 0; p < weapon.pellets; p++) {
            const spread = weapon.spread * (Math.random() - 0.5);
            const angle = baseAngle + spread;
            const speed = weapon.projectileSpeed;
            const critRoll = Math.random();
            const critChance = Math.min(0.45, this.runUpgrades.critChance * 0.035);
            const isCrit = critRoll < critChance;
            const damage = this.player.baseDamage * (1 + this.runUpgrades.damage * 0.15) * weapon.damageMult * (isCrit ? 2 : 1) * this.getDamageBuffMultiplier();
            this.playerProjectiles.push({
                x: this.player.x,
                y: this.player.y,
                radius: weapon.projectileSize,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed,
                damage,
                life: weapon.projectileLife,
                pierce: weapon.pierce + this.getBuffPierceBonus(),
                splashRadius: weapon.splashRadius,
                crit: isCrit
            });
        }

        this.player.ammoInMag -= 1;
        this.player.lastShotAt = now;
        this.playTone(weapon.id === 'shotgun' ? 160 : 430, 0.03, 'square');
        if (this.player.ammoInMag <= 0) this.startReload();
    }

    getDamageBuffMultiplier() {
        return this.activeBuffs.some((buff) => buff.id === 'doubleDamage') ? 2 : 1;
    }

    getBuffPierceBonus() {
        return this.activeBuffs.some((buff) => buff.id === 'piercingShots') ? 2 : 0;
    }

    gameLoop(timestamp) {
        const delta = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
        this.lastTimestamp = timestamp;

        if (this.gameState === 'playing') {
            this.update(delta, timestamp);
        } else if (this.gameState === 'waveComplete' && timestamp >= this.wave.prepEndAt) {
            this.beginNextWave();
        }

        this.render(delta);
        this.updateUI();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(delta, now) {
        this.runStats.elapsedMs += delta * 1000;
        this.finishReloadIfNeeded(now);

        this.handleMovement(delta, now);
        if (this.keys[' ']) this.tryShoot();

        this.updateWave(now);
        this.updateEnemies(delta, now);
        this.updateProjectiles(delta);
        this.updatePickups(delta);
        this.updateBuffs(now);
        this.updateParticles(delta);
        this.handleCollisions(now);
    }

    handleMovement(delta, now) {
        let moveX = 0;
        let moveY = 0;
        if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

        const length = Math.hypot(moveX, moveY) || 1;
        const normalizedX = moveX / length;
        const normalizedY = moveY / length;
        const dashMult = now < this.player.dashUntil ? GAME_CONFIG.player.dashMultiplier : 1;

        this.player.x += normalizedX * this.player.speed * dashMult * delta;
        this.player.y += normalizedY * this.player.speed * dashMult * delta;

        this.player.x = this.clamp(this.player.x, this.player.width / 2, this.canvas.width - this.player.width / 2);
        this.player.y = this.clamp(this.player.y, this.player.height / 2, this.canvas.height - this.player.height / 2);

        this.player.stamina = Math.min(GAME_CONFIG.player.maxStamina, this.player.stamina + GAME_CONFIG.player.staminaRegen * delta);
    }

    updateWave(now) {
        if (this.wave.status === 'prep' && now >= this.wave.prepEndAt) {
            this.beginWave(this.runStats.wave, now);
        }

        if (this.wave.status === 'active' && now >= this.wave.nextSpawnAt && this.wave.spawned < this.wave.targetKills) {
            this.spawnEnemyForWave();
            const adjustedInterval = Math.max(
                GAME_CONFIG.wave.minSpawnInterval,
                GAME_CONFIG.wave.baseSpawnInterval - this.runStats.wave * 65
            );
            this.wave.spawnInterval = adjustedInterval;
            this.wave.nextSpawnAt = now + adjustedInterval;
        }

        const waveDone = this.wave.status === 'active' && this.wave.killed >= this.wave.targetKills && this.enemies.length === 0;
        if (waveDone) {
            this.completeWave(now);
        }
    }

    beginWave(waveNumber, now) {
        this.runStats.wave = waveNumber;
        this.wave.status = 'active';
        this.wave.targetKills = this.getWaveKillTarget(waveNumber);
        this.wave.spawned = 0;
        this.wave.killed = 0;
        this.wave.nextSpawnAt = now + 400;
        this.wave.spawnInterval = Math.max(GAME_CONFIG.wave.minSpawnInterval, GAME_CONFIG.wave.baseSpawnInterval - waveNumber * 65);
        this.dom.waveStatus.textContent = 'Wave active — survive and clear enemies.';

        if (waveNumber === 4 && !this.player.weaponIds.includes('shotgun')) {
            this.player.weaponIds.push('shotgun');
        }
        if (waveNumber === 7 && !this.player.weaponIds.includes('railgun')) {
            this.player.weaponIds.push('railgun');
        }
    }

    beginNextWave() {
        this.dom.waveComplete.style.display = 'none';
        this.gameState = 'playing';
        this.beginWave(this.runStats.wave + 1, performance.now());
    }

    completeWave(now) {
        const bonus = 35 + this.runStats.wave * 12;
        this.player.coins += bonus;
        this.dom.waveBonus.textContent = bonus;
        this.dom.waveComplete.style.display = 'block';
        this.dom.waveStatus.textContent = 'Wave cleared — shop window open.';
        this.wave.status = 'prep';
        this.wave.prepEndAt = now + GAME_CONFIG.wave.preparationDuration;
        this.gameState = 'waveComplete';
        this.playTone(920, 0.08, 'triangle');
    }

    spawnEnemyForWave() {
        const roll = Math.random();
        const waveNo = this.runStats.wave;
        let typeId = 'basic';
        if (waveNo > 1 && roll < 0.25 + waveNo * 0.01) typeId = 'fast';
        if (waveNo > 2 && roll > 0.7) typeId = 'tank';
        if (waveNo > 3 && roll > 0.45 && roll < 0.64) typeId = 'ranged';
        if (waveNo > 5 && roll > 0.87) typeId = 'exploder';

        const type = GAME_CONFIG.enemyTypes[typeId];
        const spawn = this.getSpawnPosition(type.size);
        const hpScale = 1 + this.runStats.wave * 0.12;

        this.enemies.push({
            id: `${typeId}_${Math.random().toString(16).slice(2)}`,
            typeId,
            x: spawn.x,
            y: spawn.y,
            radius: type.size / 2,
            speed: type.speed * (1 + this.runStats.wave * 0.03),
            maxHealth: type.health * hpScale,
            health: type.health * hpScale,
            touchDamage: type.touchDamage,
            value: Math.floor(type.value * (1 + this.runStats.wave * 0.1)),
            score: Math.floor(type.score * (1 + this.runStats.wave * 0.08)),
            preferredRange: type.preferredRange || 0,
            shootInterval: type.shootInterval || 0,
            projectileSpeed: type.projectileSpeed || 0,
            projectileDamage: type.projectileDamage || 0,
            explosionRadius: type.explosionRadius || 0,
            explosionDamage: type.explosionDamage || 0,
            nextShotAt: performance.now() + 650,
            hitFlashUntil: 0
        });

        this.wave.spawned += 1;
    }

    getSpawnPosition(padding) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) return { x: Math.random() * this.canvas.width, y: -padding };
        if (side === 1) return { x: this.canvas.width + padding, y: Math.random() * this.canvas.height };
        if (side === 2) return { x: Math.random() * this.canvas.width, y: this.canvas.height + padding };
        return { x: -padding, y: Math.random() * this.canvas.height };
    }

    updateEnemies(delta, now) {
        this.enemies.forEach((enemy) => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;

            if (enemy.typeId === 'ranged' && dist < enemy.preferredRange * 0.85) {
                enemy.x -= (dx / dist) * enemy.speed * delta * 0.75;
                enemy.y -= (dy / dist) * enemy.speed * delta * 0.75;
            } else {
                enemy.x += (dx / dist) * enemy.speed * delta;
                enemy.y += (dy / dist) * enemy.speed * delta;
            }

            if (enemy.typeId === 'ranged' && now >= enemy.nextShotAt) {
                this.enemyProjectiles.push({
                    x: enemy.x,
                    y: enemy.y,
                    radius: 7,
                    dx: dx / dist,
                    dy: dy / dist,
                    speed: enemy.projectileSpeed,
                    damage: enemy.projectileDamage,
                    life: 2.8
                });
                enemy.nextShotAt = now + enemy.shootInterval;
                this.playTone(130, 0.02, 'sawtooth');
            }
        });
    }

    updateProjectiles(delta) {
        const updateSet = (arr) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const p = arr[i];
                p.x += p.dx * p.speed * delta;
                p.y += p.dy * p.speed * delta;
                p.life -= delta;
                if (p.life <= 0 || p.x < -30 || p.y < -30 || p.x > this.canvas.width + 30 || p.y > this.canvas.height + 30) {
                    arr.splice(i, 1);
                }
            }
        };

        updateSet(this.playerProjectiles);
        updateSet(this.enemyProjectiles);
    }

    updatePickups(delta) {
        this.pickups.forEach((pickup) => {
            pickup.ttl -= delta;
            const dx = this.player.x - pickup.x;
            const dy = this.player.y - pickup.y;
            const dist = Math.hypot(dx, dy) || 1;
            const magnetBonus = this.activeBuffs.some((buff) => buff.id === 'magnet') ? 110 : 0;
            if (dist < this.player.pickupRadius + magnetBonus) {
                pickup.x += (dx / dist) * 290 * delta;
                pickup.y += (dy / dist) * 290 * delta;
            }
        });

        this.pickups = this.pickups.filter((pickup) => pickup.ttl > 0);
    }

    updateBuffs(now) {
        this.activeBuffs = this.activeBuffs.filter((buff) => buff.endsAt > now);
    }

    updateParticles(delta) {
        this.particles.forEach((p) => {
            p.x += p.dx * delta;
            p.y += p.dy * delta;
            p.life -= delta;
        });
        this.particles = this.particles.filter((p) => p.life > 0);
        this.runStats.shake *= GAME_CONFIG.visuals.screenShakeDecay;
    }

    handleCollisions(now) {
        for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
            const proj = this.playerProjectiles[i];
            let removeProjectile = false;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!this.circleHit(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) continue;

                enemy.health -= proj.damage;
                enemy.hitFlashUntil = now + GAME_CONFIG.visuals.hitFlashMs;
                this.spawnHitParticles(enemy.x, enemy.y, proj.crit ? 16 : 7);
                this.runStats.shake = Math.max(this.runStats.shake, proj.crit ? 8 : 3);

                if (enemy.health <= 0) {
                    this.killEnemy(j, enemy);
                }

                if (proj.pierce > 0) {
                    proj.pierce -= 1;
                } else {
                    removeProjectile = true;
                }
                break;
            }

            if (removeProjectile) this.playerProjectiles.splice(i, 1);
        }

        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const proj = this.enemyProjectiles[i];
            if (this.circleHit(proj.x, proj.y, proj.radius, this.player.x, this.player.y, this.player.width / 2)) {
                this.enemyProjectiles.splice(i, 1);
                this.damagePlayer(proj.damage);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.circleHit(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.width * 0.45)) {
                this.enemies.splice(i, 1);
                this.damagePlayer(enemy.touchDamage);
                if (enemy.typeId === 'exploder') this.triggerExplosion(enemy.x, enemy.y, enemy.explosionRadius, enemy.explosionDamage);
            }
        }

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            if (this.circleHit(this.player.x, this.player.y, this.player.width / 2, pickup.x, pickup.y, pickup.radius)) {
                this.applyPickup(pickup);
                this.pickups.splice(i, 1);
            }
        }
    }

    killEnemy(index, enemy) {
        this.enemies.splice(index, 1);
        this.runStats.kills += 1;
        this.wave.killed += 1;
        this.runStats.killsInWave += 1;
        this.runStats.score += enemy.score;
        this.player.coins += enemy.value;

        if (enemy.typeId === 'exploder') {
            this.triggerExplosion(enemy.x, enemy.y, enemy.explosionRadius, enemy.explosionDamage, false);
        }

        if (Math.random() < GAME_CONFIG.drops.baseChance) {
            this.spawnPickup(enemy.x, enemy.y);
        }

        this.playTone(220 + Math.random() * 140, 0.03, 'triangle');
    }

    triggerExplosion(x, y, radius, damage, hurtsEnemies = true) {
        this.runStats.shake = Math.max(this.runStats.shake, 12);
        this.spawnHitParticles(x, y, 20, '#ff922b');
        this.playTone(90, 0.09, 'sawtooth');

        if (this.circleHit(x, y, radius, this.player.x, this.player.y, this.player.width / 2)) {
            this.damagePlayer(damage);
        }

        if (hurtsEnemies) {
            this.enemies.forEach((enemy) => {
                if (this.circleHit(x, y, radius, enemy.x, enemy.y, enemy.radius)) {
                    enemy.health -= damage * 0.7;
                }
            });
        }
    }

    spawnPickup(x, y) {
        const pool = ['heal', 'shield', 'speed', 'doubleDamage', 'piercingShots', 'magnet', 'coins'];
        const id = pool[Math.floor(Math.random() * pool.length)];
        this.pickups.push({ x, y, radius: 12, ttl: 16, id });
    }

    applyPickup(pickup) {
        if (pickup.id === 'coins') {
            this.player.coins += GAME_CONFIG.drops.coinBurst;
            return;
        }
        if (pickup.id === 'heal') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 45);
            return;
        }
        if (pickup.id === 'shield') {
            this.player.shield = Math.min(60, this.player.shield + 28);
            return;
        }

        const buff = { id: pickup.id, endsAt: performance.now() + GAME_CONFIG.drops.durationMs };
        this.activeBuffs = this.activeBuffs.filter((active) => active.id !== pickup.id);
        this.activeBuffs.push(buff);
    }

    damagePlayer(amount) {
        const now = performance.now();
        if (now - this.player.lastDamageAt < GAME_CONFIG.player.invulnerabilityMs) return;

        let incoming = amount;
        if (this.player.shield > 0) {
            const absorbed = Math.min(this.player.shield, incoming);
            this.player.shield -= absorbed;
            incoming -= absorbed;
        }

        if (incoming > 0) {
            this.player.health -= incoming;
        }

        this.player.lastDamageAt = now;
        this.runStats.incomingDamageFlash = now + 120;
        this.runStats.shake = Math.max(this.runStats.shake, 5);
        this.playTone(110, 0.06, 'square');

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        const metaGain = Math.floor(this.runStats.score / 45 + this.runStats.wave * 2 + this.runStats.kills * 0.4);
        this.meta.credits += metaGain;
        this.saveMeta();

        const runPower = this.runStats.score + this.runStats.wave * 100 + this.runStats.kills * 6;
        if (!this.bestRun || runPower > this.bestRun.runPower) {
            this.saveBestRun({
                score: this.runStats.score,
                wave: this.runStats.wave,
                kills: this.runStats.kills,
                runPower,
                date: new Date().toISOString()
            });
        }

        this.dom.finalScore.textContent = this.runStats.score;
        this.dom.finalWave.textContent = this.runStats.wave;
        this.dom.finalKills.textContent = this.runStats.kills;
        this.dom.finalMeta.textContent = metaGain;
        this.dom.deathScreen.style.display = 'block';
        this.updateBestRunUI();
    }

    updateBestRunUI() {
        if (!this.bestRun) {
            this.dom.bestRun.textContent = 'Best Run: none';
            return;
        }
        this.dom.bestRun.textContent = `Best Run: Score ${this.bestRun.score}, Wave ${this.bestRun.wave}, Kills ${this.bestRun.kills}`;
    }

    togglePause() {
        if (this.gameState === 'init' || this.gameState === 'gameover') return;
        if (this.gameState === 'paused') {
            this.gameState = this.wave.status === 'prep' ? 'waveComplete' : 'playing';
            this.dom.pauseMenu.style.display = 'none';
        } else {
            this.gameState = 'paused';
            this.dom.pauseMenu.style.display = 'flex';
        }
    }

    updateUI() {
        this.recalculatePlayerDerivedStats();
        const waveRemaining = Math.max(0, this.wave.targetKills - this.wave.killed);
        const weapon = this.currentWeapon;

        this.dom.health.textContent = `HP: ${Math.ceil(this.player.health)} / ${Math.ceil(this.player.maxHealth)} ${this.player.shield > 0 ? `(Shield ${Math.ceil(this.player.shield)})` : ''}`;
        this.dom.stamina.textContent = `Stamina: ${Math.ceil(this.player.stamina)} / ${GAME_CONFIG.player.maxStamina}`;
        this.dom.score.textContent = `Score: ${this.runStats.score}`;
        this.dom.coins.textContent = `Coins: ${this.player.coins}`;
        this.dom.wave.textContent = `Wave: ${this.runStats.wave}`;
        this.dom.waveRemaining.textContent = `Remaining: ${waveRemaining}`;
        this.dom.weapon.textContent = `Weapon: ${weapon.name}`;
        this.dom.ammo.textContent = this.player.reloadUntil > 0 ? 'Reloading...' : `Ammo: ${this.player.ammoInMag}`;

        this.dom.activeBuffs.textContent = this.activeBuffs.length > 0
            ? this.activeBuffs.map((b) => b.id).join(', ')
            : 'none';

        this.baseShopDefinitions.forEach((def) => {
            const lvl = this.runUpgrades[def.id];
            const cost = Math.floor(def.baseCost * Math.pow(def.scale, lvl));
            const btn = this.dom.shopRows.querySelector(`[data-id="${def.id}"]`);
            btn.textContent = `${def.label} Lv.${lvl} — ${cost}c`;
            btn.disabled = this.player.coins < cost;
        });

        this.dom.metaCredits.textContent = this.meta.credits;
        this.metaUpgradeDefs.forEach((def) => {
            const lvl = this.meta[def.id] || 0;
            const cost = Math.floor(def.baseCost * Math.pow(def.scale, lvl));
            const btn = this.dom.metaRows.querySelector(`[data-id="${def.id}"]`);
            const maxed = lvl >= def.maxLevel;
            btn.textContent = maxed ? `${def.label} (MAX)` : `${def.label} Lv.${lvl} — ${cost} MC`;
            btn.disabled = maxed || this.meta.credits < cost;
        });
    }

    render() {
        const shakeX = (Math.random() - 0.5) * this.runStats.shake;
        const shakeY = (Math.random() - 0.5) * this.runStats.shake;
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(shakeX, shakeY);

        if (this.images.background) {
            this.ctx.drawImage(this.images.background, -20, -20, this.canvas.width + 40, this.canvas.height + 40);
        } else {
            this.ctx.fillStyle = '#0f1224';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.renderPickups();
        this.renderProjectiles();
        this.renderEnemies();
        this.renderPlayer();
        this.renderParticles();

        this.ctx.restore();

        if (performance.now() < this.runStats.incomingDamageFlash) {
            this.ctx.fillStyle = 'rgba(255, 71, 87, 0.18)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderEnemies() {
        this.enemies.forEach((enemy) => {
            const img = this.images[enemy.typeId];
            if (img) {
                this.ctx.drawImage(img, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
            } else {
                this.ctx.fillStyle = GAME_CONFIG.enemyTypes[enemy.typeId].color;
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (performance.now() < enemy.hitFlashUntil) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, enemy.radius * 2, 6);
            this.ctx.fillStyle = '#69db7c';
            this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, enemy.radius * 2 * hpRatio, 6);
        });
    }

    renderProjectiles() {
        this.playerProjectiles.forEach((proj) => {
            this.ctx.fillStyle = proj.crit ? '#ffe066' : '#f8f9fa';
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.enemyProjectiles.forEach((proj) => {
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderPlayer() {
        if (this.images.player) {
            this.ctx.drawImage(
                this.images.player,
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            );
        } else {
            this.ctx.fillStyle = '#4dabf7';
            this.ctx.fillRect(
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            );
        }

        if (performance.now() < this.player.dashUntil) {
            this.ctx.strokeStyle = 'rgba(77,171,247,0.7)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.width * 0.65, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    renderPickups() {
        const colors = {
            heal: '#51cf66',
            shield: '#74c0fc',
            speed: '#fcc419',
            doubleDamage: '#ff6b6b',
            piercingShots: '#a78bfa',
            magnet: '#63e6be',
            coins: '#ffd43b'
        };

        this.pickups.forEach((pickup) => {
            this.ctx.fillStyle = colors[pickup.id] || '#fff';
            this.ctx.beginPath();
            this.ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderParticles() {
        this.particles.forEach((p) => {
            this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.globalAlpha = 1;
        });
    }

    spawnHitParticles(x, y, count, color = '#ffffff') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 200;
            const life = 0.2 + Math.random() * 0.35;
            this.particles.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                life,
                maxLife: life,
                color
            });
        }
    }

    circleHit(x1, y1, r1, x2, y2, r2) {
        return Math.hypot(x2 - x1, y2 - y1) <= r1 + r2;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    playTone(freq, duration = 0.05, type = 'square') {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const oscillator = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            oscillator.type = type;
            oscillator.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.06, this.audioCtx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
            oscillator.connect(gain);
            gain.connect(this.audioCtx.destination);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration);
        } catch {
            // no-op if audio is blocked
        }
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
});
