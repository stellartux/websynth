/**
* BytebeatProcessor runs in the AudioWorkletScope
* @param {object} options
* @param {function} options.beatcode Audio generation function with parameter t
* @param {number} options.sampleRate The sample rate the beat should be played at
*/
class BytebeatProcessor extends AudioWorkletProcessor {
  constructor (options) {
    super(options)
    if (!options.processorOptions.hasOwnProperty('bytebeat')) {
      throw 'BytebeatProcessorConstructor: Bytebeat function definition cannot be empty'
    }
    this.beatcode = new Function('t=0, tt=0', 'return ' + options.processorOptions.bytebeat)
    if (typeof (this.beatcode) !== 'function') {
      throw 'BytebeatProcessorConstructor: Bytebeat function definition must be a function'
    } else if (typeof (this.beatcode()) !== 'number') {
      throw 'BytebeatProcessorConstructor: Bytebeat function must return a number'
    }
    this.sampleRate = options.processorOptions.sampleRate || 44100
    this.frequency = options.processorOptions.frequency || 440
    this.tDelta = this.frequency / this.sampleRate
    this.t = 0
    this.tt = 0
    this.tempo = options.processorOptions.tempo
    this.ttDelta = this.tempo / this.sampleRate
    this.startedPlaying = false
    this.stopTime = Infinity
    this.port.onmessage = event => {
      switch (event.data.message) {
        case 'stop':
          this.stopTime = event.data.stopTime
          break
        case 'start':
          this.startedPlaying = true
          break
        default:
      }
    }
  }

  process (inputs, outputs) {
    if (this.startedPlaying) {
      const output = outputs[0]
      for (let channel = 0; channel < output.length; ++channel) {
        for (let i = 0; i < output[channel].length; ++i) {
          output[channel][i] = (this.beatcode(Math.floor(this.t), Math.floor(this.tt)) % 256) / 128 - 1
          this.t += this.tDelta
          this.tt += this.ttDelta
        }
      }
    }
    return currentTime < this.stopTime
  }
}
registerProcessor('bytebeat-processor', BytebeatProcessor)
