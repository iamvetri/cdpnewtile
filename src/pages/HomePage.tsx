import React, { Component } from "react";
import { Page, Toast, Button } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { sendRequest } from "../services/container.svc";

export interface IHomeProps extends IBasePropsModel { }

export interface IHomeState extends IBasePageStateModel {
  jsonResponse: string | null;
  loading: boolean;
  openToast: boolean;
  toastMsg: string;
  toastColor: string;
}
const pageScrollStyle: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
  padding: "20px",
  background: "linear-gradient(180deg, #f6f8fb 0%, #edf2f8 100%)"
};

const preStyle: React.CSSProperties = {
  background: "#f0f0f0",
  padding: "15px",
  borderRadius: "8px",
  overflowX: "auto",
  marginTop: "20px",
  border: "1px solid #ccc",
  wordWrap: "break-word"
};

class HomePage extends Component<IHomeProps, IHomeState> {
  pageClass = "desktop";

  state: IHomeState = {
    componentModel: undefined as any,
    jsonResponse: null,
    loading: false,
    openToast: false,
    toastMsg: "",
    toastColor: "danger"
  };

  handleButtonClick = async () => {
    this.setState({ loading: true, jsonResponse: null });

    try {
      const requestPayload = {
        fiId: "cdp-symxchange",
        includeBlankFields: true,
        includeZeroNumerics: true,
        partyId: "12345",
        // Pass the nested one as well just in case the generic connector expects it
        partyMessage: {
          messageContext: {
            fiId: "cdp-symxchange",
            includeBlankFields: true,
            includeZeroNumerics: true
          },
          partyFilter: {
            partyIdList: {
              partyId: ["12345"]
            }
          }
        }
      };

      const response = await sendRequest(
        "ClaysysPayrails",
        "1.0",
        "getPartyById",
        requestPayload
      );

      this.setState({
        jsonResponse: JSON.stringify(response, null, 2),
        loading: false
      });
    } catch (error) {
      this.setState({
        jsonResponse: JSON.stringify(error, null, 2),
        loading: false
      });
      this.showToast("Failed to fetch data", "danger");
    }
  };

  showToast = (msg: string, color: string) => {
    this.setState({ openToast: true, toastMsg: msg, toastColor: color });
  };

  dismissToast = () => {
    this.setState({ openToast: false });
  };

  render() {
    return (
      <Page key="home" id="home" className={this.pageClass} style={{ height: "100%" }}>
        <Toast isOpen={this.state.openToast} className={this.state.toastColor}>
          <div>{this.state.toastMsg}</div>
          <button onClick={this.dismissToast}>OK</button>
        </Toast>

        <div className="cdp_page_container home-page-scroll" style={pageScrollStyle}>
          <h2>Connector Test: getPartyById</h2>
          <p>Connector Name: ClaysysPayrails</p>
          <Button
            onClick={this.handleButtonClick}
            disabled={this.state.loading}
            style={{ marginBottom: "20px" }}
          >
            {this.state.loading ? "Loading..." : "Get Party Data"}
          </Button>

          {this.state.jsonResponse && (
            <div style={{ marginTop: "20px" }}>
              <h3>Response JSON:</h3>
              <pre style={preStyle}>{this.state.jsonResponse}</pre>
            </div>
          )}
        </div>
      </Page>
    );
  }
}

export default HomePage;
