export * from 'https://deno.land/std/testing/asserts.ts'
export { bench, runBenchmarks } from 'https://deno.land/std/testing/bench.ts'
export function runIfMain(meta: any): void {
  if (meta.main) Deno.runTests()
}
