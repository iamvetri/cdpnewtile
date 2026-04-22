import React from "react";

const LoadingScreen = () => {
  return (
    <div style={screenStyle} role="status" aria-live="polite">
      {/* Animations */}
      <style>{`
        @keyframes tick {
          from { transform: translate(-50%, -100%) rotate(0deg); }
          to   { transform: translate(-50%, -100%) rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

      {/* Loader */}
      <div style={loaderWrapper}>
        <div style={clock}>
          <div style={hourHand}></div>
          <div style={minuteHand}></div>
        </div>
      </div>

      {/* Message */}
      <p style={messageStyle}>
        Please wait while we retrieve your information.
      </p>
    </div>
  );
};

export default LoadingScreen;


// ================== Styles ==================

const screenStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "#eef1f5",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999,
};

const loaderWrapper: React.CSSProperties = {
  width: "140px",
  height: "140px",
  borderRadius: "50%",
  background: "#e5eaf0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "20px",
  animation: "pulse 1.8s ease-in-out infinite",
};

const clock: React.CSSProperties = {
  width: "80px",
  height: "80px",
  border: "6px solid #000",
  borderRadius: "50%",
  position: "relative",
  background: "#fff",
};

const hourHand: React.CSSProperties = {
  position: "absolute",
  width: "4px",
  height: "20px",
  background: "#4a90e2",
  top: "50%",
  left: "50%",
  transformOrigin: "bottom",
  transform: "translate(-50%, -100%) rotate(45deg)",
  borderRadius: "2px",
};

const minuteHand: React.CSSProperties = {
  position: "absolute",
  width: "4px",
  height: "28px",
  background: "#4a90e2",
  top: "50%",
  left: "50%",
  transformOrigin: "bottom",
  transform: "translate(-50%, -100%) rotate(0deg)",
  animation: "tick 2s linear infinite",
  borderRadius: "2px",
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#444",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textAlign: "center",
};