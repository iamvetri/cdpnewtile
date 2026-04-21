import React, { Component } from "react";
import { Page } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";
import { getToken } from "../services/container.svc";

// Import the styling for our simple home page


export interface IHomeProps extends IBasePropsModel { }
export interface IHomeState extends IBasePageStateModel {
  token?: any;
  loading: boolean;
  error?: string;
  iframeLoaded: boolean;
}

class HomePage extends Component<IHomeProps, IHomeState> {
  pageContainer = React.createRef<HTMLDivElement>();
  pageClass = "desktop";
  iframeRef = React.createRef<HTMLIFrameElement>();

  state: IHomeState = {
    componentModel: undefined as any,
    openToast: false,
    toastMsg: "",
    token: undefined,
    loading: true,
    error: undefined,
    iframeLoaded: false
  };

  componentDidMount() {
    this.fetchToken();
  }

  // Post token to iframe via postMessage (for cross-domain communication)
  postTokenToIframe = (tokenData: any) => {
    try {
      if (this.iframeRef.current && this.iframeRef.current.contentWindow) {
        // Use '*' for cross-origin postMessage
        this.iframeRef.current.contentWindow.postMessage(
          {
            type: "AUTH_TOKEN",
            token: tokenData.response?.data?.access_token,
            tokenType: tokenData.response?.data?.token_type,
            expiresIn: tokenData.response?.data?.expires_in,
            refreshToken: tokenData.response?.data?.refresh_token,
            cookies: tokenData.response?.data?.cookie
          },
          "*"
        );
        console.log("Token sent to iframe via postMessage");
      }
    } catch (err) {
      console.error("Error posting token to iframe:", err);
    }
  };

  fetchToken = async () => {
    try {
      this.setState({ loading: true, error: undefined });
      const response = await getToken("gopika.m@claysys.com");

      if (response && response.success) {
        const tokenData = response.data || response;

        // Store token in state
        this.setState({
          token: tokenData,
          loading: false
        });

        // Post token to iframe when ready (iframe will handle setting cookies)
        setTimeout(() => {
          this.postTokenToIframe(tokenData);
        }, 1000);
      } else {
        this.setState({
          error: response?.message || "Failed to get token",
          loading: false
        });
      }
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : "An error occurred",
        loading: false
      });
    }
  };

  onIframeLoad = () => {
    this.setState({ iframeLoaded: true });

    // Send token to iframe when it loads
    if (this.state.token) {
      this.postTokenToIframe(this.state.token);
    }
  };

  render() {
    const { token, loading, error, iframeLoaded } = this.state;
    const iframeUrl = "https://devpatientapp.bitcure.com/impersonate/authenticate.html?token=FFE48129-1262-4400-9838-21ADF7DF8557&guid=75405824-63c3-4fd1-bc76-c0d7b6fa2f60";

    return (
      <Page key="home" id="home" className={this.pageClass} style={{ background: "#F8F9FB", height: "100%" }}>
        <div className="home-page-container">
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>Token Request & Iframe Integration</h1>

            {loading && (
              <div style={{ marginTop: "20px" }}>
                <p>Loading Token...</p>
              </div>
            )}

            {error && (
              <div style={{ marginTop: "20px", color: "red" }}>
                <p>Error: {error}</p>
                <button onClick={this.fetchToken} style={{ marginTop: "10px", padding: "10px 20px" }}>
                  Retry
                </button>
              </div>
            )}

            {token && !loading && (
              <>
                <div style={{ marginTop: "20px", backgroundColor: "#e8f5e9", padding: "20px", borderRadius: "5px" }}>
                  <p><strong>Token Retrieved Successfully</strong></p>
                  <pre style={{ textAlign: "left", overflow: "auto", maxHeight: "200px", fontSize: "12px" }}>
                    {JSON.stringify(token.response?.data, null, 2)}
                  </pre>
                </div>

                <div style={{ marginTop: "30px" }}>
                  <h2>BitCure Application</h2>
                  <p style={{ color: "#666", marginBottom: "20px" }}>
                    {iframeLoaded ? "✓ Iframe Loaded - Token shared via postMessage" : "Loading iframe..."}
                  </p>
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
                </div>
              </>
            )}
          </div>
        </div>
      </Page>
    );
  }
}

export default HomePage;