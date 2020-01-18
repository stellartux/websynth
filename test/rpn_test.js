import {
  assertEquals,
  test,
  runTests,
} from 'https://deno.land/std/testing/mod.ts'
import { RPN } from '../src/rpn.js'

test({
  name: "RPN.interpret('1 1 +')",
  fn: () => {
    assertEquals(RPN.interpret('1 1 +'), 2)
  },
})
test({
  name: "RPN.toGlitchURL('1 1 +')",
  fn: function() {
    assertEquals(RPN.toGlitchURL('1 1 +'), 'glitch://!1.1f')
  },
})
test({
  name: "RPN.fromGlitchURL('glitch://!1.1f')",
  fn: function() {
    assertEquals(RPN.fromGlitchURL('glitch://!1.1f'), '1 1 +')
  }
})
if (import.meta.main) runTests()
