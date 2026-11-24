import { Router } from "express";
import { pool } from "../db.js";
const router = Router();

router.get("/categories", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT CategoryID, CategoryName, Description FROM Equipment_Categories");
  res.json(rows);
});

export default router;
