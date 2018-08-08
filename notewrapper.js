class Note {
  constructor(_target, _oscParams = [], _noteParams = {}) {
    this.context = _target.context || _target
    this.attack = _noteParams.attack || 0.02
    this.decay = _noteParams.decay || 0.02
    this.sustain = _noteParams.sustain || 0.04
    this.release = _noteParams.release || 0.01
    this.velocity = _noteParams.velocity || 1
    this.triggerTime = _noteParams.triggerTime || this.context.currentTime

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
    this.envGain.connect(_target)
    this.oscs = []
    for (let p of _oscParams) {
      let gainer = new GainNode(this.context)
      let osc = this.context.createOscillator()
      gainer.gain.value = p.gain || 0.5
      osc.type = p.type || "sine"
      osc.detune.value = p.detune || 0
      osc.frequency.value = p.frequency || 440.0
      osc.connect(gainer)
      gainer.connect(this.envGain)
      osc.start()
      this.oscs.push(osc)
    }
  }
  releaseNote() {
    for (let o of this.oscs) {
      o.stop(this.context.currentTime + this.release * 20)
    }
    if (
      this.context.currentTime >
      this.triggerTime + this.attack + this.decay
    ) {
      this.envGain.gain.setTargetAtTime(
        0,
        this.context.currentTime,
        this.release
      )
    } else {
      this.envGain.gain.setTargetAtTime(
        0,
        this.triggerTime + this.attack + this.decay,
        this.release
      )
    }
  }
  stopNote() {
    for (let o of this.oscs) {
      o.stop(this.context.currentTime)
    }
  }
}
