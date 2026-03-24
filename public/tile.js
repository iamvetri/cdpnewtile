var localHost = location.hostname === "localhost";

// 🔥 FIX: get container from window
var container = window.container;

var tile = {
  data: {},
  str: {},
  tileConfig: {},

  getNav: function () {
    return document.getElementById("AppNavigator");
  },

  popPanel: function () {
    console.log("⬅️ popPanel");
    const nav = tile.getNav();
    if (nav && nav.popPage) {
      nav.popPage();
    } else {
      console.warn("Navigator not ready");
    }
  },

  sendRequest: function (connectorName, connectorVersion, connectorMethod, params = {}) {

    return new Promise(function (resolve, reject) {

      if (!container || !container.connectors) {
        console.error("❌ CDP container not available");
        reject({
          success: false,
          message: "CDP container not available"
        });
        return;
      }

      console.log("📡 Sending request:", {
        connectorName,
        connectorMethod,
        params
      });

      try {
        container.connectors.sendRequest(
          connectorName,
          connectorVersion,
          connectorMethod,
          params,
          function (resp) {

            console.log("📥 Response:", resp);

            if (!resp) {
              reject({
                success: false,
                message: "Empty response"
              });
              return;
            }

            if (resp.success === false) {
              reject(resp);
              return;
            }

            resolve(resp);
          }
        );
      } catch (err) {
        console.error("❌ sendRequest error:", err);
        reject({
          success: false,
          message: "Exception while calling connector"
        });
      }

    });

  }
};