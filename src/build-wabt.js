// @ts-nocheck
import { WabtModule } from '../ext/libwabt.min.js'

const wabt = WabtModule()
const features = ['multi_value', 'tail_call']
/**
 * @param {string} code wat code to be parsed
 * @param {object} options
 * @param {boolean} [options.log=false] whether a log file should be returned
 * @param {boolean} [options.objectURL=false] whether to return an ObjectURL to the module binary
 * @returns {object} instance, module, [log], [objectURL]
 **/
export async function buildWabt(code, options = {}) {
  if (typeof code !== 'string' || code === '') {
    throw Error('Bad value passed to buildWabt')
  }
  const mod = wabt.parseWat('', code, features)
  mod.resolveNames()
  mod.validate(features)
  const log = Boolean(options.log)
  const bin = mod.toBinary({ log, write_debug_names: log })
  const value = await WebAssembly.instantiate(bin.buffer)
  if (log) value.log = bin.log
  if (options.objectURL)
    value.objectURL = URL.createObjectURL(new Blob([mod.buffer]))
  return value
}
