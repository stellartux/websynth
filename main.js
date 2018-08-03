class Note {
  constructor() {
    this.oscs = []
  }
}

let controller
const audio = new window.AudioContext()
const playingNotes = {}

window.onload = () => {
  WebMidi.enable(err => {
    if (err) {
      console.log("WebMidi could not be enabled.", err)
    } else {
      console.log("WebMidi enabled!")

      let cs = document.getElementById("controller-select")
      let form = document.getElementById("controller-form")

      for (let input of WebMidi.inputs) {
        let elem = document.createElement("option")
        elem.text = input.name
        cs.add(elem)
      }

      form.addEventListener("submit", e => {
        e.preventDefault()
        controller = WebMidi.getInputByName(cs.options[cs.selectedIndex].value)
        controller.addListener("noteon", "all", noteOn)
        controller.addListener("noteoff", "all", noteOff)
        form.classList.add("hidden")
      })
    }
  })
}

function noteOn(e) {
  playingNotes[e.note.number] = e
}

function noteOff(e) {
  delete playingNotes[e.note.number]
}
