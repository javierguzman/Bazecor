// -*- mode: js-jsx -*-
/* Bazecor -- Kaleidoscope Command Center
 * Copyright (C) 2018, 2019  Keyboardio, Inc.
 * Copyright (C) 2019  DygmaLab SE
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import { ipcRenderer } from "electron";
import Styled from "styled-components";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { toast } from "react-toastify";
import i18n from "@Renderer/i18n";
import "react-toastify/dist/ReactToastify.css";

// Custom modules imports
import { KeyboardSettings } from "@Renderer/modules/Settings/KeyboardSettings";
import { BackupSettings, GeneralSettings, NeuronSettings, AdvancedSettings } from "@Renderer/modules/Settings";

import { PageHeader } from "@Renderer/modules/PageHeader";
import ToastMessage from "@Renderer/component/ToastMessage";
import { RegularButton } from "@Renderer/component/Button";
import { IconFloppyDisk } from "@Renderer/component/Icon";
import Version from "@Renderer/component/Version/Version";

import Store from "@Renderer/utils/Store";
import Focus from "../../api/focus";
import Backup from "../../api/backup";

const store = Store.getStore();

const Styles = Styled.div`
  .toggle-button{
    text-align: center;
    padding-bottom: 8px;
  }
`;

class Preferences extends React.Component {
  constructor(props) {
    super(props);
    this.bkp = new Backup();

    this.kbData = {
      keymap: {
        custom: [],
        default: [],
        onlyCustom: true,
      },
      ledBrightness: 255,
      ledBrightnessUG: 255,
      defaultLayer: 126,
      ledIdleTimeLimit: 0,
      qukeysHoldTimeout: 0,
      qukeysOverlapThreshold: 0,
      SuperTimeout: 0,
      SuperRepeat: 20,
      SuperWaitfor: 500,
      SuperHoldstart: 0,
      SuperOverlapThreshold: 0,
      mouseSpeed: 1,
      mouseSpeedDelay: 2,
      mouseAccelSpeed: 1,
      mouseAccelDelay: 2,
      mouseWheelSpeed: 1,
      mouseWheelDelay: 100,
      mouseSpeedLimit: 1,
      modified: props.inContext,
      showDefaults: false,
    };

    this.state = {
      devTools: false,
      advanced: false,
      verboseFocus: false,
      darkMode: "system",
      neurons: store.get("neurons"),
      selectedNeuron: 0,
      neuronID: "",
      kbData: this.kbData,
      modified: props.inContext,
    };
  }

  async componentDidMount() {
    const focus = new Focus();
    const devTools = await ipcRenderer.invoke("is-devtools-opened");
    this.setState({ devTools });
    ipcRenderer.on("opened-devtool", (event, arg) => {
      this.setState({ devTools: true });
    });
    ipcRenderer.on("closed-devtool", (event, arg) => {
      this.setState({ devTools: false });
    });

    this.setState({ verboseFocus: focus.debug });

    let darkModeSetting = store.get("settings.darkMode");
    if (darkModeSetting === undefined) {
      darkModeSetting = "system";
    }
    this.setState({ darkMode: darkModeSetting });

    await this.getNeuronData();
  }

  getNeuronData = async () => {
    const focus = new Focus();

    // EXTRACTING DATA FROM NEURON
    await focus.command("hardware.chip_id").then(neuronID => {
      neuronID = neuronID.replace(/\s/g, "");
      this.setState({ neuronID });
    });

    await focus.command("settings.defaultLayer").then(layer => {
      layer = layer ? parseInt(layer) : 126;
      this.kbData.defaultLayer = layer <= 126 ? layer : 126;
    });
    await focus.command("keymap").then(keymap => {
      this.kbData.keymap = keymap;
    });
    await focus.command("keymap.onlyCustom").then(onlyCustom => {
      this.kbData.keymap.onlyCustom = onlyCustom;
    });
    await focus.command("led.brightness").then(brightness => {
      brightness = brightness ? parseInt(brightness) : -1;
      this.kbData.ledBrightness = brightness;
    });

    await focus.command("led.brightnessUG").then(brightness => {
      brightness = brightness ? parseInt(brightness) : -1;
      this.kbData.ledBrightnessUG = brightness;
    });

    await focus.command("idleleds.time_limit").then(limit => {
      this.kbData.ledIdleTimeLimit = limit ? parseInt(limit) : -1;
    });

    this.kbData.showDefaults = store.get("settings.showDefaults") == undefined ? false : store.get("settings.showDefaults");

    // QUKEYS variables commands
    await focus.command("qukeys.holdTimeout").then(holdTimeout => {
      holdTimeout = holdTimeout ? parseInt(holdTimeout) : 250;
      this.kbData.qukeysHoldTimeout = holdTimeout;
    });

    await focus.command("qukeys.overlapThreshold").then(overlapThreshold => {
      overlapThreshold = overlapThreshold ? parseInt(overlapThreshold) : 80;
      this.kbData.qukeysOverlapThreshold = overlapThreshold;
    });

    // SuperKeys variables commands
    await focus.command("superkeys.timeout").then(timeout => {
      timeout = timeout ? parseInt(timeout) : 250;
      this.kbData.SuperTimeout = timeout;
    });

    await focus.command("superkeys.holdstart").then(holdstart => {
      holdstart = holdstart ? parseInt(holdstart) : 200;
      this.kbData.SuperHoldstart = holdstart;
    });

    // MOUSE variables commands
    await focus.command("mouse.speed").then(speed => {
      speed = speed ? parseInt(speed) : 1;
      this.kbData.mouseSpeed = speed;
    });

    await focus.command("mouse.accelSpeed").then(accelSpeed => {
      accelSpeed = accelSpeed ? parseInt(accelSpeed) : 1;
      this.kbData.mouseAccelSpeed = accelSpeed;
    });

    await focus.command("mouse.wheelSpeed").then(wheelSpeed => {
      wheelSpeed = wheelSpeed ? parseInt(wheelSpeed) : 1;
      this.kbData.mouseWheelSpeed = wheelSpeed;
    });

    await focus.command("mouse.speedLimit").then(speedLimit => {
      speedLimit = speedLimit ? parseInt(speedLimit) : 127;
      this.kbData.mouseSpeedLimit = speedLimit;
    });

    // Save in state
    this.setState({ kbData: this.kbData });
  };

  saveKeymapChanges = async () => {
    const focus = new Focus();

    const {
      keymap,
      defaultLayer,
      showDefaults,
      ledBrightness,
      ledBrightnessUG,
      ledIdleTimeLimit,
      qukeysHoldTimeout,
      qukeysOverlapThreshold,
      SuperTimeout,
      SuperRepeat,
      SuperWaitfor,
      SuperHoldstart,
      mouseSpeed,
      mouseSpeedDelay,
      mouseAccelSpeed,
      mouseAccelDelay,
      mouseWheelSpeed,
      mouseWheelDelay,
      mouseSpeedLimit,
    } = this.kbData;

    await await focus.command("keymap.onlyCustom", keymap.onlyCustom);
    await await focus.command("settings.defaultLayer", defaultLayer);
    await await focus.command("led.brightness", ledBrightness);
    await await focus.command("led.brightnessUG", ledBrightnessUG);
    if (ledIdleTimeLimit >= 0) await await focus.command("idleleds.time_limit", ledIdleTimeLimit);
    store.set("settings.showDefaults", showDefaults);
    // QUKEYS
    await await focus.command("qukeys.holdTimeout", qukeysHoldTimeout);
    await await focus.command("qukeys.overlapThreshold", qukeysOverlapThreshold);
    // SUPER KEYS
    await await focus.command("superkeys.timeout", SuperTimeout);
    await await focus.command("superkeys.repeat", SuperRepeat);
    await await focus.command("superkeys.waitfor", SuperWaitfor);
    await await focus.command("superkeys.holdstart", SuperHoldstart);
    // MOUSE KEYS
    await await focus.command("mouse.speed", mouseSpeed);
    await await focus.command("mouse.speedDelay", mouseSpeedDelay);
    await await focus.command("mouse.accelSpeed", mouseAccelSpeed);
    await await focus.command("mouse.accelDelay", mouseAccelDelay);
    await await focus.command("mouse.wheelSpeed", mouseWheelSpeed);
    await await focus.command("mouse.wheelDelay", mouseWheelDelay);
    await await focus.command("mouse.speedLimit", mouseSpeedLimit);

    // TODO: Review toast popup on try/catch works well.
    try {
      const commands = await this.bkp.Commands();
      const backup = await this.bkp.DoBackup(commands, this.state.neuronID);
      this.bkp.SaveBackup(backup);
      toast.success(<ToastMessage title={i18n.success.preferencesSaved} icon={<IconFloppyDisk />} />, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        icon: "",
      });
    } catch (error) {
      console.error(error);
      toast.error(
        <ToastMessage
          title={i18n.errors.preferenceFailOnSave}
          content={i18n.errors.preferenceFailOnSaveBody}
          icon={<IconFloppyDisk />}
        />,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          icon: "",
        },
      );
    }

    this.destroyContext();
  };

  destroyContext = () => {
    this.kbData.modified = false;
    this.setState({ modified: false });
    this.getNeuronData();
    this.props.cancelContext();
  };

  // GENERAL FUNCTIONS
  setLanguage = async event => {
    i18n.setLanguage(event.target.value);
    await this.setState({});
    await store.set("settings.language", event.target.value);
  };

  setKbData = kbData => {
    if (this.kbData.modified == false && kbData.modified == true) {
      this.kbData = kbData;
      this.props.startContext();
      this.setState({ modified: kbData.modified });
    } else {
      this.kbData = kbData;
    }
  };

  selectDefaultLayer = value => {
    if (this.kbData.modified == false) {
      this.kbData.modified = true;
      this.setState({ modified: true });
      this.props.startContext();
      this.kbData.defaultLayer = parseInt(value);
    } else {
      this.kbData.defaultLayer = parseInt(value);
      this.forceUpdate();
    }
  };

  // ADVANCED FUNCTIONS
  toggleAdvanced = () => {
    this.setState(state => ({
      advanced: !state.advanced,
    }));
  };

  toggleDevTools = async event => {
    this.setState({ devTools: event.target.checked });
    await ipcRenderer.invoke("manage-devtools", event.target.checked);
    this.props.startContext();
  };

  // THEME MODE FUNCTIONS
  selectDarkMode = key => {
    this.setState({ darkMode: key });
    this.props.toggleDarkMode(key);
  };

  toggleVerboseFocus = event => {
    const focus = new Focus();
    focus.debug = !this.state.verboseFocus;
    this.setState({ verboseFocus: !this.state.verboseFocus });
  };

  toggleOnlyCustom = event => {
    const newkbData = this.kbData;
    newkbData.keymap.onlyCustom = event.target.checked;
    newkbData.modified = true;
    this.setState({ modified: true });
    this.props.startContext();
  };

  // NEURON FUNCTIONS
  selectNeuron = value => {
    this.setState({
      selectedNeuron: parseInt(value),
    });
  };

  updateNeuronName = data => {
    const temp = this.state.neurons;
    temp[this.state.selectedNeuron].name = data;
    this.setState({
      neurons: temp,
    });
    this.applyNeuronName(temp);
  };

  applyNeuronName = neurons => {
    store.set("neurons", neurons);
  };

  deleteNeuron = async () => {
    const result = await window.confirm(i18n.keyboardSettings.neuronManager.deleteNeuron);
    if (result) {
      const temp = JSON.parse(JSON.stringify(this.state.neurons));
      temp.splice(this.state.selectedNeuron, 1);
      this.setState({
        neurons: temp,
        selectedNeuron: temp.length - 1 > this.selectNeuron ? this.selectNeuron : temp.length - 1,
      });
      store.set("neurons", temp);
    }
  };

  render() {
    const { neurons, selectedNeuron, darkMode, neuronID, devTools, verboseFocus, kbData, modified } = this.state;
    const { inContext, connected, allowBeta, updateAllowBeta } = this.props;
    const { defaultLayer } = this.kbData;
    const devToolsSwitch = <Form.Check type="switch" checked={devTools} onChange={this.toggleDevTools} />;
    const verboseSwitch = <Form.Check type="switch" checked={verboseFocus} onChange={this.toggleVerboseFocus} />;
    const onlyCustomSwitch = <Form.Check type="switch" checked={kbData.keymap.onlyCustom} onChange={this.toggleOnlyCustom} />;
    const allowBetas = <Form.Check value={allowBeta} type="switch" checked={allowBeta} onChange={updateAllowBeta} />;
    const pairingButton = <RegularButton buttonText={"Re-Pair RF"} styles="short warning sm" onClick={this.sendRePairCommand} />;
    // console.log("CHECKING STATUS MOD", modified);
    // console.log("CHECKING STATUS CTX", inContext);

    return (
      <Styles>
        <Container fluid>
          <PageHeader
            text={i18n.preferences.title}
            style="pageHeaderFlatBottom"
            showSaving
            showContentSelector={false}
            saveContext={this.saveKeymapChanges}
            destroyContext={this.destroyContext}
            inContext={modified}
          />
          {this.state.working && <Spinner role="status" />}
          <div className="wrapper wrapperBackground">
            <Container fluid>
              <Row className="justify-content-center">
                <Col lg={9} xl={6}>
                  <GeneralSettings
                    selectDarkMode={this.selectDarkMode}
                    darkMode={darkMode}
                    neurons={neurons}
                    selectedNeuron={selectedNeuron}
                    defaultLayer={defaultLayer}
                    selectDefaultLayer={this.selectDefaultLayer}
                    connected={connected}
                  />
                  <BackupSettings neurons={neurons} selectedNeuron={selectedNeuron} neuronID={neuronID} connected={connected} />
                  <NeuronSettings
                    neurons={neurons}
                    selectedNeuron={selectedNeuron}
                    selectNeuron={this.selectNeuron}
                    updateNeuronName={this.updateNeuronName}
                    deleteNeuron={this.deleteNeuron}
                  />
                  <KeyboardSettings kbData={kbData} setKbData={this.setKbData} connected={connected} />
                  <AdvancedSettings
                    devToolsSwitch={devToolsSwitch}
                    verboseSwitch={verboseSwitch}
                    onlyCustomSwitch={onlyCustomSwitch}
                    allowBetas={allowBetas}
                    pairingButton={<></>}
                    connected={connected}
                  />
                  <Version />
                </Col>
              </Row>
            </Container>
          </div>
        </Container>
      </Styles>
    );
  }
}

export default Preferences;
