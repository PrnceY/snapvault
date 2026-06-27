const pages = {
  dashboard:     Dashboard,
  categories:    CategoriesPage,
  inventory:     InventoryPage,
  customers:     CustomersPage,
  rentals:       RentalsPage,
  deposits:      DepositsPage,
  compatibility: CompatibilityPage,
  reports:       ReportsPage,
  auditlogs:     AuditLogsPage,
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [rentalFilter, setRentalFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const data = useApiData();
  const Page = pages[page];
  const meta = pageMeta[page];

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle("light-mode", !next);
  };

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
          <button
            onClick={() => setConfirmSignOut(true)}
            style={{
              display:"flex", alignItems:"center", gap:9, marginTop:14,
              width:"100%", padding:"9px 10px", borderRadius:9, border:"none",
              background:"none", cursor:"pointer", color:"var(--muted)",
              fontSize:13, fontWeight:500, fontFamily:"'Inter',sans-serif",
              transition:"background .15s, color .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="var(--card-hover)"; e.currentTarget.style.color="var(--rose)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--muted)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-inner" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div className="topbar-title">{meta.title}</div>
            <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
          </div>
        </header>
        <main className="content">
          {data.loading && <p style={{color:"var(--muted)"}}>Loading live data from the server…</p>}
          {data.error && <p style={{color:"var(--rose)"}}>{data.error}</p>}
          {!data.loading && !data.error && (
            <Page
              data={data}
              setPage={setPage}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              rentalFilter={rentalFilter}
              setRentalFilter={setRentalFilter}
            />
          )}
        </main>
      </div>
    {confirmSignOut && (
        <ConfirmDialog
          title="Sign Out"
          message="Are you sure you want to sign out of SnapVault?"
          confirmLabel="Sign Out"
          confirmTone="rose"
          onConfirm={() => { fetch('session_check.php').finally(() => { window.location.href = 'index.html'; }); }}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);