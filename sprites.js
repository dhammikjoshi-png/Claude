// ============================================================
// SPRITES.JS — Now just the crystal.
// Everything else (trees, houses, rocks, characters, wolf,
// fence, lantern, signs) moved to textures.js for one
// consistent art style. The crystal stays separate on purpose —
// it's meant to look otherworldly and different from the rest
// of the world, not blend in with it.
// ============================================================

const Sprites = {
  drawCrystal(ctx, x, y, opts) {
    const { glowPhase = 0, awakened = false } = opts;
    const glow = (Math.sin(glowPhase) + 1) / 2;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    const baseColor = awakened ? "#9b7fd4" : "#6f9bd4";
    const coreColor = awakened ? "#e0d4ff" : "#cfe4ff";

    if (awakened || glow > 0.3) {
      ctx.save();
      ctx.globalAlpha = 0.15 + glow * 0.25;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(10, 12, 16 + glow * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(18, 10);
    ctx.lineTo(10, 26);
    ctx.lineTo(2, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = coreColor;
    ctx.globalAlpha = 0.6 + glow * 0.4;
    ctx.beginPath();
    ctx.moveTo(10, 3);
    ctx.lineTo(14, 10);
    ctx.lineTo(10, 19);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },
};
