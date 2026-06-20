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
    fetch("create_rental.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    fetch("return_rental.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RentalID: returningId, RefundStatus: refundChoice }),
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
