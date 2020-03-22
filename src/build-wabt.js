import { WabtModule } from '../ext/libwabt.min.js'

const wabt = WabtModule()

/**
 * @param {string} code wat code to be parsed
 * @param {boolean} [log=false]
 * @returns {object} instance, module, log
 **/
export async function buildWabt(code, log = false) {
  if (typeof code !== 'string' || code === '') {
    throw Error('Bad value passed to buildWabt')
  }
  const blob = wabt.parseWat('', code, ['multi_value', 'tail_call'])
  blob.resolveNames()
  blob.validate()
  log = Boolean(log)
  const bin = blob.toBinary({ log, write_debug_names: log })
  const value = await WebAssembly.instantiate(bin.buffer)
  if (log) value.log = bin.log
  return value
}
