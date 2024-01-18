import React, { Component } from 'react'
import { range, debounce } from 'lodash'
import { ResizeSensor } from '@blueprintjs/core'
import { styled } from 'styled-components'

import { Section } from 'views/components/settings/components/section'

const floor = (x) => Math.floor(x / 10) * 10

const Wrapper = styled.div`
  img {
    cursor: pointer;
  }
`

export class OpenCollective extends Component {
  state = {
    width: 0,
  }

  handleResize = debounce(([entry]) => {
    this.setState({
      width: floor(entry.contentRect.width),
    })
  }, 100)

  render() {
    const { width } = this.state
    const { ready } = this.props
    return (
      <ResizeSensor onResize={this.handleResize}>
        <Section title="OpenCollective">
          <Wrapper>
            {ready && (
              <div className="opencollective">
                {range(10).map((i) => (
                  <a href={`https://opencollective.com/poi/sponsor/${i}/website`} key={i}>
                    <img src={`https://opencollective.com/poi/sponsor/${i}/avatar.svg`} />
                  </a>
                ))}
              </div>
            )}
            {ready && width > 0 && (
              <div>
                <a href="https://opencollective.com/poi#backers">
                  <img src={`https://opencollective.com/poi/backers.svg?width=${width}`} />
                </a>
              </div>
            )}
          </Wrapper>
        </Section>
      </ResizeSensor>
    )
  }
}
