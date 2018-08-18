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

function updateEnvelope(e) {
  if (e) {
    envelope[e.target.className] = Number(e.target.value)
  } else {
    for (const c of $$("#envelope-controls input")) {
      envelope[c.className] = Number(c.value)
    }
  }
}

function noteOn(_midiNum, _velocity = 1) {
  const panels = $$(".oscillator")
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

  $(
    "".concat(WebMidi._notes[_midiNum % 12], Math.floor(_midiNum / 12))
  ).classList.add("keypress")
}

function noteOff(_midiNum) {
  if (pedals.sustain && !sustainingNotes[_midiNum]) {
    sustainingNotes[_midiNum] = playingNotes[_midiNum]
  } else if (playingNotes[_midiNum]) {
    playingNotes[_midiNum].releaseNote()
  }

  $(
    "".concat(WebMidi._notes[_midiNum % 12], Math.floor(_midiNum / 12))
  ).classList.remove("keypress")
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
  const c = document.importNode($("oscillator-template").content, true)
  const p = $("oscillator-panel")
  c.querySelector(".remove-oscillator").addEventListener("click", e => {
    p.removeChild(e.target.parentElement)
  })
  c.querySelector(".gain").addEventListener("dblclick", e => {
    e.target.value = 0.5
  })
  p.appendChild(c)
}

function setupControllerListeners(channel = "all") {
  controller.addListener("noteon", channel, e =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener("noteoff", channel, e => noteOff(e.note.number))
  controller.addListener("controlchange", channel, e => controlChange(e))
  controller.addListener("channelmode", channel, e => channelMode(e))
}

/*
  CSS keyboard and mouse-control
*/
function setupDisplayKeyboard() {
  const palette = generateColorPalette()
  const makeShadowKey = () => {
    const shadowkey = document.createElement("div")
    shadowkey.classList.add("invisible")
    shadowkey.classList.add("key")
    $("ebony").appendChild(shadowkey)
  }
  makeShadowKey()
  for (let i = 9; i < 99; i++) {
    const elem = document.createElement("div")
    elem.classList.add("key")
    elem.id = "".concat(WebMidi._notes[i % 12], Math.floor(i / 12))
    elem.midiNumber = i
    elem.onmousedown = e => noteOn(e.target.midiNumber)
    elem.onmouseleave = e => noteOff(e.target.midiNumber)
    elem.onmouseup = e => noteOff(e.target.midiNumber)
    elem.style.setProperty("--squish", palette[i%12])
    if (elem.id.includes("E") || elem.id.includes("B")) {
      makeShadowKey()
    }
    if (elem.id.includes("#")) {
      $("ebony").appendChild(elem)
    } else {
      $("ivory").appendChild(elem)
    }
  }
}

function generateColorPalette(seed = 0) {
  const palette = []
  const j = Math.PI / 6
  const k = 2 * Math.PI / 6
  for (let i = 0; i < 12; i++) {
      let color = "rgb("
      let f = (i + seed) * j
      color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
      color += ", "
      f += 4 * j
      color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
      color += ", "
      f += 4 * j
      color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
      color += ")"
      palette.push(color)
  }
  return palette
}



window.onload = () => {
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
  $("add-oscillator").addEventListener("click", addOscillator)

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
        cf.classList.add("hidden")
        setupDisplayKeyboard()
      })

      if (WebMidi.inputs.length === 0) {
        cf.classList.add("hidden")
        setupDisplayKeyboard()
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
    }
  })
}
