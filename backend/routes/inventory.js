import { Router } from "express";
import { pool } from "../db.js";
import { upload, saveImage } from "../helpers.js";
const router = Router();

router.get("/inventory", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.InventoryID, i.SerialNumber, i.ItemName, i.Description, i.RentalRate, i.ImagePath,
            i.ConditionStatus, i.Status, i.Archived, c.CategoryName
     FROM Inventory i
     JOIN Equipment_Categories c ON i.CategoryID = c.CategoryID`);
  res.json(rows);
});

// "add" and "edit" arrive as multipart (file upload); "delete" and "restore" as JSON.
// multer ignores JSON requests, so one handler covers both.
router.post("/inventory", upload.single("Image"), async (req, res) => {
  const b = req.body;
  const action = b.action;

  if (action === "add") {
    const serial = b.SerialNumber || null;
    const categoryId = b.CategoryID ? parseInt(b.CategoryID) : null;
    const itemName = b.ItemName || null;
    const description = (b.Description ?? "").trim() || null;
    const rentalRate = b.RentalRate !== undefined ? parseFloat(b.RentalRate) || 0 : 0;
    const condition = b.ConditionStatus ?? "Good";
    const status = b.Status ?? "Available";

    if (!serial || !categoryId || !itemName) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    let imagePath = null;
    if (req.file) imagePath = saveImage(req.file, "inventory", serial.replace(/[^A-Za-z0-9_-]/g, "_"));

    await pool.query(
      `INSERT INTO Inventory (ShopID, SerialNumber, CategoryID, ItemName, Description, RentalRate, ImagePath, ConditionStatus, Status)
       VALUES ((SELECT ShopID FROM Shop LIMIT 1), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [serial, categoryId, itemName, description, rentalRate, imagePath, condition, status]);
    return res.json({ success: true });
  }

  if (action === "delete") {
    if (!b.SerialNumber) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM Rental_Items ri
       JOIN Rentals r ON r.RentalID = ri.RentalID
       JOIN Inventory inv ON inv.InventoryID = ri.InventoryID
       WHERE inv.SerialNumber = ? AND r.ActualReturn IS NULL`, [b.SerialNumber]);
    if (cnt > 0) {
      return res.status(409).json({ success: false, error: "This item is currently out on rental and can't be deleted." });
    }
    await pool.query("UPDATE Inventory SET Archived = 1 WHERE SerialNumber = ?", [b.SerialNumber]);
    return res.json({ success: true });
  }

  if (action === "restore") {
    if (!b.SerialNumber) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    await pool.query("UPDATE Inventory SET Archived = 0 WHERE SerialNumber = ?", [b.SerialNumber]);
    return res.json({ success: true });
  }

  if (action === "edit") {
    const serial = b.SerialNumber;
    if (!serial) {
      return res.status(400).json({ success: false, error: "Missing SerialNumber." });
    }
    const fields = [];
    const vals = [];
    if (b.ItemName !== undefined)        { fields.push("ItemName = ?");        vals.push(b.ItemName); }
    if (b.Description !== undefined)     { fields.push("Description = ?");     vals.push(b.Description.trim() === "" ? null : b.Description.trim()); }
    if (b.RentalRate !== undefined)      { fields.push("RentalRate = ?");      vals.push(parseFloat(b.RentalRate) || 0); }
    if (b.ConditionStatus !== undefined) { fields.push("ConditionStatus = ?"); vals.push(b.ConditionStatus); }
    if (b.Status !== undefined)          { fields.push("Status = ?");          vals.push(b.Status); }
    if (b.CategoryID !== undefined)      { fields.push("CategoryID = ?");      vals.push(parseInt(b.CategoryID)); }
    if (req.file) {
      fields.push("ImagePath = ?");
      vals.push(saveImage(req.file, "inventory", serial.replace(/[^A-Za-z0-9_-]/g, "_")));
    }
    if (fields.length) {
      await pool.query(`UPDATE Inventory SET ${fields.join(", ")} WHERE SerialNumber = ?`, [...vals, serial]);
    }
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, error: "Invalid or missing action." });
});

export default router;
