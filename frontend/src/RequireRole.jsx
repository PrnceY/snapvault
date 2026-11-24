import { useEffect, useState } from "react";

// Replaces the old <script>fetch('session_check.php')...</script> in each HTML page.
// Renders its children only if the logged-in role matches; otherwise sends the visitor to `redirect`.
export default function RequireRole({ role, redirect = "/", children }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.role === role) setOk(true);
        else window.location.replace(redirect);
      })
      .catch(() => window.location.replace(redirect));
  }, [role, redirect]);

  return ok ? children : null;
}
