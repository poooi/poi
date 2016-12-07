#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const CSON = require('cson')

function build_map(dest) {
  fs.writeFileSync(
    path.join(dest, 'mapspot.json'),
    JSON.stringify(CSON.load('./mapspot.cson'))
  )
  fs.writeFileSync(
    path.join(dest, 'maproute.json'),
    JSON.stringify(CSON.load('./maproute.cson'))
  )
}

function build() {
  const dest = './build'
  try {
    fs.mkdirSync(dest)
  }
  catch (err) {
    if (err.code != 'EEXIST')
      console.error(err.stack)
  }

  build_map(dest)
}

build()