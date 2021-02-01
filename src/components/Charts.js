import React, { useState, useEffect, useMemo } from "react";
import LineRealtimeChart from "./LineRealtimeChart";
import { Segment, Icon } from "semantic-ui-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const { ipcRenderer } = window.require("electron");
const ev = require("../utils/events");

const Charts = ({ history }) => {
  const [stats, setStats] = useState([]);
  const [currentRecord, setCurrentRecord] = useState({ cpuPercentageUsed: -1, memPercentageUsed: -1 });
  const [indicators, setIndicators] = useState([]);
  const [hasSettings, setHasSettings] = useState(false);
  const [hasStats, setHasStats] = useState(false);

  const onGetStats = (event, stats) => {
    // performance wise saves only last 30 stats
    setStats(stats.slice(-30));
    setHasStats(true);
  };

  const onGetSettings = (event, settings) => {
    setCurrentRecord({
      ...currentRecord,
      interval: settings.interval,
    });
    setIndicators(settings.indicators);
    setHasSettings(true);
  };

  const onStatsUpdated = (event, data) => {
    setCurrentRecord({
      cpuPercentageUsed: data.results.slice(-1)[0].cpu.percentage.used,
      memPercentageUsed: data.results.slice(-1)[0].memory.percentage.used,
      interval: data.interval,
      timestamp: new Date(), // force re-render every "x" seconds
    });
  };

  const goToSettings = () => {
    history.push("/settings");
  };

  const exit = () => {
    MySwal.fire({
      type: "question",
      text: "Are you sure you want to exit?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      showCancelButton: true,
      reverseButtons: true,
    }).then((response) => {
      if (response.value) {
        ipcRenderer.send(ev.EXIT_APP);
      }
    });
  };

  const statsFormat = useMemo(
    () =>
      stats.map((result) => {
        return { cpu: result.cpu.percentage.used, mem: result.memory.percentage.used };
      }),
    [stats]
  );

  useEffect(() => {
    ipcRenderer.send(ev.GET_SETTINGS);
    ipcRenderer.send(ev.GET_STATS);
    ipcRenderer.on(ev.STATS_UPDATED, onStatsUpdated);
    ipcRenderer.on(ev.GET_SETTINGS, onGetSettings);
    ipcRenderer.on(ev.GET_STATS, onGetStats);

    return () => {
      ipcRenderer.removeListener(ev.STATS_UPDATED, onStatsUpdated);
      ipcRenderer.removeListener(ev.GET_SETTINGS, onGetSettings);
      ipcRenderer.removeListener(ev.GET_STATS, onGetStats);
    };
  }, []);

  if (!hasSettings || !hasStats) return null;

  const { cpuPercentageUsed, memPercentageUsed, interval } = currentRecord;

  return (
    <>
      <Segment compact secondary size="tiny" textAlign="right">
        <Icon name="setting" link onClick={goToSettings} />
        <Icon name="power off" link onClick={exit} style={{ marginLeft: 10 }} />
      </Segment>
      <Segment>
        {indicators.map((indicator) => {
          if (!indicator.showGraph) return null;

          let currentValue;

          switch (indicator.short) {
            case "cpu":
              currentValue = cpuPercentageUsed;
              break;
            case "mem":
              currentValue = memPercentageUsed;
              break;
            default:
              currentValue = undefined;
              break;
          }

          return (
            <LineRealtimeChart
              key={indicator.short}
              indicator={indicator}
              currentValue={currentValue}
              interval={interval}
              indicators={indicators}
              stats={statsFormat}
            />
          );
        })}
      </Segment>
    </>
  );
};

export default Charts;
