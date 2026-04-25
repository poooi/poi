import { Intent, OverlayToaster, Position } from '@blueprintjs/core'
import React, { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'

const intentValues = new Set<string>(Object.values(Intent))
const isIntent = (v: unknown): v is Intent => typeof v === 'string' && intentValues.has(v)

const intentMap: Partial<Record<string, Intent>> = {
  error: Intent.DANGER,
}

type ToastArgs = [string, Partial<ToastConfig>?]
const list: ToastArgs[] = []

const toastPreload = (...args: ToastArgs) => {
  if (args.length) {
    list.push(args)
  }
}

declare global {
  interface Window {
    toast: (...args: ToastArgs) => void
  }
}
window.toast = toastPreload

const ToasterPositioned = styled(OverlayToaster)<{ inbound: boolean }>`
  padding-bottom: 25px;
  ${({ inbound }) =>
    inbound &&
    css`
      position: absolute !important;
    `}
`

type LayoutState = {
  layout: { webview: { width: number } }
  config: { poi: { layout: { isolate: boolean } } }
}

export const PoiToast = () => {
  const webviewWidth = useSelector((state: LayoutState) => state.layout.webview.width)
  const isolateGameWindow = useSelector((state: LayoutState) => state.config.poi.layout.isolate)

  const toasterRef = useRef<OverlayToaster | null>(null)

  const triggleToast = useCallback((message: string, options: Partial<ToastConfig> = {}): void => {
    if (!message) return
    const { type, title, ...toastProps } = options
    const displayMessage = title ? (
      <>
        <strong>{title}</strong>
        <br />
        {message}
      </>
    ) : (
      message
    )
    const intent = isIntent(type) ? type : (intentMap[type ?? ''] ?? Intent.PRIMARY)
    toasterRef.current?.show({ message: displayMessage, intent, ...toastProps })
  }, [])

  useEffect(() => {
    while (list.length) {
      const args = list.shift()!
      triggleToast(...args)
    }
    window.toast = triggleToast
    return () => {
      window.toast = toastPreload
    }
  }, [triggleToast])

  return (
    <ToasterPositioned
      autoFocus={true}
      position={Position.BOTTOM_RIGHT}
      ref={toasterRef}
      inbound={isolateGameWindow || webviewWidth >= 400}
      usePortal={false}
    />
  )
}
