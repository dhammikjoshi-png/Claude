// ============================================================
// ENTITIES.JS — Player, NPCs, enemies, interactables.
// Each entity knows how to update() and draw() itself; Game.js
// just holds a list of them per scene and calls both each frame.
// ============================================================

const STAGE_SPEED = { child: 62, teen: 72, adult: 80 };
const STAGE_MAXHP = { child: 6, teen: 8, adult: 10 }; // in half-hearts (2 per heart)

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 12; this.h = 8; // collision box (feet area, smaller than sprite)
    this.dir = "down";
    this.walkPhase = 0;
    this.moving = false;
    this.stage = "child";
    this.maxHp = STAGE_MAXHP.child;
    this.hp = this.maxHp;
    this.invuln = 0;
    this.attacking = 0; // frames remaining of active attack hitbox
    this.attackCooldown = 0;
    this.hurtFlash = 0;
  }

  get speed() { return STAGE_SPEED[this.stage]; }

  get spriteX() { return this.x - 7; }
  get spriteY() { return this.y - 22; }

  getAttackHitbox() {
    const range = 14;
    switch (this.dir) {
      case "down": return { x: this.x - 6, y: this.y + this.h, w: 16, h: range };
      case "up": return { x: this.x - 6, y: this.y - range, w: 16, h: range };
      case "left": return { x: this.x - range, y: this.y - 4, w: range, h: 14 };
      case "right": return { x: this.x + this.w, y: this.y - 4, w: range, h: 14 };
    }
  }

  takeDamage(amount) {
    if (this.invuln > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 1.0;
    this.hurtFlash = 0.3;
    AudioSys.hit();
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  growTo(stage) {
    this.stage = stage;
    const ratio = this.hp / this.maxHp;
    this.maxHp = STAGE_MAXHP[stage];
    this.hp = Math.round(this.maxHp * ratio);
  }

  update(dt, input, solids, bounds) {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.attacking > 0) this.attacking = Math.max(0, this.attacking - dt);

    let mx = input.moveX, my = input.moveY;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; }

    this.moving = len > 0.05;
    if (this.moving) {
      this.walkPhase += dt * 10;
      if (Math.abs(mx) > Math.abs(my)) this.dir = mx > 0 ? "right" : "left";
      else if (my !== 0) this.dir = my > 0 ? "down" : "up";
    }

    const nx = this.x + mx * this.speed * dt;
    const ny = this.y + my * this.speed * dt;

    const boxAt = (px, py) => ({ x: px - this.w / 2, y: py - this.h / 2, w: this.w, h: this.h });

    if (!collidesAny(boxAt(nx, this.y), solids) && nx - this.w / 2 > bounds.x && nx + this.w / 2 < bounds.x + bounds.w) {
      this.x = nx;
    }
    if (!collidesAny(boxAt(this.x, ny), solids) && ny - this.h / 2 > bounds.y && ny + this.h / 2 < bounds.y + bounds.h) {
      this.y = ny;
    }

    if (input.attackPressed && this.attackCooldown <= 0) {
      this.attacking = 0.18;
      this.attackCooldown = 0.42;
      AudioSys.blip(220, 0.05);
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.hurtFlash > 0 && Math.floor(this.hurtFlash * 20) % 2 === 0) ctx.globalAlpha = 0.4;
    Textures.person(ctx, this.x, this.y, STAGE_SCALE[this.stage], this.dir, PLAYER_PALETTE);
    ctx.restore();

    if (this.attacking > 0) {
      const hb = this.getAttackHitbox();
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#EDE0C8";
      ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
      ctx.restore();
    }
  }
}

const STAGE_SCALE = { child: 0.55, teen: 0.65, adult: 0.75 };
const PLAYER_PALETTE = {
  skin: Textures.COLORS.skin,
  hair: "#2a1e18",
  shirt: "#4a5a73",
  pants: "#2e2a26",
  shirtShade: "#333f52",
};

function collidesAny(box, solids) {
  for (const s of solids) {
    if (box.x < s.x + s.w && box.x + box.w > s.x && box.y < s.y + s.h && box.y + box.h > s.y) return true;
  }
  return false;
}

// ------------------------------------------------------------
const MIRA_PALETTE = {
  skin: Textures.COLORS.skin,
  hair: "#c9c0b0",
  shirt: "#6b4a8a",
  pants: "#3a2f4a",
  shirtShade: "#4a3563",
};

class NPC {
  constructor(data) {
    Object.assign(this, data);
    this.w = 12; this.h = 8;
    this.dir = "down";
    this.idlePhase = Math.random() * 10;
  }
  get spriteX() { return this.x - 7; }
  get spriteY() { return this.y - 22; }

  update(dt) { this.idlePhase += dt; }

  draw(ctx) {
    if (this.type === "kai") {
      Textures.kai(ctx, this.x, this.y, 0.55, this.dir);
    } else {
      Textures.person(ctx, this.x, this.y, 0.65, this.dir, this.palette || MIRA_PALETTE);
    }
  }

  interact(flags, setFlag) {
    if (this.type === "kai") {
      if (flags.visionSeen && !flags.childhoodComplete && Story.onKaiReturn()) return;
      const result = getKaiLines(flags);
      DialogueSys.start("Kai", result.lines, () => {
        Object.entries(result.flagsToSet).forEach(([k, v]) => setFlag(k, v));
      });
    } else {
      DialogueSys.start(this.name || "Villager", getVillagerLines(this, flags));
    }
  }
}

// ------------------------------------------------------------
class Interactable {
  constructor(data) {
    Object.assign(this, data);
    this.w = 16; this.h = 16;
  }
  get spriteX() { return this.x; }
  get spriteY() { return this.y; }

  update(dt) {}

  draw(ctx) {
    if (this.interactKey && this.interactKey.startsWith("sign")) {
      Textures.sign(ctx, this.x, this.y, this.label || "SIGN");
    }
  }

  interact(flags, setFlag) {
    if (this.interactKey.startsWith("forestClue")) {
      investigateForestClue(this.interactKey, flags, setFlag);
    } else if (this.interactKey === "trainingDummy") {
      DialogueSys.start("", Game.flags.trainingComplete ? TRAINING_DUMMY_LINES.complete : TRAINING_DUMMY_LINES.intro, () => {
        Game.setFlag("trainingComplete", true);
      });
    } else if (SIGN_TEXT[this.interactKey]) {
      DialogueSys.start("", SIGN_TEXT[this.interactKey]);
    }
  }
}

// ------------------------------------------------------------
// Training dummy — requires actually landing 3 practice hits
// with the attack button, not just talking to it, so Kai's later
// "not bad, you didn't embarrass yourself" line is actually earned.
class TrainingDummy {
  constructor(data) {
    Object.assign(this, data);
    this.w = 16; this.h = 20;
    this.hits = 0;
    this.hitCooldown = 0;
  }
  get spriteX() { return this.x; }
  get spriteY() { return this.y; }

  update(dt, player) {
    if (this.hitCooldown > 0) this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (Game.flags.trainingComplete || !player.attacking || this.hitCooldown > 0) return;

    const hb = player.getAttackHitbox();
    const box = { x: this.x, y: this.y + 4, w: 16, h: 20 };
    if (collidesAny(box, [hb])) {
      this.hits++;
      this.hitCooldown = 0.5;
      AudioSys.hit();
      if (this.hits >= 3) {
        Game.setFlag("trainingComplete", true);
        DialogueSys.start("", TRAINING_DUMMY_LINES.complete);
      } else {
        Game.showToast(`Hit! (${this.hits}/3)`, 1.2);
      }
    }
  }

  draw(ctx) {
    const C = Textures.COLORS;
    Textures.rect(ctx, this.x - 2, this.y - 24, 4, 26, C.woodDark);
    Textures.rect(ctx, this.x - 9, this.y - 14, 18, 3, C.woodDark);
    Textures.circle(ctx, this.x, this.y - 28, 7, C.dirtLight);
    Textures.circle(ctx, this.x - 3, this.y - 29, 1.5, "#2a1e18");
    Textures.circle(ctx, this.x + 3, this.y - 29, 1.5, "#2a1e18");
  }

  interact() {
    if (!Game.flags.trainingComplete) {
      DialogueSys.start("", TRAINING_DUMMY_LINES.intro);
    } else {
      DialogueSys.start("", ["The dummy looks a little worse for wear."]);
    }
  }
}

// ------------------------------------------------------------
class Wolf {
  constructor(data) {
    Object.assign(this, data);
    this.w = 14; this.h = 10;
    this.hp = 3;
    this.maxHp = 3;
    this.state = "idle"; // idle | aggro | dead
    this.walkPhase = Math.random() * 10;
    this.hurtTimer = 0;
    this.attackCooldown = 0;
    this.homeX = data.x; this.homeY = data.y;
    this.knockX = 0; this.knockY = 0;
    this.defeated = false;
  }
  get spriteX() { return this.x - 9; }
  get spriteY() { return this.y - 16; }

  update(dt, player, solids) {
    if (this.defeated) return;
    if (this.hurtTimer > 0) this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 90) this.state = "aggro";
    else if (dist > 160) this.state = "idle";

    let mx = 0, my = 0;
    if (this.state === "aggro" && dist > 14) {
      mx = dx / dist; my = dy / dist;
    } else if (this.state === "idle") {
      mx = Math.sin(this.walkPhase * 0.3) * 0.3;
      my = Math.cos(this.walkPhase * 0.2) * 0.3;
    }

    this.walkPhase += dt * (this.state === "aggro" ? 12 : 4);

    const speed = this.state === "aggro" ? 46 : 16;
    const nx = this.x + mx * speed * dt + this.knockX;
    const ny = this.y + my * speed * dt + this.knockY;
    this.knockX *= 0.85; this.knockY *= 0.85;

    const boxAt = (px, py) => ({ x: px - this.w / 2, y: py - this.h / 2, w: this.w, h: this.h });
    if (!collidesAny(boxAt(nx, this.y), solids)) this.x = nx;
    if (!collidesAny(boxAt(this.x, ny), solids)) this.y = ny;

    // Contact damage
    if (dist < 12 && this.attackCooldown <= 0) {
      player.takeDamage(1);
      this.attackCooldown = 1.0;
    }

    // Take damage from player attack
    if (player.attacking > 0) {
      const hb = player.getAttackHitbox();
      const wolfBox = boxAt(this.x, this.y);
      if (this.hurtTimer <= 0 && collidesAny(wolfBox, [hb])) {
        this.hp -= 1;
        this.hurtTimer = 0.4;
        this.knockX = (dx < 0 ? -1 : 1) * -3;
        this.knockY = (dy < 0 ? -1 : 1) * -3;
        AudioSys.hit();
        if (this.hp <= 0) {
          this.defeated = true;
          Game.setFlag("wolfCleared", true);
          Game.showToast("The wolf backs off into the trees...");
        }
      }
    }
  }

  draw(ctx) {
    if (this.defeated) return;
    ctx.save();
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer * 20) % 2 === 0) ctx.globalAlpha = 0.4;
    const facingRight = Game.player.x > this.x;
    if (facingRight) {
      ctx.translate(this.x * 2, 0);
      ctx.scale(-1, 1);
      Textures.wolf(ctx, this.x, this.y, 0.85);
    } else {
      Textures.wolf(ctx, this.x, this.y, 0.85);
    }
    ctx.restore();

    if (this.state === "aggro") {
      // A small alert mark stands in for a pose change, since the
      // texture is one static drawing rather than a sprite set.
      Textures.rect(ctx, this.x - 1, this.y - 34, 2, 8, "#c83c3c");
      Textures.circle(ctx, this.x, this.y - 24, 1.5, "#c83c3c");
    }
  }
}

// ------------------------------------------------------------
class Crystal {
  constructor(data) {
    Object.assign(this, data);
    this.w = 18; this.h = 22;
    this.glowPhase = 0;
  }
  get spriteX() { return this.x - 9; }
  get spriteY() { return this.y - 20; }

  update(dt) { this.glowPhase += dt * 2; }

  draw(ctx) {
    Sprites.drawCrystal(ctx, this.spriteX, this.spriteY, {
      glowPhase: this.glowPhase,
      awakened: Game.flags.visionSeen,
    });
  }

  interact(flags, setFlag) {
    if (!flags.visionSeen) {
      DialogueSys.start("", CRYSTAL_LINES_FIRST_APPROACH, () => {
        Game.playVision();
      });
    } else {
      DialogueSys.start("", CRYSTAL_LINES_AFTER_VISION);
    }
  }
}

function makeEntity(data) {
  if (data.type === "kai" || data.type === "villager") return new NPC(data);
  if (data.type === "wolf") return new Wolf(data);
  if (data.type === "crystal") return new Crystal(data);
  return new NPC(data);
}
