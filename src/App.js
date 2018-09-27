import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import Charts from './components/Charts'
import Settings from './components/Settings'

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Segment.Group className="h-100 flex">
          <Route path="/" component={Charts} exact/>
          <Route path="/settings" component={Settings} />
        </Segment.Group>
      </BrowserRouter>
    )
  }
}

export default App
