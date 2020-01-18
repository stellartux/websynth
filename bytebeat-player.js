customElements.define(
  'bytebeat-player',
  class extends HTMLElement {
    constructor() {
      super()
      const shadow = this.attachShadow({ mode: 'open' })
      const main = document.createElement('main')
      this.hasChanged = false

      this.input = document.createElement('textarea')
      this.input.setAttribute('name', 'bytebeat')
      this.input.setAttribute('placeholder', 't => { // bytebeat }')
      this.input.setAttribute('spellcheck', false)
      this.input.cols = 40
      this.input.rows = 1
      this.input.innerText = this.textContent
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
      rate.value = this.hasAttribute('samplerate')
        ? this.getAttribute('samplerate')
        : 8000
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
      tempo.value = this.hasAttribute('tempo')
        ? this.getAttribute('tempo')
        : 120
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

      this.context = new (window.AudioContext || window.webkitAudioContext)()
      this.usingPolyfill = !this.context.audioWorklet
      if (this.usingPolyfill) {
        const lengthLabel = document.createElement('label')
        lengthLabel.innerText = 'Length: '
        const length = document.createElement('input')
        length.setAttribute('name', 'length')
        length.setAttribute('type', 'number')
        length.setAttribute('min', 1)
        length.value = this.hasAttribute('length')
          ? this.getAttribute('length')
          : 30
        length.onchange = () => (this.hasChanged = true)
        options.appendChild(lengthLabel).appendChild(length)
        Object.defineProperty(this, 'renderLength', {
          get() {
            return length.value
          },
          set(v) {
            length.value = v
          },
        })
      } else {
        this.context.audioWorklet.addModule('bytebeat-processor.js')
      }

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
  border: solid thick blue;
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
    set value(v) {
      this.input.value = v
    }
    get isPlaying() {
      return this._isPlaying
    }
    set isPlaying(v) {
      this._isPlaying = v
      this.speakerIcon.style.visibility = v ? '' : 'hidden'
    }

    play() {
      if (
        this.usingPolyfill &&
        !this.hasChanged &&
        this.currentPlayingBytebeat
      ) {
        this.currentPlayingBytebeat.restart()
        this.currentPlayingBytebeat.source.onended = () => {
          this.isPlaying = false
        }
      } else if (this.input.validity.valid) {
        this.stop()
        this.currentPlayingBytebeat = new BytebeatNode(
          this.context,
          this.value,
          this.rate.value,
          this.tempo.value,
          this.beatType.value === 'Floatbeat',
          this.renderLength
        )
        if (this.usingPolyfill) {
          this.currentPlayingBytebeat.source.onended = () => {
            this.isPlaying = false
          }
        }
        this.currentPlayingBytebeat.connect(this.context.destination)
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
        BytebeatNode.validateBytebeat(this.value) ? '' : 'Invalid bytebeat'
      )
    }
  }
)
