/* THIS FILE IS USED FOR 2 THINGS. 
  1. SET THE CONTAINER OBJECT
  2. SET THE TILE OBJECT
************************************************************************************************************************/

// IMPORTANT:
// In CDP portal, window.container / window.tile may load late.
// Proxy ensures always getting latest reference.
const makeGlobalProxy = (globalKey: "container" | "tile") =>
  new Proxy(
    {},
    {
      get: (_target, prop: any) => (window as any)?.[globalKey]?.[prop],
      set: (_target, prop: any, value: any) => {
        const g = (window as any)?.[globalKey];
        if (g) {
          g[prop] = value;
          return true;
        }
        return false;
      }
    }
  );

export const container: any = makeGlobalProxy("container");
export const tile: any = makeGlobalProxy("tile");

declare global {
  interface Window {
    container: any;
    tile: any;
  }
}

/**
 * Generic connector request (CDP standard)
 */
export const sendRequest = (
  connectorName: string,
  connectorVersion: string,
  connectorMethod: string,
  params: any = {}
): Promise<any> => {
  console.log("📡 sendRequest →", {
    connectorName,
    connectorVersion,
    connectorMethod,
    params
  });

  return new Promise((resolve, reject) => {

    if (!container || !container.connectors) {
      console.error("❌ CDP container not available");
      reject({
        success: false,
        message: "CDP container not available"
      });
      return;
    }

    try {
      container.connectors.sendRequest(
        connectorName,
        connectorVersion,
        connectorMethod,
        params,
        (resp: any) => {
          console.log("📥 Connector Response:", resp);

          // ✅ Handle proper CDP response format
          if (!resp) {
            reject({
              success: false,
              message: "Empty response from connector"
            });
            return;
          }

          // Some connectors return success flag
          if (resp.success === false) {
            reject(resp);
            return;
          }

          // ✅ Always resolve valid response
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
};


// Fallback for environments where container not ready
try {
  container.tile.data.getOpenData = function (callbackFunc: any) {
    const response = {
      success: false,
      data: {}
    };
    callbackFunc(response);
  };
} catch (e) {
  // ignore
}

export default container;