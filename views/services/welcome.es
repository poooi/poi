import React from 'react'

const {config, i18n, POI_VERSION} = window
const __ = window.i18n.others.__.bind(i18n.others)

// Readme contents
const dontShowAgain = () =>
  config.set('poi.first', POI_VERSION)

if (config.get('poi.first', '0.0.0') != POI_VERSION) {
  const isHan = ['zh-CN', 'zh-TW'].includes(window.language)
  const isEn = window.language === 'en-US'
  const isCN = window.language === 'zh-CN'
  const title = 'README'
  const content =
    <div>
      <p>{__('Good day and welcome to poi %s! Before your use, here are some information for you', POI_VERSION)}</p>
      <p style={{color: '#FFCCFF', fontWeight: 'bold', fontSize: 'large'}}>
        {__('poi will never modify your game data package, but please use trusted executables and plugins!')}
      </p>
      <p>{__('poi does not use proxy by default, which you may change in settings panel.')}</p>
      <div>
        <ul>
          {
            isCN
            ? <li>{__('For Shimakaze Go, use HTTP proxy with address 127.0.0.1 and port 8099 (default case).')}</li>
            : <li>{__('For cookie method, check Editing DMM Cookie Region Flag setting.')}</li>
          }
          <li>{__('For Shadowsocks and other Socks5 proxies, use Socks5.')}</li>
          <li>{__('For VPN, simply leave it unset.')}</li>
        </ul>
      </div>
      <p>{__('If you see error on displaying, manually set content size and it will auto-adjust.')}</p>
      <p>{__('If poi is under performance, you may disable some plugins and do a restart.')}</p>
      {isEn && <p>If you prefer Kata to Kanji, you may try translator plugin.</p>}
      {isHan && <p>{__('更多帮助参考')} poi wiki - https://github.com/poooi/poi/wiki。</p>}
      {isHan && <p>{__('poi 交流群：')}378320628。</p>}
      <p>{__('Draft an issue, contribute your code, or plugins for poi')} - GitHub: https://github.com/poooi/poi.</p>
    </div>
  const footer = [
    {
      name: __('I know'),
      func: dontShowAgain,
      style: 'success',
    },
  ]
  const toggle = () => window.toggleModal(title, content, footer)
  // using setTimeout to avoid disturbing the magic being cast in layout.es
  setTimeout(toggle, 5000)
}
