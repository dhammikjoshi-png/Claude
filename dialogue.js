// ============================================================
// DIALOGUE.JS — Dialogue content + a small state machine to
// display lines one at a time. Kai's lines change based on
// story flags so he actually reacts to progress instead of
// repeating one static greeting forever.
// ============================================================

const DialogueSys = {
  active: false,
  queue: [],
  speaker: "",
  onComplete: null,

  start(speaker, lines, onComplete) {
    this.active = true;
    this.speaker = speaker;
    this.queue = [...lines];
    this.onComplete = onComplete || null;
    this._showNext();
    Game.setPaused(true);
  },

  advance() {
    if (!this.active) return;
    AudioSys.blip(300, 0.04);
    this._showNext();
  },

  _showNext() {
    if (this.queue.length === 0) {
      this.active = false;
      document.getElementById("dialogueBox").style.display = "none";
      Game.setPaused(false);
      if (this.onComplete) this.onComplete();
      return;
    }
    const line = this.queue.shift();
    const box = document.getElementById("dialogueBox");
    box.style.display = "block";
    document.getElementById("dialogueSpeaker").textContent = this.speaker;
    document.getElementById("dialogueText").textContent = line;
  },
};

// ------------------------------------------------------------
// Kai's dialogue — changes based on Flags. He has his own goals
// (he wants to prove himself and is a little scared of the woods
// but hides it with bravado) and reacts to what's actually happened.
// ------------------------------------------------------------
function getKaiLines(flags) {
  if (!flags.metKai) {
    return {
      lines: [
        "Hey! Took you long enough — I've been standing here forever.",
        "My gran says weird stuff's been happening near the old woods. Whispers, lights, all that.",
        "I bet it's nothing. Probably. But c'mon, let's find out — after you actually learn to hold a sword right.",
        "Go hit that training dummy over there. I'll watch and judge you mercilessly.",
      ],
      flagsToSet: { metKai: true },
    };
  }
  if (flags.metKai && !flags.trainingComplete) {
    return {
      lines: [
        "The dummy's right there. Don't be scared of a bag of hay.",
        "(Kai crosses his arms, grinning.)",
      ],
      flagsToSet: {},
    };
  }
  if (flags.trainingComplete && !flags.kaiForestWarning) {
    return {
      lines: [
        "Okay, okay — not bad. You didn't embarrass yourself.",
        "Alright. Let's actually go check out the woods. Gran told me not to, which obviously means we have to.",
        "...I'll walk you as far as the forest path. Someone should probably stay close to the village. Just in case.",
        "That's not me being scared. That's called strategy.",
      ],
      flagsToSet: { kaiForestWarning: true },
    };
  }
  if (flags.teenUnlocked && !flags.teenQuestStarted) {
    return {
      lines: [
        "You’re really going back to the woods? Then I’m coming with you this time.",
        "I’ve been mapping the Forest Path while you were away. Three maps, three different roads.",
        "The crystal showed us something, and I’m going to help you find out what it was.",
      ],
      flagsToSet: { teenQuestStarted: true },
    };
  }
  if (flags.visionSeen) {
    return {
      lines: [
        "You're back! You look like you saw a ghost. What happened out there?",
        "...Okay now I really wish I'd gone with you. Tell me everything.",
      ],
      flagsToSet: {},
    };
  }
  return {
    lines: ["Be careful out there. And come tell me everything you find, alright?"],
    flagsToSet: {},
  };
}

function getVillagerLines(npc, flags) {
  if (npc.name === "Mira") {
    if (!flags.kaiForestWarning) {
      return ["Careful playing so close to the tree line, little one.", "Those woods have always kept their secrets."];
    }
    return ["You're heading for the woods, aren't you. I can see it on your face.", "Just... come back safe. That's all I ask."];
  }
  return ["..."];
}

const SIGN_TEXT = {
  signWolfDen: ["A weathered sign: \"Wolf Den — path collapsed, do not enter.\"", "(Something for another day, maybe.)"],
  signAncientGate: ["A crumbling marker: \"Ancient Gate — beyond the deep woods.\"", "(The path further north is overgrown and impassable for now.)"],
  signHiddenCave: ["Faint carvings: \"Hidden Cave.\"", "(You can't tell where the entrance actually is from here.)"],
};

const FOREST_INVESTIGATION_CLUES = {
  forestClueCompass: [
    "A broken hunter’s compass lies beneath the grass.",
    "The needle is pointing toward the forest wall, not north.",
    "Kai should see this. The Forest Path is changing around something.",
  ],
  forestClueRoots: [
    "The roots here have pushed through the path overnight.",
    "Fresh sap glows faintly inside the cracks.",
    "The growth forms the same three-line circle as the crystal symbol.",
  ],
  forestClueMap: [
    "A scrap of Kai’s map is pinned to a tree by a black thorn.",
    "The path drawn on it does not match the road beneath your feet.",
    "A new route is forming deeper in the woods.",
  ],
};

function investigateForestClue(key, flags, setFlag) {
  const lines = FOREST_INVESTIGATION_CLUES[key];
  if (!lines) return false;
  DialogueSys.start("Forest Path", lines, () => {
    setFlag(key, true);
    const count = ["forestClueCompass", "forestClueRoots", "forestClueMap"]
      .filter((clue) => Game.flags[clue]).length;
    if (count >= 3 && !Game.flags.forestPathInvestigated) {
      setFlag("forestPathInvestigated", true);
      DialogueSys.start("Kai", [
        "Three clues, and none of them fit the old maps.",
        "The path isn’t just overgrown. It’s moving.",
        "Let’s report back at Greenvale, then follow the new route together.",
      ], () => Game.showToast("Forest Path investigated — return to Greenvale"));
    }
  });
  return true;
}

const TRAINING_DUMMY_LINES = {
  intro: ["You take a swing at the training dummy with your wooden sword.", "(Tap ATTACK, or press Space, near the dummy to practice.)"],
  complete: ["Solid hit! Kai gives you a thumbs up from across the yard."],
};

const CRYSTAL_LINES_FIRST_APPROACH = [
  "A strange crystal juts from the earth here, humming faintly.",
  "It wasn't glowing like this a moment ago... was it?",
];

const CRYSTAL_VISION_TEXT = [
  "The world falls silent.",
  "A voice, not quite words, brushes against your thoughts...",
  "\"...the gate remembers what the village forgot...\"",
  "Flickers of a place you've never seen flash behind your eyes — stone, starlight, something vast waiting in the dark.",
  "Then, just as suddenly, it's gone. The crystal pulses once, and goes still.",
];

const CRYSTAL_LINES_AFTER_VISION = [
  "The crystal is warm to the touch now, faintly glowing.",
  "Whatever that was... it felt important. You should tell Kai.",
];
