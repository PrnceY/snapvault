const { useState, useEffect, useRef } = React;

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
      fetch("categories.php").then(r => r.json()),
      fetch("inventory.php").then(r => r.json()),
      fetch("customers.php").then(r => r.json()),
      fetch("rentals.php").then(r => r.json()),
      fetch("deposits.php").then(r => r.json()),
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

function Modal({ title, onClose, children, width }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(10,9,13,0.6)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:50,
    }} onClick={onClose}>
      <div
        style={{
          background:"var(--card)", border:"1px solid var(--line)", borderRadius:14,
          padding:"22px 24px", width: width || 380, maxWidth:"90vw",
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

function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);
  const brands = [...new Set(options.map(o => o.label.split(" ")[0]))].sort();
  const filtered = options
    .filter(o => !brand || o.label.split(" ")[0] === brand)
    .filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={boxRef} style={{position:"relative"}}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{...inputStyle, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}
      >
        <span style={{color: selected ? "var(--text)" : "var(--muted)"}}>{selected ? selected.label : (placeholder || "— Select —")}</span>
        <span style={{color:"var(--muted)", fontSize:11}}>▾</span>
      </div>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:10,
          background:"var(--card)", border:"1px solid var(--line)", borderRadius:8,
          maxHeight:320, overflowY:"auto", boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{display:"flex", borderBottom:"1px solid var(--line)"}}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              style={{...inputStyle, flex:1, borderRadius:0, border:"none"}}
            />
            <select
              value={brand}
              onChange={e => setBrand(e.target.value)}
              style={{...inputStyle, width:130, borderRadius:0, border:"none", borderLeft:"1px solid var(--line)"}}
            >
              <option value="">All brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div
            onClick={() => { onChange(""); setOpen(false); setQuery(""); setBrand(""); }}
            style={{padding:"9px 11px", fontSize:13, color:"var(--muted)", cursor:"pointer"}}
          >{placeholder || "— Select —"}</div>
          {filtered.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
              style={{padding:"9px 11px", fontSize:13, cursor:"pointer", background: o.value===value ? "var(--card-hover)" : "transparent"}}
              onMouseEnter={e => e.currentTarget.style.background = "var(--card-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = o.value===value ? "var(--card-hover)" : "transparent"}
            >{o.label}</div>
          ))}
          {filtered.length === 0 && (
            <div style={{padding:"9px 11px", fontSize:12.5, color:"var(--muted)"}}>No matches.</div>
          )}
        </div>
      )}
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
  dashboard:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  categories:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>,
  inventory:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="2.5"/></svg>,
  customers:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-3.8 4-6 7.5-6s6.5 2.2 7.5 6"/></svg>,
  rentals:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>,
  deposits:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="7.5" cy="14.5" r="1"/></svg>,
  compatibility:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  reports:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  auditlogs:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

const navItems = [
  { key:"dashboard",     label:"Dashboard" },
  { key:"categories",    label:"Equipment Categories" },
  { key:"inventory",     label:"Inventory" },
  { key:"customers",     label:"Customers" },
  { key:"rentals",       label:"Rentals" },
  { key:"deposits",      label:"Deposits" },
  { key:"compatibility", label:"Compatibility" },
  { key:"reports",       label:"Reports" },
  { key:"auditlogs",     label:"Audit Logs" },
];

const pageMeta = {
  dashboard:     { title:"Dashboard" },
  categories:    { title:"Equipment Categories" },
  inventory:     { title:"Inventory" },
  customers:     { title:"Customers" },
  rentals:       { title:"Rentals" },
  deposits:      { title:"Deposits" },
  compatibility: { title:"Compatibility" },
  reports:       { title:"Reports" },
  auditlogs:     { title:"Audit Logs" },
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"2-digit" });
}

function ConfirmDialog({ title, message, confirmLabel, confirmTone, onConfirm, onCancel, children }) {
  const btnColor = confirmTone === "rose" ? "var(--rose)" : confirmTone === "green" ? "var(--green)" : "var(--amber)";
  const btnText  = confirmTone === "rose" ? "#fff" : "#1A1320";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,9,13,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60}} onClick={onCancel}>
      <div style={{background:"var(--card)",border:"1px solid var(--line)",borderRadius:16,padding:"26px 28px",width:360,maxWidth:"90vw",boxShadow:"0 8px 40px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${btnColor}1a`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {confirmTone === "rose"
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btnColor} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btnColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            }
          </div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16}}>{title}</div>
          </div>
        </div>
        <p style={{fontSize:13.5,color:"var(--muted)",lineHeight:1.6,marginBottom:16}}>{message}</p>
        {children}
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid var(--line)",background:"var(--card-hover)",color:"var(--text)",fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:btnColor,color:btnText,fontSize:13.5,fontWeight:700,cursor:"pointer"}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}