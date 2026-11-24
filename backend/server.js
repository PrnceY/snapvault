import express from "express";
import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import sessionRoutes from "./routes/session.js";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import inventoryRoutes from "./routes/inventory.js";
import customersRoutes from "./routes/customers.js";
import rentalsRoutes from "./routes/rentals.js";
import depositsRoutes from "./routes/deposits.js";
import compatibilityRoutes from "./routes/compatibility.js";
import cartRoutes from "./routes/cart.js";
import shopsRoutes from "./routes/shops.js";
import customerDataRoutes from "./routes/customerData.js";
import { uploadRoot } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1); // running behind the school web server

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax" },
}));

// uploaded images (item photos, customer IDs)
app.use("/uploads", express.static(uploadRoot()));

app.use("/api", sessionRoutes);
app.use("/api", authRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", customersRoutes);
app.use("/api", rentalsRoutes);
app.use("/api", depositsRoutes);
app.use("/api", compatibilityRoutes);
app.use("/api", cartRoutes);
app.use("/api", shopsRoutes);
app.use("/api", customerDataRoutes);

// Production: serve the built React app (frontend build goes into backend/public)
// and send every non-API URL to index.html so React Router can handle /customer, /dashboard, ...
const PUBLIC_DIR = path.join(__dirname, "public");
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) =>
    res.sendFile(path.join(PUBLIC_DIR, "index.html"))
  );
}

// any error thrown inside a route ends up here as JSON
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`API running on http://localhost:${process.env.PORT}`)
);
