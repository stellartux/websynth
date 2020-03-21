function forceNum(value) {
  return typeof value === 'number' ? value : 0
}

/**
 * BytebeatNode runs in the main scope. Error checking is performed in the main
 * scope before attempting to instantiate the function in the AudioWorkletScope
 * @param {AudioContext} context
 * @param {string} bytebeat The bytebeat function to be played
 * @param {number} [frequency=8000] The fundamental frequency of the note to be played, used by 't'
 * @param {number} [tempo=120] The tempo that will be translated to counter 'tt'
 * @param {boolean} [floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
 */
export class BytebeatNode extends AudioWorkletNode {
  constructor(
    context,
    bytebeat,
    frequency = 8000,
    tempo = 120,
    floatMode = false
  ) {
    super(context, 'bytebeat-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: {
        beatcode: bytebeat,
        frequency: frequency,
        sampleRate: context.sampleRate,
        tempo: tempo,
        floatMode: floatMode,
      },
    })
  }

  start(startTime) {
    this.port.postMessage({
      message: 'start',
      startTime: forceNum(startTime),
    })
  }

  stop(stopTime) {
    this.port.postMessage({
      message: 'stop',
      stopTime: forceNum(stopTime),
    })
  }
}
