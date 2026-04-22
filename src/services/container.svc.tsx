/* THIS FILE IS USED FOR 2 THINGS.
  1. SET THE CONTAINER OBJECT
  2. SET THE TILE OBJECT
************************************************************************************************************************/

const makeGlobalProxy = (globalKey: "container" | "tile") =>
  new Proxy(
    {},
    {
      get: (_target, prop: any) => (window as any)?.[globalKey]?.[prop],
      set: (_target, prop: any, value: any) => {
        const globalRef = (window as any)?.[globalKey];

        if (globalRef) {
          globalRef[prop] = value;
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

export const sendRequest = (
  connectorName: string,
  connectorVersion: string,
  connectorMethod: string,
  params: any = null
): Promise<any> => {
  const requestParams =
    params != null && typeof params === "object" ? params : {};

  console.log("sendRequest ->", {
    connectorName,
    connectorVersion,
    connectorMethod,
    params,
    requestParams
  });

  return new Promise((resolve, reject) => {
    if (!container || !container.connectors) {
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
        requestParams,
        (resp: any) => {
          console.log("Connector Response:", resp);

          if (!resp) {
            reject({
              success: false,
              message: "Empty response from connector"
            });
            return;
          }

          resolve(resp);
        }
      );
    } catch (err) {
      reject({
        success: false,
        message:
          err instanceof Error ? err.message : "Exception while calling connector"
      });
    }
  });
};

export const getToken = (email: string): Promise<any> => {
  return sendRequest(
    "ClaysysPayrails",
    "1.0",
    "getToken",
    {
      email: email,
      type: "token"
    }
  );
};
export default container;
