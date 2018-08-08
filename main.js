let controller
const audio = new (window.AudioContext || window.webkitAudioContext)()
const playingNotes = {}
const sustainingNotes = {}
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
  const env = envelope
  env.triggerTime = audio.currentTime
  if (document.getElementById("velocity-sensitive").checked) {
    env.velocity = _velocity
  }
  playingNotes[_midiNum] = new Note(masterGain, oscParams, env)
}

function noteOff(_midiNum) {
  if (pedals.sustain) {
    sustainingNotes[_midiNum] = playingNotes[_midiNum]
  } else {
    playingNotes[_midiNum].releaseNote()
  }
  delete playingNotes[_midiNum]
}

function controlChange(_ev) {
  switch (_ev.controller.number) {
    case 1:
    case 64:
      sustainPedalEvent(_ev)
      break
    default:
      console.log(_ev)
      break
  }
}

function sustainPedalEvent(_ev) {
  if (pedals.sustain && (_ev.value < 64)) {
    pedals.sustain = false
    sustainPedalRelease()
  } else if (!pedals.sustain && (_ev.value > 63)) {
    pedals.sustain = true
  }
}

function sustainPedalRelease() {
  for (let n in sustainingNotes) {
    sustainingNotes[n].releaseNote()
    delete sustainingNotes[n]
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

      const cs = document.getElementById("controller-select")

      updateEnvelope()
      for (let obj of document.querySelectorAll("#envelope-controls input")) {
        obj.addEventListener("change", updateEnvelope)
      }

      const cf = document.getElementById("controller-form")

      cf.addEventListener("submit", e => {
        e.preventDefault()
        controller = WebMidi.getInputByName(cs.options[cs.selectedIndex].value)
        setupControllerListeners()
        e.target.classList.add("hidden")
      })

      if (WebMidi.inputs.length === 0) {
        cf.innerHTML = "<p>No MIDI devices detected.</p>"
      } else if (WebMidi.inputs.length === 1) {
        controller = WebMidi.inputs[0]
        setupControllerListeners()
        document.getElementById("controller-form").classList.add("hidden")
      } else {
        for (const input of WebMidi.inputs) {
          let elem = document.createElement("option")
          elem.text = input.name
          cs.add(elem)
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
