import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Chart } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import RealTimePlugin from 'chartjs-plugin-streaming'

class LineRealtimeChart extends Component {
  constructor(props) {
    super(props)

    this.state = {
      count: 0,
      chartData: {
        datasets: [{
          label: props.type,
          data: [{ x: Date.now(), y: 0 }],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
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
    Chart.pluginService.register({
      realtime: RealTimePlugin
    })

    this.updateGraph()
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
    return (
      <Line id={'chart' + this.props.type} data={this.state.chartData} options={this.state.chartOptions} width={390} height={150} />
    )
  }
}

LineRealtimeChart.propTypes = {
  type: PropTypes.string.isRequired
}

export default LineRealtimeChart
