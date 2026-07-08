function Dashboard({ data, setPage, setRentalFilter }) {
  const { inventory, rentals, deposits, categories } = data;
  const [showAllActivity, setShowAllActivity] = useState(false);
  const activeRentals = rentals.filter(r => !r.ActualReturn);
  const returned      = rentals.filter(r => !!r.ActualReturn);
  const now           = new Date();
  const overdueList   = activeRentals.filter(r => new Date(r.ExpectedBack) < now);
  const availableUnits = inventory.filter(i => Number(i.Archived) === 0 && i.Status === "Available").length;
  const heldTotal     = deposits
    .filter(d => d.RefundStatus === "Held")
    .reduce((a, d) => a + Number(d.AmountHeld), 0);

  // Equipment by category counts
  const catCounts = categories.map(c => ({
    name: c.CategoryName,
    count: inventory.filter(i => i.CategoryName === c.CategoryName && Number(i.Archived) === 0).length,
  }));
  const maxCat = Math.max(...catCounts.map(c => c.count), 1);

  // Rental status breakdown
  const statusBreakdown = [
    { label: "Active",           tone: "green", count: activeRentals.filter(r => new Date(r.ExpectedBack) >= now).length },
    { label: "Overdue",          tone: "rose",  count: overdueList.length },
    { label: "Returned",         tone: "muted", count: returned.length },
  ];

  // Recent activity — derived from latest rentals
  const allActivity = [...rentals]
    .sort((a, b) => new Date(b.DateOut) - new Date(a.DateOut))
    .map(r => ({
      label: r.ActualReturn ? "Rental Returned" : "Rental Created",
      sub:   `${r.Item} · ${r.Customer}`,
      date:  fmtDate(r.ActualReturn || r.DateOut),
      tone:  r.ActualReturn ? "green" : "amber",
    }));
  const recentActivity = allActivity.slice(0, 4);

  // Rentals currently out, most recent first, capped for the dashboard table
  const activeRentalsSorted = [...activeRentals].sort((a, b) => new Date(b.DateOut) - new Date(a.DateOut));
  const recentActiveRentals = activeRentalsSorted.slice(0, 5);

  const bottomPanelStyle = {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "20px 22px",
    flex: 1,
    minWidth: 0,
  };

  return (
    <>
      {/* ── KPI Cards ── */}
      <div className="cards-grid" style={{marginBottom: 22}}>
        <div className="stat-card clickable" onClick={() => setPage("inventory")}>
          <div className="top">
            <span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Units In Stock</span>
            <div className="ic">{icons.inventory}</div>
          </div>
          <div className="num">{availableUnits}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span className="lab">Available for rental</span>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace"}}>{inventory.filter(i=>Number(i.Archived)===0).length} items total</span>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => { setRentalFilter("On Loan"); setPage("rentals"); }}>
          <div className="top">
            <span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Active Rentals</span>
            <div className="ic" style={{color:"var(--green)"}}>{icons.rentals}</div>
          </div>
          <div className="num">{activeRentals.length}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span className="lab">Currently out</span>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace"}}>{activeRentals.length} rentals</span>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => { setRentalFilter("On Loan"); setPage("rentals"); }}>
          <div className="top">
            <span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Overdue Rentals</span>
            <div className="ic" style={{color:"var(--rose)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div className="num" style={{color:"var(--rose)"}}>{overdueList.length}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span className="lab">Requires follow-up</span>
            <span style={{fontSize:11,color:"var(--rose)",fontFamily:"'IBM Plex Mono',monospace"}}>{overdueList.length > 0 ? "Action needed" : "All clear"}</span>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => setPage("deposits")}>
          <div className="top">
            <span className="lab" style={{fontSize:12,color:"var(--muted)"}}>Deposits Held</span>
            <div className="ic">{icons.deposits}</div>
          </div>
          <div className="num" style={{fontSize:22}}>₱{heldTotal.toLocaleString()}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span className="lab">Across active rentals</span>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace"}}>{activeRentals.length} rentals</span>
          </div>
        </div>
      </div>

      {/* ── Rentals Currently Out table ── */}
      <div className="section-head" style={{marginBottom:14}}>
        <h2>Rentals Currently Out</h2>
        <span
          style={{fontSize:12,color:"var(--amber)",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",display:"flex",alignItems:"center",gap:4}}
          onClick={() => { setRentalFilter("On Loan"); setPage("rentals"); }}
        >
          View All ›
        </span>
      </div>
      <Frame style={{marginBottom:22}}>
        <table>
          <thead>
            <tr>
              <th>Rental ID</th><th>Customer</th><th>Item</th>
              <th>Date Out</th><th>Expected Return</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeRentals.length === 0 && (
              <tr><td colSpan="6" style={{color:"var(--muted)",textAlign:"center",padding:24}}>No active rentals.</td></tr>
            )}
            {recentActiveRentals.map(r => {
              const isOverdue = new Date(r.ExpectedBack) < now;
              return (
                <tr key={r.RentalID} className="row-clickable" onClick={() => { setRentalFilter("On Loan"); setPage("rentals"); }}>
                  <td><span style={{color:"var(--amber)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12}}>RNT-{r.RentalID}</span></td>
                  <td>
                    <div style={{fontWeight:600,fontSize:13}}>{r.Customer}</div>
                  </td>
                  <td>{r.Item}</td>
                  <td className="mono-cell">{fmtDate(r.DateOut)}</td>
                  <td className="mono-cell" style={{color: isOverdue ? "var(--rose)" : "inherit", fontWeight: isOverdue ? 600 : 400}}>
                    {fmtDate(r.ExpectedBack)}
                  </td>
                  <td><Chip tone={isOverdue ? "rose" : "green"}>{isOverdue ? "Overdue" : "Active"}</Chip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>

      {/* ── Bottom 3-panel row ── */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>

        {/* Equipment by Category */}
        <div style={bottomPanelStyle}>
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,marginBottom:16,textTransform:"uppercase"}}>Equipment by Category</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {catCounts.map(c => (
              <div key={c.name}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                  <span>{c.name}</span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--muted)"}}>{c.count}</span>
                </div>
                <div style={{height:4,background:"var(--line)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:"100%",background:"var(--amber)",borderRadius:4}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rental Status */}
        <div style={bottomPanelStyle}>
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,marginBottom:16,textTransform:"uppercase"}}>Rental Status</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {statusBreakdown.map(s => (
              <div
                key={s.label}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                onClick={() => { setRentalFilter(s.label === "Returned" ? "Returned" : "On Loan"); setPage("rentals"); }}
              >
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:`var(--${s.tone})`}}></span>
                  <span style={{fontSize:13}}>{s.label}</span>
                </div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:600}}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={bottomPanelStyle}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,textTransform:"uppercase"}}>Recent Activity</span>
            {allActivity.length > 4 && (
              <span style={{fontSize:11.5,color:"var(--amber)",cursor:"pointer",fontWeight:600}} onClick={() => setShowAllActivity(true)}>View All</span>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {recentActivity.length === 0 && <span style={{fontSize:13,color:"var(--muted)"}}>No activity yet.</span>}
            {recentActivity.map((a, i) => (
              <div key={i}>
                <div style={{fontSize:13,fontWeight:500}}>{a.label}</div>
                <div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>{a.sub} · {a.date}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showAllActivity && (
        <Modal title="All Recent Activity" onClose={() => setShowAllActivity(false)} width={420}>
          <div style={{display:"flex",flexDirection:"column",gap:14,maxHeight:420,overflowY:"auto"}}>
            {allActivity.map((a, i) => (
              <div key={i}>
                <div style={{fontSize:13,fontWeight:500}}>{a.label}</div>
                <div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>{a.sub} · {a.date}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function CategoriesPage({ data, setPage, setCategoryFilter }) {
  const { categories, inventory } = data;
  const openCategory = (categoryName) => {
    setCategoryFilter(categoryName);
    setPage("inventory");
  };
  return (
    <div className="cards-grid">
      {categories.map(c => (
        <div className="stat-card clickable" key={c.CategoryID} onClick={() => openCategory(c.CategoryName)}>
          <div className="top">
            <span className="lab" style={{fontSize:11,color:"var(--muted)"}}>CAT-{String(c.CategoryID).padStart(2,"0")}</span>
            <div className="ic">{icons.categories}</div>
          </div>
          <div className="num" style={{fontSize:22, marginTop:18}}>{c.CategoryName}</div>
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
            <span className="lab">Units</span>
            <span className="mono" style={{fontSize:13}}>{inventory.filter(i => i.CategoryName === c.CategoryName).length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryPage({ data, categoryFilter, setCategoryFilter }) {
  const { inventory, categories, refetch } = data;
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ SerialNumber:"", CategoryID:"", ItemName:"", RentalRate:"", ConditionStatus:"Good", Status:"Available", Image:null });
  const [imagePreview, setImagePreview] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const statuses = ["All","Available","Rented","Maintenance","Archived"];
  const categoryOptions = ["All", ...categories.map(c => c.CategoryName)];
  const rows = inventory.filter(i => {
    const isArchived = Number(i.Archived) === 1;
    const matchesCategory = categoryFilter === "All" || i.CategoryName === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || i.ItemName.toLowerCase().includes(q)
      || i.SerialNumber.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter === "Archived") return isArchived && matchesCategory;
    if (isArchived) return false;
    return (filter === "All" || i.Status === filter) && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const submit = () => {
    if (!form.SerialNumber || !form.CategoryID || !form.ItemName) {
      setFormError("Serial number, category, and item name are required.");
      return;
    }
    setSaving(true);
    setFormError(null);

    const body = new FormData();
    body.append("action", "add");
    body.append("SerialNumber", form.SerialNumber);
    body.append("CategoryID", form.CategoryID);
    body.append("ItemName", form.ItemName);
    body.append("ConditionStatus", form.ConditionStatus);
    body.append("Status", form.Status);
    body.append("RentalRate", form.RentalRate || 0);
    if (form.Image) body.append("Image", form.Image);

    fetch("inventory.php", { method: "POST", body })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setShowForm(false);
          setForm({ SerialNumber:"", CategoryID:"", ItemName:"", RentalRate:"", ConditionStatus:"Good", Status:"Available", Image:null });
          setImagePreview(null);
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  const restoreItem = (serial) => {
    fetch("inventory.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", SerialNumber: serial }),
    })
      .then(r => r.json())
      .then(res => { if (res.success) refetch(); })
      .catch(() => {});
  };

  const confirmDelete = () => {
    setSaving(true);
    setFormError(null);
    fetch("inventory.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", SerialNumber: deletingItem.SerialNumber }),
    })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setDeletingItem(null);
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);

  const submitEdit = () => {
    setEditSaving(true);
    setEditError(null);

    const body = new FormData();
    body.append("action", "edit");
    body.append("SerialNumber", editForm.SerialNumber);
    body.append("ItemName", editForm.ItemName);
    body.append("RentalRate", editForm.RentalRate || 0);
    body.append("CategoryID", editForm.CategoryID);
    body.append("ConditionStatus", editForm.ConditionStatus);
    body.append("Status", editForm.Status);
    if (editForm.Image) body.append("Image", editForm.Image);

    fetch("inventory.php", { method: "POST", body })
      .then(r => r.json())
      .then(res => {
        setEditSaving(false);
        if (res.success) { setEditingItem(null); setEditImagePreview(null); refetch(); }
        else setEditError(res.error || "Something went wrong.");
      })
      .catch(() => { setEditSaving(false); setEditError("Could not reach the server."); });
  };

  return (
    <>
      <div style={{position:"relative", marginBottom:14, maxWidth:320}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
          style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none"}}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or serial number…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          style={{...inputStyle, paddingLeft:36}}
        />
      </div>
      <div className="pill-row" style={{justifyContent:"space-between", display:"flex", flexWrap:"wrap", gap:10}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {statuses.map(s => (
            <div key={s} className={`pill ${filter===s ? "on":""}`} onClick={() => { setFilter(s); setCurrentPage(1); }}>{s}</div>
          ))}
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {categoryOptions.map(c => (
            <div key={c} className={`pill ${categoryFilter===c ? "on":""}`} onClick={() => { setCategoryFilter(c); setCurrentPage(1); }}>{c}</div>
          ))}
        </div>
        <div className="pill" style={{background:"var(--amber)", color:"#1A1320", borderColor:"var(--amber)", fontWeight:600}} onClick={() => setShowForm(true)}>
          + Add Item
        </div>
      </div>
      <Frame>
        <table>
          <thead><tr><th></th><th>Serial No.</th><th>Item</th><th>Category</th><th>Condition</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {pageRows.map(i => (
              <tr key={i.SerialNumber}>
                <td>
                  {i.ImagePath
                    ? <img src={i.ImagePath} alt={i.ItemName} className="thumb" />
                    : <div className="thumb thumb-empty">{icons.inventory}</div>}
                </td>
                <td className="mono-cell">{i.SerialNumber}</td>
                <td className="empty-name">{i.ItemName}</td>
                <td>{i.CategoryName}</td>
                <td>{i.ConditionStatus}</td>
                <td><Chip tone={statusTone(i.Status)}>{i.Status}</Chip></td>
                <td>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    {Number(i.Archived) === 1 ? (
                      <span
                        style={{fontSize:11.5, color:"var(--amber)", cursor:"pointer", fontWeight:600}}
                        onClick={() => restoreItem(i.SerialNumber)}
                      >
                        Restore
                      </span>
                    ) : (
                      <>
                        <span
                          title="Edit item"
                          style={{cursor:"pointer", color:"var(--muted)", display:"flex", alignItems:"center"}}
                          onClick={() => { setEditingItem(i); setEditForm({ SerialNumber:i.SerialNumber, ItemName:i.ItemName, RentalRate:i.RentalRate||"", CategoryID: categories.find(c=>c.CategoryName===i.CategoryName)?.CategoryID||"", ConditionStatus:i.ConditionStatus, Status:i.Status, Image:null }); setEditImagePreview(i.ImagePath || null); setEditError(null); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </span>
                        {i.Status !== "Rented" && (
                          <span
                            title="Archive item"
                            style={{cursor:"pointer", color:"var(--rose)", display:"flex", alignItems:"center"}}
                            onClick={() => { setDeletingItem(i); setFormError(null); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>

      {totalPages > 1 && (
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, padding:"0 4px"}}>
          <span style={{fontSize:12, color:"var(--muted)", fontFamily:"'IBM Plex Mono',monospace"}}>
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length} items
          </span>
          <div style={{display:"flex", gap:6}}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{padding:"6px 13px", borderRadius:8, border:"1px solid var(--line)", background:"var(--card)", color: safePage === 1 ? "var(--muted)" : "var(--text)", cursor: safePage === 1 ? "default" : "pointer", fontSize:12, fontFamily:"'Inter',sans-serif"}}
            >
              ← Prev
            </button>
            {Array.from({length: totalPages}, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => p === "..." ? (
                <span key={`ellipsis-${idx}`} style={{padding:"6px 4px", color:"var(--muted)", fontSize:12}}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{padding:"6px 11px", borderRadius:8, border:"1px solid", borderColor: p === safePage ? "var(--amber)" : "var(--line)", background: p === safePage ? "var(--amber)" : "var(--card)", color: p === safePage ? "#1A1320" : "var(--text)", cursor:"pointer", fontSize:12, fontWeight: p === safePage ? 600 : 400, fontFamily:"'Inter',sans-serif"}}
                >
                  {p}
                </button>
              ))
            }
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{padding:"6px 13px", borderRadius:8, border:"1px solid var(--line)", background:"var(--card)", color: safePage === totalPages ? "var(--muted)" : "var(--text)", cursor: safePage === totalPages ? "default" : "pointer", fontSize:12, fontFamily:"'Inter',sans-serif"}}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="Add Inventory Item" onClose={() => setShowForm(false)}>
          <div>
            <FormField label="Photo">
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div className="thumb thumb-large">
                  {imagePreview ? <img src={imagePreview} alt="Preview" /> : icons.inventory}
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={e => {
                    const file = e.target.files[0] || null;
                    setForm({...form, Image:file});
                    setImagePreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </div>
            </FormField>
            <FormField label="Serial Number">
              <input style={inputStyle} value={form.SerialNumber} onChange={e => setForm({...form, SerialNumber:e.target.value})} placeholder="e.g. CR5-0099" />
            </FormField>
            <FormField label="Item Name">
              <input style={inputStyle} value={form.ItemName} onChange={e => setForm({...form, ItemName:e.target.value})} placeholder="e.g. Canon EOS R6" />
            </FormField>
            <FormField label="Rental Rate (₱/day)">
              <input type="number" min="0" style={inputStyle} value={form.RentalRate || ""} onChange={e => setForm({...form, RentalRate:e.target.value})} placeholder="e.g. 1500" />
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
            <button type="button" style={buttonStyle} disabled={saving} onClick={() => {
              if (!form.SerialNumber || !form.CategoryID || !form.ItemName) {
                setFormError("Serial number, category, and item name are required.");
                return;
              }
              setFormError(null);
              setConfirmAdd(true);
            }}>{saving ? "Saving…" : "Add to Inventory"}</button>
          </div>
        </Modal>
      )}

      {deletingItem && (
        <Modal title="Archive Item" onClose={() => setDeletingItem(null)}>
          <p style={{fontSize:13.5, color:"var(--muted)", marginBottom:16}}>
            Archive <strong style={{color:"var(--text)"}}>{deletingItem.ItemName}</strong> ({deletingItem.SerialNumber})? It'll be hidden from inventory but its rental history stays intact.
          </p>
          {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginBottom:10}}>{formError}</p>}
          <button
            style={{...buttonStyle, background:"var(--rose)", color:"#fff"}}
            disabled={saving}
            onClick={confirmDelete}
          >
            {saving ? "Archiving…" : "Archive Item"}
          </button>
        </Modal>
      )}

      {editingItem && (
        <Modal title={`Edit — ${editingItem.ItemName}`} onClose={() => setEditingItem(null)}>
          <div>
            <FormField label="Photo">
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div className="thumb thumb-large">
                  {editImagePreview
                    ? <img src={editImagePreview} alt="" />
                    : icons.inventory}
                </div>
                <label style={{...buttonStyle, width:"auto", padding:"8px 14px", marginTop:0, display:"inline-block", cursor:"pointer", textAlign:"center"}}>
                  Change Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{display:"none"}}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setEditForm({...editForm, Image:file});
                      setEditImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </FormField>
            <FormField label="Item Name">
              <input style={inputStyle} value={editForm.ItemName} onChange={e => setEditForm({...editForm, ItemName:e.target.value})} />
            </FormField>
            <FormField label="Rental Rate (₱/day)">
              <input type="number" min="0" style={inputStyle} value={editForm.RentalRate} onChange={e => setEditForm({...editForm, RentalRate:e.target.value})} placeholder="e.g. 1500" />
            </FormField>
            <FormField label="Category">
              <select style={inputStyle} value={editForm.CategoryID} onChange={e => setEditForm({...editForm, CategoryID:e.target.value})}>
                {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
              </select>
            </FormField>
            <FormField label="Condition">
              <select style={inputStyle} value={editForm.ConditionStatus} onChange={e => setEditForm({...editForm, ConditionStatus:e.target.value})}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Damaged</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select style={inputStyle} value={editForm.Status} onChange={e => setEditForm({...editForm, Status:e.target.value})}>
                <option>Available</option><option>Rented</option><option>Maintenance</option>
              </select>
            </FormField>
            {editError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{editError}</p>}
            <button type="button" style={buttonStyle} disabled={editSaving} onClick={() => setConfirmEdit(true)}>
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
      {confirmAdd && (
        <ConfirmDialog
          title="Add to Inventory"
          message={`Add "${form.ItemName}" (${form.SerialNumber}) to inventory?`}
          confirmLabel="Add Item"
          confirmTone="amber"
          onConfirm={() => { setConfirmAdd(false); submit(); }}
          onCancel={() => setConfirmAdd(false)}
        />
      )}
      {confirmEdit && (
        <ConfirmDialog
          title="Save Changes"
          message={`Save changes to "${editForm.ItemName}"?`}
          confirmLabel="Save Changes"
          confirmTone="amber"
          onConfirm={() => { setConfirmEdit(false); submitEdit(); }}
          onCancel={() => setConfirmEdit(false)}
        />
      )}
    </>
  );
}

function CustomersPage({ data }) {
  const { customers, refetch } = data;
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ FullName:"", IDType:"School ID", ContactNumber:"" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const filters = ["All","Verified","Pending","Unverified"];
  const rows = customers.filter(c => {
    if (filter === "All") return true;
    return (c.VerificationStatus || "Unverified") === filter;
  });

  function approveId() {
    setReviewSaving(true);
    setReviewError(null);
    fetch("customers.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", CustomerID: reviewing.CustomerID }),
    })
      .then(r => r.json())
      .then(res => {
        setReviewSaving(false);
        if (res.success) { setReviewing(null); refetch(); }
        else setReviewError(res.error || "Could not verify customer.");
      })
      .catch(() => { setReviewSaving(false); setReviewError("Could not reach the server."); });
  }

  function rejectId() {
    setReviewSaving(true);
    setReviewError(null);
    fetch("customers.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", CustomerID: reviewing.CustomerID }),
    })
      .then(r => r.json())
      .then(res => {
        setReviewSaving(false);
        if (res.success) { setReviewing(null); refetch(); }
        else setReviewError(res.error || "Could not reject ID.");
      })
      .catch(() => { setReviewSaving(false); setReviewError("Could not reach the server."); });
  }

  const submit = (e) => {
    e.preventDefault();
    if (!form.FullName) {
      setFormError("Full name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    fetch("customers.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, action: "add" }),
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
      <div className="pill-row" style={{justifyContent:"space-between", display:"flex", flexWrap:"wrap", gap:10}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {filters.map(f => (
            <div key={f} className={`pill ${filter===f ? "on":""}`} onClick={() => setFilter(f)}>{f}</div>
          ))}
        </div>
        <div className="pill" style={{background:"var(--amber)", color:"#1A1320", borderColor:"var(--amber)", fontWeight:600}} onClick={() => setShowForm(true)}>
          + Add Customer
        </div>
      </div>
      <Frame>
        <table>
          <thead><tr><th>Customer ID</th><th>Name</th><th>ID Type</th><th>Contact</th><th>Verification</th></tr></thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.CustomerID}>
                <td className="mono-cell">CUS-{String(c.CustomerID).padStart(3,"0")}</td>
                <td className="empty-name">{c.FullName}</td>
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
            {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{formError}</p>}
            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? "Saving…" : "Add Customer"}</button>
          </form>
        </Modal>
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
    </>
  );
}

function RentalsPage({ data, rentalFilter, setRentalFilter }) {
  const { rentals, customers, inventory, refetch } = data;
  const [showForm, setShowForm] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [form, setForm] = useState({ CustomerID:"", SerialNumber:"", ExpectedBack:"", DepositAmount:"" });
  const [refundChoice, setRefundChoice] = useState("Full Refund");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [confirmArchiveRental, setConfirmArchiveRental] = useState(null);
  const [confirmRestoreRental, setConfirmRestoreRental] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const filters = ["All","On Loan","Returned","Archived"];

  const availableItems = inventory.filter(i => i.Status === "Available");
  const rows = rentals.filter(r => {
    const isArchived = Number(r.Archived) === 1;
    if (rentalFilter === "Archived") return isArchived;
    if (isArchived) return false;
    if (rentalFilter === "All") return true;
    return rentalFilter === "On Loan" ? !r.ActualReturn : !!r.ActualReturn;
  });

  const submitRental = (e) => {
    e.preventDefault();
    if (!form.CustomerID || !form.SerialNumber || !form.ExpectedBack) {
      setFormError("Customer, item, and expected return date are all required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    fetch("rentals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, action: "create" }),
    })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setShowForm(false);
          setForm({ CustomerID:"", SerialNumber:"", ExpectedBack:"", DepositAmount:"" });
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  const submitReturn = (e) => {
    e.preventDefault();
    setSaving(true);
    fetch("rentals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", RentalID: returningId, RefundStatus: refundChoice }),
    })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setReturningId(null);
          refetch();
        } else {
          setFormError(res.error || "Something went wrong.");
        }
      })
      .catch(() => { setSaving(false); setFormError("Could not reach the server."); });
  };

  const archiveRental = (rentalId) => {
    fetch("rentals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", RentalID: rentalId }),
    })
      .then(r => r.json())
      .then(res => { if (res.success) refetch(); })
      .catch(() => {});
  };

  const restoreRental = (rentalId) => {
    fetch("rentals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", RentalID: rentalId }),
    })
      .then(r => r.json())
      .then(res => { if (res.success) refetch(); })
      .catch(() => {});
  };

  return (
    <>
      <div className="pill-row" style={{justifyContent:"space-between", display:"flex", flexWrap:"wrap", gap:10}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {filters.map(f => (
            <div key={f} className={`pill ${rentalFilter===f ? "on":""}`} onClick={() => setRentalFilter(f)}>{f}</div>
          ))}
        </div>
        <div className="pill" style={{background:"var(--amber)", color:"#1A1320", borderColor:"var(--amber)", fontWeight:600}} onClick={() => setShowForm(true)}>
          + New Rental
        </div>
      </div>
      <Frame>
        <table>
          <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Actual return</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.RentalID}>
                <td className="mono-cell">RNT-{r.RentalID}</td>
                <td>{r.Customer}</td>
                <td>{r.Item}</td>
                <td className="mono-cell">{fmtDate(r.DateOut)}</td>
                <td className="mono-cell">{fmtDate(r.ExpectedBack)}</td>
                <td className="mono-cell">{r.ActualReturn ? fmtDate(r.ActualReturn) : "—"}</td>
                <td>
                  {(() => {
                    const isArchived = Number(r.Archived) === 1;
                    const isOverdue  = !r.ActualReturn && !isArchived && new Date(r.ExpectedBack) < new Date();
                    const label = isArchived ? "Archived" : r.ActualReturn ? "Returned" : isOverdue ? "Overdue" : "On loan";
                    const tone  = isArchived ? "muted" : isOverdue ? "rose" : statusTone(r.ActualReturn ? "Done" : "Rented");
                    return <Chip tone={tone}>{label}</Chip>;
                  })()}
                </td>
                <td>
                  {Number(r.Archived) === 1 ? (
                    <span
                      style={{fontSize:11.5, color:"var(--amber)", cursor:"pointer", fontWeight:600}}
                      onClick={() => setConfirmRestoreRental(r.RentalID)}
                    >
                      Restore
                    </span>
                  ) : !r.ActualReturn ? (
                    <span
                      style={{fontSize:11.5, color:"var(--amber)", cursor:"pointer", fontWeight:600}}
                      onClick={() => { setReturningId(r.RentalID); setFormError(null); }}
                    >
                      Mark Returned
                    </span>
                  ) : (
                    <span
                      style={{fontSize:11.5, color:"var(--muted)", cursor:"pointer", fontWeight:600}}
                      onClick={() => setConfirmArchiveRental(r.RentalID)}
                    >
                      Archive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>

      {showForm && (
        <Modal title="New Rental" onClose={() => setShowForm(false)}>
          <form onSubmit={submitRental}>
            <FormField label="Customer">
              <select style={inputStyle} value={form.CustomerID} onChange={e => setForm({...form, CustomerID:e.target.value})}>
                <option value="">Select a customer</option>
                {customers.map(c => <option key={c.CustomerID} value={c.CustomerID}>{c.FullName}</option>)}
              </select>
            </FormField>
            <FormField label="Item (available only)">
              <select style={inputStyle} value={form.SerialNumber} onChange={e => setForm({...form, SerialNumber:e.target.value})}>
                <option value="">Select an item</option>
                {availableItems.map(i => <option key={i.SerialNumber} value={i.SerialNumber}>{i.ItemName} ({i.SerialNumber})</option>)}
              </select>
              {availableItems.length === 0 && <p style={{fontSize:11.5, color:"var(--muted)", marginTop:5}}>No items are currently available.</p>}
            </FormField>
            <FormField label="Expected Back">
              <input type="date" style={inputStyle} value={form.ExpectedBack} onChange={e => setForm({...form, ExpectedBack:e.target.value})} />
            </FormField>
            <FormField label="Deposit Amount (₱)">
              <input type="number" min="0" style={inputStyle} value={form.DepositAmount} onChange={e => setForm({...form, DepositAmount:e.target.value})} placeholder="e.g. 5000" />
            </FormField>
            {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{formError}</p>}
            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? "Saving…" : "Create Rental"}</button>
          </form>
        </Modal>
      )}

      {returningId && (
        <Modal title={`Return RNT-${returningId}`} onClose={() => setReturningId(null)}>
          <form onSubmit={submitReturn}>
            <FormField label="Refund Status">
              <select style={inputStyle} value={refundChoice} onChange={e => setRefundChoice(e.target.value)}>
                <option>Full Refund</option><option>Partial Refund</option><option>Forfeited</option>
              </select>
            </FormField>
            {formError && <p style={{color:"var(--rose)", fontSize:12.5, marginTop:4}}>{formError}</p>}
            <button type="button" style={buttonStyle} disabled={saving} onClick={() => setConfirmReturn(true)}>{saving ? "Saving…" : "Confirm Return"}</button>
          </form>
        </Modal>
      )}
      {confirmReturn && (
        <ConfirmDialog
          title="Mark as Returned"
          message={`Mark rental RNT-${returningId} as returned with refund status: "${refundChoice}"?`}
          confirmLabel="Confirm Return"
          confirmTone="green"
          onConfirm={() => { setConfirmReturn(false); submitReturn({ preventDefault:()=>{} }); }}
          onCancel={() => setConfirmReturn(false)}
        />
      )}
      {confirmArchiveRental && (
        <ConfirmDialog
          title="Archive Rental"
          message={`Archive rental RNT-${confirmArchiveRental}? It will be hidden from the default view but can be restored.`}
          confirmLabel="Archive"
          confirmTone="rose"
          onConfirm={() => { archiveRental(confirmArchiveRental); setConfirmArchiveRental(null); }}
          onCancel={() => setConfirmArchiveRental(null)}
        />
      )}
      {confirmRestoreRental && (
        <ConfirmDialog
          title="Restore Rental"
          message={`Restore rental RNT-${confirmRestoreRental} back to the active view?`}
          confirmLabel="Restore"
          confirmTone="amber"
          onConfirm={() => { restoreRental(confirmRestoreRental); setConfirmRestoreRental(null); }}
          onCancel={() => setConfirmRestoreRental(null)}
        />
      )}
    </>
  );
}

function DepositsPage({ data }) {
  const { deposits } = data;
  const [filter, setFilter] = useState("All");
  const filters = ["All","Held","Full Refund","Partial Refund","Forfeited"];
  const rows = deposits.filter(d => filter === "All" || d.RefundStatus === filter);

  return (
    <>
      <div className="pill-row">
        {filters.map(f => (
          <div key={f} className={`pill ${filter===f ? "on":""}`} onClick={() => setFilter(f)}>{f}</div>
        ))}
      </div>
      <Frame>
        <table>
          <thead><tr><th>Deposit ID</th><th>Linked Rental</th><th>Amount</th><th>Refund Status</th></tr></thead>
          <tbody>
            {rows.map(d => (
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
    </>
  );
}

function CompatibilityPage({ data }) {
  const { inventory } = data;
  const [compat, setCompat]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selCamera, setSelCamera] = useState("");
  const [selLens,   setSelLens]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState(null);
  const [confirmAddCompat, setConfirmAddCompat] = useState(false);
  const [confirmRemoveCompat, setConfirmRemoveCompat] = useState(null);
  const [camFilter, setCamFilter]   = useState("");
  const [lensFilter, setLensFilter] = useState("");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => { setPage(1); }, [camFilter, lensFilter, search]);

  const cameraBodies = inventory.filter(i => i.CategoryName === "Camera Bodies" && !Number(i.Archived));
  const lenses       = inventory.filter(i => i.CategoryName === "Lenses"        && !Number(i.Archived));

  const fetchCompat = () =>
    fetch("compatibility.php").then(r => r.json()).then(setCompat).catch(console.error);

  useEffect(() => { fetchCompat(); }, []);

  function isCompatible(cameraSerial, lensSerial) {
    return compat.some(c => c.CameraSerial === cameraSerial && c.LensSerial === lensSerial);
  }

  function getCompatEntry(cameraSerial, lensSerial) {
    return compat.find(c => c.CameraSerial === cameraSerial && c.LensSerial === lensSerial);
  }

  async function addCompat() {
    if (!selCamera || !selLens) { setErr("Select both a camera and a lens."); return; }
    setSaving(true); setErr(null);
    const res = await fetch("compatibility.php", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"add", CameraSerial:selCamera, LensSerial:selLens, Notes:notes }),
    }).then(r => r.json());
    setSaving(false);
    if (res.success) { fetchCompat(); setShowModal(false); setSelCamera(""); setSelLens(""); setNotes(""); }
    else setErr(res.error || "Failed to add.");
  }

  async function removeCompat(id) {
    await fetch("compatibility.php", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"delete", CompatibilityID: id }),
    });
    fetchCompat();
  }

  const checkIcon = (id) => (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span
        onClick={() => setConfirmRemoveCompat(id)}
        title="Remove"
        style={{fontSize:10, color:"var(--rose)", cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace", opacity:0.7}}
      >✕</span>
    </div>
  );

  const thStyle = { textAlign:"left", fontFamily:"'IBM Plex Mono',monospace", fontSize:10.5, letterSpacing:0.5, color:"var(--muted)", textTransform:"uppercase", fontWeight:500, padding:"12px 16px", borderBottom:"1px solid var(--line)", whiteSpace:"nowrap" };
  const tdStyle = { padding:"13px 16px", borderBottom:"1px solid var(--line)", textAlign:"center", verticalAlign:"middle" };

  return (
    <>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
        <div style={{fontSize:12.5, color:"var(--muted)"}}>Manage camera-lens compatibility. Changes reflect in the customer portal.</div>
        <button onClick={() => setShowModal(true)} style={{...buttonStyle, width:"auto", padding:"9px 18px", marginTop:0}}>
          + Add Compatibility
        </button>
      </div>

      <div style={{display:"flex", gap:10, marginBottom:16, flexWrap:"wrap"}}>
        <input
          placeholder="Search camera or lens…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{...inputStyle, width:220}}
        />
        <select value={camFilter} onChange={e => setCamFilter(e.target.value)} style={{...inputStyle, width:200}}>
          <option value="">All camera bodies</option>
          {cameraBodies.map(c => <option key={c.SerialNumber} value={c.SerialNumber}>{c.ItemName}</option>)}
        </select>
        <select value={lensFilter} onChange={e => setLensFilter(e.target.value)} style={{...inputStyle, width:200}}>
          <option value="">All lenses</option>
          {lenses.map(l => <option key={l.SerialNumber} value={l.SerialNumber}>{l.ItemName}</option>)}
        </select>
      </div>

{(() => {
        const filtered = compat
          .filter(c => (!camFilter || c.CameraSerial === camFilter) && (!lensFilter || c.LensSerial === lensFilter))
          .filter(c => !search || c.CameraName.toLowerCase().includes(search.toLowerCase()) || c.LensName.toLowerCase().includes(search.toLowerCase()));
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
        return (
          <>
            <Frame>
              <table>
                <thead>
                  <tr>
                    <th style={{...thStyle, textAlign:"left"}}>Camera Body</th>
                    <th style={{...thStyle, textAlign:"left"}}>Lens</th>
                    <th style={{...thStyle, textAlign:"left"}}>Notes</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(c => (
                    <tr key={c.CompatibilityID}>
                      <td style={{...tdStyle, textAlign:"left", fontWeight:500, fontSize:13}}>{c.CameraName}</td>
                      <td style={{...tdStyle, textAlign:"left", fontSize:13}}>{c.LensName}</td>
                      <td style={{...tdStyle, textAlign:"left", fontSize:12.5, color:"var(--muted)"}}>{c.Notes || "—"}</td>
                      <td style={tdStyle}>
                        <span onClick={() => setConfirmRemoveCompat(c.CompatibilityID)} style={{fontSize:12, color:"var(--rose)", cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace"}}>Remove</span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} style={{color:"var(--muted)",textAlign:"center",padding:24}}>No compatibility pairs match.</td></tr>
                  )}
                </tbody>
              </table>
            </Frame>
            {filtered.length > 0 && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14}}>
                <span style={{fontSize:12, color:"var(--muted)"}}>
                  Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div style={{display:"flex", gap:8}}>
                  <button disabled={page===1} onClick={() => setPage(p => p-1)} style={{...buttonStyle, width:"auto", padding:"7px 14px", marginTop:0, opacity: page===1?0.4:1, cursor: page===1?"default":"pointer"}}>Prev</button>
                  <span style={{fontSize:12.5, color:"var(--muted)", alignSelf:"center"}}>Page {page} of {totalPages}</span>
                  <button disabled={page===totalPages} onClick={() => setPage(p => p+1)} style={{...buttonStyle, width:"auto", padding:"7px 14px", marginTop:0, opacity: page===totalPages?0.4:1, cursor: page===totalPages?"default":"pointer"}}>Next</button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {showModal && (
        <Modal title="Add Compatibility" width={440} onClose={() => { setShowModal(false); setErr(null); }}>
          <FormField label="Camera Body">
            <SearchableSelect
              value={selCamera}
              onChange={setSelCamera}
              placeholder="— Select camera —"
              options={cameraBodies.map(c => ({ value: c.SerialNumber, label: c.ItemName }))}
            />
          </FormField>
          <FormField label="Lens">
            <SearchableSelect
              value={selLens}
              onChange={setSelLens}
              placeholder="— Select lens —"
              options={lenses.map(l => ({ value: l.SerialNumber, label: l.ItemName }))}
            />
          </FormField>
          <FormField label="Notes (optional)">
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Requires EF adapter" style={inputStyle} />
          </FormField>
          {err && <div style={{color:"var(--rose)", fontSize:12.5, marginBottom:10}}>{err}</div>}
          <button onClick={addCompat} disabled={saving} style={buttonStyle}>{saving ? "Saving…" : "Add Compatibility"}</button>
        </Modal>
      )}
      {confirmAddCompat && (
        <ConfirmDialog
          title="Add Compatibility"
          message={`Mark ${cameraBodies.find(c=>c.SerialNumber===selCamera)?.ItemName || selCamera} as compatible with ${lenses.find(l=>l.SerialNumber===selLens)?.ItemName || selLens}?`}
          confirmLabel="Add Compatibility"
          confirmTone="amber"
          onConfirm={() => { setConfirmAddCompat(false); addCompat(); }}
          onCancel={() => setConfirmAddCompat(false)}
        />
      )}
      {confirmRemoveCompat && (
        <ConfirmDialog
          title="Remove Compatibility"
          message="Remove this camera-lens compatibility pairing? This will update the customer-facing checker immediately."
          confirmLabel="Remove"
          confirmTone="rose"
          onConfirm={() => { removeCompat(confirmRemoveCompat); setConfirmRemoveCompat(null); }}
          onCancel={() => setConfirmRemoveCompat(null)}
        />
      )}
    </>
  );
}

function ReportsPage({ data }) {
  const { rentals, customers, inventory } = data;
  const returned = rentals.filter(r => !!r.ActualReturn);

  // Revenue: sum of deposits for returned rentals (approximation from deposits via rental join)
  // We'll count rental days × use deposit as proxy since we don't have RentalRate in the data
  const totalRentals = rentals.length;
  const avgDuration = returned.length === 0 ? 0 : (
    returned.reduce((sum, r) => {
      const days = Math.max(1, Math.round((new Date(r.ActualReturn) - new Date(r.DateOut)) / 86400000));
      return sum + days;
    }, 0) / returned.length
  ).toFixed(1);
  const totalUnits   = inventory.filter(i => Number(i.Archived) === 0).length;
  const rentedNow    = inventory.filter(i => i.Status === "Rented").length;
  const utilization  = totalUnits === 0 ? 0 : Math.round((rentedNow / totalUnits) * 100);

  // Top rented items
  const itemCounts = {};
  rentals.forEach(r => { itemCounts[r.Item] = (itemCounts[r.Item] || 0) + 1; });
  const topItems = Object.entries(itemCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  // Customer activity
  const custCounts = {};
  rentals.forEach(r => { custCounts[r.Customer] = (custCounts[r.Customer] || 0) + 1; });
  const topCustomers = Object.entries(custCounts).sort((a,b) => b[1]-a[1]).slice(0,6);

  function getInitials(name) {
    return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  }

  const panelStyle = { background:"var(--card)", border:"1px solid var(--line)", borderRadius:14, padding:"20px 22px", flex:1, minWidth:0 };

  return (
    <>
      {/* KPI row */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20}}>
        <div className="stat-card">
          <div className="lab" style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>Total Rentals</div>
          <div className="num" style={{fontSize:28}}>{totalRentals}</div>
          <div className="lab">All time</div>
        </div>
        <div className="stat-card">
          <div className="lab" style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>Avg Rental Duration</div>
          <div className="num" style={{fontSize:28}}>{avgDuration} <span style={{fontSize:16,fontWeight:400}}>days</span></div>
          <div className="lab">Per rental</div>
        </div>
        <div className="stat-card">
          <div className="lab" style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>Equipment Utilization</div>
          <div className="num" style={{fontSize:28}}>{utilization}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
          <div className="lab">Currently rented out</div>
        </div>
      </div>

      {/* Two panels */}
      <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>
        <div style={panelStyle}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, marginBottom:18}}>Top Rented Equipment</div>
          {topItems.length === 0 && <span style={{fontSize:13,color:"var(--muted)"}}>No data yet.</span>}
          {topItems.map(([item, count], i) => (
            <div key={item} style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"var(--muted)", width:20}}>#{i+1}</span>
                <span style={{fontSize:13}}>{item}</span>
              </div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"var(--amber)"}}>{count} rentals</span>
            </div>
          ))}
        </div>

        <div style={panelStyle}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, marginBottom:18}}>Customer Activity</div>
          {topCustomers.length === 0 && <span style={{fontSize:13,color:"var(--muted)"}}>No data yet.</span>}
          {topCustomers.map(([name, count]) => {
            const cust = customers.find(c => c.FullName === name);
            return (
              <div key={name} style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:"var(--amber)",color:"#1A1320",fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {getInitials(name)}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{name}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>C-{String(cust?.CustomerID||'').padStart(3,'0')}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace",color:"var(--amber)",fontWeight:600}}>{count} rentals</div>
                  <Chip tone={cust?.VerificationStatus === "Verified" ? "green" : "amber"} style={{marginTop:2}}>{cust?.VerificationStatus === "Verified" ? "Active" : "Pending"}</Chip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AuditLogsPage({ data }) {
  const { rentals, inventory, customers } = data;
  const [search, setSearch] = useState("");

  // Build synthetic audit log from real data
  const logs = [];
  rentals.forEach(r => {
    logs.push({ action:"Rental Created", detail:`${r.Item} rented to ${r.Customer}`, date: r.DateOut, type:"rental" });
    if (r.ActualReturn) {
      logs.push({ action:"Rental Returned", detail:`${r.Item} returned by ${r.Customer}`, date: r.ActualReturn, type:"rental" });
    }
  });
  inventory.forEach(i => {
    if (Number(i.Archived) === 1) {
      logs.push({ action:"Equipment Archived", detail:`${i.ItemName} (${i.SerialNumber}) archived`, date: null, type:"inventory" });
    }
  });
  customers.forEach(c => {
    if (c.VerificationStatus === "Verified") {
      logs.push({ action:"Customer Verified", detail:`ID verified for ${c.FullName} (C-${String(c.CustomerID).padStart(3,'0')})`, date: null, type:"customer" });
    }
  });

  logs.sort((a,b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const typeMeta = {
    rental:    { color:"#60A5FA", bg:"rgba(96,165,250,0.12)" },
    inventory: { color:"var(--amber)", bg:"rgba(255,180,84,0.12)" },
    customer:  { color:"#A78BFA", bg:"rgba(167,139,250,0.12)" },
    payment:   { color:"var(--green)", bg:"rgba(74,222,128,0.12)" },
    deposit:   { color:"var(--rose)", bg:"rgba(251,113,133,0.12)" },
  };

  const filtered = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12}}>
        <div style={{position:"relative", flex:1, maxWidth:380}}>
          <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"var(--muted)"}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search audit logs…"
            style={{...inputStyle, paddingLeft:36}}
          />
        </div>
        <div className="pill" style={{background:"none", border:"1px solid var(--amber)", color:"var(--amber)", fontWeight:600, cursor:"default", display:"flex", alignItems:"center", gap:6}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Logs
        </div>
      </div>
      <Frame>
        <table>
          <thead>
            <tr>
              <th style={{width:50}}>#</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Timestamp</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{color:"var(--muted)",textAlign:"center",padding:24}}>No logs found.</td></tr>
            )}
            {filtered.map((l, i) => {
              const meta = typeMeta[l.type] || typeMeta.inventory;
              return (
                <tr key={i}>
                  <td className="mono-cell">{String(i+1).padStart(4,"0")}</td>
                  <td style={{fontWeight:600, fontSize:13}}>{l.action}</td>
                  <td style={{fontSize:13, color:"var(--muted)"}}>{l.detail}</td>
                  <td className="mono-cell" style={{whiteSpace:"nowrap"}}>
                    {l.date ? new Date(l.date).toLocaleString("en-US",{month:"short",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                  </td>
                  <td>
                    <span style={{display:"inline-block", padding:"3px 10px", borderRadius:100, fontSize:11.5, fontWeight:600, background:meta.bg, color:meta.color, textTransform:"capitalize"}}>
                      {l.type}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>
    </>
  );
}