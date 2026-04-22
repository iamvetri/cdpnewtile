import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { getToken, getUser } from "../services/container.svc";
import LoadingScreen from "../components/LoadingScreen";

export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel {
  iframeUrl?: string;
  loading: boolean;
  error?: string;
}

/** Final app URL — hdnId and hdnPatientId come from the validateUser response */
const APP_URL = "https://devpatientapp.bitcure.com/AppSite/BitCureApp";

class HomePage extends Component<IHomeProps, IHomeState> {
  pageContainer = React.createRef<HTMLDivElement>();
  pageClass = "desktop";
  iframeRef = React.createRef<HTMLIFrameElement>();

  /** Cookie data from the response — sent to iframe via postMessage once it loads */
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

  // ─────────────────────────────────────────────────────────────────────────
  // Extract the real payload from the CDP connector response.
  //
  // Observed console shape (22-Apr-2026 screenshot):
  //   {
  //     response: {                       ← CDP wrapper
  //       success: true,
  //       message: "",
  //       data: {                         ← connector envelope
  //         statusCode: 200,
  //         message: "Success",
  //         data: {                       ← ★ real payload
  //           userId: 50387,
  //           patientId: 22210,
  //           access_token: "...",
  //           cookie: [ { name, value, domain, ... } ]
  //         }
  //       }
  //     }
  //   }
  // ─────────────────────────────────────────────────────────────────────────
  private extractPayload(raw: any): any | null {
    if (!raw) return null;

    const body = raw?.response ?? raw;

    // Path 1: body.data.data (seen in screenshot — most common)
    const envelope = body?.data;
    if (envelope?.data && typeof envelope.data === "object") {
      if (envelope.statusCode === 200 || envelope.message === "Success") {
        console.log("[extractPayload] ✓ using body.data.data");
        return envelope.data;
      }
    }

    // Path 2: body.data has access_token directly
    if (envelope?.access_token) {
      console.log("[extractPayload] ✓ using body.data");
      return envelope;
    }

    // Path 3: body has access_token directly
    if (body?.access_token) {
      console.log("[extractPayload] ✓ using body");
      return body;
    }

    console.warn("[extractPayload] ✗ No matching path. body =", body);
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Store the _AFAUTH_2027 cookie so the iframe can authenticate.
  //
  // Strategy:
  //   1. Set via document.cookie on the parent (works if domains align)
  //   2. After iframe loads, send cookie via postMessage so the iframe-side
  //      page can set it in its own domain context
  // ─────────────────────────────────────────────────────────────────────────
  private storeCookies(cookies: any[]): void {
    if (!Array.isArray(cookies) || cookies.length === 0) {
      console.warn("[storeCookies] No cookies in response");
      return;
    }

    for (const c of cookies) {
      const name = c.name || c.Name;
      const value = c.value || c.Value;
      const domain = c.domain || c.Domain || "";
      const path = c.path || c.Path || "/";
      const secure = c.secure ?? c.Secure ?? true;

      if (!name || !value) continue;

      // Attempt 1: Set on the parent page via document.cookie
      let cookieStr = `${name}=${value}; path=${path}; SameSite=None`;
      if (secure) cookieStr += "; Secure";
      // Note: cannot set httpOnly via JS — omitting it intentionally
      try {
        document.cookie = cookieStr;
        console.log(`[storeCookies] Set via document.cookie: ${name} (domain hint: ${domain})`);
      } catch (err) {
        console.warn(`[storeCookies] document.cookie failed for ${name}:`, err);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // After the iframe loads, send the cookie data via postMessage so the
  // iframe-side page (on devpatientapp.bitcure.com) can set the cookie
  // in its own domain context using document.cookie.
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  fetchToken = async () => {
    try {
      this.setState({ loading: true, error: undefined });

      // ── Step 1: resolve email via getUser() ───────────────────────────
      let email = "";
      try {
        const userResult = await getUser();
        console.log("getUser response:", JSON.stringify(userResult, null, 2));
        const emails = userResult?.data?.memberInfo?.emailAddresses;
        if (Array.isArray(emails) && emails.length > 0) {
          email = emails[0].emailAddress || "";
        }
      } catch (userErr: any) {
        console.warn("getUser failed, proceeding with empty email:", userErr);
      }
      console.log("Email resolved for getToken:", email);

      // ── Step 2: call getToken (type=validateUser) ─────────────────────
      const response = await getToken(email);
      console.log("getToken raw response:", JSON.stringify(response, null, 2));

      const payload = this.extractPayload(response);

      if (!payload) {
        this.setState({
          error: "Could not parse token response — check console.",
          loading: false,
        });
        return;
      }

      const accessToken: string = payload.access_token || payload.token || "";
      const userId: number      = payload.userId    || payload.UserId    || 0;
      const patientId: number   = payload.patientId || payload.PatientId || 0;
      const cookies: any[]      = payload.cookie    || payload.cookies   || [];

      console.log("[validateUser] accessToken :", accessToken ? "✓ present" : "✗ missing");
      console.log("[validateUser] userId      :", userId);
      console.log("[validateUser] patientId   :", patientId);
      console.log("[validateUser] cookies     :", cookies.length, "cookie(s)");

      if (!accessToken) {
        this.setState({
          error: "access_token missing in validateUser response.",
          loading: false,
        });
        return;
      }

      // ── Step 3: store the cookies from the response ───────────────────
      this.cookieData = cookies;
      this.storeCookies(cookies);

      // ── Step 4: build iframe URL and load ──────────────────────────────
      const iframeUrl = `${APP_URL}?hdnId=${userId}&hdnPatientId=${patientId}`;
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

  // ─────────────────────────────────────────────────────────────────────────
  render() {
    const { iframeUrl, loading, error } = this.state;

    /* ── Error state ───────────────────────────────────────────────────── */
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

        {/* Loading overlay while fetching token */}
        {loading && <LoadingScreen />}

        {/* AppSite iframe — cookie already stored before loading */}
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

/* ─── Styles ──────────────────────────────────────────────────────────── */

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