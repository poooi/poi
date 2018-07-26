import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button } from 'react-bootstrap'
import { sortBy, round, sumBy } from 'lodash'
import { translate } from 'react-i18next'

@translate(['setting'])
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
    ;['workingSetSize', 'peakWorkingSetSize'].map(prop =>
      total[prop] = round(sumBy(metrics, metric => metric.memory[prop]) / 1000, 2)
    )

    total.percentCPUUsage = round(sumBy(metrics, metric => metric.cpu.percentCPUUsage), 2)

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
      <>
        <Button onClick={this.handleClick} bsStyle={active ? 'success' : 'default'}>
          {
            active
              ? <span>{t('setting:Monitor on')}</span>
              : <span>{t('setting:Monitor off')}</span>
          }
        </Button>
        {
          active &&
          <div className="metric-table">
            <div className="metric-row metric-haeder">
              <span>PID</span>
              {
                ['type', 'working/MB', 'peak/MB', 'CPU/%', 'wakeup'].map(str =>
                  <span key={str} title={str}>{str}</span>
                )
              }
            </div>
            {
              metrics.map(metric => (
                <div className='metric-row' key={metric.pid}>
                  <span>{metric.pid}</span>
                  <span title={pidmap[metric.pid] || metric.type}>
                    {pidmap[metric.pid] || metric.type}
                  </span>
                  {
                    ['workingSetSize', 'peakWorkingSetSize'].map(prop =>
                      <span key={prop}>{round((metric.memory || [])[prop] / 1000, 2)}</span>
                    )
                  }
                  {
                    ['percentCPUUsage', 'idleWakeupsPerSecond'].map(prop =>
                      <span key={prop}>{round((metric.cpu || [])[prop], 1)}</span>
                    )
                  }
                </div>
              ))
            }
            <div className='metric-row metric-total'>
              <span>
                {t('setting:TOTAL')}
              </span>
              <span />
              <span>
                {total.workingSetSize}
              </span>
              <span>
                {total.peakWorkingSetSize}
              </span>
              <span>
                {total.percentCPUUsage}
              </span>
              <span />
            </div>
          </div>
        }
      </>
    )
  }
}
