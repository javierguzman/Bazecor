import React, { Component } from "react";
import classNames from "classnames";
import MacroTable from "./MacroTable";
import MacroSelector from "./MacroSelector";

import { withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  margin: {
    margin: theme.spacing.unit
  },
  textField: {
    flexBasis: 200,
    display: "flex"
  },
  code: {
    width: "-webkit-fill-available"
  },
  button: {
    float: "right"
  },
  bg: {
    backgroundColor: "#f9f9f9",
    padding: "16px",
    borderLeft: "solid 1px lightgrey"
  },
  bglist: {
    backgroundColor: "#eeeeee"
  },
  buttons: {
    display: "flex",
    position: "relative",
    placeContent: "space-between"
  }
});

class MacroForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      macros: props.macros,
      selected: props.selected,
      name:
        props.macros[props.selected] === undefined
          ? ""
          : props.macros[props.selected].name,
      id:
        props.macros[props.selected] === undefined
          ? 0
          : props.macros[props.selected].id,
      actions:
        props.macros[props.selected] === undefined
          ? []
          : props.macros[props.selected].actions,
      text:
        props.macros[props.selected] === undefined
          ? ""
          : props.macros[props.selected].macro
    };

    this.updateMacro = this.updateMacro.bind(this);
    this.updateActions = this.updateActions.bind(this);
    this.updateSelected = this.updateSelected.bind(this);
    this.toExport = this.toExport.bind(this);
    this.toImport = this.toImport.bind(this);
  }

  updateMacro() {
    let macros = this.state.macros;
    if (macros[this.state.selected] === undefined) {
      this.setState({ macros });
      this.props.accept(macros);
      return;
    }
    macros[this.state.selected].name = this.state.name;
    macros[this.state.selected].actions = this.state.actions;
    macros[this.state.selected].macro = this.state.text;
    this.setState({ macros });
    this.props.accept(macros);
  }

  updateActions(actions, text) {
    this.setState({
      actions,
      text
    });
  }

  updateSelected(selected) {
    this.setState({
      selected
    });
    this.props.changeSelected(selected);
  }

  toImport() {
    let options = {
      //Placeholder 1
      title: "Load Macro file",

      //Placeholder 4
      buttonLabel: "Load Macro",

      //Placeholder 3
      filters: [
        { name: "Json", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    };
    const remote = require("electron").remote;
    const WIN = remote.getCurrentWindow();
    remote.dialog
      .showOpenDialog(WIN, options)
      .then(resp => {
        if (!resp.canceled) {
          console.log(resp.filePaths);
          const macro = JSON.parse(
            require("fs").readFileSync(resp.filePaths[0])
          );
          console.log(macro);
          this.updateActions(macro.actions, macro.text);
          const newMacros = this.state.macros;
          newMacros[this.state.selected] = macro;
          this.setState({
            name: macro.name,
            macros: newMacros
          });
        } else {
          console.log("user closed SaveDialog");
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  toExport() {
    const toExport = JSON.stringify({
      name: this.state.name,
      actions: this.state.actions,
      text: this.state.text
    });
    let options = {
      //Placeholder 1
      title: "Save Macro file",

      //Placeholder 2
      defaultPath: this.state.name,

      //Placeholder 4
      buttonLabel: "Save Macro",

      //Placeholder 3
      filters: [
        { name: "Json", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    };
    const remote = require("electron").remote;
    const WIN = remote.getCurrentWindow();
    remote.dialog
      .showSaveDialog(WIN, options)
      .then(resp => {
        if (!resp.canceled) {
          console.log(resp.filePath, toExport);
          require("fs").writeFileSync(resp.filePath, toExport);
        } else {
          console.log("user closed SaveDialog");
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    const { classes, close, keymapDB } = this.props;
    return (
      <Grid container direction="row" justify="center" alignItems="stretch">
        <Grid item xs={5} className={classes.bglist}>
          <MacroSelector
            key={this.state.macros.lenght}
            macros={this.state.macros}
            selected={this.state.selected}
            updateSelected={this.updateSelected}
            deleteMacro={this.props.deleteMacro}
            addMacro={this.props.addMacro}
            duplicateMacro={this.props.duplicateMacro}
          />
        </Grid>
        <Grid item xs={7} className={classes.bg}>
          <TextField
            id="name"
            className={classNames(classes.margin, classes.textField)}
            variant="standard"
            label="Macro Name"
            value={this.state.name}
            onChange={e => {
              this.setState({ name: e.target.value });
            }}
          />
          <MacroTable
            key={this.state.selected + this.state.name}
            macro={this.state.macros[this.state.selected]}
            updateActions={this.updateActions}
            keymapDB={keymapDB}
            number={this.props.macros.length}
          />
          <div className={classes.buttons}>
            <Button
              variant="outlined"
              color="secondary"
              className={classes.margin}
              onClick={close}
            >
              {"Cancel"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              className={classes.margin}
              onClick={this.toImport}
            >
              {"Import"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              className={classes.margin}
              onClick={this.toExport}
            >
              {"Export"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              className={classNames(classes.margin, classes.button)}
              onClick={this.updateMacro}
            >
              {"Apply & Exit"}
            </Button>
          </div>
        </Grid>
      </Grid>
    );
  }
}
export default withStyles(styles)(MacroForm);
