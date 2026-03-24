import { sendRequest } from "./container.svc";
import { IParty } from "../models/Party.model";
import { IDeposit, ILoan } from "../models/Account.model";

const PARTY_MOCK_URL =
  "https://mocki.io/v1/04679e9a-0a00-4edc-a6b7-27a09c219c07";
const ACCOUNTS_MOCK_URL =
  "https://mocki.io/v1/fa3a2496-becb-44b2-a045-f5ec768b11f3";

/** CDP portal often returns `{ success: true, data: null }` from externalCallMethod; load JSON from the URL instead. */
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
      if (inner != null && (typeof inner !== "object" || Object.keys(inner).length > 0)) {
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

async function getJsonPayload(
  resp: any,
  fallbackUrl: string
): Promise<any | null> {
  const raw = resp?.response ?? resp?.data;
  const fromConnector = unwrapConnectorBody(raw);

  if (fromConnector != null) {
    return fromConnector;
  }

  try {
    console.log(
      "📡 Connector returned no JSON body; using direct fetch:",
      fallbackUrl
    );
    const r = await fetch(fallbackUrl, { credentials: "omit" });
    if (!r.ok) {
      console.error("❌ Fallback fetch failed:", r.status, fallbackUrl);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.error("❌ Fallback fetch error:", e);
    return null;
  }
}

function mapPartyFromPayload(data: any): IParty | null {
  const party =
    data?.partyMessage?.partyList?.party?.[0] ||
    data?.data?.partyMessage?.partyList?.party?.[0];

  if (!party) {
    console.warn("⚠️ Party not found in response");
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

/**
 * ✅ Fetch Party Details
 */
export const getPartyDetails = async (
  partyId: string = "12345"
): Promise<IParty | null> => {
  const resp: any = await sendRequest(
    "ClaysysPayrails",
    "1.0",
    "externalCallMethod",
    {
      url: PARTY_MOCK_URL
    }
  );

  console.log("🔍 Party FULL RESPONSE:", resp);

  if (!resp || resp.success === false) {
    console.error("❌ Party API Error:", resp?.message);
    return null;
  }

  try {
    const data = await getJsonPayload(resp, PARTY_MOCK_URL);
    console.log("✅ FINAL PARTY DATA:", data);
    if (!data) {
      return null;
    }
    return mapPartyFromPayload(data);
  } catch (err) {
    console.error("❌ Party Parsing error:", err);
    return null;
  }
};


/**
 * ✅ Fetch Account Details
 */
export const getAccounts = async (
  partyId: string = "12345"
): Promise<{ deposits: IDeposit[]; loans: ILoan[] } | null> => {
  const resp: any = await sendRequest(
    "ClaysysPayrails",
    "1.0",
    "externalCallMethod",
    {
      url: ACCOUNTS_MOCK_URL
    }
  );

  console.log("🔍 Accounts FULL RESPONSE:", resp);

  if (!resp || resp.success === false) {
    console.error("❌ Accounts API Error:", resp?.message);
    return null;
  }

  try {
    const data = await getJsonPayload(resp, ACCOUNTS_MOCK_URL);
    console.log("✅ FINAL ACCOUNTS DATA:", data);
    if (!data) {
      return null;
    }

    const source = data?.accountContainer ? data : data?.data;

    const deposits: IDeposit[] =
      source?.accountContainer?.depositMessage?.depositList?.deposit || [];

    const loans: ILoan[] =
      source?.accountContainer?.loanMessage?.loanList?.loan || [];

    return {
      deposits,
      loans
    };
  } catch (err) {
    console.error("❌ Accounts Parsing error:", err);
    return null;
  }
};
