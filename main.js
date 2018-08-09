let controller
const $ = x => document.getElementById(x)
const $$ = x => Array.from(document.querySelectorAll(x))
const audio = new (window.AudioContext || window.webkitAudioContext)()
let playingNotes = {}
let sustainingNotes = {}
let sostenutoNotes = {}
let pitchBend = 0
const pedals = {
  sustain: false,
  sostenuto: false,
  soft: false
}
const envelope = {}
const panner = audio.createStereoPanner()
const masterGain = audio.createGain()
panner.pan.value = 0
masterGain.gain.value = 0.5
panner.connect(masterGain)
masterGain.connect(audio.destination)

function channelMode(_ev) {
  switch (_ev.controller.number) {
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allsoundoff:
      for (let n of playingNotes) {
        n.stopNote()
      }
      for (let n of sustainingNotes) {
        n.stopNote()
      }
      for (let n of sostenutoNotes) {
        n.stopNote()
      }
      playingNotes = {}
      sustainingNotes = {}
      sostenutoNotes = {}
      break
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allnotesoff:
      for (let n of playingNotes) {
        n.releaseNote()
      }
      playingNotes = {}
      break
    default:
      break
  }
}

function controlChange(_ev) {
  switch (_ev.controller.number) {
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.holdpedal:
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.hold2pedal:
      sustainPedalEvent(_ev)
      break
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.modulationwheelcoarse:
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.sustenutopedal:
      sostenutoPedalEvent(_ev)
      break
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.softpedal:
      if (_ev.value < 64) {
        pedals.soft = false
      } else {
        pedals.soft = true
      }
      break
    default:
      console.log(_ev)
      break
  }
}

function midiToFreq(_num) {
  return 13.75 * Math.pow(2, (_num - 9) / 12)
}

function updateEnvelope() {
  const domObj = $("envelope-controls")
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
      gain:
        panel.querySelector(".gain").value *
        (panel.querySelector(".invert-phase").checked ? -1 : 1)
    })
  }
  let noteParams = Object.assign({}, envelope)
  noteParams.triggerTime = audio.currentTime
  if ($("velocity-sensitive").checked) {
    noteParams.velocity = _velocity
  }
  if (pedals.soft) {
    noteParams.velocity *= 0.66
    noteParams.attack *= 1.333
  }
  playingNotes[_midiNum] = new Note(panner, noteParams, oscParams)
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

function sostenutoPedalEvent(_ev) {
  if (pedals.sostenuto && _ev.value < 64) {
    pedals.sostenuto = false
    for (let n in sostenutoNotes) {
      sostenutoNotes[n].releaseNote()
      delete sostenutoNotes[n]
    }
  } else if (!pedals.sostenuto && _ev.value > 63) {
    pedals.sostenuto = true
    sostenutoNotes = playingNotes
    playingNotes = {}
  }
}

function addOscillator() {
  const clone = document.importNode(
    $("oscillator-template").content,
    true
  )
  clone.querySelector(".removeOscillator").addEventListener("click", e => {
    removeOscillator(e.target.parentElement)
  })
  $("oscillator-panel").appendChild(clone)
}

function removeOscillator(_elem) {
  $("oscillator-panel").removeChild(_elem)
}

function setupControllerListeners(channel = "all") {
  controller.addListener("noteon", channel, e =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener("noteoff", channel, e => noteOff(e.note.number))
  controller.addListener("controlchange", channel, e => controlChange(e))
  controller.addListener("channelmode", channel, e => channelMode(e))
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

      const cf = $("controller-form")
      const cs = $("controller-select")
      const chs = $("channel-select")

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

      $("masterGain").addEventListener("change", e => {
        masterGain.gain.value = e.target.value
      })
      $("masterGain").addEventListener("dblclick", e => {
        masterGain.gain.value = 0.5
        e.target.value = 0.5
      })
      $("panning").addEventListener("change", e => {
          panner.pan.value = e.target.value
        })
      $("panning").addEventListener("dblclick", e => {
          panner.pan.value = 0
          e.target.value = 0
        })

      addOscillator()
      $("addOscillator").addEventListener("click", addOscillator)
    }
  })
}
