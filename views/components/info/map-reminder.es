import React, { Component } from 'react'
import { ProgressBar } from 'react-bootstrap'
import { get } from 'lodash'
import ReactDOM from 'react-dom'

const __ = window.i18n.others.__.bind(window.i18n.others)

// Map Reminder
export default class PoiMapReminder extends Component {
  static mapRanks = ['', ` ${__('丙')}`, ` ${__('乙')}`, ` ${__('甲')}`]
  constructor(props) {
    super(props)
    this.state = {
      battling: __('Not in sortie'),
      mapHp: [0, 0],
    }
  }
  handleResponse = (e) => {
    const reqPath = e.detail.path
    const {body} = e.detail
    switch (reqPath) {
    case '/kcsapi/api_port/port':
      this.setState({
        battling: __('Not in sortie'),
        mapHp: [0, 0],
      })
      break
    case '/kcsapi/api_req_map/start': {
      const mapId = `${body.api_maparea_id}${body.api_mapinfo_no}`
      const mapRank = get(window, ['_eventMapRanks', mapId])
      const mapName = `${body.api_maparea_id}-${body.api_mapinfo_no}` +
        (mapRank ? this.mapRanks[mapRank] : '')
      const nowHp = get(body, 'api_eventmap.api_now_maphp')
      const maxHp = get(body, 'api_eventmap.api_max_maphp')
      const hp = (nowHp != null && maxHp != null) ? [nowHp, maxHp] : [0, 0]
      this.setState({
        battling: `${__('Sortie area')}: ${mapName}`,
        mapHp: hp,
      })
      break
    }
    }
  }
  handleMapInfo = (e) => {
    if (e.detail.mapdetail != null) {
      const info = e.detail.mapdetail
      if (React.isValidElement(info)) {
        ReactDOM.render(info, document.getElementById('map-reminder-area'))
      } else {
        this.setState({
          battling: info,
        })
      }
    }
  }
  componentDidMount() {
    window.addEventListener('game.response', this.handleResponse)
    window.addEventListener('poi.map-reminder', this.handleMapInfo)
  }
  componentWillUnmount() {
    window.removeEventListener('game.response', this.handleResponse)
    window.removeEventListener('poi.map-reminder', this.handleMapInfo)
  }
  render() {
    return (
      <div>
        {
          this.state.mapHp[1] <= 0 ? undefined :
            <ProgressBar bsStyle="info" now={this.state.mapHp[0]} max={this.state.mapHp[1]} />
        }
        <div className='alert alert-default'>
          <span id='map-reminder-area'>
            {this.state.battling}
          </span>
        </div>
      </div>
    )
  }
}
