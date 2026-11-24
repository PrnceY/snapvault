import { Router } from "express";
import { pool } from "../db.js";
import { requireRole, parseJson } from "../helpers.js";
const router = Router();

router.get("/customer_data", requireRole("customer"), async (req, res) => {
  const id = req.session.customerID;

  const [[customer]] = await pool.query(
    `SELECT CustomerID, FirstName, MiddleName, LastName,
            CONCAT_WS(' ', FirstName, NULLIF(MiddleName,''), LastName) AS FullName,
            IDType, ContactNumber, IDImagePath, VerificationStatus
     FROM Customers WHERE CustomerID = ?`, [id]);

  const [rentals] = await pool.query(
    `SELECT r.RentalID,
            GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
            GROUP_CONCAT(i.SerialNumber SEPARATOR ', ') AS Serials,
            JSON_ARRAYAGG(JSON_OBJECT('ItemName', i.ItemName, 'SerialNumber', i.SerialNumber)) AS ItemDetails,
            r.DateOut, r.ExpectedBack, r.ActualReturn,
            d.DepositID, d.AmountHeld, d.RefundStatus
     FROM Rentals r
     JOIN Rental_Items ri ON ri.RentalID = r.RentalID
     JOIN Inventory i ON i.InventoryID = ri.InventoryID
     LEFT JOIN Deposits d ON d.RentalID = r.RentalID
     WHERE r.CustomerID = ?
     GROUP BY r.RentalID, r.DateOut, r.ExpectedBack, r.ActualReturn, d.DepositID, d.AmountHeld, d.RefundStatus
     ORDER BY r.DateOut DESC`, [id]);

  const [[{ cnt }]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM Inventory WHERE Status = 'Available' AND Archived = 0");

  res.json({
    customer,
    rentals: rentals.map((r) => ({ ...r, ItemDetails: parseJson(r.ItemDetails) })),
    availableCount: cnt,
  });
});

export default router;
