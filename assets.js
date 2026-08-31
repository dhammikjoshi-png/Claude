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
    this.load("kai", "kai.png");
    this.load("wolf", "wolf.png");
    this.load("tree", "tree.png");
    this.load("fence", "fence.png");
  },

  has(name) {
    return this.ready[name] === true;
  },
};

Assets.init();
