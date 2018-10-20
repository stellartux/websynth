class MIDINumber {
  constructor () {}
  static toChord (nums, sharp = true, long = false) {
    const ns = this.makeUnique(nums)
    switch (ns.length) {
      case 0:
        return ''
      case 1:
        return this.toLetter(ns[0], sharp)
      case 2:
        return (long ? this.toInterval(ns) :
         this.toLetter(ns[0], sharp) + '–' + this.toLetter(ns[1], sharp))
      case 3:
        if (this.toTriad(ns))
          return this.toTriad(ns, sharp, long)
      case 4:
        if (this.toTetrachord(ns))
          return this.toTetrachord(ns, sharp, long)
      default:
        return ns.map(n => this.toLetter(n, sharp)).join('–')
     }
  }
  static makeUnique (nums) {
    const indices = []
    for (const n in nums) {
      if (nums[n] - nums[0] < 12 || indices.every(i => nums[i] % 12 !== nums[n] % 12))
        indices.push(n)
    }
    return indices.map(i => nums[i])
  }
  static toFrequency (num) {
    return 13.75 * Math.pow(2, (num - 9) / 12)
  }
  static toLetter (num, sharp = true) {
    return (sharp
      ? ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
      : ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
      )[num % 12]
  }
  static toScientificPitch (num, sharp = true) {
    return this.toLetter(num, sharp) + Math.floor(num / 12)
  }
  static toInterval (nums) {
    return [
      'octave', 'minor second', 'major second', 'minor third',
      'major third', 'perfect fourth', 'diminished fifth', 'perfect fifth',
      'minor sixth', 'major sixth', 'minor seventh', 'major seventh'
    ][(nums[1] - nums[0]) % 12]
  }
  static toTriad (nums, sharp = true , long = false) {
    const tl = l => this.toLetter(nums[l], sharp)
    return (long ? {
        '047': tl(0) + ' major',
        '038': tl(2) + ' major, first inversion',
        '059': tl(1) + ' major, second inversion',
        '037': tl(0) + ' minor',
        '049': tl(2) + ' minor, first inversion',
        '058': tl(1) + ' minor, second inversion',
        '036': tl(0) + ' diminished',
        '039': tl(2) + ' diminished, first inversion',
        '069': tl(1) + ' diminished, second inversion',
        '027': tl(0) + ' suspended second',
        '0714': tl(0) + ' suspended second',
        '057': tl(0) + ' suspended fourth',
        '048': tl(0) + ' augmented'
      } : {
        '047': tl(0),
        '038': tl(2),
        '059': tl(1),
        '037': tl(0) + 'm',
        '058': tl(1) + 'm',
        '049': tl(2) + 'm',
        '036': tl(0) + '°',
        '069': tl(1) + '°',
        '039': tl(2) + '°',
        '027': tl(0) + 'sus2',
        '0714': tl(0) + 'sus2',
        '057': tl(0) + 'sus4',
        '048': tl(0) + '+'
      })[nums.map(n => n - nums[0]).join('')] || ''
  }
  static toTetrachord (nums, sharp = true , long = false) {
    const tl = this.toLetter(nums[0], sharp)
    const chord = (long ? ' ' + {
        '04710': 'dominant seventh',
        '04610': 'dominant seventh flat five',
        '04711': 'major seventh',
        '04714': 'added ninth',
        '03710': 'minor seventh',
        '03711': 'minor major seventh',
        '0369': 'diminished seventh',
        '03610': 'half-diminished seventh',
        '04811': 'augmented major seventh',
        '04810': 'augmented seventh',
        '0479': 'major sixth',
        '0379': 'minor sixth'
      } : {
        '04710': '7',
        '04610': '7♭5',
        '04711': 'M7',
        '04714': 'add9',
        '03710': 'm7',
        '03711': 'mM7',
        '0369': '°7',
        '03610': 'Ø7',
        '04811': '+M7',
        '04810': '+7',
        '0479': '6',
        '0379': 'm6'
      })[nums.map(n => n - nums[0]).join('')]
    if (chord)
      return tl + chord
    else {
      const upperChord = this.toTriad(nums.slice(1), sharp, long)
      if (upperChord)
        return upperChord + (long ? ' over ' : '/') + tl
      else
        return ''
    }
  }
}
