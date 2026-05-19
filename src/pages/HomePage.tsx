import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { getToken, getUser } from "../services/container.svc";
import LoadingScreen from "../components/LoadingScreen";

export interface IHomeProps extends IBasePropsModel {}
export interface IHomeState extends IBasePageStateModel {
  iframeUrl?: string;
  loading: boolean;
  error?: string;
}

const IMPERSONATE_URL =
  "https://devpatientapp.bitcure.com/impersonate/authenticate.html";
const IMPERSONATE_GUID = "75405824-63c3-4fd1-bc76-c0d7b6fa2f60";

class HomePage extends Component<IHomeProps, IHomeState> {
  pageContainer = React.createRef<HTMLDivElement>();
  pageClass = "desktop";
  iframeRef = React.createRef<HTMLIFrameElement>();

  private cookieData: any[] = [];

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

  private extractPayload(raw: any): any | null {
    if (!raw) return null;

    const body = raw?.response ?? raw;
    const envelope = body?.data;

    if (envelope?.extConnResponse?.data) {
      console.log("[extractPayload] using body.data.extConnResponse.data");
      return envelope.extConnResponse.data;
    }

    if (envelope?.data && typeof envelope.data === "object") {
      if (envelope.statusCode === 200 || envelope.message === "Success") {
        console.log("[extractPayload] using body.data.data");
        return envelope.data;
      }
    }

    if (envelope && typeof envelope === "object") {
      if (
        envelope.access_token ||
        envelope.token ||
        envelope.guid ||
        envelope.emailAddresses ||
        envelope.memberInfo
      ) {
        console.log("[extractPayload] using body.data");
        return envelope;
      }
    }

    if (typeof envelope === "string") {
      console.log("[extractPayload] using body.data string");
      return envelope;
    }

    if (body && typeof body === "object") {
      if (
        body.access_token ||
        body.token ||
        body.guid ||
        body.emailAddresses ||
        body.memberInfo
      ) {
        console.log("[extractPayload] using body");
        return body;
      }
    }

    if (typeof body === "string") {
      console.log("[extractPayload] using body string");
      return body;
    }

    console.warn("[extractPayload] no matching path. body =", body);
    return null;
  }

  private extractEmail(userResult: any): string {
    const payload = this.extractPayload(userResult) ?? userResult?.data ?? userResult;
    const emailAddresses =
      payload?.memberInfo?.emailAddresses ??
      payload?.emailAddresses ??
      userResult?.data?.memberInfo?.emailAddresses ??
      [];

    if (!Array.isArray(emailAddresses)) {
      return "";
    }

    const firstEmail = emailAddresses.find((entry: any) => entry?.emailAddress)?.emailAddress;
    return typeof firstEmail === "string" ? firstEmail.trim() : "";
  }

  private extractTokenValue(tokenResponse: any): string {
    const extConnToken =
      tokenResponse?.response?.data?.extConnResponse?.data ??
      tokenResponse?.data?.extConnResponse?.data ??
      tokenResponse?.response?.data?.data ??
      tokenResponse?.data?.data;

    if (typeof extConnToken === "string") {
      return extConnToken.trim();
    }

    const payload = this.extractPayload(tokenResponse);

    if (!payload) {
      return "";
    }

    if (typeof payload === "string") {
      return payload.trim();
    }

    const tokenValue =
      payload?.guid ??
      payload?.token ??
      payload?.access_token ??
      payload?.data?.guid ??
      payload?.data?.token ??
      payload?.data?.access_token;

    return typeof tokenValue === "string" ? tokenValue.trim() : "";
  }

  private resolveIframeGuid(): string {
    return IMPERSONATE_GUID;
  }

  handleIframeLoad = () => {
    if (this.cookieData.length > 0 && this.iframeRef.current?.contentWindow) {
      const message = {
        type: "SET_COOKIE",
        cookies: this.cookieData,
      };
      this.iframeRef.current.contentWindow.postMessage(
        JSON.stringify(message),
        "https://devpatientapp.bitcure.com"
      );
      console.log("[postMessage] Sent SET_COOKIE to iframe:", message);
    }
  };

  fetchToken = async () => {
    try {
      this.setState({ loading: true, error: undefined });

      const userResult = await getUser();
      console.log("memberinfo/getUser response:", JSON.stringify(userResult, null, 2));

      const email = this.extractEmail(userResult);
      console.log("Email resolved for extrequest:", email);

      if (!email) {
        this.setState({
          error: "No email address found in member info response.",
          loading: false,
        });
        return;
      }

      const response = await getToken(email);
      console.log("extrequest raw response:", JSON.stringify(response, null, 2));

      const token = this.extractTokenValue(response);
      if (!token) {
        this.setState({
          error: "Token missing in extrequest response.",
          loading: false,
        });
        return;
      }

      const guid = this.resolveIframeGuid();
      console.log("[impersonate] token:", token ? "present" : "missing");
      console.log("[impersonate] guid :", guid || "(missing)");

      if (!guid) {
        this.setState({
          error: "Guid missing for BitCure impersonate URL.",
          loading: false,
        });
        return;
      }

      this.cookieData = [];

      const iframeUrl = `${IMPERSONATE_URL}?token=${encodeURIComponent(
        token
      )}&guid=${encodeURIComponent(guid)}`;
      console.log("[iframe] URL:", iframeUrl);

      this.setState({ iframeUrl, loading: false });
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

    if (error) {
      return (
        <Page key="home" id="home" className={this.pageClass}>
          <div style={splashStyle}>
            <img src="/tileicon.png" alt="Logo" style={logoStyle} />
            <p style={{ color: "#e53935", fontSize: "15px", marginBottom: "16px" }}>
              {error}
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
        {loading && <LoadingScreen />}

        {!loading && iframeUrl && (
          <iframe
            ref={this.iframeRef}
            src={iframeUrl}
            title="BitCure App"
            onLoad={this.handleIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={iframeFullStyle}
          />
        )}
      </Page>
    );
  }
}

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
