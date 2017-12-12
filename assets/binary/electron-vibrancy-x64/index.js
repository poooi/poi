const MODULE_NAME = process.arch === 'x64' ? 'Vibrancy-x64' : 'Vibrancy-ia32'

const Vibrancy = require('bindings')(MODULE_NAME)

module.exports = require('bindings')(MODULE_NAME)

function AddView(buffer,options) {
  const viewOptions = {
    Material: options.Material,
    Position: { x: options.X, y: options.Y},
    Size: { width: options.Width, height: options.Height},
    ResizeMask: options.ResizeMask,
  }
  return Vibrancy.AddView(buffer,viewOptions)
}

function RemoveView(buffer,viewId) {
  const viewOptions = { ViewId: (viewId) }
  return Vibrancy.RemoveView(buffer, viewOptions)
}

function UpdateView(buffer,options) {
  const viewOptions = {
    Material: options.Material,
    Position: { x: options.X, y: options.Y},
    Size: { width: options.Width, height: options.Height},
    ViewId: options.ViewId,
  }
  return Vibrancy.UpdateView(buffer,viewOptions)
}

function DisableVibrancy(buffer) {
  Vibrancy.SetVibrancy(false,buffer)
}

module.exports = {
  SetVibrancy: function(window,material) {
    if(window == null)
      return -1

    const width = window.getSize()[0]
    const height = window.getSize()[1]

    if(material === null || typeof material === 'undefined')
      material = 0

    const resizeMask = 2 //auto resize on both axis

    const viewOptions = {
      Material: material,
      Width: width,
      Height: height,
      X: 0,
      Y:0,
      ResizeMask: resizeMask,
    }

    return AddView(window.getNativeWindowHandle(),viewOptions)
  },
  AddView: function(window,options) {
    return AddView(window.getNativeWindowHandle(),options)
  },
  UpdateView: function(window,options) {
    return UpdateView(window.getNativeWindowHandle(),options)
  },
  RemoveView: function(window,viewId) {
    return RemoveView(window.getNativeWindowHandle(),viewId)
  },
  DisableVibrancy: function(window) {
    return DisableVibrancy(window.getNativeWindowHandle())
  },
}
