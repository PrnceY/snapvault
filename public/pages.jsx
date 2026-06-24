function Dashboard({ data, setPage, setRentalFilter }) {
  const { inventory, rentals, deposits, categories } = data;
  const activeRentals = rentals.filter(r => !r.ActualReturn);
  const returned      = rentals.filter(r => !!r.ActualReturn);
  const now           = new Date();
  const overdueList   = activeRentals.filter(r => new Date(r.ExpectedBack) < now);
  const availableUnits = inventory.filter(i => !i.Archived && i.Status === "Available").length;
  const heldTotal     = deposits
    .filter(d => d.RefundStatus === "Held")
    .reduce((a, d) => a + Number(d.AmountHeld), 0);

  // Equipment by category counts
  const catCounts = categories.map(c => ({
    name: c.CategoryName,
    count: inventory.filter(i => i.CategoryName === c.CategoryName && !i.Archived).length,
  }));
  const maxCat = Math.max(...catCounts.map(c => c.count), 1);

  // Rental status breakdown
  const statusBreakdown = [
    { label: "Active",           tone: "green", count: activeRentals.filter(r => new Date(r.ExpectedBack) >= now).length },
    { label: "Overdue",          tone: "rose",  count: overdueList.length },
    { label: "Returned",         tone: "muted", count: returned.length },
  ];

  // Recent activity — derived from latest rentals
  const recentActivity = [...rentals]
    .sort((a, b) => new Date(b.DateOut) - new Date(a.DateOut))
    .slice(0, 4)
    .map(r => ({
      label: r.ActualReturn ? "Rental Returned" : "Rental Created",
      sub:   `${r.Item} · ${r.Customer}`,
      date:  fmtDate(r.ActualReturn || r.DateOut),
      tone:  r.ActualReturn ? "green" : "amber",
    }));

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
            <span style={{fontSize:11,color:"var(--green)",fontFamily:"'IBM Plex Mono',monospace"}}>+{inventory.filter(i=>!i.Archived).length} total</span>
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
            {activeRentals.map(r => {
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
                  <div style={{height:"100%",width:`${(c.count/maxCat)*100}%`,background:"var(--amber)",borderRadius:4,transition:"width .4s"}}></div>
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
              <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:0.5,marginBottom:16,textTransform:"uppercase"}}>Recent Activity</div>
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ SerialNumber:"", CategoryID:"", ItemName:"", ConditionStatus:"Good", Status:"Available", Image:null });
  const [imagePreview, setImagePreview] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const statuses = ["All","Available","Rented","Maintenance","Archived"];
  const categoryOptions = ["All", ...categories.map(c => c.CategoryName)];
  const rows = inventory.filter(i => {
    const isArchived = Number(i.Archived) === 1;
    const matchesCategory = categoryFilter === "All" || i.CategoryName === categoryFilter;
    if (filter === "Archived") return isArchived && matchesCategory;
    if (isArchived) return false;
    return (filter === "All" || i.Status === filter) && matchesCategory;
  });

  const submit = (e) => {
    e.preventDefault();
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
    if (form.Image) body.append("Image", form.Image);

    fetch("inventory.php", { method: "POST", body })
      .then(r => r.json())
      .then(res => {
        setSaving(false);
        if (res.success) {
          setShowForm(false);
          setForm({ SerialNumber:"", CategoryID:"", ItemName:"", ConditionStatus:"Good", Status:"Available", Image:null });
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

  return (
    <>
      <div className="pill-row" style={{justifyContent:"space-between", display:"flex", flexWrap:"wrap", gap:10}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {statuses.map(s => (
            <div key={s} className={`pill ${filter===s ? "on":""}`} onClick={() => setFilter(s)}>{s}</div>
          ))}
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {categoryOptions.map(c => (
            <div key={c} className={`pill ${categoryFilter===c ? "on":""}`} onClick={() => setCategoryFilter(c)}>{c}</div>
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
            {rows.map(i => (
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
                  {Number(i.Archived) === 1 ? (
                    <span
                      style={{fontSize:11.5, color:"var(--amber)", cursor:"pointer", fontWeight:600}}
                      onClick={() => restoreItem(i.SerialNumber)}
                    >
                      Restore
                    </span>
                  ) : i.Status !== "Rented" && (
                    <span
                      style={{fontSize:11.5, color:"var(--rose)", cursor:"pointer", fontWeight:600}}
                      onClick={() => { setDeletingItem(i); setFormError(null); }}
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
        <Modal title="Add Inventory Item" onClose={() => setShowForm(false)}>
          <form onSubmit={submit}>
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
    </>
  );
}

function CustomersPage({ data }) {
  const { customers, refetch } = data;
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ FullName:"", IDType:"School ID", ContactNumber:"", Verified:false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const filters = ["All","Verified","Pending"];
  const rows = customers.filter(c => {
    if (filter === "All") return true;
    return filter === "Verified" ? Number(c.Verified) === 1 : Number(c.Verified) === 0;
  });

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

function RentalsPage({ data, rentalFilter, setRentalFilter }) {
  const { rentals, customers, inventory, refetch } = data;
  const [showForm, setShowForm] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [form, setForm] = useState({ CustomerID:"", SerialNumber:"", ExpectedBack:"", DepositAmount:"" });
  const [refundChoice, setRefundChoice] = useState("Full Refund");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const filters = ["All","On Loan","Returned"];

  const availableItems = inventory.filter(i => i.Status === "Available");
  const rows = rentals.filter(r => {
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
          <thead><tr><th>Rental ID</th><th>Customer</th><th>Item</th><th>Date out</th><th>Expected back</th><th>Actual return</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.RentalID}>
                <td className="mono-cell">RNT-{r.RentalID}</td>
                <td>{r.Customer}</td>
                <td>{r.Item}</td>
                <td className="mono-cell">{fmtDate(r.DateOut)}</td>
                <td className="mono-cell">{fmtDate(r.ExpectedBack)}</td>
                <td className="mono-cell">{r.ActualReturn ? fmtDate(r.ActualReturn) : "—"}</td>
                <td><Chip tone={statusTone(r.ActualReturn ? "Done" : "Rented")}>{r.ActualReturn ? "Returned" : "On loan"}</Chip></td>
                <td>
                  {!r.ActualReturn && (
                    <span
                      style={{fontSize:11.5, color:"var(--amber)", cursor:"pointer", fontWeight:600}}
                      onClick={() => { setReturningId(r.RentalID); setFormError(null); }}
                    >
                      Mark Returned
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
            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? "Saving…" : "Confirm Return"}</button>
          </form>
        </Modal>
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