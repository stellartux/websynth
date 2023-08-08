//@ts-check

/** Gives one token of a lookahead to any iterator. */
export class Lookahead {
  #iterator
  #fn
  /** @type {any[]} */ #next = []
  /** @type {boolean|undefined} */ done
  /** @type {any} */ value

  /**
   * @param {Iterator} iterator
   * @param {(x: IteratorReturnResult) => any} [fn] shouldn't have side effects
   */
  constructor(iterator, fn = (x) => x) {
    if (!iterator) {
      throw new Error(`Iterator ${typeof iterator}`)
    }
    this.#iterator = iterator
    this.#fn = fn
  }

  [Symbol.iterator]() {
    return this
  }

  #peek() {
    if (!this.done && this.#next.length === 0) {
      const { done, value } = this.#iterator.next()
      this.#next.push({ done, value: this.#fn(value) })
      return true
    }
    return !this.done
  }

  next() {
    if (this.#peek()) {
      const { done, value } = this.#next.shift()
      this.done = done
      this.value = value
    }
    return this
  }

  /** Peek the next value */
  get [0]() {
    if (!this.done && this.#peek()) {
      return this.#next[0].value
    }
  }

  /** Pop the next value */
  shift() {
    return this.next().value
  }
}

/** @param {RegExp} regex */
export function tokenizer(regex) {
  /** @param {string} code */
  return function (code) {
    return new Lookahead(code.matchAll(regex) ?? [], (result) => result && result[0])
  }
}
