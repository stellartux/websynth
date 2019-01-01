/**
* BytebeatNode runs in the Main scope
* @param {AudioContext} context
* @param {string} bytebeat The bytebeat function to be played
* @param {number} frequency The fundamental frequency of the note to be played
*/
class BytebeatNode extends AudioWorkletNode {
  constructor (context, bytebeat, frequency, tempo) {
    super(context, 'bytebeat-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: {
        bytebeat: bytebeat,
        frequency: frequency,
        sampleRate: context.sampleRate,
        tempo: tempo
      }
    })
    this.stop = p => this.port.postMessage({ message: 'stop', stopTime: p })
    this.start = p => this.port.postMessage({ message: 'start', params: p })
  }
}

class BytebeatNote extends Note {
  constructor (target, noteParams, oscParams, tempo) {
    super(target, noteParams)
    const n = new BytebeatNode(this.context,
      oscParams.bytebeat, oscParams.frequency, oscParams.tempo)
    n.connect(this.envGain)
    n.start()
    this.oscs.push(n)
  }
}
