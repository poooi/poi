/* global ROOT */
import React, { Component } from 'react'
import { Button, Intent, Tooltip } from '@blueprintjs/core'
import { connect } from 'react-redux'
import { get, entries, map, max, values } from 'lodash'
import { sync as globSync } from 'glob'
import fetch from 'node-fetch'
import { withNamespaces } from 'react-i18next'

import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'

const serverList = [
  'https://poi.moe/fcd/',
  'https://raw.githubusercontent.com/poooi/poi/master/assets/data/fcd/',
]

const fetchHeader = new Headers()
fetchHeader.set('Cache-Control', 'max-age=0')
const defaultFetchOption = {
  method: 'GET',
  cache: 'default',
  headers: fetchHeader,
}

const initState = {}

@withNamespaces(['setting'])
@connect((state) => ({
  version: state.fcd.version || initState,
}))
export class FCD extends Component {
  state = {
    updating: false,
  }

  updateData =
    (cacheMode = 'default') =>
    async () => {
      this.setState({
        updating: true,
      })
      // Update from local
      const localFileList = globSync(`${ROOT}/assets/data/fcd/*`)
      for (const file of localFileList) {
        if (!file.includes('meta.json')) {
          const data = require(file)
          const version = get(data, 'meta.version')
          const name = get(data, 'meta.name')
          if (name && version) {
            const localVersion = get(this.props.version, name, '1970/01/01/01')
            if (version > localVersion) {
              this.props.dispatch({
                type: '@@updateFCD',
                value: data,
              })
            }
          }
        }
      }
      // Update from server
      let flag
      for (const server of serverList) {
        flag = true

        const fileList = await fetch(`${server}meta.json`, defaultFetchOption)
          .then((res) => (res.ok ? res.json() : undefined))
          .catch((e) => undefined)
        if (fileList) {
          for (const file of fileList) {
            const localVersion = get(this.props.version, file.name, '1970/01/01/01')
            if (file.version > localVersion) {
              // eslint-disable-next-line no-console
              console.log(
                `Updating ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`,
              )

              const data = await fetch(`${server}${file.name}.json`, defaultFetchOption)
                .then((res) => (res.ok ? res.json() : undefined))
                .catch((e) => undefined)
              if (data) {
                this.props.dispatch({
                  type: '@@updateFCD',
                  value: data,
                })
              } else {
                flag = false
              }
            } else {
              // eslint-disable-next-line no-console
              console.log(
                `No newer version of ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`,
              )
            }
          }
        } else {
          flag = false
        }
        if (flag) {
          // eslint-disable-next-line no-console
          console.log(`Update fcd from ${server} successfully in mode ${cacheMode}.`)
          break
        } else {
          console.warn(`Update fcd from ${server} failed in mode ${cacheMode}.`)
        }
      }
      this.setState({
        updating: false,
      })
    }

  componentDidMount() {
    this.updateData()()
  }

  render() {
    const { version, t } = this.props
    const { updating } = this.state
    return (
      <>
        <Tooltip
          content={
            <InfoTooltip className="info-tooltip">
              {map(entries(version), ([name, version]) => (
                <InfoTooltipEntry key={name} className="info-tooltip-entry">
                  <InfoTooltipItem className="info-tooltip-item">{name}</InfoTooltipItem>
                  <span>{version}</span>
                </InfoTooltipEntry>
              ))}
            </InfoTooltip>
          }
        >
          {max(values(version)) || t('Unknown')}
        </Tooltip>{' '}
        <Button
          minimal
          onClick={this.updateData('reload')}
          disabled={updating}
          intent={Intent.PRIMARY}
        >
          {t('Update')}
        </Button>
      </>
    )
  }
}
