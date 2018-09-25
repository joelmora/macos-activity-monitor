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
        borderColor = 'rgb(54, 162, 235)'
        backgroundColor = 'rgba(54, 162, 235, 0.5)'
        break
    }

    this.state = {
      count: 0,
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
            delay: 3000,
            frameRate: 12,
            duration: 50000,
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
    console.log('component mounted')
    Chart.pluginService.register({
      realtime: RealTimePlugin
    })

    // this.updateGraph()
  }
  updateGraph() {
    setInterval(() => {
      this.setState(prevState => {
        let chartData = { ...prevState.chartData }

        chartData.datasets[0].data.push({
          x: Date.now(),
          y: parseInt(Math.random() * 100, 10)
        })

        return { chartData, count: prevState.count + 1 }
      })
    }, 2000)
  }
  render() {
    let chartData = { ...this.state.chartData }

    let date = Date.now() - (this.props.values.length * 2000)

    chartData.datasets[0].data = this.props.values.map(y => {
      date += 2000
      return { x: date, y }
    })

    return (
      <Line id={'chart' + this.props.type} data={chartData} options={this.state.chartOptions} width={390} height={150} />
    )
  }
}

LineRealtimeChart.propTypes = {
  type: PropTypes.string.isRequired,
  values: PropTypes.array.isRequired
}

export default LineRealtimeChart
