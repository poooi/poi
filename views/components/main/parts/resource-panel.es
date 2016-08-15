import React from 'react'
import { Panel, Grid, Col } from 'react-bootstrap'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { MaterialIcon } from 'views/components/etc/icon'

const order = [0, 2, 1, 3, 4, 6, 5, 7]

export default connect(
  (state) => ({
    resources: get(state, 'info.resources', []),
    admiralLv: get(state, 'info.basic.api_level', 0),
  })
)(function ResourcePanel({admiralLv, resources}) {
  const valid = !!admiralLv
  const limit = 750 + admiralLv * 250
  return (
    <Panel bsStyle="default">
      <Grid>
      {
        order.map((i) => {
          const className = classNames('material-icon', {
            'glow': valid && i < 4 && resources[i] < limit,
          })
          const amount = valid ? resources[i] : '??'
          return (
            <Col key={i} xs={6} style={{marginBottom: 2, marginTop: 2}}>
              <MaterialIcon materialId={i+1} className={className} />
              <span className="material-value">{amount}</span>
            </Col>
          )
        })
      }
      </Grid>
    </Panel>
  )
})
