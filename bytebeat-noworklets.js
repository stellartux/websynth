/**
* A polyfill for BytebeatNode in systems that don't have AudioWorkletNode.
* Instead of real time generation, a thirty second sample is generated
*
* BytebeatNode runs in the main scope. Error checking is performed in the main
* scope before attempting to instantiate the function in the AudioWorkletScope
* @variation no AudioWorkletNode
* @param {AudioContext} context
* @param {string} bytebeat The bytebeat function to be played
* @param {number} [frequency=8000] The fundamental frequency of the note to be played, used by 't'
* @param {number} [tempo=120] The tempo that will be translated to counter 'tt'
* @param {boolean} [floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
* @param {number} [bufferLength=2] Length of the buffer to render in seconds
*/
class BytebeatNode {
  constructor (context, bytebeat, frequency = 8000, tempo = 120, floatMode = false, bufferLength = 2) {
    this.context = context
    this.beatcode = BytebeatNode.evaluateBytebeat(bytebeat)
    this.sampleRate = this.context.sampleRate
    this.timeDelta = frequency / this.sampleRate
    this.time = 0
    this.tempoTime = 0
    this.tempoTimeDelta = tempo * 8192 / 120 / this.sampleRate
    if (floatMode) {
      this.postprocess = t => Math.min(1, Math.max(-1, t))
    } else {
      this.postprocess = t => (t % 256) / 128 - 1
    }
    this.buffer = this.context.createBuffer(1,
      this.sampleRate * bufferLength,
      this.sampleRate)
    this.buffer.getChannelData(0).forEach((v, i, p) => {
      p[i] = this.postprocess(this.beatcode(
        floatMode ? this.time : this.time | 0,
        floatMode ? this.tempoTime : this.tempoTime | 0))
      this.time += this.timeDelta
      this.tempoTime += this.tempoTimeDelta
    })
    this.connected = false
    this.source = this.context.createBufferSource()
    this.source.buffer = this.buffer
  }

  forceNum (value) {
    return typeof (value) === 'number' ? value : 0
  }

  start (startTime) {
    if (!this.connected) {
      this.connect()
    }
    this.source.start(startTime)
  }

  stop (stopTime) {
    if (this.source) {
      this.source.stop(stopTime)
      this.source = undefined
    }
  }

  restart (time = 0) {
    this.source = this.context.createBufferSource()
    this.source.buffer = this.buffer
    this.connect()
    this.start(time)
  }

  connect (destination = this.context.destination) {
    this.source.connect(destination)
    this.connected = true
  }

  static wrapFunction (f) {
    return `with (Math) {
    const int=(x,i=0)=>typeof(x)==='number'?floor(x):x.charCodeAt(i)
    return ${f}}`
  }

  /** Easy way of checking whether a bytebeat code is valid
  * @param {string} bytebeat
  * @return {boolean} Whether the string represents a valid bytebeat code
  */
  static validateBytebeat (bytebeat) {
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
  static evaluateBytebeat (bytebeat) {
    const beatcode = new Function('t=0,tt=0', this.wrapFunction(bytebeat))
    if (typeof (beatcode) !== 'function') {
      throw new SyntaxError('Bytebeat function definition must be a function')
    } else if (typeof (beatcode(0)) !== 'number') {
      throw new TypeError('Bytebeat function must return a number')
    }
    return beatcode
  }
}
