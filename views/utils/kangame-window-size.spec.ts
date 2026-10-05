import { calculateCompensatedContentSize, calculateKangameContentSize } from './kangame-window-size'

describe('kangame window sizing', () => {
  it('includes the titlebar offset in the desired content size', () => {
    expect(calculateKangameContentSize(1200, 1, 60)).toEqual({
      width: 1200,
      height: 780,
    })
  })

  it('applies the renderer zoom to the full content size', () => {
    expect(calculateKangameContentSize(600, 2, 60)).toEqual({
      width: 1200,
      height: 840,
    })
  })

  it('compensates from the fixed target instead of shrinking it', () => {
    expect(
      calculateCompensatedContentSize(
        { width: 1200, height: 780 },
        { width: 1184, height: 772 },
        { width: 1200, height: 780 },
      ),
    ).toEqual({ width: 1216, height: 788 })
  })

  it('stops when the measured size is within one DIP of the target', () => {
    expect(
      calculateCompensatedContentSize(
        { width: 1200, height: 780 },
        { width: 1199, height: 781 },
        { width: 1216, height: 788 },
      ),
    ).toBeNull()
  })
})
