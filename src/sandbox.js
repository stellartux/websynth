import { RPN } from './rpn.js'

const $ = x => document.querySelector(x)
const codeInput = $('#code')
const glitchInput = $('#glitch-url')
const glitchName = $('#song-name')
const execT = $('input[name="exec-t"]')

$('button[name="from-url"]').onclick = () => {
  if (RPN.isValidGlitchURL(glitchInput.value)) {
    const [name, code] = RPN.fromGlitchURL(glitchInput.value)
    codeInput.value = code
    glitchName.value = name.replace('-', ' ')
  }
}
$('button[name="to-url"]').onclick = () => {
  if (RPN.isValidGlitchCode(codeInput.value)) {
    glitchInput.value = RPN.toGlitchURL(
      codeInput.value,
      glitchName.value.toLowerCase().replace(' ', '-')
    )
  }
}
$('button[name="execute"]').onclick = () => {
  if (RPN.isValidGlitchCode(codeInput.value)) {
    $('output[name="execute-result"]').value = RPN.glitchInterpret(
      codeInput.value,
      Number(execT.value)
    )
  }
}
