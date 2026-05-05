import EventEmitter from 'events'

export class devicePixelRatioDetector extends EventEmitter {
  private matchMediaMin: MediaQueryList
  private matchMediaMax: MediaQueryList

  constructor() {
    super()
    this.matchMediaMin = window.matchMedia(`screen and (min-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMax = window.matchMedia(`screen and (max-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMin.addEventListener('change', this.callback)
    this.matchMediaMax.addEventListener('change', this.callback)
  }

  callback = (_e: MediaQueryListEvent): void => {
    this.matchMediaMin.removeEventListener('change', this.callback)
    this.matchMediaMax.removeEventListener('change', this.callback)
    this.matchMediaMin = window.matchMedia(`screen and (min-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMax = window.matchMedia(`screen and (max-resolution: ${devicePixelRatio}dppx)`)
    this.matchMediaMin.addEventListener('change', this.callback)
    this.matchMediaMax.addEventListener('change', this.callback)
    this.emit('change', devicePixelRatio)
  }
}
