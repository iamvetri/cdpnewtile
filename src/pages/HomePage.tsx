import React, { Component, createRef } from "react";
import { Page, Toast } from "react-onsenui";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";

import { IParty, IContact, ICustomData, IIdentificationDocument } from "../models/Party.model";
import { IDeposit, ILoan, IAccountNote } from "../models/Account.model";

import { isNativeApp } from "../services/helper.svc";
import { getPartyDetails, getAccounts } from "../services/productConnector.service";

export interface IHomeProps extends IBasePropsModel {}

export interface IHomeState extends IBasePageStateModel {
  party: IParty | null;
  deposits: IDeposit[];
  loans: ILoan[];
  openToast: boolean;
  toastMsg: string;
  toastColor: string;
  loading: boolean;
}

const panelStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "18px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)"
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px"
};

const detailItemStyle = {
  background: "#f7f9fc",
  borderRadius: "8px",
  padding: "10px 12px"
};

const subSectionStyle = {
  marginTop: "18px"
};

const listItemStyle = {
  background: "#f7f9fc",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "10px",
  listStyle: "none"
};

class HomePage extends Component<IHomeProps, IHomeState> {
  pageClass = "desktop";
  pageContainer: any = createRef();

  state: IHomeState = {
    componentModel: undefined as any,
    party: null,
    deposits: [],
    loans: [],
    openToast: false,
    toastMsg: "",
    toastColor: "danger",
    loading: true
  };

  render() {
    const { party, deposits, loans, loading } = this.state;

    return (
      <Page key="home" id="home" className={this.pageClass}>
        <Toast isOpen={this.state.openToast} className={this.state.toastColor}>
          <div>{this.state.toastMsg}</div>
          <button onClick={this.dismissToast}>OK</button>
        </Toast>

        <div
          className="cdp_page_container home-page-scroll"
          ref={this.pageContainer}
          style={{ padding: "20px" }}
        >
          {loading && <h3>Loading data...</h3>}

          {!loading && !party && (
            <h3 style={{ color: "gray" }}>No customer data found</h3>
          )}

          {party && this.renderPartyDetails(party)}

          {deposits.length > 0 && (
            <div style={panelStyle}>
              <h2>Deposit Accounts</h2>
              {deposits.map((acc, i) => this.renderDeposit(acc, i))}
            </div>
          )}

          {loans.length > 0 && (
            <div style={panelStyle}>
              <h2>Loan Accounts</h2>
              {loans.map((loan, i) => this.renderLoan(loan, i))}
            </div>
          )}
        </div>
      </Page>
    );
  }

  componentDidMount() {
    if (isNativeApp()) {
      this.pageClass = "native";
    }

    this.loadData();
  }

  loadData = async () => {
    try {
      this.setState({ loading: true });

      const [party, accountData] = await Promise.all([
        getPartyDetails("12345"),
        getAccounts("12345")
      ]);

      this.setState({
        party,
        deposits: accountData?.deposits || [],
        loans: accountData?.loans || [],
        loading: false
      });
    } catch (err) {
      console.error("Error loading data", err);
      this.setState({ loading: false });
      this.showToast("Failed to load data", "danger");
    }
  };

  renderPartyDetails = (party: IParty) => {
    const employment = party.employment || [];
    const memberFields = [
      ["Member Status", this.getCustomValue(party.customData, "MbrStatus")],
      ["Member Number", this.getCustomValue(party.customData, "MemberNumber")],
      ["Membership Date", this.formatDate(this.getCustomValue(party.customData, "MembershipDate"))],
      ["Locator", this.getCustomValue(party.customData, "Locator")],
      ["Short Name", this.getCustomValue(party.customData, "ShortName")],
      ["Primary Type", this.getCustomValue(party.customData, "Type")],
      ["Is Primary For Type", this.formatBooleanString(this.getCustomValue(party.customData, "IsPrimaryForType"))],
      ["Is Previous", this.formatBooleanString(this.getCustomValue(party.customData, "IsPrevious"))],
      ["Mark As Previous", this.formatBooleanString(this.getCustomValue(party.customData, "MarkAsPrevious"))],
      ["Is Employee", this.formatBooleanString(this.getCustomValue(party.customData, "IsEmployee"))],
      ["Individual Id", this.getCustomValue(party.customData, "IndividualId")]
    ];

    return (
      <div style={panelStyle}>
        <h2>Customer Details</h2>

        <div style={detailGridStyle}>
          {this.renderField("Customer Id", party.id)}
          {this.renderField("Party Type", party.type)}
          {this.renderField("Full Name", party.name)}
          {this.renderField("First Name", party.firstName)}
          {this.renderField("Middle Name", party.middleName)}
          {this.renderField("Last Name", party.lastName)}
          {this.renderField("Nickname", party.nickname)}
          {this.renderField("Birth Date", this.formatDate(party.birthdate))}
        </div>

        <div style={subSectionStyle}>
          <h3>Member Information</h3>
          <div style={detailGridStyle}>
            {memberFields.map(([label, value]) => this.renderField(label, value))}
          </div>
        </div>

        <div style={subSectionStyle}>
          <h3>IRS Information</h3>
          <div style={detailGridStyle}>
            {this.renderField("Tax Id", this.maskValue(party.irs?.taxId))}
            {this.renderField("Tax Id Type", party.irs?.taxIdType)}
            {this.renderField("Tax Id Encrypted", this.formatBoolean(party.irs?.taxIdEncrypted))}
            {this.renderField("Reporting Flag", this.formatBoolean(party.irs?.reportingFlag))}
          </div>
        </div>

        <div style={subSectionStyle}>
          <h3>Contacts</h3>
          {(party.contacts || []).length > 0 ? (
            <ul style={{ padding: 0, margin: 0 }}>
              {party.contacts.map((contact, index) => (
                <li key={contact.contactId || index} style={listItemStyle}>
                  <strong>{contact.contactType}</strong>
                  <div>{this.formatContactValue(contact)}</div>
                  <div style={{ marginTop: "4px", color: "#586174" }}>
                    Type: {contact.address?.type || contact.phone?.type || contact.email?.type || "--"}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No contacts available.</p>
          )}
        </div>

        <div style={subSectionStyle}>
          <h3>Identification Documents</h3>
          {(party.identificationDocuments || []).length > 0 ? (
            <ul style={{ padding: 0, margin: 0 }}>
              {party.identificationDocuments.map((doc, index) => (
                <li key={doc.idDocumentIdentifer || index} style={listItemStyle}>
                  <div><strong>{doc.idDocumentType?.individualDocument || "Document"}</strong></div>
                  <div>Document Id: {this.maskValue(doc.documentId)}</div>
                  <div>Issued By: {doc.idIssuedBy || "--"}</div>
                  <div>Expiration Date: {this.formatDate(doc.idExpirationDate)}</div>
                  <div>Verified On: {this.formatDate(doc.idVerifyDateTime)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents available.</p>
          )}
        </div>

        <div style={subSectionStyle}>
          <h3>Employment</h3>
          {employment.length > 0 ? (
            <ul style={{ padding: 0, margin: 0 }}>
              {employment.map((item, index) => (
                <li key={index} style={listItemStyle}>
                  <div>Gross Income: {this.formatCurrency(item.employmentIncome?.grossIncomeData?.amount)}</div>
                  <div>Net Income: {this.formatCurrency(item.employmentIncome?.netIncomeData?.amount)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No employment details available.</p>
          )}
        </div>
      </div>
    );
  };

  renderDeposit = (acc: IDeposit, index: number) => {
    const notes = acc.accountNoteList?.note || [];
    const holders = acc.depositPartyList?.depositParty || [];

    return (
      <div key={acc.accountId || index} className="account-card" style={listItemStyle}>
        <h3 style={{ marginTop: 0 }}>{acc.description || acc.accountNickName || "Deposit Account"}</h3>
        <div style={detailGridStyle}>
          {this.renderField("Account Id", acc.accountId)}
          {this.renderField("Nickname", acc.accountNickName)}
          {this.renderField("Type", acc.type)}
          {this.renderField("Subtype", acc.subType)}
          {this.renderField("Open Date", this.formatDate(acc.openDate))}
          {this.renderField("Branch", acc.branch)}
          {this.renderField("Actual Balance", this.formatCurrency(acc.actualBalance))}
          {this.renderField("Available Balance", this.formatCurrency(acc.availableBalance))}
          {this.renderField("Minimum Balance", this.formatCurrency(acc.minimumBalance))}
          {this.renderField("Minimum Deposit", this.formatCurrency(acc.minimumDeposit))}
          {this.renderField("Minimum Withdrawal", this.formatCurrency(acc.minimumWithdrawal))}
          {this.renderField("Overdraft Tolerance", this.formatCurrency(acc.overdraftTolerance))}
          {this.renderField("Dividend Rate", this.formatNumber(acc.dividendRate))}
          {this.renderField("Dividend Type", acc.dividendType)}
          {this.renderField("Status", acc.depositAccountStatus)}
          {this.renderField("Substatus", acc.depositAccountSubStatus)}
          {this.renderField("Transfer From", this.formatBoolean(acc.transferFrom))}
          {this.renderField("Transfer To", this.formatBoolean(acc.transferTo))}
          {this.renderField("Bill Pay Allowed", this.formatBooleanString(this.getCustomValue(acc.customData, "cdpAllowBillPay")))}
        </div>

        <div style={subSectionStyle}>
          <h4>Relationship</h4>
          {holders.length > 0 ? (
            holders.map((holder, holderIndex) => (
              <div key={holder.depositPartyId || holderIndex}>
                Party Id: {holder.depositPartyId || "--"}, Qualifier: {holder.depositPartyRelationshipType?.holder?.qualifier || "--"}, Authority: {holder.depositPartyRelationshipType?.holder?.authority || "--"}
              </div>
            ))
          ) : (
            <div>No relationship details available.</div>
          )}
        </div>

        <div style={subSectionStyle}>
          <h4>Notes</h4>
          {this.renderNotes(notes)}
        </div>
      </div>
    );
  };

  renderLoan = (loan: ILoan, index: number) => {
    const notes = loan.accountNoteList?.note || [];
    const borrowers = loan.loanPartyList?.loanParty || [];
    const loanMeta = loan.meta?.loanMeta;

    return (
      <div key={loan.accountId || index} className="account-card" style={listItemStyle}>
        <h3 style={{ marginTop: 0 }}>{loan.description || loan.accountNickName || "Loan Account"}</h3>
        <div style={detailGridStyle}>
          {this.renderField("Account Id", loan.accountId)}
          {this.renderField("Nickname", loan.accountNickName)}
          {this.renderField("Type", loan.type)}
          {this.renderField("Subtype", loan.subType)}
          {this.renderField("Open Date", this.formatDate(loan.openDate))}
          {this.renderField("Branch", loan.branch)}
          {this.renderField("Actual Balance", this.formatCurrency(loan.actualBalance))}
          {this.renderField("Available Balance", this.formatCurrency(loan.availableBalance))}
          {this.renderField("Interest Rate", this.formatPercent(loanMeta?.interestRate))}
          {this.renderField("Minimum Payment", this.formatCurrency(loanMeta?.minimumPayment))}
          {this.renderField("Last Payment Amount", this.formatCurrency(loan.lastPaymentAmount))}
          {this.renderField("Scheduled Payment", this.formatCurrency(loan.paymentOption?.paymentAmount))}
          {this.renderField("Due Date", this.formatDate(loan.paymentOption?.dueDate || loanMeta?.currentDueDate))}
          {this.renderField("Payoff Balance", this.formatCurrency(loanMeta?.currentPayoffBalance))}
          {this.renderField("Term", this.formatTerm(loan.term, loan.termType))}
          {this.renderField("Purpose Code", loan.purposeCode)}
          {this.renderField("Revolving Credit", this.formatBoolean(loan.isRevolvingLineOfCredit))}
          {this.renderField("Status", loan.loanAccountStatus)}
          {this.renderField("Substatus", loan.loanAccountSubStatus)}
          {this.renderField("Transfer From", this.formatBoolean(loan.transferFrom))}
          {this.renderField("Transfer To", this.formatBoolean(loan.transferTo))}
          {this.renderField("Bill Pay Allowed", this.formatBooleanString(this.getCustomValue(loan.customData, "cdpAllowBillPay")))}
        </div>

        <div style={subSectionStyle}>
          <h4>Relationship</h4>
          {borrowers.length > 0 ? (
            borrowers.map((borrower, borrowerIndex) => (
              <div key={borrower.loanPartyId || borrowerIndex}>
                Party Id: {borrower.loanPartyId || "--"}, Qualifier: {borrower.loanPartyRelationshipType?.borrower?.qualifier || "--"}, Authority: {borrower.loanPartyRelationshipType?.borrower?.authority || "--"}
              </div>
            ))
          ) : (
            <div>No relationship details available.</div>
          )}
        </div>

        <div style={subSectionStyle}>
          <h4>Notes</h4>
          {this.renderNotes(notes)}
        </div>
      </div>
    );
  };

  renderNotes = (notes: IAccountNote[]) => {
    if (!notes.length) {
      return <div>No notes available.</div>;
    }

    return (
      <ul style={{ paddingLeft: "18px", margin: 0 }}>
        {notes.map((note, index) => (
          <li key={`${note.noteCode || "note"}-${index}`}>
            {(note.noteText || []).join(", ") || "Note"}: {note.noteCode || "--"}
          </li>
        ))}
      </ul>
    );
  };

  renderField = (label: string, value?: string) => (
    <div key={`${label}-${value || "empty"}`} style={detailItemStyle}>
      <div style={{ fontSize: "12px", color: "#586174", marginBottom: "4px" }}>{label}</div>
      <div>{value && value.trim().length > 0 ? value : "--"}</div>
    </div>
  );

  formatContactValue = (contact: IContact) => {
    if (contact.contactType === "Phone") {
      return contact.phone?.number || "--";
    }

    if (contact.contactType === "Email") {
      return contact.email?.address || "--";
    }

    if (contact.contactType === "Address") {
      return [
        contact.address?.line1,
        contact.address?.line2,
        contact.address?.city,
        contact.address?.stateProvince,
        contact.address?.postalCode,
        contact.address?.country
      ]
        .filter(Boolean)
        .join(", ") || "--";
    }

    return "--";
  };

  formatCurrency = (amount?: { value: number; currencyCode?: string }) => {
    if (amount?.value == null) {
      return "--";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: amount.currencyCode || "USD"
    }).format(amount.value);
  };

  formatDate = (value?: string) => {
    if (!value) {
      return "--";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  formatBoolean = (value?: boolean) => {
    if (value == null) {
      return "--";
    }

    return value ? "Yes" : "No";
  };

  formatBooleanString = (value?: string) => {
    if (!value) {
      return "--";
    }

    if (value.toLowerCase() === "true" || value === "1") {
      return "Yes";
    }

    if (value.toLowerCase() === "false" || value === "0") {
      return "No";
    }

    return value;
  };

  formatPercent = (value?: number) => {
    if (value == null) {
      return "--";
    }

    return `${value}%`;
  };

  formatNumber = (value?: number) => {
    if (value == null) {
      return "--";
    }

    return `${value}`;
  };

  formatTerm = (value?: number, unit?: string) => {
    if (value == null) {
      return "--";
    }

    return `${value} ${unit || ""}`.trim();
  };

  getCustomValue = (customData?: ICustomData, key?: string) => {
    if (!customData?.valuePair?.length || !key) {
      return "";
    }

    return customData.valuePair.find((item) => item.name === key)?.value || "";
  };

  maskValue = (value?: string, visibleDigits: number = 4) => {
    if (!value) {
      return "--";
    }

    if (value.length <= visibleDigits) {
      return value;
    }

    return `${"*".repeat(value.length - visibleDigits)}${value.slice(-visibleDigits)}`;
  };

  showToast = (msg: string, color: string) => {
    this.setState({ openToast: true, toastMsg: msg, toastColor: color });
  };

  dismissToast = () => {
    this.setState({ openToast: false });
  };
}

export default HomePage;
