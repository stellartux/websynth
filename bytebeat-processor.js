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
    this.beatcode = new Function('t', 'return ' + options.processorOptions.bytebeat)
    if (typeof (this.beatcode) !== 'function') {
      throw 'BytebeatProcessorConstructor: Bytebeat function definition must be a function'
    } else if (typeof (this.beatcode(0)) !== 'number') {
      throw 'BytebeatProcessorConstructor: Bytebeat function must return a number'
    }
    this.sampleRate = options.processorOptions.sampleRate || 44100
    this.frequency = options.processorOptions.frequency || 440
    this.tDelta = this.frequency / this.sampleRate
    this.t = 0
    this.continuePlaying = true
    this.startedPlaying = false
    this.port.onmessage = event => {
      switch (event.data.message) {
        case 'stop':
          this.continuePlaying = false
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
          output[channel][i] = (this.beatcode(Math.floor(this.t)) % 256) / 128 - 1
          this.t += this.tDelta
        }
      }
    }
    return this.continuePlaying
  }
}
registerProcessor('bytebeat-processor', BytebeatProcessor)
