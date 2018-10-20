/** A helper singleton for converting MIDI note numbers into other representations of musical notes. */
class MIDINumber {
  /**
  * Calculates the name of a chord from an array of MIDI note numbers.
  * If a name can't be found, lists all held notes, separated by long dashes.
  * @param {number[]} nums An array of MIDI note numbers.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat
  * @param {boolean} [verbose=false] Format as short or verbose form of chord names
  * @returns {string} The chord name of the held notes.
  */
  static toChord (nums, sharp = true, verbose = false) {
    const ns = this.makeUnique(nums)
    return this.toPentaChord(ns, sharp, verbose) ||
      this.toTetrachord(ns, sharp, verbose) ||
      this.toTriad(ns, sharp, verbose) ||
      (verbose && this.toInterval(nums)) ||
      nums.map(n => this.toLetter(n, sharp)).join('–')
  }

  /** Removes any notes which are an octave multiple of a lower note.
  * @example
  * // returns [60, 64, 67, 74]
  * MIDINumber.makeUnique([60, 64, 67, 72, 74, 76, 79])
  * @param {number[]} nums An array of MIDI note numbers
  * @returns {number[]} An array of MIDI note numbers
  */
  static makeUnique (nums) {
    const indices = []
    for (const n in nums)
      if (nums[n] - nums[0] < 12 || indices.every(i => nums[i] % 12 !== nums[n] % 12))
        indices.push(n)
    return indices.map(i => nums[i])
  }

  /** Converts a MIDI number to its frequency in equal temperament.
  * @param {number} num A MIDI note number. Floating point numbers are interpolated logarithmically.
  * @returns {number} The note's frequency in Hertz
  */
  static toFrequency (num) {
    return 13.75 * Math.pow(2, (num - 9) / 12)
  }

  /** Converts a MIDI number to its note name.
  * @param {number} num A MIDI number.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat.
  * @returns {string} The note name
  */
  static toLetter (num, sharp = true) {
    return (sharp
      ? ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
      : ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
      )[num % 12]
  }

  /** Converts a MIDI number to scientific pitch notation.
  * @example
  * //returns 'C5'
  * MIDINumber.toScientificPitch(60)
  * @param {number} num A MIDI number.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat.
  * @returns {string} The note name and octave number
  */
  static toScientificPitch (num, sharp = true) {
    return this.toLetter(num, sharp) + Math.floor(num / 12)
  }

  /** Calculates the interval between a pair of MIDI numbers.
  * @param {number[]} nums The MIDI numbers to find the interval between.
  * @returns {string} The interval between the notes.
  */
  static toInterval (nums) {
    if (nums.length !== 2) return ''
    return [
      'octave', 'minor second', 'major second', 'minor third',
      'major third', 'perfect fourth', 'diminished fifth', 'perfect fifth',
      'minor sixth', 'major sixth', 'minor seventh', 'major seventh'
    ][(nums[1] - nums[0]) % 12]
  }

  /** Calculates the chord represented by three MIDI numbers.
  * @param {number[]} nums The MIDI numbers to find the chord of.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat.
  * @param {boolean} [verbose=false] Format as short or verbose form of chord names
  * @returns {string} The calculated chord, or an empty string if no chord is found.
  */
  static toTriad (nums, sharp = true , verbose = false) {
    if (nums.length !== 3)
      return ''
    const tl = l => this.toLetter(nums[l], sharp)
    return (verbose ? {
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

  /** Calculates the chord represented by four MIDI numbers.
  * @param {number[]} nums The MIDI numbers to find the chord of.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat.
  * @param {boolean} [verbose=false] Format as short or verbose form of chord names
  * @param {boolean} [slashOkay=true] Whether to return a slash chord if no tetrachord is found.
  * @returns {string} The calculated chord, or an empty string if no chord is found.
  */
  static toTetrachord (nums, sharp = true , verbose = false, slashOkay = true) {
    if (nums.length !== 4)
      return ''
    const tl = this.toLetter(nums[0], sharp)
    const chord = (verbose ? {
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
    const upperChord = this.toTriad(nums.slice(1), sharp, verbose)
    if (slashOkay && upperChord)
      return upperChord + (verbose ? ' over ' : '/') + tl
    else
      return ''
  }

  /** Calculates the chord represented by five MIDI numbers.
  * @param {number[]} nums The MIDI numbers to find the chord of.
  * @param {boolean} [sharp=true] Format accidentals as sharp or flat.
  * @param {boolean} [verbose=false] Format as short or verbose form of chord names
  * @param {boolean} [slashOkay=true] Whether to return a slash chord if no pentachord is found.
  * @returns {string} The calculated chord, or an empty string if no chord is found.
  */
  static toPentaChord(nums, sharp = true, verbose = false, slashOkay = true) {
    if (nums.length !== 5)
      return ''
    const tl = this.toLetter(nums[0], sharp)
    const chord = (verbose ? {
      '0471114': ' major ninth',
      '0471014': ' dominant ninth',
      '0371114': ' minor major ninth',
      '0371014': ' minor ninth',
      '0481114': ' augmented major ninth',
      '0481014': ' augmented dominant ninth',
      '0361014': ' half-diminished ninth',
      '0361013': ' half-diminished minor ninth',
      '036914': ' diminished ninth',
      '036913': ' diminished minor ninth'
    } : {
      '0471114': 'M9',
      '0471014': '9',
      '0371114': 'mM9',
      '0371014': 'm9',
      '0481114': '+M9',
      '0481014': '+9',
      '0361014': 'ø9',
      '0361013': 'ø♭9',
      '036914': 'ᴼ9',
      '036913': 'ᴼ♭9' 
    })[nums.map(n => n - nums[0]).join('')]
    if (chord)
      return tl + chord
    const upperChord = this.toPentaChord(nums.slice(1), sharp, verbose, false)
    if (slashOkay && upperChord)
      return upperChord + (verbose ? ' over ' : '/') + tl
    else
      return ''
  }
}
