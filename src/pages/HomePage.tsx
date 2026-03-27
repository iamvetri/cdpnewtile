import React, { Component } from "react";
import { Page, Toast, Button } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { sendRequest } from "../services/container.svc";

<<<<<<< HEAD
export interface IHomeProps extends IBasePropsModel { }
=======
import { IParty, IContact, ICustomData, IIdentificationDocument } from "../models/Party.model";
import { IDeposit, ILoan, IAccountNote } from "../models/Account.model";

import { isNativeApp } from "../services/helper.svc";
import { getPartyDetails, parsePartyResponse } from "../services/productConnector.service";
import HomePageOverview from "../components/HomePageOverview";

export interface IHomeProps extends IBasePropsModel {}
>>>>>>> 3f29da0fe0d6f0a48ef505e60c1ce77cfe8cb87a

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
  whiteSpace: "pre-wrap",
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

<<<<<<< HEAD
=======
    return (
      <Page key="home" id="home" className={this.pageClass} style={{ height: "100%" }}>
        <Toast isOpen={this.state.openToast} className={this.state.toastColor}>
          <div>{this.state.toastMsg}</div>
          <button onClick={this.dismissToast}>OK</button>
        </Toast>

        <div
          className="cdp_page_container home-page-scroll"
          ref={this.pageContainer}
          style={pageScrollStyle}
        >
          {this.renderOverview(party, deposits, loans)}

          {loading && <h3>Loading data...</h3>}

          {!loading && !party && (
            <h3 style={{ color: "gray" }}>No customer data found</h3>
          )}

          {party && this.renderPartyDetails(party)}

          {deposits.length > 0 && (
            <div style={panelStyle}>
              <h2>Deposit Accounts</h2>
              {deposits.map((acc, i) => this.renderDeposit(acc, i))}
            </div>
          )}

          {loans.length > 0 && (
            <div style={panelStyle}>
              <h2>Loan Accounts</h2>
              {loans.map((loan, i) => this.renderLoan(loan, i))}
            </div>
          )}
        </div>
      </Page>
    );
  }

  componentDidMount() {
    if (isNativeApp()) {
      this.pageClass = "native";
    }

    console.log("HomePage componentModel:", this.props.componentModel);
    this.loadData();
  }

  getPartyIdFromOpenData = (): string | null => {
    const model = this.props.componentModel;

    return (
      model?.partyId ||
      model?.customerId ||
      model?.id ||
      model?.party?.id ||
      model?.customer?.id ||
      model?.memberId ||
      model?.connectorRequest?.params?.partyId ||
      model?.connectorRequest?.params?.customerId ||
      model?.connectorRequest?.params?.id ||
      model?.dataSource?.params?.partyId ||
      model?.dataSource?.params?.customerId ||
      model?.dataSource?.params?.id ||
      null
    );
  };

  getPartyConnectorConfig = () => {
    const connectorConfig =
      this.props.componentModel?.connectorRequest ||
      this.props.componentModel?.dataSource;

    if (
      !connectorConfig?.connectorName ||
      !connectorConfig?.connectorVersion ||
      !connectorConfig?.connectorMethod
    ) {
      return null;
    }

    return {
      connectorName: connectorConfig.connectorName,
      connectorVersion: connectorConfig.connectorVersion,
      connectorMethod: connectorConfig.connectorMethod,
      params: connectorConfig.params
    };
  };

  getPreloadedParty = (): IParty | null => {
    return parsePartyResponse(this.props.componentModel?.connectorResponse);
  };

  loadData = async () => {
>>>>>>> 3f29da0fe0d6f0a48ef505e60c1ce77cfe8cb87a
    try {
      const requestPayload = {
        fiId: "cdp-symxchange",
        includeBlankFields: true,
        includeZeroNumerics: true,
        partyId: "13910",
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

<<<<<<< HEAD
      const response = await sendRequest(
        "ClaysysPayrails",
        "1.0",
        "getPartyById",
        requestPayload
      );

      this.setState({
        jsonResponse: JSON.stringify(response, null, 2),
=======
      const preloadedParty = this.getPreloadedParty();
      if (preloadedParty) {
        this.setState({
          party: preloadedParty,
          deposits: [],
          loans: [],
          loading: false
        });
        return;
      }

      const partyId = this.getPartyIdFromOpenData()?.trim() || null;
      const connectorConfig = this.getPartyConnectorConfig();

      if (!partyId && !connectorConfig) {
        console.warn(
          "No partyId or dataSource connector found in componentModel; skipping customer load"
        );
        this.setState({
          party: null,
          deposits: [],
          loans: [],
          loading: false
        });
        return;
      }

      const party = await getPartyDetails(partyId, connectorConfig);

      this.setState({
        party,
        deposits: [],
        loans: [],
>>>>>>> 3f29da0fe0d6f0a48ef505e60c1ce77cfe8cb87a
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
