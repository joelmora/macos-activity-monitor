import React, { useMemo } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Line } from "react-chartjs-2";
import "chartjs-plugin-streaming";
import hexRgb from "hex-rgb";
import { Header } from "semantic-ui-react";

const getRGBA = (hex, opacity = 1) => {
  let a = hexRgb(hex);
  return `rgba(${a.red}, ${a.green}, ${a.blue}, ${opacity})`;
};

const getChartOptions = (indicator, interval) => ({
  //title
  legend: { display: false },
  //animations
  animation: { duration: 0 },
  hover: { animationDuration: 0 },
  responsiveAnimationDuration: 0,
  //tooltips
  tooltips: {
    enabled: true,
    callbacks: {
      title: function(tooltipItem) {
        const eventTime = moment(new Date(tooltipItem[0].xLabel))
        return `${eventTime.toNow(true)} ago`;
      },
      label: function(tooltipItem) {
        return `${indicator.name}: ${tooltipItem.yLabel}`;
      },
    },
  },
  //elements
  elements: { point: { radius: 1, hoverRadius: 5 } },
  //scales
  scales: {
    xAxes: [
      {
        type: "realtime",
        realtime: {
          refresh: interval,
          duration: interval * 25, // display last 25 results
          delay: interval * 2, // wait "x" seconds before display to the user
        },
        ticks: { display: false },
        time: { unit: "millisecond", stepSize: interval },
      },
    ],
    yAxes: [{ ticks: { suggestedMin: 1, suggestedMax: 100 } }],
  },
});

const getChartData = (interval, stats, setting, indicator) => {
  const borderColor = getRGBA(setting.color);
  const backgroundColor = getRGBA(setting.color, 0.5);

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

  return {
    datasets: [
      {
        label: indicator.short,
        data,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        lineTension: 0,
      },
    ],
  };
};

const LineRealtimeChart = ({ indicators, indicator, interval, stats, currentValue }) => {
  const setting = useMemo(() => indicators.find((ind) => ind.short === indicator.short), [indicators, indicator]);
  const chartDataBase = useMemo(() => getChartData(interval, stats, setting, indicator), [
    interval,
    stats,
    setting,
    indicator,
  ]);
  const chartOptions = useMemo(() => getChartOptions(indicator, interval), [indicator, interval]);

  //push the current value stat, this has to be done this way so realtime plugin can work
  if (currentValue !== -1) {
    chartDataBase.datasets[0].data.push({ x: Date.now(), y: currentValue });
  }

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
      <Line id={"chart" + indicator.short} data={chartDataBase} options={chartOptions} width={390} height={130} />
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
