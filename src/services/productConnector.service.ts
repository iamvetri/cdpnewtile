import { sendRequest } from "./container.svc";
import { IParty } from "../models/Party.model";

interface IPartyConnectorConfig {
  connectorName?: string;
  connectorVersion?: string;
  connectorMethod?: string;
  params?: any;
}

const DEFAULT_PARTY_CONNECTOR: Required<
  Pick<IPartyConnectorConfig, "connectorName" | "connectorVersion" | "connectorMethod">
> = {
  connectorName: "ClaysysPayrails",
  connectorVersion: "1.0",
  connectorMethod: "getPartyById"
};

const partyRequestCache = new Map<string, IParty | null>();
const inFlightPartyRequests = new Map<string, Promise<IParty | null>>();

function normalizePartyId(partyId?: string | null): string {
  return typeof partyId === "string" ? partyId.trim() : "";
}

function buildPartyRequestParams(
  partyId?: string | null,
  params?: any
): Record<string, any> {
  const normalizedPartyId = normalizePartyId(partyId);
  const requestParams =
    params != null && typeof params === "object" && !Array.isArray(params)
      ? { ...params }
      : {};

  if (!normalizedPartyId) {
    return requestParams;
  }

  if (!requestParams.partyId) {
    requestParams.partyId = normalizedPartyId;
  }

  if (!requestParams.id) {
    requestParams.id = normalizedPartyId;
  }

  if (!requestParams.customerId) {
    requestParams.customerId = normalizedPartyId;
  }

  return requestParams;
}

function buildPartyRequestKey(
  connectorName: string,
  connectorVersion: string,
  connectorMethod: string,
  requestParams: Record<string, any>
): string {
  return JSON.stringify({
    connectorName,
    connectorVersion,
    connectorMethod,
    requestParams
  });
}

function unwrapConnectorBody(raw: any): any | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      return unwrapConnectorBody(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    if ("data" in raw || "body" in raw || "response" in raw) {
      const inner = raw.data ?? raw.body ?? raw.response;

      if (
        inner != null &&
        (typeof inner !== "object" || Object.keys(inner).length > 0)
      ) {
        return inner;
      }

      return null;
    }

    if (Object.keys(raw).length > 0) {
      return raw;
    }
  }

  return null;
}

function mapPartyFromPayload(data: any): IParty | null {
  const party =
    data?.partyMessage?.partyList?.party?.[0] ||
    data?.data?.partyMessage?.partyList?.party?.[0];

  if (!party) {
    console.warn("Party not found in response");
    return null;
  }

  return {
    id: party.id,
    type: party.type,
    name: party.characteristics?.individual?.formattedName || "",
    firstName: party.characteristics?.individual?.firstName || "",
    middleName: party.characteristics?.individual?.middleName || "",
    lastName: party.characteristics?.individual?.lastName || "",
    nickname: party.characteristics?.individual?.nickname || "",
    birthdate: party.characteristics?.individual?.birthdate || "",
    irs: party.irs || undefined,
    employment:
      party.characteristics?.individual?.employmentList?.employment || [],
    identificationDocuments:
      party.identificationDocumentList?.identificationDocument || [],
    contacts: party.contactList?.contact || [],
    customData: party.customData || { valuePair: [] }
  };
}

export function parsePartyResponse(response: any): IParty | null {
  if (!response || response.success === false) {
    return null;
  }

  const data = unwrapConnectorBody(response?.response ?? response?.data) ?? response;
  return mapPartyFromPayload(data);
}

export const getPartyDetails = async (
  partyId?: string | null,
  connectorConfig?: IPartyConnectorConfig | null
): Promise<IParty | null> => {
  const connectorName =
    connectorConfig?.connectorName || DEFAULT_PARTY_CONNECTOR.connectorName;
  const connectorVersion =
    connectorConfig?.connectorVersion || DEFAULT_PARTY_CONNECTOR.connectorVersion;
  const connectorMethod =
    connectorConfig?.connectorMethod || DEFAULT_PARTY_CONNECTOR.connectorMethod;
  const requestParams = buildPartyRequestParams(
    partyId,
    connectorConfig?.params
  );

  if (
    !connectorConfig &&
    connectorMethod === DEFAULT_PARTY_CONNECTOR.connectorMethod &&
    Object.keys(requestParams).length === 0
  ) {
    console.warn(
      "Skipping getPartyById because no partyId or connector params were provided"
    );
    return null;
  }

  const requestKey = buildPartyRequestKey(
    connectorName,
    connectorVersion,
    connectorMethod,
    requestParams
  );
  const cachedParty = partyRequestCache.get(requestKey);
  if (cachedParty !== undefined) {
    return cachedParty;
  }

  const existingRequest = inFlightPartyRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const resp: any = await sendRequest(
      connectorName,
      connectorVersion,
      connectorMethod,
      requestParams
    );

    console.log("Party full response:", resp);

    if (!resp || resp.success === false) {
      console.warn(
        "Party connector returned no usable data:",
        resp?.message || resp
      );
      return null;
    }

    const party = parsePartyResponse(resp);

    partyRequestCache.set(requestKey, party);

    return party;
  })().finally(() => {
    inFlightPartyRequests.delete(requestKey);
  });

  inFlightPartyRequests.set(requestKey, request);

  return request;
};
