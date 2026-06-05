import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import container, { sendRequest } from "../services/container.svc";
import LoadingScreen from "../components/LoadingScreen";

export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel {
  isLoading: boolean;
  errorMessage: string;
  iframeUrl: string;
  connectorResponse: any;
}

class HomePage extends Component<IHomeProps, IHomeState> {
  pageClass = "desktop";
  requestPayload = {
    url: "https://dummyjson.com/products"
  };

  state: IHomeState = {
    componentModel: undefined as any,
    openToast: false,
    toastMsg: "",
    isLoading: true,
    errorMessage: "",
    iframeUrl: "",
    connectorResponse: null
  };

  componentDidMount(): void {
    this.loadIframeFromConnector();
  }

  extractIframeUrl(response: any): string {
    if (!response) {
      return "";
    }

    const urlFromKnownPaths =
      response?.response?.data?.extConnResponse?.data?.name ??
      response?.response?.data?.extConnResponse?.data?.url ??
      response?.response?.data?.data?.name ??
      response?.response?.data?.data?.url ??
      response?.response?.data?.name ??
      response?.response?.data?.url ??
      response?.data?.extConnResponse?.data?.name ??
      response?.data?.extConnResponse?.data?.url ??
      response?.data?.data?.name ??
      response?.data?.data?.url ??
      response?.data?.name ??
      response?.data?.url ??
      response?.extConnResponse?.data?.name ??
      response?.extConnResponse?.data?.url ??
      response?.name ??
      response?.url;

    if (typeof urlFromKnownPaths === "string") {
      const normalizedUrl = urlFromKnownPaths.trim();
      if (/^https?:\/\//i.test(normalizedUrl)) {
        return normalizedUrl;
      }
    }

    return this.findFirstHttpUrl(response);
  }

  findFirstHttpUrl(input: any): string {
    const visited = new WeakSet<object>();
    const queue: any[] = [input];

    while (queue.length > 0) {
      const current = queue.shift();

      if (typeof current === "string") {
        const normalized = current.trim();
        if (/^https?:\/\//i.test(normalized)) {
          return normalized;
        }
        continue;
      }

      if (!current || typeof current !== "object") {
        continue;
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        for (let i = 0; i < current.length; i += 1) {
          queue.push(current[i]);
        }
        continue;
      }

      const values = Object.values(current);
      for (let i = 0; i < values.length; i += 1) {
        queue.push(values[i]);
      }
    }

    return "";
  }

  getConnectorErrorMessage(response: any): string {
    if (!response) {
      return "";
    }

    return (
      response?.response?.message ??
      response?.message ??
      ""
    );
  }

  loadIframeFromConnector = async () => {
    this.setState({
      isLoading: true,
      errorMessage: "",
      iframeUrl: "",
      connectorResponse: null
    });

    try {
      const response = await sendRequest(
        "claysysbasiccdptransfers",
        "1.0",
        "externalCallMethod",
        this.requestPayload
      );
      const baseIframeUrl = this.extractIframeUrl(response);
      const connectorError = this.getConnectorErrorMessage(response);
      const isRequestFailed =
        response?.success === false || response?.response?.success === false;

      if (isRequestFailed) {
        this.setState({
          isLoading: false,
          connectorResponse: response,
          iframeUrl: "",
          errorMessage: connectorError || "Connector request failed."
        });
        return;
      }

      if (!baseIframeUrl) {
        this.setState({
          isLoading: false,
          connectorResponse: response,
          iframeUrl: "",
          errorMessage: "Request succeeded, but no iframe URL found in connector response."
        });
        return;
      }

      // Fetch device location and append to URL
      this.fetchDeviceLocationAndUpdateUrl(baseIframeUrl, response);
    } catch (error: any) {
      this.setState({
        isLoading: false,
        errorMessage: error?.message || "Failed to call connector request.",
        connectorResponse: error || null,
        iframeUrl: ""
      });
    }
  };

  fetchDeviceLocationAndUpdateUrl = (baseUrl: string, connectorResponse: any) => {
    const device = container?.device;
    const getLocation = device?.getLocation;

    if (typeof getLocation !== "function") {
      // If device location is not available, use base URL as is
      this.setState({
        isLoading: false,
        connectorResponse: connectorResponse,
        iframeUrl: baseUrl,
        errorMessage: ""
      });
      return;
    }

    getLocation.call(device, (locationResponse: any) => {
      let finalUrl = baseUrl;

      if (locationResponse?.success && locationResponse?.data) {
        const lat = locationResponse.data.lat;
        const long = locationResponse.data.long;

        if (lat != null && long != null) {
          const separator = baseUrl.includes("?") ? "&" : "?";
          finalUrl = `${baseUrl}${separator}lat=${lat}&long=${long}`;
        }
      }

      this.setState({
        isLoading: false,
        connectorResponse: connectorResponse,
        iframeUrl: finalUrl,
        errorMessage: ""
      });
    });
  };

  render() {
    const { isLoading, errorMessage, iframeUrl, connectorResponse } = this.state;

    if (iframeUrl) {
      return (
        <Page key="home" id="home" className={this.pageClass} style={{ margin: 0, padding: 0 }}>
          <iframe
            src={iframeUrl}
            title="Connector Website"
            style={iframeFullStyle}
            allow="geolocation *"
            sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </Page>
      );
    }

    return (
      <Page key="home" id="home" className={this.pageClass} style={{ margin: 0, padding: 0 }}>
        {isLoading ? <LoadingScreen /> : null}
        <div style={statusContainerStyle}>
          {errorMessage ? <div style={errorTextStyle}>{errorMessage}</div> : null}
          {connectorResponse ? (
            <details style={detailsStyle}>
              <summary>Connector Response</summary>
              <pre style={responsePreStyle}>{JSON.stringify(connectorResponse, null, 2)}</pre>
            </details>
          ) : null}
        </div>
      </Page>
    );
  }
}

/* ─── Styles ──────────────────────────────────────────────────────────── */

const statusContainerStyle: React.CSSProperties = {
  padding: "16px",
  minHeight: "100vh",
  boxSizing: "border-box"
};

const errorTextStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#b71c1c",
  fontSize: 13
};

const detailsStyle: React.CSSProperties = {
  marginTop: 8
};

const responsePreStyle: React.CSSProperties = {
  marginTop: 6,
  padding: 10,
  background: "#f8f9fb",
  border: "1px solid #dfe3e8",
  borderRadius: 4,
  fontSize: 12,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  maxHeight: 220,
  overflowY: "auto"
};

const iframeFullStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  border: "none",
  margin: 0,
  padding: 0,
  zIndex: 9999
};

export default HomePage;