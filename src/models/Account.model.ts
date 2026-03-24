export interface IAmount {
  value: number;
  currencyCode?: string;
  exchangeRate?: number;
}

export interface IValuePair {
  name: string;
  value: string;
}

export interface ICustomData {
  valuePair: IValuePair[];
}

export interface IAccountNote {
  noteCode?: string;
  noteText?: string[];
}

export interface IHolderRelationship {
  qualifier?: string;
  authority?: string;
}

export interface IDepositParty {
  depositPartyId?: string;
  depositPartyRelationshipType?: {
    holder?: IHolderRelationship;
  };
  ssnOverride?: boolean;
}

export interface ILoanParty {
  loanPartyId?: string;
  loanPartyRelationshipType?: {
    borrower?: IHolderRelationship;
  };
}

export interface ILoanMeta {
  interestRate?: number;
  creditLimit?: IAmount;
  annualPercentageRate?: number;
  rate?: number;
  minimumPayment?: IAmount;
  currentDueDate?: string;
  currentPayoffBalance?: IAmount;
}

export interface IDeposit {
  accountId?: string;
  idType?: string;
  description: string;
  type?: string;
  subType?: string;
  openDate?: string;
  accountNickName?: string;
  branch?: string;
  actualBalance?: IAmount;
  availableBalance?: IAmount;
  minimumBalance?: IAmount;
  routingNumber?: string;
  transferFrom?: boolean;
  transferTo?: boolean;
  accountNoteList?: {
    note: IAccountNote[];
  };
  customData?: ICustomData;
  transactionList?: {
    transaction: any[];
  };
  depositPartyList?: {
    depositParty: IDepositParty[];
  };
  bumpRate?: number;
  dividendRate?: number;
  dividendType?: string;
  irsCode?: string;
  minimumDeposit?: IAmount;
  minimumWithdrawal?: IAmount;
  overdraftTolerance?: IAmount;
  depositAccountStatus?: string;
  depositAccountSubStatus?: string;
}

export interface ILoan {
  accountId?: string;
  idType?: string;
  description: string;
  type?: string;
  subType?: string;
  openDate?: string;
  accountNickName?: string;
  branch?: string;
  actualBalance?: IAmount;
  availableBalance?: IAmount;
  routingNumber?: string;
  transferFrom?: boolean;
  transferTo?: boolean;
  accountNoteList?: {
    note: IAccountNote[];
  };
  customData?: ICustomData;
  meta?: {
    loanMeta?: ILoanMeta;
  };
  transactionList?: {
    transaction: any[];
  };
  loanPartyList?: {
    loanParty: ILoanParty[];
  };
  loanAccountStatus?: string;
  loanAccountSubStatus?: string;
  purposeCode?: string;
  isRevolvingLineOfCredit?: boolean;
  lastPaymentAmount?: IAmount;
  term?: number;
  termType?: string;
  paymentOption?: {
    paymentAmount?: IAmount;
    dueDate?: string;
  };
  creditLimitIncreaseRequestList?: Record<string, unknown>;
}
