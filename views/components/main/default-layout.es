import { get, pick, isEqual, entries, fromPairs, map } from 'lodash'

const defaultLayout = {
  sm: [
    {
      w: 10,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 10,
      maxH: 50,
      i: "teitoku-panel",
    },
    {
      w: 5,
      h: 7,
      x: 0,
      y: 3,
      minW: 1,
      minH: 3,
      maxW: 10,
      maxH: 50,
      i: "resource-panel",
    },
    {
      w: 5,
      h: 25,
      x: 0,
      y: 10,
      minW: 3,
      minH: 9,
      maxW: 10,
      maxH: 50,
      i: "miniship",
    },
    {
      w: 5,
      h: 12,
      x: 5,
      y: 3,
      minW: 3,
      minH: 6,
      maxW: 10,
      maxH: 50,
      i: "combined-panels",
    },
    {
      w: 5,
      h: 7,
      x: 5,
      y: 15,
      minW: 3,
      minH: 5,
      maxW: 10,
      maxH: 50,
      i: "expedition-panel",
    },
    {
      w: 5,
      h: 13,
      x: 5,
      y: 23,
      minW: 3,
      minH: 5,
      maxW: 10,
      maxH: 50,
      i: "task-panel",
    },
  ],
  lg: [
    {
      w: 12,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 20,
      maxH: 50,
      i: "teitoku-panel",
    },
    {
      w: 6,
      h: 8,
      x: 0,
      y: 3,
      minW: 1,
      minH: 3,
      maxW: 20,
      maxH: 50,
      i: "resource-panel",
    },
    {
      w: 8,
      h: 25,
      x: 12,
      y: 0,
      minW: 3,
      minH: 9,
      maxW: 20,
      maxH: 50,
      i: "miniship",
    },
    {
      w: 6,
      h: 14,
      x: 6,
      y: 11,
      minW: 3,
      minH: 6,
      maxW: 20,
      maxH: 50,
      i: "combined-panels",
    },
    {
      w: 6,
      h: 8,
      x: 6,
      y: 3,
      minW: 3,
      minH: 5,
      maxW: 20,
      maxH: 50,
      i: "expedition-panel",
    },
    {
      w: 6,
      h: 14,
      x: 0,
      y: 11,
      minW: 3,
      minH: 5,
      maxW: 20,
      maxH: 50,
      i: "task-panel",
    },
  ],
}

// Override maxsize
const configLayout = window.config.get('poi.mainpanel.layout')
const keys = ['minW', 'maxW', 'minH', 'maxH']
const newLayout = fromPairs(map(entries(defaultLayout), ([bp, conf]) => ([
  bp,
  map(conf, (panelConf, i) => ({
    ...get(configLayout, [bp, i], panelConf),
    ...pick(panelConf, keys),
  })),
])))

if (!isEqual(newLayout, configLayout)) {
  window.config.set('poi.mainpanel.layout', newLayout)
}

export default defaultLayout
