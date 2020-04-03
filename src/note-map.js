/** an extension of the built-in Map object for keeping track of groups of pressed keys */
export class NoteMap extends Map {
  release(num) {
    const note = this.get(num)
    note.releaseNote()
    this.delete(num)
    return note
  }

  releaseAll() {
    this.forEach(n => n.releaseNote())
    this.clear()
  }

  stop(num) {
    this.get(num).stopNote()
    this.delete(num)
  }

  stopAll() {
    this.forEach(n => n.stopNote())
    this.clear()
  }

  sustain(num) {
    const note = this.get(num)
    this.delete(num)
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
