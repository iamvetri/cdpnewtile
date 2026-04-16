import { sendRequest } from "./container.svc";

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

const partyRequestCache = new Map<string, any | null>();
const inFlightPartyRequests = new Map<string, Promise<any | null>>();

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

function mapPartyFromPayload(data: any): any | null {
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

export function parsePartyResponse(response: any): any | null {
  if (!response || response.success === false) {
    return null;
  }

  const data = unwrapConnectorBody(response?.response ?? response?.data) ?? response;
  return mapPartyFromPayload(data);
}

export const getPartyDetails = async (
  partyId?: string | null,
  connectorConfig?: IPartyConnectorConfig | null
): Promise<any | null> => {
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

// --- DUMMY CONNECTOR METHODS FOR TILE SIDE PROJECT ---

import { ITransactionFilters, IPagination, ISorting, ITransactionResponse } from "../models/Transaction.model";

// Dummy method to get member profile
export const getMemberProfile = async (userData?: any): Promise<any> => {
  console.log("Calling getMemberProfile with userData:", userData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 234 567 8900"
      });
    }, 500);
  });
};

export const getTransactions = async (
  filters: ITransactionFilters = {},
  pagination: IPagination = { pageNumber: 1, pageSize: 10 },
  sorting: ISorting = { sortBy: "date", sortDirection: "desc" }
): Promise<ITransactionResponse> => {
  console.log("Calling getTransactions API with:", { filters, pagination, sorting });

  const requestParams: any = {};

  if (filters.dateFrom) requestParams.fromDate = filters.dateFrom;
  if (filters.dateTo) requestParams.toDate = filters.dateTo;
  if (filters.minAmount !== undefined) requestParams.minAmount = filters.minAmount;
  if (filters.maxAmount !== undefined) requestParams.maxAmount = filters.maxAmount;
  if (filters.status) requestParams.status = filters.status;
  if (filters.keyword !== undefined) requestParams.keyword = filters.keyword;

  requestParams.sortOrder = sorting.sortDirection === "desc" ? "desc" : "asc";

  requestParams.page = pagination.pageNumber;
  requestParams.size = pagination.pageSize;

  try {
    const resp: any = await sendRequest(
      "ClaysysPayrails",
      "1.0",
      "transaction",
      requestParams
    );

    console.log("Transaction full response:", resp);

    if (!resp || resp.success === false) {
      console.warn("Transaction connector returned no usable data:", resp?.message || resp);
      return { transactions: [], totalRecords: 0, totalPages: 0 };
    }

    const unwrapped = unwrapConnectorBody(resp?.response ?? resp?.data) ?? resp;

    // Safely check where the transaction objects are located in the nested structure
    let rawTransactions: any[] = [];
    let totalRecords = 0;

    if (Array.isArray(unwrapped?.data?.extConnResponse?.data)) {
      rawTransactions = unwrapped.data.extConnResponse.data;
      totalRecords = unwrapped.data.extConnResponse.count || unwrapped.data.extConnResponse.totalCount || rawTransactions.length;
    } else if (Array.isArray(unwrapped?.extConnResponse?.data)) {
      rawTransactions = unwrapped.extConnResponse.data;
      totalRecords = unwrapped.extConnResponse.count || unwrapped.extConnResponse.totalCount || rawTransactions.length;
    } else if (Array.isArray(unwrapped?.data)) {
      rawTransactions = unwrapped.data;
      totalRecords = unwrapped.totalRecords || unwrapped.count || unwrapped.totalCount || rawTransactions.length;
    } else if (Array.isArray(unwrapped?.transactionList)) {
      rawTransactions = unwrapped.transactionList;
      totalRecords = unwrapped.totalRecords || unwrapped.count || unwrapped.totalCount || rawTransactions.length;
    } else if (Array.isArray(unwrapped)) {
      rawTransactions = unwrapped;
      totalRecords = unwrapped.length;
    } else if (Array.isArray(resp?.data)) {
      // Fallback if unwrapped removed the array
      rawTransactions = resp.data;
      totalRecords = resp.totalRecords || resp.count || resp.totalCount || rawTransactions.length;
    }
    
    // Aggressive fallback to find any 'count' in the top levels if still not found
    if (totalRecords === rawTransactions.length && rawTransactions.length > 0) {
      const topCount = unwrapped?.count || unwrapped?.totalCount || unwrapped?.totalRecords || unwrapped?.data?.count || resp?.count;
      if (typeof topCount === 'number' && topCount > totalRecords) {
        totalRecords = topCount;
      }
    }

    // Map to frontend interface
    const transactions = rawTransactions.map((item: any) => ({
      id: item.transactionId || item.id,
      date: item.dateTimePosted || item.date,
      amount: parseFloat(item.amount?.value !== undefined ? item.amount.value : (item.amount || "0")),
      description: item.description,
      status: item.status,
      type: item.type
    }));

    if (totalRecords === 0) totalRecords = transactions.length;

    return {
      transactions,
      totalRecords,
      totalPages: Math.ceil(totalRecords / (pagination.pageSize || 10)) || 1
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { transactions: [], totalRecords: 0, totalPages: 0 };
  }
};

