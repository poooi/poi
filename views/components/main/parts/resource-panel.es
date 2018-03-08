import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from 'react-bootstrap'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { get, isEqual, range } from 'lodash'

import { MaterialIcon } from 'views/components/etc/icon'

import '../assets/resource-panel.css'

const order = [0, 2, 1, 3, 4, 6, 5, 7]
const animTimeStamp = [0, 0, 0, 0, 0, 0, 0, 0]
let t

const getPanelDimension = width => {
  width = width / window.getStore('config.poi.zoomLevel', 1)
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

  state = {
    resourcesIncreasment: [],
    dimension: 2,
  }

  checkAnimTime = () => {
    const ts = Date.now()
    const resourcesIncreasment = Object.clone(this.state.resourcesIncreasment)
    let shouldUpdate = false
    for (const i in resourcesIncreasment) {
      if (animTimeStamp[i] < ts && resourcesIncreasment[i] !== 0) {
        shouldUpdate = true
        resourcesIncreasment[i] = 0
      }
    }
    if (shouldUpdate) {
      this.setState({resourcesIncreasment})
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (isEqual(prevProps.resources, this.props.resources)) {
      return
    }
    const resourcesIncreasment = this.props.resources.map((val, i) => (
      val - prevProps.resources[i]
    ))
    for (const i in resourcesIncreasment) {
      if (resourcesIncreasment[i] !== 0) {
        animTimeStamp[i] = Date.now() + 2500
      }
      resourcesIncreasment[i] += this.state.resourcesIncreasment[i]
    }
    this.setState({resourcesIncreasment})
  }

  componentDidMount() {
    t = setInterval(this.checkAnimTime, 1000)
    this.panelArea = document.querySelector('.MainView .resource-panel .panel-body')
    if (this.panelArea) {
      this.observer = new ResizeObserver(this.handleResize)
      this.observer.observe(this.panelArea)
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.unobserve(this.panelArea)
    }
    clearInterval(t)
  }

  handleResize = entries => {
    const dimension = getPanelDimension(entries[0].contentRect.width)
    if (dimension !== this.state.dimension) {
      this.setState({ dimension })
    }
  }

  render() {
    const { admiralLv, resources } = this.props
    const { dimension, resourcesIncreasment } = this.state
    const valid = !!admiralLv
    const limit = 750 + admiralLv * 250
    return (
      <Panel bsStyle="default">
        <Panel.Body>
          {
            (dimension === 2 ? order : range(8)).map((i) => {
              const iconClassName = classNames('material-icon', {
                'glow': valid && i < 4 && resources[i] < limit,
              })
              const valClassName = classNames('additional-value', {
                'inc': resourcesIncreasment[i] > 0,
                'dec': resourcesIncreasment[i] < 0,
              })
              const amount = valid ? resources[i] : '??'
              return (
                <div key={i} className="material-container" style={{ flexBasis: dimension === 1 ? '75px' : `${100 / dimension}%` }}>
                  <MaterialIcon materialId={i+1} className={iconClassName} />
                  <div className="material-value">
                    <div className="material-amount">
                      {amount}
                    </div>
                    <div className={valClassName}>
                      {`${resourcesIncreasment[i] > 0 ? '+' : ''}${resourcesIncreasment[i] !== 0 ? resourcesIncreasment[i] : ''}　`}
                    </div>
                  </div>
                </div>
              )
            })
          }
        </Panel.Body>
      </Panel>
    )
  }
}
