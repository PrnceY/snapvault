import { Router } from "express";
import { pool } from "../db.js";
const router = Router();

router.get("/deposits", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.DepositID, d.RentalID,
            CONCAT_WS(' ', c.FirstName, NULLIF(c.MiddleName,''), c.LastName) AS Customer,
            GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
            d.AmountHeld, d.RefundStatus
     FROM Deposits d
     JOIN Rentals r ON r.RentalID = d.RentalID
     JOIN Customers c ON c.CustomerID = r.CustomerID
     JOIN Rental_Items ri ON ri.RentalID = r.RentalID
     JOIN Inventory i ON i.InventoryID = ri.InventoryID
     GROUP BY d.DepositID, d.RentalID, c.FirstName, c.MiddleName, c.LastName, d.AmountHeld, d.RefundStatus
     ORDER BY d.DepositID DESC`);
  res.json(rows);
});

export default router;
