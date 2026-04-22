import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { getToken } from "../services/container.svc";

export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel {
  iframeUrl?: string;
  loading: boolean;
  error?: string;
  iframeLoaded: boolean;
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
    iframeLoaded: false
  };

  componentDidMount() {
    this.fetchToken();
  }

  fetchToken = async () => {
    try {
      this.setState({ loading: true, error: undefined, iframeLoaded: false });

      const response = await getToken("gopika.m@claysys.com");

      // Full raw response logged for debugging
      console.log("Full getToken response:", JSON.stringify(response, null, 2));

      /*
       * Actual API response shape (top-level, no .response wrapper):
       *   {
       *     success: true,
       *     message: "",
       *     data: {
       *       statusCode: 200,
       *       data: "TOKEN_VALUE",   <-- actual token is here
       *       error: null
       *     }
       *   }
       *
       * The guid is hardcoded. Final iframe URL:
       *   https://devpatientapp.bitcure.com/impersonate/authenticate.html?token=<TOKEN>&guid=<HARDCODED_GUID>
       */

      // Support both wrapped ({ response: {...} }) and unwrapped ({ success, data }) shapes
      const responseBody = response?.response ?? response;
      const isSuccess = responseBody?.success === true;
      const outerData = responseBody?.data;

      if (isSuccess && outerData) {
        let token = "";

        if (typeof outerData === "string" && outerData.length > 0) {
          // Plain string token — strip any trailing &... params
          const ampIdx = outerData.indexOf("&");
          token = ampIdx !== -1 ? outerData.substring(0, ampIdx) : outerData;

        } else if (outerData && typeof outerData === "object") {
          // Nested shape: { statusCode, data: "TOKEN", error }
          const inner = outerData.data;
          if (typeof inner === "string" && inner.length > 0) {
            const ampIdx = inner.indexOf("&");
            token = ampIdx !== -1 ? inner.substring(0, ampIdx) : inner;
          } else {
            // Fallback: common token field names in the object itself
            token = outerData.token || outerData.access_token || outerData.tokenValue || "";
          }
        }

        if (token) {
          const iframeUrl = `${BASE_IFRAME_URL}?token=${token}&guid=${HARDCODED_GUID}`;
          console.log("Iframe URL constructed:", iframeUrl);
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
        loading: false
      });
    }
  };

  onIframeLoad = () => {
    this.setState({ iframeLoaded: true });
  };

  render() {
    const { iframeUrl, loading, error, iframeLoaded } = this.state;

    return (
      <Page key="home" id="home" className={this.pageClass} style={{ background: "#F8F9FB", height: "100%" }}>
        <div className="home-page-container">
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>Token Request &amp; Iframe Integration</h1>

            {/* Status bar */}
            <div style={{ marginBottom: "16px" }}>
              {loading && (
                <p style={{ color: "#555" }}>⏳ Fetching token...</p>
              )}
              {error && (
                <div style={{ color: "red" }}>
                  <p>❌ Error: {error}</p>
                  <button
                    onClick={this.fetchToken}
                    style={{ marginTop: "8px", padding: "8px 20px", cursor: "pointer" }}
                  >
                    Retry
                  </button>
                </div>
              )}
              {iframeUrl && !loading && (
                <p style={{ color: "green" }}>
                  ✅ Token retrieved — {iframeLoaded ? "Iframe loaded" : "Loading iframe..."}
                </p>
              )}
            </div>

            {/* Always show the iframe area; src is set only once token is ready */}
            <div style={{ marginTop: "10px" }}>
              {iframeUrl ? (
                <iframe
                  ref={this.iframeRef}
                  src={iframeUrl}
                  title="BitCure App"
                  style={{
                    width: "100%",
                    height: "700px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                  onLoad={this.onIframeLoad}
                  sandbox="allow-scripts allow-same-origin allow-top-navigation allow-forms allow-popups"
                />
              ) : (
                !error && (
                  <div style={{
                    width: "100%",
                    height: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #ccc",
                    borderRadius: "5px",
                    color: "#999"
                  }}>
                    {loading ? "Waiting for token to load iframe..." : "No token available"}
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      </Page>
    );
  }
}

export default HomePage;