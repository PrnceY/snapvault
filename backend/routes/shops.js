import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { requireRole } from "../helpers.js";
const router = Router();

router.use("/shops", requireRole("superadmin"));

router.get("/shops", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.ShopID, s.ShopName, s.Email, s.Active, s.CreatedAt,
            (SELECT COUNT(*) FROM Inventory i WHERE i.ShopID = s.ShopID AND i.Archived = 0) AS UnitCount,
            (SELECT COUNT(*) FROM Customers c WHERE c.ShopID = s.ShopID) AS CustomerCount,
            (SELECT COUNT(*) FROM Rentals r JOIN Customers c2 ON c2.CustomerID = r.CustomerID
              WHERE c2.ShopID = s.ShopID AND r.ActualReturn IS NULL) AS ActiveRentals
     FROM Shop s
     ORDER BY s.CreatedAt DESC`);
  res.json(rows);
});

router.post("/shops", async (req, res) => {
  const { action } = req.body;

  if (action === "add") {
    const shopName = (req.body.ShopName ?? "").trim();
    const email = (req.body.Email ?? "").trim();
    const password = req.body.Password ?? "";
    if (!shopName || !email || !password) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const [dupe] = await pool.query("SELECT ShopID FROM Shop WHERE Email = ?", [email]);
    if (dupe.length) {
      return res.status(409).json({ success: false, error: "A shop with that email already exists." });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO Shop (SuperAdminID, ShopName, Email, PasswordHash, Active) VALUES (?, ?, ?, ?, 1)",
      [req.session.superAdminID, shopName, email, hash]);
    return res.json({ success: true });
  }

  if (action === "activate" || action === "deactivate") {
    await pool.query("UPDATE Shop SET Active = ? WHERE ShopID = ?",
      [action === "activate" ? 1 : 0, parseInt(req.body.ShopID) || 0]);
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, error: "Invalid or missing action." });
});

export default router;
