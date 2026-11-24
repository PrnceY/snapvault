import { Router } from "express";
import { checkPassword } from "../helpers.js";
import { pool } from "../db.js";
const router = Router();

const bad = (res) =>
  res.status(401).json({ success: false, error: "Invalid email or password." });

router.post("/auth", async (req, res) => {
  const email = (req.body.email ?? "").trim();
  const password = req.body.password ?? "";
  const loginAs = req.body.loginAs ?? null;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing credentials." });
  }

  if (loginAs === "customer") {
    const [[customer]] = await pool.query(
      `SELECT CustomerID, CONCAT_WS(' ', FirstName, NULLIF(MiddleName,''), LastName) AS FullName, PasswordHash
       FROM Customers WHERE Email = ?`, [email]);
    if (!customer || !(await checkPassword(password, customer.PasswordHash))) return bad(res);
    req.session.customerID = customer.CustomerID;
    req.session.role = "customer";
    return res.json({ success: true, role: "customer", name: customer.FullName, customerID: customer.CustomerID });
  }

  if (loginAs === "shop") {
    const [[shop]] = await pool.query(
      "SELECT ShopID, PasswordHash, Active FROM Shop WHERE Email = ?", [email]);
    if (!shop || !(await checkPassword(password, shop.PasswordHash))) return bad(res);
    if (Number(shop.Active) === 0) {
      return res.status(403).json({ success: false, error: "This shop account has been deactivated." });
    }
    req.session.shopID = shop.ShopID;
    req.session.role = "shop";
    return res.json({ success: true, role: "shop", name: null });
  }

  if (loginAs === "superadmin") {
    const [[admin]] = await pool.query(
      "SELECT SuperAdminID, PasswordHash FROM Super_Admin WHERE Email = ?", [email]);
    if (!admin || !(await checkPassword(password, admin.PasswordHash))) return bad(res);
    req.session.superAdminID = admin.SuperAdminID;
    req.session.role = "superadmin";
    return res.json({ success: true, role: "superadmin", name: null });
  }

  res.status(400).json({ success: false, error: "Invalid login type." });
});

export default router;
