import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { container } from "../services/container.svc";

export interface IHomeProps extends IBasePropsModel { }

export interface IHomeState extends IBasePageStateModel {
  iframeUrl: string;
}

const BASE_URL = "https://www.everwisecu.com/locations?embed=true";

class HomePage extends Component<IHomeProps, IHomeState> {
  pageClass = "desktop";

  state: IHomeState = {
    componentModel: undefined as any,
    openToast: false,
    toastMsg: "",
    iframeUrl: BASE_URL
  };

  componentDidMount(): void {
    this.fetchDeviceLocation();
  }

  fetchDeviceLocation = () => {
    const device = container?.device;
    const getLocation = device?.getLocation;

    if (typeof getLocation !== "function") {
      return;
    }

    getLocation.call(device, (response: any) => {
      if (!response?.success || !response?.data) {
        return;
      }

      const lat = response.data.lat;
      const long = response.data.long;

      if (lat == null || long == null) {
        return;
      }

      const iframeUrl = `${BASE_URL}&lat=${lat}&long=${long}`;
      this.setState({ iframeUrl });
    });
  };

  render() {
    return (
      <Page key="home" id="home" className={this.pageClass} style={{ margin: 0, padding: 0 }}>
        <iframe
          src={this.state.iframeUrl}
          title="Location Map"
          style={iframeStyle}
          allow="geolocation *"
          sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </Page>
    );
  }
}

const iframeStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  border: "none",
  margin: 0,
  padding: 0
};

export default HomePage;
