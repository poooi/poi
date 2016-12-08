#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const CSON = require('cson')

function build_map(dest) {
  fs.writeFileSync(
    path.join(dest, 'mapspot.json'),
    JSON.stringify(CSON.load('mapspot.cson')) + '\n'
  )
  fs.writeFileSync(
    path.join(dest, 'maproute.json'),
    JSON.stringify(CSON.load('maproute.cson')) + '\n'
  )
  fs.writeFileSync(
    path.join(dest, 'maphp.json'),
    JSON.stringify(CSON.load('maphp.cson')) + '\n'
  )
  fs.writeFileSync(
    path.join(dest, 'shiptag.json'),
    JSON.stringify(CSON.load('shiptag.cson')) + '\n'
  )
}

function build_meta(dest) {
  const meta = []
  for (const fpath of fs.walkSync(dest)) {
    const fdata = JSON.parse(fs.readFileSync(fpath))
    meta.push(fdata.meta)
  }
  fs.writeFileSync(
    path.join(dest, 'meta.json'),
    JSON.stringify(meta) + '\n'
  )
}

function build() {
  const dest = '../assets/data/fcd'

  // Remove old
  fs.emptyDirSync(dest)

  // Build JSON
  build_map(dest)

  // Build meta
  build_meta(dest)
}

build()
