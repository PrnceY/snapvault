import { useState } from "react";
import "./login.css";

const ID_TYPES = ["Passport", "Driver's License", "SSS ID", "PhilHealth ID", "Postal ID", "Voter's ID", "National ID"];

const ICONS = {
  customer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
};

const ROLE_META = {
  customer: {
    text: "Signing in as Customer — access to equipment catalog and rental history.",
    redirect: "/customer",
  },
  shop: {
    text: "Signing in as Shop — full access to inventory, rentals, deposits, and audit logs.",
    redirect: "/dashboard",
  },
};

const fieldWrap = (mb = 11) => ({ marginBottom: mb });
const regLabel = { display: "block", fontSize: 11, color: "#9C97A8", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" };
const regInput = { width: "100%", background: "#262430", border: "1px solid #2C2A36", borderRadius: 8, padding: "9px 11px", color: "#F3EFE6", fontSize: 13.5, fontFamily: "'Inter',sans-serif", outline: "none" };

const EMPTY_REG = { firstName: "", middleName: "", lastName: "", email: "", contact: "", idType: "", pw: "" };

export default function LoginPage() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showReg, setShowReg] = useState(false);
  const [reg, setReg] = useState(EMPTY_REG);
  const [regError, setRegError] = useState("");
  const [regOk, setRegOk] = useState("");

  const meta = ROLE_META[role];

  function pickRole(r) {
    setRole(r);
    setError("");
  }

  async function handleSignIn() {
    if (!email.trim() || !pw) {
      setError("Please fill in both email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pw, loginAs: role }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Invalid email or password.");
        setBusy(false);
        return;
      }
      // full page load so each area (shop / customer) loads only its own stylesheet
      window.location.href = meta.redirect;
    } catch (e) {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  function closeRegister() {
    setShowReg(false);
    setReg(EMPTY_REG);
    setRegError("");
    setRegOk("");
  }

  const setField = (k) => (e) => setReg({ ...reg, [k]: e.target.value });

  async function submitRegister() {
    const firstName = reg.firstName.trim();
    const middleName = reg.middleName.trim();
    const lastName = reg.lastName.trim();
    const regEmail = reg.email.trim();
    const contact = reg.contact.trim();
    setRegError("");
    setRegOk("");

    if (!firstName || !lastName || !regEmail || !reg.pw) {
      return setRegError("First name, last name, email, and password are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      return setRegError("Please enter a valid email address (e.g. you@example.com).");
    }
    if (contact && !/^09\d{9}$/.test(contact)) {
      return setRegError("Contact number must start with 09 followed by 9 digits (e.g. 09171234567).");
    }
    if (reg.pw.length < 8) {
      return setRegError("Password must be at least 8 characters.");
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add", FirstName: firstName, MiddleName: middleName, LastName: lastName,
          Email: regEmail, ContactNumber: contact, IDType: reg.idType, Password: reg.pw,
        }),
      });
      const data = await res.json();
      if (!data.success) return setRegError(data.error || "Registration failed.");
      setRegOk("Account created! You can now sign in.");
      setTimeout(closeRegister, 2000);
    } catch (e) {
      setRegError("Could not reach the server. Try again.");
    }
  }

  const regField = (label, key, props = {}) => (
    <div style={fieldWrap()}>
      <label style={regLabel}>{label}</label>
      <input style={regInput} value={reg[key]} onChange={setField(key)} {...props} />
    </div>
  );

  return (
    <div className="page" onKeyDown={(e) => { if (e.key === "Enter" && !showReg) handleSignIn(); }}>

        {/* ── Left panel (scrollable landing) ── */}
        <div className="left">

          {/* Hero section */}
          <div className="left-section hero">
            <div className="brand">
              <div className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#FFB454" strokeWidth="1.6">
                  <polygon points="12,2 19,6.5 19,15.5 12,20 5,15.5 5,6.5" />
                  <circle cx="12" cy="11" r="3.2" />
                </svg>
              </div>
              <div className="brand-text">
                <span className="name">SnapVault</span>
                <span className="sub">GEAR RENTAL LOG</span>
              </div>
            </div>

            <div style={{ marginTop: "28px" }}>
              <div className="left-tag">
                <span></span>
                SYSTEM ACTIVE
              </div>

              <h2 className="left-headline">
                Professional<br />
                Photography<br />
                <em>Equipment Rentals</em>
              </h2>

              <p className="left-desc">
                Access world-class cameras, lenses, tripods, and lighting.
                Managed rentals with deposit tracking, ID verification,
                and real-time availability.
              </p>
            </div>
          </div>

          {/* Category catalog section */}
          <div className="left-section catalog">
            <div className="section-eyebrow">EQUIPMENT CATALOG</div>
            <div className="section-title">Browse by Category</div>

            <div className="cat-grid" id="cat-grid">
              {/* Populated by JS from categories.php + inventory.php */}
              <div className="cat-card">
                <div className="cat-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="3.2"/></svg>
                </div>
                <div className="cat-body">
                  <div className="cat-name">Camera Bodies</div>
                  <div className="cat-desc">Full frame, mirrorless & DSLR systems</div>
                </div>
              </div>
              <div className="cat-card">
                <div className="cat-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                </div>
                <div className="cat-body">
                  <div className="cat-name">Lenses</div>
                  <div className="cat-desc">Prime, zoom, tilt-shift & specialty glass</div>
                </div>
              </div>
              <div className="cat-card">
                <div className="cat-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v11"/><path d="M12 14l-6 7M12 14l6 7M6 21h12"/></svg>
                </div>
                <div className="cat-body">
                  <div className="cat-name">Tripods</div>
                  <div className="cat-desc">Carbon fiber, aluminum & travel systems</div>
                </div>
              </div>
              <div className="cat-card">
                <div className="cat-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="13" r="5"/><path d="M12 2v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4"/><path d="M9 21h6"/></svg>
                </div>
                <div className="cat-body">
                  <div className="cat-name">Lighting Equipment</div>
                  <div className="cat-desc">Studio strobes, continuous & portable flash</div>
                </div>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div className="left-section features">
            <div className="section-eyebrow" style={{ textAlign: "center" }}>WHY SNAPVAULT</div>
            <div className="section-title" style={{ textAlign: "center", fontSize: "28px" }}>Built for Professional<br />Photographers</div>

            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="feat-title">Verified Rentals</div>
                <div className="feat-desc">Every rental includes government ID verification and a refundable deposit tracked in real time.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div className="feat-title">Condition Guaranteed</div>
                <div className="feat-desc">All equipment inspected before and after each rental with our 5-point condition grading system.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
                </div>
                <div className="feat-title">Compatibility Checker</div>
                <div className="feat-desc">Instantly verify which lenses are compatible with your selected camera body before you rent.</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="left-footer">
            <div className="footer-brand">
              <div className="name">
                <div className="name-mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FFB454" strokeWidth="1.6">
                    <polygon points="12,2 19,6.5 19,15.5 12,20 5,15.5 5,6.5" />
                    <circle cx="12" cy="11" r="3.2" />
                  </svg>
                </div>
                SnapVault
              </div>
              <p>Photography Equipment Rental Management System</p>
              <span className="copy">© 2026 SnapVault. All rights reserved.</span>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#">Browse Equipment</a>
              <a href="#">Compatibility Checker</a>
              <a href="#">Rental Agreement</a>
              <a href="#">Customer Portal</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>

        </div>


      {/* ── Right panel ── */}
      <div className="right">
        <div className="right-inner">

          <div className="right-head">
            <h1>Welcome</h1>
            <p>Sign in to your SnapVault account</p>
          </div>

          <div className="role-toggle">
            <button className={`role-btn ${role === "customer" ? "active" : ""}`} onClick={() => pickRole("customer")}>
              {ICONS.customer}
              Customer
            </button>
            <button className={`role-btn ${role === "shop" ? "active" : ""}`} onClick={() => pickRole("shop")}>
              {ICONS.shop}
              Shop
            </button>
          </div>

          <div className={`error-msg ${error ? "visible" : ""}`}>{error}</div>

          <div className="field">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <div className="field-row">
              <label>Password</label>
              <a href="#" className="forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>
            <div className="pw-wrap">
              <input type={pwVisible ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
                value={pw} onChange={(e) => setPw(e.target.value)} />
              <button className="pw-toggle" type="button" tabIndex={-1} onClick={() => setPwVisible(!pwVisible)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  {pwVisible ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button className="submit-btn" onClick={handleSignIn} disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>

          <div className="divider">
            <span></span><p>OR</p><span></span>
          </div>

          <div className="register-link">
            {role === "customer" ? (
              <>New customer? <a href="#" onClick={(e) => { e.preventDefault(); setShowReg(true); }}>Create an account</a></>
            ) : (
              <>Need shop access? <a href="#" onClick={(e) => e.preventDefault()}>Contact system owner</a></>
            )}
          </div>

          {showReg && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(10,9,13,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#1E1C26", border: "1px solid #2C2A36", borderRadius: 16, padding: "28px 28px 24px", width: 360, maxWidth: "92vw" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16 }}>Create an account</span>
                  <span style={{ cursor: "pointer", color: "#9C97A8", fontSize: 20, lineHeight: 1 }} onClick={closeRegister}>×</span>
                </div>
                {regError && <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)", color: "#FB7185", fontSize: 12.5, padding: "9px 12px", borderRadius: 8, marginBottom: 14 }}>{regError}</div>}
                {regOk && <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80", fontSize: 12.5, padding: "9px 12px", borderRadius: 8, marginBottom: 14 }}>{regOk}</div>}

                {regField("First Name", "firstName", { type: "text", placeholder: "Juan" })}
                {regField("Middle Name (optional)", "middleName", { type: "text", placeholder: "Santos" })}
                {regField("Last Name", "lastName", { type: "text", placeholder: "Dela Cruz" })}
                {regField("Email Address", "email", { type: "email", placeholder: "you@example.com" })}
                {regField("Contact Number", "contact", { type: "tel", placeholder: "09XXXXXXXXX", maxLength: 11 })}
                <div style={fieldWrap()}>
                  <label style={regLabel}>ID Type</label>
                  <select style={regInput} value={reg.idType} onChange={setField("idType")}>
                    <option value="">Select an ID type</option>
                    {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={fieldWrap(18)}>
                  <label style={regLabel}>Password</label>
                  <input style={regInput} type="password" placeholder="Min. 8 characters" value={reg.pw} onChange={setField("pw")} />
                </div>

                <button onClick={submitRegister} style={{ width: "100%", padding: 11, borderRadius: 9, border: "none", cursor: "pointer", background: "#FFB454", color: "#1A1320", fontWeight: 700, fontSize: 13.5, fontFamily: "'Inter',sans-serif" }}>Create Account</button>
                <p style={{ textAlign: "center", fontSize: 12, color: "#9C97A8", marginTop: 14, marginBottom: 0 }}>
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeRegister(); }} style={{ color: "#FFB454", textDecoration: "none" }}>Sign in</a>
                </p>
              </div>
            </div>
          )}

          <div className="role-badge">
            {ICONS[role]}
            <span>{meta.text}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
