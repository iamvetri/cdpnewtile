export interface IValuePair {
  name: string;
  value: string;
}

export interface ICustomData {
  valuePair: IValuePair[];
}

export interface IAmount {
  value: number;
  currencyCode?: string;
  exchangeRate?: number;
}

export interface IEmploymentIncome {
  grossIncomeData?: {
    amount?: IAmount;
  };
  netIncomeData?: {
    amount?: IAmount;
  };
}

export interface IEmployment {
  employerAddress?: any[];
  employerPhone?: any[];
  employmentIncome?: IEmploymentIncome;
}

export interface IPartyIndividual {
  firstName: string;
  middleName?: string;
  lastName: string;
  formattedName?: string;
  nickname?: string;
  birthdate?: string;
  employmentList?: {
    employment: IEmployment[];
  };
}

export interface IPartyIrs {
  taxId?: string;
  taxIdEncrypted?: boolean;
  taxIdType?: string;
  reportingFlag?: boolean;
}

export interface IIdentificationDocumentType {
  individualDocument?: string;
}

export interface IIdentificationDocument {
  idDocumentIdentifer?: string;
  idDocumentType?: IIdentificationDocumentType;
  idIssuedBy?: string;
  idExpirationDate?: string;
  idDisplayOrder?: number;
  idVerifyDateTime?: string;
  documentId?: string;
}

export interface IPhoneContact {
  type?: string;
  number?: string;
}

export interface IEmailContact {
  type?: string;
  address?: string;
}

export interface IAddressContact {
  line1?: string;
  line2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  countryCode?: string;
  country?: string;
  type?: string;
}

export interface IContact {
  contactId?: string;
  contactType: string;
  phone?: IPhoneContact;
  email?: IEmailContact;
  address?: IAddressContact;
  customData?: ICustomData;
}

export interface IParty {
  id: string;
  type?: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nickname?: string;
  birthdate?: string;
  irs?: IPartyIrs;
  employment?: IEmployment[];
  identificationDocuments: IIdentificationDocument[];
  contacts: IContact[];
  customData?: ICustomData;
}
