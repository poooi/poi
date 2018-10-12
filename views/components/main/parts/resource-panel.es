import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { get, isEqual, range } from 'lodash'
import { Card, ResizeSensor } from '@blueprintjs/core'

import { MaterialIcon } from 'views/components/etc/icon'

import '../assets/resource-panel.css'

const order = [0, 2, 1, 3, 4, 6, 5, 7]

const getPanelDimension = width => {
  if (width < 150) {
    return 1
  }
  if (width > 700) {
    return 8
  }
  if (width > 350) {
    return 4
  }
  return 2
}

@connect(state => ({
  resources: get(state, 'info.resources', []),
  admiralLv: get(state, 'info.basic.api_level', 0),
}))
export class ResourcePanel extends React.Component {
  static propTypes = {
    resources: PropTypes.array,
    admiralLv: PropTypes.number,
  }

  timer = 0
  animTimeStamp = [0, 0, 0, 0, 0, 0, 0, 0]

  state = {
    resourceIncrement: [],
    dimension: 2,
  }

  checkAnimTime = () => {
    const ts = Date.now()
    const resourceIncrement = Object.clone(this.state.resourceIncrement)
    let shouldUpdate = false
    for (const i in resourceIncrement) {
      if (this.animTimeStamp[i] < ts && resourceIncrement[i] !== 0) {
        shouldUpdate = true
        resourceIncrement[i] = 0
      }
    }
    if (shouldUpdate) {
      this.setState({ resourceIncrement })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (isEqual(prevProps.resources, this.props.resources)) {
      return
    }
    const resourceIncrement = this.props.resources.map((val, i) => val - prevProps.resources[i])
    for (const i in resourceIncrement) {
      if (resourceIncrement[i] !== 0) {
        this.animTimeStamp[i] = Date.now() + 2500
      }
      resourceIncrement[i] += this.state.resourceIncrement[i]
    }
    this.setState({ resourceIncrement })
  }

  componentDidMount() {
    this.timer = setInterval(this.checkAnimTime, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  handleResize = entries => {
    const dimension = getPanelDimension(entries[0].contentRect.width)
    if (dimension !== this.state.dimension) {
      this.setState({ dimension })
    }
  }

  render() {
    const { admiralLv, resources } = this.props
    const { dimension, resourceIncrement } = this.state
    const valid = !!admiralLv
    const limit = 750 + admiralLv * 250
    return (
      <ResizeSensor onResize={this.handleResize}>
        <Card>
          {(dimension === 2 ? order : range(8)).map(i => {
            const iconClassName = classNames('material-icon', {
              glow: valid && i < 4 && resources[i] < limit,
            })
            const valClassName = classNames('additional-value', {
              inc: resourceIncrement[i] > 0,
              dec: resourceIncrement[i] < 0,
            })
            const amount = valid ? resources[i] : '??'
            return (
              <div
                key={i}
                className="material-container"
                style={{ flexBasis: dimension === 1 ? '75px' : `${100 / dimension}%` }}
              >
                <MaterialIcon materialId={i + 1} className={iconClassName} />
                <div className="material-value">
                  <div className="material-amount">{amount}</div>
                  <div className={valClassName}>
                    {resourceIncrement[i] > 0 && '+'}
                    {resourceIncrement[i] !== 0 && resourceIncrement[i]}
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      </ResizeSensor>
    )
  }
}
