import { BytebeatNote } from './src/bytebeat-note.js'
import { validateBytebeat } from './src/bytebeat-utils.js'
import { Metronome } from './src/metronome.js'
import { MIDINumber } from './src/midinumber.js'
import { NoteMap } from './src/note-map.js'
import { OscillatorNote } from './src/oscillator-note.js'
import { RPN } from './src/rpn.js'
import { ComplexNumber, evaluate, invert, mathML, parse, validate as validateFormula } from './src/maths.js'

if (window.WebAssembly) {
  import('./src/build-wabt.js').then((module) => {
    const wat = document.getElementById('wasm-wat-code')
    const watInput = async () => {
      try {
        const mod = await module.buildWabt(`(module (type $t0 (func (param
          i32 i32) (result i32))) (func $bytebeat (export "bytebeat") (type $t0)
          (param $t i32) (param $tt i32) (result i32) ${wat.value}))`)
        wasmModule = mod.module
        wat.setCustomValidity('')
      } catch (e) {
        wat.setCustomValidity('Invalid wasm')
      }
    }
    wat.oninput = watInput

    const rpn = document.getElementById('wasm-rpn-code')
    const rpnInput = async () => {
      try {
        const bin = RPN.toWasmBinary(rpn.value)
        if (WebAssembly.validate(bin)) {
          wasmModule = await WebAssembly.compile(bin)
          rpn.setCustomValidity('')
        } else {
          rpn.setCustomValidity('Invalid wasm')
        }
      } catch {
        rpn.setCustomValidity('Invalid wasm')
      }
    }
    rpn.oninput = rpnInput

    const codeBlocks = [wat, rpn]
    const noProp = (ev) => ev.stopPropagation()
    for (const b of codeBlocks) b.addEventListener('keydown', noProp)

    const wasmLanguage = document.getElementById('wasm-language')
    wasmLanguage.addEventListener('change', (ev) =>
      changeCurrentView(ev.target.value, 'wasm-language', 'wasm-code-blocks')
    )
    document.getElementById(wasmLanguage.value).oninput()
  })
} else {
  document.querySelector('option[value="wasmbeat"]').remove()
}

class Preset {
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
   * @param {'additive-oscillators' | 'bytebeat' | 'harmonic-series' | 'wasmbeat'} type
   */
  constructor(name, envelope, oscillators, type = 'additive-oscillators') {
    if (!(envelope && oscillators)) {
      throw new TypeError(
        'Preset: Constructor is missing necessary initialization parameters'
      )
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
function getPresetInfo() {
  const type = document.getElementById('source-select').value
  const oscs = []
  if (type === 'harmonic-series') {
    const o = {}
    for (const id of ['harmonic-count', 'harmonic-function']) {
      o[id] = document.getElementById(id).value
    }
    oscs.push(o)
  } else if (type === 'bytebeat') {
    oscs.push({
      bytebeatCode: document.getElementById('bytebeat-code').value,
      bytebeatMode: document.getElementById('bytebeat-mode').value,
    })
  } else if (type === 'wasmbeat') {
    const code = document.querySelector('#wasm-code-blocks textarea:not(.hidden)')
    oscs.push({ id: code.id, value: code.value })
    for (const { id, value } of document.querySelectorAll('#wasm-options select')) {
      oscs.push({ id, value })
    }
  } else {
    for (const osc of document.querySelectorAll('.oscillator')) {
      const o = {}
      o.waveform = osc.querySelector('.waveform').value
      for (const param of osc.querySelectorAll('input')) {
        o[param.className] = param.value
      }
      o['invert-phase'] = osc.querySelector('.invert-phase').checked
      oscs.push(o)
    }
  }
  return new Preset(
    document.getElementById('preset-name').value,
    envelopeElement.envelope,
    oscs,
    type
  )
}

/** Adds a new oscillator panel to the UI window
 * @param {Preset} [preset]
 */
function addOscillator(preset) {
  const oscillator = document.importNode(
    document.getElementById('oscillator-template').content, true)
  const panel = document.getElementById('oscillator-panel')
  oscillator.querySelector('.remove-oscillator')
    .addEventListener('click', (e) => panel.removeChild(e.target.parentElement))
  oscillator.querySelector('.gain')
    .addEventListener('dblclick', (e) => { e.target.value = 0.5 })
  if (preset) {
    for (const pp in preset) {
      if (pp === 'invert-phase') {
        oscillator.querySelector('.invert-phase').checked = true
      } else {
        oscillator.querySelector('.' + pp).value = preset[pp]
      }
    }
  }
  panel.appendChild(oscillator)
}

/** Saves a preset to the custom presets list.
 * @throws Unnamed presets can't be saved
 */
function addPreset() {
  if (!document.getElementById('preset-name').value) {
    throw new Error("Unnamed preset can't be saved")
  }
  customPresets.push(getPresetInfo())
  updateCustomPresets(customPresets, document.getElementById('custom-presets'))
}

/** Remove the currently selected preset */
function removePreset() {
  const selected = document.getElementById('preset-list').selectedOptions[0]
  if (selected.parentElement.label === 'Custom Presets') {
    customPresets.splice(selected.value, 1)
    updateCustomPresets(customPresets, document.getElementById('custom-presets'))
  }
}

/** Load the settings of a preset to the page
 * @param {Preset} preset The preset to load
 */
function loadPreset({ envelope, oscillators, type }) {
  changeCurrentView(
    type || 'additive-oscillators',
    'source-select',
    'audio-sources'
  )
  switch (type) {
    case 'bytebeat':
      document.getElementById('bytebeat-code').value = oscillators[0].bytebeatCode
      document.getElementById('bytebeat-mode').value = oscillators[0].bytebeatMode
      break
    case 'wasmbeat':
      for (const { id, value } of oscillators) {
        const el = document.getElementById(id)
        if (el) el.value = value
      }
      break
    case 'harmonic-series':
      for (const [id, value] of Object.entries(oscillators[0])) {
        document.getElementById(id).value = value
      }
      break
    case 'additive-oscillators':
    default:
      removeChildren(document.getElementById('oscillator-panel'))
      oscillators.forEach(addOscillator)
  }
  envelopeElement.envelope = envelope
}

let controller,
  playingNotes = new NoteMap(),
  sustainingNotes = new NoteMap(),
  sostenutoNotes = new NoteMap(),
  currentlyHeldKeys = new NoteMap(),
  // pitchBend = 0,
  customPresets = [],
  wasmModule
const removeChildren = (el) => {
    while (el.firstChild) el.removeChild(el.firstChild)
  },
  audio = new AudioContext(),
  pedals = { sustain: false, sostenuto: false, soft: false },
  panner = new StereoPannerNode(audio),
  masterGain = new GainNode(audio, { gain: 0.5 }),
  // masterLevel = new AnalyserNode(audio),
  metronome = new Metronome(masterGain),
  limiter = new DynamicsCompressorNode(audio, {
    attack: 0,
    knee: 0,
    ratio: 20,
    release: 0.01,
    threshold: -2,
  }),
  envelopeElement = document.querySelector('websynth-envelope'),
  keyboardKeymap = {
    "Digit0": 75,
    "Digit2": 61,
    "Digit3": 63,
    "Digit5": 66,
    "Digit6": 68,
    "Digit7": 70,
    "Digit9": 73,
    "KeyB": 55,
    "KeyC": 52,
    "KeyD": 51,
    "KeyE": 64,
    "KeyG": 54,
    "KeyH": 56,
    "KeyI": 72,
    "KeyJ": 58,
    "KeyL": 61,
    "KeyM": 59,
    "KeyN": 57,
    "KeyO": 74,
    "KeyP": 76,
    "KeyQ": 60,
    "KeyR": 65,
    "KeyS": 49,
    "KeyT": 67,
    "KeyU": 71,
    "KeyV": 53,
    "KeyW": 62,
    "KeyX": 50,
    "KeyY": 69,
    "KeyZ": 48,
    "Semicolon": 63,
    "Equal": 78,
    "Comma": 60,
    "Period": 62,
    "Slash": 64,
    "BracketLeft": 77,
    "Backslash": 47,
    "BracketRight": 79,
    "IntlBackslash": 47,
  },
  factoryPresets = [
    new Preset(
      'Sinewave',
      { attack: 0.2, decay: 0.2, sustain: 0.4, release: 0.3 },
      [{ gain: 0.7 }]
    ),
    new Preset(
      'Bowed Glass',
      { attack: 0.62, decay: 0.15, sustain: 0.42, release: 0.32 },
      [
        { detune: -5 },
        { detune: 5, 'invert-phase': true },
        { waveform: 'triangle', octave: 1, gain: 0.2 },
      ]
    ),
    new Preset(
      'Church Organ',
      { attack: 0.28, decay: 0.35, sustain: 0.29, release: 0.18 },
      [
        { octave: -1, gain: 0.35 },
        { detune: 2, 'note-offset': 7, gain: 0.25 },
        { gain: 0.2 },
        { octave: 1, gain: 0.2 },
        { detune: 2, 'note-offset': 7, octave: 1, gain: 0.2 },
        { octave: 2, gain: 0.15 },
        { detune: -14, 'note-offset': 4, octave: 2, gain: 0.15 },
        { detune: 2, 'note-offset': 7, octave: 2, gain: 0.15 },
        { octave: 3, gain: 0.12 },
      ]
    ),
    new Preset(
      'Sierpinski Harmony',
      { attack: 0, decay: 0.15, sustain: 0.75, release: 0.04 },
      [
        {
          bytebeatCode: 't & t >> 8',
          bytebeatMode: 'byte',
        },
      ],
      'bytebeat'
    ),
    new Preset(
      'Synced Sierpinski',
      { attack: 0, decay: 0.15, sustain: 0.75, release: 0.04 },
      [
        {
          bytebeatCode: 't & tt >> 8',
          bytebeatMode: 'byte',
        },
      ],
      'bytebeat'
    ),
    new Preset(
      'Wasm Sierpinski',
      { attack: 0, decay: 0.15, sustain: 0.75, release: 0.04 },
      [
        {
          wasmbeatCode:
            'local.get $t\nlocal.get $t\ni32.const 8\ni32.shr_u\ni32.and',
          wasmbeatLanguage: 'wat',
        },
      ],
      'wasmbeat'
    ),
    new Preset(
      'Headachegoldfish',
      { attack: 0, decay: 0.15, sustain: 0.75, release: 0.04 },
      [
        {
          bytebeatCode:
            'int("HEADACHEGOLDFISH",(tt>>10)%16)*(t&~7&0x1e70>>((tt>>15)%8))',
          bytebeatMode: 'byte',
        },
      ],
      'bytebeat'
    ),
    // new Preset('', { attack: 0, decay: 0.15, sustain: 0.75, release: 0.04 }, [
    //   {},
    // ]),
  ]

/** Release all currently playing notes */
function releaseAllNotes() {
  playingNotes.releaseAll()
  updateChordDisplay()
}

/** Stop all sound immediately */
function stopAllSound() {
  for (const ns of [playingNotes, sustainingNotes, sostenutoNotes]) {
    ns.stopAll()
  }
  updateChordDisplay()
}

function channelMode(event) {
  switch (event.controller.number) {
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

function controlChange(event) {
  switch (event.controller.number) {
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.holdpedal:
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.hold2pedal:
      sustainPedalEvent(event)
      break
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.modulationwheelcoarse:
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.sustenutopedal:
      sostenutoPedalEvent(event)
      break
    case WebMidi.MIDI_CONTROL_CHANGE_MESSAGES.softpedal:
      pedals.soft = event.value > 63
      break
    default:
      console.log(event)
      break
  }
}

/** Sync the chord displayed in the UI with the currently playing notes */
function updateChordDisplay() {
  const notes = [...playingNotes.keys()].sort((a, b) => a - b),
    sharp = document.getElementById('sharp-or-flat').checked,
    short = MIDINumber.toChord(notes, sharp, false),
    long = MIDINumber.toChord(notes, sharp, true),
    chord = short === long ? short : short + ' : ' + long
  document.getElementById('chord-name').value = chord
  return chord
}

/** Audio source functions for different audio generation techniques */
const noteSources = {
  'additive-oscillators': {
    class: OscillatorNote,
    oscParams: (midiNum) => {
      const oscParams = []
      for (const panel of document.querySelectorAll('.oscillator')) {
        oscParams.push({
          type: panel.querySelector('.waveform').value,
          detune: panel.querySelector('.detune').value,
          frequency: MIDINumber.toFrequency(
            Number(panel.querySelector('.note-offset').value) +
            midiNum +
            Number(document.getElementById('note-offset').value) +
            (Number(panel.querySelector('.octave').value) +
              Number(document.getElementById('octave').value)) *
            12
          ),
          gain:
            panel.querySelector('.gain').value *
            (panel.querySelector('.invert-phase').checked ? -1 : 1),
        })
      }
      return oscParams
    },
  },
  'harmonic-series': {
    class: OscillatorNote,
    oscParams: (midiNum) => {
      const oscParams = []
      const count = document.getElementById('harmonic-count').value
      const real = new Float32Array(count + 1)
      real[1] = 1
      const imag = new Float32Array(count + 1)
      const N = new ComplexNumber(count)
      const func = document.getElementById('harmonic-function')
      try {
        const expr = ['/', new ComplexNumber(1), parse(func.value)]
        let x = new ComplexNumber(1, 0)
        for (let k = 1; k <= count; ++k) {
          x = evaluate(expr, { k: new ComplexNumber(k), N })
          real[k + 1] = x.re
          imag[k + 1] = x.im
        }
        if (real.some(Number.isNaN)) {
          func.setCustomValidity('Invalid')
          return
        }
        func.setCustomValidity('')
        oscParams.push({
          type: 'custom', real, imag,
          frequency: MIDINumber.toFrequency(
            midiNum +
            Number(document.getElementById('note-offset').value) +
            Number(document.getElementById('octave').value) * 12
          ),
          gain: 1,
        })
        return oscParams
      } catch (error) {
        func.setCustomValidity('Invalid')
        throw error
      }

    },
  },
  bytebeat: {
    class: BytebeatNote,
    oscParams: (midiNum) => {
      return [
        {
          bytebeat: document.getElementById('bytebeat-code').value,
          frequency: MIDINumber.toFrequency(
            midiNum +
            Number(document.getElementById('note-offset').value) +
            (Number(document.getElementById('octave').value) + 8) * 12
          ),
          tempo: Number(document.getElementById('tempo').value),
          floatMode: document.getElementById('bytebeat-mode').value === 'float',
        },
      ]
    },
  },
  wasmbeat: {
    class: BytebeatNote,
    oscParams: (midiNum) => {
      return [
        {
          module: wasmModule,
          frequency: MIDINumber.toFrequency(
            midiNum +
            Number(document.getElementById('note-offset').value) +
            (Number(document.getElementById('octave').value) + 8) * 12
          ),
          tempo: Number(document.getElementById('tempo').value),
          floatMode: false,
        },
      ]
    },
  },
}

function noteOn(midiNum, velocity = 1) {
  const source = document.getElementById('source-select').value
  if (
    (source === 'bytebeat' && !document.getElementById('bytebeat-code').validity.valid) ||
    (source === 'wasmbeat' && !wasmModule) ||
    (source === 'harmonic-series' && !document.getElementById('harmonic-function').validity.valid)
  ) {
    return
  }
  let noteParams = envelopeElement.envelope,
    oscParams = noteSources[source].oscParams(midiNum)
  if (!oscParams) return
  noteParams.triggerTime = audio.currentTime
  if (document.getElementById('velocity-sensitive').checked) {
    noteParams.velocity = velocity
  }
  if (pedals.soft) {
    noteParams.velocity *= 0.66
    noteParams.attack *= 1.333
  }
  playingNotes.set(
    midiNum,
    new noteSources[source].class(panner, noteParams, oscParams)
  )
  updateChordDisplay()
  document.getElementById(MIDINumber.toScientificPitch(midiNum)).classList.add('keypress')
}

function noteOff(midiNum) {
  if (pedals.sustain && !sustainingNotes.has(midiNum)) {
    sustainingNotes.set(midiNum, playingNotes.release(midiNum))
  } else if (playingNotes.has(midiNum)) {
    playingNotes.release(midiNum)
  }
  updateChordDisplay()
  document.getElementById(MIDINumber.toScientificPitch(midiNum)).classList.remove('keypress')
}

function sustainPedalEvent(ev) {
  if (pedals.sustain && ev.value < 64) {
    pedals.sustain = false
    sustainingNotes.forEach((n) => n.releaseNote())
    sustainingNotes.clear()
  } else if (!pedals.sustain && ev.value > 63) {
    pedals.sustain = true
  }
}

function sostenutoPedalEvent(ev) {
  if (pedals.sostenuto && ev.value < 64) {
    pedals.sostenuto = false
    for (const n in sostenutoNotes) {
      sostenutoNotes[n].releaseNote()
      delete sostenutoNotes[n]
    }
  } else if (!pedals.sostenuto && ev.value > 63) {
    pedals.sostenuto = true
    sostenutoNotes = playingNotes
    playingNotes.clear()
  }
}

/**
 * Sets up event listeners to link MIDI events with the appropriate actions
 * @param {string|number} [channel='all'] MIDI channel to listen for events on
 */
function setupControllerListeners(channel = 'all') {
  controller.addListener('noteon', channel, (e) =>
    noteOn(e.note.number, e.velocity)
  )
  controller.addListener('noteoff', channel, (e) => noteOff(e.note.number))
  controller.addListener('controlchange', channel, controlChange)
  controller.addListener('channelmode', channel, channelMode)
}

function setupDisplayKeyboard(maxKeys = 88, lowNote = 21) {
  removeChildren(document.getElementById('ebony'))
  removeChildren(document.getElementById('ivory'))
  const keyWidth = (12 / 7) * (95 / maxKeys)
  document.getElementById('keyboard').style.setProperty('--key-width', `${keyWidth}vw`)
  document.getElementById('keyboard').style.setProperty('--half-key', `${keyWidth / 2}vw`)
  const palette = generateColorPalette()
  const makeShadowKey = () => {
    const shadowKey = document.createElement('div')
    shadowKey.classList.add('invisible')
    shadowKey.classList.add('key')
    document.getElementById('ebony').appendChild(shadowKey)
  }
  makeShadowKey()
  for (let i = lowNote; i < lowNote + maxKeys; i++) {
    const elem = document.createElement('div')
    elem.classList.add('key')
    elem.id = MIDINumber.toScientificPitch(i)
    elem.midiNumber = i
    elem.onmousedown = (e) => noteOn(e.target.midiNumber)
    elem.onmouseleave = (e) => noteOff(e.target.midiNumber)
    elem.onmouseup = (e) => noteOff(e.target.midiNumber)
    elem.addEventListener('touchstart', (e) => {
      e.preventDefault()
      noteOn(e.target.midiNumber)
    })
    elem.addEventListener('touchend', (e) => {
      e.preventDefault()
      noteOff(e.target.midiNumber)
    })
    elem.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      noteOff(e.target.midiNumber)
    })
    elem.style.setProperty('--squish', palette[i % 12])
    if (elem.id.includes('E') || elem.id.includes('B')) {
      makeShadowKey()
    }
    if (elem.id.includes('♯')) {
      document.getElementById('ebony').appendChild(elem)
    } else {
      document.getElementById('ivory').appendChild(elem)
    }
  }
}

function generateColorPalette(seed = Math.random() * Math.PI * 2) {
  const palette = [],
    j = (2 * Math.PI) / 3
  const magic = (f) =>
    (187 + (Math.cos(f * 5) + Math.cos(f * 7)) * 32).toPrecision(3)
  for (let i = 0; i < 12; i++) {
    let f = i + seed,
      c = []
    for (let k = 0; k < 3; k++) {
      c.push(magic((f += j)))
    }
    f -= j
    palette.push('rgb(' + c.join() + ')')
  }
  return palette
}

function setupKeypressKeymap() {
  document.addEventListener('keydown', ({ altKey, code, ctrlKey, repeat, shiftKey, target }) => {
    if (
      Object.keys(keyboardKeymap).includes(code) &&
      !altKey && !shiftKey && !ctrlKey && !repeat &&
      !Object.values(currentlyHeldKeys).includes(keyboardKeymap[code]) &&
      target.tagName !== 'INPUT'
    ) {
      currentlyHeldKeys[code] = keyboardKeymap[code]
      noteOn(keyboardKeymap[code])
    }
  })
  document.addEventListener('keyup', ({ code }) => {
    if (Object.keys(currentlyHeldKeys).includes(code)) {
      delete currentlyHeldKeys[code]
      noteOff(keyboardKeymap[code])
    }
  })
  /** @type {HTMLInputElement} */
  const bb = document.getElementById('bytebeat-code')
  bb.addEventListener('input', () => {
    bb.setCustomValidity(validateBytebeat(bb.value) ? '' : 'Invalid bytebeat')
  })
}

function setupGlobalEventListeners() {
  document.getElementById('master-gain').addEventListener('change', ({ target }) => {
    masterGain.gain.value = target.value
  })
  document.getElementById('master-gain').addEventListener('dblclick', ({ target }) => {
    masterGain.gain.value = 0.5
    target.value = 0.5
  })
  document.getElementById('panning').addEventListener('change', ({ target }) => {
    panner.pan.value = target.value
  })
  document.getElementById('panning').addEventListener('dblclick', ({ target }) => {
    panner.pan.value = 0
    target.value = 0
  })
  document.getElementById('metronome').addEventListener('change', ({ target }) => {
    target.checked ? metronome.start() : metronome.stop()
  })
  document.getElementById('tempo').addEventListener('change', ({ target }) => {
    metronome.tempo = target.value
  })
  document.getElementById('source-select').addEventListener('change', ({ target }) =>
    changeCurrentView(target.value, 'source-select', 'audio-sources')
  )
}

/** Hides all audio source UI except the one with the matching ID
 * @param {string} viewId
 */
function changeCurrentView(viewId, selectId, parentId) {
  const select = document.getElementById(selectId)
  if (select.value !== viewId) {
    select.value = viewId
  }
  for (const el of document.querySelectorAll(`#${parentId}>:not(nav)`)) {
    el.classList[el.id === viewId ? 'remove' : 'add']('hidden')
  }
}

/** Attach preset <option>s to <select>.
 * @param {Preset[]} presets
 * @param {HTMLSelectElement} target
 */
function updateCustomPresets(presets, target) {
  removeChildren(target)
  presets.forEach((preset, index) => {
    const el = document.createElement('option')
    el.textContent = preset.name
    el.value = index.toString()
    target.appendChild(el)
  })
}

/** Reload data from the previous session, if it exists */
function loadPersistentState() {
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
  panner
    .connect(masterGain)
    .connect(limiter)
    //  .connect(masterLevel)
    .connect(audio.destination)
  setupGlobalEventListeners()
  document.getElementById('add-oscillator').addEventListener('click', () => addOscillator())
  setupKeypressKeymap()
  setupDisplayKeyboard()
  loadPersistentState()
  const hf = document.getElementById('harmonic-function')
  const huf = document.getElementById('harmonic-user-formula')
  function harmonicOnInput() {
    try {
      if (hf.value === '1') {
        huf.innerHTML = '<mn>1</mn>'
      } else if (validateFormula(hf.value)) {
        huf.innerHTML = mathML(invert(parse(hf.value)))
      } else {
        throw new Error('Invalid character in formula string.')
      }
      hf.setCustomValidity('')
    } catch (error) {
      huf.innerHTML = '<mfrac><mn>1</mn><mrow><mi>f</mi><mo>(</mo><mi>k</mi><mo>)</mo></mrow></mfrac>'
      hf.setCustomValidity('Invalid function')
      console.warn(error)
    }
  }
  harmonicOnInput()
  document.getElementById('harmonic-function').oninput = harmonicOnInput
  updateCustomPresets(factoryPresets, document.getElementById('factory-presets'))
  updateCustomPresets(customPresets, document.getElementById('custom-presets'))
  document.getElementById('load-preset').addEventListener('click', () => {
    const selected = document.getElementById('preset-list').selectedOptions[0],
      storage =
        selected.parentElement.label === 'Factory Presets'
          ? factoryPresets
          : customPresets,
      currentPreset = storage[selected.value]
    if (currentPreset) loadPreset(currentPreset)
  })
  document.getElementById('add-preset').addEventListener('click', addPreset)
  document.getElementById('remove-preset').addEventListener('click', removePreset)
  if (audio.audioWorklet) {
    audio.audioWorklet.addModule('./src/bytebeat-processor.js')
  }
  window.WebMidi?.enable((err) => {
    if (err) {
      console.error('WebMidi could not be enabled.', err)
      setupDisplayKeyboard()
    } else {
      console.log('WebMidi enabled!')

      const cf = document.getElementById('controller-form'),
        cs = document.getElementById('controller-select'),
        chs = document.getElementById('channel-select')

      cf.addEventListener('submit', (event) => {
        event.preventDefault()
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

window.addEventListener('pagehide', () => {
  window.localStorage.persistentSettings = JSON.stringify(getPresetInfo())
  window.localStorage.customPresets = JSON.stringify(customPresets)
})

window.addEventListener('click', () => audio.resume(), {
  capture: true,
  once: true,
})
