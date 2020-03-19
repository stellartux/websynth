export * from 'https://deno.land/std/testing/asserts.ts'
export function runIfMain(meta) {
  if (meta.main) Deno.runTests()
}
