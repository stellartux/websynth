let controller
const audio = new (window.AudioContext || window.webkitAudioContext)()
const playingNotes = {}
const envelope = {}
const masterGain = audio.createGain()
masterGain.gain.value = 0.5
masterGain.connect(audio.destination)

function midiToFreq(_num) {
  return 13.75 * Math.pow(2, (_num - 9) / 12)
}

function updateEnvelope() {
  let domObj = document.getElementById("envelope-controls")
  envelope.attack = Number(domObj.querySelector("input.attack").value)
  envelope.decay = Number(domObj.querySelector("input.decay").value)
  envelope.sustain = Number(domObj.querySelector("input.sustain").value)
  envelope.release = Number(domObj.querySelector("input.release").value)
}

function noteOn(_midiNum, _velocity = 1) {
  let panels = document.getElementsByClassName("oscillator")
  const oscParams = []
  for (let panel of panels) {
    oscParams.push({
      type: panel.getElementsByClassName("waveform")[0].value,
      detune: panel.getElementsByClassName("detune")[0].value,
      frequency: midiToFreq(
        Number(panel.getElementsByClassName("note-offset")[0].value) +
          _midiNum +
          panel.getElementsByClassName("octave")[0].value * 12
      ),
      gain: panel.getElementsByClassName("gain")[0].value
    })
  }
  let env = envelope
  env.triggerTime = audio.currentTime
  if (document.getElementById("velocity-sensitive").checked) {
    env.velocity = _velocity
  }
  playingNotes[_midiNum] = new Note(masterGain, oscParams, env)
}

function noteOff(_midiNum) {
  playingNotes[_midiNum].releaseNote()
  delete playingNotes[_midiNum]
}

function addOscillator() {
  let clone = document.importNode(
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

function setupControllerListeners() {
  controller.addListener("noteon", "all", e =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener("noteoff", "all", e => noteOff(e.note.number))
}

window.onload = () => {
  WebMidi.enable(err => {
    if (err) {
      console.log("WebMidi could not be enabled.", err)
    } else {
      console.log("WebMidi enabled!")

      let cs = document.getElementById("controller-select")

      updateEnvelope()
      for (let obj of document.querySelectorAll("#envelope-controls input")) {
        obj.addEventListener("change", updateEnvelope)
      }

      let cf = document.getElementById("controller-form")

      cf.addEventListener("submit", e => {
          e.preventDefault()
          controller = WebMidi.getInputByName(
            cs.options[cs.selectedIndex].value
          )
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
        for (let input of WebMidi.inputs) {
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
