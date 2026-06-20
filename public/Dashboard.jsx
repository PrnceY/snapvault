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
