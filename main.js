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
const panner = new StereoPannerNode(audio)
const masterGain = new GainNode(audio, {gain: 0.5})
const masterLevel = new AnalyserNode(audio)
panner.connect(masterGain)
masterGain.connect(masterLevel)
masterLevel.connect(audio.destination)

const currentlyHeldKeys = {}
const keyboardKeymap = {
  '\\': 59,
  z: 60,
  x: 62,
  c: 64,
  v: 65,
  b: 67,
  n: 69,
  m: 71,
  ',': 72,
  '.': 74,
  '/': 76,
  q: 72,
  w: 74,
  e: 76,
  r: 77,
  t: 79,
  y: 81,
  u: 83,
  i: 84,
  o: 86,
  p: 88,
  '[': 89,
  ']': 91,
  s: 61,
  d: 63,
  g: 66,
  h: 68,
  j: 70,
  l: 73,
  ';': 75,
  2: 73,
  3: 75,
  5: 78,
  6: 80,
  7: 82,
  9: 85,
  0: 87,
  '=': 90
}

function channelMode (_ev) {
  switch (_ev.controller.number) {
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allsoundoff:
      for (const n of playingNotes)
        n.stopNote()
      for (const n of sustainingNotes)
        n.stopNote()
      for (const n of sostenutoNotes)
        n.stopNote()
      playingNotes = {}
      sustainingNotes = {}
      sostenutoNotes = {}
      break
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allnotesoff:
      for (let n of playingNotes)
        n.releaseNote()
      playingNotes = {}
      break
    default:
      break
  }
}

function controlChange (_ev) {
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

function midiToFreq (_num) {
  return 13.75 * Math.pow(2, (_num - 9) / 12)
}
function midiToLetter (_num, sharp=true) {
  const nss = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
    "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11
  },
  nfs = {
    "C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5,
    "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11
  }
  return sharp ? nss[_num % 12] : nfs[_num % 12]
}
function midiToSPN (_num, sharp=true) {
  return midiToLetter(_num, sharp) + Math.floor(_num / 12)
}

function updateEnvelope (_ev) {
  if (_ev)
    envelope[_ev.target.id] = Number(_ev.target.value)
  else
    for (const c of $$('#envelope-controls input'))
      envelope[c.id] = Number(c.value)
}
function updateChord (_notes = Object.keys(playingNotes)) {
  console.log(_notes)
  return _notes.map(midiToLetter).join(' ')
}


function noteOn (_midiNum, _velocity = 1) {
  const panels = $$('.oscillator')
  const oscParams = []
  for (const panel of panels)
    oscParams.push({
      type: panel.querySelector('.waveform').value,
      detune: panel.querySelector('.detune').value,
      frequency: midiToFreq(
        Number(panel.querySelector('.note-offset').value) +
          _midiNum +
          Number($('note-offset').value) +
          (Number(panel.querySelector('.octave').value) +
          Number($('octave').value)) * 12
      ),
      gain:
        panel.querySelector('.gain').value *
        (panel.querySelector('.invert-phase').checked ? -1 : 1)
    })

  let noteParams = Object.assign({}, envelope)
  noteParams.triggerTime = audio.currentTime
  if ($('velocity-sensitive').checked)
    noteParams.velocity = _velocity

  if (pedals.soft) {
    noteParams.velocity *= 0.66
    noteParams.attack *= 1.333
  }
  playingNotes[_midiNum] = new Note(panner, noteParams, oscParams)
  updateChord()
  $(
    ''.concat(WebMidi._notes[_midiNum % 12], Math.floor(_midiNum / 12))
  ).classList.add('keypress')
}

function noteOff (_midiNum) {
  if (pedals.sustain && !sustainingNotes[_midiNum]) {
    sustainingNotes[_midiNum] = playingNotes[_midiNum]
  } else if (playingNotes[_midiNum]) {
    playingNotes[_midiNum].releaseNote()
  }
  delete playingNotes[_midiNum]
  updateChord()

  $(
    ''.concat(WebMidi._notes[_midiNum % 12], Math.floor(_midiNum / 12))
  ).classList.remove('keypress')
}

function sustainPedalEvent (_ev) {
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

function sostenutoPedalEvent (_ev) {
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

function addOscillator () {
  const c = document.importNode($('oscillator-template').content, true)
  const p = $('oscillator-panel')
  c.querySelector('.remove-oscillator').addEventListener('click', e => {
    p.removeChild(e.target.parentElement)
  })
  c.querySelector('.gain').addEventListener('dblclick', e => {
    e.target.value = 0.5
  })
  p.appendChild(c)
}

function setupControllerListeners (channel = 'all') {
  controller.addListener('noteon', channel, e =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener('noteoff', channel, e => noteOff(e.note.number))
  controller.addListener('controlchange', channel, e => controlChange(e))
  controller.addListener('channelmode', channel, e => channelMode(e))
}

/*
  CSS keyboard and mouse-control
*/
function setupDisplayKeyboard (maxkeys = 88, lownote = 21) {
  const removeChildren = el => {
    while (el.firstChild)
      el.removeChild(el.firstChild)
  }
  removeChildren($('ebony'))
  removeChildren($('ivory'))
  const keywidth = (12 / 7) * (95 / maxkeys)
  $('keyboard').style.setProperty('--key-width', `${keywidth}vw`)
  $('keyboard').style.setProperty('--half-key', `${keywidth / 2}vw`)
  const palette = generateColorPalette()
  const makeShadowKey = () => {
    const shadowkey = document.createElement('div')
    shadowkey.classList.add('invisible')
    shadowkey.classList.add('key')
    $('ebony').appendChild(shadowkey)
  }
  makeShadowKey()
  for (let i = lownote; i < lownote + maxkeys; i++) {
    const elem = document.createElement('div')
    elem.classList.add('key')
    elem.id = ''.concat(WebMidi._notes[i % 12], Math.floor(i / 12))
    elem.midiNumber = i
    elem.onmousedown = e => noteOn(e.target.midiNumber)
    elem.onmouseleave = e => noteOff(e.target.midiNumber)
    elem.onmouseup = e => noteOff(e.target.midiNumber)
    elem.style.setProperty('--squish', palette[i % 12])
    if (elem.id.includes('E') || elem.id.includes('B')) {
      makeShadowKey()
    }
    if (elem.id.includes('#')) {
      $('ebony').appendChild(elem)
    } else {
      $('ivory').appendChild(elem)
    }
  }
}

function generateColorPalette (seed = 0) {
  const palette = []
  const j = Math.PI / 6
  const k = (2 * Math.PI) / 6
  for (let i = 0; i < 12; i++) {
    let color = 'rgb('
    let f = (i + seed) * j
    color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
    color += ', '
    f += 4 * j
    color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
    color += ', '
    f += 4 * j
    color += (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
    color += ')'
    palette.push(color)
  }
  return palette
}

function setupKeypressKeymap () {
  document.addEventListener('keydown', function (e) {
    if (Object.keys(keyboardKeymap).includes(e.key)) {
      if (!Object.values(currentlyHeldKeys).includes(keyboardKeymap[e.key])) {
        currentlyHeldKeys[e.key] = keyboardKeymap[e.key]
        noteOn(keyboardKeymap[e.key])
      }
    }
  })
  document.addEventListener('keyup', function (e) {
    if (Object.keys(currentlyHeldKeys).includes(e.key)) {
      delete currentlyHeldKeys[e.key]
      noteOff(keyboardKeymap[e.key])
    }
  })
}

function setupGlobalEventListeners () {
  $('master-gain').addEventListener('change', e => {
    masterGain.gain.value = e.target.value
  })
  $('master-gain').addEventListener('dblclick', e => {
    masterGain.gain.value = 0.5
    e.target.value = 0.5
  })
  $('show-master-level').addEventListener('change', e => {
    if (e.target.checked) {
      $('master-level').classList.remove('hidden')
    } else {
      $('master-level').classList.add('hidden')
    }
  })
  $('panning').addEventListener('change', e => {
    panner.pan.value = e.target.value
  })
  $('panning').addEventListener('dblclick', e => {
    panner.pan.value = 0
    e.target.value = 0
  })
}

window.onload = () => {
  setupGlobalEventListeners()

  addOscillator()
  $('add-oscillator').addEventListener('click', addOscillator)

  setupKeypressKeymap()
  setupDisplayKeyboard()

  WebMidi.enable(err => {
    if (err) {
      console.log('WebMidi could not be enabled.', err)
      setupDisplayKeyboard()
    } else {
      console.log('WebMidi enabled!')
      updateEnvelope()
      for (const obj of $$('#envelope-controls input')) {
        obj.addEventListener('change', updateEnvelope)
      }

      const cf = $('controller-form')
      const cs = $('controller-select')
      const chs = $('channel-select')

      cf.addEventListener('submit', e => {
        e.preventDefault()
        controller = WebMidi.getInputByName(cs.options[cs.selectedIndex].value)
        setupControllerListeners(chs.options[chs.selectedIndex].value)
        cf.classList.add('hidden')
        setupDisplayKeyboard()
      })

      if (WebMidi.inputs.length === 0) {
        setupDisplayKeyboard()
      } else {
        cf.classList.remove('hidden')
        let elem
        for (const input of WebMidi.inputs) {
          elem = document.createElement('option')
          elem.text = input.name
          cs.add(elem)
        }

        elem = document.createElement('option')
        elem.text = 'all'
        chs.add(elem)
        for (let i = 1; i < 17; i++) {
          elem = document.createElement('option')
          elem.text = i
          chs.add(elem)
        }
      }
    }
  })
}
