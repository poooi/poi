import React, {
  CSSProperties,
  HTMLProps,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { type DidFailLoadEvent, type WebviewTag, type WebContents } from 'electron'
import { webContents } from '@electron/remote'

interface Props extends HTMLProps<WebviewTag> {
  style?: CSSProperties
  zoomFactor?: number
  audioMuted?: boolean
  onResize?: (entries: ResizeObserverEntry[]) => void
  onDidAttach?: () => void
  onDestroyed?: () => void
  onDidFrameFinishLoad?: () => void
  onMediaStartedPlaying?: () => void
}

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
      onDidAttach,
      onDestroyed,
      onMediaStartedPlaying,
      onDidFrameFinishLoad,
      ...props
    },
    ref,
  ) => {
    const [view, setView] = useState<WebviewTag>()
    const [isReady, setIsReady] = useState(false)
    const [entries, setEntries] = useState<ResizeObserverEntry[]>([])

    useEffect(() => {
      if (onResize) {
        onResize(entries)
      }
    }, [onResize, entries])

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

    useEffect(() => {
      const callback = (e: DidFailLoadEvent) => {
        if (e.errorCode !== -3) {
          const errorScript = `document.write('<br>Webview load error<br>Error Code: ${e.errorCode}<br>Description: ${e.errorDescription}<br>URL: ${e.validatedURL}')\ndocument.body.style.backgroundColor = "white"`
          ;(e.target as WebviewTag).executeJavaScript(errorScript)
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

    useEffect(() => {
      if (view && onDidAttach) {
        view.addEventListener('did-attach', onDidAttach)
      }

      return () => {
        if (view && onDidAttach) {
          view.removeEventListener('did-attach', onDidAttach)
        }
      }
    }, [onDidAttach, view])

    useEffect(() => {
      if (view && onDidFrameFinishLoad) {
        view.addEventListener('did-frame-finish-load', onDidFrameFinishLoad)
      }

      return () => {
        if (view && onDidFrameFinishLoad) {
          view.removeEventListener('did-frame-finish-load', onDidFrameFinishLoad)
        }
      }
    }, [onDidFrameFinishLoad, view])

    useEffect(() => {
      if (view && onMediaStartedPlaying) {
        view.addEventListener('media-started-playing', onMediaStartedPlaying)
      }

      return () => {
        if (view && onMediaStartedPlaying) {
          view.removeEventListener('media-started-playing', onMediaStartedPlaying)
        }
      }
    }, [onMediaStartedPlaying, view])

    useEffect(() => {
      if (view && onDestroyed) {
        view.addEventListener('destroyed', onDestroyed)
      }

      return () => {
        if (view && onDestroyed) {
          view.removeEventListener('destroyed', onDestroyed)
        }
      }
    }, [onDestroyed, view])

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
      <div style={style}>
        <webview
          {...props}
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
