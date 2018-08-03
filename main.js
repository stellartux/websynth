class Note {
  constructor(params = []) {
    this.oscs = []
    for (let p of params) {
      let gainer = audio.createGain()
      let osc = audio.createOscillator()
      gainer.gain.value = p.gain
      osc.type = p.type
      osc.detune.value = p.detune
      osc.frequency.value = p.frequency
      osc.connect(gainer)
      gainer.connect(masterGain)
      osc.start()
      this.oscs.push(osc)
    }
  }
  start() {
    for (let o of this.oscs) {
      o.start()
    }
  }
  stop() {
    for (let o of this.oscs) {
      o.stop()
    }
  }
}

let controller
const audio = new (window.AudioContext || window.webkitAudioContext)()
const playingNotes = {}
const masterGain = audio.createGain()
masterGain.gain.value = 0.5
masterGain.connect(audio.destination)

function midiToFreq(num) {
  return 13.75 * Math.pow(2, (num - 9) / 12)
}

function noteOn(e) {
  let panels = document.getElementsByClassName("oscillator-panel")
  const params = []
  for (let panel of panels) {
    params.push({
      type: panel.getElementsByClassName("waveform")[0].value,
      detune: panel.getElementsByClassName("detune")[0].value,
      frequency: midiToFreq(
        e.note.number + panel.getElementsByClassName("octave")[0].value * 12
      ),
      gain: panel.getElementsByClassName("gain")[0].value
    })
  }
  playingNotes[e.note.number] = new Note(params)
}

function noteOff(e) {
  playingNotes[e.note.number].stop()
  delete playingNotes[e.note.number]
}

window.onload = () => {
  WebMidi.enable(err => {
    if (err) {
      console.log("WebMidi could not be enabled.", err)
    } else {
      console.log("WebMidi enabled!")

      let cs = document.getElementById("controller-select")
      let form = document.getElementById("controller-form")

      for (let input of WebMidi.inputs) {
        let elem = document.createElement("option")
        elem.text = input.name
        cs.add(elem)
      }

      form.addEventListener("submit", e => {
        e.preventDefault()
        controller = WebMidi.getInputByName(cs.options[cs.selectedIndex].value)
        controller.addListener("noteon", "all", noteOn)
        controller.addListener("noteoff", "all", noteOff)
        form.classList.add("hidden")
      })

      document.getElementById("masterGain").addEventListener("change", () => {
        masterGain.gain.value = document.getElementById("masterGain").value
        console.log(masterGain.gain.value)
      })
    }
  })
}
