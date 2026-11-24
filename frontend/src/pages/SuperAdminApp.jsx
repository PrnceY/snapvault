import { useState, useEffect } from "react";
import { Chip, Frame, Modal, FormField, ConfirmDialog, ApertureIcon, inputStyle, buttonStyle } from "../shared.jsx";
import "../styles.css";

export default function SuperAdminApp() {
  const [view, setView] = useState("shops"); // "shops" | "customers"
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // {ShopID, ShopName, Active}
  const [form, setForm] = useState({ ShopName:"", Email:"", Password:"" });
  const [formErr, setFormErr] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const filters = ["All","Verified","Pending","Unverified"];

  const load = () => fetch('/api/shops').then(r => r.json()).then(d => { setShops(d); setLoading(false); });
  const loadCustomers = () => fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(d); setCustomersLoading(false); });
  useEffect(() => { load(); loadCustomers(); }, []);

  const q = search.trim().toLowerCase();
  const customerRows = customers.filter(c => {
    if (filter !== "All" && (c.VerificationStatus || "Unverified") !== filter) return false;
    if (!q) return true;
    const idStr = `cus-${String(c.CustomerID).padStart(3,"0")}`;
    return c.FullName.toLowerCase().includes(q) || idStr.includes(q) || String(c.CustomerID).includes(q);
  });

  function approveId() {
    setReviewSaving(true);
    setReviewError(null);
    fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", CustomerID: reviewing.CustomerID }),
    })
      .then(r => r.json())
      .then(res => {
        setReviewSaving(false);
        if (res.success) { setReviewing(null); loadCustomers(); }
        else setReviewError(res.error || "Could not verify customer.");
      })
      .catch(() => { setReviewSaving(false); setReviewError("Could not reach the server."); });
  }

  function rejectId() {
    setReviewSaving(true);
    setReviewError(null);
    fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", CustomerID: reviewing.CustomerID }),
    })
      .then(r => r.json())
      .then(res => {
        setReviewSaving(false);
        if (res.success) { setReviewing(null); loadCustomers(); }
        else setReviewError(res.error || "Could not reject ID.");
      })
      .catch(() => { setReviewSaving(false); setReviewError("Could not reach the server."); });
  }

  const addShop = () => {
    setFormErr("");
    if (!form.ShopName || !form.Email || !form.Password) { setFormErr("All fields are required."); return; }
    fetch('/api/shops', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'add', ...form }) })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setFormErr(d.error || "Could not create shop."); return; }
        setShowAdd(false); setForm({ ShopName:"", Email:"", Password:"" }); load();
      });
  };

  const toggleActive = () => {
    const action = confirmTarget.Active ? 'deactivate' : 'activate';
    fetch('/api/shops', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, ShopID: confirmTarget.ShopID }) })
      .then(r => r.json())
      .then(() => { setConfirmTarget(null); load(); });
  };

  return (
    <div className="app">
      <aside className="sidebar" style={{width:228}}>
        <div className="brand">
          <div className="brand-mark"><ApertureIcon /></div>
          <div className="brand-text"><span className="name">SnapVault</span><span className="sub">SUPER ADMIN</span></div>
        </div>
        <nav style={{marginTop:20,display:"flex",flexDirection:"column",gap:4}}>
          <div className={`pill ${view==="shops" ? "on":""}`} style={{cursor:"pointer"}} onClick={() => setView("shops")}>Shops</div>
          <div className={`pill ${view==="customers" ? "on":""}`} style={{cursor:"pointer"}} onClick={() => setView("customers")}>Customer Verification</div>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar"><div className="topbar-inner"><div className="topbar-title">{view === "shops" ? "Shops" : "Customer Verification"}</div></div></header>
        <main className="content">
          {view === "shops" ? (
            <>
              <div className="cards-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
                <div className="stat-card"><div className="lab">Total Shops</div><div className="num">{shops.length}</div></div>
                <div className="stat-card"><div className="lab">Active</div><div className="num">{shops.filter(s=>s.Active==1).length}</div></div>
                <div className="stat-card"><div className="lab">Deactivated</div><div className="num">{shops.filter(s=>s.Active==0).length}</div></div>
              </div>
              <div className="section-head"><h2>All Shops</h2>
                <button style={{...buttonStyle, width:"auto", marginTop:0}} onClick={() => setShowAdd(true)}>+ Add Shop</button>
              </div>
              <Frame>
                {loading ? <p style={{padding:16,color:"var(--muted)"}}>Loading…</p> : (
                  <table>
                    <thead><tr><th>Shop</th><th>Email</th><th>Units</th><th>Customers</th><th>Active Rentals</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {shops.map(s => (
                        <tr key={s.ShopID}>
                          <td className="empty-name">{s.ShopName}</td>
                          <td className="mono-cell">{s.Email}</td>
                          <td>{s.UnitCount}</td>
                          <td>{s.CustomerCount}</td>
                          <td>{s.ActiveRentals}</td>
                          <td><Chip tone={s.Active==1 ? "green" : "rose"}>{s.Active==1 ? "Active" : "Deactivated"}</Chip></td>
                          <td>
                            <span style={{cursor:"pointer",color:"var(--amber)",fontSize:12.5,fontWeight:600}}
                              onClick={() => setConfirmTarget(s)}>
                              {s.Active==1 ? "Deactivate" : "Activate"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Frame>
            </>
          ) : (
            <>
              <div className="pill-row" style={{justifyContent:"space-between", display:"flex", flexWrap:"wrap", gap:10}}>
                <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                  {filters.map(f => (
                    <div key={f} className={`pill ${filter===f ? "on":""}`} onClick={() => setFilter(f)}>{f}</div>
                  ))}
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or customer ID…"
                    style={{...inputStyle, width:220, padding:"7px 12px", fontSize:12.5}}
                  />
                </div>
              </div>
              <Frame>
                {customersLoading ? <p style={{padding:16,color:"var(--muted)"}}>Loading…</p> : (
                  <table>
                    <thead><tr><th>Customer ID</th><th>First Name</th><th>Last Name</th><th>ID Type</th><th>Contact</th><th>Verification</th></tr></thead>
                    <tbody>
                      {customerRows.length === 0 && (
                        <tr><td colSpan="6" style={{color:"var(--muted)",textAlign:"center",padding:24}}>No customers match your search.</td></tr>
                      )}
                      {customerRows.map(c => (
                        <tr key={c.CustomerID}>
                          <td className="mono-cell">CUS-{String(c.CustomerID).padStart(3,"0")}</td>
                          <td className="empty-name">{c.FirstName}</td>
                          <td className="empty-name">{c.LastName}</td>
                          <td>{c.IDType}</td>
                          <td className="mono-cell">{c.ContactNumber}</td>
                          <td>
                            {c.VerificationStatus === "Pending" ? (
                              <span onClick={() => setReviewing(c)} style={{cursor:"pointer"}}>
                                <Chip tone="amber">Pending Review</Chip>
                              </span>
                            ) : (
                              <Chip tone={c.VerificationStatus === "Verified" ? "green" : "rose"}>{c.VerificationStatus || "Unverified"}</Chip>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Frame>
            </>
          )}
        </main>
      </div>

      {showAdd && (
        <Modal title="Add Shop" onClose={() => setShowAdd(false)}>
          <FormField label="Shop Name"><input style={inputStyle} value={form.ShopName} onChange={e=>setForm({...form,ShopName:e.target.value})} /></FormField>
          <FormField label="Email"><input style={inputStyle} value={form.Email} onChange={e=>setForm({...form,Email:e.target.value})} /></FormField>
          <FormField label="Password"><input type="password" style={inputStyle} value={form.Password} onChange={e=>setForm({...form,Password:e.target.value})} /></FormField>
          {formErr && <p style={{color:"var(--rose)",fontSize:12.5,marginBottom:10}}>{formErr}</p>}
          <button style={buttonStyle} onClick={addShop}>Create Shop</button>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.Active ? "Deactivate Shop" : "Activate Shop"}
          message={`Are you sure you want to ${confirmTarget.Active ? "deactivate" : "activate"} "${confirmTarget.ShopName}"?`}
          confirmLabel={confirmTarget.Active ? "Deactivate" : "Activate"}
          confirmTone={confirmTarget.Active ? "rose" : "green"}
          onConfirm={toggleActive}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {reviewing && (
        <Modal title={`Review ID — ${reviewing.FullName}`} onClose={() => { setReviewing(null); setReviewError(null); }}>
          <div style={{fontSize:12.5,color:"var(--muted)",marginBottom:10}}>
            CUS-{String(reviewing.CustomerID).padStart(3,"0")} · {reviewing.IDType}
          </div>
          <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--line)",marginBottom:16,background:"var(--card-hover)"}}>
            {reviewing.IDImagePath
              ? <img src={reviewing.IDImagePath} alt="Submitted ID" style={{width:"100%",display:"block"}} />
              : <div style={{padding:30,textAlign:"center",color:"var(--muted)",fontSize:12.5}}>No ID image on file.</div>
            }
          </div>
          {reviewError && <p style={{color:"var(--rose)",fontSize:12.5,marginBottom:10}}>{reviewError}</p>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmReject(true)} disabled={reviewSaving} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid var(--rose)",background:"none",color:"var(--rose)",fontSize:13.5,fontWeight:600,cursor:"pointer"}}>
              Reject
            </button>
            <button onClick={() => setConfirmApprove(true)} disabled={reviewSaving} style={{...buttonStyle,flex:1,marginTop:0}}>
              {reviewSaving ? "Saving…" : "Approve & Verify"}
            </button>
          </div>
        </Modal>
      )}
      {confirmApprove && (
        <ConfirmDialog
          title="Approve & Verify"
          message={`Verify the government ID for ${reviewing?.FullName}? This will mark them as a verified customer.`}
          confirmLabel="Approve & Verify"
          confirmTone="green"
          onConfirm={() => { setConfirmApprove(false); approveId(); }}
          onCancel={() => setConfirmApprove(false)}
        />
      )}
      {confirmReject && (
        <ConfirmDialog
          title="Reject ID"
          message={`Reject the submitted ID for ${reviewing?.FullName}? Their verification status will be reset and the image removed.`}
          confirmLabel="Reject"
          confirmTone="rose"
          onConfirm={() => { setConfirmReject(false); rejectId(); }}
          onCancel={() => setConfirmReject(false)}
        />
      )}
    </div>
  );
}

