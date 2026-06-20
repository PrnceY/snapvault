const pages = {
  dashboard: Dashboard,
  categories: CategoriesPage,
  inventory: InventoryPage,
  customers: CustomersPage,
  rentals: RentalsPage,
  deposits: DepositsPage,
};

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
          {!data.loading && !data.error && <Page data={data} setPage={setPage} />}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
