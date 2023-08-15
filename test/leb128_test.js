import { assertEquals } from '../deps.ts'
import { LEB128 } from '../src/leb128.js'

Deno.test({
  name: 'new LEB128(624485)',
  fn: function () {
    assertEquals([...new LEB128(624485)], [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: 'new LEB128(624485n)',
  fn: function () {
    assertEquals([...new LEB128(624485n)], [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: "new LEB128('624485')",
  fn: function () {
    assertEquals([...new LEB128('624485')], [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: "new LEB128('0x98765')",
  fn: function () {
    assertEquals([...new LEB128('0x98765')], [0xe5, 0x8e, 0x26])
  },
})
Deno.test({
  name: 'LEB128.toInt32([0xe5, 0x8e, 0x26])',
  fn: function () {
    assertEquals(new LEB128(624485).valueOf(), 624485n)
  },
})
Deno.test({
  name: 'LEB128.toInt32(new LEB128(-98765))',
  fn: function () {
    assertEquals(new LEB128(-98765).valueOf(), -98765n)
  },
})
Deno.test({
  name: 'LEB128.toBigInt([0xe5, 0x8e, 0x26])',
  fn: function () {
    assertEquals(new LEB128(624485n).valueOf(), 624485n)
  },
})

if (import.meta.main) Deno.runTests()
