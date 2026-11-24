import { Router } from "express";
const router = Router();

// replaces session_check.php
router.get("/session", (req, res) => {
  res.json({
    role: req.session.role ?? null,
    customerID: req.session.customerID ?? null,
    superAdminID: req.session.superAdminID ?? null,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

export default router;
