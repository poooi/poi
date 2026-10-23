// Pure helpers for the OOI login page. The injected page script must stay
// self-contained: fillOoiForm / readOoiForm cannot call other module bindings.

function setInputValue(el, value) {
  const proto =
    typeof HTMLInputElement === 'function'
      ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
      : null
  if (proto && proto.set) proto.set.call(el, value)
  else el.value = value
  if (typeof Event !== 'function' || typeof el.dispatchEvent !== 'function') return
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function query(root, selectors) {
  for (let i = 0; i < selectors.length; i += 1) {
    const el = root.querySelector(selectors[i])
    if (el) return el
  }
  return null
}

function fillOoiForm(doc, loginId, password, selectPoiMode) {
  const root = doc.querySelector('#ooi-form')
  if (!root) return 'no-form'
  const idEl = query(root, ['#login_id', 'input[name="login_id"]'])
  const pwEl = query(root, ['#password', 'input[name="password"]'])
  if (!idEl || !pwEl) return 'no-fields'
  if (root.dataset.ooiAutofillApplied === '1') return 'already'
  if (loginId && !idEl.value) setInputValue(idEl, loginId)
  if (password && !pwEl.value) setInputValue(pwEl, password)
  if (selectPoiMode) {
    const mode = query(root, ['#mode3', 'input[name="mode"][value="3"]'])
    if (mode && !mode.checked && typeof mode.click === 'function') mode.click()
  }
  root.dataset.ooiAutofillApplied = '1'
  return 'filled'
}

function readOoiForm(doc) {
  const roots = []
  if (doc) roots.push(doc)
  const marked = doc && typeof doc.querySelector === 'function' ? doc.querySelector('#ooi-form') : null
  if (marked) roots.push(marked)
  const frames =
    doc && typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll('iframe,frame') : []
  for (let i = 0; i < frames.length; i += 1) {
    try {
      if (frames[i].contentDocument) roots.push(frames[i].contentDocument)
    } catch (_e) {
      // Cross-origin frames are searched from the host instead.
    }
  }
  for (let i = 0; i < roots.length; i += 1) {
    const root = roots[i]
    const idEl = query(root, ['#login_id', 'input[name="login_id"]', 'input[type="email"]'])
    const pwEl = query(root, ['#password', 'input[name="password"]', 'input[type="password"]'])
    if (!idEl || !pwEl) continue
    return {
      found: true,
      loginId: idEl.value || '',
      password: pwEl.value || '',
      href: (root.location && root.location.href) || (doc.location && doc.location.href) || '',
    }
  }
  return {
    found: false,
    loginId: '',
    password: '',
    href: (doc && doc.location && doc.location.href) || '',
  }
}

function normalizeHostEntry(entry) {
  const trimmed = String(entry || '')
    .trim()
    .toLowerCase()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`
    return new URL(withProto).host
  } catch (_e) {
    return trimmed.split('/')[0]
  }
}

function parseHosts(text) {
  return String(text || '')
    .split(/[\s,;]+/)
    .map(normalizeHostEntry)
    .filter(Boolean)
}

function hostAllowed(url, hostsText) {
  const allowed = parseHosts(hostsText)
  if (allowed.length === 0) return false
  let parsed
  try {
    parsed = new URL(url)
  } catch (_e) {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  return allowed.includes(parsed.host.toLowerCase())
}

function buildFillCall(loginId, password, selectPoiMode) {
  return `(function(loginId,password,selectPoiMode){${setInputValue.toString()};${query.toString()};${fillOoiForm.toString()};return fillOoiForm(document,loginId,password,selectPoiMode);})(${JSON.stringify(
    loginId,
  )},${JSON.stringify(password)},${JSON.stringify(!!selectPoiMode)})`
}

function buildReadCall() {
  return `(function(){${query.toString()};${readOoiForm.toString()};return JSON.stringify(readOoiForm(document));})()`
}

module.exports = {
  buildFillCall,
  buildReadCall,
  fillOoiForm,
  hostAllowed,
  parseHosts,
  readOoiForm,
}
