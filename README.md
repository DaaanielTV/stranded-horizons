# Stranded Horizons

> Leichtgewichtiges Browser Survival Game – Vanilla HTML, CSS, JavaScript. Ohne Backend, ohne Build-Step.

Entstanden am 08.04.2025 – first commit `3a668c7` mit 18 Dateien. Im ersten Draft hieß die Idee noch viel größer – `PROJECT-IDEA` mit Character Creation, Builder/Scout/Medic/Engineer, Stamina & Co. Am Ende wurde es ein fokussiertes Wave-Survival.

### Entstehung

Ich wollte schon immer ein (Browser) Spiel bauen, vor allem RPG. Hatte nie die Zeit, jetzt noch weniger um kreativ zu sein. Das ist das einzige Projekt wo ich Auto-Deploys zu Vercel habe – Free Tier wird um Weltjahre nicht ausgelastet. Nur Hater die nie was probieren sagen da was, um nie etwas proven zu müssen xD.

Ursprünglich als Multiplayer Survival auf einer Insel geplant, jetzt als Singleplayer Wave-Shooter umgesetzt – ideal um Vanilla JS Game-Loop zu lernen.

### Was ist das?

Du steuerst einen Survivor, wehrst Wellen ab, sammelst Coins und kaufst Upgrades. HTML5 Canvas, Echtzeit Game-Loop.

**Features:**
- Pure Front-End – kein Framework, kein Build
- Canvas Rendering + Game-Loop
- WASD / Pfeiltasten + Maus Aim/Shoot
- Wave Spawning
- Shop für Speed & Damage Upgrades
- Highscore in `localStorage`

### Installation

**Option 1: Git**
```bash
git clone <repo-url>
cd stranded-horizons
```

**Option 2:** ZIP downloaden und entpacken.

### Nutzung

`index.html` im Browser öffnen, **Play Now** klicken.

Für Dev besser mit static Server:
```bash
python3 -m http.server 8000
# -> http://localhost:8000
```

### Konfiguration

Alle Balancing Werte direkt in `game.js`:
- `health`, `speed`, `damage`
- Enemy Spawn Intervall
- Upgrade Preise

Wenn du Assets verschiebst, Pfade in `game.js` + `index.html` anpassen.

### Repo Struktur

- `index.html` – Landing
- `game.html` – Game Screen
- `game.js` – Logik
- `assets/` – Bilder
- `devlog/` – Screenshots & Notizen

### Zukunft – Loop Engineering Experiment

Ich will hier bald mein KVM-Konzept anwenden – mein Ubuntu Cloud VPS als Hypervisor:

- **VM1 Worker** – 3 Git Worktrees + OpenCode/Puppeteer Agents (UI/Audio, Gameplay, Balancing)
- **VM2 Production** – NGINX, hosted Game
- **VM3 Management** – FastAPI Dashboard mit `STATUS.md` Feedback Loop, CI_SUCCESS/FAILURE Handling, Merge Konflikte

Ziel: Ein 24/7 Loop der das Vanilla JS Spiel selbst weiterentwickelt – quasi Auto-Dev für ein Browser Game. Gespannt sein ^^

### Troubleshooting

- **Schwarzer Screen**: JS aktiviert? Asset Pfade prüfen
- **Kein Input**: Auf Canvas klicken für Fokus
- **Assets laden nicht**: Dateinamen in `assets/` exakt wie in `game.js`
- **Local File Block**: Statt Doppelklick `http.server` nutzen

### Lizenz

GNU GPLv3 – siehe [LICENSE](LICENSE).
