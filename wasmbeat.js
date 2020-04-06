import { buildWabt } from './src/build-wabt.js'
import { BytebeatNote } from './src/bytebeat-note.js'
const userInput = document.querySelector('textarea[name="code"]')
const output = document.querySelector('output[name="result"]')
const buildLog = document.getElementById('build-log')
const audio = new (window.AudioContext || window.webkitAudioContext)()
const gain = new GainNode(audio, { gain: 0.4 })
audio.audioWorklet.addModule('./src/bytebeat-processor.js')
gain.connect(audio.destination)
let currentModule
let currentNote
let currentInstance
document.querySelector('button[name="build"]').onclick = async () => {
  try {
    const { instance, module, log } = await buildWabt(userInput.value, {
      log: true,
    })
    output.innerText = '✔'
    buildLog.innerText = log
    currentModule = module
    currentInstance = instance
  } catch (error) {
    output.innerText = '❌'
  }
}
document.querySelector('button[name="play"]').onclick = async () => {
  if (currentModule) {
    if (currentNote) currentNote.stop()
    currentNote = new BytebeatNote(gain, { attack: 0.01, sustain: 0.5 }, [
      {
        module: currentModule,
        tempo: 120,
        frequency: 8000,
      },
    ])
  }
}
document.querySelector('button[name="stop"]').onclick = () => {
  if (currentNote) {
    currentNote.stopNote(0)
    currentNote = undefined
  }
}
document.querySelector('input[name="gain"]').addEventListener('change', e => {
  gain.gain.value = e.target.value
})
