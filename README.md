# Stranded Horizons

Stranded Horizons is a lightweight browser game built with vanilla HTML, CSS, and JavaScript. You control a survivor, fend off enemy waves, earn coins, and buy upgrades to stay alive longer.

## Project Overview

This repository contains the complete source code for the game client and static assets. It is designed to run locally without a backend service or package manager.

## Features / Purpose

- Pure front-end implementation (no framework, no build step required)
- HTML5 Canvas rendering and real-time game loop
- Keyboard movement (WASD / arrow keys) and mouse aiming/shooting
- Wave-based enemy spawning
- In-game shop for speed and damage upgrades
- Local high score persistence via `localStorage`

## Installation

### Option 1: Clone with Git

```bash
git clone <your-fork-or-repo-url>
cd stranded-horizons
```

### Option 2: Download Source

Download the repository as a ZIP and extract it.

## Usage

Open `index.html` in a modern browser, then click **Play Now** to start.

## Development Setup

No package install is required. For best local development experience, run a simple static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Configuration

Current gameplay tuning values are set directly in `game.js`, including:

- player stats (`health`, `speed`, `damage`)
- enemy spawn interval
- upgrade prices

If you change asset locations, update paths in both `game.js` and `index.html`.

## Build / Run Instructions

This project does not use precompiled artifacts. The source files in this repository are the runnable game.

- **Run:** open `index.html` (or use a static server)
- **Build:** not required
- **Regenerate assets:** add/edit source images under `assets/` and reference them from HTML/JS

## Troubleshooting

- **Blank screen or no rendering:** ensure JavaScript is enabled and all asset paths resolve.
- **Input not responding:** click the game canvas first so it receives focus.
- **Assets fail to load:** verify file names in `assets/` exactly match references in `game.js`.
- **Local file restrictions:** if your browser blocks local loading behavior, use a static server (`python3 -m http.server 8000`).

## Repository Structure

- `index.html` — landing page
- `game.html` — game screen
- `game.js` — game logic
- `assets/` — image assets
- `devlog/` — progress screenshots and notes

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.
