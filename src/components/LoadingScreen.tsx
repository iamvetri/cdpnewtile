import React from "react";

interface ILoadingScreenProps {
  className?: string;
}

const LoadingScreen = ({ className = "" }: ILoadingScreenProps) => (
  <div
    className={`cdp-loading-screen ${className}`.trim()}
    role="status"
    aria-live="polite"
    style={screenStyle}
  >
    {/* Keyframe for pulse animation */}
    <style>{`
      @keyframes cdp-pulse {
        0%, 100% { opacity: 1; transform: scale(1);    }
        50%       { opacity: 0.75; transform: scale(0.96); }
      }
    `}</style>

    {/* Center content */}
    <div style={contentStyle}>

      <p style={messageStyle}>
        Please wait while we retrieve your information.
      </p>
    </div>


  </div>
);

/* ── Inline styles ── */

const screenStyle: React.CSSProperties = {
  /* Full-viewport fixed overlay — sits above everything */
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  zIndex: 99999,
  background: "#ffffff",
  /* Flex column: content in the middle, footer pinned to bottom */
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const contentStyle: React.CSSProperties = {
  /* Pushes footer down while keeping image+text centred */
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
};

const imageStyle: React.CSSProperties = {
  width: "220px",
  height: "auto",
  objectFit: "contain",
  animationName: "cdp-pulse",
  animationDuration: "1.8s",
  animationTimingFunction: "ease-in-out",
  animationIterationCount: "infinite",
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: "#555555",
  fontSize: "14px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textAlign: "center",
  letterSpacing: "0.01em",
};

const footerStyle: React.CSSProperties = {
  padding: "16px 0",
  color: "#999999",
  fontSize: "12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textAlign: "center",
};

export default LoadingScreen;
