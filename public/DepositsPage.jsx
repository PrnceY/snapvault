function DepositsPage({ data }) {
  const { deposits } = data;
  return (
    <Frame>
      <table>
        <thead><tr><th>Deposit ID</th><th>Linked Rental</th><th>Amount</th><th>Refund Status</th></tr></thead>
        <tbody>
          {deposits.map(d => (
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
  );
}
