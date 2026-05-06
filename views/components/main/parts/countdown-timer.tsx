import { Intent, Tag } from '@blueprintjs/core'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CountdownNotifier } from 'views/utils/notifiers'
import { resolveTime } from 'views/utils/tools'

class Ticker {
  private counting = false
  private callbacks = new Map<string, (now: number) => void>()

  tick = () => {
    const now = Date.now()
    this.callbacks.forEach((f) => f(now))
  }

  count = () => {
    if (!this.counting) return
    if (document.hidden) {
      this.tickAndSchedule()
    } else {
      requestAnimationFrame(this.tickAndSchedule)
    }
  }

  tickAndSchedule = () => {
    this.tick()
    setTimeout(this.count, 1000)
  }

  start = () => {
    this.counting = true
    this.count()
  }

  stop = () => {
    this.counting = false
  }

  reg = (key: string, func: (now: number) => void) => {
    this.callbacks.set(key, func)
    if (!this.counting) this.start()
  }

  unreg = (key: string) => {
    this.callbacks.delete(key)
    if (this.callbacks.size === 0) this.stop()
  }
}

export const ticker = new Ticker()

declare global {
  interface Window {
    ticker?: Ticker
  }
}
window.ticker = ticker

function getTimeRemaining(completeTime: number, currentTime = Date.now()): number {
  if (completeTime < 0) return -1
  if (completeTime <= currentTime) return 0
  return Math.round((completeTime - currentTime) / 1000)
}

interface CountdownTimerInnerProps {
  countdownId: string
  completeTime?: number
  tickCallback?: ((timeRemaining: number) => void) | null
  completeCallback?: (() => void) | null
  isActive?: () => boolean
  resolveTime?: (t: number) => string
}

function CountdownTimerInner({
  countdownId,
  completeTime = -1,
  tickCallback,
  completeCallback,
  isActive,
  resolveTime: resolveTimeProp,
}: CountdownTimerInnerProps) {
  const resolveTimeFn = resolveTimeProp ?? resolveTime
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemaining(completeTime))

  const latestRef = useRef({ completeTime, countdownId, tickCallback, completeCallback, isActive })
  // eslint-disable-next-line react-hooks/refs
  latestRef.current = { completeTime, countdownId, tickCallback, completeCallback, isActive }

  const tick = useCallback((currentTime: number) => {
    const {
      completeTime: ct,
      countdownId: cid,
      tickCallback: tcb,
      completeCallback: ccb,
      isActive: ia,
    } = latestRef.current
    const remaining = getTimeRemaining(ct ?? -1, currentTime)
    if (remaining < 1) ticker.unreg(cid)
    if ((ct ?? -1) >= 0) {
      if (!ia || ia() || remaining < 1) {
        setTimeRemaining(remaining)
      }
      try {
        tcb?.(remaining)
        if (remaining < 1) ccb?.()
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        console.error((error as Error).stack)
      }
    }
  }, [])

  useEffect(() => {
    ticker.reg(countdownId, tick)
    return () => ticker.unreg(countdownId)
  }, [countdownId, tick])

  return resolveTimeFn(timeRemaining)
}

export type CountdownTimerProps = CountdownTimerInnerProps

export function CountdownTimer(props: CountdownTimerProps) {
  return <CountdownTimerInner {...props} key={props.completeTime} />
}

interface CountdownNotifierLabelProps {
  timerKey: string
  completeTime: number
  getNotifyOptions?: (props: CountdownNotifierLabelProps) => Record<string, unknown> | undefined
  getLabelStyle?: (props: CountdownNotifierLabelProps, timeRemaining: number) => Intent
  resolveTime?: (t: number) => string
  isActive?: () => boolean
  minimal?: boolean
}

function CountdownNotifierLabelInner({
  timerKey,
  completeTime,
  getNotifyOptions,
  getLabelStyle: getLabelStyleProp,
  resolveTime: resolveTimeProp,
  isActive,
  minimal,
}: CountdownNotifierLabelProps) {
  const notifier = useRef(new CountdownNotifier())

  const propsRef = useRef<CountdownNotifierLabelProps>({
    timerKey,
    completeTime,
    getNotifyOptions,
    getLabelStyle: getLabelStyleProp,
    resolveTime: resolveTimeProp,
    isActive,
    minimal,
  })
  // eslint-disable-next-line react-hooks/refs
  propsRef.current = {
    timerKey,
    completeTime,
    getNotifyOptions,
    getLabelStyle: getLabelStyleProp,
    resolveTime: resolveTimeProp,
    isActive,
    minimal,
  }

  const computeStyle = useCallback((): Intent => {
    const props = propsRef.current
    const fn = props.getLabelStyle ?? (() => Intent.NONE)
    return fn(props, getTimeRemaining(props.completeTime))
  }, [])

  // eslint-disable-next-line react-hooks/refs
  const [style, setStyle] = useState<Intent>(() => computeStyle())

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStyle(computeStyle())
  }, [computeStyle])

  const tick = useCallback(
    (_timeRemaining: number) => {
      const props = propsRef.current
      const notifyOptions = props.getNotifyOptions?.(props)
      if (notifyOptions) notifier.current.tryNotify(notifyOptions)
      setStyle(computeStyle())
    },
    [computeStyle],
  )

  return completeTime >= 0 ? (
    <Tag className="countdown-timer-label" intent={style} minimal={minimal ?? true}>
      <CountdownTimerInner
        countdownId={timerKey}
        completeTime={completeTime}
        isActive={isActive}
        tickCallback={tick}
        resolveTime={resolveTimeProp}
      />
    </Tag>
  ) : null
}

export function CountdownNotifierLabel(props: CountdownNotifierLabelProps) {
  return <CountdownNotifierLabelInner {...props} key={props.completeTime} />
}
