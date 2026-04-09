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

const DUMMY_TRANSACTIONS = [
  { id: "T001", date: "2023-10-01T10:00:00Z", amount: 150.0, description: "Grocery Store", status: "Completed", type: "Debit" },
  { id: "T002", date: "2023-10-02T14:30:00Z", amount: 2500.0, description: "Salary Deposit", status: "Completed", type: "Credit" },
  { id: "T003", date: "2023-10-05T09:15:00Z", amount: 45.5, description: "Coffee Shop", status: "Completed", type: "Debit" },
  { id: "T004", date: "2023-10-10T18:45:00Z", amount: 120.0, description: "Electric Bill", status: "Pending", type: "Debit" },
  { id: "T005", date: "2023-10-12T11:20:00Z", amount: 300.0, description: "Friend Transfer", status: "Completed", type: "Credit" },
  { id: "T006", date: "2023-10-15T08:00:00Z", amount: 50.0, description: "Online Subscription", status: "Failed", type: "Debit" },
  { id: "T007", date: "2023-10-20T16:10:00Z", amount: 1200.0, description: "Rent Payment", status: "Completed", type: "Debit" },
  { id: "T008", date: "2023-10-25T13:00:00Z", amount: 200.0, description: "Cash Withdrawal", status: "Completed", type: "Debit" }
] as any[];

// Dummy method to get transactions with applied filters, pagination, and sorting
export const getTransactions = async (
  filters: ITransactionFilters = {},
  pagination: IPagination = { pageNumber: 1, pageSize: 5 },
  sorting: ISorting = { sortBy: "date", sortDirection: "desc" }
): Promise<ITransactionResponse> => {
  console.log("Calling getTransactions with:", { filters, pagination, sorting });

  return new Promise((resolve) => {
    setTimeout(() => {
      let result = [...DUMMY_TRANSACTIONS];

      // Filtering logic
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom).getTime();
        result = result.filter(t => new Date(t.date).getTime() >= fromDate);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo).getTime();
        result = result.filter(t => new Date(t.date).getTime() <= toDate);
      }
      if (filters.minAmount !== undefined) {
        result = result.filter(t => t.amount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        result = result.filter(t => t.amount <= filters.maxAmount!);
      }
      if (filters.status) {
        result = result.filter(t => t.status === filters.status);
      }
      if (filters.keyword) {
        const lowerKeyword = filters.keyword.toLowerCase();
        result = result.filter(t => t.description.toLowerCase().includes(lowerKeyword));
      }

      // Sorting logic
      result.sort((a, b) => {
        let aVal = a[sorting.sortBy];
        let bVal = b[sorting.sortBy];

        if (sorting.sortBy === "date") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sorting.sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sorting.sortDirection === "asc" ? 1 : -1;
        return 0;
      });

      // Pagination logic
      const totalRecords = result.length;
      const totalPages = Math.ceil(totalRecords / pagination.pageSize);
      const startIndex = (pagination.pageNumber - 1) * pagination.pageSize;
      const paginatedResult = result.slice(startIndex, startIndex + pagination.pageSize);

      resolve({
        transactions: paginatedResult,
        totalRecords,
        totalPages
      });
    }, 600);
  });
};

// Dummy method to download transaction report
export const downloadTransactionsReport = async (filters: ITransactionFilters = {}): Promise<void> => {
  console.log("Calling downloadTransactionsReport with filters:", filters);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate creating a fake CSV and triggering a download in browser
      const csvContent = "data:text/csv;charset=utf-8,id,date,amount,description,status,type\n" 
        + DUMMY_TRANSACTIONS.map(t => `${t.id},${t.date},${t.amount},${t.description},${t.status},${t.type}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "transactions_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();
    }, 800);
  });
};
