import { BytebeatUtils } from './bytebeat-utils.js'

/**
 * A polyfill for BytebeatNode in systems that don't have AudioWorkletNode.
 * Instead of real time generation, a thirty second sample is generated
 *
 * @variation no AudioWorkletNode
 * @param {AudioContext} context
 * @param {string} bytebeat The bytebeat function to be played
 * @param {number} [frequency=8000] The fundamental frequency of the note to be played, used by 't'
 * @param {number} [tempo=120] The tempo that will be translated to counter 'tt'
 * @param {boolean} [floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
 * @param {number} [bufferLength=2] Length of the buffer to render in seconds
 */
export class BytebeatNode {
  constructor(
    context,
    bytebeat,
    frequency = 8000,
    tempo = 120,
    floatMode = false,
    bufferLength = 2
  ) {
    this.context = context
    this.beatcode = BytebeatUtils.evaluateBytebeat(bytebeat)
    this.sampleRate = this.context.sampleRate
    this.timeDelta = frequency / this.sampleRate
    this.time = 0
    this.tempoTime = 0
    this.tempoTimeDelta = (tempo * 8192) / 120 / this.sampleRate
    if (floatMode) {
      this.postprocess = t => Math.min(1, Math.max(-1, t))
    } else {
      this.postprocess = t => (t % 256) / 128 - 1
    }
    this.buffer = this.context.createBuffer(
      1,
      this.sampleRate * bufferLength,
      this.sampleRate
    )
    if (floatMode) {
      this.buffer.getChannelData(0).forEach((v, i, p) => {
        p[i] = this.postprocess(this.beatcode(this.time, this.tempoTime))
        this.time += this.timeDelta
        this.tempoTime += this.tempoTimeDelta
      })
    } else {
      let lastT = -1
      let lastTt = -1
      this.buffer.getChannelData(0).forEach((v, i, p) => {
        if (lastT === this.time && lastTT === this.tempoTime) {
          p[i] = p[i - 1]
        } else {
          lastT = this.time | 0
          lastTT = this.tempoTime | 0
          p[i] = this.postprocess(this.beatcode(lastT, lastTT))
        }
        this.time += this.timeDelta
        this.tempoTime += this.tempoTimeDelta
      })
    }
    this.connected = false
    this.source = this.context.createBufferSource()
    this.source.buffer = this.buffer
  }

  start(startTime) {
    if (!this.connected) {
      this.connect()
    }
    this.source.start(startTime)
  }

  stop(stopTime) {
    if (this.source) {
      this.source.stop(stopTime)
      this.source = undefined
    }
  }

  restart(time = 0) {
    this.source = this.context.createBufferSource()
    this.source.buffer = this.buffer
    this.connect()
    this.start(time)
  }

  connect(destination = this.context.destination) {
    this.source.connect(destination)
    this.connected = true
  }
}
