import React, { Component } from 'react'
import { Checkbox } from 'react-bootstrap'
import i18next from 'views/env-parts/i18next'

const { config, POI_VERSION } = window

// Readme contents
const dontShowAgain = () =>
  config.set('poi.first', POI_VERSION)

class GoogleAnalyticsOption extends Component {
  state = {
    checked: config.get('poi.sendAnalytics', true),
  }
  handleChange = e => {
    config.set('poi.sendAnalytics', !this.state.checked)
    this.setState({ checked: !this.state.checked })
  }
  render() {
    return (
      <Checkbox
        checked={this.state.checked}
        onChange={this.handleChange}>
        {i18next.t('setting:Send data to Google Analytics')}
      </Checkbox>
    )
  }
}

if (config.get('poi.first', '0.0.0') != POI_VERSION) {
  const isHan = ['zh-CN', 'zh-TW'].includes(window.language)
  const isEn = window.language === 'en-US'
  const isCN = window.language === 'zh-CN'
  const title = 'README'
  const content =
    <div>
      <div>
        <GoogleAnalyticsOption />
      </div>
      <p>{i18next.t('Good day and welcome to poi! Before your use, here are some information for you', { version: POI_VERSION })}</p>
      <p style={{color: '#FFCCFF', fontWeight: 'bold', fontSize: 'large'}}>
        {i18next.t('poi will never modify your game data package, but please use trusted executables and plugins!')}
      </p>
      <p>{i18next.t('poi does not use proxy by default, which you may change in settings panel')}</p>
      <div>
        <ul>
          {
            isCN
              ? <li>{i18next.t('For Shimakaze Go, use HTTP proxy with address 127_0_0_1 and port 8099 (default case)')}</li>
              : <li>{i18next.t('For cookie method, check Editing DMM Cookie Region Flag setting')}</li>
          }
          <li>{i18next.t('For Shadowsocks and other Socks5 proxies, use Socks5')}</li>
          <li>{i18next.t('For VPN, simply leave it unset')}</li>
        </ul>
      </div>
      <p>{i18next.t('If you see error on displaying, manually set content size and it will auto-adjust')}</p>
      <p>{i18next.t('If poi is under performance, you may disable some plugins and do a restart')}</p>
      {isEn && <p>If you prefer Kata to Kanji, you may try translator plugin.</p>}
      {isHan && <p>{i18next.t('更多帮助参考')} poi wiki - https://github.com/poooi/poi/wiki。</p>}
      {isHan && <p>{i18next.t('poi 交流群：')}378320628。</p>}
      <p>{i18next.t('Draft an issue, contribute your code, or plugins for poi')} - GitHub: https://github.com/poooi/poi.</p>
    </div>
  const footer = [
    {
      name: i18next.t('I know'),
      func: dontShowAgain,
      style: 'success',
    },
  ]
  const toggle = () => window.toggleModal(title, content, footer)
  // using setTimeout to avoid disturbing the magic being cast in layout.es
  setTimeout(toggle, 5000)
}
