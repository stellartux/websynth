/** an extension of the built-in Map object for keeping track of groups of pressed keys */
export class NoteMap extends Map {
  /**
   * @param {number} midiNumber 
   */
  release(midiNumber) {
    const note = this.get(midiNumber)
    note.releaseNote()
    this.delete(midiNumber)
    return note
  }

  releaseAll() {
    this.forEach(n => n.releaseNote())
    this.clear()
  }

  /**
   * @param {number} midiNumber 
   */
  stop(midiNumber) {
    this.get(midiNumber).stopNote()
    this.delete(midiNumber)
  }

  stopAll() {
    this.forEach(n => n.stopNote())
    this.clear()
  }

  /**
   * @param {number} midiNumber
   */
  sustain(midiNumber) {
    const note = this.get(midiNumber)
    this.delete(midiNumber)
    return note
  }

  sustainAll() {
    const notes = []
    this.forEach(n => {
      notes.push(n)
    })
    this.clear()
  }
}
