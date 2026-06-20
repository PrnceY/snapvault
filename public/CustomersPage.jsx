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
