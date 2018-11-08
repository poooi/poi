const glob = require('glob')
const matter = require('gray-matter')
const Promise = require('bluebird')
const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')
const assert = require('assert').strict

const main = async () => {
  const data = {}

  await Promise.map(glob.sync(path.resolve(__dirname, '**/*.md')), async (file) => {
    const text = await fs.readFile(file, 'utf8')

    const { content, data: { namespace, language, key } } = matter(text)
    _.each([content, namespace, language, key], v => assert(v))
    _.set(data, [`${namespace}/${language}`, key], content)
  })

  await Promise.each(Object.keys(data), async (nl) => {
    const file = path.resolve(__dirname, `../i18n/${nl}.json`)
    const content = await fs.readJSON(file)
    return fs.writeJSON(file, {...content, ...data[nl]}, { spaces: 2 })
  })
}

main()
