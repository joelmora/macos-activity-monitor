import React, { Component } from 'react'
import LineRealtimeChart from './LineRealtimeChart'
const { ipcRenderer } = window.require('electron')

const MAX_VALUES = 30

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      cpuPercentageUsedHistory: [],
      memoryPercentageUsedHistory: [],
    }
  }
  componentDidMount() {
    ipcRenderer.send('init-renderer')
    ipcRenderer.on('stats-updated', this.onStatsUpdated)
  }
  componentWillUnmount() {
    ipcRenderer.removeListener('stats-updated', this.onStatsUpdated)
  }
  onStatsUpdated = (event, data) => {
    let cpuPercentageUsedHistory = [ ...this.state.cpuPercentageUsedHistory ]
    let memoryPercentageUsedHistory = [ ...this.state.memoryPercentageUsedHistory ]

    //push current value
    cpuPercentageUsedHistory.push(data.cpu.percentage.used)
    memoryPercentageUsedHistory.push(data.memory.percentage.used)

    //grab only last MAX_VALUES results
    cpuPercentageUsedHistory = cpuPercentageUsedHistory.slice(-MAX_VALUES)
    memoryPercentageUsedHistory = memoryPercentageUsedHistory.slice(-MAX_VALUES)

    this.setState({ cpuPercentageUsedHistory, memoryPercentageUsedHistory })
  }
  render() {
    return (
      <div>
        <LineRealtimeChart type="cpu" values={this.state.cpuPercentageUsedHistory}/>
        <LineRealtimeChart type="mem" values={this.state.memoryPercentageUsedHistory}/>
      </div>
    )
  }
}

export default App;
