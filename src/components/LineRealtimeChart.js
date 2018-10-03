import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Chart } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import RealTimePlugin from 'chartjs-plugin-streaming'
import hexRgb from 'hex-rgb'

class LineRealtimeChart extends Component {
  constructor(props) {
    super(props)

    let setting = props.indicators.find(ind => ind.short === props.type)
    let borderColor = this.getRGBA(setting.color)
    let backgroundColor = this.getRGBA(setting.color, 0.5)

    //render previous stats if exist
    let data = []
    let date = Date.now() - (props.interval * props.stats.length + 1)

    //zero value
    data.push({ x: date, y: 0 })
    date += props.interval

    props.stats.map(stat => {
      data.push({ x: date, y: stat[props.type] })
      date += props.interval
    })

    this.state = {
      chartData: {
        datasets: [{
          label: props.type,
          data: data,
          // data: [{ x: Date.now(), y: 0 }],
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
  getRGBA = (hex, opacity = 1) => {
    let a = hexRgb(hex)
    return `rgba(${a.red}, ${a.green}, ${a.blue}, ${opacity})`
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
    if (this.props.currentValue !== -1) {
      chartData.datasets[0].data.push({ x: Date.now(), y: this.props.currentValue })
    }

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
  stats: PropTypes.array,
}

export default LineRealtimeChart
