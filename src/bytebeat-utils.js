/** A shared utility namespace for both the worklet and nonworklet based BytebeatNotes.
 * @namespace BytebeatUtils
 */
export class BytebeatUtils {
  constructor() {
    throw Error('BytebeatUtils is not a constructor')
  }

  static wrapFunction(f) {
    return `const {abs,floor,round,sqrt,ceil,sin,cos,tan,sinh,cosh,tanh,
        asin,acos,asinh,acosh,atan,atanh,atan2,cbrt,sign,trunc,log,exp,
        min,max,pow,E,LN2,LN10,LOG10E,PI,SQRT1_2,SQRT2,random} = Math
      const int=(x,i=0)=>typeof(x)==='number'?floor(x):x.charCodeAt(i)
      return (${f})`
  }

  /** Easy way of checking whether a bytebeat code is valid
   * @param {string} bytebeat
   * @return {boolean} Whether the string represents a valid bytebeat code
   */
  static validateBytebeat(bytebeat) {
    try {
      BytebeatUtils.evaluateBytebeat(bytebeat)
      return true
    } catch (e) {
      return false
    }
  }
  /**
   * @param {string} bytebeat
   * @returns {function}
   */
  static evaluateBytebeat(bytebeat) {
    const beatcode = new Function('t=0,tt=0', BytebeatUtils.wrapFunction(bytebeat))
    if (typeof beatcode !== 'function') {
      throw new SyntaxError('Bytebeat function definition must be a function')
    } else if (typeof beatcode(0) !== 'number') {
      throw new TypeError('Bytebeat function must return a number')
    }
    return beatcode
  }

  static forceNum(value) {
    return typeof value === 'number' ? value : 0
  }
}
