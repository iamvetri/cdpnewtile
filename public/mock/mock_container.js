// ====FOR LOCAL DEVELOPMENT ONLY, DO NOT UPLOAD THIS FILE====

// toggle this variable to true to call a connector project locally (requires proper config in mocks/mock_connectorConfig.json)
// toggle to false to use mock file (required to fit naming convention mocks/[connectorName]_[connectorVersion]_[connectorMethod].json)
const useLocalConnector = true;

container.tile.data.getOpenData = function (callbackFunc) {
  const response = {
    success: false,
    data: {},
  };
  callbackFunc(response);
};

container.connectors.sendRequest = (
  connectorName,
  connectorVersion,
  connectorMethod,
  params,
  callbackFunc
) => {
  const response = {
    success: true,
    data: {},
  };

  console.log("useLocalConnector", useLocalConnector)

  if (useLocalConnector) {
    console.log("CALL LOCAL CONNECTOR")
    callLocalConnector(connectorName, connectorMethod, connectorVersion, params, callbackFunc)
  } else {
    console.log("CALL non LOCAL CONNECTOR")
    const source = "mock/" + connectorName + "_" + connectorVersion + "_" + connectorMethod + ".json";
    container.tile.data.loadJsonFile(source, (fileData) => {
      console.log("QQQ", fileData)
      response.success = fileData.data.filecontent.success;
      response.data = fileData.data.filecontent.data;
      callbackFunc(response)
    });
  }
};

const callLocalConnector = (connname, connmethod, connversion, requestParams, callbackFunc) => {
  console.log("callLocalConnector", connname, connmethod, connversion, requestParams);
  const req = {
    externalServicePayload: {
      requestType: {
        connector: connname,
        version: connversion,
        method: connmethod
      },
      payload: {
        valuePair: []
      },
      userData: {}
    },
    connectorParametersResponse: {
      parameters: {
        valuePair: Object.keys(requestParams || {}).map((key) => ({
          name: key,
          value: requestParams[key]
        }))
      },
      method: {
        parameters: {
          valuePair: []
        },
        isValid: true
      },
      connectorController: ""
    },
    response: "",
    responseStatus: {
      statusCode: "",
      statusDescription: "",
      status: "",
      statusReason: "",
      requiredFields: []
    }
  };

  console.log("Request to local connector", req);
const url =
    "http://localhost:8080/externalConnector/" +
    connname +
    "/" +
    connversion +
    "/" +
    connmethod;

  console.log("Request to local connector", url, req);
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req)
  })
    .then(res => res.json())
    .then(data => {

      callbackFunc(data);

    })
    .catch(error => {

      console.error("Local connector error", error);

      callbackFunc({
        success: false
      });

    });
}

