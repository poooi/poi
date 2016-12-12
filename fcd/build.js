#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const CSON = require('cson')

const DEST = '../assets/data/fcd'

function writeJSON(filename, data) {
  const JSON_OPTIONS = { spaces: '' }
  fs.writeJSONSync(path.join(DEST, filename), data, JSON_OPTIONS)
}

// If build can write in one line, put it here.
function build_misc() {
  writeJSON('mapspot.json', CSON.load('mapspot.cson'))
  writeJSON('maproute.json', CSON.load('maproute.cson'))
  writeJSON('maphp.json', CSON.load('maphp.cson'))
  writeJSON('shiptag.json', CSON.load('shiptag.cson'))
}

function build_meta() {
  const meta = []
  for (const fpath of fs.walkSync(DEST)) {
    const fdata = JSON.parse(fs.readFileSync(fpath))
    meta.push(fdata.meta)
  }
  writeJSON('meta.json', meta)
}

function build() {
  fs.emptyDirSync(DEST)

  build_misc()
  build_meta()
}

build()
