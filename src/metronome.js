/**
 * @param {(AudioContext|AudioNode)} target output destination for audio
 * @param {number} [tempo=120] Tempo of metronome in bpm
 */
export class Metronome {
  constructor(target, tempo = 120) {
    this.context = target.context || target
    this.target = target.destination || target
    this.tempo = tempo
    this.active = false
    this.buffer = this.context.createBuffer(
      1,
      Math.floor((1024 * this.context.sampleRate) / 44100),
      this.context.sampleRate
    )
    this.buffer.getChannelData(0).forEach((_, i, samples) => {
      samples[i] = (1 - (i + 1) / samples.length) * (Math.random() * 2 - 1)
    })
  }

  get tempo() {
    return this.period * 60000
  }
  /** @param {number} bpm */
  set tempo(bpm) {
    this.period = 60000 / bpm
  }

  /** Makes a ticking sound
   * @param {number} [playbackRate=1] Factor to scale the playback rate by.
   */
  tick(playbackRate = 1) {
    const tick = this.context.createBufferSource()
    tick.buffer = this.buffer
    tick.playbackRate.value = playbackRate
    tick.connect(this.target)
    tick.start()
  }

  start() {
    this.active = true
    /** Makes ticking noises while the metronome is active */
    const keepTicking = () => {
      if (this.active) {
        this.tick()
        window.setTimeout(keepTicking, this.period)
      }
    }
    keepTicking()
  }

  stop() {
    this.active = false
  }
}
