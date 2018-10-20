/** Class representing a note composed of one or more oscillators. */
class Note {
  /** Create a note
  * @param {(AudioContext|AudioNode)} target output destination for audio
  * @param {Object} noteParams options that affect the note as a whole
  * @param {number} noteParams.attack attack time in seconds, defaults to 20ms
  * @param {number} noteParams.decay decay time in seconds, defaults to 20ms
  * @param {number} noteParams.release release time in seconds, defaults to 10ms
  * @param {number} noteParams.sustain sustain level as proportion of peak level, 0 to 1 inclusive
  * @param {number} noteParams.triggerTime time to schedule the note (see AudioContext.currentTime)
  * @param {number} noteParams.velocity note velocity, 0 to 1 inclusive
  * @param {Object[]} oscParams array of oscillator specific options
  * @param {number} oscParams[].detune detune amount of the oscillator in cents
  * @param {number} oscParams[].frequency frequency of the oscillator in Hertz
  * @param {number} oscParams[].gain gain of the oscillator, 0 to 1 inclusive
  * @param {string} oscParams[].type waveform shape, options are "sine", "square", "sawtooth", "triangle"
  */
  constructor (target, noteParams = {} , oscParams = []) {
    this.context = target.context || target
    this.attack = noteParams.attack || 0.02
    this.decay = noteParams.decay || 0.02
    this.sustain = noteParams.sustain || 0.04
    this.release = noteParams.release || 0.01
    this.velocity = noteParams.velocity || 1
    this.triggerTime = noteParams.triggerTime || this.context.currentTime

    this.envGain = this.context.createGain()
    this.envGain.gain.setValueAtTime(0, this.triggerTime)
    this.envGain.gain.linearRampToValueAtTime(
      this.velocity,
      this.triggerTime + this.attack
    )
    this.envGain.gain.setTargetAtTime(
      this.sustain * this.velocity,
      this.triggerTime + this.attack,
      this.decay
    )
    this.envGain.connect(target)
    this.oscs = []
    for (const p of oscParams) {
      let gainer = new GainNode(this.context, {gain: p.gain || 0.5})
      let osc = new OscillatorNode(this.context, {
        type: p.type || 'sine',
        detune: p.detune || 0,
        frequency: p.frequency || 440.0
      })
      osc.connect(gainer)
      gainer.connect(this.envGain)
      osc.start()
      this.oscs.push(osc)
    }
  }
  /** Trigger the release of the envelope */
  releaseNote () {
    this.stopNote(this.context.currentTime + this.release * 20)
    this.envGain.gain.setTargetAtTime(
      0,
      Math.max(this.context.currentTime, this.triggerTime + this.attack + this.decay),
      this.release
    )
  }
  /** Stop all oscillators
  * @param {number} time time to stop, relative to AudioContext.currentTime. Defaults to now.
  */
  stopNote (time = this.context.currentTime) {
    for (const o of this.oscs)
      o.stop(time)
  }
}
