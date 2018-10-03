import React, { Component } from 'react'
import LineRealtimeChart from './LineRealtimeChart'
import { Segment, Icon } from 'semantic-ui-react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const { ipcRenderer } = window.require('electron')
const ev = require('../utils/events')

class Charts extends Component {
  constructor(props) {
    super(props)

    this.state = {
      stats: [],
      cpuPercentageUsed: -1,
      memPercentageUsed: -1,
      interval: undefined,
      hasSettings: false,
      hasStats: false,
    }
  }
  componentDidMount() {
    ipcRenderer.send(ev.GET_SETTINGS)
    ipcRenderer.send(ev.GET_STATS)
    ipcRenderer.on(ev.STATS_UPDATED, this.onStatsUpdated)
    ipcRenderer.on(ev.GET_SETTINGS, this.onGetSettings)
    ipcRenderer.on(ev.GET_STATS, this.onGetStats)
  }
  componentWillUnmount() {
    ipcRenderer.removeListener(ev.STATS_UPDATED, this.onStatsUpdated)
    ipcRenderer.removeListener(ev.GET_SETTINGS, this.onGetSettings)
    ipcRenderer.removeListener(ev.GET_STATS, this.onGetStats)
  }
  onGetStats = (event, stats) => {
    this.setState({
      stats: stats,
      hasStats: true,
    })
  }
  onGetSettings = (event, settings) => {
    this.setState({
      interval: settings.interval,
      indicators: settings.indicators,
      hasSettings: true,
    })
  }
  onStatsUpdated = (event, data) => {
    this.setState({
      cpuPercentageUsed: data.results.slice(-1)[0].cpu.percentage.used,
      memPercentageUsed: data.results.slice(-1)[0].memory.percentage.used,
      interval: data.interval,
    })
  }
  goToSettings = () => {
    this.props.history.push('/settings')
  }
  exit = () => {
    MySwal.fire({
      type: 'question',
      text: 'Are you sure you want to exit?',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      showCancelButton: true,
      reverseButtons: true,
    }).then(response => {
      if (response.value) {
        ipcRenderer.send(ev.EXIT_APP)
      }
    })
  }
  render() {
    if (!this.state.hasSettings || !this.state.hasStats) return null

    let stats = this.state.stats.map(result => {
      return { cpu: result.cpu.percentage.used, mem: result.memory.percentage.used, }
    })

    return (
      <React.Fragment>
        <Segment compact secondary size="tiny" textAlign="right">
          <Icon name="setting" link onClick={this.goToSettings} />
          <Icon name="power off" link onClick={this.exit} style={{ marginLeft: 10 }} />
        </Segment>
        <Segment>
          {
            this.state.indicators.map(indicator => {
              if (!indicator.isOn) return null

              return (
                <LineRealtimeChart
                  key={indicator.short}
                  indicator={indicator}
                  currentValue={this.state[indicator.short + 'PercentageUsed']}
                  interval={this.state.interval}
                  indicators={this.state.indicators}
                  stats={stats}
                />
              )
            })
          }
        </Segment>
      </React.Fragment>
    )
  }
}

export default Charts