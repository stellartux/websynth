/**
 * Quicksave a page to LocalStorage
 * @param {string} [selector='*:not(.hidden) [class^="qs"]:not(.hidden)']
 * @param {ParentNode} [parent=document] 
 */
export function save(
  selector = '*:not(.hidden) [class^="qs"]:not(.hidden)',
  parent = document
) {
  window.localStorage[
    location.host + location.pathname
  ] = JSON.stringify(
    Array.from(parent.querySelectorAll(selector))
      .filter(l => !!l.id)
      .map(l => ({ id: l.id, value: l.value })))
}

/**
 * Load LocalStorage data to the DOM
 */
export function load() {
  JSON.parse(window.localStorage[location.host + location.pathname])
    .forEach(l => (document.getElementById(l.id).value = l.value))
}
