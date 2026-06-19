const { useState, useMemo } = React;

/* ---------------- Sample data ---------------- */

const categories = [
  { id:"CAT-01", name:"Camera Bodies", count:9, desc:"Mirrorless & DSLR bodies" },
  { id:"CAT-02", name:"Lenses", count:14, desc:"Primes, zooms, specialty glass" },
  { id:"CAT-03", name:"Lighting", count:7, desc:"Strobes, continuous & modifiers" },
  { id:"CAT-04", name:"Tripods", count:6, desc:"Supports & stabilizers" },
];

//test

const inventory = [
  { sn:"CR5-0042", item:"Canon EOS R5", cat:"Camera Bodies", condition:"Excellent", status:"Rented" },
  { sn:"SA7-0117", item:"Sony A7 IV", cat:"Camera Bodies", condition:"Good", status:"Available" },
  { sn:"SG2470-009", item:"Sigma 24–70mm f/2.8", cat:"Lenses", condition:"Excellent", status:"Available" },
  { sn:"CN70200-021", item:"Canon RF 70–200mm f/2.8", cat:"Lenses", condition:"Good", status:"Rented" },
  { sn:"PF-B10-005", item:"Profoto B10 Flash", cat:"Lighting", condition:"Fair", status:"Maintenance" },
  { sn:"MF-CF55-013", item:"Manfrotto Carbon Tripod", cat:"Tripods", condition:"Excellent", status:"Available" },
  { sn:"GD-560-002", item:"Godox SL60 LED Panel", cat:"Lighting", condition:"Good", status:"Available" },
];

const customers = [
  { id:"CUS-001", name:"Maria Ortega", idType:"School ID", contact:"0917 552 0143", verified:true },
  { id:"CUS-002", name:"Diego Aguilar", idType:"Driver's License", contact:"0928 113 7720", verified:true },
  { id:"CUS-003", name:"Liane Maratas", idType:"Passport", contact:"0945 880 2291", verified:false },
  { id:"CUS-004", name:"Kyle Ouano", idType:"School ID", contact:"0933 220 4456", verified:true },
];

const rentals = [
  { id:"RNT-101", customer:"Maria Ortega", item:"Canon EOS R5", out:"Jun 12", expected:"Jun 16", returned:null },
  { id:"RNT-102", customer:"Diego Aguilar", item:"Canon RF 70–200mm f/2.8", out:"Jun 14", expected:"Jun 18", returned:null },
  { id:"RNT-103", customer:"Kyle Ouano", item:"Godox SL60 LED Panel", out:"Jun 08", expected:"Jun 11", returned:"Jun 11" },
  { id:"RNT-104", customer:"Liane Maratas", item:"Profoto B10 Flash", out:"Jun 05", expected:"Jun 09", returned:"Jun 13" },
];

const deposits = [
  { id:"DEP-101", rental:"RNT-101", amount:8000, status:"Held" },
  { id:"DEP-102", rental:"RNT-102", amount:12000, status:"Held" },
  { id:"DEP-103", rental:"RNT-103", amount:3000, status:"Full Refund" },
  { id:"DEP-104", rental:"RNT-104", amount:5000, status:"Partial Refund" },
];

/* ---------------- Small components ---------------- */

function Chip({ tone, children }) {
  return (
    <span className={`chip ${tone}`}>
      <span className="d"></span>{children}
    </span>
  );
}

function statusTone(s) {
  if (s === "Available" || s === "Full Refund" || s === "Done") return "green";
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

/* ---------------- Pages ---------------- */

function Dashboard() {
  const activeRentals = rentals.filter(r => !r.returned).length;
  const overdue = 1;
  const heldTotal = deposits.filter(d => d.status === "Held").reduce((a,d) => a + d.amount, 0);

  return (
    <>
      <div className="cards-grid">
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Units in stock</span><div className="ic">{icons.inventory}</div></div>
          <div className="num">36</div>
          <div className="lab">Across 4 categories</div>
        </div>
        <div className="stat-card">
          <div className="top"><span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Active rentals</span><div className="ic">{icons.rentals}</div></div>
          <div className="num">{activeRentals}</div>
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

      <div className="section-head"><h2>Rentals currently out</h2><span className="count">{activeRentals} open</span></div>
      <Frame>
        <table>
          <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Status</th></tr></thead>
          <tbody>
            {rentals.filter(r => !r.returned).map(r => (
              <tr key={r.id}>
                <td className="mono-cell">{r.id}</td>
                <td>{r.customer}</td>
                <td>{r.item}</td>
                <td className="mono-cell">{r.out}</td>
                <td className="mono-cell">{r.expected}</td>
                <td><Chip tone={r.expected === "Jun 16" ? "rose" : "amber"}>{r.expected === "Jun 16" ? "Overdue" : "On loan"}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>
    </>
  );
}

function CategoriesPage() {
  return (
    <div className="cards-grid">
      {categories.map(c => (
        <div className="stat-card" key={c.id}>
          <div className="top">
            <span className="lab" style={{fontSize:11,color:"var(--muted)"}} >{c.id}</span>
            <div className="ic">{icons.categories}</div>
          </div>
          <div className="num" style={{fontSize:20}}>{c.name}</div>
          <div className="lab">{c.desc}</div>
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
            <span className="lab">Units</span>
            <span className="mono" style={{fontSize:13}}>{c.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryPage() {
  const [filter, setFilter] = useState("All");
  const statuses = ["All","Available","Rented","Maintenance"];
  const rows = inventory.filter(i => filter === "All" || i.status === filter);
  return (
    <>
      <div className="pill-row">
        {statuses.map(s => (
          <div key={s} className={`pill ${filter===s ? "on":""}`} onClick={() => setFilter(s)}>{s}</div>
        ))}
      </div>
      <Frame>
        <table>
          <thead><tr><th>Serial No.</th><th>Item</th><th>Category</th><th>Condition</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(i => (
              <tr key={i.sn}>
                <td className="mono-cell">{i.sn}</td>
                <td className="empty-name">{i.item}</td>
                <td>{i.cat}</td>
                <td>{i.condition}</td>
                <td><Chip tone={statusTone(i.status)}>{i.status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>
    </>
  );
}

function CustomersPage() {
  return (
    <Frame>
      <table>
        <thead><tr><th>Customer ID</th><th>Name</th><th>ID Type</th><th>Contact</th><th>Verification</th></tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td className="mono-cell">{c.id}</td>
              <td className="empty-name">{c.name}</td>
              <td>{c.idType}</td>
              <td className="mono-cell">{c.contact}</td>
              <td><Chip tone={c.verified ? "green":"rose"}>{c.verified ? "Verified" : "Pending"}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function RentalsPage() {
  return (
    <Frame>
      <table>
        <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Actual return</th><th>Status</th></tr></thead>
        <tbody>
          {rentals.map(r => {
            const status = r.returned ? "Done" : "Rented";
            return (
              <tr key={r.id}>
                <td className="mono-cell">{r.id}</td>
                <td>{r.customer}</td>
                <td>{r.item}</td>
                <td className="mono-cell">{r.out}</td>
                <td className="mono-cell">{r.expected}</td>
                <td className="mono-cell">{r.returned || "—"}</td>
                <td><Chip tone={statusTone(status)}>{r.returned ? "Returned" : "On loan"}</Chip></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Frame>
  );
}

function DepositsPage() {
  return (
    <Frame>
      <table>
        <thead><tr><th>Deposit ID</th><th>Linked Rental</th><th>Amount</th><th>Refund Status</th></tr></thead>
        <tbody>
          {deposits.map(d => (
            <tr key={d.id}>
              <td className="mono-cell">{d.id}</td>
              <td className="mono-cell">{d.rental}</td>
              <td className="mono-cell">₱{d.amount.toLocaleString()}</td>
              <td><Chip tone={statusTone(d.status)}>{d.status}</Chip></td>
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
  const Page = pages[page];
  const meta = pageMeta[page];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ApertureIcon /></div>
          <div className="brand-text">
            <span className="name">ƒ/STOCK</span>
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
          <div className="val">36 units · 4 categories</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-desc">{meta.desc}</div>
            <div className="readout">
              <div className="readout-cell"><div className="l">In stock</div><div className="v">36</div></div>
              <div className="readout-cell"><div className="l">On loan</div><div className="v">{rentals.filter(r=>!r.returned).length}</div></div>
              <div className="readout-cell"><div className="l">Overdue</div><div className="v">1</div></div>
              <div className="readout-cell"><div className="l">Held ₱</div><div className="v">20,000</div></div>
            </div>
          </div>
        </header>
        <main className="content">
          <Page />
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
