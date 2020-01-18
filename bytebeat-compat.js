;(() => {
  let n = document.createElement('script')
  n.setAttribute(
    'src',
    window.AudioWorkletNode ? 'bytebeat.js' : 'bytebeat-noworklets.js'
  )
  document.head.replaceChild(n, document.currentScript)
})()
