import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Chart } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import RealTimePlugin from 'chartjs-plugin-streaming'
import hexRgb from 'hex-rgb'
import { Header } from 'semantic-ui-react'

class LineRealtimeChart extends Component {
  constructor(props) {
    super(props)

    let setting = props.indicators.find(ind => ind.short === props.indicator.short)
    let borderColor = this.getRGBA(setting.color)
    let backgroundColor = this.getRGBA(setting.color, 0.5)

    //render previous stats if exist
    let data = []
    let date = Date.now() - (props.interval * props.stats.length + 1)

    //zero value
    data.push({ x: date, y: 0 })
    date += props.interval

    for (let stat of props.stats) {
      data.push({ x: date, y: stat[props.indicator.short] })
      date += props.interval
    }

    this.state = {
      chartData: {
        datasets: [{
          label: props.indicator.short,
          data: data,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          lineTension: 0,
        }]
      },
      chartOptions: {
        //title
        legend: {
          display: false,
        },
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
      <React.Fragment>
        <div className="flex legend-container">
          <div className="legend-square" style={{  borderColor: this.props.indicator.color, background: this.getRGBA(this.props.indicator.color, 0.5) }}>
          </div>
          <Header as='h4' style={{ margin: 0 }}>{this.props.indicator.name}</Header>
        </div>
        <Line id={'chart' + this.props.indicator.short} data={chartData} options={this.state.chartOptions} width={390} height={130} />
      </React.Fragment>
    )
  }
}

LineRealtimeChart.propTypes = {
  indicators: PropTypes.array.isRequired,
  indicator: PropTypes.object.isRequired,
  currentValue: PropTypes.number.isRequired,
  interval: PropTypes.number.isRequired,
  stats: PropTypes.array,
}

export default LineRealtimeChart
