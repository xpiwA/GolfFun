// Original procedural sound: no third-party music, trackers or external audio requests.
export class GolfAudio {
    constructor() { this.ctx = null; this.music = false; this.weather = true; this.wind = 0; this.timers = []; this.disposed = false; }
    async activate() {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        if (!this.ctx) {
            this.ctx = new Audio(); this.master = this.ctx.createGain(); this.master.gain.value = .3; this.master.connect(this.ctx.destination);
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            this.noise = this.ctx.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true;
            this.filter = this.ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 500;
            this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0;
            this.noise.connect(this.filter); this.filter.connect(this.windGain); this.windGain.connect(this.master); this.noise.start();
            this.sequence = 0;
            this.timers.push(setInterval(() => this.musicStep(), 2400));
            this.visibility = () => this.sync(); document.addEventListener('visibilitychange', this.visibility);
        }
        await this.ctx.resume(); this.sync(); this.musicStep(); return true;
    }
    sync() {
        if (!this.ctx) return;
        this.windGain.gain.setTargetAtTime(this.weather && !document.hidden ? this.wind / 110 : 0, this.ctx.currentTime, .4);
        this.filter.frequency.setTargetAtTime(220 + this.wind * 70, this.ctx.currentTime, .4);
        this.master.gain.setTargetAtTime(document.hidden ? 0 : .3, this.ctx.currentTime, .2);
    }
    tone(frequency, duration, volume = .12, delay = 0) {
        if (!this.ctx || this.disposed || document.hidden) return;
        const o = this.ctx.createOscillator(), gain = this.ctx.createGain(), t = this.ctx.currentTime + delay;
        o.type = 'sine'; o.frequency.value = frequency;
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + .04); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
        o.connect(gain); gain.connect(this.master); o.start(t); o.stop(t + duration + .1); o.onended = () => { o.disconnect(); gain.disconnect(); };
    }
    musicStep() {
        if (!this.music || !this.ctx || document.hidden) return;
        const chords = [[130.81, 196, 261.63], [110, 164.81, 220], [87.31, 130.81, 174.61], [98, 146.83, 196]];
        const chord = chords[this.sequence++ % 4];
        chord.forEach((f, i) => this.tone(f, 3.8, .055, i * .09));
        this.tone(chord[this.sequence % 3] * 2, 2, .035, .5);
    }
    hit() { this.tone(140, .12, .32); this.tone(570, .07, .12); }
    holed() { [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, .8, .16, i * .15)); }
    dispose() { this.disposed = true; this.timers.forEach(clearInterval); document.removeEventListener('visibilitychange', this.visibility); this.ctx?.close().catch(() => {}); }
}
