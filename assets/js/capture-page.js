window.capture = async function () {
  try {
    const canvas = document.querySelector('#game_frame')
      ? document
          .querySelector('#game_frame')
          .contentDocument.querySelector('#htmlWrap')
          .contentDocument.querySelector('canvas')
      : document.querySelector('#htmlWrap')
        ? document.querySelector('#htmlWrap').contentDocument.querySelector('canvas')
        : document.querySelector('canvas')
          ? document.querySelector('canvas')
          : null
    if (!canvas || !ImageCapture) return undefined
    const imageCapture = new ImageCapture(canvas.captureStream(0).getVideoTracks()[0])
    const imageBitmap = await imageCapture.grabFrame()
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageBitmap.width
    tempCanvas.height = imageBitmap.height
    tempCanvas.getContext('2d').drawImage(imageBitmap, 0, 0)
    return tempCanvas.toDataURL()
  } catch (e) {
    console.error(e)
    return undefined
  }
}
