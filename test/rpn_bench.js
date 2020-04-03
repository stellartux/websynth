import { bench, runBenchmarks } from '../deps.ts'
import { evaluateBytebeat } from '../src/bytebeat-utils.js'
import { RPN } from '../src/rpn.js'
import * as RPNWASM from '../src/rpn.wasm'
RPN.glitchMachine = RPNWASM
RPN.glitchInterpret('1')
const f = evaluateBytebeat('((t >> 10) & 42) * t')
const fRPN = '(& (>> t 10) 42) t *'
const fWasm = await WebAssembly.instantiate(RPN.toWasmBinary(fRPN))

bench({
  name: 'RPN.interpret() - 1s of 128-sample buffers',
  runs: 345,
  func: b => {
    b.start()
    for (let t = 0; t < 128; t++) {
      RPN.interpret(fRPN, t)
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
      RPN.glitchInterpret(fRPN, t)
    }
    b.stop()
  },
})
bench({
  name: "RPN.toWasmBinary() - 1s of 128-sample buffers",
  runs: 345,
  func: b => {
    b.start()
    for (let t = 0; t < 128; t++) {
      fWasm.instance.exports.bytebeat(t)
    }
    b.stop()
  }
})
bench({
  name: 'equivalent JS code - 1s of 128-sample buffers',
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
      RPN.interpret(fRPN, t)
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
      RPN.glitchInterpret(fRPN, t)
    }
    b.stop()
  },
})
bench({
  name: "RPN.toWasmBinary() - 44100 samples",
  runs: 1,
  func: b => {
    b.start()
    for (let t = 0; t < 44100; t++) {
      fWasm.instance.exports.bytebeat(t)
    }
    b.stop()
  }
})
bench({
  name: 'equivalent JS code - 44100 samples',
  runs: 1,
  func: b => {
    b.start()
    for (let t = 0; t < 44100; t++) {
      f(t)
    }
    b.stop()
  },
})

if (import.meta.main) runBenchmarks()
