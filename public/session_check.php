<?php
session_start();
echo json_encode([
  "role" => $_SESSION['role'] ?? null,
  "customerID" => $_SESSION['customerID'] ?? null,
]);