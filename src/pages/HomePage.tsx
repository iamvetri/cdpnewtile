import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";

export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel { }

/** The website to display inside the tile */
const IFRAME_URL = "https://www.everwisecu.com/locations";

class HomePage extends Component<IHomeProps, IHomeState> {
  pageClass = "desktop";

  state: IHomeState = {
    componentModel: undefined as any,
    openToast: false,
    toastMsg: "",
  };

  render() {
    return (
      <Page key="home" id="home" className={this.pageClass} style={{ margin: 0, padding: 0 }}>
        <iframe
          src={IFRAME_URL}
          title="EverWise Credit Union"
          style={iframeFullStyle}
          sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </Page>
    );
  }
}

/* ─── Styles ──────────────────────────────────────────────────────────── */

const iframeFullStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  border: "none",
  margin: 0,
  padding: 0,
  zIndex: 9999,
};

export default HomePage;