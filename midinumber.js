class MIDINumber {
  constructor () {}
  static toChord (nums, sharp = true, long = false) {
    const ns = this.makeUnique(nums)
    return this.toPentaChord(ns, sharp, long) ||
      this.toTetrachord(ns, sharp, long) ||
      this.toTriad(ns, sharp, long) ||
      (long && this.toInterval(nums)) ||
      nums.map(n => this.toLetter(n, sharp)).join('–')
  }
  static makeUnique (nums) {
    const indices = []
    for (const n in nums)
      if (nums[n] - nums[0] < 12 || indices.every(i => nums[i] % 12 !== nums[n] % 12))
        indices.push(n)
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
    if (nums.length !== 2)
      return ''
    return [
      'octave', 'minor second', 'major second', 'minor third',
      'major third', 'perfect fourth', 'diminished fifth', 'perfect fifth',
      'minor sixth', 'major sixth', 'minor seventh', 'major seventh'
    ][(nums[1] - nums[0]) % 12]
  }
  static toTriad (nums, sharp = true , long = false) {
    if (nums.length !== 3)
      return ''
    const tl = l => this.toLetter(nums[l], sharp)
    return (long ? {
        '047': tl(0) + ' major',
        '0716': tl(0) + ' major',
        '038': tl(2) + ' major',
        '0815': tl(1) + ' major',
        '059': tl(1) + ' major',
        '0917': tl(2) + ' major',
        '037': tl(0) + ' minor',
        '049': tl(2) + ' minor',
        '058': tl(1) + ' minor',
        '0715': tl(0) + ' minor',
        '0916': tl(1) + ' minor',
        '0817': tl(2) + ' minor',
        '036': tl(0) + ' diminished',
        '039': tl(2) + ' diminished',
        '069': tl(1) + ' diminished',
        '0615': tl(0) + ' diminished',
        '0915': tl(2) + ' diminished',
        '0918': tl(1) + ' diminished',
        '027': tl(0) + ' suspended second',
        '0714': tl(0) + ' suspended second',
        '057': tl(0) + ' suspended fourth',
        '048': tl(0) + ' augmented',
        '0410': tl(0) + ' seventh, no fifth',
        '0411': tl(0) + ' major seventh, no fifth',
        '0310': tl(0) + ' minor seventh, no fifth',
        '0311': tl(0) + ' minor major seventh, no fifth',
      } : {
        '047': tl(0),
        '0716': tl(0),
        '038': tl(2),
        '0815': tl(1),
        '059': tl(1),
        '0917': tl(2),
        '037': tl(0) + 'm',
        '058': tl(1) + 'm',
        '049': tl(2) + 'm',
        '0715': tl(0) + 'm',
        '0916': tl(1) + 'm',
        '0817': tl(2) + 'm',
        '036': tl(0) + 'ᴼ',
        '069': tl(1) + 'ᴼ',
        '039': tl(2) + 'ᴼ',
        '0615': tl(0) + 'ᴼ',
        '0918': tl(1) + 'ᴼ',
        '0915': tl(2) + 'ᴼ',
        '027': tl(0) + 'sus2',
        '0714': tl(0) + 'sus2',
        '057': tl(0) + 'sus4',
        '048': tl(0) + '+',
        '0410': tl(0) + '7no5',
        '0411': tl(0) + 'M7no5',
        '0310': tl(0) + 'm7no5',
        '0311': tl(0) + 'mM7no5'
      })[nums.map(n => n - nums[0]).join('')] || ''
  }
  static toTetrachord (nums, sharp = true , long = false, slashOkay = true) {
    if (nums.length !== 4)
      return ''
    const tl = this.toLetter(nums[0], sharp)
    const chord = (long ? {
        '04710': ' dominant seventh',
        '04610': ' dominant seventh flat five',
        '04711': ' major seventh',
        '04714': ' added ninth',
        '03710': ' minor seventh',
        '03711': ' minor major seventh',
        '0369': ' diminished seventh',
        '03610': ' half-diminished seventh',
        '04811': ' augmented major seventh',
        '04810': ' augmented seventh',
        '0479': ' major sixth',
        '0379': ' minor sixth',
        '0457': ' added fourth',
        '0357': ' minor added fourth',
        '0347': ' mixed third'
      } : {
        '04710': '7',
        '04610': '7♭5',
        '04711': 'M7',
        '04714': 'add9',
        '03710': 'm7',
        '03711': 'mM7',
        '0369': 'ᴼ7',
        '03610': 'Ø7',
        '04811': '+M7',
        '04810': '+7',
        '0479': '6',
        '0379': 'm6',
        '0457': 'add4',
        '0357': 'madd4',
        '0347': '¬'
      })[nums.map(n => n - nums[0]).join('')]
    if (chord)
      return tl + chord
    const upperChord = this.toTriad(nums.slice(1), sharp, long)
    if (slashOkay && upperChord)
      return upperChord + (long ? ' over ' : '/') + tl
    else
      return ''
  }
  static toPentaChord(nums, sharp = true, long = false, slashOkay = true) {
    if (nums.length !== 5)
      return ''
    const tl = this.toLetter(nums[0], sharp)
    const chord = (long ? {} : {})[nums.map(n => n - nums[0]).join('')]
    if (chord)
      return tl + chord
    const upperChord = this.toPentaChord(nums.slice(1), sharp, long, false)
    if (slashOkay && upperChord)
      return upperChord + (long ? ' over ' : '/') + tl
    else
      return ''
  }
}
