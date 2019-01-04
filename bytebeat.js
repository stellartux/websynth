/**
* BytebeatNode runs in the Main scope
* @param {AudioContext} context
* @param {string} bytebeat The bytebeat function to be played
* @param {number} frequency The fundamental frequency of the note to be played, used by 't'
* @param {number} tempo The tempo that will be translated to counter 'tt'
* @param {boolean} [floatMode=false] Whether the bytebeat function expects an output between 0:255 (default) or -1:1
*/
class BytebeatNode extends AudioWorkletNode {
  constructor (context, bytebeat, frequency, tempo, floatMode = false) {
    super(context, 'bytebeat-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: {
        bytebeat: bytebeat,
        frequency: frequency,
        sampleRate: context.sampleRate,
        tempo: tempo,
        floatMode: floatMode
      }
    })
  }
  forceNum (value) {
    return typeof(value) === 'number' ? value : 0
  }
  start (startTime) {
    this.port.postMessage({
      message: 'start',
      startTime: this.forceNum(startTime)
    })
  }
  stop (stopTime) {
    this.port.postMessage({
      message: 'stop',
      stopTime: this.forceNum(stopTime)
    })
  }
}

class BytebeatNote extends Note {
  constructor (target, noteParams, oscParams, tempo) {
    super(target, noteParams)
    const n = new BytebeatNode(this.context,
      oscParams.bytebeat,
      oscParams.frequency,
      oscParams.tempo,
      oscParams.floatMode)
    n.connect(this.envGain)
    n.start()
    this.oscs.push(n)
  }

  static validateBytebeat (bytebeat) {
    try {
      const userFunc = new Function(
        `t=0,tt=0,sin=Math.sin,cos=Math.cos,PI=Math.PI,ceil=Math.ceil,
        int=floor=Math.floor,tan=Math.tan,E=Math.E,exp=Math.exp,TAU=2*PI`
        , 'return ' + bytebeat)
      return typeof(userFunc(0)) === 'number'
    } catch (e) {
      return false
    }
  }
}
