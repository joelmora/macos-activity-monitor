import React, { useState, useEffect } from "react";
import { Segment, Header, Form, Divider, Button, Checkbox, Radio, Icon, Table } from "semantic-ui-react";
import { TwitterPicker } from "react-color";
import NumberInput from "./NumberInput";

const { ipcRenderer } = window.require("electron");
const ev = require("../utils/events");

const Settings = ({ history }) => {
  const [hasSettings, setHasSettings] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [interval, setInterval] = useState(0);
  const [launchOnLogin, setLaunchOnLogin] = useState();
  const [colorPickerIndex, setColorPickerIndex] = useState();
  const [pickerContainer, setPickerContainer] = useState();

  const onGetSettings = (event, settings) => {
    setIndicators(settings.indicators);
    setInterval(settings.interval);
    setLaunchOnLogin(settings.launchOnLogin);
    setColorPickerIndex(settings.indicators.findIndex((ind) => ind.showColorPicker === true));
    setHasSettings(true);
  };

  /**
   * Changes a key in the indicator array
   */
  const changeKey = (i, key, value) => {
    const indicatorsClone = [...indicators];

    indicatorsClone[i][key] = value;

    setIndicators(indicatorsClone);
  };

  /**
   * Toggle an indicator in the indicator array
   */
  const toggle = (key, i) => {
    const value = indicators[i][key];
    changeKey(i, key, !value);

    //redraw icons in case of on/off indicators
    ipcRenderer.send(ev.REDRAW_ICONS);
  };

  /**
   * Change indicator color
   */
  const changeColor = (i, color) => changeKey(i, "color", color.hex);

  /**
   * Change the interval
   */
  const changeInterval = (ev, input) => {
    const [cleanValue] = input.value.toString().match(/(\d+)/) || new Array(1);
    const interval = parseInt(cleanValue * 1000, 10);

    if (cleanValue) {
      setInterval(interval);
    } else {
      setInterval(0);
    }
  };

  const toggleLaunchOnLogin = () => {
    setLaunchOnLogin(!launchOnLogin);
  };

  /**
   * Send event to electron process to trigger setting change
   */
  const changeSettings = () => {
    ipcRenderer.send(ev.SETTINGS_CHANGED, { interval, indicators, launchOnLogin });
  };

  const showColorPicker = (i) => {
    setColorPickerIndex(i);
    toggle("showColorPicker", i);
  };

  const goToHome = () => history.push("/");

  const handlePickerBlur = (node) => setPickerContainer(node);

  const handleClickOutside = (event) => {
    //clicked outside color picker
    if (pickerContainer && !pickerContainer.contains(event.target)) {
      toggle("showColorPicker", colorPickerIndex);
    }
  };

  useEffect(() => {
    ipcRenderer.send(ev.GET_SETTINGS);
    document.addEventListener("mousedown", handleClickOutside);
    ipcRenderer.on(ev.GET_SETTINGS, onGetSettings);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      ipcRenderer.removeListener(ev.GET_SETTINGS, onGetSettings);
    };
  }, []);

  useEffect(
    () => {
      if (hasSettings) {
        changeSettings();
      }
    },
    [interval, indicators, launchOnLogin]
  );

  if (!hasSettings) return null;

  return (
    <>
      <Segment compact secondary size="tiny" textAlign="center" className="flex flex-just-sb">
        <Icon name="arrow left" link onClick={goToHome} />
        <Header as="h4" style={{ margin: 0 }}>
          Settings
        </Header>
        <div>&nbsp;</div>
      </Segment>

      <Segment>
        <Table basic="very" compact="very" size="small" unstackable celled columns={3}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell textAlign="center">Graph</Table.HeaderCell>
              <Table.HeaderCell textAlign="center">Icon</Table.HeaderCell>
              <Table.HeaderCell>Color</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {indicators.map((attr, i) => (
              <Table.Row key={i}>
                <Table.Cell>{attr.name}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Radio toggle checked={attr.showGraph} onChange={toggle.bind(this, "showGraph", i)} />
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Radio toggle checked={attr.showIcon} onChange={toggle.bind(this, "showIcon", i)} />
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="tiny"
                    icon="dropdown"
                    style={{ backgroundColor: attr.color }}
                    onClick={showColorPicker.bind(this, i)}
                  />
                  {attr.showColorPicker && (
                    <div ref={handlePickerBlur} style={{ position: "absolute", zIndex: 5000, marginLeft: -238 }}>
                      <TwitterPicker onChangeComplete={changeColor.bind(this, i)} triangle="top-right" />
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        <Divider />

        <Form>
          <Form.Field inline>
            <label>Update Graph Every</label>
            <NumberInput value={interval / 1000} size="small" min={0} max={300} onChange={changeInterval} />
            <span style={{ marginLeft: 10 }}>Seconds</span>
          </Form.Field>

          <Form.Field inline>
            <Checkbox label="Launch at Login" checked={launchOnLogin} onChange={toggleLaunchOnLogin} />
          </Form.Field>
        </Form>
      </Segment>
    </>
  );
};

export default Settings;
