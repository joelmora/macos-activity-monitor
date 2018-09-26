import React, { Component } from 'react'
import LineRealtimeChart from './components/LineRealtimeChart'

const { ipcRenderer } = window.require('electron')
const ev = require('./utils/events')

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      cpuPercentageUsed: 0,
      memoryPercentageUsed: 0,
      interval: 2000,
    }
  }
  componentDidMount() {
    ipcRenderer.send(ev.INIT_APP)
    ipcRenderer.on(ev.STATS_UPDATED, this.onStatsUpdated)
  }
  componentWillUnmount() {
    ipcRenderer.removeListener(ev.STATS_UPDATED, this.onStatsUpdated)
  }
  onStatsUpdated = (event, data) => {
    this.setState({
      cpuPercentageUsed: data.result.cpu.percentage.used,
      memoryPercentageUsed: data.result.memory.percentage.used,
      interval: data.interval,
    })
  }
  changeInterval = () => {
    ipcRenderer.send(ev.INTERVAL_CHANGED, 2000)
  }
  render() {
    return (
      <div>
        <button onClick={this.changeInterval}>Change interval</button>
        <LineRealtimeChart type="cpu" currentValue={this.state.cpuPercentageUsed} interval={this.state.interval} />
        <LineRealtimeChart type="mem" currentValue={this.state.memoryPercentageUsed} interval={this.state.interval} />
      </div>
    )
  }
}

export default App;
