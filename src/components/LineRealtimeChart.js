import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Chart } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import RealTimePlugin from 'chartjs-plugin-streaming'

class LineRealtimeChart extends Component {
  constructor(props) {
    super(props)

    let borderColor
    let backgroundColor

    switch (props.type) {
      case 'mem':
        borderColor = 'rgb(54, 235, 127)'
        backgroundColor = 'rgba(54, 235, 127, 0.5)'
        break
      case 'cpu':
      default:
        borderColor = 'rgb(54, 162, 235)'
        backgroundColor = 'rgba(54, 162, 235, 0.5)'
        break
    }

    this.state = {
      chartData: {
        datasets: [{
          label: props.type,
          data: [{ x: Date.now(), y: 0 }],
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          lineTension: 0,
        }]
      },
      chartOptions: {
        plugins: {
          streaming: {
            delay: this.props.interval,
            frameRate: 12,
            duration: this.props.interval * 25,
          }
        },
        //animations
        animation: {
          duration: 0,
        },
        hover: {
          animationDuration: 0,
        },
        responsiveAnimationDuration: 0,
        //tooltips
        tooltips: {
          enabled: false,
        },
        //elements
        elements: {
          point: {
            radius: 0,
            hoverRadius: 0,
          }
        },
        //scales
        scales: {
          xAxes: [{
            type: 'realtime',
            ticks: {
              display: false,
            },
          }],
          yAxes: [{
            ticks: {
              suggestedMin: 1,
              suggestedMax: 100,
            }
          }]
        }
      }
    }

  }
  componentDidMount() {
    Chart.pluginService.register({
      realtime: RealTimePlugin
    })
  }
  render() {
    let chartData = { ...this.state.chartData }
    let chartOptions = { ...this.state.chartOptions }

    //push the current value stat
    chartData.datasets[0].data.push({ x: Date.now(), y: this.props.currentValue })

    //set delay and duration according to interval
    chartOptions.plugins.streaming = {
      delay: this.props.interval + 1000,
      frameRate: 12,
      duration: this.props.interval * 25,
    }

    return (
      <Line id={'chart' + this.props.type} data={chartData} options={this.state.chartOptions} width={390} height={150} />
    )
  }
}

LineRealtimeChart.propTypes = {
  type: PropTypes.string.isRequired,
  currentValue: PropTypes.number.isRequired,
  interval: PropTypes.number.isRequired,
}

export default LineRealtimeChart