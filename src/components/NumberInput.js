import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Input } from 'semantic-ui-react'

class NumberInput extends Component {
  stepValue = (cmd) => {
    if (cmd === 'up') {
      if (this.props.value === this.props.max) return

      this.props.onChange(null, { value: this.props.value + 1 })
    } else if (cmd === 'down') {
      if (this.props.value === this.props.min) return

      this.props.onChange(null, { value: this.props.value - 1 })
    }
  }
  render() {
    let value = this.props.value

    //upper limit
    if (value > this.props.max) {
      value = this.props.max
    }

    return (
      <Input
        className={ 'number-input-container width-' + this.props.size }
        action={{
          content: (
            <Button.Group vertical size="mini" compact>
              <Button icon={{ name: 'chevron up' }} onClick={this.stepValue.bind(this, 'up')} />
              <Button icon={{ name: 'chevron down' }} onClick={this.stepValue.bind(this, 'down')} />
            </Button.Group>
          ),
          labelPosition: 'right'
        }}
        onChange={this.props.onChange}
        value={value}
      />
    )
  }
}

NumberInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.string,
}

NumberInput.defaultProps = {
  onChange: () => { },
  value: 0,
  min: 0,
  max: 99999,
  size: 'medium',
}

export default NumberInput