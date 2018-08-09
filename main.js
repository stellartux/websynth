let controller
const audio = new (window.AudioContext || window.webkitAudioContext)()
let playingNotes = {}
let sustainingNotes = {}
let sustenatoNotes = {}
const pedals = {
  sustain: false,
  sustenato: false,
  soft: false
}
const envelope = {}
const masterGain = audio.createGain()
masterGain.gain.value = 0.5
masterGain.connect(audio.destination)

function midiToFreq(_num) {
  return 13.75 * Math.pow(2, (_num - 9) / 12)
}

function updateEnvelope() {
  const domObj = document.getElementById("envelope-controls")
  envelope.attack = Number(domObj.querySelector("input.attack").value)
  envelope.decay = Number(domObj.querySelector("input.decay").value)
  envelope.sustain = Number(domObj.querySelector("input.sustain").value)
  envelope.release = Number(domObj.querySelector("input.release").value)
}

function noteOn(_midiNum, _velocity = 1) {
  const panels = document.getElementsByClassName("oscillator")
  const oscParams = []
  for (const panel of panels) {
    oscParams.push({
      type: panel.querySelector(".waveform").value,
      detune: panel.querySelector(".detune").value,
      frequency: midiToFreq(
        Number(panel.querySelector(".note-offset").value) +
          _midiNum +
          panel.querySelector(".octave").value * 12
      ),
      gain: panel.querySelector(".gain").value
    })
  }
  let env = Object.assign({}, envelope)
  env.triggerTime = audio.currentTime
  if (document.getElementById("velocity-sensitive").checked) {
    env.velocity = _velocity
  }
  if (pedals.soft) {
    env.velocity *= 0.66
    env.attack *= 1.333
  }
  playingNotes[_midiNum] = new Note(masterGain, oscParams, env)
}

function noteOff(_midiNum) {
  if (pedals.sustain) {
    sustainingNotes[_midiNum] = playingNotes[_midiNum]
  } else {
    if (playingNotes[_midiNum]) {
      playingNotes[_midiNum].releaseNote()
    }
  }
  delete playingNotes[_midiNum]
}

function controlChange(_ev) {
  switch (_ev.controller.number) {
    case 64:
      sustainPedalEvent(_ev)
      break
    case 66:
      sustenatoPedalEvent(_ev)
      break
    case 1:
    case 67:
      softPedalEvent(_ev)
      break
    default:
      console.log(_ev)
      break
  }
}

function sustainPedalEvent(_ev) {
  if (pedals.sustain && _ev.value < 64) {
    pedals.sustain = false
    for (let n in sustainingNotes) {
      sustainingNotes[n].releaseNote()
      delete sustainingNotes[n]
    }
  } else if (!pedals.sustain && _ev.value > 63) {
    pedals.sustain = true
  }
}

function sustenatoPedalEvent(_ev) {
  if (pedals.sustenato && _ev.value < 64) {
    pedals.sustenato = false
    for (let n in sustenatoNotes) {
      sustenatoNotes[n].releaseNote()
      delete sustenatoNotes[n]
    }
  } else if (!pedals.sustenato && _ev.value > 63) {
    pedals.sustenato = true
    sustenatoNotes = playingNotes
    playingNotes = {}
  }
}

function softPedalEvent(_ev) {
  if (_ev.value < 64) {
    pedals.soft = false
  } else {
    pedals.soft = true
  }
}

function addOscillator() {
  const clone = document.importNode(
    document.getElementById("oscillator-template").content,
    true
  )
  clone.querySelector(".removeOscillator").addEventListener("click", e => {
    removeOscillator(e.target.parentElement)
  })
  document.getElementById("oscillator-panel").appendChild(clone)
}

function removeOscillator(_elem) {
  document.getElementById("oscillator-panel").removeChild(_elem)
}

function setupControllerListeners(channel = "all") {
  controller.addListener("noteon", channel, e =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener("noteoff", channel, e => noteOff(e.note.number))
  controller.addListener("controlchange", channel, e => controlChange(e))
}

window.onload = () => {
  WebMidi.enable(err => {
    if (err) {
      console.log("WebMidi could not be enabled.", err)
    } else {
      console.log("WebMidi enabled!")

      updateEnvelope()
      for (let obj of document.querySelectorAll("#envelope-controls input")) {
        obj.addEventListener("change", updateEnvelope)
      }

      const cf = document.getElementById("controller-form")
      const cs = document.getElementById("controller-select")
      const chs = document.getElementById("channel-select")

      cf.addEventListener("submit", e => {
        e.preventDefault()
        controller = WebMidi.getInputByName(cs.options[cs.selectedIndex].value)
        setupControllerListeners(chs.options[chs.selectedIndex].value)
        e.target.classList.add("hidden")
      })

      if (WebMidi.inputs.length === 0) {
        cf.innerHTML = "<p>No MIDI devices detected.</p>"
      } else {
        let elem
        for (const input of WebMidi.inputs) {
          elem = document.createElement("option")
          elem.text = input.name
          cs.add(elem)
        }

        elem = document.createElement("option")
        elem.text = "all"
        chs.add(elem)
        for (let i = 1; i < 17; i++) {
          elem = document.createElement("option")
          elem.text = i
          chs.add(elem)
        }
      }

      document.getElementById("masterGain").addEventListener("change", e => {
        masterGain.gain.value = e.target.value
      })

      addOscillator()
      document
        .getElementById("addOscillator")
        .addEventListener("click", addOscillator)
    }
  })
}
