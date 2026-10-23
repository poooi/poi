import { Button, Callout, Checkbox, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import React, { useState } from 'react'

import { buildFillCall, buildReadCall, hostAllowed } from './ooi-form'

const PREFIX = 'plugin.poi-plugin-ooi-autofill'

const DEFAULT_HOST = 'ooi.moe'

const readSettings = () => ({
  hosts: window.config.get(`${PREFIX}.hosts`, DEFAULT_HOST) || DEFAULT_HOST,
  loginId: window.config.get(`${PREFIX}.loginId`, '') || '',
  password: window.config.get(`${PREFIX}.password`, '') || '',
  autoFill: window.config.get(`${PREFIX}.autoFill`, true) !== false,
  selectPoiMode: window.config.get(`${PREFIX}.selectPoiMode`, true) !== false,
})

const writeSettings = (settings) => {
  window.config.set(`${PREFIX}.hosts`, settings.hosts)
  window.config.set(`${PREFIX}.loginId`, settings.loginId)
  window.config.set(`${PREFIX}.password`, settings.password)
  window.config.set(`${PREFIX}.autoFill`, settings.autoFill)
  window.config.set(`${PREFIX}.selectPoiMode`, settings.selectPoiMode)
}

const parseResult = (raw) => {
  if (raw == null || raw === '') return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (_e) {
      return raw
    }
  }
  return raw
}

const evalInFrames = async (view, code) => {
  let webContents = null
  try {
    webContents = typeof view.getWebContents === 'function' ? view.getWebContents() : null
  } catch (_e) {
    webContents = null
  }
  const frames = webContents?.mainFrame?.framesInSubtree
  if (frames && frames.length) {
    let fallback = null
    for (let i = 0; i < frames.length; i += 1) {
      try {
        const data = parseResult(await frames[i].executeJavaScript(code, true))
        if (data?.found || data === 'filled') return data
        if (data) fallback = data
      } catch (_e) {
        // A frame can navigate away while it is being read.
      }
    }
    if (fallback) return fallback
  }
  return parseResult(await view.executeJavaScript(code, true))
}

const getWebview = () => {
  try {
    return window.getStore('layout.webview.ref')
  } catch (_e) {
    return null
  }
}

const tryFill = async () => {
  const settings = readSettings()
  if (!settings.autoFill || !settings.loginId || !String(settings.hosts).trim()) return
  const view = getWebview()
  if (!view || typeof view.getURL !== 'function' || typeof view.executeJavaScript !== 'function') {
    return
  }
  let url = ''
  try {
    url = view.getURL() || ''
  } catch (_e) {
    return
  }
  if (!hostAllowed(url, settings.hosts)) return
  try {
    await evalInFrames(
      view,
      buildFillCall(settings.loginId, settings.password, settings.selectPoiMode),
    )
  } catch (_e) {
    // The guest page can navigate away before the script runs.
  }
}

let boundView = null
let pollTimer = null
let fillTimer = null

const scheduleFill = () => {
  clearTimeout(fillTimer)
  fillTimer = setTimeout(() => {
    fillTimer = null
    tryFill()
  }, 200)
}

const unbind = () => {
  if (!boundView || typeof boundView.removeEventListener !== 'function') {
    boundView = null
    return
  }
  boundView.removeEventListener('dom-ready', scheduleFill)
  boundView.removeEventListener('did-finish-load', scheduleFill)
  boundView.removeEventListener('did-navigate', scheduleFill)
  boundView = null
}

const bind = () => {
  const next = getWebview()
  if (next === boundView) return
  unbind()
  if (!next || typeof next.addEventListener !== 'function') return
  boundView = next
  boundView.addEventListener('dom-ready', scheduleFill)
  boundView.addEventListener('did-finish-load', scheduleFill)
  boundView.addEventListener('did-navigate', scheduleFill)
  scheduleFill()
}

export const pluginDidLoad = () => {
  bind()
  pollTimer = setInterval(bind, 1000)
}

export const pluginWillUnload = () => {
  clearInterval(pollTimer)
  pollTimer = null
  clearTimeout(fillTimer)
  fillTimer = null
  unbind()
}

const notify = (message, type) => {
  if (typeof window.toast === 'function') {
    window.toast(message, { type })
  }
}

export const settingsClass = () => {
  const [settings, setSettings] = useState(readSettings)
  const [showPassword, setShowPassword] = useState(false)

  const update = (partial) => {
    const next = { ...settings, ...partial }
    setSettings(next)
    writeSettings(next)
    scheduleFill()
  }

  const readFromPage = async () => {
    const view = getWebview()
    if (!view || typeof view.executeJavaScript !== 'function') {
      notify('游戏页面还没准备好', 'warning')
      return
    }
    let result = null
    try {
      result = await evalInFrames(view, buildReadCall())
    } catch (_e) {
      notify('读取登录页失败', 'error')
      return
    }
    let pageUrl = ''
    try {
      pageUrl = view.getURL?.() || ''
    } catch (_e) {
      pageUrl = ''
    }
    if (!result || !result.found) {
      notify(`没有找到 OOI 登录表单。当前游戏页是 ${result?.href || pageUrl || '空白页'}`, 'warning')
      return
    }
    if (!result.loginId) {
      const settings = readSettings()
      if (settings.loginId) {
        await tryFill()
        notify('登录框是空的，已用上面保存的账号填入', 'success')
        return
      }
      notify('找到了 ooi.moe 的登录框，但邮箱还是空的。请先在游戏页输入，或在上面填写账号。', 'warning')
      return
    }
    update({
      loginId: result.loginId,
      password: result.password || '',
    })
    notify('已记录当前 OOI 登录页的账号和密码', 'success')
  }

  return (
    <div style={{ maxWidth: 480, padding: '8px 4px' }}>
      <Callout intent={Intent.WARNING} style={{ marginBottom: 12 }}>
        账号和密码只写在本机 poi 配置里，不会上传。只有站点地址匹配、且页面含有 OOI
        登录表单时才会填入，不会自动点击「登录游戏」。
      </Callout>
      <FormGroup label="OOI 站点地址">
        <InputGroup
          placeholder="ooi.moe"
          value={settings.hosts}
          onChange={(e) => update({ hosts: e.target.value })}
        />
      </FormGroup>
      <FormGroup label="登录 ID">
        <InputGroup
          value={settings.loginId}
          onChange={(e) => update({ loginId: e.target.value })}
        />
      </FormGroup>
      <FormGroup label="密码">
        <InputGroup
          type={showPassword ? 'text' : 'password'}
          value={settings.password}
          onChange={(e) => update({ password: e.target.value })}
          rightElement={
            <Button minimal onClick={() => setShowPassword((shown) => !shown)}>
              {showPassword ? '隐藏' : '显示'}
            </Button>
          }
        />
      </FormGroup>
      <Checkbox checked={settings.autoFill} onChange={(e) => update({ autoFill: e.target.checked })}>
        打开登录页时自动填入
      </Checkbox>
      <Checkbox
        checked={settings.selectPoiMode}
        onChange={(e) => update({ selectPoiMode: e.target.checked })}
      >
        自动选择「在poi中运行」
      </Checkbox>
      <div style={{ marginTop: 8 }}>
        <Button onClick={readFromPage}>从当前登录页读取</Button>
      </div>
    </div>
  )
}
