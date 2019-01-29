customElements.define('bytebeat-player',
  class extends HTMLElement {
    constructor () {
      super()
      const shadow = this.attachShadow({mode: 'open'})
      const main = document.createElement('main')

      this.input = document.createElement('textarea')
      this.input.setAttribute('name', 'bytebeat')
      this.input.setAttribute('placeholder', 't => { // bytebeat }')
      this.input.cols = 40
      this.input.rows = 1
      this.input.innerText = this.textContent
      const validate = () => {
        this.input.setCustomValidity(
          BytebeatNode.validateBytebeat(this.value) ? '' : 'Invalid bytebeat')
      }
      this.input.oninput = validate
      main.appendChild(this.input)

      this.context = new (window.AudioContext || window.webkitAudioContext)()
      if (this.context.audioWorklet) {
        this.context.audioWorklet.addModule('bytebeat-processor.js')
      }

      const options = document.createElement('div')

      const rate = document.createElement('input')
      rate.setAttribute('name', 'rate')
      rate.setAttribute('type', 'number')
      rate.setAttribute('min', '4000')
      rate.setAttribute('max', '96000')
      rate.value = this.hasAttribute('samplerate')
        ? this.getAttribute('samplerate')
        : 8000
      main.appendChild(rate)
      this.rate = rate

      this.lastValue = ''
      const playButton = document.createElement('button')
      playButton.addEventListener('click', () => {
        if (this.currentPlayingBytebeat && this.value !== this.lastValue) {
          this.play()
          this.lastValue = this.value
        } else if (this.currentPlayingBytebeat) {
          this.stop()
        } else {
          this.play()
          this.lastValue = this.value
        }
      })
      playButton.textContent = 'Play/Pause'
      main.appendChild(playButton)

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
      `
      shadow.appendChild(style)
      shadow.appendChild(main)
    }
    get value () {
      return this.input.value
    }

    play () {
      this.stop()
      if (this.input.validity.valid) {
        this.currentPlayingBytebeat = new BytebeatNode(
          this.context, this.value, this.rate.value)
        this.currentPlayingBytebeat.connect(this.context.destination)
        this.currentPlayingBytebeat.start()
      }
    }
    stop () {
      if (this.currentPlayingBytebeat) {
        this.currentPlayingBytebeat.stop()
        this.currentPlayingBytebeat = undefined
      }
    }
  }
)
