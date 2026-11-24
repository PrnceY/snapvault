import { useState } from "react";
import "./superadmin-login.css";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pw, loginAs: "superadmin" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Invalid email or password.");
        return;
      }
      window.location.href = "/superadmin";
    } catch (e) {
      setError("Could not reach the server.");
    }
  }

  return (
    <div className="box" onKeyDown={(e) => { if (e.key === "Enter") signIn(); }}>
      <h1>Super Admin</h1>
      <p className="sub">Platform-level access. Not for shop or customer use.</p>
      {error && <div className="err">{error}</div>}
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label>Password</label>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <button onClick={signIn}>Sign In</button>
    </div>
  );
}
