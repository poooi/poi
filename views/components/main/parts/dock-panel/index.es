import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Tabs, Tab, Card, ResizeSensor } from '@blueprintjs/core'
import { translate } from 'react-i18next'
import styled from 'styled-components'

import { RepairPanel } from './repair-panel'
import { ConstructionPanel } from './construction-panel'

const Wrapper = styled(Card)`
  display: flex;
  flex-direction: column;
`

const TabsWrapper = styled.div`
  height: 30px;

  .bp3-tabs,
  .bp3-tab-list {
    height: 30px;
  }

  .bp3-tab {
    width: 50%;
    margin: 0;
    text-align: center;
    height: 30px;
  }
`

const ContentWrapper = styled.div`
  flex: 1;
  overflow: hidden;
`

const Content = styled.div`
  width: 100%;
  height: 100%;
  transform: translate(${props => -100 * (props.activeTab - 1)}%);
  display: -webkit-box;
  flex-flow: row;
`

const Panel = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
`

const getPanelDimension = width => {
  if (width > 700) {
    return 4
  }
  if (width > 350) {
    return 2
  }
  return 1
}

@translate(['main'])
export class DockPanel extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
  }

  state = {
    activeTab: 1,
    dimension: 1,
  }

  handleTabChange = (id) => {
    this.setState({
      activeTab: id,
    })
  }

  handleResize= ([entry]) => {
    const dimension = getPanelDimension(entry.contentRect.width)

    if (dimension !== this.state.dimension) {
      this.setState({
        dimension,
      })
    }
  }

  render() {
    const {t} = this.props
    const { activeTab, dimension } = this.state
    return(
      <ResizeSensor onResize={this.handleResize}>
        <Wrapper>
          <TabsWrapper>
            <Tabs
              animate={false}
              selectedTabId={activeTab}
              ref={this.tabs}
              animation={false}
              id="dock-panel-tabs"
              className="dock-panel-tabs"
              onChange={this.handleTabChange}
            >
              <Tab
                id={1}
                title={t('main:Docking')}
              />
              <Tab
                id={2}
                title={t('main:Construction')}
              />
            </Tabs>
          </TabsWrapper>
          <ContentWrapper>
            <Content activeTab={activeTab}>
              <Panel className="ndock-panel" active={activeTab === 1}>
                <RepairPanel dimension={dimension} />
              </Panel>
              <Panel className="kdock-panel" active={activeTab === 2}>
                <ConstructionPanel dimension={dimension} />
              </Panel>
            </Content>
          </ContentWrapper>
        </Wrapper>
      </ResizeSensor>
    )
  }
}

