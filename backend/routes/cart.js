import { Router } from "express";
import { pool } from "../db.js";
import { requireRole } from "../helpers.js";
const router = Router();

router.use("/cart", requireRole("customer"));

router.get("/cart", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.CartID, i.InventoryID, i.SerialNumber, i.ItemName, i.Description, i.RentalRate,
            i.ImagePath, i.ConditionStatus, i.Status, i.Archived, cat.CategoryName
     FROM Cart c
     JOIN Inventory i ON i.InventoryID = c.InventoryID
     JOIN Equipment_Categories cat ON cat.CategoryID = i.CategoryID
     WHERE c.CustomerID = ?
     ORDER BY c.AddedAt DESC`, [req.session.customerID]);
  res.json(rows);
});

router.post("/cart", async (req, res) => {
  const { action, SerialNumber: serial } = req.body;
  const customerId = req.session.customerID;

  if (action === "add") {
    if (!serial) return res.status(400).json({ success: false, error: "Missing SerialNumber." });
    const [[item]] = await pool.query("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?", [serial]);
    if (!item) return res.status(400).json({ success: false, error: "Item not found." });
    await pool.query("INSERT IGNORE INTO Cart (CustomerID, InventoryID) VALUES (?, ?)",
      [customerId, item.InventoryID]);
    return res.json({ success: true });
  }

  if (action === "remove") {
    if (!serial) return res.status(400).json({ success: false, error: "Missing SerialNumber." });
    await pool.query(
      `DELETE c FROM Cart c JOIN Inventory i ON i.InventoryID = c.InventoryID
       WHERE c.CustomerID = ? AND i.SerialNumber = ?`, [customerId, serial]);
    return res.json({ success: true });
  }

  if (action === "clear") {
    await pool.query("DELETE FROM Cart WHERE CustomerID = ?", [customerId]);
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, error: "Invalid or missing action." });
});

export default router;
