import { bench } from 'https://deno.land/std/testing/bench.ts'
import { BytebeatUtils } from '../src/bytebeat-utils.js'
import { RPN } from '../src/rpn.js'
import * as RPNWASM from '../src/rpn.wasm'
RPN.glitchMachine = RPNWASM
RPN.glitchInterpret('1')
const f = BytebeatUtils.evaluateBytebeat('((t >> 10) & 42) * t')

bench({
  name: 'RPN.interpret() - 1s of 128-sample buffers',
  runs: 345,
  func: b => {
    b.start()
    for (let t = 0; t < 128; t++) {
      RPN.interpret('(& (>> t 10) 42) t *', t)
    }
    b.stop()
  },
})
bench({
  name: 'RPN.glitchInterpret() - 1s of 128-sample buffers',
  runs: 345,
  func: b => {
    b.start()
    for (let t = 0; t < 128; t++) {
      RPN.glitchInterpret('(& (>> t 10) 42) t *', t)
    }
    b.stop()
  },
})
bench({
  name: 'equivalent JS code',
  runs: 345,
  func: b => {
    b.start()
    for (let t = 0; t < 128; t++) {
      f(t)
    }
    b.stop()
  },
})

bench({
  name: 'RPN.interpret() - 44100 samples',
  runs: 1,
  func: b => {
    b.start()
    for (let t = 0; t < 44100; t++) {
      RPN.interpret('(& (>> t 10) 42) t *', t)
    }
    b.stop()
  },
})
bench({
  name: 'RPN.glitchInterpret() - 44100 samples',
  runs: 1,
  func: b => {
    b.start()
    for (let t = 0; t < 44100; t++) {
      RPN.glitchInterpret('(& (>> t 10) 42) t *', t)
    }
    b.stop()
  },
})
bench({
  name: 'equivalent JS code',
  runs: 1,
  func: b => {
    b.start()
    for (let t = 0; t < 44100; t++) {
      f(t)
    }
    b.stop()
  },
})

if (import.meta.main) Deno.runTests()
