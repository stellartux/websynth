import {
  assertEquals,
  test,
  runTests,
} from 'https://deno.land/std/testing/mod.ts'
import { MIDINumber } from '../src/midinumber.js'

test({
  name: 'MIDINumber.toLetter(n)',
  fn: function() {
    assertEquals(MIDINumber.toLetter(60), 'C')
    assertEquals(MIDINumber.toLetter(64), 'E')
    assertEquals(MIDINumber.toLetter(67), 'G')
    assertEquals(MIDINumber.toLetter(61), 'C♯')
    assertEquals(MIDINumber.toLetter(68), 'G♯')
  },
})
test({
  name: 'MIDINumber.toLetter(n, false)',
  fn: function() {
    assertEquals(MIDINumber.toLetter(60, false), 'C')
    assertEquals(MIDINumber.toLetter(64, false), 'E')
    assertEquals(MIDINumber.toLetter(67, false), 'G')
    assertEquals(MIDINumber.toLetter(61, false), 'D♭')
    assertEquals(MIDINumber.toLetter(68, false), 'A♭')
  },
})
test({
  name: 'MIDINumber.toChord()',
  fn: function() {
    assertEquals(MIDINumber.toChord([60, 64, 67]), 'C')
    assertEquals(MIDINumber.toChord([61, 65, 68]), 'C♯')
    assertEquals(MIDINumber.toChord([61, 65, 68], false), 'D♭')
  },
})
if (import.meta.main) runTests()
