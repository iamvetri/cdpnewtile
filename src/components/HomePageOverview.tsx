import React from "react";

export interface IHomePageOverviewProps {
  title: string;
  membershipDate: string;
  customerId: string;
  contactsCount: number;
  documentsCount: number;
  depositsCount: number;
  loansCount: number;
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
  border: "1px solid rgba(111, 129, 153, 0.14)",
  boxShadow: "0 12px 28px rgba(24, 39, 75, 0.08)"
};

const heroPanelStyle: React.CSSProperties = {
  ...panelStyle,
  background: "linear-gradient(135deg, #16324f 0%, #214c73 45%, #2d678f 100%)",
  color: "#fff",
  padding: "24px"
};

const heroStatsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginTop: "18px"
};

const heroStatStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.12)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: "12px",
  padding: "12px 14px"
};

const HeroMetric = ({ label, value }: { label: string; value: string }) => (
  <div style={heroStatStyle}>
    <div style={{ fontSize: "12px", opacity: 0.74, marginBottom: "4px" }}>{label}</div>
    <div style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>{value}</div>
  </div>
);

const HomePageOverview = ({
  title,
  membershipDate,
  customerId,
  contactsCount,
  documentsCount,
  depositsCount,
  loansCount
}: IHomePageOverviewProps) => (
  <div style={heroPanelStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>
          Customer Overview
        </div>
        <h1 style={{ margin: "8px 0 6px", fontSize: "28px", lineHeight: 1.1 }}>
          {title}
        </h1>
        <div style={{ opacity: 0.82 }}>
          Member Since: {membershipDate}
        </div>
      </div>
      <div style={{ minWidth: "180px", textAlign: "right" }}>
        <div style={{ fontSize: "13px", opacity: 0.72 }}>Customer Id</div>
        <div style={{ fontSize: "22px", fontWeight: 700 }}>{customerId}</div>
      </div>
    </div>

    <div style={heroStatsStyle}>
      <HeroMetric label="Contacts" value={`${contactsCount}`} />
      <HeroMetric label="Documents" value={`${documentsCount}`} />
      <HeroMetric label="Deposits" value={`${depositsCount}`} />
      <HeroMetric label="Loans" value={`${loansCount}`} />
    </div>
  </div>
);

export default HomePageOverview;
