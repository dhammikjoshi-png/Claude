// ============================================================
// SPRITES.JS — Procedural pixel-art style rendering
// Characters are built from small blocky rectangles snapped to
// a pixel grid rather than bitmap images, so no asset files are
// needed and recoloring/resizing (growth stages) is trivial.
// ============================================================

const Sprites = {
  // Draws a simple blocky humanoid. `stage` changes proportions:
  // child = big head / short body, teen = medium, adult = normal/taller.
  drawHumanoid(ctx, x, y, opts) {
    const {
      dir = "down",
      walkPhase = 0,
      skin = "#e8c39e",
      hair = "#4a3222",
      shirt = "#4d7a4d",
      pants = "#3a3a5c",
      stage = "child",
      hurt = false,
    } = opts;

    const proportions = {
      child: { w: 14, bodyH: 8, headH: 8, legH: 4 },
      teen: { w: 15, bodyH: 10, headH: 7, legH: 5 },
      adult: { w: 16, bodyH: 11, headH: 7, legH: 6 },
    };
    const p = proportions[stage] || proportions.child;
    const legOffset = Math.sin(walkPhase) > 0 ? 1 : -1;
    const skinColor = hurt ? "#ff8b8b" : skin;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (dir === "left") {
      ctx.scale(-1, 1);
      ctx.translate(-p.w, 0);
    }

    const cx = p.w / 2;

    // Legs (behind body slightly)
    ctx.fillStyle = pants;
    ctx.fillRect(cx - 5, p.headH + p.bodyH - 2, 4, p.legH + legOffset);
    ctx.fillRect(cx + 1, p.headH + p.bodyH - 2, 4, p.legH - legOffset);

    // Body
    ctx.fillStyle = shirt;
    ctx.fillRect(cx - 6, p.headH, 12, p.bodyH);

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - 8, p.headH + 1, 3, p.bodyH - 3);
    ctx.fillRect(cx + 5, p.headH + 1, 3, p.bodyH - 3);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - 6, 0, 12, p.headH);

    // Hair
    ctx.fillStyle = hair;
    if (dir === "up") {
      ctx.fillRect(cx - 6, 0, 12, p.headH - 1);
    } else {
      ctx.fillRect(cx - 6, 0, 12, 3);
      ctx.fillRect(cx - 6, 3, 2, 3);
      ctx.fillRect(cx + 4, 3, 2, 3);
    }

    // Face (only visible facing down/side)
    if (dir === "down") {
      ctx.fillStyle = "#2b2118";
      ctx.fillRect(cx - 3, p.headH - 4, 2, 2);
      ctx.fillRect(cx + 1, p.headH - 4, 2, 2);
    } else if (dir === "left" || dir === "right") {
      // Drawn at the same local offset for both; the "left" branch above
      // already mirrors the whole canvas, so this one offset covers both
      // directions correctly instead of needing two mirrored constants.
      ctx.fillStyle = "#2b2118";
      ctx.fillRect(cx + 2, p.headH - 4, 2, 2);
    }

    ctx.restore();
  },

  drawWolf(ctx, x, y, opts) {
    const { walkPhase = 0, hurt = false, aggro = false } = opts;
    const legOffset = Math.sin(walkPhase) > 0 ? 1 : -1;
    const body = hurt ? "#c98d8d" : aggro ? "#5c5c68" : "#6b6b78";

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Legs
    ctx.fillStyle = "#3f3f48";
    ctx.fillRect(2, 12 + legOffset, 3, 4);
    ctx.fillRect(11, 12 - legOffset, 3, 4);

    // Body
    ctx.fillStyle = body;
    ctx.fillRect(1, 5, 14, 8);

    // Head
    ctx.fillRect(10, 1, 7, 6);

    // Ears
    ctx.fillStyle = "#3f3f48";
    ctx.fillRect(10, 0, 2, 2);
    ctx.fillRect(14, 0, 2, 2);

    // Eye
    ctx.fillStyle = aggro ? "#ff4d4d" : "#e8d84a";
    ctx.fillRect(14, 3, 2, 2);

    // Tail
    ctx.fillStyle = "#3f3f48";
    ctx.fillRect(-2, 6, 3, 3);

    ctx.restore();
  },

  drawTree(ctx, x, y) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Ground shadow
    ctx.fillStyle = "rgba(10,20,10,0.25)";
    ctx.beginPath();
    ctx.ellipse(14, 32, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk with shading
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(11, 20, 6, 12);
    ctx.fillStyle = "#4a3620";
    ctx.fillRect(11, 20, 3, 12);
    ctx.fillStyle = "#5c4428";
    ctx.fillRect(11, 20, 2, 12);

    // Canopy: layered circles, darkest at back, lightest highlight top-left
    ctx.fillStyle = "#1f3a20";
    ctx.beginPath(); ctx.arc(14, 13, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2d4a2d";
    ctx.beginPath(); ctx.arc(11, 11, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#376337";
    ctx.beginPath(); ctx.arc(9, 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4c8046";
    ctx.beginPath(); ctx.arc(6, 4, 4.5, 0, Math.PI * 2); ctx.fill();

    // Little texture dabs
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      ctx.beginPath();
      ctx.arc(10 + Math.cos(a) * 9, 10 + Math.sin(a) * 7, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  drawRock(ctx, x, y) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.fillStyle = "rgba(10,20,10,0.2)";
    ctx.beginPath(); ctx.ellipse(8, 15, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#565650";
    ctx.fillRect(1, 7, 14, 7);
    ctx.fillStyle = "#6b6b62";
    ctx.fillRect(2, 5, 11, 5);
    ctx.fillStyle = "#8f8f82";
    ctx.fillRect(4, 3, 6, 3);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(5, 3, 3, 1);
    ctx.restore();
  },

  drawHouse(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    ctx.fillStyle = "rgba(10,20,10,0.25)";
    ctx.beginPath(); ctx.ellipse(w / 2, h + 6, w * 0.45, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Stone base wall with texture
    const wallY = h * 0.4;
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(0, wallY, w, h * 0.6);
    ctx.fillStyle = "#7a7468";
    for (let ry = 0; ry < h * 0.6; ry += 6) {
      for (let rx = (Math.floor(ry / 6) % 2) * 5; rx < w; rx += 10) {
        ctx.fillRect(rx, wallY + ry, 8, 4);
      }
    }
    // wood corner beams
    ctx.fillStyle = "#5c4428";
    ctx.fillRect(0, wallY, 4, h * 0.6);
    ctx.fillRect(w - 4, wallY, 4, h * 0.6);

    // Roof with tile lines and a highlight edge
    ctx.fillStyle = "#7a2626";
    ctx.beginPath();
    ctx.moveTo(-5, wallY + 2);
    ctx.lineTo(w / 2, -6);
    ctx.lineTo(w + 5, wallY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(-5 + (w / 2 + 5) * t, wallY + 2 - (wallY + 8) * t);
      ctx.lineTo(-5 + (w / 2 + 5) * t + 3, wallY + 2 - (wallY + 8) * t);
      ctx.stroke();
    }
    ctx.fillStyle = "#3a1414";
    ctx.beginPath();
    ctx.moveTo(w / 2 - 3, wallY - 2);
    ctx.lineTo(w / 2, -6);
    ctx.lineTo(w / 2 + 3, wallY - 2);
    ctx.closePath();
    ctx.fill();

    // Chimney + soft smoke
    ctx.fillStyle = "#6b6358";
    ctx.fillRect(w * 0.68, -14, 8, 20);
    ctx.fillStyle = "rgba(220,220,220,0.35)";
    ctx.beginPath(); ctx.arc(w * 0.72 + 4, -20, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.72 + 6, -26, 4, 0, Math.PI * 2); ctx.fill();

    // Door
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(w * 0.4, h * 0.6, w * 0.2, h * 0.4);
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(w * 0.4, h * 0.6, w * 0.2, 2);

    // Glowing windows
    ["rgba(255,214,120,0.95)", "rgba(255,214,120,0.95)"].forEach((c, i) => {
      const wx = i === 0 ? w * 0.14 : w * 0.68;
      ctx.save();
      ctx.shadowColor = "rgba(255,200,100,0.6)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = c;
      ctx.fillRect(wx, h * 0.55, w * 0.16, w * 0.16);
      ctx.restore();
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, h * 0.55, w * 0.16, w * 0.16);
    });

    ctx.restore();
  },

  drawFence(ctx, x, y) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.fillStyle = "rgba(10,20,10,0.2)";
    ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = "#6b5030";
    ctx.fillRect(1, 2, 3, 12);
    ctx.fillRect(12, 2, 3, 12);
    ctx.fillStyle = "#7a5c3e";
    ctx.fillRect(0, 4, 16, 3);
    ctx.fillRect(0, 9, 16, 3);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(0, 9, 16, 1);
    ctx.restore();
  },

  drawLantern(ctx, x, y, opts) {
    const lit = opts && opts.lit !== false;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(3, 6, 2, 22);
    if (lit) {
      ctx.save();
      ctx.shadowColor = "rgba(255,190,90,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(255,200,110,0.9)";
      ctx.fillRect(0, 0, 8, 8);
      ctx.restore();
    } else {
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(0, 0, 8, 8);
    }
    ctx.strokeStyle = "#2a2a2a";
    ctx.strokeRect(0, 0, 8, 8);
    ctx.restore();
  },

  drawShadow(ctx, x, y, w) {
    ctx.save();
    ctx.fillStyle = "rgba(10,20,10,0.28)";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), w, w * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawDummy(ctx, x, y) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.fillStyle = "#8a6a4a";
    ctx.fillRect(6, 4, 4, 20);
    ctx.fillStyle = "#c9a876";
    ctx.beginPath();
    ctx.arc(8, 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a08050";
    ctx.fillRect(0, 10, 16, 3);
    ctx.restore();
  },

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

  drawVillager(ctx, x, y, opts) {
    Sprites.drawHumanoid(ctx, x, y, {
      ...opts,
      stage: "adult",
      shirt: opts.shirt || "#8a6a3e",
      pants: opts.pants || "#4a4a3a",
      hair: opts.hair || "#5a4530",
    });
  },
};
