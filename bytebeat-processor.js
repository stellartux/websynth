/**
* BytebeatProcessor runs in the AudioWorkletScope
* @param {object} options
* @param {string} options.processorOptions.beatcode String representing an audio generation function with parameter t
* @param {number} options.processorOptions.sampleRate The sample rate the beat should be played at
* @param {number} options.processorOptions.tempo
* @param {boolean} [options.processorOptions.floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
*/
class BytebeatProcessor extends AudioWorkletProcessor {
  constructor (options) {
    super(options)
    if (!options.processorOptions.hasOwnProperty('bytebeat')) {
      throw 'BytebeatProcessorConstructor: Bytebeat function definition cannot be empty'
    }
    this.beatcode = new Function(
      `t=0,tt=0,sin=Math.sin,cos=Math.cos,PI=Math.PI,ceil=Math.ceil,
      int=floor=Math.floor,tan=Math.tan,E=Math.E,exp=Math.exp,TAU=2*PI`,
      'return ' + options.processorOptions.bytebeat)
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
    this.startTime = Infinity
    this.stopTime = Infinity
    this.port.onmessage = event => {
      switch (event.data.message) {
        case 'stop':
          this.stopTime = currentTime + event.data.stopTime
          break
        case 'start':
          this.startTime = currentTime + event.data.startTime
          break
        default:
      }
    }
    if (options.processorOptions.floatMode) {
      this.postprocess = t => Math.min(1, Math.max(-1, t))
    } else {
      this.postprocess = t => (t % 256) / 128 - 1
    }
  }

  process (inputs, outputs) {
    const output = outputs[0]
    if (currentTime >= this.startTime) {
      for (let i = 0; i < output[0].length; ++i) {
        const data = this.postprocess(
          this.beatcode(Math.floor(this.t), Math.floor(this.tt)))
        for (let channel = 0; channel < output.length; ++channel) {
          output[channel][i] = data
        }
        this.t += this.tDelta
        this.tt += this.ttDelta
      }
    } else {
      for (let channel = 0; channel < output.length; ++channel) {
        for (let i = 0; i < output[channel].length; ++i) {
          output[channel][i] = 0
        }
      }
    }
    return currentTime < this.stopTime
  }
}
registerProcessor('bytebeat-processor', BytebeatProcessor)
