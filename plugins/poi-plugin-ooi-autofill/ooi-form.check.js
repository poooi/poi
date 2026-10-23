const assert = require('node:assert/strict')
const test = require('node:test')
const vm = require('node:vm')

const { buildFillCall, buildReadCall, fillOoiForm, hostAllowed, readOoiForm } = require('./ooi-form')

const field = (value) => ({
  value,
  checked: false,
  dataset: {},
  click() {
    this.checked = true
  },
  dispatchEvent() {},
})

const page = (overrides = {}) => {
  const idEl = field(overrides.loginId || '')
  const pwEl = field(overrides.password || '')
  const mode = field('')
  mode.checked = !!overrides.modeChecked
  const root = {
    dataset: {},
    querySelector(sel) {
      if (sel === '#login_id' || sel === 'input[name="login_id"]') return idEl
      if (sel === '#password' || sel === 'input[name="password"]') return pwEl
      if (sel === '#mode3' || sel === 'input[name="mode"][value="3"]') return mode
      return null
    },
  }
  const doc = {
    querySelector(sel) {
      return sel === '#ooi-form' ? root : null
    },
  }
  return { doc, idEl, pwEl, mode, root }
}

test('fills empty OOI fields and selects poi mode once', () => {
  const { doc, idEl, pwEl, mode, root } = page()
  assert.equal(fillOoiForm(doc, 'user@example.com', 'secret', true), 'filled')
  assert.equal(idEl.value, 'user@example.com')
  assert.equal(pwEl.value, 'secret')
  assert.equal(mode.checked, true)
  assert.equal(root.dataset.ooiAutofillApplied, '1')
  idEl.value = ''
  assert.equal(fillOoiForm(doc, 'user@example.com', 'secret', true), 'already')
  assert.equal(idEl.value, '')
})

test('does not overwrite a value the user already typed', () => {
  const { doc, idEl, pwEl } = page({ loginId: 'typed', password: 'kept' })
  fillOoiForm(doc, 'saved', 'other', false)
  assert.equal(idEl.value, 'typed')
  assert.equal(pwEl.value, 'kept')
})

test('ignores pages without the OOI form', () => {
  assert.equal(fillOoiForm({ querySelector: () => null }, 'a', 'b', true), 'no-form')
  assert.equal(readOoiForm({ querySelector: () => null, location: { href: 'https://ooi.moe/' } }).found, false)
})

test('reads the current OOI form', () => {
  const { doc } = page({ loginId: 'ooi-user', password: 'ooi-pass' })
  const read = readOoiForm(doc)
  assert.equal(read.found, true)
  assert.equal(read.loginId, 'ooi-user')
  assert.equal(read.password, 'ooi-pass')
})

test('host allowlist is exact and required', () => {
  assert.equal(hostAllowed('https://ooi.example.com/', ''), false)
  assert.equal(hostAllowed('https://ooi.example.com/login', 'ooi.example.com'), true)
  assert.equal(hostAllowed('https://evil.example.com/', 'ooi.example.com'), false)
  assert.equal(hostAllowed('https://ooi.example.com.evil/', 'ooi.example.com'), false)
  assert.equal(hostAllowed('https://127.0.0.1:8080/', 'http://127.0.0.1:8080/login'), true)
  assert.equal(hostAllowed('file:///tmp/ooi.html', 'ooi.example.com'), false)
  assert.equal(hostAllowed('https://not-a.test/', 'a.test b.test'), false)
  assert.equal(hostAllowed('https://b.test/', 'a.test, b.test'), true)
})

test('injected script keeps credentials quoted and only touches an OOI form', () => {
  const loginId = 'user\\"@example.com'
  const password = "p`ass${word}'"
  const context = page()
  context.document = context.doc
  const filled = vm.runInNewContext(buildFillCall(loginId, password, true), context)
  assert.equal(filled, 'filled')
  assert.equal(context.idEl.value, loginId)
  assert.equal(context.pwEl.value, password)
  const read = JSON.parse(vm.runInNewContext(buildReadCall(), context))
  assert.equal(read.found, true)
  assert.equal(read.loginId, loginId)
  assert.equal(read.password, password)
  const other = { document: { querySelector: () => null } }
  assert.equal(vm.runInNewContext(buildFillCall(loginId, password, true), other), 'no-form')
})
