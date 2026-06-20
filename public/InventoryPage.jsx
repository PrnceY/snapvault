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
