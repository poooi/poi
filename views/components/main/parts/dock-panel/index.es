import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Tabs, Tab, Card } from '@blueprintjs/core'
import { translate } from 'react-i18next'
import styled from 'styled-components'

import { RepairPanel } from './repair-panel'
import { ConstructionPanel } from './construction-panel'

const Wrapper = styled(Card)`
  display: flex;
  flex-direction: column;
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

@translate(['main'])
export class DockPanel extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
  }

  state = {
    activeTab: 1,
  }

  handleTabChange = (id) => {
    this.setState({
      activeTab: id,
    })
  }

  render() {
    const {t} = this.props
    const { activeTab } = this.state
    return(
      <Wrapper>
        <Tabs
          defaultSelectedTabId={1}
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
        <ContentWrapper>
          <Content activeTab={activeTab}>
            <Panel className="ndock-panel" active={activeTab === 1}>
              <RepairPanel />
            </Panel>
            <Panel className="kdock-panel" active={activeTab === 2}>
              <ConstructionPanel />
            </Panel>
          </Content>
        </ContentWrapper>
      </Wrapper>
    )
  }
}

