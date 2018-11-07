import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, isEqual, range } from 'lodash'
import { ResizeSensor } from '@blueprintjs/core'
import styled, { css } from 'styled-components'

import { MaterialIcon } from 'views/components/etc/icon'
import { CardWrapper as CardWrapperL } from './styled-components'

const CardWrapper = styled(CardWrapperL)`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 1px;
  padding-top: 1px;
`

const MaterialContainer = styled.div`
  display: flex;
  margin-bottom: 2px;
  margin-top: 1px;
  padding-left: 15px;
  padding-right: 0;
  ${({dimension}) => dimension === 1 ? css `
    flex-basis: 75px;
  ` : css`
    flex-basis: ${100 / dimension}%;
  `}
`

const MaterialIconGlow = styled(MaterialIcon)`
  height: 18px;
  width: 18px;
  ${({glow}) => glow && css`
    filter: drop-shadow(0 0 4px #2196f3);
  `}
`

const MaterialValue = styled.div`
  position: relative;
  width: calc(100% - 23px);
`

const MaterialAmount = styled.div`
  height: 100%;
  left: 5px;
  min-width: 4em;
  padding-left: 5px;
  padding-right: 10px;
  padding-top: 1px;
  position: absolute;
  top: 0;
  width: 100%;
`

const AdditionalValue = styled(MaterialAmount)`
  color: white;
  opacity: 0;
  text-align: right;
  transition: all 0.3s;
  z-index: 1;
  ${({inc, dec}) => inc ? css`
    background-color: #217dbb;
    opacity: 1;
  ` : dec && css`
    background-color: #d62c1a;
    opacity: 1;
  `}
`

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
    const { admiralLv, resources, editable } = this.props
    const { dimension, resourceIncrement } = this.state
    const valid = !!admiralLv
    const limit = 750 + admiralLv * 250
    return (
      <ResizeSensor onResize={this.handleResize}>
        <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
          {(dimension === 2 ? order : range(8)).map(i =>  (
            <MaterialContainer
              key={i}
              className="material-container"
              dimension={dimension}
            >
              <MaterialIconGlow materialId={i + 1} className="material-icon" glow={valid && i < 4 && resources[i] < limit} />
              <MaterialValue className="material-value">
                <MaterialAmount className="material-amount">{valid ? resources[i] : '??'}</MaterialAmount>
                <AdditionalValue className="additional-value" inc={resourceIncrement[i] > 0} dec={resourceIncrement[i] < 0}>
                  {resourceIncrement[i] > 0 && '+'}
                  {resourceIncrement[i] !== 0 && resourceIncrement[i]}
                </AdditionalValue>
              </MaterialValue>
            </MaterialContainer>
          ))}
        </CardWrapper>
      </ResizeSensor>
    )
  }
}
