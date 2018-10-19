class Note {
  constructor (_target, _noteParams = {}, _oscParams = []) {
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
  releaseNote () {
    this.stopNote(this.context.currentTime + this.release * 20)
    if (this.context.currentTime > this.triggerTime + this.attack + this.decay)
      this.envGain.gain.setTargetAtTime(0, this.context.currentTime, this.release)
    else
      this.envGain.gain.setTargetAtTime(
        0,
        this.triggerTime + this.attack + this.decay,
        this.release
      )
  }
  stopNote (_t = this.context.currentTime) {
    for (const o of this.oscs)
      o.stop(_t)
  }
  static midiToFrequency (_num) {
    return 13.75 * Math.pow(2, (_num - 9) / 12)
  }
  static midiToLetter (_num, _sharp = true) {
    return (_sharp
      ? ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
      : ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
    )[_num % 12]
  }
  static midiToSPN (_num) {
    return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][_num % 12] + Math.floor(_num / 12)
  }
  static midiToInterval (_notes) {
    return [
      'octave', 'minor second', 'major second', 'minor third',
      'major third', 'perfect fourth', 'diminished fifth', 'perfect fifth',
      'minor sixth', 'major sixth', 'minor seventh', 'major seventh'
    ][(_notes[1] - _notes[0]) % 12]
  }
  static midiToTriad (_n, _sharp = true, _long = false) {
    return (_long ? {
      '047': this.midiToLetter(_n[0], _sharp) + ' major',
      '038': this.midiToLetter(_n[2], _sharp) + ' major, first inversion',
      '059': this.midiToLetter(_n[1], _sharp) + ' major, second inversion',
      '037': this.midiToLetter(_n[0], _sharp) + ' minor',
      '049': this.midiToLetter(_n[2], _sharp) + ' minor, first inversion',
      '058': this.midiToLetter(_n[1], _sharp) + ' minor, second inversion',
      '036': this.midiToLetter(_n[0], _sharp) + ' diminished',
      '039': this.midiToLetter(_n[2], _sharp) + ' diminished, first inversion',
      '069': this.midiToLetter(_n[1], _sharp) + ' diminished, second inversion',
      '027': this.midiToLetter(_n[0], _sharp) + ' suspended second',
      '057': this.midiToLetter(_n[0], _sharp) + ' suspended fourth',
      '048': this.midiToLetter(_n[0], _sharp) + ' augmented',
      '0712': this.midiToLetter(_n[0], _sharp) + ' powerchord'
    } : {
      '047': this.midiToLetter(_n[0], _sharp),
      '038': this.midiToLetter(_n[2], _sharp),
      '059': this.midiToLetter(_n[1], _sharp),
      '037': this.midiToLetter(_n[0], _sharp) + 'm',
      '058': this.midiToLetter(_n[1], _sharp) + 'm',
      '049': this.midiToLetter(_n[2], _sharp) + 'm',
      '036': this.midiToLetter(_n[0], _sharp) + '°',
      '069': this.midiToLetter(_n[1], _sharp) + '°',
      '039': this.midiToLetter(_n[2], _sharp) + '°',
      '027': this.midiToLetter(_n[0], _sharp) + 'sus2',
      '057': this.midiToLetter(_n[0], _sharp) + 'sus4',
      '048': this.midiToLetter(_n[0], _sharp) + '+',
      '0712': this.midiToLetter(_n[0], _sharp) + '5'
    })[_n.map(n => n - _n[0]).join('')] || ''
  }
}
