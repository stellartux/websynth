//@ts-check
import { BytebeatNode } from './bytebeat-note.js'
import { validateBytebeat } from './bytebeat-utils.js'

customElements.define(
  'bytebeat-player',
  class extends HTMLElement {
    #isPlaying = false
    constructor() {
      super()
      const shadow = this.attachShadow({ mode: 'open' })
      const main = document.createElement('main')
      this.addEventListener('click', () => this.context.resume(), {
        once: true,
      })
      this.hasChanged = false

      this.input = document.createElement('textarea')
      this.input.setAttribute('name', 'bytebeat')
      this.input.setAttribute('placeholder', 't => { // bytebeat }')
      this.input.setAttribute('spellcheck', 'false')
      this.input.cols = 40
      this.input.innerText = this.textContent ?? ''
      this.input.oninput = () => {
        this.hasChanged = true
        this.validate()
      }
      main.appendChild(this.input)

      const options = document.createElement('div')

      const rateLabel = document.createElement('label')
      rateLabel.innerText = 'Rate: '
      const rate = document.createElement('input')
      rate.setAttribute('name', 'rate')
      rate.setAttribute('type', 'number')
      rate.setAttribute('min', '4000')
      rate.setAttribute('max', '96000')
      rate.value = this.getAttribute('samplerate') || '8000'
      rate.onchange = () => (this.hasChanged = true)
      rateLabel.appendChild(rate)
      options.appendChild(rateLabel)
      this.rate = rate

      const tempoLabel = document.createElement('tempo')
      tempoLabel.innerText = 'Tempo: '
      const tempo = document.createElement('input')
      tempo.setAttribute('name', 'tempo')
      tempo.setAttribute('type', 'number')
      tempo.setAttribute('min', '60')
      tempo.setAttribute('max', '400')
      tempo.value = this.getAttribute('tempo') ?? '120'
      tempo.onchange = () => (this.hasChanged = true)
      tempoLabel.appendChild(tempo)
      options.appendChild(tempoLabel)
      this.tempo = tempo

      const beatLabel = document.createElement('label')
      beatLabel.innerText = 'Mode: '
      const beatType = document.createElement('select'),
        optByte = document.createElement('option'),
        optFloat = document.createElement('option')
      optByte.innerText = 'Bytebeat'
      optFloat.innerText = 'Floatbeat'
      beatType.appendChild(optByte)
      beatType.appendChild(optFloat)
      beatLabel.appendChild(beatType)
      options.appendChild(beatLabel)
      beatType.onchange = () => (this.hasChanged = true)
      this.beatType = beatType

      this.context = new AudioContext()
      this.limiter = new DynamicsCompressorNode(this.context, {
        attack: 0,
        knee: 0,
        ratio: 20,
        release: 0,
        threshold: -0.3,
      })
      this.limiter.connect(this.context.destination)
      this.context.audioWorklet.addModule('src/bytebeat-processor.js')

      const playButton = document.createElement('button')
      playButton.addEventListener('click', () => {
        if (this.isPlaying && !this.hasChanged) {
          this.stop()
        } else {
          this.play()
        }
      })
      playButton.textContent = 'Play/Stop'
      options.appendChild(playButton)

      this.speakerIcon = document.createElement('span')
      this.speakerIcon.innerText = '🔈'
      this.speakerIcon.style.visibility = 'hidden'
      options.appendChild(this.speakerIcon)

      main.appendChild(options)

      const style = document.createElement('style')
      style.innerText = `
main {
  display: grid;
  color-scheme: light dark;
}
[name=bytebeat] {
  height: max-content;
}
[name=bytebeat]:valid {
  border: solid thick green;
}
[name=bytebeat]:invalid {
  border: solid thick red;
}
div {
  display: flex;
  justify-content: space-evenly;
}
[type="number"] {
  width: 5ch;
}
[name="rate"] {
  min-width: 8ch;
}
      `
      shadow.appendChild(style)
      shadow.appendChild(main)
    }
    get value() {
      return this.input.value
    }
    set value(value) {
      this.input.value = value
    }
    get isPlaying() {
      return this.#isPlaying
    }
    set isPlaying(value) {
      this.#isPlaying = value
      this.speakerIcon.style.visibility = value ? '' : 'hidden'
    }

    play() {
      if (this.input.validity.valid) {
        this.stop()
        this.currentPlayingBytebeat = new BytebeatNode(this.context, {
          bytebeat: this.value,
          frequency: Number(this.rate.value),
          tempo: Number(this.tempo.value),
          floatMode: this.beatType.value === 'Floatbeat',
          sampleRate: this.context.sampleRate
        })
        this.currentPlayingBytebeat.connect(this.limiter)
        this.currentPlayingBytebeat.start()
      }
      this.hasChanged = false
      this.isPlaying = true
    }
    stop() {
      if (this.currentPlayingBytebeat) {
        this.currentPlayingBytebeat.stop()
      }
      this.isPlaying = false
    }
    validate() {
      this.input.setCustomValidity(
        validateBytebeat(this.value) ? '' : 'Invalid bytebeat'
      )
    }
  }
)
