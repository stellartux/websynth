/**
* BytebeatProcessor runs in the AudioWorkletScope
* @param {object} options
* @param {string} options.processorOptions.beatcode
* Main block of the bytebeat function and its execution
* @param {number} options.processorOptions.frequency
* The frequency at which 't' will be incremented
* @param {number} options.processorOptions.sampleRate
* The sample rate of the audio context
* @param {number} options.processorOptions.tempo
* The tempo which the speed that tt will be incremented depends on
* @param {boolean} [options.processorOptions.floatMode=false]
* Whether the function expects an output between 0:255 (default) or -1:1
*/
class BytebeatProcessor extends AudioWorkletProcessor {
  constructor (options) {
    super(options)
    this.beatcode = new Function('t,tt', options.processorOptions.beatcode)
    this.sampleRate = options.processorOptions.sampleRate
    this.frequency = options.processorOptions.frequency
    this.tDelta = this.frequency / this.sampleRate
    this.t = 0
    this.tt = 0
    this.tempo = options.processorOptions.tempo
    this.ttDelta = this.tempo * 8192 / 120 / this.sampleRate
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
