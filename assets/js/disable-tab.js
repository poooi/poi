// MAIN WORLD
// Run in the page's main world (matching the pre-contextIsolation behaviour where the
// preload shared the page's world). Serialized via `contextBridge.executeInMainWorld`;
// keep it self-contained (globals only).
function installDisableTab() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (!['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e?.target?.tagName)) {
        e.preventDefault()
      } else if (
        e?.target?.baseURI?.includes('kancolle-server') ||
        e?.target?.baseURI?.includes('kcsapi')
      ) {
        e.preventDefault()
      }
    }
  })
}

module.exports = { installDisableTab }
