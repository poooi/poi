/* global toggleModal, config, APPDATA_PATH */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import { withNamespaces } from 'react-i18next'
import { remove } from 'fs-extra'
import { join } from 'path'
import { Button, FormGroup, Intent, Callout } from '@blueprintjs/core'
import styled from 'styled-components'

import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'
import { FolderPickerConfig } from 'views/components/settings/components/folder-picker'
import { IntegerConfig } from 'views/components/settings/components/integer'

const { session } = remote.require('electron')

const ButtonArea = styled(Wrapper)`
  button + button {
    margin-left: 10px;
  }

  .bp3-callout {
    margin-top: 0.5em;
  }
`

const defaultCachePath = remote.getGlobal('DEFAULT_CACHE_PATH')

@withNamespaces(['setting'])
export class StorageConfig extends Component {
  static propTypes = {
    cacheSize: PropTypes.number,
  }

  state = {
    cacheSize: 0,
  }

  handleClearCookie = e => {
    remove(join(APPDATA_PATH, 'Cookies')).catch(e => null)
    remove(join(APPDATA_PATH, 'Cookies-journal')).catch(e => null)
    remote.getCurrentWebContents().session.clearStorageData({ storages: ['cookies'] }, () => {
      toggleModal(this.props.t('setting:Delete cookies'), this.props.t('setting:Success!'))
    })
  }

  handleClearCache = e => {
    remote.getCurrentWebContents().session.clearCache(() => {
      toggleModal(this.props.t('setting:Delete cache'), this.props.t('setting:Success!'))
    })
  }

  handleRevokeCert = e => {
    config.set('poi.misc.trustedCerts', [])
    config.set('poi.misc.untrustedCerts', [])
  }

  handleUpdateCacheSize = async () => {
    this.setState({ cacheSize: await session.defaultSession.getCacheSize() })
  }

  componentDidMount = () => {
    this.handleUpdateCacheSize().catch(e => null)
    this.cycle = setInterval(this.handleUpdateCacheSize, 6000000)
  }

  componentWillUnmount = () => {
    if (this.cycle) {
      clearInterval(this.cycle)
    }
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('Storage')}>
        <Wrapper>
          <Wrapper>
            <FormGroup inline label={t('setting:Current cache size')}>
              {Math.round(this.state.cacheSize / 1048576)}MB{' '}
              <Button minimal intent={Intent.PRIMARY} onClick={this.handleUpdateCacheSize}>
                {t('setting:Update')}
              </Button>
            </FormGroup>
          </Wrapper>

          <Wrapper>
            <FormGroup inline label={t('setting:Maximum cache size')}>
              <IntegerConfig
                clampValueOnBlur
                min={0}
                max={20480}
                configName="poi.misc.cache.size"
                defaultValue={640}
              />
              {' MB'}
            </FormGroup>
          </Wrapper>

          <FillAvailable>
            <FormGroup inline label={t('Clear')}>
              <ButtonArea>
                <Button minimal intent={Intent.WARNING} onClick={this.handleClearCookie}>
                  {t('setting:Delete cookies')}
                </Button>
                <Button minimal intent={Intent.WARNING} onClick={this.handleClearCache}>
                  {t('setting:Delete cache')}
                </Button>
                <Button minimal intent={Intent.WARNING} onClick={this.handleRevokeCert}>
                  {t('setting:Revoke trusted / ignored certificates')}
                </Button>
                <Callout>
                  {t('setting:If connection error occurs frequently, delete both of them')}
                </Callout>
              </ButtonArea>
            </FormGroup>
          </FillAvailable>

          <FillAvailable>
            <FormGroup inline label={t('setting:3rd party cache')}>
              <FolderPickerConfig
                label={t('setting:3rd party cache')}
                configName="poi.misc.cache.path"
                defaultValue={defaultCachePath}
              />
            </FormGroup>
          </FillAvailable>
        </Wrapper>
      </Section>
    )
  }
}
