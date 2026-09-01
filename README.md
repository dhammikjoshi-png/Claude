# Whispering Woods — First Playable Slice (v0.1)

A genuine build, not a mockup — open `index.html` in a browser (desktop or
mobile) and it's playable start to finish.

## What's in this slice

Greenvale → meet Kai → wooden-sword training → Forest Path → Whispering
Woods entrance → wolf encounter → crystal clearing → first vision.

Everything is real and interactive:
- Walk around 4 connected scenes (arrow keys/WASD, or the on-screen
  joystick on touch devices)
- Talk to Kai (his dialogue actually changes as you progress — he's not
  a static NPC) and a village elder
- Land 3 practice hits on the training dummy to actually complete
  training (talking to it alone doesn't skip it)
- Fight a wolf with real combat (health, hit reactions, knockback) that
  gates the path forward until you clear it
- Touch the crystal to trigger a scripted vision cutscene
- Save / Load / Restart from the pause menu (⏸ top right)
- Ambient procedural audio that shifts mood per location (village /
  forest / mystery) — no audio files needed
- Two "locked path" signs in the woods, hinting at Wolf Den and the
  Ancient Gate — these aren't built yet, just seeded for later

## How to run it

**Easiest:** open `index.html` directly in a mobile or desktop browser
(double-tap it in your Files app, or drag it into a browser tab).

**To host it properly later:** upload the whole folder to Netlify the
same way as the Ur Homie project — it's static files, no server needed
for this slice.

## Files

| File | Responsibility |
|---|---|
| `index.html` | Page shell, HUD markup, touch control markup, CSS |
| `storage.js` | Save/load abstraction (works in Claude artifacts *and* standalone hosting) |
| `audio.js` | Procedural ambient sound + SFX (Web Audio API, no asset files) |
| `textures.js` | **The whole visual art style.** Every character, tree, house, rock, wolf, fence, and sign is drawn with code — one consistent hand throughout, no image files needed at all |
| `sprites.js` | Just the crystal — kept separate on purpose since it's meant to look otherworldly, not blend in |
| `world.js` | **Data-driven scene definitions** — maps, decorations, exits |
| `entities.js` | Player, NPC, Wolf, Crystal, TrainingDummy — behavior classes |
| `dialogue.js` | All dialogue content, including Kai's flag-based reactions |
| `input.js` | Keyboard + touch joystick, unified into one input state |
| `game.js` | Main loop, scene loading, rendering, story flags, save/load wiring |

## Art: fully code-drawn, one consistent style

Earlier versions of this project tried mixing procedural shapes with
real extracted sprite images. That looked inconsistent — two different
visual languages sharing one scene never reads as coherent, no matter
how much either piece is polished individually.

Everything now draws through `textures.js`: grass, paths, trees,
houses, rocks, fences, lanterns, signs (with real rendered text), the
player, Kai, the wolf, and the training dummy. No image files, no
transparency/keying issues, no upload pitfalls — just one hand-coded
style for the whole world.

**Ground tiles are cached, not redrawn every frame.** `Textures.grass()`
uses `Math.random()` to scatter texture detail, which would visibly
flicker at 60fps if called every frame. `game.js` renders each scene's
ground once onto an offscreen canvas when the scene loads
(`_buildGroundCache`), then just stamps that image each frame.

**The player and Kai share one `person()` drawing function** with
different color palettes — that's why they'll always look like they
belong to the same world no matter how either one changes later. The
player's growth stages (child/teen/adult) currently just scale this up
slightly (`STAGE_SCALE` in `entities.js`); true proportion changes per
stage would be a good next enhancement when Phase 3 actually needs it.

If you ever want to move to real hand-drawn art later, draw it with an
actual transparent background from the start (not a solid color to key
out afterward) — that's the one non-negotiable requirement that tripped
up every AI-generated sheet we tried.

## Why it's structured this way

**`world.js` is pure data.** Every scene is an object with a tile grid,
a decorations list, and exits. To add Hidden Cave, Deep Woods, Wolf Den,
Ruined Shrine, or the Ancient Gate later, you add a new entry to
`SCENES` and point an exit at it — `game.js` doesn't need to change at
all. This is deliberate: it's the same pattern used for the 4 scenes
that already exist.

**Growth stages are already wired, just not triggered yet.** `Player`
has a `stage` property (`child` / `teen` / `adult`) that changes
movement speed, health, and sprite proportions via `growTo(stage)` —
the code path exists, it's just never called yet since this slice ends
before the story would age the character up. When you're ready to build
Phase 3, you call `Game.player.growTo("teen")` at the right story beat
and update `SCENES` entries to check the player's stage (e.g. new exits
or NPC lines that only appear once `stage !== "child"`).

**Combat, dialogue, and interaction are all flag-driven**, not
hardcoded per-scene — `Game.flags` is a plain object anyone can read
from or write to. This is what makes "earlier choices affecting later
events" straightforward later: it's already how Kai's dialogue and the
wolf-gated exit work today.

See `MULTIPLAYER-NOTES.md` for how the online free-roam phase can be
added on top of this without a rewrite.
