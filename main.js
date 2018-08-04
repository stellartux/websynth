class Note {
  constructor(_params = [], _env) {
    this.envelope = _env
    this.envGain = audio.createGain()
    this.envGain.gain.setValueAtTime(0, audio.currentTime)
    this.envGain.gain.linearRampToValueAtTime(
      this.envelope.velocity,
      this.envelope.triggerTime + this.envelope.attack
    )
    this.envGain.gain.setTargetAtTime(
      this.envelope.sustain * this.envelope.velocity,
      this.envelope.triggerTime + this.envelope.attack,
      this.envelope.decay
    )
    this.envGain.connect(masterGain)
    this.oscs = []
    for (let p of _params) {
      let gainer = new GainNode(audio)
      let osc = audio.createOscillator()
      gainer.gain.value = p.gain
      osc.type = p.type
      osc.detune.value = p.detune
      osc.frequency.value = p.frequency
      osc.connect(gainer)
      gainer.connect(this.envGain)
      osc.start()
      this.oscs.push(osc)
    }
  }
  release() {
    for (let o of this.oscs) {
      o.stop(audio.currentTime + this.envelope.release * 20)
    }
    if (
      audio.currentTime >
      this.envelope.triggerTime + this.envelope.attack + this.envelope.decay
    ) {
      this.envGain.gain.setTargetAtTime(
        0,
        audio.currentTime,
        this.envelope.release
      )
    } else {
      this.envGain.gain.setTargetAtTime(
        0,
        this.envelope.triggerTime + this.envelope.attack + this.envelope.decay,
        this.envelope.release
      )
    }
  }
}

let controller
const audio = new (window.AudioContext || window.webkitAudioContext)()
const playingNotes = {}
const envelope = {}
const masterGain = audio.createGain()
masterGain.gain.value = 0.5
masterGain.connect(audio.destination)

function midiToFreq(num) {
  return 13.75 * Math.pow(2, (num - 9) / 12)
}

function updateEnvelope() {
  let domObj = document.getElementById("envelope-controls")
  envelope.attack = Number(domObj.querySelector("input.attack").value)
  envelope.decay = Number(domObj.querySelector("input.decay").value)
  envelope.sustain = Number(domObj.querySelector("input.sustain").value)
  envelope.release = Number(domObj.querySelector("input.release").value)
}

function noteOn(midiNum, velocity = 1) {
  let panels = document.getElementsByClassName("oscillator")
  const oscParams = []
  for (let panel of panels) {
    oscParams.push({
      type: panel.getElementsByClassName("waveform")[0].value,
      detune: panel.getElementsByClassName("detune")[0].value,
      frequency: midiToFreq(
        Number(panel.getElementsByClassName("note-offset")[0].value) +
          midiNum +
          panel.getElementsByClassName("octave")[0].value * 12
      ),
      gain: panel.getElementsByClassName("gain")[0].value
    })
  }
  let env = envelope
  env.triggerTime = audio.currentTime
  if (document.getElementById("velocity-sensitive").checked) {
    env.velocity = velocity
  } else {
    env.velocity = 1
  }
  playingNotes[midiNum] = new Note(oscParams, env)
}

function noteOff(midiNum) {
  playingNotes[midiNum].release()
  delete playingNotes[midiNum]
}

function addOscillator() {
  let clone = document.importNode(
    document.getElementById("oscillator-template").content,
    true
  )
  clone.querySelector(".removeOscillator").addEventListener("click", e => {
    console.log(e.target.parentElement)
  })
  document.getElementById("oscillator-panel").appendChild(clone)
}

window.onload = () => {
  WebMidi.enable(err => {
    if (err) {
      console.log("WebMidi could not be enabled.", err)
    } else {
      console.log("WebMidi enabled!")

      let cs = document.getElementById("controller-select")

      for (let input of WebMidi.inputs) {
        let elem = document.createElement("option")
        elem.text = input.name
        cs.add(elem)
      }

      updateEnvelope()
      for (let obj of document.querySelectorAll("#envelope-controls input")) {
        obj.addEventListener("change", updateEnvelope)
      }

      document
        .getElementById("controller-form")
        .addEventListener("submit", e => {
          e.preventDefault()
          controller = WebMidi.getInputByName(
            cs.options[cs.selectedIndex].value
          )
          controller.addListener("noteon", "all", e => {
            noteOn(e.note.number, e.velocity)
          })
          controller.addListener("noteoff", "all", e => noteOff(e.note.number))
          e.target.classList.add("hidden")
        })

      document.getElementById("masterGain").addEventListener("change", () => {
        masterGain.gain.value = document.getElementById("masterGain").value
      })

      addOscillator()
      document
        .getElementById("addOscillator")
        .addEventListener("click", addOscillator)
    }
  })
}
