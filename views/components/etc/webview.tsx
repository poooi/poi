import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { type DidFailLoadEvent, type WebviewTag, type WebContents } from 'electron'
import { webContents } from '@electron/remote'
import { HandlerFields, useWebviewEventListener } from './webview-util'

type WebviewTagDOMAttrs = Partial<
  Pick<
    WebviewTag,
    | 'src'
    | 'nodeintegration'
    | 'nodeintegrationinsubframes'
    | 'plugins'
    | 'preload'
    | 'httpreferrer'
    | 'useragent'
    | 'disablewebsecurity'
    | 'partition'
    | 'allowpopups'
    | 'webpreferences'
    | 'enableblinkfeatures'
    | 'disableblinkfeatures'
  >
>

interface ExtraFields {
  className?: string
  webviewTagClassName?: string
  style?: CSSProperties
  zoomFactor?: number
  audioMuted?: boolean
  onResize?: (entries: ResizeObserverEntry[]) => void
}

type Props = WebviewTagDOMAttrs & HandlerFields & ExtraFields

type ExtendedWebviewTag = WebviewTag & {
  getWebContents: () => WebContents
  isReady: () => boolean
}

const ElectronWebView = forwardRef<ExtendedWebviewTag | undefined, Props>(
  (
    {
      style,
      zoomFactor,
      audioMuted,
      onResize,
      className,
      webviewTagClassName,
      src,
      nodeintegration,
      nodeintegrationinsubframes,
      plugins,
      preload,
      httpreferrer,
      useragent,
      disablewebsecurity,
      partition,
      allowpopups,
      webpreferences,
      enableblinkfeatures,
      disableblinkfeatures,
      ...props
    },
    ref,
  ) => {
    const [view, setView] = useState<WebviewTag>()
    const [isReady, setIsReady] = useState(false)
    const [entries, setEntries] = useState<ResizeObserverEntry[]>([])

    // Sync zoomFactor state
    useEffect(() => {
      if (
        isReady &&
        zoomFactor != null &&
        view?.getZoomFactor &&
        view.getZoomFactor() !== zoomFactor
      ) {
        view.setZoomFactor(zoomFactor)
      }
    }, [isReady, view, view?.getZoomFactor, zoomFactor])

    // Sync audioMuted state
    useEffect(() => {
      if (
        isReady &&
        audioMuted != null &&
        view?.isAudioMuted &&
        view.isAudioMuted() !== audioMuted
      ) {
        view.setAudioMuted(audioMuted)
      }
    }, [isReady, view, view?.isAudioMuted, audioMuted])

    const observer = useMemo(() => new ResizeObserver(setEntries), [])

    // Enable Observer
    useEffect(() => {
      if (view) {
        observer.observe(view)
      }

      return () => {
        if (view) {
          observer.unobserve(view)
        }
      }
    }, [view, observer])

    // onResize event handler
    useEffect(() => {
      if (onResize) {
        onResize(entries)
      }
    }, [onResize, entries])

    // Error handling
    useEffect(() => {
      const callback = (e: DidFailLoadEvent) => {
        if (e.errorCode !== -3) {
          const errorScript = `document.write('<br>Webview load error<br>Error Code: ${e.errorCode}<br>Description: ${e.errorDescription}<br>URL: ${e.validatedURL}')\ndocument.body.style.backgroundColor = "white"`
          const target = e.target as WebviewTag
          target.executeJavaScript(errorScript)
        }
      }
      if (view) {
        view.addEventListener('did-fail-load', callback)
      }
      return () => {
        if (view) {
          view.removeEventListener('did-fail-load', callback)
        }
      }
    })

    // Set isReady state
    useEffect(() => {
      const cb = () => {
        setIsReady(true)
      }
      if (view) {
        view.addEventListener('dom-ready', cb)
      }
      return () => {
        if (view) {
          view.removeEventListener('dom-ready', cb)
        }
      }
    }, [view])

    // Custom event handlers
    useWebviewEventListener('load-commit', props, view)
    useWebviewEventListener('did-attach', props, view)
    useWebviewEventListener('did-finish-load', props, view)
    useWebviewEventListener('did-fail-load', props, view)
    useWebviewEventListener('did-frame-finish-load', props, view)
    useWebviewEventListener('did-start-loading', props, view)
    useWebviewEventListener('did-stop-loading', props, view)
    useWebviewEventListener('dom-ready', props, view)
    useWebviewEventListener('console-message', props, view)
    useWebviewEventListener('context-menu', props, view)
    useWebviewEventListener('devtools-open-url', props, view)
    useWebviewEventListener('devtools-opened', props, view)
    useWebviewEventListener('devtools-closed', props, view)
    useWebviewEventListener('devtools-focused', props, view)
    useWebviewEventListener('will-navigate', props, view)
    useWebviewEventListener('did-start-navigation', props, view)
    useWebviewEventListener('did-redirect-navigation', props, view)
    useWebviewEventListener('did-navigate', props, view)
    useWebviewEventListener('did-frame-navigate', props, view)
    useWebviewEventListener('did-navigate-in-page', props, view)
    useWebviewEventListener('close', props, view)
    useWebviewEventListener('render-process-gone', props, view)
    useWebviewEventListener('plugin-crashed', props, view)
    useWebviewEventListener('destroyed', props, view)
    useWebviewEventListener('page-title-updated', props, view)
    useWebviewEventListener('page-favicon-updated', props, view)
    useWebviewEventListener('enter-html-full-screen', props, view)
    useWebviewEventListener('leave-html-full-screen', props, view)
    useWebviewEventListener('media-started-playing', props, view)
    useWebviewEventListener('media-paused', props, view)
    useWebviewEventListener('found-in-page', props, view)
    useWebviewEventListener('did-change-theme-color', props, view)
    useWebviewEventListener('update-target-url', props, view)

    // Custom ref
    useImperativeHandle(
      ref,
      () => {
        if (!view) {
          return undefined
        }
        const viewToReturn = view as ExtendedWebviewTag
        viewToReturn.getWebContents = () => {
          const id = view?.getWebContentsId()
          if (!id) {
            throw new Error('view not ready')
          }
          const wc = webContents.fromId(id)
          if (!wc) {
            throw new Error('view destroyed')
          }
          return wc
        }
        viewToReturn.isReady = () => isReady
        return viewToReturn
      },
      [view, isReady],
    )

    return (
      <div style={style} className={className}>
        <webview
          className={webviewTagClassName}
          src={src}
          // @ts-expect-error wrong type definition
          nodeintegration={nodeintegration ? 'on' : undefined}
          nodeintegrationinsubframes={nodeintegrationinsubframes ? 'on' : undefined}
          // @ts-expect-error wrong type definition
          plugins={plugins ? 'on' : undefined}
          preload={preload}
          httpreferrer={httpreferrer}
          useragent={useragent}
          // @ts-expect-error wrong type definition
          disablewebsecurity={disablewebsecurity ? 'on' : undefined}
          partition={partition}
          // @ts-expect-error wrong type definition
          allowpopups={allowpopups ? 'on' : undefined}
          webpreferences={webpreferences}
          enableblinkfeatures={enableblinkfeatures}
          disableblinkfeatures={disableblinkfeatures}
          ref={(view: WebviewTag) => {
            setView(view)
          }}
        />
      </div>
    )
  },
)

ElectronWebView.displayName = 'ElectronWebView'

export default ElectronWebView
