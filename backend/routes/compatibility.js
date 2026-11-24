import { Router } from "express";
import { pool } from "../db.js";
const router = Router();

router.get("/compatibility", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ec.CompatibilityID, cam.SerialNumber AS CameraSerial, lens.SerialNumber AS LensSerial,
            cam.ItemName AS CameraName, lens.ItemName AS LensName, ec.CompatibilityType, ec.Notes
     FROM Equipment_Compatibility ec
     JOIN Inventory cam  ON cam.InventoryID  = ec.EquipmentID_A
     JOIN Inventory lens ON lens.InventoryID = ec.EquipmentID_B`);
  res.json(rows);
});

router.post("/compatibility", async (req, res) => {
  const { action } = req.body;

  if (action === "add") {
    const { CameraSerial: cam, LensSerial: lens } = req.body;
    if (!cam || !lens) {
      return res.status(400).json({ success: false, error: "Missing serials." });
    }
    const notes = req.body.Notes ?? null;
    const type = req.body.CompatibilityType ?? "Camera-Lens";

    const [[c]] = await pool.query("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?", [cam]);
    const [[l]] = await pool.query("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?", [lens]);
    if (!c || !l) {
      return res.status(400).json({ success: false, error: "One or both serials were not found." });
    }
    await pool.query(
      "INSERT INTO Equipment_Compatibility (EquipmentID_A, EquipmentID_B, CompatibilityType, Notes) VALUES (?, ?, ?, ?)",
      [c.InventoryID, l.InventoryID, type, notes]);
    return res.json({ success: true });
  }

  if (action === "delete") {
    await pool.query("DELETE FROM Equipment_Compatibility WHERE CompatibilityID = ?",
      [parseInt(req.body.CompatibilityID) || 0]);
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, error: "Invalid action." });
});

export default router;
