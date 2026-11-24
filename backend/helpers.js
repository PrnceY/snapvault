import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Where uploaded images live. On the school server set UPLOAD_DIR in .env to the
// existing uploads folder so the photos already on the live site keep working.
export const uploadRoot = () => process.env.UPLOAD_DIR || path.join(__dirname, "uploads");

// multer keeps uploads in memory; saveImage() validates and writes them to disk
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const ALLOWED = ["jpg", "jpeg", "png", "webp"];

// returns the relative path (e.g. "uploads/ids/x.png") or throws an Error with .status
export function saveImage(file, subdir, baseName) {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    const err = new Error("Only JPG, PNG, or WEBP images are allowed.");
    err.status = 400;
    throw err;
  }
  const dir = path.join(uploadRoot(), subdir);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${baseName}_${Math.floor(Date.now() / 1000)}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return `uploads/${subdir}/${filename}`;
}

// JSON_ARRAYAGG comes back as a string from MariaDB
export const parseJson = (v) => (typeof v === "string" ? JSON.parse(v) : v);

// replaces: if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'x') { 403 }
export const requireRole = (role) => (req, res, next) => {
  if (req.session.role !== role) {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }
  next();
};

// PHP writes bcrypt hashes as "$2y$...", Node's bcrypt expects "$2b$...".
// They are the same algorithm, so just swap the prefix before comparing.
import bcrypt from "bcrypt";
export const checkPassword = (plain, hash) =>
  bcrypt.compare(plain, (hash ?? "").replace(/^\$2y\$/, "$2b$"));
