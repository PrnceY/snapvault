import { Router } from "express";
import { pool } from "../db.js";
import { parseJson } from "../helpers.js";
const router = Router();

router.get("/rentals", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.RentalID, r.CustomerID,
            CONCAT_WS(' ', c.FirstName, NULLIF(c.MiddleName,''), c.LastName) AS Customer,
            GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
            JSON_ARRAYAGG(JSON_OBJECT('ItemName', i.ItemName, 'SerialNumber', i.SerialNumber)) AS ItemDetails,
            r.DateOut, r.ExpectedBack, r.ActualReturn, r.Status
     FROM Rentals r
     JOIN Customers c ON r.CustomerID = c.CustomerID
     JOIN Rental_Items ri ON ri.RentalID = r.RentalID
     JOIN Inventory i ON i.InventoryID = ri.InventoryID
     GROUP BY r.RentalID, r.CustomerID, c.FirstName, c.MiddleName, c.LastName, r.DateOut, r.ExpectedBack, r.ActualReturn, r.Status
     ORDER BY r.RentalID DESC`);
  res.json(rows.map((r) => ({ ...r, ItemDetails: parseJson(r.ItemDetails) })));
});

router.post("/rentals", async (req, res) => {
  const b = req.body;

  if (b.action === "create") {
    if (!b.CustomerID || !b.SerialNumber || !b.ExpectedBack) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const customerId = parseInt(b.CustomerID);
    const depositAmount = b.DepositAmount !== undefined ? parseFloat(b.DepositAmount) || 0 : 0;
    const serials = b.SerialNumbers ?? [b.SerialNumber];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query(
        "INSERT INTO Rentals (CustomerID, DateOut, ExpectedBack) VALUES (?, NOW(), ?)",
        [customerId, b.ExpectedBack]);
      const rentalId = ins.insertId;

      for (const serial of serials) {
        const [[item]] = await conn.query(
          "SELECT InventoryID, RentalRate FROM Inventory WHERE SerialNumber = ?", [serial]);
        if (!item) throw new Error(`Item ${serial} not found.`);
        await conn.query(
          "INSERT INTO Rental_Items (RentalID, InventoryID, AgreedRate) VALUES (?, ?, ?)",
          [rentalId, item.InventoryID, item.RentalRate]);
        await conn.query("UPDATE Inventory SET Status = 'Rented' WHERE SerialNumber = ?", [serial]);
      }

      await conn.query(
        "INSERT INTO Deposits (RentalID, AmountHeld, RefundStatus) VALUES (?, ?, 'Held')",
        [rentalId, depositAmount]);
      await conn.commit();
      res.json({ success: true, RentalID: rentalId });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ success: false, error: e.message });
    } finally {
      conn.release();
    }
    return;
  }

  if (b.action === "return") {
    if (!b.RentalID || !b.RefundStatus) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const rentalId = parseInt(b.RentalID);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [items] = await conn.query(
        "SELECT InventoryID FROM Rental_Items WHERE RentalID = ?", [rentalId]);
      if (!items.length) throw new Error("Rental not found.");

      for (const item of items) {
        await conn.query("UPDATE Inventory SET Status = 'Available' WHERE InventoryID = ?", [item.InventoryID]);
      }
      await conn.query("UPDATE Deposits SET RefundStatus = ? WHERE RentalID = ?", [b.RefundStatus, rentalId]);
      await conn.query("UPDATE Rentals SET ActualReturn = NOW(), Status = 'Completed' WHERE RentalID = ?", [rentalId]);
      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ success: false, error: e.message });
    } finally {
      conn.release();
    }
    return;
  }

  res.status(400).json({ success: false, error: "Invalid or missing action." });
});

export default router;
