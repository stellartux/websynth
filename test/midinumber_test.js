import { assertEquals } from '../deps.ts'
import { MIDINumber } from '../src/midinumber.js'

Deno.test({
  name: 'MIDINumber.toLetter(n)',
  fn: function() {
    assertEquals(MIDINumber.toLetter(60), 'C')
    assertEquals(MIDINumber.toLetter(64), 'E')
    assertEquals(MIDINumber.toLetter(67), 'G')
    assertEquals(MIDINumber.toLetter(61), 'C♯')
    assertEquals(MIDINumber.toLetter(68), 'G♯')
  },
})
Deno.test({
  name: 'MIDINumber.toLetter(n, false)',
  fn: function() {
    assertEquals(MIDINumber.toLetter(60, false), 'C')
    assertEquals(MIDINumber.toLetter(64, false), 'E')
    assertEquals(MIDINumber.toLetter(67, false), 'G')
    assertEquals(MIDINumber.toLetter(61, false), 'D♭')
    assertEquals(MIDINumber.toLetter(68, false), 'A♭')
  },
})
Deno.test({
  name: 'MIDINumber.toChord()',
  fn: function() {
    assertEquals(MIDINumber.toChord([60, 64, 67]), 'C')
    assertEquals(MIDINumber.toChord([61, 65, 68]), 'C♯')
    assertEquals(MIDINumber.toChord([61, 65, 68], false), 'D♭')
    assertEquals(MIDINumber.toChord([48, 52, 55, 59]), 'CM7')
    assertEquals(MIDINumber.toChord([33, 36, 40, 43]), 'Am7')
  },
})

if (import.meta.main) Deno.runTests()
