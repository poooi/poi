// MAIN WORLD
// Run in the page's main world. Serialized via `contextBridge.executeInMainWorld`;
// keep it self-contained (globals only).
//
// Electron advertises WebAuthn conditional mediation (passkey autofill) but does not honour
// `mediation: 'conditional'`: on Windows the login page's silent passkey probe opens the native
// "Sign in with your passkey" dialog instead, which reopens every time it is cancelled.
// Reporting conditional mediation as unavailable stops pages from probing, while an explicit
// passkey sign-in still works.
// https://github.com/electron/electron/issues/41472
function installDisablePasskeyAutofill() {
  const PKC = window.PublicKeyCredential
  if (typeof PKC !== 'function') {
    return
  }
  if (typeof PKC.isConditionalMediationAvailable === 'function') {
    PKC.isConditionalMediationAvailable = () => Promise.resolve(false)
  }
  if (typeof PKC.getClientCapabilities === 'function') {
    const getClientCapabilities = PKC.getClientCapabilities
    PKC.getClientCapabilities = function (...args) {
      return getClientCapabilities
        .apply(this, args)
        .then((capabilities) => ({ ...capabilities, conditionalGet: false }))
    }
  }
}

module.exports = { installDisablePasskeyAutofill }
