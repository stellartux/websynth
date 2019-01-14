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
      this.context.audioWorklet.addModule('bytebeat-processor.js')

      const rate = document.createElement('input')
      rate.setAttribute('name', 'rate')
      rate.setAttribute('type', 'number')
      rate.setAttribute('min', '4000')
      rate.setAttribute('max', this.context.sampleRate)
      rate.value = this.hasAttribute('samplerate')
        ? this.getAttribute('samplerate')
        : 8000
      shadow.appendChild(rate)
      this.rate = rate

      const playButton = document.createElement('button')
      playButton.addEventListener('click', () => this.play())
      playButton.textContent = '▶'
      shadow.appendChild(playButton)

      const stopButton = document.createElement('button')
      stopButton.addEventListener('click', () => this.stop())
      stopButton.textContent = '■'
      shadow.appendChild(stopButton)

    }
    get value () {
      console.log(this.input.value);
      return this.input.value
    }

    play () {
      if (this.currentPlayingBytebeat) {
        this.stop()
      }
      this.currentPlayingBytebeat = new BytebeatNode(this.context, this.value, this.rate.value)
      this.currentPlayingBytebeat.connect(this.context.destination)
      this.currentPlayingBytebeat.start()
    }
    stop () {
      this.currentPlayingBytebeat.stop()
    }
  }
)
