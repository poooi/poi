import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button, Intent, HTMLTable } from '@blueprintjs/core'
import { sortBy, round, sumBy, map } from 'lodash'
import { withNamespaces } from 'react-i18next'

import { Section } from 'views/components/settings/components/section'

@withNamespaces(['setting'])
export class AppMetrics extends PureComponent {
  constructor(props) {
    super(props)

    this.getAppMetrics = remote.require('electron').app.getAppMetrics

    this.getAllWindows = remote.require('electron').BrowserWindow.getAllWindows

    this.state = {
      metrics: [],
      total: {},
      pidmap: {},
      active: false,
    }
  }

  collect = () => {
    const metrics = this.getAppMetrics()

    const total = {}

    const pidmap = {}
    // ;['workingSetSize', 'peakWorkingSetSize'].map(
    //   prop => (total[prop] = round(sumBy(metrics, metric => metric.memory[prop]) / 1000, 2)),
    // )

    total.percentCPUUsage = round(
      sumBy(metrics, metric => metric.cpu.percentCPUUsage),
      2,
    )

    this.getAllWindows().map(win => {
      const pid = win.webContents.getOSProcessId()
      const title = win.getTitle()
      pidmap[pid] = title
    })
    this.setState({
      metrics: sortBy(JSON.parse(JSON.stringify(metrics)), 'pid'),
      total,
      pidmap,
    })
  }

  componentWillUnmount() {
    if (this.cycle) {
      clearInterval(this.cycle)
    }
  }

  handleClick = () => {
    const { active } = this.state
    if (active) {
      clearInterval(this.cycle)
    } else {
      this.collect()
      this.cycle = setInterval(this.collect.bind(this), 5 * 1000)
    }

    this.setState({
      active: !active,
    })
  }

  render() {
    const { t } = this.props
    const { metrics, active, total, pidmap } = this.state
    return (
      <Section title={t('setting:Performance Monitor')}>
        <Button
          minimal
          onClick={this.handleClick}
          intent={active ? Intent.SUCCESS : Intent.PRIMARY}
        >
          {t(active ? 'Monitor on' : 'Monitor off')}
        </Button>
        {active && (
          <HTMLTable condensed interactive className="metric-table">
            <thead>
              {map(['PID', 'type', /* 'working/MB', 'peak/MB',*/ 'CPU/%', 'wakeup'], str => (
                <th key={str} title={str}>
                  {str}
                </th>
              ))}
            </thead>
            <tbody>
              {map(metrics, metric => (
                <tr className="metric-row" key={metric.pid}>
                  <th>{metric.pid}</th>
                  <td title={pidmap[metric.pid] || metric.type}>
                    {pidmap[metric.pid] || metric.type}
                  </td>
                  {/* {['workingSetSize', 'peakWorkingSetSize'].map(prop => (
                    <td key={prop}>{round((metric.memory || [])[prop] / 1000, 2)}</td>
                  ))} */}
                  {['percentCPUUsage', 'idleWakeupsPerSecond'].map(prop => (
                    <td key={prop}>{round((metric.cpu || [])[prop], 1)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>{t('setting:TOTAL')}</th>
                <td />
                {/* <td>{total.workingSetSize}</td>
                <td>{total.peakWorkingSetSize}</td> */}
                <td>{total.percentCPUUsage}</td>
                <td />
              </tr>
            </tfoot>
          </HTMLTable>
        )}
      </Section>
    )
  }
}
