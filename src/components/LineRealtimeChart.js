import React, { useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Chart } from "react-chartjs-2";
import { Line } from "react-chartjs-2";
import RealTimePlugin from "chartjs-plugin-streaming";
import hexRgb from "hex-rgb";
import { Header } from "semantic-ui-react";

const getRGBA = (hex, opacity = 1) => {
  let a = hexRgb(hex);
  return `rgba(${a.red}, ${a.green}, ${a.blue}, ${opacity})`;
};

const LineRealtimeChart = ({ indicators, indicator, interval, stats, currentValue }) => {
  const setting = useMemo(() => indicators.find((ind) => ind.short === indicator.short), [indicators, indicator]);
  const borderColor = getRGBA(setting.color);
  const backgroundColor = getRGBA(setting.color, 0.5);

  const chartData = useMemo(
    () => {
      //render previous stats if exist
      const data = [];
      let date = Date.now() - (interval * stats.length + 1);

      //zero value
      data.push({ x: date, y: 0 });
      date += interval;

      for (let stat of stats) {
        data.push({ x: date, y: stat[indicator.short] });
        date += interval;
      }

      //push the current value stat
      if (currentValue !== -1) {
        data.push({ x: Date.now(), y: currentValue });
      }

      return {
        datasets: [
          {
            label: indicator.short,
            data: data,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            borderWidth: 2,
            lineTension: 0,
          },
        ],
      };
    },
    [interval, stats, currentValue]
  );

  const chartOptions = useMemo(
    () => ({
      //title
      legend: {
        display: false,
      },
      plugins: {
        streaming: {
          delay: interval,
          frameRate: 12,
          duration: interval * 25,
        },
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
        },
      },
      //scales
      scales: {
        xAxes: [
          {
            type: "realtime",
            ticks: {
              display: false,
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              suggestedMin: 1,
              suggestedMax: 100,
            },
          },
        ],
      },
    }),
    [interval]
  );

  useEffect(() => {
    Chart.pluginService.register({
      realtime: RealTimePlugin,
    });
  }, []);

  return (
    <>
      <div className="flex legend-container">
        <div
          className="legend-square"
          style={{ borderColor: indicator.color, background: getRGBA(indicator.color, 0.5) }}
        />
        <Header as="h4" style={{ margin: 0 }}>
          {indicator.name}
        </Header>
      </div>
      <Line id={"chart" + indicator.short} data={chartData} options={chartOptions} width={390} height={130} />
    </>
  );
};

LineRealtimeChart.propTypes = {
  indicators: PropTypes.array.isRequired,
  indicator: PropTypes.object.isRequired,
  currentValue: PropTypes.number.isRequired,
  interval: PropTypes.number.isRequired,
  stats: PropTypes.array,
};

export default LineRealtimeChart;
