// ============================================================
// GAME.JS — Main engine: scene loading, game loop, rendering,
// save/load, story flags, pause menu, vision cutscene.
//
// This is intentionally the only file that knows about "the
// whole game" — scenes, entities, dialogue, and sprites are all
// self-contained modules it wires together. That separation is
// what will make it possible to bolt on multiplayer later
// (see MULTIPLAYER-NOTES.md) without rewriting this file.
// ============================================================

const Game = {
  canvas: null, ctx: null,
  player: null,
  currentScene: null,
  entities: [],
  solids: [],
  flags: {},
  paused: false,
  lastTime: 0,
  lastBlockedToast: 0,
  toastTimer: 0,

  async init() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    await Art.load();

    this.player = new Player(60, 130);

    Input.init();
    this._bindUI();

    const save = await Storage.load("ww-save");
    if (save) {
      this.flags = save.flags || {};
      this.player.stage = save.stage || "child";
      this.player.maxHp = save.maxHp || STAGE_MAXHP.child;
      this.player.hp = save.hp != null ? save.hp : this.player.maxHp;
      this.loadScene(save.sceneId || "greenvale", { x: save.playerX || 60, y: save.playerY || 130, dir: save.playerDir || "down" });
      this.showToast("Welcome back to Whispering Woods");
    } else {
      this.loadScene("greenvale", { x: 60, y: 130, dir: "down" });
      setTimeout(() => this.showToast("Use the joystick / arrow keys to move"), 600);
    }

    document.getElementById("dialogueBox").addEventListener("click", () => DialogueSys.advance());
    document.body.addEventListener("touchstart", () => AudioSys.resume(), { once: true });
    document.body.addEventListener("mousedown", () => AudioSys.resume(), { once: true });
    AudioSys.init();

    window.addEventListener("resize", () => this._resizeCanvasDisplay());
    window.addEventListener("orientationchange", () => setTimeout(() => this._resizeCanvasDisplay(), 100));

    requestAnimationFrame((t) => this.loop(t));
  },

  _bindUI() {
    document.getElementById("pauseBtn").onclick = () => this.togglePause();
    document.getElementById("resumeBtn").onclick = () => this.togglePause();
    document.getElementById("saveBtn").onclick = async () => {
      await this.persistState();
      this.showToast("Game saved");
    };
    document.getElementById("loadBtn").onclick = async () => {
      const save = await Storage.load("ww-save");
      if (!save) { this.showToast("No save found"); return; }
      this.flags = save.flags || {};
      this.player.stage = save.stage || "child";
      this.player.maxHp = save.maxHp || STAGE_MAXHP.child;
      this.player.hp = save.hp != null ? save.hp : this.player.maxHp;
      this.loadScene(save.sceneId || "greenvale", { x: save.playerX || 60, y: save.playerY || 130, dir: save.playerDir || "down" });
      document.getElementById("pauseMenu").style.display = "none";
      this.paused = false;
      this.showToast("Game loaded");
    };
    document.getElementById("restartBtn").onclick = () => {
      this.flags = {};
      this.player.stage = "child";
      this.player.maxHp = STAGE_MAXHP.child;
      this.player.hp = this.player.maxHp;
      this.loadScene("greenvale", { x: 60, y: 130, dir: "down" });
      document.getElementById("pauseMenu").style.display = "none";
      this.paused = false;
      this.showToast("Slice restarted");
    };
  },

  togglePause() {
    if (DialogueSys.active) return;
    this.paused = !this.paused;
    document.getElementById("pauseMenu").style.display = this.paused ? "flex" : "none";
  },

  setPaused(v) { this.paused = v; },

  setFlag(key, value) {
    this.flags[key] = value;
    this.persistState();
  },

  async persistState() {
    await Storage.save("ww-save", {
      flags: this.flags,
      sceneId: this.currentScene.id,
      playerX: this.player.x,
      playerY: this.player.y,
      playerDir: this.player.dir,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      stage: this.player.stage,
    });
  },

  showToast(text, duration = 2.4) {
    const el = document.getElementById("toast");
    el.textContent = text;
    el.style.opacity = "1";
    this.toastTimer = duration;
  },

  loadScene(id, spawn) {
    const def = SCENES[id];
    if (!def) return;

    if (!def._pruned) {
      pruneExitBlockers(def);
      def._pruned = true;
    }

    this.currentScene = def;
    this.currentGroundGrid = def.build();

    this.canvas.width = def.cols * TILE;
    this.canvas.height = def.rows * TILE;
    this._resizeCanvasDisplay();

    this._buildGroundCache(def);

    this.solids = def.decorations.filter((d) => d.solid).map(getDecorationSolidRect);

    const interactables = def.decorations
      .filter((d) => d.interactKey)
      .map((d) => (d.type === "dummy" ? new TrainingDummy(d) : new Interactable(d)));
    const npcEntities = def.npcs.map((n) => makeEntity(n));
    this.entities = [...interactables, ...npcEntities];

    this.player.x = spawn.x;
    this.player.y = spawn.y;
    if (spawn.dir) this.player.dir = spawn.dir;

    AudioSys.setAmbient(def.ambient);
    document.getElementById("locationLabel").textContent = def.name.toUpperCase();
  },

  _paintReferenceGrass(cctx, px, py, x, y, flower = false) {
    const hash = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
    cctx.fillStyle = "#1b351f";
    cctx.fillRect(px, py, TILE, TILE);
    cctx.fillStyle = "#254824";
    for (let i = 0; i < 5; i++) {
      const gx = px + 1 + Math.floor(hash(x * 71 + y * 31 + i * 13) * 14);
      const gy = py + 3 + Math.floor(hash(x * 19 + y * 47 + i * 17) * 11);
      cctx.fillRect(gx, gy, 1, 2);
      if (i % 2 === 0) cctx.fillRect(gx + 1, gy - 1, 1, 2);
    }
    cctx.fillStyle = "#345c2b";
    for (let i = 0; i < 3; i++) {
      const gx = px + 2 + Math.floor(hash(x * 43 + y * 67 + i * 29) * 12);
      const gy = py + 4 + Math.floor(hash(x * 83 + y * 23 + i * 11) * 9);
      cctx.fillRect(gx, gy, 2, 1);
      cctx.fillRect(gx + 1, gy - 2, 1, 2);
    }
    if (flower) {
      const colors = ["#ead9a5", "#e99a9c", "#b795d6", "#e6ae46"];
      cctx.fillStyle = colors[(x + y) % colors.length];
      cctx.fillRect(px + 5 + ((x * 3 + y) % 5), py + 5 + ((y * 2 + x) % 5), 2, 2);
      cctx.fillStyle = "#557a32";
      cctx.fillRect(px + 6 + ((x * 3 + y) % 5), py + 7 + ((y * 2 + x) % 5), 1, 3);
    }
  },

  _paintReferencePath(cctx, px, py, x, y) {
    const hash = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
    cctx.fillStyle = "#9a7748";
    cctx.fillRect(px, py, TILE, TILE);
    const stones = [[2, 2, 5, 3], [9, 4, 5, 3], [4, 10, 4, 3], [11, 12, 3, 2]];
    stones.forEach(([sx, sy, sw, sh], i) => {
      const j = hash(x * 97 + y * 53 + i * 7);
      cctx.fillStyle = j > 0.5 ? "#b9945d" : "#86663f";
      cctx.fillRect(px + sx, py + sy, sw, sh);
      cctx.fillStyle = j > 0.5 ? "#d0ae70" : "#a88450";
      cctx.fillRect(px + sx, py + sy, Math.max(1, sw - 2), 1);
    });
  },

  // Renders ground tiles once per scene load onto an offscreen canvas,
  // instead of every frame. Textures.grass()/grassFlowers() use
  // Math.random() internally to scatter texture detail — calling them
  // every frame would make the ground visibly sparkle at 60fps, so we
  // bake the randomness in once and just stamp the result each frame.
  _buildGroundCache(def) {
    const cache = document.createElement("canvas");
    cache.width = def.cols * TILE;
    cache.height = def.rows * TILE;
    const cctx = cache.getContext("2d");

    for (let y = 0; y < this.currentGroundGrid.length; y++) {
      for (let x = 0; x < this.currentGroundGrid[y].length; x++) {
        const tile = this.currentGroundGrid[y][x];
        const px = x * TILE, py = y * TILE;
        if (tile === GROUND.WATER) Textures.water(cctx, px, py, TILE);
        else if (tile === GROUND.PATH) this._paintReferencePath(cctx, px, py, x, y);
        else this._paintReferenceGrass(cctx, px, py, x, y, tile === GROUND.FLOWER);
      }
    }

    this.groundCache = cache;
  },

  findInteractTarget() {
    const range = 24;
    let closest = null, closestDist = Infinity;
    for (const e of this.entities) {
      if (!e.interact) continue;
      const ex = e.x !== undefined ? e.x : e.spriteX;
      const ey = e.y !== undefined ? e.y : e.spriteY;
      const dist = Math.hypot(ex - this.player.x, ey - this.player.y);
      if (dist < range && dist < closestDist) { closest = e; closestDist = dist; }
    }
    return closest;
  },

  checkExits() {
    const box = { x: this.player.x - this.player.w / 2, y: this.player.y - this.player.h / 2, w: this.player.w, h: this.player.h };
    for (const exit of this.currentScene.exits) {
      if (!rectsOverlap(box, exit.rect)) continue;
      if (exit.requiresFlag && !this.flags[exit.requiresFlag]) {
        if (performance.now() - this.lastBlockedToast > 2000) {
          this.showToast("Something blocks the way — deal with the wolf first");
          this.lastBlockedToast = performance.now();
        }
        continue;
      }
      this.loadScene(exit.target, exit.spawn);
      this.persistState();
      return;
    }
  },

  async playVision() {
    this.setPaused(true);
    const overlay = document.getElementById("visionOverlay");
    const textEl = document.getElementById("visionText");
    overlay.style.display = "flex";
    await this._sleep(50);
    overlay.style.transition = "opacity 0.8s";
    overlay.style.opacity = "0.95";
    AudioSys.setAmbient("mystery");

    for (const line of CRYSTAL_VISION_TEXT) {
      textEl.textContent = line;
      textEl.style.transition = "opacity 0.6s";
      textEl.style.opacity = "1";
      await this._sleep(2600);
      textEl.style.opacity = "0";
      await this._sleep(600);
    }

    overlay.style.opacity = "0";
    await this._sleep(800);
    overlay.style.display = "none";
    this.setFlag("visionSeen", true);
    AudioSys.chime();
    AudioSys.setAmbient(this.currentScene.ambient);
    this.setPaused(false);
    this.showToast("A vision lingers in your mind...");
  },

  _sleep(ms) { return new Promise((res) => setTimeout(res, ms)); },

  // A <canvas> with no explicit display size just renders at its native
  // pixel dimensions (e.g. 416x256) — CSS max-width/max-height can only
  // shrink something too big, never grow something too small. This
  // computes the largest size that fits the screen while keeping the
  // scene's aspect ratio, so the game actually fills the viewport
  // instead of sitting small in the middle of a lot of empty space.
  _resizeCanvasDisplay() {
    const root = document.getElementById("gameRoot");
    const availW = root.clientWidth;
    const availH = root.clientHeight;
    const nativeW = this.canvas.width;
    const nativeH = this.canvas.height;
    if (!nativeW || !nativeH || !availW || !availH) return;

    const scale = Math.min(availW / nativeW, availH / nativeH);
    this.canvas.style.width = Math.floor(nativeW * scale) + "px";
    this.canvas.style.height = Math.floor(nativeH * scale) + "px";
  },

  updateHUD() {
    const heartsEl = document.getElementById("hearts");
    heartsEl.innerHTML = "";
    const totalHearts = this.player.maxHp / 2;
    for (let i = 0; i < totalHearts; i++) {
      const heartHp = this.player.hp - i * 2;
      const div = document.createElement("div");
      div.className = "heart" + (heartHp >= 2 ? "" : heartHp === 1 ? " half" : " empty");
      heartsEl.appendChild(div);
    }
    document.getElementById("stageLabel").textContent = this.player.stage.toUpperCase();
  },

  render() {
    const ctx = this.ctx;
    const scene = this.currentScene;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Ground — stamped from the cache built once at scene load
    if (this.groundCache) ctx.drawImage(this.groundCache, 0, 0);

    // Depth-sorted decorations + entities + player
    const drawables = [];
    for (const d of scene.decorations) {
      if (d.interactKey) continue;
      drawables.push({ sortY: d.y + (d.h || 24), draw: () => this._drawDecoration(d) });
    }
    for (const e of this.entities) {
      const ey = e.y !== undefined ? e.y : 0;
      drawables.push({ sortY: ey + 20, draw: () => e.draw(ctx) });
    }
    drawables.push({ sortY: this.player.y, draw: () => this.player.draw(ctx) });
    drawables.sort((a, b) => a.sortY - b.sortY);
    drawables.forEach((d) => d.draw());

    this._drawAtmosphere(ctx, scene);
    this._drawVignette(ctx);
  },

  // Visual-only lighting pass. It reads scene decorations but never changes
  // gameplay state, collision, camera coordinates, or entity behavior.
  _drawAtmosphere(ctx, scene) {
    const w = this.canvas.width, h = this.canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Cool woodland color cast keeps the outer forest moody.
    const forestWash = ctx.createLinearGradient(0, 0, 0, h);
    forestWash.addColorStop(0, "rgba(3, 13, 9, 0.12)");
    forestWash.addColorStop(0.52, "rgba(10, 25, 15, 0.02)");
    forestWash.addColorStop(1, "rgba(2, 10, 8, 0.16)");
    ctx.fillStyle = forestWash;
    ctx.fillRect(0, 0, w, h);

    // Warm pools of light around lanterns and houses create the reference
    // image's village-at-night contrast without touching the world model.
    const lights = scene.decorations.filter((d) => d.type === "lantern" || d.type === "house");
    for (const d of lights) {
      const x = d.x + (d.type === "house" ? d.w / 2 : 0);
      const y = d.y + (d.type === "house" ? d.h * 0.55 : 4);
      const radius = d.type === "house" ? 42 : 24;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
      glow.addColorStop(0, "rgba(255, 190, 72, 0.16)");
      glow.addColorStop(0.45, "rgba(220, 135, 42, 0.06)");
      glow.addColorStop(1, "rgba(220, 135, 42, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    ctx.restore();
  },

  // A soft darkened edge gives the scene depth instead of looking like
  // a flat, evenly-lit sheet — cheap to draw fresh each frame since it
  // doesn't involve any randomness (so no caching needed, unlike ground).
  _drawVignette(ctx) {
    if (!this._vignetteCache || this._vignetteCache.w !== this.canvas.width || this._vignetteCache.h !== this.canvas.height) {
      const w = this.canvas.width, h = this.canvas.height;
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.4)");
      this._vignetteCache = { w, h, grad };
    }
    ctx.fillStyle = this._vignetteCache.grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  _drawDecoration(d) {
    const ctx = this.ctx;
    if (d.type === "tree") {
      const blocksImportantActor = !d.border && this.currentScene.npcs.some((n) => Math.hypot(n.x - d.x, n.y - d.y) < 48);
      const drawn = !blocksImportantActor && Art.draw(ctx, "tree", d.x, d.y + 8, d.border ? 44 : 54, d.border ? 62 : 72);
      if (!drawn) Textures.tree(ctx, d.x, d.y, d.border ? 0.78 : 0.88);
    }
    else if (d.type === "rock") Textures.rock(ctx, d.x, d.y, 0.82);
    else if (d.type === "house") {
      const { cx, ay } = houseAnchor(d);
      const drawn = Art.draw(ctx, "house", cx, ay + 4, 88, 76);
      if (!drawn) Textures.house(ctx, cx, ay, 0.62);
    }
    else if (d.type === "fence") Textures.fence(ctx, d.x, d.y, d.length || 32);
    else if (d.type === "lantern") Textures.lantern(ctx, d.x, d.y, 0.78);
  },

  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    const input = Input.poll();

    if (!this.paused) {
      const bounds = { x: 0, y: 0, w: this.currentScene.cols * TILE, h: this.currentScene.rows * TILE };
      this.player.update(dt, input, this.solids, bounds);

      for (const e of this.entities) {
        if (e instanceof Wolf) e.update(dt, this.player, this.solids);
        else if (e instanceof TrainingDummy) e.update(dt, this.player);
        else e.update(dt);
      }

      this.checkExits();

      if (input.interactPressed) {
        const target = this.findInteractTarget();
        if (target) target.interact(this.flags, (k, v) => this.setFlag(k, v));
      }

      if (this.player.hp <= 0) {
        this.player.hp = this.player.maxHp;
        this.player.x = 60; this.player.y = 130;
        this.loadScene("greenvale", { x: 60, y: 130, dir: "down" });
        this.showToast("You stumble home to recover...");
      }
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) document.getElementById("toast").style.opacity = "0";
    }

    this.updateHUD();
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  },
};

// Converts the old top-left+width/height house data into the
// center/foundation-anchored point Textures.house() expects, so
// existing world.js coordinates don't all need to be rewritten.
function houseAnchor(d) {
  return { cx: d.x + d.w / 2, ay: d.y + d.h - 21.15 };
}

function getDecorationSolidRect(d) {
  switch (d.type) {
    case "tree": return { x: d.x - 4, y: d.y + 3, w: 8, h: 17 };
    case "rock": return { x: d.x - 8, y: d.y - 4, w: 16, h: 11 };
    case "house": {
      const { cx, ay } = houseAnchor(d);
      return { x: cx - 23, y: ay - 2, w: 46, h: 23 };
    }
    case "dummy": return { x: d.x, y: d.y + 4, w: 16, h: 20 };
    case "sign": return { x: d.x - 8, y: d.y + 2, w: 16, h: 20 };
    case "fence": return { x: d.x, y: d.y - 2, w: d.length || 32, h: 17 };
    default: return { x: d.x, y: d.y, w: 16, h: 16 };
  }
}

window.addEventListener("load", () => Game.init());
