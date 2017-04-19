import EventEmitter from 'events'

export class devicePixelRatioDetector extends EventEmitter {
  constructor() {
    super()
    const { devicePixelRatio } = window
    this.matchMediaMin = window.matchMedia(`screen and (min-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMax = window.matchMedia(`screen and (max-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMin.addListener(this.callback)
    this.matchMediaMax.addListener(this.callback)
  }
  callback = e => {
    this.matchMediaMin.removeListener(this.callback)
    this.matchMediaMax.removeListener(this.callback)
    const { devicePixelRatio } = window
    this.matchMediaMin = window.matchMedia(`screen and (min-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMax = window.matchMedia(`screen and (max-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMin.addListener(this.callback)
    this.matchMediaMax.addListener(this.callback)
    this.emit('change', devicePixelRatio)
  }
}
