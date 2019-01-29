/** Type for storing envelope and oscillator preset information for recalling
* user defined presets and UI persistence between sessions.
* @param {string} name
* @param {object} envelope
* @param {number} [envelope.attack=0.2]
* @param {number} [envelope.decay=0.2]
* @param {number} [envelope.sustain=0.4]
* @param {number} [envelope.release=0.1]
* @param {object[]} oscillators
* @param {string} [oscillators.waveform='sine']
* Options are 'sine', 'square', 'triangle', 'sawtooth', 'custom'
* @param {number} [oscillators.gain=0.5]
* @param {number} [oscillators.detune=0]
* @param {number} [oscillators.note-offset=0]
* @param {number} [oscillators.octave=0]
* @param {boolean} [oscillators.invert-phase=false]
* @param {string} [oscillators.bytebeatCode='']
* @param {string} type='additive-oscillators'
* Options are 'additive-oscillators', 'bytebeat', 'harmonic-series'
*/
class Preset {
  constructor (name, envelope, oscillators, type = 'additive-oscillators') {
    if (!(envelope && oscillators)) {
      throw 'Preset: Constructor is missing necessary initialization parameters'
    }
    this.name = name
    this.envelope = envelope
    this.oscillators = oscillators
    this.type = type
  }
}

/** Marshall the UI information
* @return {Preset}
*/
function getPresetInfo () {
  const type = $('source-select').value
  let oscs = []
  if (type === 'harmonic-series') {
    // TODO
  } else if (type === 'bytebeat') {
    oscs.push({
      bytebeatCode: $('bytebeat-code').value,
      bytebeatMode: $('bytebeat-mode').value
    })
  } else {
    for (const osc of $$('.oscillator')) {
      let o = {}
      o.waveform = osc.querySelector('.waveform').value
      for (const param of osc.querySelectorAll('input')) {
        o[param.className] = param.value
      }
      o['invert-phase'] = osc.querySelector('.invert-phase').checked
      oscs.push(o)
    }
  }
  return new Preset($('preset-name').value, Object.assign({}, envelope), oscs, type)
}

/** Adds a new oscillator panel to the UI window
* @param {Preset} [preset]
*/
function addOscillator (preset) {
  const c = document.importNode($('oscillator-template').content, true),
    p = $('oscillator-panel')
  c.querySelector('.remove-oscillator')
    .addEventListener('click', e => p.removeChild(e.target.parentElement))
  c.querySelector('.gain')
    .addEventListener('dblclick', e => e.target.value = 0.5)
  if (preset) {
    for (const pp in preset) {
      if (pp === 'invert-phase') c.querySelector('.invert-phase').checked = true
      else c.querySelector('.' + pp).value = preset[pp]
    }
  }
  p.appendChild(c)
}

/** Saves a preset to the custom presets list.
* @param {Preset} preset The preset to be saved
* @throws Unnamed presets can't be saved
*/
function addPreset (preset) {
  if (!$('preset-name').value) throw "Unnamed preset can't be saved"
  customPresets.push(getPresetInfo())
  updateCustomPresets(customPresets, $('custom-presets'))
}

/** Remove the currently selected preset */
function removePreset () {
  const selected = $('preset-list').selectedOptions[0]
  if (selected.parentElement.label === 'Custom Presets') {
    customPresets.splice(selected.value, 1)
    updateCustomPresets(customPresets, $('custom-presets'))
  }
}

/** Load the settings of a preset to the page
* @param {Preset} preset The preset to load
*/
function loadPreset (preset) {
  changeCurrentView(preset.type || 'additive-oscillators')
  switch (preset.type) {
    case 'bytebeat':
      $('bytebeat-code').value = preset.oscillators[0].bytebeatCode
      $('bytebeat-mode').value = preset.oscillators[0].bytebeatMode
      break
    default:
      removeChildren($('oscillator-panel'))
      for (const osc of preset.oscillators) addOscillator(osc)
  }
  updateEnvelopeControls(preset.envelope)
}

let controller,
  playingNotes = {},
  sustainingNotes = {},
  sostenutoNotes = {},
  currentlyHeldKeys = {},
  envelope = {},
  pitchBend = 0,
  customPresets = []
const $ = x => document.getElementById(x),
  $$ = x => Array.from(document.querySelectorAll(x)),
  removeChildren = el => { while (el.firstChild) el.removeChild(el.firstChild) },
  audio = new (window.AudioContext || window.webkitAudioContext)(),
  pedals = { sustain: false, sostenuto: false, soft: false },
  panner = new StereoPannerNode(audio),
  masterGain = new GainNode(audio, {gain: 0.5}),
  masterLevel = new AnalyserNode(audio),
  metronome = new Metronome(masterGain),
  keyboardKeymap = {
    '\\': 59, z: 60, x: 62, c: 64, v: 65, b: 67, n: 69, m: 71, ',': 72, '.': 74,
    '/': 76, q: 72, w: 74, e: 76, r: 77, t: 79, y: 81, u: 83, i: 84, o: 86,
    p: 88, '[': 89, ']': 91, s: 61, d: 63, g: 66, h: 68, j: 70, l: 73, ';': 75,
    2: 73, 3: 75, 5: 78, 6: 80, 7: 82, 9: 85, 0: 87, '=': 90
  },
  factoryPresets = [
    new Preset(
      'Sinewave',
      { 'attack': 0.2, 'decay': 0.2, 'sustain': 0.4, 'release': 0.3 },
      [{ 'gain': 0.7 }]
    ),
    new Preset(
      'Bowed Glass',
      { 'attack': 0.62, 'decay': 0.15, 'sustain': 0.42, 'release': 0.32 },
      [
        { 'detune': -5 },
        { 'detune': 5, 'invert-phase': true },
        { 'waveform': 'triangle', 'octave': 1, 'gain': 0.2 }
      ]
    ),
    new Preset(
      'Church Organ',
      { 'attack': 0.28, 'decay': 0.35, 'sustain': 0.29, 'release': 0.18 },
      [
        { 'octave': -1, 'gain': 0.35 },
        { 'detune': 2, 'note-offset': 7, 'gain': 0.25 },
        { 'gain': 0.2 },
        { 'octave': 1, 'gain': 0.2 },
        { 'detune': 2, 'note-offset': 7, 'octave': 1, 'gain': 0.2 },
        { 'octave': 2, 'gain': 0.15 },
        { 'detune': -14, 'note-offset': 4, 'octave': 2, 'gain': 0.15 },
        { 'detune': 2, 'note-offset': 7, 'octave': 2, 'gain': 0.15 },
        { 'octave': 3, 'gain': 0.12 }
      ]
    ),
    new Preset(
      'Sierpinski Harmony',
      {attack: 0, decay: 0.15, sustain: 0.75, release: 0.04},
      [
        {
          bytebeatCode: 't & t >> 8',
          bytebeatMode: 'byte'
        }
      ],
      'bytebeat'
    ),
    new Preset(
      'Synced Sierpinski',
      {attack: 0, decay: 0.15, sustain: 0.75, release: 0.04},
      [
        {
          bytebeatCode: 't & tt >> 8',
          bytebeatMode: 'byte'
        }
      ],
      'bytebeat'
    ),
    new Preset(
      'Headachegoldfish',
      {attack: 0, decay: 0.15, sustain: 0.75, release: 0.04},
      [
        {
          bytebeatCode: 'int("HEADACHEGOLDFISH",(tt>>10)%16)*(t&~7&0x1e70>>((tt>>15)%8))',
          bytebeatMode: 'byte'
        }
      ],
      'bytebeat'
    )
  ]

/** Release all currently playing notes */
function releaseAllNotes () {
  for (const n of playingNotes) {
    n.releaseNote()
  }
  playingNotes = {}
  updateChordDisplay()
}

/** Stop all sound immediately */
function stopAllSound () {
  for (const ns of [playingNotes, sustainingNotes, sostenutoNotes]) {
    for (const n of ns) {
      n.stopNote()
    }
  }
  playingNotes = {}
  sustainingNotes = {}
  sostenutoNotes = {}
  updateChordDisplay()
}

function channelMode (_ev) {
  switch (_ev.controller.number) {
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allsoundoff:
      stopAllSound()
      break
    case WebMidi.MIDI_CHANNEL_MODE_MESSAGES.allnotesoff:
      releaseAllNotes()
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
      pedals.soft = _ev.value > 63
      break
    default:
      console.log(_ev)
      break
  }
}

/** Sync the envelope object to the UI */
function updateEnvelope (_ev) {
  if (_ev) {
    envelope[_ev.target.id] = Number(_ev.target.value)
  } else {
    for (const c of $$('#envelope-controls input')) {
      envelope[c.id] = Number(c.value)
    }
  }
}

/** Sync the UI to a modified envelope object */
function updateEnvelopeControls (newEnv) {
  if (newEnv) envelope = newEnv
  for (const c of $$('#envelope-controls input')) {
    c.value = envelope[c.id]
  }
}

/** Sync the chord displayed in the UI with the currently playing notes */
function updateChordDisplay () {
  const notes = Object.keys(playingNotes),
    sharp = $('sharp-or-flat').checked,
    short = MIDINumber.toChord(notes, sharp, false),
    long = MIDINumber.toChord(notes, sharp, true),
    chord = short === long ? short : short + ' : ' + long
  $('chord-name').value = chord
  return chord
}

function noteOn (midiNum, velocity = 1) {
  const oscParams = []
  if ($('source-select').value === 'additive-oscillators') {
    for (const panel of $$('.oscillator')) {
      oscParams.push({
        type: panel.querySelector('.waveform').value,
        detune: panel.querySelector('.detune').value,
        frequency: MIDINumber.toFrequency(
          Number(panel.querySelector('.note-offset').value) +
          midiNum +
          Number($('note-offset').value) +
          (Number(panel.querySelector('.octave').value) +
          Number($('octave').value)) * 12
        ),
        gain: panel.querySelector('.gain').value *
          (panel.querySelector('.invert-phase').checked ? -1 : 1)
      })
    }
  } else if ($('source-select').value === 'harmonic-series') {
    oscParams.push({
      type: 'custom',
      real: [0, 1, 0.5, 0.25, 0.125, 0.0125],
      imag: [0, 0, 0, 0, 0, 0],
      frequency: MIDINumber.toFrequency(
        midiNum +
        Number($('note-offset').value) +
        Number($('octave').value) * 12
      ),
      gain: 1
    })
  }

  let noteParams = Object.assign({}, envelope)
  noteParams.triggerTime = audio.currentTime
  if ($('velocity-sensitive').checked) {
    noteParams.velocity = velocity
  }
  if (pedals.soft) {
    noteParams.velocity *= 0.66
    noteParams.attack *= 1.333
  }
  if ($('source-select').value !== 'bytebeat') {
    playingNotes[midiNum] = new OscillatorNote(panner, noteParams, oscParams, Number($('tempo').value))
  } else {
    if ($('bytebeat-code').validity.valid) {
      playingNotes[midiNum] = new BytebeatNote(panner, noteParams, [{
        bytebeat: $('bytebeat-code').value,
        frequency: MIDINumber.toFrequency(
          midiNum +
          Number($('note-offset').value) +
          (Number($('octave').value) + 8) * 12
        ),
        tempo: Number($('tempo').value),
        floatMode: $('bytebeat-mode').value === 'float'
      }])
    }
  }

  updateChordDisplay()
  $(MIDINumber.toScientificPitch(midiNum)).classList.add('keypress')
}

function noteOff (midiNum) {
  if (pedals.sustain && !sustainingNotes[midiNum]) {
    sustainingNotes[midiNum] = playingNotes[midiNum]
  } else if (playingNotes[midiNum]) {
    playingNotes[midiNum].releaseNote()
  }
  delete playingNotes[midiNum]
  updateChordDisplay()
  $(MIDINumber.toScientificPitch(midiNum)).classList.remove('keypress')
}

function sustainPedalEvent (ev) {
  if (pedals.sustain && ev.value < 64) {
    pedals.sustain = false
    for (let n in sustainingNotes) {
      sustainingNotes[n].releaseNote()
      delete sustainingNotes[n]
    }
  } else if (!pedals.sustain && ev.value > 63) {
    pedals.sustain = true
  }
}

function sostenutoPedalEvent (ev) {
  if (pedals.sostenuto && ev.value < 64) {
    pedals.sostenuto = false
    for (let n in sostenutoNotes) {
      sostenutoNotes[n].releaseNote()
      delete sostenutoNotes[n]
    }
  } else if (!pedals.sostenuto && ev.value > 63) {
    pedals.sostenuto = true
    sostenutoNotes = playingNotes
    playingNotes = {}
  }
}

/**
* Sets up event listeners to link MIDI events with the appropriate actions
* @param {string|number} [channel='all'] MIDI channel to listen for events on
*/
function setupControllerListeners (channel = 'all') {
  controller.addListener('noteon', channel,
    e => noteOn(e.note.number, e.velocity))
  controller.addListener('noteoff', channel, e => noteOff(e.note.number))
  controller.addListener('controlchange', channel, controlChange)
  controller.addListener('channelmode', channel, channelMode)
}

function setupDisplayKeyboard (maxKeys = 88, lowNote = 21) {
  removeChildren($('ebony'))
  removeChildren($('ivory'))
  const keyWidth = (12 / 7) * (95 / maxKeys)
  $('keyboard').style.setProperty('--key-width', `${keyWidth}vw`)
  $('keyboard').style.setProperty('--half-key', `${keyWidth / 2}vw`)
  const palette = generateColorPalette()
  const makeShadowKey = () => {
    const shadowKey = document.createElement('div')
    shadowKey.classList.add('invisible')
    shadowKey.classList.add('key')
    $('ebony').appendChild(shadowKey)
  }
  makeShadowKey()
  for (let i = lowNote; i < lowNote + maxKeys; i++) {
    const elem = document.createElement('div')
    elem.classList.add('key')
    elem.id = MIDINumber.toScientificPitch(i)
    elem.midiNumber = i
    elem.onmousedown = e => noteOn(e.target.midiNumber)
    elem.onmouseleave = e => noteOff(e.target.midiNumber)
    elem.onmouseup = e => noteOff(e.target.midiNumber)
    elem.addEventListener('touchstart', e => {
      e.preventDefault()
      noteOn(e.target.midiNumber)
    })
    elem.addEventListener('touchend', e => {
      e.preventDefault()
      noteOff(e.target.midiNumber)
    })
    elem.addEventListener('touchcancel', e => {
      e.preventDefault()
      noteOff(e.target.midiNumber)
    })
    elem.style.setProperty('--squish', palette[i % 12])
    if (elem.id.includes('E') || elem.id.includes('B')) {
      makeShadowKey()
    }
    if (elem.id.includes('♯')) {
      $('ebony').appendChild(elem)
    } else {
      $('ivory').appendChild(elem)
    }
  }
}

function generateColorPalette (seed = Math.random() * Math.PI * 2) {
  const palette = [], j = 2 * Math.PI / 3,
    magic = f => (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
  for (let i = 0; i < 12; i++) {
    let f = i + seed, c = []
    for (let k = 0; k < 3; k++) {
      c.push(magic(f += j))
    }
    f -= j
    palette.push('rgb(' + c.join() + ')')
  }
  return palette
}

function setupKeypressKeymap () {
  document.addEventListener('keydown', e => {
    if (Object.keys(keyboardKeymap).includes(e.key)
    && !e.altKey && !e.shiftKey && !e.ctrlKey
    && !Object.values(currentlyHeldKeys).includes(keyboardKeymap[e.key])
    && e.target.tagName !== 'INPUT') {
      currentlyHeldKeys[e.key] = keyboardKeymap[e.key]
      noteOn(keyboardKeymap[e.key])
    }
  })
  document.addEventListener('keyup', e => {
    if (Object.keys(currentlyHeldKeys).includes(e.key)) {
      delete currentlyHeldKeys[e.key]
      noteOff(keyboardKeymap[e.key])
    }
  })
  const bb = $('bytebeat-code'),
    validate = () => {
      bb.setCustomValidity(
      BytebeatNode.validateBytebeat(bb.value) ? '' : 'Invalid bytebeat')
    }
  validate()
  bb.oninput = validate
}

function setupGlobalEventListeners () {
  $('master-gain').addEventListener('change', e => {
    masterGain.gain.value = e.target.value
  })
  $('master-gain').addEventListener('dblclick', e => {
    masterGain.gain.value = 0.5
    e.target.value = 0.5
  })
  $('panning').addEventListener('change', e => {
    panner.pan.value = e.target.value
  })
  $('panning').addEventListener('dblclick', e => {
    panner.pan.value = 0
    e.target.value = 0
  })
  $('metronome').addEventListener('change', e => {
    e.target.checked ? metronome.start() : metronome.stop()
  })
  $('tempo').addEventListener('change', e => {
    metronome.tempo = e.target.value
  })
  $('source-select').addEventListener('change', e => changeCurrentView(e.target.value))
}

/** Hides all audio source UI except the one with the matching ID
* @param {string} viewId
*/
function changeCurrentView (viewId) {
  if ($('source-select').value !== viewId) {
    $('source-select').value = viewId
  }
  for (const el of $$('#audio-sources')[0].children) {
    if (el.id === viewId) {
      el.classList.remove('hidden')
    } else {
      el.classList.add('hidden')
    }
  }
}

/** Attach preset <option>s to <select>.
* @param {Preset[]} presets
* @param {DOMElement} target
*/
function updateCustomPresets (presets, target) {
  removeChildren(target)
  presets.forEach((preset, index) => {
    let el = document.createElement('option')
    el.textContent = preset.name
    el.value = index
    target.appendChild(el)
  })
}

/** Reload data from the previous session, if it exists */
function loadPersistentState () {
  if (window.localStorage.customPresets !== undefined) {
    customPresets = JSON.parse(window.localStorage.customPresets)
  }
  if (window.localStorage.persistentSettings !== undefined) {
    loadPreset(JSON.parse(window.localStorage.persistentSettings))
  } else {
    loadPreset(factoryPresets[0])
  }
}

window.onload = () => {
  panner.connect(masterGain)
  masterGain.connect(masterLevel)
  masterLevel.connect(audio.destination)
  setupGlobalEventListeners()
  $('add-oscillator').addEventListener('click', () => addOscillator())
  setupKeypressKeymap()
  setupDisplayKeyboard()
  updateEnvelope()
  for (const obj of $$('#envelope-controls input')) {
    obj.addEventListener('change', updateEnvelope)
  }
  loadPersistentState()
  updateCustomPresets(factoryPresets, $('factory-presets'))
  updateCustomPresets(customPresets, $('custom-presets'))
  $('load-preset').addEventListener('click', () => {
    const selected = $('preset-list').selectedOptions[0],
      storage = selected.parentElement.label === 'Factory Presets' ?
        factoryPresets : customPresets,
      currentPreset = storage[selected.value]
    if (currentPreset) loadPreset(currentPreset)
  })
  $('add-preset').addEventListener('click', addPreset)
  $('remove-preset').addEventListener('click', removePreset)
  if (audio.audioWorklet) {
    audio.audioWorklet.addModule('bytebeat-processor.js')
  }
  WebMidi.enable(err => {
    if (err) {
      console.error('WebMidi could not be enabled.', err)
      setupDisplayKeyboard()
    } else {
      console.log('WebMidi enabled!')

      const cf = $('controller-form'),
        cs = $('controller-select'),
        chs = $('channel-select')

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

window.onunload = () => {
  window.localStorage.persistentSettings = JSON.stringify(getPresetInfo())
  window.localStorage.customPresets = JSON.stringify(customPresets)
}
