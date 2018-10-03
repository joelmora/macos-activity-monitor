import React, { Component } from 'react'
import { HashRouter, Route } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import Charts from './components/Charts'
import Settings from './components/Settings'

const { ipcRenderer } = window.require('electron')
const ev = require('./utils/events')

class App extends Component {
  componentDidMount() {
    ipcRenderer.send(ev.INIT_APP)
  }
  render() {
    return (
      <HashRouter>
        <Segment.Group className="h-100 flex">
          <Route path="/" component={Charts} exact />
          <Route path="/settings" component={Settings} />
        </Segment.Group>
      </HashRouter>
    )
  }
}

export default App
