const base = new URL('../assets/audio/', import.meta.url);
const clips = {
  tap: .24, dig: .64, crack: .54, fall: .78, blast: .73,
  brace: .52, coin: .54, sniff: .37, win: .44, fail: .38,
};

export class CrewAudio {
  constructor(settings) {
    this.settings = settings;
    this.banks = new Map();
    this.music = new Audio(new URL('bard.m4a', base));
    this.music.loop = true;
    this.music.volume = .24;
    this.music.preload = 'none';
    this.started = false;
    this.hidden = false;
    this.suspended = false;
  }

  unlock() {
    if (this.started) return;
    this.started = true;
    this.sync();
  }

  sync() {
    const muted = this.hidden || this.suspended;
    if (this.started && this.settings.music && !muted) {
      this.music.play().catch(() => {});
    } else {
      this.music.pause();
    }
    if (!this.settings.effects || muted) {
      for (const bank of this.banks.values()) for (const player of bank) player.pause();
    }
  }

  play(name) {
    if (!this.started || this.hidden || this.suspended || !this.settings.effects || !clips[name]) return;
    if (!this.banks.has(name)) this.banks.set(name, []);
    const bank = this.banks.get(name);
    let player = bank.find(candidate => candidate.paused || candidate.ended);
    if (!player) {
      if (bank.length >= 2) return;
      player = new Audio(new URL(name + '.m4a', base));
      player.volume = clips[name];
      bank.push(player);
    }
    player.currentTime = 0;
    player.play().catch(() => {});
  }
}
