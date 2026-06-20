const { useState, useEffect } = React;

/* ---------------- Live data fetched from PHP/MariaDB ---------------- */
/* Each endpoint lives next to this file on the server, e.g.
   https://snapvault.dcism.org/get_inventory.php                       */

function useApiData() {
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = () => {
    return Promise.all([
      fetch("get_categories.php").then(r => r.json()),
      fetch("get_inventory.php").then(r => r.json()),
      fetch("get_customers.php").then(r => r.json()),
      fetch("get_rentals.php").then(r => r.json()),
      fetch("get_deposits.php").then(r => r.json()),
    ])
      .then(([cat, inv, cus, ren, dep]) => {
        setCategories(cat);
        setInventory(inv);
        setCustomers(cus);
        setRentals(ren);
        setDeposits(dep);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Could not load data from the server. Check that the PHP endpoints are uploaded and db_connect.php has the right credentials.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { categories, inventory, customers, rentals, deposits, loading, error, refetch: fetchAll };
}

/* ---------------- Small components ---------------- */

function Chip({ tone, children }) {
  return (
    <span className={`chip ${tone}`}>
      <span className="d"></span>{children}
    </span>
  );
}

function statusTone(s) {
  if (s === "Available" || s === "Full Refund" || s === "Done" || s === "Verified" || s === 1 || s === true) return "green";
  if (s === "Rented" || s === "Held" || s === "Partial Refund") return "amber";
  if (s === "Maintenance" || s === "Forfeited" || s === "Overdue") return "rose";
  return "muted";
}

function Frame({ children, style }) {
  return (
    <div className="frame" style={style}>
      <span className="bl"></span><span className="br"></span>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(10,9,13,0.6)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:50,
    }} onClick={onClose}>
      <div
        style={{
          background:"var(--card)", border:"1px solid var(--line)", borderRadius:14,
          padding:"22px 24px", width:380, maxWidth:"90vw",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif", fontSize:16, margin:0}}>{title}</h2>
          <span style={{cursor:"pointer", color:"var(--muted)", fontSize:18}} onClick={onClose}>×</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:"block", fontSize:11.5, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:0.3}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"var(--card-hover)", border:"1px solid var(--line)",
  borderRadius:8, padding:"9px 11px", color:"var(--text)", fontSize:13.5,
  fontFamily:"'Inter',sans-serif", outline:"none",
};

const buttonStyle = {
  width:"100%", padding:"10px", borderRadius:9, border:"none", cursor:"pointer",
  background:"var(--amber)", color:"#1A1320", fontWeight:600, fontSize:13.5, marginTop:6,
};

function ApertureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FFB454" strokeWidth="1.6">
      <polygon points="12,2 19,6.5 19,15.5 12,20 5,15.5 5,6.5" />
      <circle cx="12" cy="11" r="3.2" />
    </svg>
  );
}

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  categories: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="2.5"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6"/></svg>,
  rentals: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>,
  deposits: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="7.5" cy="14.5" r="1"/></svg>,
};

const navItems = [
  { key:"dashboard", label:"Dashboard" },
  { key:"categories", label:"Equipment Categories" },
  { key:"inventory", label:"Inventory" },
  { key:"customers", label:"Customers" },
  { key:"rentals", label:"Rentals" },
  { key:"deposits", label:"Deposits" },
];

const pageMeta = {
  dashboard: { title:"Dashboard", desc:"Today's read on the gear pool" },
  categories: { title:"Equipment Categories", desc:"Camera bodies, lenses, lighting, tripods" },
  inventory: { title:"Inventory", desc:"Serialized units and current condition" },
  customers: { title:"Customers", desc:"Profiles with verified ID and contact data" },
  rentals: { title:"Rentals", desc:"Date out, expected back, actual return" },
  deposits: { title:"Deposits", desc:"Security funds held and refund status" },
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"2-digit" });
}

/* ---------------- Pages (each receives live data as props) ---------------- */

function Dashboard({ data }) {
  const { inventory, rentals, deposits } = data;
  const activeRentals = rentals.filter(r => !r.ActualReturn);
  const now = new Date();
  const overdue = activeRentals.filter(r => new Date(r.ExpectedBack) < now).length;
  const heldTotal = deposits
    .filter(d => d.RefundStatus === "Held")
    .reduce((a, d) => a + Number(d.AmountHeld), 0);

  return (
    <>
      <div className="cards-grid">
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Units in stock</span><div className="ic">{icons.inventory}</div></div>
          <div className="num">{inventory.length}</div>
          <div className="lab">Across all categories</div>
        </div>
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Active rentals</span><div className="ic">{icons.rentals}</div></div>
          <div className="num">{activeRentals.length}</div>
          <div className="lab">Currently checked out</div>
        </div>
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Overdue</span><div className="ic">{icons.rentals}</div></div>
          <div className="num" style={{color:"var(--rose)"}}>{overdue}</div>
          <div className="lab">Past expected return</div>
        </div>
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Deposits held</span><div className="ic">{icons.deposits}</div></div>
          <div className="num">₱{heldTotal.toLocaleString()}</div>
          <div className="lab">Not yet refunded</div>
        </div>
      </div>

      <div className="section-head"><h2>Rentals currently out</h2><span className="count">{activeRentals.length} open</span></div>
      <Frame>
        <table>
          <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Status</th></tr></thead>
          <tbody>
            {activeRentals.map(r => {
              const isOverdue = new Date(r.ExpectedBack) < now;
              return (
                <tr key={r.RentalID}>
                  <td className="mono-cell">RNT-{r.RentalID}</td>
                  <td>{r.Customer}</td>
                  <td>{r.Item}</td>
                  <td className="mono-cell">{fmtDate(r.DateOut)}</td>
                  <td className="mono-cell">{fmtDate(r.ExpectedBack)}</td>
                  <td><Chip tone={isOverdue ? "rose" : "amber"}>{isOverdue ? "Overdue" : "On loan"}</Chip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>
    </>
  );
}

function CategoriesPage({ data }) {
  const { categories, inventory } = data;
  return (
    <div className="cards-grid">
      {categories.map(c => (
        <div className="stat-card" key={c.CategoryID}>
          <div className="top">
            <span className="lab" style={{fontSize:11,color:"var(--muted)"}}>CAT-{String(c.CategoryID).padStart(2,"0")}</span>
            <div className="ic">{icons.categories}</div>
          </div>
          <div className="num" style={{fontSize:20}}>{c.CategoryName}</div>
          <div className="lab">{c.Description}</div>
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
            <span className="lab">Units</span>
            <span className="mono" style={{fontSize:13}}>{inventory.filter(i => i.CategoryName === c.CategoryName).length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryPage({ data }) {
  const { inventory, categories, refetch } = data;
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ SerialNumber:"", CategoryID:"", ItemName:"", ConditionStatus:"Good", Status:"Available" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const statuses = ["All","Available","Rented","Maintenance"];
  const rows = inventory.filter(i => filter === "All" || i.Status === filter);

  const submit = (e) => {
    e.preventDefault();
    if (!form.SerialNumber || !form.CategoryID || !form.ItemName) {
      setFormError("Serial number, category, and item name are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    fetch("add_inventory.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setShowForm(false);
          setForm({ SerialNumber:"", CategoryID:"", ItemName:"", ConditionStatus:"Good", Status:"Available" });
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  return (
    <>
      <div className="pill-row" style={{justifyContent:"space-between", display:"flex"}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {statuses.map(s => (
            <div key={s} className={`pill ${filter===s ? "on":""}`} onClick={() => setFilter(s)}>{s}</div>
          ))}
        </div>
        <div className="pill" style={{background:"var(--amber)", color:"#1A1320", borderColor:"var(--amber)", fontWeight:600}} onClick={() => setShowForm(true)}>
          + Add Item
        </div>
      </div>
      <Frame>
        <table>
          <thead><tr><th>Serial No.</th><th>Item</th><th>Category</th><th>Condition</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(i => (
              <tr key={i.SerialNumber}>
                <td className="mono-cell">{i.SerialNumber}</td>
                <td className="empty-name">{i.ItemName}</td>
                <td>{i.CategoryName}</td>
                <td>{i.ConditionStatus}</td>
                <td><Chip tone={statusTone(i.Status)}>{i.Status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>

      {showForm && (
        <Modal title="Add Inventory Item" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <FormField label="Serial Number">
              <input style={inputStyle} value={form.SerialNumber} onChange={e => setForm({...form, SerialNumber:e.target.value})} placeholder="e.g. CR5-0099" />
            </FormField>
            <FormField label="Item Name">
              <input style={inputStyle} value={form.ItemName} onChange={e => setForm({...form, ItemName:e.target.value})} placeholder="e.g. Canon EOS R6" />
            </FormField>
            <FormField label="Category">
              <select style={inputStyle} value={form.CategoryID} onChange={e => setForm({...form, CategoryID:e.target.value})}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
              </select>
            </FormField>
            <FormField label="Condition">
              <select style={inputStyle} value={form.ConditionStatus} onChange={e => setForm({...form, ConditionStatus:e.target.value})}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Damaged</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select style={inputStyle} value={form.Status} onChange={e => setForm({...form, Status:e.target.value})}>
                <option>Available</option><option>Rented</option><option>Maintenance</option>
              </select>
            </FormField>
            {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{formError}</p>}
            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? "Saving…" : "Add to Inventory"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function CustomersPage({ data }) {
  const { customers, refetch } = data;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ FullName:"", IDType:"School ID", ContactNumber:"", Verified:false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!form.FullName) {
      setFormError("Full name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    fetch("add_customer.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setShowForm(false);
          setForm({ FullName:"", IDType:"School ID", ContactNumber:"", Verified:false });
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  return (
    <>
      <div className="pill-row" style={{justifyContent:"flex-end", display:"flex"}}>
        <div className="pill" style={{background:"var(--amber)", color:"#1A1320", borderColor:"var(--amber)", fontWeight:600}} onClick={() => setShowForm(true)}>
          + Add Customer
        </div>
      </div>
      <Frame>
        <table>
          <thead><tr><th>Customer ID</th><th>Name</th><th>ID Type</th><th>Contact</th><th>Verification</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.CustomerID}>
                <td className="mono-cell">CUS-{String(c.CustomerID).padStart(3,"0")}</td>
                <td className="empty-name">{c.FullName}</td>
                <td>{c.IDType}</td>
                <td className="mono-cell">{c.ContactNumber}</td>
                <td><Chip tone={Number(c.Verified) ? "green":"rose"}>{Number(c.Verified) ? "Verified" : "Pending"}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>

      {showForm && (
        <Modal title="Add Customer" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
            <FormField label="Full Name">
              <input style={inputStyle} value={form.FullName} onChange={e => setForm({...form, FullName:e.target.value})} placeholder="e.g. Juan Dela Cruz" />
            </FormField>
            <FormField label="ID Type">
              <select style={inputStyle} value={form.IDType} onChange={e => setForm({...form, IDType:e.target.value})}>
                <option>School ID</option><option>Driver's License</option><option>Passport</option>
              </select>
            </FormField>
            <FormField label="Contact Number">
              <input style={inputStyle} value={form.ContactNumber} onChange={e => setForm({...form, ContactNumber:e.target.value})} placeholder="e.g. 0917 000 0000" />
            </FormField>
            <FormField label="Verified">
              <label style={{display:"flex", alignItems:"center", gap:8, fontSize:13}}>
                <input type="checkbox" checked={form.Verified} onChange={e => setForm({...form, Verified:e.target.checked})} />
                ID has been verified
              </label>
            </FormField>
            {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{formError}</p>}
            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? "Saving…" : "Add Customer"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function RentalsPage({ data }) {
  const { rentals } = data;
  return (
    <Frame>
      <table>
        <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Actual return</th><th>Status</th></tr></thead>
        <tbody>
          {rentals.map(r => (
            <tr key={r.RentalID}>
              <td className="mono-cell">RNT-{r.RentalID}</td>
              <td>{r.Customer}</td>
              <td>{r.Item}</td>
              <td className="mono-cell">{fmtDate(r.DateOut)}</td>
              <td className="mono-cell">{fmtDate(r.ExpectedBack)}</td>
              <td className="mono-cell">{r.ActualReturn ? fmtDate(r.ActualReturn) : "—"}</td>
              <td><Chip tone={statusTone(r.ActualReturn ? "Done" : "Rented")}>{r.ActualReturn ? "Returned" : "On loan"}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function DepositsPage({ data }) {
  const { deposits } = data;
  return (
    <Frame>
      <table>
        <thead><tr><th>Deposit ID</th><th>Linked Rental</th><th>Amount</th><th>Refund Status</th></tr></thead>
        <tbody>
          {deposits.map(d => (
            <tr key={d.DepositID}>
              <td className="mono-cell">DEP-{d.DepositID}</td>
              <td className="mono-cell">RNT-{d.RentalID}</td>
              <td className="mono-cell">₱{Number(d.AmountHeld).toLocaleString()}</td>
              <td><Chip tone={statusTone(d.RefundStatus)}>{d.RefundStatus}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

const pages = {
  dashboard: Dashboard,
  categories: CategoriesPage,
  inventory: InventoryPage,
  customers: CustomersPage,
  rentals: RentalsPage,
  deposits: DepositsPage,
};

/* ---------------- App ---------------- */

function App() {
  const [page, setPage] = useState("dashboard");
  const data = useApiData();
  const Page = pages[page];
  const meta = pageMeta[page];

  const activeRentals = data.rentals.filter(r => !r.ActualReturn);
  const overdueCount = activeRentals.filter(r => new Date(r.ExpectedBack) < new Date()).length;
  const heldTotal = data.deposits
    .filter(d => d.RefundStatus === "Held")
    .reduce((a, d) => a + Number(d.AmountHeld), 0);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ApertureIcon /></div>
          <div className="brand-text">
            <span className="name">SnapVault</span>
            <span className="sub">GEAR RENTAL LOG</span>
          </div>
        </div>
        <nav className="nav">
          {navItems.map(n => (
            <div key={n.key} className={`nav-item ${page===n.key ? "active":""}`} onClick={() => setPage(n.key)}>
              <span className="dot"></span>
              <span className="icon">{icons[n.key]}</span>
              {n.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="label">SHOP STATUS</div>
          <div className="val">{data.inventory.length} units · {data.categories.length} categories</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-desc">{meta.desc}</div>
            <div className="readout">
              <div className="readout-cell"><div className="l">In stock</div><div className="v">{data.inventory.length}</div></div>
              <div className="readout-cell"><div className="l">On loan</div><div className="v">{activeRentals.length}</div></div>
              <div className="readout-cell"><div className="l">Overdue</div><div className="v">{overdueCount}</div></div>
              <div className="readout-cell"><div className="l">Held ₱</div><div className="v">{heldTotal.toLocaleString()}</div></div>
            </div>
          </div>
        </header>
        <main className="content">
          {data.loading && <p style={{color:"var(--muted)"}}>Loading live data from the server…</p>}
          {data.error && <p style={{color:"var(--rose)"}}>{data.error}</p>}
          {!data.loading && !data.error && <Page data={data} />}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
