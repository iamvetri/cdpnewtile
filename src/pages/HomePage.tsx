import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { getToken } from "../services/container.svc";
import LoadingScreen from "../components/LoadingScreen";

export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel {
  iframeUrl?: string;
  /** true = still fetching the token (shows LoadingScreen overlay) */
  loading: boolean;
  error?: string;
}

const BASE_IFRAME_URL = "https://devpatientapp.bitcure.com/impersonate/authenticate.html";
const HARDCODED_GUID = "75405824-63c3-4fd1-bc76-c0d7b6fa2f60";

class HomePage extends Component<IHomeProps, IHomeState> {
  pageContainer = React.createRef<HTMLDivElement>();
  pageClass = "desktop";
  iframeRef = React.createRef<HTMLIFrameElement>();

  state: IHomeState = {
    componentModel: undefined as any,
    openToast: false,
    toastMsg: "",
    iframeUrl: undefined,
    loading: true,
    error: undefined,
  };

  componentDidMount() {
    this.fetchToken();
  }

  fetchToken = async () => {
    try {
      this.setState({ loading: true, error: undefined });

      const response = await getToken("gopika.m@claysys.com");

      console.log("Full getToken response:", JSON.stringify(response, null, 2));

      const responseBody = response?.response ?? response;
      const isSuccess = responseBody?.success === true;
      const outerData = responseBody?.data;

      if (isSuccess && outerData) {
        let token = "";

        if (typeof outerData === "string" && outerData.length > 0) {
          const ampIdx = outerData.indexOf("&");
          token = ampIdx !== -1 ? outerData.substring(0, ampIdx) : outerData;

        } else if (outerData && typeof outerData === "object") {
          const inner = outerData.data;
          if (typeof inner === "string" && inner.length > 0) {
            const ampIdx = inner.indexOf("&");
            token = ampIdx !== -1 ? inner.substring(0, ampIdx) : inner;
          } else {
            token = outerData.token || outerData.access_token || outerData.tokenValue || "";
          }
        }

        if (token) {
          const iframeUrl = `${BASE_IFRAME_URL}?token=${token}&guid=${HARDCODED_GUID}`;
          console.log("Iframe URL constructed:", iframeUrl);
          // Hide LoadingScreen — iframe is already mounted and will navigate
          this.setState({ iframeUrl, loading: false });
        } else {
          this.setState({ error: "Token value was empty in response", loading: false });
        }
      } else {
        const errorMsg =
          responseBody?.message ||
          response?.message ||
          "Failed to get token. Check console for full response.";
        console.warn("Token request failed. Response:", response);
        this.setState({ error: errorMsg, loading: false });
      }
    } catch (err: any) {
      console.error("fetchToken error:", err);
      this.setState({
        error: err?.message || "An error occurred while fetching token",
        loading: false,
      });
    }
  };

  render() {
    const { iframeUrl, loading, error } = this.state;

    /* ── Error state ── */
    if (error) {
      return (
        <Page key="home" id="home" className={this.pageClass}>
          <div style={splashStyle}>
            <img src="/tileicon.png" alt="Logo" style={logoStyle} />
            <p style={{ color: "#e53935", fontSize: "15px", marginBottom: "16px" }}>
              ❌ {error}
            </p>
            <button onClick={this.fetchToken} style={retryBtnStyle}>
              Retry
            </button>
          </div>
        </Page>
      );
    }

    return (
      <Page key="home" id="home" className={this.pageClass} style={{ margin: 0, padding: 0 }}>

        {/*
         * LoadingScreen overlay — shown only while the main project is fetching
         * the auth token (loading === true). It sits on top of everything via
         * position:fixed + zIndex, and disappears the moment the token arrives.
         * The iframe is NOT shown during this phase.
         */}
        {loading && <LoadingScreen />}

        {/*
         * Iframe — rendered only once we have the token URL.
         * It is NOT pre-mounted while loading; it appears immediately after
         * the token is ready so there is no second blank wait.
         */}
        {!loading && iframeUrl && (
          <iframe
            ref={this.iframeRef}
            src={iframeUrl}
            title="BitCure App"
            sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups"
            style={iframeFullStyle}
          />
        )}
      </Page>
    );
  }
}

/* ─── Styles ─────────────────────────────────────────────── */

const splashStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  background: "#f5f7fa",
};

const logoStyle: React.CSSProperties = {
  width: "120px",
  height: "auto",
  marginBottom: "32px",
  objectFit: "contain",
};

const retryBtnStyle: React.CSSProperties = {
  padding: "10px 28px",
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
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
  zIndex: 9999,
};

export default HomePage;