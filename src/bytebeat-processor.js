import { evaluateBytebeat } from "./bytebeat-utils.js"

/** 
 * @typedef {{
 *  bytebeat?: string,
 *  module?: WebAssembly.Module,
 *  frequency: number,
 *  sampleRate: number,
 *  tempo: number,
 *  floatMode?: boolean
 * }} BytebeatProcessorOptions
 * - `bytebeat` Main block of the bytebeat function and its execution
 * - `module` A Wasm module which exports a "bytebeat" function
 * - `frequency` at which 't' will be incremented
 * - `sampleRate` of the audio context
 * - `tempo` which the speed that `tt` will be incremented depends on
 * - `floatMode` Whether the function expects an output between 0:255 (default) or -1:1
 */

class BytebeatProcessor extends AudioWorkletProcessor {
  t = 0
  tt = 0
  startTime = Infinity
  stopTime = Infinity
  sampleRate
  frequency
  tempo
  tDelta
  ttDelta
  /** @type {Function} */ beatcode
  /** @type {(x: number) => number} */ postprocess

  /**
   * BytebeatProcessor runs in the AudioWorkletScope.
   * @param {{ numberOfInputs: number, numberOfOutputs: number, processorOptions: BytebeatProcessorOptions}} options
   */
  constructor(options) {
    super(options)
    if (options.processorOptions.module) {
      WebAssembly.instantiate(options.processorOptions.module).then(mod => {
        this.beatcode = mod.exports.bytebeat
      })
    } else if (typeof options.processorOptions.bytebeat === 'string') {
      this.beatcode = evaluateBytebeat(options.processorOptions.bytebeat)
    } else {
      throw new TypeError('BytebeatProcessor needs a JavaScript function definition string or a WebAssembly.Module to instantiate.')
    }
    this.sampleRate = options.processorOptions.sampleRate
    this.frequency = options.processorOptions.frequency
    this.tempo = options.processorOptions.tempo
    this.tDelta = this.frequency / this.sampleRate
    this.ttDelta = (this.tempo * 8192) / 120 / this.sampleRate
    this.port.onmessage = (/** @type {{ data: { message: any; stopTime: any; startTime: any; }; }} */ event) => {
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

  /**
   * @param {Float32Array[][]} _inputs
   * @param {Float32Array[][]} outputs
   **/
  process(_inputs, [output]) {
    if (currentTime >= this.startTime) {
      let lastT
      let lastTt
      let data
      for (let i = 0; i < output[0].length; ++i) {
        const t = Math.floor(this.t)
        const tt = Math.floor(this.tt)
        if (t !== lastT || tt !== lastTt) {
          data = this.postprocess(this.beatcode(t, tt))
          lastT = t
          lastTt = tt
        }
        for (const channel of output) {
          channel[i] = data
        }
        this.t += this.tDelta
        this.tt += this.ttDelta
      }
    } else {
      for (const channel of output) {
        channel.fill(0)
      }
    }
    return currentTime < this.stopTime
  }
}
registerProcessor('bytebeat-processor', BytebeatProcessor)
