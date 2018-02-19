import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Col, Row, Button, ButtonGroup, OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'
import ReactMarkdown from 'react-remarkable'
import { Trans } from 'react-i18next'

export class UninstalledPlugin extends PureComponent {
  static propTypes = {
    plugin: PropTypes.object,
    installing: PropTypes.bool,
    npmWorking: PropTypes.bool,
    handleInstall: PropTypes.func,
  }
  render() {
    const plugin = this.props.plugin
    const installButtonText = this.props.installing ? <Trans>setting:Installing</Trans> : <Trans>setting:Install</Trans>
    const installButtonFAname = this.props.installing ? 'spinner' : 'download'
    return (
      <Row className='plugin-wrapper'>
        <Col xs={12}>
          <Panel className='plugin-content'>
            <Panel.Body>
              <Row>
                <Col xs={12} className='div-row'>
                  <span className='plugin-name'>
                    <FontAwesome name={plugin.icon} />
                    {` ${plugin[window.language]}`}
                  </span>
                  <div className='author-wrapper'>{'@'}
                    <a className='author-link'
                      href={plugin.link}>
                      {plugin.author}
                    </a>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col className='plugin-description' xs={7}>
                  <ReactMarkdown source={plugin[`des${window.language}`]} />
                </Col>
                <Col className='plugin-option-install' xs={5}>
                  <ButtonGroup bsSize='small' className='plugin-buttongroup btn-xs-4'>
                    <OverlayTrigger placement='top' overlay={
                      <Tooltip id={`${plugin.id}-ins-btn`}>
                        {installButtonText}
                      </Tooltip>
                    }>
                      <Button bsStyle='primary'
                        disabled={this.props.npmWorking}
                        onClick={this.props.handleInstall}
                        className='plugin-control-button btn-xs-12'>
                        <FontAwesome name={installButtonFAname}
                          pulse={this.props.installing}/>
                      </Button>
                    </OverlayTrigger>
                  </ButtonGroup>
                </Col>
              </Row>
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    )
  }
}
