import {
  assert,
  assertEquals,
  assertNotEquals,
  test,
  runIfMain,
} from '../deps.ts'
import { RPN } from '../src/rpn.js'
import * as RPNWASM from '../src/rpn.wasm'
RPN.glitchMachine = RPNWASM

test({
  name: "RPN.interpret('1 1 +')",
  fn: () => {
    assertEquals(RPN.interpret('1 1 +'), 2)
  },
})
test({
  name: "RPN.toGlitchURL('1 1 +', 'name')",
  fn: function() {
    assertEquals(RPN.toGlitchURL('1 1 +', 'name'), 'glitch://name!1.1f')
  },
})
test({
  name: "RPN.fromGlitchURL('glitch://name!1.1f')",
  fn: function() {
    assertEquals(RPN.fromGlitchURL('glitch://name!1.1f'), ['name', '1 1 +'])
  },
})
test({
  name: "RPN.fromGlitchURL('glitch://name!1.1Ff')",
  fn: function() {
    assertEquals(RPN.fromGlitchURL('glitch://name!1.1Ff'), ['name', '1 31 +'])
  },
})
test({
  name: "RPN.desugar('(+ 1 1)')",
  fn: function() {
    assertEquals(RPN.desugar('(+ 1 1)'), '1 1 +')
  },
})
test({
  name: "RPN.desugar('(- 6 (* (+ 1 1) 2))')",
  fn: function() {
    assertEquals(RPN.desugar('(- 6 (* (+ 1 1) 2))'), '6 1 1 + 2 * -')
  },
})
test({
  name: "RPN.desugar('2 (+ 3 (* (- 4 2) (/ 12 3))) +')",
  fn: function() {
    assertEquals(
      RPN.desugar('2 (+ 3 (* (- 4 2) (/ 12 3))) +'),
      '2 3 4 2 - 12 3 / * + +'
    )
  },
})
test({
  name: "RPN.interpret('(- 6 (* (+ 1 1) 2))')",
  fn: function() {
    assertEquals(RPN.interpret('(- 6 (* (+ 1 1) 2))'), 2)
  },
})
test({
  name: 'RPN.glitchMachine loaded properly',
  fn: function() {
    assert(RPN.glitchMachine)
  },
})
test({
  name: "RPN.glitchInterpret('1 1 +')",
  fn: function() {
    assertEquals(RPN.glitchInterpret('1 1 +'), 2)
  },
})
test({
  name: "RPN.glitchInterpret('2 (+ 3 (* (- 4 2) (/ 12 3))) +')",
  fn: function() {
    const str = '2 (+ 3 (* (- 4 2) (/ 12 3))) +'
    assertEquals(RPN.glitchInterpret(str), RPN.interpret(str))
  },
})
test({
  name: "RPN.glitchInterpret('1 t +', 2) --> 3",
  fn: function() {
    assertEquals(RPN.glitchInterpret('1 t +', 2), 3)
  },
})
test({
  name: 'RPN.glitchInterpret(x) == RPN.interpret(x)',
  fn: function() {
    const cases = [
      { fn: '1 1 +', ans: 2, t: 0 },
      { fn: '1 t +', ans: 3, t: 2 },
      { fn: '(& (>> t 10) 42) t *', ans: 66, t: 20001 },
      { fn: 't 10 >> 42 & t *', ans: 104, t: 29901 },
      { fn: 't 3 *', ans: 9, t: 3 },
    ]
    for (const c of cases) {
      const a = RPN.glitchInterpret(c.fn, c.t, 'uint32')
      assertEquals(a, RPN.interpret(c.fn, c.t))
      assertEquals(a & 0xff, c.ans)
    }
  },
})

runIfMain(import.meta)
