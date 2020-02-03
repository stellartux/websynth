/** A musical note composed of one or more oscillators and an ADSR envelope. */
export class Note {
  /** Create a note
   * @param {(AudioContext|AudioNode)} target output destination for audio
   * @param {Object} [noteParams] options that affect the note as a whole
   * @param {number} [noteParams.attack=0.02] attack time in seconds
   * @param {number} [noteParams.decay=0.02] decay time in seconds
   * @param {number} [noteParams.release=0.01] release time in seconds
   * @param {number} [noteParams.sustain=0.04] sustain level as proportion of peak level, 0 to 1 inclusive
   * @param {number} [noteParams.triggerTime=target.currentTime] time to schedule the note (see AudioContext.currentTime)
   * @param {number} [noteParams.velocity=1] note velocity, 0 to 1 inclusive
   */
  constructor(target, noteParams = {}) {
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
  }

  /** Trigger the release of the envelope */
  releaseNote() {
    this.stopNote(this.context.currentTime + this.release * 20)
    this.envGain.gain.setTargetAtTime(
      0,
      Math.max(
        this.context.currentTime,
        this.triggerTime + this.attack + this.decay
      ),
      this.release
    )
  }

  /** Stop all oscillators
   * @param {number} [time=AudioContext.currentTime] When to stop playing the note.
   */
  stopNote(time = this.context.currentTime) {
    for (const o of this.oscs) {
      o.stop(time)
    }
  }
}
