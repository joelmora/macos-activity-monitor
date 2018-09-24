import React, { Component } from 'react'
import LineRealtimeChart from './LineRealtimeChart'
// import { ipcRenderer } from 'electron'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
    }
  }
  // componentDidMount() {
  //   ipcRenderer.on('stats-updated', this.onStatsUpdated)
  // }
  // componentWillUnmount() {
  //   ipcRenderer.removeListener('stats-updated', this.onStatsUpdated)
  // }
  onStatsUpdated = (event, data) => {
    console.log(event, data)
  }
  render() {
    return (
      <div>
        <LineRealtimeChart type="cpu"/>
        <LineRealtimeChart type="mem"/>
      </div>
    )
  }
}

export default App;
