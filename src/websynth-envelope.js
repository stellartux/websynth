//@ts-check
class WebsynthEnvelopeElement extends HTMLElement {
  /** @type {Record<string,HTMLInputElement>} */ #inputs = {}
  #envelope = {
    attack: 0.2,
    decay: 0.2,
    sustain: 0.2,
    release: 0.2,
  }

  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = `
div {
  border-bottom: solid thin var(--main-shadow);
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5ch 1ch;
  padding: 1ch 2ch;
}
input[type="number"] {
  width: min-content;
  max-width: 14ch;
  min-width: 7ch;
}
label {
  text-align: right;
}`
    shadowRoot.appendChild(style)

    const wrapper = document.createElement('div')
    const type = this.getAttribute('type') ?? 'range'
    for (const name of WebsynthEnvelopeElement.#adsr) {
      const label = document.createElement('label')
      label.setAttribute('for', name)
      label.innerText = name[0].toUpperCase() + name.slice(1)
      wrapper.appendChild(label)
      const slider = document.createElement('input')
      slider.setAttribute('id', name)
      slider.setAttribute('type', type)
      slider.setAttribute('step', '0.001')
      slider.setAttribute('min', '0')
      slider.setAttribute('max', '1')
      slider.setAttribute('value', '0.2')
      slider.addEventListener('change', () => {
        this.setAttribute(slider.id, slider.value)
      })
      slider.addEventListener('dblclick', () => {
        this.removeAttribute(slider.id)
      })
      this.#inputs[name] = wrapper.appendChild(slider)
    }
    shadowRoot.appendChild(wrapper)
  }

  get envelope() {
    return { ...this.#envelope }
  }

  /** @param {{ attack?: number, decay?: number, sustain?: number, release?: number }} envelope */
  set envelope(envelope) {
    for (const name of WebsynthEnvelopeElement.#adsr) {
      if (name in envelope) {
        this.setAttribute(name, envelope[name])
      }
    }
  }

  /**
   * @param {string} name
   * @param {string} _oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, _oldValue, newValue) {
    if (WebsynthEnvelopeElement.#adsr.includes(name)) {
      // @ts-ignore
      if (!isNaN(newValue)) {
        this.#inputs[name].value = newValue ?? 0.2
        this.#envelope[name] = Number(this.#inputs[name].value)
      }
    } else if (name === 'type') {
      if (newValue === 'range' || newValue === 'number') {
        for (const key of WebsynthEnvelopeElement.#adsr) {
          this.#inputs[key].setAttribute('type', newValue)
        }
      }
    }
  }

  static get observedAttributes() {
    return ['attack', 'decay', 'sustain', 'release', 'type']
  }

  static get #adsr() {
    return ['attack', 'decay', 'sustain', 'release']
  }
}

customElements.define('websynth-envelope', WebsynthEnvelopeElement)
