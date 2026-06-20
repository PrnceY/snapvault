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