export interface ContentSize {
  width: number
  height: number
}

const KANGAME_WIDTH = 1200
const KANGAME_HEIGHT = 720

export const calculateKangameContentSize = (
  innerWidth: number,
  zoom: number,
  yOffset: number,
): ContentSize => ({
  width: Math.round(innerWidth * zoom),
  height: Math.round(((innerWidth / KANGAME_WIDTH) * KANGAME_HEIGHT + yOffset) * zoom),
})

export const calculateCompensatedContentSize = (
  target: ContentSize,
  actual: ContentSize,
  requested: ContentSize,
  tolerance = 1,
): ContentSize | null => {
  const widthError = target.width - actual.width
  const heightError = target.height - actual.height
  if (Math.abs(widthError) <= tolerance && Math.abs(heightError) <= tolerance) {
    return null
  }
  return {
    width: Math.max(1, requested.width + widthError),
    height: Math.max(1, requested.height + heightError),
  }
}
