import { connect } from 'react-redux'
import React, { Component, Children } from 'react'
import PropTypes from 'prop-types'
import { isEqual, omit } from 'lodash'
import shallowEqual from 'fbjs/lib/shallowEqual'
import styled, { css } from 'styled-components'
import { getStoreConfig } from 'views/utils/tools'

const PoiTabContents = styled.div`
  flex: 1 0 0;
  overflow: hidden;
  position: relative;
  display: flex;
  height: 100;
  width: 100;
`

const PoiTabChildPositioner = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  ${({ transition }) =>
    transition &&
    css`
      transition: transform 0.3s 0.2s cubic-bezier(1, 0, 0, 1);
    `}
  ${({ left, right }) =>
    left
      ? css`
          transform: translate3d(-100%, 0, 0);
          pointer-events: none;
        `
      : right &&
        css`
          transform: translate3d(100%, 0, 0);
          pointer-events: none;
        `}
  ${({ active }) =>
    !active &&
    css`
      & > * {
        display: none;
      }
    `}
`

@connect(
  state => ({
    enableTransition: getStoreConfig(state, 'poi.transition.enable', true),
  }),
  undefined,
  undefined,
  { pure: true, forwardRef: true },
)
export class TabContentsUnion extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    activeTab: PropTypes.string.isRequired,
  }

  static getDerivedStateFromProps(props, state) {
    if (props.activeTab !== state.activeTab) {
      return {
        prevTab: state.activeTab,
        activeTab: props.activeTab,
      }
    }
    return null
  }

  state = {
    activeTab: this.props.activeTab,
    prevTab: null,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(omit(this.props, ['children']), omit(nextProps, ['children'])) ||
      !shallowEqual(this.state, nextState) ||
      !isEqual(this.childrenKey(this.props.children), this.childrenKey(nextProps.children))
    )
  }

  childrenKey = children => {
    return Children.map(children, child => child?.key).filter(Boolean)
  }

  findChildByKey = (children, key) => {
    return Children.map(children, child => (child?.key === key ? child : null)).filter(Boolean)[0]
  }

  handleTransitionEnd = key => {
    if (this.state.prevTab === key) {
      this.setState({ prevTab: null })
    }
  }

  activeKey = () => {
    return this.state.activeTab || (this.props.children[0] || {}).key
  }

  prevKey = () => {
    return this.state.prevTab
  }

  render() {
    let onTheLeft = true
    const activeKey = this.activeKey()
    const prevKey = this.prevKey()
    const content = []
    Children.forEach(this.props.children, (child, index) => {
      if (!child) {
        return
      }
      if (child.key === activeKey) {
        onTheLeft = false
      }
      content.push(
        <PoiTabChildPositioner
          key={child.key}
          className="poi-tab-child-positioner"
          transition={
            (child.key === activeKey || child.key === prevKey) && this.props.enableTransition
          }
          active={child.key === activeKey || child.key === prevKey}
          left={child.key !== activeKey && onTheLeft}
          onTransitionEnd={() => this.handleTransitionEnd(child.key)}
          right={child.key !== activeKey && !onTheLeft}
        >
          {child}
        </PoiTabChildPositioner>,
      )
    })
    return <PoiTabContents className="poi-tab-contents">{content}</PoiTabContents>
  }
}
