const Application = require('spectron').Application
const assert = require('assert')
let electronPath = require('electron')

describe('application launch', function () {
  this.timeout(60000)

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: ['index.js']
    })
    return this.app.start()
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 2)
    })
  })
})
