import { OnSendHeadersListenerDetails } from 'electron'
import { URL } from 'url'
import { PNG } from 'pngjs'
import { entries } from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import util from 'util'
import { pipeline } from 'stream'
import { map as pMap } from 'bluebird'

import { ResourceNotifier } from './resource-notifier'

export interface ImageInfo {
  frames: Frames
  meta: Meta
}

export interface Frames {
  [key: string]: Frame
}

export interface Frame {
  frame: PosSize
  rotated: boolean
  trimmed: boolean
  spriteSourceSize: PosSize
  sourceSize: Size
}

export interface PosSize {
  x: number
  y: number
  w: number
  h: number
}

export interface Size {
  w: number
  h: number
}

export interface Meta {
  app: string
  image: string
  format: string
  size: Size
  scale: number
}

const ASSETS_PATH = path.resolve(window.APPDATA_PATH, 'game-assets')

const createPNG = (source: ArrayBuffer): Promise<PNG> =>
  new Promise((resolve, reject) => {
    new PNG().parse(new Buffer(source), (error, data) => {
      if (error) {
        reject()
      }
      resolve(data)
    })
  })

const fetchJson = async (path: string): Promise<ImageInfo> => {
  const resp = await fetch(path)
  return resp.json()
}

const fetchPNG = async (path: string) => {
  const resp = await fetch(path)
  const buf = await resp.arrayBuffer()
  return createPNG(buf)
}

const pipelineAsync = util.promisify(pipeline)

const savePNG = async (file: PNG, filePath: string) => {
  pipelineAsync(file.pack(), fs.createWriteStream(filePath))
}

ResourceNotifier.on('request', async (detail: OnSendHeadersListenerDetails) => {
  const url = new URL(detail.url)
  const { pathname, searchParams } = url

  if (pathname === '/kcs2/img/title/title_main.json') {
    url.pathname = '/kcs2/img/common/common_icon_weapon.json'
    console.log(searchParams.get('version'))
    try {
      const [info, image] = await Promise.all([
        fetchJson(url.toString()),
        fetchPNG(url.toString().replace('.json', '.png')),
        fs.ensureDir(path.resolve(ASSETS_PATH, 'slotitem')),
      ])

      await pMap(
        entries(info.frames),
        async ([fileName, file]) => {
          const { x, y, w, h } = file.frame

          const dest = new PNG({ width: w, height: h })

          image.bitblt(dest, x, y, w, h)

          const number = /\d+/.exec(fileName)?.[0] || 0

          await savePNG(dest, path.resolve(ASSETS_PATH, 'slotitem', `${number}.png`))
        },
        { concurrency: 2 },
      )
    } catch (e) {
      console.error(e)
    }
  }
})
