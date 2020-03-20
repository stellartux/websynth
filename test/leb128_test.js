import {
  assert,
  assertEquals,
} from 'https://deno.land/std@v0.36.0/testing/asserts.ts'
import { LEB128 } from '../src/leb128.js'

const randInt = (max, min = 0) => Math.floor(Math.random() * (max - min)) + min

Deno.test({
  name: 'new LEB128(624485)',
  fn: function() {
    assertEquals(new LEB128(624485), [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: 'new LEB128(624485n)',
  fn: function() {
    assertEquals(new LEB128(624485n), [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: "new LEB128('624485')",
  fn: function() {
    assertEquals(new LEB128('624485'), [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: "new LEB128('0x98765')",
  fn: function() {
    assertEquals(new LEB128('0x98765'), [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: 'LEB128.toInt32([0xe5, 0x8e, 0x26])',
  fn: function() {
    assertEquals(LEB128.toInt32([0xe5, 0x8e, 0x26]), 624485)
  },
})
Deno.test({
  name: 'LEB128.toInt32(new LEB128(-98765))',
  fn: function() {
    assertEquals(LEB128.toInt32(new LEB128(-98765)), -98765)
  },
})
Deno.test({
  name: 'LEB128.toBigInt(new LEB128(-98765n))',
  fn: function() {
    const n = LEB128.toBigInt(new LEB128(-98765n))
    assertEquals(n, -98765n)
  },
})
Deno.test({
  name: 'LEB128.toBigInt([0xe5, 0x8e, 0x26])',
  fn: function() {
    assertEquals(
      LEB128.toBigInt([0xe5, 0x8e, 0x26]),
      624485n,
      `expected ${LEB128.toBigInt([0xe5, 0x8e, 0x26])} to equal 624485n`
    )
  },
})
Deno.test({
  name:
    'LEB128.toInt32 == LEB128.toBigInt for -256:16:255 and some random values',
  fn: function() {
    for (let i = -256; i < 256; i += 16) {
      const v = new LEB128(i)
      const big = LEB128.toBigInt(v)
      // weak comparison to compare Numbers and BigInts
      assert(i == big, `expected ${i} to equal ${big}`)
    }
    for (let i = 0; i < 16; i++) {
      const n = randInt(1 << 32, -(1 << 32))
      const v = LEB128.toInt32(new LEB128(n))
      assertEquals(n, v, `expected ${n} to equal ${v}`)
    }
  },
})

if (import.meta.main) Deno.runTests()
