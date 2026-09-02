// WHISPERING WOODS — optional reference-matched art layer
// Gameplay never depends on these assets: if an image fails to load, the
// existing procedural texture renderer remains active.
"use strict";

const Art = (() => {
  const sources = {
    tree: "assets/greenvale-reference/tree-hero.png",
    house: "assets/greenvale-reference/house-hero.png",
    flowers: "assets/greenvale-reference/flower-cluster.png",
  };
  const images = {};
  let ready = false;

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function load() {
    const entries = await Promise.all(
      Object.entries(sources).map(async ([key, src]) => [key, await loadImage(src)])
    );
    for (const [key, image] of entries) images[key] = image;
    ready = true;
  }

  function draw(ctx, key, x, y, w, h, alpha = 1) {
    const image = images[key];
    if (!ready || !image) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round(x - w / 2), Math.round(y - h), Math.round(w), Math.round(h));
    ctx.restore();
    return true;
  }

  return { load, draw, get ready() { return ready; } };
})();
