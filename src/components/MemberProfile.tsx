import React from "react";

export interface IMemberProfileProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const profileCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
  border: "1px solid rgba(111, 129, 153, 0.14)",
  boxShadow: "0 12px 28px rgba(24, 39, 75, 0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const MemberProfile: React.FC<IMemberProfileProps> = ({ firstName, lastName, email, phone }) => (
  <div style={profileCardStyle}>
    <h2 style={{ margin: 0, fontSize: "20px", color: "#16324f" }}>Member Profile</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
      <div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>First Name</div>
        <div style={{ fontWeight: 600 }}>{firstName}</div>
      </div>
      <div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>Last Name</div>
        <div style={{ fontWeight: 600 }}>{lastName}</div>
      </div>
      <div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>Email</div>
        <div style={{ fontWeight: 600 }}>{email}</div>
      </div>
      <div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>Phone</div>
        <div style={{ fontWeight: 600 }}>{phone}</div>
      </div>
    </div>
  </div>
);

export default MemberProfile;
