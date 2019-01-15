customElements.define('bytebeat-player',
  class extends HTMLElement {
    constructor () {
      super()
      const shadow = this.attachShadow({mode: 'open'})

      const bytebeatInput = document.createElement('textarea')
      bytebeatInput.setAttribute('name', 'bytebeat')
      bytebeatInput.setAttribute('placeholder', 't => { // bytebeat }')
      bytebeatInput.cols = 40
      bytebeatInput.rows = 1
      bytebeatInput.innerText = this.textContent
      this.input = bytebeatInput
      shadow.appendChild(bytebeatInput)

      this.context = new (window.AudioContext || window.webkitAudioContext)()
      if (this.context.audioWorklet) {
        this.context.audioWorklet.addModule('bytebeat-processor.js')
      }

      const rate = document.createElement('input')
      rate.setAttribute('name', 'rate')
      rate.setAttribute('type', 'number')
      rate.setAttribute('min', '4000')
      rate.setAttribute('max', '96000')
      rate.value = this.hasAttribute('samplerate')
        ? this.getAttribute('samplerate')
        : 8000
      shadow.appendChild(rate)
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
      shadow.appendChild(playButton)

    }
    get value () {
      return this.input.value
    }

    play () {
      this.stop()
      this.currentPlayingBytebeat = new BytebeatNode(this.context, this.value, this.rate.value)
      this.currentPlayingBytebeat.connect(this.context.destination)
      this.currentPlayingBytebeat.start()
    }
    stop () {
      if (this.currentPlayingBytebeat) {
        this.currentPlayingBytebeat.stop()
        this.currentPlayingBytebeat = undefined
      }
    }
  }
)
