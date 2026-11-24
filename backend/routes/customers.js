import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { upload, saveImage, requireRole } from "../helpers.js";
const router = Router();

router.get("/customers", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT CustomerID, FirstName, MiddleName, LastName,
            CONCAT_WS(' ', FirstName, NULLIF(MiddleName,''), LastName) AS FullName,
            IDType, ContactNumber, IDImagePath, VerificationStatus
     FROM Customers
     ORDER BY CustomerID DESC`);
  res.json(rows);
});

const fail = (res, code, error) => res.status(code).json({ success: false, error });

// "upload_id" is multipart; everything else is JSON
router.post("/customers", upload.single("IDImage"), async (req, res) => {
  const b = req.body;
  const action = b.action;

  if (action === "add") {
    if (!b.FirstName || !b.LastName || !b.Email || !b.Password) {
      return fail(res, 400, "Missing required fields.");
    }
    const firstName = b.FirstName.trim();
    const middleName = (b.MiddleName ?? "").trim();
    const lastName = b.LastName.trim();
    const email = b.Email.trim();
    if (!firstName || !lastName) return fail(res, 400, "First name and last name are required.");

    const [dupe] = await pool.query("SELECT CustomerID FROM Customers WHERE Email = ?", [email]);
    if (dupe.length) return fail(res, 409, "An account with that email already exists.");

    const hash = await bcrypt.hash(b.Password, 10);
    await pool.query(
      `INSERT INTO Customers (ShopID, FirstName, MiddleName, LastName, IDType, ContactNumber, Email, PasswordHash)
       VALUES ((SELECT ShopID FROM Shop LIMIT 1), ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, middleName, lastName, b.IDType ?? "", b.ContactNumber ?? "", email, hash]);
    return res.json({ success: true });
  }

  if (action === "edit") {
    if (req.session.role !== "customer") return fail(res, 403, "Unauthorized");
    const firstName = (b.FirstName ?? "").trim();
    const lastName = (b.LastName ?? "").trim();
    if (!firstName || !lastName) return fail(res, 400, "First name and last name are required.");
    await pool.query(
      `UPDATE Customers SET FirstName = ?, MiddleName = ?, LastName = ?, IDType = ?, ContactNumber = ?
       WHERE CustomerID = ?`,
      [firstName, (b.MiddleName ?? "").trim(), lastName, b.IDType ?? "",
       (b.ContactNumber ?? "").trim(), req.session.customerID]);
    return res.json({ success: true });
  }

  if (action === "upload_id") {
    if (req.session.role !== "customer") return fail(res, 403, "Unauthorized");
    if (!req.file) return fail(res, 400, "No ID image was uploaded.");
    const id = req.session.customerID;
    const imagePath = saveImage(req.file, "ids", `cust${id}`);
    await pool.query(
      "UPDATE Customers SET IDImagePath = ?, VerificationStatus = 'Pending' WHERE CustomerID = ?",
      [imagePath, id]);
    return res.json({ success: true, IDImagePath: imagePath });
  }

  if (action === "verify") {
    if (req.session.role !== "superadmin") return fail(res, 403, "Unauthorized");
    await pool.query("UPDATE Customers SET VerificationStatus = 'Verified' WHERE CustomerID = ?",
      [parseInt(b.CustomerID) || 0]);
    return res.json({ success: true });
  }

  if (action === "reject") {
    if (req.session.role !== "superadmin") return fail(res, 403, "Unauthorized");
    await pool.query(
      "UPDATE Customers SET VerificationStatus = 'Unverified', IDImagePath = NULL WHERE CustomerID = ?",
      [parseInt(b.CustomerID) || 0]);
    return res.json({ success: true });
  }

  fail(res, 400, "Invalid or missing action.");
});

export default router;
