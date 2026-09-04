// STORY.JS — milestone-driven narrative progression.
// This module only coordinates flags, dialogue, and growth. It does not
// replace movement, combat, scene loading, or the existing save system.
"use strict";

const Story = {
  syncLoadedState() {
    if (Game.flags.adultUnlocked) Game.player.growTo("adult");
    else if (Game.flags.teenUnlocked || Game.flags.childhoodComplete) Game.player.growTo("teen");
  },

  afterFirstVision() {
    Game.setFlag("crystalVisionSeen", true);
  },

  onKaiReturn() {
    if (Game.flags.childhoodComplete) return false;
    Game.setFlag("childhoodComplete", true);
    Game.player.growTo("teen");
    Game.setFlag("teenUnlocked", true);
    DialogueSys.start("Kai", [
      "You’re back... but you’re not the same as when you left.",
      "Tell me everything. This time, we’re going back together.",
      "I’ll map the Forest Path. You figure out what the crystal wants us to see.",
      "Whatever is beyond that Gate, we’ll face it as a team.",
    ], () => {
      Game.setFlag("teenQuestStarted", false);
      Game.showToast("Teen chapter: investigate the changing Forest Path");
      Game.persistState();
    });
    return true;
  },

  startTeenInvestigation() {
    if (Game.flags.teenQuestStarted) return;
    Game.setFlag("teenQuestStarted", true);
    Game.showToast("Teen chapter: investigate the changing Forest Path");
  },
};
