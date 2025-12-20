export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Context is initialized on first user interaction to comply with browser policies
  }

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, slideTo?: number) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playJump() {
    this.playTone(200, 'square', 0.2, 0.1, 600);
  }

  public playRoll() {
    this.playTone(150, 'sawtooth', 0.3, 0.15, 50);
  }

  public playLane() {
    this.playTone(400, 'triangle', 0.1, 0.05, 200);
  }

  public playCoin() {
    const now = this.ctx?.currentTime || 0;
    this.playTone(880, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1320, 'sine', 0.15, 0.1), 50);
  }

  public playHit() {
    this.playTone(100, 'sawtooth', 0.5, 0.3, 20);
    // Noise burst
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  public startBGM() {
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    // Simple festive pentatonic loop: C4, D4, E4, G4, A4
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00];
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      // Bass note every 4 steps
      if (step % 4 === 0) {
        this.playTone(scale[0] / 2, 'triangle', 0.4, 0.05);
      }
      this.playTone(freq, 'sine', 0.2, 0.03);
      step++;
    }, 200);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
  }
}
