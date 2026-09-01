// ============================================================
// WHISPERING WOODS — TEXTURES.JS
// Procedural pixel-art texture system
// No external images required.
// Everything is drawn with Canvas.
//
// One consistent art style for the whole game — this replaces
// the earlier mixed procedural/real-sprite approach, which
// looked inconsistent because two different visual languages
// were sharing the same scene.
//
// Small modifications from the original version:
//   - `kai()` now delegates to a generic `person()` so the
//     player character can reuse the same art style with a
//     different color palette (needed since the player has no
//     fixed identity/colors of its own — it's whoever you are).
//   - `rect`, `circle`, `ellipse`, `person`, and `COLORS` are
//     now exposed publicly so game-specific extras (the crystal,
//     the training dummy) can reuse the same primitives instead
//     of introducing a different drawing style for those.
//   - `wolf()` now draws a ground shadow like the other
//     creatures/characters do, for visual consistency.
// ============================================================

"use strict";

const Textures = (() => {

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  const TILE = 32;

  const COLORS = {
    grassDark: "#0f2011",
    grass: "#223a1d",
    grassLight: "#3c5c28",
    grassBright: "#5c8034",

    dirtDark: "#2c1e12",
    dirt: "#523a22",
    dirtLight: "#725530",

    stoneDark: "#26292a",
    stone: "#484f4c",
    stoneLight: "#6b726d",

    waterDark: "#0a232a",
    water: "#123a40",
    waterLight: "#1f5c63",

    woodDark: "#221609",
    wood: "#573417",
    woodLight: "#82552c",

    leafDark: "#0f2613",
    leaf: "#254d1f",
    leafLight: "#40682a",

    skin: "#c9825d",
    skinLight: "#e0a174",
    hair: "#2a1a12",

    shirt: "#42574a",
    pants: "#2c333a",
    boot: "#1c1913",

    fire: "#ff9d32",
    fireLight: "#ffe08a",
    gold: "#d5a94b"
  };

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h)
    );
  }

  function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function line(ctx, x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function pixel(ctx, x, y, color, size = 2) {
    rect(ctx, x, y, size, size, color);
  }

  function noise(ctx, x, y, w, h, colors, amount = 20) {
    for (let i = 0; i < amount; i++) {
      const px = x + Math.random() * w;
      const py = y + Math.random() * h;
      const size = Math.random() < 0.75 ? 1 : 2;

      rect(
        ctx,
        px,
        py,
        size,
        size,
        colors[Math.floor(Math.random() * colors.length)]
      );
    }
  }

  // ----------------------------------------------------------
  // GROUND
  // Note: these use Math.random() per call, which is why the
  // game caches ground tiles onto an offscreen canvas once per
  // scene load instead of calling these every frame — otherwise
  // the texture would visibly sparkle/flicker at 60fps.
  // ----------------------------------------------------------

  function grass(ctx, x, y, size = TILE) {

    rect(ctx, x, y, size, size, COLORS.grass);

    noise(
      ctx,
      x,
      y,
      size,
      size,
      [
        COLORS.grassDark,
        COLORS.grassLight
      ],
      18
    );

    for (let i = 0; i < 5; i++) {

      const gx = x + 4 + Math.random() * (size - 8);
      const gy = y + 8 + Math.random() * (size - 10);

      line(
        ctx,
        gx,
        gy + 4,
        gx - 2,
        gy,
        COLORS.grassBright
      );

      line(
        ctx,
        gx,
        gy + 4,
        gx + 2,
        gy,
        COLORS.grassLight
      );
    }
  }

  function grassFlowers(ctx, x, y, size = TILE) {

    grass(ctx, x, y, size);

    const colors = [
      "#f2e6b3",
      "#e8c96b",
      "#d98773"
    ];

    for (let i = 0; i < 4; i++) {

      const fx = x + 5 + Math.random() * (size - 10);
      const fy = y + 5 + Math.random() * (size - 10);

      line(
        ctx,
        fx,
        fy + 4,
        fx,
        fy + 1,
        COLORS.grassLight
      );

      pixel(
        ctx,
        fx - 1,
        fy,
        colors[i % colors.length],
        2
      );
    }
  }

  function dirt(ctx, x, y, size = TILE) {

    rect(ctx, x, y, size, size, COLORS.dirt);

    noise(
      ctx,
      x,
      y,
      size,
      size,
      [
        COLORS.dirtDark,
        COLORS.dirtLight
      ],
      22
    );

    for (let i = 0; i < 3; i++) {

      const px = x + 5 + Math.random() * (size - 10);
      const py = y + 5 + Math.random() * (size - 10);

      line(
        ctx,
        px,
        py,
        px + 4,
        py + 1,
        COLORS.dirtDark
      );
    }
  }

  // ----------------------------------------------------------
  // WATER
  // ----------------------------------------------------------

  function water(ctx, x, y, size = TILE) {

    rect(ctx, x, y, size, size, COLORS.waterDark);

    rect(
      ctx,
      x + 2,
      y + 3,
      size - 4,
      size - 6,
      COLORS.water
    );

    for (let i = 0; i < 5; i++) {

      const wy =
        y + 5 + Math.random() * (size - 10);

      const wx =
        x + Math.random() * (size - 12);

      const ww =
        5 + Math.random() * 8;

      line(
        ctx,
        wx,
        wy,
        wx + ww,
        wy,
        COLORS.waterLight,
        1
      );
    }
  }

  function waterLily(ctx, x, y) {

    circle(
      ctx,
      x,
      y,
      5,
      COLORS.leaf
    );

    line(
      ctx,
      x,
      y,
      x + 5,
      y - 3,
      COLORS.leafDark,
      1
    );

    circle(
      ctx,
      x + 1,
      y - 2,
      1.5,
      "#f3e7b0"
    );
  }

  // ----------------------------------------------------------
  // ROCK
  // ----------------------------------------------------------

  function rock(ctx, x, y, scale = 1) {

    const w = 25 * scale;
    const h = 17 * scale;

    ctx.save();

    ctx.translate(x, y);

    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 0.2);
    ctx.lineTo(-w * 0.35, -h * 0.4);
    ctx.lineTo(-w * 0.05, -h * 0.6);
    ctx.lineTo(w * 0.35, -h * 0.45);
    ctx.lineTo(w * 0.5, h * 0.2);
    ctx.lineTo(w * 0.25, h * 0.5);
    ctx.lineTo(-w * 0.3, h * 0.5);
    ctx.closePath();

    ctx.fillStyle = COLORS.stoneDark;
    ctx.fill();

    rect(
      ctx,
      -w * 0.25,
      -h * 0.38,
      w * 0.35,
      h * 0.18,
      COLORS.stoneLight
    );

    pixel(
      ctx,
      w * 0.08,
      -h * 0.05,
      COLORS.stone,
      3
    );

    ctx.restore();
  }

  // ----------------------------------------------------------
  // TREE
  // ----------------------------------------------------------

  function tree(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // shadow
    ctx.globalAlpha = 0.5;
    circle(ctx, 0, 30, 25, "#050d06");
    ctx.globalAlpha = 1;

    // trunk
    rect(
      ctx,
      -7,
      5,
      14,
      29,
      COLORS.woodDark
    );

    rect(
      ctx,
      -4,
      6,
      8,
      26,
      COLORS.wood
    );

    line(
      ctx,
      0,
      8,
      -12,
      -5,
      COLORS.woodDark,
      4
    );

    line(
      ctx,
      1,
      9,
      13,
      -6,
      COLORS.woodDark,
      4
    );

    // foliage layers
    circle(ctx, 0, -7, 22, COLORS.leafDark);
    circle(ctx, -11, 1, 16, COLORS.leaf);
    circle(ctx, 11, 1, 16, COLORS.leaf);
    circle(ctx, 0, -17, 17, COLORS.leafLight);

    circle(ctx, -5, -20, 6, "#5c8a35");
    circle(ctx, 8, -9, 5, "#3d6e2d");

    // highlights
    pixel(ctx, -11, -14, "#6c963d", 3);
    pixel(ctx, 4, -25, "#779f42", 3);
    pixel(ctx, 13, -2, "#6a913b", 2);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // DEAD TREE
  // ----------------------------------------------------------

  function deadTree(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    line(ctx, 0, 30, 0, -24, COLORS.woodDark, 8);
    line(ctx, 0, -5, -17, -22, COLORS.woodDark, 5);
    line(ctx, 0, -2, 19, -24, COLORS.woodDark, 5);
    line(ctx, -3, -15, -10, -31, COLORS.woodDark, 4);
    line(ctx, 4, -15, 11, -31, COLORS.woodDark, 4);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // BUSH
  // ----------------------------------------------------------

  function bush(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    circle(ctx, 0, 0, 12, COLORS.leafDark);
    circle(ctx, -8, 2, 8, COLORS.leaf);
    circle(ctx, 8, 2, 8, COLORS.leaf);
    circle(ctx, 0, -6, 8, COLORS.leafLight);

    pixel(ctx, -5, -5, "#729746", 2);
    pixel(ctx, 6, -1, "#618b3b", 2);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // FLOWER
  // ----------------------------------------------------------

  function flower(ctx, x, y, color = "#f4e8b1") {

    line(ctx, x, y + 7, x, y, COLORS.grassLight, 1);

    circle(ctx, x - 2, y, 2, color);
    circle(ctx, x + 2, y, 2, color);
    circle(ctx, x, y - 2, 2, color);
    circle(ctx, x, y + 2, 2, color);

    circle(ctx, x, y, 1, COLORS.gold);
  }

  // ----------------------------------------------------------
  // LOG
  // ----------------------------------------------------------

  function log(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(ctx, -28, -7, 56, 14, COLORS.woodDark);
    rect(ctx, -25, -5, 50, 10, COLORS.wood);
    circle(ctx, -28, 0, 7, COLORS.woodLight);
    circle(ctx, -28, 0, 4, COLORS.woodDark);
    line(ctx, -28, 0, -30, -3, COLORS.woodLight);
    line(ctx, -28, 0, -25, 2, COLORS.woodLight);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // FENCE
  // ----------------------------------------------------------

  function fence(ctx, x, y, length = 80) {

    ctx.save();

    line(ctx, x, y, x + length, y, COLORS.woodDark, 5);
    line(ctx, x, y + 13, x + length, y + 13, COLORS.woodDark, 5);

    for (let px = x; px <= x + length; px += 20) {
      rect(ctx, px - 3, y - 8, 6, 30, COLORS.woodDark);
      rect(ctx, px - 1, y - 7, 3, 27, COLORS.woodLight);
    }

    ctx.restore();
  }

  // ----------------------------------------------------------
  // LANTERN
  // ----------------------------------------------------------

  function lantern(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    line(ctx, 0, -22, 0, -8, COLORS.woodDark, 2);
    rect(ctx, -7, -8, 14, 18, COLORS.woodDark);
    rect(ctx, -4, -5, 8, 12, "#8f6328");
    circle(ctx, 0, 1, 4, COLORS.fireLight);
    line(ctx, -8, -9, 8, -9, COLORS.woodDark, 2);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // CAMPFIRE
  // ----------------------------------------------------------

  function campfire(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.12;
    circle(ctx, 0, -2, 38, "#ff9d32");
    ctx.globalAlpha = 1;

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      circle(ctx, Math.cos(a) * 13, Math.sin(a) * 6 + 5, 5, COLORS.stone);
    }

    line(ctx, -12, 4, 12, -7, COLORS.woodDark, 5);
    line(ctx, 12, 4, -12, -7, COLORS.woodDark, 5);

    ctx.beginPath();
    ctx.moveTo(0, -31);
    ctx.lineTo(-9, -13);
    ctx.lineTo(-5, -4);
    ctx.lineTo(0, -9);
    ctx.lineTo(6, -2);
    ctx.lineTo(10, -15);
    ctx.closePath();
    ctx.fillStyle = COLORS.fire;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(-4, -12);
    ctx.lineTo(0, -7);
    ctx.lineTo(5, -14);
    ctx.closePath();
    ctx.fillStyle = COLORS.fireLight;
    ctx.fill();

    ctx.restore();
  }

  // ----------------------------------------------------------
  // CRATE
  // ----------------------------------------------------------

  function crate(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(ctx, -15, -15, 30, 30, COLORS.woodDark);
    rect(ctx, -12, -12, 24, 24, COLORS.wood);
    line(ctx, -10, -10, 10, 10, COLORS.woodLight, 3);
    line(ctx, 10, -10, -10, 10, COLORS.woodLight, 3);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // SIGN
  // ----------------------------------------------------------

  function sign(ctx, x, y, text = "GREENVALE") {

    ctx.save();
    ctx.translate(x, y);

    rect(ctx, -4, 5, 8, 30, COLORS.woodDark);
    rect(ctx, -32, -15, 64, 22, COLORS.woodDark);
    rect(ctx, -29, -12, 58, 16, COLORS.wood);

    ctx.fillStyle = "#e7cf91";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, -4);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // HOUSE
  // ----------------------------------------------------------

  function house(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.45;
    ellipse(ctx, 0, 42, 66, 13, "#05080a");
    ctx.globalAlpha = 1;

    rect(ctx, -52, -5, 104, 52, COLORS.wood);

    for (let px = -50; px < 50; px += 16) {
      rect(ctx, px, 37, 14, 9, COLORS.stoneDark);
    }

    ctx.beginPath();
    ctx.moveTo(-65, -8);
    ctx.lineTo(0, -55);
    ctx.lineTo(65, -8);
    ctx.closePath();
    ctx.fillStyle = COLORS.woodDark;
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      line(ctx, -48 + i * 24, -15, 0 + i * 0, -47 + i * 2, COLORS.woodLight, 3);
    }

    rect(ctx, -12, 9, 24, 38, COLORS.woodDark);
    rect(ctx, -8, 13, 16, 34, COLORS.wood);
    circle(ctx, 4, 30, 2, COLORS.gold);

    windowShape(ctx, -36, 13);
    windowShape(ctx, 36, 13);

    ctx.restore();
  }

  function windowShape(ctx, x, y) {
    rect(ctx, x - 9, y - 9, 18, 18, COLORS.woodDark);
    rect(ctx, x - 6, y - 6, 12, 12, "#dba84e");
    line(ctx, x, y - 6, x, y + 6, COLORS.woodDark, 2);
    line(ctx, x - 6, y, x + 6, y, COLORS.woodDark, 2);
  }

  // ----------------------------------------------------------
  // PERSON — generic figure used by both Kai and the player,
  // so they always share one art style and only differ by
  // palette (and scale, for the player's growth stages).
  // ----------------------------------------------------------

  function person(ctx, x, y, scale = 1, direction = "down", palette = {}) {

    const skin = palette.skin || COLORS.skin;
    const hair = palette.hair || COLORS.hair;
    const shirt = palette.shirt || COLORS.shirt;
    const pants = palette.pants || COLORS.pants;
    const shirtShade = palette.shirtShade || "#344b3a";

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.45;
    ellipse(ctx, 0, 15, 12, 4.5, "#05080a");
    ctx.globalAlpha = 1;

    rect(ctx, -8, 10, 6, 7, COLORS.boot);
    rect(ctx, 2, 10, 6, 7, COLORS.boot);

    rect(ctx, -7, 2, 6, 11, pants);
    rect(ctx, 1, 2, 6, 11, pants);

    rect(ctx, -9, -12, 18, 17, shirt);

    rect(ctx, -13, -10, 5, 14, shirt);
    rect(ctx, 8, -10, 5, 14, shirt);

    circle(ctx, -10, 5, 3, skin);
    circle(ctx, 10, 5, 3, skin);

    rect(ctx, -3, -17, 6, 6, skin);

    circle(ctx, 0, -23, 10, skin);

    circle(ctx, 0, -29, 10, hair);
    rect(ctx, -10, -27, 20, 6, hair);
    rect(ctx, -10, -25, 4, 8, hair);
    rect(ctx, 6, -25, 4, 8, hair);

    if (direction === "down") {
      pixel(ctx, -5, -23, "#241a16", 2);
      pixel(ctx, 3, -23, "#241a16", 2);
      pixel(ctx, -2, -18, "#8d503d", 2);
    } else if (direction === "up") {
      rect(ctx, -8, -28, 16, 9, hair);
    } else if (direction === "left") {
      pixel(ctx, -8, -23, "#241a16", 2);
    } else {
      pixel(ctx, 6, -23, "#241a16", 2);
    }

    line(ctx, 0, -10, 0, 2, shirtShade, 2);

    ctx.restore();
  }

  function kai(ctx, x, y, scale = 1, direction = "down") {
    person(ctx, x, y, scale, direction, {
      skin: COLORS.skin,
      hair: COLORS.hair,
      shirt: COLORS.shirt,
      pants: COLORS.pants,
    });
  }

  // ----------------------------------------------------------
  // WOLF
  // ----------------------------------------------------------

  function wolf(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.45;
    ellipse(ctx, 0, 13, 17, 4.5, "#05080a");
    ctx.globalAlpha = 1;

    ellipse(ctx, 0, 0, 18, 9, "#333b39");
    circle(ctx, -15, -7, 8, "#3e4642");

    ctx.beginPath();
    ctx.moveTo(-21, -12);
    ctx.lineTo(-18, -22);
    ctx.lineTo(-13, -13);
    ctx.closePath();
    ctx.fillStyle = "#303633";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-11, -13);
    ctx.lineTo(-7, -21);
    ctx.lineTo(-6, -9);
    ctx.closePath();
    ctx.fillStyle = "#303633";
    ctx.fill();

    rect(ctx, -9, 4, 4, 11, "#2a302e");
    rect(ctx, 5, 4, 4, 11, "#2a302e");

    line(ctx, 15, -2, 27, -11, "#303633", 5);

    pixel(ctx, -18, -9, "#d6ad48", 2);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // CHEST
  // ----------------------------------------------------------

  function chest(ctx, x, y, scale = 1) {

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(ctx, -17, -10, 34, 22, COLORS.woodDark);
    rect(ctx, -14, -7, 28, 16, COLORS.wood);
    rect(ctx, -2, -7, 4, 16, COLORS.gold);
    rect(ctx, -4, -1, 8, 5, COLORS.gold);

    ctx.restore();
  }

  // ----------------------------------------------------------
  // DRAW ANY TEXTURE
  // ----------------------------------------------------------

  function draw(ctx, type, x, y, options = {}) {

    const scale = options.scale == null ? 1 : options.scale;

    switch (type) {
      case "grass": grass(ctx, x, y, options.size || TILE); break;
      case "flowers": grassFlowers(ctx, x, y, options.size || TILE); break;
      case "dirt": dirt(ctx, x, y, options.size || TILE); break;
      case "water": water(ctx, x, y, options.size || TILE); break;
      case "lily": waterLily(ctx, x, y); break;
      case "tree": tree(ctx, x, y, scale); break;
      case "deadTree": deadTree(ctx, x, y, scale); break;
      case "bush": bush(ctx, x, y, scale); break;
      case "flower": flower(ctx, x, y, options.color || "#f4e8b1"); break;
      case "rock": rock(ctx, x, y, scale); break;
      case "log": log(ctx, x, y, scale); break;
      case "fence": fence(ctx, x, y, options.length || 80); break;
      case "lantern": lantern(ctx, x, y, scale); break;
      case "campfire": campfire(ctx, x, y, scale); break;
      case "crate": crate(ctx, x, y, scale); break;
      case "sign": sign(ctx, x, y, options.text || "GREENVALE"); break;
      case "house": house(ctx, x, y, scale); break;
      case "kai": kai(ctx, x, y, scale, options.direction || "down"); break;
      case "person": person(ctx, x, y, scale, options.direction || "down", options.palette || {}); break;
      case "wolf": wolf(ctx, x, y, scale); break;
      case "chest": chest(ctx, x, y, scale); break;
      default: console.warn("Unknown texture:", type);
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  return {
    TILE,
    COLORS,

    rect,
    circle,
    ellipse,
    line,
    pixel,

    grass,
    grassFlowers,
    dirt,
    water,
    waterLily,

    tree,
    deadTree,
    bush,
    flower,

    rock,
    log,
    fence,

    lantern,
    campfire,

    crate,
    sign,
    house,

    person,
    kai,
    wolf,
    chest,

    draw
  };

})();
