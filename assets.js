// ============================================================
// ASSETS.JS — Loads real image sprites (extracted from a source
// sheet) for entities where procedural shapes fell short: Kai,
// the wolf, trees, and fences. Everything else (houses, rocks,
// the player, crystal) stays procedural — either because the
// source art didn't extract cleanly (houses/rocks had background
// colors too close to their own material colors to key out
// cleanly) or because it needs to change at runtime in ways a
// static image can't (the player grows through 3 life stages).
//
// Every draw call in sprites.js/entities.js checks Assets.ready
// first and falls back to the procedural version if an image
// hasn't finished loading (or failed to load) — so the game
// never breaks or shows a blank sprite while waiting on images.
// ============================================================

const Assets = {
  images: {},
  ready: {},

  load(name, src) {
    const img = new Image();
    this.ready[name] = false;
    img.onload = () => { this.ready[name] = true; };
    img.onerror = () => { this.ready[name] = false; };
    img.src = src;
    this.images[name] = img;
  },

  init() {
    this.load("kai", "assets/kai.png");
    this.load("wolf", "assets/wolf.png");
    this.load("tree", "assets/tree.png");
    this.load("fence", "assets/fence.png");
  },

  has(name) {
    return this.ready[name] === true;
  },
};

Assets.init();
