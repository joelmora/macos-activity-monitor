import React, { Component } from 'react'
import { Segment, Header, Form, Divider, Button, Radio, Icon, Table } from 'semantic-ui-react'
import { TwitterPicker } from 'react-color'
import NumberInput from './NumberInput'

const { ipcRenderer } = window.require('electron')
const ev = require('../utils/events')

class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      hasSettings: false,
    }
  }
  componentDidMount() {
    ipcRenderer.send(ev.GET_SETTINGS)
    document.addEventListener('mousedown', this.handleClickOutside)
    ipcRenderer.on(ev.GET_SETTINGS, this.onGetSettings)
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
    ipcRenderer.removeListener(ev.GET_SETTINGS, this.onGetSettings)
  }
  onGetSettings = (event, settings) => {
    this.setState({
      indicators: settings.indicators,
      interval: settings.interval,
      colorPickerIndex: settings.indicators.findIndex(ind => ind.showColorPicker === true),
      hasSettings: true,
    })
  }
  /**
   * Changes a key in the indicator array
   */
  changeKey = (i, key, value) => {
    let indicators = [...this.state.indicators]

    indicators[i][key] = value

    this.setState({ indicators })
    this.changeSettings({ indicators })
  }
  /**
   * Toggle an indicator in the indicator array
   */
  toggle = (key, i) => {
    let value = this.state.indicators[i][key]
    this.changeKey(i, key, !value)

    //redraw icons in case of on/off indicators
    ipcRenderer.send(ev.REDRAW_ICONS)
  }
  /**
   * Change indicator color
   */
  changeColor = (i, color) => {
    this.changeKey(i, 'color', color.hex)
  }
  /**
   * Change the interval
   */
  changeInterval = (ev, input) => {
    let [cleanValue,] = input.value.toString().match(/(\d+)/) || new Array(1)
    let interval = parseInt(cleanValue * 1000, 10)

    if (cleanValue) {
      this.setState({ interval })
    } else {
      this.setState({ interval: 0 })
    }

    this.changeSettings({ interval })
  }
  /**
   * Send event to electron process to trigger setting change
   */
  changeSettings = (changedSettings) => {
    let currentState = this.state
    let settings = { ...currentState, ...changedSettings }
    let { interval, indicators } = settings

    ipcRenderer.send(ev.SETTINGS_CHANGED, { interval, indicators })
  }
  showColorPicker = (i) => {
    this.setState({ colorPickerIndex: i })
    this.toggle('showColorPicker', i)
  }
  goToHome = () => {
    this.props.history.push('/')
  }
  handlePickerBlur = (node) => {
    this.pickerContainer = node
  }
  handleClickOutside = (event) => {
    //clicked outside color picker
    if (this.pickerContainer && !this.pickerContainer.contains(event.target)) {
      this.toggle('showColorPicker', this.state.colorPickerIndex)
    }
  }
  render() {
    if (!this.state.hasSettings) return null

    return (
      <React.Fragment>

        <Segment compact secondary size="tiny" textAlign="center" className="flex flex-just-sb">
          <Icon name="arrow left" link onClick={this.goToHome} />
          <Header as='h4' style={{ margin: 0 }}>Settings</Header>
          <div>&nbsp;</div>
        </Segment>

        <Segment>
          <Table basic="very" compact="very" size="small" unstackable celled columns={3}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell></Table.HeaderCell>
                <Table.HeaderCell textAlign="center">Show</Table.HeaderCell>
                <Table.HeaderCell>Color</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {
                this.state.indicators.map((attr, i) =>
                  <Table.Row key={i}>
                    <Table.Cell>
                      {attr.name}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Radio toggle checked={attr.isOn} onChange={this.toggle.bind(this, 'isOn', i)} />
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="tiny" icon="dropdown" style={{ backgroundColor: attr.color }} onClick={this.showColorPicker.bind(this, i)} />
                      {attr.showColorPicker &&
                        <div ref={this.handlePickerBlur} style={{ position: 'absolute', zIndex: 5000, marginLeft: -238 }} >
                          <TwitterPicker onChangeComplete={this.changeColor.bind(this, i)} triangle="top-right" />
                        </div>
                      }
                    </Table.Cell>
                  </Table.Row>
                )
              }
            </Table.Body>
          </Table>

          <Divider />

          <Form>
            <Form.Field inline>
              <label>Update Graph Every</label>
              <NumberInput value={this.state.interval / 1000} size="small" min={0} max={300} onChange={this.changeInterval} />
              <span style={{ marginLeft: 10 }}>Seconds</span>
            </Form.Field>
          </Form>

        </Segment>
      </React.Fragment>
    )
  }
}

export default Settings