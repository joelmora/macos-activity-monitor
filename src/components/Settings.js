import React, { Component } from 'react'
import { Segment, Header, Form, Divider, Button, Radio, Icon, Table } from 'semantic-ui-react'
import { TwitterPicker } from 'react-color'
import NumberInput from './NumberInput'

class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      attributes: [
        { name: 'CPU', isOn: true, color: '#36a2eb', showColorPicker: undefined },
        { name: 'Memory', isOn: true, color: '#36eb7f', showColorPicker: undefined },
      ],
      interval: 5,
    }
  }
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }
  toggle = (key, i) => {
    let value = this.state.attributes[i][key]
    this.changeKey(i, key, !value)
  }
  changeKey = (i, key, value) => {
    let attributes = [...this.state.attributes]

    attributes[i][key] = value

    this.setState({ attributes })
  }
  showColorPicker = (i) => {
    this.setState({ colorPickerIndex: i })
    this.toggle('showColorPicker', i)
  }
  changeColor = (i, color) => {
    this.changeKey(i, 'color', color.hex)
  }
  changeInterval = (ev, input) => {
    let [cleanValue,] = input.value.toString().match(/(\d+)/) || new Array(1)

    if (cleanValue) {
      this.setState({ interval: parseInt(cleanValue, 10) })
    } else {
      this.setState({ interval: 0 })
    }
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
                this.state.attributes.map((attr, i) =>
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
              <label>Interval</label>
              <NumberInput value={this.state.interval} size="small" min={0} max={300} onChange={this.changeInterval} />
              <span style={{ marginLeft: 10 }}>Seconds</span>
            </Form.Field>
          </Form>

        </Segment>
      </React.Fragment>
    )
  }
}

export default Settings