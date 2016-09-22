import React from 'react'
import { Panel, Grid, Col } from 'react-bootstrap'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { get, isEqual } from 'lodash'

import { MaterialIcon } from 'views/components/etc/icon'

const order = [0, 2, 1, 3, 4, 6, 5, 7]
const animTimeStamp = [0, 0, 0, 0, 0, 0, 0, 0]
let t

export default connect(
  (state) => ({
    resources: get(state, 'info.resources', []),
    admiralLv: get(state, 'info.basic.api_level', 0),
  })
)(class ResourcePanel extends React.Component {
  state = {
    resourcesIncreasment: [],
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
  }

  componentWillUnmount() {
    clearInterval(t)
  }

  render() {
    const { admiralLv, resources } = this.props
    const valid = !!admiralLv
    const limit = 750 + admiralLv * 250
    return (
      <Panel bsStyle="default">
        <Grid>
        {
          order.map((i) => {
            const iconClassName = classNames('material-icon', {
              'glow': valid && i < 4 && resources[i] < limit,
            })
            const valClassName = classNames('additional-value', {
              'inc': this.state.resourcesIncreasment[i] > 0,
              'dec': this.state.resourcesIncreasment[i] < 0,
            })
            const amount = valid ? resources[i] : '??'
            return (
              <Col key={i} xs={6} style={{marginBottom: 2, marginTop: 2, display: 'flex'}}>
                <MaterialIcon materialId={i+1} className={iconClassName} />
                <div className="material-value">{amount}</div>
                <div className={valClassName}>
                  {`${this.state.resourcesIncreasment[i] > 0 ? '+' : ''}${this.state.resourcesIncreasment[i]}　`}
                </div>
              </Col>
            )
          })
        }
        </Grid>
      </Panel>
    )
  }
})
