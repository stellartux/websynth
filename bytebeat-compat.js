let newsrc = document.createElement('script')
newsrc.setAttribute('src', window.AudioWorkletNode ? 'bytebeat.js' : 'bytebeat-noworklets.js')

document.head.replaceChild(newsrc,
  document.head.querySelector('[src="bytebeat-compat.js"]'))
