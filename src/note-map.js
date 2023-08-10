/** @extends {Map<number,import("./note").Note>} For keeping track of groups of pressed keys */
export class NoteMap extends Map {
  /** @param {number} num */
  release(num) {
    const note = this.get(num)
    note?.releaseNote()
    this.delete(num)
    return note
  }

  releaseAll() {
    this.forEach((note) => note.releaseNote())
    this.clear()
  }

  /** @param {number} num */
  stop(num) {
    this.get(num).stopNote()
    this.delete(num)
  }

  stopAll() {
    this.forEach((note) => note.stopNote())
    this.clear()
  }

  /** @param {number} num */
  sustain(num) {
    const note = this.get(num)
    this.delete(num)
    return note
  }

  sustainAll() {
    const notes = []
    this.forEach((note) => {
      notes.push(note)
    })
    this.clear()
    return notes
  }
}
