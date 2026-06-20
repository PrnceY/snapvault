const { useState, useEffect } = React;

/* ---------------- Live data fetched from PHP/MariaDB ---------------- */

function useApiData() {
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = () => {
    return Promise.all([
      fetch("get_categories.php").then(r => r.json()),
      fetch("get_inventory.php").then(r => r.json()),
      fetch("get_customers.php").then(r => r.json()),
      fetch("get_rentals.php").then(r => r.json()),
      fetch("get_deposits.php").then(r => r.json()),
    ])
      .then(([cat, inv, cus, ren, dep]) => {
        setCategories(cat);
        setInventory(inv);
        setCustomers(cus);
        setRentals(ren);
        setDeposits(dep);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Could not load data from the server. Check that the PHP endpoints are uploaded and db_connect.php has the right credentials.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { categories, inventory, customers, rentals, deposits, loading, error, refetch: fetchAll };
}

/* ---------------- Small reusable components ---------------- */

function Chip({ tone, children }) {
  return (
    <span className={`chip ${tone}`}>
      <span className="d"></span>{children}
    </span>
  );
}

function statusTone(s) {
  if (s === "Available" || s === "Full Refund" || s === "Done" || s === "Verified" || s === 1 || s === true) return "green";
  if (s === "Rented" || s === "Held" || s === "Partial Refund") return "amber";
  if (s === "Maintenance" || s === "Forfeited" || s === "Overdue") return "rose";
  return "muted";
}

function Frame({ children, style }) {
  return (
    <div className="frame" style={style}>
      <span className="bl"></span><span className="br"></span>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(10,9,13,0.6)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:50,
    }} onClick={onClose}>
      <div
        style={{
          background:"var(--card)", border:"1px solid var(--line)", borderRadius:14,
          padding:"22px 24px", width:380, maxWidth:"90vw",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif", fontSize:16, margin:0}}>{title}</h2>
          <span style={{cursor:"pointer", color:"var(--muted)", fontSize:18}} onClick={onClose}>×</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:"block", fontSize:11.5, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:0.3}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"var(--card-hover)", border:"1px solid var(--line)",
  borderRadius:8, padding:"9px 11px", color:"var(--text)", fontSize:13.5,
  fontFamily:"'Inter',sans-serif", outline:"none",
};

const buttonStyle = {
  width:"100%", padding:"10px", borderRadius:9, border:"none", cursor:"pointer",
  background:"var(--amber)", color:"#1A1320", fontWeight:600, fontSize:13.5, marginTop:6,
};

function ApertureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FFB454" strokeWidth="1.6">
      <polygon points="12,2 19,6.5 19,15.5 12,20 5,15.5 5,6.5" />
      <circle cx="12" cy="11" r="3.2" />
    </svg>
  );
}

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  categories: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="2.5"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6"/></svg>,
  rentals: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>,
  deposits: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="7.5" cy="14.5" r="1"/></svg>,
};

const navItems = [
  { key:"dashboard", label:"Dashboard" },
  { key:"categories", label:"Equipment Categories" },
  { key:"inventory", label:"Inventory" },
  { key:"customers", label:"Customers" },
  { key:"rentals", label:"Rentals" },
  { key:"deposits", label:"Deposits" },
];

const pageMeta = {
  dashboard: { title:"Dashboard", desc:"Today's read on the gear pool" },
  categories: { title:"Equipment Categories", desc:"Camera bodies, lenses, lighting, tripods" },
  inventory: { title:"Inventory", desc:"Serialized units and current condition" },
  customers: { title:"Customers", desc:"Profiles with verified ID and contact data" },
  rentals: { title:"Rentals", desc:"Date out, expected back, actual return" },
  deposits: { title:"Deposits", desc:"Security funds held and refund status" },
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"2-digit" });
}
