/** Easy way of checking whether a bytebeat code is valid
 * @param {string} bytebeat
 * @return {boolean} Whether the string represents a valid bytebeat code
 */
export function validateBytebeat(bytebeat) {
  try {
    const beatcode = evaluateBytebeat(bytebeat)
    if (typeof beatcode() !== 'number') {
      return false
    }
    return true
  } catch (e) {
    return false
  }
}
/**
 * @param {string} bytebeat
 * @returns {function}
 */
export function evaluateBytebeat(bytebeat) {
  return new Function(
    't = 0',
    'tt = 0',
    `'strict mode';const {abs,floor,round,sqrt,ceil,sin,cos,tan,sinh,cosh,tanh,
      asin,acos,asinh,acosh,atan,atanh,atan2,cbrt,sign,trunc,log,exp,min,max,
      pow,E,LN2,LN10,LOG10E,PI,SQRT1_2,SQRT2,random} = Math
      const int=(x,i=0)=>typeof(x)==='number'?floor(x):x.charCodeAt(i)
      return (${bytebeat})`
  )
}
