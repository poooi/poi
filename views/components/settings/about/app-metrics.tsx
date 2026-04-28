import type { app, BrowserWindow } from 'electron/main'

import { Button, Intent, HTMLTable } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { sortBy, round, sumBy, map, cloneDeep } from 'lodash'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Section } from 'views/components/settings/components/section'

type AppMetric = Electron.ProcessMetric
type PidMap = Record<number, string>
type MetricTotal = { workingSetSize: number; peakWorkingSetSize: number; percentCPUUsage: number }

const getAppMetrics: (typeof app)['getAppMetrics'] = remote.require('electron').app.getAppMetrics
const getAllWindows: (typeof BrowserWindow)['getAllWindows'] =
  remote.require('electron').BrowserWindow.getAllWindows

export const AppMetrics = () => {
  const { t } = useTranslation('setting')
  const [metrics, setMetrics] = useState<AppMetric[]>([])
  const [total, setTotal] = useState<Partial<MetricTotal>>({})
  const [pidmap, setPidmap] = useState<PidMap>({})
  const [active, setActive] = useState(false)
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const collect = useCallback(() => {
    const newMetrics = getAppMetrics()
    const newTotal: Partial<MetricTotal> = {}
    const newPidmap: PidMap = {}

    for (const prop of ['workingSetSize', 'peakWorkingSetSize'] as const) {
      newTotal[prop] = round(sumBy(newMetrics, (m) => m.memory[prop]) / 1000, 2)
    }
    newTotal.percentCPUUsage = round(
      sumBy(newMetrics, (m) => m.cpu.percentCPUUsage),
      2,
    )

    getAllWindows().forEach((win) => {
      const pid = win.webContents.getOSProcessId()
      newPidmap[pid] = win.getTitle()
    })

    setMetrics(sortBy(cloneDeep(newMetrics), 'pid'))
    setTotal(newTotal)
    setPidmap(newPidmap)
  }, [])

  useEffect(() => {
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
    }
  }, [])

  const handleClick = () => {
    if (active) {
      if (cycleRef.current) clearInterval(cycleRef.current)
    } else {
      collect()
      cycleRef.current = setInterval(collect, 5 * 1000)
    }
    setActive((prev) => !prev)
  }

  return (
    <Section title={t('Performance Monitor')}>
      <Button minimal onClick={handleClick} intent={active ? Intent.SUCCESS : Intent.PRIMARY}>
        {t(active ? 'Monitor on' : 'Monitor off')}
      </Button>
      {active && (
        <HTMLTable striped interactive className="metric-table">
          <thead>
            {map(['PID', 'type', 'working/MB', 'peak/MB', 'CPU/%', 'wakeup'], (str) => (
              <th key={str} title={str}>
                {str}
              </th>
            ))}
          </thead>
          <tbody>
            {map(metrics, (metric) => (
              <tr className="metric-row" key={metric.pid}>
                <th>{metric.pid}</th>
                <td title={pidmap[metric.pid] || metric.type}>
                  {pidmap[metric.pid] || metric.type}
                </td>
                {(['workingSetSize', 'peakWorkingSetSize'] as const).map((prop) => (
                  <td key={prop}>{round(metric.memory[prop] / 1000, 2)}</td>
                ))}
                {(['percentCPUUsage', 'idleWakeupsPerSecond'] as const).map((prop) => (
                  <td key={prop}>{round(metric.cpu[prop], 1)}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>{t('TOTAL')}</th>
              <td />
              <td>{total.workingSetSize}</td>
              <td>{total.peakWorkingSetSize}</td>
              <td>{total.percentCPUUsage}</td>
              <td />
            </tr>
          </tfoot>
        </HTMLTable>
      )}
    </Section>
  )
}
