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
