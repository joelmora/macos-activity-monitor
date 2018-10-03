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
      cpuPercentageUsed: 0,
      memoryPercentageUsed: 0,
      interval: undefined,
      hasSettings: false,
    }
  }
  componentDidMount() {
    ipcRenderer.send(ev.GET_SETTINGS)
    ipcRenderer.on(ev.STATS_UPDATED, this.onStatsUpdated)
    ipcRenderer.on(ev.GET_SETTINGS, this.onGetSettings)
  }
  componentWillUnmount() {
    ipcRenderer.removeListener(ev.STATS_UPDATED, this.onStatsUpdated)
    ipcRenderer.removeListener(ev.GET_SETTINGS, this.onGetSettings)
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
      cpuPercentageUsed: data.result.cpu.percentage.used,
      memoryPercentageUsed: data.result.memory.percentage.used,
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
    if (!this.state.hasSettings) return null

    return (
      <React.Fragment>
        <Segment compact secondary size="tiny" textAlign="right">
          <Icon name="setting" link onClick={this.goToSettings} />
          <Icon name="power off" link onClick={this.exit} style={{ marginLeft: 10 }} />
        </Segment>
        <Segment>
          <LineRealtimeChart
            type="cpu"
            currentValue={this.state.cpuPercentageUsed}
            interval={this.state.interval}
            indicators={this.state.indicators}
          />
          <LineRealtimeChart
            type="mem"
            currentValue={this.state.memoryPercentageUsed}
            interval={this.state.interval}
            indicators={this.state.indicators}
          />
        </Segment>
      </React.Fragment>
    )
  }
}

export default Charts