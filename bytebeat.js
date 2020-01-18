/**
 * BytebeatNode runs in the main scope. Error checking is performed in the main
 * scope before attempting to instantiate the function in the AudioWorkletScope
 * @param {AudioContext} context
 * @param {string} bytebeat The bytebeat function to be played
 * @param {number} [frequency=8000] The fundamental frequency of the note to be played, used by 't'
 * @param {number} [tempo=120] The tempo that will be translated to counter 'tt'
 * @param {boolean} [floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
 */
class BytebeatNode extends AudioWorkletNode {
  constructor(
    context,
    bytebeat,
    frequency = 8000,
    tempo = 120,
    floatMode = false
  ) {
    BytebeatNode.evaluateBytebeat(bytebeat)
    super(context, 'bytebeat-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: {
        beatcode: BytebeatNode.wrapFunction(bytebeat),
        frequency: frequency,
        sampleRate: context.sampleRate,
        tempo: tempo,
        floatMode: floatMode,
      },
    })
  }

  forceNum(value) {
    return typeof value === 'number' ? value : 0
  }

  start(startTime) {
    this.port.postMessage({
      message: 'start',
      startTime: this.forceNum(startTime),
    })
  }

  stop(stopTime) {
    this.port.postMessage({
      message: 'stop',
      stopTime: this.forceNum(stopTime),
    })
  }

  static wrapFunction(f) {
    return `with (Math) {
    const int=(x,i=0)=>typeof(x)==='number'?floor(x):x.charCodeAt(i)
    return (${f})}`
  }

  /** Easy way of checking whether a bytebeat code is valid
   * @param {string} bytebeat
   * @return {boolean} Whether the string represents a valid bytebeat code
   */
  static validateBytebeat(bytebeat) {
    try {
      BytebeatNode.evaluateBytebeat(bytebeat)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * @param {string} bytebeat
   * @returns {function}
   */
  static evaluateBytebeat(bytebeat) {
    const beatcode = new Function('t=0,tt=0', this.wrapFunction(bytebeat))
    if (typeof beatcode !== 'function') {
      throw new SyntaxError('Bytebeat function definition must be a function')
    } else if (typeof beatcode(0) !== 'number') {
      throw new TypeError('Bytebeat function must return a number')
    }
    return beatcode
  }
}
