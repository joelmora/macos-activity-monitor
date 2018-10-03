import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './main.css'
import 'semantic-ui-css/semantic.min.css'
import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
